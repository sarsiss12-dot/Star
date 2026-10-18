# STARS — Faz 95E.2 — 18 Ekim 2026

Kanonik kaynak: `sarsiss12-dot/Star`, `main`, `39fbd5928de94516bcbd6cae785e9fca1fee0978`. Yerel başlangıcın 1.275 blob'u ve `69274701c400e9381586633ad22cd648d9812420` Git ağacı birebir doğrulandı. Yeni oyun motoru veya denge katsayısı eklenmedi.

## Değişiklikler

- `archive-ui.js`: kabul/ret/karşı teklif ve uzaktan inşaat onaylarına eksik `data-a` yönlendirmeleri; gün/born tarih seçimi ve bilinmeyen tarih metni; iki sekmeli sol arşiv; kompakt kayıt satırları; bağımsız liste/ayrıntı kaydırması; görünüm başına filtre, sayfa, seçim ve konum koruması; güncel bilgiye göre devlet/konum erişimi; karşı teklif öncesi yeniden doğrulama.
- `index.html`: yalnız `.archiveHost`/`.archiveShell` altında yeni yerleşim. 740×360'da 5 tam haber satırı; liste yüksekliği 224 px, satır 41 px. Dikey arşiv, döndürme tavsiyesinin üzerinde kullanılabilir. Diğer modal boyutları değişmez.
- `ui.js`: her iki olay delegesi de devre dışı düğmeleri yok sayar. Mevcut kapanış/yükleme token korumaları korunur.
- `sw.js`: `stars-v95e2`. Testlerdeki 26 tarihsel sürüm beklentisi yalnız bu yeni cache adına güncellendi; eski UI bloklarının hash pinleri korunup yeni CSS ayrıca pinlendi.
- `tests/browser-95e2.js`, `tests/faz95e2_regression_test.js`, yeni kanıtlar ve devam belgeleri.

`main.js`, `map.js`, `combat.js`, `ai.js`, `diplomacy.js`, `economy.js`, `news.js`, `inbox.js`, `construction.js`, `audio.js` kanonik kaynakla bayt düzeyinde aynı. Save v8, tek 2B Canvas kamera, 95E.1 olay anahtarı ve diplomasi/casusluk ayrımı korunur.

## Sorun sınıflandırması

| Konu | Durum | Yeni kanıt / sınır |
|---|---|---|
| Gelen kutusu kabul düğmesinin bazen işlememesi | Düzeltildi | 95E.1 aynı ticaret teklifinde gerçek Chromium tıklaması sonrası pending; 95E.2 aynı akış accepted. 95E.1 normal teklif modalındaki mevcut offYes düğmesi aynı tarayıcıda çalıştı; sorunlu arşiv yolu ayrı doğrulandı. |
| Ret, karşı teklif ve remoteConfirm yönlendirmeleri | Düzeltildi | Gerçek iç eleman tıklaması body delegesine ulaşıyor. Karşı teklif kaynak harcamadan kanonik masayı açıyor; uzaktan emir tek kez kuyruğa giriyor. |
| Ticaret, sensör (iki kayıt yolu), ittifak, barış, vasallık, federasyon daveti/oyu | Doğrulandı | Her akış ayrı gerçek kabul ve ret tıklaması. Sensörde gönderenin gerçek quote bedeli, alıcının değişmeyen Etkisi kontrol edildi. |
| Geçersiz şart, süresi dolma, çift aktarım ve makbuz | Doğrulandı | Devre dışı kabul/karşı teklif + görünür neden; kapanış, farklı modal ve yükleme sonrası eski callback etkisiz. Kaynak bütünlüğü ve yeniden yüklenen makbuz kontrolü. |
| gün NaN | Düzeltildi | Haber `day`, teklif `born`; sıfır geçerli; bozuk tarihte “Tarih bilinmiyor”. Oluşum tarihi takvim ilerledikten ve Save v8 yüklemesinden sonra aynı. |
| Küçük haber/gelen kutusu penceresi | Düzeltildi | Sol çalışma alanı, 65 kayıt/30'lu yükleme, sabit başlık, filtre ve sekme geçişi, durum, devlet, kısa açıklama, ayrıntıya geçiş ve geri dönüş; gerçek dokunma kaydırması. |
| Gizli devlet / konum erişimi | Doğrulandı | Bilinmeyen devlet düğmesi ve konum navigasyonu kapalı; bilinen kimlik ve sistem aynı kameraya açılıyor. Gizli haber üretim kuralları değişmedi. |
| 7/2 ve yeterli Etkiye rağmen orijinal kuruluş reddi | Yeniden üretilemedi | Güncel arayüz toplam müttefik, 3 üye / 2 AI ortak ve uygun adayları ayırıyor. Özgün oyuncu kaydı yok; eski görüntünün kesin nedeni uydurulmadı. |
| İki uygun AI ve üç federasyon türü | Doğrulandı | Tam 220 Etkide Askerî/Bilimsel/Ticaret gerçek kuruluş tıklaması; üç üye ve tek 220 bedeli. Aday retleri, bekleme ve siyasi engeller motor regresyonlarında. |
| Ortak savaşta AI katılımı, destek talepleri/ortak filo emirleri | Doğrulandı | Kontrollü gerçek üretim motoru senaryoları ve ilgili paneller; doğal bütün galaksiler için katılım/denge garantisi değildir. |
| Araştırılmamış yeni gemi üretimi, mevcut eski gemilerin korunması | Doğrulandı | Yeni sipariş/tamamlama araştırma kapıları, mevcut gövde ve Taht korunumu, kayıt yükleme, çoklu tersane ve filo bileşimi regresyonları. |
| Parya/ambargo, gerçek büyük ticaret ve teklif kaynak bütünlüğü | Doğrulandı | Yasak teklif, miktar/gelir/sözler, imza bedeli, ret/sona erme ve atomik uygulama regresyonları. Kaçakçılığın mevcut istisnası korunur. |
| Sevkiyat kaynak/hedef/rota metinleri | Doğrulandı | Kaynak tersane, hedef filo, araştırma/izin/tehdit/bağlantı bekleme nedenleri ve Save v8 regresyonları. |
| Bina iptal çarpısı ve sayı, aylık bilim göstergesi | Doğrulandı | Üretim markup/CSS, gerçek gelir hesabı ve kayıt/RNG değişmezliği testleri. Her cihaz/font kombinasyonu için görsel garanti değildir. |
| Savaş simgeleri ve duraklatma | Doğrulandı | Gerçek üst bar kaynak/durum geometrisi, hız düğmeleri ve savaşta duraklatma anahtarı tıklamaları; mevcut savaş katmanının piksel regresyonları. |
| Rastgele olaylar açık/kapalı, eski kayıt varsayılanı | Doğrulandı | 1000 engellenen pasif olay/çalkantı; açıkken RNG ve olay yolu; iki ayarda gerçek diplomasi, spyTick, savaş, kriz dalgası ve bilim gemisi anomalisi; Save v8. |
| Fiziksel Android, WebView/PWA kurulu uygulama, FPS/ısı | Açık risk | Gerçek masaüstü headless Chromium + mobil viewport/dokunma emülasyonu fiziksel telefon kabulü değildir. |
| Uzun AI ekonomisi | Açık risk | Negatif stok yokluğu denge çözümü değildir; 99/404'te enerji sıfırlanması ve kıtlıklar sürüyor. |

## Test sonucu ve önceki sürümden fark

Bu fazda çalıştırılan **92 benzersiz paket / 5186 başarılı kontrol / 0 kalan hata / 0 atlanan paket**. Buna ek **43 benzersiz gerçek Chromium senaryosu / 0 kalan hata / 0 pageerror**. Sonuçlar tekilleştirildi; eski 95E/95E.1 toplamları eklenmedi.

95E.1'in belgelenmiş tam regresyonu bitmemişti; bu fazda mevcut bütün test paketleri çalıştı. İlk tam koşunun erken beş paketi eski cache adına takıldı; yalnız bu beklentiler düzeltildikten sonra izole tekrar edildi. İlk tarayıcı çalışmasında başlık ekranını kapatmayan test hazırlığı düzeltildi. İlk kompakt arayüzde ölçülen üç satır gerçek yerleşim düzeltmesiyle beşe çıktı. Vasallık testine kanonik `tehdit` alanı eklendi; iki federasyon testi önce kapalı ayrıntı bölümünü gerçek summary tıklamasıyla açacak şekilde düzeltildi. Ham ilk sonuçlar korunur; başarısızlıklar gizlenmedi.

Gerçek Chromium: 133.0.6943.0. 740×360, 360×740 ve 1280×720; gerçek HTML/event, dokunma kaydırma, bağımsız scroll, diğer modalların korunması, eski worker cache aktivasyonu→95E.2 yükseltmesi, eski cache temizliği, offline yeniden açılış ve kalıcı Save v8 kontrol edildi. 95E.1 worker kodu yalnız CACHE adı bakımından farklı olduğundan, test sunucusu önce aynı worker'ı eski cache adıyla etkinleştirip sonra güncel worker'a geçer; fiziksel cihazdaki eski kurulumun tamamını taklit ettiği iddia edilmez.

| Yeni AI koşusu | Ay | Negatif stok | Enerji sıfır devlet-ay | Mal kıtlığı örneği | Gerçek AI inşaat bitişi |
|---|---:|---:|---:|---:|---:|
| 11 | 120 | 0 | 0 | 0 | 1 |
| 99 | 120 | 0 | 54 | 11 | 10 |
| 404 | 120 | 0 | 34 | 47 | 5 |

Ek 120 aylık kanonik 95E.1/11 karşılaştırması: süre, aylık ölçümler, makbuz/kayıt boyutu, haber ve teklif ölçümleri ve inşaat metrikleri aynı. Çalışma süreleri eşzamanlı host yükünden etkilenir; Android performansı değildir.

Kanıtlar: `tests/summary-95e2.json`, `tests/audit-95e2/browser-summary.json`, `tests/audit-95e2/source.json`, `tests/audit-95e2/campaign-comparison.json` ve ham loglar. Başlangıç 95E.1 manifestinde GitHub'da bulunmayan 20 tarihsel test çıktısı listeleniyordu; mevcut 1.275 GitHub dosyasının hash'leri doğruydu. 95E.2 manifesti teslim edilen dosyalar üzerinden yeniden kuruldu.

## Devam sınırı

95F/96A başlatılmadı. Gerçek ticaret konvoyları/sözleşmeleri, yedi kaynak için ayrı Ekonomi ekranı, doğal generatif müzik, portre/köken, casusluk teknoloji seçenekleri ve multiplayer planı korunur. Özgün oyuncu kaydı gerektiren federasyon/gemi kökeni iddiaları açık kalır. Yayın commit'i ve ZIP SHA-256 kendi içeriklerine gömülmez; teslim makbuzunda ayrı bildirilir.
