# STARS — BETA-FED-FOUND.0 sonuç raporu

**Yerel geliştirme teslimi; kullanıcı onayı ve canlı yayın değildir.** #11/#12/#13/#2 yerel kabul testlerini geçti. **#27 KISMEN:** diplomatik özetler ve SP/host hızlı event kararları uygulandı; misafire ait rastgele/anomali/zincir olaylarını yetkili host komutuyla çözme bu teslimatta yoktur. Fazın beş görevinin tamamı bitmiş sayılmamalıdır.

## 1. Kanonik kaynak ve HEAD

- Başlangıç ve PR tabanı: `codex/stars-beta-war-fix0-peace-notices`, **4ef02795042528d82a7e59c484ccff3c6c10875f**. Uzak HEAD beklenen p13 kaynağıyla eşleşti; eski main kullanılmadı.
- Kaynak p13 ZIP SHA-256: `e1f0b4a318df37275bcf40ae7e76c1c93752c05c01f5b103d9b3a2e208a13b6d`.
- Çalışma dalı: `codex/stars-beta-fed-found0-founder-invites-events`.
- Doğrulanmış son kod/paket commit'i: **618df01768394c7c262e89dc0de979fdb0564bcb** ([commit](https://github.com/sarsiss12-dot/Star/commit/618df01768394c7c262e89dc0de979fdb0564bcb)). [Uzak kod HEAD kanıtı](evidence/beta-fed-found0/source-remote-heads-code.txt).
- Bu rapor kendisini içeren commit'in SHA'sını önceden bilemez. Nihai rapor HEAD'i son sohbet mesajında ve uzak dalda doğrulanır; raporun teknik referansı yukarıdaki kod commit'idir.
- Okunan kurallar/kanıtlar: AGENTS.md, GPT-DEVIR.md, CLAUDE.md, CODEX-SON-RAPOR.md, önceki BETA-WAR-FIX0 raporu ve ilgili testler. Önceki kampanyalar yeniden yapılmadı.
- Main merge/rebase/force-push, Render erişimi/deploy/restart, yeni environment ve kullanıcı kaydı silme yapılmadı.

## 2. Değişen dosyalar

| Dosyalar | Değişikliğin amacı |
|---|---|
| `diplomacy.js` | Açık kurucu listesi, şartlara bağlı rıza, AI değerlendirmesi, süre/iptal/final, atomik mevcut federasyon işlemi |
| `main.js` | İsteğe bağlı Save8 kuruluş alanı; typed bekleyen olayları ve gizleme durumunu güvenle koruma; iki açıklama düzeltmesi; belirsiz sonuç metadata'sı |
| `ui.js`, `index.html` | Ortak kuruluş ekranı, teklif özetleri, ayrı seçenek düğmesi, ortak karar yolu, sınırlı kaydırılabilir seçenekler |
| `inbox.js`, `archive-ui.js` | Gerçek davet/yanıt/sonuç kayıtları ve ayrıntılara geri erişim |
| `research/mp0/mp-core.js` | Yetkili kuruluş komutları, actor denetimi, eski paket uyumu |
| `research/mp6/mirror.js`, `research/mp6/client/guest-stars.js` | Katılımcıya özel beyaz liste/ID eşleme; ACK bekleme; host'a yönlendirme; yetkisiz yerel event kararını engelleme |
| `research/mp1/client/mp1-host.js`, `research/mp71/client/mp71-dip.js` | Duraklatılmış host'ta da kanonik komut ve yayın; ara DOM çizimini erteleme |
| `research/mp1/client/view.js`, `research/mp1/server/relay.js`, `sw.js` | Build/MP/PWA kimlik tutarlılığı |
| `RELEASE-MANIFEST.json`, `releases/stars-faz96h10p14.zip` | Güncel deterministik oyun paketi |
| Yeni `tests/beta_fed_found0_*`, `tests/beta-fed-found0-*`, `tests/browser-beta-fed-found0-events.cjs`, `tests/helpers/beta-fed-found0-*` | Çekirdek, gizlilik, UI, eski kayıt, gerçek iki/üç insan ve soğuk devam kanıtı |
| MP73/74/75/8 ve mevcut iki siyasi test/helper | Yeni açık rıza akışını gerçek dokunmayla kabul; doğru görünen hedefi kanıtlama; eşdeğerlik için SHA sabitli eski kaynak dönüşümü |
| `CLAUDE.md`, bu rapor, `CODEX-SON-RAPOR.md`, kanıtlar | Devir ve doğrulanmış teslim durumu |

**14 değişen runtime/MP dosyasının p13→p14 SHA-256 karşılaştırması:** [runtime-sha256.json](evidence/beta-fed-found0/runtime-sha256.json). AI stratejisi, ekonomi, savaş ve federasyon yasaları yeniden yazılmadı. Eski federasyon testlerinde pozitif kuruluş, gerçek davet + rıza + son onay yoluna taşındı; maliyet/yükümlülük/oy/rollback beklentileri korunur.

## 3. Beş görevin ayrı sonucu

| Pano görevi | Eski sorun → yeni davranış | Yerel sonuç / kabul sınırı |
|---|---|---|
| #13 Kurucu seçimi | Uygun müttefikleri otomatik toplama → yalnız seçili adayların sabit listesi; seçilmeyen uygun AI dışarıda | PASS: gerçek SP UI ve motor; kullanıcı kabulü bekler |
| #11 Kuruluş davetleri | Doğrudan kuruluş → pending/accepted/rejected/expired/invalid/cancelled ve açık final; ücret başarıda bir kez | PASS: AI gerçek kabul/ret, iptal, süre sonu, değişen dünya/şartlar; kullanıcı kabulü bekler |
| #12 İki insanla kuruluş | Üç kurucu şartı → en az iki açık rızalı insan yeterli; tek insanlı SP'de iki AI şartı kalır | PASS: host→misafir, misafir→host, misafir→misafir/üç insan; kullanıcı kabulü bekler |
| #2 Bildirimler | Geçici/belirsiz karar → gerçek davet ve sonuç, şartlar, sayılar, ACK bekleme ve Gelen Kutusu geçmişi | PASS: gerçek tarayıcı, mirror ve soğuk oda; fiziksel test bekler |
| #27 Kompakt gelişmiş event | Açıklamasız kart ve yalnız modal → gerçek diplomatik özet, SP/host event/anomaly/chain ayrı hızlı seçenek | **KISMEN**: SP/host PASS; MP misafir typed-event karar motoru bu fazda uygulanmadı, TEST BEKLİYOR |

Hiçbiri kullanıcı tarafından kabul edilmiş veya TAMAMLANDI sayılmış değildir.

## 4. Kuruluşun eski/yeni davranışı ve veri modeli

P13'te `canFoundFed/foundFederation`, kurucuya uygun müttefikleri topluyordu; iki insan yalnız başına gerekli ortak sayısına ulaşamıyordu. [Gerçek p13 iki insan kontrolü](evidence/beta-fed-found0/p13-two-human-before.json).

Yeni akış mevcut `FED_TYPES/FED_BALLOTS/fedFoundCost/foundFederation` motorunu kullanır: tür → rejim → açık aday seçimi → davet → yanıtlar → kurucunun son onayı. Kabul edilince federasyon kendiliğinden oluşmaz. Seçilmeyen devlet eklenmez. Ortak ittifak ve federasyon savunma/siyasi yükümlülükleri ekran ve davette gösterilir.

`G.fedFounding` yalnız kullanıldığında oluşturulur. Teklif ID'si, proposer, tür/rejim, sıralı üyeler, gerçek oyun günü, 150 günlük süre, durum ve her katılımcının şart imzasına bağlı rızası tutulur. 16 bekleyen + 48 sonlanmış kayıt sınırı vardır. Eski şartlara verilen rıza yeni rejime uygulanmaz; gönderilmiş teklifi değiştirmek için iptal edip yenisini göndermek gerekir.

Son onayda yaşayan/bağımsız/federasyonsuz olma, ittifak/temas, kurucular arası savaş, ayrılış beklemesi, kaynaklar, süre ve bütün rızalar tekrar denetlenir. Seçilmiş AI stratejik olarak yeniden değerlendirilir. Mevcut işlem geri alma yolu üyelik, kimlik, ittifak, para, teklif ve RNG'yi hata durumunda birlikte geri alır. Başarılı finalin tekrarı yeni federasyon veya ikinci ücret oluşturmaz.

## 5. İki insan ve çok insan kabulü

Motor: 0→1, 1→0 ve 1→3 komutları; başka oyuncu adına yanıtlama/final reddi. İnsan sınıflandırması yalnız devlet0 varsayımına bağlı değildir. Dört oy rejiminde iki üyenin oyu, eşitlikte ret ve yeterli çoğunlukta kabul test edildi.

Gerçek MP73: host→misafir ve misafir→host iki ayrı kuruluş; ardından üç insanlı odada misafir kurucu, diğer iki insanın rızası, ret/iptal/yeniden davet, bağlantı koparıp dönüş. Özel davet üçüncü ilgisiz oyuncuda görünmez. Son üyelikler her ekranda eşleşir. [İki insan JSON](evidence/beta-fed-found0/mp73-accepted/fedfound-browser.json), [üç insan JSON](evidence/beta-fed-found0/mp73-accepted/three-founders.json).

İnsanlar adına AI yanıt vermez. Yalnız iki insanla kuruluş ittifak/savaş koşullarını atlamaz. Eşzamanlı teklifler motor testinde seri host işlemiyle tutarlı çözülür; birinin başarılı kuruluşundan sonra diğerinin geçersiz finali reddedilir. Gerçek iki eşzamanlı fiziksel cihazın paket kaybı testi NOT RUN.

## 6. Kurucu ortak seçimi ve AI

SP gerçek dokunma testinde bilimsel tür, iki AI seçimi ve gönderim yapılır. İki AI mevcut `aiFedWilling` ile gerçekten kabul verir; kurucu final onayı vermeden federasyon yoktur. Sonuç üyeleri `[0,1,2]`, üçüncü uygun AI4 dışarıda; yalnız 220 etki kesilir. [Gerçek UI sonuçları](evidence/beta-fed-found0/ui-economy-preserved/results.json).

AI'nın tür yakınlığı, rejim değerlendirmesi, mevcut ittifak/ilişki, kurucularla düşmanlık/savaş, bilinen yardım/iş birliği rotası ve mevcut güç/üyelik değerlendirmeleri yeniden kullanıldı. Örneğin rotası bilinmeyen aday `Bilinen yardım/iş birliği rotası yetersiz` diyerek reddeder; test geçirmek için AI otomatik kabul ettirilmedi. Tür/rejim için olumlu/çekinceli açıklama ve gerçek kabul/ret gerekçesi gösterilir. Bu bir gelecek davranış garantisi veya gizli AI stoklarının teşhiri değildir.

İlk quote testinde AI önizlemesi `_pow/_press` önbelleklerine yazıyordu. [İlk alan farkı](evidence/beta-fed-found0/quote-first-diff.json) üzerine gerçek özellik tanımları geri yüklenerek okuma yolu saflaştırıldı; hash normalizasyonu yapılmadı.

## 7. Multiplayer yetkisi, ACK ve gizlilik

Yeni sınırlı komutlar: `fedFoundStart/Reply/Cancel/Finish`, salt okunur `fedFoundPlan`. Mevcut actor-devlet sahipliği, seq/cid, şekil/alan denetimleri ve host otoritesi korunur. İnsan kurucunun eski doğrudan `fedFound` çağrısı rıza akışını atlayamaz. Duraklatılmış host işlemi de `host.local` üzerinden yayınlanır.

Mirror yalnız oyuncunun katıldığı teklifleri açık alan beyaz listesiyle taşır; diğer tekliflerin global sayaç değeri bile gönderilmez. Üyeler ve şartlar yerel ID permütasyonuna göre eşlenir. Bilinmeyen üçüncü kurucunun özel gerekçesi maskelenir. Yetki denetimi özel teklifin ayrıntılı geçerlilik incelemesinden önce yapılır. [Gizlilik düzeltmesi öncesi FAIL](evidence/beta-fed-found0/privacy-before.log), [sonrası PASS](evidence/beta-fed-found0/privacy-after.log).

Yanıt gönderilirken mevcut ACK bekleme mekanizması düğmeyi korur; kabul ancak kanonik host sonucuyla görünür. Kopma, tekrar kabul, kayıt/reconnect ve soğuk yeni host testsiz varsayılmadı. Yapay gecikme ile bütün yeni komutların ayrı paket kaybı kombinasyonları çalıştırılmadı; mevcut MP8 N ağ kurtarma regresyonu 9/0'dır.

## 8. Save8 ve eski sürüm uyumu

Save8 **v8**, MP paket **4**, protokol **1** korundu. `fedFounding` isteğe bağlı alandır; eski kayıtta yoksa yüklemede uydurulmaz. Yüklemede alanlar, uzunluklar, ID'ler, yanıtlar ve şart imzaları beyaz listeyle doğrulanır. Sınırsız nesne kopyalama yapılmaz. Mevcut federasyon/oy rejimleri eski alanlarıyla kalır.

Gerçek p13 kaydı beş seed'de (11/23/42/99/404;45 sistem, 5 AI) yüklenip üç gerçek ay yürütüldü. **15 ay örneğinde ham Save8 SHA-256 ve RNG birebir eşleşti**; alan silme/normalizasyon yoktur. Gerçek p13 paket kabulü ve bütünlüğü bozuk paketin reddi ayrıca PASS. [Son karşılaştırma](evidence/beta-fed-found0/compat-economy-preserved/compat.json).

İki bağımsız MP8 R koşusunda üç insan+5AI/seed11, altı ay → gerçek IndexedDB kayıt → bütün tarayıcı ve relay süreçlerini kapatma → yeni süreç/oda/host → eski devletlere dönüş → bekleyen daveti gerçek dokunmayla kabul/final → altı ay daha: her ikisi **R0–R4 5/0**. Bekleyen şartlar ve süre aynı; replay reddi, tek ücret, mirror ve özel veri kontrolleri geçti. [Soğuk davet önce/sonra](evidence/beta-fed-found0/mp8-R-accepted/R/cold-founding.json), [tam sonuç](evidence/beta-fed-found0/mp8-R-accepted/R/mp8-R.json).

Yeni kuruluş yapılınca ve kullanıcı yeni karar verince kayıt doğal olarak değişir; bu değişiklikleri p13 ile aynı bayt iddiasına dahil etmiyoruz.

## 9. Davet ve sonuç bildirimleri

`fedfound` daveti gerçek proposer, tür, seçilen kurucular, rejim, süre ve yükümlülüklerden oluşur. Kabul/ret ve ayrıntılar mevcut Gelen Kutusu çözüm yolunu kullanır. Gönderen kabul/ret/gerekçe ve tamamlanan rıza sayısını görür. Kuruluş sonucu ad, tür, üyeler, lider, rejim ve yükümlülüklerle kaydedilir.

Kartı kaydırmak yalnız gizler, yanıt vermez. Kayıt/Gelen Kutusu ve kuruluş paneli gerçek pending karara erişim sağlar. Canlı mirror'da anahtar→UID çizimden önce geri yüklenir; ara inbox çizimi ertelenir. Aynı gerçek olay tekrar tekrar üretilmez. Tamamen yeni odada gerçek bekleyen davetin bir kez yeniden sunulması normaldir; genel cihaz/kayıt kapsamlı tüm bildirim tercih deposu bu fazın konusu değildir.

## 10. Diplomatik kompakt özetler

Gönderen ve gerçek teklif maddeleri, kaynak miktarı, ittifak/savunma yükümlülüğü, süre ve görünmeyen ek koşul sayısı gösterilir. Örnek tutarlar sabitlenmedi. Başka devletin kaynak stoku veya bilmediği teklif katılımcısı özet için okunmaz. Mevcut Kabul/Ret/Karşı Teklif yolu korunur. MP74/75 ve yeni özel davet testleri bu etkileşimlerin gerçek DOM/touch kabulüdür.

## 11. Bilimsel/rastgele/zincir hızlı kararlar

Kart ilk açılışta kompakt kalır. Başlık/ana gövde mevcut tam event penceresini açar. Ayrı **SEÇENEKLER** düğmesi yalnız kart içinde seçenekleri açar; modal açmaz. Menü kaydırılabilir ve hedefler ayrıdır. Seçeneklere basmak başlık olayına yayılmaz. Tam pencere ve hızlı seçim aynı `UI.applyEventChoice` + mevcut authored callback yolunu kullanır; yeni event motoru yazılmadı.

SP/host event, anomaly ve chain testleri gerçek kaynak/araştırma etkilerini, bir sonraki zincir randevusunu ve ikinci uygulama reddini doğrular. Gelecek zincir ödülü bugünkü kesin kazanç diye yazılmaz; belirsiz sonuç işaretlenir. `a5` açıklamasındaki +1,5 etki gerçek +15'e, `e2` geri çevirme açıklaması gerçek ilişki−6'ya düzeltildi; callback ödülleri değiştirilmedi. Karmaşık koşullu sonuçlar için kesin getiri uydurulmaz.

**MP sınırı:** mevcut mirror/protokol, her misafirin event/anomaly/chain kararına ait yetkili olay kimliği/komutunu sağlamıyor ve eski callback'ler `G.p` kullanıyor. Yerel misafir ödülü uygulamak veya host `G.p` değiştirerek başka oyuncu adına çözmek güvenli değildir. Bu nedenle misafirde bu yerel karar kapalı ve açıklamalı kalır; ayrıntı görüntüleme/federasyon-diplomasi kararları ayrı güvenli yollarından çalışır. **Bütün MP event türleri tamamlandı iddiası yoktur.** Bu açık #27 bölümünün ayrı uygulanması gerekir.

## 12. Çift karar, ekonomi, RNG ve hız güvenliği

Karar anında aynı bekleyen not, dünya kimliği, seçenek, yetki, varsa gerçek son kullanma tarihi denetlenir. Not uygulama öncesi bekleyen listeden alınır; callback başarısızsa mevcut transaction kaynak/not/zincir/RNG'yi geri alır. Başarılı kararın ikinci çağrısı ve iki gerçek hızlı touch ikinci maliyet/ödül üretmez. Bekleyen typed notlar altı görünür kart sınırında silinmez; overflow gizlenir, Save8'de kalır ve durum listesinden açılır.

Kart/özet/seçenek açma-kapama ekonomiyi, stratejik RNG'yi ve hızı değiştirmez. Önceki `fillEventText` rastgele metin seçimi oyun RNG'sini tüketiyordu; şimdi seed/not/metin üzerinden ayrı deterministik kozmetik akış kullanır. [Önce/sonra](evidence/beta-fed-found0/presentation-before-after.json). Gerçek kararın eski Math.random/rnd tüketimi korundu; otomatik en güvenli tercih indeksleri eski/yeni aynı. Kontrollü risk dalları .25/.75 ile tam/hızlı karşılaştırılır; bu deney rastgele olasılık dağılımının fiziksel cihaz ölçümü değildir.

Son incelemede eklenmiş yeni bir `cost`/yetersiz kaynak kapısı geri alındı: eski event callback'leri bazı ceza ve masrafları düşük stokta da uyguluyordu; yeni bir bütçe yasağı bu fazda ekonomiyi değiştirirdi. Son test düşük stokta **tam pencere ile hızlı kararın ham Save8/RNG eşitliğini ve eski gerçek sonuçlarını** denetler. #24 enerji sorunu çözülmüş sayılmaz. Kaynak kuralları yeniden dengelenmedi.

## 13. Gerçek Chromium görüntüleri

Ortam: Node 24.22.1, Chromium 155.0.8059.79, Playwright 1.62.1. Mobil görünüm **800×360,960×540,915×412**, masaüstü **1920×1080**. Touch ve mouse gerçek tarayıcı olaylarıyla; locator timeout artırımı, force veya JavaScript `.click()` yoktur. Kontrollü oyun fikstürü kurmak, gerçek kullanıcı etkileşiminden ayrı tutulur.

- [800×360 seçenekler](evidence/beta-fed-found0/ui-economy-preserved/800x360-options.png)
- [960×540 seçenekler](evidence/beta-fed-found0/ui-economy-preserved/960x540-options.png)
- [915×412 seçenekler](evidence/beta-fed-found0/ui-economy-preserved/915x412-options.png)
- [1920×1080 seçenekler](evidence/beta-fed-found0/ui-economy-preserved/1920x1080-options.png)
- [SP seçili AI kurucular](evidence/beta-fed-found0/ui-economy-preserved/sp-selected-ai-ready.png), [kuruluş sonucu](evidence/beta-fed-found0/ui-economy-preserved/sp-selected-ai-founded.png)
- [Misafirin gerçek daveti](evidence/beta-fed-found0/mp73-accepted/fd0-guest-invite.png), [misafir kurucu sonucu](evidence/beta-fed-found0/mp73-accepted/fd0-guest-founder-formed.png)
- [Üç insan üyeliği](evidence/beta-fed-found0/mp73-accepted/fd3-B-members.png), [soğuk kayıt sonrası kabul](evidence/beta-fed-found0/mp8-R-accepted/R/cold-founding-accepted.png)

Uzun aday listesi kaydırılır; küçük ekranda bütün adayların aynı anda görünmesi iddia edilmez. Fiziksel telefon/monitör okunabilirliği kullanıcı kabulündedir.

## 14. Gerçek test komutları ve sonuçları

Aşağıdaki tarayıcı komutlarının ortak ortamı `STARS_CHROMIUM_PATH=/usr/bin/chromium`; `STARS_OUTPUT` her koşunun ilgili kanıt alt dizinine verildi. Chromium testleri sırayla çalıştırıldı. Tablodaki sayılar ayrı suite sonuçlarıdır; örtüşen testler tek toplam başarı sayısına eklenmez. Son ekonomi koruması sonrası event11/0, core10/0, PERF2 5/0, p13compat6/0 ve gerçek UI23/0 tekrar geçti. Diğer regresyonlar önceki kaynakla aynı davranan alanları doğrular; gereksiz ağır tekrar yapılmadı.

| Test/kapsam | Gerçek komut | Son sonuç | Kanıt |
|---|---|---|---|
| Kuruluş çekirdeği | `node tests/beta_fed_found0_core_test.js` | PASS 10/0 | [core-economy-preserved.log](evidence/beta-fed-found0/core-economy-preserved.log) |
| MP yetki/özel davet/iki üyeli dört oy rejimi | `node tests/beta_fed_found0_mp_test.js` | PASS 11/0 | [mp-packaged.log](evidence/beta-fed-found0/mp-packaged.log) |
| Tam/hızlı karar, RNG, düşük stokta ekonomi eşdeğerliği | `node tests/beta_fed_found0_events_test.js` | PASS 11/0 | [events-economy-preserved.log](evidence/beta-fed-found0/events-economy-preserved.log) |
| Özel davet beyaz listesi ve bilinmeyen ortak | `node tests/beta-fed-found0-private.cjs` | PASS 1/0 | [privacy-after.log](evidence/beta-fed-found0/privacy-after.log) |
| Gerçek p13 kontrolü, beş seed × üç ay ve eski MP paket | `STARS_CONTROL_ROOT=/tmp/stars-fed-found0-control STARS_OUTPUT=reports/codex/evidence/beta-fed-found0/compat-economy-preserved node tests/beta_fed_found0_compat_test.js` | PASS 6/0 | [compat-economy-preserved.log](evidence/beta-fed-found0/compat-economy-preserved.log) |
| Dört viewport gerçek event/kuruluş etkileşimi | `STARS_OUTPUT=reports/codex/evidence/beta-fed-found0/ui-economy-preserved node tests/browser-beta-fed-found0-events.cjs` | PASS 23/0 | [ui-economy-preserved.log](evidence/beta-fed-found0/ui-economy-preserved.log) |
| Tam MP73 + iki/üç insanlı kuruluş | `FEDFOUND0=1 FEDFOUND0_THREE=1 node tests/browser-mp73.cjs` | PASS 10/0 | [mp73-accepted.log](evidence/beta-fed-found0/mp73-accepted.log) |
| MP74 A1/A4/A5/B1, kart ve gerçek hedef | `node tests/browser-mp74.cjs` | PASS 7/0 | [mp74-visible.log](evidence/beta-fed-found0/mp74-visible.log) |
| MP75 diplomasi, AI barış, açık panel, karar kartı | `node tests/browser-mp75.cjs` | PASS 6/0 | [mp75-real-target.log](evidence/beta-fed-found0/mp75-real-target.log) |
| MP8 N kopma/kurtarma | `MP8_SCEN=N node tests/browser-mp8.cjs` | PASS 9/0 | [mp8-N-final.log](evidence/beta-fed-found0/mp8-N-final.log) |
| MP8 R bağımsız temiz deneme 1 | `MP8_SCEN=R MP8_MONTHS=6 FEDFOUND0_R=1 node tests/browser-mp8.cjs` | PASS 5/0 | [mp8-R-final.log](evidence/beta-fed-found0/mp8-R-final.log) |
| MP8 R bağımsız temiz deneme 2 | `MP8_SCEN=R MP8_MONTHS=6 FEDFOUND0_R=1 node tests/browser-mp8.cjs` | PASS 5/0 | [mp8-R-accepted.log](evidence/beta-fed-found0/mp8-R-accepted.log) |
| Son savaş düzeltmeleri gerçek iki insan | `MP73_ONLY="A1|PWF" WARFIX0=1 node tests/browser-mp73.cjs` | PASS 2/0 | [war-mp-final.log](evidence/beta-fed-found0/war-mp-final.log) |
| MP3 diplomasi/çift uygulama/gizlilik | `node tests/mp3_core_test.js` | PASS 11/0 | [reg-mp3_core_test.js.log](evidence/beta-fed-found0/reg-mp3_core_test.js.log) |
| MP4 kayıt/paket doğrulaması | `node tests/mp4_core_test.js` | PASS 14/0 | [reg-mp4_core_test.js.log](evidence/beta-fed-found0/reg-mp4_core_test.js.log) |
| MP31 federasyon/vasallık yetkisi | `node tests/mp31_core_test.js` | PASS 15/0 | [reg-mp31_core_test.js.log](evidence/beta-fed-found0/reg-mp31_core_test.js.log) |
| MP71 diplomatik köprü | `node tests/mp71_bridge_test.js` | PASS 9/0 | [reg-mp71_bridge_test.js.log](evidence/beta-fed-found0/reg-mp71_bridge_test.js.log) |
| BETA-WAR-FIX.0 motor | `node tests/beta_war_fix0_test.cjs` | PASS 17/0 | [reg-beta_war_fix0_test.cjs.log](evidence/beta-fed-found0/reg-beta_war_fix0_test.cjs.log) |
| Soğuk odada özel savaş geçmişi | `node tests/beta-war-fix0-history.cjs` | PASS 3/0 | [reg-beta-war-fix0-history.cjs.log](evidence/beta-fed-found0/reg-beta-war-fix0-history.cjs.log) |
| Aynı gün farklı teklif ID ve replay | `node tests/beta-war-fix0-offer-identity.cjs` | PASS 1/0 | [reg-beta-war-fix0-offer-identity.cjs.log](evidence/beta-fed-found0/reg-beta-war-fix0-offer-identity.cjs.log) |
| Konsey eski/çift oy | `node tests/beta_p01_ballot_test.js` | PASS 3/0 | [reg-beta_p01_ballot_test.js.log](evidence/beta-fed-found0/reg-beta_p01_ballot_test.js.log) |
| Savaş bitişi/yorgunluk/kriz | `node tests/beta_p01_war_end_test.js` | PASS 5/0 | [reg-beta_p01_war_end_test.js.log](evidence/beta-fed-found0/reg-beta_p01_war_end_test.js.log) |
| İnsan ambargosu ve Konsey yaptırımı | `node tests/beta_p01_embargo_test.js` | PASS 5/0 | [reg-beta_p01_embargo_test.js.log](evidence/beta-fed-found0/reg-beta_p01_embargo_test.js.log) |
| Savaş haberi ve tarihsel güvenlik | `node tests/beta_p02_news_test.js` | PASS 8/0 | [reg-beta_p02_news_test.js.log](evidence/beta-fed-found0/reg-beta_p02_news_test.js.log) |
| Mevcut federasyon yasaları/oylama | `node tests/faz95b_federation_reform_test.js` | PASS 68/0 | [federation-reform-final.log](evidence/beta-fed-found0/federation-reform-final.log) |
| Siyasi sistem ve transaction | `node tests/faz96g_politics_test.js` | PASS 34/0 | [politics.log](evidence/beta-fed-found0/politics.log) |
| PERF.1 eşdeğerlik | `node tests/perf1_equivalence_test.js` | PASS 4/0 | [reg-perf1_equivalence_test.js.log](evidence/beta-fed-found0/reg-perf1_equivalence_test.js.log) |
| PERF.2 ham Save8/RNG | `node tests/perf2_equivalence_test.js` | PASS 5/0 | [perf2-economy-preserved.log](evidence/beta-fed-found0/perf2-economy-preserved.log) |
| MP.8.6 native piksel/önbellek | `node tests/mp86_nebula_cache_test.js` | PASS 3/0 | [nebula-final.log](evidence/beta-fed-found0/nebula-final.log) |
| Eski bildirim/olay UI | `node tests/faz96c3_ui_test.js` | PASS 24/0 | [event-legacy-ui.log](evidence/beta-fed-found0/event-legacy-ui.log) |
| Korsan KAPALI | `node tests/beta_setup0_pirates_test.cjs` | PASS 10/0 | [pirates-final.log](evidence/beta-fed-found0/pirates-final.log) |
| Kapı/kriz ayarları | `node tests/beta_setup1_gates_test.cjs` | PASS 12/0 | [gates-final.log](evidence/beta-fed-found0/gates-final.log) |
| Üretken isim/doktrin zarı | `node tests/beta_ux0_names_test.cjs` | PASS 9/0 | [names-final.log](evidence/beta-fed-found0/names-final.log) |
| Yeni/fethedilen koloni otomasyonu | `node tests/beta_scale0_colony_test.cjs` | PASS 12/0 | [colonies-final.log](evidence/beta-fed-found0/colonies-final.log) |
| AI barış test fikstürünün gerçek uygunluğu | `node tests/beta-fed-found0-peace-fixture.cjs` | PASS 1/0 | [peace-fixture-after.log](evidence/beta-fed-found0/peace-fixture-after.log) |

**NOT RUN:** fiziksel Android, gerçek kullanıcı PC kabulü, gerçek LAN/Wi-Fi/internet MP, canlı Render, Docker build/deploy; bütün yeni komutlar için özel gecikmeli-ACK/paket kaybı matrisi; yeni 120 aylık kampanya; pahalı 500/1000 sistem denemeleri; tarayıcı piksel cache ayrı karşılaştırması. Önceki 120 ay WAR kanıtları geçmiş başarıdır, bu fazda yeniden çalıştırılmış sayılmaz. Yeni performans yüzdesi/FPS iddiası yoktur.

## 15. Korunan FAIL kayıtları ve kök nedenleri

Son PASS'ler ilk başarısızlıkları silmez. Ham orijinal hata/stack, JSON ve ekran görüntüleri kanıt dizininde korunur.

| İlk başarısızlık | Kanıtlanan sınıf/neden | Son durum |
|---|---|---|
| `mp-stageA-first.log`2/4 | Test komut cid'si mevcut doğrulama sınırından kısa | Geçerli cid; doğrulama gevşetilmedi, MP11/0 |
| `core-approach.log`8/1 | Ürün: salt okunur AI önizlemesi türetilmiş cache'e yazdı | Gerçek descriptor geri yükleme;10/0 |
| `browser-stageB.log`1/1 | Ürün: paused host doğrudan mutasyonu misafire yayınlamadı | Kanonik host.local; gerçek iki yönlü UI PASS |
| `privacy-before.log` | Ürün: özel gerekçe/fazladan nesne alanı mirror'a kopyalanabiliyordu | Açık beyaz liste ve maskeleme; privacy1/0 |
| `events-first.log`7/2 | Ürün: yüklemede altı kart sınırı pending olay kaybettiriyordu; wrapped callback belirsizliği okunamıyordu | Pending typed kayıtlar ve authored metadata;11/0 |
| `events-browser-first.log`, `events-browser-connected.log`17/4 | İlk gerçek DOM yolunda hızlı seçenek bağlantısı eksikti; ayrıca testin enterGame öncesi LOOP.on=false kullanması birden çok rAF döngüsü açtı, selector yanlış menü eylemini arıyordu | Ürün bağlantısı ve test fikstürü ayrıldı; son23/0 |
| `sp-founder-browser.log`1/1 | Test seçili alt kapsamda gerçek oyun katmanına girmemişti | Gerçek enterGame; SP etkileşimi PASS |
| `mp73-final.log`7/3 | Stale b8 sürüm assertion'ı; ürün async plan yanıtı kapanmış federasyon panelini açtı; devam hataları | b9 katı doğrulama, açık panel + surface denetimi; son10/0 |
| `mp73-fixed.log`9/1 | Test Save8'i geri getirip Save8 dışında olan eski hızı geri getirmedi | Mevcut gerçek host speed komutuyla eski hız geri alındı; #10 genel MP hız sorunu kapanmadı |
| `mp74-final.log`6/1, `mp75-final.log`5/1, `mp75-eligible.log`4/2 | Eski raw bounding-box merkezi kaydırmalı inbox dışında/yanlış karta denk geldi; olay hedefi kanıtı var | Native scroll + gerçek elementFromPoint doğrulaması + gerçek touch;7/0 ve6/0 |
| `mp75-visible.log`5/1 | Kontrollü ayrı deneyde eski AI barış fikstürü purifier/Kan Hukuku gibi barış yapamayan devleti seçebiliyor | `canPeace` uygunluğu ve gerçek hedef; motor barış kararı zorlanmadı. **Tarihsel A3'ün özgün kaydı yok, tamamen çözülmüş sayılmaz.** |
| `events-final.log`10/1 | Test VM'leri Math nesnesini paylaşıyordu | Her VM'de ayrı Math; kontrollü iki dal PASS |
| `mp-private-final.log`10/1 | Yeni karma AI testi gerekli gerçek bilinen iş birliği/rota gözlemini kurmamıştı | Kontrollü gerçek gözlemli fikstür, AI sonucu stub değil;11/0 |
| `core-accepted.log`9/1; `peace-fixture-first.log` | Yeni pozitif fikstür purifier doktriniyle yasak işlemi bekliyordu | Açık yasal doktrinle doğru pozitif test; yasak negatif kuralları korunur |
| `federation-reform.log` | Test güncellemesinde sözdizimi hatası | Gerçek davetli test düzeltmesi;68/0 |

Bütün ilk loglar [kanıt dizininde](evidence/beta-fed-found0/). Özel touch/scroll kanıtı: [MP74 hedefler](evidence/beta-fed-found0/mp74-visible/swipe-targets.jsonl), [MP75 gerçek hedef sonucu](evidence/beta-fed-found0/mp75-real-target/mp75-results.json). Tarihsel B1/A3 için sınırlı son PASS kesin evrensel kapanış değildir.

## 16. Paket, SHA-256, CRC32 ve manifest

- Oyun **96h10p14**, PWA **stars-v96h10p14**, MP **MP.8.9b9**.
- Save8 v8 / paket4 / protokol1. Eski p6…p13 paketler açık uyum listesiyle kabul edilir; checksum/şekil/yetki doğrulamaları korunur. Eski istemciyle yeni komutları karışık çalıştırmak doğrulanmış değildir; aynı güncel istemciler önerilir.
- ZIP: [releases/stars-faz96h10p14.zip](../../releases/stars-faz96h10p14.zip), **794.540 bayt**.
- ZIP SHA-256: `205eeba47747716a32e794ad633e21a9285c295b3648d1e53cf703acf15eae0e`.
- ZIP CRC32: `D0083B93`.
- RELEASE-MANIFEST SHA-256: `33377014735a5d6a0bf8a7c4f95681f95fc156225ea76d50546681833b529c84`.
- Manifest 19 runtime dosyasını; ZIP bu 19 dosya + manifest olmak üzere 20 girdiyi kapsar. ZIP oyun paketidir; MP relay/istemci dağıtımı GitHub kaynaklarından ayrı yapılır. Docker COPY yolları kontrol edildi; Docker build/deploy NOT RUN.
- `python tools/package-release.py`; `python tools/package-release.py --out /tmp/stars-fed-found0-repeat-final.zip`; iki dosya **bayt bayt aynı**. ZIP member CRC, üye listesi ve içerik SHA'ları doğrulandı. `python tools/verify-release.py`: 19 dosya doğrulandı; bu ayrı çalışma ağacı bütünlük kontrolünün tek başına tam ZIP testi olmadığı raporlanır.
- [RELEASE-VERIFIED.json](evidence/beta-fed-found0/RELEASE-VERIFIED.json), [değişen runtime SHA karşılaştırması](evidence/beta-fed-found0/runtime-sha256.json), [manifest](../../RELEASE-MANIFEST.json). Önceki p13 ve eski paketler silinmedi.
- İlk 05c04cf aday paketinin hash'i son paket değildir; son ekonomi korumasıyla yeniden üretildi. Kullanıcı indirirken yukarıdaki son SHA'yı esas almalıdır.

## 17. GitHub ve görev #33 durumu

Kod commit'leri `05c04cffc2fb1c0e7b52ce37a3bd3f28fd5097e9` ve son `618df01768394c7c262e89dc0de979fdb0564bcb` geliştirme dalına gönderildi; uzak kod HEAD'i tekrar okunup doğrulandı. Rapor/kanıt commit'i ayrıca gönderilip son mesajda nihai HEAD bildirilecektir.

Taslak PR doğru tabana **bir kez** denendi ve oluşturulamadı: `Post "https://api.github.com/graphql": Forbidden`. [Ham PR hatası](evidence/beta-fed-found0/pr-create.log). [Doğru compare](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-war-fix0-peace-notices...codex/stars-beta-fed-found0-founder-invites-events?expand=1).

#33 başlangıç ve sonuç yazımları aynı **Forbidden** ile reddedildi: [başlangıç](evidence/beta-fed-found0/issue-start.log), [sonuç](evidence/beta-fed-found0/issue-result.log). Panonun güncel uzak durumları değiştirilemedi/doğrulanamadı. Geçmiş silinmedi, pano yeniden oluşturulmadı, ilgisiz görevler değiştirilmedi.

Önerilen teslim aşaması: #11/#12/#13/#2 **RAPOR GELDİ → KULLANICI ONAYI BEKLİYOR** (yerel kapsam kanıtlı, fiziksel kabul bekler); #27 **RAPOR GELDİ / TEST BEKLİYOR, KISMEN**. Bunlar **uzak panoya gerçekten yazılmış durumlar değildir**. Kullanıcı onayı olmadığından hiçbir görev TAMAMLANDI değildir.

## 18. Açık riskler ve kapsam sınırları

1. **#27 misafire ait typed-event hızlı kararı eksik.** Yetkili olay kimliği, görünürlük ve host komutu ayrı sınırlı tasarım/test ister. Güvenli engel, bütün işlev tamamlandı anlamına gelmez.
2. Fiziksel Android/PC ve gerçek LAN/internet/Render kabulü yapılmadı. Özellikle zayıf cihazda uzun aday listesi, dokunma ve kopma anında ACK bekleme denenmeli.
3. Bütün tür/rejim/kopma birleşimlerinin gerçek tarayıcı çapraz matrisi yapılmadı. Dört rejim motor testinde; bilimsel/mixed/equal örnekleri gerçek tarayıcı ve mevcut siyasi testlerde doğrulanır.
4. Sınırlı inbox/haber/sonlanmış teklif geçmişi sonsuz arşiv garantisi değildir. Bekleyen typed olaylar altı kart kotasıyla silinmez; normal terminal geçmiş mevcut sınırlara tabidir.
5. Tarihsel B1/A3; #25 düşmansız filo kaybı, #24 enerji, #10 MP hız ve kullanıcının özgün savaş kaydıyla doğrulama açık kalır. Bu faz bunları çözmüş sayılmaz.
6. #38 kurulmuş federasyona genel yeni üye yasa sistemi, #19 gezegenler, #49 Savaş Merkezi, vasallık veya ekonomi dengelemesi geliştirilmedi. Mevcut yasalar savunma, liderlik, oylama ve üyelik hesapları korunur.
7. Tamamen eski istemcilerle yeni protokol komutlarının birlikte kullanımı NOT RUN. Güncel p14 MP kaynakları birlikte alınmalıdır; canlı servise dağıtım yapılmadı.

## 19. Kullanıcının kısa PC/Android kabulü ve sonraki tek hedef

İzole yeni test kaydı/odası kullanın; mevcut oyununuzu silmeyin. Her sorun için build/MP sürümü, oda kodu, oyuncu/devlet, oyun tarihi ve ekran görüntüsü kaydedin.

1. **İki insan, iki yön:** Karşılıklı ittifak kurun. A tür/rejim+B seçip davet göndersin; B tek dokunuşla kabul etsin. A son onayı vermeden federasyon olmamalı. A finali bir kez versin; iki ekranda aynı üyeler/oy rejimi ve tek maliyet görülsün. Yeni odada B kurucu olarak ters yönü deneyin. Yanıt sırasında kısa bağlantı kesip dönün; ikinci kabul yeni federasyon yaratmamalı.
2. **Seçilmiş AI ve kayıt:** Üç uygun AI'dan yalnız ikisini seçin; üçüncüsü dışarıda kalmalı. Kabul/ret gerekçelerini okuyun. Bekleyen daveti kayıt edin, uygulamaları kapatıp yeni odadan devam edin; süre/şart/üyeler korunmalı. Davet türünü değiştirmek için eski süreci iptal edin; eski kabul yeni şartlarda geçerli olmamalı.
3. **Kartlar:** SP veya host'ta rastgele/anomali/zincir kartının Seçenekler düğmesine dokunun: modal açılmasın, hız değişmesin. Başlığa basınca tam pencere açılsın. Bir karar seçin: kaynak bir kez değişsin. Kartı kaydırın, durum listesinden tekrar bulun, kayıt yükleyin. Misafirde diplomatik/federasyon kararı çalışmalı; misafire typed-event ödülü uygulanmadığı yukarıdaki eksik kapsamdır.

Sonraki tek geliştirme hedefi: **#27 misafire ait event/anomali/zincir kararlarının host yetkili kimlik/komut ve kayıt devamıyla tamamlanması**. Kullanıcı kabulünden önce bu teslim tam beş görev başarısı veya canlıya hazır nihai sürüm olarak işaretlenmemelidir.
