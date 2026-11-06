# MP.8.9 — Beta hazırlığı: kayıt/devam, PC UI Scale ve açık işler

## Sonuç

**Yerel kayıt/devam kabulü PASS:** üç insan + beş AI, seed11, orta galaksi, 6+6 ay; dolu savaş/federasyon/vasallık kayıtlarıyla iki bağımsız temiz R0–R4 koşusu geçti. Misafir UI Scale ve yalıtım kabulü de geçti. **Beta yayın onayı verilmez:** eski aralıklı menü timeout'unun kesin kökü açık; gerçek cihaz/LAN/online kabulü bu fazda yapılmadı.

Önceki MP.8.9 kodu ve kanıtları kurtarıldı; yeniden yazılmadı. Yeni büyük sistem veya P2 özellik eklenmedi. [Dört issue envanteri](BETA-ACIK-ISLER.md), [manuel PC/Android kabul planı](MP89-MANUEL-BETA-PLANI.md).

## 1. GitHub kaynağı, kurtarma ve HEAD

- 2026-11-06 GitHub dal kontrolünde MP.8.9 ve MP.8.10 yoktu; MP.8.8 uzak HEAD **`8ce738b42636cd792a8d552230ca8194a4da053f`** beklenenle aynıydı. Fetch edildi. [Kontrol kaydı](evidence/mp89/recovery/branches.json).
- Başlangıç/PR tabanı **`codex/stars-mp88-stability`**; kurtarılan yerel geliştirme dalı **`codex/stars-mp89-pc-ui-stability`**. Yerelde runtime, testler, yaklaşık önceki ekran matrisi ve loglar vardı; varlığı kontrol edilmeden varsayılmadı.
- Önceki kesintide R-populated1 R4'e ulaşmış, ek UI sırasında durmuştu; sonuç JSON'u/çıkışı yoktu. Tamamlanmış koşu sayılmadı. R-populated2 yoktu; çalışmış gibi gösterilmedi.
- Kurtarma kodu/ilk rapor/kanıt commit'i **`5210281c46afc3b38048ead53a7399625e340b35`** GitHub'a push edildi; [uzak HEAD aynı](evidence/mp89/recovery/checkpoint-remote-head.txt). Son kabul/ZIP/rapor bu teslim üzerine eklenir.
- Son rapor commit'i kendi SHA'sını önceden içeremez. Gövdedeki doğrulanmış bitiş referansı yukarıdaki teslimdir; nihai HEAD son sohbet mesajında ve bu dosyanın GitHub commit geçmişinde bulunur. SHA eklemek için sonsuz commit zinciri üretilmez.
- `main` değiştirilmedi. Merge, rebase veya force-push yapılmadı.

## 2. Belgeler, ortam ve sınırlar

AGENTS, GPT-DEVIR, CLAUDE, son rapor; MP.8.8/R6 ham kanıtı, MP.8.7 ve MP.8.6 performans raporları esas alındı. Eski performans araştırmaları/kampanyaları tekrar edilmedi.

Node24.22.1, Chromium155.0.8059.79 (`/usr/bin/chromium`), Playwright1.62.1, native Canvas0.1.100. Mevcut bağımlılıklar kullanıldı. Gerçek yerel üretim relay süreci, parçalı TLS vekili, oyuncu başına ayrı Chromium/kalıcı profil ve gerçek STARS misafir arayüzü kullanıldı. Chromium koşuları sıralıydı; kaynak veya timeout artırılmadı.

**Render ve fiziksel Android NOT RUN.** Gerçek LAN/Wi-Fi, fiziksel PC'de insanla manuel kabul, tarayıcı Ctrl± zoom, diğer tarayıcılar ve Node22 Docker imajı çalıştırması NOT RUN. Ağ/kimlik ayarı değiştirilmedi; yeni environment oluşturulmadı; deploy/restart yok. Yerel `/healthz` ve `/mp/version` kontrolleri canlı Render sonucu değildir.

## 3. R3/R4: ham hata, tanı ve güvenli karar

MP.8.8 raporu ile ham R6 kaydı uyuşmuyor: ham hata **`locator.tap: Timeout 10000ms exceeded`**, görünür/etkin/kararlı hedef ve kaydırma tamamlandıktan sonra **`performing tap action`** aşamasında. Önceki metindeki8s/kararlılık açıklaması kök neden kabul edilmedi. Bu hata Save8 yükleme kusuru kanıtı değildi; R4 eksik R3 kurulumundan etkileniyordu.

Menü tanısı ilk ardışık rAF kareleri/sonraki örnekler, rect, DOM kimliği/ömrü, üzerindeki hedef, animasyon, gerçek pointer/touch/click ve ekran durumunu Node dosyasına saklar; orijinal Playwright hatası ve hata ekranı korunur. Ayrı protokol filtresi yalnız Input.dispatchTouchEvent gönderim/yanıtlarını tutar. [Yardımcı](../../tests/helpers/mp89-menu-diag.cjs), [başlangıç protokol kaydı](evidence/mp89/R-baseline-protocol.jsonl).

Ürün değişmeden tanılı başlangıç R5/0 ve dört yeni-süreç 4× CPU menü probu4/0 geçti. Eski hedefe yanlış dokunma, overlay veya animasyonun hatayı başlattığı kanıtlanmadı. **Orijinal #mp1Btn timeout kökü AÇIK; kalıcı çözüm iddiası yok.** Kanıtsız menü/AI/serializer düzeltmesi yapılmadı.

Testte kanıtlı kapsam hataları sıkılaştırıldı: R3 tamamlanmadan R4 PASS olamaz; bekleyen insan teklifinin gerçekten oluşması gerekir; test adı gerçek ay sayısını gösterir. Force, JavaScript click, hata yutma veya timeout artırımı kullanılmadı.

## 4. Güçlü kayıt/devam kabulü

İlk temiz R tekrarları kayıt anında boş savaş/federasyon alanları içeriyordu. Boş eşitlik dolu veri korunumu sayılmadı. `MP89_R_STATE=1` açık fikstürü altıncı ayda mevcut MP.4 normalize federasyon biçimini, motorun savaş yolunu ve `subjugate` yolunu kullanarak dolu veriyi hazırlar. Bu, doğal AI'nın altı ayda bu durumları üretmesi iddiası değildir; test önkoşuludur. Save8 şeması/AI stratejisi değiştirilmez.

Son iki koşuda: insanlar0/1/2, beş AI; federasyon1 üyeleri0/1; savaş3→0; vasal4→senyör0 (`haracguzar`). İki oturum ayrı profiller/relay ve tamamen yeni süreçlerle yürütüldü. [Fikstür](../../tests/helpers/mp89-resume-fixture.cjs).

| Kabul | beta-R1 | beta-R2 |
|---|---|---|
| R0 gerçek lobi, üç insan/beş AI/seed11/orta | PASS | PASS |
| R1 ilk6 ay, dolu siyaset ve bekleyen C→B teklif | PASS | PASS |
| R2 gerçek IndexedDB kaydı, kimlikler, tüm süreçlerin kapanması | PASS | PASS |
| R3 yeni süreç/yeni oda, aynı devletler ve siyasi kayıtlar | PASS | PASS |
| R4 teklif bir kez uygulanır, ikinci kabul reddedilir,6 ay daha | PASS | PASS |
| Ek misafir UI89 kabulü | PASS | NOT RUN — ayrı tekrar gereksiz |
| Toplam | **6/0** | **5/0** |

[Koşu1 JSON](evidence/mp89/beta-R1/R/mp8-R.json), [koşu2 JSON](evidence/mp89/beta-R2/R/mp8-R.json), [çıkışlar](evidence/mp89/beta-exits.json).

R3'te yalnız özetler değil **tam teklif deposu, Save8 federasyon kayıtları, savaş günlüğü ve devletlerin savaş/ittifak/NAP/pakt/vasallık sözleşme alanları** karşılaştırıldı: iki koşuda `fullRecordsEqual=true`. [Önce/sonra1](evidence/mp89/beta-R1/R/resume-records.json), [önce/sonra2](evidence/mp89/beta-R2/R/resume-records.json). Alan silme/normalizasyonla fark gizlenmedi.

Her kontrol noktasında misafir aynası host'un gönderdiği rev/hash ile eşit; kendi devlet sahipliği/kaynak/koloni/filo/teknoloji/savaş kontrolleri ve yabancı kaynak/teknoloji/seed/RNG/jeton sızıntısı denetimleri geçti. İkinci teklif kabulü `rules:closed` ile reddedildi.

## 5. PC ekranları ve kullanılabilirlik

İlk tam matris **28/0 PASS**; gerçek Chromium masaüstü800 olmayan beş görünüm, mobil dokunmatik800×360 ve960×540. [JSON](evidence/mp89/ui-matrix/ui.json), [ekran dizini](evidence/mp89/EKRAN-INDEX.md), [ölçüm özeti](evidence/mp89/viewport-summary.json).

| Çözünürlük | Tür | Sistem/üretim sağ paneli %100 | %125 ayarlar boyutu |
|---|---|---:|---:|
|1280×720|Masaüstü|350px|900×696|
|1366×768|Masaüstü|350px|900×744|
|1920×1080|Masaüstü|422,4px|950×1056|
|2560×1440|Masaüstü|460px|950×1416|
|3440×1440|Masaüstü|460px|950×1416|
|800×360|Mobil dokunmatik|350px|Güvenli %100 sınırı|
|960×540|Mobil dokunmatik|350px|Güvenli %100 sınırı|

Panel genişliği bağlama göre değişir; üretim grid'i olmayan ekranlarda başka --sb değeri kullanılması hata sayılmadı. Harita tam viewport boyutundadır.

Menü/kurulum, harita/HUD/sağ-sol paneller, filo, teknoloji, diplomasi, federasyon, vasallık, casusluk, Konsey giriş/boş durumu, bildirim, üretim ve ayarlar incelendi. Lobi/tasarım görselleri de var. Federasyon ve siyaset ekranları açık test fikstürleriyle gösterildi; Konseyin bütün dolu içerikleri her ölçekte test edildiği iddia edilmez.

Gerçek fare ile yıldız/filo seçimi, sürükleme/tekerlek zoom, sağ tıklamanın seçim/komut değiştirmemesi, odak/Escape, pencere boyutlandırma ve lobi girişi geçti. Test edilen masaüstü yatay boyutlarında mobil çevir uyarısı yoktu. Büyük ekranda harita alanı geniş kalır; paneller sınırlı genişliktedir. Küçük varsayılan metinler kompakt kalır; daha büyük ölçek kullanıcı tercihidir. Fiziksel monitör okunabilirliği insanla ayrıca doğrulanmalıdır.

Son panel testi üst kaplamanın fade animasyonunu da bekler; ara kareyi son yerleşim saymaz.800 ve960 panelleri/kapanışları ayrı ayrı2/0,1280 %125 panelleri1/0 geçti. [Son ekranlar](evidence/mp89/panel-settled-exits.json). Örneğin1280 %125 ayarlar `[190,12,900,696]`; Canvas `[0,0,1280,720]`. Mobil %100 modalı ekrana sığar, içerik kaydırılabilir ve X erişilebilirdir.

## 6. UI Scale: uygulama, kabul ve sınırlar

Mevcut **Kayıt ve Ayarlar → Arayüz Ölçeği** içine80/90/100/110/120/125, eksi/artı, yüzde ve varsayılana dön eklendi. Anında uygulanır. `stars:uiScale` cihaz tercihidir; mevcut storeGet/storeSet kullanılır. Asenkron yazmalar FIFO sıraya alınır; gecikmiş ilk okumanın son kullanıcı seçimini ezmesi revision kontrolüyle engellenir. Save8'e veya multiplayer paketine alan eklenmez.

Native CSS zoom yalnız açıkça seçilmiş HUD/menü/panel adalarındadır. html/body/#app/#game/harita Canvas'ı ölçeklenmez; genel transform yok. Viewport sınırları, adaptif panel boyları ve JS ile konumlanan sol menünün fiziksel CSS birimleri ayrı ele alındı. Mevcut sanat/temel arayüz SP ve MP'de aynı; büyük CSS yeniden yazımı yapılmadı.

Küçük görünümde genişlik<1000 veya yükseklik<600 ise etkin ölçek100; desteklenmeyen değerler seçilemez, açıklama görünür. Daha büyük ekran tercihi resize sırasında saklanır. Bozuk/boş/engelli depo güvenli varsayılan100'e düşer; engelli depoda oturumlar arası kalıcılık vaat edilmez.

Son SP ve MP misafir testleri80/100/125'te gerçek harita/filo seçimi, diplomasi/X, sağ panel kapatma, açık panel/seçim korunumu, bütün +/- ara değerleri, reset, yenileme ve tercih kalıcılığını geçti. Tam Save8 metni/RNG/kamera değişmedi; Canvas rect viewport ile eşit kaldı. Misafirin tercihi host ve C'nin değerlerini değiştirmedi. [Misafir ölçek/hash örnekleri](evidence/mp89/beta-R1/R/guest1920-scales.json), [SP](evidence/mp89/scale-final/1280-scales.json), [depo üç alt senaryo PASS](evidence/mp89/beta-prefs/prefs.json).

Sınırlar: ayrı MP bağlantı/tanı doku kapsamlı ölçek dönüşümüne alınmadı; Ctrl± tarayıcı zoom ve diğer tarayıcılar NOT RUN. Destek bu test edilen Chromium/viewport/UI kapsamıyla sınırlıdır; bütün cihazlarda eksiksiz destek iddiası değildir.

## 7. Kanıtlanan düzeltmeler

1. %125 ayarlar yüksekliğinde eski masaüstü CSS önceliği taşmaya yol açıyordu; daha özel viewport sınırı eklendi. [Önce FAIL](evidence/mp89/modal-before.log), [son kabul](evidence/mp89/panel-settled125.log).
2. Sol açılır menü ekran koordinatının yerel zoom ile ikinci kez çarpılması, rect/hit alanını kaydırıyordu. Konum/boyut hesabına birim dönüşümü eklendi; açık menü ölçek değişiminde yeniden konumlanır. [Önce](evidence/mp89/flyout-before.log), [sonra](evidence/mp89/flyout-fixed.log).
3. Kontrollü yavaş cihaz deposunda125→80 seçiminin eski125 yazması sonradan kazanıyordu. Yazma sırası önce `[80,125]`, yanlış kayıt125; FIFO sonrası `[125,80]`, UI/kayıt80. [Önce FAIL](evidence/mp89/store-order-before/store-order.json), [sonra PASS](evidence/mp89/store-order-after/store-order.json).
4. Yeni test fikstürlerinde yanlış menü seçicisi, üst üste filo seçimi ve duraklama/snapshot düzeni düzeltildi. Resize olayını beklemeden okuma ve bozuk depo değerini her reload'da tekrar yazan fikstür de düzeltildi. Ürün hatası diye sunulmadılar; eski FAIL çıktıları saklandı.

## 8. PASS / FAIL / NOT RUN ve önceki hatalar

| Test / kapsam | Sonuç ve kanıt |
|---|---|
| Son iki temiz dolu-siyaset R | **PASS** R0–R4 iki kez; ilkinde ek UI PASS;6/0 ve5/0 |
| Son depo boş/bozuk/erişilemez | **PASS 3/0** |
| Asenkron depo sırası / son SP ölçek | **PASS 1/0 ve1/0** |
| Son800/960/1280 %125 paneller | **PASS 2/0,2/0,1/0** |
| MP8 N | Kurtarılan **PASS 9/0** [log](evidence/mp89/N.log) |
| MP74 / MP75 / MP73 | Kurtarılan **PASS 7/0,6/0,8/0** [74](evidence/mp89/mp74.log) · [75](evidence/mp89/mp75.log) · [73](evidence/mp89/mp73.log) |
| PERF1 / PERF2 | Kurtarılan **PASS 4/0 ve5/0** [1](evidence/mp89/perf1.log) · [2](evidence/mp89/perf2.log) |
| MP86 native / Chromium piksel | Kurtarılan **PASS 3/0 ve3 vaka** [native](evidence/mp89/cache.log) · [browser](evidence/mp89/browser-pixels.json) |
| MP88 host kayıt/ayna koruması | Kurtarılan **PASS 5/0** [log](evidence/mp89/host-hash.log) |
| Son kaynak sınırı / yerel sürüm / paket | **PASS** [kaynak](evidence/mp89/source-scope.json) · [sürüm](evidence/mp89/version-final.json) · [paket](evidence/mp89/package.json) |
| İlk menü/görüntü tekrarı | **FAIL 12/2**:3440 ölçek seçicisi bulunamadı;960 create eylemi timeout. Son tanılı tekrarlar2/0 ve2/0; kesin kök hâlâ açık. [ham](evidence/mp89/ui-retake.log) |
| İlk ek misafir UI | **FAIL** `.96` başlangıç dönüşümü ölçüldü; test artık open/opacity1/identity koşulunu bekler. Son UI PASS; eski FAIL silinmedi. [ham](evidence/mp89/R-final1.log) |
| İkinci başlangıç R | **FAIL 3/2**: misafir C Chromium açılışı180000ms timeout; R4 önkoşul FAIL. Menü/Save8 hatası diye sunulmaz. [ham](evidence/mp89/R-clean2.log) |
| Önceki ortam kesintisinde yarım R-populated1 | **ABORTED / tamamlanmamış**, PASS toplamına katılmaz; R3/R4'ün görünmüş olması tam koşu bitişi değildir. [ham](evidence/mp89/R-populated1.log) |
| Fiziksel Android/PC manuel, Render, gerçek LAN, Docker, Ctrl± | **NOT RUN** |

İlk fikstür ve depo FAIL logları da aynı kanıt dizininde korunur. [Önceki çıkışlar](evidence/mp89/regression-exits.json), [önceki kabul](evidence/mp89/acceptance-exits.json), [son kabul komutları/çıkışları](evidence/mp89/beta-commands.json) / [çıkış](evidence/mp89/beta-exits.json). Kaynakları aynen kalan motor testleri gereksiz tekrar edilmedi.

MP75 A3 bu fazın kaydedilmiş koşusunda geçti; geçmiş AI barış teklifi aralıklılığı için yeni AI düzeltmesi yapılmadı ve kesin kapandı sayılmadı. MP88'in A1/B1 düzeltmeleri kaynakta aynı, MP74 regresyonu geçti. Bildirim gizleme kayıt kimliği/kalıcılığı bu faza alınmadı.

## 9. Save8/RNG, host yetkisi ve eski kayıtlar

Save8v8 şeması, serializer/deserialize ve oyun kuralları değişmedi. main.js yalnız BUILD_ID farkıyla kanonik dosyaya eşit; map/AI/ekonomi/diplomasi/ledger ve MP çekirdek/ayna/misafir/MP4save/join kaynakları kanonikle aynı. Relay/view yalnız MP sürüm işaretinde farklı. [SHA/kaynak kapsamı](evidence/mp89/source-scope.json); son UI kaynak koruması PASS.

UI tercihi G'ye veya RNG'ye yazmaz. SP ve misafir ölçek adımlarında tam ham Save8/RNG karşılaştırması geçti. PERF testleri sabit eski kayıttan ay ay tam Save8/RNG eşdeğerliğini; eski SP kaydının Chromium'a yüklenmesi ve MP paketinin yeni süreçte açılması geriye uyumluluğu destekler. R yükleme kontrolü siyasi alanları ve RNG'yi korur; yükleme günlüğü gibi beklenen sunum kayıtları nedeniyle bütün yeniden serialize edilmiş host dosyasının bayt bayt aynı olduğu ayrıca iddia edilmez.

Host yetkisi/komut kapıları, gizlilik beyaz listesi, insan devleti/AI ayrımı, tam-bir-kez kararlar, PERF1/PERF2 ve MP86 önbelleği değiştirilmedi. Aynı temel STARS UI'si PC/mobil/SP/MP'de kullanılır.

## 10. Build, ZIP, dağıtım sözleşmesi

- Oyun **96h10p6**, PWA **stars-v96h10p6**, MP **MP.8.9**. Save8v8; MP protokol/kayıt sözleşmesi değişmedi.
- Nihai yerel `/mp/version` bu oyun/MP eşleşmesini200 ile döndürdü. MP73 mevcut UI sürüm göstergeleriyle de geçti.
- [Deterministik oyun ZIP'i](../../releases/stars-faz96h10p6.zip): **776457 bayt**;20 girdi (manifest+19 runtime).
- SHA-256 **`9f0bf5f11913c277ca23274c7a84544fd15ecee3edffd3e8ab56ca149ff814f9`**
- Tüm ZIP CRC32 **`ee942090`**; her girdinin CRC32'si ve boyutu [package.json](evidence/mp89/package.json) içinde.
- Manifest SHA-256 **`1df79e50bc85bb4602589c0e5a78bca62eb4c3433019d157a7bfcf6598c2a408`**.
- İki bağımsız üretimin tam ZIP baytları aynı. ZIP CRC testi, iç manifest ve19 dosyanın SHA kontrolleri PASS; çalışma ağacı/manifest doğrulaması PASS.
- Önceki776370 bayt/71a485… ara paket yayın paketi değildir; eski kontrol kaydı `package-intermediate.*` olarak saklanır.
- MP istemci/sunucusu oyun ZIP'inden ayrı depoda bulunur. Docker COPY listesi yeni dosya yolu gerektirmiyor; Docker/Node22/deploy çalıştırılmadı. Canlı servis sürümü için uyumluluk PASS'i verilmez.

## 11. Değişen dosyalar

Runtime: ui.js (yerel ölçek, menü birimleri), index.html (sınırlı CSS), main.js/sw.js (kimlik), RELEASE-MANIFEST.json. MP view.js/relay.js yalnız sürüm. Önceki join/ayna/otorite/save/AI dosyaları aynı.

Testler: browser-mp8 ve mp73; MP89 menü/UI/depo/sıra testleri, menü/protokol/ölçek/dolu kayıt yardımcıları, kaynak koruması. Araç: verify-release.py runtime kapsamı. Belgeler/kanıtlar: bu rapor, BETA-ACIK-ISLER, manuel plan, CODEX son rapor, CLAUDE faz notu, `evidence/mp89/` ve yeni ZIP.

## 12. Issue denetimi, beta engelleri ve sonraki tek faz

Dört issue özgün metni web sayfalarından doğrulandı, hepsi OPEN. API Forbidden; ek izin/endpoint araştırması yapılmadı; issue kapatma/yorum yok.

- **#5 AÇIK / DOĞRULANMADI — P2:** iki-kelime/doktrin adı, bağımsız isim RNG akışı ve kabul testleri eksik; eski üretici duruyor.
- **#6 KISMEN TAMAMLANDI:** yerel host/yetki/ayna/diplomasi/bağlantı çekirdeği kanıtlı. Gerçek LAN/online/cihaz kabulü, offline discovery ve sohbet/emoji/mute tamamlanmış sayılmaz.
- **#7 KISMEN TAMAMLANDI:** MP4 kayıt listesi/paket/kimlik/devam yerel kapsamda kanıtlı. Tam ortak SP çoklu-slot Load/arama/migrasyon ve gerçek yayın/discovery kapsamı eksik; MP listesi tam SP Load yerine sayılmaz.
- **#8 AÇIK / DOĞRULANMADI — P2:** mevcut86A tabanına rağmen yeni sade akış/arama/kategori/3-tık mobil UX kabulü yapılmadı; opQuote/matematik değiştirilmedi.

Beta öncesi kalanlar: **P0** aralıklı giriş eylemi timeout'unun ürün/test ayrımı ve güvenilir açılış kanıtı; **P0/P1** hedef gerçek ağ/cihazlarda kayıpsız devam/komut/gizlilik kabulü; **P1** manuel PC/Android okunabilirlik/zoom/dok kullanılabilirliği. Yerel otomatik PASS'ler bu kapıları kendiliğinden kapatmaz.

Sonraki tek faz **BETA.0: aralıklı giriş tanısı + gerçek cihaz/ağ kabulü**. Yeni isim/AI/federasyon/efekt/mekanik eklenmez. Gerçek cihaz planı birkaç kısa oturumdur, terminal istemez. Canlı servis testi ancak ayrı yetkili görevde; bu fazda Render NOT RUN.

## 13. GitHub teslimi ve PR

Kod/ilk rapor GitHub'a5210281… commit'iyle teslim edildi ve uzak SHA doğrulandı. Bu son kabul/ZIP/rapor güncellemesi aynı dala commit edilir; nihai HEAD son mesajda bildirilir.

**PR BLOCKED:** yalnız bir taslak `gh pr create` denemesi `Post "https://api.github.com/graphql": Forbidden` verdi. [Hata](evidence/mp89/pr-attempt.log), [deneme sayısı/çıkış](evidence/mp89/pr-exit.json). Güvenlik sınırları değiştirilmedi, tekrar denenmedi.

[GitHub raporu](https://github.com/sarsiss12-dot/Star/blob/codex/stars-mp89-pc-ui-stability/reports/codex/MP89-PC-UI-KARARLILIK-SONUC.md) · [Doğru tabanla karşılaştır/PR oluştur](https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp88-stability...codex/stars-mp89-pc-ui-stability?expand=1).

Yeni performans kazanımı ölçülmedi; yüzde/FPS iddiası yok. Teknik yerel kabul başarılı olsa da beta yayın/merge onayı verilmez.
