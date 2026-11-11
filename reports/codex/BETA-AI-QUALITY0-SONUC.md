# STARS — BETA-AI-QUALITY.0 sonuç raporu

11 Kasım 2026. **Karar: araştırma ve test teslimi; yeni runtime sürümü yok.** p23'e göre daha iyi oynadığı kanıtlanan bir AI yaması kabul edilmedi. Mevcut oyun/MP kodu ve p23 ZIP'i birebir korundu. Denenen dar aday yalnız strateji metadatasını iyileştirdi; gerçek ekonomik ve askerî sonuçlar değişmediğinden reddedildi.

## 1. Başlangıç, dal ve bitiş

- Uzak kanonik başlangıç: `b35f8cb7b368ef4e1c24745b84214570f86b5447`, `codex/stars-beta-ui-refinement0-mobile`. Verilen p23 HEAD'iyle eşleşti; [uzak kaynak kanıtı](evidence/beta-ai-quality0/remote-base.txt).
- Araştırma dalı: `codex/stars-beta-ai-quality0`. Eski main kullanılmadı.
- Test/araştırma/kanıt commit'i: [`007b9d046485d2c03753268702a65fe1df255fd0`](https://github.com/sarsiss12-dot/Star/commit/007b9d046485d2c03753268702a65fe1df255fd0); geliştirme dalına push edildi.
- Gerçek oyun kod/paket commit'i hâlâ p23 `183c3ca635c6a65ae0d4320284c2e6ab026efb96`. Araştırma commit'i yeni oyun kodu gibi sunulmaz.
- Nihai rapor commit'i son yanıtta verilir; rapora kendi SHA'sını eklemek için yeni commit zinciri oluşturulmaz.
- Oyun `96h10p23`, PWA `stars-v96h10p23`, MP `MP.8.9b18`, Save8v8, paket4/protokol1. **96h10p24 build/PWA/MP/ZIP oluşturulmadı.**

## 2. p23 ek kabulü ve soğuk multiplayer

Üç ayrı kalıcı Chromium süreci H/B/C, en az5 AI, yerel üretim relay'i, TLS vekili ve ayrı kullanıcı oturumlarıyla mevcut MP8-R testi genişletildi. Altı ay gerçek yarım günlük motor adımları oynatıldı; iki misafir araştırma, filo hareketi, bina ve gemi siparişlerini gerçek host komutlarına gönderdi. Koloniler ikinci `outEmp` akordeonundan native touch ile açıldı; seçim, Göster/küçült/çipten geri ve casusluk sekmeleri kullanıldı.

Devam eden uzaktan inşa, özel misafir event'i, bekleyen insan teklifi ve p22 kurtarma fikstürü varken host'un gerçek MP Save8 kayıt yolu çalıştı. **Bütün Chromium ve relay süreçleri kapandı.** Yeni relay PID'si ve yeni oda koduyla aynı devletlere dönüldü. Kaynaklar, sistemler/kuyruklar, filolar, olay kayıtları, savaş defteri, RNG ve diplomatik kayıtlar karşılaştırıldı. Host'un iki misafire gönderdiği mirror hash/revizyonları eşleşti; gizli kaynak/teknoloji/token sızıntısı görülmedi.

Yeni odada teklif bir kez kabul edildi, tekrar kabul `rules:closed` ile reddedildi. Devam eden inşa tamamlandı ve bedel bir kez kesildi. B'nin27 takviyesi hedefteki1 gemiyle28 oldu, iki ücretli sipariş korundu, kaynak değişmedi; eski kurtarma komutu ikinci kez uygulanmadı. Sonra altı ay daha oynandı. Sonuç **5 PASS / 0 FAIL**: [cold-second.log](evidence/beta-ai-quality0/cold-second.log), [tam ölçüm](evidence/beta-ai-quality0/cold-second/R/mp8-R.json), [native koloni/casusluk ve soğuk kayıt özeti](evidence/beta-ai-quality0/cold-second/R/quality-ui23-cold.json).

Gezinti native dokunmadır. Uzun kampanyanın araştırma/hareket/inşa emirleri misafirin gerçek `MP1Join.cmd` bağlantısı ve host doğrulamasıyla verilir; bunların her biri UI düğmesine dokunularak verilmiş gibi sunulmaz. Ayrı p23 UI matrisi gerçek düğme etkileşimini de sınar.

**İlk FAIL korunur:** ilk birleşik koşu3/2 çıktı. p22 fikstürü kaynakları kaydettikten sonra uzaktan inşa fikstürü aynı kaynakları100000'e çekiyor, kişisel event fikstürü de etki değiştiriyordu. Bu, soğuk yükleme kaybı değildi. Hazırlık sırası değiştirildi; kurtarma sınırı diğer hazırlıklardan sonra alındı, aynı katı kaynak/ücret/gövde assertion'ları korundu. Runtime değişmedi. [cold-first.log](evidence/beta-ai-quality0/cold-first.log).

## 3. p23 UI ve Save8 regresyonu

Tam p23 browser matrisi son kaynakta **30/0** geçti: pregame beş viewport; oyun altı viewport; outEmp/outMap konumu;3/32koloni; yatay taşma/undefined; Haritada Göster/çip; kendi kolonisi istikrarı; ilgili boş gezegen engeli; açık/kapalı sidebar filo ROTA/DUR/SİSTEM; hız0/1/2/4; sivil/askerî filo; casusluk; farklı event açıklamaları; tersane0/1/21kuyruk ve gerçek22.sipariş. Mobilde mevcut etkin100ölçeği, masaüstü filo geometrisinde80/100/125 korunur. [UI logu](evidence/beta-ai-quality0/ui-regression.log), [PNG ve sonuçlar](evidence/beta-ai-quality0/ui-regression/).

p22 gerçek özel oyuncu kaydı testi tekrar PASS verdi:759 toplam/44 oyuncu gemisi,27yetim kruvazör,117ücretli iş, kaynaklar/ilerleme/RNG, AI yetim kurtarma, tekrar komutu ve reload korundu. Özgün dosyanın SHA'sı değişmedi; özel .sav dosyası commit edilmedi. [Gerçek kayıt regresyonu](evidence/beta-ai-quality0/real-save-regression.log). İlk20K ana filo kaybının tarihsel nedeni hâlâ **BELİRLENEMEDİ**.

Eski aralıklı `selfleet`, `dealSend`, `fedFoundStart`, KATIL vakaları açık tutulur. Bu fazın UI/soğuk oda PASS'leri onların genel kök nedenini çözmüş sayılmaz. Fiziksel Android/PC kullanıcı kabulü, LAN, gerçek internet ve Render **NOT RUN**.

## 4. Mevcut AI karar mimarisi

Gerçek sıra ve sorumluluklar:

| Yol | Karar/bütçe ve yetki |
|---|---|
| `monthTick` | Önce ekonomi; attrition ve diplomasi; casusluk/faksiyon/Konsey; federal/diğer aylık etkiler; görüş; sonra tüm yaşayan AI'lar için `aiTurn`. Eski “her ay bir devlet” yorumu gerçek döngüyü anlatmıyor: bütün AI'lar döner. |
| `diploTick` | Hafıza, ittifak incelemesi, vasal vergi/öfke/koruma, ekonomik terhis, operasyon/ordu/lojistik/piyasa, schism, `aiSubmitTick` ve siyasi tikler. Bunlar o ayın `aiTurn`'ünden önce çalışır. |
| `aiTurn` | Gözlem → iç kriz → civic → strateji/uzun plan → diplomasi/koalisyon → ekonomik toparlanma → odak/binalar → gemi üretimi → keşif/koloni → askerî davranış ve diğer mevcut işler. |
| `aiEconomyPlan` | Kendi stok/gelirleri, ödenmiş inşa girdileri, kuyruktaki gemilerin bakımı, federal/vasal aidat ve ticaret yükümlülükleri; ortak6aylık ufuk. Gelecek geliri kasaya yazmaz. |
| `aiRecoverEconomy` | Madenle finanse edilemeyen belirli girdi krizinde gerçek ücretli yıkım/iade yolunu ve120gün beklemeyi kullanır. Her kaynak açığını çözebilen genel optimizer değildir. |
| `aiStrategicFacts`, `aiUpdateLongPlan`, `aiUpdateStrategy` | İzinli bilgi ve kendi ölçüleri;720gün tutma,90gün inceleme,900gün ilerlemesizlik yeniden değerlendirmesi; acil kayıp/tehdit/kriz yeniden seçim nedenleri. |
| `aiMilitaryCampaign`, `aiWarBudget`, `aiKnownRoute` | Yerel savunma önceliği, bilinen hedef, ortak sefer rezervasyonu, ikmal/güzergâh/gerçek bakım bütçesi ve başarısız hedef hafızası. |
| `aiColonyForecast`, `aiShipProduction` | Koloni+hazır/ödenmiş işler ve bakım kapasitesi; gerçek stok/kaynak/erişim motor kapıları; aylık üretim sınırı ve yeniden okunan bütçe. |
| `aiNegotiate` | Mevcut `dealQuote` → `aiRespond` → gerekirse tek tur karşı teklif → `executeDeal`; otomatik benzer teklif beklemesi120gün. |
| `aiSubmitTick` | Küçük/tehdit altında AI için koruyucu arar; rota/güç/ilişki/taahhüt/etki kapıları ve mevcut sözleşme motoru. Güçlü devletin yeni demand teklifini bağımsız açan karşılığı yoktur. |
| `aiFederationPolitics`, `aiCoalitionDiplomacy` | p19 kuruluş/gündem/acil destek ve p18 preparation/teklif/gerçek savaş kimlikleri; insan rızası korunur. |
| `aiOpsTick`, `aiInternalCrisis` | Gerçek operasyon maliyet/rezerv/politika; krizdeki kendi kolonisi için mevcut ücretli destek/özerklik. Yeni paralel karar motoru yok. |

Bütün planlayıcıların tek bir küresel “geleceğe ayrılmış para cüzdanı” yoktur. Güvenlik, ortak tahmin ve gerçek işlemin kaynak kapısını yeniden doğrulamasından gelir. Bu ödeme güvenliğidir; bütün aylık kararların fırsat maliyeti açısından optimal olduğunun kanıtı değildir. Hafıza/cooldown ve kayıp-sonrası yeniden değerlendirme vardır; öğrenen yeni algoritma veya rakibin gizli gerçek dünyasını açan bilgi eklenmedi.

96H.0,96H.8/9/10/11 ve `AI-RED-KARARLARI.md` incelendi. Eski kuyruk, söküm, başkent odağı, ordu bütçesi adaylarının yalnız tek göstergeyi iyileştirip başka seed'de zarar verdiği kanıtları korunur; aynı yamalar yeniden geliştirilmedi.

## 5. Kampanya yöntemi ve ölçüm güvenliği

Baz kaynak `b35f8cb`'den ayrı salt-okunur geçici runtime çıkarıldı. Her koşu aynı CFG, seed, boyut, AI sayısı ve normal kurallarla başlar; insan devlet0 hareketsizdir. AI'lara stok/bonus/gizli bilgi verilmez, doğal kampanyalarda temas/tehdit zorlanmaz. Günler0,5adımla ilerler; gerçek günlük/inşa/keşif/aylık yollar çalışır. Rastgele olaylar ve bütün AI sistemleri açıktır.

İlk tarama: seed11/23/42/99/404,100sistem/9AI,60ay. Sonra en çok kritik ayı bulunan404 ve tek doğal vasallık örneği bulunan42 seçildi:120ay. [Seçim gerekçesi](evidence/beta-ai-quality0/deep-selection.json). 200sistem/16AI,24ay seed11 smoke yapıldı. 240ay ek koşusu gerekli görülmedi; küçük aday gerçek sonuç üretmeyince geniş kampanya bütçesi büyütülmedi.

Her ay her AI için kaynak/gelir, koloni/teknoloji/filo, savaş/vasallık, istikrar/sayaç, hedef/ilerleme ve bütçe kaydedildi. Önemli karar izi **en fazla400olay**; her karede dünya/geçmiş kopyalama yok. Veriler test gözlemcisinde, G/Save8 dışında tutulur. İşlev süreleri Node'un gerçek saatiyle ölçülür. Gözlemci açık/kapalı3ay hamSave8 ve RNG birebir eşit: [observer-purity.log](evidence/beta-ai-quality0/observer-purity.log).

İlk seed11 koşusunda kancaların VM'nin ayrı `window` nesnesine bağlandığı, gerçek global fonksiyonları izlemediği görüldü. Sayaçları boş bu koşu AI karar kanıtı yapılmadı; `campaigns-instrumentation-first` ve log korunur. Kancalar gerçek global'e bağlandı; her baz koşu gerçek `aiTurn` sayısı>0 şartıyla tekrarlandı.

“Kritik devlet-ay”: yaşayan AI'da ene/min/yiy/ala/tuk'tan en az birinin gerçek aylık neti negatif ve stoku3aydan kısa dayanıyorsa1. Aynı devlet-ayda iki kaynak açığı toplamda bir kez sayılır. Bu ölçü motorun6aylık satın alma ufku veya kesin iflas değildir. “Sıfır stok” yalnız negatif netle birlikte sayılır. Plan tamamlanma sayısı mevcut vekil hedef ölçüsüdür, tek başına savaş/strateji başarısı değildir.

## 6. Seed bazında gerçek sonuçlar

| Seed | Sistem/AI | Ay | Kritik devlet-ay | Sıfır stok devlet-ay | Son AI kolonisi | Teknoloji toplamı | Gemi | Tamamlanan/başarısız plan | Vasal | Savaş cephesi |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|
|11|100/9|60|0|0|21|29|121|13/3|0|1|
|23|100/9|60|4|0|18|27|134|13/3|0|1|
|42|100/9|60|0|0|20|42|129|14/0|1|0|
|99|100/9|60|3|0|18|30|169|11/4|0|0|
|404|100/9|60|5|0|25|34|146|13/2|0|1|
|42|100/9|120|0|0|23|97|338|29/0|1|0|
|404|100/9|120|78|70|28|84|241|26/7|0|4|
|11|200/16|24|7|4|35|13|144|12/0|0|1|

60ay başlangıcı her küçük kampanyada9AIkolonisidir; büyük smoke16kolonidir.120ay satırları aynı seed'in ilk60ayını da kapsar; tablodaki satırlar birbirinden bağımsız toplamlar gibi toplanmamalı.

Makine verisi: [kampanya tablosu](evidence/beta-ai-quality0/campaign-table.txt), [aylık kayıtlar](evidence/beta-ai-quality0/campaigns/), [savaş/federasyon/ticaret/aktör analizi](evidence/beta-ai-quality0/analysis.json). Son checkpoint'lerde filo ID tekilliği, sahip/konum/rota sonluluğu ve referanslar doğrulandı: [bütünlük](evidence/beta-ai-quality0/campaign-integrity.json). Geçersiz/negatif stok yoktu. Bu, ekonomik kalite sorunu yok demek değildir.

## 7. Ekonomi kalitesi ve kanıtlı darboğaz

Kısa kampanyaların çoğunda sürdürülebilir genişleme ve teknoloji üretimi var. Kuyruktaki bakım/girdi, fed/vasal aidatları ve gerçek ödeme kapıları çalışıyor. 42/120 koşusunda kritik ay0,23koloni/97teknoloji/338gemi ve177gerçek ticaret teslimatı görüldü. Ticaret faaliyeti yalnız teklif sayısı üzerinden ölçülmedi.

Buna karşılık404/120'de78kritik devlet-ayın63'ü devlet2'ye,13'ü sonradan oluşan devlet12'ye,2'si devlet6'ya ait. Devlet2 ardışık63kritik ay,60sıfır-stok ayı yaşadı.58.ayda tüketim stoku30,7/net−10,4;60.ayda10/net−10,4;70.ayda0/net−12,3;120.ayda0/net yaklaşık−13,9.120.ayda maden stoku22,5/net yaklaşık+4,4, gıda stoku25/net−18,9. Bunlar son Save8'in salt-okunur yüklenmiş kopyasındaki türetilmiş yuvarlama zamanına bağlı değerlerdir; aylık dosyada kapanış anının hafif farklı netleri ayrıca saklıdır.

Kök neden tek bir kaynak eksi işareti değil: üretici bina için gerçek maden bedeli, altı aylık girdi/bakım güvenliği ve düşük maden akışı birlikte kilit oluşturuyor. Son durumda fabrikaya170maden gerekiyor; stok22,5. `aiRecoveryInvestment` kendi geliriyle en fazla3ayda finanse edebildiği yatırımı ayırıyor; bu durumda ayırmıyor. `aiRecoverEconomy` ise maden neti negatif veya belirli enerji krizi şartında devreye giriyor; burada maden neti az da olsa pozitif. Riskli yeni bina kapısı geçemiyor. AI durumu “recovery” diye adlandırmakla kaynak darboğazını çözemiyor.

İkincil etki: tüketim açığı istikrar/verim ve sonraki gıda dengesini zorlaştırıyor. Savaş gemisi sayısını artırmak çözüm değil. Devlet12'nin gıda krizi de yeni devletin devraldığı üretim/bütçe kapsamıyla ayrı ele alınmalı. Bu mekanizmaların benzerleri eski96H ekonomik raporlarında var; geçmiş reddedilmiş rezerv/söküm yamaları güvenli çözüm gibi yeniden alınmadı.

Enerji stoku0 ve negatif net tek başına #24 hatası sayılmadı. Bu deneylerde muhasebeyle çelişen bedelsiz stok artışı kanıtı yok. Tam bina yatırım ROI'sini her karşı-olgusal bina için ölçtüğümüz iddia edilmez; gerçek gelir/ödeme ve sürdürülebilirlik sonuçları raporlanır.

## 8. Askerî strateji ve gerçek sonuçlar

404/120'de filolar yalnız üretilmedi, hareket/çatışma/kuşatma ve fetih gerçekleşti. Savaş defterinden örnekler:

| Cephe | Taraf | Kayıp / imha | Gerçek kazanım |
|---|---|---|---|
|1,7→1|AI7|22 /43gemi|1sistem, kayıtlı gezegen fethi yok; gün2010'da bitti|
|2,3→1|AI3|4 /16gemi|2sistem ve8:0gezegeni; gün2490'da bitti|
|3,7→1|AI7|2 /1gemi|2sistem ve25:0,33:4gezegenleri; gün2580'da bitti|
|4,7→3|AI7|5 /2gemi|Henüz kazanım yok;120.ayda açık|

AI7'nin son savaş ilanında bildiği güç4810/1552, enerji858,7/net−37,9 ve yaklaşık22,6aylık mevcut dayanma payı vardı. Bu, bütçe kapısının niçin izin verdiğini açıklar; savaşın iyi sonuçlanacağını kanıtlamaz. İlk kayıp5/2 olumsuzdur, fakat açık savaşı kesin yanlış karar/nihai yenilgi saymak için süre ve karşı-olgusal kontrol yetersizdir.

Kontrollü vasallık savunma deneyinde AI koruyucu kendi önceki nötrlüğünden gerçek `overlord` cephesine girdi, askerî AI `attack` seçti, [3,4] rotasını verdi ve filo normal yarım günlük motor adımlarıyla gerçek hedefe vardı. [Vasallık askeri kanıtı](evidence/beta-ai-quality0/vassal-complete/vassal.json). Mevcut p19 koalisyon kampanyası3/0 da gerçek hazırlık/ilan/askerî davranışı tekrar doğruladı.

Hareketsizlik her zaman kusur değil: ekonomi toparlanması, bilinen hedef/erişim yokluğu, ikmal, savunma önceliği ve güç yetersizliği mevcut nedenler. Ordu eskortu ve çok kaynaklı savaş finansmanı gibi eski açık riskler yeni kanıt olmadan kapanmadı; p22 filo kimliği/takviye güvenliği korunur.

## 9. Vasallık ve diplomasi — #44

Doğal42kampanyasında gün1410'da AI4→AI3 korunma teklifi oluştu ve mevcut motor kabul etti.120.ayda ilişki sürüyordu. Her güçlü/zayıf çiftte teklif oluşması beklenmez: bilinen tehdit, temas/erişim, güven, en çok6sistem,90etki, mevcut vasallar ve siyasi taahhütler kapı oluşturur. Ayrıca yeterince güçlü koruyucunun kendi isteklilik kontrolü vardır.

Kontrollü matris son kaynakta **10/0**: [log](evidence/beta-ai-quality0/vassal-complete.log), [ID/şart/ücret/geçmiş/karar verileri](evidence/beta-ai-quality0/vassal-complete/vassal.json).

| Senaryo | Ölçülen gerçek davranış |
|---|---|
|Zayıf AI→güçlü AI|Gerçek başvuru ve90etki, alıcının gerçek sözleşme değerlendirmesi|
|AI→insan|Bekleyen gerçek teklif; insan yanıt vermeden vasallık yok|
|Tehditsiz zayıf devlet|Bağımsız kaldı; teklif yapılmaması doğru negatif kontrol|
|Kapalı/bilinmeyen yardım rotası|Teklif yok; gizli güçlü filo erişim yaratmıyor|
|Savaşta korunma|Kabul sonrası gerçek koruma cephesi, askerî emir ve varış|
|Aşırı ağır sözleşme|Son turda gerçek assessment ret|
|Gerçek karşı teklif|Motor geçmişinde counter,20etki; sınırlı tur|
|Güçlü AI yeni himaye başlatma|Motor API'si çalışıyor; **bağımsız çağrı yok**. Gözlem testinin PASS olması bu özelliğin yapılmış olduğu anlamına gelmez.|
|İsteklilik kontrolü olumsuz|Teklif/ücret oluşmadan `_submitCd=memAge+60`;60ay bekleme gözlendi|
|İki uygun koruyucu|Ulaşılabilen ortak düşmanlı aday, yalnız daha büyük ham gücü olan adayın önüne geçti|

İlk matris4/4 verdi: temas ile gözlenmiş başkent/rota aynı şey sanılmış, kapalı sınır ve son derece ağır teklif karşı teklif yerine ret üretmişti. Fikstür açık geçiş ve meşru geçmiş gözlemle düzeltildi; gerçek kapılar ezilmedi, assertion gevşetilmedi. İki ilk4/4 logu da korunur. Sonra koruyucuyu savaşta başlatan ilk test güçlendirildi: başlangıçta nötr koruyucunun gerçekten yeni cephe açması ve gerçek varış ayrıca şart oldu.

**Açık kalite noktaları:** güçlü AI yeni demand teklifini bağımsız başlatmıyor; ayrıca60ay cooldown isteklilik kontrolünden önce yazıldığından hiç teklif verilmeden5yıl erteleme olabiliyor. İkincisinin spam önleme ile fırsat kaybı dengesi ayrı ölçüm ister. Bu faz sözleşme motorunu veya bu politikayı değiştirmedi. Kabul/ret/karşı teklifin çalışması, genel vasallık kalitesini tamamlanmış saydırmaz.

## 10. Federasyon, koalisyon, hedef ve hafıza

Doğal120ayda42'de8üyeli,404'te4üyeli bilimsel federasyon oluştu; karar geçmişleri sırasıyla32/20kayıt içeriyordu. Bunlar benzersiz gündem sayısı diye yorumlanmaz; oy/sonuç kayıtları da içerir. Karma üyeler ve gerçek diplomatik bağlar var. Serbest kampanyada Yağmacı Federasyon veya bağımsız ücretli destek oluşmaması tek başına hata sayılmadı. Mevcut p19 pozitif/negatif koalisyon, Yağmacı türü, düzenlenebilir kuruluş, acil gündem ve MP testleri ayrıca geçti.

Uzun planlar her ay rastgele değişmiyor: en az720gün tutma, mevcut hedefe uygun eylemler, ilerleme/kayıp/30ay başarısızlık hafızası görülüyor. Fakat “başarılı hedef” ölçüsünün sınırı önemli: `contain` kendi sistem artışını, `security` savunma yapısı sayısını, `recovery` bütçe durumunu kullanıyor. Bunlar gerçek düşmanın kontrol altına alınması veya uzun vadeli ekonomik başarıyla aynı değildir. Bu faz metrik sayısını güzelleştirmek için hedef motorunu değiştirmedi.

Kendi bilinen gücü/rota/taahhüt bütçesi temelinde görüşler doğrulandı. Karşı tarafın özel stokunu veya gizli filo değişimini kullanarak yeni karar bilgisi verilmedi. Geniş ilişkisel fayda ve ücretli savaşa katılımın kârı için tek bir kabul oranı yeterli bulunmadı.

## 11. İsyan ve iç istikrar kalitesi

Mevcut p21seed23/AI3 gerçek kalıntı olayı aynen yeniden üretildi: gün1007, sistem35, +520maden/−12istikrar. Yeni şiddet veya RNG ayarı yok.

Aynı olay sonrası başlangıç Save8'inden24ay, bütün AI sistemleri açık, üç kol:

| Kol | Yeni politika | Etki harcaması | İstikrar<40 koloni-ay | Sayaç alanı toplamı | Son koloni /schism |
|---|---:|---:|---:|---:|---|
|Yeni kriz kararları kapalı|0|0|18|492|8 /0|
|p21 mevcut karar|2özerklik|160|18|492|8 /0|
|Bu fazın değişmemiş AI'sı|2özerklik|160|18|492|8 /0|

[Karşılaştırma](evidence/beta-ai-quality0/crisis-outcome-comparison.json), [tam24ay verisi](evidence/beta-ai-quality0/crisis-regression/quality.json). Başlangıç politikaları silinmedi; off yalnız sonraki kriz kararlarını kapatır. Her üç kol sonunda doğal olarak toparlandı; mevcut politikalar12.ayda ortalama istikrarı58,81→61,81 yaptı,24.ayda ortalama66,56'da eşitlendi. **Bu örnekte160etkinin koloni kurtarma veya sayaç maruziyeti yararı kanıtlanmadı.** “AI sekiz koloniyi kurtardı” denmez.

Kök politika her ekonomik olmayan yerel riskte5sayaç/40istikrar kapısından sonra ücretli destek arıyor; mevcut doğal toparlanmanın müdahale gerektirip gerektirmediğini ayrıca kıyaslamıyor. Fırsat maliyeti için güçlü sonraki araştırma noktasıdır. Geniş güvenlik payı olmadan müdahaleyi kapatmak da dış kışkırtma/schism riskini artırabilir; bu faz yeni kestirim motoru eklemedi. Yoksul AI'nın kaynak yaratmadan reddi ve uygun kriz pozitif kontrolü geçti. Önceki altı aylık FAIL tarihsel olarak korunur.

## 12. Denenen tek dar iyileştirme ve RET kararı

`aiStrategicFacts.severe` uzun hedefin acil kaynak listesinde gıdayı içermiyor. Gerçek404devlet12 gıda krizi yaşarken uzun hedef security/economy kalabiliyordu; alt plan yine stabilize seçiyordu. Bu somut tutarsızlık için listeye yalnız `yiy` ekleyen bir satır test runtime'ında denendi. Üretim dosyasına yazılmadı; diğer ekonomi/savaş kuralları aynıydı.

Aynı başlangıç Save8/hash, seed404/100sistem9AI/120ay:

| Ölçü | p23 | Dar aday |
|---|---:|---:|
|Kritik devlet-ay|78|78|
|Koloni /gemi /teknoloji|28 /241 /84|28 /241 /84|
|Başarısız plan|7|6|
|Her aylık kaynak, gelir, koloni, filo, istikrar ve savaş alanı|Baz|Birebir aynı|
|Son RNG|−1458142310|−1458142310|

İlk aylık kayıt farkı108.ayda strateji metadatasındadır. Son Save8 hash'i bu yüzden farklıdır; oyun sonuçları aynı diye ham kayıtlar normalize edilmedi. **Plan başarısızlığını7→6 göstermek gerçek kalite kazancı değildir.** RET: [karar](evidence/beta-ai-quality0/experiments/decision.json), [yalnız araştırma yaması](evidence/beta-ai-quality0/experiments/food-critical-REJECTED.patch). `AI-RED-KARARLARI.md` güncellendi. İkinci yama denenmedi; mevcut kanıt daha geniş bütçe/risk çalışması gerektiriyor.

## 13. Performans ve koruma testleri

200sistem/16AI/24ay smoke: toplam16,73s, yaklaşık102MiB Node heap; aylık motor ortalaması255,8ms, gözlenen en uzun507,2ms. Tüm AI turn toplamı4074,9ms;384normal AI turu+24vahşi turu gözlendi. Bu Node/VM ve gözlemci ölçümüdür; bazı koşularda Chromium aynı makinede çalışıyordu. Fiziksel Android FPS, P95 veya üretimde tek host karesi sertifikası değildir. Oyun kodu aynı olduğundan performans iyileşmesi iddiası yok.

24ilgili regresyon script'inin tamamı exit0: [liste](evidence/beta-ai-quality0/regression/results.json). İçerik: stratejik bilgi/rota/gizlilik; sözleşme motoru/vasal bütçe; koalisyon/Yağmacı/kuruluş düzenleme/acil gündem/MP ve gerçek koalisyon kampanyası; federasyon FIFO; Savaş Merkezi motor/MP; koloni/uzaktan inşa; casusluk/isyan motor/MP; filo kurtarma motor10/0 veMP3/0; UI4/0; callback/Save8/RNG9PASS; P0 kararlar; MP75; PERF1/PERF2.

Bunlar bütün repository testlerinin tamamının yeniden çalıştırıldığı anlamına gelmez. Nihai adayda gameplay değişikliği yok; uzun doğal kampanyaların “daha iyi AI” karşılaştırması olarak ikinci bir aynı kod koşusu çoğaltılmadı. Kontrol kaynak hashleri ve bütün runtime/MP bayt kimliği doğrulandı.

## 14. Paket, GitHub ve dosyalar

[Runtime/MP kimlik kanıtı](evidence/beta-ai-quality0/release-identity.json):19runtime, manifest ve ilgili5MPdosyası p23 ile birebir aynı. İki yeni geçici deterministik paket üretildi; ikisi de mevcut p23 ZIP'iyle birebir eşleşti. Yeni paket adı veya sürüm üretilmedi.

- Mevcut oyun ZIP'i: `releases/stars-faz96h10p23.zip`,836950bayt.
- SHA256: `af6eb03aade38327e48ee290029377e638b40167ff87742a57be82cec5bd7d1d`.
- CRC32: `13718624`;20girdi,19runtime manifesti; CRC/hash doğrulandı.
- MP relay/istemci oyun ZIP'inin parçası değildir; değişmeyen uyumlu kaynakları aynı dalda bulunur.

Değişen ürün dosyası yok. Yeni testler: `ai-quality0-campaign.cjs`, `ai-quality0-analyze.cjs`, `ai-quality0-vassal.cjs`; pinned kontrol/gözlemci/soğuk UI yardımcıları. `browser-mp8.cjs` opt-inAIQ0_R ve birleşik fikstür sırası güncellendi; mevcut kaynak/ücret assertion'ları korundu. Devir/son rapor/envanter ve reddedilen AI karar belgeleri güncellendi.

[Dal](https://github.com/sarsiss12-dot/Star/tree/codex/stars-beta-ai-quality0), [p23'e karşı compare](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-ui-refinement0-mobile...codex/stars-beta-ai-quality0). Issue33 tek okuma denemesi GraphQL `Forbidden`: pano okunmuş/güncellenmiş sayılmadı; [yerel envanter](BETA-AI-QUALITY0-ENVANTER.md). Yeni PR oluşturulmadı. Main merge/force-push/Render deploy veya restart yapılmadı. Özel Save8 commit edilmedi.

## 15. PASS / FAIL / NOT RUN ve görev durumu

| İş | Gerçek durum | Sonuç | Kullanıcı kabulü |
|---|---|---|---|
|p23 soğuk oda|İlk3/2fikstür çakışması korundu; sonra yeni süreç/oda5/0|PASS yerel|Bekliyor|
|p23 UI|Beş pregame/altı oyun viewport'u; native/rect kontroller30/0|PASS yerel|Bekliyor|
|AI baz kampanyalar|5×60ay,2×120ay,200/16×24ay|Ölçüm tamam; kalite kusurları açık|Rapor geldi|
|#44 zayıf korunma/karşı teklif/insan rızası|Doğal kampanya ve10kontrollü gözlem|PASS mevcut yollar; genel görev açık|Bekliyor|
|#44 güçlü bağımsız demand|Motor var, bağımsız çağrı yolu yok|EKSİK / yeni geliştirme yapılmadı|Açık|
|Kriz AI|Gerçek şok ve24ay×3kol; politika maliyeti/faydası ayrıldı|PASS regresyon; kalite fırsatı açık|Rapor geldi|
|Dar gıda adayı|Gerçek sonuç kazanımı yok|RET, oyuna alınmadı|Uygulanmaz|
|p22 gerçek Save8 ve soğuk kurtarma|759/44gövde,117iş, ücret/replay/reload|PASS regresyon; ilk20K neden bilinmiyor|Tarihsel ayrım korunur|
|#40/#45|Mevcut koalisyon koruması/200sistem16AI smoke|PASS sınırlı kapsam|Uzun/fiziksel kabul ayrı|
|Eski aralıklı etkileşimler|Yeni senaryolar geçti; özgün kök neden kesinleşmedi|AÇIK|Bekliyor|
|Fiziksel Android/PC, LAN/internet/Render|Bu ortamda yapılmadı|NOT RUN|Bekliyor|

İlk başarısız koşular ve hatalı gözlemci koşusu silinmedi. Assertion kaldırma, force-click, timeout artırma veya başarısız dosyayı son PASS ile değiştirme yapılmadı. [Kanıt hash indeksi](evidence/beta-ai-quality0/EVIDENCE-MANIFEST.json).

## 16. Net cevaplar ve sonraki öncelikler

**AI p23'e göre daha iyi oynuyor mu?** Hayır; bu fazda kabul edilmiş AI değişikliği yok. p23'ün güçlü ve zayıf tarafları daha iyi ölçüldü, eksik soğuk kabulü tamamlandı.

**Başarılı kararlar:** uygun tehditte erişilebilir koruyucu seçme, insan rızasını bekleme, gerçek karşı teklif/ret, zorunlu savunmayı gerçek cephe/filo hareketine dönüştürme, bazı seed'lerde sürdürülebilir koloni/teknoloji ve ticaret. **Kaynak israfı riski:** doğal toparlanacağı ölçülen krizlerde160etki harcaması, uzun süreli düşük maden/tüketim tuzağı, koruma istekliliği olumsuzken hiç teklif vermeden60ay bekleme.

**Yanlış savaş hangi durumda?** Bir açık savaşta ilk sonuç olumsuz olsa da kesin yanlış ilan/kesin yenilgi kanıtlanmadı. Yeterli bilinen güç oranı ve finanse edilmiş ilk bakım, uzun vadeli zaferi garanti etmiyor; hedefe erişim/ikmal ve ekonomi birlikte ölçülmeli.

**Beklenen vasallık niçin oluşmuyor?** Güçlü tarafta bağımsız başlangıç yolu yok. Zayıf tarafta tehdit,≤6sistem,90etki, mevcut taahhüt, rota/güven ve isteklilik kontrolü var;60ay bekleme hiç teklif verilmeden de başlayabiliyor. Yalnız güç farkına bakarak “hata” denmez.

**Krizden çıkarken başka krize mi giriyor?**404devlet2 tüketim açığıyla uzun süre sıkışırken gıda/maden kapasitesi de zorlandı; “recovery” etiketi sürdürülebilir çıkış sağlamadı.42'de böyle bir kriz görülmedi. Sonuç seed ve başlangıç ekonomisine bağlı.

**En çok fayda sağlayan tek değişiklik hangisi?** Kabul edilmiş oyun değişikliği olmadığı için böyle bir başarı iddiası yok. Denenen tek satır gerçek fayda sağlamadı.

Sonraki AI çalışması için öncelik:

1.404devlet2'nin aynı kayıt noktasında çok kaynaklı finanse edilebilir üretici yatırımı;3ay/6ay kapıları ve eski reddedilmiş yamaların yan etkileriyle birlikte kontrollü tasarım. Tek kaynağı düzeltip başka kaynağı çökertmemeli.
2. Doğal toparlanma ile ücretli istikrar müdahalesini karşılaştıran dar karar deneyi; dış kışkırtma/schism ve kritik sayaçta güvenlik payı zorunlu.
3. #44'te teklif öncesi60ay bekleme ve güçlü AI bağımsız himaye girişimi için önce maliyet/koruma/ret sıklığı kabul kapısı; sırf faaliyet sayısını artıran davranış eklenmemeli.
4. Açık404son savaşının daha uzun, aynı kayıt noktalı karşılaştırması; yeni240ay kampanya ancak bu somut soruya yanıt verecekse.
5. Fiziksel Android/Render kullanıcı kabulü ve özgün aralıklı etkileşim kanıtları. Yeni büyük Konsey/arma/vasallık/savaş motoru bu fazda geliştirilmedi.

## Yeniden çalıştırma

Mevcut test bağımlılıkları ve Chromium gerekir. Ham başlangıç/son kampanya Save8'leri yalnız sentetik ve yerel üretilir; `AIQ_SAVE_ROOT` verilirse ayrı dizinde tutulur. GitHub kanıtında aylık JSON ve özet bulunur.

```sh
AIQ_MODE=p23 AIQ_SAVE_ROOT=/tmp/aiq0-saves STARS_OUTPUT=/tmp/aiq0/campaigns node tests/ai-quality0-campaign.cjs 404 120 ulu 9
AIQ_MODE=p23 AIQ_SAVE_ROOT=/tmp/aiq0-saves STARS_OUTPUT=/tmp/aiq0/campaigns node tests/ai-quality0-campaign.cjs 11 24 s200 16
AIQ_EXPERIMENT=food-critical STARS_OUTPUT=/tmp/aiq0/experiments node tests/ai-quality0-campaign.cjs 404 120 ulu 9
AIQ_MODE=p23 STARS_OUTPUT=/tmp/aiq0/vassal node tests/ai-quality0-vassal.cjs
AIQ0_R=1 MPP0_R=1 BOARD2_R=1 STABILITY0_R=1 MP89_R_STATE=1 MP8_SCEN=R MP8_MONTHS=6 STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/aiq0/cold node tests/browser-mp8.cjs
STARS_OUTPUT=/tmp/aiq0/ui node tests/browser-beta-ui23.cjs
```

60ay taraması ilk komutta seed11/23/42/99/404 ve süre60 ile tekrarlanır;42derin koşusu120aydır. Analiz: `AIQ_SAVE_ROOT=/tmp/aiq0-saves STARS_OUTPUT=/tmp/aiq0 node tests/ai-quality0-analyze.cjs`. Gözlemci katılımı her kampanyada zorunluassertion'dır. Reddedilmiş deney mevcut oyun dosyasına uygulanmaz.
