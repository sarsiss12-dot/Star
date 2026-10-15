# 94C — Sade kamera ve hafif eğik görünüm

Sol araç çubuğundan cameraReset, cameraFocus ve cameraRotate düğmeleri
kaldırıldı. Yerlerine yeni simge veya dikey çubuk konmadı. Ana oyun, harita
modu, kayıt, imparatorluk ve mevcut ana merkeze dönüş kontrolleri korunur.

KAYIT VE AYARLAR içindeki küçük GÖRÜNÜM / KAMERA bölümü dört seçenek içerir:
Düz görünüm (2B), Hafif eğik görünüm, Kamera açısını sıfırla ve iki parmakla
döndürme aç/kapat. Düğmeler 44 piksel dokunma yüksekliğine ve satır kaydıran
yerleşime sahiptir. Bağımsız odak düğmesi artık gösterilmez; mevcut merkezleme
altyapısı korunur. Yeni panel veya ikinci resize yöneticisi eklenmedi.

## Görünüm ve matematik

Yeni uygulama oturumunun başlangıç görünümü 0,78 dikey ölçekli hafif eğiktir.
Bu gerçek 3B/perspektif değil, ucuz bir 2B affine dönüşümdür. Eksik tilt alanı
olan eski kamera nesneleri 1,0 düz ölçek kabul eder. Sıfırlama hem açıyı sıfırlar
hem düz 2B'ye döner; kamera konumu ve zoom korunur. Döndürme varsayılan kapalıdır.
Görünüm seçimi oturumluk görsel durumdur; Save v8 oyun verisine kamera ayarı
eklenmez. Yükleme mevcut görünümü bozmaz, yeni tarayıcı oturumu varsayılanla açılır.

Kamera merkezinden fark dx,dy, zoom z, açı a ve dikey ölçek t için:

    sx = (dx*cos(a) - dy*sin(a))*z + viewportWidth/2
    sy = (dx*sin(a) + dy*cos(a))*z*t + viewportHeight/2

s2w önce ekran Y farkını z*t'ye, X farkını z'ye böler, ardından ters döndürür.
Bu nedenle aynı dönüşüm bütün açılar/ölçeklerde terslenir. Dünya bitmap'i de
aynı ölçek-döndürme sırasını kullanır. Gemi yönü projekte edilmiş iki noktanın
açısından hesaplanır. Etiketler ekranda yatay kalır; metne eğim uygulanmaz.

Seçim toleransı dünya birimi yerine ekranda 34 piksel mesafedir. Dikey sıkışma
nedeniyle dokunma alanı daralmaz. Viewport culling ve kamera sınırlarında dikey
ölçek hesaba katılır. Sürükleme/pinch mevcut s2w tabanlı ankrajı kullanır.
Eski tek parmak sürükleme eşiği, çoklu dokunma sonrası seçim engeli, pointer
iptali ve Canvas kurtarma akışı korunur. Siyah etiket zemini okunabilirlik için
korundu; bu fazda genel sanat veya etiket tasarımı değiştirilmedi.

## Doğrulama

- 94A kamera paketindeki 27 kontrol korunarak eski sol düğme beklentisi menü
  yerleşimi beklentisine çevrildi.
- Yeni 94C paketinde 9 açı/eğim birleşiminde ileri/ters dönüşüm ve doğru sistem
  seçimi; menü seçenekleri/sıfırlama; pinch orta noktası; pan; filo hedef emri;
  sağ panel; ekran piksel toleransı; yön/boyut değişimi; kenarlar; culling;
  Canvas kurtarma; yükleme ve native Canvas bitmap hizası doğrulandı.
- PWA cache stars-v94c, build 94c. Eski cache/build bekleyen regresyonlar güncellendi.
- Ekonomi, bilim ve kamera ayarlarının RNG'yi değiştirmemesi kontrol edildi.

100 sistem, 900×420 native Canvas, ısınma sonrası 40 karelik host ölçümü:

| Görünüm | Medyan ms | P95 ms |
|---|---:|---:|
| 94B düz | 5,23 | 8,73 |
| 94C düz | 6,12 | 11,24 |
| 94C hafif eğik | 5,20 | 7,30 |

Ham ölçüm: tests/audit-94c/camera-performance.json. Kısa host ölçümü ve
eşzamanlı yük nedeniyle bu tablo evrensel hızlanma veya Android FPS garantisi
değildir. Fiziksel Android/WebView, GPU, ısı ve arka plan işletim sistemi
senaryoları cihaz üzerinde test edilmedi. Otomatik yaşam döngüsü testleri ile
gerçek cihaz kabulü ayrı tutuldu; teslim cihaz testi beklenerek durdurulmadı.
