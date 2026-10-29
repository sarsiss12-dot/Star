# STARS MP.1.1 — internet güvenliği denetimi

Kapsam: `research/mp1/server/relay.js` (oda relay'i), `research/mp1/client/*` ve `research/mp0/mp-core.js` lobi kipi.

MP.0'ın `research/mp0/server/dev-relay.js` dosyası internete **açılmaz**: TLS, Origin ya da kimlik denetimi yok. MP.1 relay'i yalnız onun RFC 6455 çerçeve kodunu kullanır.

Bu fazda relay'e eklenen ya da düzeltilenler aşağıda "MP.1.1" ile işaretli.

## 1. Taşıma ve dağıtım güvenceleri

| Denetim | Davranış | Kanıt |
|---|---|---|
| **TLS zorunluluğu** (MP.1.1) | `MP1_BIND` loopback dışındaysa relay yalnız TLS (`MP1_TLS_CERT/KEY`) ya da güvenilen TLS vekili (`MP1_TRUST_PROXY=1`) ile başlar. Aksi halde başlamayı reddeder, çıkış kodu 1 | `mp11_online_test` 1 |
| **Origin listesi zorunlu** (MP.1.1) | Herkese açık kipte `MP1_ORIGINS` boşsa ya da `https://alan` biçiminde değilse başlamaz | aynı |
| **Geliştirme uçları kapalı** (MP.1.1) | Herkese açık kipte `MP1_DEV=1` reddedilir; `/mp/stats` 404 | aynı + smoke |
| **HTTP → HTTPS** (MP.1.1) | Vekilin son `X-Forwarded-Proto` girdisi `https` değilse GET 308 ile `https://`'e yönlenir, diğer istekler 403 | `mp11_online_test` 2, `browser-mp11` 1 |
| | `Host` başlığı yalnız güvenli karakterlerle `Location`'a yazılır; tuhaf `Host` → 403 | |
| | Sahte `https, http` zincirinde yalnız son (vekilin eklediği) girdi sayılır | |
| **WSS zorunlu** (MP.1.1) | TLS'siz WebSocket yükseltmesi 403 alır | `mp11_online_test` 2 |
| **HSTS** (MP.1.1) | Herkese açık kipte bütün yanıtlarda `Strict-Transport-Security: max-age=31536000` | aynı + smoke |
| **Güvenlik başlıkları** | `nosniff`, `no-referrer`, `X-Frame-Options: DENY`, `no-store` | |
| | Misafir sayfasında CSP `default-src 'self'; connect-src 'self'; script-src 'self'`. MP.1.1'de `ws: wss:` joker değeri `'self'`'e daraltıldı; Chromium'da WSS bağlantısı çalışıyor (test edildi) | smoke, `browser-mp11` |
| **Statik dosya izin listesi** | Yalnız 19 runtime dosyası + 5 MP betiği. `.git`, `tests/`, relay kaynağı, `..` yolları 404 | `mp1_relay_test` |
| **Sağlık uç noktası** (MP.1.1) | `/healthz` → `{"ok":true}`; oda sayısı ya da sürüm bilgisi vermez | `mp11_online_test` 2 |
| **Konteyner imajı** (MP.1.1) | Yalnız gerekli dosyalar, `node` kullanıcısı, bağımlılık yok; gizli anahtar yok | `mp11_online_test` 7, 9 |

## 2. Oda ve kimlik

| Denetim | Davranış |
|---|---|
| Oda kodu | 8 sembol, 31 harfli alfabe (≈39,6 bit), `crypto.randomInt`. Kapanan kod TTL boyunca yeniden verilmez |
| Kod tahmini | IP başı dakikada 30 katılım denemesi, sonra 4029 |
| Oda açma (MP.1.1) | IP başı dakikada 10 oda (`MP1_CREATES_PER_MIN`), en çok 200 oda (`MP1_MAX_ROOMS`) |
| Host yetkisi | 192 bit host anahtarı; relay yalnız SHA-256 özetini tutar, `timingSafeEqual` ile karşılaştırır |
| | Yeniden bağlanırken anahtar **ilk WebSocket çerçevesinde** gider, URL'de taşınmaz; URL'deki anahtar yok sayılır |
| | 5 sn içinde anahtar gelmezse ya da yanlışsa `bad-host-key`. Kod tek başına host yapmaz |
| Oyuncu kimliği | 128 bit jeton, yalnız sahibine gider, `localStorage`'da odaya bağlı tutulur. Kimlik bağlantıdan gelir |
| Mesaj yetkisi | Lobi mesajları tam anahtar kümesiyle doğrulanır; `seat`, `playerId`, `empire` gibi fazladan alanlar reddedilir |
| | Host işlemleri (`configure`, `start`, `kick`, `assign`) ağ tablosunda yok |
| | Oyun komutunda paketteki `empire` alanı yetki vermez (`forged-empire`); başkasının kolonisi `not-owner` |
| Tekrar | Aynı `cid` bir kez uygulanır (`dup`); eski `seq` reddedilir |
| Oda dolu | Relay kapasitesi (4005) ve çekirdek `room-full` |

## 3. Kaynak sınırları

| Sınır | Değer |
|---|---|
| Mesaj boyutu | misafir 8 KB, host 256 KB |
| Mesaj hızı | jeton kovası misafir 20/sn (patlama 40), host 200/sn; 100 düşen mesajdan sonra 4008 |
| Bağlantı | IP başı 16 eşzamanlı bağlantı |
| Oda yaşamı | TTL 12 saat. Host düşerse 10 dk bekleme, sonra `host-timeout` |
| Canlılık | 25 sn ping; 62,5 sn sessiz bağlantı kapanır (Android'de FIN'siz kopma) |
| Vekil arkası | `MP1_TRUST_PROXY=1` ile IP, `X-Forwarded-For`'un son girdisinden alınır; uydurulan ilk girdi sınırdan kaçırmaz |

## 4. Gizlilik

- Misafire şunlar gitmez:
  - galaksi tohumu;
  - başka oyuncunun jetonu ya da kimliği;
  - host anahtarı;
  - bilinmeyen sistemler;
  - temas kurulmamış devletler;
  - oyun başladıktan sonra AI devlet listesi.
- Paket taraması `browser-mp1` ve `mp1_lobby_core` testlerinde yapılıyor.
- **Günlük:** relay oda kodu, anahtar ya da jeton yazmaz; yalnız başlangıç satırı. Testte stdout tarandı.
- **XSS:** ağdan gelen her metin kaçışlanır. İsimlerden `<`, `>` ve denetim karakterleri silinir.

## 5. Bu fazda bulunan ve düzeltilen hatalar

1. Host arka plandayken (duraklatma) gelen komut "Oyun henüz başlamadı" (`not-started`) ile reddediliyordu. Artık `paused` dönüyor ve misafire "Oyun duraklatıldı; komut uygulanmadı." görünüyor.
2. Misafir sayfasında el sıkışması reddedilen bağlantı (yanlış köken, sunucu yok) sonsuz "Bağlanıyor…" gösteriyordu. Artık "Bağlanılamadı…" görünüyor.
3. Misafir CSP'sindeki `connect-src ws: wss:` her WebSocket sunucusuna izin veriyordu; `'self'`'e daraltıldı.

## 6. Bilinen sınırlar (üretimden önce kararlaştırılmalı)

- **Kimlik doğrulama yok.** Oda kodunu bilen herkes boş koltuğa katılabilir; host onu görür ve çıkarabilir. Hesap ya da parola sistemi yok (MP.2+).
- **Uçtan uca şifreleme yok.** TLS istemci–relay arasındadır. Relay işletmecisi oyun mesajlarını düz görür; kalıcı olarak saklamaz.
- **Origin denetimi yalnız tarayıcıları bağlar.** Tarayıcı dışı bir araç Origin başlığını uydurabilir. Asıl koruma: kod entropisi, oran sınırları, host anahtarı ve host'un kural denetimi.
- **Doğrudan erişim:** relay'in iç bağlantı noktası dışarıya açıksa `X-Forwarded-Proto` uydurulabilir. Port kapalı tutulmalı (DEPLOYMENT §4).
- **Tek örnek, kalıcılık yok.** Sunucu yeniden başlarsa odalar kapanır.
- **Gerçek internet sızma testi yapılmadı (NOT RUN).** Bütün güvenlik testleri yerel makinede, gerçek TCP/TLS soketleriyle yapıldı.
