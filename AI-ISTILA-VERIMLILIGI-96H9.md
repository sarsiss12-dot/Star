# STARS — FAZ 96H.9: Kara Ordusu Koordinasyonu, Gezegen İstilası ve Gerçek Fetih

**Karar: aday BC kabul edildi; oynanabilir sürüm 96H.9 (build `96h9`, PWA `stars-v96h9`, Save v8).**

Değişiklik yalnız `ai.js` içinde, iki noktada. İkisi aynı karar zincirine bağlı: kolonili savaş hedefi → ordu satın alma → kuşatmanın sürmesi → eskortlu çıkarma.

1. Kampanyanın bilinen kolonili savaş hedefi varken ordu, hazırlık sırasında satın alınıyor.
2. Hedefe ulaşan kampanya kuvveti, her AI turunda rally noktasına geri çağrılmıyor ve kuşatmayı sürdürüyor.

Şunlar değişmedi:

- istila, kalkan, garnizon, bombardıman ve savaş kuralları (`economy.js`, `combat.js` baytları 96H.8 ile aynı);
- diplomasi, federasyon ve ortak sefer;
- ekonomik eşikler, galaksi sınırları (100 sistem / 11 AI);
- Save şeması ve RNG tüketim sırası.

Kanıtlar: `research/96h9/`. Testler: `tests/faz96h9_invasion_test.js`, `tests/browser-96h9.cjs`.

## 1. Kaynak

Başlangıç `main` HEAD `8413f6e5e8702c0c866f6ac3cfb8748177579e9d` (96H.8).

- ZIP `releases/stars-faz96h8.zip`: SHA-256 `576511fd…b594`, 20 girdi; CRC ve manifest ↔ çalışma ağacı eşleşmesi doğrulandı.
- Temiz `git archive` ortamından yeniden paketleme aynı SHA'yı verdi.
- AI SHA-256 `8141a3fb…16b0`.

Kontrol kolu, kanonik `research/96h61/replay.js` 8×120 ve 4×240 özetlerini birebir yeniden üretiyor (96H.8 kanıtlarıyla aynı).

## 2. Mevcut mekanikler (koddan)

- **Ordu gemisi** `SHIPS.ord`:
  - maliyet 70 alaşım + 120 maden; bakım 5,2 enerji + 0,6 alaşım;
  - kara gücü 55; teknoloji gerektirmiyor.
- **`aiShipProduction`** orduyu savaş gemilerinden **sonra** dener. Hedef sayı savaşta `min(5, 2+round(war×2))`.
- **`aiArmyTick`** (aylık) yalnız **boştaki** taşıyıcıları yönetir. Hedef, kendi silahlı filolarının bulunduğu veya gittiği (×0,85) sistemlerdir. Hedef şu koşulları sağlamalı:
  - savaşta olunan bir düşman gezegeni olmalı;
  - kalkan ≤ 55 olmalı;
  - filo gücü ≥ sistem savunması × 0,8 olmalı.

  Hedef yoksa ordu sınır sisteminde bekler, o da yoksa savunmaya geçer.
- **`invasionTick`**:
  - bombardıman `K.war×0,011`; kalkan bunun %55'ine kadarını emer;
  - kalkan sahibi enerjiliyse ayda +4 dolar;
  - garnizon tabanın %25'inin altına inince hasar ×0,22 olur;
  - kuşatma yokken garnizon ayda taban×%12 + 2 yenilenir;
  - kuşatma sayacı yalnız garnizon 0 **ve** kalkan 0 iken işler; 6 ay sonra **katastrof** gelir (nüfus ×0,35, binaların yarısı yok);
  - çıkarma kalkan ≤ 5 ister; başarılı çıkarma **temiz** sayılır (nüfus ve binalar korunur, taşıyıcılar dağılır).
- **Teslim** (`combat.js`): istikrar < 15, garnizon 0 ve koruma yokken, rastgele bir zarla gerçekleşir.
- **`captureSystem`**: kolonisiz sistemin sahipliği uzay zaferiyle değişir.

## 3. İstenen sorular (A–J)

| Soru | Kanıtlı yanıt |
|---|---|
| A. Kampanya hedefi `aiArmyTick` tarafından kullanılıyor mu? | Doğrudan değil. Ordu filoları izliyor (bulunduğu veya gittiği sistem). Filo hedefte durursa tutarlı. Fakat 96H.8'de hedefteki boştaki filo her AI turunda rally'ye çağrılıyor ve ordu terk edilen hedefe gidiyor. |
| B. Ordu hedefi önceden öğreniyor mu? | Hayır. `build`/`gather` aşamasında ordu yalnız sınırda (FAZ 24) bekliyor; hedef, filo oraya emir alınca görünüyor. 96H.9 ordu satın almayı kampanya hedefinden okuyor (`aiInvasionTarget`); sevk mantığı değişmedi. |
| C. Ordu ne zaman üretilip gönderiliyor? | Üretim gemilerden sonra yapılıyor. 96H.8 8×120'de savaş sırasındaki ordu denemelerinin çoğu `alloy-budget-reserve` ile düştü: seed11'de 484'ün 430'u, seed23'te 239'un 234'ü. Savaş ayı alaşımı medyan ~30–37; ordu için 70 + 12–19 rezerv gerekiyor. Konuşlanma başlayınca enerji pisti de kapanıyor (`energy-runway`). |
| D. Ordu vardığında filo hâlâ orada mı? | 96H.8'de hayır. Seed11 ay79: gün 2400'de 51/128/196 filoları sys5'ten rally 31'e çağrıldı. Ordu 237 gün 2433'te tek başına vardı; kalkan 0→4→7→11 doldu; ordu 2486'da `combatTick`'te yok edildi. |
| E. Müfreze ordu desteği için yeterli mi? | Müfreze bombardıman için yeterli (ihtiyaç = tahmini savunma × 1,25), ama aynı geri çağırmaya tabi. B kolunda seed11'in ilk ordusu, 1 gemilik müfreze desteğiyle garnizona karşı kaybedildi. |
| F. Gemi/ordu bütçe önceliği doğru mu? | Hayır. Daha ucuz savaş gemileri her savaş ayının alaşımını önce tüketiyor; 70 alaşımlık ordu sığmıyor. Kontrol 8×120'de toplam 27 ordu gemisi; savaşan seed11'de 0, seed23'te 2. |
| G. Kalkan/garnizon/çıkarma şartları değerlendiriliyor mu? | `aiArmyTick` kalkan ≤ 55 ve güç ≥ savunma × 0,8 şartlarına bakıyor. Garnizonun yenilenmesi kuşatmayı kilitliyor: seed11 sys6'da 2300–2600 filo gücüne rağmen garnizon ~3–4'te takılı (yenilenme 7,2/ay > hasar ~5,5/ay). Ordu olmadan bu koloni ancak teslim ya da katastrofla düşüyor. |
| H. Maliyet ↔ hedef değeri | Hedef puanı = koloni×400 + başkent 600 − mesafe; 96H.8 bakım kapısı eklendi. Ordu yoksa kolonili hedefe harcanan sefer temiz fetih üretemiyor. Seed23'te 96H.8, 5 dünya/240 ayda 2520 alaşımlık ordu üretti: 0 temiz istila, 21 ordu filosu kayıp. |
| I. Ordu varken başka hedefe kayıyor mu? | Ölçümde başlıca sorun bu değil. Asıl sorun ordunun hiç bulunmaması ve yoldaki ordunun yeniden değerlendirilmemesi. |
| J. Donanma çekilince ordu tehlikede kalıyor mu? | Evet. `aiArmyTick` yalnız boştaki taşıyıcıyı yönetiyor; yoldaki ordu eskort çekilse de hedefe devam ediyor (D'deki örnek). 96H.9 eskortu hedefte tutuyor; yoldaki ordunun geri çağrılması eklenmedi (açık konu). |

## 4. Durumlar A–E

- **A — savunmasız sistem.** `aiArmyTick` kolonisiz sistemi atlıyor. `aiInvasionTarget` yalnız `colonies > 0` hedefte ordu satın alıyor. Uzay zaferi sahipliği değiştiriyor. Değişmedi; gereksiz ordu yok.
- **B — zayıf koloni.** 96H.8'de ordu satın alınamıyor ve kuşatma garnizon yenilenmesinde kilitleniyor. 96H.9'da ordu hazırlıkta alınıyor, eskortlu çıkarma temiz fetih yapıyor (seed11 ay66: gün 2130).
- **C — güçlü koloni.** Ordu yalnız `aiArmyTick`'in değişmeyen koşullarıyla (güç ≥ savunma × 0,8, kalkan ≤ 55) yola çıkıyor; çıkarma yine kalkan ≤ 5 ister. Ordu yetersizse kuşatma sürer. Ordu yetişmezse mevcut 6 aylık kural katastrofla sonuçlanabilir (seed23, §6).
- **D — donanma çekilmek zorunda.** Çekilme yolları sırasıyla şunlar: merkez savunması, tehdit altındaki sistem, `recovery`/`stabilize` ve karşılanamayan konuşlanmanın geri çağrılması. Hepsi bekletme döngüsünden **önce** çalışıyor ve değişmedi. Yoldaki ordu hâlâ geri çağrılmıyor (açık).
- **E — hedef alındı veya savaş bitti.** `aiInvasionTarget` sonuç vermiyor (hedef artık kendi sistemi ya da savaş yok). Kampanya yeni hedef seçiyor; eski hedefteki filo yeni rally'ye çağrılıyor; boştaki orduyu `aiArmyTick` yeniden görevlendiriyor. Seed11 ay79'da fetihten sonra kampanya sys25'e geçti.

## 5. 96H.9 değişikliği (aday BC)

**B — ordu satın alma.** `aiInvasionTarget(e)` yalnız okur ve RNG kullanmaz. Döndürdüğü değer:

- kampanyanın (`build`/`gather`/`fund`/`attack`) bilinen kolonili, savaşta olunan hedefi;
- yoksa kendi filosuyla görülen gerçek bir kuşatma (aiArmyTick testleri);
- ikisi de yoksa `null`.

`aiShipProduction` savaşta, ordusu ve kuyrukta ordusu yokken, önce orduyu dener:

- satın alma, kapasite, enerji, alaşım ve sürdürülebilirlik kapıları aynı kalır;
- tek eksik alaşım bütçesi/rezerviyse, ordu bedeli o ay savaş gemilerinden **ayrılır** (`armyHold`, `aiRecoveryInvestment` gibi türetilmiş rezerv);
- hiçbir kaynak verilmez;
- başka bir kapı düşerse üretim ve Save8 96H.8 ile bayt bayt aynıdır (test ediliyor).

**C — kuşatmayı sürdürme.** `aiMilitaryCampaign` son döngüsünde, kampanya hedefinde duran `force` filoları artık rally'ye çağrılmıyor. Diğer bütün geri çağırma yolları ve sırası aynı.

Yeni Save alanı yok: blokların yazdığı tek durum mevcut aylık `aiShipPlan.reasons`. Toplam fark 31 satır ekleme, 3 satır değişiklik (`research/96h9/candidate-BC-ACCEPTED.patch`).

## 6. Adaylar

| Aday | Ne | Sonuç |
|---|---|---|
| A | Yalnız gerçek kuşatmada ordu niyeti + koşulsuz alaşım ayırma | **RET.** Alaşım birikti ama ordu `energy-runway`'de düştü (seed11 devlet1: net −148, gerekli 1776, mevcut 1688). Ayırma savaş gemilerini boşuna engelledi. 0 kara savaşı. |
| B | Yalnız ordu satın alma | **RET (tek başına).** İlk gerçek kara savaşları geldi: seed23 sys41 ay39'da temiz alındı; seed11 sys5 ay93'te alındı. Fakat ordular eskortsuz kaldı (D): seed11 5 dünyada 34 ordu filosu kayıp. |
| C | Yalnız kuşatmayı sürdürme | **RET (tek başına).** Ordu olmadan tutulan kuşatma bitmiyor. Seed11 240 ayda savaş terhisi 34,8 → 46,2; 8×120 tek dünya toplamında 11 → 47. |
| **BC** | B + C | **KABUL.** Ordu hazırlıkta alınıyor, eskort hedefte kalıyor. Seed11'de ordu kaybı B'nin yarısı (16 / 34), savaş terhisi 34,8 → 3,8. |

## 7. Aynı Save karşılaştırmaları (gerçek Save8, aynı RNG)

Deterministik örnekler (testlerde):

- **Seed11 ay66** (`tests/fixtures/96h9/seed11-month66-siege.save`; seed11 ay40 + 1230. günde 4 RNG çekimi + 26 ay). Devlet1 oyuncunun sys6 kolonisini kuşatıyor.
  - 96H.8: 6 ayda hiç ordu ödenmiyor; garnizon 43 → 4'te takılıyor, fetih yok.
  - 96H.9: ordu ilk ayda kuyrukta; gün 2130'da kara savaşı (ordu kaybı 1,1); sys6 **temiz** düşüyor.
- **Seed11 ay79** (`seed11-month79-escort.save`; aday B dünyası, ordu zaten var). Devlet3 sys5'i kuşatıyor.
  - 96H.8: eskort gün 2400'de rally 31'e çağrılıyor; ordu tek başına varıyor ve kayboluyor.
  - 96H.9: eskort (4420 güç) kalıyor; gün 2430'da temiz fetih (ordu kaybı 0,4).

Plasebolu pencereler (kontrol ve BC; her biri ana + 4 tek RNG çekimli dünya; `SAME-SAVE.json`):

| Pencere | 96H.8 | 96H.9 |
|---|---|---|
| s11m60, 36 ay | Koloni fethi [0,0,1,0,0] (tek fetih katastrofla) | [0,2,1,1,2], hepsi temiz |
| s11m40, 60 ay | Devlet3 terhisi [7,0,9,37,23], 3/5 dünyada donanma çöküyor | [0,0,6,0,0]; 3/5 dünyada devlet1 sys6'yı ay71–73'te temiz alıyor |
| s23m15, 40 ay | Devlet5 sys41'i 2/5 dünyada alıyor (ay53–54) | 5/5 dünyada alıyor (ay35–37); ordu yok, 3'ü katastrof |

Seed23'te B tek başına sys41'i ay39'da temiz alıyor. BC ise kuşatmayı tuttuğu için 6 aylık katastrof ordudan önce geliyor.

## 8. Uzun kampanyalar

**8 seed × 120 ay** (kanonik `replay.js`, 96H.8 → 96H.9):

| Ölçüt | 96H.8 | 96H.9 |
|---|---|---|
| Kritik devlet-ay | 14 | 14 |
| Teknoloji | 335 | 335 |
| Koloni | 131 | 138 |
| Gemi | 1405 | 1416 |
| Güç | 194060 | 192565 |
| Yaşayan | 40 | 40 |
| Savaş | 11 | 11 |
| Teslimat | 443 | 417 (seed11 72 → 48) |
| Koloni fethi | 3 | 5 (temiz 0 → 1) |
| Ordu gemisi | 27 | 31 |
| Savaş terhisi | 11 | 6 |
| Konuşlanma kaynaklı savaş terhisi (96H.8 düzeneği) | 0 | 0 |

Seed 42, 404, 7, 123 ve 2026'da ay ay Save ve RNG birebir aynı. İlk RNG ayrışması: seed11 ay33, seed23 ay18, seed99 ay115.

**5 dünya × 240 ay dağılımları** (ortalama [min..max]; ana dünya + 4 tek RNG çekimli plasebo; `DISTRIBUTION-240.json`, `CAPTURES-240.json`, `ARMY-FATES-240.json`, `ARMY-COST-240.json`, `TRADE-240.json`, `DISBAND-SPLIT-240.json`):

| Ölçüt | Seed11 · 96H.8 | Seed11 · 96H.9 | Seed23 · 96H.8 | Seed23 · 96H.9 |
|---|---|---|---|---|
| Koloni fethi | 1,6 [0..5] | 3,8 [2..7] | 3 [2..6] | 1,8 [1..3] |
| Temiz (ordulu) | 0,2 [0..1] | 2,6 [2..3] | 0 | 0,2 [0..1] |
| Katastrof | 0,6 | 0,2 | 0,6 | 1,2 |
| Başkent (5 dünya toplamı) | 3 | 11 | 5 | 5 |
| Ordu filosu kayıp / istilada tükenen (toplam) | 3 / 2 | 16 / 13 | 21 / 0 | 14 / 1 |
| Ordu alaşımı / temiz fetih (toplam) | 980 / 1 | 3150 / 13 (242 alaşım/fetih) | 2520 / 0 | 2590 / 1 |
| Savaş terhisi (gemi) | 34,8 [0..95] | 3,8 [0..13] | 0 | 11,4 [0..33] |
| Konuşlanma kaynaklı terhis (toplam) | 59 | 0 | 0 | 57 |
| Gemi | 154 | 202,8 | 247,4 | 300,2 |
| Güç | 36347 [21884..55600] | 73881 [60491..85579] | 76447 | 75260 |
| Koloni | 17 | 25,6 | 26,2 | 27 |
| Teknoloji (galaksi) | 63 [57..68] | 59,2 [50..69] | 72 [67..75] | 86 [74..96] |
| Teslimat (yaşayan AI) | 130,4 | 8,8 | 0,8 | 143,8 |
| Kritik devlet-ay | 4,6 [0..17] | 4,6 [0..16] | 1 | 2 [1..5] |
| Yaşayan AI | 4,6 | 3,6 | 4 | 5 |

Kanonik 4 × 240 toplamları: kritik 53 → 68 (seed11 1 → 16, hepsi ana dünyada ay 218'de ayrılıkla doğan yeni devlet 7), teslimat 1006 → 981, teknoloji 348 → 360, koloni 92 → 103, güç 259018 → 304057.

**Seed11 ticaret düşüşünün nedeni.** Seed11'de tek ticaret çifti var: devlet 4–5. 96H.9'da devlet3, devlet5'in iki kolonisini (sys5, sys25) çoğunlukla temiz çıkarmayla alıyor ve devlet5'i 5/5 dünyada ay 50–104 arasında yok ediyor (10 fethin 7'si temiz). 96H.8'de devlet5 5/5 dünyada yaşıyor. Teslimat ortağın yok oluşuyla bitiyor. Yaşayan devletlerin teknolojisi eşit veya yüksek; ay120'deki galaksi teknolojisi düşüşü yalnız teknoloji lideri devlet5'in kaybı. Fatih devlet3 ay240'ta 10–16 koloni, 23–30 teknoloji, 2795–27704 enerji ile bitiriyor; 96H.8'de 0–8 koloni ve 2–17 teknoloji, bir dünyada yok oluyor.

**Seed23'teki iki konuşlanma terhisi** 96H.9 bloklarından gelmiyor:

- pl2, devlet1 ay200: 30 gemiyi `jointAdvance` (ortak sefer) gönderdi;
- pl4, devlet5 ay159: `build`/`gather` rally hareketi düşman sistemi 10 üzerinden geçti. Bu durumda 96H.8 kodu da aynı kararı veriyor.

İki yol da 96H.8 kapısının kapsamı dışında ve açık konu olarak kaydedildi. 10 dünyada konuşlanma kaynaklı terhis toplamı 59 (96H.8) / 57 (96H.9).

**Savunma.** 20 dünyada, sahibinin filosu başka yerde kuşatma tutarken düşen başkent: 0. Seed11'de başkent kayıpları 3 → 11; bunlar yeni saldırganın gerçek fethi, savunma kodu değişmedi.

## 9. Performans

Ölçüm: seed11 ay40 Save'inden 60 ay; her kol 3 kez, sırayla dönüşümlü; boş 4 çekirdekli konteyner; Node v22.22.0. Değerler çağrı başına medyan ms. Ayrıntı: `research/96h9/PERFORMANCE.json`.

| Fonksiyon | 96H.8 | 96H.9 |
|---|---|---|
| `aiShipProduction` | 1,218 | 1,280 |
| `aiMilitaryCampaign` | 0,417 | 0,342 |
| `aiArmyTick` | 0,036 | 0,113 |
| `aiTurn` | 3,52 | 3,76 |
| `monthTick` | 41,5 | 43,2 |

İlk ordudan sonra kollar ayrışıyor. 96H.9 dünyasında daha çok ordu ve gemi var; bu yüzden fark yalnız kod maliyeti değil ve koşular arası oynama aynı büyüklükte (`monthTick` 39,6–43,2).

`aiInvasionTarget`'in kendi maliyeti: en kötü durumda 0,063 ms, kampanya hedefi varken 0,0013 ms (45 sistem, 48 filo). Ayda devlet başına en çok bir kez, yalnız savaşta ve ordu yokken çağrılıyor.

Fiziksel Android ölçümü NOT RUN.

## 10. Testler

Tüm sonuçlar Node v22.22.0'da alındı.

- **Tam regresyon:**
  - taban `8413f6e`: 137 paket, 6087 PASS / 3 FAIL;
  - 96H.9: 138 paket, 6098 PASS / 3 FAIL;
  - mevcut 137 paketin sayıları birebir aynı.
- **3 FAIL** önceden var olan `faz95d_identity_test.js` vakalarıdır: seed 11/99/404 coğrafya koordinatlarında son ondalık basamak farkı. Yol normalizasyonundan sonra günlük önce ve sonra bayt bayt aynı. Fixture yenilenmedi.
- **Yeni paket** `faz96h9_invasion_test.js` (11 PASS):
  - iki gerçek Save8 hata yeniden üretimi ve 96H.9 karşılıkları;
  - salt okunur hedef;
  - yalnız-alaşım ayırma;
  - ordunun önce alınması;
  - enerji kapısında Save8 baytlarının 96H.8 ile aynı kalması;
  - Save8 ve RNG;
  - kural dosyalarının baytları;
  - strip adaptörü.
- **Güncellenen koruma testleri:** `faz96h8_campaign_cost_test.js`, `faz96h71_closed_joint_save_test.js` ve `faz96h31_compact_construction_test.js` önce `stripReviewedH9` uyguluyor. Hash'ler değişmedi.
- **Chromium** `browser-96h9.cjs`: 24/24 PASS, sayfa hatası 0. Önceki 21 senaryoya şunlar eklendi:
  - seed11 ay66 temiz fetih (iki ekran yönü);
  - seed11 ay79 eskortlu fetih.
- **Fiziksel Android:** NOT RUN.

## 11. Açık sorunlar

1. Yoldaki ordu, eskort çekilince yeniden değerlendirilmiyor (`aiArmyTick` yalnız boştaki taşıyıcı).
2. Ordu yetişmeden tutulan kuşatma 6 ayda katastrofa dönebiliyor (seed23 sys41, 5/5). Fetih erken ama yıkıcı.
3. `jointAdvance` ve rally toplanma rotası konuşlanma bakım kapısının dışında (seed23 2 terhis).
4. `aiArmyTick` gezegen kalkanını doğrudan okuyor (eski davranış, değiştirilmedi).
5. 96H.8 açıkları: `aiDisbandTick` aşırı kesinti; ekonomi kuyruk zamanı.
6. Fiziksel Android testi hiç çalıştırılmadı.

## 12. Sonraki dar öneri

Ordu sevkine eskort bağı: `aiArmyTick`, yoldaki taşıyıcının hedefinde kendi silahlı kuvveti kalmadıysa onu en yakın güvenli ikmal düğümüne döndürsün. Bunu aynı Save'den (seed11 ay79 kontrol kolu) kontrol–aday ve plasebo bandıyla ölçün.
