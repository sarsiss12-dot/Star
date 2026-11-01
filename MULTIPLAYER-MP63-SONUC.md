# STARS — MP.6.3: akıllı duraklatma + ortak savaş ganimeti paylaşımı + federasyon / vasallık kararları + statüko kalıcılığı

Durum: **geliştirme sürümü.** Multiplayer'da sıradan pencereler artık oyunu durdurmaz. Karar pencereleri oyunu yavaşlatır ya da duraklatır, manuel duraklatma her zaman önceliklidir. Ortak savaştan sonra toprak paylaşımı uzak insanlarla, gerçek STARS penceresinden yapılır. Federasyonun ve vasallığın eksik kararları motorun kendi işlevlerine bağlandı. Statüko teklifleri kayıt/yüklemeden sonra da sürer.

Yeni hız motoru, yeni paylaşım algoritması, yeni federasyon ya da vasallık motoru yazılmadı.

- Taban: MP.6.2 `6e5d4d1` (PR #20). PR #17 → #18 → #19 → #20 zinciri açık; hiçbiri merge edilmedi.
- Değişmeyenler:
  - 19 runtime dosyası, build `96h10`;
  - Save8 şeması ve `releases/stars-faz96h10.zip`.
- Yeni ZIP yok.

## 1. Akıllı duraklatma

### Kök neden

Tek oyunculu motorda üç yol hızı değiştiriyor:

- `UI.openModal` → `modalPrevSpeed = G.speed; setSpeed(0)` (her pencere);
- `UI.notify(item.pause)` → `prePause = G.speed; setSpeed(0)`;
- `UI.closeModal` → `back = prePause || modalPrevSpeed || 1`.

MP.6.1'de host'un G.speed'i ortak hız olduğundan host'un açtığı her pencere herkesi durduruyordu. Kapanışta geri yüklenen hız da tutarsızdı: eski bir `prePause`, ağ kopması sonrası yanlış hız, ya da başka oyuncunun manuel duraklatmasının ezilmesi.

### Çözüm

Yeni modül `research/mp63/client/mp63-pause.js` (`StarsPause`) küçük bir **neden kaydı** tutar; hız motoru değildir:

```
uygulanan hız = min(want, nedenlerin üst sınırları)
```

- **`want`**: son AÇIK hız seçimi. Kaynakları: MP.6.1 `speed` komutu, host'un hız düğmesi, oyunun başlaması, kayıttan devam. 0 = manuel duraklatma. Pencereler, arka plan ve ağ `want`'a dokunmaz.
- **Nedenler** (ad → üst sınır), birbirini silmez:
  - `background` → 0;
  - `offline` → 0 (MP.5 güvenli duraklatma);
  - `engine` → 0 (`G.over`);
  - karar penceresi `dec:<not uid>` → 0 ya da 1.
- **Karar belirteci** iki hâlde olur:
  - `pending`: bildirim kutuda bekliyor;
  - `open`: karar penceresi ekranda.
  - Aynı not iki kez gelirse belirteç birikmez. Pencere kapanınca yalnız `open` belirteçler düşer; küçültülen not yeniden `pending` olur.
  - Açık bir hız komutu, bekleyen belirteçleri "görüldü" sayar (tek oyunculudaki oynat düğmesi gibi). Ekrandaki karar penceresi ise kapanana dek sürer.

### Host sayfasına bağlama (`mp1-host.js`)

Oyun başladıktan sonra motorun pencere ve bildirim kaynaklı `setSpeed` çağrıları uygulanmaz. Bu çağrılar `act`, `openModal`, `closeModal`, `notify` ve `openNote` içinden gelenlerdir; hız politikadan gelir. Bunların dışındaki doğrudan `UI.setSpeed` çağrıları açık seçim sayılır (oyun başlangıcı, kayıttan devam, test yardımcıları).

**Karar pencereleri:**
- tek oyunculuda duraklatan bildirimler: olay, zincir, anomali, kriz, konsey, federasyon oyu, darbe, statüko;
- savaş bildirimleri (`warstart`, `wardec`).

**Duraklatma tercihi:**
- **Savaş bildirimleri** tek oyunculu "Savaşa katılınca duraklat" ayarını (`WAR_PAUSE_ON`) izler: açıksa duraklatır, kapalıysa en düşük etkin hız (1×).
- **Öteki karar pencereleri** host'un MP ayarını izler: MP çubuğunda "Karar pencerelerinde: 1× YAVAŞLAT / DURAKLAT" (`localStorage mp63:decisionPause`, varsayılan yavaşlat).

**Arka plan ve ağ:** MP.5'teki `bgSpeed`/`netSpeed` kaydet-geri yükle mantığı kaldırıldı; yerine nedenler kullanılıyor. Lobi duraklatması (`setPaused`) ve komut reddi aynen sürüyor. `MP1Host.netSpeed` ve `bgSpeed` uyumluluk için okunur alan olarak kaldı.

### Misafir tarafı

- Misafirin kendi pencereleri yereldir; host'a hiçbir şey göndermez (misafir simülasyon yürütmez).
- Bildirim nedeni gösterir:
  - "Host bir karar penceresinde — oyun 1× yavaşladı";
  - "Host bağlı değil";
  - tutulan seçim için: "… hızı 3× yaptı — karar penceresi kapanınca uygulanacak (şimdi 1×)".

### Protokol (`mp-core.js`)

- `opts.speedInfo` verilirse `speed` komutunun `same` denetimi ortak hıza (`want`) göre yapılır.
- `speed` iletisinde `want`/`hold` alanları ve artan `n` bulunur. Misafir küçük `n`'yi yok sayar; böylece eski hız iletisi son komutu ezmez.
- Kayıt paketi (`session.speed`) ortak hızı yazar, geçici 1×'i değil.
- Politika verilmezse MP.6.1 davranışı aynen sürer (Node testi).

### Uzun süre açık karar penceresi

Oyun 1×'te akarken kararın geçerliliğini host'ta motorun kendi kapıları yeniden doğrular:

- olay seçimi dünya kimliği ve "çözüldü" bayrağıyla;
- federasyon oyu oy jetonuyla;
- statüko penceresi savaş/taraf durumuyla;
- anlaşma ve paylaşım pencereleri kendi jeton ya da damgalarıyla.

MP komutları da aynı motor kapılarından geçer.

## 2. Ortak savaş ganimeti paylaşımı

### Motor bulgusu

`settlementSubmit`, önerenden ve **devlet 0'dan** başka her ortağın oyunu `settlementOpinion` (AI değerlendirmesi) ile yazıyordu. Bu yüzden uzak insan adına otomatik EVET/HAYIR oluşuyordu. Kontrol testi bunu gösterir: korumasız motor uzak insana oy yazar.

`installGuards` motorun metnini tek koşulla genişletir: `id===0 || __mpHumanVoter(id)`. Uzak insan yokken davranış, Save8 ve RNG aynıdır; `settlementOpinion` RNG tüketmez.

Diğer bulgular:
- `settlementAgendaTick` insan katılımlı teklifi zaten kendisi uygulamıyordu.
- Uzak insan önerici olmaz, çünkü `e.ai === false`.

### Komutlar

Hepsi motorun işlevleridir; 180 gün ve oybirliği motorda kalır.

- `settleQuote` (salt okuma) → `settlementPreview`;
- `settleSubmit` → `settlementSubmit`:
  - taslak damgası istemciye yalnız özet olarak gider (`fnv`);
  - host damgayı yeniden türetir; eski taslak `stale` ile reddedilir;
- `settleVote` / `settleApply` / `settleWithdraw` → motor.

**Kimlik oturumdan gelir.** Kimse başkası adına oy veremez. Aynı oy ya da ikinci uygulama motor tarafından reddedilir. Sefere katılmayan oyuncuya teklif "yok" (`no-offer`).

### Görünüm `settle` (MP.2 görünümü, yalnız katılımcıya)

- Sefer başına son teklif ve taslak açılabilen seferler gönderilir.
- Satır, pay ve katkı puanları motorun önizlemesindendir.
- Görünmeyen toprak satırı maskelenir: anahtar `h<n>`, sistem ve gezegen kimliği yok. Host bu satırı gerçek satıra çevirir. Motor bu durumda kabulü zaten reddeder ("keşif gerekli").
- Ham damga (sefer kaydının tamamı, devletlerin mizacı) gönderilmez.

### Bildirim (`settleSweep`)

Uzak insan kendi listesinde görür: önerildi / onaylandı / reddedildi / süresi doldu / geçersiz / geri çekildi / tamamlandı. Host'a da host bildirimi gider. İlk geçiş sessizdir, böylece kayıttan devamda bildirim yağmaz.

### Misafirde gerçek STARS penceresi (`UI.openSettlement`)

- `settlementState/Visible/Offer/ApplyQuote` host'un görünümünden okunur. Teklif nesneleri kimlikle kalıcıdır, çünkü onay düğmeleri `settlementOffer(id) === o` denetler.
- `settlementPreview` host'un motorundan gelir (önbellekli). Yanıt gelince pencere yeniden çizilir.
- Sun / oy / uygula / geri çek MP komutuna iner.
- Taslak girişi: tek oyunculuda savaş katkı kaydından açılır. Aynada sefer kaydı olmadığı için diplomasi merkezindeki "Ortak savaş paylaşımları" bölümüne host'un taslak listesi aynı `shareOpen` düğmesiyle eklenir.

## 3. Federasyon

Yeni komut `fedMotion`, motorun önerge yolunu kullanır (`canFedMotion` / `proposeFedMotion`). Kapsadığı önergeler: ihraç, tür reformu, anayasa / oy rejimi, başkan seçimi, mevcut savaşa katılma, ortak savaş izni. Üye kabulü MP.3.1 `fedInvite` ile kalır.

- **`fedExecute`** → `executeFedDecision`. Yalnız önerici ya da başkan uygular (motor).
- **`fedGrant`** → `canGrantFed` / `grantFed`. Yalnız başkan; kendi kaynağından.
- **Oy rejimi değişmedi:**
  - anayasa ve reform ≥ %75;
  - yeni kararlar federasyonun kuralıyla.
  - Testte B HAYIR derken 3/4 ile kabul edildi; oybirliği zorunlu değil.
- **İnsan oyu:**
  - MP.3.1 koruması (`fedOpenVote` / `startFedVote`) sürüyor.
  - Önerici dahil insanın oyu otomatik değildir; insan oyunu kendisi verir (gelen kutusu, `fedVote`).
- **GERÇEK kuruluş:** MP.6.2'de motor "Bilinen yardım/iş birliği rotası yetersiz" diyordu.
  - Neden: AI'nın kurucunun topraklarına dair gözlem kaydı (`e.aiIntel.systems`) yoktu. `aiFedWilling` bu kayıtla rota arar.
  - Fikstür bu kaydı motorun kendi biçiminde kurar: sahip, savunma, koloni, başkent, gün.
  - Sonrasında kuruluş motorun `foundFederation`'ıyla, gerçek pencereden yapılır: B + bağımsız AI müttefikleri 2 ve 4.
- **Misafirde kuruluş uygunluğu:** host'un motor kararıyla gösterilir (`fedFoundQuote`, salt okuma), çünkü AI'nın kabulü aynada hesaplanamaz.

## 4. Vasallık

- **Mevcut komutlar** (MP.3.1 `vassalOffer` / `vassalReply`), uygun fikstürlerle doğrulandı:
  - himaye talebi (`seek`);
  - yeniden müzakere (`renew`);
  - barışçıl bağımsızlık (`release`).
- **Süreler motorun ve değişmedi:**
  - 12 aylık soğuma (`finished > day − 360`);
  - 24 aylık yeniden müzakere (`renegotiate = 24`).
  - Önce ret test edilir. Zaman geçişi sözleşme ve müzakere tarihleri geriye alınarak kurulur: sözleşme 25 ay önce imzalanmış gibi.
- **Yeni komut `supIndep`** → `canSupportIndep` / `supportIndep`:
  - %40 sızma motorun `rnd()`'siyle.
  - Motor yalnız devlet 0'a bildiriyordu. Artık uzak insan söz veren kendi sonucunu, uzak insan senyör de sızan görüşmeyi kendi listesinde görür.
- **Misafirde giriş kapıları** (`canSeekProtection` / `canDemandVassal`): MP.3.1 polView'daki host kararıyla gösterilir. Güç oranı aynada kabuktan hesaplanamaz.
- **Gizlilik:** üçüncü taraf, başkalarının sözleşmesini ve müzakeresini görmez (`polView.vas` boş). Vasal öfkesi formülüne dokunulmadı.

## 5. Statüko teklifleri

- **MP.4 paketi:** `diplomacy.sq` isteğe bağlı alandır.
  - Teklif yoksa paket MP.6.2 biçimiyle birebir aynıdır; eski kayıtlar aynen yüklenir.
  - `validatePackage` alanları denetler: `expires = born + 180` ve aynı çiftte tek bekleyen teklif.
  - Bütünlük özeti yeniden hesaplansa bile uzatılmış süre reddedilir.
- **Yükleme:** teklifler geri gelir. Yükleme gününde süresi dolmuşsa `expired` olur; süre yapay uzamaz.
- **Yanıt:** mevcut `statusQuoReply` denetimlerinden geçer (savaş sürüyor mu, `canStatusQuo`). Bir kez işlenir; ikinci yanıt "yok".

## 6. Yerel arayüz ↔ host kararı denetimi

Aynası kabuk olan verilere dayanan düğme kapıları host kararını kullanır:

- MP.6.2: statüko, federasyona başvuru, üye kabulü;
- MP.6.3 yeni: federasyon kuruluşu, himaye talebi / boyun eğdirme, paylaşım penceresinin bütün durumu.

Misafire yalnız işlemin mümkün olup olmadığı, nedeni ve görmeye hakkı olan veri gider. AI'nın gizli değerlendirmeleri, stoklar ve başkalarının sözleşmeleri gitmez.

## 7. Testler (bu faz)

| Test | Sonuç |
|---|---|
| `tests/mp63_pause_test.js` (politika + mp-core hız protokolü) | 7/7 PASS |
| `tests/mp63_settle_test.js` (paylaşım: koruma kontrolü, gündem, gizlilik, oy/uygula, öneri/stale, ret/geri çekme, maske, MP.4) | 8/8 PASS |
| `tests/mp63_polvas_test.js` (kuruluş, oy, anayasa, reform/başkan, ihraç, ortak savaş, hibe, himaye, yenileme, bağımsızlık, destek) | 11/11 PASS |
| `tests/mp63_sq_test.js` (statüko kalıcılığı, bir kez, süre, geriye uyum) | 4/4 PASS |
| `tests/browser-mp63.cjs` (A1–A8 duraklatma, B1–B4 paylaşım, C1–C3 federasyon, D1 himaye) | sonuç bölümünde |
| `tests/browser-mp4.cjs` (+ statüko: gerçek host süreci kapanış → dosyadan açılış) | 13/13 PASS |

Tam regresyon ve Chromium sonuçları: `research/mp63/evidence/REGRESYON.md`.

## 8. Bilinen sınırlar

- **Paylaşım (tarayıcı):** ret ve geri çekme yalnız Node'da test edildi. Tarayıcıda öneri, oy, uygulama ve ikinci uygulama reddi doğrulandı.
- **Vasallık (tarayıcı):**
  - Tarayıcıda yalnız himaye talebi + kabul doğrulandı.
  - Yenileme, barışçıl bağımsızlık ve bağımsızlık desteği Node'da doğrulandı.
  - Bağımsızlık desteği misafir arayüzünde motor işlevine bağlı, ama tarayıcıda dokunularak test edilmedi.
- **Federasyon (tarayıcı):** ihraç, reform, başkan seçimi ve ortak savaş kararı / uygulaması yalnız Node'da test edildi. Tarayıcıda kuruluş, oy rejimi önergesi + oy ve hibe doğrulandı.
- **Sızma bildirimi:** senyörün ilişkisinin düşmesinden anlaşılır. İlişki zaten −100 ise sızma bildirilmez (motor değeri sınırlar).
- **Fiziksel cihaz / ağ:** fiziksel Android, gerçek internet ve LAN testleri yapılmadı (NOT RUN).
