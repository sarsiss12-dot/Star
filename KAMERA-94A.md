# 94A — Kamera ve dokunmatik kullanım

## Kontroller

- Tek parmak veya sol fare sürüklemesi: pan. Temas kaldırılınca durur;
  ek atalet/animasyon yoktur. Elle giriş mevcut merkezleme animasyonunu keser.
- İki parmak: orta noktayı izleyen yakınlaştırma ve taşıma.
- ⟳: iki parmakla döndürmeyi aç/kapat. Başlangıçta kapalıdır. Kapatmak
  mevcut açıyı korur; ↟ başlangıç açısına döndürür.
- ◎: seçili geçerli filoya veya sisteme odaklanır; zoom ve hedef emri korunur.
- Fare tekerleği: imleç altındaki dünya noktasını koruyarak zoom.
- Kamera düğmeleri mevcut kaydırılabilir sol araç çubuğundadır; en az
  44×44 CSS piksel dokunma alanı ve erişilebilir adları vardır.

Zoom aralığı önceki .035–1.9 olarak korunur. Harita sınırı döndürülmüş
viewport genişliğini ve yüksekliğini hesaba katar; kenar sistemleri merkeze
alınabilir. Eğik/perspektif görünüm uygulanmadı.

## Jest güvenliği

14 CSS piksel ve 420 ms altındaki tek temas seçim olabilir. Sürükleme,
çoklu temas, pointercancel ve capture kaybı seçim/filo emri üretmez.
Pointerup konumu da başlangıca göre denetlenir; atlanmış move olayı uzun
hareketi tap yapmaz. İkinci parmak hareket etmese bile kalan parmağın
kaldırılması seçim sayılmaz. Pinch sonrası kalan parmağın başlangıcı yeniden
kurulur; hareket sıçramaz. Üçten fazla/üç temas sırasında kamera hareketi
uygulanmaz; çoklu temas bitince seçim engeli korunur.

Canvas dışına çıkışta pointer capture kullanılır. Canvas yer değiştirirse
client koordinatından sol/üst offset çıkarılır. Wheel dinleyicisine
passive:false gerçekten iletilir; eski yardımcı bu parametreyi düşürüyordu.
Sağ/orta fare düğmesi tek parmak olarak yorumlanmaz.

Normal dokunmada mevcut filo satırı seçim alanları korunur. Kamera
hareketinde eski alanlar temizlenir, çizim yeni konumlara göre üretir.
Resize, blur, görünürlük kaybı ve mevcut kurtarma yolları jesti temizler.
Tek resize yöneticisi, yüzey bağlama jetonu ve listener sökme mekanizması
korunmuştur; ikinci yönetici veya yeni render döngüsü eklenmedi.

## Ortak dönüşüm

w2s: kamera merkezinden çıkar, kamera açısıyla döndür, zoom uygula,
viewport merkezini ekle. s2w bunun tam tersidir. Sistem/filo hit testi ve
hedef emirleri aynı ters dönüşümü kullanır. Normal sistem, rota, hyperlane,
hâkimiyet ve etiket anchor çizimleri aynı w2s yolundadır.

Sınır ve bulutsu dokuları iki köşe arasına esnetilmez; dünya dikdörtgeni
aynı açı ve ölçekte çizilir. Paralaks yıldızları ve hareketli gemi yönü
kameranın açısını izler. Etiket yazıları ekran düzleminde yatay kalır.
Görüş alanı döndürülmüş viewport'un kapsayıcı dünya kutusudur; mevcut
300 ekran piksellik güvenlik payı korunur. Bu yöntem köşeleri yanlışlıkla
kesmez fakat 45 derece civarında bazı görünmez öğeleri de tarayabilir.

Kamera açısı oturuma ait görsel durumdur; Save v8 şemasına alan eklenmedi.
Eski cam nesnesinde açı yoksa sıfır kabul edilir; NaN/Infinity açı mevcut
camSane yolu üzerinden sıfırlanır. Kamera girişleri gameplay RNG tüketmez.

## Etiketler

Sistem isimlerinin arka planları gerçek yazı genişliğiyle sınırlıdır ve
okunabilirlik için korunmuştur. Devlet/filo sahipliği etiketlerinde mevcut
ölçüm, genişlik sınırı ve çakışmadan kaçınma mantığı korunarak koyuluk
.90/.92'den .82'ye düşürüldü. Yeni görsel tasarım veya sanat eklenmedi.

## Kapsam

Ekonomi, AI, savaş, diplomasi ve bilim motoru yeniden yazılmadı.
main.js yalnız build kimliği ve kamera açısı sağlamlık kontrolünde değişti.
ui.js yalnız üç kamera düğmesi ve eylemleri; map.js dönüşüm/giriş/çizim;
sw.js sürüm. index.html, economy.js, ai.js, combat.js, diplomacy.js
93E.1 ile byte-for-byte aynıdır. Tamamlanan bilim/AI kazanımları korunur.
