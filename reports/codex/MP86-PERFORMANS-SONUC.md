# STARS MP.8.6 — Misafir yükleme optimizasyonu ve CPU profili

## Sonuç ve kapsam

**Bir optimizasyon kabul edildi:** yalnız MP misafirinde deterministik bulutsu piksel verisinin sınırlı önbelleği. 120. ayın **aynı misafir Save8'i** üzerinde 4× CPU, dört AB/BA turu ve kol başına 48 sıcak deserialize örneğinde ortanca **167,7 → 61,1 ms (%63,6 azalma)**, p95 **360,1 → 109 ms (%69,7 azalma)**. Dört turda da aday daha hızlıydı. Bu **izole yükleme çekirdeği** kazanımıdır; FPS, host ay hesabı veya tüm uçtan uca mirror/build için aynı yüzde iddia edilmez.

**240. ay için kazanım iddiası yoktur.** İki ölçüm koşusu 237. ayda sıfır monthTick örneğiyle kaldı ve FAIL sayıldı. Host AI/ekonomi optimizasyonu uygulanmadı. İlk MP.7.5 barış teklifi FAIL'i de saklandı; kontrol ve aday tekrarları geçti fakat kök nedeni kapanmış sayılmadı.

## Kanonik kaynak

- GitHub'dan doğrulanan başlangıç HEAD: `c005f82c240ab26375f5307405d11a883207a453`.
- Başlangıç dalı `codex/stars-mp85-live-mobile-audit`, geliştirme dalı `codex/stars-mp86-performance`, PR tabanı başlangıç dalı.
- Yeni bulut ortamı eski main snapshot'ıyla geldi; çalışma ağacı temizliği kontrol edildi, istenen uzak dal fetch edilip doğrudan ondan yeni dal açıldı. Eski main üzerinde geliştirilmedi.
- Sabit kontrol kaynakları `/tmp/star-mp86/control` altında gerçek dosya kopyalarıdır; Git worktree veya değişen runtime'a symlink değildir. Yalnız ortak değişmeyen test bağımlılıklarına symlink kullanıldı.
- `AGENTS.md`, devir, MP.8.5 rapor/tablosu ve PERF.2 sonuçları esas alındı. `main`, merge/rebase/force-push kullanılmadı.
- Nihai rapor commit'i kendi SHA'sını önceden bilemez; doğrulanmış önceki teslim referansı GitHub kaydına eklenir, son HEAD sohbet tesliminde verilir.

## Ortam

Node **24.22.1**, Debian Chromium **155.0.8059.79**, Playwright **1.62.1**, native Canvas **0.1.100**. Chromium yolu `/usr/bin/chromium`; `STARS_CHROMIUM_PATH` ile mevcut altyapıya verildi. Bunlar Codex bulut ortamı ölçümleridir; fiziksel Android değildir. Önceki tarayıcı/Node sürümlerine göre mutlak süre karşılaştırması yapılmadı; kontrol ve aday aynı oturum/bağımlılıklarla ölçüldü.

## Profil yöntemi ve bulgular

Mevcut `browser-mp75-perf.cjs` yeniden kullanıldı; opt-in checkpoint/CPU profili helper'ı eklendi. Seed404, 45 sistem, 2 insan + 5 AI, gerçek 120. ay. Profil ve karşılaştırma ayrı gerçek-zaman koşularından gelir; **kontrol–aday karşılaştırmasının kendi iki kolu aynı byte dizisini kullanır**. Profil sırasında CDP 4× CPU, 1 ms sampling interval. Ham sıkıştırılmış CPU profilleri ve özetler [evidence/mp86/](evidence/mp86/) altında.

| Host işlevi (3 deterministik ay, 120'den başlar) | Örneklenen kapsayıcı ms |
|---|---:|
| monthTick, main.js | 2546,5 |
| aiTurn | 1936,7 |
| aiEconomyPlan | 1394,0 |
| empireIncome | 1378,4 |
| autoExploreTick | 629,4 |
| tradeInfo | 491,7 |
| supplyDistance | 191,7 |
| tradeLinks | 191,3 |
| aiShadowIncome | 188,9 |
| txCaptureGraph | 105,1 |

Bunlar profiler'ın örneklerden atfettiği ağırlıklardır; birbirini kapsayan süreler **toplanmaz**, kesin kronometre çağrı süreleri değildir. Host profil eylemi üç ay ilerlettiğinden sonuç 120. ay girdisiyle 120→123 yüküdür. `monthTick` MP sarmalı yaklaşık 2824 ms, ledger gözlem sarmalı da belirgin maliyet taşır. Hotspot listesi öncelik verir; tüm yinelenen aiEconomyPlan çağrılarının gereksiz olduğu kanıtı değildir.

Misafir aynı kaydı 10 defa yükleme profilinde `txCaptureGraph` yaklaşık **264,5 ms self**, `ART.nebula` **244,7 ms self**, `recalcMods` **104,0 ms self**; deserialize yaklaşık **1224 ms inclusive**. `applySaveData` her yüklemede aynı seed ile 128×128 bulutsuyu yeniden hesaplıyor. `ART.nebula` kendi yerel mulberry32/fbm hesaplarını kullanıyor; aynı girdinin pikselleri deterministik. Ölçülmüş ve güvenli tekrar olarak bu seçildi.

Misafir host duraklıyken alınan kare profilinde örneklerin büyük kısmı **(program)** olarak atfedildi (yaklaşık 5651/6385 ms); JS `frame` inclusive 593 ms, `View.draw` yaklaşık 324 ms, topbar yaklaşık 98 ms. Atfedilemeyen/native işin tamamını tek bir çizim fonksiyonu gibi göstermiyoruz. Bu fazda FPS düşüklüğünün bütün kök nedeni çözülmedi; geniş çizim/ayna yeniden yazımı yapılmadı.

## Başarısız komutların nedeni / 240. ay sınırı

İlk `MP86_PROFILE=1`, 120/240 çift-hedef koşusu 120. ay kaydını ve üç profili üretti; ancak host profil eylemi dünyayı üç ay ilerletir. Bu işlemden sonra devam eden gerçek-zaman tarihçesi birebir kontrol koşusu sayılmaz. Bu nedenle salt okunur **MP86_CAPTURE=1** ile kayıt yakalama ayrıca denendi.

**İki koşu da 240 hedefinde gerçek ay237 / monthTick n=0 ile FAIL 0/1, çıkış1 oldu.** `drive()` ya hedef aya ulaşınca ya da `G.over` olduğunda döner. Gerçek ay237 olduğundan burada oyun-sonu erken dönüş yolu çalıştı; ardından MP.8.5'in hedef-ay/örnek guard'ı hatayı doğru yakaladı. Timeout büyütülmedi, oyun-sonu bayrağı silinmedi, dünya zorla yaşatılmadı, sıfır örnek PASS sayılmadı.

120. ay checkpoint'leri geçerlidir; başarısız genel koşunun 240 sonucu kullanılmaz. 240 için profil/kontrol–aday kazancı **NOT RUN / yetersiz pencere**. Ek uzun kampanya açılmadı. İleride profil alma modu tek checkpoint ile sınırlandırıldı; `MP86_CAPTURE=1` salt kayıt yakalar. Destructive host profili ile canlı sonraki checkpoint karşılaştırması karıştırılmaz.

## Seçilen optimizasyon ve güvenlik

`research/mp6/client/guest-stars.js` içinde küçük, guest-only `ART.nebula` wrapper'ı:

- Anahtar tam `(seed, width, height)`; yalnız güvenli tamsayı girdiler ve en fazla 65536 piksel cache edilebilir.
- **Tek ImageData girdisi**: normal 128×128 için 64 KiB, üst sınır 256 KiB piksel verisi. Dünya/oyuncu sayısıyla büyüyen Map yok.
- Her çağrıda **yeni canvas** döner. Önbellekte mutable canvas referansı tutulmaz; çağıranın canvas'ı temizlemesi veya eski canvas'ın piksel belleğini kaybetmesi sonraki yüklemeyi bozmaz.
- Yeni seed/ölçüde eski girdi bırakılır; ilk üretim orijinal ART.nebula yoludur. Canvas/context/pixel okuma hatasında cache kullanılmaz, orijinal üretim/fallback korunur.
- Host, diğer oyuncular, komutlar, ayna alanları, kararlar ve RNG'ye yeni yazım yok. Veri yalnız mevcut misafir kozmetik seed'inden üretilen arka plan pikselleridir; yeni gizli veri aktarılmaz.
- Soğuk ilk çağrıda orijinal hesap + pixel readback vardır. Kazanç aynı ayna seed'iyle tekrarlı sıcak yüklemelerdedir; soğuk çağrı kazancı iddia edilmiyor.

AI ekonomi planını gün başına cache etmek değerlendirilip **uygulanmadı**: aynı gün alışveriş, kuyruk ve yükümlülük değişimleri planı değiştirebilir; güvenli invalidation kanıtlanmadı. txCaptureGraph işlem/rollback kapsamı daraltılmadı. PERF.1/PERF.2 yeniden yazılmadı. İkinci ürün optimizasyonu eklenmedi.

## Aynı Save8 karşılaştırması

[Karşılaştırma tablosu](evidence/mp86/KARSILASTIRMA.md), [ham örnekler](evidence/mp86/bench120.json), `capture-guest-m120.save` ve input SHA-256 kaydedildi. Save8 gerçek 120. ay seed404 host koşusundan, iki insanlı dünyada misafir1 aynasıdır. Misafir Save8'indeki seed kozmetiktir; host'un gizli gerçek seed'i aynaya eklenmedi.

Aynı Chromium süreci, 800×360 dokunmatik context'ler, 4× CDP CPU, yeni context/ART durumu, kol başına iki warm load + 12 ölçüm, dört AB/BA turu. Aralarda başka Chromium testi çalıştırılmadı. Ortanca/p95 mevcut araçlarla aynı şekilde sıralı dizide `floor(n*q)` indeksidir. Her kol 48 örnek, fakat 48 bağımsız cihaz deneyi değildir; dört context turu vardır.

| Ölçüm | Kontrol | Aday | Azalma |
|---|---:|---:|---:|
| Sıcak deserialize ortanca | 167,7 ms | 61,1 ms | **%63,6** |
| Sıcak deserialize p95 | 360,1 ms | 109,0 ms | **%69,7** |

Her turda aynı yön gözlendi; tur bazında ortanca azalma yaklaşık %55–75 aralığında. Makine/JIT/GC gürültüsü vardır; bütün MP yükleme yolu veya ay hesabı için bu oran kullanılmaz. Host ay hesabı için kabul edilmiş optimizasyon/kazanç **yok**. FPS ve 240. ay kazanımı **iddia edilmiyor**.

## Save8/RNG ve pikseller

Kontrol/adaya ait tüm son serialize SHA-256'ları ve RNG değerleri aynı. Bu, aynı girdinin normalizasyon sonrası iki kol eşitliğidir; girdi dosyasının ham byte'ına değişmeden roundtrip iddiası değildir. İzole benchmark aynı oyun arayüzünün deserialize çekirdeğini kullanır; tam canlı MP wrapper/transport hızı olarak sunulmaz.

Gerçek native Canvas testleri **3/0 PASS**: seed/ölçü çeşitleri, orijinalle tam RGBA eşitliği, yeni canvas kimliği, RNG değişmezliği, çağıran canvas'ını temizleme, tek-girdi sınırı, bozuk context fallback'i ve büyük girdinin saklanmaması. Gerçek Chromium piksel testi ayrıca **3 vaka PASS**, çıkış0: soğuk üretim ve sıcak kopya orijinalle byte-byte aynı.

AI/ekonomi kodu değişmedi. PERF.1 **4/0**, PERF.2 **5/0 PASS**. Bu testlerin ay-ay Save8/RNG ve saf pencere kapsamı korunur; ek bir host optimizasyonu için eşdeğerlik iddia edilmiyor.

## Regresyonlar — PASS / FAIL / NOT RUN

| Kontrol | Gerçek sonuç |
|---|---|
| Native cache testi (entegrasyondaki blok) | **3/0 PASS**, çıkış0 |
| Chromium pixel-only testi | **3 vaka PASS**, çıkış0; zaman ölçümü değildir |
| PERF.1 / PERF.2 | **4/0**, **5/0 PASS**, çıkış0 |
| MP.7.4 | **7/0 PASS**, A1/A4/A5/B1 dahil |
| İlk MP.7.5 aday koşusu | **5/1 FAIL**, çıkış1; A3 host AI barış teklifi oluşmadı |
| MP.7.5 sabit kontrol kaynakları tekrar | **6/0 PASS**, çıkış0 |
| MP.7.5 aday tanılı tekrar | **6/0 PASS**, çıkış0 |
| MP.8 N | **9/0 PASS**, kopma/kayıp karar/tek uygulama/ayna/gizlilik |
| MP.8 R, 6+6 ay | **5/0 PASS**, kayıt/yeni oda/devam |
| MP.7.3 | **8/0 PASS**, yerel /mp/version + UI **MP.8.6** ve siyaset/gizlilik |
| Profil çift hedef 120/240 | **0/1 FAIL**, 240 penceresi n=0 |
| Salt capture çift hedef 120/240 | **0/1 FAIL**, 240 penceresi n=0 |

İlk MP.7.5 A3 hatası `AI peace offer to the guest` assertion'ıdır. Bu, piksel kontrolü değil host teklif oluşturma adımıdır. Aynı tanı testi hem sabit kontrol hem adayda tekrar geçti. Aralıklı hata yeniden üretilemediği için kesin kök neden ilan edilmiyor; ilk FAIL silinmedi ve “düzeldi” sayılmadı. Sonraki FAIL'de wars/lastOffer/teklif durumu alınması için yalnız başarısız dalda tanı kaydı eklendi; beklenti/timeout gevşetilmedi. Görsel önbelleği bu host mantığı hatasının kanıtlanmış nedeni diye sunmuyoruz; açık regresyon riski olarak bırakıyoruz.

MP.8 N/R seed/boyut ve hedef-ay düzeltmeleri korundu. R kısa koşusu 60 aylık kampanya değildir; kaynak başlığındaki 60 sayısı statiktir. B1 geçmişteki zaman aşımı bu fazda kapanmış sayılmaz.

**NOT RUN:** fiziksel Android; **tüm canlı Render kontrolleri** (kullanıcının talimatıyla hiçbir bağlantı/izin/sağlık/WSS/smoke/deploy denenmedi); tam regresyon, tam 240 aylık dayanıklılık kampanyası ve yeni oyun ZIP testi. 240 geçerli profil/karşılaştırma penceresi oluşmadı; n=0 satırları performans verisi olarak kullanılmadı.

## Sürüm / dağıtım / değişen dosyalar

Oyun runtime'ı **96h10p5 / stars-v96h10p5**, Save8 aynı. 19 runtime dosyasının manifest SHA-256'sı eşleşti. Runtime değişmediğinden yeni game build, manifest, ZIP, SHA-256/CRC32 paket üretimi **gerekmedi / yapılmadı**.

MP istemci ve yerel sürüm endpoint'i **MP.8.6** olarak güncellendi (`view.js`, `relay.js`); protokol v1 ve MP paket v4 değişmedi. Mevcut Docker COPY dizinleri ve allowlist aynı `guest-stars.js` dosyasını zaten kapsıyor; yeni istemci asset'i yok. MP.7.3'ün sürüm beklentisi mevcut **kesin MP.8.6** sözleşmesine güncellendi; eski sürümleri kabul eden daha gevşek bir regex eklenmedi. Yerel UI/endpoint sürüm eşleşmesi test edildi; canlı dağıtım yapılmadı.

Ürün değişikliği üç dosya: `guest-stars.js`, `view.js`, `relay.js` (son ikisi sürüm). Test/profil araçları: `mp86_nebula_cache_test.js`, `mp86-nebula-bench.cjs`, `helpers/mp86-profile.cjs`, `browser-mp75-perf.cjs`, `browser-mp75.cjs` tanısı ve `browser-mp73.cjs` sürüm beklentisi. Rapor/kanıtlar ve `CODEX-SON-RAPOR.md` güncellendi.

## Yeniden çalıştırma ve kanıtlar

```sh
# Depo kökü; STARS_CHROMIUM_PATH=/usr/bin/chromium; tüm Chromium koşuları sırayla.
node tests/mp86_nebula_cache_test.js
# benchmark: sabit runtime kopyası, istemcideki marker bloğunun dosyası, aynı guest Save8
node tests/mp86-nebula-bench.cjs <control-root> <nebula-block.js> reports/codex/evidence/mp86/capture-guest-m120.save <out.json>
MP86_PIXELS_ONLY=1 node tests/mp86-nebula-bench.cjs <control-root> <nebula-block.js> reports/codex/evidence/mp86/capture-guest-m120.save <pixels.json>
# Profil bir kez tek checkpoint; üç host ayı ilerletir, sonraki canlı hedefle karşılaştırılmaz.
MP75_SEED=404 MP75_SIZE=orta MP75_AI=5 MP75_MONTHS=120 MP75_CPU=4 MP86_PROFILE=1 node tests/browser-mp75-perf.cjs
# Salt okunur yakalama modu (240'da oyun-sonu erken dönüşü FAIL kalabilir):
MP75_SEED=404 MP75_SIZE=orta MP75_AI=5 MP75_MONTHS=120,240 MP75_CPU=1 MP86_CAPTURE=1 node tests/browser-mp75-perf.cjs
```

Piksel bloğu istemcide `MP.8.6 NEBULA PIXELS` marker'ları arasındadır. Host snapshot paketindeki kimlik doğrulama metası yerine yalnız Save8 payload'u kanıta kondu. Ham CPU profilleri `.cpuprofile.gz`, özetler, bütün komut logları/çıkışları, sabit girdi ve son serialize SHA/RNG değerleri kanıt dizinindedir. `node --check`, `git diff --check` ve çalışma ağacı kontrolü tamamlandı.

## Açıklar / sonraki faz

1. Host ay hesabı hâlâ ağır; güvenli bütçe invalidation sözleşmesi kurulmadan aiEconomyPlan cache eklenmemeli. Gerekirse ayrı küçük kontrol–aday deneyinde değişiklik anları tek tek sınanmalı.
2. Düşük CPU kare sürelerinin çoğu `(program)` altında; Canvas/raster/ana döngü ayrımı için daha ayrıntılı trace gerekir. Bu faz FPS iyileştirmesi kanıtlamaz.
3. 240. ayda aktif oyun penceresi oluşmadı; o yaşta kazanım onaylanmadı. Bir sonraki çalışma bilinen yaşayan 240. ay Save8'ini doğrudan sabit fixture olarak kullanmalı; oyunu zorla yaşatmamalı.
4. MP.7.5 A3 ilk FAIL ve tarihsel B1 açık; tanı oluşmadan ürün mantığı değiştirilmemeli.
5. Render/Android bu fazda NOT RUN; kullanıcı sonraki faz için ayrıca isterse planlanır. Bildirim gizleme kalıcılığı kapsam dışı ve hâlâ uygulanmadı.

## GitHub teslim kaydı

- Kod/kanıt/rapor commit'i **`a7ffada319ddd88ab5c62e299ca62fc61bc0fd43`** GitHub'a başarıyla push edildi; `git ls-remote --heads origin refs/heads/codex/stars-mp86-performance` aynı SHA'yı doğruladı.
- Bitiş durumu: doğrulanmış kod HEAD'i yukarıdadır. Bu teslim kaydını tamamlayan son belge commit'inin SHA'sı son sohbet yanıtında verilir; kendi SHA'sını yazmak için ek commit zinciri oluşturulmaz.
- Geliştirme dalı: `codex/stars-mp86-performance`; PR tabanı: `codex/stars-mp85-live-mobile-audit`.
- **PR oluşturulamadı / BLOCKED**: tek `gh pr create` denemesi `Post "https://api.github.com/graphql": Forbidden` ile çıkış1 döndürdü. Tekrar denenmedi, güvenlik sınırları değiştirilmedi. [Hata kaydı](evidence/mp86/pr-attempt.log).
- [GitHub sonuç raporu](https://github.com/sarsiss12-dot/Star/blob/codex/stars-mp86-performance/reports/codex/MP86-PERFORMANS-SONUC.md).
- [Doğru tabanla karşılaştır / PR oluştur](https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp85-live-mobile-audit...codex/stars-mp86-performance?expand=1).
- `main` değiştirilmedi; merge/rebase/force-push ve Render işlemi yapılmadı. GitHub rapor teslimi **PASS**, otomatik PR oluşturma **BLOCKED**.
