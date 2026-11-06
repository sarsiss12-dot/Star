# STARS — Beta açık işler envanteri

2026-11-06; MP.8.8 kanonik kaynak + kurtarılan MP.8.9. Özellik dondurma uygulanır; bu fazda isim/AI/casusluk sistemi yeniden yazılmadı.

## Kaynak ve yöntem

Dört issue GitHub web sayfasındaki özgün React verisinden title/body/state alanlarıyla okundu; dördü de **OPEN**. [Özgün içerikler ve kaynak URL'leri](evidence/mp89/recovery/issues-originals.json). REST API tek denemede Forbidden verdi: [hata](evidence/mp89/recovery/issues-api-error.log). Normal GitHub sayfaları erişilebildi; ağ/kimlik ayarları değiştirilmedi. Issue kapatılmadı veya yorum eklenmedi.

## Ana görevler

| Issue | Durum | Mevcut ve kanıtlı kapsam | Eksik / doğrulanmamış kapsam | Beta kararı |
|---|---|---|---|---|
| [#5 Kısa, doktrine uygun isimler](https://github.com/sarsiss12-dot/Star/issues/5) | **AÇIK / DOĞRULANMADI** | Mevcut benzersiz isim/elle isim girişi temeli var; yeni iki-kelime/doktrin hedefinin kabulü yok. | `main.js:empireName` hâlâ sıfatlı, çok kelimeli ve “ve Bağlı Dünyalar” biçimleri üretiyor. `ui.js:rollName` seçili mizacı geçirmiyor; AI adlandırması `assignAIIdentities` öncesinde. Özel isim RNG akışı, sekiz doktrin unvan havuzu, beş seed/11AI kabulü eksik. | **P2, beta sonrası.** Yeni RNG/AI riski bu faza alınmadı. |
| [#6 Multiplayer mimarisi/LAN/online/yetki](https://github.com/sarsiss12-dot/Star/issues/6) | **KISMEN TAMAMLANDI** | Host tek simülasyon; oyuncu→devlet yetkisi, filtreli misafir aynası, gerçek lobi/hazır/tasarım, diplomasi/karşı teklif/federasyon/vasallık komutları, yeniden bağlantı. MP73/74/75/N ve önceki MP fazları yerel Chromium kanıtı sağlar. | Gerçek LAN/Wi-Fi/PWA ve canlı internet bu fazda NOT RUN. İnternetsiz otomatik LAN keşfi veya tarayıcıdan TCP host vaat edilemez. Sohbet/emoji/sessize alma akışı mevcut istemci/protokol kaynaklarında bulunmadı. Tüm issue'nun cihaz kabulü tamamlanmadı. | **P0:** senkron, yetki/gizlilik, güvenli komutlar. **P1:** gerçek cihaz/ağ kabulü. Sohbet/discovery/host devri yeni sistemleri P2; kapsam sınırı beta notunda açıklanmalı. |
| [#7 Çoklu kayıt ve multiplayer devam](https://github.com/sarsiss12-dot/Star/issues/7) | **KISMEN TAMAMLANDI** | `MP4Save` IndexedDB listesi, manuel/otomatik kayıt, yeni başarılı kayıt sonrası auto temizliği, dosya aktarımı, paket doğrulama, saveId/oyuncu kimliği, devam lobisi/yeni oda mevcut. R testlerinde gerçek süreç kapanışı/devam var. | Ortak SP ana menüde istenen tam çoklu kayıt tarayıcısı, arama/filtre/adlandırılmış slot/migrasyon/host devlet değiştirme kapsamı tamamlanmış değil. MP listesi SP Load ekranıyla aynı özellik sayılmaz. Gerçek LAN/online yayın/discovery/erişilebilirlik NOT RUN. R3 aralıklı menü timeout'unun kesin kökü açık; son güçlü kabul sonuçları ana raporda. | **P0:** mevcut kaydı kayıpsız sürdürme, kimlik/koltuk güvenliği, bozuk kayıt rollback ve yedek. **P1:** kayıt listesi/silme/üzerine yazma UX. Tam SP çoklu-slot/discovery yeni faz; bu beta için yeni özellik olarak eklenmedi. |
| [#8 Casusluk UX sadeleştirme](https://github.com/sarsiss12-dot/Star/issues/8) | **AÇIK / DOĞRULANMADI** | 86A temeli var: Ağlar/Operasyonlar/Dosyalar; ortak `opsCatalog` ve `opQuote`, hedef seçimi ve geçmiş. Bu temel #8'in yeni UX kabulü değildir. | Aramalı tek hedef seçici, özet kartı, kategoriler/bağlamsal ana eylem ve “3 tıkta hedef→casus→operasyon” gerçek mobil kabulü yapılmadı. Başarı/ifşa ayrımı ve kilit nedenleri bütün akışta ayrıca incelenmeli. | **P2, beta sonrası.** Yeni UX, mekanik/RNG/AI değişmeden ayrı dar faz. |

## Alt kapsamların durumu

| İş | Durum | Öncelik / kanıt |
|---|---|---|
| Yerel bağlantı kopması sonrası aynı devlete dönüş, kararın tek uygulanması ve gizlilik | **TAMAMLANDI / KANITLI** — yalnız test edilen yerel kapsam | P0; [MP8 N9/0](evidence/mp89/N.log), [MP73 8/0](evidence/mp89/mp73.log) |
| A1/B1 önceki düzeltmelerinin yerel regresyonu | **TAMAMLANDI / KANITLI** — kalıcı olarak her ortamda hatasızlık iddiası değil | [MP74 7/0](evidence/mp89/mp74.log); [MP88 kök nedenleri](MP88-KARARLILIK-SONUC.md) |
| Kayıt/devamın dolu savaş/federasyon/vasallık ile iki temiz kabulü | **AÇIK / DOĞRULANMADI** — kabul çalışıyor | P0; son durum [MP89 ana raporu](MP89-PC-UI-KARARLILIK-SONUC.md) |
| PC UI Scale ve mobil koruma | **KISMEN TAMAMLANDI** | P1; kurtarılan UI uygulanmış, son kabul ana raporda |
| Save8/RNG, PERF.1/PERF.2, MP.8.6 koruması | **TAMAMLANDI / KANITLI** — kaydedilmiş regresyon kapsamı | [PERF1](evidence/mp89/perf1.log), [PERF2](evidence/mp89/perf2.log), [piksel](evidence/mp89/cache.log); nihai paket ayrıca doğrulanır |
| Gerçek PC/Android/LAN/online uçtan uca beta kabulü | **AÇIK / DOĞRULANMADI** | P1/P0 yayın kapısı; [manuel plan](MP89-MANUEL-BETA-PLANI.md). Render ve fiziksel Android bu fazda NOT RUN. |

Issue başlığının tamamlanmış görünmesi için alt kapsam PASS'leri yeterli sayılmaz. Boş politika alanının eşit yüklenmesi dolu savaş/federasyon/vasallık kabulü sayılmaz. Çalıştırılmamış cihaz/ağ testi yerel relay PASS'iyle değiştirilemez.

## Özellik dondurma ve sıradaki tek faz

**BETA.0 — Cihaz/ağ kabulü ve aralıklı giriş hatası tanısı.** Yeni mekanik eklenmez. Önce mevcut R3/PC otomasyon hatalarının ürün/test ayrımı, sonra manuel PC ve Android kabulü tamamlanır. Canlı servis bağlantısı ancak ayrı yetkili görevde değerlendirilir; bu fazda deploy/restart yoktur. #5, #8, yeni federasyon siyaseti/AI stratejisi/efektler bekler.
