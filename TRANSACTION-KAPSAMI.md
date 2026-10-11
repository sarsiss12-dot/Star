# 86C.6 — Anlaşma işleminin kapsamı

86C.2–86C.5.1 kodu, iç içe nesne bağlantılarını her durumda korumuyordu. `txClone` 12 seviyeden sonra özgün nesneyi döndürüyor, `txRestoreInto` ise o anda aynı dizi indeksinde bulunan nesnenin içeriğini değiştiriyordu. Son `recalcMods` çağrıları hata sınırının dışındaydı. Bu nedenle eski “tam atomiklik” yorumu yeterli bir kabul kanıtı değildi.

86C.6, bu iki yardımcıyı `txCaptureGraph` / `txRestoreGraph` ile değiştirdi. Günlük, kopyalanmış oyun dünyası yerine özgün nesneleri ve alanlarının eski değer/referanslarını tutar. Aynı nesne bir kez ziyaret edilir; döngüler ve paylaşılan bağlantılar ayrılmaz. Geri almada yeni koloni/filo nesnesi üretilmez; önceki nesneler eski alanlara ve dizi indekslerine bağlanır. Derinlik nedeniyle özgün veriyi korumasız bırakan bir kesme noktası yoktur.

## Mutasyon tablosu

| Madde | Üretim yolu | Geri alınan veri |
|---|---|---|
| res | `applyItems` | İki tarafın kaynak stokları |
| tribute | `applyItems` | Verenin haraç listesi; gerekirse oluşturulan iki liste |
| sys | `captureSystem` → `planetFlip`, `recalcMods`, `facEvent`, `remember`, `addExh`, `purgeEmpire` | Sistem/gezegen sahipliği, koloni ayrıntıları ve dizileri, ölüm durumu, filo dizisinin değiştirilmesi, üçüncü taraf diplomasi/vasallık, konsey üyeliği, düşüş sayacı |
| tech | `recalcMods`, `remember` | Teknoloji, modlar/kapasite, hafıza |
| lux | `applyItems`, son `recalcMods` | Alanın lüks mal tahsisi ve hesaplanan modları |
| peace | `makePeace` → `freeVassal`, `resolveProxyWars`, `remember`, `facEvent` | İki taraf ve vekil devletlerde savaş/barış; bağımsızlık, vasallık, öfke, hafıza, fraksiyonlar |
| nap | `applyItems` | İki tarafın bitiş tarihleri |
| pact | `makePact`, `remember` | İki tarafın pakt, ilişki ve hafıza alanları |
| ally | `applyItems`, `resolveProxyWars` | İttifak, ilişki, barış tarihleri ve vekil savaşlar |
| warOn | `declareWar` → `fedDefend`, `overlordDefend`, `judgeCasusBelli`, gerekirse `councilPunish` | Üçüncü taraflar dahil savaş, yetki, gerekçe, hafıza, ilişki, tehdit, fraksiyonlar, konsey üyeliği; RNG |
| peaceWith | `makePeace` | Üçüncü tarafla barış ve aynı barış kapanımı |
| intel | `shareVision` | İstihbarat, `visionFrom`, sistemlerin `seen`/`vis` dizileri |
| spynet | `applyItems` | İki tarafın casusluk ağı ve tamponlanan bildirim |
| passage | `applyItems` | Verenin sınır geçiş izni |
| Ortak son işlemler | Maliyet → goodwill → `recalcMods` → log | Gönderenin tek maliyeti, ilişkiler, hediye zamanı, mod/kapasite ve kalıcı log |

Günlük kökleri: `G.emps`, `G.p`, `G.sys`, `G.fleets`, `G.feds`, `G.council`, `G.fallStats`, `G.sabStats`, `G.log`, `G.inbox`, `G.inboxUid`. Köklerin alan varlığı ve özgün nesne referansı da kaydedilir. Yetkiler ve tampon: `_dealAuth`, `_warAuth`, `_warWhy`, `_sideBuf`; değer ve kendi alanının varlığı başarıda da başarısızlıkta da korunur. RNG ayrı kaydedilip geri alınır.

## Commit ve sunum

Sıra: quote → günlük → maddeler/postcondition → maliyet → goodwill → son hesaplama → kalıcı log → commit → ses/UI.

`before:<tür>`, `after:<tür>`, `after:items`, `after:cost`, `after:goodwill`, `after:recalc`, `after:log`, `son` hata noktaları commit öncesindedir. `son`, kullanıcıya bildirim yayımlandıktan sonra geri alma anlamına gelmez.

Kalıcı log `commitSideBuffer` ile geri alınabilir sınırda yazılır. `flushSideBuffer` yalnız sunumu yapar. Audio, alert veya ertelenmiş UI tüketicisi hata verirse diğer tüketicilere devam edilir, tanıya `deal-presentation` kaydı eklenir ve anlaşma başarılı kalır. Ödenen bedel tekrar kesilmez. DOM/ses geri alınabilir değildir; yayımlandıktan sonra işlemi reddedilmiş göstermek de doğru değildir.

İç içe `executeDeal` ve başka bir çağrıya ait etkin tampon varken yeni işlem `false` döner. Dış işlemin tamponu alınmaz veya erken yayımlanmaz. Üretimdeki normal AI/oyuncu anlaşma yolları aynı kanonik fonksiyonu kullanır.

## Kanıtın sınırı

- Yeni test, üretimin kök listesini beklenen durum olarak kullanmaz. Bütün `G` alanlarını ve erişilen nesnelerin kendi alanlarını bağımsız biçimde karşılaştırır; özgün referansları da kontrol eder. Aynı değerli yeni nesnelerin yanlışlıkla kabul edilmediği ayrıca sınanır.
- Gerçek oyuncu kaydı temel alınır. Anlaşma koşulları kontrollü olarak hazırlanır; temaslar, stoklar, savaşlar ve doktrinler test kurulumudur. Koloni kurma ve fetih için gerçek `doColonize` / `captureSystem` çalışır. Bu, değiştirilmemiş kayıtta doğal oyun seyri ölçümü değildir.
- 14 tür × 2 yön × 8 nokta = **224 hata senaryosu**. Her senaryoda kancaya ulaşıldığı ve uygun noktada gerçek etkinin oluştuğu doğrulanır. Her tür ve yön ayrıca hatasız uygulanır.
- Son kolonisini devreden devletin ölüm/filo temizliği, bağımsızlık barışı, vekil savaş, federasyon/senyör savunması ve Konsey zincirinde gerçek RNG tüketimi ayrıca sınanır.
- 80 seviyeli döngülü grafik, Map/Set, seyrek dizi ve sembol alanı testleri dayanıklılık girdileridir; oyunda bu derinliğin doğal olarak oluştuğu iddia edilmez. Zayıf koleksiyonlar hazırlıkta reddedilir; sessizce eksik snapshot alınmaz.
- Kapsam, bu sürümdeki üretim mutasyon zincirleridir. Yeni madde veya yeni global mutasyon eklenirse kök listesi ve testler birlikte genişletilmelidir. DOM/canvas, fonksiyon gövdeleri, kataloglar ve çalışma ortamının çökmesi bu günlüğün kapsamı değildir.
- Gerçek tarayıcı, GPU/context kaybı veya Android performansı bu denetimle kanıtlanmaz. Önceki Canvas/menü/portre regresyonları ayrıca çalıştırılır.

Yeniden üretim: `node tests/faz86c_6_transaction_acceptance_test.js`.
Önce/sonra probu: `node tests/transaction-probe.js /kaynak/klasoru`.
Ölçülmüş JSON dosyaları: `tests/transaction-once.json`, `tests/transaction-sonra.json`.
