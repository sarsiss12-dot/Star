# MP.6 — misafirde gerçek STARS arayüzü (ayna dünya)

**Geliştirme sürümü; yayımlanmadı.** 19 runtime dosyası, Save8, build `96h10` ve `releases/stars-faz96h10.zip` değişmedi.

Belgeler:

- Mimari ve eksikler: `../../MULTIPLAYER-MP6-MIMARI.md`
- Sonuçlar: `../../MULTIPLAYER-MP6-SONUC.md`

## Dosyalar

| Dosya | Görev |
|---|---|
| `mirror.js` | `StarsMirror.build(me)`: host'ta, misafirin görmeye yetkili olduğu dünyanın Save8 biçimli kopyası (beyaz liste, misafir = devlet 0). `diff`/`apply`: ayna farkı. Saf: G'ye yazmaz, RNG çekmez |
| `client/guest-stars.js` | Misafir katmanı (`/mp/play`): aynayı motorun `deserialize`'ıyla kurar, simülasyon yürütmez. `UI.act` kapısı, motor eylemleri → MP komutları, host'la aynı çok oyunculu çubuk ve MP diplomasi paneli |
| `client/mp6.css` | Yalnız lobi katmanı ve çubuk ayrıntıları |
| `evidence/` | `browser-mp6.cjs` çıktısı ve ekran görüntüleri (host / misafir / tek oyunculu referans) |

Değişen ortak dosyalar: `../mp0/mp-core.js` (`ui` mesajı, ayna yayını), `../mp1/server/relay.js` (`/mp/play`), `../mp1/client/join.js`,
`../mp1/client/mp1-host.js` (davet → `/mp/play`, çubuk konumu/katmanı), `../mp1/client/mp1.css`, Dockerfile, `.dockerignore`.

## Testler

```sh
node tests/mp6_mirror_test.js     # ayna: saflık, motor deserialize, görünürlük eşitliği, yeniden numaralandırma, gizlilik, fark, çekirdek, /mp/play + CSP, 45/60/100
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=/abs/out node tests/browser-mp6.cjs
#   host + 2 misafir + tek oyunculu referans (4 ayrı Chromium): aynı iskelet, piksel karşılaştırması, yatay/dikey, harita dokunuşu,
#   bilim/bina/rota komutları gerçek arayüzden, engellenen eylemler, gizlilik, MP diplomasi, kopma, performans
```
