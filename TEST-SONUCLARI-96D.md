# Kilitli kaynak test sonuçları

| Grup | Gerçek son sonuç |
|---|---|
| Önceki paketlerin yeniden çalışması | 106 benzersiz paket / 5.502 kontrol / 0 hata |
| Yeni köken/portre/ses paketleri | 3 paket / 29 kontrol / 0 hata |
| Son tam koşu | 109 paket / 5.531 kontrol / 0 hata; atlanan0 |
| Önceki Chromium | 130 farklı senaryo / 0 kalan hata |
| Yeni Chromium arayüz | 15 farklı senaryo / 0 hata, pageerror0 |
| Chromium ses | 4×45s Offline render + 180s gerçek zaman + yedi-SFX stres = 6 ayrı deney |
| Simülasyon nötrlüğü | 11/99/404, 100 sistem, 12 ay, ay6 v8 yeniden yükleme;36/36 eşleşme |

Tekrarlar bu tablodaki sayılara tekrar eklenmedi. Eski sayılar rapordan başarı varsayılmadı. `full-locked/summary.json` son kaynak üzerinde gerçekten çalışmış 109 pakettir. `final-summary.json` tüm kanıtı bağlar. Son ses bütçesi değişikliğinden önceki ara full-final sonucu kabul edilmedi; onun 3 kozmetik projeksiyon hatası ve ilk 33 eski build/hash beklentisi ayrıca saklandı.

## İlk hata → neden → düzeltme → son kanıt

- Geçersiz köken __proto__: truthy katalog testi prototipi kabul ediyordu. Object.hasOwn, yeni kurulum/şablon güvenli varsayılanı. origins-first14/1; son köken paketi15/0. Eski bilinmeyen kayıtlar bonus eklenmeden okunur.
- İlk native portre galerisi fazla parçalıydı. Bazı maskelerin bağlantıları düzeltildi; ilk/son PNG korunur. Native portre8/0 ve gerçek kurulum portreleri geçti.
- Ön tam koşu109 pakette33 beklenti hatası: eski96c3 cache/build metinleri ve eski audio byte pini. Beklentiler yalnız yetkili yeni sürüm/ses hash'ine uyarlandı; eski referans JSON'ları, kamera/filo/CSS pinleri korunur. İlk loglar saklıdır.
- İkinci tam koşu5528/3: eski95C.1 mekanik projeksiyonunda yalnız portraitVariant:0 ek alanı farklıydı. Sadece bu kozmetik alan isim/amblem gibi dışlandı; temel fixture değiştirilmedi. RNG/stok/teknoloji/filo hâlâ tam karşılaştırılır. Son kilitli koşu5531/0.
- Yeni tarayıcı kurucusu ilk9/4, sonra10/3: yanlış panel adı, boş ilk lider havuzu, eksik intel fixture'ı, parametre almayan openDiplo çağrısı ve açılış ekranında yanlış rotate beklentisi. Oyun motoru bu kurucu hataları için değiştirilmedi. Gerçek60Etki lider alımı ve diplomasi dizininden gerçek tıklama eklendi; son15/0.
- Eski Chromium ilk129/1: değişmeyen bildirim her refresh'te yeni DOM ve giriş animasyonu alıyordu. Kanonik eski metoda aynı durumdan10 yenileme10 düğüm değişimi; yeni metotta0, save/RNG aynı. Mevcut küçült/aç/çöz tıklamaları geçti; ilgili20 senaryo yeniden20/0. İlk timeout ve ekranı saklıdır.
- İlk yedi-SFX stresi13 gerçek SFX: gecikmeli notalar yalnız başlangıç anında sayılmıştı. Bütün aralıkta çakışma kontrolü; son10SFX/8müzik, kırpılma0. Sonrasında ses deneyleri ve bütün109 paket yeniden çalıştırıldı.

## Kapsam ve koruma

Köken15 kontrol; portre8 native kontrol; ses6 kural/tercih/nötrlük kontrolü. Gerçek kriz eşik testi, v8/legacy, geçersiz ID, özel teknoloji erişimleri ve kozmetik RNG ayrımı dahil. Eski testler gerçek kargo/teslim/yağma, üretim/iptal, AI/diplomasi/federasyon/sensör/araştırma/harita/bildirim/muharebe/PWA kapılarını kapsar.

Son üretim değişikliği audio.js ses bütçesiydi. Bundan sonra üretim kilidi korunarak full-locked109/0 ve son dört render/uzun/stres koşuları alındı. Rapor/paketleme sırasında üretim kodu değiştirilmez. İzole test teşhisleri ve önceki koşular final başarı diye sayılmaz.

Node24, Python, @napi-rs/canvas ve Playwright/Chromium133 kullanıldı. Native Canvas gerçek Skia pikselleridir; Chromium değildir. Browser deneyi gerçek DOM/Canvas/Web Audio'dur; fiziksel Android değildir. Referans karşılaştırmaları için dış baseline96A/B/C/C1 ile canonical96C2/C3 gereklidir; bunlar geliştirme girdileridir ve runtime oyun bağımlılığı değildir. Bu ortamda eski baseline üretim hash'leri kendi manifestleriyle16/18/18/18 dosyada eşleşti. Eksik baseline olan başka ortamda karşılaştırma testleri ortam hatası sayılmalıdır.

12 aylık karşılaştırma yalnız kozmetik alan/view tercihlerini dışlar. Yeni120 aylık denge kampanyası, fiziksel Android, gerçek OS background ve öznel dinleme yapılmadı. Bunlar geçti sayılmaz.
