# BETA-EVENT-UX.0 — regresyon kaydı (12 Kasım 2026)

Ortam: bulut konteyner, Node v22, Chromium `/opt/pw-browsers/chromium` (Playwright). Taban = `b25ba27` (ayrı çalışma ağacı), aday = bu dal.
**NOT RUN:** gerçek Render, fiziksel PC / Android, LAN; Docker'lı mp5, mp0–mp3x, mp62–64, mp71, uzun mp8 A/B/C kampanyaları.

## Hedefli (FAIL-önce)

| Test | Taban `b25ba27` | Aday |
|---|---|---|
| `node tests/browser-event-ux0.cjs` (tek oyunculu) | **1 / 7** — S1 ×4 "kol görünür", S2 "tek kart: []", S3 "sonuç kartı: []", S4 kartta EVET yok | **8 / 0** |
| `MP8_SCEN=E node tests/browser-mp8.cjs` (host + 2 misafir) | **2 / 4** — E1 misafirde oy kartı doğmadı, E2 / E4 kart düğmesi yok, E3 sonuç kartı yok | **6 / 0** (iki ayrı koşu) |

## Önemli ölçümler

- **S1:** 1280×720 / 1920×1080 fare, 800×360 / 915×412 dokunma.
  - Kol yalnız İSTİHBARAT'ta; hit-test (kol en üstte).
  - Sürükleme harita seçimini değiştirmedi; haritaya ≥ 200 px kaldı; içerik panelden taşmadı.
  - SİSTEM ve FİLO kendi standart genişliğinde; İSTİHBARAT son genişlikte; diplomasi aç / kapa sonrası korundu.
  - Klavye ← ×2 = +48 px; Home = en geniş. Sayfa yenilenince son genişlik (±2 px); Save8'de yok.
- **S2:** bilgi kartı sonrası `inboxUid`, kaydedilen kutu ve hız (2) değişmedi. Beş yeniden çizimde tekil. Kayıt → yükle sonrası eski olay kart olmadı; yeni olay yeni kart. Dokununca haber ayrıntısı açıldı. Üye olmayana oylama sonucu kartı çıkmadı.
- **S4 (800×360):** Konsey kartı EVET düğmesi ≥ 44 px; EVET tam bir kez; kart düştü; eski kartla ikinci eylem ikinci oy yazmadı.
- **E1–E5:**
  - Misafir B'de tek federasyon oy kartı; üye olmayan C'de ve host'ta yok; üç yeni ayna sonrasında tekil.
  - Karttan EVET: host'ta tek oy, tek komut; "Karar gönderildi — yanıt bekleniyor" bildirimi.
  - Sonuç kartı yalnız B'de. Host hızı ve `want` 1 → 1 değişmedi. Üç yayın ve B'nin hattı 2,5 sn kesilip yeniden bağlanması sonrasında tekil. Dokununca federasyon paneli açıldı.
  - Konsey: C karttan HAYIR, B karttan EVET, host karttan EVET; her insan tam bir oy. Kamu "Konsey kararı" kartı B ve C'de.
  - P0: eşitleme notu yok, kurulum istisnası 0; misafir gemi emri `ok` ve aynada görüldü; sayfa hatası 0.

## P0 ve 500 yıldız (aday)

`MP8_SCEN=P MP8_P_HOSTMONKEY=1 MP8_P_FF=45 MP8_P_MIN=10 MP8_P_SEED=7` → **8 / 0** (P1 gerçek zamanlı + P2–P7 hedefli).

- s500, tohum 404, 16 AI + 2 insan; host ve misafir gerçek dokunmayla oynuyor; 45 ay + 10 dk (gün 1355 → 5165).
- 772 dokunma; en büyük host–misafir farkı 24,6 gün; kalıcı donma 0.
- 13 / 13 gemi emri host'ta `ok` ve misafir aynasında görüldü.
- Misafir: 682 fark, 628 kurulum (son 21,5 ms), kurulum reddi 0, istisna 0, yeniden bağlanma 0, resync 0.
- Host: son ay adımı 2,75 sn.

Bu yerel Chromium ölçümüdür; FPS ayrıca ölçülmedi. Bilgi kartı taraması haber listesi uzunluğuyla sınırlı.

## Node — tam `node tests/run-all.js` (4 işçi)

| Kol | Paket | GEÇEN | KALAN |
|---|---|---|---|
| Önceki faz (P0, `b25ba27` ile eşdeğer) | 189 | 6190 | 278 |
| Aday (son) | 189 | 6190 | 278 |

- Paket paket fark: **yok** (`node-run-all.txt`). Koruma testleri yeni adaptörle geçti.
- İlk aday koşusu 6146 / 293 idi: Node DOM taklidinde `style.removeProperty` yok → `UI.tab` istisnası, 8 paket. Koruma (DOM'suz ortamda dokunma) eklendi; 8 paketin her biri tabanla aynı sayıya döndü, tam koşu temiz. İlk FAIL kayıt için korunuyor.
- Tam koşunun yeniden yazdığı audit / navy dosyaları geri alındı; `tests/audit96g2` depo dışına taşındı.

## Chromium — regresyon (aday, sırayla)

| Test | Sonuç |
|---|---|
| browser-mp61 | 13 / 0 |
| browser-mp73 | 8 / 0 (sürüm satırı `MP.8.9b20`) |
| browser-mp74 | 7 / 0 |
| browser-mp75 | 6 / 0 |
| browser-mp8 N (ağ kopmaları) | 9 / 0 |
| browser-mp8 R (kayıt / relay / devam) | 5 / 0 |
| browser-mp72 | 9 / 0 |
| browser-96h10 (tek oyunculu) | 27 PASS / 0 FAIL (çıkış 0) |

## Yayın bütünlüğü

- `releases/stars-faz96h10p24.zip` — **SHA-256 `f3e3adaf6605d72d23410191ffaef2b024aeb16a2386c5fa94acad135f9c975a`**, **CRC32 `327E8483`**, 20 girdi.
- `tools/package-release.py` deterministik (yeniden üretim aynı SHA).
- Çıkarılan ZIP `verify-release.py --root` → DOĞRULANDI: 19 dosya, build `96h10p24`.
- Üst ZIP (p23) `af6eb03a…bd7d1d` manifestte `parent_zip_sha256`.
