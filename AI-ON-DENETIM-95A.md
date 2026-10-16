# Faz 95A — başlangıç denetimi ve dar kapsam

Kanonik kaynak: stars-faz94d1.zip; SHA-256 `0a0ac5e4981dd9308131789fb3882ababe4e1ae103d68a07825182580d74c133`. CRC ve manifestteki 1370 dosya hash’i doğrulandı. GitHub main yayın commit’i verilen c0fd7355beabee251a2629010a7b4b4a69740e42 ile aynıydı; 15 Ekim geliştirme notu aynen korundu.

## Mevcut çalışan davranış

93D.1 ücretli çok tersaneli üretim, sınıf şablonları, takviye bütçesi ve kaynak/kapasite kapıları mevcut. 94B keşif rezervasyonu ve güvenli rota planlayıcısı mevcut. Üç araştırma dalı/özel teknolojiler ve AI konsey kurma girişimi mevcut. Bunlar yeniden yazılmayacak.

## Önce kanıtlanan eksikler

1. Gerçek `warAppetite` ve `threatAt` probunda görüş dışındaki filoya 20 zırhlı eklenince savaş oranı 0,367847→0,005842 ve yerel tehdit 105→23109 değişti. Bilinmeyen kuvvet karara sızıyordu.
2. Aynı inşaat gemisiyle aynı sistemde aynı yapıya iki `startStruct` çağrısı da başarılıydı; iki iş açılıyor, iki kez ödeme yapılıyordu.
3. 11/99/404 gerçek 120 aylık başlangıç kampanyasında savaş gemisi siparişleri 205/286/254. Eski düzenin donanma üretimi zaten çalışıyor; amaç ücretsiz üretim artırmak değil.
4. Dosta yönelik ağır operasyonlar ve keşif/ikmal beklemeleri var. Ayrı fısıltı/sahte bayrak yolları standart operasyon filtresini atlayabiliyor.
5. `aiSubmitTick` hami seçiminde kuvvete ağırlık veriyor, yardım rotası ve süresini doğrulamıyordu. Casuslar aktif operasyon yapmasına rağmen pasif casus atamasını AI başlatmıyordu.
6. Seçili doktrin ile etik türetimi karışabiliyor; katalogdaki eski `izolasyonist` anahtarı Fanatik Arındırıcılar demek. Ayrıca bu doktrinin diplomasi erken dönüşü askerî hareket bölümünü de atlıyordu.

Ham kanıtlar `tests/ai-95a/before-probes.json`, `before/` kampanyaları ve kaynak karşılaştırmasında. Düşük istihbaratlı totalPower sorgusu tek başına eksiksiz ihlal sayacı değildir; motorun yasal doğrulamaları ayrıca değerlendirilir.

## Uygulanan sınır

Ortak sensör/istihbarat gözlemleri; tahmin ve belirsizlik; bilinen rotayla kuvvet toplama/savunma; ulaşılabilir hami ve tekrar beklemesi; üç casusluk davranış sınıfı; fiziksel inşaat gemisi meşguliyet kapısı; kararlı iç ihtiyaç önceliği; değişmeyen keşif beklemesinin hesap maliyeti. Ekonomi, savaş, araştırma, kamera veya federasyon motoru yeniden yazılmadı. 95B/95C ve yeni UI sistemleri başlatılmadı.
