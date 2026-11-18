# STARS — Bağımsız Uzman İncelemesi / Developer Report

**Tarih:** 18 Kasım 2026, İstanbul.  
**Kapsam:** multiplayer mühendisliği, iki sevkiyat sorunu, savaş/diplomasi/federasyon, yatay mobil kullanım ve sonraki geliştirme sırası.  
**Teslim türü:** inceleme ve doğrulama. Oyun davranışı değiştirilmedi.

## En önemli üç bulgu

1. **İki sevkiyat sorununun ana kısmı artık p40 adayında düzeltilmiş.** p39 kontrolünde sipariş/sevk engelini ve satır şişmesini yeniden ürettim; p40'ta üretim öncesi ve sonrası sınır geçişi, alternatif rota, uzun bekleme sonrası otomatik devam ve ana filoya gerçek katılma testleri geçti. 40 gemi tek kartta, aynı adlı iki eski hedef ayrı kartta kalıyor. **Eksik:** eski filo adı saklanmıyor; istenen “1. Taarruz Filosu” yerine “Filo #72” gösteriliyor. Tehlike bekleme sistemine sonradan gelirse güvenli başka bir toplanma yerine tahliye davranışı ayrıca doğrulanmalı.
2. **Canlı oyun ile incelenen aday farklı.** Render ölçümü hâlâ **96h10p33 / MP.8.9b30**; güncel aday **96h10p40 / MP.8.9b39**. p39'un tamamlanmış 15 dakikalık Chromium testi ve p40'ın sevkiyat testi olumlu; bunlar fiziksel Android'deki uzun oturum donmasını veya kullanıcının gerçek kayıt sorununu kapatmıyor.
3. **Komutun yalnız bir kez uygulanması sınırlı bir önbelleğe bağlı.** Aynı `cid` hemen tekrarlandığında tek sipariş/tek ödeme korunuyor. Ancak 128 kabul edilmiş başka komut yanıtından sonra veya kayıt→yeni host sonrasında aynı `cid`, daha yeni sıra numarasıyla tekrar gönderilince **ikinci sipariş ve ikinci ödeme** oluştu. Bu protokol sınırını yeniden ürettim; normal arayüzün bu tekrarı kendiliğinden yaptığı henüz kanıtlanmadı.

## 1. Kanıt dili ve sürüm kapsamı

- **yeniden üretildi:** Bu incelemede kendim çalıştırdığım testte gözlendi. Bir başarısızlık kadar çalışan davranışı da bu etiketle belirtiyorum; sonuç ayrıca yazılıyor.
- **kodda doğrulandı:** İlgili kaynak yolunu okudum; tam kullanıcı akışı çalıştırılmış sayılmaz.
- **raporda doğrulandı:** Başka geliştiricinin raporunu ve erişilen ham kanıtını inceledim; kendi testim değildir.
- **olasılık:** Koddan veya mevcut ölçümlerden çıkan risk; gerçekleşmiş arıza iddiası değildir.
- **test edilmedi:** İlgili ortam veya senaryo için yeterli doğrulama yok.

**Kullanıcı gözlemi kaynağı:** Bu görevin metni ve önceki saha şikâyetleri. Bunlar gerçek kullanıcı deneyimi olarak kabul edildi; tek başına belirli bir commit'te yeniden üretim sayılmadı. Gerçek sorunlu kayıt dosyası bu incelemeye eklenmedi.

### İncelenen revizyonlar

| Kaynak | Dal / HEAD | Sürüm | Bu raporda kullanımı |
|---|---|---|---|
| Önceki referans, [PR #54](https://github.com/sarsiss12-dot/Star/pull/54) | `claude/stars-mp-sync-fed0` · `1a6e404aa91215a9e037063c6ff33426747e9e29` | p38 / MP.8.9b37 | Açık pencere bekletmesi, eski MP testleri, Barıştırma son onayı ve gündem motoru için tarihsel taban. |
| Tamamlanan MP/NF-9 çalışması, [PR #55](https://github.com/sarsiss12-dot/Star/pull/55) | `claude/stars-mp-sync-fed1` · `293de5a38e579dc1e051dfe4282e2ab8fcf1aeaa` | p39 / MP.8.9b38 | Kayıttan dönüş J, uzun oturum I, NF-9 M ve kapanış regresyonları. Sevkiyat için sabit eski kontrol kökü. |
| **Güncel inceleme adayı, [PR #56](https://github.com/sarsiss12-dot/Star/pull/56)** | `claude/stars-reinf-route0` · **`d91fb07978b951f90cd92692166b06d9f972bb05`** | **p40 / MP.8.9b39** | İki sevkiyat düzeltmesi, sensör paylaşımını kullanan tehdit hesabı, kendi hedefli testlerim, mevcut QoL kodu ve protokol sınırları. |
| Canlı [Render /mp/version](https://stars-zhdu.onrender.com/mp/version) | Sekiz MP dosyası özeti `0ec57209d2d6bc9d02c72b4452dec3f05d05f678` ile 8/8 eşleşti | p33 / MP.8.9b30 | Yalnız HTTP sürüm ölçümü. p40 oynanış kabulü sayılmadı. |

Save8 **v8**, MP kayıt paketi **4**, protokol **1**.

İlk incelemede p39'un `06e0c77` ara HEAD'i erişilebiliyordu ve kapanış raporu yoktu. Devam kontrolünde **PR #55'in kapanış commit'i ve PR #56 bulundu**; nihai rapor bu yeni kanıtlara göre güncellendi. “NF-9 raporu yok” ve “iki sevkiyat sorunu güncel adayda hâlâ aynı” sonuçları artık geçerli değil.

Önce `AGENTS.md`, `GPT-DEVIR.md`, `CLAUDE.md`, ilgili sonuç raporları ve `reports/claude/SONRAKI-FAZ-GOREVLERI.md` okundu. Eski devir belgesindeki aktif dal ve test toplamları güncel HEAD yerine kullanılmadı. Görev panosunda “PLANLANDI” görünmesi de özelliğin hiç olmadığı anlamına alınmadı: koloni ekonomi dökümü ve tersane düzeni bunun iki örneği.

**Paket kimliği:** p40 ilk ZIP'i ile sensör düzeltmesinden sonraki ZIP aynı build adını taşıyor. Geçerli son paket:

- Dosya: `releases/stars-faz96h10p40.zip`
- SHA-256: `e14ff859e48f305cb197bbe9bf13ea84cc1c3d4f117995d3a4971d85b9cc8793`
- CRC32: `2B7C1EB2`
- 20 girdi; ZIP CRC kontrolü temiz. Çıkarılmış ZIP'te 19 runtime dosyası manifest ile doğrulandı.
- PR #56 açıklamasındaki eski `cfa143aa…` özeti, son raporun §4.1 ekiyle geçersiz kılınmış. Yalnız PR başlığı/build adına bakmak yeterli değil.

## 2. İki sevkiyat sorununun güncel durumu

### 2.1 Düşman sınırındaki ana filoya otomatik takviye

**Eski hata — yeniden üretildi, p39:** `reinforcementThreats` bilinen düşman mülkiyetini/iddiasını gerçek silahlı filo tehdidiyle aynı kümeye koyuyordu. `reinforcementRoutes` hedef bu kümedeyse hemen rota yok diyordu. Bu hem `reinforceFleet` tersane seçimini hem üretim sonrası `followRallyFleet → shipmentRoute` yolunu kesiyordu. `stepFleets` de sonraki adıma aynı engeli uyguluyordu. Dördüncü başarısız deneme kalıcı `paused` üretebiliyordu.

**p40 çözümü — kodda doğrulandı ve testte yeniden üretildi:**

- `main.js: reinforcementPassable`, `reinforcementRoutes`, `stepFleets`: insan oyuncu için hedef sistem, düşmanın boş iddia sistemi ve kendi silahlı filonun tuttuğu sistem geçirilebilir. Görünür silahlı düşman filosu bulunan sistem kapalı kalır. Kolonili düşman ara sistemleri, kendi filon tutmuyorsa hâlâ kapalıdır.
- `shipmentAutoResume`, `holdShipment`, `followRallyFleet`: güvenli insan takviyesi dört denemede vazgeçmez; beş oyun gününde bir yeniden rota arar, ana hedef değişince bekleme süresini erkene çeker.
- `fleetAutoReinforceTick`: yalnız devlet 0 yerine bütün insan devletleri tarar. **Bu ek düzeltme MP misafirinin otomatik sipariş vermesi için gerekliydi.**
- Son ek commit'te uzak insanın tehdit görünürlüğü `humanVisionContext(e).visible` üzerinden hesaplanır. Müttefik sensöründen görünen düşman filosu haritada görünürken rotada yok sayılmaz.
- Yapı, mevcut geçiş izni ve hiper-yol kurallarını kullanır. AI takviye kuralı aynı bırakılmıştır.

| Senaryo | Kendi testim / kanıt | Sonuç |
|---|---|---|
| Siparişten önce ana filo düşman sisteminde | `reinf_route0_test.js R2` | **yeniden üretildi:** otomatik sipariş ve gerçek teslim başarılı. |
| Sipariş güvenliyken verildi, üretim sırasında filo sınırı geçti | R1 | **yeniden üretildi:** tersane çıkışı→hareket→ana filo gemi sayısı artışı. |
| Gezegen bizde, sistem sahibi hâlâ düşman | Bağımsız A4; gerçek gezegen sahibi alanı `planet.owner` kullanıldı | **yeniden üretildi:** sistem sahibi 1, gezegen sahibi 0 iken ana filo 1→2 gemi. Bu kontrollü durumdur; doğal fetih kampanyası değildir. |
| Yolda yeni görünür düşman filosu, alternatif yol var | R3 | **yeniden üretildi:** güvenli sapma ve gerçek teslim. |
| Alternatif yok, uzun süre bekleme | R4 | **yeniden üretildi:** 400 oyun günü sonra kalıcı duraklamıyor; tehdit kalkınca teslim oluyor. |
| Beklerken ana filo başka ulaşılabilir sisteme geçiyor | R5 | **yeniden üretildi:** yeni hedef izleniyor ve teslim oluyor. |
| Bekleyen sevkiyatla kayıt/yükleme | R6 | **yeniden üretildi:** hedef korunuyor, rota açılınca katılıyor. |
| Bekleyen gemiyi bileşimde sayma / ikinci ücret | R4 ve 47 vakalık filo bileşimi paketi | **yeniden üretildi:** bekleyen gemi sayılıyor, aynı eksik için ikinci sipariş/ödeme yok. Bu, aşağıdaki ağ `cid` sorunundan farklı bir katmandır. |
| Hedefte görünür silahlı düşman filosu | R7 | **yeniden üretildi:** takviye girmiyor, bekliyor. |
| Misafir insanın otomatik siparişi | R9; Claude MP8 X1/X2 | **yeniden üretildi** motor; **raporda doğrulandı** gerçek Chromium misafir arayüzünde 6→7→8 gemi. |
| Müttefik sensöründen görünen düşmana göre sapma | R12 | **yeniden üretildi:** paylaşım açıkken tehdit/sapma var; bitince gizli filo konumu kullanılmıyor. |

**Açık sınırlar:**

1. **Kuşatma/işgal izni, doğrudan kuşatma bayrağından türetilmiyor.** Kod hedef sistem istisnasını daha geniş uyguluyor. Mevcut kullanıcı isteğini karşılıyor; “yalnız kuşatırken izinli” gibi daha dar bir tasarım iddiası yapılmamalı. Aktif deniz/uzay çatışması bitene kadar katılmanın beklemesi de ayrı davranıştır.
2. **Güvenli bekleme, çoğunlukla mevcut güvenli konumda durmak.** Ayrı bir “en yakın güvenli toplanma sistemini seç ve oraya çekil” algoritması bu sevkiyat yolunda yok. Bekleme sistemine düşman sonradan girerse, transit bacak tehdit altında kalırsa veya toplanma noktası el değiştirirse ne olacağı **test edilmedi**. R4, önceden güvenli yerde durmayı kanıtlar; bütün tahliye durumlarını kanıtlamaz.
3. **Kolonili düşman ara sisteminin kapalı olması kasıtlı tasarım kararı.** Ana filo iki düşman kolonisinin arkasındaysa takviye hâlâ bekleyebilir. Bekleme nedeni bunu açık söylemeli; genel “ulaşılabilir sınır dışında” yeterli değildir.
4. Son sensör ekinden sonra tam Node kampanyası ve Save8/RNG eşdeğerliği geliştirici tarafından yeniden çalıştırılmamış. R12 ve ilgili paketler olumlu; final commit'in geniş eşdeğerlik kanıtı ayrı eksik.

**Uzman kararı:** Ana arızayı baştan yeniden düzeltmeyin. p40 çözümünü koruyup yukarıdaki sınırları kabul testine çevirin. Başarı ölçütü rota çizilmesi değil, **ana filo sayısının artması + sevkiyatın doğru sonlanması + tek ücret** olmalı.

### 2.2 Ana filo kaybolunca 40 ayrı sevkiyat satırı

**p39 — yeniden üretildi:** ortak sevkiyat renderer'ı kayıp hedefli gemileri ayrı satırlarda gösteriyordu. Önceki sürümde Haber Ağı'nın “Sevkiyatlar” sekmesi yoktu; kullanıcıdaki menü adı ile kaynak sürümünü karıştırmamak gerekir.

**p40 — yeniden üretildi:** `UI.shipmentLostCards`, mevcut `fleetRecoveryGroups` sonuçlarını kullanıyor. Haberler→Sevkiyatlar ve Filo→Sevkiyatlar aynı bölümü gösteriyor. Gemiler sistemlerine göre değil **eski hedef filo kimliğine göre** üst kartta gruplanıyor.

| Kabul kavramı | Kanıt / sonuç |
|---|---|
| 40 gemi / tek eski hedef / üç sistem | C1: **1 kart**, sınıf/adet/sistem dökümü; dışarıda yinelenen kayıp hedef satırı yok. Fikstürde 40 gemi, 35 sevkiyat filosudur; gemi sayısı ile sevkiyat sayısı ayrıdır. |
| Aynı adlı iki farklı eski hedef | C2: **2 kart**, toplamları birbirine karışmıyor. Gruplama adla yapılmıyor. |
| Beş sisteme dağılmış gemiler, kayıt yeniden yükleniyor | C3: eski hedef kimliği ve sistem toplamları korunuyor. |
| Haberler→Sevkiyatlar | C4 motor/HTML; Claude X3 gerçek Chromium tıklaması: **tek kart**, host toplamıyla eşit. |
| “1. Taarruz Filosu · Hedef kayıp · 40 takviye gemisi” | Bağımsız A5: **tam karşılanmıyor**. Eski ad kayıtta yok; yükleme sonrası başlık “Filo #72 · Hedef kayıp · 40 takviye gemisi”. |

`fleetRemovalRecord` ve `cleanFleetJournal` eski adı saklamıyor. Günlük en fazla 256 kayıt, misafire giden günlük de sınırlı; kalıcı kart kimliği yalnız günlüğün son birkaç satırına dayanmamalı. `shipment.fleet` üzerinden eski hedef ID'si korunuyor. Bu doğru temel kullanılmalı.

**Önerilen küçük tamamlama:** Kayıp hedefe bağlı yaşayan sevkiyat/ödenmiş sipariş varken eski hedefin son adını sınırlı bir alanda saklayın; ID gruplanma anahtarı olarak kalsın. Eski kayıtta ad yoksa “Filo #id” dürüst fallback olsun. Kullanılmayan alanlar bütün eski kayıtlara zorla doldurulmasın; Save8 ve misafir beyaz listesi açıkça test edilsin.

Kart açılınca çok sayıda bireysel düğme yine uzayabiliyor. Varsayılan görünüm sınıf+toplam+sistem ve **Toplu kurtarma** olmalı; tek tek sevkiyatlar ikinci ayrıntı katmanına alınabilir. Farklı sistemlerdeki gemileri tek kartta göstermek, onları fiziksel olarak birleştirmek anlamına gelmez.

## 3. Eski multiplayer saha şikâyetleri

### 3.1 Harita durması: üç ayrı neden/ortam

| Durum | Güncel kanıt | Değerlendirme |
|---|---|---|
| Pencere açıkken dünya bekliyor, hız bildirimi geliyor | `guest-stars.js holdBuild/rebuild/syncWatch`; PR54 O7; PR55 I | **kodda ve raporda doğrulandı:** çoğu modal açıkken dünya kurulumunu bilerek bekletiyor. p38 düzeltmesi bunu kaldırmıyor, nedenini pencerenin üstünde gösteriyor. Bazı `liveWorld` pencereleri istisna. |
| Pencere kapalıyken uzun oturumda harita donuyor | PR55 son `regresyon/I.log`: 500 sistem, 16 AI, host+2 misafir, 15 dk | **raporda doğrulandı:** 602 örnek, 30 olay, >20 saniyelik kapalı-pencere donma 0. Saha vakası bu koşuda yeniden üretilememiş; **açık**. |
| Android arka plana alıp dönme | PR55 I/O: Chromium sayfa dondurma ve tekrar açma | **raporda doğrulandı** benzetim; **fiziksel Android test edilmedi**. Android süreç öldürmesi, ekran kilidi ve gerçek mobil ağ değişimi bu kanıta eşit değildir. |

Son I koşusunda altı kasıtlı modal beklemesi var. Pencere sonrası yetişme yaklaşık 106–365 ms, benzetilmiş arka plan sonrası 47–66 ms, kısa kopma sonrası 334–3730 ms; emir yansıması 266–723 ms. En büyük örneklenmiş oyun günü farkı 5,3. Bunlar o makinedeki ölçülerdir; orta seviye Android için performans garantisi değildir.

**Mühendislik yorumu:** Hız/pulse iletilerinin gelmesi dünyanın uygulandığını kanıtlamaz. Sunulan ayna revizyonu, alınan revizyon ve uygulanmış dünya revizyonu ayrı izlenmeli. Mevcut tanı kodu bunu yapıyor; saha kaydında üçü birlikte alınmalı. Modal bekletmesi ile veri alınamaması ve deserialize reddi aynı “bağlı” etiketinin altında gizlenmemeli.

### 3.2 Kayıttan dönüş, olaylar ve ilk gemi siparişi

**PR55 J, 5/0 — raporda doğrulandı.** Host kaydediyor; tarayıcılar ve relay kapanıyor; yeni oda açılıyor; host bir süre tek başına devam ediyor; B/C yeni kodla aynı devletlerine dönüyor. Bekleyen/gizli karar sahipliği denetleniyor.

| İlk sipariş aşaması | J3 ölçümü | Anlamı |
|---|---:|---|
| Host kuyruğunda kayıt | 381 ms | Motor siparişi oluşturmuş. |
| Kabul yanıtının gözlenmesi | 510 ms | İstemci host sonucunu almış. Raporda “host kabulü” denilen bu zaman, kuyruktan sonra gözlenebiliyor. |
| Misafirin tersane ekranında aynı kayıt | 695 ms | Ayna uygulanmış ve satır görünmüş. |

Koloni gemisi için **60 alaşım + 265 maden**, tek sipariş. J4 kayıp yanıt+aynı `cid` kısa tekrarında ikinci ücret yok. Bu olumlu kısa tekrar testi, önbellek taşması/yeni host sınırını kapsamıyor.

J1'de 30 günlük doğal ilerleme B'ye bir karar üretmiş, host'a yeni doğal karar üretmemiş. Sonraki olay/anomali/zincir kontrolleri motor giriş noktalarından kontrollü olarak eklenmiş. Dolayısıyla “her oyuncuda doğal anomali üretimi kayıt sonrası uzun süre sorunsuz” sonucu çıkarılamaz.

Kendi `mp_p0_decisions_test` 7/0 ve misafir paketi 7/0: kişisel anomalinin doğru insana gitmesi, pending kararların Save8'de korunması, yetkisiz başka oyuncunun uygulayamaması ve ödülün tek işlenmesi **yeniden üretildi**. Kullanıcının gerçek kaydı ve aynı saha oturumunun devamı **test edilmedi**; şikâyet kapanmadı.

### 3.3 Misafir haritası: her belirti ayrı

| Belirti | Kanıt | Sonuç / sınır |
|---|---|---|
| Kendi filo rotası görünmüyor | PR55 I2, PR54 O9/O10; `mirror.js`, `guest-stars.js` | **raporda/kodda doğrulandı:** rota aktarımı mevcut. Final p40 fiziksel çizim kabulü yok. |
| Hareket adım adım | Kendi `mp_p0_motion_test.cjs` 3/0; `View.fleetPoint` | **yeniden üretildi:** görsel ara değerleme mevcut; misafir simülasyon yürütmüyor. Bu test 60 FPS/Android akıcılığı kanıtı değil. |
| Askerî can çubuğu yok | Kendi misafir testi; PR55 I2 ve `mirror.js` yabancı `combat` alanı | p39'da görünür çatışan yabancı filonun `combat:0` olması düzeltilmiş. **Tam can ve çatışma yokken çubuğun gizlenmesi ayrı çizim kuralı**, her gemide sürekli çubuk vaadi yok. |
| Keşfedilen alan görünmüyor | Kendi misafir testi; I2 `seenMiss=0/seenExtra=0` | **yeniden üretildi** motor/ayna, **raporda doğrulandı** büyük galaksi duraklatılmış karşılaştırması. |
| Kolonileştirilebilir işaretler yok | Kendi misafir testi; `playerHabitatMark`, I2 | **yeniden üretildi:** bilinen/taranmış uygun sistem için işaret var, gizli sistem açılmıyor. |
| Devlet sınırları/sahiplik yok | I2 `ownDiff=[]`; `humanMapKnowledge` | **raporda/kodda doğrulandı:** izleyicinin bildiği sahiplik taşınıyor. Bütün galaksinin güncel sınırı herkese açılmamalı. |
| Müttefik sensör paylaşımı etkisiz | Kendi misafir 7/0, intel 3/0, p40 R12; PR55 I3 | Aşağıdaki yön ve kaynak kurallarıyla çalışıyor. |

**Sensörün gerçek kuralı:** `sensorShareActive(taker,giver)` iki tarafın yaşaması, aralarında savaş olmaması ve tek yönlü `visionFrom/shareVis` veya geçerli vasal paylaşımını arıyor. `nativeSensorVision` verenin **kendi sistemlerinden ve kendi filolarından**, sensör menziliyle görüş oluşturuyor; nebula yayılımı sınırlıyor. Başkasından aldığı bütün görüşü üçüncü oyuncuya zincirleme aktarmıyor.

Son I3 ölçümü: **B→C, C 32 sistem kazanıyor; üçüncü taraftan sızıntı 0; C aynası host'un C görüşüyle aynı; B değişmiyor; B'nin C'den kazancı 0; host görüşü 4→4.** Paylaşım bitince canlı görüşün kalkıp tarihsel keşfin kalması kendi Node testimde geçti. Yeni tam ayna kurulumunda görüş eşitliği de kontrol ediliyor; anlaşma açık/kapalıyken gerçek ağ kopması ve Android geri dönüşünü tek birleşik senaryoda bu tur çalıştırmadım.

**Rapor düzeltmesi:** PR55 açıklamasındaki “B'nin filo görüşü aktarılmıyor” gerekçesi kodun tamamını doğru anlatmıyor. Kendi filoları `nativeSensorVision` kaynağıdır. Asıl ayrım, verenin yerel görüşü ile üçüncü taraftan devraldığı görüş arasındadır. İlk I3 FAIL saklı; son I3 PASS da artık erişilebilir. İlk başarısız koşu güncel sonuç yerine kullanılmadı.

### 3.4 Diplomasi, savaş ve federasyon

| Başlık | Durum ve kanıt |
|---|---|
| Takılı “Federasyon Kuruldu” / savunma paktı kartı | PR55 E 6/0, F 6/0, Z 14/0; kendi misafir testinde aynı mirror'da kuruluş sonucunun tekrar üretilmemesi geçti. **raporda doğrulandı + dar yeniden üretim**. Kullanıcının özgün takılan kartı/saha oturumu yok. |
| Host–misafir olay farkı | Kişisel karar sahipliği tasarım gereği farklı olabilir. Aynı oyuncunun pending/sonuç durumu host kanoniğiyle karşılaştırılmalı. Kendi karar paketi 7/0; başka oyuncunun özel olayı görünmemeli. |
| Savaşa çağırma / müzakereyle katılım | Mevcut koalisyon, karşı teklif ve son onay akışları var; PR54 Q 8/0 ve sonraki raporlar. Tüm katılımcı/ayrı barış/bozulan vaat kombinasyonlarının Android kabulü yok. |
| Savaş Sözü | `warPledgeLeft/warPledgeInTime`: kendi son tarih paketi 8/0. Son gün dahil kuralı ve geç ilan ayrımı korunuyor. Sözün kabulü, otomatik savaş ilanıyla karıştırılmamalı. |
| Barıştırma | `mp-core` son onayda istihbarat/teklif kapısını yeniden denetliyor; kendi paket 6/0, PR55 U 8/0. Koşul değişince maddelerin yarım uygulanmaması kritik koruma. |
| Aktif oy varken sonraki öneri / acil destek | Kendi gündem paketi 6/0; kuyruk zaten çalışıyor. Aktif oy kesilmiyor, acil öncelik ve olağan FIFO var. Eski görünmeyen destek eyleminin önemli kısmı bilgi kapısıydı. |
| **NF-9** | `diplomacy.js fedDefenseCalls`, `mp-core pol.fed.defCalls`, misafir host DTO'su ve Askerî sekmesi. Kendi D1–D7 **7/0**; PR55 M **5/0**, p38 kontrol **2/3**. Üyeye asgari savunma bilgisi geliyor; dış oyuncuya özel savaş/filo bilgisi açılmıyor. |
| Savaş sonunda toprağın kime kalacağı | Kendi `beta_war_goals0_test` **13/0**, `field_war_siege0_test` **20/0**. Hedef dışı işgalin iadesi, hedefin kalması ve vaatli devrin koşulları var. “Her zaman otomatik fethedene kalır” genellemesi güncel kodla desteklenmiyor. |

**NF-9 test adıyla kapsamını ayırma:** D6, aynı `cid` tekrarını **kayıttan önce** sınar; ardından yeni host'ta oy/gündem durumunun korunduğunu denetler. Aynı `cid`'yi **yeni host'a yeniden göndermeyi** sınamaz. Bu nedenle D6 PASS, bağımsız A3'teki çift sipariş bulgusuyla çelişmez.

## 4. En olası beş MP arızası ve ucuz ayırt edici test

Aşağıdaki sıralama istatistiksel arıza olasılığı değildir; saha geçmişi, etki ve kod katmanlarına göre mühendislik önceliğidir.

| Risk / kanıt düzeyi | Oyuncunun göreceği belirti | Şüpheli katman ve mevcut koruma | En ucuz ayırt edici test |
|---|---|---|---|
| **1. Bağlantı açık, dünya durmuş** — **olasılık**, geçmiş saha gözlemi | Hız haberi gelir; gemiler/gezegenler sabit, emir sonucu belirsiz. | `guest-stars holdBuild/rebuild/syncWatch`; mirror rev/base, deserialize, `S.appliedRev`. Pulse ayrı akar. Yeniden eşitleme ve görünür neden zaten var. | Yalnız mirror/delta'yı 20 sn düşür, pulse/result akmaya devam etsin; sonra veriyi aç. Modal açık/kapalı iki ayrı vaka. Alınan/uygulanan rev ve son gün kaydedilsin. Pencere kapalıyken otomatik yetişme veya açık hata, sessiz kalıcı donma yok. |
| **2. Eski oda kodu / yeniden bağlanma kimliği** — **olasılık** | Eski kod çalışmaz; oyuncu başka devlete düşmüş sanır veya ikinci sekme katılamaz. | Relay odaları bellekte; `join.js`, MP4 `saveId` kimliği, token/koltuk kurtarma. Yeni oda eski kodu canlandırmaz. | Kaydet→relay ve bütün sekmeler kapanır→yeni oda. Eski kod anlaşılır ret; yeni kod doğru devlete dönüş. Aynı cihaz ikinci sekme ve kimliksiz cihaz ayrı test; yanlış devlet devri 0. Mevcut Z/J kullanılabilir. |
| **3. Kayıp host yanıtı sonrası çift emir/ödeme/oy** — **yeniden üretildi: protokol sınırı** | İlk emir uygulanmışken oyuncu tekrar deneyip iki gemi/iki ücret görebilir. | `mp-core RESULT_CACHE=128/result/runCommand`; snapshot sadece `lastSeq` taşır, sonuç haritası yeni host'ta boş. Kısa tekrar korunuyor; bazı oy/teklifler ayrıca domain kapılarıyla korunuyor. | A1 kontrol; sonra 128 kabul edilmiş salt-okunur komut + eski `cid`/yeni seq; ayrıca snapshot→yeni host→aynı `cid`. Şu an A2/A3 çift sipariş/ödeme. Düzeltmeden sonra tek sonuç/tek ücret. Her oy türünün iki kez uygulanması kanıtlanmış değildir. |
| **4. Eski PWA / karışık sürüm** — **kodda doğrulandı + olasılık** | Bir oyuncuda düğme yok, kayıt reddi, bozuk istemci veya anlamı değişen komut. | `sw.js` dosya bazlı network-first/cache fallback; `hello` protokol v1'i denetler, tam build/asset kimliği mutabakatı yok. İki farklı p40 ZIP'i aynı build/cache adı taşıyor. | İlk p40'ı cache'e al, son p40'a geçerken bir JS isteğini kes; host/misafir rollerini değiştir. Tam içerik kimliği eşleşmeden mutasyon engellensin veya açık yenileme istensin. Sadece “p40” metni PASS ölçütü olmasın. |
| **5. 500 sistem / 16 AI'da misafir gecikmesi** — **olasılık** | Rota kesik akar; dokunma geç işler; tersane sonucu gecikir, bazen donma sanılır. | Host yayın/mirror; misafirde deserialize+UI refresh; uyarlanan 600–3000 ms kurulum aralığı; ay başı işleri. Görsel ara değerleme mevcut. | Mevcut I koşusunu final HEAD'de kullan; p95 uygulanmış rev yaşı, emir→satır süresi, uzun JS işi, bellek ve dokunma gecikmesi ölç. “20 sn donma yok” testi tek başına akıcılık ölçüsü değil. Gerçek Android ayrıca çalışmalı. |

**Bağımsız A2/A3 yorumu:** Protokol düzeyinde tekrar gönderdim; normal oyun arayüzünde kullanıcı hiçbir şey yapmadan iki ödeme oluştuğunu iddia etmiyorum. Kısa kayıp yanıt testini genişletmek ucuz; otomatik yeniden deneme davranışı büyütülmeden önce bu sınır kapatılmalı. Eski sıra numarası aynı bırakılırsa mevcut `lastSeq` koruması ayrı çalışır; bulgu **aynı mantıksal işlem kimliği + yeni seq** birleşimidir.

## 5. Yatay Android için QoL uzman görüşü

**Genel sonuç:** Oyunda pek çok gerekli ekran zaten var. En büyük yük, bilgiyi bulduktan sonra doğru nesneye ulaşmak ve verilen emrin gerçekten uygulandığını kontrol etmek. Yeni merkezler eklemekten önce mevcut ekranlar arasındaki bağlantılar ve durum geri bildirimi tamamlanmalı.

Bu tur Chromium ortamı `process_singleton_posix / socket() EPERM` nedeniyle başlamadı. Bu yüzden aşağıdaki adım sayıları **koddan çıkarılan mevcut yollar ve önerilen kabul hedefleridir**; kendi canlı dokunma ölçümüm değildir. Claude'un 800×360 yatay misafir ekran görüntüleri görsel olarak incelendi. Bu görüntüler fiziksel Android testi değildir.

| Akış ve çalışan temel | Mevcut oyuncu adımları | Önerilen akış | Ölçülebilir kabul ölçütü |
|---|---|---|---|
| **Enerji açığının nedenini bulmak**. Ekonomi Merkezi, gerçek gelir/gider defteri, sistem ve filo kısayolları var. | Üst çubukta −3351'i gör→ayrı Ekonomi düğmesini bul→gerekirse Enerji'yi seç→kaynak dökümünü kaydır→sistem/filo bağlantısını ara. Üst kaynak hücresi `ui.js` içinde eylemsiz `div`. | Aylık enerjiye dokun→en büyük net giderler ve sebep→ilgili nesneye dokun. Filoların ortak bakımını koloniye keyfî yazma. | Üst çubuktan en büyük **eyleme geçirilebilir** gider nesnesine en çok **2 dokunuş**. Devlet çapındaki giderse ikinci dokunuş filtreli filo/ekonomi listesine. Aylık akış, tek seferlik harcama ve stok kaybı ayrı. Gösterilen toplam motor bilançosuyla eşit. |
| **Sorunlu gezegeni bulmak**. Koloni çalışma alanı, inşa/enerji/istikrar sıralaması, yerel üretim/bakım dökümü ve haritaya git var. | Gezegenler→sıralama→satırları tarama→gezegen→boş yuva/otomasyon/ekonomiyi ayrıca inceleme. “İnşa” kuyruğun uzunluğudur; boş bina yuvası filtresi değildir. | Üç filtre: “Kuyruk boş”, “Bina yeri var”, “Ekonomi sorunu”; sonuç sayısı; işlem sonrası “Sıradaki”. | Filtre seçimi+koloni seçimiyle **2 dokunuşta** doğru panel; 20 kolonide tek tek açma gerekmiyor. AND birleşimi doğru, satır/scroll/filtre korunuyor. Yerel net ile imparatorluk ortak giderleri açık ayrılıyor. |
| **Yeni kolonide otomatik inşa / araştırma**. Yeni koloni autoON ve 60 günlük bekleme, eski/manualOFF koruması; manuel/yarı/otomatik araştırma ve seçilen teknoloji bilgisi var. | Auto açık görüp üretim başlamayınca paneli tekrar açma; araştırmanın hangi hedefte olduğunu arama. | “Otomatik · 42 gün sonra”, “Kaynak bekliyor”, “Sıradaki bina/teknoloji” aynı satırda; değiştirme mevcut ayara gider. | 60 gün bekleme, kaynak yokluğu ve manuel kapalı durumları birbirinden açıkça ayırt ediliyor; mevcut kayıt tercihi değişmiyor. Araştırma tercihi ve gerekçesi tek görünümde. |
| **Filo emri / tersane / sevkiyat sonucunu anlamak**. p40 durum ve bekleme yeri, host ACK ve yansıma altyapısı, kayıp hedef kartları var. | Emri ver→toast bekle→tersane kuyruğunu aç→filoyu/Sevkiyatlar'ı kontrol et; “gönderildi” ile “uygulandı” karışabiliyor. | Aynı işlem satırında “Host'a gönderiliyor→Kabul edildi→Üretimde→Yolda/Bekliyor→Katıldı”; ret gerekçesi ve ilgili nesne bağlantısı. | Kayıp ACK'de yanlış “reddedildi/tekrar öde” yok. Aynı mantıksal iş bir satır/tek ücret; kabul revizyonu uygulanınca kuyruk kanıtı görülür. Reddedilen emir üretimde gösterilmez. |
| **Tersanede tekrar sipariş**. `shipQueueHtml` gemi düğmelerinden sonra ekleniyor; “kuyruk düğmeleri aşağı itiyor” sorununun bir kısmı zaten ele alınmış. | Önce ralli/sevkiyat ayrıntıları arasında üretim düğmesini bul; uzun panelde tekrar arama. | Kuyruğu yeniden yazmak yerine kontrol bölümünün görünür konumunu sabitle; uzun sevkiyat ayrıntılarını kapalı tut. | 0/1/20 kuyrukta aynı üretim düğmesinin konumu sıçramasın; 800×360 ve 844×390'da erişilsin; ana dokunma hedefleri en az 44 CSS px. **Mevcut kodda ölçülmüş konum hatası iddiası yok.** |
| **Olay→ayrıntı→işlem**. Şerit başlığından tam pencere, hızlı seçenekler, gizli/bekleyen listesi ve isyan yönetimi var. | Şeritte olayın türünü anla→başlığı aç→ilgili gezegeni/savaşı ayrıca bul. Gizlenen olayın hâlâ karar bekleyip beklemediğini denetle. | Kısa özet+son tarih/sonuç; “Konuma git”, “Yanıtla”, “Önlem al” bağlama uygun tek eylem. | Bekleyen anomaliden karar ekranına 1, isyan uyarısından ilgili önleme en fazla 2 dokunuş. Kaydırıp gizlemek karar vermek sayılmaz. Host kabulü beklerken seçenek kilidi ve sonuç doğru kalır. |
| **Savaş sonunda toprağı anlamak**. Savaş Merkezi, barış önizlemesi, işgal/vaat kayıtları var. | Savaşı aç→şartları bul→işgal listesiyle karşılaştır→vaadi ayrı kontrol et. | Tek sistem satırında mevcut sahibi, işgal eden, **seçilen barış şartıyla kalacağı taraf**, gerekçe. Önizleme zamanı ve sonradan değişen koşul görünür. | Savaş Merkezi'nden en fazla 2 dokunuşla paylaşım tablosu. Fetih hedefi/hedef dışı iade/vaat/ayrı barış vakalarında önizleme gerçek uygulamayla eşleşir; gizli toprak bilgisi açılmaz. |
| **Federasyon oyu ve sıradaki öneri**. Bekleyen İşler, gündem kuyruğu, NF-9 Savunma çağrıları ve gerekçeler var. | Federasyon→Askerî/Oylamalar→geniş açıklamaları kaydır→aktif oy/sıradaki çağrıyı bul. | İlk görünümde “Senden yanıt bekliyor”, aktif oy, sonraki öneri; çağrının durum/gerekçe satırı. Uzun açıklamalar açılır ayrıntı. | 800×360'ta kişisel bekleyen oy ve bir sonraki gündem bilgisi ilk görünümde; oy ekranına 1 dokunuş. Engelli eylemin gerekçesi aynı satırda. Yeni öneri aktif oyu kesmez. |

**Görsel kanıt yorumu:** p40 `x3-b-sevkiyatlar-kart.png` tek kartı ve Toplu Kurtarma'yı gerçekten gösteriyor. p39 `m4-b-kuyruk.png` ise NF-9 eyleminden önce başlıklar, sekmeler ve açıklamaların ekranın çoğunu tükettiğini gösteriyor. İkincisi yeni federasyon motoru ihtiyacını değil, dikey alanı daha iyi kullanma ihtiyacını destekler.

**En çok fayda sağlayacak üç QoL değişikliği:**

1. **Kalıcı ve doğrulanabilir emir durumu:** oyuncunun “aldı mı?” diye tersaneyi/filoyu tekrar açmasını ve belirsiz tekrarı azaltır. Önce komut tekilleştirmesi sağlamlaştırılmalı; sonra bu görünüm ona bağlanmalı.
2. **Enerjiden gider kaynağına iki dokunuş:** −3351 gibi krizlerde teşhis süresini doğrudan azaltır. Mevcut muhasebe yeniden yazılmadan yapılabilir.
3. **Koloni eylem filtreleri ve Sıradaki:** imparatorluk büyüdükçe artan tek tek gezegen açma yükünü azaltır. Mevcut koloni çalışma alanı yeterli temel sağlar.

Kayıp filo adı küçük ve değerli bir tamamlamadır; ancak tek kart özelliği artık var. Federasyon yoğunluğu ve olay kısayolları sonraki sıradadır. NF-11/NF-12'yi “sıfırdan yap” olarak tarif etmek tekrar iş üretir.

## 6. Çalıştırılan testler ve kanıt sınırları

### Bu incelemede final p40 üzerinde

| Paket | Sonuç |
|---|---:|
| `reinf_route0_test.js` | 12 PASS / 0 FAIL |
| `reinf_route0_cards_test.js` | 4 / 0 |
| `mp_sync_fed1_defcall_test.js` | 7 / 0 |
| `mp_sync_fed0_agenda_test.js` | 6 / 0 |
| `mp_sync_fed0_peacewith_test.js` | 6 / 0 |
| `mp_techlux0_intel_test.js` | 3 / 0 |
| `mp_p0_guest_test.cjs` | 7 / 0 |
| `mp_p0_motion_test.cjs` | 3 / 0 |
| `mp_p0_decisions_test.cjs` | 7 / 0 |
| `mp_waron1_deadline_test.js` | 8 / 0 |
| `faz93c_fleet_composition_test.js` | 47 / 0 |
| `beta_board2_colony_test.cjs` | 5 / 0 |
| `beta_war_goals0_test.js` | 13 / 0 |
| `field_war_siege0_test.js` | 20 / 0 |
| **Toplam: 14 paket** | **148 PASS / 0 FAIL** |

Ayrıca `tests/expert_audit_20261118.cjs` ile **5 gözlem CONFIRMED**: A1 kısa tekrar korunuyor; A2 önbellek sonrası çift sipariş; A3 yeni host sonrası çift sipariş; A4 farklı gezegen/sistem sahibinde teslim; A5 eski ad kaybı. CONFIRMED, hatanın düzeldiği anlamına gelmez.

İlk bağımsız test kurulumunda gezegen sahipliği yanlışlıkla `col.e` alanından arandığı için fixture hata verdi. O ilk günlük saklandı; gerçek `planet.owner` alanına düzeltildikten sonra A1–A5 çalıştı. Ürün kodu değiştirilmedi.

**Sabit p39 kontrolü:** aynı güncel sevkiyat testleri R1–R12 **2 PASS / 10 FAIL**, kartlar **0 PASS / 4 FAIL**. Bu beklenen eski-sürüm başarısızlığıdır; final p40 regresyonu değildir.

### Ortam ayrımı

| Ortam | Durum |
|---|---|
| Kendi Node/VM motor ve HTML testleri | Yukarıdaki 148 PASS ve 5 gözlem. Tarayıcı/GPU/gerçek dokunma değildir. |
| Kendi yerel Chromium MP8 X denemesi | **Kurulum FAIL / oynanış NOT RUN**: Chromium Unix socket açarken EPERM. Oyun vakaları başlamadı; bunu ürün arızası saymadım. |
| Claude yerel Chromium + üretim relay + TLS + ayrı profiller | p39 O/U/Z/E/F/J/M/I/P ve p40 X/SP rapor/ham kanıtları incelendi. Kendi çalıştırmam değildir. |
| Canlı Render | **HTTP sürüm ölçümü PASS**, p33. Canlı MP oyun oturumu **NOT RUN**. |
| Fiziksel Android, gerçek iki cihaz internet/LAN | **NOT RUN**. |
| Kullanıcının gerçek sorunlu kaydı | **NOT RUN**. |
| Final p40 tam Node ve Save8/RNG kampanyası | Bu incelemede **NOT RUN**. İlk p40 raporu 231 paket, 6463 geçen/275 kalan ve 3×48 ay eşdeğerlik bildiriyor; sensör ekinden sonra geniş tekrar yok. 275 eski kalan testi doğrulanmış yeni arıza saymadım; “bütün testler yeşil” de demiyorum. |

## 7. Sonraki geliştirme sırası ve ilk prompt kapsamı

### Sıra 0 — Doğru adayı sabitle ve kabul temelini temizle

Kod değişikliğinden önce PR #56 son HEAD'i ve ZIP özeti esas alınmalı. İki farklı içerik için aynı p40 sürüm adı kullanılmasının önüne geçilmeli. Final sensör ekinde ilgili eşdeğerlik ve MP görünürlük kontrolü tamamlanmalı.

**Kabul:** build/cache/MP etiketi ve içerik özeti tek bir adayı tanımlar; ZIP doğrulaması geçer; tam çalışma yapılmadıysa açık NOT RUN kalır. Render'a sonradan dağıtım yapılırsa `/mp/version` yalnız etiketle değil sekiz dosya özetiyle de eşleştirilir. Bu inceleme dağıtım yapmadı.

### Sıra 1 — İlk geliştirme promptu: MP-EMİR-GÜVENCE.0

**Birlikte alınacak işler:** aynı mantıksal emrin yalnız bir kez uygulanması, kayıttan yeni host'a dönüşte bu garantinin korunması ve bunu sınayan dar hata enjeksiyonu testleri. Aynı çalışmada yalnız gerekli sürüm kimliği/paket güncellemesi yapılmalı. Ekonomi, AI, savaş tasarımı veya geniş arayüz değişikliği eklenmemeli.

Uygulama sırası:

1. A1/A2/A3'ü değişikliksiz kontrol kökünde tekrar doğrula; gerçek istemcinin `cid/seq` tekrar semantiğini sabitle.
2. İşlem kimliğini oyuncu+save/oturum bağlamında ele al. Sonuç önbelleğinden düşen veya yeni host'ta tanınmayan eski işlemi sessizce yeni sipariş gibi uygulama. Bounded kayıt/işlem geçmişi veya güvenli ret/yeniden doğrulama tasarımını seç; sınırsız bellek büyümesi yaratma.
3. Host kabulü→host kuyruğu→misafir ekranı zincirini mevcut J3/J4 ile doğrula. Belirsiz sonuçta yeni işlem kimliğiyle otomatik tekrar oluşturma.
4. Geminin yanı sıra ödeme, karar ödülü ve federasyon oyu için ilgili domain kapılarını koru; Save8/MP paket uyumluluğunu açıkça sınırla.
5. Yeni tekil sürüm kimliği ve dar regresyon kanıtıyla teslim et.

**Kabul ölçütleri:**

- Aynı `cid` hemen, 128+ kabul edilmiş yanıttan sonra ve yeni host'a dönüşte: **en fazla bir sipariş, bir ödeme, bir karar uygulaması**.
- İki gerçekten farklı emir: ikisi de geçer; meşru ikinci sipariş engellenmez.
- Başka oyuncunun/başka kaydın aynı metinsel `cid`'si işlemi çalamaz veya yanlış sonuç alamaz.
- Eski işlem sonucu bulunamıyorsa açık “sonuç doğrulanıyor/yeniden doğrulama gerekli” akışı; ikinci ücret yok.
- Kayıp ACK altında misafir kuyruğu host ile eşleşir; aynı emir iki satıra dönüşmez.
- Mevcut NF-9 D1–D7, Barıştırma, gündem, kişisel karar ve p40 R1–R12/C1–C4 gerilemez.

**Neden önce bu?** Sevkiyatın ana yol hatası p40'ta zaten kapatılmış. Şimdi otomatik tekrarları ve kalıcı emir durumunu güvenle geliştirmek için ödeme/komut temeli sağlam olmalı.

### Sıra 2 — REINF-ROUTE.1: iki sevkiyat işinin kalan kabul açıkları

Bu promptta **eski hedef adının kalıcı gösterimi + güvenli bekleme sınır testleri** birlikte alınmalı. Çalışan rota ve gruplama baştan yazılmamalı.

**Kabul:**

- “1. Taarruz Filosu · Hedef kayıp · 40 takviye gemisi” ölüm ve kayıt/yükleme sonrası korunur.
- Aynı adlı iki hedef farklı ID ile iki kart; farklı sistemlerdeki aynı hedef tek kart.
- Eski kayıtta ad yoksa ID fallback; sınıf/sistem toplamları doğru.
- Kuşatma ve farklı gezegen/sistem sahibi, üretim öncesi/sonrası sınır geçişi ayrı senaryolar.
- Tehdit sonradan bekleme yerine gelirse davranış tanımlı; güvenli kaçış gerekiyorsa izinli rota kullanılır. Güvenli yer bulunamazsa açık gerekçe; “güvenli yerde” diye yanlış durum yazılmaz.
- Tehdit kalkınca ve hedef hareket edince **ana filoya gerçek katılma**, tek ücret, bileşimde doğru pending sayımı.
- Final sensör paylaşımı kuralında yeniden bağlanma ve paylaşımın bitmesi; gizli filo konumu sızmaz.

### Sıra 3 — QoL: emir durumu → enerji bağlantısı → koloni filtreleri

Her biri küçük teslim olsun. §5'teki dokunuş ve durum kabul ölçütleri kullanılsın. Geniş yeni merkez yerine mevcut `EconomyUI`, `ColonyUI`, sevkiyat/kurtarma ve host ACK altyapısı geliştirilsin.

### Sıra 4 — Savaş/federasyon sunumu ve açık tasarım işleri

Barış paylaşım tablosu, federasyon ilk görünüm yoğunluğu ve olaydan eyleme geçiş. NF-7 AI barışçıl biat daveti ve NF-10 Konsey gündemi ayrı tasarım fazları olarak kalsın; MP saha kapanışını geciktirecek şekilde ilk prompta eklenmesin.

### Saha sorunlarını kapatmak için eksik kanıt

| Açık konu | Kapanış için gereken kanıt |
|---|---|
| Pencere kapalı uzun oturum donması | Doğru adayda gerçek cihaz/hat; host rev, alınan/uygulanan rev, modal durumu, son deserialize hatası, gün ve son emir zamanları. Yalnız “bağlı” ekran görüntüsü yeterli değil. |
| Android arka plandan dönüş | Ekran kilidi, uygulama arka planı, süreç öldürülmesi ve Wi‑Fi/mobil veri geçişi; aynı devlete dönüş ve ilk emir zinciri. |
| Kayıttan sonra olay/anomali yok | Gerçek sorunlu kayıt; pending karar karşılaştırması ve doğal bilim keşfiyle yeni anomali üretimi. Enjekte edilen olay tek başına yeterli değil. |
| İlk tersane emri kayıp | Host kabul sonucu, gerçek kuyruk kaydı, misafir revizyonu ve görünür kuyruk satırı aynı işlem kimliğiyle eşleştirilmeli. |
| NF-9 ve eski takılı kartlar | Doğru adayda host+misafir, aktif oy+ikinci savunma çağrısı, yanıt/kapanış ve yeni oda dönüşü; sahada tekrar etmeme. |
| İki sevkiyat sorunu | p40 veya sonraki tekil adayda gerçek misafir arayüzü; üretimden ana filoya katılma, 40/1 kart ve adın korunması; fiziksel yatay Android yerleşimi. |

## 8. Kaynaklar, teslim ve yeniden üretim

**Ana kaynaklar:**

- [p40 sabit kaynak ağacı](https://github.com/sarsiss12-dot/Star/tree/d91fb07978b951f90cd92692166b06d9f972bb05).
- [PR54 MP-SYNC-FED0 raporu](https://github.com/sarsiss12-dot/Star/blob/1a6e404aa91215a9e037063c6ff33426747e9e29/reports/claude/MP-SYNC-FED0-SONUC.md).
- [PR55 MP-SYNC-FED1 kapanış raporu](https://github.com/sarsiss12-dot/Star/blob/293de5a38e579dc1e051dfe4282e2ab8fcf1aeaa/reports/claude/MP-SYNC-FED1-SONUC.md).
- [PR56 REINF-ROUTE0 ve son sensör eki](https://github.com/sarsiss12-dot/Star/blob/d91fb07978b951f90cd92692166b06d9f972bb05/reports/claude/REINF-ROUTE0-SONUC.md).
- Ham geliştirici kanıtları: `reports/claude/evidence/mp-sync-fed1/regresyon/`, `j-aday/`, `nf9/`; `reports/claude/evidence/reinf-route0/`.
- Açık işler: `reports/claude/SONRAKI-FAZ-GOREVLERI.md`; eski genel pano GitHub Issue #33. Kod/son raporla çelişen eski durumlar güncel gerçek yerine kullanılmadı.

**Bu incelemenin dosyaları:**

- Rapor: `reports/codex/EXPERT-AUDIT-20261118-SONUC.md`
- Kendi günlüklerim/JSON: `reports/codex/evidence/expert-audit-20261118/`
- Bağımsız gözlem testi: `tests/expert_audit_20261118.cjs`
- Kanıt envanteri: aynı kanıt dizinindeki `MANIFEST-SHA256.json`.
- Geliştirme dalı: `codex/stars-expert-audit-20261118`; taban `d91fb07978b951f90cd92692166b06d9f972bb05`. Rapor commit'i son yanıtta verilir. Main'e merge, Render dağıtımı ve ürün kodu değişikliği yok.

Yeniden üretim örnekleri:

```bash
node tests/reinf_route0_test.js
node tests/reinf_route0_cards_test.js
node tests/mp_sync_fed1_defcall_test.js
node tests/expert_audit_20261118.cjs
# A2/A3 CONFIRMED, mevcut kusurun kanıtıdır; çözüm PASS'i değildir.
MP8_SCEN=X node tests/browser-mp8.cjs
MP8_SCEN=J node tests/browser-mp8.cjs
MP8_SCEN=I MP8_I_MIN=15 node tests/browser-mp8.cjs
```

Tarayıcı koşuları aynı makinede sırayla yürütülmeli. Final adayın kullanıcı kabulü henüz yok; yerel PASS'ler saha şikâyetlerini otomatik kapatmaz.
