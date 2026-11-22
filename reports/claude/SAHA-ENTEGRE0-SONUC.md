# SAHA-ENTEGRE.0 — Sonuç raporu (p48 / MP.8.9b47)

Tarih: 22 Kasım 2026 · Dal: `claude/stars-saha-entegre0` · Taban: `codex/stars-mp-rakip-doktrinler0` @ `8984b51` (p47 / MP.8.9b46, PR #63)
Kapsam: Issue #66 (fetih anında filo kaybı, PR #64), Issue #65 (haritadan fetih, anomali sıklığı, toplu gizleme, MP harita, savaş yorgunluğu), Issue #67 (Savaşa Yardım Teklif Et).
Kanıt: `reports/claude/evidence/saha-entegre0/` · Devir notu: `reports/claude/SAHA-ENTEGRE0-DEVIR.md`

Durum dili: PASS / FAIL / NOT RUN ayrı. Fiziksel Android ve canlı Render bu fazda **NOT RUN**. Kullanıcı kabulü yok; hiçbir madde kullanıcı onayı olmadan "kabul edildi" sayılmaz.

---

## A. Kanonik kaynak

| Öğe | Değer |
|---|---|
| Başlangıç HEAD | `8984b5107cae91016c41233409956e2cbb2523e2` (p47, `codex/stars-mp-rakip-doktrinler0`) |
| PR #64 (taslak hotfix) | `codex/stars-saha-ordu-kaybi-p0` @ `0d50abc096d02375a367d9e9f1d610da9fc460ff` |
| PR #64'ün durumu | Kod düzeltmesi **doğru**; testi iki hata nedeniyle hiç geçemiyordu (aşağıda C.1). Test düzeltildikten sonra p47'de FAIL, PR #64 kodunda PASS. Bu doğrulamadan sonra birleştirildi (`e03b8e7`). |
| Yeni dal | `claude/stars-saha-entegre0` |
| Bitiş HEAD | Dalın son commit'i (kod/paket `c01be57`; bu bağlantı commit'i yalnız belge) |
| Taslak PR | #68 https://github.com/sarsiss12-dot/Star/pull/68 (taban `codex/stars-mp-rakip-doktrinler0`) |
| Okunanlar | AGENTS.md, GPT-DEVIR.md, CLAUDE.md, PROJE-DURUMU.md, Issue #65/#66/#67 |

Commit sırası (her faz ayrı):

1. `e03b8e7` PR #64 doğrulanmış olarak birleştirildi
2. `8dc64da` Faz A — fetih filo kaybı matrisi + PR #64 testinin ölçüm hataları
3. `52b6901` Faz B — fetih talebi reformu
4. `24560e6` Faz C/E/F — Savaş Merkezi yorgunluğu, BİLİM ANOMALİLERİ, TÜMÜNÜ KENARA AL
5. `ebe2bfc` Faz D/G — Savaşa Yardım Teklif Et; misafir büyük armalar; seçimsiz lojistik
6. `5d85bbd` Sürüm p48 / MP.8.9b47, gerçek Chromium SP + MP SE testleri
7. Kapanış commit'i: koruma pinleri, eşdeğerlik testi, E6, ZIP + yayın kaydı, raporlar

## B. Yapılan işler

### Faz A — Fetih anında filo kaybı (Issue #66, PR #64)
- `economy.js invasionTick` TEMİZ İŞGAL dalı artık `K.tf` filolarını silmiyor (PR #64). Fetih anında garnizon = yerel taban `garrisonOf(...)` (en az 10); yörüngedeki ordu aynı ay sonunda `groundTick` takviyesiyle destek verir — aynı ordu iki kez sayılmaz.
- 11 vakalık matris (`tests/saha_entegre0_conquest_test.js`), ölçüm `invasionTick()` öncesi/sonrası + ilk gün adımı + iki ay: yalnız ordu, yalnız savaş gemisi (bombardıman), karma 15K varyantı, farklı savaş gemileri, aynı sistemde iki filo, müttefik filo, host insan, MP misafiri, başka savaş sürerken, gerçek kara savaşı zayiatı (yalnız ordu erir, savaş gemisi gövdeleri aynen), garnizon dengesi.

### Faz B — Fetih talebi (Issue #65 §1)
- `WAR_FETIH_MAX=5` artık **bedelsiz** hedef sayısı; 6. hedeften itibaren `warFetihClaimCost` = 10 + 5×sıra + 6×koloni Etki; başkent +60 Etki. `warFetihCandidates`'teki 12 aday kesimi kalktı (sıra aynı). Ağ/kayıt tavanı `WAR_FETIH_LIMIT=256`.
- Başkent hedeflenebilir (`{capital:true}`); tek sistemli devlet artık hedefsiz kalmaz. Koptuğu devlete karşı (`foe.sundered===e.id`) **İsyanı Bastır**: başkent dahil bedelsiz.
- `setWarGoal` bedeli tek seferde düşer; önizleme toplam bedeli ve "Yetersiz Etki" engelini gösterir (hem tek pencere hem WarCoal akışı).
- Arayüz: arama kutusu, 40'lık sayfa + "Daha fazla göster", ★ Başkent, bedel satırı; **HARİTADAN HEDEF SEÇ** (`View.claimPick`): haritada aday halkaları, dokunuş aç/kapa, alt çubukta sayı + Etki bedeli, TAMAM / İPTAL. Dokunuş, bölge etiketi / çift dokunuş / filo satırı dallarından önce çözülür.
- Misafir yalnız **gözlediği** sahipliği görür (`mapOwners`); host her komutta `warGoalOptions` ile yeniden doğrular.
- AI: `aiWarGoalChoice` aynı sırayla en çok 3 başkent dışı hedef seçer → bedel 0 → AI davranışı/Save8/RNG aynı.

### Faz C — Savaş yorgunluğu (Issue #65 "yeni istek")
- Üstteki ⚔ (Aktif Savaşlar) tek dokunuşla Savaş Merkezi'ni açar; her açık cephede **kendi yorgunluğun %0–100**, renkli çubuk, "bu hızla ≈ n ay", %85+ uyarısı ve %100 kuralı (zorunlu barış; doktrin yasaklıyorsa ateşkes kilidi), BARIŞ GÖRÜŞMESİ düğmesi.
- Düşman başına ayrı değer (`warExhaustionForecast`, cephe çifti); rakibin değeri yalnız istihbarat ≥3 (SIZILMIŞ) ile; değilse "BİLİNMİYOR (SIZILMIŞ istihbarat gerekir)". Son zorunlu barıştan türetilen tahmin varsa "· son zorunlu barıştan tahmin" etiketiyle yazılır.
- Misafir host'un yetkili değerini `warCenterRead` ile alır (MP SE H3: %88 + uyarı + BİLİNMİYOR).

### Faz D — Savaşa Yardım Teklif Et (Issue #67)
- `warHelpOptions(e,o)`: alanın (o) taraf olduğu, verenin (e) taraf olmadığı **bilinen** açık cepheler (`warFrontKnown`; müttefikin / aynı federasyon ortağının savaşı doğrudan görünür), uygunluk aynı `warSupportGate`.
- Masa: SEN VERİYORSUN'da "🛡 Savaşa Yardım Teklif Et" → cephe seçimi → `{t:'warJoin',front,target}` VER listesine; karşılık İSTİYORUM'da kaynak / teknoloji / geçiş / haraç / aynı cephe toprak vaadi.
- Yeni motor yok: `dealQuote` / `executeDeal` / `aiRespond`. Hazırlık savaş başlatmaz, ödeme yapmaz; kabulde tek işlem (ikinci uygulama reddedilir); savaş bitince gecikmiş teklif geçersiz.
- MP: `warSupportList dir:'offer'` (salt okuma), `offer` kapısı `warHelpOptions`'u da kabul eder; misafir satırları host'tan (`UI.dealHelpRows`).
- AI: teklif VERİR (mevcut BETA-FED-AI.0 `support-opportunity`: müttefikine `warJoin` VER + mineral İSTE) ve gelen yardım teklifini `aiRespond` ile kabul / ret / karşı teklif olarak değerlendirir.

### Faz E — BİLİM ANOMALİLERİ (Issue #65 "saha düzeltmesi")
- `ANOMALY_LEVELS`: Kapalı 0 / Seyrek .10 / Az .20 / Normal .42 / Yoğun .60. Galaksi üretimi **aynı zarı** çeker, yalnız eşik ayardan gelir → Normal'de Save8/RNG p47 ile aynı (`anomalies` kayda yazılmaz). Geçersiz değer `setupConfigError`.
- Kurulum: "BİLİM ANOMALİLERİ" satırı + özet; olay anahtarının adı "🎲 Rastgele Hikâye Olayları" (iki mekanik ayrı). Kalıntı kökeni anomalisi ayrı kalır.
- Kapalı: bilim gemisi taraması karar penceresi açmaz, ödül vermez, keşif sürer (E4).
- MP: lobi `configure` + paket doğrulaması + `publicGalaxy` + mp1-host senkronu (E6).

### Faz F — TÜMÜNÜ KENARA AL (Issue #65 §2)
- Şeritte ≥2 kart varken "TÜMÜNÜ KENARA AL": karar / ödül / ret yok, kayıt silinmez. Diplomatik kayıt Gelen kutusuna (`DiplomaticInbox.capture`), öteki kartlar `hidden` (☰ listesinden açılır), açık olay penceresi küçültülür, `noteResume`. Misafir VIEW.

### Faz G — MP harita (Issue #65 §4)
- Misafirin VIEW listesinde `bigEmblemsToggle` yoktu → `UI.act` kapısı "Büyük armalar"ı engelliyordu. Eklendi (H1 PASS).
- Lojistik: ikmal ağı tasarım gereği yalnız seçili duran filoyla çiziliyordu (yalnız renk değişiyordu). Filo seçili değilken kendi ikmal limanları (◆) + "filo seç" ipucu; önbellek `View._logiHintPorts` (Save8 / ayna dışı). Host ve misafir (H2 PASS).

### Sürüm / paket
- `BUILD_ID 96h10p48`, PWA `stars-v96h10p48`, `MP.8.9b47`, manifest, deterministik ZIP, `RELEASE-SAHA-ENTEGRE0.json`. mp-core p48 paket uyumu (p41–p47 kabul).
- Koruma: `tests/helpers/saha-entegre0-reviewed.{cjs,json}` (13 dosya, tam metin hunk'ları; p48 → p47 baytları birebir), `stripReviewedPerfSinir0` önce bunu çağırır.

## C. Kök nedenler

1. **15K filo kaybı (Issue #66):** `orbitForces()` içinde en az bir `ord` gemisi olan her filo `K.tf` (taşıyıcı) sayılır. p47 `invasionTick` TEMİZ İŞGAL dalı her `K.tf` filosunun **bütün** gemilerini siliyor ve garnizonu ordunun %60'ı yapıyordu; kayıt `reason:'rule'` ("Kara ordusu iner…"). Karma filoda (ordu + savaş gemileri) böylece filonun tamamı fetih anında yok oluyordu. Yeniden üretim: `tests/fixtures/96h9/seed11-month66-siege.save` + kontrollü fikstür (A3 karma, A4…A9); p47'de 10/11 vaka FAIL. Saha kayıt dosyası olmadığından **sahadaki özgün oturumun** bu yol olduğu kod yolu + fikstürle kanıtlandı, özgün dosyayla değil.
2. **PR #64 testi hiç geçemiyordu:** (a) `captureSystem` sarmalayıcısı silmeyi kaçırıyordu — eski silme `captureSystem`'den ÖNCE oluyordu; (b) sandbox'a verilmemiş `first` değişkeni → ReferenceError. Ölçüm `invasionTick` düzeyine taşındı; p47'de doğru assertion'la FAIL ("Conquest itself must not delete surviving assault transports"), adayda PASS.
3. **Fetih hedefi:** `WAR_FETIH_MAX=5` sert sınır, `warFetihCandidates` `.slice(0,12)` ve başkent dışlaması → tek sistemli isyancı devlete Fetih konulamıyordu; haritadan seçim yoktu.
4. **Yorgunluk görünmüyordu:** değer yalnız Diplomasi ekranında (`exhOf`); Aktif Savaşlar / Savaş Merkezi satırında yoktu.
5. **"Olaylar kapalı ama pencere geldi":** `CFG.randomEvents=false` yalnız hikâye olaylarını kapatır; bilim anomalileri `anom: rnd()<.42` ile galaksi üretiminde sabitti — ayrı mekanik.
6. **Misafir büyük armalar:** VIEW listesinde eylem yoktu (kapı engeli).
7. **Lojistik "yalnız renk":** tasarım seçili filo bekliyordu; boş durum göstergesi yoktu.
8. **Test altyapısı bulguları:** (a) X senaryosu kurulum zaman aşımı = manifest `build` ile `BUILD_ID` uyuşmazlığı (sürüm yükseltme sırasında); (b) SP S2 = ilk turda 420 ms sonra açılan DANIŞMAN penceresi dokunuşları yakalıyordu (ürün hatası değil; test danışmanı bekleyip kapatır); (c) misafirde aday listesinin ayna yeniden kurulumunda değişmesi — `View.claimPick` dünya kimliğine değil hedef devlete bağlandı.

## D. Test sonuçları

### Hedefli Node (aday p48 / kontrol p47 / kontrol PR #64)

| Test | p48 | p47 | PR #64 |
|---|---|---|---|
| `saha_entegre0_conquest_test.js` (A1–A11) | **11/0 PASS** | 1/10 | 11/0 |
| `saha_ordu_p0_test.cjs` (düzeltilmiş PR #64 testi) | **1/0 PASS** | FAIL (doğru assertion) | 1/0 |
| `saha_entegre0_claims_test.js` (B1–B8) | **8/0 PASS** | 1/7 | 1/7 |
| `saha_entegre0_events_test.js` (E1–E6, C1, F1) | **8/0 PASS** | 1/7 | 1/7 |
| `saha_entegre0_warhelp_test.js` (D1–D7) | **7/0 PASS** | 3/4 | 3/4 |
| `saha_entegre0_equivalence_test.js` (3 tohum × 48 ay) | **3/0 PASS** | — | kontrol kökü |

p47'de geçen vakalar: B6 (AI seçimi aynı — beklenen), E1 kısmı, D2/D3/D5 (motor `warJoin`'i VER tarafında zaten kabul ediyordu; eksik olan seçim / arayüz / MP kapısıydı).

### İlgili regresyon (Node, p48)
`beta_war_goals0_test` 13/0, `beta_war_goals0_mp_test` 5/0, `war_coalition0_test` 7/0, `war_coalition0_mp_test` 3/0, `mp_field_fix0_test` 3/0, `mp_deal_sys0_test` 9/0, `mp_waron0_test` 9/0, `field_war_siege0_test` 20/0 — hepsi PASS.
`faz96h9_invasion_test` 9/2: iki FAIL (96H.8 koruma baytları economy.js / ai.js) **p47'de aynen** var (`$SP/ctl47` kökünde 9/2) — bu fazdan bağımsız, eski FAIL.
Eski testlerde değişen iki sonda: `beta_war_goals0_mp_test` M1 ve `war_coalition0_test` C1 "başkent geçersiz" bekliyordu; yeni kuralla başkent geçerli olduğundan geçersiz seçim sondası "hedef devletin olmayan sistemi"ne çevrildi (beklenti gevşetilmedi; geçersiz seçim yine reddediliyor).

### Tam Node koşusu
`STARS_TEST_WORKERS=3 node tests/run-all.js` — p48: **238 paket, 6510 GEÇEN / 281 KALAN**; p47 (`git archive 8984b51` git dışı kopya): 233 / 6472 / 277. Paket paket karşılaştırma `evidence/saha-entegre0/full/KARSILASTIRMA.md`:
- 4 paket farkı p47 kopyasının git dışı olmasından (`beta_fed_found0_compat` p47 git worktree'sinde de 1/5; `beta_fed_fleet0_compat`, `beta_galaxy0`, `mp11_online` p47 worktree'sinde p48 ile aynı).
- **2 yeni FAIL PR #64'ün kural değişikliğinden** (PR #64 worktree'sinde de aynı): `faz92a_war_contribution` "Real invasion … before successful disband" (`army.ships.length===0` — eski kural: ordu fetihte tüketilir) ve `faz96h10_army_safety` negatif kontrolünün sabit beklenen listesi (ordu 237 sys5 düştüğü gün artık silinmediği için AI ona yeni hedef verir; asıl karşılaştırma 96H.9 ↔ 96H.10 emir eşitliği PASS). Özgün saha şikâyeti "fetih sonrası ~15K Taarruz Ordusu gücünün kaybolması" olduğundan iki test yeni kurala göre güncellendi (amaçları aynen denetlenir); sonra 32/2 ve 9/2 = p47 git worktree ile aynı eski FAIL'ler.
- Sonuç: adil karşılaştırmada **p48'in p47'ye göre yeni FAIL'i yok**; eski FAIL'ler silinmedi. Tam koşu yeniden yazdığı audit/navy dosyaları geri alındı.

### Gerçek Chromium
| Senaryo | Sonuç | Kontrol |
|---|---|---|
| `browser-saha-entegre0-sp.cjs` (844×390 dokunmatik; S1 anomali Kapalı, S2 haritadan 7 hedef + önizleme bedeli, S3 TÜMÜNÜ KENARA AL) | **3/0 PASS** | p47 0/3 |
| `MP8_SCEN=SE` host + misafir B (üretim relay + TLS + hat; H0–H6: büyük armalar, lojistik, yorgunluk %88, haritadan 7 hedef + 25 Etki bedeli, toplu kenara alma, Savaşa Yardım teklifi host'a) | **8/0 PASS** | — |
| `MP8_SCEN=X` (REINF-ROUTE.0 regresyonu) | **5/0 PASS** (son harita değişikliğinden sonra yeniden) | p47 5/0 |

Ekran görüntüleri: `evidence/saha-entegre0/mp8-SE/*.png`, `browser-sp/*.png`.

## E. Save8 / RNG

- `tests/saha_entegre0_equivalence_test.js`: kontrol = p47 + PR #64 sabit kopyası (`git archive 0d50abc`), aday = p48; tohum 11/22/404 × 48 ay, her 6 ayda Save8 SHA-256 + RNG durumu **birebir**; adayda her 6 ayda yeni salt okunur işlevler (`warCenterIndex`, `warHelpOptions`, `warFetihCandidates{capital}`, `warFetihClaimCost`, `warDeclarationPreview`) çağrıldı ve dünya değişmedi. **3/0 PASS.**
- Aynı vakalar p47 ile de koşuldu (BİLGİ): 48 ay boyunca aynı — bu tohumlarda AI'nın temiz işgalinde `K.tf` silinmesi tetiklenmedi. Faz A bilinçli davranış değişikliğidir; etkisi A1–A11 ile ölçüldü.
- E1: "normal" seçimi ve ayar yokluğu aynı Save8/RNG; E2: Kapalı'da yıldız/gezegen/hat ve RNG sırası aynı (yalnız `anom` bayrakları).
- Save8 v8, MP paketi 4, protokol 1 değişmedi. Yeni alanlar yalnız kullanıldığında: `cfg.anomalies` (normal dışı), `e.wg[...].targets` (mevcut alan; daha uzun liste ≤256).

## F. Multiplayer

- Host tek yetki: fetih hedefleri (`warGoalArgs` ≤256, `warGoalOptions` yeniden doğrulama), yardım teklifi (`offer` kapısı + `warHelpOptions` + `warSupportGate`), anomali lobi ayarı (`configure` + paket doğrulaması).
- Gizlilik: misafir yalnız gözlediği sahipliği (`mapOwners`) aday görür; rakip yorgunluğu istihbarat ≥3 olmadan gitmez (BİLİNMİYOR); `warSupportList dir:'offer'` salt okuma.
- Misafir VIEW: `wgMore`, `wgMap`, `claimDone`, `claimCancel`, `noteStashAll`, `bigEmblemsToggle`, `dealHelp`, `dealHelpPick`.
- Uyum: p48 paket yükleyicisi p41–p47 paketlerini kabul eder (`sameSaveFormat`).
- Beklenen `/mp/version` (yerel relay, bu dal): `{"mp":"MP.8.9b47","build":"96h10p48","runtime":"e2f2da5832fc", …}` (dosya özetleri: main.js `cefbf26ff5fd`, mp-core.js `8cb532e6829a`, relay.js `1d8b03a0ce65`, mp1-host.js `14a7140af9b0`, guest-stars.js `e8ce521be045`). Canlı Render: **NOT RUN** (değiştirilmedi).

## G. Performans

Motor (Node, gerçek gün adımları + ay sonu + AI turu), kontrol = p47 + PR #64 sabit kopyası, aday = p48, aynı tohum 11, JIT ısınması atılır, kollar sırayla değişerek 4 tekrar. Her tekrarın son dünyası iki kolda **aynı Save8** (`sameWorld:true`).

| Ölçek | Ay × tekrar | Kontrol medyan / p95 (ms/ay) | Aday medyan / p95 (ms/ay) | p95 farkı | Toplam farkı |
|---|---|---|---|---|---|
| 100 sistem (ULU) / 9 AI | 36 × 4 | 76,7 / 128,6 | 75,0 / 122,1 | −%5,0 | −%3,0 |
| 500 sistem / 16 AI | 12 × 4 | 183,3 / 223,1 | 190,4 / 228,4 | +%2,4 | +%2,4 |

Tekrarlar arası oynama ±%9 (aynı kolun dört tekrarı); iki ölçekte de fark gürültü bandında ve **%5 p95 sınırının altında**. Ek motor işi yalnız AI'nın aylık `warCenterIndex` çağrısında kendi açık cephesi için `warExhaustionForecast` (salt okunur). Ham veri `evidence/saha-entegre0/perf/*.json`, betik `perf/benchSE.cjs`.
Tarayıcı kare süresi (harita halkaları / lojistik ipucu yalnız o kiplerde çizilir) ve MP host maliyeti bu fazda **NOT RUN**.

## H. Paket

| Alan | Değer |
|---|---|
| ZIP | `releases/stars-faz96h10p48.zip` (20 girdi: 19 runtime + RELEASE-MANIFEST.json) |
| Bayt | 949191 |
| SHA-256 | `fd1d8a3896c700bd4b97d7f36e679ff5a76f541e46099e0418987437939858e3` |
| CRC32 (dosya) | `821959AC` |
| Manifest SHA-256 | `e2f2da5832fc…` (tam değer `RELEASE-SAHA-ENTEGRE0.json`) |
| Deterministik | İkinci `package-release.py` çıktısı bayt-bayt aynı (PASS) |
| Açılış | `unzip` + `zipfile.testzip()` hatasız; her girdinin CRC32'si doğrulandı (20/20) |
| Manifest doğrulaması | `verify-release.py --root <açılmış ZIP>`: "DOĞRULANDI: 19 dosya; oyun build 96h10p48" |

## I. Açık hatalar ve eksikler

1. **PR #64 kuralının AI'ya yansıması:** fetihten sağ çıkan ordu artık silinmediğinden AI onu yeniden kullanır (faz96h10 fikstüründe sys5 düştüğü gün yeni hedef). Garnizon yerel tabandan başlar, ordu yörüngedeyken aylık takviye verir. AI kampanya dengesi (kontrol / aday + plasebo bandı, 120 ay) **ölçülmedi**; 3 tohum × 48 ayda (orta, 6 AI) AI temiz işgali hiç tetiklenmediği için dünya p47 ile aynı kaldı.
2. **Saha kaydı yok:** 15K kaybının özgün oturumu dosyayla yeniden üretilmedi; kök neden kod yolu + kontrollü fikstürle kanıtlandı.
3. **Fetih anından ÖNCE yörünge muharebesinde tüm filonun sıfırlanması** (Issue #65 "ayrı P0 test konusu"): bu fazda ayrı yeniden üretilmedi. A10 yalnız kara savaşında savaş gemilerine dokunulmadığını kanıtlar.
4. **Talep kapasitesi** yalnız Etki bedeliyle ölçekleniyor; savaş ilerlemesi / barış kabulüyle ölçekleme (Issue #65 §1) yapılmadı. v2 Fetih barışı mevcut `warFetihSettle` kuralıyla (hedef dışı işgal iade) çalışır.
5. **AI çoklu talep:** AI hâlâ en çok 3 başkent dışı hedef seçer (bedel 0, Save8/RNG korunur). "Ekonomik ihtiyaca göre daha çok talep" yapılmadı; AI yeni bedelli talep yolunu kullanmıyor.
6. **Rastgele Hikâye Olayları zinciri (Issue #65 §3):** SP'de `faz95e1_random_event_switch_test` mevcut. MP lobisinde `randomEvents` için ayrı denetim yok (host'un CFG değeri `generate`'te varsayılanlardan gelir); host → G.cfg → misafir → kayıt zinciri MP'de **NOT RUN**. Bildirimlerin kaynak türüne göre etiketlenmesi yapılmadı.
7. **Rakip yorgunluğu tahmini:** istihbarat yokken son zorunlu barıştan türetilen tahmin "tahmin" etiketiyle gösteriliyor; Issue #65 metni bu durumda düz "Bilinmiyor" istiyor. Karar kullanıcıya.
8. **İsteğe bağlı UX:** ⚔ düğmesinde "en yüksek kendi yorgunluğu" özeti ve mobil kenar kaydırmasıyla toplu gizleme yapılmadı.
9. **Görünüm:** yeni arayüz Chromium'da 844×390'da sınandı; 800×360 bu fazda **NOT RUN**. Fiziksel Android **NOT RUN**. Canlı Render **NOT RUN**.
10. **Eski FAIL'ler:** tam Node koşusunun eski FAIL'leri p47 ile karşılaştırıldı (D bölümü); silinmedi.
11. **İkinci teslimat (H–K)** — zincirleme ticaret limanları, transit izni, fiziksel teslimat, AI ticaret/strateji ve federasyon çeşitliliği: **BAŞLANMADI**; oynanabilir sürüme yarım iş karıştırılmadı.

## J. Sonraki çalışma

1. Kullanıcı kabulü: p48'i iki telefonla (host + misafir) Render'da oynatıp 15K vakasını, haritadan fetih seçimini ve yorgunluk çubuğunu doğrulamak (Render dalı `claude/stars-saha-entegre0`).
2. PR #64 kuralının AI kampanya dengesine etkisi (I.1): p47 ↔ p48 aynı Save'den 120 ay kontrol / aday + tek RNG çekimli plasebo bandı (`research/96h8/scripts/arm.js`), fetih sayısı / ordu yeniden kullanımı / garnizon düşüşleri.
3. Yörünge muharebesinde tüm filonun sıfırlanması (I.3) için ayrı P0 fikstürü.
4. MP `randomEvents` lobi zinciri + bildirim kaynak etiketleri (I.6).
5. İkinci teslimat H–K (ticaret limanları zinciri, transit izni, fiziksel teslimat, AI ticaret/strateji) ve federasyon çeşitliliği araştırması.

---

## Karar tablosu

| İş | Durum |
|---|---|
| A — Fetih anında filo kaybı (kod + 11 vaka + garnizon) | TAMAMLANDI VE TEST EDİLDİ (saha kaydıyla değil, fikstürle) |
| A — PR #64 test düzeltmesi | TAMAMLANDI VE TEST EDİLDİ |
| A — Yörünge muharebesinde tüm filo sıfırlanması | BAŞLANMADI |
| A — PR #64 kuralının AI kampanya dengesine etkisi | ARAŞTIRILDI (2 eski test güncellendi; kampanya ölçümü yok) |
| B — 5/12 sınırı kalktı + Etki bedeli + başkent + İsyanı Bastır | TAMAMLANDI VE TEST EDİLDİ |
| B — HARİTADAN HEDEF SEÇ (SP + MP misafir, gerçek dokunuş) | TAMAMLANDI VE TEST EDİLDİ |
| B — Kapasitenin savaş ilerlemesi / barışla ölçeklenmesi | BAŞLANMADI |
| B — AI'nın yeni talep sistemini kullanması | ARAŞTIRILDI (AI eski seçimde; bilinçli olarak değiştirilmedi) |
| C — Savaş Merkezi yorgunluğu (host + misafir) | TAMAMLANDI VE TEST EDİLDİ |
| C — ⚔ düğmesinde yorgunluk özeti | BAŞLANMADI (isteğe bağlı) |
| D — Savaşa Yardım Teklif Et (SP + MP + AI yanıtı) | TAMAMLANDI VE TEST EDİLDİ |
| E — BİLİM ANOMALİLERİ (SP kurulum, MP lobi, 500 sistem oranları) | TAMAMLANDI VE TEST EDİLDİ |
| E — Rastgele Hikâye Olayları MP zinciri / kaynak etiketi | ARAŞTIRILDI |
| F — TÜMÜNÜ KENARA AL | TAMAMLANDI VE TEST EDİLDİ |
| G — Misafir büyük armalar + seçimsiz lojistik | TAMAMLANDI VE TEST EDİLDİ |
| Save8 / RNG eşdeğerliği | TAMAMLANDI VE TEST EDİLDİ |
| Performans 100 / 500 sistem | TAMAMLANDI VE TEST EDİLDİ (motor; tarayıcı kare süresi NOT RUN) |
| Paket (ZIP, SHA-256, CRC32, manifest) | TAMAMLANDI VE TEST EDİLDİ |
| Fiziksel Android / canlı Render | NOT RUN |
| H–K ticaret / transit / teslimat / AI ticaret, federasyon çeşitliliği | BAŞLANMADI |

## 14 soru

1. **15K kaybı çözüldü mü?** Kod yolu çözüldü ve test edildi: fetih anında karma filo / ordu silinmiyor (A1–A11 p48 PASS, p47 10 FAIL). Özgün saha kaydı olmadığından sahadaki oturum dosyayla yeniden üretilmedi; yörünge muharebesinde tüm filonun yok olması ayrı vaka olarak açık.
2. **Garnizon dengeli mi?** Evet: fetih anında yerel taban (`garrisonOf`, ≥10), ordu yörüngede kalır ve ay sonu takviyesiyle destekler; aynı ordu iki kez sayılmaz, iki ay sonra gezegen savunmasız değil (A11).
3. **Talep sınırı / tek sistemli devlet?** 5 hedef sınırı bedelsiz eşik oldu, sonrası artan Etki; 12 aday sınırı kalktı; başkent +60 Etki ile hedeflenebilir; tek sistemli devlet hedeflenebilir; koptuğu devlete karşı İsyanı Bastır bedelsiz (B1–B5).
4. **Haritadan talep?** Evet: HARİTADAN HEDEF SEÇ; SP'de 7 sistem gerçek dokunuşla (S2), MP misafirde 7 sistem + host önizlemesinde 25 Etki bedeli (H4).
5. **Yorgunluk görünüyor mu?** Evet: ⚔ → Savaş Merkezi, kendi yüzde + çubuk + %85 uyarısı + %100 kuralı; rakip yalnız istihbarat ≥3 ile (C1, H3 misafirde host değeri %88).
6. **Savaşa yardım gerçek müzakere mi?** Evet: aynı `dealQuote` / `executeDeal` / `aiRespond`; karşılık istenebilir, kabul tek işlem, savaş bitince geçersiz; MP'de misafir teklifi host'a gider (D1–D7, H6). AI yardım teklif eder (mevcut destek fırsatı) ve gelen teklife kabul / ret / karşı teklif döner.
7. **Anomali denetimi?** Evet: Kapalı/Seyrek/Az/Normal/Yoğun; Normal p47 ile Save8/RNG aynı; Kapalı'da normal anomali ve karar penceresi yok; 500 sistemde Seyrek %10,2, Normal %41,2, Yoğun %58,6 (E1–E6, S1).
8. **Tümünü kenara al?** Evet: karar / ödül / ret yok, kayıtlar ☰ ve Gelen kutusunda (F1, S3, H5).
9. **MP misafir arma / lojistik?** Evet: misafirde Büyük armalar açılıyor (H1); filo seçili değilken ikmal limanları + ipucu host ve misafirde (H2).
10. **Ticaret reformu bu teslimatta mı?** Hayır. H–K BAŞLANMADI; yarım iş oynanabilir sürüme karıştırılmadı.
11. **AI yeni mekanikleri kullanıyor mu?** Kısmen: fetihten sağ çıkan ordusunu yeniden kullanır (PR #64 kuralı; kampanya etkisi ölçülmedi); AI yardım teklifi verir/yanıtlar (mevcut yol), anomali ayarı AI'ya da aynı galaksiyi verir. AI yeni bedelli fetih talebini **kullanmıyor** (en çok 3 hedef, bedel 0) — Save8/RNG eşdeğerliği için bilinçli.
12. **En son güvenli oynanabilir dal?** `claude/stars-saha-entegre0` (p48 / MP.8.9b47) — Node hedefli + regresyon, eşdeğerlik, SP ve MP Chromium testleri geçti; fiziksel Android ve Render kabulü yok. Kullanıcı kabulüne kadar önceki güvenli taban p47 (`codex/stars-mp-rakip-doktrinler0`).
13. **Render dalı?** `claude/stars-saha-entegre0`. Beklenen `/mp/version`: `MP.8.9b47` / `96h10p48` / runtime `e2f2da5832fc`.
14. **Sonraki oturumun ilk işi?** Render'da p48 ile iki cihazlı kabul (15K fetih + haritadan talep + yorgunluk) ve ardından yörünge muharebesi filo sıfırlanması P0 fikstürü; sonra ikinci teslimat (H–K).
