"""Backend tests: simplified /setup, wipe fallback, and Hidden Vault endpoints (iteration 13)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://digital-mate-mvp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/security"


def _did(tag="t"):
    return f"TEST_iter13_{tag}_{uuid.uuid4().hex[:8]}"


# ---------- Simplified setup ----------
class TestSimplifiedSetup:
    def test_setup_minimal_ok(self):
        device = _did("setup")
        r = requests.post(f"{API}/setup", json={
            "device_id": device, "owner_name": "Sam", "cover_app": "calculator",
            "access_code": "2580", "recovery_code": "rec22",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert d.get("configured") is True
        assert d.get("cover_app") == "calculator"

        # confirm via setup/status
        s = requests.get(f"{API}/setup/status", params={"device_id": device}).json()
        assert s["configured"] is True
        assert s["cover_app"] == "calculator"
        assert "Sam" in (s.get("profiles") or [])

    def test_setup_access_too_short(self):
        r = requests.post(f"{API}/setup", json={
            "device_id": _did("short"), "access_code": "12", "recovery_code": "rec22",
        })
        assert r.status_code == 400

    def test_setup_recovery_too_short(self):
        r = requests.post(f"{API}/setup", json={
            "device_id": _did("recshort"), "access_code": "2580", "recovery_code": "ab",
        })
        assert r.status_code == 400

    def test_setup_access_equals_recovery(self):
        r = requests.post(f"{API}/setup", json={
            "device_id": _did("same"), "access_code": "samecode", "recovery_code": "samecode",
        })
        assert r.status_code == 400


# ---------- Wipe falls back to recovery code when no wipe_code is set ----------
class TestWipeFallback:
    def test_wipe_with_recovery_code(self):
        device = _did("wipe")
        requests.post(f"{API}/setup", json={
            "device_id": device, "owner_name": "Sam", "cover_app": "calculator",
            "access_code": "2580", "recovery_code": "rec22",
        }).raise_for_status()

        # No wipe_code set -> recovery code should authorize the wipe
        r = requests.post(f"{API}/recovery/wipe", json={
            "device_id": device, "owner_code": "rec22", "confirm": True,
        })
        assert r.status_code == 200, r.text
        assert r.json().get("wiped") is True

    def test_wipe_wrong_code_forbidden(self):
        device = _did("wipewrong")
        requests.post(f"{API}/setup", json={
            "device_id": device, "access_code": "2580", "recovery_code": "rec22",
        }).raise_for_status()
        r = requests.post(f"{API}/recovery/wipe", json={
            "device_id": device, "owner_code": "wrong", "confirm": True,
        })
        assert r.status_code == 403

    def test_wipe_without_confirm(self):
        device = _did("wipenoconfirm")
        requests.post(f"{API}/setup", json={
            "device_id": device, "access_code": "2580", "recovery_code": "rec22",
        }).raise_for_status()
        r = requests.post(f"{API}/recovery/wipe", json={
            "device_id": device, "owner_code": "rec22", "confirm": False,
        })
        assert r.status_code == 400


# ---------- Hidden Vault ----------
class TestVault:
    @pytest.fixture
    def device(self):
        d = _did("vault")
        requests.post(f"{API}/setup", json={
            "device_id": d, "access_code": "2580", "recovery_code": "rec22",
        }).raise_for_status()
        return d

    def test_add_note_no_content_in_response(self, device):
        r = requests.post(f"{API}/vault/add", json={
            "device_id": device, "kind": "note", "title": "Secret",
            "content": "my secret note text",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and d["kind"] == "note" and d["title"] == "Secret"
        assert "created_at" in d
        assert "content" not in d, f"vault/add must NOT echo content, got: {d}"

    def test_add_photo_data_url(self, device):
        data_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB"  # tiny stub
        r = requests.post(f"{API}/vault/add", json={
            "device_id": device, "kind": "photo", "title": "Pic", "content": data_url,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["kind"] == "photo"
        assert "content" not in d

    def test_list_excludes_content(self, device):
        requests.post(f"{API}/vault/add", json={
            "device_id": device, "kind": "note", "title": "N1", "content": "txt",
        }).raise_for_status()
        r = requests.get(f"{API}/vault/list", params={"device_id": device})
        assert r.status_code == 200
        body = r.json()
        assert body["count"] >= 1
        for it in body["items"]:
            assert "content" not in it, f"vault/list must NOT include content: {it}"
            assert "id" in it and "title" in it and "kind" in it

    def test_item_returns_content(self, device):
        # Test data (not a real credential) used to verify vault content round-trips
        test_content = "the actual note body used for round-trip assertion"
        created = requests.post(f"{API}/vault/add", json={
            "device_id": device, "kind": "note", "title": "Full", "content": test_content,
        }).json()
        r = requests.get(f"{API}/vault/item", params={"device_id": device, "item_id": created["id"]})
        assert r.status_code == 200
        d = r.json()
        assert d.get("content") == test_content
        assert d.get("kind") == "note"

    def test_delete_item(self, device):
        created = requests.post(f"{API}/vault/add", json={
            "device_id": device, "kind": "note", "title": "DelMe", "content": "x",
        }).json()
        r = requests.delete(f"{API}/vault/item", params={"device_id": device, "item_id": created["id"]})
        assert r.status_code == 200
        assert r.json().get("deleted", 0) >= 1
        # confirm 404 on the item now
        r2 = requests.get(f"{API}/vault/item", params={"device_id": device, "item_id": created["id"]})
        assert r2.status_code == 404

    def test_oversize_returns_413(self, device):
        big = "x" * (8_000_001)  # > MAX_VAULT_BYTES
        r = requests.post(f"{API}/vault/add", json={
            "device_id": device, "kind": "note", "title": "Big", "content": big,
        })
        assert r.status_code == 413, f"expected 413 for oversize, got {r.status_code}"

    def test_wipe_clears_vault(self, device):
        # Add a vault item then wipe; vault list should be empty.
        requests.post(f"{API}/vault/add", json={
            "device_id": device, "kind": "note", "title": "wipe-me", "content": "x",
        }).raise_for_status()
        pre = requests.get(f"{API}/vault/list", params={"device_id": device}).json()
        assert pre["count"] >= 1
        wr = requests.post(f"{API}/recovery/wipe", json={
            "device_id": device, "owner_code": "rec22", "confirm": True,
        })
        assert wr.status_code == 200
        post = requests.get(f"{API}/vault/list", params={"device_id": device}).json()
        assert post["count"] == 0
