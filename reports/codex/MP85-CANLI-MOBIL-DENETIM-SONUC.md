# STARS MP.8.5 — Canlı Render ve mobil Chromium denetimi

## Kaynak ve teslim kapsamı

Başlangıç HEAD **`3a2a82a20271e6b8141dc965fb08b329bbfb1921`**, GitHub'dan fetch edilen `codex/stars-mp84-notice-persistence` ile eşleşti. Başlangıç çalışma ağacı temizdi. Yeni dal `codex/stars-mp85-live-mobile-audit`, PR tabanı `codex/stars-mp84-notice-persistence`. `main`, merge/rebase/force-push kullanılmadı. Doğrulanmış bitiş referansı (ilk test/rapor teslim commit’i) `869f5ebeb169fa02bab4d85588e1b41ddc32d4d1`; nihai rapor SHA'sı sohbet teslimindedir.

`AGENTS.md`, `GPT-DEVIR.md`, `CLAUDE.md`, son rapor/MP.8.4 kanıtları, `MULTIPLAYER-MP8-SONUC.md`, Android rehberi ve dağıtım dizini incelendi. Önceki testler tarihsel bağlam olarak kullanıldı; uzun dayanıklılık kampanyaları yeniden yapılmadı. Bu fazın yeni bağlantı/hız koşuları ve ölçümleri aşağıdadır.

## Canlı Render — BLOCKED, servis sağlığı bilinmiyor

Hedef `https://stars-zhdu.onrender.com`. Mevcut HTTPS proxy ve TLS doğrulamasıyla `/healthz` ve `/mp/version` sorgulandı. İkisi de **`Tunnel connection failed: 403 Forbidden`** verdi. Güncel ortam politikası restricted; özel izinli alan listesi boş, paket yöneticisi preset'i Render alanını kapsamıyor. Bu sonuç, Render'dan alınan HTTP 403 veya servis arızası değildir; hedefe HTTPS tüneli kurulamadı.

Kanıt: [live-access.json](evidence/mp85/live-access.json). Gereken dış önkoşul: desteklenen bulut ortamı ağ ayarlarında yalnız `stars-zhdu.onrender.com` erişimi. Ağ/kimlik güvenlik sınırları aşılmadı, proxy/TLS kapatılmadı. Render deploy/restart/ayar değişikliği yapılmadı; canlı kullanıcı odalarına dokunulmadı.

`research/mp1/deploy/smoke.js` incelendi: sağlık/sürüm/dosya hash'leri, HSTS/CSP, WSS geçici oda, çift yönlü aktarım, yetki/Origin reddi ve oda kapatma denetimleri var. Canlı servis erişimi zaten engelliyken tam smoke çalıştırılmadı. Raw WSS istemcisinin kullanılabilir egress/proxy yolu da ayrıca doğrulanmalıdır; yerel smoke canlı kabul yerine geçmez.

| Canlı kontrol | Durum |
|---|---|
| `/healthz`, `/mp/version` | BLOCKED — iki tünel denemesi engellendi |
| Gerçek HTTPS/WSS handshake, sürüm/dosya eşleşmesi | NOT RUN / BLOCKED |
| Canlı host/misafir oda, oyun, komut, yeniden bağlantı | NOT RUN / BLOCKED |
| Render hata kayıtları | NOT RUN — dashboard/log erişimi kullanılmadı |
| Render dağıtımı/restart/yapılandırması | YAPILMADI |

Yerel beklenen kimlik **MP.8 / 96h10p5**, runtime 19 dosya SHA-256 kontrolü eşleşti. Sekiz MP dosyasının 12 haneli beklenen hash'leri [local-reference.json](evidence/mp85/local-reference.json) içinde. Sunucu kimliği alınamadığından uyumluluk doğrulandı denemez.

## MOBİL CHROMIUM TESTİ — gerçek Android değildir

Node **24.22.1**, Chromium **155.0.8059.79**, Playwright **1.62.1**. Yerel üretim relay'i + localhost TLS/TCP test hatları; her oyuncu ayrı Chromium/kalıcı profil. Yatay 844×390, 800×360, 915×412 ve hız alt kümesinde 960×540 gibi görünümler; gerçek Playwright/CDP dokunmaları. Yerel test sertifikası yalnız testin mevcut SPKI güven yoluyla kullanıldı; canlı sertifika doğrulaması devre dışı bırakılmadı.

| Yeni koşu | PASS/FAIL | Çıkış | Kapsam |
|---|---|---|---|
| MP.7.4 + MP.8.3 giriş tanısı | **7/0** | 0 | Host+1 ve host+2, 600 ms giriş gecikmesi, hızlı çift/üç KATIL, kapasite, A1/A4/A5/B1, karttan kabul/ret/karşı teklif |
| MP.8 N | **9/0** | 0 | Host+2, seed22/orta/5 AI; kopma, kayıp karar, ikinci sekme, ayna/gizlilik |
| MP.8 R, `MP8_MONTHS=6` | **5/0** | 0 | Host+2, seed11/orta/5 AI; 6 ay + kayıt/yeni süreç/yeni oda + 6 ay |
| MP.6.1 `MP61_UNTIL=3` | **3/0** | 0 | Kurulum + iki ortak hız senaryosu, misafir/host gerçek hız düğmeleri ve spam kapısı |
| MP.6.3 `MP63_ONLY=kurulum\|^A\|sayfa` | **9/0** | 0 | Karar/manual/arka plan nedenleri, kayıt/hız/toparlanma; B/C/D siyasi testleri seçilmedi |

`MP61_UNTIL=3` sonrasındaki testler NOT RUN; MP.6.3 filtre dışı B/C/D NOT RUN. Kaynak R1 başlığındaki “60 ay” sabittir; bu fazda 60 aylık kampanya çalıştırıldığı anlamına gelmez.

Arka plan testindeki `setHidden` helper'ı document.hidden/visibilityState ve visibilitychange girdisini **sentetik** üretir. Duraklama işleyicisi sınanmıştır; gerçek Android OS arka planı, sekme öldürmesi, bellek/pil davranışı sınanmamıştır.

### Senkron, karar ve kayıt gözlemleri

İlk N/R koşuları yapılandırmada belirtilen seed değerlerini etiketledi; gerçek seed kaydı yoktu. Aynı CFG ezme sırası MP.8 düzeneğinde de bulundu. `tests/browser-mp8.cjs` CFG aktarımı ve gerçek seed/boyut doğrulamasıyla minimal olarak düzeltildi; yalnız N ve kısa R yeniden sınandı (sonuçlar aşağıdaki teslim ekinde). İlk N/R PASS'leri davranış kanıtı olarak saklanır; doğrulanmış seed22/11 koşusu olarak kullanılmaz.

- N senaryosunda misafirlerin aktör eşlemesi korundu; host son aynasıyla rev/kanonik özet eşitliği ve gizli alan taramaları geçti. Misafir simülasyon yürütmedi.
- Komuttan hemen sonra kopma: host komutu **1 kez** uyguladı, yanıt kayboldu; eşitleme sonucu gösterdi. Bütün olası ağ koşullarında hiçbir komutun kaybolmayacağı garantisi verilmez: düzenek “bir kez veya hiç” semantiğini sınar.
- Bekleyen teklif kopmada kaybolmadı. Sessiz ölü sokete giden karar host'a ulaşmadı; bağlantı dönünce gerçek Gelen Kutusu yolundan tekrar karar verildi ve çift kabul reddedildi. Host onayı olmadan nihai kabul gösterilmedi.
- Host kopunca zaman durdu; misafir komutu `host-yok` ile reddedildi. Relay restart yerelde sınandı: oda bellekten kayboldu, açık hata gösterildi, host dünya/RNG değişmedi. **Canlı Render restart yapılmadı.**
- R koşusunda saveId/insan kimliği, gün/RNG, teklifler ve ortak hız yeni odada korundu. Bekleyen teklif gerçekten oluşturuldu ve ikinci kabul `rules:closed` oldu. Bu kısa kayıtta savaş/federasyon/konsey durumları boşsa aktif siyasi senaryo kabulü çıkarılmaz.
- MP.7.4 A1/A4/A5/B1 geçti. Tarihsel B1 yeniden üretilemedi; **kesin kapanmış değildir**. MP.8.3 güncel koordinat helper'ı korundu. Gizleme kalıcılığı bu fazda uygulanmadı.

### İlk N koşusunun toparlanma ölçümü — tek örnekler

Seed doğrulama öncesi ilk N koşusunda N1: 5 s zorunlu kesinti dahil **6404 ms**, yani hat açıldıktan sonra yaklaşık **1404 ms** içinde online/lobi koşulu döndü. N2: 30 s kesinti dahil **37134 ms**, ek bekleme yaklaşık **7134 ms**. Bunlar `cut()` zamanlayıcısının tek örnekleridir; median/p95 dağılımı yoktur. Tam ayna eşitliği ayrıca SYNC denetiminde doğrulandı. Host kopmasında gün farkı 0 ve komut reddi kanıtlandı; host için ayrı toparlanma p95 ölçülmedi.

## Performans ölçümü ve kanıtlanan test kusurları

Yeni performans sistemi yazılmadı; `tests/browser-mp75-perf.cjs` genişletildi:

- `MP75_CPU=1|4` ile host + misafir CDP CPU yavaşlatması **ölçüm penceresinde**; kurulum ve hızlı ilerletme 1×. Kaynak artırımı veya timeout büyütme yok.
- Misafir deserialize ve UI.refresh ayrı kapsayıcı süreleri; build, longtask, rAF aralıkları, açık panelin baştan yazılması.
- Node tarafında WebSocket gönderme/alma **payload** UTF-8 byte sayısı, mesaj sayısı/sıklığı. İçerik/token saklanmaz; TLS/header overhead ve gerçek mobil modem trafiği değildir.
- Hedef aya ulaşma, en az pencere kadar monthTick örneği ve gerçek dünya seed'inin istenen seed'e eşitliği kontrol edilir.

İlk denemeler önemli iki test kusuru gösterdi:

1. Eski düzeneğin `host.configure(seed=404)` çağrısı, host tasarımı kaydedilirken `applyHostSetup()` tarafından **CFG'deki rastgele seed ile eziliyordu**. İlk 1× koşusunda gerçek seed **1512127268**, ilk 4× koşusunda **1273085133** idi. Bu sonuçlar seed404 kontrollü karşılaştırması değildir.
2. Oyun önceden bittiyse `drive()` erken dönüyor; eski akış hedef aydan önce, **0 monthTick** ile de PASS yazabiliyordu. Yeni doğrulama ilk 1× koşusunu hedef120/gerçek117/n=0 durumunda **FAIL 0/1, çıkış1** yaptı. Bu sıfır örnekler performans tablosuna alınmadı.

İlk rastgele-seed 4× koşusu **PASS 1/0, çıkış0**, fakat istenen seed'i kullanmadığı için kontrollü CPU karşılaştırmasından dışlandı. İki ilk koşunun JSON/log'ları saklandı. Yanlış seed ve sıfır örnek ürün kusuru değil, ölçüm fikstürü kusurudur.

Minimal düzeltme: istenen size/aiCount/seed önce CFG'ye de aktarılır; tasarım kapanışından sonra gerçek seed doğrulanır. Eski kopya giriş yardımcısı MP.8.3 `joinBurst` helper'ını kullanır. Ürün koduna veya oyun sonu koşuluna müdahale edilmedi.

### Ölçüm yöntemi ve sınırları

Seed404, orta galaksi, 5 AI + 2 insan, 45 sistem; diplomasi paneli açık. 120 ve 240. aya kadar mevcut host hızlı ilerletme yolu, ardından 3 oyun aylık gerçek döngü penceresi kullanılır. Kontrol noktası dosyaları depoda bulunamadı: mevcut fixture'ların en yakınları 111 ve 228. aydı. Bu yüzden tüm uzun dayanıklılık kampanyasını tekrarlamak yerine yalnız ölçüm için mevcut hızlı ilerletme kullanıldı.

Mevcut headless konteynerde 5 görünür CPU ve yaklaşık 33 GiB bellek görüldü; kaynaklar artırılmadı. CDP 4×, host/misafir sayfalarına uygulanır, relay Node sürecine uygulanmaz. Aynı ayarlı ayrı 1×/4× oturumlar karşılaştırılır; birebir aynı Save8 kontrol/aday deneyi değildir. Pencere sonunda 1,5 s duraklatılmış bekleme ve sürücünün 3 s yoklama aralığı da UI/mesaj örneklemesine dahildir. `rafFps`, rAF callback sıklığı tahminidir; compositor/GPU ekran FPS'i veya gerçek Android dokunma gecikmesi değildir. Chromium `--disable-gpu` ile çalışır. Ay adımı örneği n=3 olduğunda p95 en büyük örnektir; güçlü istatistiksel regresyon iddiası yapılmaz.

### Doğrulanmış seed404 ölçümleri

Düzeltilmiş performans düzeneği **1×: PASS 1/0**, **4×: PASS 1/0**, çıkışlar 0. Her iki hedef ay gerçek dünyada görüldü; seed404, 45 sistem, 7 devlet/7 canlı ve 2 insan doğrulandı. Tam median/p95/max, örnek sayıları, longtask ve iki yönlü WebSocket payload tablosu: [PERFORMANS-TABLOSU.md](evidence/mp85/PERFORMANS-TABLOSU.md); ham veri [perf-rows.json](evidence/mp85/perf-rows.json).

| CPU | Ay | Host monthTick med/p95 ms | Guest deserialize med/p95 ms | Guest refresh med/p95 ms | Guest rAF med/p95 ms | rAF/s tahmini |
|---|---|---|---|---|---|---|
| 1× | 120 | 61,5/70,5 | 12/13,8 | 2,5/4,1 | 16,7/16,8 | 57,5 |
| 1× | 240 | 105,9/165,1 | 9/15,8 | 2,2/10,4 | 16,7/16,8 | 58,8 |
| 4× | 120 | 349,4/359,3 | 39,1/56,2 | 10,7/31,8 | 66,6/116,7 | 14,7 |
| 4× | 240 | 590,9/687,1 | 48,5/56,6 | 11,1/36,2 | 66,7/183,3 | 11,9 |

**Darboğaz ve sınır:** 4×'te aylık host işi 349–591 ms medyanıyla belirgin duraklama kaynağı; misafir tam deserialize 39–49 ms medyanıyla sık güncellemede bütçeyi tüketiyor. Guest longtask sayısı 120. ayda 887, 240. ayda 269; p95 süreleri 85 ve 102 ms. Aynı pencerelerde build sayısı 44 ve 23 olduğundan uzun görevleri yalnız deserialize'a atfetmek doğru olmaz: düzenli çizim/ana döngü yolu da ayrıca profillenmeli. Bu bir stack/CPU profili değildir; tek bir alt fonksiyon kesin kök neden ilan edilmedi. Açık diplomasi paneli baştan yazımı dört pencerede de 0. Ancak mevcut drive() kapalı paneli otomatik yeniden açar; ayrı kapanma/yeniden açma sayacı yoktur. Bu yüzden paneRewrites=0, arayüzün hiç kapanmadığının kanıtı olarak kullanılmaz. Deserialize/build/refresh süreleri kapsayıcıdır ve çakışabilir; toplam maliyet diye toplanmaz.

1×→4× arasında host monthTick medyanı yaklaşık 5,6 kat, guest deserialize 3,3–5,4 kat büyüdü. Bu ayrı gerçek-zaman koşularının kaba CPU duyarlılığıdır; aynı Save8 üzerinde sürüm regresyonu kanıtı değildir. Hız4 istenir ama ürünün karar/duraklama üst sınırları korunur; duvar saati pencereleri 10,86–60,61 s arasında farklıdır.

**Önceki sürümler:** `MULTIPLAYER-MP8-SONUC.md` tarihsel B240 satırı 1× için 133/198 ms, 4× için 789 ms (2 örnek) bildiriyor; bu fazdaki 105,9/165,1 ve 590,9/687,1 ile doğrudan iyileşme yüzdesi çıkarılamaz. Nominal dünya boyutu/AI, örnekleme, Node/Chromium ve makine farklı; ayrıca eski tasarım/CFG akışı seed/size etiketini bozabiliyor. Aynı düzeneği kullanan tarihsel Chromium sonuçlarının gerçek seed/boyutu yeniden doğrulanmalı. Sabit Save8 kontrol–aday kullanan Node PERF.1/PERF.2 kanıtları bu **lobi fikstürü** kusurundan etkilenmez; algoritmaları değiştirilmedi.

**Yeni ürün kusuru kanıtlanmadı.** Düşük CPU benzetiminde 12–15 rAF/s ciddi kullanım sınırıdır, fakat fiziksel telefon FPS'i veya önceki sürüme göre kanıtlanmış yeni regresyon değildir. Bu yüzden geniş ayna/deserialize optimizasyonu ya da AI değişikliği yapılmadı.

## Değişiklikler / Save8-RNG / yayın

Yalnız performans **test** düzeneği ve rapor/kanıtlar değişti. Oyun/MP istemci/server, AI/ekonomi/savaş/diplomasi/galaksi kuralları, `AGENTS.md`, PERF.1/PERF.2 algoritmaları değişmedi. Ölçüm wrapper'ları zaman ölçer; RNG tüketimi veya yeni komut kuralı eklemez. R kontrolünde kayıt sırasında Save8/RNG korunması geçti; bu fazda yeni genel PERF.1/PERF.2 eşdeğerlik kampanyası çalıştırılmadı.

Build/PWA **96h10p5 / stars-v96h10p5**, MP **MP.8** korunur. 19 runtime dosyasının manifest SHA-256 kontrolü eşleşti. Yeni ZIP/manifest/SHA-256/CRC32 yayını gerekmedi ve üretilmedi. Docker/allowlist/Render ayarları değiştirilmedi. Docker imajı Node22 tabanlı; bu ölçümler Node24 bulut ortamındadır.

## Fiziksel cihaz / açık riskler / sonraki faz

**Gerçek Android: NOT RUN.** [İki telefonla test planı](MP85-ANDROID-TEST-PLANI.md) üç kısa oturumdur; terminal/devtools veya dağıtım gerektirmez. Eski rehberdeki redeploy adımları bu plana taşınmadı.

Açık riskler: canlı Render/WSS/dosya uyumu ve gerçek gecikme bilinmiyor; telefon OS/pil/arka plan davranışı ölçülmedi; B1 açık; bildirim kalıcılığı uygulanmadı; ücretsiz relay servisinde oda belleği kalıcı değil. Yerel senkron taramaları tüm olası gizlilik açıklarının kanıtı değildir.

MP.8.6: desteklenen egress izniyle canlı health/version ve mevcut smoke'u yeni geçici odada çalıştır; API/log erişimi varsa sadece ilgili hata kayıtlarını incele. Telefon planının kanıtlarını al; sonra gerekiyorsa daha uzun p95/rAF/dokunma örneklemi ve en ağır profil için kapsayıcı fonksiyon profili çıkar. Ölçüm olmadan geniş deserialize/ayna yeniden yazımı yapma.

MP.9 öncesi: gerçek cihaz/servis sürüm uyumu, kopma sonrası kayıt kurtarma, kapasite/güvenlik smoke, kısa kullanıcı rehberi ve açık B1/kalıcılık kararları tamamlanmalı. main birleştirmesi veya dağıtım bu fazın işi değildir.


## Son düzeltme regresyonu ve komutlar

- Düzeltilmiş MP.8 N: **9/0 PASS**, çıkış0; gerçek dünya `{'seed': 22, 'size': 'orta', 'systems': 45, 'states': 8}`.
- Düzeltilmiş MP.8 R (6+6 ay): **5/0 PASS**, çıkış0; gerçek dünya `{'seed': 11, 'size': 'orta', 'systems': 45, 'states': 8}`. Bekleyen teklif sonucu `ok`, ikinci kabul `rules:closed`.
- Son N tek-örnek toparlanması: 5 s kesinti dahil **6397 ms**; 30 s kesinti dahil **37048 ms**. Online koşuluna dönüş sonrası ayna eşitliği ayrıca geçti. Tek örnekten medyan/p95 çıkarılmaz.
- İlk rastgele-seed koşular ve başarısız sıfır-örnek ölçümü kanıtlardan çıkarılmadı. İlk MP.8 N/R davranış sonuçları da korunuyor; tekrarlar yeni seed fikstürü düzeltmesini doğrulamak için yapıldı.

Değişen dosyalar: `tests/browser-mp75-perf.cjs` (ölçüm kancaları, CPU seçimi, CFG/seed ve pencere doğrulaması, mevcut joinBurst reuse), `tests/browser-mp8.cjs` (aynı CFG/gerçek dünya doğrulaması), iki MP85 raporu, kanıtlar ve `CODEX-SON-RAPOR.md`. Ürün dosyası yok.

```sh
# Tümü depo kökünde, Chromium=/usr/bin/chromium, ayrı STARS_OUTPUT dizinleriyle ve sırayla:
STARS_TRACE=/tmp/star-mp85/mp74-input.jsonl node --require ./tests/helpers/mp83-input-trace.cjs tests/browser-mp74.cjs
MP8_SCEN=N node tests/browser-mp8.cjs
MP8_SCEN=R MP8_MONTHS=6 node tests/browser-mp8.cjs
MP61_UNTIL=3 node tests/browser-mp61.cjs
MP63_ONLY='kurulum|^A|sayfa' node tests/browser-mp63.cjs
# MP75_CPU=1 ve sonra MP75_CPU=4 için:
MP75_SEED=404 MP75_SIZE=orta MP75_AI=5 MP75_MONTHS=120,240 MP75_WINDOW=3 MP75_CPU=4 node tests/browser-mp75-perf.cjs
```

Chromium ortam değişkeni her komutta `STARS_CHROMIUM_PATH=/usr/bin/chromium` idi. `node --check` ve `git diff --check` geçti. Ürün değişmediğinden tam regresyon, yeni ZIP/Docker build, PERF.1/PERF.2 algoritma kampanyası yapılmadı. Canlı smoke ve Android NOT RUN/BLOCKED durumları değişmedi.

## GitHub teslim kaydı

Rapor, Android planı, test fikstürü düzeltmeleri ve kanıtlar `869f5ebeb169fa02bab4d85588e1b41ddc32d4d1` commit’iyle GitHub’a push edildi; `git ls-remote` uzak dalda aynı SHA’yı doğruladı. PR oluşturma denemesi GraphQL isteğinde **Forbidden** döndü. Güvenlik/ağ sınırları değiştirilmedi ve PR oluşturulmuş gibi gösterilmedi. Bu teslim kaydı aynı dala ek rapor commit’iyle gönderilir; nihai SHA son yanıtta verilir.

- Rapor: https://github.com/sarsiss12-dot/Star/blob/codex/stars-mp85-live-mobile-audit/reports/codex/MP85-CANLI-MOBIL-DENETIM-SONUC.md
- PR tabanı: `codex/stars-mp84-notice-persistence`.
- Doğru karşılaştırma/PR oluşturma ekranı (oluşturulmuş PR değildir): https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp84-notice-persistence...codex/stars-mp85-live-mobile-audit?expand=1
