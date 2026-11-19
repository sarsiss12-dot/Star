# p43 ölçümlerini yeniden çalıştırma

[İnceleme raporu](../../reports/codex/P43-AI-PERF-ARASTIRMA-SONUC.md) · [Ham çıktılar](raw)

Oyun kaynağı `54a52555c699d82507f6285580577571d4200380`. Komutları depo kökünde, Node.js 24 ve Python 3 ile çalıştırın. Tarayıcı deneyleri için Node’un çözümleyebildiği `playwright` paketi ve çalışır bir Chromium gerekir. Kullanılan yürütülebilirin tam yolunu `STARS_CHROMIUM_PATH` değişkeninde verin. Relay yalnız loopback adresinde geçici bir port açar.

## Kampanyalar ve kararlar

```bash
for seed in 11 99 404; do
  node research/p43-audit/campaign.cjs 100 9 "$seed" 240
done
node research/p43-audit/campaign.cjs 500 16 11 240
node research/p43-audit/campaign.cjs 45 5 11 8 seed11-month66-siege.save
node research/p43-audit/campaign.cjs 45 5 11 8 seed11-month79-escort.save
node research/p43-audit/checkpoints.cjs
node research/p43-audit/choices.cjs
node research/p43-audit/corridor.cjs
```

Doğal koşular `/tmp/stars-p43` içinde Save8 kontrol noktaları, `raw` altında olay ve ay kayıtları üretir. Kayıt dizini `CHECKPOINT_DIR` ile değiştirilebilir. 96H.9 kuşatma girdileri depodaki `tests/fixtures/96h9` klasöründen gelir. Gözlemdeki başlangıç günü o kayda aittir. Doğal 404 kampanyası 180. ayda oyun sonuna ulaşır.

## Profil ve görünüm

```bash
for config in 100-9 500-16; do
  for month in 3 120; do
    key="${config}-11-m${month}"
    save="/tmp/stars-p43/${key}.save"
    node research/perf1/scripts/profile.cjs . "$save" 6 > "research/p43-audit/raw/cpu-${key}.json"
    node research/perf2/scripts/breakdown.cjs . "$save" 8 "$key" > "research/p43-audit/raw/detail-${key}.json"
  done
done
node research/p43-audit/browser.cjs mp 100
node research/p43-audit/browser.cjs mp 500
node research/p43-audit/browser.cjs sp 100
node research/p43-audit/browser.cjs sp 500
node research/p43-audit/browser.cjs join 100
node research/p43-audit/browser.cjs join 500
```

`browser.cjs` MP için aynı odada iki gerçek tarayıcı süreci açar. Tersane düğmesi ve kuyruk doğrulaması deponun p42 saha testindeki `order` işlevindendir. Misafirin veri alımından çizime kadar geçen süre, panel satırını testin gözlediği süre ve host kabulü ayrı alanlardadır. Tek oyunculu geç sahnede insan filosu kalmadığında seçili rota sayılmaz. Kareler için `frames`, Canvas için `draw`, JS uzun işleri için `long`, örnek sonu JS belleği için `heap` alanlarını kullanın.

500 sistem / 16 AI, tohum 11’in tam 120. ay girdisi [500-16-11-m120.save.gz](fixtures/500-16-11-m120.save.gz) dosyasında. Bu tek deneyi doğrudan çalıştırmak için aşağıdaki komutlar yeterlidir.

```bash
mkdir -p /tmp/stars-p43
gzip -dc research/p43-audit/fixtures/500-16-11-m120.save.gz > /tmp/stars-p43/500-16-11-m120.save
node research/p43-audit/chromium-pilot.cjs 500-16-11-m120
```

## Eşleştirilmiş performans deneyi

```bash
for key in 100-9-11-m120 500-16-11-m3 500-16-11-m120; do
  node research/p43-audit/pilot.cjs "/tmp/stars-p43/${key}.save" 10
done
node research/p43-audit/chromium-pilot.cjs
python3 research/p43-audit/summarize.py
```

Pilot yalnız deney sürecinde iki keşif/takviye yardımcısının çağrısı boyunca etkin olur. Her kol aynı girdiden başlar. Her ölçülen ayın gün, RNG ve tam Save8 SHA-256 değerleri `runs[].rows[]` içinde durur. Kontrollere ve adaya ait zamanlar ilk ısınma ayından sonradır. Chromium çıktılarındaki `live` alanı ise p43 kontrolünün normal oyun döngüsünde, en yüksek oyun hızında ayrı sayfada alınmıştır.

Makineler arasında aynı duvar süresi beklenmez. Oyun sonu, karar dizileri, ödemeler ve aynı ortamdaki kol çiftlerinin Save8/RNG sonuçları ayrı doğrulanabilir. Özet tabloların girdisi [summary.json](raw/summary.json).
