# Beta sonrası iki ayrı dar faz

Durum: **PLAN / NOT RUN**. #5 ve #8 için ürün kodu değiştirilmedi; yeni AI, ekonomi, savaş veya casusluk mekaniği önerilmez.

## NAME.0 — #5 iki kelimelik, doktrine uygun adlar

Mevcut `empireName` uzun sıfatlı adlar üretir. `rollName` etik bilgisi geçirir; nihai AI doktrinleri `assignAIIdentities` sonrasında kesinleşir. Sadece unvan tablosunu değiştirmek mevcut RNG tüketimini ve isim benzersizliği döngülerini etkileyebilir.

- Sekiz doktrinin mevcut enum değerlerinden onaylı bir unvan tablosu çıkar; doktrin başına kısa unvan + tek özel ad ile iki kelime kabulünü tanımla. Kullanıcının elle girdiği adı değiştirme.
- Galaksi RNG'sinden ayrılmış özel isim akışı seed, devlet kimliği ve nihai doktrinle deterministik kurulsun. Eski isim üretim yolunun RNG tüketimini ve eski benzersizlik geçmişini koru; yalnız görünen adlar ayrı geçişte üretilsin. Bu ayrım eşdeğerlikle kanıtlanamazsa uygulamayı kabul etme. `Math.random` veya oyun RNG'sine fazladan çekim ekleme.
- AI adını nihai doktrin üzerinden seç; tek oyunculu rastgele ad düğmesi seçili doktrini kullansın. Eski Save8 yüklenince mevcut adlar yeniden üretilmesin.
- Seed11/23/42/99/404,11AI ve tüm sekiz doktrin için iki kelime/benzersizlik/yeniden üretilebilirlik testleri. İzin verilen ad alanları dışında başlangıç dünyası ve RNG aynı olmalı; aylık eşdeğerlik testleri farkları gizlemek için genel normalizasyon yapmamalı. Eski kayıt baytları korunmalı.

Önce isim ve RNG sözleşmesini belgeleyip test et, sonra yalnız ad üretim/sunum yolunu değiştir. P2; kritik beta kapılarından sonra.

## INTEL.UX.0 — #8 istihbarat arayüzü

Mevcut 86A Ağlar/Operasyonlar/Dosyalar ve ortak `opsCatalog`/`opQuote` temeli korunur.

- Tek hedef devlet seçici ve seçili hedef için ağ/casus/aktif görev özeti. Temas kurulmamış ya da bilinmeyen alanları görünür yapmak için yeni ayna alanı ekleme.
- Operasyonları mevcut katalogdan kategorilere ayır. Maliyet, ön koşul, başarı şansı ve ifşa riskini ortak teklif hesabından ayrı etiketlerle göster; bilinmeyen değeri tahmin etme. Yeni olasılık veya ücret formülü yazma.
- Mobilde hedef → uygun casus/ağ → operasyon akışını üç temel seçimle erişilebilir kıl. Mevcut zorunlu onay ve host yanıtı bekleme kapısı korunur; üç adım uğruna onayı kaldırma.
- Tek oyunculu ve misafir aynı temel paneli kullanır; misafir yalnız kendi görünür verisini alır. Komut kimliği/tekrar koruması ve kaynak düşümü mevcut host yolundan geçer.
- 800×360/960×540 dokunma ve PC %80/%100/%125 testleri; açık panel/odak/scroll korunması, kilit nedenleri ve bilinmeyen istihbarat kontrolü. Eski ve aday teklif hesabı, Save8/RNG, maliyet ve başarı/ifşa sonuçları aynı kalmalı.

Bu iki plan ayrı geliştirme fazlarıdır; birlikte geniş bir UI/AI yeniden yazımı yapılmaz. Chat/emoji, yeni federasyon siyaseti ve AI stratejileri ayrıca P2 olarak bekler.
