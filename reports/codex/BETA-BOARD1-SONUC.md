# STARS — BETA-BOARD.1 sonuç raporu

## 1. Kaynak, teslim sınırı ve sürüm

Başlangıç/PR tabanı: `codex/stars-mp-p0-guest-playability`, GitHub’da doğrulanan `955c2445bb9f7837653bc372f9e8262ded6803d1`. p15 kod/paket commit’i `466946186f80b09c6d7e126a13ecce48574ef95a`, rapor commit’i955c kaynak olarak birlikte korundu. Çalışma dalı: `codex/stars-beta-board1-federation-stability-ux`. Eski main kaynak alınmadı; başlangıçta main `4296ad2d43fedce6264020b3761f50f1839fd836` idi. Kanıt: `evidence/beta-board1/source-heads.txt`.

**Doğrulanmış bitiş kod/paket HEAD’i: `48dcc2bd84d9df5caf0d8798e7ca6907ab63fb3a`; uzak dal aynı SHA’yı verdi. PR ve paket sonuçları aşağıdadır.** Raporun kendi SHA’sını içine ekleyen commit zinciri oluşturulmaz; rapor önce doğrulanan kod/paket commit’ine bağlanır, son rapor HEAD’i sohbet tesliminde verilir.

Oyun `96h10p16`, PWA `stars-v96h10p16`, MP `MP.8.9b11`; Save8 v8, MP paket4/protokol1 korunur. Yeni gündem verisi federasyonun mevcut Save8 nesnesinde isteğe bağlı alandır; eski kayıtlarda yoksa oluşturulmaz. Gemi iptal belirteçleri yalnız oturumdadır. Yeni iptal komutu için p16/MPb11 istemci+host birlikte kullanılmalı; eski canlı istemcinin sayısal sıra komutu güvenle reddedilir. Bu, eski kayıtların yüklenmesini engellemez.

**Kapsam:** A paketi ve B’de kanıtlanan iki hız kusuru, gemi iptali yarışı ve ilişkili küçük C işleri teslim edilir. B’de özgün filo/enerji kullanıcı vakaları çözülmüş değildir. D/E’nin geniş özellikleri uygulanmadı. Görev numaraları Issue #33 içindeki pano ID’leridir. Her prompt satırı tamamlanmış sayılmadı; ayrıntılı gerçek envanter: [BETA-BOARD1-GOREV-ENVANTERI.md](BETA-BOARD1-GOREV-ENVANTERI.md). Kullanıcı kabulü verilmedi; hiçbir görev TAMAMLANDI değildir.

## 2. Kanıtlanan nedenler ve minimal değişiklikler

### #50 — Ortak federasyon gündem kuyruğu

Eski `canFedLaw/canFedMotion/canFedWarRequest/canRequestFederation` aktif gündemi doğrudan reddediyordu. Tek, sınırlı FIFO eklendi; mevcut yasa/önerge/savaş izni/üyelik başvurusu açılışları kullanılır. Aynı anda tek gerçek oylama vardır. Kuyruğa girerken yasa, savaş, üyelik, ödeme veya AI oyu uygulanmaz.

- En fazla12 bekleyen öneri, öneren başına3, bekleme süresi360 oyun günü; geçmiş en fazla32 kayıt. Aktif sonucun geçmişten erkenden düşmesi engellenir. Sıra/konu/öneren/hedef/süre/ücret panelde görünür.
- Sıra geldiğinde üyelik, yaşayan devlet, koşullar, devam eden savaş, aday, bütçe ve eski cooldown yeniden doğrulanır. Ücret yalnız gerçek oylama açılırken mevcut motor tarafından bir kez kesilir. Örnekte yasa açılışı60 etki; sırada, geri çekmede veya geçersiz kapanışta bedel yoktur.
- Oyuncu kendi bekleyen önerisini host doğrulamasıyla geri çeker. Ağ tekrarları ve aynı konu kopyaları reddedilir. Aynı adayın farklı aracı üzerinden üyelik başvuruları da aynı konu sayılır. Farklı üyelerin kendi savaş izinleri ayrı tutulur.
- Biten savaş için destek önerisi gerekçeyle geçersiz kapanır. Kabul edilmiş savaş yardımı, mevcut yetkili uygulama/katılım kurallarını kendiliğinden atlamaz. Savunma yükümlülükleri ve Galaktik Konsey’in ayrı sistemi değiştirilmedi.
- AI yalnız mevcut değerlendirme ve cooldown ile önerir; kendi bekleyen önerisi varken kuyruk doldurmaz, insan adına oy yazmaz. Yeni strateji/denge sistemi yoktur.
- Sonuç mevcut Gelen Kutusu ve federasyon oylama panelinde erişilebilir. Bilgilendirme hız/pause değiştirmez. Üye kuyruğu yalnız üyelere; dış başvuran yalnız kendi satırına erişir. π kimlik dönüşümleri uygulanır.

Önce5 FAIL (`agenda-before.log`); yeni çekirdek testleri sonradan genişletildi. Ara mükerrer başvuru hatası11/1 ayrı kayıttadır. Kesirli gün152.0152’de `expires-created>360` kontrolü kayan nokta nedeniyle360.00000000000006 hesaplayıp geçerli kaydı siliyordu: `agenda-fraction-before.log`12/1. Karşılaştırma, üretimdeki aynı toplama üzerinden `expires>created+360` olarak düzeltildi; süre uzatılmadı, assertion gevşetilmedi. Nihai çekirdek13/0.

### #38 — Üye oylaması ve adayın ayrı rızası

Mevcut üyelik oylaması/davet/aday kabulü altyapısı yeniden kullanıldı. Eski `fedAdmissionGate`, adayın bütün üyelerle önceden ittifakını oylamalı yolda da şart koşuyordu. Yalnız **üye oylamasından çıkan**, `admission:'vote'` işaretli davette bu önkoşul kaldırıldı. Eski doğrudan davetler eski şartını korur. Aday üye oylaması geçtiği anda üye olmaz; kendi kabulü ayrıca gereklidir. Ölüm, savaş, vasallık, başka federasyon ve değişen şartlar kabul sırasında yeniden denetlenir. Aynı kabul ikinci kez üyelik veya ücret üretmez.

### Duraklatılmış host yayın kusuru

Gerçek tarayıcıdaki ikinci denemede, host’un yerel federasyon düğmesi doğru yasa açtığı hâlde oyun durduğunda misafir bunu alamadı (`browser-second.log`). Host değişiklik bildirimi yalnız gün/MP komut yoluna bağlıydı. Mevcut `fedChange` başarı köprüsü host publisher’ını dirty işaretler; var olan250ms birleştirme/yayın kullanılır. Yeni snapshot motoru yoktur. Son kabul testinde host’un gerçek yasa düğmesinden sonra testin özel publish çağrısı olmadan misafir oylamayı gördü.

### #10/#5 — Hız ve savaş bildirimi

İstenen hız3, geçici karar tutması yüzünden uygulanan hız1 iken yeniden3 seçimi eski `same` kontrolünce reddediliyordu. Artık `same`, gerçek tutma nedeni yokken geçerlidir; yeniden seçim mevcut karar-tutma yolundan işlenir. Diğer neden/rate-limit/host yetkisi korunur. Bütün oyuncular aynı sonucu ve değiştirenin adını alır.

MP host `isDecision` eski `wardec/warstart` bilgilendirmelerini karar tutmasına çeviriyordu. Bu iki savaş bildirim türü MP’de hız tutmaz. SP tercihi, gerçek ağ/arka plan/oyun sonu güvenliği ve diğer bekleyen kararlar korunur. Motor önce3/2, sonra5/0; gerçek üç insan testinde tutma sonrası native hız3 seçimi ve savaş bildirimi sırasında3’te kalma ayrıca doğrulandı. Eski MP63 testinin `same` beklentisi yeni kurala uygun değişti; açık gerçek karar yine1’de tutar ve assertion korunur. Timeout artırılmadı.

### #15 — Yanlış gemiyi iptal edebilen sıra-indeksi yarışı

Önceden `shipCancel.orders` liste indeksiydi. İlk sipariş komuttan önce tamamlandığında eski indeks sonraki farklı gemiyi iptal edebiliyordu. `cancel-before.log`0/2 bunu gösterir. Host sipariş nesnesine WeakMap ile oturumluk `order:*` belirteci verir. Yalnız oyuncunun kendi kuyruğuna bu DTO eklenir. Host komutu belirteci güncel kendi siparişine yeniden bağlar; bayat, yabancı ve yinelenen belirteç reddedilir. Mevcut iptal/iade motoru korunur; yeni ücret/maliyet kuralı ve Save8 alanı yoktur. UI aynı belirteci taşır; liste güncellense bile yanlış gemiye kaymaz.

### C paketindeki küçük UI işleri

- **#23:** Mevcut kaydırılabilir tersane kuyruğu korunur;1920px/21siparişte üretim düğmesi kayması gerçek UI’da yeniden üretildi (`ui-second.log`16/1). Üretim kontrolleri kuyruğun önüne alındı; ayrı scroll alanı aynı kaldı.0/1/21 sipariş geometri, gerçek X, onay ve tek tam iade test edildi.
- **#20:** ROTA için76×44 CSSpx asgari hedef. Seçili filo şeridi aynı içerikte DOM’u sürekli yeniden yaratmıyor; ortak `surfaceRender`/etkileşim bekletme kullanılıyor. Büyüyen şeridin hız düğmesini örtmesi gerçek MP testinde yakalandı (`mp73-final` ekranı); şerit mevcut UI ölçeği dönüşümüyle harita alanına ve hız çubuğunun üstüne yerleşir. Kamera/rota/çizim matematiği değiştirilmedi.
- **#17:** Sahip etiketleri OFF iken ikonların kalması zaten doğruydu. Yeniden yazılmadı; native Canvas30/0 ve gerçek UI regresyonu.
- **#18:** Manuel renk paleti12’den24’e; eski12 renk ve AI otomatik renk algoritması değişmez. Düğmeler numara/hex etiketi taşır; kayıtlı renkler yeniden atanmaz. Tüm renk çiftleri için fiziksel renk körlüğü kabulü yapılmadı.
- **#22:** Sahipsiz sistemde yalnız temaslı, yaşayan ve canlı görülen veya oyuncunun kendi sahiplik belleğinde bilinen sınır komşusuna diplomasi kısayolu. Guest salt-okunur eylem listesine eklendi; yeni kimlik istihbaratı açılmaz.
- **#28/#29:** Devlet bilançosunda mevcut enerji0 clamp/kriz/istikrar hedefi/büyüme ve alaşım0/donanma bütçe eşiği/ödenmiş sipariş kuralları açıklanır. Yeni ekonomik ceza yoktur.
- **#32:** Mevcut insan ittifak teklif/ortak müzakere/host kabul yolu yeniden kullanıldı; yeni diplomasi motoru yok. Üç insanlı senaryoda B→C gönderim, kabulden önce ittifak olmaması ve C’nin native kabulü test edildi. Bütün ret/karşı teklif varyantları bu fazın yeni uçtan uca kabulü sayılmamalı.

## 3. Çözülmüş sayılmayan kritik gözlemler

**#25:** Kontrollü kendi güvenli sistemindeki500gemilik/53280güç filo split/merge, attrition, Save8 ve kendi mirror’da korundu. Ayrı düşük-can/radyasyon örneğinde meşru imha host ve aynada aynıydı. Kullanıcının yaklaşık100K filosunun özgün kaydı yok; neden bulunmadı, sorun AÇIK. Savaş/filo kayıp algoritması değiştirilmedi.

**#24:** Kontrollü2500korvet örneğinde enerji0 ve net−8505.634127399608 için aylık stok0’da kaldı; enerji krizi ve misafirin kaynakları host ile aynıydı. Alaşım da0alt sınırını korudu. Negatif net+0stok tek başına kusur değildir; kullanıcının özgün sapması yeniden üretilemedi. Ekonomi denge kodu değiştirilmedi. Kanıt: `beta_board1_critical_test.cjs/critical.json`.

**#26:** Konseyin mevcut karar/not kimlikleri incelendi; özgün tekrar spamı yeniden üretilemedi. Tahmini düzeltme yok, AÇIK.

**D/E ve büyük ayrı fazlar:** #19 yoğun koloni tablosu; #7 birleşik kuşatma ETA; #9/#35 kapsamlı isyan nedeni/harita; #46 bütün gezegen engelleri; #30 bölge arması; #14 yeni tam uzaktan inşa kabulü; #33 casusluk UX; #36 yeni amblem seçenekleri; #44 ölçülmüş AI vasallık oranları bu teslimde geliştirilmedi. #16/#31/#40/#43/#49 ortak WAR-CENTER; #39 ve Konsey #51 ayrı büyük işlerdir. Envanterde mevcut parçalar ve uygulanmamış beklentiler ayrıdır.

## 4. Save8, RNG, gizlilik ve performans sınırı

- Aynı gerçek p15 Save8’den seed11/23/42/99/404 için3’er ay, toplam15 ara noktada **ham Save8 baytları ve RNG birebir**; alan silme/normalize ederek PASS yok. Bu kontrollü eski oyunlar yeni kuyruk kullanmıyor. Yeni kuyruğun beklenen yeni siyasi sonuçlarının eski kodla aynı olması iddia edilmez.
- Gerçek p15 MP paketinin p16’da kabulü ve bütünlüğü bozulmuş paketin reddi doğrulandı. Eski Save8 sürümü8; isteğe bağlı kuyruk yoksa yok kalır, bozuk yeni satırlar güvenle elenir. Oturumluk sipariş belirteci stratejik RNG tüketmez, host Save8’e yazılmaz.
- π eşleme, dış başvuranın kendi kuyruğu, yabancı sipariş/ödül/karar yetkisi motor testleri; MP-P0 görünürlük/karar/rota/interpolasyon regresyonları. Misafir simülasyon çalıştırmaz.
- PERF.1/PERF.2, MP.8.6 bulutsu önbelleği, üretken isimler/doktrin zarı, korsanOFF, kapılar ve koloni otomasyonu hedefli testleri korundu. Bu faz için yeni FPS/performans yüzdesi ölçülmedi.
- Yeni500/1000sistem kampanyası veya geniş AI performans projesi başlatılmadı. Gerçek PC/Android/LAN/internet/Render **NOT RUN**.

## 5. Gerçek test komutları, sonuçlar ve kanıtlar

Bütün kanıtlar `reports/codex/evidence/beta-board1/` altındadır. Ortam: Node24.22.1, Chromium155.0.8059.79, Playwright1.62.1; tarayıcılar fiziksel cihaz değildir. Chromium koşuları sırayla, yerel relay/TLS ve ayrı tarayıcılarla yapıldı. Kontrollü dünya/temas/ekonomi fikstürü hazırlığı motor çağrısı kullanır; kabul işlemleri gerçek fare/dokunma/WS/host yoludur. `force:true`, sahte JS click, timeout artırımı veya assertion kaldırma kullanılmadı. İlk FAIL’ler silinmedi.

| Gerçek komut | Sonuç (PASS/FAIL) | Kanıt |
|---|---|---|
| `node tests/beta_board1_agenda_test.cjs` | **PASS 13/0** | [agenda-accepted-final.log](evidence/beta-board1/agenda-accepted-final.log) |
| `node tests/beta_board1_critical_test.cjs` | **PASS 5/0** | [reg-beta_board1_critical_test.cjs.log](evidence/beta-board1/reg-beta_board1_critical_test.cjs.log) |
| `node tests/beta_board1_cancel_test.cjs` | **PASS 2/0** | [reg-beta_board1_cancel_test.cjs.log](evidence/beta-board1/reg-beta_board1_cancel_test.cjs.log) |
| `node tests/beta_board1_equivalence.cjs` | **PASS 6/0** | [reg-beta_board1_equivalence.cjs.log](evidence/beta-board1/reg-beta_board1_equivalence.cjs.log) |
| `node tests/mp_p0_guest_test.cjs` | **PASS 7/0** | [reg-mp_p0_guest_test.cjs.log](evidence/beta-board1/reg-mp_p0_guest_test.cjs.log) |
| `node tests/mp_p0_decisions_test.cjs` | **PASS 7/0** | [reg-mp_p0_decisions_test.cjs.log](evidence/beta-board1/reg-mp_p0_decisions_test.cjs.log) |
| `node tests/mp_p0_motion_test.cjs` | **PASS 3/0** | [reg-mp_p0_motion_test.cjs.log](evidence/beta-board1/reg-mp_p0_motion_test.cjs.log) |
| `node tests/mp_p0_notice_test.cjs` | **PASS 3/0** | [reg-mp_p0_notice_test.cjs.log](evidence/beta-board1/reg-mp_p0_notice_test.cjs.log) |
| `node tests/mp_p0_boot_test.cjs` | **PASS 1/0** | [reg-mp_p0_boot_test.cjs.log](evidence/beta-board1/reg-mp_p0_boot_test.cjs.log) |
| `node tests/mp_p0_cold_notice_test.cjs` | **PASS 1/0** | [reg-mp_p0_cold_notice_test.cjs.log](evidence/beta-board1/reg-mp_p0_cold_notice_test.cjs.log) |
| `node tests/perf1_equivalence_test.js` | **PASS 4/0** | [reg-perf1_equivalence_test.js.log](evidence/beta-board1/reg-perf1_equivalence_test.js.log) |
| `node tests/perf2_equivalence_test.js` | **PASS 5/0** | [reg-perf2_equivalence_test.js.log](evidence/beta-board1/reg-perf2_equivalence_test.js.log) |
| `node tests/mp86_nebula_cache_test.js` | **PASS 3/0** | [reg-mp86_nebula_cache_test.js.log](evidence/beta-board1/reg-mp86_nebula_cache_test.js.log) |
| `node tests/mp61_core_test.js` | **PASS 9/0** | [reg-mp61_core_test.js.log](evidence/beta-board1/reg-mp61_core_test.js.log) |
| `node tests/mp63_pause_test.js` | **PASS 7/0** | [reg-mp63_pause_test.js.log](evidence/beta-board1/reg-mp63_pause_test.js.log) |
| `node tests/mp64_ops_test.js` | **PASS 5/0** | [reg-mp64_ops_test.js.log](evidence/beta-board1/reg-mp64_ops_test.js.log) |
| `node tests/mp73_council_test.js` | **PASS 14/0** | [reg-mp73_council_test.js.log](evidence/beta-board1/reg-mp73_council_test.js.log) |
| `node tests/mp74_notice_test.js` | **PASS 6/0** | [reg-mp74_notice_test.js.log](evidence/beta-board1/reg-mp74_notice_test.js.log) |
| `node tests/mp75_war_test.js` | **FAIL 3/1** | [reg-mp75_war_test.js.log](evidence/beta-board1/reg-mp75_war_test.js.log) |
| `node tests/mp4_core_test.js` | **PASS 14/0** | [reg-mp4_core_test.js.log](evidence/beta-board1/reg-mp4_core_test.js.log) |
| `node tests/mp3_core_test.js` | **PASS 11/0** | [reg-mp3_core_test.js.log](evidence/beta-board1/reg-mp3_core_test.js.log) |
| `node tests/beta_fed_found0_core_test.js` | **PASS 10/0** | [reg-beta_fed_found0_core_test.js.log](evidence/beta-board1/reg-beta_fed_found0_core_test.js.log) |
| `node tests/beta_fed_found0_mp_test.js` | **PASS 11/0** | [reg-beta_fed_found0_mp_test.js.log](evidence/beta-board1/reg-beta_fed_found0_mp_test.js.log) |
| `node tests/beta_fed_found0_events_test.js` | **PASS 11/0** | [reg-beta_fed_found0_events_test.js.log](evidence/beta-board1/reg-beta_fed_found0_events_test.js.log) |
| `node tests/beta_war_fix0_test.cjs` | **PASS 17/0** | [reg-beta_war_fix0_test.cjs.log](evidence/beta-board1/reg-beta_war_fix0_test.cjs.log) |
| `node tests/beta_p01_embargo_test.js` | **PASS 5/0** | [reg-beta_p01_embargo_test.js.log](evidence/beta-board1/reg-beta_p01_embargo_test.js.log) |
| `node tests/beta_p02_news_test.js` | **PASS 8/0** | [reg-beta_p02_news_test.js.log](evidence/beta-board1/reg-beta_p02_news_test.js.log) |
| `node tests/faz93a1_production_panels_test.js` | **PASS 21/0** | [reg-faz93a1_production_panels_test.js.log](evidence/beta-board1/reg-faz93a1_production_panels_test.js.log) |
| `node tests/faz91d_1_fleet_names_native_canvas_test.js` | **PASS 30/0** | [reg-faz91d_1_fleet_names_native_canvas_test.js.log](evidence/beta-board1/reg-faz91d_1_fleet_names_native_canvas_test.js.log) |
| `node tests/beta_setup0_pirates_test.cjs` | **PASS 10/0** | [reg-beta_setup0_pirates_test.cjs.log](evidence/beta-board1/reg-beta_setup0_pirates_test.cjs.log) |
| `node tests/beta_setup1_gates_test.cjs` | **PASS 12/0** | [reg-beta_setup1_gates_test.cjs.log](evidence/beta-board1/reg-beta_setup1_gates_test.cjs.log) |
| `node tests/beta_ux0_names_test.cjs` | **PASS 9/0** | [reg-beta_ux0_names_test.cjs.log](evidence/beta-board1/reg-beta_ux0_names_test.cjs.log) |
| `node tests/beta_scale0_colony_test.cjs` | **PASS 12/0** | [reg-beta_scale0_colony_test.cjs.log](evidence/beta-board1/reg-beta_scale0_colony_test.cjs.log) |
| `node tests/mp6_mirror_test.js` | **PASS 8/0** | [mirror-final.log](evidence/beta-board1/mirror-final.log) |

`node-regressions.json` ilk33paketin gerçek exit/sürelerini içerir; son gündem13/0 ayrı genişletilmiş testtir. Yukarıdaki ayna8/0 izinli yerel TCP ile çalıştırıldı; ilk sandbox EPERM ayrı dosyada kalır. Her komutta `STARS_OUTPUT` ilgili kanıt alt dizinine, eşdeğerlikte `STARS_CONTROL_ROOT=/tmp/stars-board1-control` gerçek p15 köküne verildi.

| Gerçek Chromium komutu | Sonuç | Kanıt |
|---|---|---|
| `FEDFOUND0=1 FEDFOUND0_THREE=1 MPP0=1 BOARD1=1 node tests/browser-mp73.cjs` | **FAIL 10/2** | [mp73-final.log](evidence/beta-board1/mp73-final.log) |
| `BOARD1=1 MPP0=1 MP73_ONLY='A1 &#124;B1 &#124;P0 &#124;BD1 &#124;sayfa' node tests/browser-mp73.cjs` | **PASS 5/0** | [mp73-accepted.log](evidence/beta-board1/mp73-accepted.log) |
| `BOARD1_R=1 MPP0_R=1 MP89_R_STATE=1 MP8_SCEN=R MP8_MONTHS=6 node tests/browser-mp8.cjs` | **PASS 5/0** | [mp8-R-final.log](evidence/beta-board1/mp8-R-final.log) |
| `MP8_SCEN=N node tests/browser-mp8.cjs` | **PASS 9/0** | [mp8-N.log](evidence/beta-board1/mp8-N.log) |
| `node tests/browser-beta-board1-ui.cjs` | **PASS 17/0** | [ui-final.log](evidence/beta-board1/ui-final.log) |
| `node tests/browser-mp74.cjs` | **PASS 7/0** | [mp74-final.log](evidence/beta-board1/mp74-final.log) |
| `node tests/browser-mp75.cjs` | **PASS 6/0** | [mp75-final.log](evidence/beta-board1/mp75-final.log) |
| `BOARD1=1 MPP0_DESKTOP=1 MP73_ONLY='A1 &#124;B1 &#124;BD1 &#124;sayfa' node tests/browser-mp73.cjs` | **FAIL 3/1** | [mp73-desktop.log](evidence/beta-board1/mp73-desktop.log) |
| `BOARD1=1 MPP0_DESKTOP=1 MP73_ONLY='A1 &#124;B1 &#124;BD1 &#124;sayfa' node tests/browser-mp73.cjs` | **PASS 4/0** | [mp73-desktop-final.log](evidence/beta-board1/mp73-desktop-final.log) |

Bütün Chromium komutlarında `STARS_CHROMIUM_PATH=/usr/bin/chromium` ve `STARS_OUTPUT=reports/codex/evidence/beta-board1/<koşu-adı>` kullanıldı. Son ek koşuların tam ortam/komut/exit/süreleri `final-browser-results.json`; her tarayıcı sonucu kendi JSON ve PNG dizininde. MP73 ilk tam10/2, sonra hedef5/0 olarak ayrı tutulur; ilk FAIL’in geçmişi yeni PASS ile silinmez.

R-final:3insan+5AI, seed11,45sistem;6ay→gerçek IndexedDB→üç tarayıcı ve relay kapanışı→yeni relay/oda/aynı devletler→bekleyen teklif bir kez kabul/ikinci kabul `rules:closed`→kuyruk devamı→6ay daha. `resume-records.json` tam teklif/federasyon/savaş/vasallık kayıtları eşit; `board1-cold-queue.json` aynı aktif oy+2bekleyen, `board1-cold-results.json` tek yasa ücreti60 ve bitmiş savaşın gerekçeli kapanışı.10 senkron örneğinde ayna rev/hash eşit; leak/diff yok. Kişisel event ödülü200araştırma ilgili misafire bir kez (`cold-personal-decisions.json`, `personal-dom-preserved.json`).

N:5/30s kesinti, başlangıç/teklif/komut sonrası/sessiz soket, çift sekme, host ve relay kopması. Gerçek yerel hatlar/TLS kullanıldı; internet/LAN kabulü değildir. UI-final:800×360/960×540/915×412 dokunmatik ve1920×1080 fare; PC%80/%100/%125 hedef geometrisi. MP masaüstü:aynı queue/admission/alliance/speed akışına ek gerçek katılımcı21sipariş veX/iade. Kanıtlar `mp73-desktop-final/board1-ui.json`, `board1-guest-yard.png`.

Ekran örnekleri: [iki bekleyen öneri](evidence/beta-board1/mp73-accepted/board1-two-queued.png), [adayın ayrı rızası](evidence/beta-board1/mp73-accepted/board1-candidate-consent.png), [mobil ROTA](evidence/beta-board1/ui-final/915x412-route.png), [katılımcı tersanesi](evidence/beta-board1/mp73-desktop-final/board1-guest-yard.png). Bu fazda2560/3440 ayrı UI kampanyası, tam MP3/4 tarayıcı kampanyaları ve120ay siyasi kampanya yeniden çalıştırılmadı (**NOT RUN**); ilgili motor testleri, mevcut MP8R ve hedefli üç insan kabulü kullanıldı.


### Önceki FAIL ve yeni FAIL ayrımı

- MP75 Node3/1, özel wild devlet adı/temas assertion’ı, p15’te de açık aynı FAIL. Bu fazda PASS yapılmadı. p15 raporu `MP-P0-KURTARMA-SONUC.md` ve `evidence/mp-p0/mp75-war-control.log` kontrol kanıtıdır.
- `browser-first` yanlış test sekme sırası; `browser-third` kapalı details içindeki hedefe erişim. Test helper gerçek tab/summary dokunmasıyla düzeltildi. `browser-second` ürünün paused-host yayın kusuruydu ve ürün düzeltildi.
- `ui-first` gerçek seltag DOM değişimi ile yanlış test globalPane erişimini içerir. `ui-second` masaüstü kuyruk düğmesi kayması ürün kusurudur. Tüm kayıtlar korunur.
- `mp73-final`10/2: yeni salt-okunur borderDiplo guest listesinde unutulmuştu ve ROTA şeridi hız düğmesini örtüyordu; iki ürün bağlantısı düzeltildi. `mp73-targeted`4/1: Canvas noktasını filo seçimi sonrası açılan şeridin kaplaması; test her gerçek dokunmadan önce mevcut Canvas hedefini yeniden bulur ve assertion’ı korur. Bu, UI katmanının üstünden sahte tıklama değildir.
- İlk `mp8-R`3/2: hazırlıkta temassız AI hedefi motor tarafından reddedildi, R4 eksik hazırlıkla zincirleme hata verdi. `mp8-R-accepted`3/2: tam siyasi kayıt karşılaştırması R3’te savaş defteri `next`, cephe sayısı ve üyelik geçmişi farkını yakaladı. Alan bazlı fark `mp8-R-accepted/R/resume-fields-diff.json` içinde; yeni test hazırlığı doğrudan savaş bayrağı ve federasyon üyeliği değiştirmiş, mevcut `warLedgerSync` işlemini çalıştırmamıştı. Fikstürün hazırlığına bu kanonik işlem eklendi; kayıt sonrası alan eşitliği assertion’ı veya serializer değiştirilmedi. Her iki FAIL saklanır.
- `mp73-desktop`3/1:21gerçek misafir siparişi, doğru iptal ve iade kontrolleri geçti; sonra testin kartı bulunmayan `decPending` kimliği mevcut `reconcile` tarafından silindiği için1× bekleme kurulamadı. Ürün bekleme kuralı değiştirilmedi. Son kabul hazırlığı gerçek bekleyen event kartını `UI.notify` yoluyla oluşturup gerçek UID’nin pause kaydında bulunduğunu doğrular; aynı hız düğmesine native tıklama assertion’ları korunur.
- `mirror-sandbox.log`: yerel TCP dinleyicisi `listen EPERM`, sandbox kaynaklı başlayamama. Aynı test izinli yerel yürütmede8/0; ürün FAIL diye gizlenmez, ortam başlangıç engeli olarak ayrılır.
- `agenda-fraction-before`12/1: yukarıda açıklanan yeni kuyruk yükleme doğrulama kusuru düzeltildi; başarısız test saklanır.

## 6. Dosyalar, paket ve dağıtım

Motor/UI: `diplomacy.js`, `ai.js`, `main.js`, `ui.js`, `inbox.js`, `index.html`, `sw.js`; manifest. MP: `research/mp0/mp-core.js`, `research/mp1/client/mp1-host.js`, `research/mp1/client/view.js`, `research/mp1/server/relay.js`, `research/mp6/mirror.js`, `research/mp6/client/guest-stars.js`. Testler: yeni board1 çekirdek/iptal/hız-eşdeğerlik/gerçek UI helper’ları, MP73/MP8 isteğe bağlı kabul yolları, MP63/64 güncel sözleşme, ortak koruma zinciri. `map.js`, ekonomi ve savaş motorları değiştirilmedi.

- Oyun ZIP’i: [`releases/stars-faz96h10p16.zip`](../../releases/stars-faz96h10p16.zip), **801627 bayt**.
- SHA-256: `d74abd9d4ab3119e54c84e12dfedb75dd77c91dcb333d06e9c1856429f906604`.
- ZIP CRC32: `679C012A`; bütün20 üyenin CRC kontrolü PASS.
- `python tools/package-release.py` ve `python tools/package-release.py --out /tmp/stars-faz96h10p16-second.zip`: iki üretim bayt düzeyinde aynı. `python tools/verify-release.py`:19 runtime hash/build/PWA PASS.
- Kanıtlar: `package-first.json`, `package-second.json`, [release-verification.json](evidence/beta-board1/release-verification.json). Son dosyada manifestteki19 runtime ve değişen MP dosyalarının eski/yeni SHA-256 karşılaştırması, paket içi20 dosyanın SHA-256/CRC32 değerleri bulunur.


Oyun ZIP’i yalnız19 runtime+manifesttir; MP relay/istemci kaynaklarını içermez. MPb11 kaynakları GitHub dalında ayrıca teslim edilir. Yeni dosya URL/allowlist yolu eklenmedi; mevcut Docker dağıtım yolları korunur. Docker deployment/Render test edilmedi. Kullanıcı kayıtları veya eski paketler silinmedi.

## 7. GitHub ve görev durumları

Issue #33 okuma ve başlangıç yazma **Forbidden** verdi; gerçek hata `issue-read.log`, `issue-start.log` ve gönderilmek istenen metin yanındadır. Pano sayısı/durumları uzaktan doğrulanamadı; panonun güncellendiği iddia edilmez. Yerel envanter, GitHub panosunun yerine geçirilmedi ve geçmiş topluca yeniden yazılmadı.

Teslim edilen/testli alt işlere önerilen aşama **KULLANICI ONAYI BEKLİYOR**; gerçek kullanıcı onayı olmadan TAMAMLANDI yok. Özgün #24/#25/#26 AÇIK; yapılmayan işler PLANLANDI/AÇIK kalır. p15 geliştirmeleri bu fazın yeni geliştirme sayısına eklenmez.

Kod/test/paket commit’i: [`48dcc2bd84d9df5caf0d8798e7ca6907ab63fb3a`](https://github.com/sarsiss12-dot/Star/commit/48dcc2bd84d9df5caf0d8798e7ca6907ab63fb3a). `git push -u origin codex/stars-beta-board1-federation-stability-ux` başarılı; uzak `git ls-remote` aynı SHA’yı doğruladı (`code-push.log`, `code-remote-head.txt`). Teslim öncesi taban ve main tekrar doğrulandı, değişmedi (`pre-delivery-heads.txt`).

PR yalnız **bir kez** taslak olarak, taban `codex/stars-mp-p0-guest-playability` ile denendi: **`Post "https://api.github.com/graphql": Forbidden`**, exit1. PR oluşturulmadı; [doğru compare bağlantısı](https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp-p0-guest-playability...codex/stars-beta-board1-federation-stability-ux?expand=1). Kanıt: `pr-create.log`, `pr-create-result.json`. Git push başarısı ile API yazma engeli ayrı durumlardır; yetki/ağ ayarı değiştirilmedi.

Rapor, görev envanteri, CLAUDE notu ve tüm kanıtlar ikinci teslim commit’inde gönderilir. Bu raporun içindeki kod HEAD’i yukarıdaki doğrulanmış commit’tir; son rapor HEAD’i uzak dal ve nihai sohbet teslimiyle doğrulanır. Issue #33’ün gerçek güncel görev durumları **OKUNAMADI/YAZILAMADI**; yerel öneriler panoya uygulanmış değildir. `issue-final-body.md` yalnız gönderilemeyen kabul/durum metnidir, yayımlanmış yorum değildir. Main merge/rebase/force-push, Render/deploy/restart veya kullanıcı kaydı silme yapılmadı.


## 8. Kullanıcının gerçek PC/Android kabulü ve sonraki tek hedef

1. İki/üç insan kurulu federasyonda yasa açıkken farklı yasa+savaş yardımını sırala; sırayı, kendi geri çekmesini ve ilk oydan sonra açılışı dene. Savaş bitmişse gerekçeli geçersiz kapanış; yeni aday için üyelerin oyu sonrası adayın ayrı kabulü gerekir.
2. Aynı durumda kaydet, tarayıcı/odayı kapat, yeni odadan eski devletlere dön. Aktif oy ve sıra aynı kalmalı, ücret/üyelik iki kez uygulanmamalı. Geçersiz istekte görünen gerekçeyi kaydet.
3. Üç oyuncuyla hız, açık karar sonrası aynı istenen hızı tekrar seçme, savaş bildirimi; başka kullanıcının adı ve ortak hız tutarlı mı? Gerçek ağ kesintisi güvenlik duraklaması ayrı değerlendirilir.
4. Mobil yatay ve PC’de21gemi kuyruğu; düğmeler yerinde mi, gerçek X doğru gemiyi bir kez iptal ediyor mu? ROTA şeridi hız düğmelerini örtmemeli;%80/%100/%125 PC ölçeğinde görsel/tıklanabilir hedefler eşleşmeli.
5. İnsan ittifakı, bilinen sınır diplomasisi, sahip etiketleriOFF,24renk ve enerji/alaşım açıklamaları. Büyük filo/enerji sapması yeniden olursa kullanıcı Save8’i ve oyun günü/filoID/host-misafir ekranlarını sakla; bu iki özgün vaka hâlâ çözülmüş değildir.

**Sonraki tek öncelik:** p16 gerçek PC host/katılımcı kabulü ve varsa aynı kayıt üzerinden kritik hata düzeltmesi. Bu kabulden önce yeni büyük WAR-CENTER/koloni/casusluk mekaniklerine başlanmamalı.
