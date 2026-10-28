from pathlib import Path
import json,subprocess,concurrent.futures
P=Path(__file__).resolve().parents[1]
jobs=[{'version':v,'tag':f'campaign-{seed}-{v}','config':{'seed':seed},'inputFile':str(P.parent/f'phase96h61/evidence/control/M240-{seed}/control-M240-{seed}-{seed}-checkpoint-60.save'),'months':24,'out':str(P/'evidence/candidate-local')}for seed in [11,42,404]for v in ['control','candidate']]
def run(j):
 f=P/'jobs'/(j['tag']+'.json');f.write_text(json.dumps(j))
 with(P/'evidence'/(j['tag']+'.log')).open('w')as o:r=subprocess.run(['node',str(P/'scripts/host.js'),str(f)],stdout=o,stderr=subprocess.STDOUT)
 print(j['tag'],r.returncode,flush=True);return {'tag':j['tag'],'exit':r.returncode}
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as ex:rows=list(ex.map(run,jobs))
(P/'evidence/candidate-local-runs.json').write_text(json.dumps(rows,indent=2));assert all(x['exit']==0 for x in rows)
