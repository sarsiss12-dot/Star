# BETA-UX.0 kanıt dizini

Esas sonuçlar: `names-final.log` (9/0), `browser-first/results.json` (14/0), `panels-final/results.json` (8/0), `mp73/mp73-results.json` (5/0), `native/results.json` (16 komut /106 kabul), `audit/audit.json` (100 galaksi + sabit kontrol + eski kayıt), `compat-p9-final-verified.log` (2/0), `RELEASE-VERIFIED.json`.

Başarısız denemeler korunmuştur. `before-ui` değiştirilmemiş p9 ürünündeki manuel isim kaybını kanıtlar. `panels*fail*`, `panels-verified`, `panels-final-verified`, `panels-complete`, `panels` ve `compat-p9*fail*` ilk ek test fikstürü kusurlarının kayıtlarıdır; ayrıntı ana rapordadır. `panels-final/prior-selector-failure.png`, bu çıktı dizini yeniden kullanılmadan önceki belirsiz seçici hatasından kalan görüntüdür; nihai PASS koşusuna ait değildir. Hiçbir FAIL sonucu sonraki PASS ile silinmemiştir.

`ui-preservation-sandbox-fail.log` git alt sürecinin EPERM hatasıdır; aynı değişmemiş testin normal ortam erişimiyle PASS sonucu `native/mp89_ui_integrity_test.js.log` içindedir. `pr-create.log`, `issue33-start.log`, `issue33-final.log` gerçek Forbidden mesajlarıdır. Önerilen pano yorumları yayımlanmış kabul edilmemelidir.

Tekrarlama: `git archive fec9a8b4345b14cca9fa5c2eb496fc84e24f7ad2` ayrı kontrol dizinine çıkarılır. `STARS_CONTROL_ROOT=<kontrol> node tests/beta-ux0-audit.cjs` ve `... node tests/beta-ux0-compat.cjs`; Chromium için `node tests/browser-beta-ux0.cjs` ve `node tests/browser-beta-ux0-panels.cjs`; MP73 seçimi: `MP73_ONLY='^A1|^A3|^P0' UX0_NAMES=1 SETUP0_AUDIT=1 BETA_P01_PANELS=1 BETA_P01_VOTES=1 BETA_P01_WAR=1 STARS_CHROMIUM_PATH=/usr/bin/chromium node tests/browser-mp73.cjs`. Çıktıların üstüne yazmamak için her çalıştırmada ayrı `STARS_OUTPUT` kullanılır. Chromium koşuları sıralıdır. Canlı Render kullanılmaz.
