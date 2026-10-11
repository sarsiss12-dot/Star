# 86F — AI pazarlık ölçümü ve düzeltmeleri

Üç somut değerleme/seçim hatası düzeltildi. Kabul oranını veya ortalama ilişkiyi bir hedef sayıya zorlayan katsayı değişikliği yapılmadı.

## Değişen kararlar

1. Teknolojiyi veren zaten bildiği için `itemValue(veren, tech)` sıfırdı. Ek taviz hesabı artık teknolojinin alıcıya kazandırdığı bilgi değerini kullanır. Bu kaynak kesintisi değildir; AI'ın paylaşma isteği sınırıdır. Kaynak maddeleri verenin ihtiyacından değerlenmeye devam eder.
2. Kaynak hediyesi simetrik antlaşma faydası sayılıp ek taviz bütçesini büyütemez. Kanonik normalize/effective plan kullanılır; redundant maddeler ve iki yöndeki aynı antlaşma ikinci kez sayılmaz. Antlaşma yoksa başlangıç takasının pozitif net faydası temel alınır. Mevcut %60 tavan korunur. Antlaşmalı karma tekliflerde bu hesap tüm stratejik sonuçların net fayda modeli değildir.
3. Küçük bir açık için gereken kaynak 20'nin altındaysa eski kontrol kaynak seçeneğini atlayıp teknoloji istiyordu. Mevcut asgari 20 birimlik teklif artık yeterli stok varsa kullanılabilir. Stok sınırı ve kaynak önceliği korunur.
4. Kaynak yetmezse en pahalı teknoloji yerine açığı tek başına kapatan en düşük değerli teknoloji seçilir. Tek teknoloji yetmiyorsa en yüksek katkıyla ilerlenir. Eşit değerlerde kimlik sırası deterministiktir; bu çoklu teknoloji için küresel optimizasyon iddiası değildir.

## Hedefli önce / sonra

Aynı kontrollü üretim yolu fixture'ında:

| Durum | 86E | 86F |
|---|---|---|
| Kaynak yok, küçük değer açığı | m_gaia, 1965.6 değer | t_tarim, 36.4 değer |
| Yeterli alaşım var, küçük açık | m_gaia isteniyor | 20 alaşım isteniyor |
| Pakt için 1965.6 değerli teknoloji karşı talebi | kabul ve uygulama | ret; taviz tavanı 33 |

Son satırda alıcının talebi kontrollü olarak enjekte edilmiştir; teklif edenin gerçek aiNegotiate/quote/execute yolu sınanır. Doğal simülasyonda bu özel teknolojinin istenme sıklığı ölçümü değildir. Ayrıntılar: tests/counter-before.json ve counter-after.json.

## Aynı yöntemle 3 seed × 360 ay

60 sistem, 7 AI, 21 AI–AI çift. Fixture yalnız bu AI'lar arasında karşılıklı temas açar; kaynak/kişilik/doktrin değiştirmez, RNG tüketmez. Oyuncuya temas açılmaz; oyuncu teklif sayısının 0 olması bu yöntemin sonucudur. Sandbox bitiş ekranını önler.

Her adım G.day += 30 ve gerçek monthTick çağrısıdır. memAge yalnız üretim memTick tarafından artırılır: 360 ay sonunda gün 10800, memAge 360, takvim 2240/1. Günlük keşif, günlük muharebe, günlük yapı/koloni süreçleri çalıştırılmaz. Bu tam oyun kampanyası veya gerçek cihaz performansı değildir.

| Sürüm | Seed | Teklif | İlk kabul | İlk ret | Karşı kabul | Karşı ret | Uygulama | Aktif NAP | Pact | Ally | Savaş | Ort. ilişki |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 86E | 11 | 105 | 91 | 0 | 3 | 11 | 94 | 7 | 10 | 2 | 5 | -25.97 |
| 86E | 99 | 131 | 124 | 4 | 2 | 1 | 126 | 8 | 10 | 2 | 8 | -41.21 |
| 86E | 404 | 107 | 101 | 0 | 4 | 2 | 105 | 8 | 11 | 2 | 8 | -28.76 |
| 86F | 11 | 103 | 68 | 0 | 4 | 31 | 72 | 5 | 12 | 6 | 3 | -4.54 |
| 86F | 99 | 136 | 124 | 0 | 2 | 10 | 126 | 11 | 10 | 3 | 9 | -36.18 |
| 86F | 404 | 107 | 101 | 0 | 4 | 2 | 105 | 8 | 11 | 2 | 8 | -28.76 |

İlişki ortalaması 42 yönlü AI ilişkisi üzerindendir. Antlaşma/savaş sayıları 21 yönsüz çift üzerindendir; ayrı sütunlar toplanarak tek bir kategori dağılımı elde edilmez. Hiçbir koşuda NaN/negatif stok, başarısız executeDeal veya Situation çağrısı görülmedi. En fazla 2 müzakere turu; 7 AI hayatta. Her seed'de NAP üretildi; 86F'de sırasıyla 28, 44, 34 NAP uygulaması var.

Ölçüm araçları açık/kapalı aynı dünya hash'ini üretir; aynı seed tekrarında karar izi aynıdır (otomatik test). Ham JSON'lar her 30 ay ilişki dağılımı, bütün teklif kayıtları, karar gerekçeleri ve fonksiyon bazlı ilişki katkısını içerir.

### İlişki eğrisi nasıl okunmalı?

Seed 11 ve 99 ortalaması iyileşti, 404 değişmedi. Kabul sayısı daha az olduğu halde seed 11 ilişki ortalaması arttı: anlaşma sayısı tek başına denge ölçütü değildir. Erken karar değişiklikleri sonraki RNG kullanımını ve dünya akışını değiştirebilir; 360 aylık fark tek bir katsayının bağımsız nedensel etkisi sayılmaz.

Fonksiyon katkısı, iç içe çağrılarda çocuk değişimleri çıkarılarak ölçülür; toplamı başlangıç–son ilişki farkına eşittir. Elçiler/antlaşmalar pozitif, hafıza güncellemeleri ve whisperTick negatif katkı yaptı. Savaş/barış büyük ve zıt katkılar oluşturdu. diploTick satırı henüz ayrı sarılmayan alt işlerin kalanını içerir; tek bir mekanizmaya mal edilmez. 2250 öncesi olduğu için polarizeTick katkısı bu ölçümde 0'dır. Ortalama hâlâ negatif; uzun vadeli denge tamamlandı denmiyor.

### Açık kalan NAP durumu

Mevcut declareWar NAP ihlalini işleyip hafıza kaydı oluşturabiliyor, fakat gelecekteki NAP bitiş alanını temizlemiyor. Bu nedenle savaştaki süresi dolmamış NAP alanları aktif NAP sayısına katılmadı. 86F sonunda seed 11/99/404 için bu alanların sayısı 0/3/2. Bu faz savaş/antlaşma yaşam döngüsünü değiştirmedi; 86G'de kayıt/UI tutarlılığı açısından incelenecek.

### Tekrar eden karşı retler

Seed 11'deki 31 karşı ret aynı 7→4 AI çiftinin ittifak tekliflerinden
geliyor. Seed 99'da 10 karşı reddin 9'u 1→4 çiftinden. Mevcut fırsat
kapısı ret sonrası yeniden deneyebiliyor; bu faz yeni cooldown veya
bildirim politikası eklemedi. Retler değerlendirme kapısının çalıştığını
gösterir, müzakere çeşitliliğinin yeterli olduğunu göstermez. Yeniden
teklif sıklığı sonraki denge çalışmasına ölçülmüş açık madde olarak kalır.

### Performans ve sınırlar

86F ölçüm aracının dahil olduğu Node aylık süreleri yaklaşık 5.44 / 6.69 / 5.65 ms. Önceki sürüm 5.39 / 6.21 / 5.82 ms. Bunlar aynı hostta tek koşu süreleri; kıyaslama benchmark'ı veya Android akıcılık iddiası değildir. Tam tarayıcı ve fiziksel cihaz denemesi yapılmadı. Cihaz kontrolleri bekleyen listeye eklendi.

## Yeniden çalıştırma

```sh
node tests/diplomacy-balance-probe.js /path/to/stars-faz86e before.json
node tests/diplomacy-balance-probe.js /path/to/stars-faz86f after.json
node tests/counteroffer-probe.js /path/to/stars-faz86f counter.json
node tests/faz86f_ai_balance_test.js
node tests/run-all.js
```

İlk komutta da bu paketteki ölçüm aracı kullanılır; yalnız root kaynak sürümü değişir.
