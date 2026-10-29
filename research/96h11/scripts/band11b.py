import json,sys,subprocess,statistics as st
# usage: band11b.py ARM_A ARM_B seed:firstDay ... ; triggered = empires whose focus events differ in the first 12 months after first diff
A,B=sys.argv[1],sys.argv[2];specs=[x.split(':') for x in sys.argv[3:]]
R=['ene','min','ala','yiy','tuk','ara','etk']
SUF=['','-pl1','-pl2','-pl3','-pl4']
def load(f):return json.load(open(f))
def deliveries(files):
  out=subprocess.run(['node','tools/deliv11.js','arms/c10']+[f.replace('.json','-final.save') for f in files],capture_output=True,text=True,check=True).stdout
  d=json.loads(out);return [d[f.split('/')[-1].replace('.json','-final.save')] for f in files]
def trig(s,d0):
  a=load(f'band/{s}-{A}.json')['events'];b=load(f'band/{s}-{B}.json')['events']
  ids=set()
  for e in set(x['e'] for x in a+b if x['k']=='f'):
    fa=[(x['d'],x['s'],x['p'],x['to']) for x in a if x['k']=='f' and x['e']==e and x['d']<d0+360]
    fb=[(x['d'],x['s'],x['p'],x['to']) for x in b if x['k']=='f' and x['e']==e and x['d']<d0+360]
    if fa!=fb:ids.add(e)
  return sorted(ids)
def m(d,ids):
  rows=d['rows'];out={};n=len(rows)
  E=lambda row:[e for e in row['emps'] if (ids is None or e['id'] in ids) and not e['dead']]
  for r in R:out['inc_'+r]=round(sum(sum(e['inc'][r] for e in E(row)) for row in rows)/n,1)
  last=E(rows[-1])
  for k in ('techs','ships','power','cols'):out[k]=sum(e[k] for e in last)
  out['alive']=len(last);out['crit']=sum(1 for row in rows for e in E(row) if e['crit']);out['food']=sum(1 for row in rows for e in E(row) if e['food'])
  out['res_min']=sum(e['res']['min'] for e in last);out['res_etk']=sum(e['res']['etk'] for e in last)
  return out
res={}
for s,d0 in specs:
  d0=int(d0);ids=trig(s,d0)
  fa=[f'band/{s}-{A}{x}.json' for x in SUF];fb=[f'band/{s}-{B}{x}.json' for x in SUF]
  da=[load(f) for f in fa];db=[load(f) for f in fb]
  dla=deliveries(fa);dlb=deliveries(fb)
  for scope,I in (('triggered',ids),('world',None)):
    ca=[m(x,I) for x in da];cb=[m(x,I) for x in db]
    if scope=='world':
      for x,v in zip(ca,dla):x['deliv']=v
      for x,v in zip(cb,dlb):x['deliv']=v
    res[s+'-'+scope]={'ids':I,A:ca,B:cb}
    print('== seed',s,scope,I if I else '')
    for k in ca[0]:
      av=[x[k] for x in ca];bv=[x[k] for x in cb]
      flag='  ABOVE' if min(bv)>max(av) else '  BELOW' if max(bv)<min(av) else ''
      print('  %-8s %s med %9s [%s..%s]  %s med %9s [%s..%s]%s'%(k,A,st.median(av),min(av),max(av),B,st.median(bv),min(bv),max(bv),flag))
json.dump(res,open(f'band/BAND-{A}-{B}.json','w'),indent=1)
