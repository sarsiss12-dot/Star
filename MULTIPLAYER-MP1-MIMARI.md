# STARS — MP.1 mimarisi: telefon öncelikli oda kur / katıl

Durum: **geliştirme prototipi.** Kod yerelde ve gerçek Chromium süreçlerinde çalışıyor. **Hiçbir sunucuya dağıtılmadı.** İnternet adresi yok; fiziksel Android testi yapılmadı (NOT RUN).

- 19 runtime dosyası, Save8, build `96h10`, PWA önbelleği `stars-v96h10` ve `releases/stars-faz96h10.zip` değişmedi.
- MP.0 (`research/mp0/`) korunuyor: aynı çekirdek, aynı protokol, aynı testler (11/11 ve 20/20 PASS).
- MP.1, MP.0 çekirdeğine opt-in bir **lobi kipi** ekliyor. Yanında yeni bir relay (`research/mp1/server/relay.js`) ve telefon ekranları (`research/mp1/client/`) var.

## 1. Neden "host telefon + küçük internet relay'i"

Hedef: iki Android telefon. Kimse bilgisayar, terminal ya da Node kurmasın.

| Seçenek | Telefonda çalışır mı | Değerlendirme |
|---|---|---|
| Telefonda TCP/WebSocket sunucusu | **Hayır.** Android tarayıcı ve PWA dinleme soketi açamaz. | Elendi. |
| Yerel PC/Node sunucusu (MP.0 dev relay) | Telefonlar bağlanır, ama bir PC gerekir. | Hedefe aykırı; yalnız geliştirme için kaldı. |
| **İnternette küçük WSS relay (seçilen)** | Evet, yalnız tarayıcı yeter. | Host telefon simülasyonu yürütür. Relay oyunu anlamaz; yalnız odaya göre iletir, gönderici kimliğini damgalar ve sınırları uygular. Bir kez dağıtılması gerekir. |
| WebRTC DataChannel + sinyal sunucusu | Evet. | Eşler arası veri, ama yine bir sinyal sunucusu ister. NAT arkasında TURN gerekebilir (o da sunucu ve trafik maliyeti). MP.2+ için aday; relay ile aynı çekirdek protokolü taşıyabilir. |
| WebRTC + elle/QR eşleşme (sunucusuz) | Kuramsal olarak evet. | SDP teklif ve yanıtı iki yönde QR ile taşınır. Chrome yerel adayları mDNS (`*.local`) ile gizler; Android'de bu adların çözülmesi cihaza ve ağa bağlı. Denenmedi (NOT RUN). Gerçek "çevrimdışı LAN" için tek tarayıcı yolu bu. |

İnternet relay'i bağlantısı **çevrimdışı LAN değildir.** Telefonlar aynı Wi-Fi'da olsa da trafik relay'den geçer ve internet gerekir. MP.1 çevrimiçini önce yapıyor; gerçek LAN (QR/WebRTC) sonraki faza kaldı.

Lockstep yine reddedildi. MP.0, Chromium ve Node arasında aynı seed ve komutlarla koordinatların son basamağının farklı çıktığını ölçtü. Simülasyon yalnız host'ta çalışıyor.

## 2. Bileşenler

```
 Host telefon (gerçek STARS sayfası /)           Relay (Node, bağımlılıksız)          Misafir telefon (/mp/join)
 ┌────────────────────────────────┐   WSS   ┌──────────────────────────┐   WSS   ┌──────────────────────────┐
 │ 19 runtime dosyası (değişmez)  │◀──────▶│ oda kodu → {host, misafir}│◀──────▶│ view.js + join.js         │
 │ mp-core.js  (MP.0 + lobi kipi) │  T/K/C/X│ host anahtarı (SHA-256)   │  ham    │ motor YOK (G, monthTick,  │
 │ mp1-host.js (menü, lobi, yayın)│  J/L/F  │ boyut/hız/IP sınırları    │  JSON   │ setupGame tanımsız)       │
 │ view.js (ortak, kaçışlı HTML)  │  R      │ TTL, host bekleme süresi  │  H/R    │ yalnız kendi isteklerini  │
 └────────────────────────────────┘         └──────────────────────────┘         │ gönderir                  │
                                                                                 └──────────────────────────┘
```

- **Host sayfası:** relay `/` ve `/index.html` yanıtına MP.1 betiklerini enjekte eder. Dosyalar diskte değişmez; `index.html` baytları manifestle aynı kalır (test edildi).
  - PWA `start_url ./index.html` olduğundan ana ekran kısayolu da aynı sayfayı açar.
  - `sw.js` ağ-öncelikli. Çevrimdışıyken MP betikleri gelmez ve ÇOK OYUNCULU düğmesi görünmez. Tek oyunculu oyun etkilenmez.
- **Misafir sayfası** `/mp/join` oyun motorunu yüklemez. Yalnız `view.js` ve `join.js` gelir; sıkı CSP ile sunulur (`script-src 'self'`).
- **Relay** yalnız izinli dosyaları sunar: 19 runtime dosyası ve 5 MP betiği. Başka her yol 404 döner (`.git`, `tests/`, relay kaynağı, `/mp/stats`).

## 3. Çerçeveleme (MP.0 ile aynı, iki ek)

| Yön | Çerçeve | Anlam |
|---|---|---|
| relay → host | `J<conn>` / `L<conn>` / `F<conn>\n<metin>` | misafir katıldı / ayrıldı / misafir mesajı |
| host → relay | `T<conn>\n<metin>` / `K<conn>\n<neden>` | tek alıcıya veri / bağlantıyı kes (neden kapanış çerçevesinde de gider) |
| host → relay | **`C{"cap":n}`** (MP.1) | misafir kapasitesi (1–7). Relay `n` dolunca `room-full` (4005) der |
| host → relay | **`X`** (MP.1) | odayı kapat; herkes `room-closed` (4001) alır, kod mezar taşına girer |
| host → relay | **`A<anahtar>`** (MP.1, yalnız ilk çerçeve) | yeniden bağlanan host'un anahtarı. URL'de taşınmaz |
| relay → misafir | `H<metin>` / `R<json>` | host verisi / relay denetimi (`welcome`, `host-left`, `host-up`, `kicked`, `room-closed`, `error`) |

Misafir yalnız ham metin gönderir. Relay bunu `F<kendi conn kimliği>` ile host'a iletir. Misafir başka bir bağlantıya yazamaz; `T…` yazsa da host'a veri olarak gider (test edildi).

## 4. Oda, kimlik, yetki

- **Oda kodu:** 31 harfli karışmayan alfabeden (0/O/1/I/L yok) 8 sembol, ≈39,6 bit. `crypto.randomInt` ile üretilir, `XXXX-XXXX` gösterilir. Yazımda küçük harf, tire ve boşluk normalize edilir. Kapanan kod TTL boyunca mezar taşında kalır ve yeniden verilmez; eski kod "oda kapandı" der, "geçersiz" demez.
- **Host anahtarı:** 24 rastgele bayt (base64url), yalnız oda oluşturan bağlantıya bir kez verilir. Relay yalnız SHA-256 özetini tutar ve `timingSafeEqual` ile karşılaştırır.
  - Yeniden bağlanan host kodu URL'de, anahtarı **ilk çerçevede** gönderir. Böylece vekil ve CDN erişim günlüklerine düşmez.
  - Anahtar URL'de gelirse yok sayılır. 5 sn içinde çerçeve gelmezse ya da yanlışsa `bad-host-key` (4003); host bağlıyken ikinci host `host-exists` (4009).
  - **Kod tek başına host yetkisi vermez** (test edildi).
- **Oyuncu kimliği:** host çekirdeği her misafire `playerId` ve 128 bitlik `token` verir. Jeton yalnız o misafire gider ve misafir telefonunda `localStorage` `mp1:<kod>` altında saklanır.
  - Yeniden bağlanan misafir aynı koltuğa ve devlete döner (sayfa yenileme, ağ kesintisi; test edildi).
  - Başka bir oyuncunun jetonu, `playerId`'si ve host anahtarı hiçbir misafir paketinde yok (test edildi).
- **Kimlik bağlantıdan gelir.** Lobi mesajları (`presence`, `claim`, `ready`, `leave`) tam anahtar kümesiyle doğrulanır. `seat`, `playerId`, `empire` gibi fazladan alanlar `bad-<eylem>` ile reddedilir. Kimse başkasının hazır durumunu ya da devletini değiştiremez.
- **Yalnız host:** galaksi ayarı, kapasite, başlatma, devlet atama, çıkarma ve kapatma çekirdeğin host API'sidir; ağ tablosunda (`HANDLERS`) yoktur. Misafir `configure`, `start`, `kick`, `assign` yazarsa `bad-message` alır.
- **Sınırlar (relay):**

  | Sınır | Değer |
  |---|---|
  | Misafir mesajı / host mesajı | 8 KB / 256 KB |
  | Jeton kovası | misafir 20/sn (patlama 40), host 200/sn |
  | Kapatma | 100 düşen mesajdan sonra 4008 |
  | IP başı | 16 bağlantı, dakikada 30 katılım denemesi (kod tahmini) |
  | Oda | en çok 200 oda, TTL 12 saat; host düşerse 10 dk bekleme, sonra `host-timeout` |
  | Canlılık | 25 sn ping; 62,5 sn sessiz bağlantı kapanır (FIN göndermeden ağdan düşen telefon) |

  Lobi eylemleri çekirdekte ayrıca 10 sn'de 30 ile sınırlı.
- **Origin denetimi:** `MP1_ORIGINS` ayarlıysa yalnız o kökenler kabul edilir. Ayarlı değilse yalnız `Host` ile aynı köken ya da Origin'siz yerel araç geçer. Yabancı köken 403 alır.
- **XSS:** ağdan gelen her metin `MP1View.esc` ile basılır; renkler hex doğrulamasından geçer. İsimlerdeki `<`, `>` ve denetim karakterleri çekirdekte silinir, isim 24 karakterle sınırlıdır. `<img onerror>` adı yalnız metin olarak görünür (test edildi).
- **Günlük:** relay oda kodu, anahtar ya da jeton yazmaz; yalnız başlangıç satırı ve sayaçlar var (test edildi). `/mp/stats` yalnız `MP1_DEV=1` ile açılır ve sayaç dışında bir şey içermez.

## 5. Lobi durum makinesi (`mp-core.js`, `opts.lobby`)

```
created ──configure──▶ waiting ◀──(hazır bozulur / ayar değişir)──▶ ready ──start──▶ starting ──▶ ingame ◀──▶ paused
   │                      │                                           │                             (host relay'den düştü)
   └──────────────────────┴──────────── close ─────────────────────────┴──────────────────────────────▶ closed
```

- `ready` ayrı bir durum değil, `waiting` iken `canStart()` doğruysa yayımlanan görünümdür.
- `canStart` nedenleri: `no-galaxy`, `no-guests`, `guest-offline`, `guest-no-empire`, `guest-not-ready`, `not-claimable`, `already-started`.
- `start()` bir kez uygulanır. İkinci çağrı `already-started` döner; çift dokunma testte tek başlangıç üretti.
  - Atama yarıda kalırsa önceki atamalar AI'ya iade edilip `waiting`'e dönülür.
- Host galaksiyi yeniden kurunca (`configure`) bütün misafirlerin devlet seçimi ve hazır durumu sıfırlanır.
- Oyun başladıktan sonra:
  - yeni oyuncu `game-started` alır;
  - `claim`, `ready` ve `leave` `phase` ile reddedilir;
  - koltuk–devlet eşlemesi sabittir.
- İstemci tarafı ek durumlar:
  - bağlanıyor, bağlantı koptu → yeniden bağlanılıyor (üstel bekleme);
  - host yok (oyun duraklatıldı), oda dolu, geçersiz kod, oda kapandı, çıkarıldın.
  - Kapanış kodu nihai kabul edilir. Neden çerçevesi yolda kaybolsa da sayfa sonsuz yeniden deneme döngüsüne girmez (150 ms gecikmeli koşuda bulunup düzeltildi).

## 6. Koltuk kuralları

| Kural | Uygulama | Test |
|---|---|---|
| 1 oyuncu = 1 devlet | `claim` tek değer; değişince eskisi bırakılır | PASS |
| İki insan bir devlette olamaz | `taken`; ekranda DOLU | PASS |
| Host'un devleti verilemez | `host-empire`; listede yok | PASS |
| Vahşi, kriz ve ölü devlet seçilemez | `claimable()`: `ai===true`, `!dead`, `!wild`, `!crisisSide`; vahşi devlet 6 → `not-claimable` | PASS |
| Bağlantısı kopan oyuncunun koltuğu korunur | jetonla aynı koltuk ve devlet; host panelinde "koptu — koltuk bekletiliyor" | PASS |
| Oda kapanmadan çıkarma | `kick` jetonu yasaklar; aynı jetonla dönüş `kicked` | PASS |
| Devlet değişince hazır sıfırlanır | `setClaim` | PASS |
| Başlangıçtan sonra eşleme sabit | `phase` reddi | PASS |
| Ayrılan oyuncunun devleti kendiliğinden el değiştirmez | host üç seçenekten birini seçer: bekle / çıkar (devlet boşta, `ai=false`) / **Devleti AI'ya ver** (`release`: `ai=true`, otomasyon geri) | PASS (AI'ya ver) |

## 7. İnsan / AI ayrımı

- `isHumanActor(e) = e.ai===false && !e.wild && !e.crisisSide`.
  - Kimlik numarasına bakmaz; motorun kendi bayrağını kullanır.
  - Tek oyunculu oyunda 5 seed × 120 ay boyunca her ay sonu yalnız devlet 0'ı verir. `id===0` ile birebir aynı sonuç.
- `aiTurn`, `aiDirectiveTick`, ordu, terhis ve ticaret AI döngüleri zaten `e.ai` istiyor. Atama `ai=false` yapınca AI o devleti oynamıyor.
  - Tarayıcı testi: 4 ay boyunca insan devletleri 0, 3, 4, 5 için sıfır `aiTurn`. AI devletleri ve vahşi taraf oynamaya devam etti.
- `aiNegotiate` (`ai.js`, id 0 için boş) ve doğrudan `aiRespond` çağrıları çekirdekteki korumayla uzak insan için de karar vermiyor: `remoteHuman(e) = isHumanActor(e) && e.id!==hostEmpireId`.
- `UI.aiOffer` ve federasyon gelen kutusu yalnız host'un (`G.emps[0]`) arayüzüne bağlı.
  - Uzak insana gelen AI teklifi karara bağlanmıyor; federasyon oylarında insan üye bekliyor ve süre dolunca çekimser sayılıyor.
  - **İnsan–insan teklifleri ve uzak insanın gelen kutusu MP.2 kapsamı.** Diplomasi yeniden yazılmadı.

## 8. Oyuncu başına görüş

- `actorVision(e)`, `updateVision`'ın BFS'sinin devlete genel kopyası:
  - kendi sistemleri ve filoları;
  - `sensor` menzili, bulutsu engeli, `panopt` sivili.
  - Yerel oyuncu için 5 seed × 120 ayda `G.vis` ile birebir aynı.
- `observeHumans()` her ay sonunda (ve başlangıçta) yalnız **uzak insan** devletleri için görülen sistemlere `s.seen`'e o devletin kimliğini yazar. `updateVision` aynısını yalnız oyuncu 0 için yapıyordu; uzak insanın keşif belleği böylece oluşuyor.
  - Tek oyunculu oyunda ve uzak insan yokken hiçbir şey yazmaz: aynı Save8 baytları, 120 gün (test edildi).
  - RNG çekmez. Yeni Save alanı yok; `seen` dizisi zaten Save8'de.
- Misafir görünümü (MP.0 `viewFor`):
  - bilinen sistemler (`explorationContext(e).known`);
  - görünür yabancı filolar (yalnız kimlik, devlet, sistem, ad);
  - temas kurulan devletler (ad, renk, ilişki, savaş);
  - yalnız kendi ekonomi, koloni ve kuyruk verisi.
- Lobi gizliliği:
  - **Tohum misafire hiç gönderilmez.** Tohum ve açık motor kodu bütün galaksiyi yeniden kurdururdu; bulunup düzeltildi. Misafir yalnız boyut, AI sayısı ve şekli görür.
  - Oyun başlayınca lobi devlet listesi yalnız insanların devletlerine iner. Temas kurulmamış AI devletlerinin adları oyun içi paketlerde yok (test edildi).
- Tarayıcı ölçümü: üç misafirin her paketi tarandı.
  - Bilinmeyen 31–36 sistemin adı yok; temas kurulmamış devlet adı yok.
  - Başka oyuncunun kimliği ya da jetonu yok; `aiStrategy`, `spy`, `intel`, `seen`, `surv`, `rs`, `seed`, `token` alanları yok.
  - En büyük paket 4,4 KB; Save8 130 KB.

## 9. Kurulum sekmeleri (presence)

- Sekmeler: Lobi, Doktrin, Görünüş, Fizyoloji, Etik, Civic, Köken, Galaksi ayarları ve oyunda "Oyunda".
- Her oyuncunun açık sekmesi lobi listesinde herkese görünür (`presence`). Değişince yayımlanır; aynı değer yeniden yayımlanmaz.
- Presence Save8'e ve RNG'ye dokunmaz (test edildi). Yalnız sekme adını taşır, taslak içeriği taşımaz. Oyun içi sekmeler için de aynı mesaj kullanılabilir.
- **Kapsam dışı (MP.2):** misafirin doktrin, görünüş, fizyoloji, etik, civic ya da kökenini özelleştirmesi.
  - MP.1'de misafir host'un kurduğu galaksideki gerçek bir AI devletini seçiyor ve sekmelerde o devletin gerçek özelliklerini salt okunur görüyor.
  - Bu özellikler yalnız kendi seçtiği devlet için gelir.
  - Host'un kendi devleti tek oyunculu YENİ OYUN tercihlerinden gelir.

## 10. Üretime çıkış için gerekenler (yapılmadı)

Relay internete açılabilecek biçimde sertleştirildi ama **dağıtılmadı.** Açmadan önce:

1. **TLS zorunlu.**
   - Ya önünde HTTPS→WSS yapan bir platform ya da ters vekil, ya da `MP1_TLS_CERT` / `MP1_TLS_KEY` (test edildi; kendinden imzalı sertifikayla).
   - TLS'siz internete açılmamalı. MP.0 `dev-relay.js` hiçbir koşulda internete açılmamalı.
2. `MP1_ORIGINS=https://<gerçek-alan>` ayarlanmalı.
3. Vekil arkasında `MP1_TRUST_PROXY=1`. Yoksa bütün telefonlar vekilin IP'siyle tek IP sınırına düşer. Yalnız güvenilen vekilde açılmalı: son `X-Forwarded-For` girdisi kullanılır (test edildi).
4. `MP1_BIND=0.0.0.0` yalnız vekil ya da TLS ile birlikte.
5. İzleme: yalnız sayaçlar. Oda kodu, anahtar ve jeton günlüğe yazılmamalı. Platformun erişim günlüğü URL'deki oda kodunu görebilir; anahtar URL'de değil.
6. Kapasite: tek Node süreci, oda başına yalnız iletme (simülasyon yok). Ölçüm aşağıda ve `MULTIPLAYER-MP1-SONUC.md`'de.
7. Kalıcılık yok. Relay yeniden başlarsa odalar kaybolur. Host oyunu kendi telefonunda sürdürür; Save8 + MP.0 oturum metasıyla yeni odada aynı koltuklar geri yüklenebilir (MP.0'da test edildi; MP.1 arayüzünde yok).

### Sunucu ihtiyacı ve maliyet tahmini (ölçüme dayalı, fatura değildir)

- **Misafir başına trafik:**
  - oyun ayı başına ~1,2 KB (ölçüldü);
  - canlı oyunda hız 3'te ~1,5 KB/sn (MP.0 ölçümü);
  - lobi paketi ort. 1,3 KB.
- **Host yükleme hızı,** misafir sayısı kadar. 4 kişilik odada canlı oyunda ~4,5 KB/sn.
- **100 eşzamanlı 4 kişilik oda (300 misafir):** relay çıkışı ~0,45 MB/sn (~3,6 Mbit/sn), girişi de aynı kadar (host'lardan). 1 vCPU / 512 MB'lik en küçük sanal sunucu sınıfı yeter. Relay yalnız metin iletiyor; ölçülen bellek ve CPU çok düşük.
- **Ay boyu sürekli olsa** ~1,2 TB çıkış. Gerçekçi kullanım (günde birkaç saat, birkaç oda) GB düzeyinde.
- Küçük VPS ya da konteyner platformlarının en alt planı genellikle ayda birkaç dolar ya da avro düzeyinde. Bazı platformlar ücretsiz katman sunar ama uyku/soğuk başlangıç WebSocket'i koparır. **Sağlayıcı seçilmedi, dağıtım yapılmadı, URL yok.**
