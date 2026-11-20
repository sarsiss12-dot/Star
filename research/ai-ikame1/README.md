# AI-IKAME.1 doğrulaması

`STARS_P44` için `0559cfbeaac4cd4f458ccfaab23c3228de82b1cd`, `STARS_P45` için `4f07699be811d5d300616ec6cf4de9171c97286e` ayrı çalışma ağaçlarını kullanın. Aşağıdaki komutlar aday ağacın kökünden çalışır. `STARS_EVIDENCE` mutlak çıktı yoludur.

```bash
export STARS_FINANCE=all
for seed in 11 99 404; do
  STARS_OUTPUT="$STARS_EVIDENCE/accepted" node research/ai-ikame0/campaign.cjs "$PWD" aday 100 9 "$seed" 240
done
STARS_OUTPUT="$STARS_EVIDENCE/accepted" node research/ai-ikame0/campaign.cjs "$PWD" aday 500 16 11 240
export STARS_OUTPUT="$STARS_EVIDENCE/diagnosis"
STARS_FINANCE=5 STARS_CHECKPOINTS=149,153,161 node research/ai-ikame0/campaign.cjs "$STARS_P44" p44 100 9 99 212
STARS_FINANCE=5 STARS_CHECKPOINTS=149,153,161 node research/ai-ikame0/campaign.cjs "$STARS_P45" p45 100 9 99 212
node research/ai-ikame0/campaign.cjs "$STARS_P44" p44 500 16 11 240
node research/ai-ikame0/campaign.cjs "$STARS_P45" p45 500 16 11 240
python3 -B research/ai-ikame1/compare.py "$STARS_EVIDENCE" reports/codex/evidence/ai-ikame0
```

Kriz tekrarlarında `STARS_FROM="$STARS_OUTPUT/p45-100-9-99-m149.save"` ve `STARS_FINANCE=5` kullanılır. Komutu p45 kökünde `intact` etiketiyle, ardından `STARS_RECOVERY_PROBE=omit-strategic-preview` ve `STARS_RECOVERY_PROBE=keep-foundry` ile yürütün. Gerçek aday kararını ölçmek için aday kökünde `guard` etiketi ve boş `STARS_RECOVERY_PROBE` kullanın. Her komutun son parametreleri `100 9 99 212` olur.

Kriz kararında `STARS_REPLAY_LOCATION='{"actor":5,"system":95,"planet":0}' STARS_REPLAY_MONTHS=44 node research/ai-ikame1/recovery-replay.cjs "$STARS_P45" "$PWD" "$STARS_OUTPUT/p45-100-9-99-m149.save"` aynı kararı, yıkım iadesini ve sonraki ödeme kesintisini karşılaştırır. 99. tohum kampanyasının ilk ayrışması için `STARS_CHECKPOINTS=129` ile p45 koşusunu 129. aya kadar yürütün. Tekrar komutunda 129. ay kaydı ve `STARS_REPLAY_LOCATION='{"actor":11,"system":34,"planet":0}'` kullanılır. Varsayılan sekiz aylık iz ödemeyi kapsar.

Chromium ölçümlerinde `CHECKPOINT_DIR` ve `STARS_CONTROL_ROOT` için [PERF-SINIR.0 yönergesindeki](../perf-sinir0/README.md) sabit girişleri kullanın. `profile-replacement-cost` kipi her kontrolün çağrı adedini ve iç çağrıları da içeren süreyi üç tam ay boyunca kaydeder. `compare-replacement-cost` kipi her kol için 24 ay örneği ve her örnekte Save8/RNG eşitliği ister. P45 ve aday profilleri için `STARS_CANDIDATE_ROOT` ile ilgili kökü seçin. Chromium çalışırken kampanya süreçlerini duraklatın. İki geç oyun girdisi `500-16-11-m120` ve `500-16-11-m180` olur.

Alaşım akışında `ship-order.paid` sipariş anındaki gerçek ödemeyi, `stock-alloy` üretim dışı defter hareketlerini gösterir. `alloy.lines` gerçek gelir hesabını, `upkeep` mevcut filo bakımını gösterir. `compare.py` ortak ayları alır. Kaynak bazında aralıksız kritik koşullar, negatif gelir ve üç aylık açığı karşılayamayan stokla hesaplanır.
