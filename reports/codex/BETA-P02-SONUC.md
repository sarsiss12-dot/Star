# STARS — BETA-P0.2 sonuç raporu

**Sonuç: #3 ve #34 için yerel kabul ilerledi; tarihsel multiplayer dokunma timeout'unun kök nedeni bulunamadı. Genel beta/canlı yayın onayı verilmedi.** Son temiz tam MP73 üç insanlı B1–B4 dahil8/0. Konsey sonucunun kaybolması, misafirlere sonuç haberinin ulaşmaması ve yeni haberden geri dönüşün ayna güncellemesinde kaybolması düzeltildi. Önceki ve ara FAIL'ler saklandı.

## 1. Kaynak, HEAD ve GitHub teslimi

- Başlangıç/PR tabanı: `codex/stars-beta-p01-critical` @ **71b282ec2972b0872f207449d23006b88d1315f0**. Uzak HEAD beklentiyle aynı.
- Çalışma dalı: `codex/stars-beta-p02-mp-acceptance`.
- Doğrulanmış ürün/test bitiş HEAD'i: **d8c162914b3c7e460c70e50a8a7b80f789f18e3d** — [commit](https://github.com/sarsiss12-dot/Star/commit/d8c162914b3c7e460c70e50a8a7b80f789f18e3d). Push sonrası uzak dal bu SHA ile doğrulandı.
- Bu sonuç raporu sonraki dokümantasyon commit'indedir; kendi SHA'sını önceden yazmak için yeni commit zinciri üretilmez. Nihai teslim HEAD'i son sohbet mesajında ve uzak dalda doğrulanır.
- `main` @ `4296ad2d43fedce6264020b3761f50f1839fd836` daha eski geliştirmedir; başlangıç alınmadı, değiştirilmedi/merge edilmedi. Rebase/force-push yapılmadı.
- Önceki [taslak PR #34](https://github.com/sarsiss12-dot/Star/pull/34) P01 başı ve `codex/stars-beta0-stability` tabanıyla doğrulandı. Yeni P02 taslak PR doğru P01 tabanıyla **bir kez** denendi, **oluşturulamadı**: `Post "https://api.github.com/graphql": Forbidden`. [Özgün hata](evidence/beta-p02/pr-create.log).
- [P02 karşılaştırma / PR oluşturma bağlantısı](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-p01-critical...codex/stars-beta-p02-mp-acceptance?expand=1). PR varmış gibi gösterilmez.
- [Sonuç raporu](https://github.com/sarsiss12-dot/Star/blob/codex/stars-beta-p02-mp-acceptance/reports/codex/BETA-P02-SONUC.md), [kanıtlar](https://github.com/sarsiss12-dot/Star/tree/codex/stars-beta-p02-mp-acceptance/reports/codex/evidence/beta-p02).

AGENTS, GPT-DEVIR, CLAUDE, CODEX-SON-RAPOR, P01 raporu/kanıtları ve önceki MP73/MP89 dokunma tanıları esas alındı. Başarılı P01 panel/oy/barış/ambargo düzeltmeleri yeniden yazılmadı.

## 2. KATIL / mp6Conn: bulunanlar ve bulunamayan kök neden

**Tarihsel 8s `performing tap action` timeout'u açık.** Görünür/etkin/sabit düğme bilgisi, olayın yalnız Playwright/ortam veya yalnız ürün hatası olduğunu kanıtlamıyor. P01'in özgün KATIL mesajı ve önceki mp6Conn kaydı korundu.

İlk değiştirilmemiş hedefli A1/B1 **2/0**; normal CPU'da8 ilave gerçek mp6Conn dokunmasıyla **3/0**; 4× CPU'da4 ilave dokunmayla **3/0**; tam değiştirilmemiş P01 MP73 **8/0**. İzole statik/yenilenen DOM × üç ham/locator dokunma yöntemi ×12 =72 gerçek dokunma, **6/0**. Bunlar sorunu yeniden üretmedi; tahmini üretim düzeltmesi yapılmadı.

Node tarafındaki günlükler gezinmede kaybolmaz: gerçek hedef/hit-test, rect, DOM kimliği/bağlılık, pointer/touch/click, scroll/focus/modal/viewport/transform, eski-yeni düğme ömrü, script/JS hata, relay mesaj türü ve orijinal Playwright stack. Ham protokolde komut veya kimlik doğrulama içerikleri tutulmaz. Başarılı CPU4 koşusunda en uzun tap3750ms, Input yanıtı2744ms; bekleyen Input yok. Bunlar önceki başarısız koşunun kök nedeni değildir.

Playwright1.62.1 Chromium151 beklerken ortam Chromium155 kullanıyor; bu **fark/hipotez**, kanıtlanmış neden değil. `mp6Conn` iç span'ının yenilenmesi ve KATIL'in lobi açılırken kaldırılması gözlendi; başarılı işlemden sonraki DOM değişimi tek başına kusur sayılmadı. Playwright'ın paralel touchStart/touchEnd hipotezi kontrollü deneyde kanıtlanmadı.

**Kesin bulunan test kusurları:** Konsey kartı doğru olarak `diploPane` açarken `openCard` yalnız modal/gelen-kutusu kontrolü bekliyordu. İki çağıran bu timeout'u yutuyordu. Bekleme gerçek Konsey kontrolüne bağlandı, catch'ler kaldırıldı. Sürüm assertion'ı b3 sözleşmesine güncellendi. P04'ün açık bıraktığı modal sonraki eylemi gerçekten engelliyordu; yardımcı temizliği eklendi. P03 hız0 fikstürü A2'nin zaman ilerleme beklentisini bozduğundan tam MP73 bu özel fikstürlerden ayrı çalıştırıldı. Bunlar **özgün performing-tap timeout'u çözüldü** anlamına gelmez.

Ayrıntı: [DOKUNMA-TANI](evidence/beta-p02/DOKUNMA-TANI.md), [protokol özeti](evidence/beta-p02/touch-protocol-summary.json), [tekrar üretim](evidence/beta-p02/RUN-NOTES.md).

## 3. #3 — Konsey oylaması

**Eski durum → kök neden → değişiklik:**

- P01 tek/çift oy, token, ACK ve panel sahipliği korumaları yerinde. Tam üç insanlı kabul önce lobi engeli yüzünden tamamlanamıyordu; bu fazdaki temiz gerçek akış tamamlandı.
- Biten oylama `c.vote=null` ile siliniyordu; döküm kalmıyordu. Sonuç haberi `scope:player` ve host0 odaklıydı; diğer insan üyeler sonucu almayabiliyordu. Yeni kabul testi P01'de gerçek eksik sonuç nedeniyle13/1; son çekirdek14/0.
- Mevcut council nesnesinde **yalnız son** kamu oylaması `lastVote` saklanır: özgün yasa/hedef/opened, EVET/HAYIR, mevcut motorun hesapladığı ağırlıklar, kabul/ret, bitiş, süre dolması, uygulanan hedef ve haber anahtarı. Dinamik ambargoda oylanan hedef ile uygulanan hedef ayrıdır; mekanik değiştirilmedi.
- Sonuç haberi kamu duyurusu olarak yayımlanır. Ayna yalnız bu kamu alanlarını π ile numaralandırır. Rüşvet/şantaj yönü, gizli stok veya AI niyeti eklenmez. Panel kullanıcı isteğiyle açılınca SON OYLAMA görünür; başka paneli ele geçirmez.

**Gerçek üç insanlı kabul:** ayrı Chromium süreçleri ve insan devletleri; host844×390, B800×360, C915×412 dokunmatik. Temas/stok fikstürü ardından gerçek `foundCouncilByConvention/startCouncilVote`; doğal100. aya kadar uzun kampanya yapılmadı. B tek EVET, C HAYIR, host EVET; ağırlıklı mevcut çoğunluk sonucu üç cihazda aynı. İnsan adına AI oy yazmıyor. Gerçek ACK'nin UI tüketimi testte geciktirilince pending/pasif düğme görünür; ACK sonrası başka diplomasi paneli korunur. Tekrar oy reddi, üç cihazda aynı yasa/döküm/haber, C kopup dönünce aynı sonuç doğrulandı. Bu gecikme testi gerçek ağ gecikmesi ölçümü diye sunulmaz.

Native14/0 ayrıca eski token/yeni aynı yasa, üye olmayan/vasal yetkisi, insan oylarının AI tarafından doldurulmaması, mevcut24 ay sınırı sonunda sonuç, Save8 yeniden yükleme ve iki misafire kamu sonucu eşitliğini doğrular. Çoğunluk ağırlıkları oylama bitmeden mevcut kurallardan hesaplanıp sonuçla karşılaştırılır. Genel komut/karar kopma ve tam-bir-kez güvencesi ayrıca N senaryosunda sınandı; oy komutunun ACK paketini ağ katmanında özel olarak düşürüp tekrar oynatma ayrı Chromium senaryosu **NOT RUN**.

## 4. #34 — Haber ve savaş durumu

P01'in sabit `war-front:<id>` eşleştirmesi korunur. `war-end:<id>` barış haberi de **aynı bitmiş savaşın** SAVAŞ DURUMU panelini açar; daha yeni aynı devlet çiftine bağlanmaz.

Yeni salt okunur `warNewsReport(viewer,id)`, mevcut ledger'dan gözlemciye özel DTO üretir. Host/SP ve misafir aynı olay kimliğinde, kendi izinleriyle görür:

| Alan | Gerçek kaynak / sınır |
|---|---|
| Saldıran/savunan, bilinen ortaklar | Sabit cephe/kampanya rolleri. Destek cephesinde ters roller doğru gösterilir. Temas tek başına gizli üçüncü savaş ortaklığını açmaz. |
| Başlangıç, aktif/bitiş, neden ve aktör | Mevcut ledger; eski/legacy kesin tarihi bilinmiyorsa açıklanır. P01 bitiş nedeni/aktörü korunur. |
| Savaş yorgunluğu | Aktif savaşta kendi veya mevcut seviye3 izinli değer. Geçmiş değer kaydedilmediyse BİLİNMİYOR. |
| Askerî güç | Kendi mevcut filo gücü veya oyuncunun mevcut, tarihli ve en fazla720 günlük güç gözlemi; yabancının tam gizli filosu okunmaz. Bitmiş savaşta güç BİLİNMİYOR. |
| Gemi kaybı | Kendi ledger kaybı; karşı taraf için yalnız oyuncunun imha ettiği kayıtlı gemiler, bunun toplam kayıp olmadığı açık. |
| Filo kaybı | Ayrı tarihsel sayaç yok: BİLİNMİYOR, gemi sayısı filo sayısı gibi gösterilmez. |
| Hedefler | Kayıtlı kendi hedefleri; hedef sistemler keşif süzgecinden geçer. Karşı tarafın özel hedefleri aktarılmaz. |
| Aktif cephe / ilerleme | İzinli kampanya cepheleri ve bilinen sistemlerde kayıtlı ele geçirmeler. Gizli filo konumu veya uydurma cephe çizgisi yok. |

Veri tarihi gösterilir. Ayna ham ledger, hasar defteri, kaynak stokları veya gizli filoları almaz. Salt okuma sorgusundan önce/sonra **doğrudan Save8 metni ve RNG aynı**; alan silme/normalizasyon/serializer gevşetme yapılmadı. Yeni kayıtlarda mevcut ledger zaten tarih/hedef/kayıp/işgal sakladığından büyük bir savaş geçmişi sistemi eklenmedi. Geçmiş güç/yorgunluk anlık görüntüleri ve filo kayıp sayacı için yeni kalıcı veri bu fazda eklenmedi.

Konsey, federasyon, diplomatik/siyasi, koloni, bölge/gezegen ve inşa olayları kendi tarihli/kimlikli güvenli ayrıntısını gösterir. Uygun güncel Konsey veya **aynı kendi federasyonu** için açık bağlam düğmesi vardır; yabancı federasyon haberi yanlışlıkla kendi federasyon paneline yönlendirilmez. Mevcut teklif kararları Gelen Kutusu'nda, izinli konumlar haritada açılır. Kalıcı filo/teklif hedef kimliği tutulmamış eski haberden güncel nesne tahmin edilmez; güvenli tarihsel metin görünümü kullanılır. Her eski olay için kaydedilmemiş zengin ayrıntı tamamlandı iddiası yok.

**Yeni geri dönüş kusuru da yakalandı ve düzeltildi:** misafirin ayna deserialize'ı `G.emps` dizisini yenileyince eski diziye bağlı haber geri düğmesi kayboldu. Gerçek MP73 7/1 ve native0/3 önce; oda+oyuncu+haber id/key kapsamı, farklı oda/oyuncu ve id tekrar kullanımı denetimiyle native3/0 sonra. Son MP73'te host/B/C gerçek Haber→Konsey→aynı haber dokunmaları geçti. Bu tercih bellekte yerel UI referansıdır; Save8/ağ paketine yazılmaz. Misafir `newsContext/newsReturn` yalnız yerel görüntü eylemleridir.

## 5. Gerçek test sonuçları

Tüm Chromium koşuları sırayla. Node24.22.1, Playwright1.62.1, Chromium155.0.8059.79. Yerel üretim relay + TLS/bağlantı vekili kullanıldı. [Tarayıcı özeti](evidence/beta-p02/browser-acceptance-summary.json), [native özeti](evidence/beta-p02/native-final-results.json).

| Test | PASS / FAIL | Kanıt |
|---|---:|---|
| Son temiz tam MP73, üç insan B1–B4 + haber dönüşü | **8/0** | [log](evidence/beta-p02/mp73-acceptance.log), [JSON/3 cihaz sonucu](evidence/beta-p02/mp73-acceptance/mp73-results.json) |
| Son ayrı P01 regresyonu: A1, host/misafir panel sahipliği, P03, P04 | **4/0** | [log](evidence/beta-p02/p01-acceptance.log) |
| SP Konsey öncesi/sonrası/Save8 yükleme panel geçişi | **3/0** | [log](evidence/beta-p02/panels-final.log) |
| SP savaş/eski-yeni/legacy/barış ve diğer haber dokunmaları | **1/0**, içinde10 olay | [log](evidence/beta-p02/news-acceptance.log), [görüntüler/sonuç](evidence/beta-p02/news-acceptance/results.json) |
| MP75 diplomasi/bildirim/savaş | **6/0** | [log](evidence/beta-p02/mp75-final.log) |
| MP8 N kopma/geri bağlanma, sessiz soket, tekrar karar, host/relay | **9/0** | [log](evidence/beta-p02/mp8-N-final.log) |
| MP8 R0–R4 + misafir UI Scale | **6/0** | [log](evidence/beta-p02/mp8-R-final.log) |
| Konsey çekirdeği / P01 oy regresyonu | **14/0**, **3/0** | [çekirdek](evidence/beta-p02/council-final.log), [oy](evidence/beta-p02/reg-beta_p01_ballot_test.js.log) |
| #4 savaş bitişi / #21 insan-AI ambargo | **5/0**, **5/0** | [barış](evidence/beta-p02/reg-beta_p01_war_end_test.js.log), [ambargo](evidence/beta-p02/reg-beta_p01_embargo_test.js.log) |
| Haber gizliliği/kimliği / geri dönüş / eski haber / ayna | **8/0**, **3/0**, **4/0**, **3/0** | [gizlilik](evidence/beta-p02/news-security-last.log), [dönüş](evidence/beta-p02/news-return-after.log), [eski haber](evidence/beta-p02/news-p01-last.log), [ayna](evidence/beta-p02/mirror-final.log) |
| MP64 haber/ayna salt okuma | **4/0** | [log](evidence/beta-p02/mp64-news-final.log) |
| p6/p7 uyumluluk / Save8 sınırları / MP4 kayıt çekirdeği | **4/0**, **19/0**, **14/0** | [uyumluluk](evidence/beta-p02/compat-final.log), [sınırlar](evidence/beta-p02/save-boundary-final.log), [MP4](evidence/beta-p02/mp4-core-final.log) |
| PERF1 / PERF2 / MP86 native piksel önbelleği | **4/0**, **5/0**, **3/0** | [PERF1](evidence/beta-p02/reg-perf1_equivalence_test.js.log), [PERF2](evidence/beta-p02/reg-perf2_equivalence_test.js.log), [piksel](evidence/beta-p02/reg-mp86_nebula_cache_test.js.log) |
| Sıkı kaynak koruması, onaylı P02/P01 değişikliklerinin SHA ile geri karşılaştırması | **PASS** | [log](evidence/beta-p02/source-integrity-release.log) |
| Fiziksel Android / gerçek LAN-Wi-Fi / canlı Render-internet | **NOT RUN** | Chromium emülasyonu fiziksel cihaz başarısı değildir. |
| Yeni ayrı Chromium piksel karşılaştırma kampanyası / Docker image build | **NOT RUN** | Harita/sanat değişmedi; native piksel ve Docker COPY/allowlist incelemesi yapıldı. |

R testinde3 insan+5AI, seed11, orta galaksi; ilk6 ay, gerçek IndexedDB kaydı, tüm tarayıcı/relay süreçlerini kapatma, yeni süreç/oda ile aynı devletler, tam teklif/savaş/federasyon/vasallık kayıtları, bekleyen teklifin bir kez kabulü ve6 ay daha senkron oyun doğrulandı. UI Scale %80/100/125 misafirde yerel kaldı, host/C/RNG değişmedi.

N/R ve MP75 son yerel haber geri referansı düzeltmesinden önce tamamlandı; sonrasında motor/komut/ayna DTO değişmedi. Bu son UI farkı native0/3→3/0 ve temiz tam MP73'te ayrıca sınandı; ağır N/R kampanyaları gereksiz tekrarlanmadı. Son P01 özel regresyonu ve SP haber koşusu son kodla yeniden çalıştı.

## 6. FAIL geçmişi — PASS ile silinmedi

- [İlk birleşik MP73](evidence/beta-p02/mp73-combined-first-fail.log): **7 PASS/4 FAIL**. Eski sürüm assertion'ı, P04 modalının A2'yi engellemesi, C Konsey paneli bekleme ve B3 bağımlı hata. İlk C bekleme hatasının kesin nedeni açık; o an oy/DOM dump'ı yoktu. Sonraki hatalara bu dump'lar eklendi.
- [P01 fikstürleriyle birleşik MP73](evidence/beta-p02/mp73-final.log): **10/1**, A2 zaman ilerleme; P03'ün hız0 fikstürü. Temiz tam MP73 ayrı çalıştırıldı; zaman assertion'ı gevşetilmedi.
- [Yeni haber geri dönüşünün ilk gerçek MP koşusu](evidence/beta-p02/mp73-clean-final.log): **7/1**, misafir geri düğmesi yok. [Önce0/3](evidence/beta-p02/news-return-before.log) → [sonra3/0](evidence/beta-p02/news-return-after.log) ve son tam8/0.
- Yeni Konsey testinin ilk taslağı `MP.local` sonucunu yanlış alanla okudu; sonra gerçek eksik `lastVote` için13/1 oluştu. İlk haber testindeki `res` alt-dizesi `progress` sözcüğüne takıldı; JSON anahtarı olarak düzeltildi. Yeni ayna beyaz listesinin alfabetik sırası ilk2/1'e yol açtı. Kaynak koruma testinin ilk `git show` child-spawn'ı EPERM; izinli salt okunur tekrar geçti. Bunlar [RUN-NOTES](evidence/beta-p02/RUN-NOTES.md) ve özgün günlüklerde sınıflandırılır.

Hiçbir FAIL silinmedi veya PASS'a çevrilmedi. Timeout artırma, `force:true`, sahte JavaScript click, doğrudan oy komutuyla gerçek düğme kabulünü atlama yapılmadı. Testte gezinme/fikstür için sayfa işlevleri kullanıldığı yerler gerçek karar dokunması diye sunulmaz.

## 7. Save8 / RNG / sürüm / paket

- **Save8 v8, MP paket sürümü4, protokol1** korunur. Top-level yeni kayıt alanı/format göçü yok. Eski council nesnesinde `lastVote` olmayan kayıtlar yüklenir; sonuç bilinmiyorsa uydurulmaz.
- Mevcut council içinde tek isteğe bağlı kamu sonuç kaydı kalıcıdır; kabul örneğinde268 byte, sınırsız tarihçe yok. Bu yeni metadata ve düzeltilmiş haberler nedeniyle **bütün dünyalarda P01 ile Save8 bayt eşitliği iddia edilmez**. Yeni alan karar/AI/RNG girdisi değildir. Salt haber sorgusunda Save8 metni/RNG doğrudan aynıdır; kabul edilen/ret oy motoru kuralları değişmedi.
- P6 uyumluluğu korunup p7 için dar build kapısı eklendi; eski p5 veya bozuk bütünlük kabul edilmez. Gerçek p7 snapshot kontrol kodundan üretildi; yapay build etiketi değiştirilmedi. Eski oyuncu kayıtları silinmedi.
- Oyun **96h10p8**, PWA **stars-v96h10p8**, multiplayer **MP.8.9b3**. [Yerel endpoint/UI/dosya hash sözleşmesi](evidence/beta-p02/version-contract.json) PASS;8 yayımlanan MP hash'i son çalışma dosyalarıyla eşleşti.
- Deterministik [ZIP](../../releases/stars-faz96h10p8.zip): **781167 byte**,20 üye,19 runtime + manifest. İki üretim bayt bayt aynı, tüm üye CRC/SHA kontrolleri PASS.
- ZIP SHA-256: **da0bb94e3d3e3380a5f9468c70f0c7eb4065b4964024d22e961414682c8a0849**.
- ZIP CRC32: **ffe3b217**.
- RELEASE-MANIFEST SHA-256: **26c4a78f1fb486517210df8a3fe63c99d96b94d6bb6d159706fad9771720f17a**.
- [RELEASE-VERIFIED.json](evidence/beta-p02/RELEASE-VERIFIED.json) son paket için esas; önceki `package-*` aday metadataları son ZIP değildir. [MP-RELEASE-HASHES](evidence/beta-p02/MP-RELEASE-HASHES.json) ayrı MP dosyalarını tanımlar. Yeni modül yolu eklenmedi; Docker COPY ve relay allowlist mevcut dosyaları kapsıyor. Container build/deploy/Render restart yapılmadı.

## 8. Değiştirilen dosyalar ve risk

- `diplomacy.js`: son kamu oyu metadata/haberi, salt okunur savaş DTO'su. Oy ağırlığı/AI stratejisi/ekonomi/savaş denklemi/barış kuralı/ambargo otomasyonu değiştirilmedi.
- `archive-ui.js`, `ui.js`: doğru savaş/barış ayrıntısı, izinli özet, güncel bağlam ve güvenli haber dönüşü, son oy görünümü. P01 yüzey sahipliği korunur. En önemli regresyon riski asenkron ayna sırasında UI referansıydı; gerçek FAIL→fix→PASS kanıtlandı.
- `research/mp6/mirror.js`: dar, filtreli ve remap edilmiş DTO/kamu sonucu. `research/mp6/client/guest-stars.js`: yalnız iki yerel haber gezinme eylemi.
- `research/mp0/mp-core.js`: p7→p8 paket uyumluluk kapısı. `research/mp1/client/view.js`, `research/mp1/server/relay.js`: MP sürüm işareti.
- `main.js`, `sw.js`, `RELEASE-MANIFEST.json`: build/PWA/hash. AI, ekonomi, savaş algoritması, federasyon/Yağmacı Federasyonu, koloni otomasyonu ve harita tasarımı değiştirilmedi.
- Testler: MP73 kayıpsız tanı ve gerçek başarı koşulu; Konsey/native/uyumluluk/gizlilik/geri dönüş; mevcut haber/panel yardımcısı; sıkı kaynak pinleri. Pin adaptörü **kaynak koduna** SHA/hunk doğrulaması uygular, Save8 alanı silmez/normalize etmez.
- Kanıtlar/ZIP ve bu rapor, CODEX-SON-RAPOR/CLAUDE devir notu güncellendi.

## 9. GitHub #33 — doğrulanmış gerçek durum

Başlangıçta39 görev vardı. Bitişte herkese açık pano **40 görev**: dışarıdan #40 koalisyon/pazarlık konusu eklenmiş, #8 açıklaması genişletilmiş. Mevcut görevlerin **durumları değişmemiş**. Bu faz onları geliştirmedi veya silmedi. Başlangıç/bitiş gövde SHA'ları ve farklar [son pano kanıtında](evidence/beta-p02/issue33-status-end.json).

| Pano ID | GitHub'daki gerçek son durum | Bu teslimin değerlendirmesi |
|---|---|---|
| #1 | KULLANICI ONAYI BEKLİYOR | Korundu; son host/misafir/SP panel regresyonları PASS. |
| #3 | TEST BEKLİYOR | Üç insanlı yerel oy kabulü PASS. Tarihsel dokunma timeout kökü açık olduğundan bu teknik risk kapanmadan tam güvenilirlik onayı önerilmiyor. |
| #4 | KULLANICI ONAYI BEKLİYOR | Korundu; meşru yorgunluk barışı ve insan kriz koruması5/0 + MP P04 PASS. |
| #21 | KULLANICI ONAYI BEKLİYOR | Korundu; insan kişisel ambargo koruması5/0 + MP P04 PASS. |
| #34 | TEST BEKLİYOR | Yerel yeni haber/geri dönüş/gizlilik kabulü geçti; sınırlarıyla kullanıcı onayına sunulmaya uygun aday. API nedeniyle durum değiştirilmedi. |

Başlangıç geliştirme kaydı ve bitiş **ek yorum** denemeleri GitHub GraphQL **Forbidden** verdi. Gövdeyi topluca değiştirme, geçmişi silme veya güvenlik kısıtlamasını aşma yapılmadı. [Başlangıç hata](evidence/beta-p02/issue33-comment.log), [son hata](evidence/beta-p02/issue33-result-comment.log), [kaydedilemeyen yorum metni](evidence/beta-p02/ISSUE33-SONUC-YORUMU.md). Bu metin eski39 satırı referans alıyordu; güncel40 sayımı ayrıca yukarıda açıklandı. Ajan hiçbir görevi TAMAMLANDI yapmadı; kullanıcı onayı yok.

Önceki tam gövde değiştirme girişimi, mevcut pano içeriğini silme riski nedeniyle otomatik onay incelemesinde reddedilmişti. Bu fazda kullanılan güvenli ek yorum yolu da yukarıdaki GitHub API Forbidden hatasıyla engellendi; rapor ve yorum metni geliştirme dalında teslim edildi.

## 10. Açık sınırlar ve sonraki tek öncelik

1. **P0 açık:** tarihsel KATIL/mp6Conn performing-tap timeout'u ve ilk ara C panel bekleme hatası kesin köke bağlanamadı. Son PASS'ler kararlılık kanıtını artırır, hatayı kapanmış saydırmaz. Üretim dokunma koduna tahmini değişiklik yapılmadı.
2. Gerçek Android/LAN/internet ve canlı Render **NOT RUN**. Bu fazın Chromium dokunma/CPU benzetimi gerçek cihaz kabulü değildir. Kullanıcı onaylı sürümde host+B+C üç cihazla lobi, tek EVET/HAYIR, sonuç, bağlantı kesilmesi, haber/savaş ve aynı olaya dönüş manuel kontrolü bekler.
3. Eski güç/yorgunluk, toplam yabancı kayıplar/filo kayıp sayacı ve kalıcı hedef kimliği bulunmayan tarihsel haberler tamamlanmış veri değildir; güvenli BİLİNMİYOR/olay metni sınırı sürer. Tam oylama arşivi yerine yalnız son oy dökümü vardır.
4. Oy ACK'sini ağ katmanında özel düşürme senaryosu ayrıca yapılmadı; genel karar kopması N'de, oy bekleme/tam-bir-kez/token kuralları ayrı testlerde doğrulandı.
5. PR ve #33 yazımı engelli; kod/kanıt/rapor dalda teslim edilir, merge/deploy yapılmaz.

**Sonraki tek faz:** yeni özellik eklemeden, kullanıcıda gerçekten hata veren lobi/dokunma akışının aynı sürüm ve olay kaydıyla hedefli güvenilirlik kabulü. Önce fiziksel üç cihazdan hata anı + UI/bağlantı tanısı alınmalı; yeniden üretim bulunursa aynı noktada protokol/hit-target beklemesi ayrıştırılmalı. Kök kanıtlanmadan genel dokunma yöntemi, timeout veya oyun mimarisi değiştirilmeyecek.
