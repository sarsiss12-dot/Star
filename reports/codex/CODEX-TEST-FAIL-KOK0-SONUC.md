# STARS · CODEX-TEST-FAIL-KÖK.0

## Başlangıç

PR #82 ile `codex/stars-p56-kabul0` uzak HEAD'i `a8c07e18ee3daf544da62244fe31cd2aaa3ee574` üzerinde eşleşti. Aynı ağaçta oynanabilir kaynak `78668a4dff9373c1b81d0fd3073b64bb9e55a663`, oyun `96h10p57`, MP `MP.8.9b56`, Save8 v8, MP paket 4 ve protokol 1. [Kanonik PR](https://github.com/sarsiss12-dot/Star/pull/82)

p55 arşiv 253 paket, 6.632 PASS ve 279 FAIL. p56 arşiv 256 paket, 6.649 PASS ve 279 FAIL. p57 arşiv ham 256 paket, 6.612 PASS ve 280 FAIL. Ayrı tekrarlarla elde edilen p57 teşhis toplamı 6.654 PASS ve 276 FAIL. Bu toplam ayrı deneyleri içerir. [Arşiv paket envanteri](evidence/test-fail-kok0/baslangic/p57-arsiv-envanter.json)

Yeni ham kontrol, değişmemiş p57 kaynak ağacında Node v24.22.1, Debian 13, 2 işçi ve aynı 180 saniye sınırıyla başlatıldı. Canvas ve Chromium sürümleri ortam kaydındadır. [Ortam](evidence/test-fail-kok0/baslangic/ortam.json)

Oyun davranışı düzeltmesini içeren kaynak `e2da7ec0018a40d63f10e576b69d55db53708981`. Testlerin son kaynak ağacı `b6acca2a7a60db41e24ff8869d9c4777bc0bee92`. İnceleme PR #83 üzerinden yürüyor. [Taslak PR](https://github.com/sarsiss12-dot/Star/pull/83)

## Temsilî ilk hatalar

| Test adı | Eski hata | Kök neden | Düzeltme | Yeni sonuç | Gerçek ürün riski |
|---|---|---|---|---|---|
| `faz85c_crisis_save_continuity` | 90 PASS / 54 FAIL. 200 aylık zincir `DiplomaticInbox is not defined` ile kesiliyor. | Yerel VM listesinde `inbox.js` yok. Başarısız kuruluma bağlı kayıt zinciri var. | HTML betik listesi | 143/1, eski harita kilidi | Kayıt kontrolleri çalıştırılamıyor. |
| `faz85e_event_inbox_continuity` | 92 PASS / 59 FAIL. Gezinti ve codec senaryoları `DiplomaticInbox` olmadan başlıyor. | Aynı yerel yükleme listesi. | HTML betik listesi | 118/33, kalan karar/codec kontrolleri açık | Bildirim kodlayıcı ve uygulama kontrolleri birincil hatadan etkilenebilir. |
| `faz86b_deal_engine` | 121 PASS / 22 FAIL. 200 aylık zincir ve teklif arayüzü kesiliyor. | Aynı yerel yükleme listesi. | HTML betik listesi | 129/14, kalan teklif fikstürleri açık | Anlaşma kontrolü ile arayüz kaynak hatası henüz ayrılmadı. |

Güncel `index.html` önce `news.js` ve `inbox.js` sonra `ui.js` yükler. 18 inceleme adayının kendi VM listelerinde hiç `inbox.js` yok. `UI.drawInbox` içindeki gerçek karar kartı yolu modülü çağırıyor. Bu aşamada 18 paketteki bütün FAIL'ler tek nedene yazılmadı. [Başlangıç günlükleri](evidence/test-fail-kok0/dogrudan/)

## 1. Ortak test ortamı

Bu üç eşlemede yalnız VM yükleyicisi değişti. Eski yerel listeler `news.js`, `inbox.js`, `construction.js` ve `archive-ui.js` dosyalarını atlıyordu. Yeni ortak yükleyici, aynı p57 çalışma zamanını `index.html` sırasıyla aynı test VM’sinde çalıştırıyor. Eski DOM fikstürleri, araçlar, kayıt girdileri ve assertion'lar korunuyor. Arşiv kaynak köküyle çalışan karşılaştırmalar kendi yükleyicilerini kullanmaya devam ediyor.

Aynı yeni yükleyicide yalnız HTML’deki `inbox.js` sırası çıkarıldığında başlangıç FAIL sayıları üç testte de geri geldi. 54/59/22 FAIL’e karşı tam tarayıcı sırası 1/33/14 verdi. Üçünde toplam 87 assertion yeniden geçti. Eksik modül sonrasında zincirleme duruşlarla eski arayüz/olay varsayımları birlikte bulundu. Kalan 48 assertion ayrı değerlendirmede. [Pozitif ve negatif günlükler](evidence/test-fail-kok0/dogrudan/)

## 2. İşlem geri alma

Bir koloninin devri devletin son kolonisini kaldırınca `captureSystem` filo tasfiyesine ulaşır. `fleetRemovalRecord` kalıcı `G.fleetJournal` değiştirir. `holdFleetReferences` toparlama işaretlerini `FLEET_RECOVERY_DIRTY` kümesine yazar. Sonraki işlem hatası eski sahipliği ve filoları geri yüklerken bu iki yazıyı bırakıyordu. Böylece başarısız bir devir Save8’e gerçekleşmemiş kayıp kaydı yazabiliyordu. Bu, ilk taramanın ortaya çıkardığı bir bağımsız ürün kusuru. [Motor ve regresyon değişikliği](https://github.com/sarsiss12-dot/Star/commit/e2da7ec0018a40d63f10e576b69d55db53708981)

Tam geri alma kapsamasına filo defteri ve işaret kümesi alındı. Test, boş ve dolu filo defteriyle gerçek tasfiyeden sonra hata üretti. Üç eski çalıştırmada her iki senaryoda da Save8 ve işaret kümesi farklı kaldı. Düzeltmeden sonra dünya grafiği, Save8 ve RNG tıpatıp geri döndü. Başarılı yeniden gönderimde Etki bir kez kesildi, bir makbuz oluştu ve mükerrer emir dünyayı değiştirmedi. [p55, p56, p57 ve adayın ham günlükleri](evidence/test-fail-kok0/islem/)

## 3. Güncel davranış ve arşiv kaynakları

| Test adı | Eski hata | Kök neden | Düzeltme | Yeni sonuç | Gerçek ürün riski |
|---|---|---|---|---|---|
| `faz86c_6_transaction_acceptance` | Başarısız işlem `fleetJournal` değiştiriyordu. | Kalıcı defter ve toparlama kümesi işlem dışında. | İki yazım yeri tam geri alma kapsamında. | 530/0. Güçlendirilmiş kontrol p55, p56 ve p57’de 528/2. | Doğrulandı ve düzeltildi. |
| `faz92a_war_contribution` | Bitiş gerekçesi ve statüko denetiminde iki FAIL. | Kapalı cephe gerekçesi artık eyleyen devleti de içeriyor. | Kesin gerekçe, tasfiye edilen gerçek filo, sıfır muharebe kredisi ve gerçek koalisyonla değişmeyen mülkiyet. | 34/0 | Bu iki vakada savaş motoru kusuru görülmedi. |
| `mp63_polvas` ve `beta_fed_found0_mp` | İnsan kuruluşu yedi kontrolde ilerlemiyordu. | Tek adımlı kuruluş komutu insan rızasını atlayamıyor. | AI rızaları ve insanın son onayıyla gerçek kuruluş. Eski komut ve AI reddi ayrı negatif kontrol. | 11/0 ve 11/0 | Rıza, ayrı insan oyları, ikinci oy reddi ve vasal karar yetkisi geçti. |
| `faz91e_federation_laws`, `faz95b_federation_reform` | İkinci önerinin daima reddedilmesi ve adayın önce tüm ittifakları kurması bekleniyordu. | Gündem kuyruğu var. Oylamalı üyelik ve doğrudan kabul farklı kurallara tabi. | Aynı oy açık kalıyor, yeni öneri ücretsiz kuyruğa giriyor, aynısı reddediliyor. Üyelik oyu doğrudan üyelik kurmuyor. | 31/0 ve 68/0 | Sınanan oy ve ödeme davranışında kusur görülmedi. |
| `beta_p01_mirror`, `mp6_mirror`, `mp84_notice_identity` | Eski savaş özeti, HTML ve gizlilik işareti biçimi varsayımları. | Savaş özeti kampanya alanlarını, sayfa sürüm korumasını, Save8 gizlenen kararı koruyor. | Kendi ve yabancı filo gücü ayrımı, SRI ve CSP özetleri, karar UID’si ve menü erişimi. | 3/0, 8/0, 5/0 | Gizli üst veri ve tek ödeme kontrolleri geçti. |
| `beta_fed_found0_compat` | p13 dünyasının p57 ile üç ay boyunca ham eşitliği bekleniyordu. | Arşivde p13/p14 için geçerli eşdeğerlik iddiası güncel motora uygulanmış. | Kanonik arşiv kaynaklarında tam bayt ve RNG karşılaştırması. Gerçek p13 MP paketi güncel oyunda okunup dünya özeti doğrulanıyor. | 6/0 | Ölçülen eski kayıtta gün, RNG, kaynak, koloni, filo ve savaş bilgileri korundu. |
| `faz96h71_closed_joint_save`, `mp89_ui_integrity` | Arşiv baytları sonraki yamalar geri alınarak oluşturuluyordu. | Üretim ağacı arşiv sürümünü geri kuramıyor. | Sabit commit’ten manifest ile doğrulanan dosyalar. Güncel ortak harekât kayıt testleri ayrıca çalışıyor. | 10/0 ve 1/0 | Tarihsel negatif kontrol yükleme kusurunu yakaladı. Güncel kapalı plan yüklemesi ve bozuk etkin plan reddi geçti. |
| Harita ve HTML kaynak kilitleri | p57 daha eski özetlere mahkûm edilmişti. | Liman haritası, mobil işlem düğmeleri ve diğer onaylı değişiklikler dosyaları değiştirdi. | Doğrulanmış p57 hash’i ile eski arşiv özetleri sürüme göre kabul ediliyor. | Yerel raster 40/0, kamera 32/0, bilim 20/0, mobil 29/0, kayıt arayüzü 17/0, inşa güvenliği 10/0. | Dokunma, toparlama, filo çizimi ve CSS mutasyonu kontrol altında. |

Güncel harita özeti `a8c07e18` Git nesnesinden üç kesit olarak alındı. Özetlerden biri değişince veya arşiv ile p57 kesitleri karıştırılınca denetim başarısız olur. `index.html` de p56 ve p57 arasında değişmedi. Çalışma ağacından kendiliğinden yeni özet kabul edilmiyor. [Hedefli ham sonuçlar](evidence/test-fail-kok0/dogrudan/aday/)

## 4. Zaman aşımı

Test işçisi 180 saniye sınırını koruyor. Önceki çalışmada iki işçiyle zaman aşımına uğrayan üç kampanya ve yeni kontrolde zaman aşımına uğrayan geniş galaksi kurulum matrisi, paket kuyruğu boşalınca birer birer başlıyor. Çıkış kodu, sinyal ve zaman aşımı nedeni ham özette ayrı tutuluyor. Bir saniyelik negatif çalıştırmada kampanya `TIMEOUT`, `SIGKILL`, sıfır PASS ve bir FAIL olarak kaldı. [Negatif çalıştırıcı kontrolü](evidence/test-fail-kok0/dogrudan/zaman-asimi-1s.json)

## 5. Save8, multiplayer ve performans

p57 ile aday aynı 100 sistem 120. ay ve 500 sistem 120/180. ay kayıtlarından bir ay oynatıldı. Başlangıç ve bitiş Save8 özetleri ile RNG değerleri üç girdide de eşleşti. Geri alma anında görülen Save8 ayrışması düzeltme testinde ayrıca ölçüldü. [Eşdeğerlik ham JSON](evidence/test-fail-kok0/performans/save-rng.json)

Gerçek Chromium 155 ve yerel üretim relay ile I100 4/4 PASS. Host ve iki misafirde uzun oturum, filo ve görünür alan eşitliği, yeni sensör paylaşımı ve Save8 sonrası devam geçti. Fiziksel Android, internet/LAN ve canlı Render **NOT RUN**. [I100 ham günlük](evidence/test-fail-kok0/mp/I100/I100.log.gz)

## 6. Açık incelemeler

Eski karar arayüzü testleri kapatılmadı. `faz85e` içinde `UI.openNote` tarihsel tüketicinin doğrudan çağrılmasını bekliyor. Güncel yol `DiplomaticInbox.capture` sonrasında `ArchiveUI.record` çağırıyor. Eski çifte barış ve teklif kimliği kontrollerini güncel giriş noktasına taşıyacak bağımsız negatif kontroller henüz tamamlanmadı. `faz86b` içinde eski karşı teklif kartı fikstürü ilk başarısızlıktan sonra saflık kontrollerini de etkiliyor. Bu paketlerdekilerin tümünün altyapı kaynaklı olduğu çıkarımı yapılmadı.

`faz95e_news` bir barış haberini bekliyor. Güncel motorun ayrı `war-end:<cephe>` ve `peace:<çift>:<gün>` kayıtları var. Bu iki kaydın kullanıcıya tekrar gibi görünüp görünmediği değerlendirilmedi. Aktif işlerin ve yeni sürüm kararının durumu devir kaydında. [Mevcut kontrol ve tekrar komutları](CODEX-TEST-FAIL-KOK0-DEVIR.md)
