# 96H.6.2 takip teşhisi — iki emrin finansmanı

Yeni AI adayı ve oyun sürümü yoktur. Üretim96h61korunur. Aynı seed11 Save217/RNG ile dört kol karşılaştırıldı: kanonik; bekle; çiftlik→dökümhane yıkımı; maden→çiftlik. Son iki sıra farklı eylem kümeleridir; yalnız aynı binaların yer değiştirmesi değildir.

Teşhis kollarında aktör7için218–224aylarında yalnız belirlenen iki koloni emrine izin verildi. Diğer strateji, filo, diplomasi, olay ve devletler kanonik motorla çalıştı.225'ten itibaren hedefin normal koloni kararları da açıldı. Bu baskılama genellenmiş AI politikası veya üretim adayı değildir; kanonik kolunda baskılama yoktur.

| Ölçüm | Kanonik | Çiftlik→yıkım | Maden→çiftlik |
|---|---:|---:|---:|
|219–224maden kritik ayı |6|3|6|
|219–224maden sıfır ayı |2|0|1|
|219–224gıda sıfır ayı |0|0|0|
|Ay224maden stoğu |16,99|55,49|16,99|
|Ay224alaşım stoğu |221,04|93,95|221,04|
|Ay240maden neti |+0,240|+6,421|+0,240|
|Ay240gıda neti |−0,367|−0,367|−7,370|
|Ay240alaşım neti |+0,699|−5,544|+1,392|
|Ay240dökümhane |1|0|1|

Çiftlik→yıkım ilk köprüde maden sıfırlanmasını önlüyor, ama bunu bir dökümhaneyi ve alaşım kapasitesini azaltarak yapıyor. Sonra normal AI225/229/233'te tekrar dökümhane yıkıyor.233'teki son yıkımda mevcut alaşım neti zaten−1,59665; hâlâ yıkım onaylanıyor. Kriz azaltma yolu gıda/tüketim kötüleşmesini ayrıca gözetiyor, alaşım kaybını ise yalnız ağırlıklı puan cezasıyla ele alıyor. Bu teşhis koşulunda son üretim kapasitesini korumaya yetmiyor.

Ay240sabit-net tanısal hesabı: A kolunda yeni dökümhane için210maden gerekir; mevcut maden94,63ve net+6,421ile yaklaşık17,97ay finansman,106gün inşa gerekir. Alaşım34,30/−5,544ile yaklaşık6,19ay dayanır. B kolunda çiftlik için110maden gerekir;75,44maden ve+0,2399netle yaklaşık144,05ay finansman gerekirken gıda24,54/−7,370ile3,33ay dayanır. Bunlar geleceği sabitleyen teşhis hesaplarıdır; doğal geleceğin kesin simülasyonu veya kaçınılmaz çöküş iddiası değildir.

Sonuç: İlk emrin peşin bedeli ve ilk altı ay stoku, bir sonraki zorunlu üreticiyi zamanında yeniden finanse etme güvencesi değildir. İki emir seçmek de tek başına yeterli değildir; köprü sonundaki üretim kapasitesi ve sonraki zorunlu yatırım birlikte denetlenmelidir. Bu bulgu yeni bir AI düzeltmesi olarak yayımlanmadı.

Kontroller: kanonik23ayın tamamında önceki eşlenmiş Save/RNG ile eşit; A tekrarı23ayın tamamında aynı Save/RNG; metrik okumaları ve fiyat sorguları saf; gerçek motorun bedel/kuyruk/hurda yolları kullanıldı; kaynak yardımı/RNG müdahalesi yok.120/240matrisleri ve fizikselAndroid NOT RUN. Ham sonuçlar, gerçek Save'ler, protokol ve sürücüler takip kanıt ZIP'indedir.
