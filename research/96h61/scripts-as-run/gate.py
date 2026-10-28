import pathlib,json
from metrics import stats
P=pathlib.Path(__file__).resolve().parents[1];out=[]
for s in [11,7,23,42,99,123,404,2026]:
 m=240 if s in [11,23,42,404] else 120
 a=json.loads((P/f'evidence/control/M{m}-{s}/control-M{m}-{s}-{s}.json').read_text());b=json.loads((P/f'evidence/C2/M120-{s}/C2-M120-{s}-{s}.json').read_text())
 out.append({'seed':s,'initialSaveEqual':a['initialSaveHash']==b['initialSaveHash'],'control':stats(a,120),'C2':stats(b)})
totals={label:{k:sum(x[label][k] for x in out) for k in ['critical','deliveries','techs','colonies','ships','power','demolitions','rebuild12','cycleNetMinerals']} for label in ['control','C2']}
gate=totals['C2']['critical']<=totals['control']['critical'] and totals['C2']['deliveries']>=.85*totals['control']['deliveries'] and all(x['initialSaveEqual'] for x in out)
r={'rows':out,'totals':totals,'gate120':'PASS' if gate else 'FAIL'};(P/'evidence/C2-gate120.json').write_text(json.dumps(r,indent=2));print(json.dumps(totals));print(r['gate120'])
