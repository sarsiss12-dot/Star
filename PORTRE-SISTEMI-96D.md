# Ortak prosedürel portre

ART.portrait, ART.portraitFull ve ART.leaderPortrait girişleri korunur. Mevcut sekiz maske/siluet aynı ortak Canvas2D karakter çizicisini kullanır. Yeni portre servisi, resim dosyası veya bağımlılık yoktur.

Koyu gradyan, sınırlı arka ışık, tür paleti, baş genişliği/çene/göz geometrisi, hafif doku, boyun/omuz bağlantısı, üç kıyafet ayrıntısı ve kontrollü aksesuar kullanılır. Böceksi anten/segment, sürüngen çıkıntı, kristal faset, sentetik hat/vent, amorf kabarcık, kanatlı tüy ve akuatik solungaç ayrılır. Mevcut piksel sanat kimliği korunur; fotogerçekçilik iddiası yoktur.

Kurulumun dostane/nötr/düşman önizlemeleri aynı kimliği farklı ilişki çerçevesiyle gösterir. 256 Portre Varyasyonu yalnız yerel görsel seed'i değiştirir. Seçim, şablon ve Save v8'de isteğe bağlı alandır. Eksik eski alanda oyun tohumu/devlet kimliğiyle saf, sabit varsayılan hesaplanır; eski kayda zorunlu mutasyon yapılmaz. Yeni çizim eski sürümle piksel düzeyinde aynı olmak zorunda değildir; yeni sürümde tekrarlanan yükleme aynı kimliği üretir.

Liderler mevcut sabit lider seed'ini kullanır. Rütbe0–4 yalnız göğüs/çerçeve nişanını etkiler; yüz yeniden çekilmez. Aynı türün farklı liderleri yüz, ton ve kıyafette değişir. Gizli persona veya düşman stokları çizici tarafından okunmaz; mevcut diplomatik tanışma/istihbarat kapıları korunur.

Ayrı portre LRU'su 96 görüntüyle sınırlandırıldı; diğer sanat önbellekleri yeniden tasarlanmadı. Ölçek1–4; azami128×152RGBA yüzeylerden 96'sı yaklaşık7,13MiB ham piksel belleğidir; tarayıcı ek yükü buna dahil değildir. Ekrana tekrar çizim mevcut done/key mekanizmasını kullanır.

8 yeni native Canvas kontrolü: sekiz görünüş/küçük-büyük raster, seed eşitliği, renk/seed farkı, tür içi lider çeşitliliği, rütbede yüz eşitliği, 1000 seed sonrası96 giriş, eski/yeni v8 ve RNG/save nötrlüğü. Chromium'da gerçek kurulum seçimleri, varyasyon, ücretli lider alımı (60 Etki), lider v8 piksel eşitliği, Devlet ve diplomasi portreleri, yön dönüşü sınandı.

Görsel inceleme: `tests/audit96d/portrait-gallery.png` (native Skia, sekiz tür ve her türden üç lider) ve browser-final ekranları. İlk galeri fazla parçalıydı; bazı maskeler düzeltilerek son galeri incelendi. İlk görüntü de `portrait-gallery-first.png` olarak korunur. Görsel kalite öznel; fiziksel Android ekranında değerlendirilmedi.
