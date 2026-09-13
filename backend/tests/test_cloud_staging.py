"""HTTP boundary tests with an injected in-memory database; no real secrets/network."""
import copy
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from fastapi.testclient import TestClient
from staging_cloud_app import create_app, validate_environment

ENV = {'M8_ENVIRONMENT': 'staging', 'DB_NAME': 'digital_m8_rc_staging',
       'MONGO_URL': 'mongodb+srv://synthetic:synthetic@example.mongodb.net/?retryWrites=true&w=majority'}


def matches(row, query):
    for key, value in query.items():
        actual = row.get(key)
        if isinstance(value, dict):
            for op, val in value.items():
                if op == '$lt' and not actual < val: return False
                if op == '$lte' and not actual <= val: return False
                if op == '$in' and actual not in val: return False
        elif actual != value: return False
    return True


class Cursor:
    def __init__(self, rows): self.rows = copy.deepcopy(rows)
    def sort(self, *args): return self
    def limit(self, count): self.rows = self.rows[:count]; return self
    async def to_list(self, length): return self.rows[:length]


class Collection:
    def __init__(self): self.rows = []
    async def create_index(self, *args, **kwargs): pass
    async def find_one(self, query, projection=None):
        return copy.deepcopy(next((r for r in self.rows if matches(r, query)), None))
    def find(self, query, projection=None): return Cursor([r for r in self.rows if matches(r, query)])
    async def insert_one(self, row): self.rows.append(copy.deepcopy(row))
    async def delete_many(self, query): self.rows[:] = [r for r in self.rows if not matches(r, query)]
    async def update_one(self, query, update, upsert=False):
        row = next((r for r in self.rows if matches(r, query)), None)
        if row is None and upsert: row = copy.deepcopy(query); self.rows.append(row)
        if row is None: return
        row.update(copy.deepcopy(update.get('$set', {})))
        for key, value in update.get('$push', {}).items():
            row.setdefault(key, [])
            if isinstance(value, dict) and '$each' in value:
                row[key].extend(copy.deepcopy(value['$each']))
                if '$slice' in value: row[key] = row[key][value['$slice']:]
            else: row[key].append(copy.deepcopy(value))
        for key, value in update.get('$pull', {}).items():
            row[key] = [x for x in row.get(key, []) if not matches(x, value)]


class Database:
    def __init__(self): self.collections = {}; self.failed = False
    def __getattr__(self, name): return self.collections.setdefault(name, Collection())
    async def command(self, command):
        if self.failed: raise RuntimeError('SYNTHETIC_SECRET_MUST_NOT_ESCAPE')
        return {'ok': 1}


class CloudTests(unittest.TestCase):
    def setUp(self):
        self.db = Database()
        self.client = self.enterContext(TestClient(create_app(ENV, self.db), raise_server_exceptions=False))

    def post(self, path, token=None, device='synthetic-device', **fields):
        return self.client.post('/api/security/'+path, json={'device_id': device, **fields},
                                headers={'X-DM-Token': token} if token else {})

    def owner(self):
        response = self.post('setup', access_code='13579135', recovery_code='24682468', owner_name='Synthetic')
        self.assertEqual(200, response.status_code)
        return self.post('verify-access', code='13579135').json()['token']

    def test_config_fails_closed_without_disclosing_values(self):
        invalid = [{}, {**ENV, 'DB_NAME': 'production'}, {**ENV, 'M8_ENVIRONMENT': 'production'}]
        invalid += [{**ENV, 'MONGO_URL': value} for value in ['', 'mongodb://localhost',
            ENV['MONGO_URL']+'&tls=false', ENV['MONGO_URL']+'&tlsAllowInvalidCertificates=true',
            ENV['MONGO_URL'].replace('example.mongodb.net', 'evil.example'),
            ENV['MONGO_URL'].replace('synthetic:synthetic@', '')]]
        for env in invalid:
            with self.subTest(env_type=list(env)):
                with self.assertRaises(RuntimeError) as error: validate_environment(env)
                self.assertNotIn('synthetic:', str(error.exception))

    def test_health_database_failure_is_redacted(self):
        self.assertEqual(200, self.client.get('/health').status_code)
        self.db.failed = True
        response = self.client.get('/health')
        self.assertEqual(503, response.status_code)
        self.assertNotIn('SYNTHETIC_SECRET', response.text)
        self.assertEqual('no-store', response.headers['cache-control'])

    def test_only_allowlisted_routes_exist(self):
        expected = {('GET', '/health')}
        expected |= {('POST', '/api/security/'+p) for p in ['setup','profiles/add','profiles/remove',
            'verify-access','verify-recovery','session/native','session/revoke','session/revoke-device',
            'session/revocation-ticket','session/revoke-ticket','recovery/locate','recovery/trigger','events']}
        expected |= {('GET', '/api/security/'+p) for p in ['setup/status','profiles','recovery/location','events','alerts']}
        actual = {(m, r.path) for r in self.client.app.routes for m in r.methods}
        self.assertEqual(expected, actual)
        for path in ['ai-insights','recovery/wipe','recovery/lock','recovery/unlock','recovery/call-trigger','panic','family/create','vault/add']:
            self.assertEqual(404, self.post(path).status_code)
        for path in ['/docs','/openapi.json','/api/billing','/api/chat','/api/email']:
            self.assertEqual(404, self.client.get(path).status_code)

    def test_owner_wrong_code_setup_overwrite_and_recovery(self):
        token = self.owner()
        self.assertFalse(self.post('verify-access', code='wrong').json()['verified'])
        self.assertEqual(401, self.post('setup', access_code='11111111', recovery_code='22222222').status_code)
        recovery = self.post('verify-recovery', code='24682468').json()
        self.assertTrue(recovery['verified']); self.assertNotIn('token', recovery)
        self.assertEqual(200, self.client.get('/api/security/profiles', params={'device_id':'synthetic-device'}, headers={'X-DM-Token':token}).status_code)

    def test_missing_wrong_device_expired_and_revoked_sessions(self):
        token = self.owner()
        self.assertEqual(401, self.post('session/native').status_code)
        self.assertEqual(401, self.post('session/native', 'invalid').status_code)
        self.assertEqual(401, self.post('session/native', token, device='other').status_code)
        self.db.sessions.rows[0]['expires_at'] = (datetime.now(timezone.utc)-timedelta(seconds=1)).isoformat()
        self.assertEqual(401, self.post('session/native', token).status_code)
        token = self.post('verify-access', code='13579135').json()['token']
        self.assertEqual(200, self.post('session/revoke', token).status_code)
        self.assertEqual(401, self.post('session/native', token).status_code)

    def test_native_scope_parent_revocation_and_ticket_replay(self):
        owner = self.owner()
        native = self.post('session/native', owner).json()['token']
        self.assertEqual(200, self.post('recovery/locate', native, lat=0, lng=0).status_code)
        self.assertEqual(401, self.post('session/revocation-ticket', native).status_code)
        ticket = self.post('session/revocation-ticket', owner).json()['token']
        request = lambda device: self.client.post('/api/security/session/revoke-ticket', json={'device_id':device}, headers={'X-DM-Revocation':ticket})
        self.assertEqual(401, request('other').status_code)
        self.assertEqual(200, request('synthetic-device').status_code)
        self.assertEqual(401, self.post('recovery/locate', native, lat=0,lng=0).status_code)
        fresh = self.post('verify-access', code='13579135').json()['token']
        self.assertEqual(200, request('synthetic-device').status_code)
        self.assertEqual(200, self.post('session/native', fresh).status_code)

    def test_recovery_trigger_records_state_without_external_dispatch(self):
        self.owner()
        self.assertFalse(self.post('recovery/trigger', secret='wrong').json()['triggered'])
        result = self.post('recovery/trigger', secret='24682468')
        self.assertEqual(200, result.status_code)
        self.assertTrue(result.json()['triggered']); self.assertNotIn('token', result.json())
        self.assertTrue(self.db.device_state.rows[0]['lost_mode'])

    def test_limited_profile_cannot_escalate_and_native_expiry(self):
        owner = self.owner()
        response = self.post('profiles/add', owner, name='Limited synthetic', role='limited',
                             access_code='33333333', recovery_code='24682468')
        self.assertEqual(200, response.status_code)
        limited = self.post('verify-access', code='33333333').json()['token']
        self.assertEqual(403, self.post('session/native', limited).status_code)
        self.assertEqual(403, self.post('profiles/add', limited, name='Escalate', role='owner',
                                     access_code='44444444', recovery_code='24682468').status_code)
        native = self.post('session/native', owner).json()['token']
        self.db.native_sessions.rows[0]['expires_at'] = (datetime.now(timezone.utc)-timedelta(seconds=1)).isoformat()
        self.assertEqual(401, self.post('recovery/locate', native, lat=0, lng=0).status_code)

    def test_atlas_client_has_verified_tls_and_fixed_database(self):
        from unittest.mock import MagicMock
        fake = MagicMock()
        fake.__getitem__.return_value = self.db
        with patch('staging_cloud_app.AsyncIOMotorClient', return_value=fake) as constructor:
            with TestClient(create_app(ENV)) as client:
                self.assertEqual(200, client.get('/health').status_code)
            self.assertTrue(constructor.call_args.kwargs['tls'])
            fake.__getitem__.assert_called_once_with('digital_m8_rc_staging')
            fake.close.assert_called_once()

    def test_no_external_integration_imports(self):
        import ast
        from pathlib import Path
        root = Path(__file__).parents[1]
        imports = set()
        for filename in ('staging_cloud_app.py', 'cloud_security.py'):
            for node in ast.walk(ast.parse((root/filename).read_text(encoding='utf-8'))):
                if isinstance(node, ast.Import): imports.update(a.name.split('.')[0] for a in node.names)
                if isinstance(node, ast.ImportFrom): imports.add(node.module.split('.')[0])
        self.assertFalse(imports & {'server', 'routes', 'emergentintegrations', 'stripe', 'resend', 'dotenv'})

    def test_validation_and_unexpected_exceptions_do_not_echo_secrets(self):
        marker = 'SYNTHETIC_SECRET_MUST_NOT_ESCAPE'
        response = self.client.post('/api/security/verify-access', json={'device_id':marker,'code':{'secret':marker}})
        self.assertEqual(422, response.status_code); self.assertNotIn(marker, response.text)
        async def failed(*args, **kwargs): raise RuntimeError(marker)
        with patch.object(self.db.device_config, 'find_one', failed):
            with self.assertNoLogs('uvicorn.error'):
                response = self.post('verify-access', code=marker)
        self.assertEqual(503, response.status_code); self.assertNotIn(marker, response.text)

    def test_database_isolation_and_cors(self):
        self.owner()
        other = self.enterContext(TestClient(create_app(ENV, Database())))
        self.assertFalse(other.get('/api/security/setup/status', params={'device_id':'synthetic-device'}).json()['configured'])
        good = self.client.options('/api/security/session/native',headers={'Origin':'https://localhost','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'X-DM-Token'})
        self.assertEqual(200, good.status_code)
        bad = self.client.options('/health',headers={'Origin':'https://evil.example','Access-Control-Request-Method':'GET'})
        self.assertEqual(400, bad.status_code)


if __name__ == '__main__': unittest.main()
