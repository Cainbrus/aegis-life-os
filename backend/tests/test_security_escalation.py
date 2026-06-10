"""
Digital Mate - Security Engine Escalation/Panic/Evidence Tests
Covers: Trap escalation L1->L2->L3 (with auto-lock/lost_mode + alert), owner reset of streak,
evidence photo upload, panic mode (lock + alert + last_location), alerts endpoint.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api/security"
OWNER_CODE = "15987"

OWNER_FEATURES = {
    "typing_speed": 180.0, "typing_variance": 35.0, "touch_duration": 90.0,
    "swipe_velocity": 1.2, "motion_avg": 0.8, "hour_of_day": 10.0,
}
INTRUDER_FEATURES = {
    "typing_speed": 800.0, "typing_variance": 400.0, "touch_duration": 400.0,
    "swipe_velocity": 5.0, "motion_avg": 4.0, "hour_of_day": 3.0,
}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def trained_device(session):
    did = f"TEST_esc_{uuid.uuid4().hex[:10]}"
    # train baseline
    for i in range(8):
        offset = (i - 3.5) * 0.5
        feats = {k: v + offset for k, v in OWNER_FEATURES.items()}
        r = session.post(f"{API}/telemetry",
                         json={"device_id": did, "features": feats, "label": "owner"},
                         timeout=15)
        assert r.status_code == 200
    yield did
    # cleanup
    try:
        requests.post(f"{API}/baseline/reset", json={"device_id": did}, timeout=10)
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)
    except Exception:
        pass


# ---------------- Trap Escalation ----------------
class TestTrapEscalation:
    def test_level1_first_intruder_score(self, session, trained_device):
        r = session.post(f"{API}/score",
                         json={"device_id": trained_device, "features": INTRUDER_FEATURES},
                         timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["is_owner"] is False
        assert d["trap_level"] == 1
        assert d["trap_active"] is False
        assert d["streak"] == 1

        # status reflects
        st = session.get(f"{API}/status", params={"device_id": trained_device}).json()
        assert st["trap_level"] == 1
        assert st["trap_active"] is False
        assert st["locked"] is False

        # L1 access_attempt warning event logged
        ev = session.get(f"{API}/events", params={"device_id": trained_device}).json()["events"]
        l1 = [e for e in ev if e["type"] == "access_attempt"
              and e.get("metadata", {}).get("level") == 1]
        assert len(l1) >= 1
        assert l1[0]["severity"] == "warning"

    def test_level2_second_intruder_score(self, session, trained_device):
        r = session.post(f"{API}/score",
                         json={"device_id": trained_device, "features": INTRUDER_FEATURES},
                         timeout=10)
        d = r.json()
        assert d["trap_level"] == 2
        assert d["trap_active"] is True
        assert d["streak"] == 2

        st = session.get(f"{API}/status", params={"device_id": trained_device}).json()
        assert st["trap_level"] == 2
        assert st["trap_active"] is True
        assert st["locked"] is False  # not yet locked at L2

        ev = session.get(f"{API}/events", params={"device_id": trained_device}).json()["events"]
        l2 = [e for e in ev if e["type"] == "access_attempt"
              and e.get("metadata", {}).get("level") == 2]
        assert len(l2) >= 1
        assert l2[0]["severity"] == "critical"

    def test_level3_third_intruder_score_locks_device(self, session, trained_device):
        r = session.post(f"{API}/score",
                         json={"device_id": trained_device, "features": INTRUDER_FEATURES,
                               "lat": 12.97, "lng": 77.59},
                         timeout=10)
        d = r.json()
        assert d["trap_level"] == 3
        assert d["trap_active"] is True

        st = session.get(f"{API}/status", params={"device_id": trained_device}).json()
        assert st["trap_level"] == 3
        assert st["locked"] is True
        assert st["lost_mode"] is True

        # L3 alert was created
        al = session.get(f"{API}/alerts", params={"device_id": trained_device}).json()
        assert al["count"] >= 1
        assert al["unread"] >= 1
        assert any("theft" in (a.get("title", "") + a.get("body", "")).lower()
                   for a in al["alerts"])

    def test_owner_score_resets_streak(self, session, trained_device):
        r = session.post(f"{API}/score",
                         json={"device_id": trained_device, "features": OWNER_FEATURES},
                         timeout=10)
        d = r.json()
        assert d["is_owner"] is True
        assert d["trap_level"] == 0
        assert d["streak"] == 0
        assert d["trap_active"] is False


# ---------------- Evidence Photo ----------------
class TestEvidencePhoto:
    def test_post_photo_creates_event(self, session):
        did = f"TEST_photo_{uuid.uuid4().hex[:8]}"
        photo_data = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="  # tiny stub
        r = session.post(f"{API}/evidence/photo", json={
            "device_id": did, "photo": photo_data, "level": 2,
            "lat": 19.07, "lng": 72.87,
        }, timeout=10)
        assert r.status_code == 200
        ev = r.json()
        assert ev["type"] == "intruder_photo"
        assert ev["severity"] == "critical"
        assert ev["metadata"]["photo"] == photo_data
        assert ev["metadata"]["level"] == 2

        # GET /events returns it with metadata.photo
        listed = session.get(f"{API}/events", params={"device_id": did}).json()
        assert listed["count"] >= 1
        evt = next((e for e in listed["events"] if e["type"] == "intruder_photo"), None)
        assert evt is not None
        assert evt["metadata"].get("photo") == photo_data
        # cleanup
        requests.delete(f"{API}/events", params={"device_id": did})


# ---------------- Panic ----------------
class TestPanic:
    def test_panic_locks_and_alerts(self, session):
        did = f"TEST_panic_{uuid.uuid4().hex[:8]}"
        r = session.post(f"{API}/panic", json={
            "device_id": did, "lat": 28.61, "lng": 77.20,
        }, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["locked"] is True
        assert d["trap_level"] == 3

        st = session.get(f"{API}/status", params={"device_id": did}).json()
        assert st["locked"] is True
        assert st["lost_mode"] is True
        assert st["trap_active"] is False
        assert st["last_location"]["lat"] == 28.61
        assert st["last_location"]["lng"] == 77.20

        al = session.get(f"{API}/alerts", params={"device_id": did}).json()
        assert al["count"] >= 1
        assert al["unread"] >= 1
        # cleanup
        requests.post(f"{API}/recovery/unlock",
                      json={"device_id": did, "owner_code": OWNER_CODE})
        requests.delete(f"{API}/events", params={"device_id": did})


# ---------------- Alerts ----------------
class TestAlerts:
    def test_alerts_shape(self, session):
        did = f"TEST_alerts_{uuid.uuid4().hex[:8]}"
        # trigger via panic to create one alert
        session.post(f"{API}/panic", json={"device_id": did}, timeout=10)
        r = session.get(f"{API}/alerts", params={"device_id": did}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "alerts" in d and "count" in d and "unread" in d
        assert isinstance(d["alerts"], list)
        assert d["count"] >= 1
        # cleanup
        requests.delete(f"{API}/events", params={"device_id": did})
