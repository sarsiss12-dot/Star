import json,sys,collections
sys.path.insert(0,'tools')
from armyclass import classify
def summ(f):
  d=json.load(open(f));c=classify(f);ev=d['events']
  falls=collections.Counter(x['type'] for x in ev if x['kind']=='fall')
  caps=[(int(x['day']//30),x['sys'],x['sysFrom'],x['by']) for x in ev if x['kind']=='capture' and x['flips']]
  last=d['rows'][-1]['emps'];first=d['rows'][0]['emps']
  # army hulls built: increases in armyShips per emp month to month (approx)
  built=0
  for a,b in zip(d['rows'],d['rows'][1:]):
    A={e['id']:e['armyShips'] for e in a['emps']};B={e['id']:e['armyShips'] for e in b['emps']}
    for k,v in B.items():built+=max(0,v-A.get(k,0))
  combatLoss=sum(v for k,v in c.items() if k.startswith('loss_combatTick'))
  return dict(armyCombatLoss=combatLoss,lossNonAttack=sum(v for k,v in c.items() if k.startswith('loss_combatTick') and k.endswith('nonAttackDest')),lossAttack=sum(v for k,v in c.items() if k.startswith('loss_combatTick') and k.endswith('_attackDest')),clean=c.get('inv_clean',0),groundLoss=c.get('inv_groundLoss',0),armyBuiltApprox=built,
    caps=caps,falls=dict(falls),ships=sum(e['ships'] for e in last if not e['dead']),power=sum(e['power'] for e in last if not e['dead']),ala=sum(e['ala'] for e in last if not e['dead']),crit=sum(1 for r in d['rows'] for e in r['emps'] if e['crit'] and not e['dead']),rng=d['rows'][-1]['rng'])
if __name__=='__main__':
  for ck in sys.argv[1:]:
    print('==',ck)
    for a in ('c9','candD'):
      for w in ['']+['-pl%d'%k for k in (1,2,3,4)]:
        s=summ(f'ss/{ck}-{a}{w}.json');print('  %-6s %-4s'%(a,w or 'base'),{k:v for k,v in s.items() if k!='rng'})
