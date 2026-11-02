# STARS — MP.7.3: Galaktik Konsey, siyasi entrikalar, yıkıcı savaş, Android testine hazırlık

**Durum:** geliştirme sürümü.
- Runtime değişmedi: 19 dosya MP.7 / MP.7.1 / MP.7.2 ile bayt-bayt aynı.
- Oyun yayını hâlâ `96h10p2`, PWA `stars-v96h10p2`, Save8. Yeni ZIP yok.
- Taban: MP.7.2 `ed97262` (PR #26). Zincir #17 → #26 açık; hiçbiri merge edilmedi.

İlke aynı: **TEK STARS ARAYÜZÜ, İKİ OYUN MODU.**
- Yeni MP ekranı yazılmadı.
- Misafirde gerçek STARS düğmesinin çağırdığı motor işlevi sarılır ve host komutuna iner.
- Host aynı motor işlevini oyuncunun **kendi** devletiyle yürütür.
- Yeni mekanik yok.

## 1. Envanter: 45 → 18

MP.7.2 sonunda misafirde MP karşılığı olmayan **45** eylem vardı (`research/mp72/evidence/mp72-results.json`). Bu fazda 27'si bağlandı.

| Sınıf | Sayı | Eylemler |
|---|---|---|
| 1. Yeni host komutu (motor işlevi sarılı) | 17 | `bill`, `billTarget` → `bill`; `cncFound` → `councilFound`; `cncJoin` → `councilJoin`; `cncLeave` → `councilLeave`; `veto`; `permanent`; `throneBuild` → `throne`; `reform`; `bribe`; `blackmail`; `bmGo` → `bmLeader`; `fundSep`; `revoltConfirm` → `revolt`; `whisperGo` → `whisper`; `devourConfirm` → `devour`; `colFire` |
| 1. Yeni host komutu (`UI.act` kapısında doğrudan) | 2 | `cncYes`, `cncNo` → `councilVote` |
| 3. Yalnız yerel görünüm / onay penceresi | 8 | `cncPane`, `billPick`, `panoptRetarget` (sonraki harita dokunuşu → `panopt`), `revolt` (onay penceresi), `whisperMenu`, `whisperPick`, `whisperBlame`, `devour` (önizleme penceresi) |

**Kalan 18:**

| Sınıf | Sayı | Eylemler | Neden |
|---|---|---|---|
| 4. Bilerek kapalı | 13 | `restart`, `sandbox`, `toTitle`, `trigCrisis`, `autoEvent`, `diagCopy`, `mapFix`, `tplDel`, `tplLoad`, `tplSave`, `rollName`, `physio`, `stashNote` | tek oyunculu / geliştirici / kurulum (kurulumlar MP.7 kurulum ekranında çalışır) |
| 5. Tek oyunculuda da bozuk | 2 | `terra`, `survey` | §7 |
| 6. Ertelendi / uygulanamaz | 3 | `joinRebel`, `leaveRebel`, `sitPick` | §4 |

Liste misafirin gerçek `act` gövdesinden üretilir. Kanıt: `research/mp73/evidence/mp73-results.json` → `metrics.unsupported`.

## 2. Galaktik Konsey

### 2.1 Motorun insan varsayımı

Motor konseyde yalnız devlet 0'ı oyuncu sayıyordu. Uzak insan için AI şunları yapıyordu:
- **`agendaTick`:** onun adına gündeme yasa ekliyordu.
- **`startCouncilVote`:** onu sponsor yapıyor, destekçi olarak "evet" yazıyor ve oyunu hesaplıyordu.
- **`councilTick`:** "ara ara katılır" zarıyla onu konseye yazıyordu.

`installGuards` düzeltmeleri:
- **Metin yaması** (`__mpHumanVoter`; MP.3.1 yöntemi): `agendaTick` ve `startCouncilVote` (sponsor, destekçi, oy döngüsü). Uzak insan devlet 0 gibi atlanır.
- **`councilTick` sarmalı:** başka bir runtime katmanınca sarılı olduğu için metni yamalanamaz. Ay adımı sırasında `joinCouncil` uzak insanı reddeder. Zar aynı sırada çekilir.
- **`finishCouncilVote` sarmalı:** oylama açık kalır. Kapanış koşulu:
  - oy hakkı olan bütün insan üyeler (host dahil; senyörü üye olan vasal motor kuralıyla susar) oy vermiştir, **ya da**
  - motorun kendi 24 ay sınırı dolmuştur.
- **Eşdeğerlik:** uzak insan yokken `__mpHumanVoter` hep false. Davranış, Save8 ve RNG birebir aynı (Node: 25 yıl, Save8 / RNG SHA-256).

### 2.2 Komutlar

| Komut | Motor işlevi | Host denetimi |
|---|---|---|
| `councilVote` {token, yes} | tek oyunculu `cncYes` / `cncNo` işlemi + `finishCouncilVote` | üyelik (değilse `no-council`), açık oylama (`no-vote`), oylama kimliği (`stale`), vasal susması (`vassal`), tek oy (`voted`) |
| `councilFound` / `councilJoin` / `councilLeave` | `foundCouncil` (`canFoundCouncil`) / `joinCouncil` / `leaveCouncil` | motor koşulları |
| `bill` {key, target\|null} | `proposeBill` (`canProposeBill`) | yasa kataloğu `RESOLUTIONS`, hedef temas / üye |
| `veto` {law} | `guardianVeto` | motor (muhafız hakkı) |
| `permanent` | `claimPermanent` (`canClaimPermanent`) | **başka insan üye varken reddedilir** (`human`) |
| `throne` {sys} | `rebuildThrone` | sistem görülmüş |
| `reform` {axis, dir} | `doReform` | eksen `mil` / `aut` / `mat`, yön ±1 |
| `bribe` / `blackmail` {target, yon} | `bribeVote` (200 mineral) / `blackmailVote` | **insan hedef reddedilir** (`human`); zar host'ta |

**Oy verme yolları (misafir):**
- **Bildirim kartı:** misafire gerçek "KONSEY OYLAMASI" kartı gelir (gelen kutusu kaydı `mp73cnc:<yasa>:<hedef>`). Kart Konsey ekranını açar.
- **Konsey ekranı:** EVET / HAYIR doğrudan `councilVote` gönderir. Oylama kimliği yasa + hedeftir; eski ekrandan oy `stale`.
- **Host bildirimi:** oy vermemiş uzak üyeye host'tan bir kez not gider (`councilSweep`).

### 2.3 Güvenli kısıtlar

- **Daimi hükümdarlık:** `claimPermanent` bütün üyelerin oyunu zarla belirler. Başka bir insan üye varken talep edilemez. Ayrıca host'un kendi arayüzünde de uzak insan üye varken çalışmaz.
- **Rüşvet / şantaj:** motorda yalnız AI oy hesabını etkiler. İnsan üyenin oyunu değiştirmek "insan adına karar" olurdu; bu yüzden insan hedefe reddedilir.
- **AI'nın uzak insana rüşveti:** motor mineral aktarımını devlet 0'a olduğu gibi yapar. Uzak insana not gider ("oyunu yine sen verirsin"); oyu değişmez.

## 3. Siyasi entrikalar

| Komut | Motor işlevi | Not |
|---|---|---|
| `bmLeader` {target, leader} | `blackmailLeader` | zar host'ta; sonuç yalnız fail'e |
| `fundSep` {target} | `fundSeparatists` | |
| `panopt` {from, to} | `panopticonLock` | tek oyunculu harita seçimi (`View.panoptFor`) misafirde yerel |
| `revolt` | `playerRevolt` | `installGuards` aktör parametresi ekler (`const e = arguments[0] \|\| G.p`); vasal değilse `not-vassal` |
| `whisper` {a, b, blame} | `playerWhisper` | aynı yöntem (`arguments[3]`); günlük fail'in `whisperLog`'una |

- Parametresiz çağrılar aynen sürer; host'un kendi düğmeleri değişmedi.
- **Gizlilik:** aynada kampanyanın rüşvet / şantaj kayıtlarından yalnız "kilitli" işareti gider: `bribed` → `{id:1}`, şantajda yön `0`. Kimin, hangi yönde ve ne kadar verdiği gitmez.
- Konuşmalar yalnız temas kurulan devletlerden. Sponsor yalnız kendisiyse işaretlenir.

## 4. Ertelenenler (yüksek risk / uygulanamaz)

- **`joinRebel` / `leaveRebel`:** gölge isyan ittifakı (`G.rebelAlliance`) aynada yok (`null`).
  - Katılımcıların listesi gizli bilgidir.
  - Motor ittifakı devlet 0'ın bakışıyla yönetir.
  - Uzak insana açmak hem gizlilik hem motor kararı gerektirir; bu faza alınmadı.
- **`sitPick`:** durumlar (`G.sits`) motorda yalnız devlet 0 için başlar. Uzak insanın seçebileceği durum oluşmaz; uygulanamaz.

## 5. Yıkıcı savaş

| Komut | Motor işlevi | Host denetimi |
|---|---|---|
| `devour` {sys, planet} | `devourPlanet` | sistem görülmüş, gezegen var; koşullar motorda (`canDevour`) yeniden |
| `colFire` {fleet, mod} | `colossusFire(f, colossusTarget(f), mod)` | kendi filosu, mod `catlat` / `notron`, hedef host'ta yeniden hesaplanır |

- **Onay penceresi:** misafir tek oyunculunun kendi önizlemesini ve onayını kullanır. Komut yalnız onaydan sonraki son çağrıda gider.
- **Onaysız çağrı:** `devourConfirm` hiçbir şey göndermez (tarayıcı testi).
- **İkinci onay:** ikinci yıkım yapamaz; gezegen artık enkaz olduğu için motor reddeder (Node testi).

## 6. Android testine hazırlık

- **Salt okunur sürüm işareti.** BUILD_ID değişmedi; sahte artış yok.
  - `GET /mp/version` → `{"mp":"MP.7.3","build":"96h10p2","files":{…}}`. `files`, 8 MP dosyasının 12 haneli SHA-256 önekleridir. `no-store`, gizli bilgi yok.
  - `/healthz` aynen.
  - Smoke aracı 11 denetim (`/mp/version` eklendi).
- **Sürüm satırı** (`STARS MP.7.3 · oyun 96h10p2`):
  - lobi (host + misafir);
  - misafirin OYUN BAŞLIYOR ekranı;
  - host'un ÇOK OYUNCULU çubuğu (açılınca; yeniden bağlanma sayısıyla).
- **Misafir tanı satırı:** ÇOK OYUNCULU çubuğuna dokununca açılır: sürüm · host bağlantısı · başlangıç aşaması · son reddedilen komutun kodu. Jeton, oda anahtarı ve komut içeriği yok.
- **Rehber:** `research/mp73/ANDROID-TEST.md`. Render adımları, kullanıcının 15 adımı, sorun durumunda neye bakılacağı.

## 7. `terra` / `survey`

Tek oyunculuda da bozuk; düzeltme runtime değişikliği gerektirir (ayrı faz kararı). Basit ve güvenli bir MP düzeltmesi yok; dokunulmadı.
- **`terra`:** `economy.js`'te iki `startTerraform` bildirimi var. Üç parametreli olanı (çökmüş gezegen onarımı) kademe terraform işlevini gölgeler.
- **`survey`:** düğmenin çağırdığı `UI.doSurveyOrder` tanımlı değil.

## 8. Testler

Ayrıntı: `research/mp73/evidence/REGRESYON.md`.

**`tests/mp73_council_test.js` (Node): 10/0.**
- AI insanlar adına oy / sponsor / gündem yazmaz;
- insan oyu + host bekler;
- `voted` / `stale` / `no-council`;
- 24 ay sınırı;
- tasarı + AI'ya rüşvet (200 mineral) ve insan hedef reddi;
- daimi / veto / taht / reform;
- ayna gizliliği;
- entrikalar aktörün devletinde (`whisperLog`), `revolt` vasal değilken ret;
- yıkıcı ret yolları ve ikinci yutma;
- uzak insan yokken 25 yıl Save8 / RNG eşdeğerliği.

**`tests/browser-mp73.cjs` (Chromium).** Üretim kipi relay + parçalayan TLS vekili; yatay 844×390 / 800×360 / 915×412; düğmeler gerçek dokunmayla.
- **A1–A3 (host + 1):** Android rehberinin akışı:
  - oda, iki tasarım, başlat;
  - sürüm işareti, `/mp/version`, misafir tanı satırı;
  - envanter 45 → 18;
  - filo hareketi;
  - B → host teklif + gelen kutusundan kabul;
  - zaman iki ekranda;
  - 3 sn ağ kesintisi → aynı devlet;
  - host kaydı (`validatePackage`).
- **B1–B4 (host + 2):**
  - konsey oyu bildirim kartından ve Konsey ekranından; oylama insanlar oy verene kadar açık; tekrar oy reddi;
  - tasarı ve AI üyeye rüşvet (İSTİHBARAT → SİYASİ VE LOJİSTİK); insan üyeye ret; aynada yalnız kilit;
  - fısıltı ağı gerçek pencereden;
  - onaysız yutma çağrısı komut göndermez.

**Yalnız Node'da kanıtlı:** 24 ay sınırı, daimi hükümdarlık reddi, veto / taht / reform, yıkıcı işlemlerin ret ve ikinci onay yolu, uzun eşdeğerlik. Tarayıcıda rastgele galaksi bu durumları kendiliğinden üretmez.

## 9. Dağıtım

Yeni istemci dosyası yok. Relay izin listesi, sayfa enjeksiyonu, Dockerfile ve `.dockerignore` değişmedi; Docker imajı testlerle doğrulandı.

Render: `research/mp73/ANDROID-TEST.md` §0.
- **Branch:** `claude/stars-mp73-council-intrigue`.
- **Ek doğrulama:** `<adres>/mp/version` → `"mp":"MP.7.3"`.

Bu oturumdan dağıtım yapılmadı. Canlı servis ve fiziksel Android **NOT RUN**.
