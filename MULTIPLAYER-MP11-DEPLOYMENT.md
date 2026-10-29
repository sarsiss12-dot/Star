# STARS MP.1.1 — relay'in internete dağıtımı

**Durum:** dağıtıma hazır, ama **dağıtılmadı.** Çalışan bir sunucu yok, URL yok.

Bu oturumda kullanılabilir bulut erişimi yoktu:

- Bulut kimlik bilgisi yok: gcloud ve AWS değişkenleri yer tutucu, gcloud `UNAUTHENTICATED` döndü.
- Dağıtım CLI'ı ve Docker daemon'ı yok.
- Ağ politikası tünel hizmetini engelliyor (`api.trycloudflare.com` → 403).
- Konteyner dışarıdan bağlantı kabul etmiyor.

Bu belge, bir hesabı olan kişinin STARS'ı bir HTTPS adresinde açmasının adımlarını veriyor. Telefondan yönetilebilen bir barındırma panelinde de uygulanabilir.

## 1. Ne çalıştırılıyor

Tek süreç: `node research/mp1/server/relay.js`. Bağımlılık yok, `npm install` yok.

Aynı süreç şunları sunuyor:

| Adres | İçerik |
|---|---|
| `https://<alan>/` | STARS oyun sayfası + ÇOK OYUNCULU katmanı. 19 runtime dosyası manifestle bayt bayt aynı; yalnız `index.html` yanıtına MP betikleri eklenir |
| `https://<alan>/mp/join?code=XXXXXXXX` | Davet bağlantısı. Motor yüklemeyen misafir sayfası |
| `wss://<alan>/mp1/ws` | Oda bağlantısı (host + misafirler) |
| `/healthz` | `{"ok":true}`. Platform sağlık denetimi için; TLS istemez, bilgi sızdırmaz |

Host simülasyonu host telefonun tarayıcısında çalışır. Sunucu oyunu yürütmez, yalnız ileti taşır. Bu yüzden en küçük konteyner/VPS boyutu yeter.

## 2. Platform gereksinimleri

- Uzun süre açık kalan **WebSocket** bağlantısı.
  - Bazı platformlar istek süresini sınırlar. Bağlantı kesilirse host anahtarla, misafir jetonla otomatik geri bağlanır. Yine de 30 dk'dan kısa sınırlar oyunu sık sık duraklatır.
- **HTTPS/WSS:** ya platform TLS'yi sonlandırır ve isteği konteynere düz HTTP ile iletir (`MP1_TRUST_PROXY=1`), ya da sertifika dosyası verilir (`MP1_TLS_CERT` / `MP1_TLS_KEY`).
- **Sürekli çalışan tek örnek.**
  - Odalar bellekte; birden fazla örneğe yatay ölçekleme oda yönlendirmesini bozar.
  - "Boşta uyuyan" ücretsiz katmanlar uykuda odaları kaybeder. Host oyunu kendi telefonunda sürdürür; misafirler "Sunucu yeniden başlatıldı; oda kapandı." görür.
- Ortam değişkeni girişi ve bir HTTP sağlık denetimi yolu.

## 3. Yol A — Docker destekli barındırma (GitHub'dan)

`research/mp1/deploy/Dockerfile`:

- Yalnız 19 runtime dosyasını, manifesti ve MP betiklerini kopyalar.
- `node:22-alpine` kullanır, `node` kullanıcısıyla çalışır.
- Kök dizindeki `.dockerignore` başka hiçbir dosyanın (testler, ZIP'ler, `.git`) imaja girmemesini sağlar.

Adımlar (çoğu platformda web panelinden):

1. Depoyu bağla. Dockerfile yolu: `research/mp1/deploy/Dockerfile`, derleme bağlamı: depo kökü.
2. Ortam değişkenleri (`research/mp1/deploy/relay.env.example`):

   ```
   MP1_ORIGINS=https://<platformun verdiği ya da kendi alan adın>
   ```

   `MP1_BIND=0.0.0.0`, `MP1_TRUST_PROXY=1` ve varsayılan `PORT=8080` imajda hazır. Platform kendi `PORT` değerini verirse relay onu dinler (`MP1_PORT` boş bırakılmalı).
3. Sağlık denetimi yolu: `/healthz`.
4. Örnek sayısı: **1** (otomatik ölçeklemede en çok 1).
5. Yayınlandıktan sonra §5'teki smoke testini çalıştır.

`MP1_ORIGINS` verilmezse, `http://` yazılırsa ya da TLS ayarı eksikse relay **başlamayı reddeder** ve nedeni hata çıktısına yazar. Yanlış yapılandırılmış güvensiz bir sunucu internete açılamaz.

## 4. Yol B — kendi sanal sunucun + Caddy

1. Sunucuya Node 22 kur; depoyu çek.
2. Relay'i servis olarak çalıştır, yalnız yerelden erişilebilir bağlantı noktasında:

   ```
   MP1_BIND=0.0.0.0 MP1_PORT=8080 MP1_TRUST_PROXY=1 MP1_ORIGINS=https://stars.ornek-alan.tr node research/mp1/server/relay.js
   ```

3. `research/mp1/deploy/Caddyfile.example`'daki alan adını değiştir. Caddy sertifikayı kendisi alır, HTTP'yi HTTPS'e yönlendirir, WebSocket'i ve `X-Forwarded-*` başlıklarını iletir.
4. Güvenlik duvarı: yalnız 80/443 açık. 8080 dışarıya kapalı.
   - Relay, vekilden geçmeyen (TLS'siz) her isteği zaten 308/403 ile geri çevirir.
   - Ama `X-Forwarded-Proto` başlığını uydurabilen doğrudan bir istemciye karşı tek güvence portun kapalı olmasıdır.
5. Doğrudan TLS (vekilsiz) da mümkün: `MP1_TLS_CERT` / `MP1_TLS_KEY` dosya yolları, `MP1_BIND=0.0.0.0`, `MP1_PORT=443`. Sertifika yenilemesi elle yapılır.

## 5. Dağıtım sonrası doğrulama (smoke testi)

```
node research/mp1/deploy/smoke.js https://<alan> [--http-redirect]
```

Kısa ömürlü bir test odası açıp kapatır; hız sınırlarını zorlamaz. 10 denetim:

1. `/healthz`
2. HSTS ve güvenlik başlıkları
3. Runtime dosyaları = `RELEASE-MANIFEST.json` (yanlış sürüm yayımlanmadı)
4. Misafir sayfası CSP'si
5. `/mp/stats` kapalı
6. WSS oda kurma
7. Misafir katılımı ve iki yönlü iletim
8. Yanlış host anahtarı reddi
9. Yabancı Origin reddi (403)
10. Oda kapatma ve eski kod

Bu araç yerelde iki yolla da doğrulandı (`tests/mp11_online_test.js`):

- doğrudan TLS;
- TLS sonlandıran ters vekil arkası.

Ayrıca Dockerfile'ın kopyaladığı dosya kümesiyle başlatılan relay'e karşı da çalıştırıldı.

## 6. Telefonda kullanım (dağıtımdan sonra)

1. Telefon A: `https://<alan>/` → ÇOK OYUNCULU → ODA OLUŞTUR → DAVET PAYLAŞ.
2. Telefon B: gelen `https://<alan>/mp/join?code=…` bağlantısını Chrome'da açar → ad → KATIL.
3. Devlet seç → HAZIRIM. Host OYUNU BAŞLAT.

Kimsenin PC, terminal ya da Node kullanması gerekmez. Ana ekrana ekleme (PWA) aynı adresten yapılabilir.

## 7. İşletme notları

- **Günlük:** başlangıçta tek satır (kip, TLS türü, izinli köken sayısı). Oda kodu, host anahtarı ve oyuncu jetonu hiçbir zaman yazılmaz.
  - Platformun kendi erişim günlüğü URL'deki oda kodunu görebilir. Host anahtarı URL'de değil, ilk WebSocket çerçevesinde gider.
- **Yeniden başlatma:** SIGTERM'de bütün odalar `server-restart` nedeniyle kapanır. Süreç 0 koduyla çıkar.
- **Maliyet:** relay yalnız metin taşıyor.
  - Misafir başına oyun ayı ~1,2–4,8 KB (45–100 sistem).
  - Canlı hız 3'te ~1,5 KB/sn (MP.0 ölçümü).
  - En küçük plan yeter. Sağlayıcı seçilmedi; fiyat iddiası yok.
