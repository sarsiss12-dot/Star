# MP-P0 — regresyon kaydı (12 Kasım 2026)

Ortam: bulut konteyner, Node v22, 4 çekirdek, Chromium `/opt/pw-browsers/chromium` (Playwright). Taban = `b35f8cb` (ayrı çalışma ağacı), aday = bu dal.

**Canlı Render (salt okunur):** `/mp/version` → `MP.8.9b18` / `96h10p23`; sekiz dosya özeti taban `b35f8cb` ile aynı (PASS). Oda açılmadı, oynanmadı.

**NOT RUN:** fiziksel PC / Android, LAN, gerçek internet, canlı Render'da oynanış; `mp5_docker` / `browser-mp5` (Docker), `browser-mp0…mp3x`, `mp62–mp64`, `mp71`, `browser-96h10`, `MP8_SCEN=A/B/C` uzun kampanyaları, PERF ölçümleri (runtime değişmedi).

## Hedefli (FAIL-önce)

| Test | Taban `b35f8cb` | Aday |
|---|---|---|
| `node tests/mp_p0_sync_test.js` | **1 / 5** (A1, A2, B, C, D FAIL; D2 PASS) | **6 / 0** |
| `MP8_SCEN=P` P2 bozuk yerel kart | FAIL — 20 sn'de 0 gün; ayna r2 → r31 gelirken uygulanan r2 | PASS — 1,0 sn'de toparlandı (`crash 1`) |
| P3 kapanmayan dokunma | FAIL — süresiz bekletme | PASS — 3,6 sn (`touchForced 1`) |
| P4 host ayna arızası | FAIL — misafir sessiz | PASS — misafirde "Host dünya verisi gönderemiyor (yayın hatası)", host tanısında aşama `mirror`; arıza kalkınca fark 1,3 gün |
| P5 duraklatılmış oyunda kaybolan ayna | FAIL — sıra hiç görünmedi | PASS — bildirim ACK'ten sonra; `resync:missing` ile sıra göründü |
| P6 Takviye düğmesi | FAIL — `r.orders is not iterable` | PASS |
| P7 kayıt → çıkış → devam | FAIL — `.sav` "Kayıt eksik ya da bozuk" | PASS — gün 5704,33 ve RNG aynı; misafir kendi devletinde; emir uygulandı |

Kanıt: `chromium-P-duzeltme-oncesi-b35f8cb.log`, `chromium-P-son-kosu-10dk-host+misafir.log`, `chromium-P-son-kosu-sonuclar.json`, ekran görüntüleri.

## Gerçek zamanlı 500 sistem (aday; son koşu)

s500, sarmal, tohum 404, 16 AI + 2 insan; host ve misafir gerçek dokunmayla (tohumlu rastgele) oynuyor; host en yüksek hızda.

- Ön ilerletme 45 ay (75 sn) + **10 dk gerçek zaman**: gün 1356 → 5671 (≈ 144 ay; oyun yılı 2225).
- 935 dokunma; en büyük host–misafir farkı 20,5 gün; **kalıcı donma 0**; 13 emrin 13'ü host'ta `ok` ve misafir aynasında görüldü.
- Misafir: 758 fark, 687 kurulum (son 11,6 ms), kurulum reddi 0, istisna 0, zorla uygulama 0, yeniden bağlanma 0, `resync` 0.
- Host: son ay adımı 2,2 sn; 170 filo.
- Kayıt paketi 3,1 MB (Save8 2,7 MB); misafirin `.sav`'ı 257 KB.

Bu yerel Chromium ölçümüdür; gerçek cihaz ve gerçek ağ değildir.

## Node — tam `node tests/run-all.js` (4 işçi)

| Kol | Paket | GEÇEN | KALAN |
|---|---|---|---|
| Taban `b35f8cb` | 188 | 6184 | 278 |
| Aday | 189 | 6190 | 278 |

Paket paket karşılaştırma: **tek fark yeni `mp_p0_sync_test.js` (6 / 0)**. Başarısız 54 paket ve sayıları iki kolda birebir aynı (`node-run-all-taban-b35f8cb.txt`, `node-run-all-aday.txt`). Bu 278 başarısızlık tabanda da var; bu fazdan bağımsızdır, silinmedi, gizlenmedi (ör. eski faz85/86 paketlerinde `DiplomaticInbox is not defined`). Ayrı bir bakım işi olarak panoya not düşüldü.

Tam koşunun yeniden yazdığı dosyalar geri alındı (`navy-95a-after-*.json`, `war-lines-on.png`, `identity-distribution.json`); `tests/audit96g2` depo dışına taşındı.

## Chromium — MP regresyonu (sırayla, tek tek)

| Test | Aday | Taban | Not |
|---|---|---|---|
| browser-mp61 | 13 / 0 (iki koşu) | — | gemi / bina / filo düğmeleri, pencere bekletmesi |
| browser-mp6 | 10 / 1 | 10 / 1 | **aynı** vaka tabanda da FAIL ("harita ve panel etkileşimi": `View.selSys` beklemesi) |
| browser-mp4 | 12 / 1 | 12 / 1 | **aynı** vaka tabanda da FAIL ("kimlik kurtarma": `statusQuoReply` → `rejected`) |
| browser-mp8 N (ağ kopmaları) | 9 / 0 (iki koşu) | — | |
| browser-mp8 R (kayıt / relay / devam) | 5 / 0 (iki koşu) | — | |
| browser-mp7 | 9 / 0 | — | |
| browser-mp74 | 7 / 0 (iki koşu) | — | |
| browser-mp73 | 8 / 0 | — | sürüm satırı `MP.8.9b19` |
| browser-mp75 | 6 / 0 (iki koşu) | — | |
| browser-mp72 | 8 / 1, sonra 9 / 0 × 8 | 9 / 0 × 3 | **aralıklı:** ilk koşuda A6 (ortak askerî destek paneli 30 sn içinde müttefiki göstermedi); sonraki 8 koşu temiz. Bu fazla ilişkisi **dışlanamadı** (taban 3 koşuda temiz; örnek küçük). AÇIK olarak kaydedildi. |

## Sürüm bütünlüğü

`python3 tools/verify-release.py` → DOĞRULANDI: 19 dosya, build `96h10p23`. Runtime dosyaları değişmedi; yeni oyun ZIP'i üretilmedi.
