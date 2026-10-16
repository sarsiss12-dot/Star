# Ortak askerî seferler — 95C

## Yetki ve veri

`G.jointOps` v1, Save v8 içinde isteğe bağlı ek alandır. Plan kimliği, mevcut 92A sefer/taraf kimliği, sponsor, düşman, güncel üyeler, siyasi bağın açıldığı tür/kimlik, hedef, toplanma noktası, gerçek filo kimlikleri, cevaplar, süre ve durum saklanır. Aynı sefer/tarafta bir etkin plan; dünyada en çok sekiz etkin plan, plan başına 24 filo; son 24 kapanmış plan tutulur. Oluşturma/iptal arasında kısa süreyle 25 kapanmış kayıt olabilir; toplam yükleme sınırı 32'dir.

Yeni savaş ilanı, üyelik, oy, izin veya kaynak üretilmez. İki devletin aynı düşmanla savaşması yeterli değildir: yaşayan karşılıklı savaş cepheleri aynı 92A sefer/tarafına açık destek zinciriyle bağlanmış olmalıdır. İttifak/federasyon kurmak bağımsız eski cepheleri birleştirmez. Askerî/Bilimsel/Ticaret anayasaları ve açık oyuncu onayı 95B'nin sorumluluğunda kalır.

Bağlar: aynı federasyon, karşılıklı ittifak, geçerli senyör/vasal ilişkisi veya aktif `proxyWar` savaş sözü. Savaş sözü sponsor cephesiyle aynı seferde doğrulanır; tek başına askerî geçiş hakkı sağlamaz. Federasyonun dağılması/üyenin ayrılması o bağla açılan görevi düşürür; sonradan kalan ittifak eski federasyon emrini sessizce devralmaz.

## Gerçek kuvvet ve savunma

Her devlet kendi filolarını değerlendirir. Sevkiyat/takviye, geri çekilme, muharebe, koruma/Colossus kilidi, özel görev ve mevcut bağımsız hareket emri taşıyan kuvvet yeni plana alınmaz. Bir otomatik ortak planı, açık oyuncu talebi ancak yeni hedefin kabul edilmesinden sonra değiştirebilir. Oyuncunun kendi filoları otomatik plana tahsis edilmez.

Görülen tehdit altındaki başkent ve koloniler için yakındaki gerçek savunma kuvveti ayrılır. Tehdit olmayan başkentte de küçük muhafız tutulur; bölünemeyen tek büyük filonun bütünü tutulabilir. Bu muhafazakâr davranış yardım reddine yol açabilir. İleri boş düğümün komşusundaki düşman, başkent tehdidi gibi bütün orduyu kilitlemez. Kritik ana tehdit sonradan ortaya çıkarsa yardım kuvvetleri geri çağrılır.

Askerî tür toplanma değerlendirmesinde daha yüksek koordinasyon eğilimi alır. Bilimsel/Ticaret üyelerinin fiilen kabul edilmiş savaşı yoksa koordinasyona giremez; kabul edilmiş savaşta aynı gerçek hareket yeteneğini kullanırlar. Kaynak/üretim hibesi yoktur; mevcut 93C/93D.1 şablon ve askerî üretim bütçesi devam eder.

## Toplanma, ETA ve taarruz

95A'nın `aiKnownRoute` araması, bilinen geometri ve gerçek askerî izinler kullanılır. İsteğe bağlı düğüm filtresi, toplanmaya giden tekil filonun bilinen düşman ara düğümünden geçmesini engeller. Ortak taarruzun önündeki başka düşman sisteminin sessizce aşılması da engellenir; önce o cephe hedeflenmelidir. Yeni hareket motoru yoktur.

En fazla altı bilinen dost ikmal düğümü; mesafe, ETA, sahiplik, gerçek izin, görülen tehdit, mevcut görev ve her devletin ikmal durumu üzerinden karşılaştırılır. Bilinen kapılar ve mevcut hız/nebula/komutan değiştiricileri aynı hesapta kalır. Bekleme sınırı en fazla 180 oyun günü; olağan toplanma ETA'sına 30 gün pay verilir.

Hazır kuvvet tahmini savunmanın en az %125'ini sağlamıyorsa saldırı yapılmaz. Müttefikin bildiği hedef savunması, o müttefik kuvvet ayıramasa da ortak risk tahmininde kullanılır. Hiç gözlemi olmayan üye sonsuz savunma uydurup diğerlerini engellemez. Düşmanın gizli gemileri okunmaz.

Filolar toplanınca en yavaş ETA ortak varış zamanı olur; hızlı filonun mevcut `stepFleets` rotasına başlaması `jointHoldUntil` gününe kadar ertelenir. Hareket yine `orderMove`/`stepFleets` üzerinden gerçekleşir. Gerçek tik çözünürlüğü, sonradan hız/erişim değişimi veya muharebe nedeniyle kesin aynı an garantisi yoktur. Seyahat başladıktan sonra yeni bir fizik veya sürekli hız eşitleme yoktur.

Geciken/yok olan filo bekleme süresini sonsuz uzatamaz. Hazır kalan kuvvet yeterliyse çıkar; yetersizse geri çekilir. Toplanma kaybında en fazla iki yeniden değerlendirme; görev için en fazla 720 gün. Başarısız otomatik plan için 90/180 günlük bekleme vardır. Olağan hareketli hedef güncellemeleri başarısız deneme sayılmaz.

## Birlikte savaşma ve gerçek fetih

Denetlenen kök neden: eski `combatTick` aynı sistemde yalnız ilk düşman devlet çiftini çözüyordu. Yeni çift listesi yalnız aynı aktif seferdeki siyasi ortakları bir araya alır. Her devlet kendi filolarıyla mevcut `battleRound` içinde ateş eder. Birden çok rakip varsa atış bütçesi ilgili gerçek gövde ağırlığına bölünür; savunan üç ayrı tam salvo kazanmaz. Ortak olmayan sıradan düello, korsan ve kalıntı yolu korunur.

Hasar, imha, yorgunluk ve katkı mevcut gerçek aktör çiftine yazılır. Tarafsız üçüncü devlete ateş izni doğmaz. Çiftler mevcut motorla sırayla çözülür; bu eşzamanlı yeni muharebe fiziği değildir. Mevcut kısa muharebe raporu son çözülen çifti gösterir; bütün koalisyonu tek raporda sunma bu fazda yoktur.

Savunmasız ve kolonisiz düşman yörüngesinde eski motorun çatışma başlatmadığı uç için: gerçekten varmış silahlı destek filosu, düşman kuvvet/savunma ve koloni kalmadığında mevcut `captureSystem` yolunu kullanır. Oyuncu/müttefik mülkü paylaşım gibi ele geçirilmez. Kolonili sistemler mevcut bombardıman/kara savaşı motorunda kalır. İlgili düşman kolonisi hâlâ varsa ortak fetih görevi salt yörünge sahipliği değişti diye tamamlanmaz.

## Yaşam döngüsü ve maliyet

Geçerlilik hareketten önce ucuz denetlenir. Ağır rota/hedef değerlendirmesi beş oyun gününde, yeni otomatik plan en çok ayda bir ve dört yeni plan bütçesiyle yapılır. Aynı gün tekrar çağrı RNG veya emir üretmez. Ortak plandaki kapanan bacak, genel motorun bilinmeyen galaksiden alternatif rota açmasına bırakılmaz; durur ve bilinen rota değerlendirmesini bekler.

Barış, taraf çıkışı, siyasi bağ kaybı, düşmanın ölmesi, hedef değişimi, emir iptali ve kayıp filolar temizlenir. İptal mevcut bacağı bitirir; sonraki eski rota silinir. Gemiler silinmez, sipariş/ödeme geri alınmaz, ışınlanma olmaz. Geri çekilme yalnız mevcut yasal rota ve gerçek filolarla yapılır; yol bulunamazsa filo bulunduğu yerde kalabilir.

Kayıt sürümü 8; eski kayıtta boş plan listesi. Kimlikler, durum, sayılar, filo sahipleri ve tek rezervasyon yüklemede doğrulanır. Bozuk ek alan mevcut yükleme işlemiyle atomik reddedilir. Süreler, RNG ve devam eden gerçek varış testi korunur. Diplomatik işlem geri alma köklerine `jointOps` eklendi.
