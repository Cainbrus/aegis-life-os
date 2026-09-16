import unittest,asyncio
from test_cloud_staging import Database
from test_cloud_ai_http import AtomicCollection
from staging_ai_acceptance import prepare
class FixtureTests(unittest.TestCase):
    def test_rejects_non_synthetic_and_missing_records(self):
        db=Database(); db.collections['ai_controls']=AtomicCollection()
        for prefix in ('owner-device','qa3-ai-e2e-'+'a'*32):
            with self.assertRaises(ValueError): asyncio.run(prepare(db,prefix))
        self.assertEqual([],db.ai_controls.rows)
    def test_prepares_only_named_synthetic_records_without_reset(self):
        db=Database(); db.collections['ai_controls']=AtomicCollection()
        prefix='qa3-ai-e2e-'+'a'*32
        for suffix in ('normal','budget'):
            db.device_config.rows.append({'device_id':prefix+'-'+suffix,'configured':True,'profiles':[{'id':suffix,'role':'owner','name':'Digital M8 synthetic AI acceptance'}]})
        self.assertEqual(2,asyncio.run(prepare(db,prefix)))
        self.assertTrue(all(s['enrolled'] and not s['consent'] for s in db.ai_controls.rows))
        self.assertEqual([0,10],[s['calls'] for s in db.ai_controls.rows])
        self.assertEqual(2,asyncio.run(prepare(db,prefix)))
        self.assertEqual([0,10],[s['calls'] for s in db.ai_controls.rows])
