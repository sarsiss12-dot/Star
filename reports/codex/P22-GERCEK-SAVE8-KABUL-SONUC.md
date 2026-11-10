# STARS — p22 gerçek Save8 kabulü ve filo kurtarma

## Kaynak ve sonuç

Başlangıç ve doğrulanan uzak HEAD: `109f4d997d79c914d030ac7234fc47c5f3874c49`. Dal: `codex/stars-beta-stability-ai0-save-fleet-recovery`. Runtime kod/paket commit'i `b6dd2c6ab570debc29e02e5e60b48eb591fc9a23` korunmuştur. Bu teslim yalnız gerçek kayıt kabul testleri ve rapor ekler; **ürün kusuru çıkmadı, sürüm artırılmadı**. Oyun96h10p22, PWA stars-v96h10p22, MP.8.9b17; Save8v8/paket4/protokol1.

Özgün kayıt ve iki inceleme eki gerçekten açıldı. `.sav` veya bunların tam içerikleri GitHub'a eklenmedi. Testler `/tmp/stars-real-save-private` altındaki ayrı kopyada çalıştı. Özgün ekin tekrar okunan SHA'sı değişmedi. Önceki p22 raporundaki dosya eksikliği bu kabul için giderildi; eski rapor tarihsel sonuç olarak korunur.

## 1. Bütünlük ve envanter

p22 `tools/audit-save-fleets.cjs` çalıştırıldı. Beklenen ve gerçek SHA-256: **`37fc6db0579c891d508a4251613aea92cb7a6ba797ca2f459711899070964ffe`**. Boyut **3.122.149 bayt**, CRC32 **`DCE544EB`**, Save8v8. Tam eşleşme: **PASS**. Üç ekin dosya boyutu/hash kayıtları `evidence/p22-real-save/input-integrity.json` içindedir.

| Alan | Önceki inceleme | Gerçek kayıtta |
|---|---:|---:|
| Sistem / devlet |300 /23|300 /23|
| Oyuncu |Ororni Filosu|Ororni Filosu|
| Toplam filo / gemi |253 / belirtilmedi|253 /759|
| Oyuncu filo / gemi |34 /44|34 /44|
| ID1 ve ID1945 |Yok|İkisi de yok|
| ID1 hedefli oyuncu sevkiyatı |27 tekil kruvazör|27; sınıf/gövde ve kimlikler doğrulandı|
| Konum |Verrus14 / Pyraeran13|Aynı|
| Yetim sevkiyat |112:27 oyuncu+85 diğer|Aynı|
| Yetim oyuncu üretim işi |117|117|
| Hedef dağılımı |ID1:4 / ID1945:113|Aynı|
| Kayıtlı `paid.ala` toplamı |11.805|11.805|
| Son günlükte hedef bulunamadı |12|12|

Uyuşmayan envanter değeri bulunmadı. **11.805 alaşım kayıtlı ödeme toplamıdır; kaybedilen tutar olarak yorumlanmaz.** Önceki inceleme eski main üzerinden kod değerlendirmişti; bu kabul main'e dönmeden p22 üzerinde yapıldı.

## 2. ID1 /1945 ve ilk20K filo

İki ID kanonik kayıt filo dizisinde yoktur; sorun yalnız misafir haritasında gizlenen bir nesne değildir. Mevcut gemiler/siparişler bu olmayan hedefleri referanslar. Kayıt, bu filoların ilk kaldırıldığı anı veya o anın kesin sebebini saklamaz. **İlk20K filonun kaybolma nedeni: BELİRLENEMEDİ.** ID1945'in kaldırılma sebebi de belirlenemedi. Savaş, ikmal, birleşme veya başka işlemden birini geçmişe dönük kesin neden diye etiketlemedik. ID1/1945 veya geçmiş20K güçte gemi yaratılmadı.

## 3. Gerçek kopyada kurtarma

Önce özgün kaynakla yükleme sonucu bütün devletlerin kaynakları,759 geminin sınıf/gövde envanteri ve253 filonun konum/hareket verisi karşılaştırıldı. Bütün üretim işlerinin gerçek makbuzu, kalan/toplam süresi ve sırası korundu. Kayıp hedefli117 oyuncu işi p22'nin mevcut hold kuralıyla bekletildi; ücret tekrar kesilmedi.

ID1 grubu mevcut `fleetRecoveryAction(...,'merge')` ile **aynı sistem içinde** birleştirildi: Verrus14 ve Pyraeran13 kruvazör iki ayrı filoda kaldı. Sistemler arası birleştirme/ışınlama olmadı. Ardından mevcut yaşayan oyuncu filosu **ID1884** test hedefi seçildi; hem ID1'in4 işi hem ID1945'in113 işi aynı geçerli hedefe yönlendirildi. Bu örnek hedef stratejik olarak en iyi hedef olduğu iddiası taşımaz.

Pyraeran'daki13 gemi, aynı sistemde zaten bulunan hedefe kanonik teslimatla katıldı; diğer sistemdeki14 geminin yolculuk hedefi güncellendi. Oyuncunun bütün gemileri için **sistem+sınıf+gövde çokluğu** kaynak kayıtla aynı kaldı. Rotanın tanımlanması varışın tamamlandığı anlamına gelmez; hareket motoru ve geçiş izinleri korunur.

| Ölçüm | Kaynak / ilk yükleme | Kurtarma sonrası |
|---|---:|---:|
| Oyuncu gerçek gemileri |44|44|
| Galaksi gerçek gemileri |759|759|
| Oyuncu canlı filoları |34|8|
| Galaksi canlı filoları |253|224|
| Ham filo dizi kayıtları |253|228|
| Oyuncu ham filo kayıtları |34|9|
| Kayıp hedefli oyuncu iş sayısı |117|0|
| Mevcut117 iş |117|117; ID1884 hedefli|
| Makbuz toplamı / iş ilerlemesi |11.805 / kaynak değerleri|Tam aynı|
| Bütün devletlerin kaynakları / RNG |Kaynak değerleri|Tam aynı|
| AI yetim sevkiyat sayısı |85|0 geçersiz hedef|

Ham dizide kalan **4 boş teslimat kabuğu** canlı filo/gemi değildir; birleştirme/teslimat yolunun normal sonraki boş filo temizliğine aittir. Bunlardan1'i oyuncudadır. Bu nedenle228 ham kayıt ile224 canlı filo,9 ham oyuncu kaydı ile8 canlı oyuncu filosu ayrı raporlanır. Dizi sayısındaki azalma gemi kaybı değildir;759 geminin sınıf ve gövdeleri birebir korunmuştur.

AI'lar için mevcut `aiRecoverShipments` yolu en fazla10 kontrollü tur çağrısıyla işlendi; tam stratejik AI kampanyası çalıştırılmadı.85 eski sevkiyatın81'i hareket durumunda,4'ü teslimat durumundadır. Kayıp hedefler giderildi; bütün AI'ların gelecekteki varış veya savaş sonucuna garanti verilmez. AI işlemleri de kaynak, gemi veya üretim ilerlemesi değiştirmedi.

Aynı kurtarma isteği tekrar uygulanmaya çalışıldığında reddedildi. Yeni sipariş, ödül, ikinci ücret veya gemi çoğalması oluşmadı. Kurtarılan test kopyası ayrı olarak kaydedilip tekrar yüklendi; makbuzlar, ilerleme, gemi envanteri, kaynaklar ve RNG korunur. Kopya GitHub'a gönderilmedi; hash bilgisi `private-copy-integrity.json` içindedir.

## 4. Gerçek Chromium multiplayer

Yerel relay/TLS ortamında **üç ayrı Chromium süreci** kullanıldı: H gerçek kayıt oyuncusu0, B özgün devlet1, C özgün devlet2. B/C'nin AI bayrakları yalnız bu MP rol fikstüründe insan kontrolüne uyarlandı; sahiplik, kaynak veya gemi verisi değiştirilmedi. B'nin özgün devlet0'ı yönettiği ayrı rol değişimi matrisi bu kabulde çalıştırılmadı.

Host, gerçek Ororni27 gemi/117 iş grubunu native düğmelerle birleştirip yönlendirdi. B kendi gerçek kayıt sevkiyatını native düğmeyle host'a gönderdi; başarı gerçek ACK ve güncel aynadan sonra gösterildi. Tekrar paket reddedildi. C'nin aynasında diğer devletin özel kaynakları/işleri/filo günlüğü yoktu; kendi filo envanteri host ile eşleşti. Host'ta kayıt-yükleme ve mirror yeniden kurulumu da doğrulandı. **A1/B1/RS22 toplam3 PASS /0 FAIL**.

Gerçek kayıtla bütün tarayıcı/relay'i kapatıp yeni oda açma bu kabulde **NOT RUN**. Önceki p22 sentetik soğuk oda5/0 kanıtı korunur; gerçek dosya üzerinde bu adım yapılmış sayılmaz. Fiziksel Android, iki fiziksel PC kullanıcı kabulü, LAN, internet ve Render oynanışı **NOT RUN**.

## 5. Test komutları ve kanıtlar

Çalışma dizini `/workspace/Star`; kanıt kökü `reports/codex/evidence/p22-real-save`. `STARS_USER_SAVE` yalnız özel test kopyasını gösterir; test kaynaklarına gerçek kayıt gömülmemiştir.

| Komut / senaryo | Sonuç | Kanıt |
|---|---|---|
| `node tools/audit-save-fleets.cjs /tmp/stars-real-save-private/original.sav 0 37fc6db0579c891d508a4251613aea92cb7a6ba797ca2f459711899070964ffe` |PASS|`audit.json`|
| `STARS_USER_SAVE=/tmp/stars-real-save-private/original.sav STARS_PRIVATE_RECOVERED=/tmp/stars-real-save-private/recovered.sav STARS_OUTPUT=reports/codex/evidence/p22-real-save node tests/p22_real_save_acceptance.cjs` |PASS|`engine-final.log`, `recovery.json`|
| `STARS_USER_SAVE=/tmp/stars-real-save-private/original.sav REAL_SAVE22=1 MP73_ONLY='^(A1\|B1\|RS22)' STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=reports/codex/evidence/p22-real-save/browser node tests/browser-mp73.cjs` |3/0|`browser.log`, `browser/real-save-browser.json`|
| `node tests/beta_stability0_fleet_test.cjs` |10/0|`regression-fleet.log`|
| `node tests/beta_stability0_mp_test.cjs` |3/0|`regression-mp.log`|
| `python tools/verify-release.py --root /workspace/Star` |19 runtime PASS|`package-verify.log`|
| Gerçek kayıtla soğuk yeni oda / fiziksel Android / Render |NOT RUN|Yukarıdaki sınırlar|
| İlk20K filo kaldırılma sebebi |BELİRLENEMEDİ|Kaynak geçmiş olayı içermiyor|

Ek konum kontrolünün ilk denemesi, yönlendirme sonrasında iki sevkiyat nesnesinin de kalacağını yanlış varsaydı ve FAIL oldu (`location-check-first-fail.log`). Aynı sistemdeki13 gemi meşru biçimde hedefe katıldığı için güçlü doğru kontrol, gemilerin sistem+sınıf+gövde envanterini kaynakla karşılaştırmaktır; bu kontrol geçti. Assertion kaldırılmadı veya hareket zorlanmadı. Runtime düzeltmesi gerekmedi.

## 6. Paket ve GitHub

p22 paketi değişmedi: `releases/stars-faz96h10p22.zip`, **835907 bayt**. SHA-256 **`14271929b85ec9af6ae946b556a013b6b01579d64fe6f5129eb459f02c6e9cf9`**, CRC32 **`A99A49EC`**.19 runtime manifesti yeniden doğrulandı. Yeni ZIP/p22.1 üretmek için gerekçe çıkmadı. MP relay/istemci kaynakları aynı p22 zincirindedir.

Bu kabulün değiştirdiği dosyalar: yeni gerçek kayıt motor testi, yeni opt-in tarayıcı yardımcısı, `tests/browser-mp73.cjs` içindeki opt-in bağlantı, kanıt/rapor ve devir işaretçileri. **Runtime değişmedi.** Gerçek `.sav`, tam ek inceleme metni/manifesti ve kurtarılan özel `.sav` commit edilmedi.

Başlangıç HEAD yukarıda kayıtlıdır. Nihai kabul/rapor commit SHA'sı son teslim mesajında ve uzak HEAD doğrulamasında belirtilir; rapora kendi SHA'sını yazmak için commit zinciri üretilmez. Aynı geliştirme dalına gönderilir; main merge, force-push ve Render deploy/restart yapılmaz. Yeni PR veya pano güncellemesi bu dar kabulün zorunlu adımı değildi; önceki API Forbidden durumu aşılmaya çalışılmadı.

## 7. Açık kalanlar ve kullanıcı kontrolü

Gerçek dosya kabulü, p22'nin mevcut referans kurtarması için **PASS**. Bu sonuç ilk20K filonun kayboluşunu açıklamaz ve özgün aralıklı selfleet/dealSend/fedFoundStart sorunlarını kapatmaz. Görevler kullanıcı fiziksel kabulü olmadan TAMAMLANDI işaretlenmez.

Kullanıcı önce özgün kaydı ayrı tutmalı; test kopyasında ID1884 yerine istediği uygun filo/toplanma noktasını seçebilir.27 kruvazörün ve117 işin sayısını, başlatılan rotaları/geçiş haklarını, kaydet/yükle sonrası hedefleri kontrol etmelidir. Uzakta kalan14 geminin rotaya girmesi ile varması farklı aşamalardır. Gerçek soğuk yeni oda ve fiziksel PC/Android kontrolü kalan kabul adımlarıdır.
