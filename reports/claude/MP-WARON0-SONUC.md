# MP-WARON.0: Genel Savaş Sözü (warOn) çok oyunculu müzakerede

Tarih: 16 Kasım 2026.

| | |
|---|---|
| Dal | `claude/stars-mp-waron0` |
| Başlangıç HEAD | `c2ab5f25e63bc00403465b2db187d6acba8fa2ab` (p35 / MP.8.9b33, taslak PR #50) |
| Bitiş HEAD | §10 |
| Oyun sürümü | **96h10p36** / `stars-v96h10p36` |
| MP sürümü | **MP.8.9b34** |
| Kayıt / paket / protokol | Save8 v8 / paket 4 / protokol 1, değişmedi |
| Paket uyumu | p36 paket yükleyicisi p6–p35, p25u1 ve p27s1 paketlerini kabul eder |

> **Kanıt türleri ayrı yazılır:**
> - **Node vm:** gerçek runtime ile gerçek `mp-core` ve `mirror`.
> - **Yerel Chromium:** relay üretim kipinde ayrı süreç olarak çalışır, önünde TLS vekili vardır. Her oyuncunun kendi TCP hattı (kesilebilir ya da dondurulabilir), kendi Chromium'u ve kalıcı profili var. Arayüz gerçek STARS arayüzüdür, etkileşim gerçek dokunuştur. Misafirler 844×390 yatay telefon, host 1280×800 masaüstü.
> - **Canlı Render:** yalnız salt okunur `/mp/version` sorgusu.
> - **Fiziksel cihaz:** NOT RUN. Kullanıcı şu anda fiziksel test yapamıyor.
>
> Kullanıcı kaydı yok. Kayıt testleri sentetik oyundan alınan gerçek MP paketleriyle yapıldı.
>
> Sistemin atadığı `claude/stars-project-takeover-y9x8m9` eski bir 96H.8 dalı. Bu yüzden faz, doğrulanmış PR #50 HEAD'inden (`c2ab5f2`) yeni bir dal olarak açıldı. Force-push ya da rebase yapılmadı.

## 0. Özet

| # | İstek | Durum (yerel) | Kanıt |
|---|---|---|---|
| 1 | Genel Savaş Sözü: üçüncü devlete karşı, son tarihli söz; Savaşa Destek İste'den ayrı; özet iki maddeyi ayrı satırda gösterir | Uygulandı · PASS | W1, S2–S3, V1 |
| 2 | Kabulde bağlayıcı; insan oyuncu savaşı kendi onayıyla normal ilan akışından açar; host "Tutuldu" sayar | PASS | W2, V2 |
| 3 | Süre dolumu: mevcut söz bozma kuralı. İmkânsızlaşma (hedef elendi, Konsey yasağı) tutulmayan geçerli sözden ayrı | PASS | W3–W4, V3–V4 |
| 4 | Yollar: host → misafir, misafir → host, misafir → misafir; teklif, karşı teklif, kabul, ret, iptal; insan → AI motor kararıyla | PASS | W1, W5, W9, V1, V6 |
| 5 | Aktif söz ilgili oyunculara görünür; kayıt ve yeni oda sonrası aynı söz ve kalan süre; hedef ve ilgisiz oyuncular görmez | PASS | W7–W8, V1–V2 |
| 6 | Tek işlem: çift dokunma, kayıp yanıt, yeniden gönderim ve kayıttan dönüşte tek söz; birleşik teklif kısmen uygulanmaz | PASS | W6, W9, V4 |
| 7 | Savaş Merkezi "Şartlı Teklif…" taslağı yenilemede korunuyor (p35 açığı) | PASS · kusur bulunmadı | V5 |
| 8 | Gerçek kusur: gelen kutusu kaydı son tarihi atıyordu (`encodeOffer`) | Düzeltildi | S5, V1 |
| 9 | Tek oyunculu `warOn` davranışı | Aynen korundu | S1 (p35'te de geçer), eşdeğerlik 3/0 |
| 10 | Regresyon (Z / Q / Y / P, tam Node) | Z 14/0 · Q 8/0 · Y 6/0 · V 7/0 · P 8/0 (ilk FAIL'ler korunuyor) · tam Node: p35 ile aynı 52 eski FAIL paketi | §7 |
| 11 | Açık saha vakaları: tek başına kayıttan devamda olay görünmemesi, uzun oturumda misafir haritası donması | **AÇIK**: kullanıcı kaydı ya da canlı oturum yok | §8 |

## 1. Sürüm ve Render

**Canlı Render (`stars-zhdu`, salt okunur GET, oynanış yok):**
- `/mp/version` yanıtı: `{"mp":"MP.8.9b30","build":"96h10p33"}`.
- 8 dosyanın önekleri p33 ile aynı.
- Sonuç: p34, p35 ve p36 sahada hiç çalışmadı.

**Render'da seçilecek dal:** `claude/stars-mp-waron0`.

**Dağıtımdan sonra beklenen `/mp/version`:** `{"mp":"MP.8.9b34","build":"96h10p36"}`. Beklenen dosya önekleri:

| Dosya | Önek |
|---|---|
| mp-core | `89a047a41e90` |
| relay | `62035e8b8c3b` |
| mp1-host | `f5dc296c1a3d` |
| join | `65c28db3714f` |
| mirror | `cb4dd04e2812` |
| guest-stars | `d067f1941276` |
| mp71-dip | `43912b9bed0a` |
| mp7-setup | `a7391d21552c` |

## 2. Oyun davranışı

### 2.1 Tek oyunculu davranış (değişmedi)

Madde biçimi `{t:'warOn',target}`. Oyuncu ya da AI kabul edince veren o anda `declareWar(…,{kind:'promise'})` ile savaş ilan eder (`proxyWar` dahil). Bu yol MP'de **AI veren** için de aynen geçerli: AI'nın kararı `aiRespond` ve motorun ilan kuralları üzerinden verilir.

### 2.2 Çok oyunculu davranış

**Madde biçimi:** `{t:'warOn',target,until}`; `until` mutlak gündür. Son tarih yalnız **insan veren** için anlamlıdır.

**Teklif:**
- Müzakere masasında "⚔ Savaş sözü" → hedef → son tarih (90 / 180 / 360 gün).
- Söz satırındaki ⏱ son tarihi değiştirir. Karşı teklifte de çalışır.
- Teklifte şunlar görünür: söz veren, alan, hedef, son tarih, kalan gün, karşılık (aynı teklifteki diğer maddeler), söz tutulmazsa sonuç.
- Söz verenin kendisi için uyarılar da gösterilir: ittifak ya da saldırmazlık (sözü tutmak onları çiğnemek olur), ticaret paktı, Konsey yasağı, meşruiyet önizlemesi. Karşı tarafın antlaşmaları özete sızmaz.

**Kabul (motor):**
- `dealQuote` → `warPledgeGate`: hedef yaşıyor; veren insan; hedef taraflardan biri değil; son tarih 1–750 gün içinde; veren hedefle zaten savaşta değil; alanla savaşta değil; aynı söz açık değil; açık söz sayısı ≤ 8.
- Ayrıca mevcut `canPromiseWarOn` geçerli: Konsey yasağı, doktrin, federasyon savaş izni.
- Kabulde savaş **İLAN EDİLMEZ**. Söz, veren devletin `e.warPledges` kaydına "Açık" olarak yazılır. Karşılık maddeleri aynı işlemde bir kez uygulanır.

**Tutma:**
- İnsan oyuncu savaşı kendi açık onayıyla normal savaş ilanı akışından açar: hedef → önizleme → `#warFinalConfirm`.
- Söz paneli bu akışa giden bir düğme sunar.
- Hedefle geçerli bir savaş başlayınca (`declareWar` sonu) söz "Tutuldu" sayılır. Hedef saldıran taraf olsa da aynı sonuç geçerli.

**Süre dolumu (ay başı `warPledgeTick`):** son tarih geçmiş ve savaş yoksa:
- **"Çiğnendi":** mevcut söz bozma kuralı (Toprak Vaadi ile aynı). Alan devlet "sözünü çiğnedi" (`paktBozdu`) hatırlar, alanın ilişkisi −20 düşer.
- Kamu haberi hedefin adını vermez. İki tarafa bildirim gider.

**İmkânsızlaşma ("Düştü", ceza yok)** ayrı tutulur:
- hedef elendi;
- veren ya da alan yok;
- veren ile alan birbiriyle savaşa girdi;
- son tarihte Konsey savaş yasağı sürüyor.

**Karşılık iadesi:** Karşılık iade edilmez. Toprak Vaadi'ndeki mevcut motor davranışı da böyle; ayrı iade defteri yok.

**Savaşa Destek İste (`warJoin`)** ayrı madde olarak kalır: belirli cephe veya hazırlık, kabulde katılım. Teklif özetinde ayrı satırda görünür (`.dealJoinRow`). Aynı teklifte ikisi birlikte bulunabilir.

**MP'deki açık onay davranışı:** Çok oyunculu oyunda insan veren (misafir ya da host) her zaman son tarihli söz verir; kabulde savaş ilan edilmez. Host → AI müzakeresinde de host son tarihli söz verir. Son tarihsiz insan sözü host'ta `dipGate` tarafından gerekçeyle reddedilir. Tek oyunculuda hiçbir şey değişmedi.

## 3. Müzakere, kayıt, yeniden bağlantı

**MP madde ve kapılar (`mp-core`):**
- `dipItems` `warOn` maddesini alır; `until` isteğe bağlıdır.
- `dipGate`: insan verende son tarihsiz söz reddedilir.
- `dipSweep`: bekleyen teklifteki söz uygulanamaz hâle gelirse teklif "Genel Savaş Sözü artık uygulanamıyor" nedeniyle geçersizleşir. Nedeni iki taraf da görür.
- `warPledgeNote` bildirimleri uzak insana gider.

**Ayna:**
- Veren devletin kendi `warPledges` kaydı π ile eşlenir.
- Alan, yalnız kendisine verilen sözleri veren devletin kabuğunda görür.
- Hedef ve üçüncü taraflar hiçbir söz kaydı almaz; teklif de onların diplomasi görünümüne girmez (W7).

**Kayıt:**
- Söz Save8 içindedir; yalnız kullanıldığında yazılır.
- Kayıt → yeni oda sonrası aynı söz ve aynı kalan süre geri gelir (W8, V2).
- Süre dolumu yüklemeden sonra bir kez işlenir.

**Tek işlem:**
- p34 / p35 akışı aynen geçerli: `S.dealTx` ve aynı cid. Aynı cid ile ikinci gönderim ikinci teklif üretmez (W9).
- Çift kabulde, ya da yanıt sırasında hat donup kopsa da yalnız tek söz oluşur (V4).

**Birleşik teklif:** Söz kabulde geçersizse (örneğin aynı söz başka yoldan açıldıysa) teklifteki kaynak, Sistem Devri ve Haraç maddeleri de uygulanmaz (W6).

**Gelen kutusu kusuru (gerçek, düzeltildi):** Kök neden `main.js` `encodeOffer` işleviydi; `warOn` maddesinin `until` alanını atıyordu. Sonuçları:
- Kart sözü "kabulde savaş ilanı" diye yanlış gösterirdi.
- "Masaya otur" ile açılan karşı teklif taslağı son tarihi kaybeder, host da onu son tarihsiz söz diye reddederdi.

Düzeltildi (S5, V1).

**Savaş Merkezi "Şartlı Teklif…" taslağı (p35'te açık kalan test):** Yeni düzende denendi (V5):
1. Taslağa kaynak eklendi.
2. Host ayna yayınladı; misafir dünyası yeniden kuruldu.
3. Masa kapatılıp yeniden açıldı.

Taslak (`warJoin` + kaynak) iki adımda da aynı kaldı. Kusur bulunmadı.

## 4. Değişen dosyalar

**Runtime (5 dosya):**
- `diplomacy.js`:
  - `warPledge*` bloğu (dosya sonu, "MP-WARON.0");
  - `dealQuote`, `applyItems` ve `dealPostcondition` içindeki `warOn` dalları;
  - `declareWar` sonundaki kanca (yalnız söz kaydı varken çalışır);
  - madde normalleştirme ve etiket.
- `main.js`: ay başında `warPledgeTick`; `encodeOffer` artık `until`'i koruyor; `BUILD_ID`.
- `ui.js`:
  - Savaş sözü düğmeleri etkin; son tarih seçimi ve ⏱;
  - özet satırları (`warPledgeTermsRow`, `.dealJoinRow`);
  - `UI.warPledgeHtml`, `UI.mpGame`, `UI.mpIsHuman`;
  - açıklama metni.
- `sw.js`: önbellek sürümü.

**MP (6 dosya):**
- `research/mp0/mp-core.js`: madde, kapı, süpürme, bildirim, paket uyumu.
- `research/mp6/mirror.js`: söz kayıtları.
- `research/mp6/client/guest-stars.js`: gönderim ve gelen kayıt eşlemesi, `dealPledgeDays` görünüm eylemi.
- `research/mp71/client/mp71-dip.js`: gönderim eşlemesi, `UI.mpHumanOf`.
- `research/mp1/server/relay.js` ve `research/mp1/client/view.js`: MP.8.9b34.

**Testler:**
- Yeni: `tests/mp_waron0_test.js`, `tests/mp_waron0_sp_test.js`, `tests/mp_waron0_equivalence_test.js`, `tests/helpers/mp-waron0-mp.cjs` (MP8 V).
- `tests/browser-mp8.cjs`: V kaydı eklendi.
- `tests/helpers/mp-field-fix0-mp2.cjs`: Z8 vakası, p34–p35'teki "MP'de Savaş sözü pasif" yerine yeni davranışı ("etkin, son tarihli söz") sınıyor. Bu bilinçli bir davranış değişikliği; ret ve gizlilik kontrolleri gevşetilmedi.

**Koruma pinleri:**
- `tests/helpers/mp-waron0-reviewed.{json,cjs}`: taban `c2ab5f2`, 10 dosya, tam metin geri alımı doğrulandı.
- `stripReviewedDealSys` önce `stripReviewedWarOn`'u çağırır.

## 5. Testler (yeni)

| Test | Aday p36 | Kontrol p35 |
|---|---|---|
| `node tests/mp_waron0_test.js` (W1–W9) | **9/0** | **0/9** (`node-kontrol-p35.log`) |
| `node tests/mp_waron0_sp_test.js` (S1–S5) | **5/0** | 1/4: S1 geçer, tek oyunculu davranış aynı; yeni arayüz vakaları FAIL (`sp-kontrol-p35.log`) |
| `STARS_CONTROL_ROOT=<p35 git archive> node tests/mp_waron0_equivalence_test.js` | **3/0**: tohum 11 / 22 / 404 × 48 ay, 8 nokta; Save8 SHA-256 ve RNG birebir; AI hiç söz kaydı üretmedi | n/a |
| `MP8_SCEN=V node tests/browser-mp8.cjs` (V0–V6) | **7/0** (koşu 4) | n/a |

**V koşu geçmişi** (ilk FAIL'ler kanıtta korunur: `aday-V-run1…4.log`):

| Koşu | Sonuç | FAIL ve kök neden |
|---|---|---|
| 1 | 4/2 | V4: test yardımcısı `cmd` ret gerekçesini döndürmüyordu. V5: Destek İste taslağında `warJoin` `want` tarafında, test `give`'i bekliyordu. |
| 2 | 6/0 | — |
| 3 | 6/1 | V6 yeni eklendi; `host.local` sonucu `{ok}` biçimindeydi (test). |
| 4 | 7/0 | — |

Ürün kusuru yalnız `encodeOffer`'daydı (§3); o da S5 ile bulundu.

**V senaryosu (host + B + C üç insan, 5 AI, orta, seed 22):**
- **V1:** C gerçek masada (dokunuşla) B'ye X'e karşı 90 günlük söz verir, karşılığında 100 Mineral ister. Özet "İLAN EDİLMEZ" der. B gelen kutusu kartından "Masaya otur"a basar, ⏱ ile son tarihi 180 güne çıkarır ve karşı teklif gönderir. C karttan kabul eder. Host'ta tek söz oluşur, savaş yoktur, karşılık bir kez ödenir. B "Sana verilen söz", C "Senin sözün" ve "Sözü yerine getir" düğmesini görür; host'un (üçüncü taraf) satırı yok.
- **V2:** Kaydet → host kapanır → yeni oda → misafirler döner; söz ve kalan süre aynı. C panel düğmesiyle hedef → Vasallaştırma → önizleme → son onay adımlarından geçer. Son onaydan önce savaş yok; son onayla savaş başlar ve söz "Tutuldu" olur. B de "Tutuldu" görür.
- **V3:** İkinci söz (hedef Y, 40 gün) tutulmaz → "Çiğnendi". B `paktBozdu` hatırlar, ilişki −20 düşer; durum iki aynada da görünür.
- **V4:**
  - Son tarihsiz söz `rules:quote` ile reddedilir, gerekçe görünür.
  - Çift kabulde, ya da hat donup kopsa da yalnız tek söz oluşur.
  - Hedef elenince söz "Düştü", ceza yok.
- **V5:** Savaş Merkezi "Şartlı Teklif…" taslağı ayna yeniden kurulup masa yeniden açılınca korunur.
- **V6:**
  - Host masaüstünden B'ye 180 günlük söz verir; B reddeder; ret sonrası söz kaydı yoktur.
  - Host yeniden gönderir, sonra geri çeker (iptal); geç gelen kabul işlenmez.
  - B host'a söz verir; host kendi gelen kutusundan kabul eder. İki panelde de söz görünür.

## 6. Bulunan ve düzeltilen kusurlar

1. **`encodeOffer` `warOn` son tarihini atıyordu (ürün kusuru):** gelen kutusu kartı ve karşı teklif taslağı etkileniyordu (§3). Düzeltildi.
2. **Test kökenli FAIL'ler (§5):** ret gerekçesi alınamaması, taslak tarafı, `host.local` sonuç biçimi, cid biçimi (W9: relay `bad-cmd`), fikstürde izolasyonist hedef AI (motor her anlaşmayı yasaklar).

## 7. Regresyon

**Tam Node** (`STARS_TEST_WORKERS=4 node tests/run-all.js`; günlük `evidence/mp-waron0/node-tam.log`, FAIL veren paketlerin günlükleri `node-tam/`):

| | Paket | GEÇEN | KALAN |
|---|---|---|---|
| p35 tabanı (`evidence/mp-deal-sys0/node-tam.log`) | 209 | 6337 | 276 |
| p36 aday | 212 | 6352 | 275 |

Paket paket karşılaştırma:
- 3 yeni paket: `mp_waron0_test` 9/0, `mp_waron0_sp_test` 5/0, `mp_waron0_equivalence_test` 0/0. Sonuncusu kontrol kökü verilmediği için tam koşuda NOT RUN; ayrı koşu 3/0.
- `mp3_core_test` 10/1 → 11/0. Bu, p35 fazında yapılan vaka güncellemesidir.
- Diğer bütün paketlerin sayıları aynı.
- Kalan 52 FAIL paketi p35 ile aynı; bu fazdan bağımsız, silinmedi.

**Yerel Chromium** (üretim kipi relay süreci + TLS vekili, oyuncu başına hat ve kalıcı profil; misafir 844×390 yatay dokunmatik, host 1280×800 masaüstü):

| Koşu | Sonuç | Not |
|---|---|---|
| `MP8_SCEN=V` (yeni) | **7/0** | Koşu geçmişi §5 |
| `MP8_SCEN=Z`: kayıt, olay, yeniden katılım | **14/0** | Z8 yeni davranışa göre güncellendi |
| `MP8_SCEN=Q`: savaş desteği, toprak vaadi | **8/0** (koşu 3) | Koşu 1: 7/1 · koşu 2: 7/1 (ikisi de Q6) |
| `MP8_SCEN=Y`: Sistem Devri, Haraç, kısayollar | **6/0** | |
| `MP8_SCEN=P MP8_P_MIN=15`: 500 sistem / 16 AI / 2 oyuncu / 15 dk | **8/0** (koşu 2) | Koşu 1: 7/1 (P5) |
| `browser-war-coalition0` | **5/0** | |
| `browser-mp-field-fix0-sp` | **1/0** | |
| `browser-beta-war-center0` | **10/0** | |
| SP eşdeğerlik (p35 sabit kopya) | **3/0** | |
| `verify-release` (çalışma ağacı) ve çıkarılmış ZIP `--root` | **DOĞRULANDI**: 19 dosya; oyun build 96h10p36 | |

**Q6 FAIL'leri (koşu 1–2):**
- Host, AI Z'nin hedef X ile mevcut ittifakı ya da saldırmazlığı yüzünden `warJoin`'i `warSupportGate` kuralıyla reddetti. Motorun meşru reddi; bu fazın değişikliğiyle ilgisi yok.
- Kök fikstürdeydi: Z yalnız "X ile savaşta değil" koşuluyla seçiliyordu. Oyun sırasında AI'lar arasında oluşan antlaşmalar Q6'yı aralıklı düşürüyordu; p34'teki "7/1 → 8/0" aralıklılığıyla tutarlı.
- Fikstür artık iki yönlü ittifak / saldırmazlığı denetliyor. Uygun aday yoksa bağı açıkça (fikstür olarak) kaldırıyor.
- İlk FAIL günlükleri: `regresyon/Q-run1.log`, `Q-run2.log`.

**P5 FAIL'i (koşu 1):**
- Misafirin gemi siparişini host `rejected` ile reddetti. Kök: **BELİRLENEMEDİ**, çünkü bu koşuda ret kodu ve stok kaydedilmedi.
- p26 (DESYNC1) raporunda aynı belirti "host'un meşru reddi (misafir alaşımı yetersiz)" olarak kayıtlı.
- Bu fazın değişikliği tersane ve gemi kuyruğu yoluna dokunmuyor.
- Teste tanı eklendi (ret kodu, gerekçe, misafir stoğu); koşu 2: 8/0. P5'te `ok`, ayna iletisi düşürüldü, misafir kendiliğinden geri aldı.
- İlk FAIL: `regresyon/P-run1.log`.

**P1 misafir haritası, oyun tarihi ve emir yansıması (iki koşu):**

| Ölçüm | Koşu 1 | Koşu 2 |
|---|---|---|
| Süre | 15 dk | 15 dk |
| Ön ilerletme | 30 ay | 30 ay |
| Donma | 0 | 0 |
| Host ile misafir arasındaki en büyük oyun günü farkı | 20,3 gün | 21,8 gün |
| Gerçek dokunuşla yapılan eylem | 1984 | 1911 |
| Son durum (misafir rev = host rev, uygulanan = rev) | 993 = 993 | 984 = 984 |
| Ay adımı | 5,2 s | 1,0 s |
| Misafir kurulum hatası / yeniden eşitleme | 0 / 0 | 0 / 0 |

**Ortam ayrımı:**
- **Yerel Chromium:** yukarıdaki tarayıcı koşularının hepsi.
- **Canlı Render:** yalnız salt okunur `/mp/version` (p33). Oynanış NOT RUN.
- **Fiziksel cihaz (PC / Android), LAN:** NOT RUN.

## 8. Açık saha vakaları ve açık işler

**Saha:**
- **Tek başına kayıttan devam edince olayların görünmemesi** ve **uzun oturumda misafir haritasının donması:** kullanıcı kaydı ya da canlı oturum olmadan doğrulanamaz → **AÇIK**. Yerel sonuçlar §7'de: Z 14/0 (Z5 / Z10 kayıttan dönüş ve olay şeridi dahil); P'de 15 dakikalık 500 sistem / 16 AI oturumunda donma yok, misafir revizyonu host'a eşit. Yeni bir hata üretilemedi.
- **Canlı Render oynanışı, fiziksel PC / Android, LAN:** NOT RUN.

**Ürün:**
- AI kendiliğinden son tarihli söz istemez ya da vermez. AI veren kabulde hemen ilan eder (tek oyunculu davranış). AI'nın sözü tutup tutmadığının ölçümü NF-5 ile yapılacak.
- Süre dolumu ay başında denetlenir, yani gecikme en çok 30 gündür. Tarih "YYYY/AA" olarak gösterilir.
- Kullanıcı kabulü yok; hiçbir madde TAMAMLANDI değil. main'e merge ve Render dağıtımı yapılmadı.

## 9. Sonraki faz görevleri

**Belge:** [`reports/claude/SONRAKI-FAZ-GOREVLERI.md`](https://github.com/sarsiss12-dot/Star/blob/claude/stars-mp-waron0/reports/claude/SONRAKI-FAZ-GOREVLERI.md). Pano satırları değiştirilmedi.

| Kod | Görev | Pano | Durum |
|---|---|---|---|
| NF-1 | Genel Savaş Sözü MP | #16, #31, #40, #43 | **TEST BEKLİYOR** (bu faz) |
| NF-2 | Teknoloji ve Lüks Mal MP: **sıradaki geliştirme adayı** | #40 | PLANLANDI |
| NF-3 | Casusluk Ağı / istihbarat maddeleri | #33 casusluk paneli | PLANLANDI |
| NF-4 | Saldırmazlık / Ticaret Paktı / Geçiş İzni kısayolları | #32, #22 | PLANLANDI |
| NF-5 | AI müttefik desteği ve vasallık | #40, #44 | PLANLANDI |

## 10. Teslim

- **Taslak PR:** https://github.com/sarsiss12-dot/Star/pull/51 (head `claude/stars-mp-waron0` → base `claude/stars-mp-deal-sys0` / PR #50).
- **Commit'ler:**
  - `718abb5`: motor, MP, arayüz, testler, sürüm, pinler;
  - `e365f3a`: V6, pinler, manifest, ZIP;
  - `04bfb86`: regresyon, belgeler, Q fikstürü;
  - son commit'ler: P tanısı, bu rapor. Bitiş HEAD = dalın ucu.
- **Render'da seçilecek dal:** `claude/stars-mp-waron0`. Dağıtım sonrası beklenen `/mp/version` §1'de.
- **ZIP** `releases/stars-faz96h10p36.zip`:
  - SHA-256 `39e3d380ac1851ed95810a1b0805670d0a51aa5217778fc94d38763d8ea1e520`;
  - CRC32 `232C4C41`; 925741 bayt; 20 girdi; iki üretim aynı SHA (deterministik);
  - çıkarılmış kopyada `verify-release.py --root` → DOĞRULANDI: 19 dosya; oyun build 96h10p36.
- main'e merge, Render dağıtımı ve force-push yapılmadı; kullanıcı kabulü bekliyor.
