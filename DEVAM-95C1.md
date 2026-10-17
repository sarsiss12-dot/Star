# Devam noktası — 95C.1

Kaynak `stars-faz95c.zip`, SHA-256 `ba8f588a7b31ec7d0f7b997a5f04f432fa45fa67c190fb07ea21ed25b9a13537`; yayın `0626b90a889dc3edb72687d86eea1f50a4702add`. Kaynak CRC, 2003 dosyalı manifest ve 11 GitHub üretim blob'u doğrulandı. Yeni sürüm Save v8 / build 95c1 / PWA stars-v95c1. 83 paket / 4.923 başarılı kontrol / 0 kalan hata; benzersiz tek tam koşu + hedefli takip.

Üretim değişiklikleri: `main.js`, `map.js`, `diplomacy.js`, `economy.js`, `ui.js`, `index.html`, `sw.js`. AI strateji ve muharebe kaynakları aynı. Mevcut motorlar yeniden yazılmadı. Ayrıntılı yamayı `tests/audit-95c1/production.patch` ve değişiklik listesini incele.

Yeni: tam nedenli federasyon aday kapısı ve türler; yaptırımla tutarlı pakt; geçerli/ödenebilir AI bildirimi; manuel güvenli miktar; özel Taht yeniden inşa kilidi; sevkiyat kaynak ve gerekçeleri; destek önizlemesi; bağımsız savaş hatları; sabit +N; ayrı bina yıkımı/sayacı; net bilim; köken açıklaması; kalıcı kayıt sonucu; filo bazlı rota uyarısı.

Otomatik takviyenin araştırma atladığı ve yeterli Etkili geçerli kurucunun yanlış reddedildiği yeniden üretilemedi. Bunları çözülmüş motor hatası diye yeniden yazma. Gerçek Taht yeniden inşa açığı düzeltildi; başlangıç gemileri korunur. Kullanıcının save'i gelirse özgün aday/filo nedenini ayrıca incele.

Testler tekrar tekrar çalıştırılmadı. Ham ilk tam koşunun 26 başarısız kontrolü ve sınırlı takipler korunur. Önce `tests/summary-95c1.json`, `TEST-SONUCLARI-95C1.md` ve şikâyet matrisi okunmalı. Yeni tam test gereği yok; yeni değişiklik veya manuel bulgu olursa ilgili paketten başla.

Kalan kabul: gerçek Android / gerçek DOM yok. Chromium ikilisi bulunamadı. Dar yatay ekranda bar kaydırma, bina sayacı/yıkımı, klavye, ortak talep, sevkiyat ve arka plan/kayıt denenmeli. Kaynak yedeği gerçek cihazdan dışa aktarılmalı. Başarısız rota teşhisinin küçük ama ölçülmüş maliyet artışı var; büyük geç oyun cihazda izlenmeli.

Önceki 95A/B/C raporları ve yol haritası korunur. Kapsamlı köken/portre, amblem/isim, haber, konvoy, ekonomi ekranı, müzik veya 95D geliştirmesine başlanmadı. GitHub'a yüklenmedi; yayın için ayrı kullanıcı talimatı beklenir.
