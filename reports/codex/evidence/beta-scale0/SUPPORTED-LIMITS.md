# Açılan seçenekler ve deneysel sınırlar

- Üretim hedefi48 AI ve1000 sistemdir; bu hedefler yalnız üretilmeleriyle kabul edilmiş sayılmadı.
- Son aday, yıldız seçimini30–500 aralığında desteklenen basamaklarda açar; seçilen değer gerçekten üretilir. Android için ayrı motor/katı100 sınırı yoktur.
- Yeni oyun için kabul edilmiş AI üst sınırı16'dır.24/32/48 hızlı seçimleri deneysel etiketiyle pasiftir;16 üzeri motor/lobi başlangıcı açık gerekçeyle reddedilir. Hiçbir sayı sessizce düşürülmez.1000 sistem de pasiftir.
- `MAX_AI_COUNT=48`, teknik kimlik/araştırma tavanıdır; `SCALE_ACCEPTANCE.maxAI=16` gerçek yeni-oyun kabul tavanıdır. Araştırma testleri bu nesneyi açıkça48 yapar; bunlar public seçenek testi olarak sunulmaz.
- Çekirdekte49 normal devlet (host+48 ilave insan/AI koltuğu) ve mevcut kimlik0–63 sınırı korunur. Tasarım lobisinin mevcut insan kapasitesi2–4'tür. Araştırmada3 insan+46AI+1wild =50 toplam/ID0–49, paket/mirror test edilir; bu,46AI uzun oyun kabulü değildir.
- Eski Save8/paket yüklemesi yeni oyun kabul filtresiyle devlet silmez. Yeni oyun doğrulaması ve kayıt devamı ayrı yollardır.
- 300/24 hedef240,181.ayda16.425ms ile durdu.500/32 kısa-orta ölçümü77.ayda ekonomik bütçeyle durduruldu,120.NOT RUN.1000/48 hedef10,10.ay15.245,7ms ile TOO SLOW. Bu ara adaylar erken atlama optimizasyonu içeriyordu; erken atlama daha sonra Save8 farkı nedeniyle geri alındı. Nihai500/16 kampanyası ayrıca çalıştırılır.
-500 sistem için120 ay doğrulaması,240 ay veya fiziksel PC/Android garantisi değildir. Yüksek hızda uzun ana iş parçacığı görevleri hâlâ risktir. Ayrı ölçekleme fazı olmadan daha yüksek AI hedefleri açılmamalı.
