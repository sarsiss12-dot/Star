# MP.8 — regresyon ve kanıt kaydı

**Ortam:** bulut konteyner, Node v22, 4 çekirdek, Chromium `/opt/pw-browsers/chromium` (Playwright), Docker 29.9.2.

**Koşulmayanlar (NOT RUN):** fiziksel Android, gerçek internet, LAN, canlı Render.

**Runtime:**
- 19 dosya PERF.2 (`cadf66f`) ile bayt-bayt aynı; build `96h10p5`.
- `releases/stars-faz96h10p5.zip` değişmedi; yeni ZIP üretilmedi.

## Node

| Koşu | Sonuç |
|---|---|
| Tam `node tests/run-all.js` (4 işçi, son aday) | 172 paket, **6364 GEÇEN / 3 KALAN** |
| — 3 KALAN | Bilinen `faz95d_identity` (Node v22 kayan nokta) |
| `perf1_equivalence_test` | geçti (paket içinde) |
| `perf2_equivalence_test` | geçti (paket içinde) |

- Tam koşunun yeniden yazdığı navy / audit dosyaları geri alındı.
- `tests/audit96g2` depo dışına taşındı.

## Chromium (son aday)

| Test | Sonuç | Not |
|---|---|---|
| **browser-mp8 A** (orta, 2 + 5, s11, 120 ay) | **2 / 0** | 21 senkron denetimi birebir, 142 komut |
| **browser-mp8 B** (büyük, 2 + 8, s404, 240 ay + 4× CPU) | **3 / 0** | 22 denetim, 118 komut |
| **browser-mp8 C** (büyük, 3 + 6, s23, 120 ay) | **2 / 0** | 42 denetim, 252 komut |
| **browser-mp8 R** (kayıt → tüm süreçler + relay kapanır → yeni oda → devam) | **5 / 0** | |
| **browser-mp8 N** (ağ olayları) | **9 / 0** | Düzeltmeden önce N8 FAIL (yeniden üretim kanıtı `run1/mp8-N-hata-yeniden-uretim.json`) |
| browser-mp75 | 6 / 0 | |
| browser-mp74 | ilk koşu 3 / 4; temiz yeniden koşular 7/0, 6/1, 7/0, 7/0, 7/0 | Aşağıda |
| browser-mp73 | ilk koşu 7 / 1 → **8 / 0** | Sürüm beklentisi `MP\.7\.[345]` → `MP.8` de kabul |
| browser-mp72 | 9 / 0 | |
| browser-mp71 | 12 / 0 | |
| browser-mp7 | 9 / 0 | |
| browser-mp64 | 10 / 0 | |
| browser-mp63 | 15 / 0 | |
| browser-mp62 | 10 / 0 | |
| browser-mp61 | 13 / 0 | |
| browser-mp6 | 11 / 0 | |
| browser-mp4 | 13 / 0 | |
| browser-mp31 | 11 / 0 | |
| browser-mp3 | 12 / 0 | |
| browser-mp2 | 14 / 0 | |
| browser-mp11 | 10 / 0 | |
| browser-mp1 | 22 / 0 | |
| browser-mp0 | 20 / 0 | |
| browser-96h10 (tek oyunculu) | 27 / 0 | |
| mp5_docker | 6 / 0 | İmaj güncel ağaçtan derlendi |
| browser-mp5 | 10 / 0 | Docker relay + TLS vekili + TCP kesici |

### browser-mp74 notu (aralıklı A5)

**İlk koşu.** Regresyon dizisinde 3 / 4 (A4, A5, B1 ve sayfa hatası `MP1Join is not defined`).

**Ek tanı koşuları.** Paket arka planda sürerken eklendi; yük ortalaması 11.
- Değişikliğim olmayan MP.7.5 taban ağacı da aynı biçimde düştü (0 / 7). Yük altında bu test kararsız.

**Makine boşken:**

| Ağaç | Sonuç |
|---|---|
| Güncel ağaç (5 koşu) | 7 / 0, 6 / 1 (yalnız A5), 7 / 0, 7 / 0, 7 / 0 |
| Taban MP.7.5 (2 koşu) | 7 / 0, 7 / 0 |

**A5 hakkında:**
- A5 yalnız host tarafıdır: host kartından KABUL. 6 / 1 koşusunda kart düğmesi 30 s içinde DOM'da görünmedi.
- MP.8 host'un gelen kutusu / kart koduna dokunmuyor. Host'taki tek değişiklik `monthTick` ölçüm sarmalayıcısı ve tanı satırı metni.
- Örneklem küçük. Kök neden **kurulamadı**; açık konu olarak raporlanır.

### Docker imajı içeriği

`stars-relay:mp5-test` imajındaki `/app` önekleri çalışma ağacıyla aynı. Build `96h10p5`.

| Dosya | Önek |
|---|---|
| `guest-stars.js` | `cf5e3de31560` |
| `join.js` | `86d23747391f` |
| `view.js` | `4483bf958d62` |
| `mp1-host.js` | `c8e2251d1811` |
| `relay.js` | `bde0e1446448` |
| `ai.js` | `49bb05c0621b` |

## Kanıt dosyaları

- `final/mp8-{A,B,C,R,N}.json`: son aday koşuları. Senkron satırları, komutlar, performans satırları, ağ ölçümleri.
- `run1/`: ilk koşular, hata yeniden üretimi ve düzeltme sonrası N.
- `regresyon-ozet.txt`: regresyon dizisinin ham özeti.
