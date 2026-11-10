# STARS — BETA-STABILITY-AI.0 sonuç raporu

10 Kasım 2026 UTC. **p22 geliştirme adayı GitHub'a teslim edildi; gerçek kullanıcı kaydı kabulü eksik.** Gerçek `.sav` eki alınmadığından ilk20K filonun kayıp nedeni **BELİRLENEMEDİ**. Yetim referansları oluşturan ve kalıcı tutan iki kod yolu kontrollü p21 üzerinde FAIL ile kanıtlandı; referans koruma ve kurtarma düzeltmeleri geliştirildi. Hiçbir pano görevi TAMAMLANDI yapılmadı.

## 1. Kanonik kaynak ve teslim kimliği

| Alan | Doğrulanmış değer |
|---|---|
| Depo | `sarsiss12-dot/Star` |
| Başlangıç dalı | `codex/stars-beta-espionage-rebellion0-ux` |
| Başlangıç uzak HEAD | `838f2c392b2cffa9198b88388d1f905e5c744604` |
| Önceki p21 kod/paket commit | `257d01dd06cec92b981abeccc6e5419b8a0c421a` |
| Bitiş kod/paket HEAD | **`b6dd2c6ab570debc29e02e5e60b48eb591fc9a23`** |
| Çalışma dalı | `codex/stars-beta-stability-ai0-save-fleet-recovery` |
| Yeni oyun / PWA / MP | `96h10p22` / `stars-v96h10p22` / `MP.8.9b17` |
| Kayıt / MP paket / protokol | **Save8 v8 / 4 / 1** |

Sonuç raporu ayrı belge commit'iyle gönderilir; kendi SHA'sını içine yazan bir commit zinciri oluşturulmaz. Nihai rapor HEAD'i teslim mesajında belirtilir. [Kod commit'i](https://github.com/sarsiss12-dot/Star/commit/b6dd2c6ab570debc29e02e5e60b48eb591fc9a23), [geliştirme dalı](https://github.com/sarsiss12-dot/Star/tree/codex/stars-beta-stability-ai0-save-fleet-recovery).

`main` uzak HEAD'i `4296ad2d43fedce6264020b3761f50f1839fd836`; kaynak alınmadı. Başlangıç dalında daha yeni uzak değişiklik görülmedi. Önceki raporlar, p21 tanıları, mevcut savaş/federasyon/koloni mekanikleri korundu. Kanıt: `E/source-heads.txt`, `E/remote-verify.txt`, `E/control-provenance.json`. Bu raporda **E = `reports/codex/evidence/beta-stability-ai0`**.

Belgelerde geçen tarihsel Render adresinin `/mp/version` sorgusu HTTP403 döndürdü (`E/render-version-error.log`). Canlı dağıtımın p21 veya p22 olduğu doğrulanmadı. Render deploy/restart, ana dala merge, force-push veya kullanıcı kayıtlarına yazma yapılmadı.

## 2. Gerçek Save8: alınan ve alınamayan kanıt

`stars-2224-10.sav`, `STARS_2224_10_filo_hata_inceleme.md` ve `stars_2224_10_orphan_manifest.json` erişilebilir ek olarak gelmedi; çalışma alanında bulunamadı. Özgün dosya okunmuş, hash'i doğrulanmış veya kopyası onarılmış gibi raporlanmaz.

| Kullanıcının bildirdiği değer | Bu oturumda bağımsız doğrulama |
|---|---|
| 3.122.149 bayt, Save8v8,2224/10, seed982390288 | **NOT RUN** |
| SHA-256 `37fc6db0579c891d508a4251613aea92cb7a6ba797ca2f459711899070964ffe` | Beklenen değer; gerçek dosya SHA'sı alınamadı |
| CRC32 `DCE544EB` | Beklenen değer; gerçek dosya CRC'si alınamadı |
| 300 sistem,23 devlet,253 filo; Ororni Filosu34 filo/44 gemi | Kullanıcı beyanı; bağımsız envanter çıkarılamadı |
| ID1 yok;27 kruvazör → ID1;14 Verrus/13 Pyraeran | Kullanıcı beyanı; gerçek konum/varlık doğrulaması yapılmadı |
| 117 sipariş:4 → ID1,113 → ID1945; kayıtlı11.805 alaşım | Kullanıcı beyanı; **11.805 alaşımın kaybedildiği iddia edilmez** |
| Toplam112 yetim sevkiyat:27 oyuncu /85 diğer devletler | Gerçek kayıt kabulü NOT RUN; aynı sayılarla ayrı sentetik test yapıldı |

`E/save-input-status.json` bu ayrımı makine okunur biçimde tutar. Gerçek `.sav` GitHub'a eklenmedi; kullanıcı dosyası değiştirilmedi. Yeni `tools/audit-save-fleets.cjs` yalnız okur; boyut/SHA/CRC, filo ve yetim sipariş envanteri çıkarır. Gerçek dosya geldiğinde kullanılacak komut (bu oturumda **NOT RUN**):

```bash
node tools/audit-save-fleets.cjs /yerel/ozel/stars-2224-10.sav 0 37fc6db0579c891d508a4251613aea92cb7a6ba797ca2f459711899070964ffe
```

Dosya farklı hash verirse denetim başarısız sonuç döndürür. Gerçek kayıtla çalışma özgün dosyaya yazmadan, ayrı kopyada yapılmalıdır.

## 3. ID1, ID1945 ve ana filonun kayıp nedeni

**İlk20K filonun silinme anı elimizde yok. Kök neden: KESİNLEŞMEDİ / BELİRLENEMEDİ.** Filo1'in savaşta mı yok olduğu, ikmalsizlikten mi dağıldığı, başka filoya mı birleştiği veya başka kuralın mı uygulandığı bilinmiyor. ID1945'in hangi işlemle kaldırıldığı da bilinmiyor. Geçmişteki gemiler, gücü veya sınıfları yeniden oluşturulmadı.

Kullanıcının sayısal incelemesi, mevcut kayıtta hedef ID'lerin eksik olduğunu bildiriyor; dosya gelmediği için bunu bu oturumda host dünyası ile misafir görünümü arasında ayrıca karşılaştıramadık. Kontrollü testte ise hata doğrudan kanonik filo dizisinde yeniden üretildi; yalnız harita görünümü sorunu değildir.

**Ayrı ve kanıtlanan kusur:** p21'de `UI.mergeFleets`, `mergeArmed`, MP `merge` ve tam `splitType` eski filoyu kaldırırken ona bağlı `shipment.fleet`, `joinFleet`, özel `delivery.fleet` ve genel ralli referanslarını birlikte taşımıyordu. Mevcut AI birleştirmesi de ayrı bir silme yolu kullanıyordu; bekleyen sipariş filtresi riski azaltıyor fakat bütün yaşam döngüsü için referans sözleşmesi oluşturmuyordu.

**İkinci kanıtlanan kusur:** kayıp hedefli ücretli üretim için güvenli bekletme durumu yoktu. `holdShipment(...,'lost')` mevcut tekil gemiyi koruyor, fakat bağlı ücretli işler üretime devam edebiliyordu. `restoreShipments` eksik hedefi referans bütünlüğü bakımından onarmıyordu. Bu iki açık, hedefi kaybolduktan sonra çok sayıda tekil ve yönetilmesi zor takviye kalmasını açıklayan mekanizmalardır. Bunların bulunması, gerçek Filo1'in kesinlikle birleşme ile kaldırıldığını kanıtlamaz.

p21 kontrol kökü üzerinde `node tests/beta_stability0_fleet_test.cjs --baseline` iki gerçek FAIL verir: birleştirme ve tam ayırma hedefi taşımıyor (`E/first-product-fail.log`,0/2). İlk geliştirme denemesinde henüz eklenmemiş yardımcıyı çağıran ek bir test hatası da `E/first-fail.log` içinde saklanır; ürün kanıtı olarak kullanılmaz.

## 4. Uygulanan filo ve sevkiyat düzeltmeleri

- Aynı sahipte kanonik `mergeFleetInto` ve `redirectFleetReferences`: yaşayan hedefin ID'si korunur; eski hedefi izleyen gemiler, özel siparişler ve ralli ayarları yeni ID'ye taşınır. Gemilerin gerçek nesneleri/hasarı korunur. Normal, toplu askeri, MP ve mevcut AI birleştirmesi ortak yolu kullanır.
- Tam ayırma eski ID'yi kaldırıyorsa referanslar yeni filoya gider; kısmi ayırmada eski hedef korunur. Bileşim/takviye planları korunur; birleşik bileşim300 sınırını aşıyorsa işlem değişiklik yapmadan gerekçeyle reddedilir.
- Hareketli takviyede başlamış yol bacağı korunur, eski hedefe ait sonraki rota temizlenir; sonraki hareket mevcut rota/erişim motorundan geçer. Teleport veya gemi kopyalama yapılmaz.
- Gerçek tam kayıp eski filoyu geri getirmez. Mevcut gemiler kayıp hedef beklemesine alınır. Ücretli işler `delivery.hold=true` ile korunur; `paid`, `left`, `tot` ve gerçek sipariş nesnesi silinmez veya yeniden fiyatlandırılmaz. Diğer geçerli işler tersane slotlarını kullanabilir.
- Yüklemede eksik/yanlış sahipli hedefler bir kez tanınır. Mevcut filo ID'leri yeniden üretilmez. Bekleyen işler ve kayıtlı ödemeler korunur; kayıt tekrar açıldığında yeni ücret veya hayalî filo üretilmez.
- AI, yalnız kayıp referansla işaretlenen devlet için mevcut `aiTurn` içinde en fazla bir grubu değerlendirir. Geçerli kendi filosuna veya bilinen kendi başkent toplanma sistemine aynı motorla yönlendirir. Kapalı rota gemileri silmez. Her ay bütün devletler için yeni bir genel plan motoru çalıştırılmaz.

Mevcut üretim iptali ve gerçek makbuzdan iade kuralları değiştirilmedi. Toplu kurtarma ekranı iptal/iade icat etmez; mevcut gemiyi bir hedefe yönlendirir veya bekletir.

## 5. Toplu kurtarma arayüzü ve gerçek komut

Üst durum listesinden **Kayıp takviye hedefi · Toplu kurtarma** açılır. Kayıp hedef grupları ayrı ayrı gösterilir; hangi eski ID'nin kaç gemi ve kaç siparişle ilişkili olduğu görünür. Kayıtlı ödeme, kayıp tutarı olarak sunulmaz.

İşlemler: **Hepsini beklet**, **aynı sistemde duran uygun takviyeleri birleştir**, **geçerli kendi filosuna yönlendir**, **bilinen kendi toplanma sistemine yönlendir**. Farklı sistemdeki gemiler birleştirme adı altında yer değiştirmez. Hareket, savaş, sahiplik ve askeri/sivil grup koşulları yeniden denetlenir.

Misafir `fleetRecovery` komutu gönderir; gerçek devlet bağlantı sahipliğinden gelir. Komut alanları ve hedef sahipliği host'ta doğrulanır. Grubun gemi/sipariş kimliklerinden türetilen damga bayat listeyi reddeder; damga yetkilendirme yerine kullanılmaz. Aynı yönlendirme tekrar gönderilirse ikinci gemi veya ikinci ödeme oluşturmaz. Başarı host ACK'inden önce gösterilmez.

Kayıtlı bir terminal olay varsa ekran **Savaşta tam kayıp / İkmalsizlik / Birleşme / Terhis** gibi nedeni, günü ve eldeki son gemi/güç bilgisini gösterir. Eski kayıtta olay yoksa neden bilinmiyor denir. `UI.fleetRecoveryOpen` ve salt-okunur özetler Save8/RNG'yi değiştirmez.

Gerçek Chromium testinde27 takviye, hedefte önceden bulunan1 gemiye katıldı: toplam28. Bu, kayıp ana filonun yeniden yaratılması değildir. İki gerçek ücretli test siparişi korunur. Sayısal117 iş testi ayrı motor fikstürüdür.

## 6. Filo yaşam döngüsü kanıtı

İsteğe bağlı `fleetJournal`, en fazla256 terminal olayı tutar. Olay başında ID, sahip, gün, sistem, mevcut hareket hedefi, güç, gemi sayısı/sınıfları, gerçek ikmal, son emir türü, çatışma, mevcut savaşlar ve bağlı iş/sevkiyat sayıları kaydedilir. Birleşme/tam ayırmada yeni ID de bulunur.

Kancalar: birleştirme, tam ayırma, savaş hasarı ve silahsız kalan filo kaybı, ikmal, ekonomik/federal terhis, koloni gemisi tüketimi, kara ordusu kaybı/görev tüketimi, radyasyon, devlet/kriz/korsan kuralı temizliği ve iki riskli kalıntı gemi kaybı olayı. Sürü/korsan tavanının mevcut oyun kuralı değiştirilmez; neden sınıflandırılır. Nedeni önceden kaydedilmemiş boş filo temizliğine **önceki neden bilinmiyor** denir.

Bu bir her kare dünya kopyası değildir. Referans taraması gerçek kimlik geçişinde/kayıpta veya istenen kurtarmada yapılır. UI özeti oturumda kısa süre saklanır. Eski olaylar256 sınırında düşebilir; kalıcı sınırsız arşiv vaat edilmez. Misafire yalnız kendi son32 kaydı aktarılır. Eski kaydın eksik ID'lerine geçmişe dönük savaş/ikmal nedeni atanmaz.

## 7. Save8 zorunlu senaryolarının gerçek sonucu

| Senaryo | Sonuç ve kapsam | Kanıt |
|---|---|---|
| S1 gerçek dosyanın salt-okunur hash/envanteri | **NOT RUN** — dosya yok | `save-input-status.json` |
| S2 gerçek112/27/85 envanteri | **NOT RUN** gerçek dosyada; sentetik sayısal test PASS | `fleet-final.log` |
| S3 gerçek117 iş ve11.805 alaşım | **NOT RUN** gerçek dosyada; sentetik4/113 dağılımı ve makbuz toplamı korunuyor | aynı motor testi |
| S4 birleştirme / tam-kısmi ayırma | **PASS** — referans, hasar, bileşim ve seçili hedef yolu | motor10/0, MP3/0 |
| S5 gerçek savaşta tam kayıp | **PASS** kontrollü `applyDamage`; ana filo yok, mevcut takviye/iş var | motor + native SP/MP |
| S6 gerçek ikmal kaybı | **PASS** düşük gerçek ikmal ve mevcut `attritionTick`; filo geri gelmez | motor testi |
| S7 toplu27 gemi kurtarma | **PASS** sentetik motor ve native üç insanlı arayüz; çift komut güvenli | `mobile-packaged-retry/`, `sp-release/` |
| S8 soğuk Save8 / yeni oda | **PASS** yerel gerçek süreçlerle; yeni odada native kurtarma da uygulandı ve tekrar reddedildi | `cold-packaged/R/stability-cold*.json` |
| S9 gerçek300/23 kayıtta85 AI sevkiyatı | **NOT RUN** gerçek dosyada; kontrollü tek AI'ya ait85 sevkiyat aynı mekanikle korunup yönlendirildi | motor sayısal test; dar perf ayrı |

Sentetik envanter:27 tekil kruvazör iki sisteme14/13 dağıtılır;117 ücretli iş4/113 hedef grubunda tutulur, toplam11.805 kayıtlı alaşım değişmez. Aynı sistemdeki uygun27 gemi önce iki filoda toplanır. Yeni hedefe yönlendirme/kayıt-yükleme gemi ve makbuz sayısını korur. **Verrus/Pyraeran adları veya gerçek Ororni kaydı bu testin girdisi değildir.**

## 8. AI isyan yanıtı kalite ölçümü

p21'in meşru kalıntı olayı korundu: seed23/8AI, AI3, gün1007, sistem35; gerçek keşif yolu +520 mineral ve ilgili kolonilerde−12 istikrar üretir. Ödül, rastgelelik veya sonuç test için değiştirilmedi. Önceki başarısız altı aylık kurtarma assertion'ı silinmedi: [ilk FAIL](evidence/beta-espionage-rebellion0/ai-campaign-first-fail.log), [tam AI tanısı](evidence/beta-espionage-rebellion0/ai-all-active-diagnostic.json).

Aynı p21 Save8 noktası üç VM'ye yüklenir; bütün diğer AI sistemleri açıkken24 ay izlenir. Nokta şoktan sonradır ve **önceden verilmiş aktif özerklik politikaları içerir**. Bu nedenle `off`, tüm geçmiş müdahaleler silinmiş bir dünya anlamına gelmez; yalnız bu noktadan sonraki `aiInternalCrisis` kararları kapatılır. Kampanya bu sınırla yorumlanmalıdır.

| Ölçüm | Sonraki müdahale kapalı | p21 | p22 aday |
|---|---:|---:|---:|
| Takip |24 ay|24 ay|24 ay|
| Yeni politika sayısı |0|2|2|
| Yeni politika doğrudan bedeli |0|160 etki|160 etki|
| En yüksek yerel sayaç |13|13|13|
| En düşük izlenen istikrar |28|28|28|
|8. ay ortalama istikrar |57,38|57,88|57,88|
|24. ay ortalama istikrar |66,56|66,56|66,56|
|24. ay en yüksek yerel sayaç / schism |0/0|0/0|0/0|
| Başlangıçtaki kolonilerden kayıp |0|0|0|

p21 ve aday,1050/1080 günlerinde sistem7/8 için80'er etki bedelli özerklik uyguladı. Bu koşulda yeni kriz AI değişikliğine gerekçe çıkmadı; **`aiInternalCrisis` karar kuralları değiştirilmedi**. Başarı yalnız komut sayısından çıkarılmadı; hedef/gerçek istikrar, sayaç, kaynak, mevcut politika ve koloni sahipliği aylık kaydedildi.

Pozitif mikro deneyde yeterli kaynaklı kritik AI bir geçerli müdahale yaptı. Negatif mikro deneyde sıfır bütçeli AI ücretli eylem yapmadı, kaynak/RNG değişmedi. Bu deneyler her krizin kurtarılacağını veya AI'nın isyanı engelleyeceğini kanıtlamaz.

Komut: `STARS_OUTPUT=E/ai-quality-final node tests/beta_stability0_ai_quality.cjs`. **PASS**, ölçüm JSON'u `ai-quality-final/quality.json`. Kontrol kökü `tests/helpers/beta-stability0-control.cjs` ile git'ten aynı p21 baytlarıyla yeniden kurulabilir; `control-provenance.json` daha önce kullanılan kontrol dosyalarıyla tam eşitliği doğrular.

## 9. Multiplayer kök nedenleri ve açık aralıklı hatalar

**Düzeltilen yeni kurtarma kusuru:** açık normal modal aynanın kurulmasını bekletiyordu. Birleştirme host'ta uygulanıp ACK geldiği halde kullanıcı “Güncel durumu aç” ile eski grubu yeniden açabiliyordu. Yeni kurtarma modalı yalnız kimlik/damga tuttuğu için güvenle ayna yenilenmesine izin verilir. Başarı, uygulanmış dünya revizyonu veya host'un işlem sonrası grup damgası doğrulanınca gösterilir.

İlk düzeltme denemesi ACK `rev` ile ayna sıra `rev` değerini aynı sayaç sanıyordu; bu deneme de FAIL oldu. Bunlar farklı sayaçlardır. Host, ayna iletilerine geriye uyumlu isteğe bağlı `worldRev` ekler; istemci kurduğu dünya revizyonunu izler. Değişiklik üretmeyen bekletme gibi işlemler için host'un yalnız kendi grubuna ait sonuç damgası da kullanılır. Yeni tam dünya snapshot sistemi yazılmaz.

**Düzeltilen ralli kimlik/gizlilik kusuru:** ralli devlet anahtarı misafirin yerel0 kimliğine çevrilmiyordu. Ayrıca el değiştirmiş sistemde kalabilen başka devlete ait ralli ayarı tam kopyalanabiliyordu. Önce negatif test FAIL verdi (`rally-privacy-first-fail.log`); artık yalnız gerçek sahibin ralli ayarı yerel0 anahtarıyla aktarılır. Filo ID'si π dönüşümüne girmez. Sonuç3/0 (`rally-privacy-final.log`).

**Özgün aralıklı vakalar kapanmadı:** `selfleet`, `dealSend`, `fedFoundStart` için bütün koşullarda kesin çözüm iddia edilmez. Bu fazın birleşik8/0 koşusu ilgili mevcut gerçek eylemleri birlikte sınar. Son tekrarın birinde “KATIL” düğmesi native tap sırasında görünüm değiştirip Playwright zaman aşımına girdi. Lobi/katılma kaynakları bu fazda değiştirilmedi; ürün/taşıma/test ayrımı kesinleşmedi. Aynı koşunun değişmeyen native tekrarı3/0 olsa da ilk FAIL saklanır.

Host H, misafir B ve C ayrı Chromium süreçleri/oturumları kullanır. Soğuk kabul açıkça3 insan +5 AI ile kuruldu. B kendi gemisini/işini yönetir; C'nin komutu reddedilir, özel ralli/üretim/kayıt bilgisi aynasına gitmez. H kanonik gemi ve kaynağı doğrular.

## 10. Gerçek tarayıcı kabulü ve ekran kanıtları

Bütün komutlarda `STARS_CHROMIUM_PATH=/usr/bin/chromium` kullanıldı. E dizini çıktı köküdür; komutlardaki `E/...` bu rapordaki tam dizinin kısaltmasıdır.

| Gerçek komut | Sonuç | Kanıt |
|---|---|---|
| `STABILITY0=1 MPP0_DESKTOP=1 FEDAI0_AUDIT=1 MPP0=1 WAR_CENTER0=1 FEDAI0=1 ER0=1 BOARD1=1 MP73_ONLY='^(A1\|B1\|ST0\|P0 \|WC0\|FAI0\|ER0\|BD1)' STARS_OUTPUT=E/desktop-combined node tests/browser-mp73.cjs` | **8/0** | `desktop-combined.log`, `desktop-combined/mp73-results.json` |
| `STABILITY0=1 MP73_ONLY='^(A1\|B1\|ST0)' STARS_OUTPUT=E/mobile-release node tests/browser-mp73.cjs` | **3/0** | `mobile-release.log` |
| Aynı seçili komut, `STARS_OUTPUT=E/mobile-packaged` | **1/2 FAIL**; B1 lobi zaman aşımı, ST0 kurulamadı | `mobile-packaged.log`, `tapfail-1-*` |
| Aynı komut, `STARS_OUTPUT=E/mobile-packaged-retry` | **3/0**, son runtime | `mobile-packaged-retry.log` |
| `STARS_OUTPUT=E/sp-release node tests/browser-beta-stability0-sp.cjs` | **5/0**:4 görünüm + sayfa hata denetimi | `sp-release.log`, `sp-release/results.json` |
| `STABILITY0_R=1 MP8_SCEN=R MP8_MONTHS=2 STARS_OUTPUT=E/cold-release node tests/browser-mp8.cjs` | **5/0** | `cold-release.log` |
| Aynı komut, `STARS_OUTPUT=E/cold-packaged` | **5/0**, son runtime; yeni odada gerçek kurtarma ve tekrar reddi | `cold-packaged.log`, `cold-packaged/R/stability-cold-applied.json` |

Birleşik masaüstü koşusunda son dar ralli gizlilik filtresi ve bilinen neden metni henüz eklenmemişti; son ekler MP negatif/pozitif3/0, misafir görüşü7/0, SP5/0, son native mobil3/0 ve soğuk5/0 ile doğrulandı. Bütünleşik testin yapıldığı kaynak aşaması saklanır; sonrasında ilgisiz motor değişikliği yapılmadı.

Ekranlar: [SP800×360](evidence/beta-stability-ai0/sp-release/sp-recovery-800.png), [SP1920×1080](evidence/beta-stability-ai0/sp-release/sp-recovery-1920.png), [misafir800×360](evidence/beta-stability-ai0/mobile-packaged-retry/stability-recovery-800.png), [915×412](evidence/beta-stability-ai0/mobile-packaged-retry/stability-recovery-915.png), [960×540](evidence/beta-stability-ai0/mobile-packaged-retry/stability-recovery-960.png), [host ACK sonucu](evidence/beta-stability-ai0/mobile-packaged-retry/stability-recovery-ack.png), [yeni oda sonrası sonuç](evidence/beta-stability-ai0/cold-packaged/R/stability-cold-applied.png).

%80/%100/%125 istekleri ve `UI.getUIScale()` gerçek sonucu JSON'da ayrı tutulur. Mevcut küçük ekran kuralı1000px/600px altında güvenli%100'ü zorunlu tutar; mobilde uygulanmayan%80/%125 çalışıyor diye sayılmaz. Masaüstünde üç gerçek ölçek sınandı.

**NOT RUN:** fiziksel Android, kullanıcıların iki gerçek PC'siyle kabulü, LAN, gerçek internet MP, canlı Render oynanışı. Yerel Chromium bu testlerin yerine geçirilmez. MP8N kesinti matrisi ve bütün tarihsel uzun kampanyalar bu fazda yeniden çalıştırılmadı.

## 11. İlk FAIL kayıtları ve son durum

İlk loglar silinmedi. `first-product-fail.log` gerçek p21 referans kusurudur. `targeted-first.log` ikmal fikstüründe erişim bozulduktan sonra sipariş verilmesini bekliyordu; gerçek sipariş erişim bozulmadan önce verilerek senaryo düzeltildi. `browser-first.log` eksik varsayılan Chromium ikilisi; kurulu yol kullanıldı. `browser-mobile.log` zorunlu B1 kurulumunu dışarıda bırakan seçimdir.

`browser-mobile-second` eski Konsey yüzeyi açıkken gerçek sekme girişini atlıyordu; mevcut p20 `UI.act('tab',...)` kullanıldı. `browser-mobile-third` kapalı `details` içindeki filo hedefini doğrudan arıyordu; grup başlığı native dokunmayla açıldı. Bu iki fikstür düzeltmesi ürün düzeltmesi diye sayılmaz. `browser-mobile-fourth` gerçek yeni modal/ayna bayatlığıdır; `browser-mobile-fix` ilk yanlış revizyon karşılaştırmasıdır. `browser-mobile-worldrev`3/0 sonucudur. Yeni `mobile-packaged` KATIL hatası ayrıca açık kalır.

Eski sevkiyat testi ilk29/1 verdi: hedef yokken yine tekil gemi üretilmesini bekliyordu. Yeni kullanıcı kuralı ücretli işi bekletmektir. Test, gemi yollamama yanında sipariş nesnesi, makbuz, ilerleme, kaynak ve yönetilebilir grup varlığını daha sıkı sınar; son30/0. PERF.1 ilk3/1: kontrol kökü yeni oyun değişikliklerini de kaldırıyordu. PERF.2'de zaten kullanılan yaklaşımla yalnız PERF.1 optimizasyonu ayrıldı; tarihsel kaynak hash assertion'ları ve ham Save8/RNG assertion'ları korunarak4/0 geçti. Assertion kaldırma, timeout artırma veya force/JS click kullanılmadı.

Dar performans fikstürünün ilk22AI kuruluş isteği mevcut16AI güvenli sınırı nedeniyle reddedildi; sınır değiştirilmedi. Sonraki envanter assertion'ında korsan devleti normal devlet sayan test hatası düzeltildi. Bunlar da `performance.log` / `performance-final.log` içinde korunur.

## 12. Hedefli motor ve ilgili regresyonlar

Aşağıdaki komutlar gerçek çalıştırılan dosyalardır. Log yolları E'ye göredir. İlk32 komut turunda30 komut başarılı, iki komut yukarıda açıklanan ilk FAIL'i verdi; son sonuçlar ilgili ayrı loglarla gösterilir. Sayılar örtüşen senaryolar içerir; bağımsız yeni özellik sayısı olarak toplanmaz.

| Test komutu | İlk → son PASS/FAIL | Kanıt |
|---|---|---|
| `node tests/beta_stability0_fleet_test.cjs` | 10/0 | `regression/beta_stability0_fleet_test.cjs.log` |
| `node tests/beta_stability0_mp_test.cjs` | 3/0 | `regression/beta_stability0_mp_test.cjs.log` |
| `node tests/faz93b_pending_shipments_test.js` | 31/0 | `regression/faz93b_pending_shipments_test.js.log` |
| `node tests/faz93c_fleet_composition_test.js` | 47/0 | `regression/faz93c_fleet_composition_test.js.log` |
| `node tests/faz88a_1_ship_dispatch_test.js` | 29/1 → 30/0 | `dispatch-updated.log (ilk kayıt regression/ altında)` |
| `node tests/faz88a_fleet_routes_test.js` | 38/0 | `regression/faz88a_fleet_routes_test.js.log` |
| `node tests/beta_board1_critical_test.cjs` | 5/0 | `regression/beta_board1_critical_test.cjs.log` |
| `node tests/beta_board1_cancel_test.cjs` | 2/0 | `regression/beta_board1_cancel_test.cjs.log` |
| `node tests/beta_board1_agenda_test.cjs` | 13/0 | `regression/beta_board1_agenda_test.cjs.log` |
| `node tests/beta_board2_colony_test.cjs` | 5/0 | `regression/beta_board2_colony_test.cjs.log` |
| `node tests/beta_board2_privacy_test.cjs` | 1/0 | `regression/beta_board2_privacy_test.cjs.log` |
| `node tests/beta_board2_remote_test.cjs` | 2/0 | `regression/beta_board2_remote_test.cjs.log` |
| `node tests/beta_board2_rebellion_test.cjs` | 1/0 | `regression/beta_board2_rebellion_test.cjs.log` |
| `node tests/beta_espionage_rebellion0_test.cjs` | 12/0 | `regression/beta_espionage_rebellion0_test.cjs.log` |
| `node tests/beta_espionage_rebellion0_mp_test.cjs` | 6/0 | `regression/beta_espionage_rebellion0_mp_test.cjs.log` |
| `node tests/beta_fed_ai0_edit_test.cjs` | 6/0 | `regression/beta_fed_ai0_edit_test.cjs.log` |
| `node tests/beta_fed_ai0_emergency_test.cjs` | 5/0 | `regression/beta_fed_ai0_emergency_test.cjs.log` |
| `node tests/beta_fed_ai0_raider_test.cjs` | 4/0 | `regression/beta_fed_ai0_raider_test.cjs.log` |
| `node tests/beta_fed_ai0_mp_test.cjs` | 4/0 | `regression/beta_fed_ai0_mp_test.cjs.log` |
| `node tests/beta_war_fix0_test.cjs` | 17/0 | `regression/beta_war_fix0_test.cjs.log` |
| `node tests/beta_war_center0_mp_test.cjs` | 9/0 | `regression/beta_war_center0_mp_test.cjs.log` |
| `node tests/mp_p0_guest_test.cjs` | 7/0 | `regression/mp_p0_guest_test.cjs.log` |
| `node tests/mp_p0_decisions_test.cjs` | 7/0 | `regression/mp_p0_decisions_test.cjs.log` |
| `node tests/mp_p0_motion_test.cjs` | 3/0 | `regression/mp_p0_motion_test.cjs.log` |
| `node tests/mp_p0_notice_test.cjs` | 3/0 | `regression/mp_p0_notice_test.cjs.log` |
| `node tests/mp_p0_cold_notice_test.cjs` | 1/0 | `regression/mp_p0_cold_notice_test.cjs.log` |
| `node tests/mp73_council_test.js` | 14/0 | `regression/mp73_council_test.js.log` |
| `node tests/mp74_lobby_test.js` | 5/0 | `regression/mp74_lobby_test.js.log` |
| `node tests/mp74_notice_test.js` | 6/0 | `regression/mp74_notice_test.js.log` |
| `node tests/mp75_war_test.js` | 5/0 | `regression/mp75_war_test.js.log` |
| `node tests/perf1_equivalence_test.js` | 3/1 → 4/0 | `perf1-correct-control.log (ilk kayıt regression/ altında)` |
| `node tests/perf2_equivalence_test.js` | 5/0 | `regression/perf2_equivalence_test.js.log` |

Son dar ekler: `node tests/beta_stability0_mp_test.cjs`3/0 (`rally-privacy-final.log`), `node tests/beta_stability0_fleet_test.cjs`10/0 (`fleet-final.log`), `node tests/mp_p0_guest_test.cjs`7/0 (`guest-final.log`). Yeni testler varsayılan olarak p21 kontrol kökünü git'ten kurabilir; yönetilen ortamda git alt sürecine izin gerektiren bir kurulum denemesi ardından salt-okunur yetkili koşu kullanıldı. Hiçbir kaynak farklıymış gibi normalize edilmedi.

#2 federasyon sonucu, #10 ortak hız/ACK, #23/#15 kuyruk/iptal, #27/#54 özel olay kararı için önceki motorlar korunur. #23'ün20+ kuyruklu fiziksel mobil kullanıcı akışı bu fazda ayrıca yeniden kabul edilmedi. #24'ün kontrollü0 stok/negatif net aylık clamp ve kendi aynası testi geçti; özgün enerji sapması çözülmüş sayılmaz. #26 özgün Konsey spamı yeniden üretilemedi; yeni bastırma kuralı eklenmedi.

## 13. Save8, RNG ve gizlilik

`STARS_OUTPUT=E/equivalence-reproducible node tests/beta_stability0_equivalence.cjs`: seed11/42/99, her biri3 ay; tüm stratejik Save8 alanları ve RNG birebir eşit. **Yeni `fleetJournal` alanı açıkça ayrı denetlenir**: başlangıç ham Save8 eşit, sonraki aylarda tanı olayları nedeniyle ham dosya baytları farklı olabilir. Gemi, kaynak, sipariş, AI veya savaş alanları normalizasyondan çıkarılmadı. Örtülü “ham dosya her ay aynı” iddiası yoktur. Kontrol dosyaları tam p21 SHA'larından kurulur; alan dışındaki eşitlik doğrudan JSON karşılaştırmasıdır.

Gerçek p21 paket4/protokol1 paketi p22'de doğrulamadan geçti; bozuk bütünlük reddedildi. Yeni isteğe bağlı kayıt alanları ve hold alanı güvenli okunur, tanı alanları sınırlandırılır. Eski kayda toplu gemi yaratma veya kullanıcı dosyasının üzerine otomatik dönüşüm yoktur.

PERF.1 ve PERF.2'nin kendi aynı mekanikli A/B kontrolünde Save8/RNG ham eşitliği geçti. Salt-okunur grup/HUD/ekran açma ve200 risk sorgusu kaynak/RNG değiştirmedi. Meşru kurtarma veya AI müdahalesinden sonra eski kayda byte eşitliği beklenmez.

Aynaya yalnız kendi filo geçmişi, kendi ralli ayarı, kendi üretim ve gerçek izinli görünür filo alanları gider. Kurtarma komutu gönderilen aktör alanını kabul etmez; gerçek oyuncu-devlet sahipliği kullanılır. Yabancı hedef, bilinmeyen toplanma sistemi, bayat grup ve C'nin B adına komutu mutasyon olmadan reddedilir.

## 14. Performans

Komut: `STARS_OUTPUT=E/performance-measured node tests/beta_stability0_performance.cjs`. Aynı p21 Save8 kökü,300 sistem,17 normal devlet +1 korsan, kontrollü253 filo. İlk22AI isteğini geçirmek için oyun sınırı gevşetilmedi. **Gerçek300/23 kullanıcı kaydı performansı NOT RUN**.

| Dar ölçüm | Sonuç |
|---|---|
| Isınma dışarıda,100 `stepFleets` medyanı p21 | 14.963633 ms |
| Aynı koşul p22 | 15.324386 ms |
| Oran | 1.0241 (bu dar ölçümde yaklaşık+%2,4) |
| Kayıp referansı olmayan3600 AI kontrolü | 1.011329 ms; Save8/RNG değişmedi |
|112 sevkiyat/117 iş ölçeğinde200 salt-okunur sorgu | 37.742888 ms; ortalama yaklaşık0,189 ms |

Bu, tüm kampanya FPS'i veya Android performans sertifikası değildir. Soğuk Chromium koşusunun gerçek zaman ölçümleri de JSON'da korunur; dönemsel istatistiklerde645ms'ye çıkan bir host longtask örneği vardır. Bu uç değer gizlenmez, yalnız kurtarma motoruna nedensel atama yapılmadı. Sürekli kare başı dünya geçmişi veya yeni tam dünya snapshot'ı eklenmedi. UI sorgusu kısa oturum önbelleği kullanır; AI kurtarma yalnız işaretli devlette/gerçek ihtiyaçta çalışır.

## 15. ZIP, manifest ve hashler

| Alan | Gerçek değer |
|---|---|
| ZIP | [`releases/stars-faz96h10p22.zip`](../../releases/stars-faz96h10p22.zip) |
| Boyut | 835,907 bayt |
| SHA-256 | **`14271929b85ec9af6ae946b556a013b6b01579d64fe6f5129eb459f02c6e9cf9`** |
| CRC32 | **`A99A49EC`** |
| Manifest | [`RELEASE-MANIFEST.json`](../../RELEASE-MANIFEST.json):19 runtime dosyası |
| ZIP üye sayısı |20:19 runtime + manifest |
| Tekrarlı paketleme | İki üretim ve son tekrar aynı bayt/SHA; üye CRC ve içerik hashleri doğrulandı |

Gerçek komutlar: `python tools/package-release.py --out releases/stars-faz96h10p22.zip`, `python tools/package-release.py --out /tmp/stars-p22-repeat.zip`, son `/tmp/stars-p22-last-check.zip` tekrarı; `python tools/verify-release.py --root /workspace/Star`. Kanıt `package-first.json`, `package-repeat.json`, `package-final.json`, `manifest-verify.log`, `release-integrity.json`.

Oyun ZIP'i tek başına MP relay/istemci dağıtımı değildir. Aynı GitHub commit'i MP kaynaklarını da içerir;7 ilgili MP dosyasının tam SHA-256'sı `release-integrity.json` içinde ayrıca tutulur. Mevcut p21 ve daha eski ZIP'ler silinmedi. Kanıtlar `EVIDENCE-MANIFEST.json` ile indekslenir. Büyük başarılı input tanıları içerik kaybı olmadan deterministik gzip'e alındı; özgün SHA/byte boyutları `desktop-combined/audit-compression.json` içindedir.

## 16. Değişen dosyalar

- Runtime: `main.js`, `ui.js`, `economy.js`, `ai.js`, `combat.js`, `diplomacy.js`, `sw.js`.
- MP: `research/mp0/mp-core.js`, `research/mp6/mirror.js`, `research/mp6/client/guest-stars.js`, `research/mp1/client/view.js`, `research/mp1/server/relay.js`.
- Paket: `RELEASE-MANIFEST.json`, yeni p22 ZIP'i. Save8/protokol yükseltmesi yok; isteğe bağlı `worldRev` ileti meta verisi ve yeni yetkili komut aynı host/istemci b17 zincirindedir.
- Testler: `beta_stability0_fleet/mp/ai_quality/equivalence/performance.cjs`, `browser-beta-stability0-sp.cjs`, `helpers/beta-stability0-*`, MP73/MP8 opt-in senaryoları; eski dispatch testinin yeni koruma sözleşmesi; PERF.1 kontrol kökü düzeltmesi. Tarihsel koruma zinciri yeni tam hunk/hash piminden önce p21 kaynağını geri kurar.
- Araç: `tools/audit-save-fleets.cjs`.
- Belgeler: bu rapor, görev envanteri, son rapor işaretçisi ve CLAUDE devir notu. Kod/paket commit'indeki bütün354 yol `E/changed-files-code.txt` içindedir; çoğu test kanıtıdır.

## 17. GitHub, pano ve kullanıcı kabulü

Kod/paket commit'i geliştirme dalına push edildi. PR için p21 kaynak dalına karşı tek `gh pr create` denemesi **GraphQL Forbidden** döndürdü; PR oluşturulmuş sayılmaz (`pr-attempt.log`). Issue33 okuması da Forbidden; pano okunamadı ve düzenlenmedi (`issue33-error.log`). Yetki engeli aşılmaya çalışılmadı. Yerel envanter ayrı tutulur.

[Compare / PR hazırlama bağlantısı](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-espionage-rebellion0-ux...codex/stars-beta-stability-ai0-save-fleet-recovery). Ana dala merge veya canlı dağıtım yok. Son rapor commit'i de aynı dala gönderilir; uzak HEAD son yanıttan önce doğrulanır.

## 18. Görev tablosu

| ID | Önceki durum | Kanıtlanan kök neden | Uygulanan düzeltme | Test | PASS/FAIL/NOT RUN | Kullanıcı kabulü |
|---|---|---|---|---|---|---|
| #25 ilk20K ana filo | Gerçek kayıp gözlemi; dosya bekleniyor | **BELİRLENEMEDİ** | Tarihsel gemi yaratılmadı; gelecek terminal olaylar kaydedilir | S1/özgün olay | **NOT RUN** | Bekliyor |
| #25 ID geçişi | Bağlı hedefler eski ID'de kalıyor | Birleşme/tam ayırma ortak referans geçişini atlıyor | Aynı sahipte kanonik taşıma, bileşim ve hasar koruma | Motor10/0, MP3/0 | **PASS kontrollü** | Bekliyor |
| #25 yetim sipariş/sevkiyat | Kayıp hedefe tekil gemi üretimi / tek tek yönetim | Üretimde güvenli hold ve toplu yönetim eksik | Ödenmiş işi beklet, mevcut gemiyi koru, toplu yönlendir | Sentetik27/85/117; native SP/MP/soğuk | **PASS kontrollü; gerçek dosya NOT RUN** | Bekliyor |
| #25 yaşam döngüsü | Geçmiş sebep kanıtı yok | Terminal yollar ortak tanı bırakmıyor | Sınırlı doğrulanan kayıt, yalnız kendi mirror geçmişi | Savaş/ikmal/merge/load/gizlilik | **PASS hedefli** | Bekliyor |
| AI isyan kalitesi | p21 kriz AI'sı / meşru şok mevcut | Yeni yanlış kriz kararı kanıtlanmadı | Kurallar değişmedi; karşılaştırmalı ölçüm |24 ay×3 dal, bütçe pozitif/negatif | **PASS ölçüm** | Gerçek oyun gözlemi bekliyor |
| P0 kurtarma ACK | Yeni modalda bayat grup kullanılabiliyor | Modal ayna bekletiyor; ilk rev fix'i farklı sayaçları karıştırıyor | Güvenli canlı modal, dünya revizyonu ve sonuç damgası | İlk FAIL → SP/MP native PASS | **PASS yeni yol** | Bekliyor |
| P0 özgün selfleet/dealSend/fedFoundStart | Önceki aralıklı FAIL'ler | Genel kök neden kesinleşmedi | Rastgele event/timeout değişikliği yok | Birleşik8/0; yeni KATIL FAIL1/2 → tekrar3/0 | **AÇIK / aralıklı FAIL korunur** | Bekliyor |
| Ralli π / gizlilik | Tam ralli nesnesi aktarılıyor | Anahtar dönüşümü ve kendi alanına daraltma eksik | Yalnız kendi ralli0 | Negatif FAIL → MP3/0 | **PASS** | Bekliyor |
| #2 | Önceki federasyon bildirim düzeltmesi var | Yeni tekrar kusuru kanıtlanmadı | Mevcut düzeltme korunur | Bildirim/FAI0/soğuk regresyon | **PASS sınanan yol** | Özgün kullanıcı kabulü bekliyor |
| #10 | Önceki hız/ACK düzeltmesi var | Yeni kusur kanıtlanmadı | Yeniden motor yazılmadı | Kritik/hız ve ortak oturum | **PASS sınanan yol** | Bekliyor |
| #23/#15 | Sabit kuyruk/kimlikli iptal mevcut | Yeni UI kusuru kanıtlanmadı | Makbuz/kimlik korunur |47 bileşim,30 dispatch,2 iptal | **PASS motor; fiziksel uzun UI NOT RUN** | Bekliyor |
| #24 | Özgün enerji sapması açık | Bu fazda yeniden üretilemedi | Ekonomi cezası/algoritması değişmedi | Kontrollü clamp / ayna regresyonu | **PASS kontrol; özgün olay açık** | Bekliyor |
| #26 | Özgün Konsey spamı açık | Yeniden üretilemedi | Kör tekilleştirme eklenmedi | Konsey regresyonu | **NOT RUN özgün vaka** | Bekliyor |
| #27/#54 | Önceki özel olay karar yolları mevcut | Yeni kusur kanıtlanmadı | Mevcut motor korunur |7 karar testi + native P0 | **PASS hedefli** | Bekliyor |

## 19. Açık işler ve gerçek kullanıcı testleri

1. **En yüksek öncelik: gerçek dosya.** Özgün `stars-2224-10.sav` ve inceleme/manifest ekleri geldiğinde önce beklenen SHA/CRC'yi doğrula; dosyayı salt-okunur koru. Sonra ayrı kopyada112/27/85 ve117/4/113 envanterini, gerçek rotaları ve kayıtlı11.805 alaşım makbuzlarını doğrula. Bu adım olmadan gerçek kayıt kurtarıldı denmez.
2. **Gerçek PC host/katılımcı:** ana hedefe takviye üretirken meşru birleştirme yap; hedef ID'lerin yeni filoya taşındığını kontrol et. Gerçek savaş kaybında filo geri gelmemeli; mevcut takviyeler ve ücretli işler üst durumdan yönetilebilmeli.
3. **Toplu kurtarma ve soğuk devam:** uygun yeni filo/toplanma noktası seç; farklı sistemler teleport olmamalı. Kaydet, tarayıcı/relay'i kapat, yeni oda aç, aynı devletle dön. Tekrar dokunma ikinci gemi/ödeme üretmemeli. Diğer oyuncu özel sipariş/ralli ayrıntısını görmemeli.
4. **Aralıklı native sorun:** KATIL, selfleet, dealSend ve fedFoundStart tekrar takılırsa gün/sürüm, açık panel, viewport ve mümkünse tanı kaydını sakla. Son PASS ilk FAIL'i geçersiz kılmaz. Fiziksel Android/PC kabulü hâlâ kullanıcıya aittir.
5. **AI:** sonraki gerçek kampanyada şok sonrası istikrar hedefini, kaynak krizini ve yerel/schism sayaçlarını birlikte izle. Meşru olaylar ve isyan ihtimali kaldırılmadı. #24/#26'nın özgün olayları ve diğer büyük siyaset/arma işleri bu fazda kapanmaz.

Teslim, kanıtlanan referans kusurları ve güvenli kurtarma için test edilmiş bir geliştirme adayıdır. Gerçek kullanıcı kaydı kabulü ile genel aralıklı P0 kapanışı tamamlanmış sayılmaz.
