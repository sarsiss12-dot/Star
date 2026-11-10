# STARS — BETA-FED-AI.0 sonuç raporu

9–10 Kasım 2026. **p19 geliştirici adayı teslimidir; fazın bütünü ve görevler TAMAMLANDI değildir.** AI/Yağmacı/düzenleme/acil savunma alt paketleri yerel kanıtlarla çalışıyor. **P0 aralıklı dokunma kökü açık**; son başarılı koşular önceki FAIL'leri silmez. Gerçek kullanıcı kabulü yok.

## 1. Kanonik kaynak, sürüm ve teslim

- Başlangıç: `8f5e3886c132ee3cc45e333f8630c395854360ed`, uzak `codex/stars-beta-war-center0-coalitions`; p18 kod/paket `5e5f26bf119b6fa9f12fe94d32d11177d04d80de`.
- Doğrulanmış kod/paket bitiş HEAD: **`b72dd0c0a362ba95d05b577be30388d787632ecd`** ([commit](https://github.com/sarsiss12-dot/Star/commit/b72dd0c0a362ba95d05b577be30388d787632ecd)). Rapor commit'i kendi SHA'sını içine yazmaz; nihai rapor/kanıt HEAD'i son teslim mesajında verilir.
- Çalışma dalı: `codex/stars-beta-fed-ai0-raiders-coalitions`. Uzak kod HEAD'i `code-remote-head.txt` ile doğrulandı.
- `main`: `4296ad2d43fedce6264020b3761f50f1839fd836`; eski main kaynak alınmadı. Son uzak taban hâlâ `8f5e3886c132ee3cc45e333f8630c395854360ed`. Kaynak zinciri: [başlangıç](evidence/beta-fed-ai0/source-heads.txt), [teslim öncesi](evidence/beta-fed-ai0/source-heads-final.txt).
- Oyun **96h10p19**, PWA **stars-v96h10p19**, MP **MP.8.9b14**. Save8 **v8**, MP paket **4**, protokol **1** korunur. Yeni `fedFoundUpdate` ve isteğe bağlı rıza sürümleri aynı komut zarfını kullanır; beyaz liste/yetki denetimi gevşetilmedi.
- p14 kurucu davetleri/iki insan/final, p16 FIFO/yeni üye/hız, p17 koloni/uzaktan inşa, p18 Savaş Merkezi ve insan koalisyonu zaten vardı. Bunlar yeni iş sayılmadı.
- Taslak PR tek denemede, pano okuma ve tek yorum yazımı `Post "https://api.github.com/graphql": Forbidden` verdi. **PR yok; #33 güncellenmedi.** [Compare](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-war-center0-coalitions...codex/stars-beta-fed-ai0-raiders-coalitions?expand=1). API engelini aşmak için yeniden yetki arama/başka pano oluşturma yapılmadı.

## 2. P0: p18 FAIL'lerinin gerçek ayrımı

| Gözlem | Kanıt ve kök | Yapılan | Gerçek son durum |
|---|---|---|---|
| WC0 yeni gün/stok bekleme timeout | Ürün p18 kalırken `p0-before.log`6/1; host ve misafir gün918–919, test tam900 bekliyor. Fikstür pause sonucunu denetlemiyor. İlk pause isteğinin ret nedeni yakalanmadığından kesin rate-limit denmez. | Test, gerçek host pause sonucu ve `G.speed===0` doğrulanmadan dünyayı sıfırlamaz. Ürün hız/rate-limit kuralı değişmedi. | Aynı birleşik eski yol7/0; genişletilmiş son PC8/0. |
| Sonraki BD1 bekleme | C'nin önceki `archiveHost` haber modalı açık; mevcut holdBuild aynayı tutuyor. Senaryolar birbirinin panel durumunu devralmış. | Yalnız test senaryosu sınırında H/B/C modal temizliği. Ürünün karar/ayna tutma güvenliği korunur. | İlgili BD1 gerçek UI geçti. |
| p18 `selfleet` / karşı teklif `dealSend` | Eski8s click/tap kayıtları okundu. Yeni koşularda aynı eski yüzeyler geçti; özgün aralıklı kusurun kesin ürün/test/ortam ayrımı kanıtlanamadı. | Koordinat, üst eleman, pointer/touch/click, DOM kimliği/mutasyon, gün/rev/ACK, modal/yüzey ve screenshot tanıları. | **AÇIK**; genel dokunma düzeltildi denmez. |
| Yeni ters rollü mobil `fedFoundStart` tap | İlk mobil3/1: “performing tap action”8s timeout. Host'ta gerçek davet oluşmuştu; son ölçümde düğme y596 ile360px ekran dışında. Bu son konum ilk touch/ACK gecikmesinin nedenini kanıtlamaz. | Aynı yol yeni olay kaydıyla tekrarlandı; timeout/force/JS click/assertion gevşetmesi yok. | Son mobil4/0; **ilk aralıklı FAIL açık kalır**. |

Başarısız ilk koşular, hedef JSON ve PNG'ler [kanıt dizininde](evidence/beta-fed-ai0/README.md). Büyük rolling JSON'lar gzip ile **özgün byte SHA'sı korunarak** sıkıştırıldı; örnek atılmadı. [Sıkıştırma endeksi](evidence/beta-fed-ai0/audit-compression.json). Sadece test altyapısında kanıtlanan iki kurulum kusuru düzeltildi; ürün dokunma motoru rastgele yeniden yazılmadı.

## 3. AI bağımsız koalisyon ve ücretli yardım

`aiTurn`/`aiWarReview` ve mevcut `aiStrategy` genişletildi. Yeni savaş/deal motoru yok; `G.p` geçici değiştirilmez.

- Bölgesel/dengeleyici hedef, mevcut arm/ready planı, gerçek CB, bilinen düşman gücü, kendi bütçesi, yorgunluğu, mevcut savaşları ve bilinen ulaşım değerlendirilir.
- Uygun bilinen müttefiklerden en çok3 adaya mevcut `warPrepareCreate`/`aiNegotiate`/host insan kutusu yoluyla davet gider. Ön ödeme yok. Her davetin maden önerisi kendi stokunun en fazla%6'sı ve750 ile sınırlı; gerçek son ilan bütün imzaları ve toplam kaynakları tekrar doğrular.
- En erken30 gün sonra kabul edilmiş destek, gözlenen toplam kuvvet ve geçerli rota varsa mevcut `aiWarReview` gerçek CB yetkisi içinde `warPrepareLaunch` uygular. 90 gün kabul yoksa iptal; eski hazırlık süre sınırı ve360 günlük yeniden değerlendirme hafızası korunur. İnsan yanıt vermeden insanın katılımı gerçekleşmez.
- Ücretli fırsat yalnız `warCenterIndex` ile **AI'nın bildiği** aktif cephede aranır. Kendi askerî bütçesi, ortak/düşman ilişkisi ve gerçek rota kontrol edilir. Gerçekten gerekiyorsa mevcut geçiş maddesi istenir. Önerilen fiyat kendi bakımından hesaplanan40–240 maden aralığıdır; yabancının özel stokunu okuyarak fiyat seçilmez. Aynı koşul/cephe için hafıza ve mevcut teklif ret/cooldown kuralları kullanılır.
- Yeni saldırı/fırsat, normal savaşı veya kritik ekonomisi olan AI'da açılmaz. Kabul edilmiş kuruluş/koalisyon taahhüdü sürerken ve savaş yokken eski otomatik koruma başvurusu ertelenir. Gerçek mevcut savaşta korunma/savunma önceliği yasaklanmaz. Bu, kampanyada ölçülen somut çakışmanın sınırlı düzeltmesidir; #44 genel vasallık reformu değildir.

**Gerçek karar örnekleri:**

| Deney | Teklif/karar | Gerçek sonuç |
|---|---|---|
| Seed23,8 aylık kontrollü koalisyon | AI1 kendi mevcut hedef2 için gün930 hazırlık1 açtı; AI3 kabul etti; gün960 mevcut savaş incelemesi ilan etti. | Hazırlık/cephe/ödeme aynı p18 kayıtlarında. Silahlı destek filosunun düşman başkenti23'e gerçek rotası/varışı sıkı assertion ile doğrulandı. |
| AI→katılımcı B ücretli destek | Gerçek `aiTurn` AI3→B1 teklif1 üretti. PC birleşik koşuda185 mineral, ayrı Yağmacı MP koşusunda193 mineral gerçek bakım koşullarından çıktı. | B kendi gelen kutusunda gerçek Kabul'e bastı; B stoğu tam bedel azaldı, AI stoğu aynı bedel arttı ve gerçek cephe açıldı. C özel teklifi görmedi. İlgili native JSON'lar fiyatı kaydeder. |
| İnsan ön koalisyona davet edildi, cevap vermedi | Mikro testte gerçek insan kartı oluştu; başka AI kabulüyle ilan mümkün kaldı. | Yanıt vermeyen insan savaşa sokulmadı. |
| Ret/ekonomi/erişim/gizli savaş | Aynı ret koşulunda20 değerlendirme tekrar teklif üretmedi; gerçek negatif gelir+stok krizi, kopuk rota veya bilinmeyen savaşta yeni macera yok. | Yetkisiz bilgi/karar yok. Geçiş/fiyat karşılıkları p18 sözleşme kurallarına tabidir. |
| Anavatan komşusunda gerçek tehdit | Yardımı kabul etmiş AI, yerel askerî kuvvetini savunmaya ayırdı. | Ayrı negatif test gerçek `aiCampaign.phase='defend'` nedenini doğrular; taarruz zorlanmaz. |

[Karar kayıtları](evidence/beta-fed-ai0/coalition-final/decisions.json), [kampanya](evidence/beta-fed-ai0/campaign-military-final/campaign.json). Genel filo/sivil rota eski assertion'ı askerî kanıt sayılmadı; sıkı ilk koşulun2/1 FAIL'i korunur. Pozitif koalisyon deneyinde düşmanın doğrudan anavatan komşuluğu yerine müttefik üzerinden iki basamaklı geçerli koridor kullanıldı; askerî AI'nın savunma mantığı değiştirilmedi.

## 4. #39: Yağmacı Federasyon ve gerçek AI kullanımı

Dördüncü `FED_TYPES.yagmaci`, mevcut kuruluş/rıza, oy rejimi, yasalar, üyelik ve aynı gündem yolunu kullanır.

| Kural | Gerçek motor etkisi |
|---|---|
| Askerî kapasite | +8; mevcut askerî türün+12'sinden düşük. |
| Filo bakımı | +6 yüzde puan; mevcut askerî tür+4. |
| Bilim | ×0.95. Sürekli ücretsiz gelir yok. |
| Başlangıç katkısı | Mevcut fon altyapısında%6; mevcut katkı yasaları değiştirebilir. |
| Savunma/saldırı | Varsayılan oylama; mevcut charter/oy/yükümlülük kuralları geçerli. |
| Gerçek fetih kazancı | Aktif cephede gerçek düşman kolonisinin fethinde düşman stokunun%5'i; koloni başına en çok120 maden/40 alaşım. Cephe ve fetheden üye başına toplam240/80 tavan. |
| Tekrarlama güvenliği | Aynı cephe+sistem+gezegen anahtarı ikinci ganimet üretmez. Sınırlı kayıt mevcut cephede `raidLoot`; Save8 yükleme/tekrar fetih testli. Sınırsız yeni ganimet motoru yok. |

AI, kendi gerçek profil/doktrin/çıkarı/bütçesine göre türü seçer; karşılıklı müttefiklerden gerçek kuruluş davetleri gönderir. İnsan adayın rızasını AI vermez. Reddedilen aday mevcut güncelleme yoluyla değiştirilebilir; yeni rızalar yeniden değerlendirilir. Hazır karar mevcut kanonik savaş kararıyla uygulanır. Riskli yeni saldırıda bilinen düşman/ortak güç ve maliyet kontrolü vardır; eski üç türün genel karar matematiği değiştirilmedi.

**18 aylık kontrollü seed23:** AI1 davet → gün960 federasyon1 `[1,3,4]` → gerçek askerî önerge ve oy → gün1320 cephe1/2/3 (`1–2`,`3–2`,`4–2`) → silahlı filolar gerçek başkent23 rotasına çıktı. Negatif500 korvet hedefinde gerçek aylık federasyon siyaseti zorla saldırı açmadı. Bu kontrollü pozitif/negatif deneydir; değiştirilmemiş yüzlerce seedde kuruluş sıklığı/uzun vadeli genel denge kanıtı değildir.

SP gerçek fare/dokunmayla dört viewport ve%80/%100/%125 ölçeklerde tür seçimi/AI rızası/final geçti. Ayrı MP koşusunda **misafir B gerçek Yağmacı türünü seçti**,5 davet/aday değişimi/güncel rızalar/tek final geçti: [MP tür sonucu](evidence/beta-fed-ai0/mp-raider-type/fedai0-ui.json). İki insan MP kuruluşu ve Save8 de ayrı çekirdek testte doğrulandı.

## 5. Kuruluş taslağını düzenleme ve rıza

Eski kurucu seçimi/davet/final yeniden yazılmadı. Yeni `fedFoundUpdate` aynı açık ID'yi ve **özgün150 günlük son tarihi** korur. Yalnız gerçek kurucu, güncel sürüm ve geçerli bekleyen süreç düzenleyebilir. Kadro/tür/oy rejimi maddi şarttır: önceki bütün rızalar geçmişte saklanır, kalan ortaklar güncel şartı yeniden onaylar. Değişmeyen aynı şart isteği reddedilir ve geçerli rızayı silmez.

En çok12 düzenleme; izinli bütün önceki12 sürümün kadro/yanıt geçmişi korunur. 13'üncü işlem ve süreyi uzatma reddedilir. Eski ret/kabul/ACK yeni sürüme uygulanmaz; kurucu implicit güncel önerme rızası dışındaki insanlar açık cevap verir. AI aynı stratejik değerlendirmeyi kullanır. Son final kadro arası savaş, bağımsızlık, mevcut federasyon ve kaynakları tekrar kontrol eder; ücret yalnız tek başarılı finalde kesilir.

Gerçek misafir UI: beş davet → dört kabul/bir kontrollü ret →5 çıkar/6 ekle → rev1 → H ve C yeni rıza → yalnız `[1,0,2,3,4,6]` → tek220 etki; eski1050 bitiş günü korunur. Çıkarılan5 otomatik üye değildir. Ret girdisi kontrollü fikstürdür; UI'nın ret vermiş AI'yı değiştirebilmesi sınanır. AI'nın kendi ret değerlendirmesi ayrı çekirdekte vardır.

Mirror yalnız yetkili katılımcıya projekte eder. Yeni aday önceki kadro/özel ret geçmişini alamaz; geçmiş yanıt nedenleri diğer üyelerde maskelenir. Eski kartlar sürüm anahtarıyla terminalleşir; yeni şart için ayrı gerçek rıza kartı gelir. [6/0 düzenleme](evidence/beta-fed-ai0/edit-history-final.log), [4/0 MP yetki/paket](evidence/beta-fed-ai0/mp-type-package-final.log).

## 6. #50 acil savunma: tek oy ve kontrollü öncelik

Mevcut12 toplam/3 kişi/360 gün FIFO ve tek aktif oy korunur. `defenseFront`, istemcinin seçtiği acil bayrak değildir: gerçek devam eden saldırı, üyenin savunma kaydı ve aynı savaş başlangıcından server üretir. En az bir üye hâlâ yasal biçimde yardım edebilmelidir. Zaten yerine gelmiş otomatik savunma ikinci oy açmaz; sonradan otomatik yasa geçmesiyle eski cephede henüz katılmamış üyelerin meşru yardım isteği yanlışlıkla silinmez.

Aktif oy kesilmez. Uygun acil savunma sıradan bekleyenlerin önüne geçer; aciller kendi içinde FIFO. Olağan öneri beklerken **en fazla iki acil açılıştan sonra en eski olağan** açılır. Öncelik ve sayaç Save8/mirror'da kalır. Ücret beklerken kesilmez; mevcut açılış kapısı/ücreti geçerlidir. Barış veya yeni cephe kimliği eski önergeyi geçersiz kılar; eski karar savaşı yeniden açmaz. Aynı kaynak için tekrar başvuru ve saldırı savaşını savunma diye etiketleme reddedilir.

AI gerçekten saldırıya uğrarsa aynı `proposeFedMotion` yoluna başvurur ve mevcut çıkar/bütçe değerlendirmesiyle oy verir. İnsan adına oy yok. Çekirdek5/0; H0/B1/C2 gerçek düğmeler, aktif yasa+iki normal+acil talep ve sonraki gerçek oy doğrulandı. Bu mekanik Galaktik Konsey #51'e bağlanmadı.

## 7. SP/MP, soğuk kayıt ve gizlilik

Gerçek yerel Chromium: H0/B1/C2; üç ayrı browser süreci. Soğuk deney45 sistem/8 gerçek AI/3 insan/seed11 (toplam11 normal devlet) kullanır. Her misafir π dönüşümüyle kendi devletini yerel0 görür; komutlar gerçek aktörü host'tan alır. Çekirdek güvenlik fikstürü ayrıca B1/C3/D4 kimliklerini kullanır; yalnız0 test edilmedi.

- Birleşik PC **8/0**: Konsey EVET/HAYIR, p15 görüş/sensör/can/event/rota/hareket, p18 koalisyon/karşı teklif/ödeme/üçüncü katılım, p17 koloni/uzaktan inşa, p16 FIFO/aday rızası/hız/tersane ve yeni işler aynı koşuda geçti.
- Soğuk **R0–R4 5/0**: 2 ay → gerçek IndexedDB kaydı → bütün browser/relay süreçleri kapalı → yeni relay ve yeni oda → aynı insan devletleri → güncel kuruluş geçmişi/rıza sürümü, acil kuyruk/vote/source ID ve AI hazırlık referansı aynı → gerçek insan rızası+tek final →6 ay daha senkron oyun.
- B/C mirror kanonik hash/rev eşitliği ve sızıntı kontrolleri geçti. Üçüncü kişi özel kuruluş geçmişi/AI destek teklifini görmedi. Bayat rıza, actor alanı taklidi, tekrar paket, tekrar final ve ikinci ödeme reddedildi.
- Tam M1 AI'nın başlattığı üç insanlı karşı teklif zinciri ve bağımsız AI'nın aldığı karşı teklifin bütün native rol/süre varyantları **NOT RUN**. Kanonik karşı teklif motoru p18 çekirdek ve WC0 native regresyonunda geçti; bu, eksik yeni rol matrisinin yerine sayılmaz.
- Yeni bağımsız AI'nın yalnız sponsor geçiş izniyle ulaşabildiği özel pozitif fırsat senaryosu ayrı koşul olarak **NOT RUN**. Kod mevcut gerçek geçiş maddesini kullanır; genel p18 erişim/karşı teklif regresyonu bunun bütün yeni AI matrisini kanıtlamaz. Soğuk koşuda AI hazırlık referansı korundu; kabul edilmiş ücretli AI sözleşmesi + bütün yeni siyasi durumların her birleşimi aynı soğuk senaryoda sınanmadı. Ücretli hazırlığın kayıt/tekrar güvenliği çekirdekte ayrıca testlidir.
- Tam MP8 N kampanyası yeniden çalıştırılmadı. WC0 yerel kesinti/geri bağlantı ve gerçek soğuk yeni oda testli. Karışık canlı p18/p19 istemci oturumu test edilmedi; roller aynı p19/MPb14 kaynağını kullanmalıdır.

## 8. Test komutları ve PASS / FAIL / NOT RUN

Bütün komutlar repo kökünde; browserlarda `STARS_CHROMIUM_PATH=/usr/bin/chromium`, çıktılar `reports/codex/evidence/beta-fed-ai0/` altındadır. Node geniş koşu29/29 paket exit0; ilk FAIL'ler ayrıca korunur.

| Son hedefli test | Gerçek komut | Sonuç / kanıt |
|---|---|---|
| Kuruluş düzenleme/tam12 geçmiş | `node tests/beta_fed_ai0_edit_test.cjs` | PASS6/0; `edit-history-final.log` |
| Bağımsız AI/ücret/rıza/rota/mahremiyet/savunma | `STARS_OUTPUT=.../coalition-final node tests/beta_fed_ai0_coalition_test.cjs` | PASS8/0; `coalition-final.log` |
| Yağmacı tür/AI/fetih/Save8 | `node tests/beta_fed_ai0_raider_test.cjs` | PASS4/0; `final-beta_fed_ai0_raider_test.log` |
| Acil savunma/fairness/AI/Save8 | `node tests/beta_fed_ai0_emergency_test.cjs` | PASS5/0; `final-beta_fed_ai0_emergency_test.log` |
| MP revizyon/yetki/gizlilik/yeni tür | `node tests/beta_fed_ai0_mp_test.cjs` | PASS4/0; `mp-type-package-final.log` |
| Gerçek18+8 aylık AI kampanyası | `STARS_OUTPUT=.../campaign-military-final node tests/beta_fed_ai0_campaign_test.cjs` | PASS3/0; `campaign-military-final.log` |
| Gerçek p18 ham Save8/RNG/paket | `STARS_CONTROL_ROOT=/tmp/stars-fed-ai0-p18 STARS_OUTPUT=.../equivalence-timing-final node tests/beta_fed_ai0_equivalence.cjs` | PASS6/0; `equivalence-timing-final.log`. Kontrol kökü verilmezse script gerçek git tabanını kendisi çıkarır. |
| Eski p13 ham Save8/RNG/paket | `node tests/beta_fed_found0_compat_test.js` | PASS6/0; `old-save-verified.log`. İlk dar tekrar `git EPERM` sandbox engeliydi; yetkili read-only tekrar geçti. |
| Birleşik PC | `MPP0_DESKTOP=1 FEDAI0=1 WAR_CENTER0=1 BOARD1=1 BOARD2=1 MPP0=1 MP73_ONLY='B1 \|B2 \|FAI0 \|WC0 \|P0 \|BD1 \|BD2 \|sayfa' node tests/browser-mp73.cjs` | PASS8/0; `mp-accepted-pc.log`, `mp-accepted-pc/mp73-results.json` |
| Misafir Yağmacı türünü gerçekten seçer | `MPP0_DESKTOP=1 FEDAI0=1 MP73_ONLY='B1 \|B2 \|FAI0 \|sayfa' node tests/browser-mp73.cjs` | PASS4/0; `mp-raider-type.log` |
| Soğuk yeni oda | `MP8_SCEN=R MP8_MONTHS=2 FEDAI0_R=1 node tests/browser-mp8.cjs` | PASS5/0; `cold-final.log`, `cold-final/R/fedai0-cold-result.json` |
| SP dört viewport/ölçek | `node tests/browser-beta-fed-ai0-sp.cjs` | PASS5/0; `sp-native/results.json`, PNG'ler |
| Ters rollü yatay mobil | `FEDAI0=1 FEDAI0_AUDIT=1 MPP0_REVERSE=1 MP73_ONLY='B1 \|B2 \|FAI0 \|sayfa' node tests/browser-mp73.cjs` | Son PASS4/0; `mp-touch-audit.log`. İlk3/1 **FAIL açık**, fiziksel Android değildir. |
| Paket | `python3 tools/package-release.py`; `--out /tmp/stars-fed-ai0-repeat.zip`; `python3 tools/verify-release.py` | PASS, iki ZIP birebir; CRC/manifest19 runtime. |
| Fiziksel PC/Android, LAN/internet/Render | Çalıştırılmadı | **NOT RUN** |

Başlıktaki `.../` yalnız ortak kanıt kökü kısaltmasıdır. Browserların tam çıktı/env komutları `browser-final.json` ve `cold-touch-final.json` içindedir. Markdown tablosundaki ayırıcı kaçışları shell argümanının parçası değildir.

### Geniş ilgili regresyon koşusunun her komutu

| Komut | Gerçek sonuç | Kanıt |
| `node tests/beta_fed_ai0_edit_test.cjs` | PASS (exit0, 4.45s) | [log](evidence/beta-fed-ai0/final-beta_fed_ai0_edit_test.log) |
| `node tests/beta_fed_ai0_coalition_test.cjs` | PASS (exit0, 3.89s) | [log](evidence/beta-fed-ai0/final-beta_fed_ai0_coalition_test.log) |
| `node tests/beta_fed_ai0_raider_test.cjs` | PASS (exit0, 4.31s) | [log](evidence/beta-fed-ai0/final-beta_fed_ai0_raider_test.log) |
| `node tests/beta_fed_ai0_emergency_test.cjs` | PASS (exit0, 7.94s) | [log](evidence/beta-fed-ai0/final-beta_fed_ai0_emergency_test.log) |
| `node tests/beta_fed_ai0_mp_test.cjs` | PASS (exit0, 3.38s) | [log](evidence/beta-fed-ai0/final-beta_fed_ai0_mp_test.log) |
| `node tests/beta_war_center0_test.cjs` | PASS (exit0, 4.93s) | [log](evidence/beta-fed-ai0/final-beta_war_center0_test.log) |
| `node tests/beta_war_center0_prepare_test.cjs` | PASS (exit0, 3.35s) | [log](evidence/beta-fed-ai0/final-beta_war_center0_prepare_test.log) |
| `node tests/beta_war_center0_mp_test.cjs` | PASS (exit0, 4.15s) | [log](evidence/beta-fed-ai0/final-beta_war_center0_mp_test.log) |
| `node tests/beta_war_center0_ai_test.cjs` | PASS (exit0, 3.8s) | [log](evidence/beta-fed-ai0/final-beta_war_center0_ai_test.log) |
| `node tests/beta_fed_found0_core_test.js` | PASS (exit0, 10.08s) | [log](evidence/beta-fed-ai0/final-beta_fed_found0_core_test.log) |
| `node tests/beta_fed_found0_mp_test.js` | PASS (exit0, 10.8s) | [log](evidence/beta-fed-ai0/final-beta_fed_found0_mp_test.log) |
| `node tests/beta_fed_found0_compat_test.js` | PASS (exit0, 16.64s) | [log](evidence/beta-fed-ai0/final-beta_fed_found0_compat_test.log) |
| `node tests/beta_board1_agenda_test.cjs` | PASS (exit0, 10.58s) | [log](evidence/beta-fed-ai0/final-beta_board1_agenda_test.log) |
| `node tests/beta_board1_critical_test.cjs` | PASS (exit0, 4.81s) | [log](evidence/beta-fed-ai0/final-beta_board1_critical_test.log) |
| `node tests/beta_war_fix0_test.cjs` | PASS (exit0, 12.19s) | [log](evidence/beta-fed-ai0/final-beta_war_fix0_test.log) |
| `node tests/mp73_council_test.js` | PASS (exit0, 31.73s) | [log](evidence/beta-fed-ai0/final-mp73_council_test.log) |
| `node tests/mp6_mirror_test.js` | PASS (exit0, 11.07s) | [log](evidence/beta-fed-ai0/final-mp6_mirror_test.log) |
| `node tests/mp64_spy_test.js` | PASS (exit0, 6.37s) | [log](evidence/beta-fed-ai0/final-mp64_spy_test.log) |
| `node tests/mp_p0_guest_test.cjs` | PASS (exit0, 4.01s) | [log](evidence/beta-fed-ai0/final-mp_p0_guest_test.log) |
| `node tests/mp_p0_decisions_test.cjs` | PASS (exit0, 3.12s) | [log](evidence/beta-fed-ai0/final-mp_p0_decisions_test.log) |
| `node tests/mp_p0_notice_test.cjs` | PASS (exit0, 1.19s) | [log](evidence/beta-fed-ai0/final-mp_p0_notice_test.log) |
| `node tests/mp_p0_motion_test.cjs` | PASS (exit0, 0.3s) | [log](evidence/beta-fed-ai0/final-mp_p0_motion_test.log) |
| `node tests/beta_board2_colony_test.cjs` | PASS (exit0, 5.07s) | [log](evidence/beta-fed-ai0/final-beta_board2_colony_test.log) |
| `node tests/beta_board2_remote_test.cjs` | PASS (exit0, 3.42s) | [log](evidence/beta-fed-ai0/final-beta_board2_remote_test.log) |
| `node tests/beta_board2_rebellion_test.cjs` | PASS (exit0, 2.27s) | [log](evidence/beta-fed-ai0/final-beta_board2_rebellion_test.log) |
| `node tests/mp75_war_test.js` | PASS (exit0, 3.61s) | [log](evidence/beta-fed-ai0/final-mp75_war_test.log) |
| `node tests/perf1_equivalence_test.js` | PASS (exit0, 3.79s) | [log](evidence/beta-fed-ai0/final-perf1_equivalence_test.log) |
| `node tests/perf2_equivalence_test.js` | PASS (exit0, 4.38s) | [log](evidence/beta-fed-ai0/final-perf2_equivalence_test.log) |
| `node tests/mp86_nebula_cache_test.js` | PASS (exit0, 3.53s) | [log](evidence/beta-fed-ai0/final-mp86_nebula_cache_test.log) |

İlk başarısız testlerin sınıflaması [kanıt README'sinde](evidence/beta-fed-ai0/README.md): gerçek p18 pause varsayımı; senaryolar arası modal; purifiye aday/eksik alan/kapalı details/eksik izinli istihbarat gibi test fikstürleri; yeni reply alan sırası; yeni stratejik taahhüt çakışması; ilk sıkı askerî koşuldaki meşru savunma önceliği. Sonraki PASS eski FAIL dosyasını değiştirmez.

## 9. Save8/RNG, performans ve riskler

Eski Save8 isim/ID/harita/ekonomi alanları yeniden üretilmedi. Yeni veri isteğe bağlı: düzenleme sürümü/geçmişi, mevcut stratejide hazırlık referansı, cephede sınırlı ganimet anahtarı, gündemde savunma source ID/sayacı. Eski kayıt bunlar yokken varsayılan eski yolu kullanır. Gerçek p18 ve p13 kontrollerinde seed11/23/42/99/404 ×3 ay **ham Save8 ve RNG birebir**. Yeni meşru diplomasi/oy/ödeme tetiklenen kampanyalar eski sonuçla eşitliğe zorlanmadı; alan silme/serbest normalizasyon yok. PERF kaynak pinleri tam hash+hunk geri dönüşüyle korunur.

Eski→yeni yükleme testlidir. Yağmacı içeren yeni p19 kaydını eski p18'de açma/geriye düşürme veya karışık canlı istemci uyumu iddia edilmez. Oyuncu kaydının üzerine otomatik dönüşüm yapılmadı.

Aynı p18 kontrol kökünün15 aylık örneğinde medyan tam ay simülasyonu: kontrol **70.7ms**, aday **67.5ms** (yerel cloud Node, fiziksel PC/Android ölçümü değildir). Yeni özellikli gerçek Chromium soğuk kampanyanın8. ayında host aylık tick medyan **97.3ms**, p95 **202.4ms**; yayın medyan **4.6ms**, p95 **9.9ms**; JS heap host **27MB**, B **16MB**, C **13MB**. MP paket **185488 byte**. Bunlar bu45 sistem/11 devlet koşulunun ölçümleridir; toplam RSS/FPS veya genel denge garantisi değildir. [Ham perf/senkron verisi](evidence/beta-fed-ai0/cold-final/R/mp8-R.json).

Savaş Merkezi kapalıyken yeni sürekli DOM taraması/dünya snapshot döngüsü eklenmedi. AI değerlendirmesi mevcut aylık akışta, mevcut sınırlı hafızada çalışır. Geniş500/1000 sistem/48 AI kampanyası bu fazda **NOT RUN**.

## 10. Değişen dosyalar ve paket

Kanonik kod/paket commit'indeki dosyalar:

- `RELEASE-MANIFEST.json`
- `ai.js`
- `diplomacy.js`
- `inbox.js`
- `main.js`
- `releases/stars-faz96h10p19.zip`
- `research/mp0/mp-core.js`
- `research/mp1/client/mp1-host.js`
- `research/mp1/client/view.js`
- `research/mp1/server/relay.js`
- `research/mp6/client/guest-stars.js`
- `research/mp6/mirror.js`
- `sw.js`
- `tests/beta_fed_ai0_campaign_test.cjs`
- `tests/beta_fed_ai0_coalition_test.cjs`
- `tests/beta_fed_ai0_edit_test.cjs`
- `tests/beta_fed_ai0_emergency_test.cjs`
- `tests/beta_fed_ai0_equivalence.cjs`
- `tests/beta_fed_ai0_mp_test.cjs`
- `tests/beta_fed_ai0_raider_test.cjs`
- `tests/browser-beta-fed-ai0-sp.cjs`
- `tests/browser-mp73.cjs`
- `tests/browser-mp8.cjs`
- `tests/helpers/beta-board1-browser.cjs`
- `tests/helpers/beta-fed-ai0-browser.cjs`
- `tests/helpers/beta-fed-ai0-input.cjs`
- `tests/helpers/beta-fed-ai0-preservation.cjs`
- `tests/helpers/beta-fed-ai0-resume.cjs`
- `tests/helpers/beta-fed-ai0-reviewed.json`
- `tests/helpers/beta-fed-ai0-world.cjs`
- `tests/helpers/beta-war-center0-browser.cjs`
- `tests/helpers/beta-war-center0-preservation.cjs`
- `ui.js`

Ana ürün farkı: `ai.js` mevcut stratejik/politik yollar; `diplomacy.js` tür, rıza sürümü, kaynaklı acil sıra ve sınırlı transfer; `main.js` gerçek fetih kancası/build; `ui.js` mevcut kuruluş/kuyruk yüzeyi; `inbox.js` bayat rıza; MP core/host/guest/mirror yalnız sıkı komut ve yetkili DTO. `map.js`, genel ekonomi/filo savaş motorları yeniden yazılmadı. Test yardımcıları ve tam pin dosyası yeni akışları/önceki korumayı kanıtlar.

- ZIP: [`releases/stars-faz96h10p19.zip`](../../releases/stars-faz96h10p19.zip) — **823384 byte**.
- SHA-256: **`501d4e27e2435402adf3b88ef43095d95946af9ca0278860bf7ea01bac220583`**.
- ZIP CRC32: **`76C91AB4`**; tüm20 üyenin CRC'si ayrıca kontrol edildi.
- [RELEASE-MANIFEST](../../RELEASE-MANIFEST.json):19 runtime; sabit tarih/izin/sıralı iki üretim byte eşit. [Tam paket ve dosya hashleri](evidence/beta-fed-ai0/release.json).
- Oyun ZIP'i MP relay/istemci dağıtımının yerine geçmez. `research/` kaynakları aynı kod commit'indedir; canlıya dağıtılmadı.

### Değişen runtime ve MP dosyalarının SHA-256 karşılaştırması

| Dosya | p18 SHA-256 | p19 SHA-256 |
|---|---|---|
| `ai.js` | `f75d2b961b7d996ddcc43e42f48aadaed0f87860dbeb7d37621b801a5d029c1e` | `6d0a7800f0423b95212a8dbaf70009b0da4514cc3959d83f21e89511e0046f5c` |
| `diplomacy.js` | `094704840a38ea2d1b277e7b56df81507410f3fe7e51ea82802392a1db50b6c5` | `3b813073136181fd82c94560618fb29355d59dbab28b3f6e95b6005048d8dd10` |
| `inbox.js` | `67acb5a714504e83708cc388c36e0995e425ee278930abff26c0939f71666208` | `77c15604629491740a3e9f256293165692a9e2c0d28f0e15ff384966be605cc7` |
| `main.js` | `d0a1814eda8df37c975d82d669a9afd43116347caf9d8542137e674ad8c73111` | `7550752f7c6bba96f031c346d8211861b3f9cc115038c49086f01a9147f33149` |
| `sw.js` | `cb0e882abefa87c2042bff80b61ae93ef4e025205ac037f75b12a917e084f64e` | `e39e93c15060fa5feba5caab5baad7becfc4c750b7b66173e5fb9b27718ee845` |
| `ui.js` | `e33323e11f09e38217b5f71759b27d5763e948ba6d855f2e6ec1af45d3f19db3` | `7889c7fdf3fbb7670ca16d1db02c84b1d342572669d7b79edc9b319f60f0e12b` |
| `research/mp0/mp-core.js` | `9f7dda832dd99363539b82b0083d91572d0d32e0bfec546ff688e0e75c265340` | `18c10a99c2b55bf045fff0628f65107cd279a4b842895388b7c24004b7a26dd6` |
| `research/mp6/mirror.js` | `e25752b9f7676b146c22bee9609a215f502506314c7a4b174b1d6f31d7bbf7e6` | `5b2c6ac008404e32ef9554ec45227f59c7b262fd9b864e0c2e9bda6c37aba122` |
| `research/mp6/client/guest-stars.js` | `8280dbfb1c0217883f1a642e3a1c1ba5fa56b6646dc41ab95fc3444ff5d0f065` | `67720177a25fa4c61d3dc40050fd87e4a3f7fb743157c63d55a681dcffa672ce` |
| `research/mp1/client/mp1-host.js` | `c51e44ae76f9814708b8456edb96b32ecbf1c6cbac7a630aa96464b5ebd08e88` | `58355968ecef766e4dfefd77bd4df42d2283386d86edd219a41df832fde87447` |
| `research/mp1/client/view.js` | `fabe5a036301637959cbab2ffda27ac6ba9714e449db25cb9bc42c5089f95be0` | `9f14cf54909dbd8246807520c3791a8d3b81fad7cdcbecf7a502f36a1be55637` |
| `research/mp1/server/relay.js` | `574b21b98728079db2b79397e8c059c371db105d5a0f13939f67bd177e85215a` | `c132430f96bb625426f26a00f5d09076f090fbe482db9a018d536f001d9811c9` |

## 11. Görev tablosu ve gerçek kabul durumu

| Görev | Önceki gerçek durum | Yeni kod | Test | PASS/FAIL/NOT RUN | Kullanıcı kabulü |
|---|---|---|---|---|---|
| P0 aralıklı dokunma | p18 iki birleşik FAIL | Kanıtlanan test kurulumları + tanı; rastgele ürün müdahalesi yok | PC8/0; ilk mobil3/1 sonra4/0 | **Aralıklı FAIL/kök AÇIK** | Bekliyor; TEST BEKLİYOR |
| Bağımsız AI koalisyon | İnsan hazırlık motoru vardı | Mevcut AI plan/CB/son ilan entegrasyonu | Mikro8/0 paketi +8 ay | PASS yerel motor/AI; tam native M1 matrisi NOT RUN | Bekliyor |
| AI ücretli fırsat | Yanıt vardı, bağımsız tarama yoktu | İzinli cephe/fiyat/rota/teklif hafızası | Gerçek AI→B native teklif/tek bedel/katılım | PASS; bağımsız karşı teklif tam rol matrisi NOT RUN | Bekliyor |
| #39 Yağmacı | Tür yoktu | Dördüncü tür/bedel/gerçek fetih/AI siyaset | Core4/0,18 ay, SP5/0, misafir tür seçimi4/0, MP/Save4/0 paketi | PASS yerel; uzun genel denge NOT RUN | Bekliyor |
| #11/#13 düzenleme uzantısı | Davet/kurucu/final vardı, değişim yoktu | Aynı ID/tarih,12 sürüm/rıza yenileme |6/0 + gerçek misafir + soğuk5/0 | PASS | Bekliyor |
| #50 acil uzantı | Tek oy/FIFO vardı | Kaynak cephe ve2 acil sonrası olağan öncelik |5/0 + üç insan + soğuk | PASS | Bekliyor |
| #44 | Genel ölçüm açık | Yalnız ölçülen yeni taahhüt/koruma çakışması | Kampanya ve savunma negatif kontrolü | Dar düzeltme PASS; genel görev NOT RUN | Genel görev AÇIK |
| #33 casusluk/#51/#30/#36/#32 tam matris | Eksik önceki işler | Geliştirilmedi | İlgili eski korumalar | Tam kapsam NOT RUN | AÇIK |
| #24/#25/#26 özgün vakalar | Kök bilinmiyor | Rastgele düzeltme yok | İlgili ekonomi/filo/savaş/konsey korumaları | Özgün vaka NOT RUN | AÇIK |

[Yerel envanter](BETA-FED-AI0-GOREV-ENVANTERI.md) kodlanan, yerel test ve kullanıcı kabulünü ayrı tutar. #33 API reddi nedeniyle resmi pano bu durumlara taşınmış **değildir**; diğer maddeler ve tarihçeleri değiştirilmedi. PR/yorum gerçek çıktıları: [GitHub sonuçları](evidence/beta-fed-ai0/github-actions.json).

## 12. Kullanıcının gerçek PC/Android kabulü ve sonraki öncelik

1. Arkadaşın host, sen katılımcı iken yeni Yağmacı türünü seç; beş kurucudan reddedeni çıkarıp başka aday ekle. Diğer insanın yeni şartı yeniden onaylaması ve ücretin yalnız finalde bir kez kesilmesi beklenir. Davet/ret/final düğmesinde timeout/tepki sorunu görülürse güncel Save8 ve ekranla P0 tanısı sürdürülmeli.
2. AI'nın gerçek destek teklifini aç; şartı/bedeli oku, önce reddet sonra koşullar değiştiğinde başka teklifi kabul et. Açık onaydan önce katılım/ödeme olmamalı; onayda gerçek cephe ve yalnız bir bedel olmalı. Savaş Merkezi ve gerçek askerî güzergâhı kontrol et; meşru anavatan savunması varsa AI gerekçesi ayrı değerlendirilir.
3. Aktif yasa ve iki normal bekleyen öneri varken dış saldırı sonrası savunma iste. Aktif oy kesilmemeli, uygun acil ilk boş oya gelmeli. Bekleyen rıza/AI planı/oyla kaydet, bütün cihazları kapatıp yeni odadan aynı devletlere dön; sıra/sürüm/ücret tekrarlanmamalı.

En yakın öncelik **aralıklı mobil/selfleet/dealSend P0'nun gerçek kullanıcı kaydıyla kesin teşhisi** ve yukarıdaki PC kabulüdür. Ardından bağımsız AI'nın tam M1/M2 insan karşı teklif/rol matrisleri ve normal kampanya dağılımı/denge ölçümü; daha sonra ayrı #33 casusluk UX ve #51 Konsey reformu. #30/#36 armalar bu faza eklenmedi.

Main merge, rebase/force-push, Render deploy/restart, canlı kayıt silme veya üzerine yazma **yapılmadı**. Fiziksel PC/Android, gerçek LAN/internet/Render **NOT RUN**. Sonuç otomatik yerel test teslimidir; kullanıcı tarafından onaylanmış sürüm değildir.
