import json,sys
S=sys.argv[1]
def fate(f,month):
  d=json.load(open(f));rows=d['rows'][:month+1];day=rows[-1]['day']
  seen={}
  for m,r in enumerate(rows):
    for a in r['armies']:seen.setdefault(a['id'],[]).append((m,a))
  clean=[x for x in d['events'] if x['kind']=='fall' and x['type']=='temiz' and x['day']<=day]
  cleanMonths=[int(x['day']//30) for x in clean]
  unsupported=0;atWarArmies=0
  for m,r in enumerate(rows):
    emp={e['id']:e for e in r['emps']}
    for a in r['armies']:
      e=emp.get(a['e']);
      if not e or not e['wars']:continue
      atWarArmies+=1
      at=a['to'] if a['to'] is not None else a['sys']
      dest=a['end'] if a['end'] is not None else at
      # in or heading to a system with enemy colony where attacker has no armed fleet (siege rows have war>0)
      tgt=[s for s in r['sieges'] if s['atk']==a['e'] and s['sys']==dest]
      hostile=any(s['sys']==dest for s in r['sieges'])
      own=any(s['sys']==dest and s['war']>0 for s in tgt)
      enemyDest=dest is not None and any(True for s in r['sieges'] if s['sys']==dest)
      if a['sys']>=0 and tgt and not own:unsupported+=1
  ended=[(i,v[-1][0]) for i,v in seen.items() if v[-1][0]<len(rows)-1]
  consumed=0;lost=0
  for i,last in ended:
    if any(abs(cm-last)<=1 for cm in cleanMonths):consumed+=1
    else:lost+=1
  return dict(armiesSeen=len(seen),endedBeforeHorizon=len(ended),consumedByCleanInvasion=consumed,lostOrOther=lost,armyMonthsAtWar=atWarArmies,armyMonthsInOrbitWithoutOwnWarships=unsupported)
ws={11:['','-pl1','-pl3','-pl5','-pl6'],23:['','-pl1','-pl2','-pl3','-pl4']}
for s,w in ws.items():
  for a in 'cb':
    for month in [240]:
      R=[fate(f'{S}/h9/runs/{a}{s}{x}-240.json',month) for x in w]
      print(s,a,month,{k:sum(r[k] for r in R) for k in R[0]})
  for a in 'cb':
    wars=[sum(1 for x in json.load(open(f'{S}/h9/runs/{a}{s}{x}-240.json'))['events'] if x['kind']=='war') for x in w]
    print(s,a,'war declarations per world',wars)
