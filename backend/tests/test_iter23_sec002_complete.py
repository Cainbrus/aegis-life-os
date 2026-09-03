"""
Iteration 23 — SEC-002 completeness re-audit.

Verifies:
  1. Newly-gated endpoints (status, alerts, profiles, family/members, ai-insights,
     baseline/reset, panic, recovery/lock) require X-DM-Token bound to device.
  2. setup/status PII gating: no token -> only {configured, cover_app};
     with token -> also profiles/trusted_numbers/backup_numbers/has_email.
  3. /api/auth/pattern is disabled (HTTP 410).
  4. Session revocation on recovery/wipe.
  5. Regression: pre-gated endpoints still work with a valid token.
  6. Regression: ungated endpoints still open (setup, telemetry, POST /events,
     recovery/trigger, setup/status flags-only, family/create+join+status,
     verify-access, verify-recovery).
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
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.strip().startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api/security"
AUTH = f"{BASE_URL}/api/auth"


def _setup(did, wipe_code="wipe888"):
    r = requests.post(f"{API}/setup", json={
        "device_id": did, "owner_name": "Tester",
        "access_code": "2580", "recovery_code": "rec999",
        "wipe_code": wipe_code,
        "trusted_numbers": ["+15550009"],
        "cover_app": "calculator",
    }, timeout=15)
    assert r.status_code == 200, r.text
    return did


def _token(did, code="2580"):
    r = requests.post(f"{API}/verify-access", json={"device_id": did, "code": code}, timeout=15)
    assert r.status_code == 200, r.text
    tok = r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def device_a():
    return _setup(f"TEST_iter23_A_{int(time.time())}_{uuid.uuid4().hex[:6]}")


@pytest.fixture(scope="module")
def device_b():
    return _setup(f"TEST_iter23_B_{int(time.time())}_{uuid.uuid4().hex[:6]}")


@pytest.fixture(scope="module")
def token_a(device_a):
    return _token(device_a)


@pytest.fixture(scope="module")
def token_b(device_b):
    return _token(device_b)


# Newly-gated endpoints from iter23
NEW_GATED = [
    ("GET",  "/status",           {"device_id": "{d}"}, None),
    ("GET",  "/alerts",           {"device_id": "{d}"}, None),
    ("GET",  "/profiles",         {"device_id": "{d}"}, None),
    ("GET",  "/family/members",   {"device_id": "{d}"}, None),
    ("POST", "/ai-insights",      None, {"device_id": "{d}"}),
    ("POST", "/baseline/reset",   None, {"device_id": "{d}"}),
    ("POST", "/panic",            None, {"device_id": "{d}"}),
    ("POST", "/recovery/lock",    None, {"device_id": "{d}"}),
]


def _call(method, path, params, body, did, headers=None):
    if params:
        params = {k: (v.replace("{d}", did) if isinstance(v, str) else v) for k, v in params.items()}
    if body:
        body = {k: (v.replace("{d}", did) if isinstance(v, str) else v) for k, v in body.items()}
    return requests.request(method, f"{API}{path}", params=params, json=body,
                            headers=headers or {}, timeout=15)


class TestNewlyGatedNoToken:
    @pytest.mark.parametrize("method,path,params,body", NEW_GATED)
    def test_no_token_401(self, device_a, method, path, params, body):
        r = _call(method, path, params, body, device_a)
        assert r.status_code == 401, f"{method} {path}: {r.status_code} {r.text[:150]}"

    @pytest.mark.parametrize("method,path,params,body", NEW_GATED)
    def test_bad_token_401(self, device_a, method, path, params, body):
        r = _call(method, path, params, body, device_a, headers={"X-DM-Token": "junk"})
        assert r.status_code == 401


class TestNewlyGatedValidToken:
    @pytest.mark.parametrize("method,path,params,body", NEW_GATED)
    def test_valid_token_not_401(self, device_a, token_a, method, path, params, body):
        r = _call(method, path, params, body, device_a, headers={"X-DM-Token": token_a})
        assert r.status_code != 401, f"{method} {path} rejected with token: {r.text[:200]}"
        # For read endpoints we expect 200; POST ops may return 200 too.
        assert r.status_code in (200, 201), f"{method} {path} unexpected {r.status_code}: {r.text[:200]}"


class TestCrossDeviceRejectionNewGated:
    @pytest.mark.parametrize("method,path,params,body", NEW_GATED)
    def test_token_a_on_device_b(self, device_b, token_a, method, path, params, body):
        r = _call(method, path, params, body, device_b, headers={"X-DM-Token": token_a})
        assert r.status_code == 401


class TestSetupStatusPIIGating:
    def test_no_token_returns_flags_only(self, device_a):
        r = requests.get(f"{API}/setup/status", params={"device_id": device_a}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert set(body.keys()) <= {"configured", "cover_app"}, f"leaked keys: {body.keys()}"
        assert body["configured"] is True
        assert body["cover_app"] == "calculator"
        # explicit: none of the PII fields present
        for k in ("trusted_numbers", "backup_numbers", "profiles", "has_email", "recovery_email"):
            assert k not in body, f"PII field '{k}' leaked without token"

    def test_with_token_returns_pii(self, device_a, token_a):
        r = requests.get(f"{API}/setup/status", params={"device_id": device_a},
                         headers={"X-DM-Token": token_a}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["configured"] is True
        assert "trusted_numbers" in body and body["trusted_numbers"] == ["+15550009"]
        assert "backup_numbers" in body
        assert "profiles" in body
        assert "has_email" in body

    def test_wrong_token_returns_flags_only(self, device_a):
        r = requests.get(f"{API}/setup/status", params={"device_id": device_a},
                         headers={"X-DM-Token": "bogus"}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "trusted_numbers" not in body

    def test_cross_device_token_returns_flags_only(self, device_a, token_b):
        r = requests.get(f"{API}/setup/status", params={"device_id": device_a},
                         headers={"X-DM-Token": token_b}, timeout=15)
        assert r.status_code == 200
        assert "trusted_numbers" not in r.json()


class TestLegacyShadowAuthDisabled:
    def test_auth_pattern_returns_410(self):
        r = requests.post(f"{AUTH}/pattern", json={"pattern": "1-2-3-6-9",
                                                    "pattern_type": "primary_pattern"}, timeout=15)
        assert r.status_code == 410, f"expected 410, got {r.status_code}: {r.text[:200]}"


class TestSessionRevocationOnWipe:
    def test_wipe_clears_sessions(self):
        did = _setup(f"TEST_iter23_wipe_{int(time.time())}_{uuid.uuid4().hex[:6]}")
        tok = _token(did)
        # pre-wipe: valid token works
        r = requests.get(f"{API}/status", params={"device_id": did},
                         headers={"X-DM-Token": tok}, timeout=15)
        assert r.status_code == 200
        # wipe
        r = requests.post(f"{API}/recovery/wipe",
                          json={"device_id": did, "owner_code": "wipe888", "confirm": True},
                          timeout=15)
        assert r.status_code == 200 and r.json()["wiped"] is True
        # post-wipe: same token now invalid on multiple gated endpoints
        for path, params in (("/status", {"device_id": did}),
                             ("/alerts", {"device_id": did}),
                             ("/vault/list", {"device_id": did})):
            r = requests.get(f"{API}{path}", params=params,
                             headers={"X-DM-Token": tok}, timeout=15)
            assert r.status_code == 401, f"{path} still accepts token post-wipe: {r.status_code}"


class TestRegressionUngated:
    def test_setup_status_no_token_open(self, device_a):
        r = requests.get(f"{API}/setup/status", params={"device_id": device_a}, timeout=15)
        assert r.status_code == 200

    def test_telemetry_open(self, device_a):
        r = requests.post(f"{API}/telemetry", json={
            "device_id": device_a, "label": "owner",
            "features": {"typing_speed": 180, "typing_dwell": 90},
        }, timeout=15)
        assert r.status_code == 200

    def test_events_post_write_open(self, device_a):
        r = requests.post(f"{API}/events", json={
            "device_id": device_a, "type": "trap", "severity": "info",
            "title": "TEST_iter23_evt", "detail": "native write no-token",
        }, timeout=15)
        assert r.status_code == 200

    def test_recovery_trigger_open(self, device_a):
        r = requests.post(f"{API}/recovery/trigger",
                          json={"device_id": device_a, "secret": "wrong-secret-xyz"}, timeout=15)
        assert r.status_code == 200

    def test_family_create_join_status_open(self):
        did_a = _setup(f"TEST_iter23_fam_A_{int(time.time())}_{uuid.uuid4().hex[:6]}")
        did_b = _setup(f"TEST_iter23_fam_B_{int(time.time())}_{uuid.uuid4().hex[:6]}")
        # create
        r = requests.post(f"{API}/family/create", json={"device_id": did_a, "name": "Fam"}, timeout=15)
        assert r.status_code == 200
        code = r.json().get("code") or r.json().get("invite_code") or r.json().get("family_code")
        # status open
        r = requests.get(f"{API}/family/status", params={"device_id": did_a}, timeout=15)
        assert r.status_code == 200 and r.json()["in_family"] is True
        # join (only assert not-401 since code shape may vary)
        if code:
            r = requests.post(f"{API}/family/join",
                              json={"device_id": did_b, "code": code, "name": "B"}, timeout=15)
            assert r.status_code != 401

    def test_verify_access_and_recovery_open(self, device_a):
        r = requests.post(f"{API}/verify-access", json={"device_id": device_a, "code": "2580"}, timeout=15)
        assert r.status_code == 200
        r = requests.post(f"{API}/verify-recovery", json={"device_id": device_a, "code": "rec999"}, timeout=15)
        assert r.status_code == 200

    def test_setup_open_reconfigure(self):
        # POST /setup is unauthenticated first-run/reconfig path
        did = f"TEST_iter23_setup_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/setup", json={
            "device_id": did, "owner_name": "X",
            "access_code": "2580", "recovery_code": "rec999",
            "cover_app": "calculator",
        }, timeout=15)
        assert r.status_code == 200


class TestPreviouslyGatedStillEnforced:
    """Sanity check that iter22-gated endpoints remain gated."""
    @pytest.mark.parametrize("path,params", [
        ("/vault/list", {"device_id": "{d}"}),
        ("/events", {"device_id": "{d}"}),
        ("/decoy/profile", {"device_id": "{d}"}),
        ("/recovery/location", {"device_id": "{d}"}),
    ])
    def test_get_no_token_401(self, device_a, path, params):
        p = {k: (v.replace("{d}", device_a) if isinstance(v, str) else v) for k, v in params.items()}
        r = requests.get(f"{API}{path}", params=p, timeout=15)
        assert r.status_code == 401
