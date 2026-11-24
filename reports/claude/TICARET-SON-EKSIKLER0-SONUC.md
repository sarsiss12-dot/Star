# TİCARET-SON-EKSİKLER.0 — Sonuç raporu

Tarih: 24 Kasım 2026 · Dal `claude/stars-ticaret-son-eksikler0` · {{PR}}
Yayın adayı: **96h10p54 / stars-v96h10p54 / MP.8.9b53** · Save8 v8 (geriye uyumlu, isteğe bağlı yeni alan) · MP paket 4 · protokol 1.
Kullanıcı fiziksel test yapamıyor; bütün kabul otomatik (Node + gerçek Chromium + üretim relay süreci + TLS vekili).
Fiziksel Android, gerçek uzak internet, LAN ve canlı Render: **NOT RUN**.

## 1. Başlangıç HEAD

`1dec7046fa843203e94fb74ab2733e7e04bf3738`
- Dal: `claude/stars-ticaret-final0`, PR #78.
- Sürüm: p53 / MP.8.9b52.
- Uzak dal bu HEAD'deydi; ilerleme yoktu.
- Kontrol kökü: `git archive 1dec704` (sabit kopya).

## 2. Bitiş HEAD

Son kod / kanıt commit'i `1aaa71d` (p54 sürüm kimlikleri) (raporun kendi commit'i ayrıca son yanıtta bildirilir).

## 3. Değiştirilen dosyalar

**Çalışma zamanı (5 dosya):**
- `commerce.js`: koordinatör, yenileme, uyarı, AI yenileme, önbellek sıfırlama.
- `commerce-ui.js`: Liman izinleri bölümü, form düğmesi, eylemler.
- `diplomacy.js`: süre / yenileme penceresi sabitleri, bitişten uzatma.
- `main.js`: `transit` bildirim türü, BUILD_ID.
- `ui.js`: `openNote` dalı.
- Ayrıca `sw.js` (CACHE) ve `RELEASE-MANIFEST.json`.

**MP:**
- `research/mp0/mp-core.js`: `transitVote` / `transitCancel` / `transitAsk` komutları, bildirim sarmalayıcısı, p54 paket kabulü.
- `research/mp6/mirror.js`: taraflara transit kaydı.
- `research/mp6/client/guest-stars.js`: komut sarmalayıcıları, eylem kapısı, kart.
- `research/mp1/client/view.js` ve `research/mp1/server/relay.js`: sürüm.

**Testler:**
- `tests/ticaret_son_eksikler0_test.js` (23)
- `tests/ticaret_son_eksikler0_mp_test.js` (7)
- `tests/ticaret_son_eksikler0_equivalence_test.js` (4)
- `tests/browser-ticaret-son-eksikler0-sp.cjs` (8 × 3 çözünürlük)
- `tests/helpers/ticaret-son-eksikler0-mp.cjs` (MP8 TZ, 8)
- `tests/browser-mp8.cjs`: TZ kaydı.
- `tests/ticaret_tamamlama0_transit_test.js`: T5 güncellendi, §19.

**Araç:** `research/ticaret-son-eksikler0/camp2.cjs`.

## 4. Çok taraflı onay mimarisi

Kapsam yalnız ticaret transit izinleri (`portTransit`) ve bunların Etki bedeli. İkinci bir diplomasi ya da ticaret motoru yazılmadı.

- **Kayıt:** `G.commerce.transit[]` ve `nextTransit`. Yalnız kullanıldığında yazılır; hiç tetiklenmeyen dünyanın Save8 baytları değişmez (§20).
  - Alanlar: `{id, by, a, b, source, target, legs:[{o: liman sahibi, c: taşıyıcı, pay, s?: kullanılan liman, skip?}], votes:{devlet: pending|yes|no}, born, until, st, why, done?, terms?}`.
- **Durum makinesi:** `pending → committed | rejected | expired | cancelled | invalid`.
  - Onay toplama ile uygulama aynı çağrıda ayrılır. Son onay gelince `transitCommit` çalışır; ayrı bir "approved" ara durumu kayda yazılmaz.
  - Bir talep bir kez uygulanır. Sonuçlanmış talebe yeni oy reddedilir.
- **Gereken izinler (`transitPlan`):** iki yön (a → b, b → a) için en küçük izin kümesi.
  - Aday sahipler: temaslı, savaşsız, ambargosuz, tanınan limanlı.
  - Adayların bütün izinleriyle rota yoksa talep açılmaz.
  - Varsa izinler sırayla çıkarılır; iki yön hâlâ açıksa o izin düşer. Deterministik: kimlik sırası.
  - Üç sıçrama kuralı ve rota motoru (`route`) aynen kullanılır.
- **Taraflar ve kararlar:**
  - İnsan taraf (liman sahibi ya da ödeyecek taşıyıcı) yalnız kendi oyunu verir.
  - AI taraf, mevcut `aiDealWould` / `aiRespond` önizlemesiyle açılışta ve uygulama anında yeniden değerlendirilir. Bu Etki ≥40 rezerv; ortak ödeyen için genel ticaret anlaşması koşulunu da kapsar.
- **Uygulama (`transitCommit`):**
  - `transitValid` ile yeniden doğrulama (§7).
  - Ardından `dealTxBegin` içinde her gereken izin için mevcut `executeDeal({from: taşıyıcı, to: sahip, give: Etki 36, want: portTransit})`.
  - AI talebinde aynı işlemde `aiNegotiate` ile ilgili düzenli sözleşme de kurulur.
  - Herhangi bir adım başarısızsa `dealTxRollback`: dünya, RNG ve yetki alanları geri döner; talep `invalid` olur ve gerekçesi yazılır.
- **Süre:** talep 120 gün açık kalır, sonra `expired`. Gün sonu süpürmesi yalnız kayıt varken çalışır. Bekleyen talep sınırı 16, toplam 64.

## 5. İnsan oyuncuların iki yönlü transit akışı

1. **AI talebi.** `aiTransitRequest` tek AI sahiple iki yönü açamazsa ve bir insan aday varsa `aiTransitHuman` devreye girer.
   - Yalnız en yakın iki liman çifti denenir.
   - Plan, ödeme bedeli ve düzenli sözleşme şartları (`aiTerms`) hesaplanır, talep açılır, 180 gün bekleme konur.
   - AI–AI yolu aynen kaldı.
2. **İnsana bildirim.**
   - Tek oyunculu / host: bildirim kartı.
   - Misafir: aynadan türetilen kart (`mptransit:<id>`).
   - Karta dokununca TİCARET → **Liman izinleri** açılır. Gösterilenler:
     - talep eden;
     - her bacak için hangi limanın (sistem) hangi taşıyıcıya açılacağı;
     - izin süresi (360 gün), bedel ve kimin ödeyeceği;
     - oyuncunun alacağı karşılık (bacak başına 36 ◈);
     - her tarafın onay durumu, son gün;
     - "onaylar tamamlanınca düzenli ticaret sözleşmesi de imzalanır" bilgisi.
3. **Karar.** **ONAYLA / REDDET** ve talep edene **VAZGEÇ**.
   - Onay sonrası diğer onay bekleniyorsa "Onayın kayıtlı; diğer tarafların kararı bekleniyor. İşlem henüz uygulanmadı." yazar; başarı gösterilmez.
4. **Oyuncunun kendi talebi.** Sözleşme formunda rota "Gereken transit izni" diyorsa **⚓ GEREKEN LİMAN İZİNLERİNİ İSTE (iki yön)** çıkar.
   - Oyuncu kendi bacağını öder, ortak kendi bacağını öder.
   - AI ortak yalnız genel ticaret anlaşması ve Etki rezervi varsa kabul eder; insan ortak kendi ödeme onayını verir.
   - Bütün sahipler AI ise tek işlemde uygulanır (H1); insan sahip varsa onay beklenir (H2, V8, Z4).

## 6. İki ayrı insan sahibinin onayı

- **Fikstür:** a → [C limanı] → [D limanı] → b zinciri. Plan dört bacak üretir (`C:a, C:b, D:a, D:b`); oylar `{C, D}`.
- **Node M2 / M9:** C'nin onayı tek başına hiçbir şey yazmaz. D'nin onayıyla dört izin; her sahibe +72, her taşıyıcıdan −72; tek X–Y sözleşmesi.
- **MP Node P1–P3 ve MP8 TZ Z1 / Z3:** iki ayrı misafir (B, C), gerçek dokunuşla.
- **Yetki:** taraf olmayanın oyu `Bu talepte karar yetkin yok`.
  - MP'de karar veren devlet her zaman koltuğun devletidir. `empire` alanı farklı gönderilirse çerçeve `forged-empire` ile reddeder (P2).

## 7. Atomik ödeme ve geri alma

`transitValid` son onayda ve her oyda şunları denetler:
- taraflar yaşıyor mu;
- a ↔ b arasında savaş, ambargo, temas;
- çıkış / varış limanı hâlâ aynı sahipte mi;
- her bacak için sahip ↔ taşıyıcı arasında savaş, temas, ambargo;
- taze plan; onaylanmamış yeni bir izin gerekiyorsa geçersiz (örneğin fethedilen liman);
- rota, üç sıçrama ve hacim;
- taşıyıcının Etki'si (bedel + `dealQuote` maliyeti);
- AI tarafların güncel kararı.

| Vaka | Sonuç |
|---|---|
| M3 / P4 / Z4: ikinci sahip reddetti | `rejected`, ödeme ve izin yok |
| M6: onaydan sonra liman fethedildi | `invalid` ("onaylanmamış başka bir liman izni gerekiyor"), eski sahibin onayı kullanılmadı, kimseye ödeme yok |
| M7: onay sırasında savaş | `invalid` |
| M8: son onayda Etki yetersiz | `invalid`, kısmi ödeme yok |
| M4: ilk onaydan sonra oyuncu ayrıldı | talep başarıya dönmedi, 120 günde `expired`, ödeme yok |
| M5 / P2 / Z2: tekrar edilen onay | ikinci oy reddedildi (aynı cid önbellekten, farklı cid motor kuralıyla), tek ödeme |
| T8 (p51'den): `executeDeal` ortasında enjekte edilen hata | `dealTxRollback` ile bayt-bayt geri |

## 8. Onayların Save8 ile korunması

- `Commerce.restore` yeni alanı sıkı doğrular:
  - kimlikler, durum adı, taraf kümesi;
  - oy anahtarı tarafa ait olmalı ve talep eden olmamalı;
  - oy değeri `pending|yes|no`;
  - bekleyen talepte `no` oyu yok, uygulanan talepte bütün oylar `yes`;
  - `done` alanı, `nextTransit` sayacı.
- Bozuk kayıt reddedilir (K2: dört bozma türü).
- **M10 / P5:** onaylardan biri verilmişken alınan Save8 / MP paketi aynı durumla açılır; son onay yeni dünyada bir kez uygulanır.
- **M11 / Z6:** uygulanmış talep yüklemede yeniden uygulanmaz.
- **Z6:** kayıt → relay yeniden → yeni oda sonrası `G.commerce` (transit dahil) bayt-bayt aynı.
- **Eski kayıt:** p53'te 60 ay oynanmış kayıt (sözleşme, konvoy, izin) adayda açılır, `G.commerce` birebir aynı kalır, transit alanı eklenmez (§20).

## 9. İzin yenileme

- Süre `PORT_TRANSIT_DAYS=360`.
- **Yenileme penceresi:** izin bitmeden son `PORT_TRANSIT_RENEW=60` gün.
  - Pencere içinde aynı `portTransit` maddesi artık "zaten yürürlükte" sayılmaz.
  - Uygulanınca yeni bitiş mevcut bitiş + 360 olur (M13). Bitmiş izin bugünden başlar (M14).
  - Pencere dışında madde yürürlükte sayılır; uzatma olmaz.
  - En uzun izin kalan ≤ 60 + 360 = 420 gün; süresiz izin oluşmaz.
- Yenileme mevcut müzakere yoluyla yapılır (`dealQuote`, `executeDeal`, `aiRespond`, MP `offer` / `respond`). Ayrı bir yenileme motoru yok.
- **Tek bedel:** yenileme anında uzatılmış izin yeniden "yürürlükte" sayılır, aynı madde ikinci kez uygulanmaz.
  - M13 `again=false`, A1 ikinci istek yok.
  - MP'de tekrar edilen kabul mevcut teklif deposunun tek kabul kuralıyla reddedilir.
- **Oyuncu arayüzü (Liman izinleri):**
  - İzin satırında: sahibi, kullanan, bitiş günü, kalan gün ve izni kullanan kendi aktif sözleşmeleri.
  - Pencere içinde **YENİLEME İSTE** (masa izin + 36 ◈ ile açılır) ya da sahibe **SÜREYİ UZAT (teklif)**.
  - **İZNİ GERİ AL** düğmesi.
  - Başka devletlerin sözleşmeleri gösterilmez.
- **Yoldaki konvoy:**
  - Yenilenmeyen izin (M16): konvoy izinsiz ara limandan geçmez, mevcut kurala göre bekler ya da kaybolur. Muhasebe tutarlı, çift teslim yok.
  - Yoldayken yenilenen izin (M17): konvoy devam eder, her biri tek makbuzla teslim edilir; bedel bir kez (36).
  - Yenileme daha önce kaybedilmiş kargoyu geri getirmez.
- **Otomatik yenileme tercihi (B5, isteğe bağlı):** eklenmedi. Oyuncu adına otomatik ödeme ya da izin yok; varsayılan bildirim + açık karar.

## 10. Yenileme uyarıları

- `Commerce.permitWarn`: insan tarafı olan her izin için bitişe 60 ve 30 gün kala ve bitişte birer kart (M12).
- Eşik geçişi tick'ler arasında bir kez yakalanır.
  - Kayda alan yazılmaz.
  - Kayıt yüklemesi başlangıcı sıfırlar; geçmiş eşikler uydurulmaz.
  - Aynı aşamada ikinci uyarı yok, bitişten sonra uyarı yok.
- **Taşıyıcıya giden metin:** sahip, kalan gün / bitiş günü, etkilenen kendi sözleşmeleri (`#id`), "yenilemek için müzakere masasından izni yeniden iste".
- **Sahibe giden metin:** yalnız "X için verdiğin izin … bitiyor". Taşıyıcının sözleşmeleri gösterilmez.
- MP'de aynı metin uzak insana `NOTE` olarak gider (`transitNote` sarmalayıcısı).

## 11. AI'nın yenileme kararları

`Commerce.aiPermitRenew(c)` her AI için aylık ticaret turunda (`aiOpportunityTick`) çalışır. Koşullar:
- izin son 60 günde olmalı;
- izni kullanan aktif kendi sözleşmesi olmalı (`permitUsers`): artık kullanılmayan hat yenilenmez (A2);
- Etki rezervi (36 + 40) olmalı;
- `dealQuote` geçmeli: savaş, ambargo, temas kapıları;
- 30 gün bekleme olmamalı.

Davranış:
- AI sahip, `aiDealWould` önizlemesinde kabul etmeyecekse pazarlık açılmaz. İlk kampanyada tohum 11 / 1530. günde sahip iki kez reddetmişti; boşa ret kaydı üretmemek için eklendi.
- İnsan sahip: tek oyunculuda gelen kutusu teklifi, MP'de bekleyen MP teklifi. Onay varsayılmaz.
- Reddedilen aday `aiBalance` ihtiyaç yaması geri getirilmedi. Ticaret oranları ve üretim değerleri değişmedi.

## 12. Mobil dokunmatik sonuçları

Ortam: gerçek Chromium, `isMobile` + `hasTouch`, `touchscreen.tap`. Her dokunuştan önce `elementFromPoint` denetimi.

| Vaka | 800×360 | 844×390 | 901×411 |
|---|---|---|---|
| V1 kart → Liman izinleri (bacaklar, bedel, son gün, taşma yok) | PASS | PASS | PASS |
| V2 ONAYLA → bekleme, başarı gösterilmez | PASS | PASS | PASS |
| V3 ikinci sahip → Uygulandı, sözleşmelere dönüş | PASS | PASS | PASS |
| V4 REDDET | PASS | PASS | PASS |
| V5 süresi dolmuş karta dokunma | PASS | PASS | PASS |
| V6 YENİLEME İSTE → masa → +360 | PASS | PASS | PASS |
| V7 konvoy / sözleşme ekranına dönüş | PASS | PASS | PASS |
| V8 formdan GEREKEN LİMAN İZİNLERİNİ İSTE | PASS | PASS | PASS |

- Toplam 24/0. Regresyon tekrarı: 24/0 (`evidence/ticaret-son-eksikler0/regresyon/sp-son-eksikler0.json`).
- p53'ün `browser-ticaret-tamamlama0-sp` testi (U1–U5): 15/0, p54 ile.
- V2–V5 ve V8'de ikinci insan sahip `__mpHumanVoter` ile benzetildi; onayı motor yoluyla verildi. Gerçek iki misafirli yol TZ'de.

## 13. MP host + misafir kabulü

**Node (`ticaret_son_eksikler0_mp_test.js`, gerçek mp-core komutları):** P1–P7 7/0.
- İki misafir sahip.
- Ayna yalnız taraflara gider; AI şart miktarları gitmez (`trade:1`).
- Tekrar ve sahte devlet reddedilir.
- Ret.
- MP paketi → yeni host.
- Host ↔ misafir koridoru.
- Misafir aynası motorun `deserialize` doğrulamasından geçer.

**Chromium `MP8_SCEN=TZ`** (üretim relay + TLS vekili, host + B + C ayrı profiller): **8/0** (son regresyon koşusu; kanıt `evidence/ticaret-son-eksikler0/regresyon/TZ-mp8-TZ.json`, ekran görüntüleri `chromium/`).

| Adım | İçerik |
|---|---|
| Z1 | AI koridoru iki misafir limanından; B dokunuşla ONAYLA; izin / ödeme yok; B'de bekleme |
| Z2 | B'nin hattı kopar ve döner; onay korunur; tekrarlanan onay reddedilir |
| Z3 | C ONAYLA → tek işlem, dört izin, sözleşme; iki ayna Uygulandı, kart kalkar |
| Z4 | host ↔ B koridoru; C REDDET → kısmi işlem yok |
| Z5 | MP yenileme: B YENİLEME İSTE → C KABUL → host / B / C aynı bitiş |
| Z6 | kayıt → kapanış → relay yeniden → yeni oda → misafirler döner; `G.commerce` birebir; kargo tek teslim |

İlk TZ koşusunda Z1 FAIL verdi. Kök neden: misafir eylem kapısı yeni `transit*` eylemlerini tanımıyordu. Düzeltildi (guest-stars eylem listesi). İkinci koşuda Z6 FAIL verdi: 180 günlük bekleme 9 sıçramalık koridora yetmedi; test 360 güne çıkarıldı. İlk FAIL'ler raporda korunur.

## 14. Uzun MP oturumu

`MP8_SCEN=I`, host + iki misafir; gerçek döngü, ayna eşitliği, harita / filo / zaman ilerlemesi denetimleri:
- 100 sistem / 9 AI (`MP8_I_FF=120 MP8_I_MIN=8`): **4/0** (I0 kurulum, I1 8 dk uzun oturum, I2 görsel tutarlılık, I3 sensör paylaşımı). I1 test başlığındaki "500 sistem / 16 AI" ifadesi testte sabit metin; gerçek yapılandırma I0 satırında "3 insan + 9 AI, ulu".
- 500 sistem / 16 AI (`MP8_I_MIN=15`): **4/0** (I0 "3 insan + 16 AI, s500", I1 15 dk: hız değişimi, açık pencere, arka plan, kısa kopma, emirler; pencere kapalıyken misafir dünyası 20 sn'den uzun durmaz).

## 15. Harita ve kargo senkronizasyonu

- I senaryosu misafirde zaman, filo hareketi, sınırlar ve gezegen gelişmelerinin host ile eşit ilerlediğini denetler (pencere açık bekleme ↔ kapalı donma ayrı).
- Kargo:
  - TZ Z6 ve TR: konvoy konumu misafir aynasında host ile aynı;
  - Z5: izin bitişi üç tarafta aynı.
- Ticaret değişiklikleri ayna boyutunu yalnız taraf olunan talep kadar büyütür.

## 16. Yoğun konvoy performansı

Codex koridoru: 500 sistem, 499 sıçrama. N=12 ABBA, 60 × `Commerce.tick(.5)`.

| Konvoy | p52 → aday Δ medyan | p53 → aday Δ medyan | A/A (p53 ↔ p53) | Save8 / RNG |
|---|---|---|---|---|
| 8 | −%45,7 | +%3,0 | −%4,3 | aynı |
| 32 | −%68,0 | −%2,5 | +%9,7 | aynı |
| 64 | **−%62,1** | −%7,2 | +%5,9 | aynı |

- p53 kazancı korundu; aday ile p53 arasındaki fark A/A bandı içinde.
- **Önbellek güvenliği:** tick içinde izin verilir ya da geri alınırsa önbellek anında sıfırlanır (`memoReset`: `applyItems` portTransit, `revokePortTransit`, `transitCommit`).
- **Anahtar aralığı:** devlet ≤ 255, sistem ≤ 65535. Dışındaysa önbellek atlanır (K1: 63 / 999 kimliklerinde çakışma yok; en büyük anahtar < 2^53).

## 17. Normal oyun performansı

Node ABBA, sessiz makine (eşzamanlı Chromium yok), ikişer tekrar, aynı kayıt.

| Kayıt | AB Δ p50 | AB Δ p95 | A/A Δ p50 | A/A Δ p95 |
|---|---|---|---|---|
| 100/9/m120, n=80 | −%1,45 / +%1,24 | −%4,71 / +%2,46 | +%1,57 / +%1,47 | +%0,16 / −%0,80 |
| 500/16/m120, n=36 | −%1,14 / +%1,55 | −%4,28 / +%1,33 | −%0,35 / −%0,35 | +%2,93 / −%3,29 |
| 500/16/m180, n=36 | −%0,14 / −%0,88 | +%2,74 / −%1,37 | +%0,94 / +%0,36 | −%4,86 / −%3,21 |

- Her ölçümde p95 ≤ +%2,74, katı %5 kapısının altında. FİNAL.0'daki +%5,70 / +%5,14 belirsizliği bu kez iki tekrarda da görülmedi. **PASS.**
- İşlev düzeyinde: `Commerce.aiOpportunityTick` ortalaması 20,49 ↔ 20,57 ms, `Commerce.tick` 21,69 ↔ 21,69 ms (100 sistem).
- Her örnekte iki kolun Save8'i aynı.

## 18. Ekonomik AI koruması

Kampanyalar `research/ticaret-son-eksikler0/camp2.cjs` ile koşuldu: p53 ↔ aday, ay ay Save8 SHA, tetik izleri.

| Kampanya | Yeni davranış tetiği | İlk ayrışma | Sonuç (kıtlık, koloni, sözleşme, teslim) | Son RNG |
|---|---|---|---|---|
| 100/9 tohum 11, 240 ay | 1530. gün AI yenileme (sahip önizlemede reddetti, pazarlık açılmadı) | 51. ay (tetik ayı) | birebir aynı: 6 / 70 / 54 / 256 | aynı |
| 100/9 tohum 99, 240 ay | yok | yok (240 ay birebir) | aynı | aynı |
| 100/9 tohum 404, 240 ay | yok | yok | aynı | aynı |
| 500/16 tohum 11, 120 ay | yok | yok | aynı | aynı |

- 120. ay sonuçları 240 aylık koşuların içindedir; tohum 99 / 404 ve 500 sistemde 120. ayda da birebir.
- Tohum 11'deki tek fark, yenileme bekleme kaydı (`aiTalk`).
- Tek oyunculu eşdeğerlik testi (orta / 6 AI, tohum 11 / 22 / 404, 48 ay): tetik yok, ay ay birebir.
- Yapay bonus yok, zorla ticaret yok. Ödemeler yalnız geçerli izin uygulanınca; ret / geçersizlikte kayıp yok (M3, M6–M8). İthalat yalnız gerçek teslimde stoka yazılır (değişmedi; M16 / M17 muhasebesi).

## 19. Tam Node regresyonu

- **250 paket / 6606 PASS / 279 FAIL.** p53 tabanı 247 / 6576 / 279; +3 paket = bu fazın Node testleri (23 + 7 + 0: eşdeğerlik testi `run-all` içinde kontrol kökü olmadığı için NOT RUN, ayrıca `STARS_CONTROL_ROOT` ile koşuldu: 4/0). Başarısız 56 paketin listesi ve paket içi sayıları p53 ile **birebir aynı** (`evidence/ticaret-son-eksikler0/node/fail-listesi.txt`): yeni FAIL yok; eski 279 FAIL saklanmadı, tabanla aynı tarihsel koruma / ortam vakaları. Audit / navy dosyaları koşudan sonra geri alındı.
- Bilinçli test güncellemesi: `ticaret_tamamlama0_transit_test.js` T5.
  - p51–p53'te "insan sahip + iki yön: istek yok" (bilinen sınırlama) sınanıyordu.
  - Bu fazın amacı o sınırlamayı kaldırmak. T5 artık "talep açılır; insan onaylamadan izin / ödeme yok" diyor.
  - Değişmeyen kural, yani insan adına izin ya da ödeme yazılmaması, korunuyor.

## 20. Eski kayıt uyumluluğu

- Save sürümü 8 kaldı. Yeni alan isteğe bağlı (`G.commerce.transit`, `nextTransit`) ve tetiklenmeyen dünyada yazılmaz.
  - Tetiklenmeyen kampanyalar ve 48 aylık eşdeğerlik testi p53 ile bayt-bayt aynı.
- p53 Save8 adayda açılır, `G.commerce` birebir (eşdeğerlik testi 4. vaka). p41–p52 kayıtları tam Node'daki mevcut uyumluluk paketleriyle sınanıyor.
- MP paket yükleyicisi p54'te p41–p53 kabul eder. p53 paketi build kapısından geçer.
- Eski istemci yeni alanı içeren kaydı açamaz. Bu ileri uyum değildir ve beklenen davranıştır.

## 21. Yayın kararı

**p54 güvenli yayın adayı olarak hazırlandı** (yayın engellerinin hiçbiri yok: kısmi ödeme, yetkisiz onay, tekrar ödeme, bozuk Save8, MP desync, yanlış teslim, yeni FAIL, kanıtlanmış perf gerilemesi, eksik insan transit kabul şartı).
- `releases/stars-faz96h10p54.zip`: 20 girdi, **968 220 bayt**, SHA-256 `c5f1b5b468cd68cbcd211089511a0fd1079923448dfb1e4887698be11325f5e5`, CRC32 `7BEC8B66`; iki paketleme bayt-bayt aynı; çıkarılan ZIP `verify-release --root` DOĞRULANDI (19 dosya, build 96h10p54). Kayıt `RELEASE-TICARET-SON-EKSIKLER0.json`.
- BUILD_ID `96h10p54` ↔ manifest ↔ sw CACHE `stars-v96h10p54` ↔ relay `/mp/version` / misafir `MP_VERSION` `MP.8.9b53` birlikte. mp-core p54, p41–p53 paketlerini kabul eder. Save sürümü 8 (geriye uyumlu genişletme).
- Render'da denenecek dal: `claude/stars-ticaret-son-eksikler0`; geri dönüş `claude/stars-ticaret-final0` (p53). main ve canlı Render değiştirilmedi.

## 22. Kalan saha testleri

- Fiziksel Android dokunmatik ve sanal klavye: NOT RUN.
- Gerçek uzak internet (iki ayrı ağ), LAN: NOT RUN.
- Canlı Render (bu dal yayınlanmadı): NOT RUN.
- İki gerçek insanla çok taraflı onayın saha kullanılabilirliği (karar süreleri, bildirim yoğunluğu): NOT RUN.

## 23. Ticaretin kesin kapanış durumu

Geliştirme açısından ticaretin bilinen önemli işlevsel eksikleri bu fazla kapandı: insan sahipli iki yönlü ve iki ayrı insan sahipli transit, atomik onay / ödeme, kayıt ve MP sürekliliği, izin yenileme ve uyarıları, uzun MP oturumu, katı %5 perf kapısı. Otomatik kabul tamam.
Ayrı tutulanlar: (1) saha kabulü (fiziksel Android, gerçek internet, Render) NOT RUN; (2) önceki fazlardan devreden, bu fazın kapsamı dışında kalan AI ekonomi notları (limansız kriz devleti 404'ün liman yatırımı, rota bütçesi sırası, `aiBalance` gelen kargo — reddedilen aday) değişmedi; bunlar insan oyuncunun kullanabileceği bir işlev eksiği değil, AI kalite konusudur; (3) isteğe bağlı otomatik yenileme tercihi eklenmedi (talimatın "zorunlu yapma" maddesi; varsayılan açık karar). Ticarette yeni iş saha bulgusu olmadan açılmamalı; sıradaki geliştirme savaş / federasyon AI.

## Test matrisi (M1–M20)

| Kod | Senaryo | Kanıt | Sonuç |
|---|---|---|---|
| M1 | Tek insan limanı, iki taşıyıcı | Node M1, SP V1–V3 | PASS |
| M2 | İlk onay var, ikinci bekliyor | Node M2, SP V2, TZ Z1 | PASS |
| M3 | İkinci onay reddedildi | Node M3, MP P4 | PASS |
| M4 | Birinci onaydan sonra oyuncu ayrıldı | Node M4 (süre dolar, ödeme yok), TZ Z2 (hat kopar, onay korunur) | PASS |
| M5 | Tekrar edilen onay paketi | Node M5, MP P2, TZ Z2 | PASS |
| M6 | Onay sonrası liman fethi | Node M6 | PASS |
| M7 | Onay sırasında savaş | Node M7 | PASS |
| M8 | Yetersiz Etki | Node M8 | PASS |
| M9 | İki farklı insan limanı | Node M9, MP P3, TZ Z3 | PASS |
| M10 | Bekleyen işlemle Save8 | Node M10, MP P5 | PASS |
| M11 | Tamamlanmış işlemle Save8 | Node M11, TZ Z6 | PASS |
| M12 | Yenileme öncesi uyarı | Node M12 | PASS |
| M13 | Geçerli iznin yenilenmesi | Node M13, A1, SP V6, TZ Z5 | PASS |
| M14 | Bitmiş iznin yeniden verilmesi | Node M14 | PASS |
| M15 | Yenileme reddi | Node M15 | PASS |
| M16 | Yoldaki konvoy ve izin bitişi | Node M16 | PASS |
| M17 | İzin yenilendi, konvoy devam ediyor | Node M17 | PASS |
| M18 | MP host + 2 misafir çok taraflı işlem | MP P1–P7, TZ Z1–Z5 | PASS |
| M19 | MP yeni oda ve kargo tek teslim | TZ Z6 (+ TR) | PASS |
| M20 | Uzun MP oturumunda harita ve kargo senkronu | MP8 I 100/9 ve 500/16 | PASS |

Ek vakalar:
- H1 / H2: oyuncu talebi.
- A2: kullanılmayan izin yenilenmez.
- K1: önbellek anahtarı.
- K2: bozuk kayıt.
- V7 / V8: dönüş ve formdan talep.

## Son 10 soru

| # | Soru | Cevap |
|---|---|---|
| 1 | AI, insan sahipli bir ara limandan iki taşıyıcı için izin isteyebiliyor mu? | **Evet.** Tek AI sahiple iki yön açılmazsa `aiTransitHuman` iki taşıyıcının bacaklarını içeren onay talebi açar (M1, T5, SP V1, TZ Z1). |
| 2 | İki farklı insan oyuncunun onayı gereken ticaret güvenli kurulabiliyor mu? | **Evet.** Her sahip yalnız kendi oyunu verir; son onaya kadar hiçbir şey yazılmaz; son onayda yeniden doğrulama + tek işlem (M2 / M9, MP P1–P3, TZ Z1–Z3 iki gerçek misafirle). |
| 3 | Herhangi biri reddederse ödeme ve izinler doğru korunuyor mu? | **Evet.** Ret, süre dolması, fetih, savaş, yetersiz Etki: hiçbir izin / ödeme kalmaz (M3, M4, M6–M8, P4, Z4, V4, V5); işlem içi hata dealTxRollback ile geri alınır. |
| 4 | Aynı onay birden fazla kez uygulanabiliyor mu? | **Hayır.** İkinci oy motor kuralıyla, tekrar edilen cid MP önbelleğiyle reddedilir; uygulanan talep yüklemede yeniden uygulanmaz (M5, M10, M11, P2, Z2). |
| 5 | 360 günlük transit izni uzun sözleşmelerde yenilenebiliyor mu? | **Evet.** Son 60 günde aynı madde mevcut bitişten +360 uzatır (en çok 420 gün kalan; süresiz değil); oyuncu YENİLEME İSTE / SÜREYİ UZAT ile, AI kullandığı hat için kendiliğinden ister (M13, M14, A1, V6, Z5). |
| 6 | İzin yenileme oyuncuya açık ve anlaşılır biçimde bildiriliyor mu? | **Evet.** 60 / 30 / 0 gün kartları (tekrar yok), etkilenen kendi sözleşmeleri, Liman izinleri bölümünde kalan gün / bitiş / kullanan sözleşmeler (M12, V6). Fiziksel cihazda okunabilirlik NOT RUN. |
| 7 | Yenileme, yoldaki fiziksel konvoylarda doğru işliyor mu? | **Evet.** Yenilenirse konvoy devam eder, tek teslim, tek bedel (M17); yenilenmezse izinsiz ara limandan geçmez, mevcut bekleme / kayıp kuralı, muhasebe tutarlı (M16). |
| 8 | p54'te uzun MP oturumu ve Save8 güvenli mi? | **Evet (otomatik kabulde).** MP8 I 100/9 (8 dk) ve 500/16 (15 dk) 4/0 + 4/0; Save8 v8 geriye uyumlu, bozuk transit kaydı reddedilir, kayıt → yeni oda birebir (Z6). Fiziksel cihaz / gerçek internet NOT RUN. |
| 9 | P53'ün yoğun konvoy performans kazanımı korundu mu? | **Evet.** 64 konvoyda p52'ye göre −%62,1; p53 ile fark A/A bandında; Save8 / RNG her ölçekte aynı. Normal oyunda p95 her ölçümde ≤ +%2,74. |
| 10 | Ticaretin geliştirme açısından önemli işlevsel eksikleri artık kapandı mı? | **EVET.** Bu fazın bütün kabul koşulları geçti (M1–M20, tam Node yeni FAIL yok, MP8 TZ / TR / TL / TA / TB / SG / J / X, uzun oturum, mobil 3 çözünürlük, perf, kampanya eşdeğerliği). Fiziksel Android / gerçek internet / Render saha kabulü bundan ayrıdır ve NOT RUN. |
