# Digital M8 cloud staging security backend

Staging only. No AI, payment, email dispatch or physical device management routes.
The app requires a separate authenticated Atlas database; do not use production credentials.

Render Root Directory: `backend`. Python version is pinned in `.python-version`.

Build:
```sh
pip install -r requirements-staging.txt
```

Start:
```sh
uvicorn staging_cloud_app:create_app --factory --host 0.0.0.0 --port $PORT --no-access-log
```

Health check: `/health` (503 when the database cannot be reached).

Required provider environment settings:
- `MONGO_URL`: authenticated Atlas SRV URI, entered privately in provider settings.
- `DB_NAME`: `digital_m8_rc_staging`.
- `M8_ENVIRONMENT`: `staging`.
- `PORT`: provided by Render.

No `.env` loading. No TLS bypass. Atlas access must allowlist Render outbound ranges;
do not allow global database access. CORS permits the bundled Android origin
`https://localhost`. Logs must not include request bodies, tokens or connection strings.

Run tests from this directory, using a local virtual environment:
```sh
pip install -r requirements-test.txt
python -m unittest discover -s tests -p test_cloud_staging.py -v
```
Tests inject an in-memory database and synthetic credentials; no Atlas credentials
or network access are required. Real Atlas/HTTPS/device acceptance remains separate.

Only the explicit router in `cloud_security.py` is exposed. Recovery trigger saves
server state; it does not demonstrate physical lock, wipe, live tracking or email delivery.
This publication is not a deployment or release approval.
