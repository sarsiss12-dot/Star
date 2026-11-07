# BETA-SETUP.1 — kanıt rehberi

Esas sonuçlar:

- `options/audit.json`:13 seçenek grubu+seed,210 tek-değişkenli başlangıç/Save8;205 p10 ham byte eşitliği,5 eski çelişkili OFF kriz yapılandırması düzeltmesi.19seed×11AI köken dağılımı, gerçek rastgele olay/çalkantı, kalıntı ödülü, kriz gücü ve kuruluş sonuçları.
- `gates-final/results.json`:12/0; iki kapıyla ikmal0/1 ve 0,1 rota maliyeti dahil. `after/results.json` ilk düzeltme sonrasını içerir.
- `browser-after/results.json`:iki yatay mobil görünümde8/0 gerçek UI; `events.json` güvenilir pointer/touch/click. `browser-on/results.json`:2/0 gerçek AÇIK inşa/maliyet.
- `continuity/campaign.json`:ON p10/p11 ve OFF p11/p11,0–120ay121'er Save8 SHA/RNG noktası;30.ay yükleme. `continuity/mirrors.json`:42 kamu ayar varyantı. Gerçek seed/RNG gönderilmez.
- `mirror-final/results.json`:insan1/2 yapı/work kimlikleri ve ısınmış host byte/RNG saflığı2/0.
- `mp73-final/mp73-results.json`:A1+P01/P03/P04/A3,5/0,JS hatası yok. `metrics.setup1` kaynak/bedel/ACK/ayar eşitliğini içerir. `mp-gate-remote-confirm/mp73-results.json`:ek A1 1/0,OFF misafir uzaktan sipariş reddi dahil. ON misafir uzaktan kuyruğun host aktarımı bu kabulden farklıdır, NOT RUN.
- `native/results.json`:21 komut204/0; ham günlükler aynı dizinde.
- `density/results.json`:10 başlangıç süresi,başkentler ve3 gerçek konsey gündem periyodu. Bunlar mobil FPS değildir.
- `compat`:gerçek p10 paket4 eski/yeni yükleme çıktıları aynı. `RELEASE-VERIFIED.json` paket/SHA/CRC/manifest, `runtime-hashes.json`8 dosya eski/yeni SHA.

Başarısızlıklar saklandı:

- `before`5/7:eski p10 kapı/kriz hataları; `browser-before`1/1 ve `browser-gate-before`0/1 aynı eski UI kusurlarıdır.
- `mirror-before`ve`mirror-before-confirm`0/2:gerçek sahiplik dönüşümü eksikliği. `mp73`4/1 ilk kabuldeki aynı ürün kusurudur; yanlış sahibi bekleyiş timeout'u.
- `mirror-after-fixture-fail`:ilk soğuk AI görünümünün host cache farkını byte eşdeğerliği sanan ek test fikstürü. `mirror-fixture-diff.json` p10 ve p11'de aynı dört türetilmiş alan farkını kanıtlar. İnsan/ortak ısınma sonrası byte assertion'ı aynen korunur. Alan silme veya normalizasyon yoktur.
- `pr-create.log`, `issue33-start.log`, `issue33-final.log`:gerçek Forbidden; önerilen yorumlar yayımlanmış kabul edilmez. Son kamu panosu `issue33-final-source.json`.

Tekrar çalıştırma:

Kanonik `eea55b2ddfae7de8f631eb43eb606585224f64d6` commit'ini `git archive` ile ayrı, değişmeyen bir kontrol köküne çıkarın; aday dosyalarına symlink vermeyin. `STARS_CONTROL_ROOT=<kontrol>` ile `tests/beta-setup1-options-audit.cjs`, `tests/beta-setup1-continuity.cjs` ve `tests/beta-setup1-compat.cjs` çalışır. Eski gate/ayna testleri için de aynı kontrol değişkeni kullanılabilir. Native testler `node tests/beta_setup1_gates_test.cjs` / `...mirror_test.cjs`. Chromium: `node tests/browser-beta-setup1.cjs` ve `...-on.cjs` sıralı. Her seferinde ayrı `STARS_OUTPUT` kullanarak ilk FAIL kanıtlarını koruyun.

MP73 seçim ortamı: `MP73_ONLY='^A1|^A3|^P0' SETUP1_AUDIT=1 SETUP0_AUDIT=1 UX0_NAMES=1 BETA_P01_PANELS=1 BETA_P01_VOTES=1 BETA_P01_WAR=1 STARS_CHROMIUM_PATH=/usr/bin/chromium node tests/browser-mp73.cjs`. Yalnız A1 ek kabulü için `MP73_ONLY='^A1'`. Canlı Render veya fiziksel Android sonucu değildir.
