# BETA-FED-FOUND.0 kanıtları

Ana rapor: [BETA-FED-FOUND0-SONUC.md](../../BETA-FED-FOUND0-SONUC.md).

Bu dizin yalnız kontrollü otomatik test dünyaları, test odaları, günlükler ve ekran görüntüleri içerir. Kullanıcı Save8'i yoktur. İlk FAIL logları korunmuştur. `*-final` adı tek başına başarılı sonuç anlamına gelmez; dosyanın sonucunu ve ana rapordaki sınıflandırmayı okuyun.

Esas son aday: core-economy-preserved.log (10/0), events-economy-preserved.log (11/0), compat-economy-preserved.log (6/0), ui-economy-preserved.log (23/0); mp-packaged.log (11/0); mp73-accepted.log (10/0), mp74-visible.log (7/0), mp75-real-target.log (6/0), mp8-N-final.log (9/0), mp8-R-final.log ve mp8-R-accepted.log (her biri 5/0). Diğer regresyon komutları ve sonuçları ana rapordadır.

`node-batch.json`, `browser-batch.json`, `browser-followup.json`, `acceptance.json` gerçek alt koşuların komut/ortam/çıkış kodlarını taşır; ilk başarısızlıkları da içerir. Daha sonra hedefli düzeltilmiş koşular ayrı dosyalardadır. `runtime-sha256.json`, `RELEASE-VERIFIED.json` son kaynak/paket hash'leridir. `source-remote-heads-code.txt` doğrulanmış kod HEAD'ini taşır. Rapor kendi nihai commit SHA'sını önceden içermez; GitHub dalı ve son mesaj esas alınır.

Fiziksel Android/kullanıcı PC kabulü, LAN/internet/Render, Docker deploy NOT RUN. #27 misafir typed-event karar akışı eksik; yerel güvenli engel tam destek değildir. GitHub API PR/issue yazımları Forbidden; git push ayrı doğrulanmıştır.
