# STARS — GELİŞTİRME NOTLARI VE KORUNACAK İSTEKLER

Tarih: 15 Ekim 2026  
Kaynak: Kullanıcıyla yapılan Stars tasarım görüşmeleri.  
Durum: **İstek / tasarım kaydıdır.** Maddeler uygulanmış gibi sunulmayacak; uygulama için kaynak kodu, test ve faz çıktısı ayrıca doğrulanacak.

## 0. Kanonik sürüm ve çalışma ilkeleri

- Son doğrulandığı bilinen yayımlanmış sürüm: **Faz 94C** (`stars-faz94c.zip`), SHA-256 `64196faf1d06da760a1d7c753506eb320982cdbb1808e14401351ddec3651f15`.
- Faz 94D, konuşma sırasında üzerinde çalışılan ve henüz tamamlandığı doğrulanmayan faz. Önce onu bitir; başarısızlık ve yarım kalma riskini artıracak kapsam ekleme.
- Kayıt uyumluluğunu, PWA/Android performansını, deterministik davranışı ve otomatik testleri koru. Yapılmış özellikleri yeniden yazmadan önce varlığını ve durumunu denetle.
- Temel tasarım ölçütü: **AI neden karar verdiğini, bunu yapıp yapamayacağını ve olası sonucunu değerlendirsin.** Oyuncu, bildiği gerekçeleri ve sonuçları arayüzde görsün; gizli bilgi sızmasın.

## 1. Devlet kimliği: isim, amblem, galaksi haritası

- Oyuncu başlangıçta devlet amblemi tasarlasın: **geometrik ana şekil**, yardımcı şekiller/desen, **ana ve ikincil renk** seçimi.
- **Yeni ve açık istek: “Rastgele Amblem” düğmesi.** Her basıldığında şekil + desen + renkler birlikte rastgele seçilsin, önizleme anında güncellensin. Sonuç oyuncu onaylayana kadar değiştirilebilir olsun.
- AI devletleri birbirinden ayırt edilebilir, otomatik üretilmiş, oyun kaydında sabit kalan arma/renklere sahip olsun.
- Devlet adı üretme havuzu ve prosedürel kombinasyon sayısı genişletilsin. **Aynı galakside bir devlet adı en fazla bir kez kullanılabilsin**; fallback isim üretiminde de benzersizlik garantisi olsun. Oyuncu adıyla çakışma da kontrol edilsin.
- Galaksi haritasında devletlerin bölgelerinde **devlet adı + amblem** net görünsün; tıklanabilir olsun; yakınlaştırmaya ve çakışma yönetimine göre yerleşsin. Devletlerin kendi siyasi renkleri korunsun.
- Mevcut kayıtların isimleri ve armaları sebepsiz yere yeniden üretilmesin.

## 2. Federasyonlar: tür, reform, oylama ve yönetim

- Üç federasyon türü: **Askerî, Bilimsel/Araştırma, Ticaret**. Her birinin ayrı ekonomi/araştırma/savaş avantajları ve AI davranış öncelikleri olsun.
- **Askerî federasyon:** kanunlar/yükümlülükler uyarınca üyeye saldırıda ve üye saldırıya geçtiğinde diğer üyelerin zorunlu savaş desteği; katılım öncesinde açıkça gösterilsin. Devam eden savaşa katılma ayrı ve anlaşılır değerlendirilir.
- **Bilim ve Ticaret federasyonu:** otomatik savaş yükümlülüğü varsayılan olmasın; savunma/saldırı yardımı oylama veya ayrı taahhütle yürüsün.
- Oylama türleri: **üyeyi federasyondan çıkar**, bir üyenin **mevcut savaşına katıl**, **federasyon adına yeni savaş ilan et**, ortak savunma/askerî yardım, yasa değişimi, üyelik, federasyon türü reformu. Üyeyi atma oylamasında çıkarılması istenen devletin oy hakkı ve suistimal önlemleri açık tanımlansın.
- **Federasyon türünü oylamayla değiştirme:** ör. Bilimsel → Askerî; anlamlı çoğunluk (tasarım önerisi %75), geçiş süreci (öneri 12 ay), yeniden tür değişikliğine bekleme süresi (öneri 120 ay). Yeni savaş yükümlülükleri geçmiş savaşlara geriye dönük uygulanmasın.
- Federasyon uyumu, ortak çıkar, güven ve kriz yönetimi; başkanlık ve yönetim yasaları gözden geçirilsin. Yeni yasa/katılım/reformların sonuçları kullanıcıya açıkça belirtilsin.
- Federasyonlar türlerine uygun prosedürel ve **benzersiz isimler** alsın; ayrı federasyon amblemleri olsun.
- AI devletleri **oyuncudan bağımsız federasyon kurup katılabilsin**, şartlara ve diplomatik motivasyonlarına göre oy verebilsin. Var olan `updateFederations()` mekanizması ve uzun dönem istatistikleri incelensin.

## 3. Diplomasi haritasında federasyon ve ittifak görünürlüğü

- Diplomasi haritasında bağımsız aç/kapat katmanları: **federasyon üyelikleri**, **ittifak bağlantıları**, **savaş çizgileri**. Savaş kırmızı ok/çizgileri yalnız savaş harita moduna kilitli olmasın; bağımsız savaş modu gerekirse kaldırılsın.
- Devlet siyasi renklerini korurken federasyon amblemi, ortak federasyon adı, üyelik işareti, gerektiğinde ince bağlantı çizgileri gösterilsin. Yüksek yoğunlukta görüntü karmaşasını ve performans sorunlarını önle.
- Federasyon ayrıntı ekranında tür, ad, başkan, üyeler, bilinen güç, kurallar, savaşlar, üyelik ve oylama geçmişi yer alsın.
- **Savaş ilanı önizlemesi:** Hedefe otomatik katılacak federasyon üyeleri/müttefikler, oylamaya veya isteğe bağlı katılabilecekler ve bilinmeyenler ayrı gösterilsin; ikinci onay gereksinimi olsun.
- Gizli bilgi açığa çıkmasın: yalnız oyuncunun temas/istihbarat koşullarına göre öğrendiği üyelikler/ilişkiler gösterilsin.

## 4. Federasyon ve ittifak savaşlarının gerçek koordinasyonu

- Federasyonlar savaşta tek tek korvet göndermesin; **toplanma noktası, filo birleştirme, kuvvet üstünlüğü, koordineli taarruz, ikmal, savunma ve geri çekilme** kullanılsın.
- Oyuncunun müttefiki/federasyonu savaş sözü verdiyse oyuncunun seçili hedefine destek verebilsin: **filomu izle/destekle, bu sistemi ele geçir, bu bölgeyi savun**.
- Savaş daveti (mevcut savaşa katıl) ile yeni federasyon savaşı ilanı ayrı işlemler olsun. Diplomatik müzakeredeki savaş taahhüdü filonun gerçek hareketine bağlansın.
- Aynı taktik yetenekler **düşman federasyonlarında da** çalışsın; kaynak, erişilebilir rota, gerçek güç ve kendi savunma ihtiyacı hesaplansın.
- Müttefik destek veremiyorsa *nedenini* bildir: rota kapalı, kuvvet yetersiz, iç savunma gereği vb.
- Toprak paylaşımında gerçek savaş katkısı, savaş öncesi **beyan edilen toprak hedefleri**, coğrafi bağlantı/ulaşım, fiilî işgal ve müzakere hesaba katılsın. Var olan katkı ve oybirliği paylaşım sistemini önce doğrula; bütünüyle atma.

## 5. Diplomaside tutarlılık ve AI gerekçeleri

- **Vasallık koruma erişimi:** Çok uzak ve kapalı sınırlar arkasındaki AI, yalnız oyuncunun güçlü görünmesine dayanıp erişilemez hamiye gelişigüzel vasallık teklifi yollamasın. Gerçek hiper-yol/erişim ve destek süresi değerlendirilsin; istihbarat manipülasyonu dolayısıyla yanlış algı yaşanabilsin.
- Vasal, makul destek imkânı olmadığı durumlarda hükümdarını keyfî biçimde suçlamasın. Vasalın mevcut ilişkileri, ambargo ve sadakat nedenleri tutarlı olsun.
- **Oyuncu adına kendiliğinden ambargo başlatılması** araştırılsın; oyuncu eylemi, otomatik AI kararı ve galaktik konsey yaptırımı ayrıştırılsın; gerekçe ve geçmişi gösterilsin.
- **Rastgele “sınır sürtüşmesi” olayı kaldırılsın.** Somut saldırgan eylemlerden kaynaklanan gerçek sınır anlaşmazlıkları ayrı ele alınabilir.
- Diplomatik müzakere panelinde butonlar, yazılar, boşluklar mobil ekran için sıkıştırılsın; bilgi okunurluğu ve dokunmatik hedefler korunsun.
- Gelen vasallık/federasyon teklifleri küçültülüp **gelen kutusuna** alınabilsin; geçerlilik süresi/son tarih gösterilsin; teklif veren devletin konumu, gücü, durumu incelenip geri dönülerek kabul/ret yapılabilsin. Bildirim kuyruğundan kritik teklif kaybolmasın.
- Diplomaside AI'ın karar gerekçesi, güvenilirliği, geçmiş anlaşmaları/ihanetleri, ortak tehditleri, yardım erişimi ve siyasi çıkarları değerlendirilsin; oyuncunun bilmesine izin verilen gerekçeler gösterilsin.
- Savaş başladığında oyuncu savaşa dahilse belirgin bildirim ve gerekirse otomatik duraklatma; diğer devletlerin savaşları haber arşivine yazılsın.

## 6. Casusluk reformu

- Dost/iyi ilişkili devletin neden casusluk yaptığının gerçek nedeni olsun; sadece temas kurulduğu için yıkıcı operasyon seçilmesin.
- **Pasif istihbarat**, **aktif bilgi hırsızlığı/yanıltma**, **düşmanca sabotaj/isyan** ayrı ilişki ve risk eşikleri kullansın.
- Dost veya müttefikler pasif bilgi toplayabilir, ancak sabotaj ve büyük ihanet son derece istisnai ve gerekçeli olsun.
- İstihbarat seviyeleri ve bilgi doğruluk/güvenilirlik derecesi; aldatma, sahte güç gösterimi ve bunların AI kararlarına etkisi değerlendirilsin.
- Yakalanan ajanlar, diplomatik kriz, özür/tazminat, sınır dışı, karşı istihbarat ve çift taraflı ajan gibi seçenekler ileriki fazlarda değerlendirilsin.
- Casusluk arayüzü basit, sonuçları anlaşılır; operasyonun nedeni ve etkisi görülebilir olsun, gizli bilgiler sızmasın.

## 7. Galaktik Haber Ağı / Tarih arşivi — özellikle onaylanan yeni özellik

- Soldaki kaybolan bildirimlere alternatif, **kalıcı, kronolojik ve tarih damgalı galaktik haber ağı** oluşturulsun.
- Olay metninde **devletlerin gerçek isimleri**, tarih, olay türü, biliniyorsa gerçekleştiği sistem/gezegen yer alsın.
- **Devlet adına tıklamak** ilgili devletin bilinen konumuna, haritasına veya diplomasi ekranına götürsün; **olay yerine tıklamak** kamerayı ilgili sistemi/gezegeni gösterip vurgulasın.
- Kategoriler: savaş ilanları, barış, federasyon kuruluşu/dağılışı/reform/oylama/üyelik, vassallık, devlet doğuşu/yok oluşu, gezegen işgali, kolonizasyon, ticaret, önemli ekonomik olaylar, konsey, krizler ve öğrenilmiş casusluk olayları.
- Filtreler, arama, tarih sıralama, okunmamış olay sayısı; önemli olayları sabitleme veya haber merkezine alma düşünülsün. Çok küçük/tekrarlayan olaylar gruplansın.
- **Temel kural: oyuncunun bilgisi olmayan olay haberlerde görünmemeli.** Bilgiye ulaşma koşulları mevcut keşif/temas/istihbarat kapsamına bağlı olmalı; sonradan öğrenilen geçmiş olayların gösterim politikası netleştirilmeli.
- Haberler sadece düz metin değil, gerçek devlet ve sistem **ID referansları** tutmalı; devlet yok olsa bile geçmiş haberler bozulmasın.
- Kayıt uyumu, arşiv boyutu sınırı ve büyük galakside performans testleri gerekir.

## 8. Ticaret anlaşmaları ve lojistik

- Genel ticaret anlaşmasının neden ve ne kadar **enerji kazandırdığı** net gösterilsin; rota neden oluşuyor/oluşmuyor belli olsun.
- Kaynak bazlı özel sözleşmeler olsun (ör. aylık 15 alaşım ↔ 40 enerji); miktar, süre, liman/rota, gerçek kazanç, stok ve teslimat kuralları şeffaf olsun.
- Ticaret yolları diplomasi/ekonomi görünümünde izlenebilir olsun; zoom nedeniyle kaybolursa anlaşılır seçenek sağlansın.
- Ticaret gemisi görselleştirmesi ile gerçekten teslimata bağlanan simülasyon birbirinden ayrıştırılsın; çift gelir/kaynaksız üretim olmasın.

## 9. İnşaat gemileri, bilim ve genel AI kalite kontrolü

- **İnşaat gemileri:** Oyuncu gemiyi seçip uzaktaki sistem/gezegen ve yapıyı seçebilsin; onay/iptal, otomatik güvenli rota ve varınca inşa edebilme; ardından sıraya birden çok görev ekleme. Sadece bulunduğu sistemde yapım zorunluluğu kalksın.
- **AI inşaat gemileri:** Gemi üretimi, kullanımı, boşta bekleme, hedef erişimi ve **tamamlanan yapı** için uzun kampanya sayaçları ölçülsün. Mevcut kodda inşaat gemisi kullanımı var; fakat verimlilik ayrıca test edilmeli.
- **AI Galaktik Konsey:** Kuruluş eğilimi/koşulları ve otomatik kuruluş davranışı gerçek kampanya verileriyle ölçülsün, oyuncu dışındaki AI inisiyatifi doğrulansın.
- **AI araştırmaları** kesintisiz ilerlesin; deneysel farklı hedefler değerlendirilsin.
- **Yarı otomatik bilim:** Oyuncu hedef seçmezse üç dal kendi mevcut uygun araştırmasını otomatik seçsin; aktif otomatik hedefler kuyruk boş görünse dahi arayüzde açıkça gösterilsin. Temel mekanizmanın 94C testlerinde çalıştığı belirtilmiş; mobil UI gerçeği yeniden doğrulanmalı.
- AI uzun vadeli strateji hedeflerini korusun, aylık amaçsız yön değiştirmesin, donanma üretimi ve savaş kabiliyeti hile yapmadan gelişsin.
- Mevcut kolonizasyon uzmanlaşmaları, galaktik krizler ve hiper-yol lojistik özellikleri **zaten oyunda var**; yeniden ekleme yerine mevcut kullanım/kalite denetimi yapılmalı. Doğal hiper-yol darboğazlarının AI hedef değerlendirmesinde bilinçli kullanımını ayrıca doğrula.

## 10. UI/UX ve mevcut Faz 94D kapsamı

- Mobil bilim ağacı yatay/kompakt; üç ana ağaç korunur; araştırma kuyruğu altta, dokunma/taşma sorunları çözülür.
- Başarısız izometrik/eğimli kamera ve iki parmak döndürme kaldırılır; normal 2D pan/zoom kalır.
- Diplomatik tutarsızlıklar (vasal, ambargo vb.), gezegen işgali/bombardıman göstergeleri, düzleşmiş devlet sınırı render kusuru ve mobil panel taşıntıları denetlenir.
- Oyuncunun dahil olduğu savaşı kaçırmaması için uyarılar ve diplomasi haritası savaş çizgileri öncelikli arayüz düzeltmesidir.

## 11. Önerilen faz sıralaması (kesin sürüm planı değil)

1. **94D:** Başlanmış işi bitir ve doğrula; yeni talepleri bu faza plansız sıkıştırma.
2. **94D.1:** Savaş görünürlüğü/uyarıları ve sınır sürtüşmesi olayı kaldırma.
3. **95A:** Diplomasi/vasallık/casusluk AI, AI konsey/inşaat gemisi/araştırma denetimi.
4. **95B:** Üç federasyon türü, oylamalar, tür değiştirme, üyelik ve reform yasaları.
5. **95C:** Koordineli federasyon savaşları, müttefik destek hedefleri, savaşta toprak paylaşımı.
6. **95D:** Devlet isim ve amblemleri (özellikle **Rastgele Amblem**), federasyon isim/kimlikleri, harita görünürlüğü ve savaşa katılım önizlemesi.
7. **95E:** Galaktik Haber Ağı, diplomatik gelen kutusu ve uzaktan inşaat emirleri (gerekirse ayrı alt fazlar).
8. **96A:** Ticaret sözleşmeleri ve rota şeffaflığı.

Bu dizilim kullanıcı gereksinimlerine göre değişebilir. Fazları gerektiğinde küçük alt fazlara ayır; ilgili kod zaten varsa yeniden yapmak yerine sağlamlaştır.
