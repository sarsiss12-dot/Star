# STARS — Güncel proje durumu

Son güncelleme: 2026-10-28. Depo `sarsiss12-dot/Star`.

## Oynanabilir sürüm

| | `main` (birleşmiş) | Bu dal (PR) |
|---|---|---|
| Faz | 96H.7.1 | 96H.8 |
| Build / PWA | `96h71` / `stars-v96h71` | `96h8` / `stars-v96h8` |
| Save | v8 | v8 (şema değişmedi) |
| Oyun ZIP | `releases/stars-faz96h71.zip` | `releases/stars-faz96h8.zip` |
| Taban HEAD | `698874ce2d25c7bddbc17021f2cd825c48b87712` | — |
| Değişen runtime | — | `ai.js` (askerî sefer kararı), `main.js` (`BUILD_ID`), `sw.js` (`CACHE`) |

96H.6.2, 96H.6.3 ve 96H.7 yalnız araştırmadır; oyun yayımlamadılar.

## 96H.8 — askerî sefer verimliliği (kabul edildi)

Ayrıntı: `AI-SEFER-VERIMLILIGI-96H8.md`; kanıt: `research/96h8/`; testler: `tests/faz96h8_campaign_cost_test.js`, `tests/browser-96h8.cjs`.

- Başarısız hedef bekleme süresi artık sabit. Eskiden her ay yeniden yazılıyor ve süresiz kilit oluşuyordu (seed11 devlet1: 2160 → 2790).
- Saldırı emri vermeden önce, gönderilecek gerçek filonun hedefteki enerji ve alaşım bakımı mevcut formülle hesaplanıyor. Açık bütçeli sevk, 180 günlük sefer süresi boyunca terhis kriz bandına girmemeli.
- Tam sevk karşılanamıyorsa, birleştirilmiş rally yığınından ihtiyacı karşılayan ve bakımı karşılanan bir müfreze ayrılıyor. O da karşılanamıyorsa sefer `fund` aşamasında bekliyor.
- Yabancı sistemdeki konuşlanma, `aiDisbandTick` krizi gelmeden eve çağrılıyor.

Sonuç: 8 seed × 120 ayda savaşta konuşlanma kaynaklı terhis 12 gemiden 0'a indi; kritik devlet-ay 14 = 14, güç +%3,3. Seed11 devlet3'ün donanması, plasebo bandının çok dışında korunuyor.

## 96H.7.1 — kapanmış ortak sefer Save8 yüklemesi

`restoreJoint`, kapanmış geçmiş kayıtta en az 1 üye (sponsor) kabul ediyor; aktif planlar için 2 üye şartı sürüyor. Test: `tests/faz96h71_closed_joint_save_test.js`.

## Bilinen test durumu (Node v22.22.0)

- Tam regresyon: taban `698874c` 136 paket 6075 PASS / 3 FAIL; 96H.8 137 paket 6087 PASS / 3 FAIL (mevcut 136 paket aynı, yeni paket 12 PASS). Chromium `browser-96h8.cjs` 21/21 PASS.
- Önceden var olan 3 FAIL: `faz95d_identity_test.js`, seed 11/99/404 coğrafya koordinatlarında son ondalık basamak farkı (Node/V8 kayan nokta). 96H.7.1 ve 96H.8'de değişiklikten önce ve sonra aynı. Fixture yenilenmedi.
- Test yan etkisi: `tests/navy-95a-after-*.json`, `tests/audit-95d/…`, `tests/audit96e1/…`, `tests/audit96g2/`; commit öncesi geri alın.

## Açık konular (sıralı)

1. Kolonili hedef kara ordusu olmadan düşmüyor; müfreze kuşatma yapıyor. Ordu ve işgal koordinasyonu ayrı iş.
2. `aiDisbandTick` kesintiyi taban bakımla sayıyor (aşırı kesinti). 96H.8 bu duruma girmeyi önlüyor, kuralı değiştirmedi.
3. Dokuz stratejik hedefin başarı ölçümü dolaylı (contain/security/recovery).
4. Ekonomide kuyruk zamanı ve takip eden üreticinin finansmanı; seed11/404 geç dönem yeni devletleri.
5. Seed23 uzun dönem teknoloji ortalaması 96H.8'de hafif düşük (gürültü içinde); izlenmeli.
6. Büyük galaksi (120+ sistem) reddedildi; sınırlar 100/11. Fiziksel Android testi hiç çalıştırılmadı.

Reddedilmiş adaylar: `AI-RED-KARARLARI.md`.
