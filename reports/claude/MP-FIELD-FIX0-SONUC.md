# MP-FIELD-FIX.0 — son Render denemesinin dört multiplayer saha bulgusu (15 Kasım 2026)

**Dil kuralı:** PASS / PARTIAL / FAIL / NOT RUN ayrı yazılır.

**Test ortamı:**
- Tarayıcı testleri bu konteynerde **yerel Chromium**'dur.
- MP'de üretim relay süreci ve yerel TLS vekili kullanılır.
- Her oyuncunun ayrı Chromium kalıcı profili ve kesilebilir ağ hattı vardır.
- Gerçek Render, fiziksel cihaz (Android / PC) ve LAN: **NOT RUN**.

**Kayıt dosyası:** Kullanıcının kayıt dosyası ya da Render oturumunun günlüğü eklenmedi. Saha bulguları normal oyuncu girişleriyle yerelde yeniden üretildi (§2–§5). Hiçbir madde TAMAMLANDI değildir; kullanıcı kabulü bekler.

## 0. Kısa sonuç

| # | Bulgu | Kök neden | Durum |
|---|---|---|---|
| 1 | Kayıtlı oyuna dönüş basit arayüze düşüyor | Ana menü ODAYA KATIL `/mp/join` (motor yüklemeyen MP.2 istemcisi) sayfasına gidiyordu; eski bağlantılar da oraya açılıyordu | Düzeltildi. p33'te yeniden üretildi (Z1 FAIL), adayda PASS |
| 2 | Olay kartı kaydırınca/yeniden bağlanınca geri geliyor, karar kayboluyor | Misafirde kaydırılan kartların listesi yalnız bellekte tutuluyordu: sayfa yenilenince iki kart da geri geldi. Ayna her yenilendiğinde aynı liste karar bekleyen olayı `G.inbox`'tan **siliyordu**: gizlenen olay ☰ listesinden de kayboluyordu | Düzeltildi. p33'te yeniden üretildi (Z3 FAIL), adayda PASS |
| 2b | "Host reddetti: rules:shipment" tekrar tekrar | Misafirin birleştir düğmeleri takviye sevkiyatındaki filoyu host'a gönderiyordu; host'un geçerli `merge` reddi ham kodla gösteriliyordu | Kural korundu. Uyarı Türkçe ve birleşik. p33'te 4 kez "Host reddetti: rules:shipment" (Z4 FAIL), adayda PASS |
| 3 | Fetih ekranı "0/0", "Bilinen başkent dışı sistemi yok", etkin görünen düğme | (a) Host uzak insan için adayı **gerçek** sahiplikten, misafir oyuncunun bildiği sahiplikten hesaplıyordu. (b) Misafir hedefin başkentini bilmeyince üst sınır 0 çıkıyordu. (c) Pencere açıkken dünya bekletiliyordu. (d) Pasif düğmenin stili yoktu. (e) Çıkış yoktu | Düzeltildi. Node N1 p33'te FAIL, adayda PASS; Z7 PASS |
| 4 | Müzakere masasında "Savaş sözü" MP'de desteklenmiyor | Genel `warOn` maddesi MP teklif deposunda yok; belirli savaşa bağlı `warJoin` masadan doğrudan seçilemiyordu | Düzeltildi. Masada **Savaşa Destek İste**; MP'de insanla müzakerede genel savaş sözü pasif ve gerekçeli. N2 p33'te FAIL, adayda PASS; Z8 PASS |

**Uçtan uca senaryo** (MP8 **Z**, host + B + C + kimliksiz X, dört ayrı Chromium profili):
- Akış: katılım → olaylar → kaydet → host ve misafirler kapanır → relay yeniden başlar → kayıt yeni odada açılır → host tek başına olayları doğrular → misafirler ana menüden ve eski bağlantıyla aynı devlete döner → Fetih → Savaşa Destek İste → emirler.
- Sonuç: adayda **10/0**, p33 kontrolünde **1/9**.

## 1. Kaynak, dal, sürüm

| | |
|---|---|
| Doğrulanmış taban | GitHub'da taslak PR **#47** açık. `claude/stars-war-coalition0` HEAD = **`0ec57209d2d6bc9d02c72b4452dec3f05d05f678`** (p33; API ile doğrulandı; daha yeni PR yok). |
| Başlangıç HEAD | `0ec57209d2d6bc9d02c72b4452dec3f05d05f678` |
| Çalışma dalı / Render Branch | **`claude/stars-mp-field-fix0`**. Oturumun önerdiği `claude/stars-project-takeover-y9x8m9` 96H.8 döneminden kalma ve p33'ü içermiyor; onu güncellemek force-push gerektirirdi. |
| Bitiş HEAD ve PR | Sonuç raporunda ve PR'da (taban #47 `claude/stars-war-coalition0`) |
| Sürüm | oyun **96h10p34** · PWA `stars-v96h10p34` · Save8 **v8** · MP **MP.8.9b31** · paket **4** · protokol **1** |
| Paket uyumu | p34 yükleyicisi p6–p33, p25u1 ve p27s1 paketlerini kabul eder |
| Save8 | Yeni alan yok. Kaydırılan kartlar misafir cihazında (`mp:swiped:<saveId>:<devlet>`) tutulur; Save8, paket ya da ayna değişmez. |

## 2. Bulgu 1 — kayıtlı oyuna dönüş yanlış arayüzü açıyor

**Yeniden üretim (p33, Z1):** B'nin olağan yolu: ana menü → ÇOK OYUNCULU → ODAYA KATIL → `/mp/join` → MP.2 basit istemci (Harita / Filolar / Koloniler / Bilim). Ölçüm: `{"path":"/mp/join","full":false,"basic":true}` (`kontrol-p33-Z1-4-run2.log`).

**Değişiklik**
- `research/mp1/server/relay.js`: `GET /mp/join` → `302 /mp/play` + aynı sorgu dizesi (oda kodu ve öteki parametreler korunur). Basit istemci yalnız açık `?basic=1` ile sunulur. Eski MP.1–MP.5 tarayıcı testleri bu adrese çevrildi; Node relay testi yönlendirmeyi sınar; smoke denetimi güncellendi.
- `research/mp1/client/mp1-host.js`: ODAYA KATIL → `/mp/play`.
- `research/mp1/client/join.js`:
  - Kod elle yazılıp katılım başarılı olunca adres `?code=` taşır. Sayfa yenilenince ya da Android sekmeyi yeniden yükleyince aynı odaya kendiliğinden dönülür.
  - **Katılım aşaması** ekranda yazılır:
    - **ODA BULUNAMADI** (geçersiz kod, oda kapandı / dolu);
    - **OYUNCU KİMLİĞİ DOĞRULANAMADI** (bu cihazda kayda ait kimlik yok, başka sekmede açık, atıldın);
    - **BAĞLANTI KESİLDİ** (sunucuya ulaşılamadı, host yok, çok deneme).
  - Gerekçe relay'in / host'un Türkçe metnidir.
- Kayıttan dönüş mekanizması (cihazdaki `mp4:save:<saveId>` kimliği → host'un `resume` isteği) zaten `/mp/play`'de de çalışıyordu. Değişmedi.

**"İkinci denemede giremedi":** Saha günlüğü yok, kesin neden **doğrulanamadı**. Yerelde iki ihtimal görüldü ve ikisi de artık ekranda aşamasıyla görünüyor:
- açık kalan basit sayfa koltuğu tuttuğunda **OYUNCU KİMLİĞİ DOĞRULANAMADI · başka sekmede bağlı**;
- oda doluyken **ODA BULUNAMADI · Oda dolu**.

**Kanıt (aday)**
- Z1: B ana menüden `/mp/play` → kendi devleti; C eski `/mp/join?code=…` → `/mp/play?code=…` → kendi devleti.
- Z2 (X profili):
  - yanlış kod → `ODA BULUNAMADI · Oda kodu geçersiz ya da oda yok.`;
  - çevrimdışı → `BAĞLANTI KESİLDİ · Sunucuya bağlanılamadı…`.
- Z6, kayıttan **yeni odada**:
  - B ana menüden yeni kodla, C eski bağlantıyla aynı devlete döndü;
  - kimliksiz X: `OYUNCU KİMLİĞİ DOĞRULANAMADI · Oyun kayıttan devam ediyor ve bu cihazda bu kayda ait oyuncu kimliği yok…`.
- Ayrı ayrı denenen akışlar:
  - aynı odaya yeniden bağlanma (Z3: hat kesilip geri gelir, sayfa yenilenir);
  - baştan başlatma (Z0);
  - kayıttan yeni oda (Z5–Z6).

## 3. Bulgu 2 — olay şeridi ve kayıttan sonra boş olay penceresi

**Yeniden üretim (p33, Z3, `kontrol-p33-Z3-run4.log`):**
- Misafir kartı fareyle ve dokunarak kaydırabiliyordu; ayna yenilemesi ve yeniden bağlanma kartı geri getirmiyordu.
- **Sayfa yenilenince** iki kapatılmış kart da geri geldi.
- Gizlenen "Kayıp Sonda" kararı ☰ durum listesinde **yoktu** (listede yalnız anomali vardı). Sebep: `inboxOffers` her ayna yenilemesinde kaydırılmış imzayı `G.inbox`'tan siliyordu; karar bekleyen olay buna dahildi.

**Değişiklik** (`research/mp6/client/guest-stars.js`)
- Kaydırılan kart imzaları kayıt + devlet ad alanında kalıcı tutulur. Bildirim tercihleriyle aynı depo ve aynı yükleme kapısı kullanılır; yeniden kurma tercihler yüklenmeden başlamaz.
- Diplomatik kayıtların (teklif, oy, davet) kartı kalkar; kayıt Gelen kutusunda durur.
- Karar bekleyen olay ve anomali **silinmez, gizlenir**; ☰ listesinden aynı karar penceresiyle açılır.

**Ret uyarısı** (`rules:shipment`): ret kuralı (host `merge`: `hasShipment` → ret) aynen kaldı. Değişiklikler:
- misafirin "birleştir"i tek oyunculu `mergeFleets` ile aynı ön koşulu uygular ("Önce sevkiyatı iptal et");
- "savaş filolarını birleştir" çapa olarak sevkiyatsız filoyu seçer;
- host ret kodlarının Türkçe karşılıkları eklendi (`rules:shipment`, `no-position`, `none`, `too-small`, `not-owner`);
- motorun gerekçesi varsa ham `rules:engine` gösterilmez;
- art arda gelen aynı uyarı yeni satır açmaz, "(×n)" sayacıyla tek satırda kalır.

**Kanıt (aday)**
- **Z3:**
  - olay + anomali kartı fareyle ve dokunarak (CDP dokunma olayları) kaydırıldı ve kalktı;
  - ☰ listesi: "▣ Kayıp Sonda · ▣ Terk Edilmiş İstasyon";
  - ayna, yeniden bağlanma ve sayfa yenilemesi kartları geri getirmedi;
  - sonraki olay ("Bilim Konseyi Talebi") göründü;
  - gizli karar listeden açıldı ve host'ta **bir kez** işlendi; ikinci deneme `rejected`.
- **Z4:**
  - host `merge` → `rules:shipment` (kök doğrulandı);
  - misafirde 3× birleştir + 1× savaş filolarını birleştir sonrası tek satır Türkçe uyarı;
  - karar kartlarına dokunulmadı; ret filolara dokunmadı.

**Kayıttan sonra boş olay penceresi** (hangi menüden açıldığı kesinleşmedi; iki yol ayrı denendi):

| Yol | Sonuç |
|---|---|
| Çok Oyunculu → Kayıtlı Oyuna Devam Et, **misafir bağlanmadan** (Z5) | Kayıt tarihi aynı; bekleyen olay şeritte, kaydırılarak gizlenen olay ☰ listesinde (gizli durumu korundu). Gerçek oyun döngüsünde tarih 4 → 8 ilerledikten sonra deterministik tetikleyiciyle üretilen yeni olay ("Alaşım Grevi") ve anomali şeritte ve listede. **PASS** |
| Ana menü **OYUNA DEVAM ET** (tek oyunculu, `browser-mp-field-fix0-sp.cjs`) | Kayıt anında **açık** olay, bekleyen olay ve kaydırılarak gizlenmiş olay doğru döndü; tarih ilerledi; yeni olay + anomali şeritte ve listede; gizli karar listeden açılıp bir kez uygulandı. Aday **1/0**, p33 kontrolü de **1/0** |

Saha vakası tek oyunculu yolda ve host'un misafirsiz devamında yerelde **yeniden üretilemedi**. Kanıtlanan tek kusur misafir tarafındaydı: gizlenen kararın listeden de silinmesi ve yenilemede kartların geri gelmesi. Bu düzeltildi. Kullanıcı kaydı sağlanırsa ilk iş o kayıtla tekrar denemektir (**açık**).

## 4. Bulgu 3 — Fetih hedef seçme ekranı

**Kök neden**
1. Host uzak insan için adayı "keşfedilmiş + **gerçek** sahibi hedef" kuralıyla hesaplıyordu (`warGoalSees`). Misafirin aynasında görünmeyen sistemlerin sahibi oyuncunun gözleminden (`mapOwners`) gelir. İki taraf farklı aday görüyordu; host oyuncunun bilmediği sahipliği kabul ediyordu (Node N1 p33'te **FAIL**).
2. Misafir hedefin başkentinin sahibini bilmeyince `sysCount − 1` = 0 çıkıyordu → "0/0" (Z7 ara koşusu, `aday-Z78-run5.log`). Başkent hiçbir zaman hedef olamadığı ve hedefte kaldığı için bu yanlış bir sınırdı.
3. Hedef seçme penceresi misafirde dünya güncellemelerini bekletiyordu (`holdBuild`): sonradan keşfedilen sistem görünmüyordu.
4. Pasif `.ch` düğmesi için stil yoktu; etkin görünüyordu.
5. Aday yokken bir sonraki adıma geçiş yolu yoktu.

**Değişiklik**
- `diplomacy.js`:
  - `warGoalSees` + `warHumanKnownOwners`: uzak insan (`e !== G.p`) yalnız bildiği sahipliği hedefler. Hesap misafirin aynasıyla aynıdır (`humanMapKnowledge(görüş)`; `warPure` içinde, salt okuma). Tek oyunculu oyuncu ve AI kuralı aynı.
  - `warFetihMax`: başkent sahibi bilinmese de sayılır. Host, tek oyunculu ve AI'da değer aynı (`sysCount − 1`). Host'un `warGoalOptions` doğrulaması gerçek sayımla aynen sürer.
- `ui.js` / `index.html`:
  - hedef seçme penceresi `liveWorld`: açıkken yerinde yenilenir, seçim ve kaydırma korunur;
  - geçerliliği değişen hedef nedenle düşer;
  - aday yoksa kısa neden ("Bildiğin tek sistemi başkenti…" / "Bilinen başkent dışı sistemi yok: önce keşif ya da istihbarat") ve **👑 Vasallaştırmaya dön**;
  - önizleme düğmesi görsel olarak da pasif (opaklık 0,38, kesik kenar); durumu yanında.
- Gizlilik: aday listesi ve gerekçe yalnız oyuncunun bildiği sahiplikten. Gerçek sahibi değişen sistem gerekçesiz düşer (N1).

**Kanıt (aday, Z7)**
- **T1, tek sistemli hedef:** "(0/0)", neden aynı ekranda, düğme `disabled` ve opaklık 0,38, Vasallaştırmaya dön çalıştı.
- **T3, pencere açıkken keşif:** başta aday yok. Host keşif / gözlem bilgisini güncelledi; sistem pencere **kapanmadan** listeye girdi.
- **T2, başkent dışı uygun hedef:** seçim → önizleme → onay → host'ta gerçek savaş, `wg.targets=[25]`.
- **Host (tek oyunculu yol):** aynı kural ve neden.

## 5. Bulgu 4 — müzakere masasından MP savaş desteği

**Kök neden:** MP teklif deposu cepheye ya da hazırlığa bağlı `warJoin` maddesini taşır; genel `warOn` (üçüncü tarafa savaş sözü) taşımaz. Masada `warOn` seçilebiliyor, gönderince "henüz yok" deniyordu. Belirli bir savaşa katılım isteğinin masadan doğrudan yolu yoktu (yalnız Savaş Merkezi → ASKERÎ DESTEK İSTE).

**Değişiklik**
- `diplomacy.js` `warSupportOptions(e,o)`:
  - karşı tarafın katılabileceği aktif cepheler ve bekleyen hazırlıklar;
  - her satır teklif motorunun aynı kapısından (`warSupportGate`) geçer; geçersiz satır gerekçelidir;
  - salt okuma, RNG yok.
- `research/mp0/mp-core.js` salt okuma `warSupportList`. Misafir seçeneklerini host'tan alır ve kimlikleri yerel numaraya çevirir.
- `ui.js` masada **⚔ Savaşa Destek İste**:
  - satırlar: "Cephe #n · X karşısında (savaş sürüyor)" / "Hazırlık #n · X · Fetih (henüz ilan edilmedi; en geç gün d)";
  - seçim `warJoin {front|plan,target}` maddesi olur.
- MP'de insanla müzakerede genel **Savaş sözü** pasif. Neden düğmenin yanında: "Genel savaş sözü çok oyunculuda gönderilemez. Belirli bir savaşa katılım için Savaşa Destek İste." Tek oyunculuda ve host → AI'da genel savaş sözü aynen.

**Kanıt**
- Node **N2:**
  - satırlar cepheye / hazırlığa bağlı;
  - saldırmazlık paktında satır gerekçeli;
  - teklif doğru cepheye bağlı;
  - barışla kapanan cepheye gecikmiş kabul işlenmez (p33'te FAIL).
- **Z8, gerçek arayüz:**
  - misafir B → misafir C, cephe #1: C reddetti; ikinci teklife C karşı teklif verdi; B kabul etti; C savaşta, bedel bir kez; ikinci kabul yok;
  - host'un gerçek masasından → B: host cephesine bağlı davet; B kabul etti, host'un savaşında;
  - host → C daveti; savaş barışla kapandıktan sonra C'nin kabulü `rules:closed` ile reddedildi; C savaşa girmedi.

## 6. Uçtan uca senaryo ve testler

| Test | Aday | p33 kontrol |
|---|---|---|
| `MP8_SCEN=Z node tests/browser-mp8.cjs` (Z0–Z9) | **10/0** (`aday-Z-run7.log`); ara koşular run1–6 FAIL'leriyle korunur | **1/9** (`kontrol-p33-Z-tam.log`). Z3–Z9 düşüşleri Z1'in zincirleme sonucu. Hedefli kontrol kanıtları: `kontrol-p33-Z1-4-run2.log` (Z1, Z2, Z4) ve `kontrol-p33-Z3-run4.log` (Z3) |
| `node tests/mp_field_fix0_test.js` (N1–N3) | **3/0** | **1/2** (N1, N2 FAIL; N3 kural korunur: PASS) |
| `node tests/browser-mp-field-fix0-sp.cjs` (S1, tek oyunculu OYUNA DEVAM ET) | **1/0** | **1/0** |
| `node tests/mp1_relay_test.js` (+ /mp/join yönlendirmesi) · `mp6_mirror_test.js` · `mp11_online_test.js` | 14/0 · 8/0 · 9/0 | — |

**Z senaryosunun kontrol noktaları:**
- **Kayıt ve olaylar:** kayıt tarihi aynı; host'un bekleyen ve gizlenen olayları korunur; B'nin bekleyen kararları `[2,3]` korunur ve kaydırılmış kararı gizli kalır.
- **Oyun ilerliyor:** oyun tarihi ilerledi (4 → 8 → 20).
- **Emir uygulandı (Z9):** filo 4 → sistem 37.
- **Eşitleme:** misafir aynası host ile aynı revizyonda (B rev 26, C rev 23).

**Ekran görüntüleri:**
- katılım: `evidence/mp-field-fix0/aday/Z/` altında `z1-ana-menu-katil.png`, `z2-oda-bulunamadi.png`, `z6-kimlik.png`;
- olay şeridi: `z3-kartlar.png`, `z3-sonraki-olay.png`, `z5-host-tek-olaylar.png`, `z5-host-yeni-olay.png`;
- sevkiyat uyarısı: `z4-uyari.png`;
- Fetih: `z7-tek-sistem.png`, `z7-acikken-kesif.png`, `z7-onizleme.png`;
- savaş desteği: `z8-destek-sec.png`, `z8-host-davet.png`;
- tek oyunculu: `browser-sp/s1-*.png`.

## 7. Regresyon

Günlükler: `evidence/mp-field-fix0/regresyon/`.
- İlk tam koşu `ilk-kosu/` (betik `reg34.sh`).
- Fetih kuralı düzeltmesinden sonraki son koşu `son/` (betik `reg34b.sh`).
- p33 kontrolü aynı makinede `kontrol-p33-*.log`.

| Küme | p33 (`0ec5720`) | p34 aday |
|---|---|---|
| Node tam koşu | 205 paket · 6322 / 275 | **206 · 6325 / 275** (iki koşuda da aynı). Fark yalnız yeni `mp_field_fix0` (3/0); öteki 205 paket aynı |
| Chromium | — | İlk koşu **12/12** (yeni `browser-mp-field-fix0-sp` 1/0, war-coalition0 5/0, field-war-siege0 3/0, war-goals0 5/0, rival-blocs0 9/0, pregame-galaxy0 10/0, bgreturn-galaxy0 14/0, share-galaxy0 8/0, sp-map-war 4/0, fed-fleet0-sp 4/0, mobile-hud0 4/0, event-ux0 11/0). Son koşuda savaş ve SP dörtlüsü yine 1/0, 5/0, 3/0, 5/0 |
| MP8, ilk koşu | — | K 3/0, D 5/0, G 5/0, L 6/0, S 4/0, E 6/0, F 6/0, R (6 ay, kayıt/relay/devam) 5/0, N (ağ kopmaları) 9/0, Z 10/0, P (500/16/2/15 dk, DESYNC) 8/0. **W 2/2 ve Q 3/5 FAIL** (aşağıda) |
| MP8, son koşu | — | **Z 10/0, W 4/0**, K 3/0, R 5/0, N 9/0, Q **7/1** (Q6; tekrar koşular 8/0 ve 8/0) |
| `browser-mp74` (bildirim kaydırma / karttan karar) · `browser-mp75` | — | 7/0 · 6/0 |
| `browser-mp4` (MP.4 kayıt/devam, basit istemci `?basic=1`) | **8/5** | **8/5**. FAIL'ler aynı ve bu fazdan önce de vardı (ekran ölçüsü, eski host paneli seçicisi) |
| `browser-mp71` (MP.7.1 gerçek anlaşma penceresi) | **7/5** | **8/4**. FAIL'ler bu fazdan önce de vardı; aday bir vaka daha geçiyor |

**İlk koşudaki W / Q FAIL'i (kanıt korunur, `ilk-kosu/mp8-W.log`, `mp8-Q.log`):**
- Belirti: misafirin seçtiği Fetih hedefi host'ta "Geçersiz savaş hedefi seçimi" ile reddedildi.
- Kök neden: ilk sürümde host uzak insanın bilgisini yalnız son görüş adımında yazılan `e.mapOwners` kaydından okuyordu. Misafirin aynası ise yayın anında `humanMapKnowledge(görüş)` hesaplıyor: görünür sistemde güncel gerçek sahip, değilse anı. Görüş adımından sonra değişen sahiplikte iki taraf ayrıştı; bu testlerde fikstür sahipliği hemen verdiği için görüldü, gerçek oyunda da en fazla bir günlük pencere vardı.
- Düzeltme: host aynı hesabı `warPure` içinde yapar (salt okuma). Tekrar: W 4/0, Q 8/0.

**Q6 aralıklı FAIL** (son koşu, `son/mp8-Q.log`): misafirin toprak vaadi teklifi 20 sn içinde host'a ulaşmadı. Aynı kodla iki tekrar koşu 8/0 (`mp8-Q-tekrar2.log`, `tekrar3.log`). Teklif gönderilmezse durumu kaydeden tanı FAIL'den sonra eklendi; FAIL yeniden üretilemediği için kök neden **doğrulanmadı** (açık).

İsteğe bağlı eski senaryolar (`WAR_CENTER0`, `FEDFOUND0` vb.) ve `browser-95e3.js` bu fazda **NOT RUN**.

## 8. Yayın

| | |
|---|---|
| ZIP | `releases/stars-faz96h10p34.zip` (20 girdi: 19 runtime + `RELEASE-MANIFEST.json`) |
| ZIP SHA-256 | `1288a372d922e282c5fbd691aa5e95253dff73e7bdbf818bd21e423f235b35d4` |
| ZIP CRC32 | `F1E95EAB` (dosyanın tamamı) |
| Manifest SHA-256 | `23d522a5fb95761bc0b23702ef0d4390554d5103af643db6e7a51f0f2c3316f8` |
| Belirlenimlilik | `tools/package-release.py` iki kez → bayt bayt aynı |
| Doğrulama | ZIP çıkarılıp `python3 tools/verify-release.py --root <dizin>` → **DOĞRULANDI: 19 dosya; oyun build 96h10p34**; çalışma ağacında da aynı |
| Manifest | `parent_commit` `0ec5720…`, `parent_zip_sha256` p33 ZIP `c13dc793…76bd` |
| Koruma | `tests/helpers/mp-field-fix0-reviewed.{json,cjs}` (taban 0ec5720; 13 dosya, TAM METİN hunk) → `war-coalition0-reviewed` zincirinin başına; hash gevşetilmedi, test silinmedi |
| MP dosyaları | `research/mp0/mp-core.js`, `research/mp1/server/relay.js`, `research/mp1/client/{join,mp1-host,view}.js`, `research/mp1/deploy/smoke.js`, `research/mp6/client/guest-stars.js`, `research/mp71/client/mp71-dip.js` ZIP dışında ayrı teslimdir; Render'da relay + istemci birlikte p34 olmalı |

## 9. Açık işler ve sınırlar

- **Saha kaydı yok.**
  - Tek oyunculu ve host'un misafirsiz devamında "olay penceresi boş" yerelde yeniden üretilemedi (p33'te de PASS).
  - "İkinci denemede giremedi"nin gerçek nedeni doğrulanamadı; artık aşamasıyla ekranda.
- Kaydırılan kart kaydı misafir **cihazındadır**. Başka cihazdan katılınca kart yeniden görünür; karar ve kayıt host'ta doğrudur.
- MP8 Q6 bir koşuda aralıklı FAIL verdi (3 koşuda 1); kök neden doğrulanmadı (§7).
- Eski `browser-mp4` (8/5) ve `browser-mp71` (7/5 → 8/4) FAIL'leri p33'te de var; bu fazda düzeltilmedi.
- Fetih adayı oyuncunun **gözlem** bilgisidir; istihbarat düzeyi tek başına sahiplik bilgisi eklemez. Oyuncu bir sistemi gözlemediyse, istihbaratı olsa bile o sistem aday listesinde görünmez.
- Genel savaş sözü (`warOn`) MP insan müzakeresinde hâlâ yok. Bilerek pasif ve gerekçeli; tek oyunculuda aynen.
- Gerçek Render, fiziksel Android / PC ve LAN: **NOT RUN**. Kullanıcı kabulü yok; main'e birleştirme ya da dağıtım yapılmadı.
