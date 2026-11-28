#!/usr/bin/env bash
set -eu
control=$(realpath "$1")
candidate=$(realpath "$2")
result=$(realpath -m "$3")
repo=$(cd "$(dirname "$0")/../.." && pwd)
mkdir -p "$result"
cat "$repo/research/ticaret-ai-sonkabul0/gunluk-ekonomi.js" "$repo/research/ticaret-temas0/temas-gozlemi.js" > "$result/gozlem.js"
export STARS_FAST_CAMPAIGN=1 STARS_OBSERVER="$result/gozlem.js"
case_run(){
  read -r seed months size count <<< "$1"
  for arm in kontrol aday; do
    root=$control
    if [ "$arm" = aday ]; then root=$candidate; fi
    STARS_SOURCE=$(git -C "$root" rev-parse HEAD) node "$repo/research/ticaret-kok-neden0/campaign.cjs" "$seed" "$months" "$result/$arm-$size-$seed.json" "$root" "$size" "$count" > "$result/$arm-$size-$seed.log" 2>&1
    echo "$arm $size $seed"
  done
}
# The controls and candidates for a seed run in the same worker slot.
for job in '11 120 s500 16' '11 240 ulu 9' '99 240 ulu 9' '404 240 ulu 9' '23 120 s500 16' '404 120 s500 16'; do
  case_run "$job" &
  if [ "$(jobs -pr | wc -l)" -ge 2 ]; then wait -n; fi
done
wait
