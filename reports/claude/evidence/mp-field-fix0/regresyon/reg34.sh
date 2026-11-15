cd /home/user/Star
export STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium
R=/tmp/claude-0/-home-user-Star/30c40a47-ab4d-5adc-bfe4-309db2bf6d6f/scratchpad/reg34; mkdir -p $R/node
STARS_TEST_WORKERS=3 STARS_TEST_LOGS=$R/node node tests/run-all.js > $R/node.out 2>&1; echo "node $(tail -1 $R/node.out)"
git checkout -- tests/navy-95a-after-11.json tests/navy-95a-after-404.json tests/navy-95a-after-99.json tests/audit-95d/95c1-preservation/war-lines-on.png tests/audit96e1/identity-distribution.json 2>/dev/null; [ -d tests/audit96g2 ] && rm -rf $R/audit96g2 && mv tests/audit96g2 $R/audit96g2
for t in browser-mp-field-fix0-sp browser-war-coalition0 browser-field-war-siege0 browser-war-goals0 browser-rival-blocs0 browser-pregame-galaxy0 browser-bgreturn-galaxy0 browser-share-galaxy0 browser-sp-map-war browser-fed-fleet0-sp browser-mobile-hud0 browser-event-ux0; do STARS_OUTPUT=$R/$t timeout 1500 node tests/$t.cjs > $R/$t.log 2>&1; echo "$t exit $? $(grep -c '^PASS' $R/$t.log)/$(grep -c '^FAIL' $R/$t.log)"; done
for s in K W D G L S E F Q R N Z P; do pkill -f "research/mp1/server/relay.js"; sleep 2; if [ $s = P ]; then export MP8_P_DESYNC=1 MP8_P_MIN=15; fi; if [ $s = R ]; then export MP8_MONTHS=6; else unset MP8_MONTHS; fi; MP8_SCEN=$s STARS_OUTPUT=$R/mp8-$s timeout 3600 node tests/browser-mp8.cjs > $R/mp8-$s.log 2>&1; echo "mp8-$s exit $? $(grep -c '^PASS' $R/mp8-$s.log)/$(grep -c '^FAIL' $R/mp8-$s.log)"; done
echo DONE1
for t in browser-mp4 browser-mp71 browser-mp74 browser-mp75; do pkill -f "research/mp1/server/relay.js"; sleep 2; STARS_OUTPUT=$R/$t timeout 2400 node tests/$t.cjs > $R/$t.log 2>&1; echo "$t exit $? $(grep -c '^PASS\|^✓' $R/$t.log)/$(grep -c '^FAIL\|^✗' $R/$t.log) $(grep -E 'GEÇEN' $R/$t.log | tail -1)"; done
echo DONE2
