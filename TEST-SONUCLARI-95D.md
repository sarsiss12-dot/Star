# Test sonuçları — 95D

**86 paket / 4.988 başarılı kontrol / 0 kalan hata.** Atlanan paket veya zaman aşımı yok. Önce hedefli testler, sonra tek tam regresyon ve gerekçeli sınırlı takip. Ham tam koşu: 4958 başarılı / 26 başarısız. Takip: 19 paket, 1467 başarılı / 0 kalan. Toplam sayı tekrar çalıştırılan kontrolleri iki kez saymaz; her paketin son sonucu `tests/summary-95d.json` içindedir. Önceki fazın 4.923 sonucu yeni sonuç diye kopyalanmadı.

| Yeni paket | Başarılı | Kalan |
|---|---:|---:|
| faz95d_identity_test.js | 23 | 0 |
| faz95d_map_test.js | 23 | 0 |
| faz95d_war_preview_test.js | 19 | 0 |


Kullanıcı senaryoları: 1–2 isim/oyuncu çakışması; 3 beş bileşenli rastgele düğme; 4–5 Save v8 ve eski kayıt; 6–7 federasyon benzersizliği/reform/başkan; 8 tıklama; 9 uzun/yoğun etiket; 10–11 üç bağımsız katman ve eski savaş toggle; 12 gerçek savunma/taahhüt/vasallık; 13 gizli üye filtreleri; 14 bayat koşullar; 15 kimlik ve tercih kaydı; 16 RNG saflığı; 17 native çizim/cache ölçümü; 18 önceki bütün paketler çalıştırıldı. Gerçek mobil dokunma ve DOM ölçümü bu testler arasında değildir.

İlk hatalar saklandı: viewPrefs’in v:8 ile cfg arasına eklenmesi eski statik kaynak kontrolünü bozdu; aynı JSON alanı aşağı taşındı. Yeni ad üreticisinin normal PRNG tüketimi eski başlangıç lüks/rota fixture’larını etkiledi; eski çekimler korunup yeni metin özel akışa ayrıldı. Yeni korsan ambleminin ana rengi ilk yüklemede değişiyordu; yeni oyun sonuna normalleştirme eklendi. Kaynak düzeltmesi sürerken iki gözlemci koşusu farklı dosya sürümünü okudu; son kaynakla sınırlı takipte yeniden doğrulandı. UI/CSS eski koruma hash’leri kaldırılmadı; yeni blok ayrıca pinlendi, onaylı harita uzantısı güncel hash ve negatif koruma testleriyle kontrol edildi.

| Tohum | 95C.1 kare medyan / P95 ms | 95D kare medyan / P95 ms | 95C.1 → 95D etiket medyan ms | 95D katman medyan ms |
|---|---:|---:|---:|---:|
| 11 | 8.98 / 13.00 | 7.91 / 11.01 | 2.99 → 1.44 | 0.052 |
| 99 | 8.81 / 10.55 | 8.00 / 10.67 | 3.06 → 1.59 | 0.053 |
| 404 | 8.93 / 14.37 | 8.10 / 11.57 | 3.11 → 2.28 | 0.053 |


100 sistem / 13 devlet / 1000×600 gerçek Skia Canvas; 80 sıcak kare, 100 etiket, 300 katman çizimi. Sayılar gerçek Node perf_hooks saatiyle ölçüldü. Tam regresyonla eşzamanlı host yükü vardır; izole cihaz FPS’i, tarayıcı compositing’i veya Android batarya/ısı ölçümü değildir. İlk sanal saat denemesi geçersiz diye ayrı tutuldu. İlk gerçek ölçümde uzayan etiket çizimi görüldü; bounded metin ölçüm önbelleği ve devlet başına tek yerleşen arma ile son ölçüm iyileşti. Bu optimizasyonun eski native etiket/dokunma testleri takipte geçti.

11/99/404 tohumlarında benzersiz kimlik ve başlangıç motoru eşliği doğrulandı. Tam regresyonun 120 aylık donanma kampanyaları yeni fazda çalıştırıldı; ham taze dosyalar audit-95d içine alındı, tarihsel navy-95a dosyaları korunur. Yeni bir uzun kampanya serisi ayrıca tekrarlanmadı; bu fazda askerî/ekonomik denge iyileşti iddiası yoktur. Karşılaştırma ölçümünü yeniden üretmek için measure-identity-95d.js, kanonik 95C.1 kaynağının proje yanında baseline95c1 adıyla çıkarılmış olmasını bekler. Hedefli test paketleri ise ZIP içindeki bağımsız fixture’larla çalışır.

Tarayıcı ikilisi bulunmadı; gerçek Chromium DOM yerleşimi ve fiziksel Android testi yapılmadı. 740×360 mock giriş/CSS ve native raster kontrolleri bunların yerine kabul edilmedi. Önceki 95C.1 üst bar +N, bina sayacı/yıkımı, aylık araştırma, destek, ticaret, sevkiyat ve kalıcı kayıt testleri geçti.
