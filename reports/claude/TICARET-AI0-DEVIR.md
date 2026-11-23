# TİCARET-AI.0 — Devir (sonraki Claude oturumu)

Güncelleme: 23 Kasım 2026

## Dallar
| Dal | Durum |
|---|---|
| `claude/stars-ticaret-ai0` | p50 çalışma zamanı (değişmedi) + MP TB testi + ticaret AI araştırması; taslak PR #73, sürüm yok |
| `claude/stars-ticaret-ag2` | p50 / MP.8.9b49 — otomatik testlerden geçmiş en güvenli sürüm (PR #72) |
| `claude/stars-saha-guvence1` | p49, ticaretsiz geri dönüş (PR #69) |

Render'da sonraki kullanıcı testi için `claude/stars-ticaret-ag2` (p50) kullanılmalı. Canlı Render değiştirilmedi.

## Tamamlananlar
1. Faz 0: `MP8_SCEN=TB` Chromium 6/6. Kapsam: ara liman geçişi, yolda izin kaybı, ara liman fethi, tek teslim, host ↔ misafir konvoy eşitliği.
2. Faz A: salt gözlem karar hunisi (`research/ticaret-ai0/funnel2.cjs`). Kök neden:
   - yapısal liman boşluğu %78–%85;
   - bilgi %10–%15;
   - kusur: izinsiz geri rota ön koşulu (izin taşıyıcı başına);
   - rota bütçesi.
3. Faz B–F: iki yönlü transit adayı (yama), kontrollü A/B K1–K6, doğal kampanya 3 tohum × 120 ay (kontrol, aday ve sonucu değiştiren plasebolar).
   - 99 ve 404: bayt eşit.
   - 11: bant içinde.
   - Sonuç: fayda yok → p51 yok.

## Son başarılı testler
- Chromium TB 6/0.
- `verify-release` DOĞRULANDI (96h10p50).
- Kontrollü vakalar: p50 K1 FAIL beklenen, aday K1 / K2 PASS, K3–K6 iki kolda aynı.
- Tam Node: NOT RUN (çalışma zamanı değişmedi; p50: 245 / 6551 / 279).

## İlk başarısız (bu fazda)
- TB: izinsiz de rota bulundu (yalıtılmamış hat). Zincir yalıtıldı.
- TB: izin var ama rota yok, çünkü `identifiedPort` görünürlük istiyor. Gözcüler eklendi ve `updateVision()` çağrıldı.
- Kontrollü K3 (p50'de bile tek yönlü izin yok): fikstürde güven 0 olduğu için sahip +20 Alaşım karşı teklif etti ve teklif edenin tavanını aştı. Fikstüre karşılıklı güven eklendi; bu gerçek motor davranışıdır, kusur değil.

## NOT RUN
- Fiziksel Android, gerçek LAN, uzak internet, canlı Render.
- Chromium'da kargolu kayıt → yeni oda (Node M1 / M2 PASS).
- 180 / 240 ay ve 500 sistem ticaret AI kampanyası.
- Adayın p95 ölçümü ve tam Node koşusu (aday yayınlanmadı).

## Sonraki ilk kesin görev
Kullanıcı test edebiliyorsa: Render'da `claude/stars-ticaret-ag2` (p50) ile 2 cihaz.

Edemiyorsa: ticaret AI'da doğal etkiyi büyütecek kaldıraçlardan birini **ayrı faz kararıyla** seç. Kanıt Faz A hunisinde:
- (a) ara röle liman yatırımı: boşluklar 4–9 sıçrama, en büyük kaldıraç;
- (b) `aiTransitRequest` / `aiPorts` ortak rota bütçesinde yakın çift önceliği;
- (c) sahip değerlemesine göre izin bedeli.

Sonra iki yönlü transit yamasını yeniden ölç. Komutlar `TICARET-AI0-SONUC.md` sonunda.

FED-AI-SİYASET.0 bundan sonra; ekonomik altyapı ve riskler SONUÇ §20'de.
