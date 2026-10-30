# research/mp61 — MP.6.1 ortak hız bildirimi ve pencere üstü durum hapı

Ayrıntı: `MULTIPLAYER-MP61-SONUC.md`.

| Dosya | İçerik |
|---|---|
| `client/mp61.js` | Host ve misafir sayfasında aynı modül. Hız bildirimi (hız çubuğunun hemen üstündeki şerit, ~3 s solma, dokunmayı engellemez) ve STARS penceresi açıkken bağlantı + ortak hız durum hapı. |
| `client/mp61.css` | Bildirim ve hap stilleri. |
| `evidence/` | `browser-mp61.cjs` çıktısı: ekran görüntüleri ve `mp61-results.json`. |

Host komutları (`speed`, `ship`, `demolish`, `stop`, `stance`, `merge`, `split`, `splitType`, `explore`, `exploreAll`, `colonize`) `research/mp0/mp-core.js`'de.

Misafir tarafı: gerçek STARS düğmelerinin MP komutlarına bağlanması `research/mp6/client/guest-stars.js`'de.

Ayna verileri: vasallık, federasyon, ekonomi geçmişi `research/mp6/mirror.js`'de.
