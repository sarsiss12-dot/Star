# AI kalite denetimi — 94C

## Yöntem ve sınırlar

Doğrulanmış 94B ile 94C, aynı üretim kodunu çalıştıran VM hostunda karşılaştırıldı.
Normal zorluk, orta sarmal harita: 11/99/404, 120 ay. İlave kontrol: tohum 99,
360 ay, korsansız ve AI başlangıç stokları en fazla 25; tohum 404, 100 sistemli
ULU harita, 120 ay. Düşük stok yalnız test kurulumu olup oyuna bir avantaj
vermez. Gerçek günlük/aylık döngü, üretim, savaş, diplomasi, bilim ve keşif
çalışır. Aşağıdaki toplamlar yalnız normal AI devletleridir; oyuncu hariçtir.

Beş farklı mevcut AI doktrin değeri gözlendi: militarist, tuccar, yayilmaci,
pasifist ve eski izolasyonist değeri. Tür/etik kimlikleri ham veride saklıdır.
Bu örneklem bütün sekiz doktrin/tür/civic birleşimlerinin kampanya kabulü değildir;
özel teknoloji erişiminin kapsamlı birim regresyonları ayrıca korunmuştur.

## Eski sürümle karşılaştırma

| Senaryo | Sürüm | Ay | Koloni | Askerî güç | Keşfedilmiş | Gemi siparişi | Kayıp | Casus op. | Kabul edilen anlaşma | Host sn |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 11 | 94B | 120 | 16 | 24624 | 127 | 316 | 132 | 9 | 9 | 8.23 |
| 11 | 94C | 120 | 11 | 16053 | 121 | 347 | 222 | 19 | 11 | 8.23 |
| 99 | 94B | 120 | 12 | 19105 | 65 | 269 | 130 | 10 | 7 | 7.18 |
| 99 | 94C | 120 | 12 | 19105 | 65 | 269 | 130 | 10 | 7 | 8.40 |
| 404 | 94B | 120 | 24 | 33953 | 128 | 302 | 79 | 0 | 14 | 8.33 |
| 404 | 94C | 120 | 24 | 33953 | 128 | 302 | 79 | 0 | 14 | 8.68 |
| 99-long | 94B | 360 | 18 | 67392 | 172 | 900 | 476 | 91 | 87 | 32.11 |
| 99-long | 94C | 360 | 17 | 68522 | 134 | 909 | 473 | 93 | 83 | 33.53 |
| 404-large | 94B | 120 | 34 | 37971 | 284 | 527 | 234 | 42 | 37 | 33.28 |
| 404-large | 94C | 120 | 34 | 41155 | 284 | 545 | 222 | 41 | 37 | 31.14 |

Gemi kayıpları canlı gövde nesnelerinin kaybolmasıyla sayılır; aynı geminin başka
filoya taşınması kayıp değildir. Araştırma ilerlemesi aylık tamamlanan teknoloji
listelerinden izlenir. Casusluk maliyeti tabloda Etki harcamasıdır; bütün kaynaklar
ve başarıdan sonraki uzun dönem fayda için tek bir parasal değer uydurulmadı.

94C ticaret düzeltmesi kaynak yaratmayı kaldırdığı için 11 gibi bazı kampanyalarda
AI toplam gücü/koloni sayısı düşmüştür. Bu sonuçlar başarısızlık olarak gizlenmedi;
kaynak doğruluğu yerine eski ücretsiz girdiye göre güç eşitlemesi yapılmadı.
99 ve 404 standart senaryolarında sonuçlar aynıdır. Başka senaryolarda küçük
kaynak farkları sonraki RNG kararlarını ve savaşları değiştirebilir.

## AI inceleme sonuçları

**Ekonomi ve üretim:** Bütün senaryolar istenen aya ulaştı; aylık örneklerde negatif
veya sonlu olmayan kaynak yok. Stokta uzun süre sıfır ve negatif aylık gelir olan
kaynaklar `per-empire-analysis.json` içinde ayrı sayıldı. Bunlar türün gıda
kullanmaması gibi sebepleri de içerebilir; her sıfır stok ekonomik kilit sayılmadı.
Yedi kaynağın min/max/son stokları, son gelirleri, tersane kullanım oranı, üretim
engeli gerekçeleri, kapasite ve sınıf bazlı sipariş/kayıplar devlet bazında saklı.
Düşük stoklu 360 aylık kontrol toparlanma davranışını kapsar; bütün devletlerin
hayatta kalacağı veya depolarını optimal kullanacağı garantisi verilmez.

**Askerî kararlar:** Mevcut kod zayıf filoyu büyük filoya yönlendiriyor, tehditli
sistemleri önceliyor, hedef savunmasını ve doktrine bağlı geri çekilmeyi değerlendiriyor.
93D.1 çoklu tersane bütçesi, 93C bileşim ve 93B sevkiyat regresyonları geçti.
Buna rağmen sefer düzeyinde ortak varış/taarruz takvimi yok; parça parça varış,
intihar riski ve savunma dağılımı 95A'da olay bazında ele alınmalı. Bu fazda
bunların tümü çözülmüş gösterilmedi. Kapalı savaş cephelerinde net işgal kazancı,
kaybı ve sıfır değişim ayrı hesaplandı; bu değerler resmî bir “savaş galibi”
alanı değildir. Resmî kazananı kaydedilmeyen barışa yapay galip atanmadı.

**Bilim ve keşif:** `autoExploreTick`, rezervasyonlar ve bütün 94B keşif kodu
korundu. Bütün ölçülen senaryolarda otomatik hedef çakışması sıfır. Tohum 99'da
94B → 94C rota grafiği sayısı 3.796 → 3.796; keşif sonucu değişmedi. Bu, 94A'ya
göre daha önce görülen düşüşün 94C'de düzelmiş olmadığı anlamına gelir. 99'daki
AI 5 tek başına 6.701 bilim gemisi-gün ikmal beklemesi kaydediyor; AI 1'de
1.882,5 gün korsan, AI 3'te 1.193,5 gün düşman tehdidi beklemesi var. Bunlar
çakışma kilidinden ziyade güvenli erişim/ikmal sınırıdır. Bekleyen bütün gemiler
her beş oyun gününde yeniden rota aradığı için maliyet sürer. Olayla geçersizleşen
rota önbelleği, güvenli bekleme aralığı ve ikmal dönüşü maliyetinin denetlenmesi
95A önerisidir; gizli bilgiyi kullanarak daha fazla keşif yaptırılmadı.

**Araştırma kimliği:** Tamamlanan temel ve özel teknoloji listeleri, doktrin ve
türler kayıtlı. Erişim koşulları ve AI açılan içerik kullanımı 93E/93E.1 testleriyle
korundu. Ekonomi veya savunma açığını daha iyi dikkate alan dinamik ağırlıklar ve
eski izolasyonist kimliğinin mevcut doktrin kataloğuyla uyumu 95A denetimidir.

**Diplomasi ve casusluk:** Kabul/karşı kabul, reddedilen müzakere, aktif savaş,
barış imzası, pakt/ittifak ve operasyon çeşitleri ölçüldü. 404 standart örneğinde
operasyon yok; 360 aylık kontrolde operasyonlar kullanılıyor. Sıfır operasyon
tek başına hata sayılmadı; temas, istihbarat, bütçe ve hedef kapıları vardır.
`aiPickOp` hedefe erişimi `spyTargetCheck/opQuote` üzerinden sınırlar fakat bazı
puanlarda rakibin gerçek teknoloji sayısı/hazinesini okur; askerî hedef kodu da
geniş dünya bilgisi kullanır. Bu eski davranışlar yeni eklenmedi. Bütün karar
katmanının bilgi sınırları ve operasyon sonrası ölçülebilir fayda 95A'ya ayrıldı.
Teklif tekrarını önleyen geçmiş cooldown testleri korunuyor; daha anlamlı
stratejik anlaşma önerileri bu fazda yeniden yazılmadı.

**Fraksiyonlar:** Savaş/barış, koloni, teknoloji, fetih, kayıp ve diğer eylemler
`facEvent` ile memnuniyeti gerçekten değiştirir. Aylık durum da memnuniyeti,
güç payını, ekonomik/askerî modifier'ları ve talepleri etkiler. AI için olaylar
ve son mood/pow değerleri kaydedildi. Ancak AI talepleri doğrudan hedef listesine
almıyor; etkiler çoğunlukla modifier/darbe ve mevcut eylemlerin sonuçları üzerinden.
Ordu, tüccar, bilim taleplerinin planlama bütçesine bağlanması 95A işidir.

## Tespit edilen ve düzeltilen gerçek hatalar

1. **Stoksuz aylık takas kaynak yaratıyordu.** 94B'de iki tarafın ilgili stokları
   sıfırken gelir tabanlı 10+10 aktarım alıcılara yazılıyor, vericinin eksiği sıfıra
   kırpılıyordu. `probe-trade-94c.js`: toplam 0 → 20. 94C sonucu 0 → 0.
2. **Başka ortağın rotası takasa yetiyordu.** Herhangi bir açık dış hat bütün
   pakt çiftlerini yetkilendiriyordu. Artık uçlar bu çiftin gerçek koloni ticaret
   limanlarına ait olmalı; ortak sistemlerde baskın sistem sahibi tek başına
   belirleyici değildir. Yıkılmış limanın eski rotası yetmez. Gerçek hiper-yollar,
   savaş engeli ve güncel yağma tekrar kontrol edilir.
3. **Aynı ayın aylık takası yeniden uygulanabiliyordu.** Save v8 içinde isteğe
   bağlı çift/ay damgası tekrar çağrıyı önler; sonraki ay normal çalışır.

Takas iki gerçek stokla aynı oranda sınırlandırılır; karşılık ve kaynak toplamları
korunur. Bir kaynak iki eşleştirmede kullanılsa da her adım güncel stoktan hesaplanır.
Pakt iptali kaynak iadesi yaratmaz. Doğrudan anlaşma stok kapıları ve ikinci
harcama reddi ayrıca test edildi. `executeDeal` ham çağrısı yeni bir işlem talebidir;
kimliği olmayan bu API'yi bütün olası istemciler için genel replay korumasına
çevirdiğimiz iddia edilmiyor. Mevcut UI teklif ömrü/atomiklik regresyonları geçti.

Ticaret gelir çarpanı mevcut soyut ekonomik faaliyettir; fiziksel konvoy teslimatı
motoru henüz yok. Gerçek konvoy olmaması bu fazda değiştirilmedi. Kanıtlanan
aylık kaynak çoğalması kapatıldı; tüm ekonomi/iptal/çok oyunculu yeniden yürütme
yolları için sınırsız bir güvenlik garantisi verilmez.

## Devlet bazında son durum (94C)

| Senaryo | AI / doktrin | Koloni | Güç | Kullanım/kapasite | Tersane doluluk | Teknoloji (özel) | Keşif | Casus op. | Boş bilim gemisi-gün |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 11 | 1 / militarist | 1 | 2091 | 15/47.5 | %48.8 | 2 (0) | 32 | 2 | 4855.0 |
| 11 | 2 / yayilmaci | 2 | 246 | 2/52.0 | %42.1 | 6 (0) | 15 | 8 | 487.5 |
| 11 | 3 / izolasyonist | 1 | 3700 | 31/70.0 | %25.4 | 5 (0) | 11 | 2 | 5853.5 |
| 11 | 4 / tuccar | 5 | 4208 | 39/70.0 | %55.4 | 8 (0) | 32 | 3 | 1439.0 |
| 11 | 5 / tuccar | 2 | 5808 | 50/108.0 | %42.7 | 12 (0) | 31 | 4 | 1825.5 |
| 99 | 1 / militarist | 2 | 3000 | 19/94.3 | %43.9 | 2 (0) | 19 | 0 | 1934.0 |
| 99 | 2 / tuccar | 2 | 3577 | 33/59.8 | %42.3 | 13 (2) | 19 | 0 | 894.0 |
| 99 | 3 / yayilmaci | 4 | 9184 | 77/88.0 | %31.8 | 9 (0) | 10 | 2 | 1348.5 |
| 99 | 4 / pasifist | 1 | 0 | 0/52.9 | %37.2 | 5 (0) | 6 | 8 | 0.0 |
| 99 | 5 / tuccar | 3 | 3344 | 32/58.0 | %12.3 | 11 (0) | 11 | 0 | 6721.5 |
| 404 | 1 / pasifist | 4 | 4521 | 41/73.6 | %21.6 | 9 (0) | 30 | 0 | 3933.5 |
| 404 | 2 / yayilmaci | 7 | 8762 | 71/106.0 | %20.5 | 10 (0) | 8 | 0 | 6825.5 |
| 404 | 3 / militarist | 3 | 12546 | 74/112.0 | %28.2 | 5 (0) | 30 | 0 | 3782.0 |
| 404 | 4 / tuccar | 3 | 3675 | 34/58.0 | %14.0 | 16 (3) | 30 | 0 | 4943.5 |
| 404 | 5 / pasifist | 7 | 4449 | 44/82.0 | %15.0 | 11 (1) | 30 | 0 | 5100.5 |
| 99-long | 1 / militarist | 3 | 14875 | 82/164.0 | %30.4 | 18 (3) | 23 | 12 | 16345.0 |
| 99-long | 2 / tuccar | 2 | 9321 | 78/121.9 | %53.2 | 24 (4) | 33 | 22 | 15670.0 |
| 99-long | 3 / yayilmaci | 4 | 14263 | 102/110.0 | %15.2 | 22 (3) | 25 | 18 | 18405.5 |
| 99-long | 4 / pasifist | 2 | 899 | 9/62.5 | %20.1 | 14 (1) | 20 | 17 | 19134.5 |
| 99-long | 5 / tuccar | 5 | 28787 | 130/149.0 | %14.9 | 35 (3) | 28 | 24 | 19435.0 |
| 99-long | 7 / tuccar | 1 | 377 | 4/61.0 | %11.6 | 5 (0) | 5 | 0 | 102.5 |
| 404-large | 1 / pasifist | 8 | 6097 | 56/103.0 | %9.3 | 20 (3) | 34 | 1 | 5210.0 |
| 404-large | 2 / yayilmaci | 2 | 4068 | 35/67.0 | %24.8 | 12 (0) | 34 | 5 | 4406.0 |
| 404-large | 3 / yayilmaci | 2 | 0 | 0/52.0 | %23.3 | 6 (0) | 19 | 2 | 73.0 |
| 404-large | 4 / pasifist | 2 | 3832 | 34/76.0 | %14.0 | 8 (0) | 28 | 6 | 5549.0 |
| 404-large | 5 / tuccar | 2 | 3933 | 37/66.0 | %26.1 | 12 (1) | 28 | 7 | 5871.5 |
| 404-large | 6 / tuccar | 2 | 486 | 5/52.0 | %30.8 | 8 (0) | 27 | 0 | 321.5 |
| 404-large | 7 / izolasyonist | 3 | 0 | 0/58.0 | %13.4 | 5 (0) | 8 | 2 | 0.0 |
| 404-large | 8 / militarist | 1 | 4378 | 34/99.0 | %22.2 | 3 (0) | 34 | 2 | 4164.0 |
| 404-large | 9 / pasifist | 5 | 3673 | 35/70.0 | %40.8 | 9 (0) | 27 | 2 | 918.0 |
| 404-large | 10 / yayilmaci | 2 | 4280 | 40/52.0 | %41.6 | 10 (1) | 28 | 2 | 5460.5 |
| 404-large | 11 / yayilmaci | 5 | 10408 | 90/108.0 | %25.7 | 12 (0) | 17 | 12 | 6335.0 |

Tam kaynak/gelir dengeleri, sınıf dağılımı, savaş cepheleri, fraksiyonlar ve bütün
aylık örnekler `tests/audit-94c/` içindedir. `per-empire-analysis.json` özetleri
ham veriden `tools/report-ai-94c.py` ile tekrar üretilebilir.

## Determinizm ve performans

60 aylık aynı tohum tekrarı: tam kayıt hash'i ve RNG aynı. 30. ayda Save v8
yükleyip 60. aya ilerletme: RNG ve bütün oyun değerleri aynı. Ham hash yalnız
önceden var olan `_supAt`, `_gateAt`, `_prof` türetilmiş alanlarının yüklemede
normalleşmesinden farklı; fark dosyası saklı. Sadece bu üç cache alanı çıkarılınca
kanonik JSON hash'leri aynı. Bu fark gizlenip ham hash eşit denmedi.

Host süreleri gözlemci ve eşzamanlı regresyon yükünü içerir. Rota grafiği çağrı
sayıları ham veridedir; süre farkları tek başına optimizasyon kanıtı değildir.
100 sistem native Canvas ölçümü ayrıca `camera-performance.json` içindedir.
Fiziksel Android FPS/ısı/bellek kabulü yapılmadı.

## Önerilen 95A işleri

- AI kararlarında istihbarat/sensör bilgi sınırını tek kapıda denetleme.
- Birlikte varış, tehdit yoğunluğu ve ikmal temelinde sefer/savunma koordinasyonu.
- Fraksiyon taleplerini üretim, araştırma ve diplomasi hedeflerine bağlama.
- Kaynak darboğazı, stok birikimi ve özel teknoloji içeriği kullanımı için ihtiyaç planı.
- 99 tohumundaki güvenli bekleme/ikmal dönüşü ve rota önbelleği maliyeti.
- Operasyonların gerçek stratejik getirisi ve teklif kalite/tekrar bütçesi.
- Resmî savaş sonuç kaydı ve standart gözlemci metriği; isimlerden galip türetmeme.

95A veya 94D bu teslimle otomatik başlamaz.
