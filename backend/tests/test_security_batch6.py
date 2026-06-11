"""
Digital Mate - Batch 6 tests
Covers:
  - AI Security Advisor: POST /api/security/ai-insights (gpt-4o + rule fallback)
  - Trusted/Backup-number call recovery: POST /api/security/recovery/call-trigger
  - Setup now stores backup_numbers
  - SIM swap escalation: POST /api/security/device-change kind=sim now locks + lost_mode + trap_level 3
  - Network change kind=network stays a warning (no escalation)
"""
import os
import uuid
import time
import pytest
import requests

from dotenv import dotenv_values
_fe_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _fe_env.get("REACT_APP_BACKEND_URL", "")).rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not set"
API = f"{BASE_URL}/api/security"

ACCESS = "ax6262"
RECOVERY = "rec6789"
WIPE = "wp6789"
PHRASE = "bring it back"
TRUSTED = ["+15550009999"]
BACKUP = ["+15558887777"]


def _did(p="b6"):
    return f"TEST_{p}_{uuid.uuid4().hex[:8]}"


def _cleanup(d):
    try:
        requests.delete(f"{API}/events", params={"device_id": d}, timeout=10)
    except Exception:
        pass


def _setup_payload(d, **over):
    base = {
        "device_id": d, "owner_name": "Sam",
        "access_code": ACCESS, "recovery_code": RECOVERY, "wipe_code": WIPE,
        "recovery_phrase": PHRASE, "panic_pattern": "159",
        "trusted_numbers": list(TRUSTED), "backup_numbers": list(BACKUP),
        "cover_app": "calculator",
    }
    base.update(over)
    return base


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------------- AI Security Advisor ----------------------
class TestAIInsights:
    def test_returns_insights_and_facts(self, session):
        d = _did("ai")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        r = session.post(f"{API}/ai-insights", json={"device_id": d}, timeout=60)
        assert r.status_code == 200
        j = r.json()
        assert "insights" in j and isinstance(j["insights"], list) and len(j["insights"]) >= 1
        for ins in j["insights"]:
            assert "title" in ins and isinstance(ins["title"], str) and ins["title"]
            assert ins.get("severity") in ("info", "warning", "critical")
            assert "detail" in ins and isinstance(ins["detail"], str)
            assert "action" in ins and isinstance(ins["action"], str)
        assert "facts" in j and isinstance(j["facts"], dict)
        assert "recognition_trained" in j["facts"]
        assert j.get("source") in ("ai", "rules")
        _cleanup(d)

    def test_no_wiretap_claim(self, session):
        d = _did("aiw")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        r = session.post(f"{API}/ai-insights", json={"device_id": d}, timeout=60)
        j = r.json()
        blob = " ".join(
            (ins.get("title", "") + " " + ins.get("detail", "") + " " + ins.get("action", "")).lower()
            for ins in j["insights"]
        )
        for forbidden in ("wiretap", "wire-tap", "lawful interception"):
            assert forbidden not in blob, f"Advisor must not claim {forbidden}"
        _cleanup(d)

    def test_rule_fallback_reflects_untrained_recognition(self, session):
        # A brand-new device has no trained baseline, so the (rules) fallback should mention it.
        # If GPT works, source='ai' and we still validate at least one insight exists.
        d = _did("aiu")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        r = session.post(f"{API}/ai-insights", json={"device_id": d}, timeout=60)
        j = r.json()
        assert j["facts"]["recognition_trained"] is False
        assert len(j["insights"]) >= 1
        _cleanup(d)


# ---------------------- Call-trigger recovery ----------------------
class TestCallTrigger:
    def test_untrusted_number_not_triggered(self, session):
        d = _did("ct")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        r = session.post(f"{API}/recovery/call-trigger",
                         json={"device_id": d, "from_number": "+19998881111"}, timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["triggered"] is False
        assert j.get("reason") == "number_not_trusted"
        _cleanup(d)

    def test_trusted_call_three_in_five_min_triggers(self, session):
        d = _did("ct3")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        url = f"{API}/recovery/call-trigger"
        body = {"device_id": d, "from_number": TRUSTED[0]}

        r1 = session.post(url, json=body, timeout=10).json()
        assert r1["triggered"] is False and r1["count"] == 1 and r1["needed"] == 3
        r2 = session.post(url, json=body, timeout=10).json()
        assert r2["triggered"] is False and r2["count"] == 2
        r3 = session.post(url, json=body, timeout=10).json()
        assert r3["triggered"] is True
        assert r3.get("via") == "trusted_call"
        assert r3["count"] >= 3

        # status reflects lock + lost mode + trap level 3
        s = session.get(f"{API}/status", params={"device_id": d}, timeout=10).json()
        assert s["locked"] is True
        assert s["lost_mode"] is True
        assert s["trap_level"] == 3

        # owner alert created
        a = session.get(f"{API}/alerts", params={"device_id": d}, timeout=10).json()
        assert a["count"] >= 1
        assert any("trusted" in (al.get("title", "") + al.get("body", "")).lower() for al in a["alerts"])
        _cleanup(d)

    def test_backup_number_match_last7_triggers(self, session):
        d = _did("ctb")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        # Use a number whose last 7 digits match BACKUP[0] but differ in country/area code
        # BACKUP[0] = +15558887777 -> last 7 = "8887777"
        caller = "+447008887777"
        url = f"{API}/recovery/call-trigger"
        body = {"device_id": d, "from_number": caller}
        for i in range(2):
            r = session.post(url, json=body, timeout=10).json()
            assert r["triggered"] is False
            assert r["count"] == i + 1
        r3 = session.post(url, json=body, timeout=10).json()
        assert r3["triggered"] is True
        assert r3.get("via") == "trusted_call"
        _cleanup(d)

    def test_unconfigured_device_404(self, session):
        d = _did("ctn")
        r = session.post(f"{API}/recovery/call-trigger",
                         json={"device_id": d, "from_number": TRUSTED[0]}, timeout=10)
        assert r.status_code == 404


# ---------------------- Setup backup_numbers ----------------------
class TestSetupBackupNumbers:
    def test_backup_numbers_stored(self, session):
        d = _did("bn")
        payload = _setup_payload(d, trusted_numbers=["+15551234567"],
                                 backup_numbers=["+15559876543", "+15550001111"])
        r = session.post(f"{API}/setup", json=payload, timeout=10)
        assert r.status_code == 200

        # /setup/status doesn't expose backup_numbers field directly; verify via Mongo
        from pymongo import MongoClient
        from dotenv import dotenv_values
        env = dotenv_values("/app/backend/.env")
        mongo_url = os.environ.get("MONGO_URL") or env.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME") or env.get("DB_NAME")
        client = MongoClient(mongo_url)
        cfg = client[db_name].device_config.find_one({"device_id": d})
        client.close()
        assert cfg is not None
        assert cfg["trusted_numbers"] == ["+15551234567"]
        assert cfg["backup_numbers"] == ["+15559876543", "+15550001111"]

        # status endpoint still reflects configured + trusted
        s = session.get(f"{API}/setup/status", params={"device_id": d}, timeout=10).json()
        assert s["configured"] is True
        assert s["trusted_numbers"] == ["+15551234567"]
        _cleanup(d)

    def test_setup_status_returns_configuration(self, session):
        d = _did("bns")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        s = session.get(f"{API}/setup/status", params={"device_id": d}, timeout=10).json()
        assert s["configured"] is True
        assert s["cover_app"] == "calculator"
        assert s["profiles"] == ["Sam"]
        assert s["trusted_numbers"] == TRUSTED
        _cleanup(d)


# ---------------------- SIM escalation ----------------------
class TestSimEscalation:
    def test_sim_change_escalates_to_lock_lost_level3(self, session):
        d = _did("sim")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        # baseline status: not locked
        s0 = session.get(f"{API}/status", params={"device_id": d}, timeout=10).json()
        assert s0["locked"] is False
        assert s0["lost_mode"] is False

        r = session.post(f"{API}/device-change",
                         json={"device_id": d, "kind": "sim", "detail": "SIM IMSI changed"}, timeout=10)
        assert r.status_code == 200
        evt = r.json()
        assert evt["type"] == "device_change"
        assert evt["severity"] == "critical"
        assert "sim" in evt["title"].lower()

        s = session.get(f"{API}/status", params={"device_id": d}, timeout=10).json()
        assert s["locked"] is True
        assert s["lost_mode"] is True
        assert s["trap_level"] == 3

        a = session.get(f"{API}/alerts", params={"device_id": d}, timeout=10).json()
        assert a["count"] >= 1
        assert any("sim" in (al.get("title", "") + al.get("body", "")).lower() for al in a["alerts"])
        _cleanup(d)

    def test_network_change_does_not_escalate(self, session):
        d = _did("net")
        session.post(f"{API}/setup", json=_setup_payload(d), timeout=10).raise_for_status()
        alerts_before = session.get(f"{API}/alerts", params={"device_id": d}, timeout=10).json()["count"]
        r = session.post(f"{API}/device-change",
                         json={"device_id": d, "kind": "network", "detail": "Wi-Fi switched"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["severity"] == "warning"
        s = session.get(f"{API}/status", params={"device_id": d}, timeout=10).json()
        assert s["locked"] is False
        assert s["lost_mode"] is False
        assert s["trap_level"] == 0
        alerts_after = session.get(f"{API}/alerts", params={"device_id": d}, timeout=10).json()["count"]
        assert alerts_after == alerts_before
        _cleanup(d)
