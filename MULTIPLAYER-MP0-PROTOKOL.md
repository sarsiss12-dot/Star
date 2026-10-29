# STARS MP.0 — Host/istemci protokolü (sürüm 1)

Uygulama: `research/mp0/mp-core.js` (host), `research/mp0/client/mp-client.js` (istemci), `research/mp0/server/dev-relay.js` (geliştirme relay'i). Bütün paketler UTF-8 JSON; her uygulama paketi `v:1` taşır.

## 1. Taşıyıcı çerçevesi (relay)

WebSocket uç noktası: `/mp?room=<[a-z0-9-]{1,32}>&role=host|client`. Odada en fazla bir host olur (`host-exists`).

| Yön | Biçim | Anlam |
|---|---|---|
| istemci → relay | ham metin (≤ 8192 bayt) | relay, host'a `F<conn>\n<metin>` olarak iletir |
| relay → host | `J<conn>` / `L<conn>` / `F<conn>\n<metin>` | katıldı / ayrıldı / mesaj |
| host → relay | `T<conn>\n<metin>` / `K<conn>\n<neden>` | tek alıcıya gönder / bağlantıyı kes |
| relay → istemci | `H<metin>` / `R<json>` | host verisi / relay denetimi: `welcome`, `host-left`, `host-up`, `kicked`, `error` |

İstemci başka bir bağlantıya yazamaz. Gönderici kimliğini (`conn`) relay damgalar. Toplu yayın yoktur: her oyuncunun paketi ayrı süzülür ve ayrı gönderilir.

Çekirdek ayrıca:

- maskesiz istemci çerçevelerini reddeder;
- parçalı (fragmented) mesajları reddeder;
- 1 MiB üstü yükü reddeder;
- yalnız metin kabul eder.

## 2. İstemci → host

| `type` | Alanlar | Not |
|---|---|---|
| `hello` | `name` (≤ 24), `token?` (32 hex) | jeton eşleşirse aynı oyuncuya yeniden bağlanır; eski bağlantı `replaced` ile kesilir |
| `cmd` | `seq` (1…2³¹−1), `cid` (`[A-Za-z0-9_-]{8,40}`), `cmd`, `empire?`, `base?` | `empire` yalnız denetim içindir; atanandan farklıysa `forged-empire` |
| `resync` | — | host o oyuncuya tam snapshot gönderir |
| `ping` | `t` | `pong` döner (RTT ölçümü) |

Ek alan taşıyan paket reddedilir: `bad-cmd`, `bad-hello`. Bilinmeyen `type` de reddedilir: `bad-message`. Yönlendirme, prototipsiz ve dondurulmuş `HANDLERS` tablosuyla yapılır. Ağdan gelen ad hiçbir zaman fonksiyon adı olarak çağrılmaz; `eval` yoktur.

### Komutlar (prototipsiz `COMMANDS` tablosu)

| `kind` | Parametreler | Motor | Ön denetim (`rules:*`) |
|---|---|---|---|
| `build` | `sys`, `planet`, `key` (`BUILDINGS`'in kendi anahtarı) | `queueBuilding(e,sys,pl,key)` | `tech`, `max`, `slots`, `resources` |
| `focus` | `sys`, `planet`, `key` (`FOCUS`) | `setFocus(e,sys,pl,key)` | `cooldown`, `same`, `oneparty` |
| `cancel` | `sys`, `planet`, `index` | `cancelBuild(e,sys,pl,index)` | `no-job` |

Hedef sırasıyla şu yanıtlarla reddedilir:

- geçersiz ya da kolonisiz hedef: `bad-target`;
- başkasının gezegeni: `not-owner`.

## 3. Host → istemci

| `type` | Alanlar |
|---|---|
| `assign` | `room`, `hostId`, `playerId`, `token`, `empireId` (null olabilir), `lastSeq`, `rev` |
| `snapshot` | `rev`, `t:{day,y,m,spd}`, `you:{playerId,empireId}`, `view` |
| `delta` | `rev`, `base`, `t`, `ops:{up:{sec:{k:v}}, rm:{sec:[k]}, set:{me\|lanes\|catalog}}` |
| `result` | `seq`, `cid`, `status: ok\|rejected`, `code`, `rev`, `dup?` |
| `pong` | `t`, `day` |
| `error` | `code`: `bad-json`, `bad-message`, `bad-cmd`, `bad-hello`, `too-big`, `no-empire` |

### Görünüm (`view`)

Görünüm yalnız oyuncunun devleti için kurulur.

- `me`:
  - `id`, `n`, `col`, `dead`, `home`;
  - `res` ve `inc` (0,1 hassasiyet);
  - `tech` (sayı), `rq` (araştırma).
- `sys[id]`:
  - Herkes için `{i,x,y}` (kamu coğrafyası; tek oyunculu haritadaki soluk nokta).
  - **Bilinen** sistemde ayrıca `k:1`, `n` (ad), `st` (yıldız).
  - **Görünür** sistemde ayrıca `vis:1` ve `o` (sahip).
  - **Taranmış** sistemde ayrıca `sv:1` ve `pl:[{i,t,sz,o?}]`; gezegen sahibi yalnız sistem görünürse gönderilir.
- `lanes`: en az bir ucu bilinen şeritler (tek oyunculu harita kuralı).
- `cols["s:p"]`: yalnız kendi kolonileri.
  - `n`, `pop`, `cap`, `stab`, `f`, `fcd`;
  - `b` (yapılar);
  - `q:[{k,l,t,d}]` (kuyruk);
  - `sl` (yer), `us` (kullanılan).
- `fleets[id]`:
  - Kendi filosu: `{id,own:1,s,to,sh}`.
  - Yabancı filo, yalnız görünür sistemde ya da görünür şeritte hareket ediyorsa: `{id,e,s,n}`.
- `emps[id]`: yalnız temas kurulan devletler, `{id,n,col,war,rel}`.
- `catalog`: oyun kuralı tablosu (bina adı, o devlet için gerçek bedel, `max`, teknoloji uygunluğu; odak adları).

**Gönderilmeyenler:**

- bilinmeyen sistemlerin adı, sahibi ve gezegenleri;
- görünmeyen filolar;
- başka devletlerin kaynak, teknoloji ve AI alanları (`aiStrategy`, `aiIntel`, `aiCampaign`, `aiTalk`);
- casusluk ve istihbarat kayıtları;
- teklif taslakları;
- başka oyuncuların `playerId` ve jetonları;
- tam `serialize()`.

## 4. Sıra, tekrar ve atomiklik

- **`seq`:** oyuncu başına tekdüze. `seq ≤ lastSeq` ve tanınmayan `cid` → `stale-seq`. Bu durumda uygulanmaz ve önbelleğe girmez.
- **`cid`:** sonuç oyuncu başına son 128 `cid` için önbellekte tutulur. Tekrar gelirse komut yeniden uygulanmaz; aynı sonuç `dup:1` ile döner.
- **Atomiklik:** komut, motorun `txCaptureGraph` ilkeliyle etkilenen kökler (ör. `e.res`, `pl.col`) yakalandıktan sonra uygulanır.
  - Motor `false` döner ya da istisna atarsa `txRestoreGraph` ve `rndSeed` ile tam geri alınır; sonuç `rules` ya da `error`.
  - Test, çağrının önce kaynak düşüp sonra istisna attığı durumu da kapsıyor.
- **Değerlendirme:** komut her zaman host'un o anki kanonik durumuna göre değerlendirilir, istemcinin eski görünümüne göre değil.

## 5. Dünya revizyonu, snapshot ve delta

- `worldRevision` her yayında ve her başarılı komutta artar.
- Her oyuncu için son gönderilen görünüm saklanır. Bir sonraki yayın yalnız farkları (`delta`) taşır; `base` = o oyuncuya son gönderilen `rev`.
- İstemci tarafı:
  - `rev ≤ yerel rev` → eski paket, yok sayılır.
  - `base ≠ yerel rev` → boşluk; `resync` istenir ve tam snapshot gelir.
  - Test: delta zinciri uygulandıktan sonra istemci görünümü, host'un taze `viewFor` sonucuna JSON olarak eşit.
- Yayın zamanlaması:
  - ay sonunda;
  - her komuttan sonra;
  - oyun akarken gün değişince (en fazla 4/s).
- Tam galaksi aktarılmaz.

## 6. Oturum metadatası (Save8'den ayrı)

```json
{ "mpMeta":1, "saveId":"s-…", "roomId":"…", "worldRevision":n, "hostId":"host",
  "build":"96h10", "saveVersion":8, "seed":11, "day":n, "speed":0, "access":"private",
  "saveHash":"<iki şeritli 32-bit FNV-1a (16 hex), Save8 metninin özeti>",
  "players":[{"playerId":"p-…","name":"…","token":"…","empireId":3,"lastSeq":n,
              "wasAI":true,"takeover":{"ai":true,"auto":{"s:p":true}},"lastSeen":t}] }
```

Geri yükleme reddedilir:

- `mpMeta` ya da `saveVersion` farklıysa;
- `roomId` farklıysa;
- `saveHash` yüklenen Save8 ile uyuşmuyorsa (`save-mismatch`);
- build farklıysa;
- insan koltuğundaki devlet Save8'de `ai:true` ise (`slot-state`).

Save8 dosyasına yeni alan eklenmedi.

Sınırlar (MP.4):

- jeton metada düz tutuluyor (yalnız host'ta); özetlenmeli;
- FNV-1a kriptografik değil.

## 7. MP.1+ için genişletme

- **Yeni komut:** `COMMANDS` tablosuna `keys`, `check`, `why`, `roots`, `apply` ile eklenir. `apply` motorun aktör parametreli fonksiyonudur.
- **Diplomasi komutları:** `offer`, `respond`, `vote`, `declareWar`, `vassal`, `spy`. Her biri `MULTIPLAYER-MP0-MIMARI.md` 5. bölümdeki kapıyı kullanır ve teklif kimliğiyle idempotent olur.
- **Taşıyıcı:** `send(conn,text)` arayüzü korunarak relay WebRTC DataChannel ile değiştirilebilir.
