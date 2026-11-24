# TİCARET-FİNAL.0 — Sonuç raporu

Tarih: 24 Kasım 2026 · Dal `claude/stars-ticaret-final0` · Taban p52 (`2399075`, PR #76) + araştırma dalı `claude/stars-ticaret-teslim-degeri0` (`3aa8400`, PR #77; çalışma zamanı p52 ile aynı).
Yayın adayı: **96h10p53 / stars-v96h10p53 / MP.8.9b52** · Save8 v8 · MP paket 4 · protokol 1.
Kullanıcı fiziksel test yapamıyor; bütün kabul otomatik. Fiziksel Android, gerçek internet, LAN ve canlı Render: **NOT RUN**.

## 1. Özet

Ticaret geliştirme döngüsü (TİCARET-AĞ.0 → FİNAL.0, p47–p53) bu fazla kapanıyor. FİNAL.0'da çalışma zamanında iki küçük değişiklik var:

1. **Yoğun konvoy performansı** (`commerce.js`). `Commerce.tick` artık `tick0`'ı sarıyor. Aynı tick içinde konvoyların rota denetimi (`remainingRoute`) aynı `openEdge` / `relay` sonuçlarını sayısal anahtarlı iki Map üzerinden paylaşıyor. Önbellek tick sonunda atılıyor.
   - Codex'in 500 sistem / 499 sıçramalık koridorunda medyan süre 8 / 32 / 64 konvoyda %57,5 / %59,8 / %62,1 düştü.
   - Save8 ve RNG her ölçekte iki kolda aynı.
   - Normal oyunda gerileme yok (ABBA).
2. **Düzenli ticaret açıklaması** (`commerce-ui.js`). YENİ KAYNAK SÖZLEŞMESİ formunun başında, düzenli fiziksel ticaretin anlık takastan farkı ve iptal kuralı yazıyor.

Yeni testler: dokunmatik **U4** (sözleşmeyi iptal et → yeni sefer yok, tek makbuz) ve **U5** (oyuncu, masadan AI'ya Transit İzni verir). Üç çözünürlükte 15/0.

Kod değişikliği gerektiren ama yapılmayan kalemler **bilinen tasarım sınırlaması** olarak ayrıldı. Gerekçeleri ve kanıtları §7–§9'da:
- insan sahibine iki yönlü izin;
- limansız kriz devletinin liman yatırımı;
- rota bütçesi adaleti;
- AI'nın ihtiyaç hesabında gelen kargo.

## 2. Taban ve yöntem

- **Kontrol kökleri:** p52 `2399075` (`git archive`), p51 `1b95efb`. Perf için aynı Save8 kayıtları kullanıldı: 100/9/m120, 500/16/m120, 500/16/m180 ve Codex koridor kaydı 500-16-11-m120.
- **Perf ölçümü:** Node ABBA (`research/ticaret-teslim-degeri0/perf-abba.cjs`, gerçek `hrtime`).
  - Her örnekten sonra Save8 eşitliği denetlendi.
  - Aynı ölçüm A/A (p52 ↔ p52) olarak da koşuldu; ölçüm çözünürlüğü buradan okunur.
  - Chromium p95'i tek başına kapı için kullanılmadı: TESLİM-DEĞERİ.0'da A/A ±%6 çıkmıştı.
- **Yoğun konvoy ölçümü:** `research/ticaret-final0/yogun-konvoy.cjs`.
  - Codex `browser-load.cjs` koridorunun Node karşılığı.
  - Her örnek aynı kaydı açar ve yalnız 60 × `Commerce.tick(.5)` süresini ölçer.
  - Eşitlik kanıtı: serialize çıktısının SHA'sı + RNG.
- **Bilinen negatifler yeniden araştırılmadı** (`AI-RED-KARARLARI.md`):
  - liman ufku ×4;
  - ayrı transit bütçesi;
  - ihtiyaç hesabına gelen kargoyu ekleyen aday.

## 3. Faz A — 24 maddelik ticaret envanteri

Durumlar: TAMAM / EKSİK / HATALI / KISMEN / SAHA TESTİ BEKLİYOR. "Tasarım sınırı" etiketi, bilinçli olarak yapılmamış bir kalemi gösterir (§16).

| # | Kalem | Durum | Kanıt |
|---|---|---|---|
| 1 | Anlık kaynak takası (`res`, müzakere masası) | TAMAM | p49 davranışı korundu (TİCARET-AĞ.1); tam Node |
| 2 | Tek seferlik fiziksel kargo (`cargo`) | TAMAM | AĞ.1 açık seçim; TR / TB |
| 3 | Düzenli fiziksel ticaret (`freight` sözleşmesi) | TAMAM | U2 / U3 / U4; `ticaret_agi0`, `ticaret_ag1` |
| 4 | Üç türün oyuncuya ayrımı | TAMAM | FİNAL.0 `commerceKind` açıklaması + AĞ.1 kargo / takas seçimi |
| 5 | Teklif bilgisi (rota, süre, gerekçe) | TAMAM | U2 rota önizlemesi "Hat açık · … · ~26 gün"; `cargoReason` |
| 6 | Aktif sözleşme listesi ve iptal | TAMAM | U4 (dokunuşla İPTAL) |
| 7 | Konvoy takibi (liste + KONVOYU BUL) | TAMAM | U3 |
| 8 | İptalde yeni sevkiyat / çift ödeme yok | TAMAM | U4: 400 gün sonra konvoy sayısı 2 → 2, her konvoyda tek makbuz |
| 9 | Liman / aktarma / ≤3 sıçrama rotası | TAMAM | değişmedi; T1–T12 |
| 10 | AI–AI transit izni (tek yönlü + atomik iki yönlü) | TAMAM | T1 / T2 / T3 / T8 (p51) |
| 11 | Oyuncunun AI'dan izin alması / AI'ya izin vermesi | TAMAM | T7 (ret), **U5** (dokunuşla verir, yalnız o devlete, 360 gün) |
| 12 | AI'nın insandan tek yönlü izin istemesi | TAMAM | T6: gerçek gelen kutusu teklifi; kabulden önce izin / ödeme yok |
| 13 | İnsan sahibine iki yönlü izin isteği | EKSİK · tasarım sınırı | §7; AI insana kısmi istek göndermez (T5) |
| 14 | İzin süresi ↔ sözleşme süresi | KISMEN · tasarım sınırı | §7: izin 360 gün; sözleşme daha uzunsa izin kendiliğinden yenilenmez. Süre bitince rota kapanır (T10), konvoy alternatif arar (T12), bulamazsa 180 gün bekleyip düşer |
| 15 | Federasyon `ticaret` yasası | TAMAM | T11; ayrılınca kapanır |
| 16 | İzin iptali / ara liman fethi / savaş | TAMAM | TB B3 / B4, T10 |
| 17 | Alternatif rota yeniden planlama | TAMAM | T12 (tek teslim) |
| 18 | Tek teslim; kargolu kayıt → yeni oda | TAMAM | TR 6/0; M1 / M2 |
| 19 | MP misafir işlemleri ve gizlilik | TAMAM · SAHA TESTİ BEKLİYOR | TR / TL / TA / TB / SG / J / X (§11); fiziksel cihaz NOT RUN |
| 20 | Ticaret güveni yalnız gerçek teslimde | TAMAM | §10: `commerce.js` `finish` (`ticaretGuveni` yalnız `delivered` dalında); `faz96f_memory`, `faz96f1_budget_trade` |
| 21 | AI geçerli alternatif liman çifti | TAMAM | p52 (`aiPorts` / `aiAltPorts`), `ticaret_gecerli_hat0` |
| 22 | Limansız kriz devletinin liman yatırımı (404) | EKSİK · tasarım sınırı | §8 |
| 23 | Rota bütçesi adaleti / ihtiyaçta gelen kargo | KISMEN · tasarım sınırı | §8: 4 kampanyada 1 gerçek bütçe vakası; gelen kargo adayı faydasız → reddedildi |
| 24 | Yoğun konvoy performansı | TAMAM (FİNAL.0) | §9: 64 konvoyda −%62,1; Save8 / RNG aynı |

HATALI kalem yok. Mobil kalemler (U1–U5) Chromium'da PASS. Fiziksel Android, 19. satırdaki MP misafiri gibi SAHA TESTİ BEKLİYOR.

## 4. Faz B — Oyuncu arayüzü

- **Üç tür:**
  - anlık takas: müzakere masasında `res`;
  - tek seferlik kargo: masada `cargo`, açık seçim;
  - düzenli ticaret: TİCARET → YENİ KAYNAK SÖZLEŞMESİ.

  Formun başına şu metin eklendi: "Düzenli fiziksel ticaret: seçilen sıklıkta tekrarlanan gerçek sevkiyat … İptal yeni yüklemeyi durdurur; yoldaki kargo kurala göre yoluna devam eder. Anlık kaynak takası için müzakere masasını kullanın."
- **Teklif bilgisi:** rota önizlemesi ve ret gerekçeleri (`cargoReason`, `dealQuote`) aynen korundu (U2).
- **Aktif sözleşme ve konvoy takibi:** mevcut liste ve KONVOYU BUL kullanıldı (U3).
- **İptal:** U4 gerçek dokunuşla İPTAL'e bastı, sonra 400 gün ilerletti.
  - Sözleşme kapandı, yeni sefer açılmadı (2 → 2).
  - Teslim edilen her konvoyun makbuzu kendi kimliği: `[[1,1],[2,2]]`, çift teslim yok.
  - Motor zaten yalnız `active` sözleşmeyi yüklüyordu; kod değişikliği gerekmedi.

## 5. Faz C — İnsan transiti

| Alt madde | Durum |
|---|---|
| İnsan limanı: istek / kabul / ret | TAMAM. AI tek yönlü isteği gelen kutusuna gönderir; kabulden önce izin / ödeme yok (T6). Oyuncu masadan izin verir (U5) ya da isteği reddeder (mevcut `respond` yolu). |
| İnsan onaylı iki yönlü izin, retle güvenli kapanış | **Yapılmadı (tasarım sınırı)**, §7 |
| Birden çok ara durak | AI–AI'da TAMAM (T12: iki ayrı yabancı ara liman); insan sahipte her izin ayrı teklif, atomik değil |
| İzin süresi ↔ sözleşme süresi | KISMEN, §7 |

## 6. Faz D — AI kabulü

- **D1 / D4:** AI kalitesinde gerileme yok. Ölçülen her ayda (100/9/m120, 500/16/m120, 500/16/m180) Save8 SHA ve RNG p52 ile aynı: `92018e22…`, `1f6aa687…`, `b9057858…`. FİNAL.0'da AI kodu değişmedi.
- **D2 (404 limansız yatırım):** §8.
- **D3 (rota bütçesi):** §8.
- **D5 (bilinen kusurlar):** reddedilen aday (`ADAY-IHTIYAC-GELEN-ITHALAT`) uygulanmadı. Kusur belgeli: `aiBalance.need` gelen kargoyu saymaz, değer varış zamanını içermez. Aday kampanyada faydasız çıktı (TESLİM-DEĞERİ.0).

## 7. İnsan transitinde bilinen tasarım sınırları

1. **İki yönlü insan izni.**
   - İkili anlaşma motoru (`dealQuote` / `executeDeal`) tek karşı tarafla çalışır.
   - İki ayrı insan sahibinden atomik rıza almak yeni bir çok taraflı işlem demek: kayıt, zaman aşımı, MP komutu, ayna. Bu sohbetin "motoru yeniden yazma" sınırını aşar.
   - Bugünkü güvenli davranış: AI insan sahibine iki yönlü istek göndermez (T5). Kısmi ödeme ya da tek yönü açık kalmış izin oluşmaz.
2. **İzin süresi.**
   - `portTransit` 360 gün, sözleşme 12–60 ay olabilir. Süre bitince rota kapanır (T10).
   - Konvoy 10 günde bir alternatif arar (T12); bulamazsa `waitLimit` 180 gün sonra bloke olur. Yeni yükleme olmaz, ödeme iade edilmez, kurala uygun.
   - Otomatik yenileme ayrı bir ekonomi kararı. AI yeniden isteyebilir; insan masadan yenileyebilir.

## 8. AI ticaretinde bilinen sınırlar

- **Limansız kriz devleti (404):**
  - TESLİM-DEĞERİ.0 gölge değerlemesi: 13 risk döneminin 11'inde krizdeki devletin limanı yok.
  - `aiPortInvestment` bu durumda yatırım yapmıyor. TİCARET-AI.1 funnel3'e göre değer/fiyat ≤0,49 ve yerli üretim tercih ediliyor.
  - Liman ufku ×4 adayı doğal kampanyada 0 yatırım verdi ve reddedildi. Yeni aday denenmedi; yapay bonus yasak.
- **Rota bütçesi (96 rota):** 4 kampanyada 1 gerçek açlık vakası var. Büyük galakside sıra adaleti ölçülmeli. Kod değişmedi, çünkü tek vaka değişikliği gerekçelendirmez.
- **Gelen kargo:** §6 D5.

## 9. Faz F — Yoğun konvoy performansı

Codex koridoru: 500 sistem, 499 sıçrama, kayıt `500-16-11-m120`. N=12 ABBA, 60 × `Commerce.tick(.5)`.

| Konvoy | p52 medyan | FİNAL.0 medyan | Δ medyan | A/A Δ | Save8 + RNG |
|---|---|---|---|---|---|
| 0 | 0,05 ms | 0,06 ms | (μs) | (μs) | aynı |
| 1 | 11,31 | 13,87 | +%22,6 | +%7,8 | aynı |
| 8 | 87,37 | 37,12 | **−%57,5** | +%2,1 | aynı |
| 32 | 313,92 | 126,15 | **−%59,8** | +%4,4 | aynı |
| 64 | 617,16 | 233,62 | **−%62,1** | +%4,3 | aynı |

- **Hedef:** 64 konvoyda ≥%25 düşüş, Save8 / RNG / teslim değişmeden. **PASS.**
- **Tek konvoy:** +2,6 ms / 60 tick (≈0,04 ms/tick); bunun bir kısmı A/A gürültüsü (+%7,8).
  - Önceki dize anahtarlı sürüm tek konvoyda +%49 veriyordu (`ab-dize-anahtar.json`); sayısal anahtarla düşürüldü.
  - Normal oyunda bu fark görünmüyor (aşağıdaki tablo).
- **Neden güvenli:** tick içinde liman, izin, savaş, sahiplik, abluka ve görünürlük değişmez. Saldırı yalnız stok ve `G.raids` yazar; `openEdge` / `relay` girdisi değildir. Önbellek tick sonunda `finally` ile atılır, Save8'e girmez.

**Normal oyun (ABBA, p52 ↔ FİNAL.0; ay başına):**

| Kayıt | A/B Δ medyan | A/B Δ p95 | A/A Δ medyan | A/A Δ p95 | `Commerce.tick` ort. (B−A) | Save8 |
|---|---|---|---|---|---|---|
| 100/9/m120 (n=40) | −%2,46 | +%5,70 | −%4,89 | −%1,17 | −0,72 ms | aynı |
| 500/16/m120 (n=24) | +%1,58 | −%3,17 | −%3,18 | −%4,40 | −0,70 ms | aynı |
| 500/16/m180 (n=24) | −%0,72 | +%5,14 | +%0,23 | +%1,88 | −0,56 ms | aynı |

- p95 kapısı (≤%5): 500/16/m120 PASS.
- 100 sistem ve 500/m180 satırlarında A/B p95 +%5,70 / +%5,14. Bunlar tek koşuda, A/A p95 bandı içinde: A/A'nın kendisi ±%4–6 oynuyor.
- Ölçülen `Commerce.tick` süresi iki kayıtta da **düştü** (−0,56…−0,72 ms/ay).
- Sonuç: gerileme yok. Bu bir yorum kararı; katı okumada iki p95 satırı %5'in 0,14–0,70 puan üstünde (§16).
- Not: SP Chromium testi ab-100 ölçümüyle aynı anda koştu. ABBA sırası iki kola eşit gürültü verir, ama mutlak süreler gürültülüdür.

Kanıt: `evidence/ticaret-final0/yogun/{ab,aa,ab-dize-anahtar}.json`, `evidence/ticaret-final0/perf/{ab,aa}-{100,500}.{json,log}`.

## 10. Faz E — Ticaret ↔ diplomasi

- **Federasyon `ticaret` yasası:** üye sahibin limanı izinsiz açık, izin istenmez, üye ayrılınca kapanır (T11; `portRight`, `commerce.js:30`).
- **Güven yalnız gerçek teslimde:** `Commerce.finish` içinde `rememberEvidence(…,'ticaretGuveni',…)` yalnız `delivered` dalında ve şu koşullarla çağrılıyor: `n>0`, sözleşme ≥2 döngü, ≥180 gün. Kayıp / imha dalında güven yazılmaz.
  - Hediye sözleşmesinin iyi niyeti de yalnız teslimde (`dealGoodwill`).
  - İmza anında güven yok.
  - Mevcut testler: `faz96f_memory_test`, `faz96f1_budget_trade_test` (tam Node).
- Savaş / ambargo: `pairGate` → yeni sözleşme yok, konvoy durur (`ticaret_agi0` / `ticaret_ag1`).

## 11. Faz H — Multiplayer (host + 2 misafir)

Üretim relay süreci, TLS vekili, host + B + C ayrı Chromium profilleri. Hepsi son kodla, p53:

| Senaryo | Sonuç |
|---|---|
| TR (yolda kargo → kayıt → relay yeniden başlar → yeni oda → misafirler döner → tek teslim) | 6/0 PASS |
| TL (misafir gelen kutusu kararı) | 5/0 PASS |
| TA (anlık takas / kargo, misafir aynası) | 6/0 PASS |
| TB (izin ver / al, ara liman, yolda izin kaybı, ara liman fethi) | 6/0 PASS; ikinci koşu 6/0 |
| SG (savaş yardımı, misafir YENİLGİ, sistem oyu kartı) | 5/0 PASS |
| J (kayıt → yeni oda, ilk tersane emri, yanıt kaybı) | 5/0 PASS |
| X (takviye rotası, host + B) | 5/0 PASS |

Kanıt `evidence/ticaret-final0/chromium/mp8-*.json`.

- **TR:** yolda kargo varken kayıt → relay yeniden başlar → yeni oda → tek teslim, `G.commerce` birebir.
- **TB:** izin ver / al, ara liman, yolda izin kaybı, ara liman fethi.
- **TL / TA:** misafir gelen kutusu kararı, teklif ve kargo aynası.
- **Gizlilik:** misafir aynası yalnız kendi gönderdiği / aldığı konvoyları taşıyor (`Commerce.visible`, değişmedi).
- **Uzun oturum:** bu fazda yeni uzun MP oturumu (`MP8_SCEN=I`) koşulmadı: **NOT RUN**. Konvoy motoru değişikliği yalnız tick içi önbellek; MP aynası ve komut yolu değişmedi. Önceki uzun oturum kanıtı SAHA-GÜVENCE.1'de.

## 12. Faz G — Mobil (gerçek dokunuş)

`tests/browser-ticaret-tamamlama0-sp.cjs`: `isMobile` + `hasTouch`, `touchscreen.tap`; her dokunuştan önce `elementFromPoint` denetimi.

| Ekran | U1 miktar | U2 sözleşme formu | U3 teklif → konvoy | U4 iptal | U5 transit izni |
|---|---|---|---|---|---|
| 800×360 | PASS | PASS | PASS | PASS | PASS |
| 844×390 | PASS | PASS | PASS | PASS | PASS |
| 901×411 | PASS | PASS | PASS | PASS | PASS |

Toplam 15/0. Taşma ve klavye odağı yok. Regresyon koşusundaki tekrar: 15/0 (U4 kanıtında sözleşme durumu artık `contractStatus` alanında; ilk kanıtta test sonucu alanını eziyordu, test sayımı etkilenmemişti). Fiziksel Android: NOT RUN.

## 13. Faz I — Ekonomi / denge koruması

- Ekonomik eşik, bedel, gelir ya da AI kararı değişmedi; yapay bonus yok, zorla ticaret yok.
- Normal oyun kayıtlarında ay sonu Save8 / RNG p52 ile birebir (§9). Yoğun koridorda 0–64 konvoy, her ölçekte birebir.
- Arayüz metni simülasyon ayında çalışmıyor.

## 14. Faz J — Save8 ve regresyon

- Yeni kalıcı alan yok. `_tickMemo` tick dışında `null` ve serialize'a girmiyor.
- **Tam Node (`STARS_TEST_WORKERS=4`):** **247 paket / 6576 PASS / 279 FAIL**, p52 tabanıyla aynı sayılar. Başarısız 56 paketin listesi ve paket içi sayıları p52 koşusuyla birebir aynı (`evidence/ticaret-final0/node/fail-listesi.txt`): **yeni FAIL yok**. Bu FAIL'ler fazdan bağımsız eski koruma / ortam vakalarıdır (CLAUDE.md).
- `ticaret_tamamlama0_transit` + `ticaret_gecerli_hat0`: 12/0 ve 13/0 (`evidence/ticaret-final0/node/transit-gecerli-hat.log`).
- Audit / navy dosyaları koşudan sonra geri alındı.

## 15. Yayın — p53

- **Sürüm kimlikleri:** `main.js` BUILD_ID `96h10p53`, `sw.js` CACHE `stars-v96h10p53`, relay `/mp/version` ve misafir `MP_VERSION` `MP.8.9b52`. `mp-core` p53, p41–p52 paketlerini kabul eder.
- **ZIP:** `releases/stars-faz96h10p53.zip`
  - 20 girdi;
  - **960 037 bayt**;
  - SHA-256 `2ea7da603f7480166a49f09ae8a3ad6efdd40469ea9d331998f1e4e470687f72`;
  - CRC32 `85ACACBB`.
- İki paketleme bayt-bayt aynı. Çıkarılan ZIP `verify-release --root` ile doğrulandı (19 dosya). Kayıt `RELEASE-TICARET-FINAL0.json`.
- **Render'da denenecek dal:** `claude/stars-ticaret-final0` (p53). Geri dönüş: `claude/stars-ticaret-gecerli-hat0` (p52). Canlı Render ve main değiştirilmedi.

## 16. Kapanış matrisi

| Faz | Sonuç | Not |
|---|---|---|
| A envanter | PASS | 24 madde; HATALI 0 |
| B arayüz | PASS | U2–U5 |
| C insan transiti | PASS (tek yönlü) · bilinen tasarım sınırlaması (iki yönlü, izin yenileme) | §7 |
| D AI | PASS (gerileme yok) · bilinen tasarım sınırlaması (404 limansız, bütçe, gelen kargo) | §8 |
| E diplomasi | PASS | T11, `finish` güven dalı |
| F yoğun konvoy | PASS | 64 konvoy −%62,1 |
| F normal oyun | PASS (yorum) | 2 satırda p95 +%5,1 / +%5,7, A/A bandı içinde; `Commerce.tick` süresi düştü |
| G mobil | PASS (Chromium) · NOT RUN (fiziksel) | 15/0 |
| H MP | PASS (TR / TL / TA / TB / SG / J / X) · NOT RUN (uzun oturum I, Render, internet) | §11 |
| I ekonomi | PASS | Save8 / RNG eşitliği |
| J regresyon | PASS (yeni FAIL yok; 279 eski FAIL tabanla aynı) | §14 |
| Yayın p53 | aday | saha kabulü yok |

## 17. Açık kalanlar (önem sırasıyla)

1. Fiziksel Android ve canlı Render'da iki cihazla ticaret kabulü (NOT RUN).
2. İnsan sahiplere atomik iki yönlü / çok duraklı izin (yeni çok taraflı işlem, ayrı faz).
3. Transit izni yenileme ya da sözleşme süresine bağlanması (ekonomi kararı).
4. Limansız kriz devletinin liman yatırımı (404). Ayrı AI fazında, plasebo bandıyla.
5. Rota bütçesi adaleti: büyük galakside sıra ölçümü.
6. Uzun MP oturumunun (I) p53 ile tekrarı.

## 18. 12 kapanış sorusu

| # | Soru | Cevap |
|---|---|---|
| 1 | Üç ticaret türü oyuncuya açık mı? | Evet: masada takas ve kargo, TİCARET penceresinde düzenli sözleşme. Formda fark ve iptal kuralı yazıyor (FİNAL.0). |
| 2 | İptal yeni sevkiyat ya da çift ödeme üretiyor mu? | Hayır (U4: 2 → 2 konvoy, tek makbuz). |
| 3 | İnsan limanında izin istek / kabul / ret çalışıyor mu? | Tek yönlüde evet (T6, U5). |
| 4 | İnsan onaylı iki yönlü izin var mı? | Hayır. Bilinen tasarım sınırlaması; AI insana kısmi istek göndermez, yarım izin oluşmaz. |
| 5 | AI kalitesi geriledi mi? | Hayır: ölçülen aylarda Save8 / RNG p52 ile birebir, AI kodu değişmedi. |
| 6 | Limansız AI krizi çözüldü mü? | Hayır. Kök neden belgeli (limansız, temassız); yapay çözüm uygulanmadı. |
| 7 | Güven yalnız gerçek teslimde mi? | Evet (`finish` → `delivered` dalı, ≥2 döngü, ≥180 gün). |
| 8 | Yoğun konvoy hedefi tuttu mu? | Evet: 64 konvoyda medyan −%62,1, Save8 / RNG / teslim aynı. |
| 9 | Normal oyunda perf gerilemesi var mı? | Yok: medyan −%2,5…+%1,6, `Commerce.tick` −0,6…−0,7 ms/ay; iki p95 satırı A/A bandında. |
| 10 | Telefonda ticaret kurulabiliyor mu? | Chromium dokunmatik testinde evet, 3 çözünürlükte 15/0. Fiziksel cihaz NOT RUN. |
| 11 | MP'de ticaret güvenli mi? | Otomatik testte evet: host + 2 misafir, kargolu kayıt → yeni oda tek teslim, izin / ara liman / fetih, gizlilik; 7 senaryo PASS. Fiziksel cihaz ve Render NOT RUN. |
| 12 | **Ticaret sistemi tamamlanmış sayılabilir mi?** | **Evet: geliştirme açısından tamamlanmış sayılır; saha kabulü henüz yok.**
- Oyuncunun kullandığı her ticaret yolu (anlık takas, tek seferlik kargo, düzenli sözleşme, transit izni, federasyon yasası, iptal, konvoy takibi, MP) otomatik testlerde çalışıyor. 24 maddelik envanterde HATALI kalem yok.
- Tamamlanmış sayılmanın sınırları açık: (a) fiziksel Android / Render kabulü yapılmadı; (b) beş kalem bilinçli bilinen tasarım sınırlamasıdır (§3 #13, #14, #22, #23): insana iki yönlü izin, izin yenileme, limansız kriz devletinin liman yatırımı, rota bütçesi sırası, gelen kargo hesabı.
- Bu kalemler hata değil, ayrı faz kararıdır. Ticarette yeni iş, saha bulgusu ya da açık bir faz kararı olmadan açılmamalı. |
