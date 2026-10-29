# STARS — MP.1 sonuç raporu

Dal: `claude/stars-mp1-mobile-lobby`. Taban: `main` `8b748b5f66a6aceb707a312cbbbc8bed20ec4f0e` (96H.10 + MP.0).

**Karar: B seçeneği, yani yayımlanmayan geliştirme prototipi.**

- Oda kurma/katılma, lobi, koltuklar, oyun başlatma ve gerçek komut gerçek Chromium süreçlerinde çalışıyor.
- Çalışan bir internet sunucusu yok; dağıtım yapılmadı.
- Runtime dosyaları, build, PWA ve ZIP değişmedi. ÇOK OYUNCULU düğmesi yalnız MP.1 relay'inin sunduğu sayfada görünüyor; yayın ZIP'inde düğme yok.
- GitHub'a gönderilen kod kendiliğinden çalışan bir sunucu oluşturmaz.

## 1. Başlangıç doğrulaması

| | Sonuç |
|---|---|
| `main` HEAD | `8b748b5f66a6aceb707a312cbbbc8bed20ec4f0e` (MP.0 birleşmiş) |
| ZIP | `releases/stars-faz96h10.zip` SHA-256 `78e76d1627b8ec1b990849b2242835f78667f110e1d6f17021760183ee7be6d0`, 20 girdi, CRC'ler geçerli |
| Manifest | ZIP içi manifest = çalışma ağacı manifesti, 19 SHA-256 eşleşiyor, build `96h10`, PWA `stars-v96h10` |
| MP.0 taban testleri | `mp0_core_test.js` 11/11 PASS, `browser-mp0.cjs` 20/20 PASS |

## 2. Testler

### Yeni testler

| Test | Ortam | Sonuç |
|---|---|---|
| `tests/mp1_lobby_core_test.js` | Node vm, gerçek motor | **9/9 PASS** |
| `tests/mp1_relay_test.js` | Gerçek TCP ve TLS soketleri | **14/14 PASS** |
| `tests/browser-mp1.cjs` | 5 ayrı Chromium süreci + 2 gecikmeli relay süreci | **22/22 PASS**, sayfa hatası 0 |

`mp1_lobby_core_test.js` (9):

1. `isHumanActor` 5 seed × 120 ay boyunca = devlet 0.
2. `actorVision` = `G.vis` (5 × 120).
3. İnsansız lobi kipi Save8 baytlarını değiştirmiyor (120 gün).
4. Durum makinesi ve tek başlangıç.
5. Hazır kuralları.
6. Yalnız-host işlemleri, kapasite, `game-started`, çıkarma, kapatma.
7. Presence (Save/RNG değişmez).
8. Lobi gizliliği: tohum yok, başlangıçtan sonra AI listesi yok.
9. Uzak insan keşif belleği ve AI ayrımı.

`mp1_relay_test.js` (14): statik izin listesi, kod/anahtar, katılım, host kimliği (anahtar ilk çerçevede, URL'deki anahtar yok sayılır), kapatma, yaşam süresi, canlılık, çıkarma, sınırlar, Origin, kötüye kullanım, güvenilen vekil, TLS, günlük.

### `browser-mp1.cjs` vakaları

| # | Vaka | Sonuç |
|---|---|---|
| 1 | Menü: YENİ OYUN / OYUNA DEVAM ET / ÇOK OYUNCULU / AYARLAR; GERİ; runtime `index.html` dokunulmamış | PASS |
| 2 | Host telefonu oda kurar, kod ekranda, anahtar sayfada yok, galaksi ayarları (seed 11, 5 AI, kapasite 4) | PASS |
| 3 | A davet bağlantısıyla, B kodu elle (küçük harf, tiresiz, Enter) katılır; misafirde motor yok | PASS |
| 4 | Canlı liste host ve iki misafirde alan alan aynı; `<img onerror>` adı yalnız metin | PASS |
| 5 | Presence: Doktrin / Galaksi ayarları herkese görünür; Save8/RNG değişmez; geçersiz sekme reddedilir | PASS |
| 6 | Devlet seçimi: DOLU/`taken`, host 0, vahşi 6, 99, `'1'` reddedilir; hazır için devlet şart; hazır herkese yansır | PASS |
| 7 | Devlet değişince hazır sıfırlanır; çift hazır tek yayın; başkasının hazırı/devleti (`seat`, `playerId`) reddedilir; host işlemleri ağdan `bad-message` | PASS |
| 8 | Host galaksiyi değiştirir → bütün seçim ve hazırlar sıfırlanır; hiçbir misafir paketinde `seed` yok | PASS |
| 9 | 5 görünümde lobi yerleşimi, klavye, geri tuşu | PASS |
| 10 | Host + 3 misafir; tutulan devlet alınamaz; 4/4; beşinci telefon "Oda dolu." | PASS |
| 11 | Başlatma: herkes hazır olana dek kapalı; çift dokunma tek başlangıç; eşleme sabit; ai = `[F,T,T,F,F,F,T]`; geç gelen "Oda dolu/Oyun başladı" | PASS |
| 12 | Aynı oyun zamanı: 3 adım, misafir saatleri host'la aynı (6–20 ms gecikme) | PASS |
| 13 | A'nın telefonundan gerçek İNŞA ET (`santral`, `queueBuilding`); B, A'nın kolonisine inşa edemez (`not-owner`); sahte `empire` → `forged-empire`; tekrar `cid` bir kez uygulanır | PASS |
| 14 | 4 ay boyunca insan devletleri 0/3/4/5 için `aiTurn` 0; AI devletleri (12 tur) oynuyor; devralınan otomasyon kapalı | PASS |
| 15 | Oyuncu başına görüş ve sızıntı taraması (A/B/C bütün paketler) | PASS |
| 16 | A sayfayı yeniler → kendiliğinden aynı koltuk ve devlet; B ağdan düşer → host'ta "koltuk bekletiliyor", B komutu "host-yok", ağ dönünce aynı devlet | PASS |
| 17 | Host telefonu ağdan düşer → misafirlerde "Host bağlı değil", oyun duraklar, host anahtarla geri bağlanır, oyun sürer; anahtar hiçbir WS URL'sinde yok; kod + yanlış anahtar → `bad-host-key` | PASS |
| 18 | Host, kopan C'nin devletini panelden AI'ya verir (`ai=true`); C geri dönemez (`kicked`) | PASS |
| 19 | Oyun içi yerleşim 5 görünümde; host paneli tek satır (46 px); geri tuşu onayı | PASS |
| 20 | Performans ölçümü | PASS |
| 21 | 60 ms gecikmeli ayrı relay süreci: kur, katıl, seç, hazır, başlat, komut, çift tekrar, kapat, eski kod, geçersiz kod; relay stdout'unda oda kodu yok | PASS |
| 22 | 150 ms ile aynı akış | PASS |

### MP.0 regresyonu

- `mp0_core_test.js` 11/11 PASS.
- `browser-mp0.cjs` 20/20 PASS. MP.0 akışı (`/mp/host`, `/mp/client`) değişmeden çalışıyor.

### Tam regresyon ve tek oyunculu

| Koşu | Sonuç |
|---|---|
| `node tests/run-all.js` (`STARS_TEST_WORKERS=3`) | **142 paket, 6143 PASS / 3 FAIL** |
| Mevcut 140 paket | MP.0 tabanıyla aynı: 6120 PASS / 3 FAIL |
| Yeni paketler | `mp1_lobby_core_test.js` 9, `mp1_relay_test.js` 14 |
| 3 FAIL | Bilinen ortam farkı: `faz95d_identity_test.js` seed 11/99/404 coğrafya koordinatı son basamağı (Node v22). Yeni FAIL yok; test silinmedi ya da gevşetilmedi |
| `browser-96h10.cjs` (tek oyunculu: Yeni Oyun, Devam, kurulum, dokunmatik, Save8, AI, 96H.8/9/10, PWA) | **27/27 PASS**, sayfa hatası 0 |
| `browser-mp0.cjs` | 20/20 PASS |
| `browser-mp1.cjs` (son koşu, kanıt) | 22/22 PASS (ara düzeltmelerden sonraki 4 önceki koşu da 22/22) |
| `verify-release.py --root <ZIP çıkışı>` | DOĞRULANDI: 19 dosya, build 96h10; ZIP SHA-256 değişmedi |

- Yan etki dosyaları (`tests/navy-95a-after-*.json`, `tests/audit-95d/…png`, `tests/audit96g2/`) geri alındı; commit'e girmedi.
- Save8 / RNG: runtime değişmedi.
  - Lobi kipinde insan yokken 120 gün sonunda Save8 baytları düz motorla aynı.
  - Presence ve lobi işlemleri `serialize()` ve `RND_STATE`'i değiştirmiyor.
  - `observeHumans` RNG çekmiyor ve yeni Save alanı eklemiyor.

## 3. Performans (yerel Chromium, `browser-mp1.cjs`; kanıt koşusu `research/mp1/evidence/mp1-results.json`)

Önceki koşular aynı büyüklükte.


| Ölçüm | Değer |
|---|---|
| Oda oluşturma (dokunuştan lobiye) | 0,11 sn |
| Misafir bağlantısı (WebSocket → `welcome`) | 6–14 ms |
| Presence yayılımı | host 57 ms, öteki misafir 60 ms |
| Başlat → 3 misafir oyun ekranında | 0,17 sn |
| Saat güncellemesi (host adımı → 3 misafir) | 9–12 ms |
| Komut gidiş-dönüşü (dokunuş → `ok`) | 66 ms (misafirin ölçtüğü 18 ms) |
| 60 ms gecikme | oda 0,21 sn, katılım 0,26 sn, seçim host'a 0,12 sn, başlatma 0,19 sn, komut 0,28 sn, güncelleme 0,14 sn |
| 150 ms gecikme | oda 0,30 sn, katılım 0,53 sn, seçim host'a 0,23 sn, başlatma 0,22 sn, komut 0,38 sn, güncelleme 0,24 sn |
| Misafir trafiği | oyun ayı başına 1,2 KB; 4 aylık oyun + lobi boyunca misafir başına ~23 KB |
| Lobi paketleri | misafir B: 58 paket (bütün lobi süreci), ort. 1,3 KB, en çok 1,5 KB |
| En büyük misafir paketi / Save8 | 4,4 KB / 130 KB |
| Host maliyeti / oyun ayı | ay simülasyonu ~43 ms (motorun kendisi); `observeHumans` <1 ms; `publish` (3 misafir) 0,3 ms |
| Host JS yığını | 20 MB |

## 4. Bağlantı durumu (dürüst sınıflandırma)

| Yol | Durum |
|---|---|
| Yerel makinede gerçek ağ yığını (TCP/WS/TLS, ayrı süreçler) | PASS |
| 60/150 ms yapay gecikme | PASS |
| İnternet (gerçek sunucu, gerçek NAT, mobil veri) | **NOT RUN.** Dağıtım yapılmadı, URL yok |
| Aynı Wi-Fi'da iki telefon | **NOT RUN** |
| Çevrimdışı LAN (WebRTC/QR) | **Uygulanmadı / NOT RUN** (bkz. `MULTIPLAYER-MP1-MIMARI.md` §1) |
| Fiziksel Android (Chrome / kurulu PWA) | **NOT RUN** |

## 5. Bulunup düzeltilen hatalar (bu fazda)

1. **Tohum sızıntısı:** lobi ayarları tohumu misafirlere gönderiyordu. Tohum ve açık motor kodu bütün galaksiyi yeniden kurdururdu. Artık yalnız host görüyor.
2. **Oyun içi lobi** temas kurulmamış AI devletlerinin adlarını taşıyordu. Başlangıçtan sonra yalnız insan devletleri kalıyor.
3. **Host anahtarı URL'de** taşınıyordu (vekil günlükleri). Artık ilk çerçevede; URL'deki anahtar yok sayılıyor.
4. **Yarı açık bağlantı:** FIN'le kapanan host relay'de "bağlı" kalıyordu. `end` işleniyor ve ping/zaman aşımı eklendi.
5. **Sınırla kapatılan bağlantı** tamponda kalan çerçeveleri işlemeye devam ediyordu (`closedByLimit` birden çok sayıyordu).
6. **Neden kaybı:** neden çerçevesi kaybolunca misafir sonsuz "Bağlanıyor…" döngüsüne giriyordu. Kapanış kodu ve nedeni artık nihai.
7. **Yanlış mesaj:** oda kapatma ya da ayrılma "Host seni odadan çıkardı" gösteriyordu.
8. **CSS çakışması:** `.empty`/`.tag` oyunun CSS'iyle çakışıyordu (10 px yazı).
9. **Klavye:** host tohum alanı klavyenin altında kalıyordu.
10. **Host oyun paneli** haritayı kaplıyordu.

## 6. Açık konular ve MP.2 hazırlığı

1. **Dağıtım:** sağlayıcı seçimi, alan adı ve TLS, `MP1_ORIGINS`, `MP1_TRUST_PROXY`. Gerçek iki telefonla internet testi.
2. **Misafir arayüzü** yalnız koloni inşası sunuyor. Filo hareketi, araştırma, diplomasi ve harita gibi komut ve ekranlar yok.
   - Çekirdek komut tablosu MP.0'daki `build`, `focus` ve `cancel` ile sınırlı.
   - Misafir haritası yok; liste görünümü var.
3. **İnsan–insan diplomasi** ve uzak insanın gelen kutusu (`UI.aiOffer`, federasyon oyları) MP.2 kapsamında. Şu an AI'nın uzak insana teklifi karara bağlanmıyor.
4. **Misafirin kurulum özelleştirmesi** (doktrin, görünüş, fizyoloji, etik, civic, köken): şimdilik gerçek AI devletini seçip özelliklerini salt okunur görüyor.
5. **Oyun hızı ve duraklatma** yalnız host'ta. Misafirin hız/duraklatma isteği ve oylaması yok.
6. **Kayıt ve yeniden oda:** Save8 + oturum metası (MP.0 `meta`/`restore`) MP.1 arayüzüne bağlanmadı. Relay yeniden başlarsa oda kaybolur; host oyunu yerelde sürdürür.
7. **Çevrimdışı LAN** (WebRTC + QR) denenmedi.
8. **"Çıkar (devlet boşta)"** seçeneğinde devlet insan bayrağıyla sahipsiz kalıyor. Sonradan başka oyuncuya devretme yok (kural 8'e uygun; MP.2'de host'a "yeni oyuncuya ver" eklenebilir).
9. Tek oyunculu oyunun kendi dokunma hedefleri (32 px araç düğmeleri) MP.1 kapsamında değiştirilmedi.
