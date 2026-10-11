# STARS — 89A devir notları

Kaynak stars-faz88b.zip, SHA-256:
`26cf2e513bc21f074ad11b05f7ddd173ab428c583733b89d978a7cdc3994c5b1`.
Build 89a, cache stars-v89a. Önceki devir DEVIR-88B.md içinde.

- `memoryEvent(actor)` oyuncu/AI için deterministik `id:sıra` üretir. Sayaç
  imparatorlukta `memoryEventSeq`; anıda ve dosyada `source` alanı saklanır.
  Olay kimliği RNG tüketmez, kayıt yüklemede üretilmez; v8 korunur.
- Anlık/gecikmeli fısıltı ifşası, hedefli soruşturma, kendi derin soruşturması
  ve yakalanan sahte kanıt temizliği yalnız ilgili kaynak anısını kaldırır.
  Aynı ayın farklı iftiraları ayrı tutulur; farklı gerçek suçlar silinmez.
- Taze tekrarlanan iftiranın %35 anı ağırlığı korunur. Ancak ayrı izlerin
  bağımsız solması/budanması eski birleştirilmiş kayıttan farklıdır; bu,
  olayları ayrı çözebilmenin sonucudur. Ağırlık/fade katalogları değiştirilmedi.
- Eski v8 anılarında kaynak yoksa tahmini temizlik yapılmaz. Eski iftira anısı
  doğal solmaya bırakılır; dosya ifşa/ilişki sonuçları çalışır. Geçmiş anının
  hangi olaya ait olduğunu güvenilir biçimde yeniden kuramıyoruz.
- Üçüncü taraf soruşturmasının opViable kapısı artık runOp ile aynı masum
  hedef/by ve gerçek fail/framed ayrımını kullanır.
- `facMoodDelta` UI tahmini ile gerçek değişimi bağlar. Tavan/taban ve Uzlaşı
  hesaba katılır; log ham talebi değil gerçek değişimi yuvarlayıp gösterir.
- 13 civic tanınıyor. Katalog dışı 23 flag bilinçli eski kancalar olarak
  listelendi; `counter` başka civic'e bağlanmadı. CIVIC-DENETIMI-89A.md'ye bak.

Hedefli 24 senaryo: 88B kaynakta 6 geçen / 18 kalan; 89A 24 / 0.
Tam regresyon özeti tests/results-89a.json ve FAZ89A-RAPOR.txt içindedir.
Üretimde ai.js, diplomacy.js, ui.js değişti; main.js yalnız build, sw.js
cache adı değişti. Harita, savaş, ekonomi ve çizim kurtarma kodu aynı.

Sıradaki faz **89B — gerçek günlük kampanya**, öneri **Astra — High**.
3 seed; günlük gerçek hareket/keşif/temas ve ay geçişleri birlikte sınansın.
Temasları zorla açan aylık fixture, gerçek kampanya kabulü sayılmasın.
İlk bozulan invariant ve en kısa tekrar kaydedilsin; yalnız ölçülmüş hata
onarılıp kampanya yeniden çalıştırılsın. Fraksiyon pay toplamı ve 88B rapor
sayaçları (tur öncesi ateş eden / tur sonrası kalan gemi) özellikle izlensin.
Beyaz ekran cihazda son denemede tekrarlamadı; yeni kanıt olmadan kurtarma
koduna dokunma. Fiziksel testler kullanıcı isteyene kadar birikir. Yayın yok.

Son doğrulama: 42 paket / 3808 geçen / 0 kalan.
86C.4 seed beklentisi revizyonunun ayrıntısı FAZ89A-RAPOR.txt içinde.
