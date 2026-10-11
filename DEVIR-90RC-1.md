# STARS — 90RC.1 güncel devir

Kaynak: stars-faz90rc.zip, SHA-256:
`a71982b0299ad48a5b84f85fdf7ced2089993f573b38f73352b7ede35fd9345f`.
Build `90rc-1`; cache `stars-v90rc-1`.

Bu faz cihaz kabulü değil, kayıt ön doğrulamasının sınırlı devamıdır.
90RC temel kökleri denetliyordu; içlerindeki null gemi, eksik tarih,
sayısal olmayan kaynak ve yinelenen filo kimliğini kaçırıyordu.
`validSaveEnvelope` bu girdileri dünya atamalarından önce reddeder.
Gezegen ve gemi kayıtlarının nesne olması, gemi sınıfının metin olması,
kaynakların sonlu sayı olması, oyun takvimi ve filo kimliği tekilliği denetlenir.

Yeni 19 senaryo: kaynak 3 geçen / 16 kalan; çıktı 19/0. Ret sırasında
kayıt zarfı, RNG, oyun/filo/seçim nesne kimlikleri, kamera, hız, zamanlayıcılar
ve yerel depolama korunur. Sonraki geçerli yükleme aynı oturumda çalışır.
Gerçek eski v8, kesirli gün/kaynak, boş filo ve isteğe bağlı eski alanlar
korunur. Ön kapı negatif eski stoku otomatik silmez.

Kapsam sınırı: bu, deserialize için tam transaction veya bütün iç alanların
şema doğrulaması değildir. Daha derin türetme/çizim hatasında tam geri alma
garantisi verilmez. Fiziksel Android kabulü bekliyor; yayınlama yapılmadı.

Değişen üretim: main.js (ön kapı + build), sw.js (yalnız cache adı).
Önceki devir `DEVIR-90RC.md`, bu faz raporu `FAZ90RC-1-RAPOR.txt` içindedir.
Tam regresyon sonucu `tests/results-90rc-1.json` içindedir.

Sonraki bağımsız iş: 90RC.2 kayıt yükleme sonrası kullanıcı akışı denetimi
(dosya seçimi/iptali, onay ve başarısızlık mesajları) — Sol / High.
87T cihaz kabulü kullanıcı hazır olduğunda yürütülür.

## Önceki 90RC kaydı (tarihsel)

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
