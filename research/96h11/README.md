# 96H.11 — AI gezegen uzmanlaşması ve inşa verimliliği: araştırma paketi

**Sonuç: oyun sürümü yok.** Üretim 96H.10 olarak kalıyor (`releases/stars-faz96h10.zip`). Hiçbir aday kabul kapılarının hepsini geçmedi. Ayrıntılı rapor: `../../AI-GEZEGEN-VERIMLILIGI-96H11.md`.

## Dosyalar

### Karar ve kaynak

| Dosya | İçerik |
|---|---|
| `DECISION.json` | Ölçülen kusurlar, adaylar ve kapı sonuçları |
| `SOURCE.json` | Kontrol ve aday `ai.js` hash'leri, girdi Save'leri ve checkpoint'ler |

### Ölçümler

| Dosya | İçerik |
|---|---|
| `MEASUREMENTS.json` | 96H.10 kontrolü, 8 seed × 120 ay. Doğrudan inşa ile otomasyon emirleri, `directiveStatus` nedenleri, tamamlanma, kuyruk bekleme, yıkım döngüleri, odak dağılımı ve salınımı, araştırma tahsisi üst sınırı, ikincil anavatan kolonilerinin Yönetim maliyeti |
| `BUILDING-VALUE.json` | Var olan her binanın gerçek marjinal aylık net çıktısı (`aiBuildingDelta`, salt okunur), bedeli ve kendi mineraliyle geri ödeme süresi. Kanonik 96H.10, ay 60 ve 120 |
| `GROSS-120.json` | Her aday için tek 8 × 120 koşusu. Kaotik; tek başına kanıt değil |
| `BANDS.json` | Kontrol–aday plasebo bantları: B1, BM ve BM4 120 ay; BM ve BM4 için 240 ay (seed 42 ve 11) |
| `WINDOWS-6-12-24.json` | Tetiklenen devletlerin ayrışmadan sonraki 6, 12 ve 24 aylık gelir ortalamaları |
| `SEED42-CRISIS.json` | seed42 devlet4'ün kritik ayları, kaynak bazında |
| `CANONICAL.json` | Kanonik `research/96h61/replay.js` özetleri: 96H.10 ile B1 (8 × 120), BM (8 × 120 ve 4 × 240) |

### Reddedilen yamalar

Bu yamalar üretime uygulanmaz. Hepsi 96H.10 `ai.js` üzerine uygulanır.

- `candidate-R-replacement-gain-REJECTED.patch`
- `candidate-B1-capital-focus-REJECTED.patch`
- `candidate-M-mineral-deficit-focus-REJECTED.patch`
- `candidate-BM-capital-focus-mineral-REJECTED.patch`
- `candidate-BM2-industrial-deficit-REJECTED.patch`
- `candidate-BM4-urgent-industry-REJECTED.patch`

### Betikler

`scripts/` klasöründe şunlar var:

- **Düzenekler** (yalnız gözlem, RNG kullanmaz):
  - `arm11.js`: kuyruk, odak, yıkım, tamamlanma ve `directiveStatus` nedenleri;
  - `arm11c.js`: buna ek olarak yıkım seçimi ve yıkımdan sonraki ekonomik sıra;
  - `foc11.js`: her koloninin beş odaktaki gölge çıktısı.
- **Kollar:** `mkarm11.py` kontrol kökü için `ai.js`'i git'ten **sabit kopya** olarak alır.
- **Aday betikleri:** `candR.py`, `candB.py`, `candM.py`, `candM2.py`, `candM4.py`.
- **Checkpoint ve analiz:**
  - `ckpt10.js` checkpoint;
  - `an11.js`, `fan11.js`, `knap11.js`, `churn11.js`, `rebuild11.js`, `cls11*.js`, `eco11.js`, `band11*.py`, `win11.py`, `deliv11.js`, `payback11.js` analiz;
  - `consolidate11.py` birleştirme.

## Tekrar çalıştırma

```sh
REV=667cf56 python3 research/96h11/scripts/mkarm11.py /abs/arms/c10                     # 96H.10 kontrol (sabit kopya)
REV=667cf56 python3 research/96h11/scripts/mkarm11.py /abs/arms/candBM4 research/96h11/scripts/candB.py research/96h11/scripts/candM4.py
RELOAD_AT=60 node research/96h11/scripts/arm11.js /abs/arms/c10 /abs/control-11-initial.save 120 /abs/out/c10-11-120.json
RELOAD_AT=60 node research/96h11/scripts/ckpt10.js /abs/arms/c10 /abs/control-11-initial.save 2 /abs/ck/c10-11-m2.save
PLACEBO_DAY=90 PLACEBO_RNG=1 RELOAD_AT=60 node research/96h11/scripts/arm11.js /abs/arms/candBM4 /abs/ck/c10-11-m2.save 118 /abs/band/11-candBM4-pl1.json
```

`scripts/` içindeki yollar özgün çalışma dizinini korur (`/tmp/claude-0/.../scratchpad/h11`); yeni ortamda bu yollar değiştirilmelidir. Ham koşu dosyaları depoya alınmadı. Girdi Save'leri 96H.8–96H.10 ile aynı kanonik ilk Save'ler (`SOURCE.json`).

## Yöntem notları

- **Gözlemci saflığı.** Gözlemli koşuların son Save SHA'sı, 96H.10 kanonik koşularıyla (5 seed karşılaştırıldı) ve birbiriyle (8/8) aynı.
- **Bant.** Her bant, ilk karar farkından bir ay önceki checkpoint'ten başlar. Her kol bir ana koşu ve 4 plasebodan oluşur: tek RNG çekimi, sonraki `monthTick`'te. Bir fark yalnız aday bandı kontrol bandıyla hiç örtüşmüyorsa işaretlenir. seed404'te (ay 13'ten başlayan bantta) pl1 ve pl2 ana koşuyla aynı kaldı; o bantta yalnız 3 bağımsız dünya var.
- **Tetiklenmeyen dünyalar** bayt-bayt aynı. B1'de seed 23, 99, 123 ve 404 aynı; M tek başına 11, 42, 404, 7 ve 2026'da aynı.
- **Checkpoint'ten yükleme** tam koşuyla bayt-bayt aynı değil, çünkü türetilmiş önbellekler yeniden hesaplanıyor. Bu yüzden bant üyelerinin hepsi, ana koşular dahil, aynı checkpoint'ten başlatıldı.
