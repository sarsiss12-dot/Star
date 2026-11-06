# STARS — BETA-P0.1 sonuç raporu

**Durum: öncelikli #1 düzeltildi; beş görevde kanıtlanan düzeltmeler ve yerel testler teslim edildi. Genel beta yayın onayı yok.** #34'ün mevcut olmayan zengin tarihsel verileri ve tam üç insanlı MP73 kabulü açık. Kullanıcı onayı verilmedi; hiçbir görev TAMAMLANDI sayılmadı.

## 1. Kanonik kaynak ve HEAD

- Güncel uzak `main`: `4296ad2d43fedce6264020b3761f50f1839fd836`, MP.4 /96h10. BETA.0 bunun devamıdır; sonraki MP ayna/otorite, Save8, PERF ve UI Scale kazanımları main'e henüz gelmemiştir.
- Doğrulanan gerçek çalışma başlangıcı: `d307864edbc2ab9ca4347e5d065640e150279411`, `codex/stars-beta0-stability`.
- Yeni dal: `codex/stars-beta-p01-critical`. PR tabanı aynı BETA.0 dalı; seçilen beş görevin farkı ayrı incelenebilir. Main/merge/rebase/force-push yok.
- Kod teslim HEAD: TESLIM_HEAD_BEKLENIYOR. Son rapor commit'inin SHA'sı nihai sohbet tesliminde verilir; kendi SHA'sı için döngüsel commit üretilmez.
- Açık PR listesi sorgusu GraphQL **Forbidden**: mevcut açık PR'lar doğrulanamadı. Yeni PR: TESLIM_PR_BEKLENIYOR.
- [Kaynak doğrulaması](evidence/beta-p01/source.json). AGENTS, GPT-DEVIR ve CLAUDE ile önceki kanıtlar esas alındı; tamamlanmış MP89/BETA0 işleri yeniden yazılmadı.

## 2. #1 — İstemsiz Galaktik Konsey paneli

**Önce:** Konsey → gerçek dokunmayla Diplomasi → Konsey sayacı güncellemesi, ekranı yeniden Konsey yapıyordu. [Değiştirilmemiş kodda FAIL](evidence/beta-p01/panels-before2.log), [alanlar](evidence/beta-p01/panels-before2/sp-transitions.json).

**Kök neden:** Diplomasi/Bilim/Devlet/Piyasa aynı `diploPane` DOM'unu doğrudan değiştiriyor; eski `_surfaceKey='council'`, `_surfaceHTML` ve ertelenmiş Konsey güncellemesi kalıyordu. Konsey verisi değişene kadar önbellek yüzünden görünmeyen hata, veri değişince periyodik yenilemeyle ekranı ele geçiriyordu.

**Minimal düzeltme:** `surfaceReplace` ortak panelde sahipliği, dünya/HTML önbelleğini ve bekleyen timer'ı birlikte değiştirir. Doğrudan DOM değiştiren mevcut yollar bu yardımcından geçer. Otomatik `openCouncil(true)` yalnız açık ve sahibi Konsey olan panelde çalışır. Kullanıcının açık Konsey talebi/bildirim yolu korunur. Yeni panel sistemi yazılmadı.

**Kanıt:** [SP3/0](evidence/beta-p01/panels-full.log): Konsey öncesi, sonrası, Save8 yeniden yükleme; gerçek dokunmayla Diplomasi/Bilim/Devlet/Ekonomi/Federasyon/Piyasa/İstihbarat/Haberler geçişleri ve eski ertelenmiş yenilemenin iptali. [MP2/0](evidence/beta-p01/mp-panels3.log): gerçek yerel host/misafir, farklı insan devletleri, ayna güncellemeleri. İki ilk MP tanı koşusu modal korumasını/ayna yolunu yanlış beklediği için FAIL oldu; [ilk](evidence/beta-p01/mp-panels.log) ve [ikinci](evidence/beta-p01/mp-panels2.log) silinmedi. Ürün düzeltmesini gizleyen timeout artışı yapılmadı.

## 3. #34 — Doğru savaş/olay paneli

**Önce:** `warStartOpen` sabit cepheyi bulsa da durum satırını güncel `G.p.war[foe]` üzerinden yazıyordu. Aynı iki devlet yeniden savaşınca eski savaş bildirimi de sürüyor görünüyordu. Arşiv savaş kaydı genel metin sayfasıydı.

**Düzeltme:** Yeni SAVAŞ DURUMU görünümü `war-front:<id>` ile tam cepheye bağlanır; çift devlet adına göre son savaşı seçmez. Başlangıç, aktif/sona ermiş durumu, kaydedilmiş bitiş günü/nedeni, bilinen katılımcılar, izinli güncel yorgunluk ve kendi kayıtlı katkı/hedef bilgisi gösterilir. Eksik tarihsel veri açıkça belirtilir. Güncel diplomasi bağlantısı tam rakibe gider; başka modal/world'deki eski bağlantı çalışmaz. Federasyon savunma rolü ve katılım açıklaması korunur.

**Misafir:** Kanonik ledger ve özel istatistikler aktarılmaz. Yalnız kendisinin/bildiği haberin `id,sides,opened,ended,legacy,reason` durumu host tarafından ayna haberine eklenir. Bu geçici görünüm alanı Save8 haber şemasına eklenmez. Eski yerel ledger ID'si host ID'si yerine kullanılmaz. Bilgi yoksa yeni savaş uydurulmaz.

**Sınır:** Tarihsel askerî güç tahmini, eski yorgunluk, kaydedilmemiş müttefik/cephe konumları geriye dönük oluşturulmadı. Yeni gizli istihbarat kanalı açılmadı. Barış/federasyon/Konsey haberleri kendi sabit olay metninde kalır; otomatik eski diplomasi ekranına yönlendirilmez. Geçmişte yanlış panel açılmasının tamamının tek kökten geldiği iddia edilmez.

[Kontrol3 FAIL/1 PASS](evidence/beta-p01/news-before.log) → [son4/0](evidence/beta-p01/news-final2.log). Klasik savaş UI regresyonunda ilk32/2 FAIL, kaybolan savunma açıklaması ve rakip bağlantısı geri getirildikten sonra [34/0 PASS](evidence/beta-p01/war-ui-final.log). [Ayna3/0](evidence/beta-p01/mirror-final.log), iki insanlı gerçek MP savaş paneli hedefli testte PASS. SP gerçek dokunma ilk koşusu barışa kapalı eski doktrin fikstürü yüzünden FAIL oldu; ürün barış kuralı değiştirilmedi. Fikstürde normal doktrin, başarılı gerçek barış ve farklı cephe ID'si açıkça doğrulandıktan sonra [son dokunma testi1/0, üç alt vaka PASS](evidence/beta-p01/news-browser-final.log): eski / yeni / kimliği eksik haberler. PNG ve tam metinler aynı dizinde.

## 4. #3 — Konsey oyu, kimlik, tek uygulama ve ACK

**Kanıtlanan kökler:** Host UI doğrudan `yes/no.push(0)` yapıyordu; diğer insan oyları beklenirken çift oy yazılabiliyordu. Host belirteci yalnız yasa+hedef içeriyordu; aynı yasa/hedefin sonraki oylaması eski belirteci kabul edebiliyordu. Misafir gönderimden hemen sonra koşulsuz Konsey açıyor, bekleyen oy/ACK durumu göstermiyordu.

**Düzeltme:** Ortak `castCouncilVote` üyelik, güncel kimlik, bitiş, vasal yetkisi ve tekrar oy kapısını kullanır. Yeni oylamalara RNG kullanmadan `opened` konur; belirteç yasa+hedef+başlangıçtır. Eski `opened` içermeyen kayıtlar `legacy` olarak açılabilir. Aynada yalnız kamu başlangıcı taşınır; hedef kimliği sunucuya dönerken gerçek devlet ID'sine çevrilir. Bekleyen düğmeler pasif, gönderiliyor/host sonucu görünürdür. ACK kullanıcı başka panele geçtiyse Konsey'i açmaz; yeni bağlantı kuşağında eski bekleme temizlenir.

**Test:** Gerçek eski kaynakta çekirdek11/2 → [aday13/0](evidence/beta-p01/council-final.log); [SP3/0](evidence/beta-p01/ballot-final.log). İlk SP testinde biten oylama nesnesi null olmuştu; test doğru nesne referansını tutacak şekilde düzeltildi, ilk FAIL kayıtları saklandı. İki insanlı Chromium'da bir EVET dokunması, gerçek ACK tüketimini kontrollü geciktirirken bekleme, başka panel, host HAYIR, tek sayım ve yeniden bağlantı PASS. Fiziksel telefondaki eski EVET dokunuşunun kaçırılma nedeni geriye dönük kanıtlanmadı.

## 5. #4 — Açıklamasız otomatik barış

**Kanıt:** %100 yorgunluk ve kriz AI ateşkesi mevcut tasarım kurallarıdır. Kriz barış döngüsü `!e.ai` insanları atlar; iki insan arasındaki savaş bu AI döngüsüyle bitmez. Eski gerçek telefon oturumunda hangi kuralın tetiklendiğini gösteren kayıt yok; geriye dönük kesin teşhis yapılamaz.

**Hatalar:** Normal barışta `resolveProxyWars` erken ledger sync yaptığı için ana savaşın nedeni de `proxy-peace` olabiliyordu. Yorgunluk/kriz kilit kırma dalları savaş bayrağını kapatıp ledger/bitiş haberini aynı adımda kapatmıyordu. Oyuncu açıklamayı kaybediyordu.

**Düzeltme:** `makePeace` isteğe bağlı neden/aktörü alır ve ana cepheyi vekil savaşlardan önce kaydeder. `warLedgerSync` her yeni kapanış için sabit `war-end:<id>`, taraflar, oyun günü, neden ve aktör/otomatik kuralı yazar. Yorgunluk/kriz doğrudan kapanışları, ittifak/vasallık çelişki onarımları açıkça etiketlendi; mevcut statüko/koalisyon/Konsey yolları korunup nedenleri netleştirildi. %85–100 arasında tekil yorgunluk uyarısı eklenir. Bilinmeyen tarihsel kapanışlara kesin neden uydurulmaz. Bütün aranan yollar [kaynak envanterinde](evidence/beta-p01/war-end-paths.txt).

Meşru otomatik barış, AI stratejisi, savaş sonucu veya RNG algoritması kaldırılmadı. [Kontrol1/4 FAIL](evidence/beta-p01/war-end-before.log) → [son5/0 PASS](evidence/beta-p01/war-end-final.log): açık/kilitli %100, kriz AI/iki insan ayrımı, normal barış ve Save8 yükleme. İki insanlı gerçek MP'de her iki savaş bayrağı kapanır, misafir aynı tarihsel savaşın zorunlu barış nedenini görür.

## 6. #21 — İnsan adına ambargo

**Kök:** `embargoTick` dış devlet döngüsü `e.ai` kontrol etmiyordu; hem host hem uzak insan düşük güvende otomatik ambargo koyuyor, yüksek güvende manuel ambargoyu otomatik kaldırıyordu. Kriz dalı da insanın manuel ambargosunu kaldırabiliyordu.

**Düzeltme:** Otomatik kişisel ambargo yalnız `ai===true` için. Kriz gevşetmesinde insanın manuel kararı korunur; mevcut RNG çekimi aynı koşul noktasında kalır. AI'nın otomatik uygulama/gevşemesi, kişisel emir, Konsey parya yaptırımı ve ittifak/vasallık tutarlılık kuralları ayrıdır. Haber mevcut karar sahibini ve kişisel/AI gerekçesini içerir.

[Önce2/2 FAIL](evidence/beta-p01/embargo-before.log) → [son5/0 PASS](evidence/beta-p01/embargo-final.log): iki insan, AI otomatiği, yüksek güvende manuel koruma, Konsey yaptırımı, krizde insan koruma/AI gevşemesi. Gerçek MP host tarafında iki insanın otomatik ambargo listesi boş kaldı.

## 7. Test durumu ve sınırlar

Tam komutlar ve açıklamalar [RUN-NOTES](evidence/beta-p01/RUN-NOTES.md), gerçek seri çıkışları [browser-exits.json](evidence/beta-p01/browser-exits.json) ve [native-exits.json](evidence/beta-p01/native-exits.json) altında. Chromium koşuları sırayla çalışır; force, sahte JavaScript click, timeout büyütme veya hata yutma yok.

| Test | Gerçek sonuç |
|---|---|
| #1 SP / MP hedefli |3/0 /2/0 PASS; [son build SP tekrarı3/0](evidence/beta-p01/panels-final.log) |
| Yeni haber / ayna native |4/0 /3/0 PASS |
| Oy native / MP çekirdek |3/0 /13/0 PASS |
| Bitiş / ambargo native |5/0 /5/0 PASS |
| Eski/bozuk Save8 sınır |19/0 PASS |
| p6 MP paket / eski opened'sız oy |3/0 PASS |
| MP62 / MP64 news / MP4 core |13/0 /4/0 /14/0 PASS |
| PERF.1 / PERF.2 / MP86 cache |4/0 /5/0 /3/0 PASS |
| Eski savaş UI | İlk32/2 FAIL; düzeltme sonrası34/0 PASS |
| İki insan özel MP kritik |2 PASS /1 FAIL: P03/P04 PASS, A1 tanı düğmesi mp6Conn timeout |
| Tam MP73 |4 PASS /4 FAIL: üç insanlı ikinci oda KATIL timeout, B2–B4 bağımlı kurulum hataları |
| SP haber gerçek dokunma | İlk fikstür FAIL; [son1/0 PASS, üç alt vaka](evidence/beta-p01/news-browser-final/results.json) |
| MP8 N / R / MP75 | [N9/0](evidence/beta-p01/N.log), [R6/0](evidence/beta-p01/R.log), [MP75 6/0](evidence/beta-p01/mp75.log) PASS |
| Fiziksel Android / gerçek LAN / canlı Render | NOT RUN |

`reg-*-initial.log` / `native-initial-exits.json` alt süreç EPERM engelini kaydeder; boş örnekli veya status0 yanında spawn-error olan koşular PASS sayılmadı. Yetkilendirilmiş yerel test yürütmesiyle gerçek sonuçlar `native-exits.json` altında. UI kaynak korumasının ilk sandbox git EPERM kaydı korunur; son doğrulama PASS.

## 8. Save8, RNG, sürüm ve paket

Save sürümü8, MP paket4, protokol1 korunur. Yeni oylama `opened` alanı geriye uyumlu isteğe bağlı dünya metaverisidir; eski kayıt yüklendiği için bu alan zorunlu değildir. Haber görüntüsü `warStatus` yalnız ayna görünümündedir, serializer whitelist'ine eklenmedi. Ham eski v8 ve önceki p6 MP paketinin tam doğrulamayla p7'de yüklenmesi test edildi; p5 ve diğer build'ler otomatik kabul edilmez, bütünlük/alan/kimlik kontrolleri korunur.

Düzeltilen insan oyları/ambargolar ve yeni bitiş haberleri eski hatalı dünyayla aynı Save8 hash'ini üretmek zorunda değildir. RNG üreticisi/algoritması değişmedi; UI ve kamu haber eki RNG çekmez. Aynı mevcut kurallar altında PERF kontrol–aday Save8/RNG eşdeğerlikleri PASS. Bug nedeniyle farklılaşan diplomatik durumların gelecekte hiç ayrışmayacağı iddia edilmez. AI/economy/harita dosyaları aynıdır; yalnız seçili diplomacy/UI/MP yolları değişir.

- Oyun `96h10p7`, PWA `stars-v96h10p7`, MP `MP.8.9b2`.
- ZIP `releases/stars-faz96h10p7.zip`, 779126 bayt.
- SHA-256 `1bfa5fddbaacd0e281796f99292c6d0ddd78962f7cd3943a9b1ea79efa3a7673`; CRC32 `44c4a49f`.
- İki deterministik üretim bayt eşit; ZIP iç CRC ve çıkarılmış manifest19 dosya hash'i PASS. [Paket bilgisi](evidence/beta-p01/package.json).
- MP dosya SHA'ları aynı JSON'da; Docker COPY/relay allowlist değişen yolları zaten kapsar. Docker build/dağıtım NOT RUN. Render'a bağlanılmadı/deploy/restart yapılmadı.
- Eski MP istemcileri yeni host ile karıştırılmamalı; güncel UI/MP betikleri birlikte yüklenmelidir. Eski oy belirteci güvenle reddedilir.

## 9. Değişiklikler ve açık riskler

Ürün: `ui.js` panel sahipliği/oy/war yönlendirmesi; `archive-ui.js` sabit kimlikli savaş görünümü; `diplomacy.js` oy kimliği, bitiş nedeni ve kişisel ambargo sahipliği; `research/mp0/mp-core.js` oy/explicit p6 uyumu; `research/mp6/mirror.js` kamu oy/war görünümü; `research/mp6/client/guest-stars.js` pending/ACK/bağlantı kuşağı. Build/PWA/MP işaretleri ve manifest/ZIP güncellendi. Testler ve tam metin `beta-p01-reviewed.json` farkları, BETA0 kaynaklarına geri dönüş hash'iyle sabittir; hash beklentileri gevşetilmedi.

Özel mp-critical A1'in ilk mp6Conn hatasında eski yardımcı özgün Playwright metnini değiştirmişti; geriye dönük metin elde edilemedi. Yardımcı artık özgün name/message/stack ile hedef anlık durumunu ayrı yazar ve aynı hatayı fırlatır. Tam MP73 KATIL hatasının [özgün mesajı](evidence/beta-p01/mp73-full/tapfail-1-playwright-error.json) saklandı; visible/enabled/stable ve scroll geçtikten sonra performing tap action aşamasında8s timeout. Köke ilişkin ürün/test/ortam ayrımı bu kanıtla kesinleşmez.

Açık: aralıklı Chromium/tap lobi hatası; üç insanlı UI senaryosunun tamamlanması; geçmişte kaydedilmemiş savaş alanları; fiziksel dokunma/Android ve canlı internet kabulü. Eski gerçek oyun savaş bitiş nedeni geriye dönük kanıtlanamaz. Bütün beta engelleri kapanmış sayılmadı; yeni büyük özellik eklenmedi.

## 10. #33 durumları ve kullanıcı onayı

Asıl kaynak [#33 takip panosu](https://github.com/sarsiss12-dot/Star/issues/33) **39 satırlıdır**; seçili ID'ler1,34,3,4,21 pano görevleridir. Diğer34 satıra dokunulmadı. Bu fazda bağımsız issue #5–#8 yeniden değiştirilmedi/kapatılmadı.

GitHub yazma **BLOKE**: mevcut beş satır kaynak okumasında PROMPT HAZIR; AJANA VERİLDİ/GELİŞTİRMEDE için ek yorum denemesi GraphQL Forbidden ile engellendi. Gerçekte güncellenmiş gibi sunulmaz. Son rapor/test/onay önerileri [seçili görev durumları](BETA-P01-GOREV-DURUMLARI.md) dosyasında. [İki cihaz manuel kabul planı](BETA-P01-KABUL-PLANI.md) henüz uygulanmadı; fiziksel sonuç değildir. Hiçbir görev kullanıcı açık onayı olmadan TAMAMLANDI değildir.

Otomatik onay denetimi, #33 gövdesinin tamamını HTML'den çıkarılmış kopyayla değiştirmeyi veri kaybı riski nedeniyle reddetti. Reddedilen işlem çalıştırılmadı veya dolaylı yolla tekrarlanmadı. Daha güvenli ek yorum da API Forbidden ile engellendi; main birleştirmesi ve canlı dağıtım için kullanıcı onayı hâlâ yoktur ve bu işlemler yapılmadı.
