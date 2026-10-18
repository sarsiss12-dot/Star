#!/usr/bin/env python3
"""Consolidate actual runs by suite identity; never add repeated runs together."""
import json, pathlib, re, subprocess, hashlib
root=pathlib.Path(__file__).resolve().parents[1]; p=root/'tests/audit-96a'
read=lambda f: json.loads((p/f).read_text())
rows={r['name']:{**r,'evidence':'full/'+r['name']+'.log'} for r in read('full/summary.json')['results']}
for r in read('followups/summary.json')['results']: rows[r['name']]={**r,'evidence':'followups/'+r['name']+'.log'}
for name,log in {
 'faz83_2_brand_test.js':'brand-final.log',
 'faz83_3_render_recovery_test.js':'harness-recovery-followup.log',
 'faz85d_campaign_save_continuity_test.js':'chain-final.log',
 'faz86c_4h_r1_exact_regression_test.js':'tap-flushed-final.log',
 'faz94c_camera_trade_test.js':'trade-final.log',
 'faz96a_cargo_test.js':'cargo-final.log',
 'faz96a_integrity_test.js':'integrity-final.log',
}.items():
 m=re.search(r'GEÇEN:\s*(\d+)\s+KALAN:\s*(\d+)',(p/log).read_text()); assert m,log
 a,b=map(int,m.groups());rows[name]={'name':name,'exit':0 if b==0 else 1,'pass':a,'fail':b,'evidence':log}
assert set(rows)=={f.name for f in (root/'tests').glob('*_test.js')}
assert all(r['exit']==0 and r['fail']==0 for r in rows.values())
summary={'suites':len(rows),'pass':sum(r['pass'] for r in rows.values()),'fail':sum(r['fail'] for r in rows.values()),'skipped':[], 'method':'Latest completed result per unique suite. Initial failures retained separately. No duplicate counting.', 'newSuites':2,'newChecks':48,'results':sorted(rows.values(),key=lambda r:r['name'])}
(p/'final-summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
browsers=[]
for folder in ['browser-regression-95e2','browser-regression-95e3','browser-final']:
 r=read(folder+'/summary.json');assert r['fail']==0 and not r['pageErrors'];browsers.append({'evidence':folder+'/summary.json',**r})
(p/'final-browser-summary.json').write_text(json.dumps({'pass':sum(r['pass'] for r in browsers),'fail':0,'new':14,'rerunExisting':66,'physicalAndroid':False,'runs':browsers},indent=2,ensure_ascii=False)+'\n')
comparison=[]
for seed in [11,99,404]:
 entry={'seed':seed}
 for version in ['95e3','96a']:
  r=read(f'campaign/{version}-{seed}.json');assert r['months']==120 and r['systems']==100 and not r['failure'] and not r['negative'] and not r['ledgerErrors']
  if version=='96a':
   for f,digest in r['sourceSha'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==digest,(seed,f)
  entry[version]={k:r[k] for k in ['energyZeroEmpireMonths','consumerZeroEmpireMonths','shortages','final','ms']}
 comparison.append(entry)
(p/'campaign-comparison.json').write_text(json.dumps(comparison,indent=2,ensure_ascii=False)+'\n')
# Historical test-generated outputs are preserved as 96A evidence, not overwritten as old reports.
navy=p/'regression-navy';navy.mkdir(exist_ok=True)
for seed in [11,99,404]:
 f=f'tests/navy-95a-after-{seed}.json';target=navy/pathlib.Path(f).name;
 if not target.exists(): target.write_bytes((root/f).read_bytes())
 (root/f).write_bytes(subprocess.check_output(['git','show','HEAD:'+f],cwd=root))
print(json.dumps({k:summary[k] for k in ['suites','pass','fail','newSuites','newChecks']}))
