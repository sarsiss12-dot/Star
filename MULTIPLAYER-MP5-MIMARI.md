# STARS — MP.5 mimarisi: internet yolu, relay dayanıklılığı, kopma/yeniden bağlanma

Durum: **dağıtıma hazır geliştirme sürümü; canlı sunucu yok.** 19 runtime dosyası, build `96h10`, PWA `stars-v96h10`, Save8,
`mp-core.js` ve kanonik ZIP değişmedi.

## 1. İnternet yolu

```
Telefon A (host, tam oyun)  ─┐                          ┌─ Telefon B (misafir, motorsuz)
                             │  HTTPS / WSS (TLS)       │
                             └──► platform TLS vekili ◄─┘   (Render / Koyeb / Caddy …; X-Forwarded-Proto/For)
                                        │ HTTP (yalnız iç ağ)
                                        ▼
                              relay konteyneri (Node 22, tek süreç, bellek içi odalar)
                              - /, /mp/join, izinli statik dosyalar, /healthz
                              - /mp1/ws: oda kodu + host anahtarı (ilk çerçeve) + rol başına sınırlar
```

- Relay ileti içeriğini yorumlamaz; oyun kararı host telefonda (`mp-core.js` `COMMANDS` + motor kuralları).
- TLS'siz istek (vekilin `X-Forwarded-Proto` değeri https değilse) GET için 308, WebSocket için 403; HSTS.
- Yapılandırma eksikse (TLS/vekil, https `MP1_ORIGINS`, `MP1_DEV`) relay başlamaz.

## 2. MP.5 değişiklikleri (küçük, hedefli)

| Dosya | Değişiklik |
|---|---|
| `research/mp1/server/relay.js` | istek/el sıkışma/ileti işleyicilerinde hata yalıtımı; rol başına çerçeve sınırı; IP başı yanlış kod/anahtar sınırı (60/10 dk); toplam bağlantı sınırı (`MP1_MAX_CONNS`); kapanmış kod belleği sınırı; `MP1_IP_HEADER`; sessiz (ölü) host bağlantısının yerine doğru anahtarlı yenisi; oda doluyken sessiz misafir soketinin çıkarılması |
| `research/mp0/server/dev-relay.js` | `attach(…, maxPayload)`; kapanan bağlantının sayacı silinir |
| `research/mp1/client/join.js` | yeniden bağlanırken ekran korunur ve deneme sürer; `online`/`offline` olayları; yeniden bağlanırken "oda dolu" kalıcı değil; "Ağ bağlantısı yok" durumu |
| `research/mp1/client/mp1-host.js` | `online` olayı → anahtarla hemen yeniden bağlan; ağ kopunca zaman da durur, dönünce hız geri gelir; host paneli metinleri |
| `research/mp1/deploy/relay.env.example` | `MP1_MAX_CONNS`, `MP1_IP_HEADER` |

Dockerfile ve `.dockerignore` değişmedi; MP.5'te ilk kez gerçekten derlenip çalıştırıldı (`tests/mp5_docker.cjs`).

## 3. Kopma ve yeniden bağlanma davranışı

| Olay | Misafir | Host | Relay |
|---|---|---|---|
| Misafirin ağı kısa süre kopar | Oyun ekranı kalır, "Bağlantı koptu — yeniden bağlanılıyor…"; geri çekilmeli deneme (≤ 8 s); dönünce aynı jetonla aynı devlet | Koltuğu bekletir (bağlantısız gösterir), devleti AI'ya vermez | Bağlantıyı bırakır |
| Misafirin ağı değişir (eski soket ölü) | `online` olayıyla eskisini bırakıp yeniden bağlanır; oda doluysa denemeye devam | Yeni bağlantı aynı jetonla gelince eskisini `replaced` ile kapatır | Oda doluyken 12 s sessiz misafir soketini çıkarır |
| Host'un ağı kopar | "Host bağlı değil — oyun duraklatıldı"; komut gönderilmez | Zaman durur; anahtarla geri çekilmeli yeniden bağlanır (≤ 10 s); dönünce hız geri gelir | Odayı 10 dk bekletir |
| Host'un ağı değişir | aynı | `online` olayıyla hemen yeni soket | Eski host bağlantısı yoklama + 5 s sessiz kalınca doğru anahtarlı yenisi geçer |
| Relay yeniden başlar | "Sunucu yeniden başlatıldı; oda kapandı." | Oyun durur, kaybolmaz; OYUNU KAYDET → KAYITLI OYUNA DEVAM ET → yeni kod; misafirler eski devletlerine döner (MP.4) | Odalar `server-restart` ile kapanır |
| Host tarayıcısı kapanır | "Host bağlı değil" → 10 dk sonra oda kapanır | Otomatik/elle kayıttan devam (MP.4) | — |

## 4. Kapsam dışı

Kalıcı galaksi sunucusu, hesap sistemi, sunucu tarafı simülasyon, LAN/WebRTC, yatay ölçekleme (birden çok relay örneği).
