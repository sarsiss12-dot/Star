# Filo bileşimleri ve tersane optimizasyonu — 93C

## Kullanım

Filo → Bileşimi oluştur/düzenle. Korvet, muhrip, kruvazör, zırhlı ve taarruz
ordusu hedefleri ayrı ayarlanır; toplam en fazla 300. Araştırması kapalı sınıf
planlanabilir ama araştırma açılmadan üretilemez. Bilim, koloni, inşaat,
Colossus/kriz sınıfları bu askerî kadro aracının dışındadır.

Kaydetmek ücret kesmez. Takviye Siparişi tek tıklamada en fazla 30 eksik
sipariş verir; büyük kadroda kalan eksik gösterilir, yeniden basılabilir.
Otomatik Takviye açıkken oyun günü başına en çok bir oyuncu filosu işlenir;
aynı filo en erken beş gün sonra, en fazla dört siparişle tekrar değerlendirilir.
Mevcut navyAsleep kasa/kapasite kapıları kullanılır. Manuel sipariş mevcut
oyundaki gibi bu otomatik uyku kapısına tabi değildir.

Hedef düşürmek mevcut gemileri terhis etmez veya ödenmiş işleri iptal etmez.
Fazla miktar gösterilir ve o sınıfta yeni sipariş verilmez. Üretim iptali
tersane panelindeki mevcut makbuz/iade yoludur. Otomatiği kapatmak, kuyrukta
ve yolda olanları korur. Ayrılan gemi kadroda bir eksik sayılır; otomatik açık
ise yenilenir. Manuel birleşmede seçili ana filonun kadrosu korunur; kaybolan
filo kimliğine ait eski sevkiyatlar 93B'nin hedef kaybı yönetimine tabidir.

## Muhasebe ve kayıt

f.composition={counts:{kor:15,muh:10,kru:5},auto:false,next:oyunGünü}.
Save v8'in mevcut filo nesnesinde isteğe bağlıdır. Eski kayıtlarda şablon
icat edilmez; kullanıcı kaydedene kadar baskın sınıf/capTarget davranışı kalır.
Geçersiz sınıf, kesirli/negatif/taşan adet, sivil sınıf veya 300 üstü toplam
reddedilir. Geçersiz yüklenmiş şablon kaldırılır, otomatik satın alma açılmaz.

Her sınıf için eksik=max(0,hedef-mevcut-siparişte-sevkiyatta).
Bekleyen/paused teslimat joinFleet bağı durdukça sevkiyatta sayılır; tekrar
satın alma yapılmaz. İptal/yeni hedef yalnız ilgili bağı serbest bırakır.
Ele geçirilmiş tersanedeki eski sahibin işleri artık o sahibin eksiğini kapatmaz.
Üretim/varış sayacı gerçek sipariş ve gerçek gemilerden türetilir; ayrı bir
azaltılması unutulabilen rezerv sayacı veya kaynak iadesi icat edilmez.

## Seçim algoritması

Her sınıf için hedef filonun mevcut sistemi veya aktif bacağının varışına
ters yönde tek zaman ağı kurulur; bütün tersaneler bu sonucu paylaşır.
Sınıfın hızı, hız modları, nebula yavaşlaması ve 0.1 mesafeli kullanılabilir
kapı kenarı hesaba katılır. Komşu/kapı erişimi güncel sınır kurallarındandır.
Bölgeyi biliyorsak düşman sahipliği, ayrıca görünür silahlı düşmanlar elenir.
Oyuncunun görüş dışındaki düşman filoları karar verisine sokulmaz. AI görüşü
kendi bölge/filosu ve komşu sistemlerle sınırlı muhafazakâr gözlemdir.

Tezgâh sayısı gerçek yardCount ile alınır. Araştırma yüzünden bekleyen eski
siparişler activeShipQueue gibi tezgâhı işgal etmez. Her izinli mevcut iş,
kalan üretim süresiyle en erken boşalan tezgâha yerleştirilir. Yeni iş için
bekleme+üretim+rota süresi en küçük tersane seçilir; o tezgâh hemen rezerve
edilir, sonraki sipariş güncel slotları görür. Büyük gövdeler önce planlanır;
eşit sonuçta sistem ID'si belirleyicidir. RNG tüketilmez.

Bu, mevcut durumdan yapılan artımlı bir teslim süresi optimizasyonudur;
bütün gelecekteki hareketleri bilen küresel optimum veya kesin varış vaadi
değildir. Nebula kenarında düşük hız esas alınarak muhafazakâr süre kullanılır.
Ana filo hareketi, sabotaj, araştırma açılması ve yeni tehlike ETA'yı değiştirir.
Son Takviye Planı sipariş anındaki yaklaşık son teslim gününü gösterir.

Yeni takviye delivery.safe=true taşır. Üretim bitince güncel güvenli rota
tekrar bulunur; yolda sonraki bacak öncesi bilinen yeni tehdit kontrol edilir.
93B retry sayısı/5-10-20 günlük aralıkları ve sekiz rota sorgusu bütçesi aynıdır.
Hiç güvenli rota yoksa üretim başlatılmaz; sonradan kapanırsa gemi ve hedef
korunur. Savaş cephesinin içindeki hedef güvenli bölgeye dönene kadar bekleyebilir.

## AI ve sınırlar

AI ilk takviye kararında mevcut sınıfları koruyan, açılmış savaş sınıflarına
dağıtılmış 30 gemilik (veya mevcut capTarget) kadro kurar. Kendi askerî bütçe
kararı içinde ayda en fazla bir hedefli sipariş; mega/Colossus rezervi korunur.
Oyuncunun otomatik satın alma döngüsü AI'ı ikinci kez ücretlendirmez.
Kadro ve bekleyen sipariş hedefleri AI'ın sıradan otomatik birleşmesinden hariçtir.
Colossus teknolojisinin açık olması, o tur Colossus siparişi verilmese bile
normal askerî üretimi engellemez; aynı üretim dalında ikinci sipariş verilmez.

AI kadroları teknoloji açıldığında otomatik yeniden tasarlanmaz. Kayıp ana
filoya ait paused/lost sevkiyatı başka hedefe stratejik atama 93B'deki açık
sınır olarak kalır. Tam Android kabulü ve uzun dönem AI dengelemesi ayrıdır.
