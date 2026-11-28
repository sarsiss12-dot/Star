# Ticaret AI son kabul araştırma araçları

Kontrol, PR #83'ün `e4ae69fb03fe603770d7206d95e2d1d321142751` HEAD'idir. Oynanabilir ve test edilmiş kaynak `320bb9c853f058384922a8b97a9fbc3ce6959c27` ile JavaScript, giriş HTML'i ve sürüm manifesti eşittir. Bu araçlar ürünün dosya yükleme zincirinin dışındadır.

## Yeniden üretim

```bash
node research/ticaret-ai-sonkabul0/teslim-penceresi.cjs
STARS_SOURCE=$(git rev-parse HEAD) node research/ticaret-kok-neden0/campaign.cjs 404 240 p57-ulu-404.json . ulu 9
STARS_SOURCE=$(git rev-parse HEAD) node research/ticaret-kok-neden0/campaign.cjs 23 120 p57-s500-23.json . s500 16
STARS_OBSERVER=research/ticaret-ai-sonkabul0/firsat-gozlemi.js node research/ticaret-kok-neden0/campaign.cjs 404 240 gozlem-ulu-404.json . ulu 9
python research/ticaret-ai-sonkabul0/kampanya-ozet.py p57-*.json > ozet.json
```

Gözlem, canlı dünyadaki AI çağrılarına teklif veya emir eklemez. Risk dönemi başlangıcını gördüğünde aynı ayın Save8 kaydını yalıtılmış VM'ye yükler. Ortağın kendi ihracat değerlendirmesini, iki hacimli rotayı, karşılıklı pozitif AI değerini ve rezerv tarihini denetler. Kotalı rota taramasının elendiği anda alınan karar ile ay sonundaki olası teklif ayrışabilir. Gözlemdeki açık rota, tek başına uygulanabilir yeni anlaşma sayılmaz. Diplomatik kabul için canlı RNG çağrısı yapılmaz.

Rezerv ayı, ay kapanışında stoku kaynak tabanının altında ve net geliri negatif olan kaynak-devlet çiftidir. Fiziksel makbuz, gerçek motorun terminal olayıdır. Teslimat değeri ve açık, taşıyıcı ve alıcı için farklı birimleri korur. Teslimat anında rezervin aşılması nedensel kriz kurtarma iddiası için tekrar gerektirir. Sözleşmeye imza atılması ve yükleme ayrı sayılır.

`teslim-penceresi.cjs` aynı koşullarda üç kol kullanır. Kısa ve uzun rota eşit sözleşme değerine sahipken stok rezerv tarihinin farklı taraflarında teslim edilir. Üçüncü kolda yoldaki yük kapanan bağlantıyla yok olur. Üç kol aynı Save8 kaydından dönüldüğünde aynı sonuç ve RNG'yi üretir.

## Tam kabul ekleri

```bash
STARS_FAST_CAMPAIGN=1 STARS_OBSERVER=research/ticaret-ai-sonkabul0/gunluk-ekonomi.js node research/ticaret-kok-neden0/campaign.cjs 404 240 daily-ulu-404.json . ulu 9
node research/ticaret-ai-sonkabul0/durum-ozeti.cjs . <kampanya-kontrol-kayıtları>
node research/ticaret-ai-sonkabul0/kriz-tekrar.cjs ulu-404-150.save p57-ulu-404.json
node research/ticaret-ai-sonkabul0/eski-ticaret-kaydi.cjs <1dec704-kaynak-kökü> .
PHASE=steady SAMPLES=12 WARMUP=2 STARS_PROFILE_TRADE=1 node research/p56-kabul0/perf.cjs <p57-kontrol-kökü> . abba.json ulu-11-m120.save s500-11-m120.save s500-11-m180.save
N=4 OUT=yogun-konvoy.json node research/ticaret-final0/yogun-konvoy.cjs <p57-kontrol-kökü> . s500-11-m120.save
STARS_TEST_WORKERS=2 STARS_TEST_TIMEOUT_MS=180000 STARS_TEST_LOGS=node-logs node tests/run-all.js
MP8_SCEN=TA MP8_TRADE_FINAL=1 node tests/browser-mp8.cjs
MP8_SCEN=TZ MP8_TRADE_FINAL=1 node tests/browser-mp8.cjs
MP8_SCEN=TZ MP8_ONLY='^(TZ0|Z0|Z5) ' MP8_TRADE_RENEW_SAVE=1 node tests/browser-mp8.cjs
MP8_SCEN=TA MP8_ONLY='^(TA0|A0|A8) ' MP8_TRADE_FINAL=1 MP8_TRADE_FLEET=1 SCALE0_MP='{"size":"s500","ai":16}' node tests/browser-mp8.cjs
MP8_SCEN=I MP8_I_MIN=8 SCALE0_MP='{"size":"ulu","ai":9}' node tests/browser-mp8.cjs
MP8_SCEN=I MP8_I_MIN=15 node tests/browser-mp8.cjs
node tests/browser-ticaret-tamamlama0-sp.cjs
node tests/browser-ticaret-son-eksikler0-sp.cjs
python tools/verify-release.py
```

Başlangıç ve terminal kayıtları aracı her 30. ayda dosya açabilir. Bunun için `STARS_CHECKPOINTS` ortam değişkenini mevcut boş bir dizine ayarla. Günlük gözlem her yarım adımda rezerv ve sıfır stokta geçen kaynak-devlet günlerini sayar. Başarılı liman siparişini ayrı kaydeder. Liman sisteminin ilk aylık görünümü bir inşaat bitiş makbuzu sayılmaz.
