import json,sys,statistics as st
S=sys.argv[1]
worlds={11:['','-pl1','-pl3','-pl5','-pl6'],23:['','-pl1','-pl2','-pl3','-pl4']}
def met(d,month):
  day=d['rows'][month]['day'];ev=[x for x in d['events'] if x['day']<=day]
  l=[e for e in d['rows'][month]['emps'] if not e['dead']]
  return dict(colonyCaptures=sum(len(x['flips']) for x in ev if x['kind']=='capture'),clean=sum(1 for x in ev if x['kind']=='fall' and x['type']=='temiz'),catas=sum(1 for x in ev if x['kind']=='fall' and x['type']=='katastrof'),
   ground=sum(1 for x in ev if x['kind']=='ground'),armyLost=round(sum(x['armyLost'] for x in ev if x['kind']=='ground'),1),
   ships=sum(e['ships'] for e in l),power=sum(e['power'] for e in l),techs=sum(e['techs'] for e in l),cols=sum(e['colonies'] for e in l),alive=len(l),
   crit=sum(1 for r in d['rows'][1:month+1] for e in r['emps'] if not e['dead'] and e['crit']),warDisband=sum(x['ships'] for x in ev if x['kind']=='disband' and x['war']),
   armyWarMonths=sum(e['armyShips'] for r in d['rows'][1:month+1] for e in r['emps'] if e['wars']))
out={}
for s,ws in worlds.items():
  for month in [120,240]:
    print(f'--- seed{s} month{month} (5 distinct worlds per arm)')
    for a,name in [('c','control-96h8'),('b','candB')]:
      rows=[met(json.load(open(f'{S}/h9/runs/{a}{s}{w}-240.json')),month) for w in ws]
      summ={k:(round(st.mean(r[k] for r in rows),1),min(r[k] for r in rows),max(r[k] for r in rows)) for k in rows[0]}
      out[f'{s}-{month}-{name}']={'worlds':ws,'rows':rows,'mean_min_max':summ}
      print(f'  {name:13s}',' '.join(f'{k}={v[0]}[{v[1]}..{v[2]}]' for k,v in summ.items()))
json.dump(out,open(f'{S}/h9/DISTRIBUTION.json','w'),indent=1)
