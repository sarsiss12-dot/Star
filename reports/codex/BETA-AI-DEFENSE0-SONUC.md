# STARS — BETA-AI-DEFENSE.0 sonuç raporu

11 Kasım 2026. **Askerî-ekonomik kurtarma hedefi karşılanmadı. Üç savunma yaklaşımı araştırıldı; hiçbiri ürün koduna alınmadı. p23 korunuyor, p24 build oluşturulmadı.** Dar bir hazır-kuvvet senaryosundaki askerî başarı, gerçek Seed 404 kaydının kurtarılması diye sunulmaz.

## 1. Kaynak, HEAD ve teslim

- Doğrulanan uzak başlangıç: `d8e1d250b69f17a68469462db3b1b987cc83b7b0`, `codex/stars-beta-ai-recovery0`. Verilen HEAD ile aynı. [Uzak kaynak kanıtı](evidence/beta-ai-defense0/remote-base.txt).
- Yeni çalışma dalı: `codex/stars-beta-ai-defense0`. Eski main kullanılmadı.
- Araştırma/test/ana kanıt commit'i: [`05d68e45cefc06efea990f9dfce789f72adbf1d0`](https://github.com/sarsiss12-dot/Star/commit/05d68e45cefc06efea990f9dfce789f72adbf1d0). Ürün kodu commit'i değildir. Nihai rapor commit SHA'sı son yanıtta verilir; kendi SHA'sını rapora yazmak için yeni commit döngüsü oluşturulmaz.
- Oyun kod/paket commit'i hâlâ `183c3ca635c6a65ae0d4320284c2e6ab026efb96`: `96h10p23`, `stars-v96h10p23`, `MP.8.9b18`, Save8 v8/paket4/protokol1.
- GitHub [geliştirme dalı](https://github.com/sarsiss12-dot/Star/tree/codex/stars-beta-ai-defense0). Araştırma commit'i normal push ile gönderildi, uzak HEAD doğrulandı. Rapor aynı dalın devamıdır. Main merge, rebase/force-push, Render deploy/restart yapılmadı.

## 2. Aynı gerçek kampanya kontrol noktası

Önceki araştırmadan kalan **60. ay Save8'i gerçekten mevcut**: `p23-404-60-ulu-9-final.sav`. SHA-256 `7d1037e1da8387e5a917ec4d258c718bdfbdc26b51b6e24c867482e96a94ab74`. Seed 404, 100 sistem, başlangıçta9 AI, gün1800. Bu deterministik kampanya kaydıdır; özel oyuncu kaydı değildir. Özgün dosya değiştirilmedi; deneyler ayrı runtime/kaynak kopyalarında yürütüldü. Save8 dosyaları GitHub'a eklenmedi.

AI devlet2 **Orenar İmparatorluğu**, başkent **Wyndor / sistem38**. Aynı sistemde iki koloni, istikrarları0; ilk yüklemede gerçek hedef81,5. Kalkan/garnizon0. Tek kullanılabilir tersane38'de; kendi savaş filosu ve bekleyen gemi siparişi yok. 13 korsan filosu,26 korvet, toplam3848 güç. Korsan sahibi10. Normal devletlerle aktif resmî savaş yok.

Başlangıç stokları:47,286 maden;427,557 enerji;446,233 gıda;44,904 alaşım;9,972 tüketim;418,539 etki. Başlangıçtaki bildirilen netler arasında maden+2,771, alaşım+3,757, gıda+0,122, tüketim−10,457 var; ortak federasyon giderleri plan netinde ayrıca dikkate alınıyor. [Tam tanı](evidence/beta-ai-defense0/diagnosis/diagnosis.json).

## 3. Kanıtlanan neden ve engel sınıfları

|Sınıf|Kanıtlanan durum|Sonuç|
|---|---|---|
|Tehdit algılama|`aiObservedThreat(e,38,false)` ve `aiDefenseThreat` ikisi de3848; stratejik `homeThreat/nearThreat` da3848|Korsanlar görünmez veya dost sayılmıyor|
|Hedef/eylem önceliği|`aiTurn`, `aiMilitaryCampaign` çağrısını `wars.length && armed.length` ile sınırlıyor; korsan düşmanlığı `hostile()` üzerinden, normal savaş bayrağı olmadan çalışıyor|Kuvvet bulunduğunda dahi resmî savaşsız korsan baskısı barış devriyesine düşebiliyor|
|Askerî güç|Başlangıçta0 kendi savaş gücü; karşıda3848|Yalnız hedef seçimini düzeltmek mevcut olmayan kuvveti yaratmıyor|
|Finansman|Temel korvet32 alaşım; mevcut rezerv ve aylık bütçeden sonra ilk anda bu fiyat karşılanmıyor|Bütçe kapısı gerçek; bedava kaynakla aşılmadı|
|Üretim|İlk gerçek korvet siparişi gün1890, kaybı1921; ikinci korvet2670→2701,5|Yaklaşık31 günde üretilen tek gövde işgal altındaki yörüngede kayboluyor|
|Teknoloji|Korvet erişimi açık; eskort/muhrip/kruvazör/zırhlı araştırmaları eksik|Üretilemeyen güçlü gövdeler var sayılmadı|
|Savunma yapısı|Kale fiyatı230 maden+70 alaşım; mevcut stok ikisine de yetmiyor|Mevcut yapı finansmanı ilk anda mümkün değil; kale korsanları yörüngeden otomatik silmiyor|
|Rota|Kendi başkent tersanesi için rota engeli yok; dış yardımda görünürlük, serbest kuvvet ve rota engelleri ayrıca var|Sorunu yalnız yol bulma hatası diye etiketlemek yanlış|
|Diplomasi|Geçerli ortak savaş cephesi yok; normal yardım/koalisyon sözleşmeleri bunu gerektiriyor|Sahte korsan savaşı veya gizli taahhüt oluşturulmadı|
|Motor kuralı|Bombardıman her ay istikrarı düşürüyor ve `bombed` damgasıyla pasif artışı durduruyor|Hedefin pozitif olması gerçek istikrarın yükseleceği anlamına gelmiyor|

Ekonomik darboğaz, askerî baskı ile birbirini besliyor: düşük istikrar üretimi azaltıyor; zayıf üretim güvenli ve yeterli filo finansmanını engelliyor; tersanede doğan küçük kuvvetler kaybolunca bombardıman kesilmiyor. Başlangıçta `aiCampaign` kaydı yok. Mevcut genel başarısız-hedef hafızası bu durumda yetersiz: normal düşman kolonisi seferi seçilmediği için korsan altında yeni gövde kaybını kendiliğinden tam bir savunma planına dönüştürmüyor.

## 4. A/B/C yöntemi ve nedensellik kontrolü

Bütün kollar aynı Save8 baytları ve aynı ilk örnekten başlıyor. Kaynak, gemi, teknoloji veya RNG başlangıcı değiştirilmedi. İlk tarama36 ay; A/B/C1/C2 ve ek C3 için60 ay ilerlenerek120. aya ulaşıldı. [Karşılaştırma ve ölçüm tanımları](evidence/beta-ai-defense0/comparison.json).

- **A:** değişmeyen p23.
- **B:** yalnız test kaynak kopyasında, korsanların devlet2'ye uyguladığı bombardıman bloğu atlandı. Korsanlar, hareketleri, uzay çatışmaları ve diğer kolonilerin bombardımanı korundu. Eski `bombed` damgası kendiliğinden eskidi; istikrar veya stok elle artırılmadı. Bu, **ürün düzeltmesi değildir**. Atlanan blok RNG çağrıları içerdiğinden ilk aydan itibaren RNG ayrıştı. Sonraki kampanyaların olayları aynıymış gibi sunulmaz.
- **C1:** mevcut yerel savunma tahsisini görülen resmî savaşsız tehdide de açma; ulaşabilir toplam kuvvet yetmiyorsa zayıf uzak filoyu işgal edilmiş sisteme göndermeme.
- **C2:** C1 yanında, bilinen işgal altındaki tersanede yeterli mevcut/ulaşan kuvvet yoksa yeni gövde siparişini erteleme. Mevcut üretim motoru ve gerçek bedeller korunuyor.
- **C3:** C1 yanında, mevcut siyasi bağı olan dost kolonide kendi sensörüyle görülen korsan baskısını; mevcut `jointAvailable`, bilinen rota ve sefer-bakım kapılarıyla değerlendirme. Yalnız kendi AI filolarına emir veriliyor; yeni savaş cephesi, ortak sözleşme veya diğer oyuncu adına kabul oluşturulmuyor. Bu da yalnız araştırma kopyasında denendi.

Üç aday da ilk aydan itibaren farklı karar/RNG yollarına girdi. Dünya büyümesindeki her farkı tek başına belirli savunma emrinin nedensel kazancı saymıyoruz. B kolu bombardıman baskısının bu başlangıçtan toparlanma için önemli neden olduğunu gösterir; diğer etkilerin yokluğunu veya tüm galaksilerin aynı sonuca varacağını kanıtlamaz.

## 5. Seed404,60→120. ay sonuçları

Kritik devlet-ay: enerji/maden/gıda/alaşım/tüketim kaynaklarından en az birinde negatif net ve3 aydan az stok dayanması. Sıfır stok ayı bu kaynaklardan birinin gerçekten0 olmasıdır. Araştırma ve etki negatifliği bu ölçüte eklenmedi. Önceki0–120 ay tablosundaki78 kritik ay ile burada61–120 ay için verilen73 farklı pencerelerdir; ilk60 ayın5 kritik ayı bu tabloda tekrar sayılmadı.

|Kol|Devlet2 kritik ay|Devlet2 sıfır stok|Devlet2 bombardıman koloni-ay|Dünya kritik ay|Dünya sıfır stok|Son AI koloni|Teknoloji|Gemi|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|A — p23|60|60|120|73|70|28|84|241|
|B — yalnız deney: bombardıman yok|22|22|0|28|25|31|82|204|
|C1 — yerel savunma|60|60|120|77|73|37|87|187|
|C2 — C1 + tersanede erteleme|60|60|120|79|73|37|88|199|
|C3 — C1 + mevcut bağlarla yardım|60|60|120|77|73|34|86|221|

İlk36 ayda A/C1/C2 için devlet2 kritik ay36, B için22; B sonunda her iki koloninin istikrarı81,5. Uzatılmış B'de devlet2 kalan38 ay boyunca kritik tüketim durumundan çıktı; gıda ve tüketim netleri sonunda birlikte pozitiftir. **Gerçek adayların hiçbiri bu sonucu alamadı.** B'deki dünya28 kritik ayının22'si devlet2'ye aittir; test müdahalesi bütün galaksinin tüm ekonomik sorunlarını çözmedi.

|Kol|Son maden stoku|Alaşım stoku|Tüketim stoku|Tüketim neti|Gıda stoku|Gıda neti|İki koloni istikrarı|Devlet2 teknoloji|
|---|---:|---:|---:|---:|---:|---:|---|---:|
|base|22,53|32,11|0,00|-13,79|25,01|-18,72|0,00/0,00|5|
|no-bombard|138,36|25,30|154,03|1,43|1776,75|21,51|81,50/81,50|6|
|defense|19,58|34,61|0,00|-17,31|26,57|-11,04|0,00/0,00|6|
|safe-yard|98,05|162,59|0,00|-13,41|287,42|-6,47|0,00/0,00|6|
|allied-defense|77,64|28,08|0,00|-16,33|220,18|-2,53|0,00/0,00|6|

A/C1/C2/C3 sonunda devlet2'nin iki kolonisi de korunuyor; fetih kaybı0. Bununla birlikte istikrar0, tüketim stoku0 ve açık sürüyor. Kolonilerin hâlâ mevcut olması ekonomik kurtarma veya başarılı savunma değildir. Yerel ayrılık/ideolojik sayaçları aylık izde saklanır; tek sistemli bu devlet için doğal büyük-devlet ayrılık eşiği uygun bir başarı ölçütü değildir.

## 6. Gerçek askerî hareket ve kayıplar

Baz kolunda ilk36 ayda **2 korvet ve3 bilim gemisi** siparişi verildi; beşi de38'de gerçek çatışmada kayboldu. İlk korvet yaklaşık31 gün içinde tersaneden çıkıp kaybedildi. Bu, savaşmadan donanması varmış gibi duran veya yalnız aynada kaybolan filo vakası değildir. p22 terminal kayıtları ve `combatTick` öncesi/sonrası gerçek gövde sayımları birlikte kullanıldı.

60 ay tam çatışma sayımı: A'da devlet2 **5 gövde**, bütün galakside korsan sahibi10 **14 gövde** kaybetti. C3'te devlet2 yine5 gövde kaybetti; korsan sahibi10'un bütün galaksideki çatışma kaybı0. A'nın kaydedilen tam korsan filo yok oluşları96/91/72/57 sistemlerindedir; bunlar Wyndor kurtarma başarısı diye sayılmadı. Devlet2'nin korsan baskısını kaldırdığı bir askerî sonuç yok.

Başlangıçtaki13 korsan filo ID'sinin zaman içinde yok olması tek başına muharebe zaferi değildir: mevcut korsan yaşam döngüsünde `rule` gerekçesiyle kaldırma ve yeni filo üretimi de var. A sonunda Wyndor'de toplam korsan gücü5761; C1'de5716; C2'de4305; C3'te6270. B'de de4309 korsan gücü bulunuyor. B'nin toparlanması korsanların deneyde haritadan silinmesiyle oluşmadı. [Gerçek kayıp sayaçları ve olay izleri](evidence/beta-ai-defense0/comparison.json).

## 7. Kazanılabilir ve kazanılamaz tehdit

Mevcut kontrollü dispatch fikstüründe iki ayrı tehdit kuruldu; aynı fikstür her kola yüklendi. **Bu fikstürde her kaynak100.000; Seed404 kaynakları değildir.** Amaç finansman veya uzun kampanya denge başarısı değil, mevcut hazır kuvvetin gerçek emir/rota/çatışma davranışıdır.

- Hazır8 korvet1370 güç, başkentte1 korsan korvet171 güç. A ilk turda savunma emri vermedi. C1/C2 gerçek `[1,0]` rotasını verdi; filo başkente ulaştı, gerçek çatışmada korsan gemisi yok oldu,8 savunma gemisi korundu. Sonraki3 gerçek ekonomik/AI ayda adayların istikrarı0→9 oldu. A daha sonra devriye yoluyla müdahale edebildi ve6 istikrara ulaştı; A'nın sonsuza kadar savunamayacağı iddia edilmiyor.
- Hazır8 korvet1370 güç karşısında30 zırhlı55.474 güç. C1/C2 ilk kararda zayıf uzak filoyu başkente yollamadı; ilk hareket/çatışma penceresinde8 gemi korundu. Sonraki ekonomik aylarda bu ağır tehdit altında istikrar0 kaldı. Bu bir krizden kurtarma PASS'i değildir.
- Pozitif fikstürde enerji neti adaylarda da negatiftir; büyük hazır stok sürdürülebilir ekonomi kanıtı sayılmaz. Kısa taktik başarı, ürün kabulü için yeterli bulunmadı.

[Senaryo verileri](evidence/beta-ai-defense0/scenarios/scenarios.json), [çalıştırma kaydı](evidence/beta-ai-defense0/scenarios-final.log). Başka oyuncunun emri, force-click veya sahte filo varışı kullanılmadı; rota/çatışma gerçek motor üzerinden yürüdü.

## 8. Yardım, federasyon ve korunma

Başlangıçtaki bilimsel federasyon üyeleri9/1/4/2. Devlet2'nin izinli bilinen güçleri sırasıyla dost1 için333,4 için181,9 için704. Düşük istihbarattaki333, dost1'in gizli gerçek2320 gücüyle değiştirilmedi. Her AI kendi kuvvetini bilir; devlet2'ye yeni gizli bilgi verilmedi.

- Dost1 Wyndor korsanlarını kendi görüşünde görüyor; toplam gerçek gücü2320, fakat `jointAvailable` serbest kuvvet0 dönüyor. Hem toplam güç hem görev/savunma bağları engel.
- Dost4 için Wyndor anlık görüşte değil; serbest kuvvet0.
- Dost9'un kendi görüşünde Wyndor tehdidi0; uygun bir230 güçlük filo ve gerçek rota var, ancak tek başına3848 gücü karşılayamıyor.
- C3 sonunda dost9'un toplam gücü5159 olsa da mevcut görevlerden ayrılabilir gücü2902; Wyndor baskısı6270. Dost5'in546 gücü için bilinen uygun rota yok; dost4'ün3486 toplam gücü serbest kuvvet anlamına gelmiyor. C3 Wyndor'e gerçek yardım emri üretemedi. [Başlangıç/son yardım kapıları](evidence/beta-ai-defense0/help/help.json).

Mevcut `jointRequest` yerel insan isteği ve geçerli savaş seferi ister. Gerçek AI çağrısında ilk yetki kapısı reddetti; yalnız deneyde yerel kimlik eşitliği verilerek bir sonraki kapı da kontrol edildi: **aynı geçerli savaş seferi yok**. `jointAuto`, koalisyon `warJoin` ve federasyon acil savunması da kanonik aktif savaş olayı/cephesine bağlı; korsanların doğal `hostile` durumu bunun yerine sahte cepheye çevrilmedi. Müttefik bir filo korsanla gerçek uzay çatışmasına girebilir; bu, mevcut yardım talebi sözleşmesinin korsanlar için otomatik kurulabildiği anlamına gelmez.

`aiSubmitTick` bu kayıtta normal devlet tehdidi bulmadığı için korunma teklifi üretmedi; kaynak/RNG değişmedi,60 aylık yeni cooldown da oluşmadı. Dolayısıyla önceki fazda bilinen teklif-öncesi60 aylık bekleme bu vakadaki engel değildir. Genel güçlü-AI himaye girişimi eksikliği ve #44 ayrı açık kapsamdır. İnsan adına teklif kabul edilmedi.

## 9. Diğer dört seed

Hepsi kendi değişmeyen60. ay başlangıç kaydından36 ay ilerletildi. Veriler üç ayrı tam AI koluna aittir. C3 bu dört seedde ayrıca kampanya yapılmadı; ana hedefte sonuç vermediği için kapsam büyütülmedi (**NOT RUN**).

|Seed|Kol|Dünya kritik ay|Sıfır stok|Koloni|Teknoloji|Gemi|
|---|---|---:|---:|---:|---:|---:|
|11|base|0|0|23|59|190|
|11|defense|0|0|25|58|249|
|11|safe-yard|1|0|26|57|257|
|23|base|0|0|21|49|175|
|23|defense|0|0|22|49|214|
|23|safe-yard|0|0|22|49|180|
|42|base|0|0|21|73|210|
|42|defense|0|0|20|73|226|
|42|safe-yard|0|0|21|73|237|
|99|base|0|0|27|58|221|
|99|defense|0|0|25|59|227|
|99|safe-yard|0|0|25|59|227|

C2 Seed11'de baz0 yerine1 kritik kaynak ayı yarattı. C1/C2'nin bazı koloniler/gemi sayılarında artış göstermesi, her devletin daha iyi oynadığı veya Seed404'ün kurtulduğu anlamına gelmez. Örneğin42/C1'de koloni21→20;11/C1'de teknoloji59→58. Karar ve RNG ayrışması nedeniyle tek sonuç seçilerek başarı raporlanmadı. Normal bilim/kolonileşme tamamen durmadı, fakat tutarlı ve düşük riskli kalite kazancı kanıtlanmadı.

## 10. Adayların kabul kararı

|Aday|Gerçek olumlu kanıt|Eksik/olumsuz kanıt|Karar|
|---|---|---|---|
|C1|Hazır kuvvetli senaryoda daha erken gerçek savunma; yetersiz uzaktaki kuvvet ilk turda korunuyor|404'te60 kritik ay sürüyor; dünya73→77 kritik ay; bazı seedlerde bilim/koloni gerilemesi|RET; ürün kodu değişmedi|
|C2|Kuşatma altındaki tersanede boşuna gövde üretimi azalıyor; alaşım korunuyor|Kuvvet oluşturamama kilidi çözülmüyor;404 dünya73→79;11'de yeni kritik ay|RET|
|C3|Mevcut gözlem, siyasi bağ, yedek filo, rota ve bakım kapılarıyla yasal hedef incelendi|Wyndor yardım emri0;60 kritik ay, dünya77; gizli veri veya hayalî ortak kuvvetle kapılar aşılmadı|RET|

**Gerçek ürün koduna alınan değişiklik sayısı0.** İki değişiklik üst sınırı aşılmadı. Reddedilmiş ekonomik yamalar yeniden denenmedi. Korsanlar zayıflatılmadı; kaynak/gemi/bonus verilmedi. Deneysel kaynaklar yalnız geçici test köklerinde; normal runtime ve ZIP değişmedi.

Bu sonuç, mevcut bütün kurallarla her olası insan hamlesinin veya ileride geliştirilebilecek her koordinasyonun matematiksel olarak imkânsız olduğunu kanıtlamaz. Kanıtlanan daha dardır: **bu60. ay kaydında mevcut karar yolları ve test edilen güvenli dar savunma değişiklikleri kalıcı kurtarma üretemedi.** Geçerli yeni korsan yardım sözleşmesi/ortak sefer kapsamı ayrı bir tasarım işi gerektirebilir; bu fazda gizlice eklenmedi.

## 11. Performans

Aynı başlangıçlardan6 gerçek ay, her kol için3 ardışık tekrar; tabloda medyan ve AI ölçüm aralığı var. Zamanlanan `aiTurn` mevcut motorun çağırdığı normal/korsan AI yollarını içerir. Ölçüm VM/yerel CPU ölçümüdür; Chromium FPS'i veya fiziksel mobil performansı değildir. Kampanya gözlemcisinin ağır aylık JSON dökümleri bu ayrı performans koşusunda kullanılmadı.

|Sistem / başlangıç AI|Kol|AI ms/oyun ayı medyan|Tam simülasyon ms/ay|AI tekrar aralığı ms/ay|
|---|---|---:|---:|---|
|100 / 9|base|127,89|447,15|122,02–138,23|
|100 / 9|defense|134,26|455,94|132,14–163,57|
|100 / 9|safe-yard|133,24|451,77|130,74–133,50|
|100 / 9|allied-defense|134,05|455,34|127,91–148,22|
|200 / 16|base|276,29|1636,55|265,17–279,96|
|200 / 16|defense|276,03|1813,76|248,19–304,46|
|200 / 16|safe-yard|304,75|1847,67|254,75–309,80|
|200 / 16|allied-defense|263,24|1842,81|244,18–339,92|

200/16'da aralıklar geniş; özellikle C3 medyanı daha düşük görünse de339,92 ms üst örneği var. Gürültülü sonuçtan hızlanma başarısı çıkarılmadı. Kabul edilen değişiklik olmadığı için yayımlanan oyuna ek AI maliyeti0. Büyük galakside24 aylık yeni davranış kampanyası bu fazda tekrarlanmadı; önceki24 aylık ölçüm tarihsel kanıt olarak kalır. [Ham performans tekrarları](evidence/beta-ai-defense0/perf/perf.json).

## 12. İlk FAIL'ler ve ölçüm düzeltmeleri

1. **İlk deney enjeksiyonu FAIL:** `invasionTick.toString()` mevcut ekonomi-defteri sarmalayıcısını döndürdüğü için tam kaynak dikişi bulunamadı; assertion durdu. [İlk kayıt](evidence/beta-ai-defense0/first-fail-experiment-wrapper.log). Düzeltme: deney kaynağını ayrı test kökünde **motor yüklenmeden önce** değiştirmek. Ürünün gerçek ledger sarmalayıcıları korunuyor.
2. **İlk gözlemci Save8 saflığı FAIL:** örnekleme `totalPower` çağırarak güç önbelleğine yazdı. Son kayıtta fark yalnız devlet1 `_powC/_powAt`; aylık eski güç tahminlerinden78 değer güncel saf toplamdan farklı. Bu eski güç sütunları gerçek anlık filo gücü kabul edilmedi. [İlk FAIL](evidence/beta-ai-defense0/first-fail-observer-save.log), [tam fark denetimi](evidence/beta-ai-defense0/audit/observer-correction.json). Kaynaklar, gelirler, gemi/koloni/teknoloji, sayaçlar ve RNG'de fark yok. Düzeltme: örnekleme saf `fleetPower` toplamı kullanıyor. Son gözlemcili/gözlemcisiz60 aylık oyun **ham Save8 ve RNG birebir**; eski assertion kaldırılmadı, normalize edilmedi. [Son audit](evidence/beta-ai-defense0/audit/audit.json).
3. Performans düzeneğinde çok sayıda geçici kökün ayrı `exit` dinleyicisi Node uyarısı oluşturdu. Limit artırılmadı; tek temizleme dinleyicisi ve kök kümesi kullanıldı.24 köklük dar kontrol geçti. [Uyarılı ilk performans kaydı](evidence/beta-ai-defense0/perf.log), [temizleme kontrolü](evidence/beta-ai-defense0/cleanup-validation.log). Oyun belleği hatası diye sunulmaz.

Eski p18–p23 `selfleet/dealSend/fedFoundStart/KATIL` aralıklı etkileşim vakaları bu araştırmada yeniden üretilmedi veya kapatılmadı. Timeout/force-click/JS click/assertion gevşetme kullanılmadı.

## 13. Save8, RNG, gizlilik ve önceki özellikler

- 19 runtime dosyası, release manifesti ve seçilen5 kritik MP kaynağı (`mp-core`, relay, view, mirror, guest-stars) başlangıçd8e1d25 ile **bayt bayt aynı**. [Tam hashler](evidence/beta-ai-defense0/audit/audit.json).
- Değişmeyen kontrol oyununda düzeltilmiş ölçer açık/kapalı60 ay sonunda ham Save8 ve RNG aynı. Yeni optional alan veya kayıt dönüşümü yok.
- A/B/C başlangıçları tam aynı. Deneylerde ilk ayda RNG ayrışması açıkça kaydedildi. Meşru yeni karar sonuçlarını eski oyunla aynı yapmak için silme/normalizasyon yapılmadı.
- Mevcut bilginin dışındaki düşman/yardımcı güç AI kararına eklenmedi. Tanı raporundaki tüm-dünya sayımları test ölçümüdür, AI'ya veya oyuncu aynasına aktarılmadı.
- p21 Seed23 kalıntı uyandırma olayı ve meşru−12 istikrar etkisine dokunulmadı. Önceki altı aylık AI stres FAIL'i tarihsel olarak korunur; bu araştırma onu geçmişten silmez.
- p22 kimlik/takviye kurtarma, p23 UI, savaş/diplomasi/federasyon mekanikleri yeniden geliştirilmedi. Seçili ilgili regresyonları aşağıdadır; diğer bütün eski testler çalışmış gibi toplama eklenmedi.

## 14. Hedefli regresyonlar

|Script|PASS|FAIL|
|---|---:|---:|
|`beta_espionage_rebellion0_mp_test.cjs`|6|0|
|`beta_fed_ai0_coalition_test.cjs`|8|0|
|`beta_fed_ai0_emergency_test.cjs`|5|0|
|`beta_stability0_fleet_test.cjs`|10|0|
|`beta_stability0_mp_test.cjs`|3|0|
|`beta_ui_refinement0_test.cjs`|4|0|
|`beta_war_center0_test.cjs`|7|0|
|`faz95a_strategic_ai_test.js`|51|0|
|`faz96g1_contract_test.js`|25|0|
|`faz96h3_vassal_budget_test.js`|16|0|

Toplam **10 script /135 kontrol PASS,0 FAIL**. MP satırları host yetkisi/ayna/gizlilik motor testleridir; bu fazda üç gerçek tarayıcı oturumu açıldığı anlamına gelmez. [Loglar](evidence/beta-ai-defense0/regressions).

|Ek kabul|Sonuç|Sınır|
|---|---|---|
|A/B aynı ilk Save8 / askerî-ekonomik nedensellik|PASS|Bombardıman izolasyonu yalnız test; ürün kurtarma değil|
|Gerçek404 kurtarma, C1/C2/C3|FAIL|İki kolonide60 ay baskı ve kritik tüketim sürüyor|
|Hazır kuvvet: gerçek rota/çatışma ve kısa istikrar artışı|PASS|Finansmanı bol fikstür; sürdürülebilir genel ekonomi kanıtı değil|
|Ağır tehditte ilk tur intihar sevkini önleme|PASS|Uzun dönem tüm krizlerden kurtulma garantisi değil|
|Saf ölçer /60 aylık ham Save8+RNG|PASS|İlk başarısız ölçer kaydı saklı|
|19runtime+5MP kaynak bütünlüğü|PASS|Yeni ürün kodu yok|
|İki deterministik p23 paket tekrarı|PASS|Yeni p24 paketi değil|
|Yeni3 Chromium H/B/C / soğuk oda / yeni native UI matrisi|NOT RUN|Oyun/MP değişmediği için geniş önceki koşular tekrar edilmedi|
|Fiziksel Android, LAN/internet, Render, gerçek PC kullanıcı kabulü|NOT RUN|Yerel testlerle eş tutulmadı|

Önceki AI-QUALITY fazındaki soğuk H/B/C5/0, native UI30/0 ve diğer eski kampanyalar yalnız tarihsel kanıttır; bu fazın yeni PASS sayısına katılmaz.

## 15. Paket ve sürüm

p23 ZIP'i değişmedi; iki ayrı yeniden üretim eski dosyayla bayt eşit:

- Dosya `releases/stars-faz96h10p23.zip`,836.950 bayt,20 girdi =19 runtime+manifest.
- SHA-256 `af6eb03aade38327e48ee290029377e638b40167ff87742a57be82cec5bd7d1d`.
- Tüm ZIP CRC32 `13718624`; her girdinin CRC denetimi PASS; `ZipFile.testzip()` temiz.
- Manifestin19 dosya SHA-256 eşleşmesi PASS. [Girdi CRC/manifest kanıtı](evidence/beta-ai-defense0/package-validation.json).
- MP relay/istemci kaynakları ZIP içinde değildir; ayrı mevcut kaynaklar aynı kalmıştır. Save8v8/paket4/protokol1 korundu.
- p24/PWA24/MPb19 üretilmedi. Deneysel bombardıman kontrolü ve AI adayları20 ZIP girdisinden hiçbirine girmedi.

## 16. Değişen dosyalar ve yeniden üretim

**Ürün dosyaları değişmedi.** Yeni testler: `tests/ai-defense0-{campaign,diagnose,scenarios,help,perf,audit,evidence}.cjs`; deney yardımcı dosyası `tests/helpers/ai-defense0-experiments.cjs`. Yeni kanıtlar `reports/codex/evidence/beta-ai-defense0/`. Rapor/envanter, `CODEX-SON-RAPOR.md`, `CLAUDE.md`, `PROJE-DURUMU.md`, `AI-RED-KARARLARI.md` güncellendi. Gerçek kullanıcı Save8'i eklenmedi veya değiştirilmedi.

Ham aylık izler deterministik `.json.gz` olarak saklanır; açılmış dosya ve gzip SHA-256'ları [trace-index](evidence/beta-ai-defense0/trace-index.json) içinde. [Özet doğrulayıcı](../../tests/ai-defense0-evidence.cjs) aynı ilk durumu, savaş sayımı tekrarını, kaynak saflığını, regresyon loglarını ve paket eşitliğini assert eder.

Kontrol noktası olmayan yeni ortamda önce mevcut `ai-quality0-campaign.cjs` ile `AIQ_MODE=p23 AIQ_SAVE_ROOT=/tmp/aiq0-saves ...404 60 ulu 9` kontrolü üretilir; verilen SHA doğrulanır. Gerekli diğer seedlerin60. ayı ve200/16'nın24. ayı aynı araçtadır. Sonra:

```sh
DEFENSE_SAVE=/tmp/defense0-long-finals STARS_OUTPUT=/tmp/defense0-main node tests/ai-defense0-campaign.cjs /tmp/aiq0-saves/p23-404-60-ulu-9-final.sav 60
DEFENSE_MODES=allied-defense STARS_OUTPUT=/tmp/defense0-help-campaign node tests/ai-defense0-campaign.cjs /tmp/aiq0-saves/p23-404-60-ulu-9-final.sav 60
node tests/ai-defense0-diagnose.cjs
node tests/ai-defense0-scenarios.cjs
node tests/ai-defense0-perf.cjs
node tests/ai-defense0-evidence.cjs
```

`help/audit` araçları ayrıca yerel son test kayıtlarını ister; bunlar `DEFENSE_SAVE` ile özel geçici dizinde üretilir, hazır olmadığı hâlde test edilmiş sayılmaz. Kontrol kökü pinli p23 kaynaklarını Git'ten okur; mevcut çalışma ağacını checkout veya reset etmez.

## 17. GitHub ve görev durumu

Issue#33 bir kez güncel olarak okunmaya çalışıldı: GraphQL **Forbidden**. [Hata](evidence/beta-ai-defense0/issue33-error.log). Pano güncellenmedi; tekrar eden izin denemesi yapılmadı. Ayrı PR oluşturulmadı; çalışma dalı/araştırma commit'i teslimdir. Kullanıcı kabulü olmadan hiçbir görev TAMAMLANDI işaretlenmedi. [Yerel envanter](BETA-AI-DEFENSE0-ENVANTER.md).

|Görev|Önceki durum|Kanıtlanan kök neden / bu faz|Test|PASS/FAIL/NOT RUN|Kullanıcı kabulü|
|---|---|---|---|---|---|
|404 askerî-ekonomik kilit|Bombardıman gözlemi vardı|B kontrolünde gerçek toparlanma; basit finansman açıklaması yetersiz|36/60 ay A/B/C|Nedensellik PASS; kurtarma FAIL|Yok; açık|
|Resmî savaşsız başkent savunması|Tehdit görülüyor, barış devriyesi var|Çağrı kapısı ve kuvvet yetersizliği ayrı doğrulandı; C1 araştırıldı|Gerçek rota/çatışma, dört seed|Taktik PASS; ürün kabulü FAIL|Yok|
|Tersanede gövde israfı|Doğan gemiler kayboluyor|C2 kaynak korudu ama kuvvet kilidini çözmedi;11 yeni kritik ay|40460ay +4seed36ay|FAIL; RET|Yok|
|Müttefik/federasyon yardımı|Normal cepheye bağlı|Korsan cephesi yok; görüş, yedek kuvvet, rota yetersizlikleri|Kapı tanısı+C360ay|Sınır tanısı PASS; kurtarma FAIL|Yok|
|#44 korunma|Önceki60ay bekleme sorusu açık|Bu kayıtta korsan dışlanıyor; yeni bekleme/teklif yok|Gerçek `aiSubmitTick`|Tanı PASS; yeni özellik yok|Açık|
|p22 filo/takviye güvenliği|Önceden geliştirildi|Kod değişmedi|Motor10+MP3|PASS regresyon|Yeni kabul yapılmadı|
|p23 UI/MP|Önceden geliştirildi|Kaynaklar korundu|UI4 ve ilgili MP motorları|Hedefli PASS; native NOT RUN|Gerçek kabul yok|
|#24/#25/#26 özgün vakalar|Kesin kök nedenler ayrı|Bu faz bunları kapatmadı|Yeni özgün kullanıcı tekrarı yok|NOT RUN|Açık|

## 18. Beş kritik soruya yanıt ve kalan işler

1. **AI korsanları algılıyor mu?** Evet; görülen başkent tehdidi3848. Askerî eylem kapısının resmî savaş şartı ayrı kusur.
2. **Neden gideremiyor?** Başlangıç savaş gücü0; tek tersane işgal altında; ucuz tek gövdeler zamanında ortak kuvvet olamadan kayboluyor. Güçlü gövdeler araştırılmamış. Yardımda normal cephe şartı, anlık görüş ve serbest/ulaşabilir kuvvet eksikleri var.
3. **Mevcut kurallarla mümkün mü?** Hazır yeterli kuvvet varsa gerçek çatışmayla mümkün. Bu60. ay kaydında test edilen mevcut/dar değiştirilmiş AI yolları kurtaramadı. Her olası strateji için mutlak çıkışsızlık kanıtlanmadı.
4. **Değişiklik başarıyı artırdı mı?** Dar hazır-kuvvet testinde erken savunma evet;404'te kalıcı askerî-ekonomik kalite artışı hayır. Bu yüzden ürün değişikliği yok.
5. **Diğer devletlerde israf yaratıyor mu?** C2 Seed11'de yeni kritik ay, bazı kollarda bilim/koloni gerilemesi ve404 dünya kritikliğinde artış görüldü. Tutarlı düşük riskli fayda kanıtlanmadı; adaylar dağıtılmadı.

Sonraki dar çalışma için öncelik: **60. ay kilidini zorla açmaya çalışmak yerine ilk bombardıman/ilk tersane kaybından önceki kayıtta savunma hazırlama fırsatı**. Kuvvet oluşturulabilirken mevcut savunma çağrı kapısı ve güvenli üretim noktası seçimi ölçülmeli. İkinci bağımsız tasarım sorusu, doğal korsan düşmanlığında mevcut rıza/yardım sözleşmesinin kapsamıdır; normal savaşı sahte açmadan ortak savunma nasıl yetkilendirilecek? Yeni tür sözleşme bu araştırmada eklenmedi. Genel himaye teklifi/cooldown ve eski aralıklı UI vakaları açık kalır.

**Sonuç:** bombardımanın ekonomik toparlanmayı engellemesi kanıtlandı; krizdeki gerçek kaydı güvenli biçimde kurtaran dar AI düzeltmesi bulunamadı. p23 korunuyor. Ölçülen başarısızlıklar ve yararlı dar davranışlar birlikte teslim edildi; p24 başarısı iddia edilmiyor.
