# STARS — MP.1.1 sonuç raporu: internetten erişim

Dal: `claude/stars-mp11-online-access`. Taban: `main` `7fa0eddc648d1148362dc8a41b5b43111b4b1448` (96H.10 + MP.0 + MP.1).

**Sonuç: gerçek dağıtım yapılamadı; çalışan bir internet adresi yok.** Teslim edilenler:

- herkese açık çalışmayı güvenli kılan relay üretim kipi;
- sağlayıcıdan bağımsız dağıtım dosyaları (Dockerfile, Caddy örneği, ortam şablonu);
- dağıtım sonrası smoke aracı;
- Android arka plan/ekran kilidi duraklatması;
- yerelde gerçek TCP/TLS ile uçtan uca doğrulama.

Runtime, build `96h10`, PWA `stars-v96h10`, Save8 ve ZIP değişmedi.

## 1. Kanonik doğrulama

| | Sonuç |
|---|---|
| `main` HEAD | `7fa0edd…`. Ağacı, MP.1 dalındaki son commit `f1876bf` ile aynı |
| ZIP | `releases/stars-faz96h10.zip` SHA-256 `78e76d16…6be6d0`, dosya CRC32 `cf97cc3a`, 20 girdi, `testzip` temiz |
| Manifest | ZIP içi = çalışma ağacı, 19 SHA eşleşiyor |
| `verify-release.py --root <ZIP çıkışı>` | DOĞRULANDI |

## 2. Dağıtım erişimi (neden yapılamadı)

| Olanak | Durum |
|---|---|
| Bulut kimlik bilgisi | Yok. `CLOUDSDK_AUTH_ACCESS_TOKEN` ve AWS değişkenleri 14 karakterlik yer tutucu; `gcloud projects list` → `UNAUTHENTICATED` |
| Dağıtım CLI'ları (fly, vercel, netlify, railway, wrangler, heroku, az, aws, doctl) | Kurulu değil |
| Docker | CLI var, daemon yok (imaj derlenemedi) |
| Geçici tünel | `api.trycloudflare.com` ağ politikasınca reddedildi (403); `cloudflared`/`ngrok` yok |
| Gelen bağlantı | Oturum konteyneri dışarıdan erişilebilir değil |

Ücretli abonelik açılmadı, hesap bağlanmadı, gizli anahtar istenmedi, URL uydurulmadı.

**Eksik olan tam olarak şu:** Docker ya da Node çalıştırabilen, WebSocket destekli, TLS sağlayan bir barındırma hesabına bu depodan dağıtım yetkisi, ve oyunun yayınlanacağı alan adı. Adımlar: `MULTIPLAYER-MP11-DEPLOYMENT.md`.

## 3. Yapılan değişiklikler

### Relay — `research/mp1/server/relay.js`

- **Herkese açık kip zorunlulukları.** Bağlama loopback dışındaysa relay şunlar olmadan başlamaz:
  - TLS ya da `MP1_TRUST_PROXY=1`;
  - `https://` biçimli `MP1_ORIGINS`;
  - kapalı `MP1_DEV`.
- **TLS'siz istek:** HTTP→HTTPS 308; TLS'siz WebSocket 403. Yalnız vekilin son `X-Forwarded-Proto` girdisi sayılır. `Host` doğrulanmadan `Location`'a yazılmaz.
- **Yeni başlıklar ve uçlar:** HSTS; `/healthz`.
- **Platform uyumu:** `PORT` desteği; SIGTERM/SIGINT'te odalar `server-restart` ile kapanır, süreç 0 ile çıkar.
- **Oda açma sınırı:** IP başı dakikada 10 (`MP1_CREATES_PER_MIN`).
- **CSP daraltması:** misafir sayfası `connect-src` değeri `'self'`.

### Çekirdek — `research/mp0/mp-core.js`

- `setPaused(v, why)` ve lobi görünümünde `pause` alanı (eklemeli; MP.0 çağrısı aynı).
- **Düzeltme:** duraklatmada gelen komut artık `paused` alıyor; önceden yanlış olarak `not-started` alıyordu.

### Host — `research/mp1/client/mp1-host.js`

- `visibilitychange` / `pagehide` ile arka plan duraklatması: hız 0 olur, misafire neden gider, dönüşte önceki hız geri gelir.
- Arka plan ile relay kopması ayrı nedenler olarak tutuluyor.
- Dönüşte bağlantı yoksa hemen yeniden bağlanıyor.

### Misafir — `research/mp1/client/join.js`, `view.js`

- Duraklatma nedenini gösteriyor ("host uygulamayı arka plana aldı ya da ekranı kilitledi").
- Uykudan dönünce hemen yeniden bağlanıyor.
- El sıkışması reddedilince sonsuz "Bağlanıyor…" yerine "Bağlanılamadı…" diyor.
- Yeni Türkçe hata metinleri (`paused`, `server-restart`).

### Dağıtım — `research/mp1/deploy/`

- `Dockerfile` ve kök `.dockerignore` (izin listesi).
- `Caddyfile.example`, `relay.env.example`.
- `smoke.js` ve `ws-client.js`.

### Testler

- **Yeni:**
  - `tests/mp11_online_test.js` (9);
  - `tests/browser-mp11.cjs` (10);
  - yardımcı `tests/helpers/mp11-tls-proxy.js`.
- **Bölünen:**
  - `mp1_lobby_core_test.js` içindeki iki uzun 5 seed × 120 aylık denetim `mp1_actor_vision_test.js` (11/23/42) ve `mp1_actor_vision_b_test.js` (99/404) dosyalarına taşındı. Ortak yardımcı: `helpers/mp1-actor-vision.js`.
  - Neden: bu konteynerde dosya ~250 sn sürüyor ve `run-all`'un 180 sn sınırında öldürülüyordu (ilk koşuda FAIL olarak göründü).
  - Seed, ay ve denetimler aynı. Her seed tek simülasyonla iki denetimi birden yapıyor; dosyalar 68 ve 64 sn sürüyor.
- **Değişen:** `mp1_relay_test.js`'in yardımcısı `MP1_CREATES_PER_MIN=1000` ile başlatılıyor. Bu dosyadaki vakalar tek IP'den 16–40 oda açarak başka sınırları ölçüyor; yeni oda açma sınırı kendi testinde varsayılanla ölçülüyor. Hiçbir assertion gevşetilmedi.

## 4. Test sonuçları

### Yeni testler

`tests/mp11_online_test.js` — **9/9 PASS**:

1. Herkese açık bağlama reddi:
   - 5 hatalı yapılandırma;
   - CLI çıkış kodu 1;
   - geçerli TLS ve vekil yapılandırmaları açılıyor;
   - `PORT` desteği.
2. Vekil arkası: 308, 403 (WS), HSTS, `/healthz`, son girdi kuralı, Origin listesi, `/mp/stats` 404.
3. IP başı oda açma sınırı (10/dk → 4029).
4. Kapanış: odalar `server-restart` ile kapanıyor; CLI SIGTERM'de 0 ile çıkıyor; stdout'ta oda kodu yok.
5. Smoke aracı doğrudan TLS'ye karşı 10/10.
6. Smoke aracı TLS ters vekil arkasında 10/10; relay portu düz HTTP sunmuyor (308).
7. Dockerfile dosya kümesi:
   - tam ve sırsız (20 oyun dosyası + MP betikleri);
   - `.dockerignore` ile tutarlı;
   - yalnız bu dosyalardan başlatılan relay vekil arkasında smoke 10/10 geçiyor.
8. Arka plan duraklatması (gerçek motor):
   - lobi `pause:'host-background'`;
   - komut `paused`;
   - `host-offline` nedeni;
   - devam;
   - Save8 ve RNG aynı;
   - MP.0 çağrısı değişmedi.
9. Kaynakta özel anahtar, jeton ya da gerçek alan adı yok.

`tests/browser-mp11.cjs` — **10/10 PASS**, sayfa hatası 0. Kurulum: 3 ayrı Chromium süreci; relay üretim kipinde; önünde TLS ters vekil. Chromium yalnız yerel sertifikanın SPKI'sine güveniyor.

1. HTTPS oyun sayfası, güvenli bağlam, build 96h10; relay portunda HTTP→HTTPS 308; `/healthz`.
2. Host WSS ile oda açtı; anahtar hiçbir URL'de ve sayfada yok.
3. Misafir HTTPS davet bağlantısıyla WSS üzerinden katıldı; misafirde motor yok.
4. Seçim, hazır, başlatma; listeler aynı; oyun zamanı aynı.
5. Misafir telefondan gerçek İNŞA ET (santral → host `queueBuilding`); RTT 15–19 ms.
6. Arka plan/ekran kilidi:
   - hız 0, misafirde neden;
   - komut `paused` ile reddedildi;
   - dönüşte hız 1, "Bağlı".
   - *Görünürlük olayı taklit edildi.* Başsız Chromium'da sekme gerçekten gizlenemedi; Page Lifecycle dondurması uygulanamadı (`freezeApplied:false`).
7. Ağ kopması:
   - misafir koltuğu korundu;
   - misafir sayfası yenilenince kendiliğinden döndü;
   - host düştü, anahtarla 0,69 sn'de geri bağlandı, oyun sürdü.
8. Saldırılar:
   - yabancı köken (`https://127.0.0.1`) → "Bağlanılamadı";
   - yanlış kod → "geçersiz";
   - sahte host → `bad-host-key`;
   - fazla oyuncu → "Oda dolu".
9. Kaynaklar (§5).
10. 4× CPU kısıtlı host maliyeti (§5).

### Regresyon

| Test | Sonuç |
|---|---|
| Tam Node regresyonu (`run-all`, 3 işçi) | **145 paket, 6154 PASS / 3 FAIL** |
| 3 FAIL | Bilinen `faz95d_identity_test.js` seed 11/99/404 (Node v22 kayan nokta). Yeni FAIL yok |
| `mp0_core_test` | 11/11 PASS |
| `mp1_lobby_core_test` | 7/7 PASS (taşınan 2 denetim ayrı dosyalarda: 2/2 + 2/2) |
| `mp1_relay_test` | 14/14 PASS |
| `browser-96h10` (tek oyunculu) | 27/27 PASS |
| `browser-mp0` | 20/20 PASS |
| `browser-mp1` | 22/22 PASS |
| `browser-mp11` | 10/10 PASS |
| ZIP / CRC / manifest | DOĞRULANDI, değişmedi |

### Ayrı başlıklar

| Ortam | Sonuç |
|---|---|
| Yerel makine, gerçek TCP/TLS, TLS vekil arkası (HTTPS/WSS) | PASS |
| Yerel, 60/150 ms gecikmeli relay (`browser-mp1`) | PASS |
| **Gerçek internet** (gerçek alan adı, gerçek sertifika, NAT, mobil veri) | **NOT RUN** (sunucu yok) |
| **Fiziksel Android** (Chrome / kurulu PWA, arka plan, ekran kilidi) | **NOT RUN** (cihaz yok) |
| Aynı Wi-Fi LAN | NOT RUN |
| Docker imaj derlemesi | NOT RUN (daemon yok); dosya kümesi eşdeğer testle doğrulandı |

## 5. Performans (yerel Chromium; gerçek telefon değil)

| Ölçüm (HTTPS/WSS, TLS vekil arkası) | Değer |
|---|---|
| Host sayfa yükleme | 0,59 sn |
| Oda açma | 0,21 sn |
| Davet bağlantısı → lobi | 0,42 sn |
| Misafir WSS bağlantısı | 24 ms |
| Başlatma → misafir oyunda | 0,39 sn |
| İnşa komutu (dokunuş → `ok`) | 0,18 sn |
| RTT (ping) | 15–19 ms |
| Host relay'e geri dönüşü | 0,69 sn |
| Misafir sayfası | 4 MB JS yığını, 0,14 sn toplam CPU görevi |
| Host sayfası | 10 MB, 12,5 sn |
| Misafir trafiği (lobi + 2 ay oyun) | 12 KB / 11 mesaj |
| 60 ms gecikme (`browser-mp1`) | katılım 0,29 sn, komut 0,22 sn, güncelleme 0,21 sn |
| 150 ms gecikme (`browser-mp1`) | katılım 0,60 sn, komut 0,45 sn, güncelleme 0,39 sn |

Host maliyeti, oyun ayı başına (1 uzak oyuncu; 4 ay ölçümünün medyanı):

| Sistem / devlet | Normal: ay simülasyonu | 4× CPU kısıtlı: ay simülasyonu | 4×: görüş belleği | 4×: yayın | Misafir trafiği / ay | JS yığını |
|---|---|---|---|---|---|---|
| 45 / 7 | 135 ms* | 166 ms | <1 ms | 0,8 ms | 3,0 KB | 22 MB |
| 60 / 9 | 101 ms | 221 ms | <1 ms | 4,5 ms | 2,2 KB | 26 MB |
| 100 / 13 | 219 ms | 582 ms | 0,9 ms | 5,8 ms | 4,8 KB | 23 MB |

\* İlk ölçüm soğuk JIT içeriyor.

- Hız 3'te (4,5 gün/sn) bir ay ~6,7 sn sürer. 4× kısıtta ay simülasyonu 45 sistemde CPU'nun ~%2,5'i, 100 sistemde ~%9'u.
- Çok oyunculu ek yükü (görüş + yayın) ay başına <7 ms.
- 4× CPU kısıtı orta segment Android'in yalnız kaba bir yaklaşımı; gerçek cihaz ölçümü NOT RUN.

## 6. Açık engeller ve MP.2 önerisi

1. **Dağıtım:** barındırma hesabı ve alan adı gerekiyor. DEPLOYMENT §3/§4 izlenip smoke testi çalıştırılmalı.
2. **Gerçek doğrulama:** iki fiziksel Android telefonla gerçek internette Test A–C. Arka plan, ekran kilidi ve sekme dondurma burada ilk kez gerçekten denenecek.
3. **Kalıcılık:** relay yeniden başlarsa oda kaybolur. MP.2'de Save8 + oturum metasıyla "odayı yeniden aç" arayüzü (çekirdekte `meta`/`restore` var).
4. **MP.2 içerik önceliği** (dağıtımdan sonra):
   - misafir için filo hareketi ve araştırma komutları;
   - misafir harita görünümü;
   - insan–insan teklif kutusu.
   - Önce iki telefon arasında kararlılık.
