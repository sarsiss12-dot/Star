# STARS — 88B devir notları

Kaynak `stars-faz88a-1.zip`, SHA-256:
`427ed35bc50c30d6a1a1f0e2e97d1c9dc3d7d6be27732af62a601fbe28bff668`.
Build 88b, cache stars-v88b. Önceki devir `DEVIR-88A-1.md` içinde.

- Her gerçek battleRound, sistemde tek bir `battleReport` üretir. Son turdaki
  gerçek gövde hasarı, ateş açabilen gemi sayısı, ikmal, toplam kayıp ve ricat
  sayısı aynı çözüm sonucundan kaydedilir. Kesin sonuç mesajı bu kaydı okur.
- Sistem paneli yalnız oyuncunun taraf olduğu savaşın ayrıntısını gösterir.
  Oyuncunun taraf olmadığı AI-AI raporu açılmaz; temas yoksa rakip adı gizlenir.
- Rapor sürerken ve bittikten sonra sistem panelinde kalır. v8 kaydında
  `simulation.systems[].br` olarak doğrulanır; bozuk devlet/sayı içeren kayıt
  düşürülür. Kayıt sürümü yükseltilmedi.
- Lojistik açıklaması artık motorla aynı matematiği söyler: hasar ikmal
  yüzdesiyle, kalkan `max(%30, ikmal×%85)` ile çalışır; gövde değişmez.
  Yıpranma gemi kaybı diye değil gövde yıpranması diye adlandırılır.
- Ham `fleetPower` etiketi “Stratejik filo gücü”dür. Menzil, duruş ve ikmalin
  gerçekleşmiş tur etkisi savaş raporunda ayrı görünür.
- Enkaz Mühendisliği ödülü kendi kaybını yaşayan kurbana değil, hasarı veren
  ve civic'e sahip tarafa gider. Gemi maliyeti, hasar veya ödül oranı değişmedi.
- Ricat mesajı seçilen güvenli sistemle birlikte gerçek gövde ve ikmal
  yüzdesini gösterir. Çatışma barışla kesilirse rapor sonuçsuz kapanır.

Hedefli test kaynakta 1 geçen / 23 kalan; 88B'de 24 / 0. Tam regresyon
41 paket, 3782 geçen / 0 kalan. combat.js değiştiği için 23 tarihsel
“combat.js byte-for-byte aynı” iddiası koruma listelerinden çıkarıldı;
24 davranış senaryosu eklendi. Test dosyası silinmedi. Android testi yapılmadı.

Değişen üretim dosyaları: main.js, combat.js, ui.js; sw.js yalnız cache.
Byte-for-byte aynı: map.js, ai.js, diplomacy.js, economy.js, audio.js,
index.html, manifest.json (7/7). Savaş/lojistik denge katsayıları aynı.

Sıradaki faz **89A — iç siyaset, civic ve hafıza bağlantıları**.
Önerilen model **Astra — High**. Önce civic katalog/flag eşleşmesini,
fraksiyon tepkilerinin gösterilen gerekçeyle aynı olmasını ve iftira/komplo
hafıza temizliğinin yalnız ilgili olayı silmesini ölç. Var olmayan civic veya
doktrin uydurma. Ardından 89B günlük kampanya, 90RC bütünleşik aday.
Kullanıcı cihaz testlerine ara verdi; liste birikir. Yayınlama yok.
