W=/tmp/claude-0/-home-user-Star/30c40a47-ab4d-5adc-bfe4-309db2bf6d6f/scratchpad/war0
run(){ arm=$1 seed=$2 t=$3 months=$4; R=$W/ctl; [ $arm = cand ] && R=$W/cand; f=$W/camp/$arm-$t-$seed.json; [ -s $f ] && return; t0=$(date +%s); node $W/wars.cjs $R $arm $seed $months 8 orta $t > $f.tmp 2>$f.err && mv $f.tmp $f; echo "$arm $t $seed $months $(( $(date +%s)-t0 ))s $( [ -s $f ] && echo ok || echo FAIL)"; }
export -f run; export W
{ for s in 11 23 404; do echo "ctl,$s,dengeli,240"; echo "cand,$s,dengeli,240"; echo "cand,$s,sakin,120"; echo "cand,$s,calkantili,120"; done; } | xargs -P 3 -I{} bash -c 'IFS=, read a s t m <<< "{}"; run $a $s $t $m'
echo ALLDONE
