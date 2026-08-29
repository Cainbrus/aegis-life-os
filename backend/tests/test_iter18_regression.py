"""Iteration 18 regression tests - verifying code-review cleanup didn't break things.

Covers:
  - Family code generation now uses secrets.choice (still 6 uppercase alnum)
  - Setup / verify-access
  - Telemetry -> status (trust_score numeric, trap_level int) after dead-var removal
  - Privacy scan
  - AI insights
  - Vault add/list/item/delete round-trip
  - Voice process (renamed process_voice_command_alt) - POST /api/voice/process
  - Intelligence briefing (renamed get_intelligence_briefing) - GET /api/intelligence/briefing
"""
import os
import re
import time
import pytest
import requests

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().strip('"').rstrip("/")
    except FileNotFoundError:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not set")

BASE = _load_backend_url()
API = f"{BASE}/api"


@pytest.fixture(scope="module")
def device_id():
    return f"TEST_iter18_{int(time.time())}"


@pytest.fixture(scope="module")
def setup_device(device_id):
    r = requests.post(f"{API}/security/setup", json={
        "device_id": device_id,
        "owner_name": "IterEighteen",
        "access_code": "2580",
        "recovery_code": "rec18",
        "wipe_code": "wipe18",
        "cover_app": "calculator",
    }, timeout=30)
    assert r.status_code == 200, r.text
    return device_id


# ------------------ Setup + verify-access ------------------
def test_setup_success(setup_device):
    assert setup_device


def test_verify_access_correct(setup_device):
    r = requests.post(f"{API}/security/verify-access",
                      json={"device_id": setup_device, "code": "2580"}, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("verified") is True


def test_verify_access_wrong(setup_device):
    r = requests.post(f"{API}/security/verify-access",
                      json={"device_id": setup_device, "code": "9999"}, timeout=15)
    assert r.status_code == 200
    assert r.json().get("verified") is False


# ------------------ Family code (secrets.choice regression) ------------------
def test_family_create_returns_6char_uppercase_code(setup_device):
    r = requests.post(f"{API}/security/family/create", json={
        "device_id": setup_device,
        "member_role": "owner",
        "name": "HeadOfFamily",
    }, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    code = data.get("family_code") or data.get("code") or (data.get("family") or {}).get("code")
    assert code, f"No family code found in response: {data}"
    assert re.fullmatch(r"[A-Z0-9]{6}", code), f"Invalid code format: {code!r}"


# ------------------ Telemetry + status ------------------
def test_telemetry_then_status_has_numeric_trust_score(setup_device):
    tr = requests.post(f"{API}/security/telemetry", json={
        "device_id": setup_device,
        "features": {"typing_speed": 0.6, "swipe_speed": 0.5, "app_switch_rate": 0.3},
        "label": "owner",
        "screen": "home",
    }, timeout=15)
    assert tr.status_code == 200, tr.text

    sr = requests.get(f"{API}/security/status",
                      params={"device_id": setup_device}, timeout=15)
    assert sr.status_code == 200, sr.text
    body = sr.json()
    assert "trust_score" in body
    assert isinstance(body["trust_score"], (int, float))
    assert 0 <= body["trust_score"] <= 100
    assert "trap_level" in body
    assert isinstance(body["trap_level"], int)


# ------------------ Privacy scan ------------------
def test_privacy_scan_no_error(setup_device):
    r = requests.post(f"{API}/security/privacy-scan",
                      json={"device_id": setup_device, "signals": {}}, timeout=30)
    assert r.status_code == 200, r.text
    assert isinstance(r.json(), dict)


# ------------------ AI insights ------------------
def test_ai_insights(setup_device):
    r = requests.post(f"{API}/security/ai-insights",
                      json={"device_id": setup_device}, timeout=60)
    assert r.status_code == 200, r.text
    assert isinstance(r.json(), (dict, list))


# ------------------ Vault round-trip ------------------
def test_vault_add_list_item_delete(setup_device):
    add = requests.post(f"{API}/security/vault/add", json={
        "device_id": setup_device,
        "title": "TEST_iter18_note",
        "content": "hidden content",
        "kind": "note",
    }, timeout=15)
    assert add.status_code == 200, add.text
    item_id = add.json().get("id") or add.json().get("item_id") or (add.json().get("item") or {}).get("id")
    assert item_id, f"No id returned by vault/add: {add.json()}"

    lst = requests.get(f"{API}/security/vault/list",
                       params={"device_id": setup_device}, timeout=15)
    assert lst.status_code == 200
    items = lst.json().get("items", lst.json() if isinstance(lst.json(), list) else [])
    assert any((it.get("id") == item_id) for it in items), "Added item not in list"

    got = requests.get(f"{API}/security/vault/item",
                       params={"device_id": setup_device, "item_id": item_id}, timeout=15)
    assert got.status_code == 200, got.text
    assert got.json().get("id") == item_id or got.json().get("item", {}).get("id") == item_id

    dele = requests.delete(f"{API}/security/vault/item",
                           params={"device_id": setup_device, "item_id": item_id}, timeout=15)
    assert dele.status_code in (200, 204), dele.text


# ------------------ Renamed functions still routed ------------------
def test_intelligence_briefing_no_500():
    r = requests.get(f"{API}/intelligence/briefing", timeout=30)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:300]}"
    assert isinstance(r.json(), (dict, list))


def test_voice_process_no_500():
    r = requests.post(f"{API}/voice/process",
                      json={"transcript": "hello mate", "text": "hello mate"},
                      timeout=30)
    # Accept 200 or 400 (validation) but not 500 - the goal is "no 500 after rename"
    assert r.status_code < 500, f"Server error after rename: {r.status_code} {r.text[:300]}"
