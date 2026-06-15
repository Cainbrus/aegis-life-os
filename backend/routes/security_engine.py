"""
Digital Mate - Security Engine
================================
Real owner-recognition, trap mode, intruder/evidence logging and device recovery.

Owner recognition uses a deterministic statistical model (per-feature Gaussian
similarity against a learned baseline) - NOT random values. The baseline is built
from behavioural telemetry the app collects while the verified owner uses the phone
(typing rhythm, touch dynamics, device motion, time-of-day, etc.).
"""
import os
import math
import uuid
import json
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import logging
try:
    import resend
except Exception:  # keep the module importable even if the package is missing
    resend = None

logger = logging.getLogger("security_engine")

# --- DB (re-use same Mongo instance / DB as the main app) ---
mongo_url = os.environ['MONGO_URL']
_client = AsyncIOMotorClient(mongo_url)
db = _client[os.environ['DB_NAME']]

router = APIRouter(prefix="/api/security", tags=["security"])


# --- Secret hashing (user-defined codes; never stored in plaintext) ---
def _hash_secret(s: str) -> str:
    return bcrypt.hashpw(s.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def _verify_secret(plain: str, hashed: Optional[str]) -> bool:
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


async def _get_config(device_id: str) -> Optional[dict]:
    return await db.device_config.find_one({"device_id": device_id}, {"_id": 0})


async def _verify_recovery(device_id: str, code: Optional[str]) -> bool:
    cfg = await _get_config(device_id)
    return bool(cfg and cfg.get("configured") and _verify_secret(code, cfg.get("recovery_hash")))


async def _verify_wipe(device_id: str, code: Optional[str]) -> bool:
    cfg = await _get_config(device_id)
    if not (cfg and cfg.get("configured")):
        return False
    # If a separate Wipe code was set, require it; otherwise fall back to the Recovery code.
    if cfg.get("wipe_hash"):
        return _verify_secret(code, cfg.get("wipe_hash"))
    return _verify_secret(code, cfg.get("recovery_hash"))


async def _verify_access(device_id: str, code: Optional[str]) -> Optional[dict]:
    """Return the matching owner profile {name, role} if the access code is valid, else None."""
    cfg = await _get_config(device_id)
    if not (cfg and cfg.get("configured")):
        return None
    for p in cfg.get("profiles", []):
        if _verify_secret(code, p.get("access_hash")):
            return {"name": p.get("name", "Owner"), "role": p.get("role", "owner")}
    return None

# Numeric behavioural features the recognition engine understands.
FEATURE_KEYS = [
    "typing_speed",       # avg ms between key presses (rhythm)
    "typing_dwell",       # avg ms a key is held down (keydown->keyup)
    "typing_flight",      # avg ms between releasing one key and pressing the next
    "typing_variance",    # std dev of key intervals
    "touch_duration",     # avg ms a touch is held
    "touch_pressure",     # avg pointer pressure (0-1)
    "tap_interval",       # avg ms between consecutive taps
    "swipe_velocity",     # avg px/ms of swipes
    "swipe_length",       # avg swipe distance in px
    "motion_avg",         # avg accelerometer magnitude
    "hour_of_day",        # 0-23 when device is used
    "day_of_week",        # 0-6 usage day pattern
]

MIN_SAMPLES_TO_TRAIN = 8          # samples needed before a baseline is usable
OWNER_TRUST_THRESHOLD = 0.70      # >=70% = Normal/owner (band model)
# No default codes exist. Each owner defines their own recovery & vault codes
# during first-run Setup; they are stored hashed in db.device_config.


# ============================ Models ============================
class TelemetrySample(BaseModel):
    device_id: str
    features: Dict[str, float] = Field(default_factory=dict)
    label: str = "owner"  # owner telemetry trains the baseline
    lat: Optional[float] = None
    lng: Optional[float] = None
    screen: Optional[str] = None     # in-app screen for app-usage habit learning


class ScoreRequest(BaseModel):
    device_id: str
    features: Dict[str, float] = Field(default_factory=dict)
    lat: Optional[float] = None
    lng: Optional[float] = None
    screen: Optional[str] = None
    pin_ok: Optional[bool] = None        # correct access code entered this session
    known_device: Optional[float] = None # 0-1: a known Bluetooth device is connected (native)


class ChangeIn(BaseModel):
    device_id: str
    kind: str                        # 'sim' | 'network'
    detail: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SetupIn(BaseModel):
    device_id: str
    owner_name: str = "Owner"
    access_code: str                 # opens the Digital Mate dashboard
    recovery_code: str               # starts recovery / lost-phone mode
    wipe_code: str = ""              # optional high-security wipe code (falls back to recovery code)
    recovery_phrase: str = ""        # secret text phrase to trigger recovery
    panic_pattern: str = ""          # optional button pattern to trigger panic
    recovery_email: str = ""         # where alerts are sent (email integration later)
    backup_email: str = ""           # secondary alert destination
    trusted_numbers: List[str] = Field(default_factory=list)
    backup_numbers: List[str] = Field(default_factory=list)
    cover_app: str = "calculator"    # calculator | clock | notes
    call_trigger_count: int = 3      # trusted calls needed to trigger recovery
    call_trigger_window_sec: int = 300  # within this window (seconds)


class ProfileIn(BaseModel):
    device_id: str
    name: str
    access_code: str
    role: str = "trusted"            # owner | trusted | limited | guest
    recovery_code: str               # must match device recovery code to add a profile


class ProfileRemoveIn(BaseModel):
    device_id: str
    profile_id: str
    recovery_code: str


class TriggerIn(BaseModel):
    device_id: str
    secret: str                      # recovery phrase OR panic pattern OR recovery code
    lat: Optional[float] = None
    lng: Optional[float] = None


class CallTriggerIn(BaseModel):
    device_id: str
    from_number: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class CodeIn(BaseModel):
    device_id: str
    code: str


class EventIn(BaseModel):
    device_id: str
    type: str                     # intruder_photo | access_attempt | device_change | location | trap | recovery
    severity: str = "info"        # info | warning | critical
    title: str
    detail: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)
    lat: Optional[float] = None
    lng: Optional[float] = None


class TrapAction(BaseModel):
    device_id: str
    action: str
    target: str = ""
    detail: str = ""


class PhotoIn(BaseModel):
    device_id: str
    photo: str                    # data URL (front camera jpeg)
    reason: str = "trap"
    level: int = 2
    lat: Optional[float] = None
    lng: Optional[float] = None
    battery: Optional[float] = None    # 0-100
    charging: Optional[bool] = None


class RecoveryAction(BaseModel):
    device_id: str
    owner_code: Optional[str] = None
    confirm: bool = False
    lat: Optional[float] = None
    lng: Optional[float] = None


# ============================ Helpers ============================
def _now():
    return datetime.now(timezone.utc).isoformat()


def _clean_features(raw: Dict[str, float]) -> Dict[str, float]:
    out = {}
    for k in FEATURE_KEYS:
        v = raw.get(k)
        if v is not None:
            try:
                out[k] = float(v)
            except (TypeError, ValueError):
                continue
    return out


async def _log_event(device_id: str, type_: str, severity: str, title: str,
                     detail: str = "", metadata: Optional[dict] = None,
                     lat: Optional[float] = None, lng: Optional[float] = None):
    evt = {
        "id": str(uuid.uuid4()),
        "device_id": device_id,
        "type": type_,
        "severity": severity,
        "title": title,
        "detail": detail,
        "metadata": metadata or {},
        "lat": lat,
        "lng": lng,
        "created_at": _now(),
    }
    await db.security_events.insert_one(evt)
    evt.pop("_id", None)
    return evt


async def _create_alert(device_id: str, title: str, body: str, level: int = 3):
    alert = {
        "id": str(uuid.uuid4()),
        "device_id": device_id,
        "title": title,
        "body": body,
        "level": level,
        "read": False,
        "created_at": _now(),
    }
    await db.owner_alerts.insert_one(alert)
    alert.pop("_id", None)
    return alert


async def _send_alert_email(device_id: str, subject: str, heading: str, lines: List[str],
                            photo_data_url: Optional[str] = None):
    """Send an off-device owner alert via Resend. No-ops gracefully if not configured."""
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    if not api_key or resend is None:
        return False  # email dormant until the owner adds RESEND_API_KEY
    cfg = await _get_config(device_id)
    recipients = [e for e in [(cfg or {}).get("recovery_email"), (cfg or {}).get("backup_email")] if e]
    if not recipients:
        return False

    rows = "".join(f"<tr><td style='padding:4px 0;color:#334155'>{l}</td></tr>" for l in lines)
    html = f"""<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <div style="background:#0f172a;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">
        <h2 style="margin:0">Digital Mate · {heading}</h2></div>
      <div style="border:1px solid #e2e8f0;border-top:none;padding:20px;border-radius:0 0 12px 12px">
        <table style="width:100%;font-size:14px">{rows}</table>
      </div></div>"""

    params = {"from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
              "to": recipients, "subject": subject, "html": html}
    if photo_data_url and "," in photo_data_url:
        params["attachments"] = [{"filename": "intruder.jpg", "content": photo_data_url.split(",", 1)[1]}]
    try:
        resend.api_key = api_key
        await asyncio.to_thread(resend.Emails.send, params)
        return True
    except Exception as e:
        logger.error(f"Resend email failed: {e}")
        return False


async def _theft_alert_payload(device_id: str):
    """Gather facts for an alert email (location map link, latest photo, battery, recent changes)."""
    state = await db.device_state.find_one({"device_id": device_id}, {"_id": 0}) or {}
    cur = db.security_events.find({"device_id": device_id}, {"_id": 0}).sort("created_at", -1).limit(8)
    events = await cur.to_list(length=8)
    photo, battery = None, None
    for e in events:
        md = e.get("metadata") or {}
        if md.get("photo") and not photo:
            photo = md.get("photo")
        if md.get("battery") is not None and battery is None:
            battery = md.get("battery")
    loc = state.get("last_location")
    lines = [f"<b>Time:</b> {_now()}"]
    if loc:
        lines.append(f"<b>Last known location:</b> <a href='https://www.google.com/maps?q={loc['lat']},{loc['lng']}'>{loc['lat']:.5f}, {loc['lng']:.5f}</a>")
    if battery is not None:
        lines.append(f"<b>Battery:</b> {round(battery)}%")
    sim = next((e for e in events if e.get("type") == "device_change" and "SIM" in e.get("title", "")), None)
    if sim:
        lines.append(f"<b>SIM/network:</b> {sim.get('title')}")
    return lines, photo


def _gaussian_similarity(x: float, mean: float, std: float) -> float:
    """Per-feature similarity in [0,1]; 1.0 = identical to baseline."""
    std = max(std, 1e-6)
    z = (x - mean) / std
    return math.exp(-0.5 * z * z)


def _haversine_km(lat1, lng1, lat2, lng2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _location_familiarity(profile: dict, lat, lng) -> Optional[float]:
    """How close current location is to a place the owner is normally in (0-1)."""
    locs = (profile or {}).get("locations") or []
    if lat is None or lng is None or not locs:
        return None
    scale = 0.6  # km; ~neighbourhood tolerance
    best = 0.0
    for l in locs:
        d = _haversine_km(lat, lng, l["lat"], l["lng"])
        best = max(best, math.exp(-0.5 * (d / scale) ** 2))
    return round(best, 3)


def _app_usage_familiarity(profile: dict, screen: Optional[str]) -> Optional[float]:
    """How typical it is for the owner to use the current screen (0-1)."""
    counts = (profile or {}).get("screen_counts") or {}
    if not screen or not counts:
        return None
    total = sum(counts.values()) or 1
    mx = max(counts.values()) or 1
    c = counts.get(screen, 0)
    # familiar screens score high; rarely/never-used screens score low
    return round(min(1.0, 0.15 + 0.85 * (c / mx)) if c > 0 else 0.15, 3)


async def _get_profile(device_id: str) -> Optional[dict]:
    return await db.owner_profiles.find_one({"device_id": device_id}, {"_id": 0})


async def _train_baseline(device_id: str):
    """Compute per-feature mean/std from stored owner samples."""
    cursor = db.behavior_samples.find(
        {"device_id": device_id, "label": "owner"}, {"_id": 0}
    )
    samples = await cursor.to_list(length=2000)
    if len(samples) < MIN_SAMPLES_TO_TRAIN:
        return None

    baseline = {}
    for key in FEATURE_KEYS:
        vals = [s["features"][key] for s in samples if key in s.get("features", {})]
        if len(vals) < 3:
            continue
        mean = sum(vals) / len(vals)
        var = sum((v - mean) ** 2 for v in vals) / len(vals)
        # Floor std to ~10% of |mean| so a near-constant feature stays tolerant
        # to natural variation instead of becoming hyper-sensitive (std~0).
        std = max(math.sqrt(var), 0.10 * abs(mean), 0.5)
        baseline[key] = {"mean": mean, "std": std}

    await db.owner_profiles.update_one(
        {"device_id": device_id},
        {"$set": {
            "device_id": device_id,
            "baseline": baseline,
            "sample_count": len(samples),
            "trained": len(baseline) > 0,
            "updated_at": _now(),
        }},
        upsert=True,
    )
    return baseline


# ============================ Setup / Configuration ============================
COVER_APPS = {"calculator", "clock", "notes"}


@router.get("/setup/status")
async def setup_status(device_id: str):
    cfg = await _get_config(device_id)
    return {
        "configured": bool(cfg and cfg.get("configured")),
        "cover_app": (cfg or {}).get("cover_app", "calculator"),
        "profiles": [p.get("name") for p in (cfg or {}).get("profiles", [])],
        "trusted_numbers": (cfg or {}).get("trusted_numbers", []),
        "backup_numbers": (cfg or {}).get("backup_numbers", []),
        "has_email": bool((cfg or {}).get("recovery_email")),
    }


@router.post("/setup")
async def setup(req: SetupIn):
    # Simple setup: only the Access code and Recovery code are required.
    # Wipe code, recovery phrase, trusted numbers, email etc. are optional and can be added later.
    if len(req.access_code) < 4:
        raise HTTPException(status_code=400, detail="Access code must be at least 4 characters")
    if len(req.recovery_code) < 4:
        raise HTTPException(status_code=400, detail="Recovery code must be at least 4 characters")
    if req.access_code == req.recovery_code:
        raise HTTPException(status_code=400, detail="Access and Recovery codes must be different")
    if req.wipe_code and (len(req.wipe_code) < 4 or req.wipe_code in {req.access_code, req.recovery_code}):
        raise HTTPException(status_code=400, detail="Wipe code must be at least 4 characters and unique")
    cover = req.cover_app if req.cover_app in COVER_APPS else "calculator"
    numbers = [n.strip() for n in req.trusted_numbers if n and n.strip()]

    doc = {
        "device_id": req.device_id,
        "configured": True,
        "cover_app": cover,
        "recovery_hash": _hash_secret(req.recovery_code),
        "wipe_hash": _hash_secret(req.wipe_code) if req.wipe_code else None,
        "recovery_phrase_hash": _hash_secret(req.recovery_phrase.strip().lower()) if req.recovery_phrase.strip() else None,
        "panic_pattern_hash": _hash_secret(req.panic_pattern) if req.panic_pattern else None,
        "recovery_email": req.recovery_email.strip(),
        "backup_email": req.backup_email.strip(),
        "trusted_numbers": numbers,
        "backup_numbers": [n.strip() for n in req.backup_numbers if n and n.strip()],
        "call_trigger_count": max(1, min(10, req.call_trigger_count)),
        "call_trigger_window_sec": max(30, min(1800, req.call_trigger_window_sec)),
        "profiles": [{
            "id": str(uuid.uuid4()),
            "name": req.owner_name or "Owner",
            "role": "owner",
            "access_hash": _hash_secret(req.access_code),
            "created_at": _now(),
        }],
        "updated_at": _now(),
    }
    await db.device_config.update_one({"device_id": req.device_id}, {"$set": doc}, upsert=True)
    await _log_event(req.device_id, "recovery", "info", "Security setup completed",
                     "Owner configured access & recovery codes and cover app.")
    return {"ok": True, "configured": True, "cover_app": cover}


VALID_ROLES = {"owner", "trusted", "limited", "guest"}


@router.get("/profiles")
async def list_profiles(device_id: str):
    cfg = await _get_config(device_id)
    profiles = [{"id": p.get("id"), "name": p.get("name"), "role": p.get("role", "trusted")}
                for p in (cfg or {}).get("profiles", [])]
    return {"profiles": profiles}


@router.post("/profiles/add")
async def add_profile(req: ProfileIn):
    """Add a trusted family profile (requires the device recovery code)."""
    if not await _verify_recovery(req.device_id, req.recovery_code):
        raise HTTPException(status_code=403, detail="Recovery code required to add a profile")
    if len(req.access_code) < 4:
        raise HTTPException(status_code=400, detail="Access code must be at least 4 characters")
    # Security: a member's access code must be unique and must not equal the recovery/wipe codes.
    if await _verify_recovery(req.device_id, req.access_code) or await _verify_wipe(req.device_id, req.access_code):
        raise HTTPException(status_code=400, detail="Access code cannot match the Recovery or Wipe code")
    if await _verify_access(req.device_id, req.access_code) is not None:
        raise HTTPException(status_code=409, detail="That access code is already used by another profile")
    role = req.role if req.role in VALID_ROLES else "trusted"
    await db.device_config.update_one(
        {"device_id": req.device_id},
        {"$push": {"profiles": {
            "id": str(uuid.uuid4()), "name": req.name or "Member", "role": role,
            "access_hash": _hash_secret(req.access_code), "created_at": _now(),
        }}},
    )
    return await list_profiles(req.device_id)


@router.post("/profiles/remove")
async def remove_profile(req: ProfileRemoveIn):
    """Remove a family profile (requires the device recovery code). Cannot remove the owner."""
    if not await _verify_recovery(req.device_id, req.recovery_code):
        raise HTTPException(status_code=403, detail="Recovery code required")
    cfg = await _get_config(req.device_id)
    target = next((p for p in (cfg or {}).get("profiles", []) if p.get("id") == req.profile_id), None)
    if target and target.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the owner profile")
    await db.device_config.update_one(
        {"device_id": req.device_id},
        {"$pull": {"profiles": {"id": req.profile_id}}})
    return await list_profiles(req.device_id)


@router.post("/verify-access")
async def verify_access_code(req: CodeIn):
    """Unlock the dashboard from the cover app with an owner's access code."""
    match = await _verify_access(req.device_id, req.code)
    if match is not None:
        await db.device_state.update_one(
            {"device_id": req.device_id},
            {"$set": {"device_id": req.device_id, "last_owner": match["name"],
                      "last_role": match["role"], "last_unlocked_at": _now()}},
            upsert=True,
        )
    return {"verified": match is not None,
            "profile": match["name"] if match else None,
            "role": match["role"] if match else None}


@router.post("/verify-recovery")
async def verify_recovery_code(req: CodeIn):
    return {"verified": await _verify_recovery(req.device_id, req.code)}


# ============================ Hidden Vault / Invisible Folder ============================
VAULT_KINDS = {"photo", "file", "note", "password", "video", "document"}
MAX_VAULT_BYTES = 8_000_000  # ~8MB per item (base64)


class VaultItemIn(BaseModel):
    device_id: str
    kind: str                        # photo | file | note | password | video | document
    title: str
    content: str                     # data URL (media/file) or text (note/password)
    meta: Dict[str, Any] = Field(default_factory=dict)


@router.post("/vault/add")
async def vault_add(item: VaultItemIn):
    """Hide a photo/file/note/password inside Digital Mate (stored in the app's private store,
    NOT the phone gallery/file manager). Owner-only; the UI blocks this during Trap/Decoy mode."""
    kind = item.kind if item.kind in VAULT_KINDS else "file"
    if len(item.content) > MAX_VAULT_BYTES:
        raise HTTPException(status_code=413, detail="Item too large (max ~8MB). Use object storage for large videos.")
    doc = {
        "id": str(uuid.uuid4()),
        "device_id": item.device_id,
        "kind": kind,
        "title": (item.title or "Untitled")[:120],
        "content": item.content,
        "meta": item.meta,
        "created_at": _now(),
    }
    await db.vault_items.insert_one(doc)
    return {"id": doc["id"], "kind": kind, "title": doc["title"], "created_at": doc["created_at"]}


@router.get("/vault/list")
async def vault_list(device_id: str):
    cur = db.vault_items.find({"device_id": device_id}, {"_id": 0, "content": 0}).sort("created_at", -1)
    items = await cur.to_list(length=500)
    return {"items": items, "count": len(items)}


@router.get("/vault/item")
async def vault_item(device_id: str, item_id: str):
    doc = await db.vault_items.find_one({"device_id": device_id, "id": item_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


@router.delete("/vault/item")
async def vault_delete(device_id: str, item_id: str):
    res = await db.vault_items.delete_many({"device_id": device_id, "id": item_id})
    return {"ok": True, "deleted": res.deleted_count}


# ============================ Owner-created Decoy Profiles ============================
# The fake phone shown to an intruder. Owner can customise the fake contacts/messages/notes.
# SAFETY: only owner-approved content here — never vault files, passwords or private data.
DECOY_DEFAULTS = {
    "name": "Default",
    "contacts": ["Alex Carter", "Mum", "Jordan", "Dr Patel", "Sam Reed", "Pizza Place", "Work", "Taylor"],
    "messages": [
        {"from": "Mum", "text": "Are you coming for dinner Sunday? x", "time": "9:41"},
        {"from": "Jordan", "text": "haha yeah saw that", "time": "8:12"},
        {"from": "Delivery", "text": "Your parcel is out for delivery today", "time": "Yesterday"},
        {"from": "Sam", "text": "call me when you get a sec", "time": "Yesterday"},
    ],
    "notes": [
        {"title": "Shopping", "body": "milk, eggs, bread, coffee"},
        {"title": "Wifi", "body": "guest network: welcome123"},
        {"title": "Ideas", "body": "weekend trip - book hotel"},
    ],
}


class DecoyProfileIn(BaseModel):
    device_id: str
    name: str = "My decoy"
    contacts: List[str] = Field(default_factory=list)
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    notes: List[Dict[str, Any]] = Field(default_factory=list)


@router.get("/decoy/profile")
async def get_decoy_profile(device_id: str):
    doc = await db.decoy_profiles.find_one({"device_id": device_id}, {"_id": 0})
    if not doc:
        return {"configured": False, **DECOY_DEFAULTS}
    return {"configured": True, "name": doc.get("name", "My decoy"),
            "contacts": doc.get("contacts") or DECOY_DEFAULTS["contacts"],
            "messages": doc.get("messages") or DECOY_DEFAULTS["messages"],
            "notes": doc.get("notes") or DECOY_DEFAULTS["notes"]}


@router.post("/decoy/profile")
async def save_decoy_profile(req: DecoyProfileIn):
    await db.decoy_profiles.update_one(
        {"device_id": req.device_id},
        {"$set": {
            "device_id": req.device_id, "name": req.name or "My decoy",
            "contacts": [c for c in req.contacts if c][:30],
            "messages": [m for m in req.messages if m.get("text")][:30],
            "notes": [n for n in req.notes if n.get("title") or n.get("body")][:30],
            "updated_at": _now(),
        }}, upsert=True)
    return {"ok": True}


# ============================ Family Tracking (cross-device) ============================
# Parents (member_role 'parent') see all members' last location + security alerts.
# Kids ('child') see no one — they are only protected themselves. Members link via a family code.
class FamilyCreateIn(BaseModel):
    device_id: str
    name: str = "Member"
    member_role: str = "parent"      # parent | child


class FamilyJoinIn(BaseModel):
    device_id: str
    name: str = "Member"
    member_role: str = "child"
    family_code: str


def _family_code():
    import random, string
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def _my_membership(device_id: str):
    return await db.family_members.find_one({"device_id": device_id}, {"_id": 0})


@router.post("/family/create")
async def family_create(req: FamilyCreateIn):
    existing = await _my_membership(req.device_id)
    if existing:
        fam = await db.families.find_one({"family_id": existing["family_id"]}, {"_id": 0})
        return {"ok": True, "family_id": existing["family_id"], "family_code": fam.get("family_code") if fam else None}
    family_id = str(uuid.uuid4())
    code = _family_code()
    await db.families.insert_one({"family_id": family_id, "family_code": code,
                                  "owner_device_id": req.device_id, "created_at": _now()})
    await db.family_members.insert_one({"family_id": family_id, "device_id": req.device_id,
                                        "name": req.name or "Parent", "member_role": "parent", "joined_at": _now()})
    return {"ok": True, "family_id": family_id, "family_code": code}


@router.post("/family/join")
async def family_join(req: FamilyJoinIn):
    fam = await db.families.find_one({"family_code": req.family_code.strip().upper()}, {"_id": 0})
    if not fam:
        raise HTTPException(status_code=404, detail="Invalid family code")
    role = req.member_role if req.member_role in ("parent", "teen", "child") else "child"
    await db.family_members.update_one(
        {"device_id": req.device_id},
        {"$set": {"family_id": fam["family_id"], "device_id": req.device_id,
                  "name": req.name or "Member", "member_role": role, "joined_at": _now()}},
        upsert=True,
    )
    return {"ok": True, "family_id": fam["family_id"]}


@router.get("/family/status")
async def family_status(device_id: str):
    me = await _my_membership(device_id)
    if not me:
        return {"in_family": False}
    fam = await db.families.find_one({"family_id": me["family_id"]}, {"_id": 0})
    count = await db.family_members.count_documents({"family_id": me["family_id"]})
    return {
        "in_family": True,
        "role": me["member_role"],
        "name": me["name"],
        "member_count": count,
        "family_code": fam.get("family_code") if (fam and me["member_role"] == "parent") else None,
    }


@router.get("/family/members")
async def family_members(device_id: str):
    me = await _my_membership(device_id)
    if not me:
        return {"in_family": False, "members": []}
    role = me["member_role"]

    cur = db.family_members.find({"family_id": me["family_id"]}, {"_id": 0})
    all_members = await cur.to_list(length=100)

    # Visibility: parents see everyone; teens & children see only siblings (non-parents),
    # never parents' location/history. Children additionally cannot see locations.
    if role == "parent":
        visible = all_members
        show_locations = True
    else:
        visible = [m for m in all_members if m.get("member_role") != "parent"]
        show_locations = role == "teen"   # teens see sibling locations; children do not

    out = []
    for m in visible:
        st = await db.device_state.find_one({"device_id": m["device_id"]}, {"_id": 0}) or {}
        unread = await db.owner_alerts.count_documents({"device_id": m["device_id"], "read": False})
        latest = await db.owner_alerts.find_one({"device_id": m["device_id"]}, {"_id": 0}, sort=[("created_at", -1)])
        out.append({
            "name": m["name"],
            "member_role": m["member_role"],
            "is_me": m["device_id"] == device_id,
            "last_location": st.get("last_location") if show_locations else None,
            "last_seen": st.get("last_scored_at") or st.get("last_seen"),
            "trap_level": st.get("trap_level", 0),
            "lost_mode": bool(st.get("lost_mode", False)) if role == "parent" else False,
            "alerts_unread": unread if role == "parent" else 0,
            "latest_alert": (latest or {}).get("title") if role == "parent" else None,
        })
    return {"in_family": True, "role": role, "can_view": True,
            "show_locations": show_locations, "can_manage": role == "parent", "members": out}


@router.post("/family/leave")
async def family_leave(req: CodeIn):
    await db.family_members.delete_one({"device_id": req.device_id})
    return {"ok": True}


# ============================ Owner Recognition ============================
@router.post("/telemetry")
async def ingest_telemetry(sample: TelemetrySample):
    """Collect a behavioural sample. Owner samples build the baseline model."""
    feats = _clean_features(sample.features)
    if not feats:
        raise HTTPException(status_code=400, detail="No valid features provided")

    await db.behavior_samples.insert_one({
        "id": str(uuid.uuid4()),
        "device_id": sample.device_id,
        "features": feats,
        "label": sample.label,
        "created_at": _now(),
    })

    # New-device detection: first time we ever see this device, log it.
    st = await db.device_state.find_one({"device_id": sample.device_id}, {"_id": 0, "first_seen": 1})
    if not (st and st.get("first_seen")):
        await db.device_state.update_one(
            {"device_id": sample.device_id},
            {"$set": {"first_seen": _now(), "device_id": sample.device_id}}, upsert=True)
        await _log_event(sample.device_id, "device_change", "info", "New device registered",
                         "Digital Mate started monitoring on a new device.")

    count = await db.behavior_samples.count_documents(
        {"device_id": sample.device_id, "label": "owner"}
    )

    # Learn owner location & app-usage habits from owner telemetry.
    if sample.label == "owner":
        updates = {}
        push = {}
        if sample.lat is not None and sample.lng is not None:
            push["locations"] = {"$each": [{"lat": sample.lat, "lng": sample.lng}], "$slice": -100}
        if sample.screen:
            updates[f"screen_counts.{sample.screen}"] = 1
        if push or updates:
            op = {"$set": {"device_id": sample.device_id}}
            if push:
                op["$push"] = push
            if updates:
                op["$inc"] = updates
            await db.owner_profiles.update_one({"device_id": sample.device_id}, op, upsert=True)

    trained = False
    if sample.label == "owner" and count >= MIN_SAMPLES_TO_TRAIN:
        baseline = await _train_baseline(sample.device_id)
        trained = baseline is not None

    return {
        "ok": True,
        "sample_count": count,
        "samples_needed": max(0, MIN_SAMPLES_TO_TRAIN - count),
        "trained": trained,
    }


@router.post("/score")
async def score_session(req: ScoreRequest):
    """Score the current session against the owner baseline. Real, deterministic."""
    profile = await _get_profile(req.device_id)
    feats = _clean_features(req.features)

    # No baseline yet -> still in learning phase, treat as owner (benefit of doubt).
    if not profile or not profile.get("trained"):
        sample_count = await db.behavior_samples.count_documents(
            {"device_id": req.device_id, "label": "owner"}
        )
        return {
            "trust_score": 1.0,
            "is_owner": True,
            "trap_active": False,
            "status": "learning",
            "samples_needed": max(0, MIN_SAMPLES_TO_TRAIN - sample_count),
        }

    baseline = profile["baseline"]

    # --- Additive, weighted trust model (reduces false alarms for trusted family) ---
    # Each independent factor contributes up to its weight; trust = weighted mean over the
    # factors we actually have data for. A correct PIN + home location + a known device keeps
    # trust high even if typing differs (e.g. partner/kids using the phone).
    behaviour_sims = []
    contributions = {}
    for key in FEATURE_KEYS:
        if key in feats and key in baseline:
            sim = _gaussian_similarity(feats[key], baseline[key]["mean"], baseline[key]["std"])
            behaviour_sims.append(sim)
            contributions[key] = round(sim, 3)

    factors = []  # (weight, value 0-1)
    if behaviour_sims:
        bval = sum(behaviour_sims) / len(behaviour_sims)
        factors.append((25, bval))
        contributions["behaviour"] = round(bval, 3)

    loc_fam = _location_familiarity(profile, req.lat, req.lng)
    if loc_fam is not None:
        factors.append((25, loc_fam))
        contributions["location_habit"] = loc_fam

    if req.known_device is not None:
        kd = max(0.0, min(1.0, float(req.known_device)))
        factors.append((20, kd))
        contributions["known_device"] = round(kd, 3)

    if req.pin_ok is not None:
        pv = 1.0 if req.pin_ok else 0.0
        factors.append((15, pv))
        contributions["pin"] = pv

    app_fam = _app_usage_familiarity(profile, req.screen)
    if app_fam is not None:
        factors.append((15, app_fam))
        contributions["app_usage"] = app_fam

    if not factors:
        return {"trust_score": 1.0, "is_owner": True, "trap_active": False, "status": "no_signal"}

    total_w = sum(w for w, _ in factors)
    trust = sum(w * v for w, v in factors) / total_w
    is_owner = trust >= OWNER_TRUST_THRESHOLD

    # --- Band-based escalation with debounce (SILENT / invisible) ---
    # 70-100 Normal(0) · 40-69 Monitor(1) · 20-39 Trap(2) · 0-19 Recovery(3)
    state = await db.device_state.find_one({"device_id": req.device_id}, {"_id": 0}) or {}
    streak = int(state.get("low_trust_streak", 0))
    prev_level = int(state.get("trap_level", 0))

    if trust >= 0.70:
        streak = 0
        level = 0
        trap_active = False
    else:
        streak += 1
        if trust >= 0.40:
            level = 1                                   # Monitor
        elif trust >= 0.20:
            level = 2 if streak >= 2 else 1             # Trap (debounced: needs 2 readings)
        else:
            level = 3 if streak >= 2 else 2             # Recovery (debounced)
        trap_active = level >= 2

    set_state = {
        "device_id": req.device_id,
        "low_trust_streak": streak,
        "trap_level": level,
        "trap_active": trap_active,
        "last_trust_score": round(trust, 3),
        "last_scored_at": _now(),
    }
    if req.lat is not None and req.lng is not None:
        set_state["last_location"] = {"lat": req.lat, "lng": req.lng, "at": _now()}
    if level >= 3:
        set_state["locked"] = True
        set_state["lost_mode"] = True
    await db.device_state.update_one(
        {"device_id": req.device_id}, {"$set": set_state}, upsert=True
    )

    # Log only on escalation to a higher level
    if not is_owner and level > prev_level:
        if level == 1:
            await _log_event(
                req.device_id, "access_attempt", "warning",
                "Level 1 - Unknown behaviour detected",
                f"Trust {round(trust*100)}% below the {int(OWNER_TRUST_THRESHOLD*100)}% threshold. Logging started.",
                metadata={"trust_score": round(trust, 3), "level": 1, "signals": contributions},
                lat=req.lat, lng=req.lng,
            )
        elif level == 2:
            await _log_event(
                req.device_id, "access_attempt", "critical",
                "Level 2 - Multiple failed recognition checks",
                "Silently capturing intruder photo and tracking location. App continues normally.",
                metadata={"trust_score": round(trust, 3), "level": 2}, lat=req.lat, lng=req.lng,
            )
        elif level == 3:
            await _log_event(
                req.device_id, "access_attempt", "critical",
                "Level 3 - Confirmed theft",
                "Owner notified. Recovery mode activated and device locked.",
                metadata={"trust_score": round(trust, 3), "level": 3}, lat=req.lat, lng=req.lng,
            )
            await _create_alert(
                req.device_id, "Possible theft detected",
                "Digital Mate locked your device and started recovery tracking. Open the app to locate it.",
            )
            _lines, _photo = await _theft_alert_payload(req.device_id)
            await _send_alert_email(req.device_id, "Digital Mate: possible theft detected",
                                    "Possible theft detected", _lines, _photo)

    return {
        "trust_score": round(trust, 3),
        "is_owner": is_owner,
        "trap_level": level,
        "trap_active": trap_active,
        "streak": streak,
        "status": "active",
        "signals": contributions,
    }


@router.get("/status")
async def security_status(device_id: str):
    profile = await _get_profile(device_id)
    state = await db.device_state.find_one({"device_id": device_id}, {"_id": 0}) or {}
    sample_count = await db.behavior_samples.count_documents(
        {"device_id": device_id, "label": "owner"}
    )
    intruders = await db.security_events.count_documents(
        {"device_id": device_id, "type": {"$in": ["access_attempt", "intruder_photo"]},
         "severity": "critical"}
    )
    threats = await db.security_events.count_documents(
        {"device_id": device_id, "severity": {"$in": ["warning", "critical"]}}
    )
    return {
        "device_id": device_id,
        "trained": bool(profile and profile.get("trained")),
        "sample_count": sample_count,
        "samples_needed": max(0, MIN_SAMPLES_TO_TRAIN - sample_count),
        "trust_score": state.get("last_trust_score", 1.0),
        "trap_active": bool(state.get("trap_active", False)),
        "trap_level": int(state.get("trap_level", 0)),
        "locked": bool(state.get("locked", False)),
        "lost_mode": bool(state.get("lost_mode", False)),
        "wiped": bool(state.get("wiped", False)),
        "last_location": state.get("last_location"),
        "last_owner": state.get("last_owner"),
        "last_role": state.get("last_role"),
        "last_unlocked_at": state.get("last_unlocked_at"),
        "last_scored_at": state.get("last_scored_at"),
        "profiles": [{"name": p.get("name"), "role": p.get("role", "trusted")}
                     for p in ((await _get_config(device_id)) or {}).get("profiles", [])],
        "intruders_detected": intruders,
        "threats_blocked": threats,
    }


@router.post("/baseline/reset")
async def reset_baseline(req: RecoveryAction):
    await db.behavior_samples.delete_many({"device_id": req.device_id})
    await db.owner_profiles.delete_one({"device_id": req.device_id})
    return {"ok": True, "message": "Baseline reset. Owner recognition will re-learn."}


# ============================ Evidence Center ============================
@router.post("/events")
async def add_event(evt: EventIn):
    return await _log_event(
        evt.device_id, evt.type, evt.severity, evt.title, evt.detail,
        evt.metadata, evt.lat, evt.lng,
    )


@router.get("/events")
async def list_events(device_id: str, limit: int = 100):
    cursor = db.security_events.find({"device_id": device_id}, {"_id": 0}).sort("created_at", -1).limit(limit)
    events = await cursor.to_list(length=limit)
    return {"events": events, "count": len(events)}


@router.delete("/events")
async def clear_events(device_id: str):
    res = await db.security_events.delete_many({"device_id": device_id})
    return {"ok": True, "deleted": res.deleted_count}


@router.post("/device-change")
async def device_change(c: ChangeIn):
    """Record a SIM or network change as evidence (true SIM detection needs the native phase)."""
    is_sim = c.kind == "sim"
    title = "SIM change detected" if is_sim else "Network change detected"
    sev = "critical" if is_sim else "warning"
    evt = await _log_event(c.device_id, "device_change", sev, title, c.detail, metadata=c.metadata)
    # A SIM swap is a strong theft signal -> immediately escalate to recovery + alert.
    if is_sim:
        await db.device_state.update_one(
            {"device_id": c.device_id},
            {"$set": {"device_id": c.device_id, "lost_mode": True, "locked": True,
                      "trap_level": 3, "sim_alert": True, "sim_alert_at": _now()}},
            upsert=True,
        )
        await _create_alert(c.device_id, "SIM card changed",
                            "The SIM in your device changed - a common sign of theft. Recovery mode activated; tracking and evidence capture started.")
        _lines, _photo = await _theft_alert_payload(c.device_id)
        await _send_alert_email(c.device_id, "Digital Mate: SIM card changed",
                                "SIM card changed", _lines, _photo)
    return evt


@router.post("/evidence/photo")
async def add_photo(p: PhotoIn):
    """Store a front-camera intruder photo and log it on the evidence timeline."""
    batt = ""
    if p.battery is not None:
        batt = f" Battery {round(p.battery)}%{' (charging)' if p.charging else ''}."
    return await _log_event(
        p.device_id, "intruder_photo", "critical",
        "Intruder photo captured",
        f"Front camera photo captured at Trap Level {p.level}.{batt}",
        metadata={"photo": p.photo, "level": p.level, "battery": p.battery, "charging": p.charging},
        lat=p.lat, lng=p.lng,
    )


@router.get("/alerts")
async def list_alerts(device_id: str):
    cur = db.owner_alerts.find({"device_id": device_id}, {"_id": 0}).sort("created_at", -1).limit(50)
    alerts = await cur.to_list(length=50)
    return {"alerts": alerts, "count": len(alerts), "unread": sum(1 for a in alerts if not a.get("read"))}


@router.post("/panic")
async def panic(req: RecoveryAction):
    """Owner-initiated Lost Phone: lock, enable lost mode + recovery tracking, alert owner."""
    set_state = {
        "device_id": req.device_id, "locked": True, "lost_mode": True,
        "trap_level": 3, "trap_active": False, "panic_at": _now(),
    }
    await db.device_state.update_one({"device_id": req.device_id}, {"$set": set_state}, upsert=True)
    if req.lat is not None and req.lng is not None:
        loc = {"lat": req.lat, "lng": req.lng, "at": _now()}
        await db.device_state.update_one(
            {"device_id": req.device_id},
            {"$set": {"last_location": loc}, "$push": {"location_history": {"$each": [loc], "$slice": -50}}},
        )
    await _log_event(req.device_id, "recovery", "critical", "Panic / Lost Phone activated",
                     "Owner triggered panic: device locked and recovery tracking started.",
                     lat=req.lat, lng=req.lng)
    await _create_alert(req.device_id, "Lost Phone mode activated",
                        "You activated Panic mode. Live tracking and remote lock are on.")
    _lines, _photo = await _theft_alert_payload(req.device_id)
    await _send_alert_email(req.device_id, "Digital Mate: Lost Phone mode activated",
                            "Lost Phone mode activated", _lines, _photo)
    return {"ok": True, "locked": True, "trap_level": 3}


# ============================ Trap Mode ============================
@router.get("/trap/status")
async def trap_status(device_id: str):
    state = await db.device_state.find_one({"device_id": device_id}, {"_id": 0}) or {}
    actions = await db.trap_actions.count_documents({"device_id": device_id})
    return {
        "trap_active": bool(state.get("trap_active", False)),
        "started_at": state.get("trap_started_at"),
        "recorded_actions": actions,
        "trust_score": state.get("last_trust_score", 1.0),
    }


@router.post("/trap/activate")
async def trap_activate(req: RecoveryAction):
    await db.device_state.update_one(
        {"device_id": req.device_id},
        {"$set": {"trap_active": True, "trap_started_at": _now(), "device_id": req.device_id}},
        upsert=True,
    )
    await _log_event(req.device_id, "trap", "warning", "Trap Mode activated",
                     "Decoy environment is now shown. Sensitive data hidden.")
    return {"ok": True, "trap_active": True}


@router.post("/trap/deactivate")
async def trap_deactivate(req: RecoveryAction):
    if not await _verify_recovery(req.device_id, req.owner_code):
        raise HTTPException(status_code=403, detail="Owner verification required")
    await db.device_state.update_one(
        {"device_id": req.device_id},
        {"$set": {"trap_active": False, "trap_ended_at": _now()}},
        upsert=True,
    )
    return {"ok": True, "trap_active": False}


@router.post("/trap/log-action")
async def trap_log_action(a: TrapAction):
    """Record what an intruder does while inside the decoy."""
    doc = {
        "id": str(uuid.uuid4()),
        "device_id": a.device_id,
        "action": a.action,
        "target": a.target,
        "detail": a.detail,
        "created_at": _now(),
    }
    await db.trap_actions.insert_one(doc)
    doc.pop("_id", None)
    await _log_event(a.device_id, "trap", "warning",
                     f"Intruder action: {a.action}",
                     f"{a.target} {a.detail}".strip())
    return {"ok": True}


# ============================ Device Recovery ============================
@router.post("/recovery/locate")
async def recovery_locate(req: RecoveryAction):
    """Device self-reports its current location for tracking."""
    if req.lat is None or req.lng is None:
        raise HTTPException(status_code=400, detail="lat/lng required")
    loc = {"lat": req.lat, "lng": req.lng, "at": _now()}
    await db.device_state.update_one(
        {"device_id": req.device_id},
        {"$set": {"last_location": loc, "device_id": req.device_id},
         "$push": {"location_history": {"$each": [loc], "$slice": -50}}},
        upsert=True,
    )
    await _log_event(req.device_id, "location", "info", "Location reported",
                     f"{req.lat:.5f}, {req.lng:.5f}", lat=req.lat, lng=req.lng)
    return {"ok": True, "location": loc}


@router.get("/recovery/location")
async def recovery_location(device_id: str):
    state = await db.device_state.find_one({"device_id": device_id}, {"_id": 0}) or {}
    return {
        "last_location": state.get("last_location"),
        "history": state.get("location_history", []),
        "lost_mode": bool(state.get("lost_mode", False)),
    }


@router.post("/recovery/lock")
async def recovery_lock(req: RecoveryAction):
    await db.device_state.update_one(
        {"device_id": req.device_id},
        {"$set": {"locked": True, "lost_mode": True, "locked_at": _now(),
                  "device_id": req.device_id}},
        upsert=True,
    )
    await _log_event(req.device_id, "recovery", "warning", "Remote lock engaged",
                     "Device put into Lost Mode and locked remotely.")
    return {"ok": True, "locked": True}


@router.post("/recovery/trigger")
async def recovery_trigger(req: TriggerIn):
    """Activate recovery via the owner's secret recovery PHRASE, PANIC PATTERN or RECOVERY code.
    Designed so future native triggers (trusted-number SMS, secret dial code) can call the same path."""
    cfg = await _get_config(req.device_id)
    if not (cfg and cfg.get("configured")):
        raise HTTPException(status_code=404, detail="Device not configured")
    s = (req.secret or "").strip()
    via = None
    if _verify_secret(s.lower(), cfg.get("recovery_phrase_hash")):
        via = "phrase"
    elif cfg.get("panic_pattern_hash") and _verify_secret(s, cfg.get("panic_pattern_hash")):
        via = "pattern"
    elif _verify_secret(s, cfg.get("recovery_hash")):
        via = "code"
    if not via:
        return {"triggered": False}

    await db.device_state.update_one(
        {"device_id": req.device_id},
        {"$set": {"locked": True, "lost_mode": True, "trap_level": 3, "trap_active": False,
                  "panic_at": _now(), "device_id": req.device_id}},
        upsert=True,
    )
    if req.lat is not None and req.lng is not None:
        loc = {"lat": req.lat, "lng": req.lng, "at": _now()}
        await db.device_state.update_one(
            {"device_id": req.device_id},
            {"$set": {"last_location": loc}, "$push": {"location_history": {"$each": [loc], "$slice": -50}}})
    await _log_event(req.device_id, "recovery", "critical", f"Recovery triggered ({via})",
                     "Owner activated Lost Phone mode via secret trigger. Tracking started.",
                     lat=req.lat, lng=req.lng)
    await _create_alert(req.device_id, "Recovery activated",
                        f"Lost Phone mode was triggered via your secret {via}. Live tracking and lock are on.")
    _lines, _photo = await _theft_alert_payload(req.device_id)
    await _send_alert_email(req.device_id, "Digital Mate: recovery activated",
                            "Recovery activated", _lines, _photo)
    return {"triggered": True, "via": via}


@router.post("/recovery/unlock")
async def recovery_unlock(req: RecoveryAction):
    if not await _verify_recovery(req.device_id, req.owner_code):
        raise HTTPException(status_code=403, detail="Owner verification required")
    await db.device_state.update_one(
        {"device_id": req.device_id},
        {"$set": {"locked": False, "lost_mode": False, "trap_active": False,
                  "unlocked_at": _now()}},
        upsert=True,
    )
    await _log_event(req.device_id, "recovery", "info", "Device unlocked",
                     "Owner verified. Lost Mode cleared.")
    return {"ok": True, "locked": False}


@router.post("/recovery/wipe")
async def recovery_wipe(req: RecoveryAction):
    """Safe, wipe-code-verified, confirmed remote wipe of app data/vault."""
    if not await _verify_wipe(req.device_id, req.owner_code):
        raise HTTPException(status_code=403, detail="Owner verification required")
    if not req.confirm:
        raise HTTPException(status_code=400, detail="Confirmation required to wipe")

    # Wipe app-scoped sensitive data for this device.
    await db.vault_items.delete_many({"device_id": req.device_id})
    await db.device_state.update_one(
        {"device_id": req.device_id},
        {"$set": {"wiped": True, "wiped_at": _now(), "trap_active": False,
                  "device_id": req.device_id}},
        upsert=True,
    )
    await _log_event(req.device_id, "recovery", "critical", "Remote wipe executed",
                     "Owner-verified remote wipe of app vault completed.")
    return {"ok": True, "wiped": True}


# ============================ Emergency Owner Command ============================
@router.post("/emergency/verify")
async def emergency_verify(req: RecoveryAction):
    """Verify the owner's recovery code before exposing destructive emergency actions."""
    return {"verified": await _verify_recovery(req.device_id, req.owner_code)}


# ============================ Privacy & Security Scan ============================
class ScanIn(BaseModel):
    device_id: str
    signals: Dict[str, Any] = Field(default_factory=dict)


# Android Settings deep-link actions for the one-click shortcuts.
_S_APPS = "android.settings.MANAGE_APPLICATIONS_SETTINGS"
_S_OVERLAY = "android.settings.action.MANAGE_OVERLAY_PERMISSION"
_S_ACC = "android.settings.ACCESSIBILITY_SETTINGS"
_S_ADMIN = "android.settings.DEVICE_ADMIN_SETTINGS"
_S_VPN = "android.settings.VPN_SETTINGS"
_S_DEV = "android.settings.APPLICATION_DEVELOPMENT_SETTINGS"
_S_APPDETAIL = "android.settings.APPLICATION_DETAILS_SETTINGS"

# Checks that require the native Android app to inspect OTHER apps / system state.
# A sandboxed web/Capacitor app cannot read these, so they are honestly marked pending.
_NATIVE_CHECKS = [
    ("sms_apps", "App permissions", "Apps with SMS access",
     "Apps that can read or send texts could intercept 2FA codes and private messages.",
     "Review apps with SMS access and revoke any you don't recognise.", _S_APPS),
    ("mic_apps", "App permissions", "Apps with microphone access",
     "An app with mic access could record audio in the background.",
     "Review mic access and revoke unused apps.", _S_APPS),
    ("camera_apps", "App permissions", "Apps with camera access",
     "An app with camera access could capture photos/video silently.",
     "Review camera access and revoke unused apps.", _S_APPS),
    ("calllog_apps", "App permissions", "Apps with call-log access",
     "Call-log access reveals who you contact and when.",
     "Revoke call-log access for non-dialer apps.", _S_APPS),
    ("contacts_apps", "App permissions", "Apps with contacts access",
     "Contacts access exposes your relationships and can be used for phishing.",
     "Revoke contacts access for apps that don't need it.", _S_APPS),
    ("location_apps", "App permissions", "Apps with location access",
     "Location access can track your movements.",
     "Set location to 'while using' or revoke for unused apps.", _S_APPS),
    ("overlay_apps", "App permissions", "Apps that can draw over other apps",
     "Overlay permission can be abused for tap-jacking / fake screens.",
     "Disable 'display over other apps' for untrusted apps.", _S_OVERLAY),
    ("accessibility", "System", "Accessibility services enabled",
     "Accessibility services can read screen content and simulate taps - a common malware vector.",
     "Disable accessibility for apps you didn't intentionally enable.", _S_ACC),
    ("device_admin", "System", "Device administrator apps",
     "Device admin apps can lock or wipe your phone and resist uninstall.",
     "Remove device-admin rights from unknown apps.", _S_ADMIN),
    ("vpn", "Network", "Unknown VPNs / proxies",
     "A rogue VPN can route and inspect all your traffic.",
     "Remove VPN profiles you didn't set up.", _S_VPN),
    ("developer_mode", "System", "Developer mode",
     "Developer options enable lower-level access that can weaken security.",
     "Turn off Developer options if you don't need them.", _S_DEV),
    ("usb_debugging", "System", "USB debugging",
     "USB debugging lets a connected computer control the device.",
     "Disable USB debugging when not actively developing.", _S_DEV),
    ("new_google", "Accounts", "New Google account activity",
     "A new account added to the device may indicate unauthorised access.",
     "Review accounts on the device and remove unknown ones.", _S_APPS),
    ("recent_perms", "App permissions", "Recently granted sensitive permissions",
     "Permissions granted recently without your knowledge may indicate tampering.",
     "Review the permission manager for recent changes.", _S_APPS),
]


@router.post("/privacy-scan")
async def privacy_scan(req: ScanIn):
    """Privacy & security advisor. Honest about what a sandboxed app can vs cannot see."""
    checks = []
    sig = req.signals or {}

    # 1) This app's own granted permissions (genuinely observable now).
    for key, label, need in [
        ("camera", "Digital Mate camera access", "intruder photo capture"),
        ("microphone", "Digital Mate microphone access", "voice features"),
        ("geolocation", "Digital Mate location access", "device recovery & location habits"),
        ("notifications", "Digital Mate notifications", "intrusion alerts"),
    ]:
        state = sig.get(key)  # 'granted' | 'denied' | 'prompt' | None
        if state == "granted":
            status, detected = "safe", f"Granted - used for {need}."
        else:
            status, detected = "review", f"Not granted - {need} will not work until you allow it."
        checks.append({
            "id": f"self_{key}", "category": "Digital Mate's own access", "label": label,
            "status": status, "detected": detected,
            "risk": "This is Digital Mate's own permission, not another app's.",
            "action": "Manage in App info > Permissions." if status != "safe" else "No action needed.",
            "settings": _S_APPDETAIL, "source": "app",
        })

    secure = sig.get("secure_context")
    checks.append({
        "id": "secure_context", "category": "Network", "label": "Secure connection",
        "status": "safe" if secure else "review",
        "detected": "App is served over HTTPS." if secure else "Connection is not secure.",
        "risk": "Insecure connections can be intercepted.",
        "action": "No action needed." if secure else "Use the official app over HTTPS.",
        "settings": None, "source": "app",
    })

    # 2) Derived from logged events: SIM changes & network changes.
    sim_events = await db.security_events.count_documents(
        {"device_id": req.device_id, "type": "device_change", "title": {"$regex": "SIM"}})
    checks.append({
        "id": "sim_change", "category": "Device", "label": "SIM card changes",
        "status": "high_risk" if sim_events else "safe",
        "detected": f"{sim_events} SIM change(s) recorded." if sim_events else "No SIM changes recorded.",
        "risk": "A changed SIM on a lost device is a strong sign of theft.",
        "action": "If you didn't change the SIM, activate Lost Phone mode now.",
        "settings": None, "source": "log",
    })
    net_events = await db.security_events.count_documents(
        {"device_id": req.device_id, "type": "device_change", "title": {"$regex": "Network"}})
    checks.append({
        "id": "network_change", "category": "Network", "label": "Network changes",
        "status": "review" if net_events > 3 else "safe",
        "detected": f"{net_events} network change(s) recorded.",
        "risk": "Frequent unexpected network changes can indicate suspicious activity.",
        "action": "Review recent network changes in the Evidence Center.",
        "settings": _S_VPN, "source": "log",
    })

    seen = await db.device_state.find_one({"device_id": req.device_id}, {"_id": 0, "first_seen": 1})
    is_new = not (seen and seen.get("first_seen"))
    if is_new:
        await db.device_state.update_one({"device_id": req.device_id},
                                         {"$set": {"first_seen": _now(), "device_id": req.device_id}}, upsert=True)
    checks.append({
        "id": "new_device", "category": "Accounts", "label": "New device login",
        "status": "review" if is_new else "safe",
        "detected": "This appears to be a newly registered device." if is_new else "Known device.",
        "risk": "A new device login you didn't perform may indicate account compromise.",
        "action": "If this isn't your device setup, change your account passwords.",
        "settings": None, "source": "log",
    })

    # 3) Native-only checks (honestly pending).
    for cid, cat, label, risk, action, settings in _NATIVE_CHECKS:
        checks.append({
            "id": cid, "category": cat, "label": label,
            "status": "native_pending",
            "detected": "Requires the native Digital Mate app to inspect other apps and system settings.",
            "risk": risk, "action": action, "settings": settings, "source": "native",
        })

    observable = [c for c in checks if c["status"] != "native_pending"]
    if any(c["status"] == "high_risk" for c in observable):
        overall = "high_risk"
    elif any(c["status"] == "review" for c in observable):
        overall = "review"
    else:
        overall = "safe"

    counts = {
        "safe": sum(1 for c in checks if c["status"] == "safe"),
        "review": sum(1 for c in checks if c["status"] == "review"),
        "high_risk": sum(1 for c in checks if c["status"] == "high_risk"),
        "native_pending": sum(1 for c in checks if c["status"] == "native_pending"),
    }
    await db.device_state.update_one(
        {"device_id": req.device_id},
        {"$set": {"last_scan_at": _now(), "last_scan_overall": overall, "device_id": req.device_id}},
        upsert=True,
    )
    return {"overall": overall, "counts": counts, "checks": checks, "scanned_at": _now()}


# ============================ Trusted-Number Call Recovery ============================
@router.post("/recovery/call-trigger")
async def call_trigger(c: CallTriggerIn):
    """A trusted/backup number calling the device N times within the configured window
    activates recovery - no app interaction needed. (Native call-state detection feeds this.)"""
    cfg = await _get_config(c.device_id)
    if not (cfg and cfg.get("configured")):
        raise HTTPException(status_code=404, detail="Device not configured")
    trigger_count = int(cfg.get("call_trigger_count", 3))
    window_sec = int(cfg.get("call_trigger_window_sec", 300))
    allowed = set(cfg.get("trusted_numbers", []) + cfg.get("backup_numbers", []))
    norm = c.from_number.strip()
    is_trusted = any(norm.replace(" ", "").endswith(a.replace(" ", "")[-7:]) for a in allowed) if allowed else False
    now = datetime.now(timezone.utc)

    await db.call_events.insert_one({
        "device_id": c.device_id, "from_number": norm, "trusted": is_trusted, "at": now.isoformat()})
    if not is_trusted:
        return {"triggered": False, "reason": "number_not_trusted", "count": 0}

    cutoff = (now - timedelta(seconds=window_sec)).isoformat()
    count = await db.call_events.count_documents(
        {"device_id": c.device_id, "from_number": norm, "trusted": True, "at": {"$gte": cutoff}})

    if count < trigger_count:
        return {"triggered": False, "count": count, "needed": trigger_count}

    await db.device_state.update_one(
        {"device_id": c.device_id},
        {"$set": {"device_id": c.device_id, "locked": True, "lost_mode": True,
                  "trap_level": 3, "call_trigger_at": _now()}}, upsert=True)
    if c.lat is not None and c.lng is not None:
        loc = {"lat": c.lat, "lng": c.lng, "at": _now()}
        await db.device_state.update_one(
            {"device_id": c.device_id},
            {"$set": {"last_location": loc}, "$push": {"location_history": {"$each": [loc], "$slice": -50}}})
    await _log_event(c.device_id, "recovery", "critical", "Recovery via trusted call",
                     f"{count} calls from a trusted number ({norm}) within 5 minutes. Tracking + evidence started.",
                     lat=c.lat, lng=c.lng)
    await _create_alert(c.device_id, "Recovery activated by trusted call",
                        f"A trusted number called {count} times - Lost Phone mode is now on.")
    _lines, _photo = await _theft_alert_payload(c.device_id)
    await _send_alert_email(c.device_id, "Digital Mate: recovery via trusted call",
                            "Recovery via trusted call", _lines, _photo)
    return {"triggered": True, "count": count, "via": "trusted_call"}


# ============================ AI Security Advisor ============================
class InsightsIn(BaseModel):
    device_id: str


@router.post("/ai-insights")
async def ai_insights(req: InsightsIn):
    """AI advisor focused on security: summarises real device signals into prioritized,
    actionable insights (suspicious activity, recognition status, battery, privacy)."""
    state = await db.device_state.find_one({"device_id": req.device_id}, {"_id": 0}) or {}
    profile = await db.owner_profiles.find_one({"device_id": req.device_id}, {"_id": 0}) or {}
    cur = db.security_events.find({"device_id": req.device_id}, {"_id": 0, "photo": 0}).sort("created_at", -1).limit(12)
    events = await cur.to_list(length=12)
    ev_lines = [f"- {e.get('severity')}: {e.get('title')} ({e.get('detail', '')[:80]})" for e in events]

    # latest battery from most recent intruder photo
    batt = None
    for e in events:
        md = e.get("metadata") or {}
        if md.get("battery") is not None:
            batt = md.get("battery"); break

    facts = {
        "trust_score_pct": round((state.get("last_trust_score", 1.0)) * 100),
        "recognition_trained": bool(profile.get("trained")),
        "trap_level": state.get("trap_level", 0),
        "lost_mode": bool(state.get("lost_mode")),
        "battery_pct": batt,
        "privacy_overall": state.get("last_scan_overall"),
        "recent_events": ev_lines or ["- no events yet"],
    }

    prompt = f"""You are Digital Mate's AI Security Advisor for a stealth anti-theft app.
Using ONLY these real device facts, return 3-5 prioritized, practical security insights.
Do NOT invent data. Do NOT claim to detect wiretaps or lawful interception.

DEVICE FACTS:
{json.dumps(facts, indent=2)}

Return STRICT JSON: {{"insights":[{{"title":"...","severity":"info|warning|critical","detail":"one sentence","action":"one concrete action"}}]}}
Focus on: owner-recognition status, any suspicious activity in recent events, battery advice if low, and privacy review if needed."""

    try:
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=f"advisor_{req.device_id}",
            system_message="You are a concise security advisor. Always reply with strict JSON only.",
        ).with_model("openai", "gpt-4o")
        raw = await chat.send_message(UserMessage(text=prompt))
        txt = raw if isinstance(raw, str) else str(raw)
        s, e = txt.find("{"), txt.rfind("}")
        data = json.loads(txt[s:e + 1]) if s >= 0 else {"insights": []}
        insights = data.get("insights", [])
        if insights:
            return {"insights": insights, "facts": facts, "source": "ai"}
    except Exception:
        pass  # fall through to deterministic rule-based insights

    # Deterministic fallback so the advisor always returns something useful.
    out = []
    if not facts["recognition_trained"]:
        out.append({"title": "Finish training owner recognition", "severity": "warning",
                    "detail": "Your behavioural model isn't trained yet, so Digital Mate can't yet tell you apart from others.",
                    "action": "Use the app normally for a bit or tap 'Capture my behaviour' in Owner Recognition."})
    if facts["trap_level"] and facts["trap_level"] >= 2:
        out.append({"title": "Suspicious activity detected", "severity": "critical",
                    "detail": "Behaviour didn't match the owner recently and Trap Mode escalated.",
                    "action": "Open the Evidence Center to review captured photos and locations."})
    if facts["battery_pct"] is not None and facts["battery_pct"] < 20:
        out.append({"title": "Low battery during monitoring", "severity": "warning",
                    "detail": f"Battery is at {facts['battery_pct']}% - tracking may stop if it dies.",
                    "action": "Charge the device or enable battery saver to keep recovery active."})
    if facts["privacy_overall"] in ("review", "high_risk"):
        out.append({"title": "Privacy review needed", "severity": "warning",
                    "detail": "Your last Privacy & Security Scan flagged items to review.",
                    "action": "Open Privacy & Security Scan and address the flagged checks."})
    if not out:
        out.append({"title": "All clear", "severity": "info",
                    "detail": "No unusual activity. Owner recognition is active and protecting your phone.",
                    "action": "Keep using your phone normally - Digital Mate keeps watching quietly."})
    return {"insights": out, "facts": facts, "source": "rules"}
