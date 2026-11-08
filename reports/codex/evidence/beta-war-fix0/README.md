# BETA-WAR-FIX.0 kanıt dizini

Esas teslimat: [Türkçe sonuç raporu](../../BETA-WAR-FIX0-SONUC.md). Başlangıç `731c8df`; son kod `05ffb5f`. Nihai rapor commit'i uzak dal HEAD'inde ve son sohbet yanıtındadır.

- [Kök neden için savaş yolu matrisi](SAVAS-YOLLARI.md); p11-source-proof.json, combined-before/targeted.json ve after/targeted.json gerçek p11 önce/adayı gösterir. Kullanıcının özgün kaydı değildir.
- [İlk başarısızlıklar](FAIL-GUNLUGU.md) ve [seed99 ham ölü devlet bayrağı tanısı](SEED99-TANI.md). Eski FAIL'ler ve ekranlar korunur; bir sonraki PASS önceki FAIL'i silmez.
- final-regression.json son çekirdek/paket/PERF/tam MP73/N koşuları ve **başarısız** MP74/75/R sonuçlarıdır. “accepted” dosya adı PASS demek değildir.
- final-followup.json kanıtlanan DOM düzeltmesi ve gerçek misafir savaşı içeren R fikstüründen sonra sırayla yürütülen MP74 7/0, MP75 6/0, R 5/0 sonuçlarıdır.
- card-dom-before.log gerçek aynı UID'li kart DOM düğümünün değiştiğini FAIL gösterir. card-dom-after.log gerçek dokunma, iki ayrı barış, UID ve **aynı DOM nesnesi** korunumunu PASS gösterir.
- mp8-R-history-fixed/R/cold-war-history.json: tüm tarayıcı/relay süreçleri kapatılıp yeni oda kurulduktan sonra kendi cephesi host özel haberi ve misafir arşivinde mevcut; diğer tarafların özel olayları aktarılmıyor. Sıfır örnek assertion'ı korundu.
- history-before.log ve history-before/history.json boş tarihçe kusurunu saklar. history-packaged.log gerçek cold paket + kriz + 80 satır sınırı + ham Save8/RNG üç testini içerir.
- mp-acceptance-final.log aynı gün ikinci barış kimliği çakışmasını FAIL kaydeder. offer-final.log, mp71-final.log ve gerçek card-dom-after testinde kesin MP ID, eski not-ID geçişi, tek uygulama ve tekrar reddi PASS.
- campaign-final/results.json: 100/9 ve 200/16, beş seed, gerçek 120 ay. Her satır ölçülen runtime SHA'larını taşır; bunlar 002cad4 kodudur. Son MP teklif kimliği değişikliği SP varsayılanını değiştirmedi: save-final-accepted.log gerçek eski 500/16 kaydını m120→121 iki aday tekrarında ve 002cad4 kontrolünde ham Save8/RNG karşılaştırır. Uzun koşular yeniden başlatılmadı.
- [Deterministik ZIP doğrulaması](RELEASE-VERIFIED.json), [runtime önce/sonra SHA-256](runtime-sha256.json); manifest yalnız 19 oyun dosyasını kapsar. MP istemci/relay GitHub kaynakları ayrı sürüm sözleşmesindedir.
- source-remote-heads-final.txt kod push'u sonrası gerçek uzak dal ve tabanı gösterir. pr-create.log tek PR denemesi; issue-start.log ve issue-final.log scoped pano yazımlarının Forbidden hatalarıdır. [Manuel uygulanabilir dört görev yorumu](ISSUE33-SONUC-YORUMU.md).
- [Gerçek PC kullanıcı kabulü için üç kısa senaryo](KULLANICI-KABULU.md).

## Tekrar çalıştırma

Kurulu Chromium için `STARS_CHROMIUM_PATH=/usr/bin/chromium`; her tarayıcı koşusu ayrı `STARS_OUTPUT` diziniyle **sırayla** çalıştırılır. Render kullanılmaz.

- `node tests/beta_war_fix0_test.cjs`
- `node tests/beta-war-fix0-offer-identity.cjs`
- `node tests/beta-war-fix0-alert-lifecycle.cjs`
- `node tests/beta-war-fix0-history.cjs`
- `node tests/beta-war-fix0-save-regression.cjs` (kontrol kaynaklarını Git commit'lerinden kendi oluşturur; sandbox git alt sürecini reddederse doğrulanmış arşiv kökleri `STARS_CONTROL_ROOT` / `STARS_EQUIV_CONTROL_ROOT` ile verilebilir)
- `MP73_ONLY='A1|PWF' WARFIX0=1 node tests/browser-mp73.cjs` — yalnız hedefli kabul, tam MP73 yerine geçmez.
- `node tests/browser-mp74.cjs` ve ardından `node tests/browser-mp75.cjs`
- `MP8_SCEN=N node tests/browser-mp8.cjs`
- `MP8_SCEN=R MP8_MONTHS=6 MP89_R_STATE=1 WARFIX0_HISTORY=1 node tests/browser-mp8.cjs`

Bunlar yerel testlerdir. Fiziksel Android/PC, LAN/internet ve Render **NOT RUN**. Ürün kullanıcı tarafından onaylanmadı.
