# TİCARET-AI.0 — Sonuç raporu

Tarih: 23 Kasım 2026 · Dal `claude/stars-ticaret-ai0` · Taban p50 `claude/stars-ticaret-ag2` @ `d1784ff` (PR #72)

**Özet kararı:** kabul kapısı geçmedi, **p51 üretilmedi**. Çalışma zamanının 19 dosyası p50 ile bayt-bayt aynı (`tools/verify-release.py`: DOĞRULANDI, 96h10p50). p50 güvenli sürüm olarak kalıyor.

Bu fazda yapılanlar:
- Eksik MP Chromium ticaret kabulünü yaptım: ara liman geçişi, izin kaybı ve ara liman fethi 6/6 PASS.
- AI ticaret kararlarını salt gözlemle ölçtüm (karar hunisi) ve kök nedeni kanıtladım.
- Kök nedenin düzeltilebilir kısmı için küçük bir aday yazdım. Kontrollü vakada mekanizma doğru çalışıyor.
- Doğal kampanyada aday üç tohumdan yalnız birinde tetiklendi; sonucu plasebo bandının içinde kaldı. Ekonomik fayda kanıtlanmadı, bu yüzden aday yama olarak bekletildi ve çalışma zamanına uygulanmadı.

Kullanıcı test yapamıyordu. Bütün kabuller otomatiktir. Fiziksel Android, gerçek LAN, uzak internet ve canlı Render: **NOT RUN**.

---

## A. Kanonik kaynak

| | |
|---|---|
| Başlangıç HEAD | `d1784ffcbe45901674076e682658e9f5dec8f8ae` (p50, `claude/stars-ticaret-ag2`, PR #72) |
| Bitiş HEAD | bu raporun commit'i, `claude/stars-ticaret-ai0` |
| Commit'ler | `d27f044` Faz 0 (MP TB) · `4241d6f` Faz A (huni) · `1904757` Faz B–F (aday yaması, kontrollü vakalar, kampanya) · rapor commit'i |
| Kontrol kökü | `git worktree` @ `d1784ff`, sabit kopya, bağ değil |
| Aday kökü | `git archive HEAD` + `git apply research/ticaret-ai0/ADAY-IKI-YONLU-TRANSIT-BEKLETILDI.patch` |

Değişmeyenler: main, canlı Render ve önceki PR'lar (#69–#72).

## B. Mevcut AI analizi (Faz A)

Araç: `research/ticaret-ai0/funnel2.cjs`. Kanıt ve tablo: `evidence/ticaret-ai0/funnel/README.md`.

Huninin kopyaları salt gözlemdir. Kopyalar açıkken ve kapalıyken (`NOCLONE=1`) 120. ay Save8 SHA-256 ve RNG durumu birebir aynı çıktı.

Doğal kampanya: 100 sistem (`ulu`), 9 AI, 120 ay.

| | 11 | 99 | 404 |
|---|---|---|---|
| `aiTransitRequest` çağrısı | 312 | 1405 | 597 |
| Denenen liman çifti (bütçesiz) | 278 | 1381 | 1793 |
| Bütün izinlerle bile rota yok | 262 (%94) | 1375 (%99,6) | 1673 (%93) |
| · yapısal boşluk (her liman ara durak sayılsa bile ≤3 sıçramada yok) | 218 | 1164 | 1421 |
| · b, a'nın çıkış limanını tanımıyor | 41 | 211 | 252 |
| Yalnız a'nın izniyle açılır | 15 | 6 | 0 |
| İki yönde de izin gerekir | 1 | 0 | 120 (tek ayrı çift) |
| Gerçek bütçeyle izin değerlendirmesine ulaşan | **0** | **0** | **0** |
| Transit izni anlaşması | 0 | 0 | 0 |
| `aiPortInvestment` çağrısı / yapılan liman | 357 / 0 | 1417 / 0 | 690 / 0 |
| Kritik kıtlık (AI × kaynak × ay) | 14 | 0 | 181 |

Kanıtlanan kök nedenler, ağırlık sırasıyla:

1. **Yapısal liman seyrekliği (baskın, doğru davranış).** Transit adayı çiftlerin %78–%85'inde yoldaki hiçbir sistemde liman yok. Çıplak hat uzaklığı çoğunlukla 5 ile 9 arasında. Rota kuralı en fazla 3 sıçrama olduğundan hiçbir izin bu rotayı açamaz.
2. **Bilgi (%10–%15).** Rotanın başında `identifiedPort(b, source, a)` aranıyor: karşı taraf a'nın limanını tanımalı. Bu da doğru bir kısıt.
3. **Kusur: geri yön ön koşulu.** `aiTransitRequest`, izinleri değerlendirmeden önce b → a yönünde izinsiz bir rota istiyor (`aiPortRoute(b,a,…)`). Oysa Transit İzni taşıyıcı başınadır (`portRight(owner, carrier)`). Koridor iki yönde de aynı üçüncü taraf limanından geçiyorsa b'nin de izne ihtiyacı olur ve bu ön koşul yapısal olarak hiç sağlanamaz. Gözlenen etki: 404'te bir çift 20 ay boyunca bu yüzden elendi; şartlar 120 denemenin 120'sinde olumluydu.
4. **Rota bütçesi.** Yalnız a'nın izniyle açılan çiftler (11'de 15, 99'da 6) gerçek turda hiç denenmedi, çünkü `budget.routes` ortak ve önceki ortaklarda tükeniyor. Çiftler yakınlığa göre sıralanmıyordu.

Kaçırılan gerçek fırsatlar küçük: üç tohumda iki ayrı çift. Bunlardan biri yalnız 11'de kârlıydı.

## C. Transit diplomasisi

**Mevcut (p50).** AI, kendi limanından ortağın limanına izinsiz rota bulamadığında (`aiPorts` boş dönünce) şu koşullar sağlanırsa izin ister:
- Etki ≥ 80;
- ortağın ihracı ile kendi açığı eşleşiyor;
- 180 günlük bekleme bitmiş;
- bilinen bir üçüncü taraf limanının izni rotayı açıyor.

Bedel sabit 36 Etki; ödemeden sonra en az 40 Etki kalmalı. Sahip insansa teklif gelen kutusuna gider (`UI.aiOffer`), AI ise `aiNegotiate` ile karşı teklif dahil karar verir.

**Aday** (`ADAY-IKI-YONLU-TRANSIT-BEKLETILDI.patch`, yalnız `commerce.js` `aiTransitRequest`, +18/−3 satır, yeni `aiDealWould` önizlemesi):
- Çiftleri yakından uzağa dener (`aiPorts` ile aynı sıra).
- Bilinen sahiplerin a'ya verebileceği bütün izinlerle bile ileri rota yoksa çifti tek rota bedeliyle eler. Bütçe tüketimi eski geri rota denetimiyle aynı.
- Geri yön izinsiz açık değilse b de **aynı AI sahipten, kendi Etki'siyle** izin alır. Bunun için iki teklif de, sahibin `aiNegotiate` kabul yolunun salt okunur önizlemesinden (`aiRespond` kabul ya da tek tur karşı teklif `aiCounterBudget` tavanı içinde) geçmeli.
- İnsan ya da misafir sahibe iki yönlü istek gönderilmez. İki taraf için de 180 günlük bekleme yazılır.

**Kontrollü vakalar** (`research/ticaret-ai0/kontrollu.cjs`, aynı fikstür iki kökte, kanıt `evidence/ticaret-ai0/kontrollu/`):

| Vaka | p50 | Aday |
|---|---|---|
| K1 iki yönde izin gereken koridor | izin yok, Etki harcanmadı | a ve b izinli, −36 / −36, sahip +72 |
| K2 aynı ay ikinci çağrı · sonraki ay | sözleşme yok | ikinci çağrı 0 rota / 0 Etki; ertesi ay a–b freight sözleşmesi (enerji ↔ mineral) |
| K3 b zaten izinli (tek yön) | a izin alır, −36 | aynı (eski yol korunur) |
| K4 aradaki limanı yok | hiçbir şey, 1 rota | aynı, 1 rota |
| K5 sahip insan (iki yön gerekli) | hiçbir şey | hiçbir şey; gelen kutusu boş (spam yok) |
| K6 düşük ilişki / güven | hiçbir şey | hiçbir şey; Etki harcanmadı |

Kabul ve ret sonucu: kontrollü vakada sahip 36 Etki'yi iki kez kabul etti. Güven 0 olduğunda sahip +20 Alaşım karşı teklifi yaptı ve teklif edenin tavanını aştı (3a/3b yolu); bu durumda izin yok ve Etki harcanmadı.

## D. Liman yatırımı

- `aiPortInvestment` üç tohumda da **hiç liman yapmadı** (357 / 1417 / 690 çağrı).
- En sık eleme: "eksi net ve ortak ihracı eşleşmesi yok" (%78–%89). Bu kapı yalnız aylık neti eksi olan kaynakta açılıyor.
- Uygun koloniye kadar gelen az sayıda vakada ileri rota yoktu (yine yapısal boşluk). İki vakada değer bedelin altında kaldı.
- AI limanları ticaret sözleşmesi için değil, olağan ekonomik yatırımla kuruyor (`invest:liman` 47 / 38 / 51).
- 120. ayda AI limanlarının sözleşmede kullanılma oranı: 11'de 29'da 11, 99'da 20'de 2, 404'te 30'da 7. Liman ticaret gelirini de etkilediğinden kullanılmayan liman tek başına kayıp sayılmaz.
- D2 kriz çelişkisi: 404'te kriz ya da kıtlık nedeniyle yatırım kapısında yalnız 6 eleme var. Krizden çıkışın liman olmadan imkânsız olduğu bir vaka gözlenmedi, bu yüzden istisna eklenmedi.
- D1 ve D3 için yeni bir getiri modeli **BAŞLANMADI**. Asıl kaldıraç ara (röle) limanlar olurdu, ama bu yeni bir yatırım davranışı ve ayrı faz kararı gerektirir (bkz. L).

## E. Ekonomik fayda

Teslim edilen kaynak (120. ay, teslim edilmiş konvoyların yükü):

| Tohum | p50 kontrol | Aday |
|---|---|---|
| 11 | 256 konvoy / 3414 | 244 / 3269 |
| 99 | 10 / 150 | aynı |
| 404 | 136 / 1955 | aynı |

Kritik kıtlık devlet-ayları (stok tabanın altında ve aylık net eksi):

| Tohum | p50 | Aday | Plasebo bandı |
|---|---|---|---|
| 11 | 14 | 6 | 3–14 |
| 99 | 0 | 0 | 0 |
| 404 | 181 | 181 | 103–196 |

- Ticaret maliyeti: 11'de aday iki izin için toplam 72 Etki harcadı.
- 11'de tetiklenen devletler (2 ve 6) iki kolda da kıtlık yaşamadı. 2–6 ticareti kontrolde de var; izin yalnız zamanlamayı ve rotayı değiştirdi (ilk 2–6 sözleşmesi 1260. gün, kontrolde 1320. gün).
- İç üretim ile karşılaştırma: aday bu karşılaştırmayı değiştirmiyor. `aiTerms`, `aiValue` ve `aiEconomyPlan` p50'deki gibi kaldı. Ayrı bir "iç üretim mi, dış ticaret mi" karar modeli (Faz B) **BAŞLANMADI**: huni bunun darboğaz olmadığını gösterdi.

## F. Doğal kampanyalar

Araç: `research/ticaret-ai0/camp.cjs`. Kanıt: `evidence/ticaret-ai0/kampanya/`. Kontrol c-, aday k-, plasebo p<gün>- (o günden sonraki ilk ay başında tek bir `rnd()` çekimi).

| Tohum | İlk ayrışma (aday) | Tetiklenme | Sonuç |
|---|---|---|---|
| 11 | 41. ay | 1230. gün: AI 2 ve AI 6, sahip AI 8'den iki yönlü izin | kıtlık 6 (bant 3–14), koloni 34 (bant 30–37) → **bant içinde** |
| 99 | yok | yok | 120 ay boyunca her ay Save8 SHA-256 kontrolle aynı |
| 404 | yok | yok | aynı. Çift, sahibin karşı teklifi (`karsi/karsi`) teklif edenin tavanını aştığı için elendi; 163 kez rota bütçesi çift döngüsünde tükendi |

Bazı plasebolar dünyayı değiştirmedi (bazı günlerde tek bir RNG çekimi sonucu etkilemiyor). Bant yalnız sonucu gerçekten değiştiren plasebolarla kuruldu. 11'de tetiklenme gününe yakın 1260 ve 1320 günlü plasebolar kullanıldı.

- 180 ve 240 ay: **NOT RUN**. Aday tetiklenmediği ya da bant içinde kaldığı için uzun koşu karar değiştirmezdi.
- 500 sistem (Faz G): **NOT RUN**. Koşul olan "küçük galakside fayda kanıtı" sağlanmadı.

## G. Multiplayer (Faz 0)

`MP8_SCEN=TB node tests/browser-mp8.cjs` (`tests/helpers/ticaret-ai0-mp.cjs`) **6/6 PASS**. Ortam: üretim relay süreci + TLS vekili + oyuncu başına hat, host + 2 misafir, gerçek STARS arayüzü.

| Adım | Ne doğrulandı |
|---|---|
| B0 | h–n1–n2–[C n3]–n4–n5–[B n6] zinciri; izin yokken rota yok |
| B1 | C gerçek masadan izin verir, B gelen kutusundan KABUL → izin ve rota |
| B2 | B'nin kargosu n3 üzerinden tam bir kez teslim edilir; yoldayken host ve misafir konvoy konumları eşit |
| B3 | İzin yolda geri alınır: teslim yok, kimse fazladan almaz (180 günlük bekleme kuralıyla konvoy yok olur) |
| B4 | Ara liman fethedilir: rota kapanır, yeni kargo teklifi host'ta reddedilir, stoklar değişmez |

- Kargolu kayıt → yeni oda, misafirlerin dönüşü, ikinci teslim yok: Chromium'da **NOT RUN**. Node'da `tests/ticaret_ag2_mp_test.js` M1 / M2 PASS (p50 fazında). Gerçek iki tarayıcı ve kayıt dosyasıyla tekrarlanmadı.
- Aday MP'ye dokunmuyor: host-yetkili, yalnız AI–AI, insan sahibe yeni istek yok. Ama yayınlanmadığı için MP aday koşusu yapılmadı.

## H. Save8 / RNG

- Çalışma zamanı değişmedi. Save8 v8, paket 4 ve protokol 1 p50 ile aynı.
- Huni ve kampanya araçlarının salt gözlem olduğu ölçüldü (kopyalı ve kopyasız koşuda Save8 SHA-256 ve RNG birebir aynı).
- Aday Save8 alanı eklemiyor; yalnız mevcut `aiTalk` ve `portTransit` alanlarına yazıyor. 99 ve 404'te 120 ay ay ay bayt eşit. 11'de ilk ayrışma 41. ay, yani ilk tetiklenme günü.
- Deterministik tekrar: aynı tohum ve aynı kökte iki ayrı koşu aynı son özeti verdi (c-11 `bd8dfa43…` üç kez, c-404 `5fdf5507…` üç kez).

## I. Performans

Çalışma zamanı değişmediği için **NOT RUN**; p50 değerleri geçerli: 100 sistem +%0,10, 500/120 −%0,67, 500/180 −%1,90.

Adayın p95'i ölçülmedi. Kaba gösterge: kampanya duvar saati iki kolda eşit (paralel koşuda 152–157 sn).

## J. Tam regresyon

- Tam Node: **NOT RUN**. 19 çalışma zamanı dosyası ve var olan bütün testler p50 ile aynı. Tek istisna `tests/browser-mp8.cjs`: yalnız `TB` senaryo satırı eklendi. p50 sonucu geçerli: 245 paket / 6551 PASS / 279 FAIL, eski FAIL'ler tarihsel. Bu fazda yeni FAIL üretebilecek bir çalışma zamanı değişikliği yok.
- Chromium: TB 6/6 PASS. Diğer MP senaryoları (TL / TA / SG / O / J / SE / X) çalışma zamanı değişmediği için yeniden koşulmadı.

## K. Paket

p51 **üretilmedi**. p50 ZIP'i (`releases/stars-faz96h10p50.zip`, SHA-256 `26a6b5e3…`, CRC32 `8D1FE07F`) geçerli.

## L. Açık işler

- Gerçek Android, uzak internet, LAN ve canlı Render kullanıcı testi: NOT RUN.
- Ticaret AI kaldıraçları (ayrı faz kararı gerekir):
  - **ara (röle) liman yatırımı**: yapısal boşluk %78–%85'in nedeni;
  - **ortak rota bütçesinde çift sıralaması**;
  - **liman bilgisinin karşı tarafa yayılması**: %10–%15'te b, a'nın limanını tanımıyor;
  - sabit 36 Etki izin bedelinin sahibin değerlemesiyle uyumsuzluğu (404 çiftinin elenme nedeni).
- İki yönlü transit adayı yamada bekliyor: mekanizma doğru, doğal fayda kanıtlanmadı. Yukarıdaki kaldıraçlardan biri izinli koridor sayısını artırırsa yeniden ölçülmeli.
- Ölçüldü ama bu fazda değiştirilmedi: `aiTransitRequest` geri yön ön koşulunun 404'teki tek çifti dışında doğal etkisi yok.
- Federasyon AI reformu (FED-AI-SİYASET.0): bu oturumda başlanmadı (talimat).
- Teknik borç: `TİCARET-AĞ.0` dalındaki tam grafik `dealTxBegin` maliyeti p50'de daraltılmış kapsamla çözüldü. Yazma günlüklü işlem hâlâ önerilen sonraki optimizasyon.

---

## Cevaplanması gereken sorular

| # | Soru | Cevap | Durum |
|---|---|---|---|
| 1 | AI neden transit izni istemiyordu? | Aday çiftlerin %93–%99,6'sında hiçbir izin rotayı açamıyor (yapısal liman boşluğu %78–%85, bilgi %10–%15). Kalan az sayıdaki çifti geri yön izinsiz rota ön koşulu (izin taşıyıcı başına) ve tükenen rota bütçesi eliyor. | ARAŞTIRILDI |
| 2 | Gerçek kârlı fırsatlar oluşuyor muydu? | Çok az: üç tohumda iki ayrı çift (11'de bir iki yönlü, 404'te bir iki yönlü; 404'ünkünde sahip daha yüksek bedel istiyor). Tek yönlü 15 / 6 çift bütçe yüzünden hiç denenmedi. | ARAŞTIRILDI |
| 3 | Hangi koşullar engelliyordu? | `aiPortRoute(b,a,…)` izinsiz geri rota ön koşulu; ortak `budget.routes`; `identifiedPort(b,source,a)`; ≤3 sıçrama rota kuralı (doğru). | ARAŞTIRILDI |
| 4 | AI şimdi gerektiğinde izin alabiliyor mu? | p50'de (yayındaki sürüm) iki yönlü koridorda hayır. Adayda evet (kontrollü K1 / K2). Aday yayınlanmadı. | KODLANDI, TEST BEKLİYOR (yama, uygulanmadı) |
| 5 | İzinden sonra fiziksel kargo taşıyor mu? | Kontrollü K2'de ertesi ay freight sözleşmesi imzalandı. Doğal 11'de 2–6 sözleşmeleri sürdü (teslim 244). | KISMEN TAMAMLANDI |
| 6 | Gereksiz izne Etki harcıyor mu? | Hayır: izin yalnız rotayı gerçekten açıyorsa ve şartlar olumluysa; 180 günlük bekleme; insan sahibe iki yönlü istek yok; ret ya da tavan aşımında Etki harcanmıyor (K5 / K6). | KODLANDI, TEST BEKLİYOR |
| 7 | Liman yatırımını doğru değerlendiriyor mu? | `aiPortInvestment` hiç tetiklenmiyor (eksi net eşleşmesi kapısı); limanlar olağan yatırımla geliyor. Yeni getiri modeli yazılmadı. | ARAŞTIRILDI |
| 8 | Yapılan limanlar kullanılıyor mu? | Sözleşmede kullanılan AI limanları 120. ayda 11 / 29, 2 / 20 ve 7 / 30. | ARAŞTIRILDI |
| 9 | İç üretim ile dış ticareti karşılaştırabiliyor mu? | Mevcut `aiValue` / `aiEconomyPlan` yolu değişmedi; ayrı bir karşılaştırma modeli yazılmadı (huni darboğazı orada göstermedi). | BAŞLANMADI |
| 10 | Gerçek kaynak krizleri azaldı mı? | Kanıtlanmadı. 11'de kıtlık 14 → 6 ama plasebo bandı 3–14; 99 ve 404 değişmedi. | ARAŞTIRILDI |
| 11 | İyileşme plaseboya göre anlamlı mı? | Hayır, bant içinde. | ARAŞTIRILDI |
| 12 | 100 / 500 sistem performansı korundu mu? | Çalışma zamanı p50 ile aynı, p50 kapısı geçerli; aday ölçülmedi. | TAMAMLANDI VE TEST EDİLDİ (p50) / aday NOT RUN |
| 13 | Save8 / RNG bütünlüğü korundu mu? | Evet: çalışma zamanı aynı; aday 99 / 404'te 120 ay bayt eşit, 11'de ilk ayrışma tetiklenme ayında. | TAMAMLANDI VE TEST EDİLDİ |
| 14 | MP kargo ve izin testleri tamamlandı mı? | Ara liman geçişi, izin kaybı ve ara liman fethi Chromium'da 6/6. Kargolu kayıt → yeni oda yalnız Node'da (M1 / M2). | KISMEN TAMAMLANDI |
| 15 | Yeni diplomasi regresyonu oluştu mu? | Hayır; çalışma zamanı değişmedi. Aday tek yönlü yolu ve karşı teklifi koruyor (K3 / K6). | TAMAMLANDI VE TEST EDİLDİ |
| 16 | Yeni sürüm üretildi mi? | Hayır, p51 yok (fayda kapısı geçmedi). | BLOKE OLDU (kabul kapısı) |
| 17 | Android ve Render testleri NOT RUN mı? | Evet, hepsi NOT RUN. | BAŞLANMADI |
| 18 | Render'da hangi dal denenmeli? | `claude/stars-ticaret-ag2` (p50). Ticaretsiz geri dönüş için `claude/stars-saha-guvence1` (p49). | — |
| 19 | En güvenli oynanabilir sürüm? | p50 `claude/stars-ticaret-ag2` (otomatik testlerden geçmiş, saha kabulü yok). Bu dal p50 ile aynı çalışma zamanını taşır. | — |
| 20 | FED-AI-SİYASET.0 için ekonomik altyapı ve riskler? | Hazır: fiziksel kargo, Transit İzni, federasyon `ticaret` yasasının izin sayılması (`portRight`), AI–AI daraltılmış işlem, salt gözlem huni ve kampanya araçları. Açık riskler: yapısal liman boşluğu yüzünden federasyon içi ticaret de seyrek kalır; iki yönlü izin ve ortak rota bütçesi; sabit izin bedeli; 500 sistemde ticaret AI ölçümü yok. | ARAŞTIRILDI |

## Yeniden üretim

```sh
node research/ticaret-ai0/funnel2.cjs <kök> 11 120 out.json      # NOCLONE=1 → salt gözlem eşitliği
node research/ticaret-ai0/camp.cjs <kök> 11 120 out.json          # PLACEBO_DAY=<gün>
node research/ticaret-ai0/kontrollu.cjs <kök>
MP8_SCEN=TB node tests/browser-mp8.cjs
# aday kökü: git archive HEAD | tar -x -C <dizin> && (cd <dizin> && git apply research/ticaret-ai0/ADAY-IKI-YONLU-TRANSIT-BEKLETILDI.patch)
```
