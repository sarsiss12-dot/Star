# TİCARET-AĞ.1 — Sonuç raporu

Tarih: 22 Kasım 2026 · Dal: `claude/stars-ticaret-ag1` (PR #70 `claude/stars-ticaret-ag0` @ `23cc1bb` üstünde) · Sabit karşılaştırma tabanı: p49 `claude/stars-saha-guvence1` @ `e4350e5` (PR #69)
Kanıt: `reports/claude/evidence/ticaret-ag1/` · Devir: `reports/claude/TICARET-AG1-DEVIR.md`

Durum dili PASS / FAIL / NOT RUN. Kullanıcı test yapamıyor: bütün kabul otomatik (Node + yerel Chromium + yerel relay/TLS). Fiziksel Android, gerçek uzak internet, canlı Render **NOT RUN**.

**Özet karar:** Diplomasi regresyonu kapandı (40 kötüleşen paketin 40'ı da p49 düzeyine döndü; tek kalan fark sürüm manifestinin güncellenmemesinden doğan 2 paket). **Performans kapısı 100 sistemde geçmedi** (tek ay p95 **+%9,89**, sınır %5; 500 sistemde −%6,93 / −%1,85 geçti). Bu yüzden **sürüm yükseltilmedi, ZIP üretilmedi, PR taslak kalır; güvenli oynanabilir dal p49 (PR #69)**.

## A. Kanonik kaynak
| Öğe | Değer |
|---|---|
| Doğrulanan HEAD'ler | p49 `e4350e5`, PR #70 `23cc1bb`, Codex `84de561` (GitHub ile aynı; ilerleme yok) |
| Başlangıç | `23cc1bb` (PR #70) |
| Bitiş | `claude/stars-ticaret-ag1` son commit (kod `04bc7cf` + düzeltmeler; bkz. `git log`) |
| Okunanlar | AGENTS.md, GPT-DEVIR.md, CLAUDE.md, PROJE-DURUMU.md, SAHA-GUVENCE1-SONUC, TICARET-AG0-SONUC, STARS-SONRAKI-DEVIR, reports/codex/TICARET-AGI0-SONUC (P46 diplomasi araştırması önceki oturumda okunmuştu) |

## B. Regresyonlar — 40 kötüleşen paketin ortak kök nedeni
**Kök neden (tek, kanıtlandı):** PR #70'te `diplomacy.js` `dealValidity` / `executeDeal` / `applyItems` her `res` (taşınabilir mal) maddesini `Commerce.quote` / `Commerce.sign` ile **tek seferlik fiziksel kargoya** çeviriyordu (`commerce.js freightPlan`: `once` iken `goods = res`). Limanı / açık hattı olmayan iki devlet arasındaki eski geçerli takas `rules:quote` "Tek seferlik yük için … liman hattı yok" ile reddediliyordu. Sonraki adımlar (`offer` yok → `TypeError`) bu birincil hatanın türevleriydi; ayrı kök neden sayılmadı. Aynı paketler Codex'in kendi dalında aynı sayılarla düşüyordu (önceki oturum).

**Düzeltme (Faz B):** `res` maddesi p49 anlamına döndü (kabulde atomik, anlık, liman gerektirmez). Tek seferlik fiziksel kargo **açık yeni madde** `{t:'cargo',r,v}` (yalnız ene/min/yiy/ala/tuk). `res` kurallarının aynısı: stok, değer, etiket, tekilleştirme, toplama. `freight` (düzenli sözleşme) aynen. `militarySettlement` istisnası gereksizleşti, kaldırıldı. Hediye (`giftDo`, MP `gift`) p49 gibi anlık.

| Paket grubu | p49 | PR #70 | TİCARET-AĞ.1 |
|---|---|---|---|
| `mp3_core` / `mp4_core` / `mp71_bridge` / `mp74_notice` | 11/0, 14/0, 9/0, 6/0 | 3/8, 2/12, 2/7, 2/4 | **11/0, 14/0, 9/0, 6/0** |
| `faz87d_offer_repetition` / `faz95e_inbox` / `faz95e_ui_save` / `faz95e2_regression` | 24/0, 20/0, 16/1, 8/0 | 7/17, 7/13, 11/6, 3/5 | **p49 ile aynı** |
| `faz86c_*` (6 paket), `faz86e/f`, `faz91c`, `faz94c`, `faz95c1`, `faz95e_news`, `faz96b/c3/f`, `faz96h52` | p49 | kötüleşmiş | **p49 ile aynı** |
| `mp_diplo5_*`, `mp_sync_fed0_peacewith/resume`, `mp_techlux0*`, `mp_waron0`, `mp_deal_sys0`, `mp_emir_guvence0`, `mp62_core`, `mp84` | p49 | kötüleşmiş (ör. peacewith 0/6) | **p49 ile aynı** |
| `faz86b_deal_engine` | 120/22 | 119/24 | **121/22** (yeni `portTransit` türü sınanıyor; `cargo` kendi testinde) |
| `faz92c_settlement_apply` | 28/0 | 29/0 | **29/0** (Codex vakası fiziksel takası `cargo` ile kurar) |
| `mp11_online` / `mp1_relay` | 9/0, 14/0 | 6/3, 13/1 | **6/3, 13/1 — FAIL** (çalışma ağacı ↔ RELEASE-MANIFEST runtime baytları; yalnız sürüm yükseltmesiyle kapanır, perf kapısı yüzünden yapılmadı) |

Tam Node: p49 **242 paket / 6532 / 279** · PR #70 **5832 / 441** · TİCARET-AĞ.1 ilk koşu **6528 / 286** (o koşuda faz86b ve faz92c düzeltmesi yoktu; ikisi sonradan hedefli koşuda 121/22 ve 29/0). Son tam Node (bütün düzeltmelerle): **243 paket / 6539 / 283**. p49'a göre paket paket fark yalnız: `faz86b` 120/22 → 121/22, `faz92c` 28/0 → 29/0, yeni `ticaret_ag1_test` 9/0 (iyileşme / yeni) ve `mp11_online` 9/0 → 6/3, `mp1_relay` 14/0 → 13/1 (**FAIL**, manifest). Eski 279 FAIL aynen (silinmedi).

Gerekçeli test güncellemeleri (gevşetme değil; yeni açık madde tasarımı):
- `tests/ticaret_agi0_test.cjs` `swap` fikstürü fiziksel takası `cargo` ile kurar + yeni vaka "düz kaynak takası anlık" (28/0).
- `tests/faz86b_deal_engine_test.js`: `cargo` (liman fikstürü ister) `freight` gibi dışlanır; tür sayısı 14 → 15 (`portTransit`).
- `tests/faz92c_settlement_apply_test.js`: Codex'in liman vakası `cargo` ile.

## C. Diplomasi
- Anlık kaynak takası **korundu** (limansız iki devlet, ittifak + kaynak, cepheye katılım + kaynak, hediye; `ticaret_ag1_test` A1–A4).
- Fiziksel kargo **ayrı** çalışıyor: imzada alıcıya yazılmaz, yüklemede verenden düşer, varışta tek makbuz (K1); ikinci yürütme reddedilir (K3); teklif hazırlığı (`dealQuote`) dünyayı değiştirmez (K3).
- Karma teklif atomik: ittifak + kargo, rota yoksa bütünüyle ret, dünya baytları aynı (K2). Kargo yüklenemezse (`Commerce.dispatch` başarısız) mevcut işlem geri alması tüm maddeleri geri alır (Codex kodu, `mixed` dalı korundu).
- Müzakere masası: "Mal teslimi: **Anlık Kaynak Takası** / **▣ Fiziksel Kargo ile Gönder**" (`dealCargoMode`; mevcut maddelerden başlar, gelen karşı teklifteki kargo korunur). Yeni modal yok.
- Savaşa Yardım / ittifak / toprak vaadi: `saha_guvence1_war` 10/0, `saha_entegre0_warhelp` 7/0, `war_coalition0` 7/0 birleşik dalda.

## D. Ticaret
Codex'in zincirleme liman (≤3 sıçrama), Transit İzni, kargo muhasebesi, liman fethi ve harita kodu **olduğu gibi** korundu. `ticaret_agi0_test.cjs` 28/0 (rota, izin, abluka, ambargo, süre, fetih / devir / geri alma, kayıp, yeniden yönlendirme, kayıt). `faz92c` toprak paylaşımı 29/0.
E5 ortak ara liman yoğunluğu: araştırıldı — kapasite çoğaltma yok (mal gerçek stoktan yüklenir; sözleşme devlet başı 12 / toplam 128, konvoy 256 ile sınırlı); kod değişmedi.

## E. Performans (Codex düzeneği `research/ticaret-agi0/ay-maliyeti.cjs`, Chromium, aynı Save8, 24 örnek / kol, kol sırası karışık; kontrol = p49 worktree)
| Kayıt | p49 p50 → aday p50 | p49 p95 → aday p95 | p95 farkı | Ay sonu Save8 |
|---|---|---|---|---|
| 100 sistem / 9 AI / 120. ay | 135,7 → 145,9 ms | 176,0 → 193,4 ms | **+%9,89 — FAIL** | farklı |
| 500 sistem / 16 AI / 120. ay | 763,8 → 727,1 ms | 894,1 → 832,1 ms | −%6,93 PASS | aynı |
| 500 sistem / 16 AI / 180. ay | 2318,1 → 2266,3 ms | 2513,8 → 2467,3 ms | −%1,85 PASS | farklı |
(PR #70'in p47'ye karşı ilk değeri +%27,61 idi.)

**Kök neden (100 sistem):** bu ayda aday, AI'lar 2 ↔ 6 arasında **bir düzenli `freight` sözleşmesi fazla** imzalıyor (p49: 1 anlaşma, aday: 2). Fonksiyon profilinde (enstrümantasyonlu) `executeDeal` 6,7 → 19,3 ms, bunun `dealTxBegin` 6,5 → 18,4 ms; Node'da tek `dealTxBegin` ~34–40 ms (tüm dünya grafiği kopyası). Yani fark aynı karar yolunun pahalılaşması değil, **meşru fazladan bir sözleşme × tam işlem kopyası**.
**Kampanya ortalaması (Node, gerçek saat, aynı 100 sistem kaydından 24 ay, iki tekrar):** ortalama 355,8 → 373,8 ms (+%5,1) ve 377,3 → 373,4 ms (−%1,0); p95 462,1 → 429,1 ve 494,6 → 486,0 ms. 24 ayda anlaşma 6 → 7. Kampanya düzeyinde fark gürültü bandında; tek ay p95 kapısı yine de **FAIL** (kapı yeniden tanımlanmadı).
`dealTxBegin` değiştirilmedi: yazma günlüklü / kapsamı daraltılmış işlem bütün diplomatik yolların geri alma güvencesini etkiler; bu oturumda tam yazma kümesi kanıtı ve hata enjeksiyonu doğrulaması yapılamadığından **BAŞLANMADI** (devirde kesin adım).

## F. Multiplayer (yerel Chromium + relay + TLS; fiziksel cihaz DEĞİL)
| Senaryo | Sonuç |
|---|---|
| **TA (yeni)**: B (800×360) gerçek masada "▣ Fiziksel Kargo ile Gönder" → host gelen kutusundan KABUL; dört aşama ayrı (misafir komutu → host bekleyen teklif `cargo` → kabul → tek seferlik sözleşme, imzada host stoğu değişmez → B aynası sözleşmeyi görür); yükleme B'den, varışta host'a **bir kez**; ikinci kabul ret; C varsayılan **anlık** takas (sözleşme/konvoy yok); C aynasında B'nin sözleşmesi yok | **6/0 PASS** (ilk koşular 3/3 ve 4/2: fikstür rotası + misafir yerel rota denetimi; ikisi de düzeltildi, günlükler `chromium/mp8-TA*.log`) |
| TL (Codex transit izni müzakeresi) | **2/3 FAIL** — PR #70'te (`23cc1bb`, değiştirilmemiş) de **2/3**. TL2'de istek host'ta bekliyor, test eşleştirmesi bulamıyor; kök belirlenemedi (test yardımcısı tarafı). Node'da MP komut zinciri doğru. |
| SG (insan–insan Savaşa Yardım) | **5/0 PASS** |
| O (kopma / kayıp ayna / kayıp yanıt / arka plan / yeniden katılma) | **11/0 PASS** |
| J (kayıt → yeni oda, eski devlete dönüş) | **5/0 PASS** |
| SE (p48 regresyonu) | **8/0 PASS** |
| X (takviye rotası) | **5/0 PASS** |
| SP 800×360 (tek oyunculu, anomali / haritadan fetih / toplu gizleme) | **3/0 PASS** |
Misafir düzeltmesi (`guest-stars` `dealQuote` sarmalayıcısı): yalnız `cargo`/`freight` içeren teklifte ve tek engel Commerce rota gerekçesiyse misafir yerelde engellemez; host `dipGate` gerçek dünyada yeniden denetler (`ticaret_ag1_test` M1: rotasız kargo host'ta gerekçeyle reddedilir, bekleyen teklif oluşmaz). SG–X ve SP bu sarmalayıcıdan önce koşuldu (yalnız kargo teklifini etkiler).
Kargo haritada hareket / ara limandan geçiş / liman fethi MP Chromium'da **NOT RUN** (Node'da `ticaret_agi0` 28/0 ve `faz92c` 29/0). Kargo içeren MP kaydının yeni odada yüklenmesi Chromium'da **NOT RUN** (MP paketi Save8'i olduğu gibi taşır; Save8 kargo dönüşü K4 PASS).

## G. Save8 ve RNG
- Save8 v8, MP paketi 4, protokol 1 değişmedi. Yeni `cargo` maddesi yalnız kullanıldığında teklif / sözleşme kaydına girer; eski kayıtlar açılır.
- Anlık takas yolu p49 ile aynı motor kodu (`res` dalı p49 metnine döndü). Ticaret AI tetiklendiğinde dünya p49'dan ayrışır (beklenen; Codex raporu).
- Kargo kayıt / yükleme: sözleşme / konvoy / makbuz durumu kayıttan aynen döner, yükleme ikinci teslim üretmez (K4). Sentetik 96a fikstürü kargosuz dünyada da bayt-bayt geri dönmüyor (`simulation.nests` onarımı) — bu nedenle K4 kargo durumunu tam karşılaştırır.

## H. Testler
Node hedefli: `ticaret_ag1_test` **9/0**, `ticaret_agi0_test.cjs` **28/0**, `faz86b` 121/22 (eski 22 FAIL p49'da da), `faz92c` **29/0**, `faz96a_integrity` 12/0, `saha_guvence1_{fleet,war,events}` 6/0, 10/0, 4/0, `saha_entegre0_*` 0 FAIL, `war_coalition0` 7/0, `mp3_core` 11/0, `mp4_core` 14/0, `faz87d` 24/0, `faz95e_inbox` 20/0 — PASS.
Tam Node: yukarıda (B). Chromium: F. Performans: E (100 sistem FAIL, 500 sistem PASS).
NOT RUN: fiziksel Android, gerçek uzak internet, canlı Render, karışık sürüm (p47/p49 istemci ↔ ag1 host), MP'de liman fethi / ara liman görsel hareketi.

## I. Sürüm
**Yapılmadı.** Performans kapısı (100 sistem p95 +%9,89) geçmediği için `BUILD_ID` / manifest / PWA / MP sürümü değiştirilmedi, ZIP üretilmedi. Sonuç: `mp11_online` / `mp1_relay` manifest denetimleri bu dalda FAIL kalır (PR #70'te de öyle).

## J. Açık işler
1. `dealTxBegin` maliyeti (100 sistem tek ay p95). Devirdeki kesin yöntem.
2. TİCARET-AI.0 (AI'nın Transit İzni satın alması doğal kampanyada gözlenmedi), FED-AI-SİYASET.0: **BAŞLANMADI**.
3. Eski 279 Node FAIL (p47'den beri) — ayrı teknik borç.
4. Fiziksel Android, gerçek uzak internet, canlı Render: NOT RUN.

## K. Durum tablosu
| Kalem | Durum |
|---|---|
| 40 kötüleşen paket (ortak kök: res → kargo) | TAMAMLANDI VE TEST EDİLDİ (38'i tam p49; faz86b/faz92c gerekçeli güncelleme; mp11_online/mp1_relay manifest FAIL — sürümle kapanır) |
| Anlık kaynak takası korunması | TAMAMLANDI VE TEST EDİLDİ |
| Fiziksel kargo ayrı seçenek (cargo, UI, MP) | TAMAMLANDI VE TEST EDİLDİ (Node + TA Chromium) |
| Karma teklif atomikliği | TAMAMLANDI VE TEST EDİLDİ (K2) |
| Zincirleme liman / transit izni / kargo muhasebesi / liman fethi | KISMEN (Node PASS; TL Chromium 2/3, PR #70'te de) |
| E5 ortak liman kapasitesi | ARAŞTIRILDI (çoğaltma yok, kod değişmedi) |
| dealTxBegin performansı | BAŞLANMADI (kanıtlı kapsamlı işlem tasarımı devirde) |
| 100 sistem p95 ≤ %5 | BLOKE OLDU (+%9,89) |
| 500 sistem p95 | TAMAMLANDI VE TEST EDİLDİ (−%6,93, −%1,85) |
| Sürüm / ZIP | BAŞLANMADI (kapı) |
| TİCARET-AI.0 / FED-AI-SİYASET.0 | BAŞLANMADI |
| Fiziksel Android / Render | NOT RUN |
