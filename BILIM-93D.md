# Faz 93D — araştırmayı kullanma ve veri sözleşmesi

Bilim ekranında Fizik, Toplum ve Mühendislik ağaçları ile Geçmiş sekmesi bulunur.
Mevcut 40 teknoloji korunmuştur. Geçmiş dördüncü bilim dalı değildir.

## Kullanım

- Tamamlanmamış düğüme dokunmak hedef ekler; tekrar dokunmak kaldırır.
  Her iki işlem düğümün ayrıntısını açar. Tamamlanmış düğüm yalnız bilgi açar.
- Kilitli uzak düğümler de hedef olabilir. Örneğin boş Mühendislik ağacında
  Zırhlı Gövdesi `1 · +4` gösterir. Sistem dört ön koşulu, sonra hedefi araştırır.
- Alt yatay kuyruktaki karta dokunmak ilgili ağaca ve düğüme odaklanır;
  hedefi kaldırmaz. Oklar sırayı değiştirir, ✕ kaldırır. Kuyruk daraltılabilir.
- Ayrıntıdaki “Otomatik rotayı göster” bütün henüz eksik alt araştırmaları
  bağımlılık sırasıyla gösterir. Doğrudan ön koşul düğmelerinden ağaca geçilebilir.
- Ağaç tek parmakla kayar; iki parmakla veya −/%/+ düğmeleriyle yakınlaştırılır.
  Kaydırma hareketi hedef seçimi sayılmaz. Galaksi kamerası değişmez.
- Geçmiş sekmesinde bilim dalına göre filtreleme, gerçek etki/açılan imkân,
  bilinen oyun tarihi ve edinim kaynağı görünür. Eski kayıt için “Tarih bilinmiyor”.

## Araştırma kuralları

Ana hedef numaraları bütün dallar için tek sıralamadır. Her dal kendi ilk uygun
planlı araştırmasını alır; başka dalın hedef bitişini gereksiz beklemez.
Gerçek dallar arası ön koşul varsa o koşul tamamlanmadan araştırma başlamaz.
Bir dalda uygun planlı adım yoksa mevcut otomatik seçim çalışmaya devam eder.
Kuyruk bittiğinde de mevcut otomatik araştırma sürer. AI'ın puanlama tercihleri
korunmuştur; bu faz kapsamlı manuel/yarı otomatik/otomatik mod eklemez.

`+N`: hedefin doğrudan/dolaylı, tamamlanmamış ve önceki ana hedeflerin
rotalarında zaten karşılanmamış benzersiz ön koşullarıdır. Asıl hedef sayılmaz.
Ortak ön koşul yalnız bir kez araştırılır. Bir hedef başka hedefin ön koşulu
olarak erken tamamlanırsa kuyruktan çıkar; kalan numaralar yeniden düzenlenir.
Bozuk bağımlılık/döngü güvenli hata üretir; hatalı kayıtlı hedef kaldırılabilir.

Puanlar üç aktif dal arasında mevcut kurala göre bölünür. Bir dalda bir ayda
azami bir teknoloji tamamlanır; artan puan sonraki adıma aktarılır. Bu sınır
93C ile aynıdır. Araştırma fiyatı teknoloji çapraz etkileri ve uzmanlık serisiyle
eskisi gibi değişir; arayüz güncel maliyeti gösterir. Bir teknolojiye yatırılan
puan seçim değişince silinmez veya başka bitmemiş teknolojiye taşınmaz.

Tam ağaçtan sonraki yeni gelir ve son teknolojiden artan puan Kadim Araştırma'ya
akar. 93C'de boş aktif dal durumunda yeni geliri sıfırlayan yol düzeltildi.
Bilim zaferinin bütün ağaç, zirve teknolojiler ve ASCEND_NEED şartları korunur.

## Save v8 ek alanı

`empire.research = { targets: string[], bank: {[techId]: number},
                     history: {[techId]: {source, year?, month?, day?}} }`

- `rq[branch]` ve `rp[branch]` aktif teknoloji ve puan için mevcut uyumluluk
  alanlarıdır. `bank` yalnız askıya alınmış teknolojileri içerir; aktif puanın
  kopyası değildir. Dönüşte banka kaydı aktif alana taşınır ve silinir.
- Tamamlama maliyeti bir kez düşülür. Takas/olay/casusluk/kalıntı/köken yoluyla
  teknoloji verilirse o teknolojiye yatırılmış puan aynı dalda bir kez korunur.
- `targets` yalnız oyuncunun ana hedefleridir. Alt rota kaydedilmez; güncel
  tamamlanmalar ve katalogdan yeniden türetilir.
- `history.source`: research, trade, espionage, event, ruin, origin veya legacy.
  Sadece gerçekten yakalanmış oyun tarihi saklanır. Eski tamamlanmalar için
  yükleme anı tamamlanma tarihi yapılmaz.
- Yükleme normalleştirmesi araştırma satın almaz, tamamlamaz, RNG tüketmez;
  geçerli aktif ilerlemeyi korur. Yinelenen/bilinmeyen hedefler ve geçersiz
  banka değerleri ayıklanır. Geçersiz tarihler için tarih gösterilmez.
- Yeni alan yoksa eski kayıt çalışır. Save sürümü hâlâ 8'dir.

## 93E genişletme noktası — içerik eklenmedi

`TECHS[id].origin` isteğe bağlıdır:
`{kind: 'doctrine' | 'ethic' | 'species', label: '...', condition: '...'}`.
Küçük ◆ / ⚖ / ◈ işareti, kaynak etiketi ve koşul açıklaması ağaç/ayrıntı/geçmişte
kullanılır. `kind:'civic'` desteklenmez. Metadata tek başına koşulu uygulayan
oyun mekaniği değildir; 93E içerikleri eklenirken gerçek erişim kapısı ve
kazanım etkileri birlikte uygulanmalıdır. Yeni dördüncü ağaç oluşturulmaz.

Gerçek fayda metni `TECHS.e` sayılarından; açılan gemi/yapı katalog ilişkileri,
habitat/terraform/Gaia yeteneklerinden üretilir. İleride eklenecek yeni özel
mekanikler aynı bilgi sağlayıcısına kendi gerçek etkilerini de eklemelidir.

## Doğrulamanın sınırı

Node VM davranış/DOM olay hostu ve mevcut native Canvas regresyonları çalıştı.
Bu ortamda Chromium yürütülebilir dosyası yoktur. Fiziksel Android/PWA, gerçek
CSS yerleşimi, tarayıcı pinch davranışı veya cihaz FPS kabulü yapıldığı iddia
edilmez. Bu sınır fazı manuel kullanıcı testi bekleyerek açık bırakmaz.
