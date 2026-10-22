# Faz96F.1 geliştirici devri

Kaynak stars-faz96f.zip;SHA-2568e975709098de955108a0460fc66fdb62adf6fc2ca9398ec7a5f025ccd05099b;19.709.799 bayt. CRC ve3.185 manifest dosyası doğrulandı. Build96f1/cache stars-v96f1/Save v8. Başlangıç main6ddabca12ece1810234d1a831112886dc769fe5c. Yayın sonucu GITHUB-96F1-YAYIN.json'dadır.

Üretim değişiklikleri ai.js ve commerce.js; main.js yalnız BUILD_ID, sw.js yalnız cache kimliği. Ekonomi, diplomasi, savaş, harita/panel, civic/tür/genetik/köken katalogları yeniden yazılmadı.

aiRecoveryInvestment(e,plan) kaynak oluşturmaz. Geçerli kritik üreticinin fiyatı en fazla üç ayda mevcut pozitif gelirle finanse edilebiliyorsa türetilmiş rezerv döndürür. aiEconomicOrder ucuz büyümenin fonu tüketmesini, aiShipProduction sivil harcamanın aynı parayı harcamasını önler. Gemi giderleri her ücretli alımdan sonra mevcut ortak planla yeniden kontrol edilir. Savaş ve savunma bütçe kuralları kaldırılmadı.

Commerce.route opsiyonel avoidObserved kullanır. aiPortRoute gözlenen tehlikeyi anahtara katar. Dispatch gerçek AI göndericinin güvenli alternatifini tercih eder; yoksa kabul edilmiş sözleşmenin mevcut yasal/riskli yoluna döner. Yeni mutlak tehlike kalkış yasağı yoktur. Gizli korsanlar ve gerçek kayıplar korunur.

AIDiagnostics yüklemede yeni dünya referansıyla sıfırlanır. Son report() tam120 ayı göstermez. Yeni dış forensics izi yükleme boyunca sürer; analyze-96f1.py benzersiz devlet/ortak/ay/neden sayar. Kod bu opt-in tanı kayıtlarını karar girdisi olarak kullanmaz. Trace sınırları dolmadı.

Yeniden üretim (proje kökünde; Node ve native Canvas/Playwright/Chromium ayrı bağımlılıklardır):

    NODE_PATH=<deps> node tests/run-all.js
    NODE_PATH=<deps> STARS_CHROMIUM_PATH=<chromium> node tests/browser-96f1.js
    NODE_PATH=<deps> node tests/campaign-96f1.js 11
    NODE_PATH=<deps> node tests/campaign-96f1.js 99
    NODE_PATH=<deps> node tests/campaign-96f1.js 404
    python tests/analyze-96f1.py
    NODE_PATH=<deps> python tests/performance-96f1.py
    python tools/verify-release.py

Kampanya/brauzer kıyasları kanonik96F'nin kardeş source96f dizininde açılmış olmasını ister. candidate modu yalnız mevcut96F baseline JSON'u ile yeni koşuyu çalıştırır; varsayılan pair modu iki sürümü de yürütür. Beş ek seed7/23/42/123/2026'dır. Bazı eski regresyonlar tarihsel baseline klasörlerini kullanır; bunlar oyunun çalışması için gerekmez. Testler tekrar yürütülürse teslim manifesti doğal olarak değişebilir; bütünlük kontrolünü temiz ZIP açılımında yapın.

İlk aday kayıtları saklıdır. Kaynak99 gerçek olay izi/RNG ve teslimleri değişmedi.404 teslim140→96 ve2026 teslim12→0 açık risklerdir. Toplam11 kritik devlet-ay kalır; erken alaşım7→5 olsa da geç mineral açıkları vardır. Tek son ayı veya gemi sayısını genel başarı saymayın. Gerçek Android performansı ve öznel müzik doğallığı doğrulanmadı.

Tam ZIP manifesti full-package kapsamındadır. GitHub kapsam manifesti çalışma zamanı/test/rapor dosyalarıyla sınırlıdır; tarihsel uzak arşivleri korur. Tarihsel tests/navy-95a-after-11/99/404.json kaynak ZIP baytlarıyla korunur; yeni kampanyalar tests/audit96f1 altındadır. Yeni ekran görüntüleri, bağımlılıklar ve Chromium ZIP'e gömülmedi.

96G,96G.1,96H,96I yol haritası korunur. Bu faz96G'yi başlatmaz.
