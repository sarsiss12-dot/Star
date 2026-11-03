# STARS — GPT devir belgesi (MP.8.1)

Bu belge, projeyi geçmiş Claude konuşmalarına ihtiyaç duymadan sürdürecek geliştirici içindir. Belgeler, commit'ler ve raporlar **Türkçe** yazılır.

| Kaynak | Ne için |
|---|---|
| `CLAUDE.md` | Geliştirici notu: bütün kurallar ve test komutları; her faza bir satır |
| `PROJE-DURUMU.md` | Güncel durum |
| `*-SONUC.md` | Faz başına ayrıntılı rapor |
| `research/<faz>/` | Faz kanıtları |

---

## 1. Mimari

### 1.1 Oyun (runtime)

**Genel yapı**
- Tarayıcıda çalışan, harici bağımlılığı olmayan, Canvas tabanlı Türkçe 4X uzay strateji oyunu (PWA).
- Derleme adımı yok: dosyalar `<script>` ile sırayla yüklenir ve **global kapsamı paylaşır**.
- Fonksiyon bildirimleri global; testler ve MP katmanı bunları sarmalar (`window.fn = wrap(fn)`).

**Runtime (19 dosya; oyun ZIP'i = bunlar + `RELEASE-MANIFEST.json`)**
`index.html manifest.json sw.js main.js map.js combat.js ui.js ai.js diplomacy.js economy.js commerce.js commerce-ui.js economic-ledger.js economy-ui.js news.js inbox.js construction.js archive-ui.js audio.js`

**Dünya ve döngü**
- Tek dünya nesnesi `G`: `G.sys` sistemler, `G.emps` devletler (`G.p = G.emps[0]` oyuncu), `G.fleets`, `G.feds`, `G.council`, `G.day`…
- Zaman: yarım günlük adımlarla `dailyTick` / `structTick` / `colonyBuildTick` / `autoExploreTick`; ay sınırında `monthTick`.
- Ekonomi, AI turu (`aiTurn`) ve diplomasi `monthTick` içinde çalışır.

**Save8 ve RNG**
- `serialize()` / `deserialize(text)`; Save sürümü **8**. Eski Save8 kayıtları yüklenmeye devam etmeli.
- `_` önekli motor önbellekleri de Save8'e girer.
- RNG: `rndSeed` / `RND_STATE`. **RNG tüketim sırası ve Save8 baytları korunur.**
- Performans ve MP değişiklikleri "aynı Save8'den kontrol ve aday ay ay birebir" ile kanıtlanır.

**PWA**
- `sw.js` önbellek adı `CACHE` (`stars-v<build>`) = manifest `pwa_cache`.
- `main.js` `BUILD_ID` = manifest `build`.
- Eşleşme `tests/helpers/release-contract.js` ile denetlenir.
- Yeni build'de eski önbellek silinir; telefonda sekmeyi kapatıp yeniden açmak yeterlidir.

### 1.2 Çok oyunculu (MP)

MP kodu runtime'da ve ZIP'te **yoktur**. Relay'in sunduğu sayfaya enjekte edilir.

| Parça | Görev |
|---|---|
| **Host** | Bir oyuncunun tarayıcısı. Gerçek motoru çalıştırır, **tek yetkilidir**. |
| `research/mp0/mp-core.js` (`StarsMP.createHost`) | Lobi, koltuklar, komut tablosu `COMMANDS`, yayın, kayıt paketi |
| **Komut yolu** | Her komut `check` → `locate` → `why` (motorun kendi kapısı) → `apply` (motorun işlevi). Host'un kendi komutları `host.local(cmd)`. |
| **Relay** (`research/mp1/server/relay.js`, Node) | Oda kodu (5 karakter), WebSocket aktarımı, statik dosyalar, `/healthz`, `/mp/version`. Durumsuz: odalar **bellekte**, yeniden başlatmada kaybolur. |
| **Misafir** | Gerçek STARS arayüzü `/mp/play` (aynı `index.html` + MP betikleri, katı CSP). **Simülasyon yürütmez** (hız 0). |
| **Ayna dünya** (`research/mp6/mirror.js`, `StarsMirror`) | Host her misafire o misafirin göreceği Save8 biçiminde dünya gönderir: ilk `mirror` (tam), sonra `mirrorDelta` (fark, `rev`/`base`). En sık 700 ms'de bir; son durum ertelenmiş gönderimle mutlaka gider. |
| Ayna kuralları | Misafir = devlet 0 (π: 0 ↔ kendi gerçek kimliği). Görünürlük kuralı. Başka devletin kaynak/teknoloji/kuyruğu, tohum, RNG, jeton aynaya girmez. |
| Misafir kurulumu | `deserialize`, ardından `UI.refresh`. |
| **UI eylem yönlendirmesi** (`research/mp6/client/guest-stars.js`) | Misafirde motor işlevleri (`orderMove`, `queueBuilding`, `researchTarget`…), `UI.act` kapısı ve `DiplomaticInbox.resolve` MP komutuna iner. Görünüm eylemleri yerel kalır. |
| **Tek STARS arayüzü, iki oyun modu** (MP.7.1) | MP için ayrı ekran yazılmaz. Gerçek STARS penceresinin düğmesi MP komutuna bağlanır. |

**Diplomasi gelen kutusu**
- Tek oyunculu: `inbox.js` `DiplomaticInbox` (kayıtlar `state().records`).
- MP teklif deposu `host.dip.offers`: oturumda; MP.4 paketine girer, Save8'e girmez.
- Host ↔ misafir köprüsü `research/mp71/client/mp71-dip.js`. İnsan → host teklifi `UI.notify` kartı + gelen kutusu kaydı olur.
- Misafirde karar host yanıtına kadar bekler (`S.decWait`; MP.8: bağlantı kuşağına bağlı).

**Federasyon, vasallık, konsey**
- Kayıtlar kanonik `G`'de (Save8).
- MP komutları motorun işlevlerini çağırır (`fed*`, `vassal*`, `councilVote`…).
- `installGuards` motor metnini `__mpHumanVoter` ile genişletir: AI, uzak insan adına oy/karar vermez. Uzak insan yokken Save8/RNG aynı.

**Kayıt (MP.4)**
- Paket `stars-mp-save` / `mpVersion` 4: Save8 + oturum + teklif deposu + SHA-256 bütünlük.
- Jeton dosyaya yazılmaz.
- Host IndexedDB'ye kaydeder (`research/mp4/client/mp4-save.js`). Misafir kimliği `localStorage["mp4:save:<saveId>"]`.
- Devam: yeni oda → `resume` lobisi → aynı devletler.

### 1.3 Render dağıtımı

Docker imajı:
- `research/mp1/deploy/Dockerfile`, build context depo kökü;
- kök `.dockerignore` bir izin listesidir (yeni istemci dosyası eklenirse güncellenir);
- imaj relay'i çalıştırır, `/healthz` sağlık denetimi.

Bkz. §6.

---

## 2. Kritik dosyalar

| Dosya | Görev | Bağlılıklar | Dikkat |
|---|---|---|---|
| `main.js` | Dünya kurulumu (`setupGame`), zaman, ikmal (`supplyDistance`), savaş, `serialize`/`deserialize`, `BUILD_ID` | Hepsi | Save8 ve RNG. PERF.2 B bloğu (`supplyDistance` doğrudan `hasUsableGate`). |
| `ui.js` | Arayüz, `UI.notify` / `noteQuick` / `noteSwipe` (MP.7.4), `activeWarsList` / `stepperize` (MP.7.5), `drawInbox` | `inbox.js`, `archive-ui.js` | Koruma testleri blokları tam metin hash'iyle çıkarır (`tests/helpers/ui-preservation.js`). Yeni blok = yeni strip adaptörü. |
| `ai.js` | AI turu, ekonomi planı, sefer | `economy.js`, `diplomacy.js` | PERF.2 **okuma-yalnız AI penceresi**: `AI_INCOME_WINDOW`, `aiIncomeWindow`, `aiShadowIncome`. Pencere işlevlerine dünyayı değiştiren kod eklenmez. Koruma zinciri `stripReviewedP2(stripReviewedH63(H8(H9(H10()))))`. |
| `diplomacy.js` | Anlaşma motoru (`dealQuote`, `executeDeal`: tersinir işlem `txCaptureGraph`), federasyon, konsey, vasallık | `ai.js`, `inbox.js` | Yeni diplomasi motoru yazılmaz. |
| `inbox.js` | `DiplomaticInbox`: kayıt yakalama, `sync`, `resolve`, `gate` | `ui.js`, `diplomacy.js` | MP.7.5: savaş bitince / daha yeni teklif gelince barış ve statüko kaydı `invalid` olur. |
| `economy.js` | Gelir (`empireIncome`), ticaret (`tradeInfo`, `tradeLinks`) | `main.js` | PERF.1 rota önbelleği `TRADE_PATHS` (şerit dizisi kimliği/uzunluğu ve radyasyonla geçersizleşir). |
| `economic-ledger.js` | Ekonomi defteri, `monthTick` sarmalı | `economy.js` | PERF.1 ara nesnesiz `stock` / `snapshot` / `changedSince`. |
| `research/mp0/mp-core.js` | MP host çekirdeği: `COMMANDS`, lobi, yayın, `snapshot` / `validatePackage` / `loadWorld`, `installGuards` | Motor, `mirror.js` | Komutlar motor kapısından geçer. Ayna/görünüm `pure()` içinde (`_` önbelleklere dokunmaz). `host.state.players` → `lastMirror`, `mirrorRev`. |
| `research/mp1/server/relay.js` | Oda relay'i, `/healthz`, `/mp/version`, `ALLOW` listesi, rate limit | `research/mp0/dev-relay.js` `attach` (parçalı WebSocket birleştirme) | Herkese açık bağlamada TLS / `MP1_TRUST_PROXY` + https `MP1_ORIGINS` zorunlu. Güvenlik sınırlarını gevşetme. |
| `research/mp1/client/` | `mp1-host.js` (host ekranları, kayıt, `API.advance`, tanı), `join.js` (`MP1Join`: bağlantı, komut `cmd`, `results`), `view.js` (`MP_VERSION`, `ERR`, `verLine`) | relay, mp-core | `MP_VERSION` değişirse `browser-mp73` / `mp74` sürüm beklentileri. |
| `research/mp6/mirror.js` | `StarsMirror.build` / `diff` / `apply` | motor | Beyaz liste + görünürlük kuralı. Yeni alan → gizlilik denetimi. |
| `research/mp6/client/guest-stars.js` | Misafir: ayna alma (`S.rev`, `S.gen`), kurulum (`S.minGap` 0,6–3 s), yüzey taşıma (MP.7.5), eylem yönlendirme, karar kilidi `S.decWait`, tanı satırı | `join.js`, `mirror.js`, motor | Misafir simülasyon yürütmez. Karar host onayı olmadan sonuçlanmış gösterilmez. |
| `research/mp71/client/mp71-dip.js` | Host + misafir diplomasi köprüsü, Gönderilen sekmesi | `inbox.js`, `ui.js` | |
| `research/mp63/client/mp63-pause.js` | Akıllı duraklatma (`StarsPause`) | `mp1-host.js` | |
| `research/mp7/client/mp7-setup.js` | Lobide gerçek kurulum ekranıyla devlet tasarımı | `main.js` `setupGame(cfg.humans)` | |
| `research/mp4/client/mp4-save.js` | IndexedDB + dosya kayıtları | `mp1-host.js` | |
| `research/mp1/deploy/Dockerfile`, `.dockerignore` | Render imajı | relay | Yeni MP dosyası: relay `ALLOW` + sayfa enjeksiyonu + Dockerfile + `.dockerignore` birlikte. |
| `RELEASE-MANIFEST.json`, `tools/package-release.py`, `tools/verify-release.py` | Sürüm kimliği, deterministik ZIP, doğrulama | | Runtime değişince build artar. |

---

## 3. Geliştirme geçmişi (MP.5 → MP.8.1)

| Faz | PR | Build | Temel iş | Korunması gereken |
|---|---|---|---|---|
| MP.5 | #17 | 96h10 | İnternete hazır relay: hata yalıtımı, çerçeve sınırları, IP başı yanlış kod sınırı, ölü soket değişimi, Docker | Güvenlik sınırları; host kopunca zaman durur |
| MP.6 | #18 | 96h10 | Misafirde gerçek STARS arayüzü (ayna dünya, π yer değiştirmesi) | Gizlilik, misafir simülasyon yok |
| MP.6.1 | #19 | 96h10 | Ortak hız, filo/koloni/diplomasi komutları | Eski komutlarda Save8 aynı |
| MP.6.2 | #20 | 96h10 | Savaş, antlaşmalar, statüko/barış, AI barışı uzak insanın kutusuna | AI uzak insan adına imzalamaz |
| MP.6.3 | #21 | 96h10 | Akıllı duraklatma, ortak savaş paylaşımı, federasyon/vasallık kararları | |
| MP.6.4 | #22 | 96h10 | Casusluk, borsa, oyuncuya özel haber | Zar yalnız host'ta |
| **PERF.1** | #23 | 96h10p1 | `economy.js` ticaret rota önbelleği + 3 sıçramalık tarama ağacı; `economic-ledger.js` ara nesnesiz | Save8/RNG ay ay birebir (`perf1_equivalence_test`) |
| MP.7 | #24 | 96h10p2 | Parçalı WebSocket birleştirme (misafir oyuna geçemiyordu), lobide oyuncu başına devlet tasarımı | `setupGame(cfg.humans)` yoksa Save8/RNG aynı |
| MP.7.1 | #25 | 96h10p2 | Tek STARS arayüzü: insan teklifleri gerçek anlaşma penceresi + gelen kutusu | Ayrı MP ekranı yazma |
| MP.7.2 | #26 | 96h10p2 | Elçi, filo bileşimi, ortak savaş | |
| MP.7.3 | #27 | 96h10p2 | Konsey, entrikalar, yıkıcı savaş, `/mp/version` | AI insan adına oy vermez |
| MP.7.4 | #28 | 96h10p3 | 5 karakterli kod, çift KATIL, küçük MP düğmesi, bildirim kaydırma, karttan hızlı karar | Kaydırma karar değildir |
| MP.7.5 | #29 | 96h10p4 | Barış kaydı tutarlılığı, AKTİF SAVAŞLAR, misafir panel yerinde güncelleme, miktar düğmeleri | `_surfaceWorld` taşıma |
| **PERF.2** | #30 | 96h10p5 | `ai.js` okuma-yalnız AI penceresi (gölge gelir + taze ticaret bir kez) + `main.js` doğrudan geçit denetimi | Save8/RNG birebir (`perf2_equivalence_test`). Büyük galaksi geç oyunda ay adımı −21…−31%. |
| MP.8 | #31 | 96h10p5 (runtime aynı) | `tests/browser-mp8.cjs` uzun kampanya/kayıt/ağ düzeneği | Bkz. aşağı |
| MP.8.1 | #32 (bu) | 96h10p5 (runtime aynı) | mp74 aralıklı FAIL kök nedeni (test: yanlış kart araması + zamanlama), bu devir belgesi | Tanı günlükleri (`A5DIAG`, `NAV`) |

**MP.8 düzeltmeleri:**
- Ağ kopmasında kaybolan karar gelen kutusunu kalıcı kilitliyordu: `S.decWait` artık bağlantı kuşağı `S.gen` ile geçerli.
- Aynı tarayıcıdan ikinci sekme "Oda dolu" yerine gerçek durumu söyler.
- Telefon tanı satırı genişletildi.

**PERF.1 ve PERF.2 kabul kuralı:**
- Kontrol kökü sabit kopya (bağ değil).
- Aynı Save8'den `research/perf1/scripts/bench.cjs` (`TRACE=1`) ay ay Save8 SHA-256 + RNG birebir.
- Eşdeğerlik testi.
- Koruma adaptörü tam metinle eski baytları geri üretir.

---

## 4. GitHub durumu

- **Aktif dal:** `claude/stars-mp81-final-handoff` (taban `claude/stars-mp8-stability-audit`). Son HEAD: §10'daki rapor ve `git log`.
- **main:** MP.4'e kadar birleşmiş (PR #16). #17–#32 **açık ve zincirleme**: her PR bir öncekinin dalına bağlı.

| PR | Dal (head) | Taban |
|---|---|---|
| #17 | `claude/stars-mp5-internet` | `main` |
| #18 | `claude/stars-mp6-ui-parity` | #17 dalı |
| #19 | `claude/stars-mp61-functional-parity` | #18 |
| #20 | `claude/stars-mp62-war-diplomacy` | #19 |
| #21 | `claude/stars-mp63-pause-settlement` | #20 |
| #22 | `claude/stars-mp64-espionage-market` | #21 |
| #23 | `claude/stars-perf1-ai-mp-optimization` | #22 |
| #24 | `claude/stars-mp7-mobile-setup-start` | #23 |
| #25 | `claude/stars-mp71-unified-ui` | #24 |
| #26 | `claude/stars-mp72-gameplay-parity` | #25 |
| #27 | `claude/stars-mp73-council-intrigue` | #26 |
| #28 | `claude/stars-mp74-lobby-notifications` | #27 |
| #29 | `claude/stars-mp75-stability-performance` | #28 |
| #30 | `claude/stars-perf2-host-ai` | #29 |
| #31 | `claude/stars-mp8-stability-audit` | #30 |
| #32 | `claude/stars-mp81-final-handoff` | #31 |

**Güvenli birleştirme (yalnız kullanıcı onayıyla):**
- **Sıra:** #17'den başlayarak sırayla main'e (ya da en son dalı tek seferde main'e).
- **Alternatif:** zincirin son dalı bütün değişiklikleri içerir. Tek PR (`claude/stars-mp81-final-handoff` → `main`) daha az çatışma üretir.
- **Çatışma:** dallar doğrusal; ara dallara sonradan commit eklenmediği sürece çatışma beklenmez.
- Rebase / force-push yapılmaz.

**Yeni iş:**
- Son daldan yeni dal açılır; PR tabanı son daldır.
- Kullanıcı onayı olmadan **main'e merge yapılmaz**.

**Commit ve PR kuralları:**
- Commit mesajları Türkçe.
- Model kimliği yazılmaz.
- `tests/node_modules/` ve `tests/package-lock.json` commit edilmez.
- Tam Node koşusu bazı dosyaları yeniden yazar; commit öncesi geri alınır:
  - `tests/navy-95a-after-{11,99,404}.json`;
  - `tests/audit-95d/95c1-preservation/war-lines-on.png`;
  - `tests/audit96e1/identity-distribution.json`;
  - `tests/audit96g2/` (depo dışına taşınır).

---

## 5. Test komutları (gerçek)

**Kurulum:** `npm install --prefix tests` (@napi-rs/canvas + playwright).

**Chromium ortam değişkenleri:** `STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium` ve `STARS_OUTPUT=/mutlak/dizin`.

**Kısa (her değişiklikte):**
```sh
node tests/perf2_equivalence_test.js     # Save8/RNG + AI penceresi (≈1 dk)
node tests/perf1_equivalence_test.js
STARS_TEST_FILTER=mp node tests/run-all.js          # MP Node paketleri
node tests/browser-mp74.cjs ; node tests/browser-mp75.cjs   # bildirim / karar / savaş-barış (Chromium)
MP8_SCEN=N node tests/browser-mp8.cjs               # ağ kopmaları + karar kilidi (~2 dk)
python3 tools/verify-release.py --root <çıkarılmış ZIP dizini>
```

**Kapsamlı (son adayda bir kez; makine boşken):**
```sh
STARS_TEST_WORKERS=4 STARS_TEST_LOGS=/mutlak/dizin node tests/run-all.js   # beklenen: 172 paket, 3 KALAN (bilinen faz95d_identity)
for t in mp75 mp74 mp73 mp72 mp71 mp7 mp64 mp63 mp62 mp61 mp6 mp4 mp31 mp3 mp2 mp11 mp1 mp0 96h10; do node tests/browser-$t.cjs; done
node tests/mp5_docker.cjs ; node tests/browser-mp5.cjs      # Docker daemon gerekli (yoksa NOT RUN). Başlatmak için: dockerd &
for s in A B C R N; do MP8_SCEN=$s node tests/browser-mp8.cjs; done
```

**Performans eşdeğerliği** (yalnız AI / ekonomi değişikliğinde):
```sh
node research/perf1/scripts/gen-saves.cjs <kontrol kökü> <tohum> <çıkış> [ay] [boyut] [ai]
TRACE=1 WARM=1 node research/perf1/scripts/bench.cjs <kök> <kayıt> <ay>   # kontrol ve adayda aynı satırlar
node research/perf2/scripts/breakdown.cjs <kök> <kayıt> <ay>
```

**Yayın** (yalnız runtime değişirse):
- `RELEASE-MANIFEST.json`'u güncelle: build, `pwa_cache`, SHA-256'lar.
- `main.js` `BUILD_ID` ve `sw.js` `CACHE` aynı değeri almalı.
- `python3 tools/package-release.py` → `releases/stars-faz<build>.zip`.
- ZIP'i çıkar, `python3 tools/verify-release.py --root <dizin>` çalıştır, `RELEASE-<faz>.json` yaz.
- Runtime değişikliği için koruma adaptörü gerekir (`tests/helpers/*-preservation.js`, zincirin başına). Hash gevşetilmez, test silinmez.

**Bilinen ortam FAIL'i:** `faz95d_identity_test.js` 3 vaka (Node v22 kayan nokta). Yeni FAIL ile karıştırma.

**Yük uyarısı:** Chromium testleri eşzamanlı koşturulursa (yük ortalaması > ~5) zamanlama testleri yanlış FAIL verir. Sırayla koş.

---

## 6. Render dağıtımı

**Servis:** https://stars-zhdu.onrender.com (Docker).

**Ayarlar:**
- **Branch:** en son dal. Şu an `claude/stars-mp81-final-handoff`: MP.8.1, runtime `96h10p5`, MP sürümü `MP.8`.
- **Dockerfile Path:** `research/mp1/deploy/Dockerfile`.
- **Build Context:** `.` (depo kökü).
- **Ortam değişkenleri:** `MP1_ORIGINS=https://stars-zhdu.onrender.com` (sonda `/` yok). `MP1_TRUST_PROXY=1` ve `MP1_BIND=0.0.0.0` imajda. `PORT`'u Render verir. `MP1_DEV` **verilmez**. Gizli anahtar gerekmez.
- **Health Check Path:** `/healthz`.

**Doğrulama:**
- `https://stars-zhdu.onrender.com/mp/version` → `{"mp":"MP.8","build":"96h10p5","files":{…12 haneli özetler}}`.
- Özetler deponun ilgili dosyalarının SHA-256 önekiyle aynı olmalı; değilse eski imaj çalışıyordur → "Clear build cache & deploy".
- `node research/mp1/deploy/smoke.js https://stars-zhdu.onrender.com`: 11 denetim.

**Telefonda:**
- Eski sekmeleri kapatıp yeniden aç: yeni PWA önbelleği `stars-v96h10p5`.
- Lobide `STARS MP.8 · oyun 96h10p5`.
- Oyunda MP düğmesine dokununca tanı satırı.
- Rehber: `research/mp73/ANDROID-TEST.md`.

**Sınır:** relay odaları bellekte. Servis uyur ya da yeniden başlarsa oda kapanır; devam yalnız host kaydı + yeni oda ile.

**Durum:** bu oturumlardan canlı dağıtım ya da canlı test yapılmadı (**NOT RUN**).

---

## 7. Açık sorunlar (öncelik sırasıyla)

**Kanıtlanmış**

1. **`browser-mp74` aralıklı FAIL.**
   - A4 / A5 kök nedeni test hatasıydı; düzeltildi.
   - A1 "MP1Join is not defined" (yük / soğuk başlangıç) kök nedeni kurulamadı. Bkz. §9.
2. **Kaydırılan karar olayı kalıcı değil.** `hidden` işareti Save8'e yazılmaz (`ui.js` `NOTE_FIELDS`).
   - Yükleme sonrası kart yeniden görünür. Karar kaybolmaz (güvenli yön), yalnız gizleme unutulur.
   - Kalıcı yapmak `NOTE_FIELDS`'e alan eklemek demektir: runtime + Save8 baytı değişir, yeni build ve koruma adaptörü gerekir. Ayrı faz kararı.
3. **Otomatik kampanyalarda doğal oluşmayanlar** (zorlanmadı; fikstürlü testlerde PASS):
   - AI → insan barış teklifi;
   - insanlar arası vasallık;
   - federasyon oyu.

**Ölçülmemiş ya da teorik**

4. **Fiziksel Android:** hiç test edilmedi.
   - Masaüstü Chromium 4× CPU yavaşlatmada 240. ay ay adımı ~790 ms, misafir uzun görevler 58.
   - Gerçek telefonda daha kötü olabilir.
5. **Gerçek Render ortamı** doğrulanmadı.
6. **Misafirde tam `deserialize` maliyeti.**
   - Her ayna kurulumunda tam dünya kurulur: 15–40 ms masaüstü, 4× CPU'da ~100 ms.
   - MP.7.5 uyarlamalı aralık (0,6–3 s) sınırlıyor. Yerinde delta uygulaması yapılmadı (gizlilik ve yeniden numaralandırma riski).
7. **Uzun oyunda kalan AI maliyeti:**
   - `aiEconomyPlan` devlet-gün başına ~24 kez kuruluyor;
   - `txCaptureGraph` anlaşma başına ~55 ms;
   - günlük `autoExploreTick`.
   - Ayrıntı: `PERF2-SONUC.md` §6.
8. **Küçük büyüyen liste:** misafir `MP1Join.results`. Komut başına bir küçük kayıt, kırpılmıyor.

---

## 8. Değiştirilmemesi gereken kurallar

- **Tek STARS arayüzü, iki oyun modu.** MP için ayrı ekran yazılmaz.
- **Host yetkili.** Komutlar `COMMANDS` + motorun kendi kapısından geçer. **Misafir simülasyon yürütmez.**
- **Gizlilik:** misafir başka devletin gizli verisini, tohumu, RNG'yi, jetonları göremez. Yeni ayna alanı = beyaz liste + görünürlük kuralı.
- **Save8 eşdeğerliği ve RNG tüketim sırası** korunur. AI / ekonomi değişikliği kontrol–aday ay ay birebir ile kanıtlanır.
- **PERF.1 / PERF.2 optimizasyonları** korunur. AI değerlendirme penceresi **okuma-yalnızdır**.
- **Diplomatik kararlar** host onayı olmadan sonuçlanmış gösterilmez. Kayıp yanıt kilidi kalıcı olmamalı (`S.gen`).
- **Yasaklar:**
  - AI, uzak insan adına oy, karar ya da imza vermez;
  - güvenlik denetimleri testler için gevşetilmez;
  - koruma hash'leri gevşetilmez, testler silinmez;
  - `research/**/*REJECTED*.patch` ve benzerleri üretime uygulanmaz;
  - ekonomik AI eşikleri, askerî strateji ve galaksi sınırları (100 sistem / 11 AI) ayrı faz kararı olmadan değişmez;
  - main'e izinsiz merge yapılmaz;
  - URL uydurulmaz, gizli anahtar ya da jeton belgeye yazılmaz;
  - fiziksel Android sonucu iddia edilmez.
- **Rapor dili:** PASS / FAIL / NOT RUN ayrı. Çalıştırılmayan test PASS sayılmaz.

---

## 9. MP.8.1 tanı sonucu (mp74 aralıklı FAIL)

Ayrıntı ve kanıt: `research/mp81/A5-TANI.md`, `research/mp81/evidence/`.

**A5 (host kartından KABUL) — TEST hatası, ürün doğru:**
- Kart üretilmişti (`mp71:3`, KABUL / REDDET / KARŞI TEKLİF düğmeleri DOM'da).
- Test kartı `key.includes(String(id))` ile arıyordu; teklif 3 iken anomali olayı `an:3` eşleşti, yanlış kart beklendi.
- Tam anahtarla düzeltildi.

**A4 (misafir karttan KABUL) — test zamanlama varsayımı:** oyun akarken misafirin eksi enerji geliri `e0 + 13` eşiğini bozabiliyordu. Ölçüm sırasında duraklatılıyor (A5 ile aynı yöntem).

**A1 "MP1Join is not defined":** yalnız yük altında ve soğuk başlangıçta görüldü; gezinme günlüğüyle 12 koşuda yeniden üretilemedi. Kök neden **kurulamadı**. Testte `NAV` günlüğü kaldı; sonraki FAIL'de sayfanın nereye gittiği görünecek.

**Runtime ve MP ürün kodu MP.8.1'de değişmedi.**

---

## 10. Sonraki yol haritası

1. **MP.8.1 kapanış kontrolü:**
   - mp74 tanı kayıtlarına göre karar;
   - `hidden` kalıcılığı için faz kararı (§7.2).
2. **Gerçek Android + Render:** `research/mp73/ANDROID-TEST.md` akışı; tanı satırı ekran görüntüleriyle hatalar. En yüksek değerli adım: hiç yapılmadı.
3. **Gerekirse misafir ayna optimizasyonu**, telefon ölçümüne göre (§7.6).
4. **Kalan arayüz tutarsızlıkları:** gerçek telefon bildirimlerinden.
5. **MP.9 yayın hazırlığı:** sürüm notu, kullanıcı rehberi, dağıtım kontrol listesi.
6. **PR zincirinin kontrollü main birleştirmesi** (kullanıcı onayıyla, §4).
7. **Ancak bundan sonra** yeni STARS oyun mekanikleri.

---

## GPT — İLK GELİŞTİRME OTURUMU

1. **Dal:** `git fetch origin claude/stars-mp81-final-handoff && git checkout claude/stars-mp81-final-handoff`. HEAD'i PR #32'nin head'iyle karşılaştır; çalışma ağacı temiz olmalı.
2. **Okuma sırası (kısa):**
   - bu belge;
   - `CLAUDE.md`;
   - `PROJE-DURUMU.md`;
   - `MULTIPLAYER-MP8-SONUC.md`;
   - `research/mp81/A5-TANI.md`;
   - gerekirse `PERF2-SONUC.md`.
3. **İlk testler** (ortamı doğrular, ~15 dk):
   - `npm install --prefix tests`
   - `node tests/perf2_equivalence_test.js` → `GEÇEN: 5 KALAN: 0`
   - `STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=/tmp/o MP8_SCEN=N node tests/browser-mp8.cjs` → `GEÇEN: 9 KALAN: 0`
   - `node tests/browser-mp74.cjs` → 7/0 beklenir; FAIL'de çıktıdaki `NAV` / `A5DIAG` satırları tanıdır.
4. **Yeni dal:** `git checkout -b <yeni-dal-adı>`. PR tabanı `claude/stars-mp81-final-handoff`.
5. **İlk ele alınacak konu:**
   - Kullanıcı gerçek telefon/Render testi yaptıysa onun bulguları.
   - Yapmadıysa §7.1 (mp74 tanısına göre test ya da kod düzeltmesi), ardından §7.2 için faz kararı önerisi.
6. **Rapor:**
   - Tek parça Türkçe Markdown;
   - başlangıç / bitiş HEAD, dal / PR, kök neden (kanıtıyla), değişiklikler;
   - PASS / FAIL / NOT RUN ayrı, Save8 / RNG durumu, runtime değiştiyse build / ZIP / SHA-256 / CRC32;
   - açık sorunlar.
