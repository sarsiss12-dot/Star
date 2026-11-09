# STARS — BETA-BOARD.2 sonuç raporu

## 1. Kanonik kaynak, sürüm ve teslim sınırı

Başlangıç: `codex/stars-beta-board1-federation-stability-ux`, **`9173b6726cfe84cb035e80cd1acfbafcc947e328`**. Beklenen uzak HEAD doğrulandı; p16 kod/paket commit’i48dcc2b ve rapor commit’i9173b67 korunur. Eski main kaynak alınmadı; main başlangıçta `4296ad2d43fedce6264020b3761f50f1839fd836`. Kanıt: `evidence/beta-board2/source-heads.txt`.

Çalışma dalı: `codex/stars-beta-board2-colony-politics-ux`. PR tabanı p16 dalıdır. **Bitiş kod/test/paket HEAD’i: `f14955e689182f375184cba001aa82334fc0f126`**, push ve uzak SHA doğrulandı. GitHub ayrıntısı §12’dedir. Rapor kendi SHA’sını içine yazarak commit zinciri oluşturmaz; doğrulanmış kod commit’ini kullanır, son rapor HEAD’i nihai teslimde verilir.

Yeni sürüm: **96h10p17 / stars-v96h10p17 / MP.8.9b12**. Save8v8, MP paket4 ve protokol1. Oyun ZIP’i ile MP host/istemci kaynakları ayrı teslim parçalarıdır. p16/MPb11’e ait kazanımlar yeniden geliştirme sayılmadı. Main merge/rebase/force-push, Render/deploy/restart ve kullanıcı kaydı silme/dönüştürüp üzerine yazma yapılmadı.

## 2. Çalışma kapsamı ve gerçek görev tablosu

Paket A önceliklendirildi: koloni çalışma alanı, salt-okunur yerel ekonomi, kolonileştirme/fetih/isyan açıklaması, isyan göstergesi ve host yetkili uzaktan inşa. Paket B’de mevcut casusluk ekranına hedef kısayolu, kanıtlanmış gizli aktör sızıntısı düzeltmesi ve eski MP75 test kusuru ele alındı. Yeni büyük Konsey/federasyon mekaniği eklenmedi.

Görev numaraları Issue #33 içindeki pano ID’leridir. API panoyu okutmadığından aşağıdakiler **yerel durum önerisidir; GitHub’da uygulanmış durum değildir. Kullanıcı kabulü yoktur, hiçbir satır TAMAMLANDI değildir.**

| Görev ID | Eski durum | Bu fazda yapılan | Test | Yeni önerilen durum |
|---|---|---|---|---|
| #19 | Devlet panelinde koloni listesi; kalıcı sol çalışma alanı yok | Sol32+satır tablo, sıralama, habitat, sağ mevcut panel, haritada gör, üretim/girdi/bakım/çarpan ayrıntısı | SP dört görünüm,1/10/32; MP kendi liste; salt-okunur motor | **KISMEN / KULLANICI TESTİ**: yerel net gösterilir; devlet ortak giderlerinin koloniye paylaştırılmış tam neti eklenmedi |
| #7 | Çatışma özeti var; engeller birlikte açıklanmıyor | Savaş, yerinde askerî güç/ordu, kalkan, garnizon, gözlenen yörünge çatışması, kuşatma ve bilinmeyen ETA açıklaması | SP motor, gerçek invasionTick ve arayüz; MP ortak p_sistem kodu | TEST BEKLİYOR: misafirde ayrı düşman-hedef UI matrisi NOT RUN; kesin ETA yok |
| #46 | canColonize boolean; neden görünmüyor | Boş dünya ve düşman koloni için iki ayrı salt-okunur açıklama; gemi konumu/motor uygunluğu ayrılır | SP kaynak/RNG/Save8 değişmez; pozitif/engelli kapı karşılaştırması | TEST BEKLİYOR: misafirde ayrı uygun/engelli hedef UI matrisi NOT RUN; mevcut hak/fetih kuralları korunur |
| #9/#35 | Mevcut secession sayacı; tekrar eşik uyarısı mümkün | Bilinen risk/koruma nedenleri, önlemler, kendi sisteminde küçük uyarı; aynı bölümde15eşiği tekrarı ve yükleme bildirimi tekilleştirildi | Önce FAIL; sonra aynı dönem/yükleme1uyarı, yeni dönem yeniden uyarı; gizli fail kimliği yok | KULLANICI ONAYI BEKLİYOR |
| #14 | SP RemoteConstruction mevcut; misafir komut/ayna bağlantısı eksik | Host quote/order/cancel; ACK sonrası UI; yalnız kendi görev/history; varışta tek ödeme; tamamlanma haberi | Gerçek misafir emri/yolculuk/maliyet/tamamlama/tekrar/yeniden bağlantı, soğuk kayıt | KULLANICI ONAYI BEKLİYOR; gerçek LAN/cihaz yok |
| #33 Casusluk | Ağlar/operasyon/dosya, risk ve onay motoru mevcut | Operasyonlar içinde yatay hızlı hedef şeridi; seçim korunur. Mirror’daki gizli koloni kışkırtıcı alanları çıkarıldı | SP dört görünüm/MP native hedef; MP64 risk/ödeme/gizlilik | **KISMEN**: bütün paneli yeniden tasarlama veya yeni kategori motoru yapılmadı |
| #30 | Bölge armaları yok | Uygulanmadı; mevcut amblem/keşif katmanlarına müdahale edilmedi | NOT RUN | PLANLANDI |
| #36 | Mevcut randomEmblem/normalize/mutate | Yeni kombinasyon veya RNG dağılımı eklenmedi | Yeni çeşitlilik NOT RUN | PLANLANDI |
| #26 | Konsey savaş yasağı spamı açık | councilSweep ve savaş yasağı bildirimi incelendi; özgün spam yeniden üretilmedi | Mevcut Konsey regresyonu ayrı; özgün vaka NOT REPRODUCED | AÇIK; kör tekilleştirme yok |
| MP75 eski FAIL | p16 dahil3/1 | Yanlış test yaşam döngüsü düzeltildi; eski bilinmeyen / yeni ilan edilmiş temas / kamu özel devlet ayrı assertion | Önce3/1, sonra5/0; assertion kaldırılmadı | Test kök nedeni KANITLI; kullanıcı oynanış onayı ayrı |
| #51 | Mevcut aday agenda/campaign ve EVET/HAYIR | Yeni adaylık→tercih seçimi→EVET/HAYIR reformu **uygulanmadı** | NOT RUN | Ayrı bütünlüklü alt paket; yarım mekanik yayımlanmadı |
| #32 | p16 gönder/kabul ve MP3 motor yolu mevcut | Yeni mekanik yok; MP3/74 ret/karşı/geri çekme/yetki regresyonu | Tüm yeni rol değiştirmeli ittifak UI matrisi NOT RUN | KISMEN / TEST BEKLİYOR |
| #44 | Önceki statik analiz | Yeni davranış ölçüm kampanyası yapılmadı, AI değiştirilmedi | Yeni kabul oranı NOT RUN | AÇIK / ölçüm bekliyor |
| #39 | Üç mevcut federasyon türü | Dördüncü tür eklenmedi; uygulanabilirlik sınırı aşağıda | NOT RUN | Ayrı denge/kabul fazı |
| #24/#25 | Özgün enerji/100K filo vakaları bilinmiyor | Yeniden uzun araştırma yok; p16 kontrollü filo/enerji regresyonu korundu | İlgili motor PASS; özgün kullanıcı kaydı yok | AÇIK; çözülmüş sayılmadı |

## 3. Ortak koloni ve ekonomi veri yolu

`economy-ui.js` içindeki `ColonyInfo`, mevcut **colonyOutput(e,sys,planet,report)** fonksiyonunun gerçek izleme adımlarını kullanır. Yeni paralel üretim formülü yoktur. Bina üretimi mevcut callback’in farkıdır; bina girdisi mevcut B.u×adet×colonyStaffing, enerji bakımı mevcut B.up×adet×1.6 kuralıdır. Son koloni üretimi yine motorun döndürdüğü o’dur. Nüfus, kaynak yatağı, jeotermal/asansör, şok, odak/vali, anavatan, istikrar ve sıkıyönetim adımları ayrıntıda ayrı görülür.

**Önemli sınır:** tabloda “Yerel aylık net” = colonyOutput üretimi − bina girdileri − bina enerji bakımı. Devlet genel çarpanları, nüfus beslenmesi/tüketimi, donanma, yönetim, ticaret ve federasyon ortak bütçesi bu değere gizlice paylaştırılmaz. Devletin son toplam neti mevcut bilançodadır. Bina başındaki üretim, sonraki çarpanlardan önceki gerçek katkı olarak etiketlidir; çarpan adımları ayrı gösterilir. Tek seferlik yapım bedeli aylık masraf diye yazılmaz.

Bu yüzden #19’un “her koloniye tüm devlet giderleri dahil tek kesin son net” beklentisi tamamlandı sayılmadı. Mevcut motorda bazı maliyetler devlet havuzunda hesaplanır; bunları keyfî nüfus payıyla bölüp gerçek ekonomi diye sunmak reddedildi. Bir sonraki ledger genişletmesi açık maliyet tahsis sözleşmesi gerektirir.

`ColonyInfo.read` mevcut basınç/güç hesaplarının dört türetilmiş önbellek alanını çağrı çevresinde saklayıp geri koyar. İlk testte açıklama açmanın _powAt/_powC/_pressAt/_press alanlarını değiştirdiği bulundu; bunlar Save8’e girdiği için “sadece cache” denerek yok sayılmadı. Kontroller ham Save8/RNG eşitliğini korur. Host’un remoteQuote yolu mevcut genel `pure` korumasını kullanır; soğuk cache testi önce1/1, sonra2/0.

## 4. Sol tablo ve sağ mevcut panel

Devlet ekranındaki GEZEGENLER / HABİTATLAR düğmesi mevcut diploPane içinde sol çalışma alanını açar. Kendi kolonileri/habitatları birer satırdır. Ad, nüfus, istikrar, inşa ve yedi kaynakla sıralama; otomasyonun kapalı/bekleyen/sıradaki binası; risk sayacı; ekonomik ayrıntı; Haritada Gör sağlanır. Seçimde mevcut sağ **p_sistem** yönetim paneli ve aynı inşa düğmeleri kullanılır. Aynı sistemde diğer koloni ayrıntıları küçültülür; seçili gezegen açılır. Kamera merkezleme harita zoom’unu değiştirmez.

Sol liste açıkken scroll/seçim ortak surfaceRender yoluyla korunur. Mobilde bütün sütunlar aynı anda sığdırılmaya zorlanmaz: tablo yatay ve düşey kaydırılabilir. Ayrı PC/mobil motoru veya Canvas transform’u eklenmedi. PC%80/%100/%125 ve mobil%100 sınırları korunur.

Gerçek800×360 testinde CSS değişkeniyle hesaplanan alan sağ panelle36px çakıştı. Çözüm gerçek sidebar bounding rect’ini aynı UI ölçeği koordinatına çevirmektir. Birleşik MP testinde başka bir gerçek hata yakalandı: federasyona geçiş sonrası koloni otomatik yenileyicisi eski görünümü geri açıyordu. Hem ortak surfaceRender/Replace düzen temizliği hem `_surfaceKey==='colony-workspace'` otomatik yenileme koruması uygulandı. Önceki5/1 koşu saklanır; final düzeltme sonrası tekrar ayrı kayıttadır. Federasyon/Konsey yönlendirmesi yeniden yazılmadı.

## 5. Kuşatma ve kolonileştirme açıklamaları

Boş gezegende canColonize’ın gerçek koşulları, yaşanabilirlik%35 eşiği, parçalanmış dünya/sahiplik/sistem hakkı ve kendi koloni gemisinin varlığı/konumu ayrıdır. Motor uygunluğu “gemin hedefte hazır” anlamına gelmez. Ayrı kaynak bedeli olmayan yerleşim ile önceden üretilmiş koloni gemisinin tüketimi birbirine karıştırılmaz.

Düşman kolonisinde canlı/taranmış bilgi kapısı uygulanır. Kendi duran askerî/taarruz filoları, savaş bayrağı, kalkanın5eşiği, garnizon, görünen düşman gücü, mevcut kuşatma sayacı gösterilir. Motorun ayrı manuel istila emri istemediği; uygun kara gücünü aylık yüzey savaşında kendisinin kullandığı açıklanır. Yalnız bombardımanda kalkan/garnizon sıfır kalırsa6ay koşulu anlatılır. Kesin ETA **bilinmiyor**; tahmin uydurulmaz.

Misafire sadece canlı görünür, savaşta olduğu ve kendi birimi bulunan gezegende ek sayısal siege alanı verilir. Yabancı koloni nesnesi bütünüyle kopyalanmaz; ekonomi yalnız kendi kolonisinde döner. Görünmeyen/taranmamış hedefte bilgi açıklaması yoktur. Normal savaş, canColonize, bombardıman ve fetih kuralları değiştirilmedi.

## 6. İsyan ve gizlilik kök nedenleri

Risk açıklaması mevcut SECESSION_SIZE=6, STAB=40, LIMIT=30; anavatan/küçük devlet/fetih/sıkıyönetim koşullarına dayanır. İstikrarı etkileyen bilinen kıtlık/kriz/bombardıman/yerel huzursuzluk açıklanır; gizli fail adı uydurulmaz. Haritadaki küçük ! yalnız kendi kolonisinde devam eden ayrılık sayacını gösterir; kesin isyan ilanı değildir.

Eski `col.secede===15` bildirimi, sayaç15→13→15 olduğunda aynı bölümü tekrar duyuruyordu. Önce FAIL üretildi. İsteğe bağlı `col.secessionNotice` sahibiyle tekilleştirme eklendi; kayıt yüklemesi aynı aşamayı tekrarlamaz. Sayaç0’a indiğinde kayıt temizlenir; yeni bölüm yeniden bildirilebilir. İnsan misafire de özel koloni haberi gider. Mekanik sayaç artışı/azalışı ve ayrılma koşulu değiştirilmedi. Yeni sayısal sahip alanı π ile dönüştürülür. Eski kayıtta yoksa güvenli varsayılanı yoktur/ilk uygun uyarıdır; bütün eski koloniler yeniden biçimlendirilmez.

Ek gerçek gizlilik kusuru: kendi kolonisi mirror’a kopyalanırken `inciteBy` ve `unrest.by` gizli kışkırtıcı kimliğini taşıyordu. Eski davranış **privacy-before0/1**, ardından iki alan aynadan çıkarıldı; etkili huzursuzluğun hit/left verisi kaldı. `privacy-after1/0`, host Save8/RNG aynı ve own ID dönüşümü doğrulandı. Meşru yakalanmış operasyon bilgisi mevcut izinli casusluk kayıtlarından okunmaya devam eder. Simülasyon verisi host’ta silinmedi.

## 7. MP uzaktan inşa ve casusluk

RemoteConstruction, startStruct, dailyTick ve structTick yeniden kullanılır. Eski arayüz var olmasına rağmen misafir ACT/host COMMANDS/mirror görev yolu yoktu. Üç küçük host komutu eklendi: remoteQuote (salt-okunur, kendi filo), remoteBuild, remoteCancel. Başka oyuncunun filosu aynı not-owner kapısında reddedilir. Önizleme yalnız maliyet/atlama/uygunluk nedenidir; istemciden rota veya ödenecek maliyet kabul edilmez. Host varışta koşul ve bedeli tekrar hesaplar.

Misafir onay düğmesi ACK bekler; host kabul etmeden modal başarıyla kapanmaz. Yanlış/süresi geçmiş önizlemenin başka modalı doldurmaması için istek sırası ve modal token’ı kullanılır. Geciken ACK’nin kullanıcının arada açtığı başka modalı kapatmaması da aynı token ile korunur; önce0/1, sonra1/0 hedefli gerçek callback testi vardır. Görevler ve128kayıtlık mevcut geçmiş yalnız kendi oyuncusuna aktarılır. İnşa ilk başladığında mevcut motor maliyeti tek kez keser; önceden sıraya girme ücret değildir. Tamamlanma ilgili insanın haber geçmişine yazılır. Var olan iptal/iade kuralları değişmez.

Üç insanlı native testte B uzak hedef seçti, gerçek emri verdi, gemi yol aldı,241maden/48alaşım kesildi, yapı tamamlandı; kopya öneri reddedildi, C özel görevi görmedi. Yeniden bağlantıda geçmiş korundu. R senaryosu bütün tarayıcıları/relay’i kapatıp yeni odada bekleyen görevi tamamlar.

Casuslukta mevcut spySel, spyTargetCheck, opQuote, opsCatalog, opAsk/onay ve host spyOp yolları korunur. Yalnız Operasyonlar ekranına yatay hızlı hedef şeridi eklendi. Hedefi değiştirmek için uzun Ağlar listesinden yeniden dolaşma gereği azalır; seçim Ağlar/Operasyonlar geçişinde kalır. Maliyet/ifşa/başarı kuralları değişmedi. Yeni genel operasyon/kategori motoru yapılmadığı için tam #33 UX reformu iddia edilmez.

## 8. Eski MP75 FAIL ve Konsey spamı

Eski MP75 testi contact[2]=false yaptıktan sonra `warLedgerSync('test')` çağırıyordu. p13’ten beri bu yol gerçek yeni savaş bildirimi sayılır ve insan taraflara açık temas verir. Sonraki “bilinmeyen düşman” assertion’ı bu yüzden yanlış zamandaydı. İsim gösterilen devlet bu fikstürde normal devletti; özel devlet varsayımı kök neden değildi.

Eski/başlangıcı bilinmeyen savaş testi artık `warLedgerSync('legacy')` yolunu kullanır ve **aynı bilinmeyen etiket/kimlik gösterilmeme assertion’ları korunur**. Yeni ilan temas kurar ve kamuya açık özel devlet kimliği ayrı ek assertion’lardır. Önce3/1, sonra5/0; ürün gizlilik kapıları gevşetilmedi.

#26: councilSweep aynı oylama token’ına göre oturum içi tek kayıt tutar. “KONSEY YASAĞI” uyarısının declareWar yolundaki gerçek bilinçli ihlal uyarısı olduğu da incelendi. Kullanıcının aynı yasa/aynı dönem aylık spamı yeniden üretilmedi. Oturum değişince hâlâ bekleyen gerçek oyu göstermekle yeni karar spamı birbirine karıştırılmadı; kanıtsız genel bastırma eklenmedi. **AÇIK**.

## 9. Gerçek testler, başarısızlıklar ve koruma

| Gerçek Node komutu | Sonuç | Kanıt |
|---|---|---|
| `node tests/beta_board2_colony_test.cjs` | **PASS 5/0** | [colony-release.log](evidence/beta-board2/colony-release.log) |
| `node tests/beta_board2_rebellion_test.cjs` | **PASS 1/0** | [rebellion-accepted.log](evidence/beta-board2/rebellion-accepted.log) |
| `node tests/beta_board2_remote_test.cjs` | **PASS 2/0** | [remote-accepted.log](evidence/beta-board2/remote-accepted.log) |
| `node tests/mp75_war_test.js` | **PASS 5/0** | [reg-mp75_war_test.js.log](evidence/beta-board2/reg-mp75_war_test.js.log) |
| `node tests/beta_board1_agenda_test.cjs` | **PASS 13/0** | [reg-beta_board1_agenda_test.cjs.log](evidence/beta-board2/reg-beta_board1_agenda_test.cjs.log) |
| `node tests/beta_board1_critical_test.cjs` | **PASS 5/0** | [reg-beta_board1_critical_test.cjs.log](evidence/beta-board2/reg-beta_board1_critical_test.cjs.log) |
| `node tests/beta_board1_cancel_test.cjs` | **PASS 2/0** | [reg-beta_board1_cancel_test.cjs.log](evidence/beta-board2/reg-beta_board1_cancel_test.cjs.log) |
| `node tests/mp64_spy_test.js` | **PASS 7/0** | [reg-mp64_spy_test.js.log](evidence/beta-board2/reg-mp64_spy_test.js.log) |
| `node tests/mp_p0_guest_test.cjs` | **PASS 7/0** | [reg-mp_p0_guest_test.cjs.log](evidence/beta-board2/reg-mp_p0_guest_test.cjs.log) |
| `node tests/mp_p0_decisions_test.cjs` | **PASS 7/0** | [reg-mp_p0_decisions_test.cjs.log](evidence/beta-board2/reg-mp_p0_decisions_test.cjs.log) |
| `node tests/mp_p0_motion_test.cjs` | **PASS 3/0** | [reg-mp_p0_motion_test.cjs.log](evidence/beta-board2/reg-mp_p0_motion_test.cjs.log) |
| `node tests/mp_p0_notice_test.cjs` | **PASS 3/0** | [reg-mp_p0_notice_test.cjs.log](evidence/beta-board2/reg-mp_p0_notice_test.cjs.log) |
| `node tests/perf1_equivalence_test.js` | **PASS 4/0** | [reg-perf1_equivalence_test.js.log](evidence/beta-board2/reg-perf1_equivalence_test.js.log) |
| `node tests/perf2_equivalence_test.js` | **PASS 5/0** | [perf2-release.log](evidence/beta-board2/perf2-release.log) |
| `node tests/mp86_nebula_cache_test.js` | **PASS 3/0** | [reg-mp86_nebula_cache_test.js.log](evidence/beta-board2/reg-mp86_nebula_cache_test.js.log) |
| `node tests/beta_fed_found0_core_test.js` | **PASS 10/0** | [reg-beta_fed_found0_core_test.js.log](evidence/beta-board2/reg-beta_fed_found0_core_test.js.log) |
| `node tests/beta_fed_found0_mp_test.js` | **PASS 11/0** | [reg-beta_fed_found0_mp_test.js.log](evidence/beta-board2/reg-beta_fed_found0_mp_test.js.log) |
| `node tests/mp73_council_test.js` | **PASS 14/0** | [reg-mp73_council_test.js.log](evidence/beta-board2/reg-mp73_council_test.js.log) |
| `node tests/beta_war_fix0_test.cjs` | **PASS 17/0** | [reg-beta_war_fix0_test.cjs.log](evidence/beta-board2/reg-beta_war_fix0_test.cjs.log) |
| `node tests/beta_scale0_colony_test.cjs` | **PASS 12/0** | [reg-beta_scale0_colony_test.cjs.log](evidence/beta-board2/reg-beta_scale0_colony_test.cjs.log) |
| `node tests/faz95e_construction_test.js` | **PASS 21/0** | [reg-faz95e_construction_test.js.log](evidence/beta-board2/reg-faz95e_construction_test.js.log) |
| `node tests/mp3_core_test.js` | **PASS 11/0** | [reg-mp3_core_test.js.log](evidence/beta-board2/reg-mp3_core_test.js.log) |
| `node tests/mp4_core_test.js` | **PASS 14/0** | [reg-mp4_core_test.js.log](evidence/beta-board2/reg-mp4_core_test.js.log) |
| `node tests/beta_board2_equivalence.cjs` | **PASS 6/0** | [equivalence-final.log](evidence/beta-board2/equivalence-final.log) |
| `node tests/beta_board2_privacy_test.cjs` | **PASS 1/0** | [privacy-final.log](evidence/beta-board2/privacy-final.log) |
| `node tests/beta_board2_ack_test.cjs` | **PASS 1/0** | [ack-after.log](evidence/beta-board2/ack-after.log) |
| `node tests/mp6_mirror_test.js` | **PASS 8/0** | [mirror-release.log](evidence/beta-board2/mirror-release.log) |

Node tablosunda ilk23paketin exit/süreleri `node-regressions.json`, son genişletilmiş koloni5/0 ve soğuk quote2/0 ayrı dosyadadır. Yeni kuşatma motoru testi fiilen invasionTick çalıştırır. Gerçek kaynak p16 kontrolü git show ile alınır; beş seed×üçay15ham Save8/RNG örneği `equivalence-final/compat.json` içindedir.

| Gerçek Chromium senaryosu / komutu | Sonuç | Kanıt |
|---|---|---|
| `BOARD2=1 MP73_ONLY='A1 \|B1 \|BD2 \|sayfa' node tests/browser-mp73.cjs` | **PASS 4/0** | [mp-second.log](evidence/beta-board2/mp-second.log) |
| `BOARD1=1 BOARD2=1 MPP0=1 MP73_ONLY='A1 \|B1 \|P0 \|BD1 \|BD2 \|sayfa' node tests/browser-mp73.cjs` | **FAIL 5/1** | [mp-final.log](evidence/beta-board2/mp-final.log) |
| `BOARD1=1 BOARD2=1 MPP0=1 MP73_ONLY='A1 \|B1 \|P0 \|BD1 \|BD2 \|sayfa' node tests/browser-mp73.cjs` | **PASS 6/0** | [mp-accepted.log](evidence/beta-board2/mp-accepted.log) |
| `BOARD2=1 MPP0_DESKTOP=1 MP73_ONLY='A1 \|B1 \|BD2 \|sayfa' node tests/browser-mp73.cjs` | **PASS 4/0** | [mp-desktop-release.log](evidence/beta-board2/mp-desktop-release.log) |
| `node tests/browser-beta-board2-colonies.cjs` | **PASS 20/0** | [ui-release.log](evidence/beta-board2/ui-release.log) |
| `BOARD2_R=1 BOARD1_R=1 MPP0_R=1 MP89_R_STATE=1 MP8_SCEN=R MP8_MONTHS=6 node tests/browser-mp8.cjs` | **FAIL 4/1** | [mp8-R.log](evidence/beta-board2/mp8-R.log) |
| `Aynı R0–R4 kabulü, ödeme sınırı düzeltme sonrası` | **PASS 5/0** | [mp8-R-final.log](evidence/beta-board2/mp8-R-final.log) |
| `node tests/browser-mp74.cjs` | **PASS 7/0** | [mp74.log](evidence/beta-board2/mp74.log) |
| `node tests/browser-mp75.cjs` | **PASS 6/0** | [mp75.log](evidence/beta-board2/mp75.log) |
| `MP8_SCEN=N node tests/browser-mp8.cjs` | **PASS 9/0** | [mp8-N.log](evidence/beta-board2/mp8-N.log) |
| `node tests/browser-beta-p01-panels.cjs` | **PASS 3/0** | [old-panels.log](evidence/beta-board2/old-panels.log) |

Tekrar üretilecek kesin komutlar (tabloda `|` karakterleri Markdown için kaçırılmıştır):

```sh
BOARD1=1 BOARD2=1 MPP0=1 MP73_ONLY='A1 |B1 |P0 |BD1 |BD2 |sayfa' STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=reports/codex/evidence/beta-board2/mp-accepted node tests/browser-mp73.cjs
BOARD2=1 MPP0_DESKTOP=1 MP73_ONLY='A1 |B1 |BD2 |sayfa' STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=reports/codex/evidence/beta-board2/mp-desktop-release node tests/browser-mp73.cjs
BOARD2_R=1 BOARD1_R=1 MPP0_R=1 MP89_R_STATE=1 MP8_SCEN=R MP8_MONTHS=6 STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=reports/codex/evidence/beta-board2/mp8-R-final node tests/browser-mp8.cjs
```

Diğer browser komutlarında aynı `STARS_CHROMIUM_PATH=/usr/bin/chromium` ve karşılık gelen `STARS_OUTPUT=reports/codex/evidence/beta-board2/<koşu-adı>` kullanıldı. Bütün Chromium koşuları sırayla yürüdü. SP1/10/32 koloni ve birden çok habitat;1920×1080 fare,800×360/915×412/960×540 dokunmatik. UI Scale%80/%100/%125, native scroll sonrası konum ve başka panele geçiş sahipliği kontrol edildi. Scroll kontrolünde tarayıcı wheel girdisi mobil emülasyonda da kullanıldı; fiziksel parmak performansı iddia edilmez.

R0–R4:3insan+5AI, seed11/45sistem,6ay→gerçek IndexedDB→bütün tarayıcılar/relay kapanır→yeni oda/aynı devletler→bekleyen teklif bir kez→federasyon kuyruğu ve kişisel olay→inşa görevi devamı→6ay daha. `mp8-R-final/R/board2-cold-construction.json` gerçek görev kayıtları eşitliği; `board2-cold-result.json` tek ödeme; `board1-cold-queue.json` ve sonuç dosyası p16kuyruğu; `resume-records.json` siyasi durum; `cold-personal-decisions.json` kişisel karar. N9/0 kopma/sessiz soket/teklif tekrarını kapsar.

[32koloni mobil](evidence/beta-board2/ui-release/915-32-colonies.png), [32koloni PC](evidence/beta-board2/ui-release/1920-32-colonies.png), [misafir kolonileri](evidence/beta-board2/mp-accepted/board2-guest-colonies.png), [gerçek tamamlanan uzak inşa](evidence/beta-board2/mp-accepted/board2-remote-done.png), [casusluk hedefi](evidence/beta-board2/ui-release/800-spy.png).

Fiziksel Android/PC kullanıcı kabulü/LAN/internet/Render,120ay yeni kampanya, C/D yeni mekanik kabulü, #7/#46 için misafirde ayrı düşman/uygun/engelli hedef UI matrisi ve C32’nin tüm rol değiştirmeli ittifak UI varyantları **NOT RUN**. Önceki başarılı ağır kampanyalar yeniden başlatılmadı.


İlk FAIL’ler tutuldu: colony-before işlev yok; colony-after önbellek yan etkisi ve test tırnak hatası; UI-first etkileşim korumasının bitmesini beklemeyen assertion; UI-second eski modalın zamanı geri açması; UI-third bağımsız ikinci fikstürde yanlış template; UI-final gerçek mobil taşma; mp-first kapalı details hedefi; mp-final gerçek eski panelin federasyonu ele geçirmesi. Timeout artırımı/force/JS click/assertion kaldırma yoktur.

İlk R4 `234 !== 241`: kayıt sonrasında önce bekleyen insan teklifi7maden getirdiği için eski kayıt stoğu ile inşa sonrası stok farkı karşılaştırılamıyordu. Test gerçek ödeme anının **önce/sonra** stoklarını ve o andaki structCost’u karşılaştıracak şekilde düzeltildi. Eski FAIL saklanır; serializer veya ödeme motoru değiştirilmedi. Son R0–R4 sonucu ayrı dosyadadır.

`equivalence-sandbox.log` git alt süreci EPERM başlangıç engelidir; izinli yerel yürütmede aynı kontrol6/0. Ortam hatası PASS’a çevrilmedi, ayrı sınıflandırıldı. Eski p16 MP75 Node FAIL’i ile bu fazın yeni başarısızlıkları ayrıdır.

## 10. Save8/RNG, SP/MP ve performans

Beş seed11/23/42/99/404: aynı gerçek p16 Save8’den üçer ay, toplam15 noktada ham Save8/RNG birebir. Alan silme/normalize ederek hash eşitleme yapılmadı. Gerçek p16 MP paketi kabul edilir, bozuk bütünlük reddedilir. Riskli yeni uyarı bölümünde ek sunum metaverisi ve haber beklenen farktır; bütün olası kayıt baytları p16 ile aynı kalır denmez. Ekonomi formülü, AI stratejisi ve RNG tüketim kuralı değiştirilmedi.

Eski kayıtlar yüklenir; mevcut kolonilerin otomasyon tercihi, kimliği, rengi, adı ve federasyon üyeliği dönüştürülmez. Yeni oda kaydında kuyruk/aktif oy, kişisel event ve uzaktan inşa birlikte sınanır. Host tek yetkilidir. Misafir simülasyon veya yerel ödeme yürütmez; başka devletin görev/ekonomi/gizli aktör verisi taşınmaz.

Seed11, gün0,32kolonili kontrollü dünya, Chromium155/1920×1080, normal CPU. Mevcut colonyOutput aynı kullanılır; kapalı satırlar için bina ayrıntı izini oluşturmama ve sistem sayısını render başına bir kez toplama uygulanır. Aynı sayfada30dönüşümlü kontrol/aday örneği:

| Ölçüm | Tam ayrıntı izli kontrol | Liste yolu |
|---|---|---|
| HTML/quote medyan | 5.6 ms | 5.3 ms |
| p95 | 7.9 ms | 7.3 ms |
| Örnek |30|30|

Aynı HTML, ham Save8 ve RNG: **eşit**. `node tests/browser-beta-board2-perf.cjs`, `ui-perf-final.json`. Fark küçük ve ölçüm gürültüsüne açıktır; **oyun performansı/FPS iyileşme yüzdesi iddia edilmez**. İlk sıralı ölçüm ve geliştirme aşaması ölçümleri ayrı tutulur. p16’da eşdeğer yoğun tablo bulunmadığı için bu tablo p16’ya göre oyun akıcılığı karşılaştırması değildir. Bu yalnız string/veri hazırlama maliyetidir; DOM layout, Canvas/raster veya fiziksel cihaz FPS değildir. MP8R host/guest zamanları ham loglarda, fakat değişen ortam yükü ve küçük n nedeniyle bunlardan da sürüm kazancı çıkarılmadı. PERF.1/PERF.2/nebula ve gerçek katılımcı rota/ara hareket regresyonları ayrı PASS’tir.


## 11. Değişen dosyalar ve regresyon riskleri

Yeni sunum `economy-ui.js`; ortak giriş/gezegen açıklaması/panel sahipliği `ui.js`, yerleşim `index.html`; uyarı tekilleştirme `economy.js`; kendi risk işareti `map.js`; insan inşa haberi `construction.js`; ACK/önizleme `archive-ui.js`; host komutları `research/mp0/mp-core.js`; misafir ACT `research/mp6/client/guest-stars.js`; kendi görev/siege/gizli actor filtresi `research/mp6/mirror.js`. Sürüm: main.js/sw.js/view.js/relay.js/manifest. Yeni testler ve MP73/MP8 isteğe bağlı kabul helper’ları; MP75 test yaşam döngüsü ve sürümlü koruma pinleri.

Riskler: büyük tabloda çok sütun mobilde yatay kaydırılır; kaynak katkısı yereldir, devlet tam netinin kolonilere dağıtımı yoktur. İsyan dedup alanı eski yüklemede ilk uygun uyarıyı bir kez gösterebilir. MPb12 yeni komutları eski çalışan istemci bilmez; host ve istemciler aynı p17 zincirini kullanmalıdır. Hiçbir kullanıcı kaydı otomatik dosya dönüşümüne alınmadı.

## 12. ZIP, manifest ve GitHub

[Oyun ZIP’i](../../releases/stars-faz96h10p17.zip): **releases/stars-faz96h10p17.zip**, **807043 bayt**.

- SHA-256: `4662f75800dfeba5d36d90a8ff45b42416a2bb96bbee4892dab5f91bb8b2b377`
- CRC32: `2B082D8F`
- `python tools/package-release.py`; ikinci üretim `python tools/package-release.py --out /tmp/stars-faz96h10p17-final-second.zip`: iki ZIP bayt düzeyinde eşit.
- `python tools/verify-release.py`:19runtime build/PWA/hash doğrulandı. ZIP20girdi, tüm üyelerde CRC ve SHA-256 doğrulaması.
- `release-verification.json`: tüm paket üyeleri ve değişen runtime/MP dosyalarının p16→p17 SHA karşılaştırmaları. `package-first.json`, `package-second-final.json` ve `verify-release.log`.
- `release-before-ownership.json`/`package-before-ownership.json` yayımlanmamış ara adayın hash’idir; **nihai paket yukarıdakidir**. Önceki p16/p15 ZIP’leri korunur.

Yeni dosya yolu/dağıtım allowlist’i eklenmedi. Docker build/deploy ve Render NOT RUN; MPb12 host/istemci kaynakları dalda ayrıca bulunur. ZIP tek başına tam multiplayer dağıtımı değildir.


Kod/test/paket commit’i: [`f14955e689182f375184cba001aa82334fc0f126`](https://github.com/sarsiss12-dot/Star/commit/f14955e689182f375184cba001aa82334fc0f126). `push-code.log` ve `remote-code-heads.txt` uzak dalın aynı SHA’yı taşıdığını doğrular. PR tabanı olan p16 dalı `9173b6726cfe84cb035e80cd1acfbafcc947e328`, main `4296ad2d43fedce6264020b3761f50f1839fd836` olarak değişmeden kaldı.

Taslak PR oluşturma **bir kez** denendi; exit1, gerçek hata: `Post "https://api.github.com/graphql": Forbidden`. PR oluştuğu söylenemez. [Doğru karşılaştırma bağlantısı](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-board1-federation-stability-ux...codex/stars-beta-board2-colony-politics-ux?expand=1); kanıt `pr-attempt.log` / `pr-attempt.json`.

Issue #33 okuma ve bu faza ait kapsamlı olmayan durum yorumunu ekleme denemesi aynı **Forbidden** hatasıyla reddedildi (`issue-read.log`, `issue-comment-attempt.log`). Pano gövdesi yeniden yazılmadı, görev geçmişi veya diğer durumlar değiştirilmedi. §2 tablosu yalnız **yerel öneridir**; GitHub panosunun güncellenmiş durumu diye sunulmaz. Hiçbir görev kullanıcı kabulü olmadan TAMAMLANDI değildir.

[GitHub sonuç raporu](https://github.com/sarsiss12-dot/Star/blob/codex/stars-beta-board2-colony-politics-ux/reports/codex/BETA-BOARD2-SONUC.md). Rapor/kanıt commit’i kod commit’inden ayrıdır; kendi SHA’sını tekrar dosyaya yazmaz. Nihai uzak rapor HEAD’i son teslim mesajında verilir.

## 13. Yapılmayan işler ve sonraki bağımlılıklar

#30/#36 yeni bölge arması/üretken amblem çeşitliliği yapılmadı. #51 adaylık→tercih→EVET/HAYIR bütünü uygulanmadı; federasyon FIFO’su kopyalanmadı. #44 yeni AI kabul/ret oranı kampanyası yapılmadı. #39 yeni federasyon türü eklenmedi. #32’nin bütün rol değişimli insan ittifakı tarayıcı matrisi tamamlanmış değildir. #24/#25 özgün kullanıcı vakalarının nedeni hâlâ bilinmiyor. Bunlar yeni geliştirme veya PASS sayısına eklenmez.

#51 için güvenli sonraki veri modeli: mevcut council.agenda adaylarıyla ayrı dönemID/evre, adaylık hakları ve süre; seçimde dondurulmuş üye/oy ağırlığı ve insan tercih komutu; kazanan için mevcut startCouncilVote/EVET-HAYIR. Eski kayıtta aktif vote doğrudan eski evrede devam etmeli; kriz gündemi bu seçimle yanlış bloke edilmemeli. Rüşvet/şantaj ve özel ağırlıkların hangi evrede geçerli olduğu test edilmeden yarım yasa motoru yayımlanmamalı.

#39 genişletilebilirlik: FED_TYPES tek kayıt noktası olsa da ekonomik/askerî bonuslar, aiFedType/aiFedWilling, charter/duty, Save8 normalization ve MP enum kapıları birlikte değişir. Yağma/fetih bonusu yeni denge testi gerektirir; üç mevcut türün üstüne sadece isim eklemek işlevsel dördüncü tür değildir. Bu fazda uygulanmadı.

WAR-CENTER #16/#31/#40/#43/#49 için ortak bağımlılıklar: sabit warLedger.front/campaign ve taraf/katılım nedeni; diplomasi offer/settlement/joint kabulü; host yetki ve exactly-once komutu; vaat edilen kaynak/ödül/geçiş için yürütme zamanı; mevcut federasyon destek kararının ayrı rızası. Sonraki faz önce ortak çağrı/teklif sözleşmesini ve eski Save8 geçişini kurmalı, sonra aynı veriyle tek UI sunmalı. Yeni savaş pazarlığı burada yazılmadı.

## 14. Kullanıcı kabulü ve öncelik sırası

1. Gerçek PC host/katılımcıda koloni tablosunu aç;10/30+koloni ve habitatta hızlı seçim/sıralama/scroll yap. Sağ mevcut panel açık kalmalı. Mobilde yatay kaydırma ve PC%80/%100/%125 kontrol edilmeli. Koloniden federasyon, diplomasi, bilim ve Konsey’e geçince eski tablo geri açılmamalı.
2. Yerel üretim/girdi/bakım değerlerini bina kartları ve devlet bilançosuyla birlikte oku; devlet ortak masrafının tabloda paylaştırılmadığını kontrol et. Tek seferlik bedeli aylık net sanma.
3. Boş düşük yaşanabilirlik dünyası, uygun dünya ve savaş hâlindeki düşman kolonisinde engel açıklamalarını aç. Kalkan/ordu/kuşatma ile motorun gerçek sonucunu karşılaştır; bilinmeyen ETA kesin süre gibi görünmemeli.
4. Riskli kendi koloninin sayacı/harita işareti; eşik dalgalanması, kayıt ve yeni bölümde uyarı. Gizli kışkırtıcı adı görünmemeli.
5. Katılımcıyla uzak inşa hedefi seç, host önizlemesini bekle, onayla; varışta tek maliyet, ilerleme/tamamlama ve yeni odada devam. Üçüncü oyuncu özel görevi görmemeli. Casusluk hızlı hedefi ve mevcut onay ekranını dene.

Fiziksel Android, gerçek PC kullanıcı kabulü, LAN/internet ve Render **NOT RUN**. Otomatik Chromium kullanıcı onayı değildir. İlk sonraki öncelik p17 gerçek cihaz kabulü ve #19’un yerel net/tam devlet neti ayrımının kullanıcıyla değerlendirilmesidir. Bundan sonra #19 ledger tahsis/geri dönüş filtreleri; ardından kalan #33 UX, #30/#36; #51 ve #39 ayrı bütünlüklü siyasi/denge alt paketleri. Kritik #24/#25 için kullanıcı Save8’i gelirse yeni özellikten önce aynı kayıtta tanı yapılmalıdır.
