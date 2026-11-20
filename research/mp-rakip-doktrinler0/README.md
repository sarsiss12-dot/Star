# MP-RAKIP-DOKTRINLER.0 doğrulamasını tekrarlama

Komutları aday depo kökünden çalıştırın. `STARS_CONTROL_ROOT` p46 `8b2558d33c1ab6306618ae3e64018766f5bfeeba` çalışma ağacıdır. Chromium komutları ayrı kalıcı profiller, yerel relay, TLS vekili ve ayrı ağ yolları açar. Tarayıcı koşularını sırayla yürütün. Zamanlama sırasında kampanya ve diğer tarayıcı testlerini durdurun.

```sh
export STARS_CONTROL_ROOT=/path/to/p46
export NODE_PATH="$PWD/tests/node_modules"
export STARS_CHROMIUM_PATH=/usr/bin/chromium
export STARS_OUTPUT=/tmp/mp-rakip-kabul
mkdir -p "$STARS_OUTPUT"
MP8_SCEN=RD STARS_OUTPUT="$STARS_OUTPUT/full" node tests/browser-mp8.cjs
for seed in 11 99 404
do
  for mode in natural medium fixed
  do
    MP8_SCEN=RD MP8_RIVAL_MODE="$mode" MP8_RIVAL_SEED="$seed" \
      STARS_OUTPUT="$STARS_OUTPUT/$mode-$seed" node tests/browser-mp8.cjs || exit 1
  done
done
MP8_SCEN=R MP8_RIVAL_RESUME=1 MP8_MONTHS=6 MP89_R_STATE=1 node tests/browser-mp8.cjs
MP8_SCEN=O MP8_ONLY='^O(0|3|7) ' node tests/browser-mp8.cjs
MP8_SCEN=H node tests/browser-mp8.cjs
MP8_SCEN=J MP8_J_NATURAL=1 node tests/browser-mp8.cjs
```

## İz eşitliği

```sh
r=research/mp-rakip-doktrinler0
mkdir -p "$STARS_OUTPUT/campaign"
for seed in 11 99 404
do
  for mode in natural medium
  do
    run="$mode-$seed"
    cfg="$STARS_OUTPUT/$run/RD/setup-$seed-$mode.json"
    node "$r/campaign.cjs" "$PWD" host "$cfg" "$STARS_OUTPUT/campaign/$run.json"
    node "$r/campaign.cjs" "$STARS_CONTROL_ROOT" p46-reference "$cfg" "$STARS_OUTPUT/campaign/p46-$run.json"
  done
done
python3 "$r/summarize.py" "$STARS_OUTPUT"
```

Karşılaştırma p46 yerel motora aynı insan taslaklarını geçirir. Orta referansında aralık doğrudan SP kurulum girdisine eklenir. İki kol da MP host çekirdeği üzerinden koltukları atar ve gözlem belleğini günceller. Kampanyada iki insan koltuğu eylemsizdir. Chromium, başlangıcı ve arayüzü ayrıca doğrular.

## Save8 ve performans

```sh
export CHECKPOINT_DIR="$(mktemp -d)"
for month in 120 180
do
  gzip -dc "$STARS_CONTROL_ROOT/reports/codex/evidence/ai-ikame1/chromium/500-16-11-m$month.save.gz" \
    > "$CHECKPOINT_DIR/500-16-11-m$month.save"
done
for key in 100-9-11-m120 500-16-11-m30
do
  gzip -dc "$STARS_CONTROL_ROOT/reports/codex/evidence/perf-sinir0/$key.save.gz" > "$CHECKPOINT_DIR/$key.save"
done
node research/perf-sinir0/focused.cjs
node research/perf-sinir0/chromium.cjs compare 100-9-11-m120 500-16-11-m120 500-16-11-m180
STARS_CHECKPOINTS=180 STARS_OUTPUT="$CHECKPOINT_DIR" \
  node research/ai-ikame0/campaign.cjs "$STARS_CONTROL_ROOT" aday 500 16 11 180
node tests/mp_rakip_doktrinler0_test.cjs "$CHECKPOINT_DIR/aday-500-16-11-m180.save"
```

Üyelik puanı deneyi için doğal p46 180. ay Save8 SHA-256 değeri `6373a93fba5c0cd94a15ffc7ffbad4ca854977bccc325d454f0474201cb119ea`. Zamanlama girdileri yayımlanmış p46 Chromium girdileridir. Bunların özetleri ayrı JSON'larda bulunur. [Rapor ve ham kanıtlar](../../reports/codex/MP-RAKIP-DOKTRINLER0-SONUC.md)
