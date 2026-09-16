"""Staging-only server authority. No live provider or credential loading.

Mongo single-document CAS is the reservation linearization point. Revocation
prevents later reservations/results; an already dispatched call cannot be unsent.
"""
import asyncio
import copy
import hashlib
import re
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, StrictBool, StrictInt, Field
from pymongo.write_concern import WriteConcern
from ai_provider import owner_provider_config

_config=owner_provider_config()
CONSENT_POLICY=f"layout-only-v1:{_config.provider}:{_config.primary_model}:{_config.fallback_model}"


def now(): return datetime.now(timezone.utc).isoformat()
def reduced(reason): return {'mode':'reduced','reason':reason,'suggestion':'Local help remains available. Choose your preferred layout in Settings.'}

class MongoAiLedger:
    def __init__(self,db): self.collection=db.ai_controls.with_options(write_concern=WriteConcern(w='majority',wtimeout=3000))
    @staticmethod
    def initial(identity):
        return {'_id':identity,'revision':0,'consent_version':0,'enrolled':False,'consent':False,'consent_policy':None,'limit':10,'calls':0,'tokens':0,'cost_micros':0,'audit':[]}
    async def read(self,identity):
        await asyncio.wait_for(self.collection.update_one({'_id':identity},{'$setOnInsert':self.initial(identity)},upsert=True),5)
        return await asyncio.wait_for(self.collection.find_one({'_id':identity}),5)
    async def cas(self,identity,before,after):
        result=await asyncio.wait_for(self.collection.replace_one({'_id':identity,'revision':before['revision']},after),5)
        return result.matched_count==1


    async def set_enrollment(self,identity,enabled):
        """Trusted server operator only; deliberately no HTTP/native route.

        Do not edit enrollment fields independently: revision/generation must
        change atomically so concurrent requests cannot restore old authority.
        """
        if type(enabled) is not bool or not re.fullmatch('[0-9a-f]{64}',identity):
            raise ValueError('Invalid enrollment selection')
        for _ in range(32):
            before=CloudAiBroker.checked(await self.read(identity)); after=copy.deepcopy(before)
            after.update(enrolled=enabled,consent=False,consent_policy=None,consent_version=before['consent_version']+1)
            CloudAiBroker.event(after,'operator_enrolled' if enabled else 'operator_revoked')
            if await self.cas(identity,before,after): return
        raise RuntimeError('Enrollment changed; retry')

class CloudAiBroker:
    def __init__(self,ledger,authorize,provider=None):
        self.ledger=ledger; self.authorize=authorize; self.provider=provider
    async def identity(self,device,token,fresh=False):
        session=await self.authorize(device,token,roles=('owner',))
        if fresh:
            try: age=(datetime.now(timezone.utc)-datetime.fromisoformat(session['created_at'])).total_seconds()
            except Exception: raise HTTPException(401,'Fresh Owner verification required') from None
            if not 0<=age<=300: raise HTTPException(401,'Fresh Owner verification required')
        # Identity is derived from verified server session, never caller role/profile claims.
        return hashlib.sha256((session['profile_id']+'\0'+session['device_id']).encode()).hexdigest()
    @staticmethod
    def checked(state):
        if (type(state) is not dict or type(state.get('consent')) is not bool or type(state.get('enrolled')) is not bool or
            type(state.get('limit')) is not int or state.get('limit') not in (10,50) or any(type(state.get(k)) is not int or state[k]<0
            for k in ('revision','consent_version','calls','tokens','cost_micros')) or type(state.get('audit')) is not list):
            raise HTTPException(503,'Cloud state unavailable')
        return state
    @staticmethod
    def event(state,event,**fields):
        state['revision']+=1
        state['audit']=(state['audit']+[{'event':event,'at':now(),**fields}])[-100:]
        return state
    async def configure(self,device,token,enabled,limit):
        if type(enabled) is not bool or type(limit) is not int or limit not in (10,50): raise HTTPException(422,'Invalid settings')
        identity=await self.identity(device,token,True)
        for _ in range(32):
            before=self.checked(await self.ledger.read(identity)); after=copy.deepcopy(before)
            if enabled and not before['enrolled']: raise HTTPException(403,'Server enrollment required')
            after.update(consent=enabled,consent_policy=CONSENT_POLICY if enabled else None,limit=limit,consent_version=before['consent_version']+1)
            self.event(after,'consent_on' if enabled else 'consent_off')
            await self.identity(device,token,True)
            if await self.ledger.cas(identity,before,after): return self.status(after)
        raise HTTPException(409,'Settings changed; retry')
    @staticmethod
    def status(state): return {k:state[k] for k in ('enrolled','consent','limit','calls','tokens','cost_micros')}
    async def audit(self,identity,event,**fields):
        for _ in range(32):
            before=self.checked(await self.ledger.read(identity)); after=copy.deepcopy(before)
            self.event(after,event,**fields)
            if await self.ledger.cas(identity,before,after): return
        raise HTTPException(503,'Cloud audit unavailable')
    async def fallback(self,identity,reason):
        # Fixed internal reason only; never pass request or exception text here.
        assert reason in {'not_enrolled','consent_off','consent_changed','provider_unavailable','budget_exhausted','busy'}
        await self.audit(identity,reason)
        return reduced(reason)

    async def reserve(self,device,token,identity,tier,attempt,consent_version):
        for _ in range(32):
            await self.identity(device,token)
            before=self.checked(await self.ledger.read(identity))
            if not before['enrolled']: return 'not_enrolled'
            if not before['consent']: return 'consent_off'
            if before.get('consent_policy')!=CONSENT_POLICY or before['consent_version']!=consent_version: return 'consent_changed'
            # Conservative fixed upper reservation; not released after errors.
            if (before['calls']>=before['limit'] or before['tokens']+384>before['limit']*384 or
                before['cost_micros']+10000>before['limit']*10000): return 'budget_exhausted'
            after=copy.deepcopy(before)
            after['calls']+=1; after['tokens']+=384; after['cost_micros']+=10000
            self.event(after,'reserved',tier=tier,attempt=attempt)
            if await self.ledger.cas(identity,before,after): return None
        return 'busy'
    async def suggest(self,device,token,context):
        identity=await self.identity(device,token)
        if not self.checked(await self.ledger.read(identity))['enrolled']:
            return await self.fallback(identity,'not_enrolled')
        # Deny extra fields instead of attempting unreliable free-text redaction.
        if (type(context) is not dict or set(context)!={'layout','large_text'} or
            type(context['layout']) is not str or context['layout'] not in ('grid','list') or
            type(context['large_text']) is not bool):
            await self.audit(identity,'guardian_denied'); return reduced('guardian_denied')
        safe={'layout':context['layout'],'large_text':context['large_text']}
        consent_version=self.checked(await self.ledger.read(identity))['consent_version']
        for tier in ('primary','economy'):
            await self.identity(device,token)
            state=self.checked(await self.ledger.read(identity))
            if not state['enrolled']: return await self.fallback(identity,'not_enrolled')
            if not state['consent']: return await self.fallback(identity,'consent_off')
            if state.get('consent_policy')!=CONSENT_POLICY or state['consent_version']!=consent_version: return await self.fallback(identity,'consent_changed')
            if self.provider is None: return await self.fallback(identity,'provider_unavailable')
            attempt=uuid.uuid4().hex
            denied=await self.reserve(device,token,identity,tier,attempt,consent_version)
            if denied: return await self.fallback(identity,denied)
            # Recheck after persistence, before leaving the server. Each attempt is separately gated.
            await self.identity(device,token)
            current=self.checked(await self.ledger.read(identity))
            if not current['enrolled']: return await self.fallback(identity,'not_enrolled')
            if not current['consent']: return await self.fallback(identity,'consent_off')
            if current.get('consent_policy')!=CONSENT_POLICY or current['consent_version']!=consent_version: return await self.fallback(identity,'consent_changed')
            try:
                text=await asyncio.wait_for(self.provider(dict(safe),tier),timeout=10)
                if type(text) is not str or not text.strip() or len(text)>2048: raise ValueError()
            except Exception:
                await self.audit(identity,'provider_failed',tier=tier,attempt=attempt)
                continue
            await self.identity(device,token)
            current=self.checked(await self.ledger.read(identity))
            if not current['enrolled']: return await self.fallback(identity,'not_enrolled')
            if not current['consent']: return await self.fallback(identity,'consent_off')
            if current.get('consent_policy')!=CONSENT_POLICY or current['consent_version']!=consent_version: return await self.fallback(identity,'consent_changed')
            await self.audit(identity,'completed',tier=tier,attempt=attempt)
            await self.identity(device,token)
            current=self.checked(await self.ledger.read(identity))
            if not current['enrolled']: return await self.fallback(identity,'not_enrolled')
            if not current['consent']: return await self.fallback(identity,'consent_off')
            if current.get('consent_policy')!=CONSENT_POLICY or current['consent_version']!=consent_version: return await self.fallback(identity,'consent_changed')
            return {'mode':'cloud','suggestion':text}
        return await self.fallback(identity,'provider_unavailable')

class ConsentIn(BaseModel):
    model_config=ConfigDict(extra='forbid')
    device_id:str=Field(min_length=1,max_length=128)
    enabled:StrictBool
    limit:StrictInt
class SuggestIn(BaseModel):
    model_config=ConfigDict(extra='forbid')
    device_id:str=Field(min_length=1,max_length=128)
    context:dict

def build_ai_router(db,authorize):
    router=APIRouter(prefix='/ai')
    # Transport deliberately absent: server-side keys are not loaded here.
    def broker(): return CloudAiBroker(MongoAiLedger(db),authorize)
    @router.post('/consent')
    async def consent(req:ConsentIn,x_dm_token:str|None=Header(None,alias='X-DM-Token')):
        return await broker().configure(req.device_id,x_dm_token,req.enabled,req.limit)
    @router.post('/suggest')
    async def suggest(req:SuggestIn,x_dm_token:str|None=Header(None,alias='X-DM-Token')):
        return await broker().suggest(req.device_id,x_dm_token,req.context)
    return router


class AiBodyLimit:
    """Bound bytes before JSON decoding; never log or echo rejected input."""
    def __init__(self,app): self.app=app
    async def __call__(self,scope,receive,send):
        if scope['type']!='http' or not scope.get('path','').startswith('/api/security/ai/'):
            return await self.app(scope,receive,send)
        body=bytearray()
        while True:
            message=await receive()
            if message['type']=='http.disconnect': return
            chunk=message.get('body',b'')
            if len(body)+len(chunk)>2048:
                return await JSONResponse({'detail':'Request too large'},status_code=413,headers={'cache-control':'no-store'})(scope,receive,send)
            body.extend(chunk)
            if not message.get('more_body',False): break
        pending=True
        async def bounded_receive():
            nonlocal pending
            if pending:
                pending=False
                return {'type':'http.request','body':bytes(body),'more_body':False}
            return await receive()
        await self.app(scope,bounded_receive,send)
