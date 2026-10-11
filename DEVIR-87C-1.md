# STARS — 87C.1 devir notları

Kaynak stars-faz87c.zip, SHA-256:
`b232e67c9a1b1dc4264920830b8d5585a6f014a8c00bc4dcc529c26de6e6de68`.
Build 87c-1, cache stars-v87c-1. Önceki devir DEVIR-87C.md içinde.

Fısıltı Ağı ve 140 Etki sahte bayrak motoru ayrı mekanikler olarak kaldı.
Kuşatma sabotajının sınıflandırması OZEL-CASUSLUK-YOLLARI.md içindedir.

- runWhisper: ortak güncel hedef/aktör/temas/bedel kapısı. Geçersiz giriş
  resolved:false döner; ücret/zar/kayıt yok. Oyuncu ve AI aynı motora girer.
- Eski runWhisper.ok = etki başarısı korunur. Yeni resolved = ücretli deneme.
  playerWhisper.ok ise eskisi gibi geçerli ücretli deneme; basari ayrıca var.
  Bu iki ok anlamını refactor sırasında birbirine karıştırma.
- Fısıltı başarısı ve ifşa bağımsızdır: dört birleşim de olabilir.
  whisperResult actor opLog'a tek kayıt yazar; whisperLog mevcut oyuncu/AI
  çağrı yollarında yazılmaya devam eder. İkinci mağdur hitLog açılmadı,
  mevcut counterIntelTick soruşturması korunur.
- UI ifşa olmuş başarılı iftirayı masum üstünde kalmış gibi anlatmaz.
  Seçili iftira için başarı yüzdesi .88 çarpanını, başlık gerçek 80 Etkiyi
  gösterir; yalın fısıltı 45 Etkidir. Motor oranları değişmedi.
- falseFlagOp: tür/güncel aktör/hedef kontrolü; actor kaydı 20, hitLog 30
  sınırı. Başarıda mevcut by=masum, framed=gerçek fail korunur. Yakalanma
  gerçek fail için bilinen dosya, sessiz sonuçsuzluk yeni mağdur dosyası yok.
- Sahte bayrakta savas gerçek iki taraflı savaş alanından okunur. Geçici
  _warAuth/_warWhy önceki değer ve alan varlığıyla finally içinde korunur.
  Savaş kurulmazsa önceki _lastCB geri gelir. declareWar kuralları aşılmaz.
- payloadApplied, asıl sabotaj/veri etkisidir; framed iftiranın tutmasıdır.
  Veri yokken iftira tutabilir; bunu araştırma kazanımı diye anlatma.
- Her iki dosya görünümü özel ad, sonuç, bedel ve özet gösterir. Başarı+
  ifşa özel etiketi var. Eski kayıtları geriye dönük doldurma yok.

45 yeni hedefli senaryo; gerçek üretim motoru/UI eylemi, AI tick, v8 ve
soruşturma. Oran/kota/45-80-140 ücretleri değişmedi. Yeni actor kaydı ortak
20 kayıt sınırını kullanır; eski kayıtların tutulma süresi ve buna bakan
AI davranışı kampanyada değişebilir. Birebir dünya/RNG sonu vaadi yok.
Bu yollar transaction değildir; UI/declareWar istisnalarının tümünü
rollback/başarı garantisi altına almış sayma.

Açık inceleme: İftira çözülürken bazı yollar bütün komplo/sabotaj anılarını
filtreliyor. Hangi anının hangi operasyondan geldiğini ayırmak gerekiyor;
87C.1 bu eski hafıza politikasını değiştirmedi. 89A hafıza/fraksiyon
incelemesine somut bulgu olarak eklendi. Kuşatma çift ajanının sahte başarı
bildirimini yanlışlıkla düzeltme; bu kasıtlı mekanik.

Sıradaki faz **87D — diplomasi teklif tekrarları / Astra High**.
Aynı ret sonrası teklif aralığı, oyuncu ve AI bildirim yükünü önce ölç.
Gerekiyorsa yalnız o bulguya tekrar politikası uygula; kabul/ilişki/Etki
katsayılarını keyfî değiştirme. Başka sistemlere dağılma.

Kullanıcı cihaz testlerine ara verdi; kontroller birikir. Yayınlama yok.
Harita/portre/menü, v8, transaction, elçi, AI bütçesi, 87A onay, 87B seçim,
87C sonuçlar ve Situation karantinası korunmalıdır.
