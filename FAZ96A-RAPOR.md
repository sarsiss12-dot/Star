# Stars Faz 96A — teslim raporu

18 Ekim 2026. Başlangıç: `sarsiss12-dot/Star`, `main`, `60d90c9829adb377f27440f133cbe9c6b84a75bc` (95E.3). İlk ve son salt okunur GitHub HEAD doğrulamaları aynı commit'i verdi. Kaynak manifestindeki 1. 599 dosya başlangıçta doğrulandı. Bu fazda yerel commit, GitHub commit/push/force push veya main değişikliği yapılmadı. ZIP bu commit üzerine uygulanmış, henüz yayımlanmamış 96A kaynaklarını içerir; GitHub ile birebir aynı sürüm olduğu iddia edilmez.

## 96A-1: mevcut sistem denetimi

- `tradeHubs()` liman binası bulunan koloni sistemlerini buluyordu. Gerçek koloninin sahibi de artık doğrulanır; ele geçirilmiş koloniyi eski listede tutmak liman yetkisi vermez. Paylaşılan sistemde kendi kolonisi olan devlet limanını korur.
- `tradeLinks()` kendi limanlarını, ticaret paktlı yabancı limanlarla en çok üç hiper-yol kenarı üzerinden eşliyordu. Savaş, `tradeBlocked()` yaptırımları ve `G.raids` bağlantıyı engelliyordu. Bu üretim ağı korunur. Fiziksel yük için ayrı sınırlı arama her iki tarafın bildiği, gerçek komşuluklardan geçen açık yolu saklar; düz çizgi üzerinden teslimat yapılmaz.
- `routeVolume()` iki uç sistemdeki koloni nüfusu ×0,6 + liman seviyesi ×4 + lüks başına 6 toplamını yuvarlar. Mevcut formül korunur. 96A bunu sefer ve aynı yön/liman çiftinde toplam aylık taahhüt ve son 30 günlük yükleme sınırı olarak uygular.
- `tradeInfo()` enerji üretimine ağ çarpanı veriyordu; ayrıca `3/hops` teorik sefer ve hacim tabanlı `yield` hesaplayıp aynı çarpana ekliyordu. Yolculuk/varış yoktu. Teorik sefer geliri kaldırıldı. Liman/ağ üretim katkısı ve soft-cap korunur; bu üretim ile gerçek kargo transferi arayüzde ayrı adlandırılır. Teslimat ekstra enerji üretmez.
- `tradeFlowTick()` aylık beş kaynak fazlası/eksiği karşılaştırıp iki tarafın deposunu hemen değiştiriyordu; kıtlıkta oransal azaltıyordu. Bu kaynak değişimi kaldırıldı. Fonksiyon artık aylık AI sözleşme planlamasını ve teslimat sayaç dönemini yönetir. Haraç, tek seferlik diplomatik kaynak transferi ve lüks erişimi ayrı sahiplerinde kalır.
- Eski `raidTick()` çizginin orta noktasında rastgele soyut enerji/maden ganimeti ve stok cezası oluşturuyordu. Bu muhasebe kaldırıldı; aynı `G.raids` kapanma kaydı gerçek kargo saldırısından üretilir. Hayali ganimet ile fiziksel kayıp üst üste uygulanmaz.
- Askerî filo nesneleri savaş, gemi kapasitesi ve otomasyona bağlıdır. Ticaret için ayrı hafif `Commerce` nesneleri seçildi; mevcut filolar gerçek konumları ve savaş gücüyle kargoya saldırır. Yeni askerî gemi sınıfı, kamera veya görsel dosya eklenmedi.
- AI önceden liman/pakt ve aylık soyut takas kullanıyordu. Yeni AI kendi fazla/açığını, gerçek stok, liman, bilinen kısa yol ve mevcut teklif motorunun kabulünü sağlayabilirse aynı sözleşmeyi imzalar. Ücretsiz stok üretimi yoktur.

## 96A-2: sözleşme ve muhasebe

Genel ticaret anlaşması izindir; `freight` maddesi somut yük yükümlülüğüdür. Yeni diplomasi motoru kurulmadı: normalize → validity/quote → mevcut AI değerlendirmesi → atomik `executeDeal()` kullanılır. Ticaret ekranı, diplomasi paneli ve gelen kutusu bu maddeyi destekler. Kaynaklar Enerji, Mineral, Yiyecek, Alaşım, Tüketim Malıdır; Bilim/Etki kargosu reddedilir. Bir sözleşme farklı iki kaynağın karşılıklı iki bağımsız seferini içerir; kaynak veya enerji karşılık olabilir. Miktar pozitif ve en fazla 1000, sıklık 30–180 gün, süre 3–120 ay; kapasite daha düşük sınır koyabilir.

İmzada stok değişmez. İlk yükleme iki gün sonra denenir. İki tarafın da deposu/izni/yolu ve kapasitesi uygun bulunmadan hiçbir yük kesilmez. İki kargo birlikte ayrılır, iki gün hazırlanır ve gerçek rota üzerinde 18 dünya birimi/gün ilerler. Bu iki günlük yük hazırlığında kaynak artık konvoyun taşıdığı yüktür. Alıcı deposuna yalnız fiziksel varışta `finish(delivered)` ekler; hedefe ulaşmamış yükün erken teslim çağrısı reddedilir. Konvoy kimliği terminal makbuzudur; tekrar bitirme kredi yaratmaz.

Her yön ayrı varır. Bir yön kaybolursa karşı yönün teslimatı geri alınmaz; bu risk sözleşme ekranında açıklanır. İptal veya süre bitimi yeni yüklemeyi durdurur; yoldaki kargo geçerli pakt ve limanda teslimata devam eder. İzin/rota/liman engeli en çok 180 gün bekletir, sonra kalan yük kayıptır. Devlet yok olursa yoldaki kargo imha edilir. Yeni sefer, önceki iki yön sonuçlanmadan başlamaz; sıklık garanti değil en erken yükleme aralığıdır.

Muhasebe: yüklenen = teslim edilen + kayıp + hâlâ taşınan; gönderilen teslimat toplamı = alıcının gerçek kazancı. Kayıp, yağmalanan + imha edilen yüktür. Yağmacı yalnız gerçek kargonun %40'ını aynı kaynak olarak alır. Güç>=12 ise kalanı imha eder, daha zayıf saldırı on gün geciktirir. Aynı filo aynı konvoyu yeniden yağmalayamaz. İmha edilen yük iade edilmez. 120 aylık karşılaştırmalarda bu eşitlik her ay kontrol edildi; fark yok.

## 96A-3: yolculuk ve risk

Rota en çok üç kenar, arama en çok 512 düğüm açılımıdır. Her iki tarafın bildiği komşuluklar, düşman denetimi, savaş, ambargo, kaçakçılık istisnası ve gerçek liman sahipliği doğrulanır. Başlangıç/sonraki sistemde aktif muharebe abluka sayılır. Engel değişince en erken 10 günde sınırlı alternatif arama yapılır. Yük hareketi günlük simülasyondadır; çizim rota bulmaz. Korsan/harp filosu 160 dünya birimi içinde gerçek yükten ganimet alır. Korsanlar kapalıysa korsan saldırısı kapalıdır; savaşan devletlerin engeli sürer. `G.raids` yeni yüklemeyi 90 gün keser, zaten yoldaki yük somut saldırı ve açık yol kurallarıyla sonuçlanır.

## 96A-4: arayüz ve AI

Harita araçlarında bağımsız **Ticaret Konvoyları** anahtarı ve **Ticaret sözleşmeleri** ekranı vardır. Diplomasi ve mevcut ticaret panelinden de açılır. Sözleşme iki yönü, limanları, miktarı, süreyi, son teslimatı, toplam teslim/kaybı ve engel nedenini gösterir. Konvoy ekranı gerçek konum, kalan yük, varış tahmini, geçmiş sonuç ve haritada gösterme içerir. Sonuçlar gerçek teslim edilen kaynaklardır; net ekonomik kâr ya da ayrı yeni bir ekonomi merkezi hesaplanmaz.

Canvas simgesi prosedürel, sahip rengiyle, gerçek hareket konumundan çizilir; okunurluk için mevcut etiket yerleştirme alanında küçük ekran ofseti olabilir. Seçim gerçek DOM/pointer yoluyla çalışır ve aynı kamerayı kullanır. Yalnız oyuncunun gönderdiği veya alacağı kargolar gösterilir; üçüncü taraf kargo ve rota ayrıntıları sensör görüşünde olsa bile bu fazda gizlidir. Yeni sevkiyat rotasında bilinmeyen transit sistem kullanılamaz. Kendi sözleşmesinin yükünü bilmek üçüncü taraf filosu istihbaratı açmaz.

AI aylık en çok 4 yeni sözleşme, devlet başına 12, küresel 128 aktif sözleşme sınırına tabidir. Aynı anda 256 aktif konvoy; dolarsa yük kesmeden bekler. Aktif kargo sessizce silinmez. Son 256 terminal sefer ve 128 bitmiş sözleşme ayrıntısı saklanır; kümülatif kaynak sayaçları budanmaz. Çizim ekran dışını eler, en çok 128 görünür simge çizer; anahtar kapalıyken kargo dizisini bile okumaz. Bu sınırlar çizim maliyetini ve nesne büyümesini sınırlar; düşük güçlü fiziksel Android FPS kabulü yapılmadı.

## AI karşılaştırması: 120 ay, 100 sistem

Aynı başlangıç konfigürasyonu, günlük 0,5 adım, 60. ay kayıt/yükleme; tohum 11/99/404. Eski sürüm aynı 95E.3 kaynağından bu fazda yeniden çalıştırıldı. Aşağıdaki stok/güç normal yaşayan AI devletlerinin toplamıdır; sıfır devlet-ay dönem boyunca sıfır stok gözlemidir. Kıtlık `e.shortage` alanıdır.

| Tohum | Sürüm | Enerji stoku (120. ay) | Tüketim malı | Askerî güç | Enerji sıfır devlet-ay | Mal sıfır / kıtlık | Sözleşme / teslimat / kayıp |
|---|---|---:|---:|---:|---:|---:|---|
| 11 | 95e3 | 69 416.7 | 12 938.0 | 34619 | 0 | 0 / 0 | Soyut model; fiziksel kargo yok |
| 11 | 96a | 49 276.3 | 15 853.1 | 37472 | 0 | 0 / 0 | 0 / 0 / 0.0 |
| 99 | 95e3 | 118 822.8 | 13 578.5 | 31056 | 53 | 10 / 10 | Soyut model; fiziksel kargo yok |
| 99 | 96a | 77 840.3 | 15 003.7 | 46120 | 33 | 0 / 0 | 0 / 0 / 0.0 |
| 404 | 95e3 | 264 644.4 | 15 880.6 | 50070 | 18 | 50 / 50 | Soyut model; fiziksel kargo yok |
| 404 | 96a | 99 603.6 | 19 927.6 | 39522 | 0 | 0 / 0 | 3 / 18 / 0.0 |


404'te gerçek yüklenen: 98,9712 Mineral +79,9444 Yiyecek; teslim 81,1770 Mineral +68,3240 Yiyecek; yolda 17,7942 Mineral +11,6205 Yiyecek; kayıp 0. On bir karşılıklı yükleme döngüsü, 18 tamamlanmış yön ve 4 aktif konvoy vardır. Yeni kodun bu son kampanyaları kaynak SHA'larıyla eşleşir.

Olumsuz/sınırlı sonuç: 11 ve 99 doğal 100 sistem kampanyasında somut sözleşme oluşmadı. 11/99/404 son enerji stokları eski sürümden daha düşük; 404 askerî gücü de daha düşük. 99'da enerji sıfır devlet-ay 53→33, 404'te 18→0, tüketim kıtlığı 10/50→0 gözlendi. **Bunlar ticaretin kıtlığı çözdüğünü kanıtlamaz:** 99'da hiç kargo yoktur; teorik gelir ve soyut transferin kalkması, değişen kararlar ve eski rastgele yağmanın RNG tüketiminin kalkması bütün kampanya akışını değiştirebilir. Genel AI dengesi yeniden ayarlanmadı. Aynı sürüm/tohum/kararlar için deterministik kargo testi geçti; farklı sürümlerin aynı rastgele karar yolunu izlemesi beklenmez.

Daha önceki 45 sistem keşif koşuları `campaign-small/` altında tutulur; resmî 100 sistem tablosuyla karıştırılmaz. Son abluka/kapasite düzeltmesinden önceki 96A ölçümleri `campaign-pre-final/` altındadır ve nihai sonuç yerine kullanılmaz. Kontrollü AI testi ayrıca gerçek stoktan yükleme ve varışı doğrular.

## 96A-5: doğrulama ve teslim sınırı

Bu fazda yeniden ölçülen sonuç: **96 benzersiz paket, 5303 başarılı kontrol,0 kalan otomatik hata**. Bunların 2 paket/48 kontrolü yeni kargo testidir. **80 Chromium senaryosu,0 kalan hata:**14 yeni +66 eski senaryonun yeni koşusu. Önceki 95E.3'ün 5203 sonucu kopyalanmadı. Eski paketlerin bugünkü toplamı 5255'tir; yeni modüllerin yükleme/sözdizimi kontrolleri nedeniyle eski rapor sayısıyla sabit değildir. Tekrarlanan koşular toplanmadı.

Save v 8 korunur; isteğe bağlı `commerce.v=1` kökü sözleşme, gerçek yük, rota/konum, saat, makbuz ve sayaçları taşır. Eski kayıtta kök yoksa boş başlar; sahte geçmiş veya anında sevkiyat üretilmez. Yükleme hareket/ödeme yapmaz, bozuk yük/kimlik/muhasebe atomik yükleme reddine gider. Geriye uyumluluk 95E.3→96A yönündedir; yeni kargolu kaydı eski 95E.3 uygulamasında açmak desteklenmez.

İlk başarısızlıklar, kök nedenler, komutlar, tarayıcı boyutları ve delil yolları `TEST-SONUCLARI-96A.md` içindedir. Fiziksel Android/WebView/kurulu PWA, gerçek cihaz klavye/ısı/bellek/FPS testi ve özgün oyuncu kaydı kabulü yapılmadı. Chromium mobil emülasyonu fiziksel test değildir. Portrede ticaret ekranı kullanılabilir; mevcut harita döndürme tavsiyesi korunur.

Teslim `stars-faz96a.zip`; bütün kaynaklar, testler ve bu belgeler manifestle envanterlenir. Manifest kendisini hashlemez; dış ZIP SHA-256 son teslim mesajındadır. CRC, dosya kümesi ve her dosyanınSHA-256 karşılaştırması paketleme aracınca yapılır. GitHub yayını ayrı planlama sohbetine bırakıldı. 96B/96C başlatılmadı.
