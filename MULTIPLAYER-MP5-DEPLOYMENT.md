# STARS — MP.5 dağıtım: relay'i internete açmak (hazır paket, canlı değil)

**Durum: dağıtıma hazır; canlı dağıtım YAPILMADI.** Bu oturumda hiçbir barındırma hesabına erişim yoktu (gcloud `CREDENTIALS_MISSING`, AWS
değişkenleri yer tutucu, Render/Koyeb/Oracle/Fly hesabı yok). Çalışan bir sunucu ve URL yok; bu belgede uydurma adres yoktur.
Kullanıcı onayı olmadan ücretli kaynak açılmadı.

## 1. Ne doğrulandı (yerelde)

| Denetim | Sonuç | Kanıt |
|---|---|---|
| `docker build` (Dockerfile değişmedi) | PASS — 36 dosya: 19 runtime (manifestle bayt bayt aynı) + manifest + MP betikleri; `node` kullanıcısı; test/ZIP/.git/anahtar yok | `tests/mp5_docker.cjs` |
| Yanlış yapılandırma | PASS — `MP1_ORIGINS` yok / `http://` / `MP1_DEV=1` → konteyner gerekçeyle 1 koduyla çıkar | aynı |
| Sağlık | PASS — `/healthz` 200; Docker `HEALTHCHECK` "healthy" | aynı |
| TLS zorunluluğu | PASS — vekilsiz/TLS'siz GET 308 → `https://…`; vekilden https ile 200 + HSTS | aynı |
| WSS | PASS — yerel TLS vekili → konteyner: oda, katılım, iki yönlü ileti | aynı + `tests/browser-mp5.cjs` |
| Yeniden başlatma | PASS — `docker restart` → odalar `server-restart` ile kapanır, sağlık ~0,1 s'de döner; `docker stop` ~0,3 s, çıkış 0 | aynı |
| Bellek | boşta ~12 MB; 50 oda × 3 WSS bağlantısı ~15 MB | aynı |
| Günlük | yalnız başlangıç satırı; oda kodu, host anahtarı, jeton yok | aynı |

Taban imaj `node:22-alpine`. Bu ortamda docker.io anonim çekmeyi 429 ile sınırladığı için aynı resmî imaj `mirror.gcr.io/library/node:22-alpine`
yansısından çekildi. Dağıtım platformu kendi kayıt defterinden çeker.

## 2. Ücretsiz / düşük maliyetli seçenekler (2026-10 itibarıyla; koşullar değişebilir, hesap açmadan önce sağlayıcı sayfasını doğrula)

Relay tek süreç, durumsuz bellek içi odalar, düşük bellek (~15 MB) ve uzun ömürlü WebSocket ister. Belirleyici kısıtlar: uyku (odaları
kaybettirir), WebSocket süre sınırı (yeniden bağlanma ile tolere edilir), tek örnek zorunluluğu.

| Seçenek | Ücret | Uyku / süre sınırı | WebSocket | STARS için değerlendirme |
|---|---|---|---|---|
| **Render — Free web service (Docker)** | 0 | 15 dk gelen trafik yoksa uyur (Şubat 2026'dan beri WebSocket iletileri trafik sayılıyor); uyanma ~1 dk; platform her an yeniden başlatabilir | var | **İlk gerçek test için önerilen.** Oyun sırasında misafir sayfası 3 s'de bir ping gönderir → uyumaz. Boşken uyur: ilk açılış ~1 dk sürer. Yeniden başlatma odayı kapatır → MP.4 kaydı ile yeni oda |
| Koyeb — Free instance | 0 | 1 saat trafik yoksa sıfıra iner; açık WebSocket uykuyu engeller | var | Render'a benzer; uyandırma davranışı (WebSocket ile kısa ömür) daha belirsiz |
| Google Cloud Run | ücretsiz kota + kullanım | istek süresi en çok 60 dk → WebSocket saatlik kopar | var | Host anahtarla, misafir jetonla kendiliğinden döner; ama oturum ortasında saatlik kopma + soğuk başlangıç. Tek örnek (`max-instances=1`) zorunlu |
| Oracle Cloud Always Free VM + Caddy | 0 (kart doğrulaması gerekebilir) | uyumaz; 7 günde %20 altı CPU'da "boşta" sayılıp geri alınabilir | var | **Kalıcı kullanım için en uygun ücretsiz yol** (MP.1.1 Yol B). Kurulum telefon dışı adımlar ister (SSH) |
| Fly.io | yeni hesaplarda ücretsiz katman yok (kısa deneme, sonra kartla ödeme) | — | var | Onaysız önerilmez |

Kaynaklar: Render free docs ve Şubat 2026 changelog'u, Koyeb scale-to-zero belgesi, Cloud Run WebSocket belgesi, Oracle Always Free kaynak
referansı, Fly.io topluluk/fiyat sayfaları (bağlantılar `MULTIPLAYER-MP5-SONUC.md` §16).

## 3. Render ile adım adım (telefondan web paneliyle yapılabilir)

1. render.com → New → Web Service → GitHub deposu `sarsiss12-dot/Star`.
2. Language/Runtime: **Docker**. Dockerfile path: `research/mp1/deploy/Dockerfile`. Root/context: depo kökü.
3. Instance type: **Free**. Region: oyunculara yakın (ör. Frankfurt).
4. Service name seç (ör. `stars-relay-<senin-adın>`); adres `https://<service-name>.onrender.com` olur.
5. Environment:
   - `MP1_ORIGINS=https://<service-name>.onrender.com` (zorunlu; yanlışsa relay başlamaz ve günlüğe nedenini yazar)
   - `MP1_TRUST_PROXY=1`, `MP1_BIND=0.0.0.0` imajda hazır; `PORT`'u Render verir.
6. Health check path: `/healthz`.
7. Deploy. Ardından §5 doğrulaması.

## 4. Dağıtımdan sonra mutlaka doğrula

1. `node research/mp1/deploy/smoke.js https://<alan>` (bilgisayar gerekir) ya da telefondan: `https://<alan>/healthz` → `{"ok":true}`;
   `https://<alan>/` → oyun açılır, ÇOK OYUNCULU görünür.
2. **İki telefon, iki farklı ağ** (biri Wi-Fi, biri mobil veri): oda aç, katıl, devlet seç, oyunu başlat, inşa/filo komutu, DİPLOMASİ teklifi.
3. **IP başı sınırlar:** iki farklı ağdaki telefon aynı anda bağlanabiliyorsa sorun yok. Biri "Çok fazla deneme" / 429 alıyorsa platform istemci
   IP'sini başka başlıkta veriyor demektir: `MP1_IP_HEADER` (ör. `cf-connecting-ip` ya da `true-client-ip`) ayarla. Bu başlık YALNIZ
   `MP1_TRUST_PROXY=1` iken okunur.
4. Kopma: bir telefonda uçak kipini 10 s aç/kapat → oyun ekranı korunur, kendiliğinden döner.
5. Platform yeniden başlatması: misafirler "Sunucu yeniden başlatıldı; oda kapandı." görür; host oyunu duraklar → OYUNU KAYDET →
   KAYITLI OYUNA DEVAM ET → yeni kod.

## 5. Ortam değişkenleri (yeni olanlar MP.5)

`research/mp1/deploy/relay.env.example`: `MP1_ORIGINS` (zorunlu), `MP1_TRUST_PROXY`, `MP1_BIND`, `PORT`/`MP1_PORT`, `MP1_MAX_ROOMS` (200),
`MP1_ROOM_TTL_MS` (12 sa), `MP1_HOST_GRACE_MS` (10 dk), `MP1_CREATES_PER_MIN` (10), `MP1_PING_MS` (25 s),
**`MP1_MAX_CONNS`** (2000, MP.5), **`MP1_IP_HEADER`** (MP.5), `MP1_TLS_CERT`/`MP1_TLS_KEY` (vekilsiz TLS).
Gizli anahtar gerektiren ayar yoktur.

## 6. Bilinen işletme sınırları

- Odalar bellekte: tek örnek; yeniden başlatma odaları kapatır (kayıt/yükleme ile sürdürülür).
- Ücretsiz katmanlarda uyku: ilk bağlantı ~1 dk gecikebilir; oyun sırasında uyumaz.
- Platformun erişim günlüğü davet URL'sindeki oda kodunu görebilir (kod bir davettir; kimlik değildir; oyun başladıktan sonra yalnız
  jetonlu oyuncular girer).
