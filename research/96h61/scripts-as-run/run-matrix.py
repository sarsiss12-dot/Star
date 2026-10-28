import subprocess,concurrent.futures,pathlib,json
P=pathlib.Path(__file__).resolve().parents[1]
jobs=[('control',s,240 if s in [11,23,42,404] else 120) for s in [404,11,23,42,7,99,123,2026]]+[('C2',s,120) for s in [11,7,23,42,99,123,404,2026]]
def run(j):
 label,seed,months=j;tag=f'{label}-M{months}-{seed}';out=P/'evidence'/label/f'M{months}-{seed}';out.mkdir(parents=True,exist_ok=True)
 with (out/'run.log').open('w') as f:
  p=subprocess.run(['node',str(P/'scripts/campaign.js'),str(P/label),tag,str(seed),str(months),str(out),'orta','default','-','60,107,113,119,125,131,133,146,149,160,218,219,223'],stdout=f,stderr=subprocess.STDOUT)
 if p.returncode:raise RuntimeError(str(out))
 d=json.loads((out/f'summary-{tag}-{seed}.json').read_text());print(json.dumps(d),flush=True)
 return {'label':label,'seed':seed,'months':months,'summary':d}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:r=list(ex.map(run,jobs))
(P/'evidence/matrix-summary.json').write_text(json.dumps(r,indent=2))
