# PERF.2 ilk FAIL ve test kontrolünün ayrıştırılması

İlk koşu 4/1 FAIL; ham fark `perf2-initial-fields/first-diff.json`, iki Save8 korunur. Üçüncü ayda kontrol AI3, sistem24/gezegen1 için liman kuyruğu açıyor ve180 mineral ödüyor. Aynı koloni iki kolda da `autoAfter:1927.5` taşırken oyun günü1890. Aday bekliyor, eski kontrol ise yeni60gün kuralını bilmiyor.

Neden: PERF.2 kontrol kökü, tarihsel hash denetimi için kullanılan bütün faz arındırmalarını eşdeğerlik çalıştırmasına da uyguluyordu. `ai.js` içindeki yeni `colonyAutoWaiting` koruması kontrol kolundan kalkıyor; `economy.js` yeni otomasyon alanını üretmeye devam ediyor. Kontrol/aday farklı özellik kurallarıyla çalışıyordu. Bu fark sonraki kararları ve RNG'yi de değiştiriyor; gizlenmedi.

Düzeltme: Yalnız eşdeğerlik için oluşturulan kontrol runtime'ında `originalStrip` ile **sadece PERF.2 A/B** çıkarılır. Yeni koloni ve diğer ürün kuralları iki kolda aynıdır. İlk testteki tam tarihsel kaynak SHA256 denetimleri hâlâ eski faz arındırmasıyla çalışır; beklenen hiçbir hash, Save8/RNG veya karar çağrısı assertion'ı gevşetilmez. Alan bazında tanı eklenmiştir. Sonuç `perf2-isolated`:5/0 PASS.

Bu fazın istenen otomasyon değişikliği nedeniyle eski ve yeni oyunun bütün gelecek kararlarının birebir aynı olması beklenmez. Performans optimizasyonu için ise aynı yeni kurallar ve aynı kayıt altında ham Save8/RNG eşdeğerliği zorunludur.
