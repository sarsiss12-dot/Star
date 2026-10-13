# Sevkiyat yaşam döngüsü — 93B

Üretim kuyruğundaki `delivery` ile üretilmiş filonun `shipment` kaydı ayrı
şeylerdir. Üretim bedeli bir defa ödenir. Üretilmiş geminin sevkini iptal
etmek gemiyi ve kaynak stokunu değiştirmez; kuyruk iptali mevcut 93A.1
makbuz/iade yolunu kullanır.

`shipment`: `fleet` veya `sys`, `state`, `attempts`, `next`.
Eski `joinFleet`/`rallyTo` ilk tikte alınır; karma hedefte fleet önceliklidir.
`joinFleet` mevcut takviye sayacını besler. Hedef kaybında bağ kaldırılır,
shipment hedef kimliği ve `lost` durumu kullanıcı açıklaması için kalır.
Kayıt v8'in mevcut fleet nesne codec'i isteğe bağlı alanı taşır.
Yükleme sayısal retry alanlarını sınırlar; kaynak kesmez, yol aramaz, RNG
harcamaz. Transaction kökü zaten G.fleets'i içerir.

Durumlar: ready → moving / blocked; blocked → moving / paused;
varışta moving → waiting (ana filo hareketli/çatışmada) veya tamamlanma.
Hedef kaybı → lost. İptal teslimat alanlarını siler. Yeniden hedefleme
tek hedef kurup retry bütçesini sıfırlar; başarısız hedef doğrulaması eski
hedefi değiştirmez. Manuel yeniden deneme de yeni dört denemelik tur açar.
Başarılı normal hareket emri eski sevkiyatın yerini alır; başarısız hareket
emri eski sevkiyatı korur. DUR teslimatı iptal eder. Aktif hareket bacağı
iptal/yeniden hedefleme/kayıp sırasında ışınlanma yaratmadan tamamlanır.

İlk başarısız deneme + 5/10/20 gün sonra üç deneme. Başarılı rota sonrası
sayaç sıfırlanır; ileride başka bir rota kapanması yeni bekleme dönemidir.
Oyun zamanı ilerlemiyorsa otomatik retry yoktur. Her stepFleets çağrısında
en fazla sekiz bekleyen rota sorgusu; bu mutlak CPU süresi garantisi değildir.
Üretim çıkışındaki ilk sevk sorguları tamamlanan sipariş sayısıyla sınırlıdır.
Filo hedefi araması step başına kurulan Map'i kullanır.

Ana filo sahibi değişirse, yok olursa veya artık başka bir sevkiyat ise
birleşme reddedilir. Hareketli filo güncel varış düğümünden izlenir.
Çatışma/ricat sırasında otomatik birleşme yoktur. Aynı gemi iki kez
katılamaz: gerçek gemi nesneleri aktarılır ve gönderen dizi boşaltılır.
Genel yerel üretim ve AI otomatik birleştirmesi bekleyen gemiye dokunmaz.

UI: seçili sevkiyatta SEVKİYATI YÖNET; ana filonun takviye bölümünde
bağlı gemi satırları ve YÖNET. Modal hedefleri yalnız kendi bağımsız filolar
ve bilinen sistemlerdir. Dünya/filo nesnesi + modal token eski düğmeyi
geçersiz kılar. Onay veya vazgeç, 0 dahil önceki oyun hızını korur.

Sınırlar: rota kapalıyken yeni takviye siparişi verme kapısı 93A gibi
reddetmeye devam eder. Bu faz önceden ödenmiş/üretilmiş sevkiyatı korur.
AI paused/lost sevkiyata yeni stratejik hedef atamaz; güvenle bekler.
Sınıf şablonları/seyahat süresi optimizasyonu 93C'dir. Android testi yoktur.
