from pathlib import Path
import json,hashlib,collections,zipfile
R=Path(__file__).resolve().parents[1];A=R/'tests/audit96f3';P=A/'campaigns';SEEDS=[11,99,404,7,23,42,123,2026]
def read(p):return json.loads(p.read_text())
def episodes(d):
    out=collections.defaultdict(list)
    for i,rows in enumerate(d['monthly']):
        for e in rows:
            for r in ['ene','min','ala','tuk']:
                if not e['dead'] and e['income'][r]<0 and e['resources'][r]<-e['income'][r]*3:out[str(e['id'])+':'+r].append(i+1)
    return dict(out)
result=[]
for seed in SEEDS:
    x=read(P/f'96F3-{seed}.json');b=read(R/f'tests/audit96f1/campaigns/96F1-{seed}.json');c=read(P/f'comparison-96F3-{seed}.json')
    for n,h in c['sourceHashes'].items():assert hashlib.sha256((R/n).read_bytes()).hexdigest()==h
    pairs=[]
    for phase,d in [('96F1',b),('96F3',x)]:
        bypair=collections.Counter();loss=[]
        for e in d['forensics']:
            if e['kind']!='freight-end':continue
            contract=next(c for c in d['contracts'] if c['id']==e['contract']);pair='-'.join(map(str,sorted((contract['a'],contract['b']))))
            if e['status']=='delivered':bypair[pair]+=1
            else:loss.append(e)
        pairs.append(dict(phase=phase,deliveriesByPair=bypair,losses=loss,contractTimeline=[dict(day=c['born'],pair=[c['a'],c['b']],every=c['legs'][0]['every'],status=c['status']) for c in d['contracts']]))
    first=None
    for m,(before,after) in enumerate(zip(b['monthly'],x['monthly'])):
        for e,o in zip(before,after):
            if e['resources']!=o['resources']:
                first=dict(month=m+1,day=(m+1)*30,actor=e['id'],before=e['resources'],after=o['resources']);break
        if first:break
    spending={}
    for label,d in [('old',b),('next',x)]:
        z={}
        for e in d['forensics']:
            if e['kind'] not in ['queueBuilding','queueShip']:continue
            row=z.setdefault(e['kind'],dict(orders=0,paid=collections.Counter()));row['orders']+=1;row['paid'].update(e['paid'])
        spending[label]=z
    result.append(dict(seed=seed,old=c['old'],next=c['next'],firstMonthlyResourceDifference=first,critical=dict(old=episodes(b),next=episodes(x)),spending=spending,trade=pairs,researchNetSum=dict(old=sum(e['income']['ara'] for row in b['monthly'] for e in row if not e['dead']),next=sum(e['income']['ara'] for row in x['monthly'] for e in row if not e['dead'])),finalStocksAndRates=[dict(actor=e['id'],dead=e['dead'],stock=e['resources'],net=e['income']) for e in x['monthly'][-1]]))
(A/'campaign-analysis.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
u=read(A/'final/summary.json');browser=read(A/'browser/summary.json');repeat=read(P/'comparison-96F3-repeat-42.json')
assert u['ok'] and not u['skipped'] and u['suites']==121 and u['pass']==5813 and u['fail']==0
assert browser['pass']==25 and browser['fail']==0 and not browser['pageErrors']
assert all(repeat['determinism'].values())
assert all(not c['next']['invalidResources'] for c in result)
with zipfile.ZipFile(R.parent/'stars-faz96f1.zip') as z:
    preserved=['commerce.js','commerce-ui.js','diplomacy.js','map.js','combat.js','ui.js','inbox.js','construction.js','audio.js','economic-ledger.js','archive-ui.js','economy-ui.js','news.js','index.html','manifest.json']
    assert all((R/n).read_bytes()==z.read(n) for n in preserved)
    for s in [11,99,404]:
        n=f'tests/navy-95a-after-{s}.json';p=R/n
        if p.read_bytes()!=z.read(n):
            target=A/'generated-historical-test-output';target.mkdir(exist_ok=True);(target/p.name).write_bytes(p.read_bytes());p.write_bytes(z.read(n))
    assert (R/'main.js').read_text()==z.read('main.js').decode().replace("const BUILD_ID = '96f1'","const BUILD_ID = '96f3'")
runtime={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in R.glob('*') if p.is_file() and p.suffix in ['.js','.html','.css']}
proof=dict(unitSuites=u['suites'],unitPass=u['pass'],unitFail=u['fail'],browserPass=browser['pass'],browserFail=browser['fail'],browserPageErrors=browser['pageErrors'],physicalAndroid='NOT RUN',nativeCanvas='PASS in full suite and real browser',campaignSeeds=SEEDS,campaignMonths=120,reloadMonth=60,repeatSeed=42,determinism=repeat['determinism'],runtimeSha256=runtime,preservedRuntime=preserved,balanceRegressions=['404 deliveries 96 to 77','42 critical empire-months 0 to 12'],scope='Counts are named checks, not low-level assert invocations or historical results.')
(A/'verification-result.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in proof.items() if k not in ['runtimeSha256','preservedRuntime']},ensure_ascii=False,indent=2))
