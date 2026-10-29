# 96H.9 — kara ordusu koordinasyonu: kanıt paketi

Kabul edilen üretim değişikliği: `candidate-BC-ACCEPTED.patch` (96H.8 `ai.js` üzerine). Ayrıntılı rapor: `../../AI-ISTILA-VERIMLILIGI-96H9.md`.

| Dosya | İçerik |
|---|---|
| `DECISION.json` | Kabul kapıları 1–9 ve kanıtları; reddedilen adaylar; bilinen ödünler |
| `SOURCE.json` | AI varyant hash'leri, girdi Save'leri, fixture üretim komutları (ikisi de bayt bayt yeniden üretildi) |
| `SAME-SAVE.json` | Aynı Save8 + RNG pencereleri (s11m60 36 ay, s11m40 60 ay, s23m15 40 ay): kontrol, B, C, BC; kontrol ve BC için 4'er plasebo |
| `CANONICAL.json` | Kanonik `research/96h61/replay.js` özetleri: 8 seed × 120 ay ve 4 seed × 240 ay, 96H.8 ↔ 96H.9 |
| `CAMPAIGN-120.json` | 8 × 120 ay seed başına fetih, temiz istila, kara savaşı, terhis (96H.8 düzeneğiyle ev/uzak ayrımı), ilk RNG ayrışma ayı |
| `DISTRIBUTION-240.json` | Seed11/23 × 5 dünya × 240 ay (ana + 4 tek RNG çekimli plasebo); 96H.8, B, C, BC |
| `CAPTURES-240.json` | Aynı dünyalarda her koloni fethi: ay, sistem, eski/yeni sahip, düşüş türü, başkent |
| `ARMY-FATES-240.json` / `ARMY-COST-240.json` | Ordu filolarının akıbeti (temiz istilada tükenen / kayıp); ordu gövdesi alaşım/maden maliyeti ve temiz fetih başına alaşım |
| `TRADE-240.json` | Yaşayan AI teslimatları, ticaret çiftleri, ölen devletler ve ölüm ayı |
| `DISBAND-SPLIT-240.json` | 20 dünyada her savaş terhisinde ev/uzak bakım ayrımı; seed23'teki iki konuşlanma terhisinin nedeni |
| `PERFORMANCE.json` | `aiShipProduction` / `aiMilitaryCampaign` / `aiArmyTick` / `aiTurn` / `monthTick` gerçek saat ölçümü |
| `candidate-A-siege-opportunity-REJECTED.patch` | Yalnız kuşatmada ordu niyeti + koşulsuz alaşım ayırma — üretime uygulanmaz |
| `candidate-B-army-only-REJECTED.patch` | Yalnız ordu satın alma (eskort yine çağrılıyor) — üretime uygulanmaz |
| `candidate-C-siege-hold-only-REJECTED.patch` | Yalnız kuşatmayı sürdürme (ordu yok) — üretime uygulanmaz |
| `scripts/` | Deney düzeneği (`arm9.js`, `arm9u.js`), aday üreticileri (`candA/B/C.py`, `mkarm.py`), checkpoint ve analiz betikleri, `consolidate9.py` |

## Tekrar çalıştırma

```sh
# kanonik koşu; başlangıç Save'i control-11-initial.save olarak yazılır (96H.8 ile aynı protokol)
node research/96h61/replay.js /abs/Star control 11 120 /abs/out orta default - 60
# bir kol: kök = çalışma dosyaları + ilgili ai.js (kontrol için SABİTLENMİŞ 96H.8 kopyası)
RELOAD_AT=60 node research/96h9/scripts/arm9.js /abs/kol /abs/out/control-11-initial.save 240 /abs/out/y11.json
PLACEBO_DAY=810 PLACEBO_RNG=1 RELOAD_AT=60 node research/96h9/scripts/arm9.js ...   # seed11 plasebo (810/1, 810/3, 780/1, 840/1)
PLACEBO_DAY=450 PLACEBO_RNG=2 RELOAD_AT=60 node research/96h9/scripts/arm9.js ...   # seed23 plasebo (450/1..4)
python3 research/96h9/scripts/consolidate9.py /abs/scratch
```

`scripts/` içindeki yollar özgün çalışma dizinlerini korur (`/tmp/claude-0/.../scratchpad/h9`); yeni ortamda bağlanmalıdır. Ham koşu dosyaları depoya alınmadı. Gerçek fixture'lar `tests/fixtures/96h9/` içinde.

Kontrol kökündeki `ai.js` çalışma ağacına bağ (symlink) olmamalı, sabit 96H.8 kopyası olmalı. 96H.9 aktarımından sonra bağlı kökle başlatılan dört seed23 plasebo kontrol koşusu atıldı ve sabit kökle yeniden koşuldu (`SOURCE.json`).

Yöntem notu: kollar aynı Save'den birkaç ay sonra kaotik biçimde ayrışır. Fayda yalnız adayın tetiklendiği devlet için (seed11 devlet1/3, seed23 devlet5) ve tek RNG çekimli plasebo bandının dışındaki farklar için iddia edildi. Adayın tetiklenmediği seed'lerde (42, 404, 7, 123, 2026) 120 ay boyunca ay ay Save ve RNG birebir aynı.
