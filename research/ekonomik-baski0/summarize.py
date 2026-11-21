"""Aggregate overlapping forecast windows separately from counted campaign months."""
import collections
import gzip
import json
import os
import pathlib
import statistics
import subprocess

here = pathlib.Path(__file__).resolve().parent
raw = here / "raw"
p47 = "8984b5107cae91016c41233409956e2cbb2523e2"
p46research = "885dd68eaa2108490d57ef0b91623c85ae40e6ce"
def read(name):
    return json.loads(gzip.decompress((raw / name).read_bytes()))
def published(ref, filename):
    return subprocess.check_output(["git", "show", f"{ref}:{filename}"], cwd=here)
def count(items):
    return dict(collections.Counter(items))
resources = ["ene", "min", "yiy", "tuk", "ala"]
out = {"forecast": {}, "politics": {}, "campaigns": {}, "pressureMonths": {}}
obs = read("forecast.json.gz")
for horizon in (6, 12, 24):
    rows = [v for v in obs if v["h"] == horizon]
    table = {}
    for r in resources:
        table[r] = {}
        for model, rate in (("simple", "current"), ("budget", "planned"), ("timed", "adjusted")):
            error, labels = [], []
            for v in rows:
                s = v["sums"][r]
                error.append(abs(s[model] - v["actual"][r]))
                stock = s["stock"] if model == "simple" else s["available"]
                warn = s[rate] < 0 and stock/-s[rate] < horizon+3
                actual = v["first"][r] != 0
                labels.append(("T" if actual == warn else "F") + ("P" if warn else "N"))
            table[r][model] = {"MAE": statistics.mean(error), "detection": count(labels)}
    out["forecast"][horizon] = {"n": len(rows), "sources": count(v["name"] for v in rows), "resources": table,
        "populationMAE": {k: statistics.mean(abs(v[k]-v["actualPop"]) for v in rows) for k in ("pop", "forecastPop")}}
decisions = []
for name in ["natural-11", "medium-99", "natural-404"]:
    decisions += read(f"politics-{name}.json.gz")
    monthly = read(name+".json.gz")
    out["pressureMonths"][name] = {r: sum(s["net"][r]<0 and s["stock"][r]<-3*s["net"][r] for m in monthly[1:] for s in m["states"]) for r in resources}
def first(d):
    return min(d["affinity"],key=lambda t:(-d["affinity"][t], t)) if d["affinity"] else None
military = [d for d in decisions if first(d) == "askeri"]
out["politics"] = {"reviews":len(decisions),"top":count(first(d) for d in decisions),
    "raiderAllyCount":count(len(d["raider"]["allies"]) for d in decisions if "raider" in d),
    "militaryResponses":count(x[4].split(" · ")[0] or "kabul" for d in military for x in d["responses"] if x[2]=="askeri"),
    "proposed":count(d["proposal"][0] for d in decisions if d.get("proposal"))}
for seed in (11,99,404):
    for mode in ("natural","medium"):
        name = f"{mode}-{seed}"
        months = json.loads(published(p47,f"reports/codex/evidence/mp-rakip-doktrinler0/campaign/{name}.json"))["months"]
        periods = {}
        for m in months:
            for f in m["feds"]:
                periods.setdefault(f["id"],[]).append((m["day"]/30,f["type"],f["members"]))
        last = months[178 if seed==404 else 180]
        out["campaigns"][name]={"end":months[-1]["day"]/30,"common":last,"feds":[
            {"id":i,"type":v[0][1],"observedMonths":v[-1][0]-v[0][0],"first":v[0][0],
             "memberLosses":sum(len(set(a[2])-set(b[2])) for a,b in zip(v,v[1:]))} for i,v in periods.items()]}
hist = json.loads(gzip.decompress(published(p47,"reports/codex/evidence/ai-ikame1/campaign/aday-100-9-404.json.gz")))["months"]
local = json.loads(gzip.decompress((pathlib.Path(os.getenv("STARS_WORK","/tmp/stars-pressure"))/"sp-100-9-404.json.gz").read_bytes()))["months"]
assert all(m["rng"] == hist[i]["rng"] and all(m["emps"][j]["res"] == hist[i]["emps"][j]["res"] for j in range(len(m["emps"]))) for i,m in enumerate(local))
out["sp404"]={"matchedMonths":len(local),"sha96":hist[96]["sha256"],"early":{}}
for r,firstmonth in (("yiy",95),("tuk",59)):
    series=[]
    for m in range(firstmonth-24,firstmonth+1):
        e=next(e for e in hist[m]["emps"] if e["id"]==2)
        series.append([m,e["res"][r],e["inc"][r],e["res"][r]/-e["inc"][r] if e["inc"][r]<0 else None])
    out["sp404"]["early"][r]=series
out["previousEvents"]=[]
for seed in [11,99,404]:
    d=json.loads(gzip.decompress(published(p46research,f"research/p46-diplomasi/raw/normal-{seed}.json.gz")))
    events=d["events"]
    arrivals=[e for e in events if e["kind"]=="arrival"]
    out["previousEvents"].append({"seed":seed,"arrivals":len(arrivals),"landed":{r:round(sum(e["qty"] for e in arrivals if e["resource"]==r),2) for r in resources},
        "deals":sum(e["kind"]=="deal" and e.get("ok",False) for e in events)})
(raw/"summary.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
