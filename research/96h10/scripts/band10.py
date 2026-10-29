import json,sys,collections
def m(f):
  d=json.load(open(f));last=d['rows'][-1]['emps'];L=d['armyLog'];ev=d['events']
  return dict(ships=sum(e['ships'] for e in last if not e['dead']),power=sum(e['power'] for e in last if not e['dead']),techs=sum(e['techs'] for e in last if not e['dead']),
    cols=sum(e['colonies'] for e in last if not e['dead']),armyLoss=sum(x['n'] for x in L if x['kind']=='loss' and x['by']=='combatTick'),clean=sum(1 for x in ev if x['kind']=='fall' and x['type']=='temiz'),
    caps=sum(1 for x in ev if x['kind']=='capture' and x['flips']),kat=sum(1 for x in ev if x['kind']=='fall' and x['type']=='katastrof'),
    crit=sum(1 for r in d['rows'] for e in r['emps'] if e['crit'] and not e['dead']),wdis=sum(x['ships'] for x in ev if x['kind']=='disband' and x['war']))
out={}
for l in open('band2/specs.txt'):
  s,pd,pk,w,mo,hz=l.split();tag=f'{s}-{w}'
  r={}
  for a in ('c9','candD'):
    r[a]=[m(f'band2/{tag}-{a}{x}.json') for x in ['']+['-pl%d'%k for k in (1,2,3,4)]]
  out[tag]=r
  print('==',tag,'from month',mo,'to',hz)
  for k in r['c9'][0]:
    c=[x[k] for x in r['c9']];d=[x[k] for x in r['candD']]
    flag='' if min(c)<=d[0]<=max(c) else (' ABOVE' if d[0]>max(c) else ' BELOW')
    print('   %-9s 96H.9 base %-7s band [%s..%s] | D base %-7s D band [%s..%s]%s'%(k,c[0],min(c),max(c),d[0],min(d),max(d),flag))
json.dump(out,open('band2/BAND.json','w'),indent=1)
