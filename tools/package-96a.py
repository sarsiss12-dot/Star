#!/usr/bin/env python3
"""Package the validated 96A working tree without committing or publishing it."""
from pathlib import Path
import argparse, hashlib, json, zipfile
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path,default=root.parent/'stars-faz96a.zip')
args=parser.parse_args(); output=args.output.resolve()
assert root not in output.parents, 'Write the ZIP outside the source tree'
load=lambda name:json.loads((root/name).read_text())
s=load('tests/audit-96a/final-summary.json'); b=load('tests/audit-96a/final-browser-summary.json')
assert s['suites']==96 and s['pass']==5303 and s['fail']==0 and not s['skipped']
assert b['pass']==80 and b['fail']==0 and b['new']==14 and b['rerunExisting']==66
source=load('tests/audit-96a/source.json'); final=load('tests/audit-96a/github-final.json')
assert source['head']==final['ref']['object']['sha']=='60d90c9829adb377f27440f133cbe9c6b84a75bc'
assert not final['githubWritesPerformed'] and not final['localCommitsCreated']
for seed in [11,99,404]:
 c=load(f'tests/audit-96a/campaign/96a-{seed}.json')
 assert c['months']==120 and not c['failure'] and not c['negative'] and not c['ledgerErrors']
 for f,d in c['sourceSha'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==d, f
files=[]
for p in root.rglob('*'):
 rel=p.relative_to(root)
 if any(x in {'.git','__pycache__','node_modules'} for x in rel.parts):continue
 if not p.is_file():continue
 assert not p.is_symlink(),rel
 if p.suffix in {'.pyc','.zip'}:continue
 if rel.as_posix()!='RELEASE-MANIFEST.json':files.append(rel.as_posix())
files.sort()
manifest={
 'phase':'96A','game_build':'96a','save_version':8,'commerce_state_version':1,'pwa_cache':'stars-v96a',
 'source_github_release_commit':source['head'],'source_github_tree':source['tree'],
 'source_audit':'tests/audit-96a/source.json',
 'publication':{'repository':'sarsiss12-dot/Star','branch':'main','performed':False,'local_commit_created':False,'final_verified_remote_head':final['ref']['object']['sha'],'receipt':'Unpublished working-tree ZIP. No GitHub commit, push or branch mutation in this phase.'},
 'regression_evidence':{'suites':96,'pass':5303,'fail':0,'new_suites':2,'new_checks':48,'skipped':[],'summary':'tests/audit-96a/final-summary.json','browser_scenarios':80,'browser_new_scenarios':14,'browser_rerun_scenarios':66,'browser_fail':0,'browser_summary':'tests/audit-96a/final-browser-summary.json','campaigns':'tests/audit-96a/campaign-comparison.json','method':'Latest actual result per unique suite; initial failed runs retained, reruns not added.'},
 'limitations':['Physical Android/WebView/installed OS PWA and hardware FPS/thermal/memory acceptance not performed','Portrait trade panel accessible; original map rotate advice retained','Natural 100-system seeds 11 and 99 produced no contracts; 404 produced 3 contracts / 18 deliveries','Lower energy stock in all three final 96A campaigns; lower military power for seed 404; no causal shortage-cure claim','Save v8 old-to-new compatibility; new cargo saves require 96A or later','Unpublished source differences; GitHub main remains 95E.3'],
 'next_phase_started':False,'hash_algorithm':'sha256','inventory_rule':'Every ZIP file except RELEASE-MANIFEST.json itself. No self-referential commit or ZIP hash.',
 'files':{f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in files}}
(root/'RELEASE-MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 for f in sorted(files+['RELEASE-MANIFEST.json']):
  item=zipfile.ZipInfo(f,(2026,10,18,0,0,0)); item.compress_type=zipfile.ZIP_DEFLATED;item.external_attr=0o100644<<16
  archive.writestr(item,(root/f).read_bytes(),compresslevel=9)
with zipfile.ZipFile(output) as archive:
 assert archive.testzip() is None, 'ZIP CRC failure'
 assert len(archive.namelist())==len(set(archive.namelist()))==len(files)+1
 assert set(archive.namelist())==set(files)|{'RELEASE-MANIFEST.json'}
 assert json.loads(archive.read('RELEASE-MANIFEST.json'))==manifest
 for f,d in manifest['files'].items():
  assert hashlib.sha256(archive.read(f)).hexdigest()==d,f
  assert hashlib.sha256((root/f).read_bytes()).hexdigest()==d,f
print(json.dumps({'zip':str(output),'bytes':output.stat().st_size,'files':len(files)+1,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'crc':'passed','manifest':'passed','source_match':'passed','github_published':False},ensure_ascii=False))
