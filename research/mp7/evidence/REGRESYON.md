# MP.7 — regresyon sonuçları (son aday)

**Ortam:**
- Bulut konteyneri, Node v22.
- Playwright + Chromium (`/opt/pw-browsers/chromium`).
- Yerel relay; Docker daemon konteyner içinde.

**NOT RUN:**
- fiziksel Android;
- gerçek internet;
- LAN;
- kullanıcının canlı Render servisi (ağ politikası `stars-zhdu.onrender.com`'u engelledi).

Aday: `claude/stars-mp7-mobile-setup-start`, build `96h10p2`.

## Node

`STARS_TEST_WORKERS=4 node tests/run-all.js` → **SUITES: 164 GEÇEN: 6310 KALAN: 3**

- Tek FAIL `faz95d_identity_test.js` 20/3: bilinen ortam FAIL'i (seed 11/99/404 coğrafya, Node v22). PERF.1 / MP.6.4 tabanında da aynı.
- Yeni paketler:
  - `mp7_ws_frames_test` 6/6;
  - `mp7_lobby_test` 7/7.
- PERF.1 koruması: `perf1_equivalence_test` 4/4.
- Tek oyunculu `setupGame`: 5 yapılandırmada (boyut / tohum / köken / civic / fizyoloji / renk) PERF.1 ile bayt-bayt aynı; kurulum sonrası ve 3 ay sonra Save8 + RNG.
- Güncellenen beklentiler: `mp1_relay_test` ve `mp6_mirror_test`'te sayfa enjeksiyonu MP.7 betik / stil ile (tam eşleşme korunur) ve sunulan dosyalar.

## Chromium (sırayla, tek tek)

| Test | Sonuç |
|---|---|
| **browser-mp7** (yeni) | **9/9 PASS** |
| browser-96h10 | 27/27 PASS |
| browser-mp0 | 20/20 PASS |
| browser-mp1 | 22/22 PASS |
| browser-mp11 | 10/10 PASS |
| browser-mp2 | 14/14 PASS |
| browser-mp3 | 12/12 PASS |
| browser-mp31 | 11/11 PASS |
| browser-mp4 | ilk koşu 12/1 → düzeltme → **13/13 PASS** |
| browser-mp5 (Docker relay kipi) | 10/10 PASS |
| mp5_docker | ilk koşu 5/1 → test güncellendi → **6/6 PASS** |
| browser-mp6 | 11/11 PASS |
| browser-mp61 | 13/13 PASS |
| browser-mp62 | 10/10 PASS |
| browser-mp63 | 15/15 PASS |
| browser-mp64 | 10/10 PASS |

**browser-mp7** — üretim kipi relay, büyük çerçeveleri parçalayan TLS vekili, dikey telefonlar:
- **A1–A5:** iki farklı devlet tasarımı gerçek kurulum ekranında, başlangıç (misafir 0,6–0,7 sn'de harita), misafirin gerçek komutu.
- **B1–B3:** üç oyuncu; taslağın cihazda korunması.
- **B2 — başlangıç bekçisinin kurtarması:**
  - aksilik: B'ye tam ayna 6 sn, farklar 12 sn kaybolur;
  - bekçi `ask-mirror` ile aynayı yeniden ister; B ~9 sn'de haritada.
- **B2 — kopma:** C'nin ağı 3 sn kopar; C 3,7 sn'de aynı devlete (id 2) döner.

**browser-mp4 düzeltmesi:**
- devam lobisinde `claim` yanıtı `phase` yerine `mode` dönüyordu (tasarım kipindeki host sayfası);
- aşama denetimi öne alındı (`mp-core`), eski yanıt aynen.

**mp5_docker güncellemesi:**
- imaj izin listesine `research/mp7/` eklendi;
- MP.7 dağıtım dosyalarının imajda bulunduğu ayrıca denetlenir;
- hepsi imajda.

**browser-mp1 / 11 / 2 / 3 / 31 / 4 / 5 / 6 / 61 / 62 / 63 / 64:**
- oda açmadan önce `window.MP7Legacy`; bu testler MP.1 devralma akışını sınar;
- tasarım kipi browser-mp7'de.

## Performans

- **Misafir başlangıcı** (Node, `orta`, 5 AI + 1 insan): tam ayna 19 KB, misafir `deserialize` medyanı 144 ms; host `start` 209 ms.
- **Misafir başlangıcı** (Node, `ulu`, 10 AI + 1 insan): tam ayna 31 KB, misafir `deserialize` medyanı 139 ms; host `start` 208 ms.
- Oyun başladıktan sonra MP.7 ek dünya yeniden kurulumu üretmez.
- PERF.1 motor kodu (`economy.js`, `economic-ledger.js`) değişmedi.

## Yayın

- `releases/stars-faz96h10p2.zip`: 769 312 bayt, 20 girdi.
  - SHA-256 `dc52bfe543b11bf7483969b6935172bcc65ece8c307fb28a0587ee1640e7bc62`
  - CRC32 `fac53d8b`
- Girdi CRC PASS; yeniden paketleme bayt-bayt aynı.
- Çıkarılmış ZIP `verify-release --root` DOĞRULANDI (19 dosya, build 96h10p2).
- `stars-faz96h10p1.zip` (PERF.1) değişmedi.
