"""Batch 7: LiveMonitor backend - verify-access stores last_owner; status returns
last_owner / last_unlocked_at / last_scored_at."""
import os
import uuid
import pytest
import requests
from dotenv import dotenv_values

_fe = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api/security"


@pytest.fixture(scope="module")
def device_id():
    return f"TEST_b7_{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def configured_device(device_id):
    r = requests.post(
        f"{API}/setup",
        json={
            "device_id": device_id,
            "owner_name": "Sam",
            "access_code": "2580",
            "recovery_code": "rec999",
            "wipe_code": "wipe888",
            "recovery_phrase": "bring it back",
            "trusted_numbers": ["+15550009999"],
            "cover_app": "calculator",
        },
        timeout=15,
    )
    assert r.status_code == 200, r.text
    return device_id


# --- verify-access stores last_owner ---
def test_verify_access_stores_last_owner(configured_device):
    r = requests.post(f"{API}/verify-access", json={"device_id": configured_device, "code": "2580"}, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["verified"] is True
    assert data["profile"] == "Sam"

    s = requests.get(f"{API}/status", params={"device_id": configured_device}, timeout=10).json()
    assert s["last_owner"] == "Sam"
    assert isinstance(s["last_unlocked_at"], str) and len(s["last_unlocked_at"]) > 0


def test_verify_access_invalid_does_not_set_owner(configured_device):
    bad_dev = f"TEST_b7_bad_{uuid.uuid4().hex[:6]}"
    # not configured -> verified False, last_owner remains None
    r = requests.post(f"{API}/verify-access", json={"device_id": bad_dev, "code": "0000"}, timeout=10)
    assert r.status_code == 200
    assert r.json()["verified"] is False
    s = requests.get(f"{API}/status", params={"device_id": bad_dev}, timeout=10).json()
    assert s.get("last_owner") is None


# --- status returns last_scored_at after a score() call (post-training) ---
def test_status_includes_last_scored_at(configured_device):
    # Seed enough owner samples to train baseline (then score will write last_scored_at)
    for _ in range(9):
        requests.post(
            f"{API}/telemetry",
            json={
                "device_id": configured_device,
                "label": "owner",
                "features": {"typing_speed": 180, "typing_dwell": 90, "typing_flight": 70,
                             "typing_variance": 30, "touch_duration": 95, "touch_pressure": 0.5,
                             "tap_interval": 400, "swipe_velocity": 2, "swipe_length": 200,
                             "motion_avg": 10, "hour_of_day": 14, "day_of_week": 3},
            },
            timeout=10,
        )
    requests.post(
        f"{API}/score",
        json={
            "device_id": configured_device,
            "features": {"typing_speed": 180, "touch_duration": 95},
            "lat": 12.97,
            "lng": 77.59,
        },
        timeout=10,
    )
    s = requests.get(f"{API}/status", params={"device_id": configured_device}, timeout=10).json()
    assert "last_owner" in s and "last_unlocked_at" in s and "last_scored_at" in s
    assert isinstance(s["last_scored_at"], str) and len(s["last_scored_at"]) > 0


# --- regression: status still returns existing fields ---
def test_status_existing_fields_intact(configured_device):
    s = requests.get(f"{API}/status", params={"device_id": configured_device}, timeout=10).json()
    for key in ["trust_score", "trap_level", "lost_mode", "trap_active",
                "locked", "trained", "sample_count", "last_location"]:
        assert key in s, f"missing {key}"


def test_cleanup(configured_device):
    requests.delete(f"{API}/events", params={"device_id": configured_device}, timeout=10)
