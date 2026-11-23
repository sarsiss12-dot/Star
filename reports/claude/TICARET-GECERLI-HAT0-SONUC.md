# TİCARET-GEÇERLİ-HAT.0 — Sonuç raporu

Tarih: 23 Kasım 2026 · Dal `claude/stars-ticaret-gecerli-hat0` (taslak PR #76) · Taban p51 `claude/stars-ticaret-tamamlama0` @ `1b95efb` (PR #75). Araştırma: Codex `codex/stars-ticaret-kok-neden0` @ `2d96b6d` (rapor, `partner.cjs` ve diğer deney araçları bu dala alındı).

## Özet

**Yayın adayı p52: `96h10p52 / stars-v96h10p52 / MP.8.9b51`.** Save8 v8, MP paketi 4 ve protokol 1 aynı.

Tek oyun değişikliği `commerce.js`:
- `aiPorts`, aynı taramada ileri yönü açık bulduğu diğer liman çiftlerini ek rota araması yapmadan `alts` olarak saklıyor. En iyi seçim değişmedi.
- `aiOpportunityTick` içinde en yakın çiftin teklifi `aiTerms`'te oluşmazsa (siyasi olmayan yol) ya da `dealQuote` reddederse, yeni `aiAltPorts` aynı karar anında ve aynı 96'lık bütçeden (aday başı 1 birim) en çok 3 alternatifi `aiTerms` + `dealQuote` ile deniyor.
- Kabul kararı yine `aiNegotiate` (AI) ya da `UI.aiOffer` (insan gelen kutusu) ile veriliyor. Alternatif yoksa eski ret (`trade-quote-rejected`) aynen kalıyor.

Fiziksel Android, gerçek internet, LAN ve canlı Render: **NOT RUN**.

## Değişiklik ayrıntısı

| Yer | Değişiklik |
|---|---|
| `Commerce.aiPorts` | Mevcut aday döngüsü aynı. İleri yönü açık her çift `found` dizisine eklenir; en kısa yol yine `best`. `best.alts` = diğerleri, mesafeye göre kararlı sıralı. **Yeni rota araması yok.** |
| `Commerce.aiAltPorts` (yeni) | `ports.alts`'tan en çok 3 aday. Her deneme `budget.routes` ile 1 birim. Oyuncuya `aiPlayerTerms`, AI'ya `aiTerms`; ardından `dealQuote`. İlk geçerli olanı döndürür (`trade-alt-port` tanı notu). |
| `Commerce.aiOpportunityTick` | (a) Terimler oluşmazsa ve siyasi değilse alternatif. (b) `dealQuote` reddederse alternatif. Sonrası aynı: insana `UI.aiOffer`, AI'ya `aiNegotiate`, bekleme süreleri aynı. |

Değişmeyenler:
- üç sıçrama kuralı;
- 96'lık rota bütçesinin üst sınırı;
- `portRight` / Transit İzni (yabancı limana izinsiz rota yok);
- `identifiedPort` (bilinmeyen liman bilinmiş sayılmaz);
- `pairGate` (savaş, ambargo, diplomatik engel);
- stok ve kapasite denetimleri (`legGate`);
- insanın onay yolu.

## Kök neden (soru 1)

Codex `research/ticaret-kok-neden0/partner.cjs` p51'de bağımsız olarak yeniden üretildi (`evidence/ticaret-gecerli-hat0/kontrollu/partner-p51.json`):
- `aiPorts` hedefi 4 seçiyor (0 → 4, 360 birim).
- `dealQuote` reddediyor: "Limanlar arasında üç sıçrama içinde açık ve izinli bağlantı bulunamadı". Ortağın dönüş yükü 3'teki yabancı limandan izinsiz geçemiyor.
- 9 numaralı alternatif geçerli: `kabul`, 16 mineral ve 14,3 enerji birer kez teslim, RNG aynı.

Kök neden: `aiPorts` yalnız ileri yönün yoluna bakıyor ve `aiOpportunityTick` teklif reddinde aynı devletin diğer geçerli çiftini denemeden ortağı 120 gün bekletmeye alıyor. **Doğrulandı.**

## Hedefli test (soru 2–4)

`tests/ticaret_gecerli_hat0_test.js`, gerçek `aiOpportunityTick` ile. Aday **13/0**, p51 kökünde (`STARS_ROOT`) **9/4**; düşenler yalnız alternatife dayanan vakalar (G1, G9, G10, G13).

| # | Vaka | Aday sonucu |
|---|---|---|
| G1 | İlk çift (4) dönüş izni yüzünden geçersiz, ikinci (9) geçerli (istenen 1, 2, 13) | 9 ile tek AI–AI sözleşmesi. İki yük teslim edildi; her konvoyun tek makbuzu var. İptalden sonra yeni sefer yok. p51: sözleşme yok (`trade-quote-rejected`). |
| G2 | İlk çift zaten geçerli (4) | Alternatif denenmez, bütçe harcanmaz, 4 ile sözleşme. |
| G3 | İki çift de geçersiz | 1–2 sözleşmesi yok; eski ret (`trade-quote-rejected` beklemesi). |
| G4 | Alternatif liman ortakça bilinmiyor | Sözleşme yok. |
| G5 / G6 | Savaş / ambargo | Siyasi kapı; alternatif denenmez, sözleşme yok. |
| G7 | Başlatanın bütün stoku yok | Sözleşme yok. |
| G8 | Alternatifin kapasitesi düşük | Yük `routeVolume` sınırını aşmaz. |
| G9 | Ortak alternatif teklifi reddeder (`aiRespond` red) | Zorla kabul yok; sözleşme yok; `trade-retry-wait` beklemesi. |
| G10 | Aynı ay ikinci tur / ertesi gün | İkinci sözleşme yok. |
| G11 | Save8 kaydet → yükle → karar | Kayıtsız dünyayla aynı `G.commerce` ve RNG. |
| G12 | Oyuncu–AI | Alternatif çiftle teklif oyuncunun gelen kutusuna gider; kabul edilmeden sözleşme ya da stok değişimi yok. |
| G13 | Bütçe | Alternatif denemesi ortak bütçeden 1–3 birim. |
| — | Transit izni yetersiz (istenen 6) | G1'in ilk çifti ve G3 bunu kapsar. Ayrıca `ticaret_tamamlama0_transit` T1–T12. |
| — | Multiplayer host otoritesi (istenen 15) | Değişiklik yalnız host'ta çalışan AI turunda; MP8 senaryoları (§ Multiplayer). |

Codex `partner.cjs` adayda da geçiyor: `aiPorts` yine 4'ü seçiyor (en iyi seçim değişmedi), alternatif 9 geçerli.

## Doğal kampanya (soru 5–6)

Araç `research/ticaret-ai0/camp.cjs`, alternatif sayacı eklendi. Kontrol p51, aday aynı başlangıç. Kanıt `evidence/ticaret-gecerli-hat0/kampanya/`.

| Kampanya | Alternatif denemesi / başarı | İmzalı / teslim yükü (p51 = aday) | Save8 |
|---|---|---|---|
| 100/9 · 11 · 120 ay | — / 0 | 25 / 3269 | her ay bayt-bayt aynı |
| 100/9 · 99 · 120 ay | — / 0 | 2 / 150 | aynı |
| 100/9 · 404 · 120 ay | — / 0 | 12 / 1955 | aynı |
| 100/9 · 11 · 240 ay | 0 / 0 | 54 / 3784 | aynı |
| 100/9 · 99 · 240 ay | 9 / 0 | 13 / 1500 | aynı |
| 100/9 · 404 · 240 ay | 3 / 0 | 24 / 3361 | aynı |
| 500/16 · 11 · 120 ay | 0 / 0 | 2 / 296 | aynı |

120 aylık koşularda deneme sayacı henüz yoktu ("—"); başarı sayısı `trade-alt-port` notundan ölçüldü (0).

- Doğal kampanyalarda `dealQuote` reddi (`trade-quote-rejected`) 0. Alternatif 12 kez denendi; hiçbirinde kârlı ve geçerli bir alternatif çıkmadı. **Yeni ticaret fırsatı oluşmadı.**
- Ekonomik zarar, gereksiz sözleşme ya da Etki harcaması yok: her koşu p51 ile bayt-bayt aynı.
- Bu beklenen sonuç: düzeltme mekanik. Önceden alternatifi olmayan kararlar değişmedi.

## Rota bütçesi ve performans (soru 7)

Deterministik sayım, p51 performans kayıtlarında ölçülen ay (`research/ticaret-tamamlama0/ay-cagri-sayimi.cjs`, `ay-is-sayimi.cjs`):

| Kayıt | `aiAltPorts` | `aiTerms` | `dealQuote` | `route` | Save8 / RNG |
|---|---|---|---|---|---|
| 100 / 9 / m120 | 0 (iki kol) | 2 / 2 | 10 / 10 | 89 / 89 | aynı |
| 500 / 16 / m120 | 0 | 0 / 0 | 0 / 0 | 62 / 62 | aynı |
| 500 / 16 / m180 | 0 | 1 / 1 | 14 / 14 | 79 / 79 | aynı |

Adayın tek ek işi ayda 17–36 `aiPorts` çağrısında küçük bir dizinin (≤12 öğe) kurulup sıralanması.

Zaman ölçümü (`ay-maliyeti.cjs`, p51 sabit kontrol, 3 koşu × kol başına 28 örnek):

| Kayıt | A/B birleşik Δp95 | A/B tek koşular | A/A birleşik Δp95 | A/A tek koşular |
|---|---|---|---|---|
| 100 / 9 / m120 | +%12,98 | +18,6 / −8,3 / −7,8 | +%1,14 | +7,7 / −6,6 / +1,0 |
| 500 / 16 / m120 | +%9,44 | +0,9 / +10,8 / +4,1 | +%0,85 | +13,0 / +6,6 / −6,7 |
| 500 / 16 / m180 | −%1,46 | +2,1 / −1,3 / −4,7 | −%3,80 | −10,9 / −0,8 / −3,6 |

**Değerlendirme.**
- Birleşik A/B p95, 100 sistem ve 500/120'de %5 kapısının **üstünde**.
- Ama aynı kodu kendisiyle karşılaştıran tek koşular da ±%13 oynuyor. Ölçülen ayda iki kol aynı rota aramalarını, aynı `aiTerms` / `dealQuote` çağrılarını yapıyor ve aynı Save8'e varıyor.
- Ölçülebilir ek iş yok; zaman farkı tarayıcı / ortam gürültüsü olarak yorumlandı.
- **Katı kuralla p95 kapısı bu koşuda FAIL sayılır.** Sürüm kararı bu yoruma dayanıyor, kullanıcı onayı gerekir.

## Save8 / RNG (soru 8)

- Yeni Save8 alanı yok; `alts` yalnız karar anındaki yerel nesnede tutuluyor, kaydedilmiyor.
- Tetiklenmeyen bütün doğal koşularda ve perf aylarında Save8 / RNG p51 ile aynı.
- Tetiklenen kontrollü vakada (G1) ilk meşru ayrışma o turdaki kararda: p51 `trade-quote-rejected` beklemesi yazıyor, aday 9 ile sözleşme imzalıyor.
- G11: kayıt → yükleme → karar eşdeğer.

## Regresyon ve Multiplayer (soru 9)

Son kod p52 üzerinde. Sonuçlar `evidence/ticaret-gecerli-hat0/` altında.

| Test | Sonuç |
|---|---|
| Tam Node (`STARS_TEST_WORKERS=4`) | **247 paket / 6576 PASS / 279 FAIL**. p51 tabanı 246 / 6563 / 279; +1 paket = `ticaret_gecerli_hat0` (+13). Başarısız 56 paketin listesi ve sayıları p51 ile birebir aynı; **yeni FAIL yok**. Ticaret paketleri: `ticaret_ag1` 9/0, `ticaret_ag2_tx` 6/0, `ticaret_ag2_mp` 2/0, `ticaret_tamamlama0_transit` 12/0, `ticaret_gecerli_hat0` 13/0, `faz96a_cargo` 36/0, `faz96a_integrity` 12/0, `faz92c_settlement_apply` 29/0. |
| MP8 Chromium | TR 6/0 · TL 5/0 · TA 6/0 · TB 6/0 · SG 5/0 · J 5/0 · X 5/0, hepsi PASS (host + 2 misafir, üretim relay + TLS vekili) |
| SP dokunmatik `browser-ticaret-tamamlama0-sp` | 9/0 (800×360 / 844×390 / 901×411) |
| `ticaret_tamamlama0_transit` + `ticaret_gecerli_hat0` | 12/0 + 13/0 |

## Yayın (soru 10)

- `releases/stars-faz96h10p52.zip`: 20 girdi, 959 583 bayt, SHA-256 `2b9f7068c2ed546cf11de3f2df2177631697f162e4d0c2b9ee0f427e6bce7b96`, CRC32 `09AE6E5D`.
- İki paketleme bayt-bayt aynı; çıkarılan ZIP `verify-release --root` ile DOĞRULANDI. Kayıt `RELEASE-TICARET-GECERLI-HAT0.json`.
- BUILD_ID, manifest, sw CACHE, relay `/mp/version` (MP.8.9b51) ve misafir `MP_VERSION` birlikte güncellendi. mp-core p52 paket yükleyicisi p41–p51 kayıtlarını kabul eder.
- **Render dalı:** `claude/stars-ticaret-gecerli-hat0` (p52). Geri dönüş için `claude/stars-ticaret-tamamlama0` (p51). main ve canlı Render değiştirilmedi.

## 10 soru

| # | Soru | Cevap |
|---|---|---|
| 1 | Kök neden doğrulandı mı? | Evet; p51'de yeniden üretildi. |
| 2 | Geçerli ikinci liman seçiliyor mu? | Evet (G1); ilk çift geçerliyse dokunulmuyor (G2). |
| 3 | İki yük yalnız birer kez mi teslim? | Evet: iki konvoy, tek makbuz, iptalden sonra yeni sefer yok (G1). |
| 4 | Diplomatik / ekonomik kararlar korundu mu? | Evet: savaş, ambargo, bilinmeyen liman, kapasite, stok, ret ve insan onayı aynı (G3–G12). |
| 5 | Doğal kampanyada yeni fırsat oluştu mu? | Hayır; alternatif 12 deneme, 0 başarı; dünya bayt-bayt aynı. |
| 6 | Ekonomik zarar / gereksiz sözleşme var mı? | Yok. |
| 7 | Rota bütçesi ve performans korundu mu? | Bütçe korundu (üst sınır 96, alternatif başı 1). Deterministik iş aynı. Zaman p95 A/B birleşik +%12,98 / +%9,44 / −%1,46: A/A gürültüsünden ayırt edilemiyor; katı kuralla kapı FAIL. |
| 8 | Save8 / RNG? | Tetiklenmeyen koşularda aynı; tetiklenen vakada ilk ayrışma karar anında. |
| 9 | MP regresyonları geçti mi? | Evet: TR / TL / TA / TB / SG / J / X hepsi PASS. Tam Node yeni FAIL yok. |
| 10 | Yayın adayı ve Render dalı? | p52 hazır; `claude/stars-ticaret-gecerli-hat0`. Perf yorumu kullanıcı onayına bağlı. |
