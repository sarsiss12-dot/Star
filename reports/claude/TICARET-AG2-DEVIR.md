# TİCARET-AĞ.2 — Devir (sonraki Claude oturumu)

Güncelleme: 22 Kasım 2026

## Dallar
| Dal | HEAD | Durum |
|---|---|---|
| `claude/stars-ticaret-ag2` | son rapor commit'i (kod / sürüm `ec32cd3`) | **p50 / MP.8.9b49 — otomatik testlerden geçmiş yayın adayı** (taslak PR, saha kabulü yok) |
| `claude/stars-ticaret-ag1` | `b653523` | PR #71 (değiştirilmedi) |
| `claude/stars-ticaret-ag0` | `23cc1bb` | PR #70 (değiştirilmedi) |
| `claude/stars-saha-guvence1` | `e4350e5` | p49 / MP.8.9b48 — önceki güvenli dal, sabit karşılaştırma tabanı (PR #69) |

**Render'da sonraki kullanıcı testi için:** `claude/stars-ticaret-ag2` (p50; ticaret dahil). Ticaretsiz geri dönüş gerekirse `claude/stars-saha-guvence1` (p49). Canlı Render bu oturumda değiştirilmedi.

## Tamamlananlar
1. TL2–TL4: kök neden misafirde `archive-ui.js` `resolve` kapısının dünya / kayıt yenilenince KABUL'ü sessizce düşürmesiydi. Düzeltme yalnız misafirde (`MP6Stars.S.on`); tek oyunculu / host'ta kayıt yüklemesinden sonra eski pencere düğmesi etkisiz kalır (faz87d / faz91e / faz95b / faz95e testleri bunu korur — ilk düzeltme denemesi bunları bozdu, sınırlandırıldı). TL 5/5.
2. `dealTxScope` / `dealTxBegin(scope)`: AI–AI, yalnız `freight` / `portTransit`, gelen kutusu kaydı yok, `G.commerce` var ⇒ `[G.commerce, a, b, G.log]` kopyası. `pact` haber + ekonomi geçmişi yazdığından tam işlemde. Kanıt `tests/ticaret_ag2_tx_test.js` (6/0) + 24 ay eşdeğerlik.
3. Performans kapısı geçti (3 koşu birleşik p95: 100 sistem +%0,10, 500/120 −%0,67, 500/180 −%1,90).
4. p50 sürüm + deterministik ZIP (`26a6b5e3…`, CRC32 `8D1FE07F`).

## Son başarılı testler
Tam Node 245 / 6551 / 279 (p49 242 / 6532 / 279; yeni FAIL yok). Chromium TL 5/0, TA 6/0, SG 5/0, O 11/0, J 5/0, SE 8/0, X 5/0, SP 800×360 3/0, 844×390 3/0. Node `ticaret_ag2_tx` 6/0, `ticaret_ag2_mp` 2/0, `ticaret_ag1` 9/0, `ticaret_agi0` 28/0.

## İlk başarısız (bu fazda) ve çözümü
- TL2 (eski archive-ui) — ürün hatası, düzeltildi.
- Tam Node ara koşu 4 yeni FAIL (ilk archive-ui düzeltmesi tek oyunculu yükleme güvenliğini bozdu) — misafirle sınırlandırıldı.
- `ticaret_ag2_tx` ilk sürümde `pact` kapsam dışı yazım (G.news, G.economyHistory) yakaladı — `pact` tam işlemde bırakıldı.

## NOT RUN
Fiziksel Android, gerçek uzak internet, gerçek LAN, canlı Render; Chromium MP'de ara liman geçişi / izin kaybı / ara liman fethi / kargolu kayıt → yeni oda (Node'da PASS); "aktif uzun rota" perf ayı.

## Sonraki ilk kesin görev
Kullanıcı test edebildiğinde: Render'da `claude/stars-ticaret-ag2` ile 2 cihaz (host + misafir) — transit izni iste/kabul, fiziksel kargo, anlık takas, kayıt → yeni oda. Kullanıcı test edemiyorsa: **TİCARET-AI.0** (AI'nın Transit İzni satın alması ve uzun rota kullanımı doğal kampanyada gözlenmiyor — `Commerce.aiOpportunityTick` → `aiTransitRequest` koşulları ölçülerek başla; p50 sabit kopya kontrol kökü, plasebo bandı). FED-AI-SİYASET.0 ondan sonra.
