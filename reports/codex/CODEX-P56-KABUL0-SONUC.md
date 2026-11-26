# STARS · CODEX-P56-KABUL.0

## Karar

**Sonuç B · `96h10p57 / MP.8.9b56` doğrulanmış yayın adayı.** p55 ve p56’daki relay başlangıç yarışı, hazır mesajı kapanış işleyicilerinden sonra yayımlanarak düzeltildi. I100/I3 ve F5 için çok oyunculu testlerin ön koşulları güçlendirildi. Federasyon AI, keşif, savaş, ortak harekât ve ticaret kuralları p56 ile aynı. Adayın kritik yerel kabul senaryoları, Save8/RNG ve normal simülasyonda %5 performans kapısı geçti.

## 1. Kaynak, sürüm ve devir

p56 kaynak HEAD `c187a12dee1c799f55453d4a21510efece934900`, p55 kontrol HEAD `914c00310200bbda97abdcecab56934fccbd7cf3`. Uzak dal ve PR baş referansları bu SHA’larla eşleşti. #81, #80’in dalını hedefliyor ve iki kaynak dalın ortak atası p55’in tam HEAD’i. Codex dalında test ve araç commit’i `e640bb4118d7132bf4c01a153757f7f3a8afe13b`. GitHub’da hedefi p56 olan [taslak PR #82](https://github.com/sarsiss12-dot/Star/pull/82) açık.

- Oynanışta p55 → p56 farkı `ai.js`. Federasyon reformu, çıkış ve katılım değerlendirmesi, barış ödül avında o anda sensörle görülen hedefler. Save8 yazıcısı, görünürlük, federasyon karar motoru, savaş ve `jointOps` değişmemiş.
- Paket ve sunum kimliği `main.js`, `sw.js`, MP istemci ve relay’de güncellenmiş. MP çekirdeği önceki uyumlu paketlere p56’yı ekliyor. Save8 v8, paket 4, protokol 1. `_fedLeft`, `_fedReformAsk`, `_fedStrain` imparatorluk verisiyle saklanıyor. Misafir aynasının beyaz listesinde bu AI alanları bulunmuyor.
- Reform ve doktrin puanı doğrudan rastgele sayı çekmiyor. Açılan gerçek reform oyu mevcut `fedOpenVote` yolundaki eski RNG rezervlerini kullanabiliyor. Ödül yolu eski `.35` RNG kontrolünden sonra aday hedef kümesini genişletiyor. Tetik öncesi eşdeğerliğin anlamı bu ayrımdır.
- p56 ZIP **PASS**. 973.451 bayt, SHA‑256 `76afe9a1e1ea7fe7d53e63d26f020c3552c601a97fc361b194e45fc25389018b`, CRC32 `BF4AFEB4`. 20 girişin tamamı yerel arşiv CRC’si, yayın kaydındaki SHA‑256 ve p56 ağacındaki dosyayla karşılaştırıldı. [ZIP denetimi](evidence/p56-kabul0/zip.json) · [Kanonik #81](https://github.com/sarsiss12-dot/Star/pull/81) · [p55 #80](https://github.com/sarsiss12-dot/Star/pull/80)

## 2. I100 / I3

Claude’un iki 100 sistem koşusunda B, 30 sistemi kendi sensörüyle görüyordu. C bu 30 sistemin tamamını zaten görüyordu. Dolayısıyla doğru yönde çalışan anlaşma bile “C en az bir yeni sistem gördü” ön koşulunu sağlayamazdı. Kontrol p55’in eski koşusunda 14 yeni hedef bulunmuştu. Canlı 8 dakikalık oyun döngüsü aynı tohumda bile aynı simülasyon günü, hız ve görüşe ulaşmayı garanti etmiyor. Bütün farkı p56’nın yuva kararına bağlayacak kanıt yok.

Yeni fikstür gerçek odanın başlangıç Save8’ini ayırır. Uzun oturumun ardından üç ayrı sistemi, B ve C’ye birer gerçek test filosu yerleştirerek belirler. B’nin sistemi paylaşılabilir, C’nin sistemi ters yönde gizli, üçüncüsü iki tarafta da gizli kalmalıdır. Test gerçek misafir teklif ve kabul komutlarından ilerler. C’ye **B’nin bütün gerçek sensör kümesi** eklenmelidir. Hostun görünür/bilinen sistem kümeleri aynı kalmalıdır. Her aşama yayımlanan revizyonun uygulanmasını bekler. İzin ve görünürlük Save8 yeniden kurulduktan sonra tekrar ölçülür.

Bu turda eski fikstürle yapılan p55 ve p56 koşularında I3 sırasıyla 19 ve 20 yeni sistem gördü. Sızıntı 0, C aynası eşitti. Her ikisinde I2’nin seçtiği ilk normal AI rakibin silahlı filosu bulunmadığı için görsel çatışma fikstürü durdu. I2 şimdi silahlı filosu olan uygun rakibi bütün canlı adaylar arasından seçer. Gerekirse çatışma örneğine tek korvet ekler ve bunu ölçüme yazar. Filo rotası, keşif, sahiplik, can ve çatışma görüntüsü iddiaları korunur.

Yeni odak testi **p55 2/0, p56 2/0**. Her ikisi de 100 sistem, 9 AI, tohum 404, aynı iki misafir koltuğu, aynı sensör ve sistemlerle koştu. Başlangıç RNG `1958112936`. Oda açılışının duvar saati farkı nedeniyle anlık Save8 günleri farklıydı. B’nin 4 numaralı sistemi, C’nin yalnız kendisinin gördüğü 9 ve iki taraf için gizli kalan 10 her iki kolda aynı. Host/B/C görüşü **6/28/8 → 6/28/33**. Yeniden açılan Save8’in RNG’si aynı ve iki uygulanan misafir aynasının görüşü beklenen kümeye eşit.

Kusur enjeksiyonu beklenen **FAIL** sonucunu verdi. İzin gerçek komutla oluştuğu hâlde B’nin sensör verisi çıkarıldığında C 8 sistemde kaldı ve test tam küme eşitliğinde durdu. İlk yeni fikstür denemeleri de saklandı. Onlarda ne p55 ne p56 ters yön için özel hedefi sağlayabilmişti. İkinci test filosu bu ön koşulu belirgin hâle getirdi.

p56’da iki tam uzun Chromium koşusu da **4/0**. 100/9 ve 500/16’da ayrı profillerde host ve iki misafirle altışar dakika, 234/236 örnek ve 12’şer olay. Pencere kapalıyken 20 saniyelik donma 0. İkişer misafirden gelen gemi siparişleri hostta kabul edildi ve aynada görüldü. Görsel ayna farkı 0. 500/16’da host/B/C görüşü **4/32/8 → 4/32/40**, aynı küme kayıttan sonra da korundu. [100 sistem ham oturumu](evidence/p56-kabul0/mp/I100.json) · [500 sistem ham oturumu](evidence/p56-kabul0/mp/I500.json)

[Eski I100 koşuları](../claude/evidence/fed-ai-siyaset0/mp8/regresyon/I100.txt) · [Fikstür ve sensör kontrolleri](../../tests/helpers/mp-sync-fed1-soak.cjs)

## 3. F5 başkanlık bildirimi

Burada iki ayrı olay gerekli. Önce her misafir başkanlık değişiminden önceki üyeliğini ve eski başkanı ilgili ayna revizyonunda görmeli. Sonra başkanın değiştiği revizyonu uygulamalı ve DOM’a kart gelmeli. Eski F yardımcı işlevi ayna bekleme hatasını yutuyor, ardından sabit 400 ms uyku kullanıyordu. `settle` tek başına aynı oyun gününde alınmış aynanın uygulandığına dair yeterli kanıt değildi. F5 şimdi değişimden önce üyelik, uygulanan revizyon ve kart üreticisinin eski lider kaydını denetliyor. Değişimden sonra yeni lider, alınan/uygulanan revizyon ve kart ayrı bekleniyor. MutationObserver kartın ilk DOM zamanını ve kimliğini kaydediyor. Oyun ve misafir koduna ek bildirim yazılmadı.

İkişer tekrarın tamamı **PASS**. p55 `6/0 + 6/0`, p56 `6/0 + 6/0`. Başkan değişiminden kartın DOM’da oluşmasına p55’te **262–475 ms**, p56’da **282–497 ms** geçti. İki misafir de değişimi barındıran tek bir yeni revizyon uyguladı ve yeniden bağlanmada C’de kart sayısı 1 kaldı. Ayrıntılı p56-B tekrarında host değişimden 17/76 ms sonra B/C’ye aynayı gönderdi. Paketler 178/190 ms’de alındı, kartlar 282/324 ms’de oluştu. Test DOM sorguları kartlardan sonra geldi.

İlk ayna yeni başkanı içerirse `UI.instLeaderRows` bunu başlangıç değeri kabul ediyor ve değişim kartı üretmiyor. Aynı işlev, önce eski başkan görülürse tek kart döndürüyor. Bu ayrım p55 ve p56’da kontrollü olarak aynı. Önceki FAIL’deki 20 saniyelik kayıt hangi misafirin hangi revizyonu gördüğünü içermez. Eski fikstürün yarışa açık ön koşulu doğrulandı. O tarihsel koşuda bildirimin kaybolduğu veya bu yarışın gerçekleştiği kesinleştirilemedi. Yeni tekrarlarda ürün bildirimi kaybı gözlenmedi.

[Claude ilk FAIL](../claude/evidence/fed-ai-siyaset0/mp8/regresyon/F.txt) · [Yeni zaman çizelgesi](../../tests/helpers/event-ux1-mp.cjs)

## 4. İlk reform ayı ve sürekli CPU maliyeti

İlk ay ve ikinci ayın girdileri farklı. Geçiş ölçüsünde iki kol aynı p55 kaydını açıyor. Sürekli ölçüde önce p56’da bir ay çalıştırılıp elde edilen aynı Save8 iki kola veriliyor. Her örnek aynı girdiyi tekrar açıyor. ABBA / BAAB, aynı sürümlü A/A kontrolü, CPU ve geçen süre ayrı. Profilde `dealTxBegin` maliyeti dış işlem ile tekil reformun içine ayrıca yazıldı. Save8 ve RNG aynı kolda her replikada eşit olmak zorunda.

Önceki kanıt 500/120’de +%10,38 ve 500/180’de +%7,13 ortalama geçiş maliyeti bulmuştu. 500/120’de 155 ve 88 ms’lik iki reform işlemi vardı. Sürekli durumda raporlanan ortalama fark −%0,95 / −%0,35, siyasi stres +%2,28. Kopyalama siyasi işlemi atomik geri almak için kullanılıyor. Reform sayısını sınırlayarak veya işlemi geciktirerek elde edilecek hız, aynı oyunu ölçmüş olmaz. Dar kapsamlı işlem kopyası, tüm yazma kümesi ve rollback ispatı olmadan güvenli sayılmadı.

Bağımsız tekrarın ilk iki noktasında dört örnek/kol kullanıldı. Süreler süreç CPU milisaniyesidir. 500/120’de p56 ilk ay iki önerge denedi. Kabul edilen önergenin 106,44 ms CPU süresinin 105,83 ms’si `dealTxBegin` içindeydi. Diğer önerge mevcut kapıda kopyasız reddedildi. `aiFedMismatch` 12 çağrıda toplam 0,35 ms, `aiFedStayReview` 10 çağrıda 1,32 ms. `jointTick` iki kolda da 60 çağrı. p55’te de farklı bir siyasi işlem kopyası vardı. Bütün aylık farkın tek kopyaya yüklenmesi için bu tek profil yeterli değil.

| Girdi | p55 → p56 ortalama / medyan / p95 CPU ms | Yüzde farkı | A/A ortalama / medyan / p95 farkı |
|---|---|---|---|
| 100/9 120 ilk | 695,93 / 712,55 / 828,94 → 804,68 / 801,14 / 903,01 | +15,63 / +12,43 / +8,94 | — |
| 100/9 121 devam | 729,90 / 687,39 / 936,26 → 734,15 / 734,02 / 832,56 | +0,58 / +6,78 / −11,08 | +12,19 / +9,73 / +13,79 |
| 500/16 120 ilk | 3.184,64 / 3.145,84 / 3.320,41 → 3.587,98 / 3.600,38 / 3.917,95 | +12,67 / +14,45 / +18,00 | — |
| 500/16 121 devam | 3.036,58 / 3.088,88 / 3.310,32 → 2.945,76 / 2.974,08 / 3.162,29 | −2,99 / −3,72 / −4,47 | +0,87 / +0,50 / +1,78 |
| 500/16 180 ilk | 5.570,73 / 5.538,08 / 5.997,36 → 6.146,73 / 6.186,39 / 6.599,23 | +10,34 / +11,71 / +10,04 | — |
| 500/16 181 devam | 9.127,25 / 9.052,74 / 9.664,65 → 9.370,95 / 9.375,69 / 9.624,90 | +2,67 / +3,57 / −0,41 | +3,92 / +3,98 / +4,69 |
| 500/16 siyasi stres ilk | 5.182,18 / 4.922,00 / 5.925,65 → 6.373,83 / 6.501,56 / 6.769,31 | +23,00 / +32,09 / +14,24 | — |
| 500/16 siyasi stres devam | 4.897,08 / 4.840,56 / 5.150,73 → 4.701,97 / 4.699,14 / 5.031,21 | −3,98 / −2,92 / −2,32 | −17,95 / −16,83 / −19,63 |

100/9 kısa devam tekrarının farkı A/A oynaklığı içinde. Kesin performans hükmü için önceki 24 örnekli ölçüm de kullanıldı. O koşuda devamda +%0,40 ortalama, +%0,06 medyan ve +%2,59 p95 vardı. Her iki 500/16 geçiş artışı yeniden görüldü. 500/180’de kabul edilen önergeye harcanan 179,94 ms CPU’nun 178,58 ms’si kopyaydı. 100 sistemin bu seferki ilk ayında bir reform vardı ve tek işlem 46,40 ms CPU sürdü. Farklı kayıtlarda ilk ay için tek bir sabit yüzde beklenmemeli. 500/120’de iki kolun ay sonu RNG’si aynı kalırken 500/180’de reform ayından sonra ayrıştı. Aynı sürümün bütün tekrarları kendi Save8 ve RNG’sini aynı üretti.

Yeniden kurulan siyasi stres kaydında iki uyumsuz federasyon var. p55 ilk ay bir, p56 iki reform açtı. p56’daki iki reform kopyası 104,94 ve 94,89 ms CPU, p55’teki tek kopya 106,13 ms sürdü. İlk ayın toplam artışı kopyaların net farkından büyük. Oylama ve sonraki ay içi iş de değişti. Bu yapay yığılma, geçiş maliyeti için açık bir risk. Devam ayında başarılı reform yok, kısa A/A farkı büyük. Sonucu tek başına kesin oran olarak kullanmadım. [Siyasi stres girdisi ve profiller](evidence/p56-kabul0/perf/)

p57’nin ayrı ABBA yoklamasında iki örnek/kol kullanıldı. 500/120, 500/180 ve siyasi stres devam aylarında CPU p95 farkları sırasıyla **−%4,05, −%3,40, −%1,76**. Aynı girdilerin ilk aylarında p95 sırasıyla **+%9,42, +%9,85, +%24,96**. Dört kayıt p56 ve p57 arasında aynı Save8/RNG ve reform sonuçlarını üretti. Geçiş maliyeti devam performansından ayrı kalıyor. [p57 ABBA/A/A](evidence/p56-kabul0/p57/perf-abba.json)

100 sistem devam ayının tek ısınmalı tekrarlarında p57 p95 +%11,40 ve +%14,77 ölçüldü. Aynı koşulda A/A p95 −%16,87 ve +%8,74 değişti. Ham sıra, ilk ölçümlerin sonraki örneklerden yavaş olduğunu gösterdi. Bu iki p95’e kesin PASS verilmedi. Ardından boşta bir ortamda, aynı Save8 ile, her kolu **16 kez ısıtıp 24 kez** ölçerek dönüşümlü ABBA/BAAB ve A/A çalıştırdım. p55→p57 CPU ortalaması **312,50→313,85 ms (+%0,43)**, medyan **310,60→308,31 ms (−%0,74)**, p95 **343,48→355,86 ms (+%3,60)**. Duvar saati p95 −%0,23. A/A p95 −%19,32 ve ortalama −%2,27 olduğundan p95’in hassasiyeti sınırlı. Birlikte değerlendirilen ısınmış tekrar, önceki 24 örnekli referans ve 500 sistem karşılaştırmaları sürekli durumda doğrulanmış %5 üstü CPU gerilemesi göstermiyor. Eski kaydın ilk reform ayı ayrı bir maliyet olarak açık. [100 sistem ısınmış ABBA/A/A](evidence/p56-kabul0/p57/perf-100-isinmis.json)

[Önceki ABBA ve A/A](../claude/evidence/fed-ai-siyaset0/perf/) · [Yeni ölçüm düzeneği](../../research/p56-kabul0/perf.cjs)

## 5. 100 sistemde koloni ve 500 sistemde filo uçları

Ham p55, `candV`, `candW`, yalnız federasyon, yalnız ödül ve RNG plaseboları donmuş kaynaklar. Denetimde p56’nın `candW` davranışı, p55 ile aynı başlangıç ve aynı yarım günlük yürütücüyle karşılaştırılır. İlk fark Save8 ve RNG için ayrı aranır. Olay dizisi bir kararın ardından ne gerçekleştiğini gösterir. Tek tohumun sonraki bütün farkı tek karara yüklenemez.

Arşivdeki 15 kampanyanın birlikte sonucu, en büyük federasyon payında −0,074, bağımsız devlet sayısında +1,05, keşifte +0,064, kurucu devletler arası temasta +0,060. Aynı örneklemde koloni ortalaması −%3 ve filo gücü −%5,8. Bu turun tekrarları dört uç örneğe odaklandı. [Önceki 15 kampanya](../claude/FED-AI-SIYASET0-SONUC.md)

| Örnek | p55 | p56 öncesi son aday `candW` | Ayırıcı kanıt |
|---|---|---|---|
| 100/9 · 99 · 240 ay | 72 koloni, 212.339 güç, 843 gemi | 58, 187.142, 824 | 120. ay kolonisi 29→28. Fark 180 ve 240. ayda büyüyor. `candV` 71, yalnız ödül 68. Devlet 9’un 1.830. günde ayrılışı iki adayda da var. Finalde açık savaş yok, dolayısıyla erken ayrılış tek başına 14 kolonilik açığı açıklamıyor. |
| 100/9 · 404 · 240 ay | 66 koloni, 128.089 güç, 551 gemi | 48, 111.185, 576 | 120. ayda 38→37. 180’den sonra aday hemen hemen yerinde, son aylarda üç cephe açık. `candV` 63, yalnız ödül 62. Gemi adedi artarken güç düşüyor. |
| 500/16 · 23 · 120 ay | 83 koloni, 89.675 güç, 637 gemi | 99, 69.530, 509 | Yuva 9→0, yabani çatışma kaybı sayacı 279→469. Yalnız federasyon 66.995 güçle düşük, yalnız ödül 85.196. Birleşik sonuç yalnız keşif avına atfedilemez. |
| 500/16 · 404 · 120 ay | 73 koloni, 100.301 güç, 651 gemi | 73, 85.496, 591 | `candV` 87.035, yalnız federasyon 117.362, yalnız ödül 81.429. Keşif davranışı baskın aday açıklaması. Yabani kayıp 651→678, bunun yanında üretim, cephe ve gemi sınıfı değişebiliyor. |

100/9 normal 99’un `candV` sayısı **71**. Önceki raporda görülen 81, yayımlanan aynı konfigürasyonun ham `candV` dosyasında doğrulanmadı. Burada aynı konfigürasyonun ham değeri kullanıldı. 100/9 seed23’te ara adayın savunma savaşı izi ayrıca açıklayıcı. Yürürlükteki yasa tarafları bağladı. Bu iz 500/16 seed23 için nedensellik kanıtı sağlamıyor.

Son ortak Save8 iki motorda yeniden açıldı. İlk sonuç ayrışmasını yarım gün duyarlılığında tekrar ürettim. Aşağıdaki plasebo aralığı önceki koşulda aynı metrik için farklı günlerde ek bir RNG çekimi yapan kollardan geliyor.

| Dünya | İlk ayrışma | İlk gerçekten gözlenen karar | Son sonuç ve p55 plasebo aralığı |
|---|---|---|---|
| 100/9 · 99 | 15. ay, gün 450. RNG o adımda ayrıştı. | p56, AI 5’in 16 numaralı filosunu 95→71 üzerinden dört geçişlik, sensörde görülen ödül hedefine gönderdi. p55 aynı adımda bu emri vermedi. | 58 koloni, plasebo 67–77. İki p56 kuralı ayrı kollarda daha küçük düşüş üretiyor. |
| 100/9 · 404 | 19. ay, gün 570. RNG o adımda ayrıştı. | p56, AI 1’in 4 numaralı filosunu 33→68 üzerinden dört geçişlik ödül hedefine gönderdi. p55 aynı adımda farklı bir AI filosuna hareket emri verdi. | 48 koloni, plasebo 58–66. Geç genişleme duruyor, finalde üç cephe açık. |
| 500/16 · 23 | 14. ay, gün 420. İlk Save8 farkında RNG eşit. | p56, AI 15’in 1 numaralı federasyona katılım değerlendirmesinde doktrin engeli üretti. Değişen ilk alanlar siyasi dünya, devletler ve ekonomi geçmişiydi. | 69.530 güç, plasebo 78.697–82.349. Ayrı siyaset kolunda da düşüş, ödül kolunda küçük düşüş var. |
| 500/16 · 404 | 17. ay, gün 510. RNG o adımda ayrıştı. | p56, AI 1’in 4 numaralı filosunu 472→498 üzerinden dört geçişlik ödül hedefine gönderdi. AI 6’nın aynı günkü emri iki kolda da var. | 85.496 güç, plasebo 93.917–103.180. Yalnız ödül kolu daha da düşük, yalnız siyaset kolunun gücü artıyor. |

İlk nedenler ve plasebo dışı sonuçlar **doğrulandı**. Her sonraki savaşı ve her kayıp koloniyi ilk karara bağlayan kesintisiz nedensellik için **yeterli kanıt yok**. İki ödül kararı güçlü filoları yaşayan korumaya yöneltiyor. Maliyet, geçit açılması ve temas kazancıyla birlikte C2’de filo başına izlenmeye değer. İlk gözlemde değişen dört davranıştan hiçbiri yetkisiz, tekrarlanan veya kurala aykırı bir emir göstermedi. Daha saldırgan hedef filtresi ya da siyasi eşiği değiştirmek için ek kontrollü kanıt gerekli. [İlk kararlar ve dönemsel dökümler](evidence/p56-kabul0/kampanya/)

99. tohumu p55 ve p56 ile baştan 240 aya kadar tekrar oynattım. İki kol da önceki nihai büyüklükleri birebir üretti. AI 5’in yeni rotasının ardından 483,5. günde yabani kuvvet karşısında yedi gemi kaybettiği yeni bir çatışma raporu var. Buna rağmen AI 5 sonda 2 yerine 5 koloniye ve 10.601 yerine 15.903 güce ulaştı. Toplam koloni açığının büyük kısmı AI 1, 3 ve 6’dan geliyor (−5, −6 ve −6). p55’te görülen 2–5 savaşı p56’da oluşmadı. Dokuz normal AI hayatta kaldı. Toplam bilim aylığı 4.774→3.378, tamamlanmış teknoloji düzeyi toplamı 189→195, kargo teslimat sayacı 108→223. Aylık örneklerde her iki kolda da ekonomik kriz veya tüketim malı açığı bayrağı 0. Bu sayım bir ay içinde açılıp kapanan kısa krizleri ölçmez. Saatlik kayıp ve geç genişleme, tek bir “AI 5 filosunu yanlış gönderdi” açıklamasıyla kapatılamaz. Diğer üç dünyanın ilk ayrışması yeniden koşuldu. Bu dünyaların uzun uçları için önceki gerçek kontrol ve aday koşuları kullanıldı. [99. tohumun yeniden oynatımı](evidence/p56-kabul0/kampanya/kampanya-ozet.json)

- **100/9 · 404.** 60. ayda aday 21, p55 29 koloni ve adayda bir açık cephe vardı. 120. ay farkı bir koloniye indi (38→37). 180–240 arasında p55 55→66, aday 47→48 büyüdü. Bu geç pencerenin sonunda adayda üç cephe, kontrolde sıfır ve bir elenmiş AI vardı. Koloni ölçüsünün yanında cepheler ve hayatta kalan devletler de değişti.
- **500/16 · 23.** 60. ayda koloni sayısı 44→42 iken filo gücü 35.362→25.973, yabani muharebe kaybı 107→233. Adayda o ay açık devletler arası cephe 0. Bu erken düşüş için tek başına yeni bir insan veya AI savaşı yeterli açıklama sağlamıyor. Yalnız federasyon kolu aynı ay 40.971 güce ulaşıyor, sonra 120’de 66.995’e kalıyor. Uzun uçta hem birleşik seferlerin kayıpları hem siyasi karar dizisi önem taşıyor.
- **500/16 · 404.** 24. ayda koloniler iki kolda da 38 iken filo gücü 16.644→13.800, yabani kayıp 13→33. Yalnız federasyon kolunun ilk 60 aydaki değerleri p55 ile aynı. Sadece ödül kolu 120. ayda da güçte düşüyor. Bu örnek erken kaybı sensörle hedef seçimine bağlamak için en doğrudan aday. Son 120. ay farkının tamamını o ilk emir açıklamıyor. [Dönem, plasebo ve ayırıcı kollar](../claude/evidence/fed-ai-siyaset0/kampanya/)

[Önceki kontrol, aday ve plasebo dosyaları](../claude/evidence/fed-ai-siyaset0/kampanya/) · [Kampanya çözümleme](../../research/p56-kabul0/compare.py)

## 6. Federasyon güvenliği, Save8 ve multiplayer uyumu

`aiFedWilling` mevcut birliğe başvuru, AI davet kararı, kabul oyu sonrası AI’ın son kararı ve stratejik başvuru tarafından kullanılıyor. Kuruluş, bağımsız karar ve insan katılımı eski kapılardan geçiyor. Reform, `proposeFedMotion` üzerinden 150 Etki ve %75 anayasal çoğunlukla çalışıyor. Hedefli testler insan oyunu **gerçek `yes` ve `no` dizilerinden** denetliyor. Önceki testte bakılan `votes` alanı bu kararın kanıtı değildi.

Keşif testleri üç gerçek ön koşul kuruyor. Güçlü filonun sensördeki yeni hedefe emri, bütünüyle bilinmeyen yuva ve yalnız istihbarat belleğinde bulunan sensör dışı yuva. Son iki testte geçerli bir hedef örneği bulunamazsa test duruyor. AI’nın gizli hedefe emir yazmadığı doğrudan kontrol ediliyor.

Yeni Node vakaları bekleyen reformu, gerçek misafir ret komutunu, ret sonrası beklemeyi ve ayrılıştan sonra aynı tipe dönüş engelini Save8’den tekrar açtı. AI devam kaydındaki Etki, sabır, oy ve RNG eşit. Eski türle `aiRivalBlocChoice` başvuru üretemedi ve Etki kesmedi. İzinli bir komşu rota bulunan aynı fikstürde federasyon tipi değişince aynı AI normal başvuru kararını verdi. Başvuru için 60 Etki bir kez ödendi.

Gerçek p55 host paketinin p56’da tam doğrulanması ve yüklenmesi **PASS**. p41–p56 etiketleri, aynı geçerli Save8 ve yeniden hesaplanan paket bütünlüğüyle 16/16. Etiket testine ek olarak, arşivdeki p43 500/120 ve p44 500/180 Save8 girdileri aynı gün, galaksi, RNG ve v8 ile yüklendi. Her eski sürümden ayrı üretilmiş 16 doğal kampanya kaydı **NOT RUN**. Önceki eşdeğerlik testindeki bozuk örnek paket yalnız “build kapısında durmadı” sonucunu kanıtlıyor. [Paket ve arşiv deneyleri](evidence/p56-kabul0/package.json)

## 7. Ortak harekât, savaş desteği ve fiziksel ticaret

p55 ve p56 `jointOps`, federal filo, savunma, vasal katılımı, savaş desteği ve ticaret motorları kaynakta aynı. Ortak plan sayılarının değişmesi yeni askerî algoritma sonucu değildir. 6 plan, 4 tamamlanmış görev ve 2 ele geçirme önceki doğal kampanyada farklı siyasi koşullar altında oluştu. Bu turun regresyonları aynı mekanizmada plan, toplanma, savaş görevi ve kapanışı denetledi.

### Hedefli Node ve gerçek Chromium

Node v24.22.1, Chromium 155.0.8059.79, yerel üretim relay ve TLS vekili. Tarayıcılar ayrı kullanıcı profillerinde gerçek oyun yüzüne bağlandı. Bütün senaryoların hedef ve sürüm bilgisi ham JSON’da. [Node çıktıları](evidence/p56-kabul0/node/) · [Chromium çıktıları](evidence/p56-kabul0/mp/)

| Node paketi | PASS / FAIL | Kapsam |
|---|---:|---|
| Federasyon siyaseti | 15/0 + 4/0 + 4/0 | SP karar, MP insan oyu ve Save8, p55 eşdeğerliği |
| BETA-RIVAL-BLOCS | 13/0 | Kuruluş seçimi ve host yetkisi |
| BETA-FED-FOUND | 21/0 | Açık üyelik rızası, MP kuruluş ve kaynak |
| BETA-FED-FLEET | 18/0 | Federal fon, tersane, komutan değişimi ve paylaşım |
| Ortak harekât | 59/0 | Savunma, vasal katılımı, filo görevi, yeniden oluşturma, kapanış |
| Savaş destek AI | 26/0 | Gerçek savaş desteği ve misafir adına onay engeli |
| Ticaret p54 | 30/0 | Fiziksel ticaret, transit ve süre değişikliği, host kısıtları |
| Save8 yükleme sınırı/işlemi | 81/0 | Doğrulama, yükleme hatası, yazma kümesi rollback |
| PWA ve istihbarat | 8/0 | Sürüm kimliği, gizli istihbarat ve yetki |

| Chromium | PASS / FAIL | Sonuç |
|---|---:|---|
| FA | 5/0 | AI reformu ve ayrılığı, iki ayrı insan ret oyu, dört özel AI alanı aynaya gitmiyor |
| F | 6/0 × 4 | p55 ve p56 ikişer kez, bildirim ve yeniden katılım |
| L | 6/0 | Federal sipariş tek ödeme, eski başkanın emir yetkisi duruyor |
| M | 5/0 | Acil savunma oyu, çift dokunma, üçüncü misafirin gizli kalması |
| SD | 3/0 | Toplu askerî destek, AI’ın gerçek insan çağrısı, ret sonrası bedel yok |
| SG | 5/0 | İnsanlar arası savaş desteğinde tek ödeme, muharebe sonucu ve sistem oyu |
| J | 5/0 | Save8 → yeni oda, özel kayıtlar, kesik yanıtta aynı `cid`, bir sipariş ve bir ödeme |
| Q | 8/0 | Koalisyon, karşı teklif, ayrı barış, toprak vaadi ve federasyon oyu |
| I | 4/0 + 4/0 | 100/9 ve 500/16 uzun oturum, sensör, Save8 ve harita eşitliği |
| R | 5/0 | IndexedDB, relay ve tarayıcı süreçlerini kapatma, yeni oda, bekleyen teklifin tek kabulü |

P55 eşdeğerliği 48 aylık üç senaryo ile p55 60. ay kaydının açılmasını sınadı. Seed 11 ve 22’de 48 ayın tamamı bayt bayt aynı. Seed 404 ilk farkını görünür ödül emrinin geldiği 19. aya kadar üretmedi. Başlangıç kayıt/RNG eşitliği siyasi tetik sonrası zorunlu bir dünya eşitliği olarak yorumlanmadı.

### Tam Node koşusu

| Koşu | Paket | PASS | FAIL |
|---|---:|---:|---:|
| Arşiv p55 | 253 | 6.632 | 279 |
| Arşiv p56 | 256 | 6.649 | 279 |
| Bu tur p56 | 256 | 6.589 | 284 |
| Bu tur p57 | 256 | 6.612 | 280 |

p56 tam koşusunda yedi paket 180 saniyelik çalıştırıcı sınırında `SIGKILL` aldı. `faz95d_identity_test` bu ortamda 23/0 ile üç tarihsel başarısızlığı yeniden üretmedi. `faz86c_3_ai_negotiation_test` tek işlem için 20 ms duvar saati eşiğini aştı. Aynı ek başarısızlık ayrı karşılaştırmada p55’te 37,91 ms, p56’da 100,05 ms ile yeniden görüldü. Bu iki tekil süre bir performans karşılaştırması kurmaz. `mp11_online_test` ise bu çalışmada doğrulanan **ürün kusurunu** yakaladı. İki yeni federasyon testi ayrı ayrı birer başarılı vaka ekledi. Kontrol ağacı gerektiren eşdeğerlik paketleri tam çalıştırıcının kendi 0/0 satırından ayrı raporlandı. [p56 ham Node](evidence/p56-kabul0/node/p56-tam-kosu.log.gz) · [Paket farkları](evidence/p56-kabul0/node/p56-node-fark.json)

p57 tam koşusundaki üç `SIGKILL` paketinin aynı kaynakla ve aynı senaryolarla, doğrudan `node` komutuyla tekrarları **25/0 (AI denge), 11/0 (günlük kampanya), 5/0 (kampanya gözlemcisi)** sonucunu verdi. Test içi sınırlar ve beklentiler değişmedi. p55 ve p57’nin sakin ortamda yeniden çalıştırılan 20 ms işlem kontrolü **6,13 / 5,92 ms**, iki paketin tamamı **86/4**. Böylece bu dört temiz tekrar ham taramadaki kendi satırlarının yerine yalnız teşhis özeti olarak konursa p57 toplamı **256 paket, 6.654 PASS, 276 tarihsel FAIL**. Ham sayım yukarıda korunuyor. p56’da kesilen hızlı kurulum dış denetimi p57’de yine tarihsel 11/1. p57’de deniz kampanyası 8/0, aktör görüşü 2/0, Konsey Save8/RNG 1/0, her biri ham taramada da geçti. Yeni deterministik Node başarısızlığı gözlenmedi. [p57 ham tarama](evidence/p56-kabul0/p57/node-tam-ozet.json) · [Paket farkı](evidence/p56-kabul0/p57/node-fark.json) · [Doğrudan tekrarlar](evidence/p56-kabul0/p57/)

## 8. Relay kapanış kusuru ve dar p57 adayı

Tam Node taramasında `mp11_online_test.js`, odalara `server-restart` iletildikten sonraki ayrı CLI kapanışında p56 için bir `null !== 0` verdi. İlgili git farkında p55 → p56 relay değişikliği yalnız sürüm etiketiydi. Sorun her iki kaynakla da gerçek yerel süreçte yeniden üretildi. Relay “hazır” satırını basıyor, ardından `SIGTERM`/`SIGINT` işleyicilerini kuruyordu. Süreç o aralıkta zaman dilimini kaybederse hazır satırına tepki veren dış süreçten gelen `SIGTERM` varsayılan sonlanmayı tetikliyordu.

| Deney | p55 temiz kapanış | p56 temiz kapanış | p57 temiz kapanış |
|---|---:|---:|---:|
| Gerçek stdout geldiği anda `SIGTERM` | 2/4 | 3/4 | 4/4 |
| Hazır satırından sonra kontrollü zaman dilimi kesilmesi | 0/2 | 0/2 | 2/2 |

Kontrollü sarmalayıcı yalnız hazır mesajından sonraki zaman dilimini uzatıyor ve o anda `process.listenerCount('SIGTERM')` değerini kaydediyor. İki eski sürümde sayı 0, adayda 1. Adayda hazır satırı, mevcut kapanış işleyicilerinden sonra geliyor. Kapanışın oda nedeni, soket kapatma yolu ve çıkış kodu aynı. Yeni deterministik Node koşulu işleyicinin **mesaj anındaki** varlığını da denetliyor. p56’da 8/1, p57’de 9/0. Eski kontrolü gevşetmedim. Sonuç, p56’ya özgü bir federasyon veya Save8 gerilemesi değil, önceden var olan bir CLI başlangıç yarışı. [Gerçek süreç ve kontrollü saat kayıtları](evidence/p56-kabul0/p57/relay-ready.json) · [Kapanış testi](../../tests/mp11_online_test.js)

Adayın oynanabilir kaynak commit’i `78668a4dff9373c1b81d0fd3073b64bb9e55a663`. Yeni kimlikler `96h10p57 / MP.8.9b56` ve `stars-v96h10p57`. Save8 8, MP4 ve protokol 1 korunuyor. Paket uyum aralığı p56’ya kadar genişletildi. `ai.js`, `diplomacy.js`, `economy.js`, `commerce.js` ve `jointOps` kaynakları p56 ile aynı. Tek oyunculu ZIP çalışma zamanı değişikliği build ve servis çalışanı kimliklerini içeriyor. Gerçek MP relay kodu GitHub dalından kullanılıyor. Dört performans kaydında p56 ve p57 yüklemede ve bir ay ilerletildikten sonra aynı Save8 baytlarını ve RNG’yi üretti. p55 ve p56’nın gerçek MP4 paketleri adayda doğrulandı ve açıldı. [p56 → p57 Save8/RNG](evidence/p56-kabul0/p57/save8-rng-esitlik.json) · [p56 MP4 paketi](evidence/p56-kabul0/p57/paket-p56.json)

p57 Chromium **PASS**. FA 5/0, F 6/0, doğal olaylarla J 5/0. 100/9 ve 500/16’da altışar dakikalık I oturumları 4/0 ve 4/0. Her ikisinde 236 örnek, 12 olay, 0 kapalı pencere donması. Her iki misafirin emirleri, yeniden katılımı, görsel ayna karşılaştırması ve Save8 sonrası iki yönlü gizlilik denetimi geçti. [FA](evidence/p56-kabul0/p57/FA.json) · [F](evidence/p56-kabul0/p57/F.json) · [J](evidence/p56-kabul0/p57/J.json) · [I100](evidence/p56-kabul0/p57/I100.json) · [I500](evidence/p56-kabul0/p57/I500.json)

## 9. Paket kararı ve kalan alanlar

**Paket PASS.** Sabit kaynak ağacından iki bağımsız paketleme aynı 973.310 baytı üretti. 20 ZIP girdisinin CRC kontrolü geçti. 19 çalışma zamanı dosyası hem manifest SHA-256’larıyla hem p57 kaynak ağacıyla bayt düzeyinde eşleşti.

| Doğrulama | Değer |
|---|---|
| ZIP SHA‑256 | `b259c00c90987d9e33e45909882cf9868003ee583eaf901100f0215df62d0022` |
| ZIP CRC32 | `A282D3C3` |
| Manifest SHA‑256 | `5552e6bbb4c33a56a7f844c5b0e728130add512f692a8aaaa1405b4e433936b4` |
| Oynanabilir kaynak commit’i | `78668a4dff9373c1b81d0fd3073b64bb9e55a663` |

Codex kabul dalı p56 üzerine açılmış taslak PR #82’de. p55 geri dönüş referansı ve p56 özgün paketi kendi dallarında erişilebilir. [p57 ZIP](../../releases/stars-faz96h10p57.zip) · [Yayın kaydı ve dosya hash’leri](../../RELEASE-CODEX-P56-KABUL0.json) · [Taslak PR #82](https://github.com/sarsiss12-dot/Star/pull/82)

- İlk reform ayında eski büyük kayıtlar ek CPU gerektiriyor. Siyasi stres girdisindeki yığılma saha cihazına göre hissedilebilir. Geri alma güvenliği korunuyor. Bu turdaki ölçüm süreç CPU’su ve yerel Chromium eşitlemesiyle sınırlı.
- F5’in eski zaman aşımı ham kaydında ayna revizyonları bulunmadığı için o koşunun kesin nedeni açık. Yeni p55, p56 ve p57 koşuları bildirim kaybı göstermedi.
- Uç kampanyaların ilk ayrışmaları doğrulandı. Koloni ve filo farklarının bütün sonraki olaylara tek tek atfedilmesi açık. C2’nin başlangıç ölçümü, bir keşif veya ödül rotasının açtığı gerçek temas ile filo kaybını aynı filo üzerinden eşleştirmeli. C3 ortak sefer, C4 galaksi dengesi ayrı fazlar. [Codex devir notu](CODEX-P56-KABUL0-DEVIR.md)

Fiziksel Android, ayrı cihaz gerçek internet/LAN ve canlı Render **NOT RUN**. Otomatik Chromium testi fiziksel cihaz kabulü olarak kullanılmadı. [Codex devir notu](CODEX-P56-KABUL0-DEVIR.md)
