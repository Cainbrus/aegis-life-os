"""Cross-device Family tracking — 3-role visibility regression.
PARENT: sees ALL members + last locations + alerts + manage.
TEEN: sees SIBLINGS (other teens/children) + their locations; NEVER parents.
CHILD: sees SIBLINGS only (no locations); NEVER parents; cannot manage.
"""
import os
import time
import pytest
import requests


def _load_frontend_env():
    p = "/app/frontend/.env"
    if os.path.exists(p):
        for line in open(p):
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip()
    return os.environ.get("REACT_APP_BACKEND_URL", "")


BASE_URL = _load_frontend_env().rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not set"
API = f"{BASE_URL}/api/security"


@pytest.fixture(scope="module")
def ts():
    return int(time.time())


@pytest.fixture(scope="module")
def parent_dev(ts):
    return f"TEST_fam_parent_{ts}"


@pytest.fixture(scope="module")
def teen_dev(ts):
    return f"TEST_fam_teen_{ts}"


@pytest.fixture(scope="module")
def kid_dev(ts):
    return f"TEST_fam_kid_{ts}"


def _setup(device_id):
    r = requests.post(f"{API}/setup", json={
        "device_id": device_id,
        "access_code": "2580",
        "recovery_code": "rec22",
        "cover_app": "calculator",
    }, timeout=20)
    assert r.status_code in (200, 201), f"setup {device_id}: {r.status_code} {r.text}"


def _cleanup(device_id):
    try:
        requests.post(f"{API}/family/leave",
                      json={"device_id": device_id, "code": "rec22"}, timeout=10)
    except Exception:
        pass


def _locate(device_id, lat, lng):
    r = requests.post(f"{API}/recovery/locate", json={
        "device_id": device_id, "lat": lat, "lng": lng, "code": "rec22"
    }, timeout=10)
    assert r.status_code == 200, r.text


# --- Setup: parent creates family, teen+child join, all set locations ---
class TestFamilyCreateAndJoin:
    def test_parent_setup_and_create(self, parent_dev):
        _cleanup(parent_dev)
        _setup(parent_dev)
        r = requests.post(f"{API}/family/create", json={
            "device_id": parent_dev, "name": "Dad", "member_role": "parent"
        }, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert isinstance(data["family_code"], str)
        assert len(data["family_code"]) == 6
        pytest.family_code = data["family_code"]
        _locate(parent_dev, 51.50, -0.10)

    def test_teen_join(self, teen_dev):
        _cleanup(teen_dev)
        _setup(teen_dev)
        r = requests.post(f"{API}/family/join", json={
            "device_id": teen_dev, "name": "TeenA",
            "member_role": "teen", "family_code": pytest.family_code
        }, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True
        _locate(teen_dev, 51.51, -0.11)

    def test_child_join(self, kid_dev):
        _cleanup(kid_dev)
        _setup(kid_dev)
        r = requests.post(f"{API}/family/join", json={
            "device_id": kid_dev, "name": "KidA",
            "member_role": "child", "family_code": pytest.family_code
        }, timeout=15)
        assert r.status_code == 200, r.text
        _locate(kid_dev, 51.52, -0.12)

    def test_invalid_role_falls_back_to_child(self):
        dev = f"TEST_fam_invalid_{int(time.time())}"
        _setup(dev)
        r = requests.post(f"{API}/family/join", json={
            "device_id": dev, "name": "Bogus",
            "member_role": "stranger", "family_code": pytest.family_code
        }, timeout=10)
        assert r.status_code == 200, r.text
        s = requests.get(f"{API}/family/status",
                         params={"device_id": dev}, timeout=10).json()
        assert s["in_family"] is True
        assert s["role"] == "child"
        _cleanup(dev)


# --- PARENT visibility ---
class TestParentVisibility:
    def test_parent_status(self, parent_dev):
        r = requests.get(f"{API}/family/status",
                         params={"device_id": parent_dev}, timeout=10)
        s = r.json()
        assert s["in_family"] is True
        assert s["role"] == "parent"
        assert s["family_code"] == pytest.family_code
        assert s["member_count"] >= 3

    def test_parent_sees_all_three_with_locations(self, parent_dev):
        r = requests.get(f"{API}/family/members",
                         params={"device_id": parent_dev}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "parent"
        assert d["show_locations"] is True
        assert d["can_manage"] is True
        names = {m["name"]: m for m in d["members"]}
        assert {"Dad", "TeenA", "KidA"}.issubset(set(names.keys()))
        # All three members must have last_location populated.
        for n in ("Dad", "TeenA", "KidA"):
            assert names[n]["last_location"] is not None, f"{n} missing location"
            assert "lat" in names[n]["last_location"]


# --- TEEN visibility: siblings only, with locations, no parent ---
class TestTeenVisibility:
    def test_teen_status_no_code(self, teen_dev):
        r = requests.get(f"{API}/family/status",
                         params={"device_id": teen_dev}, timeout=10)
        s = r.json()
        assert s["in_family"] is True
        assert s["role"] == "teen"
        # Teen must not be told the family code.
        assert s.get("family_code") in (None, "")

    def test_teen_members_siblings_with_locations(self, teen_dev):
        r = requests.get(f"{API}/family/members",
                         params={"device_id": teen_dev}, timeout=10)
        d = r.json()
        assert d["role"] == "teen"
        assert d["show_locations"] is True
        assert d["can_manage"] is False
        names = {m["name"]: m for m in d["members"]}
        assert "Dad" not in names, "Teen must NOT see parent"
        assert "TeenA" in names and "KidA" in names
        # Sibling locations must be visible to teen.
        for n in ("TeenA", "KidA"):
            assert names[n]["last_location"] is not None
        # No parent role anywhere in visible members.
        assert all(m["member_role"] != "parent" for m in d["members"])


# --- CHILD visibility: siblings only, NO locations, no parent ---
class TestChildVisibility:
    def test_child_status_no_code(self, kid_dev):
        r = requests.get(f"{API}/family/status",
                         params={"device_id": kid_dev}, timeout=10)
        s = r.json()
        assert s["in_family"] is True
        assert s["role"] == "child"
        assert s.get("family_code") in (None, "")

    def test_child_members_siblings_no_locations(self, kid_dev):
        r = requests.get(f"{API}/family/members",
                         params={"device_id": kid_dev}, timeout=10)
        d = r.json()
        assert d["role"] == "child"
        assert d["show_locations"] is False
        assert d["can_manage"] is False
        names = {m["name"]: m for m in d["members"]}
        assert "Dad" not in names, "Child must NOT see parent"
        assert "TeenA" in names and "KidA" in names
        # Child must NEVER see locations (even of siblings).
        for m in d["members"]:
            assert m["last_location"] is None, f"{m['name']} should have null location for child"
            assert m["member_role"] != "parent"


# --- Edge cases ---
class TestFamilyEdges:
    def test_invalid_family_code_returns_404(self):
        dev = f"TEST_fam_bad_{int(time.time())}"
        _setup(dev)
        r = requests.post(f"{API}/family/join", json={
            "device_id": dev, "name": "Nope",
            "member_role": "child", "family_code": "ZZZZZZ"
        }, timeout=10)
        assert r.status_code == 404
        _cleanup(dev)

    def test_teen_leave_then_not_in_family(self, teen_dev):
        r = requests.post(f"{API}/family/leave",
                          json={"device_id": teen_dev, "code": "rec22"}, timeout=10)
        assert r.status_code == 200
        s = requests.get(f"{API}/family/status",
                         params={"device_id": teen_dev}, timeout=10).json()
        assert s["in_family"] is False
