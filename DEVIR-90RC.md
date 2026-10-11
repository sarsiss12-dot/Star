# STARS — 90RC devir notları

Kaynak `stars-faz89b.zip`, SHA-256:
`ce8afbb031c3628d22c51e3329313ece141c530dffc59275108958b40bbf2cbf`.
Build `90rc`; service-worker cache `stars-v90rc`. Önceki devir
`DEVIR-89B.md`, ayrıntılı sonuç `FAZ90RC-RAPOR.txt` içinde.

90RC özellik veya denge fazı değildir. Temiz kurulum, güncel/gerçek eski v8
kayıt, art arda yükleme, yerel dağıtım dosyaları ve PWA güncellemesi denetlendi.

Üç hata kapandı:

1. Eksik PWA kabuğunda `cache.addAll` hatası yutuluyor, yeni worker eksik
   cache ile etkinleşebiliyordu. Artık kabuk tamamlanmadan `skipWaiting`
   çalışmaz; başarısız install eski çalışan sürümü korur.
2. Activate aynı origin'deki bütün yabancı cache'leri silebiliyordu. Artık
   yalnız `stars-v` önekli eski Stars cache'leri temizlenir.
3. Sözdizimi doğru fakat temel kökleri/kimlikleri bozuk kayıt, deserialize
   atamalarından sonra dünyayı yarım değiştirebiliyordu. Yeni ön kapı temel
   kayıt zarfını mutasyondan önce reddeder.

Yeni RC testi kaynak 89B üzerinde 8/7, 90RC üzerinde 15/0 verdi. Tam regresyon
44 paket / 3811 geçen / 0 kalan. Değişen üretim dosyaları yalnız `main.js` ve
`sw.js`; diğer dokuz ana üretim dosyası 89B ile byte-for-byte aynıdır.

Save v8, mevcut depolama anahtarları ve Situation karantinası aynı. Gerçek
Chrome/Android veya service-worker yükseltme testi yapılmadı. Otomatik denetimde
açık P0/P1 yok; cihaz kabulü kullanıcı hazır olduğunda tek güncel ZIP ile 87T
olarak yapılacak. Yayınlama yapılmadı.

Sıradaki çalışma: **90RC.1 / 87T cihaz kabulü — Sol, High**. Beyaz harita,
kayıt bozulması veya karmaşık motor hatası görülürse **Astra, High**.
