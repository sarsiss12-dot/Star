# 93A.1 — kullanıcı hazır olduğunda

Bu bir test talebi değildir.
- Başlamış ve bekleyen gemiyi tek tek iptal et; yalnız seçilen iş gitmeli.
- Toplu iptal penceresinde iade ve eski makbuzsuz uyarısını kontrol et.
  Vazgeç hiçbir siparişi değiştirmemeli; onay yalnız o tersaneyi temizlemeli.
- Üretim tamamlanırken eski düğmeye basılırsa başka iş iptal edilmemeli.
- Bir koloni başlığını kapat, diğerinin açık kaldığını ve sayaçların güncel
  olduğunu kontrol et. Tekrar açınca vali/inşa bilgileri geri gelmeli.
- Bina kartına yarım saniye bas: bilgi açılmalı, kaynak harcanmamalı.
  Karttan kaydırmaya başlayınca bilgi açılmamalı; kısa basış hâlâ inşa etmeli.
- Radar/Lojistik/Filo sahipleri kapalı ve açıkken aynı görsel dili kullanmalı.
- Takviye siparişinde gösterilen gemi sınıfı üretilen sınıfla aynı olmalı.

---
# 93A — ileride cihazda denenmek üzere

- İki tersaneye ayrı sistem hedefi ver; birini değiştirirken diğeri sabit kalsın.
- Filoya takviye sipariş et, tersane noktasını değiştir ve ana filoyu hareket
  ettir: özel gemiler filoyu, normal üretim tersane noktasını izlemeli.
- Üretimde/yolda/eksik sayaçlarını ve tekrar sipariş düğmesini kontrol et.
- Eski karma hedefli kayıtta Filo hedefi etiketi açık olmalı.
- Android kısa/yatay ekranda yeni lojistik satırları kaydırılarak okunabilmeli.
Test talebi değildir; kullanıcı hazır olduğunda uygulanır.

---
# 92D — kullanıcı hazır olduğunda ek test

- AI ortak teklifini diplomasi merkezinde bul; oysuz hiçbir devir olmamalı.
- Kabulden sonra ayrıca Uygula; kayıt yükleyince teklif/oy/devir tekrarlanmamalı.
- Ret veya süre bitiminden sonra aynı otomatik teklif spam yapmamalı.
- Tersane/filo hedefi çelişkisi henüz açık: LOJISTIK-INCELEME-92D.md.
Bu liste test talebi değildir; fiziksel denemeler bekliyor.

---
# STARS — cihaz kabul birikimi

## 92C için biriken senaryolar — şimdi test talebi değil

- Ortak savaştan sonra taslağı aç, alıcıları incele, oybirliğinden sonra
  Uygula: gezegen sahibi ve koloni listeleri değişmeli, sonuç makbuzu görünmeli.
- Aynı sisteme ait diğer devletin kolonisi ve yörünge sahibi korunmalı;
  filolar el değiştirmemeli. Harita karma sahipliği anlaşılır göstermeli.
- Uygula'ya çift dokunma ve kayıt/yükleme devri tekrarlamamalı.
- Vali eski devletin havuzunda görevsiz, otomatik inşa kapalı olmalı.
- Son koloni/bekleyen boş-sistem üretimi engeli açık gerekçe göstermeli.
- 92B/92B.1 onaylı eski kayıtta yeniden teklif gerekliliği anlaşılmalı.

## 92B.1 için biriken senaryolar — şimdi test talebi değil

- Araştırılmamış Muhrip/Kruvazör düğmesine basınca sipariş/masraf oluşmaması.
- Eski kilitli işte BEKLİYOR ve araştırma gerekçesi; aynı tersanede
  Korvetin ilerlemesi; araştırma sonrası eski işin devam etmesi.
- Sürekli üretim listesinde yalnız izinli sınıflar.
- Dikey başlangıç ekranında yedi sekmede tutarlı yazı yerleşimi;
  Fizyoloji etiketinin üstünde tek başına sembol olmaması.

## 92B için biriken senaryolar — şimdi test talebi değil

Paylaşım taslağında küçük ekran kaydırması, satır alıcısını değiştirme,
sunma, ret gerekçesi ve oyuncu evet/hayır düğmeleri. Yüklemeden kalan
pencere eski taslağı gönderememeli. Onayda “henüz uygulanmadı” anlaşılır
olmalı. Keşfedilmeyen koloni adı görünmemeli. Bunlar 91C/87T kabulünün
parçası değildir; gerçek devir testi 92C'yi bekler.

## 92A için biriken senaryolar — şimdi test talebi değil

- Gerçek savaşta diplomasi → Savaş katkı kaydı açılır; telefon ekranında
  sayı/metin okunur, panel kendi içinde kayar.
- Doğal federasyon yardımı çıkarsa tanınan destekçinin adı görünür;
  bağımsız aynı düşman savaşı ortak sefer diye sunulmaz.
- Kaydet/yükle sonrası katkı kaydı korunur; barıştan sonra sona erdi
  etiketi çıkar. Eski savaş kaydı kısmi olarak açıklanır.
- İşgal sayısı toprak paylaşımı veya kesin hak olarak sunulmaz.

Bu senaryolar 92A paketine aittir; dondurulmuş 91C/87T'ye mal edilmez.

Kullanıcının isteğiyle cihaz testi bekliyor. Önceki fazların uzun ayrı listesi
tek RC oturumunda birleştirildi: `RC-CIHAZ-KABULU.md`.

Birikmiş yüksek değerli alanlar: PWA güncelleme/offline açılış; arka plan ve
yön değişiminden sonra beyaz harita/tap-pan-pinch; yakın zoom kamera kenarları;
sol menü iç kaydırması; vali/amiral portresi; bağımsız Radar/Lojistik; tekrar
kayıt-yükleme; tek uygulanan anlaşma; savaş raporu paydası ve eşzamanlı kaynak
açıkları. Normal akışta denk gelen elçi, diplomasi, casusluk, rota ve filo
sevk bulguları da kaydedilir; özel durumları zorlamak gerekmez.

Bu belge şu anda test talebi değildir. Otomatik RC denetiminde açık P0/P1 yok;
gerçek Android/Chrome kabulü yapılmış sayılmaz.

91D birikimi (91C sabit adayının kapsamına eklenmez): savaş sonrası kopuk
parçalarda aynı devlet adını, tek sistemli devleti ve yakın/uzak zoom'da
seçili bölgenin adını gözle; sağ panel açılınca etiket kesilmesi/çakışması
var mı bak. Doğal fırsatta karma sistem hâkimiyeti ile koloni sahibi
satırlarını karşılaştır. Bu tur kullanıcı hazır olduğunda güncel paket
seçilerek yapılır; şimdi ayrı savaş veya kayıt üretmesi istenmez.

91D.1 birikimi: sol harita menüsü → Filo sahipleri. Hareket eden filonun
devlet adı altında onu izliyor mu; aynı yerdeki farklı devlet grupları
ayırt ediliyor mu; aç/kapat diğer üç mod ve Radar/Lojistikten bağımsız mı;
yeniden açışta tercih korunuyor mu. Dar ekranda alt menünün yeni son
satırına iç kaydırmayla erişim ve ad yoğunluğu gözlenecek. Şimdi test talebi yok.


91E birikimi — şimdi test talebi değildir; 91C sabit adayına eklenmez:
Güncel pakette doğal federasyon fırsatında üç iç yasa kartını ve mobil
kaydırmasını gözle. Öneri bedeli tek kez düşmeli, ayrıca EVET/HAYIR oyu
beklenmeli; kayıt sonrası gündem kalmalı. Donanma +15 kapasite ve Bilim
Ağı aylık gelirini gözle. Savaş Onayı yeni öneriye gerekçesiyle kapalıdır;
91E.1 borcudur. Hazır olunca güncel sürüm kabulü ayrıca seçilecek.


91E.1 birikimi — önceki 91E Savaş Onayı kilidi beklentisinin yerine geçer:
Güncel pakette beş yasa başlığını aç/kapat, alternatif politika uyarısını
ve kaldırma önerisini gözle. Savaş Onayı açıkken hedefe izin öner; kabul
savaşı başlatmamalı. Kabulden sonra normal savaş hedefini seçerek savaş
başlatılır. İzin tek kez kullanılmalı; kayıt/yüklemede bekleyen gündem
korunmalı. Sadece doğal fırsat oluşursa bakılacak; şimdi test talebi yok.
