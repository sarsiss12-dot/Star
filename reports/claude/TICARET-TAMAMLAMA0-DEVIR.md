# TİCARET-TAMAMLAMA.0 — Devir (sonraki Claude oturumu)

Güncelleme: 23 Kasım 2026

## Dallar
| Dal | Durum |
|---|---|
| `claude/stars-ticaret-tamamlama0` | **p51 / MP.8.9b50 yayın adayı** (otomatik testler; saha kabulü yok), taslak PR #75 (taban ai1) |
| `claude/stars-ticaret-ag2` | p50 / MP.8.9b49, önceki güvenli sürüm (PR #72) |
| `claude/stars-ticaret-ai1`, `-ai0` | araştırma (PR #74, #73) |

Render'da sonraki kullanıcı testi için `claude/stars-ticaret-tamamlama0` kullanılmalı; geri dönüş `claude/stars-ticaret-ag2`. main ve canlı Render değiştirilmedi.

## Yapılanlar
1. **Faz A.** Atomik iki yönlü Transit İzni (`commerce.js` `aiTransitRequest` + `aiDealWould`). Test `tests/ticaret_tamamlama0_transit_test.js` T1–T12: aday 12/0, p50 9/3.
2. **Faz D.** Klavyesiz miktar: `ui.js` `dealAmount` −100 / +100 / MAKS / 25; `stepperize` sıklık ±30, süre ±3 / ±12; `index.html` `.amountControls` satır kaydırma. Test `tests/browser-ticaret-tamamlama0-sp.cjs` (800×360 / 844×390 / 901×411): aday 9/0, p50 1/2.
3. **Sürüm.** p51 / MP.8.9b50; ZIP `releases/stars-faz96h10p51.zip` (SHA-256 `9c513c0b…c434`, CRC32 `D82CE4BE`); kayıt `RELEASE-TICARET-TAMAMLAMA0.json`.
4. **Performans.**
   - 500 sistem 6 koşu birleşik p95 +%0,20 / −%1,37.
   - 100 sistem +%6,08, ama A/A (p50 ↔ p50) −%6,12. Deterministik iş sayımı (`research/ticaret-tamamlama0/ay-is-sayimi.cjs`) iki kolda aynı rota araması ve Save8 / RNG veriyor → gürültü.

## İlk başarısız / dikkat
- Perf aracı (`ay-maliyeti.cjs`) çıktı yolu olarak bir **dizin** ister. `STARS_CHROMIUM_PATH` ortam değişkeni `node` komutuna verilmeli (`export` kullan); yoksa `/usr/bin/chromium` aranır ve çöker.
- 100 sistem perf ölçümü tek koşuda ±%30 oynayabilir. Kapı kararında A/A koşusu ve deterministik iş sayımı birlikte kullanılmalı.
- Chromium testleri `STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium` olmadan başlamaz.

## NOT RUN
- Fiziksel Android, gerçek LAN, uzak internet, canlı Render.
- Aktif uzun rota perf ayı.
- 180 / 240 ay kampanyası (yeni ekonomik aday yok).
- Faz G ek denetimleri.
- C10 ticaret amaçlı kolonileştirme.

## Sonraki ilk kesin görev
Kullanıcı test edebiliyorsa: Render'da `claude/stars-ticaret-tamamlama0` ile 2 cihaz. Kapsam: miktar düğmeleri, sözleşme formu, transit izni, kargo, kayıt → yeni oda.

Edemiyorsa: planlanan **savaş desteği AI** fazı. Ticaret tarafında kalanlar:
- D8 hata mesajı ayrıştırma;
- D4 tek ekranda tek seferlik ↔ düzenli ticaret geçişi;
- perf aracının 100 sistem gürültüsü (daha çok örnek ya da işlem sayımı kapısı).
