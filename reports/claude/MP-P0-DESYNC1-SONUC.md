# MP-P0-DESYNC1 — Misafir haritası donuyor: kesirli gün kayıt doğrulaması + misafir kurtarma (13 Kasım 2026)

Dil kuralı: **PASS / FAIL / NOT RUN** ayrı yazılır. Bütün tarayıcı testleri bu konteynerde **yerel Chromium**'dur (üretim relay süreci + yerel TLS vekili). Gerçek Render oynanışı, fiziksel PC / Android ve LAN **NOT RUN**. Kullanıcının host kaydı bu işte verilmedi; özgün Render oturumunda hangi alanın reddedildiği **dosyayla doğrulanamadı** (§3).

## 1. Kaynak ve teslim

| | |
|---|---|
| Başlangıç | `claude/stars-beta-event-ux1` @ `bcbd6973db8d9adf6cc25cda9efafa42bde3a477` (PR #37 ucu; GitHub ile doğrulandı) — `96h10p25` / `MP.8.9b21` |
| Hotfix dalı | **`claude/stars-mp-p0-desync1`** (Render'da sonradan kullanılacak tam dal adı) |
| Bitiş | oyun **`96h10p26`**, PWA `stars-v96h10p26`, MP **`MP.8.9b22`**; Save8 **v8**, MP paket **4**, protokol **1** değişmedi |
| Paket | §8 |

## 2. Kusur ve yeniden üretim

**Kusur (yerelde kanıtlandı).** `economy.js` `applyInternalPolicy` süreleri `started + gün` diye yazar:
`{started:G.day, until:G.day+q.days, after:G.day+q.cooldown}`. Yükleme kapısı `validInternalPolicy` ise **çıkararak** denetliyordu:
`until − started === days` ve `after − started === cooldown`. Gerçek oyun döngüsünde gün kesirlidir (`dt × hız`). Kayan nokta farkı motorun kendi yazdığı değeri reddeder:

| Karar | G.day | yazılan | eski denetim |
|---|---|---|---|
| Halkı yatıştır (180 / 360) | 1000.1 | until 1180.1 | 1180.1 − 1000.1 = **179.9999999999999** → RED |
| Yerel özerklik (360 / 720) | 1650.0001 (≈ 2214.08) | after 2370.0001 | 2370.0001 − 1650.0001 = **720.0000000000002** → RED |

`validSaveEnvelope` (Save8 zarfı) bu kapıyı her kolonide çağırır. Sonuç: o politikayı taşıyan **her** kayıt metni reddedilir:
- misafirin aynası (fark sonrası ve TAM ayna). Ayna yalnız misafirin **kendi** kolonilerinin `crisisPolicy`'sini taşır. Bu yüzden yalnız kararı veren misafir donar, öteki misafir oynamaya devam eder.
- host'un oyun içi Save8'i ve bu Save8'i içeren MP kayıt paketi. AI'lar da aynı işlevi `aiInternalCrisis` ile çağırır. Yani bir AI kararı da host kaydını yüklenemez yapabilir.

Node testleri kusuru hiç tetiklemiyordu: test adımı 0,5 gündür ve ikilik sistemde tamdır.

**FAIL-önce — Node** (`node tests/mp_p0_desync1_test.js`; gerçek host karar yolu: misafir komutu `internalQuote → internalPolicy`):

| | Taban p25 `bcbd697` | Aday p26 |
|---|---|---|
| A relief @1000.1: fark / tam ayna / host Save8 / MP paketi | **FAIL** — hepsi `false`; paket `validatePackage` geçer, `loadWorld` → `save8-apply` | PASS |
| A autonomy @1650.0001: aynı dört yol | **FAIL** (aynı) | PASS |
| B yanlış sahip / tür / süre (bir ulp dahil) / bekleme / tarih reddi | FAIL (özgün değer bile reddediliyor) | PASS (13 bozuk biçim reddedilir) |
| C ret nedeni ayırt edilir | FAIL (`saveLoadReject` yok) | PASS |
| Toplam | **0 / 4** | **4 / 0** |

Kanıt: `evidence/mp-p0-desync1/node-once-base-p25.txt`, `node-probe-base-p25.txt` (taban: `delta false · full false · host8 false · pkg save8-apply`), `node-candidate.txt`. Öteki misafir her iki sürümde de kurmaya devam eder.

**FAIL-önce — Chromium** (`MP8_SCEN=D node tests/browser-mp8.cjs`, host + 2 misafir):
- Taban p25 D1 **FAIL**: `autonomy @1650.0001: B aynası kurulamadı {"applied":0,"rev":0,"fail":3}`.
- Misafirin MP çubuğu: `aşama: ready · ayna r0 · eşitleme: uygulanan r0 / host r6 · apply · Galaksi verisi kurulamadı: kayıt doğrulaması reddetti`. Oyun tarihi `2214.08` (`taban-p25-d1-misafir-donuk-r0.png`).
- Aday: D1 PASS.

## 3. Kullanıcının Render oturumu — neler doğrulanabildi

Fotoğraftaki bulgular: `96h10p24 / MP.8.9b20`, `host bağlı`, `aşama: ready`, `uygulanan r0 / host r844`, `Galaksi verisi kurulamadı: kayıt doğrulaması reddetti`, tarih `2214.08`.

- **Doğrulanan:** p24/p25 misafir istemcisi her TAM aynada `appliedRev`'i 0'a sıfırlıyordu.
  - "uygulanan r0", bir TAM aynanın geldiğini ve **kurulamadığını** gösterir. Bu TAM ayna, bekçinin isteği ya da yeniden bağlanma ile gelir.
  - Yani reddedilen yalnız bir fark değildi. Host'un o oyuncu için ürettiği tam dünya da reddediliyordu.
  - Taban p25 bu satırı aynı sözcüklerle ve `2214.08` tarihinde yeniden üretti (§2).
- **Doğrulanan:** "kayıt doğrulaması reddetti" yalnız `deserialize` → `false` dalında yazılır, yani `validSaveEnvelope` / eşzamanlılık kapısı. İstisna dalı başka metin yazar.
- **Doğrulanamayan:** hangi alanın reddedildiği.
  - Ekran görüntüsünde alan yok. p24 bu bilgiyi hiç tutmuyordu.
  - Host kaydı ve konsol günlüğü verilmedi.
  - Kesirli gün politika kusuru, bu belirtiyi tam üreten, yerelde kanıtlanmış tek mekanizmadır. Ama özgün oturumun tetikleyicisi olduğu **kanıtlanmadı**. Aynı zarf kapısındaki öteki kurallar (sistem / devlet / filo kimliği, iç uyarılar) de aynı metni üretir.
  - Host'un o andaki Save8'i ya da `.starsmp.json` paketi gelirse p26 yükleyicisi reddi alan yoluyla adlandırır (`saveLoadReject()` → örn. `envelope / crisisPolicy.after @ sys[12].p[3].col.crisisPolicy`).
- **"rules:resources"** ayrı bir komut reddidir (misafirin kaynağı yetmedi; host'un meşru cevabı). Donmayla ilgisi yok.

## 4. Düzeltme

**Doğrulama (runtime).**
- `economy.js`: `internalPolicyIssue(x,n)` → `''` ya da kısa kod (`type`, `keys`, `v`, `owner`, `kind`, `date`, `until`, `after`).
  - `until === started + days` ve `after === started + cooldown`: motorun yazdığı işlemin aynısı.
  - `validInternalPolicy` = `!internalPolicyIssue`.
- Tarih yuvarlanmadı, Save8 sürümü değişmedi, doğrulama atlanmadı.
- Sahip / tür / tarih / alan kuralları aynı kesinlikte. Bir ulp farklı süre bile reddedilir (Node B).
- Motorun yazdığı her değer yeni kuralı tanım gereği sağlar. Eski kuralın kabul ettiği motor değerleri de kabul edilir (`x+d` aynı çift duyarlıklı işlem).

**Ayırt edilebilir yükleme reddi (runtime).**
- `main.js`: `saveLoadReject()` → `{stage, code, path}`.
  - `stage`: `json` | `envelope` | `apply` | `busy`.
  - `code`: `root`, `day`, `date`, `system`, `empire`, `internalWarning`, `crisisPolicy.<kod>`, `fleet`, `syntax`, `exception`, `transaction`.
  - `path`: alan yolu, örn. `sys[5].p[0].col.crisisPolicy`.
- Başarılı yüklemede `null`. Kayıttaki değer, ad, jeton ya da oda anahtarı tutulmaz.
- `validSaveEnvelope` / `deserialize` dönüş değerleri ve kuralları aynı. Yalnız ret anında neden kaydedilir.

## 5. Misafir kurtarma (`research/mp6/client/guest-stars.js`, `mp6.css`)

| Davranış | Uygulama |
|---|---|
| Ret anında son geçerli dünya kalır | `deserialize` işlem içinde geri alır. Alınan ayna **bırakılmaz**: sonraki farklar üstüne uygulanır, en sık 3 sn'de bir yeniden denenir. Host verisi düzelince kendiliğinden kurulur. |
| "Dünya güncel değil" uyarısı | MP çubuğu açılır. Şunları yazar: `Dünya güncel değil — son geçerli rN · <kod>`, `DÜNYA GÜNCEL DEĞİL` satırı, **YENİDEN EŞİTLE** ve **TANIYI KOPYALA** düğmeleri (≥ 44 px). |
| Alınan / uygulanan ayrımı | Tanıda üç değer ayrı: `ayna rX` (alınan), `uygulanan rY` (son **başarıyla** kurulan) ve `host r` (nabız). Tam aynada artık 0'a sıfırlanmaz (p24'te `r0` görünüyordu). |
| Emir engeli | Dünya güncel değilken dünyayı değiştiren emir host'a **gitmez** (`MP1Join.cmd` → `stale-world`, açık uyarı). Salt okuma önizlemeleri ve ortak hız serbesttir. Gönderilmiş emirler kendiliğinden yeniden gönderilmez. |
| ACK ≠ etki | Onaylı emrin dünya revizyonu uygulanan aynadan büyükse tanıda `onaylı, dünyada bekliyor n` görünür. |
| Sınırlı otomatik kurtarma | İlk tepki TAM ayna istemektir (0 / 3 / 10 sn aralıkla en çok 3 istek). Aynı nedenle 3 ardışık TAM ayna reddedilirse istek **durur**. Doğrulama reddinde yeniden bağlanma döngüsü yoktur. Yanıt hiç gelmezse bir kez aynı koltuğa yeniden bağlanılır. |
| Elle YENİDEN EŞİTLE | Yalnız bu misafirin yetkili TAM aynası için **tek** istek gider. Bağlantı yoksa ya da 10 sn yanıt gelmezse aynı koltuğa yeniden bağlanılır. Host ve öteki misafirler etkilenmez. |
| Başarı bildirimi | "Dünya yeniden eşitlendi (rN)" ileti geldiğinde değil, dünya **kurulduğunda** gösterilir. Uyarı o zaman kalkar. |
| Geç iletiler | Aynı soketten eski revizyonlu fark yok sayılır (`lateDelta`), revizyon geri gitmez. Boşluk isteği 3 sn'de birden sık gönderilmez. Başlangıç başarısız olduysa farklar istek doğurmaz; YENİDEN DENE beklenir. |
| Kopyalanabilir tanı | Sürüm, bağlantı, aşama, revizyonlar, ret aşama / kod / yol, sayaçlar, son 12 olay. Oda kodu / anahtarı, jeton, oyuncu adı ve başka devlet verisi **yok** (test D2 denetler). |
| Host kaydı | Host mevcut ÇOK OYUNCULU → OYUNU KAYDET (MP paketi 4) ve oyun içi Save8 ile kaydeder. p26'da kesirli günlü politikalar dahil yüklenir. Misafir aynası hiçbir aşamada host kaydına dönüşmez (`packageFromSave8` misafiri reddetmeye devam eder; `mp_p0_sync_test` C). |

## 6. Test sonuçları

### 6.1 Hedefli (yeni)

| Test | Taban p25 `bcbd697` | Aday p26 |
|---|---|---|
| `node tests/mp_p0_desync1_test.js` (A×2 gerçek host yolu, B koruma, C neden) | **0 / 4** | **4 / 0** |
| `MP8_SCEN=D` D0 kurulum (host + 2 misafir, ayrı Chromium, üretim relay + TLS) | PASS | PASS |
| D1 kesirli gün (1650.0001 autonomy, 1000.1 relief) misafir komutu → host kararı → B aynası; C etkilenmez; host Save8 + MP paketi | **FAIL** — `B aynası kurulamadı {"applied":0,"rev":0,"fail":3}` | PASS |
| D2 kayıp fark / reddedilen veri / elle kurtarma / tam bir kez | FAIL (kurtarma yolu yok) | PASS |
| D3 geç fark + yinelenen ACK + kalıcı retle sayfa yenileme | FAIL (kurtarma yolu yok) | PASS |

**D2 ölçümleri (aday, `aday-d2.json`):**
- Kaybolan fark: B sayfasında tek `mirrorDelta` düşürüldü. Bir sonraki farkın tabanı uymadı. TAM ayna istendi ve dünya 1,9 sn'de yeniden kuruldu. Yeniden bağlanma olmadı.
- Reddedilen veri: host'ta B kolonisinin politika süresi bir gün bozuldu (`until = started + 181`).
  - B: `DÜNYA GÜNCEL DEĞİL`, neden `envelope / crisisPolicy.until @ sys[5].p[0].col.crisisPolicy`.
  - Gün son geçerli dünyada kaldı; son geçerli r9, reddedilen r10.
  - `ship` emri yerelde engellendi (`stale-world`); `internalQuote` önizlemesi gitti.
- Otomatik istekler: 3 istek gitti. 3 ardışık TAM ayna reddinden sonra istek durdu. Ardından 8 sn'de yeni istek yok, yeniden bağlanma 0.
- C kesintisiz: aynı sürede 4 revizyon kurdu; ret 0, yeniden eşitleme 0.
- Elle YENİDEN EŞİTLE (gerçek dokunma), veri hâlâ bozukken: tam 1 TAM ayna isteği gitti, yine ret, döngü yok.
- Host verisi düzeldi ama B o farkları kaçırdı (2 fark düşürüldü). Elle YENİDEN EŞİTLE dünyayı 0,63 sn'de kurdu.
  - Uyarı kalktı; aynı devlet / ad / bağlantı; B günü = host günü.
- Engellenen emir host'a hiç gitmedi (kuyruk değişmedi). İlk yeni `ship` emri host'ta **tam bir kez** uygulandı (kuyruk +1). Etkisi aynada görüldü (`onaylı, dünyada bekliyor` 0).
- TANIYI KOPYALA (`aday-d2-tani.txt`): sürüm, revizyonlar, neden, sayaçlar. Oda kodu, jeton ve `token` / `hostKey` sözcükleri yok (test denetler).

**D3 (aday, `aday-d3.json`):**
- Eski revizyonlu fark yok sayıldı: r22 → r22, gün değişmedi.
- Aynı `cid` ile yeniden gönderilen emre host `dup:1` döndü; kuyruk değişmedi.
- Sahte eski ACK eşitlemeyi bozmadı.
- Host verisi bozukken (`after = started + 719`) B sayfası yenilendi:
  - Başlangıç 3 retten sonra 11,7 sn'de **durdu**. Ekranda `Galaksi verisi kurulamadı: kayıt doğrulaması reddetti (crisisPolicy.after)` ve YENİDEN DENE göründü.
  - Sonraki 10 sn'de yeni deneme yok.
- Host düzelince YENİDEN DENE → oyun 0,43 sn'de açıldı, aynı devlet.

### 6.2 Uzun koşu — 500 sistem / 16 AI / 2 insan

`MP8_SCEN=P MP8_P_FF=45 MP8_P_MIN=15 MP8_P_DESYNC=1` — s500, 16 AI + host + 1 misafir, seed 404, host'un **gerçek** oyun döngüsü en yüksek hızda (gün kesirli). Misafir gerçek dokunmayla oynar (maymun, tohum 1). Her 120 sn'de misafir kendi kolonisi için `internalQuote → internalPolicy` gönderir. Fikstür: istikrar 40 + kaynak.

| | Taban p25 (her 60 sn) | Aday p26 (her 120 sn) |
|---|---|---|
| Sonuç | **FAIL** | **PASS** (P0 + P1) |
| Gerçek zaman / gün aralığı | 58. sn'de kalıcı donma; gün 1356 → 1718 | 15 dk; gün 1355 → 6392 (2214.08 ≈ gün 1650 geçildi) |
| Kesirli politika kararı | 1 (gün 1476.7512; eski kural reddeder) | 8 (biri — gün 1486.3332 — eski kural reddeder) |
| Misafir ayna reddi | **65** (TAM ayna isteği 64; döngü) | **0** |
| Misafirin durumu | `rev 0 / applied 0`, `Galaksi verisi kurulamadı: kayıt doğrulaması reddetti` | — |
| En uzun misafir duraklaması (host ilerlerken) | 21 sn ve kalıcı | < 3 sn (örnekleme aralığı); en büyük gün farkı 18 gün |
| Kurtarma süresi | yok (kendiliğinden toparlanmadı) | gerekmedi ("dünya güncel değil" 0 kez) |
| Komut yansıması | karar etkisi görülmedi; gemi siparişi görülmedi | 8/8 karar 1,9–6,9 sn'de misafir dünyasında; 20/20 hareket ok, 3/3 gemi siparişi aynada |
| Host Save8 (koşu sonu) | **geçersiz** | geçerli. 7 politika, 6'sı AI'nın, 7'si kesirli gün. |
| Dokunma eylemi | 35 | 1643 |

İlk aday koşusu (`aday-P-15dk-ilk-kosu-FAIL-pencere.*`) korunur. 7. kararın etkisi 20 sn'de görülmedi. Neden: maymunun açtığı pencere aynayı tasarım gereği bekletiyordu (`windowHolds 1`); misafir ret 0, host Save8 geçerliydi. Test, öteki komut ölçümüyle aynı kurala getirildi: karar ve beklemeden önce pencere kapatılır, pencere bekletmesi duraklama sayılmaz. Ürün değişmedi.

### 6.3 Regresyon

| Test | Taban p25 | Aday p26 |
|---|---|---|
| Tam Node (`run-all.js`, 2 işçi) | 189 paket **6190 / 278** | 190 paket **6194 / 278**. Paket paket **aynı**; tek fark yeni `mp_p0_desync1_test.js 4/0`. Koruma zinciri ve PERF1 / PERF2 eşdeğerlik paketleri dahil. Bilinen 278 eski FAIL (54 paket) bu fazdan bağımsız. |
| `mp_p0_sync_test` (MP-P0) · `mp6_mirror_test` · `mp1_relay_test` · `mp86_nebula_cache_test` | — | 6/0 · 8/0 · 14/0 (manifest güncellemesinden önce 13/1, yalnız özet farkı) · 3/0 |
| `MP8_SCEN=P` FF 45 + 3 dk + P2–P7 (P0 hedefli) | **7 / 1**: P1 gemi siparişi görülmedi (q0=1) | 1. koşu **6 / 2**: P1 gemi siparişi görülmedi (q0=12); P5 host meşru reddi (`rejected`, misafir alaşımı 44). 2. koşu **8 / 0**. |
| `MP8_SCEN=N` (ağ kopmaları) | — | 9 / 0 |
| `MP8_SCEN=R` 60 ay (kayıt / relay / devam) | **4 / 1**: R1 `R requires a pending human offer` | 4 / 1, aynı R1 ön koşulu. R2 kayıt, R3 devam, R4 tam bir kez: PASS. |
| `MP89_R_STATE=1 MP8_SCEN=R MP8_MONTHS=6` (dolu savaş / federasyon / vasallık fikstürü) | — | **5 / 0** |
| `MP8_SCEN=E` (p24 federasyon / Konsey kartları) · `MP8_SCEN=F` (p25 kuruluş tekrarı) | — | 6 / 0 · 6 / 0 |
| `browser-event-ux0.cjs` S1–S8 (casusluk paneli genişliği dahil) | — | 11 / 0 |
| Save8 v8 / MP paket 4 / protokol 1 / RNG / host yetkisi | — | Değişmedi. Yükleme kuralı yalnız bu alanda gevşemeden düzeldi. Node A: host Save8 → yükle → paket yükle bayt bayt aynı. |

Notlar:
- P1 "gemi siparişi görülmedi" ve R1 ön koşulu tabanda da aynıdır, bu fazın değişikliği değildir.
  - P1: en yüksek hızda korvet birkaç saniyede tamamlanır; tersane sırası eski uzunluğa dönebilir. Ölçüm "sıra uzadı mı" diye bakıyor.
  - R1: 60 aylık kampanya bekleyen insan teklifi üretmeyebiliyor.
  - İkisi de silinmedi, gevşetilmedi.
- Aday P'nin ilk koşusundaki iki FAIL kanıt olarak korunur (`chromium-P-aday-kosu1.txt`). Misafir ayna reddi 0 idi; "dünya güncel değil" hiç açılmadı.
- **NOT RUN:** gerçek Render, fiziksel PC / Android, LAN; Docker'lı mp5; mp0–mp3x, mp61–mp64, mp71–mp75 ayrı paketleri; uzun mp8 A / B / C.

## 7. Değişen dosyalar

| Dosya | Değişiklik |
|---|---|
| `economy.js` | `internalPolicyIssue` + toplamsal süre denetimi |
| `main.js` | `saveLoadReject` / `loadReject`, zarf reddinde alan yolu; `BUILD_ID` 96h10p26 |
| `sw.js` | `CACHE` stars-v96h10p26 |
| `research/mp6/client/guest-stars.js`, `mp6.css` | §5 |
| `research/mp0/mp-core.js` | p26 paket uyumluluğu (p6–p25 paket4 kabul) |
| `research/mp1/client/view.js`, `research/mp1/server/relay.js` | MP.8.9b22 |
| `tests/mp_p0_desync1_test.js` | Node FAIL-önce |
| `tests/helpers/mp-p0-desync1-mp.cjs`, `tests/browser-mp8.cjs` | `MP8_SCEN=D` |
| `tests/helpers/mp-p0-soak.cjs` | `MP8_P_DESYNC=1` |
| `tests/helpers/mp-p0-desync1-reviewed.{json,cjs}`, `event-ux1-reviewed.cjs` | koruma zinciri (p26 → p25 tam metin; ux1 önce bunu çağırır) |
| `RELEASE-MANIFEST.json` | — |

## 8. Paket

| | |
|---|---|
| ZIP | `releases/stars-faz96h10p26.zip` — 20 girdi (19 runtime + `RELEASE-MANIFEST.json`) |
| SHA-256 | **`da7e9d4ca4f818714c47992ca1dd3a48cb5ec1bbff52b3bdb8ae4fb55b64a30a`** |
| CRC32 | **`FCE177B2`** |
| Deterministik | yeniden üretim bayt bayt aynı |
| Doğrulama | `verify-release.py` (çalışma ağacı) ve çıkarılmış ZIP `--root` → DOĞRULANDI: 19 dosya, `96h10p26` |
| Manifest | `parent_commit` `bcbd697…`, `parent_zip_sha256` = p25 ZIP `86720c07…d82fa` |
| Değişen runtime | `economy.js`, `main.js`, `sw.js` (öteki 16 dosya p25 ile aynı) |
| MP teslimi (ZIP dışında) | `research/mp0/mp-core.js`, `research/mp1/client/view.js`, `research/mp1/server/relay.js`, `research/mp6/client/guest-stars.js`, `research/mp6/client/mp6.css`. Relay + istemci, p26 runtime ile birlikte dağıtılmalıdır. `/mp/version` → `MP.8.9b22`, build `96h10p26`. |

## 9. Açık kalanlar

- Özgün Render oturumunda reddedilen alan **doğrulanamadı** (§3). Kaydı / tanı satırı gelirse p26 alanı adlandırır.
- Gerçek Render, fiziksel PC / Android, LAN: **NOT RUN**. Kullanıcı kabulü yok; `main`'e birleştirme ve Render dağıtımı yapılmadı.
- p24 / p25 ile kaydedilmiş, kesirli günlü politika içeren host Save8 / MP paketleri p26'da yüklenir (aynı bayt; kural düzeldi). p25 ve öncesi bu dosyaları yüklemez.
- Pencere açıkken ayna bekletilir (MP.6.1 tasarımı). Uzun koşuda bu, en uzun "misafir dünyası durdu" süresine katkı verir. Ayrı satırda raporlandı.
- Sonraki faz: BETA-FED-FLEET.0 (UX0 raporu §10 + UX1 §9).
