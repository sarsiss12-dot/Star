# Classify army lifecycle events from arm10 runs.
import json,sys,collections,glob
def classify(f):
  d=json.load(open(f));L=d['armyLog']
  out=collections.Counter()
  orders=[x for x in L if x['kind']=='order' and x['ok']]
  out['orders']=len(orders);out['attackOrders']=sum(1 for x in orders if x['enemyCol'])
  out['attackOrdersNoEscort']=sum(1 for x in orders if x['enemyCol'] and x['own']==0 and x['ownTo']==0)
  arr=[x for x in L if x['kind']=='arrive']
  out['arrivals']=len(arr);out['arriveEnemyCol']=sum(1 for x in arr if x['enemyCol'])
  out['arriveEnemyColEscorted']=sum(1 for x in arr if x['enemyCol'] and x['own']>0)
  out['arriveEnemyColNoEscort']=sum(1 for x in arr if x['enemyCol'] and x['own']==0)
  out['arriveTargetGone']=0
  # arrival at a destination that had an enemy colony when ordered but not on arrival
  lastOrder={}
  for x in L:
    if x['kind']=='order' and x['ok']:lastOrder[x['fleet']]=x
    if x['kind']=='arrive':
      o=lastOrder.get(x['fleet'])
      if o and o['to']==x['sys'] and o['enemyCol'] and not x['enemyCol']:out['arriveTargetGone']+=1
  for x in L:
    if x['kind']!='loss':continue
    n=x['n'];out['lostHulls']+=n
    if x['by']=='invasionTick':
      out['inv_clean' if x['cleanInCall'] else 'inv_groundLoss']+=n;continue
    attack=x['destEnemyCol'] and G(x)
    k=x['by']
    if k=='combatTick':
      if x['moving']:k+='_moving'
      elif x['ownHere']>0:k+='_escorted'
      else:k+='_noEscort'
      k+=('_attackDest' if x['destEnemyCol'] else '_nonAttackDest')
    out['loss_'+k]+=n
  st=d['stale'];out['staleMonths_targetGone']=sum(1 for x in st if not x['enemyCol'])
  out['staleMonths_noSupport']=sum(1 for x in st if x['enemyCol'] and x['own']==0 and x['ownTo']==0)
  out['staleMonths_warOver']=sum(1 for x in st if not x['war'])
  return out
def G(x):return True
if __name__=='__main__':
  tot=collections.Counter()
  for f in sys.argv[1:]:
    c=classify(f);tot+=c;print(f.split('/')[-1],dict(c))
  print('TOTAL',dict(tot))
