# MP-SYNC-FED.0 — Barıştırma son onayı, misafir eşitlemesi ve emirler, kayıttan dönüş, federasyon gündemi (p38 / MP.8.9b37)

17 Kasım 2026 · Dal `claude/stars-mp-sync-fed0` · Başlangıç `0ecb080528f5f6d05bab21a8e4141f8d6f1a2536` (p38 / MP.8.9b36, `claude/stars-mp-diplo5`, taslak PR #53) · Bitiş HEAD: §8 · Oyun `96h10p38` (runtime 19 dosya **değişmedi**) · MP `MP.8.9b37` · Save8 v8 · paket 4 · protokol 1.

Hiçbir kalem TAMAMLANDI değildir; yerelde doğrulananlar `TEST BEKLİYOR`. PASS / FAIL / NOT RUN ayrı yazılmıştır. Eski saha vakaları gerçek oturumda ya da gerçek kayıtla doğrulanana kadar açıktır.

## 1. Özet

| Kalem | Commit | Durum | Yerel kanıt (aday / p38 kontrol) |
|---|---|---|---|
| S1 Barıştırma son onayı istihbarat kapısı | `b190074` | TEST BEKLİYOR | Node 6/0 (p38 3/3) · Chromium U7 PASS (p38 FAIL) |
| S2 Misafir eşitlemesi: pencere açıkken bekletme nedeni görünür | `49e3d21`, `e9edbfd` | TEST BEKLİYOR | MP8 O: O7 aday PASS / p38 FAIL; O0–O10 bağlantı + emir zinciri |
| S3 Kayıttan dönüş uyumluluğu | `46604e8` | TEST BEKLİYOR (ürün değişikliği yok) | Node 3/0 (p33 paketi adayda açılır; aday paketi p37/p33'te gerekçeli ret) |
| S4 Federasyon gündem kuyruğu (#50) | `49e3d21` | TEST BEKLİYOR (motor değişmedi) | Node 6/0 (p38 6/0) |
| Sürüm, koruma adaptörü, regresyon | `46604e8` + son | — | §7 |

## 2. S1 — Barıştırma son onayı

**Yeniden üretim (p38):** `tests/mp_sync_fed0_peacewith_test.js` p38 sabit kopya kökünde (`STARS_ROOT`) **3/3**: W1, W2, W6 FAIL. Gerçek host + misafir akışında (`MP8_SCEN=U`, U7) p38: C, B'den lüks + B'nin D ile savaşını bitirmesini ister; B kabul eder; host C'nin B üzerindeki istihbaratını İZLENİYOR altına düşürür; D gerçek gelen kutusu kaydından onaylar → **p38'de barış + lüks + ödeme uygulandı** (teknoloji / lüks aktarımı istihbarat şartı olmadan).

**Kök neden:** normal MP kabulü (`respond`) "İstiyorum" teknoloji / lüks maddelerini `dipAssetGate` ile yeniden denetliyordu; iki aşamalı Barıştırma'nın son onay dalı (`peaceWithLinkReply`, `respond` içindeki bağlı kayıt kabulü, `dipSweep` mediating döngüsü) yalnız `dealQuote` çağırıyordu.

**Düzeltme (`research/mp0/mp-core.js`):**
- `peaceWithFinalGate(O)`: asıl teklifin GÖNDEREN / ALAN / maddeleriyle `dealQuote` (diğer savaşan yetkisiyle) + `dipAssetGate`; karşı teklif istisnası (önceki turda karşı tarafın AÇIKÇA sunduğu madde) `O.prev` kaydından — paket → yeni host sonrasında da (W3).
- `peaceWithClose(O, why)`: bağlı onay kaydı `invalid`, asıl kayıt `invalid` + ayrıntılı neden (aracı ve veren görür); diğer savaşana yalnız genel metin: "Barıştırma koşulları değişti; hiçbir şey uygulanmadı" (aracının istihbaratı / pazarlık ayrıntısı gitmez).
- Üç yolda da aynı kapı: son onay (`peaceWithLinkReply`), `respond` ön denetimi, süpürme (`dipSweep`). Kısmi barış / kaynak / teknoloji / lüks uygulanmaz.

**Karşılaştırmalı test:**

| Vaka | p38 | Aday |
|---|---|---|
| W1 istihbarat düşer → D onayı hiçbir şey uygulamaz, D'ye ayrıntı yok | FAIL | PASS |
| W2 süpürmede kapanış (D dokunmadan) | FAIL | PASS |
| W3 karşı teklif istisnası paket → yeni host | PASS | PASS |
| W4 olumlu yol: paket → yeni host → D onayı → barış + lüks + ödeme bir kez; ikinci onay `closed` | PASS | PASS |
| W5 ret / geri çekme / çift dokunuş / geç onay | PASS | PASS |
| W6 cephe değişti / taraf elendi / lüks kaynağı kayboldu → kapanır | FAIL | PASS |
| Chromium U7 (gerçek host + misafir B/C/D) | FAIL ("barış uygulanmadı" beklentisi bozuldu) | PASS |

Kanıt: `evidence/mp-sync-fed0/s1/`.

## 3. S2 — Misafir haritası ve emirler (bağlantı testleri)

**Saha belirtisi:** misafir hız değişimi bildirimlerini görüyor, harita donuk; gemi hareket etmiyor, emirler ve yeni olaylar yansımıyor. Canlı Render bu doğrulamada **p33 / MP.8.9b30** sunuyordu (§6): belirtiler p33 oturumundan.

**Bulunan ve düzeltilen kusur (yeniden üretildi):** misafirde herhangi bir STARS penceresi (`#modal`, `.liveWorld` olmayan) açıkken ayna bilinçli olarak bekletilir (onaylar dünya kimliğini denetler). Neden notu ("Pencere açık — dünya, kapanınca güncellenir") yalnız MP çubuğuna yazılıyordu; çubuk pencerenin karartmasının **altında** kalır. Pencere üstü hap (`#mp61Pill`) ise yalnız bağlantı metnini ve hız bildirimini gösteriyordu. Sonuç: oyuncu "X hızı 3× yaptı" görürken dünyanın neden durduğunu göremiyordu — saha tarifiyle birebir uyumlu bir yol.
- `guest-stars.js chip()`: eşitleme bekçisinin notu (pencere bekletmesi, gecikme, yeniden eşitleme) pencere üstü hapa da gider.
- `mp61.js paint()`: hız bildirimi varken sorun metni aynı hapta " · " ile.
- O7 (gerçek Chromium, açık pencere, 2× → 3×): p38 hap **boş** (FAIL); aday "Kızıl Muhafız hızı 3× yaptı · Pencere açık — dünya, kapanınca güncellenir", hap pencerenin üstünde (`elementFromPoint`), pencere kapanınca misafir host gününe yetişir (PASS). Ekran: `evidence/mp-sync-fed0/s2/o7-aday/o7-hiz-bildirimi.png`.

Not: bu kusur "pencere açıkken" donmayı açıklar; açık pencere OLMADAN sahada donma yaşandıysa bu fazda o yol yeniden üretilemedi (aşağıdaki bağlantı vakalarının hepsi kendiliğinden toparlandı). Saha vakası açık kalır.

**Yeni senaryo `MP8_SCEN=O`** (`tests/helpers/mp-sync-fed0-mp.cjs`; üretim relay süreci + TLS vekili + oyuncu başına kesilebilir/dondurulabilir hat, host + 2 misafir, ayrı Chromium profilleri, MP.7 tasarım lobisi, gerçek STARS misafir arayüzü; 3 insan + 5 AI, orta, seed 22). Her emir kaydı: oyun günü, host dünya revizyonu, misafirin aldığı ve uyguladığı revizyon, son ayna yaşı, komut kimliği (cid), host yanıtı ya da ret kodu, host'ta uygulandı mı, misafire yansıma süresi ve zaman serisi. "Host'a hiç ulaşmadı" (yanıt yok), "host reddetti" (ret kodu) ve "kabul edildi ama misafire yansımadı" (host uyguladı, misafir yoklaması süre doldu) ayrı alanlardır.

| Vaka | Koşul (Chromium benzetimi; fiziksel Android DEĞİL) | Sonuç (aday) |
|---|---|---|
| O1 kısa kopma 3 sn | kopukken emir yerel reddedilir; dönüşte filo rotası + tersane + bina emri | host'ta bir kez, misafire 35–548 ms |
| O2 açık görünen ama veri taşımayan hat (30 sn donma, oyun akarken) | misafir notu ilk kez ~16 sn'de ("Host yanıt vermiyor — yeniden eşitleniyor"), dönüşte donmada verilen emir bir kez | PASS |
| O3 kayıp dünya güncellemesi (ayna 12 sn düşürülür; hız ve nabız geçer) | nabızla eksik algılanır (7. sn "Eşitleme gecikti"), yeniden istenir, harita yetişir | PASS |
| O4 kayıp host yanıtı (sonuç iletisi düşer) | tersane siparişi host'ta tek, ikinci gemi / ödeme yok | PASS |
| O5 arka plan (sayfa 20 sn dondurulur, oyun akar) → öne dönüş | dünya yetişir, emir zinciri çalışır | PASS |
| O6 aynı odaya yeniden katılma (sayfa yenileme) | aynı devlet; emir zinciri; insan → insan teklif kartı ve kabul bir kez (tek ödeme) | PASS |
| O7 açık pencere + hız değişimi | yukarıda | aday PASS / p38 FAIL |
| O8 federasyon oyu, yanıt kaybı + kopma, ikinci basış | host'ta B'nin oyu tam bir kez; misafir aynasında kendi oyu, "bekleniyor" kalkar | PASS |
| O9 harita tutarlılığı | kendi filoları (konum, rota, can) ve sistemleri host ile aynı | PASS |
| O10 rota / akıcı konum / görünür sahiplik — kopma, yeni ayna ve açık panelden sonra | rota bacağı aynı; `View.fleetPoint` 6 farklı nokta / 2 ayna (akıcı); 15 görünür sistemin sahipliği host ile aynı | PASS |

Tam O koşusu §7'de. İlk ölçüm hataları (bilerek korunur, `s2/ilk-fail-olcum/`): filo emri denetimi `f.mv` arıyordu (motor `f.path`'e yazar), fikstür yuvası dolu gezegene bina veriyordu (`rules:slots` — host'un doğru reddi), O7 görünürlük denetimi `pointer-events:none` hapı `elementFromPoint` ile göremiyordu. Bunlar test hatasıydı; ürün davranışı değişmedi.

**Bu fazda ayrı ölçülmeyenler:** savaşan filonun can çubuğu ve bilinen kolonileştirilebilir işaretler (önceki MP-P0-KURTARMA kapsamı; NOT RUN bu fazda); sensör paylaşımının doğru oyuncuya gitmesi `mp_techlux0_intel_test` + T senaryosu (§7).

## 4. S3 — Kayıttan dönüş ve olay şeridi

`tests/mp_sync_fed0_resume_test.js` (Node, gerçek motor + mp-core):
- **R1** aday paketi (bekleyen Barıştırma onayı + açık federasyon oyu + gündem + tersane kuyruğu + bekleyen insan→insan teklifi) → YENİ host: hepsi aynı; yayın Barıştırma kaydını kapatmaz; verilen oy ikinci kez sayılmaz; oy yeni host'ta tamamlanır ve sıradaki gündem açılır. Son onayın yeni host'ta bir kez uygulanışı: S1 W4. PASS.
- **R2** aynı paket eski sürümlerde: p37 ve p33 `validatePackage` → `build`; o sürümün kendi arayüz metni **"Kayıt başka bir oyun sürümüne ait."** Çökme yok. PASS. (Metin sürüm adını söylemez; eski sürümler değiştirilemez.)
- **R3** p33 sabit kopya kökünde üretilen MP paketi (build `96h10p33`; açık oy, bekleyen teklif, tersane) adayda doğrulanır, yüklenir, yeni host kurulur; durum aynı; oy verilebilir ve sonuçlanır. PASS.
- Eski kökler `STARS_OLD_ROOTS` / `STARS_P33_ROOT` ile verilir; verilmezse R2/R3 NOT RUN yazılır.

Tarayıcı (gerçek menü ve dokunuş): MP **Kayıtlı Oyuna Devam Et** → host tek başına yeni oda, bekleyen / gizlenen olaylar, yeni olay ve anomali şeridi; misafirin yeni kodla dönüşü (ana menü, eski `/mp/join` bağlantısı, DAVET PAYLAŞ, sayfa yenileme, aynı profilde ikinci sekme, eski kod kutusu kilitlemez) `MP8_SCEN=Z` Z5/Z6/Z13; Federasyon Kuruldu ve oy kartı gerilemesi `MP8_SCEN=E`/`F`; SP **Oyuna Devam Et** `browser-mp-field-fix0-sp.cjs`. Sonuçlar §7.

**Kullanıcının gerçek kaydı:** bu oturumda dosya yok → NOT RUN. Kullanılan sürüm ve menü her satırda §7'de yazılıdır.

## 5. S4 — Federasyon gündem kuyruğu (#50)

`tests/mp_sync_fed0_agenda_test.js` (MP komut yolu + gerçek `UI.fedAgendaList`): aday **6/0**, p38 **6/0** → motorda kusur yok; doğrulama.
- A1 savunma (acil) oyu açıkken başka üyenin ve aynı üyenin başka savaşı için destek talebi kuyruğa girer; aktif oy kesilmez; bedel kesilmez; sıra ve "🚨 ACİL SAVUNMA" etiketi görünür; aynı cephe ikinci kez "Bu savunma olayı zaten gündeme alındı". Açık savunma oyu ilk acil açılış sayılır; iki acilden sonra olağan öneri sırasını alır (olağan süresiz itilmez).
- A2 acil savunma ("Mevcut Savaşa Katılma") ile başlamamış savaş için saldırı izni ("Ortak Savaş İzni") ayrı; saldırı izni acil sayılmaz; kuyrukta savaş başlamaz.
- A3 açık oy + olağan kuyruk + acil öneri MP paketiyle yeni host: sıra, kimlik, belirteç, verilmiş oylar aynı; sıradaki acil açılır, ücret alınmaz.
- A4 düşme nedenleri: savaş biter / öneren ayrılır / hedef elenir / süre dolar — gerekçeyle, bedelsiz; sıradaki geçerli öneri açılır.
- A5 aynı cid tekrar, aynı öneri ikinci kez ("zaten kuyrukta"), kapanmış oya geç dokunma: ikinci kuyruk / oy / bedel yok.
- A6 host + misafir + AI aynı anda: tek aktif oy, kimlik sırasıyla FIFO, misafir aynasında kendi satırı (π).

**"Savunma oyu açıkken yeni destek talebi verilemedi" saha vakası:** motor ve host kapısı izin veriyor (A1). Fark misafirin düğme kapısında: başka üyenin savunma savaşına destek düğmesi yalnız o savaş BİLİNİYORSA çıkar (`knownWarPairs`: taraf ya da istihbarat ≥3). Aynı kural tek oyunculuda da geçerli — misafire özgü değil. Ölçüm: B, C'nin savaşına destek → host `ok`, misafir kapısı "Savaş veya desteklenen üye artık geçerli değil". Federasyon üyesinin savunma savaşını otomatik "bilinen" saymak gizlilik kuralı değişikliğidir → kullanıcı kararı (NF-9). Kod değiştirilmedi.

NF-8 bağlantısı düzeltildi: federasyon gündem kuyruğu **#50**, Galaktik Konsey iki aşamalı gündemi **#51** (NF-10). `SONRAKI-FAZ-GOREVLERI.md` güncellendi.

## 6. Render, cihaz, LAN, gerçek kayıt

| Konu | Sonuç |
|---|---|
| Canlı Render `/mp/version` (salt okunur, 17 Kasım 2026) | `MP.8.9b30` / `96h10p33` (soğuk başlatma ~60 sn). Kanıt `evidence/mp-sync-fed0/render/mp-version-2026-11-17.json` |
| Beklenen `/mp/version` (bu dal) | `{"mp":"MP.8.9b37","build":"96h10p38", files: mp-core fb1e83e21285, relay 739062bb3a9e, mp1-host f5dc296c1a3d, join 65c28db3714f, mirror f9043c6e87a3, guest-stars 3b631ff922e8, mp71-dip 932c92d12cbc, mp7-setup a7391d21552c}` (`render/beklenen-mp-version.json`) |
| Render dalı | `claude/stars-mp-sync-fed0` seçilmeli (deploy yapılmadı) |
| Canlı Render oynanış | NOT RUN |
| Fiziksel Android / PC | NOT RUN |
| LAN | NOT RUN |
| Kullanıcının gerçek kaydı | NOT RUN (dosya yok) |

## 7. Regresyon

### 7.1 Son HEAD'de koşular (yerel Chromium, üretim relay süreci + TLS vekili; fiziksel cihaz DEĞİL)

| Koşu | Sonuç | Not |
|---|---|---|
| Tam Node `node tests/run-all.js` | 226 paket · **6440 geçen / 275 kalan** | p38: 223 · 6427 / 275. Mevcut her paket aynı sayı; +13 yalnız yeni üç paket (peacewith 6, agenda 6, resume 1 + 2 NOT RUN kök verilmeden) |
| `mp_sync_fed0_peacewith_test` | 6/0 (p38 3/3) | S1 |
| `mp_sync_fed0_agenda_test` | 6/0 (p38 6/0) | S4 |
| `mp_sync_fed0_resume_test` (p37 + p33 kökleriyle) | 3/0 | S3 |
| `MP8_SCEN=O` | 11/0 | O0–O10 (yeni) |
| `MP8_SCEN=U` | 8/0 | U7 dahil (host + B + C + D) |
| `MP8_SCEN=T` | 8/0 | sensör paylaşımı T5/T6 |
| `MP8_SCEN=V` | 7/0 | |
| `MP8_SCEN=Z` | 14/0 | kayıt → yeni oda, yeni kodla dönüş, eski `/mp/join`, DAVET PAYLAŞ, ikinci sekme, eski kod |
| `MP8_SCEN=Q` | 8/0 | |
| `MP8_SCEN=Y` | 6/0 | |
| `MP8_SCEN=E` / `F` | 6/0 / 6/0 | Federasyon oy kartı, FEDERASYON KURULDU tekrarı gerilemesi |
| `browser-mp-field-fix0-sp.cjs` | 1/0 | SP Oyuna Devam Et: bekleyen / gizlenen olay, yeni olay ve anomali |
| `MP8_SCEN=P` (varsayılan 6 dk) | 8/0 | P5 = duraklatılmış oyunda kayıp ayna → tersane sırası görünür |
| `MP8_SCEN=P MP8_P_MIN=15` (P0+P1) | 2/0 · 366 örnek, 20 sn üstü misafir duraklaması **0**, 1683 gerçek dokunma eylemi, 20 komut, en büyük gün farkı 23,5 (host en yüksek hızda) | 500 sistem / 16 AI / 2 insan / 15 dk gerçek döngü |
| `python3 tools/verify-release.py` | DOĞRULANDI (19 dosya, 96h10p38) | runtime ve manifest 0ecb080 ile aynı |

Kanıt: `evidence/mp-sync-fed0/regresyon/`, `node-tam/`.

### 7.2 p38'den gelen 275 eski FAIL — kullanıcıyı etkileyen MP / kayıt / bildirim / federasyon paketleri

Aday ve p38 tam koşularında **her mevcut paket aynı geçen/kalan sayısını** verdi (fark yalnız yeni üç paket): bu iki koşuda eski FAIL'ler deterministik, aralıklı değil. İlk FAIL günlükleri silinmedi (`evidence/mp-sync-fed0/node-tam/`).

| Paket (p38 = aday) | Sınıf | Gerekçe (ölçülen) |
|---|---|---|
| `faz85a/b/c/d/e/f_*_continuity` (175/2 … 92/59) | Eskimiş test beklentisi | Kum havuzu `inbox.js`'i yüklemiyor: "DiplomaticInbox is not defined"; 120–360 ay döngüsü bu yüzden düşüyor |
| `mp63_polvas_test` (4/7) | Eskimiş | Kuruluş artık açık davet + rıza (BETA-FED-FOUND.0, p14) ve ittifak şartı yok (BETA-RIVAL-BLOCS.0, p30); test eski doğrudan `foundFederation` yolunu bekliyor |
| `faz96e_federation_test`, `faz95b_federation_reform_test` (kabul ittifak kuralı, tek açık gündem) | Eskimiş | p30 ittifak şartı kaldırıldı; BETA-BOARD.1 gündem kuyruğu (öneri reddedilmez, sıraya girer) |
| `faz91e_federation_laws_test` (oyuncu önerisi) | Eskimiş | Aynı kuyruk kuralı |
| `beta_fed_found0_compat_test` (1/5) | Eskimiş | p14 ham Save8 eşitliği; sonraki fazların bilinçli alan eklemeleri |
| `beta_fed_found0_events_test` (10/1) | Eskimiş metin | Zincir açıklaması "Bu aşamada kaynak/ödül uygulanmaz" (test "şimdi ödül uygulanmaz" arıyor); anlam aynı, ödül uygulanmıyor |
| `mp84_notice_identity_test` (4/1) | Eskimiş | p14'ten beri karar olayı (event/anomaly/chain) `hidden` Save8 olay codec'ine yazılır (gizlenen karar yüklemede ☰ listesinde kalır) |
| `faz95e_news_test` (19/1) | Eskimiş (UX gözlemi) | Barış iki kayıt üretir: kamu "Barış anlaşması" + BETA-P0.1'in sabit "Savaş sona erdi" (savaş paneli) kaydı. Bilinçli; haber listesinde iki ilgili kart görünmesi ayrı UX kararı |
| `beta_p01_mirror_test` (2/1) | Eskimiş | Kamu savaş DTO'suna sonraki fazların eklediği alanlar (deep-equal) |
| `faz96h71_closed_joint_save_test`, `faz95e_ui_save_test` vb. koruma | Eskimiş pin | Eski sürüm bayt karşılaştırmaları sonraki onaylı değişikliklerle |
| `faz95d_identity_test` (3) | Bilinen ortam | Node v22 kayan nokta son basamak |

Bu sınıflandırmada **gerçek ürün kusuru bulunmadı**; testler değiştirilmedi / silinmedi (ayrı test bakım fazı).


## 8. Teslim

- Dal `claude/stars-mp-sync-fed0`; commit'ler `b190074` (S1), `49e3d21` (S2 + S4 testi), `e9edbfd` (O10), `46604e8` (sürüm + koruma + S3 testi), son commit (rapor, görev belgesi, CLAUDE.md, kanıt). Bitiş HEAD bu raporu içeren dal ucudur.
- Taslak PR: `claude/stars-mp-diplo5` (PR #53) üstüne. Main'e birleştirme ve Render dağıtımı yapılmadı.
- ZIP: runtime 19 dosya ve `RELEASE-MANIFEST.json` 0ecb080 ile aynı → yeni ZIP üretilmedi; p38 ZIP'i geçerli (`verify-release` DOĞRULANDI).
- Render'da seçilecek dal: `claude/stars-mp-sync-fed0`; beklenen `/mp/version` §6.
- Görev durumu: S1, S2, S3, S4 `TEST BEKLİYOR`; eski saha vakaları açık.

## 9. Sonraki işler (kayıt; geliştirilmedi)

- NF-7 AI barışçıl biat daveti (kullanıcı kararı bekliyor).
- NF-9 federasyon üyesinin başka üyenin savunma savaşını bilmesi (gizlilik kuralı kararı).
- NF-10 Galaktik Konsey gündem seçimi (#51).
- NF-11 tersane yerleşimi; NF-12 gezegen ekonomisi dökümü.
- Açık saha vakaları: açık pencere olmadan uzun oturumda misafir haritasının donması; tek başına kayıttan dönüşte görünmeyen olaylar — gerçek oturum / gerçek kayıtla doğrulanana kadar açık.
