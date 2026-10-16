# Test sonuçları — 95B

**Nihai birleşik sonuç: 78 paket / 4764 başarılı kontrol / 0 kalan / 0 zaman aşımı.**

Bir tam regresyon çalıştırıldı. İlk tam koşu: 78 paket, 4760 başarılı, 2 başarısız, sıfır zaman aşımı. Ardından yalnız ilgili paketler yeniden çalıştırıldı; aynı kontrol tekrarları toplam sayıya eklenmedi. 95B kapsamına yeni 68 kontrol eklendi. 95A referansı 77 paket / 4696 kontrol idi; nihai toplam 4764'tür.

## Kanıt dosyaları

- `tests/full-95b.log`, `tests/logs-95b/summary.json`: değiştirilmeden korunan ilk tam koşu ve ilk iki hata.
- `tests/audit-95b/targeted-release.log`: 95B'nin 68 kontrolünün tamamı.
- `tests/audit-95b/affected-final.json`: son kaynak üzerinde ilgili altı regresyon paketinin sonuçları.
- `tests/logs-95b-followup/summary.json`: son 95B ve etkilenen paketlerin tek sonuç dizini.
- `tests/summary-95b.json`: her paketin son geçerli sonucundan oluşturulan 78 paketlik birleşik kanıt.
- `tests/audit-95b/*first*`, `*followup*`, `targeted-expanded.log`: hedefli geliştirme sırasındaki hatalar korunur; teslimde gizlenmez.
- `tests/fed-95b/before-final/` ve `after/`: 11/99/404, 120 aylık önce/sonra kampanyaları.
- `tests/fed-95b/continuity/result.json`: aynı tohumla tekrar, 60. ayda save/load ve gözlemci etkisi.

## Kapsam

Üç türün gerçek/ücretli kuruluşu ve AI'nın üç türü oyuncusuz kurması; modların tek uygulanması ve üyelikten çıkışta kalkması; araştırma/enerji ve bakım/fon karşılıkları; dört temel/on bir iç yasanın korunması; üyelik onayı ve adayın ayrıca kabulü; eski oyda yeni üyenin oy verememesi; ihraç hedefinin oy dışı tutulması, baş çoğunluğu ve ölü üçüncü üyeyle istismarın engellenmesi; ayrılma/bekleme; seçim ve otomatik başkan devrinde aynı federal gemilerin devri; dağılma; %75 reform ve çekimserlik; 12/120 aylık saat; eski savaşa geriye dönmeme; açık saldırı onayı; askerî savunma; NAP/ittifak/Konsey ve kapalı rota; ayrı izin/uygulama; Save v8 açık oy/davet/reform/savaş kararı; eski pencere güvenliği; işlem hatasında kaynak/RNG geri alma; düşük istihbarat, gizli takviye ve aldatma; gerçek UI eylem yönlendirmeleri ve mobil panel yapısı.

Mevcut 95A AI, donanma ekonomisi, bilim/teknoloji, keşif, kamera/pointer, ticaret bütünlüğü, diplomasi, savaş, native Canvas ve PWA test paketleri tam koşuda yer aldı.

## Başarısız kontrollerin açıklaması

1. İlk savaş uygulaması testleri tam araştırılmış geometriyi gözlemlenmiş sahiplikle karıştırıyordu. Fixture'a meşru eski gözlem eklendi; üretim rotasının gizli bilgi koruması gevşetilmedi.
2. Eski yasa üyelik testi müttefik ağından oylamasız katılım bekliyordu; açık kabul oyu ve aday yanıtı üzerinden güncellendi. Kapasite kaybı hem eski +15 yasasını hem yeni +12 tür etkisini denetler.
3. Yeni test aynı oyun gününde eski savaşın yeni savunma yükümlülüğü sayılabileceğini kanıtladı. Mevcut savaş defteri sıra numarası eşik olarak kullanıldı; tarih hassasiyeti korunur.
4. Tam koşudaki eski politik dünya eşitliği, eski kayda eklenen anayasa/başkan alanlarını beklemiyordu. Bu idempotans senaryosu ilk kayıttan önce güncel biçime geçirilir; eski kayıt dönüşümünün yasaları/kaynağı/RNG'yi ve oy saatini koruduğu ayrıca açık testle doğrulanır.
5. Tam koşudaki savunma zinciri işlemi, yeni ön kapının mevcut Konsey yaptırımının RNG aşamasını atladığını gösterdi. Otomatik savunma eski savaş motorunun Konsey uygulamasını koruyacak şekilde düzeltildi; gönüllü ortak saldırı kararı Konsey yasağını geçemez. İşlem geri alma testi 529/529 geçti.
6. Son yaşam döngüsü kontrolü, başkan öldüğünde/ayrıldığında mevcut federal gemilerin yeni yaşayan başkana devrini de doğrular. Yeni gemi oluşturulmaz.

Başarısız test silinmedi. Tam regresyon tekrar tekrar çalıştırılmadı. Alt paket tekrarlarının `skipped` listeleri o komutun filtresidir; birleşik dizinde atlanan paket yoktur.

## Performans ve gerçek cihaz sınırı

AI siyasi değerlendirmesi ayda bir, aday taraması devlet sayısıyla sınırlı; yeni her-kare siyasi tarama yoktur. Mevcut bilinçli bilgi grafiği ve önbellekler kullanılır. Yerel siyasi geçmiş 32 olay, davet/kararlar süreli tutulur. Panel mevcut kaydırma ve daraltılabilir bölümleri kullanır; düğmeler mevcut 44px diplomasi hedeflerini devralır.

Gerçek Android cihazı ve gerçek tarayıcı DOM/ekran yerleşimi testi yapılmadı. Yerel Chromium çalıştırıcısı bulunmadı; bunu yapılmış görsel kabul saymıyoruz. Native Canvas/host ve CSS/yapı testleri fiziksel GPU, okunabilirlik, ısı ve bellek kabulünün yerine geçmez. Kampanya host süreleri karşılaştırma raporunda, eşzamanlı test yükü sınırlamasıyla verilmiştir.
