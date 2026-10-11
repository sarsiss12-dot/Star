# 92D güncel durum — 11 Ekim 2026

92D barış sonrası aylık AI paylaşım gündemini ekler. Bütün cepheleri kapanan
sefer ilk 180 günde adaydır. Sefer/taraf için önceden herhangi bir teklif varsa
otomatik tekrar sunulmaz; yeni manuel taslak mümkündür. Her aylık taramada
azami iki yeni teklif. Sıfır devirli taslak için gereksiz gündem açılmaz.
Oyuncu oyu ve oyuncunun bulunduğu paylaşımın Uygula kararı otomatik değildir.
AI-only onaylı teklif mevcut settlementApply ile atomik uygulanır.
Diplomasi merkezi kendi son 12 paylaşımını gösterir; açık gündem önceliklidir.

Sıradaki **93A — Astra / High:** tersane hedefi/takviye hedefi ayrımı,
siparişte-yolda-eksik sayıları ve doğru ret mesajları.
Ardından 93B bekleyen sevkiyat, 93C sınıf bazlı filo şablonu.
LOJISTIK-INCELEME-92D.md doğrulanan sorunları ve önerileri ayırır.
91C/87T cihaz adayı sabit kalır. Kullanıcıdan şimdi test istenmez.

---
Aşağıdaki önceki faz notları tarihseldir.

# 92C — ortak savaş sonrası paylaşım ve gerçek devir

92A katkı defteri kanıtı tutar. 92B bu kanıttan incelenebilir bir öneri
üretir, alıcı seçimini ve ortakların onayını kaydeder. 92C'de oybirliği
sonrasında bir katılımcı **Onaylı paylaşımı uygula** düğmesiyle gerçek
devri tamamlar. Onay ve uygulama ayrı eylemlerdir.

## Kullanım ve karar

Diplomasi → ilgili devlet → Savaş katkı kaydı → Paylaşım taslağı.
Seferin bütün cepheleri kapanmalı; en az iki yaşayan ortak bulunmalı.
Taslakta her yerin mevcut sahibi, önerilen alıcısı, ağırlığı ve gerekçesi
görünür. Alıcıyı değiştir düğmesi uygun ortaklar arasında geçer. Sunmak,
önerenin o taslağa açık onayıdır. Teklif ücretsizdir; Etki/enerji kesilmez.
Bedel burada verilen ve alınan toprak ağırlığıdır, satın alınan bir puan
veya sonradan gizlice kesilecek kaynak değildir.

AI ortak aynı koşullarda verilen/alınan payı değerlendirir. Oyuncunun
yerine asla otomatik oy verilmez. Bir ret teklifi kapatır; oybirliği
gereklidir. Kabul edilmiş teklif uygulanmayı bekler; uygulamadan önce
aynı içerik, bütün oylar ve güncel dünya yeniden doğrulanır.
Bekleyen oyuncu oyu katkı panelindeki düğmede belirtilir. Öneren açık
veya onaylı teklifi geri çekebilir; yeni içerik yeni teklif ve yeni
onaylar gerektirir. Aynı taraf/sefer için bir açık veya onaylı teklif
bulunabilir. Teklif 180 oyun günü geçerlidir. Uygulanmış sefer/taraf
yeniden paylaşım teklifine açılamaz; sonuç makbuzu saklanır.

Bu fazda AI oylama ve AI tarafından teklif sunma motoru hazırdır.
Doğal kampanyada AI'ın kendi kendine paylaşım gündemi açması veya
barışın otomatik konferans başlatması eklenmedi. Oyuncu taslağı panelden
açar; otomatik gündem/uygulama bağlantısı 92D'de ele alınacaktır.

## Devrin kapsamı

- Koloni devri yalnız seçilen gezegenin sahibini ve koloni indekslerini
  değiştirir. Sistem yörüngesi, uzay yapıları, diğer koloniler ve filolar
  otomatik devredilmez; karma sahiplik devam edebilir.
- Nüfus, binalar, mevcut bina kuyruğu, istikrar ve fetih geçmişi korunur.
  Vali eski devletinin havuzunda görevsiz kalır; otomatik inşa kapanır.
  Başkent kolonisi verilmişse kalan kolonilerden deterministik seçim yapılır.
- Boş sistemde yörünge/uzay yapıları yeni sahibine geçer. Bekleyen gemi
  veya uzay yapısı üretimi varsa uygulama bekler; üretim önce tamamlanmalıdır.
  Eski sürekli üretim ve ralli ayarları temizlenir.
- Son kolonisinden olacak bir ortak içeren teklif uygulanamaz. Eşzamanlı
  takasta başka koloni alıyorsa nihai koloni sayısı dikkate alınır.
- Gelir/kapasite yeniden hesaplanır; gün ilerlemez, stoktan ücret kesilmez,
  yağma/ganimet, asimilasyon veya fetih cezası oluşmaz.

## Hangi topraklar aday olabilir?

- Yalnız ilgili seferde karşı taraftan gerçekten ele geçirildiği
  kaydedilmiş ve bugün yaşayan bir ortağın elinde olan yerler.
- Boş sistem ayrı varlık; kolonili sistemde koloniler ayrı varlık.
  Kolonili yerin yörüngesine ayrıca pay/puan verilmez.
- Tarafsız üçüncü tarafın veya düşmanın bugünkü mülkü listeye girmez.
  Karma sistemde ilgisiz koloni pakete dahil edilmez.
- Aynı yer tek satırdır. Başka seferdeki daha yeni işgal, eski sefer
  üzerinden paylaşılmaz. 92A'da aynı gün farklı cephelerdeki devirlerin
  sırası belirsizse o yer dışarıda bırakılır; sıra tahmin edilmez.
- Eski/kısmi savaş kaydı, tek başına yeterli hak kanıtı sayılmaz.
- Alıcının seferin yaşayan ortağı olması gerekir. Teklif sunanın bütün
  ortaklarla teması ve toprakları inceleyecek keşif bilgisi olmalıdır.

Ortakların federasyona sonradan girip çıkması geçmiş katkıyı taşımaz.
92A'nın gerçek taraf kaydı kullanılır. Bugünkü üyelik, ilişki veya
mülkiyet değişirse açık teklif yeniden değerlendirilir; önceki oylar
yeni duruma otomatik taşınmaz.

## Öneri ağırlıkları — ilk tasarım, denge kanıtı değil

Boş sistem 1, koloni 3 toprak ağırlığı taşır. Her yaşayan ortağın
katkı ağırlığı:

`1 + min(1000, floor(verilen gövde hasarı / 100)) + 3 × imha edilen gemi
 + floor(kırılan garnizon / 25) + 2 × uygun farklı ele geçirme`

Kayıplar defterde durur; kendi ordusunu kaybederek pay büyütmeyi teşvik
etmemek için pozitif dağıtım ağırlığına eklenmez. Farklı cephelerdeki
ele geçirmeler varlık kimliğiyle tekilleştirilir. İlk hedef pay, toplam
toprak ağırlığının katkı oranına bölünmesidir. Sıralı öneri, kalan hedef
paya bakar; kayıtlı fetih hedefine +4, mevcut kontrole +2 tercih bonusu
verir. Eşitlikte devlet kimliği kullanılır; RNG yoktur. Bu bonuslar
mülkiyet hakkı değildir; öneren alıcıyı değiştirebilir.

AI kabulü için iki koşul birlikte aranır:

1. Alacağı ağırlık +1, katkı hedefinin en az %80'ini karşılamalı.
2. Vereceği net ağırlık, max(1, toplam ağırlığın %40'ı) sınırını aşmamalı.

AI ayrıca toprak ve ortaklar hakkında bilgi arar. Bunlar ilk deterministik
müzakere kurallarıdır; kişiliklere özel pazarlık ve uzun dönem denge henüz
ölçülmedi. Kullanıcıya her AI oyunun gerekçesi gösterilir.

## Kayıt ve geçerlilik

G.settlements v1, kayıt v8'e isteğe bağlı alan olarak eklendi. Eski
kayıtta boş başlar; yeni oyun sıfırlar. Her teklif değişmez satırlar,
katılımcılar, katkı özeti, durum, süre ve açık oylar taşır. Yükleme sahte
oybirliği, üçüncü taraf alıcı ve bozuk sayısal özetleri reddeder.
Güncel bağlamla uyuşmayan teklif geçersizleşir; uygulanmış sayılmaz.
92B/92B.1 onaylarında yeni içerik bağı ve protokol bulunmadığından
bu onaylar yüklenirken geçersizleşir; dünya silinmez veya geri sarılmaz.
Yeni teklif ve yeni onay gereklidir.

Taslak/oy kapıları güncel sefer, sahiplik, üyelik ve ilişkiyi tekrar
karşılaştırır. Savaş yeniden başlarsa, bir ortak ölürse veya süre dolarsa
onay kullanılamaz. Üretim dosyalarındaki doğrudan sahiplik atamaları
territoryOwnerSet yoluna alındı. Başkasına geçip geri dönen yer için eski
rıza kullanılmaz. Sayaçlar monoton değişim işaretidir, devir sayısı değildir.
İlgili sistemin bütün gezegenlerinin sahip/koloni varlığı da onaya bağlanır.
Satırlar ve alıcılar değişirse mevcut oylar yeni içeriğe aktarılamaz.

Teklif/oy hatası mevcut derin transaction ile geri alınır; teklif sayacı,
nesne kimliği ve RNG korunur. UI callback'leri yükleme öncesi dünyayı
yenisinde kullanamaz. İncelenemeyen yer adları gizlenir ve tam teklif
görülmeden oyuncunun kabulü açılmaz. Listeyi açmak oyun verisini değiştirmez.

## Uygulama güvenliği ve kalan işler

Uygulama derin nesne grafiği transaction'ını kullanır. Üretim hatasında
sahiplik, koloni dizileri, vali, türetilmiş ekonomi, işlem kaydı, log ve
RNG geri alınır; özgün nesne kimlikleri korunur. Bildirim/ses commit'ten
sonra yayımlanır. Sunum hatası tamamlanmış işlemi tekrar uygulatmaz.
Makbuz uygulayan ortağı, oyun gününü ve değişen satırları saklar; kayıt
yüklemek devri tekrarlamaz. Sonradan mülk el değiştirirse tarihçe korunur.

92D: konferansın doğal barış akışına ve AI gündemine bağlanması. Uzun
kampanya teklif/arşiv maliyeti ve Android menü kullanımı henüz
doğrulanmadı. Cihaz senaryoları birikim listesinde.
