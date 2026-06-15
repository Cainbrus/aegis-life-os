"""Stage-1 iter17 — Review Folder vault flow + wrong-code security event regression."""
import os
import time
import uuid
import pytest
import requests

def _read_env():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip()
    except Exception:
        pass
    return os.environ.get("REACT_APP_BACKEND_URL", "")

BASE_URL = _read_env().rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def configured_device():
    """Fresh configured device: access 2580 / recovery rec22."""
    did = f"TEST_iter17_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    r = requests.post(f"{API}/security/setup", json={
        "device_id": did, "owner_name": "Owner",
        "access_code": "2580", "recovery_code": "rec22",
        "recovery_email": "owner@test.com",
        "cover_app": "calculator",
    })
    assert r.status_code == 200, r.text
    return did


# ---- Review folder vault flow ----
class TestReviewFolder:
    def test_add_review_item_appears_only_in_review_list(self, configured_device):
        did = configured_device
        r = requests.post(f"{API}/security/vault/add", json={
            "device_id": did, "kind": "note", "title": "TEST_review_note",
            "content": "secret in review", "status": "review",
        })
        assert r.status_code == 200, r.text
        item = r.json()
        assert item["status"] == "review"
        item_id = item["id"]

        # In review list
        rev = requests.get(f"{API}/security/vault/list", params={"device_id": did, "status": "review"})
        assert rev.status_code == 200
        rev_ids = [i["id"] for i in rev.json()["items"]]
        assert item_id in rev_ids, "Review item missing from review list"

        # NOT in vault list
        vault = requests.get(f"{API}/security/vault/list", params={"device_id": did, "status": "vault"})
        assert vault.status_code == 200
        vault_ids = [i["id"] for i in vault.json()["items"]]
        assert item_id not in vault_ids, "Review item incorrectly in vault list"

    def test_add_vault_item_default_in_vault_only(self, configured_device):
        did = configured_device
        r = requests.post(f"{API}/security/vault/add", json={
            "device_id": did, "kind": "note", "title": "TEST_vault_note",
            "content": "real vault content",  # default status
        })
        assert r.status_code == 200
        item_id = r.json()["id"]
        assert r.json()["status"] == "vault"
        vault = requests.get(f"{API}/security/vault/list", params={"device_id": did, "status": "vault"})
        assert item_id in [i["id"] for i in vault.json()["items"]]
        rev = requests.get(f"{API}/security/vault/list", params={"device_id": did, "status": "review"})
        assert item_id not in [i["id"] for i in rev.json()["items"]]

    def test_approve_moves_review_item_to_vault(self, configured_device):
        did = configured_device
        r = requests.post(f"{API}/security/vault/add", json={
            "device_id": did, "kind": "note", "title": "TEST_approve",
            "content": "approve me", "status": "review",
        })
        item_id = r.json()["id"]

        # Approve
        ap = requests.post(f"{API}/security/vault/approve", json={"device_id": did, "item_id": item_id})
        assert ap.status_code == 200
        assert ap.json().get("ok") is True

        # Now appears in vault, not in review
        vault = requests.get(f"{API}/security/vault/list", params={"device_id": did, "status": "vault"})
        assert item_id in [i["id"] for i in vault.json()["items"]]
        rev = requests.get(f"{API}/security/vault/list", params={"device_id": did, "status": "review"})
        assert item_id not in [i["id"] for i in rev.json()["items"]]

    def test_reject_deletes_review_item(self, configured_device):
        did = configured_device
        r = requests.post(f"{API}/security/vault/add", json={
            "device_id": did, "kind": "note", "title": "TEST_reject",
            "content": "reject me", "status": "review",
        })
        item_id = r.json()["id"]

        d = requests.delete(f"{API}/security/vault/item", params={"device_id": did, "item_id": item_id})
        assert d.status_code == 200
        assert d.json().get("deleted", 0) >= 1

        # Gone from both lists
        for status in ("vault", "review"):
            lst = requests.get(f"{API}/security/vault/list", params={"device_id": did, "status": status})
            assert item_id not in [i["id"] for i in lst.json()["items"]]


# ---- Setup completion / recovery contact ----
class TestSetupRecoveryContact:
    def test_setup_with_recovery_email_reports_has_email(self):
        did = f"TEST_iter17_email_{uuid.uuid4().hex[:8]}"
        r = requests.post(f"{API}/security/setup", json={
            "device_id": did, "owner_name": "Owner",
            "access_code": "2580", "recovery_code": "rec22",
            "recovery_email": "me@test.com",
        })
        assert r.status_code == 200
        st = requests.get(f"{API}/security/setup/status", params={"device_id": did}).json()
        assert st["configured"] is True
        assert st["has_email"] is True

    def test_setup_with_trusted_number_reports_in_status(self):
        did = f"TEST_iter17_num_{uuid.uuid4().hex[:8]}"
        r = requests.post(f"{API}/security/setup", json={
            "device_id": did, "owner_name": "Owner",
            "access_code": "2580", "recovery_code": "rec22",
            "trusted_numbers": ["+15551234567"],
        })
        assert r.status_code == 200
        st = requests.get(f"{API}/security/setup/status", params={"device_id": did}).json()
        assert "+15551234567" in (st.get("trusted_numbers") or [])
        # has_email should be False since no email
        assert st["has_email"] is False


# ---- Wrong-code security event ----
class TestWrongCodeEvent:
    def test_post_repeated_wrong_event(self, configured_device):
        did = configured_device
        ev = requests.post(f"{API}/security/events", json={
            "device_id": did, "type": "access_attempt", "severity": "critical",
            "title": "Repeated wrong access codes",
            "detail": "5+ failed access attempts on the cover. Decoy shown.",
        })
        assert ev.status_code == 200
        evs = requests.get(f"{API}/security/events", params={"device_id": did}).json()["events"]
        titles = [e["title"] for e in evs]
        assert "Repeated wrong access codes" in titles


# ---- Verify access still works (decoy exit unlock) ----
class TestVerifyAccessUnlock:
    def test_verify_access_with_correct_code(self, configured_device):
        r = requests.post(f"{API}/security/verify-access",
                          json={"device_id": configured_device, "code": "2580"})
        assert r.status_code == 200
        assert r.json()["verified"] is True
        assert r.json()["role"] == "owner"

    def test_verify_access_with_wrong_code(self, configured_device):
        r = requests.post(f"{API}/security/verify-access",
                          json={"device_id": configured_device, "code": "9999"})
        assert r.status_code == 200
        assert r.json()["verified"] is False
