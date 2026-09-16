import asyncio
import copy
import unittest
from datetime import datetime, timezone
from fastapi import HTTPException
from cloud_ai import CloudAiBroker, MongoAiLedger

class MemoryLedger:
    def __init__(self): self.state=None; self.lock=asyncio.Lock(); self.conflicts=0
    async def read(self, identity):
        async with self.lock:
            if self.state is None:
                self.state=MongoAiLedger.initial(identity)
                self.state['enrolled']=True # Explicit trusted test fixture, not a public API
            return copy.deepcopy(self.state)
    async def cas(self, identity, before, after):
        await asyncio.sleep(0)
        async with self.lock:
            if self.state != before:
                self.conflicts+=1; return False
            self.state=copy.deepcopy(after); return True

class Tests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.valid=True; self.role='owner'; self.calls=[]; self.ledger=MemoryLedger()
        async def auth(device,token,roles):
            if not self.valid or token!='synthetic-session': raise HTTPException(401)
            if self.role not in roles: raise HTTPException(403)
            return {'device_id':device,'profile_id':'synthetic-owner','created_at':datetime.now(timezone.utc).isoformat()}
        self.auth=auth
        async def provider(context,tier):
            self.calls.append((context,tier)); return 'Use list layout.'
        self.provider=provider
        self.broker=CloudAiBroker(self.ledger,self.auth,provider)
        self.context={'layout':'grid','large_text':False}
    async def consent(self,on=True): return await self.broker.configure('device','synthetic-session',on,10)
    async def request(self): return await self.broker.suggest('device','synthetic-session',self.context)
    async def test_off_invalid_and_nonowner_never_dispatch(self):
        self.assertEqual('consent_off',(await self.request())['reason'])
        await self.consent(); self.valid=False
        with self.assertRaises(HTTPException): await self.request()
        self.valid=True; self.role='guest'
        with self.assertRaises(HTTPException): await self.request()
        self.assertEqual([],self.calls)
    async def test_on_minimizes_and_persists_budget(self):
        await self.consent(); self.assertEqual('cloud',(await self.request())['mode'])
        self.assertEqual([(self.context,'primary')],self.calls)
        self.broker=CloudAiBroker(self.ledger,self.auth,self.provider)
        await self.consent(False); await self.consent()
        self.assertEqual(1,self.ledger.state['calls'])
    async def test_guardian_denies_secret_or_unknown_fields(self):
        await self.consent()
        for field in ['pin','recovery_code','wipe_code','token','messages','files','guardian_secret']:
            self.context={'layout':'grid','large_text':False,field:'SYNTHETIC_PRIVATE'}
            self.assertEqual('guardian_denied',(await self.request())['reason'])
        self.assertEqual([],self.calls)
        self.assertNotIn('SYNTHETIC_PRIVATE',str(self.ledger.state))
    async def test_concurrent_budget_cannot_overspend(self):
        await self.consent()
        results=await asyncio.gather(*(self.request() for _ in range(20)))
        self.assertGreater(self.ledger.conflicts,0)
        self.assertEqual(10,len(self.calls)); self.assertEqual(10,self.ledger.state['calls'])
        self.assertIn('budget_exhausted',[x.get('reason') for x in results])
    async def test_retry_reserves_again_and_errors_are_redacted(self):
        async def failed(context,tier): self.calls.append(tier); raise RuntimeError('SYNTHETIC_SECRET')
        self.broker=CloudAiBroker(self.ledger,self.auth,failed)
        await self.consent(); result=await self.request()
        self.assertEqual(['primary','economy'],self.calls)
        self.assertEqual(2,self.ledger.state['calls'])
        self.assertEqual('provider_unavailable',result['reason'])
        self.assertNotIn('SYNTHETIC_SECRET',str(result)+str(self.ledger.state))
    async def test_revocation_during_attempt_suppresses_output_and_retry(self):
        async def revoked(context,tier):
            self.calls.append(tier); await self.consent(False); return 'PRIVATE RESPONSE'
        self.broker=CloudAiBroker(self.ledger,self.auth,revoked)
        await self.consent(); result=await self.request()
        self.assertEqual('consent_off',result['reason']); self.assertEqual(['primary'],self.calls)
        self.assertNotIn('PRIVATE RESPONSE',str(result)+str(self.ledger.state))
    async def test_unavailable_does_not_spend(self):
        self.broker=CloudAiBroker(self.ledger,self.auth,None)
        await self.consent(); self.assertEqual('provider_unavailable',(await self.request())['reason'])
        self.assertEqual(0,self.ledger.state['calls'])
    async def test_audit_contains_only_fixed_metadata(self):
        await self.consent(); await self.request()
        for event in self.ledger.state['audit']:
            self.assertLessEqual(set(event),{'event','at','tier','attempt'})
        self.assertNotIn('synthetic-session',str(self.ledger.state))
        self.assertNotIn('Use list',str(self.ledger.state))
    async def test_expiry_during_attempt_rejects_response(self):
        async def expired(context,tier): self.valid=False; return 'hidden'
        self.broker=CloudAiBroker(self.ledger,self.auth,expired)
        await self.consent()
        with self.assertRaises(HTTPException): await self.request()
        self.assertEqual(1,self.ledger.state['calls'])

    async def test_off_then_on_cannot_restore_an_inflight_approval(self):
        async def revoked(context,tier):
            self.calls.append(tier)
            await self.consent(False); await self.consent(True)
            return 'stale result'
        self.broker=CloudAiBroker(self.ledger,self.auth,revoked)
        await self.consent(); result=await self.request()
        self.assertEqual('consent_changed',result['reason'])
        self.assertEqual(['primary'],self.calls)

    async def test_revocation_during_completion_audit_suppresses_output(self):
        original=self.broker.audit
        async def audit(identity,event,**fields):
            await original(identity,event,**fields)
            if event=='completed': await self.consent(False)
        self.broker.audit=audit
        await self.consent(); self.assertEqual('consent_off',(await self.request())['reason'])
    async def test_expiry_during_completion_audit_suppresses_output(self):
        original=self.broker.audit
        async def audit(identity,event,**fields):
            await original(identity,event,**fields)
            if event=='completed': self.valid=False
        self.broker.audit=audit
        await self.consent()
        with self.assertRaises(HTTPException): await self.request()
    async def test_failed_attempt_off_on_does_not_retry(self):
        async def failed(context,tier):
            self.calls.append(tier); await self.consent(False); await self.consent(True)
            raise RuntimeError('synthetic')
        self.broker=CloudAiBroker(self.ledger,self.auth,failed)
        await self.consent(); self.assertEqual('consent_changed',(await self.request())['reason'])
        self.assertEqual(['primary'],self.calls)
    async def test_last_budget_slot_cannot_retry(self):
        await self.consent()
        for _ in range(9): await self.request()
        async def failed(context,tier): self.calls.append(tier); raise RuntimeError('synthetic')
        self.broker=CloudAiBroker(self.ledger,self.auth,failed)
        self.assertEqual('budget_exhausted',(await self.request())['reason'])
        self.assertEqual(10,len(self.calls))
    async def test_failed_reservation_never_dispatches(self):
        await self.consent()
        async def fail(*args): raise RuntimeError('synthetic storage failure')
        self.ledger.cas=fail
        with self.assertRaises(RuntimeError): await self.request()
        self.assertEqual([],self.calls)

    async def test_consent_and_budget_denials_are_auditable(self):
        await self.request()
        self.assertIn('consent_off',[x['event'] for x in self.ledger.state['audit']])
        await self.consent()
        for _ in range(11): await self.request()
        self.assertIn('budget_exhausted',[x['event'] for x in self.ledger.state['audit']])

    async def test_self_registered_owner_is_not_implicitly_enrolled(self):
        await self.ledger.read('unused')
        self.ledger.state['enrolled']=False
        with self.assertRaises(HTTPException) as caught: await self.consent()
        self.assertEqual(403,caught.exception.status_code)
        self.assertEqual('not_enrolled',(await self.request())['reason'])
        self.assertEqual([],self.calls)

    async def test_changed_provider_policy_requires_fresh_consent(self):
        await self.consent(); self.ledger.state['consent_policy']='different-model-policy'
        self.assertEqual('consent_changed',(await self.request())['reason'])
        self.assertEqual([],self.calls)
    async def test_operator_revokes_during_dispatch(self):
        async def provider(context,tier):
            self.calls.append(tier)
            identity=await self.broker.identity('device','synthetic-session')
            await MongoAiLedger.set_enrollment(self.ledger,identity,False)
            return 'stale response'
        self.broker=CloudAiBroker(self.ledger,self.auth,provider)
        await self.consent(); self.assertEqual('not_enrolled',(await self.request())['reason'])
        self.assertEqual(['primary'],self.calls)
    async def test_operator_reenrollment_does_not_revive_retry(self):
        async def provider(context,tier):
            self.calls.append(tier)
            identity=await self.broker.identity('device','synthetic-session')
            await MongoAiLedger.set_enrollment(self.ledger,identity,False)
            await MongoAiLedger.set_enrollment(self.ledger,identity,True)
            await self.consent()
            raise RuntimeError('synthetic')
        self.broker=CloudAiBroker(self.ledger,self.auth,provider)
        await self.consent(); self.assertEqual('consent_changed',(await self.request())['reason'])
        self.assertEqual(['primary'],self.calls)
