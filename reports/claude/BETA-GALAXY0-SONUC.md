# BETA-GALAXY.0 — galaksi kurulumu, savaş sonrası paylaşım ve Android düzeltmeleri (14 Kasım 2026)

Dil kuralı: **PASS / PARTIAL / FAIL / NOT RUN** ayrı yazılır. Bütün tarayıcı testleri bu konteynerde **yerel Chromium**'dur (MP'de üretim relay
süreci + yerel TLS vekili, oyuncu başına kesilebilir hat). Canlı Render, fiziksel PC / Android ve LAN **NOT RUN**. Kullanıcı kabulü yok;
hiçbir madde TAMAMLANDI değildir.

## 1. Kaynak, dal, sürüm

| | |
|---|---|
| main | `4296ad2` (MP.4 dönemi, aktif zincirin çok gerisinde; dokunulmadı) |
| Taban | P27 / #40 `43a3612`; #41 `5649d28` (`codex/stars-sp-map-war-variety`, p27s1) ve #42 `9d269ce` (`claude/stars-beta-fed-fleet0`, p28) — ikisi de `43a3612` üstünde, GitHub ile doğrulandı |
| Başlangıç HEAD | `9d269ce` (#42) |
| Birleşik aday dal | **`claude/stars-pregame-galaxy0`** (Render'da denenecek dal) |
| Birleştirme | `d64af78` = #42 + #41; içerik çakışması yok (yalnız sürüm kimliği, paket uyumluluk listesi, koruma zinciri, rapor bağlantısı) |
| Sürüm | oyun **96h10p29** · PWA `stars-v96h10p29` · Save8 **v8** · MP **MP.8.9b26** · paket **4** · protokol **1** |
| Paket uyumu | p29 yükleyicisi p6–p28, p25u1 ve p27s1 paketlerini kabul eder |
| Bitiş HEAD | PR ve sohbette (rapor commit'i) |

## 2. Özet tablo

| İş | Durum |
|---|---|
| 1. #41 + #42 birleştirme | PASS |
| 1. Desync: mevcut P26/P27 düzeltmesi korunur; 500 sistem / 16 AI / 2 oyuncu / 15 dk | §9 |
| 1. Hız mesajı sırasında kesik misafir aynası → yeniden eşitleme, emir eşitliği | PASS (`MP8_SCEN=S` S2–S3) |
| 2. Yeni galaksi şekilleri (eliptik, kümeli, çubuklu sarmal, düzensiz) + açıklama + önizleme | PASS |
| 2. Zorunlu yapısal rota denetimi / onarım / başarısızsa başlatmama | PASS |
| 3. Kolonileştirilebilir gezegen çarpanı 0,25–3× | PASS |
| 4. Fizyoloji / genetik kart tipografisi, colCost, gerçek birimler | PASS (Chromium; "268513.png" bu oturuma ulaşmadı, bkz. §6) |
| 4. Arma: Görünüş ↔ oyun eşleşmesi, çakışmasız bölge arması, ayrı saydamlık | PASS |
| 5. Android arka plan dönüşü | PARTIAL (Chromium emülasyonu PASS; gerçek arka plan bu ortamda üretilemedi; fiziksel Android NOT RUN) |
| 5. Dar yatay HUD, #41'de zaman aşımına uğrayan misafir olay kartı (D4) | §9 |
| 6. Barış sonrası toprak paylaşımına erişim ve gerçek devir | PASS (yetkili misafir: Node `mp63_settle_test`) |
| 7. Rakip Doktrinler sabit sayı / aralık | PASS |
| 7. Tek blokta yığılmayı azaltan AI adayı | PARTIAL — incelendi, ölçüldü, **reddedildi** (§8) |
| 7. Federal filo bölünme / birleşme, başkanın ayrılması | PASS (bir yetkisiz teslim açığı bulundu ve kapatıldı) |
| 8. ZIP / manifest / rapor / PR | PASS (PR §10) |
| Canlı Render, fiziksel Android | NOT RUN |

## 3. Galaksi şekilleri ve yapısal rota denetimi

- **Şekiller.** `SHAPES`'e dört yeni anahtar eklendi: `eliptik`, `kumeli`, `cubuklu`, `duzensiz`.
  - Nokta üreteci ve hat adımı yalnız bu anahtarlarla dallanır; eski sarmal/halka/küme kodu ve RNG akışı aynıdır. Kontrol `d64af78` ile **18/18 ham Save8 + RNG birebir** (G2).
  - Kurulum ekranında her şeklin kısa açıklaması ve sabit tohumlu küçük nokta önizlemesi var (G/RNG kullanmaz).
  - Şekil, sistem sayısı, AI sayısı ve gezegen çarpanı ayrı seçilir. Kümeli yoğun öbeklerde rejection döngüsü 500 sistemde 3,7 sn sürüyordu; yeni şekiller aynı kabul/ret kararını veren ızgarayla 0,3–0,9 sn.
- **Yollarda hissedilen fark** (orta/500 sistem ölçümü, `evidence/beta-galaxy0/sekil-rota.json`):

| Şekil | Ölçülen karakter |
|---|---|
| Eliptik | en-boy oranı 1,9–2,1 (diskler 1,0–1,1) |
| Kümeli | 4 (30 sistem) / 11 (500 sistem) öbek; ~800 hatta yalnız 3–13 öbekler arası geçit |
| Çubuklu sarmal | en-boy 1,5–1,6; 500 sistemde çap 97–101 sıçrama (merkez hat) |
| Düzensiz | küçük haritada yarı düzlem asimetrisi 1,7–2,0 (disk 1,1–1,5). 500 sistemde disk doldukça her şekil eşitlenir (1,35) |

- **Rota denetimi.** Esas, rota motorunun (`findPath`) kullandığı hat grafiğidir (`G.sys[u].lanes`).
  - Geçerli hat: tamsayı, aralıkta, kendine değil, tekrarsız ve iki yönlü.
  - Kapı, sis, kapalı sınır, savaş ve geçiş izni oyun içi kısıtlardır; denetime girmez ve oynanışta geçerli kalır.
  - Denetim iki yerde çalışır: son galaksi üretiminden hemen sonra (`galaxyRouteRepair`) ve kurulum sonunda, oyuncu haritaya girmeden / MP host başlatmadan önce her başkentten.
  - Onarım: geçersiz hatlar ayıklanır, tek yönlü hat çift yönlü olur, bileşenler başkentin bileşenine **en yakın çiftle** (tohumun ürettiği konumlar, RNG yok) en az hatla bağlanır.
  - Başarısızsa `RangeError` + özet; SP kurulumu açık hata ve **YENİ TOHUMLA YENİDEN ÜRET** gösterir, MP host başlatmaz. Sonuç G'ye/Save8'e yazılmaz.
- **Kapsam (G1, 24 harita):** 4 şekil × 2 tohum (11, 404) × {30 sistem / 8 AI, 30 sistem / 8 AI yıldız kapısı kapalı, 500 sistem / 16 AI}.
  - Hepsi tek bileşen ve her başkentten bütün sistemlere ve gezegenlere erişim var (500/500, 1331–1458 gezegen). Aynı tohum ve ayarlar aynı haritayı üretir.
  - Kümeli haritada üretecin kendi birleştirmesinden önce 4 / 11 bileşen var; geçitleri bu birleştirme kuruyor. Denetimin ek onarımı 0.
- **Bilerek kopuk harita (G3, `evidence/beta-galaxy0/kopuk-harita.json`).** Kümeli / orta / tohum 22'de başkentten en uzak öbeğin 12 sistemi ayrıldı (10 hat kesildi), ayrıca bir geçersiz (9999) ve bir tek yönlü hat eklendi.
  - Denetim yakaladı: 4 bileşen, `invalid` + `oneway`, en kötü başkentten erişim 1/45.
  - Onarım 3 yeni hatla (bileşen − 1: [43,16], [20,8], [10,22]) birleştirdi, geçersiz ve tek yönlü hattı düzeltti; sonuç 45/45 sistem, 131/131 gezegen.
  - Kopukken `orderMove` reddedildi. Onarım sonrası gerçek `orderMove` 9 sıçramalık yolu kabul etti; filo gerçek `dailyTick` ile 64 günde 3 gemiyle sağ vardı.
  - Testte geçiş izni (oyun içi kural) ittifakla açıldı.
- **G4:** Onarım başarısızsa `setupGame` açık `RangeError` + `galaxyRoute` özeti verir. Chromium'da (800×360 dokunma) oyun açılmadı, yeniden üret düğmesi yeni tohumla başarılı kurulum yaptı.
  - İlk koşudaki hata kökü: hata kutusu başlat düğmesinin üstüne ekleniyordu, dokunmanın sentetik tıklaması yer değiştiren yeniden-üret düğmesine düşüp hatayı siliyordu. Hata ve düğme gezinme satırının altına taşındı.

## 4. Kolonileştirilebilir gezegen çarpanı

- Seçenekler 0,25× / 0,5× / 0,75× / 1× / 1,5× / 2× / 3×; 1× varsayılandır ve hiç yazılmaz.
  - Kapsam: tek oyuncu kurulumu, MP host lobi `configure` / paket `session.settings` (yalnız ≠1) ve Save8 `cfg.planetMul`.
  - Eski kayıtta alan yoksa 1× sayılır, kayıtlı galaksi yeniden üretilmez (G6).
- **Uygulama yöntemi:** Başkentler yerleştikten sonra ayrı tohumlu akışla uygulanır; ana RNG çekilmez. Konum, hat ve başkent çarpandan bağımsızdır (G5'te 3 tohum × 5 çarpanda birebir).
- **Kapsam:**
  - **Değişen ("normal"):** HAB_TYPES, sahipsiz, başkent sistemi dışı, lüks/kalıntı yatağı olmayan gezegenler. Azaltmada ölü türe çevrilir; artırmada ölü gezegen yaşanabilir olur, yetmezse sistemin sonuna yeni normal gezegen eklenir (mevcut sıra/adlar korunur).
  - **Korunan:** başkent dünyaları ("garanti"), nadir Gaia / Makine Dünyası ve lüks / kalıntı yataklı yaşanabilir dünyalar ("özel") hiç değişmez. Tür / teknoloji kolonizasyon kuralları motorda aynıdır.
- **Sayım tablosu** (orta galaksi; `evidence/beta-galaxy0/gezegen-carpani.json`):

| Tohum | Çarpan | Normal aday | Özel (korunan) | Garanti | Nadir | Toplam yaşanabilir |
|---|---|---|---|---|---|---|
| 11 | 0,25× / 0,5× / 1× / 2× / 3× | 6 / 13 / **25** / 50 / 75 | 18 | 9 | 1 | 34 / 41 / 53 / 78 / 103 |
| 23 | 0,25× / 0,5× / 1× / 2× / 3× | 5 / 10 / **19** / 38 / 57 | 20 | 5 | 5 | 35 / 40 / 49 / 68 / 87 |
| 404 | 0,25× / 0,5× / 1× / 2× / 3× | 5 / 11 / **21** / 42 / 63 | 15 | 6 | 4 | 30 / 36 / 46 / 67 / 88 |

- **Uçlarda AI (G7, tohum 23, 24 ay):** AI koloni sayısı 0,25×'te 5 → 9, 3×'te 5 → 10; çökme yok.
  - Harita işaretleri motorun yaşanabilir gezegen kuralını kullanır; ayrı bir kural yazılmadı.
- **MP (G8 + `MP8_SCEN=S`):** Kümeli + 2× oda gerçek lobiden açıldı.
  - Host galaksisi denetimden geçti (1 bileşen, çarpan 2×).
  - Misafir aynı koordinatları, bildiği sistemlerde host hatlarının alt kümesini ve aynı gezegenleri aldı.

## 5. Fizyoloji / genetik kartları ve armalar

- **Bulgu (taban `d64af78`, Chromium):**
  - Etki satırı yoksa kart, kalın yeşil satır yerine soluk düz metin basıyordu; Okyanus Canlısı bu yüzden ayrışıyordu.
  - Kuş Benzeri kartında "colCost −15%" görünüyordu (`TRAIT_LABEL`'de etiket yoktu).
  - Okyanus Canlısı'nın gerçek motor etkisi kartta yoktu: +18 yaşanabilirlik puanı ve sevdiği dünyalarda koloni üretimi +%20 (economy.js).
  - Kuş Benzeri'nin filo hızı (+%10) metinde yoktu.
- **Düzeltme:**
  - Kartlar tek biçimde: başlık / kısa özet / etki satırı. Etkiler `PHYSIO` alanlarından ve gerçek kullanım yerlerinden üretiliyor.
  - Birimler motor hesabıyla aynı: yüzde çarpan, düz puan, yaşanabilirlik çarpanı, "sever" +18 puan ve +%20 üretim, "sevmez" −35 puan, kaçınma = gelen hasar −%10, kara savunması, fotosentez maliyeti.
  - Seçili kart çerçeve ve arka planla, seçilmeyen kart okunur kontrastla gösteriliyor. Ayrıntı kutusunda beslenme, avantajlı/dezavantajlı gezegenler ve diğer etkiler var.
  - "Kolonileştirme maliyeti" etiketi eklendi (`TRAIT_LABEL` artık bütün `PHYSIO`/`TRAITS` anahtarlarını kapsıyor). Genetik kartlar da aynı tipografide.
  - Fizyoloji dengesi ve genetik puan kuralları değişmedi.
- **Chromium (`tests/browser-pregame-galaxy0.cjs`, 390×844 portre dokunma, 800×360 dar yatay dokunma, 1280×720): 10/0 PASS.**
  - Okyanus Canlısı / Kuş Benzeri / Makine Ağı: tek özet ve tek etki stili, kod terimi yok, taşma yok, seçili kart ayırt edilir.
  - Genetik: tek stil, puan satırı, seçim puanı değiştirir.
  - Görünüş: önizleme sekmeler arası aynı; oyundaki arma önizlemeyle aynı.
  - Galaksi sekmesi: önizleme, çarpan, rota hatası.
  - Kontrolde aynı test **7/3 FAIL** (colCost).
  - Önce/sonra ekranları: `evidence/beta-galaxy0/pregame/once-*.png` ve `sonra-*.png`.
- **Arma eşleşmesi (bulgu):** Kontrolde Görünüş önizlemesi (altıgen / güneş / köşeler) ile oyundaki arma (elmas / kanat …) farklıydı.
  - Kök: Önizleme `'setup'`, oyun `'state:<tohum>:0'` tohumundan varsayılan arma üretiyordu.
  - Düzeltme: Seçilmemiş arma başlarken önizleme varsayılanıyla sabitlenir; MP taslağı da aynı.
  - Sekmeler arası değişmez; renk devletin siyasi rengidir.
- **Bölge arması (#41):**
  - Önceden bölgenin merkezindeki yıldızın üstüne çiziliyordu. Artık bölge içi adaylardan (merkez + bölge içi hat ortaları) yıldızlara, sistem adlarına, bölge etiketlerine ve diğer armalara en uzak noktaya yerleşiyor; yer yoksa küçülüyor ya da o karede çizilmiyor.
  - **Kendi bulduğum regresyon (ilk FAIL korunur):** İlk sürümde aday noktalar yalnız merkez ve bölge içi hat ortalarıydı. Tek sistemli bölgede tek aday yıldızın üstü kalıyor, arma hiç çizilmiyordu. #41'in `browser-sp-map-war` testi bunu yakaladı (`assert(draws > 0)`, kanıt `evidence/beta-galaxy0/regresyon/sp-map-war-ilk-FAIL.log`).
  - Düzeltme: Her görünür sistemin çevresindeki 8 nokta da aday. Bir nokta, en yakın görünür sistemi aynı sahibe ait ve görülmüşse bölge içi sayılıyor. Sonrasında `browser-sp-map-war` 4/0 PASS.
  - Sis altı devletler açığa çıkmıyor (`region.known` + `pVis`).
  - Arma opaklığı (`stars:territoryEmblemOpacity`, %0 kapalı) ve bildirim opaklığı (`stars:alertOpacity`) ayrı tercihler.
  - #41'in altı ek sembolü korundu.
- **AI arma çeşitliliği** (200 sistem / 16 AI, 3 tohum): 16/16 benzersiz; 5–6 şekil, 8–11 sembol, 6 desen; yeni sembollerden 3–9 kullanım.

## 6. Android arka plan dönüşü ve mobil HUD

- **Referans görseller:** "268513.png" ve "268604.png" bu oturuma ulaşmadı (dosya bulunamadı). Bulgular kaynak incelemesi ve Chromium ölçümüne dayanır.
- **Gezegen görsellerinin kaynağı:** Haritada gezegen sprite'ı yok; harita yıldız sprite'ları (`ART.star`) ve bölge armaları çiziyor. Sistem panelindeki gezegenler CSS küre (`planetOrb`); `canvas.pspr` artık üretilmiyor.
- **Kurtarma zinciri:** #41 dönüşte (`visible|pageshow|focus|context`) sprite önbelleklerini yeniliyor ve armaları yeniden boyuyor. Bu fazda iki ek:
  1. **DOM tuvali kaybı:** Panel / portre / arma DOM tuvallerine `contextrestored` gelince yeniden boyama (belge yakalama aşaması; `#map` yüzey yaşam döngüsünde kalır).
  2. **Panel küreleri:** Dönüş kurtarmasında panel gezegen kürelerine yeniden rasterleme dürtmesi.
- **Ölçüm:** Bu ortamda gerçek sekme / pencere arka planı üretilemedi. Headless'ta `bringToFront`, Xvfb'de pencere küçültme ve CDP yaşam döngüsü `visibilityState`'i değiştirmedi.
- **Test (`tests/browser-bgreturn-galaxy0.cjs`, 800×360 dokunma + 1280×720): 14/0 PASS.**
  - Yöntem: Görünürlük emülasyonu, gerçek `visibilitychange` / `pagehide` / `pageshow` / `focus` olaylarıyla yapıldı ve oyunun kendi kurtarma zincirini çalıştırdı. Arka plandayken DOM ve önbellek tuvallerinin pikselleri silindi; önbellek nesneleri yerinde bırakıldı.
  - Kapsanan durumlar: açık sistem paneliyle üç ardışık dönüş, panel arma tuvaline gerçek `contextrestored`, kayıttan yükleme sonrası bir dönüş.
  - Sonuç: Harita, yıldızlar, bölge armaları ve küreler geri geldi. Kamera, yakınlaştırma, seçim, sekme ve dünya (gün, RNG, sistemler, filolar, devletler) birebir korundu.
  - İlk koşulardaki FAIL'ler test kurulumundandı (`closeModal` hızı geri yüklüyordu); kanıtta saklandı.
- **Durum:** Gerçek arka plan **PARTIAL** (emülasyon); fiziksel Android **NOT RUN**.
- **Mobil HUD ve misafir olay kartı:** §9 (`browser-mobile-hud0`, `MP8_SCEN=D` D4).

## 7. Barış sonrası toprak paylaşımı

- **Bulgu:**
  - Savaş Merkezi → Savaş Ayrıntısı'ndaki "TOPRAK PAYLAŞIMINI İNCELE" düğmesi uygunluğa bakmadan çıkıyordu; uygun değilse açılan pencere ancak sonra gerekçe veriyordu.
  - Diplomasi Merkezi kısa listesi (180 gün / 12 sefer) dışında kalan seferin teklif durumu ayrıntıda görünmüyordu.
- **Düzeltme:** Savaş ayrıntısı aynı motor kararını (`settlementContext`) okur:
  - **Uygunsa:** "N koloni · M boş sistem · K ortak" ve düğme.
  - **Teklif varsa:** durumu ve aç düğmesi.
  - **Değilse:** somut gerekçe — açık cephe, en az iki yaşayan ortak, kısmi kayıt, uygun toprak yok vb.
  - **Kısa liste:** Kısa liste sınırı bu yolu engellemez.
  - **Taslak satırı:** Her satırda mevcut sahip, kayıtlı fetih hedefi (toprak iddiası) ve önerilen alıcı gösterilir. Motorda ayrı bir "toprak vaadi" kaydı yoktur; kayıtlı `fetih` savaş hedefleri gösterilir.
- **Chromium (`tests/browser-share-galaxy0.cjs`, 800×360 dokunma, gerçek `stars-2210-06` fikstürü): 8/0 PASS.**
  1. Cepheler açıkken somut gerekçe gösterildi, düğme ve Diplomasi kısayolu yoktu.
  2. Son cephe kapanınca iki giriş aynı seferi ve aynı taslağı açtı (2 koloni · 2 boş sistem).
  3. P'nin fethettiği koloninin alıcısı gerçek seçim kutusuyla M seçildi, sunuldu ve onaylandı.
  4. Kaydet → yükle sonrası teklif ve durum korundu.
  5. Ayrı **Uygula** adımıyla koloni P'den M'ye geçti: fetheden ≠ yeni sahip; yapılar korundu.
  6. İkinci uygulama yapılamadı (düğme yok, motor reddi).
  7. Tek galip seferi ve eksik (legacy) kayıt somut gerekçe verdi.
- **Motor gözlemi:** P–T barışı müttefik M–T cephesini de kapatır (koalisyon barışı). Bu yüzden "bir ortak barıştı, diğer cephe açık" hâli barış yoluyla oluşmuyor; açık cephe gerekçesi savaş sürerken sınandı.
- **Yetkili misafir:** MP.6.3 `settle*` komutları, Node `mp63_settle_test` (tam Node koşusunda PASS). Misafir arayüzünde savaş ayrıntısı düğmeyi korur, karar host'ta.

## 8. AI blokları ve federal filo

- **Rakip Doktrinler (#41) korundu (G9).** 3 tohum × {0–0, 2–4, 3–3, 8–8}: militarist / kriminal / fanatik toplamı her zaman aralıkta, sabit sayı tam, aynı tohum aynı dağılım.
- **Tek blokta yığılma (incelendi, aday REDDEDİLDİ).**
  - Aday: Yoğunlaşma cezası doğal dağılıma yumuşak biçimde yayıldı. Büyük ortak tehditte (kriz ya da bilinen, kendisinden 1,6× güçlü düşmanla savaş) ceza dörtte bire inecekti; geniş koalisyon mümkün kalsın diye. Aşırı yığılma + düşük uyumda zayıf bağlı üye ayrılabilecekti.
  - Ölçüm kurgusu: orta galaksi, 8 AI, 120 ay; kontrol `d64af78` / plasebo (tek RNG çekimi) / aday.

| Tohum | En büyük federasyon geç dönem payı (kontrol / plasebo / aday) | Bağımsız (geç ort.) | Eşzamanlı blok (maks.) |
|---|---|---|---|
| 11 | 0,56 / 0,56 / 0,56 | 4 / 4 / 4 | 1 / 1 / 1 |
| 23 | 0,76 / 0,75 / 0,67 | 2,1 / 2,2 / 3,0 | 1 / 1 / 1 |
| 404 | 0,78 / 0,77 / 0,83 | 2,0 / 2,0 / 1,4 | 1 / 1 / 1 |

  - Sonuç: tutarlı fayda yok, 404'te kötüleşme. Kod geri alındı, `AI-RED-KARARLARI.md`'ye işlendi.
  - Kök gözlem: Hiçbir kolda ikinci bir blok kurulmuyor. Sorun katılma cezası değil, kuruluş kapısı için ittifaklı bağımsız AI bulunmaması; ayrı faz.
- **Federal filo (`tests/beta_galaxy0_fedfleet_test.js` 6/0).**
  - **Bölme:** Bölünen federal filo (`splitType`, arayüz yarıya böl, MP `split`) aynı federasyonda kalır. Başkanın kişisel bakımı / kapasitesi ve fon bakımı değişmez.
  - **Birleştirme:** Federal ve kişisel / başka federasyon filoları birleşmez: motor açık gerekçeyle reddeder; arayüz, AI ve MP birleştirme listeleri uyumsuzları dışarıda bırakır. Federal olmayan oyunda AI davranışı aynı.
  - **Başkanın ayrılması — bulunan açık:** Başkan sipariş sürerken federasyondan ayrıldığında iş aylık taramadan önce tamamlanabiliyordu; gemi artık üye olmayan eski başkanın tersanesinde üretilip teslim ediliyor, bedel dönmüyordu (yetkisiz teslim).
  - **Düzeltme:** `fedShipComplete` sipariş verenin yaşayan üye olmasını da şart koşar; değilse bedel fona bir kez döner. İki yol (önce tamamlanma / önce aylık tarama) PASS; ikinci taramada ikinci iade yok.
  - **Başkan değişip üye kalırsa:** Geçerli sipariş devralınır, gemi o anki başkana federal doğar, ek ödeme / iade yok (S5).
  - **Regresyon:** #42 testleri 11/0, 7/0, 3/0.

## 9. Regresyon (birleşik aday p29)

KOŞU_SONUCLARI

## 10. Yayın

| | |
|---|---|
| ZIP | `releases/stars-faz96h10p29.zip` · 863 257 bayt · 20 girdi (19 runtime + manifest) |
| SHA-256 | `ee22b6944baf69b72d19c9ad6904c9cd70bc1f105aebd9403455d21c3ef2e8d5` |
| CRC32 | `7FDE4EED` |
| Manifest | SHA-256 `fc35e5bfe7c9d24457d08c67620b4f1a6965f119537f71e2347364b3de0a9b61` · phase `BETA-GALAXY.0` · build `96h10p29` · parent `9d269ce` · parent ZIP `095e3c93…0a8a` (p28) |
| Doğrulama | `verify-release.py` çalışma ağacında ve açılmış ZIP'te (`--root`) PASS; ikinci paketleme bayt-bayt aynı |
| Koruma | yeni `tests/helpers/beta-galaxy0-reviewed.{json,cjs}` (9d269ce'ye 13 dosya, tam metin hunk) ← `beta-fed-fleet0-reviewed` ← `mp-p0-guard-reviewed` ← … |
| Değişen runtime | `main.js`, `ui.js`, `map.js`, `index.html`, `diplomacy.js`, `archive-ui.js`, `ai.js` (yalnız federal filo birleştirme filtresi), `sw.js` |
| MP kaynakları | `mp-core.js`, `mp1-host.js`, `mp7-setup.js`, `view.js`, `relay.js` |

Canlı Render dağıtımı ve main birleştirmesi yapılmadı.

## 11. Açık işler

- **Fiziksel cihaz:** Android'de gerçek arka plan dönüşü ve ekteki iki görselin doğrudan karşılaştırması (görseller bu oturuma ulaşmadı).
- **Rakip AI blokları:** İttifaklı bağımsız AI'lar arasında kuruluş kapısının açılması; ayrı faz.
- **Barış ve paylaşım:** Koalisyon barışında tek ortağın ayrı barışı mekaniği yok; "bir ortak barıştı, diğer cephe açık" hâli oluşmuyor.
- **Düzensiz şekil:** 500 sistemde karakter zayıflıyor (disk doluluğu).
- **P27'den devralınanlar:** E2 aralıklı FAIL'i, özgün Render desync oturumunun reddedilen alanı, eski KATIL / dealSend aralıklı kökleri.
