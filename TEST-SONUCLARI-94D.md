# Faz 94D — test sonuçları

| Ölçüm | Sonuç |
|---|---:|
| Tam regresyon paketi | 75 |
| Benzersiz başarılı kontrol | 4611 |
| Kalan hata / zaman aşımı | 0 / 0 |
| Önceki 94C kontrolü | 4583 |
| Yeni 94D senaryosu | 28 |
| Son etkilenen diplomasi merkezi | 45/45 |
| Son 94D hedefli tekrar | 28/28 |

Tam koşu: `STARS_TEST_LOGS=tests/logs-94d STARS_TEST_WORKERS=2 node tests/run-all.js`. Tamamı sıfır çıkış koduyla bitti; atlanan paket yok. Son iki küçük diplomasi kabul/UI kapısı değişikliğinden sonra yalnız etkilenen paketler tekrarlandı. `tests/summary-94d.json` bu bileşik kanıtı açıkça kaydeder. Tekrarlar toplam kontrol sayısını şişirmez.

Kamera, save/load, deterministik RNG, araştırma/özel teknolojiler, keşif, filo takviye/tersane ve ticaret bütünlüğü dahil önceki paketler korundu. Donanma kampanya paketi 120 aylık çoklu-tohum kontrolü ve devamlılık senaryolarını içerir. Bu faz için bağımsız yeni 360 aylık stratejik AI ölçümü yapılmadı.

## Hedefli kapsam

Vasal yaptırımı/ilan/vaat, bağımsızlık, eski kayıt, iki yönlü sensör/geçiş, ölü hükümdar, vasal devri, sadakat; gerçek bombardıman/çıkarma, hareket hâlindeki filo, bildirim tekilleştirme, fog, yalnız hedef gezegen devri, karma sistem koloni indeksleri, kuşatma ve save/load; yatay ağaç, uzak hedef/ETA/düzenleme; beş ekran bütçesi; eski kamera alanları; etiket çakışması ve sınır cache/geometri.

## İlk başarısız denemeler

Günlükler silinmedi. Eski dikey ağaç/eğim beklentileri yeni isteğe uyarlandı; reviewed hash korumaları incelenmiş kaynakla güncellendi. Yeni testte `undefined` karşılaştırmasının yardımcı varsayılanına takılması assert düzeltmesiyle giderildi. Son UI yaptırım kapısında null parya haritası 13 diplomasi kontrolünü bozdu; gerçek kod null korumasıyla düzeltildi, aynı 45 kontrol geçti. Başarısız test silinmedi veya atlanmadı.

## Otomatik testin kanıtlamadığı şeyler

568×320, 640×360, 740×320, 800×360, 960×540 kontrolleri CSS yapısı ve alan bütçesidir. Chromium kurulumu bir sınırlı denemede eksik ZIP indirmesiyle başarısız oldu; `tests/audit-94d/browser-install.log` saklıdır. Gerçek DOM kutusu/ekran görüntüsü ölçümü ve fiziksel Android kabulü yapılmadı. Native Canvas ölçümleri gerçek telefon GPU/WebView davranışına eşit değildir.
