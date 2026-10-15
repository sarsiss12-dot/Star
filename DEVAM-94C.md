# STARS — 94C devam noktası

94C tamamlandı. Kaynak stars-faz94b.zip SHA-256:
ee272e5f50d0a45c7bb2725f354e9481bcbbc5fddbb8c2b867f04693838fa1f1.
Teslim stars-faz94c.zip; build 94c, cache stars-v94c, Save v8.

Önce FAZ94C-RAPOR.txt, KAMERA-94C.md, AI-KALITE-DENETIMI-94C.md,
ACIK-RISKLER.md ve ileri planları okuyun. Kendi ZIP hash'i dış teslim
özetindedir; içerik manifesti tools/verify-release.py ile kontrol edilir.

## Tamamlanan işler

- Sol kamera düğmeleri kaldırıldı, ayarlar menüsüne taşındı.
- Ortak terslenebilir affine hafif eğim, doğru seçim/culling/bitmap/gemi yönü.
- Kanıtlanan stoksuz aylık takas çoğalması, yanlış ortak rotası ve aynı ay
  tekrar uygulama kapatıldı. Ortak sistem limanları ve yıkılmış liman testli.
- 3×120, 1×360 ve büyük harita 120 aylık önce/sonra AI ölçümleri.
- 74 paket / 4.583 benzersiz kontrol / 0 kalan hata / 0 zaman aşımı.

## Yeniden üretme

    node tests/faz94c_camera_trade_test.js
    STARS_TEST_WORKERS=2 STARS_TEST_LOGS=tests/logs-local node tests/run-all.js
    node tests/measure-ai-94c.js . 99 /tmp/ai99.json 120
    node tests/measure-ai-94c.js . 99 /tmp/ai99long.json 360 '{"pirates":false,"poor":true}'
    python3 tools/report-ai-94c.py

Son komut paket içindeki before/after JSON'lardan rapor üretir. Yeni karşılaştırma
yaparken doğrulanmış 94B'yi ayrı klasörde tutun. Baseline dosyalarını 94C koduyla
üzerine yazmayın. Bir tam regresyon ve yalnız etkilenmiş takip testleri yeterli;
aynı uzun kampanyaları gerekçesiz tekrarlamayın.

## Koruma ve devam kapsamı

94B keşif planlayıcısı, AI/çatışma/diplomasi motor dosyaları değiştirilmedi.
93D.1 donanma, filo şablonları, sevkiyat ve bilim korunur. Görünüm oturumluk;
Save v8'e yalnız isteğe bağlı tradeFlowAt çift/ay alanı eklenmiştir.

İleri öneri 95A, kullanıcı ayrıca başlatmalıdır. Tohum 99 beklemeleri, stratejik
bilgi sınırları ve fraksiyon hedefleri çözülmüş değildir. Fiziksel Android kabulü
otomatik testlerden ayrıdır. Kayıt devamlılığı ham hash farkı yalnız üç mevcut
türetilmiş cache alanıdır; determinism.json ve save-load-differences.json'a bakın.
94D/95A otomatik başlamaz, GitHub'a ayrı talimat olmadan yayın yapılmaz.
