# STARS — MP.7.2: eksik oynanış işlevleri gerçek STARS düğmeleriyle

**Durum:** geliştirme sürümü.
- Runtime değişmedi (19 dosya MP.7 / MP.7.1 ile bayt-bayt aynı). Oyun yayını hâlâ `96h10p2`, PWA `stars-v96h10p2`, Save8. Yeni ZIP yok.
- Taban: MP.7.1 `b20994e` (PR #25). Zincir #17 → #25 açık; hiçbiri merge edilmedi.

İlke MP.7.1'deki gibi: **TEK STARS ARAYÜZÜ, İKİ OYUN MODU.** Yeni MP ekranı yazılmadı. Misafirde gerçek STARS düğmesinin çağırdığı motor işlevi sarılır ve host komutuna iner. Host aynı motor işlevini oyuncunun **kendi** devletiyle yürütür.

## 1. Başlangıç envanteri ve gerçek sınıflandırma

MP.7.1'de misafirde MP komutu olmayan **68** eylem vardı (`research/mp71/evidence/REGRESYON.md`). Her birinin tek oyunculu kodu okundu.

| Sınıf | Sayı | Eylemler | Ne yapıldı |
|---|---|---|---|
| Yalnız yerel görünüm / pencere | 10 | `envoy` (elçi penceresi), `compositionEdit` (bileşim penceresi), `jointPrepare`, `jointChooseTarget`, `aimSet`, `aimCancel` (tekil gemi nişangâhı), `rallySet` (eski düğme, yalnız bilgi), `warPauseToggle` (yerel tercih), `dismissBattleReport` (yerel; ayna yeniden kurulumunda korunur), `gobattle` (kameraya çatışma) | görünüm listesine (host komutu yok) |
| Mevcut MP komutuyla tamamlanan | 1 | `mergeArmed` | MP.6.1 `merge` (aynı gruptaki savaş filoları). `aimSet`'ten sonraki harita dokunuşu da mevcut `move` / `colonize` komutlarını kullanır. |
| Yeni host komutu gereken | 12 eylem / 10 komut | `envoyTask` + `envoyRecall` → `envoy`; `compositionSave` + `compositionAuto` → `composition`; `build2` → `struct`; `dirTog` → `colAuto`; `bombMode` → `bombMode`; `jointRequest`; `jointCancel`; `fedWarRequest` → `fedWar`; `ultimatum`; `patronage` | aşağıda |
| Tek oyunculuda da çalışmayan eski düğme | 2 | `terra`, `survey` | kapalı kalır (bkz. §8) |
| Tek oyunculu / geliştirici / kurulum | 13 | `restart`, `sandbox`, `toTitle`, `trigCrisis`, `autoEvent`, `diagCopy`, `mapFix`, `tplDel/Load/Save`, `rollName`, `physio`, `stashNote` | bilerek kapalı. Kurulumla ilgililer MP.7 kurulum ekranında `setupClickHandler` ile zaten çalışır. |
| MP.7.3'e kalan | 30 | Galaktik Konsey 15 (`bribe`, `blackmail` konsey oyu işlemleri dahil), karmaşık entrika 12, yıkıcı savaş 3 (`devour`, `devourConfirm`, `colFire`) | ayrı faz |

**Sonuç:** 68 → **45**. Bağlanan 23 eylem şöyle ayrılıyor:
- 10 görünüm;
- 1 mevcut komut;
- 12 yeni komut eylemi.

Kalan 45:
- 13 bilerek kapalı;
- 2 gereksiz (tek oyunculuda da bozuk);
- 30 sonraki faz.

Liste `research/mp72/evidence/mp72-results.json` `metrics.unsupported` alanında. Misafirin gerçek `act` gövdesinden üretildi (MP.7.1 düzeltmesi).

## 2. Yeni host komutları (`research/mp0/mp-core.js`)

Hepsinde:
- oyuncu kimliği bağlantıdan alınır;
- komutta devlet alanı yok (`onlyKeys`);
- başkasına ait filo / koloni `not-owner`;
- temas kurulmamış ya da görülmemiş hedef `no-target` ("yok" ile aynı);
- kural ve maliyet motorun kendi işlevinde;
- başarısızlıkta işlem ve RNG geri alınır.

| Komut | Motor işlevi | Not |
|---|---|---|
| `envoy` {target, task\|null} | `setEnvoyTask` / `recallEnvoy` (`envoyGate`, kapasite) | elçi Save8'de (motor kaydı) |
| `composition` {fleet, counts, auto} | `setFleetTemplate` | sınıf adları `fleetTemplateClasses`, üst sınır `FLEET_TEMPLATE_LIMIT` |
| `struct` {sys, key, fleet} | `startStruct` | inşaat gemisi kendi gemisi, sistem görülmüş olmalı |
| `colAuto` {sys, planet} | tek oyunculu `dirTog` işlemi (motorda ayrı işlev yok; 2 satır) | yalnız kendi kolonisi |
| `bombMode` {fleet, mode} | tek oyunculu `bombMode` işlemi | yalnız `hassas` / `yikici`, kendi filosu |
| `jointRequest` {ally, type, target} | `jointRequest` | alıcı AI müttefik (motor böyle); bkz. §3 |
| `jointCancel` {plan} | `jointCancel` | yalnız kendi talebi |
| `fedWar` {target} | `proposeFedWar` (`canFedWarRequest`) | insan üyelerin oyu kendi gelen kutusunda |
| `ultimatum` {target} | `sendUltimatum` | **yalnız AI hedef**: hedefin kararı motorda zarla verilir |
| `patronage` {target} | `offerPatronage` | **yalnız AI hedef** (aynı neden) |

Host'un kendi STARS arayüzü bu işlevleri doğrudan motorla çağırır (devlet 0); davranış tek oyunculu ile aynı.

## 3. Ortak askerî destek ve insan müttefik kararları

**Motor yalnız devlet 0'ı oyuncu sayıyordu.** `installGuards` metni `__mpHumanVoter` koşuluyla genişletir (MP.3.1 / MP.6.3 yöntemi; metin beklenen biçimde değilse kurulum durur):
- `jointRequest` / `jointCancel`: `e!==G.p` koşulu uzak insanı da kabul eder.
- `jointCreate`: oyuncu talebi AI'nın planını değiştirebilir (devlet 0 dalı uzak insana da açılır).
- `jointAnchorPower`: "filomu destekle" dayanak gücü sahibinin bakışıyla sayılır.
- **Eşdeğerlik:** uzak insan yokken davranış, Save8 ve RNG birebir aynı (Node testi: oyuncu talebi + 20 gün).

**İnsanın filoları hiçbir ortak planda kullanılmaz.** Motorun `jointSelect`'i AI olmayan üyenin filolarını atlar ("Oyuncu filoları kendi komutasında").

**İnsan müttefik.** Motorda insan alıcılı "destek talebi" yok; yazmak yeni mekanik olurdu. İnsan müttefikler arası ortak savaş yolu federasyondur:
- `fedWar` (savaş izni önerisi) → federasyon oylaması;
- insan üyenin oyu AI tarafından **verilmez**: gelen kutusunda bekler, kendi `fedVote`'u ile verir (Node testi);
- ortak savaş kararları MP.6.3 `fedExecute` ile, gelen kutusundaki "Ortak savaş kararı" kaydından uygulanır.

**Misafirde gerçek panel.** "Ortak askerî koordinasyon" bölümü savaş defterine ve ortak sefer kaydına dayanır; ikisi de aynada yok.
- Host misafire yalnız kendi bakışını gönderir (`joint` görünümü):
  - destek bağı olan AI müttefikler ve aynı geçerli seferde olup olmadıkları (motorun `jointContext`'i);
  - motorun kendi süzgeçli `jointView(e)` planları.
- Misafir sayfasının katı CSP'si `eval`'e izin vermediği için panel metni yamalanmaz. Panel çizilirken **yalnız o çağrı süresince** motorun kendi yolu host kararıyla beslenip geri yüklenir (`G.warLedger` → `warLedgerPair` → `jointContext`).
- `jointBinding` / `jointView` / `jointRequest` / `jointCancel` misafirde host verisine bağlıdır.

## 4. Güvenlik düzeltmesi: insan adına zar

MP.0'dan beri host kendi STARS arayüzünden bir insana ültimatom verebiliyordu. `sendUltimatum` hedefin "boyun eğme" kararını zarla verir; bu, insan adına AI kararıydı.
- Artık `installGuards` insan hedefi reddediyor; misafir komutu da aynı kuralla reddediliyor.
- Himaye (`offerPatronage`) yalnız sahibinin desteğiyle doğan devlete yapılır (motor kuralı). Komut ayrıca insan hedefi reddeder.

## 5. Misafir tarafı (`research/mp6/client/guest-stars.js`)

- **Sarmalanan motor işlevleri:** `setEnvoyTask`, `recallEnvoy`, `setFleetTemplate`, `startStruct`, `jointBinding`, `jointView`, `jointRequest`, `jointCancel`, `proposeFedWar`, `sendUltimatum`, `offerPatronage`, `claimColony`.
- **`claimColony` (nişangâh):** tekil koloni gemisi `colonize` komutuna gider; ardından gelen aynı hedefli yerel `orderMove` ayrıca `move` göndermez.
- **`UI.act` kapısında doğrudan komut:** `mergeArmed`, `dirTog`, `bombMode`.
- **Sonuç bildirimi:** sonuç host'tan gelince gerçek STARS uyarısıyla gösterilir. Ortak destek sonucu panelin kendi "Kabul: / Ret:" satırında görünür.
- **Gizlenen savaş raporları** yerel görünüm durumudur; ayna yeniden kurulunca korunur.
- **Görünüm verisi:** `joint` bölümü MP.2 görünüm farklarına eklendi (yalnız değişince gider; yeni tam ayna yok).

## 6. Testler

Ayrıntı: `research/mp72/evidence/REGRESYON.md`.

**`tests/mp72_gameplay_test.js` (Node): 12/0.**
- elçi (motor çağrısıyla bayt-bayt aynı; Save8'de);
- elçi yetkisi ve kapasitesi;
- filo bileşimi;
- koloni otomasyonu ve bombardıman kipi (bildirim yalnız oyuncuya);
- yapı;
- ültimatom / himaye (insan hedef reddi; host arayüzü de);
- federasyon savaş izni;
- insan müttefik oyu (AI vermez, kendi oyu, tek oy);
- ortak destek görünümü;
- fikstürde uzak insan talebi + iptal + filosu kullanılmaz;
- "filomu destekle" dayanak gücü;
- uzak insan yokken eşdeğerlik.

**`tests/browser-mp72.cjs` (Chromium): 9/0.** Üretim kipi relay + parçalayan TLS vekili; yatay 844×390 / 800×360 / 915×412; düğmeler gerçek dokunmayla.
- A1: envanter 68 → 45.
- A2: elçi gönder / mevcut görev / geri çek.
- A3: bileşim penceresi + KAYDET + otomatik takviye.
- A4: savaş filolarını birleştir.
- A5: koloni otomasyonu; bombardıman kipi `UI.act` yolundan, çünkü düğme yalnız kuşatma durumunda çıkıyor.
- A6: ortak destek. Gerçek panel host verisiyle, BÖLGEYİ SAVUN → TALEBİ GÖNDER, host motoru değerlendirir. Rastgele galaksinin rota / ikmal / savunma koşullarıyla motor kendi gerekçesiyle "Ret" verdi; kabul + iptal yolu Node fikstüründe.
- A7: yetki.
- B1: host + 2. C → B elçi; B'nin aynasında C'nin elçi haritası yok; başkasının filosu yönetilemez.

## 7. Dağıtım

Yeni istemci dosyası yok. Relay izin listesi, sayfa enjeksiyonu, Dockerfile ve `.dockerignore` değişmedi.

Render adımları `research/mp7/RENDER.md` ile aynıdır:
- **Branch:** `claude/stars-mp72-gameplay-parity`.
- **Ek doğrulama:** `/research/mp71/client/mp71-dip.js` → 200.

Bu oturumdan dağıtım yapılmadı. Canlı servis ve fiziksel Android NOT RUN.

## 8. Açık konular

- **Tek oyunculu hatalar (runtime; bu fazın kapsamı dışı):**
  - `economy.js`'te iki `startTerraform` bildirimi var. Sonraki (çökmüş gezegen onarımı, 3 parametre) ilkini gölgeler; bu yüzden kademe terraform düğmesi (`terra`) her zaman "başlatılamadı" der.
  - `survey` düğmesinin çağırdığı `UI.doSurveyOrder` tanımlı değil.
  - Düzeltmeleri runtime değişikliği ve ayrı faz kararı gerektirir.
- **Bombardıman kipi:** misafirde test `UI.act` yolundan yapıldı; gerçek kuşatma durumundaki düğme tarayıcıda dokunulmadı.
- **Ortak destek kabul yolu:** tarayıcıda rastgele galaksi koşullarında motor reddetti; kabul yolu yalnız Node fikstüründe kanıtlı.
- **MP.7.3'e kalan:** Galaktik Konsey (önerge, oy, rüşvet / şantaj, veto, reform, taht), karmaşık entrika (fısıltı, isyan, ayrılıkçı fon, Panoptikon, şantaj liderleri), yıkıcı savaş (yutma, Kolossus ateşi).
