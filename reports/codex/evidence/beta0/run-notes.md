# BETA.0 komutlar ve ek koşular

Node24.22.1; Chromium155.0.8059.79 `/usr/bin/chromium`; Playwright1.62.1. `tests/node_modules` mevcut; bağımlılıklar değiştirilmedi. Xvfb/xdotool/DISPLAY yok. Render, izin veya environment işlemi yapılmadı.

`commands.json` ilk ardışık regresyon listesini, `exits.json` gerçek çıkış kodlarını içerir. Sonraki iki koşu:

- `STARS_OUTPUT=reports/codex/evidence/beta0/storage-context-fixed node tests/browser-beta0-storage.cjs > reports/codex/evidence/beta0/storage-context-fixed.log 2>&1`: explicit browser context sonrası **exit0,7/0 PASS**. İlk geniş koşu6/1 context kurulumu FAIL korunur.
- `node tests/mp4_core_test.js > reports/codex/evidence/beta0/mp4-resume-audit.log 2>&1`: aynı odada çift resume red ve ayrı odada fork denetimi eklendikten sonra **exit0,14/0 PASS**; önceki13/0 logu korunur.

UI deneyi ayrı ve Chromium koşularıyla çakıştırılmadan çalıştı:

    MP89_RETAKE=1 MP89_TRACE=1 BETA0_DIAG=1 BETA0_WIDTHS=1280,1920,2560,3440,800,960 BETA0_CPU_VIEWS=3440,960 DEBUG=pw:protocol BETA0_PROTOCOL=/workspace/Star/reports/codex/evidence/beta0/ui-protocol.jsonl STARS_OUTPUT=reports/codex/evidence/beta0/ui-probe node --require ./tests/helpers/beta0-protocol.cjs tests/browser-mp89-ui.cjs

**exit0,12/0 PASS**. Native Ctrl keys zoom üretmedi, `browserZoom.status=NOT RUN`. Protokol filtresi yalnız yöntem/ID/zaman ve Input koordinatlarını kaydeder; paket/jeton veya Runtime parametre gövdeleri kaydedilmez. Runtime context kapanışı yanıtları protocol-summary.json içinde korunur; eski timeout kökü olarak yorumlanmaz.

R komutu commands.json içinde: `MP8_SCEN=R MP8_MONTHS=6 MP89_R_STATE=1 MP89_UI=1 MP89_MENU_DIAG=1`; STARS_OUTPUT bu dizindeki R. R/R/resume-records.json dolu siyaset kayıtlarını karşılaştırır.
