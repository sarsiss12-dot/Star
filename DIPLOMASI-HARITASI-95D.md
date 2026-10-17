# Diplomasi haritası — 95D

Mevcut 94D yerleşimi ve 91D bağlı bölge etiketleri kullanılır. Bilinen devletin adı ve siyasi renk çubuğuna 22px amblem eklenir; z<0,12 düzeyinde amblem gizlenir. Aynı devletin birçok kopuk parçasında ekranı tekrar eden armalarla doldurmamak için her çizimde ilk yerleşebilen etikette arma bulunur; diğer parçalarda ad kalır. Uzun adlar ölçülüp üç noktayla kısaltılır. Etiketler mevcut filo/sistem/UI engel kutularıyla çakışmadan yerleştirilir; sığmayanlar atlanır. Metin ölçümleri 256 kayıtla sınırlı önbellektedir.

Adın veya amblemin gerçek çizim kutusuna dokunmak ilgili devletin ilişki ekranını açar; kendi devletinde devlet paneline gider. Rota, tersane ralli, Panoptikon ve tek filo hedef seçimi bu tıklamayla kesilmez. Yükleme/render cache temizliği eski hit kutularını da temizler.

Araçlar → harita bölümünde **Federasyonlar**, **İttifaklar**, **Savaş hatları** ayrı düğmelerdir. Altın kısa kesik federasyon bağlantısı, yeşil uzun kesik ittifak çizgisi; mevcut kırmızı savaş çizgisi korunur. Ana harita modu renkleri değiştirir; bu üç tercihi değiştirmez. Federasyonda bilinen başkan, yoksa bilinen ilk üye merkez alınır; tam üye grafiği yerine N−1 bağlantı kurulur. Amblem bağlantı ortasında yalnız yeterli yakınlaştırmada gösterilir.

Federasyon ve ittifak çizgileri z<0,10’da kapanır, uzak görünümde 12, daha yakında 36 ortak bağlantıyla sınırlıdır. Ekran dışı uçlar çizilmez. Aynı çiftte federasyon çizgisi ittifaka göre önceliklidir. İlişki projeksiyonu dünya/görüş/oyun günü ve bilinen siyasi veri anahtarıyla önbelleklenir; sahip değişimi cache’i geçersiz kılar. Yeni hareket veya AI motoru yoktur.

Kendi federasyonundaki bilinen üyelikler gösterilebilir. Yabancı federasyon bağı için ilgili üyelerde temas ve mevcut seviye 3 ilişki istihbaratı gerekir. Yabancı ittifakta iki tarafla temas ve en az bir uçta seviye 3 gerekir; kendi ittifakların doğrudan bilinir. Çizgi uçları keşfedilmiş ve yabancı için güncel görüşte olmalıdır. Bilinmeyen başkentin yerine gizli konum kullanılmaz. Savaşlar mevcut knownWarPairs/warMapConnections kapısını kullanır.

Tercihler mevcut kalıcı tercih yoluna ve Save v8’in isteğe bağlı viewPrefs alanına bağlanır. Eski kayıt bu alanı taşımıyorsa güncel tercih korunur. Başarısız yükleme görünürlükleri değiştirmez; başarılı yükleme düğmelerin aria-pressed durumunu da günceller. Gerçek Android dokunma/DOM kabulü açıktır.
