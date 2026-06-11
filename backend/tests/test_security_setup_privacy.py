"""
Digital Mate - Batch 4 tests (UPDATED for Batch 5 payload: access/recovery/wipe)
Covers /setup validation, verify-recovery, destructive endpoints guarded by Recovery/Wipe,
bcrypt at rest, and Privacy & Security Scan.
"""
import os, uuid, pytest, requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://digital-mate-mvp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/security"

ACCESS = "ax4242"
RECOVERY = "rec7421"
WIPE = "wp3344"
PHRASE = "bring it back"
TRUSTED = ["+15551234567"]


def _did(p="setup"): return f"TEST_{p}_{uuid.uuid4().hex[:8]}"
def _cleanup(d):
    try: requests.delete(f"{API}/events", params={"device_id": d}, timeout=10)
    except Exception: pass

def _setup_payload(d, **over):
    base = {"device_id": d, "owner_name": "Sam",
            "access_code": ACCESS, "recovery_code": RECOVERY, "wipe_code": WIPE,
            "recovery_phrase": PHRASE, "panic_pattern": "159",
            "trusted_numbers": TRUSTED, "cover_app": "calculator"}
    base.update(over); return base


@pytest.fixture(scope="module")
def session():
    s = requests.Session(); s.headers.update({"Content-Type": "application/json"}); return s


class TestNoDefaults:
    def test_fresh_device_not_configured(self, session):
        d = _did("fresh")
        r = session.get(f"{API}/setup/status", params={"device_id": d}, timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["configured"] is False
        assert j["trusted_numbers"] == []
        assert j["profiles"] == []
        _cleanup(d)

    def test_legacy_default_15987_blocked(self, session):
        d = _did("nodef")
        r = session.post(f"{API}/recovery/wipe", json={"device_id": d, "owner_code": "15987", "confirm": True}, timeout=10)
        assert r.status_code == 403
        r2 = session.post(f"{API}/recovery/unlock", json={"device_id": d, "owner_code": "15987"}, timeout=10)
        assert r2.status_code == 403
        _cleanup(d)


class TestSetupValidation:
    def test_empty_trusted_400(self, session):
        d = _did("v")
        r = session.post(f"{API}/setup", json=_setup_payload(d, trusted_numbers=[]), timeout=10)
        assert r.status_code == 400; _cleanup(d)

    def test_short_access_400(self, session):
        d = _did("v")
        r = session.post(f"{API}/setup", json=_setup_payload(d, access_code="ab"), timeout=10)
        assert r.status_code == 400; _cleanup(d)

    def test_short_recovery_400(self, session):
        d = _did("v")
        r = session.post(f"{API}/setup", json=_setup_payload(d, recovery_code="ab"), timeout=10)
        assert r.status_code == 400; _cleanup(d)

    def test_short_wipe_400(self, session):
        d = _did("v")
        r = session.post(f"{API}/setup", json=_setup_payload(d, wipe_code="ab"), timeout=10)
        assert r.status_code == 400; _cleanup(d)

    def test_duplicate_codes_400(self, session):
        d = _did("v")
        r = session.post(f"{API}/setup", json=_setup_payload(d, recovery_code=ACCESS), timeout=10)
        assert r.status_code == 400; _cleanup(d)

    def test_short_phrase_400(self, session):
        d = _did("v")
        r = session.post(f"{API}/setup", json=_setup_payload(d, recovery_phrase="ab"), timeout=10)
        assert r.status_code == 400; _cleanup(d)

    def test_setup_ok_and_status(self, session):
        d = _did("ok")
        r = session.post(f"{API}/setup", json=_setup_payload(d), timeout=10)
        assert r.status_code == 200
        s = session.get(f"{API}/setup/status", params={"device_id": d}, timeout=10).json()
        assert s["configured"] is True
        assert s["cover_app"] == "calculator"
        assert s["profiles"] == ["Sam"]
        assert s["trusted_numbers"] == TRUSTED
        _cleanup(d)


class TestVerifyCodes:
    @pytest.fixture(scope="class")
    def did(self, session):
        d = _did("ver")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        yield d; _cleanup(d)

    def test_access_correct(self, session, did):
        r = session.post(f"{API}/verify-access", json={"device_id": did, "code": ACCESS}, timeout=10)
        assert r.status_code == 200 and r.json()["verified"] is True
        assert r.json()["profile"] == "Sam"

    def test_access_recovery_does_not_open(self, session, did):
        r = session.post(f"{API}/verify-access", json={"device_id": did, "code": RECOVERY}, timeout=10)
        assert r.json()["verified"] is False

    def test_access_wipe_does_not_open(self, session, did):
        r = session.post(f"{API}/verify-access", json={"device_id": did, "code": WIPE}, timeout=10)
        assert r.json()["verified"] is False

    def test_verify_recovery_correct(self, session, did):
        r = session.post(f"{API}/verify-recovery", json={"device_id": did, "code": RECOVERY}, timeout=10)
        assert r.json()["verified"] is True

    def test_verify_recovery_wrong(self, session, did):
        r = session.post(f"{API}/verify-recovery", json={"device_id": did, "code": "wrong"}, timeout=10)
        assert r.json()["verified"] is False


class TestDestructiveGuarded:
    @pytest.fixture(scope="class")
    def did(self, session):
        d = _did("destr")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        yield d; _cleanup(d)

    def test_unlock_wipe_code_fails(self, session, did):
        r = session.post(f"{API}/recovery/unlock", json={"device_id": did, "owner_code": WIPE}, timeout=10)
        assert r.status_code == 403

    def test_unlock_recovery_code_ok(self, session, did):
        r = session.post(f"{API}/recovery/unlock", json={"device_id": did, "owner_code": RECOVERY}, timeout=10)
        assert r.status_code == 200

    def test_trap_deactivate_recovery_ok(self, session, did):
        r = session.post(f"{API}/trap/deactivate", json={"device_id": did, "owner_code": RECOVERY}, timeout=10)
        assert r.status_code == 200

    def test_emergency_verify_recovery(self, session, did):
        r = session.post(f"{API}/emergency/verify", json={"device_id": did, "owner_code": RECOVERY}, timeout=10)
        assert r.json()["verified"] is True

    def test_emergency_verify_access_false(self, session, did):
        r = session.post(f"{API}/emergency/verify", json={"device_id": did, "owner_code": ACCESS}, timeout=10)
        assert r.json()["verified"] is False

    def test_wipe_requires_wipe_code_recovery_403(self, session, did):
        r = session.post(f"{API}/recovery/wipe", json={"device_id": did, "owner_code": RECOVERY, "confirm": True}, timeout=10)
        assert r.status_code == 403

    def test_wipe_access_403(self, session, did):
        r = session.post(f"{API}/recovery/wipe", json={"device_id": did, "owner_code": ACCESS, "confirm": True}, timeout=10)
        assert r.status_code == 403

    def test_wipe_missing_confirm_400(self, session, did):
        r = session.post(f"{API}/recovery/wipe", json={"device_id": did, "owner_code": WIPE, "confirm": False}, timeout=10)
        assert r.status_code == 400

    def test_wipe_ok(self, session, did):
        r = session.post(f"{API}/recovery/wipe", json={"device_id": did, "owner_code": WIPE, "confirm": True}, timeout=10)
        assert r.status_code == 200 and r.json()["wiped"] is True


class TestBcryptAtRest:
    def test_hashes_are_bcrypt(self, session):
        d = _did("hash")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        from pymongo import MongoClient
        from dotenv import dotenv_values
        env = dotenv_values("/app/backend/.env")
        mongo_url = os.environ.get("MONGO_URL") or env.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME") or env.get("DB_NAME")
        client = MongoClient(mongo_url)
        cfg = client[db_name].device_config.find_one({"device_id": d})
        client.close()
        assert cfg is not None
        assert cfg["recovery_hash"].startswith("$2")
        assert cfg["wipe_hash"].startswith("$2")
        assert cfg["recovery_phrase_hash"].startswith("$2")
        # profile access_hash bcrypt
        assert cfg["profiles"][0]["access_hash"].startswith("$2")
        blob = str(cfg)
        for plain in (ACCESS, RECOVERY, WIPE):
            assert plain not in blob, f"plaintext {plain} found"
        _cleanup(d)


class TestBatch5Specific:
    """Multi-profile, recovery triggers, evidence battery, new-device event."""

    def test_profiles_add_requires_recovery(self, session):
        d = _did("prof")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        # wrong recovery -> 403
        r = session.post(f"{API}/profiles/add",
                         json={"device_id": d, "name": "Lia", "access_code": "lia999", "recovery_code": "wrong"}, timeout=10)
        assert r.status_code == 403
        # correct
        r = session.post(f"{API}/profiles/add",
                         json={"device_id": d, "name": "Lia", "access_code": "lia999", "recovery_code": RECOVERY}, timeout=10)
        assert r.status_code == 200
        assert any(p.get("name") == "Lia" for p in r.json()["profiles"])
        # new profile access unlocks
        v = session.post(f"{API}/verify-access", json={"device_id": d, "code": "lia999"}, timeout=10).json()
        assert v["verified"] is True and v["profile"] == "Lia"
        # original still unlocks
        v2 = session.post(f"{API}/verify-access", json={"device_id": d, "code": ACCESS}, timeout=10).json()
        assert v2["verified"] is True and v2["profile"] == "Sam"
        _cleanup(d)

    def test_recovery_trigger_phrase_pattern_code(self, session):
        d = _did("trig")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        # phrase case-insensitive
        r = session.post(f"{API}/recovery/trigger", json={"device_id": d, "secret": "BRING IT BACK"}, timeout=10).json()
        assert r["triggered"] is True and r["via"] == "phrase"
        # pattern
        r = session.post(f"{API}/recovery/trigger", json={"device_id": d, "secret": "159"}, timeout=10).json()
        assert r["triggered"] is True and r["via"] == "pattern"
        # code
        r = session.post(f"{API}/recovery/trigger", json={"device_id": d, "secret": RECOVERY}, timeout=10).json()
        assert r["triggered"] is True and r["via"] == "code"
        # random secret -> false
        r = session.post(f"{API}/recovery/trigger", json={"device_id": d, "secret": "random-nope"}, timeout=10).json()
        assert r["triggered"] is False
        # status reflects locked + lost_mode
        s = session.get(f"{API}/status", params={"device_id": d}, timeout=10).json()
        assert s["locked"] is True and s["lost_mode"] is True
        # alert created
        a = session.get(f"{API}/alerts", params={"device_id": d}, timeout=10).json()
        assert a["count"] >= 1
        _cleanup(d)

    def test_evidence_photo_battery(self, session):
        d = _did("ev")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        r = session.post(f"{API}/evidence/photo", json={
            "device_id": d, "photo": "data:image/jpeg;base64,xx", "reason": "trap",
            "level": 2, "battery": 73.4, "charging": True,
        }, timeout=10)
        assert r.status_code == 200
        evt = r.json()
        assert evt["metadata"]["battery"] == 73.4
        assert evt["metadata"]["charging"] is True
        assert "Battery 73%" in evt["detail"]
        _cleanup(d)

    def test_new_device_event_on_first_telemetry(self, session):
        d = _did("newdev")
        feats = {"typing_speed": 200, "touch_duration": 80}
        r = session.post(f"{API}/telemetry", json={"device_id": d, "features": feats, "label": "owner"}, timeout=10)
        assert r.status_code == 200
        # second telemetry should NOT produce another new-device event
        session.post(f"{API}/telemetry", json={"device_id": d, "features": feats, "label": "owner"}, timeout=10)
        ev = session.get(f"{API}/events", params={"device_id": d, "limit": 50}, timeout=10).json()
        newdev = [e for e in ev["events"] if e["type"] == "device_change" and "New device" in e["title"]]
        assert len(newdev) == 1
        _cleanup(d)

    def test_cover_app_stored(self, session):
        d = _did("cov")
        r = session.post(f"{API}/setup", json=_setup_payload(d, cover_app="notes"), timeout=10)
        assert r.status_code == 200
        s = session.get(f"{API}/setup/status", params={"device_id": d}, timeout=10).json()
        assert s["cover_app"] == "notes"
        _cleanup(d)
