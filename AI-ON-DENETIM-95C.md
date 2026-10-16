# 95C başlangıç denetimi

Kanonik ZIP SHA-256 ve CRC geçti; 1765 manifest kaydı eşleşti. GitHub main verilen yayın commit'iyle aynı (0 ileri/geri). 15 Ekim notu korunuyor. 95A hedefli 51, 95B hedefli 68 kontrol yeniden geçti.

- `aiMilitaryCampaign`: tek devletin gözlenen tehdide savunması, kendi kuvvetini toplaması, ikmal/rota değerlendirmesi var. Müttefik kuvvet paylaşımı yok.
- `orderMove`, `stepFleets`, `aiKnownRoute`, `findPathAllowed`: mevcut hareket, bilinen geometri, güncel geçiş ve kapılar var. Yeni hareket motoru gerekmiyor.
- 93B/93C sevkiyat, şablon ve takviye gerçek üretim/ödemeyi kullanıyor. Ortak sefer ek üretim yapmayacak.
- 95B siyasi kararları gerçek cepheleri sponsor/sefer kimliğiyle açıyor. Aynı düşmana bağımsız savaşlar ayrı; bu ayrım korunacak.
- 92A katkı defteri combat/ground/capture olaylarından gerçek aktöre yazıyor. Koordinasyon emri katkı yazmayacak.
- 92B/C/D varlık bazında paylaşım, oybirliği ve işlem güvenliği var. Koordinasyon mülkiyet devretmeyecek.
- Eksik: devletler arası ortak plan, toplanma/bekleme süresi, farklı ETA için çıkış zamanı, oyuncu destek talebi, rezervasyon ve geçersiz görevi durdurma.

Uygulama: mevcut AI sefer planına ortak kuvvet rezervasyonu; aynı emir/hareket motoruna verilen bilinen rotalar; 5 günde sınırlı değerlendirme ve ayda yeni plan; Save v8 ek alanı. UI mevcut panellere daraltılabilir bölüm. Doğal kampanyalara ek kontrollü gerçek ortak savaş ölçümü yapılacak.
