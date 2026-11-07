# BETA-P0.2 tekrar üretim

Node24.22.1, Playwright1.62.1, Chromium155.0.8059.79, `/usr/bin/chromium`. Tüm adresler yerel relay/TLS proxy; canlı Render yok. Chromium işleri sıralıdır.

## Dokunma

```sh
STARS_CHROMIUM_PATH=/usr/bin/chromium MP73_ONLY='^A1|^B1' STARS_OUTPUT=/tmp/p02-baseline STARS_TRACE=/tmp/p02-events.jsonl node --require ./tests/helpers/beta-p02-touch-trace.cjs tests/browser-mp73.cjs
# Normal/CPU4: MP73_ONLY='^A1|^T02|^B1' BETA02_TOUCH_REPEAT=8 (CPU4=4)
# CPU4 ek ortamı: BETA02_CPU_RATE=4
# Protokol: DEBUG=pw:protocol BETA02_PROTOCOL=/tmp/p02-protocol.jsonl
#           --require ./tests/helpers/beta-p02-protocol.cjs
node tests/browser-beta-p02-touch.cjs
```

## Kabul / regresyon

```sh
BETA02_BALLOT_PROOF=1 STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/p02-mp73 node tests/browser-mp73.cjs
# P01 özel fikstürleri AYRI yeni süreç/oda:
MP73_ONLY='^A1|^P0' BETA_P01_PANELS=1 BETA_P01_VOTES=1 BETA_P01_WAR=1 STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/p02-p01 node tests/browser-mp73.cjs
BETA_P01_NEWS=1 BETA02_NEWS=1 STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/p02-news node tests/browser-beta-p01-panels.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/p02-panels node tests/browser-beta-p01-panels.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/p02-mp75 node tests/browser-mp75.cjs
MP8_SCEN=N STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/p02-N node tests/browser-mp8.cjs
MP8_SCEN=R MP8_MONTHS=6 MP89_R_STATE=1 MP89_UI=1 STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/p02-R node tests/browser-mp8.cjs
```

Native komutlar `native-final-results.json` satırlarındaki `tests/<ad>.js`; son dosyalar ayrıca açıkça adlandırıldı. Her exit/FAIL ilk günlükte kalır; `native-results.json` ilk kampanyadır. `native-final-results.json` yalnız işaret edilen son günlüklerin özetidir.

`council-result-fixture-error.log`: test ilk taslakta MP.local dönüşünü yanlış `status` alanıyla okudu; düzeltildi. `council-result-before-explicit.log`: gerçek eksik kamu sonuç kaydı nedeniyle13/1. `news-before.log`: aynı yeni test P01 kontrol kökünde; yeni DTO yok ve barış özel panele gitmiyor. `news-after.log`: ilk testin `res` alt-dize kontrolü `progress` adına takıldı; `"res":` anahtarı olarak daraltıldı, veri koruma assertion'ı kaldırılmadı. İlk mirror whitelist FAIL alfabetik beklenen liste sırası; ilk kaynak koruma testi git child spawn EPERM. İkisi gerçek mesajıyla durur, son testler düzeltilmiş liste/izinli salt okunur git show ile geçti.

`package-first.json`, `package-repeat.json`, `package-verification.json`: ilk geçici adayın paket metadatası. Kalıcı ZIP ve son kod için **RELEASE-VERIFIED.json** esas; haberden dönüş düğmeleri son adaya dahil. İlk aday metadata dosyaları son ZIP'i temsil etmez. MP kodu oyun ZIP'ine dahil değildir; `MP-RELEASE-HASHES.json` ve Docker COPY/relay allowlist ile ayrı doğrulanır. Deploy yapılmadı.

Son adayda ek bulunan haber geri dönüş kusuru: `news-return-before.log` 0/3 → `news-return-after.log` 3/0. İlk gerçek MP koşusu `mp73-clean-final.log` 7/1 (misafirde geri düğmesi yok); oda/oyuncu/haber anahtarı kapsamıyla düzeltilmiş `mp73-acceptance.log` 8/0, üç cihazda gerçek Haber→Konsey→aynı haber dokunması dahil. SP yeni dünyada dizi kimliği; misafir aynı Join nesnesi+oda kodu+playerId+olay id/key eşleşmesi kullanılır. Save8 veya ayna paketine bu UI dönüş referansı yazılmaz.

Paket adlandırması: `package-final-*` de ara aday metadatasıdır. **Yalnız RELEASE-VERIFIED.json ve MP-RELEASE-HASHES.json teslim edilen son dosyaları tanımlar.**

Son sonlandırılmış kayıtlar: `browser-acceptance-summary.json`; #1/#4/#21 son kaynakta ayrı `p01-acceptance.log` 4/0; haber dokunmaları `news-acceptance.log` 1/0 (10 olay). N/R ağır kampanyaları yeni haber geri dönüş referansı son düzeltmesinden önce tamamlandı; son fark yalnız yerel UI kapsamıdır, bu yol son MP73 ve native geri dönüş testinde ayrıca sınandı. Motor/komut/ayna DTO değişikliği daha sonra yapılmadı.
