# Faz 95A — bilgi sınırları

## Karar girdisi ile kesin motor sonucu

AI’nın karar tahmini, motorun kesin savaş/üretim/antlaşma geçerlilik hesabından ayrılır. `explorationContext` içindeki aynı sensör görünürlüğü ortak `aiView` tarafından kullanılır. Kendi filo, gelir ve stoklarını bilmek serbesttir; yabancı gerçek toplamı düşük istihbaratta doğrudan okumak serbest değildir. Kanonik erişim/maliyet/tamamlanma kontrolünün gerçek veriyi kullanması oyuncu ile aynı kurala tabidir.

| Veri | Karar erişimi |
|---|---|
| Yerel yabancı filo | Ortak sensör görünürlüğünde |
| Sistem sahibi/savunma/koloni sayısı | Görülen sistemden tarihli gözlem; sonra son bilinen kayıt |
| Yabancı toplam güç | Görülen kuvvet, son gözlem ve bilinen ayak izinden belirsiz tahmin; seviye 3 veya süren filo planıyla kesin değerlendirme |
| Yabancı teknoloji kimliği | Seviye 2 veya açıkça sunulan teknoloji maddesi |
| Yabancı stok | Seviye 3 veya açık teklifin söylediği miktar; teklifin söylemediği kalan stok çıkarılmaz |
| Üçüncü taraf savaşı | İki temas ve taraflardan birinde seviye 3; kendi savaşları her zaman bilinir |
| Askerî/geçit rota geometrisi | Öğrenilmiş düğümler, görülen/kendi bilinen kapılar; gerçek geçiş kapısı ayrıca doğrulanır |
| Haminin bilinmeyen motor/kapı yükseltmesi | Yardım ETA’sına gizlice eklenmez |
| Üçüncü taraf siyasi ilişki, dosya veya ağır operasyon hedefi | Siyasi filtre ve gerekli derin istihbarat |

`aiIntel.systems` gözlem günü içerir; kesirli simülasyon günleri geçerlidir. En fazla 3600 günlük sistem anısı kullanılır. Son görülen güç 720 günlük pencerede tahmine katkı sağlar. Gözlenmeyen uzak değişiklik kayıt üzerinden kendiliğinden öğrenilmez. Yanıltma mevcut `fakeTo` süresince tahmini etkiler; süren çalınmış filo planı yanıltmayı aşar. Hiçbir bilgi yardımcısı oyun RNG’sini tüketmez.

## Kanıt

94D.1 gizli filo mutasyonu: savaş oranı 0,367847→0,005842; görünmeyen yerde tehdit 105→23109. 95A’da aynı mutasyon oranı ve tehdidi değiştirmez. Görüşteki kuvvet ve seviye 3 istihbarat ise değerlendirmeyi değiştirebilir. Son kaynak paketinde ayrıca gizli yabancı kapı ve motor yükseltmesinin hami ETA’sına sızmaması testlidir.

Diğer hedefli kontroller: gizli sahiplik değişimi, gözlenmiş gücün hatırlanması, bilinmeyen stok/teknoloji, açık teklif, üçüncü taraf savaşı, bilinmeyen ara rota, kapalı askerî sınır, korsan ara düğümü, değişmeden kalan RNG. `tests/faz95a_strategic_ai_test.js` ve ham loglar esas alınır.

## Ölçümün pratik sınırı

Kampanyadaki düşük istihbaratlı yabancı `totalPower` sayacı yalnız sarılan AI giriş noktalarını ölçer. Sıfır değeri bütün eski kodun biçimsel güvenlik kanıtı değildir. Standart stratejik yollar, müzakere, tehdit, kuvvet koordinasyonu, casus seçimi ve hami seçimi bu fazın hedefidir. Kriz/isyancı koalisyonu, hegemonya, federasyon oylama ağırlığı ve kesin siyasi sonuç denklemleri tamamen yeniden yazılmadı; olağandışı geç oyun bilgi sınırları ayrı takip denetimi gerektirir. Bu sınırlama ücretsiz kaynak veya gizli filo avantajı eklemeyi meşrulaştırmaz.

Save v8, mevcut temas/sensör/istihbarat sistemi ve gerçek motor kuralları korunur. Yeni keşif veya rakip teknoloji içeriği eklenmedi.

99’da kalan standart sorgunun trace’i gerçek `borderPressure/influenceAt/claimOf` hâkimiyet hesabına gider; ayrıntı karşılaştırma raporunda ve ham trace dosyasında. Bu nedenle sayaç tek başına ihlal adedi diye sunulmaz.
