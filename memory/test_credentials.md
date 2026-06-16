# Digital Mate — Test Credentials

## IMPORTANT: No default codes. Codes are owner-defined during Setup.
Each owner sets their OWN codes during first-run Setup. There are NO hardcoded codes.
- **Access code** — opens the Admin Dashboard from the cover app (Calculator/Clock/Notes)
- **Recovery code** — starts Lost-Phone / Recovery mode (lock, GPS, evidence)
- **Wipe code** — last-resort remote wipe only (optional, set later in Settings)
All codes must be different. Codes are bcrypt-hashed.

## App Flow (After Setup)
1. Setup Complete → "Return to Phone" → App runs in background
2. Open Calculator cover → Enter Access Code + "=" → Opens Admin Dashboard
3. Wrong code 5x → Shows Decoy (Fake Phone)
4. Decoy escape: Tap status bar time 5x OR long-press battery 3s → Verification modal

## Pre-configured test device
`device_id = dm-cover-test` (cover = calculator)
- Access code: `2580`
- Recovery code: `rec999`
- Wipe code: `wipe888`
- Recovery phrase: `bring it back`
- Panic pattern: `159`
- Trusted number: `+15550009`

Frontend: set localStorage `dm_device_id='dm-cover-test'` **before** navigation (addInitScript),
then Launch App → Calculator cover → type `2580` then `=` → Admin Dashboard.

## Configure a fresh device (curl)
```
POST /api/security/setup
{ "device_id":"<id>", "owner_name":"Sam", "access_code":"2580",
  "recovery_code":"rec999", "wipe_code":"wipe888",
  "recovery_phrase":"bring it back", "panic_pattern":"159",
  "trusted_numbers":["+15550009"], "cover_app":"calculator" }
```

## Code routing (which code each action needs)
- Open dashboard: **Access** (`/verify-access`)
- recovery/unlock, trap/deactivate, emergency/verify, profiles/add: **Recovery**
- recovery/wipe (+ confirm:true): **Wipe**
- recovery/trigger {secret}: recovery **phrase** | **panic pattern** | **recovery code**

## LocalStorage (saved during setup)
- `dm_access_hash`: Base64 encoded access code
- `dm_recovery_hash`: Base64 encoded recovery code
- `dm_cover_app`: Selected cover app type
- `dm_configured`: 'true' when setup complete
- `dm_device_id`: Unique device identifier

## Multiple owner profiles (Trusted Family)
`POST /profiles/add { device_id, name, access_code, role, recovery_code }` (recovery code required).
Roles: `owner | trusted | limited | guest`. owner/trusted = full UI; limited/guest = Home + AI Mate only.
Access code must be unique and must NOT equal the recovery/wipe code (400/409 otherwise).
`GET /profiles?device_id`, `POST /profiles/remove { device_id, profile_id, recovery_code }` (can't remove owner).
- dm-cover-test currently also has **Lia** (limited, access `7777`) for role-gating tests.

## Email alerts (Resend) — dormant until configured
Add to `/app/backend/.env`: `RESEND_API_KEY=re_...` (and optionally `SENDER_EMAIL`).
In Resend test mode, emails only deliver to your verified address — set the recovery/backup email to it.
Sends on Level-3 theft / SIM change / panic / recovery trigger to recovery_email + backup_email.

## Notes
- No user login (single-device model). Cover apps: calculator | clock | notes.
- device_id in localStorage `dm_device_id`.
