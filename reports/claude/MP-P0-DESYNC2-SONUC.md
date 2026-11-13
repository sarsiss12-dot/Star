# MP-P0-DESYNC2 — P26 + mobil HUD ortak adayı ve isteğe bağlı geçici AI koruması (13 Kasım 2026)

Dil kuralı: **PASS / FAIL / NOT RUN** ayrı yazılır. Bütün tarayıcı testleri bu konteynerde **yerel Chromium**'dur (üretim relay süreci + yerel TLS vekili, oyuncu başına kesilebilir hat). Gerçek Render oynanışı, fiziksel PC / Android ve LAN **NOT RUN**.

Kullanıcının desync fotoğrafı P24 / MP.8.9b20'de çekildi. Bu fazda P26 / P27'de **yeniden yaşanmış bir hata olarak raporlanmaz**. Özgün Render oturumunda reddedilen alan hâlâ bilinmiyor (bkz. `MP-P0-DESYNC1-SONUC.md` §3).

## 1. Kaynak, dal, sürüm

| | |
|---|---|
| P26 | PR #39 · `claude/stars-mp-p0-desync1` @ `d782f73e11d410b82ef27adcfecb19607efae0a3` (GitHub ile doğrulandı) — 96h10p26 / MP.8.9b22 |
| Mobil kaynak | PR #38 · `codex/stars-beta-mobile-hud0` @ `043647ed457271de4ce8a21010f5447d5b42cef9` (GitHub ile doğrulandı) — p25 `bcbd697` üstünde, p26'dan bağımsız |
| Aday dal | **`claude/stars-mp-p0-desync2`** (Render'da denenebilecek dal) — P26'dan |
| Commit 1 — ortak aday | `cacf6fe` — oyun **96h10p27** / PWA `stars-v96h10p27` / MP **MP.8.9b23** |
| Commit 2 — geçici AI koruması | `ee1c8aa` — yalnız MP kaynakları; oyun **96h10p27** aynı, MP **MP.8.9b24** |
| Commit 3 — rapor | yalnız belge / kanıt (son SHA PR'da ve sohbette) |
| Uyumluluk | Save8 **v8**, MP paket **4**, protokol **1** değişmedi. p27 paket yükleyicisi p6–p26 ve p25u1 paketlerini kabul eder. |

## 2. Ortak aday (commit 1)

**Mobil değişiklikler** PR #38'den yalnız **kaynak düzeyinde** taşındı: `ui.js`, `index.html` (CSS), `map.js`. p25u1 sürüm kimliği, PWA önbellek adı, manifest ve ZIP kopyalanmadı. Repo sözleşmesine göre yeni p27 manifesti ve ZIP üretildi. Yamalar p26'ya çakışmasız uygulandı. P26 desync kodu (`economy.js`, `main.js` zarf reddi, `guest-stars.js`) olduğu gibi kaldı.

**P26 korundu** (birleşik adayda, kurtarma testi yeniden kullanılarak):
- `node tests/mp_p0_desync1_test.js` 4/0
- `MP8_SCEN=D` D0–D3 PASS: kesirli gün politika kararı, kayıp / reddedilen fark, son sağlam harita, emir engeli, ≤3 otomatik tam ayna, YENİDEN EŞİTLE, TANIYI KOPYALA, geç fark / ACK, kalıcı retle sayfa yenileme
- Eşitlemede gerileme bulunmadı.

**Mobilde dört davranış:**

| Davranış | Test | Sonuç |
|---|---|---|
| ROTA / DUR / SİSTEM dar yatayda tek satır — sağ panel açık ve **uzun filo adı** | `browser-mobile-hud0.cjs` (640×360, 800×360, 915×412, 1280×720, tek oyuncu) + D4: MP misafiri, 800×360, panel açık, 48 karakterlik filo adı | 4/4 PASS · D4 PASS |
| İlk ROTA dokunuşu hedeflemeyi açar; ilk geçerli harita dokunuşu doğru savaş filosuna gider | aynı testler. D4'te gerçek dokunma; host'ta **tek** `move`, öteki filo değişmez, önceki hedefleme kipi temizlenir | PASS |
| Olay kartları geçici mesajların üstünde ve dokunulabilir | aynı testler. D4'te kart merkezinde `elementFromPoint` kartın kendisi | PASS |
| Geçici bildirim opaklığı %25–%100, cihazda saklanır | `browser-mobile-hud0.cjs` (Save8 baytları değişmez; yenilemede geri yüklenir) | PASS |

Kanıt: `evidence/mp-p0-desync2/aday1-*`. D4 ekran görüntüleri `aday1-d4-misafir-hud-panel-acik.png` ve `aday1-d4-misafir-hud-rota.png`.

## 3. Geçici AI koruması (commit 2)

**Lobi seçeneği.**
- Host lobisinde (yeni oda ve devam lobisi) "**Bağlantı kaybında geçici AI koruması**" onay kutusu var. Varsayılan kapalı.
- Seçenek MP kaydında `session.settings.aiGuard` olarak **yalnız açıkken** yazılır. Kapalıyken paket p26 biçimiyle aynıdır.
- `aiGuard` alanı olmayan eski kayıtlar kapalı başlar. Geçersiz değer (`false` dahil, alan yalnız `true` olabilir) paketi reddeder.
- Koltuk sahipliği mevcut MP.4 mekanizmasıyla korunur.

**Kapalıyken:** P26 davranışı aynen sürer. Misafir eşitleme bildirimi bile göndermez. Host'ta koruma kodu hiçbir şey yazmaz; dünya, RNG ve Save8 etkilenmez.

**Tetik (açıkken, host'ta):**
- Bir misafir koltuğunda iki durumdan biri tetik sayılır:
  - Doğrulanmış kopma: relay ayrılışı, `p.conn` yok.
  - P26'nın kalıcı eşitleme sorunu: misafir, oturuma bağlı `synced` iletisinde "dünya güncel değil" bildirir.
- Sorun, **oyun akarken** 30 gerçek saniye sürerse koruma başlar.
- Sorunun ilk görüldüğü nabız sayılmaz. Duraklatmada (host duraklatması, hız 0) sayaç ilerlemez.
- Kısa gecikme, hareketsizlik ve açık karar penceresi tetik değildir.
- Koruma beklerken oyuncunun daha önce kabul edilmiş emirleri ve üretim kuyruğu normal yürür.

**Koruma sırasında:**
- Devlet ve koltuk oyuncuya bağlı kalır: `e.ai` değişmez, tam devlet AI'sı açılmaz.
- Host, mevcut savaşta (yalnız `e.war`) oyuncunun gördüğü düşman gücünün kendi gücünü aştığı sistemdeki, **emri / görevi olmayan** filoları en yakın güvenli dost sisteme çeker. Hedef oyuncunun kendi sistemi olmalı ve orada görünür düşman olmamalıdır.
- Bunu mevcut `move` komut yoluyla yapar (aynı `why` / `apply` kuralları, dergiye `guard:<oyuncu>` kaydı). Plan `pure()` içinde salt okunur kurulur.
- Rota, keşif ya da otomatik görev gibi kabul edilmiş emri olan filoya dokunulmaz.
- Harcama, üretim siparişi, savaş ilanı, diplomasi ve federasyon / Konsey oyu yapılmaz.
- Oyuncunun dünyayı değiştiren emirlerini host `guard-active` ile reddeder. Salt okuma ve ortak hız serbesttir.
- Koruma başlayınca oyuncuya (`guard`) ve odaya (`guardNote`, lobide `guarded`, host'ta bildirim) durum gider.

**İade:**
- Koruma yalnız şu koşulda kapanır: aynı koltuğun **şu anki bağlantısı**, koruma başladıktan sonra o bağlantıya giden **TAM aynanın tam o revizyonunu** uyguladığını bildirmelidir (`synced{full:true,stale:false,rev}`).
- Eski bağlantının ya da eski revizyonun bildirimi, "güncel değil" bildirimi ve farktan kurulan dünya iade etmez. Bu durumlarda host o bağlantıya yeni bir TAM ayna gönderir (5 sn'de en çok bir).
- Koruma önce kapanır, ardından oyuncu emirleri kabul edilir. Host tek iş parçacığında çalıştığı için iki denetleyici aynı anda emir veremez.
- Önceki emirler kendiliğinden yeniden gönderilmez.
- Dönen oyuncu kısa bir özet görür (geri çekilen filo → hedef sistem, en çok 12 satır).

**Kayıt ve tekrar:** Zamanlayıcı, koruma durumu ve eşitleme bildirimleri Save8'e de pakete de girmez. Yeni oturumda ve yeniden bağlanmada sıfırdan değerlendirilir. Devam eden oyunda dönmeyen koltuk da 30 sn sonra korunur.

**Bilinen sınır (dürüst not):** Koruma 2 sn'lik nabızla çalışır. Düşman filosu oyuncunun filosuyla **aynı sisteme** ışınlanırsa muharebe bu sürede sonuçlanabilir. İlk Chromium fikstürü tam bunu gösterdi (`aday2-chromium-G-kosu3-tani.json`: filo koruma emrinden önce yok oldu). Gerçek oyunda düşman yaklaşırken (`f.mv.to`) tehdit sayılır ve geri çekilme varıştan önce verilir. Güvenli dost sistem yoksa (örn. oyun başında yalnız ana sistem) emir verilmez.

## 4. Test sonuçları

Bütün tarayıcı satırları yerel Chromium'dur (üretim relay süreci + TLS vekili, oyuncu başına ayrı tarayıcı).

| Test | Commit 1 (p27, koruma yok) | Son aday (commit 2) |
|---|---|---|
| Tam Node (`run-all.js`) | 190 paket **6194 / 278** — p26 ile paket paket aynı | 191 paket **6201 / 278** — paket paket aynı + yeni `mp_p0_guard_test` 7/0 (son kodla iki koşu) |
| `node tests/mp_p0_guard_test.js` G0–G6 | — | **7 / 0** |
| `node tests/mp_p0_desync1_test.js` (P26) | 4 / 0 | 4 / 0 |
| `MP8_SCEN=D` D0–D4 (P26 kurtarma + misafir HUD) | **5 / 0** | **5 / 0** |
| `MP8_SCEN=G` G0–G4 (koruma) | — | **5 / 0** (son kodla iki koşu). Önceki fikstür ve test FAIL'leri korunur (§4.1). |
| `browser-mobile-hud0.cjs` (4 ekran) | 4 / 4 | 4 / 4 |
| `browser-event-ux0.cjs` S1–S8 (P25 kartları + casusluk genişliği) | 11 / 0 | 11 / 0 |
| `MP8_SCEN=E` (P24 / P25 federasyon / Konsey kartları) | 6/0 · 6/0 · 5/1 · 5/1 | 5/1 · 5/1 · 6/0 · 5/1 · 5/1 — aralıklı E2 / E5 (§4.1) |
| `MP8_SCEN=F` (P25 kuruluş tekrarı) | 6 / 0 | 6 / 0 |
| `MP8_SCEN=N` (ağ kopmaları) | — | 9 / 0 |
| `MP89_R_STATE=1 MP8_SCEN=R MP8_MONTHS=6` (kayıt / relay / devam, dolu fikstür) | — | 5 / 0 |
| `MP8_SCEN=P` 45 ay + 3 dk + P2–P7 (P0 hedefli) | — | 8 / 0 |
| **500 sistem / 16 AI / 2 insan, 15 dk gerçek zaman, koruma AÇIK** (`MP8_P_DESYNC=1 MP8_GUARD=1`) | — | **PASS** (P0 + P1). İlk koşu FAIL korunur (§4.1). |

**15 dk koşu (son, `aday2-P15-500s-16ai-koruma-acik.*`):**
- Gün 1350 → 6995. Gerçek döngüde 8 kesirli politika kararı verildi; biri (gün 1472.15) eski kuralın reddedeceği değerdi.
- Misafir ayna reddi 0, "dünya güncel değil" 0, donma 0, yeniden bağlanma 0. En büyük gecikme 18,5 gün.
- 1727 dokunma eylemi. 20/20 hareket ve 20/20 gemi siparişi ACK revizyonuyla aynaya yansıdı (0,1–2,6 sn).
- Koruma açıkken **yanlış tetikleme 0**, AI emri 0. Host Save8 geçerli; koşu sonunda 4 kesirli politika vardı, 3'ü AI'nın.

**G (koruma) ölçümleri (son koşu, `aday2-G-son-*.json`):**
- Kısa kayıp (8 sn hat kesik): 12,6 sn'de toparlandı, ardından 30 sn izlendi. Koruma 0, AI emri 0.
- Kalıcı tam ayna reddi:
  - Duraklatılmışken 40 sn: koruma yok, sayaç 0.
  - Oyun akınca 20. saniyede koruma yok; koruma **31,8 sn**'de başladı.
  - Yalnız B korumada. Oyuncuya ve odaya bildirim gitti, B'nin devleti ve koltuğu B'de kaldı.
  - 2 geri çekilme emri verildi: savaş filosu ve konvoy, yaklaşan düşmandan güvenli dost sisteme.
  - B'nin emri: yerelde `stale-world`, host'ta `guard-active`.
  - C'nin emri tam bir kez işlendi; C'nin dünyası ilerledi.
- İade:
  - Host verisi düzeldi → **2,1 sn**'de iade. B özet gördü (2 geri çekilme).
  - İlk insan emri tam bir kez işlendi. İade sonrası 10 sn'de AI emri 0.
  - Geç "güncel değil" bildirimi ve geç fark korumayı yeniden başlatmadı.
- Tekrar kopma: hat 40 sn kesildi → koruma **32,9 sn**'de başladı. Hat açılınca aynı koltuk, TAM ayna ve iade (toplam 37,5 sn). MP paketi `aiGuard:true`, paket 4, Save8 v8.

**Node G0–G6 (`aday2-node-guard.txt`):**
- Seçenek kapalı: 60 sn kopmada koruma, AI emri ve ileti yok.
- Kısa kopma ve kısa "güncel değil" durumunda sayaç sıfırlanır.
- Hız 0 ve host duraklatması sayılmaz. Yalnız etkilenen devlet korunur; öteki misafirin emri işlenir.
- Kaynak, kuyruk, savaş, ittifak, AI bayrağı, teklif ve federasyon değişmez. Görevli (keşif / rota) filoya dokunulmaz.
- Şunlar iade etmez: eski bağlantı, eski revizyon, "güncel değil", farktan kurulan dünya. Bu bağlantının TAM aynası iade eder.
- Aynı `cid` ikinci kez uygulanmaz. Tekrar kopmada sayaç sıfırdan başlar.
- Paket ve devam: seçenek korunur; durum, sayaç ve eski bildirim taşınmaz. Eski paket kapalı başlar; geçersiz değer reddedilir. Devamda dönmeyen koltuk 30 sn sonra korunur.

### 4.1 İlk FAIL'ler ve aralıklı sonuçlar (silinmedi)

- **G ilk koşular:**
  - `aday2-chromium-G-ilk-kosu-FAIL-fikstur.txt`: seçilen AI'nın savaş filosu yoktu.
  - Sonraki koşu: fikstürde elle yazılan sistem sahipliği gerçek döngüde siliniyordu. Düzeltme: motorun `doColonize`'ı.
  - `aday2-chromium-G-kosu3-*`: düşman aynı sisteme ışınlanınca muharebe filoyu korumanın nabzından önce yok etti (§3 sınır). Düzeltme: yaklaşan düşman.
  - `aday2-chromium-G-kosu4-*`: yerel engel beklentisi (`stale-world` önceliği doğru).
  - Bir koşuda kopmadan korumaya **28,8 sn** ölçüldü. Bu ürün hatasıydı: sorunun ilk görüldüğü nabız sayılıyordu. Düzeltildi; son koşular ≥ 30 sn.
- **Node:** ilk sürümde güvenli sistem adayı, tehditli başlangıç sistemine komşu olduğu için eleniyordu (ürün hatası, düzeltildi). Koruma, emri olan kâşifi de çekiyordu (ürün hatası, düzeltildi: emirli / görevli filoya dokunulmaz).
- **15 dk ilk koşu** (`aday2-P15-ilk-kosu-FAIL-olcum.*`): 20 gemi siparişinden 1'i "görülmedi". Eski ölçüm tersane sırasının uzamasına bakıyordu; en yüksek hızda sipariş hemen tamamlanınca sıra uzamıyordu. Aynı FAIL p25 tabanında da görüldü (DESYNC1 raporu). Ölçüm P26'nın ACK revizyonuna çevrildi (`appliedWorldRev ≥ result.rev`). Eski ölçüm bilgi olarak tutulur; son koşuda 0 sapma. Eşitleme ölçümleri ilk koşuda da temizdi.
- **E2 / E5 aralıklı** (`chromium-E5-karsilastirma-c1-c2-p26-p25.txt`):
  - E5 yük yokken p25'te 1/1, p26'da 1/2, commit 1'de 2/2, son adayda 2/2 düştü. Önceki koşularda geçti. Tabanda da var; bu fazın gerilemesi değil.
  - Neden E5: host'un 700 ms kısmalı aynası gelmeden test eski revizyonla "eşit" görüp sıraya bakıyor.
  - Neden E2: "çift dokunuş" ilk karar tamamlandıktan sonra yapılırsa yeni karar sayılıyor (host yine tek oy kaydeder).
  - İkisi de test zamanlaması; dokunulmadı, ayrı açık iş.

## 5. Paket

| | |
|---|---|
| ZIP | `releases/stars-faz96h10p27.zip` — 20 girdi (19 runtime + `RELEASE-MANIFEST.json`) |
| SHA-256 | **`56c461999205e59f3e98d8ba555f27f33ebaddc1ab1af97bcd99816d29784de6`** |
| CRC32 | **`51E105B2`** |
| Deterministik | yeniden üretim bayt bayt aynı |
| Doğrulama | `verify-release.py` (çalışma ağacı) ve çıkarılmış ZIP `--root` → DOĞRULANDI: 19 dosya, `96h10p27` |
| Manifest | `parent_commit` `d782f73…` (p26), `parent_zip_sha256` = p26 ZIP `da7e9d4c…a30a` |
| Runtime farkı (p26 → p27) | `index.html`, `map.js`, `ui.js` (mobil), `main.js` / `sw.js` (sürüm) |
| MP teslimi (ZIP dışında) | `research/mp0/mp-core.js`, `research/mp6/client/guest-stars.js`, `research/mp1/client/mp1-host.js`, `research/mp1/client/mp1.css`, `research/mp1/client/view.js`, `research/mp1/server/relay.js`. Relay + istemciler p27 runtime ile birlikte dağıtılmalı; `/mp/version` → `MP.8.9b24`, build `96h10p27`. Koruma commit'i runtime ZIP'ini değiştirmez. |

## 6. Açık kalanlar

- Özgün Render oturumunda reddedilen alan doğrulanamadı (kayıt yok).
- Gerçek Render, fiziksel PC / Android ve LAN: **NOT RUN**. Kullanıcı kabulü yok. `main`'e birleştirme ve Render dağıtımı yapılmadı.
- Koruma ilk sürümde yalnız geri çekilme yapar. Savunma, onarım ve kuşatmadan kaçış önceliği gibi ayrıntılar yoktur. Misafir lobisinde seçenek yalnız host lobisinde gösterilir; misafir oyunda durum iletisini görür.
- Tabanda da bulunan eski FAIL'ler korunur: P1 gemi siparişi ölçümü, R 60 ay R1 ön koşulu, Node'daki 278 eski FAIL.
- Federasyon donanması (BETA-FED-FLEET.0) sonraki fazdadır.
