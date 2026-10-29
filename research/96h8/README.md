# 96H.8 — askerî sefer verimliliği: kanıt paketi

Kabul edilen üretim değişikliği: `candidate-2b-ACCEPTED.patch` (96H.7.1 `ai.js` üzerine). Ayrıntılı rapor: `../../AI-SEFER-VERIMLILIGI-96H8.md`.

| Dosya | İçerik |
|---|---|
| `SAME-SAVE.json` | Aynı Save8 + RNG, 24 ay: kontrol, 96H.7 ret yaması, aday 1, 96H.8 ve 4 plasebo; doğrudan etkilenen devlet ve galaksi toplamları |
| `CAMPAIGN-120.json` | 8 seed × 120 ay, kanonik `research/96h61/replay.js` özetleri (kontrol / 2a / 2b), ret yaması özetleri, ay-ay Save/RNG eşitliği |
| `CAMPAIGN-240.json` | 4 seed × 240 ay; seed11/23 için kontrol ve 96H.8 başına 5 örnekli gürültü dağılımı |
| `TRIGGERS-AND-DISBANDS-120.json` | Adayın gerçekten tetiklendiği devlet/ay; bütün terhisler: savaş, uzak/ev bakımı, net, stok |
| `PERFORMANCE.json` | `aiMilitaryCampaign` / `aiTurn` gerçek saat ölçümü |
| `SOURCE.json` | AI varyant hash'leri, fixture hash'leri, kanonik yeniden üretim sonuçları |
| `candidate-1-gate-only-REJECTED.patch` | Yalnız maliyet kapısı; birleştirilmiş yığın yüzünden pasif — üretime uygulanmaz |
| `candidate-2a-detachment-SUPERSEDED.patch` | Müfreze, ama geri çağırma yok; 120 ayda açık uçlu konuşlanma terhisi — üretime uygulanmaz |
| `control-96h7-campaign-deadline-rejected-applied.patch` | 96H.7 ret yamasının 96H.7.1 üzerindeki karşılaştırma kolu — üretime uygulanmaz |
| `scripts/` | Deney düzeneği (`arm.js`), aday üreticileri, kampanya ve analiz betikleri, `consolidate.py` |

## Tekrar çalıştırma

```sh
# kanonik checkpoint (ay 60, Save8 yükleme dahil)
node research/96h61/replay.js /abs/Star control 11 84 /abs/out orta default - 60
# aynı Save'den bir kol (kök: çalışma dosyaları + ilgili ai.js)
RELOAD_AT=60 node research/96h8/scripts/arm.js /abs/kol-kok /abs/out/control-11-initial.save 120 /abs/out/f11.json
PLACEBO_DAY=1260 PLACEBO_RNG=1 node research/96h8/scripts/arm.js ...   # gürültü tabanı
```

`scripts/` içindeki yollar özgün çalışma dizinlerini korur (`/tmp/claude-0/.../scratchpad/h8`); yeni ortamda kök ve çıktı yolları bağlanmalıdır. Ham koşu dosyaları (yaklaşık 1,1 GB) depoya alınmadı; burada yalnız türetilmiş özetler var. Gerçek fixture'lar `tests/fixtures/96h8/` içinde.

Yöntem notu: aynı Save'den ayrılan kollar birkaç ay sonra kaotik biçimde ayrışır. Bu yüzden fayda iddiası (a) adayın gerçekten tetiklendiği devlet üzerinde ve (b) tek RNG çekimli plasebo bandının dışında kalan farklar için yapıldı. Adayın tetiklenmediği seed'lerde ay-ay tam Save/RNG eşitliği doğrulandı; bu seed'ler fayda kanıtı olarak sayılmadı.
