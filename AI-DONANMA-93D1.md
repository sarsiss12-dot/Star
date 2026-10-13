# 93D.1 — AI donanma üretimi ve ekonomi ölçümü

## Kaynak ve yöntem

Kanonik `stars-faz93d.zip`: `8883f62090710c6244871be029aeceaa6ad323cda784124f80766897574ea7ac`.
ZIP CRC ve SHA-256 doğrulandı. GitHub kullanılmadı. Önceki kaynak değiştirilmeden ayrı dizinde çalıştırıldı.

Üç tohum, normal zorluk, orta sarmal harita, insan oyuncu; etik nötr, civic yok,
standart köken; harabe/kriz/konsey kapalı. Oyuncuya emir verilmedi. Her kampanya
120 ay; yarım günlük gerçek dailyTick/structTick/colonyBuildTick/autoExploreTick
ve gerçek monthTick. Kaynak veya gemi eklenmedi, savaş zorlanmadı.
Bu koşullar verilen eski sipariş sayılarını üç tohumda da birebir yeniden üretti.

`tests/measure-navy-93d1.js` başarılı queueShip çağrılarını, fiziksel gemi
nesnelerini, savaş/varış/dağıtma kayıplarını ve aylık ekonomi durumunu gözler.
Gemi başka filoya geçince kayıp veya yeni üretim sayılmaz. Gözlemcili/gözlemcisiz
120 aylık seed11 koşusunda tam kayıt SHA ve RNG durumu eşittir. Aynı seed11
tekrarında tam kayıt, RNG ve ölçüm satırları da eşittir.

Sipariş ile tamamlanan gemi ayrıdır. `kor/muh/kru/zir` savaş gemisidir;
`bil/kol/ord/ins` bilim/koloni/ordu taşıma/inşa gemisidir. Ordu taşıma gemileri
sivil/yardımcı sütununda ayrı sınıf olarak gösterilir. Kapasite kullanımı bütün
kapasiteye tabi gemilerin oyun içi değeridir; yalnız savaş gemisi adedi değildir.
Tersane sayısı tersaneli sistem sayısıdır; bir sistemde birden fazla üretim yuvası olabilir.
Kullanım, kampanya boyunca dolu yuva-gün / kullanılabilir yuva-gün oranıdır.

## Toplu önce / sonra

| Seed | Savaş siparişi | Bilim siparişi | Tamamlanan savaş gemisi | 120. ay mevcut savaş gemisi |
|---|---|---|---|---|
| 11 | 8 → 311 | 238 → 37 | 8 → 305 | 11 → 64 |
| 99 | 23 → 302 | 212 → 35 | 23 → 300 | 10 → 192 |
| 404 | 11 → 272 | 237 → 42 | 10 → 265 | 1 → 241 |

## Kanıtlanan nedenler

1. Eski `aiTurn` tek rastgele tersane seçiyor; sivil öncelik zincirinden sonra
   `productionBefore` kontrolü askerî siparişi engelliyordu. Boş diğer tersaneler
   bu kararda değerlendirilmezdi.
2. 500 alaşım ve %90 kapasite koşulu barışta donanmayı uyutuyordu. Bu koldaki
   erken `return`, aiTurn içindeki sonraki hareket/keşif kararlarını da atlayabiliyordu.
   Geliri yeterli fakat stoku 500 altında olan AI için hedefli test artık ücretli
   askerî sipariş üretildiğini doğruluyor.
3. Bilim, koloni ve ordu ihtiyacı gemi adedi yerine rol içeren filo adediyle
   hesaplanıyordu. Aynı filoda biriken gemiler ihtiyacı karşılamış sayılmıyordu;
   bütün tersanelerdeki bekleyen siparişler de ortak envantere katılmıyordu.
   Örneğin eski seed11 AI3 sonunda 26 koloni gemisi taşıyordu.
4. Bilim gemisi kayıpları gerçekti: eski seed11 AI1 105 bilim gemisi tamamladı,
   korsanlara 105 bilim gemisi kaybetti. Kaynak sorunu yalnız filo birleştirmesi
   veya ölçüm yanılgısı değildir. Aşağıdaki muhasebe her AI'ın gerçek kayıplarını
   ve yeniden üretimini ayırır.

## Uygulanan sınırlı düzeltme

- Mevcut ve yoldaki fiziksel gemiler ile tüm sahip olunan tersanelerdeki ücretli
  siparişler aynı envanterde sayılır. Kapasite ve bekleyen gemilerin bakım maliyeti
  satın alma öncesinde hesaba katılır.
- Sabit 500 eşiği yerine stok/gelir, stratejik rezerv, enerji dayanma süresi,
  alaşım bakımı ve gerçek gemi maliyetine bağlı aylık bütçe vardır. Normal planlayıcı
  barışta en fazla 6, savaşta 10 sipariş verir; tersane kapasitesi daha düşük sınır
  koyabilir. Mevcut bağımsız inşa gemisi politikası ayrıca çalışmaya devam eder.
- Barışta kişilik profiline göre yaklaşık %50–76, bilinen soğuk tehditte %80,
  gerçek devlet savaşında %90 kapasite hedefi; satın alma tavanı barışta %92,
  savaşta %100. Bunlar zorunlu harcama değildir: bütçe/enerji engelleri önce gelir.
- Savaşta daha geniş gelir/stok payı ve 12 aylık enerji dayanma koşulu; barışta
  yeni bakımlı gemiden sonra en az +2 net enerji. Ekonomik kriz alışverişi engeller.
  Negatif alaşım netinde kalan stok için 18 aylık bakım güvenliği aranır.
- Askerî üretim ilk payı alır. Uygun durumda sivil ihtiyaç için bir sipariş yeri
  bırakılır. Bilim ihtiyacı en fazla iki gerçek gemi veya bekleyen siparişle karşılanır.
- Bilim gemisi siparişleri arasında en az 120 oyun günü; bütün bilim gemilerinin
  tekrar kaybında 240 ve sonra 360 günlük bekleme. Durum Save v8 içinde korunur.
  Yeni tamamlanan AI bilim gemileri bağımsız filo olur. Yeni güvenli keşif,
  korsandan kaçınma veya hedef rezervasyonu algoritması bu faza eklenmedi.
- Araştırılmış sınıflar ve mevcut askerî kişilik profili sınıf ağırlıklarını belirler.
  Eski/özel şablonlar korunur; bu fazın AI şablonları teknoloji açılınca güncellenir.
  Eksik sınıf mevcut 93C reinforceFleet ve teslim süresi/rota seçimiyle tamamlanır.
  Çok birikmiş tersane kuyruğu elenir; uygun diğer tersaneler kullanılır. Ulaşılamayan
  hedef bütün donanma üretimini kilitlemez: uygun tersanede bağımsız gemi kurulabilir.
  Oyuncu takviyesinin varsayılan seçimi ve 93B hareketli hedef güvenliği korunur.

## Devlet bazında ölçümler

Bütün tablolar gerçek ham JSON'dan üretilmiştir. `önce` 93D, `sonra` 93D.1.
Kampanya yolları üretim değişince ayrılır; savaş süreleri ve doğan isyancı devletler
birebir aynı kalmaz. Dolayısıyla sonuçlar aynı başlangıçtan sistem karşılaştırmasıdır,
aynı savaş olayları altında izole bir nedensel deney değildir. Savaş/barış hedefli
üretim kontrolleri ayrıca sabit koşullu testlerle doğrulanmıştır.

### Seed 11

| Sürüm | AI | Sipariş (sınıf:adet) | Tamamlanan | 120. ay bekleyen | Mevcut savaş | Mevcut sivil/yardımcı |
|---|---|---|---|---|---|---|
| önce | 1 · Veyra Tahtı | bil:106, kol:5, ord:1 | bil:105, kol:5, ord:1 | bil:1 | 0 | bil:1, kol:6, ord:1 |
| önce | 2 · Kaevar Mabedi | bil:44, ord:1 | bil:44, ord:1 | — | 0 | — |
| önce | 3 · Analitik Nyx Hanedanlığı | kol:26, bil:2, ord:1 | kol:25, bil:2, ord:1 | kol:1 | 0 | bil:3, kol:26, ord:1 |
| önce | 4 · Primordial Zharn Meclisi | bil:46, ord:1, kol:3 | bil:46, ord:1, kol:3 | — | 0 | — |
| önce | 5 · Primordial Tarkun Meclisi | bil:40, ord:1, kor:8 | bil:39, ord:1, kor:8 | bil:1 | 11 | bil:1, ord:1 |
| sonra | 1 · Veyra Tahtı | kol:2, bil:9, kor:30 | kol:2, bil:9, kor:29 | kor:1 | 6 | kol:3 |
| sonra | 2 · Kaevar Mabedi | bil:10, kor:42 | bil:10, kor:42 | — | 0 | — |
| sonra | 3 · Analitik Nyx Hanedanlığı | kol:2, kor:65, bil:2, ord:3, ins:2 | kol:2, kor:64, bil:2, ord:3, ins:2 | kor:1 | 26 | — |
| sonra | 4 · Primordial Zharn Meclisi | kor:105, bil:8 | kor:104, bil:8 | kor:1 | 5 | — |
| sonra | 5 · Primordial Tarkun Meclisi | kor:57, ins:1, bil:8, ord:1, muh:12 | kor:56, ins:1, bil:8, ord:1, muh:10 | muh:2, kor:1 | 27 | — |

| Sürüm | AI | Kapasite kullanılan/toplam | Alaşım stok/net ay | Enerji stok/net ay | Tersaneli sistem/yuva | 120 ay yuva kullanımı | Savaşlı ay | Savaşta sipariş | Barışta sipariş |
|---|---|---|---|---|---|---|---|---|---|
| önce | 1 | 15.0/46.0 (32.6%) | 1052.9 / +33.4 | 694.9 / +6.1 | 1 / 1 | 75.8% | 0 | — | bil:106, kol:5, ord:1 |
| önce | 2 | 0.0/46.0 (0.0%) | 11.3 / +5.2 | 0.0 / -12.4 | 1 / 1 | 37.9% | 0 | — | bil:44, ord:1 |
| önce | 3 | 57.0/70.0 (81.4%) | 767.9 / +27.1 | 1413.8 / +4.2 | 1 / 1 | 34.3% | 0 | — | kol:26, bil:2, ord:1 |
| önce | 4 | 0.0/46.0 (0.0%) | 17.4 / +7.8 | 1728.6 / +5.2 | 1 / 1 | 43.2% | 0 | — | bil:46, ord:1, kol:3 |
| önce | 5 | 14.0/76.0 (18.4%) | 17.7 / +21.6 | 8514.9 / +38.3 | 1 / 1 | 36.3% | 0 | — | bil:40, ord:1, kor:8 |
| sonra | 1 | 12.0/47.9 (25.0%) | 19.7 / +18.5 | 925.4 / +1.6 | 1 / 1 | 27.3% | 35 | kor:19, bil:1 | kol:2, bil:8, kor:11 |
| sonra | 2 | 0.0/52.0 (0.0%) | 142.0 / +25.7 | 168.6 / -17.7 | 1 / 1 | 43.3% | 33 | kor:16, bil:3 | bil:7, kor:26 |
| sonra | 3 | 26.0/46.0 (56.5%) | 30.9 / +26.6 | 692.4 / -10.1 | 1 / 1 | 62.8% | 75 | kor:47, kol:1, ord:2, bil:1 | kol:1, kor:18, bil:1, ord:1, ins:2 |
| sonra | 4 | 5.0/66.0 (7.6%) | 54.2 / +38.1 | 8533.4 / +49.6 | 2 / 2 | 67.9% | 75 | kor:71, bil:3 | kor:34, bil:5 |
| sonra | 5 | 37.0/92.0 (40.2%) | 214.3 / +18.4 | 7125.2 / -52.3 | 1 / 1 | 61.7% | 35 | kor:23, muh:12 | kor:34, ins:1, bil:8, ord:1 |

| Sürüm | AI | Başlangıç siviller | Üretim dışı sivil kazanım | Sivil kayıp/ayrılma nedenleri | Filolar arası sivil transfer | 2 bilim kapsanmışken ek sipariş | Bir filoda en çok bilim |
|---|---|---|---|---|---|---|---|
| önce | 1 | bil:1, kol:1 | — | pirate: bil:105 | — | 0 | 1 |
| önce | 2 | bil:1, kol:1 | — | pirate: bil:45, kol:1, ord:1 | — | 0 | 1 |
| önce | 3 | bil:1, kol:1 | — | — | — | 1 | 2 |
| önce | 4 | bil:1, kol:1 | — | pirate: bil:47, kol:4, ord:1 | — | 5 | 1 |
| önce | 5 | bil:1, kol:1 | — | arrival/colonization: kol:1; pirate: bil:39 | — | 0 | 1 |
| sonra | 1 | bil:1, kol:1 | — | pirate: bil:10 | — | 0 | 1 |
| sonra | 2 | bil:1, kol:1 | — | arrival/colonization: kol:1; pirate: bil:11 | — | 0 | 1 |
| sonra | 3 | bil:1, kol:1 | — | enemy: bil:3, kol:3, ord:3, ins:2 | — | 0 | 1 |
| sonra | 4 | bil:1, kol:1 | — | pirate: bil:7; arrival/colonization: kol:1; enemy: bil:2 | — | 0 | 1 |
| sonra | 5 | bil:1, kol:1 | — | arrival/colonization: kol:1; pirate: bil:9; enemy: ord:1, ins:1 | — | 0 | 1 |

| Sürüm | AI | Sipariş engeli / gözlenen tur sayısı |
|---|---|---|
| önce | 1 | legacy-sleep:8 |
| önce | 2 | legacy-sleep:75 |
| önce | 3 | legacy-sleep:69, legacy-no-order:22 |
| önce | 4 | legacy-sleep:70 |
| önce | 5 | legacy-sleep:71 |
| sonra | 1 | energy-runway:35, alloy-budget-reserve:91, resource-cost:18, science-renewal-cooldown:61, science-covered:17 |
| sonra | 2 | energy-runway:33, resource-cost:10, science-renewal-cooldown:92, alloy-budget-reserve:102 |
| sonra | 3 | energy-runway:52, resource-cost:27, alloy-budget-reserve:56, science-covered:75, yard-backlog:17, science-renewal-cooldown:7 |
| sonra | 4 | energy-runway:3, science-covered:7, alloy-budget-reserve:111, science-renewal-cooldown:46, yard-backlog:21, resource-cost:6 |
| sonra | 5 | energy-runway:5, alloy-budget-reserve:39, science-covered:38, science-renewal-cooldown:34, resource-cost:77, yard-backlog:35, deterrence-target:32 |

### Seed 99

| Sürüm | AI | Sipariş (sınıf:adet) | Tamamlanan | 120. ay bekleyen | Mevcut savaş | Mevcut sivil/yardımcı |
|---|---|---|---|---|---|---|
| önce | 1 · Kaevar İmparatorluğu | bil:77, ord:5, kor:4, kol:2 | bil:76, ord:5, kor:4, kol:2 | bil:1 | 0 | — |
| önce | 2 · Kuantum Cyrix Birliği | bil:73, ord:1, kor:7 | bil:73, ord:1, kor:7 | — | 0 | — |
| önce | 3 · Muhteşem Vael Tarikatı | bil:23, ord:2, kor:3, ins:6, kol:3 | bil:22, ord:2, kor:3, ins:5, kol:3 | ins:1, bil:1 | 3 | bil:1, kol:2, ord:2, ins:2 |
| önce | 4 · Primordial Thalor Federasyonu | bil:36, ord:1, kor:5 | bil:35, ord:1, kor:5 | bil:1 | 0 | — |
| önce | 5 · Otonom Draven Ağı | bil:3, ord:12, kor:4, kol:2 | bil:3, ord:12, kor:4, kol:2 | — | 7 | bil:2, ord:12 |
| sonra | 1 · Kaevar İmparatorluğu | bil:11, kor:94, kol:2, ord:1 | bil:11, kor:93, kol:2, ord:1 | kor:1 | 37 | bil:2, ord:1 |
| sonra | 2 · Kuantum Cyrix Birliği | kor:61, bil:9, ord:1, kol:1 | kor:61, bil:9, ord:1, kol:1 | — | 29 | bil:2, ord:1 |
| sonra | 3 · Muhteşem Vael Tarikatı | kor:64, bil:8, kol:8, ord:2, muh:4 | kor:63, bil:8, kol:8, ord:2, muh:4 | kor:1 | 66 | bil:2, ord:1 |
| sonra | 4 · Primordial Thalor Federasyonu | kol:3, bil:6, kor:55, ord:2 | kol:3, bil:6, kor:55, ord:2 | — | 33 | bil:2, ord:2 |
| sonra | 5 · Otonom Draven Ağı | bil:1, kor:24, ord:2, kol:1 | bil:1, kor:24, ord:2, kol:1 | — | 27 | bil:2, kol:1, ord:1 |

| Sürüm | AI | Kapasite kullanılan/toplam | Alaşım stok/net ay | Enerji stok/net ay | Tersaneli sistem/yuva | 120 ay yuva kullanımı | Savaşlı ay | Savaşta sipariş | Barışta sipariş |
|---|---|---|---|---|---|---|---|---|---|
| önce | 1 | 0.0/128.8 (0.0%) | 40.2 / +26.6 | 322.6 / +49.2 | 2 / 3 | 39.8% | 10 | kor:4, bil:3, ord:2 | bil:74, ord:3, kol:2 |
| önce | 2 | 0.0/52.9 (0.0%) | 17.5 / +15.5 | 5132.5 / +15.1 | 1 / 1 | 61.1% | 10 | kor:1, bil:10 | bil:63, ord:1, kor:6 |
| önce | 3 | 14.0/82.0 (17.1%) | 672.1 / +51.2 | 6622.6 / +151.5 | 3 / 7 | 10.5% | 1 | bil:1 | bil:22, ord:2, kor:3, ins:6, kol:3 |
| önce | 4 | 0.0/52.9 (0.0%) | 103.8 / +5.3 | 2004.1 / -8.0 | 1 / 1 | 34.6% | 1 | bil:1 | bil:35, ord:1, kor:5 |
| önce | 5 | 33.0/64.0 (51.6%) | 232.5 / +41.4 | 30652.4 / +513.3 | 2 / 2 | 20.6% | 0 | — | bil:3, ord:12, kor:4, kol:2 |
| sonra | 1 | 41.0/135.7 (30.2%) | 77.1 / +31.3 | 3983.7 / +237.5 | 2 / 2 | 48.4% | 11 | kor:8, bil:1 | bil:10, kor:86, kol:2, ord:1 |
| sonra | 2 | 33.0/59.8 (55.2%) | 361.4 / -2.6 | 6976.2 / +244.2 | 1 / 1 | 54.7% | 11 | kor:14 | kor:47, bil:9, ord:1, kol:1 |
| sonra | 3 | 74.0/94.0 (78.7%) | 84.0 / +34.7 | 11855.0 / +267.6 | 4 / 4 | 30.9% | 0 | — | kor:64, bil:8, kol:8, ord:2, muh:4 |
| sonra | 4 | 39.0/73.6 (53.0%) | 434.5 / +12.5 | 7565.9 / +198.5 | 1 / 1 | 56.9% | 0 | — | kol:3, bil:6, kor:55, ord:2 |
| sonra | 5 | 33.0/52.0 (63.5%) | 2501.9 / +48.5 | 15538.2 / +139.4 | 1 / 1 | 24.5% | 0 | — | bil:1, kor:24, ord:2, kol:1 |

| Sürüm | AI | Başlangıç siviller | Üretim dışı sivil kazanım | Sivil kayıp/ayrılma nedenleri | Filolar arası sivil transfer | 2 bilim kapsanmışken ek sipariş | Bir filoda en çok bilim |
|---|---|---|---|---|---|---|---|
| önce | 1 | bil:1, kol:1 | — | arrival/colonization: kol:2; pirate: bil:77, kol:1, ord:5 | — | 0 | 1 |
| önce | 2 | bil:1, kol:1 | — | pirate: bil:67, kol:1, ord:1; enemy: bil:7 | — | 0 | 1 |
| önce | 3 | bil:1, kol:1 | — | arrival/colonization: kol:2; pirate: bil:22, ins:3 | — | 0 | 1 |
| önce | 4 | bil:1, kol:1 | — | pirate: bil:36, kol:1, ord:1 | — | 0 | 1 |
| önce | 5 | bil:1, kol:1 | — | arrival/colonization: kol:3; pirate: bil:2 | — | 0 | 1 |
| sonra | 1 | bil:1, kol:1 | — | arrival/colonization: kol:3; pirate: bil:9; enemy: bil:1 | — | 0 | 1 |
| sonra | 2 | bil:1, kol:1 | — | pirate: bil:8, kol:1; arrival/colonization: kol:1 | — | 0 | 1 |
| sonra | 3 | bil:1, kol:1 | — | arrival/colonization: kol:4; pirate: bil:7, kol:5, ord:1 | — | 0 | 1 |
| sonra | 4 | bil:1, kol:1 | — | arrival/colonization: kol:3; pirate: bil:5, kol:1 | — | 0 | 1 |
| sonra | 5 | bil:1, kol:1 | — | arrival/colonization: kol:1; pirate: ord:1 | — | 0 | 1 |

| Sürüm | AI | Sipariş engeli / gözlenen tur sayısı |
|---|---|---|
| önce | 1 | legacy-sleep:32 |
| önce | 2 | legacy-sleep:39 |
| önce | 3 | legacy-sleep:89 |
| önce | 4 | legacy-sleep:78 |
| önce | 5 | legacy-sleep:99 |
| sonra | 1 | energy-runway:44, resource-cost:38, alloy-budget-reserve:74, science-renewal-cooldown:68, science-covered:28, yard-backlog:4 |
| sonra | 2 | energy-runway:6, alloy-budget-reserve:54, science-covered:29, science-renewal-cooldown:65, yard-backlog:7, resource-cost:64, deterrence-target:48 |
| sonra | 3 | energy-runway:16, alloy-budget-reserve:88, science-covered:54, science-renewal-cooldown:47, deterrence-target:26, resource-cost:17 |
| sonra | 4 | energy-runway:13, alloy-budget-reserve:79, science-covered:50, science-renewal-cooldown:42, resource-cost:27, yard-backlog:7, deterrence-target:15 |
| sonra | 5 | energy-runway:3, science-covered:119, alloy-budget-reserve:60, deterrence-target:63, resource-cost:58 |

### Seed 404

| Sürüm | AI | Sipariş (sınıf:adet) | Tamamlanan | 120. ay bekleyen | Mevcut savaş | Mevcut sivil/yardımcı |
|---|---|---|---|---|---|---|
| önce | 1 · Vantia İmparatorluğu | bil:17, ord:4, kol:2, ins:7, kor:9, muh:1 | bil:16, ord:4, kol:2, ins:7, kor:9, muh:1 | bil:1 | 1 | bil:1, ord:4 |
| önce | 2 · Aethel Sultanlığı | bil:57, ord:3, kol:9, ins:2 | bil:56, ord:3, kol:9, ins:2 | bil:1 | 0 | bil:1, ins:1 |
| önce | 3 · Yüce Zephyr Lejyonu | bil:1, ord:4, ins:2, kor:1 | bil:1, ord:3, ins:2 | ord:1, kor:1 | 0 | bil:2, kol:1, ord:3 |
| önce | 4 · Bilge Aethel Zihni | bil:63, ord:10, kol:5 | bil:62, ord:10, kol:5 | bil:1 | 0 | bil:1, kol:1 |
| önce | 5 · Vantia Birliği | bil:90, kol:3, ord:1 | bil:90, kol:2, ord:1 | kol:1 | 0 | ord:1 |
| önce | 7 · Küllerden Doğan Konfederasyon (Elovos II) | — | — | — | 0 | — |
| önce | 8 · Hür Yıldızlar Meclisi (Elovos I) | bil:9 | bil:8 | bil:1 | 0 | — |
| sonra | 1 · Vantia İmparatorluğu | bil:9, kor:41, kol:3, ord:1, ins:2 | bil:9, kor:41, kol:3, ord:1, ins:2 | — | 41 | kol:2, ord:1, ins:2 |
| sonra | 2 · Aethel Sultanlığı | kor:50, bil:7, kol:2, ins:1, muh:5 | kor:49, bil:7, kol:2, ins:1, muh:3 | muh:2, kor:1 | 40 | — |
| sonra | 3 · Yüce Zephyr Lejyonu | bil:10, kor:80 | bil:9, kor:79 | kor:1, bil:1 | 71 | — |
| sonra | 4 · Bilge Aethel Zihni | bil:7, kor:36, ord:1, kol:1, muh:8 | bil:7, kor:36, ord:1, kol:1, muh:5 | muh:3 | 37 | ord:1 |
| sonra | 5 · Vantia Birliği | bil:9, kor:52, kol:6, ord:2 | bil:9, kor:52, kol:6, ord:2 | — | 52 | ord:1 |

| Sürüm | AI | Kapasite kullanılan/toplam | Alaşım stok/net ay | Enerji stok/net ay | Tersaneli sistem/yuva | 120 ay yuva kullanımı | Savaşlı ay | Savaşta sipariş | Barışta sipariş |
|---|---|---|---|---|---|---|---|---|---|
| önce | 1 | 10.0/98.9 (10.1%) | 808.4 / +94.0 | 26817.3 / +229.0 | 4 / 5 | 11.5% | 15 | ord:1, bil:13, muh:1 | bil:4, ord:3, kol:2, ins:7, kor:9 |
| önce | 2 | 2.0/100.0 (2.0%) | 267.5 / +111.6 | 30962.7 / +403.5 | 5 / 6 | 16.4% | 15 | ins:1, bil:2 | bil:55, ord:3, kol:9, ins:1 |
| önce | 3 | 10.0/96.0 (10.4%) | 267.0 / +24.5 | 12011.1 / +40.1 | 1 / 1 | 5.6% | 3 | ord:2, kor:1 | bil:1, ord:2, ins:2 |
| önce | 4 | 3.0/88.0 (3.4%) | 1477.0 / +63.3 | 19047.0 / +751.6 | 2 / 2 | 44.0% | 0 | — | bil:63, ord:10, kol:5 |
| önce | 5 | 2.0/58.0 (3.4%) | 1137.9 / +48.8 | 467.9 / +240.5 | 2 / 2 | 49.9% | 0 | — | bil:90, kol:3, ord:1 |
| önce | 7 | 0.0/46.0 (0.0%) | 80.0 / +0.0 | 0.0 / -10.3 | 0 / 0 | 0.0% | 15 | — | — |
| önce | 8 | 0.0/46.0 (0.0%) | 4.0 / +0.0 | 0.0 / +1.2 | 1 / 1 | 100.0% | 3 | bil:3 | bil:6 |
| sonra | 1 | 49.0/81.7 (60.0%) | 252.0 / +42.2 | 22665.6 / +389.4 | 2 / 3 | 22.8% | 0 | — | bil:9, kor:41, kol:3, ord:1, ins:2 |
| sonra | 2 | 43.0/88.0 (48.9%) | 96.6 / +85.3 | 13967.3 / +125.0 | 3 / 3 | 22.4% | 11 | kor:7, bil:1, muh:5 | kor:43, bil:6, kol:2, ins:1 |
| sonra | 3 | 71.0/121.0 (58.7%) | 88.5 / +44.2 | 8013.3 / +53.5 | 2 / 2 | 35.0% | 0 | — | bil:10, kor:80 |
| sonra | 4 | 44.0/97.0 (45.4%) | 74.3 / +25.9 | 36864.6 / +503.6 | 1 / 1 | 40.8% | 0 | — | bil:7, kor:36, ord:1, kol:1, muh:8 |
| sonra | 5 | 54.0/103.0 (52.4%) | 1014.5 / +77.4 | 23618.0 / +443.7 | 4 / 4 | 26.3% | 0 | — | bil:9, kor:52, kol:6, ord:2 |

| Sürüm | AI | Başlangıç siviller | Üretim dışı sivil kazanım | Sivil kayıp/ayrılma nedenleri | Filolar arası sivil transfer | 2 bilim kapsanmışken ek sipariş | Bir filoda en çok bilim |
|---|---|---|---|---|---|---|---|
| önce | 1 | bil:1, kol:1 | — | arrival/colonization: kol:3; pirate: bil:16, ins:7 | — | 1 | 1 |
| önce | 2 | bil:1, kol:1 | — | arrival/colonization: kol:7; pirate: bil:56, kol:3, ord:3, ins:1 | — | 7 | 2 |
| önce | 3 | bil:1, kol:1 | — | pirate: ins:2 | — | 0 | 1 |
| önce | 4 | bil:1, kol:1 | — | arrival/colonization: kol:3; pirate: bil:62, kol:2, ord:10 | — | 2 | 2 |
| önce | 5 | bil:1, kol:1 | — | arrival/colonization: kol:2; pirate: bil:91, kol:1 | — | 23 | 2 |
| önce | 7 | — | — | — | — | 0 | 0 |
| önce | 8 | — | — | pirate: bil:8 | — | 0 | 1 |
| sonra | 1 | bil:1, kol:1 | — | arrival/colonization: kol:2; pirate: bil:10 | — | 0 | 1 |
| sonra | 2 | bil:1, kol:1 | — | arrival/colonization: kol:3; pirate: bil:8, ins:1 | — | 0 | 1 |
| sonra | 3 | bil:1, kol:1 | — | arrival/colonization: kol:1; pirate: bil:10 | — | 0 | 1 |
| sonra | 4 | bil:1, kol:1 | — | arrival/colonization: kol:2; pirate: bil:8 | — | 0 | 1 |
| sonra | 5 | bil:1, kol:1 | — | arrival/colonization: kol:7; pirate: bil:10, ord:1 | — | 0 | 1 |

| Sürüm | AI | Sipariş engeli / gözlenen tur sayısı |
|---|---|---|
| önce | 1 | legacy-sleep:86, legacy-no-order:1 |
| önce | 2 | legacy-sleep:48, legacy-no-order:3 |
| önce | 3 | legacy-sleep:114 |
| önce | 4 | legacy-sleep:42 |
| önce | 5 | legacy-sleep:26 |
| önce | 7 | no-yard:17 |
| önce | 8 | — |
| sonra | 1 | energy-runway:7, resource-cost:1, alloy-budget-reserve:91, science-covered:35, science-renewal-cooldown:57, deterrence-target:27 |
| sonra | 2 | energy-runway:10, resource-cost:7, alloy-budget-reserve:107, science-renewal-cooldown:55, yard-backlog:2 |
| sonra | 3 | energy-runway:7, science-covered:11, alloy-budget-reserve:113, resource-cost:3, science-renewal-cooldown:84 |
| sonra | 4 | energy-runway:5, science-covered:45, alloy-budget-reserve:71, science-renewal-cooldown:62, deterrence-target:44, resource-cost:47 |
| sonra | 5 | energy-runway:14, alloy-budget-reserve:92, resource-cost:25, science-covered:18, science-renewal-cooldown:75, deterrence-target:45 |

### Sayaçların yorumu

`pirate`: korsan/yabani tarafla savaş; `enemy`: diğer devletle savaş;
`disband`: mevcut AI dağıtma politikası; `attrition`: yıpranma;
`arrival/colonization`: varış/koloniye dönüşüm; `ownership-transfer`: sahip değişimi.
`other`, `combat-other`, `ai-other` etiketleri ayrıca yakalanmayan evrede ayrılmadır;
sıfır olmayan değerleri otomatik olarak korsan kaybı saymıyoruz.
Transfer, gemi nesnesi korunarak filo kimliği değişimidir, yeni gemi değildir.
Başlangıç + tamamlanan + diğer kazanım − bütün kayıp/ayrılmalar = mevcut
sivil gemi eşitliği üç yeni kampanyada sınıf ve AI bazında test edilmiştir.
Bekleyen ücretli siparişler bu eşitlikte henüz gemi değildir ve ayrı gösterilir.
Yenileme davranışı başlangıç/tamamlanma/kayıp ve aylık stok dizileriyle izlenir;
her siparişin tek bir önceki ölüme bağlandığı iddia edilmez.

`energy-runway`: enerji geliri/kriz/dayanma sınırı; `alloy-budget-reserve`:
alaşım bütçesi veya rezerv; `alloy-upkeep`: uzun süreli alaşım bakımı;
`resource-cost`: gerçek maliyet; `projected-capacity`: bekleyen dahil kapasite;
`yard-backlog`: 45 günden uzun boşalma; `delivery-or-template`: teslim/şablon;
`deterrence-target`: planlanan kapasite hedefi karşılandı;
`science-renewal-cooldown`: kayıp yenileme beklemesi; `science-covered`:
bilim ihtiyacı karşılandı veya keşfedilecek sistem yok; `no-usable-yard`:
çalışır tersane yok. Bir turda birden fazla gerekçe olabilir. Eski sürümde
aynı ayrıntılı gerekçe alanı yoktur: `legacy-sleep` eski uyku bayrağı,
`legacy-no-order` gözlenen siparişsiz turdur; ikincisi kesin kök neden değildir.

## Ekonomi güvenliği ve sınırlar

- Seed 11: sıfır enerji stoklu yaşayan AI-ay 9 → 0; yeni kampanyada negatif/geçersiz kaynak gözlemi 0.
- Seed 99: sıfır enerji stoklu yaşayan AI-ay 28 → 0; yeni kampanyada negatif/geçersiz kaynak gözlemi 0.
- Seed 404: sıfır enerji stoklu yaşayan AI-ay 43 → 0; yeni kampanyada negatif/geçersiz kaynak gözlemi 0.

Bu ölçüm her gelecekteki ekonominin asla krize girmeyeceği garantisi değildir.
Seed11 sonunda bazı AI'ların enerji neti negatiftir; stok dayanması ve üretim
engelleri aktiftir. Seed99 AI2'nin alaşım neti hafif negatiftir ve stok/bakım
koruması uygulanır. Korsanlar bazı devletlerin bütün filolarını hâlâ yenebilir.
120 ayda çoğunluk korvet ve muhriptir; ileri gemi sınıfları hedefli teknoloji
ve şablon testleriyle doğrulanmıştır, uzun geç oyun kampanyasıyla değil.
Daha çok üretim bütün tersanelerin sürekli dolu olması anlamına gelmez:
hedef, bütçe ve enerji gerektirmiyorsa kapasite kasıtlı boş kalır.

## Yeniden çalıştırma

```sh
node tests/faz93d1_navy_production_test.js
node tests/faz93d1_navy_campaign_test.js
node tests/measure-navy-93d1.js /path/to/canonical93d 11 before-11.json
node tests/measure-navy-93d1.js . 11 after-11.json
STARS_TEST_LOGS=tests/logs-93d1 node tests/run-all.js
python3 tools/verify-release.py
```

Ham veriler: `tests/navy-93d1/{before,after}-{11,99,404}.json`.
Her dosya 120 aylık devlet durumlarını, sipariş/tamamlanma/kayıp sınıflarını,
engelleri, tersane kullanımını, RNG ve tam kayıt hash'ini içerir.
