import pathlib,concurrent.futures,subprocess,json
from metrics import stats
P=pathlib.Path(__file__).resolve().parents[1]
cases=[('404',107,160,'control'),('404',107,160,'T1'),('11',218,240,'control'),('11',218,240,'T1')]
def run(c):
 seed,start,end,label=c;save=P/f'evidence/control/M240-{seed}/control-M240-{seed}-{seed}-checkpoint-{start}.save';out=P/f'evidence/local-{seed}/{label}';out.mkdir(parents=True,exist_ok=True);tag=f'local-{seed}-{label}'
 with (out/'run.log').open('w') as f:p=subprocess.run(['node',str(P/'scripts/campaign.js'),str(P/label),tag,seed,str(end),str(out),'orta','default',str(save)],stdout=f,stderr=subprocess.STDOUT)
 if p.returncode:raise RuntimeError(str(out))
 d=json.loads((out/f'{tag}-{seed}.json').read_text());s=stats(d);print(json.dumps({'seed':seed,'label':label,'stats':s}),flush=True);return {'seed':seed,'label':label,'initialSave':d['initialSaveHash'],'stats':s}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:r=list(ex.map(run,cases))
(P/'evidence/T1-local.json').write_text(json.dumps(r,indent=2))
