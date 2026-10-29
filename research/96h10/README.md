# 96H.10 — kara ordusu güvenliği: kanıt paketi

Kabul edilen üretim değişikliği: `candidate-D-army-safety-ACCEPTED.patch`. Yama 96H.9 `ai.js` üzerine uygulanır. Ayrıntılı rapor: `../../AI-KARA-ORDUSU-GUVENLIGI-96H10.md`.

## Dosyalar

### Karar ve kaynak

| Dosya | İçerik |
|---|---|
| `DECISION.json` | Kabul kapıları 1–10 ve kanıtları; reddedilen D2, P ve E; Sorun B kararı |
| `SOURCE.json` | AI varyant hash'leri, girdi Save'leri, fixture üretim komutları |

### Ölçümler

| Dosya | İçerik |
|---|---|
| `ARMY-LIFECYCLE.json` | Ordu yaşam döngüsü: emirler, eskortlu ve eskortsuz varışlar, kaybın gerçekleştiği tik ve bağlamı (taarruz hedefi ya da savunma/sınır), temiz istila, yolda bayatlamış emir ayları. Kollar: 96H.9, D, D+P; seed11/23 × 5 × 240 ve 8 × 120 |
| `CAMPAIGNS.json` | Aynı dünyalarda ekonomi ve savaş ölçütleri: gemi, güç, koloni, teknoloji, kritik ay, terhis (ev/uzak), teslimat, fetih türleri |
| `CONQUESTS-240.json` | Her koloni sahiplik değişimi: tür, o tikteki nüfus ve bina kaybı, 12 ve 24 ay sonra elde tutulma |
| `SIEGE-TIMING-96H9.json` | 96H.9'daki her fetih: kuşatma başlangıcı ve süresi, saldırganın ordu sahipliği, hedefe giden ordu, ateşkes ayları, emir ve varış günü |
| `SAME-SAVE.json` | Doğal kusur anında alınan 96H.9 checkpoint'lerinden 24 aylık pencereler: 96H.9, D, D2; her biri ana + 4 plasebo |
| `BANDS.json` | D'nin (ve P'nin) gerçekten tetiklendiği her dünya. İlk karar farkından bir ay önceki checkpoint'ten, ufka kadar, her kol ana + 4 plasebo |
| `E-SEED23-SIEGE-TRACE.json` | Seed23 kanonik ay-15 Save'inde sys41 kuşatmasının aylık izi: 96H.9, E, D+E |
| `CANONICAL.json` | Kanonik `research/96h61/replay.js` özetleri: 8 × 120 ve 4 × 240 |
| `PERFORMANCE.json` | `aiArmyTick` / `aiTurn` / `monthTick` gerçek saat ölçümü |

### Reddedilen yamalar

Bu yamalar üretime uygulanmaz:

- `candidate-D2-route-safety-REJECTED.patch`
- `candidate-P-stacking-destination-REJECTED.patch`
- `candidate-E-army-budget-REJECTED.patch`

D2 ve P yamaları D'yi de içerir.

### Betikler

`scripts/` klasöründe şunlar var:

- düzenekler: `arm10.js` ve `arm10b.js` (`arm9` + ordu izleyicisi + gezegen değişimi kaydı; yalnız gözlem, RNG kullanmaz);
- `mkarm10.py`: kontrol kökü için `ai.js`'i git'ten **sabit kopya** olarak alır;
- aday betikleri;
- checkpoint ve analiz betikleri;
- `consolidate10.py`.

## Tekrar çalıştırma

```sh
REV=54058e0 python3 research/96h10/scripts/mkarm10.py /abs/arms/c9            # 96H.9 kontrol (sabit kopya)
REV=54058e0 python3 research/96h10/scripts/mkarm10.py /abs/arms/candD research/96h10/scripts/candD.py
RELOAD_AT=60 node research/96h10/scripts/arm10b.js /abs/arms/candD /abs/out/control-11-initial.save 240 /abs/out/candD-11-base-240.json
PLACEBO_DAY=810 PLACEBO_RNG=1 RELOAD_AT=60 node research/96h10/scripts/arm10b.js ...   # seed11 plasebo (810/1, 810/3, 780/1, 840/1); seed23 450/1..4
```

`scripts/` içindeki yollar özgün çalışma dizinlerini korur (`/tmp/claude-0/.../scratchpad/h10`); yeni ortamda bağlanmalıdır. Ham koşu dosyaları depoya alınmadı. Fixture'lar `tests/fixtures/96h10/` içinde.

## Yöntem notları

- **Kaotik ayrışma.** Ordu konumu RNG tüketmeden değişebilir; bu yüzden ilk RNG farkı gecikmeli bir göstergedir. Bant checkpoint'i, ordu günlüğündeki ilk karar farkından bir ay önceye alındı.
- **Fayda iddiası** yalnız adayın gerçekten tetiklendiği dünyalarda ve tek RNG çekimli plasebo bandının dışında kalan farklar için yapıldı.
- **Tetiklenmeyen dünyalar** (8 × 120'de 7/8 seed) ay ay aynı.
