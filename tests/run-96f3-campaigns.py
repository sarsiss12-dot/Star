from pathlib import Path
import subprocess,json,concurrent.futures
R=Path(__file__).resolve().parents[1]; O=R/'tests/audit96f3'; SEEDS=[11,99,404,7,23,42,123,2026]
def run(seed):
    with (O/f'campaign-{seed}.log').open('w') as log:
        r=subprocess.run(['node','tests/campaign-96f3.js',str(seed)],cwd=R,stdout=log,stderr=subprocess.STDOUT)
    if r.returncode:raise RuntimeError(f'seed {seed}: see campaign log')
    d=json.loads((O/f'campaigns/comparison-96F3-{seed}.json').read_text()); print(json.dumps(dict(seed=seed,before=d['old']['deliveries'],after=d['next']['deliveries'],critical=d['next']['criticalEmpireMonths'])),flush=True);return d
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    records=list(pool.map(run,SEEDS))
(O/'campaign-comparisons.json').write_text(json.dumps(records,indent=2))
print('Eight final-source 120-month campaigns completed.',flush=True)
