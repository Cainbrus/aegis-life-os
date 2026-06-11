"""
Digital Mate - Expanded recognition + location/app-usage + invisible trap + device-change tests.
Covers the NEW batch:
- Full 12-feature baseline training with lat/lng + screen
- Owner score returns location_habit + app_usage signals; intruder far-location is low-trust
- Deterministic scoring
- Robustness: identical 8 samples still allow near-identical owner score to be HIGH (std floor)
- L2 escalation detail mentions silent capture (no decoy)
- POST /device-change kind='network' creates device_change event
- POST /device-change kind='sim' creates event AND owner alert
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api/security"
OWNER_CODE = "15987"

# Full 12-feature owner baseline
OWNER_FULL = {
    "typing_speed": 180.0,
    "typing_dwell": 65.0,
    "typing_flight": 110.0,
    "typing_variance": 35.0,
    "touch_duration": 90.0,
    "touch_pressure": 0.55,
    "tap_interval": 320.0,
    "swipe_velocity": 1.2,
    "swipe_length": 220.0,
    "motion_avg": 0.8,
    "hour_of_day": 10.0,
    "day_of_week": 2.0,
}
INTRUDER_FULL = {
    "typing_speed": 800.0,
    "typing_dwell": 30.0,
    "typing_flight": 350.0,
    "typing_variance": 400.0,
    "touch_duration": 400.0,
    "touch_pressure": 0.95,
    "tap_interval": 90.0,
    "swipe_velocity": 5.0,
    "swipe_length": 600.0,
    "motion_avg": 4.0,
    "hour_of_day": 3.0,
    "day_of_week": 6.0,
}

HOME_LAT, HOME_LNG = 37.7749, -122.4194
FAR_LAT, FAR_LNG = 19.0760, 72.8777  # Mumbai - thousands of km away


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _train(session, device_id, features=OWNER_FULL, identical=False, n=8,
           lat=HOME_LAT, lng=HOME_LNG, screen="home"):
    last = None
    for i in range(n):
        feats = dict(features) if identical else {k: v + (i - 3.5) * 0.5 for k, v in features.items()}
        r = session.post(f"{API}/telemetry", json={
            "device_id": device_id,
            "features": feats,
            "label": "owner",
            "lat": lat,
            "lng": lng,
            "screen": screen,
        }, timeout=15)
        assert r.status_code == 200, r.text
        last = r.json()
    return last


@pytest.fixture(scope="module")
def trained_full(session):
    did = f"TEST_exp_{uuid.uuid4().hex[:8]}"
    last = _train(session, did)
    assert last["trained"] is True
    assert last["sample_count"] >= 8
    yield did
    try:
        requests.post(f"{API}/baseline/reset", json={"device_id": did}, timeout=10)
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)
    except Exception:
        pass


# ---------------- Expanded training ----------------
class TestExpandedTraining:
    def test_status_shows_trained_after_full_features(self, session, trained_full):
        r = session.get(f"{API}/status", params={"device_id": trained_full}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["trained"] is True
        assert d["sample_count"] >= 8


# ---------------- Owner / intruder scoring with new signals ----------------
class TestExpandedScoring:
    def test_owner_score_includes_new_signals(self, session, trained_full):
        r = session.post(f"{API}/score", json={
            "device_id": trained_full,
            "features": OWNER_FULL,
            "lat": HOME_LAT, "lng": HOME_LNG, "screen": "home",
        }, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["is_owner"] is True
        assert d["trust_score"] >= 0.6
        sigs = d["signals"]
        # Expanded feature contributions present
        assert "typing_dwell" in sigs
        assert "typing_flight" in sigs
        assert "touch_pressure" in sigs
        assert "tap_interval" in sigs
        assert "swipe_length" in sigs
        assert "day_of_week" in sigs
        # Habit signals present
        assert "location_habit" in sigs
        assert "app_usage" in sigs
        assert 0 <= sigs["location_habit"] <= 1
        assert 0 <= sigs["app_usage"] <= 1

    def test_score_is_deterministic_with_habits(self, session, trained_full):
        body = {
            "device_id": trained_full, "features": OWNER_FULL,
            "lat": HOME_LAT, "lng": HOME_LNG, "screen": "home",
        }
        r1 = session.post(f"{API}/score", json=body, timeout=10).json()
        r2 = session.post(f"{API}/score", json=body, timeout=10).json()
        assert r1["trust_score"] == r2["trust_score"]
        assert r1["signals"] == r2["signals"]

    def test_intruder_far_location_unfamiliar_screen_low_trust(self, session, trained_full):
        # Reset baseline streak via owner first
        session.post(f"{API}/score", json={
            "device_id": trained_full, "features": OWNER_FULL,
            "lat": HOME_LAT, "lng": HOME_LNG, "screen": "home",
        }, timeout=10)
        r = session.post(f"{API}/score", json={
            "device_id": trained_full, "features": INTRUDER_FULL,
            "lat": FAR_LAT, "lng": FAR_LNG, "screen": "unknown_screen_xyz",
        }, timeout=10)
        d = r.json()
        assert d["trust_score"] < 0.6
        assert d["is_owner"] is False
        # location_habit should be ~0 for far location
        assert d["signals"]["location_habit"] < 0.1
        # app_usage low for unfamiliar screen
        assert d["signals"]["app_usage"] <= 0.16


# ---------------- Robustness: identical samples + std floor ----------------
class TestStdFloorRobustness:
    def test_identical_samples_still_score_owner_high(self, session):
        did = f"TEST_zero_{uuid.uuid4().hex[:8]}"
        # 8 IDENTICAL samples (zero variance)
        _train(session, did, identical=True)
        # Near-identical owner sample should still score >= 0.6 thanks to std floor
        feats = {k: v * 1.02 for k, v in OWNER_FULL.items()}  # tiny perturbation
        r = session.post(f"{API}/score", json={
            "device_id": did, "features": feats,
            "lat": HOME_LAT, "lng": HOME_LNG, "screen": "home",
        }, timeout=10)
        d = r.json()
        assert d["trust_score"] >= 0.6, f"Std floor regression - got {d['trust_score']}"
        assert d["is_owner"] is True
        # cleanup
        requests.post(f"{API}/baseline/reset", json={"device_id": did}, timeout=10)
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)


# ---------------- Invisible trap escalation detail ----------------
class TestInvisibleTrap:
    def test_l2_detail_mentions_silent_capture(self, session):
        did = f"TEST_silent_{uuid.uuid4().hex[:8]}"
        _train(session, did)
        # Two intruder hits => L2
        session.post(f"{API}/score", json={
            "device_id": did, "features": INTRUDER_FULL,
            "lat": FAR_LAT, "lng": FAR_LNG, "screen": "x",
        }, timeout=10)
        session.post(f"{API}/score", json={
            "device_id": did, "features": INTRUDER_FULL,
            "lat": FAR_LAT, "lng": FAR_LNG, "screen": "x",
        }, timeout=10)
        ev = session.get(f"{API}/events", params={"device_id": did}, timeout=10).json()["events"]
        l2 = [e for e in ev if e.get("metadata", {}).get("level") == 2]
        assert l2, "Expected L2 escalation event"
        detail = (l2[0].get("detail") or "").lower()
        assert "silent" in detail or "silently" in detail, f"Detail should mention silent: {detail}"
        assert "decoy" not in detail, "L2 detail must NOT reference decoy"
        # cleanup
        requests.post(f"{API}/baseline/reset", json={"device_id": did}, timeout=10)
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)


# ---------------- Device-change endpoint ----------------
class TestDeviceChange:
    def test_network_change_creates_event_no_alert(self, session):
        did = f"TEST_net_{uuid.uuid4().hex[:8]}"
        alerts_before = session.get(f"{API}/alerts", params={"device_id": did}, timeout=10).json()["count"]

        r = session.post(f"{API}/device-change", json={
            "device_id": did, "kind": "network", "detail": "Wi-Fi changed to CafeFreeWiFi",
            "metadata": {"ssid": "CafeFreeWiFi"},
        }, timeout=10)
        assert r.status_code == 200
        evt = r.json()
        assert evt["type"] == "device_change"
        assert evt["severity"] == "warning"
        assert "network" in evt["title"].lower()

        listed = session.get(f"{API}/events", params={"device_id": did}, timeout=10).json()
        assert any(e["type"] == "device_change" for e in listed["events"])

        alerts_after = session.get(f"{API}/alerts", params={"device_id": did}, timeout=10).json()
        # network change must NOT bump owner alerts
        assert alerts_after["count"] == alerts_before
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)

    def test_sim_change_creates_event_and_alert(self, session):
        did = f"TEST_sim_{uuid.uuid4().hex[:8]}"
        r = session.post(f"{API}/device-change", json={
            "device_id": did, "kind": "sim", "detail": "SIM IMSI changed",
        }, timeout=10)
        assert r.status_code == 200
        evt = r.json()
        assert evt["type"] == "device_change"
        assert "sim" in evt["title"].lower()

        al = session.get(f"{API}/alerts", params={"device_id": did}, timeout=10).json()
        assert al["unread"] >= 1
        assert any("sim" in (a.get("title", "") + a.get("body", "")).lower() for a in al["alerts"])
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)


# ---------------- Regression spot-check on guards ----------------
class TestRegressionGuards:
    def test_wipe_requires_owner_code(self, session):
        did = f"TEST_reg_{uuid.uuid4().hex[:8]}"
        r = session.post(f"{API}/recovery/wipe", json={"device_id": did}, timeout=10)
        assert r.status_code == 403

    def test_wipe_requires_confirm(self, session):
        did = f"TEST_reg2_{uuid.uuid4().hex[:8]}"
        # configure first so the wipe code is recognised
        session.post(f"{API}/setup", json={
            "device_id": did, "owner_name": "Sam",
            "access_code": "ax1234", "recovery_code": OWNER_CODE, "wipe_code": "wipe888",
            "recovery_phrase": "bring it back",
            "trusted_numbers": ["+15551234567"], "cover_app": "calculator",
        }, timeout=10)
        r = session.post(f"{API}/recovery/wipe", json={
            "device_id": did, "owner_code": "wipe888", "confirm": False,
        }, timeout=10)
        assert r.status_code == 400

    def test_trap_deactivate_requires_owner_code(self, session):
        did = f"TEST_reg3_{uuid.uuid4().hex[:8]}"
        r = session.post(f"{API}/trap/deactivate", json={
            "device_id": did, "owner_code": "00000",
        }, timeout=10)
        assert r.status_code == 403
