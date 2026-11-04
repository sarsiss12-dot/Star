# STARS MP.8.8 — Multiplayer kararlılığı ve host kayıt tutarlılığı

## Sonuç

- **P0 kök nedeni ayrıştırıldı:** asenkron host arayüz yenilemesi Save8'e giren güç/baskı önbelleği gün damgalarını farklı anlarda dolduruyor. Yeniden üretilen ilk Save8 çiftinde yalnız sekiz `_powAt` / `_pressAt` alanı farklı; RNG, zaman, ekonomi, diplomasi, filo, koloni ve teknoloji verileri aynı. Serializer/şema/alanlar değiştirilmedi. Aynı açık UI kontrol noktasında tam bayt karşılaştırması ve temiz MP oturumunda gerçek ayna akışı eşleşti.
- **A1 ürün düzeltmesi:** giriş alanının gecikmiş merkezleme callback'i gerçek dokunuş sırasında KATIL/GERİ konumlarını kaydırabiliyordu. Yeni dokunuşta/fokus kaybında bekleyen iş iptal edilir; yalnız hâlâ odaklı ve bağlı input kaydırılır. Test yardımcısı da ilk koordinattan önce gerçek, sınırlandırılmış merkezleme sonucunu bekler. Dokunuşlar arası taze koordinat düzeltmesi korunur.
- **B1 test düzeltmesi:** kalan hızlı KATIL dokunuşu, lobi erken gelirse tasarım düğmesine düşüp ekranı testin açık `tap('#jEditMe')` çağrısından önce açabiliyor. Playwright sonrasında gizli düğmeyi bekleyerek doğru biçimde zaman aşımına uğruyor. Test bu başlangıç durumunu denetler; bir güvenilir click, bir gerçek açılış, doğru rol/ekran doğrulanmadan ilerlemez. Hataları catch edip PASS yapmaz.
- Yeni özellik, performans optimizasyonu veya host/AI/ekonomi/simülasyon düzeltmesi yapılmadı. Bildirim kalıcılığı kapsam dışı kaldı.

## Kanonik kaynak ve ortam

- Başlangıç dalı `codex/stars-mp87-frame-performance`; GitHub fetch ve temiz yerel HEAD **`cdf58527d7fac51b97746b366f7c38f128db8e39`**, beklenenle aynı.
- Geliştirme dalı `codex/stars-mp88-stability`; PR tabanı `codex/stars-mp87-frame-performance`.
- `AGENTS.md`, `GPT-DEVIR.md`, `CLAUDE.md`, son rapor, MP.8.7 raporu/host hash kontrolü/MP74 olay günlüğü/FAIL çıktısı ve `research/mp81/A5-TANI.md` esas alındı. MP.8.3 araçları ve MP.8.7 sabit120. ay kaydı yeniden kullanıldı; yeni uzun kampanya başlatılmadı.
- Node24.22.1, Chromium155.0.8059.79 `/usr/bin/chromium`, Playwright1.62.1, native Canvas0.1.100. Yerel relay/TLS ve dokunmatik Chromium; fiziksel telefon değildir. Kaynak veya ağ izinleri artırılmadı.
- `main` değiştirilmedi; merge/rebase/force-push yok. **Bütün canlı Render kontrolleri ve fiziksel Android NOT RUN.** Render bağlantısı, izin isteği, deploy/restart veya yeni environment işlemi yapılmadı.

## P0 — İlk farklı Save8 ve alanlar

MP.8.7'nin dört geçmiş oturumunda ilk hash ayrılığı **3. adımda**; aynı kontrolün iki tekrarında ilk ayrılık **5. adımda**. Geçmişte ara Save8 metinleri tutulmadığından o3. adımın alanlarını geriye dönük çıkarmak mümkün değil. Bu sınır korunuyor. [Geçmiş hash incelemesi](evidence/mp88/historical-first-differences.json).

Aynı seed404/45 sistem/2 insan+5 AI/120. ay kaydından, aynı kodla iki yeni kısa Chromium koşusu alındı: sekizer yarım günlük gerçek motor adımı, her adımın **tam ham Save8'i**, RNG, gerçek misafir aynası ve yazan işlev stack'leri Node dosyasında saklandı. Performans kampanyası yapılmadı.

Yeni aynı-kod tekrarında ilk farklı çift **5. adım**;6. adımda aynı fark,1–4 ve7–8'de tam hash eşit. Sekiz benzersiz fark:

| Alanlar | A değeri | B değeri | Kategori |
|---|---:|---:|---|
| `emps[0,1,4,5]._powAt` |3616,733|3615,233|Türetilmiş güç önbelleğinin oyun-günü damgası|
| `emps[0,1,4,5]._pressAt` |3616,733|3615,233|Türetilmiş sınır baskısı önbelleğinin oyun-günü damgası|

İki adım × sekiz alan =16 fark kaydı. Cache **değerleri** `_powC` / `_press` aynı; yalnız gün damgaları farklı. Her adımda RNG ve aynanın **ham JSON baytları** aynı. [Alan farkları](evidence/mp88/raw-comparison-field-comparison.json); ilk Save8 çifti `raw-comparison-first-a.save.gz` / `raw-comparison-first-b.save.gz` (gzip açılınca özgün baytlar); bütün ham adımlar `hash-raw1-host-hash88.json.gz` ve `hash-raw2-host-hash88.json.gz` içinde.

| İstenen kategori | Yeni ilk çiftte farklı alan |
|---|---:|
| Kanonik oyun durumu |0|
| Ekonomi/diplomasi |0|
| Filo/koloni/teknoloji |0|
| RNG ve oyun zamanı |0|
| UI tercihleri/sunum verisi |0|
| Önbellek/türetilmiş alan |8|
| Dış saat/timestamp alanı |0; sebep aşağıdaki asenkron UI çağrı sırasıdır|

### Hangi işlev yazıyor?

Kaydedilen stack: `UI.refresh → p_sistem → jointPanel → jointView → aiView → explorationContext → reinforcementThreats → claimOf → influenceAt → borderPressure`. `borderPressure` `_press` / `_pressAt` yazar ve `totalPower` üzerinden `_powC` / `_powAt` doldurur. Her iki cache de yalnız damgası **G.day** ile eşitse kullanılır.

Ana `frame` döngüsünde `LOOP.panAcc > 2.2` ve dokunma koşulu sağlanınca UI.refresh çağrılır. Bu birikim rAF/dt'ye bağlıdır; kesin2,2 duvar saniyesi değildir. MP.8.7 yarım gün motor adımlarını ayrı Node/CDP çağrılarıyla ilerletirken araya giren arayüz yenilemesinin zamanı serbest kaldı. Cache'ler `serialize()` içindeki tam `G.emps` ile kayda giriyor. Dolayısıyla farklı UI fazındaki tam Save8 SHA'larını simülasyon farklılığı saymak yanlış ölçüm varsayımıydı.

`mp88_host_hash_test.js` kontrolleri: UI.refresh öncesi/sonrası yalnız bu sekiz damga; RNG değişmez. Her iki motorda aynı UI kontrol noktasından sonra **bütün cache alanları dahil tam serialize metni** eşit. Farklı UI yenileme takvimleriyle60 yarım adım/sonraki ayda RNG dizisi ve tam son Save8 aynı. Veri silinmedi, normalizasyon/serializer değişikliği yapılmadı.

### MP oturumu yaşam döngüsü — ek FAIL ve doğru fikstür

İki Chromium `settled` koşusunda host Save8 ve RNG8/8 eşleşti; fakat birleşik katı ayna karşılaştırması **FAIL** verdi: yalnız `/log` kişisel bildirimleri farklıydı. Bu sonuç gizlenmedi. [Tam FAIL kaydı](evidence/mp88/settled-comparison-field-comparison.json), [ayna alan farkı](evidence/mp88/settled-mirror-failure.json).

Eski MP.8.7 ölçüm kurulumu önce başka bir dünya/oda kurup sonra **çalışan MP çekirdeğinin içine yalnız deserialize(Save8)** yapıyordu. Save8, MP çekirdeğindeki `notes`, `spyIntelSeen`, `spyNetSeen`, `spyPrimed` gibi oturum gözlem geçmişini içermez. `spySweep` yeni dünyanın istihbaratını eski gözlemle karşılaştırıp kişisel bildirim üretebilir. Log farkı cache damgasının misafire sızması değildir; farklı MP geçmişleri karşılaştırılmıştır.

Bu sınır ayrıca kontrollü Node testinde kanıtlandı: önce seed404 veya seed22 gören iki çekirdeğe aynı Save8 yüklendiğinde host baytları/RNG aynı, yalnız MP kişisel logları farklı. Ardından **dünya sabit Save8'den kurulduktan sonra yeni MP çekirdeği yaratılan** doğru fikstür kullanıldı. Aynı oda/kozmetik kimliği, gerçek hello/assign/ui/publish ve farklı UI çağrı takvimleriyle sekiz adımın her birinde tam host Save8, RNG ve gerçek tam/delta ayna mesaj akışı byte-byte eşleşti. [Temiz MP eşdeğerliği](evidence/mp88/hash-native-fresh-fresh-mp-equality.json), [oturum sınırı deneyi](evidence/mp88/hash-native-fresh-observer-boundary.json).

Bu fazdaki çözüm ölçümün UI fazını ve MP başlangıç durumunu açık kılmaktır. Çalışan oyunun serializer'ı veya oturum kurtarma mantığı değiştirilmedi. Kapsam, sınanan kayıt/pencere/sonraki aydır; tüm olası oyun geçmişleri için ispat değildir.

## A1 — İki yarış aralığı ve düzeltme

Tanılı koşu `b1-diag2.jsonl`: pointerdown/touchstart/pointerup/touchend KATIL'da, sonra `appScroll 0→40`, focus GERİ ve click GERİ; Node `Page.frameRequestedNavigation.reason=anchorClick`, `/mp/play→/`, ardından MP1Join ReferenceError. Form submit veya kendiliğinden script yükleme eksikliği değil. Yeni olay kanıtı eski40px mekanizmasını **tek dokunuşun içine** kadar daralttı.

Kontrollü gerçek-touch deneyinde eski `join.js` ile parmak KATIL'da başlatılıp250ms odak işi sırasında tutuldu: pointerdown/pointerup KATIL, click GERİ, `/` gezinmesi. [Kontrol](evidence/mp88/a1-control-input-race.json). Ürün düzeltmesiyle aynı deneyde scroll0, tek click KATIL ve yol `/mp/play`; hatalı oda kodu normal şekilde reddedildi. Input boşta kalırsa eski merkezleme çalışmaya devam ediyor.

Ürün değişikliği `join.js`: bekleyen input-focus timer'ı `pointerdown` ve `focusout` ile iptal edilir; callback yalnız hâlâ odaklı/DOM'a bağlı input için çalışır. Host zamanı, komutlar ve gizlilik değişmez.

Ayrı test aralığı: ilk bounding-box RPC'si ile ilk pointerdown arasındaki kayma da eski koordinatı geçersiz kılabilir. MP.8.3 yardımcısı artık ilk koordinattan önce input'un **clamp edilmiş gerçek merkezleme sonucunu** bekler, sonra her dokunuşta hedefi yeniden ölçer. Sabit uyku veya artırılmış timeout ile PASS üretilmez; koşul8s sınırındadır, tap8s ve diğer bekleme eşikleri korunur. Yüksek yatay görünümde kaydırma sınırda0 kalabiliyorsa bu geçerli sonuç kabul edilir. Hızlı çift/üçlü dokunma kapsamı ve tek koltuk beklentisi korunur.

## B1 — Önceden açılmış tasarımı yeniden açmayı beklemek

MP.8.7 günlüğü yeniden kullanıldı: page4 seq583–594 ilk gerçek CDP dokunuşu KATIL; lobi geldikten sonra seq600–612 **joinBurst'ün kalan CDP dokunuşu** `#jEditMe` üzerinde. Bu, locator.tap içindeki giriş değildir: günlüğün CDP metot satırları testin `tapAt`/joinBurst kanalından geliyor. seq609 click tasarımı açıyor; gizli lobi düğmesi sonra periyodik render'larla değişiyor.

Küçük kontrollü gerçek lobide erken-lobi + kayıtlı40px kayma geometrisi tekrarlandı. Kalan KATIL dokunuşu tasarımı bir kez açtı. Eski açık `locator.tap('#jEditMe',{timeout:8000})` sonra **zaten gizli düğmede** TimeoutError verdi. Orijinal mesaj/stack kayıpsız saklandı; bu bir dokunma-sonrası Playwright completion kusuru diye sunulmuyor. [Son aynı-fikstür eski yol](evidence/mp88/b1-counter-final-lobby-replay.json).

Yeni test yardımcısı tasarım zaten açık mı diye **yeni tap göndermeden önce** bakar. Her iki yolda da doğru URL/lobi, guest rolü, görünür gerçek setup, **tam bir trusted click + tam bir gerçek open** ve sıfır beklenmeyen açma girişimi zorunlu. Kapalıysa normal gerçek tap yapılır; bu tap hata verirse hata aynen yayılır. [Düzeltilmiş tekrar](evidence/mp88/b1-small-fixed3-lobby-replay.json). B1 için ürün kodu veya700ms sentetik click koruması değiştirilmedi.

Tanı: MP.8.3 Node günlüğüne bağlı element kimliği/bağlılık, focusout, isteğe bağlı history/scroll stack'leri; Node tarafında locator tap öncesi/sonrası ve eksiksiz hata. MP74/75/perf helper'ları ilk catch anında orijinal Playwright name/message/stack'ini JSON'a yazar; sonraki screenshot/evaluate hatası gerçek hatayı silemez.

## Test sonuçları

| Gerçek koşu / kontrol | Sonuç | Sınır |
|---|---|---|
| Host alan/UI fazı/sonraki ay/temiz MP/oturum geçmişi native | **5/0 PASS** | Tam baytlar,60 yarım adım RNG,8 temiz MP ayna adımı |
| İki ham Chromium kaydı |8'er snapshot alındı; ham SHA eşitliği **FAIL** |5/6. adımda sekiz cache damgası; her adım RNG/ayna eşit |
| İki Chromium UI-kontrol-noktalı kayıt |Host Save8/RNG8/8 **PASS**; birleşik ayna **FAIL** |Yalnız eski oturumdan gelen kişisel log farkı; alan atılmadı |
| A1 eski ürün kontrollü deney |Yanlış `/` gezinmesi **yeniden üretildi** |Tanı programı beklenen hatayı doğrular; ürün PASS'i değildir |
| A1 ürün/test düzeltmesi |**PASS**, iki ayrı yeni doğrulama + son800×360/960×540 kontrolü |Tek doğru click, boşta input scroll, gerçek üçlü KATIL |
| B1 eski test devamı |Gerçek **TimeoutError yeniden üretildi** |Tasarım açıkken gizli düğmeyi bekleme; tam orijinal hata saklandı |
| B1 düzeltilmiş kontrollü tekrar |**PASS** |Tek trusted click/open, doğru rol/ekran; yeni gereksiz tap yok |
| MP.7.4 ilk tam regresyon |**7/0 PASS** |A1/A4/A5/B1 dahil |
| MP.7.4 auditli son tam regresyon |**7/0 PASS** |Doğal girişlerde audit1 click/1 open; kapasite ve kararlar korundu |
| MP.7.5 ilk regresyon |**5/1 FAIL** |A1 dock testi `#mp6Conn` tap; **A3 geçti** |
| MP.7.5 tanılı tekrar |**6/0 PASS** |İlk dock FAIL'i silinmez; nedeni yeniden oluşmadı |
| MP.8 N ilk tam koşu |**8/1 FAIL** |N0–N6/N8 geçti; **N7 relay did not start** |
| MP.8 N7 hedefli tekrar |**2/0 PASS** |N0+N7; diğer N testleri bu tekrarda NOT RUN. İlk zaman aşımının kesin nedeni yok |
| MP.8 R ilk koşu |**ABORTED** |Ajan R3 sırasında kesti; R0/R1/R2 geçmişti, R3/R4 kapalı sayfa hataları kabul kanıtı değil |
| MP.8 R son6+6 hedefli koşu |**3/2 FAIL**, çıkış1 |R0/R1/R2 PASS, **R3/R4 FAIL**; ikinci6 ay gerçekleşmedi |
| MP.7.3 |**8/0 PASS** |Yerel endpoint/UI kesin MP.8.8; yeniden bağlantı, konsey/siyaset/gizlilik |
| PERF.1 |**4/0 PASS** |Eşdeğerlik/koruma |
| PERF.2 |**5/0 PASS** |Eşdeğerlik/koruma |
| MP.8.6 native piksel/önbellek |**3/0 PASS** |RNG, piksel, yeni canvas, fallback |
| MP.8.6 Chromium piksel |**3 vaka PASS** |Gerçek RGBA eşitliği |

Test çıkışları: [ilk regresyon](evidence/mp88/regression-exits.json), [son koşular](evidence/mp88/final-check-exits.json). Ham sayfa/karar/senkron çıktıları aynı kanıt dizinindedir. Bir dış orkestrasyon komutunun0 çıkışı, içerideki FAIL testlerinin PASS olduğu anlamına gelmez; tablo gerçek alt komut sonuçlarını kullanır.

### Açık R3 ve önceki aralıklı FAIL'ler

Son R3'ün orijinal mesajı `locator.tap: Timeout 8000ms exceeded`, hedef **yeni host ana menüsündeki #mp1Btn**; bekleme görünür/etkin/kararlı element aşamasında durdu. Kayıt seçme, paket yükleme ve yeni odadan devam aşamasına ulaşmadı. R4'te `__mp8 is not defined`, başarısız R3 nedeniyle test kurulumunun eksik olmasının devamıdır. [R tam log](evidence/mp88/R6-final.log), [yapılandırılmış sonuç](evidence/mp88/R6-final-mp8-R.json). Bu bir Save8 deserialize hatası olarak kanıtlanmadı; **gerçek MP devam kabulü bu fazda sağlanamadı**. R2'de IndexedDB kaydı, Save8/RNG korunması ve süreç kapatma geçti; geri yükleme/devam başarısı iddia edilmez. Host ana sayfası guest `join.js` dosyasını yüklemez; yeni odak callback'i bu hatanın kanıtlanmış nedeni değildir.

İlk N7 zaman aşımı hedefli tekrarda oluşmadı;20s sınırı büyütülmedi. Başlangıç hata mesajına child pid/exit/signal/stderr ve son sağlık cevabı tanısı eklendi. İlk MP75 dock tap hatasının kök nedeni de kapanmadı. A3 barış teklifi bu fazın her iki MP75 koşusunda geçti; eski MP.8.6 A3 FAIL'i yine tarihsel açık kalır. Rastgele teklif üretimi zorlanmadı, AI/diplomasi değiştirilmedi.

B1'e yönelik ilk üç doğal tanıdan iki koşu2/0 geçti, biri A1 yanlış gezinmesiyle1/1 FAIL oldu. Kontrollü küçük fikstürün başarısız hazırlık/gezinme denemeleri de silinmedi: [tanı durumları](evidence/mp88/diagnostic-status.json). Bu pilotlar kabul edilmiş kontrol–aday çiftine katılmadı. Son çiftte başlangıç kaydırması0, lobi replay kaydırması40px olarak açıkça sabitlendi; bu kontrollü geometri deneyi doğal hata sıklığı ölçümü değildir.

**NOT RUN:** fiziksel Android, bütün canlı Render kontrolleri, uzun120/240 dayanıklılık kampanyası, tam genel regresyon ve performans karşılaştırması. R4'ün gerçek devam senaryosu R3 engeli yüzünden tamamlanmadı. Başarısız ilk sonuçlar sonraki PASS'lerle silinmedi.

## Dosyalar / sürüm / paket

- Ürün: `research/mp1/client/join.js` (odak timer yarışı); `view.js` ve `research/mp1/server/relay.js` yalnız **MP.8.8** kimliği.
- Mevcut testler: MP73 kesin sürüm beklentisi; MP74 auditli guest-design girişi ve hedefli filtre; MP75/perf kayıpsız tap hatası; MP8 hedefli filtre ve relay başlangıç hatasında ek tanı (20s eşik aynı).
- Yardımcılar: MP83 taze koordinat/merkezleme ve kontrollü replay seçeneği; MP83 Node olay tanısı; MP87 opt-in hash kancası. Yeni MP88 input/lobby/hash testleri ve alan/eylem tanı yardımcıları. Varsayılan test kapsamı filtre yokken korunur.
- **19 oyun runtime dosyası değişmedi**, manifest hash'leri eşleşti. Oyun96h10p5/PWA stars-v96h10p5, Save8 v8; MP protokol1 ve kayıt paketi4 aynı. Yeni oyun build/PWA/manifest/ZIP/SHA-256/CRC32 paket yayını **gerekmedi / yapılmadı**. [Sözleşme](evidence/mp88/runtime-contract.json).
- Mevcut Docker COPY ve relay allowlist `join.js`/`view.js` dosyalarını zaten kapsıyor; yeni dağıtım asset'i yok. Render deploy yapılmadı. Yerel MP sürüm endpoint'i ile arayüz uyumu MP73'te sınanır.

## Yeniden doğrulama

Depo kökü; Chromium testleri sırayla, her STARS_OUTPUT ayrı dizinde:

```sh
MP88_EVIDENCE=/tmp/hash88 node tests/mp88_host_hash_test.js
# Aynı MP87 sabit kaydının ham tanısı; iki ayrı çıktı diziniyle tekrar.
MP87_FRAME=1 MP88_HASH=raw STARS_OUTPUT=/tmp/raw88 STARS_CHROMIUM_PATH=/usr/bin/chromium node tests/browser-mp75-perf.cjs
node tests/helpers/mp88-compare-hashes.cjs <run1/host-hash88.json.gz> <run2/host-hash88.json.gz> <diff-out>
# Kontrollü A1: MP88_CONTROL'a başlangıç HEAD'indeki join.js kopyası verilirse eski yanlış gezinme beklenir.
STARS_CHROMIUM_PATH=/usr/bin/chromium node tests/browser-mp88-input.cjs
# Kontrollü B1: MP88_OLD_DESIGN=1 eski ikinci tap'in gerçek TimeoutError'ını bekler.
MP88_LOBBY_REPLAY=1 STARS_CHROMIUM_PATH=/usr/bin/chromium node tests/browser-mp88-lobby.cjs
STARS_TRACE=/tmp/mp88.jsonl STARS_CHROMIUM_PATH=/usr/bin/chromium node --require ./tests/helpers/mp88-input-diag.cjs tests/browser-mp74.cjs
node tests/perf1_equivalence_test.js
node tests/perf2_equivalence_test.js
node tests/mp86_nebula_cache_test.js
MP8_SCEN=N STARS_CHROMIUM_PATH=/usr/bin/chromium node tests/browser-mp8.cjs
MP8_SCEN=R MP8_MONTHS=6 STARS_CHROMIUM_PATH=/usr/bin/chromium node tests/browser-mp8.cjs
```

Ham karşılaştırma cache damgası farkını raporlar; `settled` modunda strict karşılaştırıcı host/RNG/**ayna** eşitliği ister ve eski MP geçmişi farkını da FAIL bırakır. Doğru temiz-oturum kontrolü native5 vakalık testtedir. Hiçbir alan silinmez veya normalize edilmez. `.save.gz` kanıtları gzip açılarak özgün Save8 metni olarak okunabilir.

## GitHub teslimi

İlk push ve tek PR denemesinin doğrulanmış sonucu burada tamamlanacak. Kendi SHA'sını önceden bilemeyen son rapor commit'i için doğrulanmış önceki teslim referansı rapora, nihai HEAD son sohbet yanıtına yazılır.

## Açıklar / sonraki faz öncelikleri

1. **Öncelik: R3 host ana menü dokunması.** Element yaşamı, iki rAF arasındaki gerçek rect değişimi, örtüşen katman ve kullanıcı olay hedefi kaydedilmeli; sonra aynı kayıtla R3/R4 tamamlanmalı. Timeout artırma veya hareketli/örtülü hedefi force ederek PASS üretme. İlk MP75 bağlantı düğmesi FAIL'i ve N7 başlangıç zaman aşımı da kesin kanıtla ayrıştırılmalı.
2. A1 timer ve B1 test önkoşulu kanıtlandı; fiziksel Android klavye/visualViewport/OS arka plan davranışı bu Chromium deneylerinin sonucu değildir. Gerçek cihaz planı ayrı kalır.
3. Ham Save8'den aynı MP akışını bekleyen yeni testler oturum geçmişini de aynı şekilde kurmalı; canlı çekirdeğe yalnız deserialize yapmak tam MP kayıt/devam yerine geçmez. Gerçek devam MP.4 yolu ile sınanır.
4. Önceki MP75 A3 FAIL'i açık tarihsel bulgudur; bu fazda AI barış üretimini zorlayan kod yok. Yeni kanıt çıkarsa gerçek savaş/teklif durumundan ilerle.
5. Bildirim gizleme/kayıt kimliği ve geç oyun native Canvas darboğazı ayrı fazlar; yeni240 kampanyası, performans optimizasyonu ve Render araştırması yapılmadı.
