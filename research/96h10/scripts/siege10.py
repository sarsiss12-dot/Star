import json,glob,collections,sys
def analyse(f):
  d=json.load(open(f));rows=d['rows'];ev=d['events'];L=d['armyLog'];out=[]
  for x in ev:
    if x['kind']!='capture' or not x['flips']:continue
    typ=[y['type'] for y in ev if y['kind']=='fall' and abs(y['day']-x['day'])<1]
    typ=typ[0] if typ else '?'
    m=int(x['day']//30);A=x['by'];S=x['sys']
    # siege start: earliest month before m with continuous attacker war>0 at S
    start=None
    for k in range(m,-1,-1):
      if k>=len(rows):continue
      if any(s['sys']==S and s['atk']==A and s['war']>0 for s in rows[k]['sieges']):start=k
      else:
        if start is not None:break
    gz=None
    for k in range(start or m,m+1):
      if k<len(rows) and any(s['sys']==S and s['atk']==A and s['garrison']<=0.01 for s in rows[k]['sieges']):gz=k;break
    armiesDuring=[k for k in range(start or m,m+1) if k<len(rows) and any(a['e']==A for a in rows[k]['armies'])]
    toTarget=[k for k in range(start or m,m+1) if k<len(rows) and any(a['e']==A and (a['end']==S or a['to']==S) for a in rows[k]['armies'])]
    truce=[k for k in range(start or m,m+1) if k<len(rows) and any(s['sys']==S and s['atk']==A and s['truce'] is not None for s in rows[k]['sieges'])]
    orders=[y for y in L if y['kind']=='order' and y['ok'] and y['e']==A and y['to']==S and (start or m)*30-30<=y['day']<=x['day']]
    arr=[y for y in L if y['kind']=='arrive' and y['e']==A and y['sys']==S and (start or m)*30-30<=y['day']<=x['day']+1]
    out.append(dict(file=f.split('/')[-1],month=m,sys=S,by=A,frm=x['sysFrom'],type=typ,siegeStart=start,siegeMonths=(m-start) if start is not None else None,garrisonZeroMonth=gz,
      monthsWithAnyArmy=len(armiesDuring),monthsArmyHeadingThere=len(toTarget),truceMonths=len(truce),
      firstOrderDay=orders[0]['day'] if orders else None,orderEta=orders[0]['eta'] if orders else None,arriveDay=arr[0]['day'] if arr else None))
  return out
if __name__=='__main__':
  R=[]
  for f in sys.argv[1:]:R+=analyse(f)
  for r in R:print(r)
  by=collections.defaultdict(list)
  for r in R:by[r['type']].append(r)
  for t,v in by.items():
    print(t,len(v),'siegeMonths',[r['siegeMonths'] for r in v],'anyArmyMonths',[r['monthsWithAnyArmy'] for r in v],'headingMonths',[r['monthsArmyHeadingThere'] for r in v],'truce',[r['truceMonths'] for r in v])
