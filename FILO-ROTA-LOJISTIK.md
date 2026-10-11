# 88A / 88A.1 — filo, rota ve lojistik incelemesi

İlk bölüm 88A tarihçesidir; 88A.1 sonuçları belgenin sonundadır.

Bu faz hareket motorunu düzeltir. Üretim kuyruğunun kime gemi göndereceği ve
AI'ın filo tamamlama siparişi başlatması 88A.1'e ayrıldı. Bu belge bütün
lojistik sisteminin tamamlandığı anlamına gelmez.

| Yol | Üretim bağlantısı | 88A sonucu |
|---|---|---|
| Oyuncu rota / ek durak | Harita seçimi ve UI.sendhere → orderMove → stepFleets → arrive | Geçersiz yeni emir eski rotayı silmez; hareket sırasında yeni rota ilk durağı kaybetmez. |
| AI keşif / koloni / savaş emri | aiTurn → orderMove; çeşitli AI görev tikleri de aynı motoru çağırır | Oyuncuyla ortak sınır/bağlantı düzeltmesi uygulanır; AI karar puanları aynı. |
| Kapalı sınır alternatifi | findPathAllowed → ortak findPath | Hedef de izin kontrolünden geçer; alternatif yol kapı ve radyasyon maliyetini korur. |
| Güncel hareket izni | stepFleets her yeni bacağı başlatmadan kontrol eder | İzin/sahiplik/bağlantı değişmişse aynı durağa geçerli yol aranır; bulunamazsa filo durur. |
| Yıldız kapısı | hasUsableGate → gateSupplyNodes → gateNetwork | İzin sahibin yolcuya verdiği yönde okunur; kapalı özellik ve aynı gün değişen izin dikkate alınır. |
| Kapıdan hareket | stepFleets, mv.gate | Daha önce sanal yolu hesaplayıp aynı yerde kalıyordu. Şimdi 0.1 kenar uzunluğuyla gerçek varış gerçekleşir. |
| İkmal filosunun takibi | followRallyFleet, gerçek varış sonrası ve boşta beklerken | Eski bacak önce tüketilir; yeni takip rotası silinmez; yabancı filoya birleşilmez; ana filo çatışıyorsa beklenir. |
| İkmal seviyesi / yıpranma | supplyDistance → fleetSupply → attritionTick | Formül/mesafe eşiği aynı. Savaşta eski geçiş izni düşman limanını ikmal düğümü yapmaz. |
| AI geri çekilme | aiLogisticsTick → nearestSupplySystem → orderMove | Gerçek tikle yıpranmış AI filosunun ikmale dönebildiği doğrulandı. Karar eşiği değişmedi. |
| Otomatik üretim / toplanma | queueShip → dailyTick → sys.rally → yeni filo | Mevcut yol incelendi; yeni üretim sevki ve sipariş hedefi 88A.1'de ele alınacak. |
| Filo tamamlama | reinforceFleet → queueShip + tersane rally kaydı | UI'da var; ai.js içinde reinforceFleet/setRally çağrısı bulunmadı. AI küçük filoyu büyüğe yönlendirebiliyor; bu aynı şey değildir. |

## Kurallar ve sınırlar

- Silahlı filo geçiş izni ister. Bilim/inşaat/koloni gibi silahsız filoların
  mevcut serbest sınır geçişi korunur. Savaş hedefi, müttefik, açık sınır
  civic'i ve mevcut retreating koridoru kaldırılmadı.
- Başlamış bir normal yolculuk, izin arada iptal edilince uzayda kesilmez.
  Filo başladığı bacağı bitirir; sonraki bacak güncel izne tabidir.
- Rota içindeki kapalı bir durağı sessizce atlayıp son hedefe gitmeyiz.
  Oyuncu/AI yeni hedef verebilir. Silinen bağlantı için aynı durağa izinli
  alternatif bulunursa rota onarılır.
- Kapı kenarının yol bulmadaki mevcut 0.1 ağırlığı hareket mesafesine de
  uygulandı. Normal hatlarda hız formülü aynı; tek tikte en fazla bir bacak
  bitirme davranışı korunur. Yeni yakıt stok sistemi eklenmedi.
- Oyun ayrı bir filo yakıt deposundan çok, sıçrama mesafesine bağlı ikmal,
  güç çarpanı, bakım ve aylık yıpranma kullanıyor. Yüzde 40 taban ve bilim
  gemisinin o tabanda durma kuralı aynı; koloni/inşaat muafiyeti korunur.
- Kapı erişimi küçük sistem listesinde güncel hesaplanır; günlük erişim
  önbelleği artık kullanılmaz. Mobil maliyet ölçümü yapılmadı.
- Gemi sayısı, rota, kaynak veya diplomasi dünyasının kampanya sonunun eski
  sürümle aynı olması beklenmez: artık çalışan kapılar ve kapanan sınırlar
  gerçek yolculuk sonuçlarını değiştirecektir.

## 88A sonunda kaydedilen inceleme noktaları (tarihçe)

1. dailyTick üretim sevkinde orderMove sonucu denetlenmiyor. Geçerli rota
   yokken “sevk” mesajı/işareti verilebilir. Kuyruk sonucu testle ölçülmeli.
2. Üretim anında hedef filo hareketliyse ral.sys eski konumu kullanılabilir;
   ana filonun güncel mv.to konumu ile sözleşme kurulmalı.
3. reinforceFleet aynı tersanenin genel rally kaydını değiştiriyor. İki
   farklı filoya arka arkaya siparişin hedefi çakışıyor mu ölçülmeli.
4. AI queueShip kullanıyor; küçük savaş filosunu ana kuvvete yönlendiren
   kod da var. Otomatik tamamlama/toplanma kullanımını varmış gibi yazma.
   Önce mevcut üretim ve birleşme davranışını ölç, gerekiyorsa sınırlı bağla.
5. AI keşfi geometrik olarak en yakın hedefi seçiyor. Ulaşılamayan veya
   ikmal tabanında durdurulan aynı hedefe takılı emir tekrarı ölçülmeli.
6. Vasal geçit erişimi ile genel canEnter sınır hakkının kapsamları farklı.
   İkisini varsayımla aynı yapma; vasal koridorunu ayrı senaryoda incele.

## Doğrulama

38 hedefli üretim senaryosu; aynı test kaynak 87D'de 11 geçer / 27 kalır,
88A'da 38 geçer / 0 kalır. Bunlar 27 ayrı kök neden anlamına gelmez.
Temel sınır/rota/kapı örnekleri oyuncu ve AI sahipliğiyle ayrı sınandı.
Gerçek aiLogisticsTick, stepFleets, serialize/deserialize kullanıldı.
Tarayıcı veya Android olay/performans kanıtı değildir. Uzun günlük kampanya
89B'de; kullanıcı cihaz kabulü hazır olduğunda 87T hattında yapılır.

## 88A.1 sonuçları

Yukarıdaki altı inceleme noktası üretim yolunda ele alındı. Özel sipariş
hedefi q.delivery.fleet içinde saklanıyor; genel rally bağımsız. Bekleyen
sipariş ve yoldaki ikmal yeniden ödeme hesabından düşülüyor. Başarısız
sevk gemiyi tersanede bırakıyor, hareketli hedefin güncel varışı izleniyor.
Ana filo çatışmadayken anında takviye yapılmıyor. Hedefsiz eski v8 kuyrukları
mevcut genel tercihle çalışıyor; yeni hedefler yüklemede korunuyor.

AI mevcut bir gemilik normal askeri üretimini uygun kendi filosuna ayırır;
uygun hedef yoksa eski yerel üretim devam eder. İlave üretim fırsatı veya
bedelsiz gemi yok. Oyuncu/AI bilim keşfi yol ve ara durak ikmalini denetler;
mevcut sistemde tarama başlar, süren AI taraması sıfırlanmaz. Vasal kapı
kenarı geçilebilir; sıradan kapalı vasal sınırı kapalı kalır.

30 yeni senaryo ve üç hazırlıklı AI üretim fırsatı sınandı. Tam günlük
kampanya/performans incelemesi 89B'dedir. Bunlar cihaz kabulü değildir.
