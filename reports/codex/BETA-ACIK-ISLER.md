# STARS — Beta açık işler envanteri

2026-11-06; BETA.0, doğrulanan MP.8.9 HEAD `74a57bc0eeac0f2b4db9106b247fe26c1d4eb865` üzerinden. Özellik dondurma uygulanır; bu fazda isim/AI/casusluk sistemi yeniden yazılmadı.

## Kaynak ve yöntem

Dört issue GitHub web sayfasındaki özgün React verisinden title/body/state alanlarıyla okundu; dördü de **OPEN**. [Özgün içerikler ve kaynak URL'leri](evidence/mp89/recovery/issues-originals.json). REST API tek denemede Forbidden verdi: [hata](evidence/mp89/recovery/issues-api-error.log). Normal GitHub sayfaları erişilebildi; ağ/kimlik ayarları değiştirilmedi. BETA.0 içinde dört normal GitHub sayfası yeniden okundu; hepsi OPEN ve özgün içerikleri aynı: [güncel özgün kayıtlar](evidence/beta0/issues.json). Issue API hatası tekrar araştırılmadı. Issue kapatılmadı veya yorum eklenmedi.

## Ana görevler

| Issue | Durum | Mevcut ve kanıtlı kapsam | Eksik / doğrulanmamış kapsam | Beta kararı |
|---|---|---|---|---|
| [#5 Kısa, doktrine uygun isimler](https://github.com/sarsiss12-dot/Star/issues/5) | **AÇIK / DOĞRULANMADI** | Mevcut benzersiz isim/elle isim girişi temeli var; yeni iki-kelime/doktrin hedefinin kabulü yok. | `main.js:empireName` hâlâ sıfatlı, çok kelimeli ve “ve Bağlı Dünyalar” biçimleri üretiyor. `ui.js:rollName` seçili mizacı geçirmiyor; AI adlandırması `assignAIIdentities` öncesinde. Özel isim RNG akışı, sekiz doktrin unvan havuzu, beş seed/11AI kabulü eksik. | **P2, beta sonrası.** Yeni RNG/AI riski bu faza alınmadı. |
| [#6 Multiplayer mimarisi/LAN/online/yetki](https://github.com/sarsiss12-dot/Star/issues/6) | **KISMEN TAMAMLANDI** | Host tek simülasyon; oyuncu→devlet yetkisi, filtreli misafir aynası, gerçek lobi/hazır/tasarım, diplomasi/karşı teklif/federasyon/vasallık komutları, yeniden bağlantı. MP73/74/75/N ve önceki MP fazları yerel Chromium kanıtı sağlar. | Gerçek LAN/Wi-Fi/PWA ve canlı internet bu fazda NOT RUN. İnternetsiz otomatik LAN keşfi veya tarayıcıdan TCP host vaat edilemez. Sohbet/emoji/sessize alma akışı mevcut istemci/protokol kaynaklarında bulunmadı. Tüm issue'nun cihaz kabulü tamamlanmadı. | **P0:** senkron, yetki/gizlilik, güvenli komutlar. **P1:** gerçek cihaz/ağ kabulü. Sohbet/discovery/host devri yeni sistemleri P2; kapsam sınırı beta notunda açıklanmalı. |
| [#7 Çoklu kayıt ve multiplayer devam](https://github.com/sarsiss12-dot/Star/issues/7) | **KISMEN TAMAMLANDI** | `MP4Save` IndexedDB listesi, manuel/otomatik kayıt, yeni başarılı kayıt sonrası auto temizliği, dosya aktarımı, paket doğrulama, saveId/oyuncu kimliği, devam lobisi/yeni oda mevcut. R testlerinde gerçek süreç kapanışı/devam var. | Ortak SP ana menüde istenen tam çoklu kayıt tarayıcısı, arama/filtre/adlandırılmış slot/migrasyon/host devlet değiştirme kapsamı tamamlanmış değil. MP listesi SP Load ekranıyla aynı özellik sayılmaz. Gerçek LAN/online yayın/discovery/erişilebilirlik NOT RUN. BETA.0 aynı saatli iki başarılı kaydın sessiz üzerine yazılmasını giderdi; yeni depo7/0 ve dolu R6/0 PASS. Eski MP paketinde farklı oyun build'i mevcut kapı nedeniyle reddedilir; Save8v8 uyumu bütün MP sarmallarının build göçü demek değildir. Global saveId kilidi yok; aynı kayıt ayrı odalarda bağımsız dallanabilir. R3 aralıklı menü timeout'unun kesin kökü açık; son güçlü kabul sonuçları ana raporda. | **P0:** mevcut kaydı kayıpsız sürdürme, kimlik/koltuk güvenliği, bozuk kayıt rollback ve yedek. **P1:** kayıt listesi/silme/üzerine yazma UX. Tam SP çoklu-slot/discovery yeni faz; bu beta için yeni özellik olarak eklenmedi. |
| [#8 Casusluk UX sadeleştirme](https://github.com/sarsiss12-dot/Star/issues/8) | **AÇIK / DOĞRULANMADI** | 86A temeli var: Ağlar/Operasyonlar/Dosyalar; ortak `opsCatalog` ve `opQuote`, hedef seçimi ve geçmiş. Bu temel #8'in yeni UX kabulü değildir. | Aramalı tek hedef seçici, özet kartı, kategoriler/bağlamsal ana eylem ve “3 tıkta hedef→casus→operasyon” gerçek mobil kabulü yapılmadı. Başarı/ifşa ayrımı ve kilit nedenleri bütün akışta ayrıca incelenmeli. | **P2, beta sonrası.** Yeni UX, mekanik/RNG/AI değişmeden ayrı dar faz. |

## BETA.0 güncellemesi

- **P0 kayıt veri kaybı TAMAMLANDI / KANITLI:** sabit duvar saatiyle iki başarılı yazmada ilk metin kayboluyordu. Yerel sıra ve atomik `add` ile düzeltildi. Eşzamanlı sekmelerde çakışan ikinci yazma açık hata verir, ilk başarılı kayıt korunur. [Önce FAIL](evidence/beta0/storage-before.log), [sonra7/0](evidence/beta0/storage-context-fixed.log).
- **Yerel multiplayer TAMAMLANDI / KANITLI, test sınırında:** yeni R0–R4+misafir ölçek6/0, MP73 8/0 ve MP4 core14/0. Önceki MP89 N/74/75 kanıtları tekrar kullanıldı, yeni koşu yapılmış gibi sunulmadı. Planlı kayıt/kapanış desteklenir; kaydedilmemiş ani host çöküşünde son ilerleme garanti edilmez.
- **Giriş kökü AÇIK / DOĞRULANMADI:** altı viewport12/0 PASS,3440/960 CPU4×. Tarihsel tap/focus/launch hatalarının ortak kökü kanıtlanmadı. Eski FAIL korunur. Native Ctrl± headless denemesi zoom üretmedi: gerçek kabul NOT RUN.
- **#7 SP çoklu kayıt planı hazır, uygulama AÇIK:** [LOAD.0](LOAD0-PLAN.md). Eski tek kaydı silmeden kopyala/doğrula/işaretle; kota, sekme yarışı, silme/üzerine yazma ve import rollback kapıları.
- **#5 ve #8 ayrı P2 planları hazır, uygulama AÇIK:** [NAME.0 ve INTEL.UX.0](BETA0-P2-PLANLARI.md). Bu fazda geliştirilmedi.
- Silme başarısızlığının mesajı ve doğrulanmış MP build göçü P1; bildirim gizleme kayıt kimliği açık. Render, gerçek LAN/Wi-Fi ve fiziksel Android/PC kabulü NOT RUN.

## Alt kapsamların durumu

| İş | Durum | Öncelik / kanıt |
|---|---|---|
| Yerel bağlantı kopması sonrası aynı devlete dönüş, kararın tek uygulanması ve gizlilik | **TAMAMLANDI / KANITLI** — yalnız test edilen yerel kapsam | P0; [MP8 N9/0](evidence/mp89/N.log), [MP73 8/0](evidence/mp89/mp73.log) |
| A1/B1 önceki düzeltmelerinin yerel regresyonu | **TAMAMLANDI / KANITLI** — kalıcı olarak her ortamda hatasızlık iddiası değil | [MP74 7/0](evidence/mp89/mp74.log); [MP88 kök nedenleri](MP88-KARARLILIK-SONUC.md) |
| Kayıt/devamın dolu savaş/federasyon/vasallık ile iki temiz kabulü | **TAMAMLANDI / KANITLI** — yalnız yerel otomatik kapsam | P0; iki temiz R0–R4 PASS ve tam siyasi alan karşılaştırması; son durum [MP89 ana raporu](MP89-PC-UI-KARARLILIK-SONUC.md) |
| PC UI Scale ve mobil koruma | **TAMAMLANDI / KANITLI** — test edilen Chromium boyutları | P1; SP/MP80/100/125 ve mobil100 kabulü PASS; ayrı MP doku/gerçek cihaz/Ctrl± sınırları ana raporda |
| Save8/RNG, PERF.1/PERF.2, MP.8.6 koruması | **TAMAMLANDI / KANITLI** — kaydedilmiş regresyon kapsamı | [PERF1](evidence/mp89/perf1.log), [PERF2](evidence/mp89/perf2.log), [piksel](evidence/mp89/cache.log); nihai paket ayrıca doğrulanır |
| Eski aralıklı R3/3440/960 giriş/otomasyon hatalarının kesin kökü | **AÇIK / DOĞRULANMADI** | P0/P1 yayın güvenilirliği; tekrar PASS kalıcı çözüm sayılmaz. |
| Gerçek PC/Android/LAN/online uçtan uca beta kabulü | **AÇIK / DOĞRULANMADI** | P1/P0 yayın kapısı; [manuel plan](MP89-MANUEL-BETA-PLANI.md). Render ve fiziksel Android bu fazda NOT RUN. |

Issue başlığının tamamlanmış görünmesi için alt kapsam PASS'leri yeterli sayılmaz. Boş politika alanının eşit yüklenmesi dolu savaş/federasyon/vasallık kabulü sayılmaz. Çalıştırılmamış cihaz/ağ testi yerel relay PASS'iyle değiştirilemez.

## Özellik dondurma ve sıradaki tek faz

**BETA.1 — Aralıklı giriş hatasının hata-anı kanıtı ve kabul kapısı.** Yeni mekanik eklenmez; tarihsel menü problemleri kesin çözülmüş sayılmadığı için önce bu yayın güvenilirliği kapısı kapanır. Gerçek cihaz/ağ kabulü [manuel plan](MP89-MANUEL-BETA-PLANI.md) ve ayrıca yetkilendirilmiş koşullarla yürütülür; BETA.0 içinde yapılmadı. Bu kapı kapanınca hazır LOAD.0 planı sonraki ana geliştirme adayıdır. #5/#8/chat/emoji/AI ve siyasi özellikler P2 olarak bekler.

[BETA.0 ana sonuç ve test sınırları](BETA0-SONUC.md).
