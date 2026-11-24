# SAVAŞ-DESTEK-AI.0 — Devir

Güncelleme: 24 Kasım 2026

## Dallar

| Dal | Durum |
|---|---|
| `claude/stars-savas-destek-ai0` | **p55 / MP.8.9b54 — en güncel yayın adayı** (taslak PR #80) |
| `claude/stars-ticaret-son-eksikler0` | p54 / MP.8.9b53 (PR #79), geri dönüş |

- Render için `claude/stars-savas-destek-ai0`.
- main ve canlı Render değiştirilmedi.
- Kontrol kökü: `git archive 5aefe56` (p54).

## Kod haritası (yeni / değişen)

**ai.js**
- `aiWarJoinGate(ai, enemy, sender, give)`: her `warJoin` yanıtında `aiRespond` içinden çağrılır. Sırasıyla bakar:
  1. güç / erişim;
  2. ekonomik kriz;
  3. ≥2 savaş ya da yorgunluk >45;
  4. süren savaşın bağladığı güç;
  5. `aiWarBudget`;
  6. başkent tehdidi.
- `aiWarHelpAsk(e)` (`aiTurn` içinde, `aiStrategicDiplomacy`'den sonra):
  - kendi koalisyon dışı kök cephesinde zorlanan AI tek adaya `warJoin` ister (müttefik > federasyon > dost);
  - ödeme gerçek stoktan;
  - beklemeler `e.aiTalk` içinde: `warHelp` 30 gün; `warHelp:<cephe>:<aday>` 180 gün, ret sonrası 360 gün;
  - tanı `aiPlanEvent('war-help-ask', …)`.

**diplomacy.js**
- `itemValue` `warJoin`:
  - doktrin `personaKey(e)`'den okunur (`e.mizac` AI'da yok);
  - savunma (cephedeki destek isteyen rol 1) ayrı fiyatlanır;
  - sadakat: müttefik ×0,75 / federasyon ×0,8, `− 0,1 × aiHonesty`.
- `warSupportGate`: `diploBlocked` (Arındırıcı) denetimi.

**archive-ui.js** (`WarCenterUI`)
- `box()`: yeniden çizim `.mbox` çerçevesinin içine.
- `support()`:
  - öncelik ve etiketler (`info`);
  - `ready` listesi;
  - `joinedHere` (kabul eden aday "Cepheye katıldı" olarak kalır).
- `askAll(front, enemy)`; eylem `warCenterAskAll`.

**MP**
- `guest-stars.js`: `VIEW` listesinde `warCenterAskAll`; yüzey taşıma `#modal>.mbox`.
- `mp-core`: değişmedi; yalnız p55 sürüm kabulü (p41–p54).

## Kurallar (sonraki işler için)

- AI katılım kararına yeni kural eklenecekse `aiWarJoinGate`'e eklenir. Bu kapı `aiRespond`'un tek katılım kapısıdır; insan → AI ve AI → AI aynı yoldan geçer.
- Yeni AI istek türü, mevcut `aiTalk` beklemeleriyle sınırlanmalı. Yeni Save8 alanı gerekmez.
- `WarCenterUI` içinde `UI.surfaceRender($('modal'), …)` yazmayın: `WarCenterUI.box()` kullanın, yoksa `.mbox` çerçevesi düşer.
- Misafirde yeni `UI.act` eylemi `guest-stars.js` `VIEW` listesine ya da ACT tablosuna eklenmezse sessizce engellenir.
- Savaş testlerinde AI katılımı bekleyen fikstür, AI'yı ekonomik krizde bırakmamalı. p55 kriz içindeki AI'nın ücretli katılımını reddeder; Q fikstürü buna göre düzeltildi.

## Testler

| Komut | Sonuç |
|---|---|
| `node tests/savas_destek_ai0_test.js` | 21/0 (p54 5/16) |
| `node tests/savas_destek_ai0_mp_test.js` | 5/0 |
| `STARS_CONTROL_ROOT=<p54 kök> node tests/savas_destek_ai0_equivalence_test.js` | 4/0 |
| `node tests/browser-savas-destek-ai0-sp.cjs` | 9/0, 3 çözünürlük |
| `MP8_SCEN=SD node tests/browser-mp8.cjs` | 3/0 |

Kampanya:
```sh
CAMP_SIZE=ulu CAMP_AI=9 [CAMP_TENSION=calkantili] [PLACEBO_DAY=<gün>] node research/savas-destek-ai0/camp.cjs <kök> <tohum> <ay> <çıkış>
node research/savas-destek-ai0/ozet.cjs <dizin> p54 <aday>
```

Tanı:
- `node research/savas-destek-ai0/diag.cjs <kök> <tohum> <ay>`: destek neden tetiklenmiyor.
- `probe.cjs`: `aiRespond` maliyetleri.
- `katki.cjs`: katılan AI'nın gerçek filo katkısı.
- `war-dense-save.cjs`: perf için savaş yoğun kayıt.

## NOT RUN

- Fiziksel Android, gerçek uzak internet, LAN, canlı Render.
- İki gerçek insanla saha kullanılabilirliği.

## Sonraki ilk görev

- Kullanıcı test edebiliyorsa: Render'da p55 ile Savaş Merkezi → ASKERÎ DESTEK İSTE → toplu destek (misafir + AI adaylar) ve AI'dan gelen yardım isteği kartı.
- Edemiyorsa: FED-AI-SİYASET.0. Ölçülen girdiler:
  - vasal / federasyon otomatik katılımlarının pasif kalması;
  - doğal oyunda AI temasının çok seyrek olması (destek durumları nadiren oluşuyor).
