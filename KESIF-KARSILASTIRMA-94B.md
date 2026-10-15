# 94A → 94B: gerçek oyun döngüsünde keşif karşılaştırması

Normal zorluk, orta sarmal galaksi; 11/99/404 tohumları, 120 ay, yarım günlük
adımlar. `dailyTick`, `structTick`, `colonyBuildTick`, `autoExploreTick` ve
`monthTick` gerçek üretim fonksiyonlarıdır. Kriz/konsey/kalıntı kapalı;
varsayılan korsanlar açık. Ayrıca tohum 11'de iki sürümün de başlangıç
korsanları ve korsan doğumu kapatılarak 120 aylık kontrol yapılmıştır.

Sayılara oyuncu ve beş normal AI dahildir. Sistem sayıları devlet–sistem
çiftidir; aynı sistemin iki devletçe taranması iki kayıt sayılır. `Tarama`
yalnız yeni tamamlanan `doSurvey` işlemidir. `Bilinen` son taranmış sistem
sayısıdır (başlangıç keşifleri dahil). Kayıp, canlı gemi nesnesinin ortadan
kalkmasıdır; filo değiştirip yaşayan gemi kayıp sayılmaz. Bilim gemilerinin
bütün görevleri izlenir; sadece ideal otomatik keşif vakaları seçilmez.

Çakışma: aynı devletin aynı taranmamış hedefe ikinci keşif görevini vermesi.
İkmal ricadı hareketi görev çakışmasına dahil edilmez; varışta gerçek tarama
başlarsa dahil edilir. Yarım günlük örneklerde ek geminin beklediği süre
ayrıca `duplicateShipDays` olarak ham JSON'da bulunur.

## Toplamlar

| Tohum | Sürüm | Tarama | Bilinen | Çakışma | Kayıp | Boş gemi-gün | Boş oranı | Tarama/100 gemi-gün | Host sn |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 11 | 94A | 109 | 115 | 28 | 29 | 9938.5 | %64.8 | 0.711 | 3.342 |
| 11 | 94B | 135 | 141 | 0 | 28 | 20475.0 | %71.6 | 0.472 | 5.814 |
| 99 | 94A | 99 | 105 | 21 | 28 | 17548.0 | %78.4 | 0.442 | 5.831 |
| 99 | 94B | 75 | 81 | 0 | 28 | 13933.0 | %60.2 | 0.324 | 5.428 |
| 404 | 94A | 115 | 121 | 38 | 46 | 3637.0 | %36.1 | 1.141 | 2.214 |
| 404 | 94B | 125 | 131 | 0 | 11 | 24585.0 | %73.0 | 0.371 | 6.415 |
| 11-no-pirates | 94A | 141 | 147 | 39 | 12 | 21815.0 | %73.1 | 0.473 | 3.397 |
| 11-no-pirates | 94B | 133 | 139 | 0 | 2 | 31608.5 | %83.7 | 0.352 | 6.860 |

Üç korsanlı kampanyada toplam tarama **323 → 335**, keşif çakışması **87 → 0**,
bilim gemisi kaybı **103 → 67**. Bununla birlikte tohum 99'da tarama **99 → 75**
geriledi. Her galakside daha fazla keşif veya daha az kayıp garanti edilmiyor.

Boşta geçen süreye güvenli bekleme, ikmal/tehdit nedeniyle bekleme, bütün
uygun hedeflerin bitmesi ve manuel boş gemiler dahildir. 94B'de daha fazla
gemi daha uzun yaşadığı için toplam gemi-gün ve boş süre artar; gemi-gün
başına keşif oranı düşmektedir. Güvenli sapma ve ikmal dönüşleri de yolculuk
maliyeti getirir. Bu oranlar saklanmadı ve sadece toplam tarama artışıyla
"her bakımdan verimlilik arttı" sonucu çıkarılmadı.

Host süreleri çizim içermeyen Node simülasyonudur; gözlemci dahil duvar saati
ölçülür. Bazı çalışmalarda regresyon aynı hostta sürdüğünden süreler yaklaşık
karşılaştırmadır. Bunlar Android FPS ölçümü değildir. 94B güvenlik planlaması
ek CPU işi yapmaktadır. Bir kampanya 7.200 yarım günlük adım içerir.

Keşif zamanlaması temas, ödül, ekonomi ve savaş RNG akışını etkiler; sürümler
ilerledikçe farklı kampanyalara dönüşür. Aynı sürümün deterministik tekrar
ve gözlemci açık/kapalı kontrolleri ayrıca donanma regresyonunda geçmiştir.

## Devlet bazında (94A → 94B)

| Tohum | Devlet | Tarama | Kayıp | Boş gemi-gün | Çakışma |
|---|---|---:|---:|---:|---:|
| 11 | Oyuncu 0 · Exploration audit | 13 → 13 | 0 → 0 | 3128.5 → 3128.5 | 0 → 0 |
| 11 | AI 1 · Veyra Tahtı | 30 → 31 | 10 → 4 | 465.5 → 4840.0 | 13 → 0 |
| 11 | AI 2 · Kaevar Mabedi | 4 → 17 | 1 → 4 | 107.5 → 585.0 | 0 → 0 |
| 11 | AI 3 · Analitik Nyx Hanedanlığı | 7 → 10 | 3 → 2 | 4664.0 → 5213.0 | 1 → 0 |
| 11 | AI 4 · Primordial Zharn Meclisi | 25 → 32 | 6 → 11 | 578.5 → 3235.0 | 0 → 0 |
| 11 | AI 5 · Primordial Tarkun Meclisi | 30 → 32 | 9 → 7 | 994.5 → 3473.5 | 14 → 0 |
| 99 | Oyuncu 0 · Exploration audit | 15 → 15 | 1 → 0 | 796.0 → 3035.0 | 0 → 0 |
| 99 | AI 1 · Kaevar İmparatorluğu | 22 → 18 | 8 → 11 | 1529.0 → 1934.0 | 2 → 0 |
| 99 | AI 2 · Kuantum Cyrix Birliği | 24 → 18 | 7 → 10 | 1663.5 → 894.0 | 3 → 0 |
| 99 | AI 3 · Muhteşem Vael Tarikatı | 16 → 9 | 7 → 6 | 3350.5 → 1348.5 | 6 → 0 |
| 99 | AI 4 · Primordial Thalor Federasyonu | 12 → 5 | 5 → 1 | 3647.0 → 0.0 | 1 → 0 |
| 99 | AI 5 · Otonom Draven Ağı | 10 → 10 | 0 → 0 | 6562.0 → 6721.5 | 9 → 0 |
| 404 | Oyuncu 0 · Exploration audit | 2 → 2 | 1 → 1 | 0.0 → 0.0 | 0 → 0 |
| 404 | AI 1 · Vantia İmparatorluğu | 30 → 29 | 10 → 4 | 979.5 → 3933.5 | 11 → 0 |
| 404 | AI 2 · Aethel Sultanlığı | 12 → 7 | 8 → 0 | 524.0 → 6825.5 | 0 → 0 |
| 404 | AI 3 · Yüce Zephyr Lejyonu | 12 → 29 | 10 → 1 | 387.5 → 3782.0 | 0 → 0 |
| 404 | AI 4 · Bilge Aethel Zihni | 29 → 29 | 8 → 4 | 1196.0 → 4943.5 | 16 → 0 |
| 404 | AI 5 · Vantia Birliği | 30 → 29 | 9 → 1 | 550.0 → 5100.5 | 11 → 0 |
| 11-no-pirates | Oyuncu 0 · Exploration audit | 13 → 13 | 1 → 0 | 2420.0 → 3128.5 | 0 → 0 |
| 11-no-pirates | AI 1 · Veyra Tahtı | 31 → 31 | 2 → 0 | 4691.5 → 5828.5 | 14 → 0 |
| 11-no-pirates | AI 2 · Kaevar Mabedi | 26 → 18 | 3 → 0 | 4369.0 → 5935.5 | 6 → 0 |
| 11-no-pirates | AI 3 · Analitik Nyx Hanedanlığı | 7 → 9 | 2 → 2 | 2233.0 → 6207.5 | 2 → 0 |
| 11-no-pirates | AI 4 · Primordial Zharn Meclisi | 31 → 31 | 2 → 0 | 3334.5 → 5049.0 | 17 → 0 |
| 11-no-pirates | AI 5 · Primordial Tarkun Meclisi | 33 → 31 | 2 → 0 | 4767.0 → 5459.5 | 0 → 0 |

Ham ölçümler `tests/exploration-94b/before-*.json` ve `after-*.json` dosyalarıdır.
Her devlet için yolculuk/tarama/boş gemi-gün, bekleme gerekçeleri, toplamlar;
her kampanya için RNG ve tam kayıt hash'i saklanır. `development/` ilk tanı
ölçümleridir; yukarıdaki tablolar yalnız nihai `after-*.json` verisinden üretilir.

93D.1 donanma ekonomisi ayrı sekiz kontrolde korunmuştur: üç tohumda 120 ay,
negatif kaynak yok, gereksiz bilim siparişi yok, bütün sivil gövdeler sayımla
uzlaştırılmış, deterministik tekrar ve gözlemcisiz kayıt hash'i eşleşmiştir.
Askerî üretim bütçesi/tersane seçimi değiştirilmemiştir. Sayısal kampanya
sonuçları keşif ve savaş akışının değişmesi nedeniyle 94A ile aynı değildir.
