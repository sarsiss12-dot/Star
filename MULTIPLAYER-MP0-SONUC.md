# STARS MP.0 — Sonuç

**Karar: çalışan, test edilmiş, izole bir host-yetkili prototip teslim edildi. Oynanabilir multiplayer sürümü değildir.**

- Oyun 96H.10 olarak kalıyor: build `96h10`, PWA `stars-v96h10`, Save v8, `releases/stars-faz96h10.zip`.
- Hiçbir runtime dosyası değişmedi.
- Mimari: `MULTIPLAYER-MP0-MIMARI.md`. Protokol: `MULTIPLAYER-MP0-PROTOKOL.md`. Kanıt: `research/mp0/`.

## 1. Kanonik başlangıç

| | Değer |
|---|---|
| `main` HEAD | `f6039752cf6ca699eb3ae30ff22e106bd7fe9e6c` |
| ZIP SHA-256 | `78e76d1627b8ec1b990849b2242835f78667f110e1d6f17021760183ee7be6d0` |
| ZIP dosya CRC32 | `cf97cc3a` |
| ZIP girdisi | 20 (19 runtime + manifest) |
| Kontrol | ZIP içi CRC'ler doğru; ZIP manifesti = ağaç manifesti; 19 dosyanın SHA'sı ZIP ve ağaçta eşleşiyor |

## 2. Prototip

- **Relay:** iki ayrı Chromium süreci ayrı `--user-data-dir` profilleriyle, gerçek WebSocket trafiğiyle bağımlılıksız yerel relay üzerinden haberleşiyor.
- **Host sayfası:** gerçek STARS sayfası (`/mp/host` = `index.html` + enjekte edilen iki MP betiği). Gerçek seed11 galaksisi: 45 sistem, 7 devlet. Host oyuncusu devlet 0.
- **İkinci oyuncu:** ayrı tarayıcı sürecinde, motor yüklemeyen istemci sayfası. Host ona devlet 3'ü atadı.
- **Komut zinciri:** istemci sayfasındaki gerçek "İnşa et" düğmesi → host `queueBuilding` → kanonik kuyruk ve kaynak değişti → istemci görünümü güncellendi.

## 3. Testler

| Test | Sonuç |
|---|---|
| `tests/mp0_core_test.js` (gerçek motor, Node vm) | **PASS 11/11** |
| `tests/browser-mp0.cjs` (iki Chromium süreci + üçüncü bağlam) | **PASS 20/20**, sayfa hatası 0 |
| `tests/browser-mp0.cjs`, relay'de 60 ms yapay gecikme (`MP_DELAY_MS=60`) | **PASS 20/20** |
| `tests/browser-96h10.cjs` (mevcut Chromium/PWA regresyonu) | **PASS 27/27** |
| Tam regresyon `node tests/run-all.js` | 140 paket, **6120 PASS / 3 FAIL**. 3 FAIL bilinen `faz95d_identity_test.js` seed 11/99/404. 96H.10 tabanı 139/6109/3 + yeni paket 11 PASS |
| Gerçek Wi-Fi LAN (iki fiziksel cihaz) | **NOT RUN** |
| İnternet üzerinden (farklı ağlar, NAT, TURN) | **NOT RUN** |
| Fiziksel Android cihaz | **NOT RUN** |

### `browser-mp0.cjs` kabul kontrolleri

1. `/` adresi MP kodu yüklemiyor. Relay'in sunduğu 19 runtime dosyası manifestle bayt-bayt aynı.
2. Host gerçek seed11 galaksisini kuruyor ve relay'e kaydoluyor.
3. İstemci oyuncu kimliği alıyor, devlet almıyor.
   - Sayfada `G`, `monthTick`, `dailyTick`, `setupGame`, `serialize` tanımsız; tek betik `mp-client.js`.
   - Devlet atanmadan gönderilen komut: `no-empire`.
4. Host devlet 3'ü atıyor. İstemcinin bildiği sistem kümesi host'un `explorationContext(G.emps[3]).known` kümesine eşit. Koloniler aynı.
5. Gün 15/30/45'te istemci saati host saatine eşit.
6. Gerçek inşa: kaynak tam bedel kadar düşüyor, kuyruk +1 artıyor; istemci aynı kuyruğu ve kaynağı görüyor. Komut RTT 10 ms (yerel) / 132 ms (60 ms gecikmeli relay).
7. Aynı `cid`'li paket iki kez gönderildi: bir kez uygulandı, ikinci yanıt `dup`.
8. Reddedilen komutlar:
   - başkasının gezegeni (`not-owner`);
   - sahte devlet kimliği (`forged-empire`);
   - bilinmeyen tür (`unknown-kind`);
   - `__proto__` anahtarı (`bad-params`);
   - teknoloji kuralı (`rules:tech`);
   - eski sıra (`stale-seq`);
   - bozuk JSON (`bad-json`);
   - 10 KB paket (`too-big`).

   Toplu saldırıdan sonra host `serialize()` bayt-bayt aynı.
9. Üçüncü, ayrı depolamalı bağlam:
   - sahte jetonla yeni ve yetkisiz bir oyuncu oluyor;
   - devlet 3'ün gezegenine komutu `no-empire` ile reddediliyor;
   - host devlet 3'ü ona atayamıyor (`taken`), host devletini de (`host-empire`);
   - paketlerinde ikinci oyuncunun jetonu ya da kimliği yok.
10. Host'un kanonik sonucu, host günlüğünün Node vm'de düz motorla yeniden oynatılmasına eşit:
    - RNG durumu aynı; bütün oyun alanları aynı;
    - yalnız 39 koordinat son ondalık basamakta farklı (göreli ≤ 2,2e-15; bkz. 6. bölüm).
11. Gerçek zamanlı döngü: hız 3'te 4 saniyede 18 oyun günü geçti; istemci saati host'u izledi.
12. Kayıp delta güvenli yeniden eşitleme tetikledi. Eski paket yok sayıldı. Son istemci görünümü host'un taze filtreli görünümüne JSON olarak eşit.
13. AI insan adına hareket etmiyor (6 ay): 30 AI turunun hiçbiri devlet 3 için çalışmadı; devlet 3 hiçbir anlaşmaya taraf olmadı; otomasyon kapalı.
14. Sızıntı taraması, ikinci oyuncunun aldığı 48 paketin hepsinde:
    - devletin hiç bilmediği 36 sistemin adı yok;
    - temas kurulmamış devlet adı yok;
    - AI, casusluk ya da günlük alanı yok;
    - başka oyuncu kimliği yok;
    - en büyük paket 4,6 KB, tam Save8 192 KB.
15. Sayfa yenilendi: aynı oyuncu, aynı devlet, tam snapshot; sıra numarası devam etti.
16. Host kapandı:
    - istemci "Host bağlı değil — oyun duraklatıldı" gösteriyor;
    - komut gönderilmiyor (`host-yok`);
    - 2,5 saniyede saat değişmedi (yerel simülasyon yok).
17. Host aynı Save8 + ayrı oturum metası ile yeniden açıldı:
    - aynı oyuncu aynı devlete ve aynı güne döndü;
    - inşa ve iptal tam iade ile çalıştı;
    - üçüncü bağlam devletsiz kaldı.
18. Performans örneği alındı (5. bölüm).
19. Telefon 390×844 ve 844×390: dokunma hedefleri ≥ 44 px, yatay taşma yok.
20. Host, istemci ve üçüncü bağlamda yakalanmamış sayfa hatası yok.

### `mp0_core_test.js`

- Görünüm ve yayın salt okunur: Save8 baytları ve RNG değişmiyor.
- İnsan oyuncusu olmayan MP host'u düz motorla 120 ayda aynı Save8'i üretiyor.
- Ağ komut yolu (reddedilen, tekrar ve eski trafikle birlikte) doğrudan motor çağrısıyla 120 ayda aynı Save8'i üretiyor.
- Yönlendirici şunları reddediyor: bilinmeyen tür, sürüm, `eval`, `constructor`, `__proto__`, ek alanlar.
- Yetki bağlantıdan geliyor; jetonla yeniden bağlanma eski bağlantıyı kesiyor.
- Tekrar ve eski sıra doğru işleniyor.
- Atomiklik: motor çağrısı kaynak düşüp istisna atsa bile tam geri alınıyor; odak ve iptal kuralları çalışıyor.
- AI koruması: `aiNegotiate` ve `aiRespond` uzak insan için engelleniyor; AI–AI değişmiyor.
- Sahiplik kuralları ve AI'ya iade çalışıyor.
- Filtreleme doğru.
- Oturum metası Save8'e bağlı; `save-mismatch` ve `slot-state` doğru reddediliyor.

## 4. Save8 ve tek oyunculu oyun

- `serialize`/`deserialize` değişmedi. Save8'e yeni alan eklenmedi.
- Oturum metası ayrı (`mpMeta:1`) tutuluyor ve `saveHash` ile kayda bağlı.
- Tek oyunculu kurulum, Save8 yükleme, AI ekonomi ve askerî kararları, 96H.7.1–96H.10 düzeltmeleri, federasyon, vasallık, PWA ve mobil görünüm: tam regresyonla ve `browser-96h10` ile aynı.
- Bilinen sınır: MP oturumunda insana devredilmiş bir devlet Save8'de `ai:false` olarak yazılır. Bu kayıt meta olmadan tek oyunculu açılırsa o devlet boşta kalır. LOAD.0/MP.1'de "insan koltuklarını AI'ya iade et" seçeneği gerekir (`release` hazır).

## 5. Performans

### Tarayıcı (Chromium, seed11, 45 sistem, host + 1 uzak oyuncu)

| Ölçüt | Değer |
|---|---|
| Snapshot | 5,3 KB |
| Aylık delta | ort. 0,6–0,66 KB, en fazla 0,75 KB |
| Yayın (oyuncu başına) | ort. 0,6 ms, en fazla 2 ms |
| Komut işleme (host) | ~1 ms |
| `monthTick` (host, 2 insan + AI) | ort. 34 ms, en fazla 80 ms |
| Ping RTT | 2 ms (yerel); 148 ms (60 ms + 60 ms gecikmeli relay) |
| Canlı oyun (hız 3) | ~1,5 KB/s ve ~4 mesaj/s istemci başına |
| Bellek | host ~21 MB, istemci ~5 MB JS yığını |

### Kapasite (`research/mp0/PERF-VM.json`, Node vm, 24 ay)

| Galaksi | Uzak insan | Ay simülasyonu (ort/en fazla) | Yayın (ort/en fazla) | Snapshot | Delta (ort/en fazla) | Save8 |
|---|---|---|---|---|---|---|
| 45 sistem / 7 devlet | 1 | 88 / 148 ms | 1,2 / 5 ms | 7,1 KB | 0,95 / 1,4 KB | 258 KB |
| 60 sistem / 9 devlet | 1 | 176 / 228 ms | 0,8 / 1 ms | 4,8 KB | 0,68 / 1,3 KB | 342 KB |
| 100 sistem / 13 devlet | 1 | 323 / 496 ms | 1,5 / 4 ms | 12,7 KB | 1,3 / 1,9 KB | 541 KB |
| 100 sistem / 13 devlet | 3 | 288 / 397 ms | 3,3 / 4 ms | 8,4 KB | 1,1 / 2,2 KB | 511 KB |

Multiplayer katmanının maliyeti ay simülasyonunun %1'inin altında. Asıl yük, host cihazın simülasyonu tek başına çalıştırması. 100 sistemde bu yük Android host için ayrıca ölçülmeli (NOT RUN).

## 6. Önemli bulgu: lockstep güvenilmez

Aynı seed ve aynı komutlarla Chromium ile Node v22 arasında RNG ve oyun durumu aynı kaldı. Ama 39 koordinat son basamakta ayrıştı (bilinen `faz95d` farkıyla aynı tür). Her cihazın kendi simülasyonunu yürüttüğü bir mimari farklı tarayıcılarda ayrışır. Host-yetkili seçim bu ölçümle doğrulandı.

## 7. Açık konular

1. **Kimlikle karar veren yollar** motorda hâlâ id 0'a bağlı: `aiNegotiate`, `UI.aiOffer(G.emps[0])`, federasyon gelen kutusu. MP.0 bunları host tarafında sarıyor; MP.2'de motor içinde `isHumanActor` yüklemi gerekir.
2. **Uzak insan için görüş belleği yok.** `updateVision` yalnız `G.p` için `s.seen` yazıyor. Uzak oyuncu bir sistemi yalnız görüş menzilindeyken ya da filosu oraya vardıysa bilir. Bu muhafazakâr bir yaklaşım (sızıntı yok); ama tek oyunculu oyuncuyla eşit değil.
3. **Uzak oyuncunun bildirimleri host'ta.** `!e.ai` ile çalışan `say()` bildirimleri host günlüğüne düşüyor. Bunlar oyuncu başına olay akışına yönlendirilmeli.
4. **Host güven modeli.** Host bütün dünyayı bellekte tutar; arkadaşlar arası model için kabul edilebilir. Relay düz metin görür. Üretimde TLS ve gerekirse uçtan uca şifreleme ya da WebRTC gerekir.
5. **Jeton metada düz tutuluyor.** Özet FNV-1a ve kriptografik değil.
6. **Relay geliştirme amaçlı.** Kimlik doğrulama, hız sınırı ve oda yaşam süresi yok.
7. **İstemci arayüzü asgari.** Koloni, kaynak ve inşa var; gerçek harita istemcisi MP.1/MP.2 kapsamında.
8. **LAN, internet ve Android** test edilmedi.

## 8. MP.1 için en küçük güvenli adım

Oda ve lobi akışı, mevcut relay protokolünün üzerine kurulur:

- oda oluşturma ve katılma ekranı;
- oyuncu listesi, hazır durumu;
- host'un devlet ataması ve AI'ya iade;
- `release` ile kayıttan "insan koltuklarını AI'ya ver".

Aynı fazda iki dar motor değişikliği gerekir:

1. `aiNegotiate` ve `UI.aiOffer` için `isHumanActor(e)` (koruma sargısının motora taşınması);
2. uzak insan için `updateVision` eşdeğeri görüş belleği.

Her ikisi Save8 ve RNG korumalı, kontrol–aday karşılaştırmalı yapılmalı. Diplomasi komutları (`offer`, `respond`, `vote`) MP.2'ye kalır.
