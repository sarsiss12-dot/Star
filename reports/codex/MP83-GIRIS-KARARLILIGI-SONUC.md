# STARS MP.8.3 — Multiplayer giriş kararlılığı

## Kaynak / GitHub

Başlangıç HEAD: `e000bb0c488c046b3ede9d8fab86eb00ffe8889a`. GitHub'dan fetch edilen `codex/stars-mp82-test-stability` ile yerel HEAD eşleşti; başlangıç çalışma ağacı temizdi. Yeni dal `codex/stars-mp83-join-stability`, PR tabanı `codex/stars-mp82-test-stability`. Eski MP.8.1 dalından başlanmadı. `main`, rebase ve force-push kullanılmadı.

Doğrulanmış başlangıç kaynak referansı yukarıdadır; test değişikliklerini içeren doğrulanmış bitiş referansı `64e338062056ea9fc5902cc655838492796f014f` (ilk teslim commit’i) olarak kaydedildi. Bu teslim kaydı commit’inin nihai SHA’sı sohbet tesliminde ve Git geçmişinde verilir. Kendi SHA'sını rapora yazmak için yeni commit döngüsü oluşturulmaz. Teslim kaydı aşağıdadır.

## İncelenen kanıtlar

`GPT-DEVIR.md`, `CLAUDE.md`, `AGENTS.md`, `CODEX-SON-RAPOR.md`, MP.8.2 raporu ve kanıtları, `research/mp81/A5-TANI.md`, `tests/browser-mp74.cjs`, `join.js` odak/lobi/gezinme kodları ve `mp7-setup.js` korumaları esas alındı. Eski araştırmalar yeniden yürütülmedi.

İlk yeni koşu değiştirilmemiş MP.7.4 testidir. Sonraki iki koşu harici preload ile tanıdır. Preload Node tarafında JSONL tutar: gerçek pointer/touch/click hedefi, sayfa başına element kimliği/geometrisi, odak, kaydırma, giriş/düzenleme düğmeleri, ana çerçeve gezinmesi, betik/HTTP/JS hataları, CDP dokunma komutları. İkinci tanıda iç panel `scrollTop` ve dokunma öncesi hit-test de eklendi. URL sorguları ve giriş değerleri kaydedilmez.

Kalıcı kanıtlar [evidence/mp83/](evidence/mp83/) altında. JSONL dosyaları yalnız bu iki tanı koşusuna aittir; hatalı taban koşusunun DOM olayları varmış gibi sunulmaz. `:after` etiketli DOM kayıtları capture listener mikro-görevleridir; tüm ürün işleyicilerinin tamamlandığına dair ölçüm değildir.

## A1: kanıtlanan test koordinatı yarışı

1. Değiştirilmemiş taban yine **`/mp/play → /mp/play → /`** yaptı; ardından `room()` beklemesi `MP1Join is not defined` hatası verdi.
2. Eski `joinTaps()` KATIL geometrisini yalnız bir kez ölçüyor, aynı koordinatı bütün hızlı dokunuşlarda kullanıyordu.
3. `join.js` odaklanmış giriş alanı için **250 ms sonra `scrollIntoView`** çalıştırıyor. Kaydırma pencerenin değil, `#mp6App` panelinin içinde gerçekleşiyor.
4. Gerçek ürün sayfasıyla kontrollü yerleşim deneyinde KATIL dikdörtgeni `[120,252.484375,560,48]` iken 350 ms sonra `[120,212.484375,560,48]` oldu; panel `scrollTop` değeri **0 → 40** değişti. Önceden ölçülen merkez artık **`A[data-j="home"][href="/"]` GERİ bağlantısına** denk geldi.
5. O eski noktaya gerçek touchscreen dokunuşu yapıldığında **`NAV /`** oluştu. Böylece hatalı gezinmeyi başlatan olay kontrollü hatalı koşuda GERİ bağlantısına giden gerçek dokunuş olarak gösterildi.
6. Aynı gecikmiş kaydırmadan sonra güncel KATIL geometrisiyle üç gerçek dokunuş yapıldığında sayfa `/mp/play` olarak kaldı ve geçersiz kodun beklenen ürün mesajı görüldü.

Kanıt: [geometry.log](evidence/mp83/geometry.log), [geometry-fixed.log](evidence/mp83/geometry-fixed.log); tekrarlanabilir deney `tests/browser-mp83-join.cjs`.

**Sınır:** doğal taban FAIL'indeki bireysel DOM hedefi kaydedilmedi. Ayrıntılı iki doğal tanı koşusu geçti. Kontrollü deney eski testin yanlış bağlantıya dokunabildiğini ve aynı gezinme/hata yolunu kanıtlar; tarihsel bütün A1 vakalarının tek nedeninin bu olduğu veya ürün girişinin her cihazda kusursuz olduğu iddia edilmez. Mevcut kanıt ürün kodunu değiştirmeyi gerektirmedi.

## Minimal düzeltme

`tests/browser-mp74.cjs` içindeki tek seferlik koordinat yerine `tests/helpers/mp83-join-touch.cjs` kullanılır. Her dokunuştan önce güncel KATIL merkezi ve hit-test ölçülür; aynı gerçek CDP touchStart/touchEnd yolu ve 25 ms dokunuş aralığı korunur. Örtülü hedef başarı sayılmaz.

İlk denemede düğme ilk dokunuşla lobiye geçince yeni guard B1'i gereksiz düşürdü (**fixed1: 6/1**). Son helper, yalnız doğrulanmış lobi geçişinde son koordinatı kullanarak kalan gerçek dokunuşları sürdürür. Böylece toplam çift/üç dokunma sayısı ve ürünün hayalet dokunma koruması sınanmaya devam eder. Başka sayfaya geçiş kabul edilmez.

Timeout artırılmadı; `window.MP1Join` guard'ıyla yanlış gezinme gizlenmedi. A4/A5 tam kart anahtarı ve duraklatılmış ölçümleri değişmedi. Ürün runtime/MP istemci/server kodu değişmedi.

## B1 değerlendirmesi

Geçmişteki **`#jEditMe` tap zaman aşımı** bu fazda yeniden üretilemedi. İki tanıda lobi yeniden çizimleriyle element kimliklerinin değiştiği gözlendi; başarılı dokunuşlarda pointerdown/up/click aynı `jEditMe` kimliğine gitti. Bu, geçmiş başarısızlığın kök nedeni değildir. Playwright tamamlanma koşulu ile 700 ms korumasının o FAIL'e neden olduğu kanıtlanmadı; tahmini ürün düzeltmesi yapılmadı.

`fixed1` B1 hatası tarihsel hata değildir: `jEditMe` aşamasına gelmeden yeni test guard'ı KATIL'ın lobide kalkmasını reddetmiştir. Son helper'da bu test kusuru düzeltildi. Tarihsel B1 açık kalır; A1 ile ortak kök neden iddia edilmez.

## Test sonuçları

Ortam: Node **24.22.1**, Chromium **155.0.8059.79**, Playwright **1.62.1**, Canvas **0.1.100**. Claude'un Node 22 ortamından fark kaydedildi; fark tek başına neden sayılmadı. Tüm koşular sırayla, yeni Chromium süreçleri/bağlamlarıyla yapıldı; makine yeniden başlatılmadı.

| Koşu | PASS/FAIL | Çıkış | A1 | A4 | A5 | B1 |
|---|---|---|---|---|---|---|
| Değiştirilmemiş taban | 1/6 | 1 | FAIL | FAIL | FAIL | PASS |
| Doğal tanı 1 | 7/0 | 0 | PASS | PASS | PASS | PASS |
| Doğal tanı 2 | 7/0 | 0 | PASS | PASS | PASS | PASS |
| İlk helper denemesi (fixed1) | 6/1 | 1 | PASS | PASS | PASS | FAIL — yeni guard |
| Son helper temiz koşu 1 (fixed2) | 7/0 | 0 | PASS | PASS | PASS | PASS |

| Son helper temiz koşu 2 (fixed3) | 7/0 | 0 | PASS | PASS | PASS | PASS |

Tabanda A2/A3 ve sayfa-hatası kontrolü de FAIL'dir. Bu sonuç sonraki başarılarla silinmez; A4/A5'in taban FAIL'leri bozulan A1 akışından bağımsız yeni kusur kanıtı değildir. İki son-helper koşusu da preload olmadan geçti. Depoya kaydedilen `browser-mp83-join.cjs` de çıkış 0 ile negatif eski-nokta kontrolünü ve güncel-nokta başarısını doğruladı (`regression.log`).

Komutlar (depo kökü):

```sh
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp83/baseline node tests/browser-mp74.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp83/trace2 STARS_TRACE=/tmp/star-mp83/trace2.jsonl node --require ./tests/helpers/mp83-input-trace.cjs tests/browser-mp74.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp83/fixed2 node tests/browser-mp74.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp83/fixed3 node tests/browser-mp74.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium node tests/browser-mp83-join.cjs
```

Kontrollü deneydeki 350 ms bekleme, ürünün 250 ms odak zamanlayıcısının sonrasını bilerek sınar; MP.7.4 timeout'ları değiştirilmez. Deneyde kasıtlı eski-nokta gezinmesi beklenen negatif kontroldür, MP.7.4 için PASS olarak sayılmaz. Kod sözdizimi ve `git diff --check` ayrıca doğrulanır.

## Save8/RNG ve yayın

Yalnız test/helper, rapor ve tanı kanıtları değişti. Save8/RNG, host yetkisi, görünürlük/gizlilik, PERF.1/PERF.2 kodu değişmedi. MP.7.4 tek koltuk, kapasite ve diplomatik kararın tam bir kez uygulanmasını doğrular. Yeni genel Save8/RNG eşdeğerliği ölçüldüğü iddia edilmez.

Runtime build **96h10p5**, MP sürümü **MP.8** korunur. Yeni build/PWA kimliği, manifest, ZIP, SHA-256 veya CRC32 üretimi gerekmiyor; yayın ve dağıtım dosyaları değişmedi.

**NOT RUN:** bu fazda PERF.1/PERF.2 dinamik eşdeğerlik tekrarları, MP.8 N/A/B/C/R, tam regresyon, Docker, 10+ bildirim, fiziksel Android ve canlı Render. Ürün değişmediği için bunlar kapsam dışı bırakıldı.

## MP.8.4 önerisi / açık konular

- Tarihsel B1'i kapanmış sayma. Sonraki hedefli koşuda Playwright eylem logu, aynı elementin DOM ömrü ve tasarım ekranının açılma anını birlikte yakala; gerekmedikçe ürün korumasını değiştirme.
- Doğal bir A1 yeniden oluşursa kalıcı JSONL tanısını kullan. Güncel merkez ölçümü ile CDP gönderimi atomik değildir; yeni bir yarış kanıtı görülürse olay hedefini yeniden incele.
- Event gizleme kalıcılığı ve Android/Render doğrulaması ayrı fazlardır.

## GitHub teslim kaydı

PR oluşturma denemesi `https://api.github.com/graphql` için **Forbidden** döndü. Güvenlik/ağ sınırları değiştirilmedi; oluşturulmuş PR bağlantısı yok. Rapor, kanıtlar ve test değişiklikleri `64e338062056ea9fc5902cc655838492796f014f` commit’iyle GitHub’a push edildi; `git ls-remote` uzak dalda aynı SHA’yı doğruladı. Uzak dal oluşturulduktan sonraki PR denemesi de Forbidden döndü. Bu teslim kaydı aynı dala ek bir rapor commit’iyle gönderilir; nihai SHA son yanıttadır.

- Rapor: https://github.com/sarsiss12-dot/Star/blob/codex/stars-mp83-join-stability/reports/codex/MP83-GIRIS-KARARLILIGI-SONUC.md
- PR oluşturma ekranı (oluşturulmuş PR değildir): https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp82-test-stability...codex/stars-mp83-join-stability?expand=1
