# MP-FIELD-VERIFY.0 — p34 saha düzeltmelerinin gerçek oyuncu akışında doğrulanması

Tarih: 15 Kasım 2026 · Dal: `claude/stars-mp-field-verify0` · Başlangıç HEAD: `0ec601797eb392d2ef223b84813cc83777df6b74` (p34, PR #48 taslak) · Bitiş HEAD: §10
Sürüm: oyun **96h10p34** (runtime 19 dosya ve p34 ZIP'i DEĞİŞMEDİ) · MP **MP.8.9b32** (yalnız MP istemcisi + relay sürüm işareti) · Save8 v8 / paket4 / protokol1

> Kanıt türleri ayrı yazılır: **Yerel Chromium** (üretim kipi relay süreci + TLS vekili + oyuncu başına TCP hattı + ayrı kalıcı profiller), **Node vm**, **canlı Render** (yalnız salt okunur sürüm sorgusu), **fiziksel cihaz** (NOT RUN). Kullanıcı kaydı yok: tüm kayıt testleri senaryo içinde üretilen sentetik MP paketiyle (orta galaksi, 3 insan + 5 AI, tohum 22) yapıldı.

## 0. Özet

| # | Bulgu | Yeniden üretildi mi? | Kök neden | Değişiklik | Test |
|---|---|---|---|---|---|
| 0 | Render hangi sürüm? | Evet (salt okunur) | Canlı Render **p33** sunuyor: `/mp/version` = `MP.8.9b30` / `96h10p33`, 8 MP dosyasının özeti `0ec5720` ile aynı; `main.js` `BUILD_ID 96h10p33`, `sw.js` `stars-v96h10p33`; `/mp/join?code=` 200 (p34'ün 302'si yok) | Yok (dağıtım kullanıcıda) | `curl` çıktıları §1 |
| 1 | Birlikte yeniden giremedik | **Evet** (Z13, p34 kontrolünde FAIL) | Host kaydı yeni odada açınca eski oda relay'de **10 dk** (`MP1_HOST_GRACE_MS`) açık kalır. Eski kodla (adresteki `?code=` / otomatik dönüş / elle) ilk katılım `welcome{host:false}` alır; `join.js` ekranı "Bağlanıyor…" durumunda, kod/ad kutusu ve KATIL **pasif**, soket açık bırakıyordu → oyuncu yeni kodu yazamıyordu | `join.js`: ilk katılımda host yoksa soket kapanır, giriş ekranı düzenlenebilir döner, aşama **ODA** + "Bu odada host yok… YENİ kodu gir" | Z13 aday PASS |
| 2 | Arkadaş tek başına kayıttan devam edince olay penceresi boş | **Hayır** | Üç yolda olay üretimi → atama → (misafire taşıma) → şerit → liste açılışı ölçüldü; kusur bulunmadı. Boş görünmenin meşru üç nedeni ölçüldü: ⚡ otomatik çözüm, Rastgele Olaylar kapalı, olayların seyrekliği (§3) | Yok | Prob + Z5/Z6/Z10 + SP testi |
| 3 | Q6: toprak vaatli destek teklifi bazen host'a ulaşmıyor | **Evet** (Z11/Z12, p34 kontrolünde FAIL) | `join.js` `J.cmd` soket AÇIK değilken (`raw()` false) de `{ok:true}` dönüyordu; misafir taslağı GÖNDERİLDİĞİ AN silip "gönderildi" yazıyordu. Kapanan / yarı ölü sokette komut kayboluyor, oyuncunun elinde ne teklif ne taslak kalıyordu. Host reddinde de taslak silinmişti | `J.cmd` açık hata; misafir teklifi tek işlem (taslak yanıta kadar korunur, aynı `cid` ile yeniden gönderim, ret/bağlantı hatasında düzenlenebilir taslak, iz) | Z11 + Z12 aday PASS |
| 4 | p34 Fetih / savaş desteği yeniden kontrol | — | — | Yok | Z7, Z8 aday PASS |

## 1. Sürüm ve Render

**Canlı Render (`https://stars-zhdu.onrender.com`, yalnız salt okunur GET; oynanış yapılmadı):**
- `/mp/version` → `{"mp":"MP.8.9b30","build":"96h10p33"}`; 8 MP dosyasının 12 karakterlik SHA-256 öneki `0ec5720` (p33) ile birebir: mp-core `a16b64de5e1e`, relay `48d42b59c952`, mp1-host `a73cbbc86a4f`, join `bc2732493741`, mirror `c23a23d78ba3`, guest-stars `3b36f18c4520`, mp71-dip `38b13c6ece3d`, mp7-setup `a7391d21552c`.
- `main.js` `BUILD_ID='96h10p33'`, `sw.js` `CACHE='stars-v96h10p33'`; `/mp/join?code=ABCDE` → **200** (p34'te 302 `/mp/play` olmalı); host istemcisi `location.assign('/mp/join')`.
- Sonuç: relay ve istemci dosyaları aynı sürüm (**karışık sürüm yok**), ama sunulan sürüm **p33**. Saha denemesindeki eski arayüz / dönememe / Fetih takılması belirtileri p33 ile tutarlı. p34 düzeltmeleri sahada hiç çalışmadı.
- Eski PWA / service worker: `sw.js` "önce ağ, olmazsa önbellek" stratejisinde; sunucu p33 olduğundan istemci önbelleği ayrımı yapılamaz. Fiziksel cihazda normal ve temiz profille sürüm denetimi: **NOT RUN** (cihaz yok).
- **Dağıtımdan sonra doğrulama:** `/mp/version` → `{"mp":"MP.8.9b32","build":"96h10p34"}` ve dosya önekleri: mp-core `1ce4bd3f5cb4`, relay `413649f9083a`, mp1-host `f5dc296c1a3d`, join `65c28db3714f`, mirror `c23a23d78ba3`, guest-stars `04f9e2db6d3d`, mp71-dip `618ec436755e`, mp7-setup `a7391d21552c`. Misafir MP çubuğuna dokununca tanı satırı da `MP.8.9b32` göstermeli. Ayrıca `node research/mp1/deploy/smoke.js https://<alan>` (11 denetim).

## 2. P0 yeniden giriş

Senaryo: `MP8_SCEN=Z node tests/browser-mp8.cjs` (yerel Chromium; üretim kipi relay süreci + TLS vekili; host, B, C, X ayrı kalıcı profiller; 844×390 dokunmatik). Devlet adları ve tarih koşu günlüğünde (`aday-Z-run4.log`, `aday-Z/Z/mp8-Z.json`).

| Vaka | Sonuç (aday) | p34 kontrol |
|---|---|---|
| Ana menü ÇOK OYUNCULU → ODAYA KATIL (Z1, Z6 yeni kod) | Tam STARS arayüzü `/mp/play`, kod korunur, kendi devleti | PASS |
| Eski `/mp/join?code=` bağlantısı (Z1, Z6) | 302 → `/mp/play?code=…`, aynı devlet | PASS |
| **DAVET PAYLAŞ** (Z13, devam lobisindeki gerçek düğme; `navigator.share` yakalandı) | `/mp/play?code=<yeni>` → B kendi devleti (e=1), kod adreste | PASS |
| Aynı oda kopma / dönüş (Z3 B, Z13 C hattı 3 sn kesildi) | Aynı devlet; tarih ilerler; C'nin filo emri host'ta ve C haritasında aynı (`{mv:2,path:[2]}`) | PASS |
| Kayıttan yeni oda (Z5 → Z6, Z13 ikinci döngü) | Host kayıt tarihiyle açar; B/C aynı devlete; bekleyen kararlar korunur | PASS |
| **Eski sekme açık kaldı** (Z13: aynı profilde ikinci sekme) | Yeni sekme koltuğu alır; eski sekme **KİMLİK** aşaması "Bu oyuncu başka bir sekmede açıldı."; eski sekmede KATIL koltuğu geri alır. Eski odada açık kalan C sekmesi oyunu (host bağlı değil) göstermeye devam eder, yeni odaya kendiliğinden geçmez | PASS (davranış değişmedi) |
| **Eski / yanlış oda kodu** (Z13: host'u ayrılmış eski oda; Z2: olmayan kod) | Eski kod: **ODA** aşaması "Bu odada host yok… YENİ kodu gir", kod kutusu ve KATIL **açık** → yeni kodla girildi. Olmayan kod: ODA BULUNAMADI | **FAIL**: aşama `baglanti`, metin "Bağlanıyor…", kod kutusu ve KATIL **pasif** (`{"code":false,"go":false}`) |
| Kimliksiz profil (Z6 X) | KİMLİK aşaması "OYUNCU KİMLİĞİ DOĞRULANAMADI" | PASS |
| Dönüşten sonra tarih + filo emri (Z9, Z10, Z13) | Host günleri ilerler; misafirin `orderMove` emri host dünyasında; misafir aynası host ile aynı | PASS |

**Kök neden (yeniden üretildi, kontrolde FAIL):** relay host ayrılan odayı `MP1_HOST_GRACE_MS` = 10 dk tutar (host'un aynı odaya dönebilmesi için). Host kaydı yeni odada açınca eski kodla gelen misafir `welcome{host:false}` alır; `join.js` yalnız `fail('no-host')` yazıyor, ekran `connecting` kalıyor, `render()` bu ekranda kutuları ve KATIL'ı pasif yapıp yalnız "Bağlanıyor…" yazıyordu; soket açık kaldığı için yeni KATIL da (`connect()` açık soket varken geri döner) çalışmıyordu. Eski kod sahada üç yoldan gelir: adresteki `?code=` (p34 kodu adrese yazar), sekme yeniden açılınca otomatik dönüş (`J.auto`), elle girilen eski kod. 10 dakika boyunca oyuncu yeni koda geçemez — "birlikte yeniden giremedik" ile birebir.

**Değişiklik (`research/mp1/client/join.js`):** İLK katılımda host yoksa soket kapatılır, giriş ekranı düzenlenebilir döner, aşama **ODA** ve neden yazılır. Lobide / oyundayken kopan bağlantıda host'u bekleme davranışı aynen sürer (aynı odada host dönerse oyun kaldığı yerden devam eder).

Aşama bildirimi: oda / kimlik / bağlantı `#jStatus[data-stage]`; devlet ataması ve ilk dünya verisi misafir başlangıç durum makinesinin (`MP6Stars.S.boot`, aşama + son hata) ekranında ve MP çubuğu tanı satırında.

## 3. P0 olaylar

Kullanıcı kaydı yok; aşağıdaki tüm kayıt testleri senaryoda üretilen sentetik kayıtla (Z: orta, 3 insan + 5 AI, tohum 22; SP: orta, 5 AI, tohum 22).

**Yollar**

| Yol | Ne denendi | Sonuç |
|---|---|---|
| SP → OYUNA DEVAM ET (`browser-mp-field-fix0-sp.cjs`) | Kayıt anında açık + bekleyen + kaydırılmış olay → yeniden yükleme → gerçek dokunuşla devam → tarih ilerler → yeni olay + anomali → gizli karar listeden bir kez | §7 |
| MP → Kayıtlı Oyuna Devam Et, host tek başına (Z5) | Bekleyen olay şeritte, gizlenen ☰ listesinde; gerçek döngüde tarih ilerler; yeni olay ve anomali şeritte ve listede | PASS |
| Aynı kayıttan MP odası, misafir döndükten sonra (Z6, Z10) | B'nin bekleyen kararları `[2,3]` korunur, kaydırılmış kart gizli kalır; host'ta üretilen yeni olay B'nin şeridinde; B **karta dokunup** karar verir → host'ta `resolved`, kart kalkar; ikinci karar `rejected` | PASS |
| Canlı oda (Z3) | Fareyle + CDP dokunmayla kaydırma; ayna, yeniden bağlanma, sayfa yenileme kartı geri getirmez; yeni olay görünür; karar bir kez | PASS |

**Doğal üretim probu** (`evidence/mp-field-verify0/olay-prob/`, gerçek Chromium, enjeksiyon YOK, 36 oyun ayı gerçek gün adımları; her UI.event/chain/anomaly/notify kaydı, ardından her kart açılıp pencere içeriği ölçüldü):

| Koşul | Karar kartı (36 ay) | Pencere |
|---|---|---|
| Varsayılan (Rastgele Olaylar açık, ⚡ kapalı) | 6 (3 olay, 2 zincir, 1 anomali) | Hepsi dolu (163–708 karakter, 3–5 seçenek düğmesi) |
| ⚡ Otomatik olay çözücü AÇIK (`yh_autoev`, cihaz başına) | 2 (yalnız zincir); 2 olay + 1 anomali **kartsız** çözüldü (yalnız "📜 [Olay]: seçim" günlük satırı) | Dolu |
| Rastgele Olaylar KAPALI (kurulum ayarı) | 0 olay/zincir; yalnız keşif anomalisi | Dolu |
| Host MP dünyası (cfg.humans) SP "Oyuna Devam Et" ile | 5 | Dolu |
| Uzak insanlar (Node, MP host dünyası, 36 ay) | B 5, C 4, D 4 bekleyen karar | — |

Çıkarım: olay üretim hattı (üretim → atama → misafire taşıma → şerit → liste) kopmuyor. Seyreklik: çift aylarda ~%25 olasılık (yılda ~1,5 rastgele karar + keşif anomalileri); kısa bir oturumda hiç olay görmemek mümkün. ⚡ açık bir cihazda küçük olaylar pencere açmadan çözülür; Rastgele Olaylar kapalı oyunda olay/zincir gelmez. Oyun tarihi sonucu değiştirmiyor (olaylar `G.month%2===0` aylarında denenir). Misafirin kendi ⚡ ayarı uzak insan kararlarını etkilemez (host'ta `enqueueDecision` ⚡ denetiminden önce döner).

**Saha vakası:** "olay penceresi boş" **yeniden üretilemedi**. Render'da p33 çalıştığı için p33'ün kanıtlı misafir kusuru (gizlenen karar listeden siliniyordu, yenilemede kartlar geri geliyordu; p34'te düzeltildi) sahada etkindi. Kullanıcı kaydı gelirse ilk iş o kayıtla aynı üç yolu denemek ve o cihazdaki ⚡ ayarını (`yh_autoev`) ve kaydın `cfg.randomEvents` değerini okumaktır. Kod değişikliği yapılmadı; p34 `rules:shipment` düzeltmesi aynen (Z4 PASS).

## 4. Q6

**Yeniden üretim (gerçek masa, dokunuş; Z11/Z12):** B (misafir) host'a: ⚔ Savaşa Destek İste → Fetih cephesi (#1) → TOPRAK VAADİ (sistem 3) → TEKLİFİ SUN.

| Adım | Aday | p34 kontrol |
|---|---|---|
| Canlı dünya (host 2× hız, B aynası 4 kez yeniden kuruldu) | Taslak (`landPromise:3`, `warJoin:1`) ve açık masa korunur | PASS |
| Hat DONAR (soket açık sanılır, çerçeve host'a ulaşmaz) → dokunuş | "Teklif host'a gönderildi — yanıt bekleniyor (işlem x0ylm8). Taslak yanıt gelene dek korunur." Taslak duruyor | **FAIL**: "Teklif host'a gönderildi; yanıt gelen kutuna…" + taslak **silindi**; komut kayboldu, yeniden gönderen yok |
| Tekrar basış (yanıt yokken) | "aynı işlem yeniden gönderildi (çift teklif oluşmaz)"; host'ta kayıt yok | — |
| Hat kopar / döner | Aynı `cid` kendiliğinden yeniden gider; host'ta **TEK** kayıt #6: `give landPromise{sys:3,front:1}`, `want warJoin{front:1,target:4}`; 10 sn sonra ve bir basış daha → hâlâ tek | — |
| Host gelen kutusu | Kayıt `deal:mp71:6` bekliyor + 1 kart | — |
| İz (aynı işlem kimliği) | `draft → send(x0ylm8) → tap → resend-tap → resend → reply(ok, offer 6) → msg` | — |
| Son ileti / taslak | "Teklif gönderildi — Kızıl Muhafız. Durum: Gelen kutusu → Gönderilen."; taslak temiz | — |
| Host REDDİ (duraklatma) | "Host reddetti: Oyun duraklatıldı… — taslak korunuyor; düzenleyip yeniden sunabilirsin." Taslak duruyor; devam edince tek kayıt (#7) | **FAIL**: ileti "gönderildi", taslak silindi |
| Soket KAPANIRKEN basış (`readyState 2`, `hostOnline true`) | "Bağlantı yok; teklif gönderilmedi. Taslak korunuyor." İşlem açılmadı; host'ta kayıt yok; bağlantı dönünce tek kayıt (#8) | (Z11'de durduğu için koşmadı; kod incelemesi: p34 aynı durumda `{ok:true}` döner, taslak silinir) |
| Host karşı teklifi → B kabul (gelen kutusu kaydı) | Host cephede savaşta; vaat **bir kez** (`sys 3, front 1, giver 1, taker 0, open`); bedel 3 bir kez; ikinci kabul yok | — |
| Savaş kapanınca gecikmiş kabul | Reddedildi, yeni vaat yazılmadı (motor yolu ayrıca denetlendi) | — |

**Kök neden:** `join.js` `J.cmd` soketin durumuna bakmadan `{ok:true,cid}` dönüyordu; `raw()` soket açık değilse (`CONNECTING`/`CLOSING`, `hostOnline` henüz `true`) çerçeveyi sessizce atıyordu. Misafir `UI.dealSend` sonucu beklemeden taslağı siliyor (`forgetDeal`) ve "gönderildi" yazıyordu. Yarı ölü TCP'de (mobil ağ geçişi) `send()` başarılı görünür ama çerçeve kaybolur; yeniden gönderen yoktu. Host reddinde de taslak zaten silinmişti. Önceki "aralıklı Q6" FAIL'i (p34 §7) aynı yol: tanı yalnız 3 koşuda 1 kez görülmüştü, doğrudan kaybı üretmek için hat donması gerekti.

**Değişiklik:**
- `join.js` `J.cmd(cmd,cid0)`: soket açık değilse `{ok:false,why:'baglanti'}`; çerçeve gönderilemezse seq ilerlemez; `cid0` ile AYNI işlem yeni seq'le yeniden gönderilir (host'un oyuncu başına sonuç önbelleği aynı `cid`'e eski sonucu döner → ikinci kayıt yok; içerik aynıysa motor `duplicate` der).
- `guest-stars.js` `UI.dealSend`: tek işlem `S.dealTx` (cid + içerik imzası). Taslak host YANITINA kadar korunur. Yanıt gelmezse `syncWatch` turunda aynı cid ≤6 kez yeniden gider; aynı içerikle yeniden basış aynı işlemi gönderir, farklı içerik önceki yanıtı bekler. Başarıda yalnız gönderilen içerikle aynı taslak temizlenir; ret ve bağlantı hatasında taslak düzenlenebilir kalır ve neden yazılır. `duplicate` = "zaten bekliyor". Aynı işlemin ikinci yanıtı ikinci uyarı açmaz. İz `MP6Stars.S.dealTrace`.

## 5. p34 yeniden kontrol (Fetih, savaş desteği)

- **Fetih (Z7, gerçek pencere `.mbox.wgPick.liveWorld`):** tek sistemli hedefte 0/0 + neden + pasif `.wgGo` + "Vasallaştırmaya dön"; pencere açıkken keşfedilen sistem listeye girer; başkent dışı hedef seçimi → önizleme → onay → misafirin gerçek savaş ilanı; host'ta aynı aday kuralı. **PASS** (aday ve kontrol).
- **Savaş desteği (Z8 + Z11/Z12):** misafir → misafir ve host → misafir davetleri doğru cepheye bağlı; ret, yeniden teklif, karşı teklif, kabul (tek kez savaşa girer, bedel tek kez); kapanan savaşa gecikmiş kabul işlenmez; MP insan müzakeresinde genel "Savaş sözü" pasif + "Savaşa Destek İste" yönlendirmesi görünür. Toprak vaadiyle birlikte gönderim, karşı teklif ve kabul Z12'de. **PASS**.

## 6. Son kabul senaryosu

Tek koşuda sırayla (Z5 → Z13, aday **PASS**): kaydet → host ve misafirler kapanır, relay yeniden başlar → host kaydı yeni odada açar → host tek başına eski ve yeni olayları görür → misafirler (ana menü / eski bağlantı) kendi devletlerine döner → B olay kartına dokunup karar verir (host'ta bir kez) → B filo emri verir (host uygular, B haritasında aynı) → B toprak vaadi + destek teklifini gönderir: hat donması ve kopmaya rağmen doğru cepheye TEK kayıt, host gelen kutusunda → ret / bağlantı hatasında taslak korunur → karşı teklif + kabul: vaat tek kez → ikinci kayıt/devam: DAVET PAYLAŞ, ikinci sekme, eski kod, aynı oda kopma, filo emri.

## 7. Regresyon

Hepsi yerel (bu kapsayıcı, 4 çekirdek, Chromium `/opt/pw-browsers/chromium`).

| Koşu | Aday | p34 kontrol (`git archive 0ec6017` + aynı test dosyaları) |
|---|---|---|
| `MP8_SCEN=Z` (Z0–Z13; son kabul) | **14/0** (`aday-Z-run4.log` ve son koşu `aday-Z-run6.log`) | **11/3** (`kontrol-p34-Z.log`: Z11, Z12, Z13 FAIL — kusurların kendisi) |
| `MP8_SCEN=Q` (Q6 özgün senaryosu dahil) | **8/0** | — (p34'te 7/1 → 8/0 ×2, aralıklı) |
| `MP8_SCEN=R MP8_MONTHS=6` (kayıt / relay / devam) | **5/0** | — |
| `MP8_SCEN=N` (ağ kopmaları) | **9/0** | — |
| `MP8_SCEN=E` (olay şeridi / bildirim kartları) | **6/0** | — |
| `browser-mp-field-fix0-sp.cjs` (SP OYUNA DEVAM ET, olaylar) | **1/0** | — |
| Node MP alt kümesi (`STARS_TEST_FILTER=mp`, 56 paket) | 758 / 50 | 753 / 47; tüm farklar kontrol kopyasında `git` olmamasından (`git show`/`ls-files` hatası: fed_fleet0_compat, fed_found0_compat, mp11_online); aday sayıları p34 kanıtındakiyle aynı |
| **Node tam** (`node tests/run-all.js`) | **206 paket · 6325 GEÇEN · 275 KALAN** | p34 kanıtı (`mp-field-fix0/regresyon/son/node-tam.out`) 206 · 6325 · 275; **paket paket aynı** — yeni bozulan yok |

**Z ara koşuları (ilk FAIL'ler korunur):**
- run1 11/3: Z10 (Z8'den açık kalan müzakere paneli kartı örtüyordu — test), Z12 (destek seçicisi açıkken yeniden dokunuş onu kapatıyordu — test), **Z13 (eski kodda "Bağlanıyor…" kilidi — ürün kusuru, bu koşuda bulundu)**.
- run2 13/1, run3 13/1: Z12 test hataları (taslağın tek maddeyle yeniden açılması; `DiplomaticInbox.resolve` nesne değil kimlik bekler). Ürün davranışı (ret iletisi, kapanan soket iletisi) bu koşularda doğruydu.
- run4 **14/0**; run6 (son, tüm düzeltmelerle) **14/0**.
- run5 13/1: Z13 ikinci sekme kimliği bulup kendiliğinden bağlandığı için giriş formunu çizmedi; test bekleme koşulu düzeltildi (ürün değişmedi). Aynı koşuda Z12-d gerçek düğme çağrısıyla (`resolve(id,yes,option,G.emps)`) `rules:closed` "Bu teklif artık açık değil" ile reddedildi.

## 8. Değişen dosyalar

| Dosya | Değişiklik |
|---|---|
| `research/mp1/client/join.js` | `J.cmd(cmd,cid0)`: kapalı / kapanan sokette `{ok:false,why:'baglanti'}`, çerçeve gitmezse seq ilerlemez, aynı cid ile yeniden gönderim. İlk katılımda host'u olmayan oda → soket kapanır, düzenlenebilir giriş ekranı, aşama ODA (`room-no-host`) |
| `research/mp6/client/guest-stars.js` | `send(cmd,cid0,quiet)` + `baglanti` uyarısı; tek işlemli `UI.dealSend` (`S.dealTx`, `S.dealTxTick`, `S.dealTrace`, `S.dealDone`); `syncWatch` her turda yanıtsız teklifi yeniden dener |
| `research/mp1/client/view.js`, `research/mp1/server/relay.js` | `MP.8.9b31` → `MP.8.9b32` |
| `tests/helpers/mp-field-verify0-mp3.cjs` (yeni), `mp-field-fix0-mp.cjs` | Z10–Z13 |
| `tests/helpers/mp-field-verify0-reviewed.{json,cjs}` (yeni), `mp-field-fix0-reviewed.cjs` | Koruma: 4 dosyanın p34 baytlarına TAM METİN geri dönüşü (hash gevşetilmedi), zincirin başı |
| `CLAUDE.md`, bu rapor, `evidence/mp-field-verify0/` | Belge, kanıt |

Runtime 19 dosya, Save8, MP paketi 4 / protokol 1, mp-core, mirror, mp1-host, mp71-dip: **değişmedi**. p34 ZIP'i (`releases/stars-faz96h10p34.zip`, SHA-256 `1288a372d922e282c5fbd691aa5e95253dff73e7bdbf818bd21e423f235b35d4`, CRC32 `F1E95EAB`) aynen geçerli; yeni ZIP üretilmedi (oyun dosyası değişmediği için gerekmiyor). MP istemcisi + relay ZIP dışında ayrı teslimdir: Render'da relay ve istemci birlikte bu daldan dağıtılmalı.

## 9. Açık işler

- **Canlı Render bu düzeltmelerle denenmedi** (p33 çalışıyor). Dağıtım: Render'da dal **`claude/stars-mp-field-verify0`** seçilir; sonra §1'deki `/mp/version` önekleri ve smoke. Render'da oynanış, fiziksel Android / PC, LAN: **NOT RUN**.
- **Kullanıcı kaydı yok.** "Olay penceresi boş" yeniden üretilemedi; kayıtla deneme ve o cihazın ⚡ ayarı / kaydın Rastgele Olaylar değeri okunmalı.
- Tek işlemli yeniden gönderim yalnız misafir **anlaşma teklifi / karşı teklif** içindir. Öteki misafir komutları kapanan sokette artık "Bağlantı yeniden kuruluyor; emir gönderilmedi" uyarısı verir (sessiz kayıp yok) ama kendiliğinden yeniden gönderilmez; yarı ölü sokette kaybolan diğer emirler eskisi gibi tekrar verilmelidir.
- Host sonuç önbelleği oturumdadır: host sayfası kapanıp kayıt yeni odada açılırsa önceki odanın bekleyen işlemi yeni odaya taşınmaz (misafir taslağı korunur, yeniden sunulur; içerik aynıysa motor `duplicate` der).
- Eski odada açık kalan sekme kendiliğinden yeni odaya geçmez (yeni kod bilinmiyor); oyuncu yeni kodu girmeli. Aynı profilde iki sekmede son açılan koltuğu alır.
- Eski `browser-mp4` / `browser-mp71` FAIL'leri (p33'ten beri) bu fazda ele alınmadı; koşulmadı.
- Kullanıcı kabulü yok; main'e birleştirme ve dağıtım yapılmadı. TAMAMLANDI değildir.

## 10. Teslim

[DOLDURULACAK]
