# CODEX-TİCARET-TEMAS.0 araştırma araçları

Referans `ec0fa3b72c65b2a2a7cd1f8143da6e99fbd4cb28`. Aday kodu ve kanıtları [PR #85](https://github.com/sarsiss12-dot/Star/pull/85) üzerinde.

```bash
STARS_EXPECT_CONTACT=1 node research/ticaret-temas0/temas.cjs <p57-kontrol-kökü> .
node tests/ticaret_temas0_test.js
bash research/ticaret-temas0/matris.sh <p57-kontrol-kökü> . <sonuç-dizini>
python research/ticaret-temas0/ozet.py <sonuç-dizini>
node research/ticaret-temas0/ayristirma.cjs . <ayrıştırma-dizini>
SAMPLES=12 node research/ticaret-temas0/performans.cjs <p57-kontrol-kökü> . p95.json reports/codex/evidence/p56-kabul0/perf/girdi/{ulu-11-m120,s500-11-m120,s500-11-m180}.save.gz
MP8_SCEN=T MP8_TEMAS0=1 node tests/browser-mp8.cjs
MP8_SCEN=TZ MP8_TRADE_FINAL=1 node tests/browser-mp8.cjs
MP8_SCEN=I MP8_I_MIN=8 SCALE0_MP='{"size":"ulu","ai":9}' node tests/browser-mp8.cjs
MP8_SCEN=I MP8_I_MIN=15 node tests/browser-mp8.cjs
STARS_TEST_WORKERS=2 STARS_TEST_TIMEOUT_MS=180000 STARS_TEST_LOGS=<node-günlükleri> node tests/run-all.js
```

Kampanya gözlemi ürün kuralına yazmaz. Fiziksel ilk temas, `arrive` içinde karşılıklı kayıt kuran gerçek varıştır. Paylaşımlı temas, hedefin canlı sağlayıcı görüşüyle açıkça seçilmesine ve aynı filo/hedefin varışına bağlanır. Kaynak-devlet-ay ve tekrar eden ret olayı benzersiz fırsat sayısı değildir. Teslimatlar gerçek terminal makbuzdan sayılır. Erken oyun sonu durumunda kontrol ve aday karşılaştırması ortak ay sınırına kadar yapılır.

İlk Save8 ve yeniden oynatım izleri `temas-ve-ticaret.json` içindedir. Sınırlı altyapı, stok ve ilişkiler aynı kontrollü fikstürde kurulur. Ticaret paktı, transit izni ve iki yönlü imza mevcut ürün motorundan geçer. Doğal koşu ve kontrollü sonuç ayrı yorumlanır.
