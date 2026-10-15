# Devam — STARS 94B

Kanonik giriş stars-faz94a.zip:
0948267ef48ae5c468a3cda103b8444ba0c44fbb729b79aa24b549bdff820524
ZIP CRC ve SHA-256 doğrulandı. GitHub kaynak alınmadı/yayın yapılmadı.

Önce FAZ94B-RAPOR.txt, KESIF-94B.md, KESIF-KARSILASTIRMA-94B.md,
ACIK-RISKLER.md ve ILERI-GELISTIRME-PLANI.md okunmalı.
Build 94b, PWA cache stars-v94b, Save v8.

Çalışan kod: main.js ortak keşif planlayıcısı, rezervasyonlar, güvenli rota,
ara düğüm kontrolü, manuel kontrol, durum satırı, eski kayıt normalizasyonu.
ai.js eski ayrı keşif döngüsü ortak fonksiyona yönlendirilir. İkmal geri
çekilmesi otomatik emirdir; bunu manuel emir sanıp f.auto kapatmayın.
combat.js ricat çağrısı otomatik olarak işaretlidir; başarısız hareket emri
çatışmayı düşürmemelidir. ui.js durdur/otomasyon düğmeleri keşif durumunu temizler.

Önemli korumalar:
- Planlanan güvenli yolu orderMove ile yeniden hesaplatmayın.
- Hedef rezervasyonunu tek global/saklanan tabloya çevirmeyin.
- Gizli korsan/düşman bilgisini hedef puanına katmayın.
- mv.to aktif bacağı rota başında kalır; yeniden planlama ışınlanma yapmaz.
- Otomatik ricat sonunda bilim gemisi otomatik keşfe döner; manuel emir dönmez.
- Güvenli rota yokluğu f.auto=false yapmaz. Bekleme ve ikmal dönüşü vardır.
- Yeni bilim gemisini tersanede başka araştırmacıya otomatik eklemeyin.
- Kamera, ekonomi, diplomasi, temel bilim ve askerî üretim motorlarını koruyun.

Hedefli test: node tests/faz94b_exploration_test.js
Tam koşu: tests/logs-94b/summary.json (ilk iki sürüm beklenti hatası görünür).
Düzeltilmiş nihai kanıt: tests/summary-94b-final.json ve logs-94b-followup/.
Başarısız ilk kontroller silinmedi; final rapor hangi kontrollerin yeniden
çalıştırıldığını listeler. Gereksiz tam regresyon tekrarı yapılmadı.

Sıradaki ana faz: 94C — Kapsamlı AI Kalite Kontrolü, Ekonomi, Savaş,
Diplomasi ve Stratejik Karar Denetimi. Otomatik başlanmaz. Ticaret kaynak
çoğalması/rota bütünlüğü denetimi bağımsız ve önceliklidir.
