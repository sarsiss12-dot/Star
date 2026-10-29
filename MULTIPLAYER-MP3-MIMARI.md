# STARS — MP.3 mimarisi: insan oyuncular arası gerçek diplomasi

Durum: **geliştirme prototipi, yayımlanmadı, sunucuya dağıtılmadı.**

- 19 runtime dosyası, build `96h10`, PWA `stars-v96h10`, Save8 ve `releases/stars-faz96h10.zip` değişmedi.
- Yeni diplomasi motoru yazılmadı. Her karar oyunun kendi fonksiyonlarından geçer:
  - `dealQuote`: maliyet, engel, normalleştirme;
  - `executeDeal`: kendi işlemi ve geri alması var;
  - `aiRespond` / `evalOffer`: AI kararı;
  - `treatyAlreadyActive`: süresi geçmiş antlaşma maddesi.
- Değişiklikler:
  - `research/mp0/mp-core.js`: komutlar, oturum teklif deposu, AI yönlendirmesi, görünüm;
  - `research/mp3/client/`: ortak diplomasi ekranı;
  - `research/mp2/client/guest-game.js`: DİPLOMASİ sekmesi;
  - `research/mp1/client/mp1-host.js`: host paneli ve host bildirimi;
  - relay izin listesi, join sayfası, Dockerfile, `.dockerignore`.

## 1. Kimlikler

| Alan | Anlamı | Kaynağı |
|---|---|---|
| `playerId` | bağlantının oyuncusu | MP.0 `assign`; paketteki `empire` yetki vermez (`forged-empire`) |
| `empireId` | oyuncunun devleti | yalnız host eşlemesi (`S.slots`) |
| `from` / `to` | teklifi gönderen / alan devlet | host kaydı; istemci `from` gönderemez (anahtar kümesi sabit) |
| karar sahibi | açık teklifte yalnız `to` | `respond`/`counter` → `r.to === bağlantının devleti`; değilse `not-recipient` |
| `by` | `human` ya da `ai` | AI'nın uzak insana yaptığı teklif `ai` olarak işaretlenir |

Taraf olmayan oyuncuya teklif "yok" görünür: `dipFind` taraf değilse `null` döner, kod `no-offer` olur. Gerçek bir kimlik ile hiç olmayan bir kimlik aynı yanıtı alır.

## 2. Teklif kaydı (oturum; Save8'e girmez)

```
{id, from, to, give[], want[], born, expires, round, prev, status, why, by, cost, finished?}
```

- `id`: host sayacı, oturumda tekil.
- `expires = born + DEAL_OFFER_LIFE` (540 oyun günü, tek oyunculuyla aynı). Süre oyun zamanıyla dolar; host durunca durur.
- `round`: 1'den başlar, her karşı teklifte +1. En fazla 6 tur (`DIP_ROUNDS`).
- `prev`: önceki turun `id`'si. Turlar zincir halinde bağlıdır.
- `status`: `pending`, `accepted`, `rejected`, `countered`, `expired`, `invalid`.
- `cost`: o anki `dealQuote(o).cost` (Etki; gönderen öder).
- Sınırlar:
  - oyuncu başına en fazla 8 bekleyen giden teklif (`too-many`);
  - aynı alıcıya aynı imzalı bekleyen teklif tekrar gönderilemez (`duplicate`, motorun `offerSignature`'ı);
  - sonuçlanmış kayıtlardan son 160'ı tutulur.
- **Kalıcılık:** depo host sayfasının belleğindedir.
  - Misafir sayfayı yenilerse ya da bağlantısı koparsa liste host'tan geri gelir.
  - Host sayfası kapanırsa bekleyen teklifler kaybolur.
  - Save8 şeması bilerek değiştirilmedi; MP kayıt/yükleme MP.4'te.

## 3. Komutlar (`COMMANDS`, MP.0 yönlendiricisi aynı)

Her komut aynı sırayla denetlenir:

- tam anahtar kümesi;
- `cid` tekrarı (önbellekten aynı yanıt) ve eski `seq` (`stale-seq`);
- `forged-empire`, `paused`, `not-started`;
- `why()`: salt okuma kural denetimi;
- `apply()`: motor çağrısı.

`apply` başarısızsa `txRestoreGraph` + RNG geri alınır. `executeDeal` ayrıca kendi işlemiyle geri alır.

| Komut | Şema | Yetki / kural | Uygulama |
|---|---|---|---|
| `quote` | `{kind,to,give,want}` | temas ve anlaşma yapabilen taraf (`no-target`) | **Salt okuma:** `dealQuote` → `{ok,cost,etk,life,reasons}`. İşlem, dergi, revizyon ve yayın yok |
| `offer` | `{kind,to,give,want}` | karşılıklı temas, taraf canlı / kriz tarafı değil / vahşi değil; `too-many`, `duplicate`; gönderim kapısı (aşağıda) | İnsan alıcı: bekleyen kayıt + alıcıya bildirim. AI alıcı: tek oyunculu `UI.dealSend` yolu (§5) |
| `respond` | `{kind,offer,action:'accept'\|'reject'}` | yalnız alıcı (`not-recipient`), `closed`, `expired`, taraflar geçerli (`invalid`); kabulde tam `dealQuote` (`quote` + izleyiciye göre süzülmüş gerekçe) | Ret: hiçbir kaynak taşınmaz. Kabul: `executeDeal(teklif)`; `false` → komut `rules`, hiçbir şey değişmez, teklif bekler |
| `counter` | `{kind,offer,give,want}` | yalnız alıcı, açık, süresi dolmamış, `round-limit`, temas; gönderim kapısı | Önceki tur `countered`, yeni tur `prev` ile bağlı, karar yeni alıcıya geçer |
| `withdraw` | `{kind,offer}` | yalnız gönderen (`not-sender`), açık | `invalid` ("Gönderen geri çekti"), alıcıya bildirim |

**Madde doğrulaması (`dipItems`):**

- İnsanın kurabileceği maddeler yalnız iki tür:
  - `{t:'res', r, v}`: `r` ∈ min, ene, yiy, ala, tuk, ara, etk; `v` tamsayı, 1…10 000 000;
  - `{t:'peace'}`.
- Fazladan anahtar, bilinmeyen kaynak, negatif ya da sınır dışı miktar, boş teklif ve 8'den fazla madde → `bad-params`.
- Diğer kanonik maddeler (ticaret paktı, saldırmazlık, ittifak, istihbarat, sevkiyat, teknoloji, sistem) MP.3.1 kapsamı. AI'nın uzak insana teklifinde bulunabilirler; o zaman motorun kendi kuralıyla uygulanırlar.

**Gönderim kapısı (`dipGate`):**

- Alıcı insansa yalnız GÖNDERENİN kendi yükümlülükleri denetlenir: stok, Etki, antlaşma kuralı. Karşı tarafın stoğu gönderene hiçbir yanıtla sızmaz. Örnek: B'den 9 999 999 Alaşım istemek gönderilebilir; B kabul ederse `dealQuote` reddeder.
- Alıcı AI ise tek oyunculu `dealSend` gibi tam `dealQuote.ok` aranır.
- Kabulde gönderenin eksiği yalnız genel bir satırla bildirilir: "Karşı taraf bu şartları şu an karşılayamıyor". Rakam yoktur.

## 4. Süpürme (`dipSweep`, her `publish()` başında)

| Durum | Sonuç |
|---|---|
| `G.day > expires` | `expired`, iki tarafa bildirim |
| taraf öldü, vahşi, kriz tarafı ya da karşılıklı temas yok | `invalid` |
| antlaşma maddesi artık yürürlükte (`treatyAlreadyActive`; ör. çapraz barış teklifinden biri kabul edildi) | `invalid` |

Süpürme Save8'e ve RNG'ye dokunmaz. Yalnız oturum deposunu ve bildirim listelerini değiştirir.

## 5. AI ile etkileşim

**İnsan → AI** (`dipSend`, AI alıcı) tek oyunculu `UI.dealSend` ile aynı sırayı izler:

1. `q = dealQuote(o)`
2. `r = aiRespond(AI, q.norm)`, ardından:
   - `kabul` → `executeDeal(q.norm)`. Başarısızsa komut `rules`; başarılıysa kayıt `accepted`.
   - `karsi` → AI'nın tek oyunculu karşı kartıyla aynı teklif kurulur: `{from:AI, to:insan, give:o.want, want:o.give + r.add}`.
     - Bu kart `dealQuote` ile denetlenir.
     - Geçerliyse insanın gelen kutusuna `by:'ai'` bekleyen tur olarak düşer. İnsan kabul eder ya da reddeder; AI onun yerine karar vermez.
   - `red` → kayıt `rejected` (AI'nın gerekçesi). Hiçbir şey değişmez.

Eşdeğerlik testi:

- Aynı dünyada ağ üzerinden insan → AI kabulü ile doğrudan `dealQuote → aiRespond → executeDeal` aynı Save8 baytlarını ve aynı `RND_STATE`'i verdi.

**AI → uzak insan:** `installGuards` sarmalayıcıları yalnız uzak insan devleti varken etkilidir.

- `aiNegotiate(a, b, …)`, `b` uzak insansa ve `a` AI ise `aiToHuman` çağırır:
  - teklif `dealQuote` ile geçerliyse `by:'ai'` bekleyen kayıt olur;
  - aynı imza tekrar edilmez; çift başına en fazla 3 bekleyen;
  - insana bildirim gider; AI'ya `{karar:'bekle', uygulandi:false}` döner.
  - AI'nın teklif üretme mantığı (ne zaman, ne önerir) değişmedi.
- `aiRespond(uzak insan)` → `bekle`. İnsan adına AI kararı verilmez (`stats.blockedAI`).
- Uzak insan iki taraftan biriyse ve öteki de insansa `aiNegotiate` hiçbir şey uygulamaz.
- AI→host ve AI→AI yolları dokunulmadan kalır. Host'a gelen AI teklifleri tek oyunculu `UI.aiOffer` / `DiplomaticInbox` yolundan gider.

**Bilinen fark:**

- Tek oyunculuda oyuncu AI karşı teklifini reddedince `ctrNo` ret hafızası yazar ve ilişki −5 olur. Bu kod `G.p`'ye özeldir.
- Uzak insan reddettiğinde bu ceza uygulanmaz.
- Bu bir AI dengeleme kararı olduğu için MP.3'te eklenmedi.

## 6. Görünüm (`viewFor` → `dip`)

`dipView(e)` yalnız `e`'nin taraf olduğu teklifleri gönderir (son 40):

- kimlik, taraf ve adları, maddeler (motorun `dealLabel`'ı, HTML etiketleri sökülmüş);
- tarih, tur, `prev`, durum, gerekçe, `by`, maliyet.

`contacts` yalnız karşılıklı temas kurulmuş ve anlaşma yapabilen devletleri içerir:

- `{id, n, col, h (insan mı), rel, bl (doktrin yasağı), war, peace (canPeace)}`;
- `life` (540) ve `rounds` (6) de gönderilir.

`dip` bir "tam değiştirilen" bölümdür: değişince bütünüyle yeniden gönderilir.

- Gün sayısı `clock.day`'den okunur. Bu yüzden `dip` her gün yeniden gönderilmez.
- Üçüncü oyuncunun paketlerinde A–B tekliflerinin kimliği, maddesi, miktarı ya da turu bulunmaz (vm ve tarayıcıda taranarak test edildi).

## 7. Bildirimler

`dipNotify(id, …)` bildirimi yalnız doğru oyuncuya gönderir:

- uzak insana `note()` ile: kişisel `log`; misafirde bildirim olarak görünür;
- host devletine `opts.hostNotify` ile: `mp1-host.js` → `say()`, host'un kendi günlüğü.

Uzak oyuncuların bildirimleri host günlüğüne düşmez (tarayıcıda `G.log` ile test edildi).

Bildirim olayları:

- yeni teklif;
- karşı teklif;
- kabul (iki tarafa);
- ret;
- geri çekme;
- süre doldu;
- geçersizleşti.

## 8. İstemci

**`research/mp3/client/dip-ui.js` (`MP3Dip.create`)** misafir sekmesi ve host paneli için tek ekran modülüdür. Motor yok, kural kopyası yok.

- Veri `dip` görünümünden gelir.
- Maliyet ve engel önizlemesi `quote` komutundan gelir.
- Komut sonucu `cid` ile kendi geri çağrısına döner.

**Misafir:** `guest-game.js` beşinci sekme DİPLOMASİ'yi ekler.

- Rozet, bekleyen gelen teklif sayısını gösterir.
- Bölüm değişince ve host bağlantısı gidip gelince ekran yeniden kurulur.
- Yazarken ya da seçim yaparken ekran yeniden kurulmaz.

**Host:** küçük MP panelinde DİPLOMASİ düğmesi (rozetli) tam ekran paneli açar.

- Yalnız insan oyuncular listelenir.
- Komut `host.local()` ile misafirle AYNI `execute()` yolundan geçer: yetki, tur, süre, kaynak ve Etki denetimi aynıdır.
- Host başkasının teklifine karar veremez (`no-offer`).
- Tek oyunculu diplomasi paneli değişmedi.
