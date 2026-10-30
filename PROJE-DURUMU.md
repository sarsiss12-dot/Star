# STARS — Güncel proje durumu

Son güncelleme: 2026-10-30. Depo `sarsiss12-dot/Star`.

## Oynanabilir sürüm

| | `main` (birleşmiş) | Bu dal (PR) |
|---|---|---|
| Faz | 96H.10 + MP.0 – MP.4 (+ 96H.11 araştırma arşivi) | MP.5 (internete hazır relay, kopma/yeniden bağlanma, dağıtım paketi; canlı sunucu yok) |
| Build / PWA | `96h10` / `stars-v96h10` | değişmedi |
| Save | v8 | v8 (şema değişmedi) |
| Oyun ZIP | `releases/stars-faz96h10.zip` (SHA-256 `78e76d1627b8ec1b990849b2242835f78667f110e1d6f17021760183ee7be6d0`) | yeni ZIP yok |
| Taban HEAD | `4296ad2d43fedce6264020b3761f50f1839fd836` | — |
| Değişen runtime | — | yok (19 dosya 96H.10 ile aynı) |

96H.6.2, 96H.6.3, 96H.7, 96H.11 ve MP.0 – MP.5 oyun yayımlamadı.

## MP.5 — güvenli internet bağlantısı ve relay dağıtım paketi (canlı sunucu yok)

Ayrıntı: `MULTIPLAYER-MP5-MIMARI.md`, `MULTIPLAYER-MP5-SECURITY.md`, `MULTIPLAYER-MP5-DEPLOYMENT.md`, `MULTIPLAYER-MP5-SONUC.md`. Testler: `tests/mp5_relay_security_test.js`, `tests/mp5_docker.cjs`, `tests/browser-mp5.cjs`.

- **Kritik düzeltme:** tek bir bozuk HTTP/WebSocket isteği relay sürecini (bütün odaları) düşürüyordu (3 yol) — artık 400.
- **Kopma:** misafir ağ kopmasında oyun ekranı korunuyor ve kendiliğinden dönüyor (eskiden giriş ekranına düşüyordu); ağ değişiminde ölü soket "oda dolu" yapmıyor; host'un ağı kopunca zaman da duruyor.
- **Sınırlar:** IP başı yanlış kod/anahtar sınırı, rol başına çerçeve sınırı, toplam bağlantı sınırı, sayaç sızıntısı giderildi, `MP1_IP_HEADER`.
- **Dağıtım:** Docker imajı ilk kez gerçekten derlendi ve çalıştırıldı (sağlık, TLS yönlendirme, WSS, yeniden başlatma, ~15 MB bellek). Sağlayıcı değerlendirmesi yapıldı; hesap erişimi olmadığı için **canlı dağıtım yok**.
- **NOT RUN:** gerçek internet, fiziksel Android, LAN.

## MP.4 — çok oyunculu kayıt / yükleme ve odayı yeniden açma (geliştirme prototipi)

Ayrıntı: `MULTIPLAYER-MP4-MIMARI.md`, `MULTIPLAYER-MP4-SAVE-LOAD.md`, `MULTIPLAYER-MP4-SECURITY.md`, `MULTIPLAYER-MP4-SONUC.md`. Kod: `research/mp4/client/` + `research/mp0/mp-core.js` + `research/mp1/client/`. Testler: `tests/mp4_core_test.js`, `tests/browser-mp4.cjs`.

- **Paket** (`stars-mp-save`, `mpVersion` 4): Save8 (değişmedi) + oturum (oyuncu–devlet eşlemesi) + MP.3 teklif deposu + özet + SHA-256 bütünlük. Jeton dosyaya yazılmaz (tuzlu SHA-256 özeti).
- **Telefonda:** oyun içi OYUNU KAYDET (IndexedDB, elle 12 / otomatik oyun başına 3) ve DOSYAYA AKTAR; menüde KAYITLI OYUNA DEVAM ET / KAYITLARI YÖNET, DOSYADAN AÇ.
- **Devam:** yeni oda kodu + DEVAM LOBİSİ; misafir cihazındaki kimlikle aynı devlete döner, jeton yenilenir; kimliği olmayan devlet alamaz; host yalnız bağlı olmayan koltuk için onaylı kurtarma yapar. Oyun DEVAM ET'e kadar ilerlemez.
- **Süreklilik:** teklifler/karşı teklifler, federasyon oyları (uzak insanın oyu AI'ya verilmez) ve vasallık müzakereleri yüklemeden sonra sürer; kayıt/yükleme RNG tüketmez.
- **NOT RUN:** gerçek internet, fiziksel Android, LAN. Kalıcı relay sunucusu yok.

## MP.3.1 — federasyon siyaseti ve vasallık sözleşmeleri (geliştirme prototipi)

Ayrıntı: `MULTIPLAYER-MP31-MIMARI.md`, `MULTIPLAYER-MP31-FEDERASYON.md`, `MULTIPLAYER-MP31-VASSALLIK.md`, `MULTIPLAYER-MP31-SONUC.md`. Kod: `research/mp31/client/` + `research/mp0/mp-core.js`. Testler: `tests/mp31_core_test.js`, `tests/browser-mp31.cjs`.

- **Düzeltilen kritik sorun:** motor federasyon oylamasında yalnız devlet 0'ı AI değerlendirmesinden ayırıyordu; uzak insanın oyu AI tarafından veriliyordu. Artık insan oyu yalnız kendisinden gelir (RNG de çekilmez). Uzak insan yokken davranış ve RNG aynı.
- **Federasyon:** başvuru, davet, kabul/ret, oy, yasa önerme, ayrılma, kuruluş (yalnız kabul eden AI müttefiklerle). Beş oy rejiminde sonuçlar motorla aynı.
- **Vasallık:** insan–insan teklif, karşı teklif (3 tur), kabul, yeniden müzakere, barışçıl bağımsızlık. Vergi aktarımı motorla aynı.
- **Ekran:** DİPLOMASİ altında TİCARET / FEDERASYON / VASALLIK; host panelinde aynı bölümler.
- **Kayıt:** federasyon ve vasallık kayıtları Save8'de (kanonik `G`); oyuncu–devlet eşlemesiyle tam oda kayıt/yükleme MP.4'te.
- **NOT RUN:** gerçek internet, fiziksel Android, LAN.

## MP.3 — insan oyuncular arası gerçek diplomasi (geliştirme prototipi)

Ayrıntı: `MULTIPLAYER-MP3-MIMARI.md`, `MULTIPLAYER-MP3-DIPLOMASI.md`, `MULTIPLAYER-MP3-SONUC.md`. Kod: `research/mp3/client/` + `research/mp0/mp-core.js`. Testler: `tests/mp3_core_test.js`, `tests/browser-mp3.cjs`.

- **Akış:** iki insan teklif verir; karşı taraf kabul eder, reddeder ya da karşı teklif verir. En fazla 6 tur, 540 oyun günü. Barış önerisi de var.
- **Motor:** yeni diplomasi motoru yok. Önizleme `dealQuote`, kabul `executeDeal` (kendi işlemi), AI kararı `aiRespond` ile.
- **AI:** uzak insanın yerine karar vermez. AI'nın insana teklifi o insanın gelen kutusuna düşer. İnsan → AI tek oyunculu `dealSend` yolunu izler.
- **Gizlilik:** üçüncü oyuncu A–B tekliflerinin hiçbir verisini ağdan almaz. Taraf olmayana teklif "yok" görünür. İnsan alıcının stoğu gönderene sızmaz.
- **Ekran:** misafirde DİPLOMASİ sekmesi (rozetli), host'ta küçük MP diplomasi paneli (yalnız insanlar). İki adımlı onay, yanlış dokunma koruması.
- **Kalıcılık:** teklifler oturumdadır (Save8'e girmez). Host sayfası kapanırsa bekleyen teklifler kaybolur (MP.4).
- **NOT RUN:** gerçek internet (sunucu yok), fiziksel Android, gerçek Wi-Fi LAN.

## MP.2 — misafirin gerçek oynanışı: harita, filo, bilim (geliştirme prototipi)

Ayrıntı: `MULTIPLAYER-MP2-MIMARI.md`, `MULTIPLAYER-MP2-MOBIL-HARITA.md`, `MULTIPLAYER-MP2-SONUC.md`. Kod: `research/mp2/client/` + `research/mp0/mp-core.js`. Testler: `tests/mp2_core_test.js`, `tests/browser-mp2.cjs`.

- **Misafir ekranı:** HARİTA (canvas: kaydır, iki parmak yakınlaştır, dokun-seç), FİLOLAR, KOLONİLER, BİLİM. Motor yok.
- **Gerçek komutlar:**
  - `move` → host `orderMove` (rota, sınır izni, kapı ağı motorda);
  - `research` → `researchTarget`;
  - `researchMode` → `setResearchMode`.
  - Ağ komutu ile doğrudan motor çağrısı aynı Save8'i veriyor; her ret Save8/RNG'yi değiştirmiyor.
- **Gizlilik:** yabancı filo yalnız id/devlet/sistem/sayı; temas kurulmamış devlet kimliği maskeli; bilim verisi yalnız kendi devletin.
- **Çekirdek düzeltmesi:** yayın artık motorun Save8'e giren önbellek damgalarına dokunmuyor (`pure()`; MP.0'dan beri vardı).
- **NOT RUN:** gerçek internet (sunucu yok), fiziksel Android, gerçek Wi-Fi LAN.

## MP.1.1 — internetten erişime hazırlık (dağıtılmadı)

Ayrıntı: `MULTIPLAYER-MP11-DEPLOYMENT.md`, `MULTIPLAYER-MP11-SECURITY.md`, `MULTIPLAYER-MP11-SONUC.md`. Kod: `research/mp1/deploy/` (Dockerfile, Caddy örneği, ortam şablonu, `smoke.js`), `research/mp1/server/relay.js` üretim kipi. Testler: `tests/mp11_online_test.js`, `tests/browser-mp11.cjs`.

- **Gerçek dağıtım yapılamadı.** Oturumda bulut kimlik bilgisi, dağıtım CLI'ı, Docker daemon'ı ve dışarıdan erişim yoktu; tünel hizmeti ağ politikasınca engelli. URL yok.
- **Relay üretim kipi:**
  - herkese açık bağlamada TLS/güvenilen vekil + `https://` köken listesi şart; `MP1_DEV` reddedilir;
  - HTTP→HTTPS 308 ve TLS'siz WebSocket 403; HSTS; `/healthz`;
  - `PORT` desteği, IP başı oda açma sınırı, SIGTERM'de düzenli kapanış.
- **Android arka plan/ekran kilidi:** host gizlenince oyun güvenle duraklar, misafir nedenini görür, komutlar `paused` ile reddedilir; dönünce önceki hız geri gelir.
- **Kanıt (yerel, gerçek TCP/TLS):** TLS sonlandıran ters vekil arkasında iki ayrı Chromium süreci HTTPS sayfa + WSS ile oda kurdu, katıldı, başlattı, gerçek inşa komutu uyguladı. Smoke aracı doğrudan TLS, vekil arkası ve Dockerfile dosya kümesiyle geçti.
- **NOT RUN:** gerçek internet, fiziksel Android, aynı Wi-Fi, Docker imaj derlemesi.

## MP.1 — telefon öncelikli oda kur / katıl, galaktik lobi (geliştirme prototipi, dağıtılmadı)

Ayrıntı: `MULTIPLAYER-MP1-MIMARI.md`, `MULTIPLAYER-MP1-MOBIL-LOBI.md`, `MULTIPLAYER-MP1-SONUC.md`. Kod: `research/mp1/` + `research/mp0/mp-core.js` (opt-in lobi kipi). Testler: `tests/mp1_lobby_core_test.js`, `tests/mp1_relay_test.js`, `tests/browser-mp1.cjs`.

- **Akış:**
  - ÇOK OYUNCULU → ODA OLUŞTUR / ODAYA KATIL.
  - Host telefon simülasyonu yürütür; misafir sayfası motor yüklemez.
  - Güvenli 8 karakterlik oda kodu, paylaşılabilir davet bağlantısı.
  - Lobi: canlı liste, hazır, açık sekme; gerçek AI devletlerinden seçim; yalnız host galaksi ayarı yapar ve başlatır.
- **Kanıt:** 5 ayrı Chromium sürecinde host + 3 misafir.
  - Gerçek oyun başlangıcı; misafir telefondan gerçek inşa komutu.
  - İnsan devletleri için `aiTurn` yok.
  - Yeniden bağlanma, host düşüp geri gelme, devleti AI'ya verme.
  - 5 telefon görünümü; 60/150 ms gecikme.
  - Paket sızıntı taraması.
- **Bu fazda bulunup düzeltilen güvenlik/gizlilik açıkları:**
  - misafire giden galaksi tohumu;
  - oyun içi lobide temas kurulmamış AI adları;
  - URL'deki host anahtarı;
  - yarı açık bağlantı.
- **Kapsam dışı (MP.2):**
  - misafirin kurulum özelleştirmesi;
  - insan–insan diplomasi ve uzak insanın gelen kutusu;
  - filo, araştırma ve harita komutları;
  - kayıt/yeniden oda arayüzü;
  - WebRTC/QR LAN.
- **NOT RUN:** gerçek internet sunucusu (dağıtım yok, URL yok), aynı Wi-Fi'da iki telefon, fiziksel Android.

## MP.0 — multiplayer temeli (izole prototip, oynanabilir sürüm değil)

Ayrıntı: `MULTIPLAYER-MP0-MIMARI.md`, `MULTIPLAYER-MP0-PROTOKOL.md`, `MULTIPLAYER-MP0-SONUC.md`. Kod: `research/mp0/`. Testler: `tests/mp0_core_test.js`, `tests/browser-mp0.cjs`. Görevler: #6, #7.

- **Mimari:** host-yetkili. Zaman, RNG, AI ve kurallar yalnız host'ta çalışıyor; istemci motor yüklemiyor ve komut gönderiyor.
- **Kimlik:** `playerId` ≠ `empireId`. Eşleme yalnız host API'siyle değişiyor; paketteki devlet kimliği kullanılmıyor.
- **Taşıyıcı:** bağımlılıksız yerel geliştirme WebSocket relay'i. Üretim LAN/online hizmeti değil.
- **Kanıt:** iki ayrı Chromium sürecinde gerçek seed11 galaksisi paylaşıldı.
  - İkinci oyuncu devlet 3'ü yönetti; gerçek inşa komutu `queueBuilding` ile uygulandı.
  - Yetkisiz, sahte, tekrar ve eski komutlar reddedildi; kanonik Save8 değişmedi.
  - İstemci paketlerinde bilinmeyen 36 sistemin adı ve gizli alanlar yok.
  - Host kapanınca istemci duraklıyor; Save8 + ayrı oturum metası ile aynı koltuklar geri geliyor.
- **Bulgu:** Chromium ile Node arasında aynı seed ve komutlarla RNG ve oyun durumu aynı, koordinatların son basamağı farklı. Lockstep güvenilmez; host-yetkili seçim doğrulandı.
- **NOT RUN:** gerçek Wi-Fi LAN, internet (NAT/TURN), fiziksel Android.

## 96H.11 — AI gezegen uzmanlaşması ve inşa verimliliği (araştırma, sürüm yok)

Ayrıntı: `AI-GEZEGEN-VERIMLILIGI-96H11.md`. Kanıt: `research/96h11/`.

- **İki inşa mekanizması çatışmıyor.** `directiveTick` `diploTick` içinde önce, `aiTurn` sonra çalışıyor. AI'nın ücretli emirlerinin %98,3'ü `aiTurn`'den. Otomasyon (%1,7) mineral 400 / alaşım 300 tabanında ve dolu kuyrukta bekliyor; bu bilinçli bekleme.
- **Odak salınımı bedelsiz.** Gezegen başına araştırma tahsisinin tavanı küçük (≤%0,7).
- **Kanıtlanan kusurlar:**
  1. Yıkım–yeniden inşa döngüsü: yıkımların %27'si.
  2. Başkent tipi odak (Yönetim) bütün anavatan sistemine uygulanıyor (4/8 seed). Örnek seed11, 120 ay: +605 Etki için −4392 mineral, −1622 alaşım, −3674 enerji.
- **Adaylar R, B1, M, BM, BM2, BM4 reddedildi.** Nedenler: stoklama; seed42'de zayıf devletin mineral ve tüketim malı krizi; yaygın araştırma kaybı; ticaret koruması (seed11 240 ay teslimat medyanı 288 → 95).

## 96H.10 — kara ordusu güvenliği (kabul edildi, `main`)

Ayrıntı: `AI-KARA-ORDUSU-GUVENLIGI-96H10.md`. Kanıt: `research/96h10/`. Testler: `tests/faz96h10_army_safety_test.js`, `tests/browser-96h10.cjs`.

- **Ordu artık görünür düşman gücünün tuttuğu sisteme gönderilmiyor.** Görünür düşman savaş gücü, oradaki ya da oraya giden kendi savaş filolarını ×1,15 payıyla aşıyorsa silahsız ordu o sisteme gönderilmiyor (taarruz, sınır ve savunma hedefleri).
- **Yoldaki ordu yeniden karar veriyor.** Varış güvensizleşirse ya da hedef geçersizleşirse (ele geçirildi, savaş bitti) ordu yeniden yönlendiriliyor.
- **96H.9'un kanıtlanmış hatası:** ordular, korsan ya da düşman filosunun tuttuğu kendi kolonilerine tek tek gönderilip varışta ölüyordu. seed11 pl1, sys20: 13 emir, 12 ölü ordu.
- **Değişmeyenler:**
  - ortak sefer, teslimat ve oyuncu emirleri;
  - istila, kalkan, garnizon ve katastrof kuralları;
  - 96H.8 ve 96H.9 davranışları;
  - Save şeması ve RNG.

Sonuç, uzay savaşında kaybedilen ordu gövdesi (5 dünya × 240 ay ve 8 × 120):

| | 96H.9 | 96H.10 |
|---|---|---|
| seed11 | 22 | 12 |
| seed23 | 16 | 13 |
| 8 × 120 | 10 | 9 |

Temiz fetih, koloni fethi, katastrof, kritik ay, terhis ve ticaret aynı. Plasebo bantlarında ordu kaybı medyanı tetiklenen 7 dünyanın hepsinde eşit ya da düşük.

Reddedilenler: D2 (güvenli rota), P (salınım), E (ordu alaşım tavanı).

Seed23 katastrofları çözülmedi: saldırgan orduyu karşılayamıyor (ekonomi eşiği). Ayrı faz kararı gerekir.

## 96H.9 — kara ordusu koordinasyonu (kabul edildi)

Ayrıntı: `AI-ISTILA-VERIMLILIGI-96H9.md`. Kanıt: `research/96h9/`. Testler: `tests/faz96h9_invasion_test.js`, `tests/browser-96h9.cjs`.

- **Ordu artık hazırlıkta alınıyor.** Kampanyanın bilinen kolonili bir savaş hedefi varsa, ordu kampanya hazırlanırken alınıyor. Eskiden ucuz savaş gemileri her savaş ayının alaşımını önce tüketiyordu; 70 alaşımlık ordu hiç alınamıyordu (seed11'de 484 denemenin 430'u).
  - Tek eksik alaşımsa, ordu bedeli o ay savaş gemilerinden ayrılıyor; kaynak verilmiyor.
  - Başka bir kapı düşerse üretim 96H.8 ile aynı.
- **Kuvvet hedefte kalıyor.** Hedefe ulaşan kampanya kuvveti artık her AI turunda rally'ye çağrılmıyor ve kuşatmayı sürdürüyor. Eskiden eskort çekiliyor, gelen ordu tek başına kalıp yok oluyordu.
- **Değişmeyenler:**
  - istila, kalkan, garnizon ve savaş kuralları (`economy.js` / `combat.js` / `diplomacy.js` baytları aynı);
  - savunma öncelikleri;
  - 96H.8 bakım kapısı, müfreze ve geri çağırma.

Sonuç, seed11'de 5 dünya × 240 ay:

| Ölçüt | 96H.8 | 96H.9 |
|---|---|---|
| Temiz kara istilası | 1 | 13 |
| Koloni fethi | 8 | 19 |
| Savaş terhisi (ortalama) | 34,8 | 3,8 |

8 seed × 120 ay: kritik devlet-ay 14 = 14, teknoloji 335 = 335, koloni 131 → 138.

Ödünler:

- **Seed11 ticareti 130 → 9 düşüyor.** Tek ticaret ortağı (devlet5) fethediliyor.
- **Seed23'te sys41 daha erken ama katastrofla düşüyor.** Ordu yetişmeden 6 aylık kuşatma doluyor.

## 96H.8 — askerî sefer verimliliği

Sabit başarısız-hedef beklemesi, sevk öncesi gerçek bakım kapısı, karşılanabilir müfreze ve terhis öncesi geri çağırma. Ayrıntı: `AI-SEFER-VERIMLILIGI-96H8.md`; kanıt: `research/96h8/`. 96H.9'da korunuyor: 8 × 120 ayda konuşlanma kaynaklı savaş terhisi 0 = 0.

## 96H.7.1 — kapanmış ortak sefer Save8 yüklemesi

`restoreJoint`, kapanmış geçmiş kayıtta en az 1 üye (sponsor) kabul ediyor; aktif planlar için 2 üye şartı sürüyor. Test: `tests/faz96h71_closed_joint_save_test.js`.

## Bilinen test durumu (Node v22.22.0)

- Tam regresyon: taban `54058e0` 138 paket 6098 PASS / 3 FAIL; 96H.10 139 paket 6109 PASS / 3 FAIL (mevcut 138 paket aynı, yeni paket 11 PASS). Chromium `browser-96h10.cjs` 27/27 PASS, sayfa hatası 0.
- 96H.11 (runtime değişmedi, `667cf56` ağacı): 139 paket 6109 PASS / 3 FAIL (aynı 3 FAIL); Chromium `browser-96h10.cjs` 27/27 PASS, sayfa hatası 0; `verify-release.py` ZIP kökünde DOĞRULANDI (19 dosya, build 96h10).
- MP.0 (runtime değişmedi, `f603975` ağacı + iki yeni test): 140 paket 6120 PASS / 3 FAIL (139 mevcut paket 96H.10 ile aynı, yeni `mp0_core_test.js` 11 PASS); Chromium `browser-96h10.cjs` 27/27 PASS; `browser-mp0.cjs` 20/20 PASS (60 ms gecikmeli relay ile de 20/20).
- MP.1 (runtime değişmedi, `8b748b5` ağacı + üç yeni test): 142 paket 6143 PASS / 3 FAIL (140 mevcut paket MP.0 ile aynı; `mp1_lobby_core_test.js` 9, `mp1_relay_test.js` 14 PASS); `browser-96h10.cjs` 27/27, `browser-mp0.cjs` 20/20, `browser-mp1.cjs` 22/22 PASS.
- MP.1.1 (runtime değişmedi, `7fa0edd` ağacı): 145 paket 6154 PASS / 3 FAIL (yeni `mp11_online_test.js` 9; `mp1_lobby_core_test.js`'in iki uzun denetimi `mp1_actor_vision_test.js` + `_b_` dosyalarına taşındı, run-all 180 sn sınırı); `browser-96h10` 27/27, `browser-mp0` 20/20, `browser-mp1` 22/22, `browser-mp11` 10/10 PASS. Ayrıntı `MULTIPLAYER-MP11-SONUC.md` §4.
- MP.2 (runtime değişmedi, `43f9cb3` ağacı): 146 paket 6161 PASS / 3 FAIL (yeni `mp2_core_test.js` 7); `browser-96h10` 27/27, `browser-mp0` 20/20, `browser-mp1` 22/22, `browser-mp11` 10/10, `browser-mp2` 14/14 PASS. Ayrıntı `MULTIPLAYER-MP2-SONUC.md` §3.
- Önceden var olan 3 FAIL: `faz95d_identity_test.js`, seed 11/99/404 coğrafya koordinatlarında son ondalık basamak farkı (Node/V8 kayan nokta). 96H.7.1–96H.11 ve MP.0–MP.2'de değişiklikten önce ve sonra aynı. Fixture yenilenmedi.
- Test yan etkisi: `tests/navy-95a-after-*.json`, `tests/audit-95d/…`, `tests/audit96e1/…`, `tests/audit96g2/`; commit öncesi geri alın.

## Açık konular (sıralı)

1. Saldırı altındaki tersanede doğan ordular varışta ölüyor (96H.9 kontrolünde 11 gövde). Üretim yer seçimi tehdidi görmüyor.
2. Savunma adımında ordular ileri-geri salınıyor (aday P ölçüldü ve reddedildi). Son şeritte ya da ara sistemde ölüm (D2 reddedildi).
3. Yoksul saldırgan orduyu karşılayamıyor (aylık alaşım tavanı ve maden). Tutulan kuşatma 6 ayda katastrofa dönüyor (seed23 sys41, 5/5). Ekonomi eşiği; ayrı faz kararı.
4. `incomingArmy` ateşkesi yalnız son atlayıştaki orduyu görüyor; 96H.9'daki 28 fethin hiçbirinde devreye girmedi. Motor kuralı.
5. `jointAdvance` ve rally toplanma rotası konuşlanma bakım kapısının dışında (seed23 240 ayda 2 terhis).
6. `aiDisbandTick` kesintiyi taban bakımla sayıyor (aşırı kesinti); ekonomide kuyruk zamanı sorunu sürüyor.
7. Büyük galaksi (120+ sistem) reddedildi; sınırlar 100/11. Fiziksel Android testi hiç çalıştırılmadı.
8. Ekonomi (96H.11): yerine koyma puanı dökümhaneyi negatif değerli sayıyor; yıkımların %27'si sökülen binayı yeniden inşa ediyor.
9. Ekonomi (96H.11): başkent tipi odak bütün anavatan sistemine uygulanıyor. Düzeltme, genel odak zincirinin litoit dışı sanayi açığına yanıt vermemesini açığa çıkarıyor; önce o yanıt tek başına ölçülmeli.
10. Multiplayer: MP.1 `isHumanActor`, aktör başına görüş ve uzak insan keşif belleğini (MP katmanında) ekledi. Kalanlar: `UI.aiOffer` / federasyon gelen kutusu yalnız host arayüzünde (uzak insana AI teklifi karara bağlanmıyor); `!e.ai` bildirimleri host günlüğüne düşüyor; relay dağıtılmadı. MP.2: misafir harita, filo hareketi ve araştırmayı kullanıyor; filo birleştirme/bölme/sevkiyat/savaş emri ve insan–insan diplomasi yok. Bkz. `MULTIPLAYER-MP2-SONUC.md` §6–7.

Reddedilmiş adaylar: `AI-RED-KARARLARI.md`.
