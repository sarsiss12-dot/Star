# Mobil arayüz ve kullanım — 95C.1

Üst bar tek satırdır. Kaynaklar, bilim ve filo kapasitesi yatay kaydırılan iç şeritte; savaş, çatışma, küçültülen olay ve krizler sabit `+N` düğmesindedir. N erişilebilir durum satırı sayısıdır, gemi/cephe sayısı değildir. Açılınca mevcut bildirim/diplomasi akışlarına gider. Kaynak şeridinin kaydırma konumu periyodik yenilemede korunur. Parmağın sürüklediği sırada içerik yeniden kurulmaz; kaydırmadan doğan tıklama engellenir. Harita kamerası bu kaydırmayla değiştirilmez.

Bina adı ve adet ayrı metinlerdir; yıkım artık sayacın üzerinde absolute çarpı değil, ayrı 44px satırdır. Sıradaki adet varsa ayrıca gösterilir ve metin dar alanda sarılabilir. İnşa/yıkım maliyetleri değiştirilmedi. Uzun tam adlar panelde daha fazla dikey alan kullanabilir.

Bilim ekranında üç dalda ve geçmişte `Aylık araştırma: +…` bulunur. Değer ekonomi tarafından hesaplanan `e.inc.ara`dır; kısaltılmaz, iki ondalığa kadar gösterilir ve ham değer başlıktadır. Bilim formülü, üç ağaç ve araştırma kuyruğu korunur. Mobil kısa yükseklikte ek açıklama gizlenebilir; aylık değer gizlenmez. Devlet panelinde mevcut kökenin gerçekten uygulanan başlangıç varlıkları ve sürekli bonus olup olmadığı açıklanır.

Destek talebi kullanımı:

1. Haritada kendi savaş filona veya bilinen bir sisteme dokun.
2. Sağ panelde Ortak askerî koordinasyon bölümünü aç. Diplomasi/federasyon panellerinden de erişilir.
3. Müttefik satırında Filomu destekle, Sistemi ele geçir veya Bölgeyi savun seç.
4. Önizlemede müttefiki, talep türünü ve hedefi kontrol et; Talebi gönder'e dokun.
5. Kabul/ret nedeni, toplanma, bekleme ve görünür filolar aynı bölümde görünür. Etkin kendi talebini iptal edebilirsin.

Hedef değiştirmek için “Haritadan filo / sistem seç” paneli kapatır ve seçim adımını anlatır; haritada seçtikten sonra ilgili sağ panelde talep hazırlarsın. Bu adım kendi filona hareket emri vermez. Müttefik yabancı mülkiyette kalır. Aynı geçerli savaş ve kabul edilmiş siyasi yükümlülük yoksa talep yollanamaz. Gizli filo konumu/gücü/ETA açılmaz. 95C motoru değişmedi.

Harita modundaki Savaşlar devletlerin savaş rengini yönetir. Ayrı Savaş hatları düğmesi yalnız bilinen bağlantı çizgilerini açar/kapatır ve her modda tercihe uyar. Bilinen bağlantı yoksa hayalî çizgi çizilmez. Kayıt sürümü v8, tercih anahtarı `yh_warlinks` korunur. Gerçek Canvas piksel farkı test edildi; bu DOM yerleşim testi değildir.

740×360, 900×420 ve 1536×702 için üretilen HTML/CSS ve host giriş olayları kontrol edildi. Gerçek Chromium çalıştırması, yüklü tarayıcı ikilisi olmadığı için başlayamadı. Fiziksel Android ve gerçek tarayıcı yerleşimi test edilmedi. Kaynak koruma testleri yeni mobil CSS bloğunu ayrı SHA ile kilitler ve istenmeyen değişikliği reddeder; eski bilim/federasyon ve temel UI hash'leri gevşetilmedi.

Manuel Android kabulünde: barı savaş/olay açıkken kaydır, +N listesindeki her eylemi dene, iki dolu bina kartının sayaç/yıkımını kontrol et, klavyeyle 5000 yaz, üç destek talebini gönder/iptal et, iki tersaneden sevki izle, Savaşlar modunda hatları kapat/aç, arka plana gidip kayıt ve geri dönüşü kontrol et. Bu liste yapılmış test gibi sayılmamıştır.
