# PERF.2 — regresyon ve kanıt kaydı

Ortam: bulut konteyner, Node v22, 4 çekirdek, Chromium `/opt/pw-browsers/chromium` (Playwright), Docker 29.9.2.

Koşulmayanlar (**NOT RUN**): fiziksel Android, gerçek internet, LAN ve canlı Render servisi.

**Runtime:** `ai.js`, `main.js` (PERF.2 B + BUILD_ID), `sw.js` (CACHE). Build `96h10p5`.

## Node

| Koşu | Sonuç |
|---|---|
| Tam `node tests/run-all.js` (4 işçi; son üretim koduyla) | 172 paket, **6364 GEÇEN / 3 KALAN** |
| — 3 KALAN | Bilinen `faz95d_identity` (11/99/404 coğrafya, Node v22 kayan nokta; değişiklikten bağımsız) |
| `perf2_equivalence_test` (yeni) | **5 / 0** |
| `perf1_equivalence_test` | 3 / 0 (paket içinde) |
| Koruma testleri: faz96h8 / 96h9 / 96h10 / 96h71 / 96h31 | geçti; `stripReviewedP2` zincirin en başında, hash'ler gevşetilmedi |

Tam koşudan sonra üretim kodu değişmedi. Sonradan değişenler yalnız testler (`browser-mp73` sürüm beklentisi, `browser-mp75-perf` `MP75_SEED` / `MP75_WINDOW`) ve belgeler.

Tam koşunun yeniden yazdığı dosyalar geri alındı:
- `tests/navy-95a-after-{11,99,404}.json`;
- `war-lines-on.png`;
- `identity-distribution.json`;
- `tests/audit96g2` depo dışına taşındı.

## Eşdeğerlik (aynı Save8, kontrol = `8fa8203` sabit kopya)

| Kanıt | Sonuç |
|---|---|
| 4 kayıt × 6 ay, ay ay Save8 SHA-256 + RNG (A, A+B) | birebir |
| 12 kayıt × 30 ay, 4 kol (kontrol / A / B / A+B), son Save8 + RNG | birebir |
| Yeni oyundan 240 ay, orta / büyük × seed 11 / 404: 16 kontrol noktası kaydı | **16 / 16 bayt-bayt aynı** |
| Büyük s11, 240 → 360. ay | Save8 + RNG birebir |
| MP host, 1 misafir, 30 ay (2 kayıt) | host Save8 + RNG birebir, giden bayt dizisi birebir |
| Karar işlevi çağrı sayıları (30 ay, 2 kayıt) | aynı: `aiTurn`, `aiBuildingDelta`, `aiEconomyPlan`, `queueBuilding`, `aiMove`, `executeDeal`, `colonizeTargets` |
| GC sonrası yığın (6 ay) | 21,2 MB / 21,2 MB |

## Chromium

| Test | Sonuç | Not |
|---|---|---|
| browser-mp75 | **6 / 0** | |
| browser-mp74 | 7 / 0 | |
| browser-mp73 | ilk koşu 7 / 1 → **8 / 0** | A1 sürüm satırı beklentisi sabit build listesiydi (`96h10p[234]`); artık manifestteki build. Davranış hatası değil. |
| browser-mp72 | 9 / 0 | |
| browser-mp71 | 12 / 0 | |
| browser-mp7 | 9 / 0 | |
| browser-mp64 | 10 / 0 | |
| browser-mp63 | 15 / 0 | |
| browser-mp62 | 10 / 0 | |
| browser-mp61 | 13 / 0 | |
| browser-mp6 | 11 / 0 | |
| browser-mp4 | 13 / 0 | kayıt / yükleme / yeniden bağlanma |
| browser-mp31 | 11 / 0 | |
| browser-mp3 | 12 / 0 | |
| browser-mp2 | 14 / 0 | |
| browser-mp11 | 10 / 0 | |
| browser-mp1 | 22 / 0 | |
| browser-mp0 | 20 / 0 | |
| browser-96h10 (tek oyunculu) | 27 / 0 | Çıkış 0. GEÇEN satırı basmaz; sayım PASS satırlarından. |
| mp5_docker | ilk koşu NOT RUN (daemon kapalı) → daemon başlatıldı → **6 / 0** | İmaj güncel ağaçtan derlendi. |
| browser-mp5 | 10 / 0 (iki koşu) | Docker relay + TLS vekili + TCP kesici |

**Docker imajı içeriği:**
- `/app` altındaki `ai.js` / `main.js` / `sw.js` SHA-256 önekleri çalışma ağacıyla aynı: `49bb05c0621b` / `312d9fdd9f9e` / `f0067c51e1b8`.
- Manifest build `96h10p5`.
- `/mp/version`: browser-mp73 A1'de `build` = sayfanın `BUILD_ID`'si.

## Chromium performans (host + 1 misafir)

`tests/browser-mp75-perf.cjs`:
- büyük galaksi, 2 insan + 8 AI, seed 404 ve 11;
- üretim relay + parçalayan TLS vekili;
- misafirde diplomasi paneli açık.

Kontrol: aynı dosya kontrol kökünde.

**Sınır.** Hızlı ilerletme deterministiktir. Ölçüm penceresi gerçek zamanlıdır: adım sayısı gerçek zamana bağlı olduğundan iki kolun oyun durumu birebir aynı olmayabilir. Aynı durum kanıtı Node ölçümleridir; tarayıcı sonuçları destekleyicidir. Masaüstü Chromium, telefon değildir.

Sonuçlar: §3 aylık pencere `research/perf2/results/chromium-w3.txt`, 30 aylık pencere `research/perf2/results/chromium-w30.txt`.
