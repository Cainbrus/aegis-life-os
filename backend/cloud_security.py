"""Reviewed V1 security subset; no legacy server, AI, payment or email imports.

Extracted from routes/security_engine.py. Auth/session helpers preserve reviewed
semantics. Recovery trigger records server state only; email dispatch removed.
Each router closes over its own injected database.
"""
import uuid
import secrets as _secrets
import hashlib
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field


def build_router(db):
    router = APIRouter(prefix="/api/security")
    def _hash_secret(s: str) -> str:
        return bcrypt.hashpw(s.encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')

    def _verify_secret(plain: str, hashed: Optional[str]) -> bool:
        if not plain or not hashed:
            return False
        try:
            return bcrypt.checkpw(plain.encode('utf-8')[:72], hashed.encode('utf-8'))
        except (ValueError, TypeError):
            return False

    async def _get_config(device_id: str) -> Optional[dict]:
        return await db.device_config.find_one({'device_id': device_id}, {'_id': 0})

    async def _verify_recovery(device_id: str, code: Optional[str]) -> bool:
        cfg = await _get_config(device_id)
        return bool(cfg and cfg.get('configured') and _verify_secret(code, cfg.get('recovery_hash')))

    SESSION_TTL_HOURS = 24

    async def _issue_session(device_id: str, profile: dict) -> str:
        token = _secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        await db.sessions.insert_one({'token': token, 'device_id': device_id, 'profile_id': profile['id'], 'role': profile['role'], 'credential_version': profile['access_hash'], 'created_at': now.isoformat(), 'expires_at': (now + timedelta(hours=SESSION_TTL_HOURS)).isoformat()})
        await db.sessions.delete_many({'device_id': device_id, 'expires_at': {'$lt': now.isoformat()}})
        return token

    async def _session_identity(token: Optional[str]) -> Optional[dict]:
        if not token:
            return None
        session = await db.sessions.find_one({'token': token}, {'_id': 0})
        if not session:
            return None
        try:
            if datetime.fromisoformat(session['expires_at']) <= datetime.now(timezone.utc):
                return None
        except (ValueError, TypeError, KeyError):
            return None
        cfg = await _get_config(session.get('device_id'))
        if not cfg or not cfg.get('configured'):
            return None
        profile = next((p for p in cfg.get('profiles', []) if p.get('id') == session.get('profile_id')), None)
        if not profile or session.get('role') not in {'owner', 'trusted', 'limited', 'guest'}:
            return None
        if profile.get('role') != session.get('role') or profile.get('access_hash') != session.get('credential_version'):
            return None
        return session

    async def _require_session(device_id: str, token: Optional[str], roles=('owner', 'trusted')) -> dict:
        session = await _session_identity(token)
        if not session or session.get('device_id') != device_id:
            raise HTTPException(status_code=401, detail='Verified session required')
        if session.get('role') not in roles:
            raise HTTPException(status_code=403, detail='Profile is not authorized for this action')
        return session

    class NativeSessionIn(BaseModel):
        device_id: str

    @router.post('/session/native')
    async def issue_native_session(req: NativeSessionIn, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        parent = await _require_session(req.device_id, x_dm_token)
        token = _secrets.token_urlsafe(32)
        expires = min(datetime.fromisoformat(parent['expires_at']), datetime.now(timezone.utc) + timedelta(minutes=15))
        await db.native_sessions.insert_one({'token_hash': hashlib.sha256(token.encode()).hexdigest(), 'parent_token': x_dm_token, 'device_id': req.device_id, 'scope': 'location:write', 'created_at': datetime.now(timezone.utc).isoformat(), 'expires_at': expires.isoformat()})
        return {'token': token, 'expires_at': int(expires.timestamp() * 1000), 'scope': 'location:write'}

    @router.post('/session/revoke')
    async def revoke_session(req: NativeSessionIn, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(req.device_id, x_dm_token, roles=('owner', 'trusted', 'limited', 'guest'))
        await db.native_sessions.delete_many({'parent_token': x_dm_token})
        await db.sessions.delete_many({'token': x_dm_token})
        return {'ok': True, 'revoked': True}

    @router.post('/session/revoke-device')
    async def revoke_device_sessions(req: NativeSessionIn, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(req.device_id, x_dm_token, roles=('owner',))
        await db.native_sessions.delete_many({'device_id': req.device_id})
        await db.sessions.delete_many({'device_id': req.device_id})
        return {'ok': True, 'revoked': True}

    class RevocationTicketIn(BaseModel):
        device_id: str

    @router.post('/session/revocation-ticket')
    async def issue_revocation_ticket(req: RevocationTicketIn, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(req.device_id, x_dm_token, roles=('owner',))
        token = _secrets.token_urlsafe(32)
        await db.revocation_tickets.insert_one({'token_hash': hashlib.sha256(token.encode()).hexdigest(), 'device_id': req.device_id, 'scope': 'sessions:revoke', 'completed': False, 'cutoff': None})
        return {'token': token, 'scope': 'sessions:revoke'}

    @router.post('/session/revoke-ticket')
    async def consume_revocation_ticket(req: RevocationTicketIn, x_dm_revocation: Optional[str]=Header(default=None, alias='X-DM-Revocation')):
        query = {'token_hash': hashlib.sha256((x_dm_revocation or '').encode()).hexdigest(), 'device_id': req.device_id, 'scope': 'sessions:revoke'}
        ticket = await db.revocation_tickets.find_one(query)
        if not ticket:
            raise HTTPException(status_code=401, detail='Revocation capability required')
        if ticket.get('completed'):
            return {'ok': True, 'revoked': True}
        await db.revocation_tickets.update_one({**query, 'cutoff': None}, {'$set': {'cutoff': datetime.now(timezone.utc).isoformat()}})
        ticket = await db.revocation_tickets.find_one(query)
        await db.sessions.delete_many({'device_id': req.device_id, 'created_at': {'$lte': ticket['cutoff']}})
        await db.native_sessions.delete_many({'device_id': req.device_id, 'created_at': {'$lte': ticket['cutoff']}})
        await db.revocation_tickets.update_one(query, {'$set': {'completed': True}})
        return {'ok': True, 'revoked': True}

    async def _require_location_session(device_id: str, token: Optional[str]):
        native = await db.native_sessions.find_one({'token_hash': hashlib.sha256((token or '').encode()).hexdigest()})
        if native:
            try:
                valid = native.get('scope') == 'location:write' and native.get('device_id') == device_id and (datetime.fromisoformat(native['expires_at']) > datetime.now(timezone.utc))
            except (KeyError, ValueError, TypeError):
                valid = False
            if not valid:
                raise HTTPException(status_code=401, detail='Native capability expired or invalid')
            return await _require_session(device_id, native.get('parent_token'))
        return await _require_session(device_id, token)

    async def _verify_wipe(device_id: str, code: Optional[str]) -> bool:
        cfg = await _get_config(device_id)
        if not (cfg and cfg.get('configured')):
            return False
        if cfg.get('wipe_hash'):
            return _verify_secret(code, cfg.get('wipe_hash'))
        return _verify_secret(code, cfg.get('recovery_hash'))

    async def _verify_access(device_id: str, code: Optional[str]) -> Optional[dict]:
        """Return the matching owner profile {name, role} if the access code is valid, else None."""
        cfg = await _get_config(device_id)
        if not (cfg and cfg.get('configured')):
            return None
        for p in cfg.get('profiles', []):
            if _verify_secret(code, p.get('access_hash')):
                return {'id': p.get('id'), 'access_hash': p.get('access_hash'), 'name': p.get('name', 'Owner'), 'role': p.get('role', 'guest')}
        return None

    class SetupIn(BaseModel):
        device_id: str
        owner_name: str = 'Owner'
        access_code: str
        recovery_code: str
        wipe_code: str = ''
        recovery_phrase: str = ''
        panic_pattern: str = ''
        recovery_email: str = ''
        backup_email: str = ''
        trusted_numbers: List[str] = Field(default_factory=list)
        backup_numbers: List[str] = Field(default_factory=list)
        cover_app: str = 'calculator'
        call_trigger_count: int = 3
        call_trigger_window_sec: int = 300

    class ProfileIn(BaseModel):
        device_id: str
        name: str
        access_code: str
        role: str = 'trusted'
        recovery_code: str

    class ProfileRemoveIn(BaseModel):
        device_id: str
        profile_id: str
        recovery_code: str

    class TriggerIn(BaseModel):
        device_id: str
        secret: str
        lat: Optional[float] = None
        lng: Optional[float] = None

    class CodeIn(BaseModel):
        device_id: str
        code: str

    class EventIn(BaseModel):
        device_id: str
        type: str
        severity: str = 'info'
        title: str
        detail: str = ''
        metadata: Dict[str, Any] = Field(default_factory=dict)
        lat: Optional[float] = None
        lng: Optional[float] = None

    class RecoveryAction(BaseModel):
        device_id: str
        owner_code: Optional[str] = None
        confirm: bool = False
        lat: Optional[float] = None
        lng: Optional[float] = None

    def _now():
        return datetime.now(timezone.utc).isoformat()

    async def _log_event(device_id: str, type_: str, severity: str, title: str, detail: str='', metadata: Optional[dict]=None, lat: Optional[float]=None, lng: Optional[float]=None):
        evt = {'id': str(uuid.uuid4()), 'device_id': device_id, 'type': type_, 'severity': severity, 'title': title, 'detail': detail, 'metadata': metadata or {}, 'lat': lat, 'lng': lng, 'created_at': _now()}
        await db.security_events.insert_one(evt)
        evt.pop('_id', None)
        return evt

    async def _create_alert(device_id: str, title: str, body: str, level: int=3):
        alert = {'id': str(uuid.uuid4()), 'device_id': device_id, 'title': title, 'body': body, 'level': level, 'read': False, 'created_at': _now()}
        await db.owner_alerts.insert_one(alert)
        alert.pop('_id', None)
        return alert

    COVER_APPS = {'calculator', 'clock', 'notes'}

    @router.get('/setup/status')
    async def setup_status(device_id: str, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        cfg = await _get_config(device_id)
        out = {'configured': bool(cfg and cfg.get('configured')), 'cover_app': (cfg or {}).get('cover_app', 'calculator')}
        identity = await _session_identity(x_dm_token)
        if identity and identity.get('device_id') == device_id and (identity.get('role') in {'owner', 'trusted'}):
            out.update({'profiles': [p.get('name') for p in (cfg or {}).get('profiles', [])], 'trusted_numbers': (cfg or {}).get('trusted_numbers', []), 'backup_numbers': (cfg or {}).get('backup_numbers', []), 'has_email': bool((cfg or {}).get('recovery_email'))})
        return out

    @router.post('/setup')
    async def setup(req: SetupIn, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await db.device_config.create_index('device_id', unique=True)
        existing = await _get_config(req.device_id)
        if existing and existing.get('configured'):
            await _require_session(req.device_id, x_dm_token, roles=('owner',))
        if len(req.access_code) < 4:
            raise HTTPException(status_code=400, detail='Access code must be at least 4 characters')
        if len(req.recovery_code) < 4:
            raise HTTPException(status_code=400, detail='Recovery code must be at least 4 characters')
        if req.access_code == req.recovery_code:
            raise HTTPException(status_code=400, detail='Access and Recovery codes must be different')
        if req.wipe_code and (len(req.wipe_code) < 4 or req.wipe_code in {req.access_code, req.recovery_code}):
            raise HTTPException(status_code=400, detail='Wipe code must be at least 4 characters and unique')
        cover = req.cover_app if req.cover_app in COVER_APPS else 'calculator'
        if cover in {'calculator', 'clock'} and (not (req.access_code.isascii() and req.access_code.isdigit() and req.recovery_code.isascii() and req.recovery_code.isdigit())):
            raise HTTPException(status_code=400, detail='Numeric covers require numeric access and recovery codes')
        numbers = [n.strip() for n in req.trusted_numbers if n and n.strip()]
        doc = {'device_id': req.device_id, 'configured': True, 'cover_app': cover, 'recovery_hash': _hash_secret(req.recovery_code), 'wipe_hash': _hash_secret(req.wipe_code) if req.wipe_code else None, 'recovery_phrase_hash': _hash_secret(req.recovery_phrase.strip().lower()) if req.recovery_phrase.strip() else None, 'panic_pattern_hash': _hash_secret(req.panic_pattern) if req.panic_pattern else None, 'recovery_email': req.recovery_email.strip(), 'backup_email': req.backup_email.strip(), 'trusted_numbers': numbers, 'backup_numbers': [n.strip() for n in req.backup_numbers if n and n.strip()], 'call_trigger_count': max(1, min(10, req.call_trigger_count)), 'call_trigger_window_sec': max(30, min(1800, req.call_trigger_window_sec)), 'profiles': [{'id': str(uuid.uuid4()), 'name': req.owner_name or 'Owner', 'role': 'owner', 'access_hash': _hash_secret(req.access_code), 'created_at': _now()}], 'updated_at': _now()}
        if existing and existing.get('configured'):
            await db.device_config.update_one({'device_id': req.device_id}, {'$set': doc})
            await db.sessions.delete_many({'device_id': req.device_id})
        else:
            try:
                await db.device_config.insert_one(doc)
            except Exception as exc:
                if getattr(exc, 'code', None) == 11000:
                    raise HTTPException(status_code=409, detail='Device is already configured; unlock first')
                raise
        await _log_event(req.device_id, 'recovery', 'info', 'Security setup completed', 'Owner configured access & recovery codes and cover app.')
        return {'ok': True, 'configured': True, 'cover_app': cover}

    async def _profiles_payload(device_id: str):
        cfg = await _get_config(device_id)
        profiles = [{'id': p.get('id'), 'name': p.get('name'), 'role': p.get('role', 'trusted')} for p in (cfg or {}).get('profiles', [])]
        return {'profiles': profiles}

    @router.get('/profiles')
    async def list_profiles(device_id: str, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(device_id, x_dm_token, roles=('owner',))
        return await _profiles_payload(device_id)

    @router.post('/profiles/add')
    async def add_profile(req: ProfileIn, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(req.device_id, x_dm_token, roles=('owner',))
        'Add a trusted family profile (requires the device recovery code).'
        if not await _verify_recovery(req.device_id, req.recovery_code):
            raise HTTPException(status_code=403, detail='Recovery code required to add a profile')
        if len(req.access_code) < 4:
            raise HTTPException(status_code=400, detail='Access code must be at least 4 characters')
        if await _verify_recovery(req.device_id, req.access_code) or await _verify_wipe(req.device_id, req.access_code):
            raise HTTPException(status_code=400, detail='Access code cannot match the Recovery or Wipe code')
        if await _verify_access(req.device_id, req.access_code) is not None:
            raise HTTPException(status_code=409, detail='That access code is already used by another profile')
        cfg = await _get_config(req.device_id)
        if (cfg or {}).get('cover_app') in {'calculator', 'clock'} and (not (req.access_code.isascii() and req.access_code.isdigit())):
            raise HTTPException(status_code=400, detail='This cover requires numeric profile codes')
        if req.role not in {'trusted', 'limited', 'guest'}:
            raise HTTPException(status_code=400, detail='Invalid additional profile role')
        role = req.role
        await db.device_config.update_one({'device_id': req.device_id}, {'$push': {'profiles': {'id': str(uuid.uuid4()), 'name': req.name or 'Member', 'role': role, 'access_hash': _hash_secret(req.access_code), 'created_at': _now()}}})
        return await _profiles_payload(req.device_id)

    @router.post('/profiles/remove')
    async def remove_profile(req: ProfileRemoveIn, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(req.device_id, x_dm_token, roles=('owner',))
        'Remove a family profile (requires the device recovery code). Cannot remove the owner.'
        if not await _verify_recovery(req.device_id, req.recovery_code):
            raise HTTPException(status_code=403, detail='Recovery code required')
        cfg = await _get_config(req.device_id)
        target = next((p for p in (cfg or {}).get('profiles', []) if p.get('id') == req.profile_id), None)
        if target and target.get('role') == 'owner':
            raise HTTPException(status_code=400, detail='Cannot remove the owner profile')
        await db.device_config.update_one({'device_id': req.device_id}, {'$pull': {'profiles': {'id': req.profile_id}}})
        return await _profiles_payload(req.device_id)

    @router.post('/verify-access')
    async def verify_access_code(req: CodeIn):
        """Unlock the dashboard from the cover app with an owner's access code.
        On success, issues a session token (X-DM-Token) required by sensitive endpoints."""
        match = await _verify_access(req.device_id, req.code)
        token = None
        if match is not None:
            token = await _issue_session(req.device_id, match)
            await db.device_state.update_one({'device_id': req.device_id}, {'$set': {'device_id': req.device_id, 'last_owner': match['name'], 'last_role': match['role'], 'last_unlocked_at': _now()}}, upsert=True)
        return {'verified': match is not None, 'profile': match['name'] if match else None, 'role': match['role'] if match else None, 'token': token}

    @router.post('/verify-recovery')
    async def verify_recovery_code(req: CodeIn):
        ok = await _verify_recovery(req.device_id, req.code)
        return {'verified': ok}

    @router.post('/events')
    async def add_event(evt: EventIn, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(evt.device_id, x_dm_token)
        return await _log_event(evt.device_id, evt.type, evt.severity, evt.title, evt.detail, evt.metadata, evt.lat, evt.lng)

    @router.get('/events')
    async def list_events(device_id: str, limit: int=100, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(device_id, x_dm_token)
        cursor = db.security_events.find({'device_id': device_id}, {'_id': 0}).sort('created_at', -1).limit(limit)
        events = await cursor.to_list(length=limit)
        return {'events': events, 'count': len(events)}

    @router.get('/alerts')
    async def list_alerts(device_id: str, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(device_id, x_dm_token)
        cur = db.owner_alerts.find({'device_id': device_id}, {'_id': 0}).sort('created_at', -1).limit(50)
        alerts = await cur.to_list(length=50)
        return {'alerts': alerts, 'count': len(alerts), 'unread': sum((1 for a in alerts if not a.get('read')))}

    @router.post('/recovery/locate')
    async def recovery_locate(req: RecoveryAction, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_location_session(req.device_id, x_dm_token)
        'Device self-reports its current location for tracking.'
        if req.lat is None or req.lng is None:
            raise HTTPException(status_code=400, detail='lat/lng required')
        loc = {'lat': req.lat, 'lng': req.lng, 'at': _now()}
        await db.device_state.update_one({'device_id': req.device_id}, {'$set': {'last_location': loc, 'device_id': req.device_id}, '$push': {'location_history': {'$each': [loc], '$slice': -50}}}, upsert=True)
        await _log_event(req.device_id, 'location', 'info', 'Location reported', f'{req.lat:.5f}, {req.lng:.5f}', lat=req.lat, lng=req.lng)
        return {'ok': True, 'location': loc}

    @router.get('/recovery/location')
    async def recovery_location(device_id: str, x_dm_token: Optional[str]=Header(default=None, alias='X-DM-Token')):
        await _require_session(device_id, x_dm_token)
        state = await db.device_state.find_one({'device_id': device_id}, {'_id': 0}) or {}
        return {'last_location': state.get('last_location'), 'history': state.get('location_history', []), 'lost_mode': bool(state.get('lost_mode', False))}

    @router.post('/recovery/trigger')
    async def recovery_trigger(req: TriggerIn):
        """Activate recovery via the owner's secret recovery PHRASE, PANIC PATTERN or RECOVERY code.
        Designed so future native triggers (trusted-number SMS, secret dial code) can call the same path."""
        cfg = await _get_config(req.device_id)
        if not (cfg and cfg.get('configured')):
            raise HTTPException(status_code=404, detail='Device not configured')
        s = req.secret or ''
        via = None
        if _verify_secret(s.strip().lower(), cfg.get('recovery_phrase_hash')):
            via = 'phrase'
        elif cfg.get('panic_pattern_hash') and _verify_secret(s, cfg.get('panic_pattern_hash')):
            via = 'pattern'
        elif _verify_secret(s, cfg.get('recovery_hash')):
            via = 'code'
        if not via:
            return {'triggered': False}
        await db.device_state.update_one({'device_id': req.device_id}, {'$set': {'locked': True, 'lost_mode': True, 'trap_level': 3, 'trap_active': False, 'panic_at': _now(), 'device_id': req.device_id}}, upsert=True)
        if req.lat is not None and req.lng is not None:
            loc = {'lat': req.lat, 'lng': req.lng, 'at': _now()}
            await db.device_state.update_one({'device_id': req.device_id}, {'$set': {'last_location': loc}, '$push': {'location_history': {'$each': [loc], '$slice': -50}}})
        await _log_event(req.device_id, 'recovery', 'critical', f'Recovery triggered ({via})', 'Owner activated Lost Phone mode via secret trigger. Server recovery state saved; device tracking unconfirmed.', lat=req.lat, lng=req.lng)
        await _create_alert(req.device_id, 'Recovery activated', f'Lost Phone mode was triggered via your secret {via}. Device lock and live tracking require device confirmation.')
        return {'triggered': True, 'via': via}
    return router
