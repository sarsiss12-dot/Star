# STARS · TİCARET-AĞI.0

## Oyunda ne değişti?

100 sistemlik deneyde bir konvoy iki yabancı devletin limanında aktarma yaparak dokuz hiperhat sıçraması geçti. Aynı hatta müzakerede imzalanan 100 mineral karşılığı 50 enerji takası iki kargo oluşturdu. İmzalandığında iki alıcının da stoku sabit kaldı. Yükleme gönderen stoklarını azalttı, iki varış ayrı makbuzlarla kayda geçti. Kaybolan yükü tekrar ilerletmek veya kaydı yüklemek ikinci bir teslimat üretmedi. [Çekirdek deneyleri](../../tests/ticaret_agi0_test.cjs) · [Sonuçlar](../../research/ticaret-agi0/evidence/ticaret_agi0_test.cjs.log)

| Soru | Sonuç |
|---|---|
| Üç sıçramadan uzun ticaret mümkün mü? | Evet. Üç sıçrama sınırı iki kullanılabilir aktarma noktası arasında uygulanıyor. Dört sıçramalık limansız boşluk hattı kesiyor. |
| Zincir fiziksel yük taşıyor mu? | Evet. Başlangıç, hareket, stok düşümü, varış ve kayıp aynı konvoy kimliğiyle izleniyor. |
| Yabancı liman için hangi hak gerekiyor? | Limanı kontrol eden devletin taşıyıcıya verdiği 360 günlük yönlü izin veya mevcut federasyonun ticaret yasası gerekiyor. Sınır geçiş izni tek başına yeterli olmuyor. Savaş, temas, ambargo ve abluka ayrıca denetleniyor. |
| AI izin isteyip kullanıyor mu? | Kontrollü ekonomik açıkta AI, eksik hakkı Etki karşılığında aldı. Ardından iki yönde ücretli mal yükledi ve teslim etti. Uzak insan oyuncuya yöneltilen istek onun cevabını bekledi. 36–96. ay aralığındaki üç doğal kampanyada yeni transit talebi gözlenmedi. Ayrı bir 11. tohum geç oyun kaydında yedi sıçramalı doğal teslimatlar gözlendi. |
| Liman el değiştirirse ne oluyor? | Hak ilgili koloninin gerçek sahibinden okunuyor. Yeni yükleme ve sürmekte olan seferler ayrı değerlendiriliyor. Başlangıç limanının kaybı, önceden yüklenmiş malı geri vermiyor. Barışla devir ve savaş sonu toprak paylaşımı aynı hak kontrolüne ulaşıyor. |
| Yük yeni liman sahibine yazılıyor mu? | Denenen fetih, geri alma, barışla devir ve aynı gün varış sıralarında yeni malike yanlış kredi sayısı sıfırdı. Meşru alıcının uygun başka limanı varsa oraya yönlendiriliyor. Alternatifin kapasitesi de denetleniyor. Hak sağlanamadığında konvoy konumunu ve yükünü koruyor. 180 günlük kesintisiz engelde bir kez kayıp yazılıyor. |
| Anlık mal takası kapandı mı? | Normal müzakere, tek seferlik mal takası ve fiziksel hediyeler sevkiyata bağlandı. Gerçek savaş desteğinin katılım bedeli, savaş hâlindeki tek taraflı barış/teslim tazminatı ve periyodik haraç için mevcut siyasi muhasebe yolları aşağıda belirtilmiştir. |
| Kayıt ve MP korunuyor mu? | p47 Save8 içindeki yoldaki iki kargo açıldı, ikisi de birer kez teslim edildi. Host yetkisi, iki misafir aynası, izin süresi, yeniden katılım ve aynı emri yeniden gönderme sınandı. Ekonomi kuralı tetiklendiğinde p47 ile tam dünya baytları ayrışıyor. |
| 500 sistem maliyeti ne? | Aşağıdaki tabloda aynı kontrol kayıtlarında hesaplanan tam ay p95 ve yoğun liman deneyinin ham süreleri bulunuyor. |
| Sonraki siyasi geliştirme ne olmalı? | Mevcut ekonomik karar anında belirli bir koridor kesilirse karşılanamayacak aylık ithalatı ölçmek. İç üretim, alternatif tedarikçi ve izin yenileme seçeneklerini aynı kayıttan karşılaştırmak. Başarı ölçüsü, ödenen gerçek maliyet başına önlenen kritik kaynak açığı devlet-aylarıdır. |

Oynanabilir taban PR #63, `96h10p47 / MP.8.9b46`, `8984b5107cae91016c41233409956e2cbb2523e2`. Ekonomik baskı araştırmasının HEAD'i `9db6de5b8498075b730c63eb05772cc01d7c7d7e`. Her iki uzak dal bu SHA’larla eşleşti. Geliştirme dalı `codex/stars-ticaret-agi0`. Oyun kodunun son değişikliği `900115a9fddbbea1b3d6e90d815219bcbac21471`. [Oynanabilir taban](https://github.com/sarsiss12-dot/Star/pull/63) · [Araştırma](https://github.com/sarsiss12-dot/Star/blob/9db6de5b8498075b730c63eb05772cc01d7c7d7e/reports/codex/EKONOMIK-BASKI0-SONUC.md)

## Rota, sahiplik ve ödeme

- Rota araması bilinen hiperhatlarda yolculuk günlerini ve son geçerli limandan beri yapılan sıçramaları izler. Eşit maliyette sistem kimliği sıralamayı belirler. Bir fiziksel rota aynı sistemden iki kez geçmez. Taşıyıcı, bildiği tehlikelerden kaçınan hattı kullanabilir. İmzalı sözleşmede yalnız riskli ve hukuken açık bir yol kalırsa korsanlık ve abluka hâlâ gerçek sonuç doğurabilir. AI karar penceresindeki türetilmiş rota belleği en çok 2.048 giriş tutar. Yüklemede güncel rota yeniden okunur. [Rota ve sevkiyat kodu](../../commerce.js)
- Tek seferlik takas, tek seferlik hediye ve periyodik kargo aynı stok ve makbuz kaydını kullanır. İki yönün stoku yüklemeden önce birlikte doğrulanır. Aynı imzalı tek seferlik anlaşma 30 gün içinde ikinci kez açılamaz. Kapasite her bağlantıda yük miktarını, aynı gönderen ve uç liman çiftinde de son 30 günlük sevkiyatı sınırlar. Uçları farklı sözleşmelerin ortak bir ara limandaki toplam yoğunluğu için ayrı rıhtım rezervasyonu bulunmuyor.
- Aynı teklifte istenen izin ön değerlendirmede hesaba katılır. Uygulama sırasında gerçek haklar ve stok yeniden denetlenir. İzin reddedilirse kargo başlamaz. Hemen yürürlüğe giren siyasi maddeye eşlik eden fiziksel bedelin yüklenememesi bütün işlemi geri alır. Yüklenmiş bedelin sonradan kaybolma riski konvoyda kalır. Bilim ve Etki soyut müzakere bedelleridir. Belirli bir cepheye doğrulanmış askerî katılımın bedeli ve savaş hâlinde tek taraflı tazminat eski ödeme biçimini kullanır. Haraç ve vasallığın dönemsel borçları kendi defterlerinden yürür. Eski bekleyen normal kaynak teklifleri kabul anındaki hat ve stok denetimine girer. [Anlaşma uygulaması](../../diplomacy.js) · [Savaş desteği](../../research/ticaret-agi0/evidence/war_coalition0_test.js.log) · [Haraç muhasebesi](../../research/ticaret-agi0/evidence/faz96b_accounting_test.js.log)
- Sadece sistemin siyasi renginin değişmesi bir gezegendeki limanı devretmez. Oyun fetih sonucunda gezegenin sahibini değiştirdiğinde erişim o anda değişir. Koloni eski devlete döndüğünde o andaki izinler geçerlidir. İçinde ilerlenen hiperhat kapanırsa konvoy konumunu tutar. Sistem içinde bulunan ve erişilebilir olan gerçek alıcı limanları yeniden değerlendirilir. Sözleşme üçüncü devletin borcuna dönüşmez. [Toprak paylaşımı ve geri alma](../../tests/faz92c_settlement_apply_test.js)
- Harita yakınlaştırmasında sistem etiketinde liman sayısı, gezegen ayrıntısında ilgili koloninin adı yanında çapa görünür. Ticaret Konvoyları görünümünde seçili yükün hattı çizilir. Sözleşme hazırlama kartı gidiş limanlarını, gereken üçüncü taraf haklarını ve tahmini süreyi gösterir. Abluka ve kayıp teslimatı belirsiz kılabilir. İki yatay görünümde gerçek form, kaydırma ve haritaya geri dönüş sınandı. Misafir aynası katılımcının bildiği sistemlerdeki kendi sözleşme ve yüklerini taşır. [Harita](../../map.js) · [Kargo kartı](../../commerce-ui.js) · [Misafir aynası](../../research/mp6/mirror.js)

## Doğal kampanyada ticaret

Aynı p47 Save8 dosyasından iki ayrı motorla 36. aydan 96. aya kadar ilerledik. 100 sistem, dokuz AI, iki hareketsiz misafir ve Dengeli gerilim kullanıldı. Her hücre p47 → aday biçimindedir. Liman sütunu limanı bulunan devlet–sistem çiftlerindeki değişimi, teslimat sütunu bu aralıkta teslim durumuna ulaşan farklı kargo kimliklerini gösterir.

| Tohum ve doktrin ayarı | Teslimat | Yeni sözleşme | Limanlı devlet–sistem artışı | Adayda üç sıçramadan uzun sefer |
|---|---:|---:|---:|---:|
| 11 · Doğal | 36 → 29 | 5 → 4 | 9 → 10 | 0 |
| 99 · Orta | 62 → 31 | 4 → 3 | 9 → 9 | 0 |
| 404 · Doğal | 0 → 0 | 0 → 0 | 6 → 7 | 0 |

99. tohumdaki fark iki devletin kayıtlarında izlenebiliyor. Devlet 3 ile 10 arasındaki eski sözleşme, iki kolda da dört turda 64 alaşım ve 56,8 mineral teslim etti. p47 aynı çift için 1.860. ve 2.220. günlerde on ikişer turluk yeni sözleşme imzaladı. Adayda 1.860. gün gerekçesi **ambargo / ticari yaptırım**, 2.220. gün gerekçesi **karşılıklı arz veya ihtiyaç bulunmaması** idi. Aday 1.740. günde bir defalık 40 enerji taşıdı. Çiftin yeni düzenli sözleşmesi 2.460. günde açıldı. Bu izler eksik teslimatın hangi kararlardan geldiğini gösteriyor. Aynı başlangıçtan ayrılan siyasi ve ekonomik geçmişlerde ambargonun ilk nedenini yalnızca lojistik kuralına atfetmek mümkün değil. [Aday kararları ve teslim edilen miktarlar](../../research/ticaret-agi0/evidence/sozlesmeler-99-aday.json.gz) · [p47 karşılığı](../../research/ticaret-agi0/evidence/sozlesmeler-99-p47.json.gz)

**Geç oyun, ayrı örnek.** 100 sistem ve tohum 11 ile 120. ayın p47 performans kaydından 138. aya ilerletilen doğal dünyada adayda altı farklı uzun hat konvoyu, p47’de sıfır gözlendi. Adayda 3.630. günde devlet 2 ve 6 arasındaki 18 numaralı sözleşme açıldı. 0 → 39 → 32 → 15 → 50 → 43 → 35 → 85 yolunda 16 enerji, ters yönde 10,6 alaşım taşındı. 3.810. gün gözleminde 151 ve 152, 3.990. gün gözleminde 169 ve 170 numaralı makbuzların her birinde yükün tamamı teslim edilmişti. Bu seferler için yeni transit talebi görülmedi. [Doğal konvoy kimlikleri ve rotaları](../../research/ticaret-agi0/evidence/hat-11-m120-aday.json.gz) · [Aynı girdiyle p47](../../research/ticaret-agi0/evidence/hat-11-m120-p47.json.gz)

36–96. ay aralığındaki üç kampanyada AI’ın yeni transit hakkı satın almasına veya bu karar yoluyla liman sipariş etmesine rastlanmadı. Genel bina kararlarıyla liman sayısı arttı. Kontrol altında denenmiş bir seçeneğin bu örneklerde kendiliğinden devreye girdiği söylenemez. Ayrı 404 kıtlık kaydında devlet 2, 96. ayda limansızdı. 50 yiyecek hediyesi reddedildi ve devletin stok değişimi sıfırdı. Sonraki 12 aylık 28 teslimat bütün galaksinin toplamıdır. [Doğal kampanyalar ve kontrol kayıtları](../../research/ticaret-agi0/evidence) · [404 limansız alıcı](../../research/ticaret-agi0/evidence/eski-kayit.json)

## Kayıt eşitliği ve ilk ayrışma

**PERF-SINIR.0 tam dünya karşılaştırması — FAIL.** 500 sistem, tohum 11, 30 → 31. ay. İlk farklı karar 930. günde devlet 2'nin devlet 13’e ittifak karşılığında 90 mineral talep etmesiydi. p47 teklifi uygulanabilir buldu. Aday, iki tarafın limanları arasında bu yük için açık, izinli ve yeterli kapasiteli hat bulamadı. Ay sonu RNG her iki motorda `-32883311`, tam Save8 karmaları farklı. Aynı 930. gün kaydından başlatılan yedi sınır, sahiplik ve geri alma kontrolü ayrıca geçti. [İlk teklif, RNG ve karmalar](../../research/ticaret-agi0/evidence/ilk-karar.json) · [Kesintisiz karşılaştırma](../../research/ticaret-agi0/evidence/perf-sinir0.log) · [Aynı kayıttan yedi sınır kontrolü](../../research/ticaret-agi0/evidence/sinir-yalitilmis.json)

Adayda aynı Save8 ve aynı emirler tekrarlandığında yük, iki tarafın stokları, RNG ve yeni kaydın baytları eşleşti. Eski bir p47 konvoyu yüklenirken stok ve RNG korundu. Yeni izinler ve kargonun hareket hâlindeki konumu geri geldi. Kayıt biçimi Save8 v8, MP paketi v4. Yeni maddeleri içeren bir odada eski p47 istemcisiyle karışık sürüm oturumu **NOT RUN**. [Eski kayıt deneyi](../../research/ticaret-agi0/eski-kayit.cjs) · [Aday yükleme ve kayıp tekrarları](../../tests/ticaret_agi0_test.cjs)

## Kabul tablosu

| Deney | Durum ve ölçüm |
|---|---|
| A · Rota | **PASS.** 100 sistemde iki yabancı ara liman ve dokuz sıçrama. İki ayrı eksik liman, dört sıçramalık boşluk, eksik izin, abluka, ambargo, süre sonu, çevrim ve açık alternatif sınandı. |
| B · Müzakere | **PASS.** Yerel relay, TLS vekili, üç ayrı Chromium oyuncu bağlamı. İzin maddesini ekleme, gönderme, ret, karşı teklif, kabul ve iptal gerçek düğmelerle yapıldı. Test kurulumu müzakere ekranını ve gelen kutusu kaydını UI işleviyle açar. Yetkisiz aktör komutu hostta reddedildi. Süre sonu ve kayıt yükleme host saatiyle denetlendi. [Chromium sonuçları](../../research/ticaret-agi0/evidence/chromium/mp8-TL.json) |
| C · Sahiplik | **PASS.** Fetih, barışçıl devir, koalisyonun onaylı toprak paylaşımı, geri dönüş, yıkım, karma sahiplik, aynı gün varış/devir ve iptal/yükleme. Toprak paylaşımı dizisi **29/29**. [Ham kanıt](../../research/ticaret-agi0/evidence/settlement.log) |
| D · Fiziksel takas | **PASS.** 100 mineral ve 50 enerji, iki ayrı hareket ve iki makbuz. Hatalı teklifte atomik ret. 180. günde kayıp, alternatif limana yeniden yönlendirme ve stok sınamaları. Çekirdek özellik dizisi **27/27**, temel kargo **36/36**, bütünlük **12/12**. |
| E · AI | Kontrollü izin, gerçek teslimat, pahalı/güvenli güzergâh, bütçe ve ret sonrası bekleme **PASS**. 36–96. aylardaki üç örnekte zincirli sefer, yeni transit isteği ve fırsat hesabıyla liman siparişi **0**. Ayrı geç oyun örneğinde **altı uzun hat konvoyu** görüldü. Genel liman inşalarının her biri için yatırım getirisi ölçülmedi. |
| F · Kayıt ve MP | Eski p47 Save8, yeni izin, aynı kargonun tek teslimi, misafirden gizli altyapının filtrelenmesi **PASS**. H **3/3**, J **5/5**. J yeni oda, eski misafirin katılımı ve aynı komut kimliğinin iki gönderiminde tek ödeme sınamalarını içerir. Tam p47 dünya eşitliği yukarıdaki 930. günde **FAIL**. [H](../../research/ticaret-agi0/evidence/chromium/mp8-H.json) · [J](../../research/ticaret-agi0/evidence/chromium/mp8-J.json) |
| Yatay kullanım | Chromium **17/17**. 800×360 ve 844×390 dahil beş görünümde kargo kartı, kaydırma ve haritaya dönüş. Gezegen ve Canvas haritasında iki limanın rozeti, uzak ölçekte gizlenmesi ve bina yıkılınca simgenin kalkması ayrıca doğrulandı. Sayfa hatası sıfır. [Limanlı gezegen](../../research/ticaret-agi0/evidence/chromium/liman-844x390.png) · [Ekran ölçümleri](../../research/ticaret-agi0/evidence/chromium/mobil.json) · [Misafir ekranı](../../research/ticaret-agi0/evidence/chromium/transit-kabul.png) |
| Saha | Fiziksel Android **NOT RUN**. Canlı Render **NOT RUN**. Ayrı cihazlarda LAN **NOT RUN**. |

## Performans

Her örnekte aynı Save8 yeniden açıldı. Chromium tam ay içinde 60 yarım günlük simülasyon adımını ve ay geçişini çalıştırdı. Zamanlama dışında alınan Save8 karmasının aynı kolda her tekrarda eşitliği zorunludur. İki kolun sırası dengelendi, ilk ısınma bloğu dışarıda bırakıldı. Aşağıdaki her hücre kol başına 24 örneğe dayanır. Kaynak karmaları, girdi SHA-256, ham süreler ve RNG değerleri JSON dosyalarındadır.

| Kayıt | p47 p50 → aday p50 | p47 p95 → aday p95 | p95 farkı | Ay sonu p47/aday Save8 |
|---|---:|---:|---:|---|
| [100-9-11-m120](../../research/ticaret-agi0/evidence/perf/100-9-11-m120.json) | 148,2 → 149,7 ms | 193,8 → 247,3 ms | +%27,61 | Farklı |
| [500-16-11-m120](../../research/ticaret-agi0/evidence/perf/500-16-11-m120.json) | 788,2 → 842,8 ms | 1005,1 → 1037,7 ms | +%3,24 | Eşit |
| [500-16-11-m180](../../research/ticaret-agi0/evidence/perf/500-16-11-m180.json) | 2437,6 → 2218,6 ms | 2633,4 → 2433,9 ms | −%7,58 | Farklı |

500 sistemde iki geç oyun p95 değeri de p47’ye göre %5 sınırının içinde kaldı. 100 sistemde medyan farkı 1,5 ms iken p95 farkı 53,5 ms oldu. Önceki ara ölçümde aynı küçük kaydın p95 farkı −%3,16 çıkmıştı. Son adayın 24 örneğiyle hesaplanan **+%27,61** teslim değerlendirmesinde korundu. [Ara ölçüm](../../research/ticaret-agi0/evidence/gelistirme/ara-tam-ay.log)

500 sistemlik yoğunluk deneyinde 168 gerçek limanlı kontrol dünyasında 499 sıçramalık zincir bulundu. Soğuk rota araması p95 2,6 ms, önbellekten sorgu 0,1 ms, izin düşürme ve yeniden denetleme 19,8 ms, konvoy hareket adımı 0,4 ms sürdü. Tek iş içinde arka arkaya 45 çizimde katman açıkken p95 1,5 ms ve en uzun çizim 302,2 ms ölçüldü. Ekran yenilemeleri arasına dağıtılan açık/kapalı karşılaştırmada kol başına 60 karede iki çizim p95’i de 1,4 ms, kare aralığı p95’i açıkken 16,7 ms, kapalıyken 16,8 ms idi. Fiziksel Android kare süresi bu ölçümlerden çıkarılamaz. [Yoğunluk ve ilk çizimler](../../research/ticaret-agi0/evidence/perf/yogun-liman.json) · [Ekran yenilemeleri arasındaki ölçüm](../../research/ticaret-agi0/evidence/perf/yogun-liman-kare.json)

100 sistemdeki iş farkını araştırmak için aynı ay fonksiyon süreleriyle yeniden oynatıldı. Her iki kolun ay sonu Save8 karması, kendi ölçümsüz kayıt karmasıyla eşleşti. p47 bu ay yeni kargo sözleşmesi imzalamadı. Aday, yukarıdaki yedi sıçramalı sözleşmeyi imzalayıp atomik işlem kaydını oluşturdu. Aylık ticaret AI’ının medyanı 1,5 → 15,9 ms, rota aramalarının toplam medyanı 1,0 → 2,2 ms idi. Enstrümantasyonlu tam ay p95 farkı +%1,58 çıktı. Fonksiyon zamanlayıcıları çalışma maliyetini değiştirdiğinden tablo bağımsız, enstrümantasyonsuz ölçümü kullanıyor. [Fonksiyon örnekleri](../../research/ticaret-agi0/evidence/perf/100-ay-fonksiyon.json)

İlk sürümde 100 sistemde p95 195,3 → 244,9 ms (**+%25,40**), 500 sistemin 120. ve 180. aylarında sırasıyla **+%3,45** ve **−%12,66** idi. Profilde dört küçük galaksi ayında 348 rota çağrısı, yaklaşık 18,8 ms ve 36 ortak teklifi değerlendirmesi görüldü. Taşıma kapasitesini yalnız durulabilecek limanlarda değerlendirdik. AI, ekonomik açıdan mümkün görünen hat bulduktan sonra ayrıntılı bina bütçesine bakıyor. Tablodaki tam ay süresi bütün simülasyonu içeriyor. Fonksiyon profili ayrıca ölçüldü ve alt işlev süreleri üst işlevlere dahildir. [İlk ölçüm](../../research/ticaret-agi0/evidence/gelistirme/p95-81cdfa9.log) · [100 sistem profili](../../research/ticaret-agi0/evidence/profile-100-9.json) · [500 sistem profili](../../research/ticaret-agi0/evidence/profile-500-16.json)

## Tekrarlama

Komutlar aday dalının kökünde çalışır. `P47`, yukarıdaki p47 SHA'sının ayrı çalışma ağacı, `CHECKPOINT_DIR` p47'nin kullandığı dört açılmış Save8 girdisinin dizinidir. `STARS_WORK`, ekonomik baskı araştırmasının ürettiği doğal kayıtları içerir. Girdi karmaları her kampanya ve süre kaydında saklanır. [Performans girdilerini açma](../../research/mp-rakip-doktrinler0/README.md) · [Doğal kontrol kayıtlarını üretme](https://github.com/sarsiss12-dot/Star/blob/9db6de5b8498075b730c63eb05772cc01d7c7d7e/research/ekonomik-baski0/README.md)

```sh
node tests/ticaret_agi0_test.cjs
node tests/faz96a_cargo_test.js
node tests/faz96a_integrity_test.js
node tests/faz92c_settlement_apply_test.js
node research/ticaret-agi0/eski-kayit.cjs "$P47" "$STARS_WORK/sp-100-9-404-m96.save" /tmp/eski-kayit.json
for run in natural-11 medium-99 natural-404; do
  node research/ticaret-agi0/kampanya.cjs "$STARS_WORK/$run/36.save" 60 "/tmp/aday-$run.json"
  node research/ticaret-agi0/kampanya.cjs "$STARS_WORK/$run/36.save" 60 "/tmp/p47-$run.json" "$P47"
done
STARS_TRACE_FREIGHT=1 node research/ticaret-agi0/kampanya.cjs "$STARS_WORK/medium-99/36.save" 60 /tmp/sozlesmeler-99.json
export STARS_CONTROL_ROOT="$P47" STARS_OUTPUT=/tmp/stars-ticaret-kabul
node research/perf-sinir0/focused.cjs
STARS_FOCUSED_DAY930="$STARS_OUTPUT/focused-first-1.save" node research/perf-sinir0/focused.cjs
node research/ticaret-agi0/ilk-karar.cjs "$P47" "$CHECKPOINT_DIR/500-16-11-m30.save" /tmp/ilk-karar.json
export STARS_CHROMIUM_PATH=/usr/bin/chromium
export NODE_PATH="$PWD/tests/node_modules"
for senaryo in TL H J; do
  MP8_SCEN="$senaryo" MP8_J_NATURAL=1 node tests/browser-mp8.cjs
done
STARS_BROWSER_OUTPUT="$STARS_OUTPUT/mobil" node tests/browser-96a.js
node research/ticaret-agi0/liman-yuku.cjs "$CHECKPOINT_DIR/500-16-11-m120.save" "$STARS_OUTPUT/liman-yuku.json"
mkdir -p "$STARS_OUTPUT/perf"
node research/ticaret-agi0/ay-maliyeti.cjs "$P47" "$CHECKPOINT_DIR" "$STARS_OUTPUT/perf"
mkdir -p "$STARS_OUTPUT/profil100"
STARS_PROFILE_100=1 node research/ticaret-agi0/ay-maliyeti.cjs "$P47" "$CHECKPOINT_DIR" "$STARS_OUTPUT/profil100"
STARS_TRACE_FREIGHT=1 STARS_TRACE_CONVOYS=1 node research/ticaret-agi0/kampanya.cjs "$CHECKPOINT_DIR/100-9-11-m120.save" 18 /tmp/uzun-hat.json
```

## Teslim ve açık bulgular

**Bütünleşik sürüm kabulü açık.** 500 sistemdeki iki p95 hedefi karşılandı. 100 sistemde son aday p95 süresi %27,61 arttı. Aynı kayıtta yeni bir uzun hat sözleşmesinin oluşması iki motorun iş yükünü farklılaştırıyor. Ölçülen gecikme yine oyuncunun beklediği tam ay süresine dahildir. Aday geliştirme dalında tutuldu. Yeni oyun/MP sürüm kimliği, RELEASE manifesti, ZIP, SHA-256/CRC32 ve taslak PR bu teslimde üretilmedi. Taban ve Render dağıtımı korunuyor. Deney kaynakları ve test düzeneğinin son commit’i `a91fc1a75bf782bb970f441f8722100e04096d58`. [Geliştirme dalı](https://github.com/sarsiss12-dot/Star/tree/codex/stars-ticaret-agi0)

**Sürümden önceki ilk iş** 100 sistemlik 120. ay kaydında 18 numaralı gerçek sözleşmeyi ve dört teslimat makbuzunu koruyarak tekliflerin tekrar değerlenmesi ve işlem öncesi dünya kopyasının maliyetini azaltmak. Aday aynı emirlerle aynı kayıt/RNG sonucunu vermeli. Hata enjeksiyonunda tam geri alma ve kargo stokları yeniden doğrulanmalı. Ardından aynı enstrümantasyonsuz AB/BA testi, iki büyük galaksi kontrolü ve gerçek Android’de harita sürükleme/katman geçişi tekrarlanmalı. Farklı uçlara sahip kargoların ortak ara liman yoğunluğu ve üçüncü taraf limanına doğal izin talebinin sıklığı ayrıca izlenmeli.
