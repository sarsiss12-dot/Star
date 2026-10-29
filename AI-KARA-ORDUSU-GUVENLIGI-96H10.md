# STARS — FAZ 96H.10: Kara Ordusu Güvenliği, Eskort Koordinasyonu, Temiz Fetih

**Karar:** aday D kabul edildi. Oynanabilir sürüm 96H.10: build `96h10`, PWA `stars-v96h10`, Save v8.

Değişiklik yalnız `ai.js` dosyasında, `aiArmyTick` karar zincirinde. Silahsız kara ordusu şu koşulda bir sisteme gönderilmez ve oraya giden emrini de sürdürmez:

- o sistemdeki görünür düşman savaş gücü,
- devletin orada bulunan ya da oraya giden kendi savaş filolarını,
- savunma ayırmasındaki 1,15 payıyla aşıyorsa.

Değişmeyenler:

- istila, kalkan, garnizon, bombardıman, katastrof ve savaş kuralları (`economy.js`, `combat.js`, `diplomacy.js` baytları 96H.9 ile aynı);
- 96H.9'un ordu satın alma ve kuşatmayı sürdürme davranışı;
- 96H.8 sefer bakım güvenliği;
- ekonomi eşikleri;
- Save şeması ve RNG sırası.

Kanıtlar `research/96h10/` klasöründe. Testler: `tests/faz96h10_army_safety_test.js`, `tests/browser-96h10.cjs`.

## 1. Kaynak

- Başlangıç: `main` HEAD `54058e08e2f9102f6e4b37195f1490f6fa389f99` (96H.9). Ağacı PR #3 başıyla (`94b6aa2`) birebir aynı.
- ZIP `releases/stars-faz96h9.zip`: SHA-256 `d50b7969…1778`, 20 girdi, CRC PASS, 19 runtime dosyası manifestle aynı.
- Temiz `git archive` ile yeniden paketleme bayt bayt aynı.
- AI SHA-256 `4d7270b6…09ed`.

## 2. Mevcut kara ordusu mekaniği (koddan)

**`aiArmyTick` (aylık).** Yalnız boştaki taşıyıcılara karar verir. Hedef seçimi üç adımlıdır:

1. **Taarruz:** kendi silahlı filosunun bulunduğu ya da gittiği sistem. Şartlar: düşman kolonisi var, kalkan ≤ 55, güç ≥ savunma × 0,8.
2. **Sınır bekleme:** düşmana komşu kendi sistemi.
3. **Savunma:** en değerli ya da tehdit altındaki kendi kolonisi. Tehdit puanı **artırır**.

Bu üç adımın hiçbiri hedefteki düşman filosunu ve kendi savaş gücünü karşılaştırmıyordu. Yoldaki ordunun emri, hedef değişse de hiç yeniden değerlendirilmiyordu.

**Taşıyıcının kendi silahı yok.** Düşman savaş filosuyla aynı yörüngeye girdiği gün `combatTick` içinde yok olur. Ordu, yörüngedeki kendi kolonisine kara gücü katkısını ancak aylık `invasionTick` anında ve hayattaysa yapar.

**`incomingArmy` (ateşkes).** Ordunun bir sonraki atlayışı hedefse garnizonu en fazla 18 ay %8'de tutar ve katastrofu önler. Çok atlayışlı yoldaki ordu sayılmaz.

## 3. Kanıtlanmış sorun ve kök nedeni

Ölçüm 96H.9 kontrolünde yapıldı: seed11 ve seed23 için 5'er dünya × 240 ay, ayrıca 8 seed × 120 ay. Kullanılan araç `arm10` ordu yaşam döngüsü izleyicisi; son Save'ler kanonik 96H.9 koşularıyla bayt bayt aynı.

**Taarruz hedefine eskortsuz varış nadir.**

- seed11: 13 varışın 13'ü eskortlu.
- seed23: 2 varıştan 1'i eskortsuz; taarruz hedefinde 4 gövde kayıp.
- Yolda destek kaybedip ölüm: 3 olay. Faz tanımındaki "Sorun A" gerçek ama küçük.

**Asıl kayıp, ordunun düşman filosunun tuttuğu kendi kolonisine gönderilmesi.** Taarruz dışı 39 kayıp gövde şöyle dağılıyor:

| Kayıp türü | Gövde |
|---|---|
| Emirle kendi iç kolonisine giden | 22 |
| Saldırı altındaki kendi kolonisinde doğup orada ölen | 11 |
| Sınır, yabancı ya da kolonisiz sistem | 6 |

**Örnek: seed11 pl1, devlet3, sys20.**

- Korsan filoları (1254 güç, görünür) koloninin yörüngesinde.
- Savunma adımı tehdit puanı yüzünden sys20'yi seçiyor.
- 13 ordu emri sys20'ye veriliyor; 12 ordu varış günü ölüyor.
- 3 ordu da oradaki tersanede doğup ölüyor.
- Ölen her ordu yeniden üretiliyor; her biri 70 alaşım + 120 maden.

Kök neden: hedef seçimi görünür düşman gücüne bakmıyor, yoldaki emir hiç yeniden değerlendirilmiyor.

## 4. Yapılan geliştirme (aday D, +32/−2 satır)

- **`aiArmySafe(e, sys)`.**
  - Tehdit: `aiObservedThreat(e, sys, false)`, yani yalnız görünür düşman savaş gemileri.
  - Destek: orada bulunan ya da oraya giden kendi silahlı filoları.
  - Koşul: destek ≥ tehdit × 1,15.
  - Salt okunur, RNG kullanmaz, devlet başına tur içinde önbellekli.
- **Hedef filtresi.** Taarruz, sınır bekleme ve savunma adaylarından güvenli olmayanlar atlanır.
- **Yoldaki ordu yalnız iki durumda yeniden karar verir:**
  - varış güvenli değilse;
  - yabancı hedefte savaşta olunan düşman kolonisi kalmadıysa (hedef ele geçirildi ya da savaş bitti).
- **Dokunulmayanlar:**
  - ortak sefer (`jointReserved`) ve teslimat (`hasShipment`) emirleri;
  - geçerli ve güvenli emir yeniden verilmez;
  - oyuncu orduları (`aiArmyTick` yalnız AI).

## 5. Önceki ve yeni karar zinciri

**Önce:**

1. Ordu boşta.
2. Hedef seçilir: taarruz / sınır / savunma; düşman gücüne bakılmaz.
3. `aiMove`.
4. Yolda körlemesine devam.
5. Varışta uzay muharebesi; ordu ölür.

**Sonra:**

1. Ordu boşta ya da varışı geçersiz veya güvensiz.
2. Güvenli olmayan hedefler elenir.
3. `aiMove`.
4. Varış her ay yeniden denetlenir.
5. Güvensiz olursa ordu güvenli koloniye döner.

## 6. Aynı Save karşılaştırmaları

**Deterministik (testlerde):**

- seed11 ay228:
  - 96H.9: 4 ordu sys20'ye gönderiliyor, 3'ü gün 6877'de ölüyor.
  - 96H.10: hiçbiri gönderilmiyor; 3'ü de güvenli sys37/30'da yaşıyor.
- seed11 ay173:
  - 96H.9: ordu 397 görünür 3059'luk düşman gücüne gidiyor, gün 5240,5'te ölüyor.
  - 96H.10: gün 5220'de güvenli sys13'e yönlendiriliyor ve yaşıyor.

**24 aylık pencereler** (96H.9 checkpoint; kontrol ve D; ana dünya + 4 plasebo):

| Pencere | 96H.9 ordu kaybı | 96H.10 ordu kaybı | Not |
|---|---|---|---|
| s11pl1 ay216 | [15, 6, 6, 0, 0] | [7, 3, 3, 0, 0] | |
| s23pl4 ay156 | [3, 2, 3, 2, 2] | [3, 2, 3, 2, 2] | Ordu 461 son şeritte; yönlendirme kurtaramıyor |
| s23pl4 ay112 | [3, 4, 4, 3, 3] | [3, 4, 4, 3, 3] | Ara sistemde ölüm; kapsam dışı |

## 7. Uzun kampanyalar

Toplamlar; ekonomi değerleri dünya ortalaması. Kaynak: `CAMPAIGNS.json`.

| Ölçüt | seed11 96H.9 | seed11 96H.10 | seed23 96H.9 | seed23 96H.10 | 8×120 96H.9 | 8×120 96H.10 |
|---|---|---|---|---|---|---|
| Uzayda kaybedilen ordu | 22 | 12 | 16 | 13 | 10 | 9 |
| Taarruz hedefinde kayıp | 0 | 0 | 4 | 3 | 0 | 0 |
| Eskortsuz taarruz varışı | 0 | 0 | 1 | 0 | 0 | 0 |
| Üretilen ordu | 41 | 36 | 37 | 34 | 31 | 30 |
| Temiz fetih | 13 | 13 | 1 | 1 | 1 | 1 |
| Koloni fethi | 19 | 19 | 9 | 9 | 5 | 5 |
| Katastrof | 1 | 1 | 6 | 6 | 1 | 1 |
| Kritik devlet-ay | 23 | 23 | 15 | 15 | 16 | 16 |
| Savaş terhisi (gemi) | 19 | 19 | 57 | 57 | 6 | 6 |
| Konuşlanma kaynaklı terhis | 0 | 0 | 57 | 57 | 0 | 0 |
| Teslimat | 8,8 | 8,8 | 143,8 | 144,2 | 392 | 392 |
| Gemi | 202,8 | 194 | 300,2 | 291,8 | 1416 | 1383 |
| Güç | 73881 | 70657 | 75260 | 72889 | 192565 | 189869 |

**Plasebo bantları.** Adayın gerçekten tetiklendiği 7 dünya incelendi. Her biri için ilk karar farkından bir ay önceki checkpoint alındı; her kolda 4 tek RNG çekimli plasebo koşuldu. Kaynak: `BANDS.json`.

- Ordu kaybı medyanı 7 dünyanın hepsinde eşit ya da düşük; seed11 pl1'de 17 → 3.
- Gemi ve güç medyanları iki yönlü oynuyor (−19 … +15 gemi). seed11 pl6 ve seed23 pl2'deki ana dünya düşüşleri kontrolün kendi bandında da görülen kaotik uç değerler (kontrol pl6 ana dünyası 243, placeboları 312–322).
- Fetih, temiz fetih ve katastrof sayıları değişmiyor.

**Kanonik replay.**

- 8×120: 7/8 seed'de ay ay aynı.
- seed2026 ay110'da tetikleniyor: gemi 213 → 180, güç 26652 → 23956, teknoloji 40 → 41. Kontrol bandı [158..219], D bandı [154..224].
- Kritik 14 = 14, teslimat 417 = 417, koloni 138 = 138.
- 4×240 toplamları: kritik 68 → 66, teknoloji 360 → 357, koloni 103 → 104, yaşayan 20 → 19, teslimat 981 → 775. seed11 aynı, seed23 ve seed42'de küçük farklar var.
- Teslimat düşüşünün tamamı seed404'ten (717 → 509). Bu seed'de D gün 3870'te tetikleniyor: ordu 294, 2837 görünür düşman gücünün tuttuğu sys39'dan çevriliyor. Ay 128 checkpoint'inden alınan bantta:

  | Ölçüt | Kontrol (medyan) | D (medyan) |
  |---|---|---|
  | Teslimat | [717, 549, 549, 726, 500] (549) | [509, 630, 624, 879, 635] (630) |
  | Gemi | 369 | 396 |
  | Güç | 71881 | 71900 |
  | Teknoloji | 124 | 120 |
  | Kritik ay | 17 | 16 |
  | Ordu kaybı | 3 | 0 |

  Kanonik dünyadaki ticaret düşüşü kaotik uç değer; D'nin bandı daha kötü değil.

## 8. Temiz fetih ve kuşatma zamanlaması (Sorun B)

Kaynak: 96H.9 kontrolünde 28 koloni fethi (`SIEGE-TIMING-96H9.json`, `CONQUESTS-240.json`).

1. **Ordu ne zaman yola çıkıyor:** kendi filosu hedefte ya da hedefe giderken (`aiArmyTick`).
2. **Varış süresi:** `aiKnownRoute` tahmininin yaklaşık 2–3 katı. Örnekler: tahmin 11 → gerçek 27,5 gün; 20 → 57,5; 24 → 76.
3. **Kuşatma başlangıcı:** kampanya kuvveti hedefe ulaşınca. Temiz fetihlerde kuşatma 1–6 ay sürüyor.
4. **Katastroflarda bombardıman süresi:** seed23'teki 5 sys41 vakasında 15–19 ay, ordu hiç yokken.
5. **Katastrofun gerçek nedeni (7 vaka):**
   - 5 vaka: saldırganın hiç ordusu yok. Aylık alaşım bütçe tavanı (`gelir × 5 + stok × 0,25` ≈ 48–59) 70'lik ordu bedelinin altında, maden de yetersiz.
   - 1 vaka: ordu 6 atlayış uzaktaydı, ateşkes devreye girmedi.
   - 1 vaka: eskort çekildi, ordu varışta öldü. 96H.10 bu türü hedefliyor.
6. **`incomingArmy` ateşkesi:** 28 fethin hiçbirinde devreye girmedi (0 ay). Yalnız son atlayıştaki orduyu görüyor; bu bir motor kuralı, değiştirilmedi.
7. **AI orduyu beklemeden bombardımana başlıyor mu:** Evet. Fakat yoksul saldırgan için beklemek "hiç almamak" demek.
8. **Fetih kayıpları:**

   | Tür | Nüfus kaybı | Bina kaybı |
   |---|---|---|
   | Temiz | %0 | 0 |
   | Teslim | %0–15 | 0 |
   | Katastrof | %66–75 | ortalama ~8,5 bina |

   Katastrofla alınan 7 koloninin 7'si 12 ve 24 ay sonra hâlâ elde. seed23'teki tek temiz fetih 12 ay içinde geri alındı.
9. **Geç ama temiz fetih daha yararlı mı:** Aynı hedefte evet. s23m15 penceresinde 96H.9'un yalnız-ordu aday B kolu, sys41'i 4 ay geç ama yaklaşık 15 nüfus ve 12–13 binayla aldı; katastrofta 5 nüfus ve 4 bina kaldı. Ancak seed23 saldırganı orduyu karşılayamıyor.

**Aday E — RET.** Aday, tek bir ordu gövdesinin, stok yetiyorsa aylık alaşım tavanını aşmasına izin veriyordu (96C.1 benzeri). Hedef olayda ordu bu kez maden (`resource-cost`) kapısında düştü. Bu yüzden 96H.9'un yalnız-alaşım ayırması (`armyHold`) devreye girmedi, savaş gemileri alaşımı harcadı ve katastrof aynı ayda (ay 35) geldi. Nedensel fayda yok; kök neden bir ekonomi eşiği. Ayrı faz kararı gerekir.

## 9. Reddedilen adaylar

| Aday | Ne | Neden reddedildi |
|---|---|---|
| D2 | D + rota da güvensiz ara sistemlerden geçmesin | seed11'de D ile aynı; seed23'te daha kötü (eskortsuz varış 0 → 3, terhis 57 → 61). Ek fayda yok. |
| P | D + "iki ordu yığma" cezası ordunun konumu yerine varışına baksın (ileri-geri salınımı) | Emir sayısı seed11'de 222 → 74, seed23'te 196 → 73 (D'ye göre). Ancak plasebo bantlarında kayıp etkisi tutarsız (bir seed23 dünyasında 3 → 10) ve kritik ay iki dünyada +1. Salınım açık sorun olarak kaldı. |
| E | Ordu için aylık alaşım tavanını aşma (yukarıda) | Nedensel fayda yok. |

## 10. Performans

Ölçüm: seed11 ay173 Save'inden 60 ay (orduların bulunduğu geç oyun); her kol 3 kez, sırayla dönüşümlü; boş 4 çekirdek; Node v22.22.0. Değerler çağrı başına medyan ms. Ayrıntı: `research/96h10/PERFORMANCE.json`.

| Fonksiyon | 96H.9 | 96H.10 |
|---|---|---|
| `aiArmyTick` (ayda bir) | 0,552 | 0,846 |
| `aiShipProduction` | 2,533 | 2,851 |
| `aiTurn` | 16,433 | 16,570 |
| `monthTick` | 120,307 | 122,711 |

- Ek maliyet ayda yaklaşık 0,3 ms, yani `monthTick`'in ~%0,25'i.
- Kollar ilk farklı karardan sonra ayrışıyor; diğer satırlardaki farkın bir kısmı farklı dünya durumundan geliyor.
- `aiArmySafe` 0,04 ms/çağrı (44 filo) ve devlet başına tur içinde önbellekli.
- Tam galaksi taraması yok: yalnız aday hedefler sorgulanıyor.
- Fiziksel Android ölçümü: NOT RUN.

## 11. Açık sorunlar

1. **Savunma adımında ileri-geri salınım.** Aynı kolonideki ordular birbirini cezalandırıp hep birlikte taşınıyor (aday P ölçüldü, reddedildi).
2. **Saldırı altındaki tersanede doğan ordular.** Üretim yer seçimi tehdidi görmüyor; 96H.9 kontrolünde 11 gövde.
3. **Ara sistemde ölüm.** Rota güvensiz bir ara sistemden geçerse ya da ordu son şeritteyse yönlendirme kurtaramıyor (D2 denendi, reddedildi).
4. **Yoksul saldırganın ordu karşılayamaması.** Seed23 katastroflarının nedeni; ekonomi eşiği, ayrı faz kararı.
5. **`incomingArmy` ateşkesi** yalnız son atlayışı görüyor; motor kuralı.
6. **ETA tahmini** gerçek varışın 2–3 katı kısa.
7. Fiziksel Android: NOT RUN.

## 12. Sonraki dar öneri

Ordu üretiminde tersane seçimi. Görünür düşman filosunun tuttuğu sistemdeki tersanede ordu üretilmesin. Bu, açık sorun 2'yi hedefler. Etki aynı Save'lerle ve plasebo bandıyla ölçülmeli.
