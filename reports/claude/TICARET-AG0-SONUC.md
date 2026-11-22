# TİCARET-AĞ.0 — Entegrasyon raporu (yayın YOK)

Tarih: 22 Kasım 2026 · Dal: `claude/stars-ticaret-ag0` · Taban: SAHA-GÜVENCE.1 (`claude/stars-saha-guvence1`, p49 / MP.8.9b48)
Durum: **KISMEN** — Codex TİCARET-AĞI.0 (p47 tabanlı, `codex/stars-ticaret-agi0` @ `84de561`) p49'a birleştirildi; **oynanabilir sürüm değildir**, ZIP / sürüm yükseltmesi yapılmadı (performans kapısı açık). Kullanıcı test yapamadığından bütün sonuçlar otomatik; fiziksel Android / uzak internet / Render **NOT RUN**.

## A. Ne yapıldı
| Adım | Sonuç |
|---|---|
| Codex dalının p49 (SAHA-GÜVENCE.1) üstüne birleşmesi | Yapıldı. İki çatışma: `research/mp6/client/guest-stars.js` VIEW listesi (ticaret eylemleri + SAHA-ENTEGRE.0 eylemleri birleşimi), `CODEX-SON-RAPOR.md` (iki bağlantı). Motor dosyalarında (`commerce.js`, `diplomacy.js`, `main.js`, `map.js`, `ai.js`, `mp-core.js`, `mirror.js`) metin çatışması yok. |
| Zincirleme liman (bağlantı başına ≤3 sıçrama), Transit İzni, fiziksel teslim, liman kaybı, ticaret haritası | Codex'in kodu **olduğu gibi** alındı (yeniden yazılmadı). Ayrıntı ve Codex kabul tablosu: `reports/codex/TICARET-AGI0-SONUC.md`. |
| p49 düzeltmeleriyle etkileşim | SAHA-GÜVENCE.1 C2 (`warFetihSettle` toprak vaadi) ve ticaretin "liman el değiştirince hak gerçek sahipten okunur" kuralı aynı `makePeace` yolunda; birleşik dalda testler aşağıda. |
| Sürüm | Değiştirilmedi (`96h10p49` kalır). Bu dal oynanabilir teslim değildir; Render'a verilmemeli. |

## B. Performans kapısı (açık)
- Codex ölçümü: 100 sistem tam ay p95 **+%27,61** (kapı %5) → FAIL, Codex raporunda.
- Bu oturumda kök neden incelendi (`reports/claude/evidence/saha-guvence1/perf/`, 100 sistem / 9 AI / tohum 11, 120. ay kaydı, gerçek saat ile 5 tekrar medyanı):
  - Aynı ay toplamı: kontrol (p49 ara HEAD `91b7ef7`) **512 ms**, aday **512 ms** — bu örnek ayda fark yok.
  - Ayın tek pahalı kalemi her iki kolda da bir `executeDeal` çağrısı: kontrol 47 ms, aday 56,7 ms; bunun **46–54 ms'si `dealTxBegin`** (işlem geri alma için `DEAL_TX_ROOTS` altındaki bütün dünya grafiğinin kopyası: 100 sistemde ~14 bin, 500 sistemde ~27 bin nesne).
  - Adayda `Commerce.aiOpportunityTick` 3,5 → 78,2 ms: artışın tamamına yakını içindeki meşru AI sözleşmesinin `executeDeal` → `dealTxBegin` kopyası; yeni rota / liman hesapları (`C.route` 4 → 17,7, `C.aiPorts` 1,8 → 9,3, `C.aiPartnerOffers` 15,9 ms) ikincil.
  - Sonuç: p95 artışı, ticaret AI'sının **fazladan imzaladığı sözleşme ayları** ile tam grafik işlem kopyasının çarpımıdır. Rota algoritması tek başına kapıyı aşmıyor.
- Önerilen düzeltme (KODLANMADI): `dealTxBegin`'i tam grafik kopyası yerine **yazma günlüklü işlem** (yalnız değişen nesne/alanın eski değerini kaydeden) yapmak. Bu, bütün anlaşma yolunun geri alma garantisini değiştirdiği için ayrı faz kararıdır; aynı Save8'den kontrol–aday Save8 + RNG birebir eşdeğerliği ve hata/rollback testleri ister. `getOwnPropertyDescriptors` tabanlı hızlandırma denendi, belirgin kazanç yok, bırakıldı.

## C. Testler (birleşik dal)
Hedefli (birleşik dal, Node): `ticaret_agi0_test.cjs` **27/0**, `faz92c_settlement_apply` **29/0**, `faz96a_integrity` **12/0**, `war_coalition0` **7/0**, `saha_guvence1_{fleet,war,events}` **6/0, 10/0, 4/0**, `saha_entegre0_{conquest,claims,warhelp,events}` **11/0, 8/0, 7/0, 8/0** — PASS.

Tam Node (`STARS_TEST_WORKERS=2`): **SUITES 242 · GEÇEN 5832 · KALAN 441** — p49 (SAHA-GÜVENCE.1) 6532 / 279. **40 pakette kötüleşme — FAIL** (`evidence/ticaret-ag0/full-ticaret.out` ↔ `full-p49.out`). Ağırlık: anlaşma motoru (`faz86b`, `faz86c_*`, `faz86e/f`, `faz87d` 24/0 → 7/17), gelen kutusu / UI (`faz95e_inbox` 20/0 → 7/13, `faz95e_ui_save`, `faz95e2_regression`, `faz96c3_ui`), MP diplomasi (`mp3_core` 11/0 → 3/8, `mp4_core` 14/0 → 2/12, `mp71_bridge`, `mp74_notice`, `mp_diplo5_*`, `mp_sync_fed0_peacewith` 6/0 → 0/6, `mp_techlux0`, `mp_waron0`, `mp_deal_sys0`, `mp_emir_guvence0`).

**Kaynak birleşme değil:** aynı paketler Codex'in kendi dalında (`codex/stars-ticaret-agi0` @ `84de561`, p47 tabanı) birebir aynı sayılarla düşüyor (`mp3_core` 3/8, `mp4_core` 2/12, `faz87d` 7/17, `faz95e_inbox` 7/13, `mp_diplo5_peacewith` 2/11, `faz86c_1` 95/7, `mp71_bridge` 2/7). Örnek gerekçe: eski fikstürlerde iki taraf arasında liman/hat yok → anlık kaynak takası artık `rules:quote` "Tek sefer…" ile reddediliyor; ardından gelen adımlar `offer` bulamayıp `TypeError` veriyor. Yani TİCARET-AĞI.0'ın bilinçli kural değişikliği (anlık mal takası kapandı) eski 40 paketin varsayımını bozuyor. Bu testler **gevşetilmedi / güncellenmedi**: her biri için "beklenen tasarım değişikliği mi, gerçek regresyon mu" ayrı karar ister (ör. MP kayıt paketi `mp4_core` ve barıştırma `mp_sync_fed0_peacewith` yalnız fikstürdeki kaynak maddesi yüzünden mi düşüyor).

Chromium (ticaret dalında): **NOT RUN** bu oturumda (Codex'in p47 üstündeki `mp8-TL` sonucu raporunda).

## D. Açık işler
0. **Önce**: 40 kötüleşen paketin teker teker sınıflandırılması (tasarım değişikliği → testin fikstürüne gerçek liman/hat kurulur ve beklenti açık gerekçeyle güncellenir; gerçek regresyon → kod düzeltilir). Bu bitmeden dal oynanabilir sayılmaz.
1. Performans: yazma günlüklü `dealTxBegin` (B) → 100 ve 500 sistem p95 yeniden ölçümü (kapı %5).
2. Codex raporundaki açıklar aynen geçerli: doğal kampanyada AI'nın yeni Transit İzni satın alması gözlenmedi; karışık sürüm (p47 istemci) oturumu NOT RUN; ortak ara limanda rıhtım rezervasyonu yok.
3. TİCARET-AI.0 ve FED-AI-SİYASET.0 **BAŞLANMADI** (bkz. `reports/claude/STARS-SONRAKI-DEVIR.md`).
