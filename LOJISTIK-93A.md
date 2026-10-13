# Filo takviyesi ve tersane hedefleri — 93A

## İki ayrı hedef

**Tersane → sistem:** sistem panelindeki Ralli noktası seçimi yalnız o
tersanenin genel askeri üretimini etkiler. Başka tersanelerin hedefi veya
özel takviye siparişlerinin teslimatı değişmez. Sivil gemiler yerinde kalır.

**Takviye → filo:** filo panelinden verilen Takviye siparişi, üretimden sonra
ana filonun güncel konumunu/varış düğümünü izler; uygun yerde fiilen birleşir.
Filo panelinden haritada nokta seçip bütün tersaneleri değiştirme kaldırıldı.
Normal filo hareket rotası/waypoint emri aynen korunur.

## Sayılar

- Kadro: mevcut gemi / hedef (en çok 30).
- Üretimde / sırada: filoya bağlı henüz bitmemiş siparişler.
- Filoya katılmak üzere yolda / bekliyor: joinFleet bağı taşıyan gemiler.
- Yeni sipariş gereken: hedef − mevcut − sırada − yolda; en az sıfır.

Panel ve reinforceFleet aynı fleetReinforcementStatus hesabını kullanır.
Sıfır yeni eksikte düğme kapalıdır; doğrudan eski eylem çağrısı da sipariş
üretmez. Kilitli baskın sınıfın araştırma gerekçesi gösterilir; başka sınıfa
sessiz dönüşüm yapılmaz. Kaynak yalnız bir kısmına yetiyorsa alınan ve kalan
sipariş ayrı bildirilir. Kuyrukta kilitli eski işler sırada sayılır; yeni
sipariş düğmesi bu eski işi silmez veya yeniden ücretlendirmez.

## Eski kayıtlar

Kayıt v8, delivery, rally ve rallyAt alanları bozulmadan yüklenir.
Eski rally={fleet,sys} için tarihsel fleet önceliği korunur. Panel bunu
“Filo: ... / Eski filo hedefi korunuyor” diye gösterir. Filonun yok olması
halinde gizli sys fallback yapılmaz; yeni gemi tersanede bekler. Değiştir
veya Kaldır, tek tersanenin genel tercihini düzenler. Özel delivery işleri
korunur. Eski rallySet eylemi harita seçimi başlatmadan bilgi verir.

## 93B/93C'ye kalanlar

Kapalı rota sonrası followRallyFleet hedefi bırakmaya devam eder; bu fazın
kapsamı değildir. Otomatik tekrar/iptal/yeniden hedefleme 93B'de ele alınır.
Karma filo hâlâ baskın savaş sınıfıyla tamamlanır; sınıf bazlı hedef kadro
93C'dedir. Tersane seçimi hâlâ uzaklık + dönüşümlü sipariş yaklaşımıdır.
Gerçek mobil yerleşim ve oyuncunun günlük akışı henüz cihazda denenmedi.
