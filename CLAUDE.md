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
node tests/browser-96h71.cjs        # gerçek Chromium + PWA senaryoları (STARS_OUTPUT=/abs/dizin)
python3 tools/verify-release.py     # manifest ↔ çalışma ağacı bütünlüğü
```

- Testler Node `vm` sandbox'ında gerçek runtime dosyalarını yükler (`tests/helpers/runtime.js`). Fixture'lar: `tests/helpers/*-fixture.js`, `tests/fixtures/`.
- Koruma testleri eski sürüm baytlarını hash ile doğrular. Onaylı bir değişiklik eklenince `tests/helpers/96hXX-preservation.js` içinde **tam metinle** geri alınabilen bir "strip" adaptörü yazılır ve ilgili koruma testine eklenir (örn. `96h63-preservation.js`, `faz96h31_compact_construction_test.js`). Hash'i gevşetme, testi silme.
- Her test dosyası `GEÇEN: n KALAN: m` satırı basmalı; `run-all.js` bunu okur.

## Çalışma kuralları

- Küçük, tek amaçlı, ölçülmüş değişiklikler. RNG tüketim sırası, Save8 baytları ve mevcut savaş/ittifak/federasyon sonuçları korunmalı; yeni davranış aynı Save/RNG üzerinde kontrol–aday karşılaştırmasıyla kanıtlanır.
- `research/**/*REJECTED*.patch`, `*-rejected.patch` ve `CAPACITY-REJECTED.patch` üretime **uygulanmaz** (A1, A2, AC, C1, C2, D1, D2, T1, I1, F1, kapasite, sefer bekleme). Ayrıntı: `AI-RED-KARARLARI.md`.
- Ekonomik AI eşikleri, askerî strateji ve galaksi sınırları (100 sistem / 11 AI) ayrı faz kararı olmadan değiştirilmez.
- Rapor dili: PASS / FAIL / NOT RUN ayrı yazılır; çalıştırılmayan test PASS sayılmaz, fiziksel Android sonucu iddia edilmez.
- `tests/node_modules/` ve `tests/package-lock.json` commit edilmez. Tam koşu bazı audit/navy JSON ve PNG dosyalarını yeniden yazar (`git status` ile görün, commit öncesi geri alın).
- Bilinen ortam FAIL'i: `faz95d_identity_test.js` 3 coğrafya vakası (Node v22 kayan nokta son basamak farkı; değişiklikten bağımsız). Yeni FAIL ile karıştırmayın; taban koşuyla karşılaştırın.
- Yayın: `RELEASE-MANIFEST.json` güncelle → `python3 tools/package-release.py` (deterministik ZIP; 96H.6.1 ZIP'ini bayt-bayt üretir) → ZIP'i çıkarıp `python3 tools/verify-release.py --root <dizin>` → `RELEASE-<faz>.json`.
