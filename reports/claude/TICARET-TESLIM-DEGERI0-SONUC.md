# TİCARET-TESLİM-DEĞERİ.0 — Sonuç raporu

Tarih: 23 Kasım 2026 · Dal `claude/stars-ticaret-teslim-degeri0` · Taban p52 `claude/stars-ticaret-gecerli-hat0` @ `2399075` (PR #76)

## Karar özeti

**p53 yok; oyunun çalışma zamanı değişmedi** (`verify-release`: DOĞRULANDI, 96h10p52).

1. **p52 performans belirsizliği kapatıldı.** "Anlamlı gerileme olmadığı yeterli güvenle gösterildi" (§2). Yeni ölçüm yöntemi:
   - aynı Node sürecinde iki ayrı çalışma zamanı;
   - aynı Save8, ABBA sırası, gerçek saat;
   - örnek başına Save8 eşitliği, A/A kontrolü ve işlev düzeyinde ölçüm.
2. **Salt okunur gölge değerleme kuruldu** (§6). Üç tohum × 240 ay ve 500 sistem × 120 ay boyunca, kritik tarihten önce ulaşabilecek ve ortağın kabul edeceği yalnız **1 gerçek** kaçırılmış ithalat fırsatı bulundu. Talimattaki "en az üç gerçek fırsat" şartı sağlanmadı; **AI davranışı değiştirilmedi**.
3. **Kıtlığın asıl nedenleri ticaret değerlemesi değil, yapı:** krizdeki devletin kendi Ticaret Limanı yok, temas yok, ortak ihraç edemiyor, savaş / ambargo var. Gıda / tüketim malı krizinin yaşandığı tohum 404'te risk dönemlerinin 11 / 13'ünde krizdeki devletin limanı yok.
4. **Doğrulanan iki karar kusuru:** `aiBalance` sözleşmeli ithalatı ihtiyaçtan düşmüyor; freight değeri varış zamanını içermiyor. Birincisini düzelten aday kontrol ve plaseboyla ölçüldü: fayda yok, 11'de kötü yönde (bant içinde) → **reddedildi**.

Fiziksel Android, gerçek internet, LAN ve canlı Render: **NOT RUN**.

---

## 1. Başlangıç ve bitiş HEAD

| | |
|---|---|
| Başlangıç | `239907532475f5e6ce3c3e67e2295195a106a66c` (p52, PR #76; uzak dal ilerlememiş, main `4296ad2` değişmedi) |
| Bitiş | bu raporun commit'i, `claude/stars-ticaret-teslim-degeri0` |
| Kontrol | p51 `1b95efb` worktree (perf), p52 (ekonomi) |
| Değişen | yalnız `research/ticaret-teslim-degeri0/*`, rapor, kanıt, `AI-RED-KARARLARI.md`, durum belgeleri. Çalışma zamanı ve testler değişmedi. |

## 2. p52 performans belirsizliği

Yeni araç: `research/ticaret-teslim-degeri0/perf-abba.cjs`.
- Aynı Node sürecinde p51 ve p52 için iki ayrı vm çalışma zamanı.
- Her örnek aynı Save8'den bir ay; ABBA sırası; `process.hrtime` gerçek saati.
- `Commerce.aiOpportunityTick` / `aiTick` sandbox içinde gerçek saatle ayrıca ölçüldü.
- Her örnekte iki kolun Save8 SHA-256 değeri karşılaştırıldı.
- 100 sistemde kol başına 40, 500 sistemde 24 örnek.

| Kayıt | A/B Δ medyan | A/B Δ ortalama | A/B Δ p95 | A/A Δ medyan | A/A Δ p95 | `aiOpportunityTick` ortalaması (ms): A → B · A/A farkı |
|---|---|---|---|---|---|---|
| 100 / 9 / m120 | **+%0,12** | +%0,48 | +%2,34 | −%0,93 | +%9,97 | 13,98 → 14,18 · A/A +0,66 |
| 500 / 16 / m120 | **−%0,14** | +%2,01 | +%4,09 | −%0,18 | −%2,99 | 3,05 → 3,14 · A/A −0,22 |
| 500 / 16 / m180 | **−%0,21** | −%0,08 | −%4,50 | +%1,74 | +%1,77 | 10,38 → 10,81 · A/A +0,71 |

Bütün örneklerde iki kolun Save8'i aynı (`92018e22…`, `1f6aa687…`, `b9057858…`).

**Kontrollü yük (alternatif yolu gerçekten çalışırken),** `alt-yuk.cjs` (G1 fikstürü, ABBA, 40 × 200 karar):
- p51: başarısız karar başına 414–428 µs.
- p52: başarılı karar başına 808–841 µs (bir ek `aiTerms` + `dealQuote`).
- A/A: 410–437 µs.

Doğal kampanyada alternatif yol 240 ayda 0 / 9 / 3 kez çalışıyor (TİCARET-GEÇERLİ-HAT.0).

**Sonuç:** anlamlı gerileme olmadığı yeterli güvenle gösterildi.
- Medyanlar ±%0,2 içinde, A/A'dan küçük.
- Ticaret işlevindeki ortalama fark A/A farkı kadar.
- Önceki Chromium ölçümündeki +%12,98 / +%9,44, tarayıcı p95 gürültüsüydü (aynı yöntemle A/A tek koşular ±%13).
- Bu, sonraki ekonomik AI işi için sabit performans tabanıdır.

## 3. Mevcut AI ihtiyaç hesaplaması

Kaynak: `commerce.js` `aiBalance`.
- `net = gelir − taahhütlü ihracat`
- `reserve = taban + max(0, −net) × 6`
- `need = max(0, −net) + max(0, 2 × taban − stok) / 6`
- Taban: enerji 80, mineral 60, gıda 40, alaşım 60, tüketim malı 40.

Bulgular:
- **Kıtlık ne kadar erken fark ediliyor?** Net eksiye döndüğü an ya da stok 2 × tabanın altına indiğinde `need > 0` olur. Kritik tarih (stokun tabana ineceği gün) hesaplanmıyor; ihtiyaç büyüklüğü zamanla ölçeklenmiyor.
- **Planlanan ithalat ihtiyacı azaltıyor mu? Hayır.** `incoming` hesaplanıyor ama `need`'e girmiyor. Sonda `ihtiyac-prob.cjs` (`evidence/.../ihtiyac-prob.json`): ayda 8 enerji ithal eden sözleşme imzalandıktan sonra `incoming 0 → 8`, `need 16 → 16`.
  - Doğal kampanyada aynı kaynağın 360 gün içinde farklı ortaklardan da ithal edildiği bacak çiftleri: 11'de 43, 99'da 2, 404'te 2, 500'de 0.
- **Teslim zamanı değerde mi? Hayır.** `diplomacy.js` freight değeri `v × 0,38 × need × min(24, sefer sayısı)`. Sefer sayısıyla doğrusal; varış zamanı ve kritik tarih yok. Aynı yük 30 günlük sıklıkla 108,9, 180 günlük sıklıkla 18,2 değerinde; fark yalnız sefer sayısından. `aiTerms` mesafeyi yalnız sefer sıklığını seçmek için kullanıyor.

## 4. İthalat ve üretim karşılaştırması

- `aiPortInvestment` aynı kolonide üretim binası mümkünse liman yatırımını reddediyor (TİCARET-AI.1 L-D1: maden +10 mineral/ay seçildi). Bu korundu.
- Gölgede her risk döneminde yerli üretim seçeneği (`buildingOrderCost` + `aiBuildingDelta > 0`) ayrıca kaydedildi. 33 risk döneminin yalnız 2'sinde ödenebilir ve artı katkılı üretim binası seçeneği vardı (ikisi de kuyruk meşgul).
- Gerçek AI 33 dönemin 8'inde sonraki 90 günde o kaynağın üretim binasını kuyruğa aldı (`built: true`).

## 5. Teslimat zamanı değerlemesi

Gölgede ilk varış = `Commerce.prepareDays` + ortağın gerçek dönüş rotası (`Commerce.route(b, e, …, {volume})`) üzerinde hat başına `max(1, mesafe / hız)`. Bu, konvoy motorunun kuralıyla aynı.

Kritik tarih = `(stok − taban) / −(net + sözleşmeli ithalat)` × 30 gün. Gelen sözleşmeli ithalat ihtiyacı azaltıyor, böylece çifte sayım yok.

İthalatı mümkün olan tek gerçek olayda (§6) ilk varış 61 gün, kritik tarih 152 gün sonra: zamanında.

## 6. Gölge ekonomik fırsatlar

Araç: `research/ticaret-teslim-degeri0/golge.cjs` (salt okunur).
- Kopyalı ve kopyasız (`NOCLONE=1`) koşunun son Save8 / RNG'si dört kampanyada da aynı: 11 `71e3530a…`, 99 `aea54fe1…`, 404 `17dcb804…`, 500 `78065717…`.
- Ortak başına ilk engel sırası: temas → `pairGate` → ortağın ihracı → liman → `aiPorts` → `aiTerms` (gerçekten r ithalatı mı) → `dealQuote` → varış (kritik tarihten önce mi) → ortağın `aiRespond` yanıtı.

| Kampanya | Risk (acil + yaklaşan) dönemi | Kaynak bazında risk ayı | En iyi seçenek dağılımı | Zamanında ve kabul edilecek |
|---|---|---|---|---|
| 100/9 · 11 · 240 ay | 7 | min 10, ala 5, ene 3 | savaş 3, rota yok 2, ihraç yok 1, ticaret anlaşması yok 1 | **0** |
| 100/9 · 99 · 240 ay | 1 | min 5 | uygun 1 | **1** |
| 100/9 · 404 · 240 ay | 13 | tük 216, yiy 174, ene 117, min 104, ala 35 | **kendi limanı yok 6** (dönemlerin 11 / 13'ünde limansız), ihraç yok 2, temas yok 2, rota yok 2, savaş / ambargo 1 | **0** |
| 500/16 · 11 · 120 ay | 12 | ene 16, min 12, ala 8 | temas yok 7, rota yok 2, savaş / temas kapalı 2, ihraç yok 1 | **0** |

**Tek gerçek fırsat (tohum 99, 6780. gün, AI 5, mineral):**
- Durum: stok 124, net −12,7 / ay, tabana 152 gün; yerli üretim seçeneği yok.
- Seçenek: AI 8 ortak; 4,9 mineral / sefer, karşılık 6,1 enerji, ilk varış 61 gün, `aiRespond` kabul.
- Gerçek AI: eski 5–8 sözleşmesi 6810. günde bitiyor; sonraki üç ayda bu çift için hep `trade-route-budget` (`tried 0, exhausted`). Ortak 96 rota bütçesi bu çifte gelmeden tükeniyor (`cift-iz.txt`).
- Bütçe tükenmesi kampanya boyunca 502 / 1105 / 1041 / 728 kez görülüyor. Ama risk dönemleriyle kesişen ve kârlı olan tek örnek bu.

**İlk geçişteki yanlış pozitif:** tohum 11'de AI 6'nın alaşımı. AI 6 zaten AI 8'den alaşım ithal ediyordu (`trade-existing`). Gölge ilk sürümde sözleşmeli ithalatı ihtiyaçtan düşmüyordu; düzeltildi.

**Yeterli fırsat bulunamamasının nedeni (E2):**
- yapı: limansız kriz devletleri, temassız / uzak ortaklar, savaş / ambargo;
- ortağın ihraç fazlası olmaması.

Teslimat gecikmesi ve karşılıklı takas şartı risk dönemlerinde engel değil (`noTerms` / `termsOther` / `late` = 0). Bütçe tükenmesi tek gerçek vakayı kaçırtıyor.

## 7. Uygulanan kod değişiklikleri

Oyunda **yok**. Araştırma araçları:

| Dosya | İş |
|---|---|
| `perf-abba.cjs` | ABBA, gerçek saat, A/A, işlev süresi |
| `alt-yuk.cjs` | Alternatif yol çalışırken karar maliyeti |
| `golge.cjs` | Gölge değerleme |
| `cift-iz.cjs` | Çift karar izi |
| `ihtiyac-prob.cjs` | `aiBalance` gelen ithalat sondası |
| `ADAY-IHTIYAC-GELEN-ITHALAT-rejected.diff` | Reddedilen aday |

## 8. Gerçek ekonomik fayda

Aday: `need`'den aylık sözleşmeli ithalatı düşmek (tek satır). Kol başına 240 ay, plasebo `PLACEBO_DAY` 1200 / 2400. Kanıt `evidence/.../aday/`.

| Tohum | Kontrol (kıtlık / kritik / koloni / imzalı / teslim) | Aday | Plasebolar | İlk ayrışma |
|---|---|---|---|---|
| 11 | 6 / 0 / 70 / 54 / 3784 | 10 / 3 / 67 / 57 / 3877 | 6 / 0 / 70 / 54 / 3784 · 0 / 0 / 71 / 53 / 3608 | 114. ay |
| 99 | 0 / 0 / 72 / 13 / 1500 | 0 / 0 / 72 / 16 / 1594 | 2 / 0 / 77 / 4 / 1023 · 8 / 4 / 76 / 19 / 2115 | 187. ay |
| 404 | 603 / 503 / 66 / 24 / 3361 | aynı (bayt-bayt) | 616 / 531 / 59 / 49 / 3487 · 581 / 467 / 62 / 48 / 3620 | yok |

Sonuç:
- Ekonomik fayda yok. 11'de kıtlık ve koloni kötü yönde, plasebo bandı içinde.
- 404'te etkisiz, çünkü krizdeki devlet ticaret yapamıyor.
- **Reddedildi** (`AI-RED-KARARLARI.md`).

## 9. Kriz ve kaynak rezervi

Tohum 404 (gıda + tüketim malı krizi):
- 240 ayda tüketim malında 216, gıdada 174 AI × kaynak risk ayı.
- Bu dönemlerde ithalat yolu yok. Krizdeki devletlerin (AI 2, AI 4) limanı yok ya da temasları yok.

Ticaretle önlenebilecek bir kriz bulunmadı. Önlenen açık: 0.

## 10. 120 / 180 / 240 aylık sonuçlar

- Tek gerçek fırsat 6780. günde (226. ay); yalnız 240 aylık pencerede görülüyor.
- 120 aylık testler bunu kaçırıyor; ama bu bütçe kaynaklı tek vaka, ekonomik bir ticaret kazancı göstermiyor.
- Kampanya karşılaştırmaları (§8) 240 ay. 404 doğal olarak 240 aya kadar sürüyor (5 AI ayakta).

## 11. 500 sistem performansı

§2: medyan −%0,14 / −%0,21, A/A içinde. Gölgede 500 sistemde risk dönemlerinin 7 / 12'sinde hiçbir ortakla temas yok.

## 12. Save8 / RNG

- Çalışma zamanı değişmedi.
- Gölge araçları dört kampanyada salt okunur (Save8 / RNG eşit).
- Perf örneklerinde iki kol her ay aynı Save8'i üretiyor.
- Reddedilen aday tetiklenen kampanyada ilk 113 / 186 ay bayt-bayt eşit; ilk ayrışma ihtiyaç değerinin değiştiği ilk ticaret kararında.

## 13. Multiplayer

Çalışma zamanı ve MP kaynakları değişmedi. p52'nin Chromium sonuçları (TR / TL / TA / TB / SG / J / X, SP) geçerli; bu fazda yeniden koşulmadı (NOT RUN, gerekçe: değişiklik yok).

## 14. Regresyonlar

- Hedefli ticaret paketleri (`evidence/.../ticaret-node.txt`), hepsi PASS:

  | Paket | Sonuç |
  |---|---|
  | `ticaret_gecerli_hat0` | 13/0 |
  | `ticaret_tamamlama0_transit` | 12/0 |
  | `ticaret_ag1` | 9/0 |
  | `ticaret_ag2_tx` | 6/0 |
  | `ticaret_ag2_mp` | 2/0 |
  | `faz96a_cargo` | 36/0 |

- Tam Node: NOT RUN. Çalışma zamanı ve testler p52 ile aynı; p52 sonucu 247 / 6576 / 279 geçerli.

## 15. Reddedilen adaylar

- `ADAY-IHTIYAC-GELEN-ITHALAT-rejected.diff` (§8).
- Bütçe tükenmesi için ayrı pay: daha önce reddedildi (TİCARET-AI.1). Burada tek bir gerçek vakayla yeniden açmak için yeterli kanıt yok.

## 16. Yayın kararı

p53 **yok**. Gerekçe:
- en az bir doğrulanmış ekonomik fayda gösterilmedi;
- gerçek fırsat sayısı 1 (< 3).

p52 (`claude/stars-ticaret-gecerli-hat0`) Render için en güncel aday olmaya devam ediyor.

## 17. Sonraki faza devir

Bkz. `TICARET-TESLIM-DEGERI0-DEVIR.md`.

---

## 20 soru

| # | Soru | Cevap |
|---|---|---|
| 1 | p52'de gerçek performans gerilemesi var mı? | Hayır, yeterli güvenle (ABBA medyan ±%0,2, A/A içinde). |
| 2 | AI kıtlığı ne kadar erken fark ediyor? | Net eksiye dönünce ya da stok 2 × tabanın altına inince; kritik tarih hesaplanmıyor. |
| 3 | Planlanan ithalat ihtiyacı azaltıyor mu? | Hayır (sonda: `incoming` 8, `need` aynı). Düzelten aday fayda göstermedi. |
| 4 | Teslim tarihi hesaba katılıyor mu? | Hayır; değer sefer sayısıyla doğrusal. |
| 5 | Gıda açığı yaşayanlar neden ticaret yapamıyor? | 404'te krizdeki devletin Ticaret Limanı yok (11 / 13), temas yok ya da ortak ihraç edemiyor. Ayrıca savaş / ambargo. |
| 6 | Karşılıklı takas şartı ne kadar sınırlayıcı? | Risk dönemlerinde engel değil: 0 `noTerms` / `termsOther`. Engeller daha önceki kapılarda. |
| 7 | İç üretim tercihi ne zaman doğru? | Ödenebilir üretim binası aynı kolonide artı katkı veriyorsa (TİCARET-AI.1 L-D1). Gölgede bu seçenek yalnız 2 / 33 dönemde vardı. |
| 8 | Ticaretin daha iyi olduğu gerçek fırsat var mı? | Bir tane (tohum 99, AI 5 mineral, 61 günde varış, 152 gün süre). |
| 9 | Yeni değerleme bu fırsatları bulabiliyor mu? | Gölge buluyor; ama kaçırılmasının nedeni değerleme değil, rota bütçesi. |
| 10 | Ticaret hangi krizleri önledi? | Hiçbirini; önlenebilir kriz bulunamadı. |
| 11 | Artan sözleşmeler faydaya dönüştü mü? | Adayda imza 54 → 57, 13 → 16; fayda bant içinde ya da olumsuz. |
| 12 | İhracatçılar zarar gördü mü? | Adayda 11'de toplam kıtlık arttı (bant içinde). Ürüne alınmadı. |
| 13 | 120 aylık testler uzun vadeli ticareti kaçırıyor mu? | Tek fırsat 226. ayda; 120 ayda görünmüyor. |
| 14 | 180 / 240 aylık fark? | 240 ayda imza ve teslim artıyor (kontrolde 54 / 3784), ama ekonomik fayda sinyali yok. |
| 15 | Büyük galaksi performansı korundu mu? | Evet (§2). |
| 16 | Save8 / MP eşdeğerliği korundu mu? | Çalışma zamanı değişmedi; gölge araçları salt okunur. |
| 17 | p53 çıkarılmalı mı? | Hayır; aday bekletilmez, reddedildi. p52 korunur. |
| 18 | Ticaretin ekonomik karar sistemi yeterli mi? | Mekanik olarak yeterli. Ekonomik etki yapı (liman / temas) yüzünden sınırlı; değerleme değişikliği tek başına fayda üretmiyor. |
| 19 | Sonraki iş performans mı, mobil ticaret kabulü mü? | Kullanıcı test edebiliyorsa mobil ticaret saha kabulü. Edemiyorsa ticarette yeni AI işi yerine planlanan savaş / federasyon AI. |
| 20 | Savaş ve federasyon AI'ye geçmek için ticaret olgun mu? | Evet. Fiziksel ticaret, transit, alternatif liman ve kayıt / MP güvenli; ekonomik AI değişikliği için ek kanıt yok. Federasyon `ticaret` yasası ve temas / liman genişlemesi ticaretin asıl kaldıraçları. |

## Yeniden üretim

```sh
N=40 OUT=ab.json node research/ticaret-teslim-degeri0/perf-abba.cjs <p51> <p52> <kayıt.save>
node research/ticaret-teslim-degeri0/alt-yuk.cjs <p51> <p52>
node research/ticaret-teslim-degeri0/golge.cjs <kök> 404 240 out.json      # NOCLONE=1, CAMP_SIZE=s500 CAMP_AI=16
node research/ticaret-teslim-degeri0/cift-iz.cjs <kök> 99 6780 5 8
node research/ticaret-teslim-degeri0/ihtiyac-prob.cjs <kök>
```
