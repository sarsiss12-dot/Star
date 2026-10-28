from pathlib import Path
import json,collections,hashlib
P=Path(__file__).resolve().parents[1];E=P/'evidence'
def load(p):return json.loads(Path(p).read_text())
def save(n,d):(E/n).write_text(json.dumps(d,ensure_ascii=False,indent=2))
# Native no-Save0 and older normalized Save0 differ in caches; compare all measured game outcomes and RNG rather than equating full serialized bytes.
reuse=[]
for seed in [11,42,404]:
 fresh=load(E/f'native/native-control-{seed}-24.json');old=load(P.parent/f'phase96h61/evidence/control/M240-{seed}/control-M240-{seed}-{seed}.json');diff=[]
 for i,m in enumerate(fresh['monthly']):
  for a in [x for x in m['states']if x['id']>0]:
   b=next(x for x in old['monthly'][i]if x['id']==a['id'])
   for x,y in [('res','resources'),('inc','income'),('techs','techs'),('colonies','colonies'),('ships','ships'),('power','power')]:
    if a[x]!=b[y]:diff.append([i+1,a['id'],x])
  if m['rng']!=old['monthlyIntegrity'][i]['rng']:diff.append([i+1,'rng'])
 reuse.append({'seed':seed,'months':24,'allMeasuredStocksIncomeTechColoniesShipsPowerAndRNGEqual':not diff,'differences':diff,'fullSerializedHashEqual':False,'qualification':'Native caches/_prof/absent cache timestamps and observer paths differ; original failed hash assertion retained in CANONICAL-REUSE-CHECK.json. Not a full-Save equality claim.'})
save('CANONICAL-REUSE-QUALIFIED.json',reuse)
# Actual economic/military/diplomatic state vs plan metadata.
rows=[];physical=['id','dead','res','inc','techs','colonies','owned','ships','power','trade','pacts','allies','wars','fed','buildings']
actual={'ship-paid','building-paid-observed','building-finished','negotiation-observed','war-opened','peace-observed','colony-created','fleet-order'}
for seed in [11,42,404]:
 base=load(E/f'sensitivity/sensitivity-{seed}-base.json')
 for var in ['holdLow','holdHigh','reviewLow','reviewHigh','forceLow','forceHigh','civilianFirst']:
  d=load(E/f'sensitivity/sensitivity-{seed}-{var}.json');checks=[]
  for a,b in zip(base['monthly'],d['monthly']):
   checks.append({'month':a['day']/30,'sameRNG':a['rng']==b['rng'],'samePhysical':[{k:e.get(k)for k in physical}for e in a['states']]==[{k:e.get(k)for k in physical}for e in b['states']]})
  bs=load(E/f'sensitivity/summary-sensitivity-{seed}-base.json');s=load(E/f'sensitivity/summary-sensitivity-{seed}-{var}.json')
  rows.append({'seed':seed,'variant':var,'allMonthlyRNGEqual':all(x['sameRNG']for x in checks),'allPhysicalEqual':all(x['samePhysical']for x in checks),'actualActionTraceEqual':[e for e in base['audit']['events']if e['kind']in actual]==[e for e in d['audit']['events']if e['kind']in actual],'reviews':[bs['reviews'],s['reviews']],'switches':[bs['objectiveSwitches'],s['objectiveSwitches']],'check':checks})
save('SENSITIVITY-COMPARISON.json',rows)
turns=load(E/'ONE-TURN.json');save('ONE-TURN-RESULT.json',[{'variant':v,'fixtures':len(turns),'changedSave':sum(x['arms'][0]['saveSHA256']!=next(a for a in x['arms']if a['variant']==v)['saveSHA256']for x in turns),'changedOrders':sum(x['arms'][0]['orders']!=next(a for a in x['arms']if a['variant']==v)['orders']for x in turns),'changedRNG':sum(x['arms'][0]['rng']!=next(a for a in x['arms']if a['variant']==v)['rng']for x in turns)}for v in ['runwayLow','runwayHigh','civilianFirst','expLow','expHigh']])
objective=collections.defaultdict(lambda:{'months':0,'episodes':set(),'completedMarkers':set()});cargo=collections.defaultdict(float)
refs=load(E/'HISTORICAL-COMPARISON.json')
for r in refs:
 d=load(r['currentRecord']);seed=r['seed']
 for m in d['monthly'][:120]:
  for e in m:
   if e['dead']:continue
   o=e.get('strategy',{}).get('objective',{});k=o.get('kind')
   if k:
    a=objective[k];a['months']+=1;a['episodes'].add((seed,e['id'],o['since']))
    if o.get('completedAt'):a['completedMarkers'].add((seed,e['id'],o['since']))
 for e in d['monthly'][119]:
  if not e['dead']:
   for label in ['received','loaded','lost']:
    for k,v in (e.get('trade')or{}).get(label,{}).items():cargo[label+':'+k]+=v
save('OBJECTIVE-CENSUS.json',{k:{'months':v['months'],'episodesSeen':len(v['episodes']),'completedMarkersSeen':len(v['completedMarkers']),'victoryOrPlanSuccessNotClaimed':True}for k,v in objective.items()})
save('CURRENT-CARGO-VECTORS.json',dict(cargo))
# Simple pregame table; offers and contact totals are directed.
pg=[]
for f in sorted((E/'pregame').glob('summary-*.json')):
 s=load(f);d=load(f.parent/f.name.removeprefix('summary-'));es=[e for e in d['monthly'][-1]['states']if e['id']>0 and not e['dead']]
 pg.append({**{k:s[k]for k in ['tag','criticalEmpireMonths','foodCritical','techs','colonies','ships','power','deliveries','warDeclarations','negotiations','acceptedNegotiations']},'contactsDirected':sum(len(e['contacts'])for e in es),'alliesDirected':sum(len(e['allies'])for e in es),'config':s['config'],'paid':s['paid'],'cargo':s['cargo']})
save('PREGAME-COMPARISON.json',pg)
print('reuse',reuse);print('turns',load(E/'ONE-TURN-RESULT.json'));print('sensitivity physical diffs',[x for x in rows if not x['allPhysicalEqual'] or not x['allMonthlyRNGEqual'] or not x['actualActionTraceEqual']]);print('objectives',load(E/'OBJECTIVE-CENSUS.json'))
