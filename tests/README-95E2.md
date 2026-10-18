# 95E.2 doğrulamasını yeniden çalıştırma

Node.js ile `tests` dizininde `npm install`, ardından `npm test` çalıştırın. `@napi-rs/canvas` native piksel testleri içindir; Playwright yalnız geliştirme/test bağımlılığıdır, oyuna yüklenmez.

Gerçek Chromium için, proje kökünde:

```bash
STARS_CHROMIUM_PATH=/absolute/path/to/chromium node tests/browser-95e2.js
```

Standart Playwright browser kurulumu varsa `STARS_CHROMIUM_PATH` atlanabilir. Gerekirse önce `npx playwright install chromium` çalıştırın. Bu ortamda Chromium 133.0.6943.0 gerçek ikilisi ve Playwright 1.62.1 kullanıldı. Playwright standart ikili indirmesi eksik arşiv verdiği için çalışır ayrı ikili sağlandı; bu bağımlılık oyun dosyalarına eklenmedi.

`STARS_BROWSER_FILTER` yalnız eşleşen senaryo adlarını; `STARS_BROWSER_OUTPUT` çıktı dizinini seçer. `STARS_BROWSER_ROOT` kanonik başka kaynak klasörünü test etmeye yarar. Özgün 95E.1 arşiv kabul testi bilerek başarısızdır; normal teklif modalı kontrolü aynı kaynakta geçer.

Bu fazın 43 benzersiz browser sonucu, tam 34 senaryo koşusu ve yalnız ek/izole takiplerin birleştirilmesidir. 92 paket / 5.186 kontrol ise tam koşu + beş eski cache beklentisinin düzeltilen izlemesi + sekiz yeni 95E.2 kontrolünün benzersiz toplamıdır. Önceki faz sonuçları yeni sonuca katılmaz.

PWA senaryosu CACHE adı dışında aynı olan worker'ın önce 95E.1 cache adıyla gerçek aktivasyonunu, ardından 95E.2 güncellemesini, eski cache temizliğini, offline yeniden açılışı ve Save v8 korunmasını sınar. Fiziksel Android kabulü değildir. Browser ekran görüntüleri teslim paketine konulmadı.
