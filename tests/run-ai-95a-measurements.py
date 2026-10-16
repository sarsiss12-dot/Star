import concurrent.futures,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
phase=sys.argv[1];source=sys.argv[2]
cases=[('11',11,120,'{}'),('99',99,120,'{}'),('404',404,120,'{}'),('99-long',99,240,'{"pirates":false}')]
def run(case):
 name,seed,months,opt=case;p=root/'tests/ai-95a'/phase
 p.mkdir(parents=True,exist_ok=True)
 proc=subprocess.run(['node','tests/measure-ai-95a.js',source,str(seed),str(p/(name+'.json')),str(months),opt],cwd=root,capture_output=True,text=True,timeout=150)
 (p/(name+'.log')).write_text(proc.stdout+proc.stderr);print(name,proc.returncode,proc.stdout.strip(),flush=True);return proc.returncode
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:codes=list(pool.map(run,cases))
raise SystemExit(max(codes))
