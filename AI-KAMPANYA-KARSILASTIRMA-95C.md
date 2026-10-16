# AI kampanya karşılaştırması — 95C

Doğal koşular 95B ile aynı 11/99/404 tohumlarında, gerçek günlük/aylık motorla 120 ay yürütüldü. Kontrollü koşular aynı başlangıç dünyasında kurulmuş gerçek 92A destek cepheleri, 10/15/20 gemili üç ordu, geride muhafızlar, gerçek tersaneler, başlangıç stokları ve düşman kuvvetleri kullanır. Bunlar sentetik başlangıç senaryolarıdır; oyun sırasında gemi/kaynak hibesi yapılmaz. Mevcut üretim, bakım, muharebe, ikmal, siyaset ve barış motorları açıktır.

## Doğal kampanyalar

| Tohum | Ay | Ortak sefer | Aylık dünya / RNG | Negatif stok örneği | Host ms 95B → 95C |
|---|---:|---:|---|---:|---:|
| 11 | 120 | 0 | Birebir aynı | 0 → 0 | 7536 → 11475 |
| 99 | 120 | 0 | Birebir aynı | 0 → 0 | 6975 → 10334 |
| 404 | 120 | 0 | Birebir aynı | 0 → 0 | 34828 → 12635 |

Üç doğal örnekte uygun ortak savaş yoktur; sıfır sefer siyasi kuralın atlanmadığını gösterir, doğal savaş koordinasyonunun başarısını kanıtlamaz. 95B keşif/koloni/üretim ve diğer aylık değerleri bu koşullarda değişmedi. Ana simülasyon kaynak hashleri son kaynakla eşleşir. Sonradan yalnız UI aç/kapat ve açık panel yenileme düzeltmesi yapıldı; UI ayrı hedefli testlerle doğrulandı.

## Kontrollü savaş ve gerçek maliyet

| Tohum | Gerçek süre 95B → 95C (ay) | Başlatılan sefer 95C | Hedefe ulaşan plan/filo 95C | İlk 12 ay gerçek müttefik muharebe kaybı 95B → 95C | İlk üç filonun 95C varış farkı (gün) |
|---|---:|---:|---:|---:|---:|
| 11 | 28 → 120 | 4 | 14 | 41 → 4 | 0.00 |
| 99 | 77 → 120 | 2 | 8 | 45 → 7 | 0.00 |
| 404 | 73 → 120 | 7 | 33 | 47 → 3 | 0.00 |


İlk ortak seferin gerçek toplanma ve varış süreleri:

| Tohum | Toplanmadan çıkışa (oyun günü) | Üç ilk filo için gerçek hedef varış günleri |
|---|---:|---|
| 11 | 10.00 | 116.5, 116.5, 116.5 |
| 99 | 10.00 | 116.5, 116.5, 116.5 |
| 404 | 10.00 | 116.5, 116.5, 116.5 |

95B koşuları oyuncunun oyun sonu koşulu nedeniyle 28/77/73. aylarda bitti; 95C üçünde de 120 ayı tamamladı. Uzun toplamlar bu nedenle doğrudan aynı süre kıyası değildir. Ortak ilk 12 aylık pencere yukarıda özellikle ayrıldı. Hedefe varış sayısı `(plan, filo)` olarak tekilleştirilir; ara düğüm geçişleri hedef başarısı sayılmaz. Sonraki seferde aynı filo yeni bir görev varışı olabilir.

| Tohum | Bakım enerji 95B → 95C (ilk 12 ay) | Bakım alaşım 95B → 95C | Gerçek gemi üretim alaşımı 95B → 95C | Gerçek gemi üretim minerali 95B → 95C |
|---|---:|---:|---:|---:|
| 11 | 2109.2 → 4165.6 | 338.4 → 624.8 | 1784.0 → 1531.0 | 720.0 → 3165.0 |
| 99 | 1816.2 → 3957.7 | 286.2 → 608.0 | 1780.0 → 1523.0 | 2145.0 → 3070.0 |
| 404 | 1787.2 → 4271.8 | 290.1 → 634.2 | 1758.0 → 1554.0 | 1165.0 → 3340.0 |

Bakım mevcut motorun aylık hesapladığı gerçek giderdir; gemi üretimi başarılı `queueShip` öncesi/sonrası stok farkıdır. Bunlar bütün ekonomi giderleri değildir: binalar, fonlar, diplomasi, ticaret ve koloniler de gerçek motorlarında kalır. Korunan daha çok gemi daha fazla bakım gerektirebilir.

| Tohum | Bütün gözlem süresinde müttefik askerî gemi kaybı 95B → 95C | 95C bekleme filo-günü | Düşük ikmal filo-günü | Rota/toplanma ret girişimi | Negatif stok 95C | Enerji/alaşım sıfır-stok örnekleri 95B → 95C | Paylaşım durumları 95C |
|---|---:|---:|---:|---:|---:|---:|---|
| 11 | 42 → 99 | 737.0 | 0.0 | 0 | 0 | 0 → 0 | Teklif yok |
| 99 | 95 → 27 | 564.8 | 0.0 | 0 | 0 | 0 → 0 | Teklif yok |
| 404 | 70 → 125 | 2514.5 | 0.0 | 0 | 0 | 0 → 0 | Teklif yok |

Bu uzun gözlem kayıpları muharebe dışı tasfiye/yıpranmayı da içerebilir; gerçek muharebe defteri ilk tabloda ayrıca ayrıldı. Daha uzun 95C koşusunda sonraki savaş/ekonomi kayıpları artabilir. Sıfır negatif stok ekonominin çökmeyeceğini kanıtlamaz; sıfır-stok örnekleri de bu yüzden gösterilir. Başarı yalnız daha fazla saldırı veya daha çok sefer olarak değerlendirilmedi.

## Gerçek savaş katkıları — ortak ilk 12 ay

| Tohum | 95C devlet 1 gerçek gövde hasarı | Devlet 2 | Devlet 3 |
|---|---:|---:|---:|
| 11 | 2280.4 | 494.9 | 549.4 |
| 99 | 2231.5 | 506.6 | 586.6 |
| 404 | 2157.8 | 486.7 | 599.8 |

Katkı doğrudan eski cephe defterinden alınır. Ortak göreve atanmak hasar puanı vermez. Otomatik mülkiyet paylaşımı eklenmedi; teklif/oybirliği/uygulama geçmişi ham JSON içinde saklanır. Yeni coğrafi tercih katkı oranını sahiplik hakkına dönüştürmez.

## Performans ve sınırlar

100 sistem / 13 toplam devlet girişli kontrollü rota ölçümü: üç gerçek tahsisli filoyla beş planın medyanı 16 ms; aralık 14–41 ms. Azami 24 tahsisli filo stresi 100 ms ve 160 bilinen rota sorgusu. Değişmeyen planın 1000 geçerlilik kontrolü 12 ms, ek rota sorgusu 0.

Planlar mevcut hareket döngüsünden ayrı, beş oyun günü/ay bütçesinde çalışır. Bu host süreleri Android FPS/ısı/bellek garantisi değildir. Doğal koşu süreleri eşzamanlı yükten etkilenir; tablodaki süre farklarından net hızlanma/yavaşlama yüzdesi çıkarılmamalıdır. Üç kontrollü başlangıç ve üç doğal tohum bütün uzun dönem dengeyi veya tüm federasyon türlerinin doğal savaş sıklığını kanıtlamaz. Fiziksel Android ve gerçek DOM kabulü yapılmadı.

Ham kanıtlar: `tests/campaign-95c/*.json`, türetilmiş özet `tests/audit-95c/campaign-summary.json`, rota ölçümü `tests/audit-95c/performance.json`. Eski geliştirme denemeleri korunur; ana karşılaştırma yalnız `before/after-SEED` ve `controlled-before/after-SEED` adlarını kullanır.
