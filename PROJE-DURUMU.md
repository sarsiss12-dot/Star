# STARS — Güncel proje durumu

Son güncelleme: 2026-10-29. Depo `sarsiss12-dot/Star`.

## Oynanabilir sürüm

| | `main` (birleşmiş) | Bu dal (PR) |
|---|---|---|
| Faz | 96H.8 | 96H.9 |
| Build / PWA | `96h8` / `stars-v96h8` | `96h9` / `stars-v96h9` |
| Save | v8 | v8 (şema değişmedi) |
| Oyun ZIP | `releases/stars-faz96h8.zip` | `releases/stars-faz96h9.zip` |
| Taban HEAD | `8413f6e5e8702c0c866f6ac3cfb8748177579e9d` | — |
| Değişen runtime | — | `ai.js` (ordu satın alma + kuşatmayı sürdürme), `main.js` (`BUILD_ID`), `sw.js` (`CACHE`) |

96H.6.2, 96H.6.3 ve 96H.7 yalnız araştırmadır; oyun yayımlamadılar.

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

- Tam regresyon: taban `8413f6e` 137 paket 6087 PASS / 3 FAIL; 96H.9 138 paket 6098 PASS / 3 FAIL (mevcut 137 paket aynı, yeni paket 11 PASS). Chromium `browser-96h9.cjs` 24/24 PASS, sayfa hatası 0.
- Önceden var olan 3 FAIL: `faz95d_identity_test.js`, seed 11/99/404 coğrafya koordinatlarında son ondalık basamak farkı (Node/V8 kayan nokta). 96H.7.1, 96H.8 ve 96H.9'da değişiklikten önce ve sonra aynı. Fixture yenilenmedi.
- Test yan etkisi: `tests/navy-95a-after-*.json`, `tests/audit-95d/…`, `tests/audit96e1/…`, `tests/audit96g2/`; commit öncesi geri alın.

## Açık konular (sıralı)

1. Yoldaki ordu, eskort çekilince yeniden değerlendirilmiyor (`aiArmyTick` yalnız boştaki taşıyıcı). Ordu yetişmezse tutulan kuşatma 6 ayda katastrofa dönebiliyor.
2. `jointAdvance` ve rally toplanma rotası konuşlanma bakım kapısının dışında (seed23 240 ayda 2 terhis).
3. `aiDisbandTick` kesintiyi taban bakımla sayıyor (aşırı kesinti); kural değişmedi.
4. Dokuz stratejik hedefin başarı ölçümü dolaylı (contain/security/recovery).
5. Ekonomide kuyruk zamanı ve takip eden üreticinin finansmanı; seed11/404 geç dönem yeni devletleri.
6. Büyük galaksi (120+ sistem) reddedildi; sınırlar 100/11. Fiziksel Android testi hiç çalıştırılmadı.

Reddedilmiş adaylar: `AI-RED-KARARLARI.md`.
