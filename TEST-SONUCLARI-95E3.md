# Test sonuçları — Stars 95E.3

Bu fazda yeni çalıştırılan **94 benzersiz test paketi / 5.203 başarılı kontrol / 0 kalan hata / 0 atlanan paket**. Ayrıca **66 benzersiz gerçek Chromium senaryosu / 0 kalan hata / 0 pageerror**.

- Tam motor koşusu: 93 paket, 5.193 kontrol. Çalışma sırasında sonradan eklenen katman paketi: 10 kontrol. Son build kimliği için beş paketin hedefli tekrarları önceki aynı adlı sonuçların yerine geçti. Toplama eski faz raporu veya tekrar koşu eklenmedi.
- Chromium: önceki 43 senaryo bu kaynakta yeniden çalıştı (ilk 42/1; panel reseti düzeltildikten sonra izole 1/0). Bu faza özel 23 senaryo çalıştı (22 senaryolu koşu + yeni ana Canvas amblem testi; son beş görsel takip aynı adlı önceki sonuçların yerini aldı). Toplam 66.
- Eski kaynakta kanıt: yeni sensör paketi 1/6; üç gerçek Chromium kök hata senaryosu 0/3; ana Canvas amblem/etiket örtüşmesi 0/1. Güncel kaynakta ilgili bütün senaryolar geçti.
- 740×360, 360×740, 1280×720; gerçek hedef/son onay DOM tıklamaları, çift tıklama, eski pencere/kayıt/şart değişimi, sensör kabulü ve gerçek filo hareketi, Canvas piksel ve amblem/etiket kontrolleri, mod/katman/zoom/kamera, v8 kayıt, gerçek worker yükseltme ve offline yeniden açılış.
- Portre Canvas kontrolünde mevcut döndürme tavsiyesi test CSS'iyle maskelendi. Bu test fiziksel Android veya portre oynanış kabulü değildir. Üretimde döndürme tavsiyesi korunur.
- Üç 120 aylık donanma kampanyası, deterministik tekrar ve gözlemci bütünlüğü de tam paketin içindedir. Yeni çıktılar tests/audit-95e3/campaign altında; tarihsel çıktı dosyaları kendi özgün halleriyle korundu.
- Anlaşma yokken bilim gemisi keşif/rota/tarama/RNG çıktısı 95E.2 ile eşit. 100 sistemli kontrollü sensör yenilemesi ~0,04 ms; 10.000 önbellek pVis sorgusu ~8 ms. Bu ölçüm büyük galaksi veya cihaz FPS garantisi değildir.

Tekilleştirilmiş makine sonuçları: tests/summary-95e3.json ve tests/audit-95e3/browser-summary.json. Ham ilk/ara/son loglar aynı denetim klasöründe saklanır. İlk tarayıcı hazırlığı, amblem renk sayımı, panel/menü reseti ve PWA yükleme sırası hataları FAZ95E3-RAPOR.md'de açıklanır.

Federasyon kuruluşu/üç tür/yasalar/oylamalar, savaş yükümlülükleri ve müttefik emirleri; teklif kabul/ret/karşı teklif; casusluk gizliliği; haber/gelen kutusu; olay aç/kapat; araştırma kilitleri; filo bileşimi/takviye/tersane; ticaret/ambargo; uzaktan inşaat ve Save v8 paketleri bu fazda yeniden geçti. Fiziksel Android/WebView/kurulu PWA, GPU/FPS/ısı/bellek kabulü yoktur.
