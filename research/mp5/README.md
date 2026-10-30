# MP.5 — güvenli internet bağlantısı, relay dağıtımı, Android uyumluluğu (geliştirme sürümü)

**Canlı sunucu yok; dağıtım yapılmadı.** 19 runtime dosyası, Save8, build `96h10` ve `releases/stars-faz96h10.zip` değişmedi.

Belgeler:

- Mimari: `../../MULTIPLAYER-MP5-MIMARI.md`
- Güvenlik: `../../MULTIPLAYER-MP5-SECURITY.md`
- Dağıtım: `../../MULTIPLAYER-MP5-DEPLOYMENT.md`
- Sonuçlar: `../../MULTIPLAYER-MP5-SONUC.md`

Kod değişiklikleri MP.1 relay ve istemci dosyalarındadır (`../mp1/server/relay.js`, `../mp0/server/dev-relay.js`, `../mp1/client/join.js`,
`../mp1/client/mp1-host.js`, `../mp1/deploy/relay.env.example`); bu klasörde yalnız kanıtlar var.

## Testler

```sh
node tests/mp5_relay_security_test.js     # relay güvenlik/dayanıklılık (ayrı süreç dahil): çökme yolları, çerçeve/tahmin/bağlantı sınırları,
                                          # bellek, IP başlığı, ölü host/misafir soketinin yerine geçme, sızıntı
STARS_OUTPUT=/abs/out node tests/mp5_docker.cjs          # dağıtım imajı: derleme, içerik, yanlış yapılandırma, sağlık, TLS vekili+WSS,
                                                         # bellek, yeniden başlatma (Docker daemon yoksa NOT RUN)
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=/abs/out node tests/browser-mp5.cjs
#   Docker konteyneri (yoksa Node süreci) + TLS vekili + telefon başına TCP kesici + 4 ayrı Chromium süreci; kopma/ağ değişimi,
#   host kopması, relay yeniden başlatma + kayıttan devam, yetkisiz erişim, 45/60/100 sistem performansı
```

`evidence/`: `mp5-results.json`, `mp5-docker.json`, ekran görüntüleri. Hepsi aynı makinede üretildi; gerçek internet ya da fiziksel
Android değildir.
