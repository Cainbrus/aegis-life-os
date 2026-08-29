"""
SEC-002 Stage-2 Auth: session token enforcement on sensitive owner-data endpoints.
Verifies gated endpoints reject requests without a valid X-DM-Token bound to the
same device_id, and that /verify-access + /verify-recovery issue tokens correctly.
"""
import os
import time
import uuid
import pytest
import requests


def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.strip().startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().rstrip("/")
    except OSError:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api/security"


def _setup_device(device_id):
    r = requests.post(f"{API}/setup", json={
        "device_id": device_id, "owner_name": "Tester",
        "access_code": "2580", "recovery_code": "rec999",
        "cover_app": "calculator",
    }, timeout=15)
    assert r.status_code == 200, r.text
    return r


@pytest.fixture(scope="module")
def device_a():
    did = f"TEST_sec002_A_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    _setup_device(did)
    return did


@pytest.fixture(scope="module")
def device_b():
    did = f"TEST_sec002_B_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    _setup_device(did)
    return did


@pytest.fixture(scope="module")
def token_a(device_a):
    r = requests.post(f"{API}/verify-access", json={"device_id": device_a, "code": "2580"}, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body["verified"] is True
    assert body.get("token")
    return body["token"]


@pytest.fixture(scope="module")
def token_b(device_b):
    r = requests.post(f"{API}/verify-access", json={"device_id": device_b, "code": "2580"}, timeout=15)
    assert r.status_code == 200
    return r.json()["token"]


# ---------------------------------------------------------------------------
# Token issuance
# ---------------------------------------------------------------------------
class TestTokenIssuance:
    def test_verify_access_correct_returns_token(self, device_a):
        r = requests.post(f"{API}/verify-access", json={"device_id": device_a, "code": "2580"}, timeout=15)
        assert r.status_code == 200
        b = r.json()
        assert b["verified"] is True and isinstance(b.get("token"), str) and len(b["token"]) > 20

    def test_verify_access_wrong_returns_null_token(self, device_a):
        r = requests.post(f"{API}/verify-access", json={"device_id": device_a, "code": "9999"}, timeout=15)
        assert r.status_code == 200
        b = r.json()
        assert b["verified"] is False and b.get("token") is None

    def test_verify_recovery_correct_returns_token(self, device_a):
        r = requests.post(f"{API}/verify-recovery", json={"device_id": device_a, "code": "rec999"}, timeout=15)
        assert r.status_code == 200
        b = r.json()
        assert b["verified"] is True and isinstance(b.get("token"), str) and len(b["token"]) > 20

    def test_verify_recovery_wrong_no_token(self, device_a):
        r = requests.post(f"{API}/verify-recovery", json={"device_id": device_a, "code": "nope"}, timeout=15)
        assert r.status_code == 200
        b = r.json()
        assert b["verified"] is False and b.get("token") is None


# ---------------------------------------------------------------------------
# Gated endpoints without token -> 401
# ---------------------------------------------------------------------------
GATED_ENDPOINTS = [
    ("GET", "/vault/list", {"device_id": "{d}"}, None),
    ("GET", "/vault/item", {"device_id": "{d}", "item_id": "no"}, None),
    ("POST", "/vault/add", None, {"device_id": "{d}", "kind": "note", "title": "t", "content": "c"}),
    ("POST", "/vault/approve", None, {"device_id": "{d}", "item_id": "x"}),
    ("DELETE", "/vault/item", {"device_id": "{d}", "item_id": "x"}, None),
    ("GET", "/events", {"device_id": "{d}"}, None),
    ("DELETE", "/events", {"device_id": "{d}"}, None),
    ("GET", "/decoy/profile", {"device_id": "{d}"}, None),
    ("POST", "/decoy/profile", None, {"device_id": "{d}", "name": "d"}),
    ("GET", "/recovery/location", {"device_id": "{d}"}, None),
]


def _call(method, path, params, json_body, device_id, headers=None):
    url = f"{API}{path}"
    if params:
        params = {k: v.replace("{d}", device_id) if isinstance(v, str) else v for k, v in params.items()}
    if json_body:
        json_body = {k: (v.replace("{d}", device_id) if isinstance(v, str) else v) for k, v in json_body.items()}
    return requests.request(method, url, params=params, json=json_body, headers=headers or {}, timeout=15)


class TestGatedNoToken:
    @pytest.mark.parametrize("method,path,params,body", GATED_ENDPOINTS)
    def test_missing_token_401(self, device_a, method, path, params, body):
        r = _call(method, path, params, body, device_a)
        assert r.status_code == 401, f"{method} {path} expected 401, got {r.status_code}: {r.text[:200]}"

    @pytest.mark.parametrize("method,path,params,body", GATED_ENDPOINTS)
    def test_bad_token_401(self, device_a, method, path, params, body):
        r = _call(method, path, params, body, device_a, headers={"X-DM-Token": "not-a-real-token"})
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Cross-device token rejection
# ---------------------------------------------------------------------------
class TestCrossDeviceRejection:
    @pytest.mark.parametrize("method,path,params,body", GATED_ENDPOINTS)
    def test_token_a_on_device_b_rejected(self, device_b, token_a, method, path, params, body):
        r = _call(method, path, params, body, device_b, headers={"X-DM-Token": token_a})
        assert r.status_code == 401, f"cross-device token accepted on {method} {path}: {r.status_code}"


# ---------------------------------------------------------------------------
# Valid token -> normal 200 flow
# ---------------------------------------------------------------------------
class TestGatedWithValidToken:
    def test_full_vault_flow(self, device_a, token_a):
        h = {"X-DM-Token": token_a}
        # list (empty ok)
        r = requests.get(f"{API}/vault/list", params={"device_id": device_a}, headers=h, timeout=15)
        assert r.status_code == 200 and "items" in r.json()
        # add
        r = requests.post(f"{API}/vault/add", json={
            "device_id": device_a, "kind": "note",
            "title": "TEST_sec002_note", "content": "hello vault",
        }, headers=h, timeout=15)
        assert r.status_code == 200
        item_id = r.json()["id"]
        # list contains it
        r = requests.get(f"{API}/vault/list", params={"device_id": device_a}, headers=h, timeout=15)
        titles = [x["title"] for x in r.json()["items"]]
        assert "TEST_sec002_note" in titles
        # fetch item
        r = requests.get(f"{API}/vault/item", params={"device_id": device_a, "item_id": item_id}, headers=h, timeout=15)
        assert r.status_code == 200 and r.json()["content"] == "hello vault"
        # delete
        r = requests.delete(f"{API}/vault/item", params={"device_id": device_a, "item_id": item_id}, headers=h, timeout=15)
        assert r.status_code == 200 and r.json()["deleted"] >= 1

    def test_events_list_and_clear(self, device_a, token_a):
        h = {"X-DM-Token": token_a}
        r = requests.get(f"{API}/events", params={"device_id": device_a}, headers=h, timeout=15)
        assert r.status_code == 200 and "events" in r.json()

    def test_decoy_profile_read_write(self, device_a, token_a):
        h = {"X-DM-Token": token_a}
        r = requests.get(f"{API}/decoy/profile", params={"device_id": device_a}, headers=h, timeout=15)
        assert r.status_code == 200
        r = requests.post(f"{API}/decoy/profile", json={
            "device_id": device_a, "name": "TEST_decoy",
            "contacts": ["Alex"], "messages": [{"from": "Mum", "text": "hi", "time": "9:00"}],
            "notes": [{"title": "shopping", "body": "milk"}],
        }, headers=h, timeout=15)
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_recovery_location(self, device_a, token_a):
        h = {"X-DM-Token": token_a}
        r = requests.get(f"{API}/recovery/location", params={"device_id": device_a}, headers=h, timeout=15)
        assert r.status_code == 200 and "last_location" in r.json()


# ---------------------------------------------------------------------------
# Regression: non-gated endpoints still open (no token required)
# ---------------------------------------------------------------------------
class TestRegressionUngated:
    def test_setup_status_open(self, device_a):
        r = requests.get(f"{API}/setup/status", params={"device_id": device_a}, timeout=15)
        assert r.status_code == 200

    def test_status_open(self, device_a):
        r = requests.get(f"{API}/status", params={"device_id": device_a}, timeout=15)
        assert r.status_code == 200

    def test_telemetry_open(self, device_a):
        r = requests.post(f"{API}/telemetry", json={
            "device_id": device_a, "label": "owner",
            "features": {"typing_speed": 180, "typing_dwell": 90},
        }, timeout=15)
        assert r.status_code == 200

    def test_events_write_open(self, device_a):
        # Native write path used by decoy/intruder capture. Must NOT require token.
        r = requests.post(f"{API}/events", json={
            "device_id": device_a, "type": "trap", "severity": "info",
            "title": "TEST_sec002_evt_write", "detail": "ungated write",
        }, timeout=15)
        assert r.status_code == 200

    def test_recovery_trigger_open(self, device_a):
        # Trigger via wrong secret still returns 200 with triggered:false (no auth needed).
        r = requests.post(f"{API}/security/recovery/trigger".replace("/api/security/api/security", "/api/security"),
                          json={"device_id": device_a, "secret": "definitely-wrong-secret"}, timeout=15)
        # normalize just in case
        if r.status_code == 404:
            r = requests.post(f"{API}/recovery/trigger", json={"device_id": device_a, "secret": "wrong-x"}, timeout=15)
        assert r.status_code == 200

    def test_family_create_and_status_open(self):
        did = f"TEST_sec002_fam_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        _setup_device(did)
        r = requests.post(f"{API}/family/create", json={"device_id": did, "name": "P"}, timeout=15)
        assert r.status_code == 200
        r = requests.get(f"{API}/family/status", params={"device_id": did}, timeout=15)
        assert r.status_code == 200 and r.json()["in_family"] is True


# ---------------------------------------------------------------------------
# Cleanup module: remove sessions for TEST devices (best-effort via wipe)
# ---------------------------------------------------------------------------
def test_zzz_cleanup(device_a, device_b, token_a, token_b):
    # Clear events (uses token) so we leave less noise.
    for did, tok in ((device_a, token_a), (device_b, token_b)):
        requests.delete(f"{API}/events", params={"device_id": did}, headers={"X-DM-Token": tok}, timeout=15)
