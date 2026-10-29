import json,sys
S=sys.argv[1];arms=sys.argv[2].split(',');seeds=[int(x) for x in sys.argv[3].split(',')];months=sys.argv[4]
def tot(d):
  l=[e for e in d['rows'][-1]['emps'] if not e['dead']]
  ev=d['events']
  return dict(alive=len(l),ships=sum(e['ships'] for e in l),power=sum(e['power'] for e in l),techs=sum(e['techs'] for e in l),cols=sum(e['colonies'] for e in l),
   crit=sum(1 for r in d['rows'][1:] for e in r['emps'] if not e['dead'] and e['crit']),
   colonyCaptures=sum(len(x['flips']) for x in ev if x['kind']=='capture'),clean=sum(1 for x in ev if x['kind']=='fall' and x['type']=='temiz'),catas=sum(1 for x in ev if x['kind']=='fall' and x['type']=='katastrof'),
   groundBattles=sum(1 for x in ev if x['kind']=='ground'),armyLost=round(sum(x['armyLost'] for x in ev if x['kind']=='ground'),1),
   disband=sum(x['ships'] for x in ev if x['kind']=='disband'),warDisband=sum(x['ships'] for x in ev if x['kind']=='disband' and x['war']),
   armyMonths=sum(e['armyShips'] for r in d['rows'][1:] for e in r['emps']),armyWarMonths=sum(e['armyShips'] for r in d['rows'][1:] for e in r['emps'] if e['wars']))
T={a:{} for a in arms}
for s in seeds:
  for a in arms:
    t=tot(json.load(open(f'{S}/h9/runs/{a}{s}-{months}.json')))
    for k,v in t.items():T[a][k]=T[a].get(k,0)+v
    print(s,a,t)
for a in arms:print('TOTAL',a,T[a])
