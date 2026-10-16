# Faz 94D.1 — test sonuçları

| Ölçüm | Sonuç |
|---|---:|
| Paket | 76 |
| Başarılı kontrol | 4645 |
| Kalan hata | 0 |
| Zaman aşımı | 0 |
| Atlanan paket | 0 |
| Yeni hedefli paket | 34/34 |
| 94D referansı | 75 / 4611 |

Komut: `STARS_TEST_LOGS=tests/logs-94d1 STARS_TEST_WORKERS=2 node tests/run-all.js`.
Tam koşunun ham sonucu tek teklif-kapatma hatası içerir; ortak notify kapısı eski davranışına döndürüldükten sonra ilgili teklif, inbox ve yeni savaş paketleri tekrar geçti. Bileşik son sonuç yukarıdadır; ham tam koşu sonuçları `tests/logs-94d1/summary.json`, teslim özeti `tests/summary-94d1.json` içindedir. Tekrarlar başarılı kontrol toplamını şişirmez.

34 yeni senaryo: oyuncu/karşı taraf ilanı, kesirli oyun günü, duraklatma açık/kapalı, ayar, sefer tekilleştirme/kapatma, Save v8 ve eski savaş, barış sonrası yeni savaş, savunma yasası var/yok, çok savunmalı tek sefer, hükümdar/vasal/söz/bağımsızlık desteği, doğru diplomasi hedefi, gizli ortaklar ve güç bilgisi, eski wardec, çoklu savaş/tek çizgi, tek temas/istihbarat/keşif/güncel görüş uçları, görünür alternatif, bağımsız katman, Canvas/RNG, pan/zoom, eski sınır olayı, ilişki/RNG, gerçek hafıza, mobil alan ve codec doğrulaması.

## Kısıtlı tekrarlar ve ilk hatalar

- İlk hedefli pakette iki test sürücüsü beklentisi yanlıştı: modal hook yerine genel aksiyon çağrısı ve zoom çapasına denk gelen örnekte zorunlu konum değişimi. Testler doğru etkileşim/koordinatla düzeltildi; silinmedi.
- Gerçek kayıt probu kesirli günü ortaya çıkardı. İlk yeni codec tam sayı beklediği için bildirim oluşmuyordu. Gün doğrulaması gerçek simülasyon zamanını kabul edecek şekilde düzeltildi; kalıcı kesirli gün/save-load testi eklendi.
- Bu bulguda ilk tam koşu bilerek durduruldu. `tests/logs-94d1-pre-fractional` ve `partial-pre-fractional.log` korunur; bunlar son tam koşunun sonucu olarak sunulmaz.
- Tam koşuda “kapatmak ret sayılmaz” kontrolü, ortak notify kapısına eklenen açık-kart kontrolünün normal diplomatik teklifleri de bastırdığını kanıtladı. Ortak kapı 94D davranışına döndürüldü; savaş tekilleştirmesi defterde kalır. Savaş/eskimiş sınır kartı açık referansı explicit close sırasında temizlenir; yeni hedefli kapatma testi artık gerçek open/close/load yolunu kullanır. İlgili paketler yeniden doğrulandı. Ham hata kaydı korundu.
- Benchmark'ın ilk kurulumunda testin intel nesnesi başlatılmamıştı; ölçüm öncesi test düzeneği düzeltildi, üretim kodu değişmedi. Not dosyası saklıdır.

Gerçek Android, gerçek tarayıcı DOM yerleşimi veya telefon GPU/ısı/bellek testi yapılmadı. Native Canvas ve pointer simülasyonu bu kabulün yerine geçmez. Host ölçüm ham verisi `tests/audit-94d1/war-map-performance.json`.
