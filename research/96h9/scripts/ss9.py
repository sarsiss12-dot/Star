import json,sys,statistics as st
S=sys.argv[1];out={}
wins={'s11m60':1,'s11m40':3,'s23m15':5}
for w,actor in wins.items():
  print('=====',w,'actor',actor);out[w]={}
  for a in ['control','control-pl1','control-pl2','control-pl3','control-pl4','candB','candC','candBC','candBC-pl1','candBC-pl2','candBC-pl3','candBC-pl4']:
    d=json.load(open(f'{S}/h9/ss/{w}-{a}.json'));rows=d['rows'];ev=d['events'];m0=int(rows[0]['day']//30)
    caps=[(int(x['day']//30),x['sys'],x['by'],[f['from'] for f in x['flips']]) for x in ev if x['kind']=='capture' and x['flips']]
    falls={}
    for x in ev:
      if x['kind']=='fall' and x['type'] in ('temiz','katastrof'):falls[x['type']]=falls.get(x['type'],0)+1
    e0=[e for e in rows[0]['emps'] if e['id']==actor][0];e1=[e for e in rows[-1]['emps'] if e['id']==actor][0]
    gl=round(sum(x['armyLost'] for x in ev if x['kind']=='ground' and x['atk']==actor),1)
    armies=len({ar['id'] for r in rows for ar in r['armies'] if ar['e']==actor})
    siegeMonths=sum(1 for r in rows[1:] for s in r['sieges'] if s['atk']==actor and s['war']>0)
    dis=sum(x['ships'] for x in ev if x['kind']=='disband' and x['e']==actor)
    crit=sum(1 for r in rows[1:] for e in r['emps'] if e['id']==actor and e['crit'])
    galaxy=sum(e['ships'] for e in rows[-1]['emps'] if not e['dead'])
    rec=dict(captures=caps,falls=falls,actorColonies=[e0['colonies'],e1['colonies']],actorShips=[e0['ships'],e1['ships']],actorPower=[e0['power'],e1['power']],actorEnergy=[e0['ene'],e1['ene']],minNet=min(e['incEne'] for r in rows for e in r['emps'] if e['id']==actor),armiesUsed=armies,groundArmyLost=gl,siegeMonths=siegeMonths,disband=dis,crit=crit,galaxyShips=galaxy,alive=sum(1 for e in rows[-1]['emps'] if not e['dead']))
    out[w][a]=rec
    print(f'  {a:12s}',json.dumps(rec,ensure_ascii=False))
json.dump(out,open(f'{S}/h9/SAME-SAVE.json','w'),indent=1)
