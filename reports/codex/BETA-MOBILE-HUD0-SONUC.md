# STARS — BETA-MOBILE-HUD.0 sonuç raporu

13 Kasım 2026 · Tek kişilik yatay telefon gözlemleri.

## Kaynak ve kapsam

- GitHub `sarsiss12-dot/Star`. Taban `claude/stars-beta-event-ux1`, HEAD `bcbd6973db8d9adf6cc25cda9efafa42bde3a477` (p25, PR #37).
- Teslim dalı `codex/stars-beta-mobile-hud0`. İnceleme tabanı p25 dalı. Build `96h10p25u1`, PWA `stars-v96h10p25u1`.
- Üretim gözlemi olan MP desync P0 önceliğindedir. Bu faz mobil arayüz isteğidir. Canlı Render ve fiziksel cihaz bu fazda NOT RUN.

## Değişiklikler

- Alt filo çubuğunda ROTA, DUR ve SİSTEM aynı satırdadır. Filo adı dar alanda kısalır. Çok dar alanda sistem düğmesi erişilebilir adıyla bir oka dönüşür. Panel açma/kapatma çubuğu aynı anda yeniden konumlandırır.
- ROTA eylemi dokunma sonrası otomatik çizim beklemesini aşarak HEDEF SEÇ durumunu hemen gösterir. Yeni rota seçimi önceki harita hedefleme modunu temizler. Bir sonraki geçerli sistem dokunuşu mevcut `orderMove` yolunu kullanır. Sonraki durak ekleme korunur.
- Olay kartları ve hızlı kararlar, geçici sol üst mesajların üstünde çizilir. Oyun içi **Kayıt ve Ayarlar → Geçici bildirim opaklığı** %25–%100 aralığında çalışır. Tercih cihazda saklanır.
- Save8 v8, MP paket4 ve protokol1. Yeni build önceki p6–p25 paket kimliklerini kabul eder. Paket bütünlüğü ve Save8 denetimleri uygulanmaya devam eder.

## Doğrulama

| Denetim | Sonuç |
| --- | --- |
| `browser-mobile-hud0.cjs` · 640×360, 800×360, 915×412 dokunma ve 1280×720 fare | 4 PASS |
| Yan panel açık/kapalı, üç düğme aynı satırda, 44 px ve üzeri yükseklik | PASS |
| Güvenilir ROTA girdisinde aynı tıklama olayı içinde HEDEF SEÇ, ilk geçerli hedefte seçili filonun rotası, diğer filo değişimi yok | PASS |
| Çakışan olay kartı üstte, geçici mesaj %25 ve olay kartı %100, yenilemede tercih geri yükleniyor | PASS |
| `browser-event-ux0.cjs` | 11 PASS |
| `mp4_core_test.js`, `mp_p0_sync_test.js`, `mp74_notice_test.js`, `beta_p01_compat_test.js` | 30 PASS |
| p25 ve aday · seed 22, 5 AI, başlangıç ve üç ay, Save8 baytları ve RNG | PASS |
| p25 paket yükleme uyumluluğu, bilinmeyen build ve bozuk içerik reddi | PASS |
| p25 kaynak koruması · beş çalışma zamanı dosyası bayt eşitliği | PASS |
| Fiziksel Android, canlı Render ve uzun MP oturumu | NOT RUN |

Taban VM denemesinde otomatik çizim beklemesi etkin kaldı ve açık tek gemi hedefleme modu ilk hedefi devraldı. Adayda aynı düzenek doğru filoya emir verdi. İlk Chromium başlatması çalışma ortamının soket kısıtında durdu. Son koşular Chrome Headless Shell 151 ile yürütüldü. Yeni testte ilk çakışma denemesi otomatik kart çizimi tamamlanmadan ölçüm aldı. Kartın görünür olmasını bekleyen son koşu dört ekran boyutunu geçti.

## Oyun paketi

- `releases/stars-faz96h10p25u1.zip` · 843689 bayt.
- SHA-256 `aeac17e9ce70ab8a8b1a47f7a50169a974f286fd37b9827501339e68f8941c22`.
- ZIP CRC32 `AA9FC131`. 20 girdi, 19 çalışma zamanı dosyası, üye CRC ve tam manifest hash eşleşmesi PASS.
- Paket kaydı `RELEASE-BETA-MOBILE-HUD0.json`.
