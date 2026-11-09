# STARS — BETA-WAR-CENTER.0 sonuç raporu

## 1. Kaynak, kapsam ve teslim

Başlangıç dalı `codex/stars-beta-board2-colony-politics-ux`; uzak HEAD **`10ab6f9c7f4d030f3df055f1b2c326f499e2f0b0`** doğrulandı. p17 kod/paket commit’i `f14955e689182f375184cba001aa82334fc0f126`, ZIP SHA-256 `4662f75800dfeba5d36d90a8ff45b42416a2bb96bbee4892dab5f91bb8b2b377`. Main kaynak alınmadı. Çalışma dalı **`codex/stars-beta-war-center0-coalitions`**, PR tabanı p17 dalıdır.

Kod/test/paket bitiş HEAD’i **`5e5f26bf119b6fa9f12fe94d32d11177d04d80de`**; [commit](https://github.com/sarsiss12-dot/Star/commit/5e5f26bf119b6fa9f12fe94d32d11177d04d80de). Push başarılı ve uzak SHA birebir doğrulandı ([uzak kanıt](evidence/beta-war-center0/github-code-head.log)). Rapor/kanıt son HEAD’i uzak çalışma dalında ve son teslim mesajında verilir.

Sürüm **96h10p18 / stars-v96h10p18 / MP.8.9b13**. Save8 v8, MP paket4, protokol1 korunur. Yeni komut/madde için host ve istemciler aynı p18 zincirini kullanmalıdır. Eski Save8 veya kullanıcı dosyaları üzerine otomatik dönüşüm yapılmadı. Main merge, rebase/force-push, Render bağlantısı/deploy/restart ve izin değişikliği yapılmadı. Bu geliştirici teslimidir; kullanıcı kabulü değildir.

## 2. Gerçek görev envanteri

Pano #33 API’den okunamadı. Dolayısıyla “önceki durum” kod/test incelemesidir; GitHub’daki güncel etiket iddiası değildir. Aşağıdaki son durumlar yerel öneridir. Hiçbir görev TAMAMLANDI değildir.

| Görev ID | Önceki kod durumu | Bu fazdaki değişiklik | Test kanıtı | Gerçek yeni durum |
|---|---|---|---|---|
| #49 | Aktif savaş listesi ve sabit ID’li arşiv ayrıntısı vardı | Benim/Bilinen/Geçmiş sekmeleri, ortak savaş ayrıntısı, teklif ve barış girişleri, kaynak cepheye bağlı destek eylemleri; açık panelin canlı ve kararlı güncellenmesi | SP/MP UI, geçmiş ID, gizlilik ve yeniden açma | Yerel kabul; kullanıcı testi bekliyor. Bilinmeyen tarihsel alanlar uydurulmaz |
| #16 | Genel SP `warOn` sözü; koşullu savaş öncesi toplu onay yoktu | Aynı savaş defterinde sınırlı hazırlık; mevcut teklif/karşı teklif ile imzalı koşullu taahhüt; son ilan ve tüm ödemelerin atomik uygulanması | Hazırlık motoru, iki karşı tur, gerçek B/C dokunma, soğuk kayıt | İnsan akışı geliştirildi. AI’nın kendiliğinden yeni savaş öncesi hazırlık başlatması uygulanmadı |
| #31 | Basit ilan/önizleme vardı; isteğe bağlı davet listesi yoktu | Önizlemede seçilenlere ilan sonrası gerçek gönüllü katılım teklifi; ret ana savaşı geri almaz | Native seçim, ilan, C’nin reddi ve host savaş durumu | Yerel kabul; fiziksel PC/Android bekliyor |
| #40 | Kaynak, geçiş, karşı teklif ve atomik executeDeal zaten vardı; MP savaş maddesi yoktu | Sabit cephe/hazırlık kimlikli `warJoin`; kaynak+mevcut geçiş maddeleriyle aynı motor; çoklu ödeme bütçesi ve rollback | Gerçek ödeme/geçiş, tekrar, iki karşı tur, hata enjeksiyonu | Desteklenen kaynak ve geçiş kapsamı geliştirildi. Garanti zafer/toprak/ayrı avans/savaş sonunda otomatik erişim iptali yok |
| #43 | Ortak AI filo görevi vardı; belirli savaşa insan gönüllü katılım müzakeresi yoktu | Bilinen tarafı seç → mevcut müzakere → diğer tarafın kabulü → aynı seferde yeni gerçek cephe | Native misafir→host teklif/kabul; yetki ve eski cephe reddi | Yerel kabul; gerçek ağ/cihaz testi bekliyor |
| #32 | İnsan ittifak gönder/kabul motoru mevcut | Yeni ittifak motoru yazılmadı; mevcut ret/karşı/geri çekme/tekrar yolları regresyonda korundu | MP3 ve MP74; yeni savaş karşı teklifleri | Bütün eski ittifak rol/süre matrisi bu fazda tamamlanmadı; TEST BEKLİYOR |
| #44 | Önceki geniş AI vasallık ölçümü eksik | Yeni katılımda mevcut vasallık/savaş kapıları; sınırlı çakışma testi. Genel vasallık stratejisi değiştirilmedi | AI/katılım testleri; yeni geniş teklif oranı kampanyası NOT RUN | Kısmi inceleme; AÇIK |
| #26 | Özgün Konsey yasağı spamı yeniden üretilememişti | Yeni katılım Konsey kapısından geçer; kanıtsız genel bildirim bastırma eklenmedi | Mevcut Konsey ve savaş regresyonları | Özgün vaka AÇIK |

p15 görünürlük/sensör/can/özel olay/rota/interpolasyon; p16 federasyon kuyruğu/üyelik/hız/tersane; p17 koloni/kuşatma/isyan/uzaktan inşa/gizli aktör filtresi bu fazın yeni geliştirmesi sayılmaz. #24 özgün enerji sapması ve #25 yaklaşık100K filo kaybı çözülmüş değildir. #51, #39 ve yeni arma sistemleri kapsam dışıdır.

## 3. Tek savaş ve tek anlaşma kaynağı

Gerçek savaşın tek kaydı mevcut **warLedger.fronts**: cephe ID, campaign, parent, sides/roles, sponsor ve entryKind. Yeni katılım `declareWar` yolunu kullanır; ayrı savaş simülasyonu veya bağımsız koalisyon savaş defteri yoktur.

Yeni `warJoin` maddesi iki biçimlidir: `{t:'warJoin',front,target}` aktif ve değişmez kaynak cepheye; `{t:'warJoin',plan,target}` savaş öncesi hazırlığa bağlanır. İkisi aynı maddede birden bulunamaz. Codec, teklif imzası, MP beyaz listesi ve paket doğrulaması bu alanları korur. Yeni kaynak cephenin bitmesi veya taraf değişikliği eski teklifi uygulanamaz yapar; aynı iki devletin sonraki savaşı eski ID’yi canlandırmaz. Genel eski SP `warOn` anlamı ve eski kayıtları yeniden yazılmadı; yeni destek yolları `warJoin` kullanır.

Teklif/karşı teklif/ret/geri çekme mevcut gelen kutusu ve MP diplomasi deposundadır. Kabul edilmiş koşullu sözleşmenin yürütme taahhüdü, aynı defterin **yalnız kullanıldığında eklenen `preparations`** bölümündedir. Bu bir ikinci teklif kuyruğu değildir: müzakere geçmişi eski depoda, ilanı bekleyen imzalı şart tek yürütme kaydında, gerçek cephe fronts içindedir.

## 4. Savaş Merkezi

Üst durum düğmesi → gerçek seçim listesi → Savaş Merkezi; savaş yokken de hazırlıklara erişilir. Mevcut arşiv ayrıntısı yeniden kullanılır. Üç sekme vardır. Özel korsan/kriz savaşında normal defter kaydı yoksa mevcut aktif düşman listesi güvenli “cephe ayrıntısı bilinmiyor” satırını gösterir; bu taraflara normal diplomatik destek sözleşmesi kurulmaz.

Ayrıntıda izinli taraf/rol, çağıran ve katılım nedeni, başlangıç/bitiş, bitiş nedeni/aktörü, bilinen katılımcılar, kendi hedefleri, izinli güç/yorgunluk/kayıp ve gözlenen cephe/ilerleme gösterilir. Liste kartları kompakt taraf/ID/tarih özetidir; ayrıntılı hedef, kayıp, katılım ve diplomasi alanları ayrıntı ekranındadır. Bütün ayrıntıların her liste kartında ayrı satır olması uygulanmadı. Arşivde tutulmayan eski güç, filo kaybı veya kesin tarihler BİLİNMİYOR kalır. Barış/statüko için mevcut diplomasi, teklif geçmişi için mevcut gelen kutusu açılır. Seçili eski cephe yeni savaşla değiştirilmez.

Misafir tam warLedger almaz. `warCenterRead` salt-okunur komutu izleyiciye göre DTO döndürür; yalnız görünüm açıkken sorgulanır. Kapalı veya gizlenmiş modalda periyodik sorgu yoktur. Son savaş onayı sırasında mevcut modal koruması sürer; salt-okunur görünümde canlı ayna ilerler. Anlaşma taslağı ve dünya sahipliği G.p geçici değiştirilerek uygulanmaz.

## 5. Savaş öncesi koşullu taahhüt

Hedef/amaç → ÖNCE KOALİSYON HAZIRLA → aday seç → mevcut anlaşma masasında kaynak/geçiş öner → karşı teklifler → kabul → Savaş Merkezi’nde SON SAVAŞ ONAYI.

Kabul aşamasında hiçbir savaş, kaynak ödeme veya geçiş izni uygulanmaz. Kaynak rezerve edilmez. Sahip, hedef ve amaç sabittir; maddi değişiklik için iptal/yeni müzakere gerekir. Kabul geri çekilebilir, sahibi hazırlığı iptal edebilir. Hazırlık 180 oyun günü geçerlidir; en fazla16 açık/64 toplam hazırlık ve hazırlık başına8 taahhüt vardır. İnsanlar adına AI karar vermez.

Son onayda mevcut warDeclarationPreview, bütün anlaşma quote’ları, toplam kaynak yükü ve aynı şart damgası tekrar denetlenir. Örneğin tek başına karşılanabilen iki3000maden sözü, toplam stok5000 ise savaşı başlatmaz. Kaynak veya diplomatik şart son anda değişirse ücret kesilmez. İlan, hedef bedeli, bütün katılımlar ve kaynak/izin etkileri aynı mevcut geri alınabilir grafik işlemine dahil edilir. İkinci kabul veya ikinci son onay ikinci savaş/ödeme üretmez.

## 6. İlan sonrası ve mevcut savaşa katılım

Basit savaş ilanı korunur. Önizlemedeki isteğe bağlı aday listesi en fazla8 ayrı davet gönderir; seçilmeyen devlet davet edilmez. Ana savaş normal declareWar/setWarGoal ile açılır, sonra mevcut offer yolu kullanılır. Davetlinin reddi ana savaşı bitirmez.

Aktif cephede destek istemek `want:warJoin`, bilinen üçüncü savaşın tarafına katılmayı önermek `give:warJoin` taslağını oluşturur. Sonra normal kaynak/geçiş ve karşı teklif düğmeleri kullanılır. Native örnekte B kendi savaşı sürerken C’yi başka hedefe davet etti; C reddetti, B’nin savaşı sürdü. Başka örnekte B bilinen host savaşına gönüllü katılım önerdi; host kabul edince B aynı sefere girdi.

Zorunlu federasyon/vasal çağrıları ayrı mevcut mekaniklerdir. Yeni gönüllü katılım bunları devre dışı bırakmaz ve eski barışı otomatik çağrı gibi tekrar açmaz. Mevcut vekil savaş anlamı korunur: sponsorun ilgili ikili barışı onun adına açılan destek cephesini bitirebilir. Bu, tüm koalisyonun bütün savaşlarının tek bir anlaşmayla bittiği anlamına gelmez.

## 7. Ödeme ve gerçek erişim

Kaynak maddeleri ve tek yönlü `passage` mevcut applyItems/executeDeal yolundadır. Aktif destek kabulünde katılım ile bedel aynı işlemde gerçekleşir. Hazırlıkta ise ikisi de son ilanı bekler. Her seferinde ödeyen/alan ve güncel stok yeniden doğrulanır. Birinin parasını kesip diğerini savaşa sokamayan kısmi sonuç kabul edilmez.

Native B/C örneğinde son şart150maden oldu; önceki100maden teklif ve karşı teklif kaydı ayrı kaldı. Kabulde ödeme yok; son ilanda B−150/C+150. İki karşı tur motor testinde yalnız son300maden şartı uygulandı. Yeniden kabul ve yeni odada devam ikinci ödeme üretmez.

**Geçiş maddesi mevcut süresiz sınır iznidir.** UI bunu açıkça söyler; savaş bitince otomatik kalktığı iddia edilmez. Verilen devletin sınırını açar, bütün galaksiyi açmaz. Gerçek canEnter/findPathAllowed testi kapalı ara sınırı, izin+katılım sonrası geçerli yolu ve üçüncü devletin kapalı kalmasını karşılaştırır. Yıldız kapısı veya kapalı sınır kuralları yeniden yazılmadı. Garanti zafer, otomatik toprak devri ve gerçekleştirilmeyen filo hedefi sözleşme maddesi yapılmadı.

## 8. AI: yapılan ve yapılmayan

Yeni maddenin değeri mevcut evalOffer/aiRespond, ilişkiler, güven, etik, kişilik ve kaynak değerlemesine katılır. Yeni bedel, katılacak tarafın bilinen güç dengesi, kendi yorgunluğu/savaş yükü ve doktrinini dikkate alır. AI katılırken askerî erişimi veya bilinen güç koşulları yetersizse büyük ödeme de kabul ettirmez. Yabancı gerçek stok/filo nesnesi karar için kopyalanmaz; mevcut aiKnownPower ve izinli bilgi yolu kullanılır. Karar RNG tüketmez.

Açıkça müzakereyle genişlemiş bir koalisyonda zayıf AI, bilinen tehdit karşısında mevcut müttefikinden yardım isteyebilir. Bu takip mevcut diploTick/aiNegotiate/UI.aiOffer yolundadır;180günlük aday değerlendirme aralığı ve mevcut ret hafızası korunur. Kullanılmayan yeni özelliklerde eski AI yolu değişmez. 15düşük-istihbarat fiyat örneğinde10ret/5kabul; ayrı seviye3 izinli bilgi senaryosunda gerçek karşı teklif ve onun son şartıyla katılım ölçüldü.20aylık kontrollü diplomasi akışında insanın önüne gerçek teklif geldi, insan otomatik katılmadı; ret hafızası aynı teklifi tekrarlatmadı.

**Sınır:** AI’nın kendiliğinden sıfırdan savaş öncesi hazırlık açması ve bütün galakside fırsat tarayarak ücretli gönüllü destek satması geliştirilmedi. Kontrollü AI denemeleri yeni kabul/ret/karşı teklif ve yardım aramasını ölçer; bunlar120aylık tam ekonomi/savaş kampanyası veya genel vasallık verimlilik reformu değildir.

## 9. Geliştirme sırasında kanıtlanan kusurlar

| Kanıt | Gerçek neden ve düzeltme |
|---|---|
| `core-before.log` | Yeni ID’li katılım/merkez modeli yoktu. Negatif testlerin geçmesi yeni mekanik var demek değildir; pozitif kabul testleri eklendi |
| `prepare-first/second.log` | Pozitif fikstür yasaklı arındırıcı hedef seçmişti. Ürün kapısı korunup normal hedef seçildi; bütün negatif testlerden önce gerçek kabul assertion’ı eklendi |
| `prepare-third.log` → `prepare-final.log` | Toplu rollback, iç işlemlerin ekonomi defterini geri almıyordu. Mevcut işlem köklerine economyHistory eklendi; ham Save8/RNG geri alma doğrulandı. Bu #24 özgün vaka çözümü değildir |
| `atomic-news-before.log` → `atomic-news-after.log` | Başarısız toplu ilan dış MP haber deposuna hayalet savaş bırakıyordu. Yalnız yeni batch’te recordNews da son başarılı commit’e ertelenir; özel kanallar da değişmez |
| `disclosure-before.log` → `disclosure-after.log` | Yeni katılım quote’u tahmin edilen bilinmeyen cepheyi yoklatabiliyordu. Verilen destek için bilinen cephe veya aktöre gerçekten gönderilmiş davet şartı eklendi |
| `value-read-before.log` | Yeni değer hesabı soğuk `_powAt/_powC` alanlarını değiştiriyordu. Yeni salt-okunur değer mevcut ortak read korumasını kullanır; serializer/alan silme ile eşitlik üretilmez |
| MP UI ilk seçici | Üst menü gerçek pickOne listesiydi; data-a=activeWars düğmesi sanılmıştı. Native seçim yolu düzeltildi |
| MP UI ikinci koşu | Genel modal koruması yeni salt-okunur Savaş Merkezi’nde aynayı bekletiyordu. İstisna yalnız bu görünümde; son onay korumalı |
| MP UI yeniden açma / geçiş | Yeni modal doğrudan yazılırken eski surfaceHTML/pending timer sahipliği kalıyordu. Modal aç/kapat eski bekleyen yüzeyi temizler; kapalı merkez sorgulanmaz |
| `topbar-scale-proof.json` | p17’den gelen yüzde genişliği CSS zoom ile ikinci kez ölçekleniyordu. 1920ekranda%80 düğmenin sağı2395px idi; tek CSS kuralıyla1915px, %125’te1912px oldu |
| `topbar-identity-before.json` | Aynı HTML ile30yenilemede düğme30kez siliniyordu. Aynı HTML yeniden yazılmaz; yeni UI testi düğmenin aynı nesne kaldığını doğrular |

Önceki başarısız günlükler silinmez. SP ilk koşularında ayrı scroll adımında kopan node, başlangıç danışmanı ve aktif savaşta farklı menü sırası test hazırlığı/seçici olarak ayrıldı; gerçek otomatik kaydırmalı click/tap ve doğru etiket kullanılır. Timeout artırımı, force veya JS click yoktur.

**Açık aralıklı gözlem:** `mp-ui-fourth.log` C’nin karşı teklif gönderiminde görünür hedefte Playwright stable bekleme timeout’u verdi. Son başarılı koşulda pointer/touch/click hedefe ulaşıyor; RAF/DOM kayıtları `wc0-touch-*.json` içindedir. Bu eski FAIL’in kesin ürün/test/ortam ayrımı kanıtlanmadı; sonraki PASS onu silmez ve genel dokunma sorunu çözüldü denmez.

**Son birleşik koşulda açık kalanlar:** `mp-desktop-release.log` 6PASS/1FAIL: P0, Konsey ve p16/p17 arayüz regresyonları geçti; WC0 başlangıcında misafirin yeni fikstür gün/stok değerini bekleme 30s timeout verdi. `mp-combined-diagnostic.log` 4PASS/1FAIL: WC0 bütün koalisyon/karşı teklif/ücret/üçüncü taraf akışını geçti; bu kez eski P0 filo seçimi `selfleet 25` gerçek click adımında8s timeout verdi. Ürün/test/ortam kökü kesin ayrılmadı. Bu iki toplam FAIL korunur; sonraki başarılarla yeşile çevrilmez.

## 10. Testler

Bütün yollar bu rapora göre `evidence/beta-war-center0/` altındadır. Tam ortak ENV ve komutlar [kanıt README](evidence/beta-war-center0/README.md) içindedir. `STARS_OUTPUT` her koşuda ayrı kanıt klasörüdür.

| Hedef | Gerçek komut | PASS/FAIL | Kanıt |
|---|---|---|---|
| Katılım, geçiş, eski cephe, atomiklik | `node tests/beta_war_center0_test.cjs` | 7/0 | [core-release.log](evidence/beta-war-center0/core-release.log) |
| Koşullu hazırlık, toplam bütçe, rollback, yükleme | `node tests/beta_war_center0_prepare_test.cjs` | 5/0 | [prepare-release.log](evidence/beta-war-center0/prepare-release.log) |
| MP komut/yetki/özel haber, iki karşı tur, uzak insana AI daveti | `node tests/beta_war_center0_mp_test.cjs` | 9/0 | [mp-core-release.log](evidence/beta-war-center0/mp-core-release.log) |
| AI 5seed/20 diplomasi ayı, ret/karşı/kabul, erişim ve vasallık | `node tests/beta_war_center0_ai_test.cjs` | 6/0 | [ai-counter-release.log](evidence/beta-war-center0/ai-counter-release.log) |
| Gerçek p17 beşseed×üçay ham Save8/RNG ve eski MP paket | `node tests/beta_war_center0_equivalence.cjs` | 6/0 | [equivalence-release.log](evidence/beta-war-center0/equivalence-release.log) |
| Son PERF2 | `node tests/perf2_equivalence_test.js` | 5/0 | [perf2-release.log](evidence/beta-war-center0/perf2-release.log) |
| Son misafir beyaz liste/gizlilik | `node tests/mp6_mirror_test.js` | 8/0 | [mirror-release.log](evidence/beta-war-center0/mirror-release.log) |
| Son savaş/barış/yan cephe/ambargo | `node tests/beta_war_fix0_test.cjs` | 17/0 | [warfix-release.log](evidence/beta-war-center0/warfix-release.log) |

İlk23Node regresyonu da tamamı exit0: aşağıdaki her satırda gerçek komut `node tests/<dosya>`, kanıt `reg-<dosya>.log`; ayrıntılı süre/çıkış [node-regressions.json](evidence/beta-war-center0/node-regressions.json).

| Test dosyası | PASS/FAIL |
|---|---|
| `beta_board2_colony_test.cjs` | 5/0 |
| `beta_board2_rebellion_test.cjs` | 1/0 |
| `beta_board2_remote_test.cjs` | 2/0 |
| `mp75_war_test.js` | 5/0 |
| `beta_board1_agenda_test.cjs` | 13/0 |
| `beta_board1_critical_test.cjs` | 5/0 |
| `beta_board1_cancel_test.cjs` | 2/0 |
| `mp64_spy_test.js` | 7/0 |
| `mp_p0_guest_test.cjs` | 7/0 |
| `mp_p0_decisions_test.cjs` | 7/0 |
| `mp_p0_motion_test.cjs` | 3/0 |
| `mp_p0_notice_test.cjs` | 3/0 |
| `perf1_equivalence_test.js` | 4/0 |
| `perf2_equivalence_test.js` | 5/0 |
| `mp86_nebula_cache_test.js` | 3/0 |
| `beta_fed_found0_core_test.js` | 10/0 |
| `beta_fed_found0_mp_test.js` | 11/0 |
| `mp73_council_test.js` | 14/0 |
| `beta_war_fix0_test.cjs` | 17/0 |
| `beta_scale0_colony_test.cjs` | 12/0 |
| `faz95e_construction_test.js` | 21/0 |
| `mp3_core_test.js` | 11/0 |
| `mp4_core_test.js` | 14/0 |

| Gerçek Chromium senaryosu | PASS/FAIL | Komut/kanıt |
|---|---|---|
| SP PC1920×1080 yüzde80/100/125;800×360,915×412,960×540; tekrar açma, sekmeler, geçmiş ID, ham salt-okuma | 10/0 | `node tests/browser-beta-war-center0.cjs`; `sp-ui-release.log`, ekran görüntüleri `sp-ui-release/` |
| Üç ayrı tarayıcı, yatay dokunma, B/C koşullu karşı teklif ve son ilan/ücret; davet ret, gönüllü katılım | 3/0 | `WAR_CENTER0=1 MP73_ONLY='B1 \|WC0 \|sayfa' node tests/browser-mp73.cjs`; `mp-ui-accepted.log` |
| Son PC birleşik Konsey/P0/WC0/p17koloni/p16FIFO | 6/1 **FAIL** | `MPP0_DESKTOP=1 WAR_CENTER0=1 BOARD1=1 BOARD2=1 MPP0=1 MP73_ONLY='B1 \|B2 \|WC0 \|P0 \|BD1 \|BD2 \|sayfa' node tests/browser-mp73.cjs`; `mp-desktop-release.log` |
| Ek tanı: aynı eski P0 ardından bütün yeni WC0 akışı | 4/1 **FAIL** | `MPP0_DESKTOP=1 WAR_CENTER0=1 MPP0=1 MP73_ONLY='B1 \|B2 \|WC0 \|P0 \|sayfa' node tests/browser-mp73.cjs`; `mp-combined-diagnostic.log` |
| Gerçek IndexedDB; bütün süreçler kapanır; yeni oda/devletler; bekleyen+imzalı şart; iki insan onayı; tek ödeme;6ay daha | 5/0 | `WAR_CENTER0_R=1 MPP0_R=1 BOARD2_R=1 MP8_SCEN=R MP8_MONTHS=6 node tests/browser-mp8.cjs`; `cold-r.log` ve aşağıdaki güçlendirilmiş tekrar |
| Aynı soğuk devam, eski kabulü **asıl alıcı C** tekrar gönderir | 5/0 | Aynı R komutu, çıktı `cold-r-recipient.log`, `cold-r-recipient/R/war-center-cold-result.json` |
| MP8 kopma/sessiz soket/host yok/iki sekme ve teklif kurtarma | 9/0 | `MP8_SCEN=N node tests/browser-mp8.cjs`; `recovery-n.log` |
| MP74 lobi, kart dokunma/kaydırma, hızlı karar, üç insan | 7/0 | `node tests/browser-mp74.cjs`; `mp74-release.log` |
| MP75 ilk koşu | 4/2 **FAIL** | `node tests/browser-mp75.cjs`; `mp75-release.log`. Eski başlık assertion’ı, ardından açık kalan modal |
| MP75 gerçek yeni merkezin hazır verisini/ID’lerini/sayacı bekleyen uyarlama | 6/0 | Aynı komut; `mp75-adapted.log`. Kaynak gizliliği assertion’ı kaldırılmadı; tam ID ve satır sayısı eklendi |
| P0.1 Konsey/panel sahipliği | 3/0 | `node tests/browser-beta-p01-panels.cjs`; `p01-panels-release.log` |
| p17 koloni/habitat masaüstü+yatay mobil UI ve salt-okuma | 20/0 | `node tests/browser-beta-board2-colonies.cjs`; `colony-ui-release.log` |

MP75 değişikliğinde eski `/AKTİF SAVAŞLAR/` metni, kasıtlı yeni Savaş Merkezi yönlendirmesiyle uyuşmuyordu. Asenkron host DTO’sunun gelmesi beklenir; üst sayaç, kendi savaş listesi, çizilen gerçek cephe ID’leri ve kart sayısı birlikte doğrulanır. A3 tamamlanınca normal modal kapanır ve A4 arkasında kaplama kalmaz. İlk4/2 saklanır.

İlk soğuk R koşusu gerçek kayıt/devam/ödeme açısından5/0’dı; fakat tekrar-kabul çağrısı eski teklifin göndericisi B’dendi (`rules:not-recipient`). Bu, asıl alıcının çift uygulama denemesi olarak sunulmaz. Ek R5/0: gerçekten C’nin aynı kabulü `rules:closed` ile reddedildi; kaynaklar değişmedi. Native son ilanda B−250/C+150/host+100 ve12.ay aynası/gizlilik eşitliği doğrulandı.

**NOT RUN:** fiziksel PC/Android kullanıcı kabulü, gerçek LAN/internet/Render, yeni120ay tam savaş/ekonomi kampanyası,1000/48 performansı; genel AI yeni savaş öncesi plan başlatması/ücretli gönüllü fırsat taraması; #32 bütün tarih/rol varyantları ve #44 geniş vasallık oranı ölçümü. Genel “bütün regresyonlar PASS” sonucu yoktur; açık aralıklı etkileşim FAIL’leri korunur.


## 11. Save8, yetki ve gizlilik

Eski gerçek p17 Save8 ve MP paketi yüklenir; bozuk paket bütünlüğü reddedilir. Yeni hazırlıklar eksikse eski kayıt yeniden yazılmaz. Yeni bölümde boyut, taraf/üye, tür, zaman, madde ve izinli kaynak şeması kontrol edilir; bozuk yükleme eski dünyayı korur.

Host tek otoritedir. Misafir yeni bir emri yalnız kendi bağlantı/devlet kimliğiyle gönderebilir. Son ilan sadece hazırlık sahibine aittir; katılımcı kendi kabulünü geri çekebilir. Özel teklif ve imzalı şartlar yalnız taraflara projekte edilir. Açık savaş ayrıntısı yalnız izinli DTO’dur; başka devletin stokları, gizli rotaları ve casusluk alanları eklenmez. Özel davet görmemiş bir kişi ID tahminiyle bilinmeyen savaşı yoklayamaz. Başarısız batch yalnız G’yi değil yayınlanacak haberleri de etkisiz bırakır.

Beş seed11/23/42/99/404×üçay, yeni mekanik kullanılmayan gerçek p17 kontrolünde ham Save8/RNG karşılaştırılır. Yeni meşru savaş, sözleşme ve haber verisi oluşan senaryoların eski sürümle byte-eşit olması beklenmez. Hata ve salt-okuma testleri alan normalleştirmesi kullanmaz.

## 12. Performans ve sınırlar

Aynı p17 kayıtlarından15aylık Node örneği: p17 aylık adım medyanı **91.86ms**, p18 **87.16ms**; toplamlar1442.26/1309.97ms. Her örneğin Save8 hash/RNG ve iki süre değeri `equivalence-release/compat.json` içindedir. Bu küçük headless ölçümden genel hızlanma yüzdesi veya fiziksel PC FPS iddiası çıkarılmaz.

İlk soğuk R kontrolünde6.ay host monthTick medyan99.3ms/p95 169.7ms, publish medyan7.8ms; misafir build medyanları16.4/12ms, heap host22MB/B13MB/C15MB.12.ayda host medyan64.5ms, B/C build20.3/16.5ms. Başlangıçta yüzlerce ms ve bazı uzun görevler görülür; bunlar logda saklıdır. Tarayıcı `heapMB` toplam işletim sistemi RAM’i değildir. Oyun ölçümleri `cold-r.log` PERF satırlarıdır. Aktif merkezin ayrı FPS benchmark’ı ve8sözleşmeli en büyük işlem bellek profili NOT RUN.

Savaş Merkezi kapalıyken yeni ayrıntı DTO’su hazırlanmaz ve sorgu yapılmaz. Açık görünümde sorgu en sık1400ms aralığıyla; son onayda bu otomatik yenileme kapalıdır. UI kaynak verisi değişmeden üst çubuk HTML’sini tekrar üretip hedef node’u silmez. Bu bir FPS iyileşme yüzdesi iddiası değildir. Koşullu çoklu işlem mevcut tam grafik rollback’i kullanır;1000sistem/48AI/8imzalı sözleşme maliyeti bu fazda ölçülmedi. Ağır galaksi kampanyaları başlatılmadı.

## 13. Dosyalar, paket ve GitHub

Runtime: `diplomacy.js` ortak madde/hazırlık/kapılar, `ai.js` yalnız yeni madde yanıtı, `archive-ui.js` merkez, `ui.js` giriş/önizleme/kararlı modal ve HUD, `main.js` codec/batch haber tamponu/build, `index.html` üst çubuk ölçeği, `sw.js`. MP: `mp-core.js`, `guest-stars.js`, `mp71-dip.js`, sürüm için view.js/relay.js. Yeni testler, kabul helper’ları ve tam kaynak/hunk pinleri vardır. Motor coğrafyası, temel ekonomi formülleri, mevcut savaş hasar/bombardıman, koloni otomasyonu ve eski federasyon yasaları yeniden yazılmadı.

[Oyun ZIP’i](../../releases/stars-faz96h10p18.zip): **816462 bayt**; SHA-256 **`6bb4d0c2714a98f816615217aeb8e418faaea06a41d5aaa81dc294b43e9c2d88`**; bütün ZIP CRC32 **`9A066EF0`**. İki üretim byte-eşit, ZIP20üye CRC kontrolü PASS.19runtime dosyası ve tam manifest eşleşir. RELEASE-MANIFEST SHA-256 `74d7ce68d8aa21d2011a71596b6a6093379083d73ed2ddc1adb3b70b4023c014`. Dosya başına CRC ve tüm değişen runtime/MP SHA-256 önce/sonra karşılaştırması [release-verification.json](evidence/beta-war-center0/release-verification.json) içindedir. Eski p17 ZIP silinmedi. MP relay/istemci kaynakları ayrıca aynı Git dalındadır; oyun ZIP’inin içinde oldukları iddia edilmez.

Gerçek paket komutları: `python3 tools/package-release.py`; `python3 tools/package-release.py --out /tmp/stars-faz96h10p18-second.zip`; `python3 tools/verify-release.py`. Kanıt: `package-first.log`, `package-second.log`, `manifest-verification.log`.

Taslak PR **yalnız bir kez** denendi; Issue#33’e yalnız kapsam görevlerini belirten yorum **bir kez** denendi. Her ikisi exit1: `Post "https://api.github.com/graphql": Forbidden`. PR oluşmadı, pano yorumu yazılmadı, yetki arama/tekrar döngüsü yapılmadı. [Compare](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-board2-colony-politics-ux...codex/stars-beta-war-center0-coalitions?expand=1); ham hata/komutlar [github-api-attempts.json](evidence/beta-war-center0/github-api-attempts.json). Başlangıç pano okuması da aynı API hatasıyla engellenmişti. Dolayısıyla görev durumları bu rapordaki yerel önerilerdir; panoda güncellendi iddiası yoktur. İlgisiz görev geçmişi korunur.

Main uzak HEAD `4296ad2d43fedce6264020b3761f50f1839fd836` ve p17 taban `10ab6f9c7f4d030f3df055f1b2c326f499e2f0b0` teslim öncesi/sonrası kod push kontrolünde değişmedi. Tam kod dosyası listesi [changed-files.txt](evidence/beta-war-center0/changed-files.txt). Rapor commit’inin kendi SHA’sını dosyaya eklemek için yeni commit zinciri üretilmez; nihai uzak HEAD teslim mesajındadır.

## 14. Kullanıcı kabulü ve kalan işler

Fiziksel PC/Android, iki gerçek PC, LAN/internet ve Render **NOT RUN**. Yerel Chromium bu sonuçların yerine geçmez. Kullanıcı açık kabul vermeden görev kapatılmadı.

1. Gerçek host+iki katılımcıda B→C koşullu katılım teklifini iki kez pazarlık et. Kabulde savaş/ödeme olmamalı; B’nin son onayında yalnız son şart bir kez uygulanmalı.
2. “Hemen ilan” ekranında C’yi seç; C reddetsin. Ana savaş sürmeli. Bilinen başka savaşta taraf seçip gönüllü katılmayı öner; tarafın insanı kendi ekranında onaylamalı.
3. Kaynak ve geçiş maddesini birlikte kullan. İlgili sınırdan gerçek askerî rota geçmeli; üçüncü kapalı sınır açılmamalı. Geçişin süresiz olduğunu kontrol et.
4. Bekleyen teklif ve kabul edilmiş hazırlıkla host kaydı al, bütün oturumları kapat, yeni odaya dön. Devletler/şartlar aynı kalmalı; eski kabul ikinci ödeme yapmamalı.
5. Üç sekme, eski savaş haberi ve yeni savaş arasında geç. Aynı ID korunmalı; %80/%100/%125 PC ve yatay mobilde üst düğme/X/scroll kullanılabilmeli. Aynı teklif düğmesindeki aralıklı dokunma hatası yeniden görülürse güncel ekran ve kayıtla tanı alınmalı.

Sonraki öncelik bu p18’in gerçek PC multiplayer kabulü ve kalan aralıklı dokunma gözlemidir. Ardından AI’nın savaş öncesi hazırlık başlatması/gönüllü ücretli destek fırsatı ölçümü; #32 tam ittifak matrisi ve #44 geniş vasallık ölçümü. #24/#25 kullanıcı Save8’i olmadan kapatılmaz. #51/#39 ayrı siyasi faz olarak kalır.
