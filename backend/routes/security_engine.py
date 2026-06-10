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
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

# --- DB (re-use same Mongo instance / DB as the main app) ---
mongo_url = os.environ['MONGO_URL']
_client = AsyncIOMotorClient(mongo_url)
db = _client[os.environ['DB_NAME']]

router = APIRouter(prefix="/api/security", tags=["security"])

# Numeric behavioural features the recognition engine understands.
FEATURE_KEYS = [
    "typing_speed",       # avg ms between key presses
    "typing_variance",    # std dev of key intervals
    "touch_duration",     # avg ms a touch is held
    "swipe_velocity",     # avg px/ms of swipes
    "motion_avg",         # avg accelerometer magnitude
    "hour_of_day",        # 0-23 when device is used
]

MIN_SAMPLES_TO_TRAIN = 8          # samples needed before a baseline is usable
OWNER_TRUST_THRESHOLD = 0.60      # below this -> likely intruder
# Owner emergency / recovery secret (verify before destructive actions).
OWNER_SECRET = os.environ.get("OWNER_RECOVERY_CODE", "15987")


# ============================ Models ============================
class TelemetrySample(BaseModel):
    device_id: str
    features: Dict[str, float] = Field(default_factory=dict)
    label: str = "owner"  # owner telemetry trains the baseline


class ScoreRequest(BaseModel):
    device_id: str
    features: Dict[str, float] = Field(default_factory=dict)
    lat: Optional[float] = None
    lng: Optional[float] = None


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


def _gaussian_similarity(x: float, mean: float, std: float) -> float:
    """Per-feature similarity in [0,1]; 1.0 = identical to baseline."""
    std = max(std, 1e-6)
    z = (x - mean) / std
    return math.exp(-0.5 * z * z)


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
        baseline[key] = {"mean": mean, "std": math.sqrt(var)}

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

    count = await db.behavior_samples.count_documents(
        {"device_id": sample.device_id, "label": "owner"}
    )
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
    sims = []
    contributions = {}
    for key in FEATURE_KEYS:
        if key in feats and key in baseline:
            sim = _gaussian_similarity(feats[key], baseline[key]["mean"], baseline[key]["std"])
            sims.append(sim)
            contributions[key] = round(sim, 3)

    if not sims:
        return {"trust_score": 1.0, "is_owner": True, "trap_active": False, "status": "no_signal"}

    trust = sum(sims) / len(sims)
    is_owner = trust >= OWNER_TRUST_THRESHOLD

    # Persist latest trust + (optional) location.
    update = {"last_trust_score": round(trust, 3), "last_scored_at": _now()}
    if req.lat is not None and req.lng is not None:
        update["last_location"] = {"lat": req.lat, "lng": req.lng, "at": _now()}
    await db.device_state.update_one(
        {"device_id": req.device_id},
        {"$set": {**update, "device_id": req.device_id}},
        upsert=True,
    )

    trap_active = False
    if not is_owner:
        # Low trust -> activate trap mode + log intruder evidence.
        state = await db.device_state.find_one({"device_id": req.device_id}, {"_id": 0}) or {}
        if not state.get("trap_active"):
            await db.device_state.update_one(
                {"device_id": req.device_id},
                {"$set": {"trap_active": True, "trap_started_at": _now()}},
                upsert=True,
            )
            await _log_event(
                req.device_id, "access_attempt", "critical",
                "Unrecognized user detected",
                f"Behavioural trust score {round(trust*100)}% is below the {int(OWNER_TRUST_THRESHOLD*100)}% owner threshold. Trap Mode activated.",
                metadata={"trust_score": round(trust, 3), "signals": contributions},
                lat=req.lat, lng=req.lng,
            )
        trap_active = True

    return {
        "trust_score": round(trust, 3),
        "is_owner": is_owner,
        "trap_active": trap_active,
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
        "locked": bool(state.get("locked", False)),
        "lost_mode": bool(state.get("lost_mode", False)),
        "wiped": bool(state.get("wiped", False)),
        "last_location": state.get("last_location"),
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
    if req.owner_code != OWNER_SECRET:
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


@router.post("/recovery/unlock")
async def recovery_unlock(req: RecoveryAction):
    if req.owner_code != OWNER_SECRET:
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
    """Safe, owner-verified, confirmed remote wipe of app data/vault."""
    if req.owner_code != OWNER_SECRET:
        raise HTTPException(status_code=403, detail="Owner verification required")
    if not req.confirm:
        raise HTTPException(status_code=400, detail="Confirmation required to wipe")

    # Wipe app-scoped sensitive data for this device.
    await db.vault_files.delete_many({"device_id": req.device_id})
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
    """Verify a hidden owner secret before exposing destructive emergency actions."""
    ok = req.owner_code == OWNER_SECRET
    return {"verified": ok}
