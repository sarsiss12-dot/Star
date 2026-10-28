from pathlib import Path
import hashlib,json,zipfile,zlib,shutil
P=Path(__file__).resolve().parents[1];E=P/'evidence';stage=P/'package';stage.mkdir(exist_ok=True)
def copy(a,b):b.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(a,b)
for name in ['README.md','AI-KARAR-VERIMLILIK-96H7.md','campaign-deadline-rejected.patch']:copy(P/name,stage/name)
for f in (P/'scripts').glob('*'):
 if f.is_file():copy(f,stage/'scripts'/f.name)
for f in E.rglob('*'):
 if f.is_file()and f.suffix not in ['.png','.jpg','.webm']:copy(f,stage/'evidence'/f.relative_to(E))
source=json.loads((E/'SOURCE.json').read_text())
for v in ['control','historical']:
 for name in source['runtime19'][v]:copy(P/v/name,stage/v/name)
for seed in [11,42,404]:copy(P.parent/f'phase96h61/evidence/control/M240-{seed}/control-M240-{seed}-{seed}-checkpoint-60.save',stage/f'inputs/seed{seed}-month60.save')
copy(P.parent/'phase96h63/evidence/ulu-11-11-sarmal-60.save',stage/'inputs/100systems-11AI-seed11-month60.save')
for name in ['comparisons.json','totals.json']:copy(P/'prior/tests/audit96f4/pre-settlement-retry'/name,stage/'references'/('F4-pre-settlement-'+name))
rows=json.loads((E/'HISTORICAL-COMPARISON.json').read_text());provenance=[]
for r in rows:
 f=Path(r['currentRecord']);d=json.loads(f.read_text());selected={k:d[k]for k in ['auditPhase','protocol','sourceHashes','initial','monthlyIntegrity']};selected['monthly']=d['monthly'][:120];selected['monthlyIntegrity']=d['monthlyIntegrity'][:120];selected['note']='Selected first120monthly records; original hash refers to full original file, not this selected file.'
 out=stage/f"references/current120/seed{r['seed']}.json";out.parent.mkdir(exist_ok=True,parents=True);out.write_text(json.dumps(selected));provenance.append({'seed':r['seed'],'sourcePath':str(f),'sourceSHA256':hashlib.sha256(f.read_bytes()).hexdigest(),'selectedPath':str(out.relative_to(stage))})
(stage/'references/current120-provenance.json').write_text(json.dumps(provenance,indent=2))
files=[]
for f in sorted(stage.rglob('*')):
 if f.is_file()and f.name!='EVIDENCE-MANIFEST.json':
  b=f.read_bytes();files.append({'file':str(f.relative_to(stage)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'crc32':f'{zlib.crc32(b)&0xffffffff:08x}'})
(stage/'EVIDENCE-MANIFEST.json').write_text(json.dumps({'phase':'96H.7','kind':'research-only','files':files},indent=2))
out=P/'stars-faz96h7-kanit.zip'
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for f in sorted(stage.rglob('*')):
  if f.is_file():z.write(f,str(f.relative_to(stage)))
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None
 manifest=json.loads(z.read('EVIDENCE-MANIFEST.json'))
 for r in manifest['files']:
  b=z.read(r['file']);assert hashlib.sha256(b).hexdigest()==r['sha256'];assert len(b)==r['bytes'];assert f'{zlib.crc32(b)&0xffffffff:08x}'==r['crc32']
 metadata={'file':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'crc':'PASS','members':len(z.namelist()),'manifest':'PASS','manifestSHA256':hashlib.sha256(z.read('EVIDENCE-MANIFEST.json')).hexdigest()}
(P/'PACKAGE-96H7.json').write_text(json.dumps(metadata,indent=2));print(json.dumps(metadata))
