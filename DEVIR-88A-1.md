# STARS — 88A.1 devir notları

Kaynak stars-faz88a.zip, SHA-256:
`93a33bb2650223ed20dd63945a5db142630b98b1c6d98619f5878fbc40e9e1b5`.
Build 88a-1, cache stars-v88a-1. Önceki devir DEVIR-88A.md içinde.

- Filo tamamlama her kuyruk maddesinde delivery.fleet tutar. Tersanenin
  genel rally tercihini değiştirmez. Eski/hedefsiz kuyruklar genel tercihi
  kullanmaya devam eder. Save v8'in kuyruk nesneleri bu alanı korur.
- pendingFleetShips kuyruktaki ve yoldaki ikmali sayar; aynı eksik için
  yeniden ödeme yapılmaz. Yalnız kendi güncel, savaş gemili filosu tamamlanır.
- Sabotajlı veya hedefe erişemeyen tersane elenir. queueShip fiyat/süre
  için tek yol kalır. economy.js değişmedi.
- Gerçek dailyTick sevki hareketli ana filonun mv.to'suna yönelir.
  Silinmiş/yabancı hedef veya kapanmış rota gemiyi tersanede bırakır.
  Başarısız rota sevk diye ilan edilmez. Ana filo çatışmada ise beklenir.
- AI'ın mevcut normal savaş gemisi üretim kararı uygun filoya hedeflenir.
  Ek üretim turu veya toplu reinforceFleet çağrısı eklenmedi. Uygun filo
  yoksa önceki queueShip davranışı sürer. Kuyruk/yoldaki gemi hesaba katılır.
- Bilim gemisi hedefleri gerçek yol ve ara durak ikmalinden geçer.
  Kendi sistemindeki tarama başlayabilir; AI süren taramayı başa sarmaz.
- Vasal kapı hakkı yalnız iki kullanılabilir kapı arasındaki kenarı açar;
  sıradan vasal sınırı bundan genel geçiş hakkı kazanmaz.

Doğrulama: 40 paket, 3781 geçen / 0 kalan. Yeni paket 30 senaryodur.
Native Skia Canvas testleri geçti; Chrome/Android testi değildir.
Üç hazırlıklı AI üretim fırsatında önce/sonra tek korvet, 32 alaşım ve
aynı RNG ölçüldü; yeni kuyruklar hedefli. Tam kampanya dengesi kanıtlanmadı.

Değişen üretim dosyaları main.js, ai.js ve yalnız cache adıyla sw.js.
Kalan 8 üretim dosyası byte-for-byte aynı. Kayıt sürümü v8, depolama
anahtarları, harita/portre, transaction ve Situation karantinası korundu.

Sıradaki faz: 88B — savaş geri bildirimi. Sol High; somut motor kusuru
çıkarsa Astra High. Muharebe/ikmal motor sonucu ile oyuncu bildirimini
karşılaştır; gizli bilgi sızdırma, katsayıları keyfî değiştirme. Sonraki
89A iç siyaset/hafıza, 89B günlük kampanya, 90RC bütünleşik aday.
Kullanıcı cihaz testlerine ara verdi; liste birikir. Yayınlama yok.
