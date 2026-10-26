ARAŞTIRMA DURUMU GÜNCELLEMESİ — ÇALIŞMA KESİLDİ
Oyun düzeltmesi yayımlandı ve doğrulandı; doktrin araştırmasının nihai salt-okunur V2 tekrarları tamamlanmadı.
H5 ek kayıt katmanı eski ölçüm düzeneğiyle16/16eşleşti. Sonradan yapılan tamamen kancasız motor kontrolünde14/16koşu bütün aylarda aynı Save/RNG'yi verdi. Aynı seed23'ün120/240aylık iki koşusu71.ayda ayrıştı: ölmüş devlet4._powC önbelleği kancasız motorda53, eski aylık güç ölçümünde0; o ana kadarki RNG aynıydı(-44705134). Aylık totalPower ölçümü türetilmiş önbelleği yeniliyordu. Bu fark araştırma altyapısına aittir; yayımlanan motor yaması değildir.
Salt-okunur ölçüm tasarımı ve yeniden koşu planı research/96h5/RESUME.json ile read-only-metrics.js içinde korundu. Çalıştırma ortamı erişilemez olduğundan V2 tamamlanmış/PASS sayılmadı. Aşağıdaki doktrin tabloları ve sınıfları V1 ön bulgularıdır; nihai saflık kapısını geçmiş yeni AI üstünlüğü olarak kullanılamaz.
Yalnız mevcut Arındırıcı pazar yasağı motor kapısı yayımlandı. AI algoritması değişmedi. Gerçek133paket/6028PASS/0FAIL,252Chromium ve yayın sonrası19runtime/oyunZIPdoğrulaması tamamlanmıştır.
Nihai kanıt ZIP'i oluşturulamadı. Erişilebilir V1 ara ZIP:274548142bayt;SHA-256 a505617fd0f6811c649ca5d058297271f16377c2b211325263236d79e78b92bd. L1'in son ham log/ekran görüntülerinin bu ara ZIP içinde olduğu iddia edilmez.

STARS — FAZ 96H.5 SONUÇ RAPORU
Doktrin kimliği denetimi + mevcut Arındırıcı pazar yasağı düzeltmesi
1. KANONİK KAYNAK, GITHUB HEAD VE HASH DOĞRULAMASI
Başlangıç: sarsiss12-dot/Star main, 2b4f9e647f151a6b514b6ba7ef9da5ec353c709d; 96H.3.1 R1 / 96h31r1 / stars-v96h31r1 / Save8. GitHub HEAD, RELEASE-96H31.json, RELEASE-MANIFEST.json ve 19 runtime dosyası doğrulandı. Kanonik oyun ZIP'i 755890 bayt, SHA-256 41d80f6eb493f97c7b43cda0c37221fe445fe451915e9811bcf5c0ee158ed7d1; 20 üye/19 runtime, CRC temiz. Başlangıç AI SHA-256 27ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739.
H4 raporu ve yerel kanıtları erişilebilirdi; araştırma sonucu/başarısız adaylar incelendi. Eski 5954/5970/5985/202 sayıları yeni sonuç yerine kullanılmadı. H5'te kontrol kampanyaları gerçekten yeniden çalıştırıldı. Önceki kirli Star çalışma alanı ve H4 korunarak ayrı Star96h5 çalışma ağacı kullanıldı. Kaynağı beklenen hash ile eşleşmeyen bir koşu sonuç tablolarına alınmadı.

2. DOKTRİN, ETİK, CIVIC, TÜR VE KÖKENİN YAPISI
DOCTRINE_RACE fizyoloji değil, hükümet/ırk şablonu eşler: Militarist→klan; Tüccar/Kriminal→lonca; Pasifist/Kutsal→meclis; Yayılmacı→kasif; Teknokrasi→teknokrasi; Arındırıcı→klan. Bu nedenle tam paket karşılaştırması üretim, askerî çarpan ve hükümet etkilerini de içerir.
personaOf önceliği: geçerli mizac → persLock → hükümet varsayılanı; bilinçli seçim yoksa trade/cartel civic'i, güçlü militarist/pasifist etik, ardından sahtekârlık çıkarımı devreye girer. Etik, civic, köken, fizyoloji, tehdit ve ekonomi ayrı etkiler olarak kaydedildi. Geçerli ters kombinasyonlara yeni yasak eklenmedi.
researchDoctrine kalıcı seçilmiş/hükümet doktrinini kullanır; çıkarımla değişen mizacı aynen izlemez. 2816 başlangıç AI'sının 611'inde bu iki kimlik ayrıdır. Bu tek başına hata değildir. Seçilmiş doktrin etik reformuyla otomatik değişmez; Pasifist+Kan Hukuku geçerlidir fakat mevcut civic barışı engeller.

3. AI DEVLETLERİ DOKTRİNLERİNE GERÇEKTEN UYGUN DAVRANIYOR MU?
| Doktrin | Sınıf | Ana dayanak/sınır |
| --- | --- | --- |
| Militarist | Güçlü | Filo yatırımı, iştah, hazırlık/bütçe kapıları ve gerçek saldırı izi mevcut; güç bonusundan ayrılmalı. |
| Tüccar | Kısmen tutarlı | Paket daha çok ticaret yapıyor; izole politika daha üstün fırsat arama göstermiyor. |
| Pasifist | Güçlü | Saldırı isteği daha düşük, diplomasi ve savunma devam ediyor; savaş tamamen yasak değil. |
| Yayılmacı | Zayıf | Koloni uygulaması çalışıyor; exp kullanılmıyor, yeni koloni finansmanı kimliği zayıf. |
| Fanatik Arındırıcı | Güçlü; pazar açığı L1 ile kapatıldı | Gerçek pakette ticaret yok, askerî eğilim güçlü; doğrudan pazar açığı bu fazda düzeltildi. |
| Teknokrasi | Kısmen tutarlı | Bilim hedefi ve gerçek araştırma var; otomatik atama örnekleminde yok. |
| Kriminal Sendika | Kısmen tutarlı | Ucuz operasyon işe yarıyor; tarafsız etikle daha sık/akıllı operasyon üstünlüğü yok. |
| Kutsal Meclis | Zayıf | Etki/istikrar, teknoloji ve genel mizaç var; kutsal savaş/uzun barış vaadi bağlı değil. |
Bu sınıflandırma performans yüzdesi değildir. Altı eşlenmiş seed-konum çerçevesi/doktrin ve sınırlı karar senaryoları üzerinde davranış bağlantısının gücünü anlatır; bütün galaksilerde üstünlük iddiası taşımaz.
Karar bağlantıları (M=üretim/mekanik, S=stratejik puan, H=sert kural, E=gerçek eylem):
| Doktrin/parametre | Kullanan yol | Tür | Ölçülen karar |
| --- | --- | --- | --- |
| Tüccar eneMul/tradeMul, warBias, honorCare | recalcMods; aiProfile; aiUpdateLongPlan; warAppetite; Commerce.aiTerms/aiNegotiate | M/S/E | Liman, ekonomi hedefi, kârlı fiziksel sözleşme; arama sırası doğrudan doktrine bağlı değil. |
| Pasifist warBias, grudge/forgive, honorCare | aiProfile; remember/memTick; warAppetite; aiWarReview; aiTurn stance | S/E | Düşük saldırı isteği, diplomatik bağlar, koşullu savunma. |
| Yayılmacı newColStab, borderMul, lifeSpace; prof.exp | doColonize; casusBelliOf; aiShipProduction/aiColonyForecast | M/S/E; exp bağlantısız | Koloni kuruluyor; exp yeni koloni gemisi alımında kullanılmıyor. |
| Militarist dmgMul, warBias, roomTol | aiShipProduction; aiStrategicWarReady; aiWarBudget; aiWarReview | M/S/E | Ücretli filo, savaş gerekçesi ve hazırlık, yetkili saldırı. |
| Teknokrasi araMul/sci | aiProfile; aiUpdateLongPlan; autoResearch; aiEconomicOrder | M/S/E | Bilim hedefi, laboratuvar/araştırma; bonus tek başına davranış kanıtı sayılmadı. |
| Kriminal opCost, dipMul; spy/ahl | aiOpsTick; aiPickOp; aiStandardOpReady; runOp | M/S/E | Hazine/sabotaj/bilgi operasyonu; maliyet ve yakalanma birlikte kaydedildi. |
| Kutsal etkMul, warBias; kutsal | recalcMods; aiProfile/warAppetite; researchAccess; sitOptionOpen | M/S/H; kutsal kullanılmıyor | Etki ve kilitli araştırma/durum seçenekleri var; genel ücretsiz kutsal savaş bağlantısı yok. |
| Arındırıcı kilitli/warBias | isPurifier; diploBlocked; dealQuote/Commerce; aiMarketTick; marketTrade(L1) | H/S/E | Diplomasi/ticaret yasağı, saldırgan duruş; motor pazarı da artık reddediyor. |

4. TÜCCAR DAVRANIŞ ANALİZİ
Gerçek B1 paketlerinde altı aktörün 60. ay toplamı: 64 teslimat, 23 liman emri, 9/25 değerlendirilen terimde uygun sözleşme, 9/9 uygulanmış yük teklifi, 15447 güç, 19 teknoloji; kritik ay 0. Yayılmacı 28, Pasifist 31 teslimattadır. Bu fark hükümet, kaynak ve üretim avantajlarını içerir.
Üretim/hukuki kimlik sabit B2'de Tüccar 48, Pasifist 50 teslimat verdi; Tüccar için genel politika üstünlüğü kanıtlanmadı. Hazır kârlı takas fırsatında yedi yasal doktrinin hepsi gerçek sözleşme ve iki fiziksel teslimat oluşturdu. İhtiyaç yokken, savaşta veya bilinmeyen hatta hiçbiri anlaşma yapmadı.
Commerce.aiOpportunityTick ortak 4 yeni işlem/96 rota bütçesi kullanıyor. AI-AI çiftinin düşük ID'si başlatıyor; ortaklar oyuncu sona bırakılarak ID sırasıyla taranıyor. Bu kimlikten bağımsız fırsat/konum etkisidir. tradeVote ticaret arama katsayısı değil, konsey ticaret standardı oyudur; konsey kapalıyken etkisiz kalması doğrudur. Yol koruması mevcut fakat gerçek kayıp/boş filo/tehdit koşullarına bağlıdır.
Sonuç: Tüccar ekonomik avantajını kullanıyor ve ticaret yapıyor; aynı fırsat başına daha çok ve daha akıllı arama yaptığı henüz kanıtlanmadı. Fırsatsız devlete başarısızlık yazılmadı.

5. PASİFİST DAVRANIŞ ANALİZİ
B1 altı çerçevede Pasifist 0, Militarist 1 saldırı savaşı başlattı. Doğal gözlem havuzunda Pasifistte 1, Militaristte 8 aiWarReview saldırısı görüldü; savunma/yükümlülük girişleri saldırı diye sayılmadı. Havuzun ilk 120 ayları bazı 240 aylık koşularda tekrarlandığı için bu sayılar bağımsız örneklem oranı değildir.
Hazırlanmış aynı kuvvet/fırsat ve ortak 96 RNG durumunda, yalnız politika değiştiğinde:
| Politika | Gerçek saldırı/fırsat | Oran | Wilson %95, koşullu |
| --- | --- | --- | --- |
| Militarist | 19/96 | 19.8% | 13.1–28.9% |
| Tüccar | 17/96 | 17.7% | 11.4–26.5% |
| Pasifist | 15/96 | 15.6% | 9.7–24.2% |
| Yayılmacı | 19/96 | 19.8% | 13.1–28.9% |
| Fanatik Arındırıcı | 20/96 | 20.8% | 13.9–30.0% |
| Teknokrasi | 17/96 | 17.7% | 11.4–26.5% |
| Kriminal Sendika | 18/96 | 18.8% | 12.2–27.7% |
| Kutsal Meclis | 19/96 | 19.8% | 13.1–28.9% |
Aralıklar örtüşüyor; tek başına istatistiksel üstünlük kanıtı değildir. Eşit ve daha güçlü rakip çerçevelerinde erişim/hazırlık kapıları bütün politikaları durdurdu: uygun saldırı fırsatı 0, oran N/A. Sıfır fırsata sıfır başarı puanı verilmedi.
Pasifist+Kan Hukuku barışı kapatır; Gölge Konseyi resmî savaşı engeller. Bunlar doktrine eklenen yeni yasaklar değildir. Pasifist filoları savunmacı duruşu koruyor; saldırıya karşı savunma ve ittifak yükümlülükleri sürüyor. Doğal gözlemler savunmayı gösterse de ayrı çoklu-seed baskın/sağkalım turnuvası yapılmadı.

6. YAYILMACI DAVRANIŞ ANALİZİ
prof.exp hesaplanıyor fakat kanonik runtime'da aktif tüketicisi bulunmadı. Dört seed-konum çerçevesinde exp=0,2/0,75/1,3 değiştirildi: gerçek eylemler, aylık RNG ve ekonomik sonuçlar aynı kaldı; final Save karşılaştırmasında yalnız açıkça değiştirilen türetilmiş _prof.exp alanı ayrıldı. Bu alan dışında maskeleme yapılmadı.
B1 Yayılmacı altı aktörde 6 yeni koloni kurdu, yeni koloni gemisi siparişi 0; hepsi başlangıç gemilerinden geldi. 285 pozitif bilinen-hedef ayı, hemen ödenebilir gemi fırsatı demek değildir: peşin 265 maden/60 alaşım, mevcut yatırım taahhüdü, gemi bütçesi, bakım ve tehdit kapıları ayrıca uygulanır. Koloni finansman tahmininin geçmesi tek başına satın alma yetkisi sayılmadı.
Hazırlanmış bilinen Gaia/hedef ve mevcut gerçek koloni gemisiyle sekiz B2 politika da sürdürülebilir kolonileştirme emri verdi; gizli hedef açılmadı. Bu uygulama çalışıyor fakat doktrine göre yatırım ayrımı göstermiyor. Yayılmacı'nın yaşam alanı savaş gerekçesi ve koloni şok/istikrar avantajları çalışır; bunlar exp tüketimiyle karıştırılmadı.
E1, barışta/tehditsiz/yeterli savunmayla mevcut satın alma kapılarından geçen bir gemiyi öne aldı. Sentetik dar bütçede kontrol korvet, aday ücretli koloni gemisi aldı; savaş/tehdit/kriz/başka doktrinde tam Save/RNG korundu. Altı gerçek başlangıç ve 42/1'in 120 ayı ise bütünüyle aynı kaldı. Ölçülen kampanya kazanımı 0: E1 yayıma reddedildi, güvenlik kapıları kör biçimde gevşetilmedi.

7. DİĞER BEŞ DOKTRİNİN AYRI SONUÇLARI
Militarist — Güçlü: B1'de 162 ücretli korvet emri ve 18450 toplam güç; Yayılmacı 135/9376. Hasar/hükümet bonusu bu güç farkının içindedir. B2'de güç 9249'a karşı 9376: “aynı avantajla her zaman daha iyi ordu” sonucu çıkarılamaz. Hazırlık, erişim, ekonomi ve savaş yetkisi gerçek kapılardır; eski aiTurn ilan denemeleri yetkisizse gerçek savaş sayılmadı. İntihar saldırısı eklenmedi.
Teknokrasi — Kısmen tutarlı: B1 32 teknoloji, 24 laboratuvar emri, 245 bilim-hedefi aktör-ayı; Yayılmacı 30 teknoloji/30 laboratuvar/207 bilim-hedefi ayı. 42/1'in ek 120 ayında 12 teknoloji, 860 güç; Yayılmacı 8/1472. Bilime stratejik yatırım ve askerî bedel görüldü; yalnız başlangıç bonusu denmedi. B2 31'e karşı 30 teknoloji farkı küçüktür. Otomatik doğal atamada sıfır örnek önemli bir erişim açığıdır.
Kriminal — Kısmen tutarlı: B1 kampanyalarında yalnız 3 operasyon; Yayılmacı 5. Bilinen zengin düşman ve somut sabotaj hafızası bulunan 128 gerçek tek-karar denemesinde Kriminal 16, Tüccar/Pasifist/Yayılmacı da 16 girişim yaptı. Kriminalin gerçek hazine bedeli 28 etki, diğerlerinin 55; aynı 16 operasyonda toplam 448'e karşı 880 etki ödedi. 5 yakalanma her iki grupta da gerçekleşti. Ganimet gerçek hedef stoklarından aktarıldı. B2'de bütün bu maliyetler 55, Kriminal yine 16 girişim: özgün sıklık üstünlüğü yok. Doğal Kriminal yoğunluğu yüksek görünse de sahtekâr etik, ucuz maliyet ve uygun düşmanlar ayrıştırılmadan doktrine yazılamaz.
Kutsal Meclis — Zayıf: B1 11 teknoloji/10296 güç; etki/istikrar ve genel savaş eğilimi mevcut. d_synod/Sinod Evi erişimi ve doktrin kilitli durum seçenekleri gerçektir. Ancak PERSONAS.kutsal okunmuyor; genel ücretsiz kutsal savaş veya uzun barış huzursuzluğu için çalışan bağlantı bulunmadı. sitOptionOpen içindeki doktrinli hikâye seçenekleri bu genel AI mekanizmasının uygulandığını kanıtlamaz; ayrı olay-seçim turnuvası NOT RUN. Yeni ücretsiz savaş/etki bonusu eklenmedi.
Fanatik Arındırıcı — L1 sonrasında güçlü sert kimlik: B1'de 0 ticaret teslimatı, 0 uygun ticaret terimi; 3 saldırı savaşı ve 25975 güç. Diplomasi/gerçek kargo anlaşması engelleri korundu. UI ve aiMarketTick pazarı kapatıyordu; marketTrade kapısı eksikti. L1 bu mevcut yasağı maliyet/kur oluşturulmadan önce uygular. Gerçek Save8 sonrası eski dokunmatik düğmede kontrol −200 maden/+80,5 alaşım, yayın adayı 0/0. B2'de “Arındırıcı politika” etiketi taşıyan Yayılmacı'nın ticareti gerçek Arındırıcı ihlali değildir: B2 hukuki kimliği değiştirmez.

8. KARAR DEĞİŞTİRMEYEN GÖZLEM KAYITLARI
16 kanonik kontrol gerçekten yeniden oynatıldı: 2400 kampanya-ayı/144000 yarım günlük adım. Her ayın gerçek Save hash'i ve RNG'si önceki doğrulanmış kanonik koşuyla eşleşti. H5 ek kayıt katmanı devralınan ölçüm düzeneğiyle aynı Save/RNG'yi verdi; bu karşılaştırma tamamen kancasız motor saflığı olarak kabul edilmemelidir. Kayıt taşması 0.
Kimlik, profil, hedef, inşa sırası, bilinen koloni hedefi, finansman, savaş iştahı/hazırlığı/bütçesi, müzakere, operasyon uygunluğu/seçimi/gerçek bedeli, araştırma ve gerçek yük sonuçları dış kayda alındı. dealQuote içindeki geri alınan denemeler quote=true olarak ayrıldı ve gerçek eylem sayılmadı. Eylem verileri anında kopyalandı; ilk pilotun referans-alias kaydı saklandı ve nihai metriklere katılmadı.
Gözlemci AI'ya ek harita/filo/karşı taraf bilgisi vermedi. Yeni deterministik test, temas/istihbarat yokken karşı tarafın gizli stoğunu değiştirmenin aiKnownResources sonucunu değiştirmediğini doğruladı. Doğal fırsat paydaları yalnız gerçekten değerlendirilen fırsatlardır; haritadaki bütün teorik fırsatları kapsadığı iddia edilmedi.

9. AYNI ŞARTLARDA DOKTRİN KARŞILAŞTIRMA TABLOLARI
B1: üç seed (11/42/404), iki gerçek AI başlangıç konumu (1/3), sekiz yasal açık seçimli doktrin; 48 koşu. Aşağıdaki değerler her doktrin için altı aktörün 60. ay toplamıdır; başlangıç koloni sayısı toplam 6'dır. Kritik ay bütün B1/B2 60 aylık aktör örneklerinde 0. Bunlar varsayılan sekiz-seed referansıyla eş koşullu değildir.
| Doktrin | Koloni | Yeni koloni | Ödenen koloni gemisi | Teknoloji | Güç | Teslimat | Saldırı savaşı | Operasyon | Plan T/B |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Militarist | 9 | 3 | 1 | 8 | 18450 | 25 | 1 | 2 | 6/2 |
| Tüccar | 12 | 6 | 1 | 19 | 15447 | 64 | 0 | 2 | 7/0 |
| Pasifist | 11 | 5 | 2 | 18 | 10361 | 31 | 0 | 1 | 5/3 |
| Yayılmacı | 12 | 6 | 0 | 30 | 9376 | 28 | 0 | 5 | 8/2 |
| Fanatik Arındırıcı | 10 | 4 | 1 | 13 | 25975 | 0 | 3 | 12 | 7/1 |
| Teknokrasi | 12 | 6 | 0 | 32 | 11968 | 32 | 0 | 5 | 8/1 |
| Kriminal Sendika | 10 | 4 | 3 | 19 | 17387 | 49 | 1 | 3 | 8/0 |
| Kutsal Meclis | 11 | 5 | 2 | 11 | 10296 | 32 | 0 | 0 | 8/1 |
B2: aynı altı gerçek başlangıç Save/RNG'sinde yalnız personaOf karar dönüşü; üretim, stok, hükümet, fizyoloji, etik/civic, araştırma ve hukuki kimlik Yayılmacı kalır. 48 başlangıç saflık/varlık kontrolü PASS. Arındırıcı satırı gerçek Arındırıcı paketini temsil etmez.
| Doktrin | Koloni | Yeni koloni | Ödenen koloni gemisi | Teknoloji | Güç | Teslimat | Saldırı savaşı | Operasyon | Plan T/B |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Militarist | 12 | 6 | 0 | 29 | 9249 | 24 | 0 | 8 | 7/2 |
| Tüccar | 12 | 6 | 0 | 27 | 9756 | 48 | 0 | 2 | 7/2 |
| Pasifist | 12 | 6 | 0 | 24 | 11671 | 50 | 0 | 2 | 8/2 |
| Yayılmacı | 12 | 6 | 0 | 30 | 9376 | 28 | 0 | 5 | 8/2 |
| Fanatik Arındırıcı | 11 | 6 | 0 | 29 | 9254 | 40 | 0 | 9 | 7/2 |
| Teknokrasi | 12 | 6 | 0 | 31 | 10112 | 50 | 0 | 5 | 7/2 |
| Kriminal Sendika | 12 | 6 | 0 | 28 | 8957 | 27 | 0 | 4 | 8/2 |
| Kutsal Meclis | 12 | 6 | 0 | 30 | 9191 | 32 | 1 | 4 | 7/2 |

10. GERÇEK KİMLİK PAKETİ VE İZOLE KARAR EĞİLİMİNİN AYRIMI
B1 kimlikleri gerçek setupGame oyuncu başlangıcıyla üretildi ve sabit dünyadaki gerçek AI ID/konumuna taşındı. Tarafsız etik, boş civic/özellik, humanoid fizyoloji, standart köken geçerli seçimlerdir. Hükümet üretim bonusu, yaşanabilirlik ve meşru ana gezegen farkı korundu; yalnız doktrin kararı diye sunulmadı. Başlangıç stokları gerçek Normal değerlerdi; deney sonucu için ücretsiz kaynak eklenmedi.
B2 özgün personaOf'u bir kez çalıştırıp yalnız hedef aktörün dönen politika nesnesini değiştirir. Gerçek _pers/mizac, recalcMods üretimi, researchDoctrine ve isPurifier kuralları değişmez. 48 çerçevede başlangıç Save hash'i, RNG, stok/gelir/kapasite/yaşanabilirlik/araştırma erişimi eşitliği doğrulandı. Bu teknik karşı-olgusal deney, oyuncuya sunulan geçerli bir doktrin paketi değildir.
Her iki ailede 42/aktör1 sekiz doktrin için 120 aya da uzatıldı; diğer çerçeveler 60 aydır. B1/B2 96 koşu + exp 12 + tradeVote 6 = 114 tamamlanmış koşu. Exp 8 ve konsey-kapalı tradeVote 4 eşlenmiş karşılaştırma değişiklik göstermedi. İlk gerçek karar ve ilk aylık RNG ayrışması analysis.json/paired içinde saklandı; uzak sonuçlar tek bir ilk kararın doğrudan etkisi diye sunulmadı.

11. TİCARET, SAVAŞ, KOLONİLEŞME, ARAŞTIRMA, DİPLOMASİ VE CASUSLUK
Hazır ticaret fırsatı: B1 yedi yasal doktrin 1/1 sözleşme ve iki gerçek yük teslimatı; Arındırıcı 0, uygun fırsat N/A. Kayıp yaratmayan tamamlayıcı stok/üretim çerçevesi kullanıldı. İhtiyaçsız, savaşlı ve bilinmeyen hatların tamamında sözleşme 0. İmza anında mallar ışınlanmadı; gerçek çıkış/varış ve ücretli yük akışı izlendi. evalOffer iki tarafta da pozitifti; bu öznel motor değeridir, evrensel parasal kâr değildir.
Örnek gerçek B1-11-3-Tüccar/60: 17 teslimat; gelen 54 alaşım/131,3 maden, yüklenen 226,6 enerji/32 maden/12,2 alaşım; 16 enerji kaybı. Gelen-kargoya-yüklenen kaynak vektörü ekonomik değerlendirmede tutuldu; farklı kaynaklar keyfî tek para puanına çevrilmedi. Final-analysis.json bütün doktrinlerin vektörlerini içerir.
Savaş sayısı yalnız gerçekten kurulan savaş bağlantısından, koloni yalnız sahiplik değişiminden, teknoloji yalnız gerçek grantResearchTech kaydından sayıldı. Araştırma seçimleri ihtiyaç, profil, strateji ve gerçek erişimden etkileniyor. Üç dalın otomatik araştırması ve ücretli laboratuvar emri korunuyor.
Casuslukta ilişki tek başına düşmanca operasyon yetkisi sağlamaz. Somut kin yokken 128 denemelik ilk çerçevede uygun düşmanca fırsat 0, oran N/A; sıfır girişim kimlik başarısızlığı sayılmadı. Sabotaj hafızalı pozitif çerçevede bütün doktrinler için 128 uygun deneme vardı. Risk, yakalanma, gerçek etki bedeli ve karşı taraftan alınan kaynaklar birlikte kaydedildi.

12. UZUN VADELİ HEDEFLERLE UYUM
aiUpdateLongPlan war/sci/eco/dip/turtle, kaynak ihtiyacı, bilinen çevre, ticaret kapasitesi ve tehlikeyi kullanır; aylık plan ve inşa sırası bu hedefe bağlanır. Ekonomik toparlanmanın kimliği geçici bastırması doğru olabilir. aiStrategicWarReady toparlanma/açık cephe/yanlış hedef/hazırlıksız planı durdurur; savaş iştahının her ay savaşa dönüşmemesi hata değildir.
B1 Tüccar ve Kriminal 336/360 aktör-ayı ekonomi hedefindeydi. Teknokrasi 245, Yayılmacı 207 aktör-ayı bilim hedefindeydi. Yayılmacı'nın bilim şablonu güçlü, exp'nin koloni yatırım bağlantısı eksik; bunlar farklı katmanlardır. Kutsal Meclis yalnız 48 aktör-ayı influence hedefi gördü; genel dinî diplomasi kimliği çıkarılamaz. Ticaret stratejisindeki partner seçimi Commerce'in ID sıralı taramasını doğrudan değiştirmiyor.
Genel yayın matrisinde tamamlanan/başarısız planlar 120 ay 81/26, 240 ay 65/24, yoğunluk 52/14; kontrolle birebir aynıdır.

13. KULLANILMAYAN, ZAYIF VE ÇELİŞKİLİ BAĞLANTILAR
| Bulgu | Sınıf | Kanıt/yorum |
| --- | --- | --- |
| prof.exp hesaplanıyor; kolonileştirme tercihinde tüketilmiyor | 3: kullanılmıyor | Kaynak taraması + dört çerçevede 0,2/0,75/1,3 ablasyonu aynı gerçek eylem/RNG. |
| Tüccar arama önceliği | 2/4: dolaylı ve ortak sıra baskın | Üretim/değerleme etkili; ortak 4 işlem/96 rota ve ID sırası kimliği bastırabilir. |
| tradeVote konsey kapalıyken | 6: haklı devre dışı | Yalnız ticaret standardı oyu; dört eşlenmiş karşılaştırmada Save/RNG aynı. |
| kutsal bayrağı ve genel kutsal savaş/uzun barış | 3: bağlantı yok | Bayrak tüketicisi yok; doktrinli olay seçenekleri ve araştırma ayrı mekanikler. |
| Teknokrasi/Kutsal Meclis otomatik başlangıçta yok | 4: atama şablonu erişimi bastırıyor | 256 seed/2816 AI, her iki mizacın sayısı 0; açık seçilmiş paketleri ayrıca test edildi. |
| Kriminal ucuz operasyon ama düşük dip sıklığı | 2/5: zayıf/karşı yönlü etkiler | Maliyet 28/55; aynı olumlu fırsatta 16/128 girişim, özel sıklık artışı yok. |
| Eski İzolasyonist adını karşılaştıran dallar | 3/4: eski ad veya diğer yasağın arkasında | Güncel ad Fanatik Arındırıcılar; bazı boyun-eğdirme eğilim dalları eski adı kullanıyor. |
| Reformdan hemen sonra profil/persona önbelleği | 2: sınırlı gecikme | 1→2 militarist etik reformunda aynı anda eski profil; sonraki gerçek memTick yeni Militarist profil. Anlık yenileme eklenmedi. |
| Arındırıcı doğrudan marketTrade | 5: UI/AI yasağı ile motor çelişkisi | Gerçek Save8/eski butonla ücretli takas üretildi; L1 giderdi. |
Gölge Konseyi aynı 128 uygun hazine fırsatında 16→29 girişim ve spy 0,25→0,75 verdi; sıklık/ücret mekanizması gerçekten çalışıyor. Kale Doktrini turtle 0,2→0,6, Madencilik Loncaları eco 0,484→0,524 verdi. Bu son iki profil ölçümü tek başına daha çok savunma/maden yatırımı ispatı değildir; ayrı tehditli yatırım karşılaştırmaları NOT RUN.

14. KİMLİĞİN EKONOMİK VE ASKERÎ MALİYETİ
Doktrine sadakat otomatik başarı sayılmadı. B1 Militarist/Arındırıcı güç avantajı üretim/hasar çarpanıyla birlikte gelir; Teknokrasi'nin 42/1/120 bilim kazanımına daha düşük güç eşlik eder. Kriminalin ucuz casusluğu diplomatik güven kaybını ortadan kaldırmaz; yakalanmalar ölçüldü. Yayılmacı gemisinin maden finansmanı laboratuvar, temel üretici ve savaş hazırlığıyla yarışır.
H5 genel zekâ üstünlüğü veya bütün göstergelerin arttığı iddia edilmez. Yayına alınan L1 bir kaynak/üretim veya savaş eğilimi bonusu değildir. AI algoritması, genel kampanya ticaret/bilim/filo sonuçları değişmedi; mevcut doktrin yasağının gerçek ekonomik işlemde uygulanması düzeldi.

15. BAĞIMSIZ İYİLEŞTİRME ADAYLARI
| Aday | Kontrol | Sonuç | Karar |
| --- | --- | --- | --- |
| H5-E1-funded-expansion-first-01 | Altı aynı gerçek Save/RNG; 42/1 ayrıca 120 ay; tek aktör uygulaması | Bütün aylık/final Save/RNG ve gerçek eylemler aynı; +0 koloni. Sentetik olumlu dal çalışıyor, dört güvenlik durumu tam korunuyor. | Yayıma RED: gerçek örneklemde fayda yok. |
| H5-L1-purifier-market-engine-01 | Aynı yeni test: kanonik 34 PASS/9 FAIL → aday 43 PASS/0 FAIL; gerçek eski dokunmatik düğme | Pazar kur başlatmadan/ücret kesmeden mevcut isPurifier yasağını uyguluyor; normal doktrin takasları değişmiyor. 16 genel koşu tam Save/RNG eşit. | KABUL: yalnız motor kural tutarlılığı. |
İki aday bağımsız kaynak kopyalarında geliştirildi. E1 üzerine L1 eklenerek başarısızlık gizlenmedi. Tüccar/Pasifist/Kriminal için zorlama yeni davranış adayı üretilmedi. Birleşik E1+L1 koşusu NOT RUN; reddedilmiş adayı birleştirmek için gerekçe yok.

16. KABUL, RED VE TEST EDİLMEYEN DEĞİŞİKLİKLER
Kabul: marketTrade içinde mevcut Arındırıcı pazar yasağı, marketOpen kontrolünden sonra ve marketQuote/ödeme öncesinde tek motor kapısı. Değişmeyenler: gerçek vergi/transfer, kur/komisyon, sözleşme kabulü, inşaat/gemi bedeli, koloni gereksinimi, savaş yetkisi, oyuncu doktrin bonusu.
Red: E1; gerçek kampanya faydası kanıtlanmadı. E1'in büyük savaş/ekonomi gerilemesi saklanmadı: bu aday gerçek çerçevelerde etkisiz kaldı. H4'ün başarısız bina belleği veya öngörü adayları üretime geri alınmadı.
NOT RUN/uygulanmadı: yeni otomatik sekiz-doktrin ataması; kutsal savaş/uzun barış mekaniği; kaynak rezervasyonu üzerinden yeni koloni finansmanı; doktrine göre ticaret tarama sırası; özel baskın sağkalım turnuvası; ideolojik olay-seçim turnuvası. Bunlara PASS verilmedi.

17. SEKİZ SEED / 120 AY VE DÖRT SEED / 240 AY
Aşağıdaki değerler son 96h5 kaynaklarıyla gerçekten yeniden ölçüldü; her biri taze H5/R1 kontrolünün bütün aylık Save/RNG'siyle aynı. Normal zorluk, sarmal, orta/default 45 sistem/5 AI, konsey/kriz kapalı, rastgele AI kökeni varsayılan %35; ayda 60×0,5 gün; 60. ay gerçek serialize/deserialize Save8.
120 ay:
| Seed/senaryo | Kritik ay | Teslimat | Sözleşme | Teknoloji | Koloni | Gemi | Güç | Plan T/B | İlk/yeni kriz |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M120-7 | 5 | 46 | 4 | 51 | 16 | 188 | 23537 | 11/2 | 5/0 |
| M120-11 | 0 | 84 | 11 | 29 | 12 | 104 | 14356 | 11/4 | 0/0 |
| M120-23 | 1 | 0 | 0 | 29 | 10 | 135 | 21514 | 10/2 | 1/0 |
| M120-42 | 2 | 58 | 5 | 42 | 15 | 142 | 20026 | 5/4 | 2/0 |
| M120-99 | 0 | 57 | 11 | 47 | 20 | 187 | 26197 | 12/3 | 0/0 |
| M120-123 | 3 | 56 | 5 | 44 | 16 | 166 | 24080 | 17/0 | 3/0 |
| M120-404 | 2 | 154 | 14 | 49 | 19 | 251 | 31433 | 7/5 | 0/2 |
| M120-2026 | 1 | 0 | 0 | 40 | 21 | 213 | 26652 | 8/6 | 1/0 |
Toplam: 14 kritik devlet-ay; 455 teslimat; 50 sözleşme; 331 teknoloji; 129 koloni; 1386 gemi; 187795 güç; 81/26 plan. Kontrol farkı 0.
240 ay:
| Seed/senaryo | Kritik ay | Teslimat | Sözleşme | Teknoloji | Koloni | Gemi | Güç | Plan T/B | İlk/yeni kriz |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M240-11 | 10 | 204 | 23 | 64 | 17 | 203 | 37262 | 20/7 | 1/9 |
| M240-23 | 1 | 20 | 2 | 72 | 28 | 148 | 73030 | 18/3 | 1/0 |
| M240-42 | 2 | 132 | 11 | 93 | 25 | 261 | 63537 | 10/5 | 2/0 |
| M240-404 | 49 | 717 | 54 | 121 | 29 | 395 | 75500 | 17/9 | 0/49 |
Toplam: 62 kritik devlet-ay; 1073 teslimat; 90 sözleşme; 350 teknoloji; 99 koloni; 1007 gemi; 249329 güç; 65/24 plan. Seed404'ün 49 ayı değişmedi. Konsey kapalı bu matris pazar kullanım kazanımı deneyi değil, genel kalite ve yan etki kapısıdır.

18. YOĞUNLUK VE FARKLI GALAKSİ KOŞULLARI
| Seed/senaryo | Kritik ay | Teslimat | Sözleşme | Teknoloji | Koloni | Gemi | Güç | Plan T/B | İlk/yeni kriz |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D120-1-11 | 0 | 0 | 0 | 4 | 2 | 7 | 859 | 2/2 | 0/0 |
| D120-11-23 | 28 | 887 | 103 | 94 | 27 | 474 | 59175 | 14/7 | 28/0 |
| D120-11-42 | 0 | 122 | 15 | 109 | 42 | 445 | 55500 | 23/4 | 0/0 |
| D120-5-404 | 3 | 66 | 10 | 40 | 16 | 174 | 23790 | 13/1 | 3/0 |
100/1 seed11 kritik 0/güç859; 100/11 seed42 kritik0; 30/11 seed23 kritik28; 60/5 seed404 kritik3. Toplam31; kontrol farkı0. 60/5 gerçekten buyuk=60 sistemdir, orta=45 ile karıştırılmadı. Her yoğunluk tek seed olduğundan evrensel yoğunluk sonucu çıkarılmadı.
Başlangıç/yeni devlet ayrımı: 120 ay 12/2 kritik ay; 240 ay 4/58; yoğunluk 31/0. Seed404 yeni devlet7 ay107'de doğdu, tüketim krizi119–167 arasında49 ay, hayatta. Seed11 yeni devlet7 ay218'de doğdu,9 maden-kritik ayı219–228 aralığında; toplamseed11krizi10. Yeni devletin doğmamasıyla elde edilmiş yapay toparlanma yok; doğumlar ve sağkalım kontrolle aynı.

19. REGRESYON, CHROMIUM, PWA VE ANDROID
Kanonik kaynağın taze ilk tam regresyonu:132 paket/5985 PASS/0 FAIL. Yeni motor kimlik testi kontrol üzerinde34 PASS/9 FAIL vererek mevcut açığı yakaladı; L1'de aynı test43 PASS/0 FAIL.
Nihai kaynak:133 paket/6028 PASS/0 FAIL/0 SKIP. İlk tamamlanmış yeni sürüm koşusu6027/1 idi: eski UI-only fazın “economy.js de H3 ile tamamen aynı” hash beklentisi onaylanmış motor kapısına takıldı. Koruma testi yalnız o gözden geçirilmiş tam metin bloğunu ayırıp kalan bütün baytları H3 hash'iyle doğrular; yeni43 test kapının davranışını bağımsız sınar. Tek paket tam ve izole yeniden çalıştı:15/0; özgün14/1 yerine kondu, toplam iki kez sayılmadı.
27 tarihsel testte yalnız sabit96h31r1 build/cache beklentileri ortak release-contract manifest kontrolüne taşındı. Tam build/cache eşleşmesi ve Save8 zorunluluğu korundu; oyun davranışı eşikleri değiştirilmedi. Ayrıca H31 kaynak koruma kapsamı yukarıdaki tek onaylı blok için açıkça güncellendi. İlk loglar ve eski test hash'leri initial-failures içinde saklıdır. Test envanteri133 paket/324 kaynak-bağımlılık dosyasının hash'ini içerir.
Nihai gerçek Chromium:252 PASS/0 FAIL;102 inşa,25 genel,36 pregame,13 siyasi panel,16 sözleşme,6 uzun canlı panel,1 ek R1→H5 PWA,3 gerçek çift tıklama/çift dokunma,49 doktrin seçimi/Save8/devlet paneli,1 eski pazar düğmesi. Eski sürüm canlı-panel karşılaştırmaları ve başlangıç kontrolündeki251 kontrol nihai252'ye eklenmedi.
Fiziksel Android:NOT RUN. Chromium mobil emülasyonu Android cihaz testi diye sunulmadı. Öznel ses dinleme, bağımsız GPU/gerçek Android süreç öldürme testi NOT RUN.

20. SAVE UYUMLULUĞU VE KORUNAN MEKANİKLER
Save v8 korunuyor; yeni kalıcı Save alanı yok. PWA stars-v96h31r1→stars-v96h5 gerçek yükseltme, eski cache temizliği, çevrimdışı yeni kabuk ve gerçek Save8 yüklemesi geçti. 96H.3 vassallık muhasebesi, mevcut stratejik AI, diplomatik hafıza, ticaret/konvoy/korsanlık, bilim/araştırma, filo/savaş yetkisi, federasyon/vassallık, köken/başkent kısıtları ve bağımsız AI sayısı korundu.
UI/index.html aynı hash;62px kart,18px görünür yıkma rozeti,44px dokunma hedefi,450ms/24px koruma ve portre yönlendirme katmanı gerçek tarayıcıda korundu. Son runtime değişiklikleri yalnız economy.js'deki kapı, main.js BUILD_ID ve sw.js CACHE. ai.js aynen27ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739. Üretime gözlemci, E1, seed'e özel çözüm, ücretsiz kaynak veya yeni bonus taşınmadı.

21. OYUN/KANIT ZIP BAĞLANTILARI VE MANİFESTLER
Oyun: stars-faz96h5.zip; 756007 bayt; SHA-256 fa50f80f7f214d56e779e63a5a8a2382574e381b78ea5c63da4a76d24b4c7cf9; CRC PASS; kökte19runtime+RELEASE-MANIFEST.json=20üye. İndirme: https://github.com/sarsiss12-dot/Star/raw/refs/heads/main/releases/stars-faz96h5.zip
Nihai kanıt ZIP'i: NOT RUN — çalışma ortamı kesildi. Mevcut V1 ara ZIP274548142bayt, SHA-256 a505617fd0f6811c649ca5d058297271f16377c2b211325263236d79e78b92bd;16kontrol/114doktrin koşusu ve o tarihteki kaynak/fixture/analizleri içerir. Son yayın logları/ekranları nihai ZIP'e aktarılamadı.
Kanıt bağlantısı: https://chatgpt.com/library?file_id=libfile_1b98ce42d0b881918a5ae817d657aa4a&account_id=personal
RELEASE-MANIFEST.json bütün19runtime SHA-256'sını, Save8'i,96h5 build ve stars-v96h5 cache'i bildirir. RELEASE-96H5.json oyun ZIP hash/byte ve gerçek doğrulama sayılarını taşır. Kaynak bütünlüğü yayın öncesi ve sonrası tekrar kontrol edilir. Tam kaynak listesi:
| Runtime dosyası | SHA-256 |
| --- | --- |
| ai.js | 27ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739 |
| archive-ui.js | 7f96276402dbb88fc93b4cf72bc7b4922887751eb6aede714e0316750f7f92ab |
| audio.js | 6ddf6e388fa404394fee6220c2bfeeb3d1f9601c51a35ccdfe3181a8781942f7 |
| combat.js | b4e21fcdb6fdaaa93da07313131470de3e8a3c28b5650226a9c4a2713bde73a5 |
| commerce-ui.js | cc7fef5ab43176093251916aaafbdd873424da0630ec46fe6d3d5106a690b8d4 |
| commerce.js | 978e4f6b01faed1babeade20070447cbcfaa4e2ea70793a78e50f20fbe66be01 |
| construction.js | d9b544b0328f26576ff90e02fe49c1b7f3798dfd844a8c39ee8dc6c0890debda |
| diplomacy.js | b46fd1bf2552a256fe6ad724ec72859f8edbc8c37eb0fd1c9b6e721582e6b3f3 |
| economic-ledger.js | 67d07f3ee4777cd7c246c8b37dda7cf1577cf86c19a6edeba68945a5d3063501 |
| economy-ui.js | 61f6e2dcef7f37143821edccf67552718a210ec555f7b8f9074c68191fd5cbcc |
| economy.js | 5d412d488760ae2b7193b13822b747788130b63ed782e62bfbd3223154b69d22 |
| inbox.js | 5f53ac2ca9c3ca8d5f1a12a9e1ba2b2a247ab7e350df0ec9169a13cfe3285204 |
| index.html | 127f72e12e67a7d4c2ea05713fb202e21b470ad053c20411650a0bdbb78bac9d |
| main.js | 251de9cd6725a1ed5db3739ac07d7b40bb794e2fc110a4a0526faa155732841e |
| manifest.json | 6b8305490e9a55e983388bc5bf7a3ebe7fdb3e8e7a2b7fe3cce3da191b52f310 |
| map.js | d8ca27ee07c484b7399f95d8031aa70fb7539bcf89d768c8442200b7cba76ae3 |
| news.js | a1c1bc37f18b69979bc1a7c27ab80597579d13af0ad833a8897a8c0acb474646 |
| sw.js | 5dc5ef10fbd3cc7499289fc9a7d2e73869312482795e897e70fcfc38a12d3908 |
| ui.js | d60ec4997195c6ee82fa6fa86164666394cf9773d774c66d591b7f2e481eca24 |

22. GITHUB COMMIT VE YAYIN DURUMU
Test metadata commit'i2d4d8021a90d62808bb55548e89129922a0fa30c; oyun yayın commit'i82cec8632e2076002755e8ee5fb44b91e1895892. Expected-SHA2b4f9e647f151a6b514b6ba7ef9da5ec353c709d ve force=false ile main güncellendi. Yayın sonrası HEAD, release, manifest,19runtime SHA-256 ve gerçek756007bayt oyun ZIP'i SHA-256/CRC/dosya listesi doğrulandı. Bu ek durum düzeltmesi yalnız araştırma belgeleri ve release araştırma durumunu günceller; runtime/oyun ZIP'i değişmez.

23. AÇIK SORUNLAR, SONRAKİ FAZ VE AÇIK CEVAPLAR
Öncelik1: otomatik AI kimliği atamasında sekiz doktrinin görünürlüğü. Teknokrasi/Kutsal Meclis'i doğal havuza eklemek hükümet/bonus/etik dengesini de etkiler; ayrı geçerli başlangıç ve kampanya deneyleri gerekir. Araştırma kapılarıyla çıkarımlı mizaç ayrımını kullanıcıya açık anlatmak gerekir.
Öncelik2: Yayılmacı için yalnız tercih sırası yerine gerçek koloni gemisi maden/alaşım finansmanını gözlemlemek. Hangi aylarda hedef biliniyor, koloni sürdürülebilir ama peşin gemi/üretici yatırımı çatışıyor, bunu ölçmeden rezerv politikası eklenmemeli. E1'in sıfır gerçek etkisi güvenlik eşiklerini rastgele düşürmeye gerekçe değildir.
Öncelik3: Tüccar ortak seçimi ve ortak tarama bütçesinde ID/fırsat etkisi; aynı bilinen kârlı seçenekler arasında karar kalitesi ölçülmeli. Kriminalde ucuz maliyet, etik sıklığı ve yakalanma bedeli ayrıştırılmalı. Kutsal Meclis'in vaat edilmiş ama bağlı olmayan genel mekanikleri, oyuncu kuralları ve dengeyi değiştireceği için ayrı tasarlanmalı; bedelsiz güç eklenmemeli. Reform önbelleğinin aylık gecikmesi ve eski İzolasyonist ad dalları ayrıca ele alınmalı.
Tüccar gerçekten daha çok ve daha akıllıca ticaret yapıyor mu? Gerçek paket daha çok teslimat üretti; izole karar üstünlüğü ve daha iyi fırsat arama kanıtlanmadı.
Pasifist gerçekten savaştan kaçınıp diplomasiyi tercih ediyor mu? Evet, mevcut iştah/hafıza/duruş bağlantıları ve düşük gerçek saldırı sayısı bunu destekliyor; savunma yasaklanmış değil. Kontrollü oran farkı sınırlı örneklemde ve belirsizlik aralıkları örtüşüyor.
Yayılmacı gerçekten daha aktif ve sürdürülebilir genişliyor mu? Sürdürülebilirlik kapısı ve kolonileştirme uygulaması çalışıyor; daha aktif koloni yatırım kimliği kanıtlanmadı. exp bağlantısı eksik.
Militarist gerçekten savaşa hazırlanan ve gücünü değerlendiren bir devlet mi? Evet, ücretli filo ve hazırlık/bütçe/erişim kapıları var; aynı avantajlarla her seedde daha iyi askerî sonuç iddiası yok.
Doktrinler galakside hissedilecek kadar farklı mı? Militarist/Pasifist/Tüccar/Arındırıcı bazı açılardan belirgin; sekizinin tamamı eşit ölçüde belirgin değil. İki doktrin otomatik örneklemde hiç doğmadı.
Hangileri yalnız bonusla ayrılıyor? Tamamen yalnız bonus demek aşırı genelleme olur: hepsinde bazı genel mizaç değerleri var. Kutsal'ın özel kimliği büyük ölçüde bonus/genel savaş eğilimi düzeyinde; Kriminalin izole fırsat farkı ağırlıkla maliyet; Yayılmacı'nın koloni yatırım tercihi eksik. Teknokrasi gerçek bilim hedefi de kuruyor.
Genel zekâ korunurken kimlik güçlendirilebilir mi? Evet, mevcut yasağın motor düzeyinde tutarlı uygulanması örneği kanıtlandı. Bu fazda yeni stratejik zekâ kazanımı yok; ticaret/bilim/filo/planlar ve ekonomik krizler kontrolle birebir korundu. Seed404'ün49aylık krizi kısalmadı. Araştırma sonucunu yeni AI üstünlüğü diye sunmak doğru olmaz.
