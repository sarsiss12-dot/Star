from pathlib import Path
import json,hashlib,zipfile,subprocess
P=Path(__file__).resolve().parents[1];R=P.parent/'Star';root=P.parent/'phase96h62/control';m=json.loads((R/'RELEASE-MANIFEST.json').read_text());rows=[]
for n,sha in m['files'].items():
 assert hashlib.sha256((R/n).read_bytes()).hexdigest()==sha==hashlib.sha256((root/n).read_bytes()).hexdigest();rows.append({'file':n,'sha256':sha})
z=R/'releases/stars-faz96h61.zip';assert hashlib.sha256(z.read_bytes()).hexdigest()=='68b64e6cb918a106733568761b0a1a30b16e4550c96d2e26ebde56822ebcb6a0'
save=P.parent/'phase96h62/evidence/seed11-checkpoint217.save';prior=P.parent/'deliverables/stars-faz96h62-kanit.zip'
with zipfile.ZipFile(prior) as f:
 expected=json.loads(f.read('KANIT-MANIFEST.json'))['files']['seed11-checkpoint217.save']['sha256'];assert hashlib.sha256(save.read_bytes()).hexdigest()==expected
(P/'evidence/SOURCE.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'build':m['build'],'save':m['save_version'],'inputSHA256':expected,'inputDay':json.loads(save.read_text())['day'],'runtime19':rows,'canonicalZipSHA256':hashlib.sha256(z.read_bytes()).hexdigest(),'status':'PASS'},indent=2))
