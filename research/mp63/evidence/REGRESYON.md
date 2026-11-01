# MP.6.3 — regresyon sonuçları

Ortam: bulut konteyneri, Node v22, Playwright + Chromium (`/opt/pw-browsers/chromium`), yerel relay; Docker daemon konteyner içinde.
Fiziksel Android, gerçek internet ve LAN: **NOT RUN**.

## Node

`STARS_TEST_WORKERS=4 node tests/run-all.js` → **SUITES: 157 GEÇEN: 6271 KALAN: 3**

- Tek FAIL paketi `faz95d_identity_test.js` 20/3: bilinen ortam FAIL'i (seed 11/99/404 coğrafya, Node v22 kayan nokta son basamak; MP.6.2 tabanında da aynı). Değişiklikten bağımsız.
- Yeni paketler: `mp63_pause_test` 7/7, `mp63_settle_test` 9/9 (tam koşudan sonra gerçek devir vakası eklendi; ayrıca koşuldu), `mp63_polvas_test` 11/11, `mp63_sq_test` 4/4.

## Chromium (sırayla, tek tek)

| Test | Sonuç |
|---|---|
| browser-mp0 | 20/20 PASS |
| browser-mp1 | ilk koşu 20/2 → düzeltme (test yardımcısı `G.speed=0` yerine `UI.setSpeed(0)`) → **22/22 PASS** |
| browser-mp11 | 10/10 PASS |
| browser-mp2 | 14/14 PASS |
| browser-mp3 | 12/12 PASS |
| browser-mp31 | 11/11 PASS |
| browser-mp4 (+ statüko kalıcılığı: gerçek host süreci kapanış → dosyadan açılış) | 13/13 PASS |
| browser-mp5 (Docker relay + TLS vekili) | 10/10 PASS |
| mp5_docker | 6/6 PASS |
| browser-mp6 | 11/11 PASS |
| browser-mp61 | 13/13 PASS (tek başına ya da sırayla; başka 3 tarayıcılı testle eşzamanlı koşuda 2 zamanlama FAIL'i görüldü, tekrarlanmadı) |
| browser-mp62 | 10/10 PASS |
| browser-mp63 (A1–A8, B1–B4 gerçek devirle, C1–C3, D1) | **15/15 PASS** (son koşu; kanıt `mp63-results.json`) |
| browser-96h10 | 27/27 PASS |

## Yayın

- Runtime 19 dosyası değişmedi; `python3 tools/package-release.py` → `releases/stars-faz96h10.zip` SHA-256 `78e76d1627b8ec1b990849b2242835f78667f110e1d6f17021760183ee7be6d0` (bayt-bayt aynı).
- ZIP çıkarılıp `verify-release.py --root` → DOĞRULANDI: 19 dosya; oyun build 96h10.
- Yeni ZIP yok.
