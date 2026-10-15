# Faz 94D — harita ve mobil UI

## Tek 2B kamera

Dikey sıkıştırma, açı, iki parmakla döndürme, eğim/açı menüleri ve ilgili jest verisi kaldırıldı. `w2s` ve `s2w` yalnız merkez/zoom dönüşümünü paylaşır. Eski `a`/`tilt` alanları seçimde etkisizdir ve normalizasyonda temizlenir. Sol kamera düğmeleri/ikinci araç çubuğu yoktur; kayıt/ayarlar menüsünde küçük “Kamerayı sıfırla” kalır. Odaklama işlevi, tek parmak pan, pinch merkezi, mouse wheel ve seçim korunur. Mevcut tek resize/kurtarma yöneticisi değişmedi.

## Sınır kök nedeni

Organik sınır yarıçapı gürültüyle 1,18r'ye ulaşabiliyordu; eski hesap kutusu ±r idi. Üstelik bitmap 0..W/0..H ile kesiliyordu. Bu iki sert kesme giderildi: hesap kutusu ±1,18r, dünya alanı en büyük görünür erişim + pay ile genişletildi. Bitmap `worldRect` bilgisiyle çizilir. Sahiplik/erişim kuralı değişmedi. Cache anahtarı kaynak konumu ve erişimi kapsar; pan/zoom aynı geometriyi kullanır.

Tohum 11, 99 ve 404'te başlangıç konumları 94C ile aynıdır. 11'de başlangıç merkezi y=295,58, erişim=430,07 olduğundan eski üst dünya sınırı etkiyi kesiyordu. Üç örnekte eski bitmap 4912×4912 dünyayı kapsarken yeni alan -547,48'den başlar, genişlik 6006,96 olur. Sol kenar ayrıca sentetik sınır testindedir. Kullanıcının tam sol-kenar görüntüsü/tohumu verilmediği için aynı görüntünün birebir giderildiği kanıtlanmış sayılmaz.

## Etiketler ve küçük ekran

Seçili sistem ve kendi sistemleri önce yerleşir. Çakışan isimler alternatif yakın dikey konuma taşınır; uygun yer yoksa ikincil isim atlanır. Filo satırları da aynı yerleştirmeyi kullanır ve hitbox çizim konumuna taşınır. Bilim/koloni/ordu simgeleri korunur. Diplomasi özet boşlukları azaltıldı; sağ panel uzun metinleri kontrollü satıra böler. Ana UI yeniden tasarlanmadı.

## Performans ve sınırlar

240×240 sınır bitmap'i aynı bellek sınıfında kalır; geniş dünya alanı sınır yumuşaklığını etkileyebilir. Native Canvas 100 sistem/900×420, her varyant 40 kare ölçümü `tests/audit-94d/render-performance.json` içindedir. Bu koşulda 94D medyanı 3,11–3,52 ms; 94C 3,64–4,03 ms. Tek host koşusu Android FPS/ısı/bellek sonucu değildir.

Eski kamera/pointer/resize/kurtarma, map mode ve native Canvas paketleri geçti. Gerçek tarayıcı DOM ve fiziksel Android doğrulaması yapılmadı; özellikle adres çubuğu, PWA geri dönüşü, yön değiştirme ve düşük donanımda yoğun etiketler cihaz kabulünde izlenmeli.
