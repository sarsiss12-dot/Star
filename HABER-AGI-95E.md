# Galaktik Haber Ağı — 95E

`news.js` bağımsız veri modülü; `archive-ui.js` sunum katmanı. Mevcut savaş defteri, siyasi olaylar, sahiplik, kolonizasyon, ticaret/ambargo, konsey, kriz ve öğrenilmiş casusluk yollarına küçük bağlantılar eklendi. Mevcut oyun motorları yeniden yazılmadı.

## Veri ve görünürlük

Her kayıtta olay anahtarı, sayısal kimlik, gerçek oyun günü/yılı/ayı, kategori, başlık/açıklama, önem, okunma/sabitleme, bilgi kaynağı bulunur. Devlet/sistem/gezegen/federasyon referansları kalıcı ID ve olay anındaki adın kopyasını taşır. Koordinat kopyalanmaz. Güncel devlet adı değişse veya devlet yok olsa da tarihsel ad saklanır.

Olay üreticisi yapılandırılmış veri iletir; görünürlük `visibility`, saklama `emit`, oyuncu projeksiyonu `list/get`, sunum ArchiveUI ile ayrıdır. Oyuncuya katıldığı olaylar, bilinen aktörlerle gösterilir. Üçüncü taraf siyasi olayları için temas ve en az seviye 3 istihbarat; federasyon için ilgili üyeliklerin ayrı ayrı bilinmesi gerekir. Konumlu üçüncü taraf haberinde sistemin keşfedilmiş olması ve canlı görüş/sensör gerekir. Yalnız eski keşif yeterli değildir. Öğrenilmiş konsey/kriz duyurusu, mevcut oyuncu bildirimi/üyeliğine dayanır. Yakalanmamış düşman operasyonunun faili haberle açıklanmaz.

**Geçmiş politikası:** Olay anında bilinemeyen gizli kayıtlar sonradan temas, keşif veya istihbarat artınca otomatik açılmaz. Yeni öğrenilen siyasi durum gelecekteki olayları etkiler; eski gizli savaş/üyelik geçmişi uydurulmaz. Eski kayıt yüklenirken mevcut savaş bayraklarından yeni başlangıç haberi üretilmez. Oyunculu savaş ilanında temas kurulduğu aynı gerçek olayın anahtarıyla tek görünür kayıt oluşturulur.

Görünür ve gizli kayıtlar ayrı kapasiteye ve ayrı kimlik sayacına sahiptir. Gizli üretim görünür kartı tahliye etmez; sayaç, arama, sonuç sayısı ve okunmamış göstergesine katılmaz.

## Arayüz ve kapasite

Devlet menüsünde Haberler; +N durum listesinde okunmamış haber erişimi. Yeniden eskiye sıralama, kategori, metin arama, okunmamış/sabit filtreleri, ayrıntı ve eski kayıtlara sayfalı erişim var. DOM başlangıçta 30 kart kurar. Başlık 180, açıklama 800 karakterle sınırlıdır; tüm metinler HTML kaçışından geçer.

1.000 görünür + ayrı 256 gizli haber; en çok 20 sabit. Kapasite aşılırsa en eski sabitlenmemiş kayıt silinir. Bu bir sonsuz tarih arşivi değildir. Bütün ekranlar yalnız görünür listeyi kullanır. Devlet bağlantısı yeniden temas/yaşama durumunu; konum bağlantısı yeniden keşfi doğrular. Mevcut View.center/View.ping kullanılır; kamera motoru ve keşif verisi değiştirilmez. Tarihsel devlet kartı eski ad ve olay bilgisini korur, güncel diplomasi uygulanamaz.

Hook kapsamı: savaş başlangıcı/katılımı, barış/statüko, federasyon kuruluşu/üyelik/ayrılış/ihraç/reform/önemli hareket kararları/dağılma, ittifak kuruluşu, vasallık/özgürlük, devlet sonu ve mevcut bölünme yolları, sahiplik/kolonizasyon, ticaret/ambargo, oyuncunun öğrendiği konsey/kriz/casusluk, oyuncu inşaat görevi sonuçları. Her küçük kaynak değişimi alınmaz. Her olay kataloğu seçeneğinin ayrı haber ürettiği iddia edilmez; sıradan yasa oyları ve bazı özel senaryo doğuş yolları gelecekte kapsam genişletme adayıdır.

Modül hatası yalnız haber modülünü duraklatır, bir kez bildirilir; diğer oyun sistemleri devam eder. Yeni oyun/başarılı yükleme yeniden etkinleştirir. Hata kaydı test ve tanılama kanıtında tutulur.
