# 96F.3 — Teknik devir

Kanonik ebeveyn 96F.1, SHA-256 85f808ba8e87a1735285f867dba2a8cc88190b9325a7480492e2eb1d069266a1. Araştırma 96F.2 e18b05defcc5fea29b37769769cc5fa75b231ad8019e4adc09ec51ad98dd7d56 bir oyun sürümü değildir. Çıktı BUILD_ID=96f3, cache=stars-v96f3, Save v8.

Üretim dosyaları yalnız ai.js, economy.js, main.js, sw.js. economy.js'de gerçek gelir formülü değişmez; empireIncome'un optional detail=false parametresi AI tahmininde gereksiz ledger nesnelerini üretmez. main.js yalnız BUILD_ID; sw.js yalnız cache adı.

aiBuildingDelta: normal doğrusal durumda colonyOutput farkına gerçek radikal çarpanı, doğru devlet çarpanı ve identityEatsFood uygulanır. Port/federasyon gibi doğrusal olmayan durumda gerçek empireIncome iki gölge devlet üzerinde çalışır; koloni geçici olarak değiştirilip try/finally ile senkron geri konur. UI, kaynak, RNG ve save değişmez. Bu yol normal koloniden pahalıdır; çok kolonili/federasyonlu mobil profil henüz kapsamlı ölçülmedi.

aiShipPurchaseSustainable: gerçek shipCost sonrası stok, mevcut/öngörülen net, paid queues, bakım ve ekstra rezervlere bakar. Normal altı aylık; görünür hayati askerî savunmada üç aylık ek kontrol vardır. Bu, önceki enerji/18 aylık alaşım/kapasite/araştırma/rezerv kapılarını gevşetmez. aiShipProduction.can, eski doğrudan askerî yol, inşaat gemisi ve colossus yoluna bağlanır. Oyuncu queueShip ve fiyatlar değişmedi. aiBuildingSustainable gerçek buildingCost kullanır ve açığı iyileştiren üretici istisnasını korur.

aiDemolitionChoice: pending kuyruklar, gerçek delta, bütün ihtiyaçlar, son yararlı kopya ve savunma/liman/tersane koruması. Yuva açarken temel kaynak neti negatife geçirilemez/mevcut açık ağırlaştırılamaz. Etkisiz tek çiftlik sökülebilir. Hiç aday yoksa aiTalk['economy-slot:S:P'] ile 90 günlük sınırlı yeniden deneme; sonsuz while veya koşulsuz yıkım yok. Her kolonide mutlaka yıkılabilir bina olacağı garanti edilmez. Mevcut kriz kurtarma yıkımı ayrı ve korunmuş yoldur.

Testler: faz96f3_physiology_test.js, faz96f3_purchase_test.js, faz96f3_demolition_test.js, helpers/96f3-fixture.js. fixtures/96f3 altındaki Save v8 dosyaları gerçek kayıttır. Ara karar testinde deserialize sonrası inc/cgNeed/foodNeed geri konmalıdır. Aksi halde güncel nüfusla yeniden hesaplama karşılaştırmayı değiştirir.

Koşular: NODE_PATH uygun mevcut bağımlılık yoluyla node tests/run-all.js; browser-96f3.js ve performance-96f3-browser.js için STARS_CHROMIUM_PATH gerekir. run-96f3-campaigns.py sekiz nihai seed'i çalıştırır; campaign-96f3.js SEED A/AB/repeat test VM seçenekleri sunar. capture-96f3-decisions.js eski kanonik kaynak dizinini ister. Kayıt ve sourceHash verilerini üzerine yazmadan önce mevcut kanıtları saklayın.

96F.4: ticaret ihracat aday havuzu, liman örnekleme/önbellek bütçesi ve diplomatik mal değerleme eşikleri. Bu dosyalar 96F.3'te byte düzeyinde korunmuştur. Seed404 96→77 teslimat ve seed42 12 kritik devlet-ay açık kalır. Yeni koloni nüfus/yönetim gideri satın alma kapısının mevcut öngörüsünde yok; bunun ayrı denge araştırması gerekir. Sonraki faz otomatik başlatılmadı.

GitHub sınırlı runtime/faz manifesti, tam ZIP manifesti değildir. GITHUB-96F3-YAYIN.json nihai commit ve lease sonucunu bildirir. Tam dosya envanteri DEGISEN-DOSYALAR-96F3.json; bütünlük aracı tools/verify-release.py. ZIP kimliği ve SHA-256 son sohbet tesliminde verilir; arşiv kendi SHA'sını içerecek biçimde değiştirilmez.
