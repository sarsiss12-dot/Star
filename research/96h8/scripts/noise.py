import json,sys
S=sys.argv[1]
def at(d,month):
  m=d['monthly'][month-1];alive=[e for e in m if not e['dead']]
  crit=0
  for mm in d['monthly'][:month]:
    for e in mm:
      if e['dead']:continue
      inc=e['income'];res=e['resources']
      if any(inc.get(r,0)<0 and res.get(r,0)< -inc[r]*3 for r in ['ene','min','tuk','ala']):crit+=1
  return dict(alive=len(alive),crit=crit,deliv=sum((e['trade'] or {}).get('deliveries',0) for e in alive),techs=sum(e['techs'] if isinstance(e['techs'],int) else len(e['techs']) for e in alive),cols=sum(e['colonies'] if isinstance(e['colonies'],int) else len(e['colonies']) for e in alive),ships=sum(e['ships'] for e in alive),power=round(sum(e['power'] for e in alive)))
for s in [11,23]:
  for month in [120,240]:
    print(f'--- seed{s} month{month}')
    for a in ['control']+[f'pl{s}k{k}' for k in range(1,5)]+['cand2b']:
      d=json.load(open(f'{S}/c240/{a}-{s}/{a}-{s}.json'));print(f'{a:9s}',at(d,month))
