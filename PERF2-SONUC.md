# STARS — PERF.2: host AI performansı (aynı kararlar, daha az hesap)

**Durum:** geliştirme sürümü.
- Taban: MP.7.5 `8fa8203` (PR #29).
- Build `96h10p5`, PWA `stars-v96h10p5`, Save8 (şema değişmedi).
- ZIP: `releases/stars-faz96h10p5.zip` (`RELEASE-PERF2.json`).
- Değişen runtime: `ai.js`, `main.js` (+ BUILD_ID), `sw.js` (yalnız önbellek adı).

**Davranış değişmedi.** AI kararları, RNG tüketim sırası ve Save8 baytları kontrolle ay ay birebir. Yeni mekanik yok. AI'nın düşünme aralığı, inşa miktarı, ekonomi hesabının kapsamı, diplomasi ve devlet sayısı aynı.

## 1. Ölçüm (P0)

**Koşullar:**
- Kontrol kökü: `8fa8203`'ün sabit kopyası (`git worktree`; bağ değil).
- Kayıtlar kontrol kökünden üretildi: `research/perf1/scripts/gen-saves.cjs`.
  - A = orta, 6 AI devleti;
  - B = büyük, 9 AI devleti.
  - Tohumlar 11 ve 404; 60 / 120 / 180 / 240. ay.
- **Neden 6 / 9:** MP'de misafir bir AI devletini alır. Node tek oyunculu ölçümde bu devlet AI olarak oynar; MP ölçümünde (1 misafir) galaksi = **2 insan + 5 AI** / **2 insan + 8 AI**.
- Node v22, 4 çekirdek.

**CPU profili** (`research/perf1/scripts/profile.cjs`, kontrol; ham: `research/perf2/results/prof-*.json`). Yük üç galakside de aynı zincirde:

| Kayıt | ms/ay | `aiBuildingDelta` → `empireIncome` (kapsayıcı) | `fleetSupply` / `supplyDistance` | `txCaptureGraph` (kendi) |
|---|---|---|---|---|
| büyük s11, 240. ay | 866 | %43 / %41 | — | %7 |
| büyük s404, 240. ay | 691 | %31 / %30 | %10 / %9 | %13 |
| büyük s404, 120. ay | 922 | %21 / %24 | %25 / %23 | %6 |
| orta s404, 240. ay | 458 | %49 / %47 | %5 | — |

**Kategori dökümü** (`research/perf2/scripts/breakdown.cjs`, 30 gerçek ay; kapsayıcı süreler; ham: `research/perf2/results/breakdown.jsonl`).

Büyük s11, 240. ay, kontrol:

| İşlev | Çağrı | Toplam ms | Ortalama | Medyan | p95 | En uzun |
|---|---|---|---|---|---|---|
| `monthTick` | 30 | 16 744 | 558 | 544 | 718 | 772 |
| `aiTurn` | 330 | 12 222 | 37,0 | 17,2 | 109,5 | 150 |
| `aiBuildingDelta` | 28 128 | 12 349 | 0,44 | 0,42 | 0,77 | 12,9 |
| `empireIncome` | 51 668 | 11 836 | 0,23 | 0,24 | 0,46 | 12,4 |
| `aiEconomyPlan` | 6 516 | 9 566 | 1,47 | 1,34 | 3,69 | 15,8 |
| `tradeInfo` | 51 668 | 6 098 | 0,12 | 0,15 | 0,29 | 7,7 |
| `aiEconomicOrder` (bina seçimi) | 1 985 | 5 584 | 2,81 | 2,60 | 5,77 | 10,8 |
| `diploTick` (diplomasi) | 30 | 2 908 | 96,9 | 98,7 | 139 | 152 |
| `aiDemolitionChoice` | 550 | 2 540 | 4,62 | 4,78 | 8,22 | 13,5 |
| `aiStrategicBuildingNeeds` | 1 446 | 2 497 | 1,73 | 1,69 | 3,87 | 15,8 |
| `dailyTick` | 1 800 | 2 346 | 1,30 | 0,80 | 4,29 | 14,8 |
| `autoExploreTick` (keşif) | 2 070 | 1 339 | 0,65 | 0,43 | 1,87 | 5,0 |
| `aiColonyForecast` (koloni) | 481 | 889 | 1,85 | 1,64 | 3,44 | 7,8 |
| `dealTxBegin` (anlaşma anlık görüntüsü) | 13 | 800 | 61,5 | 55,6 | 95,0 | 95 |
| `fleetSupply` | 951 720 | 766 | ~0 | ~0 | ~0 | 2,1 |
| `economyTick` (gelir) | 30 | 527 | 17,6 | 17,0 | 21,9 | 24,5 |
| `tradeFlowTick` (ticaret/lojistik) | 30 | 452 | 15,1 | 2,3 | 71,2 | 93,7 |
| `queueBuilding` / `aiMove` / `colonizeTargets` | — | < 130 | — | — | — | — |

**Gereksiz tekrar:**
- `aiEconomyPlan` aynı gün aynı devlet için ortalama 24 kez (275 devlet-gün anahtarında 6516 çağrı; en çok 49).
- Federasyon üyesinde (geç oyunda çoğunluk) her bina adayı `aiBuildingDelta` içinde iki tam gelir hesabı yapar:
  - **eski gelir:** `empireIncome({...e})`. Aday ne olursa olsun aynıdır. 2 ayda 1345 çağrı, yalnız ~350 farklı pencere.
  - **yeni gelir:** `empireIncome({...e,_trCache:null})`. Ticaret ağını her seferinde baştan kurar. Oysa liman sayısı değişmeyen adayda ticaret ağının bütün girdileri (liman sayısı, rota hacmi, nüfus, sahiplik, savaş, anlaşma, konvoylar) aynıdır.
- Tam `aiBuildingDelta` sonucunun tekrarı küçük: %2–13. Bu yüzden saklanmadı.

**MP yayını:**
- 1 misafir, 30 ay: yayın günde ~11 ms (ayda ~330 ms, 30 yayın); iki kolda aynı.
- Ay adımındaki duraklamanın kaynağı değil. Ucuz olduğu için dokunulmadı (§4).

## 2. Adaylar

| # | Dosya | Değişiklik | Sonuç |
|---|---|---|---|
| A | `ai.js` | **Okuma-yalnız AI değerlendirme penceresi.** `aiEconomyPlan`, `aiEconomicOrder`, `aiDemolitionChoice`, `aiStrategicBuildingNeeds`, `aiColonyForecast`, `aiRecoveryInvestment`'ın en dış çağrısı bir pencere açar. Pencerede: (1) devletin gölge "eski" geliri bir kez hesaplanır, çağırana kopyası verilir; (2) liman sayısı değişmeyen gölgenin taze ticaret sonucu bir kez hesaplanır ve sonraki gölgelere aynı gün imzasıyla verilir. Pencere kapanınca (hata olsa da) her şey atılır. | **Kabul** |
| B | `main.js` | `supplyDistance` her çağrıda bütün galaksiyi tarayıp geçit listesi kuruyordu (`gateSupplyNodes`). Listenin üyeliği tam olarak `hasUsableGate` (saf) olduğundan aynı iki denetim (bulunulan sistem, komşular) doğrudan yapılır. | **Kabul** (küçük) |
| C | `diplomacy.js` | `txCaptureGraph`: anahtar başına `getOwnPropertyDescriptor` yerine tek `Object.getOwnPropertyDescriptors`. Kayıtlar birebir aynı (13 178 nesne). | **Reddedildi:** %20–30 daha yavaş (64 → 78 ms, 54 → 70 ms). Uygulanmadı. |
| — | `ai.js` | Pencere içinde tam `aiBuildingDelta` sonucunu saklamak | Uygulanmadı: tekrar oranı %2–13 |
| — | `ai.js` / `main.js` | Pencere içinde `fleetSupply` saklamak | Uygulanmadı: pencere içi payı ~%5–7. Dosyalar arası ek bağımlılık getirirdi. |

**Pencerenin güvenliği:**
- **Pencere işlevleri yalnız okur.** Değişiklikler yalnız eşzamanlı geri yüklenen gölge kolonilerde olur. AI tanı notları geliri etkilemez. `recalcMods` yalnız gölgeye yazar.
- **Pencere bitince her şey atılır.** AI bir kararı uyguladığında (`queueBuilding`, `aiMove`…) pencere çoktan kapanmıştır.
- **Geçici gezegen / koloni değişimi sürerken** saklanan değer okunmaz ve yazılmaz. Gölge gelir, değişimden önce hesaplanır.
- **Liman değişen adayın** ticaret sonucu saklanmaz.
- **Gelir hesabındaki önbellekler** (`G._structAt`, devlet `_press`) gün anahtarlıdır. Atlanan çağrı her zaman aynı pencerede aynı gün yapılmış bir çağrıyı tekrar ederdi.
- Save8'e girmez, RNG kullanmaz. Pencere dışında `aiShadowIncome` her seferinde hesaplar (eski davranış).

## 3. Sonuç — ay adımı (tek süreç, sırayla; 1 ay ısınma + 30 gerçek ay)

Ham: `research/perf2/results/timing.jsonl`. Her satırda dört kolun son Save8 SHA-256'sı ve RNG durumu aynı.

| Kayıt | Kontrol medyan / p95 / en uzun (ms) | A | B | **A+B** | Medyan | p95 |
|---|---|---|---|---|---|---|
| büyük s11, 240 | 658 / 765 / 833 | 457 / 534 / 610 | 662 / 795 / 860 | **456 / 572 / 605** | **−31%** | −25% |
| büyük s404, 240 | 561 / 708 / 823 | 442 / 556 / 767 | 516 / 650 / 766 | **424 / 576 / 676** | **−24%** | −19% |
| büyük s11, 120 | 441 / 570 / 583 | 356 / 443 / 451 | 452 / 532 / 598 | **350 / 405 / 443** | **−21%** | −29% |
| büyük s404, 120 | 516 / 655 / 695 | 431 / 520 / 685 | 446 / 583 / 595 | **378 / 481 / 604** | **−27%** | −27% |
| büyük s11, 60 | 357 / 494 / 630 | 318 / 488 / 579 | 313 / 473 / 650 | **304 / 494 / 536** | −15% | 0% |
| büyük s404, 60 | 353 / 446 / 448 | 332 / 449 / 463 | 335 / 488 / 571 | **298 / 436 / 446** | −16% | −2% |
| orta s11, 240 | 366 / 502 / 508 | 342 / 458 / 471 | 342 / 475 / 503 | **330 / 440 / 451** | −10% | −12% |
| orta s404, 240 | 312 / 408 / 418 | 236 / 290 / 292 | 295 / 350 / 376 | **205 / 277 / 285** | −34% | −32% |
| orta s11, 120 | 165 / 231 / 233 | 153 / 207 / 207 | 156 / 201 / 219 | **165 / 231 / 312** | 0% | 0% |
| orta s404, 120 | 293 / 375 / 381 | 254 / 330 / 350 | 264 / 295 / 301 | **253 / 360 / 362** | −14% | −4% |
| orta s11, 60 | 164 / 278 / 300 | 151 / 229 / 236 | 149 / 206 / 221 | **148 / 191 / 207** | −10% | −31% |
| orta s404, 60 | 263 / 312 / 329 | 220 / 272 / 297 | 226 / 256 / 286 | **211 / 234 / 249** | −20% | −25% |

**Okuma:**
- **Hedef (büyük galaksi, geç oyun):** ay adımı medyanı −21… −31%, p95 −19… −29%. Erken oyunda (60. ay) kazanç küçük: federasyonlar henüz azdır.
- **Federasyonsuz galaksi** (orta s11): kazanç yok, ama yavaşlama da yok. 120. ayda A+B'nin "en uzun" değeri 312 ms; kontrol 233 ms, medyan ve p95 aynı. Bu tek aylık bir gürültü sıçramasıdır. A ve B ayrı ayrı ölçüldüğünde ikisi de kontrolden düşük.
- **Ölçüm sınırı:** tek koşu, Node, masaüstü çekirdeği. Telefon değeri değildir.

**Sıcak işlevler** (30 ay, büyük s11 240 → aday):
- `empireIncome` çağrısı 51 668 → 30 953; süre 11 836 → 5 774 ms.
- `tradeInfo` 6 098 → 2 086 ms.
- `aiTurn` toplamı 12 222 → 6 840 ms; p95 109,5 → 57,8 ms; en uzun 150 → 88,5 ms.
- `monthTick` p95 718 → 449 ms.

Karar işlevlerinin çağrı sayısı iki kolda aynı: `aiBuildingDelta` 28 128, `aiEconomyPlan` 6 516, `aiTurn` 330, `queueBuilding` 2 381, `colonizeTargets` 2 529.

**Bellek:** GC sonrası yığın 21,2 MB, iki kolda aynı (6 ay). Pencere her kapanışta boşalır.

## 4. Multiplayer host

`research/perf1/scripts/mp-host.cjs`: gerçek `mp-core` + ayna; 1 misafir; her oyun günü yayın; 30 ay. Ham: `research/perf2/results/mp-*.json`.

| Kayıt | Simülasyon / ay p50 | p95 | Yayın / ay p50 | p95 | Giden baytlar | Host Save8 + RNG |
|---|---|---|---|---|---|---|
| büyük s11, 240 | 713 → **434** | 939 → **551** | 338 → 302 | 373 → 355 | ay ay aynı | aynı |
| büyük s404, 120 | 529 → **415** | 679 → **594** | 334 → 317 | 389 → 355 | ay ay aynı | aynı |

- **AI ve yayın süreleri ayrı raporlandı.** Yayın değiştirilmedi; aradaki küçük fark ölçüm gürültüsüdür.
- **Yayın ayın her gününe dağılır** (günde ~11 ms). Kasma aylık AI turundan gelir.
- **Komut gecikmesi:** 10–12 ms, iki kolda aynı.
- **Misafir:** `deserialize`'a dokunulmadı; MP.7.5 kazanımları yerinde. Misafir simülasyon yürütmez.

## 5. Eşdeğerlik kanıtı

- **Ay ay iz:** 4 kayıtta 6 ay; her ayın Save8 SHA-256'sı ve RNG durumu aynı (A ve A+B).
- **30 aylık zamanlama koşuları:** 12 kayıt × 4 kol; son Save8 ve RNG aynı.
- **Yeni oyundan 240 ay:** orta / büyük × seed 11 / 404. Aday kökten üretilen 16 kontrol noktası kaydı kontrolün kayıtlarıyla **bayt-bayt aynı** (`research/perf2/results/gen-saves-equivalence.txt`).
- **Uzun koşu:** büyük s11, 240 → 360. ay (120 ay). Son Save8 ve RNG aynı. Ay adımı p95 1913 → 1403 ms.
- **MP host:** 1 misafirle 30 ay; host Save8 ve RNG aynı, giden bayt dizisi aynı.
- **`tests/perf2_equivalence_test.js`** (5 vaka). Kaynak: orta s404, 60. ay kaydı; 4 federasyon üyesi.
  1. Arındırılmış kaynaklar 96h10p4'ün ai.js / main.js baytlarıdır.
  2. Kontrol ve aday 3 ay: her ay Save8 ve RNG aynı. Karar çağrıları aynı, `empireIncome` < %80.
  3. Pencere dışında saklama yok. İçeride bir kez hesap, kopya döner, hata olsa da kapanır.
  4. Pencere içi `aiBuildingDelta` = pencere kapalıyken. Federasyon üyeleri × koloniler × 5 bina × kuyruklu / kuyruksuz; liman adayı saklanmaz.
  5. `supplyDistance` = eski liste formülü: her filo, her sistem, geçit eklenince de.
- **Koruma:** `tests/helpers/perf2-preservation.js` (`stripReviewedP2(ad, kaynak)`) ai.js / main.js bloklarını tam metinle geri alır.
  - ai.js zincirinin en başında: faz96h8 / 96h9 / 96h10 / 96h71 / 96h31.
  - Hash gevşetilmedi.

## 6. Kalan maliyet (sonraki faz adayı)

- `aiEconomyPlan` hâlâ devlet-gün başına ~24 kez kuruluyor (pencereler arasında AI karar uyguluyor). Bunun için bağımlılık anahtarı gerekir: kuyruklar, stok, sözleşmeler, savaş.
- `txCaptureGraph`: anlaşma başına ~55–60 ms tam dünya anlık görüntüsü. Ayda 0–3 kez olur; tekil en uzun kalem.
- Günlük `autoExploreTick` / `explorationContext`.

## 7. Tarayıcı (Chromium)

**Aynı Save8, aynı adımlar, gerçek Chromium V8'i** (`research/perf2/scripts/browser-months.cjs`).
- Sayfa: kökün `index.html`'i; tek oyunculu motor ve arayüz yüklü.
- 1 ay ısınma + 30 ay; deterministik adım döngüsü.
- Ham: `research/perf2/results/bmonths.jsonl`.
- Dört satırda da iki kolun son Save8 ve RNG'si aynı; sayfa hatası 0.

| Kayıt (büyük, 9 AI) | Ay adımı medyan / p95 / en uzun (ms) | `monthTick` medyan / p95 | Ay başına AI turu medyan / p95 |
|---|---|---|---|
| s11, 240 | 310 / 401 / 409 → **252 / 307 / 344** | 254 / 329 → **176 / 220** | 186 / 253 → **117 / 168** |
| s404, 240 | 254 / 355 / 367 → **210 / 274 / 279** | 186 / 252 → **141 / 188** | 120 / 173 → **84 / 127** |
| s11, 120 | 203 / 248 / 294 → **171 / 218 / 242** | 155 / 194 → **107 / 156** | 107 / 133 → **71 / 109** |
| s404, 120 | 217 / 335 / 393 → **184 / 281 / 311** | 145 / 230 → **113 / 165** | 101 / 167 → **72 / 119** |

Değişim:
- `monthTick` medyanı **−22… −31%**, p95 **−19… −33%**.
- Aylık AI turu **−30… −37%**.
- Ay adımının tamamında (günlük adımlar dahil) medyan **−16… −19%**.

`monthTick` tek eşzamanlı çağrıdır: ay geçişindeki takılmanın kendisi.

**Host + misafir, üretim relay + TLS vekili** (`tests/browser-mp75-perf.cjs`).
- Kurulum: büyük, 2 insan + 8 AI, misafirde diplomasi paneli açık.
- Koşular: 60 / 120 / 240. ay, 3 aylık pencere, seed 404 ve 11; 30 aylık pencere seed 404.
- **İşlevsel sonuç:** tüm koşular PASS, sayfa hatası yok.
  - Misafirde panel baştan yazılması 0; yüzey taşıma çalışıyor (MP.7.5 kazanımı yerinde).
  - Misafir kurulum p95 ≤ 25 ms.
- **Karşılaştırma sınırı:** ölçüm penceresi gerçek zamanlıdır.
  - Akıllı duraklatma ve oyun olayları iki kolda farklı anlarda devreye girer.
  - 30 aylık pencerede aday kolun 60. ay penceresi gerçek zamanda çok daha uzun sürdü: yayın sayısı 382 → 846 / 777 (iki koşu), misafir kurulumu 168 → 837 / 735.
  - Aynı yavaşlama kontrol kolunda da başka pencerelerde görüldü: 30 aylık s404 120. ay 884 yayın; 3 aylık s11 120. ay 72 yayın (aday 37).
  - Yani yavaşlama kola bağlı değil. Gerçek zamanlı adım (değişken `dt`) oyunu ayrıştırıyor ve o penceredeki karar olayı ortak hızı 1×'e sınırlıyor.
  - Bu koşularda host ay adımı **karşılaştırılamaz**.
  - 3 aylık pencerede de durum aynı. Örnek: s11 240. ay 188 → 43 ms; bu, kazanç olarak sunulmadı.
  - Ham: `research/perf2/results/chromium-w3.txt`, `chromium-w30*.txt`.

Masaüstü Chromium, `--disable-gpu`; telefon değeri değildir.

## 8. Regresyon ve dağıtım

Regresyon: `research/perf2/REGRESYON.md`.

Dağıtım yapılmadı. Canlı Render ve fiziksel Android **NOT RUN**.
