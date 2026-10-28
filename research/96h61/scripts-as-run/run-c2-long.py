import subprocess,pathlib,json
from metrics import stats
P=pathlib.Path(__file__).resolve().parents[1];result=[]
for seed in [11,23,42,404]:
 out=P/f'evidence/C2/M240-{seed}';out.mkdir(parents=True,exist_ok=True);tag=f'C2-M240-{seed}'
 with (out/'run.log').open('w') as f:r=subprocess.run(['node',str(P/'scripts/campaign.js'),str(P/'C2'),tag,str(seed),'240',str(out),'orta','default','-','107,131,218,219,223'],stdout=f,stderr=subprocess.STDOUT)
 if r.returncode:raise RuntimeError(str(out))
 a=stats(json.loads((P/f'evidence/control/M240-{seed}/control-M240-{seed}-{seed}.json').read_text()));b=stats(json.loads((out/f'{tag}-{seed}.json').read_text()))
 reasons=[]
 if b['deliveries']<a['deliveries']*.85:reasons.append('trade below 85% of current canonical seed control')
 if b['critical']>a['critical']:reasons.append('critical empire-months worse than current canonical seed control; stop conservatively')
 for k in ['techs','colonies','power']:
  if b[k]<a[k]*.85:reasons.append(k+' below 85% of canonical seed control')
 row={'seed':seed,'control':a,'C2':b,'rejectionReasons':reasons};result.append(row);print(json.dumps(row),flush=True)
 (P/'evidence/C2-long-decision.json').write_text(json.dumps({'rows':result,'complete':len(result)==4,'status':'FAIL' if reasons else 'IN PROGRESS' if len(result)<4 else 'PASS','notRun':[x for x in [11,23,42,404] if x not in [r['seed'] for r in result]]},indent=2))
 if reasons:break
