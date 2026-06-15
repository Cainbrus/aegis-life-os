"""
Iteration 16 — Stage 1 gaps:
- Owner-created Decoy Profiles  (/api/security/decoy/profile GET/POST)
- Family SOS                    (/api/security/panic + alerts_unread bump for parent)
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api/security"

TS = int(time.time())


# ---------------------- helpers ----------------------
def _setup(device_id: str, name: str = "Owner"):
    r = requests.post(f"{API}/setup", json={
        "device_id": device_id, "name": name,
        "access_code": "2580", "recovery_code": "rec22",
    }, timeout=10)
    assert r.status_code == 200, r.text
    return r.json()


# ====================== Decoy Profile ======================
class TestDecoyProfile:
    def test_get_unconfigured_returns_defaults(self):
        device_id = f"TEST_decoy_unconf_{TS}"
        # No setup needed - decoy/profile is independent of setup
        r = requests.get(f"{API}/decoy/profile", params={"device_id": device_id}, timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["configured"] is False
        # Generic defaults
        assert isinstance(body["contacts"], list) and len(body["contacts"]) >= 4
        assert isinstance(body["messages"], list) and len(body["messages"]) >= 1
        assert isinstance(body["notes"], list) and len(body["notes"]) >= 1
        # Message/note shape
        assert "from" in body["messages"][0] and "text" in body["messages"][0]
        assert "title" in body["notes"][0] and "body" in body["notes"][0]

    def test_post_then_get_returns_configured_custom(self):
        device_id = f"TEST_decoy_save_{TS}"
        payload = {
            "device_id": device_id,
            "name": "Decoy v1",
            "contacts": ["ZZTestContact", "Alpha", "Beta"],
            "messages": [
                {"from": "ZZTestContact", "text": "ping me", "time": "10:00"},
                {"from": "Alpha", "text": "see you", "time": "Yesterday"},
            ],
            "notes": [
                {"title": "ZZTestNote", "body": "shopping list"},
            ],
        }
        r = requests.post(f"{API}/decoy/profile", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

        # GET to confirm persistence
        r2 = requests.get(f"{API}/decoy/profile", params={"device_id": device_id}, timeout=10)
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body["configured"] is True
        assert body["name"] == "Decoy v1"
        assert "ZZTestContact" in body["contacts"]
        assert any(m.get("from") == "ZZTestContact" for m in body["messages"])
        assert any(n.get("title") == "ZZTestNote" for n in body["notes"])

    def test_post_strips_empties_and_overwrites(self):
        device_id = f"TEST_decoy_strip_{TS}"
        # First save
        requests.post(f"{API}/decoy/profile", json={
            "device_id": device_id, "name": "First",
            "contacts": ["A"], "messages": [{"from": "X", "text": "hi"}],
            "notes": [{"title": "T", "body": "B"}],
        }, timeout=10)
        # Overwrite with empties mixed in
        r = requests.post(f"{API}/decoy/profile", json={
            "device_id": device_id, "name": "Second",
            "contacts": ["Only", "", "  ", "Two"],
            "messages": [{"from": "Y", "text": "real"}, {"from": "Z", "text": ""}],
            "notes": [{"title": "", "body": ""}, {"title": "Keep", "body": "Me"}],
        }, timeout=10)
        assert r.status_code == 200, r.text
        body = requests.get(f"{API}/decoy/profile", params={"device_id": device_id}, timeout=10).json()
        assert body["name"] == "Second"
        # Empty contacts stripped
        assert "" not in body["contacts"]
        assert "Only" in body["contacts"] and "Two" in body["contacts"]
        # Empty messages stripped (no text)
        assert all(m.get("text") for m in body["messages"])
        # Notes: empty title+body removed, "Keep/Me" preserved
        assert any(n.get("title") == "Keep" for n in body["notes"])


# ====================== Family SOS ======================
class TestFamilySOS:
    def test_sos_sets_lost_mode_and_creates_owner_alert(self):
        device_id = f"TEST_sos_solo_{TS}"
        _setup(device_id, "SOSer")

        # Before SOS
        before = requests.get(f"{API}/status", params={"device_id": device_id}, timeout=10).json()
        assert before.get("lost_mode") in (False, None)

        # Fire SOS (panic endpoint, called by family-sos button)
        r = requests.post(f"{API}/panic", json={
            "device_id": device_id, "secret": "rec22",
            "lat": 51.5074, "lng": -0.1278,
        }, timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        assert body.get("locked") is True

        # After SOS — lost_mode true
        after = requests.get(f"{API}/status", params={"device_id": device_id}, timeout=10).json()
        assert after.get("lost_mode") is True
        assert after.get("locked") is True

        # Owner alerts list contains the SOS/Lost Phone entry
        alerts = requests.get(f"{API}/alerts", params={"device_id": device_id}, timeout=10).json()
        items = alerts.get("alerts", [])
        joined = " ".join((str(a.get("title", "")) + " " + str(a.get("body", ""))) for a in items)
        assert "Lost Phone" in joined or "Lost" in joined or "Panic" in joined, f"alerts: {items}"
        assert alerts.get("unread", 0) >= 1

    def test_parent_sees_member_alerts_unread_bump_after_sibling_sos(self):
        ts = int(time.time() * 1000)
        parent_id = f"TEST_fam_par_{ts}"
        kid_id = f"TEST_fam_kid_{ts}"
        _setup(parent_id, "Parent")
        _setup(kid_id, "Kid")

        # Parent creates a family
        r = requests.post(f"{API}/family/create", json={
            "device_id": parent_id, "name": "Parent", "member_role": "parent",
        }, timeout=10)
        assert r.status_code == 200, r.text
        code = r.json().get("family_code") or r.json().get("code")
        assert code

        # Kid (teen role) joins
        r2 = requests.post(f"{API}/family/join", json={
            "device_id": kid_id, "name": "Kid", "member_role": "teen", "family_code": code,
        }, timeout=10)
        assert r2.status_code == 200, r2.text

        # Kid fires SOS
        r3 = requests.post(f"{API}/panic", json={
            "device_id": kid_id, "secret": "rec22",
            "lat": 51.5, "lng": -0.12,
        }, timeout=10)
        assert r3.status_code == 200, r3.text

        # Parent fetches family members — kid should have alerts_unread > 0
        members = requests.get(f"{API}/family/members", params={"device_id": parent_id}, timeout=10).json()
        member_list = members.get("members", []) if isinstance(members, dict) else members
        # API doesn't expose device_id at the boundary — match by name
        kid_row = next((m for m in member_list if m.get("name") == "Kid"), None)
        assert kid_row is not None, f"Kid not visible to parent: {member_list}"
        assert kid_row.get("alerts_unread", 0) >= 1, f"alerts_unread not bumped: {kid_row}"
        assert kid_row.get("lost_mode") is True, f"lost_mode not propagated: {kid_row}"
