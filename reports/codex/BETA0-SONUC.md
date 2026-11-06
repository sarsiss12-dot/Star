# STARS — BETA.0 sonuç raporu

2026-11-06. **Bir kanıtlanmış kayıt veri kaybı hatası düzeltildi. Yerel hedefli kabul PASS; genel beta yayın onayı verilmedi.** Aralıklı giriş hataları kesin çözülmüş sayılmıyor. Render bağlantısı kurulmadı.

## 1. Kaynak, HEAD ve teslim

- GitHub: `sarsiss12-dot/Star`.
- Başlangıç/PR tabanı: `codex/stars-mp89-pc-ui-stability`.
- Beklenen ve uzak daldan doğrulanan başlangıç HEAD: `74a57bc0eeac0f2b4db9106b247fe26c1d4eb865`. Sapma yok; temiz ağaçtan devam edildi.
- Geliştirme dalı: `codex/stars-beta0-stability`.
- Doğrulanmış kod teslim commit'i: TESLIM_HEAD_BEKLENIYOR. Nihai rapor commit'i kendi SHA'sını önceden içermez; bitiş HEAD sohbet tesliminde ve GitHub geçmişinde verilir.
- PR: TESLIM_PR_BEKLENIYOR. Main/merge/rebase/force-push yapılmadı.
- MP.8.9 tamamlanmış kaynak ve kanıtları korundu; yeniden kurtarma veya ağır kampanya yapılmadı. AGENTS, GPT-DEVIR, CLAUDE, son rapor, MP89 ana/açık işler/manuel planı ve başarısızlık kanıtları okundu.

## 2. Kanıtlanan P0: aynı saat iki başarılı kaydı tek satıra düşürüyordu

`MP4Save.putNow` anahtarı `kind:saveId:Date.now()` üretiyor, IndexedDB `put` kullanıyordu. Aynı saveId/kind ve aynı saat damgasıyla iki farklı geçerli paket yazıldığında ikisi de `ok:true` dönüyor, ikinci işlem ilkini sessizce eziyordu.

[Kontrol kanıtı](evidence/beta0/storage-before/same-clock.json): aynı anahtar, bir satır, `oldPreserved:false`, `newPreserved:true`. [İlk test](evidence/beta0/storage-before.log) **0/1 FAIL**. Duvar saati kontrollü sabitlendi; doğal bir kullanıcı oturumunda aynı milisaniyeye rastlandığı iddia edilmiyor. Geçerli paketler ve gerçek IndexedDB üzerinde veri kaybı kesin olarak üretildi. Bu hata, yükleme başlamadan görülen eski menü timeout'larının kökü olarak gösterilmiyor.

### Minimal düzeltme

`research/mp4/client/mp4-save.js`:

- `created` gerçek tarih olarak korunur; yerel satırlara mevcut en büyük sıra/tarih değerinden ilerleyen `order` eklenir. Sabit veya geri giden saat yeni kaydı eski kaydın önüne/üstüne yanlış yerleştirmez.
- Yazma `add` ile yapılır. Eşzamanlı sekmeler aynı anahtarı seçerse ikinci yazma açık `ConstraintError` ile reddedilir; başarılı görünen kayıt sessizce silinmez. İki eşzamanlı yazmanın ikisinin de kaydedilmesi garanti edilmiyor. Mevcut host kayıt hata bildirimi yolu korunur; otomatik gizli retry yoktur.
- Liste eski `order` içermeyen satırlar için `created` kullanır. Eski kayıt metinleri yeniden yazılmaz; DB sürümü ve Save8/MP paket şeması değişmez.
- Manuel12 sınırı ve yeni otomatik kayıt başarıyla yazıldıktan sonra son3 kaydı tutma kuralı korunur. Kota hatasında önceki kayıtlar silinmez.

[Son Chromium testi](evidence/beta0/storage-context-fixed/storage.json) **7/0 PASS**: aynı saat; eski satır uyumluluğu; geri saat/auto3 ve manuel ayrımı; eşzamanlı sekmede açık red; kota rollback; manuel12 dolu red; gerçek dokunmayla silme iptal/onay, dosya dışa/içe aktarma ve bozuk dosyada mevcut dünya/RNG'nin korunması.

## 3. Aralıklı menü/dokunma hataları: kanıt ve sınıflandırma

| Önceki bulgu | Kanıtın gösterdiği | Sınıf / kalan belirsizlik |
|---|---|---|
| MP88 R3 `#mp1Btn` | `R6-final.log`: visible/enabled/stable kontrollerinden sonra `performing tap action` aşamasında **10000 ms** TimeoutError. Önceki rapordaki8s/kararlılık yorumu doğru değil. | Etkileşim/otomasyon aşaması; DOM kayması, ürün ve Playwright/ortam ayrımı kesinleşmedi. Save8 yükleme hatası kanıtı değil. |
| MP89 960 oda oluşturma | Eski `ui-retake.log` hedefi görünür/kararlı buldu; kaydırmadan sonra eylem tamamlanmadı. `fail-14.png` içinde ODA OLUŞTUR görünür. | Ürün/test kökü AÇIK; yalnız görünürlükten sonuç çıkartılmadı. |
| MP89 3440 ölçek seçicisi | `locator.focus` seçiciyi beklerken8s timeout; hata anında yeterli DOM anlık görüntüsü yok. | Modal açılma/kurulum ön koşulu belirsiz; kesin CSS veya Scale kusuru denemez. |
| MP89 Chromium açılışı | `R-clean2.log` C için180000ms `launchPersistentContext`; uygulama sayfası açılmadan network service crash/restart kaydı. | Tarayıcı/ortam açılış katmanı. Kaynak tükenmesinin özgül nedeni kanıtlanmadı; kayıt motoruyla ilişki kurulmadı. |
| MP89 ilk `.96` animasyon ölçümü | Geçişin ilk karesi ölçülüyordu; mevcut MP89 bekleyicisi son boyutu ölçer. | Önceden düzeltilmiş test ölçümü; ürün yeniden değiştirilmedi. |

Bu dört giriş/açılış hatasının ortak tek kökü **kanıtlanmadı**. MP.8.3 A1 ve MP.8.8 B1 düzeltmeleri korunuyor. Bu fazda menü/animasyon ürün koduna tahmini düzeltme uygulanmadı.

### Sınırlı yeni deney

[ui-probe.log](evidence/beta0/ui-probe.log), [sonuç JSON](evidence/beta0/ui-probe/ui.json), aynı dizindeki PNG/olay/modal günlükleri:

| Viewport | Oturum | CPU | Menü/kurulum | Giriş/lobi/tasarım | Ölçek |
|---|---|---|---|---|---|
| 1280×720 | Masaüstü Chromium | normal | PASS | PASS |80/100/125 PASS |
| 1920×1080 | Masaüstü Chromium | normal | PASS | PASS |80/100/125 PASS |
| 2560×1440 | Masaüstü Chromium | normal | PASS | PASS |80/100/125 PASS |
| 3440×1440 | Masaüstü Chromium |4× yavaş | PASS | PASS |80/100/125 PASS |
| 800×360 | Mobil dokunmatik Chromium | normal | PASS | PASS |100, üst sınır PASS |
| 960×540 | Mobil dokunmatik Chromium |4× yavaş | PASS | PASS |100, üst sınır PASS |

Toplam **12/0 PASS**, viewport başına bir temiz kurulum; geniş tekrar kampanyası değil. Fare/dokunma, scroll/focus, DOM kimliği/ömrü, gerçek hedef/rect/elementFromPoint, pointer/touch/click, viewport, sınırlı rAF, modal ve gezinme Node tarafında kaydedildi. Orijinal Playwright hataları değiştirilmeden tutulur. [Protokol özeti](evidence/beta0/protocol-summary.json):322 Input yanıtı, en uzun ack1485ms, bekleyen Input yok. Gezinmede iki eski Runtime context yanıtı hatası var; test eylemlerinde hata oluşmadı. Bu başarılı koşu tarihsel timeout'un nedenini kanıtlamaz; hatalar AÇIK kalır. Timeout artırımı, `force:true`, sahte JS click veya hata yutma kullanılmadı.

Ölçek değişiminde tam Save8/RNG/kamera aynı, Canvas viewport'u aynı, gerçek modal X hit-test'i ve ekrana sığma doğrulandı. MP misafir80/100/125, yenileme sonrası kalıcılık ve host/diğer misafirden yalıtım R ek testinde geçti. UI Scale yeniden yazılmadı.

**Tarayıcı Ctrl± ayrı başlık:** Headless Chromium'a Ctrl+Equal/Minus/Digit0 gönderildi; innerWidth/DPR/visualViewport değişimi gözlenmedi. Gerçek tarayıcı zoom kabulü **NOT RUN / headless kısıtı**; CDP pinch/pageScale gibi farklı bir mekanizma sonuç yerine geçirilmedi. Mevcut [manuel plan](MP89-MANUEL-BETA-PLANI.md) gerçek PC kontrolünü içeriyor.

## 4. Multiplayer güvenilirliği ve #6

[#6](https://github.com/sarsiss12-dot/Star/issues/6) **KISMEN TAMAMLANDI**, kapatılmadı.

- Yeni MP73 Chromium8/0 ve MP4 core14/0: oyuncu-devlet yetkisi, ziyaretçi/uydurma/eski jetonun reddi, devamda aynı devlet, snapshot ve komut güvenliği.
- MP89 N9/0 kanıtı tekrar kullanıldı: bağlantı kopma/kurtarma, gecikmiş karar, aynı koltuğun ikinci sekmede alınmaması ve gizlilik. MP75/MP4 karar tekrar koruması mevcut.
- Yeni R gerçek host +2 misafir,5AI,seed11,orta galaksi: altı ay → IndexedDB kayıt → bütün tarayıcı/relay süreçleri kapalı → yeni süreç/oda → aynı devlet ve dolu siyasi kayıtlar → bekleyen teklifi tam bir kez kabul → altı ay daha, ayna/senkron/gizlilik **PASS**.
- Ek core denetimi: aynı odada `resumeStart` ikinci çağrısı `why:phase` ile reddedilir; tam Save8/RNG değişmez. Aynı paket iki **ayrı oda** dalında açılabilir, dünya kopyaları bağımsızdır; global saveId kilidi yoktur. Oda içindeki koltuk koruması dünya genelinde tek devam garantisi diye sunulmaz.
- Planlı host kaydı/kapanış sonrası dönüş doğrulandı. Kaydedilmemiş son ilerlemenin ani host çökmesinden sonra korunması garanti edilmiyor; relay kalıcı dünya sunucusu değildir.

| Kabul alanı | Durum |
|---|---|
| Yerel süreçler/Chromium, yetki, karar tekrar koruması, kopma ve kayıt dönüşü | PASS; aşağıdaki yeni/önceki kanıt sınırında |
| Gerçek LAN/Wi-Fi, fiziksel cihazlar arası erişim | NOT RUN |
| Canlı internet/WSS/Render, deploy/restart | NOT RUN; bağlantı denenmedi |
| Otomatik LAN keşfi, chat/emoji, host devri | Geliştirilmedi; P2, mevcut beta kapsamı değil |

## 5. Kayıt güvenliği ve #7

[#7](https://github.com/sarsiss12-dot/Star/issues/7) **KISMEN TAMAMLANDI**. Manuel/otomatik ayrımı, doğrulama/rollback, dosya aktarımı ve yeni odada kimlik dönüşü mevcut. Yukarıdaki sessiz üzerine yazma P0'ı düzeltildi. Silme onayı gerçek dokunmayla iptal ve onay olarak test edildi; mevcut MP ekranında üzerine yazma düğmesi yok, başarılı kayıt ayrı satırdır. Manuel sınırda otomatik üzerine yazma yapılmaz.

- Eski Save8 **v8** örneği ve bozuk/eksik alanlarda geri alma: sınır testi19/0 PASS. MP çekirdek kayıttan devam/aynı komutlar Save8 ve RNG karşılaştırması PASS.
- Eski yerel IDB satırının `order` alanı olmadan okunması ve metninin aynen korunması PASS.
- **Uyumluluk sınırı:** `StarsMP.validatePackage` mevcut `pkg.build === BUILD_ID` kapısını korur. Aynı oyun build'inin eski MP kayıtları yeni yerel sıra alanını gerektirmez. Buna karşılık eski96h10p5 MP sarmalı p6'da sırf Save8v8 diye otomatik kabul edilmez. `upgradeLegacy` MP.0 metaverisini destekler; bütün build'ler arası göç anlamına gelmez. Bu fazda sürüm kapısı gevşetilmedi; çapraz-build doğrulanmış dönüşüm ayrı P1 iştir.
- `mp1-host.js` silme hatasında sessiz catch içeriyor; eski kayıt silinmiyor fakat hata mesajı UX'i eksik. Veri kaybı kanıtlanmadığından bu fazda genişletilmedi.
- Tek oyunculu `yildiz:save` hâlâ tek kayıt; adlandırılmış slot/kart/tarih-devlet-galaksi/filtre/arama/güvenli göç/hızlı son oynanan kayda dönüş tam uygulanmış değil. [LOAD.0 uygulanabilir planı](LOAD0-PLAN.md) hazırlandı, uygulama **NOT RUN**.

## 6. #5–#8 açık işler

[Dört özgün issue'nun yeniden okunması](evidence/beta0/issues.json): hepsi OPEN; içerikler MP89'dakiyle aynı. Issue kapatma/yorum yapılmadı; API engeliyle vakit harcanmadı.

| Issue | Gerçek durum | Öncelik / sonraki iş |
|---|---|---|
| #5 kısa/doktrine uygun adlar | AÇIK / DOĞRULANMADI | P2 NAME.0: iki kelime, sekiz doktrin ve ayrı deterministik ad akışı; eski Save8/galaksi RNG korunmalı |
| #6 multiplayer | KISMEN TAMAMLANDI | Yerel sınırlar kanıtlı; gerçek ağ/cihaz ve host çöküşü sınırlarını kabul notunda ayır |
| #7 kayıt | KISMEN TAMAMLANDI | P0 çakışma düzeltildi; LOAD.0 SP ekranı ve açık build uyumluluk matrisi P1 |
| #8 casusluk UX | AÇIK / DOĞRULANMADI | P2 INTEL.UX.0: tek hedef/özet/kategori, mevcut opQuote ve gizlilikle mobil üç temel seçim |

[Açık işler tablosu](BETA-ACIK-ISLER.md) güncellendi. [#5 ve #8 ayrı uygulama planları](BETA0-P2-PLANLARI.md) eklendi; P2 ürün koduna dokunulmadı.

## 7. Gerçek test sonuçları

### Bu fazda çalıştırılanlar

| Test / kanıt | Sonuç | Açıklama |
|---|---|---|
| [Düzeltmesiz aynı saat](evidence/beta0/storage-before.log) | **FAIL0/1** | İlk kaydın kaybı; silinmedi |
| [İlk dar depo regresyonu](evidence/beta0/storage-after.log) | PASS4/0 | Genişletme öncesi |
| [Genişletilmiş ilk depo testi](evidence/beta0/storage-final.log) | **FAIL6/1** | `browser.newPage` bağlamına ikinci sekme açma Playwright kısıtı; test kurulumu |
| [Açık context ile son depo testi](evidence/beta0/storage-context-fixed.log) | **PASS7/0** | Ürün hatası gizlenmedi; test için explicit context kullanıldı |
| [faz90rc_1_save_boundary_test](evidence/beta0/save-boundary.log) | **PASS19/0** | Eski v8, bozuk kayıt ve dünya/RNG rollback |
| [mp4_core_test ilk](evidence/beta0/mp4-core.log) | PASS13/0 | Depo düzeltmesi sonrası |
| [mp4_core_test ek devam denetimi](evidence/beta0/mp4-resume-audit.log) | **PASS14/0** | Aynı odada çift başlatma + ayrı oda dalı sınırı |
| [MP8 R](evidence/beta0/R.log), [JSON](evidence/beta0/R/R/mp8-R.json) | **PASS6/0** | R0–R4 ve ek misafir UI; R3/R4 ikisi de PASS |
| [MP73](evidence/beta0/mp73.log) | **PASS8/0** | Yeni MP sürümü, yetki ve gizlilik |
| [Altı viewport UI](evidence/beta0/ui-probe/ui.json) | **PASS12/0** | Menü/kurulum/MP lobi, ölçek/hit-test, 3440/960 CPU4× |
| [Kaynak/manifest/mevcut ZIP](evidence/beta0/source-scope.json) | **PASS** |19 oyun +4 kritik MP dosyası tabanla aynı |
| Native Ctrl± gerçek zoom kabulü | **NOT RUN** | Tuşlar gözlenebilir zoom üretmedi; emülasyonla PASS verilmedi |
| Fiziksel Android/PC insan kabulü, gerçek LAN, canlı Render | **NOT RUN** | Yerel otomasyon gerçek cihaz testi değildir |

Komutlar [commands.json](evidence/beta0/commands.json) ve ilk seri için gerçek [çıkış kodları](evidence/beta0/exits.json) altında. Ek son komutlar [run-notes.md](evidence/beta0/run-notes.md) içinde. Eski/ilk FAIL'ler sonraki PASS ile silinmedi. Chromium testleri sırayla yürütüldü.

### MP.8.9'dan tekrar kullanılan, bu fazda yeniden çalıştırılmayanlar

| Test | Önceki kanıt | BETA.0 durumu |
|---|---|---|
| MP8 N | [9/0 PASS](evidence/mp89/N.log) | Yeni koşu NOT RUN; bağlantı/ayna/çekirdek değişmedi |
| MP74 | [7/0 PASS](evidence/mp89/mp74.log) | Yeni tam koşu NOT RUN; dar giriş deneyleri yukarıda |
| MP75 | [6/0 PASS](evidence/mp89/mp75.log) | Yeni koşu NOT RUN; diplomasi/bildirim ürün kodu aynı |
| PERF.1 | [4/0 PASS](evidence/mp89/perf1.log) | Yeni koşu NOT RUN; ekonomi dosyaları hash aynı |
| PERF.2 | [5/0 PASS](evidence/mp89/perf2.log) | Yeni koşu NOT RUN; AI/main hash aynı |
| MP86 önbellek | [Native3/0](evidence/mp89/cache.log), MP89 Chromium3 vaka | Yeni koşu NOT RUN; guest-stars ve oyun harita dosyaları aynı |
| MP89 ikinci bağımsız dolu R | MP89 raporundaki iki temiz kabul | Korundu; yeni R üçüncü yerel kabulü sağlar, eski FAIL'leri kapatmaz |

MP75 A3 ve eski B1 için yeni geniş araştırma yapılmadı; tarihsel aralıklı riskler açık. Bu fazda performans yüzdesi veya fiziksel FPS kazanımı ölçülmedi/iddia edilmedi.

## 8. Save8/RNG ve sürüm/paketleme

- Save8v8, RNG sırası, AI stratejisi, ekonomi/savaş/diplomasi, host otoritesi, misafir filtreleri, PERF.1/PERF.2 ve MP86 bulutsu önbelleği korundu.
- Depo `order` alanı yalnız IndexedDB satırındadır; Save8, MP paket/ayna ve ağ mesajlarına eklenmez. UI Scale yerel tercih olarak aynı kalır.
- Oyun **96h10p6**, PWA **stars-v96h10p6**; protokol1/paket4 aynı. MP istemci ve yerel `/mp/version` **MP.8.9b1**, MP73 gerçek tarayıcı doğrulaması PASS.
-19 runtime dosyası ve manifest tabanla bayt düzeyinde aynı. Oyun ZIP'ine MP dosyaları dahil değildir; yeni ZIP/build/PWA/oyun manifest'i üretilmedi.
- Mevcut `releases/stars-faz96h10p6.zip`:776457 bayt; SHA-256 `9f0bf5f11913c277ca23274c7a84544fd15ecee3edffd3e8ab56ca149ff814f9`; CRC32 `ee942090`. Bu fazda tekrar hesaplandı ve doğrulandı.
- Dockerfile MP4 istemci klasörünü kopyalıyor; relay allowlist `mp4-save.js` içeriyor; yeni dağıtım dosyası gerekmiyor. Docker build ve Render dağıtımı **NOT RUN**. Kaynak sürümü canlı sunucu sürümü diye sunulmadı.

## 9. Değiştirilen dosyalar

- Ürün: `research/mp4/client/mp4-save.js` minimal kayıt anahtarı/sıralama/atomik add düzeltmesi.
- MP sürüm işaretleri: `research/mp1/client/view.js`, `research/mp1/server/relay.js`.
- Test: `tests/browser-beta0-storage.cjs`, `tests/mp4_core_test.js`, `tests/browser-mp73.cjs`, `tests/browser-mp89-ui.cjs`; üç `tests/helpers/beta0-*.cjs` tanı/ölçek yardımcısı. Eski UI testi yalnız isteğe bağlı tanı/viewport/CPU kapsamıyla genişletildi.
- Raporlar: bu dosya, BETA-ACIK-ISLER, LOAD0-PLAN, BETA0-P2-PLANLARI, CODEX-SON-RAPOR, CLAUDE faz notu; `evidence/beta0/` günlük/JSON/PNG kanıtları.

## 10. Açık beta kapıları ve sonraki tek faz

| Öncelik | Kalan konu |
|---|---|
| P0 yayın güvenilirliği | Tarihsel R3/960/3440 menü girişinin kökü açık. Bu fazın kısa koşusunda oluşmadı; kalıcı ürün kusuru kanıtlanmadı ama yayın kapısı tamamen kapanmadı. |
| P0/P1 kabul | Fiziksel cihaz, gerçek LAN/online; ani host kaybında kaydedilmemiş ilerleme sınırı açıkça belgelenmeli. |
| P1 | Native Ctrl±, silme hatası bildirimi, MP çapraz-build uyumluluğu ve çoklu SP kayıt UX'i. Bildirim gizleme kalıcılığı için güvenli kayıt kimliği hâlâ ayrı açık iş. |
| P2 | #5, #8, chat/emoji/host devri; yeni AI/siyasi özellikler dondurulmuş durumda. |

**Sonraki tek ana faz önerisi: BETA.1 — aralıklı giriş hatasının hata-anı kanıtı ve kabul kapısı.** Mevcut sınırlı tanıyı gerçek başarısızlığa uygula; ürün/test/ortam ayrımı netleşmeden yeni menü düzeltmesi yapma. Gerçek cihaz/ağ kabulü mevcut manuel planla, ayrıca yetkilendirilmiş ortamda yürütülmeli; bu rapor o testleri yapılmış saymaz. Bu kapı kapandıktan sonra hazır LOAD.0 planı yeni ana geliştirme adayıdır. Yeni büyük mekanik eklenmez.
