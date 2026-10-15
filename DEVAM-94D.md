# STARS 94D — devam noktası

94D kod ve otomatik test teslimi tamamlandı. Build 94d, PWA stars-v94d, Save v8.
Kanonik girdi: stars-faz94c.zip, SHA-256 64196faf1d06da760a1d7c753506eb320982cdbb1808e14401351ddec3651f15.
Çıktı: stars-faz94d.zip; arşiv SHA-256 değeri teslim mesajında ve eşlik eden .sha256 dosyasındadır (kendi hash'i ZIP içine yazılmaz).

Önce FAZ94D-RAPOR.txt, ACIK-RISKLER.md ve TEST-SONUCLARI-94D.md okuyun. Dosya bütünlüğü için `python3 tools/verify-release.py` yeterlidir; bu oyun testi değildir. Mevcut başarılı uzun testleri gerekçesiz tekrarlamayın.

- Tam regresyon: 75 paket / 4611 başarılı kontrol / 0 kalan hata / 0 zaman aşımı.
- Son diplomasi kapısı değişiklikleri: 94D 28/28, diplomasi merkezi 45/45 tekrar geçti; tekil toplam artırılmadı.
- Ham günlükler: tests/logs-94d; ilk/son hedefli denemeler: tests/logs-94d-targeted.
- Önce/sonra kanıtları ve host performansı: tests/audit-94d.
- Kanonik üretim farkları: map.js, ui.js, index.html, main.js, economy.js, diplomacy.js, sw.js.
- AI ve combat motor dosyaları değişmedi; araştırma motoru yeniden yazılmadı.

Açık kabul sınırı: gerçek tarayıcı/Android görsel yerleşim testi yok. Chromium eksik indirme nedeniyle kurulamadı. Beş boyut testi yapısal CSS bütçesidir. Kullanıcının gerçek ekran görüntüsü/kaydı bu ortamda bulunmadığından birebir ekran doğrulaması iddia etmeyin.

95A veya yeni mekanik başlamadı. GitHub yayını yapılmadı; ayrı talimat gerekir. Eğik/döndürmeli kamera tekrar geliştirme listesine alınmamalı. Ticaret kaynak çoğalması için yeni kanıt çıkarsa ayrı öncelikli bakım açılmalı.
