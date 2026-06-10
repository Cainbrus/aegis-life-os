"""
Digital Mate - Security Engine Backend Tests
Covers: telemetry training, scoring (deterministic), trap auto-activation,
events log, recovery (lock/unlock/wipe), location, trap deactivation.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://digital-mate-mvp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/security"
OWNER_CODE = "15987"

# Owner baseline features (used to train and for "close" score)
OWNER_FEATURES = {
    "typing_speed": 180.0,
    "typing_variance": 35.0,
    "touch_duration": 90.0,
    "swipe_velocity": 1.2,
    "motion_avg": 0.8,
    "hour_of_day": 10.0,
}

# Intruder features (very different) - should yield low trust
INTRUDER_FEATURES = {
    "typing_speed": 800.0,
    "typing_variance": 400.0,
    "touch_duration": 400.0,
    "swipe_velocity": 5.0,
    "motion_avg": 4.0,
    "hour_of_day": 3.0,
}


@pytest.fixture(scope="module")
def device_id():
    did = f"TEST_dev_{uuid.uuid4().hex[:10]}"
    yield did
    # cleanup
    try:
        requests.post(f"{API}/baseline/reset", json={"device_id": did}, timeout=10)
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)
    except Exception:
        pass


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ------------------ Training / Telemetry ------------------
class TestTraining:
    def test_train_baseline_with_8_samples(self, session, device_id):
        last = None
        for i in range(8):
            # symmetric jitter so trained mean stays at OWNER_FEATURES and std > 0
            offset = (i - 3.5) * 0.5
            feats = {k: v + offset for k, v in OWNER_FEATURES.items()}
            r = session.post(f"{API}/telemetry", json={
                "device_id": device_id,
                "features": feats,
                "label": "owner",
            }, timeout=15)
            assert r.status_code == 200, r.text
            last = r.json()
        assert last["sample_count"] >= 8
        assert last["trained"] is True

    def test_status_after_training(self, session, device_id):
        r = session.get(f"{API}/status", params={"device_id": device_id}, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["trained"] is True
        assert data["sample_count"] >= 8
        assert data["samples_needed"] == 0

    def test_telemetry_rejects_empty_features(self, session, device_id):
        r = session.post(f"{API}/telemetry", json={
            "device_id": device_id, "features": {}, "label": "owner"
        }, timeout=10)
        assert r.status_code == 400


# ------------------ Scoring ------------------
class TestScoring:
    def test_score_owner_high_trust(self, session, device_id):
        r = session.post(f"{API}/score", json={
            "device_id": device_id, "features": OWNER_FEATURES
        }, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["trust_score"] >= 0.6, f"Expected >=0.6, got {d['trust_score']}"
        assert d["is_owner"] is True
        assert d["trap_active"] is False
        assert "signals" in d

    def test_score_is_deterministic(self, session, device_id):
        r1 = session.post(f"{API}/score", json={
            "device_id": device_id, "features": OWNER_FEATURES
        }, timeout=10).json()
        r2 = session.post(f"{API}/score", json={
            "device_id": device_id, "features": OWNER_FEATURES
        }, timeout=10).json()
        assert r1["trust_score"] == r2["trust_score"], "Score must be deterministic"

    def test_score_intruder_low_trust_and_trap(self, session, device_id):
        # Escalation: 1st low-trust => L1 (logging only), 2nd => L2 (trap_active)
        r1 = session.post(f"{API}/score", json={
            "device_id": device_id, "features": INTRUDER_FEATURES
        }, timeout=10).json()
        assert r1["trust_score"] < 0.6
        assert r1["is_owner"] is False
        assert r1["trap_level"] == 1
        assert r1["trap_active"] is False

        r2 = session.post(f"{API}/score", json={
            "device_id": device_id, "features": INTRUDER_FEATURES
        }, timeout=10).json()
        assert r2["trap_level"] == 2
        assert r2["trap_active"] is True

    def test_intruder_logs_critical_event(self, session, device_id):
        r = session.get(f"{API}/events", params={"device_id": device_id}, timeout=10)
        assert r.status_code == 200
        events = r.json()["events"]
        # After L2 we should have a critical access_attempt event
        critical = [e for e in events if e["severity"] == "critical"
                    and e["type"] == "access_attempt"]
        assert len(critical) >= 1


# ------------------ Recovery ------------------
class TestRecovery:
    def test_lock(self, session, device_id):
        r = session.post(f"{API}/recovery/lock", json={"device_id": device_id}, timeout=10)
        assert r.status_code == 200
        assert r.json()["locked"] is True
        st = session.get(f"{API}/status", params={"device_id": device_id}, timeout=10).json()
        assert st["locked"] is True
        assert st["lost_mode"] is True

    def test_wipe_without_owner_code_403(self, session, device_id):
        r = session.post(f"{API}/recovery/wipe", json={"device_id": device_id}, timeout=10)
        assert r.status_code == 403

    def test_wipe_with_code_but_no_confirm_400(self, session, device_id):
        r = session.post(f"{API}/recovery/wipe", json={
            "device_id": device_id, "owner_code": OWNER_CODE, "confirm": False
        }, timeout=10)
        assert r.status_code == 400

    def test_wipe_with_code_and_confirm(self, session, device_id):
        r = session.post(f"{API}/recovery/wipe", json={
            "device_id": device_id, "owner_code": OWNER_CODE, "confirm": True
        }, timeout=10)
        assert r.status_code == 200
        assert r.json()["wiped"] is True
        st = session.get(f"{API}/status", params={"device_id": device_id}, timeout=10).json()
        assert st["wiped"] is True

    def test_unlock_with_owner_code(self, session, device_id):
        r = session.post(f"{API}/recovery/unlock", json={
            "device_id": device_id, "owner_code": OWNER_CODE
        }, timeout=10)
        assert r.status_code == 200
        assert r.json()["locked"] is False
        st = session.get(f"{API}/status", params={"device_id": device_id}, timeout=10).json()
        assert st["locked"] is False

    def test_unlock_wrong_code_403(self, session, device_id):
        r = session.post(f"{API}/recovery/unlock", json={
            "device_id": device_id, "owner_code": "00000"
        }, timeout=10)
        assert r.status_code == 403


# ------------------ Locate ------------------
class TestLocate:
    def test_locate_stores_location(self, session, device_id):
        r = session.post(f"{API}/recovery/locate", json={
            "device_id": device_id, "lat": 37.7749, "lng": -122.4194
        }, timeout=10)
        assert r.status_code == 200
        loc = r.json()["location"]
        assert loc["lat"] == 37.7749
        assert loc["lng"] == -122.4194

    def test_get_location(self, session, device_id):
        r = session.get(f"{API}/recovery/location", params={"device_id": device_id}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["last_location"]["lat"] == 37.7749


# ------------------ Trap ------------------
class TestTrap:
    def test_trap_deactivate_wrong_code_403(self, session, device_id):
        r = session.post(f"{API}/trap/deactivate", json={
            "device_id": device_id, "owner_code": "wrong"
        }, timeout=10)
        assert r.status_code == 403

    def test_trap_activate_and_deactivate(self, session, device_id):
        a = session.post(f"{API}/trap/activate", json={"device_id": device_id}, timeout=10)
        assert a.status_code == 200
        assert a.json()["trap_active"] is True

        d = session.post(f"{API}/trap/deactivate", json={
            "device_id": device_id, "owner_code": OWNER_CODE
        }, timeout=10)
        assert d.status_code == 200
        assert d.json()["trap_active"] is False
