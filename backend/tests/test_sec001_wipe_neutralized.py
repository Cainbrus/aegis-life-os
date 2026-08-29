"""SEC-001 verification tests (iteration 20).

Confirms:
  1. POST /api/wipe/execute-complete is neutralized (returns 410) and performs NO deletion.
  2. POST /api/security/recovery/wipe still works, is owner/wipe-code gated (403 without),
     and is DEVICE-SCOPED (wiping device A does not affect device B's vault).
  3. Baseline regression: setup, verify-access (correct/wrong), telemetry+status,
     vault CRUD round-trip, family/create returns 6-char code.
  4. CORS/general reachability: GET /api/security/status returns 200 JSON.
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
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not set")


BASE = _load_backend_url()
API = f"{BASE}/api"

TS = int(time.time())
DEV_A = f"TEST_sec001_A_{TS}"
DEV_B = f"TEST_sec001_B_{TS}"


def _setup(device_id, owner="Owner"):
    r = requests.post(f"{API}/security/setup", json={
        "device_id": device_id,
        "owner_name": owner,
        "access_code": "2580",
        "recovery_code": "rec999",
        "wipe_code": "wipe888",
        "cover_app": "calculator",
    }, timeout=30)
    assert r.status_code == 200, r.text
    return device_id


def _vault_add(device_id, title):
    r = requests.post(f"{API}/security/vault/add", json={
        "device_id": device_id,
        "title": title,
        "content": "secret " + title,
        "kind": "note",
    }, timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    return j.get("id") or j.get("item_id") or (j.get("item") or {}).get("id")


def _vault_list(device_id):
    r = requests.get(f"{API}/security/vault/list",
                     params={"device_id": device_id}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    if isinstance(body, list):
        return body
    return body.get("items", [])


# ================= SEC-001: /wipe/execute-complete neutralized =================

def test_sec001_execute_complete_returns_410_with_confirmation_string():
    """The exact malicious payload from the CVE must be rejected with 410."""
    r = requests.post(f"{API}/wipe/execute-complete",
                      json={"confirmation": "COMPLETE_DEVICE_WIPE"},
                      timeout=15)
    assert r.status_code == 410, f"Expected 410 Gone, got {r.status_code}: {r.text[:300]}"


def test_sec001_execute_complete_returns_410_empty_body():
    r = requests.post(f"{API}/wipe/execute-complete", json={}, timeout=15)
    assert r.status_code == 410


def test_sec001_execute_complete_does_not_delete_data():
    """Seed device with a vault item, hit the neutralized endpoint with the
    malicious payload, then confirm the vault item is still present."""
    dev = _setup(f"TEST_sec001_canary_{TS}", owner="Canary")
    item_id = _vault_add(dev, "TEST_canary_item")
    assert item_id

    # Attempt malicious wipe repeatedly with various payload variants
    for payload in (
        {"confirmation": "COMPLETE_DEVICE_WIPE"},
        {"confirmation": "COMPLETE_DEVICE_WIPE", "device_id": dev},
        {"confirm": True, "confirmation": "COMPLETE_DEVICE_WIPE"},
    ):
        r = requests.post(f"{API}/wipe/execute-complete", json=payload, timeout=15)
        assert r.status_code == 410, r.text

    # Canary vault item MUST still exist
    items = _vault_list(dev)
    assert any(it.get("id") == item_id for it in items), \
        f"Canary vault item was deleted by neutralized endpoint! items={items}"


# ================= REGRESSION: /security/recovery/wipe (real wipe) =================

def test_recovery_wipe_requires_owner_code():
    dev = _setup(f"TEST_sec001_reqcode_{TS}")
    r = requests.post(f"{API}/security/recovery/wipe", json={
        "device_id": dev,
        "owner_code": "wrong-code",
        "confirm": True,
    }, timeout=15)
    assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text[:300]}"


def test_recovery_wipe_requires_confirm_flag():
    dev = _setup(f"TEST_sec001_reqconfirm_{TS}")
    r = requests.post(f"{API}/security/recovery/wipe", json={
        "device_id": dev,
        "owner_code": "wipe888",
        "confirm": False,
    }, timeout=15)
    assert r.status_code == 400, f"Expected 400 (confirmation required), got {r.status_code}: {r.text[:300]}"


def test_recovery_wipe_is_device_scoped():
    """Setup device A + B, each with a vault item. Wipe A. B's item survives."""
    _setup(DEV_A, owner="OwnerA")
    _setup(DEV_B, owner="OwnerB")
    item_a = _vault_add(DEV_A, "TEST_devA_item")
    item_b = _vault_add(DEV_B, "TEST_devB_item")
    assert item_a and item_b

    # Wipe device A with correct wipe code
    r = requests.post(f"{API}/security/recovery/wipe", json={
        "device_id": DEV_A,
        "owner_code": "wipe888",
        "confirm": True,
    }, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True and body.get("wiped") is True

    # Device A vault must be empty; device B vault must still contain its item
    items_a = _vault_list(DEV_A)
    assert not any(it.get("id") == item_a for it in items_a), \
        f"Device A item was NOT wiped: {items_a}"

    items_b = _vault_list(DEV_B)
    assert any(it.get("id") == item_b for it in items_b), \
        f"Device B item was wrongly wiped by device A's wipe call: {items_b}"


# ================= REGRESSION: baseline flows still work =================

@pytest.fixture(scope="module")
def base_device():
    return _setup(f"TEST_sec001_base_{TS}", owner="BaseOwner")


def test_verify_access_correct(base_device):
    r = requests.post(f"{API}/security/verify-access",
                      json={"device_id": base_device, "code": "2580"}, timeout=15)
    assert r.status_code == 200
    assert r.json().get("verified") is True


def test_verify_access_wrong(base_device):
    r = requests.post(f"{API}/security/verify-access",
                      json={"device_id": base_device, "code": "0001"}, timeout=15)
    assert r.status_code == 200
    assert r.json().get("verified") is False


def test_telemetry_and_status(base_device):
    tr = requests.post(f"{API}/security/telemetry", json={
        "device_id": base_device,
        "features": {"typing_speed": 0.5, "swipe_speed": 0.4, "app_switch_rate": 0.2},
        "label": "owner",
        "screen": "home",
    }, timeout=15)
    assert tr.status_code == 200, tr.text

    sr = requests.get(f"{API}/security/status",
                      params={"device_id": base_device}, timeout=15)
    assert sr.status_code == 200
    body = sr.json()
    assert isinstance(body.get("trust_score"), (int, float))
    assert 0 <= body["trust_score"] <= 100
    assert isinstance(body.get("trap_level"), int)


def test_status_reachability_general():
    """CORS/allow_credentials=False regression: plain GET should still 200 with JSON."""
    r = requests.get(f"{API}/security/status",
                     params={"device_id": "anon-cors-check"}, timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


def test_vault_round_trip(base_device):
    item_id = _vault_add(base_device, "TEST_sec001_roundtrip")
    assert item_id

    items = _vault_list(base_device)
    assert any(it.get("id") == item_id for it in items)

    got = requests.get(f"{API}/security/vault/item",
                       params={"device_id": base_device, "item_id": item_id}, timeout=15)
    assert got.status_code == 200
    j = got.json()
    assert j.get("id") == item_id or j.get("item", {}).get("id") == item_id

    dele = requests.delete(f"{API}/security/vault/item",
                           params={"device_id": base_device, "item_id": item_id}, timeout=15)
    assert dele.status_code in (200, 204)


def test_family_create_returns_6char_code(base_device):
    r = requests.post(f"{API}/security/family/create", json={
        "device_id": base_device,
        "member_role": "owner",
        "name": "FamilyHead",
    }, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    code = data.get("family_code") or data.get("code") or (data.get("family") or {}).get("code")
    assert code and re.fullmatch(r"[A-Z0-9]{6}", code), f"Bad family code: {code!r} in {data}"
