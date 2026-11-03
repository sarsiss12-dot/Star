# STARS MP.8.2 — Test kararlılığı ve kalıcı GitHub raporlama

## Kaynak ve kapsam

- Başlangıç HEAD: `f1ee4675eb65763047a18e65372a8c6351654762`.
- Doğrulanan kaynak: `claude/stars-mp81-final-handoff`; uzak dal ve beklenen HEAD eşleşti, başlangıç ağacı temizdi.
- Geliştirme dalı: `codex/stars-mp82-test-stability`.
- İstenen PR tabanı: `claude/stars-mp81-final-handoff` (PR #32 zinciri).
- `main` değiştirilmedi, merge/rebase/force-push yapılmadı.
- Bu rapor kendi commit SHA'sını içermez; doğrulanmış önceki kaynak commit'ini kullanır. Nihai rapor HEAD'i sohbet tesliminde belirtilir.

## Araştırmalar ve kanıt

`GPT-DEVIR.md`, `CLAUDE.md`, `research/mp81/A5-TANI.md` ve eski A1/B1 hata kayıtları incelendi. `tests/browser-mp74.cjs`, `join.js` giriş/lobi/geri gezinme işleyicileri ve `mp7-setup.js` kurulum/geri gezinme/sentetik tıklama koruması okundu.

En fazla üç yeni tam MP.7.4 koşusu yapıldı; tümü sırayla ve yeni Chromium süreçleriyle çalıştırıldı. İlk koşu değiştirilmemiş testtir. Sonraki iki koşuda yalnız harici Playwright preload'u, gerçek pointer/touch/click hedeflerini kaydetti. Beklentiler, süre sınırları, ürün ve test dosyaları değiştirilmedi. Preload zamanlamayı etkileyebileceği için bu iki başarı, kök nedenin giderildiği anlamına gelmez.

Kalıcı kanıtlar: [sonuç JSON'u](evidence/mp82/results.json), [taban günlüğü](evidence/mp82/baseline.log), [tanı 1](evidence/mp82/trace.log), [tanı 2](evidence/mp82/trace2.log), [harici preload kaynak metni](evidence/mp82/trace-preload.cjs.txt). Tanı günlükleri NAV/PASS/FAIL ve giriş/düzenleme düğmesi olaylarına indirgenmiştir; tam sonuç ve hata metinleri JSON'dadır.

## Kanıtlanan bulgular ve kök neden sınırı

### A1 — yeniden üretildi, kök neden henüz kapanmadı

İlk koşuda `NAV B /mp/play` → `NAV B /mp/play` → **`NAV B /`** görüldü. Ardından `room()` içindeki bekleme koşulu `MP1Join.screen` okurken `ReferenceError: MP1Join is not defined` verdi.

Kanıtlanan yakın neden: misafir beklenen MP belgesinden ana sayfaya geçmiştir; test o belgede bulunmayan globali okur. Bu bulgu, sorunu yalnız geç yüklenen bir betik gibi ele almanın yetersiz olduğunu gösterir. Ana sayfaya gezinmeyi hangi kullanıcı/tarayıcı olayı başlattığı ilk koşuda kaydedilmedi; asıl kök neden bilinmiyor.

`joinTaps()` hızlı dokunma dizisi için tek `boundingBox` ölçümü kullanır. İstemci giriş alanına odaklanınca 250 ms sonra `scrollIntoView` çalıştırır; giriş ekranında `/` hedefli GERİ bağlantısı vardır. Sabit koordinat, kaydırma ve gezinme ilişkisi araştırılacak adaydır; **kanıtlanmış kök neden değildir**. Başarılı tanı koşularında dokunuşların KATIL düğmesine gittiği kaydedildi; hatalı koşunun olay hedefi elde edilemedi.

Bir `window.MP1Join` kontrolü eklemek yanlış sayfaya gezinmeyi düzeltmez; hatayı yalnız bekleme zaman aşımına dönüştürebilir. Bu nedenle böyle bir değişiklik yapılmadı. Ürün hatası/test hatası ayrımı açık kaldı.

### B1 — bu oturumda yeniden üretilemedi

Üç koşunun tamamında B1 geçti. Eski kayıtta `#jEditMe` dokunma zaman aşımına rağmen tasarım ekranı açılmıştı. Lobi yeniden çizimi, Playwright eylem tamamlanması ve dokunma koruması olası etkenlerdir; hiçbiri kesin kök neden olarak kanıtlanmadı. B1 ürün kusuru olarak ilan edilmedi, kapanmış da sayılmadı.

### A4/A5

MP.8.1'in tam `mp71:<id>` kart anahtarı ve ölçüm sırasında duraklatma düzeltmeleri korundu. İlk koşudaki A4/A5 FAIL'leri, A1 sonrası bozulan akıştadır; yeni bağımsız A4/A5 kök nedeni kanıtlamaz. İki tanı koşusunda A4/A5 geçti.

## Değişiklikler

- Kök `AGENTS.md` oluşturuldu: devir belgeleri, Türkçe rapor, Save8/RNG, host otoritesi, gizlilik, PERF.1/PERF.2, main merge yetkisi, test dürüstlüğü ve GitHub raporlama kuralları.
- `reports/codex/<FAZ-ADI>-SONUC.md` ve `CODEX-SON-RAPOR.md` akışı tanımlandı; bu fazın raporu ve kanıtları eklendi.
- Bu, ajan tarafından her görev sonunda uygulanacak kalıcı iş akışıdır; bağımsız bir CI servisi veya koşulsuz GitHub yayın garantisi değildir. Erişim hatası açıkça raporlanır.
- Runtime, MP ürün kodu, testler, bağımlılık bildirimleri ve lockfile değişmedi. Kanıtlanmış tam kök neden olmadığından tahmini düzeltme uygulanmadı. Timeout artırılmadı.

## Ortam ve gerçek test sonuçları

Node **24.22.1**, Chromium **155.0.8059.79** (`/usr/bin/chromium`), npm **11.9.0**; mevcut Playwright **1.62.1** ve Canvas **0.1.100** kullanıldı. Önceki Claude raporlarındaki Node 22 ortamından farklıdır; sürüm farkı kök neden sayılmadı. Gerçek soğuk makine yeniden başlatması yapılmadı; koşular yeni tarayıcı süreçleri/bağlamlarıyla başladı.

Depo kökünde kullanılan komutlar:

```sh
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp82/baseline node tests/browser-mp74.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp82/trace node --require /tmp/star-mp82/trace.cjs tests/browser-mp74.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp82/trace2 node --require /tmp/star-mp82/trace.cjs tests/browser-mp74.cjs
```

| Yeni koşu | PASS / FAIL | Çıkış | A1 | B1 | Sayfa hatası |
|---|---|---|---|---|---|
| Taban, değiştirilmemiş test | **1 / 6** | 1 | FAIL | PASS | 1 |
| Harici olay tanısı 1 | **7 / 0** | 0 | PASS | PASS | 0 |
| Harici olay tanısı 2 | **7 / 0** | 0 | PASS | PASS | 0 |

Tabanda A1, A2, A3, A4, A5 ve sayfa hataları kontrolü FAIL; B1 PASS. Sonraki başarılı koşular bu FAIL sonucunu silmez. A1/B1 kararlılığı sağlandı iddiası yoktur.

Önceki Codex doğrulamasındaki PERF.2 **5/0**, MP.8 N **9/0**, MP.7.4 **7/0** tarihsel bağlamdır; bu fazda yeniden çalıştırılmış sonuç olarak gösterilmez.

**NOT RUN (bu faz):** PERF.1/PERF.2 eşdeğerlik tekrarları, MP.8 N/A/B/C/R, tam Node/Chromium regresyonu, Docker testleri, 10+ eşzamanlı bildirim, fiziksel Android, canlı Render. Ürün/test düzeltmesi yapılmadığı için ilgisiz regresyon genişletilmedi.

## Save8/RNG ve yayın

Oyun ve MP kodu değişmedi; Save8 şeması/baytları, RNG tüketim sırası, host yetkisi ve gizlilik kuralları için yeni davranış eklenmedi. Bu fazda yeni dinamik eşdeğerlik sonucu iddia edilmiyor. PERF.1/PERF.2 kodu aynen korundu.

Runtime değişmedi: build `96h10p5`, MP sürümü `MP.8` korundu. Yeni ZIP/manifest/SHA-256/CRC32 üretilmesi gerekmiyor; yayın dosyaları değiştirilmedi.

## GitHub durumu

PR oluşturma denendi; `gh pr create` GraphQL isteği `Forbidden` döndü. Salt okunur GraphQL ve REST sorguları da `Forbidden` döndü. Bu sonuç Git push yetkisinin yokluğunu tek başına kanıtlamaz. PR oluşturulmuş gibi gösterilmiyor; doğrulanmış PR bağlantısı yok.

Rapor geliştirme dalına commit edilerek gönderilecek; gönderim sonucu ve uzak HEAD doğrulaması aşağıdaki teslim kaydında belirtilecektir. `main` hedeflenmez. GitHub API erişimi sağlandığında PR başlığı: “MP.8.2: A1/B1 tanısı ve kalıcı Codex raporları”; tabanı `claude/stars-mp81-final-handoff` olmalıdır.

## Kalan sorunlar ve sonraki faz

1. **A1 açık:** yanlış ana sayfa gezinmesi yeniden üretildi. Sonraki sınırlı tanı, başarısız koşunun ilk pointer/click hedefi, gecikmiş odak kaydırması ve gezinme başlatıcısını birlikte yakalamalı. Yalnız bundan sonra test koordinatı kusuru ile ürün dokunma/geri gezinme kusuru ayrılabilir.
2. **B1 açık:** yeniden üretilemedi. Sonraki FAIL'de aynı element kimliği, DOM değişimi, üstteki öğe ve tasarım ekranının açılma zamanı birlikte kaydedilmeli.
3. **GitHub PR erişimi engelli:** API `Forbidden`. Rapor push sonucu PR erişiminden ayrı değerlendirilmelidir.
4. Event gizleme kalıcılığı bu fazın dışında kaldı. Save8'e alan eklenmedi; ayrı fazda kayıt/oyuncu kapsamlı sunum deposu seçeneği değerlendirilebilir.
5. Android ve Render doğrulanmadı. Performans/ayna değişiklikleri bu ölçümlerden önce genişletilmemeli.

Sonraki geliştirme fazı önce A1'in yanlış gezinme tetikleyicisini kanıtlamalı; timeout büyütme veya yalnız guard ekleme ile kapanış yapılmamalı.
