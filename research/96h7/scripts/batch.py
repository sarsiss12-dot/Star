from pathlib import Path
import json,subprocess,concurrent.futures
P=Path(__file__).resolve().parents[1];jobs=[]
for row in json.loads((P/'evidence/INITIAL-CONTROLS.json').read_text()):
 for v in ['historical','control']:jobs.append({'version':v,'tag':f"matched-{row['family']}-{v}-{row['seed']}",'config':{'seed':row['seed'],'originFamily':row['family']},'inputFile':row['input'],'months':12,'out':str(P/'evidence/matched')})
# One fresh exact-commit historical check, not a repeated8seed campaign.
jobs.append({'version':'historical','tag':'native-historical-11-120','config':{'name':'Matched 96F','race':'insan','traits':[],'size':'orta','shape':'sarmal','diff':'normal','seed':11,'ethics':{'mil':0,'aut':0,'mat':0,'ahl':0},'civics':[],'origin':'standart','ruins':'yok','crisis':'kapali','council':'kapali'},'months':120,'out':str(P/'evidence/native')})
for seed in [11,42,404]:jobs.append({'version':'control','tag':f'native-control-{seed}-24','config':{**jobs[-1]['config'],'seed':seed},'months':24,'out':str(P/'evidence/native')})
J=P/'jobs';J.mkdir(exist_ok=True)
def run(i,j):
 f=J/f'initial-{i}.json';f.write_text(json.dumps(j));log=P/f"evidence/{j['tag']}.log"
 with log.open('w')as out:r=subprocess.run(['node',str(P/'scripts/host.js'),str(f)],stdout=out,stderr=subprocess.STDOUT)
 print(j['tag'],r.returncode,flush=True);return {'tag':j['tag'],'exit':r.returncode}
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as ex:rs=list(ex.map(lambda x:run(*x),enumerate(jobs)))
(P/'evidence/initial-runs.json').write_text(json.dumps(rs,indent=2));assert all(r['exit']==0 for r in rs)
