#!/bin/bash
# PERF.2 sıralı zamanlama: her kayıtta kontrol/A/B/A+B, 1 ay ısınma + 30 ay; tek süreç (gürültüyü azaltmak için sırayla).
cd /home/user/perf2
out=results/timing.jsonl; mkdir -p results
for sv in buyuk9-s11-m240 buyuk9-s404-m240 buyuk9-s11-m120 buyuk9-s404-m120 buyuk9-s11-m60 buyuk9-s404-m60 orta6-s11-m240 orta6-s404-m240 orta6-s11-m120 orta6-s404-m120 orta6-s11-m60 orta6-s404-m60; do
 for arm in control candA candB /home/user/Star; do
  WARM=1 node control/research/perf1/scripts/bench.cjs $arm saves/$sv.json 30 $(basename $arm) >> $out
 done
done
echo DONE >> results/timing.done
