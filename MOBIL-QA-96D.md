# Chromium mobil ve yerleşim QA

Gerçek Chromium133, dokunmatik/viewport emülasyonu:740×360,360×740,1280×720. Physical Android/WebView/OS kurulu PWA kullanılmadı.

Mevcut130 senaryo yeniden çalıştırıldı. Yeni15 senaryo; gerçek köken kartı/sekmeleri, sekiz görünüş, varyasyon, dostane/nötr/düşman önizleme, klavyeyle gerçek range input, checkbox/mute, ücretli lider alımı, Devlet/diplomasi portreleri ve v8 eşitliğini kapsar. Aç/kapat yeniden dinleyici üretmez. 96C.3'ün gerçek cache kabuğu stars-v96d'ye yükseltildi; çevrimdışı açılışta v8 portre tercihi ve ayrı ses tercihleri korundu.

360×740'da kurulum ve ses kontrolleri gerçekten bu boyutta tıklandı; yataya çevirerek dikey test geçmiş sayılmadı. Yatay kaydırma taşması yok. Canlı oyun dikeyde mevcut CİHAZI YATAY ÇEVİR uyarısını korur; içine input/oyun düğmesi eklenmedi. Yatay dönüşte mevcut menüden ayarlara erişilir. Bu faz dikey harita oynanışı eklemez.

Görsel inceleme: browser-final altındaki origin/portrait/audio/leaders, portrait-origin-360x740, portrait-setup-360x740, portrait-audio-360x740 ve portrait-guard-360x740 PNG'leri. İlk hata ekranları da önceki dizinlerde tutulur. Küçük portreler boş/siyah kalmadı; seçilen varyasyon görünür değişti. Lider alımı60Etki düşürdü ve aynı liderin save/load resmi değişmedi. Diplomasi, savaş çizgileri, sensör, küçültülen olay ve rapor kapatma eski gerçek tıklama testlerinden geçti.

Son DOM düzeltmesi değişmeyen bildirim kartının giriş animasyonunu tekrar başlatmasını önler. Aynı gerçek olayı tıklama/küçültme/status'tan geri açma/çözme doğrulandı. Üst sağ acil sayaç, sıradan haber önceliği ve oyun duraklatma mekanikleri yeniden tasarlanmadı.

Sesin gerçek cihazdaki güç/ısı/FPS, çıkış seviyesi ve arka plan davranışı doğrulanmış değildir. Host ölçümleri Android garantisi olarak sunulmaz.
