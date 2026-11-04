# STARS MP.8.7 — Gerçek misafir güncellemesi ve çizim denetimi

## Sonuç

**Yeni ürün optimizasyonu uygulanmadı.** MP.8.6 piksel önbelleği korundu. Aynı 120. ay kaydından gerçek yerel relay/ayna yolunda, iki oturum/kol ve kol başına36 delta örneğinde deserialize ortancası **106,5→50,9 ms (%52,2)**; ayna alımı→yeni dünyanın çizimi ortancası **340,7→271,6 ms (gözlenen %20,3)** oldu. Bunlar bu ölçüm dağılımının farklarıdır; genel FPS veya kesin nedensel uçtan uca kazanım değildir.

**Toplam akıcılık kazanımı doğrulanmadı:** host adımı/yayını ve Node yoklaması dahil gecikme ortancası **1114,6→1124,4 ms**; iyileşme yok. Kontrol rAF/s3,96 ve6,88; MP.8.6 rAF/s5,57 ve6,32. Aralıklar örtüşüyor, koşu sırası etkisi büyük. Fiziksel FPS/Android sonucu değildir.

Önceki JS profilinin `(program)` maliyetine karşı timeline trace, duraklatılmış misafirde ana renderer thread'indeki **Commit / LayerTreeHost::DoUpdateLayers** işini ağır gösterdi. Güvenli ve küçük bir görsel eşdeğer optimizasyon kanıtlanmadığı için çizim sıklığı, çözünürlük, simülasyon veya ayna mimarisi değiştirilmedi.

## Kaynak / ortam

- Başlangıç dalı `codex/stars-mp86-performance`; GitHub fetch HEAD ve temiz yerel HEAD **`0dfb449e52bcdd6a9c1c73838f2f476ae37b2216`**, beklenen commit ile aynı.
- Yeni dal `codex/stars-mp87-frame-performance`; PR tabanı `codex/stars-mp86-performance`.
- `AGENTS.md`, `GPT-DEVIR.md`, `CLAUDE.md`, `CODEX-SON-RAPOR.md`, MP.8.6 sonuç/karşılaştırma kanıtları ve MP.8.5 raporu esas alındı. Önceki kampanyalar yeniden başlatılmadı.
- Node24.22.1, Playwright1.62.1, Chromium155.0.8059.79 `/usr/bin/chromium`, native Canvas0.1.100. Mevcut cgroup CPU kotası4 CPU; kaynak artırılmadı.
- Gerçek yerel üretim relay'i + mevcut parçalı TLS proxy + iki ayrı Chromium süreci; host844×390, misafir800×360, DPR2, dokunmatik, `--disable-gpu` yazılım çizimi. Her iki sayfada CDP4× CPU oturumları ölçüm boyunca açık tutuldu.
- **Render ve fiziksel Android NOT RUN.** Hiçbir canlı Render bağlantısı, izin isteği, ağ ayarı, deploy/restart veya yeni environment işlemi yapılmadı. `main`, merge/rebase/force-push kullanılmadı.

## Kontrol ve yöntem

MP.8.5 kontrolü: `c005f82c240ab26375f5307405d11a883207a453` commit'indeki gerçek `guest-stars.js`, yalnız yerel Playwright route'u ile sunuldu. MP.8.6 adayı başlangıç HEAD'indeki dosyadır. İki misafir dosyası arasındaki tek farkın **MP.8.6 NEBULA PIXELS bloğu** olduğu byte düzeyinde doğrulandı. Host/runtime/relay ve sürüm göstergesi iki kolda ortak MP.8.6 kaynağıdır; canlı eski/yeni dağıtım karşılaştırması değildir. [Kaynak sözleşmesi](evidence/mp87/source-contract.json).

Girdi mevcut `reports/codex/evidence/mp86/capture-host-m120.save`: seed404, 45 sistem, 2 insan+5 AI, gerçek başlangıç ay120 (day3614,733). Aynı byte dizisi her oturumda host'a yüklendi; kozmetik misafir seed'i MP.8.6 guest kaydından sabitlendi. Gerçek seed veya gizli alanlar misafire eklenmedi.

AB/BA sırası **A,B,B,A** (`a10,b9,b10,a11`), kol başına iki yeni oturum. Her oturumda18 yarım günlük **gerçek motor** adımı: dailyTick/structTick/colonyBuildTick/autoExploreTick, ardından gerçek publish→relay→mirrorDelta→deserialize→UI.refresh→View.draw. Yeni dünya çizilmeden sonraki adım gönderilmedi; en az900 ms aralık. Bu pencere ay sınırını geçmez; host AI/ay performansı deneyi veya doğal en yüksek hızda uzun kampanya değildir.

Diplomasi paneli açık ve seçili filo kimliği korunur; altı örnekte görünür “Tümü” filtresine taze hit-test edilmiş koordinatla CDP gerçek pointer/touch dokunması gönderilir. Beklentiler:18 çizilmiş güncelleme,6 pointer→çizim örneği, sıfır build/sayfa hatası, panel açıklığı ve seçili filo kimliği. Performans kurulumunda mevcut ürünün Enter ile katılım yolu kullanıldı; dokunmalı giriş kabulü MP.7.4'te ayrıca sınandı.

p95 sıralı dizide `floor(n×0,95)`;18 örnekte en büyük değer,36 örnekte ikinci en büyük değerdir. İki oturum/kol bağımsız cihaz deneyi sayılmaz. Warm-up ve trace karşılaştırma penceresinin dışındadır. [Ham dağılımlar ve yöntem](evidence/mp87/KARSILASTIRMA.md), [karşılaştırma JSON](evidence/mp87/comparison.json).

## 120. ay ölçümleri

| Ölçüm | Kontrol n; med/p95 ms | MP.8.6 n; med/p95 ms | Değerlendirme |
|---|---:|---:|---|
| Deserialize |36;106,5/316,7|36;50,9/140,1|Ortanca gözlenen %52,2 azalma; iki aday oturumunda da daha düşük|
| Ayna callback girişi→yeni dünya View.draw sonu |36;340,7/959,3|36;271,6/449,9|Gözlenen medyan %20,3; compositor sunum zamanı değildir|
| Host adımı/yayın→Node çizim yoklaması |36;1114,6/1759,8|36;1124,4/2248,6|Kazanç yok; host/relay/polling dahil|
| UI.refresh |44;22,0/72,1|46;19,4/55,8|Kapsayıcı; tek başına optimizasyon etkisi ilan edilmez|
| View.draw JS kapsamı |331;10,5/61,9|387;9,6/53,3|Ertelenmiş native çizim/commit bu kronometreye tamamen girmez|
| UI.tick |47;13,9/52,4|54;17,6/89,7|Adayda daha yüksek; bütün işleri hızlandırdı iddiası yok|
| rAF aralığı |329;150,0/483,4|385;133,3/350,0|Birleştirilmiş dağılım; koşu aralıkları örtüşür|
| Pointerdown→sonraki çizim |12;23,1/72,2|12;10,2/52,4|Az örnek/koşu oynaklığı; güvenilir genel dokunma kazanımı kanıtlanmadı|
| Uzun görev |363;126/368|404;119/289|Pencereler farklı uzunlukta; yalnız sayı farkından kazanım çıkmaz|

| Koşu | Ayna→çizim med/p95 ms | rAF/s | Pencere |
|---|---:|---:|---|
| Kontrol A1 (`a10`) |423,3/974,3|3,96|18 delta|
| MP.8.6 B1 (`b9`) |294,1/445,3|5,57|18 delta|
| MP.8.6 B2 (`b10`) |268,6/958,7|6,32|18 delta|
| Kontrol A2 (`a11`) |333,4/497,2|6,88|18 delta|

Aynı kontrolün kendi iki oturumu arasında da büyük fark vardır. Küçük draw/refresh farkları ve toplu rAF/dokunma yüzdeleri bağımsız kazanç sayılmaz. MP.8.5'in tarihsel14,7 rAF/s değeriyle bu pencere kıyaslanamaz: o koşu doğal gerçek-zaman simülasyon penceresi, farklı ölçüm/kancalar ve farklı anlık dünya içerir. MP.8.6'nın63,6% izole yükleme kazanımını da FPS yüzdesine çevirmiyoruz.

## Canvas / ana döngü trace'i

MP.8.6 B2 karşılaştırmasından **sonra**, host duraklıyken5 saniyelik ayrı CDP timeline trace'i alındı. `devtools.timeline`, `blink`, `cc` kategorileri;24 ana-frame/layer-update örneği. Bu trace kıyaslanan süreleri etkilemedi. [Ham gzip trace](evidence/mp87/frame-trace.json.gz), [thread ve süre özeti](evidence/mp87/trace-summary.json).

| Trace olayı | n | Med/p95 ms | Toplam wall ms |
|---|---:|---:|---:|
| ProxyMain::BeginMainFrame |24|197,2/340,7|4764,1|
| Commit (ana thread tam süreli olaylar) |24|142,2/280,3|3882,6|
| LayerTreeHost::DoUpdateLayers |24|141,5/279,9|3816,2|
| FireAnimationFrame |48|2,37/57,97|601,3|
| FunctionCall |103|0,08/35,81|600,2|
| Canvas2DResourceProvider::ProduceCanvasResource |24|6,93/17,53|187,9|
| Paint |12|2,01/19,17|47,2|
| Layout |6|11,31/33,22|89,9|
| RasterTask (diğer renderer thread'leri) |15|0,18/0,86|3,92|

Olaylar iç içedir ve **toplanmaz**. DoUpdateLayers ana renderer thread'inde yaklaşık3816 ms thread CPU da taşır; yalnız boşta bekleme diye açıklanamaz. JS dışındaki ana katman güncelleme/Canvas commit yolu bu yazılım çizimi koşulunda ağırdır. Küçük RasterTask toplamı tüm raster maliyetinin küçük olduğu anlamına gelmez; Canvas komutlarını işleme/kaynak üretimi başka olay kapsamlarında kalabilir. Bu trace belirli bir JS alt katmanını tek başına suçlamaz ve fiziksel GPU/telefon davranışını kanıtlamaz.

JS kapsamları da ayrı ölçüldü: `drawWorldImage` (bulutsu+sınır) medyan0 ms, p95 yaklaşık2,5→2,2 ms; `buildBorders` medyan0,1 ms, p9524,3→24,8 ms; filo sahiplik etiketleri medyan0 ms. Düşük JS çağrı süresi native/ertelenmiş Canvas işlemlerinin ücretsiz olduğu anlamına gelmez. `UI.paintSprites` medyan0,1 ms; `UI.tick`, ara refresh ve sınır üretimi kuyrukta katkı yapıyor. Büyük bir ayna/deserialize veya host AI yeniden yazımı yapılmadı.

## Optimizasyon kararı

**Yeni aday uygulanmadı veya kabul edilmedi; yeni kazanım yüzdesi yok.** MP.8.6 önbelleği aynen duruyor. Yeni büyük maliyet native layer/commit yolunda; tek bir güvenli JS fazlalığı olarak izole edilmedi. Kare atlamak veya yeniden çizimi durdurmak animasyonu/etkileşimi değiştirebilir. DPR düşürmek görsel kaliteyi değiştirir. Yeni katman/dirty-state önbelleği kamera, seçim, zaman, görünürlük, paneller ve context recovery için kanıtlanmış invalidation gerektirir; bu fazın küçük değişiklik sınırını aşar. Ölçülmemiş bir context/raster ayarı sırf PASS almak için eklenmedi.

## Save8 / RNG / güvenlik

- Başlangıç Save8 byte dizisi ve kozmetik seed bütün120. ay kollarında aynı.
- Her adımda **host RNG dizisi eşit**. Son host Save8 SHA, son ayna SHA ve son misafir serialize SHA/RNG bütün dört kolda eşit. Panel açıklığı ve seçili filo kimliği kontrolleri geçti.
- **Ara host Save8 SHA dizisi kontrolü FAIL / tam eşit değil.** Aynı kontrol kaynaklarının iki tekrarı arasında bile3–16. adımların bir bölümünde farklı hash'ler var; aynı adayın tekrarları da farklı. Hangi alanların fark ürettiği kaydedilmedi/kanıtlanmadı. UI/türetilmiş alan zamanlaması olasıdır; kesin kök neden diye sunulmaz. [Kontrol sonucu](evidence/mp87/host-hash-check.json). Bu performans koşusu host adım-adım byte eşdeğerlik kanıtı değildir; gözlenen uçtan uca farkın genellenmesini de sınırlar.
- Yeni host/AI/ekonomi/oyun runtime kodu yok. Ayrı PERF.1/PERF.2 ve piksel testleri sonuç tablosunda. Önceki MP.8.6 kanıtları korunuyor; yeni ürün değişikliğinin eşdeğerliği sağlandı diye başarısız ara-hash kontrolü gizlenmedi.
- Host otoritesi, ayna beyaz listesi, başka oyuncuların gizli verileri, karar/komut uygulaması ve bildirim kalıcılığı değiştirilmedi. Testteki seed sabitlemesi yalnız zaten mevcut kozmetik alanadır. Misafir simülasyon yürütmez.

## Geç oyun arşivi / 240. ay

27 `.save` dosyası tarandı;220–240 aralığında tek kayıt `tests/fixtures/96h10/seed11-month228-occupied-colony.save`. [Tarama](evidence/mp87/archive-search.json). Gerçek yükleme: day6840, seed11,45 sistem,6 normal devlet/4 canlı. Save8 yükleyicisi `G.over` alanını sıfırlar; yalnız buna bakıp aktif denmedi. Arşivin **ayrı atıl kopyası** doğal60 yarım günlük motor adımıyla229. aya ulaştı; oyun bitmedi,4 canlı devlet kaldı. Ölçülen fixture ve dünya değiştirilmedi. [Devam doğrulaması](evidence/mp87/archive-continuation.json).

228. ayda her kol tek oturum/18 gerçek tam-aynadan resync/6 dokunma ile **salt okunur** denetlendi. Bu arşiv tek oyunculudur; devlet1 rolü üzerinden filtreli misafir görünümü incelendi, AI bayrağı insan yapılmadı ve ölçümde simülasyon yürütülmedi. Bu, iki insanlı yeni bir geç oyun kampanyası değildir. [Ham karşılaştırma](evidence/mp87/late-comparison.json).

| 228. ay, farklı seed/kurulum | Kontrol med/p95 ms | MP.8.6 med/p95 ms |
|---|---:|---:|
| Deserialize (18/kol) |91,1/438,4|45,6/154,4|
| Tam ayna alımı→çizim (18/kol) |374,7/725,0|279,8/469,1|
| UI.refresh (23/kol) |27,3/56,1|17,9/48,6|
| View.draw (177/196) |13,0/93,1|11,4/52,2|

Son ayna/guest Save8/RNG eşit. Tek oturum/kol; rAF/s5,01→7,47 bu küçük arşiv örneğinin gözlemidir, genel geç oyun/FPS kazanımı değildir. **240. ay NOT RUN**; gerçek240 checkpoint yok. Seed404'ün önceki237. ay oyun sonu bayrağı silinmedi, timeout artırılmadı, yeni uzun kampanya başlatılmadı. MP.8.6'daki iki240 FAIL kaydı geçmiş raporda aynen kalır.

## Gerçek test sonuçları

| Bu fazda gerçekten çalıştırılan test | Sonuç | Açıklama |
|---|---|---|
| MP.8.6 native piksel/kimlik/RNG/fallback | **3/0 PASS**, çıkış0 | Önbellek değişmedi |
| Chromium piksel eşitliği | **3 vaka PASS**, çıkış0 | Orijinal/soğuk/sıcak RGBA aynı |
| PERF.1 eşdeğerlik | **4/0 PASS**, çıkış0 | Ay ay Save8/RNG ve koruma |
| PERF.2 eşdeğerlik | **5/0 PASS**, çıkış0 | Save8/RNG, AI pencere ve geçit koruması |
| MP.7.4 | **6/1 FAIL**, çıkış1 | **A1/A4/A5 PASS; B1 FAIL** |
| MP.7.5 | **6/0 PASS**, çıkış0 | A3 bu koşuda geçti; MP.8.6 ilk A3 FAIL'i kapanmadı |
|120. ay AB/BA dört ölçüm koşusu | Her biri **1/0 PASS**, çıkış0 |18 delta+6 dokunma, panel/seçim/build kontrolleri |
| Ara host SHA dizisi karşılaştırması | **FAIL**, tam eşleşmedi | Aynı-kod tekrarlarında da fark; RNG/son kayıt eşit |
|228. ay iki salt-okunur koşu | Her biri **1/0 PASS**, çıkış0 |18 tam ayna+6 dokunma; farklı arşiv/oyuncu yapısı |
| Pilot `a8` | **1/0 PASS** | Ek kontrol; ana dört oturum dağılımına katılmadı |
| Pilot `a1`, `a4` | Her biri **0/1 FAIL** | Örtülü düğme / hedef sayfasını değiştiren test girdisi |
| Pilot `a2` | **ABORTED**, çıkış1 | CPU4× CDP oturumu yaşam süresini düzeltmek için durduruldu; veri kabul edilmedi |
| Kurulum `a6`, `b7` | Her biri **0/1 FAIL** | MP1Join is not defined; performans başlamadı |

### Yeniden görülen B1

MP.7.4 B1'de gerçek `#jEditMe` dokunması hata verdi. Mevcut MP.8.3 tanısı Node tarafında korundu: page4 seq600–610 pointer/touch/click **aynı node5 #jEditMe** üzerinde, gerçek hedef doğru; seq609 click, seq611 `/mp/play` history geçişi; seq613–617 `setup:true` ve gizli `[0,0,0,0]` lobi düğmesinin farklı node'larla yeniden yaratılması. Ekran görüntüsünde gerçek “ÇOK OYUNCULU — DEVLETİNİ TASARLA” ekranı açıktır. Buna rağmen Playwright tap işlemi başarısız döndü. [Günlük](evidence/mp87/mp74-input.jsonl), [FAIL çıktısı](evidence/mp87/reg-mp74.log), [ekran](evidence/mp87/B1-tapfail.png).

Bu koşuda “dokunma hedefe ulaşmadı / tasarım hiç açılmadı” açıklaması doğru değildir. Son eylem tamamlama/DOM yenileme/history etkileşimi şüphelidir; testin catch'i orijinal Playwright hata metnini kendi tanısıyla değiştirdiğinden kesin dahili retry nedeni korunmamış. Ürünün dokunma davranışı veya test beklentisi değiştirilmedi; B1 FAIL'i geçerli kalır. Geniş bağımsız B1 kampanyası açılmadı.

### Yeniden görülen A1 benzeri gezinme

Performans kurulumunda `a6` ve `b7` MP1Join ReferenceError ile durdu. `b7-result.json` ana çerçevede **`/mp/play→/`** geçişini kaydetti. Gerçek tetikleyici pointer bu koşuda izlenmedi; eski koordinat/odak hipotezi burada yeniden kanıtlanmış değildir. Mevcut MP.8.3 helper'ı değiştirilmedi. Son MP.7.4 A1 gerçek üçlü dokunma senaryosu geçti; bu, kurulum FAIL'lerini silmez. Performans bootstrap'ının Enter yoluna alınması A1 ürün/test düzeltmesi diye sunulmaz.

**NOT RUN:** yeni MP.8 N/R, MP.7.3 ve tam regresyon; ürün/MP protokolü/sürümü değişmediği için önceki kampanyalar tekrarlanmadı. MP.8.6'daki N9/0, kısa R5/0, MP73 8/0 sonuçları yalnız tarihsel kanıttır, bu fazda yeni PASS değildir.240. ay, fiziksel Android ve bütün canlı Render kontrolleri NOT RUN. Önceki A3 ve240 FAIL kayıtları korunur.

## Değişiklikler / sürüm / paket

Yalnız `tests/browser-mp75-perf.cjs` opt-in sabit-kayıt kancası, yerel eski misafir script route'u, başlangıç gezinme kaydı ve bu performans moduna özel mevcut Enter katılım yolu; yeni `tests/helpers/mp87-frame.cjs`; bu rapor, kanıtlar ve `CODEX-SON-RAPOR.md` değişti. Normal performans modu ve MP.7.4 dokunma helper'ı korunur. Timeout/oyun-sonu/seed/örnek/karar beklentileri gevşetilmedi.

**Ürün/runtime/MP istemci/server değişmedi.** Oyun96h10p5/PWA stars-v96h10p5, MP.8.6 ve Save8 v8 aynı.19 runtime SHA-256 manifest eşleşmesi doğrulandı. Yeni build/PWA/manifest/ZIP/SHA-256/CRC32 paket üretimi gerekmedi ve yapılmadı. Docker/allowlist/protokol/paket sözleşmesi değişmedi; deploy yok.

## Yeniden ölçme komutları

Depo kökünde, aynı bağımlılıklarla ve sırayla. Kontrol betiği gerçek geçmiş commit'ten alınır; ürün dosyasının üstüne yazılmaz:

```sh
git show c005f82c240ab26375f5307405d11a883207a453:research/mp6/client/guest-stars.js > /tmp/mp85-guest-stars.js
# A kolu; sonra B (MP87_CONTROL olmadan), sonra B, sonra A; her STARS_OUTPUT ayrı dizin.
MP87_FRAME=1 MP87_CONTROL=/tmp/mp85-guest-stars.js STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/mp87-A node tests/browser-mp75-perf.cjs
MP87_FRAME=1 STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/mp87-B node tests/browser-mp75-perf.cjs
# İsteğe bağlı ayrı5 saniyelik trace, karşılaştırma bittikten sonra alınır:
MP87_FRAME=1 MP87_TRACE=1 STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/mp87-trace node tests/browser-mp75-perf.cjs
#228 arşivi: salt okunur; her iki kolda da aynı MP87_SAVE ve MP87_FROZEN kullanılır.
MP87_FRAME=1 MP87_FROZEN=1 MP87_SAVE=tests/fixtures/96h10/seed11-month228-occupied-colony.save STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/mp87-228 node tests/browser-mp75-perf.cjs
node tests/mp86_nebula_cache_test.js
node tests/perf1_equivalence_test.js
node tests/perf2_equivalence_test.js
STARS_TRACE=/tmp/mp87-input.jsonl STARS_CHROMIUM_PATH=/usr/bin/chromium node --require ./tests/helpers/mp83-input-trace.cjs tests/browser-mp74.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium node tests/browser-mp75.cjs
```

Chromium piksel denetimi mevcut `mp86-nebula-bench.cjs` aracıyla `MP86_PIXELS_ONLY=1` modunda, MP.8.6 raporundaki sabit runtime kopyası ve istemciden çıkarılan aynı marker bloğuyla çalıştırıldı. Yeni hız kampanyası yapılmadı. `node --check` ve `git diff --check` geçti.

## GitHub teslimi

- Test araçları/kanıt/rapor bitiş referansı **`b4eaec7049f4495e4f3db415b09df5a93e813bcf`** commit'i GitHub'a push edildi; `git ls-remote --heads origin refs/heads/codex/stars-mp87-frame-performance` aynı SHA'yı doğruladı. Rapor teslimi **PASS**.
- Başlangıç **`0dfb449e52bcdd6a9c1c73838f2f476ae37b2216`** → doğrulanmış teslim referansı yukarıda. Bu teslim kaydını ekleyen son belge commit'i kendi SHA'sını önceden bilemez; nihai HEAD son sohbet yanıtında verilir. Sırf kendi SHA'sını yazmak için yeni commit zinciri üretilmedi.
- Dal `codex/stars-mp87-frame-performance`; PR tabanı `codex/stars-mp86-performance`.
- **PR oluşturulamadı / BLOCKED**: yalnız bir `gh pr create` denemesi `Post "https://api.github.com/graphql": Forbidden` ile çıkış1 döndü. Tekrar araştırılmadı; güvenlik sınırları değiştirilmedi. [Hata kaydı](evidence/mp87/pr-attempt.log).
- [GitHub raporu](https://github.com/sarsiss12-dot/Star/blob/codex/stars-mp87-frame-performance/reports/codex/MP87-AKICILIK-SONUC.md).
- [Doğru tabanla karşılaştır / PR oluştur](https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp86-performance...codex/stars-mp87-frame-performance?expand=1).
- Çalışma dalı dışında main/merge/rebase/force-push ve canlı dağıtım işlemi yapılmadı.

## Açıklar / sonraki öncelikler

1. MP.8.6 yeniden hesaplama maliyetini azaltır; genel akıcılık/FPS ve hosttan ekrana toplam gecikme düzelmiş sayılmaz. Aynı kaydın native Canvas commit maliyetini gerçek GPU/cihaz koşulunda da ayır; yalnız görsel eşdeğerliği kanıtlanabilir tek katman adayıyla ilerle.
2. Ara host hash farkını alan bazında yakalayan küçük bir kontrol ekle; özel/türetilmiş farkın aynaya yansıyıp yansımadığını her adımda kaydet. Eşitsizliği görmezden gelen normalizasyon ekleme.
3. A1 benzeri gezinme bu fazın kurulumunda yeniden görüldü. Tarihsel B1 ve MP.7.5 A3 kesin çözülmüş değildir; yalnız kanıt oluşursa hedefli düzeltme yapılmalı.
4. Bildirim gizleme/kayıt kimliği sorunu ayrı fazda açık. Bu fazda dokunulmadı.
5. 240. ayda yaşayan gerçek checkpoint yok;228 arşivi onun yerine adlandırılmadı. Render/Android sonraki faz için kullanıcı isterse ele alınır; bu fazda NOT RUN.
