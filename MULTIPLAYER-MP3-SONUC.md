# STARS — MP.3 sonuç raporu: insan oyuncular arası gerçek diplomasi

Dal: `claude/stars-mp3-diplomacy`. Taban: `main` `1acf62dac1bffbf5aeadf6eb79b69a4347a0a56a` (96H.10 + MP.0 + MP.1 + MP.1.1 + MP.2).

**Karar: yayımlanmayan geliştirme prototipi.**

- Aynı galakside iki insan gerçek kaynak takas ediyor: teklif, kabul, ret, karşı teklif, geri çekme ve barış önerisi var.
- Kararlar host'un gerçek motorunda uygulanıyor (`dealQuote`, `executeDeal`, `aiRespond`).
- AI, insanın yerine karar vermiyor.
- Runtime, build `96h10`, PWA `stars-v96h10`, Save8 ve kanonik ZIP değişmedi.
- Gerçek internet sunucusu yok. Fiziksel Android NOT RUN.

## 1. Başlangıç doğrulaması

| | Sonuç |
|---|---|
| `main` HEAD | `1acf62d…` (ağacı MP.2 dalının son commit'i `544d2b7` ile aynı) |
| ZIP | SHA-256 `78e76d16…6be6d0`, dosya CRC32 `cf97cc3a`, 20 girdi, `testzip` temiz |
| Manifest | ZIP içi = çalışma ağacı; 19 SHA eşleşiyor; build 96h10, PWA stars-v96h10 |
| `verify-release.py --root <ZIP çıkışı>` | DOĞRULANDI (başta ve sonda) |
| Runtime farkı (`git diff origin/main`: 19 dosya + manifest + releases) | boş |

## 2. Motor incelemesi: yeniden kullanılanlar ve G.p / devlet 0 bağımlılıkları

| Motor parçası | MP.3'te kullanım | Tek oyuncuya bağlı kısım ve çözüm |
|---|---|---|
| `normalizeDeal`, `dealValidity`, `dealQuote` | önizleme (`quote`), gönderim kapısı, kabul ön denetimi | Gerekçeler `veren.name + ' → '` önekli. Önek ile karşı tarafın stok satırları gönderene süzülür (`dipGate`/`dipReasons`) |
| `executeDeal` | kabul (insan–insan, insan→AI, AI→insan) | Kendi işlemi var (`dealTxBegin`/geri alma). Arşiv denetimi (`DiplomaticInbox.findDeal`) yalnız `to===0 && from!==0` tekliflerde çalışır, uzak insan tekliflerine dokunmaz |
| `offerSignature` | aynı teklifin tekrarını engelleme | — |
| `dealExpired`, `DEAL_OFFER_LIFE` | ömür (540 oyun günü) | — |
| `treatyAlreadyActive` | yürürlüğe girmiş antlaşma teklifi geçersiz | — |
| `canPeace` / `makePeace` | barış maddesi, `applyItems` üzerinden | `makePeace` içindeki `say` yalnız devlet 0 için (host'un kendi günlüğü; doğru) |
| `aiRespond` / `evalOffer` | insan → AI | Tek oyunculu `UI.dealSend` sırası birebir izlendi |
| `aiNegotiate` | AI → uzak insan | Devlet 0 için erken dönüyor (host'a AI teklifleri `UI.aiOffer` / `DiplomaticInbox` yolunda kalıyor). Uzak insan için `aiToHuman` yönlendirmesi eklendi |
| `UI.dealSend` karşı kartı, `ctrNo` ret hafızası ve ilişki −5 | AI karşı teklifi uzak insanın kutusuna düşüyor | Ret hafızası `G.p`'ye özel. Uzak insan için **uygulanmadı** (AI dengeleme kararı; MP.3.1'de karar verilmeli) |
| `inbox.js` `DiplomaticInbox` | değişmedi; yalnız host (devlet 0) | Uzak insanların kutusu çekirdekte oturum deposu (Save8 dışı) |
| `isPurifier` (izolasyonist doktrin) | motor kuralı olarak geçerli | Seed 11'de 3 numaralı devlet izolasyonist. Bu devleti alan insan hiçbir anlaşma yapamıyor (motor kuralı). Ekranda "doktrin anlaşmayı yasaklıyor" yazar. Testler seed 22'de |

## 3. Değişen dosyalar

- **Çekirdek** — `research/mp0/mp-core.js`:
  - `quote`, `offer`, `respond`, `counter`, `withdraw` komutları;
  - `execute()`: misafir ve host için ortak yol;
  - `local()`: host komutu;
  - salt okuma komut (`ro`);
  - oturum teklif deposu, süpürme;
  - `dip` görünümü;
  - `aiToHuman`; `aiNegotiate` ve `aiRespond` korumaları;
  - `hostNotify` kancası.
- **Yeni:** `research/mp3/client/dip-ui.js`, `research/mp3/client/mp3.css`, `research/mp3/README.md`, `research/mp3/evidence/` (18 PNG + `mp3-results.json`).
- **MP.2 istemcisi** — `guest-game.js`:
  - DİPLOMASİ sekmesi ve rozet;
  - sonuç → geri çağrı (`cid`);
  - kişisel bildirim gösterimi;
  - host gidip gelince yeniden çizim; bağlantı kopunca yanıtsız komutun kilidini açma.
- **MP.1 istemcisi:**
  - `mp1-host.js`: host paneli ve `hostNotify` → `say`; küçük panel tek satır kalıyor;
  - `join.html`: iki yeni dosya.
- **Relay ve dağıtım:**
  - `relay.js`: izin listesi (+2) ve host sayfası enjeksiyonu;
  - `Dockerfile` ve `.dockerignore`: +`research/mp3/client/`.
- **Testler:**
  - yeni: `tests/mp3_core_test.js`, `tests/browser-mp3.cjs`;
  - değişen beklentiler (yalnız yeni dosya ve sekme eklendiği için; hiçbir assertion gevşetilmedi ya da silinmedi):
    - `tests/mp1_relay_test.js`: host sayfası enjeksiyon metni ve izinli dosyalar;
    - `tests/browser-mp1.cjs`: misafir betik listesi;
    - `tests/browser-mp2.cjs`: sekme listesi.
- **Belgeler:** `MULTIPLAYER-MP3-MIMARI.md`, `MULTIPLAYER-MP3-DIPLOMASI.md`, bu dosya, `PROJE-DURUMU.md`, `CLAUDE.md`.

## 4. Test sonuçları

### `tests/mp3_core_test.js` — 11/11 PASS (Node vm, gerçek motor)

Dünya: seed 22, orta, 5 AI; A=1, B=3, C=4 insan.

- 1–3 teması 2. ayda, 1–5 teması 5. ayda keşifle kuruluyor.
- C'nin A ve B ile teması yok.

1. **İnsan–insan takas:**
   - teklif oluşturmak hiçbir şey taşımadı;
   - kabul, doğrudan `executeDeal` çağrısıyla **aynı Save8 ve aynı RND_STATE**'i verdi;
   - kaynaklar tam olarak el değiştirdi;
   - ikinci kabul `rules:closed`.
2. **Karşı teklif:**
   - 100 yerine 60 Alaşım;
   - eski tur kapandı (`rules:closed`);
   - yalnız alıcı karar verebilir (`not-recipient`);
   - yalnız yeni şartlar uygulandı.
3. **Ret ve yarış:**
   - ret hiçbir şey taşımadı;
   - aynı anda kabul + ret: `ok` + `rules:closed`;
   - tekrarlanan `cid` bir kez uygulandı; eski `seq` reddedildi;
   - geri çekmeyi yalnız gönderen yapabildi.
4. **Yetki ve doğrulama** (her redde Save8 ve RNG aynı):
   - üçüncü taraf;
   - sahte devlet;
   - bozuk madde (negatif, bilinmeyen kaynak, sınır üstü, ek anahtar, boş);
   - kendine, vahşi devlete ya da temassız devlete teklif;
   - kendi stoğu ya da Etki yetersiz;
   - B'nin stoğu sızmıyor (9 999 999 Alaşım istemek gönderilebilir, kabulde `rules:quote`);
   - kabul anında gönderen stoğu düşmüş: genel gerekçe;
   - süre doldu;
   - host duraklatılmış.
5. **Önizleme (`quote`):**
   - maliyet `dealQuote` ile aynı, barışta `DEAL_TREATY_COST.peace`;
   - durum, dergi, revizyon ve yayın değişmedi;
   - temassız devlete `no-target`.
6. **Atomiklik:**
   - `executeDeal` içinde `after:items`, `after:cost`, `after:goodwill`, `after:recalc` noktalarında hata;
   - her seferinde Save8 ve RNG aynı, teklif bekliyor;
   - sonra kabul bir kez uygulandı.
7. **Barış:**
   - önermek savaşı bitirmedi;
   - kabul `makePeace`'i `executeDeal` üzerinden uyguladı;
   - maliyet önerene yazıldı;
   - çapraz barış teklifi `invalid` oldu (`rules:closed`);
   - düşük Etki'de gönderilemedi.
8. **İnsan → AI:**
   - kabul, tek oyunculu `dealQuote → aiRespond → executeDeal` ile aynı Save8 ve RNG'yi verdi;
   - tek taraflı istek: AI reddetti, hiçbir şey değişmedi.
   - **Karşı teklif yolu doğal durumda tetiklenmedi:** AI ek kaynak isteyebilmek için karşı tarafın stoğunu bilmeli (`aiKnownResources`: istihbarat ≥3).
     - Bu yol AÇIKÇA fikstürle (istihbarat 3) sınandı.
     - AI karşı teklifi insanın kutusuna `by:'ai'` olarak düştü; insan kabul edince uygulandı.
     - Bu doğal AI davranışı sayılmadı.
9. **Doğal AI → insan** (fikstürsüz, gerçek AI turları):
   - 2. ayda AI 5'in insana teklifi (ticaret paktı + kaynak) insanın kutusuna düştü;
   - AI karar vermedi;
   - insan kabul etti ve `executeDeal` uyguladı.
10. **Gizlilik (vm):**
    - C'nin paketlerinde A–B teklif kimliği, miktarı (137/71/43) ve turu yok;
    - C'nin gerçek kimlikle ve olmayan kimlikle aldığı yanıt aynı.
11. **Tek oyunculu:** korumalar kurulu, uzak insansız lobi host'u 120 günde düz motorla aynı Save8 ve RNG.

### `tests/browser-mp3.cjs` — 12/12 PASS, sayfa hatası 0

Kurulum:

- 4 ayrı Chromium süreci: host 915×412, A 390×844, B 360×800, C 412×915;
- gerçek dokunma olayları ve klavye;
- yerel relay.

Arayüz adımları ardışık olduğundan, temas doğal kurulduktan sonra insanların temel kaynakları açık fikstürle en az 3000'e çekildi. Etki doğal bırakıldı. Motor yolu değişmedi; fikstürsüz Save8 eşitliği vm testinde.

| # | Vaka | Sonuç |
|---|---|---|
| 1 | Gerçek lobi → oyun, 3 misafir; temas host zamanıyla keşiften; misafirde motor yok (`G`, `dealQuote`, `executeDeal`, `aiRespond` tanımsız); beş sekme | PASS |
| A | İnsan–insan takas (ayrıntı aşağıda) | PASS |
| B | Karşı teklif: B kutusundan KARŞI TEKLİF; taslak ters şartlarla dolu; 100→60 Alaşım; A tur 2'yi görüp kabul ediyor; eski tur `rules:closed`; kendi turunu kabul `not-recipient`; yalnız yeni şartlar | PASS |
| C | Ret ve yanlış dokunma (ayrıntı aşağıda) | PASS |
| D | AI ↔ insan (ayrıntı aşağıda) | PASS |
| E | Gizlilik, 3 oyuncu (ayrıntı aşağıda) | PASS |
| F | Güvenlik ve atomiklik ağ üzerinden (ayrıntı aşağıda) | PASS |
| — | Barış (ayrıntı aşağıda) | PASS |
| — | Host paneli (ayrıntı aşağıda) | PASS |
| G | 5 görünüm (ayrıntı aşağıda) | PASS |
| — | Bağlantı kopması ve geri gelme (ayrıntı aşağıda) | PASS |
| H | Performans (§6) | PASS |

Vaka A — insan–insan takas:

- A, hazır düğmeyle 100 Mineral ve klavyeyle 50 Alaşım hazırladı.
- GÖNDER önizlemesiz kapalıydı.
- ÖNİZLE: Etki 0, 540 gün, "Engel yok".
- Gönderim host durumunu değiştirmedi.
- B'de rozet "1" göründü.
- KABUL ET → onay penceresi (EVET ilk anda kapalı) → kaynaklar tam olarak el değiştirdi.
- İkinci kabul `rules:closed`. Uzak bildirimler host günlüğüne düşmedi.

Vaka C — ret ve yanlış dokunma:

- Onay penceresinin arka planına alttaki KABUL düğmesinin konumundan dokunuldu, hemen ardından hayalet dokunuş yapıldı: komut gitmedi, teklif bekliyor kaldı.
- Ret host durumunu değiştirmedi; A bildirimi aldı.
- B geri çekemedi (`not-sender`); A geri çekti.

Vaka D — AI ↔ insan:

- A → AI 5 (300 Mineral ↔ 10 Enerji): `kabul`, kaynaklar taşındı.
- Tek taraflı istek: `red`, host durumu aynı.
- Doğal AI → insan teklifi 2 ayda geldi (pakt + kaynak). İnsanın GELEN'inde "AI teklifi" olarak göründü, AI karar vermedi; insan arayüzden kabul etti.

Vaka E — gizlilik, 3 oyuncu:

- A–B teklifi ve B'nin karşı teklifinin hiçbir kimliği ya da miktarı (137/71/43) C'nin aldığı **herhangi bir pakette** yok.
- C'nin `dip` görünümünde teklif yok, A ve B rehberde yok.
- C'nin gerçek kimlikle ve olmayan kimlikle aldığı yanıt aynı (`no-offer`). Temassız devlete `quote` → `no-target`.

Vaka F — güvenlik ve atomiklik, ağ üzerinden:

- 9 bozuk istek ve sahte devlet reddedildi; host durumu aynı; HTML yükü çalışmadı.
- Aynı anda kabul + ret: tam biri uygulandı.
- Tekrarlanan `cid` ve eski `seq` hiçbir şey uygulamadı.
- Kabul anında gönderen stoğu düşük: `rules:quote`, genel gerekçe, rakam yok, durum aynı, teklif bekliyor.
- `executeDeal` içine hata (`after:items`): `rules`, durum aynı; sonra kabul bir kez uygulandı.
- Düşük Etki'de barış önizlemesi Etki engelini gösterdi, GÖNDER kapalı, host da reddetti.
- Süre oyun zamanıyla doldu: iki tarafta "süresi doldu", kabul `rules:closed`.
- Duraklatılmış host: `paused`, durum aynı.

Barış (arayüzden):

- BARIŞ ÖNER, host'tan maliyet 30 Etki gösterdi.
- Bekleyen teklif savaşı bitirmedi.
- B kabul etti: savaş iki yönde bitti, Etki önerenden düştü.
- B'nin çapraz barış teklifi `invalid` oldu.

Host paneli:

- Yalnız insan oyuncular listelendi (host AI 5 ile temaslı ama listede değil).
- Host → C takası hazırlandı, önizlendi, gönderildi; C arayüzden kabul etti; kaynaklar taşındı.
- Host bildirimi host günlüğüne düştü.
- C → host teklifinde rozet "1"; host panelden onaylayıp kabul etti.
- Host A–B teklifine karar veremedi (`no-offer`).
- 915×412 düzen ölçütleri geçti.

Vaka G — 5 görünüm (360×800, 390×844, 412×915, 844×390, 915×412):

- DEVLETLER, GELEN, GÖNDERİLEN, GEÇMİŞ, taslak ve onay penceresi: taşma yok, ≥44 px, yazı ≥11 px.
- Miktar alanı `inputmode=numeric`; klavye benzetiminde (görünür alan %55) alan görünür ve odakta kaldı.

Bağlantı kopması ve geri gelme:

- B sayfayı yeniledi: gelen kutusu host'tan geri geldi.
- Host'un ağı kesildi: B'de "Host bağlı değil" ve bütün işlem düğmeleri kapandı; komut `host-yok`.
- Host geri bağlandı: düğmeler açıldı, kabul uygulandı.

### Regresyon

| Test | Sonuç |
|---|---|
| Tam Node regresyonu (`run-all`, 3 işçi) | **147 paket, 6172 PASS / 3 FAIL** (yeni `mp3_core_test` 11). 3 FAIL: bilinen `faz95d_identity_test.js` seed 11/99/404; yeni FAIL yok |
| `mp0_core_test` | 11/11 PASS |
| `mp1_lobby_core_test` | 7/7 PASS |
| `mp1_relay_test` | 14/14 PASS |
| `mp1_actor_vision_test` / `mp1_actor_vision_b_test` | 2/2, 2/2 PASS |
| `mp11_online_test` | 9/9 PASS |
| `mp2_core_test` | 7/7 PASS |
| `browser-96h10.cjs` | 27/27 PASS |
| `browser-mp0.cjs` | 20/20 PASS |
| `browser-mp1.cjs` (5 Chromium) | 22/22 PASS |
| `browser-mp11.cjs` (TLS vekil) | 10/10 PASS |
| `browser-mp2.cjs` | 14/14 PASS |
| `browser-mp3.cjs` | 12/12 PASS |
| ZIP / CRC / SHA / manifest | DOĞRULANDI, değişmedi |

İlk koşuda bulunan iki sorun düzeltildi:

- `browser-mp1`: host'un küçük paneli DİPLOMASİ düğmesiyle iki satıra çıkmıştı. Düğme aynı satıra alındı; tek satır kuralı (≤64 px) korunuyor.
- `browser-mp2`: beklenen sekme listesine DİPLOMASİ eklendi.

## 5. Save8 ve RNG

- Teklif deposu Save8'e girmiyor; şema değişmedi.
- Ağdan kabul = doğrudan `executeDeal` (aynı bayt, aynı RNG).
- İnsan → AI = tek oyunculu `dealSend` yolu (aynı bayt, aynı RNG).
- Reddedilen, ret edilen ve geri alınan her komut Save8 ve RNG'yi değiştirmedi.
- Tek oyunculu ve AI–AI diplomasi: uzak insansız MP korumalarıyla 120 gün düz motorla aynı.
- 19 runtime dosyası değişmedi; tam Node regresyonu tabanla aynı (bilinen 3 FAIL).

## 6. Performans (yerel relay, başsız Chromium, 4 insan)

| Ölçüm | Değer |
|---|---|
| Teklif gönder → sonuç (istemci ölçümü) | 19 ms |
| Kabul → sonuç | 17 ms |
| Host `publish()` (3 misafir, 27 teklif kaydı) | medyan 4,6 ms, p95 5,7 ms |
| `dip` bölümü (A / B / C) | 5,9 KB / 5,6 KB / 1,6 KB |
| `dip` içeren delta (A) | medyan 3,8 KB, en çok 8,1 KB |
| Snapshot (A) | 22,5 KB |
| Diplomasi ekranı çizimi | medyan 0,5–0,7 ms |
| Bellek (JS yığını) | host 17 MB, misafir 3–5 MB |

`dip` bölümü yalnız değişince gönderiliyor. Gün sayısı `clock.day`'den okunduğu için her gün yeniden gönderilmiyor.

## 7. Kapsam dışı ve bilinen konular

- **Kalıcılık:** bekleyen teklifler host sayfasının belleğinde. Host sayfası kapanırsa kaybolur. MP kayıt/yükleme MP.4.
- **İnsanın kurabileceği maddeler:** kaynak ve barış. Pakt, saldırmazlık, ittifak, istihbarat, sevkiyat, teknoloji, sistem MP.3.1.
  - AI'nın insana teklifinde bu maddeler olabilir ve motor kuralıyla uygulanır.
  - Bu tür teklife karşı teklifte yalnız kaynak ve barış taşınır.
- **AI karşı teklifi** yalnız AI insanın stoğunu biliyorsa (istihbarat ≥3) oluşuyor. Bu motorun kuralı; doğal oyunda nadir.
- **Uzak insan AI karşı teklifini reddedince** tek oyunculudaki `ctrNo` ret hafızası ve ilişki −5 uygulanmıyor (dengeleme kararı).
- **İzolasyonist doktrinli devlet** insanın eline geçse de motor her anlaşmayı yasaklıyor. Lobide uyarı yok (MP.3.1'de lobi bilgisine eklenebilir).
- **MP.2'den kalan:** filo ikmal sınırında durduğunda motorun `!e.ai` bildirimi host günlüğüne düşüyor.
- **Klavye:** Chromium yazılım klavyesi açmaz. Görünür alan küçültülerek benzetildi; gerçek Android klavyesi NOT RUN.

## 8. NOT RUN

- Gerçek internet sunucusu (dağıtım yok, URL yok).
- Fiziksel Android telefon; gerçek yazılım klavyesi.
- Aynı Wi-Fi'da LAN.
- Docker imaj derlemesi (daemon yok; dosya kümesi testle doğrulandı).
