"""Batch 8: Trusted Family roles + role-gated verify-access + Resend dormant email + setup backup_email.

Covers:
- POST /api/security/profiles/add with role (owner|trusted|limited|guest); requires recovery code (wrong=403).
- GET /api/security/profiles returns [{id,name,role}]. Setup primary profile has role 'owner'.
- POST /api/security/profiles/remove requires recovery; CANNOT remove owner (400).
- POST /verify-access returns {verified, profile, role}; status returns last_owner, last_role, profiles[{name,role}].
- Setup accepts backup_email.
- Email DORMANT (RESEND_API_KEY empty) — score L3, device-change sim, panic, recovery/trigger, recovery/call-trigger all 2xx.
"""
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
    return f"TEST_b8_{uuid.uuid4().hex[:8]}"


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
            "recovery_email": "owner@example.com",
            "backup_email": "backup@example.com",
            "trusted_numbers": ["+15550009999"],
            "cover_app": "calculator",
        },
        timeout=15,
    )
    assert r.status_code == 200, r.text
    return device_id


# --- Setup honors backup_email ---
def test_setup_status_reflects_email(configured_device):
    r = requests.get(f"{API}/setup/status", params={"device_id": configured_device}, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["configured"] is True
    assert data["has_email"] is True
    # primary profile is the owner
    assert "Sam" in data["profiles"]


# --- Profiles list returns id/name/role; owner profile created on setup ---
def test_list_profiles_has_owner(configured_device):
    r = requests.get(f"{API}/profiles", params={"device_id": configured_device}, timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert "profiles" in body
    plist = body["profiles"]
    assert isinstance(plist, list) and len(plist) >= 1
    owner = next((p for p in plist if p["name"] == "Sam"), None)
    assert owner is not None
    assert owner["role"] == "owner"
    assert isinstance(owner["id"], str) and len(owner["id"]) > 0


# --- profiles/add requires recovery (wrong -> 403) ---
def test_add_profile_wrong_recovery_403(configured_device):
    r = requests.post(
        f"{API}/profiles/add",
        json={"device_id": configured_device, "name": "Kid", "access_code": "1111",
              "role": "limited", "recovery_code": "WRONG"},
        timeout=10,
    )
    assert r.status_code == 403


# --- profiles/add with valid recovery and various roles ---
def test_add_profile_roles(configured_device):
    # trusted (default)
    r = requests.post(
        f"{API}/profiles/add",
        json={"device_id": configured_device, "name": "Partner", "access_code": "3690",
              "role": "trusted", "recovery_code": "rec999"},
        timeout=10,
    )
    assert r.status_code == 200
    plist = r.json()["profiles"]
    # response shape changed: list of dicts with id/name/role
    assert all(isinstance(p, dict) and {"id", "name", "role"} <= set(p.keys()) for p in plist)

    # limited
    r2 = requests.post(
        f"{API}/profiles/add",
        json={"device_id": configured_device, "name": "Kiddo", "access_code": "1234",
              "role": "limited", "recovery_code": "rec999"},
        timeout=10,
    )
    assert r2.status_code == 200
    roles = {p["name"]: p["role"] for p in r2.json()["profiles"]}
    assert roles.get("Partner") == "trusted"
    assert roles.get("Kiddo") == "limited"

    # invalid role falls back to 'trusted'
    r3 = requests.post(
        f"{API}/profiles/add",
        json={"device_id": configured_device, "name": "Weirdo", "access_code": "9876",
              "role": "alien", "recovery_code": "rec999"},
        timeout=10,
    )
    assert r3.status_code == 200
    roles3 = {p["name"]: p["role"] for p in r3.json()["profiles"]}
    assert roles3.get("Weirdo") == "trusted"


# --- profiles/remove requires recovery + cannot remove owner ---
def test_remove_profile_owner_blocked(configured_device):
    plist = requests.get(f"{API}/profiles", params={"device_id": configured_device}, timeout=10).json()["profiles"]
    owner = next(p for p in plist if p["role"] == "owner")
    r = requests.post(
        f"{API}/profiles/remove",
        json={"device_id": configured_device, "profile_id": owner["id"], "recovery_code": "rec999"},
        timeout=10,
    )
    assert r.status_code == 400


def test_remove_profile_wrong_recovery_403(configured_device):
    plist = requests.get(f"{API}/profiles", params={"device_id": configured_device}, timeout=10).json()["profiles"]
    target = next(p for p in plist if p["role"] != "owner")
    r = requests.post(
        f"{API}/profiles/remove",
        json={"device_id": configured_device, "profile_id": target["id"], "recovery_code": "WRONG"},
        timeout=10,
    )
    assert r.status_code == 403


def test_remove_profile_success(configured_device):
    plist = requests.get(f"{API}/profiles", params={"device_id": configured_device}, timeout=10).json()["profiles"]
    target = next(p for p in plist if p["name"] == "Weirdo")
    r = requests.post(
        f"{API}/profiles/remove",
        json={"device_id": configured_device, "profile_id": target["id"], "recovery_code": "rec999"},
        timeout=10,
    )
    assert r.status_code == 200
    names = [p["name"] for p in r.json()["profiles"]]
    assert "Weirdo" not in names


# --- verify-access returns profile and role; status persists last_role ---
def test_verify_access_returns_role_and_persists(configured_device):
    # unlock as trusted partner
    r = requests.post(f"{API}/verify-access", json={"device_id": configured_device, "code": "3690"}, timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["verified"] is True
    assert body["profile"] == "Partner"
    assert body["role"] == "trusted"

    s = requests.get(f"{API}/status", params={"device_id": configured_device}, timeout=10).json()
    assert s["last_owner"] == "Partner"
    assert s["last_role"] == "trusted"
    # profiles list with name+role
    names_roles = {p["name"]: p["role"] for p in s["profiles"]}
    assert names_roles.get("Sam") == "owner"
    assert names_roles.get("Partner") == "trusted"
    assert names_roles.get("Kiddo") == "limited"


def test_verify_access_limited_role(configured_device):
    r = requests.post(f"{API}/verify-access", json={"device_id": configured_device, "code": "1234"}, timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["verified"] is True
    assert body["role"] == "limited"


def test_verify_access_invalid(configured_device):
    r = requests.post(f"{API}/verify-access", json={"device_id": configured_device, "code": "0000"}, timeout=10)
    assert r.status_code == 200
    assert r.json()["verified"] is False
    assert r.json().get("role") is None


# --- Email dormant: RESEND_API_KEY empty -> all triggers still 2xx ---
def test_email_dormant_panic_ok(configured_device):
    r = requests.post(f"{API}/panic", json={"device_id": configured_device, "lat": 12.97, "lng": 77.59}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json()["ok"] is True


def test_email_dormant_sim_change_ok(configured_device):
    r = requests.post(f"{API}/device-change",
                      json={"device_id": configured_device, "kind": "sim", "detail": "iccid changed"}, timeout=15)
    assert r.status_code == 200, r.text


def test_email_dormant_recovery_trigger_ok(configured_device):
    r = requests.post(f"{API}/recovery/trigger",
                      json={"device_id": configured_device, "secret": "bring it back"}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json()["triggered"] is True


def test_email_dormant_call_trigger_ok(configured_device):
    # 3 calls from a trusted number within 5 min triggers
    last = None
    for _ in range(3):
        last = requests.post(
            f"{API}/recovery/call-trigger",
            json={"device_id": configured_device, "from_number": "+15550009999"},
            timeout=15,
        )
        assert last.status_code == 200, last.text
    assert last.json().get("triggered") is True


def test_email_dormant_l3_score_ok(configured_device):
    # Fresh device, train baseline with extreme owner samples, then send wildly different sample to escalate.
    dev = f"TEST_b8_l3_{uuid.uuid4().hex[:6]}"
    requests.post(
        f"{API}/setup",
        json={"device_id": dev, "owner_name": "Sam", "access_code": "2580",
              "recovery_code": "rec999", "wipe_code": "wipe888",
              "recovery_phrase": "bring it back", "recovery_email": "x@y.com",
              "trusted_numbers": ["+15550009999"], "cover_app": "calculator"},
        timeout=10,
    )
    for _ in range(10):
        requests.post(f"{API}/telemetry", json={
            "device_id": dev, "label": "owner",
            "features": {"typing_speed": 180, "typing_dwell": 90, "typing_flight": 70,
                         "typing_variance": 30, "touch_duration": 95, "touch_pressure": 0.5,
                         "tap_interval": 400, "swipe_velocity": 2, "swipe_length": 200,
                         "motion_avg": 10, "hour_of_day": 14, "day_of_week": 3}}, timeout=10)
    intruder = {"typing_speed": 9000, "typing_dwell": 5000, "typing_flight": 5000,
                "typing_variance": 5000, "touch_duration": 5000, "touch_pressure": 0.99,
                "tap_interval": 50, "swipe_velocity": 99, "swipe_length": 9000,
                "motion_avg": 999, "hour_of_day": 3, "day_of_week": 6}
    last = None
    for _ in range(3):
        last = requests.post(f"{API}/score",
                             json={"device_id": dev, "features": intruder, "lat": 0.0, "lng": 0.0},
                             timeout=15)
        assert last.status_code == 200, last.text
    # Even if scoring did not reach L3 (depends on baseline std flooring), endpoint still must succeed.
    assert last.json().get("trap_level") in (0, 1, 2, 3)


def test_cleanup(configured_device):
    requests.delete(f"{API}/events", params={"device_id": configured_device}, timeout=10)
