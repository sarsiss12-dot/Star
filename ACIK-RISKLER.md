# 92D ek riskler

- Android ve gerçek tarayıcı kabulü yapılmadı.
- Doğal koalisyonların paylaşım sıklığı ve adaleti uzun dönem denge borcudur.
- Otomatik redden sonra ikinci pazarlık turu yok; manuel taslak kullanılabilir.
- Büyük savaş/teklif arşivlerinin maliyeti sınırsız kampanyada ölçülmedi.
- Tersane/filo toplanma noktası çelişkisi, panelin sipariş sayısı ve kilitli
  gemiye yanlış kaynak mesajı 93A kapsamına alındı; 92D bunları değiştirmez.

---
# 90F hazırlık — açık risk ve kabul tablosu

Durum tarihi: 2026-10-05. Güncel geliştirme 92C; sabit test adayı 91C. Testlerin geçmesi bütün
oyun durumlarını kapsadığımız anlamına gelmez. Aşağıdaki olası önemler,
her satırın cihazda yeniden üretilmiş hata olduğu anlamına gelmez.

92B.1: araştırma kilidi açığı üretim motorunda yeniden üretildi ve
kapatıldı. Eski kilitli kuyruk korunup bekletilir; önceden tamamlanmış
gemiler geriye dönük silinmez. Bu düzeltmenin uzun kampanya dengesine
etkisi ve mobil bekleme metninin yerleşimi ayrıca kabul bekler.

| ID | Alan / durum | Kanıt ve sınır | Kapanış / sıradaki iş |
|---|---|---|---|
| R01 | Android beyaz harita / yüksek etkili kabul açığı | Kullanıcının son denemesinde görülmedi; tekrarlı arka plan, orientation, gerçek context/PWA yaşam döngüsü doğrulanmadı | 87T: tanı ile gerçek cihaz; yeni kanıt yoksa recovery koduna yeniden yama yapılmaz |
| R02 | PWA yükseltme/offline / kabul açığı | Yerel install/activate testleri geçti; gerçek Chrome worker geçişi sınanmadı | 87T: eski kurulum üstüne güncelleme, offline açılış, kayıt korunumu |
| R03 | Menü/portre/dokunmatik / kabul açığı | Menü ve vali/amiral portresi native Skia/sentetik olaylarla sınandı | 87T: adres çubuğu açık/kapalı, menünün son satırı ve iki panelde aynı portre |
| R04 | Büyük kayıt performansı / ölçüm açığı | 100 sistem/63 filo Node ortanca yükleme 82→101 ms, p95 94→201 ms; Android RAM/GC ölçülmedi | 87T akıcılık gözlemi; belirgin sorun olursa ayrıca profil, snapshot koruması ölçümsüz kaldırılmaz |
| R05 | Özel casusluk sunum hatası / kısmen kapandı | 91A teknoloji hırsızlığı/isyan için alert/eventArt/audio/refresh sınırını kapattı; motor istisnaları ve diğer özel operasyonlar transaction değildir | Kalan kuşatma sabotajı, entrika ve diğer yollar yeni ölçümle ayrı kapsam; iki yol için 37 senaryo geçti |
| R06 | AI diplomasi aday filtresi / kodda kapandı, denge açık | 91B 500 wild girişimi → 91C 0. Son 6 koşuda 381 gerçek karar, 356 uygulama, 42 karşı teklif. 509 operasyonun giriş kapısı reddi 0 | Filo/yuvaya gerçek çatışma da açıldığından kampanya farkları yalnız filtreye yüklenemez; kabul oranı denge kanıtı değildir |
| R07 | Kampanya çeşitliliği / kapsam açığı | 91C 60/100 sistem × 3 seed, 1.440 ay; 6 koşu 240 aya ulaştı, biri son ayda normal yenilgiyle bitti. Ölçülen stok/referans/fraksiyon koşulları temiz | Oyuncu kararları, açık kriz/Konsey, diğer zorluk/şekiller ölçülmedi; otomatik kampanya fiziksel cihaz değildir |
| R08 | Civic bağlantıları / ürün kapsamı | 89A taramasında 13 aktif / 23 katalog dışı flag; hepsi eksik özellik diye sınıflandırılamaz | Eski 91D işi 91F oldu: etkin katalog/metin/etki eşleştirilecek; yeni civic ayrı tasarım kapsamı |
| R09 | Transaction sınırları / belgelenmiş sınır | Anlaşma ve yükleme için tersinir oyun grafiği testli; özel operasyonların tamamı aynı transaction değildir | Yeni mutasyon yollarında kapsam kontrolü; native/process çökmesine evrensel geri alma iddiası yok |
| R10 | Korsan/yuva saldırısı / kodda düzeldi, cihaz ve denge açık | 21 hedefli senaryo: kaynak 2/19 → çıktı 21/0; yuva karşı ateşi ve tek ödül; 6 kampanya temiz | 87T'de doğal fırsat varsa saldırı. Eskiden işlemeyen korsan/kalıntı savunmasının etkinleşmesi tehlikeyi artırabilir; yeni katsayılarla dengelenmedi |
| R11 | Parçalanmış alan adları / kodda düzeldi, cihaz açık | 91D: tek etiket yolu, keşfedilmiş parçalara sistem bağlantısı, temassız ad gizliliği, karma koloni açıklaması; 40 hedefli native kontrol | Yoğun görünümde sığmayan adlar atlanır, seçili bölge önceliklidir; Android okunabilirliği/çizim maliyeti henüz ölçülmedi |
| R12 | Federasyon yasaları / kodda tamamlanan kapsam; denge ve cihaz açık | 91E.1: 4 temel + 11 iç yasa, 5 kategori, alternatif/kaldırma; hedefli izin, savunma ayrımı ve AI | Doğal uzun kampanyada politika dengesi; gerçek mobil panel. Yeni anayasalar/seçim/yaptırım sistemi bu kapsamda değil |
| R13 | Ortak savaşta toprak paylaşımı / doğal gündem bekliyor | 92A defter, 92B teklif/oybirliği, 92C atomik gerçek devir ve tek makbuz var; kısmi kanıtla teklif açılmaz | 92D doğal barış/AI konferans akışı; ağırlık dengesi, uzun kampanya arşiv maliyeti ve cihaz UI açık. Eski onaylar yeniden sunulmalı |
| R14 | Filo sahipleri katmanı / cihaz kabulü açık | 91D.1 bağımsız aç/kapat, hareket takibi, gizlilik ve tercih testli; 29 yeni native kontrol | Dar menüde son satıra erişim, yoğun filo yazılarının okunabilirliği ve cihaz kare maliyeti henüz ölçülmedi |

Bu listenin tamamlanması yeni özellik eklemek için tek bir toplu engel değildir.
87T beklerken 91D ayrı kopyada ilerleyebilir; sabit 91C paketi değişmez. Nihai Android
sürüm kabulü R01–R04 sonuçlarını bekler; riskler kapandı diye işaretlenmez.

## Doğrulanmış ve bu listeden çıkarılmış borçlar

- Anlaşma nesne kimliği/alias/derinlik geri alma: 86C.6 (529 kontrol).
- Kayıt ön kapısı ve dosya seçici/onay: 90RC–90RC.2.
- Ön kapı sonrası senkron yükleme hatası geri alma: 90RC.3 (48 senaryo).
- Gerçek günlük kampanya hiç ölçülmedi iddiası: 89B ile artık geçersiz;
  açık kalan iş daha uzun/çeşitli ve oyuncu kararlarını kapsayan değerlendirmedir.
- Darbe sonrası %110 güç toplamı ve aylık %99 yuvarlama: 91B'de kısa tekrar,
  8 senaryo ve aynı 6 kampanya ile düzeltildi. Eski kayıt yüklenirken tarih
  ilerletilmez; eski yanlış toplam sonraki gerçek fraksiyon tikinde normalleşir.
