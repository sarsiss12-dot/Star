# Ticaret AI son kabul araştırma araçları

Kontrol, PR #83'ün `e4ae69fb03fe603770d7206d95e2d1d321142751` HEAD'idir. Oynanabilir ve test edilmiş kaynak `320bb9c853f058384922a8b97a9fbc3ce6959c27` ile JavaScript, giriş HTML'i ve sürüm manifesti eşittir. Bu araçlar ürünün dosya yükleme zincirinin dışındadır.

## Yeniden üretim

```bash
node research/ticaret-ai-sonkabul0/teslim-penceresi.cjs
STARS_SOURCE=$(git rev-parse HEAD) node research/ticaret-kok-neden0/campaign.cjs 404 240 p57-ulu-404.json . ulu 9
STARS_SOURCE=$(git rev-parse HEAD) node research/ticaret-kok-neden0/campaign.cjs 23 120 p57-s500-23.json . s500 16
STARS_OBSERVER=research/ticaret-ai-sonkabul0/firsat-gozlemi.js node research/ticaret-kok-neden0/campaign.cjs 404 240 gozlem-ulu-404.json . ulu 9
python research/ticaret-ai-sonkabul0/kampanya-ozet.py p57-*.json > ozet.json
```

Gözlem, canlı dünyadaki AI çağrılarına teklif veya emir eklemez. Risk dönemi başlangıcını gördüğünde aynı ayın Save8 kaydını yalıtılmış VM'ye yükler. Ortağın kendi ihracat değerlendirmesini, iki hacimli rotayı, karşılıklı pozitif AI değerini ve rezerv tarihini denetler. Kotalı rota taramasının elendiği anda alınan karar ile ay sonundaki olası teklif ayrışabilir. Gözlemdeki açık rota, tek başına uygulanabilir yeni anlaşma sayılmaz. Diplomatik kabul için canlı RNG çağrısı yapılmaz.

Rezerv ayı, ay kapanışında stoku kaynak tabanının altında ve net geliri negatif olan kaynak-devlet çiftidir. Fiziksel makbuz, gerçek motorun terminal olayıdır. Teslimat değeri ve açık, taşıyıcı ve alıcı için farklı birimleri korur. Teslimat anında rezervin aşılması nedensel kriz kurtarma iddiası için tekrar gerektirir. Sözleşmeye imza atılması ve yükleme ayrı sayılır.

`teslim-penceresi.cjs` aynı koşullarda üç kol kullanır. Kısa ve uzun rota eşit sözleşme değerine sahipken stok rezerv tarihinin farklı taraflarında teslim edilir. Üçüncü kolda yoldaki yük kapanan bağlantıyla yok olur. Üç kol aynı Save8 kaydından dönüldüğünde aynı sonuç ve RNG'yi üretir.
