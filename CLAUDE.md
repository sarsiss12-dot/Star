# STARS — geliştirici notu (Claude için)

Tarayıcıda çalışan, harici bağımlılığı olmayan Türkçe 4X uzay strateji oyunu (PWA). Belgeler, commit'ler ve raporlar Türkçedir.

## Kanonik durum

- Güncel durum: `PROJE-DURUMU.md`. Reddedilmiş AI adayları: `AI-RED-KARARLARI.md`.
- Sürüm kimliği tek kaynaktan gelir: `RELEASE-MANIFEST.json` (`build`, `pwa_cache`, 19 runtime dosyasının SHA-256'sı). `main.js` → `BUILD_ID`, `sw.js` → `CACHE` bununla eşleşmek zorunda (`tests/helpers/release-contract.js`).
- Save sürümü **8**. Save şemasını değiştirmek ayrı faz kararıdır; eski Save8 kayıtları yüklenmeye devam etmeli.

## Runtime dosyaları (19)

`index.html manifest.json sw.js main.js map.js combat.js ui.js ai.js diplomacy.js economy.js commerce.js commerce-ui.js economic-ledger.js economy-ui.js news.js inbox.js construction.js archive-ui.js audio.js`

Oyun ZIP'i = bu 19 dosya + `RELEASE-MANIFEST.json` (20 girdi), `releases/stars-faz<build>.zip`.

## Test

```sh
npm install --prefix tests          # @napi-rs/canvas + playwright (yalnız testler için)
node tests/run-all.js               # tüm *_test.js paketleri; "SUITES: n GEÇEN: x KALAN: y"
STARS_TEST_FILTER=joint node tests/run-all.js   # ad filtresi
STARS_TEST_WORKERS=4 STARS_TEST_LOGS=/abs/dizin node tests/run-all.js
node tests/browser-96h10.cjs        # gerçek Chromium + PWA (STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium, STARS_OUTPUT=/abs/dizin)
python3 tools/verify-release.py     # manifest ↔ çalışma ağacı bütünlüğü
node tests/browser-mp0.cjs          # MP.0: iki ayrı Chromium + yerel relay (aynı ortam değişkenleri)
node tests/browser-mp1.cjs          # MP.1: 5 ayrı Chromium (host + 3 misafir + fazladan telefon), 5 görünüm, 60/150 ms relay süreçleri
node tests/browser-mp11.cjs         # MP.1.1: üretim kipi relay + yerel TLS ters vekil, HTTPS/WSS, arka plan duraklatma, 4× CPU host maliyeti
node research/mp1/deploy/smoke.js https://<alan>   # dağıtım sonrası smoke (10 denetim)
node tests/browser-mp2.cjs          # MP.2: host + 2 misafir (ayrı Chromium), gerçek dokunma olayları, harita/filo/bilim, 45/60/100 sistem
node tests/browser-mp3.cjs          # MP.3: host + 3 misafir (4 ayrı Chromium), insan–insan / insan–AI diplomasi, gizlilik, 5 görünüm
node tests/browser-mp31.cjs         # MP.3.1: host + 3 misafir, federasyon oyu/başvuru/davet/ayrılma, vasallık teklif/karşı teklif/bağımsızlık
node tests/browser-mp4.cjs          # MP.4: kalıcı profilli host gerçekten kapanır/yeniden açılır, relay süreci yeniden başlar, kayıt/dosya, devam lobisi, kimlik, 5 görünüm
node tests/mp5_docker.cjs           # MP.5: dağıtım imajı gerçek konteynerde (Docker daemon yoksa NOT RUN; docker.io 429 → mirror.gcr.io yansısı)
node tests/browser-mp5.cjs          # MP.5: Docker relay + TLS vekili + telefon başına TCP kesici; kopma/ağ değişimi/host kopması/relay yeniden başlatma
node tests/browser-mp6.cjs          # MP.6: misafirde gerçek STARS arayüzü (/mp/play): iskelet, piksel karşılaştırması, yatay/dikey, gerçek dokunmayla komutlar, gizlilik
node tests/browser-mp61.cjs         # MP.6.1: host + 2 misafir; ortak hız + bildirim, gerçek filo/koloni/anlaşma/gelen kutusu/federasyon düğmeleri, çakışmalar, gizlilik
```

- Testler Node `vm` sandbox'ında gerçek runtime dosyalarını yükler (`tests/helpers/runtime.js`). Fixture'lar: `tests/helpers/*-fixture.js`, `tests/fixtures/`.
- Koruma testleri eski sürüm baytlarını hash ile doğrular. Onaylı bir değişiklik eklenince `tests/helpers/96hXX-preservation.js` içinde **tam metinle** geri alınabilen bir "strip" adaptörü yazılır ve ilgili koruma testine eklenir (örn. `96h63-preservation.js`, `96h8-preservation.js`, `96h9-preservation.js`, `96h10-preservation.js`, `faz96h31_compact_construction_test.js`; yeni adaptör zincirin en başına eklenir: `stripReviewedH8(stripReviewedH9(stripReviewedH10(src)))`). Hash'i gevşetme, testi silme.
- Her test dosyası `GEÇEN: n KALAN: m` satırı basmalı; `run-all.js` bunu okur.

## Çalışma kuralları

- Multiplayer (MP.0+): prototip `research/mp0/` altında izole; runtime'a enjekte değil, `dev-relay.js` `/mp/host` yolunda yüklenir. Host-yetkili: istemci simülasyon yürütmez, komutlar `mp-core.js` `COMMANDS` tablosundan ve motorun kendi kurallarından geçer. `dev-relay.js` yalnız geliştirme içindir (TLS/kimlik doğrulama yok). Ayrıntı: `MULTIPLAYER-MP0-*.md`.
- MP.1: `research/mp1/` (oda relay'i `server/relay.js`, telefon ekranları `client/`). Lobi kipi `mp-core.js`'de opt-in (`opts.lobby`); verilmezse MP.0 davranışı aynen sürer. ÇOK OYUNCULU düğmesi yalnız relay'in sunduğu sayfaya enjekte edilir, runtime/ZIP'te yok. Relay dağıtılmadı; internete yalnız TLS + `MP1_ORIGINS` (+ vekil arkasında `MP1_TRUST_PROXY=1`) ile açılır. Misafire tohum, başka oyuncunun jetonu/kimliği, host anahtarı gitmez; host anahtarı URL'de değil ilk çerçevede. Ayrıntı: `MULTIPLAYER-MP1-*.md`.
- MP.1.1: relay herkese açık bağlamada (loopback dışı) TLS/`MP1_TRUST_PROXY=1` + https `MP1_ORIGINS` olmadan başlamaz, `MP1_DEV`'i reddeder. Dağıtım dosyaları `research/mp1/deploy/` (Dockerfile + kök `.dockerignore` izin listesi). Dağıtım yapılmadı; URL uydurma. Ayrıntı: `MULTIPLAYER-MP11-*.md`.
- MP.2: misafir oyun ekranı `research/mp2/client/` (harita/filolar/koloniler/bilim, motor yok). Yeni komutlar `move` (→ `orderMove`), `research` (→ `researchTarget`), `researchMode` (→ `setResearchMode`); istemciden rota alınmaz. `publishTo` görünümü `pure()` içinde kurar (`_` önekli motor önbellekleri Save8'e giriyor, yayın onlara dokunmamalı). Yeni ağ alanı eklerken temas kurulmamış devlet kimliğini maskele, yabancı filoya `{id,e,s,n}` dışında alan ekleme. Ayrıntı: `MULTIPLAYER-MP2-*.md`.
- MP.3: diplomasi komutları `quote` (salt okuma), `offer`, `respond`, `counter`, `withdraw`; ekran `research/mp3/client/dip-ui.js` (misafir DİPLOMASİ sekmesi + host paneli, aynı modül). Yeni diplomasi motoru yazma: karar `dealQuote` / `executeDeal` / `aiRespond`'dan geçer. Teklif deposu oturumda (Save8'e girmez; kalıcılık MP.4). AI uzak insan adına karar vermez (`aiNegotiate`→`aiToHuman`, `aiRespond`→`bekle`). Taraf olmayana teklif "yok" (`no-offer`); insan alıcının stoğu gönderene sızmaz (`dipGate`/`dipReasons`). `dip` görünümüne yalnız tarafların teklifleri girer. MP testleri seed 22'de (seed 11'de devlet 3 izolasyonist: motor her anlaşmayı yasaklar). Ayrıntı: `MULTIPLAYER-MP3-*.md`.
- MP.3.1: federasyon (`fedRequest`, `fedInvite`, `fedReply`, `fedVote`, `fedLeave`, `fedLaw`, `fedFound`) ve vasallık (`vassalOffer`, `vassalQuote`, `vassalReply`) komutları motorun kendi işlevlerini çağırır; kayıtlar kanonik `G`'de (Save8). Motor yalnız devlet 0'ın oyunu AI'dan ayırıyordu: `installGuards` `fedOpenVote`/`startFedVote` metnini `__mpHumanVoter` koşuluyla genişletir (metin değişirse kurulum durur) ve `fedFounderCandidate`'i sarar; uzak insan yokken davranış/RNG aynı. Ekran `research/mp31/client/pol-ui.js` (TİCARET / FEDERASYON / VASALLIK bölümleri). Ayrıntı: `MULTIPLAYER-MP31-*.md`.
- MP.4: kayıt paketi `stars-mp-save` / `mpVersion` 4 (`snapshot`, `validatePackage`, `loadWorld`, `upgradeLegacy` — `mp-core.js`): Save8 olduğu gibi + oturum + MP.3 teklif deposu + SHA-256 bütünlük (`sha256`/`canon`). Jeton dosyaya yazılmaz (oyuncu başına tuzlu SHA-256 özeti; doğrulanan dönüşte jeton yenilenir). Yükleme `resume` lobi aşamasına girer, oyun `resumeStart`'a kadar ilerlemez; ziyaretçi talep/komut yapamaz; `recoverSeat` yalnız bağlı olmayan koltuk. `installGuards` yönlendirmesi `root.__mpCur` ile etkin host'a bağlı. Telefon deposu `research/mp4/client/mp4-save.js` (IndexedDB + dosya), ekranlar `mp1-host.js`; misafir kimliği `localStorage["mp4:save:<saveId>"]`. Bütünlük kimlik doğrulama değildir (imza yok). Ayrıntı: `MULTIPLAYER-MP4-*.md`.
- MP.5: relay internete hazır sertleştirme (dağıtılmadı). `relay.js` işleyicileri hata yalıtımlı (tek bozuk istek süreci düşürmez); rol başına çerçeve sınırı (`attach(…,maxPayload)`), IP başı 60 yanlış kod/anahtar / 10 dk, `MP1_MAX_CONNS`, `MP1_IP_HEADER` (yalnız `MP1_TRUST_PROXY=1` ile). Sessiz (ölü) host soketinin yerine doğru anahtarlı yenisi geçer (canlı host'unkine geçilmez: `host-exists`); oda doluyken sessiz misafir soketi çıkarılır. İstemci: yeniden bağlanırken ekran korunur, `online`/`offline` olayları; host ağı kopunca zaman da durur (`netSpeed`). Docker testleri her koşuda imajı güncel ağaçtan derler (eski imaj eski istemci dosyası sunar). Ayrıntı: `MULTIPLAYER-MP5-*.md`.
- MP.6: misafir GERÇEK STARS arayüzünü kullanır: `/mp/play` = aynı `index.html` (+`<base href="/">`, katı CSP özetli). Host her misafire `research/mp6/mirror.js` "ayna dünya" gönderir (`ui:stars` → `mirror`/`mirrorDelta`): beyaz listeli Save8 biçimi, MP.2 görünürlük kuralı, misafir = devlet 0 (π = (0 me) yer değiştirmesi; motor/arayüz ~330 yerde oyuncu=0 varsayar). Misafir motorun `deserialize`'ıyla kurar, simülasyon yürütmez (hız 0); `UI.act` kapısı (görünüm eylemleri yerel, desteklenmeyenler soluk + uyarı) ve `orderMove`/`queueBuilding`/`researchTarget`/`setResearchMode` → MP komutları. Aynaya yeni alan eklerken beyaz liste + görünürlük kuralına uy; host günlüğü/tohum/RNG/başka devletin kaynak-teknoloji-kuyruğu girmez. MP çubuğu oyunun `#app` kökünde (STARS pencereleri ve dikey "çevir" uyarısı üstte). `/mp/join` (MP.2 basit istemci) geçiş içindir. Ayrıntı: `MULTIPLAYER-MP6-*.md`.

- MP.6.1: ortak oyun hızı (`speed` komutu; tek kaynak host `G.speed`; herkese `speed` iletisi, ad alıcının bakışından; `speedSync` host'un iç duraklatmaları; spam koruması). Yeni host komutları `ship`, `demolish`, `stop`, `stance`, `merge`, `split`, `splitType`, `explore`, `exploreAll`, `colonize` tek oyunculu düğmenin motor işlevini yalnız kendi devletinde yürütür (`say:'actor'` bildirimi oyuncunun listesine; eski komutlarda yönlendirme yok → Save8 baytları aynı). Misafirde gerçek STARS düğmeleri üç yoldan MP komutuna iner (motor işlevi sarmalama, `UI.act` kapısı, `DiplomaticInbox.resolve`); `_hook` onay düğmeleri kapıdan geçer. Aynaya yalnız yetkili ek veri: taraf olunan vasallık kayıtları, üyeye federasyon oyu/davetleri, kendi ekonomi geçmişi (son 40 olay). STARS penceresi açıkken ayna bekletilir (onaylar dünya kimliğini denetler). Hız bildirimi/durum hapı `research/mp61/client/`. Ayrıntı: `MULTIPLAYER-MP61-SONUC.md`.

- AI davranış değişikliği: aynı Save'den kontrol ve aday kollarını koşun; kaotik ayrışma için tek RNG çekimli plasebo bandı kullanın (`research/96h8/scripts/arm.js`). Fayda yalnız adayın tetiklendiği devlet ve bant dışı farklar için iddia edilir. Kontrol kökünde `ai.js` çalışma ağacına bağ (symlink) değil, sabit kopya olmalı; yoksa aday aktarıldığında kontrol koşuları sessizce aday koduyla çalışır.
- Küçük, tek amaçlı, ölçülmüş değişiklikler. RNG tüketim sırası, Save8 baytları ve mevcut savaş/ittifak/federasyon sonuçları korunmalı; yeni davranış aynı Save/RNG üzerinde kontrol–aday karşılaştırmasıyla kanıtlanır.
- `research/**/*REJECTED*.patch`, `*SUPERSEDED*.patch`, `*-rejected*.patch` ve `CAPACITY-REJECTED.patch` üretime **uygulanmaz** (A1, A2, AC, C1, C2, D1, D2, T1, I1, F1, kapasite, 96H.7 sefer bekleme, 96H.8 aday 1/2a, 96H.9 aday A ve tek başına B/C, 96H.10 aday D2/P/E, 96H.11 aday R/B1/M/BM/BM2/BM4). Ayrıntı: `AI-RED-KARARLARI.md`.
- Ekonomik AI eşikleri, askerî strateji ve galaksi sınırları (100 sistem / 11 AI) ayrı faz kararı olmadan değiştirilmez.
- Rapor dili: PASS / FAIL / NOT RUN ayrı yazılır; çalıştırılmayan test PASS sayılmaz, fiziksel Android sonucu iddia edilmez.
- `tests/node_modules/` ve `tests/package-lock.json` commit edilmez. Tam koşu bazı audit/navy JSON ve PNG dosyalarını yeniden yazar (`git status` ile görün, commit öncesi geri alın).
- Bilinen ortam FAIL'i: `faz95d_identity_test.js` 3 coğrafya vakası (Node v22 kayan nokta son basamak farkı; değişiklikten bağımsız). Yeni FAIL ile karıştırmayın; taban koşuyla karşılaştırın.
- Yayın: `RELEASE-MANIFEST.json` güncelle → `python3 tools/package-release.py` (deterministik ZIP; 96H.6.1 ZIP'ini bayt-bayt üretir) → ZIP'i çıkarıp `python3 tools/verify-release.py --root <dizin>` → `RELEASE-<faz>.json`.
