# STARS · Ticaret kök nedeni ve sistem verimliliği

## 1. Yönetici özeti

Fiziksel ticaretin ana döngüsü çalışıyor. En büyük kayıp **yüklemeden önce**. Önce aynı anda uygun siyasi ilişki, bilinen liman zinciri ve iki taraf için yeterli ekonomik değer gerekiyor. 100 sistemde 15 kayıtta 586 yaşayan AI çift-anı tarandı. İki yönlü rotası ve pozitif motor değerlemesi bulunan 18 çift-anının yalnız biri, mevcut ticaret anlaşması, açık sözleşme ve tekrar bekleme kapıları da hesaba katıldığında yeni sözleşmeye hazırdı. İdeal liman ağı bu sayıyı 29’a çıkardı, ancak medyan tahmini yolculuğu 57,5 günden 123 güne taşıdı ve daha düşük değerli hatları açtı. Bedelsiz transit aynı örneklemde hiçbir yeni pozitif çift açmadı. [Karar denetimi](../../research/ticaret-kok-neden0/raw/summary.json)

**120 ay tek başına yeterli değil.** 99. tohum ilk sözleşmesini 139. ayda imzaladı ve 181–240. aylarda 173 kargo teslim etti. Buna karşılık 404. tohum erken ticaret yaptı ve 175. ayda sona erdi. Uzun gözlem, yeni fırsatları yakalıyor. Bu fırsatların kaynak krizini azalttığına dair genel kanıt çıkmadı. İncelenen kargoların hiçbiri alıcıyı teslim anında üç aylık stok eşiğinin altından üstüne taşımadı. [Kampanyalar](../../research/ticaret-kok-neden0/raw/summary.json)

**Teknik karar.** p51’in fiziksel lojistiğini ve mevcut ekonomiyi koru. Önce ileri yönde kısa ancak dönüşte geçersiz liman çiftinin geçerli ikinci seçeneği gizlemesini düzelt. Sonra AI’ın gerçekten karşılayabildiği ekonomik açığı ve maliyet sonrası kazancı ölçen dar bir aday karşılaştır. Ayrı kabul işinde mobil teslimat bilgisi ile yoğun konvoy performansını ölç. Ekonomi geneline uzmanlaşma zorunluluğu eklemek için yeterli kanıt yok.

Kanonik p51 `1b95efb27a265f607bc33a3e131b071fb80d28e6`, p50 `d1784ffcbe45901674076e682658e9f5dec8f8ae`. 23 Kasım 2026’da uzak dal ve PR baş referansları eşleşti. #70–#75 GitHub HTML sayfalarından açık taslak olarak doğrulandı. API bu ortamda 403 döndürdü. [GitHub durumları](../../research/ticaret-kok-neden0/raw/github.json) · [p51](https://github.com/sarsiss12-dot/Star/pull/75) · [p50](https://github.com/sarsiss12-dot/Star/pull/72)

## 2. Ticaret geliştirme tarihçesi

| PR, HEAD | Teslim | Karar ve devreden iş |
|---|---|---|
| [#70](https://github.com/sarsiss12-dot/Star/pull/70), `23cc1bb` | Codex zincirleme ağının p49 üzerine entegrasyonu. Fiziksel hareket, sahiplik ve transit. | Kısmi teslim. Önceki p47 tabanlı ölçümde küçük galaksi p95’i +%27,61. p49 üzerinde 40 eski paketin anlık kaynak varsayımı bozuldu. Yeni AI anlaşmasında tam işlem grafiği kopyalanıyordu. |
| [#71](https://github.com/sarsiss12-dot/Star/pull/71), `b653523` | Anlık `res` yeniden ayrı yol, fiziksel `cargo` açık seçim. Regresyon paketi genişledi. | Raporlanan küçük galaksi tek koşu +%9,89. Sürüm için ek ölçüm ve misafir kabulü devretti. |
| [#72](https://github.com/sarsiss12-dot/Star/pull/72), `d1784ff` | p50. Misafir gelen kutusu kabul düğmesi ve saf AI–AI kargo anlaşmasında dar işlem kapsamı. | Dar kapsam için yazma kümesi kanıtı var. `pact` haber ve ekonomi geçmişini değiştirdiği için tam kapsamda kaldı. Yoğun uzun hat performansı açık kaldı. |
| [#73](https://github.com/sarsiss12-dot/Star/pull/73), `d438d6e` | MP ara liman, izin kaybı ve fetih Chromium kabulü. Karar hunisi ve transit prototipi. | Ürün çalışma zamanı p50 ile aynı. Doğal etkisi plasebo aralığında olan prototip bekletildi. |
| [#74](https://github.com/sarsiss12-dot/Star/pull/74), `edc1601` | Yoldaki kargoyla kayıt ve yeni oda. Liman yatırım deneyi, atomik izin prototipi. | Ürün çalışma zamanı p50 ile aynı. ×4 liman getirisi ufku doğal yatırım üretmedi. 500 sistemde ek transit payıyla erişilen 8 çiftin 8’i ekonomik şartlarda elendi. |
| [#75](https://github.com/sarsiss12-dot/Star/pull/75), `1b95efb` | p51. Atomik çift yönlü izin, klavyesiz miktar, sıklık ve süre kontrolleri. | Ticaret AI’ının ortak seçimi, yerli üretim kıyası ve yatırım davranışı büyük ölçüde aynı. Mekanik kabul ile doğal ekonomik kazanım ayrı değerlendirildi. |

[AG.0](../claude/TICARET-AG0-SONUC.md) · [AG.1](../claude/TICARET-AG1-SONUC.md) · [AG.2](../claude/TICARET-AG2-SONUC.md) · [AI.0](../claude/TICARET-AI0-SONUC.md) · [AI.1](../claude/TICARET-AI1-SONUC.md) · [Tamamlama](../claude/TICARET-TAMAMLAMA0-SONUC.md) · [Red kayıtları](../../AI-RED-KARARLARI.md)

## 3. Geliştirme darboğazı

`Mekanik hata → düzeltme → kontrollü kabul` döngüsü liman sahipliği, misafir kabulü ve atomik izin için başarılıydı. `Daha çok doğal sözleşme → ekonomi yararı` varsayımı ise fırsat kalitesini ölçmüyordu. #73–74'te araştırma, MP ve ekonomik yaygınlık aynı teslim kararında toplandı. İkinci iznin yarım işlemde kalması kontrollü bir kusurdu. Bunun düzeltilmesini filo hacminin veya toplam stokun artmasına bağlamak gereksizdi. #75 bunu ayırdı. Buna karşılık yatırım ve rota bütçesi adaylarını durdurmak doğruydu. Arama alanı büyüse bile gözlenen ek vakalar yatırım getirisini veya karşılıklı takas şartını karşılamadı.

Ölçüm düzeneği de sonuçları etkiliyor. Önceki kampanya aracı `autoExploreTick` çağırmıyor. Yeni çalışma çağırıyor. Eski 120 aylık sonuçlarla burada ölçülen adetleri doğrudan p50–p51 farkı olarak kullanamayız. Eski `fin.deliv` yalnız bellekte tutulan konvoy listesini sayıyordu. Yeni araç her makbuzu olay anında kaydediyor. Aynı kayıttan tek etken deneyi ve tam makbuz serisi olmadan sürüm veya ekonomi konusunda nedensellik kurulamaz. [Eski araç](../../research/ticaret-ai0/camp.cjs) · [Yeni araç](../../research/ticaret-kok-neden0/campaign.cjs)

## 4. Anlık takas ve fiziksel lojistik

`res` masada stoktan stoka işler. Siyasi anlaşmalarda ve kriz takasında kullanılabilir. `cargo` açıkça seçilen tek seferlik yük. `freight` iki yönlü ve süreli sözleşme, genel ticaret anlaşması gerektirir. Hiçbiri ay başında kendiliğinden mal yaratmaz. Düzenli kargo 30–180 gün aralığı, kapasite, gerçek rota, stok, risk ve karşı yük taşır. Yükleme iki tarafın stokunu doğrular. Teslimat ve kayıp güzergâh başına işlenir. [Kaynak ve kargo maddeleri](../../diplomacy.js#L1213) · [Rota ve stok](../../commerce.js#L94) · [Aylık akış](../../economy.js#L1413)

## 5. Karmaşıklığın değeri ve bedeli

Aynı 35 mineral ↔ 35 enerji ve aynı üç sıçramalı 2.700 mesafe birimiyle p51 normal kargo 2. günde yüklendi, 154. günde teslim etti. H4 hız iki katında 79. gün, H8 anlıkta 0. gün. İki tarafa ayda 10 birim ortak gölge tüketim eklenen 70 stok deneyinde ilk stok tükenmesinden önce üçü de tam teslim etti. 25 stokta normal kargo ilk açığı 90. günde gördü, iki hızlı kol 180. güne kadar karşıladı. 12 aylık kümülatif karşılanmayan tüketim üç teslim kolunda yine 120 birim oldu. Gecikme **açığın zamanını** değiştirdi. Teslimat toplamı aynı kaldı. Ablukada iki yük 200. ve 234. günlerde kayboldu. Karşılanmayan tüketim 190’a çıktı, ödenmiş 70 birim iade edilmedi. Bu, riskli bir koridorun kontrolüne gerçek değer veriyor. Model gölge tüketim kullanır. Ekonominin tamamı veya planlanan savaş maliyeti bu deneyden çıkarılamaz. [Sevkiyat kolları ve muhasebe](../../research/ticaret-kok-neden0/raw/sevkiyat.json)

## 6. Doğal olgunlaşma

100 sistem, 9 başlangıç AI, p51, normal karar döngüsü. Günler, ilgili olayın ilk gözlemidir. İlk ekonomik ihtiyaç üç aydan kısa stok dayanımıdır. İlk rota farklı bir devletin rotası olabilir. İmza rotasıyla aynı taraf olduğunu yalnız ham kayıtlarla eşleyin.

| Tohum | İlk kritik ihtiyaç | AI’ın ilk ileri rotası | İlk imza | İlk yükleme | İlk teslim | İlk çift taraflı pozitif tur |
|---|---:|---:|---:|---:|---:|---:|
| 11 | 6.420, 214. ay | 990, 33. ay | 990 | 992 | 1.061 | 1.403, 46,8. ay |
| 99 | 1.170, 39. ay | 3.360, 112. ay | 4.170 | 4.172 | 4.241,5 | 4.241,5, 141,4. ay |
| 404 | 1.530, 51. ay | 750, 25. ay | 750 | 752 | 818,5 | 3.195,5, 106,5. ay |

İlk pozitif turun tohumlar arası ortalaması **98,2. ay**. Pozitif tura ulaşan 21 devlet için sansürlü ortalama **132,5. ay**. Ölçüt, iki yükün makbuzlarından teslim anındaki ithalat değerini ve yüklenen ihracatın değerini `itemValue(res)` ile hesaplar. Fırsat maliyetini, transit Etki’sini, sözleşme süresini ve fiyat hareketi karşı olgusunu içermez. Dolayısıyla yaklaşık gerçekleşen değişim marjıdır. Ortalama nihai refah etkisi için **yeterli kanıt yok**.

| Tohum | İmza · teslim · >3 sıçramalı teslim, 1–120 | 121–180 | 181–240 |
|---|---:|---:|---:|
| 11 | 25 · 264 · 18 | 13 · 116 · 26 | 20 · 210 · 26 |
| 99 | 0 · 0 · 0 | 5 · 30 · 0 | 12 · 173 · 0 |
| 404 | 11 · 80 · 0 | 6 · 58 · 0 | Oyun 175. ayda sona erdi |

Doğal imza → yükleme medyanı üç tohumda 2 gün. Yükleme → teslim medyanı 48, 55 ve 53,5 gün, gözlenen uçlar 21,5–221,5 gün. Önceden kaydedilmiş genel ticaret anlaşmasından fiziki imzaya medyan 2.940, 5.280 ve 2.340 gün. Bu son sayı AI’ın aynı fırsatı beklettiği süre değildir. Aradaki yıllarda arz, altyapı ve siyasetin aynı kaldığı varsayılamaz. Doğal kampanyalarda yeni transit satın alımı gözlenmedi. Aynı koşular 11/99/404 için `res` içeren sırasıyla 58/99/62 başarılı diplomatik işlem kaydetti. Bunların bir bölümü siyasi bedel. Günlük, pazar ve Etki dahil olduğundan bu sayı fiziksel emtia hacmiyle doğrudan kıyaslanamaz. Eski 11. tohum farklı yürütücüde 1.230. günde izin satın almıştı. [Aylık durumlar ve olaylar](../../research/ticaret-kok-neden0/raw/summary.json)

## 7. Ekonomik bağımsızlık ve kıtlık

120. ay üç kayıt, 29 yaşayan AI. Medyan üretim, gider ve net ayrı ayrı alındığından satırlarda ilk iki sütunun farkı medyan nete eşit olmak zorunda değildir. Aşağıdaki örnek 404. tohum, örneklemde en çok açık görülen dünya. Makine enerjiyi, litoit minerali, organik türler gıdayı kendi kurallarıyla tüketir.

| Kaynak | 404, aylık üretim / gider / net, 120. ay | 404, stok <3 aylık açık, 1–120 / 121–175 |
|---|---:|---:|
| Enerji | 325,0 / 254,3 / +49,0 | 0 / 0 |
| Mineral | 134,5 / 65,5 / +74,0 | 0 / 0 |
| Yiyecek | 94,4 / 86,6 / +8,6 | 29 / 52 |
| Alaşım | 54,0 / 27,3 / +29,0 | 2 / 0 |
| Tüketim malı | 48,2 / 37,5 / +16,2 | 62 / 82 |

404'te motorun `e.crisis` göstergesinde 22 ve 50 gıda krizi devlet-ayı kaydedildi. Tüketim malı kıtlığı ayrı motor alanıdır. 11 ve 99'un ilk 120 ayında motor krizi yoktu. 404 fiziksel sözleşmeleri bu 175 ayda **0 yiyecek** ve toplam **206,9 tüketim malı** teslim etti. Kıtlık ile ticaretin ürün bileşimi ayrışıyor. Bütün tohumların stok, net ve kaynak bazında rezerv dağılımları ham özet dosyasında. Üretim bina desenleri benzer ve yaygın. Bina toplamları, başat ihracat kaynakları ve açıklar tür ve imparatorluğa göre değişiyor. Fark, doğal uzmanlaşmanın yokluğunu kanıtlamaz.

İç üretim tercihinin doğru olduğu bir kontrollü vaka mevcut. p50 kanıtında aynı kolonide maden +10 mineral/ay sağlıyor. Limanın bir yıllık ticari getirisi maliyetin 0,93’ü ve ufuk dört katına çıkarıldığında da maden alternatifi baskın. Bu karar, yapay bonusa gerek olmadığına örnek. Ham p51 120. ay anlık taramada negatif neti düzelten, hemen ödenebilir ve boş kuyruklu iki yerli enerji yatırımı bulundu. Boş slot, teknoloji, bakım ve bina maliyeti hesaba katıldı. Açık gözlenmeyen bir devlete ek üretim önermek zaten gereksiz. [Üretim defteri](../../economic-ledger.js#L48) · [Yatırım örnekleri](../../research/ticaret-kok-neden0/raw/yatirim-404-120.json) · [Önceki kontrollü maden testi](../claude/TICARET-AI1-SONUC.md)

## 8. Ticaret AI karar hunisi

Doğal karar günlükleri aynı çifti farklı aylarda tekrar sayar. Motor ilk engelde durduğu için bu sayaçlar bağımsız olasılıklar veya toplam galaksi fırsatı değildir. 175–240 aylık üç koşuda görülen başlıca duraklar aşağıdadır.

| İlk görülen kapı | Karar kaydı | Ekonomik yorum |
|---|---:|---|
| Temas yok | 14.901 | Değer hesaplanmadı. Keşfedilmemiş fırsata ekonomik değer atfedilemez. |
| Siyasi kapı | 4.133 | Ambargo, savaş ve doktrin ayrıntıları ham kayıtta. Siyaseten yasak çiftin gölge fırsatı gerçek teklif sayılamaz. |
| Çıkış veya hedef limanı yok | 3.090 | Gölge tarama uçları ayrı saydı. 586 çift-anında 527 çıkış, 552 hedef, 499 iki uç mevcut. Temas kurulduktan sonra yeni liman kusuru ayrı ölçülmeli. |
| Güvenli rota yok | 3.547 | Kapalı rota, bilgi ve fiziki boşluk beraber görünebilir. Aşağıdaki kontrollü ayrım bu toplamı sınar. |
| Rota bütçesi dolu veya arama kısmi | 2.677 / 386 | 96 sorguluk ortak bütçe ve liman başına sınırlı örnek. Önceki 500 sistem deneyi bütçe açınca sekiz ek çift buldu, ek kârlı çift sıfır. |
| Karşılıklı ihtiyaç ve fazla filtresi | 2.072 | İlk filtre bir yönde yeterli. İki yönün fiyat ve miktar uygunluğu `aiTerms` içinde ayrıca sınanıyor. |
| Açık sözleşme | 956 | Aynı çifte yeni teklif engelleniyor, farklı mal veya periyot için de. Mevcut ilişkinin yerini daha iyi sözleşmenin alacağı kanıtlanmadan gevşetilmemeli. |
| Bekleme, adil oran yok, fiyat/rota teklifi reddi | 58 / 41 / 6 | Beklemelerin 40’ı önceki fiyat oranı kapısına, 18’i önceki teklif retlerine bağlıydı. Anlık taramada bekleme dışında tüm teklif kapılarını geçen örnek 0. |
| Sözleşme ve zarar iptali | 92 / 3 | İmzalar hacim değil. Gerçek teslim, kayıp ve iki tarafın stok zamanlaması ayrı izlenmeli. |

15 küçük galaksi kaydında 196 çift-anında pakt vardı, 170’inde pakt ve iki liman. Siyasi kapıyı geçip uçları olan 178 çift-anında 1.110 uç liman eşleşmesi denendi. 354’ünde iki taraf uçları karşılıklı tanımıyordu. H0’da 177 ileri, 170 iki yönlü güvenli rota, 122 iki tarafın olumlu şartlarını ve miktar sınırlarını karşılayan uç eşleşmesi var. Aynı devlet çifti birden çok uçta sayılıyor. Devlet çifti başına en yüksek tahmini marjda 18 çift-anı pozitif. Altı teklif imzalama sınırında eleniyor. Dördü tekrar imza, ikisi aylık hat kapasitesi. 12’si gerçek teklif doğrulaması ve iki AI kabul önizlemesinden geçti. İzin fiyatı ve karşı teklifin doğal fırsat başına oranı **yetersiz kanıt**. Düşük güven ve pahalı karşı teklif eski kontrollü vakalarda tekrar üretildi.

`aiBalance` giderde taahhüt edilmiş ihracatı çıkarıyor. Planlanan ithalatı hesaplıyor, ancak `need` hesabında kullanmıyor. `aiTerms` en fazla 16 birim teklif ediyor ve en az 1 birim istiyor. Her iki tarafın min–maks adil oran aralığı çakışmalı. `itemValue(freight)` planlanan sefer sayısı üzerinden değer biçiyor. Tam teslim ihtimali, ilk varışın açığın başlangıcından önce olup olmadığı ve alternatif üretim fiyatı tek ortak hesapta yer almıyor. `aiPlayerTerms` oyuncunun gizli bütçesini tahmin etmiyor. `aiPartnerOffers` paktlı dört ortakla sınırlı. `aiTransitRequest` aynı üçüncü sahiple iki yönü atomik doğrular. `aiDealWould` sahibin kararını önizler. `aiPortInvestment` iç üretimi ve bütçeyi ayrıca eler. Motorun kendi üretimini daha avantajlı gördüğü doğal kararların tam sayısı için güvenilir günlük yok. [Fırsat kodu](../../commerce.js#L308) · [Ham huni ve teklif kapıları](../../research/ticaret-kok-neden0/raw/summary.json)

**Doğrulanmış AI kusuru.** `aiPorts` en kısa ileri hattı seçiyor. Dönüş ve teklif miktarını `dealQuote` daha sonra kontrol ediyor. H6 kontrollü dünyada AI, yalnız kendi izninin açtığı 4 numaralı hedefi seçti. Dönüş geçersiz olduğundan teklif reddedildi. Önceden bilinen 9 numaralı hedef aynı stok ve siyasetle geçerliydi. Aynı motor sözleşmeyi kabul etti, 16 mineral ve 14,3 enerji birer kez ulaştı. RNG değişmedi. 100 ve 500 sistem denetim kayıtlarında geçerli, hazır açık bir fırsatın bu yolla kaybı gözlenmedi. Dolayısıyla düzeltme kararı güvenilir, doğal hacim artışının büyüklüğü belirsiz. [İki limanlı tekrar](../../research/ticaret-kok-neden0/raw/ortak.json)

## 9. Liman ağı ve coğrafya

Önceki %78–85 oranı yeniden hesaplandı. Transit taramasına ulaşmış uç çiftlerinde 11 için 218/278 (%78,4), 99 için 1.164/1.381 (%84,3), 404 için 1.421/1.793 (%79,3) yapısal boşluk. Yeni ve daha geniş örneklemde yalnız karşılıklı bilinen uçlara bakıldığında 100 sistemde 469/756 (%62,0), 500 sistem geç oyunda 297/521 (%57,0). Bu iki payda farklı seçim kapılarına sahip. İkisi de coğrafyanın önemli olduğunu gösteriyor. Tarihsel yüzdeyi bütün ticaretin kayıp oranı diye kullanamayız.

Üç sıçrama, uzaktaki limanın siyasi ve ekonomik değerini oluşturuyor. Dörde çıkmak küçük galakside iki taraflı pozitif 18 → 23 çift-anı, 500 sistemde 5 → 7. Küçükteki medyan tek yönü en uzun olan tahmini teslim 57,5 → 71 gün. Tahmini zayıf taraf marjı 9,8 → 6,17. İdeal ağda 100 sistem medyanı 123 gün, 500 sistem medyanı 250 gün. İdeal ağ hiç kimseye bedelsiz gelir yazmadı. Her sisteme sanal aktarma noktası vererek yalnız bir üst sınır kurdu. İdeal ağa yönelik alternatif maliyet, kayıp olasılığı ve diplomatik ilişkilerin uzun vadeli değişimi **NOT RUN**. [Rota deneyleri](../../research/ticaret-kok-neden0/raw/summary.json) · [Coğrafya kıyası](../../research/ticaret-kok-neden0/corridors.cjs)

## 10. Transit diplomasisi

Yeni kontrollü tekrar p51 **12/12**, p50 **9/12**. p50'nin üç farkı çift yönlü izin, tekrar ve kısmi hata vakalarında. p51 tek yönlü yolu, alıcının rızasını, izin bitişi ve yeniden rotayı korudu. Ayrı H2 kolunda temas, savaş/ambargo ve bilgi sınırları devam etti. Bilinen taraflara varsayımsal hak verildi. Küçükte ek pozitif çift 0, 500 sistem kaydında 1. Bu son hattın tek yöndeki 293 günlük tahmini, izin ve teslim vadesinin niçin değerlemede bulunması gerektiğini gösteriyor.

360 günlük izin için AI taşıyıcı başına 36 Etki teklif eder. Alımın bir sonraki ay imzalanması, 12 aylık sözleşmenin izin vadesinden sonra sefer öngörebildiği anlamına gelir. Bu bir takvim riski. Doğal kampanyada bunun sonucu olarak kayıp sayısı **yeterli kanıt yok**. İki yönlü insan izin yolu mevcut atomik otomatik satın alma kapsamına girmiyor. Bu sınırlama açıkça gösterilmeli. [Test p51](../../research/ticaret-kok-neden0/raw/transit-p51.log) · [Test p50](../../research/ticaret-kok-neden0/raw/transit-p50.log) · [İzin kodu](../../commerce.js#L389)

## 11. Ticari kolonileştirme

120. ayda 96 koloninin 89’u zaten devletin limanı bulunan sistemdeydi. Eski araştırmadaki %37–48, devletin limansız aday kolonisi kalmayan çağrıların payıydı. Kolonilerin genel liman oranı ile karıştırılmamalı. Eski 12 aylık gelir/bedel aralığı 0,02–0,49 yeniden hesaplandı. ×4 ufukta görülen beş ayrı aday fırsatın doğal siparişi sıfır. Bedel, kuyruk, savaş ve yerli üretim göz önüne alındığında bu dar sonuç tutarlı.

p51 taramasında yerleşilebilir, taranmış sahipsiz 125 sistem aday olarak incelendi. Mevcut uçlar arasında rota açamayan paktlı çiftlerde varsayımsal yeni liman 89 uç eşleşmesinde bağlantı açtı. 71’i iki taraf için pozitif motor şartına ulaştı. Bu, **yeni koloniye port verilseydi** oluşabilecek bağlantı sayısı. 71 ayrı koloni, kesin ticaret, mevcut kapasite veya geri dönüş değil. Uç çıkış limanı rolü alan yeni sistem, gerçekte öncü gemi, kolonileşme, bina sırası ve büyüme gerektirir. Mevcut yapay aktarma üst sınırı ile karşılaştırıldığında, harita doğal fırsat üretebiliyor. Ticaret tek başına kolonizasyon maliyetini karşılar sonucu çıkmıyor. Önce olumlu fırsatın gerçek erişimini, bakımını ve mevcut iyi gezegene göre toprak/üretim farkını kanıtla. [Yatırım kayıtları](../../research/ticaret-kok-neden0/raw/) · [Kolonileşme filtresi](../../ai.js#L2122)

## 12. Kontrollü deneyler

| Kol | Değişen etken | Bulgular ve durum |
|---|---|---|
| H0 | p51, mevcut kurallar | **PASS.** Doğal kampanya, gerçek rota ve stok kapıları. İzlemeli ve izlemesiz 11. tohum 60. ay Save8 ve RNG aynı. |
| H1 | Her uygun sistem sanal aktarma noktası | **PASS, gölge deney.** En az 29 ek pozitif çift-anı, uzun süre ve düşük marj. Hak/yapım maliyeti hesaba bir fayda olarak yazılmadı. |
| H2 | Üçüncü taraf izinleri varsayımsal | **PASS, gölge deney.** Küçükte 0, 500 sistem örneğinde 1 yeni pozitif çift. |
| H3 | Aktarma bacağı 3 → 4 | **PASS, gölge deney.** 5 ve 2 ek pozitif çift. Motorun yükleme ve hareket kuralı değiştirilmedi. Kalıcı tasarım adayı olarak doğal kampanya **NOT RUN**. |
| H4 | Sadece sevkiyat hızı ×2 | **PASS.** 154→79 gün. Aynı toplam teslimat, daha geç ilk karşılanmamış tüketim. |
| H5 | Aynı stok üzerinde gölge arz ve talep sinyalini güçlendir | **PASS.** Küçükte 18→21 ve büyükte 5→8 pozitif çift. Dünya üretimi ve stoku değiştirilmedi. Kaynak bonusu gelir sayılmadı. |
| H6 | Aynı ortağın ikinci, iki yönlü geçerli limanını sına | **PASS.** Kontrollü iki teslim. Doğal kesitlerde doğrulanmış aktif kayıp 0. Global bütçe ve ortak sırası için kalıcı yama **NOT RUN**. |
| H7 | Aynı doğal kurallarla daha fazla ay | **PASS.** 11, 99 240 ay. 404 doğal son 175. Tek seferlik 120 ay kıyasının kör noktası gösterildi. |
| H8 | Aynı miktar ve aynı iş ortaklarıyla kanonik anlık `res` | **PASS.** Aynı malın gecikme farkı yalıtıldı. Kriz öncesi etkili, abluka riski almıyor. Fiziksel rotanın siyasi değeri bu aktarımda ölçülemez. |
| Ek kontrol | 120. ay p47 döneminde kullanılan Save8, p51 dünyasında yalnız 2↔6 yeni freight imzasını tut, ayrı bir RNG plasebosu | **PASS.** Save ilk fark 3.630. gün, tutma kolunda 18 aylık ay sonu RNG aynı. Plasebo RNG ilk ay sonu farkı 3.660. gün. Gerçek koldaki 4 makbuz, iki ülkede sıfır kriz ve aynı koloni/teknoloji sonucu. Filo 15/46, imza tutmada 15/47, plaseboda 11/47. Aday refah farkı için tek başına kanıt yetersiz. |

Gölge rota denemeleri kaydı tekrar yüklüyor ve geçici işlevleri kendi VM’sinde çalıştırıyor. `_prof`, `_pressAt`, `_powAt` türetilmiş alanları bazı kayıtların **katı bayt** eşitliğini bozdu. Yalnız bu alanlar çıkarılınca Save8 eşit. RNG tüm denetimlerde eşit. 16 kesitin ikisi ham bayt eşit, 14’ünde türetilmiş önbellek farkı var. Tam bayt eşitliği bu adli kesitlerde genel bir PASS sayılmadı. [Yükleme ve RNG tekrarları](../../research/ticaret-kok-neden0/raw/karsilastirma-son.json)

## 13. Fiziksel lojistik ve karar kalitesi

Otomatik konvoy, ticaret sözleşmesinin fiziksel yerine getirilmesi için yeterli. Ayrı bir ticaret gemisi üretim kuyruğu bu kanıta göre erken maliyet ekler. Tek kargo ve düzenli sözleşme farklı işlere yarıyor. Kargo bir kez taşır. Düzenli kontrat hazırlık maliyetini uzun döneme yayar ama tekrar eden stok ve güzergâh sorumluluğu yaratır. Uzun hat güvenli alternatif, yabancı izin ve savaşta korunabilir düğümler gerektirir. Gerçek yükün çalınması veya kaybolması arzı değiştirir. Doğal izde 11/99/404’te sırasıyla 8.326,7 / 2.904 / 2.050,4 birim yük ayrıldı, kayda geçmiş kayıp 26,5 / 45,6 / 28 birimdi. Yükte kalan miktarlar paydada yer alıyor. Bir askerî filonun korsan/abluka tehdidini azaltma değeri rotada mevcut. Eskortun ayrı maliyet-fayda dengesi ve doğal korsan yoğunluğunun ideal oranı **yeterli kanıt yok**.

İki tarafın makbuzu tamamlanmış turlarda 11. tohum ilk 120 ayda iki taraf pozitif 31, tam iki taraf negatif 8, karışık veya sıfır 93. 99’da 181–240. aylarda sırasıyla 40, 1 ve 46. Bu, geriye dönük `.38 × ihtiyaç` marjı. Aynı zamanda stratejik stokların yenilenip yenilenmediği incelenmeli. Kabul edilen iki taraflı olumlu görüşme her zaman sonradan olumlu makbuza dönüşmüyor. Kârlı reddin mekanik örneği H6’da doğrulandı. Kârsız kaçınmanın örneği 500 sistemde fazladan transit bütçesinin açtığı sekiz fırsat. Beklemenin maliyeti ve pazarlık reddinin net parasal değeri için doğal vaka sayısı yetersiz. Başarı hedefi, sözleşme sayısı yerine **zamanında karşılanan ihtiyaç ve gerçek net değer** olmalı.

## 14. Diplomasi ve federasyon

Ticaret anlaşması düzenli taşımanın siyasi kapısı. Ticaret yasası üye limanına erişim veriyor. H0’da pozitif küçük galaksi çift-anı 18, federasyon hakkı gölge kolda kapatıldığında 15. 500 örneğinde sayısı aynı ama güvenli uç çiftleri 96 → 49. `rememberEvidence` ancak en az ikinci tur ve 180 gün sonra gerçek teslimde `ticaretGuveni` üretir. Teslimat hafızası sonraki ilişki değerlendirmesine giriyor. `tradeFlow` gerçek teslimat sayar ve aylık sıfırlanır. Bir koridor kaybedilirse gelecek üç ayda açıkta kalacak kaynak miktarının federasyon kurma veya savaş kararına doğrudan girdi olduğuna dair çağrı yok. Kayıtlar doğal ticaretin stratejik ittifak kurduğunu nedensel olarak göstermiyor. [Makbuz ve güven](../../commerce.js#L206) · [Güven hafızası](../../ai.js#L2558) · [Hukuki erişim](../../commerce.js#L24)

## 15. Simülasyon performansı

Önceki Chromium ham örnekleri ayrı ayrı yeniden hesaplandı. AB kol başına 144, AA kol başına 72 örnek. Aynı girdi p51/p50 ay sonunda Save8 eşit. AB küçükte tek blok farkı −%16,93 ile +%32,60 arasında. A/A iki kolunun yer değişiminde büyüklük aynı kalıp işaret ters döner. Dolayısıyla küçükteki +%6,08, anlamlı gerileme olarak doğrulanmış değildir. 500 sistem farkları da A/A gürültüsü düzeyinde. Çağrı toplamlarının eşitliği sadece aynı işin seçildiğini destekler.

| Kayıt | p51/p50 birleşik p95 farkı | p50/p50 birleşik p95 farkı |
|---|---:|---:|
| 100 sistem · 120. ay | +%6,08 | −%6,12 |
| 500 sistem · 120. ay | +%0,20 | −%2,93 |
| 500 sistem · 180. ay | −%1,37 | −%0,87 |

Bu sonuç doğal durumda yaygın bir p51 regresyonu kanıtlamıyor. Yoğun kullanımda farklı bir maliyet bulundu. Chromium 155, 500 sistem, 168 liman ve 499 sıçramalı yapay hat. Her yük seviyesinde aynı Save8’den 16 tekrar, ölçek sırası dönüşümlü.

| Aktif yük ve sözleşme | Yalnız konvoy ayı p50 | p95 |
|---:|---:|---:|
| 0 | 0,00 ms | 0,30 ms |
| 1 | 2,25 ms | 20,30 ms |
| 8 | 22,60 ms | 72,60 ms |
| 32 | 88,90 ms | 167,70 ms |
| 64 | 170,30 ms | 315,80 ms |

Her tekrar aynı Save8 ve RNG üretti. Aylık rakamlar yalnız 60 yarım günlük `Commerce.tick` çağrısı. Serileştirme ve çizim süreye dahil değil. 64 konvoy profilinde 1.856 `remainingRoute`, 913.920 `openEdge`, 908.608 `relay`, 303.552 `portRight` çağrısı vardı. Yeni `route` ve `dispatch` çağrısı sıfırdı. Alt yöntem süreleri örtüşür. Profil zamanlayıcılarının etkisi büyüktür. Kök neden, konvoy başına her gün kalan uzun hattın yeniden denetlenmesi. İlk düşük riskli aday, aynı gün ve aynı geçerli dünya durumu için gerçekten aynı kalan yol denetimlerini paylaşmak. İptal, geçiş hakkı bitişi, fetih, ambargo, abluka ve aynı gün yükleme/varış değişiklikleri önbelleği anında geçersiz kılmalı. Sadece zaman aralığını uzatmak hak kaybını geciktirir.

Aynı yük deneyinde 499 sıçramalık soğuk rota p95 **2,6 ms**, önbellekten çağrı **0,1 ms**, izin değişimi denetimi **20,5 ms**. Harita katmanında seçili yapay hattın çizim p95’i kapalı/açık **2,8 / 19,9 ms**, kare aralığı **66,6 / 66,7 ms**. Makine arka planındaki tarayıcı çizim değişkenliği yüksek ve bu hat uç bir örnek. Mobil GPU veya doğal rota sonucu olarak genellenemez. Güzergâh katmanının maliyeti ayrı ölçülmeli. Mevcut doğal profilin rota/fırsat ve ekonomik değerleme maliyetleri kısa; önceki büyük artışın işlem grafiği kaynaklı olduğu #72’de yazma kümesiyle gösterilmişti. Bu araştırmada aynı anda yoğun kabul edilen siyasi anlaşmaların tam `dealTxBegin` kopyası ayrıca profillenmedi. [p51 ham Chromium](../claude/evidence/ticaret-tamamlama0/perf/) · [Yük ve çizim](../../research/ticaret-kok-neden0/raw/yuk.json) · [Alt yöntem çağrıları](../../research/ticaret-kok-neden0/raw/yuk-profil.json)

## 16. En büyük beş kök neden

| Öncelik | Neden, kaynak | Ekonomik etki | Karar |
|---|---|---|---|
| 1 | Karşılıklı bilinen fiziki hat az. `route`, `identifiedPort`, `portRight`. 469/756 bilinen uç çifti yapısal olarak kapalı. | İdeal ağ 29 ek pozitif çift-anı açtı. Açılan marj daha küçük, teslim daha geç. | Üç sıçramayı tut. Önce mevcut açık hat seçimini doğru yap. Yeni koloniyi ancak somut net faydayla ödüllendir. |
| 2 | Güçlü iç üretim ve karşılıklı mal takası şartı. `empireIncome`, `aiBalance`, `aiTerms`. Kıt devlet genelde karşılıkta zayıf. | 404’te enerji/mineral fazlası, kriz gıda/tüketim malında. Hiç gıda teslimi yok. | Evrensel uzmanlaşma ekleme. Acil ve sürdürülebilir ihtiyaç ile iç yatırımın gerçek alternatif maliyetini birlikte hesapla. |
| 3 | Diplomasi, bilgi ve ticaret olgunlaşması aynı anda oluşmuyor. (Temas → pakt → uçlar → rota → sözleşme) | İlk ticaret 25–139. ay, ilk gözlenen pozitif tur 46,8–141,4. Kısa erken kesit geç ağı kaçırır. | 120/180/240 pencere ölç. Dilim ve olay zamanını göster. Bedelsiz izinler az değer katıyor. |
| 4 | En kısa ileri liman seçimi dönüşte reddedilince alternatif unutuluyor. `aiPorts` → `dealQuote`. | Kontrollü şekilde 16 mineral ve 14,3 enerji fırsatı gözden kaçıyor. Doğal yaygınlık belirsiz. | Küçük ve hedefli üretim düzeltmesi. Doğru retleri koru, alternatifin iki yönünü doğrula. |
| 5 | Fiyat, varış vadesi ve risk aynı maliyet hesabına girmiyor. `itemValue(freight)`, `aiTerms`, `dispatch`. | 154 günlük konvoy acil açığı geç karşılıyor. Abluka altında taşıyan, çıkardığı malı kaybediyor. | Rezerv tarihini, periyodik bakım ve karşı yükü, elde edilen net fiyatı aynı satırda ölç. Depoya kesin varış varsayma. |

Yoğun yükteki CPU maliyeti ekonomik kök nedenler sıralamasından ayrıdır. Kampanyada düşük hacmin sebebi olarak kanıtlanmadı. Daha çok uzun kargo üreten değişiklikler için ayrı kabul kapısıdır.

## 17. En önemli üç geliştirme

| İş | Minimum değişiklik ve korunacaklar | Kabul, kazanım ve risk |
|---|---|---|
| 1. Geçerli ikinci limanı kullan | Aynı aday çiftte kısa tek yönlü rota takıldığında mevcut sınırlı uç listesinden geçerli iki yönlü sonrakini dene. Aynı siyasi/istihbarat, stok, kapasite, onay ve risk sınırı. | H6 iki makbuz ve aynı RNG. Tetiklenmeyen kayıt p51 ile bayt eşit. 500 sistem bütçesini büyütme. Düşük risk. Nedeni, verisi ve kabulü en açık olan değişiklik. |
| 2. İthalatı açığın tarihine göre değerlendir | Bir ayda aynı bilinen ve ekonomik olarak geçerli seçenekler arasından beklenen gerçek teslim, gerçek karşı yük ve alternatif yerli üretimin maliyetini karşılaştır. Önce gölge puan, yalnız kanıtlanan karar yolunu değiştir. | Aynı karar kayıtlarında en az 3 ayrı doğrulanmış olumlu fırsat, kriz öncesi gerçek teslimde kazanım. 11/99/404’te aday lehine toplam net fayda ve gıda/tüketim krizlerinde gerileme yok. Orta risk. Uzun vadeli planlama, hafıza ve yeni Save8 alanına ihtiyaç yok. |
| 3. Teslimat görünürlüğü ve yoğunluk kabulü | Mevcut ticaret kartında imza/yükleme/tahmini ilk varış ve iki yönü göster. Fiziksel etkinin anlık kaynak maddesinden farkını aynı metinde anlat. Uzun hat profili ölçülen sınırı aşıyorsa rota kuyruğunda güvenli ortak doğrulama uygula. | Android görünümü 800×360 ve 844×390, host+2 misafir, save/rejoin, son kargo tek makbuz. 64 yükte hedef en az %25 medyan sıcak yol kazancı, normal 100/500 tam ayda p95 A/A bandı içinde. Orta risk, özellikle önbellek geçersizleşmesi. |

[Üç bağımsız uygulama promptu](../../research/ticaret-kok-neden0/GELISTIRME-PROMPTLARI.md)

## 18. Reddedilen veya ertelenen fikirler

- **Bedelsiz transit ve rota bütçesi artışı.** 100 sistem gölge örnekleminde ek kârlı çift sıfır. 500 sistemde eski ek bütçe 8/8 fiyat ret, yeni bedelsiz izin gözleminde yalnız bir ek çift.
- **Her galakside dört sıçrama ve oto liman.** Açılan ek fırsatlar mevcut marjdan düşük ve sefer daha uzun. Kayıp, siyasi değer ve yatırım maliyeti bilinmeden genel değişiklik için yeterli kanıt yok.
- **Liman yatırım eşiğini düşürmek veya ticari kolonileşme bonusu.** Açılan ticaret, tam kolonileşme fiyatını ve yerli üretim alternatifi maliyetini kapsamalı. Mevcut varsayımsal olumlu bağlantı bunu kanıtlamıyor.
- **Ayrı ticaret gemisi, zorunlu eskorta alma, güven için otomatik federasyon.** Mevcut mekaniklerde karşılıkları kısmen var. Daha karmaşık sistem için net kazanç ölçülmedi.
- **Anlık takası kaldırmak veya fiziksel taşımanın her aşamasını hızlandırmak.** H4/H8 aynı malda kriz zamanlamasını değiştiriyor ve uzun vadeli mal toplamını değiştirmiyor. Anlık siyasi takasın işlevini korumak ve fiziksel rota riskini görünür kılmak daha az maliyetli.

## 19. Geliştirme stratejisi

| Yol | Oyuncu ve ekonomik kazanım | Maliyet / performans | Save8, MP ve denge | Test edilebilirlik |
|---|---|---|---|---|
| A · Mevcut sistem, küçük kusur düzeltmesi | Açık koridoru AI kaçırmaz, oyuncu sevkiyatın ne zaman etkili olacağını görür | Düşük, mevcut aday sayısıyla sınırlandırılabilir | Düşük. Aynı oyunda aynı kayıt yapısı ve haklar | Yüksek, H6 ve kontrol kaydı |
| B · Mevcut ekonomide hedefli ticaret zekâsı | Varıştan önceki beklenen açığa ve gerçek maliyete göre değer | Orta. Ay başı teklifi ve varış tahminini yeniden kullan | Orta. Puan sırası değişecek fakat işlem ve haklar mevcut | Yalnız dar kayıtlar ve sınırlı doğal tekrarlar tasarlanırsa yüksek |
| C · Ekonomik rolü yeniden dengele | İthalatın büyüme için daha önemli olması mümkün | Yüksek. Tüm kaynak bütçeleri, galaksi ve AI’ya yayılır | Yüksek. Kriz, savaş ve genişleme dengesi değişir | Şimdilik düşük, önce gerçekten karşılanamayan yapı saptanmalı |

**A ile başla, B’yi kanıta bağla.** Mekanik düzeltmenin geçiş ölçütü hukuk ve deterministik davranıştır. Ekonomik karar değişikliğinin ölçütü net teslim değeri, stok açığı ve risk. Performans yolu CPU ve çizimi ayrı izler. Aynı aşamaya bu üç sonucu bağlamak önceki kapsam tıkanmasını tekrarlar.

## 20. Nihai teknik karar

Bu oyunda fiziksel ticaret daha seyrek ve anlamı daha geç görülen bir strateji. 99. tohum uzun vadeli hipotezi doğruluyor, 404 kısa kalabilecek dünyaların ekonomik sorununu gösteriyor. İlk önemli ortak rota fırsatı çıkana kadar uzun bekleme, normal yükün 2 günlük hazırlığından çok daha baskın. Ticaret hacmi, refah veya kriz koruması yerine geçemez. Altyapı ve izinlerin etkisi kademeli. H1, H2, H3 ve H5 aynı dünyadaki farklı karşı olgulardır. Bunların toplamından “sorunun yüzde kaçı AI” şeklinde bir nedensel pay çıkarılamaz.

**Tamamlanmış mekanikler.** Kanonik anlık ve fiziksel madde ayrımı, gerçek stok ve makbuz, üç sıçramalı bacaklarla liman zinciri, yönlü transit, iki yönlü AI işlem geri alımı, kontrollü fetih/iptal ve eski kayıt/MP devamı. Bu tur p51 transit **12/12**, kargo uyumu **9/9**, dar işlem **6/6**, mobil Chromium **9/9**. Önceki MP Chromium kanıtları tekrar okundu. Bu tur MP oturumu, fiziksel Android, ayrı cihaz LAN ve canlı Render **NOT RUN**. Oyuncunun gerçek Android performansı için yeterli kanıt yok. [Test günlükleri](../../research/ticaret-kok-neden0/raw/) · [p51 MP kabulü](../claude/evidence/ticaret-tamamlama0/chromium/summary.txt)

Araştırma dalı `codex/stars-ticaret-kok-neden0`. Çalışma zamanı p51 ile byte-byte aynı. Yayın, ZIP ve sürüm artışı bu araştırmanın dışında. Raporun sayısal değerlerini üreten komutlar, kurulum girdileri ve örneklem sınırları araştırma dizininde. [Tekrarlama](../../research/ticaret-kok-neden0/README.md)

### Araştırma sınırları

- **PASS** · 3 doğal dünya, 16 farklı rota denetim kaydı, aynı koşullar altında 3 sevkiyat biçimi, 120. ay yerli üretim kesiti, hedefli alternatif liman, fiziksel MP uyumunun mevcut kanıtı ve yeni yoğun kargo ölçümü.
- **FAIL** · p50 çift yönlü transit kabulü, üç kontrollü vaka. p51 bunları geçti. Salt rota denetiminde 14/16 tam Save8 eşitliği türetilmiş alanlar yüzünden sağlanmadı.
- **NOT RUN** · H1/H2/H3/H5 altında tam doğal 240 ay, takas ekonomisinin sistem çapında yeniden dengelenmesi, 500 sistem 240 ay yeni doğal dünya, yeni MP testi ve fiziksel cihazlar.
- **Yeterli kanıt yok** · Ortalama gerçek refah artışı, ticarete bağlanabilir askeri/teknolojik büyüme, transit izin fiyatının en iyi seviyesi, koloninin tam geri dönüşü, doğal korsanlık ve eskort bilançosu. İlk gerçek ekonomik kazanç için gözlenen en yakın gösterge 98,2. ayda ilk pozitif iki yönlü turdur.
