# Digital Mate — Test Credentials

## IMPORTANT: No default codes. Three separate owner-defined codes.
Each owner sets their OWN codes during first-run Setup. There are NO hardcoded codes.
- **Access code** — opens the dashboard from the cover app
- **Recovery code** — starts Lost-Phone / Recovery mode (lock, GPS, evidence)
- **Wipe code** — last-resort remote wipe only
All three must be different. Codes (and recovery phrase / panic pattern) are bcrypt-hashed.

## Pre-configured test device
`device_id = dm-cover-test` (cover = calculator)
- Access code: `2580`
- Recovery code: `rec999`
- Wipe code: `wipe888`
- Recovery phrase: `bring it back`
- Panic pattern: `159`
- Trusted number: `+15550009`

Frontend: set localStorage `dm_device_id='dm-cover-test'` **before** navigation (addInitScript),
then Launch App → Calculator cover → type `2580` then `=` → dashboard.

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

## Multiple owner profiles
`POST /profiles/add { device_id, name, access_code, recovery_code }` (recovery code required).
Each profile's access code opens the dashboard.

## Notes
- No user login (single-device model). Cover apps: calculator | clock | notes.
- device_id in localStorage `dm_device_id`.
