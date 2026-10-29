# Builds the compact evidence JSON files of research/96h8 from scratch runs.
import json,hashlib,sys,os
S,R=sys.argv[1],sys.argv[2]
def J(p):return json.load(open(p))
def actor(d,actor):
  es=[[x for x in r['emps'] if x['id']==actor][0] for r in d['rows']]
  f,l=es[0],es[-1]
  return dict(ships=[f['ships'],l['ships']],power=[round(f['power']),round(l['power'])],systems=[f['systems'],l['systems']],techs=[f['techs'],l['techs']],energy=[round(f['ene']),round(l['ene'])],
   minEnergy=round(min(e['ene'] for e in es)),minEnergyNet=round(min(e['incEne'] for e in es),1),deficitMonths=sum(1 for e in es[1:] if e['incEne']<0),
   maxFleetUpkeep=round(max(e['fleetUp'] for e in es),1),maxAwayUpkeep=round(max(e['upAway'] for e in es),1),
   disbandedShips=sum(x['ships'] for x in d['events'] if x['kind']=='disband' and x['e']==actor),
   recalls=[int(x['day']) for x in d['events'] if x['kind']=='campaign-recalled' and x['e']==actor],
   deadlineReassessments=sum(1 for x in d['events'] if x['kind']=='campaign-reassessed' and x['e']==actor),
   attackMonths=sum(1 for e in es[1:] if (e['camp'] or {}).get('phase')=='attack'),fundMonths=sum(1 for e in es[1:] if (e['camp'] or {}).get('phase')=='fund'),
   criticalMonths=sum(1 for e in es[1:] if e['crit']))
def total(d):
  l=[e for e in d['rows'][-1]['emps'] if not e['dead']]
  return dict(alive=len(l),ships=sum(e['ships'] for e in l),power=round(sum(e['power'] for e in l)),techs=sum(e['techs'] for e in l),colonies=sum(e['colonies'] for e in l),disbandedShips=sum(x['ships'] for x in d['events'] if x['kind']=='disband'),finalSaveSHA256=d['finalSaveSHA'],inputSHA256=d['inputSHA'],aiSHA256=d['aiSHA'])
ss={}
windows={'seed11-month60-to-84':('11-m60',1,'tests/fixtures/96h8/seed11-month60.save'),'seed11-month40-to-64':('11-m40',3,'tests/fixtures/96h8/seed11-month40.save'),'seed23-month15-to-39':('23-m15',5,None),'seed42-month60-to-84':('42-m60',None,None),'seed404-month60-to-84':('404-m60',None,None)}
for w,(tag,a,fx) in windows.items():
  arms={}
  for arm in ['control','rejected','cand2b','pl1','pl2','pl3','pl4']:
    p=f'{S}/runs/ss{tag}-{arm}.json'
    if not os.path.exists(p):continue
    d=J(p);arms[arm]={'galaxy':total(d)}
    if a is not None:arms[arm]['actor']=actor(d,a)
  if tag=='11-m60':
    d=J(f'{S}/runs/s11-cand1.json');arms['cand1']={'galaxy':total(d),'actor':actor(d,1)}
  ss[w]={'actor':a,'fixture':fx,'arms':arms}
json.dump({'protocol':'Same Save8 checkpoint, same RNG, 24 months, 60 half-day steps per month. control=96H.7.1 ai.js; rejected=96H.7 campaign-deadline patch on 96H.7.1; cand1=gate only; cand2b=accepted 96H.8; plK=control plus K extra rnd() draws at the first candidate-trigger day (chaos/noise baseline, no logic change). Observers verified pure: control final Save SHA equals canonical unobserved replay.','windows':ss},open(f'{R}/SAME-SAVE.json','w'),indent=1)
seeds=[11,99,404,7,23,42,123,2026];c120={}
for s in seeds:
  c120[s]={}
  for arm in ['control','cand2','cand2b']:
    c120[s][arm]=J(f'{S}/c120/{arm}-{s}/summary-{arm}-{s}.json')
  for arm in ['rejected']:
    d=J(f'{S}/runs/f{s}-{arm}.json');c120[s][arm+'_armHarness']=total(d)
  a=J(f'{S}/c120/control-{s}/control-{s}.json')['monthlyIntegrity'];b=J(f'{S}/c120/cand2b-{s}/cand2b-{s}.json')['monthlyIntegrity']
  diff=[x['month'] for x,y in zip(a,b) if x!=y];c120[s]['cand2b_vs_control_monthly_save_rng']={'equalMonths':len(a)-len(diff),'firstDifferentMonth':diff[0] if diff else None}
keys=['criticalEmpireMonths','deliveries','techs','colonies','ships','power','alive','warsStarted','upkeep','contracts','plansCompleted','plansFailed']
tot={arm:{k:round(sum(c120[s][arm][k] for s in seeds),1) for k in keys} for arm in ['control','cand2','cand2b']}
json.dump({'protocol':'research/96h61/replay.js canonical protocol (45/5 spiral normal, council/crisis off, default 35% origins, real Save8 reload month 60), 8 seeds x 120 months','totals':tot,'seeds':c120},open(f'{R}/CAMPAIGN-120.json','w'),indent=1)
c240={};
for s in [11,23,42,404]:
  c240[s]={arm:J(f'{S}/c240/{arm}-{s}/summary-{arm}-{s}.json') for arm in ['control','cand2b']}
  a=J(f'{S}/c240/control-{s}/control-{s}.json')['monthlyIntegrity'];b=J(f'{S}/c240/cand2b-{s}/cand2b-{s}.json')['monthlyIntegrity']
  diff=[x['month'] for x,y in zip(a,b) if x!=y];c240[s]['cand2b_vs_control_monthly_save_rng']={'equalMonths':len(a)-len(diff),'firstDifferentMonth':diff[0] if diff else None}
tot240={arm:{k:round(sum(c240[s][arm][k] for s in [11,23,42,404]),1) for k in keys} for arm in ['control','cand2b']}
json.dump({'protocol':'same as 120, 4 seeds x 240 months','totals':tot240,'seeds':c240,'noiseDistribution':J(f'{S}/DISTRIBUTION.json')},open(f'{R}/CAMPAIGN-240.json','w'),indent=1)
trig={}
for s in seeds:
  for arm in ['control','cand2','cand2b','rejected']:
    d=J(f'{S}/runs/f{s}-{arm}.json');t={}
    for r in d['rows'][1:]:
      for e in r['emps']:
        c=e['camp'] or {};k='fund' if c.get('phase')=='fund' else 'detachment' if 'müfreze' in (c.get('reason') or '') else 'committed' if 'yeterli kuvvet sevk' in (c.get('reason') or '') else None
        if k:t.setdefault(e['id'],{}).setdefault(k,[]).append(int(r['day']//30))
    trig[f'{s}-{arm}']={'triggers':{a:{k:{'months':len(v),'first':v[0],'last':v[-1]} for k,v in x.items()} for a,x in t.items()},'deadlineReassessments':sum(1 for x in d['events'] if x['kind']=='campaign-reassessed'),'recalls':[(x['e'],int(x['day'])) for x in d['events'] if x['kind']=='campaign-recalled'],'disbands':[{'actor':x['e'],'month':int(x['day']//30),'ships':x['ships'],'atWar':bool(x['war']),'awayUpkeep':round(x['upAway'],1),'homeUpkeep':round(x['upHome'],1),'energyNet':round(x['inc'],1),'energy':round(x['ene'])} for x in d['events'] if x['kind']=='disband']}
json.dump(trig,open(f'{R}/TRIGGERS-AND-DISBANDS-120.json','w'),indent=1)
h=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
json.dump({'baseHEAD':'698874ce2d25c7bddbc17021f2cd825c48b87712','aiSHA256':{'96h71':h(f'{S}/ai-h71.js'),'cand1':h(f'{S}/arms/cand1/ai.js'),'cand2a':h(f'{S}/arms/cand2/ai.js'),'cand2b_accepted':h(f'{S}/arms/cand2b/ai.js'),'rejected96h7_on_96h71':h(f'{S}/arms/rejected/ai.js')},
 'fixtures':{'seed11-month60.save':h('/home/user/Star/tests/fixtures/96h8/seed11-month60.save'),'seed11-month40.save':h('/home/user/Star/tests/fixtures/96h8/seed11-month40.save')},
 'canonicalReproduction':{'control120_totals_equal_H61':tot['control'],'control240_totals':tot240['control'],'seed11_month84_control_save':'652da1c9934ef6c46b4e09caee24a1d34a390d172413df2a463f80c27435c7d2 (observer harness and unobserved replay identical)'}},open(f'{R}/SOURCE.json','w'),indent=1)
print('ok')
