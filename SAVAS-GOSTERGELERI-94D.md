# Faz 94D — gezegen savaş göstergeleri

## Gerçekte bulunan mekanikler

Mevcut `invasionTick` aylık yörünge bombardımanı, kalkan/garnizon hasarı, kalkan 5 veya altındayken nakliye birlikleriyle çıkarma ve savunmasız bombardıman kuşatmasının altı aylık sonucunu uygular. Korsan yağması ve kriz yutması ayrı mevcut akışlardır. Yeni kara savaşı simülasyonu veya bağımsız kalıcı işgal rejimi eklenmedi.

Haritada görünür saldırı için küçük işaret/halka ve gezegen adı; sağ panelde hedef, saldıran, savunan, bombardıman/çıkarma durumu, gerçek kalkan/garnizon ve varsa mevcut kuşatma ayı gösterilir. Uydurma yüzde yoktur. Aynı sistemdeki her hedef ayrı satırdır. Yoğun haritada yazı çakışırsa halka kalır; ayrıntı sağ paneldedir.

Oyuncunun katıldığı saldırının başlangıcı/evre değişimi, durması ve fetih/kayıp bildirilir. Durma mesajı “durdu / püskürtüldü” der; çekilme ile askerî yenilgiyi kesin ayıran yeni sonuç modeli yoktur. Aynı anahtar tekrar bildirilmez. Save v8'de isteğe bağlı `conflictNotice` ve `lastWarResult` alanları yüklemeler arasında durumu korur. Son kontrol değişimi sistem panelinde 90 oyun günü görünür.

## Gerçek mantık düzeltmeleri

- Hareket eden filo yörünge kuvvetine eklenmez.
- Çıkarma/kuşatma `captureSystem` çağrısına yalnız hedef gezegenini iletir. Aynı sistemdeki diğer savunulan koloniler artık kendiliğinden devredilmez.
- Hedefin eski/yeni devlet koloni indeksleri ve savaş katkı kaydı güncellenir. Sistemin kontrolü yeni devlete geçse bile diğer gezegenlerin sahipliği korunur. Zaten kontrol edilen sistemdeki farklı sahipli koloni de doğru devredilir.
- Genel sistem devirleri mevcut tüm-sistem yolunu kullanmaya devam eder.
- Aynı hedefin tekrar fetih çağrısı çift koloni/gain oluşturmaz.

## Görüş ve test

İşaretler mevcut görüş, kendi koloni veya kendi yerleşik filo erişimiyle sınırlandırılır. Görünmeyen üçüncü taraf işgalleri yeni UI/bildirimle açığa çıkarılmaz. Gerçek kuvvet, hareket hâli, gizli AI, çok gezegen, altı aylık kuşatma, kontrol indeksleri, bildirim tekrarı ve save/load hedefli testleri geçti. Mevcut savaş/settlement/katkı paketleri de tam regresyonda geçti. Bütün çok taraflı geç oyun savaşlarının uzun dönem dengesi bu fazda ayrıca ölçülmedi.
