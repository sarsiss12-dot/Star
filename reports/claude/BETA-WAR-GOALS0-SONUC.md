# BETA-WAR-GOALS.0 — savaş hedefleri, çok taraflı barış ve galaktik gerilim (14 Kasım 2026)

**Dil kuralı:** PASS / PARTIAL / FAIL / NOT RUN ayrı yazılır.

**Test ortamı:**
- Tarayıcı testleri bu konteynerde **yerel Chromium**'dur.
- MP'de üretim relay süreci ve yerel TLS vekili kullanılır.
- Canlı Render, fiziksel Android, LAN ve kullanıcı kabulü **NOT RUN**.

Hiçbir madde TAMAMLANDI değildir.

## 1. Kaynak, dal, sürüm

| | |
|---|---|
| Doğrulanmış taban | `claude/stars-rival-blocs0` · `33de03b5d38b930839696512bf280c417d486622` (görevdeki taban). |
| Daha yeni aday | Dalın GitHub HEAD'i `ac64a01`. p30'u (`33de03b`) içerir; üstüne iki test ve eşik düzeltmesi var (`b5a045a`, `ac64a01`). Bu fazın başında p30 kapanış raporu commit'i eklendi: `4e6f7f6` (yalnız rapor ve kanıt). Bu fazın tabanı **`4e6f7f6`**; runtime `ac64a01` ile aynı. |
| p30 kapanışı | §12'deki yer tutucu dolduruldu (Node, Chromium, MP8 D/G/L/S/E/F/P 15 dk PASS). Kampanya ve etik tabloları yeni kaçış eşiğiyle yeniden koşuldu. p30 taslak PR'ı **#44** (taban #43). |
| Başlangıç HEAD | `4e6f7f6` |
| Aday dal | **`claude/stars-war-goals0`** |
| Render Branch adı | `claude/stars-war-goals0` (dağıtım yapılmadı) |
| Bitiş HEAD ve PR | PR açıklamasında ve sohbette |
| Sürüm | oyun **96h10p31** · PWA `stars-v96h10p31` · Save8 **v8** · MP **MP.8.9b28** · paket **4** · protokol **1** |
| Paket uyumu | p31 yükleyicisi p6–p30, p25u1 ve p27s1 paketlerini kabul eder |

## 2. Özet tablo

| İş | Durum |
|---|---|
| p30 kaydı: 500 sistem / 16 AI / 2 insan / 15 dk (MP8 P) | PASS — p30 son kodunda 8/0 (p30 raporu §12). Aday için de koşuldu (§10). |
| Misafirin gerçek koloni panelinden otomatik inşaat emri (tarayıcı) | PASS — `MP8_SCEN=W` W3 |
| Savaş İlan Et: iki normal hedef (Fetih / Vasallaştırma) | PASS (Node W1, W2, W9; Chromium B2; misafir W1) |
| Fetih: hedef sistemler, barışta kalan / iade edilen, hedef devlet yok edilmez | PASS (Node W1) |
| Vasallaştırma: tür, vergi, yükümlülük önizlemesi | PASS |
| Savaşta koşullu teslim (saldıran) ve boyun eğme (savunan) | PASS (Node W2, W6; MP M2, M3; misafir W2) |
| Her iki hedefte statüko barışı | PASS — mevcut statüko yolu aynen; teslim maddesi yeni |
| Haraç / teknoloji barış maddesi | PASS — mevcut `tribute` / `tech` maddeleri; teslimle aynı pakette kullanılabilir |
| Bağımsızlık savaşı ve krizler kendi akışında | PASS — teslim maddesi bu savaşlarda reddedilir |
| Eski 6 hedefli kayıt, süren savaş, geçmiş | PASS (W9) |
| AI hedef seçimi (değer / işgal / ikmal; vergi / tampon / yük / risk) | PASS (W12) |
| AI savunucu teslim kararı (şart, başkent baskısı, yorgunluk, müttefik) | PASS (W2) |
| Gerekçe ve meşruiyet önizlemesi (kanıt tarihli, birikimli, orantılı) | PASS (W7, Chromium B2) |
| Belirsizlik notu (istihbarat eksikse) | PASS |
| Temaslı devlet tutumu (Destekler / Tarafsız / Kınar / Savunur) | PASS — gizli bağ ve temassız devlet gösterilmez |
| AI meşruiyeti ilan, destek oyu, davet yanıtı, barışta kullanır | PASS (sınırlı terimler, §5) |
| Sahte Bayrak ifşası: kanıt düzeltilir, savaş yeniden değerlendirilir, kendiliğinden kapanmaz | PASS (W7). Kampanyada ifşa anında süren savaş olmadı (§9). |
| Dürüst–Sahtekâr etkisi Sahte Bayrak seçiminde; başarı oranları aynı | PASS (W13, §8) |
| Savaş içi vasallık kabulü + önizleme + kampanya / cephe kapsamı | PASS (W3) |
| Ayrı barış ve önizlemesi | PASS (W4, Chromium B3) |
| Yeni vasal saldırı savaşına yalnız açık maddeyle girer | PASS (W3) |
| Toprak vaadi (teslim edilebilir / karşılanamıyor / yeniden müzakere / çiğnendi) | PASS (W5). Misafir arayüzünde vaat düğmesi PARTIAL (§13). |
| Host yeniden doğrulama, tek uygulama, çift komut | PASS (W6, M1, M2, M4, misafir W2) |
| Aylık adım kapanan cepheyi yeniden açmaz | PASS (W3; ilk koşuda FAIL, §6) |
| Federasyona karşı federasyon: önerge → oy → ilan; ortak ve ayrı barış | PASS (Node W8, MP M4, Chromium B4) |
| AI federasyon savaşı önerisi ve oyu | PARTIAL — oy PASS; öneri kodlu ama kampanyada 0 öneri (§7) |
| Galaktik Gerilim kurulum + SP / MP host / Save8 | PASS (W11, M5, Chromium B1) |
| Galaktik Gerilim davranış etkisi | PASS (kontrollü deney) / kampanyada plasebo bandı içinde (§8, §9) |
| Kampanya 11 / 23 / 404, 120 + 240 ay, Sakin / Dengeli / Çalkantılı | PASS (ölçüm) |
| Regresyon | §10 |
| Performans | §11 |
| Fiziksel Android, canlı Render, LAN | NOT RUN |

## 3. Savaş hedefleri

**Arayüz.** Savaş İlan Et → **SAVAŞ HEDEFİ SEÇ** yalnız iki hedef sunar: **Fetih** ve **Vasallaştırma** (`WAR_GOAL_MAIN`). Eski dört hedef (Haraç, Bilgi, Yıkım, Yok Etme) yeni ilanda seçilmez. Pencerede bir not, bu hedeflerin eski kayıtlarda şartlarıyla sürdüğünü söyler.

**Fetih**
- Seçim penceresi bilinen, başkent dışı sistemleri listeler; varsayılan en yakın üç.
- Kurallar: en çok 5 hedef, hedef devlete en az bir sistem kalır, başkent hedef olamaz.
- Doğrulama: `warGoalOptions`. Geçersiz seçim sessizce düzeltilmez, reddedilir.
- Kayıt: `e.wg[foe] = {t:'fetih', targets, v:2}`.
- Barışta (`makePeace` başı, `warFetihSettle`) hedef sistemler saldıranda kalır. Bu cephede ele geçirilen hedef dışı sistemler önceki sahibine iade edilir (mevcut `captureSystem` devir yolu).
- Statüko barışı fiilî sınırı dondurur; iade yapmaz.
- Müzakere masasında kalacak / alınamayan / iade edilecek sistemler gösterilir (`warFetihPreview`).

**Vasallaştırma**
- Tür seçimi: Haraçgüzar / Sınır Bekçisi / Akademik.
- Savaşa katılım hükmü:
  - Katılmaz
  - Yalnız savunma
  - Saldırı da (Bekçi en az savunma; Akademik saldırı yok)
- Hükümler `vassalTerms` ile doğrulanır. Önizlemede vergi, bilim payı, koruma, katılım ve özerklik görünür.
- Hedef dolarsa vasallık bu hükümlerle kurulur (`warGoalSubjugate` → `subjugate(…, 'war-goal')` + kampanya kapsamı).

**Teslim ve boyun eğme (savaş içinde).** Yeni anlaşma maddesi `{t:'vassal', type, war}`. Maddeyi VEREN vasal, ALAN senyör olur.
- "Teslim iste" maddeyi karşı taraftan ister; "Boyun eğ" maddeyi verir.
- Madde yalnız taraflar birbiriyle savaştayken geçerlidir.
- Barış, ittifak ve saldırmazlık maddeleriyle aynı pakette olamaz; savaşı kendisi kapatır.
- Bağımsızlık savaşında, kriz tarafında ve taraflardan biri vasalken reddedilir.
- Haraç ve teknoloji aynı pakete eklenebilir (mevcut maddeler).

**Eski kayıt uyumu.**
- Altı eski hedef `WAR_GOALS`'ta aynen durur. `v` alanı olmayan kayıt eski kuralla sürer (Fetih iadesi yok).
- Süren savaşın şartı sessizce değişmez (W9: `yikim` hedefli savaş Save8 ile yüklenir, şartı aynı).
- MP protokolü eski anahtarları kabul eder (eski istemci uyumu). Gerçek arayüz yalnız iki hedefi sunar.

**AI** (`aiWarGoalChoice`, RNG yok).
- `pickCasusBelli` zarı aynen çekilir; sonucu iki hedeften birine iner.
- Fetih değeri: aday sistemlerin koloni değeri, uzaklık (ikmal) cezası, mevcut işgal.
- Vasallaştırma değeri: vergi + tampon (hedefin sınırında düşman) − koruma yükü (hedefin başka düşmanları) − yeni cephe riski.
- Vasallaştırma şartı: hedef yaşayabilir (≥ 2 sistem) ve güç oranı > 1,35.
- Ezici üstünlükte (oran 11,8) eski "boyun" → Vasallaştırma (W12).
- Savunan AI'nın teslim bedeli (`warVassalSubmitCost`): egemenlik ve şart ağırlığı; düşürenler başkent kaybı / kuşatma, yorgunluk, güç oranı ve hedef ilerlemesi; yükselten ulaşabilir müttefik gücü.
- AI teslimde kaynakla karşı teklif vermez; gerekçesini söyler.

## 4. Kapsam: teslim, ayrı barış, toprak vaadi

**Kapsam (`warTermsScope`).** Kampanya ve cephe kimliğine göre:
- A–B kapanır.
- Yalnız A'nın seferini desteklemek için giren C'nin C–B cephesi kapanır (kendi hedefi yoksa).
- B'yi savunmak için giren D'nin cephesi kapanır (kendi hedefi yoksa).
- Bağımsız savaşlar sürer (E–B).

Önizleme ayrıca şunları listeler: kapanan cepheler, süren savaşlar, vasalın mevcut vasallarının yeni senyöre bağlanması, toprak durumu.

**İlk FAIL (korundu).** Teslimden bir ay sonra yeni vasal, mevcut `separatistTick` sadakat hesabıyla kendiliğinden bağımsızlık savaşı açtı.
- Düzeltme: `warSurrenderGrace`. Müzakereli teslim ya da hedef sonucu kurulan vasallıkta 12 ay kendiliğinden isyan yok.
- Dışarıdan ayrılıkçı fon varsa (`sepFunded`) koruma kalkar.
- Sonra W3 PASS: iki aylık adımda kapanan cepheler kapalı kaldı.

**Ayrı barış (`warSeparatePeacePreview`).** Barış maddesi olan pakette, kampanyada başka cephe varsa gösterilir:
- Yalnız bu cephe kapanır.
- Sona erenler: vekil savaş yükümlülüğü, sefer katılımı ve türü, bu kampanyadaki toprak vaatleri.
- Sözleşmeli katılımın sahibi savaşırken ayrı barış uyarısı.
- Öteki cepheler "sürer".

**Toprak vaadi** `{t:'landPromise', sys, front}`.
- Yalnız aynı cepheye `warJoin` ile verilir.
- Vaat edilen düşmanın başkent dışı sistemidir; bir sistem tek vaatte olur.
- Kayıt `G.warLedger.promises` (yalnız kullanılınca; Save8'de doğrulanır, bozuk kayıt reddedilir — W10).
- Cephe kapanınca (`warLedgerSync` tek noktası) tek kez sonuçlanır:
  - **Teslim edilebilir** → mevcut devir yolu → *Teslim edildi*
  - **Karşılanamıyor** → sistem ele geçirilmedi; ceza yok
  - **Yeniden müzakere** → sistem başka bir sefer ortağında ya da taraflar savaşta
  - **Çiğnendi** → yalnız sahtekâr AI veren (dürüstlük < −0,3) değerli (> 180) sistemi tutarsa. Alıcının hafızasında mevcut `paktBozdu` ("Çiğnenen Söz" gerekçesi), ilişki −20 ve haber.
- İkinci kez çalıştırma ikinci devir üretmez (W5).

**Çift komut.**
- Aynı teslim paketi iki kez `executeDeal` → ikincisi reddedilir, tek ödeme (W6).
- MP'de aynı teklif ikinci kez yok, ikinci kabul yok (M2), ikinci uygulama yok (M4).
- Misafirin gerçek komut çerçevesi yeniden gönderilince ikinci teklif yok (misafir W2).

## 5. Gerekçe ve meşruiyet

**Kaynaklar** (`warJustifications`, yeni defter yok):
- Mevcut `e.mem` kayıtları:
  - Sahte Bayrak ifşası, ittifak ihlali, saldırmazlık / söz ihlali
  - Kaybedilen toprak, kanıtlanmış sabotaj / casusluk ağı, yakalanan casus
  - Konsey ihlali, ticaret yolu saldırısı, ambargo
  - Sınır gerginliği, geçmiş savaş ilanı
- Savaş defteri: müttefike saldırı (bilinen cephe).
- Gözlem: sınır yığınağı (o an görünen silahlı filolar).
- Etik farkı: ideolojik düşmanlık.

**Hesap:**
- Her olay kaynak (`source`) ya da zamanla bir kez sayılır.
- Güç = ağırlık × tazelik (10 yılda sıfır).
- Bağımsız gerekçeler birikir: 1 − Π(1 − güç).

**Orantılılık:**
- Fetih: 0,15 + 0,08 × hedef sayısı
- Vasallaştırma: 0,55
- Düzeyler: *yeterli* / *zayıf* / *orantısız* / *gerekçesiz*
- Bilinen güç oranı ve istihbarat eksikse belirsizlik notu gösterilir.

**Tutum** (`warStances`), yalnız temaslı devletler:
- *Savunur* / *Destekler*: bilinen savunma–saldırı bağı, bilinen ittifak, hedefle bilinen savaş.
- *Kınar*: Konsey yasağı; orantısız gerekçe + ilişki < 30; düşmanca ilişki.
- *Destekler*: yeterli gerekçe + ilişki ≥ 40.
- Gizli taahhüt ve temassız devlet gösterilmez.
- Askerî katılım ayrıca gösterilir (mevcut kesin / koşullu listesi).

**Önizleme salt okunur** (`warPure`).
- İlk koşuda `mp62_core` 13/0 → 6/7 FAIL. Neden: güç tahmini `aiView` önbelleğini ve `_` alanlarını yazıyordu.
- Önizleme artık bunları geri koyar; `mp62` 13/0.

**AI'da kullanım** (sınırlı; askerî katılım bütçe / rota / cephe kapılarında ayrıca):

| Yer | Terim |
|---|---|
| `warAppetite` | `aiWarLegitTerm` ±0,08 |
| Savaşa katılım daveti | `aiWarJoinLegitMul` — zayıf gerekçede bedel en çok ×1,3 |
| Federasyon savaş oyu | `aiWarVoteLegitTerm` −0,10…+0,08 |

**Sahte Bayrak ifşası** (`warFalseFlagRevealed`, iki ifşa yolunda: soruşturma operasyonu ve derin soruşturma).
- Kanıt kaydı mevcut `forgetMemoryEvent` ile düzelir.
- Kurban ile günah keçisi savaştaysa meşruiyet yeniden hesaplanır.
- Başka geçerli gerekçe yoksa (< 0,2):
  - AI kurban statüko barışı önerir (mevcut teklif yolu; insan alıcıya gelen kutusu kartı).
  - İnsan kurbana bilgi verilir.
  - Kurbanın seferindeki AI ortaklar da kendi gerekçelerine göre ayrı barış önerebilir.
- Savaş kendiliğinden kapanmaz (W7).

## 6. Federasyona karşı federasyon

**Arayüz.** Federasyon → ASKERÎ → *Ortak savaş kararları* → **Federasyona Karşı Savaş Öner: <federasyon>**. Pencerede:
- Hedef üye seçimi ve Fetih / Vasallaştırma.
- İki tarafın bilinen üyeleri: bizim taraf koşullu / katılmayacak; karşı taraf kesin / koşullu.
- Meşruiyet.
- Not: "oy ve ilan ayrı adımdır".

**Motor.**
- Önerge `fedWar` mevcut gündem ve oyla açılır (insan önerici açıkça oy verir).
- Kabul → karar kaydı (`state:'ready'`, `approved`).
- Başkan ya da önerici UYGULA ile ilan eder (`fedWarExecute`):
  - Seçilen üyeye seçilen hedefle ilan.
  - Evet veren ve erişebilen üyeler katılır.
  - Karşı federasyonun gerçek savunma yükümlülükleri motorda (`fedDefend`) uygulanır.
  - Kök cephe `fedWar: {by, against}` olarak işaretlenir; hedef karşı federasyon olarak kaydedilir.

**Barış.**
- Ortak barış `{t:'fedPeace'}`: iki federasyon başkanı arasında; kampanyadaki **güncel** üyeler arası barışabilen bütün cepheleri kapatır.
- Doktrin nedeniyle barışamayan cephe (Kan Hukuku / Arındırıcı) sürer ve kutuda listelenir.
- İlk koşuda M4 FAIL: bir cephe yüzünden bütün ortak barış reddediliyordu. Düzeltildi.
- Üyenin ayrı barışı yalnız kendi cephesini kapatır.

**Savaş ortasında üyelik değişimi.**
- Ayrılan üyenin cephesi sürer ama ortak barışa girmez.
- Sonradan katılan üye mevcut ortak savaşa kendiliğinden girmez (mevcut `defenseFrontCutoff`).

**AI.**
- Oy: mevcut `aiFedVoteWant` savaş dalı (+ meşruiyet terimi).
- Öneri (`aiFedWarProposal`): yalnız başkan, 720 günde bir. Şartlar:
  - Gerçek ve erişebilir ≥ 2 üye
  - Bilinen güç ≥ karşı taraf × 1,15
  - Meşruiyet ≥ gerekenin yarısı
  - Puan ≥ 0,9
- Kör döngü yok. Kampanyada 0 öneri (§9) → **PARTIAL**.

## 7. Galaktik Gerilim

**Ayar.**
- Kurulumda **GALAKTİK GERİLİM**: Sakin / Dengeli / Çalkantılı.
- Rakip Doktrinlerden ayrı. Dengeli varsayılan ve cfg'ye yazılmaz; eski kayıt Dengeli.
- Geçersiz değer `setupConfigError` ile reddedilir.
- MP: lobi `SETTINGS_KEYS` + paket ayarı doğrulanır (M5).

**Çarpan** `tensionMul()` (Sakin 0,6 / Dengeli 1 / Çalkantılı 1,5); yalnız AI'nın şans tabanlı kararlarına uygulanır:
- `aiWarReview` savaş fırsatı şansı
- `aiOpsTick` entrika
- `aiFalseFlagTick` Sahte Bayrak
- koalisyon pazarlığı bekleme süresi (360 / çarpan gün)

Gerçek gerekçe, antlaşma, rota ve bütçe kapıları aynen; RNG çekim sayısı değişmez.

**Sınır krizleri:** 94D.1'den beri rastgele sınır olayı üreticisi yok, bu yüzden gerilim burada etkisiz.

**Kurulumda kullanılmaz:** aynı tohumda yalnız gerilim değişince harita, başkentler, AI adları, ırk, etik, sivik ve kişilik aynı (W11; 404 / büyük / 8 AI).

## 8. Kontrollü deneyler

**Gerilim** (aynı dünya: seed 23, 8 AI, 60. ay Save8; aynı 60 RNG tohumu × 12 ay gerçek aylık adım):

| | Sakin | Dengeli | Çalkantılı |
|---|---|---|---|
| AI entrika operasyonu (`runOp`) | 23 | 29 | 44 |
| AI savaş ilanı | 0 | 0 | 0 |
| Sahte Bayrak | 0 | 0 | 0 |

- Bu pencerede savaş ve Sahte Bayrak fırsatı (gerekçe + bütçe + hedef) hiç oluşmadı; savaş şansı çarpanı birebir uygulanır (kod).
- Kanıt: `evidence/beta-war-goals0/gerilim/`.

**Dürüst–Sahtekâr Sahte Bayrak seçimi** (`aiFalseFlagHonestyMul`):
- ahl −3 → ×1,45 · 0 → ×1 · +3 → ×0,55 (W13).
- `falseFlagOp`'un başarı ve ifşa formülü değişmedi (W13 kaynak denetimi).

## 9. Kampanya (8 AI, orta, seed 11 / 23 / 404)

**Kollar.**
- Kontrol: p30 `git archive 4e6f7f6` sabit kopya.
- Plasebo: kontrol + kurulumdan sonra tek `rnd()`.
- Aday: bu dalın sabit kopyası.
- Dengeli, kontrol ve plasebo 240 ay; Sakin ve Çalkantılı da 240 ay.
- Betik `kampanya/wars.cjs`, JSON'lar `kampanya/*.json`.

**240. ay:**

| Seed | Kol | En büyük blok payı (geç) | Çok-bloklu ay | İlan | Hedefler | Bitiş türü | Süre (medyan ay) | Söz bozma | Vasal (kurulma yolu) | Sahte Bayrak (deneme / anında savaş) |
|---|---|---|---|---|---|---|---|---|---|---|
| 11 | Kontrol p30 | 0,426 | 148 | 2 | yok 2 | ai-peace 1, exhaustion 1 | 43 | 1 | 0 (voluntary 2) | 6 / 1 |
| 11 | Plasebo | 0,456 | 206 | 4 | boyun 3, bilgi 1 | exhaustion 3, ai-peace 1, crisis 1, eliminated 3 | 20,1 | 1 | 1 (voluntary 1) | 6 / 0 |
| 11 | Aday · Dengeli | 0,426 | 148 | 2 | yok 2 | ai-peace 1, exhaustion 1 | 43 | 1 | 0 (voluntary 2) | 6 / 1 |
| 11 | Aday · Sakin | 0,375 | 155 | 4 | yok 3, fetih 1 | ai-peace 5, eliminated 1, crisis 4 | 10 | 7 | 1 (voluntary 4) | 7 / 2 |
| 11 | Aday · Çalkantılı | 0,667 | 0 | 5 | fetih 2, yok 3 | exhaustion 1, crisis 2, ai-peace 5, proxy-peace 1 | 11 | 1 | 1 (voluntary 2) | 11 / 3 |
| 23 | Kontrol p30 | 0,481 | 227 | 6 | yok 4, yoketme 2 | exhaustion 6, crisis 2, eliminated 2 | 47 | 3 | 1 (voluntary 1) | 9 / 4 |
| 23 | Plasebo | 0,438 | 224 | 4 | boyun 4 | eliminated 8, exhaustion 3, crisis 1 | 15 | 2 | 3 (voluntary 3) | 0 / 0 |
| 23 | Aday · Dengeli | 0,512 | 227 | 3 | boyun 3 | eliminated 5, proxy-peace 1, exhaustion 1 | 25,1 | 0 | 2 (surrender 1, voluntary 1) | 0 / 0 |
| 23 | Aday · Sakin | 0,545 | 184 | 2 | fetih 1, yok 1 | eliminated 1, exhaustion 5 | 47 | 1 | 0 (voluntary 1) | 4 / 0 |
| 23 | Aday · Çalkantılı | 0,444 | 203 | 4 | yok 1, boyun 3 | crisis 4, proxy-peace 2, surrender-scope 1 | 15 | 2 | 1 (war-goal 2) | 10 / 1 |
| 404 | Kontrol p30 | 0,798 | 0 | 1 | boyun 1 | eliminated 5, exhaustion 1 | 13 | 2 | 2 (voluntary 3) | 3 / 0 |
| 404 | Plasebo | 0,5 | 225 | 2 | boyun 2 | eliminated 1, exhaustion 3 | 30 | 0 | 2 (voluntary 2) | 3 / 0 |
| 404 | Aday · Dengeli | 0,798 | 0 | 1 | boyun 1 | eliminated 5, exhaustion 1 | 13 | 2 | 2 (voluntary 3) | 3 / 0 |
| 404 | Aday · Sakin | 0,778 | 0 | 0 | — | — | — | 0 | 1 (voluntary 1) | 3 / 0 |
| 404 | Aday · Çalkantılı | 0,762 | 0 | 1 | boyun 1 | eliminated 5, exhaustion 2 | 13 | 0 | 3 (forced 2, voluntary 2) | 2 / 0 |

120. ay tablosu ve bütün alanlar JSON'larda.

**Tablo notları:**
- "yok" = hedefsiz başlayan cephe (destek, senyör çağrısı, sınır savaşı yolları).
- "eliminated" = taraf yok oldu.
- Söz bozma = `oathLog`.

**Okuma:**
- **Dengeli = p30 temposu:** seed 11 ve 404'te aday Dengeli kontrolle **bütün sayaçlarda aynı**.
- **Seed 23 farkı:** p30'un AI'sı iki savaşı "Yok Etme" ile açıyordu. Adayda bu seçim Vasallaştırmaya iniyor: 3 Vasallaştırma ilanı ve bir **müzakereli teslim** (surrender 1). Ardından yörünge ayrışıyor.
- **Plasebo bandı çok geniş:**
  - Seed 404'te tek RNG çekimi en büyük blok payını 0,80 → 0,50'ye indiriyor ve 225 ay ikinci blok doğuruyor.
  - Gerilim kollarının pay / ilan / süre farkları bu bandın içinde. Kampanya düzeyinde gerilime fayda ya da zarar **iddia edilmez**.
  - Davranış etkisi kontrollü deneyde (§8) gösterildi.
- **Seed 404 (8 AI) — p30 sorunu:** tek blok (0,80) adayda Dengeli'de aynen, Sakin 0,78 ve Çalkantılı 0,76. Bu faz 404'ün tek blok sonucunu **değiştirmedi**. Sonucun kırılgan olduğu plaseboda görülüyor.
- **Barış türleri:** adayda yeni türler gözlendi:
  - `surrender` (müzakereli teslim)
  - `war-goal` (hedef dolunca vasallık)
  - `surrender-scope` (teslimle kapanan destek cephesi)
- **Fetih iadesi:** v2 Fetih barışı kampanyada hiç gerçekleşmedi (0 iade). Mekanik yalnız Node'da kanıtlı (W1).
- **AI teslim teklifi:** 1 (seed 23 Dengeli).
- **Sahte Bayrak:**
  - Adayda ifşa var (Çalkantılı 11: 15, Dengeli 11: 8).
  - İfşa anında kurban ile günah keçisi hiç savaşta değildi → ifşa sonrası barış teklifi 0, ifşa sonrası savaş 0.
  - Çalkantılı'da deneme 11 / 10 (Dengeli 6 / 0) — kontrollü deneyle uyumlu yön.
- **Federasyonlar arası savaş:** AI önerisi 0 (şartlar katı) → §6 PARTIAL.

## 10. Regresyon

__REG__

## 11. Performans

__PERF__

## 12. Yayın

__ZIP__

## 13. Açık işler ve sınırlar

- **Misafirde toprak vaadi ve ayrı barış kutusu:** misafir aynasında savaş defteri yok. Bu iki kutu misafir arayüzünde çizilmez.
  - MP komutları ve maddeleri host'ta kabul edilir (`vassal` / `fedPeace` Node + Chromium; `landPromise` yalnız SP / host Node).
  - Misafir için **PARTIAL**.
- **Misafirde federasyonlar arası savaş önizlemesi:** önizleme aynadaki veriyle çizilir; host kararı yeniden denetler. Misafir arayüzünden önerge tarayıcıda **NOT RUN** (Node M4 PASS).
- **AI federasyonlar arası savaş önerisi:** kampanyada 0 (§9).
- **Sınır krizi üreticisi yok:** gerilim burada etkisiz (§7).
- **`faz86b_deal_engine` +3 FAIL satırı:** "her DEAL_KINDS türü parametresiz çalışır" denetimi yeni parametreli maddeleri (vassal, landPromise, fedPeace) parametresiz kurduğu için. Mevcut `warJoin` FAIL'iyle aynı kök. İlk FAIL kaydı `regresyon/`. Test değiştirilmedi.
- **Fiziksel ve canlı:** fiziksel Android, canlı Render, LAN ve kullanıcı kabulü **NOT RUN**.
