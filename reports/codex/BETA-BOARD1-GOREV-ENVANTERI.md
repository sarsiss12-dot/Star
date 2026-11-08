# BETA-BOARD.1 — kod ve görev envanteri

Kaynak p15 `955c2445bb9f7837653bc372f9e8262ded6803d1`; takip numaraları **Issue #33 panosunun görev ID’leridir**, ayrı GitHub issue numarası sanılmamalı. Pano okuma/yazma API’si Forbidden döndü; aşağıdaki tablo yerel kod/kanıt envanteri ve durum önerisidir, GitHub’da uygulanmış durum değildir. Kullanıcı kabulü bulunmadığından hiçbir satır TAMAMLANDI değildir. Son komut ve sayımlar ana sonuç raporundadır.

| Pano görevi | Gerçek kod durumu / bu fazın işi | Kabul ve açık sınır | Yerel aşama önerisi (GitHub’a yazılmadı) |
|---|---|---|---|
| #50 Federasyon gündem kuyruğu | Yeni: tek sınırlı FIFO; mevcut law/motion/war/application girişleri; açılışta tekrar doğrulama, ücret, geri çekme, kayıt, izinli mirror | Motor + gerçek üç insan + yeni oda kabulü esas; kullanıcı PC onayı bekler  KULLANICI ONAYI BEKLİYOR |
| #38 Mevcut federasyona üye kabulü | Üye oylaması ve ayrı aday rızası önceden vardı; yeni oylamalı yolda bütün üyelerle ittifak şartı kaldırıldı; aynı kuyruk | Eski doğrudan davetler kendi eski koşulunu korur; savaş/vasallık/charter değişimi tekrar doğrulanır  KULLANICI ONAYI BEKLİYOR |
| #10 MP hız | Kanıtlı aynı-want/held komut reddi düzeltildi. İstenen/uygulanan hız ve neden, ad bildirimi mevcut MP61’den | Diğer tarihsel hız/bağlantı gözlemlerinin tamamı çözülmüş sayılmaz  KULLANICI ONAYI BEKLİYOR |
| #5 Savaşın hızı durdurmaması | MP’de wardec/warstart karar cap’i oluşturmaz; SP tercihi ve gerçek ağ/arka plan/oyun sonu korumaları korunur | Yeni kuralın yerel testleri; fiziksel kabul yok  KULLANICI ONAYI BEKLİYOR |
| #25 Düşmansız büyük filo kaybı | İnceleme: 500 gemi, split/merge, Save8 ve mirror korunur; meşru radyasyon imhası ayrı doğrulandı | Özgün yaklaşık100K kullanıcı kaydı yok, vaka AÇIK; savaş algoritması değiştirilmedi  PLANLANDI / AÇIK |
| #24 Enerji sapması | İnceleme: stok0, net−8505.63 kontrollü durumda clamp0/kriz ve aynı misafir sonucu | Özgün vaka yeniden üretilemedi, AÇIK; üretim veya ekonomi dengesi değiştirilmedi  PLANLANDI / AÇIK |
| #23 Tersane düğmeleri | Mevcut bağımsız qbox kullanılır; masaüstü uzun kuyrukta doğrulanan kayma için üretim kontrolleri kuyruğun önüne alındı | 0/1/21 native UI geometri ve MP kontrolü  KULLANICI ONAYI BEKLİYOR |
| #15 Üretim iptali | İptal/iade motoru zaten vardı. Kanıtlı sıra-indeksi yarışı oturumluk host sipariş belirteciyle düzeltildi; DOM aynı tokenı kullanır | Yanlış gemi, bayat belirteç, yabancı yetki ve çift iade testleri; Save8 alanı eklenmez  KULLANICI ONAYI BEKLİYOR |
| #17 Filo sahipleri OFF | Önceden doğru: drawFleetOwnerLabels kapatılır, drawFleet sürer | Mevcut native Canvas ve UI regresyonu; yeniden yazılmadı  KULLANICI ONAYI BEKLİYOR |
| #20 ROTA hedefi | 76×44 CSSpx minimum; seçili şeritte aynı içerik tekrar innerHTML ile koparılmaz, ortak surfaceRender | Dünya/kamera/rota/interpolasyon algoritmaları aynı  KULLANICI ONAYI BEKLİYOR |
| #18 Renk paleti | Kullanıcı paleti12→24; renk numarası/hex erişilebilir etiketi; AI otomatik paleti değiştirilmedi | Eski kayıt rengi aynı; renk körlüğü açısından tüm çiftler fiziksel onaylı değildir  KULLANICI ONAYI BEKLİYOR |
| #22 Sahipsiz sınırdan diplomasi | Yalnız canlı görülen veya kendi sahiplik belleğinde bulunan ve temaslı komşuya kısayol | Bilinmeyen kimlik açılmaz; guest salt okunur eylem listesiyle test edilir  KULLANICI ONAYI BEKLİYOR |
| #26 Konsey spamı | Mevcut councilSweep/not kimlikleri incelendi; yeni kanıtlanmış spam nedeni bulunmadı | AÇIK/yeniden üretim gerekli; p15 federasyon tekilleştirmesi yeniden yazılmadı  PLANLANDI / AÇIK |
| #28 Enerji cezası açıklaması | Gerçek clamp, enerji krizi, istikrar hedefi−22 ve büyüme durması mevcut Devlet bilançosunda açıklanır | Yeni ceza yok; ayrıntı başlığı gerçek UI’da açılır  KULLANICI ONAYI BEKLİYOR |
| #29 Alaşım açıklaması | Gerçek0alt sınırı,500 otomatik donanma eşiği ve ödenmiş sipariş kuralı açıklanır | Yeni ceza/filo silme kuralı yok  KULLANICI ONAYI BEKLİYOR |
| #32 İnsan ittifakı | Mevcut diploAct→ortak müzakere→host offer/respond yolu yeniden kullanılır; yeni diplomasi motoru yok | Yerel insan kabulü ve mevcut core testleri; bütün karşı-teklif/ret varyantları bu fazda yeni UI kabulü sayılmaz  TEST BEKLİYOR / KISMEN |
| #19 Yoğun koloni tablosu | Mevcut p_imp koloni listesi/ekonomi merkezi var; istenen kalıcı sol yoğun tablo **uygulanmadı** | AÇIK. Önce ekonomi ledger kaynaklarıyla satır başına gerçek net katkı/üretim/tüketim sözleşmesi; sonra ortak pane/sağ panel entegrasyonu  PLANLANDI / AÇIK |
| #7 Kuşatma engelleri | p_sistem/planetConflictStates mevcut kalkan, garnizon, bombardıman/işgal gösteriyor | KISMEN; bütün engeller ve güvenilir ETA kabulü NOT RUN, yeni fetih kuralı yok  PLANLANDI / AÇIK |
| #9/#35 İsyan açıklaması/harita | Mevcut secede sayacı, savaş/istikrar bilgileri var | İstenen toplu neden ve harita uyarısı tamamlanmadı. Bilinmeyen casus kaynağı açık edilmeden actor-safe DTO tasarlanmalı  PLANLANDI / AÇIK |
| #46 Gezegen engelleri | canColonize ve çatışma bilgileri mevcut | Her reddin görünür birleşik açıklaması tamamlanmadı; kolonizasyon/fetih için iki ayrı salt-okunur quote gerekli  PLANLANDI / AÇIK |
| #30 Saydam arma | Mevcut emblemler ve harita etiketleri var | Yeni bölge amblemi katmanı uygulanmadı; profil/zoom/mahremiyet kabulü gerekir  PLANLANDI / AÇIK |
| #14 MP uzaktan inşa | RemoteConstruction + host komut altyapısı önceden var | Yeni tam UI/MP kabulü NOT RUN; bu fazın yeni geliştirmesi sayılmaz  PLANLANDI / AÇIK |
| #33 Casusluk UX (pano ID) | Ağlar/operasyonlar/dosyalar ve target/group mevcut | Bu fazda sadeleştirme yapılmadı. Tek hedef seçici ve açık quote gerekçeleriyle küçük ayrı UI işi  PLANLANDI / AÇIK |
| #36 Amblem seçimi | randomEmblem/normalize/mutate ve kaydedilen emblem altyapısı mevcut | Yeni seçenek genişletmesi yapılmadı; eski amblemler korunur  PLANLANDI / AÇIK |
| #44 AI vasallık | aiSubmitTick / aiProtection / aiVassalBudget kod incelemesi; tehdit, bilinen güç/rota, bütçe ve60ay cooldown var | Gerçek kampanya kabul/ret oranı NOT RUN; AI karar kuralı değiştirilmedi  PLANLANDI / AÇIK |

## Önceki geliştirmeler — yeniden geliştirme sayılmaz

#1/#2/#3/#4/#6/#8/#11/#12/#13/#21/#27/#34/#37/#41/#42/#45/#47/#48/#52/#53/#54 p15 zincirindeki kod ve raporlarıyla korundu. İlgili federasyon kuruluşu, Konsey, savaş, ambargo, haber, korsan/kapı/isim/koloni, PERF ve MP-P0 testleri regresyondur. Yerel PASS gerçek kullanıcı kabulü değildir. #45’in1000sistem/24–48AI sınırları veya #48’in özgün kullanıcı kaydı hâlâ açık sınırlar olabilir; bu faz bunları tamamlanmış yapmaz.

## Ayrı büyük fazlar

- **BETA-WAR-CENTER:** #16/#31/#40/#43/#49 birlikte. Sabit savaş cephesi, taraf/çağrı, ödeme/karşı teklif, rota izni ve exactly-once kabul veri modelini önce ortak tasarla; mevcut warLedger/settlement/joint işlemlerini kullan. Sırf yeni federasyon queue motion’ı var diye bu beş geniş özellik tamamlanmış değildir.
- **#39 Yağmacı Federasyon:** ayrı tür/ekonomi/üyelik dengesi. Mevcut üç federasyona eklenmedi.
- **#51 Konsey iki aşamalı gündemi:** federasyon kuyruğuna bağlanmadı. Konsey aday yasa havuzu→gündem seçimi→mevcut EVET/HAYIR olarak ayrı tasarım gerekir.

Bir sonraki faz için tek öncelik: p16 gerçek PC host/katılımcı kabulü; kayıt/queue/speed/cancel hatası çıkarsa aynı Save8 ve tanı üzerinden düzeltme. Bu kabulün ardından #19 yoğun koloni ekranı ayrı dar hedef olabilir.
