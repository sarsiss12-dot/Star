# p46 diplomasi araştırmasını tekrarlama

Depo kökünden çalıştırın. Kaynak oyun sürümü `8b2558d33c1ab6306618ae3e64018766f5bfeeba`. Kampanyalar Node ile gerçek oyun simülasyonunu yürütür. Tarayıcı deneyleri için test bağımlılıklarındaki Playwright ve yerel Chromium gerekir. Zaman ölçerken başka test yürütmeyin. [Türkçe araştırma raporu](../../reports/codex/P46-DIPLOMASI-ARASTIRMA-SONUC.md)

## Doğal kampanyalar

```sh
r=research/p46-diplomasi
for mode in normal turbulent medium
do
  for seed in 11 99 404
  do
    node "$r/campaign.cjs" "$mode" "$seed" 180 || exit 1
  done
done
python3 "$r/summary.py"
python3 "$r/verify.py"
```

`normal` Dengeli + Doğal, `turbulent` Çalkantılı + Doğal, `medium` Dengeli + Rakip Doktrinler Orta koşuludur. Her sıkıştırılmış JSON'da başlangıç kişilikleri, Save8 özetleri, aylık yaşayan devletler ve federasyon üyeleri, fonlar, RNG ve gün damgalı kararlar bulunur. `summary.py` her tohumda üç kolun ortak son gününde keser. `verify.py` üç Doğal koşunun tamamını p46 Git nesnesindeki yayımlanmış kampanyaların aynı aylarıyla karşılaştırır. [Aylık özet](raw/summary.json) · [21 Save8 ve 540 RNG karşılaştırması](raw/verification.json)

## Kontrollü kararlar ve arayüz

```sh
r=research/p46-diplomasi
saves=$(mktemp -d)
node "$r/checkpoint.cjs" 11 68 "$saves/m68.save"
node "$r/replay.cjs" "$saves/m68.save" score100
STARS_CHECKPOINTS=180 STARS_OUTPUT="$saves" node research/ai-ikame0/campaign.cjs "$PWD" aday 500 16 11 180
late="$saves/aday-500-16-11-m180.save"
sha256sum "$late"
node "$r/replay.cjs" "$late" score500 3
node "$r/corridor.cjs"
node "$r/support.cjs"
node "$r/types.cjs"
node "$r/mp-current.cjs"
export NODE_PATH="$PWD/tests/node_modules"
node "$r/landscape.cjs"
node "$r/panel.cjs" "$late"
node "$r/panel.cjs" "$late" frames
```

500 sistem, 16 AI, tohum 11 ve 180. ay girdisinin SHA-256 değeri `6373a93fba5c0cd94a15ffc7ffbad4ca854977bccc325d454f0474201cb119ea`. Kişilikleri koruyan iki kol aynı Save8'den başlar. Panel deneyi iki çizim geri çağrısını, kare deneyi gerçek oyun döngüsünü ölçer. Bu dizinde özel deneylerin JSON sonuçları ve depodaki mevcut sınamaların özgün günlükleri birlikte bulunur. Tarihsel müzakere testinin tek başına tekrarı ayrıca saklanmıştır. [Ham kanıtlar](raw)
