#!/usr/bin/env python3
"""Summaries from replayed p51 campaigns, audits and committed historical measurements."""
import collections
import glob
import gzip
import json
import math
import pathlib
import statistics
import sys

root = pathlib.Path(sys.argv[1])
perf = pathlib.Path('reports/claude/evidence/ticaret-tamamlama0/perf')
resources = ['ene', 'min', 'yiy', 'ala', 'tuk']
floor = [80, 60, 40, 60, 40]
crisis_name = {'ene': 'enerji', 'min': 'mineral', 'yiy': 'yiyecek'}

def load(path):
    with (gzip.open(path, 'rt') if str(path).endswith('.gz') else open(path)) as fp:
        return json.load(fp)

def metric(xs):
    return None if not xs else [len(xs), round(statistics.mean(xs), 2), round(statistics.median(xs), 2), round(min(xs), 2), round(max(xs), 2)]

def p95(xs):
    xs = sorted(xs)
    x = (len(xs)-1)*.95
    return xs[int(x)] + (x-int(x))*(xs[math.ceil(x)]-xs[int(x)])

def campaigns(pattern):
    data = {}
    for f in sorted(root.glob(pattern)):
        d = load(f)
        months=d['months']
        result={}
        receipt_by_id={v['id']:v for v in d['receipts']}
        signed={n['id']:n for n in d['deals'] if n.get('id') is not None}
        signed={i:n for i,n in signed.items() if any(x['t']=='freight' for x in n['give']+n['want'])}
        r=[v for v in d['receipts'] if v['contract'] in signed]
        l=[v for v in d['loads'] if v['contract'] in signed]
        cycles=collections.defaultdict(list)
        for v in r: cycles[(v['contract'],v['cycle'])].append(v)
        gains={}
        everyone={}
        for (contract,cycle),vs in cycles.items():
            if len(vs)!=2: continue
            ids={v['from'] for v in vs}
            values={i:sum(v['valueReceiver'] if v['to']==i else -v['valueSource'] for v in vs) for i in ids}
            tag='positiveBoth' if min(values.values())>0 else 'negativeBoth' if max(values.values())<0 else 'oneOrZero'
            gains[(contract,cycle)]=(max(v['day'] for v in vs),tag,values)
            if tag=='positiveBoth':
                for v in vs:
                    everyone[v['to']]=min(everyone.get(v['to'],math.inf),max(x['day'] for x in vs))
        for a,b in [(0,120),(120,180),(180,240)]:
            lo,hi=a*30,b*30
            m=[t for t in months if lo<t['day']<=hi]
            rr=[v for v in r if lo<v['day']<=hi]
            ll=[v for v in l if lo<v['day']<=hi]
            res={}
            for i,k in enumerate(resources):
                by=[(e['stocks'][i],e['inc'][i],e) for t in m for e in t['states']]
                res[k]=dict(count=len(by),stock=metric([x[0] for x in by]),net=metric([x[1] for x in by]),
                    reserveStress=sum(stock<floor[i] and net<0 for stock,net,_ in by),
                    lowRunway=sum(net<0 and stock < (-3*net) for stock,net,_ in by),
                    crisis=sum(k in crisis_name and e['crisis']==crisis_name[k] for _,_,e in by),
                    consumerShortage=sum(k=='tuk' and e['shortage'] for _,_,e in by))
            result[f'{a}-{b}']=dict(samples=len(m),signed=sum(lo<n['day']<=hi for n in signed.values()),
                loads=len(ll),delivery=sum(v['status']=='delivered' for v in rr),long=sum(v['hops']>3 and v['status']=='delivered' for v in rr),
                lost=sum(v['lost'] for v in rr),quantity={k:round(sum(v['delivered'] for v in rr if v['r']==k),1) for k in resources},
                crises=sum(e['crisis'] is not None for t in m for e in t['states']),
                legsKeepingStockAboveThreeMonths=sum(v['inc']<0 and v['before']< -3*v['inc']<=v['before']+v['delivered'] for v in rr),
                outcomes=collections.Counter(tag for day,tag,_ in gains.values() if lo<day<=hi),resources=res)
        ph={}
        for fdate in ['need','reachable']:
            ph[fdate]=metric([x[fdate]/30 for x in d['first'].values() if fdate in x])
        ph['sign']=min((v['day']/30 for v in signed.values()),default=None)
        ph['load']=min((v['day']/30 for v in l),default=None)
        ph['firstReceipt']=min((v['day']/30 for v in r if v['delivered']>0),default=None)
        ph['firstPositiveBoth']=min(everyone.values(),default=None)
        ph['positiveByState']=everyone
        delays=[v['day']-x['day'] for x in l if (v:=receipt_by_id.get(x['id'])) and v['status']=='delivered']
        ph['loadToReceiptDays']=metric(delays)
        first_load={}
        for x in l: first_load.setdefault(x['contract'],x['day'])
        ph['signatureToLoadDays']=metric([t-signed[i]['day'] for i,t in first_load.items()])
        ph['knownPactToSignDays']=metric([v['day']-v['pact'] for v in signed.values() if v['pact'] is not None])
        ph['firstTransit']=next((x for x in d['notes'] if x[3]=='trade-transit-granted'),None)
        notes=collections.Counter(n[3] for n in d['notes'])
        political=collections.Counter(n[4] for n in d['notes'] if n[3]=='trade-political')
        cooldown=collections.Counter(n[4] for n in d['notes'] if n[3]=='trade-cooldown')
        data[str(d['seed'])]=dict(windows=result,phases=ph,notes=notes,political=political,cooldown=cooldown,
            lastDay=months[-1]['day'],actualResDeals=sum(any(x['t']=='res' for x in n['give']+n['want']) for n in d['deals']),
            end=d['end'], rng=months[-1]['rng'])
    return data

def corridors(pattern):
    rows=collections.defaultdict(list)
    for f in root.glob(pattern):
        r=load(f)
        rows['500' if r['systems']==500 else '100'].append(r)
    result={}
    for size, rs in rows.items():
        all_pairs=[x for r in rs for x in r['pairs']]
        all_rows=[(r,x,next(p for p in r['pairs'] if p['id']==x['id'])) for r in rs for x in r['rows']]
        totals=collections.Counter()
        for p in all_pairs:
            for k,flag in [('contactsAndPolitical',p['canTrade']),('pact',p['pact']),('outboundPort',p['origins']>0),
                           ('inboundPort',p['targets']>0),('bothPorts',p['origins']*p['targets']>0),
                           ('pactBothPorts',p['pact'] and p['origins']*p['targets']>0),
                           ('atLeastOneExportNeed',p['matching']),('cooldown',p['cool']),('existing',p['existing'])]:
                totals[k]+=bool(flag)
        geo={k:sum(x['geo'][k] for _,x,_ in all_rows) for k in ['known','absent','open','gap']}
        main={'worlds':len(rs),'statePairs':len(all_pairs),'eligibleStatePairs':len(all_rows),'geo':geo,'gates':totals}
        for mode in ['H0','H1','H2','H3','H5','noFed']:
            gains = [(r,x,p,x['arms'][mode]['best']) for r,x,p in all_rows if x['arms'][mode]['best'] is not None]
            main[mode]={'bilateralStatePairs':len(gains),'pact':sum(p['pact'] for _,_,p,_ in gains),
                'positiveWithNoCooldownNoExisting':sum(p['pact'] and not p['cool'] and not p['existing'] for _,_,p,_ in gains),
                'hops':metric([len(b['fx'])-1 for _,_,_,b in gains]),'days':metric([max(b['days']) for _,_,_,b in gains]),
                'weakSideScore':metric([b['score'] for _,_,_,b in gains]),
                'positiveNew':sum(x['arms']['H0']['best'] is None for _,x,_,b in gains),
                'lateAtLeastOne':sum(any(b['estimated']['startLate']) for _,_,_,b in gains),
                'portsPass':{k:sum(x['arms'][mode]['tally'][k] for _,x,_ in all_rows) for k in ['available','safe','terms','eligible']}}
        h0=[(r,x,p,x['arms']['H0']['best']) for r,x,p in all_rows if x['arms']['H0']['best'] is not None]
        main['H6']={'canonicalQuoteAndBothAccept':sum(x['quote']['ok'] and x['quote']['values']==['kabul','kabul'] for _,x,_,b in h0),
            'portChoiceMisses':[[r['seed'],r['day'],x['id'],b['score'],p,x['quote']] for r,x,p,b in h0 if x['one'] is None or x['one']['best'] is None],
            'quoteFailures':collections.Counter(reason for _,x,_,_ in h0 for reason in x['quote']['reason']),
            'cooldownEligible':[[r['seed'],r['day'],x['id'],b['score']] for r,x,p,b in h0 if p['cool'] and p['pact'] and not p['existing'] and x['quote']['ok']]}
        result[size]=main
    return result

def historical():
    out={}
    for k in ['100-9-11-m120','500-16-11-m120','500-16-11-m180']:
        row={}
        for glob_pattern in ['aa*','run*']:
            files=list(perf.glob(f'{glob_pattern}/{k}.json'))
            samples=[load(f) for f in files]
            arms=[[s['ms'] for d in samples for s in d['samples'][n]] for n in (0,1)]
            row[glob_pattern]={'n':len(arms[0]),'p95':[p95(s) for s in arms],'p50':[statistics.median(s) for s in arms],
                'runDeltas':{f.parent.name:round(d['delta'],2) for f,d in zip(files,samples)},'equal':all(d['equal'] for d in samples)}
        out[k]=row
    f2={}
    for p in pathlib.Path('reports/claude/evidence/ticaret-ai0/funnel').glob('f2-*.json'):
        d=load(p)['T']
        f2[p.stem]={'ports':d['pairs'],'geography':d['geo'],'counts':d['cls']}
    f3={}
    for p in pathlib.Path('reports/claude/evidence/ticaret-ai1/funnel').glob('f3-*.json'):
        d=load(p)
        f3[p.stem]={'calls':d['calls'],'made':d['made'],'reason':d['reason'],'value':d['vrQ']}
    return {'perf':out,'f2':f2,'f3':f3}

summary={'campaigns':campaigns('camp-*.json*'),'corridors':corridors('koridor-*.json'),'historical':historical()}
print(json.dumps(summary,ensure_ascii=False,indent=2))
