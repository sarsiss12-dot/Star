# TİCARET-SON-EKSİKLER.0 — Devir

Güncelleme: 24 Kasım 2026

## Dallar
| Dal | Durum |
|---|---|
| `claude/stars-ticaret-son-eksikler0` | **p54 / MP.8.9b53 — en güncel yayın adayı** (taslak PR #79) |
| `claude/stars-ticaret-final0` | p53 / MP.8.9b52 (PR #78), geri dönüş |

- Render için `claude/stars-ticaret-son-eksikler0`.
- main ve canlı Render değiştirilmedi.
- Kontrol kökü: `git archive 1dec704` (p53).

## Kod haritası (yeni)

**commerce.js**
- Koordinatör:
  - `transitPlan`: en küçük iki yönlü izin kümesi;
  - `transitOpen` / `transitVote` / `transitCancel` / `transitCommit`;
  - `transitValid`: yeniden doğrulama;
  - `transitSweep`: 120 gün süre;
  - `transitAsk`: oyuncu talebi;
  - `aiTransitHuman`: AI talebi, `aiTransitRequest`'in sonunda.
- Yenileme ve uyarı:
  - `aiPermitRenew`: AI yenileme;
  - `permitWarn` / `permitUsers`: 60 / 30 / 0 gün uyarısı;
  - `memoReset`.
- Kayıt: `G.commerce.transit`, `nextTransit` (yalnız kullanıldığında). `restore` alanı sıkı doğrular.
- Bildirim: genel `transitNote(ids, text, cls, id)`. MP'de mp-core sarar ve uzak insana gönderir.

**diplomacy.js**
- `PORT_TRANSIT_DAYS=360`, `PORT_TRANSIT_RENEW=60`.
- `treatyAlreadyActive`: izin son 60 günde yürürlükte sayılmaz (yenilenebilir).
- `applyItems`: geçerli izin bitişten uzar.

**commerce-ui.js**
- TİCARET → **Liman izinleri** (`commerceTransit`): talepler, ONAYLA / REDDET / VAZGEÇ, izin satırları.
- Yenileme düğmeleri: YENİLEME İSTE, SÜREYİ UZAT, İZNİ GERİ AL.
- Sözleşme formunda `cargoTransitAsk`.

**MP**
- mp-core: `transitVote` / `transitCancel` / `transitAsk` komutları.
- `mirror.js`: transit kayıtları yalnız taraflara gider, AI şartları gitmez.
- `guest-stars.js`:
  - sarmalayıcılar;
  - eylem kapısı listesi (yeni eylem eklerken buraya da eklenmeli: ilk TZ FAIL'inin kök nedeni buydu);
  - `mptransit:` kartı.

## Kurallar (sonraki işler için)
- Tick içinde izin, sahiplik, savaş, ambargo, abluka ya da görünürlük değiştiren yeni kod `Commerce.memoReset()` çağırmalı.
- Transit kaydına yeni alan eklenirse `Commerce.restore` doğrulaması ve `mirror.js` beyaz listesi birlikte güncellenmeli.
- Misafirde yeni `UI.act` eylemi `guest-stars.js` VIEW listesine ya da ACT tablosuna eklenmezse sessizce engellenir.

## Testler
- `node tests/ticaret_son_eksikler0_test.js` (23)
- `node tests/ticaret_son_eksikler0_mp_test.js` (7)
- `STARS_CONTROL_ROOT=<p53 kök> node tests/ticaret_son_eksikler0_equivalence_test.js` (4)
- `node tests/browser-ticaret-son-eksikler0-sp.cjs` (8 × 3 çözünürlük)
- `MP8_SCEN=TZ node tests/browser-mp8.cjs` (8)
- Uzun oturumlar:
  - `SCALE0_MP='{"size":"ulu","ai":9}' MP8_I_FF=120 MP8_I_MIN=8 MP8_SCEN=I`
  - `MP8_I_MIN=15 MP8_SCEN=I`
- Kampanya: `CAMP_SIZE=ulu CAMP_AI=9 node research/ticaret-son-eksikler0/camp2.cjs <kök> <tohum> <ay> <çıkış>`
- Perf: `research/ticaret-teslim-degeri0/perf-abba.cjs` ve `research/ticaret-final0/yogun-konvoy.cjs` (sessiz makinede).

## NOT RUN
- Fiziksel Android, gerçek uzak internet, LAN, canlı Render.
- İki gerçek insanla saha kullanılabilirliği.

## Sonraki ilk görev
- Kullanıcı test edebiliyorsa: Render'da p54 ile üç cihazlı TZ akışı (iki misafir limanı, onay / ret, yenileme).
- Edemiyorsa: savaş desteği / FED-AI-SİYASET.0 AI fazı. Ticaret yeni bir saha bulgusu olmadan açılmamalı.
