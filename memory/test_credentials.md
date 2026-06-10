# Digital Mate — Test Credentials

## Owner / Recovery
- **Owner recovery code** (unlock device, deactivate Trap Mode, confirm remote wipe): `15987`
  - Backend env var: `OWNER_RECOVERY_CODE` (defaults to `15987` if unset)
- **Invisible Vault secret code** (dial in Phone Dialer): `8675309`
- **Legacy pattern auth** (still in backend): Owner `1-5-9-8-7`, Duress `2-5-8`

## Security Engine API (prefix /api/security)
- Telemetry/training: `POST /telemetry` (label "owner" trains baseline after 8 samples)
- Live scoring: `POST /score` (returns trust_score, is_owner, trap_active)
- Status: `GET /status?device_id=...`
- Evidence: `GET/POST/DELETE /events`
- Trap: `POST /trap/activate|deactivate|log-action`, `GET /trap/status`
- Recovery: `POST /recovery/lock|unlock|wipe|locate`, `GET /recovery/location`
  - unlock & wipe require `owner_code = 15987`; wipe also requires `confirm: true`

## Notes
- device_id is generated client-side and stored in localStorage key `dm_device_id`.
- No user login/registration in the app (single-owner device model).
