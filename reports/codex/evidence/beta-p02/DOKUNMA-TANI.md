# BETA-P0.2 — Dokunma tanısı

## Sonuç

P01'in `KATIL` ve `#mp6Conn` 8s timeout'ları yeniden üretilemedi. **Kesin kök neden bulunmadı; ürün/test/ortam ayrımı açık. Dokunma üretim koduna tahmini düzeltme yapılmadı.** Sonraki PASS koşuları eski FAIL'leri kapatmaz.

## Kaynak ve gözlem

P01 tam MP73 özgün KATIL hatası `../beta-p01/mp73-full/tapfail-1-playwright-error.json`: görünür/etkin/sabit, scroll bitti, `performing tap action` aşamasında zaman aşımı. Bu aşama Playwright'ta ham Input gönderimi ile hit-target interceptor temizliğini kapsıyor; yalnız bu metinden hangisinin beklediği belirlenemez.

`mp6Conn` iç span'ı tanı/revizyon çizimlerinde değişiyor. KATIL lobiye geçerken kaldırılıyor. Bunlar tek başına başarısız kullanıcı işleminin kanıtı değil. Şimdiki kayıtlarda gerçek pointer/touch/click, hit-test ve başarılı sonuç görülüyor. CPU4 normalden daha yavaş, ancak hata üretmedi.

- İlk değiştirilmemiş hedefli A1/B1: `baseline.log`, **2/0**.
- Normal CPU, sekiz ilave gerçek mp6Conn dokunması: `repeat.log`, **3/0**.
- 4× CPU, dört ilave dokunma: `cpu4.log`, **3/0**.
- Tam değiştirilmemiş P01 MP73: `mp73-baseline-full.log`, **8/0**, üç insan B1–B4 dahil.
- Ham protokol ölçümleri `touch-protocol-summary.json`: normal tekrar en büyük tap896ms, CPU4 tap3750ms; CPU4 Input yanıtı2744ms. Hiç bekleyen Input yok. Bu yalnız bu başarılı koşuların verisidir.
- İzole HTML: statik ve click'te yenilenen DOM × locator/native-parallel/sequential-CDP ×12 dokunma =72 gerçek dokunma, `touch-control.log` **6/0**. Paralel `touchStart`/`touchEnd` hipotezi kanıtlanmadı; üretim testleri CDP'ye çevrilmedi.
- Playwright1.62.1 beklediği Chromium151 ile sistem Chromium155 farklı. Sürüm farkı olası etken olarak kayıtlıdır; **kök neden sayılmadı**.

## Bu fazda kanıtlanan ayrı test kusurları

1. `openCard` Konsey kartından sonra yalnız `inboxYes` veya modal `.archiveDetail` bekliyordu. Gerçek cncvote işlemi modal yerine `diploPane` açar. Çağıran iki yer timeout'u `.catch(()=>{})` ile yutuyordu. Başarı koşulu gerçek Konsey oy kontrolleri olarak düzeltildi; bu catch'ler kaldırıldı. Oy/dokunma assertion'ı azaltılmadı, timeout büyütülmedi.
2. İlk birleşik koşuda eski b2 sürüm assertion'ı yeni b3'e karşı FAIL oldu. Sabit sözleşme b3 olarak güncellendi.
3. P04 yardımcısı savaş modalını açık bırakıyordu; sonraki A2'nin gerçek butonuna modal `section.box` engel oldu. Özgün hata ve screenshot `mp73-final/tapfail-1*` / ilk birleşik kayıt altında. Yardımcı çıkışında modal temizlendi.
4. P03 fikstürü paylaşılan hızı0 yapar. Aynı akışta A2'nin zamanı ilerletme beklentisiyle birleştirilince zaman bekleme FAIL oldu. `mp73-final.log` 10/1 saklandı; temiz tam MP73, P03/P04 özel fikstürlerinden ayrı çalıştırıldı. Hız assertion'ı kaldırılmadı veya timeout artırılmadı.
5. İlk birleşik koşuda C Konsey paneli bekleme FAIL ve ardından B3 bağımlı FAIL görüldü; o anda oy/DOM dökümü yoktu, kesin nedeni **açık**. Sonraki hedefli B1–B4 `ballot-diagnosis.log` 5/0; bu PASS önceki FAIL'i silmez. Bundan sonraki MP73 hataları tüm oda sayfalarının screenshot/DOM/oy/inbox dökümlerini saklar.

Bunlar tarihsel `performing tap action` timeout'larının kök nedeni olarak sunulmaz.

## İzler

`*-events.jsonl`: Node tarafında sayfa gezinmesi, script/JS hatası, pointer/touch/click/history; `*.actions.jsonl`: orijinal Playwright name/message/stack ve önce/sonra hedef; `*.lifecycle.jsonl`: DOM kimliği/bağlılık, rect, hit, scroll/focus/ölçek/modal, relay mesaj türleri. Protokolde komut/kimlik doğrulama içerikleri kaydedilmez. MP8 persistent-context koşularında bu launch sarmalayıcısı devreye girmez; MP8 kendi sonuç/senkron/gizlilik kayıtları esas alınır.

## Yeni haber geri dönüşü — ayrı, kanıtlanmış UI kusuru

`mp73-clean-final.log` 7/1: B misafirinin Haber→Konsey geçişinde haber geri düğmesi yok. Bunun hata aşaması `waiting for locator` idi; tarihsel KATIL'ın `performing tap action` aşamasıyla aynı değildir. `ArchiveUI.returnNews.world` eski G.emps dizisine bağlıydı, misafir deserialize aynı oyunda diziyi yeniliyordu. 0/3 native önce /3/0 sonra; aynı oda+oyuncu+haber key/id kapsamına bağlandı, farklı oda/oyuncu veya yeniden kullanılan sayısal id reddedilir. Son tam gerçek MP73 8/0; bu, tarihsel dokunma timeout'unu çözmüş sayılmaz.
