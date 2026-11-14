# STARS — BETA-SP-MAP-WAR.0

13 Kasım 2026 · Türkçe geliştirme raporu

## Kaynak ve sürüm

- GitHub tabanı `claude/stars-mp-p0-desync2` (PR #40), HEAD `43a36127d5bf66918ff4a7f89ae515ca40149789`.
- Aday dal `codex/stars-sp-map-war-variety`. Aday oyun `96h10p27s1`, PWA önbelleği `stars-v96h10p27s1`, MP `MP.8.9b24`. Save8 v8, MP paket 4 ve protokol 1.
- Çalışma zamanı ZIP'i `releases/stars-faz96h10p27s1.zip`, 847494 bayt. SHA-256 `f2aedaa0277ec01ff40c55dc0b00242eb84888c0b3b5f254c6614817aaaed46f`, arşiv CRC32 `c07282a7`. Tekrar paketleme bayt eşdeğerliği, 19 runtime dosyası, üye seti, dosya CRC'leri ve manifest eşleşmesi PASS.

## Tek oyuncu

- Arka plandan görünür duruma dönüşte kurtarma akışı boşalabilen kaynak Canvas önbelleklerini yeniler ve gezegen küçük resimleriyle armaları tekrar boyar. Sistem panelinin CSS gezegen simgelerine düz renk yedeği eklendi. Kullanıcının cihazında hangi yüzeyin boşaldığı kesinleşmedi. Chromium testinde kaynak ve hedef pikselleri silinerek kurtarma sınandı.
- Galaksi kurulumundaki **Rakip Doktrinler** seçeneğinde militarist, kriminal ve Fanatik Arındırıcı AI toplamı için alt/üst sınır girilir. Aynı sınırlar sabit sayıdır. Dağılım seed'e bağlıdır ve simülasyon RNG'sini tüketmez. Seçim tek oyunculuda açılır. Özel dağılımda AI, bilinen devletlerin yarısını aşan federasyonlara katılımı ve aday kabulünü daha düşük puanlar. Üyelik ve savaş kararı mevcut ilişkilere ve oyun koşullarına bağlı kalır.
- Haritanın bilinen, görünür devlet bölgelerinde arma filigranı çizilir. Oyun menüsündeki **Bölge armalarının opaklığı** %0–%60 arasındadır, %0 kapatır, %18 varsayılandır. Tercih cihazda kalır. Yeni oyunların AI devletleri ve oyuncunun arma seçicisi altı ek sembolü kullanabilir. Eski kayıtlardaki armalar korunur.
- **Savaş Merkezi → Geçmiş Savaşlar → Savaş Ayrıntısı → Toprak Paylaşımını İncele** bağlantısı eklendi. Uygun yakın seferler Diplomasi Merkezi'nde de bulunur. Taslak koloni ve boş sistemi ayırır, her satırda alıcı seçilir, hedef katkı payı ve önerilen devir görülür. Barışçı devirde otomatik inşanın yeni sahip için yanlışlıkla tekrar açılması düzeltildi. Nüfus ve yapılar korunur.
- Fetihte sahiplik savaş sırasında geçer. Barış veya statüko mevcut kontrolü bırakır. Ortak savaş paylaşımı bütün cepheler kapandıktan sonra uygun fetihlere uygulanır. Yaşayan ortaklar oybirliğiyle onayladıktan sonra oyuncu **Uygula** der. Yenilen tarafla ayrı bir toprak takası bu kapsamın dışındadır.

## Multiplayer desync

- P26, kesirli oyun gününde oluşturulan kriz politikası zaman damgalarının Save8 / misafir aynasında reddedilmesini düzeltti. Eski fotoğraftaki özgün Render oturumunun reddedilen alanı belirsiz. Kalıcı eşitleme sorununda son sağlam dünya gösterilir, emirler kilitlenir, tam ayna sınırlı biçimde istenir. Elle **Yeniden Eşitle** ve **Tanıyı Kopyala** seçenekleri vardır.
- P27'de host lobisinde isteğe bağlı **Bağlantı kaybında geçici AI koruması** var. Oyun akarken 30 saniye doğrulanmış kopma veya kalıcı eşitleme sorunu sonrası host, görünür üstün düşmandan görev bekleyen filoları güvenli sisteme çekebilir. Yeni diplomasi, harcama ve savaş kararı yoktur. Koltuk oyuncuda kalır. Güncel tam ayna onayıyla kontrol iade edilir.
- Bu aday eski p6–p27 ve p25u1 MP paketlerini mevcut diğer doğrulama kapılarıyla kabul eder. Test ve kullanıcı kabulü için aynı dalı ve sürümü çalıştıran host ile misafir kullanılır.

## Doğrulama

| Koşu | Sonuç |
|---|---|
| Chromium 915×412 tek oyuncu | 4 PASS: silinen sprite yeniden üretildi, Geçmiş Savaşlar paylaşım taslağında alıcı değişti ve dünya mutasyonsuz kaldı, arma opaklığı kalıcı, pregame 3/3 uygulandı |
| Tek oyuncu mobil HUD | 640×360, 800×360, 915×412, 1280×720 · 4/4 PASS |
| Toprak paylaşımı öneri / devir / gündem Node | 33/0, 28/0, 14/0 |
| Kimlik / harita Node | 23/0, 23/0 |
| Desync / AI koruması Node | 4/0, 7/0 |
| MP paket build doğrulaması | p6, p25u1, p26, p27 ve yeni aday kabul edildi. p5 ve p28 reddedildi |
| Chromium / yerel TLS relay, desync D | Aday ve P27 4/1. D0–D3 PASS. D4 iki dalda da misafir olay kartı görünürlük beklemesinde FAIL, bundan önce rota kontrolleri geçti |
| Chromium / yerel TLS relay, koruma G | 5/0. Kısa kayıp, kalıcı ret, duraklatma, tehditten geri çekilme, tam ayna ile iade ve tekrar kopma PASS |
| Sabit P27 Save8 ve RNG | Ham baytlar ve RNG başlangıçta ve 6 ay boyunca eşit, günlük adımlar dahil. Yeni doğal kurulumda yeni arma sembolleri normalize edilince kurulum ve 6 ay eşit |
| Özel kurulum | 8 seed, 2–4 aralığı ve Save8 dönüşü PASS. Sabit 0 ve 8 de doğrulandı. Kontrollü küçük blok cezası 0, büyük blok örneği 0,70 |
| 120 ay, 8 AI, üç seed, doğal / 2–4 rakip | En kalabalık federasyonun ölçülen zirvesi seed 23 için 7→5, 42 için 7→7, 404 için 7→6. Altı koşunun her birinde aynı anda en çok bir federasyon görüldü |
| Eski render harness'i | Aday ve P27 tabanı aynı 58/4. Eski VM harness'inde `DiplomaticInbox` bulunamadı, dört alt test bu nedenle FAIL |
| Fiziksel Android / canlı Render / gerçek internet / LAN | NOT RUN |

Açık kabul senaryoları fiziksel telefonda arka plan dönüşü, uzun gerçek Render misafir oturumu ve farklı galaksi ayarlarında uzun kampanyada federasyon dağılımıdır. Koruma bağdaştırıcısı dokuz değişen kaynak dosyasında P27 baytlarını tam olarak geri üretir.
