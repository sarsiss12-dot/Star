# STARS Faz 96C.3 — arayüz kalite kontrolü

21 Ekim 2026. Tek kanonik kaynak stars-faz96c2.zip; SHA-256 `4d564c2888699c68aef219a59f711f2e065500fed85cbd5d361c2fc425198237`. Gerçek arşiv bulundu; CRC ve 1.301 kaynak hash'i doğrulandı, temiz dizine çıkarıldı. 96C.2 teslimindeki 105/5478 ve Chromium110 referansı manifest ve rapordan okundu; bu fazın başarı sonucu olarak kopyalanmadı. QA ZIP CRC'si ve sekiz PNG doğrulandı; görüntüler yayımlanmış 96A'dan gelebileceği için bütün düzeltmeler 96C.2'de ayrıca yeniden üretildi.

## Tamamlananlar

- commerce-ui.js: tek sözleşme düğmesi outEmp içine taşındı; outMap yalnız gerçek Ticaret Konvoyları toggle'ını tutar. Tekrarlanan boot ve yükleme düğmeyi çoğaltmaz. rotate içine düğme eklenmez.
- economy-ui.js: aynı yönlendirme ekranına eski sürümden eklenen Ekonomi kısayolu da kaldırıldı. Ekonomi Merkezi mevcut Devlet grubundan açılır. Uyarıda yalnız ikon, metin ve yönlendirme bulunur; yönlendirme katmanı kaldırılmadı. Açılmış ekonomi/ticaret pencerelerinin döndürme sonrası yerleşimi korundu.
- diplomacy.js: yalnız warMapConnections uç seçimi değişti. Bilinen savaş, keşfedilmiş ve siyasi haritada zaten aidiyeti gösterilen sistemden çizilebilir; anlık filo radarı artık kalıcı harita çizgisinin gereksiz şartı değildir. Bilinmeyen konum veya üçüncü taraf savaş istihbaratı açılmaz.
- map.js: ayrı savaş katmanında kırmızı çizgi opaklığı .48→.88; oyuncu çizgisi 1.7→2.5px, üçüncü taraf 1→2px. Ekran kesişim elemesi korunur. Savaş Haritası adı, ana modu ve renklendirmesi korunur.
- ui.js: toggle açık redraw; uygun uç yoksa açıklama. Sıradan haberler acil sayaca katılmaz; haber erişimi listede kalır. Aynı teklif kuyruk+gelen kutusunda bir kez sayılır. Küçültülmüş gerçek olaya yavaş vurgu ve doğrudan geri dönüş; çözülmüş olayın açık işaretçisi temizlenir, eski/tekrarlanan seçim işlemez. Tamamlanmış muharebe raporuna yalnız o raporu gizleyen X. Çift ayrılıkçı isyan kartı tekleştirildi; dış müdahale ipucu ve gerçek zamanlayıcı korundu.
- main.js: Save v8'de isteğe bağlı, mevcut kodlanmış bildirim UID'si ve mevcut tamamlanmış rapor kimliği tercihleri. Ham DOM/fonksiyon/HTML kayıt içine alınmaz. Geçersiz veya eski rapor tercihi elenir. Build96c3.
- index.html: kapsamı ayrı pinlenmiş yumuşak vurgu, reduced-motion, X hedefi ve bildirim destesinin sağ panelden uzak tutulması.
- sw.js: stars-v96c3. Eski worker'dan yükseltme ve offline kayıt gerçekten sınandı.

Sekiz üretim dosyası değişti. Tam diff ve önce/sonra SHA'lar tests/audit96c3 içindedir. ai.js, combat.js, commerce.js, economy.js, economic-ledger.js, construction.js, inbox.js ve news.js kanonikle aynı baytlardır. Ticaret teslimat/ödeme, AI bütçe, donanma maliyeti ve araştırma formülü yeniden tasarlanmadı.

## Gerçek doğrulama

106 benzersiz paket / 5,502 başarılı kontrol / 0 kalan hata. Eski105/5478 bu fazda tekrar yürütüldü; yeni1/24 ayrıdır. Chromium130/0, page error0: eski110 gerçekten yeniden koşuldu, yeni20 eklendi. Tekrarlanan/onarım koşuları toplama eklenmedi. Kaynak kilidi sonrası tam koşu full-locked; ilk başarısızlıklar ayrıca korunur.

Gerçek Canvas'ta 1.440 kırmızı katman pikseli, kapalı durumda0; ana Savaş Haritası ve diğer modlarla birlikte çalışma, klipleme, kamera/zoom, bilinmeyen uç, barış sonrası kaldırma ve v8 tercihleri test edildi. İki tam harita görüntüsü arasında gerçek renk kanalı farkı da ölçüldü. Ölçüler ve dikey test sınırı HARITA-KATMANLARI/MOBIL-QA raporundadır.

11/99/404, 100 sistem, 12'şer ay, 6. ay gerçek v8 save/load: görünüm tercihleri dışında 36/36 aylık tam simülasyon hash'i aynı. UI değişikliği için 120 aylık AI kampanyaları tekrar tekrar çalıştırılmadı. Önceki fazın kampanya verileri tarihsel raporda korunur; yeni ölçüm diye sunulmaz.

## Sınırlar

Fiziksel Android/kurulu OS PWA/FPS/ısı/RAM testi yok. Dikey harita oynanışı eklenmedi; yönlendirme korunur. Ham bildirimsiz karar modalı güvenli biçimde yeniden kurulamazsa küçültme reddedilir ve karar açık kalır; yalnız bilgi HTML'i aynı oturumda tutulabilir. Eski özgün federasyon kaydı, bilim gemilerinin hedef yığılması/korsan beklemesi ve genel AI denge riskleri açıktır. 96D başlatılmadı. GitHub'dan kod alınmadı; commit/push/yayın yapılmadı.

Gerçek ZIP, bağımsız yeniden açma/CRC/manifest/yol kontrolünden sonra teslim edilir. ZIP'in tam SHA-256'sı dış teslim makbuzunda ve sohbetin dosya bağlantısıyla birlikte verilir; kendisine referans veren arşiv hash'i kullanılmaz.
