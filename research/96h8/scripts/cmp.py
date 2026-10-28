import json,sys
a=json.load(open(sys.argv[1]));b=json.load(open(sys.argv[2]))
def fin(d):return {e['id']:e for e in d['rows'][-1]['emps']}
A,B=fin(a),fin(b)
print('id  dead  ships  power  techs  cols  sys  ene  incEne  crit/food-months')
def months(d,i,k):return sum(1 for r in d['rows'][1:] for e in r['emps'] if e['id']==i and e[k] and not e['dead'])
for i in sorted(A):
  x,y=A[i],B[i]
  print(i,x['dead'],y['dead'],' %d->%d  %d->%d  %d->%d  %d->%d  %d->%d  %.0f->%.0f  %.1f->%.1f  crit %d->%d food %d->%d'%(x['ships'],y['ships'],x['power'],y['power'],x['techs'],y['techs'],x['colonies'],y['colonies'],x['systems'],y['systems'],x['ene'],y['ene'],x['incEne'],y['incEne'],months(a,i,'crit'),months(b,i,'crit'),months(a,i,'food'),months(b,i,'food')))
for d,n in [(a,'A'),(b,'B')]:
  ev=d['events'];print(n,'disband',sum(x['ships'] for x in ev if x['kind']=='disband'),[(x['e'],int(x['day']),x['ships']) for x in ev if x['kind']=='disband'],'wars',[(x['e'],x['o'],int(x['day'])) for x in ev if x['kind']=='war'],'peace',[(x['e'],x['o'],int(x['day'])) for x in ev if x['kind']=='peace'])
for d,n in [(a,'A'),(b,'B')]:
  trig={}
  for r in d['rows'][1:]:
    for e in r['emps']:
      c=e['camp'] or {}
      k=('fund' if c.get('phase')=='fund' else 'detach' if 'müfreze' in (c.get('reason') or '') else None)
      if k:trig.setdefault(e['id'],{}).setdefault(k,0);
      if k:trig[e['id']][k]+=1
  print(n,'candidate triggers (actor:{kind:months})',trig,'reassessed events',sum(1 for x in d['events'] if x['kind']=='campaign-reassessed'))
