# Mobil ve gerçek Chromium QA

Gerçek Chromium133.0.6943.0; viewport/touch emülasyonu. Fiziksel Android, OS'ye kurulu PWA, ısı/RAM veya FPS garantisi değildir.

| Boyut | Gerçek kontrol |
|---|---|
|740×360|Doğru menüden sözleşme açma; kaydırma; diplomatik Kabul/Ret; savaş toggle/Canvas; küçültme; rapor X; sağ panel erişimi|
|360×740|Dikey uyarıda hiç oyun düğmesi yok; yönlendirme görünür. Kontroller için cihaz gerçekten yataya çevrilir, doğru menüden açılır. Ekonomi/ticaret penceresi tekrar dikeye çevrilerek dar yerleşim/kaydırma sınanır. Uyarı arkasındaki Canvas ayrıca piksel testinden geçer.|
|1280×720|Bütün kritik DOM yolları, gerçek çizgi ve tam Canvas farkı, kart/panel, tercih ve kayıt kontrolleri|

Menü grupları mevcut sınırlı, kaydırılabilir akordiyonu kullanır; sözleşme düğmesi aynı anda tek. Convoy toggle outMap'te; sözleşme outEmp'te. Yeniden boot ve kayıt yüklemede aynı düzen korunur. Dikey uyarının içine CSS ile saklanan bozuk düğme bırakılmadı; ekleme kodu kaldırıldı. Ekonomi Merkezi silinmedi, mevcut menüsünden açılır.

Bildirim destesi mevcut144px/30vh sınırını korur; kendi kolonisine ait önemli kartlar sağ sistem panelini örtmez. 740×360 gerçek koordinat karşılaştırması ve sayfa scrollWidth kontrolü yapıldı. Rapor X'i küçük36px hedef, diğer menüler mevcut34px düzenindedir; kapsam dışı bütün oyun kontrollerine44px zorlanmadı. Olay kartları mevcut44px hedefini korur.

Sensör Anlaşması gerçek Kabul/Ret: doğru gönderen/şartlar; gönderen45 Etki öder, oyuncudan ikinci kesinti yok; ret stokları değiştirmez. Sayı1→0; NaN/undefined/Infinity tarih/süre yok. Canlı sensör, federasyon/ittifak çizgileri ve savaş son onayının eski gerçek Chromium regresyonları yeniden geçti.

Bilim gemisinin KORSAN TEHDİDİ · BEKLİYOR görüntüsü açık eski QA olarak kaydedildi. Bu fazda keşif otomasyonu değiştirilmedi. Özgün oyuncu kaydı olmadan tarihsel federasyon kuruluş reddi kapatılmadı.

Gerçek service-worker testi96C.2→96C.3 cache değişimi ve eski cache'in silinmesini doğrular; offline açılışta v8 yük, rapor tercihi, küçültülmüş bildirim UID'si ve savaş katmanı korunur. Eski110 Chromium senaryosu bu fazda tekrar yürütüldü; yeni20, toplam130 benzersiz senaryo. İki ilave görsel inceleme tekrarı bu toplama eklenmedi.
