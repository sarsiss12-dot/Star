# STARS — 88A devir notları

Kaynak stars-faz87d.zip, SHA-256:
`2cbe4f0b7a2d4c894bf4f991e159e8fed43202bd0bfb2f6ee269279530d9fcc1`.
Build 88a, cache stars-v88a. Önceki devir DEVIR-87D.md içinde.

Bu fazın kapsam tablosu ve açık işleri FILO-ROTA-LOJISTIK.md içindedir.

- orderMove başarısız yeni hedefte önceki filo rotasını korur. Aktif mv
  bacağının varış düğümü path başında tutulur; sonraki yeni durak kaybolmaz.
- findPath dördüncü dahili enter filtresini alır. findPathAllowed aynı
  motoru kullanır: kapalı hedef istisnası yok, radyasyon ve kapılar ortak.
- gateNetwork ve lojistik, güncel hasUsableGate üzerinden hesaplanır.
  passage sahibi → yolcu yönünde okunur. Günlük kapı erişim önbelleği ve
  yol aramasının eski yapı indeksine bağımlılığı kaldırıldı.
- stepFleets yeni bacak öncesi sınır/bağlantı/kapı kontrolü yapar. Silinen
  bağlantı için aynı durağa alternatif aranır, yoksa rota temizlenip durur.
  Başlamış normal bacak aradaki izin değişiminde iptal edilmez.
- Kapı kenarı mv.gate ile hareket eder, uzunluğu yol bulmadaki gibi 0.1'dir.
  Normal hız ve tikte en fazla bir bacak bitirme davranışı aynı kaldı.
- Varışta koordinatlar güncellenir, mv kapatılır ve yalnız varılan baş
  düğüm tüketilir. Bundan SONRA followRallyFleet yeni takip rotası kurar.
- Takip yalnız aynı imparatorluğun yaşayan gemili filosuna birleşir;
  çatışmada bekler, hareketliyse güncel mv.to'yu izler. Hedef yoksa veya
  yolu bulunamazsa takip alanları temizlenir. Kuyruktan ilk sevk ayrı borç.
- isSupplyNode savaşta kalan eski geçiş/ittifak alanını düşman ikmali olarak
  kabul etmez. Mevcut menzil/güç/bakım/yıpranma formülleri değiştirilmedi.

Yeni test: 38 senaryo; kaynakta 11/27, teslimde 38/0.
Tam regresyon: 39 paket, 3751 geçen / 0 kalan. Bazı eski paketler iddia,
yeni paket birden fazla iddialı senaryo sayar. Android testi yapılmadı.
main.js değişti; sw.js yalnız cache. Kalan 9 üretim dosyası aynı.
Kayıt v8, depolama anahtarları, harita/portre, transaction, diplomasi/casusluk
ve Situation karantinası korundu. Dünya/RNG kampanya sonucu aynı denemez.

Sıradaki faz **88A.1 — tersane sevki ve AI ikmal emirleri / Astra High**.
Önce dailyTick'te başarısız orderMove sonrası sahte sevk, hareketli filo
hedefi ve aynı tersaneden iki filoya sipariş çakışmasını üret. reinforceFleet
ve setRally ai.js'de çağrılmıyor; AI'ın mevcut queueShip/kuvvet birleştirme
akışını ölçmeden yeni sipariş politikası koyma. AI keşif hedefinin erişim ve
ikmal nedeniyle tekrar tekrar seçilmesi de aynı emir incelemesinin parçası.
Vasal kapı hakkı ile canEnter kapsamını ayrı gerçek senaryoda doğrula.

Sonraki sıra: 88B savaş geri bildirimi, 89A iç siyaset/hafıza, 89B günlük
kampanya, 90RC bütünleşik aday. 89A'daki komplo/sabotaj anılarının topluca
silinmesi borcu açık. Kuşatma çift ajanının kasıtlı sahte başarısını koru.
Kullanıcı cihaz testlerine ara verdi; liste birikir. Yayınlama yok.
