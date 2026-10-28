# STARS — FAZ 96H.6.1 Sonuç Raporu

Tarih: 28 Ekim 2026 (Türkiye). **Yayın kararı: yalnız ittifak yönetimi kabul edildi. Ekonomik AI adayları C2 ve T1 reddedildi; üretime alınmadı.** Build `96h61`, PWA `stars-v96h61`, Save `v8`.

## 1. Başlangıç ve son GitHub HEAD

Depo: `sarsiss12-dot/Star`, dal `main`. Başlangıç HEAD: `28eff6a425825af9142a0ca584370f3d2e5b7a14`. GitHub API ve yeni yerel clone aynı HEAD'i doğruladı; beklenmeyen sonraki commit bulunmadı. Runtime yayın commit'i: `2b915771295462dd0bc22f8c6fd5615ea2da5801`. Belge commit’i öncesinde doğrulanan runtime `main` HEAD: `2b915771295462dd0bc22f8c6fd5615ea2da5801`. Force kullanılmadı; parent ve expected-HEAD koruması uygulandı.

## 2. Kanonik oyun ve dosya doğrulaması

`stars-faz96h52.zip`: 763345 bayt. SHA-256 `c5c2debffd2cd6b17c158ae7150a74a3eed774cd00840b4222707fe4b845993c`. ZIP CRC PASS; 20 ZIP girdisi, manifestteki 19 runtime dosyasının tamamı hem ZIP hem GitHub kaynaklarıyla eşleşti. Kanonik build `96h52`, PWA `stars-v96h52`, Save 8.

AI SHA-256 başlangıçta ve yeni üretimde aynı: `27ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739`.

Önceki oturum özetinde belirtilen 96H.6.1 geçici çalışma dosyaları bu devam ortamında bulunmadığından, o özetin ölçümleri yeni kanıt sayılmadı. Bu rapordaki kontrol, aday, yerel ve tarayıcı sonuçları bu devam çalışmasında yeniden üretildi.

## 3. Önceki ekonomik kanıtlar ve karşılaştırılabilirlik

96H.5.1/96H.6 araştırma kayıtları, deney yamaları, protokolleri ve ham sonuçları incelendi. D1/D2/A1/A2/C1/C2/AC otomatik uygulanmadı. Eski A2'nin yerel 404 ve toplam kritik ayları iyileştirmesine rağmen ticareti ve yeni devlet toparlanmasını bozduğu; AC'nin de %85 ticaret korumasını geçemediği dikkate alındı. Bunlar geçmiş araştırma sonuçlarıdır, bu fazda yeniden çalıştırılmış A2/AC kampanyaları değildir.

Yeni H52 kontrolünde sekiz seedin 120 aylık sonuçları ve gerekli dört seedin 240 aylık sonuçları gerçekten yeniden üretildi. 11/23/42'nin 240 ayı ve diğer 120 ay kontrollerinin tam Save/RNG özetleri tarihsel kontrolle eşleşti. 404'te ilk tam Save farkı ay 133'tür. Aynı ay 131 kaydından iki aylık karşılaştırmada fark yalnız kapanmış savaşın `emps.2.warCause.7`, `emps.2.warDefense.7`, `emps.7.warDefense.2` metadata alanlarının H52 tarafından temizlenmesidir. RNG eşittir. Ekonomik toplamlar da eşittir; eski kontrolün bütünüyle aynı olduğu varsayılmadı.

## 4. Ekonomik zamanlama hipotezi

**Hipotez doğrulandı.** `aiEconomyPlan`, `aiBuildingDelta(..., queued=true)` ile aynı kolonideki bütün ücretli işlerin üretim/bakım etkilerini hemen plan netine ekliyor. `colonyBuildTick` ise yalnız sıranın başındaki işi ilerletiyor. Kuyruğa ödeme yapılmış olması, üretimin bugün başladığı anlamına gelmiyor.

İncelenen zincir: `aiEconomyPlan`, `aiRecoveryInvestment`, `aiBuildingDelta`, `aiBuildingSustainable`, `aiEconomicOrder`, `aiRecoverEconomy`, `aiDemolitionChoice`, `aiColonyForecast`, `colonyBuildTick`, `queueBuilding`. Hata yalnız tek bir eşik sorunu değildir: erken üretim kredisi, üç aylık yatırım finansmanı kapısı, iki işlik normal kuyruk kabulü ve acil yıkımın boş kuyruk şartı birbirini etkiliyor.

Salt okunur denetim altı gerçek fixture için altışar ay çalıştırıldı. Başlangıç stokları, gerçek üretim/tüketim defteri, bakım ve yönetim giderleri, ücretli işler, ilk üretim ayı, vergi aktarımı, ticaret yükümlülükleri ve gerçekleşen stoklar kaydedildi. Doğal replay her ay ayrı gözlemcisiz replay ile tam Save ve RNG üzerinden karşılaştırıldı: PASS. Girdi Save'i ve canlı oyun değiştirilmedi; tahmin okumaları RNG tüketmedi. Sadece hazır işleri ilerleten ayrı queue-clock, yeni AI kararlarını veya gelecekteki savaş/nüfus değişimini tahmin ediyor diye sunulmadı.

## 5. Tahmini ve gerçek kuyruk takvimi

| Fixture | Ücretli iş | Gerçek bitiş günü | İlk üretim ayı |
|---|---|---:|---:|
| 404 / ay 113 | Öndeki kale | 3554 | 119 |
| 404 / ay 113 | Arkadaki fabrika | 3655 | 122 |
| 11 / ay 219 | Öndeki çiftlik | 6608 | 221 |
| 11 / ay 219 | Arkadaki maden | 6680 | 223 |

Queue-clock hesapları gerçek seri tamamlanma adımlarıyla birebir eşleşti. Yarım günlük adımların yukarı yuvarlanması ve sonraki işin ancak sonraki adımda ilerlemesi hesaba katıldı.

404 ay 113'te tüketim stoku 86,592; mevcut net −9,768/ay. Mevcut netle stok dayanımı yaklaşık 8,86 aydır. AI planı henüz çalışmayan fabrikayı kredileyerek neti −3,6295 ve dayanımı 23,86 ay gösteriyor. Altı aylık gerçek replay boyunca fabrika tamamlanmıyor; tüketim stoku ay 119'da 26,784'e düşüyor. Bu, kuyruğun erken üretim kredisine somut bir örnektir.

## 6. Seed 404 tüketim krizinin kök nedeni

Yeni kanonik kontrolde devlet 7 yine ay 107'de doğdu. Değişmez doğum gözlemi: 400 maden; fabrikasız koloni; peşin ödenmiş iki kale işi, kalan 153 ve 191 gün. Fabrika ay 113'te 170 madenle sipariş edildi, ancak seri kuyruğun arkasında ay 121,833'te tamamlandı; üretime ay 122'de katıldı.

Ay 119'da fabrika hâlâ bitmemişken 133,742 madenin 110'u çiftliğe harcandı. Ay 131'de 111,193 madenin 110'u yine çiftliğe gitti; bu sırada gıda sıfır olduğundan yatırım gereksiz değildi. Maden siparişi ay 149'a, ikinci fabrikanın siparişi ay 161'e kaldı. Fabrika tek başına tüketim ihtiyacını karşılamıyordu. Sonraki vassallık vergisi pozitif maden üretiminin bir bölümünü gerçekten aktardı; salt UI gösterimi değildi.

Sonuç: kritik fabrikanın zamanında sipariş edilmesi, zamanında üretime girmesi ve sonraki üreticilerin finanse edilmesi ayrı sorunlar. A2'nin uzun süreli rezervasyonu bu rekabeti genel olarak güvenli biçimde çözmemişti. Fabrikaya kaynak ayırmak gıda/maden müdahalesini geciktirebilir; bu fazın T1 deneyi de tek yönlü iyileştirmenin yeterli olmadığını gösterdi.

## 7. Seed 11 yeni devletin toparlanması

Yeni kontrolde devlet 7 yine ay 218'de 400 madenle,1 maden ve 4 dökümhaneyle doğdu. Başlangıç kuyruk boştu. İlk karar çiftlik, ay 219 kararı maden oldu. Ay 218 sonrasında net maden −31,573/ay, net gıda −11,503/aydı; devletin stok dayanımı yeni siparişler yüzünden basit sabit-net hesabından daha hızlı azaldı. Maden stoku ay 221'de sıfıra indi.

Çiftlik ay 220,267'de, maden ay 222,667'de tamamlandı. `aiRecoverEconomy` içindeki `colonyJobs > 0` engeli nedeniyle ilk dökümhane yıkımı ancak ay 223'te verilebildi. Yıkım anlık değildir; ilk gerçek tamamlanma ay 224,4'tür. Sonraki yıkımlar ay 227/231'de verildi. Yıkım iadesi tamamlanmada, mevcut kurallarla gelir; gizli kaynak eklenmedi. Mevcut inşaat iptali peşin ödenen tutarı iade eder; bu fazda AI'ya yeni iptal kararı eklenmedi.

İlk stok 400 maden olmasına rağmen sürdürülemez bina bileşimi, yeni yatırım harcamaları ve kuyruk kilidi birlikte toparlanmayı geciktiriyor. **Üretimde bu sorun düzeltilmiş değildir.**

## 8. C2 bağımsız doğrulaması

C2 yalnız `aiDemolitionChoice` içinde, üretimi azaltılacak kaynak mevcut toparlanma rezervinin altındaysa normal slot açma yıkımını engeller. A2'nin uzun finansman rezervasyonu eklenmedi; acil ücretli yıkım yolu korundu.

İzole hedefli testler:4 PASS/0 FAIL. Aynı 100 sistem/1 AI seed 11 ay 52 Save'inden ay 120'ye yerel test gerçekten tekrarlandı:

| Ölçüm | Kontrol | C2 |
|---|---:|---:|
| Aynı tür yeniden yapım döngüsü | 6 | 2 |
| Net maden yatırım kaybı | 816 | 149 |
| Tamamlanmış döngülerde kesinti, bina-gün | 955 | 424 |
| Yıkım siparişi | 11 | 13 |

Yerel başarı yeterli sayılmadı. Bağımsız 240 seed 11'de ticaret 204→155, yani%75,98 oldu. Gerekli en az%85 karşılanmadı. C2 reddedildi. 23/42/404 aday 240 çalışmaları ilk ciddi ihlal sonrasında **NOT RUN** bırakıldı. C2'nin 240 kritik sayısı 10→9 görünse de aday koşusunda devlet 7 hiç doğmadı; bunu o devletin toparlanması olarak saymadık.

## 9. Tek yeni ana ekonomik aday: T1

T1 yalnız altı aylık plan içinde hazır ücretli işlerin gerçek seri tamamlanma ayına göre gelir etkisini ağırlıklandırdı. Yeni kaynak yardımı, seed istisnası, RNG seçimi, yeni ekonomik eşik veya C2/A2 birleşimi yoktu.

| Aynı Save/RNG, aynı aktör 7 | Kontrol kritik ay | T1 kritik ay | Karar |
|---|---:|---:|---|
| 404 ay 107→160 | 42 | 32 | Yerel hedefte daha iyi |
| 11 ay 218→240 | 9 | 10 | Toparlanma geriledi: RET |

Aktör 7 iki yerel karşılaştırmada da başlangıçta aynı gerçek devlettir ve iki yolda da hayattadır. Devletin doğmaması/ortadan kalkması başarı sayılmadı. Seed 404'teki iyileşmeye rağmen seed 11 güvenlik kapısı geçilemedi. T1'in 120 matrisi ve 240 kampanyaları **NOT RUN**; başarısız yerel kapıdan sonra bütçe harcanmadı. Üretim `ai.js` korunmuştur.

## 10. İttifak feshi için mevcut kod araştırması

`aiReviewAlliances`, `canAlly`, `setColdWar`, `protectedDiplomaticPair`, `endTreatiesForWar`, `updateFederations`, `fixDiploConflicts`, diplomatik hafıza, `canEnter` ve sensör paylaşımı incelendi.

AI zaten karşılıklı ittifak bayraklarını kaldırıyor, iki ilişkiyi 15 azaltıyor, hedefe kesin ve diğer uygun devletlere mevcut RNG tanıklık kuralıyla `paktBozdu` hafızası bırakıyor, üç aylık soğuk savaş kaydı oluşturuyordu. Oyuncuda görünür normal fesih girişi eksikti. `endTreatiesForWar` bağımsız hakları da sildiğinden kullanılmadı.

Soğuk savaşın mevcut fiilî engeli AI'nın normal `aiWarReview` değerlendirmesindedir. `canAlly` içinde ayrıca sabit yeniden ittifak bekleme süresi yoktur. Onay metni bütün savaş yollarında evrensel dokunulmazlık veya bulunmayan yeniden ittifak yasağı vaat etmez.

## 11. Oyuncunun ittifakı sonlandırması

Normal müttefikin diplomasi ilişki ekranında görünür **⚑ İTTİFAKI SONLANDIR…** düğmesi var. Düğme hedef devletin adı, iki taraf için −15 ilişki, hafıza etkisi, üç aylık soğuk savaş, ortak taahhütler, geçiş/sensör ve bağımsız anlaşmaların durumunu açıklayan onay penceresi açar. Kaynak bedeli yoktur; karşı tarafın kabulü gerekmez.

Açmak ve vazgeçmek hiçbir ilişki/kaynak işlemi uygulamaz. Onay, dünya ve devlet nesnesi kimliği ile modal token'ını doğrular; mevcut koşulları yeniden denetler. Aynı onay ikinci kez uygulanamaz. Save 8 yüklemesi ve kapanmış modal eski onayı geçersiz kılar. Sonuç sonrası diplomasi ekranı ve antlaşma etiketleri yenilenir.

## 12. Federasyon üyeliğiyle çakışma

Aynı federasyonun üyeleri arasındaki ittifak düzeni üyelik motorunun parçasıdır; `updateFederations` karşılıklı bağlara bakar. Normal fesih bu durumda engellenir. Neden görünür ve **Federasyon Yönetimini aç** yönlendirmesi vardır. Oyuncu sessizce üyelikten çıkarılmaz. İki devletin federasyon dışı ittifakı, oyuncunun mevcut federasyonuna dokunmadan sonlandırılabilir. Doğrudan senyör-vassal çiftinde normal fesih engellenir; sözleşme/bağımsızlık yolu korunur.

## 13. Diplomasi, ticaret ve savaş etkileri

İki ittifak bayrağı birlikte güncellenir. İlişkiler mevcut−100 alt sınırıyla 15 azalır; hafıza ve soğuk savaş eski AI işlemindeki sırayla uygulanır. Mevcut savaşlar kapanmaz; yeni savaş açılmaz. Mevcut ortak sefer emirleri iptal edilmez; gelecekteki ittifak desteği artık bu bağdan doğmaz.

Bağımsız ticaret paktı, kaynak sözleşmesi, saldırmazlık, açık geçiş izni ve ayrı sensör paylaşımı silinmez. İttifaka dayalı askerî geçiş sona erer; `canEnter` açık sınır/bağımsız izin gibi diğer hakları mevcut kurallarla değerlendirir. Vassallık sözleşmesi ve H52 savaş/vassallık düzeltmeleri korunur.

## 14. Gerçek 120/240 kampanya sonuçları

Konfigürasyon: Normal, sarmal 45 sistem/5 AI, konsey/kriz kapalı, varsayılan%35 AI kökeni. Ayda 60 yarım-gün adımı; ay 60 gerçek Save 8 yüklemesi. Ekonomi kontrol ve adayları ayrı çalışma ağaçlarında; ittifak değişikliği bu deney köklerinde yoktu.

| 120 ay, seed 11/7/23/42/99/123/404/2026 toplamı | Yeni H52 kontrol | C2 |
|---|---:|---:|
| Kritik devlet-ay | 14 | 12 |
| Ticaret teslimatı | 455 | 524 |
| Teknoloji | 331 | 328 |
| Koloni | 129 | 141 |
| Gemi | 1386 | 1482 |
| Askerî güç | 187795 | 205471 |
| Yıkım siparişi | 349 | 324 |
| Birebir yeniden yapım döngüsü | 127 | 89 |
| Döngülerde net maden kaybı | 15738 | 10388 |

| 240 ay kontrol seed | Kritik ay | Teslimat | C2 adayı |
|---|---:|---:|---|
| 11 | 10 | 204 | 9 kritik/155 teslim; ticaret FAIL |
| 23 | 1 | 20 | NOT RUN |
| 42 | 2 | 132 | NOT RUN |
| 404 | 49 | 717 | NOT RUN |
| Kontrol toplamı | 62 | 1073 | Tam C2 toplamı yok |

Son iki toplam tarihsel sayılardan kopyalanmadı; yeni kontrol sonuçlarından yeniden hesaplandı. Üretim adayında ayrı 120 ay seed 11 kontrolü de çalıştırıldı: başlangıç ve 120 ayın tamamında Save/RNG birebir eşit.

## 15. PASS / FAIL / NOT RUN

- PASS: Kanonik ZIP/CRC/19 runtime; yeni kontrol matrisi; salt okunur zaman çizelgesi; gerçek kuyruk takvimi.
- PASS: C2 izole 4 test, yerel 100 test, sekiz seed 120 kapısı.
- FAIL: C2 bağımsız 240 seed 11 ticaret kapısı. Üretime alınmadı.
- FAIL: T1 aynı kayıtlı seed 11 aktör 7 toparlanma kapısı. Üretime alınmadı.
- NOT RUN: C2 diğer üç 240 aday; T1 120/240. Gerekçe erken ret.
- PASS: İttifak 13 hedefli test; eski AIreview ile 64 seed tam sonuç/RNG eşitliği.
- PASS: 135 test grubu,6068 kontrol,0 FAIL. Tekil grupların son gerçek sonuçları sayıldı; tekrarlar toplanmadı.
- PASS: Chromium 17 senaryo,0 FAIL, yakalanmamış sayfa hatası yok.
- NOT RUN: Fiziksel Android, gerçek kuruluAndroidPWA, cihaz GPU/FPS ve cihazda uzun basma testi.

İlk regresyon çalışmasında manifestin `build` alanı 96 h 52 kaldığı için 25 grup sürüm tutarlılığı kapısında durdu. Alan 96 h 61 olarak düzeltildi ve yalnız başarısız gruplar tekrarlandı; hepsi geçti. İlk Chromium federasyon yönlendirme kontrolü görünmeyen üst menü düğmesini seçmişti; selector diplomasi panelindeki gerçek düğmeye daraltıldı. Son 17 senaryo çalışması baştan temiz geçti. İlk başarısız loglar kanıt paketinde tutuldu.

## 16. Save 8 ve deterministik RNG

Save sürümü 8 değişmedi. Kanonik başlangıç, gerçek ay 60 yüklemesi, iptal/çift onay/eski modal/yeniden yükleme testleri geçti. Yeni oyuncu işlemi onaylandığında mevcut AI işlemiyle aynı tanıklık RNG kuralını kullanır; bu, onay sırasında meşru deterministik RNG tüketimidir. Yalnız pencere açma/iptal ve salt okunur ekonomik denetim RNG tüketmez.

AIreview stratejik koşulları değiştirilmedi. Ortak `applyAllianceEnd` işlevine çıkarılan eski uygulama,64 başlangıçta orijinal kodun tam Save/RNG sonucuyla eşleşti; gerçek fesih yolu çalıştırıldı. Yeni üretim 120 ay replay'i de kanonik kontrolle tamamen eşittir.

## 17. Chromium/PWA ve Android

Gerçek Chrome Headless Shell 151 ve Playwright kullanıldı. 844×390,740×360 ve 390×844 çözünürlüklerinde ittifak düğmesi, en az 44 pxdokunma yüksekliği, iptal/onay, anlık etiket güncellemesi ve eski Save 8 onay engeli doğrulandı. Federasyonun altı sekmesi, ayrılma/ihraç, ticaret kararı, vassal yönetimi, filo filtreleri ve 3/2 sütunlu inşa paneli de geçti. PWA çevrimdışı yeniden açıldı ve eski Save 8 yüklendi.

Dikey düzen denetiminde mevcut “yatay çevir” uyarısı önce doğrulandı, sonra yalnız test CSS'iyle gizlendi; bu dikey oynanış veya fizikselAndroid kabulü değildir. Fiziksel Android **NOT RUN**.

## 18. Değişen dosyalar ve işlevler

Üretim: `diplomacy.js` → `canEndAlliance`, `applyAllianceEnd`, `endAlliance`, `aiReviewAlliances` içindeki aynı uygulamaya delegasyon. `ui.js` → ilişki ekranı düğmesi, `endAlliance` aksiyonu, `confirmAllianceEnd`. `main.js` → yalnız BUILD_ID; `sw.js` → yalnız cache sürümü; `RELEASE-MANIFEST.json` → yeni manifest.

Test/kanıt: yeni ittifak motor testi, Chromium sürücüsü, kanonik AIreview test oracle'ı, tam ve hash ile sınırlandırılmış H61 preservation yardımcısı; ilgili tarihsel kaynak-koruma testi yeni onaylı bölümü ayrı doğrular. Araştırma sürücüleri, salt okunur timeline, protokol, kontrol/aday tabloları ve reddedilmiş patch'ler `research/96h61` altında.

`ai.js`, ekonomi/inşaat fiyatları ve kuyruğu, ticaret/casusluk, federasyon altı sekmesi, vassallık türleri, bilim/doktrinler, filo filtreleri ve inşa CSS'i üretimde değiştirilmedi.

## 19. Teslim dosyaları, hash ve CRC

- Oyun: `stars-faz96h61.zip` — **764471 bayt**, SHA-256 `68b64e6cb918a106733568761b0a1a30b16e4550c96d2e26ebde56822ebcb6a0`.
- Kanıt: `stars-faz96h61-kanit.zip` — **46356936bayt**, SHA-256 `a2aa257f9092e70769b7d43beaea15f5a93222f9ec0c0e9a3c087656587e3003`.
- Release: `RELEASE-96H61.json`.
- Bu rapor: `STARS-96H61-SONUC-RAPORU.md`.

Oyun CRC PASS;19 runtimeSHA ve 20 ZIPgirdisi manifestle eşleşti. Kanıt CRC PASS; iç manifestteki bütün dosyaların boyut ve SHA değerleri doğrulandı. Kanıt paketi ham kontrol/aday kampanyalarını, gerçek Save fixture'larını, reddedilen deneyleri, ilk hata loglarını ve yayın doğrulamasını içerir. Manifest kendisini veya kendi ZIP hashini içermez; dairesel hash iddiası yoktur.

## 20. GitHub ve gerçek yayın durumu

**Evet: GitHub main üzerinde yeni 96 h 61 oyunu yayımlandı.** Runtime commit'i `2b915771295462dd0bc22f8c6fd5615ea2da5801`; belge commit’i öncesinde doğrulanan runtime HEAD `2b915771295462dd0bc22f8c6fd5615ea2da5801`. GitHub'a gönderilen blob SHA'ları yerel git nesneleriyle, oluşturulan tree yerel staging tree ile eşleşti. Güncelleme fast-forward, force=false ve expected-HEAD korumasıyla yapıldı. Sonrasında remote fetch edilerek 19 runtime, manifest ve oyunZIP hashleri yerel teslimle yeniden karşılaştırıldı: PASS.

GitHub Releases sayfasında ayrıca etiketli bir release nesnesi oluşturulduğu iddia edilmiyor; gerçek yayın repo `main` kaynakları, `releases/stars-faz96h61.zip` ve `RELEASE-96H61.json` üzerindedir.

## 21. Açık sorunlar ve sonraki faz

AI'nın altı aylık stok hesabı bugün tamamlanmamış üretimi erken krediliyor. Ücretli kuyruğun gerçek bitişi kanıtlandı, fakat bunu tek başına ağırlıklandırmak yeni devlet toparlanmasını güvenle iyileştirmedi. Seed 404 ve seed 11 sorunları üretimde çözülmüş değildir. C2'nin bağımsız uzun vadeli güvenliği geçmedi.

Öncelik: aynı gerçek Save fixture'larıyla zaman indeksli stok darboğazını, kriz finansmanı ve boş kuyrukla sınırlı acil müdahale arasındaki bağlantıyı tek kök neden üzerinden çözmek. Yalnız bir seedde tüketim iyileşmesini kabul etmeyip yeni devlet ve ticaret kapılarını birlikte korumak. Sonra Yayılmacı AI'nın koloni yatırım finansmanı; ayrı fazlarda Teknokrasi/Kutsal Meclis başlangıçları, sekiz doktrin dağılımı,82 Makine/Arındırıcı kimlik ayrışması ve uzun vadeli diplomatik/askerî karar kalitesi. Android cihaz QA'sı ayrıca gereklidir.

**Net cevaplar:** AI'nın kuyruk zamanlaması doğru değil; kanıtlandı. Seed 404 yerel deneyde daha hızlı toparlanabiliyor fakat güvenli genel çözüm yayımlanmadı. Seed 11 iyileşmedi. C2 bağımsız 240 kapısını geçmedi. Ekonomik AI iyileşmesi yayımlanmadı. Oyuncu artık normal ikili ittifakını onayla sonlandırabiliyor. Federasyon üyeliği bu işlemle bozulmuyor. AI'nın mevcut ittifak bozma davranışı korundu. GitHub'da yeni oyun gerçekten yayımlandı; kapsamı yalnız ittifak yönetimidir.

Bu depo raporunu ekleyen belge commit’inin tam HEAD değeri, kullanıcıya teslim edilen nihai raporda ayrıca verilir; rapor kendi commit hashini içine koyduğu iddiasında değildir.
