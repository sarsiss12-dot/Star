import pathlib,concurrent.futures,subprocess,json
from metrics import stats
P=pathlib.Path(__file__).resolve().parents[1]
def timeline(c):
 seed,month=c;save=P/f'evidence/control/M240-{seed}/control-M240-{seed}-{seed}-checkpoint-{month}.save';out=P/f'evidence/timeline{seed}-{month}.json'
 with out.with_suffix('.log').open('w') as f:r=subprocess.run(['node',str(P/'scripts/timeline.js'),str(P/'control'),str(save),'7',str(out),'6'],stdout=f,stderr=subprocess.STDOUT)
 assert r.returncode==0,str(out);return str(out)
def local(label):
 out=P/f'evidence/local100/{label}';out.mkdir(parents=True,exist_ok=True);save=pathlib.Path('/workspace/scratch/1a1a05115f49/audit96h6/control100/C100-11-checkpoint-52.save');tag='local100-'+label
 with (out/'run.log').open('w') as f:r=subprocess.run(['node',str(P/'scripts/campaign.js'),str(P/label),tag,'11','120',str(out),'buyuk','1',str(save)],stdout=f,stderr=subprocess.STDOUT)
 assert r.returncode==0,str(out);d=json.loads((out/f'{tag}-11.json').read_text());s=stats(d);(out/'metrics.json').write_text(json.dumps(s,indent=2));return {label:s}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
 for r in ex.map(timeline,[(404,107),(404,119),(404,131),(11,219)]):print(r,flush=True)
 for r in ex.map(local,['control','C2']):print(json.dumps(r),flush=True)
