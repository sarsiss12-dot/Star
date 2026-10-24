# 96H.0 — Ekonomik karar denetimi

Yayımlanan AI, ekonomi, diplomasi ve ticaret motorları 96G.2 ile aynıdır. Dört sınırlı kuyruk denemesi kabul edilmedi. Bu dosya bir denetim sonucudur; çözülmeyen sorunu düzeltilmiş diye tanıtmaz.

## Seed 404
Devlet 7, 107. ayda 24:1 kolonisini ve devlet 2'nin ödediği iki kale emrini devralır. Ebeveynin emirleri 100. ve 106. aylarda verdiği karar izinde görülür. Yeni devlet bu iki emri oluşturmaz. Ayrılık gezegenin kuyruk nesnesini korurken ebeveynin diğer üretici kolonileri yeni devlete geçmez.
İlk fabrika 113. ayda gerçek 170 maden ödenerek alınır. Kale önceliği nedeniyle 119. aya kadar bekler, 122. ayda tamamlanır. Tek fabrika nüfusun tüketimini karşılamaz: 122. ayda net tüketim -4,42; sonraki nüfus/toparlanma değişimleriyle açık devam eder. İkinci fabrika 165., üçüncü 168. ayda tamamlanır. Kritik tüketim aralığı 119–167; 49 ardışık devlet-aydır.
İlk gecikmenin mekanizması devralınan sıra ve iki iş sınırıdır. 49 ayın tamamını yalnız bu gecikmeye bağlamak doğru değildir. Sonraki üretim kapasitesi, maden maliyeti, büyüyen tüketim ve diğer inşaatlar da izlenmelidir.

## Seed 11
178. ayda devlet 4'ün maden stoğu 1,76, neti -0,97 iken enerjisi 9128,21'dir; mevcut maden emrinin 13 günü kalmıştır. Kampanya protokolünde konsey kapalıdır. Borsa, council.laws.borsaKur gerektirdiği için enerji stoğuyla doğrudan piyasa alımı yapılamaz.
Yeni devlet 7'de 219. ayda net maden -31,57, stok 62,59; dört dökümhane ve fabrika girdi tüketir. Çiftlik 38 gün ve maden 72 gün olarak aynı sıradadır. aiRecoverEconomy, colonyJobs>0 iken yıkımla toparlanma uygulamaz. Ücretli işler, stok erimesi ve girdi üretiminin birlikte zamanlanması sonraki çalışmanın konusudur. Bu faza genel bonus veya borsa açma kuralı eklenmedi.

## Diğer seed'ler
- 7: kritik dönemler devlet 3'te 28. ay tüketim, 38–41. ay alaşım. 28. ayda ücretli fabrikanın 11 günü kalır. Kökeni değişen devlet 2'dir; devlet 3'ün krizini doğrudan köken değişimine atfetmek yeterli kanıt değildir.
- 42: 12. ayda devlet 4 maden açığı yaşar; mevcut dökümhane yıkımının 12, maden inşasının 44 günü kalır. 116. ayda devlet 3'te bir enerji kritik ayı vardır. Altın Çağ'ın kaldırılması başlangıç avantajını azaltır; bu tek başına AI hesap hatası değildir.
- 123: 6–8. ay devlet 5'in maden açığı vardır; birden fazla kolonide fabrika/santral/maden ücretli üretimi sürer. Değişen köken devlet 1'dedir. İki olguyu aynı aktörün doğrudan nedeni gibi sunmamak gerekir.
- 23: ilk kritik ay, Taht Gemisi civic'i bulunan devlet 2'nin enerji yüküyle birlikte görülür. 236/239. ay savaş açan devletlerin kayıtlı temel gelirleri pozitiftir. Geç savaşlar bu ölçütte yeni kritik devlet-ay üretmez; yalnız savaş sayısından ekonomik karar hatası sonucu çıkarılmadı.
- 99: 57 teslimat ve 47 teknoloji dahil 96G.2 iyileşmeleri yeni koşuda korundu.

## Yayımlanmayan deneyler — 404/240 ay
| Sürüm | Kritik devlet-ay | Teslimat | Güç | Tamamlanan/başarısız plan |
|---|---:|---:|---:|---:|
| 96G.2 | 49 | 717 | 75500 | 17/9 |
| A: tek seferlik ücretli üretici önceliği | 28 | 454 | 65446 | 12/12 |
| B: kuruluş takibi | 30 | 562 | 82366 | 11/12 |
| C: devralınan işler bitene kadar takip | 30 | 562 | 82366 | 11/12 |
| D: yalnız mevcut ücretli üreticiyi öne alma | 23 | 582 | 68016 | 10/10 |

Kritik ayın azalması kabul için tek başına yeterli görülmedi. Ticaret ve plan sonuçları korunamadığı için dört deneme de geri alındı. A ve D için 11/240 kontrolü temel sonuçları değiştirmedi. Kaynaklar ve ham çıktılar tests/audit96h0/experiments altındadır; nihai oyun kaynağı değildir.

## Kanonik veri seçimi
G2 temel 8 kısa/4 uzun koşu first-pool altında; dört birleşik yoğunluk koşusunun kanonik örnekleri campaigns altındadır. Yoğunluk first-pool kopyaları deney hash'i taşır. quality-96h0.py dosya adından bağımsız olarak main.js=ed25c388ce8d965175cf276ec161e06285d283cf984149ae0922c45ce6a35bf9 koşulunu zorunlu tutar. baseline-selection.json gerçek seçilen yolları kaydeder.

Nihai 16 H0 koşusu doğru G2 kayıtlarıyla aylık veriler, eylem izi, savaş kaydı, RNG ve son Save hash'i bakımından eşleşir. Nihai kritik değerler 120 ay toplam 14; 240 ay seed 404/11/42/23 için 49/10/2/1 olarak kalır.
