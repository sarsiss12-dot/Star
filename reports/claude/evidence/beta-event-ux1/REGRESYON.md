# BETA-EVENT-UX.1 — regresyon kaydı (12 Kasım 2026)

Ortam: bulut konteyner, Node v22, Chromium `/opt/pw-browsers/chromium`. Taban = p24 `998e999` (ayrı çalışma ağacı), aday = bu dal (p25).
**NOT RUN:** gerçek Render, fiziksel PC / Android, LAN; Docker'lı mp5; mp0–mp3x, mp62–64, mp71, mp72; uzun mp8 A/B/C.

## Hedefli (FAIL-önce)

| Test | Taban p24 | Aday p25 (son) |
|---|---|---|
| `MP8_SCEN=F` (host + 2 misafir) F0–F5 | **1 / 5** — F1 B 2 / host 4 kuruluş kartı; F2 açıldıktan sonra da 2 / 4; F3 kart düğmesi yok; F4, F5 FAIL | **6 / 0** |
| `browser-event-ux0.cjs` S6–S8 | **0 / 3** | 3 / 0 |
| `browser-event-ux0.cjs` tam (S1–S8 + sayfa hatası) | — | **11 / 0** (son üç ardışık koşu) |

Ara koşularda yakalanan ve korunan ilk FAIL'ler:
- `mpF-ara-kosu-FAIL.log`: davet gelince eski "oylamada" kartı kalıyordu. Ürün hatası; `grp` / rıza satırıyla düzeltildi.
- `sp-ilk-kosu.log`, `sp-kosu4-test-zamanlama.log`: S3 / S6 dokunmadan hemen sonra DOM okuyordu (yüzey çizimi 220 ms ertelenir). Test zamanlaması; ürün durumu doğruydu (tanı satırında `live` kartı vardı). `waitForFunction` ile düzeltildi.
- `mpP-ilk-kosu.log` P7, `mpP-ikinci-kosu.log` P6: oyun durumu kaynaklı fikstür. Misafirin alaşımı 29 → `rules:resources` (meşru ret); misafirin filosu yok. Açık fikstür eklendi (kaynak / tek korvet), sonra PASS.

## Regresyon (aday)

| Test | Sonuç |
|---|---|
| `MP8_SCEN=E` (p24 federasyon / Konsey kartları) | 6 / 0 (iki koşu) |
| `MP8_SCEN=P` (500 sistem, 16 AI + 2 insan, 45 ay + 3 dk gerçek zaman, P2–P7 P0 hedefli) | 8 / 0 |
| `MP8_SCEN=R` (kayıt / relay / devam) | 5 / 0 |
| `MP8_SCEN=N` (ağ kopmaları) | 9 / 0 |
| browser-mp61 / mp73 / mp74 / mp75 | 13/0 · 8/0 (iki koşu) · 7/0 (iki koşu) · 6/0 |
| Tam Node (`run-all.js`, 4 işçi) | 189 paket **6190 / 278** — p24 ile paket paket **aynı** (fark yok). Son ui.js değişikliğinden sonra yeniden koşuldu. Koruma ve PERF1 / PERF2 eşdeğerlik paketleri dahil. |

**500 sistem kısa performans** (P1, tohum 11, host + misafir oynuyor):
- 278 dokunma; gün 1354 → 2686; en büyük fark 22,5 gün; kalıcı donma 0.
- Misafir 257 kurulum, son 9,4 ms; kurulum reddi 0, istisna 0.
- Host son ay adımı 0,51 sn.

## Yayın bütünlüğü

- `releases/stars-faz96h10p25.zip` — **SHA-256 `86720c077e46b0dfd7460286c36eb914ac7e582846b231beec7e49cd462d82fa`**, **CRC32 `ED461992`**, 20 girdi.
- Deterministik: yeniden üretim aynı SHA.
- Çıkarılan ZIP `verify-release.py --root` → DOĞRULANDI: 19 dosya, `96h10p25`.
- Koruma zinciri (ux1 → ux0 → ui23) `ui.js`, `main.js`, `sw.js`, `index.html`, `archive-ui.js`'yi p22 baytlarına birebir geri kurar.
