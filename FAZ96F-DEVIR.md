# STARS — Faz 96F geliştirici devri

Kanonik kaynak `stars-faz96e1.zip`; SHA-256 `768e5dd03782cc229c23335017949e0793046e7f5c3a06656c525ed86dd9c70c`, 16.912.521 bayt, 2.720 ZIP girdisi/2.719 manifest dosyası. Kaynak `tests/audit96f/source-verification.json` ile doğrulandı. GitHub başlangıcı `e7e8b06dbe064fe23bbc994fd9dd7fa865bd7bea`. Kaynak ZIP esas alındı; remote tarihsel arşivler kod kaynağı yapılmadı. Yayın sonucu tam ZIP içindeki `GITHUB-96F-YAYIN.json` ve sohbet raporundadır.

Build `96f`, PWA cache `stars-v96f`, Save v8. Dokuz üretim dosyası değişir: ai.js, commerce.js, diplomacy.js, economy.js, index.html, main.js, map.js, sw.js, ui.js. Köken katalogları, civic/genetik/tür dağıtımı ve temel bonusları yeniden tasarlanmadı. Ayrıntı `AI-DENETIMI-96F.md`.

## Devralınacak alanlar

- `aiStrategy.goal`: eski taktik alan; kaldırmayın. Yeni `objective`, `plan`, `history` (son 32), `stats` aynı kayıtta.
- `objective`: kind, since, holdUntil, reconsiderAfter, nextReview, priority, progress, lastProgress, baseline, reason; kendi son güç/koloni/bütçe/tehdit/hafıza/savaş sonucu gözlemleri. İsteğe bağlı ek alanlar Save8 içinde saklanır.
- `aiCampaign`: eski sefer kaydı; failedTargets en fazla altı, 360 gün bekleme; gerçek kuvvet ve yaklaşma ilerlemesi. `jointReserved`, `guardLocked`, ikmal ve rota kurallarını aşmayın.
- `rememberEvidence`, `diplomaticSupportEvidence`, `diplomaticBattleEvidence`, `diplomaticUnmetSupport`: ikinci hafıza defteri değildir. Mevcut `mem` listesi ve `memTick` kullanılır. `memorySupport` makbuzu ortak cephe/plan üzerinde kalır; yüklemede yeniden ödül verilmez.
- `G.p.mapHabitats`: sistem kimliği -> `{mask,at}`; 1 boş, 2 yerleşilmiş uygun dünya biti. Yalnız tarama+güncel görünürlükle güncellenir. Çizimde gerçek gizli gezegenleri okumayın. Son gözlem bayatlayabilir; bunu gizli tam bilgiyle düzeltmeyin.
- Son savaş gizleme zaten `G.dismissedBattleReports`, `battleReportViewKey`, Save8 viewPrefs içinde vardı; ikinci mekanizma yazmayın.

## Yeniden üretme

Node ve gerçek Canvas bağımlılıkları gereklidir. Proje kökünde:

    NODE_PATH=<bağımlılık_dizini> STARS_TEST_LOGS=tests/audit96f/reproduced node tests/run-all.js
    NODE_PATH=<bağımlılık_dizini> STARS_CHROMIUM_PATH=<chromium> node tests/browser-96f.js
    NODE_PATH=<bağımlılık_dizini> node tests/campaign-96f.js 11
    NODE_PATH=<bağımlılık_dizini> node tests/campaign-96f.js 99
    NODE_PATH=<bağımlılık_dizini> python tests/performance-96f.py
    python tests/analyze-96f.py
    python tools/verify-release.py

Karşılaştırmalı kampanya/tarayıcı betikleri kanonik 96E.1'in kardeş `source96e1` klasöründe açılmış olmasını bekler. Kanonik ZIP dağıtıma ikinci kez gömülmedi. Runtime testi için bu kardeş klasörün genel olarak gerekmesi söz konusu değildir; bazı tarihsel kıyas testleri kendi eski baseline klasörlerini de arar. Bağımlılıklar ve Chromium ikilisi ZIP'e eklenmedi. `run-all.js` varsayılan gerçek native Canvas paketlerini atlamaz; `--mock-only` kullanılırsa bu tam doğrulama sayılamaz.

`recheck-runtime-96f.js` yalnız son üretim düzenlemesinden önce başlayan paketleri yenileyen denetim yardımcı betiğidir. En son tekil sonuçlar eski yürütmelerin yerine geçer; toplam kontrol sayısını tekrarlı testlerle şişirmez. Genel yeniden doğrulamada normal run-all kullanın.

## Teslim ve GitHub kapsamı

Tam ZIP manifesti `scope: full-package`; kendisi dışındaki bütün dosyaları SHA-256 ile kapsar. GitHub manifesti `github-runtime-and-phase96f-changes` kapsamındadır; korunmuş eski remote arşivlerinin tamamını doğruladığını iddia etmez. `tools/verify-release.py` bu iki kapsamı ayırır. GitHub mevcut ağaç üzerine ek commit ile güncellenir; uzaktaki ilgisiz dosyalar silinmez. Tam ZIP'e remote eski arşivleri kopyalanmaz.

Paketleme tek sabit byte görüntüsünden manifest ve ZIP üretir. Tarihsel `tests/navy-95a-after-{11,99,404}.json` testlerce tekrar yazılabildiğinden doğrulanmış kaynak ZIP baytları korunur. Bunları yeni fazın kampanya sonucu saymayın; yeni kanıt `tests/audit96f/campaigns` altındadır. Güncel ekran görüntüleri yalnız iç QA için kullanıldı, teslim arşivine eklenmedi.

## Riskler ve sonraki fazlar

Üç seed, normal zorluk, beş AI, 120 ay, boşta oyuncu ile sınırlı ölçüm; galaktik kriz ve konsey kapalı. Seed99 ticaret düşüşü sürüyor, seed11'de bütçe sıkışması ve stres altında hedef değişimleri var. Toparlanma kilometre taşı sağlıklı bütçedir; tam askerî toparlanma garantisi değildir. Bazı seferlerde yinelenen rota emirleri mevcut; bunları her durumda başarılı koordinasyon saymayın. Federasyon/vasal yardımının ayrıntılı kontrollü motor testleri var; üç doğal kampanyada her yardım tipi için sık örnek oluşmadı.

Gerçek Android donanımı ve uzun süreli mobil performans ölçülmedi. Dikey oyun ekranı mevcut yataya döndür kilidine tabidir. Öznel müzik doğallığı doğrulanmadı.

96G federasyon oy rejimleri/iç siyaset; 96G.1 vasallık sözleşmeleri/karşı teklif/barışçıl ayrılma; 96H ekonomi-ticaret ve uzun dönem denge; 96I portre/müzik/gerçek Android performansı. Bu geliştirmede bunlara başlanmadı.
