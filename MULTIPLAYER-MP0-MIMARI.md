# STARS MP.0 — Multiplayer mimarisi

**Durum: araştırma ve izole prototip.**

- Oynanabilir sürüm 96H.10 olarak kalıyor: build `96h10`, PWA `stars-v96h10`, Save v8.
- 19 runtime dosyası ve oyun ZIP'i değişmedi.
- Prototip `research/mp0/` altında. Testler: `tests/mp0_core_test.js`, `tests/browser-mp0.cjs`.
- Bu belge mimari kararı ve motor denetimini anlatır.
- İlgili belgeler: protokol `MULTIPLAYER-MP0-PROTOKOL.md`, sonuçlar `MULTIPLAYER-MP0-SONUC.md`.
- İlgili görevler: #6 (multiplayer), #7 (kayıttan oturum sürdürme). #5 (devlet isimleri) ve #8 (casusluk ekranı) ayrı fazlar; MP.0 onlara dokunmaz.

## 1. Motorun tek oyunculu varsayımları (gerçek kod)

Dosya başına sayım (96H.10, `f603975`):

| Dosya | `G.p` | id 0 karşılaştırması | `emps[0]` | `.ai` dalı |
|---|---|---|---|---|
| ui.js | 263 | 59 | 0 | 1 |
| diplomacy.js | 41 | 152 | 5 | 22 |
| main.js | 42 | 29 | 6 | 31 |
| ai.js | 22 | 35 | 2 | 34 |
| economy.js | 5 | 53 | 0 | 19 |
| map.js | 25 | 15 | 0 | 0 |
| inbox.js | 32 | 0 | 0 | 0 |
| commerce.js | 4 | 14 | 0 | 4 |

### A. Motor neden tek yerel oyuncu varsayıyor?

**1. Oyuncu sabit nesne ve sabit kimlik.**

- `setupGame` oyuncuyu `makeEmpire(0, …, ai=false)` ile kuruyor ve `G.p = pe` yapıyor (`main.js:2495`).
- `applySaveData` her yüklemede `G.p = G.emps[0]` yapıyor (`main.js:7922`).
- "İnsan" iki ayrı yoldan tanınıyor:
  - **kimlikle** (`id === 0`): diplomasi kararları ve bildirimler;
  - **bayrakla** (`!e.ai`): araştırma modu, koloni ve tahtla ilgili `say()` mesajları, filo adları.

**2. Görüş yalnız oyuncu için tutuluyor.**

- `updateVision()` (`main.js:3664`) her ay yalnız `G.p` için sensör taraması yapıyor. Sonucu `G.vis` ve `s.seen` içinde id 0 olarak yazıyor.
- `pSeen`, `pVis` ve `pSurv` (`main.js:3749–3761`) yalnız 0'a bakıyor.
- AI için aktörden bağımsız bir bilgi modeli zaten var:
  - `explorationContext(e)` (`main.js:3975`): bilinen ve görünür kümeler;
  - `aiView` / `aiObserve` (`ai.js:26–48`, 95A): son gözlem kayıtları.

**3. Arayüz tek kişilik.**

- `View.selSys`, `UI.pendingOffer`, modallar ve kamera global.
- `frame()` (`main.js:9030`) tick ile çizimi aynı döngüde yürütüyor.

**4. AI kararları oyuncuyu id ile dışlıyor.**

- `aiNegotiate` yalnız `proposer.id === 0 || target.id === 0` durumunda karar vermiyor (`ai.js:2141`).
- Oyuncuya müzakere teklifi doğrudan `G.emps[0]`'a ve `UI.aiOffer`'a gidiyor (`ai.js:1844`).
- Federasyon gelen kutusu `target === 0` ya da `members.includes(0)` ile açılıyor (`diplomacy.js:2414`).

### B. `G.p` değiştirilirse ne bozulur?

`G.p` 400'ü aşkın yerde okunuyor. Başka bir devlete işaret ettirmek şunları bozar:

- **Harita ve görüş:** `updateVision` ve `pSeen` kimlik olarak 0 kullanıyor. `G.p` başka devleti gösterse bile `s.seen.includes(0)` aranıyor; görüş yanlış devletin olur.
- **Arayüz:** `ui.js`'in 263 `G.p` kullanımı (koloni panelleri, inşa, araştırma, filo emirleri) host'un kendi devleti yerine diğerini yönetir.
- **Diplomasi:** 152 id-0 dalı (bildirim, gelen kutusu, "oyuncunun açık onayı") eski oyuncuda kalır. Yeni `G.p` ne teklif görür ne karar verebilir.
- **Kayıt:** `deserialize` sonrası `G.p` yine `emps[0]` olur. Oturumda yapılan değişim kalıcı değildir.

Sonuç: `G.p` tek bir "yerel görünüm" işaretçisi olarak kalmalı. Çok oyunculu yetki `G.p`'ye değil, oturum eşlemesine (`playerId → empireId`) dayanmalı. Bu yüzden MP.0'da host `G.p = emps[0]` olarak kaldı; uzak oyuncu `G.p`'yi hiç kullanmıyor.

### C. İnsanın yönettiği AI devleti AI döngüsünden nasıl çıkar?

Motorun kendi bayrağı `e.ai` kullanıldı. MP.0'da `assign` şunları yapar:

1. `e.ai = false` ayarlar.
2. Devralınan koloni otomasyonunu kapatır (`col.auto = false`); eski değerleri AI'ya iade için saklar.
3. `AI_VIEW_CACHE`'i temizler.

`e.ai` isteyen döngüler artık o devleti işlemiyor:

- `aiTurn` (`main.js:9115`);
- `aiDirectiveTick`;
- ordu, terhis ve ticaret AI'sı (`commerce.js:255–265`);
- vasallık müzakeresi (`diplomacy.js:10133`);
- federasyon AI oyu (`diplomacy.js:2309`).

Test: 6 ayda 30 AI turunun hiçbiri devlet 3 için çalışmadı. Devlet 3 hiçbir anlaşmaya taraf olmadı. Otomasyonu kapalı kaldı.

**Kalan açık: kimlikle karar veren yollar.** `aiNegotiate` yalnız id 0'ı dışladığı için `e.ai=false` tek başına yetmiyor; AI, uzak insanın adına `aiRespond` ile cevap verirdi. MP.0 host'u iki noktayı sarar:

- `aiNegotiate` uzak insan için oyuncuyla aynı boş sonucu döndürür;
- `aiRespond` uzak insan için `bekle` döndürür.

Bu bir köprü çözümüdür. MP.2'de bu kontrollerin `isHumanActor(e)` gibi tek bir yüklemle motorun içine taşınması gerekir.

### D. Simülasyon tek cihazda hesaplanıp sonuç dağıtılabilir mi?

Evet. Prototip bunu iki ayrı Chromium sürecinde gösterdi:

- Host gerçek oyun sayfasında `setupGame` ve tick zincirini çalıştırıyor.
- İstemci sayfası motoru hiç yüklemiyor: `G`, `monthTick`, `dailyTick`, `setupGame`, `serialize` tanımsız. Tek betiği `mp-client.js`.
- İstemci yalnız filtreli görünüm alıyor.
- Host'un 15/30/45. günlerdeki saati istemcide birebir görüldü.

### E. Oyun hızı ve RNG neden her istemcide bağımsız çalışmamalı?

**1. Ölçülen kayan nokta farkı.** Aynı seed ve aynı komutlarla Chromium host'u ile Node v22 karşılaştırıldı:

- RNG durumu ve bütün oyun alanları aynı;
- 39 sayısal alan (galaksi koordinatları) yalnız son ondalık basamakta farklı (göreli ≤ 2,2e-15).

Bu fark bilinen `faz95d` ortam FAIL'iyle aynı türden. Kilitli adım (lockstep) simülasyonu farklı JS motorlarında bayt-bayt aynı kalmaz. Sapma, menzil eşiği ya da sıralama karşılaştırması gibi bir noktada oyun kararına dönüşebilir.

**2. Diğer nedenler.**

- `frame()` gerçek zamanlı `dt` ile ilerliyor: kare hızı cihaza göre değişiyor.
- `rnd()` tek global durum (`RND_STATE`) ve tüketim sırası olaylara bağlı. İki cihazda farklı sıradaki tek bir komut bile dünyayı ayırır.

**3. Sonuç.** Zaman, RNG ve AI yalnız host'ta çalışır. İstemciye sonuç gider.

### F. Aktör kimliğine göre yeniden düzenlenmesi gereken işlemler

Doğrudan uygulanabilir olanlar (aktör parametreli ve kendi kuralı olan):

- `queueBuilding`, `setFocus`, `cancelBuild` (MP.0'da bağlandı);
- `queueDemolish`, araştırma (`researchMode`);
- `castFedVote(e,fid,token,yes)`: çift oy koruması `waiting.includes(e.id)`;
- `requestFederation(e,via)`, `vassalOffer(e,o,…)`;
- `runOp(e,target,key)`: `opQuote` kapısı;
- `declareWar(a,b)`, `makePeace`.

Yeniden düzenlenmesi gerekenler:

- id-0 kararları: `aiNegotiate`, `UI.aiOffer`, federasyon gelen kutusu, `DiplomaticInbox.settleSource` çağrıları.
- `!e.ai` ile gösterilen `say()` bildirimleri: bunlar host'un günlüğüne düşüyor, uzak oyuncunun kutusuna değil.
- Uzak insan için görüş belleği: `updateVision` eşdeğeri `s.seen` yazımı.

### G. Gizli bilgi diğer oyunculardan nasıl korunur?

- İstemciye `serialize()` gitmez.
- Host, oyuncunun devleti için `explorationContext` + `s.surv` + `e.contact` ile görünüm kurar:
  - **Bilinen sistem:** ad, yıldız, şerit.
  - **Görünür sistem:** sahip.
  - **Taranmış sistem:** gezegen türü ve boyutu.
  - **Bilinmeyen sistem:** yalnız `{i,x,y}`. Tek oyunculu haritada da bilinmeyen yıldızlar soluk nokta olarak çiziliyor (`map.js:1921`); kamu coğrafyası.
  - **Yabancı filo:** yalnız görünür sistemdeyse ya da görünür şeritte hareket ediyorsa; yalnız `{id,e,s,n}`.
  - **Temas kurulan devlet:** yalnız `{id,n,col,war,rel}`. Kaynak, teknoloji ve strateji gitmez.
- Relay her paketi tek alıcıya yönlendirir. Bir istemci başka bağlantıya yazamaz.
- Sınır: host gerçek dünyayı bellekte tutar. Arkadaşlar arası host modelinde host'a güvenilir. Hile direnci gerekiyorsa ayrılmış sunucu (bkz. 3. bölüm).

### H. Save8'den oturum devamı için ne kullanılabilir?

Save8 içinde zaten var olanlar:

- sabit devlet id'leri;
- `e.ai` (insan koltukları `false`);
- `seed`, `day`, `rs` (RNG), bütün dünya.

Save8 içinde olmayanlar ve ayrı sürümlü meta (`mpMeta:1`) içinde tutulanlar:

- `saveId`, `roomId`, `worldRevision`;
- `playerId → empireId`;
- yeniden bağlanma jetonu, `lastSeq`;
- erişim modu (özel/LAN/online), hız.

Meta, Save8 metninin özetine (`saveHash`) bağlıdır. Yanlış kayıtla devam reddedilir.

Test: host kapandı, aynı Save8 + meta ile yeniden açıldı. İkinci oyuncu jetonuyla aynı oyuncu ve aynı devlete döndü; komutları yeniden çalıştı.

## 2. Ağ teknolojileri

| Ölçüt | A. WebRTC DataChannel | B. WebSocket sunucusu/relay | C. Yerel LAN |
|---|---|---|---|
| Tarayıcıda çalışır mı | Evet (Android Chrome dahil) | Evet (istemci olarak) | Tarayıcı TCP/WebSocket **sunucusu açamaz** |
| Gerekli altyapı | Signalling sunucusu + STUN; NAT'ların bir kısmı için TURN | Sürekli çalışan sunucu (TLS'li `wss://`) | Ağda sunucu görevi yapacak bir süreç: masaüstü uygulama, yerel Node hizmeti ya da yerel relay |
| Gecikme | En düşük (eşler arası) | Bir sunucu sıçraması | Yerel ağ |
| Gizlilik | DTLS uçtan uca; sunucu yalnız signalling görür | TLS; relay düz içerik görür (uçtan uca şifreleme ayrıca gerekir) | Yerel ağ |
| İşletme maliyeti | Signalling ucuz; TURN bant genişliği ücretli | Sunucu + bant genişliği | Yok, ama kurulum gerekir |
| Kurulum kolaylığı | Orta (ICE, bağlantı başarısızlıkları) | Kolay | Zor: keşif (mDNS/QR) ve izinler |
| Mobil | Arka planda kopma, TURN gerekebilir | Arka planda kopma; yeniden bağlanma gerekir | Android PWA kendi başına dinleyemez |
| Host düşerse | Oda biter (host yetkili) | Relay odayı tutabilir; host dönmeli | Oda biter |

**Karar.** Mantıksal mimari host-yetkili; taşıyıcı değiştirilebilir. Çekirdek (`mp-core.js`) yalnız `send(conn,text)` alır.

- **MP.0:** yerel geliştirme WebSocket relay'i (`research/mp0/server/dev-relay.js`). Harici bağımlılık yok, `127.0.0.1`'e bağlı. TLS, kimlik doğrulama ve hız sınırı yok. Üretim hizmeti değildir.
- **Önerilen yol:**
  - internet için `wss://` relay + oda kodu (en basit, Android'de güvenilir);
  - gecikme ve gizlilik için ikinci aşamada WebRTC DataChannel (signalling aynı relay, TURN yedeği);
  - LAN için tarayıcı dışında bir yerel hizmet (masaüstü/yerel Node relay) ve oda kodu ya da QR ile adres paylaşımı. Kendiliğinden LAN keşfi vaat edilmez.

## 3. Seçilen mimari: host-yetkili

```
 [Host tarayıcısı: gerçek STARS]            [Relay]                [İstemci tarayıcısı]
  frame/dailyTick/monthTick/aiTurn  ◄──F conn\n cmd── ham metin ──── MPClient.send(cmd)
  mp-core: oturum → empireId          ──T conn\n paket──► H paket ──► filtreli görünüm (snapshot/delta)
  COMMANDS → queueBuilding …                 ▲ gönderici kimliğini relay damgalar
  viewFor(e) → filtre → delta                └ R denetim: welcome / host-left / host-up / kicked
```

- **Host:** galaksi, zaman, AI, RNG, komut doğrulaması, kanonik Save8 ve oturum metası.
- **İstemci:** kendi devletinin arayüzü ve komut gönderimi. İkinci simülasyon yok.
- **Yetki:** istemcinin gönderdiği `empire` alanı kullanılmaz; uyuşmazsa reddedilir. Kimlik relay'in damgaladığı bağlantıdan ve host'un verdiği jetondan gelir.
- **Host ayrılırsa:** istemciler duraklama durumuna geçer; komut gönderilemez, saat ilerlemez. Host aynı Save8 ve meta ile dönünce `host-up` gelir; istemci jetonuyla aynı koltuğa bağlanır.
- **Host devri:** yok (MP.4 araştırması).

## 4. Oyuncu ve devlet kimliği

| Kimlik | Kaynak | Not |
|---|---|---|
| `roomId` | host (URL/oda kodu) | relay odası |
| `hostId` | host oturumu | MP.0'da `host` |
| `playerId` | host (`p-` + 6 rastgele bayt) | kişi; devlet değil |
| `token` | host (16 rastgele bayt) | yeniden bağlanma; yalnız sahibine gider |
| `empireId` | oyun (`G.emps[i].id`) | değişmez; Save8 ile aynı |

Kurallar:

- Bir oyuncunun en fazla bir devleti olur: `player-has-empire`.
- Bir devletin en fazla bir oyuncusu olur: `taken`.
- Host'un devleti alınamaz: `host-empire`.
- Ölü, vahşi ya da kriz tarafı devlet atanamaz.
- `release(empireId, toAI)` devleti AI'ya iade eder: `e.ai` ve otomasyon geri yüklenir.
- Bağlantısı kopan oyuncunun koltuğu saklıdır; devlet boşta kalır ve AI'ya geçmez. AI'ya devir açık bir host kararıdır.

## 5. Diplomasi: aktör-yetki matrisi (MP.2 sözleşmesi)

"Aktör", host'un oturumdan belirlediği devlettir. Her eylem host'ta mevcut kanonik kapıdan geçer. Hiçbir insan kararı AI tarafından verilmez.

| Eylem | Aktör | Hedefte karar veren | Motor kapısı | Çift uygulama koruması |
|---|---|---|---|---|
| Ticaret teklifi | gönderen insan | alıcı insan (gelen kutusu) ya da AI (`aiRespond`) | `dealQuote` → `executeDeal` (işlem + geri alma) | teklif kimliği; `DiplomaticInbox` arşiv durumu (`pending` değilse `executeDeal` false); komut `cid` |
| Karşı teklif | alıcı | ilk gönderen | `dealQuote` | yeni teklif kimliği; eski teklif `countered` |
| Kabul / ret | yalnız alıcı | — | `executeDeal` | durum `pending` → `accepted/rejected` bir kez |
| Barış teklifi | savaşan taraf | karşı taraf | `peace` maddesi / `makePeace` | teklif kimliği |
| Savaş ilanı | ilan eden | tek taraflı | `canDeclareWarOn` (federasyon izni, vasal rızası) → `declareWar` | aynı çift için savaş zaten varsa reddedilir |
| Federasyona giriş | başvuran | üyeler (oy) | `canRequestFederation` → `requestFederation` | `requestAfter` soğuması |
| Federasyon oyu | üye | — | `castFedVote(e,fid,token,yes)` | `waiting.includes(e.id)`: ikinci oy reddedilir; oy jetonu |
| Vasallık teklifi / talebi | senyör ya da vasal | karşı taraf | `vassalOffer`, `vassalTalkValid` | `vassalTalk.status==='pending'` tekil |
| Bağımsızlık | vasal | tek taraflı / savaş | mevcut bağımsızlık yolu | durum geçişi bir kez |
| Ortak sefer | teklif eden | katılan insanlar ayrı ayrı | `jointCreate` + kapılar | plan kimliği |
| Casusluk | operatör | — | `opQuote` → `runOp` | komut `cid`; maliyet önce `opQuote` ile sınanır |

Kural:

- Bir oyuncu başka devlet adına eylem gönderemez; aktör paketten değil oturumdan gelir.
- İnsanın aldığı her teklif onun gelen kutusuna gider; AI onun adına cevap vermez.
- Teklif taslakları ve casusluk hedefleri yalnız aktörün kendi görünümünde bulunur.
