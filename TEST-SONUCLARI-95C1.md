# Test sonuçları — 95C.1

Son benzersiz sonuç: **83 paket / 4.923 başarılı kontrol / 0 kalan hata**, sıfır atlanan paket, sıfır zaman aşımı. Bu fazda alınan sonuçtur. 95C'nin 79/4823 referansı yalnız tarihsel karşılaştırmadır.

| Yeni paket | Geçen | Kalan |
|---|---:|---:|
| faz95c1_diplomacy_test.js | 32 | 0 |
| faz95c1_logistics_test.js | 24 | 0 |
| faz95c1_storage_test.js | 15 | 0 |
| faz95c1_ui_test.js | 29 | 0 |

100 yeni kontrol ve bu fazda tekrar çalıştırılan 79 eski paket birlikte sayılır. Başlangıç üretim senaryoları `baseline95c` üzerinden çalıştırıldı: parya paktı ve geçersiz AI bildirimi kabulü, çift rota mesajı, RAM başarı dönüşü ve savaş modu tercihi aşımı yeniden üretildi. Otomatik kilitli gövde üretilemedi; özel Taht yeniden inşa yolu ayrıca kanıtlandı.

Çalıştırma sırası: hedefli yeni ve etkilenen testler; tek tam regresyon; yalnız bulunan sorunlar için sınırlı takip. Tam komut: `STARS_TEST_WORKERS=2 STARS_TEST_TIMEOUT_MS=180000 STARS_TEST_LOGS=tests/logs-95c1 node tests/run-all.js`.

İlk tam koşu: 83 paket / 4897 geçen / 26 kalan. Üç başarısız paket: bildirim kimliği 6, erken fatal teklif retleri 19, teklif tekrarı stres fikstürü 1. İlk iki eski bildirim fikstüründe gerçek karşılıklı temas ve teslim edilebilir stok yoktu; tekrar stresindeki aktör kapalı doktrinliydi. Bunlar yeni geçerli teklif girişine uyarlandı. Erken fatal planda eksik alanı `.filter` ile okumak geliştirme regresyonuydu; güvenli boş plan ve gerekçe düzeltildi, yeni negatif testle kilitlendi. Bu başarısızlıklar gizlenmedi ve tam koşu tekrar tekrar çalıştırılmadı.

Yedi teklif/işlem takip paketi: 659/0; bildirim, temel anlaşma, effective quote, atomik işlem, strict AI, tekrar beklemesi ve yeni diplomasi paketi. Sonrasında dar sayaçtaki “+sırada” metninin sarılmasına yönelik küçük CSS düzeltmesi için UI/science/üretim sunumu hedefli takipleri yapıldı. Son birleştirme her paket için son geçerli kanıtı kullanır; aynı kontrol ikinci kez toplama eklenmez. Ham `tests/logs-95c1/summary.json`, takip özetleri ve `tests/summary-95c1.json` birbirinden ayrıdır.

Kapsam: üç türde gerçek kuruluş ve ücret, aday reddi/üyeliği/beklemesi; parya ve ambargo/stale pakt; gönderen ödeme ve büyük sözler; gerçek queueShip, tamamlama ve özel Taht; şablon ve çok tersaneli sevk; üç destek talebi ve gizlilik; katkı/oybirliği; savaş katmanı pikselleri; mobil markup/giriş; araştırma net değeri; rota tekrarı; kalıcı backend başarısızlığı; Save v8 ve RNG.

| Ölçüm | 95C | 95C.1 |
|---|---:|---:|
| 100 sistem / 50 bekleyen gemi; tik başına değerlendirilen sevkiyat | 8 | 8 |
| Başarısız denemede ek neden rotası / tik | 0 | 8 |
| Bu stres tikinin medyan süresi | 2,08 ms | 3,55 ms |
| Bu stres tikinin P95 süresi | 6,04 ms | 7,18 ms |
| 1000 üst bar HTML üretimi, mock DOM | 11,11 ms | 8,78 ms |
| Üst bar başına muharebe sayımı | 2 | 1 |
| Değişmeyen 1000 ortak sefer tikinde rota araması | 0 | 0 |

Ölçüm tek hostta sıralı, 5 ısınma + 20 rota örneğidir. Maliyet artışı yalnız başarısız sevkiyatın gerçek nedeni için ek aramadır. Tekrarlanan 1000 değişmeyen ortak sefer tikinde arama sıfır kaldı. Mock DOM HTML üretimi ve Canvas çizgileri gerçek tarayıcı layout/GPU/FPS değildir. Fiziksel Android kabulü yok.

Yeni 120 aylık 95C.1 önce/sonra kampanya raporu üretilmedi. Tam regresyonun doğal ve kontrollü AI/ekonomi/savaş kampanyaları çalıştırıldı; eski 95C 120 aylık tabloları yeni ölçüm diye sunulmadı. Negatif kaynak, katkı, oybirliği ve RNG kontrolleri ilgili paketlerde geçti; bu bütün uzun dönem dengesini kanıtlamaz.

Sürüm kimlikleri testlerde 95c1 / stars-v95c1 olarak güncellendi; yalnız sürüm beklenen değerleridir, oyun testleri silinmedi. Eski Savaşlar modunun anahtarı aşmasını bekleyen bir çizim assertion'ı yeni bağımsız katman sözleşmesine göre güncellendi ve iki yönde piksel farkıyla desteklendi. UI koruması yeni mobil bloğu ayrıca hash'ler.

Paket kontrolü: başlangıç ZIP hash/CRC/manifest ve GitHub blob eşleşmesi geçti. Teslim ZIP'i üretildikten sonra `tools/verify-release.py`, bütün manifest SHA'ları ve ZIP CRC tekrar doğrulanır. Tam raporlama ve kaynak değişiklikleri `tests/audit-95c1` altındadır.

## Bu fazın tam regresyonundan alınan yeni kampanya verisi

| Tohum | Ay | Gerçek sipariş / tamamlanan | Gerçek kayıp / tasfiye | Enerji sıfır örneği | Alaşım sıfır örneği | Negatif stok |
|---|---:|---:|---:|---:|---:|---:|
| 11 | 120 | 269 / 260 | 257 | 38 | 0 | 0 |
| 99 | 120 | 360 / 356 | 152 | 0 | 0 | 0 |
| 404 | 120 | 331 / 326 | 89 | 0 | 0 | 0 |

Beş AI devletinin 0,5 günlük gerçek hareket/üretim/keşif ve aylık ekonomi tikleriyle 120 ayı. Sıfır stok örnekleri devlet-ay sayımıdır. Kayıp sütunu muharebe/korsan kaybı ile ekonomik tasfiyeyi içerir; yeni yaratılan bedelsiz destek değildir. Bunlar bu fazda üretilen yeni dosyalardır: `tests/audit-95c1/regression-navy-seed-{11,99,404}.json`. Eski `navy-95a-after-*` verileri geri korunmuştur. Bu tablo bağımsız kontrollü federasyon savaşı öncesi/sonrası denge ölçümü değildir. Negatif stok olmaması, sıfır enerji örnekleri ve tasfiyeler varken sağlıklı ekonomi kanıtı sayılmaz.
