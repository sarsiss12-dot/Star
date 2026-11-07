# STARS — BETA-SETUP.1 sonuç raporu

**Yerel geliştirme/kabul PASS; fiziksel kullanıcı kabulü ve yayın onayı yok.** Kapsam yalnız kanonik #33 panosunun **#42 Pregame galaksi ayarları** görevidir. Yeni vasallık, federasyon, savaş pazarlığı, casusluk, geçit türü veya stratejik mekanik geliştirilmedi.

## 1. Kanonik kaynak, başlangıç ve bitiş HEAD

- Kaynak: `sarsiss12-dot/Star`, `codex/stars-beta-ux0-names`.
- Beklenen, fetch/FETCH_HEAD ve uzak ref ile doğrulanan başlangıç: **`eea55b2ddfae7de8f631eb43eb606585224f64d6`**; son kontrolde de değişmedi. Daha yeni kaynak commit'i yoktu.
- Çalışma dalı: **`codex/stars-beta-setup1-galaxy-options`**. PR tabanı BETA-UX.0 dalıdır; main kullanılmadı.
- Push sonrası uzak ref ile doğrulanan kod/test/paket bitiş HEAD: **[`50e244b0a7c2ebbd1defe5b9e1b6090e13b434a6`](https://github.com/sarsiss12-dot/Star/commit/50e244b0a7c2ebbd1defe5b9e1b6090e13b434a6)**.
- Bu sonuç raporu, son GitHub hata kayıtları ve iki kapılı ikmal/misafir uzaktan ret kabulünün ek kanıtları takip commit'indedir. Bir commit kendi SHA'sını önceden bilemez; nihai teslim HEAD'i son sohbet mesajında ve doğrulanmış uzak dalda verilir. SHA eklemek için commit döngüsü yapılmaz.
- [GitHub raporu](https://github.com/sarsiss12-dot/Star/blob/codex/stars-beta-setup1-galaxy-options/reports/codex/BETA-SETUP1-SONUC.md) · [Kanıtlar](https://github.com/sarsiss12-dot/Star/tree/codex/stars-beta-setup1-galaxy-options/reports/codex/evidence/beta-setup1).
- Main merge, rebase, force-push, Render bağlantısı/deploy/restart, yeni ortam veya izin değişikliği yapılmadı.

Başlangıçtaki dar fetch refspec'i `origin/codex/...` takip ref'ini üretmedi; ilk ref araması bu nedenle başarısızdı. Fetch'in getirdiği SHA, local HEAD ve `ls-remote` eşitliği doğrulanıp dal doğrudan doğru SHA'dan oluşturuldu; eski main'e geçilmedi.

## 2. Bütün Pregame ayarları — gerçek etki matrisi

**Yöntem:** önce sabit p10 kontrol kökü, sonra aday. Seed **11/23/42/99/404**; aynı anda tek alan değişen **210** başlangıç/Save8 vakası. Şiddet KAPALI + zamanlama NORMAL çelişkisini temsil eden beş eski hatalı kurulum dışında **205** vakada p10 kontrolüyle başlangıç **ham Save8 baytları aynı**. Her vakanın CFG/G.cfg, kaynak, AI gelirleri, kimlikler, başkentler, coğrafya SHA'sı, kalıntı, korsan ve kriz durumu [options/audit.json](evidence/beta-setup1/options/audit.json) içinde.

Tablodaki **UI/CFG/S**: gerçek yatay Chromium seçimi → CFG → G.cfg → Save8 yeniden yükleme. **MP**: 42 ayrı ayar varyantında gerçek `StarsMirror.build`/gizlilik denetimi; ayrıca temsilci host/misafir Chromium akışında bütün kamu ayarları eşit. Tohumun gizlilik istisnası aşağıda açıklanır. Kontrol yalnız kaynakta `if` aramakla yapılmadı.

| Ayar | Açıkken / seçiliyken gerçek etkisi | Kapalıyken / diğer değerler | Kod referansı | Gerçek test sonucu |
|---|---|---|---|---|
| Korsan Tehdidi | Yuva, başlangıç muhafızı ve sonraki korsan üretimi/baskını açık | Yuva/filo/doğum/baskın/Korsan Çağı yok; teknik wildId, kalıntı savunması, canavar ve ayrı kriz korunur | `main.js:setupGame/wildTurn/repairDisabledPirates`, `commerce.js` | UI/CFG/S/MP PASS; önceki hedef10/0; OFF120ay sıfır; yeniden yazılmadı |
| Yıldız Kapıları | Sonradan inşa edilir; izinli iki kapı 0,1 rota maliyeti; kullanılabilir kapı/komşusu tam ikmal | Yeni yerel/uzak/AI/MP inşa engelli; kaynak harcanmaz; rota ve kapı ikmali yok; eski yapı silinmez | `main.js:structAllowed/startStruct/hasUsableGate/isSupplyNode/findPath/stepFleets`, `construction.js:gate` | Önce FAIL, sonra kapı12/0, SP gerçek tap2/0, MP kabul PASS |
| Rastgele Olaylar | Pasif imparatorluk olayları, rastgele hikâye zinciri ve galaktik çalkantılar | Bunlar kapanır; diplomasi, savaş/barış, casusluk, isyan, keşif, Konsey/federasyon ve ayrı galaktik kriz çalışır | `main.js:maybeEvent/upheavalTick/monthTick`, `diplomacy.js` | UI/CFG/S/MP PASS;100 gerçek RNG'li olay denemesi/200 çalkantı tikinde ON oluşum, OFF sıfır ve RNG tüketimi yok;8/0 eski regresyon |
| AI Rastgele Kökenleri | Her normal AI, dört dengeli özel köken havuzundan bağımsız seçim yapabilir | Normal AI `standart`; oyuncunun seçtiği köken değişmez; Altın Çağ rastgele havuzda yok | `main.js:assignAIOrigins/AI_RANDOM_ORIGINS` | UI/CFG/S/MP PASS;27/0 köken regresyonu; isimler korunur |
| AI Köken İhtimali | %20/%35/%60/%100 bağımsız eşikler; kota değildir | AI kökenleri kapalıysa oran düğmeleri pasif ve özel atama yok | `main.js:aiOriginChance/assignAIOrigins`, `ui.js:setupClickHandler` | 19seed×11AI=209 örnek/oran:43/69/128/209 özel köken; UI/CFG/S/MP PASS |
| Kriz Şiddeti | NORMAL mevcut bütçe; ACIMASIZ dalga güç bütçesi×2, mevcut gemi sınırları geçerli | KAPALI yeni/bekleyen krizi başlatmaz; önceden aktif eski kriz sessiz silinmez | `main.js:initCrisis/crisisTick/spawnCrisisWave`, `ui.js:crisisPower` | Eski çelişki FAIL→PASS; gerçek dalga ölçümü; UI/CFG/S/MP PASS |
| Kriz Zamanlaması | ERKEN110–150, NORMAL150–200, GEÇ230–290, SON OYUN930–1020. ay pencereleri | KAPALI yeni kriz yok. UI'da zamanlama yeniden açılırsa kapalı şiddet NORMAL olur; şiddet KAPALI zamanlamayı da kapatır | `main.js:CRISIS_WINDOW/initCrisis`, `ui.js:crisisSet` | Beşseedde gerçek takvim pencereleri; eski UI çelişkisi1/1 FAIL→yeni8/0 grup içinde PASS; UI/CFG/S/MP PASS |
| Galaktik Konsey | Erken kuruluş Pasifist2/temas/etki koşuluyla;100.aydan itibaren en az üç temaslı uygun devletle kongre; SIK12/NORMAL18/SEYREK30 aylık gündem aralıkları | KAPALI kuruluşu engeller; ayrı diplomasi işlemleri kapanmaz | `diplomacy.js:canFoundCouncil/foundCouncilByConvention/councilTick/councilPaceMonths` | Dört ayarda gerçek kuruluş kontrolü;3 gerçek konsey tiki12/18/30; çekirdek14/0 ve MP oyu PASS; UI/CFG/S/MP PASS |
| Kayıp Uygarlık Kalıntıları | AZ/ORTA/ÇOK: uygun boş ve uzak sistemlerde **en çok2/4/7**; savunma ve beş gerçek ödül türü | YOK bağımsız kalıntı alanı oluşturmaz; oyuncunun Kalıntı kökeninin başlangıç anomalisi ayrı mekaniktir | `main.js:initRuins/ruinDefense/ruinReward/RUIN_LEVELS` | UI/CFG/S/MP PASS; gerçek hp/savunma/ödül etkisi ölçüldü. Seed11 ÇOK=4,7 vaat edilmez |
| Galaksi Boyutu |30/45/60/80/100 gerçek sistem | Boolean kapalı durumu yok; AI sayısından bağımsız | `main.js:SIZES/generateGalaxy/galaxyScale` | Beşseed×beşboyut tam sistem sayısı; yoğun/küçük ve seyrek/büyük başlangıçları PASS; UI/CFG/S/MP PASS |
| Galaksi Şekli | Sarmal kollar, halka dağılımı veya kümeler; aynı seed+şekil aynı coğrafya | Boolean kapalı durumu yok; şekil değişince gerçek koordinatlar değişir | `main.js:SHAPES/generateGalaxy` | Beşseed×üçşekil koordinat SHA'ları/tekrar; UI/CFG/S/MP PASS |
| AI Devlet Sayısı |1–11 normal AI, boyuttan bağımsız SP seçimi; MP lobby seçimi AI sayısıdır | Boolean kapalı yok; az seçimi büyük galaksiyi küçültmez | `main.js:aiCountFor/setupConfigError/setupGame`, `research/mp0/mp-core.js:design start` | Küçük30+11AI:12 ayrı başkent; Ulu100+1AI:2 ayrı başkent; UI/CFG/S/MP PASS. MP iç temsil notu aşağıda |
| Zorluk | Oyuncu başlangıç kaynakları×1,35/1/0,85/0,70; AI saldırganlık ve üretim modifier'ları değişir | Boolean kapalı yok; NORMAL temel değerler | `main.js:DIFFS/setupGame/recalcMods` | Dört zorlukta gerçek kaynak/AI gelir/saldırganlık değerleri kaydedildi; UI/CFG/S/MP PASS. Fizyolojiyle birleşme notu aşağıda |
| Galaksi Tohumu | Aynı seed+aynı yapılandırma aynı dünya/kimlik/ad/RNG; YENİ TOHUM farklı seed seçer | Boolean kapalı yok | `main.js:generateGalaxy/setupGame`, `ui.js:seed`, `research/mp6/mirror.js:cosmeticSeed` | Beşseed bağımsız başlangıç tekrarları PASS; UI/CFG/S PASS. MP aynı dünya geometrisini alır, **gerçek seed/RNG gizlenir**, eşit seed göndermek amaçlanmaz |

**Zaten doğru çalışanlar:** korsan SETUP.0 onarımı, rastgele olay kapsamı, AI köken aç/kapa/oranı ve güvenli havuzu, boyut/şekil/bağımsız AI sayısı, seed determinizmi, zorlukta gerçek kaynak/gelir etkisi ve Konsey ayarının motor davranışı. Bunların kuralları yeniden yazılmadı.

**Gerçek sorunlu olanlar:** kapalı kapı inşa/uzak sipariş/AI ve tek başına eski kapının ikmal kaynağı olması; kapalı kriz şiddeti ile açık zamanlamanın çelişkisi; MP görünür tamamlanmış yapı sahibinin eksik kimlik dönüşümü.

**Yalnız açıklaması düzelenler:** kapıların hazır ağ olmadığı/ulaşımın anlık olmadığı; genel “Kapalı özellikler hiç görünmez” iddiası; kriz takvim yılları ve “iki kat filo” ifadesi; kalıntı sayılarının üst sınır olması; Konsey'in kongreyle de kurulması; kalıntı mega ödülünün yanlış %50 iddiası.

## 3. Yıldız kapısı kök nedenleri ve önce/sonra ölçümleri

1. `hasUsableGate` zaten `G.cfg.gates===false` kontrolünü yapıyordu. **`structAllowed` yapmıyordu**. Dolayısıyla UI listesi, `startStruct`, AI seçim filtresi ve uzaktan görev, çalışmayacak kapıyı kabul ediyordu.
2. `isSupplyNode`, sahipsiz sistemde yalnız kendi `built.kapi` kaydı varken bile “kendi uzay yapısı” genel kuralından ikmal veriyordu. Kapalı kapının bu yan etkisi de engellendi. Kendi toprakları veya başka gerçek ileri üs yapıları, kapıdan bağımsız mevcut ikmalini korur.
3. Gerçek MP ilk kabulü, kapının guest sahibi0 olmasını beklerken timeout verdi. `StarsMirror.build` sistem sahibi ve `work.e` alanlarını π dönüşümünden geçiriyor; `built.<yapı>` sahiplerini ham bırakıyordu. İnsan1 ve insan2 kendi tamamlanmış kapılarını misafir aynasında yanlış kimlikle görüyordu. Mevcut görünür alanlara yalnız aynı π dönüşümü eklendi; yeni bilgi veya paket alanı eklenmedi.

Değiştirilmemiş p10 motorunda **5 PASS /7 FAIL**: host0 ve başka devlet1 kapalı inşaatı, uzaktan sipariş, AI seçimi, eski tek kapının ikmali ve iki kapalı kriz vakası. [Önce](evidence/beta-setup1/before/results.json). İlk doğrudan inşa denemesinde kaynaklar **100.000→99.132 maden**, **100.000→99.634 alaşım**;536 günlük iş kuyruğu oluştu, kapı kullanımı false kaldı. Bu maliyetler ilgili devletin mevcut modifier'larıyla hesaplanmıştır; taban900/380 ayrı değerdir.

Düzeltme sonrası aynı kontroller **12/0 PASS**; [nihai kapı kabulü](evidence/beta-setup1/gates-final/results.json). Yeterli kaynakta kapalı ret **sıfır harcama/sıfır yeni kuyruk**; host/misafir, AI ve uzaktan girişte ortak kural geçerli. AÇIK gerçek UI'da kaynak bir defa azalır, mevcut yapı motoru işi tamamlar, gemi serbest kalır. Mevcut katalogda kapının ayrıca teknoloji kilidi yoktur; bu faz yeni bir teknoloji şartı eklemedi. UI inşaat gemisi yolunu, AI ise mevcut stratejik altyapı kurallarını kullanmaya devam eder.

### Rota ve ikmal

Aynı kontrollü0→1→2→3→4→5 zinciri, aynı filo ve sahiplik, yalnız gate ayarı değişti:

| Ölçüm | Kapalı / normal hiper-yol | Açık / iki izinli kapı |
|---|---:|---:|
| Rota |1,2,3,4,5|5|
| Etkin rota mesafesi |500|0,1|
| Gözlenen varış süresi |6,30 oyun günü|0,05 oyun günü|
| İki kapıdan birine komşu sahipsiz düğümün ikmal uzaklığı |1 atlama|0|

Zaman ölçümü `stepFleets(0,05)` çözünürlüğündedir;0,05 gözlenen alt ölçüm basamağıdır, sürekli zamanın kesin geçit süresi değildir. Gerçek normal döngü de kendi adım çözünürlüğüne tabidir. **Anında teleport** denmedi. Askerî geçiş, savaş, ters yönde izin, müttefiklik ve mevcut senyör/vasal erişimi korunur; düşman kapısı açılmaz.38/0 eski rota/sınır testi de geçti. İkmal modeli ayrıca tek kullanılabilir kapının komşusuna da tam ikmal verir; iki kapı olmadan hiçbir ikmal yokmuş gibi yeni kural eklenmedi.

## 4. Minimal değişiklikler ve eski kayıt politikası

- `structAllowed` kapalı kapıya tek ortak ret; `RemoteConstruction.gate` açık kullanıcı gerekçesi. Kaynak kesintisinden önce çalışır; AI seçimi de aynı kapıyı kullanır.
- `isSupplyNode` yalnız kapalı `kapi` kaydının genel ileri üs etkisini dışarıda bırakır. Diğer üs ve sahiplik kuralları korunur.
- `initCrisis`, kapalı şiddette yeni kriz takvimi üretmez. `crisisTick`, kapalı ayardaki **bekleyen** eski krizi başlatmaz. Önceden gerçekten aktif kriz/fleet sessiz silinmez.
- `crisisSet`/`crisisPower` görünür seçimleri iki yönde tutarlı. Geçmiş eksik alanlarda varsayılan açık davranış korunur.
- `mirror.js`: zaten görünür olan `built` sahibi aynı π ID uzayına çevrilir;1 satır. Kaynak, filo, istihbarat veya stok beyaz listeleri gevşetilmedi.
- Pregame ve kapı bilgi metinleri düzeltildi; CSS/Canvas/kamera/isim üreticisi/stratejik AI yeniden yazılmadı.

**Eski kapılar ve başlamış işler:** yapılar ve kuyruklar silinmez. Önceden ödenmiş inşaat mevcut motorla ek bedelsiz tamamlanır, gemi serbest kalır; ayar KAPALI olduğunda kapı pasif kalır. Ödenmiş tutarı saklamayan eski işte bugünkü modifier'dan tahminî iade verilmedi; yeni iade defteri/Save8 alanı veya çift kredi riski eklenmedi. Yükle→tamamla→yeniden yükle→tik akışında tekrar ödeme/iade yok. UI bu politikayı açıkça anlatır. Kullanıcı farklı bir geçmiş iş iade politikası isterse ayrıca tasarlanmalıdır; mevcut kayıtlar sessizce temizlenmedi.

## 5. AI, multiplayer ve seçenekler arası ayrımlar

**AI:** kapalı kapı artık `aiPickStruct` adayına girmez. Açıkta zengin/uygun mevcut AI kapıyı seçebilir. Genel harika isteği, savaş/ekonomi/diplomasi kararı, olasılıkları veya denge değiştirilmedi. OFF halinde hatalı kapı adayının kaldırılması elbette sonraki seçimi değiştirebilir; bu hedeflenen ayar etkisidir, tüm OFF stratejik sonuçların eski hatalı sürümle eşit olduğu iddia edilmez.

**Köken dağılımı:**19 seed×11AI, her oran için209 bağımsız aday. %20=43/209 **%20,57**; %35=69/209 **%33,01**; %60=128/209 **%61,24**; %100=209/209. Aynı AI'nın eşikleri bağımsız seed akışıyla iç içe; sabit kota aranmadı. Rastgele havuz `kalinti/kapali/golgeden/gocebe`; Altın Çağ yok. Oyuncunun Göçebe seçimi korunur.27/0 köken regresyonu, yeni kısa ad/doktrin/zar9/0 ve MP Pregame isim kapısı geçti.

**Rastgele Olaylar:** kapatma, pasif kazalar/salgınlar, tesadüfi zincirler ve **çalkantı türü ekonomik krizleri** durdurur. Koloni isyanı, savaş/barış, casusluk sonuçları, federasyon/Konsey ve ayrı Hiçlik krizi bu anahtara bağlı değildir. Kapalı gerçek MP oturumunda Konsey ve savaş/ambargo testleri başarılı oldu. Olayları birbirine karıştıran yeni genel kapatma eklenmedi.

**Kriz ölçümü:** aynı seed404/scale2853,7747: NORMAL ihtiyaç534,3 filo/3 gemi; ACIMASIZ ihtiyaç1067,3 filo/6 gemi. Bütçe×2 etkisi, yuvarlama ve mevcut filo/gemi sınırlarıyla ölçülür; her dünyada tam iki kat filo sayısı vaat edilmez. Seed11 ERKEN133, NORMAL178, GEÇ264, SON OYUN981. ay; zamanlama KAPALI=null. Oyuncunun Altın Çağ kökeni mevcut takvimi en erken72.aya kadar öne çekebilir; dengeli rastgele AI havuzunda bu köken bulunmaz.

**Kalıntı:** boş/uzak sistem koşulu gerçek sayıyı sınırlıyor; seed11 AZ2/ORTA4/ÇOK4. Savunma hp tabanı ve beş ödülün gerçek kaynak/teknoloji/filo/extra değişimi ölçüldü. Eski mega ödülü “%50” demesine rağmen gerçek bonus `buildMul` üzerine0,15 idi: tarafsız örnekte900→860 maden,380→363 alaşım; süre böleni1→1,15. Yalnız açıklama düzeltildi; ödül/ekonomi yeniden dengelenmedi.

**Boyut/AI ve başlangıç yükü:**5seedde küçük30+11AI ve ulu100+1AI, toplam10 gerçek başlangıç. Tüm başkentler farklı. Seed404 en yakın başkent mesafeleri669,17 ve3415,11. Node ortamında küçük/yoğun başlangıç medyan155,90ms (153,49–196,85), büyük/seyrek159,87ms (151,03–166,38); her grupta n=5. Bunlar tarayıcı/FPS/telefon ölçümü veya önce/sonra hız kazanımı değildir; CPU yavaşlatması uygulanmadı.

**Zorluk birleşimi:** gerçek kaynak/gelir değişimi vardır. Fizyoloji/köken gibi mevcut `extra` birleşmeleri bazı alanları örtebilir: seed11 AI1'de fiziksel `minMul=-0,1` dört zorlukta aynı kalırken bilim/alaşım modifier'ı ve gerçek gelir değişti. AI bilim geliri9,37/11,91/15,45/20,01; alaşım2,59/3,82/5,53/7,74. Bunu her AI'da bütün kaynaklara aynı evrensel zorluk bonusu uygulanıyormuş gibi sunmuyoruz; genel AI dengesi bu fazda değiştirilmedi.

**Gerçek MP:** aynı yerel TLS relay ve ayrı Chromium süreçleri; host844×390, misafir800×360. Hostun bütün kamu galaksi ayarları misafirde aynı. Misafir KAPALI kapıyı UI'da başlatamaz, doğrudan `struct` WSS komutu `rules:engine` ile reddedilir,868/366 harcanmaz. AÇIK kontrollü aynı dünya karşılaştırmasında gerçek misafir tap'i868/366'yı **bir kez** öder; tamamlanmış kapı misafir sahibi0 ile görünür. Tekrar OFF karşılaştırmasında yapı korunur ama kullanılamaz. Yeni oyun odasındaki gerçek Pregame OFF seçimi ile mid-game ON/OFF **test fikstürü** karşılaştırması ayrıdır; kullanıcıya oyun içi ayar değiştirme özelliği eklenmedi.

Ek kısa A1 kontrolü, KAPALI misafir uzaktan sipariş girişinin de açık gerekçeyle reddini doğrular. Host/SP uzaktan kuyruğu native testte sınandı. **AÇIK misafir uzaktan görev kuyruğunun uçtan uca host aktarımı bu fazda doğrulanmadı (NOT RUN)**; doğrudan `struct` MP inşası ile bu ayrı kuyruğu birbirine karıştırmıyoruz. Yeni MP kuyruk sistemi veya komut türü eklenmedi.

MP'de lobby “5 AI” seçimi,1 misafir ile motor içindeki `G.cfg.aiCount=6` normal-devlet-dilimine dönüştürülür; gerçekte5AI+2insan vardır. Bu mevcut temsil aynen korunur. Misafir gerçek seed/RNG yerine kozmetik seed ve `rs=1` alır; geometrinin/sahipliğin aynı olması gerçek galaksi seed'inin aktarılmasını gerektirmez.

## 6. Save8 / RNG karşılaştırması ve sınırlar

- 210 tek değişkenli kurulumun tamamında doğru seçenek/Save8 geri yükleme;205 uyumlu durumda başlangıç p10/p11 **ham metin eşitliği**. Beş eski çelişkili şiddetOFF/zamanlamaNORMAL vakası düzeltilen semantiktir; artık kriz yok ve gereksiz kriz RNG çekimi yapılmaz. Bu beşinde eski hatalı Save8/RNG ile eşitlik iddia edilmez.
- Kapı ON: seed11 orta5AI, korsanOFF, p10 kontrol/p11 aday **0–120ay/121 noktada** ham Save8/SHA-256 ve RNG aynı.30.ayda iki kol da Save8'den yeniden yüklendi ve aynı kaldı.
- Kapı OFF: aynı yapılandırmada iki bağımsız p11 kolu **121 noktada** eşit; başlangıç/30/120.ay doğrulandı, sıfır kapı işi/kapı ve sıfır korsan. Oyun zorla hayatta tutulmadı, erken bitse FAIL olacaktı. [Kampanya](evidence/beta-setup1/continuity/campaign.json).
- Önceki p10'un gerçek MP paket4 snapshot'ı üretildi, eski/yeni bağımsız yükleme çıktıları ham Save8 olarak aynı; isimler/RNG korunur. Save8 v8 ve paket4/protokol1 değişmedi. p11 kapısı yalnız mevcut p6–p10 uyumlu paketlerini açıkça kabul eder; bütünlük/şema denetimleri korunur.
- Görünür yapı sahiplerinin π düzeltmesi **misafir aynasında** doğru ID'leri değiştirir; host Save8 veya RNG değişmez. Ayrı insan1/2 yeni test2/0; mevcut ayna saflık/gizlilik/diff/resync8/0.
- Serializer alanı silinmedi, hash karşılaştırması için normalleştirme yapılmadı. Sıkı kaynak pinleri yalnız doğrulanmış SHA ve benzersiz hunk geri dönüşleriyle korunur; bu denetim gerçek kontrol-kol karşılaştırmasının yerine geçmez.

## 7. PASS / FAIL / NOT RUN

| Kapsam | Gerçek sonuç |
|---|---|
| Kapı, AI/uzaktan ret, maliyet, rota/ikmal, eski iş, kapalı kriz | **12/0 PASS**; ilk p10 **5/7** korunur |
| Bütün Pregame ayarları gerçek mobil UI + CFG/G.cfg/Save8 | **8/0 PASS**,800×360 ve960×540 |
| AÇIK gerçek yeni oyun kapı inşa tap'i | **2/0 PASS**, aynı iki görünüm |
| Ayar başlangıç/Save8 matrisi | **210 PASS**,205 ham p10 kontrol eşitliği;5 düzeltilen eski çelişki |
| AI köken dağılımı | **4 oran/209'ar AI PASS** |
| Kamu ayarlarının ayrı host/misafir ayna varyantları | **42 PASS**; gerçek seed gizli |
| ON p10/p11, OFF p11/p11120ay/30.ay yükleme | **PASS**, her karşılaştırmada121 nokta |
| Ayna yapı sahibi insan1/2 | **2/0 PASS**, eski **0/2 FAIL** |
| Gerçek MP73 A1/P01/P03/P04/A3 | **5/0 PASS**, ilk **4/1 FAIL** saklandı;JS hata listesi boş |
| Ek kısa MP A1/misafir uzaktan ret | **1/0 PASS** |
|3 gerçek konsey gündem aralığı +10 yoğun/seyrek başlangıç | **PASS** |
| İlgili native regresyon21 komut | **204/0 PASS**, kapı12 dahil; alt döküm aşağıda |
| Gerçek p10 MP paket yükleme | **PASS** |
| Deterministik ZIP/manifest/CRC/SHA/çıkarılmış paket | **PASS** |
| Eski UI kriz tutarsızlığı | **1PASS/1FAIL**; hedef kusur öncesi kanıtı |
| Eski UI kapalı kapı düğmesi | **0/1 FAIL**; diğer gruplar açıkça NOT RUN; hedef kusur öncesi kanıtı |
| İlk soğuk ayna test fikstürü | **0/2 FAIL**; p10/p11 aynı türetilmiş cache etkisi, doğru insan/ısınmış fikstürle2/0 |
| Fiziksel Android, gerçek LAN/Wi-Fi, gerçek internet, canlı Render | **NOT RUN** |
| Docker build, bu fazda tam MP73 B1–B4, MP75, MP8 N/R ağır kampanyaları | **NOT RUN**; eski faz PASS'leri yeni koşu olarak sayılmadı |
| AÇIK misafir uzaktan kuyruk host aktarımı | **NOT RUN**; MP doğrudan yapı komutu ayrı test edildi |

Native204 dökümü: kapı12, isim9, korsan10, rastgele olay8, köken27, rota38, ayna8, UI kaynak koruma1, oylama3, savaş bitiş5, ambargo5, haber8, haber geri dönüş3, haber aynası4, Konsey14, Save8 sınır19, MP4core14, önceki uyumluluk4, bulutsu önbelleği3, PERF.1 **4**, PERF.2 **5**. [Çıkış kodları](evidence/beta-setup1/native/results.json).

İlk FAIL'ler sonraki PASS ile silinmedi. MP ilk timeout'u ürünün eksik `built` sahiplik dönüşümünden geldi; timeout artırılmadı/expectation yumuşatılmadı. Ek ayna testinin ilk cold fixture'ı ise insan atanmış üretim oturumu yerine soğuk AI görünümünü ölçüyordu: eski ve yeni kaynak aynı `.emps.0._powAt/_pressAt/_powC/_press` farklarını üretir. [Alan bazında kanıt](evidence/beta-setup1/mirror-fixture-diff.json). İnsan fixture'ı ve ortak ısınma sonrası ham host bayt saflığı aynen sınandı; hiçbir alan silinmedi. Force:true, sahte JS click, hata yutma veya gereksiz timeout artırımı yoktur.

## 8. Değişen dosyalar ve regresyon riski

Ürün: `main.js` (yapı/ikmal/kriz kapıları ve doğru metinler/build), `construction.js` (ret gerekçesi), `ui.js` (Pregame semantiği, kapı nedeni, kriz seçimi), `research/mp6/mirror.js` (görünür yapı sahibi π), `sw.js`, `research/mp0/mp-core.js` (dar p11 eski paket uyumu), `research/mp1/client/view.js` ve `research/mp1/server/relay.js` (MP sürümü), `RELEASE-MANIFEST.json`.

Testler: kapı/ayna önce-sonra, ayar matrisi/dağılım,120ay kontrol/tekrar, yoğunluk/konsey periyodu, eski paket, gerçek yatay UI/ON tap; MP73'te yalnız isteğe bağlı `SETUP1_AUDIT` ve sürüm beklentisi; sıkı kaynak koruma adaptörü. İsim üreticisi, AI stratejisi, ekonomi/savaş/diplomasi kuralları, federasyon/vasallık mekanikleri, Canvas/harita tasarımı ve Save8 şeması değiştirilmedi.

Risk sınırları: yanlış konfigürasyonla daha önce başlamış savaş/kriz ve ödenmiş kapı işleri silinmez; kayıt sürekliliği önceliklidir. Eski geçersiz ayarların bundan sonraki üretimi düzeltildi. Tarihsel aralıklı lobi dokunma hatası bu koşuda yoktu; kesin kapatılmış sayılmaz. Fizyoloji-zorluk modifier birleşimi gözlemi genel AI dengesi kapsamında ayrıca incelenebilir; bu fazda yeniden dengelenmedi.

## 9. Sürüm, ZIP, SHA-256, CRC32 ve manifest

- Oyun **96h10p11**; PWA **stars-v96h10p11**; MP **MP.8.9b6**. Yerel endpoint/lobi/tanı satırı ile gerçek çalışır build MP testinde aynı.
- [ZIP](../../releases/stars-faz96h10p11.zip): **784.837 bayt**,19 oyun runtime dosyası +manifest,20 üye.
- SHA-256: **`738da4fe71f200a16469abe647fd8b80be05977b14a905c30429caa2ee41f543`**.
- ZIP dosyası CRC32: **`FF695D20`**; tüm üye CRC'leri doğrulandı.
- Manifest SHA-256: **`ad24d9f9e22398471fa0900fa7ebbf46697b40ee0da33afa4c1c6e050e0a2eff`**.
- Aynı adaydan iki deterministik paket üretildi; bayt bayt eşit. Çıkarılan pakette manifest tekrar doğrulandı. [Üye/hash kanıtı](evidence/beta-setup1/RELEASE-VERIFIED.json).
- Önceki ZIP/sürüm/kayıtlar silinmedi. Oyun ZIP'i mevcut proje sözleşmesiyle MP araştırma dosyalarını içermez; MP dağıtımı aynı dalın mevcut Docker/repo yollarını kullanır. COPY/relay allowlist zaten mirror.js ve diğer değişen MP yollarını içerir; yeni dosya yolu/protokol alanı gerekmedi. **Docker build ve dağıtım NOT RUN**.

Değişen sekiz runtime/MP dosyasının eski/yeni SHA-256 karşılaştırması [runtime-hashes.json](evidence/beta-setup1/runtime-hashes.json) içindedir. Yeni değerler:

| Dosya | Yeni SHA-256 |
|---|---|
| `main.js` | `bda89ccdc42ead4cc65fdf6ca2b95735dbaa2512025eabf288bf651758b984e2` |
| `ui.js` | `7db6004c11e7eb68e030a66c31991e78498f77ac5985a2fbe718df40106cd362` |
| `construction.js` | `7c1d4912eb3aaf1c51f10e18c31f9178bc0a5dc6fcec9fd9ac47cff9d128439e` |
| `sw.js` | `5c9c7bb93b39a91a59f1785fd7b4b56c5fb79a19c3d83c3bfe6f6c4214d7bbb6` |
| `research/mp0/mp-core.js` | `eed97b112abb47cc5d1fe0905bb4af7fb39995e7d311f799ca98a2c812d876e0` |
| `research/mp1/client/view.js` | `56277176d6ad8051675d0e4b85e5fadf02e8a6bc355d1d6aac9b3e8ce2eb0628` |
| `research/mp1/server/relay.js` | `55d1926afc52886c7146e10c4b1e8b1d8547d1d4cf5739ad3e3617ca45aa2c92` |
| `research/mp6/mirror.js` | `c56eeb3a3180d625520ea738fbd058540ce6fc7628d46b87790740d2dc595a75` |

## 10. GitHub #42 gerçek durumu ve kullanıcı kabulü

Kod/test/paket dalı push edildi ve uzak SHA doğrulandı. Doğru tabanla taslak PR oluşturma **bir kez** denendi: **`Post "https://api.github.com/graphql": Forbidden`**. PR oluşmadı. [Karşılaştırma / PR oluşturma](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-ux0-names...codex/stars-beta-setup1-galaxy-options?expand=1).

Başlangıç ve sonuç için yalnız #42 ek yorumu denendi; ikisi de aynı **Forbidden** hatasıyla reddedildi. Pano gövdesi yeniden oluşturulmadı, güvenlik sınırları değiştirilmedi, yetki arama döngüsü yapılmadı. Yayımlanamayan [başlangıç](evidence/beta-setup1/issue33-start-proposed.md) ve [sonuç](evidence/beta-setup1/issue33-final-proposed.md) yorumları kanıttadır.

Son herkese açık pano okuması: **#42 PROMPT HAZIR**, **#8 KULLANICI ONAYI BEKLİYOR**, **#41 TEST BEKLİYOR**, **#44 PLANLANDI**. Başlangıçla aynı;44 görev ve diğer43 görevin kayıtları korunur. Kod/rapor teslimi, engellenen PR/pano yazımıyla karıştırılmaz. #42 için öneri **RAPOR GELDİ / TEST BEKLİYOR**, kullanıcı incelemesi sonrası onay aşaması; **TAMAMLANDI değildir**. [Doğrulanmış son pano kaynağı](evidence/beta-setup1/issue33-final-source.json).

Fiziksel kullanıcı kabulü için kısa sıra (terminal gerekmez):

1. 800×360/960×540 benzeri yatay telefonda Galaksi sekmesine gir; her anahtarın görünür durumunu/açıklamasını kontrol et. Kriz KAPALI→ERKEN ve zamanlama KAPALI→şiddetNORMAL çiftlerini dene; çelişkili aktif seçim kalmamalı.
2. Kapılar KAPALI yeni oyunda yeterli kaynak/inşaat gemisiyle kapı seçeneğini kontrol et; neden görünmeli, uzak sipariş onayı kapalı olmalı, kaynak azalmamalı.
3. Kapılar AÇIK ayrı yeni oyunda inşa, bitiş ve iki izinli kapı rotasını dene. Hazır ağ veya anında geçiş bekleme; sahiplik/erişim ve harita yollarını karşılaştır.
4. Eski kapılı ve yapımı süren kaydı yükle; yapı silinmemeli, ek ödeme/iade olmamalı, kapalı ayarda pasif kalmalı. Bu geçmiş iş politikasını kullanıcı ayrıca kabul etsin.
5. İzinli yerel iki cihaz oturumunda host/guest kapı adı/sahibi/durumu ve kamu galaksi ayarlarını karşılaştır; bir kez dokunup tek bedel alındığını doğrula. AÇIK misafir uzaktan görev kuyruğu ayrıca manuel/sonraki faz kabulü gerektirir.
6. Korsan KAPALI, isim zarında doktrin kapısı ve Konsey/haber kısa kontrollerini yap. Sorunda sürüm, rol, seed(host), oyun ayı, seçilen ayar ve önce/sonra kaynak ekranını kaydet.

Kalan kabul sınırları: fiziksel Android, gerçek LAN/internet/Render, AÇIK misafir uzaktan görev aktarımı; eski ücretli kapı işi için kullanıcı politika onayı. Bu faz “bütün multiplayer/pregame ve yayın artık kusursuz” iddiası değildir. Sonraki tek öncelik: bu paketin kullanıcı cihazında ayar/kapı kabulü ve raporun #42'ye bağlanması; yeni mekanik geliştirmesi değil.
