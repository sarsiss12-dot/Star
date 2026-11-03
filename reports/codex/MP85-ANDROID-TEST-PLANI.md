# STARS MP.8.5 — İki Android telefonla kısa test planı

**Bu bir plandır; fiziksel Android testi NOT RUN.** Bilgisayar, terminal veya geliştirici araçları gerekmez. Bulut oturumunun ağ engeli telefonlarda servisin kapalı olduğu anlamına gelmez.

Adres: https://stars-zhdu.onrender.com. Yeni ve geçici bir oda kullanın; adlarınızı `MP85 A` ve `MP85 B` gibi seçin. Başka odalara katılmayın. Bu plan Render'ı yeniden dağıtmayı, yeniden başlatmayı veya ayar değiştirmeyi içermez.

## Ön kontrol — iki dakika

Her telefonda `/healthz` ve `/mp/version` adresini tarayıcıda açın. Sağlık yanıtı gelmeli; sürüm için beklenen depo kimliği `MP.8`, oyun `96h10p5`. Fark varsa ekran görüntüsü alın ve canlı sürümü farklı olarak kaydedin; sırf teste devam etmek için dağıtım yapmayın. İlk açılışta servis uyanması gecikebilir. Hiç açılmazsa saat ve hata ekranını kaydedin; oyun testini NOT RUN bırakın.

## Oturum 1 — giriş ve oyun, yaklaşık 10 dakika

| Adım | Beklenen | Hata olursa alınacak kanıt |
|---|---|---|
| İki telefonda eski oyun sekmelerini kapatıp adresi açın; yatay çevirin | Sürüm satırları aynı | Her iki sürüm satırı, telefon modeli, Android/Chrome sürümü |
| A: ÇOK OYUNCULU → oda oluştur; B: yeni kodla katıl | Host + bir misafir, iki farklı oyuncu | Lobi listesi, saat; kodu herkese açık paylaşmayın |
| B, KATIL'a hızlı iki kez dokunsun | Tek misafir koltuğu, hayalet oyuncu yok | İki lobi ekranı; beklenmedik ana sayfa açıldıysa onu da çekin |
| Her oyuncu DEVLETİMİ DÜZENLE ile farklı ad/renk seçip kaydetsin, HAZIR'a bassın | Düzenleme bir kez açılır; taslak doğru oyuncuya gider | B1 için dokunmadan hemen önce/sonra kısa ekran kaydı ve lobi/tasarım ekranı |
| A başlatsın | İkisi kendi devletini/başkentini görür; B host devletini yönetmez | Başlangıç aşaması ve MP tanı satırı |
| B hız 2×, A duraklat, sonra A 1× seçsin | Üç istek sırayla her iki ekranda aynı ortak hıza gelir | Her iki tarih ve hız kutusu |
| B bir filosuna geçerli rota veya uygun inşa emri versin | Emir bir kez uygulanır; kaynak/kuyruk iki kez değişmez | Hedef/kuyruk ve son komut tanı satırı |
| A ve B arasında küçük, karşılanabilir kaynak teklifi gönderin | Alıcıda kart ve Gelen Kutusu; karar gelmeden kabul görünmez | Gönderilen, Gelen Kutusu ve tanı satırı |
| Bir teklifi karttan kabul edin; ikinci denemede reddedin; üçüncüde karşı teklif hazırlayın | Sonuç iki tarafta aynı; kabul kaynağı bir kez aktarır | Önce/sonra stok, teklif durumu; hızlı çift kabulde çift aktarım olmamalı |

## Oturum 2 — kopma ve kayıt, yaklaşık 5–10 dakika

Önce A **OYUNU KAYDET** ile kayıt alsın; mümkünse mevcut dosya dışa aktarma düğmesiyle telefona yedek indirsin. Tarayıcı site verilerini temizlemeyin: misafir kimliği telefonda tutulur.

| Adım | Beklenen | Hata olursa kanıt |
|---|---|---|
| B'de Wi-Fi ve mobil veriyi uçak kipiyle 5–10 sn kesin; sonra açın | Bağlantı uyarısı; dönüşte aynı devlet, tarih/ayna toparlanır, yeni koltuk açılmaz | Uyarı, dönüş tanı satırı; yaklaşık kaç saniye sürdü |
| Teklif beklerken B'de aynı kısa kesintiyi yapın | Teklif kaybolmaz; dönüşte Gelen Kutusu'ndan yanıt verilebilir; bir kez uygulanır | İki tarafta bekleyen/sonuçlanan kayıt ve stok |
| A'da kaydı aldıktan sonra başka uygulamaya 5 sn geçip dönün | Host arka planda güvenli duraklar; dönüşte ortak hız tutarlı olur | Dönüş öncesi/sonrası tarih/hız. Android sekmeyi kapatırsa bunu ayrı not edin |
| A yeni kayıt alsın; eski test odasını kontrollü kapatın | Kaydedildi bildirimi | Kaydedildi ekranı ve kayıt listesi |
| A: KAYITLI OYUNA DEVAM ET → bu kaydı seç → yeni oda; B yeni kodla aynı telefondan katılsın | Aynı devlet/kimlik, bekleyen teklifler korunur; host DEVAM ET'e kadar zaman ilerlemez | Kayıt özeti, yeni lobi, iki tanı satırı. Oda kodu değişmesi normaldir |

Render yeniden başlatıldığında odaların bellekte kaybolması bilinen sınırdır. Servisi sırf test için yeniden başlatmayın; böyle bir durum kendiliğinden olursa host kaydı + yeni oda yolunu kullanın.

## Oturum 3 — uzun oyun, en fazla 10 dakika

Varsa 120./240. aya yakın **kendi test kaydınızla** devam edin. Yoksa bu bölümü NOT RUN bırakın; sırf sayı yetiştirmek için saatlerce oynamayın. İki telefonun farklı ekran boyutlarıyla yatayda harita sürükleme/yakınlaştırma, açık diplomasi paneli ve hız 1×/4× deneyin. Ağ ve pil koşullarını not edin. Isınma/şarj tasarrufu performansı etkileyebilir.

Beklenen: panel gereksiz yere kapanmaz, seçili öğe korunur, dokunma yanıt verir. Takılma varsa kısa ekran kaydı alın; tarih/ay, sistem/AI/insan sayısı, hangi panelin açık olduğu, telefon modeli ve MP tanı satırını ekleyin. Telefonda FPS ölçtüğünüzü iddia etmeyin; algılanan gecikmeyi ve host “son ay adımı”/misafir “son kurulum” ms değerlerini kaydedin.

Her oturumun sonunda test odasını kapatın. Raporunuzda her adımı PASS / FAIL / NOT RUN ayırın. Ekran görüntüsündeki oda kodunu herkese açık paylaşmadan önce kapatın/maskeleyin; hesap/jeton/host anahtarı paylaşmayın.

**Bilinen açıklar:** B1 aralıklı lobi zaman aşımı kesin kapanmış değildir. Gizleme tercihi kayıt yüklemesinde geri dönebilir; MP.8.4 kalıcılığı uygulanmadı. Bu durumları yeni bulgu gibi karıştırmadan not edin.
