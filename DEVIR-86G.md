# STARS — 86G devir notları

Bu belge, projeyi başka bir geliştiricinin veya modelin doğrulanmış 86G
ZIP'inden sürdürmesi içindir. Geçmiş raporlardaki iddialar yerine güncel kod,
bu belge ve paket içindeki test sonuçları esas alınmalıdır.

## Doğrulanmış başlangıç ve sürüm

- 86G kaynağı: `stars-faz86f.zip`
- Kaynak SHA-256: `bc693ee97b4c0a7dd4b0610c0f2179d6c9f0729099c210cb335808b2967fbc8d`
- Kayıt biçimi: v8; şema yükseltilmedi.
- Build: `86g`; Service Worker cache: `stars-v86g`.
- Durumlar/Situations: katalog ve fonksiyonlar korunuyor, üretim çağrısı pasif.
- Harici asset veya yeni bağımlılık eklenmedi.

Üretimde değişen dosyalar: `diplomacy.js`, `main.js`, `ui.js`, `sw.js`.
Korunan dosyalar: `map.js`, `ai.js`, `economy.js`, `combat.js`, `audio.js`,
`index.html`, `manifest.json`. Dosya SHA'ları `tests/sha-86g.json` içindedir.

## 86G'de kapanan tutarsızlık

Eski `declareWar` başarıyla savaş başlatırken NAP bitiş tarihini iki tarafta
da bırakıyordu. Sonuçları:

- Diplomasi özeti aynı çifti hem savaşta hem saldırmazlık paktında gösterebiliyordu.
- Barış yapıldığında eski NAP süresi yeniden etkinmiş gibi görünüyordu.
- Yeni NAP teklifi yanlışlıkla redundant sayılabiliyordu.
- 86F uzun ölçümünde savaşla beraber 0/3/2 NAP alanı görülmüştü.

`endTreatiesForWar(a,b)` artık başarılı savaşın tek antlaşma kapanışıdır:
NAP alanlarını siler; pakt ve ittifakı iki yönde kapatır. Başarısız savaş
ilanında hiçbirine dokunulmaz. `treatyAlreadyActive` savaş halindeki NAP,
pact ve ally alanlarını aktif saymaz. UI da bozuk geçici durumda savaşla bu
etiketleri aynı anda göstermez.

Eski v8 kayıtları için `normalizeWarTreaties()` deserialize sırasında çalışır.
Savaş kaydını değiştirmez; yalnız savaşla uyuşmayan NAP/pakt/ittifak alanlarını
temizler. Gün, takvim, kaynak, log veya RNG tüketmez; ikinci çağrı değişiklik
üretmez. Sonuç özeti geçici `G._loadTreatyInfo` alanında tutulur.

Konsey savaş yasağını oyuncu bilinçli çiğnediğinde eski özel dal savaşı kurup
erken dönüyordu. Bu nedenle ortak savaş kurulumu atlanıyordu. Artık Konsey
cezası uygulandıktan sonra aynı kanonik yoldan devam eder: hafıza, savaş
tarihleri, antlaşma kapanışı, fraksiyon olayı, savunma zincirleri ve bildirimler
normal savaşla aynı sıradadır. AI'ın %75 geri çekilme davranışı değişmedi.

`warOn` anlaşma işlemi bu değişikliği kapsar. `after:warOn` hatasında 86C.6
transaction NAP alanını özgün nesne grafiğiyle geri getirir; commit halinde
savaş kurulur ve NAP kapanır.

## Korunması gereken mimari sınırlar

- Anlaşmalar: `normalizeDeal → dealValidity → dealQuote → executeDeal`.
- `dealQuote` saf olmalı; RNG veya oyun mutasyonu yapmamalı.
- `executeDeal` 86C.6 nesne grafiği transaction'ını kullanır; UI/audio yan
  etkileri commit sonuna kadar tamponlanır.
- AI–AI teklifleri `aiNegotiate` üzerinden karşılıklı değerlendirilir; en fazla
  iki tur. Oyuncu teklifleri mevcut UI onay yolunda kalır.
- 86F `aiCounterBudget`: teknoloji alıcı değerinden, kaynak veren ihtiyacından
  değerlenir; simetrik antlaşma tek sayılır; mevcut %60 tavan korunur.
- Elçiler görev ve kıdem durumunu kaydeder; savaşta durur. Teklif değerine
  kanonik `dealFactors` üzerinden bağlanır.
- 86E diplomasi merkezi hedef başına taslak tutar; istihbarat seviyesinin
  açmadığı stok veya teknoloji bilgisini göstermemelidir.
- Radar ve Lojistik bağımsız katmandır; üç ana modu değiştirmez.
- Harita kurtarma, pointer temizliği, yüzey nesli, kamera sınırı, sol menü ve
  lider portresi yolları korunmalıdır.

## Otomatik doğrulama

```sh
node tests/run-all.js
node tests/faz86g_integration_handoff_test.js
```

Hedefli test normal/başarısız/Konsey savaşını, eski kayıt göçünü, tek yönlü
bozuk alanları, süresi dolmuş NAP'ı, UI etiketini, barış sonrası yeni teklifi,
warOn rollback/commit'i, PWA kabuğunu, v8'i, 86F bütçesini, Radar/Lojistik ve
gerçek oyuncu kayıt fixture'ını kapsar.

3 seed × 360 ay ek koşuda savaş+NAP alanı 0/0/0 bulundu. Bu koşu gerçek kayıt
fixture'ından başlar ve aylık tick kullanır; günlük keşif/muharebe kampanyası
değildir. Native Canvas testleri Skia pikselleri kullanır fakat gerçek Chrome,
WebView veya Android GPU testi değildir.

## Açık borçlar ve önerilen sıra

1. Fiziksel cihaz testleri kullanıcı isteğiyle duraklatıldı. İstek gelene kadar
   test talep etme; `CIHAZ-TEST-BIRIKIMI.md` dosyasına ekle.
2. Android beyaz ekranı son kullanıcı denemesinde tekrarlanmadı, fakat gerçek
   yaşam döngüsü kabulü tamamlanmadı. Yeni tanı olmadan aynı kurtarmayı yazma.
3. 86F ölçümünde bazı AI çiftleri reddedilen ittifak teklifini sık tekrarladı.
   Cooldown eklemeden önce teklif sıklığını ve bildirim etkisini ölç.
4. Ortalama AI ilişkileri bazı seed'lerde hâlâ negatif. Kabul oranını
   güzelleştirmek için rastgele ayrıcalık veya gizli katsayı ekleme.
5. Fixture AI–AI temasını test için kuruyor; gerçek keşif/temas ayrı ölçümdür.
6. Sıradaki ürün fazı 87A: casusluk ekranı ve operasyon geri bildirimi denetimi.

## Sıradaki çalışma komutu

```text
STARS 86G ZIP'ini kaynak al ve SHA-256'yı doğrula. DEVIR-NOTLARI.md,
FAZ-PLANI.md ve CIHAZ-TEST-BIRIKIMI.md dosyalarını önce oku. 87A'da
casusluk/istihbarat arayüzünü ve AI operasyon kullanımını denetle: sağ paneldeki
casus eylemi, hedef seçimi, maliyet/başarı/tespit bilgisi, devam eden operasyon,
sonuç bildirimi ve geçmiş kaydı tek tek üretim yolunda izle. Oyuncuya yapılan ve
oyuncunun yaptığı operasyonların sonuçlarını ayrı, anlaşılır ve istihbarat
seviyesine uygun göster. Önce ölçüm ve ekran akış haritası çıkar; kanıtlanan
kopukluklar için sınırlı bir UI/geri bildirim düzeltmesi yap. Operasyon başarı
oranlarını veya AI sıklığını sırf dağılım için değiştirme. 86C.6 transaction,
86D elçi, 86E diplomasi merkezi, 86F bütçe, 86G savaş-antlaşma kapanışı,
harita kurtarma, v8 ve Situation karantinasını koru. Otomatik testleri çalıştır,
cihaz testi isteme, yayınlama yapma. Kod, ölçüm, açık borç, kaynak/çıktı SHA ve
ZIP teslim et.
```

Önerilen model: **Astra — High**. Bu faz UI, istihbarat kapısı, AI ve kalıcı
bildirim yollarını birlikte izlemeyi gerektiriyor.
