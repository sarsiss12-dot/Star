# STARS — BETA-AI-RECOVERY.0 sonuç raporu

11 Kasım 2026. **Kalıcı ekonomik kurtarma hedefi karşılanmadı. Hiçbir aday ürün koduna alınmadı; p23 korundu.** Geçici stok rahatlaması, daha erken fabrika veya azalan kritik ay sayısı tek başına başarı sayılmadı.

## 1. Kanonik kaynak ve deney başlangıcı

- Uzak başlangıç: `6f089bdda4f9fb0721f8dbd91846fcb4c975ab34`, `codex/stars-beta-ai-quality0`; verilen HEAD ile eşleşti. [Uzak kanıt](evidence/beta-ai-recovery0/remote-base.txt).
- Çalışma dalı: `codex/stars-beta-ai-recovery0`; eski main kullanılmadı.
- Test/deney/kanıt commit'i: [`fb438a7b53133a068a622adfa73539cd77df2b15`](https://github.com/sarsiss12-dot/Star/commit/fb438a7b53133a068a622adfa73539cd77df2b15). Yeni oyun kodu commit'i değildir. Nihai rapor HEAD'i son yanıtta bildirilir.
- Oyun/paket hâlâ p23 `183c3ca635c6a65ae0d4320284c2e6ab026efb96`; `96h10p23`, `stars-v96h10p23`, `MP.8.9b18`, Save8v8/paket4/protokol1.

Önceki araştırmanın **60. ay Save8 kontrol noktası mevcut** bulundu: `p23-404-60-ulu-9-final.sav`, SHA256 `7d1037e1da8387e5a917ec4d258c718bdfbdc26b51b6e24c867482e96a94ab74`. Seed404,100sistem,9AI, gün1800. Bu sentetik kampanya kaydıdır; özel oyuncu kaydı değildir. Testler ayrı VM kopyalarında çalışır; kaynak dosyası değişmez.

Bütün A/B kolları aynı byte dizisinden `deserialize` ile açıldı. İlk tarama en az36ay; en anlamlı adaylar60ay daha, yani120.aya kadar ilerletildi. Bütün AI, olay, savaş, inşa, ticaret ve ekonomi yolları açık kaldı. Simülasyon gerçek0,5gün adımlarıyla yürütüldü. AI'ya kaynak, üretim, filo veya özel bonus verilmedi.

## 2. Kesin kök neden: finansman kilidi ve devam eden bombardıman

Önceki ekonomik tanı doğru fakat eksikti. 60.ayda devlet2'nin:

- Maden stoku47,29, aylık neti yaklaşık+2,77; tüketim stoku9,97, aylık neti−10,46.
- Fabrika bedeli170maden. Gerçek marjinal etkisi yaklaşık+5,60tüketim **ve−4,48maden/ay**, ayrıca enerji bakımıdır. Dolayısıyla yalnız170maden biriktirmek yeterli değildir; yeni girdi yükü de finanse edilmelidir.
- Maden ocağı120maden; mevcut düşük akışla ilk ocağın bedeli bile yaklaşık26ay ister. Mevcut `aiRecoveryInvestment`3aylık finanse edilebilir yatırım kapısına giremiyor.
- `aiRecoverEconomy` pozitif ama yetersiz maden akışında erken söküm başlatmıyor; mevcut eski yol, maden neti daha sonra negatife düşünce çalışabiliyor.
- Borsa kapalı. Mevcut piyasa yalnız enerji/maden/alaşım kapsıyor; tüketim ve gıda doğrudan piyasa ürünü değil. Devlet2'nin ticaret limanı da yok; fiziksel kargo için mevcut liman şartı korunmalı.

**Yeni kanıt:** başkent Wyndor/sistem38 üzerinde **13korsan filosu,26korvet,3848güç** var. Devlet2'nin kendi savaş filosu bulunmuyor; kalkan ve garnizon tükenmiş. İki koloninin `bombed` damgası mevcut ayla eşleşiyor. Motor, bombardıman sürerken istikrarın pozitif toparlanmasını engelliyor.

İlk kayıtta gerçek istikrar hedefi81,5 olmasına rağmen istikrar0. Sonraki kıtlık aylarında hedef düşse de pozitif kalıyor; bombardıman damgası yenilendiğinden normal toparlanma işlemiyor. **Sekiz aylık ayrı tam-AI tekrarında** gerçek korsan varlığı, yenilenen damga, pozitif hedef ve0istikrar her ay doğrulandı. [Tanı](evidence/beta-ai-recovery0/diagnosis-pinned/diagnosis.json), [baskı tekrar kaydı](evidence/beta-ai-recovery0/pressure/pressure.json).

Bu yüzden mal satın almak bile normal istikrar/verim toparlanmasını başlatmıyor. Düşük verim, düşük maden akışı ve karşılanamayan tüketim birbirini besliyor. “170madenlik eşik” bu döngünün yalnız bir parçasıdır. Burada korsan veya bombardıman kuralının hatalı olduğu **iddia edilmiyor**; gerçek devam eden askerî baskı ekonomik tanıdan ayrılıyor. Bu faz kuralları zayıflatmadı, korsanları silmedi.

Salt-okunur hassasiyet kontrolünde yalnız gölge kolonilerin istikrarı40 varsayılarak **mevcut ekonomi hesaplayıcısı** çalıştırıldı: maden yaklaşık16,23, gıda25,72, tüketim−4,20 çıkıyor. Bu oynanmış kampanya veya kurtarma sonucu değildir; düşük istikrarın ekonomik ağırlığını gösteren kâğıt hesabıdır. Gölge değişiklikler eşzamanlı geri alındı, hamSave8/RNG değişmedi.

## 3. Denenen seçenekler ve gerçek maliyet

Bütün adaylar yalnız `tests/helpers/ai-recovery0-experiments.cjs` ile deney VM'sine enjekte edildi. Üretim `ai.js`, ekonomi formülleri, diplomasi veya savaş kuralları değiştirilmedi.

1. **Sınırlı biriktirme:** kritik tüketim açığında besleyici maden ocağı için en fazla12ay kendi gelirinden biriktirme; başka kaynakta6aylık güvenlik şartı. Eski reddedilmiş3→6ay yaması aynen alınmadı. Bu yeni sınır da bu kaydın26aylık ilk finansman boşluğunu çözemedi.
2. **Önemsiz harcamayı erteleme:** kritik tüketim ve düşük maden varken lüks bina/maden bedelli yeni gövdeleri erteleme; gözlenen merkez savunmasını engellememe. Kayıtta bu ertelemeyle yeterli yeni maden serbest kalmadı.
3. **Mevcut takas:** Borsa açılmadı. Mevcut `aiNegotiate → dealQuote/aiRespond → executeDeal` yoluyla gerçek AI taraflarla maden veya doğrudan tüketim/gıda alımı denendi. Yalnız temas edilen, savaşılmayan, uygun ilişkili AI'lar; kendi ödeme kaynağında rezerv kapısı; mevcut karşı teklif ve cooldown kuralları korundu. Karşı tarafın özel stokuna bakarak seçim yapılmadı. İnsan adına kabul verilmedi.
4. **Düşük verimli girdi yükünü azaltma:** mevcut ücretli söküm yolunu, barışta pozitif fakat yetersiz madenle kritik tüketim yaşayan duruma erken açma; diğer kaynaklarda6aylık dayanma kontrolü. Bu kayıtta dökümhane seçildi. Madeni ve enerji bakımını rahatlatırken alaşım üretimi kaybediliyor.

Ek olarak maden ocağını, karşılanamayan fabrika girdisinden önce finanse etme (`input-plan`) ve bu seçeneklerin sınırlı birleşimleri denendi. Yeni genel planlama veya anlaşma motoru yok.

### Ortak ilk36ayda devlet2'nin gerçek işlemleri

Aşağıdaki harcamalar kaynak farklarından ve gerçek motor işlemlerinden gelir. Etki giderleri mevcut normal diplomasi işlemlerini de içerir; hepsi yeni takasın ücreti değildir. İlk36ay için olay izi tamamdır. Daha uzun izler180olayla sınırlıdır; geç dönemin tüm brüt işlemleri kaydedilmiş gibi sunulmaz.

| Seçenek | Ödenen inşa madeni | Net takas gideri | Net takas girişi | Bu pencerede tamamlanan bina artışları |
|---|---:|---|---|---|
|Baz|110|80etki|90maden|1çiftlik|
|Sınırlı biriktirme|110|80etki|90maden|1çiftlik|
|Harcama erteleme|110|80etki|90maden|1çiftlik|
|Maden takası|400|388enerji+80etki|320maden|1çiftlik,1maden,1fabrika|
|Erken söküm|560|120etki|140maden|1fabrika,1çiftlik,1santral|
|Girdi planı|120|80etki|90maden|1maden|
|Girdi planı+söküm|560|120etki|140maden|1fabrika,1çiftlik,1santral|
|Doğrudan mal alımı|110|378enerji+80etki|261tüketim+90maden|1çiftlik|
|Mal alımı+söküm|620|444enerji+120etki|336tüketim+140maden|1fabrika,1çiftlik,1santral,1maden|

Ödenmiş ama henüz tamamlanmamış işler harcamaya dahildir; bina tamamlanması diye sayılmaz. Sökümde **74maden yalnız gerçek tamamlanmada** geri gelir; peşin kaynak yaratılmaz. Gerçek kontrol noktasının ayrı kopyasında bu iade, tekrar tick ve Save8 yükleme sonrası ikinci kez iade oluşmaması doğrulandı: [söküm kabulü](evidence/beta-ai-recovery0/salvage/salvage.json).

Erken söküm, mevcut baz davranışındaki dökümhane kaldırmayı yaklaşık35ay öne çekti. Böylece bir fabrika daha erken tamamlandı; fakat alaşım üretim kapasitesi ve daha sonra başka yatırımlara ayrılabilecek kaynaklar kaybedildi. Doğrudan mal alımı ise büyük enerji stokunu geçici tüketim tamponuna çevirdi; üretim açığını kalıcı kapatmadı.

## 4. Önce/sonra karşılaştırması ve karar

İlk36ayda baz, biriktirme, erteleme, maden takası, söküm, girdi planı ve girdi+söküm seçeneklerinin her birinde devlet2 **36kritik/36sıfırstok ayı** yaşadı. Doğrudan mal alımı19/14; mal alımı+söküm10/1 verdi. Bu son iki sonuç adayları daha uzun izlemeyi gerektirdi, ürün kabulünü değil.

### Aynı60.ay kaydından120.aya kadar

“Kritik ay”: gerçek ene/min/yiy/ala/tuk netlerinden biri negatif ve ilgili stok3aydan kısa dayanıyorsa bir devlet-ay. Aynı ay iki açık bir kez sayılır. Bu ölçü kesin iflas veya motorun6aylık yatırım ufkuyla aynı şey değildir.

| Kol | Devlet2 kritik/sıfır ay | Bütün AI kritik/sıfır ay | Son koloni/teknoloji/gemi toplamı | Sonuç |
|---|---|---|---|---|
|A: p23|60/60|73/70|28/84/241|Kriz sürüyor|
|Erken söküm|60/60|70/67|31/88/222|Kriz sürüyor|
|Girdi planı|60/60|60/60|28/86/205|Kriz sürüyor|
|Doğrudan mal alımı|43/38|44/38|28/84/241|Geçici tampon, sonra kriz|
|Mal alımı+girdi planı|43/38|44/38|28/84/241|Ek yarar yok|
|Maden takası+girdi planı|60/60|61/60|40/85/175|Kriz sürüyor; kaynak ve filo sonuçları değişiyor|
|Mal alımı+erken söküm|23/6|26/6|27/85/140|En çok rahatlama, fakat kalıcı kurtarma yok|

Bazın61–120.ayları için73kritik devlet-ayına önceki kanonik ilk60ayın5kritik ayı eklenince78 elde edilir. Devlet2 için önceki3+bu60=63kritik ay; sıfırstok60aydır. Böylece rapordaki ana vaka yeniden doğrulanır.

En güçlü birleşik adayda120.ayda devlet2 tüketim stoku yine0, neti−12,79; enerji146,95/net+1,35; maden57,28/net+9,82. Alaşım geliri0. Art arda kritik olmayan en uzun dönem yalnız7aydır. Kalıcı çıkış süresi **ölçülemedi: pencere sonunda hâlâ krizde**.

Ayrıca bu aday koşusunda AI7'de114–116.aylarda3kritik enerji ayı görüldü; bazda bu enerji kritik ayları yoktu. Galaksi gemi toplamı241→140 çıktı. Bunlar tüm sonraki savaş/diplomasi/RNG gelişmeleriyle birlikte gözlenen yan sonuçlardır;101geminin doğrudan takas bedeli olduğu iddia edilmez. Yalnız devlet2'nin kısa süreli stok göstergesini düzeltip bu sonuçları görmezden gelmek güvenli kabul değildir.

Adaylarda gerçek işlemler değiştiğinde sonraki RNG ve olay akışının farklılaşması mümkündür. Uzun kolların aynı savaş ve olayları yaşadığı iddia edilmedi; kayıtlar normalize edilmedi.

**Karar: bütün adaylar RET.** En düşük riskli bir ürün yaması seçilemedi. P24build/PWA/MP veya yeni oyun ZIP'i oluşturulmadı. Ekonomik kurtarma görevi açık kalır. [Tam karşılaştırma](evidence/beta-ai-recovery0/comparison.json), [60ay tablosu](evidence/beta-ai-recovery0/comparison-table.txt).

## 5. Seed42/23, istikrar, savaş ve yatırım yan etkileri

Seed42 ve23'ün mevcut60.ay kayıtlarından36ay daha oynandı. Baz, doğrudan mal alımı, maden+girdi planı ve en güçlü mal+söküm birleşimi karşılaştırıldı. Seçilen bu sağlıklı kontrol pencerelerinde aylık dünya örnekleri **birebir eşit** kaldı; kritik/sıfırstok0/0.

| Seed | Pencere | Baz ve bu üç adayda son koloni/teknoloji/gemi | Aylık eşitlik |
|---|---|---|---|
|42|61–96.ay|21/73/210|PASS|
|23|61–96.ay|21/49/175|PASS|

Bu,404'teki kalıcı kurtarma başarısızlığını telafi etmez; bütün seed'lerde genel güvenlik sertifikası da değildir. Yeni uzun kampanyalar yerine hedefli iki kontrol penceresi kullanıldı.

Devlet2'nin iki kolonisi başkent sisteminde; istikrar0 olmasına rağmen bu sistemin ayrılık koruması ayrı motor kuralıdır. Koloni sayısının2kalması “ekonomi düzeldi” demek değildir. İstikrar/sayaç/schism aylık kayıtlarda saklandı. Savaş ve filo kuralları değiştirilmedi; baskın altındaki üretim ve son galaksi filo toplamları ayrı raporlandı. Daha erken tamamlanan fabrika ve madenin karşılığında tüketim dengesinin niçin kapanmadığı da izlendi.

## 6. AI işlem maliyeti ve ölçüm sınırları

120.aya uzatılan kollarda ölçülen AI turu başına ortalamalar yaklaşık16,5–27,3ms; baz17,2ms. Bu değerler Node/VM, gerçek saat ve bütün aylık AI turu maliyetidir; karar türleri, yaşayan devlet sayısı ve olay akışları farklılaşır. İlk36ay baz koşusu soğuk/yüksek maliyetliydi; onu hızlı görünen sonraki kollarla kıyaslayıp performans iyileşmesi çıkarılmadı.

Yeni üretim algoritması kabul edilmediğinden runtime performans etkisi **yoktur**. Her karede filo/ekonomi geçmişi eklenmedi. Aylık yapılandırılmış ölçümler test tarafındadır; önemli olay izi180kayıtla sınırlıdır. Bu sınırdan sonraki brüt maliyetleri eksiksiz ölçtüğümüz iddia edilmez; ortak ilk36ay işlem tablosunun kapsaması analizde doğrulanır. Fiziksel Android/Render performansı test edilmedi.

Gözlem ve tanı mevcut hesapları kullanır. Gölge istikrar hesabının Save8/RNG değişmezliği; deney dosyalarının kaynak kontrol noktasını değiştirmemesi; p23 sabit kaynağıyla güncel aynı-byte kaynak arasındaki ilk ay/olay/RNG eşitliği doğrulandı. Başlangıç kaydı ve kanıt hashleri korunur.

## 7. PASS / FAIL / NOT RUN

| Denetim | Durum | Kanıt / sınır |
|---|---|---|
|Aynı60.ay Save8 ile kontrollü tekrar|PASS|Aynı SHA; kaynak dosya salt-okunur|
|Sürekli bombardıman tanısı|PASS|8ay tamAI; gerçek korsanlar/damga/hedef/istikrar|
|Dört ana alternatif ve birleşimleri|Test edildi|36ay tarama, güçlü adaylarda120.aya devam|
|Kalıcı ekonomik kurtarma|**FAIL — bütün adaylar**|Hiçbiri sonunda tüketim krizini kapatmadı|
|Seed42/23 yan etki pencereleri|PASS sınırlı|Seçilen üç aday,36ay aylık veriler eşit|
|Söküm iadesi/tekrar/yükleme|PASS|74gerçek maden, ikinci iade yok|
|10hedefli regresyon script'i|PASS,10exit0|AI strateji/bütçe; vasal/fed bütçesi; koloni/uzaktan inşa; p22filo motor/MP; UI/pure Save8/RNG; PERF1/PERF2|
|19runtime/manifest ve5MPdosyası|PASS|Kanonik6f089bd ile birebir aynı|
|İki deterministik paket|PASS|İkisi de mevcutp23ZIP'iyle aynı|
|Yeni üç Chromium/soğuk oda ve tam UI matrisi|NOT RUN bu fazda|Ürün/MP byte'ları değişmedi; öncekiAI-QUALITY soğuk5/0 veUI30/0 tarihsel kanıt olarak korunur|
|Fiziksel Android/PC, LAN/internet/Render|NOT RUN|Yerel deney bunların yerine geçmez|

[Regresyon listesi](evidence/beta-ai-recovery0/regression/results.json), [release kimliği](evidence/beta-ai-recovery0/release-identity.json), [kanıt SHA indeksi](evidence/beta-ai-recovery0/EVIDENCE-MANIFEST.json). Başarısız adaylar silinmedi; assertion gevşetme, force-click, timeout artırma veya sahte kaynak yok. Özgün aralıklı selfleet/dealSend/fedFoundStart/KATIL durumları kapatılmadı.

Yeni ürün değişikliği bulunmadığı için bütün daha önce geçen Chromium/MP kampanyaları tekrar tekrar çalıştırılmadı. Bu fazın taze MP kanıtı host yetkisi/gizlilik içeren p22 motor testidir; yeni üç-browser kabulü yapılmış gibi sunulmaz.

## 8. ZIP, GitHub ve değişen dosyalar

Ürün/MP kaynakları değişmedi. Yeni testler `ai-recovery0-compare`, `analyze`, `diagnose`, `pressure`, `salvage` ve yalnız deney kurulum yardımcısıdır. `AI-RED-KARARLARI.md`, envanter ve devir belgeleri güncellendi. Hiçbir aday yaması otomatik oyuna yüklenmez.

Mevcut oyun paketi `releases/stars-faz96h10p23.zip`:

- 836950 bayt; 19 runtime + manifest, 20 girdi.
- SHA256: `af6eb03aade38327e48ee290029377e638b40167ff87742a57be82cec5bd7d1d`.
- CRC32: `13718624`.
- Çalışma ağacı/manifest hashleri, ZIP üyeleri ve CRC doğrulandı. İki yeniden üretim mevcutZIP'le birebir aynı; yeni p24paketi yok.
- MP relay/istemci dosyaları oyunZIP'inden ayrıdır; aynı geliştirme zincirinde ve değişmeden korunur.

[GitHub dalı](https://github.com/sarsiss12-dot/Star/tree/codex/stars-beta-ai-recovery0), [başlangıca karşı compare](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-ai-quality0...codex/stars-beta-ai-recovery0). Araştırma commit'i push edildi; rapor commit'i de aynı dala gönderilir. Main merge, force-push, Render deploy/restart ve özel kullanıcı Save8 değişikliği yok.

Issue33 güncellenmedi; önceki fazda görülen Forbidden engeli bu çalışmada tekrar tekrar zorlanmadı. [Yerel görev envanteri](BETA-AI-RECOVERY0-ENVANTER.md). Yeni PR oluşturulmadı. Ekonomik kurtarma işi TAMAMLANDI değildir.

## 9. Açık işler ve sonraki en dar seçenek

Bu çalışmanın yeni kanıtı, ekonomik kilidin **devam eden gerçek korsan kuşatması altında** yaşandığıdır. Bütçeyi daha iyi etiketlemek veya tek kaynağı takasla doldurmak, bastırılan istikrar/verim ve yetersiz üretim kapasitesini kalıcı düzeltemedi.

Sonraki inceleme aynı58–60.ay koşulunda mevcut askerî savunma/yardım yollarının bu gözlenen korsan baskısına niçin sonuç üretemediğini ölçmelidir. Gerçek müttefik/federasyon filolarının varlığı, erişimi ve mevcut görevlendirme kapıları incelenebilir. Bu öneri yeni genel savaş/diplomasi motoru yazmak veya test geçsin diye korsanları silmek değildir. Önce mevcut güçlerle meşru savunma mümkün mü ayrılmalı.

Askerî baskı gerçek motorla giderilebildiğinde, aynı ekonomik kontrol noktalarında üretici finansmanı yeniden denenebilir. Sürdürülebilir ticaretin değerlendirilmesinde yalnız eldeki enerji stoku değil, tekrar alım bedelinin gerçek aylık gelirle karşılanması da zorunlu olmalı. Diğer devletin rezervini veya başka bir kaynağı eriterek sağlanan rahatlama kurtarma sayılmamalı.

Bu faz güvenli bir kalıcı düzeltme sunamadı. Buna karşılık basit bir “daha uzun biriktir” yamasının niçin yetersiz kaldığı, gerçek maliyetler ve daha önce eksik kalan sürekli bombardıman nedeni kanıtlandı; mevcut p23 korunarak teslim edildi.

### Yeniden üretme

Sentetik60.ay dosyası yoksa önceki sabit p23 kampanyasıyla üretilebilir. Özel oyuncu kaydına ihtiyaç yoktur:

```sh
AIQ_MODE=p23 AIQ_SAVE_ROOT=/tmp/aiq0-saves STARS_OUTPUT=/tmp/recovery-build node tests/ai-quality0-campaign.cjs 404 60 ulu 9
RECOVERY_MODES=base,save,hold,trade,upkeep STARS_OUTPUT=/tmp/recovery-screen node tests/ai-recovery0-compare.cjs /tmp/aiq0-saves/p23-404-60-ulu-9-final.sav 36
RECOVERY_MODES=base,upkeep,input-plan,goods-trade,goods-input,mineral-input STARS_OUTPUT=/tmp/recovery-extended node tests/ai-recovery0-compare.cjs /tmp/aiq0-saves/p23-404-60-ulu-9-final.sav 60
RECOVERY_MODES=goods-upkeep STARS_OUTPUT=/tmp/recovery-combined node tests/ai-recovery0-compare.cjs /tmp/aiq0-saves/p23-404-60-ulu-9-final.sav 60
STARS_OUTPUT=/tmp/recovery-pressure node tests/ai-recovery0-pressure.cjs
STARS_OUTPUT=/tmp/recovery-diagnosis node tests/ai-recovery0-diagnose.cjs
```

Deneyler varsayılan olarak sabit p23 runtime'ını geçici dizine çıkarır. Her mode yeni VM'ye aynı dosyayı yükler. Adayların yalnız test runtime'ında bulunduğu özellikle korunmuştur.
