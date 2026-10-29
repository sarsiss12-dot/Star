import json,sys,collections
def load(p):return json.load(open(p))
worlds={'11':['','-pl1','-pl3','-pl5','-pl6'],'23':['','-pl1','-pl2','-pl3','-pl4']}
arms=sys.argv[2:] if len(sys.argv)>2 else ['c','y']
seed=sys.argv[1]
for w in worlds[seed]:
  for a in arms:
    d=load(f'runs/{a}{seed}{w}-240-final.save')
    cs=d['commerce']['contracts']
    alive=[e['id'] for e in d['emps'] if not e.get('dead') and not e.get('wild')]
    st=d['commerce'].get('stats',{})
    pairs=collections.Counter();firstborn={};lastborn={}
    for c in cs:
      k=(c['a'],c['b']);pairs[k]+=1;firstborn.setdefault(k,c['born']);lastborn[k]=c['born']
    reasons=collections.Counter((c['status'],c.get('reason','')[:40]) for c in cs)
    print(f"{a}{seed}{w}: contracts={len(cs)} alive={alive} deliveries={ {k:v.get('deliveries') for k,v in st.items()} }")
    for k,n in sorted(pairs.items()):print('   pair',k,n,'born',int(firstborn[k]/30),'..',int(lastborn[k]/30))
    for r,n in reasons.most_common(6):print('   ',n,r)
