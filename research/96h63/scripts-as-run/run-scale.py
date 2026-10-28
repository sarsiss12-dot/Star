from pathlib import Path
import subprocess,concurrent.futures,json
P=Path(__file__).resolve().parents[1]
jobs=[('orta',5,11,'sarmal',60),('ulu',11,11,'sarmal',60),('muazzam',13,11,'sarmal',60),('kozmik',16,11,'sarmal',60),('kozmik',20,11,'sarmal',60),('sinirsiz',8,11,'sarmal',60),('sinirsiz',20,11,'sarmal',120),('sinirsiz',20,23,'halka',120),('sinirsiz',20,404,'kume',120)]
def run(j):
 with (P/('evidence/scale-'+ '-'.join(map(str,j[:4]))+'.log')).open('w') as f:r=subprocess.run(['node',str(P/'scripts/scalability.js'),*map(str,j)],stdout=f,stderr=subprocess.STDOUT)
 print(j,r.returncode,flush=True);return {'job':j,'exit':r.returncode}
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as ex:rows=list(ex.map(run,jobs))
(P/'evidence/scalability-runs.json').write_text(json.dumps(rows,indent=2));assert all(x['exit']==0 for x in rows)
