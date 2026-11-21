import gzip
import hashlib
import json
import os
from pathlib import Path
import subprocess

d=Path(__file__).resolve().parent
raw=d/"raw"
work=Path(os.getenv("STARS_WORK","/tmp/stars-pressure"))
def archive(name):
    return json.loads(gzip.decompress((raw/name).read_bytes()))
def source(name):
    return json.loads(subprocess.check_output(["git","show","8984b5107cae91016c41233409956e2cbb2523e2:reports/codex/evidence/mp-rakip-doktrinler0/campaign/"+name+".json"],cwd=d))["months"]
def check(ok,msg):
    if not ok: raise ValueError(msg)
verified={}
for key in ("natural-11","medium-99","natural-404"):
    ref=source(key)
    rows=archive(key+".json.gz")
    check(all(r["sha"]==ref[i]["save8"] and r["rng"]==ref[i]["rng"] for i,r in enumerate(rows)),key)
    verified[key]=len(rows)
for field in ("cb","appetite","default","choice","rng"):
    a=json.loads((raw/"C.json").read_text())["arms"]
    check(all(v[field]==a["original"][field] for v in a.values()),field)
ref=source("medium-99")
rows=archive("D-control-run.json.gz")["months"]
verified["Dreload"]={"rngMatches":sum(m["rng"]==ref[48+i]["rng"] for i,m in enumerate(rows)),"saveMatches":sum(m["hash"]==ref[48+i]["save8"] for i,m in enumerate(rows)),"total":len(rows)}
check(verified["Dreload"]["rngMatches"]==len(rows),"D RNG")
for arm,transfer in [("exchange",75),("low-bid",50)]:
    a=archive("E-"+arm+"-run.json.gz")
    [q]=[v for v in a["events"] if v["action"]=="exchange-receipt"]
    check(q["result"]["uygulandi"] and abs(q["after"]["energy"]-q["before"]["energy"]+transfer)<1e-7 and abs(q["after"]["food"]-q["before"]["food"]-50)<1e-7,arm)
    check(sum(s["states"][0]["crisis"]=="yiyecek" for s in a["months"][1:])==8,arm)
    check(all(not s["states"][1]["crisis"] for s in a["months"][1:]),arm+" donor")
for entry in json.loads((raw/"cpu.json").read_text())["fixtures"]:
    check(entry["sameRng"] and entry["sameSave"],entry["name"])
verified["sources"]={str(p.relative_to(work)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [work/"natural-11/36.save",work/"medium-99/48.save",work/"sp-100-9-404-m96.save",work/"medium-99/6.save"]}
(raw/"verification.json").write_text(json.dumps(verified,indent=2)+"\n")
print(json.dumps(verified))
