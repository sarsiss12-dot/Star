# Faz 96E → 96E.1 — eş koşullu AI kampanyaları

3 seed (11, 99, 404), her sürümde 120 ay, normal zorluk, orta galaksi, 5 AI. Harita koordinatları, bağlantıları ve başkentler eşitliği assertion ile doğrulandı; kimlikler bu fazın değişkenidir. 60. ayda gerçek Save v8 serialize/deserialize yapılır. Yarım günlük 7200 adım/kampanya, mevcut dailyTick/structTick/colonyBuildTick/autoExploreTick/monthTick motorları çalışır. Oyuncu hareketsizdir; köken ayarları varsayılan, kriz ve konsey bu karşılaştırmada kapalıdır. Karşılaştırma bu kapsamın dışındaki geç oyun kriz dengesini kanıtlamaz.

Tabloda 96E→96E.1:

| Seed | Yaşayan AI | Teknoloji toplamı | Gemi | Teslimat | Koloni | Kritik devlet-ay | Aylık filo bakım (enerji) |
|---|---|---|---|---|---|---|---|
| 11 | 5→5 | 30→39 | 92→183 | 61→72 | 9→10 | 2→0 | 513.20→546.11 |
| 99 | 5→5 | 45→43 | 141→225 | 114→20 | 12→16 | 4→2 | 510.20→641.48 |
| 404 | 5→5 | 53→54 | 253→288 | 131→131 | 21→22 | 2→0 | 800.39→978.54 |

Tüm aylarda sonlu ve negatif olmayan kaynaklar PASS. Kritik devlet-ay: yaşayan AI'da enerji/mineral/tüketim/alaşım geliri negatifken stokun o aylık açığın 3 katından az olması; “oyun kaybedildi” ölçüsü değildir. Teslimat, Commerce.state().stats alıcı teslimat sayacıdır; sanal para transferi veya tahmin değildir. Güç aralıkları, gerçek gelirler, kaynak stokları, bakım ve kimlikler JSON aylık kayıtlardadır.

Sonuç karışıktır: seed99 ticaret teslimatı ciddi düşer, bilim de geriler; seed11 bilim/ticaret artar; seed404 bilim artar, teslimat aynı kalır. Filo sayısı artışı tek başına daha iyi AI kanıtı sayılmadı. Bakım yükü yükselir; üç seed genelleştirme ve uzun geç oyun denge onayı için yeterli değildir.

Dağılım: 40 seed'de 440 AI; 13 civic'in tamamı, 33 civic kombinasyonu, 103 radikal (%23,41). En yüksek tek kombinasyon 25/440 (%5,68); gen_oncu 123, lojistik_k 101 gibi normal civic frekansları iki civic taşıyan devletleri kapsar, yüzde toplamı 100 değildir. Ahl -3..3 değerleri görülür. Her seçim bağımsız özel seed akışı kullanır; dağılım sonuçları kesin kota değildir.

Performans: seed404 için bir ek eşleştirilmiş süreç tekrarında yaklaşık 30.74 saniye, tepe RSS 276076 KiB. RSS aynı süreçte iki VM/sürümün toplamını kapsar, sürüm başına izole ölçüm değildir. Başka testler eşzamanlı çalışabildiğinden süreler performans artışı iddiası için kullanılmadı. OOM/çökme gözlenmedi; uzun süreli bellek sızıntısı profili NOT RUN.
