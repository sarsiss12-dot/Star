# STARS — BETA-SCALE.0 sonuç raporu

**Sonuç: #37 yerel kabul PASS; #45 kısmî teslim.** Yeni oyun için **500 sistem / 16 AI** açıldı. **1000 sistem ve 24/32/48 AI uzun kabulü geçmedi; kapalı tutuldu.** Büyük galaksi çalışıyor fakat yüksek hızda takılma riski sürüyor. Kullanıcı/yayın onayı verilmiş sayılmaz.

## 1. Kanonik kaynak, HEAD ve GitHub

- Başlangıç dalı/PR tabanı: `codex/stars-beta-setup1-galaxy-options`.
- Başlangıç HEAD: `66ea8d700bc66b1fdb5f75d3a0f5d8f87251e9a8`; uzak dal yeniden kontrolünde de aynıydı.
- Geliştirme dalı: `codex/stars-beta-scale0-galaxy-ai-colonies`.
- **Doğrulanmış kod/test/paket bitiş HEAD:** `fcb14ddd20f1ca41691487518c8f196b9e8e804c` ([commit](https://github.com/sarsiss12-dot/Star/commit/fcb14ddd20f1ca41691487518c8f196b9e8e804c)); push sonrası `ls-remote` ile doğrulandı.
- Bu rapor, kendi SHA'sını önceden bilemeyeceği için doğrulanmış kod commit'ini referans alır. Son rapor commit SHA'sı son sohbet mesajında ve uzak dalın HEAD'inde verilir; yalnız SHA eklemek için yeni commit üretilmez.
- Taslak PR **bir kez denendi, oluşturulamadı**: `Post "https://api.github.com/graphql": Forbidden` ([gerçek hata](evidence/beta-scale0/pr-create.log)). [Doğru karşılaştırma / PR oluşturma](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-setup1-galaxy-options...codex/stars-beta-scale0-galaxy-ai-colonies?expand=1).
- `main` üzerinden başlanmadı; merge/rebase/force-push, Render bağlantısı/deploy/restart veya ortam/izin yapılandırması değişikliği yapılmadı.

## 2. Gerçek sistem ve AI sınırları

Eski 30/45/60/80/100 anahtarları/değerleri korundu. Yeni basamaklar 125/150/175/200/225/250/275/300/350/400/450/500; −/+ tersinir, sayılar sessizce düşürülmez. 1000 hızlı seçimi deneysel etiketiyle pasiftir. Android için 100 sistem/9 AI yalnız tavsiyedir; aynı menüde 200/300/500 seçimi engellenmez.

`MAX_AI_COUNT=48` teknik araştırma tavanıdır; **yeni oyun kabul filtresi `SCALE_ACCEPTANCE.maxAI=16`**. 24/32/48 seçenekleri pasif, motor/lobi başlangıcı açık gerekçeyle reddeder. Seçilmiş değer başka değere gizlice çevrilmez. 30/48 gibi başkent sayısı sığmayan yapılandırma istenen açık uyarıyı verir. AI ve sistem sayısı bağımsızdır; 300/9 ve 500/16 örnekleri üretilir.

| Hedef | Gerçek üretim/topoloji | Oyun/performans sonucu | Bu sürümde durum |
|---|---|---|---|
|100/9 ve 100/11|PASS; kontrol boyutları|İlk 5 ay/çizim ölçüldü; eski kaynak başlangıçları aynı|Açık|
|200/16|PASS|Chromium 120 ay PASS; Save8 yükleme PASS|Açık|
|300/24|PASS|120 aya ulaştı; 240 hedefi 181. ayda 16,425 sn adımla **FAIL**|300 sistem açık, 24 AI kapalı; en fazla 16 AI|
|500/32|PASS|77 ay ölçülüp ekonomik bütçeyle durduruldu; 120 ay **NOT RUN**. Native araştırmada da yavaşlama görüldü|500 sistem açık, 32 AI kapalı|
|500/16|PASS|**Son motorla 120 ay PASS**, iki bağımsız 120→121 devamında ham Save8/RNG PASS|Açık; yüksek hız uyarılı|
|1000/48|Araştırma fikstüründe PASS|10. ay adımı 15,246 sn; kısa hedefte dahi **FAIL**|İkisi de kapalı|
|64 AI|Araştırmada üretildi|65 normal+wild=66 devlet; mevcut 0–63 ID uzayına sığmaz|**FAIL**, açılmadı|

**En fazla üretilen 1000 sistemdir; oynanış kabulü verilmiş üst sistem sayısı 500, uzun doğrulanmış AI sayısı 16'dır.** 48 AI yalnız ilk üretim/kısa simülasyon gördü; uzun kampanya başarısı değildir.

Beş seed 11/23/42/99/404 × sarmal/halka/küme × yedi kombinasyon = 105 üretim; 12 ara basamak; 25 eski 30–100 başlangıç ham Save8/RNG karşılaştırması: **142/0 PASS**. Gerçek sistem/AI sayısı, bağlantılı hiper-yollar, ayrı başkentler ve benzersiz isim/ID/renkler kontrol edildi. [Üretim JSON](evidence/beta-scale0/native/beta-scale0-generation/results.json).

Geniş AI aralığında palet RNG çekmeden uzatılır. 16 AI+elle seçilen eski palet rengi önce 17 devlette 16 renk üretti (**FAIL**); >11 AI yolunda bütün insan renkleri havuzdan ayrıldı. [Son 8 renk testi PASS](evidence/beta-scale0/colors-verified/results.json). Özel renk düzeltmesinin farkları yalnız renk/amblem alanlarıdır; stratejik alanlar/RNG/harita/isimler aynı. Renk seçilmemiş 500/16 başlangıcının tam Save8'i de önceki adayla aynıdır. Eski<=11 başlangıçları ve kayıtlar yeniden renklendirilmez; miras özel renk davranışı değiştirilmedi.

## 3. PC performansı: ölçüm koşulları ve sınırlar

Node 24.22.1, Chromium 155.0.8059.79, Playwright 1.62.1; masaüstü 1920×1080, CPU 1×. Testler sırayla çalıştı. Aşağıdaki ilk tablo seed 404, ilk 5 ayda **yalnız `monthTick`** ölçer; günlük uçuş/keşif maliyetini içermez. Çizim için açıkça bütün haritayı bilinir yapan, kamerayı sığdıran ayrı fikstür kullanıldı. rAF/s **fiziksel FPS değildir** ve bu değerlerden cihaz performansı garantisi çıkarılmaz.

| Sistem |AI|Kurulum ms|monthTick medyan/p95 ms (n=5)|Bilinen harita rAF/s|JS heap MiB|Seçim|
|---|---|---|---|---|---|---|
| 100 | 9 | 84,7 | 54,9 / 110,3 | 37,4 | 14,0 | Açık |
| 100 | 11 | 160,4 | 60,0 / 150,7 | 33,9 | 14,2 | Açık |
| 200 | 16 | 153,0 | 73,7 / 202,0 | 17,0 | 14,7 | Açık |
| 300 | 24 | 229,8 | 175,5 / 384,4 | 35,6 | 25,0 | Araştırma, kapalı |
| 500 | 16 | 332,6 | 183,1 / 385,0 | 36,2 | 22,4 | Açık |
| 500 | 32 | 321,4 | 333,0 / 593,2 | 34,9 | 25,1 | Araştırma, kapalı |
| 1000 | 48 | 1.140,0 | 1.445,6 / 2.036,4 | 29,9 | 34,0 | Araştırma, kapalı |

[İlk ölçümlerin örnek sayıları, çizim/kare aralıkları ve hatalar](evidence/beta-scale0/benchmark-final/results.json). Sıfır örnek PASS sayılmadı. Headless zamanlaması ve harita/kamera koşulları nedeniyle değerler monoton değil; sayıları fiziksel PC karşılaştırması gibi yorumlamayın.

120. ay kayıtları seed 11 ile temiz Chromium oturumlarında açıldı; ikinci tablo ilk normal görünümün `View.draw` maliyetini ve sonra ölçülen 5 aylık monthTick'i gösterir. 200 kaydı 120,025 ay; 500 kaydı tam 120 aydır.

| Sistem/AI|View. draw medyan/p95 ms|Çizim örneği|rAF/s|monthTick medyan/p95 ms (n=5)|JS heap MiB|Tüm test Chromium RSS MiB|
|---|---|---|---|---|---|---|---|
| 200/16 | 2,0 / 6,7 | 68 | 30,1 | 458,1 / 627,7 | 44,4 | 979,0 |
| 500/16 | 2,6 / 12,9 | 56 | 24,8 | 1.030,5 / 1.312,4 | 83,1 | 968,7 |

[120.ay ölçümleri](evidence/beta-scale0/benchmark-late/results.json). RSS tüm test tarayıcısı süreçlerini/çizim tahsislerini içerir; yalnız STARS simülasyon RAM'i değildir. Duraklatılmış görünümün rAF ölçümü aktif oyun FPS'si değildir. 500/16 normal görünüm kare aralığı p95≈133 ms olduğundan takılma riski açıktır.

**Gerçek tam ay ilerletme:**500/16, seed 11,0→120; her ay 60 yarım günlük adımda `dailyTick`, `structTick`, `colonyBuildTick`, `autoExploreTick`, `monthTick` çalıştı. n=120, medyan **2.533,7 ms**,p95 **3.555,6 ms**, maksimum **4.362,7 ms**. 120. ayda 70 koloni, 166 filo, 15 yaşayan AI, bir AI'nın meşru elenmesi, 2 savaş kaydı/2 federasyon; Save8 **1.752.309 bayt**. [Son kampanya](evidence/beta-scale0/final-campaign/results.json).

Bu, 500/16'nın yüksek hızda akıcı olduğu anlamına gelmez. 240 ay kabulü **NOT RUN**; 300/24'ün 240 ay denemesi başarısızdır. Fiziksel PC/Android FPS ölçülmedi.

**İstatistik yöntemi:** Süre tablolarındaki çift sayılı tam-ay örneklerinde standart medyan (iki orta örneğin ortalaması), p95 için en yakın üst sıra kullanıldı. İlk ham JSON'ların `median` alanı üst orta örneği seçiyordu; ham örnekler değiştirilmeden [standart özet](evidence/beta-scale0/PERFORMANCE-SUMMARY.json) üretildi. Çizim/kare tabloları yalnız aracın sakladığı yaklaşık p50 değerini verir.

## 4. Darboğazlar ve kabul edilen optimizasyon

CPU profilleri `supplyDistance`, `reinforcementThreats`, `claimOf`/`influenceAt`, keşif bağlamı ve `txCaptureGraph` maliyetlerini öne çıkardı. Günlük/keşif taramaları tam ay maliyetinde önemlidir; yalnız monthTick rakamı yeterli değildir. [İlk profil](evidence/beta-scale0/profile-before/hot.json), [30.ay profili](evidence/beta-scale0/late-hot.json).

İlk adayda görünmeyen sistemler `claimOf` öncesi atlandı. Kısa native örnekler geçse de gerçek Chromium 31. ayda kaydedilmiş `_powAt/_pressAt/_powC/_press` alanları farklılaştı. RNG aynıydı; yine de Save8 şartını karşılamadı. **Aday geri alındı**; alan silinmedi/normalize edilmedi, serializer değiştirilmedi. [Ham fark ve iki kayıt](evidence/beta-scale0/compare-fields/200-diff.json).

Kalan tek optimizasyon: **aynı mevcut keşif bağlamının ömrü içinde** ikmal düğümü sonucunu tembel saklamak. Gün/oyun geneline taşınmaz; her yeni eylem/bağlam tazedir. AI stratejisi ve gizlilik kuralları değişmez. Aynı 30. ay Save8, aynı yeni özellik kuralları, aynı Chromium/ekran/CPU ile:

| Sistem/AI|Kontrol medyan/p95 ms|Aday medyan/p95 ms|Tam ay örneği|Her ay ham Save8/RNG|
|---|---|---|---|---|
| 200/16 | 806,3 / 1.011,5 | 606,8 / 842,8 | 10 + 10 | PASS |
| 300/24 | 1.486,4 / 1.876,1 | 1.416,2 / 2.284,7 | 10 + 10 | PASS |
| 500/32 | 6.918,3 / 8.311,5 | 4.692,7 / 5.222,5 | 10 + 10 | PASS |

[Kontrol–aday](evidence/beta-scale0/compare-supply-only/results.json). Aynı kontrol koduyla A/A medyanı 746,9→1066,2 ms oynadı. 500/32 ters sıra üç aylık tekrarında 5662,9→5293,6 ms görülürken `isSupplyNode` çağrıları **1.205.803→230.285, yaklaşık %80,9 azaldı**; ham Save8/RNG yine eşit. [Ters sıra](evidence/beta-scale0/compare-reverse/results.json).

İlk çiftte görülen %24,7/%4,7/%32,2 medyan farkları **kararlı/genellenebilir hızlanma yüzdesi olarak kabul edilmez**; A/A oynaklığı ve ters sırada daha küçük fark vardır. Kanıtlanan kazanım, tekrarlı iş sayısının azalmasıdır. Görsel FPS artışı iddia edilmez. PERF.1/PERF.2 ve MP.8.6 önbelleği korundu.

## 5. Koloni otomasyonu: gerçek davranış

Kullanıcının çalışma sırasında verdiği açık karar uygulandı: **başlangıç/anavatan/köken kolonilerinin mevcut düzeni korunur; yalnız sonradan kurulan veya el değiştiren koloniler ON olur.** Eski Save8 kayıtları topluca açılmaz.

- `doColonize`/`buildHabitat`: yeni koloni `auto=true`, `autoAfter=G.day+60`.
- Gerçek `territoryOwnerSet` sahip değişimi: yeni sahibin ON+60 varsayılanı; aynı sahibin tekrar yazımı manuel OFF'u/deadline'ı bozmaz. Başlangıç kurulumunda ve deserialize işlemi sırasında uygulanmaz.
- İlk 60 gün otomatik yeni bina siparişi yok; mevcut aylık değerlendirmede ilk uygun sipariş 60–90 günde açılır. AI bina turu da beklemeyi atlamaz. Mevcut manuel kuyruk korunur/ilerler; oyuncu manuel bina yapabilir.
- Odak yoksa temel sanayi planı seçilir, `col.f` ve ekonomik bonus değiştirilmez. Kaynak tabanları, teknoloji/slot/maxbina ve gerçek `queueBuilding` ödeme kapıları korunur.
- Otomasyon OFF'u ay sonunda yeniden açılmaz; aktifON veOFF yüklemesinde mutlak deadline korunur. Yeni sahiplik eski sahibin OFF tercihini devralmaz.
- UI: AÇIK/BEKLİYOR, kalan ay, sıradaki bina/kaynak gerekçesi, KAPALI/Manuel yönetim. Ayrı bir otomasyon motoru yok.

[12/0 koloni testi](evidence/beta-scale0/colony-final/results.json): insan/AI yeni koloni, çoklu fetih, gerçek ayrılık/yeniden fetih, manuel kuyruk, odaksız plan, kaynak yokluğu/geri gelişi, iki kez kesilmeyen ücret, AI 60 gün koruması, başlangıç ve eski kayıtların korunması, aktifON/OFF Save8.

## 6. Multiplayer, Save8 ve RNG

- **500 sistem+16 AI+3 insan**, gerçek yerelTLS/WS, ayrı Chromium/profiller: R0–R4 **5/0 PASS**. 6 ay→gerçek IndexedDB kaydı→bütün tarayıcı/relay süreçleri kapanır→yeni relay/oda→eski devletler→bekleyen teklif yalnız bir kez kabul→6 ay daha. Savaş/federasyon/diplomasi/vasallık kayıtları ve host/misafir ayna eşitliği/gizlilik kontrol edildi. [R kanıtı](evidence/beta-scale0/mp8-large/R/mp8-R.json).
- Gerçek WebSocket kolonizasyonundan sonra misafir gerçek dokunmayla otomasyonu kapattı. Host'ta OFF/deadline görüldü; R3 yeniden yüklemede aynı kaldı. Başka oyuncunun kolonisine `colAuto` komutu **not-owner** ile reddedildi. [Komut/ayar kanıtı](evidence/beta-scale0/mp8-large/R/scale0-colony.json).
- Lobi insan/AI sayısı ayrı; motorun ilave koltuk hesabı sessiz AI silmez. Tasarım lobisi insan kapasitesi 2–4 değişmedi. Kamu üst sınırı 16 AI; teknik 49 normal/0–63 ID kapıları korunur. Araştırmada 3 insan + 46 AI+wild=50 toplam/ID 0–49, paket/ayna PASS; bu 46 AI uzun kabulü değildir.
- Gerçek araştırma aynası 282.184 UTF 8 bayt/eski 262.144 karakter sınırını aştı. Host mesaj sınırı 524.288 karakter; **8 MiB/s+8 MiB burst** byte bütçesi eklendi. İstemci 8.192 karakter, ham host çerçevesi 1 MiB, Origin/kimlik/oda kapıları korunur. Gerçek büyük ileti, büyük istemci/host reddi ve byte bütçesi reddi test edildi.
- **Save8 v8, paket 4, protokol 1** korunur. `autoAfter`, mevcut koloni nesnesindeki geriye uyumlu opsiyonel alandır; eski kayıtların eksik alanı zorla yeni kurala çevrilmez. Gerçek p11 paket/Save8 yükleme ve bozuk bütünlük reddi PASS.
- Eski 30–100 başlangıç baytları/RNG aynı. Son 500/16 m 120 kaydından aynı son kodla iki bağımsız 120→121 devamında **tam Save8/RNG aynı** ([kanıt](evidence/beta-scale0/late-repeat/results.json)).
- İsimler ve RNG'nin kozmik/stratejik akışı doğrudan değiştirilmedi. Yeni istenen otomatik sipariş/bekleme kuralı gelecekteki harcama ve AI kararlarını doğal olarak etkileyebilir; eski kurallarla bütün gelecek oyunun byte eşitliği iddia edilmez. Performans kıyaslarında iki kolda aynı yeni kurallar zorunludur.

## 7. PASS / FAIL / NOT RUN ve ilk hatalar

| Kontrol | Gerçek son durum |
|---|---|
|Üretim/topoloji/basamak/eski başlangıç|**PASS 142/0**; ek sınır 5/0|
|Yeni/fethedilen/ayrılan koloni/Save8/ödeme|**PASS 12/0**|
|Geniş AI özel renk|**PASS 8/0**; önce 17 devlette 16 renk FAIL korunur|
|SP 500/16 tam 120 ay ve bağımsız geç devam|**PASS**|
|MP500/16/3 insan R0–R4|**PASS 5/0**|
|MP8 N kopma/kurtarma|**PASS 9/0**|
|MP74 A1/A4/A5/B1 dahil|**PASS 7/0**; tarihsel aralıklı hatalar kesin kapandı denmez|
|MP75, A3 savaş/barış dahil|**PASS 6/0**; tarihsel A3 aralıklılığı kesin kapandı denmez|
|MP73 yalnız A1 sürüm/yetki/kamu UI|**PASS 1/0**; B1–B 4 tam kampanya bu fazda **NOT RUN**|
|İsim/korsan/kapı-kriz|**PASS 9/0,10/0,12/0**|
|Konsey/otomatik barış/ambargo|**PASS 3/0,5/0,5/0**|
|Haber kimliği/dönüş|**PASS 8/0+3/0**|
|Ayna gizliliği/MP4/Save8 sınır|**PASS 8/0,14/0,19/0**|
|MP7 lobi|**PASS 7/0**|
|PERF.1/PERF.2/MP86 piksel|**PASS 4/0,5/0,3/0**|
|UI PC 1920×1080, mobil 800×360/960×540|**PASS 3/0**; gerçek fare/dokunma, UI Scale 80/100/125 (mobil 100), Save8/RNG/kamera korunur|
|MP1 relay/MP5 güvenlik/ek büyük ileti|**PASS 14/0,13/0,5 kontrol**|
|Son ZIP/manifest/çıkarılmış runtime|**PASS**|
|1000/48 uzun oynanış|**FAIL**, kapalı|
|300/24 240 ay|**FAIL**,24 AI kapalı|
|500/32 120 ay, diğer 240 aylar|**NOT RUN**, yüksek AI kapalı|
|64 AI güvenli kimlik kapasitesi|**FAIL**, açılmadı|
|Fiziksel Android/PC kabulü, gerçekLAN/internet/Render, Docker build/deploy|**NOT RUN**|

İlk FAIL'ler silinmedi:

1. Erken görünürlük atlaması Save8 önbelleklerini değiştirdi; geri alındı. Son optimizasyonda 30 ay ham eşitlik ve ters tekrar PASS.
2. PERF.2 ilk 4/1 FAIL: eski kontrol, yeni koloninin 1927,5 gün deadline'ı dururken 1890 günde liman siparişi/180 mineral harcaması yapıyordu. Arındırma kontrol AI'sından yeni bekleme kuralını çıkarıyordu. Kontrol artık **yalnız P2A/B'yi** geri alır; iki kolda güncel özellikler aynıdır. Tarihsel kaynak hashleri, her ay ham Save8/RNG, karar sayısı assertion'ları korunur; son 5/0 PASS. [Alan farkları/açıklama](evidence/beta-scale0/PERF2-FIXTURE.md).
3. MP1 ilk 13/1 FAIL: UI açıklaması değişince manifest SHA güncel değildi; manifest güncellendi, aynı assertion'la 14/0 PASS.
4. İlk ölçümde modal kapatmanın önceki hızı geri getirmesi saptandı; koşu durduruldu. Son ölçüm ilk frame öncesi durur, her adım hız 0 doğrular. Kaynakların zamanaşımı artırılmadı; force/JS sahte click kullanılmadı.
5. `components()` erişimi, tanı betiği yazımı, ZIP CLI `--root`, sandbox `git EPERM` ve bir otomatik onay kullanım sınırı hatası ayrı komut/ortam kayıtlarıdır; ürün başarısı gibi sayılmadı. [Komut hataları](evidence/beta-scale0/COMMAND-ERRORS.md).

## 8. Değişen dosyalar ve paket

Runtime: `main.js` (boyut/doğrulama/palet/ikmal/gerçek sahiplik), `economy.js` (koloni başlatma/deadline/mevcut plan), `ai.js` (yeni koloni bina beklemesi), `ui.js` (ortak sayaçlar/uyarı/otomasyon durumu), `sw.js`; MPçekirdek, host, view, relay ve ortak MP7 kurulum istemcisi. Yeni teknik alan misafire yalnız kendi kolonisinde gider; ayna beyaz listesi gevşetilmedi. Konsey/haber/federasyon/vasallık/savaş denklemleri yeniden yazılmadı.

Testler: hedefli SCALE testleri ve kanıtlar; MP8'e isteğe bağlı büyük yapılandırma/koloni kontrolü; yeni sürüm/sınır assertion'ları; tam eski SHA'yı geri kuran incelenmiş koruma hunks. `CLAUDE.md` ve bu rapor/pointer güncellendi.

- Oyun **96h10p12**, PWA **stars-v96h10p12**, MP **MP.8.9b7**.
- ZIP: [stars-faz96h10p12.zip](../../releases/stars-faz96h10p12.zip), **787.216 bayt**,19 oyun dosyası+manifest=20 üye.
- ZIP SH A2 56: `09f8a58c16380d0eae0a187dcd9b259597fb4b5d5b750296b427446cfe35a365`.
- ZIP bütün dosya CRC 32: `E1ABA448`; bütün üye CRC'leri PASS.
- Manifest SH A2 56: `3ce01799c7306e80b6335209ef7cad3b9085c2da1b8538138d6fc13b188ee007`.
- İki bağımsız deterministik üretim bayt bayt aynı; çıkarılan paket doğrulandı ve 200/16 özel renk/Save8/RNG smoke testi PASS.
- Değişen **bütün runtime dosyalarının eski/yeni SH A2 56** ve her ZIP üyesi SHA/CRC'si: [RELEASE-VERIFIED](evidence/beta-scale0/RELEASE-VERIFIED.json). Önceki sürümler silinmedi; eski yayımlanmamış p12 aday paketi kanıtlarda ayrı tutulur.
- ZIP oyun paketidir; MP sunucusu GitHubdosyaları/Docker allowlist üzerinden ayrı dağıtılır. Docker COPY listesi ilgili dosyaları kapsar; Docker çalıştırma/deploy **NOT RUN**.

## 9. Görev panosu, kalan sorunlar ve kullanıcı kabulü

Kapsam yalnız [#33 panosundaki#45+#37](https://github.com/sarsiss12-dot/Star/issues/33). Başlangıç ve sonuç yorumları denendi; ikisi de `Forbidden` verdi. Gerçek hata dosyaları `issue33-start.log` ve `issue33-final.log`. **Panoya yazılmış gibi gösterilmiyor**: son başarılı kamu okumasında iki görev de **PROMPT HAZIR**; bu çalışmanın ajana teslim/geliştirme/rapor aşamaları GitHub'a yazılamadı. Önerilen kayıt #37 RAPOR GELDİ/TEST BEKLİYOR; #45 RAPOR GELDİ/TEST BEKLİYOR(kısmî). Diğer 43 göreve dokunulmadı; hiçbir görev TAMAMLANDI yapılmadı.

Açık kalanlar:

-24/32/48 AI ve 1000 sistem uzun performansı/240 ay; yüksek hızda uzun görevler. Üretimden geçmiş olmaları yeterli sayılmadı.
-500 MP için gerçek yerel 12 ay doğrulandı; 120/240 ay gerçek ağ kampanyası ve çok sayıda kendi kolonisinin oluşturduğu çok büyük snapshotlar ayrıca stres ister. Mevcut 1 MiB çerçeve/30–32 MB kayıt sınırları korunur, sınırsız büyüme garantisi yok.
-Miras<=11 AI özel renk yolu bayt koruması için değişmedi; eski kayıt renkleri otomatik onarılmaz.
-Tarihsel B1/A3 aralıklılığı; #25 düşmansız büyük filo kaybı, #24 enerji stok sapması, #10 MP hız sorunu ayrı açık görevlerdir. İlgili genel regresyonlar geçti; bu görevlerin kök nedenleri bu fazda çözülmüş sayılmadı.
-Fiziksel Android/PC ve canlı ağ kabulü yok. Önceden açık bildirim kalıcılığı vb. ilgisiz işler değiştirilmedi.

Kullanıcı PC kabulü: p12 ZIP'ini açıp önce 200/16 seed 11, sonra 500/16 deneyin; ortak menüde sayıları/değerin korunmasını, yeni kolonide ON+2 ay beklemeyi, bütçeyle tek siparişi, manuelOFF→kaydet/yükle ve fetih sonrası yeni sahibin ON olmasını kontrol edin. Anavatanın eski düzenini koruduğunu doğrulayın. Gerçek MP cihaz kabulü aynı MP.8.9b7 sunucu sürümüyle ayrı yapılmalı; bu fazda canlı servis değiştirilmedi. Telefonda 100/9 tavsiye aralığıyla dokunma/scroll ve eski Save8 yüklemeyi deneyin. Hata kaydında görünen sürüm, seed, sistem/AI sayısı, oyun ayı, host/misafir ve ekran görüntüsü yeterlidir; terminal zorunlu değildir.

## 10. Sonraki tek geliştirme fazı

**BETA-SCALE.1: geç oyun günlük keşif/ikmal/sınır hesaplarının profil ve eşdeğerlik odaklı ölçeklenmesi.** Önce mevcut 120. ay kayıtlarıyla tekrar profilleyin; eski görünürlük-atlama hatasını tekrarlamadan `claimOf`/`influenceAt`, keşif bağlamı ve transactiongraph maliyetini ayırın. Aynı Save8/RNG ile anlamlı kazanım ve 240 ay kabulü sağlanmadan 24/32/48 AI veya 1000 seçeneğini açmayın. Yeni AI stratejisi/mekanik ya da bu faza ilgisiz sistem eklemeyin.

**Nihai teslim kullanıcı onayı bekler; yayımlandı veya tüm hedefler tamamlandı denmez.**
