B=/tmp/claude-0/-home-user-Star/30c40a47-ab4d-5adc-bfe4-309db2bf6d6f/scratchpad/bloc0; mkdir -p $B/camp
run(){ arm=$1 seed=$2 ai=$3 size=$4; R=$B/ctl; [ $arm = candidate ] && R=$B/cand; f=$B/camp/$arm-$seed-$ai.json; [ -s $f ] && return; t0=$(date +%s); node $B/blocs.cjs $R $arm $seed 240 $ai $size > $f.tmp 2>$f.err && mv $f.tmp $f; echo "$arm $seed $ai $(( $(date +%s)-t0 ))s $( [ -s $f ] && echo ok || echo FAIL)"; }
export -f run; export B
jobs=""; for ai in 8 16; do size=orta; [ $ai = 16 ] && size=s200; for seed in 11 23 404; do for arm in control placebo candidate; do jobs="$jobs $arm,$seed,$ai,$size"; done; done; done
echo $jobs | tr ' ' '\n' | xargs -P 4 -I{} bash -c 'IFS=, read a s n z <<< "{}"; run $a $s $n $z'
echo DONE
