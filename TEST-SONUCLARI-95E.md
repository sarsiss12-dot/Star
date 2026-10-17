# Test sonuçları — 95E

**90 paket / 5,170 başarılı kontrol / 0 kalan hata.** Benzersiz son sonuçlar `tests/summary-95e.json`. İlk tam koşu: 89 paket, 5.070 başarılı / 43 başarısız. Kaynakla ilgili 17 takip paketi: 1.182 başarılı / 0 kalan. Dört yeni modülün son koşusu: 78 başarılı / 0 kalan. Yeni UI/save paketi ilk tam koşu listelendikten sonra eklendi. Aynı kontrolün tekrarları toplanmadı; her paketin son sonucu bir kez sayıldı.

## Hatalar ve yöntem

Ham ilk hata logları `tests/audit-95e/full`, sınırlı takip `followups`, ilk hedefli sonuçlar `*-first.log`, son modüller `isolation-final` altında. `development-notes.txt` her düzeltmenin nedenini tutar. Eski yükleme sırası beklentileri dört yeni dosyayla güncellendi; ilk ambargo gözlem bağlantısının yanlış operasyon yoluna da eklenmesi giderildi; orijinal teklif karşı-teklif callback yolu korundu; eksik 95D test yardımcısı doğrulanmış ZIP'ten aynen alındı. Bir takip betiği sözdizimi hatası testleri başlatmadan yakalandı; ham kaydı saklandı. İlk kampanya sayaç hatası ve gerekçeli tek yeniden ölçüm korunur.

Yeni testler olay tarih/ID/ad sürekliliği, tekrar üretmeme ve yükleme, gizli sayım/arama/koordinat/üyelik sınırları, kapasite/sabit, güvenli metin; altılı limitten bağımsız teklifler, çift kabul, doğrudan işlem tekrarını engelleme, expiry, yaptırım, ödeme, token, davet/oy; uzak rota/varış, çift maliyet/rezervasyon, iptal/manuel öncelik, yok olma ve fiziksel tamamlanma; viewport/mock giriş, modal callbackleri ve modül arıza yalıtımını kapsar.

95C.1 diplomasi, lojistik, mobil UI ve kalıcı kayıt dört koruma paketi takipte yeniden geçti. 95D harita ve savaş önizlemesi paketleri geri alınan kanonik yardımcıyla geçti. Bütün eski paketler ilk tam koşuda çalıştırıldı; başarısızlar sınırlı takipte düzeltildi. İlk başarılı testleri sebepsiz tekrar eden döngü kurulmadı.

## Uzun kampanya davranışı — Node/mock, gerçek cihaz değil

100 sistem, üç tohum, her biri 120 ay; 60. ayda gerçek serialize/deserialize. Hiçbirinde yürütme istisnası veya negatif/NaN stok gözlenmedi. Ölçüm dosyaları `campaign-11/99/404.json`. Olay/görev kaynaklarını değiştirmeyen son arıza yalıtımından sonra mevcut günlük kampanya paketi ayrıca çalıştırıldı.

| Tohum | Ay | Kullanılan AI inşaat filosu | Yapı başlangıcı | Gerçek bitiş | Sonuçsuz görev | Son kayıt bayt | Enerji sıfır devlet-ay | Mal kıtlığı örneği |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 11 | 120 | 1 | 1 | 1 | 0 | 375,352 | 0 | 0 |
| 99 | 120 | 3 | 12 | 10 | 8 | 270,020 | 54 | 11 |
| 404 | 120 | 4 | 8 | 5 | 10 | 316,570 | 34 | 47 |

Görev bekliyor/inşa oluyor ile bitmiş yapı aynı değildir. 99 ve 404'te düşük enerji/kıtlık örnekleri var; negatif stok bulunmaması ekonomik sağlık kanıtı sayılmaz. 11 tohumunda 95D karşılaştırması da 1 gemi / 1 başlangıç / 1 bitiştir. Aynı tohumun 95D kaydı 300.253, 95E kaydı 375.352 bayttır (+75.099, yaklaşık %25); bu toplam kampanya farkıdır, yalnız modül payload maliyeti olarak yorumlanmaz. AI güvenli inşa davranışındaki değişim nedeniyle genel kampanya RNG/oyun durumu eşitliği beklenmez; faz yeni rastgele çekim eklemez ve aynı sürüm/tohum yeniden üretilebilirliği korunur.

## Performans ve kapasite

Son ölçüm `performance.json`: 100 sistem / 13 başlangıç devleti, aynı hostta dönüşümlü 24×50 boş günlük tik. Medyan **0.05420 → 0.05576 ms**, P95 **0.14004 → 0.13358 ms**. Küçük host farkları Android FPS sonucu veya istatistiksel hızlanma iddiası değildir. Önceki yalıtım öncesi ölçüm de saklıdır: 0,04488 → 0,05008 ms medyan.

Dolu haber arşivinde olay ekleme medyanı 0.02141 ms; 1.000 kayıtta okunmamış sayımı 0.02076 ms. Zorlanmış kapasite: 1.000 görünür + 256 gizli haber, 512 bekleyen teklif, 16 görev = **2.370.727 bayt** tam kayıt. Aynı dünyanın üç modül alanı çıkarılmış biçimi 93.520 bayt; modül payload'ları haber 1.990.973, teklifler 283.140, görevler 3.051 bayt. Uzun tekrar metinleriyle ölçülmüştür; kapasite sonsuz değildir. Çok uzun kampanyada eski sabitlenmemiş haberler ve bitmiş kararlar tahliye edilir.

## Kabul sınırları

740×360, 360×740 ve 900×420 mock giriş/işaretleme kontrolü vardır; gerçek DOM ölçümü değildir. Mevcut native Skia Canvas paketleri geçti. Playwright Chromium ve headless-shell yürütülebilirleri kurulu olmadığından gerçek Chromium yerleşim/kaydırma ve fiziksel Android/PWA kabulü yapılmadı. Yön/arka plan testleri mock olay konağıdır; gerçek cihaz iddiası yoktur.

Manuel kabul: uzun başlık/klavye, haber ve devlet/konum dokunma, arşiv → diplomasi → aynı teklif, çok teklif, 16 görev, arka plandan dönme/yön değişimi, gerçek PWA yükseltmesi ve eski kayıt içe alma. Özgün oyuncu federasyon reddi ve eski gemi kökeni riskleri açık kalır.
