from pathlib import Path
import json,subprocess,concurrent.futures
P=Path(__file__).resolve().parents[1];jobs=[]
for seed in [11,42,404]:
 for variant in ['base','holdLow','holdHigh','reviewLow','reviewHigh','forceLow','forceHigh','civilianFirst']:
  jobs.append({'version':'control','tag':f'sensitivity-{seed}-{variant}','config':{'seed':seed},'inputFile':str(P.parent/f'phase96h61/evidence/control/M240-{seed}/control-M240-{seed}-{seed}-checkpoint-60.save'),'months':12,'variant':variant,'out':str(P/'evidence/sensitivity')})
def run(j):
 f=P/'jobs'/(j['tag']+'.json');f.write_text(json.dumps(j))
 with(P/'evidence'/(j['tag']+'.log')).open('w')as o:r=subprocess.run(['node',str(P/'scripts/host.js'),str(f)],stdout=o,stderr=subprocess.STDOUT)
 print(j['tag'],r.returncode,flush=True);return {'tag':j['tag'],'exit':r.returncode}
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as ex:rows=list(ex.map(run,jobs))
(P/'evidence/sensitivity-runs.json').write_text(json.dumps(rows,indent=2));assert all(x['exit']==0 for x in rows)
