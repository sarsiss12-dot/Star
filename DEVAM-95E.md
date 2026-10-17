# Devam noktası — 95E

Kanonik ebeveyn 62f1b313be9969ebd39206be19bdeac7acdf559e; 95D ZIP f01d36706897d49972d4250ae655ef40daf1c98d814d6f25d3721686a37b0f21. Build 95e / Save v8 / stars-v95e.

Önce FAZ95E-RAPOR.txt, TEST-SONUCLARI-95E.md, tests/summary-95e.json ve tests/audit-95e/development-notes.txt. Yeni modüller ve son sonuçlar korunacak; başarılı testler yeni hata/kaynak değişikliği olmadan döngüyle tekrarlanmayacak.

- Haber veri/istihbarat/göç: news.js. Gizli geçmiş otomatik açılmaz; görünür/gizli kapasite ayrıdır. Olay hook'ları ana üretim motorlarında küçük eklemelerdir. Mevcut `recordNews/runModule95E` hata sınırını koru.
- Kalıcı teklifler: inbox.js. Codec, quote, kanonik execute/accept/vote/decision; kaynak token ve makbuzlar korunur. Orijinal AI teklif ve karşı teklif penceresini yeniden bozma. Eski popup ve arşiv iki ayrı siyasi işlem değildir.
- İnşaat: construction.js. Emirde ücret alınmaz; varışta startStruct tek ödeme yapar. structTick fiziksel tamamlanma callback'i sayaç doğruluğu için kritiktir; gemi ölse bile mevcut yapı motorunun işi tamamlanabilir. AI seçim/bütçe sistemi korunur.
- Sunum: archive-ui.js, mevcut UI.act/filo/sistem/üst durum menüsüne küçük bağlantılar. Bütün yeni dosyalar index ve PWA kabuğunda olmalı. Harita Canvas dosyası değiştirilmedi.

90 paket / 5.170 başarılı / 0 kalan hata. Ham ilk hatalar, kampanya sayaç hatası, takip ve son modül kanıtları saklıdır. Gerçek Android/Chromium kabulü açık. Özgün oyuncu save'i olmadan iki eski ret/gemi-kökeni iddiası kesin çözüm diye sunulmaz.

Öncelikli manuel kabul: 740×360, dokunma/arama/klavye, 30 kart sayfalama, devlet incelemeden aynı teklife dönüş, harita ping, PWA eski cache üstüne yükseltme, çoklu inşa/iptal, ekran dönüşü ve arka plan. Node/mock olay testi cihaz kabulünün yerine geçmez.

95F ve 96A otomatik başlamaz. Kaynak sözleşmeleri/fiziksel konvoylar/rota ve aylık gelir şeffaflığı 96A'da; yedi kaynak Ekonomi, sekiz köken denetimi, portre, casuslukla rakip teknoloji, karşı araştırmalar, doğal AI federasyon savaşları, geç oyun ekonomik/askerî denge ve harici ses dosyasız doğal generatif müzik korunur.
