# STARS · CODEX-TEST-FAIL-KÖK.0

## Başlangıç

PR #82 ile `codex/stars-p56-kabul0` uzak HEAD'i `a8c07e18ee3daf544da62244fe31cd2aaa3ee574` üzerinde eşleşti. Aynı ağaçta oynanabilir kaynak `78668a4dff9373c1b81d0fd3073b64bb9e55a663`, oyun `96h10p57`, MP `MP.8.9b56`, Save8 v8, MP paket 4 ve protokol 1. [Kanonik PR](https://github.com/sarsiss12-dot/Star/pull/82)

p55 arşiv 253 paket, 6.632 PASS ve 279 FAIL. p56 arşiv 256 paket, 6.649 PASS ve 279 FAIL. p57 arşiv ham 256 paket, 6.612 PASS ve 280 FAIL. Ayrı tekrarlarla elde edilen p57 teşhis toplamı 6.654 PASS ve 276 FAIL. Bu toplam ayrı deneyleri içerir. [Arşiv paket envanteri](evidence/test-fail-kok0/baslangic/p57-arsiv-envanter.json)

Yeni ham kontrol, değişmemiş p57 kaynak ağacında Node v24.22.1, Debian 13, 2 işçi ve paket başına 180 saniye sınırıyla tamamlandı. 26 dk 53 sn içinde 256 paket **6.643 PASS / 276 FAIL** verdi. 55 pakette en az bir FAIL, 10 korumalı eşdeğerlik paketinde 0/0 var. Bu sayaçlar önceki teşhis toplamından bağımsızdır. Kapsamı tamamlamayan paketlerin 0/0’ı PASS olarak etiketlenmedi. [Ortam](evidence/test-fail-kok0/baslangic/ortam.json) · [Tam paket envanteri ve hata zincirleri](evidence/test-fail-kok0/baslangic/envanter.json) · [Ham paket günlükleri](evidence/test-fail-kok0/baslangic/paket-gunlukleri.tar.gz)

İşlem geri alma düzeltmesi `e2da7ec0018a40d63f10e576b69d55db53708981`. Her iki ürün düzeltmesini ve tam aday taramasının girdilerini içeren kaynak `e3c57d18debf8e2627740b2f102f538decc31dd2`. İnceleme PR #83 üzerinden yürüyor. [Taslak PR](https://github.com/sarsiss12-dot/Star/pull/83)

## Temsilî ilk hatalar

| Test adı | Eski hata | Kök neden | Düzeltme | Yeni sonuç | Gerçek ürün riski |
|---|---|---|---|---|---|
| `faz85c_crisis_save_continuity` | 90 PASS / 54 FAIL. 200 aylık zincir `DiplomaticInbox is not defined` ile kesiliyor. | Yerel VM listesinde `inbox.js` yok. Başarısız kuruluma bağlı kayıt zinciri var. | HTML betik listesi | 143/1, eski harita kilidi | Kayıt kontrolleri çalıştırılamıyor. |
| `faz85e_event_inbox_continuity` | 92 PASS / 59 FAIL. Gezinti ve codec senaryoları `DiplomaticInbox` olmadan başlıyor. | Aynı yerel yükleme listesi. | HTML betik listesi | 118/33, kalan karar/codec kontrolleri açık | Bildirim kodlayıcı ve uygulama kontrolleri birincil hatadan etkilenebilir. |
| `faz86b_deal_engine` | 121 PASS / 22 FAIL. 200 aylık zincir ve teklif arayüzü kesiliyor. | Aynı yerel yükleme listesi. | HTML betik listesi | 129/14, kalan teklif fikstürleri açık | Anlaşma kontrolü ile arayüz kaynak hatası henüz ayrılmadı. |

Güncel `index.html` önce `news.js` ve `inbox.js` sonra `ui.js` yükler. 18 inceleme adayının kendi VM listelerinde hiç `inbox.js` yok. `UI.drawInbox` içindeki gerçek karar kartı yolu modülü çağırıyor. Yeni ham kontrolde bu 18 pakette 209 FAIL ve hata zincirlerinde 27 açık `DiplomaticInbox is not defined` satırı var. Arşivde 210 FAIL ve yine 27 açık satır vardı. 209 veya 210 sayısı bu paketlerdeki bütün başarısız assertion’ların toplamı. [Başlangıç günlükleri](evidence/test-fail-kok0/dogrudan/)

## 1. Ortak test ortamı

Bu üç eşlemede yalnız VM yükleyicisi değişti. Eski yerel listeler `news.js`, `inbox.js`, `construction.js` ve `archive-ui.js` dosyalarını atlıyordu. Yeni ortak yükleyici, aynı p57 çalışma zamanını `index.html` sırasıyla aynı test VM’sinde çalıştırıyor. Eski DOM fikstürleri, araçlar, kayıt girdileri ve assertion'lar korunuyor. Arşiv kaynak köküyle çalışan karşılaştırmalar kendi yükleyicilerini kullanmaya devam ediyor.

Aynı yeni yükleyicide yalnız HTML’deki `inbox.js` sırası çıkarıldığında başlangıç FAIL sayıları üç testte de geri geldi. 54/59/22 FAIL’e karşı tam tarayıcı sırası 1/33/14 verdi. Üçünde toplam 87 assertion yeniden geçti. Eksik modül sonrasında zincirleme duruşlarla eski arayüz/olay varsayımları birlikte bulundu. Kalan 48 assertion ayrı değerlendirmede. [Pozitif ve negatif günlükler](evidence/test-fail-kok0/dogrudan/)

## 2. İşlem geri alma

Bir koloninin devri devletin son kolonisini kaldırınca `captureSystem` filo tasfiyesine ulaşır. `fleetRemovalRecord` kalıcı `G.fleetJournal` değiştirir. `holdFleetReferences` toparlama işaretlerini `FLEET_RECOVERY_DIRTY` kümesine yazar. Sonraki işlem hatası eski sahipliği ve filoları geri yüklerken bu iki yazıyı bırakıyordu. Böylece başarısız bir devir Save8’e gerçekleşmemiş kayıp kaydı yazabiliyordu. Bu, ilk taramanın ortaya çıkardığı bir bağımsız ürün kusuru. [Motor ve regresyon değişikliği](https://github.com/sarsiss12-dot/Star/commit/e2da7ec0018a40d63f10e576b69d55db53708981)

Tam geri alma kapsamasına filo defteri ve işaret kümesi alındı. Test, boş ve dolu filo defteriyle gerçek tasfiyeden sonra hata üretti. Üç eski çalıştırmada her iki senaryoda da Save8 ve işaret kümesi farklı kaldı. Düzeltmeden sonra dünya grafiği, Save8 ve RNG tıpatıp geri döndü. Başarılı yeniden gönderimde Etki bir kez kesildi, bir makbuz oluştu ve mükerrer emir dünyayı değiştirmedi. [p55, p56, p57 ve adayın ham günlükleri](evidence/test-fail-kok0/islem/)

### Tamamlanmış muharebe raporunu kapatma

`faz96f_map_panel_native_canvas` ekran komutuna yasal rapor kimliğini verdi. `UI.act` içindeki `stabilityFleetAct` sarmalayıcısı düğme öğesini üçüncü argümandan düşürüyordu. `dismissBattleReport` kimliği denetleyemediği için tamamlanmış muharebe raporunu gizlemiyordu. Hata p55, p56 ve p57’de 17/2 ile tekrarlandı. Öğeyi gerçek işleyiciye ileten tek satırdan sonra 19/0. Eski kimlik ve etkin rapor reddi, aynı filo ve muharebe verisi ve gizleme tercihinin Save8’den sonra kalması geçti. Bu ikinci bağımsız ürün kusurudur. [Motor düzeltmesi](https://github.com/sarsiss12-dot/Star/commit/e3c57d18debf8e2627740b2f102f538decc31dd2) · [Ham kontroller](evidence/test-fail-kok0/muharebe/)

İkinci sorun bulunduğunda ilk aday taraması durduruldu. Çıktısı ara tarama olarak saklandı. Tek bir sonuç üretmek için iki adayın sayaçları birleştirilmedi.

## 3. Güncel davranış ve arşiv kaynakları

| Test adı | Eski hata | Kök neden | Düzeltme | Yeni sonuç | Gerçek ürün riski |
|---|---|---|---|---|---|
| `faz86c_6_transaction_acceptance` | Başarısız işlem `fleetJournal` değiştiriyordu. | Kalıcı defter ve toparlama kümesi işlem dışında. | İki yazım yeri tam geri alma kapsamında. | 530/0. Güçlendirilmiş kontrol p55, p56 ve p57’de 528/2. | Doğrulandı ve düzeltildi. |
| `faz96f_map_panel_native_canvas` | Gizleme ve gizleme tercihinin kayıt sonrası korunması 17/2. | Filo kurtarma sarmalayıcısı düğme kimliğini işlemciye iletmiyor. | Üçüncü argüman iletiliyor, kimlik denetimi sürüyor. | 19/0. Eski kimlik ve etkin rapor negatif denetimleri geçti. | Doğrulandı ve düzeltildi. |
| `faz92a_war_contribution` | Bitiş gerekçesi ve statüko denetiminde iki FAIL. | Kapalı cephe gerekçesi artık eyleyen devleti de içeriyor. | Kesin gerekçe, tasfiye edilen gerçek filo, sıfır muharebe kredisi ve gerçek koalisyonla değişmeyen mülkiyet. | 34/0 | Bu iki vakada savaş motoru kusuru görülmedi. |
| `mp63_polvas` ve `beta_fed_found0_mp` | İnsan kuruluşu yedi kontrolde ilerlemiyordu. | Tek adımlı kuruluş komutu insan rızasını atlayamıyor. | AI rızaları ve insanın son onayıyla gerçek kuruluş. Eski komut ve AI reddi ayrı negatif kontrol. | 11/0 ve 11/0 | Rıza, ayrı insan oyları, ikinci oy reddi ve vasal karar yetkisi geçti. |
| `faz91e_federation_laws`, `faz95b_federation_reform` | İkinci önerinin daima reddedilmesi ve adayın önce tüm ittifakları kurması bekleniyordu. | Gündem kuyruğu var. Oylamalı üyelik ve doğrudan kabul farklı kurallara tabi. | Aynı oy açık kalıyor, yeni öneri ücretsiz kuyruğa giriyor, aynısı reddediliyor. Üyelik oyu doğrudan üyelik kurmuyor. | 31/0 ve 68/0 | Sınanan oy ve ödeme davranışında kusur görülmedi. |
| `beta_p01_mirror`, `mp6_mirror`, `mp84_notice_identity` | Eski savaş özeti, HTML ve gizlilik işareti biçimi varsayımları. | Savaş özeti kampanya alanlarını, sayfa sürüm korumasını, Save8 gizlenen kararı koruyor. | Kendi ve yabancı filo gücü ayrımı, SRI ve CSP özetleri, karar UID’si ve menü erişimi. | 3/0, 8/0, 5/0 | Gizli üst veri ve tek ödeme kontrolleri geçti. |
| `beta_fed_found0_compat` | p13 dünyasının p57 ile üç ay boyunca ham eşitliği bekleniyordu. | Arşivde p13/p14 için geçerli eşdeğerlik iddiası güncel motora uygulanmış. | Kanonik arşiv kaynaklarında tam bayt ve RNG karşılaştırması. Gerçek p13 MP paketi güncel oyunda okunup dünya özeti doğrulanıyor. | 6/0 | Ölçülen eski kayıtta gün, RNG, kaynak, koloni, filo ve savaş bilgileri korundu. |
| `faz96h71_closed_joint_save`, `mp89_ui_integrity` | Arşiv baytları sonraki yamalar geri alınarak oluşturuluyordu. | Üretim ağacı arşiv sürümünü geri kuramıyor. | Sabit commit’ten manifest ile doğrulanan dosyalar. Güncel ortak harekât kayıt testleri ayrıca çalışıyor. | 10/0 ve 1/0 | Tarihsel negatif kontrol yükleme kusurunu yakaladı. Güncel kapalı plan yüklemesi ve bozuk etkin plan reddi geçti. |
| Harita ve HTML kaynak kilitleri | p57 daha eski özetlere mahkûm edilmişti. | Liman haritası, mobil işlem düğmeleri ve diğer onaylı değişiklikler dosyaları değiştirdi. | Doğrulanmış p57 hash’i ile eski arşiv özetleri sürüme göre kabul ediliyor. | Yerel raster 40/0, kamera 32/0, bilim 20/0, mobil 29/0, kayıt arayüzü 17/0, inşa güvenliği 10/0. | Dokunma, toparlama, filo çizimi ve CSS mutasyonu kontrol altında. |

Güncel harita özeti `a8c07e18` Git nesnesinden üç kesit olarak alındı. Özetlerden biri değişince veya arşiv ile p57 kesitleri karıştırılınca denetim başarısız olur. `index.html` de p56 ve p57 arasında değişmedi. Çalışma ağacından kendiliğinden yeni özet kabul edilmiyor. [Hedefli ham sonuçlar](evidence/test-fail-kok0/dogrudan/aday/)

Başlangıçta 16 harita ve 5 HTML kilidi p57 sürümünü hatalı reddetti. Buna MP.8.9, PERF.2 ve 96H.7.1’deki dört tarihsel kaynak denetimi de eklendi. Bu 25 kaynak kontrolü için döneme uygun karşılaştırma kuruldu. p13/p14’ün beş ham Save8 eşleşmesi ayrı bir davranış eşdeğerliğidir. [Paket başına ilk hata](evidence/test-fail-kok0/baslangic/envanter.json)

## 4. Zaman aşımı

Test işçisi 180 saniye sınırını koruyor. Önceki çalışmada iki işçiyle zaman aşımına uğrayan üç kampanya ve yeni kontrolde zaman aşımına uğrayan geniş galaksi kurulum matrisi, paket kuyruğu boşalınca birer birer başlıyor. Çıkış kodu, sinyal ve zaman aşımı nedeni ham özette ayrı tutuluyor. Bir saniyelik negatif çalıştırmada kampanya `TIMEOUT`, `SIGKILL`, sıfır PASS ve bir FAIL olarak kaldı. [Negatif çalıştırıcı kontrolü](evidence/test-fail-kok0/dogrudan/zaman-asimi-1s.json)

Yeni ham kontrolde `faz86f`, `faz89b` ve `faz91b` sırasıyla 100,7, 105,3 ve 99,9 saniyede geçti. `faz96g2` 180,1 saniyede durdu. Diferansiyel çalıştırma belirsizliği gidermek için bu dört paketi ayrı ölçüyor. İlk ham koşu dosyalarındaki başarısız süreler olduğu gibi duruyor.

## 5. Save8, multiplayer ve performans

p57 ile aday aynı 100 sistem 120. ay ve 500 sistem 120/180. ay kayıtlarından bir ay oynatıldı. Başlangıç ve bitiş Save8 özetleri ile RNG değerleri üç girdide de eşleşti. Geri alma anında görülen Save8 ayrışması düzeltme testinde ayrıca ölçüldü. [Eşdeğerlik ham JSON](evidence/test-fail-kok0/performans/save-rng.json)

İki düzeltmeyi taşıyan ilk tam adayda Chromium 155 ve yerel üretim relay sonuçları I100 4/4, I500 4/4, F 6/6, J 5/5, SG 5/5, TR 6/6 ve FA 5/5. I koşularında host ve iki misafirle altışar dakika, filo ve görünür alan eşitliği, yeni sensör paylaşımı, bağlantı dönüşü ve Save8 sonrası devam geçti. Yatay 844×390 Chromium oturumunda aynı raporun gerçek düğmesine dokununca p57 raporu açık bıraktı. Aday raporu gizledi ve Save8’den sonra gizli tuttu. Filo, muharebe sonucu ve RNG eşitti. Fiziksel Android, internet/LAN ve canlı Render **NOT RUN**. [Relay günlükleri](evidence/test-fail-kok0/ilk-tam-aday/mp/) · [Dokunma kanıtı](evidence/test-fail-kok0/muharebe/chromium.json)

### İlk tam adayın performansı

| Save8 | p57 CPU p95 | İlk tam aday CPU p95 | ABBA farkı | A/A farkı | Durum |
|---|---:|---:|---:|---:|---|
| 100/9, 120. ay | 397,16 ms | 470,46 ms | +%18,45 | +%3,82 | FAIL |
| 500/16, 120. ay | 1.959,82 ms | 1.919,11 ms | −%2,08 | −%0,45 | PASS |
| 500/16, 180. ay | 6.762,87 ms | 6.517,12 ms | −%3,63 | −%11,30 | Gürültü yüksek, doğrulanmış gerileme yok |

Yalnız işlem düzeltmesinin bulunduğu önceki ölçümde de 100/9 CPU p95 +%18,05’ti. Tam işlem mikro ölçümünde iki 256 satırlık defter de kontrolle aynı Save8 ve RNG’de kaldı. Bu defter tam grafiğe 770 kayıt ekliyordu. İlk tam aday normal ayda aynı işlem sayısı, RNG ve Save8 üretti. [İlk ABBA ve A/A](evidence/test-fail-kok0/performans/ilk-olcum-iki-duzeltme.json) · [İşlem mikro ölçümleri](evidence/test-fail-kok0/performans/)

Filo kaydı var olan satırları değiştirmeden yeni satır ekliyor ve sınır dolunca en eskisini çıkarıyor. Aday, tam grafikte dizinin kendi yapısını koruyup geçmiş satırların içini ikinci kez kopyalamıyor. Gerçek aynı-gün devirde 256. satır sınırına ulaşıldığı ve eski satır budandığı negatif kontrolde açıkça doğrulandı. Geri alma eski satırı aynı nesne ve sırayla getiriyor. [Kaynak](https://github.com/sarsiss12-dot/Star/commit/0ffd7e93)

### Tam kopyası azaltılan aday

| Save8 | p57 CPU p95 | Aday CPU p95 | ABBA p95 | A/A p95 | ABBA medyan |
|---|---:|---:|---:|---:|---:|
| 100/9, 120. ay | 362,18 ms | 372,55 ms | +%2,86 | +%26,03 | −%2,73 |
| 500/16, 120. ay | 1.915,67 ms | 1.982,91 ms | +%3,51 | +%5,01 | −%1,91 |
| 500/16, 180. ay | 6.605,21 ms | 6.378,25 ms | −%3,44 | +%1,29 | −%2,04 |

100/9’da tam işlem grafiği boyutu p57 → ilk düzeltme → son düzeltme sırasıyla 14.606 → 15.376 → 14.608 nesne. Tam ayın Save8 ve RNG değerleri üç girdide aynı. 500/16 CPU ölçümleri %5 eşiğinin içinde. 100/9 ABBA farkı da eşik içinde, ancak A/A saçılımı nedeniyle daha uzun tekrar gerekli. Sürekli durum ölçümü bir aylık ön yürütmeden sonra alındı. 120. ay 500/16 duvar saati p95 farkı +%5,35, 180. ayda −%4,73. [100/9 ham örnekler](evidence/test-fail-kok0/performans/odak100.json) · [500/16 ham örnekler](evidence/test-fail-kok0/performans/odak500.json)

## İlk tam adayın ham taraması

256 pakette 6.865 PASS ve 66 FAIL, süre 34 dk 29 sn, zaman aşımı sıfır. Başlangıçtaki 55 başarısız paketin 40’ı kapandı. Açık 17 paketten ikisi yeni manifest farkına işaret etti. `mp1_relay` bir ve `mp11_online` üç FAIL ile düzeltme öncesi özetleri yakaladı. Dört farkın nedeni `diplomacy.js` ve `ui.js` için eski SHA-256 değerleriydi. Taslak manifest gerçek kaynak özetlerine alındı. Doğrudan tekrar 14/0 ve 9/0. İlk tam taramanın 66 FAIL’i ham kanıtta aynen duruyor. [Tam tarama](evidence/test-fail-kok0/ilk-tam-aday/ham-ozet.json) · [Paket farkı](evidence/test-fail-kok0/ilk-tam-aday/paket-farki.json) · [Manifest düzeltmesi](https://github.com/sarsiss12-dot/Star/commit/84fa11f6)

`DiplomaticInbox` görülen 18 paketin toplamı 209’dan 42 FAIL’e indi. İsmi bulunamayan modüle ait hata satırı 27’den sıfıra düştü. Kalan 42 assertion arasında önceki arayüz ve kaynak kilidi beklentileri var. Küme paketleri başka kök nedenler de içerebilir. [Başlangıç ve aday envanteri](evidence/test-fail-kok0/ilk-tam-aday/paket-farki.json)

Taslak manifest 19 dosyanın SHA-256 değerleriyle eşleşti. p57 kontrolüne göre çalışma zamanı farkı yalnız `diplomacy.js` ve `ui.js`. Sürüm, PWA önbellek adı, Save8 v8, MP paket 4 ve protokol 1 aynı. [Manifest denetimi](evidence/test-fail-kok0/dogrudan/son-odak/manifest.json)

## 6. Açık incelemeler

`faz85e` içinde teklif kimliği deneyi güncel karar kartıyla çalışıyor. Üç gerçek teklif, aynı teklifin mükerrer olarak açılmaması, Save8’den sonra üç ayrı kimlik ve aynı şartlar, birini reddedince diğerinin bozulmaması doğrulandı. Eski karşılaştırma iki eksik alanı eşit sayabiliyordu. Kalan tüketici ve çifte barış testleri eski modal kancalarını bekliyor. Güncel `UI.openNote` önce `DiplomaticInbox.capture`, sonra `ArchiveUI.record` çağırıyor. Güncel statüko kararında bekleyen kayıt yeniden açıldı, aynı düğme iki kez çağrıldığında barış bir kez uygulandı, reddedilen ve süresi dolmuş karar uygulanmadı. Ret ülke sahipliğini, stokları ve RNG’yi korudu. `faz86b` içinde eski karşı teklif kartı fikstürü ilk başarısızlıktan sonra saflık kontrollerini de etkiliyor. Bu paketlerde başka doğrulama borcu var. [Güncel statüko deneyi](evidence/test-fail-kok0/dogrudan/statuko-guncel-karar.json)

`faz95e_news` bir barış haberini bekliyor. Güncel motorun ayrı `war-end:<cephe>` ve `peace:<çift>:<gün>` kayıtları var. Bu iki kaydın kullanıcıya tekrar gibi görünüp görünmediği değerlendirilmedi. Aktif işlerin ve yeni sürüm kararının durumu devir kaydında. [Mevcut kontrol ve tekrar komutları](CODEX-TEST-FAIL-KOK0-DEVIR.md)

`faz86a` önce bilinen bir devletin adını temas listesinden okuduğu için yanlış alarm üretiyordu. Güncel test aynı kişiyi temas listesinde gördü, isnat edilmeyen saldırının dosyasında adını bulmadı ve teması kaldırınca adın ekrandan kaybolduğunu doğruladı. Kimlik numarası kontrolü duruyor. Doğrudan 127/0. [Ham günlük](evidence/test-fail-kok0/dogrudan/son-odak/faz86a_intel_command_center.log.gz)

| Açık küme | İlk tam adayın bulgusu | Ürün riski |
|---|---|---|
| `faz85e`, `faz86b` | Eski kart ve modal kancaları, eski bildirim üst sınırı ve aynı fikstürde zincirlenen saflık kontrolleri. Güncel statüko ve teklif kimliği ile gerçek işlem matrisi ayrı geçti. | Başarısız her assertion tek başına değerlendirilene kadar kanıt eksik. |
| `faz95c1_diplomacy`, `faz96e_federation` | Eski doğrudan insan kuruluşu ve üyelik ön ittifakı varsayımları. Üye rızalı kuruluş, bekleyen gündem ve açık oy güncel testlerde geçti. | Bu iddialarda yeni ürün kusuru tekrar üretilmedi. |
| `faz96c2`, `faz96h10`, `faz96h31`, `faz96h9`, `faz96h8` | İlgili satırlarda eski çalışma zamanı bayt sabitlemeleri. `faz96h8` ayrıca doğal filo sonucu beklentisi içeriyor. | Sabitlemeler arşiv kökleriyle doğrulanmalı. Tarihsel doğal sonuç nedensel karşılaştırma gerektirir. |
| `faz96f3` | 2370. gündeki tek tarihsel AI sökümünün mutlaka tekrar etmesi bekleniyor. | Sökümün farklılaşma nedeni bu fazda yalıtılmadı. |
| `beta_fed_found0_events`, `faz86e`, `faz95e_news` | Anomali metni, mobil tema şablonu ve iki ayrı barış kaydı beklentileri. | Açıklama, tema ve kullanıcıya gösterilen olay kanıtları eksik. |
| `faz86c_3_ai_negotiation` | Entegre koşuda tek işlem için tarihsel 20 ms sınırı aşıldı. | Sınır korunuyor. Tek işlem karşılaştırması ve Save8 tabanlı tam ay ABBA ayrı değerlendirilir. |
