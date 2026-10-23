from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1];A=R/'tests/audit96f3';P=A/'campaigns';SEEDS=[11,99,404,7,23,42,123,2026]
def read(p):return json.loads(p.read_text())
def write(name,text): (R/name).write_text(text.strip()+'\n',encoding='utf8')
data=[read(P/f'comparison-96F3-{s}.json') for s in SEEDS];v=read(A/'verification-result.json');perf=read(A/'browser-performance.json')
table='| Seed | AI canlı | Kritik devlet-ay | Sözleşme | Teslimat | Gemi | Teknoloji | Koloni |\n|---|---|---|---|---|---|---|---|\n'
for d in data:table+='| '+str(d['seed'])+' | '+' | '.join(str(d['old'][k])+'→'+str(d['next'][k]) for k in ['alive','criticalEmpireMonths','contracts','deliveries','ships','techs','colonies'])+' |\n'
war='| Seed | Enerji filo bakımı | Savaş/barış | Hedef değişimi | Tamamlanan/başarısız işaret |\n|---|---|---|---|---|\n'
for d in data:
 o,n=d['old'],d['next'];war+=f"| {d['seed']} | {o['upkeep']:.2f}→{n['upkeep']:.2f} | {o['warsStarted']}/{o['peace']}→{n['warsStarted']}/{n['peace']} | {o['objectiveChanges']}→{n['objectiveChanges']} | {o['plansCompleted']}/{o['plansFailed']}→{n['plansCompleted']}/{n['plansFailed']} |\n"
ab='| Seed | Karar mantığı | Kritik | Teslimat | Gemi | Teknoloji |\n|---|---|---:|---:|---:|---:|\n'
for seed in [11,404]:
 for name,phase in [('96F.1',None),('A','A'),('A+B','AB'),('A+B+C',None)]:
  c=read(P/f'comparison-96F3-{seed}.json')
  x=c['old'] if name=='96F.1' else read(P/f'comparison-96F3-{phase}-{seed}.json')['next'] if phase else c['next']
  ab+=f"| {seed} | {name} | {x['criticalEmpireMonths']} | {x['deliveries']} | {x['ships']} | {x['techs']} |\n"
pm=perf['rows'];timing=f"4× CPU yavaşlatmalı mobil Chromium'da, aynı gerçek seed11/gün2370 kaydı üzerinde AI turu medyanı {pm[0]['turn']['medianMs']:.1f}→{pm[1]['turn']['medianMs']:.1f} ms, p95 {pm[0]['turn']['p95Ms']:.1f}→{pm[1]['turn']['p95Ms']:.1f} ms. 100 bina tahmininin medyanı {pm[0]['forecast100']['medianMs']:.1f}→{pm[1]['forecast100']['medianMs']:.1f} ms. Her sürümde 20 ölçülen AI turu; 50 ms'yi geçen tur 0/20. Bu küçük örnek/emülasyon fiziksel Android veya bütün galaksi FPS ölçümü değildir."
write('AI-DENGE-96F3.md',f'''
# 96F.3 — AI denge ve karar karşılaştırması

Oklar kanonik 96F.1 → nihai 96F.3. Orta galaksi, normal zorluk, beş başlangıç AI, aynı seed/harita/kimlikler, hareketsiz oyuncu, kriz ve konsey kapalı. 120 ay, yarım günlük 7200 adım; ay 60 gerçek Save v8 yüklemesi. Başlangıç eşitliği assertion ile kontrol edildi. 2026'da sonradan oluşan ayrılıkçı devlet nedeniyle nihai canlı AI sayısı altı; başlangıçta ek AI veya bedelsiz kaynak verilmedi.

{table}
{war}
Kritik ölçüsü: enerji/mineral/alaşım/tüketim neti negatifken stok üç aylık açığı karşılamıyorsa bir devlet-ay sayılır. AI planlayıcısının altı aylık güvenlik sınırıyla aynı ölçü değildir. Plan işaretleri fetih/savaş zaferi sayısı değildir. Eski pacts uç-sayma özetinin kesirli sonuç riski nedeniyle ana tabloda fiziksel sözleşmeler kullanıldı.

Toplam teslimat 268→433, sözleşme 31→47, kritik devlet-ay 20→22, gemi 1282→1350, teknoloji 335→338, koloni 113→113. Filo enerji bakımı 4018,61→4376,75. Toplam artışlar bütün devletlerin daha iyi yönetildiğini kanıtlamaz.

## Kötüleşen sonuçlar

404 teslimat 96→77, teknoloji 58→55. İptal yok; yeni koşuda gün850'de tek gerçek korsan baskınıyla 16 kargo kaybediliyor. Teslimat çifti dağılımı: 4–5 56→37, 1–3 34→30, 3–4 2→0, 3–5 4→0, 1–5 0→8, 1–4 0→2. Tek baskın bütün 19 teslimatlık farkı açıklamaz. 4–5 sözleşme günleri eski 390/810/1200/1590/1950/2310/2700, yeni 390/810/1350/2130/2790. Fırsatların zamanı ve ekonomik/diplomatik gelişim yolu değişiyor. Ticaret araması, liman örneklemesi ve değerleme byte düzeyinde korunmuştur; bilinen dar arama sınırları sürüyor. Bu seed için ticaret kötüleşmedi iddiası yoktur.

42 kritik devlet-ay 0→12. Devlet3'ün enerjisi ay82–93'te kritik; eski iki kolonide santraller altı adetle katalog tavanında. Gün2340'da 265 mineral/60 alaşımlık koloni gemisi alınırken enerji stoku 116,99 ve net −6,50. Geminin enerji maliyeti/bakımı yok; yeni koloni kurulduğunda nüfus/yönetim yükü geliyor. Ay82'de üçüncü koloni, enerji neti −19,20. AI gerçek santraller kuruyor; ay94'te net +6,69, kampanya sonunda +31,08 ve stok 465,21. Bu, satın alma anı maliyeti kontrolünün gelecekteki kolonileşme yükünü bütünüyle öngörmediğini gösterir. Geçici kriz ortadan kaldırılmış gibi sunulmadı.

11 kritik dönem 11→3; yalnız devlet2 mineral ay10–12 kalıyor. Eski devlet1 alaşım ay33–37 ve mineral ay85–87 krizleri nihai koşuda yok. Buna karşılık teslimat 101→94, gemi 124→75, teknoloji 37→34, koloni 12→10; savaş sayısı 1→4. Bunlar saklanmadı. 123 koloni 17→12 ve teknoloji 40→39; 99 teknoloji 41→37. Başarı ölçüsü bütün metriklerin artması değildir.

## Ayrıştırma koşuları

{ab}
Bu dört ek 120 aylık test VM koşusu, A ve A+B mantığını karşılaştırır. Üretim dosyaları değiştirilmez. Sonraki RNG/galaksi koşulları ayrıştığı için toplam farklar tek değişikliğin saf faydası değildir. Sabit gerçek karar kayıtları, yerel mekanizmanın asıl nedensellik kanıtıdır.

## Reddedilen yıkım adayları

İlk aday son yararlı binayı da sökebiliyordu; bu izin gereksizdi. Son yararlı üretici/kapasite korunarak daraltıldı. Sonraki aday negatif kaynak netini, stok altı ayı karşılıyorsa daha da düşürebiliyordu. Seed42'de gün2220 ve 2400 santral yıkımı, negatif enerji netini ağırlaştırdı ve 34 kritik devlet-aya yol açtı. Bu kapı kaldırıldı. Nihai seçici, yuva açarken temel kaynak netini negatife geçirmez veya mevcut açığı artırmaz. Gerçek input kurtarma yıkımı ayrı mevcut yol olarak korunur. Nihai 42'de kalan 12 aylık kriz yeni koloninin yükü ve üretici inşa süresiyle ilişkilidir; aynı santral yıkımı döngüsü değildir. Pozitif enerji varken gün3450'de bir santral yıkımı mümkündür.

## Gerçek harcamalar ve kaynaklar

tests/audit96f3/campaign-analysis.json her seed için iki sürümün gerçek bina/gemi ödeme toplamlarını, 120 aylık kritik dönemlerini, son stok/netleri, ticaret zaman çizelgesini ve araştırma gelirini içerir. Kaynaklar veya gemiler test dışında verilmedi; mevcut isyan/ayrılık ve oyun olayları kapatılarak sonuç zorlanmadı. İz sınırları dolmadı. Nihai seed42 tekrarında Save hash, RNG, aylık durum ve gerçek eylemler birebir aynı.

{timing}
''')
write('FAZ96F3-TESTLER.md',f'''
# 96F.3 — Gerçek test sonuçları

Tam otomatik paket: {v['unitSuites']} paket; PASS {v['unitPass']}, FAIL 0; atlanan paket 0. Önceki 118/5776 sonucu yeni başarı diye kullanılmadı. Yeni üç paket 17 fizyoloji + 11 satın alma + 9 yıkım = 37 adlandırılmış kontrol ekler. Yedi fizyoloji ve beş ek koşulda 22 mevcut binanın iki yönlü değişimi karşılaştırılır: 528 bina durumu; bunlar 5813'e ayrıca eklenmez.

Gerçek Chromium {perf['browser']} tarayıcı paketi: PASS 25, FAIL 0, pageerror 0. Mobil 360×740 ve 740×360, masaüstü 1280×720; gerçek Canvas ve 0,12/0,18/0,35/0,7 zoom; keşif gizliliği; son savaş X dokunma/yeniden açma/yükleme/yeni rapor; federasyon kuruluşu ve davet üyeliği; civic/genetik tıklamaları; düşük/yüksek istihbarat; portre Canvas ve WebAudio smoke; 96F.1→96F.3 Service Worker güncellemesi ve çevrimdışı Save v8.

Fiziksel Android: NOT RUN. İşitsel müzik doğallığı: NOT RUN. WebAudio smoke öznel dinleme değildir. Kaynaklar değiştirilmediği için ses/portre kalitesine yeni genel başarı iddiası yok.

Kontrollü gerçek kararlar: 330/450/570 çiftlik yerine uygun yatırım/bekleme; 2370 maden yerine etkisiz çiftlik yıkımı ve gerçek tamamlanma/39 mineral hurda; 2550 koloni gemisinin 37 aylık mineral rezervini 2,1 aya indirmemesi. Olumsuz karşı örnekler son yararlı bina, negatif enerji neti, yıkım kuyruğu, gıda tüketen çiftlik, yeterli kasalı kolonileşme, gerçek üretici ve oyuncunun manuel alımını kapsar. Ayrıntılı before/after tests/audit96f3/controlled/actual-decisions.json.

Kampanyalar: nihai sekiz seed ×120 ay; ayrıca seed11 ve404 için dört A/A+B koşusu; nihai seed42 için bir deterministik tekrar. Önceden doğrulanmış sekiz 96F.1 baseline tekrar çalıştırılmadı. Ara geliştirme adayları ayrıca saklanır ve nihai başarıya eklenmez. Ay60 gerçek yükleme; negatif/NaN stok yok; trace/forensics cap dolmadı.

{timing}

İlk test/harness sorunları ve kampanyada reddedilen C adayları METHOD-NOTES.md'de açıklandı. Devam eden başarısız adlandırılmış test yok. Başarılı testler 404 ticaret düşüşünü veya 42 kritik dönemi gizlemez; bunlar açık denge riskidir.

Kanıt dosyaları: audit96f3/final/summary.json ve paket günlükleri; browser/summary.json; browser-performance.json; verification-result.json; campaign-analysis.json; campaign-comparisons.json; campaigns/comparison-*.json; controlled/actual-decisions.json. Yeni ekran görüntüleri ve bağımlılıklar ZIP'e eklenmez.
''')
write('FAZ96F3-DEVIR.md','''
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
''')
report=f'''
# STARS — FAZ 96F.3 GELİŞTİRME SONUÇ RAPORU

Tarih: 23 Ekim 2026. Üç hedefli ekonomi düzeltmesi tamamlandı. Yeni AI motoru, ticaret arama değişikliği veya yeni kaynak/gemi bonusu yok. Açık denge riskleri aşağıda gösterilmiştir.

## 1. Kaynak ve SHA-256 doğrulaması

Oyun kaynağı stars-faz96f1.zip: 33.941.787 bayt; SHA-256 85f808ba8e87a1735285f867dba2a8cc88190b9325a7480492e2eb1d069266a1; 3428 ZIP girişi/3427 manifest dosyası. Araştırma stars-faz96f2-arastirma.zip: 18.616.726 bayt; SHA-256 e18b05defcc5fea29b37769769cc5fa75b231ad8019e4adc09ec51ad98dd7d56; 151 giriş/150 manifest dosyası. İki ZIP'te SHA, CRC ve bütün manifest hash'leri PASS. Temiz 96F.1 çıkarımı kullanıldı; eski çalışma raporları kanonik ZIP üzerine yazılmadı.

GitHub başlangıç HEAD a26fed34f4366da419f1db6970a050472da19d68 ile eşleşti. Araştırma ZIP'i oyun kaynağı sayılmadı. 96F.2 bulguları tekrar sıfırdan araştırılmadı.

## 2. Düzeltilen üç temel sorun

A: Bina ihtiyacı gerçek beslenme kuralını kullanır. Lithoid/makine için gerçek gıda çıktısı sıfır olan çiftlik AI yatırım listesine girmez. Gerçek gıda üretebilen devletin faydalı/ticari çiftliği yasaklanmaz. Tahminler radikal civic, tür/genetik/devlet çarpanlarını gerçek hesap sırasıyla bir kez uygular.

B: Gemi fiyatını karşılamak tek başına yeterli sayılmaz. Gerçek ödeme sonrası negatif net kaynakların dayanma süresi; ödenmiş bina/gemi kuyrukları, bakım ve toparlanma rezervleriyle birlikte denetlenir. Sağlıklı stoklu kolonileşme, gerçek ücretli askerî üretim ve açığı gideren üretici yatırımları devam eder. Eski 96F.1 enerji bütçesi kapıları korunur.

C: Yuva açarken gerçek marjinal üretim kaybı hesaplanır. Mevcut temel kaynak açığı ağırlaştırılmaz, pozitif net gereksiz negatife geçirilmez. Etkisiz çiftlik uygun adaydır; son yararlı üretici ve son savunma/tersane/liman korunur. Pending yıkımlar sayılır. Aday yoksa diğer ihtiyaçlar denenir ve 90 günlük bounded retry kullanılır. Yıkım/yeniden yapım gerçek kuyruk ve maliyetlerle işler.

## 3. Gerçek kod değişiklikleri

- ai.js: aiBuildingDelta, fizyolojiye bağlı odak/ihtiyaçlar, aiShipPurchaseSustainable ve ilgili AI harcama yolları, aiDemolitionChoice ve yuva değiştirme dalı.
- economy.js: empireIncome(e, detail=true); tahmin için detail=false. Gerçek oyuncu/AI gelir formülü değişmedi.
- main.js: BUILD_ID 96f3.
- sw.js: stars-v96f3 cache.
- tools/verify-release.py: GitHub 96F.3 sınırlı manifest kapsamı tanıma.
- Üç yeni hedefli test paketi, kayıt yardımcıları, gerçek karar kayıtları, kampanya/tarayıcı/ölçüm betikleri ve raporlar.
- Eski testlerin build beklentileri güncellendi; assertion'lar kaldırılmadı.

commerce.js, diplomacy.js, map.js, ui.js, combat.js, köken/civic/genetik katalogları ve gerçek konvoy kuralları korunur. 96F.4'e ait arama/örnekleme/değerleme değişikliği yapılmadı.

## 4. Düzeltme öncesi/sonrası karar kanıtları

Gerçek seed11 gün330/450/570 kayıtlarında eski AI her defasında 110 mineral ödeyip çiftlik kuruyordu. Yeni AI sırasıyla 120 minerallik maden / bekleme / 120 minerallik maden seçiyor. Bunlar aynı eski kayıtların bağımsız testleridir; yeni kampanyada toplam 330 mineral bedelsiz kaldı iddiası yoktur. Gerçek marjinal çiftlik gıdası lithoid için 0, enerji etkisi −1,6/ay; tahmin artık bununla eşleşir.

Gün2370: eski karar maden yıkımı; gerçek mineral neti tamamlanmada 12,87117→−0,49543. Yeni karar çiftlik yıkımı; mineral neti 12,87117 olarak kalır. Kaynak iadesi emir anında değil tamamlanınca, mevcut %35 hurda kuralıyla 39 mineral.

Gün2550: eski koloni alımı stok 280,91771→15,91771, dayanma süresi 37,01789→2,09755 ay. Yeni AI bu alımı erteler; stok 280,91771, dayanma süresi 37,01789. Yeterli stok karşı örneğinde gerçek 265 mineral/60 alaşım ödeme ve koloni gemisi siparişi devam eder.

Yedi fizyolojide ve beş ek bonus/koşulda 22 binanın ekleme/yıkımı gerçek empireIncome ile karşılaştırıldı. Port/federasyon gibi doğrusal olmayan etkilerde gerçek hesap kullanılır; gölge devlet ve try/finally ile oyun durumu geri konur. Tahmin save/RNG değiştirmez.

## 5. Sekiz seed karşılaştırması

{table}
{war}
120 ay, aynı harita/başlangıç kimlikleri/ayarlar, ay60 Save v8. 2026'daki altıncı canlı AI oyun içindeki yeni ayrılıkçı devlettir. Plan sayaçları fetih veya zafer sayısı değildir.

Toplamlar: kritik devlet-ay 20→22; teslimat 268→433; sözleşme 31→47; gemi 1282→1350; teknoloji 335→338; koloni 113→113. Tüm seed'lerin veya göstergelerin iyileştiği iddia edilmez.

## 6. İyileşen ve kötüleşen sonuçlar

11'in kanıtlanan devlet1 krizleri yok; kritik toplam 11→3. Buna karşılık gemi, teknoloji, koloni ve teslimat daha düşük. 2026 teslimat 0→34; 99 8→36; 7 21→30; 123 22→68.

404 teslimat 96→77, sözleşme 12→11, teknoloji 58→55. Yeni tek korsan baskınında 16 kargo kaybı var; bütün 19 teslimat farkı buna atfedilmedi. Çiftler 4–5:56→37, 1–3:34→30, 3–4:2→0, 3–5:4→0, 1–5:0→8, 1–4:0→2. A-only 96, A+B 92, A+B+C 77 teslimat verdi. Yeni ekonomik kararların sonraki dünya/RNG yolunu değiştirmesi ve korunan ticaret arama sınırları birlikte etkili; tek nedene kesin pay verilmedi. “404 daha kötüleşmedi” denmiyor.

42 kritik 0→12. Enerji açığı varken yeni koloni kurulmasının ek giderleri geliyor; mevcut iki koloninin santralleri tavanda. AI gerçek üretici kuruyor, ay94'te pozitife dönüyor; final enerji neti +31,08 ve stok 465,21. Mevcut alım kapısı gelecekteki koloni yükünü tam öngörmez. Bu açık stratejik risk olarak kalır.

İlk C adaylarında iki gerçek sorun bulundu: son yararlı kopyayı gereksiz sökme ve negatif kaynak netini stok tamponuyla daha da bozma. Bunlar daraltıldı, olumsuz testler eklendi. 42'deki aday 34 kritik ay nihai 12'ye düştü. Ara adaylar nihai başarı sayılmaz.

## 7. Stratejik AI tutarlılığı

Dokuz hedef, diplomatik hafıza, sefer, federasyon/vassallık ve ticaret korunur. AI herkesi aynı profile yönelten bonus almaz. Gerçek ücretli üretim/araştırma/kolonileşme, savaş ve toparlanma devam eder. 42'nin santral yatırımları ve krizden çıkışı gerçek oyun durumunda ölçüldü; sadece hedef etiketi başarı sayılmadı.

{ab}
Bu dört ayrıştırma kampanyası, yerel sabit karar testlerine ek kanıttır. Sonraki RNG farklılıkları tek başına nedensellik veya saf denge kazancı değildir. Kaynaklar ve gemiler test dışı verilmedi.

## 8. Testler ve performans

Tam regresyon: 121 paket; PASS 5813, FAIL 0; atlanan paket 0. Yeni üç paket 17+11+9=37 adlandırılmış kontrol. 528 marjinal bina durumu ayrıca test sayısına eklenmez. Önceki sürümün 5776 sonucu yeniden çalıştırılmadan devralınmadı.

Gerçek Chromium: PASS25, FAIL0, pageerror0. Native Canvas paketleri, gerçek Canvas zoom/gizlilik, mobil dokunma, federasyon kuruluşu, bilim keşif regresyonları, son savaş X ve gerçek üyelik işlemleri geçti. Fiziksel Android ve öznel müzik dinleme NOT RUN.

Nihai sekiz kampanya, dört A/A+B kampanyası ve bir nihai seed42 deterministik tekrarı tamamlandı. Önceki sekiz baseline yeniden kullanılabildi. Reddedilen geliştirme adayları ve başarısız harness başlangıçları METHOD-NOTES.md'de belgeli; bunlar nihai koşu/test toplamına başarı olarak eklenmedi.

{timing}

## 9. Save v8 ve PWA uyumluluğu

Save sürümü 8. Sekiz kampanyada ay60 serialize/deserialize, nihai seed42 tekrarında son Save SHA/RNG/aylık durum/eylem izi eşitliği PASS. Eski kayıtlar kaynak, civic, genetik veya binaları silinerek düzeltilmez. Yeni AI kararı sonraki turlarda geçerli olur. Gerekli kısa retry mevcut aiTalk alanında saklanır.

Gerçek tarayıcıda 96F.1 cache→stars-v96f3 güncellemesi, eski v8 kaydı açma ve çevrimdışı shell yükleme PASS. Fiziksel Android PWA kurulumu/uzun oturum performansı ölçülmedi.

## 10. ZIP ve dosya bütünlüğü

Hedef stars-faz96f3.zip. Paketlemede tam RELEASE-MANIFEST, bütün dosya SHA-256'ları, CRC, gerekli oyun/PWA dosyaları ve temiz açılmış paket smoke'ları denetlenir. ZIP boyutu ve SHA-256, arşivin kendi hash'ini değiştirmemek için son sohbet tesliminde verilir. Dosya envanteri DEGISEN-DOSYALAR-96F3.json.

## 11. GitHub yayın sonucu

Nihai yayın durumu GITHUB-96F3-YAYIN.json ve son sohbet raporundadır. Yayın öncesi main tekrar kontrol edilir; ayrı commit ve expected_sha korumasıyla yalnız fast-forward yapılır. İlgisiz uzak dosyalar korunur. GitHub sınırlı manifesti tam ZIP manifesti değildir.

## 12. Açık riskler ve 96F.4 planı

- 404 ticaret gerilemesi ve 42'nin geçici kritik enerji dönemi açıkça kalıyor.
- Koloni kurulduğundaki gelecekteki nüfus/yönetim yükü alım kapısında tam modellenmiyor.
- Çok kolonili/federasyonlu gölge gelir hesaplarının gerçek Android maliyeti ayrıca ölçülmeli.
- Güvenli ikame yoksa her kolonide mutlaka bir bina söküleceği garanti edilmez; sınırlı tekrar ve diğer ihtiyaçlar kullanılır.
- 96F.4: karşılıklı ihtiyaca uygun ihracat adayları, liman örnekleme/önbellek bütçesi, gerçek tüketim/rezervle tutarlı mal değerlemesi. Bu fazda hiçbiri değiştirilmedi.
- 96G veya 96F.4 geliştirmesi otomatik başlatılmadı.
'''
write('FAZ96F3-RAPOR.md',report)
print('Four 96F.3 reports generated from actual final evidence.')
