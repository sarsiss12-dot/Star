# MP.0 — host-yetkili multiplayer prototipi (izole)

**Bu klasör oyun sürümü değildir.** 19 runtime dosyası, Save8 ve `releases/stars-faz96h10.zip` değişmedi. Prototip yalnız geliştirme relay'inin `/mp/host` yolunda gerçek oyun sayfasına enjekte edilir. Normal `/` adresinde hiçbir MP kodu yüklenmez (test edildi).

Mimari: `../../MULTIPLAYER-MP0-MIMARI.md`. Protokol: `../../MULTIPLAYER-MP0-PROTOKOL.md`. Sonuçlar: `../../MULTIPLAYER-MP0-SONUC.md`.

## Dosyalar

| Dosya | Görev |
|---|---|
| `mp-core.js` | Host çekirdeği: oturum ↔ devlet, `HANDLERS`/`COMMANDS` yönlendiricisi, atomik komut, filtreli görünüm, snapshot/delta, AI koruması, oturum metası. Tarayıcıda ve Node vm'de aynı dosya |
| `mp-host.js` | Tarayıcı host bağlayıcısı: relay WebSocket, ay sonu yayını, geliştirme paneli, test API'si (`MPHostAPI`) |
| `client/index.html`, `client/mp-client.js` | Motor yüklemeyen istemci: bağlantı, snapshot/delta uygulama, yeniden eşitleme, komut gönderimi, telefon düzeni |
| `server/dev-relay.js` | Bağımlılıksız yerel HTTP + WebSocket relay (RFC 6455 asgari çekirdek). **Yalnız geliştirme**: TLS yok, kimlik doğrulama yok, varsayılan `127.0.0.1` |
| `scripts/perf-mp0.js` | 45/60/100 sistem kapasite ölçümü (Node vm) |
| `PERF-VM.json` | Kapasite ölçüm sonucu |
| `evidence/` | `browser-mp0.cjs` çıktısı (`mp0-results.json`) ve ekran görüntüleri |

## Çalıştırma

```sh
npm install --prefix tests                       # playwright (yalnız testler)
node tests/mp0_core_test.js                      # çekirdek, gerçek motor (vm), 11 test
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=/abs/out node tests/browser-mp0.cjs   # iki ayrı Chromium süreci, 20 test
node research/mp0/scripts/perf-mp0.js /abs/perf.json
node research/mp0/server/dev-relay.js            # elle deneme: MP_PORT=8765, MP_BIND=127.0.0.1
#   host:     http://127.0.0.1:8765/mp/host?room=oda1   → konsolda MPHostAPI.start({...CFG,seed:11})
#   istemci:  http://127.0.0.1:8765/mp/client?room=oda1&name=Ayse
#   host sol alttaki geliştirme panelinden oyuncuya devlet atar
```

`MP_BIND=0.0.0.0`, relay'i aynı ağdaki cihazlara açar. Bu yalnız güvenilir geliştirme ağı içindir. Gerçek Wi-Fi/Android LAN testi yapılmadı (NOT RUN).
