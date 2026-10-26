STARS — FAZ96H.5.1 SONUÇ RAPORU
SONUÇ:Yeni oyun sürümü yayımlanmadı. İki minimal atama adayı kalite kapısını geçemedi;96H.5korundu.
1. KANONİK KAYNAK VE GITHUB DOĞRULAMASI
sarsiss12-dot/Star main başlangıçHEAD47a4fb7b9c5387c6fc21e3a03cd96d776ed023c8;oyun96H.5;build96h5;PWAstars-v96h5;Save8. RELEASE-96H5.json,RELEASE-MANIFEST.json,19runtime ve gerçek756007bayt oyunZIP’i doğrulandı. SHA-256fa50f80f7f214d56e779e63a5a8a2382574e381b78ea5c63da4a76d24b4c7cf9;CRC temiz;20üye=19runtime+manifest. AI SHA-25627ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739. H5V2kanıt327836454bayt/SHA269126a13b1db22b4294491c7d0f658110bbc688c7d8da69a6f5d3dee561099cgeri alındı;CRC ve seçilen üye hash’leri doğrulandı. Eski kampanyalar kaynakları eşleşen referans olarak yeniden kullanıldı;yenidenkoşu diye sayılmadı.
2. DOKTRİN ATAMA SİSTEMİNİN GERÇEK ÇALIŞMA BİÇİMİ
setupGame önce galaksiyi ve hükümet/ırk sırasını oluşturuyor;makeEmpire stok ve temel kimliği kuruyor. Eski otomatik AI’da mizac/persLock yazılmıyor. assignAIOrigins ayrı tohumlu akışla çalışıyor;assignAIIdentities başka özel akışla dört etik,civic ve genetik özellik atıyor. personaOf seçili mizac/persLock varsa onu;aksi halde hükümet varsayılanını ve etik/civic çıkarımlarını kullanıyor. researchDoctrine ise seçili kimlik yoksa kalıcı hükümet varsayılanına dönüyor. DOCTRINE_RACE varsayılan hükümet eşlemesi;fizyoloji ayrı bileşen. Oyuncunun seçili doktrini farklıdır ve değiştirilmedi.
3. TEKNOKRASİ/KUTSAL MECLİS NEDEN GÖRÜNMÜYORDU?
Teknokrasi hükümetinin eski pers değeri tuccar;yanındaki açıklama eski beş-persona döneminden kalmış. Meclis hükümetinin pers değeri pasifist. personaOf otomatik çıkarımlarında teknokrasi/teokrasi üreten yol yok. Dolayısıyla sekiz PERSONAS tanımı ve DOCTRINE_RACE eşleşmesi bulunsa da otomatik başlangıç havuzu bu ikisine ulaşmıyor. Sorun AI savaş/ticaret algoritmasının yokluğu değil,başlangıç kimliği bağlantısıdır.
4. KRİMİNALİN ARAŞTIRMA KİMLİĞİ AYRIŞMASI
Seçili doktrin yokken ahl<=−2,öncelikli militarist/pasifist/civic çıkarımları izin veriyorsa Kriminal persona üretiyor. researchDoctrine bu geçici çıkarımı izlemez;hükümet varsayılanında kalır. Eski384Kriminalin araştırma doktrini0olmasının nedeni budur. D2gerçek seçiliKriminal108kez üretti;bu108kimlikte persona/araştırma/seçili doktrin aynıydı. Kalan çıkarımlıKriminaller otomatik olarak seçili doktrine çevrilmedi.
5. 611AYRIŞMANIN SINIFLANDIRILMASI
Taze kontrol256seed/2816AI eski611farkı aynen doğruladı. Tamamında seçili mizac/persLock yoktu. Mevcut araştırma sözleşmesine göre611hükümet-araştırması/çıkarımlı-davranış farkı;0başlangıç önbellek farkı;0kanıtlanmış seçili-doktrin mekanik ihlali;0bildirilmiş araştırma sözleşmesine aykırı erişim. Bu tarihsel tasarım niyetinin kesin kanıtı değildir;mevcut fonksiyonların açık sözleşmesine göre sınıflandırmadır.611farkın hepsine otomatik hata denmedi.
Alt küme olarak82Makine devletinde Arındırıcı araştırma kimliği fakat açık çıkarımlı politika bulunuyor. Bu gerçek anlamsal tasarım riski açık bırakıldı;düzeltilmiş gösterilmedi. Seçili doktrin yokken mevcut erişim fonksiyonu kuralını ihlal etmiyor;bu82yi zorla Arındırıcı yapmak oranı272→354yükseltir ve eski kayıt/diplomasi davranışını değiştirir. Bu dönüşüm yapılmadı.
D2fark sayısı611→545oldu;66fark açık seçimin atanmasıyla ortadan kalktı. Yeni seçili doktrinlerde yanlış persona/araştırma veya özel teknoloji erişimi0. Amaç hükümet/etik/doktrini zorla tek değere indirmek değildi.
6. DEĞİŞTİRİLEN FONKSİYONLAR VE DOSYALAR
Yalnız aday main.js’de AI_DOCTRINE_CHOICES,assignNewAIDoctrine ve makeEmpire içindeki tek çağrı denendi. Mevcut mizac/_pers alanları kullanıldı;yeni kalıcıSave alanı eklenmedi. Seçim mevcut hükümeti/fizyolojiyi değiştirmeyen özel identityHash/mulberry32 akışından yapıldı;canlı veya yapısalRNG çekilmedi. PERSONAS bonusları,DOCTRINE_RACE,personaOf,researchDoctrine,oyuncu seçimi ve AI karar kodları değiştirilmedi.
Adayların build96h51/cache stars-v96h51 kimlikleri yalnız izole deney kaynaklarında kullanıldı. Reddedilince main.js,sw.js ve manifest kanonik96H.5baytlarına döndürüldü. ai.js,economy.js,diplomacy.js,commerce.js,ui.js,index.html ve diğer motor dosyaları hiç değiştirilmedi. Aday testleri üretim test klasörüne yayımlanmadı.
7. SEKİZ DOKTRİNİN ESKİ/YENİ DAĞILIMI
Aşağıdaki yeni değerler deneyselD2’dir;yayınlanan oyunun dağılımı değildir. Aynı256seed×11AI=2816devlet;30sistem,sarmal,Normal,konsey/kriz kapalı.
| Doktrin | Eski persona | D2persona | Eski% | D2% | Eski araştırma | D2araştırma |
| --- | --- | --- | --- | --- | --- | --- |
| Militarist | 376 | 376 | 13.35 | 13.35 | 347 | 347 |
| Tüccar | 503 | 346 | 17.86 | 12.29 | 692 | 485 |
| Pasifist | 778 | 664 | 27.63 | 23.58 | 698 | 584 |
| Yayılmacı | 503 | 503 | 17.86 | 17.86 | 725 | 725 |
| Teknokrasi | 0 | 99 | 0.00 | 3.52 | 0 | 99 |
| Kriminal Sendika | 384 | 442 | 13.64 | 15.70 | 0 | 108 |
| Kutsal Meclis | 0 | 114 | 0.00 | 4.05 | 0 | 114 |
| Fanatik Arındırıcı | 272 | 272 | 9.66 | 9.66 | 354 | 354 |
Görülen persona6→8;Shannon çeşitlilik ölçüsü2,506→2,797bit. Bu örneklem çeşitliliğidir,AI kalitesi değildir. D2yalnız üç ilgili hükümette eski çıkarımı2ağırlık,yeni uygun açık doktrini1ağırlıkla seçti;null eski çıkarımı korur. Küresel sekiz eşit olasılık veya her galakside sekiz doktrin zorlaması yok.
8. FANATİK ARINDIRICI ORANI VE DENGE
272/2816=%9,6591→aynı272/%9,6591. Yeni Arındırıcı adayı havuza eklenmedi. Bonuslar,diplomasi/ticaret/pazar yasakları,bedeller ve köken kuralları aynı. Bu dağıtım oranının korunduğunu gösterir;ayrı kazanma-oranı turnuvası yapılmadı.
9. GEÇERLİ ETİK/CIVIC/TÜR/HÜKÜMET KOMBİNASYONLARI
D2’nin321yeni açık seçimi99Teknokrasi,108Kriminal,114Kutsal;hepsi mevcut DOCTRINE_RACE hükümetiyle eşleşti. Geçersiz açık eşleşme,civic,genetik özellik ve etik bütçesi sayısı0. Aynı2816devlette hükümet,fizyoloji,etik,civic,özellik,köken,başlangıç stoku ve başkent değişimi0. Tüccar doktrini+Pasifist etiği geçerli kaldı. Diğer beş eski hükümet şablonu ve çıkarımlı kimlikleri korunuyor.
10. SAVE8,REFORM VE YENİ DEVLET KİMLİĞİ
Yeni otomatik kimliklerin Save8yüklemesinde korunduğu ve seçili doktrinin ücretli etik reformuyla sessizce değişmediği doğrulandı. Üç ilgili hükümette gerçek secede çağrısı yeni devlet kimliğini ve karşıt etiği korudu. Diğer özel olay doğumları için ayrı turnuva NOT RUN.
Kanonik96H.5motorundan gerçek eski otomatikSave8fixture üretildi. Adayda yüklenince tam normalize serialize SHA-256 veRNG kanonik yükleme sonucuyla aynıydı;eski seçimsiz devletlere doktrin yazılmadı. Mevcut oyuncu doktrinlerinin sekizi Save8turunu geçti.
11. DETERMINİSTİK BAŞLANGIÇ
D2’nin256seedinin her biri tamSave/RNG ile ikinci kez üretildi:256/256aynı. Kontrol veD2arasında256başlangıcın haritası,hiperuzay bağlantıları,başkentleri,oyuncusu ve ilkRNG’si aynı. Karar karşılaştırmalarındaki sekiz45sistem/5AIbaşlangıcında da temel kimlik,harita,başkent veilkRNG eşitliği ayrıca doğrulandı. Doktrinlerin mevcut gerçek bonusları değişebildiğinden tüm başlangıçSave’lerinin eşit olması beklenmedi.
12. HEDEFLİ AI DAVRANIŞ TESTLERİ
D2üzerinde üç benzersiz paket:43yeni kimlik/Save/araştırma/kurucu testi +43mevcutH5motor doktrin testi +22mevcutE1kimlik testi =108PASS/0FAIL. Tekrarlanan pilot testler toplama eklenmedi. Bunlar gerçek oyunJS fonksiyonlarını kullanan deterministikVM/DOM-host testleridir;Chromium değildir.
40seedlik mevcutE1civic/genetik dağıtım çıktısı taze kanonik kontrolle ayrıca karşılaştırıldı ve aynıydı;bu ayrı kontrol108’e eklenmedi. İlk iki kampanya başlatması sürücü dosyası hazırlanırken dosya-yok hatası verdi;oyun simülasyonu başlamadı. Loglar saklandı ve doğru kaynakla tamamlanan koşular kullanıldı.
13. GERÇEK120/240AYLIK KAMPANYALAR
D1:önce11/404/42üç120aylık pilot. Teslimat296→235,oran%79,39;önceden belirlenen%85koruma sınırının altında. Tam sekiz-seed matrisi ve240ay çalıştırılmadı.
D2:aynı üç pilotun ardından kalan beşseed. Eşik aşıldığında iki koşu zaten çalışıyordu ve tamamlandı;sonuçta sekiz120ay verisi var. Normal/sarmal/default45sistem5AI;konsey/kriz kapalı;varsayılan%35AIkökeni;ayda60yarımgün;60.ay gerçekSave8serialize/deserialize.
| Seed | Kritik eski/D2 | Teslimat eski/D2 | Teknoloji eski/D2 | Güç eski/D2 | Plan T/B eski→D2 |
| --- | --- | --- | --- | --- | --- |
| 11 | 0/0 | 84/84 | 29/29 | 14356/14356 | 11/4→11/4 |
| 7 | 5/14 | 46/114 | 51/54 | 23537/28680 | 11/2→11/0 |
| 23 | 1/1 | 0/0 | 29/29 | 21514/21514 | 10/2→10/2 |
| 42 | 2/2 | 58/58 | 42/42 | 20026/20026 | 5/4→5/4 |
| 99 | 0/0 | 57/57 | 47/47 | 26197/26197 | 12/3→12/3 |
| 123 | 3/3 | 56/56 | 44/44 | 24080/24080 | 17/0→17/0 |
| 404 | 2/9 | 154/170 | 49/43 | 31433/31265 | 7/5→6/4 |
| 2026 | 1/1 | 0/0 | 40/40 | 26652/26652 | 8/6→8/6 |
D2kritik toplam14→30;önceden kaydedilmiş ençok22kapısını geçmedi. Bu yüzden yeni240ay,yoğunluk ve tam regresyon NOT RUN. Eski240ay62kritik,yoğunluk31yalnız96H.5referansıdır;bu fazın yeni ölçümü değildir.
14. EKONOMİ,TİCARET,BİLİM,FİLO VE STRATEJİ
| Ölçü | Kanonik kontrol | D2 |
| --- | --- | --- |
| Kritik devlet-ay | 14 | 30 |
| Teslimat | 455 | 539 |
| Sözleşme | 50 | 60 |
| Teknoloji | 331 | 328 |
| Koloni | 129 | 136 |
| Gemi | 1386 | 1418 |
| Askerî güç | 187795 | 192770 |
| Tamamlanan plan | 81 | 80 |
| Başarısız plan | 26 | 23 |
Ticaret+%18,46;güç+%2,65;teknoloji−%0,91;tamamlanan plan−%1,23. Ekonomik kritik süre+16ay. Filo/ticaret korunmuş olsa da önceden belirlenen ekonomi kapısı aşılınca aday kabul edilmedi. Başlangıç devletlerinden dönem sonunda hayatta kalan39→39;toplam yaşayanAI40→40.
Kritik ayrımı:başlangıç devletleri12→21,yeni devletler2→9. Seed7’de yeniTeknokrasi devlet2tüketim krizi24–33arası10ardışık ay;devlet3’te23–26arası4ay. Eski seed7toplam5aydı. Seed404’te yeni devlet7doğumu107→97;kriz119yerine112’de başladı ve120sonunda sürüyordu. Ek7ay erken doğum/başlangıç bağlamı değişimidir;doğrudan yeni bir AIalgoritmasının etkisi denmedi.49aylık uzun krizin kısaldığı iddia edilmedi;aday240NOTRUN.
Altıseedde11/23/42/99/123/2026tam başlangıçSave,her aylıkSave/RNG ve bütün eylem izleri kontrolle aynı. Farklarseed7ve404’te:ilk aylıkRNG ayrımı sırasıyla1ve3. İlk kayıtlı eylem farklılıkları kanıtta saklandı;uzak sonuçlar tek ilk karara nedensel bağlanmadı.
15. REGRESYON,CHROMIUM VE ANDROID
Yeni sonuç yalnız hedefli3paket/108PASS/0FAIL. Tam134paketlik aday regresyonu NOT RUN:iki aday da önceki kampanya kapısını geçemedi;yayın adayı kalmadı. Yayındaki133paket/6028PASS ve önceki252Chromium yalnız referans;bu fazın yeniPASS sayısı değildir.
Chromium yürütülebilir dosyası bulunmadı. Bir resmî kurucu denemesi geçerliZIP indiremedi;log saklandı. GerçekChromium/PWAyenidenkoşumu NOT RUN;fizikselAndroid NOT RUN. Kaynak/VM kontrolleri gerçek tarayıcı veya Android testi diye sunulmadı.
16. KABUL/REDDEDİLEN DEĞİŞİKLİKLER
Kabul edilen üretim değişikliği:yok. D1teslimat kapısı,D2ekonomi kapısı nedeniyle reddedildi. Doktrin bonusları yeniden dengelenmedi;savaş/ticaret/filo/ekonomiAI’sı yeniden yazılmadı. Eşikleri sonuçtan sonra gevşetmek,özelseed seçmek veya rastgele akışın tuzunu değiştirmek yapılmadı.
D1/D2hükümet/fizyoloji/köken/stok kurallarını bozmadan erişim sorununu teknik olarak çözdü;bu yerel başarı güvenli genel yayın kanıtı sayılmadı. Denenen iki adayın reddi,bütün olası dağıtım çözümlerinin imkânsız olduğu anlamına gelmez.
17. OYUN/KANIT ZIP’İ,BOYUT VE SHA-256
Yeni96H.5.1oyunZIP’i üretilmedi;reddedilen kod yeni oyun diye sunulmadı. Korunan gerçek oyun:stars-faz96h5.zip;756007bayt;SHA-256fa50f80f7f214d56e779e63a5a8a2382574e381b78ea5c63da4a76d24b4c7cf9;CRC/19runtime/20üyePASS.
Oyun:https://github.com/sarsiss12-dot/Star/raw/82cec8632e2076002755e8ee5fb44b91e1895892/releases/stars-faz96h5.zip
Araştırma/kanıt:stars-faz96h51-arastirma-kanit.zip;68598809bayt;SHA-256e1e44897cd4c68d76855aa6b3b61d05efb2be398214d8d033df15ae5255c78a9;2192üye;CRC ve bütün üyeSHA-256kontrolleriPASS. Manifest:EVIDENCE-MANIFEST.json. Link:https://chatgpt.com/library?file_id=libfile_9b1e7331e5c88191851cb20f0feae10b&account_id=personal. Paket reddedilmiş aday kaynaklarını içerir;onaylı oyun değildir.
18. GITHUB COMMIT VE YAYIN DURUMU
96H.5.1oyun yayını:yok. Yayımdaki sürüm96H.5/build96h5/cache stars-v96h5/Save8. Reddedilen main.js/sw.js/manifest üretime taşınmadı. Araştırma belgeleri varsa ayrı docs/research commit’iyle,HEAD yeniden okunup expected-SHA/force=false korumasıyla eklenir. Bu belge yalnız araştırma sonucu ve kanıt kaydıdır. Araştırma commit kimliği son teslim mesajında verilir;19runtime,RELEASE-96H5.json,RELEASE-MANIFEST.json veoyunZIP’i kanonik sürümle aynı kalır.
19. AÇIK SORUNLAR VE NET CEVAPLAR
Teknokrasi/Kutsal rastgele oluşabiliyor mu? DeneyselD2’de evet99/114;yayındaki96H.5dağıtımı değişmedi.
Dağılım çeşitlendi mi? Deneyde6→8persona;yayında henüz hayır.
Kriminal farkı bilinçli mi,hata mı? Mevcut kodda çıkarımlı davranış ile kalıcı hükümet araştırması ayrıdır. Yeni açıkKriminal seçiminde kimlikler tutarlıydı. Tarihsel niyet kanıtı varmış gibi söylenmedi.
611’in kaçı gerçek sorun? Seçili doktrin/erişim sözleşmesi ihlali kanıtı0,başlangıç önbellek farkı0.611katman farkı var;82Arındırıcı-araştırma/açık-politika örneği ayrıca tasarım riski olarak açık ve düzeltilmemiştir.
Arındırıcı dengesi? Deneyde başlangıç sayısı/oranı aynı;bonus/yasaklar değişmedi. Üretim sürümü de aynı.
AIkalitesi bozuldu mu? DeneyselD2ekonomik kritik süreyi artırdı;diğer göstergeler çoğunlukla korundu/iyileşti. Bu değişen başlangıç kimliği karşılaştırmasıdır,genel AIalgoritması üstünlük/gerileme ispatı değildir. Reddedildiğinden üretimde kalite değişmedi.
Save8/mekanikler? Hedefli aday testleri geçti;üretim19runtime ve manifest tam kanonik baytlarda korundu.
GitHub’da yeni sürüm var mı? Yeni oyun sürümü yok;yalnız araştırma belgeleri ve doğrulama kaydı.
20. 96H.6İÇİN KESİN HEDEFLER
1)Kanonikseed404devlet7’nin49aylık krizinde mevcut ücretli kuyruk,gerçek tüketim kapasitesi ve fabrika finansmanı izlenmeli. D2’nin erken doğumu toparlanma başarısı diye kullanılmamalı.
2)Kanonikseed11yeni devletinin maden darboğazı aynıSave/RNG’de incelenmeli;bu fazda240koşulmadı.
3)100/1seed11yıkım/yenidenkurma döngüsünde gerçek net maliyet,üretim kesintisi ve askerî güç birlikte ölçülmeli;eski başarısız kör niyet belleği geri getirilmemeli.
4)Yayılmacı için uygun hedef+finanse edilebilir koloni gemisi fırsatlarının yatırım sırasını ölçmek;ücretsiz gemi/koloni veya seed’e özel eşik eklememek.
5)Doktrin dağıtımını tekrar yayıma almadan önce seed7Teknokrasi’nin tüketim finansmanı dayanıklılığını çözmek veya daha geniş,önceden belirlenmiş örneklemde kabul edilebilir stratejik maliyeti değerlendirmek. Bilinen kötüseedleri atlayacak ağırlık/tuz ayarı yapılmamalı.
6)82Makine/Arındırıcı araştırma ayrımında önce açık tasarım kararı:kalıcı araştırma kimliği mi,yoksa sert doktrin kuralları mı esas? Karar olmadan eski kayıtları dönüştürmemek.
