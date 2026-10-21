"""One real paired campaign process; peak RSS covers both runtimes in that process."""
import json, os, pathlib, resource, subprocess, time
root=pathlib.Path(__file__).resolve().parent.parent
out=root/'tests/audit96f'; start=time.perf_counter()
with (out/'campaign-performance-404.log').open('w') as log:
    p=subprocess.run(['node','tests/campaign-96f.js','404'],cwd=root,stdout=log,stderr=subprocess.STDOUT)
r=resource.getrusage(resource.RUSAGE_CHILDREN)
d={'status':'PASS' if p.returncode==0 else 'FAIL','exit':p.returncode,'seed':404,'scope':'Single child: canonical 96E.1 + 96F, two 120-month runs; peak RSS is combined process, not per-runtime isolated','elapsedSeconds':time.perf_counter()-start,'peakRssKiB':r.ru_maxrss,'userSeconds':r.ru_utime,'systemSeconds':r.ru_stime,'hostLoad':'Other regression tests may be running; wall-clock values are observations, not a benchmark'}
(out/'performance.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps(d));raise SystemExit(p.returncode)
