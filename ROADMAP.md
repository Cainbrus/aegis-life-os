# Digital Mate — Master Roadmap (owner's vision)

> Install once → set up once → train briefly → then forget it. A silent digital bodyguard that
> protects, learns, assists. Anti-theft + fake-phone is the CORE; assistant features come last.

## PHASE 1 — Security First  ✅ (built; native bits need on-device)
- Owner Recognition: typing/touch/swipe/app-usage/routines/locations/Bluetooth/family devices ✅ (Bluetooth = native)
- Trap Mode: silent, no warnings, records activity/evidence/location, notifies owner, escalates ✅
- Fake Phone / Decoy: home, messages, contacts, photos, notes, phone, camera, settings, weather ✅
- Owner access: hidden gesture + access code + recovery code; wrong code stays in decoy ✅
- Evidence: photos, GPS, timestamps, behaviour changes, secure store ✅
- Recovery: mark lost, recovery mode, tracking, emergency, timeline ✅
- Protection checklist: Camera, Location, Notifications, Bluetooth, Phone, Device Admin, Recovery Email, Family Protection, Decoy ✅ (native items pending on-device)

## PHASE 2 — Family Protection  (in progress)- Parent role: see all members + all locations + alerts + manage settings/history ✅
- **Teen role**: see siblings + sibling locations + message family; CANNOT see parent locations/history/activity ⬅ building
- **Child role**: see siblings only (no locations); cannot see parents; cannot change settings ⬅ building
- Real-time family alerts: leaves safe zone (geofence), phone stolen, emergency, suspicious, device offline ⬅ future (geofence/heartbeat = native/background)
- Family messaging (teen) ⬅ future

## PHASE 3 — Privacy Guardian AI  (future)
- Learning mode: ask "hide emails/messages/photos/documents/websites like this?"
- Invisible Vault ✅ (exists) — move private content in
- NEVER auto-delete: 100% certain → Invisible Vault; not certain → Review Folder
- Owner review (daily/weekly): approve (learn) / reject (return); gets smarter over time

## PHASE 4 — Digital Mate Assistant  (LAST, after security is solid)
- Email management, Calendar, Travel assistant, Task management
- Becomes: Security Guard + Recovery Expert + Family Coordinator + Privacy Manager + Personal Assistant

## Build order: Security → Family → Privacy → Assistant
Do NOT build Phase 4 productivity features until Phases 1-3 are solid.

## Branding
Official logo = the uploaded shield + human/digital handshake (master at /app/frontend/public/brand/shield-emblem.png).
Do not redesign/replace it. Theme: navy #0B1121, electric-blue #2563EB, purple #8B5CF6 accents, glass cards, Manrope/Outfit. Tagline: "Your Digital Bodyguard. Your Trusted Mate." Applied to splash, app icon, website header/hero, setup, dashboard header, empty states.

## TRAP MODE V2 — MIRROR DECOY (NATIVE — top of Android Studio roadmap)
When Trap Mode activates, the decoy should MIRROR the owner's actual phone appearance:
copy wallpaper, home-screen layout, app icon positions, folders, lock screen, notification style,
light/dark theme — but replace all real data (contacts/messages/photos/notes/call log/calendar/files)
with decoy data. Intruder believes it is the real phone. Log all actions to Evidence (timestamp,
location, device info, screen interactions, front-camera capture when permitted).
Decoy modes: Quick (generic — DONE), Mirror (copies phone appearance — NATIVE, becomes recommended
default), Custom (owner-built — DONE). Mirror requires native launcher/WallpaperManager/PackageManager
access (cannot be done in web/Capacitor) → implement in the Kotlin native phase.
