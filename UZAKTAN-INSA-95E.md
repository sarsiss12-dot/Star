# Uzaktan inşaat emirleri — 95E

`construction.js` gemi başına görev planlayıcıdır. Mevcut `startStruct/structTick` tek maliyet ve yapı motoru; `orderMove`, keşif güvenlik bağlamı ve mevcut rota grafiği tek hareket altyapısı olarak korunur. Yeni kamera, fiziksel bina motoru veya kaynak escrow sistemi yoktur.

## Oyuncu akışı

İnşaat gemisini seç → filo panelinde Uzaktan İnşaat → keşfedilmiş sistem ve izin verilen uzay yapısı → maliyet/rota/koşul önizlemesi → kuyruğa eklemeyi onayla. Mevcut sistem yapı panelinde seçili inşaat gemisiyle aynı hedefe erişim de var. Açılır hedef listesi yalnız keşfedilmiş sistemlerdir. Tür/asteroit/gaz gibi gezegen gereksinimleri mevcut sistem koşullarından doğrulanır. Bu faz koloni bina kuyruğunu inşaat gemisine taşımaz; motorun desteklediği uzay yapılarını uzaktan emreder.

Gemi başına en çok 16 iş. Hedef, yapı, durum, rota/atlama, bekleme nedeni ve başlanmamış işi iptal gösterilir. Durumlar: sırada, yolda, bekliyor, inşa ediliyor, tamamlandı, başarısız, iptal, gemi kaybı. Yakın geçmişte son dört iş filo panelinde; dünya genelinde son 128 bitmiş iş saklanır.

## Güvenlik ve ekonomi

Emirde para düşmez. Varışta sahiplik, hak iddiası, teknoloji, mevcut/başlanmış yapı, boş inşaatçı, çatışma ve kaynaklar yeniden kontrol edilir; yalnız `startStruct` bedeli bir kez düşer. Aynı sistem/yapı için eşzamanlı görev rezervasyonu engellenir. Başlanmamış iptal/başarısızlıkta harcama ve iade yoktur. Başlamış yapı için yeni iade yolu açılmaz; mevcut motorun işi tamamlanır. Gemi ölürse görev kuyruğu temizlenir. Mevcut motorda başlamış yapı gemiden bağımsız ilerlediği için sonradan tamamlanabilir; gerçek tamamlanma sayacı doğrudan `structTick` başarılı sonucuna bağlıdır.

Keşfedilmemiş sınır düğümleri, bilinen düşman/korsan/yuva, erişim ve yetersiz ikmal güvenlik kapılarından geçirilir. Gizli düşmanlar için her şeyi bilen rota garantisi verilmez. Her sonraki bacak bilinen tehlikeye göre kontrol edilir; başlamış bacak ışınlanarak iptal edilmez. Rota/varış başarısızlığında en çok 4 deneme, 5/10/20 gün bekleme; günlük en çok 4 yeni görev rota araması vardır. Kuyruğa ekleme önizlemesi ve mevcut güvenlik kontrolünün ayrı maliyeti vardır. Başarılı manuel hareket, başlanmamış otomatik işleri iptal eder ve oyuncu emri önceliğini korur.

## AI ve kayıt

AI hedef puanlaması, kaynak bütçesi ve gemi üretimi korundu; AI inşaat seçimi aynı görev katmanına bağlandı. Artık ayrı AI yerinde-yapım yolu yok; eski izole test konaklarında modül yüklenmediyse tarihsel fallback test edilebilir. Üretimde bütün dört dosya PWA kabuğundadır.

Görev ID'si mevcut `sys.work` işine bağlanır; kuyruk, yapı işi ve sonuç makbuzları Save v8 ek alanıyla saklanır. Tamamlanan iş yeniden ücretlenmez/uygulanmaz. Eski kayıtta boş görev altyapısı kurulur; eski devam eden işler mevcut motorla ilerler. Modül arızası yalnız görev planlamasını duraklatır; başlatılmış yapı ve diğer simülasyon devam eder.

100 sistem / 120 ay gözlem: tohum 11: 1 AI inşaat filosu, 1 başlangıç, 1 bitiş; 99: 3 filo, 12 başlangıç, 10 bitiş; 404: 4 filo, 8 başlangıç, 5 bitiş. Bunlar gerçek `startStruct/structTick` gözlemleridir; kuyruğa atılan emri tamamlanmış yapı saymaz. Düşük kullanım ve başarısız görevler gizlenmedi; ayrıntılar test raporunda.
