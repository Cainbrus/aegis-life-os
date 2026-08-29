"""SEC-005 backend regression: family join must NEVER let a caller self-assign 'parent'.

Also verifies:
  - creator via /family/create is 'parent' and sees family_code
  - joiner cannot see family_code in /family/status
  - parent sees child in /family/members with can_manage True, show_locations True
  - child sees can_manage False and does NOT see parent in members (no parent locations)
"""
import os
import time
import pytest
import requests


def _load_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().strip('"').rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not set")


BASE = _load_url()
API = f"{BASE}/api"


@pytest.fixture(scope="module")
def ids():
    ts = int(time.time())
    return {
        "parent": f"TEST_sec005_parent_{ts}",
        "joiner": f"TEST_sec005_joiner_{ts}",
    }


@pytest.fixture(scope="module")
def family(ids):
    # setup both devices so telemetry/status endpoints exist
    for did in ids.values():
        requests.post(f"{API}/security/setup", json={
            "device_id": did, "owner_name": "SEC005",
            "access_code": "2580", "recovery_code": "rec005", "wipe_code": "wipe005",
            "cover_app": "calculator",
        }, timeout=20)
    r = requests.post(f"{API}/security/family/create",
                      json={"device_id": ids["parent"], "name": "Papa"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    code = data.get("family_code")
    assert code
    return {"code": code, **ids}


def test_creator_is_parent_and_sees_code(family):
    r = requests.get(f"{API}/security/family/status",
                     params={"device_id": family["parent"]}, timeout=15)
    assert r.status_code == 200, r.text
    b = r.json()
    assert b.get("in_family") is True
    assert b.get("role") == "parent"
    assert b.get("family_code") == family["code"]


def test_join_as_parent_is_coerced_to_child(family):
    r = requests.post(f"{API}/security/family/join", json={
        "device_id": family["joiner"], "name": "Kiddo",
        "family_code": family["code"], "member_role": "parent",
    }, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("member_role") == "child", r.json()


def test_joiner_status_role_child_no_code(family):
    r = requests.get(f"{API}/security/family/status",
                     params={"device_id": family["joiner"]}, timeout=15)
    assert r.status_code == 200
    b = r.json()
    assert b.get("role") == "child"
    assert b.get("family_code") is None


def test_parent_members_view(family):
    r = requests.get(f"{API}/security/family/members",
                     params={"device_id": family["parent"]}, timeout=15)
    assert r.status_code == 200, r.text
    b = r.json()
    assert b.get("can_manage") is True
    assert b.get("show_locations") is True
    roles = [m["member_role"] for m in b.get("members", [])]
    assert "parent" in roles and "child" in roles


def test_child_members_view_hides_parent(family):
    r = requests.get(f"{API}/security/family/members",
                     params={"device_id": family["joiner"]}, timeout=15)
    assert r.status_code == 200, r.text
    b = r.json()
    assert b.get("can_manage") is False
    roles = [m["member_role"] for m in b.get("members", [])]
    assert "parent" not in roles, f"child must not see parent, got roles={roles}"


def test_join_as_teen_is_allowed(family):
    # teen is a permitted joiner role and should not be coerced
    ts = int(time.time())
    teen_id = f"TEST_sec005_teen_{ts}"
    requests.post(f"{API}/security/setup", json={
        "device_id": teen_id, "owner_name": "Teen",
        "access_code": "2580", "recovery_code": "rec005", "wipe_code": "wipe005",
        "cover_app": "calculator",
    }, timeout=20)
    r = requests.post(f"{API}/security/family/join", json={
        "device_id": teen_id, "name": "Teeny",
        "family_code": family["code"], "member_role": "teen",
    }, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("member_role") == "teen"


def test_join_bogus_role_defaults_to_child(family):
    ts = int(time.time())
    did = f"TEST_sec005_bogus_{ts}"
    requests.post(f"{API}/security/setup", json={
        "device_id": did, "owner_name": "Bog",
        "access_code": "2580", "recovery_code": "rec005", "wipe_code": "wipe005",
        "cover_app": "calculator",
    }, timeout=20)
    r = requests.post(f"{API}/security/family/join", json={
        "device_id": did, "name": "Bog", "family_code": family["code"],
        "member_role": "admin",   # not in allowed set
    }, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("member_role") == "child"
