import json,collections
KEYS=['ene','min','tuk','ala']
def stats(d,horizon=None):
 rows=d['monthly'][:horizon] if horizon else d['monthly'];last=rows[-1];alive=[x for x in last if not x['dead']]
 out={k:sum(x[k] for x in alive) for k in ['techs','colonies','ships','power']};out.update(deliveries=sum((x.get('trade') or {}).get('deliveries',0) for x in last),critical=0,criticalByActor={},alive=[x['id'] for x in alive],newSurvivors=[x['id'] for x in alive if x['id']>5])
 for rs in rows:
  for x in rs:
   if not x['dead'] and any(x['income'][k]<0 and x['resources'][k]<-x['income'][k]*3 for k in KEYS):out['critical']+=1;out['criticalByActor'][x['id']]=out['criticalByActor'].get(x['id'],0)+1
 out['demolitions']=sum(x['kind']=='queueDemolish' and x['day']<=len(rows)*30+d.get('startMonth',0)*30 for x in d['auditTrace'])
 trace=[x for x in d['auditTrace'] if x['day']<=len(rows)*30+d.get('startMonth',0)*30];unused=collections.defaultdict(list);cycles=[]
 for x in trace:
  key=tuple(x.get(k) for k in ['actor','s','p','key'])
  if x['kind']=='job-finished' and x.get('dem') and x.get('success'):unused[key].append(x)
  if x['kind']=='queueBuilding':
   pool=unused[key]
   while pool and x['day']-pool[0]['day']>360:pool.pop(0)
   if pool:
    a=pool.pop(0);finish=next((t for t in trace if t['kind']=='job-finished' and not t.get('dem') and t.get('success') and all(t.get(k)==x.get(k) for k in ['actor','s','p','key']) and t['day']>x['day']),None)
    cycles.append({'actor':x['actor'],'s':x['s'],'p':x['p'],'key':x['key'],'demDay':a['day'],'orderDay':x['day'],'netMinerals':x['paid'].get('min',0)-(a.get('refund') or {}).get('min',0),'interruptionDays':finish['day']-a['day'] if finish else None})
 out.update(rebuild12=len(cycles),cycleNetMinerals=sum(x['netMinerals'] for x in cycles),finishedCycleBuildingDays=sum(x['interruptionDays'] or 0 for x in cycles),cycles=cycles)
 return out
