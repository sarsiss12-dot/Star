from pathlib import Path
import json,hashlib,zipfile,shutil
P=Path(__file__).resolve().parents[1];E=P/'evidence';D=P.parent/'deliverables';R=P.parent/'Star'
for f in (P/'scripts').glob('*'):
 if f.is_file():out=E/'scripts-as-run'/f.name;out.parent.mkdir(exist_ok=True);shutil.copyfile(f,out)
shutil.copyfile(R/'research/96h63/README.md',E/'README.md')
files={}
for f in sorted(E.rglob('*')):
 if not f.is_file()or f.suffix in ['.png','.jpg','.jpeg','.webp','.pyc']or f.name=='KANIT-MANIFEST.json':continue
 b=f.read_bytes();files[f.relative_to(E).as_posix()]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
m={'phase':'96H.6.3','kind':'Research only; both candidates rejected; production96h61 preserved','files':files};(E/'KANIT-MANIFEST.json').write_text(json.dumps(m,ensure_ascii=False,indent=2));z=D/'stars-faz96h63-kanit.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED,9)as a:
 for n in [*files,'KANIT-MANIFEST.json']:a.write(E/n,n)
with zipfile.ZipFile(z)as a:
 assert a.testzip()is None;assert len(a.namelist())==len(files)+1
 for n,row in files.items():b=a.read(n);assert len(b)==row['bytes']and hashlib.sha256(b).hexdigest()==row['sha256']
row={'file':z.name,'bytes':z.stat().st_size,'sha256':hashlib.sha256(z.read_bytes()).hexdigest(),'crc':'PASS','manifestFiles':len(files),'members':len(files)+1}
(D/'KANIT-96H63-VERIFICATION.json').write_text(json.dumps(row,indent=2))
for p in [D/'RESEARCH-96H63.json',R/'RESEARCH-96H63.json']:
 d=json.loads(p.read_text());d['evidence']=row;p.write_text(json.dumps(d,ensure_ascii=False,indent=2))
print(json.dumps(row,indent=2))
