# Faz 95A — test sonuçları

| Ölçüm | Son sonuç |
|---|---:|
| Benzersiz paket | 77 |
| Başarılı kontrol | 4696 |
| Kalan hata | 0 |
| Zaman aşımı | 0 |
| Atlanan paket | 0 |
| Yeni 95A hedefli kontrol | 51 |
| 94D.1 referansı | 76 / 4645 |

Tam regresyon komutu: `STARS_TEST_LOGS=tests/logs-95a STARS_TEST_WORKERS=2 node tests/run-all.js`.

**Sonuç birleştirme:** Tek tamamlanmış tam koşu 77 paket / 4688 başarılı / 6 hata verdi. Sonrasında yalnız ilgili paketler ve yeni hedefli paket tekrarlandı; iki ek hami bilgi testi yeni paketi 49’dan 51’e çıkardı. Son benzersiz toplam 4696’dır; tekrarlar toplanmadı. Ham tam sonuç `tests/logs-95a/summary.json`, final bileşik `tests/summary-95a.json`, kanıt dizini `tests/audit-95a/followup-index.json`. Tek paketlik takip koşularındaki SKIPPED satırları, o takipte seçilmeyen fakat tam koşuda çalışmış paketlerdir; toplamda atlama yoktur.

## İlk hatalar ve düzeltmeler

- 86C.1 ve 86E’nin stok bilgisine göre karşı teklif senaryoları, yeni bilgi sınırında açıklanmamış yabancı stok varsayıyordu. İlgili senaryolara açık seviye 3 bilgisi eklendi; aynı kabul/karşı teklif/ret ve sıfır mutasyon iddiaları korundu.
- 91E.1 gerçek AI federasyon savaş izni testi artık bilinen ve ulaşılabilir hedef/kuvvet kurar. AI’nın savaş izni istemesi, iznin otomatik savaş açmaması ve normal ilan yolunun izni tüketmesi aynı şekilde sınanır. Federasyon mekanikleri değiştirilmedi.
- 86C.4 gerçek otomatik önerilerinde uygulanamayan karşılıklar, quote kapısında ücret/RNG tüketmeden bekleme durumuna alınır. Ön kontrol/tekrar aralığı eksikliği giderildi; geçersiz manuel teklif hâlâ açıkça geçersizdir.
- 86F ölçümü yeni tekrar-bekleme yanıtında `tur` olmadığından NaN oluyordu. Üretim yanıt sözleşmesi `tur:0` ile tamamlandı; iki tur sınırı ve gerçek ölçüm tekrar geçti.
- Önceki hedefli denemelerde dost casusluk senaryoları yeni politikayla çelişiyordu: meşru aktif operasyon için nötr ilişki; ağır sabotaj/çıkarma için savaş kuruldu. Dost engelleri ayrıca yeni pakette test edilir. Eski regex kontrolleri beşinci otomatik-çağrı parametresini kabul edecek şekilde güncellendi.
- Dört argümanla sınırlı eski ölçüm sarmalayıcıları otomatik bekleme parametresini düşürüyordu; tüm ilgili sarmalayıcılar argümanı geçirir. Gözlemci açık/kapalı eşitliği tekrar doğrulandı.
- İlk yeni testlerde görülebilen ara düğümü gizli sayan kurulum, toplanma noktası eşitlik sırası, undefined varsayılan assert değeri ve konsey başlangıç saati/RNG düzeltildi. Gerçek koruma kilidi de hem kayıt bayrağı hem canlı Colossus görevi üzerinden korunur. Hiçbir başarısız kontrol silinmedi.
- Ortak keşif bağlamının `visible` kümesini döndürmemesi ilk entegrasyon çalıştırmasını durdurdu; mevcut sensör hesabının sonucu dışarı verildi. Ayrı ikinci bir görüş sistemi eklenmedi. İlk başarısız ölçüm günlükleri saklandı.
- İlk yapı bitiş gözlemcisi iş alanını `k` sanıyordu; gerçek alan `key` ile düzeltildi. İlk dost operasyon sayacı ambargo delme ve özel teknoloji yolunu ağır sınıfla karıştırıyordu. Ham önceki ölçümler korunur; son rapor açık sınıflandırmayla hazırlanır. Bu nedenle başlangıç ölçümü bir defa aynı düzeltilmiş sürücüyle yenilendi.

## 51 yeni senaryo

Gizli filo/güç/tehdit mutasyonu; görülen kuvvet; seviye 3; yanıltma/çalınmış plan/süre; eski sahiplik ve gözlem; gizli stok/teknoloji ve açık teklifler; üçüncü taraf savaşı; öğrenilmiş rota/kapalı sınır/korsan; gizli yabancı kapı ve motor; rota sürekliliği; savaş erişimi; yetersiz kuvvet toplama/yeterli ortak çıkış/öncelikli savunma/koruma kilidi; hedef penceresi; ulaşılabilir hami/bağımsızlık koruması; dost-müttefik-vasal casusluk kapıları; pasif casus slotu/gerçek bilgi; fısıltı; teklif bekleme ve geçersiz otomatik ön kontrol; inşaatın tek ödeme/tek iş/bitme-serbest kalma akışı; sekiz seçili doktrin; strateji istikrarı ve darboğaz; mevcut AI konsey girişimi; bekleme maliyeti ve tehdidin kalkması; Save v8 ve kesirli gün; eski kayıt; RNG saflığı.

## Kampanya ve devamlılık

- 11/99/404: normal/orta galakside aynı koşullarla 120 ay, önce ve sonra.
- 99: korsansız 240 ay, önce ve sonra.
- Ek 404 düşük stok stresi ve büyük/korsansız 99 örneği; büyük 94D.1 örneğinin doğal oyun sonu 109 ay olduğu açıkça işaretlidir.
- Son kaynakla 99 / 120 ay: tekrar aynı save hash’i; 60. ayda yükleme sonrası aynı RNG ve cache dışı tam oyun durumu; gözlemci kapalı aynı oyun durumu. Yalnız eski türetilmiş `_prof`, `_supAt`, `_gateAt` alanları yükleme sonucunda değişebilir; bütün ham farklar `tests/ai-95a/continuity/result.json` içinde. Hiçbir yeni `aiIntel`/strateji/kuyruk alanı karşılaştırmadan çıkarılmadı.
- Bilim, ticaret bütünlüğü, filo takviyesi, 2B kamera, pointer/Canvas kurtarma, PWA ve mevcut native Canvas paketleri tam koşuda yer alır. Sayılar ayrı doğrulamaları iki kez saymaz.

Gerçek Android cihazı, gerçek tarayıcı DOM yerleşimi, telefon GPU/ısı/bellek ölçümü yapılmadı. Önceki otomatik kontroller bunların yerine geçmez. Harici üretim kütüphanesi veya asset eklenmedi.
