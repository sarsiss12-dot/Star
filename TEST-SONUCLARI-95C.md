# Test sonuçları — 95C

Son birleşik sonuç: **79 test paketi / 4823 başarılı kontrol / 0 kalan hata / 0 zaman aşımı**. Her benzersiz kontrol bir kez sayıldı. Tam koşu, kök nedeni belirlenmiş yedi koruma hatasından sonra yalnız ilgili paketler ve son UI/koordinasyon ekleriyle takip edildi. Başarılı paketler sebepsiz yeniden çalıştırılmadı.

- Başlangıç: ZIP SHA-256/CRC ve 1765 manifest kaydı; GitHub main verilen yayın commit'iyle aynı. 95A 51 ve 95B 68 hedefli kontrol yeniden geçti.
- Tam koşu: 79 paket, 4813 başarılı / 7 hata. O sırada 95C paketi 56 kontrol içeriyordu.
- Altı HTML koruma paketi: 517 başarılı / 0 hata; bilim UI paketi 20 / 0.
- Son 95A: 51 / 0; son 95B: 68 / 0; son 95C: **59 / 0**.
- Native Canvas, kamera, ekonomik ticaret, savaş görünürlüğü, araştırma, lojistik/şablon/takviye ve Save v8 paketleri birleşik son dizinde yer alır.
- 92A katkı 34 / 0; 92B teklif 33 / 0; 92C gerçek devir 28 / 0; 92D gündem 14 / 0. Standart muharebe 24 / 0, korsan muharebe 21 / 0.

## Kök nedenler ve düzeltilen uçlar

1. 95A seferi tek devletin kuvvetini topluyordu; 95B siyasi katılımı hareket hedeflerine bağlamıyordu. Aynı 92A sefer/tarafına bağlı ortak plan ve gerçek filo rezervasyonu eklendi.
2. `combatTick` yalnız ilk düşman çiftini çözüyordu. Aynı aktif seferdeki gerçek aktörler, paylaştırılmış tek atış bütçesiyle aynı `battleRound` yoluna bağlandı; gerçek gövde azalması katkı toplamıyla eşleşti.
3. Kolonisiz, savunmasız ve düşman filosuz yörüngede çatışma başlamadığı için gerçek varış fethe dönüşmüyordu. Ortak görev mevcut `captureSystem` kapısını yalnız bu gerçek koşullarda kullanır.
4. Hedefi hiç gözlemlememiş üyenin sonsuz tahmini diğerlerini gereksiz durdurabiliyordu. Yalnız mevcut gözlem değerlendirilir; bir ortağın gördüğü tehlike diğerlerinin risk hesabına dahil edilir.
5. Yeniden hedeflemede yalnız önceki ortak planın kendi filoları devralınabilir; bağımsız kritik hareketi olan filo artık uygun sayılmaz.
6. İzin değişince genel hareket motorunun bilinmeyen alternatif aramasına ortak filonun düşmesi engellendi. Bilinen düşman ara düğümlerinden tek tek toplanma veya sessizce geçme yoktur.
7. 95B'nin kanonik HTML'indeki federasyon CSS bloğu, eski HTML koruma yardımcısına eklenmemişti. Dokunulmamış 95B kaynak/yardımcısıyla da ret üretildiği ayrıca kanıtlandı. 95B CSS'i ayrı SHA-256 ile sabitlendi; eski HTML ve bilim CSS hashleri aynen kaldı. Federasyon CSS'ini bozma da artık negatif testtir. Eski raporun 4764 sayısı referanstır; kaynakta bulunan bu tutarsızlık saklanmadı.
8. Açılmış destek bölümü periyodik panel yenilemesinde açık kalır. Açık diplomasi/federasyon bileşeni beş günlük oyun aralığında güncellenir; değişmeyen durumda DOM tekrar üretilmez. Scroll korunur. Açıkça paylaşılan oyuncu hedef filosunun gerçek gücü destek değerlendirmesine dahil edilir; filosuna emir verilmez.

## 95C hedefli kapsama

Üç gerçek müttefik; farklı hız/ETA ve hızlı filonun beklemesi; otomatik düşman federasyonu; yeterli/yetersiz kuvvet; kapalı sınır; kayıp toplanma; geciken/yok olan destek; savunma muhafızı/ana tehditte geri çağırma; gerçek ikmal dönüşü; federasyon dışı ittifak ve aktif savaş sözü; bilim/ticarette izinsiz katılım olmaması; barış/dağılma/üyenin çıkışı; üç oyuncu talebi, ret, kabul, iptal ve eski dünya UI eylemi; yabancı sahiplik; tek rezervasyon; bilinmeyen ara düğüm/gizli filo sızıntısı olmaması; aynı gün tekrar/RNG; gerçek muharebe katkısı; otomatik paylaşım devri olmaması; Save v8 alanları, bozuk yüklemede rollback ve yükleme sonrası aynı gerçek varış/RNG; history sınırı; mevcut şablon/takviye kullanımı; açık bölüm/scroll/DOM değişmeme koruması.

## Kampanya ve performans

Üç doğal tohumun 120 ayı tamamlandı; dünya/RNG 95B ile aynı. Üç kontrollü savaş başlangıcında 95B 28/77/73 ayda oyun sonuna ulaştı, 95C üçünde 120 ay sürdü. Ortak 12 ay, gerçek bakım/üretim, sonraki uzun kayıplar ve sıfır-stok örnekleri karşılaştırma belgesindedir. Aynı geminin ara düğüm geçişi hedef başarısı sayılmaz.

100 sistemde 24 gerçek tahsisli filo stresi ve 1000 değişmeyen plan denetimi ölçüldü. Ham süreler performans JSON'unda; Android FPS iddiası değildir.

## Kabul sınırı ve yeniden üretim

Fiziksel Android veya gerçek tarayıcı DOM kabulü yoktur. Playwright girişimi Chromium yürütülebilir dosyası bulunmadığı için çalışmadı; yeni tarayıcı indirilmedi. Host UI testleri cihaz kabulü sayılmaz.

Kanıt dizini: `tests/summary-95c.json`; tam ham koşu `tests/logs-95c-final`, yalnız etkilenen takip `tests/logs-95c-followup`, son hedefli loglar `tests/audit-95c`. İlk başarısız denemeler de korunmuştur. Kampanya aracı `tests/measure-joint-95c.js`, kontrollü senaryo `tests/controlled-joint-95c.js`, performans `tests/measure-performance-95c.js`; rapor türetme `tests/report-95c.py`. `tests/run-all.js` paket başına zaman sınırı kullanır.
