# Amblem sistemi — 95D

Mevcut ART.emblem, türe ve dört eski arma stiline bağlı 11×11 simetrik bir bitmap üretiyordu. Eski portre/sprite yolları korunur. Yeni ART.identityEmblem Canvas üzerinde 6 ana şekil × 8 iç sembol × 6 desen ve iki renkle çizilir. Sabit bir siyasi renk için yaklaşık 2.592 palet kombinasyonu; farklı siyasi renkler ek çeşitlilik verir. Bu sayı her desenin her küçük ölçekte eşit ayırt edilebildiği iddiası değildir.

Kalkan, daire, altıgen, elmas, yıldız ve halka; yıldız/güneş/gezegen/kanat/kılıç/kristal/mekanik/yörünge; düz/şerit/bölünmüş/iç halka/köşe/ışın seçenekleri vardır. Koyu merkez ve açık sembol küçük ölçekte kontrast sağlar. Ana renk devletin siyasi rengidir. Federasyon amblemi kare dış çerçeve ve üç noktalı işaretle ayrılır; ilk türüne uygun sembol alır. Reformda kimlik kökeni korunurken güncel tür ayrıca gösterilir.

Yeni oyun → GÖRÜNÜŞ → DEVLET AMBLEMİ: şekil, sembol, desen ve iki renk seçilebilir. Canlı önizleme aynı çiziciyi kullanır. **RASTGELE AMBLEM** her basışta beş bileşenin her birini önceki seçimden farklı seçer. Oyuncu beğendiği seçimi yeni oyuna ve kişisel şablonuna aktarabilir. UI rastgeleliği oyun RND_STATE akışını tüketmez.

Parametreler imparatorluk/federasyon nesnesinde Save v8 içinde tutulur. Eksik veya geçersiz alanlar dünya tohumu ve nesne ID’sinden deterministik tamamlanır. Mevcut gemi, kaynak, üyelik veya savaş kaydı değiştirilmez. Korsanın son siyasi rengi de setupGame bitmeden normalleştirilir; ilk save/load renklendirmesi değişmez.

Parametre normalleştirmesi WeakMap ile; çizilmiş bitmap’ler en fazla 256 girişli ayrı FIFO önbellekle tutulur. Çizim sırasında rastgele parametre üretimi yoktur. 22px tipik devlet ve 16px federasyon işaretleri kullanılır; düzenleyici 80px’tir. 256 adet 80×80 RGBA bitmap teorik olarak yaklaşık 6,25 MiB ham piksel tutar; Canvas/host nesne gideri buna dahil değildir. Testte 400 çizim isteğiyle sınır doğrulandı. `tests/audit-95d/emblem-atlas.png` gerçek Skia çıktısıdır; dış oyun asset’i değildir.
