# STARS AI-IKAME.0 sonuç raporu

19 Kasım 2026 · `96h10p45 / MP.8.9b44`

## Kaynak ve karar

Kontrol `codex/stars-perf-sinir0` dalının `0559cfbeaac4cd4f458ccfaab23c3228de82b1cd` HEAD’idir. Aday motor `655484364de66c16c283af1530c905e4641ccd73` ile ölçüldü. Kampanyalar araştırmanın aynı başlangıç ayarlarıyla açıldı. [PR #60](https://github.com/sarsiss12-dot/Star/pull/60) · [p44 raporu](PERF-SINIR0-SONUC.md) · [Araştırma](https://github.com/sarsiss12-dot/Star/blob/44c11195e31260c8e740c86689ed31a102d2e6b2/reports/codex/P43-AI-PERF-ARASTIRMA-SONUC.md)

AI, stratejik söküm için bir slot açıldığında alacağı ilk binayı mevcut bütçe, kuyruk, teknoloji ve tür sınırlarıyla önizler. Öncelik yıkılacak bina veya başka bir bina ise ya da sıraya alınabilecek iş yoksa sökümü erteler. İlk sıradaki hedefi bekleyen söküm işine ekler. Söküm süresi dolunca aynı hedefi güncel gelir ve kuyrukla yeniden değerlendirir. Hedef o anda da uygunsa bina sıraya girer, bedel bir kez kesilir ve hurda iadesi uygulanır. Hedef uygunluğunu kaybederse bina yerinde kalır ve stok değişmez. Kriz, savaş ihtiyacı ve gelir açığı için mevcut acil yollar korunur. Önizleme saklanan güç ve sınır önbelleği damgalarını geri yükler. [AI kararı](../../ai.js) · [Ödeme ve kuyruk](../../economy.js)

## Kampanya kabulü

100 sistemde döngüler **261 → 3** (%98,9 azalma), net mineral kaybı **32.803 → 408** (%98,76 tasarruf). Her tohumun döngü sayısı kendi p44 kontrolünün altında kaldı. Bir tamamlanmış söküm, aynı devlet ve kolonide sonraki ilk ücretli iş 180 gün içinde aynı türü sipariş ettiğinde ve o sipariş tamamlandığında bir kez sayıldı.

| Sistem / AI · tohum | Ay p44 → p45 | Tamamlanan söküm | Döngü | Net mineral |
|---|---:|---:|---:|---:|
| 100 / 9 · 11 | 240 → 240 | 432 → 299 | 130 → 0 | 16.365 → 0 |
| 100 / 9 · 99 | 240 → 240 | 336 → 259 | 99 → 3 | 12.182 → 408 |
| 100 / 9 · 404 | 180 → 177 | 147 → 99 | 32 → 0 | 4.256 → 0 |
| 500 / 16 · 11 | 240 → 240 | 1.143 → 646 | 458 → 1 | 58.209 → 136 |

500 sistemde tamamlanan sökümlerin döngüye dönüşme payı %40,1 → %0,2. [Kampanya hesapları ve ham izler](evidence/ai-ikame0)

## Yan etkiler

| Sistem · tohum | Kritik devlet-ay | Aylık net alaşım medyanı | Teslim edilen gövde | Ticaret teslimatı | Askerî güç medyanı |
|---|---:|---:|---:|---:|---:|
| 100 · 11 | 32 → 7 | 374,8 → 403,0 | 1.336 → 1.405 | 486 → 837 | 27.356 → 30.584 |
| 100 · 99 | 7 → 57 | 343,2 → 394,7 | 1.471 → 1.397 | 96 → 140 | 45.482 → 51.102 |
| 100 · 404 | 158 → 123 | 280,5 → 279,8 | 1.050 → 981 | 274 → 276 | 24.407 → 26.182 |
| 500 · 11 | 6 → 0 | 846,5 → 651,3 | 2.583 → 2.875 | 94 → 222 | 90.849 → 105.159 |

100 sistemde doğal bitişlere kadar kritik devlet-ay toplamı 200 → 187, normal tersanelerden teslim edilen toplam gövde 3.871 → 3.783. 99. tohumun kritik devlet-ay sayısı 7 → 57 oldu. Adayda devlet 5, 162–207. aylarda 46 ay alaşım sıkıntısı yaşadı. Tablodaki 404 karşılaştırması ortak 177 ayı kullanır. Devlet 2’nin tüketim malı kritik ayı ortak sürede 119 → 119 bulundu. Kritik ay, negatif gelirli kaynaklardan en az birinin stokunun üç aydan kısa dayanmasıdır. Teslim edilen gövde, tersane işi fiilen tamamlanıp gemi filoya eklendiğinde sayılır. Federal fondan üretilen gemiler bu sayaçta yer almaz.

| Sistem · tohum | 24 ay izlenebilen stratejik söküm | 6 ayda hedef tamamlandı | 12 ayda | 24 ayda |
|---|---:|---:|---:|---:|
| 100 · 11 | 344 → 249 | 136/344 → 239/249 | 154/344 → 248/249 | 156/344 → 248/249 |
| 100 · 99 | 253 → 185 | 93/253 → 176/185 | 112/253 → 181/185 | 112/253 → 181/185 |
| 100 · 404 | 101 → 65 | 36/101 → 60/65 | 45/101 → 65/65 | 49/101 → 65/65 |
| 500 · 11 | 770 → 418 | 191/770 → 331/418 | 245/770 → 405/418 | 254/770 → 405/418 |

Hedeflenen ikame tamamlanması sökümden sonra sıraya alınan ve aynı kolonide takip eden sökümden önce bağlanabilen siparişle ölçüldü. Sökümü iptal edilen adaylar bu oranın paydasına girmez. Teknoloji, savaş bitiş gerekçeleri, ilk ayrışma ve ay ay stok/gelir serileri ölçüm dosyalarında yer alır. [Karşılaştırma JSON’u](evidence/ai-ikame0/karsilastirma.json)

## İlk karar ve kayıt tekrarı

| Sistem · tohum | İlk değişen gün | Devlet / sistem / gezegen | Stratejik ikame | Öncesinde birebir ay noktası | İlk RNG farkı |
|---|---:|---|---|---:|---:|
| 100 · 11 | 240 | 4 / 79 / 0 | `maden` → `santral`, ilk tercih `santral` | 8 | 420 |
| 100 · 99 | 120 | 5 / 95 / 0 | `kale` → `santral`, ilk tercih `santral` | 4 | 330 |
| 100 · 404 | 240 | 7 / 54 / 0 | `ciftlik` → `santral`, ilk tercih `santral` | 8 | 1020 |
| 500 · 11 | 30 | 14 / 284 / 2 | `fabrika` → `santral`, ilk tercih `santral` | 1 | 120 |

Kampanyalardaki ilk değişiklik 500 sistemde 30. günde verildi. Devlet 14’ün sistem 284, gezegen 2 kolonisi için boşalacak slota santral mevcut bütçeyle ilk sırada girebildi. Aday bu hedefi fabrika sökümüyle birlikte kaydetti. 100 sistem koşularındaki en erken değişiklik 99. tohumun 120. gününde kale yerine santral için verildi. Santral boşalacak slota mevcut bütçeyle ilk sırada girebildiğinden aday ikameyi kaydetti. p44 aynı sökümü tek başına sıraya almıştı. Araştırmanın aynı-kayıt örneklerinde 11/27 ve 99/82 dökümhaneleri, önizlemede yeniden ilk sıraya çıktıkları için korundu. 404/1 örneğinde ilk sırada fabrika kaldı ve 1.067. günde söküm tamamlanırken fabrika için ödeme yapıldı.

Üç tohumun ilk kararından önceki kayıtlar aynı Save8 ve RNG ile açıldı. Karar ve stok kesintisi izleri kesintisiz akışta ve bekleyen iş yeniden yüklendiğinde eşleşti. 99’da 210 ve 270. günlerde, 404’te 270 ve 330. günlerde 110’ar mineral kesildi. 11’de ilk plan için ödeme oluşmadı. Tetikli 11 ve 99 tekrarlarında JSON alan değerleri ve RNG eşitti, ham JSON bayt sırası farklıydı. 404’ün tetikli tekrarında ham baytlar da eşleşti. [Tekrar ve araştırma vakaları](evidence/ai-ikame0/replay.json)

## Regresyonlar

| Paket | Durum | Sonuç |
|---|---|---|
| Stratejik ikame ve acil söküm | PASS | 4/4. Kaydet-yükle, tek ödeme ve hurda, dolan slot ve bütçe kaybında iptal. |
| PERF.1 / PERF.2 | PASS | 4/4 ve 5/5. Tarihsel kaynak hash’leri ile AI penceresi korundu. |
| PERF-SINIR.0 odaklı | PASS | p43→p44 ve p44→p45 7/7. Tetiklenmeyen kayıtlar, sahiplik ve erişim denetimleri. |
| Chromium H | PASS | p44 ve p45 3/3. Sekiz ham ayna özeti eşit. Tersane tek sipariş ve 32 alaşım. |
| Chromium J | PASS | p44 ve p45 5/5. Yeni oda ve iki misafirin dönüşü. Aynı emir kimliğiyle bir kesinti. |
| MP4 çekirdek, emir güvencesi ve takviye | PASS | 14/14, 13/13, 12/12. Takviye kartı 4/4. |
| p44 paketi → p45 | PASS | 12,5. gün, paket 4, Save8 v8. İki yüklemede aynı hash ve RNG. Bozuk özet reddedildi. |
| Fiziksel Android, canlı Render | NOT RUN | Yerel Chromium ve relay kullanıldı. |

İlk çapraz H koşusunda lobi kökeni farkı ayna hash’lerini değiştirdi. İki kola aynı kökeni veren ve oyunda doğrulayan düzenekle sekiz hash eşleşti. J’nin ilk koşularında 4 saniyelik duvar saati aralığı içinde hedef yanıt düşmedi. Tek düşürmeyi ilk yanıtın emir kimliğiyle doğrulayan düzenekle iki sürüm de geçti. [H kanıtı](evidence/ai-ikame0/mp-h-karsilastirma.json) · [J p44](evidence/ai-ikame0/mp-j-p44.json) · [J p45](evidence/ai-ikame0/mp-j-p45.json)

### Tam ay Chromium

Beş doğrulanmış p44 kaydı kullanıldı. Her kol için 24 ay örneği alındı. Dengeli AB–BA–AB–BA sırası, iki ısınma ayı ve her örnekte Save8/RNG kontrolü uygulandı. Tarayıcı düzeneği iki kolu aynı p44 iş yükünde tutarken adayın karar ve bitiş kontrollerini çalıştırdı. Doğal karar farkları üstteki kampanyalarda ölçüldü.

| Kayıt | p50 p44 → p45 | p95 p44 → p45 | p95 farkı | Save8/RNG |
|---|---:|---:|---:|---|
| `100-9-11-m3` | 367,0 → 322,1 ms | 555,4 → 547,6 ms | %-1,4 | PASS |
| `100-9-11-m120` | 361,7 → 341,8 ms | 698,2 → 615,7 ms | %-11,8 | PASS |
| `500-16-11-m3` | 1.045,4 → 990,5 ms | 1.468,7 → 1.418,0 ms | %-3,5 | PASS |
| `500-16-11-m120` | 1.135,1 → 1.190,2 ms | 1.334,0 → 1.457,8 ms | %9,3 | PASS |
| `500-16-11-m180` | 3.597,5 → 3.829,1 ms | 4.120,2 → 4.247,7 ms | %3,1 | PASS |

120. ay küçük harita için kampanya işlem yükü varken ilk medyan artışı %10,3’tü. Tabloda bu kayıt ve 500 sistemin iki geç oyun kaydı, kampanya işlemleri duraklatılarak ölçüldü. 500 sistemde p95 120. ayda %9,3, 180. ayda %3,1 arttı. Tablodaki PASS etiketi örneklerin Save8 ve RNG eşitliğine aittir. Küçük haritanın iki girdisinde p50 ve p95, p44’e göre %5 artış sınırının altında kaldı. [Ham Chromium örnekleri ve ilk koşu](evidence/ai-ikame0)

## ZIP ve GitHub

ZIP `stars-faz96h10p45.zip`, 941.834 bayt. SHA-256 `03682419baaa1a4d778660b6daf6da0bff2365ee07a8c3d9a10819c25da316a0`. 20 üyenin CRC32 doğrulaması ve çıkarılan 19 çalışma zamanı dosyasının manifest kontrolü geçti. Ayrı iki paketlemenin baytları eşleşti. [ZIP](../../releases/stars-faz96h10p45.zip) · [Üye özetleri](../../RELEASE-AI-IKAME0.json) · [Çıkarma doğrulaması](evidence/ai-ikame0/zip-verify.txt)

GitHub teslim dalı `codex/stars-ai-ikame0`, taslak PR tabanı `codex/stars-perf-sinir0`. Kriz kabulü 100 sistemde toplam kritik devlet-ay üzerinden değerlendirildi. Tohum 99’daki artış ve 500 sistem geç oyun zamanlamaları taslak incelemesinde açık kalır. [Aday dal](https://github.com/sarsiss12-dot/Star/tree/codex/stars-ai-ikame0) · [Tekrar komutları](../../research/ai-ikame0/README.md)
