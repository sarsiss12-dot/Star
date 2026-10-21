# STARS — İleri Diplomasi Tasarım Kararları (21 Ekim 2026)

**Durum:** Gelecekte uygulanacak tasarım notu; burada anlatılanlar oyuna eklenmiş veya test edilmiş sayılmaz.

**Sürüm sınırı:** GitHub main 96A iken 96D ZIP ayrı kanonik ve doğrulanmış teslimdir. 96E'nin bitmiş ZIP/rapor teslimi kesinleşmeden 96E tamamlandı denmeyecek. Eski sistemler yazılmadan önce son kanonik kaynak ve faz raporları incelenecek.

## A. Federasyonun oy dağılımı rejimi

- Federasyon **türü** (askeri/ticari/bilimsel vb. mevcut tipler) ile **oy dağılımı rejimi** ayrı parametrelerdir. Federasyon kurulurken rejim seçilir; mevcut federasyon türleri ve yasaları korunur.
- Rejim seçenekleri:
  1. **Eşit temsil:** Her bağımsız üye 1 oy.
  2. **Hegemonik:** Tanımlı siyasi/askeri güç ağırlıklı oy.
  3. **Ekonomik temsil:** Gerçek ekonomik büyüklükten türeyen oy.
  4. **Karma temsil:** Sabit temel oy ile sınırlandırılmış güç/ekonomi bileşimi.
- Rejim, **üyeliğe davet edilen AI'nin katılma iştahını** ve **oyuncunun başka bir federasyona üyelik başvurusu yaptığında mevcut üyelerin kabul oylamasını** etkileyecek.
- Adayın kabulündeki oy sayıları ve ağırlıklar gerçek konsey üyeleri üzerinden hesaplanmalı; aday oy kullanmamalı. Vasal ve hegemonya oy ağırlığı mükerrer sayılmamalı. Veto/kabul şartları mevcut anayasa, üyelik kuralları ve oylama eşiği ile uyumlu olmalı.
- AI, adayın güvenilirliği, diplomatik ilişkiler, düşmanları, etik/doktrin uyumu, ilerideki oy dengesindeki değişim ve kendi gelecekteki oy gücüne göre değerlendirir. Gizli bilgi veya görünmeyen filo gücü sızdırılmaz.
- Rejimin daha sonra değiştirilmesi için mevcut konsey yoluyla gerekçeli nitelikli çoğunluk/üst düzey anayasa reformu gerekir. Oyuna yeni bir müstakil federasyon motoru yazılmaz; 95B–96E altyapısı genişletilir.
- Test: eşit oylamada 4 küçük üyeye karşı 1 büyük üyenin kaybetmesi, hegemonikte sonucun değişebilmesi; oyuncu başvurusu, AI daveti, ret gerekçesi, Save v8 ve eski kayıt varsayılanı.

## B. Vassallık antlaşmalarının özelleştirilmesi

- Mevcut **Haraçgüzar / Sınır Bekçisi / Akademik Vasal** türleri korunur.
- Diplomaside üç tür alt alta görünür; her türün yanındaki **Ayrıntılar** düğmesi ayrı kapsamlı sözleşme ekranı açar.
- Ayarlanabilir maddeler: vergi yüzdesi ve kaynak bazında oran, bilim aktarımı, savunma/tüm savaş/yok katılımı, diplomatik ve askerî özerklik, senyörün koruma yükümlülüğü, süre (örn. 5/10 yıl veya süresiz), fesih ve bağımsızlık şartı, tazminat.
- Her türün anlamlı varsayılanları vardır. Oyun ekonomisi/depo hesabı, gerçek savaş katılımı ve diplomatik haklar kaydedilmiş sözleşmeyi kullanır; sadece UI rakamları değişmez.
- Oyuncu teklif gönderebilir, AI kabul/ret/**karşı teklif** verebilir; oyuncu da karşı teklif döndürebilir. Değiştirilen maddeler, tarafların kazanç/kayıpları ve gerekçeler mevcut kalıcı diplomatik gelen kutusunda görünür.
- AI gerçek vergi yükü, mevcut gelir, tehdit, filo gücü, kişilik, strateji, ilişki, sadakat ve koruma erişimi temelinde pazarlık eder. Sınırlı tur sayısı, bekleme süresi, etki bedeli ve mükerrer teklif koruması bulunur.
- Mevcut bağımsızlık arzusu (oyuncu isyan eşiği 55), AI isyanları ve bağımsızlık savaşı korunur. Yeni savaşsız yollar: serbest bırakma talebi, bedelli bağımsızlık, sözleşme bitimi, sözleşmenin yeniden müzakeresi. Gönüllü ve zorla kurulmuş vasallıkların fesih koşulları farklı olabilir.
- Senyör emirleri mevcut oyunun kendi baskı/öfke/sadakat mantığıyla etkileşir, tek taraflı sözleşme değişikliğine dönüşmez.
- Test: karşı teklif, ikinci teklif, kayıt/yükleme, para ve bilim aktarımı, gerçek savaşa giriş, bekleme/double-spend, bağımsızlık ve federasyon oyu. Özellikle farklı vasal türlerinde gösterilen vergi açıklaması ile gerçek ekonomi uyumlu olmalı.

## C. Plan sırası ve tamamlanmış özellikleri tekrar etmeme

- 96E: federasyon katılım teklifi/başvurusu ve AI köken dağıtımı; **mevcut devam eden çalışmanın gerçek çıktısı doğrulanmadan tamamlandı yazma**.
- 96F: mevcut sekiz kökenin uzun vadeli etkileri ve dengeleme.
- 96G: federasyon iç siyaseti, oy dağılım rejimleri, üyelik kabul/davet siyasi değerlendirmeleri.
- 96G.1: vassallık ayrıntı sözleşmesi, AI karşı teklifleri, bağımsızlık müzakeresi.
- 96H: bilim gemisi aynı hedefe yığılması, korsan/güvenli rota, mevcut konvoy/economy/filo otomasyon regresyonu.
- 96I: mevcut portre ve Web Audio müziğin kalite iyileştirmesi, mobil cihaz kabulü.

**Zaten mevcut olup sıfırdan yapılmayacaklar:** üç vasal türü, mevcut isyan, federasyon türleri ve oylama altyapısı, savaş koordinasyonu, Galaktik Haber Ağı, diplomatik gelen kutusu, gerçek ticaret konvoyu, Ekonomi Merkezi, köken/portre/generatif müziğin ilk sürümleri.

**Geliştirme teslim standardı:** kanonik ZIP SHA-256, ZIP CRC, manifest tüm dosya hash'leri; bağımsız regresyon ve gerçek tarayıcı sonuçları; gerçek teslim ZIP'i; GitHub publish durumu; tek parça tek tuşla kopyalanabilir faz raporu (yapılanlar, yapılmayanlar, açık sorunlar, test sayıları, hash, GitHub commit). Doğrulanmamış şeyi tamamlandı diye yazma.
