# STARS — PERF.1: geç oyun performansı (aynı oyun, daha hızlı)

**Durum:** oyun yayını `96h10p1` (`releases/stars-faz96h10p1.zip`), PWA önbelleği `stars-v96h10p1`, Save8.

**Ne değişti:** davranış değişmedi; yalnız gereksiz tekrar hesaplar kalktı.
- Kontrol (MP.6.4 `eb4bd68`) ve aday aynı Save8'den aynı adımlarla koşuldu.
- Her ay Save8 baytları ve RNG durumu birebir aynı.
- Yeni oyundan 240 ay: 4 tohum × 4 kontrol noktası = 16 kayıt dosyası bayt-bayt aynı.

**Taban:** MP.6.4 dalı `claude/stars-mp64-espionage-market` (`eb4bd68`, PR #22). PR #17 → #22 zinciri açık; hiçbiri merge edilmedi.

## 1. Kök neden (doğrulandı)

Ölçüm koşulları: seed 22, ULU (100 sistem), 11 AI, 180. ay kaydı, 3 ay, kontrol.

`aiTurn` 10,9 s sürüyor. Sıcak zincir:

`aiEconomyPlan` → `aiBuildingDelta` → `empireIncome` → `tradeInfo` → `tradeLinks` → `findPath` (268 251 çağrı, 6,6 s)

**Neden tekrar ediyordu:**
- Federasyon üyesi (geç oyunda çoğunluk) her bina adayı için iki gölge gelir hesaplar: `{...e}` ve `{...e, _trCache:null}`.
- Gölge kopyanın ticaret önbelleği gerçek devlete yazılmaz.
- `aiBuildingSustainable` planı verilmezse `aiEconomyPlan`'ı yeniden kurar.
- Sonuç: her adayda tüm ticaret ağı ve her liman çifti için O(n²) Dijkstra baştan hesaplanıyordu.

**Yol sonucunun bağımlılıkları:** `findPath(start, l)` yolcusuz, kapısız ve geçiş kuralsız çağrılır. Sonucu yalnız şunlara bağlıdır:
- şerit grafiği (yalnız `setupGame`'de kurulur, kayıttan gelir);
- sabit sistem konumları;
- radyasyon kümesi (yalnız `true` olur).

Yolcusuz `findPath`'i çağıran tek yer `tradeLinks`.

## 2. Yapılan değişiklikler

Her biri ayrı ölçüldü.

| # | Dosya | Değişiklik | Geçersizleşme |
|---|---|---|---|
| A | economy.js | `tradePathMemo` / `TRADE_PATHS`: yönlü (start → l) yol sonucu saklanır | Dünya (`G.sys` kimliği), herhangi bir sistemin şerit dizisi kimliği/uzunluğu ya da radyasyon kümesi değişince sıfırlanır (her `tradeLinks` çağrısında O(n) denetim) |
| B | economic-ledger.js | `stock` / `snapshot` döngüyle, `observe`'un değişim denetimi `changedSince`: aynı değerler, aynı anahtar sırası, aynı `clean()`, aynı `!==` karşılaştırması; ara dizi/nesne yok | Yok (saf ifade eşdeğeri) |
| C | economy.js | `tradeHubBfs`: `tradeLinks`'in 3 sıçramalık taramasının ziyaret sırası ve ilk ebeveyni başlangıç limanı başına bir kez çıkarılır. Savaş kesintisi `bl` her çağrıda özgün ifadeyle (`cur.bl \|\| (o>=0 && o!==e.id && e.war[o])`) aynı sırayla hesaplanır | A ile aynı |

**Dokunulmayanlar:**
- AI stratejisi, bina ağırlıkları, doktrinler, gemi üretimi, saldırganlık, karar sırası, maliyet ve üretim formülleri;
- `findPath`'in kendisi ve filo yol bulma (yolcu / kapı / geçiş kuralı olan çağrılar);
- Save8 şeması.

**Önbellek ve Save8:** önbellek Save8'e girmez ve RNG kullanmaz. Dönen rota yalnız `concat` ile kopyalanır. `e.trade` / `e._trCache` Save8'e girdiği için bağlantı sırası ve değer türleri (`bl`: `undefined` / `false` / `true`) korundu; bayt eşitliği bunu kanıtlar.

**Bellek:** 240. ayda 184 rota ve 51 tarama ağacı; GC sonrası yığın 24,4 → 24,5 MB.

**Denenip uygulanmayan:** `aiEconomyPlan` / gölge `empireIncome` sonuçlarının tur içinde saklanması. Bağımlılık anahtarı eksiksiz kurulamadığı için PERF.2'ye bırakıldı.

## 3. Ölçümler

**Yöntem:**
- Tek süreç, sırayla; aynı kayıt; 1 ay ısınma + 6 ay; 2 tekrar (kol sırası dönüşümlü).
- Node v22, 4 çekirdekli konteyner.
- Ham veri: `research/perf1/results/`.

### Simülasyon ms/ay (medyan)

| Kayıt | Kontrol | A | A+B | A+B+C (PERF.1) | Değişim |
|---|---|---|---|---|---|
| s22 120. ay | 1377 | 1325 | 1047 | **1006** | −27% |
| s22 180. ay | 2999 | 1853 | 1578 | **1331** | −56% |
| s22 240. ay | 5430 | 2715 | 2316 | **2106** | −61% |
| s11 180. ay | 2148 | — | — | **1104** | −49% |
| s404 180. ay | 3408 | — | — | **1659** | −51% |
| s42 180. ay | 5146 | — | — | **2189** | −57% |

p95 değerleri (s22): 120. ay 1825 → 1313, 180. ay 4588 → 1992, 240. ay 7038 → 2546.

### Sıcak işlevler (s22, 3 ay toplamı, ms; sayaç kipi ayrı koşu)

| Ay | aiTurn | aiBuildingDelta | empireIncome | tradeLinks | findPath çağrısı |
|---|---|---|---|---|---|
| 120 | 2041 → 1585 | 1313 → 1008 | 1503 → 1105 | 560 → 99 | 20 344 → 101 |
| 180 | 10 912 → 3300 | 9923 → 2568 | 10 307 → 2637 | 8169 → 816 | 268 251 → 25 |
| 240 | 16 572 → 6050 | 16 933 → 5492 | 17 322 → 5463 | 13 357 → 1505 | 488 244 → 87 |

Çağrı sayıları iki kolda aynı (`aiBuildingDelta`, `empireIncome`, `tradeLinks`): kararlar aynı, yalnız iş azaldı.

**Kalan maliyet:** PERF.1 sonrası 180. ay CPU profilinde kalan en ağır kalemler:
- `tradeLinks` kendi süresi %12,7;
- tedarik mesafesi (`supplyDistance` / `gateSupplyNodes`) ~%11;
- `empireIncome` kendi süresi %5.

## 4. Multiplayer

**Host:** gerçek mp-core + ayna, Node vm. s22 kaydı host dünyası; misafirler AI devletlerini alır ve STARS arayüz kipindedir; her oyun günü yayın, `mirrorMs=0`.

Simülasyon ms/ay (yayın hariç):

| | 0 misafir | 1 | 2 | 3 |
|---|---|---|---|---|
| 180. ay kontrol → PERF.1 | 3198 → 1342 | 3367 → 1533 | 2785 → 1122 | 3868 → 1379 |
| 240. ay kontrol → PERF.1 | 5804 → 2010 | 6109 → 2178 | 2150 → 1176 | 1853 → 1202 |

- 240. ayda 2–3 misafirle kontrol de düşüktür: insan devletleri AI turu yürütmez.
- Yayın (viewFor + ayna + fark): misafir başına ~0,45 s/ay (üst sınır); değişmedi.
- Giden bayt ve ileti sayısı iki kolda birebir.
- 3 misafir / 4 ay sonunda host Save8 ve RNG kontrolle birebir.
- Komut gecikmesi (`researchMode`, execute + yayın): 12–44 ms, iki kolda aynı aralık.

**Misafir:** tam ayna 93–97 KB, misafirin `deserialize`'ı 144–241 ms (Node); motor dışı, değişmedi.
- Ayna farkları zaten birleştiriliyor: en sık 600 ms'de bir yeniden kurulum; pencere açıkken bekletilip tek seferde uygulanıyor.
- Yerinde delta uygulaması yapılmadı. Gizlilik, kimlik numaralandırması ve açık pencere riskleri nedeniyle MP.7'ye bırakıldı.

**MP yayın maliyeti:** CPU profilinde (3 misafir, 2 ay) yayın 3165 ms. Bunun 2343 ms'i `pure()` sarmalayıcısının içinde; içteki iş (`viewFor` 574 ms, ayna kurma 921 ms) dahil.
- `pure()`'un kendi alma / geri koyma payı ≈ 850 ms (~%27).
- Bu sarmalayıcı her görünüm / ayna kurulumunda G, devletler, filolar ve sistemlerdeki `_` önbellek alanlarını alıp geri koyar.
- Birleştirmek yayın içeriğini değiştirebilir: günlük önbellek anahtarları eksik.
- Bu fazda dokunulmadı; MP.7 / PERF.2 adayı.

**Ortak hız, akıllı duraklatma, savaş, diplomasi, casusluk, pazar:** MP kodu değişmedi; tarayıcı testleri tam regresyonda (`research/perf1/REGRESYON.md`).

## 5. Tarayıcı kare süresi

Koşullar: Chromium headless, `--disable-gpu` (yazılım çizimi; GPU / fiziksel Android değil), 1280×720, s22, 10 sn.

| | Hız 0 çizim medyanı | Hız 0 FPS | Hız 4 en kötü kare (aylık AI turu) | Hız 4 FPS |
|---|---|---|---|---|
| 180. ay kontrol | 1,4 ms (paylaşım 2,4) | 51–57 | 967–1333 ms (tekrar: 966–1050) | 36–46 |
| 180. ay PERF.1 | 1,4 ms (paylaşım 2,4) | 53–56 | 600–650 ms | 42–43 |
| 240. ay kontrol | 2,0 ms (paylaşım 2,6) | 50–56 | 1583–1683 ms | 34–36 |
| 240. ay PERF.1 | 1,6 ms (paylaşım 2,7) | 54 | 850–917 ms | 37–42 |

- **Sensör paylaşımı:** görünür sistem 3 → 94–100, görünür filo 5 → 100–145. Çizim medyanı ~+1 ms, en kötü çizim ≤51 ms.
- **Kasma:** çizim değil, aylık AI turu. PERF.1 en kötü kareyi yaklaşık %35–45 kısalttı.
- **Etiket ve çizgiler:** devlet adı, federasyon / ittifak çizgileri ve harita koduna dokunulmadı.

## 6. Doğruluk kanıtı

- **Ay ay iz:** kontrol ile A, A+B ve A+B+C, 60. ay ve 180. ay kayıtlarından ay ay iz verdi. Her ayın Save8 SHA-256'sı ve RNG durumu eşit.
- **Bütünleşik uzun koşu:** yeni oyundan 240 ay (seed 11, 22, 42, 404), aday kökten üretilen 60/120/180/240. ay kayıtları kontrol kayıtlarıyla **bayt-bayt aynı** (16/16).
- **`tests/perf1_equivalence_test.js`:**
  - arındırılmış kaynaklardan kurulan kontrol motoru ile aday aynı gerçek geç oyun Save8'inden (seed 11, 228. ay) 3 ay koşar; her ay birebir;
  - rota önbelleği her saklı rotada taze `findPath` ile aynıdır; radyasyon / şerit / yeni dünyada sıfırlanır;
  - EconomyLedger ifadeleri eşdeğerdir.
- **Koruma testleri:**
  - `tests/helpers/perf1-preservation.js` PERF.1 bloklarını tam metinle geri alır;
  - `economy.js` → 96H.9/96H.10 özeti `5d412d48…`, `economic-ledger.js` → MP.6.4 özeti `67d07f3e…`;
  - faz96h9 / 96h10 / 96h31 / 96c2 testleri hash'i gevşetmeden bu adaptörü uygular.

## 7. Yayın

- **ZIP:** `releases/stars-faz96h10p1.zip` (768 865 bayt), 20 girdi.
  - SHA-256 `253a0282a18509ec3394dc87f2ddbef98150ceb90b1f137841139a36ecf70448`
  - CRC32 (dosya) `60e78b12`
- **Doğrulama:**
  - girdi CRC'leri PASS;
  - yeniden paketleme ve temiz `git archive`'dan paketleme bayt-bayt aynı;
  - çıkarılmış ZIP `verify-release --root` DOĞRULANDI (19 dosya, build 96h10p1).
- **Değişen runtime:** `economy.js`, `economic-ledger.js`, `main.js` (BUILD_ID), `sw.js` (CACHE). `releases/stars-faz96h10.zip` değişmedi.
- **Multiplayer ile ilişki:** MP kodu (`research/mp*`) ZIP'te değildir. Bu ZIP'in runtime'ı MP.6.4 dalının runtime'ı + PERF.1'dir. MP host'u bu daldan (`claude/stars-perf1-ai-mp-optimization`) relay'in sunduğu sayfayla çalışır. Relay runtime baytlarını manifestten doğrular.
- **Kayıtlar:** eski Save8 kayıtları aynen yüklenir; MP.4 paketi değişmedi (tam regresyon).
