# Doğrulanmış seed404 performansı

45 sistem, 7 devlet (ölçümlerde 7 canlı), 2 insan + 5 AI, açık diplomasi paneli; aynı ayarlar fakat ayrı koşular. Her ay adımı satırında n=3. Süreler ms; median/p95. rAF FPS ekran FPS'i değildir.

| CPU | Ay | Host ay | Host publish | Guest build | Guest deserialize | Guest refresh | Guest rAF ms | rAF/s | Window s |
|---|---|---|---|---|---|---|---|---|---|
| 1× | 120 | 61.5/70.5 | 6.1/7.8 | 15.9/19.2 | 12/13.8 | 2.5/4.1 | 16.7/16.8 | 57.5 | 46.98 |
| 1× | 240 | 105.9/165.1 | 3.1/4.1 | 12.5/20.6 | 9/15.8 | 2.2/10.4 | 16.7/16.8 | 58.8 | 10.86 |
| 4× | 120 | 349.4/359.3 | 20.9/32.1 | 54/76.2 | 39.1/56.2 | 10.7/31.8 | 66.6/116.7 | 14.7 | 60.61 |
| 4× | 240 | 590.9/687.1 | 12/32.2 | 66.9/76 | 48.5/56.6 | 11.1/36.2 | 66.7/183.3 | 11.9 | 20.74 |

| CPU | Ay | Host longtask n | Host med/p95/max ms | Guest longtask n | Guest med/p95/max ms | Guest mirror/build n |
|---|---|---|---|---|---|---|
| 1× | 120 | 3 | 88/92/92 | 0 | — | 41 |
| 1× | 240 | 3 | 130/193/193 | 0 | — | 13 |
| 4× | 120 | 751 | 73/97/527 | 887 | 59/85/121 | 44 |
| 4× | 240 | 210 | 74/113/797 | 269 | 69/102/118 | 23 |

| CPU | Ay | Peer | RX n / msg/s | RX median/p95 byte | RX toplam byte | TX n / msg/s | TX median/p95 byte | TX toplam byte |
|---|---|---|---|---|---|---|---|---|
| 1× | 120 | host | 15 / 0.32 | 46/46 | 690 | 117 / 2.49 | 110/10432 | 84502 |
| 1× | 120 | guest | 117 / 2.49 | 96/10418 | 82864 | 15 / 0.32 | 31/31 | 465 |
| 1× | 240 | host | 4 / 0.37 | 47/47 | 188 | 58 / 5.33 | 110/12653 | 74446 |
| 1× | 240 | guest | 58 / 5.33 | 96/12639 | 73634 | 4 / 0.37 | 32/32 | 128 |
| 4× | 120 | host | 20 / 0.33 | 46/46 | 920 | 137 / 2.26 | 110/400 | 87494 |
| 4× | 120 | guest | 137 / 2.26 | 96/386 | 85576 | 20 / 0.33 | 31/31 | 620 |
| 4× | 240 | host | 7 / 0.34 | 47/47 | 329 | 97 / 4.67 | 110/12842 | 122691 |
| 4× | 240 | guest | 97 / 4.67 | 96/12828 | 121333 | 7 / 0.34 | 32/32 | 224 |

WebSocket ölçüsü uygulama payload byte'ıdır; TLS/header overhead yok. Pencereler farklı duvar saati sürelerinde olduğu için toplam mesaj/longtask sayıları aynı süre ölçümü gibi kıyaslanmamalı. Gelen mesajlar kontrol/ping ve mirror/delta karışımıdır; yalnız dünya farkı trafiği değildir. Örnek sayıları ve max değerleri perf-rows.json içinde.
