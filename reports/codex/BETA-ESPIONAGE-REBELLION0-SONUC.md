# BETA-ESPIONAGE-REBELLION.0 — tek parça sonuç raporu

10 Kasım 2026. **Güncel teslim p21 geliştirici adayıdır. Gerçek kullanıcı kabulü yapılmadı; fazın bütünü ve görevler TAMAMLANDI değildir.** Casusluk çalışma alanı, ayrıştırılmış iç risk uyarıları, iki gerçek maliyetli müdahale ve AI kullanımı uygulanıp hedefli test edildi. Özgün aralıklı selfleet/dealSend/fedFoundStart hatasının kesin kökü hâlâ açık. İlk FAIL kayıtları korunur. Önceki p20 teslimi tekrar yazılmadı; bu devamda yanlış tek-tip risk etiketi düzeltildi, M5/M6 native kabulü ve AI stres kök nedeni tamamlandı. İlk p20 kanıtları sürümüne göre aşağıda korunur; p21 son kontrolleri bölüm20’dedir.

## 1. Kanonik kaynak ve bitiş

- Depo `sarsiss12-dot/Star`; dal `codex/stars-beta-espionage-rebellion0-ux`.
- Fazın ilk doğrulanmış p19 başlangıç/rapor HEAD'i `6648bf90a5c7226fa93d0e1cc6703776425d62cd`; p19 kod/paket `b72dd0c0a362ba95d05b577be30388d787632ecd`.
- Bu devam isteğinde GitHub yeniden kontrol edildi. Aynı fazın daha yeni **p20 HEAD'i `3aacf7d648fcea9603e2c57232f2689c0feabfb4`** kanonik devam tabanı alındı. p19'a dönülmedi ve p20 özellikleri tekrar geliştirilmedi. Eski main `4296ad2d43fedce6264020b3761f50f1839fd836` değişmedi.
- Korunan p20 runtime/paket `96a1797df1914328ea3f9b032e849466416e7a4c`; p20 son MP kaynak `c20bd181addd66318bbfba804109197cf1aa69e8`.
- **Güncel p21 kod/paket HEAD'i `257d01dd06cec92b981abeccc6e5419b8a0c421a`**, uzak doğrulaması `continuation-3aacf7d/remote-code-head.txt`.
- Rapor/kanıt commit'inin nihai SHA'sı son yanıtta bildirilir; belge kendi SHA'sını yazmak için yeni commit zinciri oluşturmaz.
- Oyun **96h10p21**, PWA **stars-v96h10p21**, MP **MP.8.9b16**. Save8 **v8**, MP paket **4**, protokol **1** korunur. Tek ürün değişikliği salt-okunur risk etiketidir; sürüm/PWA/MP kimlikleri birlikte güncellendi. p20 paket kabulü mevcut katı bütünlük/yetki kontrolleri korunarak açıkça eklendi. Canlı roller aynı p21 kaynaklarını kullanmalıdır; karışık canlı istemci uyumu veya eski sürüme dönüş iddia edilmez.

## 2. Başlangıç envanteri ve korunan işler

[Başlangıç envanteri](BETA-ESPIONAGE-REBELLION0-ENVANTER.md) mevcut kod ile yeni kapsamı ayırır. İlk teslimde p19 rapor/envanter, p17/p18 raporları, ilk dokunma kayıtları ve mevcut testler okundu. Bu devamda p20 raporu/kod/kanıtlar karşılaştırıldı. İlk teslimdeki Issue #33 okuma denemesi `Forbidden` döndürdü; aynı oturumdaki engel için tekrar yetki arama döngüsü başlatılmadı; güncel pano metni doğrulanamadı. Önceki doğrulanmış raporlar kanıt olarak kullanıldı; bunlar kullanıcı onayı sayılmadı.

p15 görüş/sensör/sağlık/olay/rota; p16 federasyon FIFO/hız; p17 koloni çalışma alanı, isyan açıklaması ve uzaktan inşa; p18 Savaş Merkezi/koalisyon; p19 Yağmacı, bağımsız AI koalisyonu, düzenlenebilir kuruluş ve acil savunma yeniden geliştirilmedi. İlgili koruma testlerine alındı.

## 3. P0 etkileşim kusurları: kanıt ve belirsizlik

**Özgün aralıklı vakalar açık.** Aşağıdaki panel/ACK ve birleşik6/7 sonuçları ilk p20 tesliminin kanıtlarıdır; p21 native ek kabulü bölüm20’de ayrıdır. Başlangıçtaki gerçek üç Chromium/mobil koşusu6/0 ve aday birleşik mobil7/0/PC7/0 sonuçları, tarihsel timeout'ların kesin çözüldüğü anlamına gelmez. Timeout artırılmadı; force-click, DOM üzerinden JS click veya assertion kaldırma kullanılmadı.

Ayrı, somut bir kusur yeniden üretildi: federasyon/diplomasi yüzeyi açıkken gerçek `UI.act('tab','intel')` eylemi eski `diploPane.show` katmanını bırakıyordu. Casusluk hedefi görünürken eski katman pointer'ı tutabiliyordu. `panel-before.log` FAIL ve ilk native `mp-ui-first.log`3/1 bunu gösterir. `case 'tab'` yalnız açık kullanıcı sekme geçişinde mevcut `closeDiplo` yolunu çalıştırır; eski taslak saklama davranışı korunur. Programatik `UI.tab`/arka plan refresh yeniden yazılmadı. `panel-after.log` ve `mp-panel-fixed.log`4/0 sonrasını gösterir.

Casusluk yanıtı artık gönderildiği hedef ve `_spyEpoch` ile bağlıdır. Hedef/sekme değişmiş veya başka modal açılmışsa geç ACK eski operasyon penceresini açmaz; gerçek host sonucu kısa bildirim olarak kalır. PC ve son mobil ER0 testinde gerçek host sonucu paketi kontrollü olarak geciktirildi, native komut verildi, hedef değiştirildi ve başka pencere açıkken gerçek paket bırakıldı. Yeni pencere değişmedi. Bu ağ gecikmesi test düzeneğidir; sahte host sonucu üretilmedi. Özgün dealSend/selfleet köküyle aynı kusur olduğu iddia edilmez.

Ek tanıdaki ilk masaüstü5/2, testin var olmayan `#toast` elemanını okuması ve bunun pageerror kaydına girmesiydi. `S.seenResults` ile gerçek yanıt işlenmesini bekleyen denetim kullanıldı; modalın birebir korunması assertion'ı kaldı. Son koşu7/0. İlk hata `mp-desktop-final.log` içinde korunur.

## 4. Casusluk UX: önce ve sonra

Önce mevcut üç bölüm hedef seçimlerini tekrarlatıyor; ağlar listesi, operasyon hedef şeridi ve özel gruplar uzun kaydırma oluşturuyordu. Mevcut 12 standart operasyonun, özel operasyonların ve dosya motorunun yerine yeni motor yazılmadı.

Şimdi aynı STARS panelinde:

- **Ağlar / Operasyonlar / Dosyalar** arasında kalan tek, kaydırılabilir hedef alanı vardır. Bilinen/izinli hedefin adı, ağ seviyesi ve sahadaki casusu görünür. Hedef değişimi açık onayı geçersizleştirir.
- Ağlar seçilen hedefin mevcut dosyasını ve ajan yönetimini gösterir. Yinelenen tam hedef listesi kaldırıldı.
- Standart operasyonlar gerçek **ekonomi/lojistik**, **siyasi baskı**, **bilgi/teknoloji** kategorilerinde filtrelenir. Var olmayan operasyon eklenmedi.
- Mevcut `opQuote` maliyet, seviye, uygunluk ve engel açıklamaları korunur. İfşa yüzdesi başarı ihtimali gibi sunulmaz. Özel operasyonlar mevcut ayrı gruplarını kullanır.
- Dosyalar mevcut bilinen/şüpheli fail ayrımı, kendi kayıtları ve soruşturma yollarını kullanır. Gizli savunma değeri veya bilinmeyen fail eklenmedi.
- Misafir başarıyı yerel karar olarak uygulamaz. Gerçek host ACK ve sonucu beklenir. Native B→AI Sahte İstihbarat işleminde host70 etki kesti; sonuç B ekranına ulaştı. Eski hedefin bayat onayı yeni komut göndermedi.

**Korunan kurallar:** `OPS`, başarı/ifşa zarları, maliyetler, `runOp`, özel operasyonlar, host kimliği ve görünürlük kapıları değiştirilmedi. Bütün 12 operasyonun ve özel operasyonların bütün rol varyantları bu fazda native tarayıcıdan tek tek denenmedi. Geniş özel operasyon/dosya kabul matrisi açık kalır.

**Propaganda ve vasalın etik/doktrin dönüşümü:** mevcut isyan/suikast/siyasi baskı ve soruşturma imkânları sunulur. Genel, rızalı ve karşı tedbirli doktrin/etik dönüştürme motoru mevcut değildir; böyle bir sahte buton eklenmedi. Ayrı siyasi görev olarak bırakılır.

## 5. Üç farklı isyan motorunun gerçek nedenleri

| Motor | Gerçek mevcut kural | Yeni görünüm |
|---|---|---|
| Koloni ayrılıkçılığı | Normalde en az6 sistem, başkent dışı koloni, istikrar40 altı; normal ay+1, sağlıklı işlenen ay−2; eşik30. Küçük devlet/dış kışkırtma ve mevcut korumalar ayrı koşullardır. | Kendi kolonisinin sayacı, yönü, aşaması, gerçek hedef bileşenleri ve müdahale |
| İdeolojik bölünme | En az4 sistem, ortalama istikrar25 altı;48 aylık sayaç; mevcut dış baskı hızlandırması ve toparlanma−2 | Ayrı ortalama, düşük koloniler ve12/24/40 uyarıları; yerel30 sayacına çevrilmez |
| Vasal bağımsızlığı | Gerçek öfke/sadakat, güç oranı, sözleşme ve mevcut aylık değerlendirme | Kendi vasalları/kendi vasal durumu;50/70 özel uyarı; kesin isyan tarihi yok |

Koloninin hedef istikrar hesabı `economyTick` içinden **aynı formül/sıra korunarak** `colonyStabilityTarget` içine alındı. Normal motor `mutate=true` kullanır; salt-okunur açıklama mevcut huzursuzluk/savaş izi süresini azaltmaz. Temel/yaşanabilirlik, kaynak krizi, tüketim malı kıtlığı, karakter, yerel baskı, bombardıman izi, vali/itibar, yönetim alt sınırları ve etkin müdahale aynı gerçek hesap üzerinden gösterilir. Yeni paralel istikrar hesabı yoktur. Açıklama dış müdahale failini söylemez.

Eski “ayda−3” metni **−2** yapıldı. “Kesin X ayda kopuş” yerine mevcut normal ilerlemede kalan sayaç adımı ve koşulların değişebileceği yazılır. Koruma sayaç dondurma olarak sunulmaz; gerçek mevcut−2 davranışı anlatılır. Yeni manuel sıkıyönetim düğmesi bulunmaz. p21 ayrıca yalnız schism/vasal riski varken “0 kolonide isyan riski” yazan listeyi gerçek risk türleriyle etiketler; üç motorun sayaçları değişmez.

## 6. Kalıcı erken uyarı ve kişisel bildirimler

- Yerel sayaç1–4 risk listesinde başlangıç;5 erken;15 ciddi;24 kritik;30 gerçek kopuş motorudur.30 eşiği değişmedi.
- 15'te p17'nin `secessionNotice` kaydı yeniden kullanılır; aynı aşamaya ikinci haber eklenmez.5/24 yeni kişisel haber üretir. Bir sıçramada24'e gelinirse daha düşük aşama ayrıca üretilmez.
- Koloni uyarısında sahip, bölüm ve ulaşılan en yüksek aşama saklanır. Aynı aşama aylık/yükleme tekrarında yeniden üretilmez; sayaç sıfırlanıp yeni bölüm başlarsa yeni uyarı verilebilir.
- Üst çubukta `⚠ N KRİZ`, açılır listede riskli koloni sayısı ve **İç istikrar** bağlantısı sürer. Kartı kapatmak risk göstergesini kaldırmaz. Sebep bittiğinde canlı risk/kart temizlenir.
- Mevcut haber/gelen kutusu ve mevcut oyuncu+saveId sonuç tercihleri kullanılır; yeni genel bildirim motoru yoktur. Kendi özel haberinden kart oluşturulur, otomatik pause istenmez. Aynı koloninin eski alt aşama kartları tekrar yığılmaz.
- Schism ve vasal uyarıları ayrı anahtar/aşama taşır. Host0 kontrolüne sıkıştırılmaz; gerçek insan sahibine yönlendirilir.
- Misafir vasal sadakati, gizli senyör filo kabuğundan yeniden hesaplanmaz: host'un yalnız izinli özet DTO'su kullanılır.

Ani dış kışkırtma aynı ay kopuşa yol açabilir. Bu sistem oyuncuya garanti müdahale süresi vermez. Çok büyük uyarı geçmişi/cihaz tercih sınırı için ayrı uzun süreli stres kabulü yapılmadı; mevcut sonuç tercihi sınırlı saklama modelini kullanır.

## 7. Gerçek müdahaleler ve maliyetler

| Müdahale | Gerçek bedel | Gerçek etki | Süre / bekleme | Bedel ve sınır |
|---|---|---|---|---|
| Halkı yatıştır |160 mineral +80 yiyecek +25 etki | Şimdi istikrar+6; hedef+10 |180 gün /360 gün tekrar bekleme | Kaynak krizi veya dış baskı kendiliğinden kalkmaz |
| Yerel özerklik |80 etki | Hedef+12 |360 gün /720 gün tekrar bekleme | Aynı sürede yerel brüt kaynak üretimi×0.85; girdi/bakım azaltılmaz. Kovan ve arındırıcı yönetim reddeder |

Aynı koloni politikasının bekleme süresi iki aile için ortaktır; sürekli destek yığılması yoktur. Bedel her onayda tekrar doğrulanır. Sahipliği, hedefi, karar türünü, önceki politikayı ve `shareRev` revizyonunu bağlayan damga kullanılır. Bedel yalnız gerçek başarılı uygulamada bir kez kesilir. Tekrar ağ komutu, yeni cid ile eski karar, Save8 sonrası tekrar, yetersiz kaynak ve başka oyuncu sahipliği reddedilir.

`col.crisisPolicy` isteğe bağlı v1 alanıdır; başlangıç/bitiş/cooldown/owner/tür doğrulanır. Etki bitince hedef ve üretim eski kurala döner; cooldown bitmeden yeni müdahale olmaz. Eski damga sonraki dönemde de geçmez.

Ek güvenlik testinde, yalnız captureSystem'de temizlemenin doğrudan sahiplik devrine yetmediği kanıtlandı (`ownership-before.log`). Temizlik mevcut **territoryOwnerSet** içine taşındı. Gerçek devirde eski politika/uyarı gider, sahip geri dönse bile eski onay revizyonu geçmez. Yükleme/kurulum gerçek fetih gibi işlenmez.

Mevcut kaynak/vali/Birlik Ritüelleri/soruşturma/varsa sıkıyönetim koruması ekranda anlatılır. Yeni bedelli sıkıyönetim ve uzun vadeli tepki motoru geliştirilmedi; üçüncü yarım seçenek yayımlanmadı. Ekonomik ve siyasi iki farklı yol hazırdır.

## 8. AI entegrasyonu ve ölçülen sonuçlar

Mevcut aylık `aiTurn` içinde, gözlemden sonra bir sınırlı kriz değerlendirmesi vardır. Yeni genel plan motoru yoktur. Kendi kritik yerel sayaçlarını; schism12 üstünde kendi çok düşük istikrarlı kolonilerini değerlendirir. Ekonomik plan kritikse pahalı yeni eylemi atlar; en fazla bir uygulanabilir kararı aynı gerçek quote/bedel/cooldown ile verir. Mevcut otorite etiği ekonomik destek/özerklik tercihinde etkilidir; doktrin/ekonomi/federasyon/savaş algoritmaları yeniden dengelenmedi. Yeni RNG çekilmez.

**Mikro karşılaştırma:** aynı baskıda gerçek hedef35, istikrar38, sayaç24. AI destekli koloni üç gerçek ekonomi ayından sonra **istikrar45/sayaç18**; müdahalesiz kontrol **35/27**. Gerçek ödeme vardır. Yoksul AI ödeme/bonus üretemez. Schism riski yerel secession olmadan da değerlendirilir.

**Gerçek aylık kampanya:** seed23, aktörAI3, orta galaksi/8AI başlangıcı; kontrollü koşulda diğer normal AI kararları pasiftir. Sekiz ay gerçek `dailyTick`/`monthTick`/`aiTurn` çalışır. AI930/960/990 günlerinde üç koloniye özerklik verir (3×80 etki, normal diğer ekonomik hareketlerden ayrı politika bedeli). İstikrar28→52, ayrılık sayacı5→9→1; toplam stok/aylık ölçüler `ai-controlled-eight/campaign.json` içindedir. Bütün sayaç değişimini yalnız politikaya bağlama iddiası yoktur; normal toparlanma da işler. Politikanın ayrı katkısı mikro kontrolle ölçülür.

**İlk başarısızlıklar korunur:** tam etkin AI'lı altı aylık deneyde istikrarın dördüncü ay37’den28’e düşmesi (normal+3 toparlanmaya karşı12 puanlık şok) görüldü ve kurtarma assertion'ı FAIL oldu (`ai-all-active-diagnostic.json`, `ai-campaign-first-fail.log`). İlk raporda bu düşüşün kaynağı kanıtlanamamıştı. Bu devamda aynı seed23/8AI dünyası ikiz VM ile ölçüldü: **AI3,1007. günde sistem35’te kalıntıyı uyandırıp +520 mineral alırken mevcut doSurvey kuralıyla bütün kolonilerinde−12 istikrar kaybetti.** Ölçüm sarmalı ile kontrolün ham Save8/RNG’si altı ay her ay birebir eşit; `continuation-3aacf7d/ai-trace/trace.json` ve `ai-trace.log` kanıttır. Bu mevcut keşif riski değiştirilmedi. İlk kurtarma assertion’ının FAIL kaydı korunur; evrensel AI kurtarma başarısı olarak sayılmaz. Diğer AI'lar pasifken altı ay sonunda sayaç9'dan5'e dönüp başlangıca eşit kaldığı için kurtarma assertion'ı yine FAIL oldu. Normal istikrarın ayda en fazla3 toparlanması nedeniyle iki ay daha ölçüldü; assertion gevşetilmedi, motor değiştirilmedi. Sekiz ay sonucu1'dir. Müdahale başarısız kalırsa normal isyan motoru durdurulmaz.

## 9. Host / katılımcı / gizlilik

H tek otoritedir. B'nin UI komutları `internalQuote` ve `internalPolicy` ile host locate/ownership denetimine girer; aktör istemciden kabul edilmez. Aynı sys/planet/policy türü ve opak damga son uygulamada yeniden doğrulanır. Misafir sonucu host ACK gelmeden “uygulandı” yapmaz. Geç yanıt başka modalı kapatmaz. Kendi ortak STARS UI'sı kullanılır.

B kendi politikası ve uyarı owner'ınıπ0 görür. C'nin aynasında B'nin gizli politikası, huzursuzluk faili veya şüpheli siyasi ayrıntısı bulunmaz. Vasal özetleri yalnız ilgili senyör/vasala gider. Yeni incelemede kendi gezegeninin mevcut `martial_law` / `recent_conquest` alanlarının aynadan atıldığı kanıtlandı (`protection-before.log` FAIL). Yalnız kendi gezegeni için iki sayısal alan aktarıldı; yabancı kolonilere açılmadı. Son native testte B, gerçek korumalı kolonisinin azalan sayaç yönünü gördü.

| Kabul senaryosu | Gerçek sonuç |
|---|---|
| M1 B casusluk ekranı → gerçek operasyon → host bedeli/ACK | PASS; Sahte İstihbarat70 etki |
| M2 hedef değişimi / eski onay / geç gerçek ACK | PASS; eski komut gönderilmez, yeni modal korunur |
| M3 B'nin kalıcı risk HUD'si, C gizliliği | PASS hedefli native/model kapsamı |
| M4 gerçek müdahale ve tekrar reddi | PASS; relief native MP, autonomy native SP + MP motor |
| M5 native dış kışkırtma → gizli fail zinciri | p21 PASS: H gerçek düğmeden120 etki öder, B’de−25 istikrar/+10 sayaç; B’de fail bilinmiyor, C’de özel veri yok |
| M6 schism artışı ve özel12/24/40/yükleme | p21 PASS kontrollü native: ayrı12/48 ekranı, gerçek motor47’de bölünmez/48’de bölünür, yerel sayaçlar0; doğal48ay kampanya NOT RUN |
| M7 AI müdahalesi ve risk sonucu | PASS kontrollü mikro/8ay; tüm etkin AI6ay kurtarma FAIL |
| M8 tüm tarayıcı/relay kapat → yeni oda → aynı oyuncular | p20 ve p21 ayrı R0–R4 PASS5/0; önceki kart/ödeme tekrarlanmadı |

Bu fazda yeni casusluk/kriz ekranlarının bütün host↔B↔C rol değişimi kombinasyonları denenmedi. B/C ayrı oturum ve yetki kontrolleri vardır; tam fiziksel kabul yoktur.

## 10. Save8, RNG ve salt-okunur yollar

İlk p20 tesliminde beş seed **11/23/42/99/404**, gerçek p19 kontrol runtime’ının ürettiği Save8 kayıtlarından üçer ay: aday ve p19 kontrolünde **ham serialize baytları ve RND_STATE** her ay eşit. Yeni mekanikler kullanılmayan kontrol içindir; meşru politika uygulandıktan sonra kaydın eski sürümle aynı olması beklenmez. p21 için aynı beş seed×üç ay p20 kontrolüyle yeniden ham Save8/RNG eşitliği doğrulandı; gerçek p20 paketi p21’de açıldı, bozuk bütünlük reddedildi. Kontrol revizyonu `continuation-3aacf7d/p20-compat-final/control.json` içindedir.

Yeni alanları olmayan eski kayıt güvenle okunur; boş alanlar bütün eski dünyalara doldurulmaz. Bozuk politika/uyarı yüklemesi mevcut dünya/RNG'ye dokunmadan reddedilir. Gerçek risk/quote/istikrar sorguları **ve InternalUI risk/koloni ekranlarının açılıp kapanması** ham Save8/RNG'yi değiştirmez. Bildirimi okuma/gizleme tercihleri mevcut UI kayıt davranışıdır; siyasi etki veya RNG üretmez. Manuel SP modalı mevcut modal duraklatma davranışını kullanır; otomatik uyarı `pause:false` gönderir, MP'de ortak hızı zorlamaz.

Gerçek soğuk MP paket/yeni oda akışında politika `started900/until1080/after1260`, owner ve uyarı bölümü, kaynaklar birebir kaldı. Uyarı HUD'si geri geldi, aynı kart yeniden oluşmadı. B'nin gizli `unrest.by` alanı yok; C politikayı almadı. `cold/R/er0-cold.json` kanıttır. Pakete yeni gizli operasyon deposu veya kullanıcı kaydı üstüne yazma eklenmedi.

## 11. Hedefli komutlar ve kanıtlar

Aşağıdaki yolların kökü `reports/codex/evidence/beta-espionage-rebellion0/`dir. `STARS_OUTPUT` belirtilen alt klasördür. Aşağıdaki ilk geniş koşular p20 tesliminin kayıtlarıdır; yeni p21 komutları bölüm20’de listelenir. Tarayıcı komutlarında `STARS_CHROMIUM_PATH=/usr/bin/chromium` kullanıldı; timeout'lar mevcut8s/30s değerlerinde kaldı.

| Gerçek komut / koşul | Sonuç | Kanıt |
|---|---|---|
| `node tests/beta_espionage_rebellion0_test.cjs` |11/0 | `core-screen-release.log` |
| `node tests/beta_espionage_rebellion0_mp_test.cjs` |6/0 | `mp-core-release.log` |
| `STARS_OUTPUT=.../equivalence-release node tests/beta_er0_equivalence.cjs` |6/0 | `equivalence-release.log`, `equivalence-release/compat.json` |
| `STARS_OUTPUT=.../sp-final node tests/browser-beta-er0-sp.cjs` |5/0 | `sp-final.log`, `sp-final/results.json` |
| `ER0=1 FEDAI0=1 MPP0=1 WAR_CENTER0=1 MP73_ONLY='B1 \|B2 \|P0 \|ER0 \|FAI0 \|WC0 \|sayfa' node tests/browser-mp73.cjs` | mobil7/0 | `mp-mobile-final.log` |
| Önceki satır + `MPP0_DESKTOP=1` | PC7/0 | `mp-desktop-corrected.log`, `mp-desktop-corrected/er0-ui.json` |
| `ER0=1 MP73_ONLY='B1 \|B2 \|ER0 \|sayfa' node tests/browser-mp73.cjs` | son kaynak/koruma4/0 | `mp-protection-release.log` |
| `ER0_R=1 MP8_SCEN=R MP8_MONTHS=6 node tests/browser-mp8.cjs` |5/0 | `cold.log`, `cold/R/mp8-R.json` |
| `STARS_OUTPUT=.../ai-controlled-eight node tests/beta_er0_campaign.cjs` |1/0 | `ai-controlled-eight.log`, kampanya JSON |
| `python tools/package-release.py` ve `--out /tmp/stars-p20-repeat.zip` | iki üretim aynı | `package-first.json`, `package-repeat.json`, `release-verified.json` |
| `python tools/verify-release.py` |19 dosya PASS | `manifest-check.log` |

Başlangıç P0 komutu: `FEDAI0=1 FEDAI0_AUDIT=1 MPP0=1 WAR_CENTER0=1 MP73_ONLY='B1 |B2 |P0 |FAI0 |WC0 |sayfa' node tests/browser-mp73.cjs` →6/0 (`p0-before.log`). İlk panel FAIL'leri, fixture FOW hatası (`core-first.log`), yabancı koloninin tamamen gizli olması nedeniyle yanlış dereference (`mp-first.log`), sıcak önbellek/pure test kapsam ayrımı (`mp-vassal-first-fail.log`), eski cache ile kurulan istikrar kontrolü (`ai-comparison-first-fail.log`) ve sahiplik/koruma FAIL'leri silinmedi. İstikrar karşılaştırmasında gerçek başlangıç modları `recalcMods` ile tutarlı kuruldu; hedef35 ve asıl risk farkı assertion'ları korundu.

Büyük tanı JSON'ları gzip `mtime=0` ile sıkıştırıldı; orijinal SHA256/boyut/yol listesi `compressed-evidence.json` içindedir. FAIL verileri atılmadı.

## 12. İlgili regresyon komutları

İlk21 ilgili Node paketi exit0. Son sahiplik düzeltmesinden sonra koloni/isyan/Yağmacı/PERF1/PERF2/soğuk bildirim tekrarlandı; son mirror düzeltmesinden sonra MP6 ayna8/0 tekrarlandı. Her küçük CSS değişikliğinde bütün kampanya başlatılmadı.

| Komut | Sonuç | Kanıt |
|---|---|---|
| `node tests/mp64_spy_test.js` | 7/0 | `regression/mp64_spy_test.js.log` |
| `node tests/beta_board2_privacy_test.cjs` | 1/0 | `regression/beta_board2_privacy_test.cjs.log` |
| `node tests/beta_board2_colony_test.cjs` | 5/0 | `regression/beta_board2_colony_test.cjs.log` |
| `node tests/beta_board2_rebellion_test.cjs` | 1/0 | `regression/beta_board2_rebellion_test.cjs.log` |
| `node tests/beta_board2_remote_test.cjs` | 2/0 | `regression/beta_board2_remote_test.cjs.log` |
| `node tests/beta_board2_ack_test.cjs` | 1/0 | `regression/beta_board2_ack_test.cjs.log` |
| `node tests/mp6_mirror_test.js` | 8/0 | `regression/mp6_mirror_test.js.log` |
| `node tests/mp_p0_guest_test.cjs` | 7/0 | `regression/mp_p0_guest_test.cjs.log` |
| `node tests/mp_p0_decisions_test.cjs` | 7/0 | `regression/mp_p0_decisions_test.cjs.log` |
| `node tests/mp_p0_motion_test.cjs` | 3/0 | `regression/mp_p0_motion_test.cjs.log` |
| `node tests/mp_p0_notice_test.cjs` | 3/0 | `regression/mp_p0_notice_test.cjs.log` |
| `node tests/mp73_council_test.js` | 14/0 | `regression/mp73_council_test.js.log` |
| `node tests/beta_war_fix0_test.cjs` | 17/0 | `regression/beta_war_fix0_test.cjs.log` |
| `node tests/beta_fed_ai0_coalition_test.cjs` | 8/0 | `regression/beta_fed_ai0_coalition_test.cjs.log` |
| `node tests/beta_fed_ai0_raider_test.cjs` | 4/0 | `regression/beta_fed_ai0_raider_test.cjs.log` |
| `node tests/beta_fed_ai0_edit_test.cjs` | 6/0 | `regression/beta_fed_ai0_edit_test.cjs.log` |
| `node tests/beta_fed_ai0_emergency_test.cjs` | 5/0 | `regression/beta_fed_ai0_emergency_test.cjs.log` |
| `node tests/beta_fed_ai0_mp_test.cjs` | 4/0 | `regression/beta_fed_ai0_mp_test.cjs.log` |
| `node tests/beta_fed_ai0_campaign_test.cjs` | 3/0 | `regression/beta_fed_ai0_campaign_test.cjs.log` |
| `node tests/perf1_equivalence_test.js` | 4/0 | `regression/perf1_equivalence_test.js.log` |
| `node tests/perf2_equivalence_test.js` | 5/0 | `regression/perf2_equivalence_test.js.log` |

Ek son koruma paketi (her biri exit0):

| Komut | Sonuç | Kanıt |
|---|---|---|
| `node tests/mp74_notice_test.js` | 6/0 | `protection-regression/mp74_notice_test.js.log` |
| `node tests/mp74_lobby_test.js` | 5/0 | `protection-regression/mp74_lobby_test.js.log` |
| `node tests/mp75_war_test.js` | 5/0 | `protection-regression/mp75_war_test.js.log` |
| `node tests/beta_setup0_pirates_test.cjs` | 10/0 | `protection-regression/beta_setup0_pirates_test.cjs.log` |
| `node tests/beta_setup1_gates_test.cjs` | 12/0 | `protection-regression/beta_setup1_gates_test.cjs.log` |
| `node tests/beta_ux0_names_test.cjs` | 9/0 | `protection-regression/beta_ux0_names_test.cjs.log` |
| `node tests/beta_scale0_colony_test.cjs` | 12/0 | `protection-regression/beta_scale0_colony_test.cjs.log` |

Son tekrarların tek tek komutları ve exit kodları `regression-final/results.json`, `mirror-release.log`, `perf2-release.log` içindedir. Bu testler eski Konsey, savaş/barış, ekonomi, filo ve korsan/kapı korumalarının ilgili kod sözleşmelerini sınar. Bütün tarihsel testlerin ve MP8N'nin tekrar çalıştırıldığı iddia edilmez. Önceki kullanıcıya özgü #24/#25/#26 çözülmedi.

## 13. UI / ekran görüntüleri

p20 ve p21’de ayrı çalıştırılan SP Chromium **1920×1080,800×360,915×412,960×540**; her birinde UI Scale **%80/%100/%125**, gerçek fare/dokunma, üç sekmede hedef koruma, gerçek operasyon, iki gerçek müdahale, kapanabilir modal. Sayfa hatası yok. MP üç ayrı Chromium süreci/oturum, yerel TLS relay; PC ve yatay mobil viewport native etkileşimleri kullanıldı.

Örnek görseller:

- [800×360, %125 casusluk](evidence/beta-espionage-rebellion0/sp-final/800x360-spy-125.png)
- [800×360 ayrı kriz listesi](evidence/beta-espionage-rebellion0/sp-final/800x360-risks.png)
- [PC host sonucu](evidence/beta-espionage-rebellion0/mp-desktop-corrected/er0-spy-ack.png)
- [Katılımcı kriz listesi](evidence/beta-espionage-rebellion0/mp-protection-release/er0-risk-list.png)

p21’in yeni görselleri `continuation-3aacf7d/sp/`, `accept-after/era-incite-private.png`, `accept-after/era-schism12.png` ve `accept-desktop/` altındadır. Bu emülasyon gerçek Android veya iki fiziksel PC kullanıcı testi değildir. Uzun hedef/koloni listelerinin uç500sistem kabulü bu fazda yapılmadı.

## 14. Performans

Aynı p19 kayıtlarıyla15 aylık küçük kontrol örneğinde gerçek ay adımı medyanı p19 **71.6ms**, aday **73.7ms**. Tek yerel çalıştırma; kalıcı FPS/hız kazancı iddiası değildir. Ham ay bazlı değerler `equivalence-release/compat.json` içindedir.

MP6 son ölçüm:45/60/100 sistem aynaları28/33/43KB, host üretimi2/3/3ms; misafir deserialize107/115/107ms. Soğuk kampanyada H monthTick medyan112.1ms ilk6ay ve74.4ms devam6ay; publish medyan4.8/3.6ms. Bunlar farklı kampanya noktalarıdır, eski sürüme karşı hız kazancı olarak yorumlanmaz. Aynalar B/C için revizyon eşitliği, sıfır diff ve leak listesiyle doğrulandı. AI3 sekiz aylık kontrollü motor örneği ortalama yaklaşık279ms/oyun ayıydı; küçük test sahnesinin ölçüsüdür.

Risk okuması kaynak/RNG tüketmez; ağır yeni aylık planlayıcı eklenmedi. Yalnız kendi kolonileri ve ilgili vasal özetleri taranır. Tarayıcıda casusluk açık/kapalı kapsamlı FPS/RAM karşılaştırması ve büyük galaksi uyarı yükü **NOT RUN**; PERF1/2 koruması PASS olması bunların yerine geçmez.

## 15. Değişen dosyalar

Runtime: `main.js` (ortak sahiplik/Save doğrulama/aylık uyarı/build), `economy.js` (aynı hedef hesabı, iki politika, risk/aşama ve AI), `economy-ui.js` (ortak UI), `ai.js` (mevcut aiTurn bağlantısı), `ui.js` (sekme sahipliği, spy UX, HUD, metin), `index.html` (workspace CSS), `sw.js` (p20 cache), `RELEASE-MANIFEST.json`.

MP: `research/mp0/mp-core.js` (iki yetkili komut, eski paket kabulü); `research/mp6/mirror.js` (kendi politika/uyarıπ, izinli koruma ve vasal DTO); `research/mp6/client/guest-stars.js` (aynı UI host ACK, geç cevap sınırı, kart/pref); `research/mp1/client/view.js` ve `research/mp1/server/relay.js` (uyumlu MP sürümü). Diplomasi/savaş motoru, map.js, OP başarı formülü ve yeni ağ/protokol motoru yazılmadı.

Yeni testler `beta_espionage_rebellion0_*`, `beta_er0_campaign/equivalence`, `browser-beta-er0-sp`, `helpers/beta-er0-*`; mevcut MP73/MP8 runner'larına opt-in ER0 senaryosu ve eski sıkı kaynak koruma zincirine tam hunk/hash pimi eklendi. Pimli karşılaştırma eski tam kaynağı doğrular; serbest normalizasyonla stratejik fark gizlenmez. Son rapor commit'inde ek salt-okunur ekran assertion'ı da vardır.

## 16. Güncel paket ve tam hashler

- ZIP **`releases/stars-faz96h10p21.zip`**, **829701 bayt**.
- SHA256 **`5d195fb46363a874d278d6198473d9bc76e1025d98e938bd5a139843a8abd8cf`**.
- CRC32 **`70277191`**.
- İki üretim bayt bayt eşit; ZIP içiCRC/20üye/manifest/19runtime SHA256 doğrulandı. Manifest ebeveyni bu devamın kanonik p20 raporHEAD’i3aacf7d’dir.
- Önceki `releases/stars-faz96h10p20.zip`829619bayt, SHA256`8cbb9aa19d66ff5a415db3e4ebf8a5e699c5f9817e4602a31eb2bf2e1f6594ad`, CRC32`5F4F1B84` **korundu**; üzerine yazılmadı.
- Oyun ZIP’i relay/MP istemci kaynaklarını içermez. Güncel MPb16 kaynakları aynı dalda ayrıca gerekir.
- Güncel manifest SHA256`5e5b6d59e0d106de81dcbccc1be43b85efcfaf12f15d24b93355bf77fcb889ed`. Makine verisi `continuation-3aacf7d/release-verified.json`: `changed` p20→p21, `phaseChanged` ilk p19→p21 tam faz farkıdır.

Tam fazda değişen runtime ve MP dosyalarının SHA256 karşılaştırması:

| Dosya | p19 SHA256 | Güncel p21 SHA256 |
|---|---|---|
| `ai.js` | `6d0a7800f0423b95212a8dbaf70009b0da4514cc3959d83f21e89511e0046f5c` | `61d4666ad045b4bd2af6f2a2564545be2450dcdfbd6b30bb76ad7bdf867fd0be` |
| `economy-ui.js` | `bf782df67a41afbb28314fbeb5d6e92cd5c8b76a42c5b7fd1291fa54d4842254` | `797431b367504c669c91dda97a1fc7524f42a77d8f10f92a24fd10153457dbcd` |
| `economy.js` | `8392cf97c2d1d1b3f346c74a8c0cbe3bfaf4d671257cbd925f9a3ee7d04eab7b` | `b4c7c9cdc6bbe8bec1b4478d77cfdea743550ac41bfcda95530d03b482394a7b` |
| `index.html` | `a9cfced642ea6bfd8141ed27d21d671bd0645ba31b0a4177a08b06e072a8146e` | `2c828257cb3a797f8abdfebb804db3e95b9c3ab772531e222a98adf7042601ff` |
| `main.js` | `7550752f7c6bba96f031c346d8211861b3f9cc115038c49086f01a9147f33149` | `98daa67073372c785c6b81f70846564276d431e6763e56b90673ac5372f18443` |
| `sw.js` | `e39e93c15060fa5feba5caab5baad7becfc4c750b7b66173e5fb9b27718ee845` | `2e94486166f427586c73c577167e307fdee9776fd8c0c02fcf7ef8a56a9e6496` |
| `ui.js` | `7889c7fdf3fbb7670ca16d1db02c84b1d342572669d7b79edc9b319f60f0e12b` | `ff6e035e2586dd65da7ec62471902915d14cf54b13ec398ff6668acc42468f1f` |
| `research/mp0/mp-core.js` | `18c10a99c2b55bf045fff0628f65107cd279a4b842895388b7c24004b7a26dd6` | `6d6e5adf283e5208c7d2ab5b139a6e73713823673af8f4a2ee6eddbfd2f67e8d` |
| `research/mp1/client/view.js` | `9f14cf54909dbd8246807520c3791a8d3b81fad7cdcbecf7a502f36a1be55637` | `95e44e7e8c6743bc6cd2f88971f2f4b43eca2a0359c6fdf16f213d7715039435` |
| `research/mp1/server/relay.js` | `c132430f96bb625426f26a00f5d09076f090fbe482db9a018d536f001d9811c9` | `419082626658b262fa15fe194b5c7212753ccd6bff23cedeff0b9093e487e80c` |
| `research/mp6/mirror.js` | `5b2c6ac008404e32ef9554ec45227f59c7b262fd9b864e0c2e9bda6c37aba122` | `c52e826b49e33be566055bcf10a2135e79fd5b157108cbc0755643c829b26349` |
| `research/mp6/client/guest-stars.js` | `67720177a25fa4c61d3dc40050fd87e4a3f7fb743157c63d55a681dcffa672ce` | `e7804ee1c639e11b5c8cf9fe028e73313914ebcd4e3f32103c4fc4fe52d1d204` |

## 17. GitHub ve pano gerçek durumu

p20 kod/paket dalına push kayıtları `remote-code-head.txt`, `remote-runtime-head.txt` içindedir. Yeni p21 kod/paket257d01d push’u da doğrulandı: `continuation-3aacf7d/push-code.log`, `remote-code-head.txt`. Rapor/kanıt son push'u ayrıca doğrulanıp nihai SHA son yanıtta bildirilir.

İlk p20 tesliminde taslak PR açma ve Issue #33'e yalnız bu kapsamı yazma **birer deneme**: ikisi de `Post "https://api.github.com/graphql": Forbidden`. PR oluşmadı; pano yazılmadı. p21 devamında aynı bilinen engel için yeniden yetki arama/tekrarlayan yazma denemesi yapılmadı; yeni PR veya pano güncellemesi varmış gibi sunulmaz. Kanıt `pr-attempt.log`, `board-write.log`; pano okuma da aynı engeli verdi. Diğer görevlerin metni, tarihi ve durumu değiştirilmedi.

[Kaynak p19'a karşı compare](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-fed-ai0-raiders-coalitions...codex/stars-beta-espionage-rebellion0-ux?expand=1). Main merge/rebase/force-push, Render deploy/restart ve kullanıcı kaydı silme/dönüştürüp üzerine yazma yapılmadı.

## 18. Görev tablosu

| Görev | Önceki durum | Yapılan | Test | PASS/FAIL/NOT RUN | Gerçek kullanıcı kabulü |
|---|---|---|---|---|---|
| P0 selfleet/dealSend/fedFoundStart | Aralıklı kök açık | Kanıtlanan açık eski panel katmanı düzeltildi; spy geç ACK sınırı | Birleşik PC/mobil, native negatif ACK | Kanıtlı alt kusur PASS; özgün vaka AÇIK | Yapılmadı; TEST BEKLİYOR |
| Pano içi #33 Casusluk UX | p17 hedef şeridi, mevcut3bölüm | Tek korunan hedef, kategoriler, aynı host onayı | SP5/0, MP6/0 ve native | Ana testli akış PASS; bütün özel akış matrisi NOT RUN | Yapılmadı; RAPOR GELDİ / TEST BEKLİYOR |
| Koloni erken uyarısı | p17 bir defa15 |5/15/24, kişisel kart, kalıcıHUD | Motor11/0, native, cold5/0 | PASS testli kapsam | Yapılmadı; KULLANICI ONAYI BEKLİYOR |
| İdeolojik bölünme | Ayrı eski48motor | Ayrı ortalama/sayaç ve12/24/40; p21 doğru liste etiketi | MP özel aşama/yükleme; native47/48 sınırı | Kontrollü motor/UI PASS; doğal48ay NOT RUN | Yapılmadı |
| Vasal riskleri | Öfke/sadakat eski motor | İlgili oyuncuya gerçek host özeti/uyarı | Pure/privacy/π testleri | PASS motor; tam native isyan NOT RUN | Yapılmadı |
| Ekonomik destek / özerklik | Yeni manuel eylem yoktu | İki bedelli, süreli, cooldown ve sahiplik damgalı karar | NativeSP/MP, duplicate/load/cost | PASS | Yapılmadı; KULLANICI ONAYI BEKLİYOR |
| AI iç kriz | Yeni politikalar yoktu | Mevcut aylık akıştan aynı gerçek kapı; kalıntı düşüşünün nedeni kanıtlandı | Mikro18/27, gerçek8ay, ikiz6ay tanı | Kontrollü PASS; tümAI6ay kurtarma FAIL korunur | Yapılmadı; geniş stres kabulü açık |
| Yeni güvenlik/sıkıyönetim düğmesi | Mevcut koruma motoru | Üçüncü yeni mekanik eklenmedi | — | NOT RUN / YAPILMADI | Bekleyen kapsam |
| Politik doktrin/etik propaganda dönüşümü | Tam motor yok | Desteklenen siyasi operasyonlar gösterildi; sahte buton yok | Mevcutspy regresyonu | Yeni dönüşüm YAPILMADI | Sonraki siyasi faz |
| p15–p19 korumaları | Önceden geliştirildi | Yeni iş sayılmadı |21 paket + ilgili son tekrarlar/native | PASS testli kapsam | Önceki kabul durumları korunur |
| #24/#25/#26 | Özgün nedenler bilinmiyor | Çözüldü denmedi | İlgili koruma | Özgün kullanıcı vakaları NOT RUN | AÇIK |

Pano API engeli nedeniyle bu önerilen durumlar yalnız yerel envanter/rapordadır; GitHub'da yazıldı olarak sunulmaz. Motor eklendi, UI çalıştı, AI kullandı, multiplayer test edildi ve gerçek kullanıcı kabul etti ayrı kanıtlardır.

## 19. Açık işler ve kısa fiziksel kabul planı

**Gerçek fiziksel Android, iki/üç gerçek PC, gerçek LAN/internet, canlı Render ve kullanıcı kabulü NOT RUN.** Yerel Chromium/TLS başarılı sonuçları bunların yerine geçmez.

Kullanıcı kabulünde:

1. Arkadaşınız host, siz B olun. Casuslukta üç sekme arasında hedefi koruyun; bir operasyon onaylayıp sonucu/gerçek70 etki bedelini görün. Gönderirken başka hedef/modal açın; eski sonuç yeni yüzeyi ele geçirmesin. Filo seçimi/teklif/kuruluş davetindeki özgün aralıklı takılmayı ayrıca gözleyin.
2. Riskli kendi kolonisinde HUD→İç istikrar→koloniye gidin. Gerçek neden, ayrı schism/vasal durumu,5/15/24 aşamaları ve mevcut fetih/sıkıyönetim korumasının yönü doğru olsun. Kartı kapatınca HUD sürsün. Üçüncü kişi özel bilgi görmesin.
3. Ayrı kolonilerde destek ve özerkliği maliyet/önizlemeyle uygulayın. Kaynak bir kez kesilsin; cooldown ve−%15 üretim bedeli görülsün. Kaydedip yeni odada aynı devletlere dönün: süre/bedel/kart tekrarlanmasın.

Sonraki öncelikler: özgün aralıklı P0 gerçek kullanıcı kaydı/tanısı; tüm özel casusluk ve ters rol matrisi; daha geniş/ters rollü özel operasyon ve doğal uzun schism/vasal kampanyalarının kabulü. H→B dış kışkırtma, kontrollü schism48 sınırı ve özgün AI düşüşü bu devamda kanıtlandı; genel AI kurtarma garantisi verilmedi. Sonrasında ayrı siyasi propaganda/etik dönüşüm tasarımı, #51 Konsey reformu; #30/#36 arma ve genel #44 bu faza eklenmedi. Kullanıcı izni olmadan yayımlama veya TAMAMLANDI yoktur.

## 20. p20 tesliminden devam: yeni kanıt, tek minimal ürün düzeltmesi

Bu tekrar verilen promptta geliştirilmiş p20 mekanikleri yeniden yazılmadı. Uzak p20HEAD3aacf7d kaynak alındı; yalnız doğru risk türünü adlandıran HUD/liste düzeltmesi ve buna bağlı sürüm/uyumluluk değişti. Ekonomi/AI/diplomasi/savaş/başarı hesapları ve Save8 veri modeli p20 ile aynıdır.

**İlk yeni FAIL’ler:** `continuation-3aacf7d/accept-before.log`3/1: kurulan laboratuvar kolonilerinin yabancı sınır komşusu yoktu; motor doğru biçimde “Kışkırtılabilecek sınır dünyası yok” dedi. Test fixture’ında mevcut komşu boş sistemin sahipliği host’a verilerek gerçek sınır koşulu kuruldu; kapı gevşetilmedi. `accept-border-fixed.log`3/1: M5 bütün bedel/etki/gizlilik assertion’larını geçti; M6’da salt ideolojik riskin0kolonide isyan diye etiketlenmesi gerçek ürün FAIL’i oldu. Ayrı `hud-before.log`11/1 bunu salt-okunur motor testinde de yeniden üretti.

**Düzeltme:** `UI.topStatusItems` artık yalnız mevcut risk türlerini listeler: gerçek yerel koloni sayısı, ideolojik bölünme, vasal bağımsızlığı. Sıfır yerel koloni için yanlış etiket yoktur. Koloni/schism/vasal sayaçları ve sonuç eşikleri değişmedi. p21/newcache/b16 kimlikleri birlikte arttı; önceki p20 paketi korunur.

**Yeni M5/M6 kabulü:** üç ayrı gerçek Chromium süreci, H/B/C ve5AI; mobil H844×390/B800×360/C915×412 ve ayrı1920×1080 masaüstü koşusu. H mevcut özel operasyon grubundaki gerçek Kışkırt düğmesine basar. Fixture’ın RNG başlangıcı23’tür; normal `rnd`/olasılık/host motoru kullanılır, sonuç veya zar taklit edilmez.120 etki yalnız bir kez kesilir, B’de−25/+10 oluşur. B’nin Dosyalar ekranı “FAİL BİLİNMİYOR” yazar; `unrest.by`/bilinmeyen `hitLog.by` B’ye ve özel huzursuzluk C’ye aktarılmaz. Sonraki bağımsız laboratuvar senaryosunda düşük ortalama tutulur ve gerçek `schismTick`48 kez çalıştırılır: yerel sayaçlar0;12/48 ekranı ayrı;47’de bölünme yok,48’de `schismOf:1` yeni devlet oluşur. **Bu48aylık doğal ekonomi kampanyası değildir.** C özel schism uyarısı almaz.

| Gerçek p21 komutu | Sonuç | Kanıt (`continuation-3aacf7d/`) |
|---|---|---|
| `node tests/beta_espionage_rebellion0_test.cjs` |12/0 | `core-after.log` |
| `node tests/beta_espionage_rebellion0_mp_test.cjs` |6/0 | `mp-after.log` |
| `STARS_OUTPUT=.../ai-trace node tests/beta_er0_stress_trace.cjs` |1/0; ikiz6ay hamSave/RNG eşit | `ai-trace.log`, `ai-trace/trace.json` |
| `STARS_CONTROL_COMMIT=3aacf7d648fcea9603e2c57232f2689c0feabfb4 STARS_OUTPUT=.../p20-compat-final node tests/beta_er0_equivalence.cjs` |6/0; p20 kontrol/paket | `p20-compat-final.log`, `p20-compat-final/control.json`, `p20-compat-final/compat.json` |
| `ER0_ACCEPT=1 MP73_ONLY='B1 \|B2 \|ERA \|sayfa' node tests/browser-mp73.cjs` |mobil4/0 | `accept-after.log`, `accept-after/era-acceptance.json` |
| Önceki satır + `MPP0_DESKTOP=1` |PC4/0 | `accept-desktop.log` |
| `STARS_OUTPUT=.../sp node tests/browser-beta-er0-sp.cjs` |dört viewport×üç UI ölçeği5/0 | `sp.log`, `sp/results.json` |
| `ER0_R=1 MP8_SCEN=R MP8_MONTHS=6 node tests/browser-mp8.cjs` |soğuk yeni oda5/0 | `cold.log`, `cold/R/mp8-R.json`, `cold/R/er0-cold.json` |
| `node tests/mp6_mirror_test.js` |8/0 | `regression/mp6_mirror_test.js.log` |
| `node tests/mp74_notice_test.js` |6/0 | `regression/mp74_notice_test.js.log` |
| `node tests/mp75_war_test.js` |5/0 | `regression/mp75_war_test.js.log` |
| `node tests/perf2_equivalence_test.js` |5/0 | `regression/perf2_equivalence_test.js.log` |
| `MP73_ONLY='A1 \|sayfa' node tests/browser-mp73.cjs` |2/0; gerçek giriş ve kimlik | `identity-current.log` |
| `python tools/package-release.py`, `--out /tmp/stars-p21-repeat.zip`, `python tools/verify-release.py` |eşitZIP/CRC/19runtime PASS | `package-first.json`, `package-repeat.json`, `release-verified.json`, `manifest.log` |

Chromium komutlarında `STARS_CHROMIUM_PATH=/usr/bin/chromium` kullanıldı. MP sahne kurma dışındaki kararlar native fare/touch düğmeleridir; `force-click`, JS click, uzatılmış timeout veya kaldırılmış assertion yoktur. Fixture/risk eşik kontrolü host motorunda açıkça kurulur. p20 ilk birleşik7/0 sonuçları tarihsel kanıttır; p21’de bu büyük birleşik koşu gereksiz yere tekrar edilmedi, yukarıdaki etkilenebilir akışlar çalıştırıldı.

p20 kontrol/p21 aday küçük kontrol ay adımı medyanları112.6/100.8ms; tek yerel örnek ve hız kazancı iddiası değildir. p21 soğuk devamda host monthTick medyan161.8ms/p951229ms ölçüldü; uzun görevler vardır. Fonksiyonel5/0 veya PERF2 eşdeğerliği genel akıcılık/FPS kabulü olarak sunulmaz. Gerçek cihaz performansı hâlâ NOT RUN.

**Son durum:** yeni risk etiketi PASS, M5 native PASS, M6 kontrollü native eşik PASS, özgün AI istikrar düşüşü kök neden tanısı PASS. Özgün aralıklı selfleet/dealSend/fedFoundStart kesin kökü hâlâ AÇIK. Tam etkin AI6ay kurtarma FAIL kaydı korunur. Yeni manuel sıkıyönetim, politik etik dönüşümü ve bütün özel operasyon/ters rol matrisi eklenmedi. Kullanıcı kabulü, fiziksel Android/PC, gerçekLAN/internet/Render NOT RUN; hiçbir görev TAMAMLANDI değildir.

Ek kimlik denetiminde `identity-before.log`1/1, oyundaki arıza değil eski testteki sabit `MP.8.9b12` beklentisiydi; sunucu `MP.8.9b16` verdi. Ara yama uygulanmadan başlatılan tekrar (`identity-after.log`) aynı eski testle FAIL kaldı. Test artık kaynakta ilan edilen MP sürümüyle **tam eşitliği**, build/çubuk/diagnostic uyumunu ve önceki bütün destek/yetki assertion’larını korur; gerçek giriş/touch kimlik koşusu `identity-current.log`2/0 geçti. Beklenti kaldırılmadı veya timeout yükseltilmedi. Bu test altyapısı düzeltmesi runtime/ZIP’i değiştirmez.

Bu devamın kısaltılmamış çevre değişkenleri, stdout yönlendirmeleri ve tam kanıt yolları [commands.json](evidence/beta-espionage-rebellion0/continuation-3aacf7d/commands.json) içindedir; ilgili dört Node regresyonunun komutları ayrıca `continuation-3aacf7d/regression/results.json` içindedir.
