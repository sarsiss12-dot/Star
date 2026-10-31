# STARS — MP.6.2: savaş ve diplomasi entegrasyonu + federasyon / vasallık doğrulaması

Durum: **geliştirme sürümü.** Misafir, gerçek STARS pencerelerinden şunları yapabilir:

- savaş ilan eder;
- saldırmazlık, ticaret, ittifak, sensör ve geçiş antlaşmalarını teklif eder ve kabul eder;
- ittifak / ticaret anlaşmasını bitirir; ambargo koyar, hediye gönderir;
- statüko ve barış önerir;
- federasyon ve vasallık işlemlerini yürütür.

Yeni savaş ya da diplomasi motoru yazılmadı. Her işlem motorun kendi karar kapısından geçer.

- Taban: MP.6.1 `a78e892` (PR #19). PR #17 → #18 → #19 zinciri açık; hiçbiri merge edilmedi.
- Değişmeyenler:
  - 19 runtime dosyası, build `96h10`;
  - Save8 ve `releases/stars-faz96h10.zip`.
- Yeni ZIP yok.

## 1. Savaş ilanı

**Akış**, tamamı gerçek pencereler:

1. SAVAŞ HEDEFİ SEÇ;
2. hedef seçimi (`setwg`);
3. misafir host'tan önizleme ister (`warQuote`, salt okuma);
4. **gerçek STARS önizleme penceresi** bu veriyle açılır;
5. ONAYLA (`warFinalConfirm`) → `war` komutu.

**Önizleme** motorun `warDeclarationPreview`'u ve **ilan edenin kendi bilgisiyle** hesaplanır:

- yalnız temaslı devletler;
- bilinen federasyon bağları;
- istihbarat ≥3.

Misafirin aynası kabuk olduğundan yerel önizleme yanlış olurdu; bu yüzden host'tan gelir.

**`war` komutu**, tek oyunculu son onayın zinciri, yalnız komutu verenin devleti için: `warDeclarationAccess` → `declareWar` → `setWarGoal`.

- Ağdan = doğrudan motor: Save8 ve RNG aynı (Node).
- Aynı `cid` önbellekten döner; ikinci ilan "Savaş zaten sürüyor" ile reddedilir. Böylece ikinci savaş ya da ikinci Etki bedeli olmaz.
- Reddedilenler: sahte devlet `forged-empire`; temassız hedef `no-target` (yok gibi görünür); geçersiz hedef / fazla alan `bad-params`.
- **Konsey yasağı:**
  - Motor yalnız devlet 0'a "bilerek çiğne" (ceza + savaş) yolunu açıyordu.
  - Diğer devletlere AI zarı atıyordu (`rnd() < .75` → vazgeç). Uzak insan bu yüzden AI gibi zar atardı.
  - Artık insan için devlet 0 dalı aynen uygulanır: önizlemede risk, `councilPunish`, savaş. Zar ve RNG çekimi yok.
- Motorun kamu iletileri ("… gerekçesiz savaş açtı") host günlüğüne motorun yazdığı gibi gider; ilan edene özel iletiler (konsey uyarısı, savaş hedefi) kendi listesine.

**Çok taraflı savaş:** motorun kendi akışı korunur.

- Federasyon savunma yükümlülüğü (`fedDefend`): insan üye B, AI 2'ye yapılan saldırıda savaşa girdi. Ağdan = motor.
- Senyör koruması (`overlordDefend`): ağdan = motor. Bu fikstürde motor senyörü savaşa sokmadı; MP sonucu da aynı.
- **Savaşa sürüklenen uzak insan** artık kendi listesinde "SAVAŞ BAŞLADI — X (savunma) · gerekçe" görür (`warSweep`). Motor bunu yalnız devlet 0'a bildiriyordu.

## 2. İttifak, antlaşmalar, ikili işlemler

- **MP.3 teklif maddeleri:** kaynak ve barışa ek olarak `nap` (saldırmazlık), `pact` (ticaret), `ally` (ittifak), `intel` (sensör paylaşımı), `passage` (sınır geçişi).
  - Değerlendirme ve uygulama motorun `dealQuote` / `executeDeal`'i ile.
  - Casusluk ağı (`spynet`) kapsam dışı (`bad-params`).
- **Gerçek anlaşma penceresi:** antlaşma düğmeleri (`dealPact`) → TEKLİFİ SUN → karşı insan gerçek gelen kutusundan kabul / ret / karşı teklif.
- **Yeni komutlar:**
  - `endAlliance` (motorun `canEndAlliance` / `endAlliance`'ı; federasyon içi ittifakta motorun "Ayrıl / İhraç kullan" gerekçesi);
  - `unpact` (tek oyunculu FESHET satırları);
  - `embargo` (`setEmbargo`);
  - `gift` (tek oyunculu `giftDo` satırları; alan uzak insan bildirim alır);
  - `statusQuo` / `statusQuoReply`.
- **Statüko:**
  - AI hedefe tek oyunculu yol (doğrudan, `canStatusQuo` kapısı).
  - İnsan hedefe **teklif** gider; kararı o insan, gerçek gelen kutusundaki "Statüko barışı" kaydından verir.
  - Statüko teklifleri oturumdadır; MP.4 kayıt paketine girmez (MP.6.3).

## 3. AI insan adına karar vermez (MP.6.2 düzeltmeleri)

| Bulgu | Eski davranış | Şimdi |
|---|---|---|
| AI barış teklifi uzak insana | `UI.peaceOffer(e)` **host'un** gelen kutusuna düşüyordu (yanlış çift) | Uzak insanın kendi kutusuna MP.3 "barış" teklifi. Hedef deterministik: o gün teklif yazılmış ilk işlenmemiş AI-olmayan devlet. |
| AI statüko | `aiStatusQuoTick` devlet 0 dışındaki her hedefle AI kararıyla imzalıyordu | Uzak insana teklif olur. 400 günlük koşuda AI'nın B adına statüko imzası 0. |

- `aiTurn` EconomyLedger sarmalayıcısının içinde olduğundan metni yamalanmadı; `UI.peaceOffer` sarıldı.
- `aiStatusQuoTick` MP.3.1 yöntemiyle (`patchEngine`) genişletildi.
- Uzak insan yokken davranış ve RNG birebir aynı (MP.0–MP.6.1 Node regresyonu PASS).

## 4. Ayna dünya (savaş ve diplomasi verisi)

- **Yeniden numaralandırma:** devlet kimliğiyle anahtarlı **17 harita daha** yeniden numaralandırılır: `warSince`, `warStart`, `warDefense`, `warCause`, `wg` (savaş hedefi), `peaceAt`, `passage`, `coldWar`, …
  - MP.6 hatası: host'la olan savaş misafirde başka bir devlete görünüyordu.
- **Kabuklar:** misafirle ikili kamu durumları (savaş başlangıcı, savunma tarafı, barış, geçiş, soğuk savaş, ambargo).
- **Üçüncü taraf savaş ve ittifakları** artık motorun bilgi kuralıyla gelir (`knownWarPairs`, `knownAllianceBond`: temas + taraf ya da istihbarat ≥3).
  - MP.6 temaslı her savaşı veriyordu; bu bir sızıntıydı.
- **Savaş defteri:** misafirde motorun `restoreWarLedger`'ı savaş haritalarından cepheleri kurar (savaş kipi çalışır). Geçmiş metrikler host'ta.
- **Host'un karar verdiği düğme kapıları:** misafirin aynasında eksik veri olduğu için host'un motor kararı kullanılır. Yalnız `{id, ok, why}` gider.
  - statüko (`dip.contacts.sq`, işgal haritası);
  - federasyona başvuru (`pol.others.vias`, aracı üyenin Etkisi);
  - üye kabul önergesi (`pol.fed.admit`, adayın ittifak bağları; yalnız üyeye).

## 5. Federasyon — gerçek tarayıcıda (browser-mp62)

| İşlem | Sonuç |
|---|---|
| Kurma girişimi | Gerçek düğme kapalı; host önizlemesi motor gerekçesiyle: "En az 2 bağımsız, kabul eden AI müttefik gerekir". **Kurma tarayıcıda yapılamadı (motor şartı).** |
| Başvuru | Gerçek BAŞVUR (AI üye 2 üzerinden) → AI üyelerin kabul oylaması (motor) → davet B'nin gerçek gelen kutusunda → KATIL → üye. **PASS** |
| Oylama | AI başkanın yasa önerisi → B'nin gerçek gelen kutusu → EVET. **PASS** |
| Yasa önerisi | B, gerçek federasyon penceresinin YASALAR sekmesinden önerir; kabul edildi. **PASS** |
| Davet | B, C'yi gerçek İLİŞKİ sayfasından davet eder → kabul önergesi → davet C'nin gerçek gelen kutusunda → C reddeder. **PASS** |
| Ayrılma | Gerçek YÖNETİM sekmesi → AYRIL → gerçek onay penceresi. **PASS** |
| İhraç / reform / anayasa / ortak savaş önergesi, karar uygula, hibe | **NOT RUN.** Bağlanmadı (MP.6.3); misafirde soluk ve açık uyarılı. |

## 6. Vasallık — gerçek tarayıcıda

| İşlem | Sonuç |
|---|---|
| Teklif | B → C talep (motorun izin verdiği yön), gerçek vasallık penceresinden. **PASS** |
| Karşı teklif | C, gerçek gelen kutusu → KARŞI TEKLİF HAZIRLA → bir hükmü değiştirir → gönder. **PASS** |
| Kabul | B, gerçek gelen kutusundan kabul → host'ta sözleşme. **PASS** |
| Üçüncü taraf | Müzakereyi görmez. **PASS** |
| Bağımsızlık talebi | Gerçek düğme açık; host motoru "12 aylık müzakere soğuma süresi" ile reddetti. **Tarayıcıda tamamlanamadı (motor kuralı).** |
| Himaye talebi (seek), yenileme | Tarayıcıda **NOT RUN**. Himaye: motor bu fikstürde yalnız talep yönüne izin verdi. Yenileme: 24 aylık yeniden müzakere tarihi. |
| Bağımsızlık desteği | **NOT RUN** (MP.6.3). Motor `supportIndep` başka devletin vasallığına müdahaledir; gizli güç/ilişki verisi ister. |
| Kayıt / yükleme | MP.3.1 / MP.4 testleri (bekleyen müzakere kayıttan devam eder) PASS. |

## 7. Barış ve çok taraflı savaş

- Barış (insan–insan): gerçek anlaşma penceresinde barış maddesi → karşı insan gerçek gelen kutusundan kabul → `executeDeal` → `makePeace`. **PASS**
- Statüko teklifi → gerçek gelen kutusundan ret → savaş sürer. **PASS**
- Statüko kabulü: bu fikstürde motorun koşulu sağlanmadı; düğme host kapısıyla kapalı. **Tarayıcıda NOT RUN.**
- **İki insanın ortak savaşı (Node):** A ve B aynı AI'ya farklı hedeflerle savaş açar → ayrı cepheler ve ayrı hedefler. A barış yapınca B'nin savaşı sürer. **PASS**
- **Toprak paylaşımı:** yeni algoritma yazılmadı; motorun mekaniği değişmedi, MP komutları ona dokunmuyor.
  - Motor kuralı: insan üyeli bir paylaşım önerisini AI uygulamaz (`settlementAgendaTick`: AI-olmayan üye varsa atla). AI insan adına karar vermiyor.
  - Ama uzak insanın paylaşım önerisini görüp onaylayacağı MP komutu yok; böyle bir öneri bekler (MP.6.3).
  - Ortak paylaşımın tarayıcı testi **NOT RUN**.

## 8. Çok oyunculu duraklatma (inceleme; yeniden tasarım yapılmadı)

**Kök neden:**

- `UI.openModal` her STARS penceresinde `modalPrevSpeed = G.speed; setSpeed(0)`.
- `UI.notify(pause:true)` da `prePause` ile duraklatır.
- `closeModal`, `prePause || modalPrevSpeed`'i geri yükler.
- Host'un `G.speed`'i ortak hız olduğundan host'un açtığı her pencere herkesi durdurur. MP.6.1'den beri herkese bildiriliyor.
- Misafirin pencereleri hiçbir şeyi durdurmaz (misafirde yerel hız 0).

**Savaş / diplomasi etkisi:**

- Host penceresi açıkken misafir komutları yine işlenir (komutlar hıza bağlı değil).
- Kritik hata yok; bu fazda düzeltme yapılmadı.

**Önerilen tasarım (MP.6.3):** host'ta bir **duraklatma nedenleri kaydı** tutulur.

- Nedenler: `explicit` (oyuncu komutu), `window:host`, `event:<tür>`, `background`, `network`.
- Etkin hız = son açık hız komutu; engelleyici bir neden varsa 0 ya da "düşük hız" ayarı.
- Sıradan yönetim pencereleri MP'de nedene girmez.
- Olay ve karar pencereleri ayara göre düşük hıza iner; kapanınca **son açık ortak hıza** döner (`prePause` değil).
- Oyuncunun açık duraklatması korunur. Çakışan nedenler sayaçla yönetilir.
- Uygulama yeri: `mp1-host.js`'te `UI.openModal` / `closeModal` / `notify` sarmalayıcıları (runtime değişmez).

## 9. Testler

- `tests/mp62_core_test.js` — **13/13 PASS**:
  - savaş (ağ = motor, tekrar, yetki, konsey);
  - çok taraflı (federasyon savunması, senyör yolu = motor);
  - antlaşmalar;
  - ittifak sonu / fesih / ambargo / hediye;
  - statüko;
  - AI'nın insan adına kararı (barış teklifi yönü, 400 gün statüko);
  - ayna savaş verisi;
  - MP.4 paketi;
  - host düğme kapıları;
  - iki insanın ortak savaşı.
- `tests/browser-mp62.cjs` — **10/10 PASS**: host + 2 misafir, 3 ayrı Chromium, gerçek dokunma (§5, §6).
- Komut gecikmesi (dokunuş → host'ta uygulama; yerel relay): 25–196 ms.
  - Savaş 40 ms; kabul 34–196 ms; federasyon 25–79 ms; vasallık 35–91 ms.

## 10. Regresyon

| Test | Sonuç |
|---|---|
| Tam Node regresyonu | 153 paket: 6241 GEÇEN / 3 KALAN (yalnız bilinen `faz95d_identity` seed 11/99/404) |
| `mp62_core` / `browser-mp62` | 13/13 · 10/10 PASS |
| `browser-mp61` / `mp6` | 13/13 · 11/11 PASS (düzeltme sonrası yeniden koşu) |
| `browser-mp5` / `mp5_docker` | 10/10 (Docker kipi) · 6/6 PASS |
| `browser-mp4` | 13/13 PASS |
| `browser-mp0` / `mp1` / `mp11` / `mp2` / `mp3` / `mp31` | 20/20 · 22/22 (düzeltme sonrası) · 10/10 · 14/14 · 12/12 · 11/11 PASS |
| `browser-96h10` (tek oyunculu) | 27/27 PASS |
| ZIP / SHA-256 / CRC32 / manifest | değişmedi; `verify-release --root` DOĞRULANDI |

**Notlar:**

- **İlk regresyon koşusunda `browser-mp1` 1 FAIL — gizlilik hatası bulundu ve düzeltildi.**
  - MP.6.1 hız bildiriminde, host'un devletiyle teması olmayan misafire host'un lobi adı gidiyordu.
  - Host sayfasında bu ad `CFG.name`, yani **devlet adıdır**: temassız devlet adı sızıntısı.
  - Düzeltme:
    - iç duraklatmalarda (pencere, arka plan) misafire hiç ad gitmez;
    - host'un açık değişikliğinde temassız misafir "Host" görür.
  - Sonrasında `browser-mp1` 22/22 PASS.
- **İlk koşuda `browser-mp6` 2 FAIL — beklenen davranış değişikliği.**
  - Savaş, ittifak, pakt ve hediye artık çalışıyor; "engelli eylemler" listesi hâlâ desteklenmeyen 8 eylemle güncellendi.
  - İkinci FAIL bunun sonucuydu: açılan gerçek savaş penceresi MP çubuğunu örtüyordu.
  - Sonrasında 11/11 PASS.
- Tam Node koşusu bu küçük düzeltmeden önce yapıldı. Düzeltme yalnız `speed` iletisini etkiler; `mp6*` Node paketleri yeniden koşuldu: 30/0.

## 11. Açık sorunlar / MP.6.3

1. **Federasyon:** ihraç, reform, anayasa, ortak savaş önergeleri, karar uygulama, hibe. Kurma tarayıcıda yapılamadı (motor şartı: 2 AI müttefik).
2. **Vasallık:** himaye (seek) ve yenileme gerçek pencereden; bağımsızlık desteği.
3. **Statüko teklifleri** MP.4 kaydına girmeli.
4. **Ortak savaş sonrası toprak paylaşımı:** uzak insanın paylaşım önerisini görmesi ve onaylaması (MP komutu + ayna); tarayıcı testi.
5. **Duraklatma nedenleri kaydı** (§8).
6. Casusluk ve pazar (kapsam dışı bırakıldı).
7. Misafirin yerel kapılarıyla host kararı arasında başka sapan düğmeler olabilir. Bu fazda statüko, başvuru ve davet düzeltildi; diğerleri tarandıkça.

## 12. NOT RUN

- Fiziksel Android.
- Gerçek internet.
- LAN.
