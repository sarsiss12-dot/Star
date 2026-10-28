from pathlib import Path
import json,subprocess,concurrent.futures
from metrics import stats
P=Path(__file__).resolve().parents[1];prior=P.parent/'phase96h61/evidence'
assert json.loads((P/'evidence/gate1.json').read_text())['fail']==0
jobs=[(11,218,240,'control'),(11,218,240,'I1'),(11,217,240,'control'),(11,217,240,'I1')]
def run(job):
 seed,start,end,label=job;save=P/'evidence/seed11-checkpoint217.save' if start==217 else prior/f'control/M240-{seed}/control-M240-{seed}-{seed}-checkpoint-{start}.save';out=P/f'evidence/local-{seed}-{start}/{label}';out.mkdir(parents=True,exist_ok=True);tag=f'L62-{seed}-{start}-{label}'
 with (out/'run.log').open('w') as f:r=subprocess.run(['node',str(P/'scripts/campaign.js'),str(P/label),tag,str(seed),str(end),str(out),'orta','default',str(save),'219,223,227,231,240'],stdout=f,stderr=subprocess.STDOUT)
 assert r.returncode==0,str(out);d=json.loads((out/f'{tag}-{seed}.json').read_text());s=stats(d);target=[]
 for i,rs in enumerate(d['monthly'],start+1):
  for e in rs:
   if e['id']==7:target.append({'month':i,'dead':e['dead'],'resources':e['resources'],'income':e['income'],'buildings':e['buildings']})
 def window(k):
  months=[x['month'] for x in target if not x['dead'] and x['income'][k]<0 and (x['resources'][k]<-x['income'][k]*3)];maxRun=run=0;prev=None
  for m in months:run=run+1 if prev==m-1 else 1;prev=m;maxRun=max(maxRun,run)
  return {'criticalMonths':months,'maxRun':maxRun,'stockZeroMonths':[x['month'] for x in target if x['resources'][k]<=0 and x['income'][k]<0],'minStock':min(x['resources'][k] for x in target),'lastStock':target[-1]['resources'][k],'lastNet':target[-1]['income'][k]}
 row={'seed':seed,'start':start,'label':label,'inputSHA256':d['resumeInputHash'],'initialSaveHash':d['initialSaveHash'],'initialRng':d['initialRng'],'stats':s,'resources':{k:window(k) for k in ['min','yiy','tuk','ene','ala']},'targetAlive':not target[-1]['dead'],'actor7Actions':[x for x in d['auditTrace'] if x.get('actor')==7 and x['kind'] in ['queueBuilding','queueDemolish','job-finished']],'targetMonthly':target}
 (out/'metrics.json').write_text(json.dumps(row,indent=2));print(json.dumps({k:v for k,v in row.items() if k not in ['actor7Actions','targetMonthly']}),flush=True);return row
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:rows=list(ex.map(run,jobs))
reasons=[]
for start in [218,217]:
 a=next(x for x in rows if x['start']==start and x['label']=='control');b=next(x for x in rows if x['start']==start and x['label']=='I1')
 assert a['inputSHA256']==b['inputSHA256'] and a['initialSaveHash']==b['initialSaveHash'] and a['initialRng']==b['initialRng']
 if not b['targetAlive']:reasons.append(f'{start}: same actor7 did not survive')
 if b['stats']['criticalByActor'].get('7',b['stats']['criticalByActor'].get(7,0))>a['stats']['criticalByActor'].get('7',a['stats']['criticalByActor'].get(7,0)):reasons.append(f'{start}: actor7 critical duration worsened')
 for k in ['min','yiy']:
  if len(b['resources'][k]['stockZeroMonths'])>len(a['resources'][k]['stockZeroMonths']) or b['resources'][k]['maxRun']>a['resources'][k]['maxRun']:reasons.append(f'{start}: {k} bottleneck worsened')
 ca=[x for x in a['stats']['cycles'] if x['actor']==7];cb=[x for x in b['stats']['cycles'] if x['actor']==7]
 if len(cb)>len(ca):reasons.append(f'{start}: actor7 demolition/rebuild cycles increased')
result={'gate':2,'status':'FAIL' if reasons else 'PASS','reasons':reasons,'sameSaveAndRng':True,'rows':rows};(P/'evidence/gate2.json').write_text(json.dumps(result,indent=2));print(json.dumps({'gate2':result['status'],'reasons':reasons}))
