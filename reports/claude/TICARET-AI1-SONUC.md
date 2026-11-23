# TİCARET-AI.1 — Sonuç raporu

Tarih: 23 Kasım 2026 · Dal `claude/stars-ticaret-ai1` · Taban `claude/stars-ticaret-ai0` @ `d438d6e` (PR #73; çalışma zamanı p50 `d1784ff`)

## Karar özeti

**p51 üretilmedi.** Çalışma zamanı p50 ile aynı (`tools/verify-release.py` DOĞRULANDI, 96h10p50). p50 güvenli sürüm olarak kalıyor.

- **Stratejik liman yatırımı.** Ekonomik fırsat alanı doğal kampanyada fiilen boş. Bütün kapılar kaldırılsa ve sözleşme değeri 4 yıllık ufukla çarpılsa bile tohum başına en fazla 2 ayrı fırsat çıkıyor; bunlar da başka kapılara takılıyor. Kontrollü vakada mevcut kod liman yerine aynı koloniye maden kurmayı doğru biçimde tercih ediyor. Ufuk adayı doğal kampanyada **sıfır** liman yaptı → reddedildi.
- **Transit.**
  - İki yönlü izin yaması atomik değildi. Kısmi hatada a 36 Etki ödüyor ve gereksiz bir izin alıyordu; testle gösterildi.
  - İşlem sarmallı v2 sürümü atomik: kısmi hatada iki taraf da ödemiyor.
  - Doğal fayda yine plasebo bandı içinde → v2 yama olarak bekletildi.
  - 500 sistemde rota bütçesi darboğazı kanıtlandı; ayrı bütçe adayıyla erişilen çiftlerin hepsi ekonomik şartta eleniyor → aday reddedildi.
- **MP.** Önceki fazda eksik kalan Chromium "kargolu kayıt → yeni oda → misafirler döner → tek teslim" senaryosu (`MP8_SCEN=TR`) 6/6 PASS. TL / TA / TB / SG / J / X regresyonları da hepsi PASS.

Kullanıcı test yapamıyordu; bütün kabuller otomatiktir. Fiziksel Android, gerçek LAN, uzak internet ve canlı Render: **NOT RUN**.

---

## A. Başlangıç ve bitiş HEAD

| | |
|---|---|
| Başlangıç | `d438d6e3ec7d5175220dc5cea35eb1e37d2dfb1f` (`claude/stars-ticaret-ai0`, PR #73). Uzak dallar doğrulandı: ag2 `d1784ff` ve ai0 `d438d6e` ilerlememiş; main `4296ad2` değiştirilmedi. |
| Bitiş | bu raporun commit'i, `claude/stars-ticaret-ai1` (taslak PR, taban `claude/stars-ticaret-ai0`) |
| Kontrol kökü | `git worktree` @ `d1784ff` (p50, sabit kopya) |
| Aday kökleri | p50 + `ADAY-IKI-YONLU-TRANSIT-ATOMIK-BEKLETILDI.patch` (v2); + `ADAY-LIMAN-UFUK4-rejected.patch` (ufuk); + `ADAY-TRANSIT-BUTCE-rejected.patch` (bütçe) |

## B. Önceki araştırmadan kullanılan kanıtlar

TİCARET-AI.0 hunisi, kampanyaları ve plasebo bantları yeniden kullanıldı. Plasebo bandı: 11'de kıtlık 3–14, koloni 30–37; 404'te kıtlık 103–196.

`funnel2.cjs` 500 sistem için genişletildi (`CAMP_SIZE` / `CAMP_AI`). `kontrollu.cjs`'e K7 kısmi hata vakası eklendi.

## C. Stratejik liman yatırımının kök nedeni

Araç: `research/ticaret-ai1/funnel3.cjs` (salt gözlem). Kanıt: `evidence/ticaret-ai1/funnel/`.

Her `aiPortInvestment` çağrısında "ekonomik çekirdek" kapılardan bağımsız olarak hesaplandı. Çekirdek şu soruya bakar: a'nın limansız bir kolonisine liman yapılırsa iki yönlü rota açılıyor mu, `aiTerms` olumlu mu, sözleşme değeri liman bedelini aşıyor mu? Çekirdek doğruysa hangi kapıların engellediği ayrıca sayıldı. Ortağın (b'nin) kolonileri de aynı yöntemle ayrıca değerlendirildi.

Kopyalı ve kopyasız koşuda (`NOCLONE=1`) son Save8 SHA-256 aynı (`bd8dfa43…`, `ff365c4e…`, `5fdf5507…`). 500 sistemde huni ile saf kampanya aynı özeti verdi (`78065717…`).

| | 11 | 99 | 404 | 500 / 16 AI / 11 |
|---|---|---|---|---|
| `aiPortInvestment` çağrısı | 357 | 1417 | 690 | 1397 |
| a'nın bütün kolonileri zaten limanlı sistemde | 133 | 542 | 178 | 487 |
| ihtiyaç ↔ ihraç eşleşmesi yok | 84 | 426 | 295 | 491 |
| ortağın limanı bilinmiyor | 81 | 399 | 77 | 294 |
| uygun (bedeli ödenebilir) koloni yok | 33 | 44 | 67 | 21 |
| hiçbir koloniden rota yok | 21 | 5 | 61 | 75 |
| ekonomik değerlendirmeye ulaşan | 5 | 1 | 12 | 29 |
| en iyi değer / bedel (12 aylık sözleşme) | 0,49 | 0,02 | 0,33 | 0,37 |
| ufuk ×4 ile değer > bedel olan ayrı fırsat | 2 | 0 | 2 | 1 |
| · bunları engelleyen kapı | başka liman zaten sırada / açık kaynak değil | — | açık kaynak değil + sırada + koloni meşgul | açık kaynak değil |
| ortağın kolonilerinde en iyi oran | 0,48 | — | — | 0,44 |

Kök nedenler:

1. **Ağ zaten yoğun.** AI kendi topraklarında olağan yatırımla liman kuruyor (`invest:liman` 47 / 38 / 51). Çağrıların %37–%48'inde a'nın limansız kolonisi yok. Yapısal boşluklar (TİCARET-AI.0: %78–%85) AI'nın sahip olmadığı sistemlerde; kendi kolonisine liman yapmak onları kapatmıyor.
2. **Bilgi ve eşleşme.** Ortağın limanı bilinmiyor (%11–%28) ya da ihtiyaç eşleşmesi yok (%24–%35).
3. **Ekonomi.** Bir yıllık sözleşmenin değeri liman bedelinin %2–%49'u. Ölçülen sözleşme ömrü (ardışık yıllık yenileme medyanı 4 yıl) ufuk olarak kullanılsa bile yalnız en üst uç kârlı. Kontrollü vakada bu durumda bile aynı kolonideki maden (+10 mineral/ay) daha iyi ve mevcut kod onu seçiyor.
4. **Simetri.** Çift döngüsü yalnız küçük kimlikli devletin tarafını değerlendiriyor. Ortak tarafı ayrıca ölçüldü: üç tohumda 3 değerlendirme, en iyi oran 0,48. Asimetri pratikte fırsat kaçırmıyor.
5. **"Ara liman" analizi.** Stok devlet genelinde olduğundan a'nın kendi ara limanı yeni bir uç limana denktir. a'nın birden çok kendi ara limanını gerektiren bir koridor, en yakın uç liman tek başına yetmiyorsa açılmaz. Gerekli ara limanlar üçüncü tarafların ya da sahipsiz sistemlerin içinde; bu da sömürgeleştirme ya da üçüncü taraf yatırımı demek. Bu fazın kapsamı dışında (ayrı faz kararı).

## D. Yapılan kod değişiklikleri

- **Çalışma zamanı:** yok (19 dosya p50 ile aynı).
- **Testler:**
  - `tests/helpers/ticaret-ai1-mp.cjs` (yeni TR senaryosu);
  - `tests/browser-mp8.cjs` (`TR` yapılandırma ve bağlantı satırları, ekleme).
- **Araştırma:**
  - `research/ticaret-ai1/funnel3.cjs`, `kontrollu-liman.cjs`;
  - üç yama (biri bekletildi, ikisi reddedildi);
  - `research/ticaret-ai0/funnel2.cjs` galaksi boyutu, `kontrollu.cjs` K7.
- **Belge:** `AI-RED-KARARLARI.md` (iki red, bir bekletme).

## E. Transit AI geliştirmeleri

**B1 atomiklik.** TİCARET-AI.0 yaması iki ayrı `aiNegotiate` çağrısı kullanıyordu; bu atomik değil. Kontrollü K7'de a'nın izni uygulanıyor, ardından ikinci `portTransit` maddesinde motor hatası enjekte ediliyor:

| Kök | Sonuç |
|---|---|
| v1 | a izinli, a −36 Etki, sahip +36, b izinsiz → gereksiz ödeme ve gereksiz izin |
| v2 | iki yönlü işlem `dealTxBegin` / `dealTxRollback` ile sarmalandı; bekleme süreleri işlemden önce yazıldığından korunur |

- v2'de kısmi hata sonrası hiçbir izin ve hiçbir ödeme kalmıyor; iki tarafın 180 günlük beklemesi duruyor (spam yok).
- v2'nin K1–K6 sonuçları v1 ile aynı: iki yönlü koridorda iki izin ve ertesi ay sözleşme; tek yönlüde eski yol; rölesiz, insan sahipli ve düşük ilişkili vakalarda hiçbir şey.
- Doğal kampanyada v2 = v1. 11'de aynı son özet `c73ec9d5…`, 99 ve 404'te p50 ile bayt-bayt aynı.

**B2 rota bütçesi.**
- 500 / 16 / 11'de yalnız a'nın izniyle açılan 3 ayrı çift (56 çağrı) var. Ama `aiTransitRequest`'e her çağrıda ortak 96 rota tükenmiş geliyor (554 çağrının hepsi ilk çiftte duruyor).
- Ayrı 8 rotalık transit payı adayı erişimi açtı: 8 çift değerlendirildi, **8'i de `aiTerms`'te elendi** (karşılıklı kârlı takas yok). 100 sistemde v2 ile bayt-bayt aynı, 500 sistemde p50 ile bayt-bayt aynı.
- Fayda yok → reddedildi.

**B3 diplomasi.** İzin kararları mevcut `aiRespond` / `aiCounterBudget` yolundan geçiyor:
- güven 0 → karşı teklif tavanı aşar, izin ve ödeme yok;
- 404'teki tek iki yönlü çiftte sahip pahalı karşı teklif yaptı, teklif eden reddetti.

Federasyon `ticaret` yasası `portRight` içinde izin sayılıyor; aday buna dokunmuyor (`portRight(owner,b)` zaten doğruysa b için izin istenmez).

## F. Kontrollü test sonuçları

Transit (`kontrollu.cjs`, kanıt `evidence/ticaret-ai1/kontrollu/transit-*.json`) ve liman (`kontrollu-liman.cjs`, `liman-*.json`). Aynı fikstür kontrol ve aday kökünde.

| İstenen | Vaka | p50 | Aday | Durum |
|---|---|---|---|---|
| D1 tek liman koridor açar | L-D1 (a'nın 14'teki limansız kolonisi, b limanına 2 sıçrama) | hipotetik rota ve şartlar var; oran 0,93 → yatırım yok | ufuk ×4 → oran aşılır, ama aynı kolonide maden +10 min/ay → yatırım yok (iç üretim doğru tercih) | PASS (doğru ret) |
| D1a açık kaynak liman bedelini karşılamıyor | L-D1a | bedel yok → yatırım yok | aynı | PASS |
| D2 iki ara liman | analitik (§C.5): a'nın kendi ara limanları uç limana denk | — | — | ARAŞTIRILDI (senaryo yok) |
| D3 koridor açmıyor | L-D3 | yatırım yok | aynı | PASS |
| D4 kriz | L-D4 (kıtlık) | yatırım yok | aynı | PASS |
| D5 iç üretim daha iyi | L-D5 (açık yok) + L-D1 (maden) | yatırım yok | aynı | PASS |
| D6 iki yönlü izin | K1 / K2 | izin yok | iki izin, ertesi ay sözleşme | PASS (aday) |
| D7 sahip reddeder / pahalı karşı teklif | K6 + doğal 404 | Etki harcanmaz | aynı | PASS |
| D8 fetih / iptal | Chromium TB B3 / B4 | rota kapanır, teslim yok | (aday MP'ye dokunmuyor) | PASS |
| D9 tekrar → çift ödeme / inşaat yok | K2 ikinci çağrı (0 rota / 0 Etki) + L-D9 (iki çağrı, 0 liman) | — | aynı | PASS |
| D9b kısmi hata | K7 | — | v1 FAIL (gereksiz ödeme), v2 PASS | v2 PASS |
| D10 insan haklarına dokunulmuyor | K5 (insan sahibe istek yok) + TB / TR (izin yalnız insan kararıyla) | — | aynı | PASS |
| D11 Save8 yüklemesi sonrası tutarlılık | Chromium TR R2–R4 + Node `ticaret_ag2_mp` M1 | — | — | PASS |
| D12 geçerli rotalar bozulmuyor | 99 / 404 doğal kampanyada 120 ay bayt-bayt eşit; K3 tek yönlü yol aynı | — | — | PASS |

## G. Doğal kampanya ve plasebo karşılaştırması

Araç: `research/ticaret-ai0/camp.cjs`. Kanıt: `evidence/ticaret-ai1/kampanya/`. Bant TİCARET-AI.0'daki etkili plasebolarla.

| Kol | 11 | 99 | 404 | 500 / 16 / 11 |
|---|---|---|---|---|
| p50 kontrol (kıtlık / koloni / imzalı / teslim yükü) | 14 / 35 / 27 / 3414 | 0 / 29 / 2 / 150 | 181 / 38 / 12 / 1955 | 16 / 82 / 2 / 296 |
| v2 transit (atomik) | 6 / 34 / 25 / 3269, ilk ayrışma 41. ay (1230. gün: AI 2 ve AI 6, sahip AI 8'den iki yönlü izin) | = kontrol | = kontrol | = kontrol |
| v2 + liman ufku ×4 | = v2 (0 liman yatırımı) | = kontrol | = kontrol | NOT RUN (100 sistemde 0 tetik) |
| v2 + ayrı transit payı | = v2 | = kontrol | = kontrol | = kontrol (8 çift `noTerms`) |
| plasebo bandı | kıtlık 3–14, koloni 30–37 | 0 | kıtlık 103–196 | NOT RUN |

İlk anlamlı davranış değişikliği yalnız 11'de, 1230. günde: iki yönlü izin kararı. Sonuç bant içinde.

180 / 240 ay: NOT RUN. Koşul olan küçük galakside fayda kanıtı sağlanmadı; "körlemesine geçme" talimatı uygulandı.

## H. Ekonomik fayda değerlendirmesi

1. **Yeni ve kullanılan liman:** 0 (hiçbir kolda stratejik liman yok). p50'de sözleşmede kullanılan AI limanları 11 / 29, 2 / 20, 7 / 30, 500'de 2 / 65.
2. **Yeni koridor:** yalnız 11'de, iki yönlü izinle (AI 2 ↔ AI 6, sahip 8). 2–6 ticareti kontrolde de var; izin yalnız zamanlamayı ve rotayı değiştiriyor.
3. **Aktif sözleşme / teslim:** 11'de imzalı 27 → 25, teslim yükü 3414 → 3269. Diğerleri eşit.
4. **Kıtlık devlet-ayı:** 11'de 14 → 6 (bant 3–14). Diğerleri eşit.
5. **Transite harcanan Etki:** 11'de 72 (iki izin); başka yerde 0.
6. **Kullanılmayan / zarar eden yeni liman:** yok (yeni liman yok).
7. **İç üretim ile karşılaştırma:** mevcut kod bunu yapıyor (L-D1: maden tercih edildi).

**Soruya cevap:** AI'nın ticaret için liman yapması, aynı kaynağı iç üretime harcamasından daha iyi sonuç vermiyor. Ölçülen vakaların hepsinde mevcut değerleme ya bedeli değerin üstünde buluyor ya da daha iyi bir üretim binası buluyor.

## I. Multiplayer sonuçları

Chromium: üretim relay süreci + TLS vekili, host + B + C ayrı profiller, gerçek STARS misafir arayüzü.

| Senaryo | Sonuç |
|---|---|
| **TR (yeni)** | **6/6 PASS** |
| TL | 5/0 PASS |
| TA | 6/0 PASS |
| TB | 6/0 PASS |
| SG | 5/0 PASS |
| J | 5/0 PASS |
| X | 5/0 PASS |

TR ayrıntıları:
- R1: konvoy yola çıktı, B'den 80 düştü.
- R2: kayıt → kapanış → relay yeniden → yeni oda → DEVAM ET. `G.commerce` JSON birebir aynı; stoklar (host 3000 / B 2920) ve gün (27) aynı.
- R3: B ana menüden, C davet bağlantısından döndü. B aynasında konvoy host ile aynı (`at 40 · step 1 · moving`).
- R4: teslim; host 3000 → 3080 (tam bir kez), B yeniden ödemedi; 60 gün sonra değişiklik yok; B aynasında `delivered`.

İlk TR denemesi ortam yüzünden FAIL verdi: Chromium yolu (`STARS_CHROMIUM_PATH`) verilmemişti ve test başlamadan düştü (`tr1.log`). Ürün hatası değildi; ikinci denemede 6/6.

Fiziksel Android, gerçek LAN, uzak internet ve Render: NOT RUN.

## J. Save8 ve RNG eşdeğerliği

- Çalışma zamanı değişmedi; Save8 v8, paket 4 ve protokol 1 aynı.
- Huni araçlarının salt gözlem olduğu ölçüldü (kopyalı ve kopyasız koşuda Save8 SHA-256 ve RNG birebir; 500'de huni = saf kampanya).
- Adaylar yeni Save8 alanı eklemiyor. 99 ve 404 bütün adaylarda 120 ay ay ay bayt eşit; 500'de v2 ve bütçe adayı p50 ile eşit. 11'de ilk ayrışma beklenen davranış değişikliğinde (41. ay).
- Deterministik tekrar: v1 aday kökü 11. tohumda iki kez koşuldu ve aynı özeti verdi; v2, ufuk ve bütçe kolları da 11'de aynı `c73ec9d5…` özetine vardı (ek dalları hiç tetiklenmedi). p50 kontrolü 11 ve 404'te üçer kez aynı.
- Reddedilen / iptal edilen işlem: K7 v2'de dünya kısmi hatadan önceki duruma dönüyor (bekleme kayıtları hariç).

## K. 100 / 500 sistem performansı

Çalışma zamanı değişmediği için ölçüm **NOT RUN**; p50 değerleri geçerli: 100 sistem +%0,10, 500/120 −%0,67, 500/180 −%1,90.

Adayların p95'i ölçülmedi (yayın adayı değiller). Kaba gösterge: 500 / 16 / 120 ay kampanya duvar saati p50 119 sn, v2 124 sn, bütçe adayı 130 sn. Tek koşu ve paralel olduğu için kapı kararına esas değil.

## L. Tam regresyon sonuçları

Tam Node (`STARS_TEST_WORKERS=4 node tests/run-all.js`): **245 paket / 6551 PASS / 279 FAIL**, p50 tabanıyla birebir aynı. 279 FAIL eski ve tarihsel; yeni regresyon yok (`evidence/ticaret-ai1/node-run-all.log`). Tam koşunun yeniden yazdığı audit / navy dosyaları geri alındı.

Chromium MP: §I.

## M. ZIP, sürüm ve GitHub durumu

- p51 **yok**; ZIP üretilmedi. p50 ZIP'i (`releases/stars-faz96h10p50.zip`, SHA-256 `26a6b5e3…`, CRC32 `8D1FE07F`) geçerli.
- Dal: `claude/stars-ticaret-ai1`, taslak PR #74 (taban `claude/stars-ticaret-ai0`).
- main, `claude/stars-ticaret-ag2` ve canlı Render değiştirilmedi.

## N. Açık riskler

- İki yönlü izin yaması (v2) uygulanmadı. Oyunda iki yönlü koridor çıkarsa AI izin alamaz; nadir ama gerçek bir işlev açığı.
- Yapısal liman boşlukları AI'nın sahip olmadığı sistemlerde. Ticaret ağını büyütmek sömürgeleştirme / genişleme kararına bağlı (ayrı faz).
- Sabit 36 Etki izin bedeli sahibin değerlemesiyle uyumsuz kalabiliyor (404 çifti).
- 500 sistemde ortak rota bütçesi transit değerlendirmesine hiç yer bırakmıyor. Bugün ekonomik kayıp yaratmıyor (şartlar olumsuz), ama ekonomi değişirse görünür olur.
- Fiziksel cihaz ve canlı Render: NOT RUN.

## O. FED-AI-SİYASET.0 için devir

- **Hazır altyapı:**
  - fiziksel kargo (MP kayıt / yeni oda dahil uçtan uca doğrulandı);
  - Transit İzni ve federasyon `ticaret` yasasının izin sayılması;
  - AI–AI daraltılmış işlem;
  - atomik iki yönlü izin yaması (bekletildi);
  - salt gözlem huni ve kampanya araçları: `funnel2` (500 desteği), `funnel3`, `camp` (`PLACEBO_DAY`, `CAMP_SIZE`).
- **Federasyon siyasetine aktarılabilecek bulgu:** ticaret ekonomik bir bağ olarak şu an zayıf. Doğal kampanyada aktif AI–AI sözleşmesi 0–3 arası, teslim yükü 120 ayda 150–3414. Federasyon kararlarında ticaret çıkarı küçük bir terim olarak kalmalı; büyük bir ağırlık verilirse karar gürültüye dayanır.
- **Risk:** federasyon `ticaret` yasası izin sorununu kendiliğinden çözüyor. Federasyon AI'sı üyeliği ticaret için tercih ederse bu, transit diplomasisinden daha etkili bir kaldıraç olabilir; ölçülmeli.

---

## 15 soru

| # | Soru | Cevap | Durum |
|---|---|---|---|
| 1 | AI artık stratejik ticaret için liman inşa edebiliyor mu? | Hayır. Mevcut `aiPortInvestment` doğru ama fırsat alanı neredeyse boş; ufuk adayı da 0 liman yaptı ve reddedildi. | ARAŞTIRILDI |
| 2 | İnşa edilen limanların kaçı ticarette kullanılıyor? | Yeni stratejik liman yok. Olağan AI limanlarından sözleşmede kullanılanlar: 11 / 29, 2 / 20, 7 / 30, 500'de 2 / 65. | ARAŞTIRILDI |
| 3 | Yeni limanlar gerçek koridor açıyor mu? | Gözlenmedi. Boşluklar AI'nın sahip olmadığı sistemlerde (§C.1, §C.5). | ARAŞTIRILDI |
| 4 | Gereksiz liman yatırımı önleniyor mu? | Evet: 4 doğal koşuda ve L-D1/D3/D4/D5/D9'da gereksiz liman yok; iç üretim tercih ediliyor. | TAMAMLANDI VE TEST EDİLDİ (p50 davranışı) |
| 5 | AI iç üretim ile ticaret yatırımını karşılaştırabiliyor mu? | Evet, mevcut kodda (maden / santral … alternatifi). L-D1'de maden seçildi. | TAMAMLANDI VE TEST EDİLDİ |
| 6 | İki yönlü transit sorunu düzeldi mi? | Yamada düzeldi ve artık atomik (K1 / K2 / K7). Çalışma zamanına uygulanmadı. | KODLANDI, TEST BEKLİYOR (yama) |
| 7 | AI gereksiz Etki harcıyor mu? | Hayır: K4–K7, 180 günlük bekleme, insan sahibe istek yok; v2 kısmi hatada ödemeyi geri alıyor. | TAMAMLANDI VE TEST EDİLDİ (kontrollü) |
| 8 | Anlaşmalar ve teslimatlar arttı mı? | Hayır. 11'de 27 → 25 imza, 3414 → 3269 yük; diğerleri eşit. | ARAŞTIRILDI |
| 9 | Kaynak krizleri azaldı mı? | Kanıtlanmadı. 11'de 14 → 6 ama bant 3–14. | ARAŞTIRILDI |
| 10 | İyileşme plasebo bandının dışında mı? | Hayır. | ARAŞTIRILDI |
| 11 | Uzun vadeli ekonomik başarı arttı mı? | Ölçülmedi (180 / 240 ay NOT RUN, küçük galakside fayda yok). | BAŞLANMADI |
| 12 | 100 / 500 performansı korundu mu? | Çalışma zamanı p50; p50 kapısı geçerli. Aday p95 NOT RUN. | TAMAMLANDI VE TEST EDİLDİ (p50) |
| 13 | Save8 / RNG güvenliği doğrulandı mı? | Evet (§J). | TAMAMLANDI VE TEST EDİLDİ |
| 14 | MP ticaret ve kayıt mekanikleri güvenli mi? | Otomatik testlerde evet: TR 6/6 kargolu kayıt → yeni oda → tek teslim; TL / TA / TB / SG / J / X PASS. Fiziksel cihaz NOT RUN. | TAMAMLANDI VE TEST EDİLDİ (otomatik) |
| 15 | p51 üretildi mi? | Hayır. Sağlanamayan koşullar: 1 (kanıtlanmış fayda) ve 3 (doğal kampanyada kabul edilebilir fayda kanıtı). Diğer kapılar çalışma zamanı değişmediği için anlamsız. | BLOKE OLDU (kabul kapısı) |

## Yeniden üretim

```sh
node research/ticaret-ai1/funnel3.cjs <kök> 11 120 out.json        # NOCLONE=1; CAMP_SIZE=s500 CAMP_AI=16
CAMP_SIZE=s500 CAMP_AI=16 node research/ticaret-ai0/funnel2.cjs <kök> 11 120 out.json
node research/ticaret-ai0/camp.cjs <kök> 11 120 out.json            # PLACEBO_DAY=<gün>, CAMP_SIZE / CAMP_AI
node research/ticaret-ai0/kontrollu.cjs <kök>                       # K1–K7
node research/ticaret-ai1/kontrollu-liman.cjs <kök>                 # L-D1a, D1, D3, D4, D5, D9
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium MP8_SCEN=TR node tests/browser-mp8.cjs
# aday kökü: git archive d1784ff | tar -x -C <dizin>; cd <dizin>; git apply <yama> (bütçe / ufuk yamaları atomik yamanın üstüne)
```
