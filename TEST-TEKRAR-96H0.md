# 96H.0 tekrar ve kanıt düzeni

Oyun ZIP'i 19 çalışma dosyası ve tam RELEASE-MANIFEST.json içerir. Kanıt ZIP'ini aynı dizine açın. Oyun statik ve dış bağımlılıksızdır; PWA için localhost/HTTPS gerekir. Node testleri Node.js ve @napi-rs/canvas, tarayıcı testleri Playwright ve gerçek Chromium gerektirir. Bu çalışmada Chromium 133.0.6943.0 kullanıldı. STARS_CHROMIUM_PATH değişkenini uygun yürütülebilir dosyaya ayarlayın.

- STARS_TEST_WORKERS=2 STARS_TEST_LOGS=tests/audit96h0/regression node tests/run-all.js: tam test kümesi.
- node tests/faz96h0_building_safety_test.js: onay, iptal, doğru hedef, çift işlem, eski Save8 onayı, sahiplik ve gerçek hurda ödemesi.
- node tests/browser-96h0-buildings.js before veya after: gerçek dokunma, uzun basma, sayaç/ikon aralığı, kaydırma ve aynı çözünürlükte görüntüler. before, baselines/96g2 dosyalarını sunar.
- node tests/browser-96h0-regression.js: 25 genel kontrol; G2→H0 PWA geçişi ve çevrimdışı Save8 dahil.
- node tests/browser-96h0-setup.js: 36 kurulum etkileşimi.
- node tests/contracts-browser-96h0.js: iki görünümde 16 sözleşme etkileşimi.
- node tests/browser-politics-96h0.js: 13 siyasi arayüz kontrolü.
- node tests/ui-live-96h0.js: altı gerçek 30+ saniyelik canlı panel. STARS_UI_FAST kullanılmamalı.
- python3 tests/run-campaigns-96h0.py: 8 kısa, 4 uzun ve 4 yoğunluk koşusu; iki işçi ve koşu başına 360 saniye sınırı.
- node tests/campaign-96h0.js SEED MONTHS [SIZE] [AI_COUNT]: tek nihai koşu. Yarım günlük adımlar, 60. ay Save8 yüklemesi; kaynak hash'leri dosyaya kaydedilir.
- python3 tests/quality-96h0.py: 19 nihai hash, kanonik G2 seçimi, kampanya karşılaştırması, Save/RNG eşleşmesi ve 120/240 ay önekleri.

Nihai kayıtlar yalnız tests/audit96h0/final/campaigns altındadır. experiments altındaki A/B/C/D hiçbir şekilde nihai değildir. Seçilen eski G2 kaynaklarının gerçek yolları baseline-selection.json'dadır. initial/harness-failures ve ilk regresyon çıktıları başarısız denemelerin kanıtıdır; son başarılı sonuç sayılmaz.

İlk tam koşuda eski build etiketleri, önceki ayrı YIK satırı beklentisi ve eski CSS pini başarısız oldu. Yeni sürüm/yerleşim beklentileri güncellendi; bilim ve diğer UI pinleri korundu. Başarısız paketler aynı oyun dosyaları üzerinde yeniden çalıştırıldı. regression-final.json ilk tam koşuyu ve düzeltilen paketleri ayrı kaydeder.

Fiziksel Android, Android FPS/ısı/batarya ve öznel müzik dinleme: NOT RUN.
