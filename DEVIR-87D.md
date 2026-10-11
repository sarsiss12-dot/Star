# STARS — 87D devir notları

Kaynak stars-faz87c-1.zip, SHA-256:
`56713737fad826ebd77a326aa6c624f119a9f775142fcdc761be355e0c64fc82`.
Build 87d, cache stars-v87d. Önceki devir DEVIR-87C-1.md içinde.

Oyuncuya gelen aideal teklifinde aynı şartlara verilmiş ret 810 oyun günü
(27 ay) hatırlanır. Bu ürün politikasıdır; değişmiş kaynak miktarı, başka
madde veya başka devlet bekletilmez. Barışın ayrı teklif/ret yolu ve AI–AI
müzakere motoru bu fazda değiştirilmedi. ai.js byte-for-byte aynıdır.

- playerOfferTermsKey: encodeOffer çıktısında iki yön ayrı tutulur, madde
  sırası ve born/expires dikkate alınmaz. Bölünmüş kaynak maddelerini
  birleştiren genel anlamsal eşdeğerlik algoritması DEĞİLDİR.
- G.p.offerRefusals v8'in mevcut imparatorluk verisinde taşınır. En fazla
  64 aktif kayıt; yeni ret eski/süresi dolmuş girdileri temizler. Çok fazla
  farklı ret halinde en eski kayıt düşebilir. Yeni depolama anahtarı yok.
- playerOfferWait saftır. recordPlayerOfferRefusal aynı şartı tekrar
  kaydetmez, süresi dolmuş teklif için ret süresi başlatmaz. Kaynak/RNG
  tüketmez. Mevcut −5 ilişki bedeli yalnız ilk gerçek rette uygulanır.
- UI.aiOffer canlı aynı şartı çoğaltmaz/ömrünü uzatmaz. Kutu içindeki
  süresi geçmiş aynı şartı yeni teklif geldiğinde yeniler.
- aiDealOpen callbackleri modal jetonu ve dünya/oyuncu kimliğiyle korunur.
  Bir callback tüketildikten, pencere kapandıktan/değiştikten veya kayıt
  yüklendikten sonra eski kabul/ret işlemi çalışmaz. ctrNo aynı ret defteri
  yolunu kullanır. Masaya oturmak/pencereyi kapatmak ret değildir.

Ölçüm yöntemi: tests/diplomacy-repeat-probe.js. Gerçek monthTick, karşılıklı
AI teması hazırlanmış 3 seed × 120 ay ve gelen oyuncu tekliflerini reddeden
laboratuvar. Günlük keşif/muharebe kampanyası değildir. Önce/sonra JSON'ları
pakettedir. Sırf ret tekrarı için AI–AI katsayılarına dokunulmadı; ölçümde
180 gün içinde yinelenen AI–AI reddi yoktu. Oyuncu ilişkileri daha az ret
aldığından sonraki kampanya akışı/RNG sonu aynı olmak zorunda değildir.

24 hedefli senaryo. Kabul testi başlangıçta diplomasiye kapalı devlet
kullandığı için başarısızdı; fixture tarafsızlaştırıldı ve işlemden önce
quote.ok doğrulandı. Üretimde doktrin kapısı gevşetilmedi.

Sıradaki faz **88A — filo/rota/lojistik incelemesi / Astra High**.
Çok duraklı rotayı, sınır geçişini, yakıt/ikmali ve AI emirlerini izle;
önce somut bozuk/yetim emri üret. Yeni mekanik veya denge ekleme.

89A için açık: ifşa çözümünde farklı komplo/sabotaj anılarının topluca
silinmesi. Kuşatma çift ajanının kasıtlı sahte başarı davranışını koru.
Kullanıcı cihaz testlerine ara verdi; liste birikir. Yayınlama yok.
Harita/portre/menü, v8, transaction, elçi, AI bütçesi, casusluk sonuçları,
bağımsız Radar/Lojistik ve Situation karantinası korunmalıdır.
