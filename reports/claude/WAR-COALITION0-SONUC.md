# WAR-COALITION.0 — tek savaş ilanı akışı ve koalisyon (15 Kasım 2026)

**Dil kuralı:** PASS / PARTIAL / FAIL / NOT RUN ayrı yazılır.

**Test ortamı:**
- Tarayıcı testleri bu konteynerde **yerel Chromium**'dur.
- MP'de üretim relay süreci ve yerel TLS vekili kullanılır.
- Canlı Render, fiziksel Android, LAN ve kullanıcı kabulü **NOT RUN**.

Hiçbir madde TAMAMLANDI değildir; kullanıcı kabulü bekler.

## 0. Eski akış → yeni akış

**Örnek:** Saf Akıl Ağı, İxir Tahtı'na karşı Fetih ilan edecek. Müttefiki Yeşil Birlik (insan) ve Rhyvaur Şurası (AI) çağrılacak.

**Eski akış (p32)**
1. İlişki sayfası → SAVAŞ İLAN ET → hedef penceresi.
2. "Önce Koalisyon Hazırla" → Savaş Merkezi'nde hazırlık açılır.
   - Fetih sistem seçimi hazırlığa **taşınmıyordu**.
   - Kısıt: hazırlık yalnız amaç anahtarını tutuyordu.
3. Savaş Merkezi → Katılım Adayı → her aday için ayrı Genel Anlaşma penceresi (tek tek).
4. Yanıtlar farklı yerlerde: AI kararı anlaşma penceresinde, insan yanıtı gelen kutusunda.
5. Savaş Merkezi → Son Savaş Onayı.
   - Bütün katılımcılar kabul etmeden ilan yoktu.
   - Bekleyen ya da reddeden bir aday hazırlığı kilitliyordu.

**Yeni akış (p33)**
- İlişki sayfası → SAVAŞ İLAN ET → **Fetih** → sistemleri seç (Athdor, Kalinex). Aynı pencerede üç adım açılır.

1. **Hedef.**
   - Seçim üstte durur; "Hedefi değiştir" ile geri gidilir, seçim korunur.
   - Gelen teklif, MP yenilemesi ya da kaydet/yükle seçimi sıfırlamaz.
2. **Müttefikleri çağır (isteğe bağlı).**
   - Tek liste. Önce müttefik ve federasyon ortakları, sonra "Diğer devletler".
   - Her kartta durum ve kısa gerekçe yazılı.
   - "Şart ekle" ile kaynak ya da geçiş izni eklenir.
   - **"Davetleri Gönder (2)"** tek dokunuşla iki davet açar.
3. **Son onay** (aynı ekran, alt şerit sabit):
   - amaç, kesin ve koşullu destekçiler, hedefin bilinen destekçileri;
   - gerekçe ve meşruiyet, yorgunluk, toplam bedel;
   - ayrıntılar açılır bölümde.
   - Ana düğme "**2 Destekçiyle Savaş İlan Et**". Yalnız doğrulanmış kabuller sayılır.
   - Yanında "Desteksiz İlan Et", "Hazırlığı Kaydet ve Çık" ve "Vazgeç" var.

**Aynı oturumdaki gerçek MP örneği** (MP8 Q, iki ayrı misafir Chromium):
- B davet gönderdi.
  - Rhyvaur (AI) 400 alaşım şartıyla **kabul etti**.
  - Yeşil Birlik (insan misafir C) gelen kutusundaki kartta şu satırı gördü:
    > "⚔ Saf Akıl Ağı yanında İxir Tahtı karşısına savaş · Fetih · Athdor, Kalinex · katılım Saf Akıl Ağı savaşı ilan ettiği anda başlar (hazırlık #1, en geç gün 181)"
  - C 150 mineral isteyen **karşı teklif** verdi.
- B kartta Kabul Et'e dokundu. Düğme "2 Destekçiyle Savaş İlan Et" oldu.
- Çift dokunuş sonucu:
  - tek cephe açıldı; C ve Rhyvaur savaşta;
  - Fetih hedefleri [12, 14] ilana taşındı;
  - bedeller bir kez düştü (150 mineral, 400 alaşım, 25 etki).

**Tek başına ilan:** SAVAŞ İLAN ET → hedef seç → "Savaş İlan Et". İki adım; davet ya da hazırlık açılmaz. Fetih: S1, C1. Vasallaştırma: S4.

## 1. Kaynak, dal, sürüm

| | |
|---|---|
| Doğrulanmış taban | Taslak PR **#46** açık. GitHub HEAD `claude/stars-field-war-siege0` = **`a20d531aa1945b743da44fb6776b56f319362fd0`** (p32, API ile doğrulandı). |
| Başlangıç HEAD | `a20d531aa1945b743da44fb6776b56f319362fd0` |
| Aday dal | **`claude/stars-war-coalition0`** |
| Render Branch adı | `claude/stars-war-coalition0` (dağıtım yapılmadı) |
| Bitiş HEAD ve PR | Taslak PR **#47** — https://github.com/sarsiss12-dot/Star/pull/47 (taban #46 `claude/stars-field-war-siege0`); son commit PR'da ve sonuç raporunda |
| Sürüm | oyun **96h10p33** · PWA `stars-v96h10p33` · Save8 **v8** · MP **MP.8.9b30** · paket **4** · protokol **1** |
| Paket uyumu | p33 yükleyicisi p6–p32, p25u1 ve p27s1 paketlerini kabul eder |
| Save8 | Yeni zorunlu alan yok. Hazırlık kaydına yalnız kullanıldığında `opts` (Fetih hedefleri / vasallık türü + savaş hükmü), `invites` (≤16) ve kabulde `sig` eklenir; doğrulayıcı `warCoalitionFieldsValid`. AI yolu ve eski kayıtlar bayt bayt aynı yazılır; eski seçeneksiz hazırlık eski kurallarıyla açılır ve başlar (C4, C6). |

## 2. Motor (diplomacy.js)

- **Hazırlıkta hedef seçenekleri.** `warPrepareCreate(e,target,goal,opts)` → `warPrepOptsNorm`.
  - Fetih: `warGoalOptions` ile aynı denetim (bilinen, başkent dışı 1–5 sistem, hedefe ≥1 sistem kalır).
  - Vasallaştırma: tür + savaş hükmü.
  - `warPrepareLaunch` → `setWarGoal(...,p.opts)`. p32'deki "seçim hazırlıkta kayboluyor" açığı kapandı.
- **Kabul imzası.** Kabul anındaki `[goal, opts]` `c.sig` olarak saklanır.
  - Çekirdek şart değişirse (`warPrepareUpdate` / MP `warPrepareGoal`) kabul **eskir**: kart "Hedef şartları değişti; güncel koşulları yeniden onaylaması gerekir" der.
  - Eskiyen kabul son onaya girmez; yeniden davet önceki şartları doldurur.
  - Bekleyen insan daveti kapanır ("invalid"); eski şartla kabul edilemez (C3, K3).
- **Kısmi teklif ve onay.** `warPrepareQuote(e,id,'partial')` → `warCoalitionQuote`.
  - Yalnız geçerli, eskimemiş kabuller sayılır. Geçersiz üye gerekçesiyle ayrı listelenir; bekleyenler ayrı.
  - Damga kısa özet `warStampHash` (FNV çifti; misafirin 8192 karakterlik komut sınırına sığar).
  - `warPrepareLaunch(...,'partial')` yalnız `q.members`'ı uygular.
  - Kısmi olmayan eski çağrı aynen sürer: kabul yoksa ret (C6).
- **Davet durumu.** `p.invites` durumları: pending / accepted / countered / rejected / expired / closed.
  - Şu olaylar bekleyen daveti kapatır: iptal, ilan, hedef değişikliği, süre bitimi, hedefin elenmesi (C5).
  - Kapanan hazırlığın daveti uygulanamaz; yeni cepheye taşınmaz.
- **Toplu davet.** `warCoalitionInvite`.
  - AI'da motorun `aiRespond` kararı: kabul / karşı teklif / ret.
  - İnsanda MP teklif deposuna gider.
  - Aynı devlete çift davet listesi reddedilir; bekleyen davet ikinci kez gönderilmez (K2).
- **Aday listesi.** `warCoalitionCandidates`.
  - Yalnız temaslı devletler; her tur bütün devletler yeniden hesaplanmaz. Rota önbelleği `WAR_COAL_REACH` (WeakMap).
  - Gruplar: near (müttefik / federasyon ortağı) ve other (temaslı devlet).
  - Durumlar: Davet edilebilir / Cevap bekleniyor / Karşı teklif / Kabul etti / Reddetti / Süresi doldu / Katılım engellendi.
  - Ayrı etiketler: "Hedefle zaten savaşta — aynı taraftasınız; ayrıca davet ve ödeme gerekmez" ve "Mevcut yükümlülükle katılır: … ; ayrıca ödeme yok". Çift ödeme yok.
  - Engel gerekçeleri:
    - "Hedefle saldırmazlık paktı var"
    - "Hedefle ittifakı var"
    - "Hedefle teması yok"
    - "Seninle teması yok"
    - "Hedefle yakın zamanda barış yaptı; bekleme süresi sürüyor"
    - "Bilinen bilgilerle erişilebilir rota görünmüyor; geçiş izni gerekebilir (tahmin)" (belirsizlik açık yazılır)
    - motorun `warSupportGate` metinleri.
- **Plan katılım etiketi.** `warCoalitionLabel`: "X yanında Y karşısına savaş · amaç · katılım … ilan ettiği anda başlar (hazırlık #n, en geç gün d)".
  - Gelen kutusu kartı ve anlaşma penceresi bu metni kullanır.
- **Toprak vaadi.** Savaştan önce hazırlık davetine toprak vaadi eklenmez; vaat yalnız etkin cepheye katılım isteğinde.
  - Şart düzenleyici "Toprak vaadi savaş başladıktan sonra cepheye bağlanır." der.
- **Kan Hukuku sahipliği (C7).** `warExhaustionClose` doktrin kilidinde `wg/proxyWar`'ı `makePeace`'ten **sonra** siler.
  - Eskiden `warFetihSettle` hedef kaydını bulamıyor, hedef dışı işgali iade etmiyordu.
  - Beklenen kural önce yazıldı (Fetih barışıyla aynı):
    - ele geçirilen hedef sistem kazananda kalır;
    - hedef dışı işgal iade edilir;
    - ortağa vaat edilen hedef sistem ortağa devredilir.
  - Her devir tam bir kez; neden `exhaustion-lock`; tek bildirim.
  - Kontrol a20d531'de C7 **FAIL**, adayda PASS.

## 3. Arayüz (ui.js, index.html)

- `UI.warDeclarationPreview` → `WarCoal.open`: hedef penceresinden sonra tek akış penceresi (`.mbox.war.liveWorld`).
- Fetih / Vasallaştırma seçimi `UI._wgSels` içinde `id:key` başına korunur. Açık hazırlık varsa SAVAŞ İLAN ET doğrudan onu açar.
- Kartlar: rozet (durum metni + renk, yalnız renk değil), gerekçe (iki satır kırpma), "Şart ekle".
  - Şart düzenleyici ±50 kaynak düğmeleri ve geçiş izni anahtarı; klavye gerekmez.
  - Karşı teklifte değişiklik ve gerçek bedel yazılır; Kabul Et / Reddet / Teklifi Düzenle.
- Alt şerit sabit (`.coalFoot`, `position:sticky`): seçilen davet sayısı, ana ilan düğmesi, Desteksiz İlan Et, Hazırlığı Kaydet ve Çık, Vazgeç.
- `max-height:430px` sorgusu 844×390 ve 740×360 yatay ekranlar içindir.
- Hazırlığı Kaydet ve Çık → DİPLOMASİ / Savaş Merkezi'nden ya da SAVAŞ İLAN ET'ten devam edilir.
- **Eski son onay sözleşmesi korunur.** Yeni akış her çizimde tek kullanımlık `warFinalConfirm` jetonu kaydeder. Jetonu şunlar geçersiz kılar: pencerenin kapanması ya da yeniden açılması, dünyanın yüklenmesi, akışın değişmesi.
  - Karar aynı `launch` → `direct` / `warLaunch` yolundan geçer.
  - Yüklenen dünyada eski pencerenin düğmesi ilan etmez.
  - Koşul değiştiyse (federasyon yükümlülüğü, Etki, Konsey, doktrin, hedefin ölmesi) bedel ve RNG çekilmeden güncel özet yeniden çizilir.
  - Bunu `faz95d_war_preview_test` (19 vaka) sınar. İlk tam regresyonda bu paket **10/9 FAIL** verdi (kanca yoktu); düzeltmeden sonra 19/0.
- **Son onay özetinde görünür:**
  - SAVAŞ YORGUNLUĞU (senin ve rakibin, tahmin dayanağı, "ayda 2,5" taşınma);
  - meşruiyet düzeyi ve gerekçe adları;
  - hedef tarafının kesin / koşullu destekçileri ve gerekçeleri ("Savunma oylaması veya gönüllü yardım gerekli");
  - BİLİNMEYENLER: "Bu bölüm gizli devlet sayısını göstermez".
  - İlk tam regresyonda `browser-field-war-siege0` 2/1 ve `browser-war-goals0` 3/2 FAIL verdi: bu bilgiler kapalı ayrıntı bölümündeydi. Düzeltmeden sonra 3/0 ve 5/0 (`evidence/war-coalition0/regresyon/ilk-kosu/`).
- Değişiklik görüldüğünde host yeniden doğrular. Bütçe, rota, pakt, hedef ya da katılımcı değişirse kart gerekçe verir. Özet güncellenir, damga değişir; sessiz kadro/bedel değişikliği yok.
- Gelen kutusu kartı (`diplomaticBrief`) host etiketini kullanır (`MP71Dip.offerByKey`): "Savaş katılım daveti", hedef, desteklenen taraf, amaç, başlangıç, süre.

## 4. MP (mp-core, guest-stars, mp71-dip)

- **Yeni host komutları:**
  - `warCoalition` (salt okuma; görünüm `warPure` içinde kurulur);
  - `warInvite` (toplu davet);
  - `warInviteReply`;
  - `warPrepareGoal` (şart değişikliği);
  - `warDealRead` (salt okuma; budanmış savaş defteri).
- **Değişen komutlar:**
  - `warPrepare` Fetih / Vasallaştırma seçeneklerini alır;
  - `warLaunch` `mode:'partial'` alır.
- Host her adımı motorun `warCoalitionCommand`'ında yeniden denetler: yetki, hazırlık sahibi, hedef, bütçe, damga.
- **MP teklifleri ile davetler bağlı** (`coalMark` / `coalCloseOffers`):
  - insan reddi → rejected;
  - insan karşı teklifi → countered (teklif kimliğiyle);
  - geri çekme → closed;
  - hedef değişikliği, iptal ya da ilan → bekleyen teklif kapanır.
- **Gizlilik:**
  - Misafir yalnız kendi hazırlığını ve kendi davetlerini görür.
  - Başkasının hazırlığı `prep:null`; Savaş Merkezi okumasında da görünmez.
  - Alıcı olmayan teklifi yanıtlayamaz (K2).
- **Misafir arayüzü:**
  - `MP6Stars.warCoalition` kimlikleri gerçek ↔ yerel çevirir (π).
  - Görünüm eylemleri (coal*) yereldir.
  - `warCoalition` / `warDealRead` salt okuma komutlarıdır.
- **Açık pencere dünyayı bekletmez.** Misafirin bekletme kuralı (`holdBuild`) `.mbox.liveWorld` pencerelerinde aynayı bekletmez. Kapsam: savaş akışı, arşiv / gelen kutusu kabuğu, iki İç İstikrar penceresi. Bu pencerelerde:
  - harita, tarih ve kabul edilen emirler pencere açıkken güncellenir;
  - seçim, şart taslağı ve kaydırma korunur.
  - Ölçüm: Q4 ve P açık pencere (§6).
- **Misafir savaş diplomasisi** gerçek anlaşma penceresinde. Misafir aynasında savaş defteri yoktur; `warDealHtml` sarmalayıcısı host'tan budanmış defteri alır ve yalnız çizim çağrısında kullanır.
  - Ayrı barış: Q5.
  - Toprak vaadi: Q6.
  - Federasyona karşı savaş önergesi: Q7.

## 5. Testler

| Test | Sonuç |
|---|---|
| `node tests/war_coalition0_test.js` (C1–C7) | **7/0** · kontrol a20d531 **1/6** (C6 eski davranış PASS; C1–C5, C7 FAIL) — `evidence/war-coalition0/node-*.log` |
| `node tests/war_coalition0_mp_test.js` (K1–K3; misafir planlayan B, insan alıcı C, gizlilik / yetki, şart değişikliği / iptal) | **3/0** |
| `node tests/faz86b_deal_engine_test.js` | Genel matris parametreli dört maddeyi (`warJoin`, `vassal`, `landPromise`, `fedPeace`) artık atlar. Yeni E bölümü: her biri için olumlu durum + eksik parametre reddi. Paket 120/22; kalan 22 FAIL p32'de de var (§7). |
| Chromium `browser-war-coalition0.cjs` | **5/0**: S1 tek başına Fetih (844×390), S2 Vasallaştırma seçimi geri dönüşte korunur, S4 tek başına Vasallaştırma ilanı (Akademik + Katılmaz → "Savaş İlan Et"; tür ve hüküm ilana taşınır, hazırlık açılmaz), S3 karışık koalisyon (kaynaklı kabul, karşı teklif → Kabul Et, ret, engelli aday, kaydet-çık-devam, kaydet/yükle, hedef değişince yeniden onay, bedel bir kez) **844×390 ve 740×360**. İlk koşular `browser-sp-run1..3.log` (FAIL'ler korunur); run4 4/0, S4 eklendikten sonra `run5` 5/0. |
| MP8 **Q** (`MP8_SCEN=Q node tests/browser-mp8.cjs`; host + 2 misafir ayrı Chromium, üretim relay + TLS) | **8/0** (`mp8-Q-run12.log`). run1–run11 FAIL'leri ve kısmi koşu kanıt olarak korunur. |

**MP8 Q ayrıntıları**
- **Q1:** B gerçek ilişki sayfasından SAVAŞ → Fetih → akış. C ve Y seçilir; Y'ye ±50 dokunuşla 400 alaşım şartı. "Davetleri Gönder".
- **Q2:** C'nin gelen kutusunda gerçek kart (metin §0). C karşı teklif verir. B'nin kartı "Karşı teklif" olur; B Kabul Et'e dokunur. Düğme "2 Destekçiyle Savaş İlan Et".
- **Q3:** çift dokunuş → tek cephe; C ve Y savaşta; hedefler [12, 14]; bedeller bir kez (mineral 150, alaşım 400, etki 25); C'nin aynasında savaş görünür.
- **Q4:** B'nin savaş akışı penceresi açıkken host 45 gün ilerler ve B gemi emri verir.
  - Misafir tarihi 1 → 46; emir 785 ms'de yansıdı.
  - Seçim, şart taslağı (50) ve kaydırma (220 → 220) korundu; bekletme sayacı +0.
  - İç İstikrar penceresi açıkken 30 gün de ilerledi.
- **Q5:** B gerçek masada AYRI BARIŞ kutusunu gördü ("yalnız bu cephe (#1) kapanır", öteki cepheler "sürer"). Teklif host'a doğru taraflarla gitti; AI reddi gerçek gerekçeyle döndü.
- **Q6:** cepheye katılım isteğine TOPRAK VAADİ dokunuşla eklendi. Host teklifi `landPromise {sys, front:1}` + `warJoin {front:1}` ile kaydetti.
  - İlk tam koşularda (run10, run11) aday listesi boştu.
  - Neden: Q4'teki 75 günde C hedef sistemleri ele geçirmişti; X'e yalnız başkent kalmıştı. Bu durumda "Bilinen düşman sistemi yok" **doğru davranış**.
  - Fikstür X'e B'nin gördüğü bir sistem verir (kısmi koşu kanıtı `mp8-Q-partial-q6b.log`).
- **Q7:** B (federasyon başkanı) gerçek federasyon ekranında FEDERASYONA KARŞI SAVAŞ ÖNER → hedef üye → Vasallaştırma → OYLAMAYA SUN.
  - Host'ta oylama açıldı: `{kind:'motion', motion:'fedWar', targetFed, target, goal:'boyun', vtype:'haracguzar', war:'none'}`.
  - run10/11 FAIL'i testin bekleme koşulundaydı (`vote.kind==='fedWar'` arıyordu, motor `motion` yazar).

Ekran görüntüleri:
- dar yatay ekran: `evidence/war-coalition0/browser-sp/740x360-s3-son-onay.png` (+ `-sart`, `-yanitlar`, `-yeniden-onay`) ve 844×390 eşleri; tek başına ilanlar `844x390-s1-tek-basina.png`, `844x390-s4-vasal-tek-basina.png`;
- gerçek misafir koalisyon kanıtı: `evidence/war-coalition0/mp8/Q/q1-davetler.png`, `q2-davet-karti.png`, `q2-karsi-teklifler.png`, `q2-son-onay.png`, `q3-ilan.png`, `q4-acik-pencere.png`, `q5-ayri-baris.png`, `q6-toprak-vaadi.png`, `q7-fedwar.png`.

## 6. P — 500 sistem / 16 AI / 2 insan / 15 dk

| Koşu | Sonuç | En uzun dünya gecikmesi | Donma | Emir yansıması (gemi siparişi) | Yeniden eşitleme | Host günü / son ay |
|---|---|---|---|---|---|---|
| Normal (`mp8-P-normal.log`) | **8/0** | **16,9 gün** | 0 | 20/20 · medyan 755 ms · en uzun 4478 ms | 0 | 6360 / 4,5 sn |
| DESYNC (p32 ile aynı ayar; `mp8-P.log`) | **8/0** | **18,5 gün** | 0 | 20/20 · medyan 554 ms · en uzun 1038 ms | 0 | 6776 / 3,3 sn |
| Kasıtlı açık pencere (`MP8_P_MODAL=1`, `mp8-M.log`) | **8/0** | **20,6 gün** | 0 | 20/20 · medyan 534 ms · en uzun 1870 ms | 0 | 6031 / 4,2 sn |

**Açık pencere koşusu.** Her emir ölçümünde misafirde İç İstikrar penceresi (`mbox sci liveWorld`) açılır. Hareket ve gemi emri pencere kapanmadan gönderilir.
- 20 ölçümün **20'sinde** pencere yansıma anında hâlâ açıktı (`modalStillOpen`).
- Bütün gemi siparişleri aynaya pencere açıkken yansıdı.
- p32'de aynı ölçüm pencereyi önce kapatıyordu. p32'nin ilk P koşusundaki 7/1 FAIL'i açık İç İstikrar penceresinin aynayı bekletmesiydi; bu pencerede o durum artık yok.

P normal koşusu son onay sözleşmesi düzeltmesinden önceki ui.js ile koşuldu (fark yalnız savaş ilanı penceresinde; P bu pencereyi açmaz). DESYNC ve açık pencere koşuları son kodla.

## 7. Regresyon

Günlükler: `evidence/war-coalition0/regresyon/` (betik `reg33.sh` = p32'nin `reg32.sh`'i + `browser-war-coalition0` + MP8 Q + P açık pencere). İlk tam koşunun FAIL'leri `regresyon/ilk-kosu/` altında korunur (§3).

| Küme | p32 (`a20d531`) | p33 aday (son koşu) |
|---|---|---|
| Node tam koşu | 203 paket · 6300 geçen / 280 kalan | **205 paket · 6322 / 275** |
| Paket paket fark | — | `war_coalition0` 7/0, `war_coalition0_mp` 3/0 (yeni); `field_war_siege0` 19/0 → 20/0; `faz86b_deal_engine` 109/27 → **120/22**. Eski genel matris parametreli dört maddeyi parametresiz deniyor ve 5 sahte FAIL üretiyordu; yerine olumlu + eksik parametre reddi testleri geldi. Kalan 22 FAIL p32'de de aynı. Öteki 201 paket aynı. |
| Node ilk tam koşu (düzeltmeden önce) | — | 205 · 6313 / 284: **`faz95d_war_preview` 10/9 FAIL** (eski son onay kancası yoktu) → düzeltildi |
| Chromium | 10 test PASS | **11/11 PASS**: war-coalition0 5/0 (yeni), field-war-siege0 3/0, war-goals0 5/0, rival-blocs0 9/0, pregame-galaxy0 10/0, bgreturn-galaxy0 14/0, share-galaxy0 8/0, sp-map-war 4/0, fed-fleet0-sp 4/0, mobile-hud0 4/0, event-ux0 11/0 |
| Chromium ilk tam koşu | — | field-war-siege0 **2/1**, war-goals0 **3/2** (yorgunluk / gerekçe kapalı bölümdeydi) → düzeltildi |
| MP8 | K 3/0, W 4/0, D 5/0, G 5/0, L 6/0, S 4/0, E 6/0, F 6/0, P 8/0 (tekrar) | **K 3/0, W 4/0, D 5/0, G 5/0, L 6/0, S 4/0, E 6/0, F 6/0, Q 8/0 (yeni), P 8/0, P açık pencere 8/0** |
| `browser-95e3.js` (eski 95E.3 tarayıcı testi, standart kümede değil) | kontrol a20d531: 13/10 | aday 13/10. Aynı 10 savaş tıklama FAIL'i p32'de de var (eski test eski önizleme varsayımıyla yazılmış); bu fazdan bağımsız. |
| `WAR_CENTER0=1 browser-mp73.cjs` (p18 isteğe bağlı senaryo) | — | **NOT RUN**. Senaryo eski önizlemenin "ilandan sonra davet" kutucuklarını (`data-war-invite`) ve eski Önce Koalisyon Hazırla zincirini kullanır. Bu akış istenen tek akışla bilerek değiştirildi; yerini MP8 Q aldı. Test silinmedi. |

Eşdeğerlik testleri `beta_war_center0_equivalence` ve `beta_fed_ai0_equivalence` p32'de de 1/5'tir (run-all dışında; değişmedi).

## 8. Yayın

| | |
|---|---|
| ZIP | `releases/stars-faz96h10p33.zip` (20 girdi: 19 runtime + `RELEASE-MANIFEST.json`) |
| ZIP SHA-256 | `c13dc7933863c08b9be3af0ada649adb23cd7b299f5551cb064db40761bf76bd` |
| ZIP CRC32 | `359D2E9A` (dosyanın tamamı) |
| Manifest SHA-256 | `0411fdedbda234c0f9f069fa1a2aae44c5ab492c543e5e7430ffb2dce74071fd` |
| Belirlenimlilik | `tools/package-release.py` iki kez → bayt bayt aynı |
| Doğrulama | ZIP çıkarılıp `python3 tools/verify-release.py --root <dizin>` → **DOĞRULANDI: 19 dosya; oyun build 96h10p33**; çalışma ağacında da aynı |
| Manifest | `parent_commit` `a20d531…`, `parent_zip_sha256` p32 ZIP `dd0de3f7…1765` |
| Koruma | `tests/helpers/war-coalition0-reviewed.{json,cjs}` (taban a20d531; 12 dosya, TAM METİN hunk) → `field-war-siege0-reviewed` zincirinin başına; hash gevşetilmedi, test silinmedi |
| MP dosyaları | `research/mp0/mp-core.js`, `research/mp6/client/guest-stars.js`, `research/mp71/client/mp71-dip.js`, `research/mp1/client/view.js`, `research/mp1/server/relay.js` ZIP dışında ayrı teslimdir; host ve istemci birlikte p33 olmalı |

## 9. Açık işler ve sınırlar

- **Hedefin bilinen destekçileri** yalnız gözlenen savaş / ittifak bağları ve istihbaratla gösterilir; gizli taahhütler görünmez (bilerek).
- **Rota uygunluğu** ilan edenin bilgisiyle tahmindir ("(tahmin)" yazılır); son karar ilan anında motorun erişim denetiminde.
- **Savaş başladıktan sonra yeniden davet** mevcut cepheye katılım isteğiyle yapılır (Savaş Merkezi → ASKERÎ DESTEK İSTE / anlaşma penceresi; Q6). Akış penceresinden ayrı bir "cepheye çağır" listesi yok.
- **AI hazırlık kararları değişmedi.** AI kendi hazırlığında `opts` yazmaz; davet yalnız insanın planından gelir.
- **"Federasyon kararı gerekiyor" gerekçesi** ayrı metin olarak yok. Federasyon savaş izni gerektiğinde motorun `warSupportGate` gerekçesi gösterilir.
- Fiziksel Android, canlı Render, LAN: **NOT RUN**. Kullanıcı kabulü yok; main'e birleştirme ya da dağıtım yapılmadı.
