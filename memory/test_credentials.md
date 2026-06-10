# Digital Mate — Test Credentials

## IMPORTANT: No default codes exist
Every owner defines their OWN codes during first-run **Setup**. There is NO hardcoded
`15987` or `8675309` anymore. Destructive actions fail with 403 until a device is configured.

## How to set up a device for testing
device_id is client-generated and stored in localStorage key `dm_device_id`.

Backend setup (curl):
```
POST /api/security/setup
{ "device_id": "<id>", "recovery_code": "test7421", "vault_code": "3344", "trusted_numbers": ["+15551234567"] }
```
Then for tests use:
- **Recovery code**: `test7421` (authorizes unlock / wipe / trap-deactivate / emergency)
- **Vault code**: `3344` (dial in Phone Dialer to open Invisible Vault)
- **Trusted number**: `+15551234567`

Frontend: on first launch the app shows the **Setup Wizard** (data-testid `setup-wizard`).
Complete it (recovery code + confirm, vault digits + confirm, ≥1 trusted number) to reach the dashboard.
To force setup again, clear localStorage `dm_device_id` (or the device's `device_config`).

## Security Engine API (prefix /api/security)
- Setup: `GET /setup/status`, `POST /setup`, `POST /verify-recovery`, `POST /verify-vault`
- Recognition: `POST /telemetry`, `POST /score`, `GET /status`, `POST /baseline/reset`
- Evidence: `GET/POST/DELETE /events`, `POST /evidence/photo`, `GET /alerts`
- Trap: `GET /trap/status`, `POST /trap/activate|deactivate|log-action`
- Recovery: `POST /recovery/lock|unlock|wipe|locate`, `GET /recovery/location`, `POST /panic`
- Device change: `POST /device-change` (kind sim|network)
- Privacy scan: `POST /privacy-scan`
- Emergency: `POST /emergency/verify`
- unlock/wipe/trap-deactivate/emergency require the device's own recovery_code; wipe also needs confirm:true

## Notes
- No user login/registration (single-owner device model). Recovery & vault codes hashed with bcrypt.
