# BETA-FED-FLEET.0 — federal donanma: ortak fon, fondan bakım, federal sipariş (13 Kasım 2026)

Dil kuralı: **PASS / FAIL / NOT RUN** ayrı yazılır. Bütün tarayıcı testleri bu konteynerde **yerel Chromium**'dur (üretim relay süreci + yerel TLS vekili, oyuncu başına kesilebilir hat). Gerçek Render oynanışı, fiziksel PC / Android ve LAN **NOT RUN**. Kullanıcı kabulü yok; hiçbir madde TAMAMLANDI değildir.

## 1. Kaynak, dal, sürüm

| | |
|---|---|
| Taban | PR #40 · `claude/stars-mp-p0-desync2` @ `43a36127d5bf66918ff4a7f89ae515ca40149789` (GitHub HEAD ile doğrulandı) — 96h10p27 / MP.8.9b24 |
| Aday dal | **`claude/stars-beta-fed-fleet0`** (Render'da denenebilecek dal) — tabandan, taslak PR hedefi `claude/stars-mp-p0-desync2` |
| Commit 1 — kod / test / yayın | `7172cb1` |
| Commit 2 — rapor | `21f12d6` |
| Commit 3 — devam turu (kod / test / yeni ZIP) | `478dbe4` |
| Commit 4 — rapor güncellemesi | yalnız belge / kanıt (son SHA PR'da ve sohbette) |
| (devam turu içeriği) | SP Chromium testi, iptal penceresi düzeltmesi (yeni ZIP), E5 bekleme kökü; rapor güncellemesi (son SHA PR'da ve sohbette) |
| Sürüm | oyun **96h10p28** / PWA `stars-v96h10p28` / MP **MP.8.9b25** |
| Uyumluluk | Save8 **v8**, MP paket **4**, protokol **1** değişmedi. p28 paket yükleyicisi p6–p27 ve p25u1 paketlerini kabul eder (gerçek p27 paketi C2 ile doğrulandı). |
| Konsey Muhafızları / askerî komite AI | bu fazda **yok** (ayrı faz) |

## 2. Bulgular P27'de doğrulandı (taban FAIL)

`node tests/beta_fed_fleet0_test.js` tabanda **0/11**, adayda **11/0** (`evidence/beta-fed-fleet0/node-taban-p27.txt`, `node-aday.txt`). Taban ölçümü `taban-p27-cift-bakim-olcumu.json`:

- `FED_LAWS.filo` katkısı tüketicisi olmayan `f.treasury`'de birikiyordu (ayda üye × 4 alaşım). Federal fon (`f.fund`) bunu görmüyordu.
- Federal filo bakımı **başkanın kişisel** enerji/alaşım bakımına giriyordu (iki kru: 11,5 → 47,3 enerji; 2,31 → 9,59 alaşım). Ayrıca fon da enerji düşüyordu (71,6) → **çift bakım**. Fon alaşım bakımı ödemiyordu.
- `buildFederalShip` / `canBuildFederal` motorda vardı ama arayüz, AI ve MP'de **hiç çağıran yoktu**. Gemiyi anında yaratıyordu (kuyruk/süre yok).
- MP aynası federasyon fonunu herkese `0` gönderiyordu (üye kendi fonunu göremiyordu).
- Dağılmada federal filolar başkanın kişisel filosuna dönüşüyordu, fon kayboluyordu.

## 3. Ne değişti

**Tek ortak fon (`diplomacy.js`, `main.js`).**
- `FED_LAWS.filo` katkısı ve tür haracı (`FED_TYPES[t].tithe`) aynı oranlarla `f.fund`'a gider. Hibe oranları değişmedi.
- Her katkı `f.contrib[üye]={ala,ene}` defterine yazılır. Bu yeni isteğe bağlı Save8 alanıdır ve yalnız federasyon varken oluşur.
- Eski Save8 `f.treasury` yüklemede (`restorePoliticalWorld`) **bir kez** `fund.ala`'ya aktarılır ve `0` olur. Aktarılan hazine kimseye atfedilmez.
- Federasyon paneli gerçek katkı oranını, Ortak Filo yasasını, harcanabilir bakiyeyi (3 aylık rezerv düşülmüş), gemi/kuyruk/sınır ve tahmini bakımı gösterir.

**Fondan bakım.**
- `fleetUpkeep` / `fleetAlloyUpkeep` federal filoları atlar. Başkanın kişisel bakımına girmezler.
- `fedFundTick` ayda bir federal filoların enerji + alaşım bakımını fondan düşer.
- Fon yetmezse ödenebilen alınır, bakiye 0'ın altına inmez. Ardından mevcut kural uygulanır: **en zayıf federal filo dağıtılır**. Gizli başkan bedeli yok.

**Federal sipariş (`ui.js` tersane paneli).**
- Başkanın kendi uygun tersanesinde "FEDERAL SİPARİŞ" bölümü var. Aynı tersane kuyruğu, `shipProductionDays` süresi, `shipBuildAccess` sınıf/teknoloji/Konsey yasağı ve `yardLock` kullanılır.
- Bedel (`ala × 1,15`) kabulde fondan **bir kez** düşer. İş kuyrukta `fed`/`fedPaid` taşır. Gemi süre sonunda **o anki başkana** `federal:true` filo olarak doğar.
- Kuyruk satırında görünenler: `FEDERAL` etiketi, ödenen bedel, kalan gün, "iptalde fona döner". Ret nedeni düğmede ve `#fedOrderWhy`'da gösterilir.
- İptal (`cancelShipOrders`) federal ödemeyi kişisel kasaya değil fona döndürür. Yinelenen iptal ikinci iade yapmaz (`fedRefunded`).

**Sınırlar (`fedShipQuote`).** Sipariş için şunların hepsi gerekir:
- başkanlık,
- savaş gemisi sınıfı (kor/muh/kru/zir),
- kendi tersanesi,
- üretilmiş + kuyruktaki federal gemi < üye × 4,
- ayda en çok bir kabul,
- fon ≥ bedel,
- siparişten sonra kuyruktakiler dahil **3 aylık** enerji + alaşım bakım rezervi.

Üye sayısı düşüp donanma sınırın üstünde kalırsa yeni sipariş durur. Mevcut gemiler zorla dağıtılmaz.

**Başkan değişimi ve dağılma.**
- Başkan değişince federal filolar, bekleyen işler ve ayrılmış ödemeler federasyonda kalır. Gemi tamamlandığında o anki başkana doğar.
- Aylık tarama, sipariş verenin tersanesi el değiştirmişse ya da sipariş veren üyelikten çıkmış/ölmüşse işi kapatır ve ödemeyi fona bir kez döndürür.
- Dağılmada (`fedDissolve` → `fedDissolveFunds`) bekleyen federal işler kapanır (ödeme fona), federal filolar dağıtılır ve fon dağılma anındaki **canlı üyelere kayıtlı katkı oranıyla** iade edilir. Yuvarlama kalanı son alıcıya gider.
- **Katkı kaydı yoksa** (eski kayıt) iade **eşit paylaşılır**. Kullanılan kural `f.fundReturn.rule` (`'contrib'` / `'equal'`) olarak döner ve F8'de denetlenir.

**AI başkan (`aiFederalFleetOrder`).**
- Aynı `orderFederalShip` yolunu kullanır. Yalnız bir üye canlı, korsan/vahşi olmayan bir dış devletle **fiilen savaştaysa** sipariş düşünür.
- Bu, aktif federasyon savaşı ya da açılmış savunma yükümlülüğü demektir. Askerî tüzüğün varsayılan `defense:'auto'` ayarı tek başına yetmez: ilk denemede barışta sipariş verdiği görüldü (F9 ilk FAIL), bu nedenle eklendi.
- Ayda en çok bir sipariş verir. Kaynak başına eşik `2 × (bedel + 6 aylık bakım)`; askerî türde ×0,8, ticaret türünde ×1,3. 3 aylık rezerv her durumda geçerlidir.
- Yeni RNG çekimi yoktur (F9 RNG eşitliği denetler).

**MP.**
- `research/mp0/mp-core.js` yeni `fedShip` komutu (`{kind,sys,key}`). Host **uygulama anında** `fedShipQuote` ile şunları yeniden denetler: başkanlık, üyelik, tersane, sınıf, kapasite, ay ve fon/rezerv. Ret `rules:fed` + gerekçe döner.
- Kök `[sys, f]` (txCaptureGraph geri alma). Aynı `cid` önbellekteki sonucu döndürür, ikinci ödeme olmaz.
- Ayna (`research/mp6/mirror.js`): yalnız **üyeye** kendi federasyonunun gerçek `fund`'u ve `fundView` gider (gemi/kuyruk/sınır/tahmini bakım/aylık hak). Üye olmayana `fund` `{0,0}` gider, `fundView` gitmez. `contrib` ve siparişlerin tersane konumları hiç gitmez.
- Misafir (`guest-stars.js`): gerçek tersane düğmesi `orderFederalShip` sarmalayıcısıyla `fedShip` komutuna iner. Yerel dünya değişmez; kabul host ACK'i ve güncel aynayla gelir.

## 4. PASS / FAIL / NOT RUN

### 4.1 Motor (Node)

| Test | Sonuç |
|---|---|
| `node tests/beta_fed_fleet0_test.js` — B0 bulgular, F1 eski hazine + iki ardışık yükleme, F2 aylık fon/katkı/panel, F3 yetersiz fon (negatif yok, en zayıf filo dağılır, başkan ödemez), F4 sipariş→tamamlanma + kapasite + ayda bir + rezerv, F5 iptal, F6 üretimde başkan değişimi, F7 kayıttan devam, F8 dağılma iadesi (katkı / eşit), F9 AI başkan, F10 tersane el değiştirir / üyelik biter | taban **0/11 FAIL** · aday **11/0 PASS** (ilk aday koşusunda F3/F4/F10 test beklenti hataları ve F9 tasarım FAIL'i düzeltildi) |
| `node tests/beta_fed_fleet0_mp_test.js` — M1 misafir başkan siparişi, M2 başkan olmayan üye / üye olmayan / başkasının tersanesi / sınıf dışı, M3 aynı cid + aynı ay, M4 eski başkan reddi + yeni başkan, M5 üye/üye olmayan ayna görünürlüğü, M6 misafir motoru aynayı yükler + aylık hak, M7 tamamlanma + aynada federal filo | taban **0/7 FAIL** · aday **7/0 PASS** |
| `node tests/beta_fed_fleet0_compat_test.js` — gerçek p27 kaynağıyla (git show 43a3612) üretilmiş Save8 + MP paketi (eski hazine birikmiş, p27 biçimli federal filo) | **3/0 PASS**: hazine bir kez fona, iki ardışık kaydet/yükle toplamı aynı + sabit nokta, p27 paketi doğrulanır/yüklenir, bozuk bütünlük reddi |
| `node tests/beta_fed_fleet0_equivalence.cjs` — P27 (sabit kopya kök) ↔ aday, aynı Save8'den ay ay ham Save8 + RNG, orta/5 AI, tohum 11/22/23/42/404, 36 ay | **5/5 PASS**: federasyonsuz bütün aylar (11:36, 22:34, 23:36, 42:36, 404:35) bayt + RNG eşit |
| Etkin senaryo (aynı koşu, 22 ve 404'te AI federasyonu doğar; 60 ay + 12 ay izleme) | ilk fark federasyonun doğduğu ayın ertesinde ve 12 ay boyunca **yalnız** `world.feds.#.contrib` (yeni katkı defteri); fon değerleri, filolar ve RNG birebir aynı (AI federasyonlarında Ortak Filo yasası ve federal filo oluşmadı). Ortak Filo / eski hazine / federal filo farkları fikstürle B0, F1–F10 ve C1'de beklenen değerlerle ölçüldü. `evidence/.../esdegerlik-p27-aday.{json,txt}` |

### 4.2 Gerçek Chromium MP — `MP8_SCEN=L node tests/browser-mp8.cjs` (host + 2 misafir)

**Misafir başkanın gerçekten sipariş verdiğini ve federal geminin gerçekten üretildiğini L2 + L4 kanıtlar.**

- **L2:** misafir B kendi telefon sayfasında gerçek `#panel [data-a="fedShip"]` düğmesine Playwright `tap` ile dokunur. Komut çerçevesi B'nin gerçek WebSocket'inden yakalanır. Host'ta tersane kuyruğunda **tek** `fed` işi oluşur, `e=B`. Fon 3000 → 2963 olur (bir kez 37). B'nin kişisel alaşımı değişmez. B dokunduğu anda yerel dünyası değişmez; kuyruk ve fon ACK + güncel aynada gelir, `FEDERAL` satırı görünür ve aylık hak kullanıldığı için düğme kapanır.
- **L4:** iş host'un gerçek `dailyTick`'iyle 34 günde tamamlanır. **Tek** federal `kor` gemisi B'nin federal filosu olarak çıkar. B güncel aynada filoyu kendi filosu olarak görür.

| Adım | Sonuç |
|---|---|
| L0 kurulum (üretim relay süreci + TLS vekili, MP.7 tasarım lobisi, 3 insan + 5 AI, seed 22) | PASS |
| L1 B (başkan) gerçek sistem panelinde FEDERAL SİPARİŞ ve gerçek fonu (3000/3000, sınır 8) görür; üye olmayan C fon `{0,0}`, defter / katkı / düğme yok | PASS |
| L2 gerçek dokunuş → host'ta tek iş, fondan bir ödeme, ACK sonrası aynada kuyruk | PASS |
| L3 B'nin hattı 4 sn kesilip bağlanır, AYNI çerçeve yeniden gönderilir → `dup:1`, fon/kuyruk değişmez; aynı ay yeni komut "ayda bir" ile reddedilir | PASS |
| L4 gerçek dailyTick ile tamamlanma → tek federal gemi, B'nin aynasında | PASS |
| L5 host başkanlığı alır (B'nin aynası henüz eski, düğme açık) → B'nin gerçek dokunuşu host'ta `rules:fed` "Yalnız federasyon başkanı…" ile reddedilir; fon/kuyruk aynı; güncel aynada düğme kalkar; host Save8 geçerli | PASS |

- **İlk koşu 3/3 FAIL** (`evidence/.../mp8-L-ilk-FAIL/`). Host tarafı doğruydu: tek iş, tek ödeme, `dup:1`, eski başkan reddi. Ama testin `synced` beklemesi host'un 700 ms'ye kadar ertelenen aynasını beklemiyordu, bu yüzden misafirde eski dünya okundu.
- Bekleme, host'un o misafir için son ayna revizyonuna ulaşılmasına bağlandı; ürün kodu değişmedi.
- Sonraki iki koşu **6/0 PASS** (`mp8-L/`, `chromium-mp8-L.txt`).

### 4.3 Regresyon

| Test | Sonuç |
|---|---|
| Tam Node `node tests/run-all.js` — ilk aday koşusu | 193 paket, 6213/284. Tabana göre 5 eski pakette 6 yeni FAIL; hepsi istenen davranışın eski beklentisi (aşağıda) |
| Tam Node — son koşu | **194 paket, 6222/278**: FAIL sayısı taban ile aynı (§4.4) |
| `MP8_SCEN=D` (P27 desync kurtarma + D4 misafir dar yatay HUD) | 5/0 PASS |
| `MP8_SCEN=G` (geçici AI koruması) | 5/0 PASS |
| `node tests/browser-mobile-hud0.cjs` (640×360, 800×360, 915×412, 1280×720) | 4/4 PASS |
| `node tests/browser-event-ux0.cjs` | 11/0 PASS |
| `node tests/mp_p0_guard_test.js` | 7/0 PASS (tam Node koşusu içinde) |
| `faz96e_federation_test.js` 28/1 | tabanda da aynı FAIL (`admission rejects allies`); bu fazdan bağımsız |

**Eski beklentisi değişen 5 paket.** İlk FAIL günlükleri `evidence/.../ilk-FAIL-*.log` ve `node-run-all-aday-kosu1.txt` içinde korunur. Hiçbir test silinmedi, hash gevşetilmedi. Beklentiler yeni davranışın **aynı katılıktaki** karşılığına çevrildi; her satırda `BETA-FED-FLEET.0` yorumu var. 95B'nin aynı testteki normalizasyon emsali izlendi.

| Paket | Eski beklenti | Yeni beklenti |
|---|---|---|
| `faz85a_political_save_integrity` | hazine 250 korunur; tur farkı yalnız `pariahs` | `treasury 0` ve `fund.ala` tam **250**; tur karşılaştırması aktarılmış biçimden başlar (aktarım F1/C1'de ayrıca denetlenir) |
| `faz85b_load_idempotency` | 5 yüklemede `treasury 250` | 5 yüklemede `treasury 0`, `fund.ala 250` (çoğalmaz) |
| `faz92b1_ship_lock` | `buildFederalShip` anında 1 filo | anında filo yok; tersane kuyruğunda tam 1 federal `muh` işi |
| `faz95b_federation_reform` | dağılmada federal filo kişiselleşir | dağılmada federal filo `G.fleets`'ten kalkar, gemisi 0 |
| `faz96gd1_federation_budget` | Ortak Filo ödemesi `treasury`'ye ≥ 3 | aynı ödeme `fund.ala`'ya ≥ 3, kasa 0 |

Düzeltmeden sonra beş paket taban sayılarına döndü: 175/2, 134/2, 19/0, 66/2, 19/0.

### 4.4 Son tam Node koşusu

**194 paket, GEÇEN 6222, KALAN 278** (`evidence/.../node-run-all-aday-son.txt`; §4.6 ui.js düzeltmesinden sonra yeniden: aynı, `node-run-all-aday-son2.txt`).

- Taban p27'nin eski FAIL sayısı da 278'dir (`mp-p0-desync2/aday1-node-run-all.txt`). Paket paket karşılaştırmada fark yalnız yeni paketlerdedir: `beta_fed_fleet0_test` 11/0, `beta_fed_fleet0_mp_test` 7/0, `beta_fed_fleet0_compat_test` 3/0 ve P27 commit 2'nin `mp_p0_guard_test` 7/0'ı.
- Bu fazda yeni FAIL kalmadı. Eski 278 FAIL (`faz95d_identity` Node v22 kayan nokta dahil) silinmedi.
- Koşu sonrası `tests/navy-95a-after-*.json`, `audit-95d/.../war-lines-on.png`, `audit96e1/identity-distribution.json` geri alındı; `tests/audit96g2` depo dışına taşındı.

### 4.5 Devam turu (aynı gün): tek oyunculu Chromium, iptal penceresi, E / F, aralıklı E5 kökü

**Tek oyunculu gerçek Chromium — `node tests/browser-fed-fleet0-sp.cjs`: 4/4 PASS** (640×360, 800×360, 915×412 dokunma; 1280×720 fare). Kanıt: `evidence/.../sp/`. Her görünümde denetlenenler:
- federal bölüm panel içinde ve yatay taşmasız; dört sınıf düğmesi dokunulabilir yükseklikte;
- gerçek dokunuş → tek federal iş, fondan bir ödeme, kişisel kasa aynı, kuyrukta `FEDERAL` satırı;
- aynı ay düğmeler kapalı ve "Bu ay federal sipariş zaten verildi" nedeni görünür;
- gerçek ✕ + onay penceresi → fon geri, kişisel kasa aynı;
- sonraki ay yeni sipariş → gerçek `dailyTick` ile tek federal korvet devlet 0'ın federal filosu olur;
- sayfa hatası yok.

İlk iki koşu 0/4 FAIL verdi; ikisi de test kusuruydu ve `sp-ilk-FAIL/` içinde korunuyor:
1. Seçici `.box` satırını çocuk sayısı nedeniyle dışlıyordu.
2. Panel yenilemesi dokunuştan sonra ertelendiği için okuma erken yapıldı. Test artık `#panel .fedTag` görünene kadar bekliyor; ürün yenilemesi 5 sn içinde her görünümde geldi.

**Ürün düzeltmesi (`ui.js`, iptal penceresi).** Federal sipariş iptalinde pencere yalnız "Kaynak iadesi: Yok" gösteriyordu. Ödeme fona dönüyordu ama kullanıcıya söylenmiyordu. Pencereye `#fedCancelRefund` "Federal fona iade ▰37" satırı ve açıklaması eklendi; SP testi bunu denetler. Bu değişiklik için pinler, manifest ve ZIP yeniden üretildi (§5).

**`MP8_SCEN=F`: 6/0 PASS · `MP8_SCEN=L` (yeniden): 6/0 PASS · `browser-mobile-hud0`: 4/4 PASS · tam Node: 194 paket, 6222/278.**

**`MP8_SCEN=E`:**
- İlk koşu 5/1 FAIL: E5 "sıra misafir aynasında", P27 kosu2'deki aralıklı E5 ile birebir (`chromium2-mp8-E-FAIL-E5.txt`).
- **Kök neden (test):** host aynası son gönderimden sonra 700 ms'ye kadar ertelenir (`p.mirrorTimer`). E5'in `synced`'i yalnız misafirde `appliedRev===rev` bekliyordu, bu yüzden ertelenmiş ayna henüz gönderilmeden "eşit" sayıyordu. İddia, zamanlayıcı ateşlenmeden okunursa eski dünyayı görüyordu.
- L senaryosunun ilk FAIL'i de aynı mekanizmaydı.
- **Düzeltme:** `tests/helpers/event-ux0-mp.cjs` `synced`, host'un bu misafire son ayna revizyonunu (bekleyen zamanlayıcı yokken) bekler. İddia aynı kaldı, süre artırılmadı.
- Tanı alanı: üç yeni koşunun **üçünde de** yayın anında bekleyen ayna vardı (`pendingMirrorAtPublish:true`, 329 / 338 / 791 ms bekleme), yani eski bekleme üç koşuda da erken dönebilirdi.
- Sonuç: **E 3/3 PASS** (`e5-kok-neden/`). E5'in tarihsel aralıklı FAIL'i bu test-bekleme yarışıyla açıklanıyor; ürün kodu değişmedi.
- **E2** ("tek komut 2 !== 1", çift dokunmada ikinci komut) bu turda 4 koşuda yeniden üretilmedi; kökü **AÇIK** kalıyor.

### 4.6 NOT RUN

- Gerçek Render oynanışı, fiziksel PC / Android, LAN.
- `MP8_SCEN=P` 500 sistem / 16 AI uzun dayanıklılık.

## 5. Yayın

| | |
|---|---|
| ZIP | `releases/stars-faz96h10p28.zip` · 849 908 bayt · 20 girdi (19 runtime + manifest) — devam turundaki `ui.js` iptal penceresi düzeltmesiyle yeniden üretildi (ilk p28 ZIP'i `5d61efc7…` / `157C50D1` geçersizdir) |
| SHA-256 | `095e3c931ed6f5feabff6d8ce9b649ada68f68778b7acd0279cd77f6ae870a8a` |
| CRC32 | `FEDCCBC3` |
| Manifest | `RELEASE-MANIFEST.json` SHA-256 `ec56071bc164cd84e1a9c86a4499f0c603f0971056d727ae4169e9b5bed36f41` · phase `BETA-FED-FLEET.0` · build `96h10p28` · parent `43a3612` · parent ZIP `56c46199…84de6` (p27) |
| Doğrulama | `python3 tools/verify-release.py` ve açılmış ZIP'te `--root` PASS; ikinci paketleme bayt-bayt aynı (deterministik) |
| Değişen runtime | `diplomacy.js`, `main.js`, `economy.js`, `ui.js`, `sw.js` (CACHE) |
| MP kaynakları | `mp-core.js` (fedShip + p27 paket uyumu), `mirror.js`, `guest-stars.js`, `view.js` / `relay.js` (MP.8.9b25) |
| Koruma zinciri | yeni `tests/helpers/beta-fed-fleet0-reviewed.{json,cjs}` (43a3612'ye tam metin hunk'ları) ← `mp-p0-guard-reviewed` ← `mp-p0-desync2-reviewed` ← … |

Render dağıtımı ve main birleştirmesi yapılmadı.

## 6. Açık işler

- **Kullanıcı kabulü:** gerçek cihazda misafir başkan siparişi; Render'da `claude/stars-beta-fed-fleet0`.
- **Federal filo komutası:** gemi o anki başkanın `e` kimliğiyle doğar. Başkan değişince (seçim, ardıllık, aylık başkan eşitlemesi) federal filolar mevcut motor kuralıyla yeni başkana geçer. Federal filonun ayrı komuta/yetki modeli (komite) yok; Konsey Muhafızları ve askerî komite AI ayrı fazdır.
- **Eski hazinenin kökeni:** aktarılan hazine katkı defterine atfedilmez. Dağılmada kayıtlı katkı yoksa iade eşittir; kısmi kayıt varsa yalnız kayıtlı oranlar kullanılır (eski hazine payı da bu orana göre dağılır).
- **P27'den devralınan açıklar:** E2 aralıklı FAIL'i (E5'in kökü §4.5'te test beklemesi olarak bulundu), özgün Render desync oturumunun reddedilen alanı, eski KATIL/dealSend aralıklı kökleri.
