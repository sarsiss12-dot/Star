# Üç bağımsız geliştirme görevi

Her görev kendi dalında uygulanır. Kanonik p51 kaynak commit’i `1b95efb27a265f607bc33a3e131b071fb80d28e6`, PR #75. Uzak dal ilerlemişse farkı incele. Başlangıç raporu [STARS Ticaret Kök Neden.0](../../reports/codex/STARS-TICARET-KOK-NEDEN0.md). Her prompt, diğer ikisi uygulanmadan da yürütülebilir. Başlangıçta p51’e karşı yeni testler ve yerel ölçüm sonuçları üret. Oyun sürümü veya dağıtım ayrı yetki gerektirir.

## Prompt 1 · TİCARET-GEÇERLİ-HAT.0

STARS’ta `Commerce.aiPorts` yalnız ilk yönün yoluna baktığı için kısa ama karşı yönde geçersiz limanı seçebiliyor. `dealQuote` reddedince aynı devletin geçerli diğer limanı o turda unutuluyor. `research/ticaret-kok-neden0/partner.cjs` bu durumu iki gerçek makbuzla kanıtlıyor.

Önce kaydı aynı p51’de çalıştır. Sonra mevcut arama bütçesinin içinde geçerli iki yönlü hattı seç. İlk seçeneğin teklifi gidiş/dönüş rotası veya miktar kapasitesi sebebiyle kapanıyorsa, önceden bilinen sınırlı liman adaylarından sonraki uygun seçeneği aynı karar anında değerlendir. Geçerli teklif oluştuğunda asıl `dealQuote` ve gerçek AI kararı kullanılsın. Ret sebebi siyasi, stok veya mevcut sözleşmeyse uygun kapıları koru. Üç sıçrama, izin fiyatı ve arama bütçesi değişmesin.

Kabul ölçütleri

- Kontrollü 4 numaralı hedef geçersiz olmasına rağmen 9 numaralı limanla tek sözleşme, 16 mineral ve 14,3 enerji bir kez teslim. Aynı stokta aynı RNG.
- Dönüş geçersiz ve alternatif yoksa harcama ve sözleşme 0. Yanlış izin/istihbarat yok. Ambargo, geçersiz stok ve kapalı limanda eski retler.
- Rota seçimini etkilemeyen p51 kayıtlarında 100/500 Save8 ve RNG bayt eşit. Tetiklenen kayıtta ilk karar ve iki makbuz günlükte.
- 96 rota birimlik üst sınırı ve tarafların onayını koru. p51 12 transit ve 9 kargo uyumu regresyonunu çalıştır.
- Doğal hacim büyümesini kabul eşiği olarak kullanma. Gerçekten daha iyi aday başka limanda bulunduğunda hangi kapının kalktığını raporla.

## Prompt 2 · TİCARET-TESLİM-DEĞERİ.0

STARS p51’de `aiBalance` taahhüt edilmiş ihracatı çıkarıyor, olası ithalatı hesaplıyor ve ihtiyaç puanına varış takvimini katmıyor. `aiTerms` iki tarafın fiyat aralığını ve nominal sefer sayısını değerlendiriyor. 404. tohumda fiziksel gıda teslimatı yoktu. 11. tohumda uzun hat çalışıyor fakat örnek genişleme/kriz üstünlüğü göstermiyor.

İlk adımda işlemi değiştirmeyen denetim ekle. Mevcut p51 karar kayıtlarında aynı aktörün üç seçeneğini ölç. (1) İzinli hatta ilk ve sonraki teslimin stok tükenmeden yetişmesi. (2) En hızlı ödenebilir yerli üretimin tamamlanma zamanı ve marjinal üretim maliyeti. (3) Uygun seçenek bulunmayınca mevcut ekonomik davranışın sürmesi. Etki fiyatı, karşı kargo, planlanmış ihracat, gerçek varış penceresi ve bilinen risk belirtilsin. Kesinleşmemiş ithalatı depoya yazma. Kaynak ve bilgi sınırları, sözleşme ve ödeme işlemleri p51 ile aynı kalsın.

Aynı kayıttan ayrıştırılabilen en az üç ayrı fırsat bulunursa yalnız `aiTerms`/ortak seçiminin kanıtlanan dar bölümüne aday puan ekle. Araştırmada kullanılan 99 ve 404 kıtlık profilleriyle en az bir örnekte gerçek gıda veya tüketim malı teslimini kriz başlangıcından önce gerçekleştir. Aynı kayıtla p51, aday ve bir RNG plasebo kolu. Yerli madenin baskın olduğu önceki D1 vakasında üretim seçimi sürmeli. Yeni küresel fiyat/uzmanlaşma bonusu, kolonizasyon teşviki veya rota bütçesi artışı bu işin dışında.

Kabul ölçütleri

- Araştırma fiyatı ile envanter farkı ayrışsın. Hangi gerçek ihtiyaç kaç ay erken karşılandı, alıcının kazancı ve karşı tarafın bedeli kaynak bazında verilsin.
- 100/9, tohum 11/99/404. 120. ayın yanında 180 veya kayıt hayattaysa 240. ayda net gerçekleşen değer, eksi stok ayları, kayıplar, imza ve makbuz. Aday doğal olarak kâr etmiyorsa yalnız gölge sonuç ve ret nedeni kaydedilsin.
- Tetiklenmeyen kararlar bayt eşit. İlk ayrışan kararda RNG, Save8, stok, yük ve siyasi izinler. Ana ücretler bir kez. Rota ve teklif CPU maliyeti küçük ve büyük galakside A/A bandıyla birlikte raporlansın.

## Prompt 3 · TİCARET-OYUNCU-KABUL.0

Mevcut STARS p51 ticaret kartını denetle. Klavyesiz miktar ve sıklık/süre kontrolü zaten var. Mobil ekranda oyuncu anlık kaynak, tek seferlik fiziksel kargo ve düzenli kontrat arasındaki etki farkını, imza ile ilk yükün iki yönlü varış zamanını ve hangi liman/iznin kapanmayı yarattığını aynı kartta anlayabilsin. Yeni ekran veya yeni gemi sınıfı tasarlama. Sadece hostun açıklayabildiği görünür kaynak ve izin bilgilerini kullan. Uzak misafir açıkı nedeniyle oyuncu karşı tarafın gizli limanını öğrenmemeli.

Yerel relay ve ayrı Chromium bağlamlarıyla host + 2 misafir. 800×360 ile 844×390. Gerçek dokunma ile teklif, ret, karşı teklif, kabul, iptal, konvoyu bul, yolda kayıt → yeni oda, yeniden katılım. Gizli liman, başka oyuncunun kargosu, aynı komutun tekrar gönderilmesi ve sahiplik değişimini kontrol et. Fiziksel Android, gerçek LAN veya canlı Render kullanılamıyorsa NOT RUN yaz.

Performansta `research/ticaret-kok-neden0/browser-load.cjs` ile 0/1/8/32/64 aktif yükü ve 168 limanlı 500 sistemi yeniden ölç. Harita çizimini ayrı tut. 64 aynı uzun yükte medyan kritik yolu en az %25 düşürme hedefiyle, yalnız tekrarlanan `remainingRoute` denetimini kanıtlanmış özdeş güzergâhlarda paylaşmayı dene. A/A gürültü bandı ve p51 karşısında dengeli Chromium AB/BA. Çıkış/varış limanı fethi, izin süresinin dolması, iptal, eşzamanlı yükleme/teslim ve ambargo önbelleği hemen geçersiz kılmalı. H/J, TL/TB/TR, Save8/RNG ve makbuz eşitliği zorunlu. Karşılaştırmada veri, karar veya süre eşdeğerliği bozulursa adayı geliştirme dalında tut ve kanıtı raporla.
