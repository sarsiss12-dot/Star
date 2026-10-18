# STARS — Faz 95E.3 — 18 Ekim 2026

Kanonik kaynak `sarsiss12-dot/Star`, `main`, `88a4d5d6435757d822f1885a8808e61d03a94397`; başlangıç HEAD aynıydı. Git ağacı `e6901ac4fcae36fb321fb49a6cafd018927eac2f`; GitHub'dan alınan 1.439 blob SHA-1 ve önceki manifestin 1.438 SHA-256 girdisi birebir doğrulandı. Bu bir bakım fazıdır; 96A başlamadı.

## Sonuçların anlamı

| Soru | Sonuç ve kanıt |
|---|---|
| Son savaş onayı gerçekten çalışıyor mu? | Evet. `warFinalConfirm` düğmesine eksik `data-a` eklendi. Gerçek hedef seçimi ve iç span'a Chromium tıklaması savaşı başlattı, hedefi oluşturdu, gerçek Etki bedelini bir kez kesti. Eski kaynakta aynı tıklama savaşı başlatmadı. |
| Tek yönlü sensör ne aktarıyor? | Sağlayıcının keşfedilmiş yıldızları ve kendi hâkimiyetindeki sistemler/boş olmayan, sistemde bulunan filolarının sensör alanı. Tek yönlü `visionFrom`, karşılıklı `shareVis` kaydına çevrilmez. Alıcının keşif geçmişi kalıcıdır; canlı görüş geçicidir. |
| Canlı filo görüşü çalışıyor mu? | Evet. Kabul anında `View.fleetVisible` false→true ve gerçek ana Canvas pikselleri değişti. Gerçek `stepFleets` hareketinde çıkış ve varışta görüş yeniden hesaplandı. Kaynak sağlayan filo hiper-yoldayken hedefi erken açmaz; sistemdeki sensör kaynakları kuralı korunur. |
| Harita çizgileri gerçekten çiziliyor mu? | Evet. Gerçek Canvas üzerinde altın kısa kesik federasyon, turkuaz uzun kesik ittifak, kırmızı savaş çizgisi; gerçek düğmeler, üç ana mod, birlikte/ayrı/kapalı, kamera kaydırma ve ekranla kesişen kısmi bağlantı sınandı. Federasyon amblemi pikselleri ayrıca ayrıştırıldı. |
| Ne zaman gizleniyor? | `zoom < 0.10`: ilişkiler çizilmez; `0.10 ≤ zoom < 0.18`: çizgi var, federasyon amblemi yok; `zoom ≥ 0.18`: amblem var. Bilinmeyen ilişki, temassız devlet, keşfedilmemiş uç, bütünüyle ekran dışındaki çizgi ve 12/36 bağlantı sınırı geçerlidir. |
| Performans/kayıt sorunu var mı? | Bu fazın regresyonunda yeni hata saptanmadı. Save v8 korundu; türetilmiş görüş Map'i kayda girmez. `pVis` pahalı sensör hesabını çağırmadan önbelleği okur; yeni her-kare galaksi taraması yok. Fiziksel Android/GPU/FPS kabulü yapılmadı. |

## Küçük üretim değişiklikleri

- `ui.js`: savaş son onayının olay delegesi bağlantısı. Diğer kritik `_hook` onayları hedefli tarandı; eksik bulunan diğer literal ad yok. `subYes:` dinamik adının `data-a="subYes:${t}"` karşılığı mevcut.
- `main.js`: ayrı izin kontrolleriyle sağlayıcı başına türetilmiş canlı sensör kümeleri; alıcının kendi `G.vis` alanı korunur. Giver'ın yerel sensörü, menzil ve bulutsu kuralıyla hesaplanır; üçüncü devletin canlı görüşü veya casusluk ağı yeniden aktarılmaz. Paylaşım kabulü, aylık görüş güncellemesi, kayıt yükleme ve sağlayıcı filonun sistemden çıkış/varışı yeniler. Aynı hareket adımında çoklu değişiklik tek yenilemeye toplanır. İzin iptali, savaş veya devlet ölümü mevcut önbelleği `pVis` için hemen geçersiz kılar. Tanılama build kimliği `95e3` oldu.
- `diplomacy.js`: `shareVision` işlevsiz `sy.vis` kopyası yerine gerçek keşif/canlı sensör bağlantısını kullanır. False paylaşım kaydı kopyalama yapmaz. Savaş, karşılıklı `shareVis` paktını da kapatır; yalnız sensör çakışması taşıyan eski Save v8 kayıtları da savaş korunarak temizlenir. Bilinen ilişki çizgisi için keşfedilmiş konum yeterlidir; ayrıca anlık radar zorunluluğu kaldırıldı. İlişkiyi bilme kuralları değişmedi.
- `map.js`: ekranla kesişen çizgiler uçlardan biri dışarıda olsa da Canvas tarafından kırpılarak çizilir. Çizgiler daha okunaklı opaklık/kalınlıkla, federasyon amblemi 20 px olarak çizilir; mevcut etiket çakışma listesinde alanı ayrıldığı için devlet adı amblemin üstünü kapatmaz. Aynı çiftte federasyon katmanı açıkken federasyon önceliği sürer.
- `sw.js`: `stars-v95e3`. Tarihsel testlerde yalnız güncel build/cache beklentileri ilerletildi; eski mekanik ve UI hash sabitlemeleri korunur.

`archive-ui.js`, `inbox.js`, `news.js`, `construction.js`, `index.html`, `economy.js`, `combat.js`, `ai.js`, `audio.js`, `manifest.json` kanonik 95E.2 ile bayt düzeyinde aynıdır. Geniş haber/gelen kutusu, kabul/ret/karşı teklif, uzaktan inşaat, rastgele olay anahtarı, tek 2B Canvas kamera ve Android/PWA altyapısı korunur.

## İstihbarat ve savaş sisi

Sensör paylaşımı araştırma, ayrıntılı tarama (`pSurv`), teknoloji, temas listesi, seviye 3 istihbarat veya `spynet` paktı vermez. Gizli ve sensör dışındaki filo görünmez kalır. Sağlayıcının güncel sensörü bir başka paylaşım sağlayıcısının canlı alanını zincirlemez. Ayrıntı bilgisi açan mevcut istihbarat kapıları değiştirilmedi.

Harita ilişkisinin bilinirliği konum bilinirliğinden ayrıdır: yalnız temas, yabancı federasyon ilişkisini açıklamaz. Yabancı federasyon için bağlantının iki üyesinin bilinen bağları; yabancı ittifak için mevcut seviye 3 ilişki bilgisi gerekir. Kendi federasyonundaki temaslı üyeler için aynı casusluk şartı aranmaz. Bilinen ilişki + keşfedilmiş konum + radar dışında olma artık çizim engeli değildir. Oyuncuya gizli devlet sayısı veya siyasi bağlantı verilmez.

## Test yöntemi ve ilk başarısızlıklar

95E.2 üzerindeki yeni sensör temel koşusu **1 başarılı / 6 başarısız** idi. Üç gerçek Chromium temel senaryosu (savaş tıklaması, sensör kabulünün canlı çıktısı, ekran dışı uç) **0 başarılı / 3 başarısız** idi. Aynı testler güncel kaynakta geçti; ham başlangıç logları korunur.

İlk yeni tarayıcı matrisinde yanlış döndürme uyarısı kimliği ve önceki senaryodan kalan diplomasi paneli test hazırlığını bozdu. İkinci koşuda amblemin kendi turkuaz/kırmızı piksellerinin yanlışlıkla çizgi rengi sayıldığı görüldü; çizgi sayımı amblemin alanını dışlayacak şekilde düzeltildi, amblem ayrıca alpha farkıyla test edildi. PWA senaryosu yeniden açılışta oyuna girmeden önce gerçek `loadGame()` çağıracak şekilde düzeltildi. Portre testinde mevcut döndürme tavsiyesi test CSS'iyle maskelendi; bu, oyunun dikey kullanımının onaylandığı anlamına gelmez. Sağ bilgi paneli görsel QA için gerçek kapatma düğmesiyle kapatıldı; açık araç menüsü önce kapatıldı. Bunların logları da saklandı. Tam harita ekran görüntüsü QA’sında portrede bir devlet adının amblemi örttüğü ayrıca gözlendi. Aynı gerçek Canvas testi eski kaynakta etiket/amblemin örtüştüğünü kanıtladı; amblem alanı yerleşimde ayrıldıktan sonra hem ana Canvas piksel farkı hem de etiketle örtüşmeme kontrolü geçti.

95E.2'nin 43 tarayıcı senaryosundan hız düğmesi senaryosu, önceki testin açık bıraktığı diplomasi paneli nedeniyle ilk koşuda tıklanamadı. Reset paneli kapattıktan sonra izole senaryo geçti; 42+1 sonuç adlara göre tekilleştirilir. Yeni amblem/çizgi kontrolleri ve bu test hazırlığı düzeltmeleri üretim mekaniği değişikliği değildir.

Motorun tam koşusuna, çalışma başladıktan sonra eklenen 10 katman testi ve son build kimliği beklentilerinin hedefli tekrarları eklenir. Aynı test paketi veya Chromium senaryosu birden fazla kez toplama katılmaz. Nihai tekilleştirilmiş sayılar `TEST-SONUCLARI-95E3.md` ve `tests/summary-95e3.json` içindedir; önceki 95E.2 raporundaki sayılar kopyalanmaz.

Gerçek Chromium 133.0.6943.0: 740×360, 360×740 ve 1280×720; gerçek DOM olayları, Canvas `getImageData`, amblem farkı, kamera hareketi, PWA cache yükseltme, offline açılış ve kalıcı Save v8 kullanıldı. Chromium mobil viewport/dokunma emülasyonu fiziksel Android değildir. Dikey görünümde mevcut yataya çevir uyarısı korunur; portre Canvas kontrolü bu uyarının altında yapılmıştır.

100 sistem / 2 filo kontrollü örneğinde canlı sensör önbelleği yenilemesi ortalama yaklaşık 0,04 ms; 10.000 `pVis` sorgusu yaklaşık 8 ms ölçüldü. Eşzamanlı host yükü vardır; büyük galaksi veya cihaz FPS garantisi değildir. Sensör anlaşması yokken bilim gemisi keşif/rota, tarama ve RNG çıktıları eski kaynakla birebir karşılaştırıldı. Geniş keşif/rota ve üretim testleri tam regresyondadır.

## Teslim sınırı

Açık kalanlar: fiziksel Android/WebView/PWA kurulu uygulama performansı ve kabulü; özgün oyuncu kaydı gerektiren tarihsel federasyon/gemi kökeni iddiaları; önceki uzun AI kampanyalarında bilinen enerji/mal kıtlıklarının dengesi. Bunlar bu bakım fazında çözülmüş sayılmaz. Yeni kapsamın hedefli ve regresyon testlerinde kalan hata olmaması ayrı bir iddiadır.

96A gerçek ticaret sözleşmeleri ve fiziksel konvoylar planı korunur, uygulanmadı. ZIP SHA-256 ve yayın commit'i kendi içeriğine gömülmez; döngüsel hash oluşturmamak için yayın makbuzunda ve teslim mesajında ayrı bildirilir. ZIP girdilerinin her biri yayın GitHub ağacındaki blob ile eşleştirilir; force push kullanılmaz.
