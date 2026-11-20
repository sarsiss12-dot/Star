"""Araştırma gözlemcilerini yayımlanmış p46 dünyasıyla karşılaştır."""
import gzip
import json
import subprocess
from pathlib import Path

BASE = "8b2558d33c1ab6306618ae3e64018766f5bfeeba"
RAW = Path(__file__).resolve().parent / "raw"
ROOT = RAW.parents[2]


def published(systems, ai, seed):
    path = f"reports/codex/evidence/ai-ikame1/campaign/aday-{systems}-{ai}-{seed}.json.gz"
    blob = subprocess.check_output(["git", "show", f"{BASE}:{path}"], cwd=ROOT)
    return {r["day"]: r for r in json.loads(gzip.decompress(blob))["months"]}


def compare(actual, expected, label):
    if actual != expected:
        raise ValueError(f"{label} uyuşmuyor: {actual} / {expected}")


result = {"source": BASE, "normal": []}
for seed in (11, 99, 404):
    with gzip.open(RAW / f"normal-{seed}.json.gz") as handle:
        observed = json.load(handle)
    reference = published(100, 9, seed)
    last_day = min(180 * 30, max(reference))
    reference = {day: row for day, row in reference.items() if day <= last_day}
    compare([r["day"] for r in observed["rows"]], list(reference), f"{seed} günler")
    for row in observed["rows"]:
        compare(row["rng"], reference[row["day"]]["rng"], f"{seed} gün {row['day']} RNG")
    for month, digest in observed["hashes"].items():
        compare(digest, reference[int(month) * 30]["sha256"], f"{seed} ay {month} Save8")
    result["normal"].append({
        "seed": seed, "matchingMonthlyRng": len(reference),
        "matchingSave8Sha256ByMonth": observed["hashes"],
    })

late = json.loads((RAW / "score500.json").read_text())
compare(late["sha256"], published(500, 16, 11)[5400]["sha256"], "500/16/11 ay 180")
compare(late["arms"][0]["before"], late["arms"][1]["before"], "500 iki kol başlangıcı")
result["matchedLateSave8Sha256"] = late["sha256"]
(RAW / "verification.json").write_text(json.dumps(result, indent=2) + "\n")
print("PASS · 3 tohum, 21 Save8, 540 aylık RNG gözlemi ve 500 sistemlik başlangıç kaydı")
