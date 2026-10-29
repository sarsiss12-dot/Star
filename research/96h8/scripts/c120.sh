#!/bin/bash
S=/tmp/claude-0/-home-user-Star/30c40a47-ab4d-5adc-bfe4-309db2bf6d6f/scratchpad/h8
arm=$1; seed=$2; months=$3
root=/home/user/Star; [ "$arm" != control ] && root=$S/arms/$arm
node /home/user/Star/research/96h61/replay.js $root $arm $seed $months $S/c$months/$arm-$seed orta default - > $S/c$months/$arm-$seed.log 2>&1; echo "$arm $seed exit $?"
