# MP.1 — telefon öncelikli oda kur / katıl ve galaktik lobi (geliştirme prototipi)

**Bu klasör oyun sürümü değildir ve hiçbir sunucuya dağıtılmadı.**

- 19 runtime dosyası, Save8, build `96h10` ve `releases/stars-faz96h10.zip` değişmedi.
- ÇOK OYUNCULU düğmesi yalnız bu relay'in sunduğu sayfaya enjekte edilir.

Belgeler:

- Mimari: `../../MULTIPLAYER-MP1-MIMARI.md`
- Mobil akış ve lobi: `../../MULTIPLAYER-MP1-MOBIL-LOBI.md`
- Sonuçlar: `../../MULTIPLAYER-MP1-SONUC.md`
- MP.0 temeli: `../mp0/`

## Dosyalar

| Dosya | Görev |
|---|---|
| `server/relay.js` | Oda relay'i (bağımlılıksız Node). Güvenli oda kodu, host anahtarı (ilk çerçevede), kapasite, TTL, host bekleme süresi, boyut/hız/IP sınırları, Origin denetimi, canlılık yoklaması, izinli statik dosyalar, isteğe bağlı TLS. Sır günlüğe yazmaz. RFC 6455 çekirdeği MP.0 `dev-relay.js`'den |
| `client/mp1-host.js` | Gerçek oyun sayfasına eklenen host katmanı: ÇOK OYUNCULU menüsü, oda oluşturma, galaksi ayarları, lobi, başlatma, ay sonu yayını, uzak insan keşif belleği, oyun içi panel, yeniden bağlanma |
| `client/join.html`, `client/join.js` | Motor yüklemeyen misafir sayfası: kod/ad, lobi, devlet seçimi, hazır, kurulum sekmeleri, oyun ekranı ve inşa komutu, geri tuşu, klavye, kendiliğinden yeniden bağlanma |
| `client/view.js` | Ortak görünüm: HTML kaçışı, oyuncu listesi, Türkçe hata metinleri, snapshot/delta deposu |
| `client/mp1.css` | Telefon düzeni (≥44 px hedefler, taşma yok, animasyon yok) |
| `evidence/` | `browser-mp1.cjs` çıktısı (`mp1-results.json`) ve ekran görüntüleri |

Lobi kipi, MP.0 çekirdeğinde (`../mp0/mp-core.js`) opt-in olarak duruyor:

- `createHost({lobby:{generate}})`;
- `isHumanActor`, `actorVision`, `observeHumans`;
- `configure`, `setCapacity`, `claimFor`, `start`, `kick`, `close`;
- ağ mesajları `presence`, `claim`, `ready`, `leave`.

`opts.lobby` verilmezse MP.0 davranışı aynen sürer (MP.0 testleri 11/11 ve 20/20).

## Testler

```sh
node tests/mp1_lobby_core_test.js       # gerçek motor (vm): insan/AI ayrımı, görüş, durum makinesi, koltuklar, gizlilik
node tests/mp1_relay_test.js            # gerçek TCP/TLS soketleri: kod, anahtar, sınırlar, Origin, TTL, vekil, TLS, günlük
npm install --prefix tests
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=/abs/out node tests/browser-mp1.cjs
#   5 ayrı Chromium süreci (host + 3 misafir + fazladan telefon), 5 görünüm, 60/150 ms gecikmeli relay süreçleri
```

## Yerel deneme (geliştirici için; oyuncular bunu yapmaz)

```sh
node research/mp1/server/relay.js       # MP1_PORT=8780 MP1_BIND=127.0.0.1
#   host:    http://127.0.0.1:8780/  → ÇOK OYUNCULU → ODA OLUŞTUR
#   misafir: http://127.0.0.1:8780/mp/join?code=XXXXXXXX
```

İnternete açmak için `MULTIPLAYER-MP1-MIMARI.md` §10'daki koşullar gerekir:

- TLS;
- `MP1_ORIGINS`;
- vekil arkasında `MP1_TRUST_PROXY=1`.

TLS'siz internete açılmamalı. Gerçek telefon ve gerçek ağ testi yapılmadı (NOT RUN).
