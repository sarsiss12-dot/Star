# STARS — MP.5 sonuç raporu: güvenli internet bağlantısı, relay dağıtım paketi, kopma/yeniden bağlanma

Dal: `claude/stars-mp5-internet`. Taban: `main` `4296ad2d43fedce6264020b3761f50f1839fd836` (96H.10 + MP.0 – MP.4; PR #16 birleşmiş).

**Karar: kısmen tamamlandı.**

- Tamamlanan:
  - relay internete hazır sertleştirildi (3 uzaktan çökme yolu kapatıldı);
  - kopma/ağ değişimi/host kopması/relay yeniden başlatma davranışı düzeltildi ve test edildi;
  - Docker imajı ilk kez gerçekten derlenip çalıştırıldı;
  - dağıtım yönergesi ve sağlayıcı değerlendirmesi yazıldı.
- Tamamlanmayan: **canlı dağıtım yok** (hesap erişimi yok), **gerçek internet ve fiziksel Android testi yok** (NOT RUN).
- Runtime (19 dosya), build `96h10`, PWA `stars-v96h10`, Save8, `mp-core.js` ve kanonik ZIP değişmedi.

## 1. Başlangıç doğrulaması

| | Sonuç |
|---|---|
| `origin/main` | `4296ad2d43fedce6264020b3761f50f1839fd836` = beklenen. PR #16 birleşmiş (squash); ağacı MP.4 dal ucu `1f36f5c` ile aynı |
| ZIP | SHA-256 `78e76d16…6be6d0`, CRC32 `cf97cc3a`, 20 girdi, `testzip` temiz; ZIP içi = çalışma ağacı |
| Manifest | 19 runtime SHA-256 eşleşiyor; build `96h10`, PWA `stars-v96h10` |

## 2. Bulunan ve düzeltilen sorunlar

Ayrıntı ve testler: `MULTIPLAYER-MP5-SECURITY.md` §2. Özet:

1. **Kritik — tek istekle relay çökmesi (3 yol):** bozuk %-kodlama, GET'te geçersiz URL, WebSocket el sıkışmasında geçersiz URL.
   Eski relay ayrı süreçte çöktü (yeniden üretildi); şimdi 400 dönüyor, süreç ve açık odalar etkilenmiyor.
2. **Misafir yeniden bağlanması bitiyordu:** 6 s ağ kopmasında misafir giriş ekranına düşüyor, ağ dönünce bağlanmıyordu (yeniden üretildi).
   Şimdi ekran korunuyor, deneme sürüyor.
3. **Ağ değişimi + oda dolu:** ölü eski misafir soketi odada yer tutuyor, yeniden bağlanan oyuncu "Oda dolu" ile kalıcı düşüyordu.
   Şimdi relay 12 s sessiz misafir soketini çıkarıyor; istemci denemeye devam ediyor.
4. **Ağ değiştiren host ~62 s dönemiyordu.** Doğru anahtarlı yeni bağlantı, sessiz eski bağlantının yerine geçiyor.
   Canlı host'un yerine hâlâ geçilemiyor (`host-exists`).
5. **Host kopunca zaman akıyordu:** misafire "duraklatıldı" deniyordu ama host'ta zaman ilerliyordu. Şimdi zaman da duruyor.
6. **Sınırlar ve bellek:**
   - IP başı tahmin sınırı (60 / 10 dk);
   - rol başına çerçeve sınırı (misafir 32 KiB);
   - toplam bağlantı sınırı;
   - bağlantı sayacı sızıntısı ve kapanmış kod belleği giderildi;
   - CDN önlü platformlar için `MP1_IP_HEADER`.

## 3. Değişen dosyalar

- **Relay:**
  - `research/mp1/server/relay.js`;
  - `research/mp0/server/dev-relay.js` (çerçeve sınırı parametresi, sayaç temizliği);
  - `research/mp1/deploy/relay.env.example`.
- **İstemci:** `research/mp1/client/join.js`, `research/mp1/client/mp1-host.js`.
- **Testler (yeni):**
  - `tests/mp5_relay_security_test.js` (11);
  - `tests/mp5_docker.cjs` (6; Docker yoksa NOT RUN);
  - `tests/browser-mp5.cjs` (10).
- **Kanıt:** `research/mp5/evidence/` (`mp5-results.json`, `mp5-docker.json`, 18 PNG), `research/mp5/README.md`.
- **Belgeler:** `MULTIPLAYER-MP5-MIMARI.md`, `-SECURITY.md`, `-DEPLOYMENT.md`, bu dosya, `PROJE-DURUMU.md`, `CLAUDE.md`.
- **Değişmeyenler:** Dockerfile, `.dockerignore`, `mp-core.js`, MP.2/MP.3/MP.3.1/MP.4 istemci dosyaları, bütün runtime dosyaları.

## 4. Test sonuçları

### `tests/mp5_relay_security_test.js` — 11/11 PASS

1. Çökme vektörleri. Ayrı relay sürecinde: süreç ayakta, sağlık 200, açık oda ileti taşıyor, çıktıda kod/anahtar yok.
2. Rol başına çerçeve sınırı: misafir 40 KB → 1009; host 200 KB gönderebiliyor.
3. Tahmin sınırı:
   - 60 yanlış kod/anahtar → 429;
   - gerçek kod da o IP için kapanıyor;
   - vekil arkasında başka telefon etkilenmiyor;
   - kapanmış gerçek kod tahmin sayılmıyor.
4. `MP1_IP_HEADER`: aynı kenar IP'sindeki farklı telefonlar ayrılıyor. Güvenilen vekil yokken başlık yok sayılıyor.
5. Kaba kuvvet hesabı: 200 açık odada günlük isabet olasılığı 2·10⁻⁶.
6. `MP1_MAX_CONNS` → 503; bağlantı kapanınca yer açılıyor.
7. Bellek: kapanan bağlantıların sayaçları siliniyor.
8. Ölü host'un yerine doğru anahtar geçiyor. Canlı host'un yerine geçilemiyor; yanlış anahtar asla geçemiyor.
9. Ölü misafir soketi çıkarılıyor: 12 s eşiği, 11 s sessizlikte çıkarılmıyor; canlı misafir asla çıkarılmıyor.
10. WSS URL'lerinde jeton/anahtar yok.
11. Relay hiçbir şey günlüğe yazmıyor.

### `tests/mp5_docker.cjs` — 6/6 PASS (Docker 29.9.2; bu oturumda daemon başlatıldı)

1. İmaj içeriği:
   - 36 dosya; 19 runtime manifestle bayt bayt aynı;
   - `node` kullanıcısı;
   - test/ZIP/anahtar yok.
2. Yanlış yapılandırma 3 biçimde gerekçeyle 1 koduyla çıkıyor.
3. Sağlık:
   - `/healthz` 200;
   - TLS'siz GET 308; vekilden 200 + HSTS;
   - izin listesi dışı 404;
   - `HEALTHCHECK` "healthy".
4. TLS vekili üzerinden WSS:
   - oda 28 ms, katılım 17 ms, gidiş-dönüş 12 ms;
   - bozuk istekler konteyneri düşürmüyor;
   - günlük 1 satır.
5. Bellek: boşta 12,5 MB; 50 oda × 3 bağlantı (150 WSS) 15,5 MB; kapanınca 12,3 MB.
6. `docker restart`:
   - odalar `server-restart` ile kapanıyor;
   - sağlık 0,18 s'de dönüyor;
   - eski kod geçersiz;
   - `docker stop` 0,35 s, çıkış 0.

### `tests/browser-mp5.cjs` — 10/10 PASS

Kurulum:

- Relay: Docker konteyneri.
- Önünde yerel TLS vekili (HTTPS/WSS; Chromium yalnız yerel sertifikanın SPKI'sine güveniyor).
- Her telefona ayrı TCP yolu (kes / dondur).
- Ayrı Chromium süreçleri: host (kalıcı profil, 844×390), B (390×844), C (360×800), izinsiz kişi (412×915).
- Relay yoklaması varsayılan 25 s.

Senaryolar:

1. Kurulum:
   - host HTTPS, güvenli bağlam;
   - oda 0,3 s; B/C katılım 0,56 s (WSS bağlantısı 61–64 ms);
   - başlat → misafir görünümü 0,46 s;
   - misafirde motor yok.
2. Eşzamanlı komutlar: B ve C aynı anda araştırma + inşa + filo; 5/5 ok, toplam 129 ms. C, B'nin filosunu yönetemiyor (`not-owner`); B, C adına komut veremiyor (`forged-empire`).
3. Diplomasi: ticaret → karşı teklif → kabul tam bir kez (−250/+60 · +250/−60); ikinci kabul `rules:closed`. Federasyon oyu 15 gün sonra hâlâ insanda; B kendi oyunu verdi. Vasallık teklif → karşı teklif → kabul → sözleşme (Enerji %10).
4. B ağ kopması (8 s): oyun ekranı korundu, "Bağlantı koptu — yeniden bağlanılıyor…" (4 ekran boyutunda düzen denetimi); ağ dönünce 3,1 s'de aynı devlet.
5. B ağ değişimi (sessiz ölü soket): "Ağ bağlantısı yok" → `online` → **12,8 s**'de döndü; host'ta tek kayıt.
6. Host ağ kopması (8 s):
   - misafir "Host bağlı değil — oyun duraklatıldı"; komut gönderilmiyor (`host-yok`);
   - host'ta oyun günü **değişmedi**;
   - ağ dönünce 7,1 s'de aynı oda; hız geri geldi.
7. Host ağ değişimi (sessiz ölü host soketi): `online` olayıyla **36,5 s**'de aynı odaya döndü (relay eski bağlantıyı yoklama + 5 s sessizlikten sonra bırakıyor).
8. Yetkisiz erişim:
   - izinsiz kişi dolu odaya giremiyor ("Oda dolu");
   - yanlış host anahtarı `bad-host-key`; gerçek host etkilenmiyor;
   - WSS URL'lerinde jeton/anahtar yok;
   - relay günlüğü 1 satır.
9. Relay yeniden başlatma:
   - misafirler "Sunucu yeniden başlatıldı; oda kapandı." gördü; host'ta oyun durdu ama kaybolmadı;
   - OYUNU KAYDET → host tarayıcı süreci gerçekten kapandı → yeni süreç → KAYITLI OYUNA DEVAM ET → yeni kod; RNG ve gün aynı;
   - B ve C eski devletlerine döndü; vasallık sözleşmesi ve federasyon oyu korundu.
10. Performans (bkz. §9).

## 5–6. Bağlantı ve kopma özeti

| Ölçüm (yerel, aynı makine) | Değer |
|---|---|
| WSS bağlantısı (misafir) | 55–64 ms |
| Davet bağlantısı → lobi | 0,36–0,57 s |
| Komut RTT (ping) | 5–36 ms |
| Misafir 2 s kopma → dönüş | 0,93–0,95 s |
| Misafir 8 s kopma → dönüş | 3,1 s |
| Misafir ağ değişimi (ölü soket) → dönüş | 12,8 s |
| Host 8 s kopma → dönüş | 7,1 s |
| Host ağ değişimi (ölü soket) → dönüş | 36,5 s (varsayılan yoklama) |
| Relay yeniden başlatma (konteyner) | 0,85–1,16 s; sağlık 0,1–0,18 s sonra |
| Kayıt → devam lobisi | 0,41–0,49 s |

## 7. Android

- Fiziksel Android: **NOT RUN.**
- Chromium mobil dokunmatik bağlamında doğrulanan:
  - oda açma/katılma;
  - gerçek dokunma (`tap`);
  - kopma ve ağ değişimi ekranları;
  - "Sunucu yeniden başlatıldı" ekranı;
  - kayıttan devam.
- Durum çubuğu ve giriş ekranı 360×800, 390×844, 412×915 ve 844×390'da denetlendi: yatay taşma yok, düğmeler ≥ 44 px.
- Arka plan/ekran kilidi MP.1.1 testinde (`browser-mp11`) yeniden geçti.
- Kopyalama/paylaşım düğmeleri MP.1/MP.4 testlerinde.

## 8. Güvenlik

`MULTIPLAYER-MP5-SECURITY.md`. MP.4'ten devralınan konular (şifresiz dosya, imzasız bütünlük, yerel kimlik kaybı, oyun sırasında kurtarma)
internet riskini artırmıyor; gerekçesiyle MP.5.1'e bırakıldı.

## 9. Performans (Docker relay + TLS vekili; 1 misafir; 30 oyun günü)

| | 45 sistem | 60 sistem | 100 sistem |
|---|---|---|---|
| Katılım (davet → lobi) | 403 ms | 465 ms | 525 ms |
| Başlat → ilk görünüm | 345 ms | 392 ms | 422 ms |
| İlk anlık görüntü | 15,3 KB | 16,0 KB | 17,2 KB |
| Delta medyan / en çok | 228 B / 956 B | 226 B / 944 B | 227 B / 1,19 KB |
| 30 oyun günü misafir trafiği | 7,8 KB | 8,6 KB | 8,3 KB |
| RTT | 5–20 ms | 9–36 ms | 9–28 ms |
| 2 s kopma sonrası dönüş | 929 ms | 942 ms | 951 ms |
| Relay konteyner belleği | 13,0 MB | 14,4 MB | 14,9 MB |
| Misafir sekme dokunuşu | 79 ms | 72 ms | 60 ms |

## 10–11. Regresyon

| Test | Sonuç |
|---|---|
| Tam Node regresyonu (`run-all`, 3 işçi) | **150 paket, 6211 PASS / 3 FAIL** (6200 MP.4 referansı + yeni `mp5_relay_security_test` 11). 3 FAIL: bilinen `faz95d_identity_test.js` seed 11/99/404; yeni FAIL yok. MP Node paketleri: mp0 11, mp1_lobby 7, mp1_relay 14, mp11 9, actor_vision 2+2, mp2 7, mp3 11, mp31 15, mp4 13, mp5 11 — hepsi PASS |
| `browser-mp5` / `mp5_docker` | 10/10 / 6/6 PASS |
| `browser-mp4` (MP.4 kayıt/yükleme, gerçek kapanış) | 13/13 PASS |
| `browser-mp0` / `mp1` / `mp11` / `mp2` / `mp3` / `mp31` | 20/20 · 22/22 · 10/10 · 14/14 · 12/12 · 11/11 PASS |
| `browser-96h10` (tek oyunculu) | 27/27 PASS |
| Save8/RNG (`mp4_core_test` §9) | PASS (run-all içinde) |
| ZIP / CRC / manifest | DOĞRULANDI, değişmedi |

## 12. Dağıtım

`MULTIPLAYER-MP5-DEPLOYMENT.md`.

- Önerilen ilk gerçek test: Render Free (Docker).
- Kalıcı ücretsiz yol: Oracle Always Free VM + Caddy.
- Canlı dağıtım YOK; URL yok.

## 13. Kalan eksikler

- Canlı relay sunucusu ve iki gerçek telefonla internet testi.
- Fiziksel Android (Chrome indirme/dosya seçici, arka plan, ağ değişimi, ekran kilidi).
- Host ağ değişiminde dönüş varsayılan yoklamayla ~36 s; daha hızlısı için yoklama kısaltma ya da istemci tarafı canlılık denetimi (MP.5.1).
- Platform vekilinin IP başlığı dağıtımdan sonra doğrulanmalı.
- MP.4'ten devralınanlar (§8).

## 14. MP.5.1 önerileri

1. Hesap sahibiyle canlı dağıtım (Render Free) + iki telefon / iki ağ smoke testi.
2. Fiziksel Android oturumu: kopma, ağ değişimi, arka plan, dosyadan kayıt.
3. Host canlılık denetimi (uygulama düzeyi ping) ile host ağ değişiminde < 15 s dönüş.
4. Oyun sırasında host onaylı kimlik kurtarma.
5. İsteğe bağlı kayıt şifreleme/imzalama.

## 15. NOT RUN

- Gerçek internet sunucusu (dağıtım yok, URL yok).
- İki fiziksel telefon / iki ayrı ağ.
- Fiziksel Android.
- LAN.
- Sağlayıcı platformunda imaj derlemesi.

## 16. Sağlayıcı kaynakları (2026-10 araması)

- Render free: https://render.com/docs/free — https://render.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages
- Koyeb scale-to-zero: https://www.koyeb.com/docs/run-and-scale/scale-to-zero
- Cloud Run WebSockets: https://docs.cloud.google.com/run/docs/triggering/websockets
- Oracle Always Free: https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm
- Fly.io (eski planlar): https://fly.io/docs/about/discontinued-plans/
