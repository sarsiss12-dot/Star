# TİCARET-AĞ.2 — Sonuç raporu

Tarih: 22 Kasım 2026 · Dal: `claude/stars-ticaret-ag2` (PR #71 `b653523` üstünde) · Sabit kontrol: p49 `claude/stars-saha-guvence1` @ `e4350e5` (PR #69)
Kanıt: `reports/claude/evidence/ticaret-ag2/` · Devir: `reports/claude/TICARET-AG2-DEVIR.md`

PASS / FAIL / NOT RUN ayrı. Kullanıcı test yapamıyor: kabul otomatik (Node + yerel Chromium + yerel relay/TLS). Fiziksel Android, gerçek uzak internet, gerçek LAN, canlı Render **NOT RUN**. Otomatik kabul saha kabulü değildir.

## A. Kanonik kaynak
| Öğe | Değer |
|---|---|
| Doğrulanan başlangıç | PR #71 `b6535234e1b3a8dfbb72bac6988ba4f35ef0dd0d`, PR #70 `23cc1bb`, p49 `e4350e5` (GitHub ile aynı; ilerleme yok) |
| Bitiş | `claude/stars-ticaret-ag2` son rapor commit'i (kod / sürüm `ec32cd3`) |
| PR | #72 (taslak, taban `claude/stars-ticaret-ag1`) |
| Commit'ler | `85234dc` Faz A (TL) · `103c763` Faz B (işlem) · `c0ae0e4` Faz C (misafir-yalnız düzeltme + MP kargo kaydı + Chromium) · `ec32cd3` Faz D (p50 + ZIP) · rapor commit'i |

## B. TL multiplayer onarımı
**Gerçek kök neden (ürün hatası, TL2):** misafirin gelen kutusu kayıt penceresinde KABUL işleyicisi (`archive-ui.js` `record()` → `resolve`) `world!==G.emps || DiplomaticInbox.get(id)!==record` olduğunda **hiçbir şey yapmadan dönüyordu**. Misafirde kayıt penceresi açıldıktan hemen sonra gelen kutusu / dünya yenilenince bu koşul oluşuyor; KABUL'e dokunan oyuncunun kararı host'a **hiç gitmiyordu** (`respond` komutu yok, kayıt `pending` kalıyor). Kanıt (aynı bekletmesiz dokunuş, aynı senaryo):
- eski `archive-ui.js`: **TL2 FAIL** — B'nin `MP1Join.results` yalnız 2 komut (harita + teklif), `respond` yok; host'ta teklif `pending` (`evidence/ticaret-ag2/chromium/tl-nopre-old.log`).
- düzeltilmiş `archive-ui.js`: **TL2 PASS** (`tl-nopre.log`).
- Önceki test koşularında TL2'ye yalnız bir `page.evaluate` gecikmesi eklemek de geçirtiyordu (zamanlama yarışı) — bu, kök nedeni gizleyen bir test etkisiydi; son test bekletmesiz dokunur.

**TL3 / TL4 (türev):** TL3 "izni geri al" düğmesi yalnız izin varken çizilir — TL2'nin kaybolan kabulü yüzünden izin hiç oluşmamıştı. TL4'teki host `rules:duplicate` **doğru** davranıştır: C'nin TL2 isteği hâlâ bekliyordu; tekrar teklif engeli korunarak geçirildi (gevşetilmedi). Bağımsız bir sorun yok.

**Test tarafı düzeltmeleri (ayrı):** TL yardımcısı yeni teklifi dizi uzunluğuyla değil içerikle (gönderen, alıcı, `portTransit`, `pending`, önceki kimlikler hariç) arar (host 160 tamamlanmış teklif üstünde budar); kabul / teklif kaybında tanı basar.

**Düzeltme (en küçük):** aynı mantıksal kayıt (`key`) hâlâ `pending` ve kapısı açıksa güncel kayıtla karar verilir; değilse kayıt yeniden açılır, "Kayıt güncellendi — kararı yeniden gözden geçir" uyarısı. Tek oyunculu yol (dünya değişmez) aynen.
**Sonuç:** `MP8_SCEN=TL` **5/5 PASS** — iki ardışık tam koşu (`tl-final-1.log`, `tl-final-2.log`) + düzeltme sonrası bağımsız koşular.

## C. İşlem motoru (`dealTxBegin`)
- **Ölçülen gerçek yazma kümesi** (100 sistem kaydı, 24 ay, AI–AI düzenli sözleşme 6 kez): yalnız `G.commerce`, `G.commerce.contracts`, iki taraf devlet nesnesi. 500 sistem kayıtlarında 12 ayda düzenli sözleşme 0 (`evidence/ticaret-ag2/perf/yazma-kumesi-*.log`).
- **Mekanik kanıt** (`tests/ticaret_ag2_tx_test.js` X1): tam dünya yakalamasıyla karşılaştırılan *her* değişen nesne daraltılmış kapsamın yakalamasında olmalı. Bu denetim `pact` maddesinde kapsam dışı yazım yakaladı (`G.news` — `makePact` haberi, `G.economyHistory`); bu yüzden `pact` **tam işlemde kaldı**.
- **Değişiklik:** `dealTxScope(n)` — bütün maddeler `freight` / `portTransit`, iki taraf AI (oyuncu ve uzak insan değil), gelen kutusu kaydı yok, `G.commerce` kurulmuş ⇒ `dealTxBegin([G.commerce, a, b, G.log])`. Kök tanımlayıcılar, RNG ve yetki alanları tam işlemdeki gibi saklanır. Diğer bütün anlaşmalar ve `dealTxBegin`'in 9 diğer çağıranı değişmedi.
- **Atomiklik:** X2 — 10 hata kancası (`before/after:freight`, `before/after:portTransit`, `after:items/cost/goodwill/recalc/log`, `son`) × 3 biçim: işlem false, Save8 **bayt-bayt** ve RNG aynı. X3 — daraltılmış ↔ tam işlem (`G._dealTxFull`) aynı Save8 / RNG; ikinci yürütme ikinci sözleşme / ödeme üretmez. X4 — insan taraf, `res`, `pact`, `G.commerce` yok → tam işlem. **6/0 PASS.**
- **Kampanya eşdeğerliği:** 100 sistem kaydından 24 ay, daraltılmış ↔ tam işlem her ay Save8 SHA-256 + RNG **birebir** (6 daraltılmış anlaşma).

## D. Performans (Codex düzeneği `research/ticaret-agi0/ay-maliyeti.cjs`, Chromium, aynı Save8, kontrol p49 worktree; 3 bağımsız koşu × 24 örnek / kol)
| Kayıt | koşu 1 p95 | koşu 2 p95 | koşu 3 p95 | **birleşik (72 örnek) p50 / p95** | Karar |
|---|---|---|---|---|---|
| 100 sistem / 9 AI / 120. ay (yeni sözleşme imzalanan ay) | +%0,30 | −%0,45 | −%14,64 | 142,8 → 139,1 ms (−%2,59) / 198,9 → 199,1 ms (**+%0,10**) | PASS |
| 500 sistem / 16 AI / 120. ay (düzenli sözleşme yok) | +%4,78 | +%0,80 | −%3,18 | 770,8 → 779,6 (+%1,14) / 890,3 → 884,3 (**−%0,67**) | PASS |
| 500 sistem / 16 AI / 180. ay (düzenli sözleşme yok) | +%6,60 | +%10,69 | −%7,77 | 2412,7 → 2406,6 (−%0,25) / 2774,5 → 2721,8 (**−%1,90**) | PASS (tek koşular gürültülü; birleşikte geçer) |
Önceki: TİCARET-AĞ.1 100 sistem +%9,89 (tek koşu). 500/180 ayında daraltılmış yol hiç tetiklenmez (kod yolu TİCARET-AĞ.1 ile aynı, o koşuda −%1,85); tek koşu p95'i ±%10 oynuyor — bu yüzden 3 koşu birleştirildi, kapı gevşetilmedi. "Aktif uzun ticaret rotası bulunan ay" ayrı ölçülmedi (**NOT RUN**).

## E. Ticaret
Zincirleme liman, Transit İzni, fiziksel kargo (`cargo`), anlık kaynak takası (`res`), liman fethi kuralları TİCARET-AĞ.1'deki gibi; Node `ticaret_agi0` 28/0, `ticaret_ag1` 9/0, `faz92c` 29/0.

## F. Multiplayer
Gerçek host + iki misafir, yerel relay + TLS vekili, ayrı Chromium, gerçek STARS misafir arayüzü; son kod ile:
| Senaryo | Sonuç |
|---|---|
| **TL** transit izni: ver / ret, iste / KABUL (iki misafir aynı yön ve süre), veren masadan geri alır, karşı teklif + kayıtlı izin + süre sonu | **5/5 PASS** (ayrıca düzeltme sonrası 2 ardışık koşu 5/5) |
| **TA** fiziksel kargo (B 800×360 masada ▣ seçimi, host gelen kutusundan KABUL, dört aşama ayrı, yükleme B'den, varışta host'a bir kez, ikinci kabul ret, C anlık takas, gizlilik) | **6/6 PASS** |
| SG 5/0 · O 11/0 · J 5/0 · SE 8/0 · X 5/0 | PASS |
| SP 800×360 / 844×390 | 3/0 / 3/0 PASS |
**Kayıt / yeni oda:** yolda kargolu MP paketi yeni host çalışma zamanında birebir yüklenir, tek teslim (Node M1). Chromium'da kargolu kayıt → yeni oda **NOT RUN** (J senaryosu kargo dışı genel dönüşü sınar).
**Ara limandan geçiş, transit izni kaybında yeniden yönlendirme, ara liman fethi** Chromium MP'de **NOT RUN**; Node'da `ticaret_agi0` 28/0 (dokuz sıçrama + iki yabancı ara liman, izin süresi / iptal, fetih, barışla devir, geri alma, alternatif liman, 180 gün bekleme) ve `faz92c` 29/0.

## G. Save8 / RNG
Save8 v8, MP paketi 4, protokol 1 değişmedi. p50 paket yükleyicisi p41–p49 paketlerini kabul eder. Daraltılmış işlem eşdeğer (C). Yolda kargo içeren MP paketi yeni host'ta birebir yüklenir, tek teslim (`tests/ticaret_ag2_mp_test.js` M1); aynı kararın tekrarı (aynı / farklı cid) ikinci sözleşme üretmez (M2). Zorunlu davranış farkları: ticaret AI'sı tetiklendiğinde dünya p49'dan ayrışır (TİCARET-AĞI.0 tasarımı).

## H. Tam regresyon
Aynı ortamda, aynı gün (`STARS_TEST_WORKERS`):
| Kök | Commit | Sonuç |
|---|---|---|
| p49 kontrol (worktree) | `e4350e5` | 242 paket / 6532 / **279** |
| aday ara koşu (ilk misafir düzeltmesi) | `103c763` + p50 sürümü | 245 / 6547 / 283 — **4 yeni FAIL** (faz87d, faz91e, faz95b, faz95e_ui_save: "kayıt yüklemesinden sonra eski pencere düğmesi etkisiz") → düzeltme misafirle sınırlandı |
| **aday son** | `ec32cd3` kodu | **245 / 6551 / 279** |
Son koşuda p49'a göre paket farkları yalnız iyileşme / yeni: `faz86b` 120/22 → 121/22, `faz92c` 28/0 → 29/0, yeni `ticaret_ag1` 9/0, `ticaret_ag2_tx` 6/0, `ticaret_ag2_mp` 2/0. `mp11_online` / `mp1_relay` manifest denetimleri sürüm yükseltmesiyle PASS (9/0, 14/0). Eski 279 FAIL aynen; yeni FAIL yok. Günlükler `evidence/ticaret-ag2/node/`.

## I. Sürüm
**Evet — otomatik testlerden geçmiş yayın adayı** (saha kabulü değil). 96h10p50 / stars-v96h10p50 / MP.8.9b49.
`releases/stars-faz96h10p50.zip`: 20 girdi (19 runtime + manifest), 957 929 bayt, SHA-256 `26a6b5e3bbf577c37fd9433db747323adf005d893622486ac6514d41eb3988f8`, CRC32 `8D1FE07F`; manifest SHA-256 `54a7f8cc…8c8f`. İki paketleme bayt-bayt aynı; ZIP çıkarılıp `verify-release.py --root` ile 19 dosya doğrulandı; her girdinin CRC'si denetlendi. Kayıt `RELEASE-TICARET-AG2.json`. p50 paket yükleyicisi p41–p49 MP paketlerini kabul eder.

## J. Açık işler
1. Fiziksel Android, gerçek uzak internet, gerçek LAN, canlı Render: **NOT RUN**; kullanıcı / saha kabulü yok.
2. Chromium MP'de ara liman geçişi, izin kaybı yeniden yönlendirme, ara liman fethi, kargolu kayıt → yeni oda: **NOT RUN** (Node kapsıyor).
3. "Aktif uzun ticaret rotası bulunan ay" ayrı perf ölçümü: **NOT RUN**.
4. 500/180 tek koşu p95 gürültüsü yüksek (±%10); kapı 72 örnek birleşimiyle değerlendirildi.
5. `pact` içeren ve insan taraflı anlaşmalar tam işlem kopyasını kullanmaya devam eder (bilerek).
6. Eski 279 Node FAIL (p47'den beri). TİCARET-AI.0 ve FED-AI-SİYASET.0 **BAŞLANMADI**.

## K. Durum
| Kalem | Durum |
|---|---|
| TL2–TL4 kök neden + onarım | TAMAMLANDI VE TEST EDİLDİ (TL 5/5) |
| Daraltılmış işlem kopyası (AI–AI freight / portTransit) | TAMAMLANDI VE TEST EDİLDİ |
| Performans kapısı (100 / 500 sistem p95 ≤ %5) | TAMAMLANDI VE TEST EDİLDİ (birleşik 3 koşu) |
| Fiziksel kargo MP (TA) + kargolu MP kaydı (Node) | TAMAMLANDI VE TEST EDİLDİ |
| Chromium'da konvoy ara liman / izin kaybı / liman fethi / kargolu yeni oda | KISMEN TAMAMLANDI (Node PASS, Chromium NOT RUN) |
| Eski mekanikler (SG, O, J, SE, X, tam Node) | TAMAMLANDI VE TEST EDİLDİ |
| p50 yayın adayı | TAMAMLANDI VE TEST EDİLDİ (otomatik; saha kabulü yok) |
| Fiziksel Android / Render | NOT RUN |
| TİCARET-AI.0 / FED-AI-SİYASET.0 | BAŞLANMADI |
