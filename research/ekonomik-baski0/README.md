# EKONOMIK-BASKI.0 deneylerini tekrarlama

Depo kökünden çalıştırın. p47 çalışma ağacında tam kanıt dosyaları ve p46 diplomasi araştırmasının Git nesnesi bulunmalı. Seyrek checkout kullanıyorsanız STARS_EVIDENCE_ROOT değişkenini aynı p47 SHA’sını içeren tam checkout'a ayarlayın. Kurulum girdileri ve aylık referanslar o kökün reports/codex/evidence/mp-rakip-doktrinler0 dizininden okunur. Süre ölçümünü diğer süreçler bittikten sonra çalıştırın.

```sh
git fetch origin codex/stars-p46-diplomasi-arastirma
r=research/ekonomik-baski0
export STARS_WORK=/tmp/stars-pressure
export STARS_EVIDENCE_ROOT="$PWD"
mkdir -p "$STARS_WORK"
node "$r/sample.cjs" 11 natural 60
node "$r/sample.cjs" 99 medium 54
node "$r/sample.cjs" 404 natural 100
STARS_CHECKPOINTS=96 STARS_OUTPUT="$STARS_WORK" node research/ai-ikame0/campaign.cjs "$PWD" sp 100 9 404 96
for m in 120 180; do
  git show "8984b51:reports/codex/evidence/ai-ikame1/chromium/500-16-11-m$m.save.gz" | gzip -dc > "$STARS_WORK/500-16-11-m$m.save"
done
for pair in 'A control' 'A full' 'B reserve' 'B shock' 'D control' 'D pressure' 'E control' 'E weak' 'F militarist' 'F tuccar' 'F pasifist'; do
  set -- $pair
  node "$r/replay.cjs" "$1" "$2" probe || exit 1
  node "$r/replay.cjs" "$1" "$2" run || exit 1
done
for arm in relations food shared; do node "$r/replay.cjs" D "$arm" run || exit 1; done
for arm in exchange low-bid; do node "$r/replay.cjs" E "$arm" run || exit 1; done
sha256sum "$r/raw/E-exchange-run.json.gz" > "$STARS_WORK/receipt-before"
node "$r/replay.cjs" E exchange run
sha256sum -c "$STARS_WORK/receipt-before"
node "$r/forecast.cjs"
node "$r/targets.cjs" "$STARS_WORK/500-16-11-m180.save"
node "$r/land.cjs" "$STARS_WORK/500-16-11-m180.save"
node "$r/species.cjs"
node "$r/edges.cjs"
node "$r/load-audit.cjs"
export NODE_PATH="$PWD/tests/node_modules"
node "$r/bench.cjs" "$STARS_WORK/500-16-11-m120.save" "$STARS_WORK/500-16-11-m180.save" "$STARS_WORK/sp-100-9-404-m96.save"
python3 "$r/summarize.py"
python3 "$r/verify.py"
```

* sample.cjs özgün p47 MP kampanya düzeneğini çalıştırır. Her üretim serileştirmesinde aylık SHA-256 ve RNG'yi arşive karşı doğrular. politics.js yalnız gerçek siyasi çağrıların sonuçlarını toplar. Altı ay aralıklı Save8 dosyaları geçici çalışma dizininde üretilir.
* replay.cjs yükleme sonrası kontrol ve müdahale için ayrı süreç kullanır. probe başlangıçtaki olası alternatifleri okur. run gerçek yarım gün adımlarını yürütür. Olasılık/puan sorgusu yapan probe sonuçları run dünyasına geri girmez. E tek insanlı önceki çöküşü, diğerleri üç insanlı MP host motorunu kullanır.
* forecast-engine.js yalnız atılabilir bir kopyada kuyruk, nüfus ve bakım senaryosu kurar. forecast.cjs ileri ay gözlemini daha sonra ekler. first alanında 0, ufukta kritik ay görülmediği anlamına gelir. Döviz/emtia arasında değer dönüşümü uygulanmaz.
* raw dizininde başlangıç girdilerinin karmaları, aylık doğal stoklar, gerçek karar ve ödemeler, biten/bekleyen cepheler ve tüm zaman örnekleri var. Sıkıştırılmış dosyalar gzip ile açılan JSON'dur. Zamanlar cihaz ve arka plan yüküne bağlıdır. [Sonuç raporu](../../reports/codex/EKONOMIK-BASKI0-SONUC.md)
