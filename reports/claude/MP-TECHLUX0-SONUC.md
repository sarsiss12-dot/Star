# MP-TECHLUX.0 — Savaş Sözü son tarih düzeltmesi, Teknoloji ve Lüks Mal çok oyunculu müzakerede

Tarih: 16 Kasım 2026 · Dal: `claude/stars-mp-techlux0` · Başlangıç HEAD: `81f50291ddd588d1786758d73b25a7467caecb54` (p36 / MP.8.9b34, taslak PR #51) · Bitiş HEAD: §10
Sürüm: oyun **96h10p37** / `stars-v96h10p37` · MP **MP.8.9b35** · Save8 v8 / paket4 / protokol1 (değişmedi) · p37 paket yükleyicisi p6–p36, p25u1, p27s1 kabul eder.

> Kanıt türleri ayrı yazılır: **Node vm** (gerçek runtime + gerçek mp-core / mirror), **yerel Chromium** (üretim kipi relay SÜRECİ + TLS vekili + oyuncu başına kesilebilir/dondurulabilir hat + oyuncu başına ayrı Chromium ve kalıcı profil, gerçek STARS arayüzü, gerçek dokunuş; misafirler 844×390 yatay, host 1280×800), **canlı Render** (yalnız salt okunur `/mp/version`), **fiziksel cihaz / LAN** (NOT RUN — kullanıcı şu anda fiziksel test yapamıyor). Kullanıcının asıl kaydı yok: kayıt testleri sentetik oyundan.
>
> Sistemin atadığı `claude/stars-project-takeover-y9x8m9` eski bir 96H.8 dalıdır; bu faz doğrulanmış PR #51 HEAD'inden (`81f5029`) yeni dal olarak açıldı. Force-push / rebase yok.

## 0. Özet

| # | İstek | Durum (yerel) | Kanıt |
|---|---|---|---|
| 1 | Savaş Sözü son tarih hatası (son tarihten sonra başlayan savaş "Tutuldu"; son gün içinde ay başı denetimi sözü bozuyordu) | **p36'da yeniden üretildi, düzeltildi** | `mp_waron1_deadline_test` p36 **3/5** → aday **8/0** |
| 2 | NF-2 Teknoloji + Lüks Mal MP müzakere (iki taraf, tüm yollar, kapılar, gizlilik, tek işlem) | Uygulandı · PASS | Node 11/0 (p36 0/10), SP 5/0, MP8 T 8/0 |
| 3 | Gerçek oyun etkisi | Teknoloji: alanın araştırmasına eklenir, verende kalır (PASS). **Lüks: erişim kaydı yazılır ama motor lüks bonusu üretmez — tek oyunculuda da (bulgu, değiştirilmedi, NF-2b karar bekliyor)** | SP S2, T1 |
| 4 | Gerçek kusurlar bulundu ve düzeltildi | `encodeOffer` teknoloji kimliğini atıyordu (kart "✦ ?", karşı teklifte madde kayıp — tek oyunculuda da); ayna gezegen `lux` alanını taşımıyordu (misafir kendi lüksünü bilmiyor, lüks teklif edemiyordu) | SP S5 (p36 FAIL), T11, T koşu 1–3 |
| 5 | 👁 İstihbarat (sensör paylaşımı) uçtan uca | **Sorun yeniden üretilmedi** — teklif → host durumu → ayna → harita çizimi dört aşamada doğru | intel 3/0, T5 |
| 6 | P5 gemi siparişi reddi | Bu fazda P koşusu yapılmadı (NOT RUN); P5'e p36'da eklenen tanı (ret kodu / gerekçe / stok) yerinde | §8 |
| 7 | Barıştırma (`peaceWith`) görev kaydı | NF-6 PLANLANDI, kabul ölçütleriyle | `SONRAKI-FAZ-GOREVLERI.md` |
| 8 | Regresyon | V 7/0 · Z 14/0 · Q 8/0 · Y 6/0 · T 8/0 · tam Node p36 ile aynı (275 eski FAIL, yeni fark yok) | §7 |

## 1. Sürüm ve Render

- Canlı Render (`stars-zhdu`, salt okunur GET): `/mp/version` → `{"mp":"MP.8.9b30","build":"96h10p33"}` — p34–p37 sahada hiç çalışmadı.
- **Render'da seçilecek dal:** `claude/stars-mp-techlux0`.
- **Dağıtımdan sonra beklenen** `/mp/version`: `{"mp":"MP.8.9b35","build":"96h10p37"}`, dosya önekleri: mp-core `2123f1e97db6`, relay `e493dd692925`, mp1-host `f5dc296c1a3d`, join `65c28db3714f`, mirror `cc09071cb0fa`, guest-stars `a7e05aa670fd`, mp71-dip `d486a1e0e732`, mp7-setup `a7391d21552c`.

## 2. Savaş Sözü son tarih düzeltmesi (önce)

**Kusur (p36, yeniden üretildi):** `warPledgeWar` (savaş ilanı kancası) son tarihe hiç bakmıyordu → son tarihten sonra başlayan savaş "Tutuldu" (D3, D4). `warPledgeTick` önce "savaş sürüyor"a bakıyordu → ay başı denetimi geç çalışınca süre sonrası savaş da "Tutuldu" (D5). Ayrıca `G.day > until` kesirli günde son günün içinde sözü bozuyordu (D2: son gün 150,5'te Çiğnendi). Kapı `until − G.day < 1` son gün kabulünü reddediyordu, kalan gün `Math.ceil` ile başka kuralla yazılıyordu (D8).

**Kural (tek kaynak):** `warPledgeLeft(p,day) = floor(until) − floor(day)`, `warPledgeInTime` ⇔ `≥ 0` — **son gün dahil**, kesirli gün aşağı yuvarlanır. Kullanan her yer aynı işlev: savaş ilanı kancası, ay başı denetimi, teklif kapısı, etiket ve panel ("0 gün · son gün", "bugün son gün").
- Savaş ilanında: süresindeyse **Tutuldu**; değilse `warPledgeExpire(…,late)` → Çiğnendi (mevcut söz bozma: `paktBozdu`, ilişki −20, hedefsiz haber) ya da cezasız **Düştü** (hedef elendi, taraf yok, veren ile alan savaşta, son tarihte Konsey yasağı). Geç savaş kendi ilan kuralıyla yine başlar.
- Ay başı denetiminde: hedefle savaş varsa yalnız **süresinde başladıysa** Tutuldu (`warPledgeStartedInTime`: `warStart` ≥ söz günü ve ≤ son gün; kancasız savaş yollarında başlangıç bilinmiyorsa yalnız şu an süre içindeyse). Süre dolmuşsa `warPledgeExpire`.
- Sonuçlanmış söz ikinci kez işlenmez (durum `open` değil); kayıt → yükleme → denetim → geç ilan: ceza ve bildirim bir kez (D7).

| Vaka | p36 | p37 |
|---|---|---|
| D1 son tarihten bir gün önce ilan | PASS | PASS |
| D2 son günün başında / ortasında / sonunda (0 · 0,5 · 0,99) ilan; o gün ay başı denetimi açık bırakır | **FAIL** (0,5'te denetim bozdu) | PASS |
| D3 ertesi gün, ay başı denetiminden ÖNCE veren ilan eder → Tutuldu değil, Çiğnendi bir kez, savaş başlar | **FAIL** (Tutuldu) | PASS |
| D4 hedef verene ilan eder: süresinde Tutuldu / süre sonrası değil | **FAIL** | PASS |
| D5 ay başı denetimi geç: süre sonrası savaş → Çiğnendi; süresinde kancasız savaş → Tutuldu | **FAIL** | PASS |
| D6 sınırda Düştü kuralları (hedef elendi / taraflar savaşta / Konsey yasağı), ceza yok | PASS | PASS |
| D7 kayıt → yükleme → denetim: ceza ve bildirim bir kez | PASS | PASS |
| D8 kalan gün metni ve kapı son günde geçerli, ertesi gün geçersiz | **FAIL** | PASS |

p36'nın teklif karşılığı, açık savaş onayı ve Savaşa Destek İste davranışları değişmedi: `mp_waron0` 9/0, `_sp` 5/0, MP8 V §7.

## 3. Teknoloji ve Lüks Mal

**Tek oyunculu davranış (p36, incelendi, değiştirilmedi):** `tech` maddesi `dealQuote`'ta verende olma + alıcının `researchAccess`'i, kabulde `grantResearchTech(alan,id,'trade')` (verende kalır) + alanın "teknoloji verdi" hafızası. `lux` maddesi verende `luxOwn[k]`, kabulde `alan.luxGrant[k] = veren`. Masada "İstiyorum" teknoloji / lüks yalnız İZLENİYOR (`intelOf ≥ 2`).

**MP:**
- Madde `{t:'tech',id}` (TECHS kimliği — metin) ve `{t:'lux',k}`; dört yol aynı `offer` / `counter` / `respond` / `withdraw` motoru: host → misafir, misafir → host, misafir → misafir, insan ↔ AI (`aiRespond`).
- Host kapıları: motorun `dealQuote`'u (verende olma, `researchAccess`, `luxOwn`) + **İZLENİYOR şartı** "İstiyorum" teknoloji / lüks için teklifte, karşı teklifte ve **kabulde** (`dipAssetGate`). Karşı teklifte, karşı tarafın önceki teklifinde **açıkça sunduğu** madde bu şart olmadan istenebilir (`shownKeys`; kabulde önceki tur `r.prev`). Gerekçe karşı tarafın varlığını söylemez ("… İZLENİYOR istihbaratı gerekir").
- "İstiyorum" listesi: misafir aynasında başka devletin teknoloji ağacı ve lüks varlığı yoktur (kabuk `techs:{}`); liste host'un salt okunur `dealAssets` yanıtından gelir — **yalnız İZLENİYOR ile**, altında liste dönmez. Teknoloji satırı isteyenin kendi erişim koşulunu da söyler.
- Bekleyen teklif: veren teknolojiyi / lüks kaynağını kaybeder, alıcı teknolojiye zaten sahip olur ya da erişemez hâle gelirse teklif "Teknoloji / lüks mal koşulu değişti" ile geçersiz olur; iki tarafa maddeye özgü neden (`dipAssetIssue`).
- Teklif özeti (`UI.dealAssetTermsRow`): teknolojinin alıcıya tam olarak sağladığı (`techBenefits` etkiler + açılan gemi / yapılar), "kabul anında", "verende kalır", alıcı erişemiyorsa ⛔ neden; lüks erişiminde motorun gerçek etkisi (aşağıda). İstihbarat yetmezken "İstiyorum" düğmelerinin yanında görünür neden (`.dealAssetWhy`; önceden yalnız `title`).
- Ayna: alana teknoloji (kendi `techs`), `luxGrant` (veren kimliği π); veren, verdiği erişimi alanın kabuğunda görür; üçüncü taraf hiçbirini görmez. **Gezegen `lux` alanı** aynaya eklendi (taranmış / kendi gezegen — gezegen türüyle aynı kural): önceden misafir kendi lüks kaynağını bilmiyor, lüks çipleri boş kalıyor, lüks teklifi yerelde "verdiklerini karşılayamıyorsun" diyordu (T koşu 2–3 kökü).
- `encodeOffer` (main.js) teknoloji kimliğini artık korur: `_num` metin kimliği atıyordu → gelen kutusu kartı "✦ ?", "Masaya otur" karşı teklifinde madde kayıp, tek oyunculuda da AI'nın teknolojili teklifi kabul yolunda "katalogda olmayan teknoloji" (SP S5 p36 FAIL → p37 PASS; T koşu 1 kökü).

**Lüks mal erişiminin gerçek etkisi — bulgu (değiştirilmedi):** `luxGrant` kaydını hiçbir motor işlevi okumaz; lüks erişimi `refreshLuxury` (economy.js) yalnız kendi kolonilerden ve ticaret paktı + açık rotalı ortaklardan hesaplar. Ölçüm: tek oyunculuda AI → oyuncu `ipek erişimi` kabul edildi, `luxGrant.ipek = 2` yazıldı, `luxury.ipek` **false** kaldı (SP S2, p36 ve p37 aynı). `git log -S luxGrant`: hiçbir sürümde okunmamış. Bonusu bağlamak tek oyunculu ekonomiyi (AI–AI lüks anlaşmaları dahil) değiştirir — CLAUDE.md kuralı gereği ayrı faz kararı: **NF-2b, kullanıcı kararı bekliyor**. MP aynı hakkı aynen taşır; teklif özeti "erişim kaydının kendisi bonus üretmez; lüks bonusu motorda ticaret paktı + açık rota ile gelir" der.

## 4. 👁 İstihbarat (sensör paylaşımı)

Yerel uçtan uca: C, B'den görüş ister → B kabul → `C.visionFrom[B]` (yön doğru; B, C'den almaz) → B'nin filosu kimsenin görmediği bir sisteme → host `humanVisionContext(C)` görünürü → C aynası `mpVisible` + sistem adı → misafir `G.vis` (harita çizimi). İlgisiz D (Node) ve host (Chromium) görmez; tam ayna yeniden kurulumu aynı; taraflar savaşınca paylaşım kalkar; yeni odada sürer. **Sorun yeniden üretilmedi** (teklif, host durumu, ayna, çizim aşamalarının dördü doğru) — sahadaki özgün belirti için kullanıcı kaydı / canlı oturum gerekir.

## 5. Değişen dosyalar

Runtime: `diplomacy.js` (son tarih kuralı), `main.js` (`encodeOffer` teknoloji kimliği, sürüm), `ui.js` (teklif özeti, görünür neden, son gün metni), `sw.js`. MP: `mp-core.js` (tech / lux, `dipAssetGate`, `dipAssetIssue`, `dealAssets`, kabul kapısı, paket uyumu), `mirror.js` (gezegen `lux`, `luxGrant`), `guest-stars.js` ("İstiyorum" listesi, gönderim eşlemesi, metin), `mp71-dip.js` (gönderim eşlemesi), `relay.js` + `view.js` (MP.8.9b35). Test: `mp_waron1_deadline_test.js`, `mp_techlux0_test.js`, `_sp_test.js`, `_intel_test.js`, `_equivalence_test.js`, `helpers/mp-techlux0-mp.cjs` (MP8 T), `browser-mp8.cjs` (T kaydı). Koruma `mp-techlux0-reviewed.{json,cjs}` (taban `81f5029`, 10 dosya, tam metin geri alımı doğrulandı) ← `mp-waron0-reviewed` ← …

## 6. Testler (yeni)

| Test | Aday p37 | Kontrol p36 (`git archive 81f5029` sabit kopya) |
|---|---|---|
| `node tests/mp_waron1_deadline_test.js` (D1–D8) | **8/0** | **3/5** (`deadline-kontrol-p36.log`) |
| `node tests/mp_techlux0_test.js` (T1–T11) | **11/0** | **0/10** (`node-kontrol-p36.log`, T11 sonradan) |
| `node tests/mp_techlux0_sp_test.js` (S1–S5) | **5/0** | 2/3 — S1 / S2 geçer (tek oyunculu davranış aynı), S3–S5 yeni arayüz / `encodeOffer` (`sp-kontrol-p36.log`) |
| `node tests/mp_techlux0_intel_test.js` (I1–I3) | **3/0** | — |
| SP eşdeğerlik (`STARS_CONTROL_ROOT`=p36, tohum 11/22/404 × 48 ay, Save8 SHA-256 + RNG) | **3/0** (`encodeOffer` düzeltmesinden önce ve sonra) | — |
| `MP8_SCEN=T` (T0–T7, host + B + C) | **8/0** (koşu 4) | — |

T koşu geçmişi (ilk FAIL'ler korunur, `aday-T-run1…4.log`): 1: 6/2 (T1 kart "✦ ?" → **`encodeOffer` ürün kusuru**; T6 zincirleme), 2: 6/2 (T1 B'nin karşı teklifi pasif: fikstür `luxOwn`'u doğrudan yazıyordu), 3: 6/2 (fikstür gerçekçi kaynağa çevrildi; kök **ayna gezegen `lux` ürün kusuru**), 4: 8/0.

T senaryosu (gerçek arayüz): T1 C dokunuşla teknoloji verir + B'den lüks ister (host listesi), özet; B kartı (teknoloji ve lüks adıyla) → "Masaya otur" → karşılık ekler → karşı teklif; C kabul → host'ta B'de teknoloji, C'de erişim kaydı, aynalar doğru · T2 İZLENİYOR yoksa düğmeler pasif + görünür neden, host listesi dönmez · T3 birleşik teklif beklerken veren teknolojiyi kaybeder → iki tarafta neden, kabul yok, hiçbir madde uygulanmaz (host durumu) · T4 çift kabul + hat donar / kopar → tek erişim, tek ödeme · T5 sensör paylaşımı haritada · T6 kayıt → yeni oda → teknoloji / erişim / görüş aynı · T7 misafir → AI teknoloji (motor kararı, kabul ⇔ AI'da teknoloji).

## 7. Regresyon

**Tam Node** (`STARS_TEST_WORKERS=4 node tests/run-all.js`, `evidence/mp-techlux0/node-tam.log`; FAIL veren paketlerin günlükleri `node-tam/`):

| | Paket | GEÇEN | KALAN |
|---|---|---|---|
| p36 (`evidence/mp-waron0/node-tam.log`) | 212 | 6352 | 275 |
| p37 aday | 217 | 6379 | **275** |

Paket paket fark: yalnız 5 yeni paket (`mp_techlux0_test` 11/0, `_sp_test` 5/0, `_intel_test` 3/0, `mp_waron1_deadline_test` 8/0, `_equivalence_test` kontrol kökü verilmediği için tam koşuda NOT RUN 0/0 — ayrı koşu 3/0). Diğer bütün paketlerin sayıları p36 ile **aynı**; kalan 275 FAIL aynı 52 eski paket (bu fazdan bağımsız, silinmedi). Yeni fark yok.

| Koşu (yerel Chromium) | Sonuç | Not |
|---|---|---|
| `MP8_SCEN=V` (Savaş Sözü) | **7/0** | İlk koşu |
| `MP8_SCEN=Z` (kayıt, olay, yeniden katılım) | **14/0** | İlk koşu |
| `MP8_SCEN=Q` (savaş desteği, toprak vaadi) | **8/0** | İlk koşu (p36'daki Q6 fikstür düzeltmesi yerinde) |
| `MP8_SCEN=Y` (Sistem Devri, Haraç, kısayollar) | **6/0** | İlk koşu |
| `MP8_SCEN=T` (yeni, regresyon koşusu) | **8/0** | Geliştirme koşuları §6 |
| SP eşdeğerlik (p36 sabit kopya) | **3/0** | |
| `verify-release` (çalışma ağacı) + çıkarılmış ZIP `--root` | **DOĞRULANDI: 19 dosya; oyun build 96h10p37** | |

Bu fazın regresyon koşularında aralıklı FAIL görülmedi; geliştirme koşularının FAIL'leri (T 1–3) kökleriyle §6'da.

Ortam ayrımı: **Yerel Chromium** — yukarıdaki tarayıcı koşuları. **Canlı Render** — yalnız salt okunur `/mp/version` (p33); oynanış NOT RUN. **Fiziksel cihaz (PC / Android), LAN** — NOT RUN. **P (500 / 16 / 15 dk)** — NOT RUN (bu faz).

## 8. Açık işler

- **NF-2b — lüks erişiminin ekonomik etkisi:** karar bekliyor (§3).
- **NF-6 — Barıştırma (`peaceWith`) MP maddesi:** PLANLANDI; kabul ölçütleri belgede (ikili barış ve federasyon ortak barışından farkı, taraf onayları, doğru savaş seçimi, kapanmış savaşta gecikmiş kabul, kayıttan dönüş).
- **P5 gemi siparişi reddi:** bu fazda P (500 sistem / 16 AI / 15 dk) koşusu yapılmadı — NOT RUN. p36'da P5'e eklenen tanı (host ret kodu, gerekçe, sipariş anındaki stok) yerinde; tekrar görülürse meşru kural reddi ile "host kabul etti, sıra misafire yansımadı" ayrımı oradan yapılır.
- **Saha:** tek başına kayıttan devam edince olayların görünmemesi ve uzun oturumda misafir haritasının donması — kullanıcı kaydı / canlı oturum olmadan AÇIK. Canlı Render oynanışı, fiziksel PC / Android, LAN: NOT RUN.
- Casusluk Ağı (NF-3), saldırmazlık / ticaret / geçiş kısayolları (NF-4), AI müttefik desteği ve vasallık (NF-5) görevleri korunur.
- Kullanıcı kabulü yok; hiçbir madde TAMAMLANDI değil. main'e merge / Render dağıtımı yok.

## 9. Sonraki faz görevleri

Belge: [`reports/claude/SONRAKI-FAZ-GOREVLERI.md`](https://github.com/sarsiss12-dot/Star/blob/claude/stars-mp-techlux0/reports/claude/SONRAKI-FAZ-GOREVLERI.md) (pano satırları değişmedi).

| Kod | Görev | Pano | Durum |
|---|---|---|---|
| NF-1 | Genel Savaş Sözü MP (+ p37 son tarih düzeltmesi) | #16, #31, #40, #43 | TEST BEKLİYOR |
| NF-2 | Teknoloji ve Lüks Mal MP | #40 | **TEST BEKLİYOR** (bu faz) |
| NF-2b | Lüks erişim hakkının ekonomik etkisi | #40 | PLANLANDI — **kullanıcı kararı bekliyor** |
| NF-3 | Casusluk Ağı / istihbarat maddeleri | #33 casusluk paneli | PLANLANDI |
| NF-4 | Saldırmazlık / Ticaret Paktı / Geçiş İzni kısayolları | #32, #22 | PLANLANDI |
| NF-5 | AI müttefik desteği ve vasallık | #40, #44 | PLANLANDI |
| NF-6 | Barıştırma (`peaceWith`) MP maddesi | #40 | PLANLANDI (yeni) |

## 10. Teslim

- Taslak PR: https://github.com/sarsiss12-dot/Star/pull/52 (head `claude/stars-mp-techlux0` → base `claude/stars-mp-waron0` / PR #51).
- Commit'ler: `cb61e1b` (son tarih düzeltmesi, Teknoloji + Lüks Mal, encodeOffer, ayna, sürüm, pin, manifest, ZIP), `c63b35f` (regresyon, rapor, CLAUDE.md), ardından bu teslim satırını yazan commit (bitiş HEAD = dalın ucu).
- Render'da seçilecek dal: `claude/stars-mp-techlux0`; beklenen `/mp/version` §1.
- ZIP `releases/stars-faz96h10p37.zip`: SHA-256 `93cbc9e6606d61e64d9b7042f2ecedc130b6fdc3eed1d98aaea729da0e8b2c1f`, CRC32 `1792683F`, 926974 bayt, 20 girdi, iki üretim aynı SHA; çıkarılmış kopyada `verify-release.py --root` → DOĞRULANDI: 19 dosya; oyun build 96h10p37.
- main'e merge, Render dağıtımı, force-push yapılmadı; kullanıcı kabulü bekliyor.
