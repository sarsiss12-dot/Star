# BETA-EVENT-UX.1 — Federasyon / Konsey bildirimlerinin tamamlanması, tekrarlayan kuruluş kartı, P0 koruması (12 Kasım 2026)

Dil kuralı: **PASS / FAIL / NOT RUN** ayrı yazılır. Bütün tarayıcı testleri yerel Chromium'dur; gerçek Render, fiziksel PC / Android ve LAN **NOT RUN**.

## 1. Kaynak

| | |
|---|---|
| Başlangıç | `claude/stars-beta-event-ux0` @ `998e999992bf8cc1abc9be4df88a6e21d6df05b8` (GitHub ucu; doğrulandı) — `96h10p24` / `MP.8.9b20` |
| Yeni dal | `claude/stars-beta-event-ux1` (bu uçtan) |
| Bitiş | oyun **`96h10p25`**, PWA `stars-v96h10p25`, MP **`MP.8.9b21`**; Save8 v8, paket 4, protokol 1 değişmedi |

## 2. Tarihsel "FEDERASYON KURULDU" tekrarı — YENİDEN ÜRETİLDİ, KÖK NEDEN DÜZELTİLDİ

**Test:** `MP8_SCEN=F node tests/browser-mp8.cjs` — host + 2 misafir, ayrı Chromium, gerçek dokunma. Kuruluş, gerçek kuruluş penceresi ve davet kartıyla yapılır.

**Aşamalar:**
- a: kuruluş
- b: B sonuç kartını açıp kapatır
- c: 5 yayın + gün
- d: B'nin hattı kopar ve yeniden bağlanır
- e: B'nin sayfası yenilenir
- f: host dünyası `serialize → deserialize` ile yeniden yüklenir
- g: aynı federasyonda yeni yasa oylaması

**Taban p24 (998e999) sonucu — FAIL:**

| aşama | B görünür "kuruldu" | host görünür kuruluş kartı |
|---|---|---|
| a | 2 | 4 |
| b (açıldıktan sonra) | 2 | 4 |
| c | 1 | 4 |
| d | 1 | 4 |
| e | 0 | 4 |
| f | 0 | 4 |

Host kartları: "KURULUŞ SONUCU · 1/2 onay", "KURULUŞ SONUCU · 2/2 onay", "FEDERASYON KURULDU — …", "Federasyon kuruldu" (haber kartı).

**Kanıtlanan üç neden:**
1. `fedFoundCards` her ara durum için (1/2 onay, 2/2 onay, KURULDU) yeni bir kart doğuruyor, eskisini hiç kaldırmıyordu. Kurucunun çubuğunda aynı kuruluş için kartlar birikip takılı kalıyordu.
2. `openNote` kuruluş **sonucu** kartını açınca yalnız Gelen kutusu kaydını gösteriyor, kartı çubuktan kaldırmıyordu. Kart açıldıktan sonra da kalıyordu (host'ta kalıcı; misafirde bir sonraki aynaya kadar).
3. p24'ün bilgi kartı, aynı kuruluşu motorun "Federasyon kuruldu" haberinden **ikinci kez** gösteriyordu. Bu benim önceki fazımın gerilemesi.

**Düzeltme (`ui.js`):**
- Aynı önerinin eski sonuç kartı, yenisi doğarken kalkar; kayıtları geçmişte kalır.
- Sonuç kartı açılınca çubuktan kalkar.
- Açık kuruluş süreciyle kurulan federasyonun "kuruldu" haberi bilgi kartı yapılmaz; sonuç kartı tektir. AI'nin kurduğu federasyonun haberi kart olmaya devam eder.

**Aday sonucu — PASS:** a'da B 1, host 1. b–g'nin hepsinde B, host ve C (üye değil) **0**. g'de B'de ve host'ta tek "oylaması sonuçlandı" kartı; kapanmış oy kartı yok.

**Bu test sırasında bulunan ek gerçek hata:** oylama kaydı Gelen kutusu eşitlemesiyle (`DiplomaticInbox.sync`, ör. haber arşivi açılınca) karttan **önce** doğduysa, kaydın notunda kartın uid / anahtarı yoktu. Kart hızlı EVET / HAYIR düğmelerini kaybediyordu (taban + ilk aday F3: "locator.tap timeout"). `noteRecord` artık oylama kaydını oylamanın kendisinden türetilen anahtarla (`'vote:'+federasyon+':'+oy`) bulur; capture kuralı aynı.

## 3. Eklenen bildirimler

Hepsi oyuncunun zaten yetkili olduğu veriden türetilir; yeni siyasi karar motoru yok.

**Federasyon**
- **Katılım daveti / ayrı aday rızası (karar kartı):** motorun DiplomaticInbox'ında `invite` kaydı vardı ama üst çubukta kart **yoktu** (tek oyunculu ve misafir). Artık "FEDERASYON DAVETİ — X" kartında KABUL / REDDET. Aynı `DiplomaticInbox.resolve` yolu: tek oyunculu `acceptFedInvite` / `rejectFedInvite`, misafirde host `fedReply`. Bekleme durumu görünür. Kart Save8'e girmez; davet sürdükçe görünür.
- **Üyelik başvurusu:** (oy kabul edilip rıza beklenince başvurunun eski "oylamada" kartı kalkar; karar davet kartındadır)
  - Üyeye: oy kartının alt yazısı "Üyelik başvurusu — <başvuran>" (tek oyunculu `UI.fedVoteSub` ve misafir aynı işlev). Öteki hedefli önergeler hedef adıyla gösterilir.
  - Başvurana: "Üyelik başvurun oylamada / kabul edildi / reddedildi / süresi doldu" bilgi kartı (motorun `admissionResults` satırı; misafire aynada yalnız kendi satırı gider). Başvuru kabul edilmiş gibi gösterilmez; rıza ayrı karttadır.
- **Federasyon başkanı değişimi:** motor yalnız günlük satırı yazıyordu. Üyeye "Federasyon başkanı değişti — yeni başkan" kartı. Başkan seçimi önergesi, başkanın ayrılması ve ölümü aynı kaynaktan gelir; aynı değişim tek kart. Seçim önergesinin ayrıca haber kartı yapılmaz (çift olmasın).
- **Önerge / reform haberleri:** ham metin ("— elect", "— bilimsel") yerine okunur ad (FED_MOTIONS / FED_TYPES).
- Katılım, ayrılış, ihraç, dağılma: p24'teki haber kartı (değişmedi).

**Konsey**
- **Başkanlık değişimi:** dönem sonu seçimi ya da daimi hükümdarlık sonucu başkan gerçekten değişince üyeye "Konsey başkanlığı değişti — yeni başkan" kartı; dokununca Konsey paneli.
- **Yasanın yürürlükten kalkması:** motorda yalnız Koruyucu vetosuyla olur ve haber üretilmiyordu. Üyeye "Konsey yasası yürürlükten kalktı — <yasa>" kartı.
- **Kabul / red:** savaş yasağı, yaptırım, Muhafızlar dahil her yasa motorun "Konsey kararı" haberinden (p24).
- **Olağanüstü Konsey toplantısı:** güncel motorda böyle bir mekanik **yok**; kart üretilmedi (sahte olay yok). "emergency" yalnız federasyon gündemindeki acil savunma önergesi için var; o da normal oy kartıyla gelir.

**Metin**
- "gün 9.4065…" gibi kesirli gün yalnız gösterimde tam güne yuvarlanır (`UI.dayText`). Haber arşivi satırı ve ayrıntısı ile bilgi kartları kapsamda. `G.day`, haber kaydı ve Save8 değişmez.
- 800×360'ta kartlarda yatay taşma yok (S8 denetimi).

## 4. Hızlı karar güvenliği

| Durum | Sonuç |
|---|---|
| Tek gerçek karar, host yetkisi | Davet KABUL: misafirde tek `fedReply` komutu (F4), host'ta üye. Federasyon / Konsey oyu p24 yolları (E2, E4, F3). |
| Çift dokunma | Davet: ikinci dokunma bekleme durumuna çarpar (F4: tek komut). Oy: `decWait` / token (p24). |
| Geçersiz / eski karar | Davet düştüyse "Davet artık geçerli değil"; kapanmış oy kartı filtrelenir (F3: `staleVote` 0). |
| Üye olmayana | C'de oy / kuruluş / başkan kartı yok (F1–F3); başvuru sonucu yalnız başvurana. |
| Misafirde yerel taklit | Yok; karar host'ta uygulanır, kart host durumu gelince kalkar. |
| Hız / duraklatma | Bilgi ve davet kartları `G.inbox` dışında; hız üretmez (p24 E3 kuralı). |

## 5. Casusluk paneli (#55) — yalnız regresyon

`browser-event-ux0.cjs` S1, dört ekran boyutu (fare ve dokunma):
- Genişlet → Sistem / Filo standart genişlikte → Casusluk son genişlikte.
- Diplomasi aç / kapa sonrası korunur.
- Dokunmatik sürükleme harita seçimini değiştirmez.
- Sayfa yenilenince hatırlanır; Save8'de yok.

Kod değişmedi. Sonuç §6'da. Fiziksel Android NOT RUN.

## 6. Test tablosu

| Test | Taban p24 `998e999` | Aday p25 |
|---|---|---|
| `MP8_SCEN=F` F0–F5 (kuruluş tekrarı, yeni karar, başvuru + davet, başkan) | **1 / 5** (yalnız F0 kurulum PASS) | **6 / 0** |
| `browser-event-ux0.cjs` S6–S8 (davet / başvuru / başkan / yasa kalkması / gün metni) | **0 / 3** | 3 / 0 |
| `browser-event-ux0.cjs` tam (S1–S8 + sayfa hatası; casusluk regresyonu dahil) | — | **11 / 0** (üç ardışık koşu) |
| `MP8_SCEN=E` (p24 kartları) | — | 6 / 0 |
| `MP8_SCEN=P` (500 sistem / 16 AI, 3 dk gerçek zaman + P0 hedefli) | — | 8 / 0 |
| `MP8_SCEN=R` (kayıt / devam), `N` (ağ kopmaları) | — | 5 / 0, 9 / 0 |
| mp61 / mp73 / mp74 / mp75 | — | 13/0, 8/0, 7/0, 6/0 |
| Tam Node | 6190 / 278 | 6190 / 278 (paket farkı yok) |

İlk FAIL'ler ve nedenleri (ürün: davet gelince eski "oylamada" kartı kalıyordu → düzeltildi; test zamanlaması / fikstür: S3, S6, P6, P7) REGRESYON.md'de korunuyor.

Kalan regresyon (P0, 500 yıldız, kayıt / devam, MP paketleri, Node tam koşu): `reports/claude/evidence/beta-event-ux1/REGRESYON.md`.

## 6.1 Paket

`releases/stars-faz96h10p25.zip`
- SHA-256 `86720c077e46b0dfd7460286c36eb914ac7e582846b231beec7e49cd462d82fa`
- CRC32 `ED461992`, 20 girdi
- Deterministik; çıkarılan ZIP doğrulandı (19 dosya, `96h10p25`).
- Manifest: `phase BETA-EVENT-UX.1`, `parent_commit 998e999…`, `parent_zip_sha256` = p24 ZIP.
- Save8 v8 / paket 4 / protokol 1 aynı; p25, p6–p24 paketlerini kabul eder.

## 7. Değişen dosyalar

- Runtime:
  - `ui.js`: `fedFoundCards` eski sonuç kartını kaldırır; `openNote` sonuç kartını kaldırır; `noteRecord` oy kaydı yedeği; `dayText`, `instInfoRows` haber biçimi + başvuru sonucu, `instLeaderRows` (federasyon / Konsey başkanı, yasa kalkması), `instInviteRows` / `instInviteRecord` / `instDecide`, `fedVoteSub`.
  - `archive-ui.js`: haber metninde gün gösterimi.
  - `main.js` (`BUILD_ID`), `sw.js` (`CACHE`).
- MP:
  - `research/mp6/client/guest-stars.js`: misafir oy kartı alt yazısı `UI.fedVoteSub`; `instDecide` görünüm eylemi.
  - `research/mp0/mp-core.js`: yalnız p25 için p6–p24 paket uyumluluğu.
  - `research/mp1/client/view.js`, `research/mp1/server/relay.js`: sürüm.
- Test:
  - `tests/helpers/event-ux1-mp.cjs` (F senaryosu), `tests/browser-mp8.cjs` (F), `tests/browser-event-ux0.cjs` (S6–S8).
  - Koruma: `tests/helpers/beta-event-ux1-reviewed.json` + `event-ux1-reviewed.cjs`. Zincir ux1 → ux0 → ui23; beş runtime dosyası p22 baytlarına birebir geri kurulur, doğrulandı.

## 8. Açık kalanlar

- Gerçek Render, fiziksel PC / Android, LAN: **NOT RUN**.
- Olağanüstü Konsey toplantısı: mekanik yok.
- Tek oyunculuda kuruluş sonuç kartının kaldırılması Save8'deki `G.inbox` içeriğini etkiler. Daha az eski kart kalır; bu amaçlanan bir farktır. Stratejik alan / RNG değişmez (Node eşdeğerlik paketleri, REGRESYON.md).

## 9. BETA-FED-FLEET.0 devir notu

Kesin bulgular ve plan `reports/claude/BETA-EVENT-UX0-SONUC.md` §10'da (yeniden araştırılmadı). Uygulama sırası:

1. **Tek fon:** `FED_LAWS.filo` bağışını `f.fund.ala`'ya yönlendir; eski `f.treasury` yüklemede bir kez aktarılır.
2. **Tek bakım:** `fleetUpkeep` / `fleetAlloyUpkeep` `f.federal`'ı atlasın; bakım yalnız `fedFundTick`'te ve fondan.
3. **Başkan tersane arayüzü + MP komutu `fedShip`:** host `canBuildFederal`; mevcut tersane sırası.
4. **Ayna:** üyeye fonun gerçek değeri gitsin (bugün 0).
5. **AI:** yalnız başkan AI ise ayda en çok bir sipariş, fon eşikli.
6. **Dağılma:** filo dağıtılır, fon üyelere geri.
7. **Kabul:** yasa yokken Save8 / RNG kontrol–aday birebir; fon akışı; çift bakımın yokluğu; başkan değişimi; MP misafir başkan siparişi.

Ardından **BETA-COUNCIL-GUARD.0** (önce yanıltıcı yasa açıklaması), sonra **BETA-MILITARY-COMMITTEE.0** (`jointOps` üzerinde).
