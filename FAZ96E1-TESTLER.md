# Faz 96E.1 — gerçek test sonuçları

Son üretim kodu: BUILD_ID=96e1, Save v8, cache stars-v96e1. Test anındaki bütün üst düzey JavaScript SHA-256 değerleri tests/audit96e1/verification-result.json içindedir. Teslim sırasında aynı değerler yeniden karşılaştırılır.

| Alan | Sonuç | Gerçek sayı/kapsam |
|---|---|---|
| Otomatik regresyon | PASS | 114 paket, 5690 adlandırılmış kontrol, 0 FAIL, 0 atlanan paket |
| Yeni 96E.1 testleri | PASS | identity 22, mechanics 64, actions 17: toplam 103 kontrol; geniş koşunun içinde, ikinci kez toplama eklenmez |
| Chromium | PASS | 16 kontrol, sürüm 133.0.6943.0, 0 pageerror; 360×740, 740×360, 1280×720 |
| Güncel adlandırılmış test kontrolü toplamı | PASS | 5690 + 16 = 5706; döngü içindeki her assertion/440 AI ayrı “test” diye sayılmadı |
| Uzun kampanya | PASS | 3 seed × 2 sürüm × 120 ay; 60. ay yükleme, harita/başkent eşliği ve aylık kaynak geçerliliği |
| Performans tekrar çifti | PASS | seed404 ek 2×120 ay; 30.74 s, süreç birleşik tepe RSS 276076 KiB |
| Gerçek Canvas | PASS | Eski native Canvas paketleri, 96D portre paketi 8/0; tarayıcıda gerçek Canvas çizimi |
| Sesin programatik yolları | PASS | Mevcut audio paketi 6/0 ve tarayıcı mevcut OfflineAudio kontrolü |
| Gerçek Android cihaz/PWA kurulum yaşam döngüsü | BLOCKED | Fiziksel cihaz erişimi yok. Ham tarayıcı raporu physicalAndroid=NOT RUN der; emülasyon gerçek cihaz testi değildir |
| Müziğin insan tarafından doğal bulunması | NOT RUN | Dinleme kabulü yapılmadı; müzik kodu değiştirilmedi |
| Uzun bellek sızıntısı / kapsamlı geç oyun kriz dengesi | NOT RUN | 120 ay ve tek süreç tepe RSS bunları kanıtlamaz |

İlk tam koşu full-review: 5676 PASS / 6 FAIL. Bu çıktılar silinmedi. Eksik ahl save farkı gerçek hata olarak düzeltildi; diğer eski karşılaştırmaların kapsamı güncellendi. Ara final koşusunda test düzenleme hatası ve henüz düzeltilmemiş şok testi de görüldü. Son tek tam koşu verified/summary.json: 5690/0. Önceki başarısız revizyon sonuçları güncel başarı diye sunulmadı.

Eski testlerde yapılan kontrollü uyarlamalar:
- BUILD_ID/cache beklenen literal değerleri 96e1'e taşındı.
- faz95d_identity: 95C1 ile bütün istatistikler aynı kalacak iddiası bu fazla geçersizdir. Harita eşliği ve normalizeIdentities'in save/RNG üzerinde salt okunurluğu ayrı korunur.
- faz96c2_rebuild: economy.js için “hiç değiştirilmedi” dosya eşliği kaldırıldı; gerçek kargo, ledger ve construction dosya eşlikleri korunur. Yeni ekonomi tüketicileri yeni testlerde ölçülür.
- faz93c: yalnız buildMul ölçen senaryo shipSpeed/militaryBuildMul'u nötrler; gerçek kuyruk süresi/planner süresi eşitliği korunur.
- faz86a: ikinci bağımsız risk deneyinden önce ağ seviyesi/gerçek sabotaj tesisi yeniden kurulur, quote.ok doğrulanır. İlk operasyonun yakalanması sonraki senaryoyu tesadüfen kilitlemez. Gerçek runOp motoru değiştirilmedi.

Çalıştırma (Node ve @napi-rs/canvas bağımlılığı gerekir):
    NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" STARS_TEST_WORKERS=4 STARS_TEST_LOGS=tests/audit96e1/recheck node tests/run-all.js
    NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" STARS_CHROMIUM_PATH=/path/to/chromium node tests/browser-96e1.js
    node tests/campaign-96e1.js 11
    node tests/campaign-96e1.js 99
    node tests/campaign-96e1.js 404
    python3 tests/performance-96e1.py
    python3 tools/verify-release.py

Tarihsel karşılaştırma paketleri için ZIP'in yanında source96e, baseline-96a/b/c/c1 dizinleri gerekir; bu harici girdilerin doğrulama kayıtları historical-inputs.json ve source-verification.json içindedir. Bunlar oyun dağıtımına kopyalanmadı. Güncel oyunu oynatmak için bu test girdilerine veya Node'a ihtiyaç yoktur. Tarayıcı Chromium indirme denemesi önce CDN hatası verdi; mevcut test bağımlılığındaki Chromium133 ile gerçek koşu tamamlandı. Tarayıcı ikilileri/Node bağımlılıkları ZIP'e eklenmedi.

Federasyon gerçek kuruluş/üyelik/oylama/gelen kutusu, vasallık, ticaret/kargo, savaş, araştırma, casusluk, otomatik bilim keşfi, haber, portre ve ses regresyon paketleri geniş koşuda çalıştı. Kullanıcının çözüldü dediği kuruluş ve keşif davranışları yeni hata diye açılmadı. Tarayıcı kuruluş kontrolü gerçek düğme→220 etki→gerçek üyelik zincirini ayrıca doğrular.
