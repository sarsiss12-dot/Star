# AI-IKAME.1 — alaşım krizi ve geç oyun maliyeti

Çalışma dalı `codex/stars-ai-ikame1`. Kontrol p44 `0559cfbeaac4cd4f458ccfaab23c3228de82b1cd`, devralınan p45 `4f07699be811d5d300616ec6cf4de9171c97286e`, aday kaynak p46 `178b4b78211ad552f6b19a76e6d14dcb0308c967`. Kampanya düzeneği ayda 60 yarım gün adımıyla önceki koşulların aynısını kullandı. [p44 · PR #60](https://github.com/sarsiss12-dot/Star/pull/60) · [p45 · PR #61](https://github.com/sarsiss12-dot/Star/pull/61) · [p45 sonuçları](AI-IKAME0-SONUC.md) · [Tekrar komutları](../../research/ai-ikame1/README.md)

## 99. tohumda devlet 5’in alaşım krizi

149. ay kaydında devlet 5’in sistem 95, gezegen 0’da tek kolonisi ve üç dökümhanesi vardı. 150. ayda mineral stoku 86,85 ve aylık mineral neti −12,09’du. Alaşım stoku 93,64 ve aylık neti +0,70’ti. Mineral kurtarma kararı dökümhane sökümünü 4500. günde sıraya aldı ve söküm 4594. günde tamamlandı. 154. ayda aynı yol ikinci dökümhaneyi seçti. O anda aylık alaşım −6,59’du. İkinci söküm 4714. günde bitti.

161. ayda alaşım stoku 30,67 ve neti −9,20’ydi. 162. ayda stok 21,61’e düşünce üç aylık açığı karşılayamaz hale geldi. 162–207 arasında bir dökümhane kaldı ve 20 geminin aylık alaşım bakımı 13,86’da sabit kaldı. Devlet 5 bu aralıkta yeni gemi siparişi vermedi ve gemi teslim almadı. 197. ayda maden sökümüyle dökümhaneye yer açıldı. Yeni dökümhane 6000. günde 210 mineral karşılığında sıraya girdi ve 6236. günde tamamlandı. Aylık net 208. ayda +1,36’ya çıktı. İlk iki sökümün kuyruklarında stratejik ikame işareti yoktu. Devlet 5 için 149–212 aralığında stratejik erteleme veya söküm sonu iptali kaydedilmedi. p44’te devlet 5’in 162. ayda iki kolonisi, beş dökümhanesi ve 46 gemisi vardı. 33,88 bakımdan sonra neti +2,50 ve stoku 43,64’tü. Aynı aralıkta p44’te alaşım krizi görülmedi. [Ay, stok, gelir ve sipariş izleri](evidence/ai-ikame1)

162. ay başından 208. ay başına kadar p44’te devlet 5 altı siparişe 208 alaşım ödedi ve altı gemi teslim aldı. p45’teki 43 üretim dışı alaşım hareketinin tamamı, stok sıfır sınırı nedeniyle karşılanamayan tüketim kayıtlarıydı. [Kaynak defteri ve gemi emirleri](evidence/ai-ikame1/diagnosis)

| Ay | p44 stok / net | p45 stok / net | p45 dökümhane | p45 bakım öncesi aylık alaşım |
|---|---:|---:|---:|---:|
| 149 | 88,93 / +5,14 | 92,94 / +0,26 | 3 | 14,12 |
| 154 | 55,53 / +2,62 | 86,37 / −6,59 | 2 | 7,27 |
| 162 | 43,64 / +2,50 | 21,61 / −9,06 | 1 | 4,80 |
| 180 | 62,12 / +2,27 | 0 / −8,18 | 1 | 5,68 |
| 207 | 59,74 / +7,16 | 0 / −6,25 | 1 | 7,61 |
| 208 | 51,01 / +7,37 | 1,36 / +1,36 | 2 | 15,22 |

Krizden hemen önceki 161. ay p45 kaydı, 162. ayda aynı açığı yeniden üretti. İlk sökümden önceki 149. ay p45 kaydında stratejik önizleme hedefi her zaman kabul edecek şekilde değiştirilse bile 46 aylık kriz tekrarlandı. Yalnızca performans değişiklikleri açıkken 64 ay noktasında p45 ile Save8, RNG ve olay izi eşleşti. Mineral kurtarma sırasında dökümhane sökümünü tamamen engelleyen deneyde alaşım krizi sıfırlandı ve mineral krizi 46 aya çıktı. Son aday 150. ayda fabrikayı seçti. Alaşım krizi sıfırlandı ve 163–167 arasında beş ay mineral krizi kaldı. Başlangıçtan yürütülen 99. tohum kampanyasında devlet 5’in alaşım krizi sıfırlandı ve mineral açığı 154–156 arasında üç ay sürdü. [Kontrollü tekrarlar](evidence/ai-ikame1/diagnosis)

İlk geniş kural, beklenen aylık alaşım neti negatife düşen bütün sökümleri engelliyordu. Bu kuralı kullanan `66368c1694c844db28f05909c25f0bfe571289e9` adayının 500 sistem koşusunda devlet 18’de 174–200. aylar arasında yeni bir enerji açığı görüldü. Yalnızca 18 aylık eşik kullanıldığında 99. tohumdaki ilk söküm gerçekleşti ve alaşım krizi 22 ay sürdü. 100 alaşım tabanı eklenen `c12561902d88ae0cc5ef11ebd60201942b3e61bb` adayında büyük haritanın 7. ayındaki kurtarma kararı değişti ve devlet 14’te 177–205. aylar arasında yeni bir enerji açığı görüldü.

500 sistemde p45’in iki kurtarma sökümünde stoklar tahmini açığın 46,28 ve 29,83 ayını karşılıyordu. 99. tohumdaki ilk kritik sökümde stok 21,78 ayı karşılayabiliyordu. Son adayın 28 aylık eşiği, büyük haritadaki iki kararı korudu ve krize yol açan sökümü eledi. [Geniş kural ve eşik deneyleri](evidence/ai-ikame1/diagnosis)

## Uygulama

Mineral kurtarmada bir söküm alaşım üretimini azaltıyorsa, sonraki aylık net negatifse ve mevcut stok 28 aylık tahmini açığı karşılamıyorsa aday eleniyor. Bu süre, AI’ın enerji bütçesinde kullandığı iki yıllık planlama ufku ile yeniden kurtarma emri verilebilmesi için zaten geçerli olan dört aylık beklemeyi kapsıyor. Kuyruk, alternatif aday sıralaması, diğer kriz ve savaş kararları ile hurda iadesi mevcut yoldan işliyor.

Stratejik önizleme, söküm sonrasına ait aynı gölge bütçeyi bina ihtiyaçlarına, koloni hazırlığına ve ekonomik siparişe geçiriyor. İlk uygun sipariş bulunduğunda aday taraması bitiyor. Mevcut koloninin bütçesi de bina talebi, ekonomik sıralama, söküm seçimi ve aciliyet değerlendirmesi arasında, ilk kuyruk değişimine kadar paylaşılıyor. Gölge gelir ve ticaret sonuçları, mevcut salt okunur PERF.2 penceresinin ömrüyle sınırlı. Bütçe, teknoloji, bina sınırı, boş slot ve sürdürülebilirlik denetimleri sürüyor. Söküm bitiminde hedef yeniden doğrulanıyor. İptalde bina yerinde kalıyor. Başarılı ikamenin gerçek bedeli tek kez, hurda iadesinden önce kesiliyor. [Birim sınamaları](../../tests/ai_ikame0_test.cjs)

## İlk ayrışan karar ve Save8

99. tohumda ilk ayrışma 3900. gün, devlet 11, sistem 34, gezegen 0’da oldu. p45, ayda 14,08 mineral girdisini serbest bırakan dökümhaneyi seçti. Dökümhanenin sökümü aylık alaşımı +4,36’dan −0,47’ye indirecekti. Stok 12,59’du. Aday, ayda 5,12 mineral girdisini serbest bırakan fabrikayı seçti ve 59 mineral hurda iadesi aldı. Kaydet/yükle tekrarında aynı seçimi yaptı ve 4080. günde fabrika siparişinde 170 mineral bir kez kesildi. Sekiz ayda Save8 alan değerleri ve RNG eşleşti. Ham JSON anahtar sırası farklıydı. [İlk karar ve ödeme kaydı](evidence/ai-ikame1/first-99.json) · [Aylık kampanya karşılaştırması](evidence/ai-ikame1/karsilastirma.json)

Kriz teşhisindeki 149. ay kaydından 150. aya geçişte de fabrika kararı ve 59 mineral hurda iadesi tekrarlandı. Bekleyen söküm kaydedilip yüklendiğinde sonraki 44 ayda ham Save8 baytları ve RNG eşleşti. 5550. ve 5760. günlerde iki maden siparişinin her biri için 120 mineral bir kez kesildi. [Geç kayıt ve ödeme tekrarı](evidence/ai-ikame1/recovery-replay.json)

## 100 sistem kabul kampanyaları

Her hücre p44 → p45 → aday sırasındadır. 404. tohumda p44 180. ayda, p45 ve aday 177. ayda bitti. Tablo 177. ayın sonuna kadar olan ortak dönemi kullanır. Diğer iki tohum 240 aya ulaştı. Teslimatlar tamamlanan tersane gövdelerini, güç silahlı filoların kampanya boyunca aylık toplam medyanını ve son anlık toplamını gösterir. İkame sütununda tamamlanan hedef ve sökümü gerçekleşen hedef sayısı verilir. [Ham kampanyalar](evidence/ai-ikame1) · [p44/p45 arşivi](evidence/ai-ikame0)

| Tohum | Döngü | Net mineral | Teslim edilen gemi | Askerî güç medyanı | Son askerî güç | Hedef ikame tamamlandı / söküldü |
|---|---:|---:|---:|---:|---:|---:|
| 11 | 130 → 0 → 0 | 16.365 → 0 → 0 | 1.336 → 1.405 → 1.405 | 27.356 → 30.583,5 → 30.583,5 | 145.926 → 152.505 → 152.505 | 175/429 → 291/297 → 291/297 |
| 99 | 99 → 3 → 5 | 12.182 → 408 → 667 | 1.471 → 1.397 → 1.304 | 45.482,5 → 51.101,5 → 51.101,5 | 164.219 → 165.049 → 151.797 | 129/332 → 239/252 → 253/278 |
| 404 | 31 → 0 → 0 | 4.120 → 0 → 0 | 1.050 → 981 → 981 | 24.407 → 26.182 → 26.182 | 88.079 → 93.602 → 93.602 | 64/139 → 93/97 → 93/97 |
| Toplam | **260 → 3 → 5** | **32.667 → 408 → 667** | **3.857 → 3.783 → 3.690** | | | |

Ortak dönemde p44’e göre net mineral tasarrufu **%97,96**. p44’ün doğal bitişlerine kadar ölçülen araştırma tabanı 261 döngü ve 32.803 mineraldir. 99. tohumda p45’e göre iki ek döngü oluştu. Aynı tohumda gemi teslimatları %6,7 ve son askerî güç %8,0 gerilerken askerî güç medyanı eşit kaldı. 11 ve 404’ün tüm Save8 ve RNG noktaları p45 ile eşleşti.

| Tohum | Enerji | Mineral | Yiyecek | Tüketim malı | Alaşım |
|---|---:|---:|---:|---:|---:|
| 11 | 0 → 0 → 0 | 0 → 4 → 4 | 0 → 3 → 3 | 19 → 0 → 0 | 13 → 0 → 0 |
| 99 | 0 → 0 → 0 | 2 → 10 → 9 | 0 → 0 → 0 | 0 → 0 → 0 | 5 → 47 → 8 |
| 404 | 0 → 0 → 0 | 42 → 0 → 0 | 119 → 78 → 78 | 119 → 119 → 119 | 2 → 4 → 4 |

Kaynak sütunları, neti negatif ve stoku üç aylık açığın altında olan yaşayan devletlerin toplam devlet-ay sayısıdır. Kalıcı açık için aynı devlet ve kaynakta aralıksız en az 12 ay eşiği kullanıldı. 99. tohumda adayın en uzun mineral açığı beş, en uzun alaşım açığı dört ay sürdü. 404. tohumda p45’ten devralınan devlet 2’nin tüketim malı açığı 59–177, yiyecek açığı 95–172 aralığında sürdü. [Devlet ve kaynak bazında tam aralıklar](evidence/ai-ikame1/karsilastirma.json)

## 500 sistem, 240 ay ve alaşım harcaması

Finans izlerini toplamak için p44 ve p45 kendi kaynaklarından tekrar yürütüldü. İki tekrar kendi arşivleriyle 241 Save8/RNG noktasında eşleşti. Son adayın 500 sistemlik kampanyası, olay ve harcama kayıtları dahil p45’in yeniden üretilen iziyle bayt düzeyinde eşleşti. `queueShip` bedelleri ve kaynak defterindeki tersane çıkışları ayrı sayıldı ve üç koşuda eşleşti. [Ham kampanyalar](evidence/ai-ikame1/campaign)

| Gösterge | p44 | p45 | Aday |
|---|---:|---:|---:|
| Yıkım–yeniden yapım döngüsü | 458 | 1 | 1 |
| Net mineral | 58.209 | 136 | 136 |
| Teslim edilen gemi | 2.583 | 2.875 | 2.875 |
| Askerî güç medyanı | 90.849 | 105.159 | 105.159 |
| Son askerî güç | 497.469 | 437.275 | 437.275 |
| Tamamlanan hedef ikame / sökülen | 289/1.140 | 598/644 | 598/644 |
| Kritik aylar, mineral / alaşım | 2 / 4 | 0 / 0 | 0 / 0 |
| Kritik aylar, enerji / yiyecek / tüketim malı | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |

p44’ten p45’e aylık net alaşım medyanı 846,5’ten 651,3’e indi. Filo bakımı öncesi gelir medyanı 1.295,7’den 1.153,7’ye düşerken aylık filo bakımı medyanı 453,6’dan 499,3’e çıktı. 240 ayın toplamında bakım öncesi gelir 409.557’den 322.015’e, net gelir 263.873’ten 196.666’ya indi. Kümülatif bakım 145.684’ten 125.350’ye indi. Medyan ve toplam, aylar arasındaki dağılım değişimini farklı biçimde yansıtıyor.

p45, 2.897 siparişe 145.059 alaşım ödedi. p44’te 2.598 sipariş ve 133.011 alaşım ölçüldü. Sipariş başına ortalama alaşım 51,20’den 50,07’ye indi. Teslimatlarda 199 korvet, 65 muhrip ve 23 kruvazör artışı ile 42 koloni gemisi ve 14 zırhlı azalışı görüldü. p45 bina harcamasının iadeler sonrası alaşım yükü 54.156’dan 45.007’ye geriledi ve son alaşım stoku 92.804’ten 32.961’e düştü. Bu harcama dağılımı daha düşük net gelirle 2.583 yerine 2.875 geminin teslim edilebildiğini gösteriyor. [Sipariş sınıfları ve kaynak defteri toplamları](evidence/ai-ikame1/karsilastirma.json)

## 500 sistemde Chromium maliyeti

Chromium `155.0.8059.79`, aynı p44 Save8 girdileri, AB–BA–AB–BA sırası, bağlam başına iki ısınma ayı, kol başına 24 ölçülen ay. Düzeneğin geçici sarmalayıcıları p44’ün yıkım akışını uygularken adayın ilk tercih ve bitiş denetimlerini çalıştırdı. Aday ile kontrol her ölçümde aynı günü, Save8 baytlarını ve RNG’yi üretti. Doğal oyun davranışı ayrı kampanyalarda sınandı.

| Kayıt | p44 / p45 önceki p50, ms | p44 / p45 önceki p95, ms | İlk aday turu p95 farkı | Son p44 / aday p50, ms | Son p44 / aday p95, ms | Son p95 farkı |
|---|---:|---:|---:|---:|---:|---:|
| 120. ay | 1.135,10 / 1.190,25 | 1.334,0 / 1.457,8 | +%10,61 | 1.263,65 / 1.073,25 | 1.557,4 / 1.268,1 | **−%18,58** |
| 180. ay | 3.597,50 / 3.829,05 | 4.120,2 / 4.247,7 | +%5,83 | 3.788,50 / 2.388,80 | 4.213,5 / 2.966,5 | **−%29,60** |

İlk aday turu yalnızca gölge önizleme ve bitişin ortak değerlendirmesini içeriyordu. Son tur, normal koloni kararında da bütçe tekrarını kaldıran adayla ölçüldü. İki son p95, p44’e göre izin verilen %5 gerileme sınırının altında. [Önceki p45 ölçümleri](evidence/ai-ikame0) · [İlk ve son ham Chromium örnekleri](evidence/ai-ikame1/chromium)

| Üç aylık profil | `aiReplacementFirstBuilding`, çağrı / ms, p45 → aday | `aiCanFinishReplacement`, çağrı / ms, p45 → aday | İki denetim içindeki `empireIncome` | Bütün ayların `aiEconomyPlan` çağrıları |
|---|---:|---:|---:|---:|
| 120. ay kaydı | 14 / 170,8 → 14 / 30,5 | 5 / 27,4 → 5 / 37,6 | 286 → 146 | 1.422 → 838 |
| 180. ay kaydı | 24 / 205,8 → 24 / 109,7 | 8 / 168,0 → 8 / 76,8 | 923 → 443 | 2.715 → 1.299 |

Süreler iç çağrıları da içerir. Bitiş doğrulaması önizlemeyi çağırabildiği için iki süre toplanmaz. 120. ay profilinde beş bitiş çağrısının toplam süresi 10,2 ms arttı. 180. ayda iki fonksiyondaki bütçe sayısı 78’den 32’ye ve bina marjı hesabı 982’den 450’ye indi. [İşlev sayaçları ve Chromium profilleri](evidence/ai-ikame1/chromium)

## Save8, PERF ve multiplayer regresyonları

| Denetim | Sonuç | Kanıt |
|---|---|---|
| Ekonomi ve ikame | PASS | Altı senaryo. Ödeme ve zamanlama aynı, teknoloji veya bina sınırı değişince eski bina kalıyor. |
| p45 stratejik ikame tekrarları | PASS | Yalnızca aday performans değişiklikleriyle 11, 99 ve 404. Araştırma döngüleri, ilk karar ve ödeme çizgisi aynı. |
| Tetiklenmeyen Save8/RNG | PASS | 100 sistemde 11. tohumda 0–240 ve 404. tohumda 0–177. aylar, 500 sistemde 0–240. aylar p45 ile ham Save8 ve RNG eşit. |
| Tetiklenen Save8/RNG ve ödeme | PASS | 3900. ve 4500. günlerde fabrika kararı eşit. 4080. günde 170, 5550. ve 5760. günlerde 120’şer mineral bir kez kesildi. Geç kayıt 44 ay ham bayt düzeyinde eşit. |
| PERF-SINIR.0 | PASS | p44 ve p45 ile ayrı ayrı 7/7 durum. Gerçek 500 sistem kaydı, sahiplik/erişim ve geri alma. |
| PERF.1 ve PERF.2 | PASS | Kaynak koruması, tarihsel kontrol ve çalışma zamanı eşdeğerliği. PERF.2 kontrol kopyası, yalnızca onun salt okunur önizleme sarmalayıcısını da çıkartıyor. |
| Takviye ve emir güvencesi | PASS | Rota, gelen kutusu kartları, MP4 paket denetimleri ve yinelenen emirler. |
| Multiplayer H | PASS | 3/3. p44 ve p45’e karşı dört aşamada iki misafirin kanonik aynaları aynı. |
| Multiplayer J | PASS | 5/5. Host kaydet/yükle, yeni odaya katılım, tersane ödemesi ve aynı `cid` ile tekrar. |
| p44 ve p45 paketleri → p46 | PASS | MP paket 4, Save8 v8. İki yüklemede aynı gün, Save8 ve RNG. Bozuk özet reddedildi. |

İlk J koşusunda ölçüm sırasında kaynak değişince misafir sürüm denetimi yeniden katılımı engelledi. Aynı test donmuş aday kaynağında 5/5 geçti. İlk PERF.2 koşusunda testin ürettiği tarihsel kontrol, yeni sarmalayıcıya bağlı bir çağrıyı içeriyordu. Kontrol üretiminde bu çağrı da tam kaynak eşlemesiyle kaldırıldı. [Test çıktıları](evidence/ai-ikame1/checks) · [H/J çıktıları ve ayna özetleri](evidence/ai-ikame1/mp)

## Kabul ve paket

Dört doğal kampanyada yeni kalıcı kaynak açığı oluşmadı. Döngü, mineral tasarrufu ve iki p95 eşiği geçti. 99. tohumun daha düşük teslimat ve son askerî güç değerleri, 404. tohumda devralınan açıklar ve eski p45 kaydından tekrarda kalan beş aylık mineral açığı açık bulgular olarak kaydedildi. [Kabul denetimi](evidence/ai-ikame1/checks/kabul.txt)

`stars-faz96h10p46.zip` 942.030 bayt. SHA-256 `9ab7f13bf5f9e88d03229b595edc31479d9709cb91afa252f50336ec46fe7836`, arşiv CRC32 `F9158BF7`. Manifest SHA-256 `14615a89dc48c15443e5f71b0edbcede15ff7c20faf1bb55706e8a90811533cc`. İki bağımsız paketleme bayt düzeyinde eşleşti. 20 üyenin CRC32’si, çıkarılan 19 çalışma zamanı dosyasının manifest özetleri ve tüm üyelerin `178b4b78211ad552f6b19a76e6d14dcb0308c967` kaynak commit’indeki baytları doğrulandı. [ZIP](../../releases/stars-faz96h10p46.zip) · [Üye özetleri](../../RELEASE-AI-IKAME1.json) · [ZIP doğrulaması](evidence/ai-ikame1/checks/zip-verify.txt)

GitHub’da `codex/stars-ai-ikame1` dalı, `codex/stars-ai-ikame0` üzerine taslak olarak açıldı. Rapor, paket ve ham izler aynı dalda incelemeye hazır. [Taslak PR #62](https://github.com/sarsiss12-dot/Star/pull/62) · [Kanıt dosyalarının SHA-256 listesi](evidence/ai-ikame1/SHA256SUMS)
