"""Read-only analysis of complete 120-month traces; repeated note calls are deduped.
AIDiagnostics resets when Save8 swaps the world at month60. Its final report is
therefore not a whole-campaign total. The external forensics trace survives it.
"""
import json,pathlib,collections
root=pathlib.Path(__file__).resolve().parent.parent;out=root/'tests/audit96f1';p=out/'campaigns';seeds=[11,99,404,7,23,42,123,2026]
def load(name):return json.loads((p/name).read_text())
def gates(d):
 seen=set();c=collections.Counter()
 for e in d['forensics']:
  if e['kind']!='decision-gate':continue
  key=(int(e['day']//30),e.get('actor'),e.get('other'),e['code'])
  if key not in seen:seen.add(key);c[e['code']]+=1
 return dict(c)
def details(d):
 severe=[]
 for m,rows in enumerate(d['monthly']):
  for e in rows:
   shortage={k:{'stock':e['resources'][k],'net':e['income'][k]} for k in ['ene','min','tuk','ala'] if e['income'][k]<0 and e['resources'][k]<-e['income'][k]*3}
   if shortage:severe.append({'month':m+1,'actor':e['id'],'shortage':shortage,'upkeep':e['upkeep'],'ships':e['ships'],'objective':e['strategy']['objective']['kind'],'stage':e['strategy']['plan']['stage']})
 selections=[];seen=set()
 for rows in d['monthly']:
  for e in rows:
   for x in e.get('strategy',{}).get('history',[]):
    if x['kind']!='objective-selected':continue
    key=(e['id'],x['day'],x['objective'])
    if key not in seen:seen.add(key);selections.append({'actor':e['id'],**x})
 early=[]
 for actor in [e['id'] for e in d['initial']['identities']]:
  chosen=sorted([x for x in selections if x['actor']==actor],key=lambda x:x['day'])
  for a,b in zip(chosen,chosen[1:]):
   if b['day']-a['day']<720 and b['reason']=='Kimlik, bilinen çevre ve kendi ekonomik kapasitesi':early.append({'actor':actor,'old':a,'new':b})
 payments={kind:{r:sum(e['paid'].get(r,0) for e in d['forensics'] if e['kind']==kind) for r in ['min','ene','ala','tuk']} for kind in ['queueBuilding','queueShip']}
 netSum={r:sum(e['income'][r] for rows in d['monthly'] for e in rows if not e['dead']) for r in ['ene','min','ala','tuk','ara']}
 finalNet={r:sum(e['income'][r] for e in d['monthly'][-1] if not e['dead']) for r in ['ene','min','ala','tuk','ara']}
 return {'whole120GateCounts':gates(d),'criticalPeriods':severe,'investmentPayments':payments,'monthlyNetIncomeSum':netSum,'lastNetIncome':finalNet,'objectiveSelections':dict(collections.Counter(e['objective'] for e in selections)),'earlyNormalChanges':early,'freightOffers':sum(x['kind']=='diplomatic-offer' and any(t['t']=='freight' for t in x.get('give',[])) for x in d['trace']),'freightNegotiationRejected':sum(x['kind']=='diplomatic-offer' and any(t['t']=='freight' for t in x.get('give',[])) and not x['applied'] for x in d['trace']),'traceCapReached':len(d['trace'])>=4000 or len(d['forensics'])>=16000}
results=[]
for seed in seeds:
 old,new=load(f'96F-{seed}.json'),load(f'96F1-{seed}.json');comparison=load(f'comparison-{seed}.json');od,nd=details(old),details(new)
 oldReal=[{k:v for k,v in e.items() if k not in ['strategy','campaign','shipPlan','memory']} for rows in old['monthly'] for e in rows]
 newReal=[{k:v for k,v in e.items() if k not in ['strategy','campaign','shipPlan','memory']} for rows in new['monthly'] for e in rows]
 results.append({'seed':seed,'comparison':comparison,'old':od,'next':nd,'realMonthlySame':oldReal==newReal,'rngSame':old['rng']==new['rng'],'actualTraceSame':old['trace']==new['trace']})
 assert not od['traceCapReached'] and not nd['traceCapReached']
 # Full chronological tables are part of the evidence, not just a final month.
 if seed in [11,99]:
  for phase,d in [('96F',old),('96F1',new)]:
   selected=[x for x in d['forensics'] if x['kind'] in ['contract-sign','contract-cancel','raid','freight-end','dispatch'] or seed==11 and x.get('actor') in [1,2] and x['kind'] in ['queueBuilding','queueDemolish','queueShip','strategy','decision-gate'] and (x['kind']!='decision-gate' or x['code'].startswith('recovery:'))]
   (out/f'timeline-{phase}-{seed}.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2)+'\n')
report={'method':'Eight preselected seeds, medium normal, five AI, idle player, crisis/council off, 120 months, real half-day ticks, reload month60. Official 96F 11/99/404 hash/RNG replayed. Candidate shares geography, homes and identities. Changes to later RNG are not independent causal proof. Gate counts dedupe actor/partner/code/month over the complete external trace; final AIDiagnostics.report alone covers only post-reload world.','results':results}
(out/'campaign-analysis.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'seeds':len(results),'months':120,'traceCapsReached':0,'earlyNormalChanges':[len(x['next']['earlyNormalChanges']) for x in results]},ensure_ascii=False))
