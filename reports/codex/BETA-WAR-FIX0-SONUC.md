# STARS — BETA-WAR-FIX.0 sonuç raporu

**Geliştirme teslimi; kullanıcı kabulü değildir.** Kapsam yalnız pano #48, #4, #47 ve #6. Ana dal birleştirilmedi; Render'a bağlanılmadı, dağıtım/yeniden başlatma yapılmadı.

## 1. Kanonik kaynak ve GitHub

- Kullanıcının bildirdiği kaynak kod/paket commit'i: `fcb14ddd20f1ca41691487518c8f196b9e8e804c`.
- GitHub'dan doğrulanan gerçek başlangıç: **`731c8df9900e446d7e7de25cc5701e05a1071647`**, `codex/stars-beta-scale0-galaxy-ai-colonies`.
- Aradaki fark BETA-SCALE.0 rapor/pointer teslimidir; oyun kodu ve p12 paketi korunmuştur. Önceki rapor eksikliği bu kaynakta zaten giderilmişti; yeniden yapılmadı. Önceki çalışmalar kullanıcıca onaylanmış varsayılmadı.
- Geliştirme dalı: `codex/stars-beta-war-fix0-peace-notices`. PR tabanı: `codex/stars-beta-scale0-galaxy-ai-colonies`.
- Son kod commit'i: **`05ffb5f657b9f8e9f86f529b65af033fb6b0020f`**. Rapor kendi commit SHA'sını içermez; nihai rapor HEAD'i son sohbet tesliminde ve GitHub dalında doğrulanır.
- PR durumu: **Tek oluşturma denemesi başarısız: `Post "https://api.github.com/graphql": Forbidden`. PR oluşturulmadı. [Doğru karşılaştırma](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-scale0-galaxy-ai-colonies...codex/stars-beta-war-fix0-peace-notices?expand=1). [Ham hata](evidence/beta-war-fix0/pr-create.log)**.
- GitHub kaynak/uzak dal kanıtı: [source-remote-heads-final.txt](evidence/beta-war-fix0/source-remote-heads-final.txt).

## 2. Barıştan sonra toplu savaş: ne kanıtlandı?

Kullanıcının 7 Kasım'daki yaklaşık 140. ay Save8'i verilmedi. Dolayısıyla **20 gerçek saniye sonra yaşanan özgün oturumun kesin nedeni belirlenmiş değildir**. Buna karşılık aynı belirtiyi üreten somut bir mekanizma gerçek p11 kodunda kontrollü olarak tekrar üretildi. [P11 kaynak doğrulaması](evidence/beta-war-fix0/p11-source-proof.json).

Bir senyör ve savaş çağrısı yükümlülüğü bulunan vasalı, bağımsız insan oyuncuyla savaşır. İnsan tarafı sırayla barış yaptığında `vassalJoinWars` ve `vassalTick → overlordDefend`, diğer cephede savaş sürdüğü için eski çağrıyı yeniden uygular. Barışın ilgili eski katılımı çözdüğüne bakılmaz. Aynı seferde `root.playerNotified` önceden işaretli olduğundan yeniden açılan cephe ayrıca bildirilmez.

| Gerçek motor adımı | Oyun günü | P11 kontrolü: AI1/AI2 ile savaş | Aday: AI1/AI2 ile savaş |
|---|---:|---|---|
| İlk savaş | 180 | AÇIK/AÇIK | AÇIK/AÇIK |
| AI1 ile barış | 210 | KAPALI/AÇIK | KAPALI/AÇIK |
| Aylık yükümlülük kontrolü | 240 | AÇIK/AÇIK | KAPALI/AÇIK |
| AI2 ile barış | 270 | AÇIK/KAPALI | KAPALI/KAPALI |
| Sonraki aylık kontrol | 300 | AÇIK/AÇIK | KAPALI/KAPALI |

Kontrolde görünür başlangıç bildirimi sayısı 1'de kaldı. Aday başlangıçta iki gerçek cepheyi ayrı bildirip barışları kapalı tuttu. [Önce](evidence/beta-war-fix0/combined-before/targeted.json), [sonra](evidence/beta-war-fix0/after/targeted.json). Bu deney duvar saatiyle 5/20 saniye iddiası değildir.

## 3. Dört görevin kök nedeni ve minimal değişikliği

| Görev | Kanıtlanan sorun | Değişiklik ve sınır |
|---|---|---|
| #48 Barış sonrası tekrar savaş | Aynı kaynak cepheden yinelenen otomatik vasal/senyör çağrısı ikili barışı geri açıyor | Ortak `declareWar` kapısındaki `warCallSettled`, kapanmış katılımın kaynak cephesi/seferi ve gün/ID sırasını kullanır. Yalnız otomatik vassal/overlord/federation çağrıları; yeni kaynak savaş ve yeni gönüllü savaş taahhüdü geçerli kalır. |
| #4 Durup yeniden başlayan savaş | Yukarıdaki mekanizma gerçek diplomatik bayrağı kapatıp yeniden açabiliyor | Motor düzeltildi; yalnız UI'da savaş gizlenmedi. Meşru %100 yorgunluk ve AI kriz barışı kaldırılmadı. Kullanıcının 5 saniyelik duraksamasının taktik çatışma mı diplomatik durum mu olduğu hâlâ bilinmiyor. |
| #47 AI teklif spamı | `dealValidity` ittifakı örtük barış sayıyor; MP `aiToHuman` reddedilen aynı şartları hemen tekrar oluşturabiliyor | Savaşta bağımsız ittifak reddedilir; açık peace içeren, geçerli barışlı paket sıra bağımsız uygulanır. Barış ortak `makePeace` yolundan bir kez geçer. MP'de yalnız AI kaynaklı aynı reddedilen şartlara mevcut SP 810 günlük ret penceresi uygulanır. İnsan tekliflerine yeni küresel yasak yoktur. |
| #6 Eksik savaş haberleri | Sefer düzeyindeki kilit yeni cepheyi susturuyor; host 0 dışındaki insanın tanımadığı katılımcıyla temas kurulmayınca haber filtresi de olayı atlıyor | Her gerçek cephe `f.playerNotified` ile bir kez bildirilir. İnsan taraflı ilan diplomatik kimlik teması sağlar; harita/filo/istihbarat açılmaz. Misafirde süzülmüş haberden kart, sebep/çağıran; arşivde aynı metadata. MP taraması düşman ID'sinin yanında cephe ID'sini izler. |

**NAP konusunda ayrım:** Normal AI NAP/ittifak üretim kollarında savaş filtresi, NAP quote'unda savaş engeli, SP'de bekleyen teklif tekilleştirmesi/ret penceresi zaten vardı. Bunlar yeniden yazılmadı. Kullanıcının gördüğü gerçek NAP kartının savaş öncesi/geçici barış penceresinde mi üretildiği kayıt olmadan bilinmiyor. Eski teklif kabul edilirken güncel quote tekrar denetlenir. "AI savaşta neden NAP gönderdi" sorusu özgün oturum için kapanmış sayılmaz.

## 4. Barış kapsamı, kayıt ve bildirim davranışı

- İkili barış yalnız ilgili çifti ve mevcut vekil savaş kurallarının bitirdiği cepheleri kapatır. Diğer devletlerle savaş varsa oyuncuya açıkça belirtilir; bütün savaşlar bitti denmez.
- Eski kayıt kapalı cephe defteri taşımıyorsa gerçek `warSince/peaceAt` tarihleri kullanılabilir. Hem geçmiş hem tarihler eksikse kesin eski çağrı eşleştirmesi mümkün değildir; bilgi uydurulmaz.
- Yeni doğrudan savaşlar, gerçekten yeni kaynak savaşlar, yeni gönüllü savaş sözleri korunur. Genel bir yeniden savaş yasağı veya yeni AI savaş katsayısı eklenmedi.
- `declareWar` dışındaki normal devlet savaşları günlük sync'te gözlenirse olay başlangıcı olarak bildirilir; bilinmeyen başlatma ayrıntısı belirtilir. Yüklemede eski aktif savaşlar yeni ilan diye tekrar gösterilmez.
- Kriz devleti doğarken her insan için kişiye özel savaş haberi ve üst bildirim oluşur. Kriz, normal devletler arası savaş defterinden ayrı kalır.
- Üst kartlar aynı cepheyi tekrar etmez. Misafirde ayna yenilenince canlı kart ve teklif/oy kartlarının anahtar → UID kimliği korunur. Kaydırılarak kapatılmış kartlar geri üretilmez. Haber arşivi mevcut sınırlı geçmiş politikasını kullanır.
- Haber, savaş cephesi ve bitiş nedeni/aktör/gün mevcut ledger'da kalır. Yeni yanıtsız AI teklifi kopyaları engellenir; ret penceresi sonrası yeniden değerlendirme mümkündür. İnsanlar arası teklif sistemi aynı kalır.
- Geçmiş doğrudan barış kayıtlarında ayrı kabul eden alanı yoksa bunun kim olduğu uydurulmaz. MP teklif kaydındaki from/to, accepted durumu ve host ACK'si ilgili kararın kanıtıdır.
- Soğuk yeni odada MP'nin özel `newsBy` deposu boşalıyordu: önce gerçek kayıt testinde kendi savaş geçmişi kayboldu. Yalnız oyuncunun taraf olduğu mevcut ledger cepheleri gerçek açılış/bitiş günleriyle yeniden yansıtılır; diğer oyuncuların/host'un özel haberleri kopyalanmaz. Mevcut 80 satır sınırı korunur. Eski kesin tarihi bilinmeyen cepheye tarih uydurulmaz. Kriz için yalnız gerçekten kaydedilmiş başlangıç olayı ve gerçek katılım kullanılır. Save8/paket alanı eklenmedi; normal kayıt baytları değişmez.
- Aynı gün ve aynı şartlarla oluşturulmuş iki farklı MP barış teklifi, eski `signature + born` anahtarı yüzünden kapanmış aynı Gelen Kutusu kaydına bağlanabiliyordu. Gerçek ikinci barış dokunması kabul düğmesine ulaşamadı. Artık kesin MP teklif ID'si kullanılır; eski kayıtlar yalnız kendi kodlanmış `mp71:<id>` notuyla taşınır. Host işlemi de yetkili teklifin kesin kaydını kullanır; SP varsayılan yolu değişmez.
- Son regresyonda kart UID'si geri yüklense bile önceki ara `inboxOffers/UI.refresh` çizimi düğmeyi DOM'dan kaldırıyordu. Gerçek tarayıcıda aynı UID'li düğümün değişmesi kanıtlandı. Kimlikler çizimden önce geri yüklenir; kurulum içindeki ara çizim ertelenir. Düğüm eşitliği, gerçek kaydırma, hızlı çift dokunma ve AI barış kabulü tekrar doğrulanır.

## 5. Testler: PASS / FAIL / NOT RUN

Ortam: Node 24.22.1, Chromium 155.0.8059.79, Playwright 1.62.1. Tarayıcılar sırayla, yerel relay/TLS altyapısında çalıştırıldı. Locator timeout'ları artırılmadı; force, sahte JS click veya başarısızlık yakalayıp PASS yazma kullanılmadı.

| Test / kapsam | Gerçek sonuç | Kanıt |
|---|---|---|
| Hedefli gerçek motor senaryoları | PASS 17/0 | [unit-final.log](evidence/beta-war-fix0/unit-final.log) |
| MP teklif kesin kimliği / tekrar kabul | PASS 1/0 | [offer-final.log](evidence/beta-war-fix0/offer-final.log) |
| AI MP ret penceresi / yeniden değerlendirme | PASS 1/0 | [mp-cooldown-after.log](evidence/beta-war-fix0/mp-cooldown-after.log) |
| Temassız insan savaş haberi / harita gizliliği | PASS 1/0 | [mp-contact-after.log](evidence/beta-war-fix0/mp-contact-after.log) |
| Misafir haber ayrıntısı / çağıran gizliliği | PASS 1/0 | [news-detail-after.log](evidence/beta-war-fix0/news-detail-after.log) |
| Kart yeni dünya / aynı cephe tekrar kontrolü | PASS 1/0 | [lifecycle-final.log](evidence/beta-war-fix0/lifecycle-final.log) |
| Soğuk paket, kendi tarihçe / kriz / 80 satır / Save8-RNG | PASS 3/0 | [history-packaged.log](evidence/beta-war-fix0/history-packaged.log) |
| MP.3 host yetkisi / özel teklif gizliliği | PASS 11/0; eski fikstür 10/1 hem kontrolde hem adayda | [mp3-final-accepted.log](evidence/beta-war-fix0/mp3-final-accepted.log) |
| MP.4 kayıt/paket bütünlüğü | PASS 14/0 | [mp4-final-accepted.log](evidence/beta-war-fix0/mp4-final-accepted.log) |
| MP.7.1 teklif köprüsü / eski ID geçişi | PASS 9/0 | [mp71-final.log](evidence/beta-war-fix0/mp71-final.log) |
| Tam MP.7.3: üç insan, Konsey EVET/HAYIR | PASS 8/0 | [mp73-accepted.log](evidence/beta-war-fix0/mp73-accepted.log) |
| A1 + P01/P03/P04 kritik SP/MP kabul | PASS 4/0 | [mp73-critical.log](evidence/beta-war-fix0/mp73-critical.log) |
| PWF gerçek dokunma, aynı DOM, iki barış / yeni yan cephe / tekrar bağlantı | ÖNCE FAIL 1/1 → SON PASS 2/0 | [card-dom-after.log](evidence/beta-war-fix0/card-dom-after.log) |
| MP.7.4 kart/lobi/kaydırma/çift dokunma | ÖNCE FAIL 5/2 → SON PASS 7/0 | [mp74-dom-fixed.log](evidence/beta-war-fix0/mp74-dom-fixed.log) |
| MP.7.5 AI barışı / arayüz / olaylar | ÖNCE FAIL 4/2 → SON PASS 6/0 | [mp75-dom-fixed.log](evidence/beta-war-fix0/mp75-dom-fixed.log) |
| MP.8 N ağ kopma/kurtarma | PASS 9/0 | [mp8-N-accepted.log](evidence/beta-war-fix0/mp8-N-accepted.log) |
| MP.8 R: üç insan, 5 AI; 6+6 ay, süreç/relay kapanır, yeni oda, aynı devlet/teklif/war/ledger, kendi haber geçmişi, özel veri, çift kabul engeli | ÖNCE FAIL 3/2 (sıfır geçmiş fikstürü) → SON R0–R4 PASS 5/0 | [mp8-R-history-fixed.log](evidence/beta-war-fix0/mp8-R-history-fixed.log) |
| Gerçek eski p12 paket / bozuk paket reddi / 500-16 m120→121 aynı kod ve eski SP yolu Save8-RNG | PASS 2/0; iki bağımsız aday + 002cad kontrolü | [save-final-accepted.log](evidence/beta-war-fix0/save-final-accepted.log) |
| PERF.1 / PERF.2 ham eşdeğerlik | PASS 4/0 + 5/0 | [perf2-packaged.log](evidence/beta-war-fix0/perf2-packaged.log) |
| MP.8.6 piksel/önbellek native | PASS 3/0 | [nebula-final.log](evidence/beta-war-fix0/nebula-final.log) |
| Konsey çekirdek / savaş bitişi / savaş görünürlüğü | PASS 14/0 + 5/0 + 34/0 | [war-visibility.log](evidence/beta-war-fix0/war-visibility.log) |
| Korsan OFF / kapı-kriz / üretken isimler | PASS 10/0 + 12/0 + 9/0 | [gates.log](evidence/beta-war-fix0/gates.log) |
| İki farklı misafir ID ayna / SP panel / SP haber kimlikleri | PASS 2/0 + 3/0 + 1 paket (10 olay türü) | [sp-news-final.log](evidence/beta-war-fix0/sp-news-final.log) |
| Fiziksel Android / gerçek kullanıcı PC kabulü / LAN / internet MP / Render | NOT RUN | — |
| Yeni 500/16 uzun kampanya, 150 ay tam son matris, Ctrl zoom / genel PC ekran kampanyası, Docker build | NOT RUN; 500/16 yalnız mevcut kayıtla dar devam | — |

### Uzun kampanyalar

Node gerçek günlük/aylık motor yolu, başlangıçta geçerli kontrollü savaş ve 60. ayda hâlâ savaş varsa uygun barış; doğal AI simülasyonu devam eder. Başlangıçta p12 kontrolüyle **ham Save8 ve RNG** aynılığı doğrulanır. Seed11'de her boyutta ilk 6 ayın iki bağımsız aynı-kod koşusunda ham Save8/RNG birebirdir.30/120 ay kontrolünde gerçek gün ve Save8 yeniden yükleme savaş/kimlik/RNG değerleri sınanır. Oyun bitişi zorla ertelenmez.

| Sistem / AI | Seed | Gerçek ay / örnek | Sonuç | Süre (s) | Son Save8 (bayt) |
|---|---:|---:|---|---:|---:|
| 100 / 9 | 11 | 120 / 120 | PASS | 46.5 | 982789 |
| 100 / 9 | 23 | 120 / 120 | PASS | 37.8 | 884470 |
| 100 / 9 | 42 | 120 / 120 | PASS | 52.5 | 1107012 |
| 100 / 9 | 99 | 120 / 120 | PASS | 59.4 | 979121 |
| 100 / 9 | 404 | 120 / 120 | PASS | 48.6 | 953342 |
| 200 / 16 | 11 | 120 / 120 | PASS | 183.1 | 1689968 |
| 200 / 16 | 23 | 120 / 120 | PASS | 248.5 | 1847511 |
| 200 / 16 | 42 | 120 / 120 | PASS | 217.6 | 1784345 |
| 200 / 16 | 99 | 120 / 120 | PASS | 163.8 | 1683278 |
| 200 / 16 | 404 | 120 / 120 | PASS | 185.4 | 1685420 |

Kampanyaların kaydedilmiş motor SHA değerleri `002cad426f0e165d828ef3e32a63502d8a36e6bb` koduna aittir. Son MP teklif kimliği değişikliğinin SP varsayılan yoluna etkisizliği aynı gerçek 500/16 kaydında 120→121 ay için bu kontrolle ham Save8/RNG karşılaştırılarak ayrıca PASS doğrulandı. DOM/özel haber değişiklikleri misafir/MP katmanındadır; 10 uzun kampanya gereksiz yere tekrarlanmadı.

[Son kampanya verileri](evidence/beta-war-fix0/campaign-final/results.json). Bunlar PC FPS veya fiziksel Android performansı değildir; yeni performans kazanımı iddiası yoktur. 500/16 için mevcut gerçek 120. ay kaydıyla yalnız dar devam/eşdeğerlik kontrolü yapılır; yeni büyük galaksi kampanyası başlatılmaz.

### İlk FAIL'ler korunmuştur

[FAIL günlüğü](evidence/beta-war-fix0/FAIL-GUNLUGU.md) özgün hataları, ekranları ve sınıflandırmayı listeler. Önemli sonuçlar:

- P12 ilk hedefli kontrol 1 PASS / 5 FAIL; P11 birleşik senaryo barıştan sonra iki savaşı bildirimsiz geri açtı.
- Yeni MP yardımcısının ilk unknown-kind hatası test komut adıydı; gerçek `offer` kullanıldı.
- Erken kart koruması UID çakışması/yeniden üretimi oluşturdu; ürün adayındaki bu regresyon anahtar bazında kimlik korumasıyla giderildi. İlk birleşik MP73 koşusu **7 PASS/5 FAIL** olarak kalır. Temiz tam koşu 8/0; ayrı kritik koşu 4/0; yeni kabul ayrı oturumdadır. Tarihsel `#jEditMe` hatası kapanmış sayılmadı.
- Eski tek-sefer-bildirimi testi 33/1 verdi. Kullanıcının yeni şartına göre üç ayrı cephe/tek sefer/üç benzersiz kimlik sıkı doğrulandı; son 34/0. Assertion kaldırılmadı.
- Seed99 ilk 130. ay ham asimetri kontrolü FAIL: yok olmuş devlet 5'in geçmiş bayrağı kalmış, yaşayan 9'da savaş kapanmış; ledger aynı gün `eliminated` ile kapalı. [Alan farkı](evidence/beta-war-fix0/seed99-asymmetry.json), [tanı](evidence/beta-war-fix0/SEED99-TANI.md), tam başarısız Save8 saklıdır. Ürün verisi silinmedi/normalize edilmedi. Son kampanya yaşayan taraf simetrisini ve ölü taraflı aktif cephe bulunmamasını denetler; ham artıkları ayrıca kaydeder.
- İlk 200/16 seed11 koşusu 150 ay hedefinde 119 ayda işlem bütçesi nedeniyle BLOCKED kaldı; PASS sayılmadı. Son koşuda promptun istediği 120 ay **gerçekten** tamamlandı. Playwright bekleme süresi değiştirilmedi.

- Son MP74 5/2 ve MP75 4/2 FAIL'leri kartın önce geçici UID ile çizilmesinden kaynaklanan gerçek aday regresyonunu yakaladı. Yeni `card-dom-before.log` aynı UID'li DOM düğümünün değişmesini doğrudan FAIL kanıtladı; `card-dom-after.log` 2/0, MP74 7/0, MP75 6/0 PASS. Orijinal hatalar/snapshot'lar saklıdır.
- Gerçek ikinci MP barışında kabul düğmesi bulunamadı (`mp-acceptance-final.log` 1/1). Aynı gün/şartın kapanmış kaydı yeniden kullanması kesin MP ID ile düzeltildi; güçlü tekrar/tek uygulama testleri PASS.
- MP3 ilk 10/1, sabit yalnız iki teklif varsayımı nedeniyle p12 kontrolde de 10/1 verdi. Test, işlem öncesi gerçek özel teklif kümesini saklayıp yalnız iki yeni kimliğin eklendiğini ve eski kayıtların değişmediğini karşılaştıracak şekilde düzeltildi. Üçüncü oyuncuya sızıntı ve yabancı teklif ID reddi assertion'ları korundu; 11/0 PASS.
- R tarihçe kabulü ilk 3/2: orijinal siyasi fikstür yalnız host'a savaş açtığı için misafir geçmişi örneği sıfırdı. Yeni opsiyonel test kurulumu gerçek `declareWar` ile misafire de savaş açar; sıfır örnek assertion'ı aynen korunur. Soğuk oda/gerçek özel geçmiş kontrolü dahil R0–R4 5/0 PASS. Önceki 3/2 sonuç silinmedi.
- Soğuk geçmiş testi düzeltme öncesi `[]` döndürdü; kanıt gerçek özel savaş geçmişinin kaybıdır. Ürün yalnız kendi ledger olaylarından sınırlı geçmişi kurar, host'un özel haberlerini kopyalamaz.
- `save-reg-id-fixed.log` içindeki `spawnSync git EPERM` ortam kısıtıdır. Aynı kontrolün doğrulanmış mevcut kaynak dizinleri açıkça verilerek yapılan koşusu ham Save8/RNG 2/0 PASS; ağ/izin değiştirilmedi. Bir Python düzenleme komutunun girinti hatası ve bunun arkasından başlayan tanısız koşunun kesilmesi de son kabul sayılmaz.

## 6. Save8, RNG, MP ve önceki geliştirmelerin korunması

Save8 **v8**, MP paket **4**, protokol **1** korunur. Yeni kalıcı şema alanı eklenmedi; mevcut ledger, peaceAt/warSince, teklif geçmişi ve yerel kart kimlikleri kullanılır. Eski Save8 isim/ID'leri yeniden üretilmez. Gerçek p12 MP paketi uyumu ve bozuk bütünlüğün reddi ayrıca sınanır.

Bugün düzeltilen savaş kararları ve sunum bayrakları gerçekleştiğinde eski hatalı sürümle bütün kampanyanın Save8 baytları/RNG'si aynı diye bir iddia yoktur. Bilerek farklılaşması gereken eski yeniden savaş yolu düzeltilmiştir. Stratejik RNG'ye yeni çekim eklenmedi. Başlangıç ham aynılığı, aynı kod tekrarları, PERF.1/PERF.2 ayrı eşdeğerlik kontrolleri ve kayıt sonrası RNG denetimleri raporlanır. Hash farkını gizlemek için alan silme/normalizasyon yapılmadı.

AI strateji, ekonomi/savaş katsayıları, harita üretimi, devlet ID sınırları, araştırma, isim jeneratörü, korsan/kapı ayarı ve koloni otomasyon motoru değiştirilmedi. BETA-SCALE.0'ın mevcut 500 sistem/16 AI kabul sınırı genişletilmedi. Başlangıç kolonileri ve eski manuel otomasyon OFF tercihleri korunur. Host tek yetkilidir; misafir kararının tekrarı host'ta ikinci uygulama üretmez. Harita görüşü ve gizli istihbarat gevşetilmedi.

Konsey paneli/oy, insan ambargosu, yorgunluk/kriz barışı ve önceki MP korumaları ilgili regresyonlarla sınandı. #25 filo kaybı, #24 enerji, #10 MP hız sorunu geliştirilmedi/kapanmadı.

## 7. Dosyalar, paket ve dağıtım sınırı

- `diplomacy.js`: kapanmış çağrı kapısı, cephe bildirimi, insan teması, barış kapsamı, açık barış maddesi/tek uygulama, süzülmüş savaş metadata'sı.
- `main.js`: kriz savaş haberi/bildirimi ve build kimliği. `ui.js`: katılım türü/çağıran adı. `archive-ui.js`: misafir haberindeki katılım metadata'sı.
- `inbox.js`, `diplomacy.js`, `research/mp71/client/mp71-dip.js`: kesin MP teklif kimliği, eski kesin not-ID geçişi ve tek uygulama.
- `research/mp0/mp-core.js`: cephe kimliği taraması, AI ret penceresi, kısmi barış özeti, kendi kayıtlı savaş geçmişi projeksiyonu, p13 için açık eski paket uyum listesi.
- `research/mp6/mirror.js`: yalnız izinli sponsor kimliğinin çevrimi. `research/mp6/client/guest-stars.js`: haber kartı ve canlı UID korunumu; piksel önbelleği değişmedi.
- MP sürüm işaretleri `view.js/relay.js`, PWA `sw.js`, manifest, ilgili hedefli testler ve tam metin/SHA koruma adaptörleri.

Oyun **96h10p13**, PWA **stars-v96h10p13**, MP **MP.8.9b8**. Yerel endpoint/oyun/MP sürümü Chromium'da denetlendi. Docker mevcut kopyalama yolları değişen MP dosyalarını kapsar; gerçek Docker build/Render dağıtımı bu fazda NOT RUN.

- ZIP: [stars-faz96h10p13.zip](../../releases/stars-faz96h10p13.zip); **788306 bayt**.
- SHA-256: `e1f0b4a318df37275bcf40ae7e76c1c93752c05c01f5b103d9b3a2e208a13b6d`.
- Tam ZIP CRC32: `267D32F9`; bütün üye CRC kontrolleri PASS.
- Manifest SHA-256: `011cb8ca35277fd993a1b46d02722f00dc9993cf6f2b84219bd108e25bd47645`.
- İki bağımsız deterministik ZIP üretimi: **bayt bayt eşit / PASS**.

[Manifest](../../RELEASE-MANIFEST.json), [değişen runtime dosyalarının önce/sonra SHA-256 değerleri](evidence/beta-war-fix0/runtime-sha256.json), [paket doğrulaması](evidence/beta-war-fix0/RELEASE-VERIFIED.json). ZIP 19 oyun dosyası + manifest içerir. MP relay/istemci kaynakları geliştirme dalındadır; bu oyun ZIP'i tek başına canlı MP sunucusunun dağıtımı değildir. Önceki paketler korunur.

## 8. GitHub #33 ve kabul durumu

#33'e yalnız #48/#4/#47/#6 için başlangıç ve sonuç güncellemesi gönderme denemeleri `Post "https://api.github.com/graphql": Forbidden` ile reddedildi. API kısıtları aşılmadı. **Uzaktaki pano durumu bu oturumda değiştirilemedi/doğrulanamadı**; prompttaki PROMPT HAZIR bilgisini güncel doğrulanmış durum diye sunmuyoruz. Sonuç için önerilen aşama **RAPOR GELDİ / TEST BEKLİYOR**; gerçek kayıt/cihaz kabulü eksik olduğundan bu dört görevi otomatik KULLANICI ONAYI BEKLİYOR veya TAMAMLANDI yapmadık. [Sonuç API hatası](evidence/beta-war-fix0/issue-final.log); [elle uygulanabilir sınırlı sonuç yorumu](evidence/beta-war-fix0/ISSUE33-SONUC-YORUMU.md). Git push başarısı API yazma yetkisi anlamına gelmez.

Diğer 44 görevin açıklaması/önceliği/durumu değiştirilmedi. Hiçbir görev TAMAMLANDI yapılmadı. #37/#45 yeniden geliştirilmedi. Yeni ortam, izin değişikliği, force-push, rebase, main merge veya Render işlemi yapılmadı.

## 9. Açık kalanlar ve üç kullanıcı PC testi

1. **Eski 140. ay kayıt:** A ve B ile sırayla barış yap; birkaç oyun ayını hız/gün bilgisiyle izle. Yeniden savaş varsa kart/haber/cepheID/çağıran/neden ile önce/sonra Save8'i sakla. Bu kayıt olmadan özgün 5/20 saniye vakası çözüldü denmez.
2. **AI teklifleri:** Savaşta eski NAP/ittifak kartının güncel şartla kabul edilemediğini, açık barış içeren anlaşmayı, ret sonrası aynı şartların hemen dönmediğini kontrol et. Teklifin oluşturulduğu gün ve bütün maddeleri kaydet.
3. **İki insan:** Aynı adayla yeni yan cephe bildirimi, vasal/federasyon çağrısı sonrası ikili barış, diğer cephenin açık kalması, kayıt/yeni oda ve yeniden bağlantıyı kontrol et. Yeni odada kendi kayıtlı savaş geçmişini ve üçüncü taraf gizliliğini ayrıca gözle.

[Manuel kabul planı](evidence/beta-war-fix0/KULLANICI-KABULU.md). Fiziksel Android, gerçek kullanıcı PC'si, LAN/internet ve canlı Render **NOT RUN**. Varsayımsal tarihsel savaş bilgisi eklenmedi. Eski kayıtta hem kapanış defteri hem kaynak savaş/barış tarihleri yoksa kesin çağrı eşleştirmesi açık risktir. Aynı devam eden savaşa yeni federasyon kararıyla gönüllü tekrar katılmanın kapsamlı tasarım kabulü bu fazda ayrı bir özellik olarak yapılmadı; yeni doğrudan savaş/yeni kaynak/yeni gönüllü promise kontrolleri geçerlidir.

## 10. Sonuç

Kontrollü olarak kanıtlanan barış geri açılması, yeni cephe bildiriminin sefer kilidinde kaybolması, misafirin temassız yan cephe haberinin süzülmesi, savaşta örtük ittifak-barış ve MP ret tekrarı düzeltildi. Gerçek kullanıcı oturumunun kesin teşhisi ve fiziksel kabul açık kalır. **Geliştirme raporu teslimidir; kullanıcı kaydı/cihaz testi ve kabulü bekler. Görev panosu açısından TEST BEKLİYOR önerilir; main veya canlı yayın onayı değildir.**
