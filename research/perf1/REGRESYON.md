# PERF.1 — regresyon sonuçları (son aday)

**Ortam:**
- Bulut konteyneri, Node v22, 4 çekirdek.
- Playwright + Chromium (`/opt/pw-browsers/chromium`).
- Yerel relay; Docker daemon konteyner içinde.

Fiziksel Android, gerçek internet ve LAN: **NOT RUN**.

Aday: `claude/stars-perf1-ai-mp-optimization`, build `96h10p1`.

## Node

`STARS_TEST_WORKERS=4 node tests/run-all.js` → **SUITES: 162 GEÇEN: 6297 KALAN: 3**

- Tek FAIL paketi `faz95d_identity_test.js` 20/3 (seed 11/99/404 coğrafya). Bilinen ortam FAIL'i (Node v22 kayan nokta).
  - Kontrol kökünde (MP.6.4 `eb4bd68`, sabit kopya) de aynı üç vaka FAIL: 20/3.
  - PERF.1'den bağımsız.
- Yeni paket `perf1_equivalence_test` 4/4.
- Koruma testleri hash'i gevşetmeden `stripReviewedP1` uygular: `faz96h9` 11/11, `faz96h10` 11/11, `faz96h31` 15/15, `faz96c2` 24/24.
- İlk aday koşusunda (adaptörsüz, manifest eski) 11 FAIL vardı:
  - 3 bilinen;
  - 4 koruma (economy.js / economic-ledger.js baytları);
  - `mp1_relay` 1 (runtime baytları ↔ manifest);
  - `mp11_online` 3 (smoke /healthz, manifest).
- Adaptör ve yeni manifestle hepsi geçti.

## Chromium (sırayla, tek tek)

| Test | Sonuç |
|---|---|
| browser-96h10 | 27/27 PASS |
| browser-mp0 | 20/20 PASS |
| browser-mp1 | 22/22 PASS |
| browser-mp11 | 10/10 PASS (sürüm artık manifestten) |
| browser-mp2 | 14/14 PASS |
| browser-mp3 | 12/12 PASS |
| browser-mp31 | 11/11 PASS |
| browser-mp4 | 13/13 PASS |
| browser-mp5 | 10/10 PASS (Docker relay kipi; ilk koşu Docker daemon kapalıyken node-process kipinde 10/10) |
| mp5_docker | 6/6 PASS (ilk koşu daemon kapalı → NOT RUN; daemon başlatılıp yeniden koşuldu) |
| browser-mp6 | 11/11 PASS |
| browser-mp61 | 13/13 PASS |
| browser-mp62 | 10/10 PASS |
| browser-mp63 | 15/15 PASS (akıllı duraklatma A1–A8 dahil) |
| browser-mp64 | 10/10 PASS |

## Davranış eşdeğerliği (performans değişikliğine özgü)

- **Yeni oyundan 240 ay** (seed 11, 22, 42, 404; ULU, 11 AI): aday kökün ürettiği 60/120/180/240. ay Save8 dosyaları kontrolle **bayt-bayt aynı** (16/16).
- **Ay ay iz:** 60. ve 180. ay kayıtlarından 4–6 ay, her ay Save8 SHA-256 + RNG eşit (A, A+B, A+B+C ayrı ayrı).
- **İzole zamanlama kampanyası:** 30 koşu; her kol son Save8 özeti kontrolle aynı.
- **MP host** (3 misafir, 4 ay): giden bayt / ileti sayısı ve son host Save8 / RNG aynı.

## Yayın

- `releases/stars-faz96h10p1.zip`: 768 865 bayt, 20 girdi.
  - SHA-256 `253a0282a18509ec3394dc87f2ddbef98150ceb90b1f137841139a36ecf70448`
  - CRC32 `60e78b12`
- Girdi CRC'leri PASS.
- Yeniden paketleme ve temiz `git archive`'dan paketleme bayt-bayt aynı.
- Çıkarılmış ZIP `verify-release --root` → DOĞRULANDI (19 dosya, build 96h10p1).
- `releases/stars-faz96h10.zip` değişmedi (`78e76d16…be6d0`).
