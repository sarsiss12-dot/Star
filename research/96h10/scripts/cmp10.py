import json,sys,collections,statistics as st
sys.path.insert(0,'tools')
from armyclass import classify
DIR=__import__('os').environ.get('DIR','runs2')
W={'11':['base','pl1','pl3','pl5','pl6'],'23':['base','pl1','pl2','pl3','pl4']}
SEEDS120=['11','23','42','99','404','7','123','2026']
def metrics(f):
  d=json.load(open(f));c=classify(f);ev=d['events'];rows=d['rows']
  fin=json.load(open(f.replace('.json','-final.save')))
  falls=collections.Counter(x['type'] for x in ev if x['kind']=='fall')
  caps=[x for x in ev if x['kind']=='capture' and x['flips']]
  last=rows[-1]['emps'];alive={e['id'] for e in last if not e['dead']}
  st_=fin['commerce'].get('stats',{})
  built=0
  for a,b in zip(rows,rows[1:]):
    A={e['id']:e['armyShips'] for e in a['emps']};B={e['id']:e['armyShips'] for e in b['emps']}
    for k,v in B.items():built+=max(0,v-A.get(k,0))
  war=[x for x in ev if x['kind']=='disband' and x['war']]
  dep=sum(x['ships'] for x in war if (x.get('upAway') or 0)>(x.get('upHome') or 0))
  combat=sum(v for k,v in c.items() if k.startswith('loss_combatTick'))
  return dict(armyBuilt=built,armyCombatLoss=combat,lossAttackDest=sum(v for k,v in c.items() if k.startswith('loss_combatTick') and k.endswith('_attackDest')),
    lossOther=sum(v for k,v in c.items() if k.startswith('loss_combatTick') and k.endswith('nonAttackDest')),clean=c.get('inv_clean',0),groundLoss=c.get('inv_groundLoss',0),
    arriveEscorted=c.get('arriveEnemyColEscorted',0),arriveNoEscort=c.get('arriveEnemyColNoEscort',0),orders=c.get('orders',0),attackOrders=c.get('attackOrders',0),
    colonyCaptures=len(caps),temiz=falls.get('temiz',0),katastrof=falls.get('katastrof',0),teslim=falls.get('teslim',0),
    ships=sum(e['ships'] for e in last if not e['dead']),power=sum(e['power'] for e in last if not e['dead']),cols=sum(e['colonies'] for e in last if not e['dead']),
    techs=sum(e['techs'] for e in last if not e['dead']),alive=len(alive),crit=sum(1 for r in rows for e in r['emps'] if e['crit'] and not e['dead']),
    warDisband=sum(x['ships'] for x in war),deployDisband=dep,deliveries=sum(v.get('deliveries',0) for k,v in st_.items() if int(k) in alive),
    ala=sum(e['ala'] for e in last if not e['dead']),rngEnd=rows[-1]['rng'])
def group(arm,files):
  M=[metrics(f) for f in files]
  keys=[k for k in M[0] if k!='rngEnd']
  return {k:[m[k] for m in M] for k in keys},M
if __name__=='__main__':
  arms=sys.argv[1:] or ['c9','candD','candD2']
  for s in W:
    print('== seed',s,'5x240')
    for a in arms:
      g,M=group(a,[f'{DIR}/{a}-{s}-{w}-240.json' for w in W[s]])
      print('  %-7s'%a,' '.join(f"{k}={sum(v)}" for k,v in g.items() if k in('armyBuilt','armyCombatLoss','lossAttackDest','lossOther','clean','groundLoss','arriveNoEscort','orders','colonyCaptures','temiz','katastrof','warDisband','deployDisband','crit')))
      print('  %-7s'%'',' '.join(f"{k}={round(st.mean(v),1)}" for k,v in g.items() if k in('ships','power','cols','techs','alive','deliveries','ala')))
  print('== 8x120')
  for a in arms:
    g,M=group(a,[f'{DIR}/{a}-{s}-base-120.json' for s in SEEDS120])
    print('  %-7s'%a,' '.join(f"{k}={sum(v)}" for k,v in g.items()))
    print('          identical-RNG-end vs c9:',[s for s,m in zip(SEEDS120,M) if m['rngEnd']==metrics(f'{DIR}/c9-{s}-base-120.json')['rngEnd']])
