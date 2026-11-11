# STARS — Reddedilmiş AI araştırmaları: karar özeti

Bu belge, 96H.5.1 → 96H.11 arasında denenip **üretime alınmayan** bütün AI adaylarını tek yerde toplar. Buradaki hiçbir yama oyuna otomatik eklenmez. Bir adayı yeniden açmak için yeni faz kararı, önceden ilan edilmiş kabul kapısı ve aynı Save/RNG üzerinde kontrol–aday karşılaştırması gerekir.

Ortak ders: yerel bir göstergede kazanç (tek seed, tek kaynak, tek devlet) genel faydayı kanıtlamadı. Reddedilen her adayda ya başka bir kaynak (gıda, maden, ticaret), ya yeni devlet toparlanması, ya da filo/güç geriledi.

| Aday | Faz | Ne denedi | Neden reddedildi | Yama |
|---|---|---|---|---|
| D1 | 96H.5.1 | Yeni AI devletlerine doktrin atama (minimal) | Kalite kapısı geçilemedi | `research/96h51/D1-REJECTED.patch` |
| D2 | 96H.5.1 | `assignNewAIDoctrine` ile açık doktrin seçimi (Teknokrasi/Kutsal Meclis görünürlüğü) | Kalite kapısı geçilemedi; dağılım/diplomasi davranışını değiştiriyor | `research/96h51/D2-REJECTED.patch` |
| A1 | 96H.6 | `aiRecoveryInvestment` biriktirme sınırı 3 → 6 ay | Hedefte etkisiz | `research/96h6/A1-REJECTED.patch` |
| A2 | 96H.6 | Pozitif gelirle finanse edilen beklemenin üst süre sınırını kaldırma | 240 ayda ticaret koruması %82,29 (<%85); seed11 yeni devlet kritik ay 9→11 | `research/96h6/A2-REJECTED.patch` |
| C1 | 96H.6 | `aiDemolitionChoice` öncelikli ihtiyaç binasını korusun | Hedefte etkisiz | `research/96h6/C1-REJECTED.patch` |
| C2 | 96H.6 / 96H.6.1 | Rezervin altındaki kaynak üretimini normal yıkımla azaltmama | Bağımsız 240 ay seed11 ticaret 204→155 (%75,98 < %85); kalan uzun seed'ler NOT RUN | `research/96h6/C2-REJECTED.patch`, `research/96h61/C2-rejected.patch` |
| AC | 96H.6 | A2 + C2 birleşik | 120 kapısı geçti, uzun ticaret koruması geçmedi | `research/96h6/AC-REJECTED.patch` |
| T1 | 96H.6.1 | Ücretli işlerin seri tamamlanma ayına göre gelir ağırlığı | Seed404 yerel 42→32 iyi, fakat seed11 aktör7 kritik 9→10; yerel güvenlik kapısı FAIL | `research/96h61/T1-rejected.patch` |
| I1 | 96H.6.2 | Seri kuyruk + peşin bedeli aynı stok yolunda karşılaştırma | Seed11 Save217: gıda sıfır ay 0→6, ardışık gıda kritik 0→11 (maden 9→4 iyileşmesi yetmez) | `research/96h62/I1-rejected.patch` |
| F1 | 96H.6.3 | Dizi sonundaki zorunlu üreticinin finansman riskini iki eylemle hesaplama | Aynı Save217 aktör7: maden kritik/sıfır 9/2→17/5, gıda 0/0→12/8 | `research/96h63/F1-rejected.patch` |
| Kapasite (120/160/200 sistem, 13–20 AI) | 96H.6.3 | Büyük galaksi sınırları | 4× CPU stres kapıları aşıldı (aylık karar karesi > 1500 ms, P95 > 33,3 ms); 120/13 son kademe de RET | `research/96h63/CAPACITY-REJECTED.patch` |
| Sefer bekleme (campaign deadline) | 96H.7 | `aiMilitaryCampaign` başarısız-hedef beklemesini dolmadan uzatmama | Kilit gerçekten açıldı, fakat seed11 ay60→84 güç 10323→4990, gemi 81→44, bilim 22→21; gün 2310'da 22 gemi terhis (`aiDisbandTick`) | `research/96h7/campaign-deadline-rejected.patch` |
| 96H.8 aday 1 (yalnız maliyet kapısı) | 96H.8 | Bekleme düzeltmesi + gerçek sevk bakım kapısı, yalnız tam filolarla | `aiTurn` rally yığınını birleştirdiği için seed11 devlet1'in tek sevk adayı 24 gemilik bölünmez filo; AI hiç saldırmıyor (yapay pasiflik) | `research/96h8/candidate-1-gate-only-REJECTED.patch` |
| 96H.8 aday 2a (müfreze, geri çağırma yok) | 96H.8 | Aday 1 + karşılanabilir müfreze | Yerine 2b geldi: 120 ayda sınırda geçen tam sevk açık uçlu kaldı, seed11 devlet1 ay 78'de 15 gemi terhis | `research/96h8/candidate-2a-detachment-SUPERSEDED.patch` |
| 96H.9 aday A (kuşatma niyeti + koşulsuz alaşım ayırma) | 96H.9 | Yalnız gerçek kuşatmada ordu bedelini savaş gemilerinden ayırma | Alaşım birikti ama ordu `energy-runway`'de düştü (seed11 devlet1 net −148: gerekli 1776, mevcut 1688); ayırma savaş gemilerini boşuna engelledi; 0 kara savaşı | `research/96h9/candidate-A-siege-opportunity-REJECTED.patch` |
| 96H.9 aday B tek başına (ordu satın alma) | 96H.9 | Kolonili savaş hedefi için ordunun hazırlıkta alınması | Gerçek çıkarmalar başladı ama eskort her turda rally'ye çağrıldı; seed11 5 × 240 ayda 34 ordu filosu kayıp (BC: 16). Üretimde yalnız C ile birlikte (BC) | `research/96h9/candidate-B-army-only-REJECTED.patch` |
| 96H.9 aday C tek başına (kuşatmayı sürdürme) | 96H.9 | Hedefteki kampanya kuvvetini rally'ye çağırmama | Ordu olmadan kuşatma bitmiyor; seed11 240 ay savaş terhisi 34,8 → 46,2, 8 × 120 tek dünya toplamı 11 → 47 | `research/96h9/candidate-C-siege-hold-only-REJECTED.patch` |
| 96H.10 aday D2 (D + güvenli rota) | 96H.10 | Ordu rotası görünür düşman gücünün tuttuğu ara sistemlerden geçmesin | seed11'de D ile aynı; seed23'te eskortsuz varış 0 → 3, savaş terhisi 57 → 61. Ek fayda yok | `research/96h10/candidate-D2-route-safety-REJECTED.patch` |
| 96H.10 aday P (D + yığma cezası varışa baksın) | 96H.10 | Aynı kolonideki orduların birlikte ileri-geri salınmasını önleme | Emir sayısı D'ye göre seed11 222 → 74, seed23 196 → 73. Ancak plasebo bantlarında ordu kaybı tutarsız (bir dünyada 3 → 10), kritik ay iki dünyada +1 | `research/96h10/candidate-P-stacking-destination-REJECTED.patch` |
| 96H.10 aday E (ordu için alaşım tavanı) | 96H.10 | Stok yetiyorsa tek ordu gövdesi aylık alaşım bütçe tavanını aşsın (96C.1 benzeri) | Hedef olayda (seed23 sys41) ordu maden kapısında düştü, alaşım ayırması çözüldü, katastrof aynı ay; nedensel fayda yok. Kök neden ekonomi eşiği, ayrı faz kararı | `research/96h10/candidate-E-army-budget-REJECTED.patch` |
| 96H.11 aday R (yerine koyma değer kapısı) | 96H.11 | Üretken bina, aynı ağırlıklarla söktüğünden fazla değer eklemiyorsa yıkım yapılmasın | Yıkım 331 → 229, ama aynı binayı yeniden inşa 88 → 85 (hedefte etkisiz); 8 × 120 teknoloji 336 → 312, mineral stoku 68k → 86k (stoklama) | `research/96h11/candidate-R-replacement-gain-REJECTED.patch` |
| 96H.11 aday B1 (başkent tipi odak kapsamı) | 96H.11 | Yönetim yalnız başkent sistemindeki ilk koloniye; diğer anavatan kolonileri ortak kuralla | Tetiklenen 4 seed'de çıktı artıyor, Etki −%15–25. Ama seed42 devlet4 mineral tuzağı: kritik ay [3,45,9,57,57], kontrol [1,0,0,2,2] (bant dışı) | `research/96h11/candidate-B1-capital-focus-REJECTED.patch` |
| 96H.11 aday M (litoit dışı mineral açığı) | 96H.11 | `e.inc.min < 0` mineral krizi gibi Sanayi seçtirsin | Tek başına plasebo bandı dışında etki yok (seed 23/99/123) | `research/96h11/candidate-M-mineral-deficit-focus-REJECTED.patch` |
| 96H.11 aday BM (B1 + M) | 96H.11 | Birlikte | 120 ay iyi (kanonik teknoloji 336 → 352, kritik ay 14 → 11), ama 240 ayda seed42 devlet4 min/tuk krizi medyan 98 [1..129], kontrol 1 [0..55] | `research/96h11/candidate-BM-capital-focus-mineral-REJECTED.patch` |
| 96H.11 aday BM2 (B1 + her sanayi açığı) | 96H.11 | Herhangi bir ene/min/ala/tuk geliri negatifse Sanayi | Her seed'de tetikleniyor; 8 × 120 kritik ay 14 → 25, teknoloji 336 → 328 (seed11 0 → 13 kritik ay) | `research/96h11/candidate-BM2-industrial-deficit-REJECTED.patch` |
| 96H.11 aday BM4 (B1 + acil sanayi kaynağı) | 96H.11 | `aiEconomicOrder` aciliyet ölçütü ene/min/ala/tuk'u acil sayınca Sanayi | Kriz 7/8 seed'de eşit ya da düşük, seed42 düzeliyor. Ticaret koruması geçmiyor: seed11 240 ay teslimat medyanı 288 → 95, seed7 120 ay 104 → 52. seed404 dünya gücü bant altında; değişiklik geniş | `research/96h11/candidate-BM4-urgent-industry-REJECTED.patch` |

## BETA-AI-QUALITY.0 araştırması (11 Kasım 2026)

- Gıda aciliyetini `aiStrategicFacts.severe` listesine ekleyen tek satırlık deney üretime alınmadı. Aynı p23 Save8/404/100sistem9AI/120ayda kritik devlet-ay78→78, koloniler28→28, gemiler241→241, teknoloji84→84. Plan başarısız sayacı7→6 olsa da her aylık gerçek kaynak/koloni/filo/istikrar sonucu ve sonRNG aynı kaldı; bu kozmetik sayaç farkı kalite kazancı değildir.
- Deney yalnız test runtime'ına yüklendi; oyun dosyaları ve p23paketi değişmedi. [RET kararı ve yama](reports/codex/evidence/beta-ai-quality0/experiments/decision.json), [rapor](reports/codex/BETA-AI-QUALITY0-SONUC.md).

## BETA-AI-RECOVERY.0 (araştırma, 11 Kasım 2026)

-404/100sistem9AI/60.ay aynı Save8'inden biriktirme, harcama erteleme, mevcut takas, söküm ve girdi üreticisi önceliği karşılaştırıldı.36ay tarama ve güçlü adaylarda120.aya devam yapıldı. Hiçbiri sonunda tüketim krizini kalıcı kapatmadı; ürün koduna alınmadı.
- En güçlü birleşik seçenek devlet2kritikayını60→23, sıfırstok60→6 indirdi; buna rağmen120.ayda tüketim stoku yine0/net−12,79. Diğer AI'da3kritik enerji ayı görüldü. Bu geçici, bedelli rahatlama kalıcı kurtarma değildir.
- Yeni kanıt: krizdeki başkentte13korsan filosu/3848güç ve her ay yenilenen bombardıman damgası; gerçek istikrar hedefi81,5 olsa da normal toparlanma engelleniyor. Ekonomik kilit yalnız bütçe etiketi veya170madenlik eşik değildir.
- [Tek sonuç raporu](reports/codex/BETA-AI-RECOVERY0-SONUC.md), [karşılaştırma](reports/codex/evidence/beta-ai-recovery0/comparison.json). Bütün adaylar test runtime'ına enjekte edildi; p23oyun kodu/ZIP'i değişmedi.

## BETA-AI-DEFENSE.0 araştırması (11 Kasım 2026)

- Aynı404/60.ay kaydında yalnız test bombardıman izolasyonu:60→22 kritik ay, istikrar0→81,5 ve son tüketim/gıda netleri+1,43/+21,51. Bu ürün düzeltmesi değildir; korsanlar/uzay çatışmaları korunur, RNG ayrışması açıktır.
- C1 mevcut savunma çağrı kapısı: hazır kuvvetli fikstürde gerçek emir/çatışma başarılı, fakat404'te60 kritik ay sürer; dünya73→77. RET.
- C2 C1+işgal altındaki tersanede gövde erteleme: kaynak/gemi israfını azaltır ama kuvvet kilidi sürer;404 dünya73→79, Seed11yeni kritik ay. RET.
- C3 C1+mevcut bağ, kendi görüşü, yedek kuvvet, rota ve bakım kapılarıyla korsan savunması: Wyndor yardım emri0,404yine60kritik ay/dünya77. RET. Yeni korsan cephesi veya insan adına rıza yaratılmadı.
- Ürün dosyaları/p23ZIPdeğişmedi, p24build yok. [Tek rapor](reports/codex/BETA-AI-DEFENSE0-SONUC.md), [karşılaştırma](reports/codex/evidence/beta-ai-defense0/comparison.json). Sonraki dar soru kilitten önceki savunma hazırlığı ve mevcut yardım sözleşmesinin korsan kapsamıdır.

## Açık kalan gerçek sorunlar (çözülmedi)

- ~~Sefer bekleme kilidi~~ → **96H.8'de çözüldü**: bekleme düzeltmesi, sevk bakımı kapısı, müfreze ve geri çağırma ile birlikte (`AI-SEFER-VERIMLILIGI-96H8.md`). 96H.7 yaması tek başına hâlâ reddedilmiş durumda.
- ~~Kolonili hedef kara ordusu olmadan düşmüyor~~ → **96H.9'da kısmen çözüldü**: ordu hazırlıkta alınıyor, kampanya kuvveti kuşatmayı sürdürüyor (`AI-ISTILA-VERIMLILIGI-96H9.md`). Yoldaki ordu eskort çekilince hâlâ yeniden değerlendirilmiyor; ordu yetişmezse tutulan kuşatma 6 ayda katastrofa dönebiliyor (seed23).
- Kara ordusu güvenliği → **96H.10'da kısmen çözüldü**: ordu, görünür düşman gücünün tuttuğu sisteme gönderilmez, yoldaki güvensiz emir yeniden değerlendirilir (`AI-KARA-ORDUSU-GUVENLIGI-96H10.md`). Kalanlar: saldırı altındaki tersanede doğan ordular, savunma adımındaki ileri-geri salınım (P reddedildi), son şeritteki ya da ara sistemdeki ölüm.
- Seed23 katastrofları: yoksul saldırgan orduyu karşılayamıyor (aylık alaşım tavanı + maden); `incomingArmy` ateşkesi yalnız son atlayışı görüyor (motor kuralı). Ayrı faz kararı.
- Hedef → eylem → başarı bağı: `contain` kendi toprak artışını, `security` kale sayısını, `recovery` bütçeyi ölçüyor; `prof.exp` / `e.agr` karara bağlı değil.
- Ekonomide kuyruk zamanı ve takip eden üreticinin finansmanı (A2/C2/T1/I1/F1 hattı).
- Seed11/404 geç dönem yeni devlet ekonomisi, seed2026 ticaret kaybı.
- 96H.11: yerine koyma (yıkım) döngüsü. Yıkımların %27'sinde sonraki sipariş sökülen bina oluyor; puan dökümhaneyi (−14,65 min, +11,63 ala) negatif değerli sayıyor. C1, C2 ve R reddedildi.
- 96H.11: başkent tipi odak bütün anavatan sistemine uygulanıyor (4/8 seed). Düzeltme (B1), Sanayi'yi yalnız litoit mineral krizinde seçen genel odak zincirini açığa çıkarıyor. Önce zincirin litoit dışı sanayi açığı yanıtı tek başına ölçülmeli (`AI-GEZEGEN-VERIMLILIGI-96H11.md`).

## Kabul edilen (red değil)

- 96H.6.1: oyuncu ikili ittifak feshi + ortak AI fesih etkileri (yayımlandı).
- 96H.8: askerî sefer verimliliği (aday 2b): sabit bekleme, gerçek sevk bakımı, karşılanabilir müfreze, terhis öncesi geri çağırma. `research/96h8/candidate-2b-ACCEPTED.patch`.
- 96H.10: kara ordusu güvenliği (aday D): silahsız ordu, görünür düşman savaş gücünün oradaki ya da oraya giden kendi savaş filolarını (×1,15) aştığı sisteme gönderilmez; yoldaki ordu varışı güvensizleşince ya da hedef geçersizleşince yeniden karar verir. `research/96h10/candidate-D-army-safety-ACCEPTED.patch`.
- 96H.9: kara ordusu koordinasyonu (aday BC): bilinen kolonili savaş hedefi için ordu hazırlıkta alınır (yalnız alaşım eksikse bedeli savaş gemilerinden ayrılır, kaynak verilmez); hedefe ulaşan kampanya kuvveti kuşatmayı sürdürür. `research/96h9/candidate-BC-ACCEPTED.patch`.
- 96H.7.1: kapanmış tek üyeli ortak sefer geçmişinin Save8 yüklemesi (`research/96h63/SAVE8-GUARD-PROPOSED.patch` ile aynı satır). AI karar davranışı değil, yükleme doğrulaması düzeltmesidir; ayrıntı `PROJE-DURUMU.md`.
