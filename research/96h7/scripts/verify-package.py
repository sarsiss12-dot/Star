from pathlib import Path
import json,subprocess,shutil,hashlib
P=Path(__file__).resolve().parents[1];stage=P/'package'
shutil.copytree(stage/'control',stage/'candidate',dirs_exist_ok=True)
subprocess.run(['python',str(stage/'scripts/apply-candidate.py')],check=True)
j={'version':'candidate','tag':'portable-11-candidate','config':{'seed':11},'inputFile':str(stage/'inputs/seed11-month60.save'),'months':24,'out':str(P/'portable-replay')};f=P/'jobs/portable.json';f.write_text(json.dumps(j))
r=subprocess.run(['node',str(stage/'scripts/host.js'),str(f)],capture_output=True,text=True);(P/'portable-replay.log').write_text(r.stdout+r.stderr);assert r.returncode==0
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();a=sha(P/'evidence/candidate-local/campaign-11-candidate-final.save');b=sha(P/'portable-replay/portable-11-candidate-final.save');assert a==b
(P/'PORTABLE-VERIFICATION.json').write_text(json.dumps({'source':'evidence ZIP staged contents, fallback runtime-host','sameFinalSaveSHA256':a,'pass':True},indent=2));print('PASS standalone engine and exact final Save/RNG',a)
shutil.rmtree(stage/'candidate')
