# Digital Mate — Audit Report
Focus: owner-recognition, anti-theft, recovery, trap mode. (Generated this session.)

## 1. Demo / placeholder removal — COMPLETE
Removed previously and verified clean this session (no references remain in `src/`):
Finance, Family, Health, Living City, Workforce, Story Mode, Contextual Hub, demo cards,
Smart Email demo, Investor/Story tooling, old chat clone, plus 2 stale backup files
(`App_backup.js`, `App_pattern_update.js`). No fake/sample security data in the engine.

## 2. WORKING (fully functional, tested — backend 107/107 pytest)
- **Owner Recognition Engine** — learns typing (speed/dwell/flight/variance), swipe (velocity/length),
  touch (duration/pressure/tap cadence), motion, time-of-day, day-of-week, trusted locations,
  app-usage habits. **Additive confidence score** (behaviour 25 / location 25 / known-device 20 /
  PIN 15 / app-usage 15) with bands 70/40/20 = Normal/Monitor/Trap/Recovery (debounced) — reduces
  false alarms for family.
- **Trap Mode L1/L2/L3** — L1 monitor+log; L2 evidence (front-camera photo, GPS, battery) + tracking;
  L3 recovery + owner alert + lock. Invisible (no decoy/warning to intruder).
- **Recovery Center** — Lost-phone mode, Mark lost/recovered, locate (map), remote lock/unlock,
  remote wipe (separate Wipe code + 2-step confirm), location history.
- **Evidence Center** — timeline of events, intrusion history, photo thumbnails + lightbox, GPS
  events, SIM/network/device-change events, LEVEL badges.
- **Hidden Access** — user-defined Access/Recovery/Wipe codes (bcrypt, no defaults), Calculator/
  Clock/Notes cover, secret recovery phrase + panic pattern, trusted/backup numbers + emails.
- **Trusted Family** — profiles with roles (owner/trusted/limited/guest), role-gated UI.
- **Trusted Caller Recovery** — configurable N calls in M minutes (server logic).
- **AI Security Advisor** — GPT-4o explains events/intrusions, assists recovery, flags risks (rule
  fallback). Not a productivity chatbot.
- **Live "Who's using my phone right now?"** dashboard — trust score + why + last owner + location + trap.
- **Privacy & Security Scan** — observable checks + honest native-pending items.

## 3. PARTIAL (works in-app / server-side; full power needs native device APIs)
- **SIM-swap detection** — server escalation + native `SimChangeReceiver` (SIM state). Full SIM serial
  needs carrier privileges (Android 10+ blocks it for normal apps).
- **Trusted-caller detection** — backend trigger + native `CallTriggerReceiver` written; needs on-device
  `READ_PHONE_STATE` + real call events.
- **Bluetooth owner recognition** — native `getBondedDevices` written; live "watch nearby" needs on-device
  connection state.
- **Cross-device alerts** — Resend email wired to L3/SIM/panic; dormant until `RESEND_API_KEY` is set.
- **Background monitoring** — native `RecoveryService` (foreground) written; needs on-device permissions.
- **Device Admin lock/wipe** — native plugin written; needs user to grant Device Admin on-device.

## 4. PLACEHOLDER / TO BUILD
- **Volume-button panic sequence** — needs an Android AccessibilityService (native sub-step N4).
- **OS-level launcher decoy** — needs launcher-replacement app (native N4).
- **FCM cross-device push** — native N5.
- **Per-profile behavioural baselines** — currently a shared family baseline.

## 5. BLOCKERS (technical limits + solutions)
| Limit | Why | Solution |
|-------|-----|----------|
| Can't lock/wipe whole device from Capacitor | Sandbox | Native Device Admin (done, needs on-device grant) |
| Can't read other apps' permissions (Privacy Scan) | Sandbox | Native `PackageManager` + QUERY_ALL_PACKAGES (Phase 2) |
| SIM serial unreadable (Android 10+) | OS privacy | Use SIM-state broadcast (done); serial via carrier privileges only |
| Detect incoming calls in background | Needs native | `CallTriggerReceiver` (done, on-device test) |
| Volume-button capture in background | Needs Accessibility | AccessibilityService (Phase 2 / N4) |
| Native features untestable in CI | Headless ARM64, no device/telephony | Build verified (compiles into APK); functional test on a real phone |
| Build toolchain wiped on pod restart | Non-/app filesystem reset | Reinstall JDK+SDK to rebuild APK (scripted) |

## 6. APK
Fresh debug APK built (native Kotlin compiled in). Verified: app launches into the **security Setup**
("create your own codes", Calculator/Clock/Notes cover) — no demo cards, no Life OS. Focus is
security + recovery. Install: `…/api/download/apk`.
