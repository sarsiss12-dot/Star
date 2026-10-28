import subprocess,pathlib,concurrent.futures
P=pathlib.Path(__file__).resolve().parents[1]
def run(c):
 seed,m=c;save=P/f'evidence/control/M240-{seed}/control-M240-{seed}-{seed}-checkpoint-{m}.save';out=P/f'evidence/timeline{seed}-{m}.json'
 with out.with_suffix('.log').open('w') as f:r=subprocess.run(['node',str(P/'scripts/timeline.js'),str(P/'control'),str(save),'7',str(out),'6'],stdout=f,stderr=subprocess.STDOUT)
 assert r.returncode==0,str(out);print(out.name,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:list(ex.map(run,[(404,107),(404,113),(404,119),(404,131),(11,218),(11,219)]))
