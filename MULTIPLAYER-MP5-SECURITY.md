# STARS — MP.5 güvenlik: internete açık relay ve bağlantı dayanıklılığı

Kapsam: `research/mp1/server/relay.js`, `research/mp0/server/dev-relay.js` (çerçeve okuyucu), `research/mp1/client/join.js`,
`research/mp1/client/mp1-host.js`. Oyun motoru, `mp-core.js` yetki kuralları ve 19 runtime dosyası değişmedi.

## 1. Mimari ilke (değişmedi)

- **Host-yetkili:** oyun kararları yalnız host telefonun motorunda. Relay ileti içeriğini yorumlamaz, yalnız odaya göre yönlendirir,
  gönderici bağlantı kimliğini kendisi damgalar (`F<conn>`), sınır uygular.
- Relay'in açık olması host'un oyunu sürdürdüğü anlamına gelmez: host kopunca misafirler `host-left` alır ("Host bağlı değil — oyun
  duraklatıldı"); oda host'u 10 dk bekler (`MP1_HOST_GRACE_MS`), sonra kapanır.
- Komut yetkisi `mp-core.js`'de: sahte devlet `forged-empire`, başkasının filosu `not-owner`, ziyaretçi `not-started`, bağsız bağlantı
  `not-joined` (MP.0–MP.4 testleri + `browser-mp5` WSS üzerinden yeniden doğrulandı).

## 2. MP.5'te bulunan ve düzeltilen sorunlar (hepsi yeniden üretildi, sonra testle kapatıldı)

| # | Sorun | Etki (internette) | Düzeltme | Test |
|---|---|---|---|---|
| 1 | `GET /%E0%A4%A` (bozuk %-kodlama) → `URIError` yakalanmıyor | **Tek istekle relay süreci çöküyor, bütün odalar düşüyor** | `serve` try/catch → 400; hata sayılır, ayrıntı yazılmaz | `mp5_relay_security_test` 1 (ayrı süreç); eski relay'de çöktüğü gösterildi |
| 2 | `GET //a:99999/x` (geçersiz URL) → `new URL` hatası | aynı | aynı | aynı |
| 3 | WebSocket el sıkışmasında geçersiz URL → `upgrade` hatası | aynı | `upgrade` try/catch → 400; el sıkışma soketine hata dinleyicisi | aynı |
| 4 | Misafir yeniden bağlanırken tek başarısız deneme otomatik yeniden bağlanmayı bitiriyordu | 6 s'lik ağ kopmasında misafir giriş ekranına düşüyor, ağ dönünce bağlanmıyordu | Lobi/oyun ekranı korunur, deneme sürer (geri çekilme ≤ 8 s) | `browser-mp5` 4; önce scratch betikle yeniden üretildi |
| 5 | Ağ değişince eski misafir soketi ölü kalıp odada yer tutuyordu | Yeniden bağlanan telefon "Oda dolu" alıp kalıcı olarak düşüyordu | Relay: oda doluyken bir yoklama aralığından uzun sessiz bağlantı çıkarılır. İstemci: yeniden bağlanırken "oda dolu" kalıcı değil | `mp5_relay_security_test` 9, `browser-mp5` 5 |
| 6 | Ağ değiştiren host'un ölü eski soketi | Host ~62 s (2,5 × yoklama) geri dönemiyordu | Doğru anahtarla gelen yeni host, bir yoklama aralığı + 5 s sessiz kalan eskisinin yerine geçer. Canlı host'un yerine geçilemez (`host-exists`). Yanlış anahtar asla | `mp5_relay_security_test` 8, `browser-mp5` 7 |
| 7 | Host'un ağı kopunca misafire "duraklatıldı" deniyordu ama host'ta zaman akıyordu | Misafir devletleri sahipsizken oyun ilerliyordu | Zaman da durur (`netSpeed`); bağlantı dönünce hız geri gelir. Oda kapandıysa host bilerek hızı açabilir | `browser-mp5` 6 |
| 8 | Oda kodu tahmini yalnız dakikalık katılım sınırıyla (30/dk/IP) yavaşlıyordu | Sürekli tahmin 43 200/gün/IP | IP başı 10 dk'da 60 yanlış kod/host anahtarı → el sıkışmada 429 (8 640/gün/IP). Kapanmış gerçek kod tahmin sayılmaz | `mp5_relay_security_test` 3, 5 |
| 9 | Kapanan bağlantıların sayaçları (`stats.byConn`) hiç silinmiyordu | Uzun süre açık relay'de sınırsız büyüme | Kapanınca silinir; kapanmış kod belleği 50 000 ile sınırlı | `mp5_relay_security_test` 7 |
| 10 | Misafir çerçevesi 1 MiB'a kadar tamponlanıyordu (ileti sınırı 8 KB) | IP başı 16 bağlantı × 1 MiB bellek | Rol başına çerçeve sınırı: misafir 32 KiB (8 192 karakter × 4 bayt), host 1 MiB | `mp5_relay_security_test` 2 |
| 11 | Toplam bağlantı sınırı yoktu | Çok IP'li sel | `MP1_MAX_CONNS` (2000) → 503 | `mp5_relay_security_test` 6 |
| 12 | CDN önlü platformda XFF'nin son girdisi ortak kenar IP'si olabilir | IP başı sınırlar farklı telefonları birlikte engelleyebilir | `MP1_IP_HEADER` (yalnız güvenilen vekil arkasında okunur) | `mp5_relay_security_test` 4 |

## 3. Kaba kuvvet hesabı

Kod uzayı 31⁸ ≈ 8,53·10¹¹. IP başı en çok 60 yanlış deneme / 10 dk = 8 640 / gün. 200 açık odada bir IP'nin günlük isabet olasılığı
≈ 2·10⁻⁶. Oyun başladıktan sonra kodu bilen yabancı yine giremez (`game-started` / jeton gerekir); devam lobisinde ziyaretçi kalır.

## 4. Sızıntı

- Relay hiçbir şey günlüğe yazmaz (başlangıç satırı dışında): Docker konteyner günlüğü bütün oturumdan sonra 1 satır; oda kodu, host
  anahtarı, jeton yok (`mp5_docker`, `browser-mp5`).
- WSS URL'leri yalnız `role` ve `code` taşır: host anahtarı ilk çerçevede, jeton `hello` içeriğinde (`browser-mp5`: bütün tarayıcıların
  açtığı her WebSocket URL'si denetlendi).
- Hata ayrıntısı istemciye ya da günlüğe gitmez (yalnız sayaç).

## 5. MP.4'ten devralınan konular — karar

| Konu | İnternet riskini artırıyor mu? | Karar |
|---|---|---|
| Kayıt dosyası şifresiz | Hayır: dosya relay'e hiç gitmez, telefonda kalır; jeton içermez (tuzlu SHA-256 özeti, 128 bit jeton) | MP.5.1 (paylaşılan dosyada galaksi görünür) |
| SHA-256 bütünlük kimlik doğrulama değil | Hayır: yalnız host'un kendi açtığı dosyayı etkiler; şema/oturum denetimi + motorun işlemli yüklemesi | MP.5.1 (imza/HMAC) |
| localStorage kaybında misafir kimliği | Kısmen: devam lobisinde host onaylı kurtarma var | MP.5.1 |
| Oyun sürerken host kimlik kurtarma yok | Hayır (güvenlik değil, kurtarma kolaylığı) | MP.5.1 |

## 6. Kalan riskler

- Gerçek internet ve fiziksel Android'de denenmedi; mobil ağ gecikmesi/kaybı ölçülmedi.
- Platform vekilinin IP başlığı dağıtımdan sonra doğrulanmalı (`MULTIPLAYER-MP5-DEPLOYMENT.md` §4).
- Relay tek örnek ve bellek içi: yeniden başlatma odaları kapatır (MP.4 kayıt/yükleme ile sürdürülür).
- Davet kodu URL'de: platform erişim günlüğü görebilir (kod bir davettir, kimlik değil).
