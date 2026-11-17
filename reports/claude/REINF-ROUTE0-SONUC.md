# REINF-ROUTE.0 — Düşman sistemindeki ana filoya takviye + kayıp hedef başına tek sevkiyat kartı (p40 / MP.8.9b39)

Tarih: 17 Kasım 2026 · Dal `claude/stars-reinf-route0` · Taban PR #55 `claude/stars-mp-sync-fed1` `293de5a38e579dc1e051dfe4282e2ab8fcf1aeaa` (dal hareket etmemişti; başlangıç HEAD bu).
Oyun 96h10p40 / PWA `stars-v96h10p40` / MP.8.9b39. Save8 v8, paket 4, protokol 1 değişmedi; p40 paket yükleyicisi p6–p39, p25u1, p27s1 kabul eder.

Kanıt: `reports/claude/evidence/reinf-route0/`:

- `p39-kontrol.log`, `aday.log` (Node).
- `mp8/X/` + `mp8-x-konsol.log` (aday MP) ve `mp8-x-p39/` (p39 MP).
- `browser-sp/` (aday SP) ve `browser-sp-p39/` (p39 SP).
- `esdegerlik.log`. p39 kontrolü `git archive 293de5a` sabit kopyası.

## 1. Takviyenin düşman sistemindeki ana filoya ulaşması

### Kök neden (p39'da yeniden üretildi)

`reinforcementThreats(e)` bilinen her düşman SAHİPLİĞİNDEKİ / toprak iddiasındaki sistemi ve görünür silahlı düşman filosunu aynı kümeye koyar.
`reinforcementRoutes` hedef bu kümedeyse hemen boş sonuç döner (`if(!G.sys[target] || threats.has(target))`); kenarlarda da `threats.has(u)||threats.has(v)`.
Sonuç:

- Ana filo düşman sistemine girince sipariş seçimi (`reinforceFleet`) "Filoya giden rota kapalı veya tehlikeli — ulaşabilen tersane yok" der. Otomatik takviye sipariş vermez.
- Sınırdan önce verilmiş sipariş üretimden çıkınca (`dispatchBuiltFleet` → `followRallyFleet` → `shipmentRoute`) rota bulamaz: "Bilinen düşman tehdidi — güvenli rota yok".
- Dört denemede (5/10/20/40 gün) `paused` olur ve kendiliğinden bir daha denenmez. Rota açılsa ya da ana filo yer değiştirse de beklemede kalır.
- Adım denetimi (`stepFleets`, `safeThreats.has(nxt)`) aynı kümeyle hedefe girişi de keser.
- Gerçek galakside düşman başkentine giden yol düşmanın toprak iddiasındaki boş sistemlerinden geçer (X fikstüründe `20>12>44`; 12 iddia, 44 hedef). Bu yüzden yalnız hedefi muaf tutmak yetmedi.
- Ek bulgu: `fleetAutoReinforceTick` yalnız `f.e===0` filoları tarıyordu. MP'de misafir insanın "OTOMATİK TAKVİYE: AÇIK"ı host'ta hiç sipariş üretmiyordu (p39'da X2 FAIL).

### Düzeltme (main.js; yalnız insan devletler — AI seçimi aynen)

`reinforcementThreats` aynı kümeye üç alt küme ekler: `owned` (kolonili düşman sistemleri), `armed` (görünür silahlı düşman filosu), `held` (kendi silahlı filonun durduğu sistemler).
Yeni `reinforcementPassable(e,threats,id,target)` insan için şu kuralı uygular:

- Görünür silahlı düşman filosu olan sistem her zaman kapalı (güvenli yaklaşım yok).
- Onun dışında şunlar geçilebilir: hedef (ana filonun kuşattığı / işgal ettiği sistem), yalnız toprak iddiasındaki kolonisiz düşman sistemi, kendi silahlı filonun tuttuğu düşman sistemi.
- Kolonili düşman ara sistemleri kaçınılmaya devam eder.
- Karar yalnız oyuncunun bildiği sahiplik (`seen` / `pSeen`) ve gördüğü filolarla verilir (`pVis` / sensör menzili).

Bu kural üç yerde uygulanır:

- `reinforcementRoutes` (sipariş seçimi, güvenli sevkiyat rotası).
- Adım denetimi. İnsan takviyesi yolda tehdit görünce aynı adımda `followRallyFleet` ile güvenli sapma arar; yoksa bulunduğu güvenli sistemde bekler (`blocked`).
- `shipmentAutoResume`. İnsanın güvenli filo takviyesi deneme sınırında `paused` olmaz: 5 günde bir yeniden rota arar (kare başına değil). Ana filo yer değiştirince (`f.rallyTo` ≠ yeni hedef) hemen dener. Eski kayıttaki `paused` da aynı yoldan sürer. `attempts` ≤ 1 tutulur (yüklemede `restoreShipments` `paused`'a çevirmez).

Ayrıca:

- `shipmentStatus` bekleme yerini ve kendiliğinden devamı yazar (FİLO paneli, SEVKİYATLAR, SEVKİYATI YÖNET): "… · Bekleme yeri: <sistem> · rota açılınca / ana filo ulaşılabilir yere geçince kendiliğinden devam eder (n gün içinde yeniden denenir)".
- `fleetAutoReinforceTick` her insan devlet için çalışır (AI / ölü / yağmacı / kriz hariç; devlet başına günde en çok bir filo). Tek oyunculuda yalnız devlet 0 insan olduğundan davranış aynı.

Korunanlar:

- Bekleyen gemiler `joinFleet` / hedef / ödenmiş sipariş ile kalır ve `fleetPendingCounts` bileşimde sayar.
- Aynı eksik için ikinci sipariş ya da ödeme yok (R4).
- RNG kullanılmaz; yeni Save8 alanı yok.

Bilerek değiştirilen eski beklenti: `faz93b_pending_shipments_test.js` "4 denemede durur" vakası artık AI devleti için (`blocked(1)`), aynen geçer. İnsan için ayrı vaka eklendi: kare başına yol aramaz, 5 günde bir dener, `paused` olmaz. Test silinmedi.

### Kanıt (önce → sonra)

| Test | p39 (293de5a) | Aday |
|---|---|---|
| `node tests/reinf_route0_test.js` (R1–R11) | **2/9** — R1 "Bilinen düşman tehdidi — güvenli rota yok", R2 "ulaşabilen tersane yok", R4 "Otomatik deneme sınırı", R9 uzak insan siparişi yok … | **11/0** |
| `MP8_SCEN=X node tests/browser-mp8.cjs` (host + B, gerçek misafir arayüzü) | **2/3** — X1 `{"moving":0,"st":["Bilinen düşman tehdidi — güvenli rota yok · Otomatik deneme sınırına ulaşıldı…"],"main":6}`, X2 otomatik sipariş yok, X3 sekme yok | **5/0** |
| `node tests/browser-reinf-route0-sp.cjs` (tek oyunculu Chromium, gerçek oyun döngüsü) | **0/2** — S1 aynı belirti | **2/0** |

Node vakaları (zincir her vakada: tersane çıkışı → hareket → ana filo gemi sayısı artar):

- R1: sipariş sınırdan önce, üretim düşman sistemine girildikten sonra biter → katılır.
- R2: ana filo zaten düşman sistemindeyken Otomatik Takviye sipariş verir → teslim.
- R3: yolda görünür düşman filosu → aynı adımda sapma (0-6-7-5) → teslim.
- R4: güvenli rota yok → güvenli sistemde bekler. Panelde "Bekleme yeri" görünür, ikinci sipariş / ödeme yok, 400 gün sonra bile `paused` değil; tehdit kalkınca teslim.
- R5: beklerken ana filo ulaşılabilir sisteme geçince hemen devam eder.
- R6: kayıt / devam → hedef korunur → teslim.
- R7: hedefte görünür düşman filosu → girmez.
- R8: AI kuralı aynen.
- R9: MP uzak insanın Otomatik Takviyesi.
- R10: toprak iddiasındaki boş sistemlerden geçiş.
- R11: kolonili ara sistem kapalı; kendi filon tutuyorsa açık.

X senaryosu (orta, seed 22, 5 AI; B'nin tersanesi 5 → AI 3 başkenti 44, yol `20>12>44`):

- X1: B FİLO panelinde gerçek dokunuşla TAKVİYE SİPARİŞİ verilir, sonra ana filo 44'e geçer ve üretim biter. Host'ta tersane çıkışı → hareket → 6→7. B aynasında da 7.
- X2: B ana filo 44'teyken gerçek dokunuşla OTOMATİK TAKVİYE: AÇIK yapar. Host sipariş verir ("Üretim sürüyor; gemiler otomatik bu filoyu izler") ve teslim eder → 8. B aynasında 8.
- X3: aşağıda (Kart).

Fikstür hedefi sürümden bağımsız ölçütle seçilir (bilinen hiper-yol + geçiş izni); p39 ve aday aynı hedefle koşar. Hedef sistemdeki AI filoları fikstürde kaldırılır (görünür filo vakası R7).

## 2. Haberler → Sevkiyatlar: kayıp hedef başına tek kart

Öncesi: Haber ağında sevkiyat sekmesi yoktu. FİLO → SEVKİYATLAR her sevkiyatı ayrı satırda listeliyordu (40 gemi → 35 ayrı "hedef kayıp" satırı, p39 C1).

Sonrası:

- `UI.shipmentLostCards()` mevcut `fleetRecoveryGroups` (Toplu Kurtarma ile aynı gruplama, eski filo kimliğine göre) üstünden çalışır.
- Kart başlığı: **"Filo #id · Hedef kayıp · n takviye gemisi"** (+ "k ödenmiş sipariş bekletiliyor"). Eski filo adı kayıtta tutulmuyor (`fleetJournal`'a ad eklemek her birleşmede Save8'i değiştirirdi), bu yüzden kimlik kullanılır.
- Kart açılınca (`<details>`) sınıf × sayı ve bekleme sistemi başına gemi / sevkiyat sayısı görünür. Her sevkiyatın kendi **SEVKİYATI YÖNET** düğmesi ve **TOPLU KURTARMA** (mevcut `fleetRecoveryOpen` penceresi: yeni hedef / beklet / birleştir) kartın içindedir.
- Kayıp hedefli sevkiyatlar ayrı satır olarak tekrarlanmaz.
- Haber ağı penceresine **Sevkiyatlar · n** sekmesi eklendi (`ArchiveUI.shipments`, FİLO sekmesindeki aynı bölüm). Misafirde görünüm eylemi `shipmentsNews` (guest-stars `VIEW`).

| Test | p39 | Aday |
|---|---|---|
| `node tests/reinf_route0_cards_test.js` | **0/4** | **4/0** |

- C1: 40 gemi / tek eski hedef / 3 sistem → 1 kart, 35 SEVKİYATI YÖNET, sistem başına 20 / 10 / 10.
- C2: aynı adlı iki eski filo → 2 kart (3 ve 8 gemi).
- C3: 5 sisteme dağılmış 30 gemi, kayıt / devam sonrası aynı kart ve aynı sistem toplamları.
- C4: Haberler → Sevkiyatlar sekmesi.
- MP X3: ana filo yok olur, 4 sevkiyat kalır. B gerçek dokunuşla Haberler → **Sevkiyatlar · 4** sekmesini açar → tek kart "Filo #29 · Hedef kayıp · 4 takviye gemisi", host'un `fleetRecoveryGroups` toplamıyla aynı, TOPLU KURTARMA düğmeli.
- SP S2: 7 gemi / iki sistem → tek kart. Oyun içi kayıt → sayfa yenilenir → OYUNA DEVAM ET → aynı kart ve aynı sistem satırları.

## 3. Regresyon ve uyumluluk

- Save8 / RNG eşdeğerliği: `STARS_CONTROL_ROOT=<p39 kopya> node tests/reinf_route0_equivalence_test.js` → 3 tohum × 48 ay (8 nokta) Save8 SHA-256 + RNG birebir. Adayda her 6 ayda kart işlevleri çağrılır. **SONUÇ: §3.1.**
- Mevcut takviye / sevkiyat / kurtarma testleri: faz88a_1 30/0, faz92b1 19/0, faz93a1 21/0, faz93a 15/0, faz93b 32/0 (güncellenen vaka yukarıda), faz93c 47/0, faz95c1 24/0, field_war_siege0 20/0.
- Tam Node koşusu: **§3.1.**
- Koruma: yeni `tests/helpers/reinf-route0-reviewed.{cjs,json}` (taban 293de5a, 8 dosya tam metin hunk'ı). `stripReviewedSyncFed1` önce `stripReviewedReinfRoute0`'ı çağırır.
- Sürüm: `main.js BUILD_ID`, `sw.js CACHE`, `view.js` / `relay.js` MP sürümü, `RELEASE-MANIFEST.json` (parent 293de5a, parent ZIP p39 `3eabc156…`), `mp-core` p40 paket uyumu (p39 dahil).

### 3.1 Tam koşu / eşdeğerlik

- Eşdeğerlik, son kaynakla: **PASS 3/0**. seed 11 / 22 / 404, her biri 48 ay × 8 nokta, Save8 SHA-256 + RNG birebir (`evidence/reinf-route0/esdegerlik.log`).
- `node tests/run-all.js` (4 işçi): **SUITES 231, GEÇEN 6463, KALAN 275**. p39 tabanı 228 / 6447 / 275.
  - +3 paket: reinf_route0, _cards, _equivalence. Equivalence kontrol kökü verilmeyince NOT RUN 0/0 basar.
  - +16 geçen: 11 + 4 + faz93b'nin yeni insan vakası.
- Kalan 53 paketin her biri p39 sabit kopyasında aynı GEÇEN / KALAN sayısıyla koşuldu: hepsi aynı. Git geçmişi isteyen `beta_fed_found0_compat` ise p39 git worktree'sinde koşuldu, yine 1/5. `mp89_ui_integrity` iki kökte de GEÇEN satırı basmıyor. Yani yeni FAIL yok; bunlar eski, bu fazdan bağımsız FAIL'ler (silinmedi).
- Tam koşunun yeniden yazdığı navy / audit JSON ve PNG dosyaları geri alındı.

## 4. Paket

- ZIP: `releases/stars-faz96h10p40.zip` (20 girdi). SHA-256 `cfa143aad6e653dfc08b76abb9b7786aa75779dee9a305627a275983150d95f4`, CRC32 `19DD6418`.
- Paketleme iki kez aynı SHA'yı verdi. Çıkarılmış kökte `python3 tools/verify-release.py --root` → DOĞRULANDI 19 dosya, build 96h10p40.
- Beklenen `/mp/version` (yerel relay): `{"mp":"MP.8.9b39","build":"96h10p40","files":{"mp-core.js":"ce501dd07a85","relay.js":"9690f66b9819","mp1-host.js":"f5dc296c1a3d","join.js":"65c28db3714f","mirror.js":"56019070fa24","guest-stars.js":"ed4dfc4e4340","mp71-dip.js":"932c92d12cbc","mp7-setup.js":"a7391d21552c"}}`.
- Render dalı `claude/stars-reinf-route0` seçilmeli. Render'a dağıtım yapılmadı.

## 4.1 Ek: müttefik sensör paylaşımıyla görülen düşman filosu (17 Kasım 2026)

**Bulgu (doğrulandı):** devlet 0 dışındaki insan oyuncunun (MP misafiri) "görünür silahlı düşman filosu" kümesi `reinforcementThreats` içinde yalnız kendi sistemleri, kendi filoları ve bunların komşularından kuruluyordu. Misafir haritasını kuran `humanVisionContext` ise (ayna, `mirror.js`) bunlara ek olarak şunları katar:

- kendi sensör menzili (`mods.sensor`),
- etkin müttefik / vasal sensör paylaşımı (`visionFrom`, `shareVis`).

Sonuç: misafir düşman filosunu haritada görüyordu, ama takviyesi o sistemi güvenli sayıp düz yoldan gidiyordu. Durum ancak bir komşu sisteme varınca fark ediliyordu.

**Düzeltme (main.js):**

- AI dışı ve devlet 0 dışı devletlerin filo görünürlüğü artık `humanVisionContext(e).visible` kümesinden geliyor; misafirin haritasıyla birebir aynı küme.
- Yalnız şu an görünen filo sayılıyor: paylaşım bitince ya da filo görünürlükten çıkınca rota kararı o filonun konumunu kullanmıyor.
- `explorationContext` → `reinforcementThreats` iç çağrısı `REINF_VIS_BUSY` bayrağıyla eski kümeyi kullanıyor; sonsuz döngü yok.
- Yan etki: uzak insanın keşif engeli de artık haritada gördüğü filoyu sayıyor.
- AI ve devlet 0 (host / tek oyunculu, `pVis` zaten paylaşımı içerir) değişmedi.

**Test:**

- `R12` (`node tests/reinf_route0_test.js`): p40 öncesi **FAIL** ("haritada görülen silahlı düşman rota tehdidi"), sonrası **12/0**. p39 kopyasında R12 FAIL.
- R12'de doğrulananlar:
  - paylaşım yokken 3 görünmez;
  - paylaşımla misafir haritası 3'ü görür ve rota tehdidi olur;
  - ilk rota sapmadır (0-6-7-5);
  - paylaşım bitince 3 ne haritada ne tehdit kümesinde.
- İlgili testler: faz93b 32/0, faz93a 15/0, faz95c1 24/0, field_war_siege0 20/0, faz88a_1 30/0, faz93c 47/0, faz94b keşif 37/0, mp1_actor_vision 2/0 + 2/0, mp_techlux0_intel 3/0, mp_sync_fed1_defcall 7/0. faz96h9 9/2 tabandakiyle aynı (eski FAIL).
- MP8 X: **5/0**.
- Tam Node koşusu ve Save8 / RNG eşdeğerliği bu ek için yeniden **NOT RUN**. Değişen dal yalnız AI dışı ve devlet 0 dışı devlette çalışır; tek oyunculu ve AI yolunda kod aynı.

**Paket (güncellendi, build aynı 96h10p40):** ZIP SHA-256 `e14ff859e48f305cb197bbe9bf13ea84cc1c3d4f117995d3a4971d85b9cc8793`, CRC32 `2B7C1EB2`, `verify-release --root` DOĞRULANDI. Önceki p40 ZIP özeti (`cfa143aa…`) geçersizdir.

## 5. Açık / NOT RUN

- Kolonili düşman ARA sistemlerinden geçiş bilerek kapalı (gezegen savunması). Ana filo iki kolonili düşman sisteminin arkasındaysa ve ara sistemi kendi silahlı filon tutmuyorsa takviye bekler (panelde yer + neden görünür).
- AI takviye / sevkiyat kuralı değişmedi (askerî strateji ayrı faz kararı).
- Uzun oturum donması (saha) ve kayıttan dönüşte kaybolan olaylar (saha): **AÇIK**. Bu fazda yeni saha verisi yok; MP-SYNC-FED.1 bulguları geçerli.
- Render / fiziksel Android / gerçek internet: **NOT RUN**.
- Kullanıcı kabulü yok; hiçbir madde TAMAMLANDI değildir.
