STARS — FAZ 96H.6 SONUÇ RAPORU

KARAR: Yeni oyun yayımlanmadı. Hiçbir aday bütün kabul kapılarını geçmedi; kanonik 96H.5 korundu.

1. KANONİK KAYNAK VE YAYIN
Depo: sarsiss12-dot/Star, main. Başlangıç HEAD: c7700b787ffbd355d7e4e8fb8808537218d463c4. Son araştırma HEAD: Araştırma commit kimliği son teslim raporundadır.
Oyun: 96H.5; build 96h5; PWA stars-v96h5; Save v8.
stars-faz96h5.zip: 756007 bayt; SHA-256 fa50f80f7f214d56e779e63a5a8a2382574e381b78ea5c63da4a76d24b4c7cf9.
AI SHA-256: 27ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739.
Gerçek ZIP CRC, 20 üye, manifest ve 19 runtime hash doğrulandı. H5 V2 paketinin 3173, H51 paketinin 2191 manifest girdisi hatasız doğrulandı. D1/D2 yalnız araştırma kanıtı olarak okundu.

2. REFERANSLAR VE YÖNTEM
H5 ve H51 ham kontrol kaynakları 19 runtime bakımından yayımdaki H5 ile eşleşiyor. Sekiz 120 aylık kontrol yeniden kullanılabilir bulundu; bunlar yeni koşu sayılmadı.
Yeni kanonik tekrarlar: seed11/240, seed404/240 ve 100 sistem/1 AI/seed11/120. Her aylık tam Save/RNG hash’i tarihsel kayıtla birebir eşleşti. Böylece 404=49 ve dört uzun kontrolde toplam62 referansının H5 için geçerliliği doğrulandı.
Normal/sarmal, 45 sistem/5 AI, konsey/kriz kapalı, varsayılan %35 AI kökeni; ayda60×0,5gün; 60.ay gerçek serialize/deserialize. Deney kaynakları izole tutuldu. Ek RNG çekimi veya seed’e özel dal eklenmedi.
İlk iki tanısal koşuda aiCount=5 açıkça yazıldığı için cfg alanı tarihsel Save ile farklıydı; bunlar ham Save eşitliği kanıtı sayılmadı. Default ile doğru tekrarlar yapıldı. İlk 100/1 çağrısındaki geçersiz boyut etiketi simülasyon başlamadan hata verdi; ulu=100 ile düzeltildi.

3. SEED404: TÜKETİM KRİZİNİN KÖK NEDENİ
Devlet7 ay107’de doğuyor; 150 tüketim malıyla, fabrikasız, iki uzun ve önceden ödenmiş kale işiyle başlıyor. Ay107 sonunda tüketim stoku141,96, aylık net−8,04. Ay113’te 170 maden ödenen fabrika, devam eden kale arkasında bekliyor; ilk fabrika ay122’de bitiyor fakat tüketimi tek başına karşılamıyor.
Ay125: maden73,18; net maden+6,38; tüketim0/net−5,19; yiyecek12,58/net−5,35. 170 madenlik fabrika finanse edilemiyor ve yiyecek açığı sürdürülebilirlik kapısını da engelliyor. Ay131’de 110 madenlik çiftlik alınıyor; maden1,19’a düşüyor.
Ay146: maden102,87; mevcut brüt maden+12,71, vassal vergisi sonrası öngörü+10,17; tüketim0/net−3,00. Fabrika için biriktirme süresi üç ayı aştığından mevcut aiRecoveryInvestment rezervasyon yapmıyor. Ay149’da ucuz maden yatırımı, fabrika finansmanını yeniden geriye itiyor.
Mekanizma: devralınan seri kuyruk ilk müdahaleyi geciktiriyor; düşük üretim, eşzamanlı gıda gereksinimi ve %20 vassal maden vergisi finansmanı yavaşlatıyor; üç aylık biriktirme kesimi daha ucuz yatırımların kritik fabrikayı ertelemesine izin veriyor. Peşin ödenmiş bina işleri ikinci kez ücretlendirilmiş görünmedi. Sorun yalnız stok düşüşü veya yalnız doktrin değil.
Aynı ay131 Save/RNG’den eşlenmiş yerel deney: kontrol ay132–167 arasında36 tüketim-kritik ay; A2 ay132–164 arasında33. İkinci fabrika siparişi ay161→157. Kanıtlanmış yerel kazanç3ay. Tam başlangıçtan A2 seed404/240: toplam49→32; bu17aylık toplam farkın tamamı tek yerel karara bağlanmadı.

4. SEED11: YENİ DEVLET MADEN DARBOĞAZI
Devlet7 ay218’de 400 madenle doğuyor; tek maden ve dört dökümhane devralıyor. İlk AI turundan önce stok324,16/net−25,84; yiyecek net−11,96. Önce 110 madenlik çiftlik, ay219’da 120 madenlik maden siparişi veriyor. Stok62,59’a, gerçek maden geliriyse−31,57’ye geliyor.
Tek maden bu girdi yükünü kapatamıyor. aiRecoverEconomy stok120’nin altındayken ve koloni işi yokken tüketici bina yıkabiliyor; çiftlik/maden kuyruğu ay223’e kadar bunu engelliyor. Dökümhaneler ay223/227/231’de sırayla sökülüyor. Gerçek mineral-kritik ay toplamı9; 219–228 aralığı kesintisiz9ay değildir, en uzun kesintisiz dönem6aydır.
Bu örnekte başlangıç stok yokluğu değil; devralınan üretim bileşimi, yiyecek/maden yatırım sırası ve kuyruk/toparlanma kapıları birlikte etkili. Sınırsız kaynak gerektiren bir kuruluş olduğu kanıtlanmadı.
A2 aynı doğumu ay218’de korudu fakat yeni devlet kritik aylarını9→11, en uzun maden dönemini6→7 çıkardı; son kritik ay228→234. Bu kötüleşme kabul edilmedi. Yeni devlet sağkalım/toparlanma iyileşmesi yayıma alınmadı.

5. 100 SİSTEM / 1 AI / SEED11: BİNA DÖNGÜLERİ
Pozitif aylık gelir, yeterli yatırım stoku anlamına gelmiyor. aiDemolitionChoice çoğunlukla çıkarılan binanın marjinal etkisine bakıyor; stok rezervi yetersiz bir dökümhaneyi de kaldırabiliyor. Yıkım iadesi ve boşalan slot sonrası ekonomik ihtiyaç listesi yeniden dökümhaneye dönüyor. Bina değiştirme niyeti fiilî sonraki yatırımı garanti etmiyor.
Ay52’deki aynı Save’den ay120’ye karşılaştırma: kontrol11, C2 adayı13 yıkım; 12ay içinde aynı tür sipariş görülen yıkım olayı7→2. Tek siparişi iki yıkıma saymayan birebir eşleştirme ile gerçek eşleşme6→2.
Bu birebir döngülerde yapım bedeli eksi gerçekleşmiş yıkım iadesi816→149 maden; biten eşleşmelerin toplam üretim kesintisi955→424 bina-gün. Kontrolde bir yeniden yapım dönem sonunda hâlâ tamamlanmamıştı. Bu nakit bileşenidir; tüm fırsat maliyetinin tek para birimiyle hesabı değildir.
Bütün bina siparişlerine ödenen maden2540→2080; kritik ay0→0; güç859→860. Yerel yatırım israfı azalırken yıkım sayısı arttı; genel kabul kanıtı sayılmadı.

6. YAYILMACI KOLONİLEŞTİRME
Mevcut prof.exp değeri koloni yatırım önceliğine bağlanmıyor; bu H5’te kanıtlanan bulgu korundu. H5’in reddedilmiş E1 yatırım-sırası adayı üretime taşınmadı.
Seed42/devlet5’te350 olumlu koloni finansmanı fonksiyonu çağrısı bulunuyor; bunlar350 ayrı, peşin ödenebilir fırsat değildir. Fonksiyon sürdürülebilirliği sınar; net gelir pozitifken geminin peşin bedelinin mevcut olup olmadığını tek başına kanıtlamaz. Temel koloni gemisi265 maden/60alaşım; bonuslarla gerçek fiyat ayrıca değişir.
Devlet5 ay1’de enerji kapısına; ay30’da119 maden/25alaşım ile bütçe rezervine; ay90’da10maden, ay120’de145maden ile kaynak maliyeti kapısına takılıyor. Askerî gemiler, bilim yenilemeleri ve yapılar aynı finansmanı kullanıyor.
Finanse edilmiş ve bütün diğer kapıları geçen fırsatların sistematik kaybı için güvenli yeni düzeltme kanıtlanmadı. Daha mantıklı kolonileştirme yayımlandığı iddia edilmez.

7. TEKNOKRASİ VE KİMLİK SÖZLEŞMESİ
D2 seed7/devlet2’de24–33.aylar arasında10 tüketim-kritik ay doğrulandı. Ay15’te santral sonrası maden10; ay18’de147,1; ay21’de63,1. İlk ek fabrika ay26’da179,5 maden varken alınabiliyor, ikinci ay30’da; üçüncü fabrika ay34’te tüketimi artıya taşıyor. Yükselen nüfus tüketimi, peşin finansman ve seri yapım gecikmesi ortak ekonomik kırılganlıklardır.
Bu iz, doğrudan laboratuvar siparişlerinin tek neden olduğunu kanıtlamıyor. D2’ye A2/C2 ile yeni kampanya yapılmadı; Teknokrasi krizinin çözüldüğü söylenemez. D2, sekiz doktrin ataması, dağıtım ağırlıkları ve Arındırıcı oranı değiştirilmedi.
82 Makine örneğinde seçili mizac/persLock yokken researchDoctrine kalıcı hükümetten Arındırıcı araştırmasını; personaOf etik/civic çıkarımından Kriminal veya Militarist davranışı kullanıyor. Bu mevcut teknik sözleşmedeki gerçek anlamsal ayrışmadır; seçili doktrin ihlali kanıtı değildir ve tasarım riski açık kalır. Eski Save devletleri dönüştürülmedi.

8. ADAYLAR VE KARAR NOKTALARI
A1: aiRecoveryInvestment biriktirme sınırı3ay→mevcut plan.horizon=6ay; hedefli ekonomik fayda yok, reddedildi.
C1: aiDemolitionChoice daha öncelikli ihtiyaç listesindeki binayı korusun; hedefli ekonomik fayda yok, reddedildi.
A2: yalnız sonlu ve gerçek pozitif gelirle finanse edilen beklemenin üst süre sınırı kaldırıldı; maliyet/viabilite kapıları korundu. Yerel404 kazancı var; uzun testte yeni devlet kötüleşmesi ve ticaret kaybı nedeniyle reddedildi.
C2: aiDemolitionChoice, mevcut rezervin altındaki kaynak üretimini normal slot değişimiyle azaltmasın; acil aiRecoverEconomy yolu ayrı kaldı. Yerel döngü kazancı ve120kapısı var; tek başına240kampanyası NOT RUN, yayıma uygun ilan edilmedi.
AC=A2+C2: birleşik120kapısı geçti; uzun ticaret koruma kapısı geçmedi. Reddedildi. Hiçbir üretim fonksiyonu kalıcı değiştirilmedi.

9. 120 AY: SEED BAZINDA KONTROL / A2 / AC
C2 ve AC sekiz seedin bütün aylık Save/RNG hash’lerinde birbirinin aynısıydı. Aşağıdaki AC sonuçları C2 için de aynıdır.
| Seed | Kritik K/A2/AC | Teslimat K/AC | Teknoloji K/AC | Koloni K/AC | Gemi K/AC | Güç K/AC |
|---|---:|---:|---:|---:|---:|---:|
| 11 | 0/0/1 | 84/82 | 29/32 | 12/13 | 104/111 | 14356/16113 |
| 7 | 5/5/5 | 46/96 | 51/54 | 16/19 | 188/219 | 23537/27940 |
| 23 | 1/1/1 | 0/0 | 29/29 | 10/14 | 135/156 | 21514/26676 |
| 42 | 2/2/1 | 58/72 | 42/38 | 15/13 | 142/155 | 20026/22894 |
| 99 | 0/0/0 | 57/55 | 47/45 | 20/20 | 187/209 | 26197/27258 |
| 123 | 3/3/3 | 56/50 | 44/41 | 16/17 | 166/170 | 24080/25066 |
| 404 | 2/2/0 | 154/169 | 49/47 | 19/21 | 251/230 | 31433/30080 |
| 2026 | 1/1/1 | 0/0 | 40/42 | 21/24 | 213/232 | 26652/29444 |
A2’nin sekiz seed toplamları kontrolle aynı:14kritik,455teslimat,50sözleşme,331teknoloji,129koloni,1386gemi,187795güç,81/26plan. Yedi seedde bütün aylıkSave/RNG aynı;404’te ilk farklı ay119, ancak120sonu toplam göstergeler aynı.
AC/C2 toplam:12kritik,524teslimat,59sözleşme,328teknoloji,141koloni,1482gemi,205471güç,76/25plan. Başlangıç devletlerinden yaşayan39/39; yaşayan toplam40→39. Yeni devlet doğmaması iyileşmiş toparlanma kanıtı değildir.
Seed42 AC: teknoloji42→38 ve koloni15→13 geriledi; güç20026→22894 yükseldi. Bu sapma saklanmadı.

10. 240 AY: KONTROL / A2 / AC
| Seed/adayı | Kritik | Teslimat | Sözleşme | Teknoloji | Koloni | Gemi | Güç | Plan T/B |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 11/K | 10 | 204 | 23 | 64 | 17 | 203 | 37262 | 20/7 |
| 11/A2 | 13 | 206 | 23 | 61 | 18 | 214 | 39451 | 21/7 |
| 11/AC | 9 | 155 | 18 | 67 | 16 | 189 | 41400 | 23/6 |
| 23/K | 1 | 20 | 2 | 72 | 28 | 148 | 73030 | 18/3 |
| 23/A2 | 1 | 20 | 2 | 72 | 28 | 148 | 73030 | 18/3 |
| 23/AC | 2 | 0 | 0 | 84 | 32 | 314 | 80270 | 13/2 |
| 42/K | 2 | 132 | 11 | 93 | 25 | 261 | 63537 | 10/5 |
| 42/A2 | 2 | 132 | 11 | 93 | 25 | 261 | 63537 | 10/5 |
| 42/AC | 3 | 250 | 16 | 87 | 21 | 282 | 71291 | 10/7 |
| 404/K | 49 | 717 | 54 | 121 | 29 | 395 | 75500 | 17/9 |
| 404/A2 | 32 | 525 | 38 | 117 | 28 | 400 | 71158 | 15/9 |
| 404/AC | 0 | 503 | 33 | 117 | 25 | 355 | 67252 | 8/5 |
Kontrol toplam:62kritik,1073teslimat,90sözleşme,350teknoloji,99koloni,1007gemi,249329güç,65/24plan.
A2 toplam:48kritik,883teslimat,74sözleşme,343teknoloji,99koloni,1023gemi,247176güç,64/24plan. Teslimat koruması%82,29; FAIL. Seed11 yeni devlet9→11kritik; FAIL.
AC toplam:14kritik,908teslimat,67sözleşme,355teknoloji,94koloni,1140gemi,260213güç,54/20plan. Teslimat koruması%84,62; FAIL. %85 için en az913teslimat gerekir.
AC seed404’te yeni devlet7 doğmadı:49→0kritik sonucuna “aynı devletin krizi çözüldü” denmedi. AC seed11’de de kontrolün ay218 doğumu yok. A2 seed404 doğum7=107’yi korudu; uzun dönemde32kritik, en uzun27ay kaldı. Yalnız aynı kayıt deneyindeki3ay doğrudan yerel karar kanıtıdır.
A2 uzun koşuları paralel başlamıştı; red değerlendirilirken tamamlanan dört koşu korunmuştur. Reddedilen birleşik adayın tam regresyonu durduruldu. Sonradan eşik/seed/tuz değiştirilmedi.

11. TESTLERİN GERÇEK DURUMU
Yeni hedefli motor paketi AC:17PASS/0FAIL. Aynı paket kanonik kontrolde15PASS/2FAIL; iki FAIL talep edilen yeni davranışı mevcut kodun sağlamadığını gösteren karşılaştırmalı kırmızı testlerdir.
17 testin8’i sekizseedde tam kanonik başlangıç, ikinci deterministik başlangıç/RNG ve gerçek Save8 normalizasyonudur. Diğerleri finanse edilmiş bekleme, sıfır/negatif gelir, gerçek ödeme, üretici rezervi, geçerli yıkım ve gerçek iade davranışlarıdır.
Birleşik adayın durdurulan regresyonunda46tamamlanmış paket/4090PASS/0FAIL var. Tam133paketlik regresyon tamamlanmadı; buna tam regresyon PASS denmez. Yeni adayın 17 sonucu ayrı tutulur; eski6028 veya252 sayıları yeni sonuçlara eklenmedi.
Kampanyalar:24tam120ay aday koşusu;8tam240ay aday koşusu;3kanıtlı tarihsel kanonik tekrar;eşlenmiş yerel/teşhis koşuları ayrıca kanıtta. Her aday120/240kampanyasında60.ay gerçekSave8yüklemesi yapıldı. Kaynak ve protokol eşleşmeleri kayıtlı.
C1 hedefte etkisiz; A1 hedefte etkisiz. A2 ve AC kabul kapıları FAIL. Chromium/PWA NOT RUN: mevcut Playwright Chromium yolu var fakat yürütülebilir dosya yok. FizikselAndroid NOT RUN. Yeni tarayıcı testi veya ekran görüntüsü iddia edilmez.

12. KORUNAN MEKANİKLER
19runtime ve release manifesti kanonik H5 baytlarına geri döndürüldü. Hükümet/doktrin/ırk/etik/civic/köken, RNG, Save8, federasyon/vassallık, diplomasi/ticaret/casusluk/araştırma ve oyuncu ekonomisi değişmedi. Yeni kalıcı kayıt alanı, gizli yardım veya seed istisnası yok.
GitHub’a yalnız araştırma belgeleri, aday yamaları, protokol ve sonuç kayıtları eklenir. Üretim AI’sı güçlenmiş veya davranışları gerilemiş sayılmaz; üretim aynı H5’tir.

13. DOSYALAR, HASH VE MANİFEST
Yeni stars-faz96h6.zip ve RELEASE-96H6.json ÜRETİLMEDİ; başarısız adaylar onaylı oyun olarak paketlenmedi.
Araştırma kanıtı: stars-faz96h6-kanit.zip; Son teslim raporundaki bayt; SHA-256 Son teslim raporundaki; Son teslim raporundaki üye; CRC ve bütün üyeSHA-256 PASS. EVIDENCE-MANIFEST.json gerçek dosya boyut/hash/CRC listesini içerir.
Paket: kanonik runtime, reddedilmiş aday kaynakları/yamaları, sürücüler, gerçek ham kampanya/Save/karar izleri, kullanılan eski kontrol girdileri, yeni hedefli testler, kısmi regresyon logları, protokoller ve GitHub doğrulaması. Eski tüm yüzlerceMB paketler tekrar iç içe eklenmez; doğrulanmış kaynak kimlikleri korunur.

14. GITHUB DURUMU
Başlangıç c7700b787ffbd355d7e4e8fb8808537218d463c4. Son araştırma commit’i Araştırma commit kimliği son teslim raporundadır. force kullanılmadı. Yayın sonrası HEAD ve19runtime/manifest/korunanZIP yeniden doğrulandı. GitHub’da yeni oyun sürümü yok; yalnız araştırma kaydı var.

15. AÇIK SORUNLAR VE SONRAKİ FAZ
Öncelik1: yeni devletin gerçek üretim/girdi bileşimiyle yapılacak tek ekonomik plan; gıda yatırımı, maden üretimi ve girdi azaltımının kuyruk bitiş tarihleriyle birlikte değerlendirilmesi. Erken kaynak yardımı verilmemeli.
Öncelik2: sonlu tasarruf beklemesine yalnız ucuz yatırımın geciktirme maliyeti değil, diğer kritik kaynakların ve yeni devletin yaşayabilirlik köprüsü de bağlanmalı. Sadece3→6veyaüst sınırı kaldırmak genel çözüm değil.
Öncelik3: bina değiştirme kararı, sökülen binanın iadesi sonrası fiilî yeniden yatırım ve üretim kesintisiyle sınanmalı; salt stok rezervi koruması genel ticareti korumadı.
Öncelik4: Yayılmacı için gerçek gemi bedeli+tersane bütçesi+güvenli hedef+koloni yaşayabilirliğini aynı anda sağlayan fırsatları kaydetmek. Sadece olumlu aiColonyForecast sayısını artırmak başarı değildir. Doktrin dağıtımı ve82kimlik kararı ayrı fazda kalmalı.

16. NET CEVAPLAR
Seed404 sebebi: seri devralınmış kuyruk, yetersiz tüketim üretimi, düşük ve vergili maden finansmanı, eşzamanlı gıda gereksinimi ve kısa biriktirme kesimi birlikte.
Kriz azaltıldı mı? Deneyde evet: aynı kayıtla3ay; tam A2kampanyasında49→32. Güvenli genel çözüm yayımlanmadı.
Yeni devlet toparlanması gelişti mi? Yayımlanmış gelişme yok; A2 seed11’i kötüleştirdi.
Yıkım/yeniden kurma azaldı mı? YerelC2deneyinde birebir6→2; toplam yıkım arttı, genel ticaret kapısı korunamadı.
Yayılmacı daha mantıklı mı? Kanıtlanmış yeni kolonileştirme davranışı yok.
Teknokrasi kırılganlıkları kaldı mı? Evet; tüketim finansmanı ve yapım gecikmesi çözülmüş sayılmadı.
AI daha güçlü mü? Üretimde değişmedi. Bazı adaylarda güç artsa da ticaret veya yeni devlet ekonomisi bozuldu; daha çok işlem başarı sayılmadı.
Önemli mekanik geriledi mi? Reddedilmiş adaylarda ticaret/yeni devlet sorunu var; üretim runtime’ı değişmedi.
GitHub’da gerçekten96H.6oyunu yayımlandı mı? Hayır.96H.5korundu; araştırma sonucu teslim edildi.
