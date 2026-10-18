#!/usr/bin/env python3
"""Deterministic 95E.3 source package; exact manifest and CRC, no self hash."""
from pathlib import Path
import subprocess,json,hashlib,zipfile,argparse
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=root.parent/'stars-faz95e3.zip');a=p.parse_args()
s=json.loads((root/'tests/summary-95e3.json').read_text());assert s['suites']==94 and s['pass']==5203 and s['fail']==0 and s['skipped']==[]
b=json.loads((root/'tests/audit-95e3/browser-summary.json').read_text());assert b['pass']==66 and b['fail']==0 and not b['pageErrors']
files=sorted(set(subprocess.check_output(['git','-C',str(root),'ls-files','-z','--cached','--others','--exclude-standard']).decode().split('\0'))-{'' ,'RELEASE-MANIFEST.json'})
assert all((root/f).is_file() and not (root/f).is_symlink() for f in files)
m={'phase':'95E.3','game_build':'95e3','save_version':8,'pwa_cache':'stars-v95e3','source_github_release_commit':'88a4d5d6435757d822f1885a8808e61d03a94397','source_github_tree':'e6901ac4fcae36fb321fb49a6cafd018927eac2f','source_audit':'tests/audit-95e3/source.json','publication':{'repository':'sarsiss12-dot/Star','branch':'main','method':'fast-forward; force=false; parent and expected HEAD guard','receipt':'Reported separately after publication; no circular own commit or ZIP hash'},'regression_evidence':{'suites':s['suites'],'pass':s['pass'],'fail':s['fail'],'skipped':s['skipped'],'summary':'tests/summary-95e3.json','browser_scenarios':b['pass'],'browser_fail':b['fail'],'browser_summary':'tests/audit-95e3/browser-summary.json','method':'Unique latest suite/scenario outcomes from this phase only; initial failures retained.'},'limitations':['No physical Android/WebView/installed PWA or GPU/FPS acceptance','Portrait Canvas testing masks existing rotate advice; no portrait gameplay acceptance','Original player save unavailable for historical unrelated issues','Existing long-campaign economic shortages remain outside maintenance scope'],'next_phase_started':False,'hash_algorithm':'sha256','inventory_rule':'Every ZIP entry except RELEASE-MANIFEST.json itself; no unlisted entries','files':{f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in files}}
(root/'RELEASE-MANIFEST.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(a.output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for f in sorted(files+['RELEASE-MANIFEST.json']):
  info=zipfile.ZipInfo(f,date_time=(2026,10,18,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,(root/f).read_bytes(),compresslevel=9)
with zipfile.ZipFile(a.output) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(files)|{'RELEASE-MANIFEST.json'}
 for f,digest in m['files'].items():assert hashlib.sha256(z.read(f)).hexdigest()==digest,f
r={'zip':str(a.output.resolve()),'sha256':hashlib.file_digest(a.output.open('rb'),'sha256').hexdigest(),'bytes':a.output.stat().st_size,'files':len(files)+1,'crc':'passed','manifest':'passed'}
print(json.dumps(r,ensure_ascii=False))
