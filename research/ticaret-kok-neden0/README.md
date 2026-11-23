# TİCARET KÖK NEDEN.0 ölçümlerini tekrarlama

Komutları araştırma dalının depo kökünden çalıştır. Node 24 ve Playwright kullanıldı. p51 `1b95efb27a265f607bc33a3e131b071fb80d28e6`, p50 `d1784ffcbe45901674076e682658e9f5dec8f8ae`. Çalışma zamanı araştırma dalında p51 ile aynı. Chromium koşularını ve performans örneklerini başka yoğun işlemler olmadan sırayla yürüt. Yerel röle için yalnız gerekli ağ erişimini kullan. Ham kampanya dosyaları gzip sıkıştırılmış JSON'dur.

```sh
r=research/ticaret-kok-neden0
export STARS_SOURCE=1b95efb27a265f607bc33a3e131b071fb80d28e6
export STARS_CHECKPOINTS="$(mktemp -d)"
for seed in 11 99 404; do
  node "$r/campaign.cjs" "$seed" 240 "$STARS_CHECKPOINTS/camp-$seed.json"
done
STARS_BARE=1 node "$r/campaign.cjs" 11 60 "$STARS_CHECKPOINTS/bare-11.json"
for seed in 11 99 404; do
  for month in 30 60 90 120 150; do
    node "$r/corridors.cjs" "$STARS_CHECKPOINTS/ulu-$seed-$month.save" "$STARS_CHECKPOINTS/koridor-$seed-$month.json"
  done
  node "$r/investment.cjs" "$STARS_CHECKPOINTS/ulu-$seed-120.save" "$STARS_CHECKPOINTS/yatirim-$seed-120.json"
done
node "$r/shipping.cjs" "$STARS_CHECKPOINTS/sevkiyat.json"
node "$r/partner.cjs" "$STARS_CHECKPOINTS/ortak.json"
```

Önceki 100 ve 500 sistem sabit Save8 girdileri aşağıdaki yollarla elde edilir. Bu dosyalar aletin doğal p51 kampanyalarıyla aynı girdi değildir.

```sh
gzip -dc reports/codex/evidence/perf-sinir0/100-9-11-m120.save.gz > "$STARS_CHECKPOINTS/100-eski.save"
for month in 120 180; do
  gzip -dc "reports/codex/evidence/ai-ikame1/chromium/500-16-11-m$month.save.gz" > "$STARS_CHECKPOINTS/500-$month.save"
done
node "$r/replay.cjs" "$STARS_CHECKPOINTS/100-eski.save" "$STARS_CHECKPOINTS/karsilastirma-son.json" 2 6
node "$r/corridors.cjs" "$STARS_CHECKPOINTS/500-180.save" "$STARS_CHECKPOINTS/koridor-500-180.json"
export NODE_PATH="$PWD/tests/node_modules" STARS_CHROMIUM_PATH=/usr/bin/chromium
node "$r/browser-load.cjs" "$STARS_CHECKPOINTS/500-120.save" "$STARS_CHECKPOINTS/yuk-profil.json"
STARS_OUTPUT="$STARS_CHECKPOINTS/mobil" node tests/browser-ticaret-tamamlama0-sp.cjs
node tests/ticaret_tamamlama0_transit_test.js
node tests/ticaret_ag1_test.js
node tests/ticaret_ag2_tx_test.js
python3 "$r/summarize.py" "$r/raw"
```

Kampanya aracında 60 yarım günlük motor adımı ve `autoExploreTick` kullanılır. Kayıt-saatinde Save8 karmaları ve her ay RNG saklanır. Erken doğal bitişte sayım durur. Tamamlanmış turlar, imza ve gerçek `finish` makbuzlarından hesaplanır. Tur değeri, yük bazında teslim anındaki stoktan türetilen `itemValue` puanıdır. Pozitif marjı olan devletin yerli üretim yerine bu sonucu tercih edeceğini varsaymaz.

Rota aracı her çiftte en yakın 12 uç liman ve kalanlardan en çok 6 dağınık uç örneğini aynı sırayla inceler. H1 sanal aktarma noktası, H2 varsayımsal hak, H3 yalnız rota sorgusunda 4 sıçrama, H5 değiştirilmiş ekonomik sinyaldir. Bunlar tam doğal dünya koşuları değildir. Kapasite, `dealQuote` ve AI kabul ölçüleri farklı alanlardır. H6 hem gerçek kapılarla kontrol edilmiş salt inceleme hem tek kontrollü teslimat içerir. İdeal ağda hipotetik ara limanların gerçek nüfusu veya geliri yoktur. Savaş ve keşif kapıları kalır.

Yük deneyinde gerçek Save8 üzerinden kontrollü uzun koridor oluşturulur. 499 sıçrama, düz 168 liman ve çok sayıda aynı hatta yük doğal dağılımı temsil etmez. Profil, p95 örnekleri bittikten sonra çalışır. Mevcut p51/p50 üç tam ay Chromium ham verisi `reports/claude/evidence/ticaret-tamamlama0/perf/` altındadır. Yeniden hesaplamada interpolasyonlu p95, yeni kontrollü yükte en yakın sıra p95 kullanılır. Sonuçlar [Türkçe raporda](../../reports/codex/STARS-TICARET-KOK-NEDEN0.md) ve [ham kanıtta](raw/) bulunur.
