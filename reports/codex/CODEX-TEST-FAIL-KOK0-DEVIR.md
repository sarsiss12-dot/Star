# STARS · CODEX-TEST-FAIL-KÖK.0 devri

Dal `codex/stars-test-fail-kok0`. Başlangıç commit’i `a8c07e18ee3daf544da62244fe31cd2aaa3ee574`. [Sonuç raporu](CODEX-TEST-FAIL-KOK0-SONUC.md)

## Çalıştırma

Node v24.22.1, Debian 13 ve Chromium 155 kullanıldı. Bu çalışma ortamında `NODE_PATH` ve `CODEX_PRIMARY_RUNTIME_NODE_MODULES` değeri `/workspace/Star/tests/node_modules`. Canvas ve Playwright kurulumunu doğrula. Tarihsel kaynak testleri sabit Git nesnelerini okur, dolayısıyla kaynak arşivinin ilgili commit’lerine erişim gerekir. Kanıt dosyalarındaki çalışma dizini adlarından bağımsız olarak kontrol `a8c07e18`, motor düzeltmesi `e2da7ec0`.

```bash
STARS_TEST_WORKERS=2 STARS_TEST_TIMEOUT_MS=180000 STARS_TEST_LOGS=/tmp/stars-baslangic node tests/run-all.js
STARS_TEST_WORKERS=2 STARS_TEST_TIMEOUT_MS=180000 STARS_TEST_LOGS=/tmp/stars-aday node tests/run-all.js
python3 research/test-fail-kok0/inventory.py /tmp/stars-baslangic/summary.json --compare /tmp/stars-aday/summary.json

node tests/faz86c_6_transaction_acceptance_test.js
node tests/faz85c_crisis_save_continuity_test.js
node -r ./research/test-fail-kok0/without-inbox.cjs tests/faz85c_crisis_save_continuity_test.js

export STARS_CHROMIUM_PATH=/usr/bin/chromium
MP8_SCEN=I MP8_I_MIN=6 SCALE0_MP='{"size":"ulu","ai":9}' node tests/browser-mp8.cjs
MP8_SCEN=I MP8_I_MIN=6 node tests/browser-mp8.cjs
MP8_SCEN=F node tests/browser-mp8.cjs
MP8_SCEN=J MP8_J_NATURAL=1 node tests/browser-mp8.cjs
MP8_SCEN=SG node tests/browser-mp8.cjs
MP8_SCEN=TR node tests/browser-mp8.cjs
MP8_SCEN=FA node tests/browser-mp8.cjs
```

Performans girdileri önceki p57 kabulünün `reports/codex/evidence/p56-kabul0/perf/girdi/` içindeki `.save.gz` dosyaları. `gzip -cd` ile geçici dizine açıp `node research/p56-kabul0/build-parity.cjs KONTROL ADAY GİRDİ…` ve `PHASE=steady SAMPLES=16 WARMUP=8 node research/p56-kabul0/perf.cjs KONTROL ADAY ÇIKTI_JSON GİRDİ…` ile karşılaştır. ABBA ve A/A ham CPU ve duvar saatini ayrı kaydeder.

## Açık işler

- Yeni tam tarama ve bağımsız suretleri ile paket farklarını tam kanıta ekle. Üç temsilî yükleyici deneyini, ham tarama sayaçlarına katma.
- Küme etkisinden kalan `faz85e`, `faz86b` ve eski tam kaynak eşitliği kontrollerini güncel giriş noktalarına taşıyacak negatif senaryoları hazırla. p57’ye ait bekleyen ve eski kayıt eşdeğerliğini ayrı ölç.
- Adayın yayın kararını CPU A/A, ABBA ve yerel relay sonuçlarıyla ver. Geçmemiş kapılar varken yayın paketi oluşturma. Fiziksel Android, internet/LAN ve canlı Render için saha kabulü ayrı kalır.
- Diplomatik keşif ve temas çalışması C2 bu fazın kapsamı dışında.
