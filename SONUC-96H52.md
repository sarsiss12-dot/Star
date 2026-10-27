# STARS — FAZ 96H.5.2 SONUÇ RAPORU

**Karar:** Yeni oyun 96H.5.2; build `96h52`, PWA `stars-v96h52`, Save8 korunur. GitHub’da yeni oyun yayımlandı. Yayın sonrası doğrulama tamamlandı.

## 1. Kanonik kaynak
`sarsiss12-dot/Star`, `main`; başlangıç ve yayın öncesi doğrulanan HEAD: `1f5b43915781e6fcd934cd93609c0360f7b8ea7c`.
96H.5 ZIP: 756007 bayt; SHA-256 `fa50f80f7f214d56e779e63a5a8a2382574e381b78ea5c63da4a76d24b4c7cf9`. 20 üye, CRC, manifest ve 19 runtime dosyası birebir PASS. 96H.5.1/96H.6 araştırmaları korunmuştur; reddedilmiş AI adayları uygulanmamıştır.

## 2. Federasyon ekranı
Tek uzun sayfa, Genel / Üyeler / Oylamalar / Yasalar / Askerî / Yönetim sekmelerine ayrıldı. Her bölüm kendi kaydırma alanını kullanır; sekmeye dönüşte kaydırma ve açılmış ayrıntılar korunur. Yatay ekranda kullanılabilir genişlik artar. Üyeler ve temel yasalar tablo; uzun hükümler açılır ayrıntıdır. Uzun listelerde ilgili sekmenin içinde kaydırma hâlâ mümkündür.

## 3. Ayrılma
Yönetim sekmesindeki görünür FEDERASYONDAN AYRIL düğmesi önce sonuçları gösterir. Onay verilmeden işlem olmaz; iptal edilmiş veya yükleme öncesinden kalmış düğme işlem yapamaz. Mevcut `leaveFederation` kullanılır: üyelik bonusları ve karşılıklı üye ittifakları biter, yeniden giriş 24 ay bekler, mevcut savaşlar silinmez. Başkanlık ve federal gemiler mevcut ardıllık/dağılma kuralından geçer.

## 4. İhraç
Üyeler tablosunda İHRAÇ ÖNER bulunur. Mevcut `canFedMotion` / `proposeFedMotion` kullanılır; 80 Etki, hedef dışında en az iki üye ve mevcut çoğunluk/ağırlık hesabı korunur. Hedef kendi ihracında oy kullanamaz; arayüz bu gündemde oy hakkı olmadığını belirtir. Kilit nedenleri görünürdür. Başarılı/başarısız ihraç, başkan ayrılışı ve iki üyeden az kalınca dağılma mevcut motor testlerinde doğrulandı. Ayrılanın bağımsız savaşları korunur.

## 5. Diplomatik karar penceresi
Ticaret bildirimindeki eski pencere ayrımı kaldırıldı; desteklenen bildirimler ve federasyon panelindeki oy düğmesi aynı kayıt ayrıntısını açar. İşlemler `DiplomaticInbox.resolve`, `castFedVote`, `executeDeal`, `vassalReply` ve mevcut fonksiyonlardan geçer. Vasallık sözleşmesinin mevcut özel müzakere düzenleyicisi korunur. İkinci işlem motoru kurulmadı.

## 6. Anlaşılır etkiler ve kayıt
Oylama hedefi, önereni, kabul sonucu, gerçek çoğunluk kuralı, kullanılan/beklenen oylar ve son tarih görünür. Savaş izni ile savaşı gerçekten uygulama ayrılır. Refah Şartı mevcut gerçek gelir etkilerini açıklar. Anayasa seçenekleri Türkçe adlarıyla açıklanır. Ticaret reddinin mevcut −5 ilişki/27 ay tekrar bekleme etkisi yazılır. Bildirimi açmak kaydı silmez. Süresi dolmuş/eski oylama kaydı yeni gündemin hükümlerini göstermez; çift işlem ve Save8 sonrası eski düğme korumaları korunur.

## 7. Savaş/vassallık araştırması
Kontrollü gerçek motor fixture’ında hata kanıtlandı: düşman federasyon savunmasıyla ortak sefere karşı savaşırken oyuncuya vassal olduğunda yalnız oyuncu cephesi kapanıyordu. Diğer ortak cepheler açık kaldığı için sonraki `vassalTick` senyörü kendi federasyon ortaklarına savaş açtırabiliyordu. Aynı Save’den eski ve yeni runtime karşılaştırıldı; RNG aynı kaldı. Eski sonuç oyuncunun 1 ve 2 numaralı ortaklarına savaş açması; yeni sonuç ittifakların korunmasıdır.

## 8. Sınırlandırılmış motor düzeltmesi
`subjugationFedPeace`, senyörün mevcut federasyonundaki üyelerin yalnız kanıtlanmış aynı campaign/aynı taraf cephelerini kapatır. `subjugate` bu yardımcıyı kullanır, biten senyör-vassal savaşının eski yetki metaverisini temizler ve defteri eşler. Mevcut vekil savaş çözümü çalışmaya devam eder. Ayrı campaign ile açılmış üçüncü devlet savaşı; hatta ayrı savaş açmış bir federasyon üyesinin bağımsız cephesi otomatik silinmez. Kaynağı bilinmeyen legacy cepheler topluca kapatılmaz. Koruma şartı varsa senyör meşru devam eden veya yeni savaşa mevcut motor üzerinden katılır; koruma yoksa zorlanmaz.

## 9. Kullanıcı olayının sınırı
Gerçek kullanıcı Save’i mevcut değildir; dokuz görüntüden olayın birebir yeniden üretildiği iddia edilmez. Savunma yükümlülüğü tek başına oyuncuya Boyun Eğdirme hedefi atamaz. Mevcut `boyun` hedefi tamamlandığında otomatik vasallık motoru çalışır; bu yol test edildi. Kullanıcının hedefi hangi önceki karardan geldiği Save olmadan kesinleştirilemez. Eski hedeflerin sonraki savaşlara taşınma ihtimali ayrıca Save üzerinden incelenebilir; bu fazda hedef seçme sistemi değiştirilmedi.

## 10. Vassal yönetimi
Oyuncunun vassalının diplomasi sayfasında VASSAL YÖNETİMİ doğrudan bulunur. Tür, vergiler, araştırma, koruma, savaş yükümlülüğü, diplomatik özerklik, sensörler, süre, sadakat/bağımsızlık arzusu ve devam eden savaşlar görünür. Yeniden müzakere için X ay kaldı açıkça yazılır. Mevcut `vassalOffer(...,'renew')`, üç tür, düzenlenebilir hükümler, kabul/ret/karşı teklif ve ücret/beklemeler korunur. Düşük ilişki veya 45 sadakat tek başına motor hatası sayılmadı; mevcut etkenler açıklanır.

## 11. İnşa paneli
Yeterli panel genişliğinde üç sütun; dar panelde iki sütun. 844×390 tarayıcıda üç, 390×844 yerleşiminde iki sütun doğrulandı. Bina adı/sayı/maliyet korunur. 62px kart, bağımsız 44px yıkım hedefi, inşa hedefinin yıkım alanını dışlaması ve dokunma sonrası korumalar değişmedi. İnşa/yıkım onayı, stoklar, kuyruklar ve fiyatlar korunur.

## 12. Filo paneli
Tümü / Savaş / Bilim / Koloni / İnşaat / Bekleyen filtreleri eklendi. Aynı sistemdeki uygun bekleyen filolar görsel grupta açılır. Çok uzun sistem filo listesi de açılır ayrıntıya alınır. Gerçek filolar, emirler veya gemiler otomatik birleştirilmez; sivil emirler, mevcut askerî birleştirme ve otomatik keşif değişmez.

## 13. Değiştirilen runtime
`ui.js`, `archive-ui.js`, `diplomacy.js`, `index.html`, `main.js`, `sw.js`: 6 dosya. Yeni/uyarlanan başlıca sunum fonksiyonları: `openFed`, `fedMembers`, `fedMotionButton`, `confirmFedLeave`, `fedGovernance`, `fedAgendaContext`, `fedVoteOpen`, `openNote`, `vsContract`, `p_filo`, `ArchiveUI.record/decisionContext/act`. Motor: `subjugationFedPeace`, `subjugate`. Manifest ve kanıt/test dosyaları ayrıca güncellendi.

## 14. Test sonucu
Tam regresyon: 134 benzersiz paket, **6055 PASS / 0 FAIL**, atlanan paket yok. Yeni politika testleri 27/0 bu toplama dahildir. İlk tam koşuda eski teklif hook adları nedeniyle 8/16 çıkan paket, aynı ret/ücret/RNG/çift işlem iddiaları korunarak yeni düğmelere uyarlandı ve 24/0 geçti; eski ve yeni sonuçlar toplanmadı. Ön hedefli koşulardaki eski tek sayfa/hook beklentileri ve UI koruma kapsamı da açık loglarla korunur.

## 15. Save8, RNG ve korunmuş sistemler
Save şeması v8. Yeni zorunlu kayıt alanı veya RNG çekimi yok. Savaş sırasında yükle/devam fixture’ı aynı sözleşme, cephe, emir ve RNG sonucunu verir. Ekonomi, AI, ticaret motoru, casusluk, inşa/üretim motoru ve oy hesabı fonksiyonları korunur. 13 runtime dosyası kanonik H5 ile bayt olarak aynı. AI SHA-256: `27ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739`.

## 16. Tarayıcı ve cihaz
Paketlenmiş runtime üzerinden Chromium/Playwright: **12 benzersiz senaryo PASS / 0 FAIL**, yakalanmamış sayfa hatası yok. Sekmeler, kaydırma/ayrıntı dönüşü, ayrılma/ihraç gerçek tıklamaları, ticaret kabulü, sözleşme, filo filtreleri, üç/iki sütun, yıkım ayrımı ve PWA çevrimdışı Save8 yükleme doğrulandı. Dikey görünümde mevcut çevirme katmanı ayrıca doğrulandı; yerleşim testi için yalnız test CSS’iyle gizlendi. Fiziksel Android: **NOT RUN**. Kullanıcı olayının kendi kaydından birebir tekrarı: **NOT RUN**. Yeni 240 aylık ekonomi kampanyası: **NOT RUN**, bu fazda gereksiz görülmüştür.

## 17. Oyun paketi
`stars-faz96h52.zip`: **763345 bayt**, 20 üye.
SHA-256: `c5c2debffd2cd6b17c158ae7150a74a3eed774cd00840b4222707fe4b845993c`
ZIP CRC32: `5d758998`
CRC ve 19 runtime manifest/hash karşılaştırması: **PASS**. `RELEASE-96H52.json` ve `RELEASE-MANIFEST.json` hazırlanmıştır. Kanıt paketi boyutu/hash’i ve son GitHub HEAD, yayın sonrası teslim raporuna eklenir.

## 18. Yayın doğrulaması
Yeni oyun `main` dalına force kullanılmadan yayımlandı. Oyun release commit: `941b7f532736da443647b8436bb15d9f053a0b3e`. Uzak depodan 19 runtime hash’i, manifest, yeni ZIP ve korunmuş H5 ZIP yeniden doğrulandı: PASS. Sonraki belge commit’i runtime’ı değiştirmez. `tests/audit96h52/github-verification.json` kanıtı içerir.

## 19. Açık sınırlamalar
Kullanıcı Save’i ve fiziksel Android yoktur. Legacy kaynağı belirsiz veya ayrı bağımsız savaşlar güvenlik için topluca temizlenmez; önceden bozulmuş kayıtların rastgele onarımı yapılmadı. Ayrı savaşlar sözleşmenin koruma yükümlülüğünü tetikleyebilir; ilgili savaşlar Vassal Yönetimi’nde görünür. Dar ekranda iki sütun ve mevcut yatay oynama yönlendirmesi devam eder. Her federasyon sekmesinin sınırsız içeriksiz tek ekrana sığdığı iddia edilmez.

## 20. Sonraki fazlara devir
96H.6.1 ekonomik zamanlama tutarlılığı; Seed404 tüketim krizi; Seed11 yeni devlet toparlanması; C2 bağımsız 240 aylık test; Yayılmacı yatırım finansmanı. Ayrı strateji fazı: Teknokrasi/Kutsal Meclis otomatik dağıtımı, sekiz doktrin çeşitliliği, 82 Makine/Arındırıcı araştırma-persona ayrışması ve doktrinlerin gerçek stratejik davranışı. Bu fazda hiçbiri tamamlandı veya yayımlandı sayılmadı.
