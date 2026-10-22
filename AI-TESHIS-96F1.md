# Faz 96F.1 — Kök neden teşhisi

## Kaynak ve kapsam

stars-faz96f.zip;19.709.799 bayt;SHA-256 8e975709098de955108a0460fc66fdb62adf6fc2ca9398ec7a5f025ccd05099b. CRC ve3.185 manifest hash'i doğrulandı. Başlangıç GitHub main6ddabca12ece1810234d1a831112886dc769fe5c. Kaynak ZIP esas alındı; eski veya kısmi remote manifest kaynak yapılmadı.

## Kanıtlanmış karar hataları

1. aiBuildingSustainable yalnız negatif marjinal girdiyi sınırlandırıyordu. Bir binanın o para biriminde devamlı tüketimi yoksa, peşin fiyat mevcut açığın dayanımını bozabiliyordu. Kontrollü durumda140 maden,−12/ay net ve110 madenlik santral: eski karar izin veriyor, kalan30 maden yalnız 2,5 ay yetiyor; altı aylık kural aşılıyordu. Yeni karar bunu reddeder. Açığı iyileştiren gerçek üretici istisnası korunur; maden üreticisi aynı bütçeyle gerçekten ödenip çalışabilir.

2. aiEconomyPlan kritik hesaplamasında alaşım yoktu. Seed 11/devlet1'in−2,31/ay alaşım ve sıfıra inen stok durumu eski planda rearm görülebiliyordu. Alaşım aynı kritik kaynak hesabına alındı.

3. Donanma üretimi her yeni gemiyi ekledikten sonra güncel envanteri görse de bekleyen bina giderlerini içeren planın eski bir görüntüsünü kullanıyordu. Kontrollü gerçek ücretli kuyrukta net enerji tahmini12,4 iken dört sipariş sonrası−6,4'e düşebiliyordu; barış kuralının alt sınırı2 idi. Güncel birleşik plan her alımda yeniden okunur. Aynı durumda son tahmin5,6, siparişler korvet+koloni gemisi oldu. Kaynaklar kanonik fiyatla gerçekten düşer.

4. Acil üretici henüz alınamıyorsa daha ucuz büyüme harcaması birikimi sürekli kesebiliyordu. Seed 11'in ilk adayında gün 990 maden,1080 laboratuvar alımı alaşım toparlanmasını geciktirdi. Yeni türetilmiş rezerv yalnız mevcut pozitif gelirle en fazla üç ayda finanse edilebilir ve sürdürülebilir kritik üreticiyi bekler. Ekonomi ve sivil gemi harcaması aynı rezervi dikkate alır; kaynak yaratılmaz. Para kazanma yolu yoksa sonsuz birikim sözü üretmez.

5. aiMove aynı geçerli silahlı filo rotasını tekrar gerçek emir gibi yazabiliyordu. Seed 11 kaynağında76 aynı-yol kabulü görüldü. Bu, ikinci gemi ödeme kanıtı değildir; gereksiz motor çağrısı ve sınırlı geçmiş gürültüsüdür. Aynı aktif bacak/rota korunur, yeni eylem kaydı üretilmez. Bilim/keşif ve sevkiyat davranışı bu kısa yoldan etkilenmez.

6. Ticaretin ilk BFS yolu tehlikeli olduğunda güvenli başka bir yasal yol aranmayabiliyordu. Port araması reddediliyor; fiziksel yüklemede de yalnız ilk genel yol tekrar seçilebiliyordu. Mevcut en fazla üç sıçramalı arama gözlenen tehlikeleri dışlayabilen seçenekle genişletildi. AI fırsat araması ve gerçek gönderici güvenli alternatif için aynı yolu kullanır. Türetilmiş memo anahtarı gözlenen tehlike imzasını içerir. Gizli korsanlar okunmaz; oyuncu deposu kullanılmaz. Kabul edilmiş sözleşme güvenli alternatif yoksa eski yasal/riskli fiziksel davranışına döner. Yeni mutlak kalkış yasağı yoktur.

## Seed 11 gerçek zaman çizelgesi

Kaynak devlet 2 gün 180'de iki dökümhaneye toplam 420 maden, gün 210'da iki santrale220 maden harcayarak7,45 maden bırakıyor. Dökümhane girdileri devreye girince maden açığı yaşanıyor. Santral fiyatının bu açığın stok dayanımına etkisi kontrol dışındaydı. Aynı dönemde askerî gemi alımları da var; fakat ilgili mineral giderlerinin ana doğrudan kaynağı bu bina ödemeleri. Krizin tamamı donanmaya bağlanmadı.

Kaynak devlet 1, erken toparlanma yıkımı sonrası alaşım üreticisini kaybetmiş ve−2,31/ay bakımla ilerliyor. Ucuz bina alımları yeni dökümhaneyi geciktirebiliyor. Son sürümde gün 930/960/990'da sırasıyla2,74/1,68/0,68 aylık finanse etme beklemesi kaydı var; gün 1020'de dökümhane210 madenle gerçekten ödeniyor.38. ay alaşım neti+9,0273. Erken kritik alaşım dönemi yedi aydan beşe iner. Daha sonraki üç mineral kritik ay nedeniyle toplam kritik devlet-ay11 kalır.

Toplam bina maden ödemesi24.602→19.062; gemi alaşım ödemesi10.933→10.176. Son filo96→124 ve bakım239,04→352,28. Son araştırma neti504,44→600,58 olsa da120 ayın araştırma net toplamı40.428,12→36.273,80. Bütün dönem iyileşti denmez. Birden fazla savaş ve ekonomik etkileşim ayrışmıştır.

## Seed 99 gerçek ticaret zaman çizelgesi

Gün1530 devlet 1↔2 ilk fiziksel sözleşme: 13,3 maden↔15,9 tüketim,90 günlük sefer. Gün1532'de devlet 2'nin çıkışındaki yük, gerçek158 numaralı korsan filosunca kaybedilir. Gün1600'de karşı yük de aynı korsanca kaybedilir. İkinci gönderici açısından korsan konumu o anda gözlenmiyordu. Gün1620'de toplam 29,2 kayıp ve0 teslim nedeniyle mevcut risk kuralı sözleşmeyi iptal eder. Bu doğal fiziksel kayıp ve rasyonel risk değerlendirmesidir; kabul düğmesi veya hayalî teslim hatası değildir.

Sonraki dönemde temas/liman/erişim ve karşılıklı oran koşulları baskındır. Gün3150'de16 yiyecek↔13,9 enerji sözleşmesi imzalanır;3226,3316,3406,3496 günlerinde iki yönlü dört döngü, toplam sekiz teslim gerçekleşir.

Tam120 ay kapı sayıları: temas yok 1.427; liman yok 141; güvenli rota yok 109; makul oran yok 25; arz/ihtiyaç yok 25. Bunlar aynı girişimin birden çok aşamasını kapsayabilen devlet/ortak/ay/neden sayılarıdır. Son AIDiagnostics raporu yüklemede sıfırlandığı için bunlarla karıştırılmaz.

96F.1'de bu seed'in gerçek olay izi ve RNG'si aynı kaldı; iki sözleşme/bir iptal/iki kargo kaybı/sekiz teslim. Yeni ticaret hafızası ilk başarısız sözleşmede teslim olmadığı için +4 güven üretmez; fiziksel ilk kaybın nedeni bu hafıza değildir. Diplomatik hafıza ağırlıkları ve değerleme motoru değiştirilmedi. Bütün eski retlerin gereksiz olduğu kanıtlanmadı, bu nedenle yumuşatılmadı.

## Sağlıklı ve değişmeyen parçalar

Dokuz hedefin puanları, süreklilik mekanizması ve diplomatik hafıza ağırlıkları korundu. aiMilitaryCampaign motoru, federasyon, vasallık, diplomatik işlem maliyetleri, kargo miktarları/kapasiteleri/teslim/yağma muhasebesi, civic/tür/genetik/köken katalogları korundu. diplomacy.js/economy.js/combat.js/map.js/ui.js/inbox.js/news.js/construction.js/audio.js kaynakla byte eşitidir. main.js'de yalnız BUILD_ID değişir. Hiçbir kaynak veya gemi bedelsiz verilmedi.

## Sınır ve açık risk

404'te ve2026'da ticaret azalması çözülmüş değildir.404'te kayıp/iptal yoktur; daha az sözleşme ve daha çok oran/arz-ihtiyaç kapısı vardır.2026'da hiç sözleşme kurulmamıştır; sevkiyat motorunun kaybı değildir. Bütün agregat değişimlerin tek nedenini kanıtlayan ablation yapılmadı. RNG ayrışması nedensellik kanıtı sayılmadı. Bunlar sonraki kontrollü denge incelemesine açık risklerdir.
