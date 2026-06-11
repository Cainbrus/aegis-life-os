"""
Digital Mate - Batch 9: Additive weighted trust model + configurable trusted-caller recovery.

Covers:
- Family-member with WRONG typing but pin_ok=true + known_device=1 + home location + normal
  screen STAYS >=0.70 (no false alarm, is_owner True, trap_level 0)
- Signals dict exposes the new factor keys: behaviour, location_habit, known_device, pin, app_usage
- Thief: wrong features + pin_ok=False + known_device=0 + far location -> trust < 0.20, first
  reading trap_level 2 (debounced), second identical low reading -> trap_level 3 (Recovery)
  and device locked + lost_mode
- An owner-matching reading after a thief escalation resets trap_level to 0
- Determinism: same /score payload yields identical trust_score
- Untrained device still returns trust 1.0 / is_owner True (learning phase)
- Configurable /recovery/call-trigger: count=2 fires on 2nd call, count=5 does not fire on 2nd
- Untrusted number never triggers regardless of count
- GET /setup/status returns persisted call_trigger config + trusted/backup numbers + profiles+cover
"""
import os
import uuid
import pytest
import requests
from dotenv import dotenv_values

_fe = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api/security"

OWNER_FULL = {
    "typing_speed": 180.0, "typing_dwell": 65.0, "typing_flight": 110.0,
    "typing_variance": 35.0, "touch_duration": 90.0, "touch_pressure": 0.55,
    "tap_interval": 320.0, "swipe_velocity": 1.2, "swipe_length": 220.0,
    "motion_avg": 0.8, "hour_of_day": 10.0, "day_of_week": 2.0,
}
# Family member: very different typing/touch (kid with fast fingers)
FAMILY_FEATURES = {
    "typing_speed": 600.0, "typing_dwell": 25.0, "typing_flight": 280.0,
    "typing_variance": 300.0, "touch_duration": 350.0, "touch_pressure": 0.9,
    "tap_interval": 110.0, "swipe_velocity": 4.5, "swipe_length": 550.0,
    "motion_avg": 3.5, "hour_of_day": 16.0, "day_of_week": 5.0,
}
THIEF_FEATURES = dict(FAMILY_FEATURES)

HOME_LAT, HOME_LNG = 37.7749, -122.4194
FAR_LAT, FAR_LNG = 19.0760, 72.8777


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _setup(session, device_id, **overrides):
    payload = {
        "device_id": device_id,
        "owner_name": "Sam",
        "access_code": "ax1234",
        "recovery_code": "rec999",
        "wipe_code": "wipe888",
        "recovery_phrase": "bring it back",
        "trusted_numbers": ["+15551234567"],
        "backup_numbers": [],
        "cover_app": "calculator",
        "call_trigger_count": 3,
        "call_trigger_window_sec": 300,
    }
    payload.update(overrides)
    r = session.post(f"{API}/setup", json=payload, timeout=10)
    assert r.status_code == 200, r.text


def _train(session, device_id, n=9, lat=HOME_LAT, lng=HOME_LNG, screen="home"):
    for i in range(n):
        feats = {k: v + (i - 4.0) * 0.5 for k, v in OWNER_FULL.items()}
        r = session.post(f"{API}/telemetry", json={
            "device_id": device_id, "features": feats, "label": "owner",
            "lat": lat, "lng": lng, "screen": screen,
        }, timeout=15)
        assert r.status_code == 200


# -------------------- Additive trust model --------------------
class TestAdditiveTrustModel:
    @pytest.fixture(scope="class")
    def trained(self, session):
        did = f"TEST_b9_add_{uuid.uuid4().hex[:8]}"
        _setup(session, did)
        _train(session, did)
        yield did
        try:
            requests.post(f"{API}/baseline/reset", json={"device_id": did}, timeout=10)
            requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)
        except Exception:
            pass

    def test_family_member_with_pin_and_known_device_stays_owner(self, session, trained):
        """Bad typing BUT pin_ok=True + known_device=1 + home + normal screen -> >=0.70."""
        r = session.post(f"{API}/score", json={
            "device_id": trained, "features": FAMILY_FEATURES,
            "lat": HOME_LAT, "lng": HOME_LNG, "screen": "home",
            "pin_ok": True, "known_device": 1,
        }, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["trust_score"] >= 0.70, f"Family false-alarm! trust={d['trust_score']}"
        assert d["is_owner"] is True
        assert d["trap_level"] == 0
        assert d["trap_active"] is False

    def test_signals_dict_exposes_new_factor_keys(self, session, trained):
        r = session.post(f"{API}/score", json={
            "device_id": trained, "features": FAMILY_FEATURES,
            "lat": HOME_LAT, "lng": HOME_LNG, "screen": "home",
            "pin_ok": True, "known_device": 1,
        }, timeout=10).json()
        s = r["signals"]
        for key in ("behaviour", "location_habit", "known_device", "pin", "app_usage"):
            assert key in s, f"Missing factor '{key}' in signals: {list(s.keys())}"
        assert s["pin"] == 1.0
        assert 0 <= s["known_device"] <= 1
        assert 0 <= s["behaviour"] <= 1


# -------------------- Thief escalation (debounced bands) --------------------
class TestThiefEscalation:
    @pytest.fixture(scope="class")
    def trained(self, session):
        did = f"TEST_b9_thief_{uuid.uuid4().hex[:8]}"
        _setup(session, did)
        _train(session, did)
        yield did
        try:
            requests.post(f"{API}/baseline/reset", json={"device_id": did}, timeout=10)
            requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)
        except Exception:
            pass

    def test_thief_first_reading_trap_level_2(self, session, trained):
        r = session.post(f"{API}/score", json={
            "device_id": trained, "features": THIEF_FEATURES,
            "lat": FAR_LAT, "lng": FAR_LNG, "screen": "unknown_xyz",
            "pin_ok": False, "known_device": 0,
        }, timeout=10).json()
        assert r["trust_score"] < 0.20, f"Expected <0.20, got {r['trust_score']}"
        assert r["is_owner"] is False
        # debounced: <0.20 on first reading -> level 2, not yet 3
        assert r["trap_level"] == 2

    def test_thief_second_reading_trap_level_3_locks_device(self, session, trained):
        r = session.post(f"{API}/score", json={
            "device_id": trained, "features": THIEF_FEATURES,
            "lat": FAR_LAT, "lng": FAR_LNG, "screen": "unknown_xyz",
            "pin_ok": False, "known_device": 0,
        }, timeout=10).json()
        assert r["trap_level"] == 3
        assert r["trap_active"] is True
        st = session.get(f"{API}/status", params={"device_id": trained}).json()
        assert st["locked"] is True
        assert st["lost_mode"] is True

    def test_owner_reading_resets_to_level_0(self, session, trained):
        r = session.post(f"{API}/score", json={
            "device_id": trained, "features": OWNER_FULL,
            "lat": HOME_LAT, "lng": HOME_LNG, "screen": "home",
            "pin_ok": True, "known_device": 1,
        }, timeout=10).json()
        assert r["is_owner"] is True
        assert r["trap_level"] == 0
        assert r["streak"] == 0


# -------------------- Determinism & learning phase --------------------
class TestDeterminismAndLearning:
    def test_score_is_deterministic(self, session):
        did = f"TEST_b9_det_{uuid.uuid4().hex[:8]}"
        _setup(session, did)
        _train(session, did)
        body = {
            "device_id": did, "features": OWNER_FULL,
            "lat": HOME_LAT, "lng": HOME_LNG, "screen": "home",
            "pin_ok": True, "known_device": 1,
        }
        r1 = session.post(f"{API}/score", json=body, timeout=10).json()
        r2 = session.post(f"{API}/score", json=body, timeout=10).json()
        assert r1["trust_score"] == r2["trust_score"]
        assert r1["signals"] == r2["signals"]
        requests.post(f"{API}/baseline/reset", json={"device_id": did}, timeout=10)
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)

    def test_untrained_device_returns_learning_trust_1(self, session):
        did = f"TEST_b9_learn_{uuid.uuid4().hex[:8]}"
        r = session.post(f"{API}/score", json={
            "device_id": did, "features": OWNER_FULL,
        }, timeout=10).json()
        assert r["trust_score"] == 1.0
        assert r["is_owner"] is True
        assert r.get("status") == "learning"


# -------------------- Configurable trusted-caller recovery --------------------
class TestConfigurableCallTrigger:
    def test_count_2_triggers_on_second_call(self, session):
        did = f"TEST_b9_call2_{uuid.uuid4().hex[:8]}"
        _setup(session, did, call_trigger_count=2, call_trigger_window_sec=120,
               trusted_numbers=["+15551234567"])
        # 1st call -> not triggered
        r1 = session.post(f"{API}/recovery/call-trigger", json={
            "device_id": did, "from_number": "+15551234567",
        }, timeout=10).json()
        assert r1["triggered"] is False
        assert r1.get("count") == 1
        assert r1.get("needed") == 2
        # 2nd call -> trigger
        r2 = session.post(f"{API}/recovery/call-trigger", json={
            "device_id": did, "from_number": "+15551234567",
        }, timeout=10).json()
        assert r2["triggered"] is True
        assert r2["count"] >= 2
        st = session.get(f"{API}/status", params={"device_id": did}).json()
        assert st["locked"] is True
        assert st["lost_mode"] is True
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)

    def test_count_5_does_not_trigger_on_second_call(self, session):
        did = f"TEST_b9_call5_{uuid.uuid4().hex[:8]}"
        _setup(session, did, call_trigger_count=5, call_trigger_window_sec=300,
               trusted_numbers=["+15551234567"])
        for _ in range(2):
            r = session.post(f"{API}/recovery/call-trigger", json={
                "device_id": did, "from_number": "+15551234567",
            }, timeout=10).json()
        assert r["triggered"] is False
        assert r["needed"] == 5
        st = session.get(f"{API}/status", params={"device_id": did}).json()
        assert st["locked"] is False
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)

    def test_untrusted_number_never_triggers(self, session):
        did = f"TEST_b9_call_u_{uuid.uuid4().hex[:8]}"
        _setup(session, did, call_trigger_count=2, call_trigger_window_sec=120,
               trusted_numbers=["+15551234567"])
        for _ in range(5):
            r = session.post(f"{API}/recovery/call-trigger", json={
                "device_id": did, "from_number": "+19998887777",
            }, timeout=10).json()
            assert r["triggered"] is False
            assert r.get("reason") == "number_not_trusted"
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)


# -------------------- /setup/status returns config --------------------
class TestSetupStatusPersistence:
    def test_setup_status_returns_persisted_config(self, session):
        did = f"TEST_b9_status_{uuid.uuid4().hex[:8]}"
        _setup(session, did, call_trigger_count=4, call_trigger_window_sec=180,
               trusted_numbers=["+15551111111"], backup_numbers=["+15552222222"],
               cover_app="notes")
        r = session.get(f"{API}/setup/status", params={"device_id": did}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["configured"] is True
        assert d["cover_app"] == "notes"
        assert "Sam" in d["profiles"]
        assert "+15551111111" in d["trusted_numbers"]
        assert "+15552222222" in d["backup_numbers"]
