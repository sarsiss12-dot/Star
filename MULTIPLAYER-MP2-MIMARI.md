# STARS — MP.2 mimarisi: misafirin gerçek oynanışı (harita, filo, bilim)

Durum: **geliştirme prototipi, yayımlanmadı.**

- 19 runtime dosyası, build `96h10`, PWA `stars-v96h10`, Save8 ve `releases/stars-faz96h10.zip` değişmedi.
- MP.0 → MP.1 → MP.1.1 altyapısı (host-yetkili çekirdek, lobi, relay) korunuyor.

MP.2'de misafir:

- galaksi haritasında gezinir;
- kendi filosunu seçip başka sisteme gönderir;
- araştırma hedefi ve kipini seçer;
- MP.1'deki koloni inşasını kullanmaya devam eder.

Her eylem host'un gerçek STARS motorunda uygulanır. Misafir istemcide motor yoktur (`G`, `orderMove`, `researchTarget` tanımsız; test edildi).

## 1. Komutlar (`research/mp0/mp-core.js` → `COMMANDS`)

MP.0'ın güvenli yönlendiricisi aynı kaldı:

- sabit, prototipsiz tablo;
- tam anahtar kümesi doğrulaması;
- paketteki `empire` alanı yetki vermez (`forged-empire`);
- `cid` tekrarı önbellekten döner, eski `seq` reddedilir;
- host duraklatılmışsa `paused`;
- `txCaptureGraph` / `txRestoreGraph` ve RNG geri alma;
- başarılı komut dergiye (journal) yazılır ve hemen yayımlanır.

Komut başına yeni `locate` kancası, koloni dışı komutların kendi nesnesini bulmasını sağlıyor.

| Komut | Şema | Yetki / nesne | Kural ön denetimi (salt okuma) | Uygulama (gerçek motor) |
|---|---|---|---|---|
| `move` | `{kind, fleet, to}` (tamsayı; rota alanı **yok**, fazladan anahtar → `bad-params`) | Filo var ve `f.e === bağlantının devleti`, boş değil. Yoksa ya da başkasınınsa aynı kod `not-owner` (filo kimliği yoklanamaz) | `same` (zaten orada), `no-route` (`findPath` yok), `passage` (`pathAllowed` ve `findPathAllowed` başarısız: kapalı sınır), `no-position` | `orderMove(f, to, false)` + `f.ord = null`. Tek oyunculu "buraya gönder" ile aynı; rota host'ta kurulur, istemciden rota alınmaz |
| `research` | `{kind, tech, action?, position?}`; `action` `toggle` ya da `move` | Her zaman bağlantının kendi devleti | `done`, `access` (`researchAccess`), `route` (`researchRoute`), `bad-position`; hedeften çıkarmak her zaman serbest | `researchTarget(e, tech, action, position)`: plan, dal ataması, banka |
| `researchMode` | `{kind, mode}` (`manual`, `semi`, `auto`) | kendi devleti | `same` | `setResearchMode(e, mode)` |

Ek bilgiler:

- `move`'un kökleri: filo nesnesi (+ `G.construction`). `research` ve `researchMode`'un kökleri: `e.research`, `e.rq`, `e.rp`.
- `research`, `researchMode` ve `move` RNG çekmiyor (`autoResearch` deterministik puanlama; `orderMove` yol bulma).
- Motorun kendi kuralları başka kanıta gerek bırakmadan işliyor. Örnek: kapalı sınırdan savaş filosu geçemiyor, bilim gemisi geçebiliyor (`fleetNeedsPass`; test edildi).

**Eşdeğerlik kanıtı** (`tests/mp2_core_test.js`):

- Aynı seed ve aynı lobiyle iki dünya kuruldu. Birinde komut ağdan, ötekinde aynı motor çağrısı doğrudan yapıldı.
- Komuttan sonra, hareket sürerken (her 5 günde) ve araştırma tamamlanınca Save8 baytları birebir aynı.
- Reddedilen her komuttan sonra Save8 ve `RND_STATE` değişmedi.

## 2. Görünüm genişlemesi (`viewFor`) ve neden gerektiği

| Alan | Kime | İçerik | Neden |
|---|---|---|---|
| `fleets[id]` (kendi) | sahibi | `nm` ad, `pa` rota (≤24 düğüm), `mv` `[from, to, ilerleme]`, `pw` güç (`fleetPower`), `st` durum (`fleetStatus`), `au` otomatik keşif, `sh`, `s`, `to` | Filo paneli; haritada konum, rota ve hareket |
| `fleets[id]` (yabancı) | görenler | **değişmedi:** `{id, e, s, n}` | Haritada görünen yabancı filo |
| | | `e` artık temas yoksa `null` | Temas kurulmamış devlet kimliği gitmez |
| | | Yoldaki filo görünür uçtaki sistemde gösterilir | Rota ve hedef gitmez |
| `sys[id].o`, `pl[].o` | görenler | Temas kurulmamış sahip `-2` olarak maskelenir | Kimlik sızıntısı |
| `sci` | kendi devleti | `mode`, `ara` (gelir), `rq`/`rp`/`rc` (dal başına aktif teknoloji, ilerleme, maliyet), `targets`, `plan` (ek ön koşul sayısı, rota hatası) | Bilim ekranı |
| `tech[id]` | kendi devleti | 58 teknoloji: `n`, `b`, `t` (kademe), `r` (ön koşul), `d` (açıklama), `c` (bu devlet için maliyet), `s` (`d` tamam / `r` hazır / `l` ön koşul / `x` erişim yok), `w` (erişim nedeni) | Seçilebilir katalog ve kilit nedeni |
| `log` | kendi devleti | Son 12 kişisel bildirim (araştırma tamamlandı vb.) | Host günlüğüne düşmemesi için |

Bilerek **gönderilmeyenler:**

- yabancı devletlerin `techs`, `research`, `rq`/`rp`, ekonomisi;
- yabancı filo adı, rotası ve hedefi;
- casusluk ve istihbarat;
- `seen`, `surv`, banka, geçmiş;
- jeton ve tohum.

Snapshot/delta kuralları MP.0 ile aynı:

- keyed bölümler: `sys`, `cols`, `fleets`, `emps` ve yeni `tech`;
- tam değiştirilen bölümler: `me`, `lanes`, `catalog` ve yeni `sci`, `log`.

## 3. Bu fazda bulunan ve düzeltilen çekirdek hatası: yayın yan etkisi

`viewFor` → `explorationContext` → `borderPressure` / `totalPower` motorun günlük önbellek alanlarını (`_powAt`, `_pressAt`…) yazıyordu. Bu alanlar Save8'e giriyor.

- MP.0'dan beri vardı. Yalnız uzak insan varken ortaya çıkıyordu; MP.1'in insansız no-op testi bunu göremezdi.
- Sonuç: yayın zamanına bağlı bir damga Save8 baytlarını değiştiriyordu ve aynı gün içinde motorun önbellekten okuyacağı değeri değiştirebilirdi.

Düzeltme:

- `publishTo`, görünümü `pure(...)` içinde kurar. G, devletler, filolar ve sistemlerdeki bütün `_` önekli alanlar çağrıdan önce alınıp sonra aynen geri konur.
- Motorun `aiWarBudget` (ai.js) içinde yaptığı korumanın aynısı.
- Kanıt: hareket eden filoyla yayın yapan ve yapmayan dünya her 5 günde Save8 eşit.

## 4. Kişisel bildirimler

- `installGuards`, `researchTick`'i yalnız **uzak insan** devlet için sarar.
- O sırada çağrılan `say(...)` host günlüğüne değil, o oyuncunun `log` listesine yazılır ("Araştırma tamamlandı — …", uzmanlaşma).
- Tek oyunculu oyunda ve AI'da sarmalayıcı devreye girmez: 120 gün Save8 + RNG düz motorla aynı (test edildi).
- **Kalan bilinen sızıntı:** filo ikmal sınırında durduğunda motorun `!e.ai` bildirimi ("… ikmal sınırına ulaştı ve durdu") host günlüğüne düşüyor. Filo hareket döngüsünün içinde, devlet başına sarılamıyor (MP.3).

## 5. Misafir istemci (`research/mp2/client/`)

- `guest-game.js`: harita, filolar, koloniler, bilim. Yalnız `MP1Join.game.view` okur, yalnız `MP1Join.cmd(...)` ile komut gönderir.
  - Rota hesabı ya da kural kopyası yok.
  - Gösterilen her sonuç host'tan gelen `result` ve sonraki delta.
- `view.js` (MP.1): `apply()` artık paketle değişen bölümleri `changed` kümesine yazar. Arayüz yalnız etkilenen sekmeyi yeniden kurar; harita gerektiğinde tek kare çizer.
- `join.js` (MP.1): oyun ekranını `MP2Game`'e devreder. Bağlantı, lobi, yeniden bağlanma ve geri tuşu MP.1'deki gibi. `#jConn` durum satırı aynı metinlerle duruyor.
- Relay: izin listesine `research/mp2/client/guest-game.js` ve `mp2.css` eklendi. Dockerfile ve `.dockerignore` da güncellendi.
- Ayrıntı: `MULTIPLAYER-MP2-MOBIL-HARITA.md`.

## 6. Senkronizasyon

- Zaman, AI, RNG ve komut sırası yalnız host'ta.
- Misafir saati ve filo konumu host paketinden gelir.
  - Haritada yoldaki filo, host'un bildirdiği `mv` ilerlemesiyle iki sistem arasına yerleştirilir.
  - Tahmini animasyon yok.
- Geç gelen eski delta yok sayılır; boşluk `resync` ile kapanır (MP.0 kuralları, değişmedi).
- Host duraklatıldığında ya da arka plandayken misafir nedeni görür, komut `paused` ile reddedilir.
- Yeniden bağlanınca filo rotası ve araştırma durumu host'tan gelir. Kamera, sekme ve seçim `sessionStorage`'dan geri yüklenir.
