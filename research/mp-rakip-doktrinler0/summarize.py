"""Aynı insan taslaklarıyla çalıştırılan p46 ve p47 izlerini doğrula."""
import json
from pathlib import Path
import sys

evidence = Path(sys.argv[1])
output = []
for seed in (11, 99, 404):
    worlds = {}
    for mode in ("natural", "medium"):
        name = f"{mode}-{seed}.json"
        candidate = (evidence / "campaign" / name).read_bytes()
        p46 = (evidence / "campaign" / f"p46-{name}").read_bytes()
        if p46 != candidate:
            raise ValueError(f"{name} Save8, RNG veya üyelik ayrışması")
        worlds[mode] = json.loads(candidate)
    common_index = min(len(w["months"]) for w in worlds.values()) - 1
    for mode, world in worlds.items():
        months = world["months"]
        indices = sorted({*range(0, len(months), 30), len(months)-1})
        def summary(index):
            month = months[index]
            return {
                "month": index, "day": month["day"], "over": month["over"],
                "live": len(month["live"]), "largest": month["largest"],
                "percent": round(100 * month["largest"] / len(month["live"]), 2),
                "federations": month["feds"],
            }
        output.append({
            "seed": seed, "mode": mode, "equalMonths": len(months),
            "common": summary(common_index),
            "checkpoints": [summary(i) for i in indices],
        })

(evidence / "campaign" / "summary.json").write_text(json.dumps(output, indent=2) + "\n")
for row in output:
    month = row["common"]
    print(row["seed"], row["mode"], row["equalMonths"], month["month"],
          len(month["federations"]), f"{month['largest']}/{month['live']}")
