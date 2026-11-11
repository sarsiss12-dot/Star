# STARS — BETA-UI-REFINEMENT.0 / p23 sonuç raporu

11 Kasım 2026. Durum: **kodlandı, yerel testleri geçti, gerçek kullanıcı kabulü bekliyor**. Hiçbir pano maddesi TAMAMLANDI yapılmadı.

## 1. Kanonik kaynak ve teslim

- Başlangıç/uzak p22 HEAD: `80d11dacc1bb2fcf139022cd5f8a1a65a2c75a9f`.
- Kaynak dalı: `codex/stars-beta-stability-ai0-save-fleet-recovery`. Son uzak karşılaştırma: [remote-before.txt](evidence/beta-ui-refinement0/remote-before.txt).
- Çalışma dalı: `codex/stars-beta-ui-refinement0-mobile`; eski main kaynak alınmadı.
- Bitiş kod, test, kanıt ve paket commit'i: [`183c3ca635c6a65ae0d4320284c2e6ab026efb96`](https://github.com/sarsiss12-dot/Star/commit/183c3ca635c6a65ae0d4320284c2e6ab026efb96).
- Nihai rapor commit'i bu commit'ten sonra gelir; kendi SHA'sını rapora eklemek için yeni commit zinciri üretilmez. Son yanıtta bildirilir.
- Oyun `96h10p23`, PWA `stars-v96h10p23`, MP host/istemci `MP.8.9b18`. Save8 **v8**, MP paket **4**, protokol **1** korunur. Eski p22 MP kayıt paketinin kabulü sürüm kapısına eklendi.

Kapsam dokuz ana UI işidir. Yeni AI, ekonomi, savaş veya diplomasi motoru geliştirilmedi. p22 filo kurtarmasının motoruna dokunulmadı. #23 ve #17 mevcut davranışlarının regresyonudur; yeni özellik sayılmaz.

## 2. Kullanıcı görselleri ve p22 yeniden üretimi

Mesajda görünen **beş inline görsel** incelendi: koloni tablosu/undefined, iki filo çubuğu ve sistem paneli görünümü, Derin Maden Kazası, fiziksel telefondaki pregame taşması. Kullanıcının sözünü ettiği dokuz görselin tamamının ayrı dosyaları ortamda bulunmadı; dokuz dosya incelenmiş gibi sunulmaz. Görseller kullanıcının Android/Render bildirimidir; bu ortamın fiziksel cihaz testi değildir.

Karşılaştırma sunucusu p22'nin 19 runtime dosyasını doğrudan `git show 80d11da:<dosya>` ile geçici dizine alır; çalışma dalı değiştirilmez. Aynı deterministik UI fikstürüyle 3/32 koloni, uzun Türkçe adlar, habitat, enerji/tüketim krizi, inşa kuyruğu ve uzun filo adı üretilir. Bunlar test fikstürüdür; özel oyuncu kaydı değiştirilmez.

p22 hedefli testinde üç kusur doğrudan FAIL verdi: aynı zincir açıklaması, yanlış kuyruk anahtarı ve kendi kolonisine büyük fetih açıklaması. Salt-okunur UI kontrolü geçti: [first-fail.log](evidence/beta-ui-refinement0/first-fail.log). Gerçek p22 tablo PNG'si: [önce](evidence/beta-ui-refinement0/p22-table-proof/p22-table-800.png). Pregame ve diğer karşılaştırma görselleri `before-corrected/` altındadır. İlk browser fikstüründe yeni oyun açılmadan gizli kurulum düğmesine erişilmeye çalışıldı; ayrıca ilk sürümde fizyoloji adımı yanlış adlandırılmıştı. Bunlar ürün kusuru sayılmadı, kayıtları silinmedi; son test gerçek `fizyo` bölümünün dolu olduğunu ve gerçek seçenek fontlarını doğrular.

## 3. Event seçenekleri — #27

Kök neden `UI.choiceExplanation(c)` içindeki `c.next && !c.f` erken dönüşüydü. Gerçek seçim metni kullanılmadan her dal aynı genel ifadeye dönüşüyordu.

Ortak açıklama yolu korunarak gecikmeli seçimlere ayrı niyet ve sonraki aşama bilgisi eklendi. Derin Maden Kazası artık üç farklı açıklama verir:

- Kurtarmaya her şeyi yığ: kurtarma çalışmaları öncelik kazanır.
- Üretimi sürdür, kurtarmayı sınırla: üretim öncelikli tutulur; sendikalarla sonraki karar beklenir.
- Bağımsız soruşturma: kazanın sorumluları araştırılır; sonraki aşamada rapora karar verilir.

Üçünde de **bu aşamada kaynak/ödül uygulanmadığı**, sonucu ilgili sonraki aşamadaki seçimin belirlediği açıkça yazılır. Diğer gecikmeli seçimler mevcut `d/t` verisini kullanır. Anlık seçimlerde mevcut etki metni ve belirsizlik işareti sürer.

Veri incelemesinde iki terminal açıklaması da gerçek callback ile uyuşmuyordu. `grev2a` son seçiminde −200 maden, +40 etki ve +8 istikrar; `grev2b` tavizinde −120 enerji ve +150 maden metne işlendi. Var olmayan istikrar iyileşmesi vaadi kaldırıldı. **Hiçbir callback, RNG veya zincir geçişi değiştirilmedi.**

Tam event modalı, zincir, anomali ve küçük seçenek kartı aynı mevcut açıklama fonksiyonunu kullanır. Host yetkili çözüm yolu korunur. Derin Maden Kazası browser'da üç ayrı açıklamayla; Muhalefet Yükseliyor, anomali, belirsiz anomali, rastgele olay ve anlık/gecikmeli terminaller hedefli açıklama kontrolleriyle doğrulandı. Misafir olay/anomali/zincir çözümü ayrıca mevcut P0 Chromium senaryosunda gerçek host sonucu ile geçti. Her olay için ayrı fiziksel dokunma senaryosu çalıştırıldığı iddia edilmez.

## 4. Sağ gezegen paneli — #7/#9/#35/#46

Kök neden bütün kolonilerde `ColonyUI.planet` ile aynı geniş açıklama bloğunun en üste eklenmesiydi.

Kendi kolonisinde bu blok kaldırıldı. Mevcut tek istikrar/moral değeri ve renkli bar korunur. Bar altındaki kısa not gerçek `colonyStabilityTarget` ve mevcut isyan faktörlerini kullanır; azalma veya düşük istikrar varsa en fazla üç bilinen faktörü gösterir. Gizli fail kimliği eklenmez. Tam sayaç, politika ve müdahaleler küçük **İç istikrar · Ayrıntılar / önlemler** düğmesinden mevcut ekrana açılır.

Boş gezegenin ilgili kartında yalnız ilk geçerli kolonileştirme engeli yazılır. Motorun genel uygunluğu tek başına yerinde koloni gemisi bulunduğu anlamına gelmediğinden, engel listesi boş olmadan “Kolonileştirilebilir” denmez. Parçalanmış gezegenin gerçek engeli native browser senaryosunda görüldü.

Bilinen düşman kolonilerinde kısa kuşatma/engel özeti ve kapalı ayrıntı korunur; sahte ETA üretilmez. Yeni fetih, istikrar veya ekonomi hesabı yazılmadı. Mevcut koloni motor testleri gerçek kalkan/ordu/kolonileştirme kapılarıyla karşılaştırmayı sürdürür.

## 5. Gezegen çalışma alanı — #19

**Doğru menü:** `grpEmp → outEmp → Gezegenler / Habitatlar`. Devlet'ten hemen sonra, Bilim ile aynı seviyede bağımsız seçenek eklendi. `outMap` içinde yoktur. Devlet panelinin eski büyük tablo giriş düğmesi kaldırıldı. Tek `ColonyUI` uygulaması kullanılır.

Liste solda, mevcut sistem/gezegen/inşa paneli sağda kalır. `⌖ Göster` mevcut kamera merkezleme ve sistem pulse yolunu kullanır, sol listeyi küçültür. Ayrı **🌍 Gezegenler / Habitatlar · adet** çipi listeyi geri açar. Seçili koloni, sıralama, ekonomi ayrıntısı ve liste kaydırma konumu oturum içinde korunur. Olay küçültme anahtarları kullanılmaz; çip UI durumudur, yeni Save8 alanı değildir.

Taşmanın kökü tablodaki `min-width:650px` ve dar panelde sabit kolonlardı. Yeni scoped kurallar bunu geçersiz kılar: geniş alanda fixed-layout tablo, 560px altındaki çalışma alanında yoğun iki sütunlu satır düzeni. İsim ve yerel net kendi satırına geçer; ekonomi değerleri kırılabilir. Zorunlu yatay tablo kaydırması kaldırıldı. 3 ve 32 koloni aynı browser senaryosunda test edildi.

`undefined · 1` gerçek veri hatası `col.q[0].k` okumasıydı; motor `key` saklıyor. Gösterim `key ?? k` okur, bilinmeyen boş anahtarda “İnşa sürüyor” kullanır. Kaydı veya inşa durumunu değiştirmez. Yerel katkı, bina girdisi/bakımı ve devlet ortak giderleri p17 hesap yolunda kalır.

## 6. Filo çubuğu — #20

Önceki çubuk harita genişliğine göre merkezleniyor, saat podunun yatay alanını kullanmıyordu. Yeni hesap `timepod` sağ kenarı, sidebar sol kenarı/genişliği, ekran ölçüsü ve UI zoom'u ile yapılır. Panel geçiş animasyonunda geçici rect taşmasını önlemek için son sidebar genişliği de sınırlandırılır.

Yeterli alanda saat ile sağ panel arasına yerleşir. Alan 230px altındaysa saatin üstünde kontrollü ikinci sıra kullanır. Uzun ad kısalır; ROTA öncelikli, DUR ve SİSTEM görünür/dokunulabilir kalır. Dünya/Canvas koordinatları ve filo emirleri değişmez.

Açık/kapalı sağ panel, 0/1/2/4 hız, sivil/askerî filo, uzun ad, rota aç/kapa, durdurma ve sisteme geçiş test edildi. Rect kontrolleri ekran/saat/sidebar sınırlarını doğrular. Son 800×360 koşusu bütün üç düğmeye her iki panel durumunda native dokundu.

## 7. Casusluk ve pregame

Casuslukta mevcut AĞLAR/OPERASYONLAR/DOSYALAR nav'ı flex-wrap ve okunabilir tam metin kullanır. Dar görünümde hedef listesi üstte sınırlı kaydırma alanına geçer; operasyon içeriği `min-width:0` ile sığar. Hedef seçiminin mevcut ortak durumu korunur. Maliyet, başarı, ifşa, ACK, soruşturma ve mirror gizlilik kodu değiştirilmedi. Sekmeler native tıklama/touch ve panel scrollWidth ölçümüyle; gerçek operasyon/yanlış hedef/host sonucu ER0 MP senaryosuyla doğrulandı.

Pregame'de ortak grid ve btnrow'un sabit/minimum genişlikleri taşma üretiyordu. `#setup` kapsamlı auto-fit grid, sarmalanan seçimler ve esneyen eksi/değer/artı alanı eklendi. Tür kartı başlığı mono, açıklaması sans olarak aynı scoped kurala bağlandı; bütün oyunun fontu değiştirilmedi. Gerçek fizyoloji seçeneklerinin computed font-family'leri eşit çıktı. Etik/köken/galaksi bölümleri beş viewport'ta açıldı; aktif seçeneklerin yatay rect'leri ekran içinde kontrol edildi. AI artı düğmesine native dokunuldu.

16 AI doğrulanmış sınırı ve deneysel 24/32/48, 1000 sistem semantiği korunur. Kurulumun adım şeridi kendi yerel kaydırmasını korur; ana kabuk ve galaksi seçeneklerinde yatay kaydırma gerekmemesi hedeflenir.

## 8. Test sonuçları ve ilk FAIL'ler

Kanıt kökü: [evidence/beta-ui-refinement0](evidence/beta-ui-refinement0/). Dosya SHA listesi [EVIDENCE-MANIFEST.json](evidence/beta-ui-refinement0/EVIDENCE-MANIFEST.json). Native etkileşimlerde Playwright `tap/click` kullanıldı; force-click, JS click, timeout artırma veya assertion kaldırma uygulanmadı. Dünya kurmak/bölümü seçmek için kontrollü fikstür kullanımı native komut kabulü yerine geçirilmedi.

| Test | Gerçek sonuç | Kanıt / sınır |
|---|---|---|
| p22 hedefli ön test | 1 PASS / 3 FAIL | `first-fail.log`; üç ürün kusuru |
| UI hedefli son | 4 PASS / 0 FAIL | `targeted-final.log` |
| SP geniş Chromium | 29 PASS / 0 FAIL | `sp-release.log`, rect ve native etkileşim |
| Son kaynak dar ekran ek kabulü | 6 PASS / 0 FAIL | `native-final.log`; T4 ve açık/kapalı sidebar native emirleri dahil |
| Üç oturum MP | 5 PASS / 0 FAIL | `mp-release.log`; lobi, Konsey, P0, UI23, ER0 |
| Olay callback/Save8/RNG/açıklama | 9 PASS | `preservation-final-source.log` |
| 12 ilgili regresyon script'i ilk koşu | 11 başarılı / 1 başarısız script | `regression/results.json`; filo testi 9/1 |
| Filo regresyonu son kaynak tekrar | 10 PASS / 0 FAIL | `fleet-final.log` |
| p22 gerçek özel Save8 kabulü yeniden | PASS | `real-save.log`; özgün kayıt değişmedi |
| Mevcut filo sahibi etiketi #17 | 30 PASS / 0 FAIL | `fleet-labels.log`; yeni map kodu yok |
| Release 19 dosya/ZIP/CRC/tekrar | PASS | `release-final.json`, iki paket dosyası |
| Fiziksel Android/PC kullanıcı kabulü, LAN/internet/Render | NOT RUN | Yerel Chromium bunların yerine geçmez |
| p23 tam soğuk yeni oda uçtan uca | NOT RUN | Save8 yükleme/motor replay testleri ayrı kanıttır |

İlk geniş UI adayında 20/3 çıktı; sidebar animasyon rect sınırı somut ürün kusuru olarak düzeltildi. Sonrasında geniş koşu 29/0 oldu. İlk MP UI23 denemesinde 4/1 vardı: host pause komutunun rate-limit reddi fikstür tarafından dikkate alınmıyor, simülasyon ilerliyordu. Düzeltme gerçek pause ACK/`rules:same` ve `G.speed===0` beklemektir; kaynak/RNG eşitlik assertion'ı korunmuştur.

Regresyon ilk koşusunda filo birleştirme testi yeni yerleşim kodundaki çıplak `innerWidth` adını VM'de bulamadı. Yeni ifadeler mevcut `window.innerWidth/innerHeight` biçimine getirildi; motor beklentileri değişmeden filo testi 10/0 ve browser son kaynak 6/0 geçti. Geniş 29/0 ve MP5/0 bu son, tarayıcıda eşdeğer isim nitelemesinden önceydi; son kaynakta dar native test ve 9 maddelik koruma tekrarlandı. İlk FAIL dosyaları korunmuştur.

## 9. Viewport, ölçek ve T1–T14 kapsamı

Pregame: 360×800, 390×844, 412×915, 800×360, 915×412. Oyun: 800×360, 844×390, 915×412, 960×540, 1280×720, 1920×1080. Filo geometri döngüsü 80/100/125 talep edilen ölçeklerde çalışır; mobilde mevcut ürün kuralı etkin ölçeği 100'e sabitler. Masaüstünde gerçek 80/100/125 kullanılır. Her ekranın her ölçek kombinasyonu test edilmiş değildir; koloniler/casusluk/event kabulünün geniş matrisi etkin varsayılan ölçek üzerindedir.

- T1 distinct event, T2 kompakt koloni, T3 gerçek enerji/tüketim nedenleri, T4 ilgili boş gezegen engeli: PASS.
- T5 outEmp içinde/outMap dışında, T6 göster/küçült/geri, T7 3/32 koloni: PASS.
- T8/T9 filo açık/kapalı panel ve native kontroller, T10 casusluk sekmeleri, T11 pregame sınırları, T12 fizyoloji fontları: PASS, yukarıdaki viewport/ölçek sınırlarıyla.
- T13 tersane 0/1/21 kuyrukta korvet düğmesi Y konumu farkı <3px; native siparişle 22 oldu: PASS. Önceki sabit kontrol kazanımıdır.
- T14 değiştirilmiş yüzeylerde host/misafir seçim ve ACK/gizlilik yolları: yerel MP PASS. Bütün eski aralıklı etkileşim vakalarının kesin çözümü anlamına gelmez; açık kalır.

## 10. Save8, gizlilik ve önceki sistemler

p22 ile bütün `EVENTS/ANOMALIES/CHAINS` callback ve sonraki aşama bağlantıları birebir karşılaştırıldı. Seed23'te bütün sistemler açık üç aylık ham Save8 ve RNG eşitliği geçti. UI okuma/gezinti testleri kaynak, filo ve RNG değiştirmedi.

Üç ayrı Chromium H/B/C ve en az5 AI ile B'nin 32 kolonisi doğru ikinci akordeondan açıldı, seçim/göster/küçült/geri native çalıştı. C özel kolonileri görmedi. Aynı gezintide host'un tam filo verisi, kaynakları ve RNG'si eşit kaldı. Mevcut P0 gerçek misafir rota/HP/olay/anomali/zincir; ER0 casusluk, hedef güvenliği ve müdahale kabulü geçti. Hız, Konsey yetkisi ve sürüm işaretleri aynı koşuda denetlendi.

p22'nin gerçek özel kayıt testi p23'te tekrar çalıştırıldı: 253 filo/759 gemi, oyuncu34 filo/44 gemi; 27 yetim kruvazör ve 117 ücretli iş korunarak kurtarma, tekrar komutu ve reload geçti. Kurtarma sonunda 759/44 gemi korundu, AI yetimleri sıfırlandı; mevcut test terminal filo kayıtlarını canlı filolardan ayrı sayar. Özgün SHA değişmedi. Bu mevcut kurtarma kabulünün regresyonudur; p23 yeni filo özelliği değildir. İlk20K filonun tarihsel kaybolma nedeni **BELİRLENEMEDİ** olarak kalır. Özel özgün/onarılmış .sav GitHub'a eklenmedi.

Ek regresyonlar: koloni ekonomi/kolonileştirme/fetih, gizlilik ve uzaktan inşa; isyan/casusluk motor ve MP; P0 kararlar; MP75; PERF1/PERF2. p19/p18 federasyon ve Savaş Merkezi'nin bütün eski browser senaryoları bu fazda yeniden çalıştırılmadı. Yeni büyük siyasi davranış eklenmedi.

## 11. Performans ve değişen dosyalar

32 koloni VM ölçümünde panel kapalı100 refresh için **0 tablo HTML üretimi**; açık100 hazırlamada toplam698,09ms, ortalama6,98ms. Save8/RNG salt-okunur kaldı. Bu ölçüm Android FPS veya önce/sonra cihaz performans oranı değildir. PERF1/PERF2 eşdeğerlik regresyonları geçti. Yeni her-kare dünya taraması, simülasyon günlüğü veya tam mirror alanı eklenmedi.

Runtime değişiklikleri: `ui.js` ortak açıklama, giriş, gezegen yerleşimi ve filo geometri; `economy-ui.js` koloni gösterim/küçültme/engeller; `index.html` scoped responsive stil; `main.js` iki açıklama ve build; `sw.js` cache. `ai.js`, `economy.js`, `combat.js`, `map.js`, diplomasi ve p22 kurtarma motoru değişmedi.

MP: `research/mp0/mp-core.js` eski paket build kabulü; `research/mp1/client/view.js` ve `research/mp1/server/relay.js` eşleşen sürüm. Yeni gameplay komutu/protokol yok. Testler `beta_ui_refinement0_test`, `beta_ui23_preservation`, `browser-beta-ui23`, ilgili fixture/MP/pinned kontrol yardımcıları, `browser-mp73` opt-in ve koruma uyarlamasıyla eklendi. Tam dosya listesi kod commit'indedir; PNG/JSON/log kanıtları ayrı dizindedir.

## 12. Paket, manifest ve GitHub

[Oyun ZIP'i](../../releases/stars-faz96h10p23.zip): **836.950 bayt**.

- SHA-256: `af6eb03aade38327e48ee290029377e638b40167ff87742a57be82cec5bd7d1d`
- CRC32: `13718624`
- İçerik: 19 runtime + `RELEASE-MANIFEST.json`, 20 girdi.
- Aynı son kaynaktan iki deterministik üretim birebir eşit; CRC, tüm runtime hashleri ve manifest doğrulandı. [Son paket özeti ve MP hashleri](evidence/beta-ui-refinement0/release-final.json).
- Ara paket ölçümleri tarihsel olarak saklanır; nihai paket için yalnız `release-final.json` esas alınır.
- MP relay/istemci kodu oyun ZIP'inin parçası değildir; aynı geliştirme commit/dalındadır.

Kod/paket commit'i geliştirme dalına push edildi ve uzak SHA karşılaştırıldı. [Dal](https://github.com/sarsiss12-dot/Star/tree/codex/stars-beta-ui-refinement0-mobile), [p22 tabanına karşı compare](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-stability-ai0-save-fleet-recovery...codex/stars-beta-ui-refinement0-mobile).

Issue33 tek okuma denemesi `Post https://api.github.com/graphql: Forbidden` döndürdü. Pano okunmuş/güncellenmiş sayılmaz; envanter aşağıdadır. Yeni PR oluşturulmadı; compare bağlantısı review için kullanılabilir. Main merge, force-push, Render deploy/restart veya kullanıcı kaydını değiştirme yapılmadı.

## 13. Görev tablosu

| Görev | p22 hatası | Kök neden | Düzeltilen dosya | Gerçek test | PASS/FAIL/NOT RUN | Kullanıcı kabulü |
|---|---|---|---|---|---|---|
| #27 event | Üç dal aynı açıklama | next/no-f erken dönüşü; iki eski metin uyuşmazlığı | ui.js, main.js | T1,9 koruma,misafir P0 | PASS yerel | Bekliyor |
| #7/#9/#35/#46 sağ panel | Kendi kolonisine büyük fetih bloğu | Ortak üst açıklama yerleşimi | ui.js,economy-ui.js | T2–T4,koloni motoru | PASS yerel | Bekliyor |
| #19 menü | Devlet içindeki giriş | İstenen outEmp girişi yoktu | ui.js | T5,MP B native | PASS yerel | Bekliyor |
| #19 haritada göster | Büyük düğme/liste kapanmıyor | Küçültme durumu yoktu | economy-ui.js,index.html | T6,native chip | PASS yerel | Bekliyor |
| #19 liste | Yatay taşma/undefined | min650px ve k/key farkı | economy-ui.js,index.html | T7,3/32 koloni | PASS yerel | Bekliyor |
| #20 filo | Saat/sidebar alanı uyuşmuyor | Tüm haritaya merkezleme | ui.js,index.html | T8/T9,ölçek/hız/sivil | PASS yerel | Bekliyor |
| #33 casusluk | Sekme/hedef sıkışması | Dar grid/tab minimumları | index.html | T10,ER0 MP | PASS yerel | Bekliyor; kapsamlı motor yeniden yazılmadı |
| Pregame galaksi | AI/sistem kontrolleri taşıyor | Sabit grid/btnrow genişlikleri | index.html | T11,5 viewport | PASS yerel | Bekliyor |
| Tür/fizyoloji | Tipografi tutarsız | Kart başlık/gövde stilleri | index.html | T12,computed font | PASS yerel | Bekliyor |
| #23 tersane | Önceden düzeltilmiş | Yeni ürün değişikliği yok | Test | T13,0/1/21 ve sipariş22 | PASS regresyon | Bekliyor |
| #17 sahip etiketi | Mevcut davranış zaten uygun | Yeni ürün değişikliği yok | Test | Canvas30/0 | PASS regresyon | Bekliyor |
| p22 kurtarma | Önceden gerçek kayıt kabulü var | Yeni ürün değişikliği yok | Koruma testleri | Gerçek kayıt/replay/reload | PASS regresyon | Tarihsel kabul ayrımı korunur |
| selfleet/dealSend/fedFoundStart | Aralıklı özgün hata açık | Genel kök neden kesinleşmedi | Yeni genel event sistemi yok | Yeni yollar geçti; özgün vaka kapanmadı | AÇIK / kesin kabul NOT RUN | Bekliyor |
| Fiziksel Android/Render | Kullanıcı bildirdi | Bu ortam yerel Chromium | Yok | Fiziksel kabul yok | NOT RUN | Bekliyor |

## 14. Gerçek cihazda bakılacaklar ve kalan işler

Telefonda yeni build/cache/MP işaretini doğrulayın. İkinci akordeondan kolonileri açın; sağ panelle seçim, `⌖ Göster`, çipten geri ve uzun liste kaydırmasını deneyin. Kendi kolonisi üstündeki büyük fetih bloğunun kalktığını, düşük istikrar sebebini, boş gezegenin gerçek engelini kontrol edin. Filo ROTA/DUR/SİSTEM'i panel açık/kapalı ve tarayıcı adres çubuğu değişirken deneyin. Casusluk hedef/sekme/operasyon onayını ve Derin Maden Kazası'nın farklı açıklamalarını kontrol edin. Kurulumun dikey galaksi seçenekleri sağa taşmamalıdır.

Fiziksel tarayıcı safe-area/adres çubuğu davranışı yerel viewport emülasyonundan farklı olabilir. Tam ekranların 80/125 ölçek kombinasyonları, p23 soğuk yeniden oda, bütün eski siyasi browser matrisi ve uzun fiziksel oturum bu teslimde NOT RUN sınırlarıdır. Özgün aralıklı etkileşim hataları açık; bu testlerin geçmesi onları kesin kapatmaz. #24/#25 tarihsel ilk kayıp nedeni/#26 ve kapsam dışı #51/#30/#36/#44 için yeni çözüm iddiası yoktur. Sonraki adım kullanıcı Android kabulü ve varsa somut yeni taşma/etkileşim kaydına hedefli düzeltmedir.
