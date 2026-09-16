"""Operator-only synthetic acceptance fixtures. No HTTP route and no provider calls."""
import asyncio,copy,hashlib,json,logging,os,re,sys
from cloud_ai import MongoAiLedger,CloudAiBroker

async def prepare(db,prefix):
    if not re.fullmatch(r'qa3-ai-e2e-[0-9a-f]{32}',prefix): raise ValueError('Synthetic prefix required')
    identities=[]
    for suffix in ('normal','budget'):
        device=prefix+'-'+suffix
        cfg=await db.device_config.find_one({'device_id':device})
        owners=[p for p in (cfg or {}).get('profiles',[]) if p.get('role')=='owner' and p.get('name')=='Digital M8 synthetic AI acceptance']
        if not cfg or not cfg.get('configured') or len(owners)!=1: raise ValueError('Synthetic fixtures not ready')
        identities.append(hashlib.sha256((owners[0]['id']+'\0'+device).encode()).hexdigest())
    ledger=MongoAiLedger(db)
    for index,identity in enumerate(identities):
        await ledger.set_enrollment(identity,True)
        if index==1:
            for _ in range(32):
                before=CloudAiBroker.checked(await ledger.read(identity));after=copy.deepcopy(before)
                after['calls']=max(before['calls'],before['limit']);CloudAiBroker.event(after,'acceptance_budget_exhausted')
                if await ledger.cas(identity,before,after):break
            else:raise RuntimeError('Fixture update unavailable')
    return len(identities)

async def main():
    from staging_cloud_app import validate_environment
    from motor.motor_asyncio import AsyncIOMotorClient
    for name in ('pymongo','motor'):
        logger=logging.getLogger(name);logger.handlers=[logging.NullHandler()];logger.propagate=False
    uri=validate_environment(os.environ)
    client=AsyncIOMotorClient(uri,tls=True,serverSelectionTimeoutMS=5000,connectTimeoutMS=5000)
    try: return await asyncio.wait_for(prepare(client['digital_m8_rc_staging'],sys.argv[1]),30)
    finally:client.close()
if __name__=='__main__':
    try: print(json.dumps({'prepared':asyncio.run(main())}))
    except Exception: print('{"prepared":false,"category":"fixture preparation unavailable"}');sys.exit(1)
