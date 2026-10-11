# 92D güncel durum — 11 Ekim 2026

92D barış sonrası aylık AI paylaşım gündemini ekler. Bütün cepheleri kapanan
sefer ilk 180 günde adaydır. Sefer/taraf için önceden herhangi bir teklif varsa
otomatik tekrar sunulmaz; yeni manuel taslak mümkündür. Her aylık taramada
azami iki yeni teklif. Sıfır devirli taslak için gereksiz gündem açılmaz.
Oyuncu oyu ve oyuncunun bulunduğu paylaşımın Uygula kararı otomatik değildir.
AI-only onaylı teklif mevcut settlementApply ile atomik uygulanır.
Diplomasi merkezi kendi son 12 paylaşımını gösterir; açık gündem önceliklidir.

Sıradaki **93A — Astra / High:** tersane hedefi/takviye hedefi ayrımı,
siparişte-yolda-eksik sayıları ve doğru ret mesajları.
Ardından 93B bekleyen sevkiyat, 93C sınıf bazlı filo şablonu.
LOJISTIK-INCELEME-92D.md doğrulanan sorunları ve önerileri ayırır.
91C/87T cihaz adayı sabit kalır. Kullanıcıdan şimdi test istenmez.

---
Aşağıdaki önceki faz notları tarihseldir.

# STARS — 92C güncel devir

Kaynak stars-faz92b1.zip SHA-256:
`f3395cc67458ad60d57c14f8abb49dc1e10952bd11bd517ce515962686ebd1e9`.
Build 92c, cache stars-v92c. Kayıt v8 korunur.
settlementApplyQuote saf son kapıdır; settlementApply yalnız onaylı ve
içeriğe bağlı oybirliğini uygular. territoryOwnerSet üretim dosyalarının
bütün açık owner atamalarının ortak yoludur. Monoton shareRev + sistem
sahiplik kapsamı eski rızayı geçersizleştirir.
Karma koloni için captureSystem kullanılmaz. Gezegenin col nesnesi ve
altyapısı korunur, kaynak/fetih/ganimet etkisi uygulanmaz. Son koloni
verilemez; vali görevsiz kalır, otomasyon kapanır. Yörünge ayrı kalır.
Boş sistemin bekleyen queue/work işi varsa devir reddedilir.
Uygulanmış teklif receipt ile saklanır, ikinci kez uygulanamaz ve aynı
sefer/taraf için yeni teklif sunulamaz. Eski protokol onayları geçersizdir;
yeniden teklif gerekir. UI.shareApply gerçek uygulama düğmesidir.
DEAL_TX_ROOTS türetilmiş uzay yapısı önbelleğini de içerir.
92D — Astra / High: doğal barış/AI paylaşım gündemi; oyuncu onayı
korunmalı. Uzun sefer simülasyonu ve görünür bildirim akışı.
Cihaz testi istenmez; senaryolar birikir. 91C/87T adayı sabit kalır.

## Önceki teslim — 92B.1 (tarihsel)

Kaynak stars-faz92b.zip SHA-256:
`d48f500798cce54e8da060c996ae5d1fc386c7441aa6e600ef6ae797bc603ca0`.
Build 92b1, cache stars-v92b1. Gemi kilidi için shipBuildAccess tek
araştırma/kriz/Konsey izin kapısıdır. queueShip, canBuildShip,
canBuildFederal, loopBuildStatus ve UI aynı kapıyı kullanır.
activeShipQueue günlük üretimde yalnız izinli işleri ilerletir;
kilitli eski sipariş silinmez veya ikinci kez ücretlendirilmez.
Sabotaj süresince mevcut siparişler de durur. Hazır filolar silinmez.
Fizyoloji kurulum sekmesinin başındaki tek emoji kaldırıldı.
92C kapsamı değişmedi; 92B paylaşım motoru ve veri biçimi korunur.

## Önceki teslim — 92B (tarihsel)

Kaynak stars-faz92a.zip SHA-256:
`21ca3ed207f5972db77a75a3e7527e153d151e111174facce6f7cc98e32090fc`.
Build 92b, cache stars-v92b. SAVAS-PAYLASIMI.md kanonik kuralları açıklar.
settlementContext/Preview saf aday/öneri üretir. settlementSubmit,
settlementVote ve Withdraw yalnız teklif kaydını değiştirir. Oybirliği
approved demektir; sahiplik hâlâ değiştirilmez. Teklif başına 180 gün.
G.settlements kayıt v8 ve DEAL_TX_ROOTS kapsamındadır. Restore sahte oy,
alıcı ve bozuk özetleri reddeder. Context stamp eski rızayı taşımayı önler;
captureSystem/planetFlip shareRev, sistem codec'inde sr alanını kullanır.
UI.openSettlement gerçek modal/düğme/oy akışıdır; oyuncu oyu otomatik değil.
AI kendi gündemini doğal ay tikinde henüz başlatmaz; öneri sunulduğunda
ortak AI'lar deterministik olarak değerlendirir.

92C — Astra / High: onaylı teklifi güncel sahiplik/üçüncü taraf/koloni
verisiyle tekrar doğrula, atomik uygula ve çift uygulamayı engelle.
Karma koloniler için captureSystem kullanma. Diğer doğrudan sahiplik
yollarını sürüm/geçerlilik açısından denetle. Cihaz testi istenmez;
87T adayı 91C sabit kalır.

## Önceki teslim — 92A (tarihsel)

Kaynak stars-faz91e-1.zip SHA-256:
`458c40d3cac65f3b950d44ae9a81b1de77b654ded8a3957ef246641aa886b4f2`.
Build 92a, cache stars-v92a. Yeni G.warLedger, kayıt v8'e isteğe bağlı
alan olarak eklenir. Başlangıç/kapanış, destek zinciri, gerçek muharebe,
çıkarma ve ele geçirme olayları üretim yollarından beslenir.
SAVAS-KATKI-KAYDI.md veri anlamı, gizlilik ve sonraki faz sınırlarını açıklar.

declareWar üçüncü isteğe bağlı support parametresi alır. Federasyon,
senyör/vasal ve warOn çağrıları sponsor/enemy/kind verir. Bağımsız savaşlar
aynı düşmana karşı olsa bile birleştirilmez. dailyTick/monthTick gözden
geçirmesi eski doğrudan savaş bayrağı yollarını kısmi olarak yakalar.
captureSystem üçüncü cause parametresi alır; anlaşma devri transfer olarak
işaretlenir. Battle ve invasion hook'ları kayıp ölçer, RNG tüketmez.
DEAL_TX_ROOTS warLedger içerir; applySaveData restoreWarLedger çağırır.
UI.warContribution yalnız kendi cephe özetini döndürür; okuma saftır.

Sıradaki 92B — Astra / High. Toprak devri hâlâ açılmadı. 92C güvenli
uygulamayı getirecek. Harita, ses ve HTML bu fazda değişmedi.
87T adayı 91C sabit; kullanıcıdan şimdi cihaz testi istenmez.

## Önceki teslim — 91E.1 (tarihsel)

Kaynak stars-faz91e.zip SHA-256:
`71634609074157993030cc47767ddaef8911480c4c5f944a6bfe66238ae8dd15`.
Build 91e-1, cache stars-v91e-1. FEDERASYON-YASALARI.md katalog ve
oyuncu kurallarını açıklar. Kullanıcı talebiyle 4 temel + 11 iç yasaya
genişletildi: beş kategori, üç alternatif politika ailesi, kaldırma oyu.
Eski dört temel yasanın otomatik gündemi korunur. İç yasaların tamamı
oyuncuya açıktır; 91E'deki Savaş Onayı öneri kilidi kaldırıldı.

fedOpenVote artık repeal ve hedefli war gündemi taşır. fedResolveVote
alternatif yasayı kaldırır veya f.warPermits'e tek kullanımlık izin yazar.
fedWarAllowed: kanonik savaş/söz/hedef bedeli kapılarında; AI savaş meclisi
izin gerektiğinde aynı gündeme başvurur. warDefense başlangıç rolü,
savunma paktı ve senyörlük yardımı için kullanılır. Eski _warOk aylık
cezası kaldırıldı; eski savaşlarda saldırgan tahmin edilmez.

Gelir etkisi fedApplyIncomeLaws; askerî etki recalcMods; fon mevcut
fedFundTick; uyum mevcut cohesionTick. Etki kaynakları kalıcı extra
alanına yazılmaz. Üyelik/kaldırma sonrası türetilmiş değerler yenilenir.
map.js, combat.js, audio.js, index.html, manifest.json aynı tutuldu.

**Sıradaki 92A — Astra / High:** koalisyonun katılımcı ve katkı kaydı.
Ardından 92B paylaşım teklifi, 92C güvenli toprak devri. Geniş yasa
kataloğunun doğal kampanya dengesi ayrıca açık; test sayısı denge kanıtı
değildir. 91C sabit cihaz adayı; yeni cihaz testi kullanıcıyı bekliyor.

---
Önceki fazın tarihsel devir notları:

## 91E

Kaynak stars-faz91d-1.zip SHA-256:
`fc34e5d48a6959e0db0778793eff25c1b09bc111cd8c5c4728acc7cc9e845a64`.
Build 91e, cache stars-v91e. FAZ91E-RAPOR.txt ve tests/results-91e.json:
55 paket / 4070 geçen / 0 kalan. 31 yeni federasyon senaryosu.

Tek f.vote: fedOpenVote → castFedVote / finishFedVote → fedResolveVote.
İşlem sınırı fedChange; sunum fedPresentVote ile commit sonrasında.
UI.openFed öneri kartları; UI.fedVoteOpen gündem tokenı + dünya nesnesi
koruması. Oyuncu önerdiğinde bile ayrıca oy verir. Üç iç yasanın gerçek
etkileri bağlı. Eski v8 gündemleri okunur. map.js birebir aynı.

**Sıradaki 91E.1 — Astra / High:** Savaş Onayı için hedefli savaş izni
gündemi. Mevcut _warOk cezası onay üretmiyor; yeni yasa önerisi gerekçesiyle
kapalı. Yeni izin sıradan savaş yasaklarını aşmasın, otomatik savaş açmasın.
Savunma/otomatik katılım ayrımı, süre ve üyelik sonunda geçersizlik,
oyuncu kararı, AI ve gerçek declareWar kapıları birlikte ele alınacak.
Sonrasında 92A–92C koalisyon katkısı ve toprak paylaşımı. 91C test adayı
sabit; cihaz testi kullanıcı isteğiyle bekliyor.

---
Aşağıdaki notlar tarihsel; güncel sıra yukarıdadır.

## 91D.1 tarihsel devir

Kaynak stars-faz91d.zip SHA-256:
`9058ce8db9350712ef8f1a14cfd53102d23dd9b401a07f62f376ca1a63d1bade`.
Build 91d-1, cache stars-v91d-1. Yeni iş Filo sahipleri aç/kapat katmanıdır.
main.js: FLEET_NAMES_ON, geç okuma koruması ve loadFleetNamesPref;
ui.js: sol harita akordiyonunda fleetNamesToggle; map.js: drawFleetOwnerLabels.
Tercih yh_fleetnames ile kalır, serialize yüküne eklenmez. Harita modu,
Radar/Lojistik ve oyun verileri değişmez. Kod yalnız görünen canlı filoları
etiketler; gruplu satırların aynı devlet filoları tek etiket paylaşır.
Temassız devlet tam adı açılmaz. Yer kalmazsa etiket atlanabilir; uzun ad
kısalır. Native Canvas görüntüsü pakettedir, fiziksel cihaz testi değildir.
Rapor FAZ91D-1-RAPOR.txt; otomatik sonuç tests/results-91d-1.json.
Cihaz testi kullanıcı isteğiyle bekliyor. 91C sabit adayı değiştirilmedi.
**Sıradaki 91E — Astra / High:** federasyon iç yasa teklifi/oy/gerçek etkiler.

## 91D tarihsel devir

Kaynak stars-faz91c.zip SHA-256:
`d7c6af0d0565906d74b795154194bdedb6f481cfe42983e8abe123376b4f8ec2`.
Build `91d`, cache `stars-v91d`. Rapor FAZ91D-RAPOR.txt;
tam regresyon tests/results-91d.json; kaynak karşılaştırması tests/91d-source.log.
53 paket / 4010 geçen / 0 kalan / 0 atlanan.

map.js: territoryRegions yalnız görülen aynı sahipli hiper-yol bileşenlerini
kurar; önbellek gün sayacı yerine dünya kimliği ve ilgili veri imzasıyla
geçerli kalır. drawTerritoryLabels devlet adlarının tek yoludur. Etiket
ekranda olan gerçek sisteme bağlıdır; seçili bölge önceliklidir. Yıldız,
sistem adı, filo satırı, ana araçlar ve açık panelle çakışma önlenir.
Sığmayan etiket atlanır; tam ad panelde bulunur. Bütün uzak devletlerin
tek bir ortalaması kullanılmaz. Temassız devlet nötr ad/rengi alır.

territoryColonyOwners yalnız görülmüş ve taranmış gezegenleri sayar.
Sistem sahibinden farklı koloni haritada KARMA HÂKİMİYET ile belirtilir;
UI.p_sistem sistem ve koloni sahiplerini ayrı yazar. Sahiplik verileri
değiştirilmez, paylaşım motoru eklenmez. Kayıt v8/RNG ve motorlar korunur.

40 hedefli native kontrol: 91C 7/33 → 91D 40/0. Üç native PNG tests/artifacts-91d.
Gerçek tap/pan altyapısı değişmedi. Eski tüm-map hash iddiaları, kaynak
91C'deki sprite/giriş/kurtarma/kamera/filo bölümlerinin sabit hash'leriyle
sınırlandı; referans-sha.json değiştirilmedi. Yeni davranış ayrı testli.
Android ve gerçek tarayıcı bu fazda çalıştırılmadı; fiziksel test arası sürer.

**Sıradaki 91E — Astra / High:** FED_LAWS ve FED_INNER_LAWS yollarını incele;
oyuncu iç yasa önerebilsin, oyu rastgele seçilmesin, tek kaydedilebilir
gündem olsun. Dört yasanın açıklaması ile gerçek etkisi uyuşsun. Yalnız
düğme eklemek tamamlanmış mekanik değildir. Sonra 92A–92C katkı/paylaşım.
87T sabit adayı 91C ayrı korunur; 91D testini geçmiş saymaz. Yayın yapılmadı.

## 91C tarihsel devir (aşağıdaki sıradaki faz notu tarihseldir)

Kaynak stars-faz91b.zip SHA-256:
`11eeeb17cb7b89e5bb91b52dc76882e837f2cfb68e1761ede4c09b6c8268ab61`.
Build `91c`, cache `stars-v91c`. 52 paket / 3970 geçen / 0 kalan / 0 atlanan.
Rapor FAZ91C-RAPOR.txt; tam sonuç tests/results-91c.json.

Korsanlar başlangıçta diplomatik savaş bayrağı taşımadığı için hostile
kapısından geçmiyordu. Korsan husumeti artık saf, iki yönlü bir savaş
sebebi; diplomatik bayrakları değiştirmez. canEnter ve threatAt aynı kapıyı
okur. Başka devletin sınırındaki yuva o devletin sınırını açmaz.
Yuva/kalıntı savunması gerçek tarafına katkı yapar; filo sırası savunmayı
yanlış tarafa yazamaz, taraf olmayan yuva başka savaştan hasar almaz.
Ricat hasar öncesinde bütün filolar için çözülür; üs kalırsa savunma sürer.
Yuvanın savunması sistemin normal sahibine yazılmaz. Ödül tekrarlanmaz.

AI pact/ally adayları wild tarafı fırsat kapısından önce eler. Oyuncu onayı,
alıcının gerçek değerlendirmesi ve kanonik işlem motoru korundu.
27 yeni senaryo: kaynak 4/23 → çıktı 27/0. Bu 23 ayrı kök neden değildir.
Eski bir istatistik beklentisi, iki gerçek ve kontrollü karşı teklif
kabul/ret senaryosuna taşındı; kampanya sayıları raporda aynen durur.

6 doğal günlük kampanya / 1440 ay: 381 müzakere, wild girişimi 0,
356 uygulama, 42 karşı teklif; ölçülen durum ihlali yok. Korsan çatışması
da değiştiği için önce-sonra farkı yalnız aday filtresine atfedilemez.
Native Canvas dahil regresyon çalıştı; gerçek tarayıcı/Android çalışmadı.
Save v8, depolama anahtarları, harita kurtarma ve Situation karantinası korunur.

**Sıradaki 91D — Astra / High:** görünür kopuk parçalara devlet adı,
tek sistemli devlet, çakışma ve bilgi gizliliği. map.js'teki iki etiket
yolu birleşecek; centroid başka toprağa düştüğünde yanlış aidiyet olmayacak.
Ardından 91E federasyon iç yasa önerisi/oylama/etki; 92A–92C ortak savaş
katkısı ve paylaşım. Eski civic işi 91F olarak bekliyor.

91C, 87T için sabit adaydır. Kullanıcı testlere ara verdi; şimdi test
istenmez. Sonraki geliştirme ayrı kopyada yapılır. Yaklaşık 20 dakikalık
liste RC-CIHAZ-KABULU.md içindedir. Yayın yapılmadı.

## 91B tarihsel devir (aşağıdaki sıradaki faz notu tarihseldir)

Kaynak stars-faz91a.zip, SHA-256:
`298da93e0ecc8353b13ddb3f3ac57e5c47400938a8c36de84ecc30d8898bba44`.
Build `91b`, cache `stars-v91b`. 50 paket / 3942 geçen / 0 kalan / 0 atlanan.
Güncel rapor FAZ91B-RAPOR.txt; tam sonuç tests/results-91b.json.

60/100 sistem × 3 seed, doğal günlük kampanyalar toplam 1.223 ay.
Darbe sonrası %110 pay toplamı iki koşuda ölçüldü; aylık %99 yuvarlama da
kısa testle gösterildi. normalizeFactionShares iki yolu tam %100'e bağlar;
nesne kimliği/RNG/save v8 korunur. 8 senaryo kaynakta 1/7 → çıktıda 8/0.
Üretimde diplomacy.js, main.js build adı ve sw.js cache adı dışında değişiklik yok.

**Sıradaki 91C — Astra / High:** pakt/ittifak adaylarında wild filtrelemesi.
1.022 aiNegotiate çağrısının 500'ü wild kapısında kararsız; aiTurn fırsatı
seçtikten sonra break ediyor. Erken filtreyi dar kapsamda düzelt; oyuncu
UI.aiOffer ve kanonik aiNegotiate kapısını koru. Katsayı/maliyet/kota ekleme.
Aynı 6 kurulumla önce-sonra çalıştır, karar dağılımı ve ekonomi/ikmali raporla.
Yeni sıralama RNG akışını doğal olarak etkileyebilir; bütün kampanya aynı
olmalı diye zorlamadan, değişmeyen kapı sözleşmeleri kısa testle doğrulanır.

91C sonunda tek 87T adayı dondurulacak: kullanıcı hazır olduğunda yaklaşık
20 dakikalık cihaz turu. Şimdi test istenmez. 91D ayrı kopyada devam edebilir.
Kullanıcının en son Android denemesinde beyaz ekran görülmemişti; bu tüm
mobil kabulün kapandığı anlamına gelmez. Yayın yapılmadı.

## 91A tarihsel devir (aşağıdaki sıradaki faz notu tarihseldir)

Kaynak: stars-faz90f-hazirlik.zip (oyun 90RC.3), SHA-256:
`5887f28a26f4fa6a25ab5d61aa12ec0deb5648add5dc42175b8ceb11ca3c84ca`.
Güncel oyun build `91a`, SW cache `stars-v91a`. Eski aday ayrı korunur.

Bu fazın sınırı teknoloji verisi hırsızlığı ve isyan kışkırtmadır.
Motor bildirimleri specialOpNotify ile mevcut log/ses/UI tampon yolundan
yayımlanır. UI.alert, eventArt, AUDIO.forLog veya sonuç sonrası refresh
hatası tamamlanmış işlemin sonucunu dışarı istisna olarak taşımaz. Hata
op-presentation tanısına yazılır; tanı hatası da sonucu bozamaz. Mekanik
hatalar yutulmaz; özel operasyonlara tam transaction eklenmedi.

37 yeni senaryo kaynakta 8/29, çıktıda 37/0. Masraf/etki/geçmiş/RNG,
anonimlik, oyuncu UI yolu, AI→oyuncu kota akışı ve mevcut tampon sahipliği
sınandı. Tam regresyon: 48 paket / 3929 geçen / 0 kalan / 0 atlanan.
Tam sonuç tests/results-91a.json; kapsam FAZ91A-RAPOR.txt.

Sonraki iş **91B — bütünleşik günlük AI kampanya ölçümü; Astra / High**.
Diğer özel operasyonların sunum yolları açık risk olarak kalır; iki yolun
düzeltilmesi bütün casusluğun atomik olduğu anlamına gelmez. Şu an kullanıcı
cihaz testi istemiyor; 87T listesi birikir. Yayın yapılmadı.

## 90F hazırlık tarihsel devir (aşağıdaki sonraki faz notları tarihseldir)

Oyun tabanı **90RC.3**; üretim dosyaları 11/11 aynıdır. Build/cache bilinçli
olarak değişmedi. Kaynak ZIP SHA-256:
`0b2f6c03ecf6c701d151782deb01d0ef53cd3132743dedd0e38ab74434260515`.

Bu teslim sürüm kimliği, bütünlük manifesti, açık riskler ve ileri planı
tamamlar. `90F-OKU.md`, `ACIK-RISKLER.md`, `ILERI-GELISTIRME-PLANI.md`
güncel giriş noktalarıdır. `python3 tools/verify-release.py` bütünlük kontrolü
yapar. 47 paket / 3892 geçen sonucu 90RC.3'ten devralınmıştır; bu fazda oyun
regresyonu yeniden çalıştırılmış gibi gösterilmez.

**Sıradaki geliştirme 91A — özel operasyonların sunum hatası sınırı; Astra / High.**
Önce UI.eventArt hatasının gerçek üretim sonucu ve çağıran akış üzerindeki
etkisi yeniden üretilir; sonra dar kapsamlı düzeltme yapılır. Eski aday ayrı
kalır. Cihaz testine ara verilmiştir; kullanıcıdan şimdi test istenmez.
87T ile 90F nihai kabul açık, yayın yapılmadı. Yalnız 90F hazırlığı tamamlandı.

## 90RC.3 tarihsel devir (aşağıdaki sonraki faz notları tarihseldir)

Kaynak: stars-faz90rc-2.zip, SHA-256:
`98526b8f7a5dcfefbddcfbf7fc4ca343ce312d07e9ac89d1ee763c55fb3da800`.
Build `90rc-3`; cache `stars-v90rc-3`. Önceki devir `DEVIR-90RC-2.md`.

Deserialize artık uygulama öncesi özgün G nesne grafiğini ve RNG'yi saklar.
Göç, dünya kurma, türetilmiş durum veya ekonomi adımında hata olursa eski
nesneleri kimlikleriyle geri alıp false döner. Ön kontrolü geçen beş gerçek
bozuk kayıt ve dokuz üretim fonksiyonunun çalıştıktan sonra hata vermesi
sınandı. View/DOM/aktif pointer ve UI seçimi commit öncesinde değiştirilmez.

Başarıda seçimler yeni nesnelere bağlanır, jest ve önbellekler temizlenir.
Sunum hatası başarılı dünya yüklemesini başarısızmış gibi göstermez;
tanıya yazılır. Tamponlanan ses/UI yalnız başarıdan sonra yayımlanır.

48 yeni senaryo kaynakta 3 geçen / 45 kalan, çıktıda 48 geçen / 0 kalan.
Tam sonuç `tests/results-90rc-3.json`, kapsam `LOAD-TRANSACTION-KAPSAMI.md`,
rapor `FAZ90RC-3-RAPOR.txt` içindedir. Üretimde main.js, diplomacy.js
(ortak snapshot'a opaque istisnası) ve sw.js (yalnız cache adı) değişti.
Diğer sekiz ana dosya kaynakla aynı. Save v8, depolama anahtarları,
Situation karantinası ve oyun dengesi korunur.

Sıradaki iş **90F hazırlığı — açık risk/devir ve sürüm dondurma kontrolü**,
öneri **Sol — High**. Yeni somut bulgu olmadan RC düzeltmesi açılmaz.
Nihai kabul 87T cihaz sonuçlarını bekler. Kullanıcı testlere ara vermiştir;
şimdi test istenmez. 91A özellik/denge kapsamı sonra ayrı seçilir.
Karmaşık motor hatasında **Astra — High** kullanılır. Yayınlama yapılmadı.

## 90RC.2 tarihsel devir (aşağıdaki sıradaki-faz notları tarihseldir)

Kaynak: stars-faz90rc-1.zip, SHA-256:
`b89ee2a6999d1f6bd35e68a2887fd002c1f850c150526dcbee06f0a080ad3b97`.
Build `90rc-2`; cache `stars-v90rc-2`.

Bu faz kayıt yükleme kullanıcı akışını kapattı. Dosya seçici artık `change`
yanında gerçek `cancel` olayını da dinler; iptal, abort, okuma hatası ve açma
hatası ayrı sonuçlardır. Gizli input bütün bitiş yollarında hemen kaldırılır ve
FileReader birden fazla son olay üretse bile callback yalnız bir kez çalışır.

Geçerli dosya veya cihaz kaydı dünyaya hemen uygulanmaz. Saf ön inceleme
hanedan ve tarihi gösterir; oyuncu YÜKLE veya VAZGEÇ der. Vazgeçmede dünya ve
hızlı kayıt değişmez. Bozuk kayıt açık dünyayı değiştirmeden reddedilir. Ana
menü yapısal bozuk kaydı devam edilebilir göstermez; cihaz yükleme hatası da
"bulunamadı" diye yanlış sınıflandırılmaz.

Yeni 14 senaryo kaynak 90RC.1 üzerinde 0/14, çıktı üzerinde 14/0 verdi. Tam
regresyon 46 paket / 3844 geçen / 0 kalan. Sonuç
`tests/results-90rc-2.json`, ayrıntı `FAZ90RC-2-RAPOR.txt` içindedir.

Değişen üretim: main.js (dosya seçici, saf ön inceleme, yükleme durumu,
build), ui.js (onay ve geri bildirim), sw.js (yalnız cache adı). Save v8,
depolama anahtarları, Situation karantinası ve oyun motorları korunur.

Kapsam sınırı: 90RC.1 ön kapısından geçen fakat deserialize'ın daha derin bir
aşamasında hata veren kayda karşı tam işlem geri alma hâlâ garanti değildir.
Fiziksel Android kabulü bekliyor; yayınlama yapılmadı.

Sonraki bağımsız iş: **90RC.3 — deserialize tam atomiklik ve derin hata
enjeksiyonu**, model **Astra — High**. 87T cihaz kabulü kullanıcı hazır
olduğunda yürütülür.

## Önceki 90RC kaydı (tarihsel)

Kaynak `stars-faz89b.zip`, SHA-256:
`ce8afbb031c3628d22c51e3329313ece141c530dffc59275108958b40bbf2cbf`.
Build `90rc`; service-worker cache `stars-v90rc`. Önceki devir
`DEVIR-89B.md`, ayrıntılı sonuç `FAZ90RC-RAPOR.txt` içinde.

90RC özellik veya denge fazı değildir. Temiz kurulum, güncel/gerçek eski v8
kayıt, art arda yükleme, yerel dağıtım dosyaları ve PWA güncellemesi denetlendi.

Üç hata kapandı:

1. Eksik PWA kabuğunda `cache.addAll` hatası yutuluyor, yeni worker eksik
   cache ile etkinleşebiliyordu. Artık kabuk tamamlanmadan `skipWaiting`
   çalışmaz; başarısız install eski çalışan sürümü korur.
2. Activate aynı origin'deki bütün yabancı cache'leri silebiliyordu. Artık
   yalnız `stars-v` önekli eski Stars cache'leri temizlenir.
3. Sözdizimi doğru fakat temel kökleri/kimlikleri bozuk kayıt, deserialize
   atamalarından sonra dünyayı yarım değiştirebiliyordu. Yeni ön kapı temel
   kayıt zarfını mutasyondan önce reddeder.

Yeni RC testi kaynak 89B üzerinde 8/7, 90RC üzerinde 15/0 verdi. Tam regresyon
44 paket / 3811 geçen / 0 kalan. Değişen üretim dosyaları yalnız `main.js` ve
`sw.js`; diğer dokuz ana üretim dosyası 89B ile byte-for-byte aynıdır.

Save v8, mevcut depolama anahtarları ve Situation karantinası aynı. Gerçek
Chrome/Android veya service-worker yükseltme testi yapılmadı. Otomatik denetimde
açık P0/P1 yok; cihaz kabulü kullanıcı hazır olduğunda tek güncel ZIP ile 87T
olarak yapılacak. Yayınlama yapılmadı.

Bu bölüm tarihsel 90RC kaydıdır; güncel çalışma sırası belgenin başındadır.
