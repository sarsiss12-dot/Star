# BETA-SCALE.0 kanıt dizini

Kaynak: `66ea8d700bc66b1fdb5f75d3a0f5d8f87251e9a8`, taban `codex/stars-beta-setup1-galaxy-options`. Son kabul edilen yeni-oyun sınırı **500 sistem / 16 AI**;48AI/1000 hedefi tamamlanmadı. Başlangıç kolonileri kullanıcı kararıyla korunur: [USER-SCOPE](USER-SCOPE.md).

## Son aday

- `native/index.json`: ilk sıralı native kampanya; PERF.2 ilk4/1 FAIL saklanır. Son PERF.2 sonucu `perf2-isolated.log`5/0; neden [PERF2-FIXTURE](PERF2-FIXTURE.md).
- `native/beta-scale0-generation/results.json`:105 seed/şekil/kombinasyon +12 gerçek ara basamak +25 eski30–100 ham Save8/RNG karşılaştırması =142 PASS.
- `colony-final/`, `colony-final.log`:12/0; başlangıç korunması, insan/AI yeni kolonisi, çoklu fetih, gerçek ayrılık, yeniden fetih, aktifON/OFF Save8, kaynak/tek ücret/AI beklemesi.
- `compat-final/`: gerçek p11 Save8 ve package4 yükleme, RNG, bozuk bütünlük reddi.
- `final-campaign/`: **son oyun motoru**500/16,seed11,0/30/120 ay; tüm günlük/aylık yollar, kayıt/yükleme. `late-repeat/`: son kodla aynı120.ay kaydından iki bağımsız120→121 ham Save8/RNG eşitliği.
- `compare-supply-only/`: aynı gerçek m30 Save8'lerinden200/16,300/24,500/32,10'ar ay, aynı yeni özellik kurallarıyla kontrol–aday ham Save8/RNG eşit. `compare-reverse/`:500/32 üç ay ters sıra ve gerçek isSupplyNode çağrı sayıları. `compare-AA/`: aynı kontrol kodunda süre oynaklığı; genellenebilir hızlanma yüzdesi çıkarılmaz.
- `benchmark-final/`:1920×1080,Chromium155,CPU1,seed404; ilk5 ayın **yalnız monthTick** süresi, gerçek çizim/rAF örnekleri, heap/RSS. `benchmark-late/`:seed11,120.ay kayıtları, temiz tarayıcılar. Bunlar fiziksel FPS/Android ölçümü değildir; tam60 yarım-günlük ay adımı `final-campaign` ile ayrı tutulur.
- `mp8-large/R/mp8-R.json`:500 sistem+16AI+3insan,gerçek yerelTLS/WS/ayrı tarayıcılar,6ay+kapat/yeni relay+oda/devam+6ay,R0–R4=5/0. `scale0-colony.json`: gerçek WS kolonizasyon, misafir dokunmasıyla OFF, not-owner reddi. R3 içindeki `metrics.scale0.resume` OFF/deadline eşitliği.
- `mp8-net/N/mp8-N.json`:9/0; `mp74/`:7/0; `mp75/`:6/0; `mp73/`:yalnızA1=1/0. Diğer MP73 senaryoları bu fazda NOT RUN.
- `ui-screens/`:1920×1080 masaüstü;800×360 ve960×540 gerçek dokunma emülasyonu. Sayaç, tersinir basamaklar, yoğunluk reddi, kolonide OFF/Save8; mevcut UI Scale80/100/125 (mobil100) ham Save8/RNG/kamera koruması. `ui-final/` önceki başarılı UI koşusu da korunur.
- `relay-final/`: gerçek282.184bayt araştırma aynası, istemci8.192karakter sınırı, host üst sınırı ve gerçek8MiB/s byte bütçesi reddi. Eski MP.1 ilk13/1 manifest uyuşmazlığı korunur; `mp1-relay-final.log`14/0. `mp5-security.log`13/0.
- `RELEASE-VERIFIED.json`, `ZIP-SMOKE.json`, `extracted-verify.log`: iki ZIP bayt eşitliği, SHA256/CRC32/üyeler/değişen tüm runtime hashleri, çıkarılmış oyun çalıştırması.

## Önceki/başarısız araştırmalar silinmedi

- `probe-fixture-fail*`, `probe-fixed/`, `profile-before/`, `late-*`: ilk kaynak/CPU araştırması;64AI normal+wild toplamı66 olduğundan mevcut0–63 kimlik uzayına sığmaz.
- `bounds-before/`, `colony-before/`: hata/eksik özellik önceki kaynakta; son aday sonuçlarıyla karıştırılmaz.
- `campaign/` kesildi; `campaign-isolated/` ve ilk `browser-isolated/` kullanıcı başlangıç tercihi öncesi ara adaydır. Son sürümün kabul kanıtı değildir.
- `chromium-campaign/` ölçüm fikstürü hız geri dönüşü nedeniyle kesildi. [COMMAND-ERRORS](COMMAND-ERRORS.md).
- `chromium-controlled/`:ara aday200/16→120;300/24→181'de15s bütçe FAIL;500/32→77'de ekonomik durdurma,120NOT RUN. `chromium-safe-candidate/`:ara aday500/16→120;1000/48→10'da15s bütçe FAIL. Son500/16 ayrıca `final-campaign` ile tekrarlandı.
- `threat-candidate/`, `supply-candidate/`, `compare-fields/`: erken görünürlük atlaması kısa native testlerde geçse de gerçek Chromium'da kaydedilen güç/baskı önbelleklerini değiştirdi. [REJECTED-THREAT](REJECTED-THREAT.md): **ürün kodundan geri alındı**, alan silme/normalizasyon yok. Son kodda yalnız ikmal bağlamı önbelleği var.

Tüm fiziksel Android/PC kabulü, gerçekLAN/internet/Render ve deploy: **NOT RUN**. Yerel testler canlı servis sonucu değildir. Üretim ZIP'i yalnız19 oyun dosyası+manifest içerir; MP sunucusu/deploy dosyaları depodadır, ZIP bir Render dağıtımı değildir.

## Yeniden çalıştırma

Kontrol kökü gerekiyorsa sabit `66ea8d7` arşivini `/tmp/stars-beta-scale0` içine açın; bu ağdan güncel main indirmek değildir. `tests/node_modules` mevcut olmalı. Testleri sırayla yürütün; Chromium yolu `STARS_CHROMIUM_PATH=/usr/bin/chromium`. Araştırma testleri belirtilen yerde `SCALE_ACCEPTANCE.maxAI=48`/`SIZES.s1000.available=true` fikstürü kullanır; bu, yayımlanan seçeneklerin açıldığı anlamına gelmez. Uzun kampanya hedefi/bütçesi JSON'da belirtilir. Render komutu çalıştırmayın.

## Son kozmetik düzeltme

`custom-colors-before.json`:16AI+elle seçilen palet rengi17devlette16benzersiz renk FAIL. Yeni>11 AI yolunda tüm insan renkleri havuzdan ayrıldı; `colors-verified/`8/0. Değişiklik yalnız renk/amblem alanlarında, RNG/harita/ekonomi/isimlerde fark yok. Renk seçilmemiş500/16 başlangıcının **tam Save8 baytları** önceki adayla aynı; önceki120aylık son-motor kampanyasının varsayılan girdisi değişmez. Eski<=11 özel renkli başlangıçlar da ham baytla aynı kalır; eski kayıtlar yeniden renklendirilmez. `mp-capacity-final/`, `perf2-color-final.log` ve `ui-integrity-verified.log` son kaynağı doğrular. `package-before-color-fix.zip`/`RELEASE-INITIAL.json` yalnız önceki yayımlanmamış adaydır; teslim ZIP'inin kimliği **RELEASE-VERIFIED.json** içindedir.
