# Önce / sonra federasyon kampanyaları — 95B

Orta sarmal galaksi, normal zorluk, standart insan oyuncu, aynı 11/99/404 tohumları, 120 ay; korsanlar varsayılan açık. Gerçek günlük/aylık döngü ve 0,5 günlük adım. Yeni kaynak/gemi hibesi yok. JSON dosyalarında kaynak hashleri, 120 aylık her devlet stoku/geliri/teknolojisi, gemi üretimi/kayıpları ve siyasi olaylar bulunur. Süreler aynı hostta ikili kampanya koşularıyla ölçülmüştür; Android FPS veya kesin izole performans karşılaştırması değildir.

| Tohum | 95A → 95B federasyon | Üye | Kabul/ret oyları (95A → 95B) | 95A → 95B süre (ms) | Negatif stok örneği |
|---|---|---|---|---|---|
| 11 | 1 türsüz → 1 Bilimsel | 3 | 8/3 → 7/4 | 5533 → 5564 | 0 |
| 99 | 0 türsüz → 0 — | — | 0/0 → 0/0 | 6193 → 5777 | 0 |
| 404 | 1 türsüz → 1 Bilimsel | 4 | 12/1 → 13/3 | 7590 → 7762 | 0 |

Oylar aylık son sonuç sayımıyla değil, mevcut `fedResolveVote` dönüşü gözlenerek sayıldı; aynı ay birden fazla sonuç kaybolmaz. Federasyon oluşma/dağılma ve üyelik değişimi ay sonunda örneklenir; aynı ay oluşup dağılan çok kısa birlikler bu sayaçta kaçabilir. Doğal örneklerde gözlenen iki birlik dağılmadı, üyelik değişimi ve yeni federasyon savaş katılımı 0 oldu.

| Tohum | Sürüm | AI toplam güç | Toplam gemi | Koloni | Teknoloji | Devlet başına keşiflerin toplamı |
|---|---|---:|---:|---:|---:|---:|
| 11 | 95A | 17516 | 150 | 9 | 26 | 113 |
| 11 | 95B | 14423 | 126 | 10 | 26 | 118 |
| 99 | 95A | 21120 | 166 | 15 | 33 | 69 |
| 99 | 95B | 21120 | 166 | 15 | 33 | 69 |
| 404 | 95A | 29451 | 218 | 22 | 47 | 128 |
| 404 | 95B | 28623 | 206 | 23 | 52 | 128 |

11’de güç/gemi sayısı düştü, keşif/koloni arttı. 404’te güç/gemi sayısı düştü, koloni/teknoloji arttı; kayıplar da yükseldi. 99’da federasyon oluşmadığı için oyun sonuçları aynı kaldı. Bunlar federasyon türü, siyasi bedeller, farklı kabul edilen yasalar ve değişen RNG akışının birleşik kampanya sonuçlarıdır; tek bir bonusun nedensel etkisi diye yorumlanmaz. Uzun dönem dengeyi kanıtlamak için üç örnek yeterli değildir.

## Devlet başına sonuçlar

Aşağıda savaş+sivil sipariş ve kayıplar bütün sınıfları kapsar. Yedi kaynak için son stok ve aylık gelir aynı sırada `ene/min/yiy/ala/tuk/ara/etk` verilmiştir. Savaş ilanı ve barış sayacı kazanılan savaş sayısı değildir.

### Tohum 11

| Sürüm / devlet (ID, doktrin) | Koloni / güç / gemi | Sipariş / kayıp | Teknoloji / keşif | İlan / barış | Stok (7) | Aylık gelir (7) |
|---|---|---|---|---|---|---|
| 95A Veyra Tahtı (1, militarist) | 1 / 2760 / 21 | 66 / 50 | 2 / 32 | 3 / 2 | 3435/0/180/39/1590/6/442 | 78.3/-4.4/0/9.3/12.6/23.2/11.1 |
| 95A Kaevar Mabedi (2, yayilmaci) | 2 / 126 / 1 | 65 / 60 | 3 / 8 | 0 / 2 | 3065/68/180/31/1185/0/696 | 86.8/-0.9/0/29.5/16.0/23.3/9.8 |
| 95A Analitik Nyx Hanedanlığı (3, izolasyonist) | 1 / 2140 / 20 | 23 / 8 | 5 / 11 | 0 / 0 | 314/1047/180/269/3482/0/428 | -5.5/53.9/0/36.6/25.9/39.8/9.9 |
| 95A Primordial Zharn Meclisi (4, tuccar) | 3 / 6272 / 55 | 77 / 25 | 6 / 31 | 0 / 0 | 9828/270/3013/385/1873/6/257 | 146.2/66.2/24.7/8.2/23.7/40.6/14.6 |
| 95A Primordial Tarkun Meclisi (5, tuccar) | 2 / 6218 / 53 | 61 / 13 | 10 / 31 | 0 / 0 | 6717/24/2834/40/984/6/158 | 33.3/10.5/27.8/7.5/7.8/112.2/11.6 |
| 95B Veyra Tahtı (1, militarist) | 1 / 3240 / 24 | 63 / 44 | 2 / 32 | 2 / 2 | 2619/0/180/41/1616/0/342 | 68.4/-4.4/0/7.3/11.4/25.1/11.1 |
| 95B Kaevar Mabedi (2, yayilmaci) | 2 / 126 / 1 | 58 / 54 | 3 / 13 | 0 / 2 | 2355/44/180/42/1045/0/747 | 91.0/34.5/0/20.8/-1.6/31.8/9.9 |
| 95B Analitik Nyx Hanedanlığı (3, izolasyonist) | 1 / 1102 / 13 | 23 / 15 | 5 / 11 | 0 / 0 | 405/116/180/182/3593/0/796 | 19.2/39.3/0/26.7/29.0/39.8/9.9 |
| 95B Primordial Zharn Meclisi (4, tuccar) | 4 / 3833 / 35 | 64 / 34 | 6 / 31 | 0 / 0 | 9869/110/2661/1095/1904/0/363 | 213.8/84.5/6.1/22.2/16.5/50.5/15.0 |
| 95B Primordial Tarkun Meclisi (5, tuccar) | 2 / 6122 / 53 | 59 / 11 | 10 / 31 | 0 / 0 | 5694/8/2462/62/962/0/182 | 22.5/24.8/8.0/7.2/6.2/142.0/11.4 |
### Tohum 99

| Sürüm / devlet (ID, doktrin) | Koloni / güç / gemi | Sipariş / kayıp | Teknoloji / keşif | İlan / barış | Stok (7) | Aylık gelir (7) |
|---|---|---|---|---|---|---|
| 95A Kaevar İmparatorluğu (1, militarist) | 2 / 6623 / 41 | 76 / 35 | 4 / 18 | 0 / 0 | 0/41/4965/55/1324/0/1171 | 51.7/9.0/43.9/13.1/4.9/44.2/12.2 |
| 95A Kuantum Cyrix Birliği (2, tuccar) | 2 / 140 / 2 | 49 / 49 | 4 / 20 | 0 / 0 | 65/0/3591/27/13/0/900 | 89.6/-4.6/24.4/9.7/-3.4/29.6/11.0 |
| 95A Muhteşem Vael Tarikatı (3, yayilmaci) | 5 / 7383 / 56 | 73 / 20 | 9 / 10 | 0 / 0 | 11636/912/9721/84/3250/0/1387 | 120.7/142.1/93.8/31.3/30.5/120.5/15.9 |
| 95A Primordial Thalor Federasyonu (4, pasifist) | 3 / 3630 / 36 | 48 / 15 | 6 / 10 | 0 / 0 | 6126/91/180/1429/1094/0/1157 | 69.2/54.6/0/37.6/12.0/62.5/12.7 |
| 95A Otonom Draven Ağı (5, tuccar) | 3 / 3344 / 31 | 28 / 2 | 10 / 11 | 0 / 0 | 15129/57/2405/1127/989/0/1392 | 289.5/53.8/22.6/17.7/19.0/186.4/14.7 |
| 95B Kaevar İmparatorluğu (1, militarist) | 2 / 6623 / 41 | 76 / 35 | 4 / 18 | 0 / 0 | 0/41/4965/55/1324/0/1171 | 51.7/9.0/43.9/13.1/4.9/44.2/12.2 |
| 95B Kuantum Cyrix Birliği (2, tuccar) | 2 / 140 / 2 | 49 / 49 | 4 / 20 | 0 / 0 | 65/0/3591/27/13/0/900 | 89.6/-4.6/24.4/9.7/-3.4/29.6/11.0 |
| 95B Muhteşem Vael Tarikatı (3, yayilmaci) | 5 / 7383 / 56 | 73 / 20 | 9 / 10 | 0 / 0 | 11636/912/9721/84/3250/0/1387 | 120.7/142.1/93.8/31.3/30.5/120.5/15.9 |
| 95B Primordial Thalor Federasyonu (4, pasifist) | 3 / 3630 / 36 | 48 / 15 | 6 / 10 | 0 / 0 | 6126/91/180/1429/1094/0/1157 | 69.2/54.6/0/37.6/12.0/62.5/12.7 |
| 95B Otonom Draven Ağı (5, tuccar) | 3 / 3344 / 31 | 28 / 2 | 10 / 11 | 0 / 0 | 15129/57/2405/1127/989/0/1392 | 289.5/53.8/22.6/17.7/19.0/186.4/14.7 |
### Tohum 404

| Sürüm / devlet (ID, doktrin) | Koloni / güç / gemi | Sipariş / kayıp | Teknoloji / keşif | İlan / barış | Stok (7) | Aylık gelir (7) |
|---|---|---|---|---|---|---|
| 95A Vantia İmparatorluğu (1, pasifist) | 5 / 4495 / 44 | 53 / 14 | 10 / 30 | 0 / 0 | 42065/2544/2467/3448/1171/21/1059 | 888.4/193.1/7.5/113.4/10.7/180.5/20.9 |
| 95A Aethel Sultanlığı (2, yayilmaci) | 7 / 7999 / 52 | 66 / 13 | 9 / 8 | 0 / 0 | 12028/69/9596/502/1577/0/1658 | 469.3/226.8/111.2/34.3/52.8/164.1/17.1 |
| 95A Yüce Zephyr Lejyonu (3, militarist) | 2 / 9847 / 60 | 61 / 6 | 5 / 30 | 0 / 0 | 19019/2424/1684/385/583/21/823 | 223.1/2.4/11.3/41.5/2.8/70.3/13.0 |
| 95A Bilge Aethel Zihni (4, tuccar) | 2 / 2863 / 20 | 76 / 44 | 12 / 30 | 0 / 0 | 30445/4/3652/2857/1530/21/777 | 398.1/36.4/31.8/57.8/11.9/224.5/11.9 |
| 95A Vantia Birliği (5, pasifist) | 6 / 4247 / 42 | 55 / 15 | 11 / 30 | 0 / 0 | 45583/1421/8736/1482/1409/21/885 | 1039.6/274.9/103.4/135.6/8.1/363.4/19.3 |
| 95B Vantia İmparatorluğu (1, pasifist) | 5 / 4647 / 38 | 89 / 56 | 12 / 30 | 0 / 0 | 32288/7265/2315/1032/1348/26/729 | 536.8/251.1/4.3/105.8/5.2/259.4/19.2 |
| 95B Aethel Sultanlığı (2, yayilmaci) | 7 / 8494 / 56 | 68 / 17 | 9 / 8 | 0 / 0 | 12763/213/9596/1315/1706/0/1699 | 450.1/333.2/110.7/48.7/21.3/149.6/17.5 |
| 95B Yüce Zephyr Lejyonu (3, militarist) | 2 / 9988 / 60 | 63 / 8 | 5 / 30 | 0 / 0 | 19104/3871/1651/219/580/26/901 | 216.8/45.5/10.9/27.3/2.8/51.6/13.0 |
| 95B Bilge Aethel Zihni (4, tuccar) | 2 / 2562 / 21 | 46 / 30 | 14 / 30 | 0 / 0 | 30911/269/4137/4383/1536/26/799 | 425.7/44.0/59.8/62.7/12.0/314.8/12.1 |
| 95B Vantia Birliği (5, pasifist) | 7 / 2932 / 31 | 54 / 27 | 12 / 30 | 0 / 0 | 52898/2878/9479/2312/2038/26/1022 | 1200.6/359.8/160.3/142.4/30.1/397.8/21.3 |

## Süreklilik

Tohum 11’de aynı 120 ay tekrar, 60. ayda save/load ve gözlemci kapalı dört koşu karşılaştırıldı. Tekrarda kaynak kaydı hash’i aynı; dört koşuda RNG aynı; yüklemenin önbellek dışı oyun durumu ve gözlemcinin oyun durumu aynı. Ham yükleme hash’i türetilmiş `_prof/_supAt/_gateAt` alanları nedeniyle farklı olabilir. Yeni anayasa/oy/reform alanları eşitlikten çıkarılmadı. Kanıt: `tests/fed-95b/continuity/result.json`.

Türlerin izole gelir/bakım/fon etkileri hedefli testlerde gerçek hesap sahiplerinden ölçüldü; yukarıdaki doğal kampanya tablosu bütün yasaları tür avantajı saymaz.

## Gözlenen siyasi ömür ve maliyet

| Tohum | Yeni birliğin kuruluş günü | Tür / başkan ID | 120. ayda gözlenen yaş | Dağılma / üye değişimi |
|---|---:|---|---|---|
| 11 | 2310 | bilimsel / 5 | 43 ay | 0 / 0 |
| 99 | — | Birlik yok | — | 0 / 0 |
| 404 | 1050 | bilimsel / 1 | 85 ay | 0 / 1 |

Kuruluş günü ay sonu örnekleme tarihidir. Başlangıç gün 0, son gün 3600. Fonun kuruluş anı ve son durumunun karışmaması için gözlemci siyasi olay anını derin kopyalar; oylar çözüm olayında kaydedilir. Nihai üç önce/sonra JSON bu düzeltmeyle üretildi.
