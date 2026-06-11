# Digital Mate — Product Requirements Document

## Original Problem Statement
Digital Mate is a **stealth security & recovery app** (not a general "Life OS"). Core purpose:
**security, owner recognition, and device recovery.** One excellent security app — not ten average apps in one.

Stack: React + FastAPI + MongoDB, wrapped with Capacitor for Android.

## Product Pivot (Dec 2025)
Removed all general-purpose "Life OS" / demo features. Refocused entirely on security & recovery.

### Removed entirely
Finance, Health, Family Tracker, Workforce Monitor, Living City, Story Mode, Smart Email demo,
Investor Demo Guide, Interactive Previews, Contextual Hub, Hub Screens, Learning Mode,
Invisible (fake-phone) Mode, Voice Interface, old Landing Page, Setup Wizard, Onboarding,
UserModeHome, AppModeContext (Demo/User dual-mode system).

## Core MVP Features

### Priority 1 (implemented)
- **Owner Recognition Engine** — real deterministic model (per-feature Gaussian similarity vs a
  learned baseline, std floored to ~10% of mean for robustness). **14 signals**: typing rhythm,
  key dwell time, key flight time, typing consistency, touch duration, touch pressure, tap cadence,
  swipe velocity, swipe length, device motion, time-of-day, day-of-week, **location habit**
  (Gaussian over distance to known places), **app-usage habit** (familiar in-app screens).
  Continuous — recognizes the owner even after the correct PIN. NOT random. Auto-trains after 8 owner samples.
- **Trap Mode (INVISIBLE)** — no visible decoy/fake-phone; the app keeps operating normally while
  silently capturing evidence. The intruder is never warned.
- **Intruder Detection & Evidence Logging** — front-camera capture, access attempts, device/network
  changes, locations — all recorded to a timeline (with photo thumbnails + map links).
- **Device Recovery** — locate (real GPS -> map), remote lock (Lost Mode), location history.

### Priority 2 (implemented)
- **Remote Lock / Unlock** — owner-code verified.
- **Remote Wipe** — owner-code + explicit 2-step confirmation (safe against accidental wipes).
- **Emergency Owner Command** — hidden owner secret verification (`/security/emergency/verify`).
- **Lost Phone Tracking** — `/security/recovery/locate` + `/location` history.

### Priority 3 (partial)
- **AI Digital Mate Assistant** — chat assistant (GPT-4o via Emergent LLM) — functional.
- Email organization / Notes & Tasks / Calendar — NOT yet built (backlog).

## Architecture
```
/app/
├── backend/
│   ├── server.py                    # core (auth, vault, AI chat, stripe) + includes security_router
│   └── routes/
│       └── security_engine.py       # NEW: /api/security/* owner-recognition, trap, evidence, recovery
├── frontend/
│   ├── android/                     # Capacitor project (web assets synced into assets/public)
│   └── src/
│       ├── App.js                   # lean shell: website ↔ app, bottom nav, trap detection, vault
│       ├── services/TelemetryService.js   # NEW: behavioural signal collector + device_id
│       └── components/
│           ├── SecurityDashboard.js  # NEW: home hub
│           ├── OwnerRecognition.js   # NEW: trust gauge, training, signal breakdown
│           ├── RecoveryCenter.js     # NEW: locate/lock/unlock/wipe
│           ├── EvidenceCenter.js     # NEW: timeline
│           ├── TrapDecoy.js          # NEW: in-app decoy
│           ├── AegisChat.js          # AI Mate (kept)
│           ├── CalculatorVault.js / PhoneDialer.js  # Invisible Vault (kept)
│           └── DigitalMateWebsite.js / SubscriptionPages.js  # marketing + Stripe (kept)
```

## Security Engine API (`/api/security/*`)
- `POST /telemetry` — collect behavioural sample (label "owner" trains baseline ≥8 samples)
- `POST /score` — deterministic trust score; auto-activates trap + logs event if < 0.60
- `GET /status?device_id` — trained, sample_count, trust, trap, locked, intruders, threats
- `POST /baseline/reset`
- `GET/POST/DELETE /events` — evidence timeline
- `POST /device-change` — record network change (any) or SIM change (also alerts owner)
- `GET /trap/status`, `POST /trap/activate|deactivate|log-action`
- `POST /recovery/lock|unlock|wipe|locate`, `GET /recovery/location`
- `POST /emergency/verify`

## Credentials (NO DEFAULTS — three separate codes)
- **No hardcoded codes exist.** Each owner sets their own during first-run **Setup** (6 steps):
  - **Access code** — opens the dashboard from the cover app
  - **Recovery code** — starts Lost-Phone / Recovery mode
  - **Wipe code** — last-resort remote wipe only (must differ from the others)
  - Recovery phrase + optional Panic pattern (silent recovery triggers)
  - Cover app: Calculator (default) / Clock / Notes
  - Trusted phone numbers; optional recovery email
  - All codes/phrase/pattern bcrypt-hashed. Multiple owner profiles supported (each own access code).
- The app boots into the chosen **cover app**; the dashboard opens only with the Access code.
- Destructive actions return 403 until configured. device_id: localStorage `dm_device_id`.
- For testing, configure via `POST /api/security/setup` (see /app/memory/test_credentials.md).

## Platform Reality (important)
A Capacitor app runs in the Android sandbox. It CANNOT truly replace/lock the whole phone OS,
fake the entire device, or wipe other apps' data. Those need a native Device Admin / launcher app
(future Kotlin phase). Current build delivers the real, achievable version: in-app owner recognition,
in-app decoy Trap Mode, app/vault remote lock & wipe, and real GPS recovery.

## Testing Status (Dec 2025)
- Backend: 17/17 pytest pass (`/app/backend/tests/test_security_engine.py`).
- Frontend: 100% of required security flows verified (testing agent, iteration_1).
- APK: rebuilt (debug) with new security bundle; served at `/api/download/apk`.

## Android Build (in-container)
Container is ARM64; Google build-tools are x86_64 → `aapt2` routed through `qemu-x86_64`
via `android.aapt2FromMavenOverride`. Toolchain (JDK17 + Android SDK + qemu) must be reinstalled
after any pod reset since it lives outside `/app`.

## Roadmap
### P0/P1 — Done
- [x] Delete all Life OS / demo features
- [x] Owner Recognition engine (real model) + one-click baseline training
- [x] Trap Mode (recognition-driven decoy)
- [x] Evidence Center (photos + locations + events, lightbox, LEVEL badges)
- [x] Device Recovery (locate/lock/unlock/wipe, safe confirm)
- [x] **Trap Trigger Levels** — L1 log / L2 silent photo+GPS / L3 notify+recovery-lock
- [x] **Front-camera intruder capture** on trap (L2/L3) -> stored as evidence
- [x] **GPS location logging every 2 min during trap**
- [x] **Push/local notification to owner** on intrusion (browser Notification API + service worker)
- [x] **Panic / Lost Phone button** (lock + track + capture + alert, 2-step confirm)
- [x] **Expanded owner recognition** — 14 signals incl. dwell/flight/pressure/tap/swipe-length, location & app-usage habits; std-floor robustness
- [x] **Invisible Trap Mode** — removed fake-phone decoy; silent evidence capture only
- [x] **Network-change recording** + SIM-change endpoint (native fills SIM detection)
- [x] **First-run Setup — no default codes** (owner-defined recovery/vault codes bcrypt-hashed + trusted numbers); all destructive actions verify per-device
- [x] **Privacy & Security Scan** advisor — Safe/Review/High-Risk + honest native_pending items; per-app/system checks deferred to native; never claims wiretap/lawful-interception detection
- [x] **Three separate codes** (Access / Recovery / Wipe) — all owner-defined, bcrypt-hashed, distinct
- [x] **Stealth cover mode** — app opens as Calculator (default) / Clock / Notes; dashboard opens only with the Access code; Lock button re-hides
- [x] **Recovery phrase + Panic pattern** silent triggers (`/recovery/trigger`)
- [x] **Multiple owner profiles** (each with own access code; `/profiles/add`)
- [x] **Battery % + charging** in evidence; **new-device detection** event
- [x] **AI Security Advisor** (Mate tab) — real-data insights via GPT-4o + rule-based fallback (replaced the chat clone)
- [x] **Trusted/backup-number call recovery** — 3 calls in 5 min from a trusted/backup number auto-starts recovery (`/recovery/call-trigger`; native call-detection feeds it)
- [x] **SIM-swap escalation** — SIM change now auto locks + lost-mode + Level 3 + owner alert
- [x] **Recovery dashboard** — Mark phone lost / Mark recovered controls
- [x] **"Who's using my phone right now?" live monitor (HEADLINE FEATURE)** — dashboard centerpiece: live trust score + band label (Definitely owner / Uncertain / Suspicious / Likely thief), why it changed (matching vs mismatching signals), last recognised owner, current location, trap status; auto re-scores
- [x] Rebuild focused APK (debug)

### Build order from here (owner's priority)
1. [x] "Who's using my phone?" dashboard
2. [x] Trusted Family Recognition (roles: owner/trusted/limited/guest; role-gated UI)
3. [x] SIM swap detection (server escalation + native SIM_STATE receiver)
4. [x] Cross-device alerts — Resend email wired (dormant until RESEND_API_KEY set)
5. [x] **Additive trust model** — behaviour 25 / location 25 / known-device 20 / PIN 15 / app-usage 15; bands 70/40/20 Normal/Monitor/Trap/Recovery with debounce (reduces family false alarms)
6. [x] Hidden calculator/clock/notes cover access
7. [~] **NATIVE ANDROID (Kotlin) PHASE — STARTED & COMPILES INTO APK** (on-device testing required)

### Native Android (Kotlin) — in the APK, needs on-device testing
Files: `android/app/src/main/java/com/digitalmate/app/*.kt` + manifest + `res/xml/device_admin.xml`
- `DigitalMatePlugin` (Capacitor): requestDeviceAdmin, isAdminActive, lockNow, wipeDevice, getSimSerial, getBondedDevices, startRecoveryService, configure
- `DigitalMateDeviceAdminReceiver` — Device Admin lock/wipe + anti-disable
- `SecretCodeReceiver` — hidden dial code `*#*#2468#*#*` → recovery trigger
- `CallTriggerReceiver` — trusted-number ring detection → /recovery/call-trigger
- `SimChangeReceiver` — SIM_STATE_CHANGED → /device-change (sim)
- `RecoveryService` — foreground bg location reporting → /recovery/locate
- JS bridge `frontend/src/services/NativeBridge.js`; configured on unlock; native lock on panic
- **Build verified**: `gradlew assembleDebug` BUILD SUCCESSFUL with Kotlin. Functional verification needs a real device + runtime permissions.

### Native next sub-steps (N4-N6)
- [ ] Volume-button panic sequence (needs AccessibilityService)
- [ ] Launcher/decoy at OS level; FCM push; carrier-privilege SIM serial
- [ ] Play Store Device-Admin disclosures & review

### P2 — Next (security only — no productivity features per owner)
- [ ] Email owner alerts via Resend at Level 3 / SIM change / panic (plumbing ready; awaiting user API key)
- [ ] Cross-device push alerts (FCM)
- [ ] Per-profile behavioural baselines (currently shared device baseline across owners)
- [ ] Charging-habit + Bluetooth-device recognition signals (Bluetooth needs native)

### P3 — Native Android (Kotlin) phase — see /app/NATIVE_ANDROID_ROADMAP.md
- [ ] Device Admin (real device lock/wipe)
- [ ] Launcher replacement (full-OS decoy)
- [ ] Background recovery foreground service (location + command polling)
- [ ] Native sensor-based owner recognition
- [ ] Switch Stripe to production key; Play Store submission (with Device Admin disclosures)

> Note: explicitly NOT building Email, Calendar, Notes or productivity features.
> Focus stays 100% on security, recovery and owner recognition.

## Status
- Phase: Stage 1 MVP (security-focused) — working & tested
- Last Updated: December 2025
