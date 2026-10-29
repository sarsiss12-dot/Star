import json,sys,statistics as st
S=sys.argv[1]
def crit(e):
  inc=e['income'];res=e['resources'];return any(inc.get(r,0)<0 and res.get(r,0)< -inc[r]*3 for r in ['ene','min','tuk','ala'])
def metrics(d,month):
  m=d['monthly'][month-1];alive=[e for e in m if not e['dead']]
  c=sum(1 for mm in d['monthly'][:month] for e in mm if not e['dead'] and crit(e))
  n=lambda v:v if isinstance(v,int) else len(v)
  return dict(crit=c,deliv=sum((e['trade'] or {}).get('deliveries',0) for e in alive),techs=sum(n(e['techs']) for e in alive),cols=sum(n(e['colonies']) for e in alive),ships=sum(e['ships'] for e in alive),power=round(sum(e['power'] for e in alive)),alive=len(alive))
out={}
for s in [11,23]:
  for month in [120,240]:
    groups={'control':['control']+[f'pl{s}k{k}' for k in range(1,5)],'cand2b':['cand2b']+[f'cb{s}k{k}' for k in range(1,5)]}
    print(f'--- seed{s} month{month} (n=5 each: base + 4 single-RNG-draw perturbations)')
    for g,arms in groups.items():
      rows=[metrics(json.load(open(f'{S}/c240/{a}-{s}/{a}-{s}.json')),month) for a in arms]
      summ={k:(round(st.mean(r[k] for r in rows),1),min(r[k] for r in rows),max(r[k] for r in rows)) for k in rows[0]}
      out[f'{s}-{month}-{g}']={'arms':arms,'rows':rows,'mean_min_max':summ}
      print(f'  {g:8s}',' '.join(f'{k}={v[0]}[{v[1]}..{v[2]}]' for k,v in summ.items()))
json.dump(out,open(f'{S}/DISTRIBUTION.json','w'),indent=1)
