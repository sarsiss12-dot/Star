import json,pathlib
P=pathlib.Path(__file__).resolve().parents[1];E=P/'evidence';out=[]
def metric(rows,k):
 critical=[x['month'] for x in rows if not x['actor']['dead'] and x['actor']['inc'][k]<0 and x['actor']['res'][k]<-x['actor']['inc'][k]*3];zero=[x['month'] for x in rows if x['actor']['res'][k]<=0 and x['actor']['inc'][k]<0];length=best=0;prev=None
 for m in critical:length=length+1 if prev==m-1 else 1;prev=m;best=max(best,length)
 return {'critical':critical,'criticalMonths':len(critical),'longestCritical':best,'zeroMonths':zero,'minStock':min(x['actor']['res'][k] for x in rows),'lastStock':rows[-1]['actor']['res'][k],'lastNet':rows[-1]['actor']['inc'][k]}
for name in ['canonical','wait','farm_then_demolish','mine_then_farm']:
 d=json.loads((E/(name+'.json')).read_text());r={'arm':name,'bridge':{k:metric([x for x in d['monthly'] if 219<=x['month']<=224],k) for k in ['min','yiy','ala','ene','tuk']},'fullLocal':{k:metric(d['monthly'],k) for k in ['min','yiy','ala','ene','tuk']},'later':{k:metric([x for x in d['monthly'] if x['month']>=225],k) for k in ['min','yiy','ala','ene','tuk']},'at224':next(x['actor'] for x in d['monthly'] if x['month']==224),'at240':d['monthly'][-1]['actor'],'manual':d['actions']['manual'],'finished':d['actions']['finished'],'births':d['actions']['births']};out.append(r)
 print(name,'bridge', {k:(v['criticalMonths'],v['zeroMonths'],round(v['lastStock'],3)) for k,v in r['bridge'].items()},'full', {k:(v['criticalMonths'],v['zeroMonths'],round(v['lastStock'],3),round(v['lastNet'],3)) for k,v in r['fullLocal'].items()},'final buildings',r['at240']['colonies'][0]['b'])
(E/'SUMMARY.json').write_text(json.dumps(out,indent=2))
