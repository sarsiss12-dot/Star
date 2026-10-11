# STARS — 87A devir notları

Kaynak `stars-faz86g.zip`:
`73561902eefe436986a7163080bbfb8cc08a0d773492f8854f8a5a7b98d30bb4`.
Build `87a`; SW cache `stars-v87a`; kayıt v8. Önceki devir belgesi
DEVIR-86G.md adıyla aynen korunur.

## Önce okunacaklar

- GELISTIRME-GECMISI.md — devralma sonrası tamamlanan sekiz teslim.
- GELECEK-FAZLAR.md — sıradaki işler, kapsam ve bitiş ölçütleri.
- BUGTEST-FAZ-PLANI.md — kullanıcı hazır olduğunda 87T kabul hattı.
- FAZ87A-RAPOR.txt — bu teslimin ölçümleri ve sınırları.

## 87A mimarisi

- `spyTargetCheck`: aktör ve hedef güncel dünya nesneleri olmalı; ölü,
  korsan, kendine veya temassız hedefe standart operasyon açılmaz.
- `spyAssignQuote → assignSpy`: aynı saf uygunluk/kota kapısı. Eski bir
  atamayı geri çekmek yeni hedef geçerliliğine bağlı değildir.
- `opQuote`: düşük ağ seviyesinde opViable ayrıntılarını açmaz.
- `opConfirm → opExecute → runOp`: her onayın ayrı sayacı var. Eski düğme,
  kapanan/değişen modal, yeni dünya ve değişen maliyet/risk onayı kullanamaz.
  `runOp` yine son kanonik kontrolü yapar. Genel operasyon transaction'ı
  eklenmedi; anlaşma transaction'ı olduğu gibi korunur.
- `opActiveEffects`: yalnız aktörün dört kendi süreli alanını okur;
  rakibin gizli virusUntil alanını veya üçüncü taraf kazanımını açmaz.
- Aktif iş kuyruğu yoktur. Standart 12 operasyon hemen uygulanır; UI bunu
  bekleyen görev gibi göstermez. Süresi olmayan etki DOSYALAR'dadır.
- Mevcut actorSummary kaydı iki görünümde gösterilir; eski/özel kayıtta
  özet yoksa sonuç uydurulmaz. Gelen faili bilinmeyen kayıt anonim kalır.

## Açık borçlar

1. 87B: AI'ın uygun olmayan calTech/sorusturma adaylarını tekrar seçmesi.
   3×120 operasyon laboratuvarında 1067 çağrıdan 575'i reddedildi. Ekonomili
   günlük kampanya değildir; sıklık/denge sonucuna genellenmez.
2. 87C: özel operasyonların ayrı sonucu ve kayıt yolu. Özellikle incite ve
   stealTech standart runOp dışında; onları birleştirdiğimizi iddia etmiyoruz.
3. Katalogda `counter` civic bayrağını karşılayan giriş görünmedi. Bu fazda
   doktrin/denge eklenmedi; 89A bağlantı denetimine kayıtlı.
4. Android kabulü kullanıcı hazır olana kadar bekliyor. Yeni tanı olmadan
   harita kurtarma döngüsünü yeniden tasarlama.

## Yeniden çalıştırma

```sh
node tests/faz87a_espionage_feedback_test.js
node tests/espionage-probe.js
node tests/run-all.js
```

`STARS_TEST_ROOT` hedefli testi önceki kaynak klasörüne yönlendirebilir.
`STARS_SAVE` gerçek kayıt fixture'ını değiştirmek içindir. Testler Node +
sentetik DOM'da; native Canvas paketleri gerçek Skia pikselleri kullanır.
Bunlar Chrome veya fiziksel Android testi değildir.

Sıradaki çalışma: **87B / Astra — High**. Önce uygun olmayan AI operasyon
seçimini ölç; kota/sıklık/başarı riskini değiştirmeden sınırlı düzeltme yap.
Kullanıcıdan şu anda test isteme, yayınlama yapma. Tam regresyon ve yeni ZIP teslim et.
