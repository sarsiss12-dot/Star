# LOAD.0 — Tek oyunculu çoklu kayıt ekranı uygulama planı

Durum: **PLAN / NOT RUN**. BETA.0 içinde uygulanmadı. [#7](https://github.com/sarsiss12-dot/Star/issues/7) hâlâ KISMEN TAMAMLANDI. Önce açık kritik giriş kabulü tamamlanmalı.

## Mevcut sınır

Tek oyunculu `yildiz:save` tek son kayıt tutar. Ana menüde named slot, kayıt kartı, arama/filtre ve güvenli çoklu-slot geçişi yok. Multiplayer `MP4Save` listesi ayrı sistemdir; SP ekranının tamamlandığı anlamına gelmez. MP tarafında manuel12/otomatik3 sınırları, silme onayı ve dosya aktarımı var. BETA.0 aynı saatten kaynaklanan sessiz üzerine yazmayı giderdi.

## LOAD.0 kapsamı

1. **Depolama ve geçiş:** Save8 v8 metnine dokunmayan ayrı IndexedDB kayıt/özet deposu kur. Kimlik duvar saatiyle tek başına üretilmesin; atomik `add` ve çakışma hatası kullan. Slot adı, oluşturma/son oynama tarihi, devlet, seed/galaksi ve bayt/hash bilgisi ayrı metaveri olsun. Manuel ve otomatik kayıtları açıkça ayır; otomatik temizlik manuel slotları silmesin.
2. **Eski kayıt geçişi:** `yildiz:save` metnini önce yeni depoya kopyala, kalıcı yazmayı ve tam metin/hash eşitliğini doğrula, ancak sonra geçiş işaretini yaz. İlk sürümde eski anahtarı silme. Yarım geçiş/kota/DB engeli aynı eski kayıttan Devam'a dönebilmeli; tekrar geçiş ikinci kopya yaratmamalı. Listelemek veya metaveri okumak için aktif dünyada `deserialize` çağırma.
3. **Ortak arayüz:** Ana menü Yükle ekranında adlandırılmış kayıt kartları, tarih/devlet/galaksi özeti, arama ve manuel/otomatik filtresi sun. Son oynanan kayıt için hızlı Devam ekle; işaretçi yalnız başarılı yükleme sonrasında değişsin. Mevcut UI Scale ve yatay mobil düzen kullanılsın, ayrı PC arayüzü yazılmasın.
4. **Güvenli işlemler:** Yeniden adlandırma metaveriyi değiştirir. Silme ve üzerine yazma hedef adı/tarihiyle onay ister; eski sürüm bilgisi değişmişse işlem yeniden onaylanır. Yeni yazma tamamlanmadan eski kayıt silinmez. İçe aktarma önce boyut/biçim/sürüm/bütünlük ve tam motor sınır denetiminden geçer; hatada mevcut dünya, kamera, RNG ve eski kayıtlar korunur. Dışa aktarma ham Save8 yedeği sunar; HTML olarak ad göstermeyip metin olarak göster.
5. **MP sınırı:** MP paketlerini SP Save8 diye açma. Oda/oyuncu jetonları ve MP kayıt listesi ayrı kalır. Host devlet değiştirme, global saveId kilidi ve discovery bu fazın dışındadır. Mevcut MP paketindeki `build` eşitlik kapısını gevşetme; farklı build paketleri için ayrı, açık destek matrisi ve doğrulanmış dönüşüm gerekir.

## Küçük uygulama sırası

| Adım | Teslimat | Kabul kapısı |
|---|---|---|
| LOAD.0.1 | Depo, salt metaveri okuyucu, güvenli eski-anahtar geçişi | Aynı/geri saat, eşzamanlı sekme, kota ve yarım geçişte veri kaybı yok; eski kayıt baytları aynı |
| LOAD.0.2 | Kayıt kartları, filtre, adlandırma, hızlı Devam, onaylı silme/üzerine yazma | Klavye/fare ve gerçek dokunma; 800×360/960×540 ile PC %80/%100/%125 erişilebilir |
| LOAD.0.3 | Eski/bozuk Save8 ve işlem kesintisi regresyonu, paketleme/rapor | Save8/RNG, PERF.1/PERF.2 ve MP kayıt ayrımı korunur |

Hedefli testler: eski v8 yükleme; bozuk kayıtta tam rollback; aynı isimli iki bağımsız kayıt; yenileme sonrası kalıcılık; bir sekmenin eski slotu silmeye çalışması; kota doluyken son iyi kaydın korunması; geçişin iki kez çalışması; dışa/içe aktarımın bayt eşitliği; yanlışlıkla MP paketini seçme. Gerçek telefon/PC kabulü ayrıca manuel planda yürütülür. Kapsamlı yeni kayıt sistemi BETA.0'a eklenmedi.
