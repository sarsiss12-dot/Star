#!/usr/bin/env python3
"""Build deterministic source delivery from tracked/staged files; verify bytes and CRC."""
from pathlib import Path
import subprocess,json,hashlib,zipfile,argparse
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=root.parent/'stars-faz95e.zip');args=parser.parse_args()
files=sorted(set(subprocess.check_output(['git','-C',str(root),'ls-files','-z','--cached','--others','--exclude-standard']).decode().split('\0'))-{'' ,'RELEASE-MANIFEST.json'})
files=[f for f in files if (root/f).is_file()]
summary=json.loads((root/'tests/summary-95e.json').read_text());assert summary['fail']==0 and not summary['failed_suites']
manifest={'phase':'95E','game_build':'95e','save_version':8,'pwa_cache':'stars-v95e','source_github_release_commit':'62f1b313be9969ebd39206be19bdeac7acdf559e','source_zip':'stars-faz95d.zip','source_zip_sha256':'f01d36706897d49972d4250ae655ef40daf1c98d814d6f25d3721686a37b0f21','source_zip_crc_verified':True,'source_zip_manifest_entries_verified':2335,'source_audit':'tests/audit-95e/source.json','publication':{'repository':'sarsiss12-dot/Star','branch':'main','method':'fast-forward; no force push','commit_receipt':'Reported separately after publishing; embedding own commit or ZIP hash would be circular'},'regression_evidence':{'suites':summary['suites'],'pass':summary['pass'],'fail':summary['fail'],'summary':'tests/summary-95e.json','raw':'tests/audit-95e','method':'One full run, source-related followups, final module isolation tests and daily campaign followup. Unique latest suite results only.'},'modules':['news.js','inbox.js','construction.js','archive-ui.js'],'preserved_github_notes':{'path':'STARS-GELISTIRME-NOTLARI-2026-10-15.md','sha256':'565ba77766ae8ea30301a26d8b67e80be3210fca1cb493c6f6ddbad759249f21'},'unchanged_production':['map.js','combat.js','audio.js','manifest.json'],'limitations':['No physical Android acceptance','No real Chromium DOM/layout acceptance','Bounded archives and histories','Some ordinary law votes and special scenario event hooks remain future coverage','Remote construction uses existing space structures; colony building queue stays separate','Long campaign economic shortages remain'],'next_phase_started':False,'files':{f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in files}}
(root/'RELEASE-MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for f in sorted(files+['RELEASE-MANIFEST.json']):
  info=zipfile.ZipInfo(f,date_time=(2026,10,17,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,(root/f).read_bytes(),compresslevel=9)
with zipfile.ZipFile(args.output) as z:
 assert z.testzip() is None
 actual=set(z.namelist());assert actual==set(files)|{'RELEASE-MANIFEST.json'}
 for f,digest in manifest['files'].items():assert hashlib.sha256(z.read(f)).hexdigest()==digest,f
sha=hashlib.file_digest(args.output.open('rb'),'sha256').hexdigest()
print(json.dumps({'zip':str(args.output.resolve()),'sha256':sha,'bytes':args.output.stat().st_size,'files':len(files)+1,'crc':'passed','manifest':'passed'},ensure_ascii=False))
