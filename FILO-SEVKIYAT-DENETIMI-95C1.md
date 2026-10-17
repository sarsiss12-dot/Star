# Filo ve sevkiyat — 95C.1

Otomatik takviyenin araştırılmamış gemi ürettiği yeniden üretilemedi. `shipBuildAccess`, gerçek `queueShip`, otomatik sipariş, tersane aktif kuyruğu ve tamamlanma yolu zaten aynı teknoloji kapısındaydı. Kilitli ödenmiş eski iş korunur, ilerlemez; açık işler arkasında takılmaz. Araştırma açılınca tekrar ödeme olmadan tamamlanır. Mevcut kilitli gövdeler yok edilmez.

Ayrı doğrulanan açık: `rebuildThrone`, `shipBuildAccess` aramadan araştırmasız iki zırhlı ve bir kruvazör oluşturuyordu. Yeni yeniden inşa aynı gövde araştırmalarını gerektirir. Başlangıçta verilmiş Taht Gemisi ve Kuşatma Kırıcı'nın gemileri araştırma açmış sayılmaz; elde kalır. Özgün ekrandaki geminin bu başlangıç yollarından geldiği save olmadan kesin söylenemez.

Şablondaki kilitli sınıf gelecekteki hedef olarak saklanabilir; UI bunu açıkça söylüyor. Mevcut, üretimde/sırada, yolda/bekliyor, eksik ve fazla sınıf bazında ayrı. Başka sınıfla gizli ikame yok. Otomatik rezerv/kapasite veya rota beklemesi açıklanır. Genel üretim ve şablon tercihi birbirine karışmaz.

Çok tersaneli otomatik filo sevkiyatı zaten vardı. Özel `delivery.fleet` genel tersane rallisinden önce gelir. Bu faz yeni hareket motoru, imparatorluk rallisi veya yakıt deposu kurmadı. Her tersaneye ralli vermek gerekmez. Farklı genel rallilerle iki tersanenin doğru gerçek filoya tek teslimi; hareketli ana filo; ücretin yalnız üretimde alınması test edildi.

Yeni tamamlanan sevkiyat kaynak tersane kimliğini ek v8 alanı olarak tutar. Eski tamamlanmış kayıtta kaynak yoksa “Eski kayıtta kaynak belirtilmemiş” denir. Kuyrukta kaynak zaten kuyruk sistemidir. UI ortak `queueDeliveryText` ve `shipmentRow` ile tersane ve filo paneline aynı hedef/durum/işlem bilgisini verir. Üretim sürüyor ile tamamlanmış sevk birbirinden ayrıdır.

Gerçek nedenler: eksik ana filo; askerî geçiş kapanması; hiper-yol/kapı bağlantısı değişmesi; bilinen düşman yüzünden güvenli rota yokluğu; hedefin savaşması/hareketi/ricatı; retry sınırı; otomatik üretimin alaşım rezervi veya kapasitesi. Mevcut harekette ikmal yüzünden olmayan bir duruş uydurulmaz. İlk deneme + 5/10/20 günle en çok dört otomatik deneme korunur. Sonrasında elle yeniden dene, hedef değiştir veya iptal et. İptal gemiyi silmez, geri ödeme üretmez, hareketli bacağı ışınlamaz.

| Ölçüm | 95C | 95C.1 |
|---|---:|---:|
| 100 sistem / 50 bekleyen gemi; tik başına değerlendirilen sevkiyat | 8 | 8 |
| Başarısız denemede ek neden rotası / tik | 0 | 8 |
| Bu stres tikinin medyan süresi | 2,08 ms | 3,55 ms |
| Bu stres tikinin P95 süresi | 6,04 ms | 7,18 ms |
| 1000 üst bar HTML üretimi, mock DOM | 11,11 ms | 8,78 ms |
| Üst bar başına muharebe sayımı | 2 | 1 |
| Değişmeyen 1000 ortak sefer tikinde rota araması | 0 | 0 |

Teşhis için başarısız denemede ek rota araması var; bu stres ölçümünde medyan maliyet 1,48 ms arttı. Geçerli hareket fiziği aynı; her kare yeni büyük AI taraması eklenmedi. Node ölçümü gerçek mobil FPS veya geniş galakside bütün olası haritaların üst sınırı değildir. Ham örnekler `tests/audit-95c1/performance.json`.

Yeni lojistik paketi 24/0; eski araştırma kilidi, 31 sevkiyat ve 47 şablon kontrolü yeni fazda geçti. Savaş katkısı ve paylaşım kodu bu fazda yeniden yazılmadı; ilgili 92A–92D regresyonları geçti.
