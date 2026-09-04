"""
Iteration 24 - Evidence Center /events endpoints gating verification.

Confirms SEC-002 behavior on the LIVE preview backend:
- GET /api/security/events without X-DM-Token -> 401 (not 404)
- POST /api/security/events (ungated) -> 200 and persists
- POST /api/security/verify-access -> returns non-empty token
- GET/DELETE /events with valid token -> 200; DELETE clears
- Token binding: token for device A rejected on device B
- Full lifecycle: POST -> GET (present) -> DELETE -> GET (empty)
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://digital-mate-mvp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/security"


def _rand(prefix="evt-test"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def device_a():
    dev_id = _rand()
    payload = {
        "device_id": dev_id,
        "owner_name": "Sam",
        "access_code": "2580",
        "recovery_code": "rec999",
        "cover_app": "calculator",
    }
    r = requests.post(f"{API}/setup", json=payload, timeout=15)
    assert r.status_code == 200, f"setup A failed: {r.status_code} {r.text}"
    return dev_id


@pytest.fixture(scope="module")
def device_b():
    dev_id = _rand()
    payload = {
        "device_id": dev_id,
        "owner_name": "Sam2",
        "access_code": "1357",
        "recovery_code": "rec888",
        "cover_app": "calculator",
    }
    r = requests.post(f"{API}/setup", json=payload, timeout=15)
    assert r.status_code == 200, f"setup B failed: {r.status_code} {r.text}"
    return dev_id


@pytest.fixture(scope="module")
def token_a(device_a):
    r = requests.post(f"{API}/verify-access", json={"device_id": device_a, "code": "2580"}, timeout=15)
    assert r.status_code == 200, f"verify-access A failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("verified") is True
    tok = data.get("token")
    assert isinstance(tok, str) and len(tok) > 0
    return tok


@pytest.fixture(scope="module")
def token_b(device_b):
    r = requests.post(f"{API}/verify-access", json={"device_id": device_b, "code": "1357"}, timeout=15)
    assert r.status_code == 200
    return r.json()["token"]


# --- GATING ---

def test_get_events_without_token_returns_401(device_a):
    r = requests.get(f"{API}/events", params={"device_id": device_a}, timeout=15)
    assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"


def test_delete_events_without_token_returns_401(device_a):
    r = requests.delete(f"{API}/events", params={"device_id": device_a}, timeout=15)
    assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"


# --- WRITE (UNGATED) ---

def test_post_event_ungated_returns_200(device_a):
    ev = {
        "device_id": device_a,
        "type": "intruder_photo",
        "severity": "high",
        "title": "Failed unlock",
        "detail": "3 wrong attempts",
    }
    r = requests.post(f"{API}/events", json=ev, timeout=15)
    assert r.status_code == 200, f"POST events failed: {r.status_code} {r.text}"


# --- READ WITH TOKEN ---

def test_get_events_with_token_contains_written_event(device_a, token_a):
    # Write a uniquely-titled event, then read back
    unique_title = f"unique-{uuid.uuid4().hex[:6]}"
    ev = {
        "device_id": device_a,
        "type": "gps_ping",
        "severity": "medium",
        "title": unique_title,
        "detail": "lat=0,lon=0",
    }
    wr = requests.post(f"{API}/events", json=ev, timeout=15)
    assert wr.status_code == 200

    r = requests.get(
        f"{API}/events",
        params={"device_id": device_a},
        headers={"X-DM-Token": token_a},
        timeout=15,
    )
    assert r.status_code == 200, f"GET with token failed: {r.status_code} {r.text}"
    body = r.json()
    events = body if isinstance(body, list) else body.get("events", body)
    assert isinstance(events, list), f"unexpected body: {body}"
    titles = [e.get("title") for e in events if isinstance(e, dict)]
    assert unique_title in titles, f"written event not present. titles={titles}"


# --- TOKEN BINDING ---

def test_token_bound_to_device_cross_use_rejected(device_b, token_a):
    r = requests.get(
        f"{API}/events",
        params={"device_id": device_b},
        headers={"X-DM-Token": token_a},
        timeout=15,
    )
    assert r.status_code == 401, f"expected 401 cross-device, got {r.status_code}: {r.text}"


# --- FULL LIFECYCLE ---

def test_full_lifecycle_post_get_delete_get(device_a, token_a):
    # Ensure at least one event exists
    ev = {
        "device_id": device_a,
        "type": "intruder_photo",
        "severity": "high",
        "title": f"lifecycle-{uuid.uuid4().hex[:6]}",
        "detail": "x",
    }
    assert requests.post(f"{API}/events", json=ev, timeout=15).status_code == 200

    # GET shows non-empty
    r = requests.get(f"{API}/events", params={"device_id": device_a},
                     headers={"X-DM-Token": token_a}, timeout=15)
    assert r.status_code == 200
    body = r.json()
    events = body if isinstance(body, list) else body.get("events", body)
    assert isinstance(events, list) and len(events) > 0

    # DELETE with token -> 200
    d = requests.delete(f"{API}/events", params={"device_id": device_a},
                        headers={"X-DM-Token": token_a}, timeout=15)
    assert d.status_code == 200, f"DELETE failed: {d.status_code} {d.text}"

    # GET now empty
    r2 = requests.get(f"{API}/events", params={"device_id": device_a},
                      headers={"X-DM-Token": token_a}, timeout=15)
    assert r2.status_code == 200
    body2 = r2.json()
    events2 = body2 if isinstance(body2, list) else body2.get("events", body2)
    assert isinstance(events2, list) and len(events2) == 0, f"expected empty, got {events2}"
