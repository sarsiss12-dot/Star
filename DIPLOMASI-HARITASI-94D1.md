# Faz 94D.1 — diplomasi haritası

Mevcut harita akordiyonunun bağımsız katmanlar bölümüne **Savaşlar** aç/kapat seçeneği eklendi. Yeni araç çubuğu yoktur. Siyasi, Diplomatik ve Savaş ana modları; Radar, Lojistik ve Filo sahipleri korunur.

Savaşlar açıkken diplomasi dahil mevcut zemin üzerine ince kırmızı bağlantılar çizilir. Katman ana modu, devlet renk paletini veya seçim durumunu değiştirmez. Savaş modunun mevcut husumet ağı da aynı `knownWarPairs` / `warMapConnections` verisini kullanır; iki paralel çizim/istihbarat yolu kalmaz. Eski savaş modunun bilmediğimiz devlet savaşını renkle ele verme yolu da aynı süzgece bağlandı. Diplomatik modun önceden var olan ilişki renkleri bu katmanla değişmez.

## Bilgi kuralları

- İki taraf yaşayan normal devlet olmalı, karşılıklı gerçek savaş bayrağı bulunmalı.
- Her iki kimlik oyuncuya temasla biliniyor olmalı; oyuncunun kendi savaşları bilinir.
- Üçüncü taraf savaşı için taraflardan en az birinde **SIZILMIŞ (3)** diplomatik istihbarat gerekir. Bu, mevcut diplomasi panelinin yabancı savaş planı eşiğidir. Yalnız iki temas savaş bilgisini açmaz.
- Çizgi ucu keşfedilmiş ve halen görülen, gerçekten o devlete ait bir sistem olmalı. Başkent gizliyse görünür sahipli alternatif kullanılır; alternatif yoksa çizgi çizilmez. Oyuncunun kendi sahip olduğu keşfedilmiş sistem özel durumdur.
- Gizli başkent konumu, henüz keşfedilmemiş devlet bölgesi veya görüş dışındaki güncel sahiplik değişimi bu katmandan sızmaz.

Bu politika bilinenden az gösterebilir: yabancının savaşı bilinse bile görünür konum yoksa bağlantı yoktur. Amaç yeni istihbarat sistemi kurmadan güvenli sunumdur.

## Çizim

Her devlet çifti bir kez çizilir. Oyuncunun cephesi düz 1,7 px; diğer öğrenilmiş savaşlar kesikli 1 px çizgidir. Boyut ekran pikseliyle sınırlıdır; nabız animasyonu yoktur. Ortak 2B `w2s` kullanılır, hatlar etiket/filo ve tıklama alanlarının altında kalır. Karşıt iki uç da ekran dışındayken ekranı kesen çizgi bounding box kontrolüyle kaybolmaz. Çizgiler yeni hitbox veya pointer dinleyicisi oluşturmaz.

Host native Canvas ölçümü: 100 sistem, 900×420, 40 kare, dört örnek savaş. 94D savaş modu medyan 5,97 ms / p95 11,59; 94D.1 savaş 6,52 / 10,35; 94D.1 diplomatik + katman 5,39 / 7,43 ms. Eşzamanlı regresyon yükü vardır; örnek bir host ölçümüdür, hızlanma veya Android FPS garantisi değildir. Her varyantta RNG değişmedi.
