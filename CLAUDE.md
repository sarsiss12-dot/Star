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
```

- Testler Node `vm` sandbox'ında gerçek runtime dosyalarını yükler (`tests/helpers/runtime.js`). Fixture'lar: `tests/helpers/*-fixture.js`, `tests/fixtures/`.
- Koruma testleri eski sürüm baytlarını hash ile doğrular. Onaylı bir değişiklik eklenince `tests/helpers/96hXX-preservation.js` içinde **tam metinle** geri alınabilen bir "strip" adaptörü yazılır ve ilgili koruma testine eklenir (örn. `96h63-preservation.js`, `96h8-preservation.js`, `96h9-preservation.js`, `96h10-preservation.js`, `faz96h31_compact_construction_test.js`; yeni adaptör zincirin en başına eklenir: `stripReviewedH8(stripReviewedH9(stripReviewedH10(src)))`). Hash'i gevşetme, testi silme.
- Her test dosyası `GEÇEN: n KALAN: m` satırı basmalı; `run-all.js` bunu okur.

## Çalışma kuralları

- Multiplayer (MP.0+): prototip `research/mp0/` altında izole; runtime'a enjekte değil, `dev-relay.js` `/mp/host` yolunda yüklenir. Host-yetkili: istemci simülasyon yürütmez, komutlar `mp-core.js` `COMMANDS` tablosundan ve motorun kendi kurallarından geçer. `dev-relay.js` yalnız geliştirme içindir (TLS/kimlik doğrulama yok). Ayrıntı: `MULTIPLAYER-MP0-*.md`.
- MP.1: `research/mp1/` (oda relay'i `server/relay.js`, telefon ekranları `client/`). Lobi kipi `mp-core.js`'de opt-in (`opts.lobby`); verilmezse MP.0 davranışı aynen sürer. ÇOK OYUNCULU düğmesi yalnız relay'in sunduğu sayfaya enjekte edilir, runtime/ZIP'te yok. Relay dağıtılmadı; internete yalnız TLS + `MP1_ORIGINS` (+ vekil arkasında `MP1_TRUST_PROXY=1`) ile açılır. Misafire tohum, başka oyuncunun jetonu/kimliği, host anahtarı gitmez; host anahtarı URL'de değil ilk çerçevede. Ayrıntı: `MULTIPLAYER-MP1-*.md`.

- AI davranış değişikliği: aynı Save'den kontrol ve aday kollarını koşun; kaotik ayrışma için tek RNG çekimli plasebo bandı kullanın (`research/96h8/scripts/arm.js`). Fayda yalnız adayın tetiklendiği devlet ve bant dışı farklar için iddia edilir. Kontrol kökünde `ai.js` çalışma ağacına bağ (symlink) değil, sabit kopya olmalı; yoksa aday aktarıldığında kontrol koşuları sessizce aday koduyla çalışır.
- Küçük, tek amaçlı, ölçülmüş değişiklikler. RNG tüketim sırası, Save8 baytları ve mevcut savaş/ittifak/federasyon sonuçları korunmalı; yeni davranış aynı Save/RNG üzerinde kontrol–aday karşılaştırmasıyla kanıtlanır.
- `research/**/*REJECTED*.patch`, `*SUPERSEDED*.patch`, `*-rejected*.patch` ve `CAPACITY-REJECTED.patch` üretime **uygulanmaz** (A1, A2, AC, C1, C2, D1, D2, T1, I1, F1, kapasite, 96H.7 sefer bekleme, 96H.8 aday 1/2a, 96H.9 aday A ve tek başına B/C, 96H.10 aday D2/P/E, 96H.11 aday R/B1/M/BM/BM2/BM4). Ayrıntı: `AI-RED-KARARLARI.md`.
- Ekonomik AI eşikleri, askerî strateji ve galaksi sınırları (100 sistem / 11 AI) ayrı faz kararı olmadan değiştirilmez.
- Rapor dili: PASS / FAIL / NOT RUN ayrı yazılır; çalıştırılmayan test PASS sayılmaz, fiziksel Android sonucu iddia edilmez.
- `tests/node_modules/` ve `tests/package-lock.json` commit edilmez. Tam koşu bazı audit/navy JSON ve PNG dosyalarını yeniden yazar (`git status` ile görün, commit öncesi geri alın).
- Bilinen ortam FAIL'i: `faz95d_identity_test.js` 3 coğrafya vakası (Node v22 kayan nokta son basamak farkı; değişiklikten bağımsız). Yeni FAIL ile karıştırmayın; taban koşuyla karşılaştırın.
- Yayın: `RELEASE-MANIFEST.json` güncelle → `python3 tools/package-release.py` (deterministik ZIP; 96H.6.1 ZIP'ini bayt-bayt üretir) → ZIP'i çıkarıp `python3 tools/verify-release.py --root <dizin>` → `RELEASE-<faz>.json`.
