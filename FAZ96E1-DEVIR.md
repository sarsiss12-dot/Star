# Faz 96E.1 — geliştirici devri

Kanonik yeni kaynak stars-faz96e1.zip olmalıdır; önce SHA-256/CRC, ardından tools/verify-release.py ile bütün manifesti doğrulayın. Başlangıç 96E SHA-256: 0e08355ad5a9d310981547bd77007baf8f3239abd9bcbd0befc90445fcc7073f. GitHub başlangıç HEAD 7d53acbb570005d2f679ec351475b3d58596b2b0; yayımlanan commitin kesin değeri teslim raporu/makbuzundadır. GitHub çalışma zamanı aynılığı bütün ZIP/test arşivi aynılığı anlamına gelmez. Uzak manifestin scope alanını okuyun; tam kanonik ZIP manifesti tüm dosyaları kapsar.

main.js: normalizeNewTraits/Civics/Ethics yalnız yeni oyun içindir; assignAIIdentities köken atamasından sonra, konseyin pasifist garantisinden önce çalışır. identity96e1:seed:id özel RNG akışı kullanılır. Eski civic RNG çağrıları galaksi/başkent eşliğini korumak için ilerletilir; geçersiz eski seçimler atanmaz. “Bu eski shuffle gereksiz” diye kaldırmayın.

Save v8 sürüm numarası değişmedi. Eski civic ve trait listeleri korunur; eksik/sonlu olmayan ahl yüklemede 0 olur, yeni rastgele atama yoktur. Modifier toplarken yinelenen anahtar bir kez sayılır. Kaydın mevcut kampanyasında geçersiz listeleri otomatik yeniden seçmeyin. Kimlikler/ahl/cooldown/aiCivicAction mevcut empire nesnesinde kaydolur.

Civic kapasitesi 2; normal 1/radikal 2. Trait bütçesi net3, max5, negatif max2 ve kredi max3. Negatif krediyi traitCost üzerine ikinci kez eklemeyin. traitUseful yiyecek kullanmayanlarda yiyecek traitlerini, Arındırıcıda salt diplomasi cezasını reddeder. Tür/fizyoloji/doğal extra ve genetik ayrı katmanlardır. Gizli oyuncu stok/teknolojileri yeni kendi-profil kararına girmez; düşman tehdidi aiObservedThreat görüş filtresini kullanır.

combatIdentityMul mevcut toplu uzay ateş çıktısında rofMul/açlık/savaşta Kan Hukuku tüketicisidir; ikinci kez çarpmayın. fleetPower tahmini de aynı saldırı çarpanını görür. colonyOutput'taki eski _radikalMul yerel değişkeni gerçek üretim tüketicisi değildir; Taht/açlık empireIncome'da zaten uygulanır.

economy.js: buildingCost fiyatını UI ve ödeme birlikte kullanır. Devour gerçek sys/pl referansı ve hazır silahlı filo ister; ana/son koloni, tekrar tüketim, yabancı koloni, barıştaki yabancı alan, tehdit ve tarihsel enkaz kapıları vardır. pl.sz gerçek boyuttur. PLANETS.enkaz ölü gezegen tipidir; gezegen indeksini silmeyin, kayıt referanslarını kaydırmayın. Yeni normal kolonilerde 36 ay şok; Öğrenen Sinapslar 18 ay. Önceden kurulmuş kolonilere geriye dönük şok eklenmez. Garnizon fizyolojisi tek kez uygulanır.

ai.js: mevcut aiProfile/research/building/structure/op seçim motorlarına ağırlıklar eklendi. Mevcut nakit/ikmal/kapasite kapıları korunur. aiCivicActions aiTurn içinde gözlemden sonra çağrılır; devour için 180 günlük tekrar sınırı vardır. Yapay kaynak hibesi yoktur; mevcut zorluk ayarları ayrı ve eskisi gibidir. Normal oyunda açıkları aiUpdateStrategy recover önceler. UI gezegen tüketimi kendi mevcut sistem kartında ve silinmeye karşı onayla çalışır; yüklemeden sonra eski modal token'ı geçersizdir.

Denge JSON'ları tests/audit96e1/campaigns altında; üç seed karışık sonuç verir, seed99 ticaret/bilim gerilemesi takip edilmelidir. Bu faz bütün AI'nın daha güçlü/daha iyi olduğunu kanıtlamaz. Fiziksel Android ve insan müzik kabulü açık; gerçek Canvas testi bu ortamda geçti. Önceki FAZ96E devir metnindeki bilim otomasyonu şüphesini güncel çözülmemiş hata saymayın; kullanıcı çözüldüğünü bildirdi, regresyonu korundu.

Sonraki fazda köken derinliği/orta-geç oyun stratejileri, daha çok seed ve ticaret darboğazı analizi yapılabilir. Federasyon oy rejimi, vasallık pazarlığı/barışçıl ayrılma, yeni köken zinciri, müzik/portre sistemi ve oyun ortası civic reformu bu fazda yapılmadı. 96F başlatılmadı.
