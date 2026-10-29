# STARS — Güncel proje durumu

Son güncelleme: 2026-10-29. Depo `sarsiss12-dot/Star`.

## Oynanabilir sürüm

| | `main` (birleşmiş) | Bu dal (PR) |
|---|---|---|
| Faz | 96H.9 | 96H.10 |
| Build / PWA | `96h9` / `stars-v96h9` | `96h10` / `stars-v96h10` |
| Save | v8 | v8 (şema değişmedi) |
| Oyun ZIP | `releases/stars-faz96h9.zip` | `releases/stars-faz96h10.zip` |
| Taban HEAD | `54058e08e2f9102f6e4b37195f1490f6fa389f99` | — |
| Değişen runtime | — | `ai.js` (`aiArmyTick` ordu güvenliği), `main.js` (`BUILD_ID`), `sw.js` (`CACHE`) |

96H.6.2, 96H.6.3 ve 96H.7 yalnız araştırmadır; oyun yayımlamadılar.

## 96H.10 — kara ordusu güvenliği (kabul edildi)

Ayrıntı: `AI-KARA-ORDUSU-GUVENLIGI-96H10.md`. Kanıt: `research/96h10/`. Testler: `tests/faz96h10_army_safety_test.js`, `tests/browser-96h10.cjs`.

- **Ordu artık görünür düşman gücünün tuttuğu sisteme gönderilmiyor.** Görünür düşman savaş gücü, oradaki ya da oraya giden kendi savaş filolarını ×1,15 payıyla aşıyorsa silahsız ordu o sisteme gönderilmiyor (taarruz, sınır ve savunma hedefleri).
- **Yoldaki ordu yeniden karar veriyor.** Varış güvensizleşirse ya da hedef geçersizleşirse (ele geçirildi, savaş bitti) ordu yeniden yönlendiriliyor.
- **96H.9'un kanıtlanmış hatası:** ordular, korsan ya da düşman filosunun tuttuğu kendi kolonilerine tek tek gönderilip varışta ölüyordu. seed11 pl1, sys20: 13 emir, 12 ölü ordu.
- **Değişmeyenler:**
  - ortak sefer, teslimat ve oyuncu emirleri;
  - istila, kalkan, garnizon ve katastrof kuralları;
  - 96H.8 ve 96H.9 davranışları;
  - Save şeması ve RNG.

Sonuç, uzay savaşında kaybedilen ordu gövdesi (5 dünya × 240 ay ve 8 × 120):

| | 96H.9 | 96H.10 |
|---|---|---|
| seed11 | 22 | 12 |
| seed23 | 16 | 13 |
| 8 × 120 | 10 | 9 |

Temiz fetih, koloni fethi, katastrof, kritik ay, terhis ve ticaret aynı. Plasebo bantlarında ordu kaybı medyanı tetiklenen 7 dünyanın hepsinde eşit ya da düşük.

Reddedilenler: D2 (güvenli rota), P (salınım), E (ordu alaşım tavanı).

Seed23 katastrofları çözülmedi: saldırgan orduyu karşılayamıyor (ekonomi eşiği). Ayrı faz kararı gerekir.

## 96H.9 — kara ordusu koordinasyonu (kabul edildi)

Ayrıntı: `AI-ISTILA-VERIMLILIGI-96H9.md`. Kanıt: `research/96h9/`. Testler: `tests/faz96h9_invasion_test.js`, `tests/browser-96h9.cjs`.

- **Ordu artık hazırlıkta alınıyor.** Kampanyanın bilinen kolonili bir savaş hedefi varsa, ordu kampanya hazırlanırken alınıyor. Eskiden ucuz savaş gemileri her savaş ayının alaşımını önce tüketiyordu; 70 alaşımlık ordu hiç alınamıyordu (seed11'de 484 denemenin 430'u).
  - Tek eksik alaşımsa, ordu bedeli o ay savaş gemilerinden ayrılıyor; kaynak verilmiyor.
  - Başka bir kapı düşerse üretim 96H.8 ile aynı.
- **Kuvvet hedefte kalıyor.** Hedefe ulaşan kampanya kuvveti artık her AI turunda rally'ye çağrılmıyor ve kuşatmayı sürdürüyor. Eskiden eskort çekiliyor, gelen ordu tek başına kalıp yok oluyordu.
- **Değişmeyenler:**
  - istila, kalkan, garnizon ve savaş kuralları (`economy.js` / `combat.js` / `diplomacy.js` baytları aynı);
  - savunma öncelikleri;
  - 96H.8 bakım kapısı, müfreze ve geri çağırma.

Sonuç, seed11'de 5 dünya × 240 ay:

| Ölçüt | 96H.8 | 96H.9 |
|---|---|---|
| Temiz kara istilası | 1 | 13 |
| Koloni fethi | 8 | 19 |
| Savaş terhisi (ortalama) | 34,8 | 3,8 |

8 seed × 120 ay: kritik devlet-ay 14 = 14, teknoloji 335 = 335, koloni 131 → 138.

Ödünler:

- **Seed11 ticareti 130 → 9 düşüyor.** Tek ticaret ortağı (devlet5) fethediliyor.
- **Seed23'te sys41 daha erken ama katastrofla düşüyor.** Ordu yetişmeden 6 aylık kuşatma doluyor.

## 96H.8 — askerî sefer verimliliği

Sabit başarısız-hedef beklemesi, sevk öncesi gerçek bakım kapısı, karşılanabilir müfreze ve terhis öncesi geri çağırma. Ayrıntı: `AI-SEFER-VERIMLILIGI-96H8.md`; kanıt: `research/96h8/`. 96H.9'da korunuyor: 8 × 120 ayda konuşlanma kaynaklı savaş terhisi 0 = 0.

## 96H.7.1 — kapanmış ortak sefer Save8 yüklemesi

`restoreJoint`, kapanmış geçmiş kayıtta en az 1 üye (sponsor) kabul ediyor; aktif planlar için 2 üye şartı sürüyor. Test: `tests/faz96h71_closed_joint_save_test.js`.

## Bilinen test durumu (Node v22.22.0)

- Tam regresyon: taban `54058e0` 138 paket 6098 PASS / 3 FAIL; 96H.10 139 paket 6109 PASS / 3 FAIL (mevcut 138 paket aynı, yeni paket 11 PASS). Chromium `browser-96h10.cjs` 27/27 PASS, sayfa hatası 0.
- Önceden var olan 3 FAIL: `faz95d_identity_test.js`, seed 11/99/404 coğrafya koordinatlarında son ondalık basamak farkı (Node/V8 kayan nokta). 96H.7.1–96H.10'da değişiklikten önce ve sonra aynı. Fixture yenilenmedi.
- Test yan etkisi: `tests/navy-95a-after-*.json`, `tests/audit-95d/…`, `tests/audit96e1/…`, `tests/audit96g2/`; commit öncesi geri alın.

## Açık konular (sıralı)

1. Saldırı altındaki tersanede doğan ordular varışta ölüyor (96H.9 kontrolünde 11 gövde). Üretim yer seçimi tehdidi görmüyor.
2. Savunma adımında ordular ileri-geri salınıyor (aday P ölçüldü ve reddedildi). Son şeritte ya da ara sistemde ölüm (D2 reddedildi).
3. Yoksul saldırgan orduyu karşılayamıyor (aylık alaşım tavanı ve maden). Tutulan kuşatma 6 ayda katastrofa dönüyor (seed23 sys41, 5/5). Ekonomi eşiği; ayrı faz kararı.
4. `incomingArmy` ateşkesi yalnız son atlayıştaki orduyu görüyor; 96H.9'daki 28 fethin hiçbirinde devreye girmedi. Motor kuralı.
5. `jointAdvance` ve rally toplanma rotası konuşlanma bakım kapısının dışında (seed23 240 ayda 2 terhis).
6. `aiDisbandTick` kesintiyi taban bakımla sayıyor (aşırı kesinti); ekonomide kuyruk zamanı sorunu sürüyor.
7. Büyük galaksi (120+ sistem) reddedildi; sınırlar 100/11. Fiziksel Android testi hiç çalıştırılmadı.

Reddedilmiş adaylar: `AI-RED-KARARLARI.md`.
