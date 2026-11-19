# AI-IKAME.0 doğrulaması

Başlangıç için p44 kontrol kökü `0559cfbeaac4cd4f458ccfaab23c3228de82b1cd`, araştırma yöntemi için `44c11195e31260c8e740c86689ed31a102d2e6b2` kullanılır. Komutları aday depo kökünden yürütün. Kontrol kökü ayrı bir çalışma ağacı olmalıdır.

```bash
export STARS_CONTROL_ROOT=/mutlak/yol/stars-p44
export STARS_OUTPUT=/mutlak/yol/ai-ikame-kosusu
for seed in 11 99 404; do
  node research/ai-ikame0/campaign.cjs "$STARS_CONTROL_ROOT" p44 100 9 "$seed" 240
  node research/ai-ikame0/campaign.cjs "$PWD" aday 100 9 "$seed" 240
done
node research/ai-ikame0/campaign.cjs "$STARS_CONTROL_ROOT" p44 500 16 11 240
node research/ai-ikame0/campaign.cjs "$PWD" aday 500 16 11 240
python3 research/ai-ikame0/compare.py "$STARS_OUTPUT"
node research/ai-ikame0/replay.cjs "$STARS_CONTROL_ROOT" "$STARS_OUTPUT" aday
node research/ai-ikame0/mp-save.cjs "$STARS_CONTROL_ROOT"
node tests/ai_ikame0_test.cjs
```

Hareketsiz oyuncu, varsayılan ayarlar ve ayda 60 yarım günlük adım kullanılır. Kampanya doğal oyun sonuna veya 240. aya kadar yürütülür. Ay başına Save8 SHA-256 ve RNG kaydedilir. Tamamlanmış sökümden sonraki ilk ücretli koloni işi 180 gün içinde aynı türü sıraya alır ve aynı sipariş tamamlanırsa bir döngü sayılır. Net mineral, gerçek ödemeden gerçek hurda iadesi düşülerek hesaplanır. İki doğal bitiş farklıysa yan etkiler ortak süre için de hesaplanır.

`compare-replacement-cost` kipi aynı beş p44 Save8 kaydından dengeli AB–BA–AB–BA ölçümü yapar. Tarayıcı düzeneği ikame önizlemesini ve bitiş doğrulamasını çalıştırır, ardından kontrolün eski yıkımını uygulayarak iki kolda aynı oyun iş yükünü korur. Her ölçümde ham Save8, RNG ve oyundaki gün eşit olmalıdır. Doğal aday davranışı kampanya ve tekrar düzeneklerinde ayrıca çalışır. [p44 girişleri ve Chromium komutları](../perf-sinir0/README.md)

Chromium H, J ve performans koşularını sırayla yürütün. H için `STARS_H_RAW=1`, p44 relay için `STARS_RELAY_ROOT="$STARS_CONTROL_ROOT"` kullanılır. H aynalarının ham özetleri `research/perf-sinir0/mp-proof.cjs` ile karşılaştırılır.
