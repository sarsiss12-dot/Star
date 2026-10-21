# Devir — Faz96D

Kanonik ebeveyn96C.3 bfce5e5b2f0718057f7ddc50e91883ccaf8347bb26d24b2241b03132b4b76f9a. Bu çıktı köken/portre/generatif müzik96D'dir. Eski yol haritasındaki bilim gemisi96D önerisi bu çalışmanın kapsamı değildir. Keşif otomasyonu veya başka faz başlatılmadı.

Üretim farkları6 dosya; bkz. FAZ96D-RAPOR ve tests/audit96d/production.patch. Save8/build96d/cache stars-v96d. Yeni tek kayıt alanı isteğe bağlı oyuncu portraitVariant; eski kayıtta görsel varsayılan saftır. Ses mix'i cihaz tercihi olarak saklanır; kaynak transferi veya AI kararı üretmez.

Kilitli tam regresyon109/5531/0. Eski106/5502 gerçekten yeniden çalıştı, yeni3/29. Eski130 ve yeni15 Chromium UI; ayrıca6 ses deneyi. Tekrarlanan koşular sayılmaz. İlk başarısızlıklar tests/audit96d altında korunur; en son kanıt full-locked, browser-final, browser-c3-confirmed, audio-prototype.json, audio-long.json, audio-stress-final.json ve final-summary.json'dur.

Yeniden üretim örnekleri (kaynak kökünde):

```sh
node tests/faz96d_origins_test.js
node tests/faz96d_portraits_native_canvas_test.js
node tests/faz96d_audio_test.js
STARS_TEST_LOGS=tests/local-run node tests/run-all.js
STARS_CHROMIUM_PATH=/gercek/chromium node tests/browser-96d.js
STARS_CHROMIUM_PATH=/gercek/chromium node tests/audio-prototype96d.js
STARS_CHROMIUM_PATH=/gercek/chromium node tests/audio-stress96d.js
STARS_CHROMIUM_PATH=/gercek/chromium node tests/audio-long96d.js
python tools/verify-release.py
```

Node24/Playwright/@napi-rs/canvas/Python gerekir. Bazı eski karşılaştırmalar bitişikteki baseline-96a/b/c/c1 ve canonical96c2/c3 girdilerini ister; yoksa oyun hatası diye raporlama. Yeni hedefli üç paket bağımsız yerel kaynakla çalışır. Testler çıktı yazar; dağıtım manifestini değiştirmeden kontrol etmek için önce temiz kopya kullan. Chrome ses testleri kendi loopback sunucusunu açar.

Açık kabul: gerçek dinleme; fiziksel Android/WebView/PWA cihazı, OS background, ısı/RAM/FPS. Portre estetiği öznel. İlk ses stresindeki13SFX hatası son aralık kontrolüyle10'a indirildi; kaynak bütçesini gevşetme. Sabit6 kanal düğümü ile geçici ses düğümlerini karıştırma.

Genel AI dengesi, bilim gemilerinin ortak hedef/korsan beklemesi, özgün federasyon kaydı gerektiren eski ret QA'sı korunur. Bunları çözülmüş ilan etme. GitHub'a yayın yapılmadı; sonraki yayın/iş kapsamı ayrı planlamaya bırakılır.

ZIP'i tekrar açıp CRC ve bütün manifest hash'lerini doğrulamadan devam kaynağı sayma. Paket SHA'sı nihai sohbet mesajındadır; manifest kendi hash'ini içermez. Gerçek indirilebilir dosya bulunmazsa bu rapor tek başına teslim değildir.
