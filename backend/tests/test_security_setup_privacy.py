"""
Digital Mate - Batch 4 tests
Covers:
- /setup/status & /setup validation (no defaults, per-device codes)
- Destructive endpoints blocked BEFORE setup (old 15987 must NOT work anywhere)
- /verify-recovery & /verify-vault per-device verification
- bcrypt-hashed at rest (no plaintext) for recovery code
- /privacy-scan: ~22 checks, native_pending count, SIM->high_risk transition,
  disclaimer-required catalog fields (detected/risk/action/settings)
"""
import os
import uuid
import asyncio
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://digital-mate-mvp.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/security"

RECOVERY = "test7421"
VAULT = "3344"
TRUSTED = ["+15551234567"]


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _new_did(prefix="setup"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:8]}"


def _cleanup(did):
    try:
        requests.delete(f"{API}/events", params={"device_id": did}, timeout=10)
    except Exception:
        pass


# ---------------- /setup/status & no-defaults blocking ----------------
class TestNoDefaults:
    def test_fresh_device_not_configured(self, session):
        did = _new_did("fresh")
        r = session.get(f"{API}/setup/status", params={"device_id": did}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["configured"] is False
        assert d["vault_set"] is False
        assert d["trusted_numbers"] == []
        _cleanup(did)

    def test_old_default_15987_blocked_before_setup(self, session):
        did = _new_did("nodefault")
        # Using the OLD default code that used to work must now be rejected
        r = session.post(f"{API}/recovery/wipe", json={
            "device_id": did, "owner_code": "15987", "confirm": True,
        }, timeout=10)
        assert r.status_code == 403, f"Expected 403 for legacy default, got {r.status_code}: {r.text}"
        # Also unlock, trap-deactivate, emergency/verify must fail before setup
        r2 = session.post(f"{API}/recovery/unlock", json={"device_id": did, "owner_code": "15987"}, timeout=10)
        assert r2.status_code == 403
        r3 = session.post(f"{API}/trap/deactivate", json={"device_id": did, "owner_code": "15987"}, timeout=10)
        assert r3.status_code == 403
        r4 = session.post(f"{API}/emergency/verify", json={"device_id": did, "owner_code": "15987"}, timeout=10)
        assert r4.status_code == 200 and r4.json()["verified"] is False
        _cleanup(did)


# ---------------- /setup validation ----------------
class TestSetupValidation:
    def test_setup_empty_trusted_numbers_400(self, session):
        did = _new_did("val")
        r = session.post(f"{API}/setup", json={
            "device_id": did, "recovery_code": RECOVERY, "vault_code": VAULT, "trusted_numbers": [],
        }, timeout=10)
        assert r.status_code == 400
        _cleanup(did)

    def test_setup_vault_non_numeric_400(self, session):
        did = _new_did("val")
        r = session.post(f"{API}/setup", json={
            "device_id": did, "recovery_code": RECOVERY, "vault_code": "ab12", "trusted_numbers": TRUSTED,
        }, timeout=10)
        assert r.status_code == 400
        _cleanup(did)

    def test_setup_vault_too_short_400(self, session):
        did = _new_did("val")
        r = session.post(f"{API}/setup", json={
            "device_id": did, "recovery_code": RECOVERY, "vault_code": "12", "trusted_numbers": TRUSTED,
        }, timeout=10)
        assert r.status_code == 400
        _cleanup(did)

    def test_setup_recovery_too_short_400(self, session):
        did = _new_did("val")
        r = session.post(f"{API}/setup", json={
            "device_id": did, "recovery_code": "abc", "vault_code": VAULT, "trusted_numbers": TRUSTED,
        }, timeout=10)
        assert r.status_code == 400
        _cleanup(did)

    def test_setup_valid_configures_device(self, session):
        did = _new_did("ok")
        r = session.post(f"{API}/setup", json={
            "device_id": did, "recovery_code": RECOVERY, "vault_code": VAULT, "trusted_numbers": TRUSTED,
        }, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True and d["configured"] is True
        # /setup/status should now reflect configured
        s = session.get(f"{API}/setup/status", params={"device_id": did}, timeout=10).json()
        assert s["configured"] is True
        assert s["vault_set"] is True
        assert s["trusted_numbers"] == TRUSTED
        _cleanup(did)


# ---------------- /verify-recovery & /verify-vault ----------------
class TestVerifyCodes:
    @pytest.fixture(scope="class")
    def configured_did(self, session):
        did = _new_did("verify")
        session.post(f"{API}/setup", json={
            "device_id": did, "recovery_code": RECOVERY, "vault_code": VAULT, "trusted_numbers": TRUSTED,
        }, timeout=10).raise_for_status()
        yield did
        _cleanup(did)

    def test_verify_recovery_wrong(self, session, configured_did):
        r = session.post(f"{API}/verify-recovery",
                         json={"device_id": configured_did, "code": "wrongcode"}, timeout=10)
        assert r.status_code == 200 and r.json()["verified"] is False

    def test_verify_recovery_correct(self, session, configured_did):
        r = session.post(f"{API}/verify-recovery",
                         json={"device_id": configured_did, "code": RECOVERY}, timeout=10)
        assert r.status_code == 200 and r.json()["verified"] is True

    def test_verify_vault_correct(self, session, configured_did):
        r = session.post(f"{API}/verify-vault",
                         json={"device_id": configured_did, "code": VAULT}, timeout=10)
        assert r.status_code == 200 and r.json()["verified"] is True

    def test_verify_vault_wrong(self, session, configured_did):
        r = session.post(f"{API}/verify-vault",
                         json={"device_id": configured_did, "code": "9999"}, timeout=10)
        assert r.status_code == 200 and r.json()["verified"] is False


# ---------------- Destructive endpoints after setup ----------------
class TestDestructiveGuarded:
    @pytest.fixture(scope="class")
    def did(self, session):
        d = _new_did("destr")
        session.post(f"{API}/setup", json={
            "device_id": d, "recovery_code": RECOVERY, "vault_code": VAULT, "trusted_numbers": TRUSTED,
        }, timeout=10).raise_for_status()
        yield d
        _cleanup(d)

    def test_unlock_wrong_code_403(self, session, did):
        r = session.post(f"{API}/recovery/unlock",
                         json={"device_id": did, "owner_code": "00000"}, timeout=10)
        assert r.status_code == 403

    def test_unlock_correct_code_ok(self, session, did):
        r = session.post(f"{API}/recovery/unlock",
                         json={"device_id": did, "owner_code": RECOVERY}, timeout=10)
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_trap_deactivate_wrong_403(self, session, did):
        r = session.post(f"{API}/trap/deactivate",
                         json={"device_id": did, "owner_code": "00000"}, timeout=10)
        assert r.status_code == 403

    def test_trap_deactivate_correct_ok(self, session, did):
        r = session.post(f"{API}/trap/deactivate",
                         json={"device_id": did, "owner_code": RECOVERY}, timeout=10)
        assert r.status_code == 200

    def test_emergency_verify_wrong(self, session, did):
        r = session.post(f"{API}/emergency/verify",
                         json={"device_id": did, "owner_code": "00000"}, timeout=10)
        assert r.status_code == 200 and r.json()["verified"] is False

    def test_emergency_verify_correct(self, session, did):
        r = session.post(f"{API}/emergency/verify",
                         json={"device_id": did, "owner_code": RECOVERY}, timeout=10)
        assert r.status_code == 200 and r.json()["verified"] is True

    def test_wipe_missing_confirm_400(self, session, did):
        r = session.post(f"{API}/recovery/wipe",
                         json={"device_id": did, "owner_code": RECOVERY, "confirm": False}, timeout=10)
        assert r.status_code == 400

    def test_wipe_wrong_code_403(self, session, did):
        r = session.post(f"{API}/recovery/wipe",
                         json={"device_id": did, "owner_code": "00000", "confirm": True}, timeout=10)
        assert r.status_code == 403

    def test_wipe_ok_with_code_and_confirm(self, session, did):
        r = session.post(f"{API}/recovery/wipe",
                         json={"device_id": did, "owner_code": RECOVERY, "confirm": True}, timeout=10)
        assert r.status_code == 200 and r.json()["wiped"] is True


# ---------------- bcrypt at rest ----------------
class TestBcryptAtRest:
    def test_recovery_hash_is_bcrypt_not_plaintext(self, session):
        """Verify the recovery code is stored as a bcrypt hash, never as plaintext."""
        did = _new_did("hash")
        session.post(f"{API}/setup", json={
            "device_id": did, "recovery_code": RECOVERY,
            "vault_code": VAULT, "trusted_numbers": TRUSTED,
        }, timeout=10).raise_for_status()

        # Open mongo directly (sync pymongo) and read device_config doc
        from pymongo import MongoClient
        mongo_url = os.environ["MONGO_URL"].strip().strip('"').strip("'")
        db_name = os.environ["DB_NAME"].strip().strip('"').strip("'")
        client = MongoClient(mongo_url)
        cfg = client[db_name].device_config.find_one({"device_id": did})
        client.close()
        assert cfg is not None, "device_config not persisted"
        rh = cfg.get("recovery_hash", "")
        vh = cfg.get("vault_hash", "")
        # bcrypt hashes start with $2a$/$2b$/$2y$
        assert rh.startswith("$2"), f"recovery_hash not bcrypt: {rh[:10]}"
        assert vh.startswith("$2"), f"vault_hash not bcrypt: {vh[:10]}"
        # And the plaintext must NOT be present anywhere in the doc
        assert RECOVERY not in str(cfg)
        assert VAULT not in str(cfg)
        # Also no 'recovery_code'/'vault_code' plaintext fields
        assert "recovery_code" not in cfg
        assert "vault_code" not in cfg
        _cleanup(did)


# ---------------- Privacy & Security Scan ----------------
class TestPrivacyScan:
    @pytest.fixture(scope="class")
    def configured_did(self, session):
        did = _new_did("scan")
        session.post(f"{API}/setup", json={
            "device_id": did, "recovery_code": RECOVERY,
            "vault_code": VAULT, "trusted_numbers": TRUSTED,
        }, timeout=10).raise_for_status()
        yield did
        _cleanup(did)

    def test_scan_structure_and_counts(self, session, configured_did):
        payload = {
            "device_id": configured_did,
            "signals": {
                "camera": "granted", "microphone": "denied",
                "geolocation": "granted", "notifications": "granted",
                "secure_context": True,
            },
        }
        r = session.post(f"{API}/privacy-scan", json=payload, timeout=15)
        assert r.status_code == 200
        d = r.json()
        # Overall and counts
        assert d["overall"] in ("safe", "review", "high_risk")
        counts = d["counts"]
        for k in ("safe", "review", "high_risk", "native_pending"):
            assert k in counts and isinstance(counts[k], int)
        checks = d["checks"]
        # ~22 checks total (4 self + secure_context + sim + network + new_device + 14 native = 22)
        assert 20 <= len(checks) <= 26, f"unexpected check count: {len(checks)}"
        # Every check has required fields
        for c in checks:
            for k in ("id", "category", "label", "status", "detected", "risk", "action"):
                assert k in c, f"check missing {k}: {c}"
            assert "settings" in c  # may be None for non-action items
        # native_pending count should match the 14-item catalog
        native = [c for c in checks if c["status"] == "native_pending"]
        assert len(native) == 14, f"expected 14 native_pending, got {len(native)}"
        # The 14 native ids the spec demands
        native_ids = {c["id"] for c in native}
        expected_native = {"sms_apps", "mic_apps", "camera_apps", "calllog_apps",
                           "contacts_apps", "location_apps", "overlay_apps", "accessibility",
                           "device_admin", "vpn", "developer_mode", "usb_debugging",
                           "new_google", "recent_perms"}
        assert expected_native.issubset(native_ids), f"missing: {expected_native - native_ids}"

    def test_scan_microphone_denied_marks_review(self, session, configured_did):
        payload = {
            "device_id": configured_did,
            "signals": {"camera": "granted", "microphone": "denied",
                        "geolocation": "granted", "notifications": "granted",
                        "secure_context": True},
        }
        d = session.post(f"{API}/privacy-scan", json=payload, timeout=15).json()
        mic = next(c for c in d["checks"] if c["id"] == "self_microphone")
        assert mic["status"] == "review"

    def test_scan_no_lawful_interception_claim(self, session, configured_did):
        """The advisor must NEVER claim to detect wiretaps/lawful interception."""
        payload = {"device_id": configured_did, "signals": {"secure_context": True}}
        d = session.post(f"{API}/privacy-scan", json=payload, timeout=15).json()
        blob = " ".join(
            (c.get("label", "") + " " + c.get("detected", "") + " " + c.get("risk", "")
             + " " + c.get("action", "")).lower() for c in d["checks"]
        )
        for forbidden in ("wiretap", "lawful interception", "police listening", "law-enforcement intercept"):
            assert forbidden not in blob, f"Forbidden claim present: {forbidden}"

    def test_sim_change_makes_overall_high_risk(self, session):
        did = _new_did("sim")
        session.post(f"{API}/setup", json={
            "device_id": did, "recovery_code": RECOVERY,
            "vault_code": VAULT, "trusted_numbers": TRUSTED,
        }, timeout=10).raise_for_status()
        # Baseline scan -> not high_risk on sim_change
        d0 = session.post(f"{API}/privacy-scan", json={
            "device_id": did, "signals": {"secure_context": True,
                                          "camera": "granted", "microphone": "granted",
                                          "geolocation": "granted", "notifications": "granted"},
        }, timeout=15).json()
        sim0 = next(c for c in d0["checks"] if c["id"] == "sim_change")
        assert sim0["status"] == "safe"
        # Log a SIM change
        rc = session.post(f"{API}/device-change",
                          json={"device_id": did, "kind": "sim", "detail": "new ICCID"}, timeout=10)
        assert rc.status_code == 200
        # Re-scan -> sim_change should be high_risk and overall high_risk
        d1 = session.post(f"{API}/privacy-scan", json={
            "device_id": did, "signals": {"secure_context": True,
                                          "camera": "granted", "microphone": "granted",
                                          "geolocation": "granted", "notifications": "granted"},
        }, timeout=15).json()
        sim1 = next(c for c in d1["checks"] if c["id"] == "sim_change")
        assert sim1["status"] == "high_risk"
        assert d1["overall"] == "high_risk"
        _cleanup(did)
