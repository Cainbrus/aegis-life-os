# Digital Mate — Native Android (Kotlin) Phase Roadmap

The current app is a React + Capacitor build. It runs inside the normal Android app sandbox,
so its protection is **in-app** plus a **native Kotlin layer that has now been started**
(Device Admin, dial-code, call/SIM receivers, background recovery service — see below).
To deliver full **device-level** security, Digital Mate continues the native migration below.

---

## 5-PHASE PLAN (high level)

### Phase 1 — Current Capacitor version  ✅ (live)
React UI + FastAPI backend + Capacitor wrapper. Owner recognition (additive trust model),
Trap Mode L1-3, Recovery Center, Evidence Center, hidden Calculator/Clock/Notes cover,
user-defined codes (no defaults), AI Security Advisor. A first native Kotlin module is
included and compiles into the APK (DigitalMateNative plugin, Device Admin receiver,
SecretCodeReceiver `*#*#2468#*#*`, CallTriggerReceiver, SimChangeReceiver, RecoveryService).

### Phase 2 — Native Android (Kotlin) migration  🔨 (in progress)
Harden and finish the native layer: real Device Admin lock/wipe, trusted-caller detection,
SIM-state detection, Bluetooth bonded-device recognition, background recovery foreground
service, hidden dial-code + volume-button (AccessibilityService) access. (Detail = N1-N3 below.)

### Phase 3 — Advanced owner recognition
On-device sensor streaming (accelerometer/gyro/touch pressure), Wi-Fi SSID + Bluetooth
proximity as live factors, per-profile baselines, optional on-device TFLite model so scoring
works offline and continuously in the background. (Detail = N3 below.)

### Phase 4 — Advanced recovery tools
Remote factory wipe (Device Owner), live location streaming, remote camera/siren, anti-uninstall
(Device Admin disable lock + SIM-change lock), FCM cross-device push alerts. (Detail = N2/N5 below.)

### Phase 5 — Play Store release
Device-Admin / background-location / launcher disclosures, privacy policy, signed AAB,
staged rollout, OEM battery-optimisation guidance. (Detail = N6 below.)

---

## Why native is required
Android intentionally blocks normal apps from controlling the whole device. The capabilities
below require privileged Android APIs only available to native apps with special roles:

| Goal | Native API / role required | Notes |
|------|----------------------------|-------|
| Remote lock the whole phone | `DevicePolicyManager.lockNow()` (Device Admin) | App must be a registered Device Admin |
| Force a new lock password | `resetPasswordWithToken()` (Device Owner) | Device Owner = enterprise-grade control |
| Remote wipe the device | `DevicePolicyManager.wipeData()` (Device Admin/Owner) | Factory reset |
| Replace home screen with decoy | Launcher app (`CATEGORY_HOME` intent filter) | User sets Digital Mate as default launcher |
| Background sensors / location | Foreground Service + `ACCESS_BACKGROUND_LOCATION` | Persistent notification required |
| Capture photo when locked | `CameraX` from a foreground/admin service | Requires camera permission + service |
| True cross-device push | FCM (Firebase Cloud Messaging) | Notify owner's other device/email |

---

## Architecture (hybrid)
Keep the React UI (fast iteration) and add a native shell + plugins:

```
Android app (Kotlin)
├── MainActivity (hosts Capacitor WebView — existing React UI)
├── DigitalMateDeviceAdminReceiver        # Device Admin callbacks
├── services/
│   ├── RecoveryForegroundService.kt       # background location + heartbeat
│   ├── IntruderCaptureService.kt          # CameraX silent capture
│   └── CommandPollService.kt              # poll backend for remote lock/wipe commands
├── launcher/
│   └── DecoyLauncherActivity.kt           # CATEGORY_HOME decoy home screen
├── recognition/
│   └── BehaviorSensorCollector.kt         # accelerometer/gyro/touch/typing -> backend
└── capacitor-plugins/
    └── DigitalMateNative (Capacitor plugin bridging JS <-> Kotlin)
```

The existing FastAPI backend (`/api/security/*`) stays the source of truth. The native layer
posts telemetry and polls for owner-issued commands (lock/wipe/locate), so remote actions work
even when the WebView UI is closed.

---

## Phased plan

### Phase N1 — Device Admin foundation
- Add `DeviceAdminReceiver` + `device_admin.xml` policies (force-lock, wipe-data, watch-login).
- Onboarding flow to request Device Admin activation (`ACTION_ADD_DEVICE_ADMIN`).
- Capacitor plugin methods: `lockNow()`, `isAdminActive()`.
- Wire to existing `/api/security/recovery/lock` → real `lockNow()`.
- **Deliverable:** owner taps "Remote Lock" → the whole phone locks.

### Phase N2 — Background recovery service
- `RecoveryForegroundService` with persistent (low-key) notification.
- Background location via FusedLocationProvider → POST `/api/security/recovery/locate` every few minutes.
- `CommandPollService` polls backend for pending lock/wipe/locate commands (or FCM push, see N5).
- **Deliverable:** lost phone keeps reporting location and obeys remote commands with the app closed.

### Phase N3 — Native owner recognition
- `BehaviorSensorCollector`: accelerometer, gyroscope, touch pressure/size, typing cadence,
  Wi-Fi SSID/BSSID, connected Bluetooth devices, charging/usage patterns.
- Stream features to `/api/security/telemetry` and `/score` (reuse the existing engine).
- Optionally run an on-device TFLite model for offline scoring.
- **Deliverable:** real continuous owner recognition using true device sensors (far stronger than web).

### Phase N4 — Decoy launcher + Trap Mode
- `DecoyLauncherActivity` registered for `CATEGORY_HOME`; user opts to set Digital Mate as launcher.
- On L2/L3 trap, show the decoy home (fake apps, no real data); record interactions to
  `/api/security/trap/log-action`; silent `IntruderCaptureService` photo → `/api/security/evidence/photo`.
- Owner secret gesture/PIN restores the real launcher.
- **Deliverable:** an intruder sees a believable but empty phone; the owner gets photo + evidence.

### Phase N5 — Remote wipe + cross-device alerts
- `DevicePolicyManager.wipeData()` behind owner-code + double confirmation (reuse `/recovery/wipe`).
- FCM integration: backend pushes "intrusion"/"theft" alerts to the owner's other device or email
  companion (replaces the current in-app/local notification).
- **Deliverable:** true remote factory-wipe and real cross-device owner notifications.

### Phase N6 — Hardening & Play compliance
- Google Play **Device Admin / privileged permission** declaration & justification (these apps get
  extra review; `QUERY_ALL_PACKAGES`, background location, and Device Admin need policy disclosures).
- Anti-uninstall: warn/lock on admin-deactivation attempts; SIM-change detection.
- Battery optimisation exemptions; secure command signing (so only the owner can lock/wipe).
- **Deliverable:** store-ready, abuse-resistant build.

---

## Key risks / constraints
- **Play Store policy:** Device Admin, background location and launcher-replacement all require
  explicit disclosures and may extend review. Some Device Owner features only work via enterprise
  enrollment (EMM/QR provisioning), not a normal install.
- **OEM differences:** aggressive battery managers (Xiaomi, Samsung, etc.) can kill background
  services — needs per-OEM allow-listing guidance.
- **Security:** remote lock/wipe commands MUST be authenticated/signed server-side to prevent abuse.
- **Privacy/legal:** silent camera + location capture must be clearly disclosed in onboarding and
  privacy policy to remain compliant.

## Build prerequisites (carries over from current Capacitor build)
- Android Studio (Kotlin), min SDK 26+, target SDK 34.
- The container builds debug APKs by routing x86_64 `aapt2` through `qemu` (ARM64 host);
  native Kotlin development is best done in Android Studio locally.
