import copy
import asyncio
import hashlib
from cloud_ai import MongoAiLedger
import unittest
from types import SimpleNamespace
from fastapi.testclient import TestClient
from staging_cloud_app import create_app
from test_cloud_staging import Database, Collection, ENV, matches

class AtomicCollection(Collection):
    def with_options(self,**options):
        assert options['write_concern'].document['w']=='majority'
        return self
    async def update_one(self,query,update,upsert=False):
        row=next((r for r in self.rows if matches(r,query)),None)
        if row is None and upsert:
            self.rows.append(copy.deepcopy(update['$setOnInsert']))
    async def replace_one(self,query,replacement):
        for i,row in enumerate(self.rows):
            if matches(row,query):
                self.rows[i]=copy.deepcopy(replacement)
                return SimpleNamespace(matched_count=1)
        return SimpleNamespace(matched_count=0)

class HttpTests(unittest.TestCase):
    def setUp(self):
        self.db=Database(); self.db.collections['ai_controls']=AtomicCollection()
        self.client=self.enterContext(TestClient(create_app(ENV,self.db),raise_server_exceptions=False))
        self.device='synthetic-ai-device'
        self.post('setup',access_code='13579135',recovery_code='24682468',owner_name='Synthetic')
        self.token=self.post('verify-access',code='13579135').json()['token']
        session=self.db.sessions.rows[0]
        identity=hashlib.sha256((session['profile_id']+'\0'+session['device_id']).encode()).hexdigest()
        state=MongoAiLedger.initial(identity); state['enrolled']=True
        self.db.ai_controls.rows.append(state) # Operator enrollment fixture only
    def post(self,path,**fields):
        return self.client.post('/api/security/'+path,json={'device_id':self.device,**fields},headers={'X-DM-Token':getattr(self,'token','')})
    def test_consent_persists_and_default_transport_remains_off(self):
        response=self.post('ai/consent',enabled=True,limit=10)
        self.assertEqual(200,response.status_code); self.assertTrue(response.json()['consent'])
        # New app/router reads the same durable database state.
        with TestClient(create_app(ENV,self.db)) as second:
            response=second.post('/api/security/ai/suggest',json={'device_id':self.device,'context':{'layout':'grid','large_text':False}},headers={'X-DM-Token':self.token})
        self.assertEqual(200,response.status_code)
        self.assertEqual('provider_unavailable',response.json()['reason'])
        self.assertEqual(0,self.db.ai_controls.rows[0]['calls'])
    def test_missing_revoked_and_location_tokens_cannot_enable(self):
        owner=self.token; self.token=''
        self.assertEqual(401,self.post('ai/consent',enabled=True,limit=10).status_code)
        self.token=owner
        native=self.post('session/native').json()['token']; self.token=native
        self.assertEqual(401,self.post('ai/consent',enabled=True,limit=10).status_code)
        self.token=owner; self.post('session/revoke')
        self.assertEqual(401,self.post('ai/consent',enabled=True,limit=10).status_code)
    def test_secret_fields_rejected_and_redacted(self):
        self.post('ai/consent',enabled=True,limit=10)
        response=self.post('ai/suggest',context={'layout':'grid','large_text':False,'pin':'SYNTHETIC_SECRET'})
        self.assertEqual('guardian_denied',response.json()['reason'])
        self.assertNotIn('SYNTHETIC_SECRET',str(self.db.ai_controls.rows)+response.text)
        response=self.post('ai/consent',enabled=True,limit=10,secret='SYNTHETIC_SECRET')
        self.assertEqual(422,response.status_code); self.assertNotIn('SYNTHETIC_SECRET',response.text)
    def test_stale_session_cannot_change_consent(self):
        self.db.sessions.rows[0]['created_at']='2020-01-01T00:00:00+00:00'
        self.assertEqual(401,self.post('ai/consent',enabled=True,limit=10).status_code)
    def test_profile_device_isolation(self):
        self.post('ai/consent',enabled=True,limit=10)
        self.device='unrelated-device'
        self.assertEqual(401,self.post('ai/suggest',context={'layout':'grid','large_text':False}).status_code)
    def test_database_failure_fails_closed_without_raw_error(self):
        async def fail(*args,**kwargs): raise RuntimeError('SYNTHETIC_SECRET')
        self.db.ai_controls.update_one=fail
        response=self.post('ai/consent',enabled=True,limit=10)
        self.assertEqual(503,response.status_code); self.assertNotIn('SYNTHETIC_SECRET',response.text)

    def test_oversized_ai_body_rejected_before_context_handling(self):
        response=self.post('ai/suggest',context={'data':'x'*4096})
        self.assertEqual(413,response.status_code)
        self.assertEqual([],self.db.ai_controls.rows[0]['audit'])

    def test_registration_and_client_flags_cannot_enroll_for_paid_access(self):
        self.db.ai_controls.rows.clear()
        response=self.post('ai/consent',enabled=True,limit=10)
        self.assertEqual(403,response.status_code)
        response=self.post('ai/consent',enabled=True,limit=10,enrolled=True)
        self.assertEqual(422,response.status_code)
        response=self.post('ai/suggest',context={'layout':'grid','large_text':False})
        self.assertEqual('not_enrolled',response.json()['reason'])

    def test_operator_enrollment_changes_preserve_budget_and_revoke_consent(self):
        state=self.db.ai_controls.rows[0]
        state.update(calls=3,tokens=1152,cost_micros=30000,consent=True)
        identity=state['_id']; ledger=MongoAiLedger(self.db)
        asyncio.run(ledger.set_enrollment(identity,False))
        asyncio.run(ledger.set_enrollment(identity,True))
        state=self.db.ai_controls.rows[0]
        self.assertTrue(state['enrolled']); self.assertFalse(state['consent'])
        self.assertEqual(3,state['calls']); self.assertEqual(2,state['consent_version'])
