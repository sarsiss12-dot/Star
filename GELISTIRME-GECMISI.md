# 93D.1 — 13 Ekim 2026

Kanonik 93D üzerinde sınırlı AI üretim düzeltmesi. Verilen 120 aylık bilim
sipariş döngüsü üç tohumda aynen yeniden üretildi. Gerçek korsan kayıpları,
filo yerine gemi sayımı hatası, sivil öncelik ve sabit 500 alaşım engeli ayrıştırıldı.
Çoklu tersane, bakım/rezerv bütçesi, 93C sınıf bazlı teslim ve sınırlı bilim
kaybı yenilemesi uygulandı. Önce/sonra ham kampanya verileri pakettedir.
Save v8 ve 93D araştırması korundu; 93E başlamadı, GitHub yayını yapılmadı.

---
Aşağıdaki bölümler önceki fazların tarihsel kayıtlarıdır.

# Faz 93D — 13 Ekim 2026

Üç görsel bilim ağacı, küresel hedef kuyruğu, uzak hedefin otomatik ön koşul
rotası, teknolojiye bağlı ilerleme koruması ve tarihsiz eski kayıtlarla uyumlu
araştırma geçmişi. Kadim Araştırma gelir kaybı düzeltildi. Save v8 korundu.
93E içerikleri eklenmedi. Ayrıntı: FAZ93D-RAPOR.txt / BILIM-93D.md.

---

# 93A güncel durum — 11 Ekim 2026

Tersanenin sabit sistem hedefi ile filoya özel takviye ayrıldı. Filo
panelindeki toplu tersane hedefi yazan seçim kaldırıldı. Takviye bu filoyu
izler; sabit hedef tersane panelinden seçilir. Eski fleet+sys kayıtlarında
fleet önceliği korunur ve arayüzde açıkça yazılır; sessiz kayıt dönüşümü yok.
Üretimde/sırada, yolda/bekliyor ve yeni sipariş sayıları ortak saf hesaptan
üretilir. Kilitli sınıf, tersane yokluğu, sabotaj ve kapalı rota ayrı gerekçeler.

Sıradaki **93B — Astra / High:** kapanan rotada hedefi saklayan bekleme,
sınırlı yeniden deneme, yeniden hedefleme/iptal ve ana filo kaybı.
Ardından 93C sınıf bazlı filo şablonu + üretim/seyahat hesabı.
Cihaz testi kullanıcı hazır olana kadar istenmez. 91C/87T adayı sabit.

---
Önceki faz notları aşağıda tarihseldir.

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

# STARS — devraldıktan sonra tamamlananlar

## 92C — onaylı paylaşımın gerçek uygulanması

Oybirliği sonrasında katılımcı Uygula düğmesine basar. Güncel dünya ve
değişmez teklif içeriği yeniden sınanır; yalnız onaylı mülkler devredilir.
Karma sistemde üçüncü taraf kolonisi, yörünge ve filolar korunur.
Eski sahibin valisi havuzda kalır; otomatik inşa kapatılır. Son koloni
teslimi reddedilir. Gelir/kapasite güncel mülkiyete göre hesaplanır.
Kısmi hata derin transaction ile geri alınır; makbuz tekrar uygulamayı
ve aynı sefer/tarafın tekrar paylaşılmasını engeller. Eski 92B onayları
yeni kurallar için yeniden sunulmalıdır. Doğal AI gündemi 92D'ye kaldı.

## 92B.1 — kilitli gemi üretimi ve kurulum sekmesi

Araştırma kilidi yalnız düğmede kalmıştı; queueShip doğrudan Muhrip ve
Kruvazör siparişini kabul ediyordu. Sürekli üretimin olmayan
shipUnlocked fonksiyonuna dayanan filtresi de kapıyı açık bırakıyordu.
Ortak izin kontrolü manuel/AI/otomasyon/takviye/federal yollara ve
günlük tamamlanmaya bağlandı. Eski kilitli siparişler korunup bekletilir;
izinli işler ilerler, araştırma sonrası kilitli iş tekrar ücret alınmadan
sürer. Mevcut filolar silinmez. Kurulum Fizyoloji sekmesinin tek emojisi
kaldırıldı. Toprak paylaşımı 92C işidir.

## 92B — gerekçeli paylaşım taslağı ve ortak onayı

92A defterinden güncel ve uygun topraklar seçilir. Kolonili sistemde
gezegenler ayrı sunulur; tarafsız/düşman mülkü pakete girmez. Katkı,
fetih hedefi ve kontrol öneriyi açıklar; oyuncu alıcıyı değiştirebilir.
AI kabul/ret gerekçesi, açık oyuncu oyu, oybirliği, geri çekme, süre ve
eskimiş teklif koruması vardır. Kayıt ve teklif/oy rollback'i bağlıdır.
Gerçek toprak devri 92C'ye kaldı; doğal AI konferans başlatma eklenmedi.

## 92A — savaş katkısı ve katılım geçmişi

Cepheleri açık destek zinciriyle ortak sefere bağlayan kayıt eklendi.
Gerçek uzay muharebesi, çıkarma ve sahiplik değişimi kaydediliyor;
federasyon/senyör geçmişi ve fetih hedefleri korunuyor. Barış/yeniden savaş
ayrı dönem. Anlaşma rollback'i ve v8 kayıt uyumluluğu var. Eski geçmiş
uydurulmuyor; oyuncu diplomasi panelinde kendi cephe özetini görebiliyor.
Toprak paylaşımı henüz açılmadı; 92B–92C sırada.

## 91E.1 — geniş federasyon mevzuatı ve savaş izni

Yedi iç yasa eklendi; iç katalog 11, temel yasalarla toplam 15.
Beş kategori; üç birbirinin yerine geçen politika ailesi; yarım öneri
bedeliyle kaldırma oylaması. Gelir, kapasite, fon, hasar/hız/bakım ve
uyum etkileri gerçek motor noktalarına bağlandı. Savaş Onayı artık yeni
saldırı için hedefli, süreli, tek kullanımlık izin üretiyor. AI da aynı
izni istiyor; savunma yükümlülükleri muaf. Harita kodu aynı tutuldu.
Uzun dönem denge ve mobil panel kabulü açık. Sıradaki 92A — Astra / High.

## 91E — federasyonda gerçek iç yasa gündemi

Üç iç yasa önerisi oyuncu paneline bağlandı. Temel/AI/iç yasa tek gündem,
açık oyuncu oyu, kayıt devamlılığı, süre ve eski pencere koruması eklendi.
Bilim +%12, donanma +15 kapasite ve mevcut fonda %5→%9, üyeliğe bağlı
serbest geçiş gerçek hesaplarda. 31 yeni senaryo; tam regresyon 4070/0.
Savaş Onayı'nın onay üretmeyen eski yolu bulundu; yeni önerisi kapalı ve
tamamlandı sayılmıyor. Sonraki 91E.1 bu borcu ele alacak (Astra / High).

## 91D.1 — filoların devlet adlarını gösterme

Sol harita menüsüne Filo sahipleri anahtarı eklendi. Varsayılan kapalıdır;
açıkken görünen gemilerin altında devlet adı hareket ve kamerayı izler.
Aynı yerde gruplanan filolar için her gerçek taraf satırının yanında bir
ad vardır. Temassız kimlik nötr, korsanlar genel adıyla gösterilir;
görünmeyen filo açılmaz. Tercih yh_fleetnames anahtarına kaydedilir,
oyun kaydı biçimi değişmez. Bağımsız ana mod/Radar/Lojistik korunur.
Sıradaki federasyon fazı 91E — Astra / High.

## 91D — parçalı harita etiketleri ve karma sahiplik

İki eski devlet adı çizimi tek yola indi. Görülen aynı sahipli bağlantılı
parçalar, ekran içindeki kendi sistemlerine çizgiyle bağlı ad alıyor.
Tek sistemli devlet adı gösteriliyor; temassız isim ve keşfedilmemiş
parçalar açılmıyor. Gün ilerlemeden işgal/temas/yeniden adlandırma ve
yüklenen yeni sistem nesneleri etiketlere yansıyor. Taranmış karma
koloniler haritada işaretleniyor; panel sistem hâkimiyeti ve her koloninin
sahibini ayırıyor. Native Canvas ile 40 hedefli kontrol 40/0; çizimler
incelendi. Cihaz testi bekliyor; kalabalık görünümde seçili bölge öncelikli.
Federasyon önerileri ve ortak savaş paylaşımı sonraki fazlardır.

## 91C — korsan savaşı ve AI diplomasi adayları

Korsan filosu ve yuvasının savaş ilanı olmadan çatışmaya girmesi düzeltildi.
Yuva/kalıntı savunması kendi tarafına bağlandı; sıra, ricat, üçüncü taraf
ve tek ganimet yolları sınandı. AI pakt/ittifak için korsan adayını erken
eliyor. 27 yeni senaryo kaynakta 4/23 → çıktıda 27/0; 52 paket 3970/0.
6 doğal kampanya 1440 ay; korsana sonuçsuz müzakere 500→0, bu değişim
aynı zamanda muharebe akışını etkilediği için genel denge başarısı sayılmaz.
91C test adayı sabit; kullanıcı hazır olana kadar cihaz testi istenmiyor.
Sonraki sıra: 91D harita adları; 91E federasyon iç yasaları;
92A–92C ortak savaş katkısı ve paylaşım. Bu yeni özellikler henüz eklenmedi.

## 91B — bütünleşik günlük AI ölçümü ve fraksiyon toplamı

60/100 sistem × seed 11/99/404, doğal temas/keşif/hareket ile 1.223 oyun ayı.
Darbe sonrası %110 toplam iki kampanyada yakalandı; aylık yuvarlamanın %99
bıraktığı da kısa testte gösterildi. Paylar artık deterministik tam %100'e
dağıtılıyor; nesne kimlikleri/RNG ve v8 korunuyor. 8 kısa senaryo: kaynak
1/7 → çıktı 8/0. Ölçüm açık/kapalı eş kayıt ve tekrar determinizmi test edildi.
91C konusu: 1.022 müzakere çağrısının 500'ünün wild hedefte boşa düşmesi.
Cihaz test hedefi 91C sonu tek aday, yaklaşık 20 dakika; şimdi istenmez.

## 91A — iki özel operasyonda sunum hatası sınırı

Teknoloji hırsızlığı/isyan kışkırtma sonuçlandıktan sonra alert/eventArt,
ses veya refresh hatasının oyuncu/AI çağıranına sızması düzeltildi.
Bedel, etki ve geçmiş bir kez kalır; gizli fail politikası değişmez.
37 senaryo kaynakta 8/29, çıktıda 37/0. Tam sonuç tests/results-91a.json.
Bu iki yol transaction yapılmadı; diğer özel yollar ayrı açık risklerdir.

## Önceki teslimlerin kaydı

Güncel teslim: **90F hazırlık**, oyun kodu **90RC.3**.
Regresyon kanıtı 90RC.3'ten: **47 paket / 3892 geçen / 0 kalan / 0 atlanan**.
90F'de üretim/test kodu değişmedi, bu koşu tekrarlanmadı. On bir üretim dosyası
kimliği, paket manifesti ve doğrulayıcı hazırlandı; açık riskler tek listeye,
91A–91D kapsamları ölçülebilir bitiş koşullarına bağlandı. Nihai cihaz kabulü
tamamlandı sayılmadı. Aşağıdaki tarihsel sonuçlar kendi fazlarına aittir.

## 90RC.3 — derin yükleme hatasında geri alma

Deserialize, ön kontrolü geçen kayıtta uygulama/göç/ekonomi hatası olursa
özgün dünya grafiğini ve RNG'yi geri alır. Harita, seçim, jest ve açık UI
durumu commit öncesinde korunur; sunum sonradan ve ayrı hata sınırında yürür.
48 yeni senaryo kaynakta 3/45, çıktıda 48/0. Beş gerçek bozuk kayıt,
12 aşama enjeksiyonu, dokuz gerçek üretim fonksiyonu hata yolu ve native
Canvas/pointer korunumu sınandı. Bu 45 ayrı kök neden değil, önceki sürümün
karşılamadığı 45 test senaryosudur. Ayrıntı LOAD-TRANSACTION-KAPSAMI.md.

## 90RC.2 — yükleme onayı ve dosya seçici

Dosya seçici iptal/abort/okuma hatası yolları, input temizliği ve tek callback
düzeltildi. Dosya/cihaz yüklemede tarih/hanedan ön izlemesi ve YÜKLE/Vazgeç
onayı eklendi. 14 yeni senaryo kaynakta 0/14, çıktıda 14/0. Ön kapı sonrası
derin uygulama hatası borcu bu fazda açıktı; 90RC.3 bu sınırı ele aldı.

Bu liste yalnız bu geliştirme hattının teslimlerini kapsar. Claude'un
86C.1–86C.4H-R4 çalışmaları bize gelen başlangıçtır; aşağıdaki kazanımlar
onların üstüne eklenmiştir. Başlangıç ZIP SHA-256:
`517e8fa7b08ba597635aaa5352c1ef5029ea5035c92b63bca5e3a199f77e838b`.

| Teslim | Yapılan iş | Kanıt / sınır |
|---|---|---|
| 86C.5 | Harita kurtarmasını tek yola toplama; tanının oyun kaydını ezmesini önleme; pano aktarımı ve ilk hata raporunu koruma | 38 tanı + 66 native Canvas kontrolü. Kullanıcı ilk denemede beyaz ekranın tekrarlamadığını söyledi; tüm Android koşulları doğrulanmış değil. |
| 86C.5.1 | Sol açılır menüleri kullanılabilir ekran alanına sığdırma, iç kaydırma; vali/amiral ve liderler listesini ortak portre çizimine bağlama | 48 hedefli kontrol. Gerçek Skia pikselleri ve sentetik geometri; cihaz kabulü bekliyor. |
| 86C.6 | Anlaşma rollback'ini özgün nesne grafiğine taşıma; alias/kimlik/derinlik koruma; son recalc/log sınırı; commit sonrası UI ve ses hatalarını ayırma | 14 tür × 2 yön × 8 hata noktası = 224 enjeksiyon senaryosu, yeni pakette 529 kontrol. Oyun verisi ile yayımlanmış UI etkileri farklı sınırlar. |
| 86D | Elçinin Yakınlaşma/Ticari heyet/Güvenlik teması görevleri; kıdem; savaşta duraklama; eski boolean kaydın göçü; AI teklif değerlendirmesine bağlantı | 58 hedefli senaryo. Aynı ay kıdem iki kez verilmez; yükleme RNG/ay ilerletmez. |
| 86E | DEVLETLER/İLİŞKİ/MÜZAKERE diplomasi merkezi; hedef başına taslak; düşük istihbaratta stok/değerlendirme gizliliği; yinelenen eylemleri toparlama | 45 hedefli senaryo. Taslak UI belleğindedir; dünyalar arasında taşınmaz. |
| 86F | AI karşı teklifinde teknoloji değerini ve ek taviz bütçesini düzeltme; küçük açığı önce kaynakla, gerekirse yeterli küçük teknolojiyle kapatma | 25 yeni senaryo; 3 seed × 360 ay tek saatli karşılaştırma. %60 sınırı ve fırsat sıklığı değişmedi; tam günlük kampanya değildir. |
| 86G | Savaşta NAP/pakt/ittifak alanlarını iki yönde kapatma; eski v8 tutarsızlığını temizleme; Konsey erken dönüşünü ortak savaş yoluna bağlama | 16 yeni senaryo; toplam 3543 geçen. AI/ekonomi/savaş dosyaları korunmuştu. |
| 87A | Casus atama/geri çekme erişimi; ortak hedef kapısı; iptal/eski dünya/eski düğme/maliyet değişimi onay güvenliği; kilitli operasyonların bilgi sızıntısı; süreli kazanımlar ve dosya sonuçları | 36 yeni senaryo; 3 seed × 120 adımlık yalnız AI operasyon karşılaştırması. Ayrıntılı sonuç FAZ87A-RAPOR.txt içinde. |
| 87B | AI adaylarını kanonik uygunluk ve gerçek maliyet rezervinden geçirme; geçersiz yüksek puanlı aday yerine uygun seçeneği değerlendirme; özel incite son kapısı | 26 yeni senaryo; 3×120 laboratuvarda geçersiz standart girişim 575→0. Üretilen sonuç sayısı 492→498; oran/kota artırılmadı. |

| 87C | Teknoloji verisi hırsızlığı ve isyan kışkırtmada başarı/ifşa/sonuçsuzluk, tek geçmiş kaydı, gizli failin korunması, güncel hedef kapısı | 39 hedefli senaryo; özel yollar transaction değildir, UI hatası sınırı raporda açık. |

| 87C.1 | Fısıltının bağımsız başarı/ifşa sonucu, gerçek menü maliyeti/yüzdesi; sahte bayrakta gerçek savaş ve geçici yetki; actor kayıtları | 45 hedefli senaryo. Kuşatma kasıtlı sahte başarı mekanizması ayrı sınıflandırıldı. |

| 87D | Aynı şartlara ret hafızası, bayat teklif yenileme, tek kullanımlı kabul/ret ve eski dünya koruması | 24 hedefli senaryo; aylık zorlanmış 12 ret → 1. AI–AI kodu aynı kaldı; tam kampanya değildir. |

| 88A | Başarısız emirde rota korunumu; aktif bacak sonrası yeni durak; ortak sınır/kapı araması ve gerçek geçit yolculuğu; güvenli ikmal takibi | 38 hedefli senaryo; kaynak 11/27 → çıktı 38/0. Tersane siparişi ve AI tamamlama kullanımı 88A.1 için açık. |

| 88A.1 | Ayrı filo siparişleri; tekrar ödeme koruması; hareketli/geçersiz hedef ve başarısız sevk; AI mevcut üretim hedefi; keşif erişimi ve tarama | 30 hedefli senaryo, toplam 3781 geçen. Üç hazırlıklı AI üretim fırsatında adet/bedel/RNG aynı; kampanya kanıtı değildir. |

| 88B | Gerçek savaş turundan kalıcı sistem raporu; doğru hasar/kalkan/yıpranma metni; kesin kayıp ve ricat sonucu; Enkaz Mühendisliği sahibinin düzeltilmesi | Kaynak 1/23 → çıktı 24/0; tam regresyon 41 paket, 3782/0. Katsayılar değişmedi; cihaz testi bekliyor. |

Önceki raporlar paket içinde saklanır. Test adetleri, bazı paketlerde iddia,
bazılarında birden çok iddialı senaryo sayısıdır; "bütün buglar kapandı"
anlamına gelmez. Gerçek Canvas pikselleri de Chrome/Android yaşam döngüsünün
yerini tutmaz.

## Henüz yapılmış sayılmayanlar

- Uzun ve tekrarlı fiziksel cihaz kabulü; yeni menü/portre düzeninin cihaz sonucu.
- Özel casusluk yollarının tamamının ortak sonuç/uygunluk denetimi.
- Teklif tekrar politikasının cihazda/gerçek günlük kampanyada kabulü; casusluk seçim dağılımının tam kampanyada dengesi.
- 91B'nin 1.223 aylık altı doğal koşusunun ötesinde oyuncu kararları, diğer
  zorluklar, açık kriz/Konsey içeren kampanya değerlendirmesi.
- Genel savaş, lojistik, fraksiyon ve ekonomi dengesinin tamamlanması.

Kullanıcı hazır olana kadar cihaz kontrol listesi birikir; yeni tanı olmadan
beyaz ekran kurtarmasını tekrar tekrar değiştirmiyoruz.


## 89A — olay hafızası ve iç siyaset açıklamaları

İftira ifşasının tüm komplo/sabotaj anılarını silmesi düzeltildi. Olay kaynak
kimliği yeni kayıtlarda v8 ile saklanır; eski belirsiz anılar topluca silinmez.
Üçüncü taraf soruşturmasının ön kontrol/uygulama hedefi eşleştirildi.
Fraksiyon günlüğü tavan/taban sonrası gerçek farkı, talep ekranı Uzlaşı dahil
mevcut moral tahminini gösterir. Civic katalog taraması 13 aktif/23 katalog
dışı flag buldu; yeni civic veya denge katsayısı eklenmedi. 24 hedefli senaryo.


## 89B — günlük kampanya ve stok/rapor tutarlılığı

Temas fixture'ı kullanmadan seed 11, 99, 404 çalıştırıldı. Gerçek günlük
hareket/keşif/ay döngüsü: 120+120+119 ay; üçüncü koşu normal yenilgiyle bitti.
İlk hatalar kısa üretim testlerine indirildi: çift enerji/yiyecek kıtlığında
eksi yiyecek ve savaşta tur öncesi/sonrası gemi sayılarının karışması.
İkisi düzeltildi. 11 yeni senaryo; AI, diplomasi, harita dosyaları aynı.

## 90RC — bütünleşik teslim adayı

Temiz kurulum, güncel ve gerçek eski v8, on kez tekrarlı yükleme, yerel
dağıtım dosyaları ve PWA yükseltme sınırları denetlendi. Eksik kabukta worker'ın
etkinleşmesi, aynı origin'deki yabancı cache'lerin silinmesi ve temel yapısı
bozuk kaydın çalışan dünyayı yarım değiştirmesi kapatıldı. Yeni test 89B'de
8/7, 90RC'de 15/0; tam regresyon 44 paket / 3811/0. Üretimde yalnız main.js
ve sw.js değişti. Fiziksel cihaz ve gerçek service-worker yükseltmesi 87T
kabulünü bekliyor; yayınlama yapılmadı.

## 90RC.1 — bozuk kayıt iç verilerinin reddi

90RC ön kapısının kaçırdığı null gemi/gezegen, eksik/geçersiz tarih,
sayısal olmayan kaynak ve yinelenen filo kimliği testle gösterildi.
Bu girdiler artık dünya atamalarından önce false ile reddediliyor.
Yeni test kaynakta 3/16, çıktıda 19/0; kayıt zarfı, RNG, nesne kimliği,
seçim/kamera/hız ve zamanlayıcılar ret sırasında korunuyor. Yalnız main.js
ve cache adı değişti. Bu faz deserialize için tam atomiklik iddiası taşımaz;
cihaz testleri kullanıcı hazır olana kadar bekliyor.
