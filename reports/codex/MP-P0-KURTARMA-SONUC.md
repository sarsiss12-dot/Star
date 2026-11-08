# STARS — MP-P0 KURTARMA sonuç raporu

## 1. Teslim özeti ve kanonik kaynak

**Yerel geliştirici doğrulaması tamamlandı; gerçek PC multiplayer kullanıcı kabulü bekleniyor. Hiçbir görev TAMAMLANDI yapılmadı.** Misafir gözlem verileri, kişisel olayların host yetkili çözümü, görülen filo gövdesi, rota/ara hareket ve bildirim kararlılığı aynı geliştirme dalında ele alındı. Yeni oyun mekaniği, savaş/diplomasi reformu veya AI kampanyası geliştirilmedi.

- Depo: `sarsiss12-dot/Star`.
- Başlangıç: `bf26491828ceb65f9103ecb2def23fe832a3c454`, `codex/stars-beta-fed-found0-founder-invites-events`.
- Başlangıç kod commit’i `618df01768394c7c262e89dc0de979fdb0564bcb`; rapor HEAD’i bf264918 kaynak alınarak eski main’den başlanmadı.
- Doğrulanmış bitiş kod/paket commit’i: **466946186f80b09c6d7e126a13ecce48574ef95a**. [Commit](https://github.com/sarsiss12-dot/Star/commit/466946186f80b09c6d7e126a13ecce48574ef95a).
- Geliştirme dalı: `codex/stars-mp-p0-guest-playability`; PR tabanı yukarıdaki federasyon dalıdır.
- `main`: `4296ad2d43fedce6264020b3761f50f1839fd836`; değişmedi. Kaynak federasyon dalı bf264918 olarak kaldı. [Uzak doğrulama](evidence/mp-p0/source-remote-heads-code.txt).
- p14 ZIP doğrulaması: SHA-256 `205eeba47747716a32e794ad633e21a9285c295b3648d1e53cf703acf15eae0e`.
- Teslim: oyun **96h10p15**, PWA **stars-v96h10p15**, MP **MP.8.9b10**. Save8 **v8**, MP kayıt paketi **4**, protokol **1**.

Bu rapor, önceki doğrulanmış kod commit’ine referans verir. Rapor/kanıt commit’i kendi SHA’sını içeremez; nihai uzak HEAD son sohbet tesliminde ayrıca doğrulanır. Sonradan kod değişikliği yapılıp testler eski kaynakta kalmadı; son kaynak değişikliklerinden sonra boot, cold bildirim, çok kartlı UI, R0–R4 ve hafif koruma kontrolleri tamamlandı.

Ortam: Node24.22.1, Chromium155.0.8059.79, Playwright1.62.1. Ayrı Chromium süreçleri, yerel üretim relay’i ve yerel TLS/kesilebilir ağ vekilleri kullanıldı. Gerçek internet sunucusuna bağlanılmadı. Fiziksel kullanıcı oturumunun Save8/trace dosyası bulunmadığından o oturumdaki her gözlemin birebir sebebi iddia edilmiyor. Aşağıdaki nedenler kaynak ve kontrollü önce/sonra deneyleriyle doğrulandı.

## 2. Ortak kök nedenler ve düzeltmeler

| Alan | Eski davranış / kanıtlanan neden | Uygulanan sınırları belli düzeltme | Yerel sonuç |
|---|---|---|---|
| P0-A devlet/sınır bilgisi | Ayna yerel oyuncunun birleşik görünürlük bağlamını yeniden kurmuyordu; görüşten çıkan sistem sahibine ilişkin kendi gözlem belleği korunmuyordu. | Ortak `humanVisionContext` + `humanMapKnowledge`; güncel görünür sistem ve önceki **kendi** sahiplik gözlemi ayrılır. `π` yalnız devlet kimliklerine uygulanır. | PASS; bilinmeyen devlet kabuğu ve stoklar gizli. |
| P0-B müttefik sensörleri | `explorationContext` tek başına doğrudan sağlayıcının canlı sensör alanını aynaya katmıyordu; istemci yerel updateVision bunu tekrar daraltıyordu. | Aktif doğrudan `visionFrom/shareVis` sağlayıcısının **nativeSensorVision** alanı eklenir. Sağlayıcının başka müttefikten aldığı görüş aktarılmaz. DTO’nun `mpVisible` alanı deserialize sonrası geri kurulur. | PASS; tek yönlü, paylaşımın bitmesi, keşfin korunması ve transitif sızıntı engeli test edildi. |
| P0-C askerî can | Görülen yabancı gemiler yalnız `{c}` alıyordu; `h` kaybı yüzünden gerçek hasar bilinmiyordu. Yabancı filo için normal seçilebilir salt okunur görünüm yoktu. Kendi gemisi DTO’su zaten tamdı; bütün eski kendi-can gözlemleri için tek sebep kanıtlanmadı. | Yalnız sınıf ve sonlu 0–1 gövde oranı; görülen yabancı filoya salt okunur panel. Kendi gemisinde mevcut/maksimum gövde daha açık yazılır. | PASS; yabancı %42, kendi %55 hasar gerçek tarayıcıda doğrulandı. |
| P0-D event/anomaly/chain | Üretim/tetikleme `G.p` oyuncusuna bağlıydı; bilim taraması yalnız id0’a UI çağırıyor, misafir typed kararın host komutu bulunmuyordu. Callback’lerde bazı id0/global G referansları vardı. | Devlete ait sınırlı kalıcı karar deposu; gerçek tarayıcıdan `eventChoice`; host sahiplik, durum ve seçenek doğrulaması; aynı authored callback’i açık oyuncu bağlamıyla çalıştırma. | PASS; B/C ayrı ödüller, host ekonomisi değişmez, tekrar/izinsiz karar reddi ve kayıt/devam doğrulandı. |
| P0-E uygun gezegen işareti | Misafirin kendi `mapHabitats` bilgisi üretilmiyor/güncellenmiyordu. Ayrıca ilk `deserialize`, gate kurulmadan yerel gözlem hesabıyla gerçek mask0’ı mask1’e çevirebiliyordu. | Taranmış ve izinli sistemde gerçek `canColonize` + yaşanabilirlik kontrolü; gözlem maskesi korunur. İlk yüklemede ve sonraki updateVision’da yetkili gözlem geri yüklenir. | PASS; gizli/taranmamış gezegen açılmıyor; yabancı sahipli sistem ilk yüklemede yanlış uygun gösterilmiyor. |
| P0-F rota | Her hydrate yeni filo nesnesi yaratır. p14 zaten id ile geri bağlamayı kısmen deniyordu; kullanıcının özgün rota kaybı birebir üretilemedi. | Seçim her yeniden kurulumda güncel filo id’sine bağlanır; kendi rota başlangıcı çizim noktasını kullanır, yabancı rota açılmaz. | Dört rolün gerçek ROTA/Canvas etkileşimi PASS; özgün oturum kökü kesinleşmiş sayılmıyor. |
| P0-G basamaklı hareket | İstemci yalnız periyodik aynadaki konumları çiziyordu; snapshot arası görsel ara değer yoktu. | Yalnız alınmış iki konum arasında istemci ara çizimi; yeni dünya snapshot’ı/RNG/simülasyon adımı yok. | PASS; 30 rAF örneğinde snapshot arası değişen çizim konumu, sabit kanonik koordinat kanıtlandı. FPS iddiası yok. |
| #2 tekrar/stale kart | Her deserialize yeni dünya/yerel inbox oluşturuyordu; kuruldu sonucu tekrar üretiliyordu. Eski `uid` ile yeniden oluşan inbox kayıt kimliği farklılaşabiliyordu. Terminal davet/oy kartı kalabiliyordu. | Sonuç tekilleştirme belleği; misafirde saveId+gerçek devlet kapsamlı cihaz tercihi; ilk hydrate öncesi yükleme; tam anahtar fallback; terminal durum/token kontrolü. | PASS; üç aynada0 tekrar; soğuk yeniden yüklemede0 sonuç popup; aynı yeni olay kaybolmaz. |
| Canlı kart dokunması | Kişisel olay ve diplomatik kart sırası hydrate sırasında değişiyor, tüm inbox innerHTML yenilenip hedef kopabiliyordu. Çok kartta seçenek alanı10px’e küçülüp alttaki karta dokunuluyordu. | Mevcut `surfaceRender` ile anahtarlı DOM uzlaştırma ve dokunma/scroll koruması, eski kart sırası/uid korunması; kart/quick/options için `flex-shrink:0`. | PASS; aynı DOM nesnesi korunur. Seçenek alanı172px, gerçek düğme55px; hit-test `noteChoice 1:0`, gerçek ödül+260. |

[İlk beş kusurun p14 FAIL kanıtı](evidence/mp-p0/before-valid.log): **0/5**. [Hareket öncesi](evidence/mp-p0/motion-before.log): **0/3**. Son kaynakta hedefli görünürlük7/0, karar7/0, hareket3/0, bildirim3/0. [Boot önce](evidence/mp-p0/boot-before.log) / [sonra](evidence/mp-p0/boot-after.log); [soğuk bildirim önce](evidence/mp-p0/cold-notice-before.log) / [sonra](evidence/mp-p0/cold-notice-after.log); [çok kart önce](evidence/mp-p0/layout-before/multi-card-hit.json) / [sonra](evidence/mp-p0/layout-after/multi-card-hit.json).

## 3. Görünürlük ve bilgi güvenliği

`unknown/known/surveyed/visible/contacted` aynı anlama getirilmedi. Canlı sensör `mpVisible`, keşif `seen`, ayrıntılı gezegen erişimi `surv`, devlet adı/renk tanıma `contact`, önceki sahiplik `mapOwners` olarak ayrılır. Güncel görünmeyen sistem sahibi uzaktan gerçek değerle güncellenmez. Kendi gözlem belleği yalnız kendi devlete aittir. Harita işareti uygun gezegen yoksa veya sistem hakkı izin vermiyorsa olumlu olmaz; birden çok gezegen maske hesabında değerlendirilir.

Yabancı devlet DTO’suna özel kaynak, araştırma, casusluk, diplomatik kişisel karar veya tüm filo nesnesi eklenmedi. Yabancı gemide maksimum gövde/kalkan yükseltmesini tahmin ederek kesin bilgi yazılmıyor. Mevcut motorda ayrıca tüketilen anlık gemi kalkan havuzu yok; kendi panelindeki kalkan değeri **tasarım kapasitesi** olarak etiketlenir. Yabancı panel gerçek gözlenebilir gövde oranını gösterir.

Yabancı hareket yalnız iki uç da canlı görünürse `{from,to,t}` ve mevcut koordinatla aktarılır; `path=[]`, `ord=null`. Bir uç gizliyse mevcut kaba gözlem davranışı korunur. Gelecekteki emir/rota ve gizli varış açılmaz. `tests/mp6_mirror_test.js` artık bu dar whitelist’i ve iki uç görünürlük şartını doğrular; bütün yabancı hareketi körlemesine null bekleyen eski assertion, daha sıkı alan/mahremiyet assertion’larıyla güncellendi.

## 4. Host, B ve C karşılaştırması

| Kontrol | Host insan0 | B insan1 (yerelde π ile0) | C insan2 (yerelde π ile0) |
|---|---|---|---|
| Otorite | Tek simülasyon ve komut uygulayıcı | Yerel ödül/simülasyon yok | Yerel ödül/simülasyon yok |
| Kişisel olay | Mevcut SP/host kanonik yol | Kendi anomali/event/chain görünür | Kendi ayrı anomalisi görünür |
| Karar etkisi | B/C kararında host kaynakları aynı | Event −150min/+260ara; gerçek bilim taramasının anomali seçimi+130ara; chain kendi kuyruğuna | Kontrollü a1 seçimi+180ara, B kaynakları aynı |
| Özel veri | Kanonik dünyayı tutar | C’nin decisions alanı aktarılmaz | B’nin decisions alanı aktarılmaz |
| Yeniden karar | Host tekrar/stale durumu reddeder | Aynı karar ikinci komutu rejected | Kendi sahipliği dışında karar reddedilir |
| Ayna / kayıt devam | Son kanonik gönderim | Host’un B aynasıyla rev+SHA eşit, leak=[] | Host’un C aynasıyla rev+SHA eşit, leak=[] |

Ana üç insan testi Konsey/federasyon önceki kabulünü de içerir. İkinci odada gerçek Chromium host/guest süreçleri ters kullanıldı (`MPP0_REVERSE=1`); motorun kanonik host id0 sözleşmesi değişmedi. Misafirin federasyon başlatması mevcut FD3 senaryosunda ayrıca korundu. “Roller ters” fiziksel iki bilgisayarda denenmiş anlamına gelmez.

## 5. Olay kararı ve kayıt yaşam döngüsü

- Kayıt yalnız kullanıldığında `empire.decisions={v:1,next,pending,queue,seen,...}` ekler. Mevcut Save8’in genişletilebilir devlet verisi kullanılır; v8/paket4/protokol1 korunur. Host komut kataloğuna dar `eventChoice` eklenmiştir; p15/MPb10 istemci ve relay kaynakları birlikte kullanılmalıdır.
- Olay id’si **kendi devlet deposu** içinde anlamlıdır. Host komutu gerçek oturumun devletine uygular; başka bir oyuncunun sayısal id’sini göndermek yetki vermez.
- Callback çağrısında global `G.p` değiştirilmez. Açık actor façade’sı `p=e` okumasını sağlar, global oyuncu yazımı yasaktır; katalogdaki id0/global varsayımları bu dar yolda actor’a bağlandı.
- Normal pencere ve kart hızlı seçim aynı authored uygulamayı kullanır. State pending→resolving→resolved; katalog/seçenek/ölü devlet/oyun sonu kontrolü; hata halinde mevcut işlem geri alma yolu. İkinci uygulama reddedilir.
- Bekleyen karar64, terminal geçmiş64, yüklemede sınırlı doğrulanan kayıt128, devam kuyruğu64 ile sınırlandırılır. Yeniden bağlanma ACK kilidini mevcut bağlantı kuşağıyla temizler; geç aynanın bitmiş kartı geri koyması geçici resolved-id filtresiyle engellenir.
- Remote random olay üretimi ayrı seed+devlet+ay deterministik üretim akışıdır; yalnız üretme/görüntüleme stratejik RNG çekmez. Gerçek karar, mevcut callback’in meşru RNG/ekonomi etkisini bir kez uygular. Bu yeni kullanılabilir misafir kararlarının sonuç üretmesi kasıtlıdır; remote etkin bir oyunun tüm Save8 baytlarının eski hatalı sürümle aynı kalacağı iddia edilmez.
- Eski p14’te yanlış oyuncuya gidip sahipliği kaydedilmeyen veya kaybolan olaylar güvenle başka oyuncuya atanamaz; tahmini ödül geri dağıtımı yoktur. Geçerli yeni pending kararlar ve zincir aşamaları kayıtta korunur.
- Genel gizlenmiş kart tercihlerinin her kayıtta kalıcı olması bu fazda çözülmedi. Mevcut kaydırma kararı çözmez; bekleyen karar durum listesinden erişilir. Cihaz sonuç cache’i bozuk/erişilemezse oturum içi güvenli tekilleştirme sürer; yeni sayfada tarihsel bilgilendirme bir kez tekrar görünebilir, ödül tekrar uygulanmaz.

## 6. Rota ve akıcı çizim

`View.fleetPoint` varsayılan SP’de aynı kanonik x/y’yi döndürür. Katılımcı çizimi ve hit-test aynı görsel noktayı kullanır. Ara hareket yalnız alınmış iki nokta arasında; süre100–3000ms, 3500ms’den eski veri en son kanonik noktada tutulur. Rota bacağı değişince, savaşta, varış/durma/kaldırılma, tam resync, kopma veya host durması/hız0 durumunda görsel hafıza sıfırlanır. İleri tahmin, yeni yol hesabı veya simülasyon tarihi değişikliği yapılmaz.

Gerçek ROTA düğmesi ve Canvas tıklaması askerî, bilim, koloni, inşaat gemisi için uygulandı; host’ta gerçek path, misafirde güncel nesne referansı ve rota ekran görüntüsü denetlendi. Başlangıçta inşaat gemisi olmayan kontrollü fikstüre üretim fonksiyonu ile gemi eklendi; bu bir **rota** testidir, gemi üretim ekonomisi kabul testi diye sunulmaz. Canvas’ın mevcut çift dokunmayla sistem açma hareketi korunur; filo yığınında ardışık tek seçimler350ms arayla yapılır.

[Gerçek masaüstü inşaat rotası](evidence/mp-p0/desktop-stable/p0-route-insaat.png), [tüm dört rol ve30rAF verisi](evidence/mp-p0/desktop-stable/p0-guest.json), [gerçek Canvas hedefleri](evidence/mp-p0/desktop-stable/p0-canvas-picks.json). Otuz örnek bir interpolasyon doğrulamasıdır; FPS/akıcı gerçek cihaz performans yüzdesi değildir. Yeni uzun performans kampanyası yapılmadı.

## 7. Gerçek tarayıcı testleri

Tüm Chromium koşuları **sırayla** yürütüldü. Yerel TLS ve ayrı kalıcı Chromium profilleri kullanıldı. Etkileşimlerde native mouse/touch/Canvas; `force:true`, karar için JS click, timeout yükseltme veya assertion kaldırma kullanılmadı. Test hazırlığında kontrollü dünya/veri oluşturma ve görünüm kapatma bulunur; kabul/karar/rota etkileşimleri gerçek girdidir. Test süreci kapanışı ile kullanıcı fiziksel cihaz kabulü ayrıdır.

Ortak ortam: `STARS_CHROMIUM_PATH=/usr/bin/chromium`; her koşuda `STARS_OUTPUT=reports/codex/evidence/mp-p0/<kanıt>` verildi.

| Gerçek komut (ortak ortam yukarıda) | Sonuç | Kanıt |
|---|---|---|
| `MPP0=1 FEDFOUND0=1 FEDFOUND0_THREE=1 MPP0_REVERSE=1 node tests/browser-mp73.cjs` | PASS11/0 | [mp73-stable.log](evidence/mp-p0/mp73-stable.log), mp73-stable/ |
| `MPP0=1 MPP0_DESKTOP=1 MP73_ONLY='A1 |B1 |P0 |sayfa' node tests/browser-mp73.cjs` | PASS4/0; filtre dışı senaryolar NOT RUN | [desktop-stable.log](evidence/mp-p0/desktop-stable.log), desktop-stable/ |
| `node tests/browser-mp74.cjs` | PASS7/0 | [mp74-stable.log](evidence/mp-p0/mp74-stable.log) |
| `node tests/browser-mp75.cjs` | PASS6/0 | [mp75-stable.log](evidence/mp-p0/mp75-stable.log) |
| `MP8_SCEN=N node tests/browser-mp8.cjs` | PASS9/0 | [mp8-N.log](evidence/mp-p0/mp8-N.log) |
| `MP8_SCEN=R MP8_MONTHS=6 MPP0_R=1 FEDFOUND0_R=1 node tests/browser-mp8.cjs` | PASS5/0 R0–R4, son kaynak | [mp8-R-complete.log](evidence/mp-p0/mp8-R-complete.log), [JSON](evidence/mp-p0/mp8-R-complete/R/mp8-R.json) |
| `MPP0_CARDS=1 node tests/browser-beta-fed-found0-events.cjs` | PASS24/0, son kaynak | [sp-ui-final.log](evidence/mp-p0/sp-ui-final.log), [JSON](evidence/mp-p0/sp-ui-final/results.json) |
| `MPP0_CARDS=1 FD0_CASE='MPP0|JavaScript' node tests/browser-beta-fed-found0-events.cjs` | PASS2/0; diğer vakalar NOT RUN | [layout-after.log](evidence/mp-p0/layout-after.log) |

MP73/mobile görünüm800/915/960 yatay; SP kart testleri800×360,960×540,915×412 ve1920×1080. Masaüstü MP oturumu1920×1080 ve gerçek fare girdisidir. [B yabancı gövde](evidence/mp-p0/desktop-stable/p0-foreign-health.png), [C kişisel anomali](evidence/mp-p0/desktop-stable/p0-C-own-anomaly.png), [dokunma alanı](evidence/mp-p0/layout-after/multi-card-options.png), [soğuk kuruluş kabulü](evidence/mp-p0/mp8-R-complete/R/cold-founding-accepted.png).

R0–R4:3insan+5AI, seed11, orta galaksi,6ay; gerçek IndexedDB kaydı; bütün tarayıcı/relay süreçleri kapatıldı; yeni süreçler/yeni oda/aynı devletler; teklifler, savaş, federasyon, Konsey, hız ve kişisel karar deposu korunur. Bekleyen B olayı+200ara bir kez; tekrar teklif kabulü reddedilir; kayıt öncesi resolved olay yeniden ödül vermez. Kuruluş daveti bir kez kabul/final ve220etki tek ücret; misafir gerçek reload sonrası0 kuruldu popup. Son6ayda B/C aynası rev+hash eşit, `diff=[]`, `leak=[]`, JavaScript errors boş.

MP73/MP74/MP75/N geniş senaryoları son ilk-hydrate/bildirim-hook/CSS dar düzeltmelerinden önce geçti. Bu son değişiklikler ilgili boot/cold/layout testleri, dört viewport24/0 ve son R5/0 ile doğrulandı; tüm ağır testler her küçük adımda tekrar edilmedi.

## 8. Node, Save8/RNG ve önceki faz korumaları

| Gerçek komut | Sonuç | Kanıt (evidence/mp-p0/) |
|---|---|---|
| `node tests/mp_p0_guest_test.cjs` | PASS7/0 | verified-mp_p0_guest_test.cjs.log |
| `node tests/mp_p0_decisions_test.cjs` | PASS7/0 | final-mp_p0_decisions_test.cjs.log |
| `node tests/mp_p0_motion_test.cjs` | PASS3/0 | verified-mp_p0_motion_test.cjs.log |
| `node tests/mp_p0_notice_test.cjs` | PASS3/0 | final-mp_p0_notice_test.cjs.log |
| `node tests/mp_p0_boot_test.cjs` | PASS1/0 | final-mp_p0_boot_test.cjs.log |
| `node tests/mp_p0_cold_notice_test.cjs` | PASS1/0 | final-mp_p0_cold_notice_test.cjs.log |
| `node tests/mp_p0_compat_test.cjs` | PASS6/0 | final-mp_p0_compat_test.cjs.log |
| `STARS_CONTROL_ROOT=/tmp/stars-mp-p0-control node tests/mp_p0_catalog_equivalence.cjs` | PASS98/0 | final-mp_p0_catalog_equivalence.cjs.log |
| `node tests/perf1_equivalence_test.js` | PASS4/0 | final-perf1_equivalence_test.js.log |
| `node tests/perf2_equivalence_test.js` | PASS5/0 | final-perf2_equivalence_test.js.log |
| `node tests/mp6_mirror_test.js` | PASS8/0 (yerel relay izniyle) | mp6-accepted.log |
| `node tests/mp61_core_test.js` | PASS9/0 | reg-mp61_core_test.js.log |
| `node tests/mp73_council_test.js` | PASS14/0 | reg-mp73_council_test.js.log |
| `node tests/mp74_notice_test.js` | PASS6/0 | reg-mp74_notice_test.js.log |
| `node tests/mp75_war_test.js` | **FAIL3/1; p14 kontrolünde de3/1** | reg-mp75_war_test.js.log, mp75-war-control.log |
| `node tests/mp4_core_test.js` | PASS14/0 | reg-mp4_core_test.js.log |
| `node tests/mp3_core_test.js` | PASS11/0 | reg-mp3_core_test.js.log |
| `node tests/mp71_bridge_test.js` | PASS9/0 | reg-mp71_bridge_test.js.log |
| `node tests/beta_fed_found0_core_test.js` | PASS10/0 | reg-beta_fed_found0_core_test.js.log |
| `node tests/beta_fed_found0_mp_test.js` | PASS11/0 | reg-beta_fed_found0_mp_test.js.log |
| `node tests/beta_fed_found0_events_test.js` | PASS11/0, son kaynak | final-beta_fed_found0_events_test.js.log |
| `node tests/beta_war_fix0_test.cjs` | PASS17/0 | reg-beta_war_fix0_test.cjs.log |
| `node tests/beta_p01_war_end_test.js` | PASS5/0 | reg-beta_p01_war_end_test.js.log |
| `node tests/beta_p01_embargo_test.js` | PASS5/0 | reg-beta_p01_embargo_test.js.log |
| `node tests/beta_p02_news_test.js` | PASS8/0 | reg-beta_p02_news_test.js.log |
| `node tests/mp86_nebula_cache_test.js` | PASS3/0 | reg-mp86_nebula_cache_test.js.log |
| `node tests/beta_setup0_pirates_test.cjs` | PASS10/0 | reg-beta_setup0_pirates_test.cjs.log |
| `node tests/beta_setup1_gates_test.cjs` | PASS12/0 | reg-beta_setup1_gates_test.cjs.log |
| `node tests/beta_ux0_names_test.cjs` | PASS9/0 | reg-beta_ux0_names_test.cjs.log |
| `node tests/beta_scale0_colony_test.cjs` | PASS12/0 | reg-beta_scale0_colony_test.cjs.log |

Sayım tabloları örtüşen regresyonlar içerir; bunlar tek bir “toplam benzersiz test” sayısına toplanmadı. [Son Node özet/kanıt eşlemesi](evidence/mp-p0/node-accepted.json).

Gerçek p14 kaynak kopyası `git archive bf264918...` ile sabitlendi. Seed11/23/42/99/404,45sistem,5AI,3ay×5seed=15aylık kontrol noktasında **ham SP Save8 ve RNG eşit**. Gerçek eski paket4 p14 kaydı kabul/tamper ret kontrolü var. [Uyumluluk JSON](evidence/mp-p0/compat/compat.json). Ayrıca mevcut bütün authored event/anomaly/chain seçenekleri98/98 p14 SP kontrolüyle ham Save8/RNG eşit; testte iki VM’ye aynı kontrollü Math.random verildi. Bu sınırlı karşılaştırma gerçek oyuncunun bütün uzun kampanyalarını temsil etmez.

AI/ekonomi/savaş/diplomasi kaynakları yeniden tasarlanmadı. Önceki PERF1/PERF2, MP8.6 piksel önbelleği ve koloni otomasyonu testleri geçti. Yeni120ay/500–1000sistem kampanyası **NOT RUN**; gereksiz ağır kampanya başlatılmadı.

## 9. Saklanan FAIL’ler ve sınıflandırmaları

1. **Gerçek p14 kusurları:** before-valid0/5, motion-before0/3; boot yanlış mask ve cold sonuç tekrar; çok kartta gerçek yanlış hit-test. Önceki FAIL kanıtları silinmedi; düzeltme sonrası ayrı PASS dosyaları vardır. before.log ilk denemesinde fikstür hataları da vardı; before-valid esas karşılaştırmadır.
2. **MP74 ilk6/1 A4 ve R ilk4/1:** kartın yeniden oluşturulması/sıra değişimi/detached hedef. DOM uzlaştırma ve kararlı sıra düzeltildi; MP74-stable7/0 ve R DOM nesnesi özdeşlik kanıtı vardır.
3. **R-stable4/1:** seçenek tıklamasını komşu fedfound kartı yakaladı; options rect10px idi. Gerçek CSS yerleşim kusuru, layout-after ve son R ile doğrulandı.
4. **R-accepted4/1:** sayfa reload sonrası test `__sha` yardımcısı yoktu. Test yeniden CANON/GUESTLIB kurar; runtime değişmedi. **R-final4/1:** test host ödülünü görünce guest ACK sonuç modalını beklemeden sonraki karta basıyordu; orijinal hata modalın pointer engellediğini gösterir. Test şimdi SONUÇ’u bekler, gerçek Kapat’a dokunur. Son **R-complete5/0** bu iki hatayı atlamadan tamamlar.
5. **SP-ui-stable19/4:** canlı yüzey koruması seçeneği dokunma sonrasına ertelediği halde test `locator.count()` ile hemen assertion yapıyordu. Aynı8000ms sınırı içinde gerçek açık/kapalı DOM koşulu beklenir; hiçbir seçenek/ödül assertion’ı kaldırılmadı. Son24/0.
6. **Tarayıcı ilk denemeleri:** yalnız ilk gemiyi hasarlı bırakıp filo ortalamasını%42 bekleyen fikstür, açık önceki diplomasi penceresinin kartı örtmesi, başlangıçta inşaat gemisi bulunmaması, kapalı details grubundaki butona erişim ve Canvas üst üste hızlı dokunmalarının mevcut çift dokunma davranışı. Fikstür/etkileşim akışı düzeltilip gerçek beklenen davranışla yeniden sınandı; ürün bunlar için değiştirilmedi. browser-first/second/third/final/four-roles/desktop logları korunur. Bütün tarihsel timeoutların aynı neden olduğu iddia edilmez.
7. **Son Node batch yanlış ortam:** STARS_CONTROL_ROOT yanlışlıkla aday guest/motion testlerine de p14 kökü verdi. node-final.json iki FAIL’i ve logları korur; aday köküyle verified-* iki ayrı tekrar7/0 ve3/0; node-accepted.json açıklamalı eşlemedir. Diğer son kontrollerin çıktıları silinmedi.
8. **Native MP6 ilk FAIL:** eski whitelist assertion’ı yeni izinli iki uç hareketini yasaklıyordu; sıkı alan whitelist’i güncellendi. Sandbox yerel listen EPERM ayrıca çıktı; yerel relay’e izinli komutla tekrar8/0.
9. **Açık önceki MP75 Node FAIL3/1:** temas yok düşman adı assertion’ında fikstürdeki özel wild devlet adı gösteriliyor. Değişmemiş p14 `node /tmp/stars-mp-p0-control/tests/mp75_war_test.js` de aynı3/1 ve aynı özel isimle başarısız. Bu fazın yeni regresyonu olarak sınıflandırılmadı, **PASS yapılmadı ve düzeltilmiş sayılmadı**. MP75 gerçek Chromium6/0 ayrı kanıttır.

## 10. Değişen dosyalar ve regresyon riskleri

Runtime: `main.js` (gözlem, actor-safe callbacks, karar deposu/yükleme/build), `map.js` (aynı çizim/hit-test noktası ve salt okunur yabancı seçim), `ui.js` (gövde metni, ortak karar yolu, bildirim kimliği/DOM), `index.html` (tek flex küçülme kuralı), `sw.js` (PWA kimliği), `research/mp0/mp-core.js` (eventChoice sahiplik ve remote insan hook’ları), `research/mp6/mirror.js` (dar izinli DTO), `research/mp6/client/guest-stars.js` (hydrate, karar ACK, bildirim tercihi ve ara çizim), `research/mp1/client/view.js` ve `research/mp1/server/relay.js` (MP kimliği). Manifest, p15 ZIP, testler ve geliştirici notları da güncellendi.

Sekiz yeni hedefli Node testi, gerçek üç insan/desktop yordamı, kayıt/devam yordamı ve tam SHA/hunk koruma pini eklendi; mevcut MP73/74/8 ve event browser testleri bu dar kapsam için genişletildi. Koruma pinleri yalnız tam incelenmiş değişiklikleri eski bf kaynağına geri çevirerek eski PERF/faz denetimlerini işletir; genel alan silme/serializer normalizasyonu yoktur.

Riskli sınırlar: görünürlük/gözlem geçmişi, authored callback actor referansları ve canlı DOM. Bunlar için ayrı mahremiyet,98seçim, ilk-hydrate, tek uygulama, yerleşim ve kayıt/yeni oda kanıtı üretildi. Bilinmeyen eski olay sahibi için tahmini onarım yok. Tek oyunculu ham eşdeğerlik bu kullanım kapsamıyla sınırlıdır.

## 11. Paket, manifest ve dosya hash’leri

- ZIP: [releases/stars-faz96h10p15.zip](../../releases/stars-faz96h10p15.zip), **797321 bayt**.
- SHA-256: `f75b021b15e59664bc743d1e5ce1f1538fc94280c27718e8961f9fc4e2770676`.
- ZIP dosyası CRC32: `0536E3FD`.
- RELEASE-MANIFEST SHA-256: `01eba69266240150df4a814f48d2a3a032552d6c9d822d4abdcc0a60e470643f`.
- `python tools/package-release.py` ve `python tools/package-release.py --out /tmp/stars-mp-p0-repeat.zip`: iki ZIP bayt bayt eşit.
- ZIP bütün üye CRC’leri ve manifest SHA’ları kontrol edildi; çıkarılan dosyalarda `python tools/verify-release.py --root /tmp/stars-mp-p0-extracted`:19runtime dosyası doğrulandı. Bu19dosyalık oyun paket kapsamıdır; tam depo/MP dağıtım paketi değildir.
- [Paket kanıtı](evidence/mp-p0/RELEASE-VERIFIED.json), [üye CRC/hash listesi](evidence/mp-p0/zip-members.json), [değişen tüm runtime önce/sonra SHA-256](evidence/mp-p0/runtime-sha256.json), [çıkarılmış paket doğrulama](evidence/mp-p0/package-extracted-verify.log).

**Oyun ZIP’i tek başına MP relay ve istemci kaynaklarının tamamını içermez.** Bunlar aynı GitHub kod commit’inde ayrı teslim edilmiştir; yeni istemci dosyası/allowlist yolu eklenmedi. Docker dağıtım yolu değiştirilmedi; Docker build/deploy NOT RUN. Eski ZIP’ler/kullanıcı kayıtları silinmedi. Render’a p15 dağıtımı yapılmadı.

## 12. GitHub teslimi ve pano durumu

Kod ve ZIP 466946186f80b09c6d7e126a13ecce48574ef95a ile uzak dala gönderildi ve `git ls-remote` ile doğrulandı. Rapor/kanıtlar ayrı rapor commit’iyle aynı dala teslim edilir; nihai uzak HEAD son mesajda doğrulanır.

Taslak PR **bir kez** denendi, oluşturulamadı: `Post "https://api.github.com/graphql": Forbidden`. [Gerçek çıktı](evidence/mp-p0/pr-create.log), [gönderilen metin](evidence/mp-p0/pr-body.md). [Doğru compare bağlantısı](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-fed-found0-founder-invites-events...codex/stars-mp-p0-guest-playability?expand=1). Yetki/ağ sınırı değiştirilmedi, tekrar API araştırması yapılmadı.

#33 okuma, başlangıç bildirimi ve son sonuç yorumu da aynı Forbidden ile başarısız. [Okuma](evidence/mp-p0/issue-read.log), [başlangıç](evidence/mp-p0/issue-start.log), [sonuç](evidence/mp-p0/issue-result.log), [iletilmesi denenen sonuç](evidence/mp-p0/issue-result-body.md).

| Takip | Doğrulanan geliştirici sonucu | Gerçek GitHub durumu |
|---|---|---|
| #2 federasyon tekrar/terminal bildirim | Yerel PASS; gerçek PC kabul bekliyor | Pano okunamadı/yazılamadı; değiştirildi denemez. |
| #27 compact event + misafir karar | Yerel PASS; callback/SP ve B/C tek uygulama | Aynı API engeli. |
| #52 filo rota | Dört rol gerçek fare/dokunma PASS; özgün kök kesin değil | Aynı API engeli. |
| #53 basamaklı hareket | Ara çizim/reset PASS; cihaz performansı NOT RUN | Aynı API engeli. |
| #54 kişisel bilim/diğer olay | Sahiplik, karar ve yeni oda PASS | Aynı API engeli. |
| Görünürlük, sensör, askerî gövde, kolonileştirme takibi | Yerel teknik kanıtlar hazır | #55–58 çakışma kontrolü yapılamadı; numara/görev uydurulmadı veya eklenmedi. |

Pano54görev bilgisi kullanıcının verdiği referanstır; bu fazda API ile toplam sayı teyit edilemedi. Eski geçmiş silinmedi; başka görevlerin durumları değiştirilmedi. Bu işler için öneri **RAPOR GELDİ / gerçek PC TEST BEKLİYOR**; kullanıcı kabulü olmadan TAMAMLANDI değil.

## 13. PASS / FAIL / NOT RUN sınırları

**PASS:** izinli gözlem/sensör, yabancı gövde ve kendi hasarı, typed kararların B/C’ye tek uygulanması, kişisel gizlilik, dört rol rota, görsel interpolasyon, terminal kart temizliği, sonuç tekilleştirme, gerçek süreçlerle yeni oda, SP karşılaştırması ve ilgili önceki faz korumaları.

**FAIL korunur:** önceki p14 kusurları ve geliştirme sırasında bulunan kart/boot/cold kusurlarının önce kanıtları; ayrı test yordamı hataları; önceki ve adayda aynı MP75 Node3/1. Son R5/0 önceki R4FAIL kayıtlarını ortadan kaldırmaz.

**NOT RUN:** fiziksel kullanıcı PC kabulü, fiziksel Android, gerçek LAN/Wi-Fi, internet/Render multiplayer, Render health/version/deploy/restart, Docker build/deploy, yeni120–240ay uzun kampanya,500/1000sistem performans karşılaştırması. Chromium mobil emülasyonu gerçek telefon performansı değildir. Kullanıcının eski PC gözlemi bu kodun otomatik PASS kanıtı yapılmadı.

## 14. Açık sorunlar ve kabul planı

1. Asıl gerçek PC oyununun kaydı/trace’i olmadığından bütün özgün semptomlar birebir çözüldü denemez. Özellikle özgün kendi-can ve rota kaybı tek nedeni kesin değil; şu anki kontrollü etkileşimler geçiyor.
2. Eski kayıtta sahibi kaybolmuş anomaliyi geri dağıtma, genel tüm gizlenmiş bildirimlerin çapraz sayfa kalıcılığı ve cihaz tercihi erişilemezken tarihsel sonuç tekrarı açık sınırlar.
3. Geçmiş B1/A3 aralıklı test durumları kapatılmadı. #10 MP hız, #24enerji, #25filo kaybı ve #48kullanıcının eski savaş senaryosu ayrı kritik takipte; bu faz bunları çözmüş sayılmaz. Savaş düzeltmeleri17/0 regresyonla korunmuştur.
4. MP75 Node3/1 mevcut özel-devlet fikstürü/ad görünürlüğü ayrımı açık; kapsam dışı AI/diplomasi değişikliği yapılmadı.
5. Bildirim/tercih listeleri sınırlıdır; tarihsel bütün olaylar için sonsuz kalıcı cache vaat edilmez. Mevcut uyumlu p15/MPb10 kaynakları birlikte kullanılmalı; canlı Render hâlâ önceki dağıtımdadır.

Kullanıcı, ayrı test kaydında arkadaşını host yaparak şu kısa kabulü gerçekleştirmeli:

- B olarak katıl, çevrendeki bilinen devlet/sınır ve taranmış uygun gezegen işaretlerini kontrol et; sensör paylaşımını aç/kapat, canlı görüş giderken keşif geçmişi kalmalı. C de bağlıysa B/C özel olayları karışmamalı.
- Kendi hasarlı filonu ve görülen yabancı/korsan filoyu seç; kendi gerçek gövdesi ve yabancı izinli hasar görünmeli. Askerî/bilim/koloni/inşaat gemisine rota ver; çizgi, varış, durdurma, rota değişimi ve kopma sonrası görünümü kontrol et.
- Bilim anomalisini kendi geminle bul, tam pencereden bir karar ve başka olayda karttan hızlı karar ver. Tek ödül/ceza kendi devletine gitmeli; çift basma ikinci ödül vermemeli. Federasyon sonucu tekrar etmemeli; cevaplanmış kart geri gelmemeli.
- Host kaydetsin, iki taraf oyunu kapatsın, yeni odada aynı devletlerle devam etsin. Bekleyen kararlar erişilebilir, çözülmüş kararlar pasif kalmalı. Ardından fiziksel host/katılımcı rollerini değiştirerek tekrarla.

Hata görülürse oyun build/MP kimliği, oyun tarihi, rol/devlet adı, ekran görüntüsü, son eylem ve mümkünse kullanıcı kaydıyla birlikte bildirilmelidir. Mevcut kullanıcı kayıtlarını silmeyin. **Sonraki tek öncelik: bu p15 kaynaklarıyla gerçek iki/üç PC katılımcı kabulü ve başarısızsa aynı Save8 üzerinden hedefli tekrar.** Yeni mekanik eklenmesi önerilmiyor.
