# Devam — STARS 94A

Kanonik kaynak stars-faz93e1.zip doğrulandı:
057a90635dc10a22e2a402d73c19ae02ebad5ca1ce49255d4cf5541bbffe02b8
Build94a; PWA stars-v94a; Save v8. GitHub kaynak alınmadı/yayın yapılmadı.

Önce FAZ94A-RAPOR.txt, KAMERA-94A.md, ACIK-RISKLER.md ve
ILERI-GELISTIRME-PLANI.md okunmalı. Tam regresyon kanıtı
 tests/logs-94a/summary.json; test başına loglar aynı klasörde.

Kamera: cam.a oturumluk açı; w2s/s2w ortak ters dönüşüm. Dünya dokuları
 drawWorldImage, döndürülmüş frustum ve hareketli gemi yönü aynı açıdadır.
Varsayılan kapalı rotationEnabled; sol araçlarda ↟/◎/⟳. Eğme uygulanmadı.
resetGesture/resize/recovery tek mekanizmada kalır; pointer bağlama jetonunu
ve eski yüzey listener sökümünü kaldırmayın. Wheel passive:false korunmalı.

Kritik regresyon dersleri:
- Çoklu teması hareket olmadan da blocked işaretle; son parmak tap sayılmasın.
- pointerdown sadece pan animasyonunu keser. rowHits normal dokunmadan önce
  silinirse üst üste filo satırı seçimi bozulur. Alanları kamera hareketinde sil.
- Pointerup temizliği tap işleminden önce kalmalıdır; UI hata atsa da pointer
  takılı kalmamalı. Resize/blur/cancel de tap üretmeden kapatır.
- Kamera açısı çizim ve ters seçimde aynı olmalı; yalnız görüntüyü döndürmeyin.

Hedefli: node tests/faz94a_camera_test.js
Tek vaka: STARS_CASE='inverse transform' node tests/faz94a_camera_test.js
Tam regresyon: STARS_TEST_LOGS=tests/logs-next node tests/run-all.js
Bütünlük: python3 tools/verify-release.py
Yerel açılış: python3 -m http.server 8000

Sonraki faz otomatik başlamaz. Ticaret bütünlük denetimi bağımsız ve
önceliklidir; diğer ileri işler yol haritasında korunur.
