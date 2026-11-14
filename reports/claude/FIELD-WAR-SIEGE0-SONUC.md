# FIELD-WAR-SIEGE.0 — savaşın kendiliğinden kapanması, kuşatma ve toplu sevkiyat (14 Kasım 2026)

**Dil kuralı:** PASS / PARTIAL / FAIL / NOT RUN ayrı yazılır.

**Test ortamı:**
- Tarayıcı testleri bu konteynerde **yerel Chromium**'dur.
- MP'de üretim relay süreci ve yerel TLS vekili kullanılır.
- Canlı Render, fiziksel Android, LAN ve kullanıcı kabulü **NOT RUN**.

Kullanıcının kayıt dosyası eklenmedi. Saha belirtileri kontrollü fikstürle yeniden üretildi (§2–§4). Hiçbir madde TAMAMLANDI değildir.

## 0. Kısa sonuç

**Savaş neden kapandı**
- Synarth Sığınağı (AI) %100 savaş yorgunluğuna ulaştı. Yorgunluk 100'e varınca savaş her zaman zorla kapanır.
- Synarth'ta **Kan Hukuku** doktrini var; doktrin barış antlaşmasını yasaklar.
- Bu durumda eski kod `makePeace`'i atlayan ayrı bir dal çalıştırıyordu. Aynı gün iki mesaj yazıyordu:
  - "ORDU SAVAŞAMIYOR — … çatışma kendiliğinden durdu"
  - "Synarth Sığınağı savaştan çekildi — barış imzalandı"
- İkisi **aynı kapanıştır** (§2, `repro-war-close.txt`, gün 60).
- Aynı dal Fetih iadesini, savunma ve gerekçe temizliğini ve haberi atlıyordu. Defterde kapanışı yapan taraf yazılmıyordu (`actor:auto`).
- Yeniden ilanda savaşın çabuk kapanmasının nedeni yorgunluğun devredilmesidir. Rakip yorgunluğu barıştan sonra %55'ten başlar ve ayda 2,5 azalır. Bu geçerli bir kural; artık ilan önizlemesinde gösteriliyor.
- **Düzeltme:** tek kapanış yolu `warExhaustionClose`.
  - Her durumda `makePeace` defteri tutulur.
  - Doktrin kilidinde neden `exhaustion-lock` ("zorunlu ateşkes"), değilse `exhaustion`.
  - Defterde çekilen taraf ve savaş numarası yazılır.
  - Oyuncuya tek bildirim gider.

**36K kuşatma neden ilerlemedi**
- Gezegenin sahibiyle savaş sürerken gerçek iki engel vardı:
  1. **Yürümeyen kara ordusu "yolda" sayılıyordu.** Bekletilen, rotası kapalı ya da savaşta olan bir ordu bile son direnişi **18 ay** ateşkeste tutuyordu (garnizon %8 tabanı).
     - Kontrol fikstüründe 36K filo bu sürede ikmalsizlikten eridi (güç 0).
     - Gezegen 30 ayda alınamadı.
     - Adayda aynı kurulum **6 ayda** alınıyor.
  2. **Barıştan kalan kuşatma sayacı** (`col.siege`) sıfırlanmıyordu.
     - Garnizon toparlanması kalıcı olarak duruyordu (kontrolde garnizon 0, sayaç 3/6 sonsuza dek).
     - Sonraki savaş eski sayaçtan devam ediyordu.
- Kurala bağlı iki bekleme düzeltilmedi, panelde açıklandı:
  - savaş bitince bombardımanın durması;
  - yörüngedeki müttefik kara birliklerinin garnizonu her ay desteklemesi.
- **SİSTEM** panelinde "⚔ GEZEGEN SAVAŞI" altında gerçek durum gösteriliyor:
  - "Kalkan düşürülüyor — kalkan n"
  - "Kara ordusu bekleniyor — son direniş korunuyor (ateşkes a/18 ay)"
  - "Müttefik kara birlikleri garnizonu her ay destekliyor…"
  - "Garnizon bastırılıyor"
  - "Bombardıman ilerlemesi k/6 ay"
- Savaş bitmişse ayrı "⏸ KUŞATMA DURDU — gezegen sahibiyle savaş sona erdi (neden, gün n)" bölümü çıkar.
- Misafir bu bilgiyi host durumundan alır.

**Bekleyenleri Yeniden Dene — gerçek sonuçlar**
- Fikstür: Arran ve Lyrdex-59 tersanelerinden "Araştırma 3"e sevkiyat ("güvenli rota yok"; Lyrdex-59 otomatik deneme sınırında) + kapalı rotalı + hedefi kayıp + yolda.
- Tek dokunuş sonucu: **"2 yola çıktı · 1 güvenli rota bekliyor · 1 hedef bulunamadı — hedef değiştir · 1 zaten yolda"**.
  - Düğme etiketi (3) → (1).
  - Kaynak ve gemi sayısı değişmedi.
  - Çift dokunuşta motor tek kez çağrıldı.
- 11 bekleyende ortak rota bütçesi: 8 rota hemen hesaplandı, **"3 rota hesabı sırada"**; sonraki filo adımında arandılar.
- MP misafiri kendi panelinden kullandı: host'ta **tek** uygulama; başka devletin sevkiyatı değişmedi.

## 1. Kaynak, dal, sürüm

| | |
|---|---|
| Doğrulanmış taban | Taslak PR **#45** açık. GitHub HEAD `claude/stars-war-goals0` = **`03a3aa432c2a126ace8180844f0735e60209d679`** (p31; PR'ın head SHA'sı, API ile doğrulandı). Daha yeni uygun taban yok. |
| Başlangıç HEAD | `03a3aa432c2a126ace8180844f0735e60209d679` |
| Aday dal | **`claude/stars-field-war-siege0`** |
| Render Branch adı | `claude/stars-field-war-siege0` (dağıtım yapılmadı) |
| Bitiş HEAD ve PR | {{BITIS}} |
| Sürüm | oyun **96h10p32** · PWA `stars-v96h10p32` · Save8 **v8** · MP **MP.8.9b29** · paket **4** · protokol **1** |
| Paket uyumu | p32 yükleyicisi p6–p31, p25u1 ve p27s1 paketlerini kabul eder |
| Save8 | Yeni zorunlu alan yok. Sevkiyat kayıtları aynı `f.shipment` biçimindedir. Ayna alanı `col.siegeEnd` yalnız misafir aynasındadır; Save8'e yazılmaz. |

## 2. Sorun 1 — elle ilan edilen savaş kendiliğinden kapanıyor

### 2.1 Zincir

| Adım | İçerik |
|---|---|
| **İlk davranış** | Kontrol `03a3aa4`, fikstür `repro-war-close.cjs`: oyuncu Synarth'a ilan eder, Synarth yorgunluğu 99,5. **Gün 60**'ta tek kapanış olur. Kan Hukuku'lu dalda günlükte iki mesaj çıkar: "ORDU SAVAŞAMIYOR — Synarth Sığınağı ile çatışma kendiliğinden durdu" ve "Synarth Sığınağı savaştan çekildi — barış imzalandı". Defter: `exhaustion\|actor:auto`. Doktrinsiz dalda da üç ayrı mesaj çıkar. |
| **Neden** | `warExhTick` (diplomacy.js) yorgunluk ≥ 100'de iki dala ayrılıyordu. **Kilitli dal** (`!canPeace`) `makePeace`'i atlıyordu: Fetih iadesi, `warDefense`/`warCause`, vekil savaşlar, haber ve toprak vaadi sonu çalışmıyordu. Mesaj "barış imzalandı" diyordu. Kapanışı yapan taraf yazılmıyordu. Bildirim yalnız `id===0` için gidiyordu. |
| **Yeniden ilanın çabuk kapanması** | Geçerli kural. Rakibin yorgunluğu kapanışta %55'e iner, barışta ayda 2,5 azalır. Yeni savaşta ayda en az +1,3 artar; gemi kaybı 1,6, sistem kaybı 6. Yeniden ilan bu birikimin üstünden başlar. `warStart` sıfırlanır; eski emirler, taraf kayıtları ya da bitiş koşulları yeni savaşa geçmez (W4, W6). |
| **Değişiklik** | `warExhaustionClose(e,o)`: kilitte `wg`/`proxyWar` temizlenir. Sonra `makePeace(e,o,lock?'exhaustion-lock':'exhaustion',e.id,{force:true,quiet:true})` çağrılır, yorgunluk 55 / min(·,55) olur. Tek bildirim: "SAVAŞ YORGUNLUĞU %100 — … zorunlu barış \| zorunlu ateşkes (doktrin barış antlaşmasını yasaklıyor) … · Savaş #n". `makePeace` yalnız `opts.force` ile `canPeace`'i atlar; olağan çağrılar değişmez. |
| **Önizleme** | `warExhaustionForecast(actor,target)`: kendi yorgunluğun kesin. Rakibinki SIZILMIŞ istihbaratla kesin; yoksa son zorunlu barıştan tahmin edilir; ikisi de yoksa "bilinmiyor". Kayıpsız kalan ay da verilir. Savaş ilanı ÖNİZLEMESİ'nde "SAVAŞ YORGUNLUĞU" bloğu ve riskler satırı gösterilir (yalnız oyuncunun bildiğiyle). |
| **Son test** | Node `field_war_siege0_test` W1–W6 **6/0** (kontrolde W2/W3/W4 FAIL). Chromium F1 PASS. |

### 2.2 Kabul

| Durum | Sonuç |
|---|---|
| Yeni savaş + olağan barış (W1) | PASS — tek cephe, `agreement\|actor:0`, tarih defterde |
| Geçerli zorunlu barış (W2) | PASS — `exhaustion\|actor:1` (çekilen Synarth), tek bildirim, yorgunluk 55 |
| Zorunlu ateşkes, doktrin kilidi (W3) | PASS — `exhaustion-lock\|actor:1`, savaş hedefi temizlendi, "barış imzalandı" yok |
| Aynı hedefe art arda iki elle ilan (W4) | PASS — her ilan ayrı cephe; önizleme rakip yorgunluğunu ve risk satırını gösterir; hiçbir cephe iki kez kapanmaz; A↔S arası toprak el değiştirmez |
| Fetih v2 zorunlu barışta (W5) | PASS — hedef dışı işgal **tam bir kez** iade, hedef sistem kalır, kapanıştan sonra ikinci devir yok |
| Kayıt/yükleme (W6) | PASS — yeniden ilan edilmiş savaş Save8'den yüklenir; sonraki kapanış aynı gün ve nedenle |
| Kim, neden, hangi tarihte | Defter `endReason` = `neden\|actor:<çekilen>`, `ended` = oyun günü; bildirimde "Savaş #n". |
| Vasallaştırma, ayrı barış, işgal, toprak vaadi | Kapanış artık hep `makePeace`'ten geçer. p31'in mevcut yolu kullanılır: `warFetihSettle`, `warPromiseFrontEnded`, `resolveProxyWars`. Teslim vasallığı yorgunlukla ilgisiz (p31 testleri, §6). |

## 3. Sorun 2 — 36K filo kuşatmada ilerleme görmüyor

### 3.1 Ölçüm (oyun tarihi; `repro-siege.cjs`, `repro-siege.txt`)

Fikstür: orta harita, seed 22. Oyuncunun ≈36K filosu Synarth başkentinde, savaş sürüyor.

| Senaryo | Kontrol `03a3aa4` | Aday |
|---|---|---|
| Kara ordusuz bombardıman | 6 ayda alındı (sayaç 1…6/6) | 6 ay (aynı) |
| Kara ordusu çıkarması | 1 ay | 1 ay (aynı) |
| Bekletilen kara ordusu (ortak plan bekletmesi) | **30 ayda alınamadı.** Ateşkes 18 ay, garnizon %8 tabanında; **36K filo ikmalsizlikten eridi (güç 0)** | **6 ay**, ateşkes yok |
| Kale + bekletilen ordu | **alınamadı** (aynı) | 6 ay |
| Rotası kapalı ordu sevkiyatı (K4) | "yolda" sayılıyordu | sayılmaz, 6 ayda alınır |
| Kuşatma ortasında barış (3. ay) | sayaç **3/6'da kalır**, garnizon **0'da kalır** (toparlanma yok) | sayaç 0, garnizon toparlanır (86'ya) |
| Yörüngede müttefik kara birliği | 12 ay 1/6'da takılı (birlik eriyince 17. ayda) | aynı **kural**; panel nedeni söyler |

### 3.2 Zincir

| Adım | İçerik |
|---|---|
| **Neden 1 (hata)** | `incomingArmy` bekletilen (`jointHoldUntil`), savaşta, geri çekilen ya da sevkiyatı `blocked/paused/lost` olan orduyu da "yolda" sayıyordu. Hareketli orduda hedefi bir sonraki durak (`mv.to`) sanıyordu. Bu yüzden son direniş 18 ay ateşkeste kalıyordu. |
| **Neden 2 (hata)** | Kuşatan kalmadığında ya da savaş bitince `col.siege`, `truce` ve `truceAge` sıfırlanmıyordu. `groundTick` "kuşatma altında" sanıp garnizonu doldurmuyordu; sonraki savaş eski sayaçtan sürüyordu. |
| **Kural (açıklandı)** | Savaş bitince bombardıman ve çıkarma durur. Müttefik kara birlikleri garnizonu destekler. Kalkan 5 üstündeyken çıkarma yoktur. Son direnişte bombardıman etkisi düşüktür. |
| **Değişiklik** | `incomingArmy`: yürümeyen ordu sayılmaz, varış = yolun son durağı. `groundTick` başında `siegeStaleClear(sys,pl)`: kuşatan silahlı ve savaşta bir güç yoksa sayaç ve ateşkes sıfırlanır. `siegeStatus` / `siegeStopRows` gerçek koloni alanlarından metin üretir. Filo gücü, bombardıman ve kara çıkarmasının rolleri aynı. RNG yok. |
| **Panel** | SİSTEM → "⚔ GEZEGEN SAVAŞI" satırında durum metni (`.siegeSt[data-code]`). Kendi filon yabancı kolonideyse ve savaş son 720 günde kapandıysa "⏸ KUŞATMA DURDU" + neden ve gün. |
| **MP** | Ayna, yalnız sahibiyle savaşta olan ve yörüngesinde duran filosu bulunan misafire `truce`, `truceAge`, `reinforced` alanlarını ekler. Savaş yoksa ve filo yörüngedeyse kamu savaş sonu özeti `siegeEnd {d,r}` gider (K8 Node, MP8 K2). |
| **Son test** | Node K1–K8 **8/0** (kontrolde K1, K3, K5–K8 FAIL; K1 ve K6–K8 yeni durum işlevleri yüzünden). Sahiplik her senaryoda tam bir kez değişir (K1, K2). Chromium F2 PASS, MP8 K2 PASS. |

Saha süresi gerçek dakikadır; motor oyun tarihiyle ilerler. "5–10 gerçek dakika" ölçülen hıza bağlıdır ve doğrulanmadı. Bekletilen ordu ve barış sonrası sayaç mekanizmaları oyun ayıyla kanıtlandı.

## 4. Sorun 3 — Bekleyenleri Yeniden Dene

| Adım | İçerik |
|---|---|
| **İlk davranış** | Sevkiyatlar yalnız seçili filonun SEVKİYAT kutusundan, tek tek "YENİDEN DENE" ile denenebiliyordu. |
| **Değişiklik** | `shipmentRetryList(e)` / `shipmentRetryAll(e)` (main.js). Sınıflar: `retry` (blocked/paused/ready), `moving`, `combat`, `retreat`, `waiting`, `lost`. Yeniden denenecekler mevcut `followRallyFleet` ile aranır (güvenli rota, hareketli hedef izleme); tekli denemeyle aynı sıfırlama yapılır. Ortak bütçe 8; artanı `ready` kalır ve sonraki `stepFleets` adımında aranır. |
| **Arayüz** | FİLO sekmesi, filo seçiminden bağımsız "SEVKİYATLAR (n)" bölümü: "Bekleyenleri Yeniden Dene (N)", gerçek sonuç metni, her sevkiyatın durumu ve "SEVKİYATI YÖNET" (hedef değiştir). Çift ya da hayalet dokunuş 1,2 sn korunur; misafirde host yanıtına kadar "Host denetliyor…". |
| **MP** | Yeni host komutu `shipmentRetryAll` (`keys:['kind']`). Sahiplik ve durum host'ta yeniden sınıflanır; yeniden denenecek yoksa `nothing-to-retry`. Misafir sarmalayıcısı sonucu host yanıtından yazar (iyimser sonuç yok). |
| **Son test** | Node S1–S5 **5/0**: tek liste, çift çağrı, bütçe 8 + 3 sırada, kayıt/yükleme, MP sahiplik. Chromium F3 PASS. MP8 K1 PASS (çift gerçek dokunuş → host'ta tek çağrı). |

## 5. Testler

| Test | Sonuç |
|---|---|
| `node tests/field_war_siege0_test.js` | aday **19/0** · kontrol `03a3aa4` **5/14** (ilk FAIL kanıtı `node-control-03a3aa4.log`) |
| `tests/browser-field-war-siege0.cjs` (SP, 844×390, gerçek dokunma) | **3/0** — F1 tek bildirim + önizleme yorgunluğu, F2 kuşatma paneli + KUŞATMA DURDU, F3 toplu sevkiyat |
| `MP8_SCEN=K node tests/browser-mp8.cjs` (host + 1 misafir) | ilk koşu 2/1 (K2 regex "antlaşması" ≠ motor metni "anlaşması"; test hatası, `mp8-K-run1.log` korunur) → **3/0** (`mp8-K-run2.log`) |
| Kampanya (kontrol / aday) | §6 |
| Tam regresyon | §7 |

## 6. Kampanya (yalnız AI, orta harita)

{{KAMPANYA}}

## 7. Regresyon

{{REGRESYON}}

## 8. Yayın

{{YAYIN}}

## 9. Açık işler ve sınırlar

- Saha kaydı yok. Gerçek oturumun Synarth'ının Kan Hukuku taşıdığı **doğrulanmadı**; aynı iki mesajı yalnız kilitli dal ürettiği için çıkarımdır.
- 36K bekleme süresinin gerçek dakika karşılığı doğrulanmadı (§3).
- Müttefik kara birliği desteği ve savaş sonrası bombardımanın durması kuraldır, değiştirilmedi; panelde açıklanır.
- AI kuşatma kararları değişmedi. Kural düzeltmeleri AI savaşlarını da etkiler (§6).
- Fiziksel Android, canlı Render, LAN: **NOT RUN**. Kullanıcı kabulü yok; main'e birleştirme ya da dağıtım yapılmadı.
