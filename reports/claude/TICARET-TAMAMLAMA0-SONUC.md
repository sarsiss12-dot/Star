# TİCARET-TAMAMLAMA.0 — Sonuç raporu

Tarih: 23 Kasım 2026 · Dal `claude/stars-ticaret-tamamlama0` · Taban `claude/stars-ticaret-ai1` @ `edc1601` (PR #74). Bu tabanın çalışma zamanı p50 `d1784ff` ile aynıydı (doğrulandı).

## Özet

**Yeni yayın adayı p51: `96h10p51 / stars-v96h10p51 / MP.8.9b50`.** Save8 v8, MP paketi 4 ve protokol 1 değişmedi.

Gerçek kod değişiklikleri:

1. **Atomik iki yönlü Transit İzni** (`commerce.js` `aiTransitRequest`).
   - İki ortağın aynı yabancı limandan geçmesi gerektiğinde AI her taşıyıcı için ayrı izni, kendi Etki'siyle ve tek işlemde alır.
   - Biri reddedilir ya da kısmi bir hata olursa ödeme ve izin geri alınır.
   - Tek yönlü eski yol aynı kalır.
   - İnsan sahibe iki yönlü otomatik istek gitmez.
2. **Klavyesiz ticaret miktarı.**
   - Müzakere masası miktar penceresine −100 / +100 / MAKS düğmeleri ve 25'lik hazır değer eklendi.
   - Kaynak sözleşmesi formunda sefer sıklığı ±30 gün, süre ±3 / ±12 ay adımlarıyla ayarlanır.
   - Dar yatay ekranda satırlar alta kayar (`ui.js`, `index.html`).
3. Sürüm işaretleri, manifest, deterministik ZIP; mp-core paket yükleyicisi p41–p50 kayıtlarını kabul eder.

Yapılmayanlar ve neden:
- Yeni ekonomik AI adayı yok. Önceki iki fazın kanıtı ve reddedilen adaylar (liman ufku, ayrı transit bütçesi) yeniden denenmedi.
- Ticaret amaçlı kolonileştirme (C10) başlanmadı.
- Fiziksel Android, gerçek internet, LAN ve canlı Render: NOT RUN.

---

## A. GitHub durumu

| | |
|---|---|
| Başlangıç | `edc16011513ad95b00eff6f7ddbaf11b95a923c0` (ai1, PR #74). Uzak dallar doğrulandı: ag2 `d1784ff`, ai0 `d438d6e`, ai1 `edc1601` ilerlememiş; main `4296ad2` değişmedi. |
| Bitiş | `7bbbaa4` + bu bağlantı commit'i, `claude/stars-ticaret-tamamlama0`, taslak PR #75 (taban `claude/stars-ticaret-ai1`) |
| Commit'ler | `7b8e3a6` Faz A (atomik transit + T1–T12) · `8a389b4` Faz D (klavyesiz miktar + Chromium U1–U3) · p51 sürüm / ZIP · rapor |
| Kontrol kökü | `git worktree` @ `d1784ff` (p50 sabit kopya) |

## B. Transit

Test: `tests/ticaret_tamamlama0_transit_test.js`. Aday **12/0**. Aynı test p50 kökünde (`STARS_ROOT`) **9/3**; düşenler yalnız yeni iki yönlü işlev vakaları (T1, T2, T8).

| Vaka | Sonuç (aday) |
|---|---|
| T1 iki yönlü koridor | a ve b izinli; her biri −36 Etki, sahip +72; ertesi ay a–b freight sözleşmesi |
| T2 bekleme | aynı ay ikinci çağrı: 0 rota, 0 Etki |
| T3 tek yönlü (b zaten izinli) | yalnız a izin alır; b için istek yok (gereksiz ikinci izin yok) |
| T4 ara liman yok | istek yok |
| T5 insan sahip, iki yön | istek yok, gelen kutusu boş |
| T6 insan sahip, tek yön | teklif insanın gelen kutusuna gider; izin ve ödeme kabulden önce yok |
| T7 düşük güven | sahibin karşı teklifi tavanı aşar; izin ve Etki yok |
| T8 kısmi hata | ikinci izin maddesinde enjekte edilen motor hatası: hiçbir izin ve ödeme kalmaz (`dealTxBegin` / `dealTxRollback`); iki tarafın 180 günlük beklemesi kalır |
| T9 izin taşıyıcı başına | `portRight(o,a)` doğru, `portRight(o,b)` yanlış; a'nın izni b'ye geçmez |
| T10 süre ve erken iptal | 361. günde rota kapanır; `revokePortTransit` hemen kapatır |
| T11 federasyon `ticaret` yasası | üye sahibin limanı izinsiz açık; izin istenmez; federasyondan ayrılınca kapanır |
| T12 yolda iptal → alternatif rota | konvoy 10 günde bir yeniden plan yapar, ikinci izinli ara limandan (18) tek kez teslim eder; ikinci teslim yok |

- **A4 (AI'nın insandan izin istemesi):** tek yönlü durumda mevcut `UI.aiOffer` yolu gerçek bir diplomatik kayıt oluşturuyor (T6); insan kabul, ret ve karşı teklif verebilir. İki yönlü durumda insan sahibe istek gitmez; atomiklik bir insan kararına bağlanamaz. Kalan bir sınırlama.
- **A5:** oyuncu ya da AI'nın AI sahipten izin istemesi mevcut `dealQuote` / `aiRespond` yolundan geçer (ilişki, güven, savaş, ambargo). Değiştirilmedi; T7 bunu gösteriyor.
- **A6 (sabit 36 Etki):**
  - değiştirilmedi;
  - karşı teklif (`aiCounterBudget`) gerçek değerlemeyi taşıyor;
  - önceki fazda 404'teki tek çiftte sahip daha fazlasını istedi ve teklif eden reddetti;
  - keyfî bedel değişikliği yapılmadı.
- **A10 (zincirleme limanlar):** ≤3 sıçrama kuralı ve ara liman kuralları değişmedi. T12 iki ayrı yabancı ara liman koridorunu kapsar. Önceki Chromium TB senaryosu ara liman fethini kapsar.

## C. Fiziksel lojistik

Bu fazda konvoy motoru (`Commerce.tick`, `dispatch`, `finish`, `block`) **değiştirilmedi**. Mevcut davranış testlerle doğrulandı:

| Konu | Kanıt | Sonuç |
|---|---|---|
| Yükleme bir kez, teslim yalnız varışta (B1) | TR R1 / R4 (Chromium), TB B2, `ticaret_ag2_mp` M1 | PASS |
| Kayıt → yeni oda → tek teslim (B3, E5) | TR 6/6 | §F'de |
| Aynı kararın tekrarı (B3, E8) | `ticaret_ag2_mp` M2 (aynı / farklı cid ikinci sözleşme üretmez); TL (misafir gelen kutusu yarışı) | PASS |
| Ara liman kaybı / fethi (B4, E7) | TB B4: rota kapanır, teklif reddedilir, stok değişmez | PASS |
| Alternatif rota (B5) | T12 | PASS |
| İzin iptali (A8, E6) | TB B3: teslim yok; 180 günlük bekleme kuralıyla konvoy düşer | PASS |
| Saldırı, sözleşme iptali, savaş / ambargo (B6, B8, B9) | mevcut `ticaret_agi0` / `ticaret_ag1` paketleri (tam Node içinde) | bu fazda yeni test yok |
| Konvoy görünürlüğü (B7) | misafir aynası yalnız kendi gönderdiği / aldığı konvoyları taşır (`Commerce.visible`, değişmedi); konvoy listesinden KONVOYU BUL (U3) | PASS |

## D. Ticaret AI

- **Gerçek davranış değişikliği yalnız atomik iki yönlü transit.**
- Bu kodun doğal kampanya etkisi TİCARET-AI.1'de birebir aynı kodla ölçüldü (v2 kolu):
  - 99 ve 404 (100 sistem / 9 AI / 120 ay) ile 500 sistem / 16 AI / tohum 11'de p50 ile ay ay bayt-bayt aynı;
  - tohum 11'de 1230. günde iki yönlü izin alındı, sonuç plasebo bandı içinde (kıtlık 14 → 6, bant 3–14).
- Bu mekanik bir düzeltme olarak kabul edildi (talimat: "çalışan güvenli mekanik düzeltmeyi yalnız toplam hacim artmadı diye reddetme"); ekonomik fayda **iddia edilmiyor**.
- **Reddedilen adaylar** (yeniden denenmedi, `AI-RED-KARARLARI.md`):
  - liman yatırım ufku ×4: doğal kampanyada 0 yatırım;
  - ayrı transit rota bütçesi: 500 sistemde erişilen 8 çiftin 8'i `aiTerms`'te elendi.
- **Stratejik liman (C9):** yeni fırsat aranmadı. TİCARET-AI.1'in salt gözlem hunisine göre fırsat alanı fiilen boş.
- **Ticaret amaçlı kolonileştirme (C10):** BAŞLANMADI. Kanıt bunun ayrı bir genişleme kararı olduğunu gösteriyor.
- **C1–C8, C11–C14** (ortak sıralama, oyuncuya AI teklifleri, ret / karşı teklif, zarar eden sözleşmeyi iptal): mevcut davranış değiştirilmedi.
  - `aiOpportunityTick` zarar ya da rezerv baskısında sözleşmeyi iptal ediyor (`trade-review-cancel`).
  - Ret sonrası 60–180 günlük bekleme var.
  - Yeni ölçüm yapılmadı; önceki huni (`funnel2` / `funnel3`) ve kampanya kanıtları geçerli.

## E. Android arayüzü

Test: `tests/browser-ticaret-tamamlama0-sp.cjs`. Ortam: gerçek Chromium, `isMobile` + `hasTouch`, `touchscreen.tap`; her dokunuştan önce `elementFromPoint` ile hedef doğrulandı.

| Ekran | U1 miktar penceresi | U2 sözleşme formu | U3 teklif → konvoy |
|---|---|---|---|
| 800×360 | PASS | PASS | PASS |
| 844×390 | PASS | PASS | PASS |
| 901×411 | PASS | PASS | PASS |
| p50, 844×390 | FAIL (düğme yok) | FAIL (sıklık / süre adımı yok) | PASS |

- **U1:** yalnız dokunuşla +100 → 110, +10 → 120, −10 → 110, MAKS → 3000 (stok), hazır 25 → TASLAĞA EKLE → taslakta 25 mineral.
  - Odak hiçbir zaman bir giriş alanında değil (klavye açılmadı).
  - Yatay kaydırma yok, ekran dışında düğme yok.
- **U2:**
  - gönder +100 (12 → 112), sıklık +30 (30 → 60), süre +12 (12 → 24);
  - rota önizlemesi "Hat açık · … → … · ~26 gün";
  - TEKLİF ET ve VAZGEÇ görünür;
  - taşma yok.
- **U3:** TEKLİF ET → AI kabul etti → sözleşme → 20 gün → konvoy listesi → KONVOYU BUL → harita seçimi (`CommerceUI.selected`), pencere kapandı.
- **Hata mesajları (D8):** mevcut `cargoReason` metni (ör. "Gereken transit izni · …", "Hat engelli …", `dealQuote` gerekçeleri) korundu; yeni ayrıştırma yapılmadı.
- **D10 / D11:** mevcut sözleşme / konvoy listeleri ve KONVOYU BUL kullanıldı; yeni ekran yazılmadı.
- **NOT RUN:** fiziksel Android dokunmatik klavye davranışı. Chromium'da odak denetimi yapıldı; gerçek klavye penceresi gözlenmedi.

## F. Multiplayer

Son kodla (p51) Chromium: üretim relay süreci + TLS vekili, host + B + C ayrı profiller. Sonuçlar §I'da.

TR senaryosu:
1. Yolda kargo varken kayıt alınır.
2. Bağlamlar kapanır, relay yeniden başlar.
3. Kayıt yeni odada DEVAM ET ile açılır.
4. B ana menüden, C davet bağlantısından döner.
5. Kargo tek kez teslim edilir; misafir aynası host ile eşit.

TB senaryosu: izin verme / alma, ara liman geçişi, yolda izin kaybı, ara liman fethi.

İki yönlü izin AI–AI'dır. İnsana iki yönlü istek gitmediği için MP'de yeni komut yok; misafir aynası değişmedi.

## G. Save8 / RNG

- Yeni kalıcı alan yok; mevcut `portTransit` ve `aiTalk` alanları kullanılıyor.
- Ölçülen p50 kayıt aylarında (100/9/m120, 500/16/m120, 500/16/m180) iki kol aynı Save8 SHA-256 ve RNG'ye varıyor: `92018e22…`, `1f6aa687…`, `b9057858…`. Perf aracının her örnek eşitlik denetimi de 3 + 3 koşunun hepsinde `equal: true`.
- Doğal kampanyada ilk ayrışma yalnız tohum 11'de, 41. ay, ilk iki yönlü izin kararında (TİCARET-AI.1).
- Kısmi hata sonrası dünya geri dönüyor (T8).

## H. Performans

Araç: `research/ticaret-agi0/ay-maliyeti.cjs`. p50 sabit kontrol; aynı kayıt, aynı ortam; koşu başına kol başına 28 örnek.

| Kayıt | 3 koşu Δp95 | 6 koşu birleşik Δp95 | Birleşik p50 | A/A (p50 ↔ p50, 3 koşu) Δp95 |
|---|---|---|---|---|
| 100 sistem / 9 AI / m120 | +%7,20 | **+%6,08** | 161,0 → 164,3 ms (+%2,1) | **−%6,12** |
| 500 / 16 / m120 | −%1,60 | **+%0,20** | 895,9 → 897,1 | −%2,93 |
| 500 / 16 / m180 | −%2,48 | **−%1,37** | 2872 → 2856 | −%0,87 |

Tek koşu Δp95 değerleri 100 sistemde −%16,9 ile +%32,6 arasında oynuyor.

**Değerlendirme:**
- 500 sistemde kapı açıkça geçti.
- 100 sistemde birleşik +%6,08, %5 kapısının üstünde. Ama aynı kodu kendisiyle karşılaştıran A/A ölçümü −%6,12 veriyor; ölçüm çözünürlüğü bu kayıtta ±%6.
- Deterministik kanıt: ölçülen ayda iki kol **aynı işi** yapıyor. `aiTransitRequest` 9 / 19 / 27 çağrı, toplam `Commerce.route` araması 89 / 62 / 79; iki kolda birebir aynı, aynı Save8 / RNG (`research/ticaret-tamamlama0/ay-is-sayimi.cjs`, kanıt `evidence/ticaret-tamamlama0/perf/is-sayimi.txt`).
- İşlev profili (`STARS_PROFILE_100=1`): `Commerce.aiOpportunityTick` 5,15 / 5,05 ms, `Commerce.route` 2,8 / 2,3 ms. Arayüz değişiklikleri simülasyon ayında hiç çalışmıyor.
- Sonuç: 100 sistem farkı ölçüm gürültüsüdür, ek maliyet yok.
- Bu bir **yorum kararıdır**. Katı kural ("6 koşu birleşik ≤ %5") okunursa 100 sistem satırı FAIL sayılır; karar sürüm kapısı için kullanıcıya açıkça bildirildi.
- Aktif uzun ticaret rotası ayı (F5): NOT RUN. Konvoy motoru değişmedi; ölçülen aylar gerçek AI sözleşmelerini içeriyor.

## I. Regresyonlar

Son kod (p51):

| Test | Sonuç |
|---|---|
| Tam Node (`STARS_TEST_WORKERS=4`) | **246 paket / 6563 PASS / 279 FAIL**. p50 / ai1 tabanı 245 / 6551 / 279; +1 paket = `ticaret_tamamlama0_transit` (+12). Başarısız 56 paketin listesi ve paket içi sayıları önceki koşuyla birebir aynı (`evidence/ticaret-tamamlama0/node/fail-listesi.txt`); **yeni FAIL yok**. Audit / navy dosyaları geri alındı. |
| `ticaret_tamamlama0_transit` | 12/0 |
| Chromium SP `browser-ticaret-tamamlama0-sp` | 9/0 |
| MP8 Chromium | TR 6/0 · TL 5/0 · TA 6/0 · TB 6/0 · SG 5/0 · J 5/0 · X 5/0 (hepsi PASS, son kodla; `evidence/ticaret-tamamlama0/chromium/`) |

## J. Yayın

- `releases/stars-faz96h10p51.zip`: 20 girdi (19 çalışma zamanı + manifest), **959 092 bayt**, SHA-256 `9c513c0b908cd8b2c877d31c6acbfad980eafd7ad7fca17b88c1f4b2a74bc434`, CRC32 `D82CE4BE`.
- İki paketleme bayt-bayt aynı; çıkarılan ZIP `verify-release --root` ile DOĞRULANDI (19 dosya, build 96h10p51). Kayıt `RELEASE-TICARET-TAMAMLAMA0.json`.
- BUILD_ID ↔ manifest ↔ sw CACHE ↔ relay `/mp/version` (MP.8.9b50) ↔ misafir `MP_VERSION` birlikte güncellendi. mp-core p51, p41–p50 paketlerini kabul eder.
- **Render'da denenecek dal:** `claude/stars-ticaret-tamamlama0` (p51). Geri dönüş için `claude/stars-ticaret-ag2` (p50). Canlı Render değiştirilmedi.

## K. Açık kalan görevler (önem sırasıyla)

1. Fiziksel Android ve canlı Render ile 2 cihaz kabulü (NOT RUN).
2. 100 sistem p95 ölçüm gürültüsü (A/A ±%6): kapı için daha çok örnek ya da deterministik iş ölçüsü, araç düzeyinde iyileştirme.
3. İnsan sahibe iki yönlü izin isteği (atomik çok taraflı insan onayı) yok.
4. Hata mesajlarının ayrıştırılması (D8), tek ekranda tek seferlik ↔ düzenli geçiş (D4), mobil liman listesi (D6): bu fazda yapılmadı.
5. Ticaret amaçlı kolonileştirme (C10) ve sabit izin bedeli (A6): ayrı karar.
6. Aktif uzun rota performans ayı (F5) ve 180 / 240 ay kampanyaları (yeni ekonomik aday olmadığı için koşulmadı).
7. Faz G ek denetimleri: yapılmadı.

---

## 27 soru

| # | Soru | Cevap |
|---|---|---|
| 1 | İki yönlü transit izni oyunda çalışıyor mu? | Evet (p51; T1 / T2 / T8; p50'de yok). |
| 2 | Biri başarısız olunca gereksiz ödeme kalıyor mu? | Hayır (T8: işlem geri alınır). |
| 3 | Oyuncu AI'dan izin alabiliyor mu? | Evet, mevcut masa yolu (`portTransit` maddesi, `aiRespond`); T7'de ret davranışı. |
| 4 | AI oyuncudan izin isteyebiliyor mu? | Tek yönlüde evet, gerçek gelen kutusu teklifiyle (T6). İki yönlüde istek gitmez (bilinçli sınırlama). |
| 5 | Federasyon ticaret yasası doğru mu? | Evet (T11). |
| 6 | İzin iptalinde konvoy doğru tepki veriyor mu? | Evet: alternatif varsa yeniden plan (T12), yoksa bekleme / kayıp (TB B3). |
| 7 | Ara liman fethedilince ne oluyor? | Rota kapanır, yeni teklif reddedilir, stok değişmez (TB B4). |
| 8 | Alternatif rota bulunabiliyor mu? | Evet (T12). |
| 9 | Konvoy aynı kargoyu iki kez teslim edebiliyor mu? | Hayır (TR, TB B2, T12, M1 / M2). |
| 10 | AI fiziksel ticareti daha etkin kullanıyor mu? | Kanıtlanmadı; iki yönlü koridorda artık kullanabiliyor, doğal etki bant içinde. |
| 11 | AI kârsız sözleşmeleri reddediyor mu? | Evet, mevcut `aiTerms` / `aiValue` (değişmedi); T7, liman kontrollü vakaları. |
| 12 | AI krizleri ticaretle azaltıyor mu? | Kanıtlanmadı (plasebo bandı). |
| 13 | AI oyuncuya makul teklif gönderiyor mu? | Mevcut `aiPlayerTerms` yolu değişmedi; bu fazda yeni ölçüm yok. |
| 14 | Ticaret amaçlı kolonileştirme yararlı mı? | Başlanmadı. |
| 15 | Stratejik liman için yeni fırsat bulundu mu? | Hayır (TİCARET-AI.1 kanıtı). |
| 16 | Telefonda klavyesiz sözleşme kurulabiliyor mu? | Chromium dokunmatik testinde evet (U1–U3). Fiziksel cihaz NOT RUN. |
| 17 | 800×360 / 844×390'da taşma var mı? | Yok (U1 / U2 yatay kaydırma ve ekran dışı düğme denetimi). |
| 18 | Tek seferlik / düzenli ticaret kolay mı? | İkisi de dokunuşla kurulabiliyor. Tek ekranda geçiş (D4) yapılmadı. |
| 19 | Misafirde ticaret işlemleri doğru görünüyor mu? | Otomatik testte evet: TR / TB / TA / TL PASS (izin, kargo, gelen kutusu kararı, konvoy aynası). Fiziksel cihaz NOT RUN. |
| 20 | Kargolu kayıt sonrası yeni oda güvenli mi? | Evet, TR 6/0: `G.commerce` birebir, tek teslim, yeniden ödeme yok. |
| 21 | Save8 / RNG korunuyor mu? | Evet (§G). |
| 22 | 500 sistem performansı? | +%0,20 / −%1,37 (6 koşu birleşik p95). |
| 23 | Yeni regresyon var mı? | Hayır: Node FAIL listesi tabanla aynı; Chromium hepsi PASS. 100 sistem perf satırı ölçüm gürültüsü olarak yorumlandı (§H). |
| 24 | Hangi AI adayları reddedildi? | Liman ufku ×4 (0 yatırım), ayrı transit bütçesi (8/8 `aiTerms` ret); bu fazda yeni aday yok. |
| 25 | p51 oluşturuldu mu? | Evet, yayın adayı (§J). Saha kabulü yok. |
| 26 | Render'da hangi dal? | `claude/stars-ticaret-tamamlama0`. |
| 27 | Kullanıcı test yapamıyorsa sıradaki görev? | Savaş desteği AI (planlanan). Ticaret tarafında: D8 hata mesajları + D4 tek ekran ticaret akışı (UX) ve perf aracının 100 sistem gürültüsünü düşürmek. |
