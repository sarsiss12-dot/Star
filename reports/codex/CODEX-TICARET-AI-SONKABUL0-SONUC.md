# CODEX-TİCARET-AI-SONKABUL.0

## 1. Kanonik başlangıç

Başlangıç dalı ve PR #83 aynı uzak HEAD'i gösterdi, `e4ae69fb03fe603770d7206d95e2d1d321142751`. `320bb9c853f058384922a8b97a9fbc3ce6959c27` ile karşılaştırıldığında oynanabilir JavaScript, giriş HTML'i ve sürüm manifesti aynı. Çalışma `codex/stars-ticaret-ai-sonkabul0` dalında ve [taslak PR #84](https://github.com/sarsiss12-dot/Star/pull/84) üzerinde. Koşulan kimlik **96h10p57 / MP.8.9b56**, Save8 v8, MP paket 4, protokol 1.

Debian 13, Node 24.22.1, Chromium 155.0.8059.79, 2 CPU kotası ve 8 GiB bellek sınırı kullanıldı. Girdi kayıtları, komutlar ve ham sonuçlar devir belgesinde. [Araçlar](../../research/ticaret-ai-sonkabul0/README.md) · [Ham kanıt](evidence/ticaret-ai-sonkabul0/) · [Devir](CODEX-TICARET-AI-SONKABUL0-DEVIR.md)

## 2. Önceki ticaret sistemi

Düz kaynak maddesi (`res`) imzada devreder. Açık fiziksel seçenek (`cargo`) bir defalık yük oluşturur. `freight` süreli ve dönemli lojistik yükümlülük doğurur. Sözleşme, yükleme ve makbuz ayrı olaylardır. İptalde yeni sefer durur. Yoldaki yük geçerli bir liman bulursa teslim edilir, aksi durumda en fazla 180 günlük engellenme ve kayıp kuralları işler. [İşlem motoru](../../diplomacy.js) · [Lojistik](../../commerce.js) · [Ticaret ekranları](../../commerce-ui.js)

## 3. Eksik ve tamamlanan mekanikler

| Özellik | Sınıf | Doğrulama |
|---|---|---|
| İnsan → AI, AI → insan, AI → AI anlık takas | ÇALIŞIYOR | Kanonik teklif, kaynak koruması ve kampanya imzaları |
| İnsanlar arası fiziksel kargo | ÇALIŞIYOR | TA, TB, TR ve tek yönlü yükleme/varış ayrımı |
| AI fiziksel sevkiyat ve düzenli sözleşme | ÇALIŞIYOR | 1.239 teslim makbuzu ve 113 fiziksel imza, altı doğal koşu |
| Çok durak, iki yön, birden çok transit sahibi | ÇALIŞIYOR | TZ ve Node M1–M17, iki insan onayı olmadan ödeme veya izin oluşmadı |
| Sözleşme inceleme, iptal ve liman izni yenilemesi | ÇALIŞIYOR | Rota ve stok kontrolleri, TZ Z5 ve Node A1/A2 |
| Liman yıkımı, fethi, savaş, abluka, ambargo, federasyon yasası | ÇALIŞIYOR | TB aktif konvoy ve sahiplik, TİCARET-AĞ.1 olumsuz rota senaryoları |
| Varış zamanının alıcı ihtiyacına bağlanması | EKONOMİK SINIR | Aynı değerleme 30 ve 229 günlük teslimat, kontrollü deney |
| Kritik ithalatla kurtarma ve altyapı yatırım getirisi | EKONOMİK SINIR | Kıtlık dönemleri ve gerçek makbuzlar, yeni aday için ekonomik kanıt çıkmadı |
| Fiziksel Android, LAN, uzak internet ve canlı Render | SAHA TESTİ BEKLİYOR | NOT RUN |

## 4. AI'nın mevcut ticaret kullanımı

| Sistem / AI | Tohum | Ay | İlk fiziksel teslimat, gün | İmza | Teslimat | Kayıp terminali | Ortalama açık sözleşme | Son açık | AI başına farklı teslimat ortağı¹ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 / 9 | 11 | 240 | 1.061 | 69 | 740 | 2 | 3,40 | 3 | 2,00 |
| 100 / 9 | 99 | 198 | 1.947,5 | 15 | 143 | 1 | 0,82 | 2 | 0,67 |
| 100 / 9 | 404 | 183 | 878,5 | 20 | 297 | 1 | 1,21 | 2 | 0,73 |
| 500 / 16 | 11 | 120 | — | 0 | 0 | 0 | 0,00 | 0 | 0,00 |
| 500 / 16 | 23 | 120 | 1.142 | 8 | 53 | 1 | 0,73 | 2 | 0,24 |
| 500 / 16 | 404 | 120 | 2.881,5 | 1 | 6 | 0 | 0,10 | 0 | 0,13 |

¹ En az bir ay yaşayan normal AI devletleri paydadadır. Sonradan ortaya çıkan AI devletleri dahildir. Açık sözleşme, kampanya sonuna kadar ay kapanışındaki açık sözleşmelerin dünya ortalamasıdır. Tohum 99 ve 404'te 100 sistem koşusu oyun sonuna ulaştı. Doğal 198/183 ay sonuçları daha uzun dönem için genellenemez. Son teslim makbuzu toplamı, motorun 256 kayıtlık geçmiş penceresi yerine olay anında sayıldı. [Devlet bazında sonuçlar](evidence/ticaret-ai-sonkabul0/kampanya/ozet.json)

## 5. Ekonomik fırsat hunisi

Altı kayıtta temas yokluğu 55.498 olayla en sık kapıydı. Onu 5.158 güvenli rota eksikliği, 4.480 siyasi engel, 3.614 rota bütçesi, 2.807 arz-talep eşleşmemesi, 2.664 liman eksikliği, 1.141 mevcut sözleşme, 89 bekleme süresi ve 87 karşılıklı fiyat yokluğu izledi. Tekrar sayımları ayrı devlet/ay kararlarıdır. Olay sayısı ekonomik fırsat sayısı olarak yorumlanmadı. [Tam dağılım ve fiziksel hareket](evidence/ticaret-ai-sonkabul0/kampanya/teslim-etiketleri.json)

Üç küçük galakside 27 yeni risk döneminin en iyi sonucu 5 geç varış, 6 rotasız, 6 bilinmeyen liman, 5 limansız, 3 temassız ve 2 ihracatsız. Aynı çiftte mevcut sözleşme, paylaşım hakkı, risk ve rezerv maliyeti gerçek motorda geçerli kaldı. Ay sonu karşılaştırmaları, karar anındaki kotalı taramayı birebir geri kurmaz. Diplomatik karşı oy için RNG çekilmedi. [Gözlem aracı](../../research/ticaret-ai-sonkabul0/firsat-gozlemi.js) · [Ham kampanyalar](evidence/ticaret-ai-sonkabul0/kampanya/)

## 6. İhtiyaç ve varış zamanı

`aiBalance` sözleşmeli içe akışı hesaplıyor. `need`, negatif net üretimi ve mevcut rezerv tamponunu kullanıyor. İmza ile gelecek yük stoğa eklenmiyor. `itemValue(freight)`, miktar, stok, net üretim ve sefer sayısını değerlendiriyor. Rota uzunluğu `aiTerms` sefer aralığında ve `aiPartnerOffers` sıralamasında rol oynuyor. İlk gerçek varış, kaynak rezervinin biteceği günle karşılaştırılmıyor.

Kontrollü aynı sözleşme üç kolda aynı nominal ithalatı (ayda 12) ve aynı değerlemeyi (131,328) verdi. Rezerv penceresi 195 günken fiziksel varış kısa hatta 30, uzun hatta 229 gündü. Kapanan ilk bağlantı yükü teslim etmeden 12 mineral kaybettirdi. Her kol kayıt yüklenince aynı makbuzu ve RNG'yi üretti. Bu deney mevcut puanın vade duyarlılığına ilişkin sınırı gösteriyor.

Kampanyada yüklenmiş ithalatla çakışan tek acil gözlem 404, gün 5.160, devlet 5 mineral. 7,3 mineral için kalan tahmini 16,35 gün, stok 18,03 iken 60 rezervi zaten aşılmıştı. Zamanında kesinleşmiş yük miktarı sıfır. Bu tek olay, önceki reddedilen nominal ithalat çıkarma kuralını üretime almak için temel vermiyor. [Kontrollü deney](evidence/ticaret-ai-sonkabul0/teslim-penceresi.json) · [404 izi](evidence/ticaret-ai-sonkabul0/kampanya/gozlem-ulu-404.json.gz)

## 7. Stratejik liman yatırımı

404'te 18 risk başlangıcının yedisinde taşıyıcı limanı yoktu. Bu yedi başlangıçta koloniler mevcut olmasına rağmen test edilen kolonilerde olağan liman sipariş kontrolü fiyat döndürmedi. Kapı teknoloji, sahiplik, yuva, bina sınırı ve mevcut stok denetimlerini kapsıyor. Görüşme açısından iki olayda uygun ihracat, bir olayda temas yoktu. Dört olay liman kapısında kaldı. Sahipsiz koridoru sırf ticaret için kolonileştirmek getiri kanıtı gerektiriyor. Liman yatırım ufkunun dört katına çıkarılması daha önce reddedilmişti. [Ekonomik yatırım kararı](../../commerce.js) · [Önceki adaylar](../../AI-RED-KARARLARI.md)

## 8. Transit ve rota bütçesi

Rota bütçesi karar turu başına 96. Altı doğal koşuda `trade-route-budget` 3.614 kez görüldü. Bunların içinden 100 sistemde kıtlık koşuluyla kesişen 467 yön/kaynak incelemesinde zamanında ve iki taraf için pozitif yeni teklif yok. 292 bilinmeyen liman, 89 açık rota yok, 64 ticaret paktı yok, 21 ilgili kaynağı ihracat olanağı yok, 1 farklı kaynak teklif edildi. Ek arama bütçesi için gerekçe oluşmadı. Tarihsel p52 / 99 / gün 6.780 vakası p57 / 99'un doğal sonundan 840 gün sonra gelir. Aynı olayın p57'de tekrarlandığı varsayılmadı.

Transit hakkı taşıyıcıya aittir. `transitOpen` ve `transitVote` gerekli insan oylarını biriktirir. Son oyda yeniden fiyat/stok/rota kontrolü yapıldıktan sonra izin ve sözleşme tek atomik işlemde uygulanır. İzin süreye bağlı ve izin veren koloni/devlet değişirse mevcut hak yeni sahibin hakkına dönüşmez. [Rota ve transit kodu](../../commerce.js) · [TZ kanıtı](evidence/ticaret-ai-sonkabul0/multiplayer/TZ.log)

## 9. Müzakere ve diplomatik kararlar

Ticaret pazarlığı `dealQuote → aiNegotiate → aiRespond → executeDeal` yolunu kullanır. İnsanla temas kararında gizli ihtiyacı hesaplamak yerine `aiPlayerTerms` kendi AI bilançosunu kullanır. Dünya durumu host'ta uygulanır. B ve C kendi eylemlerini senkronize ayna ve gerçek onay düğmeleriyle yürüttü. `ticaretGuveni`, yerleşik sözleşmede ikinci veya sonraki teslimat ve 180 günlük geçmiş koşuluyla oluşur. Ticaretin otomatik ittifak veya savaş veto kapısı yok. [Karar kodu](../../ai.js) · [Host](../../research/mp0/mp-core.js) · [Misafir aynası](../../research/mp6/mirror.js)

## 10. Yapılan düzeltmeler

Ürün ticaret kararlarında değişiklik oluşmadı. Araştırma, VM'de salt okunur fırsat yakalama, zamanlı teslimat deneyi, kampanya ve performans raporlaması ile Chromium kabul kapsamını genişletti. Üç küçük galakside gözlemli ve gözlemsiz koşu ay ay durum, teslimat, Save8 ve RNG eşitliği verdi.

## 11. Reddedilen adaylar

Yalnızca sözleşmedeki ithalatı ihtiyaçtan indirmek geçmişte gerilemeye neden oldu. Güncel gözlemde rezerv eşiğinden önce uygun ve yüklenmiş kargo bulunmadı. Bu yaklaşım yeniden uygulanmadı. Dört kat yatırım ufku ve ayrı transit bütçesinin eski ret kararları geçerli kaldı. Geç gelen yakın vadeli seçenekleri tümden kapatmak, krizi tek başına çözemeyen ama daha sonra üretime katkı sunabilen ithalatı da silebilir. Etkin p57 kararına göre avantaj ölçülmeden böyle bir kural eklenmedi.

## 12. Ekonomik fayda

1180 küçük dünya teslimatında 76 alıcı net açığındaydı. Alım anında alıcının ilgili stoku kaynak tabanının altında olan teslimat gözlenmedi. Doğrudan kritik rezervden çıkışı kanıtlanan devlet sayısı sıfır. Tamamen yok edilmiş veya yağmalanmış seferler ayrıca kayıtlı. Altı koşuda 1.239 teslimat gerçek ekonomik değişim yarattı. İmzaların çoğalması, krizin ticaretle aşıldığına tek başına kanıt sunmaz.

Mineral, enerji, alaşım, yiyecek ve tüketim malları kendi birimlerinde takip edildi. `itemValue` ile ayrı iki taraf değerlemesi alıcı faydası ve gönderici fırsat maliyeti için model göstergesidir. Devletlerin stokları, yapımları ve sonraki savaşlarıyla karşıolgusal net kazancın yerini tutmaz. [Fiziksel hareketler](evidence/ticaret-ai-sonkabul0/kampanya/ozet.json)

## 13. Devlet başına kampanya sonucu

Küçük dünyalarda ay kapanışında 11'de 4, 99'da 20 ve 404'te 443 kaynak-devlet-ay rezerv baskısı kaydedildi. Büyük dünyalarda 11'de 8, 23'te 93 ve 404'te 7. Bir devlet aynı ayda birden çok kaynakta eksik olabilir. Bina, teknoloji, stok ve gönderilen/alınan miktarlar devlet bazındaki ozet.json içindedir. Saldo karşılaştırması aynı p57 gözleminde değişmediği için yeni ticaret kararına atfedilebilir koloni, askerî güç, bilim veya federasyon etkisi ölçülmedi.

## 14. Multiplayer

| Gerçek Chromium | Sonuç | Kontrol |
|---|---:|---|
| TA / TB / TR / TL / TZ | 31/0 | Fiziksel gönderi, anlık seçenek, ele geçirilmiş ve iptal edilmiş aktarma, kayıt-yeni oda, iki misafir onayı, karşı teklif, ret ve yenileme |
| SG / J / X | 15/0 | Tek ödeme, kayıp yanıt, fed oyu, ayna ve takviye |
| I 500/16, 15 dk | 4/0 | İki ayrı misafir profili, 572 örnek, 30 olay, 0 kapalı pencere donması, sensör ve kayıt doğrulaması |
| I 100/9, 8 dk | 4/0 | 332 örnek, 16 olay, 0 kapalı pencere donması, en büyük 7,7 oyun günü farkı, yeniden katılım ve kayıt eşitliği |

Yerel üretim relay ve TLS vekili kullanıldı. TZ ikinci onay öncesi bağlantı kopması sonrası kısmi kararın korunduğunu ve mükerrer onayın ödeme uygulamadığını gösterdi. TR relay yeniden başlatma ve yeni oda sonrası yoldaki teslimatı bir kez doğruladı. TA üçüncü tarafın sözleşme ve konvoyu görmediğini doğruladı. TB B'nin konvoy konumu ve gerçek ara liman geçişini host ile eşledi. [Chromium günlükleri](evidence/ticaret-ai-sonkabul0/multiplayer/)

## 15. Mobil arayüz

Gerçek Chromium dokunmatik benzetimi 800×360, 844×390 ve 901×411 yatay boyutlarda transit kartı, onay beklemesi, ret, izin süresi, yenileme ve konvoy listesi 24/0. Fiziksel Android NOT RUN. [Ekran ve sonuç verileri](evidence/ticaret-ai-sonkabul0/multiplayer/mobil-transit.json)

## 16. Save8 ve RNG

100/9 ay 120 ve 500/16 ay 120/180 aynı kayıtları iki kökte açıldı ve bir ay yürütüldü. Öncesi, sonrası Save8 SHA-256 ve RNG aynıydı. Bekleyen kısmi transit, tamamlanmış transit, yoldaki yük ve yeniden kabul olumsuz testleri geçti. Geçersiz teklif şekli olumsuz kontrolü eski karşılaştırma kökünde tek taraflı kaynak etkisini yeniden üretti, p57 düzeltmesinde kaynak değişmedi. `faz86c_6_transaction_acceptance` 534/0 ve filo defteri geri alma kapsaması sürdü. [Save8/RNG](evidence/ticaret-ai-sonkabul0/kayit/save-rng.json) · [Olumsuz kontrol](evidence/ticaret-ai-sonkabul0/kayit/deal-shape.json)

## 17. Tam Node

Tek bütünleşik ham koşu 256 paket, **6.880 PASS / 48 FAIL**. #83'ün 6.888/47 taramasıyla paket sayacı farkı yalnız `faz93d1_navy_campaign_test.js`. Ağır kampanya 180 saniye kuralına takıldı. `faz86c_3_ai_negotiation_test.js` tarihsel süre kontrolü yüklü koşuda 27,47 ms. Test beklentileri ve süre sınırı aynen kullanıldı. Ham toplam değiştirilmeden doğrudan tekrar sonuçları ayrı tutulur. Kalan tarihsel FAIL'lerin arasında p57 ticaret akışında doğrulanmış yeni deterministik kusur yok. [Paket farkı](evidence/ticaret-ai-sonkabul0/node/paket-farki.json) · [Ham Node özeti](evidence/ticaret-ai-sonkabul0/node/ham-ozet.json)

## 18. Performans

ABBA ve A/A aynı kayıtlar ve eşit p57 çalışma zamanı ile koşuldu. Geçiş yükünü dışarıda tutmak için her girdi ölçülmeden önce bir ay aynı p57 altında ilerletildi. 12 örnek/kol, iki ısınma ve dengeli örnek sırası kullanıldı.

| Girdi | CPU medyan A/B ms | CPU p95 A/B ms | A/B p95 | A/A p95 | Duvar p95 A/B farkı |
|---|---:|---:|---:|---:|---:|
| 100/9 m120 | 362,7 / 348,5 | 400,9 / 395,0 | −%1,48 | −%10,52 | −%5,04 |
| 500/16 m120 | 1.733,6 / 1.717,8 | 1.885,5 / 1.872,0 | −%0,72 | −%2,22 | −%0,24 |
| 500/16 m180 | 5.772,1 / 5.755,7 | 6.242,8 / 6.161,3 | −%1,30 | −%0,11 | +%1,85 |

Kaynaklar eşit. Farklar hız kazanımı sayılmadı. 100 sistem A/A gürültüsü küçük yüzde farklarının yorumunu sınırlıyor. Kollar arası Save8 ve RNG eşit. 500/m180 ayrı sayaç koşusunda 79 rota çağrısı 2,85 CPU ms, 28 liman incelemesi 0,12 ms, 15 bilanço 0,21 ms, bir fırsat turu 8,12 ms, 60 konvoy tiki 5,86 ms. Dört genel `dealTxBegin` 473,43 CPU ms sürdü. Bunların tümü ticarete atfedilemez. Profil süreleri iç içe olduğundan toplanmaz. [Ham ABBA/A/A ve yöntem sayaçları](evidence/ticaret-ai-sonkabul0/performans/abba.json)

## 19. Eski kayıt uyumluluğu

Mevcut Save8 v8, MP paket 4 ve protokol 1 aynı. Kanonik p53 kaynağı `1dec7046fa843203e94fb74ab2733e7e04bf3738` üzerinden üretilen eski Save8 ve MP4 paketi, p57’de izin, stok, rota ve iki konvoyu aynı durumda açtı. Kayıt açılırken ödeme veya teslimat uygulanmadı. Her iki girişte 12 mineral ve 8 enerji tekil makbuzlarla aynı RNG sonucunda teslim edildi. [p53 Save8 ve gerçek MP4 kanıtı](evidence/ticaret-ai-sonkabul0/kayit/p53-uyum.json) Yeni oda akışında transit kayıtları ve yoldaki kargo eşitliği doğrudan Chromium'da doğrulandı. [TR günlüğü](evidence/ticaret-ai-sonkabul0/multiplayer/TR.log) · [Cargo Node](evidence/ticaret-ai-sonkabul0/node/faz96a_cargo.log)

## 20. ZIP ve yayın

**P58 için ekonomik ve işlevsel değişiklik kabul edilmedi.** Oyun kimliği p57 olarak kaldı. Yeni ZIP ve sürüm manifesti oluşturulmadı. Mevcut p57 GitHub çalışma zamanı manifesti 19/19 dosyayla doğrulandı. PR #84 araştırma ve kabul için taslaktır.

## 21. Açık riskler

Uzun mesafede teslimat gecikmesi ve sınırlı diplomatik temas ekonomik etkiden önce gelen koşullar. 500 sistemde üç tohum ve 120 ay, daha geç ağ olgunlaşmasına genellenemez. Temas oranı yüksek ve zamanında ulaşan, yine de değerlendirilmemiş gerçek teklif bulunduğunda karar deneyinin yeniden açılması gerekir. Android, uzak internet, LAN ve canlı Render **NOT RUN**.

## 22. Sonraki faza devir

Ticaret kararının güvenli geliştirme tabanı p57. Temas verimliliği ayrı C2 çalışmasına ait. Özellikle gözlemlenmiş rota ve gerçek diplomatik temas sonrası kârlı ticaret seçeneği ölçülebilir. Bu çalışma C2 uygulaması içermiyor. [Devir](CODEX-TICARET-AI-SONKABUL0-DEVIR.md)
