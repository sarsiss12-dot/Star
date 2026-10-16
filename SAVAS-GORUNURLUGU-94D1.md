# Faz 94D.1 — savaş görünürlüğü

Mevcut `declareWar`, savaş kanıt defteri, `deferUI`, inbox codec'i ve `UI.setSpeed` genişletildi. Yeni haber arşivi veya savaş motoru yoktur. 94D bombardıman, çıkarma ve gezegen fetih göstergeleri korundu.

## İlan ve katılım

Oyuncunun kendi ilanı, oyuncuya saldırı, yürürlükteki federasyon savunma yasası, hükümdarın vasalını koruması, sınır bekçisi vasal çağrısı, müzakere savaş sözü ve bağımsızlık desteği aynı bildirim yoluna bağlanır. Mevcut bağımsızlık/kopya devlet olaylarının doğrudan savaş kuran yolları da işaretlenir. Kriz zaten ayrı kritik bildirim yolunu kullanır; kriz için yeni genel savaş kartı üretilmez.

Kart küçük mevcut gelen kutusunda görünür. Açılınca gerçek ilan eden/hedef adları, oyuncunun saldıran/savunan tarafı, katılım nedeni, oyun tarihi ve öğrenilmiş sefer ortakları/düşmanları gösterilir. Gizli üçüncü taraflar maskelenir. Eski modalın rakibin kesin toplam filo gücünü ve gizli sınır sayısını okuması kaldırıldı. “Diplomasi” ilgili rakibin ilişki sayfasını seçer.

Oyuncuya doğrudan savaş ilanı kimliğin öğrenilmesidir: iki taraf arasında diplomatik temas kurulur; hiçbir sistem, harita konumu, teknoloji veya istihbarat seviyesi açılmaz.

## Tekilleştirme ve kayıt

Var olan savaş defterinin sefer kökünde `playerNotified` tutulur. Aynı seferin çok sayıda otomatik savunma cephesi tek kart üretir; oyuncu asıl ilanın tarafıysa kendi asıl rolü gösterilir. Sonraki açılışta bilinen sefer katılımcıları defterden okunur. Katılımcı listesi ayrı kalıcı haber kopyası değildir.

Açık savaş kartı kapatıldığında açık-not referansı da temizlenir; bu kart Save v8 tarafından yeniden açık not olarak saklanmaz. Kapatma/kutudan düşme/yükleme uyarıyı yeniden üretmez. Barıştan sonraki gerçek yeni ilan yeni cephe/sefer kimliğiyle yeni kart oluşturur. Yüklemede eski savaş bayraklarından yeni ilan türetilmez. Yeni `warstart` payload'u yalnız sabit ID, neden ve tarih alanlarıyla Save v8 inbox'ına kaydolur. Eski `wardec` kartları ayrıntı uydurmadan okunur. İşlem geri alımında defter/bayrak/log değişimleri geri döner; UI yalnız başarılı commit'ten sonra yayımlanır.

## Duraklatma ve mobil alan

Kayıt ve Ayarlar'da “Savaşa katılınca duraklat” aç/kapat seçeneği vardır; varsayılan açıktır, tercih cihazda korunur. Yeni savaş kartı mevcut `notify`/`setSpeed` yolunu kullanır. Kapalıyken savaş kartı oyunu otomatik durdurmaz. Oyuncunun kendi isteğiyle ayrıntı modalını açması ve başka kritik olaylar mevcut duraklatma kurallarını kullanır.

Kutunun eski altı kart sınırı korunur; görünür yüksekliği en çok 144 px veya ekranın %30'u, içi kaydırılabilir ve kart dokunma hedefi en az 44 px'dir. Büyük yeni savaş penceresi otomatik açılmaz.

Gerçek kayıt gününün kesirli olabildiği doğrulandı. İlk uygulamanın tam sayı doğrulaması bunu reddediyordu; son kod kesirli günü kaybı olmadan saklar ve ekranda gün bölümünü doğru tam güne indirger.
