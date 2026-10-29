import json,sys
TR={'11':[1,3],'42':[2,4],'7':[4,5],'2026':[3,4]}
R=['ene','min','ala','yiy','tuk','ara','etk']
def m(f,ids):
  d=json.load(open(f));rows=d['rows'];out={}
  def emps(row):return [e for e in row['emps'] if (ids is None or e['id'] in ids)]
  n=len(rows)
  for r in R:out['inc_'+r]=round(sum(sum(e['inc'][r] for e in emps(row) if not e['dead']) for row in rows)/n,1)
  last=emps(rows[-1])
  for k in ('techs','ships','power','cols'):out[k]=sum(e[k] for e in last if not e['dead'])
  out['alive']=sum(1 for e in last if not e['dead'])
  out['crit']=sum(1 for row in rows for e in emps(row) if e['crit'] and not e['dead'])
  out['food']=sum(1 for row in rows for e in emps(row) if e['food'] and not e['dead'])
  out['res_min']=sum(e['res']['min'] for e in last if not e['dead']);out['res_etk']=sum(e['res']['etk'] for e in last if not e['dead'])
  ev=d['events'];sel=lambda x:ids is None or x['e'] in ids
  out['dem']=sum(1 for x in ev if x['k']=='dem' and x['ok'] and sel(x));out['built']=sum(1 for x in ev if x['k']=='done' and sel(x))
  return out
res={}
for s,ids in TR.items():
  for scope,I in (('triggered',ids),('world',None)):
    c=[m(f'band/{s}-c10{x}.json',I) for x in ['','-pl1','-pl2','-pl3','-pl4']]
    b=[m(f'band/{s}-candB{x}.json',I) for x in ['','-pl1','-pl2','-pl3','-pl4']]
    res[s+'-'+scope]={'c10':c,'candB':b}
    print('== seed',s,scope,ids if I else '')
    for k in c[0]:
      cv=[x[k] for x in c];bv=[x[k] for x in b]
      lo,hi=min(cv),max(cv);blo,bhi=min(bv),max(bv)
      flag='  ABOVE' if blo>hi else '  BELOW' if bhi<lo else ''
      print('  %-8s c10 %9s [%s..%s]  B1 %9s [%s..%s]%s'%(k,cv[0],lo,hi,bv[0],blo,bhi,flag))
json.dump(res,open('band/BAND.json','w'),indent=1)
