# STARS · CODEX-TEST-FAIL-KÖK.0 devri

Dal `codex/stars-test-fail-kok0`, taslak PR #83. Başlangıç commit’i `a8c07e18ee3daf544da62244fe31cd2aaa3ee574`. Son tam Node girdisi `320bb9c8`. Çalışma zamanı ve taslak manifestin son commit’i `041413e2`. [Sonuç raporu](CODEX-TEST-FAIL-KOK0-SONUC.md) · [Taslak PR](https://github.com/sarsiss12-dot/Star/pull/83)

## Çalıştırma

Node v24.22.1, Debian 13 ve Chromium 155 kullanıldı. Bu çalışma ortamında `NODE_PATH` ve `CODEX_PRIMARY_RUNTIME_NODE_MODULES` değeri `/workspace/Star/tests/node_modules`. Canvas ve Playwright kurulumunu doğrula. Tarihsel kaynak testleri sabit Git nesnelerini okur, dolayısıyla kaynak arşivinin ilgili commit’lerine erişim gerekir. Kanıt dosyalarındaki çalışma dizini adlarından bağımsız olarak kontrol `a8c07e18`, motor düzeltmesi `e2da7ec0`.

```bash
STARS_TEST_WORKERS=2 STARS_TEST_TIMEOUT_MS=180000 STARS_TEST_LOGS=/tmp/stars-baslangic node tests/run-all.js
STARS_TEST_WORKERS=2 STARS_TEST_TIMEOUT_MS=180000 STARS_TEST_LOGS=/tmp/stars-aday node tests/run-all.js
python3 research/test-fail-kok0/inventory.py /tmp/stars-baslangic/summary.json --compare /tmp/stars-aday/summary.json

node tests/faz86c_6_transaction_acceptance_test.js
STARS_SOURCE_ROOT="$KONTROL" node tests/faz86c_6_transaction_acceptance_test.js
node tests/faz85c_crisis_save_continuity_test.js
node -r ./research/test-fail-kok0/without-inbox.cjs tests/faz85c_crisis_save_continuity_test.js
node research/test-fail-kok0/deal-shape.cjs "$KONTROL" "$ADAY"
node research/test-fail-kok0/status-quo-inbox.cjs

export STARS_CHROMIUM_PATH=/usr/bin/chromium
node research/test-fail-kok0/browser-battle-report.cjs "$KONTROL" "$ADAY"
MP8_SCEN=I MP8_I_MIN=6 SCALE0_MP='{"size":"ulu","ai":9}' node tests/browser-mp8.cjs
MP8_SCEN=I MP8_I_MIN=6 node tests/browser-mp8.cjs
MP8_SCEN=F node tests/browser-mp8.cjs
MP8_SCEN=J MP8_J_NATURAL=1 node tests/browser-mp8.cjs
MP8_SCEN=SG node tests/browser-mp8.cjs
MP8_SCEN=TR node tests/browser-mp8.cjs
MP8_SCEN=FA node tests/browser-mp8.cjs
```

`KONTROL` ve `ADAY` çalışma ağacının mutlak dizinleri. Performans girdileri önceki p57 kabulünün `reports/codex/evidence/p56-kabul0/perf/girdi/` içindeki `.save.gz` dosyaları. `gzip -cd` ile geçici dizine açıp `node research/p56-kabul0/build-parity.cjs KONTROL ADAY GİRDİ…` ve `PHASE=steady SAMPLES=16 WARMUP=8 node research/p56-kabul0/perf.cjs KONTROL ADAY ÇIKTI_JSON GİRDİ…` ile karşılaştır. ABBA ve A/A ham CPU ve duvar saatini ayrı kaydeder. Son performans koşusu Node ve Chromium bittiğinde yalnız başına başlar.

## Devralınacak durum

- Tam p57 kontrolü 6.643/276, son kaynak 6.888/47. 256 paket seçimi aynı. 13 başarısız paket, 10 tarihsel NOT RUN ve sıfır zaman aşımı. Ham taramaya bağımsız tekrarları katma. [Paket farkı](evidence/test-fail-kok0/nihai/paket-farki.json)
- Küme etkisinden kalan `faz85e` kontrollerini güncel giriş noktalarına taşıyacak negatif senaryoları hazırla. Eski tam kaynak eşitliği kontrollerinin arşiv köklerini doğrula. `faz86b` güncellendi ve 143/0 geçti.
- Yerel Chromium 35/35. Sürekli simülasyonda CPU p95 ABBA farkı 100/120, 500/120 ve 500/180 için sırasıyla −%2,65, +%2,77 ve −%6,45. A/A özellikle 100 sistemde geniş aralık verdi. p58 yayımlanmadı. Fiziksel Android, internet/LAN ve canlı Render saha kabulü ayrı kalır.
- C2 için test edilmiş geliştirme kaynak commit’i `320bb9c853f058384922a8b97a9fbc3ce6959c27`. Yayımdaki eski p57 karşılaştırma ve geri dönüş kaynağı. C2 kapsamında ilk yeni karar ayrışmasını ayrı kaydet ve bu fazdaki normal Save8/RNG girdilerini tekrar kullan.
