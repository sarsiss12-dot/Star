# STARS 94B — ortak otomatik keşif

Oyuncu ve AI `autoExploreTick` üzerinden aynı planlayıcıyı kullanır. Yeni bilim
gemileri tersanede başka bilim filosuna eklenmez. Elle birleştirme korunur.

## Hedef ve rota

Rezervasyon tablosu her planlama turunda yaşayan filolardan devlet bazında
üretilir. Manuel hedefler önce, otomatik hedefler kararlı filo kimliği sırasıyla
ayrılır. Tarama, kayıp, iptal, kapanmış rota ve geçersiz hedef rezervasyonu
serbest bırakır. Başka araştırmacının hedefinde otomatik tarama başlatılmaz.

Dijkstra her gemi planlamasında bir kez çalışır; her aday için ayrı yol bulma
yoktur. Hiper-yol uzunluğu / gerçek gemi hızı, bilinen kullanılabilir kapıların
0,1 mesafe maliyeti, ikmal cezası ve yakın keşif kümeleri puana girer. Bilinen
korsan yuvası, kalıntı, düşman filoları ve savaş bölgesi bütün rota boyunca
elenir. İkmal tabanının altına giden ara düğüm de elenir; uygun alternatif yol
aranır. Bulunan yol doğrudan uygulanır, hareket emrinde farklı kısa yola dönmez.

Bilinen sistemler, mevcut sensör görüşü ve bunların keşif sınırı kullanılır.
Henüz görülmeyen düşman filoları/yuvalar hedef maliyetine katılmaz. Bilinmeyen
kapı kısayolları ve çevre özellikleri okunarak avantaj sağlanmaz. Bu sebeple
bilinmeyen tehlikeye ilk karşılaşma ve kayıp tamamen engellenemez.

## Yeniden değerlendirme

Aktif rota yarım oyun gününde, yeni hareket bacağı başlamadan güvenlik ayrıca
kontrol edilir. Bekleme beş oyun gününde yeniden denenir. Daha iyi hedef için
inceleme düğümde ve en az 12 gün aralıkla yapılır; küçük puan değişikliklerinde
hedef korunur (%30 iyileşme eşiği). Aktif sıçrama geriye sarılmaz/ışınlanmaz.

Güvenli hedef yoksa otomasyon açık kalır. İkmal dışında boş bekleyecek gemi,
güvenle erişebildiği bilinen tam ikmal düğümüne döner. İkmal ve yıpranma motoru
aynıdır; kaynak, gemi, araştırma veya onarım verilmez.

`orderMove` varsayılan olarak açık manuel emirdir ve keşfi durdurur. Mevcut AI
ikmal dönüşü ve muharebe ricadı `automatic=true` kullanır; otomasyon sonraki
varışta devam eder. Başarısız güvenli ricat çatışma durumunu silemez. Bu
entegrasyon dışında muharebe ve askerî üretim kararları değiştirilmedi.

## Kayıt ve arayüz

Save v8 değişmez. İsteğe bağlı filo alanı `explore`: hedef, durum, bir sonraki
kontrol/review zamanı; ikmal dönüşünde `home`. Geçersiz kayıt alanları güvenli
beklemeye alınır; rezervasyonlar kayıttan ayrı bir tablo olarak yüklenmez.
Eksik alanlı eski AI kayıtları keşfe katılır. Manuel rotaya el konulmaz.

Mevcut filo durum satırı kullanılır: yolda, tarıyor, güvenli rota aranıyor,
korsan/düşman nedeniyle bekliyor, ikmal yetersiz ve keşif tamamlandı. Yeni
panel veya harita kontrolü eklenmedi. `map.js` ve 94A dokunmatik davranışları
byte düzeyinde korunmuştur.

## Tekrar üretim

- Hedefli: `node tests/faz94b_exploration_test.js`
- Tek vaka: `STARS_CASE='known pirate' node tests/faz94b_exploration_test.js`
- Tam regresyon: `STARS_TEST_LOGS=tests/logs-next node tests/run-all.js`
- Kampanya: `node tests/measure-exploration-94b.js ROOT 11 OUTPUT.json 120`
- Korsansız kontrol: aynı komutun sonuna `false` eklenir. Test kurulumu
  başlangıç yuvalarını/korsanları iki sürümde de siler, korsan doğumunu kapatır.
- Paket: `python3 tools/verify-release.py`

Karşılaştırmalar `KESIF-KARSILASTIRMA-94B.md`, ham devlet ölçümleri
`tests/exploration-94b/` içindedir. Eski test kanıtları korunmuştur.
