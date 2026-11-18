"""Reproduce tables using median and nearest-rank p95. Never extrapolate past game over."""
import collections as C
import json,gzip,math,statistics
from pathlib import Path
raw=Path(__file__).resolve().parent/'raw'
def stats(v):
    v=sorted(v)
    return dict(n=len(v),p50=round(statistics.median(v),2),p95=round(v[math.ceil(.95*len(v))-1],2),max=round(v[-1],2)) if v else {'n':0}
def get(f):
    return json.loads(gzip.decompress(f.read_bytes()) if f.suffix=='.gz' else f.read_bytes())
def ai(r):
    ev,months=r['events'],r['months'];keys={'ene':{'santral','liman'},'min':{'maden'},'ala':{'dokum'},'tuk':{'fabrika'},'yiy':{'ciftlik'}}
    ids=sorted({e['id'] for m in months for e in m['emps']})
    def low(e,k,level):
        return bool(e and not e.get('dead') and e['inc'].get(k,0)<0 and e['res'].get(k,0)<-e['inc'][k]*level)
    episodes=[];zero=0;crit=0
    for i in ids:
      es=[next((e for e in m['emps'] if e['id']==i),None) for m in months]
      crit+=sum(any(low(e,k,3) for k in keys) for e in es[1:])
      for k in keys:
        start=None
        for j in range(1,len(es)+1):
          e=es[j] if j<len(es) else None
          if low(e,k,3):
            if start is None:start=j
            if e['res'][k]<=1e-7:zero+=1
          elif start is not None:
            a=start-1
            while a>0 and low(es[a],k,12):a-=1
            pre=[x for x in ev if x['k']=='building-paid' and x['e']==i and x['key'] in keys[k] and months[a]['day']<x['d']<months[start]['day']]
            episodes.append(dict(actor=i,res=k,start=start,duration=j-start,recovered=bool(e and not e.get('dead')),lead=start-a-1,producer=len(pre)));start=None
    def ck(m):
        E=[e for e in m['emps'] if not e.get('dead')]
        return dict(liveAI=len(E),ships=sum(e['ships'] for e in E),colonies=sum(e['colonies'] for e in E),tech=sum(e['tech'] for e in E),
          incomes={k:round(sum(e['inc'].get(k,0) for e in E),2) for k in keys},feds=[len(f[2]) for f in m['feds']],lords=sum(e.get('lord') is not None for e in E))
    # First paid order after completed demolition, followed by completion. One subsequent removal cannot claim same payment twice.
    bycol=C.defaultdict(list)
    for x in ev:
      if x['k'] in ('removed','built','building-paid','building-replacement','build-refund'):
        bycol[(x['e'],x.get('system'),x.get('planet'))].append(x)
    cycles=[]
    for loc,records in bycol.items():
      if loc[0]==0:continue
      for i,x in enumerate(records):
        if x['k']!='removed':continue
        following=records[i+1:];q=next((y for y in following if y['k'] in ('building-paid','removed')),None)
        if not q or q['k']!='building-paid' or q['key']!=x['key'] or q['d']-x['d']>180:continue
        z=next((y for y in following if y['k'] in ('built','build-refund','removed') and y['key']==q['key'] and y['d']>=q['d']),None)
        if not z or z['k']!='built':continue
        intent=next((y for y in reversed(records[:i]) if y['k']=='building-replacement' and y['removed']==x['key']),{})
        cycles.append(dict(actor=loc[0],system=loc[1],planet=loc[2],key=q['key'],wanted=intent.get('wanted'),removed=x['d'],buy=q['d'],done=z['d'],paid=q['paid'],refund=x['refund']))
    legs=[x for x in ev if x['k']=='leg-end']; active={};times=[];paid={k:C.Counter() for k in ('building-paid','ship-paid')}
    for x in ev:
      if x['k'] in paid:paid[x['k']].update(x['paid'])
      if x['k']=='objective-selected':active[x['e']]=x['d']
      if x['k']=='milestone-complete' and x['e'] in active:times.append((x['d']-active[x['e']])/30)
    warlegs=[x for x in legs if x['war']]
    return dict(months=len(months)-1,over=months[-1]['over'],ck={j:ck(m) for j,m in enumerate(months) if j in (0,3,120,180,240,len(months)-1)},critical=crit,zero=zero,episodes=episodes,recovery=stats(x['duration'] for x in episodes if x['recovered']),
      actions=C.Counter(x['k'] for x in ev),milestone=stats(times),paid=paid,cycles=cycles,netMinerals=sum(x['paid'].get('min',0)-x['refund'].get('min',0) for x in cycles),lostDays=sum(x['done']-x['removed'] for x in cycles),
      ends=C.Counter(x['end'] for x in legs),arrival=stats(x['d']-x['start'] for x in legs if x['end']=='arrived'),warEnds=C.Counter(x['end'] for x in warlegs),warArrival=stats(x['d']-x['start'] for x in warlegs if x['end']=='arrived'),
      disbands=[x for x in ev if x['k']=='disband'],deals=C.Counter(tupleString(x) for x in ev if x['k']=='deal'),maxFed=max((len(f[2]) for m in months for f in m['feds']),default=0),siege=sum(len(m['siege']) for m in months),
      fronts=[{k:v for k,v in f.items() if k in ('id','sides','opened','ended','endReason','occupation','goals','metrics')} for f in r['fronts']])
def tupleString(x):
    return '/'.join(x['g'])+' → '+'/'.join(x['w'])+' '+str(x['applied'])
def browser(r):
    out=[]
    for x in r['rows']:
      z=dict(month=x['month'],context=x['context'],surfaces=[])
      for s in x['scenes']:
        cell={'kind':s['k']}
        for k in ['h','g']:
          if s[k]:cell[k]={**{j:stats(s[k].get(j,[])) for j in ('frames','draw','long','rxDraw','publish','deserialize')},'heapMiB':round(s[k]['heap']/2**20,1),'view':s[k+'v']}
        cell['packet']=stats(v for k,v in s['wire'] if k in ('mirror','mirrorDelta'))
        z['surfaces'].append(cell)
      z['cpu']={k:stats(v) for k,v in x.get('cpu',{}).items() if isinstance(v,list)};z['full']=stats(x.get('full',[]))
      z['ships']={'ack':stats(c['ackMs'] for c in x['ships']),'visible':stats(c['guestMs'] for c in x['ships']),'error':x.get('commandError') or x.get('stop')}
      out.append(z)
    return out
d={'worlds':{},'browser':{},'pilot':{}}
for f in sorted(raw.iterdir()):
    if f.name[0].isdigit() and f.suffix=='.gz':d['worlds'][f.name.split('.')[0]]=ai(get(f))
    if f.name.startswith(('mp-','sp-')) and f.suffix=='.json':d['browser'][f.stem]=browser(get(f))
    if f.name.startswith(('pilot-','chromium-')):
      r=get(f);d['pilot'][f.stem]={a:stats(x['ms'] for run in r['runs'] if run['arm']==a for x in run['rows']) for a in ('base','pilot')}
      d['pilot'][f.stem]['equal']=all((x['day'],x['sha'],x['rng'])==(r['runs'][0]['rows'][i]['day'],r['runs'][0]['rows'][i]['sha'],r['runs'][0]['rows'][i]['rng']) for run in r['runs'] for i,x in enumerate(run['rows']))
(raw/'summary.json').write_text(json.dumps(d,ensure_ascii=False,indent=1)+'\n')
