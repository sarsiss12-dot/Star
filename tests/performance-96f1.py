"""One final 120-month replay measures process RSS and long determinism."""
import pathlib,json,subprocess,resource,time
root=pathlib.Path(__file__).resolve().parent.parent;out=root/'tests/audit96f1';p=out/'campaigns/96F1-404.json';before=json.loads(p.read_text());started=time.perf_counter()
with (out/'performance-replay-404.log').open('w') as log:r=subprocess.run(['node','tests/campaign-96f1.js','404','candidate'],cwd=root,stdout=log,stderr=subprocess.STDOUT)
after=json.loads(p.read_text());usage=resource.getrusage(resource.RUSAGE_CHILDREN)
fields=['saveHash','rng','trace','monthly'];checks={k:before[k]==after[k] for k in fields};ok=r.returncode==0 and all(checks.values())
proof={'status':'PASS' if ok else 'FAIL','exit':r.returncode,'seed':404,'months':120,'determinism':checks,'saveHash':after['saveHash'],'elapsedSeconds':time.perf_counter()-started,'peakRssKiB':usage.ru_maxrss,'userSeconds':usage.ru_utime,'systemSeconds':usage.ru_stime,'scope':'One Node process: final120-month runtime plus loaded canonical JSON and full forensic trace. Concurrent regression load; not Android or an isolated comparative benchmark.'}
(out/'performance.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n');print(json.dumps(proof));raise SystemExit(0 if ok else 1)
