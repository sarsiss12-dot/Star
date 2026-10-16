#!/usr/bin/env python3
"""Bounded follow-ups for the shared notify guard regression; not a full suite."""
import concurrent.futures,json,re,subprocess,time
from pathlib import Path
root=Path(__file__).resolve().parents[1]
logs=root/'tests/logs-94d1-followup';logs.mkdir(exist_ok=True)
names=['faz87d_offer_repetition_test.js','faz85e_event_inbox_continuity_test.js','faz94d1_war_visibility_test.js']
def run(name):
    start=time.monotonic()
    p=subprocess.run(['node',str(root/'tests'/name)],cwd=root,capture_output=True,text=True,timeout=180)
    text=p.stdout+p.stderr;(logs/(name+'.log')).write_text(text)
    m=re.search(r'GEÇEN:\s*(\d+)\s+KALAN:\s*(\d+)',text)
    row={'name':name,'exit':p.returncode,'durationMs':round((time.monotonic()-start)*1000),'pass':int(m[1]) if m else 0,'fail':int(m[2]) if m else 1,'details':'','log':'tests/logs-94d1-followup/'+name+'.log'}
    print(json.dumps(row),flush=True);return row
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(run,names))
(root/'tests/audit-94d1/followups.json').write_text(json.dumps(rows,indent=2)+'\n')
raise SystemExit(0 if all(r['exit']==0 and r['fail']==0 for r in rows) else 1)
