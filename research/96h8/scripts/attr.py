import json,sys
S=sys.argv[1]
for s in [11,23]:
  for arm in sys.argv[2:]:
    d=json.load(open(f'{S}/runs/f{s}-{arm}.json'))
    trig={}
    for r in d['rows'][1:]:
      for e in r['emps']:
        c=e['camp'] or {};k='fund' if c.get('phase')=='fund' else 'detach' if 'müfreze' in (c.get('reason') or '') else 'committed' if 'yeterli kuvvet sevk' in (c.get('reason') or '') else None
        if k:trig.setdefault(e['id'],{}).setdefault(k,[]).append(int(r['day']//30))
    dis=[(x['e'],int(x['day']//30),x['ships'],'war' if x['war'] else 'peace','away%.0f/home%.0f'%(x['upAway'],x['upHome']),'inc%.0f'%x['inc'],'ene%.0f'%x['ene']) for x in d['events'] if x['kind']=='disband']
    re=sum(1 for x in d['events'] if x['kind']=='campaign-reassessed')
    print(f'seed{s} {arm}: reassessed={re}');print('  triggers',{a:{k:(len(v),v[0],v[-1]) for k,v in t.items()} for a,t in trig.items()})
    print('  disbands',dis)
