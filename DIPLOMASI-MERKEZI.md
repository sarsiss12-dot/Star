# 86E diplomasi merkezi

Üç bölüm: **DEVLETLER → İLİŞKİ → MÜZAKERE**. Devlet listesi temaslı,
yaşayan, normal tarafları gösterir; Tümü/Savaş/Müttefik/Elçi var filtreleri
vardır. Sağ sistem paneli kısa antlaşma/elçi özetiyle ilişki sayfasını açar.
Ticaret paktı ile saldırmazlık artık doğru, ayrı adlarla gösterilir.

İlişki sayfasında antlaşmalar, kendi diplomatik hafızandaki önemli olaylar,
elçi görevi/kıdem/duraklama, ticaret akışı ve ilgili eylemler bulunur.
Hafıza olayları ilişki puanının eksiksiz dökümü veya rakibin gizli düşüncesi
olarak sunulmaz. Savaş, ambargo, pakt feshi ve süzerenlik ayrıntıları kapalı
açılır bölümlerdedir. Federasyon, Konsey, Fısıltı Ağı ve istihbarat dosyası
mevcut yollarından erişilir. Fesih/vasallık/savaş onayları korunur.

## Müzakere taslakları

Her devletin taslağı ve AI karşı teklifi ayrı saklanır. Bölüm/filtre/hedef
geçişi ve pencereyi kapatmak taslağı silmez. TASLAĞI TEMİZLE yalnız mevcut
hedefi temizler. İmzalanan taslak silinir. Karşı teklif ayrı karttır;
oyuncunun orijinal maddelerine sessiz ekleme yapılmaz.

Taslaklar **yalnız mevcut oyun oturumunun UI belleğindedir**. Save v8'e
veya localStorage'a yazılmaz. Kayıt yüklemek/yeni dünya eski taslakları
iptal eder. Açık kaynak seçicisinden geciken bir seçim başka devletin
veya yüklenen dünyanın taslağını değiştiremez. Temasını kaybeden/ölen
hedefe eski teklif gönderilemez. Listede ve hedef sayfalarında kaydırma
konumları ayrı saklanır; emekli scroll işleyicileri durumu ezemez.

İmzalama motoru değişmedi: dealQuote → aiRespond → executeDeal. UI genel
geçerlilik, maliyet ve ömür için aynı quote'u kullanır. Madde düğmelerinin
uygunluk sorguları bunun dışındaki aday kontrolleridir. Ret/karşı teklif
oyuncunun açık kabulü olmadan kaynak transfer etmez.

## Bilgi sunumu

| İstihbarat | Merkezde açılan bilgi |
|---|---|
| 0 — YABANCI | Ad, sistem sayısı, kanonik kaba filo tahmini; kendi ilişki/hafıza/elçi/antlaşma kayıtları |
| 1 — TANIDIK | Koloni sayısı ve kanonik aralıklı filo tahmini |
| 2 — İZLENİYOR | Teknoloji/civic/lüks ve mizaç; geçerli teklif için kaba tutum tahmini |
| 3 — SIZILMIŞ | Gerçek kaynaklar ve bilinen taraflara karşı savaşlar; karşı savaş yorgunluğu ve güç oranı |

Teklif önizlemesi rakibin net kabul puanını ve faktör dökümünü göstermez.
Düşük istihbaratta kaynak seçicisi stok göstermeyen sabit miktarlar sunar;
teknoloji/lüks isteme seçicileri seviye 2 ister. Görülmemiş sistem adları
listelenmez; sistem seçimi yüksek istihbaratta açılır. Bilinmeyen üçüncü
devlet adları maskelenir. Süzerenlik modalı da kesin kabul yüzdesi yerine
yeterli istihbaratta kaba eğilim gösterir. Kabul hesabı/katsayısı değişmez.

Bu, tüm oyunun eksiksiz gizlilik denetimi değildir. Kanonik teklif
geçerliliği ve gönderim sonrası AI yanıtı oyuncuya gerekçe vermeye devam
eder; bu geri bildirimden çıkarım yapılmasını engelleyen yeni mekanik yoktur.
Mevcut AI profil hesabı gerektiğinde türetilmiş _prof önbelleğini oluşturur;
bu oyun kaynağı/ilişki/RNG ilerlemesi değildir.

## Mobil düzen ve doğrulama sınırı

Diplomasi başlığı ve üç gezinme düğmesi sabittir; içerik kendi içinde
kayar. Eylemler en az 44 CSS px, dar hücreler kırılabilir; kısa yatay
alanda içerik kaydırılarak erişilir. Ana sayfanın harita, menü, lider
portresi veya kurtarma yaşam döngüsü değiştirilmedi.

45 yeni otomatik senaryo üretim UI eylemlerini, gerçek quote/AI/execute
hattını, HTML bilgi kapılarını, taslakları ve kontrollü DOM olaylarını
sınar. Mock DOM HTML'den gerçek yerleşim oluşturmaz. CSS kontrolleri
statiktir; gerçek Chrome düzeni/Android dokunma kabulü değildir. Eski
Skia Canvas piksel testleri ayrıca tam regresyona dahildir. Cihaz testleri
kullanıcının isteğiyle ertelenmiştir; birikim dosyasına eklenmiştir.
