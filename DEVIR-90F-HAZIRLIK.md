# STARS — 90F hazırlık güncel devir

Oyun tabanı **90RC.3**; üretim dosyaları 11/11 aynıdır. Build/cache bilinçli
olarak değişmedi. Kaynak ZIP SHA-256:
`0b2f6c03ecf6c701d151782deb01d0ef53cd3132743dedd0e38ab74434260515`.

Bu teslim sürüm kimliği, bütünlük manifesti, açık riskler ve ileri planı
tamamlar. `90F-OKU.md`, `ACIK-RISKLER.md`, `ILERI-GELISTIRME-PLANI.md`
güncel giriş noktalarıdır. `python3 tools/verify-release.py` bütünlük kontrolü
yapar. 47 paket / 3892 geçen sonucu 90RC.3'ten devralınmıştır; bu fazda oyun
regresyonu yeniden çalıştırılmış gibi gösterilmez.

**Sıradaki geliştirme 91A — özel operasyonların sunum hatası sınırı; Astra / High.**
Önce UI.eventArt hatasının gerçek üretim sonucu ve çağıran akış üzerindeki
etkisi yeniden üretilir; sonra dar kapsamlı düzeltme yapılır. Eski aday ayrı
kalır. Cihaz testine ara verilmiştir; kullanıcıdan şimdi test istenmez.
87T ile 90F nihai kabul açık, yayın yapılmadı. Yalnız 90F hazırlığı tamamlandı.

## 90RC.3 tarihsel devir (aşağıdaki sonraki faz notları tarihseldir)

Kaynak: stars-faz90rc-2.zip, SHA-256:
`98526b8f7a5dcfefbddcfbf7fc4ca343ce312d07e9ac89d1ee763c55fb3da800`.
Build `90rc-3`; cache `stars-v90rc-3`. Önceki devir `DEVIR-90RC-2.md`.

Deserialize artık uygulama öncesi özgün G nesne grafiğini ve RNG'yi saklar.
Göç, dünya kurma, türetilmiş durum veya ekonomi adımında hata olursa eski
nesneleri kimlikleriyle geri alıp false döner. Ön kontrolü geçen beş gerçek
bozuk kayıt ve dokuz üretim fonksiyonunun çalıştıktan sonra hata vermesi
sınandı. View/DOM/aktif pointer ve UI seçimi commit öncesinde değiştirilmez.

Başarıda seçimler yeni nesnelere bağlanır, jest ve önbellekler temizlenir.
Sunum hatası başarılı dünya yüklemesini başarısızmış gibi göstermez;
tanıya yazılır. Tamponlanan ses/UI yalnız başarıdan sonra yayımlanır.

48 yeni senaryo kaynakta 3 geçen / 45 kalan, çıktıda 48 geçen / 0 kalan.
Tam sonuç `tests/results-90rc-3.json`, kapsam `LOAD-TRANSACTION-KAPSAMI.md`,
rapor `FAZ90RC-3-RAPOR.txt` içindedir. Üretimde main.js, diplomacy.js
(ortak snapshot'a opaque istisnası) ve sw.js (yalnız cache adı) değişti.
Diğer sekiz ana dosya kaynakla aynı. Save v8, depolama anahtarları,
Situation karantinası ve oyun dengesi korunur.

Sıradaki iş **90F hazırlığı — açık risk/devir ve sürüm dondurma kontrolü**,
öneri **Sol — High**. Yeni somut bulgu olmadan RC düzeltmesi açılmaz.
Nihai kabul 87T cihaz sonuçlarını bekler. Kullanıcı testlere ara vermiştir;
şimdi test istenmez. 91A özellik/denge kapsamı sonra ayrı seçilir.
Karmaşık motor hatasında **Astra — High** kullanılır. Yayınlama yapılmadı.

## 90RC.2 tarihsel devir (aşağıdaki sıradaki-faz notları tarihseldir)

Kaynak: stars-faz90rc-1.zip, SHA-256:
`b89ee2a6999d1f6bd35e68a2887fd002c1f850c150526dcbee06f0a080ad3b97`.
Build `90rc-2`; cache `stars-v90rc-2`.

Bu faz kayıt yükleme kullanıcı akışını kapattı. Dosya seçici artık `change`
yanında gerçek `cancel` olayını da dinler; iptal, abort, okuma hatası ve açma
hatası ayrı sonuçlardır. Gizli input bütün bitiş yollarında hemen kaldırılır ve
FileReader birden fazla son olay üretse bile callback yalnız bir kez çalışır.

Geçerli dosya veya cihaz kaydı dünyaya hemen uygulanmaz. Saf ön inceleme
hanedan ve tarihi gösterir; oyuncu YÜKLE veya VAZGEÇ der. Vazgeçmede dünya ve
hızlı kayıt değişmez. Bozuk kayıt açık dünyayı değiştirmeden reddedilir. Ana
menü yapısal bozuk kaydı devam edilebilir göstermez; cihaz yükleme hatası da
"bulunamadı" diye yanlış sınıflandırılmaz.

Yeni 14 senaryo kaynak 90RC.1 üzerinde 0/14, çıktı üzerinde 14/0 verdi. Tam
regresyon 46 paket / 3844 geçen / 0 kalan. Sonuç
`tests/results-90rc-2.json`, ayrıntı `FAZ90RC-2-RAPOR.txt` içindedir.

Değişen üretim: main.js (dosya seçici, saf ön inceleme, yükleme durumu,
build), ui.js (onay ve geri bildirim), sw.js (yalnız cache adı). Save v8,
depolama anahtarları, Situation karantinası ve oyun motorları korunur.

Kapsam sınırı: 90RC.1 ön kapısından geçen fakat deserialize'ın daha derin bir
aşamasında hata veren kayda karşı tam işlem geri alma hâlâ garanti değildir.
Fiziksel Android kabulü bekliyor; yayınlama yapılmadı.

Sonraki bağımsız iş: **90RC.3 — deserialize tam atomiklik ve derin hata
enjeksiyonu**, model **Astra — High**. 87T cihaz kabulü kullanıcı hazır
olduğunda yürütülür.

## Önceki 90RC kaydı (tarihsel)

Kaynak `stars-faz89b.zip`, SHA-256:
`ce8afbb031c3628d22c51e3329313ece141c530dffc59275108958b40bbf2cbf`.
Build `90rc`; service-worker cache `stars-v90rc`. Önceki devir
`DEVIR-89B.md`, ayrıntılı sonuç `FAZ90RC-RAPOR.txt` içinde.

90RC özellik veya denge fazı değildir. Temiz kurulum, güncel/gerçek eski v8
kayıt, art arda yükleme, yerel dağıtım dosyaları ve PWA güncellemesi denetlendi.

Üç hata kapandı:

1. Eksik PWA kabuğunda `cache.addAll` hatası yutuluyor, yeni worker eksik
   cache ile etkinleşebiliyordu. Artık kabuk tamamlanmadan `skipWaiting`
   çalışmaz; başarısız install eski çalışan sürümü korur.
2. Activate aynı origin'deki bütün yabancı cache'leri silebiliyordu. Artık
   yalnız `stars-v` önekli eski Stars cache'leri temizlenir.
3. Sözdizimi doğru fakat temel kökleri/kimlikleri bozuk kayıt, deserialize
   atamalarından sonra dünyayı yarım değiştirebiliyordu. Yeni ön kapı temel
   kayıt zarfını mutasyondan önce reddeder.

Yeni RC testi kaynak 89B üzerinde 8/7, 90RC üzerinde 15/0 verdi. Tam regresyon
44 paket / 3811 geçen / 0 kalan. Değişen üretim dosyaları yalnız `main.js` ve
`sw.js`; diğer dokuz ana üretim dosyası 89B ile byte-for-byte aynıdır.

Save v8, mevcut depolama anahtarları ve Situation karantinası aynı. Gerçek
Chrome/Android veya service-worker yükseltme testi yapılmadı. Otomatik denetimde
açık P0/P1 yok; cihaz kabulü kullanıcı hazır olduğunda tek güncel ZIP ile 87T
olarak yapılacak. Yayınlama yapılmadı.

Bu bölüm tarihsel 90RC kaydıdır; güncel çalışma sırası belgenin başındadır.
