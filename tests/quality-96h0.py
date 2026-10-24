import pathlib,json,hashlib,collections
r=pathlib.Path(__file__).resolve().parents[1];o=r/'tests/audit96h0';p=o/'final/campaigns';g2=r/'tests/audit96g2/first-pool';g1=r/'tests/audit96g1/campaigns'
load=lambda p:json.loads(p.read_text());manifest=load(r/'RELEASE-MANIFEST.json')['files'];rows=[];long=[];density=[]
selected=[]
def canonical_g2(name):
 matches=[]
 for candidate in (r/'tests/audit96g2').rglob(name):
  d=load(candidate)
  if d.get('sourceHashes',{}).get('main.js')=='ed25c388ce8d965175cf276ec161e06285d283cf984149ae0922c45ce6a35bf9':matches.append((candidate,d))
 assert matches,'No canonical G2 record: '+name
 assert len({(d['saveHash'],d['rng']) for _,d in matches})==1,'Conflicting canonical G2 records'
 candidate,d=sorted(matches,key=lambda x:str(x[0]))[0];selected.append({'name':name,'path':candidate.relative_to(r).as_posix(),'mainHash':d['sourceHashes']['main.js']});return d
fields=['deliveries','contracts','colonies','techs','ships','power','upkeep','criticalEmpireMonths','alive','warsStarted','peace','pacts','plansCompleted','plansFailed']
def metrics(d):
 last=d['monthly'][-1];alive=[e for e in last if not e['dead']];s={k:sum(e[k] for e in alive) for k in ['colonies','techs','ships','power','upkeep']}
 initial={e['id'] for e in d['initial']['identities']};critical=[];food=[];bad=[]
 for month,es in enumerate(d['monthly'],1):
  for e in es:
   for k,v in e['resources'].items():
    if not isinstance(v,(int,float)) or not v>=-0.00001:bad.append([month,e['id'],k,v])
   ks=[k for k in ['ene','min','tuk','ala'] if not e['dead'] and e['income'][k]<0 and e['resources'][k]<-e['income'][k]*3]
   if ks:critical.append({'month':month,'id':e['id'],'cohort':'initial' if e['id'] in initial else 'new','keys':ks})
   if not e['dead'] and e['income']['yiy']<0 and e['resources']['yiy']<-e['income']['yiy']*3:food.append({'month':month,'id':e['id']})
 wars={tuple(sorted([e['id'],int(x)])) for e in last if not e['dead'] for x in e['wars']}
 s.update(deliveries=sum((e.get('trade') or {}).get('deliveries',0) for e in last),contracts=len(d['contracts']),criticalEmpireMonths=len(critical),alive=len(alive),warsStarted=d['actionCounts'].get('war-start',0),peace=d['actionCounts'].get('peace',0),activeWars=len(wars),pacts=sum(len(e['partners']) for e in last)/2,plansCompleted=sum((e.get('strategy') or {}).get('stats',{}).get('completed',0) for e in last),plansFailed=sum((e.get('strategy') or {}).get('stats',{}).get('failed',0) for e in last))
 return {'metrics':s,'critical':critical,'foodCritical':food,'cohortCritical':dict(collections.Counter(x['cohort'] for x in critical)),'initialAlive':sum(e['id'] in initial for e in alive),'newAlive':sum(e['id'] not in initial for e in alive),'invalidResources':bad}
def verify(old,new):
 assert old['sourceHashes']['main.js']=='ed25c388ce8d965175cf276ec161e06285d283cf984149ae0922c45ce6a35bf9'
 assert new['sourceHashes']==manifest
 checks={k:new[k]==old[k] for k in ['initial','monthly','trace','actionCounts','warLedger','rng','saveHash','contracts']}
 assert all(checks.values()),checks
 a,b=metrics(old),metrics(new);assert not b['invalidResources'];assert a['metrics']==b['metrics']
 return b,checks
for months,seeds,target in [(120,[11,7,23,42,99,123,404,2026],rows),(240,[404,11,42,23],long)]:
 for seed in seeds:
  name=f'96H0-final-orta-default-{months}-{seed}.json';old=canonical_g2(f'96G2-safe-orta-default-{months}-{seed}.json');new=load(p/name);health,checks=verify(old,new)
  before=metrics(load(g1/f'96G1-{months}-{seed}.json'))['metrics']
  target.append({'seed':seed,'months':months,'g1':before,'g2':metrics(old)['metrics'],'h0':health['metrics'],'health':health,'canonicalG2Checks':checks,'file':name})
  if months==240:assert new['monthly'][:120]==load(p/f'96H0-final-orta-default-120-{seed}.json')['monthly']
for seed,size,n in [(11,'ulu',1),(42,'ulu',11),(23,'kucuk',11),(404,'buyuk',5)]:
 old=canonical_g2(f'96G2-combined-{size}-{n}-120-{seed}.json');new=load(p/f'96H0-final-{size}-{n}-120-{seed}.json');health,checks=verify(old,new)
 density.append({'seed':seed,'systems':{'ulu':100,'kucuk':30,'buyuk':60}[size],'aiCount':n,'metrics':health['metrics'],'health':health,'canonicalG2Checks':checks})
experiments=[]
for folder,phase in [('inherited-queue','A'),('foundation','B'),('foundation-completion','C'),('paid-priority','D')]:
 d=load(o/'experiments'/folder/'campaigns'/f'96H0-{phase}-safe-orta-default-240-404.json');health=metrics(d)
 reference=load(g2/'96G2-safe-orta-default-240-404.json');assert d['initial']==reference['initial'];assert d['monthly'][:106]==reference['monthly'][:106]
 experiments.append({'variant':phase,'folder':folder,'status':'NOT PUBLISHED','initialMatched':True,'months1to106Matched':True,'metrics':health['metrics'],'cohortCritical':health['cohortCritical'],'sourceHashes':d['sourceHashes']})
totals={version:{k:sum(row[version][k] for row in rows) for k in fields} for version in ['g1','g2','h0']}
result={'status':'PASS','runtimeSourceHashes':manifest,'rows120':rows,'rows240':long,'density':density,'totals120':totals,'experiments404':experiments,'physicalAndroid':'NOT RUN','aiPublished':False,'scope':'G1/G2 historical observations; H0 16 newly executed campaigns; final engine equals G2'}
(o/'quality-comparison.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
(o/'baseline-selection.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2))
print(json.dumps({'status':'PASS','runs':len(rows)+len(long)+len(density),'totals':totals,'longCritical':[[x['seed'],x['h0']['criticalEmpireMonths']] for x in long],'experiments':[[x['variant'],x['metrics']['criticalEmpireMonths'],x['metrics']['deliveries'],x['metrics']['power']] for x in experiments]},ensure_ascii=False))
