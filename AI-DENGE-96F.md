# Faz 96F — Eş koşullu 120 aylık AI karşılaştırması

Kanonik 96E.1 ve 96F, seed 11/99/404, orta galaksi, normal zorluk, beş AI ve boşta oyuncu. Aynı coğrafya ve başlangıç merkezleri programatik karşılaştırıldı. Kriz ve konsey kapalı. Her koşuda 7.200 yarım günlük gerçek simülasyon adımı; 60. ayda Save v8 kaydet/yükle. Üç çift altı 120 aylık koşudur. Son sürüm için 404 ayrıca tekrarlandı; zaman alanları hariç aylık durum, gerçek eylem izi, RNG ve son save hash birebir aynı.

Tablo değerleri 96E.1 → 96F. Teslim, gönderen AI'nın gerçekten teslim edilmiş konvoy sefer sayacıdır; alıcı sayısı veya taşınan kaynak birimi değildir. Paktlar ticaret paktlarının iki taraflı toplamının yarısıdır; bütün diplomatik antlaşma türlerinin toplamı değildir. Teknoloji, hayatta kalan beş AI'nın toplam açılmış teknoloji sayısı; gemiler bütün gemi sınıfları; bakım gerçek fleetUpkeep toplamıdır.

| Seed | Canlı AI | Teknoloji | Gemiler | Bakım | Koloniler | Teslim | Pakt | Savaş / barış | Kritik devlet-ay |
|---|---|---|---|---|---|---|---|---|---|
| 11 | 5 → 5 | 39 → 37 | 183 → 96 | 546.11 → 239.04 | 10 → 13 | 72 → 97 | 5 → 1 | 8/1 → 5/2 | 0 → 11 |
| 99 | 5 → 5 | 43 → 41 | 225 → 167 | 641.48 → 507.62 | 16 → 15 | 20 → 8 | 4 → 3 | 1/0 → 0/0 | 2 → 0 |
| 404 | 5 → 5 | 54 → 56 | 288 → 295 | 978.54 → 966.02 | 22 → 24 | 131 → 140 | 6 → 6 | 0/0 → 0/0 | 0 → 0 |

## Uzun hedef ölçümleri

| Seed | Hedef değişimi | Ölçülen kilometre taşı | İlerlemeyen plan değerlendirmesi | Olağan koşulda 720 günden erken değişim |
|---|---|---|---|---|
| 11 | 30 | 15 | 3 | 0 |
| 99 | 17 | 9 | 4 | 0 |
| 404 | 9 | 8 | 4 | 0 |

Tamamlanan plan sayacı gerçek ölçüm eşiğidir; kazanılmış savaş veya tam stratejik başarı sayısı değildir. Toparlanma sağlıklı bütçeyle tamamlanabilir, eski donanma gücünün geri gelmesini şart koşmaz. Hedef değişimi ile kısa savunma/üretim aşaması değişimi ayrı tutulur. seed 11'de 30 değişimin önemli kısmı gerçek filo kaybı/tehdit/bütçe alarmıdır; bu stres altında hareketliliğin bütünüyle ideal olduğu ileri sürülmez. Dokuz hedef türünün hepsi bu üç doğal kampanyada oluşmadı; doğal koşuda federasyon/sınırlama hedefine başarı kanıtı yoktur. İlgili kurallar kontrollü testlerde sınandı.

## Ekonomi

Son ayın toplam net gelirleri; stok veya brüt üretim değildir:

| Seed | Enerji | Maden | Alaşım | Araştırma | Tüketim ürünü |
|---|---|---|---|---|---|
| 11 | 65.41 → 348.88 | 220.21 → 292.89 | 62.75 → 132.84 | 593.66 → 504.44 | 64.85 → 66.40 |
| 99 | 619.59 → 613.35 | 408.68 → 504.71 | 111.68 → 118.66 | 650.93 → 638.71 | 114.91 → 52.89 |
| 404 | 899.27 → 1464.72 | 1015.54 → 1191.00 | 205.47 → 278.82 | 1197.78 → 1424.01 | 184.07 → 112.02 |

Güç dağılımı tek profile yakınsamadı. Son toplam askerî güç seed 11'de 25.635→14.082, seed 99'da 30.208→22.879, seed 404'te 38.463→38.636. Donanma büyümesi tek başarı ölçütü yapılmadı. seed 11 araştırma ve gemi sayısı geriliyor, 11 kritik devlet-ay var; seed 99 tüketim ürünü geliri düşüyor. Bunlar 96H için ölçülmüş risklerdir.

## seed 99 ticaret düşüşü

96E.1'in 20 teslim sonucu kanonik kodla yeniden üretildi; önceki fazdaki 114 farklı temel sürüme aittir. 96E.1 tanı sayımları temas yok 660, liman yok 60, güvenli rota yok 50, makul takas oranı yok 28 idi. 96F'de bunlar sırasıyla 699/60/44/23. Yeni koşuda gerçek kargo yağmaları ve erken iptal edilen sözleşmeler de var. Başlangıç denemelerinden birinde sözleşme imzalanmasına karşın iki konvoy kaybı sonrası sıfır teslim oluşmuştu; son sürüm sekiz teslim yaptı. İyileşmiş bütçe, ticaretin arttığı anlamına gelmiyor. Koruma emri ticaretin kesin kurtulduğu anlamına gelmiyor. Bütün farkı tek bir bug veya tek bir stratejiye bağlayan nedensellik kanıtı yoktur.

## Gerçek karar zincirleri

1. seed 404, devlet 4: gün 30 science hedefi; gün 60 maden siparişi 120 maden ödemesi; gün 450/480/570 gerçek teknoloji kazanımı ve gün 570 üç teknoloji kilometre taşı; gün 750 laboratuvar siparişi 190 maden, devamında yeni laboratuvarlar ve teknoloji ilerlemesi. Hedef 120 ay boyunca science kaldı. Bu bilimsel yönelim ve gerçek yatırım/ilerlemedir; galakside birincilik ölçümü değildir.
2. seed 11, devlet 2: gün 1590 güvenlik yönelimi; gün 1620 tersane için 260 maden+45 alaşım, dönem boyunca gerçek korvet siparişleri başına32 alaşım; gün 1650 devlet 4 ile pakt kabulü; gün 2220 devlet 1'e gerçek savaş ve gerçek filo rotaları; ortak sefer kaydı 23 tur, kendi12 gemi kaybı/28 imha; gün 2490 bölgesel hedefe dönüş, gün 2580 devlet 5 ile saldırmazlık kabulü; gün 2610 barış. Kayıtta bu cephede toprak kazanımı yok; salt emir veya savaş ilanı fetih başarısı sayılmadı.
3. seed 11, devlet 4: gün 630 gerçek ittifak, gün 780 2, 1 enerji ↔1, 2 alaşım fiziksel kargo sözleşmesi; gün 828, 5 ve888, 5 pozitif gerçek teslimler; sonraki sözleşmelerde gerçek kayıplar; gün 3090 kayıp85 sonrasında mevcut260 numaralı filoya25 sistemine koruma rotası. Sonuç teslim ve rota kanıtıdır; korsanın kesin yok edildiği iddia edilmez. Düzenli ticaret güveni aynı hafıza listesinde gerçekten oluştu.
4. seed 11, devlet 5: gün 30 science, gün 30/180 enerji yatırımı başına110 maden; gün 930'a kadar teknoloji ilerlemesi yok, plan yeniden değerlendirilip trade seçildi; gün 1050 gerçek filo kaybıyla recovery; gün 1140/1170/1200 araştırmaları ve gün 1230 sağlıklı bütçe kilometre taşı. Başarısızlığı da içeren gerçek bir zincirdir.

`tests/audit96f/decision-chains.json` gerçek işlem izlerini, `decision-events-*.json` sınırlı oyun geçmişinden aylık olarak toplanmış niyet/aşama kayıtlarını ayrı tutar. İşlemler gerçek dünyada gerçekleşmiştir; eski motorun her eyleminin yalnız yeni hedef nedeniyle gerçekleştiği ileri sürülmez. Doğal üç koşuda her askerî yardım/vasal/federasyon senaryosu oluşmadı; bunların fiziksel motor testleri ayrıca vardır.

## Performans ve kapsam

seed 404 çift kampanya süreci 28.61 saniye, tepe RSS 324, 152 KiB. Bu iki VM'yi aynı süreçte barındıran toplam tepe değerdir; tek AI/Android bellek ölçümü değildir. Aynı makinede regresyon yükü bulunduğu için süreler kesin karşılaştırmalı benchmark değildir.
