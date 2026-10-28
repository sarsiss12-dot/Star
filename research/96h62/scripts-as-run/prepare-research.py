from pathlib import Path
import json,shutil,hashlib,subprocess
P=Path(__file__).resolve().parents[1];R=P.parent/'Star';E=P/'evidence';Q=R/'research/96h62';Q.mkdir(parents=True,exist_ok=True)
selected=['canonical.json','PROTOCOL.json','gate1.json','gate2.json','local-summary.json','DECISION-96H62.json','decision-options.json','decision-options-prepayment.json','live-decision-audit.json','T1-causality.json','C2-causality.json','rejection-cause.json','performance.json','control-reuse.json','production-preservation.json','previous-inputs.json','I1-rejected.patch']
for n in selected:shutil.copy2(E/n,Q/n)
for n in ['canonical-alliance.log','canonical-politics.log','canonical-browser.log','gate1.log','capture11.log','capture404.log']:shutil.copy2(E/n,Q/n)
shutil.copy2(E/'canonical-browser/results.json',Q/'canonical-browser.json')
shutil.copytree(P/'scripts',Q/'scripts-as-run',dirs_exist_ok=True)
(Q/'README.md').write_text('''# 96H.6.2 araştırması — I1 reddedildi

**Yeni oyun yayımlanmadı. Üretim96h61, Save8 ve19runtime dosyası korunuyor.**

Başlangıç GitHub HEAD: `a1cc40ddbe902372f0f35416d4a09864018bc99e`.

Tek yeni aday I1, gerçek ücretli seri kuyruk ve peşin bedeli aynı stok yolu üzerinde karşılaştırdı. Normal AI mimarisi, A2'nin üç aylık finansman sınırı ve stratejik/naval plan modu korundu; C2/T1 yamaları eklenmedi. Tahmin okumaları RNG tüketmedi. Bütünlük kapısındaki11test geçti. Fakat ilk ekonomik kararı kapsayan aynı seed11 Save217→240 koşusunda:

| Aktör7 | Kontrol | I1 |
|---|---:|---:|
| Tarihsel metrikte kritik ay (gıda hariç) | 9 | 4 |
| En uzun maden kritik dizisi | 6 | 2 |
| Madenin sıfır olduğu ay | 2 | 0 |
| Gıdanın sıfır olduğu ay | 0 | 6 |
| Gıda kritik ay / en uzun dizi | 0 | 11 |
| Son gıda neti | −0,3672 | −6,5993 |
| Yaşıyor / koloni | Evet/1 | Evet/1 |

I1 ay218'de çiftlik yerine maden sipariş etti. Ardından çiftlik, maden stokunu sıfırın altına indireceği gerekçesiyle engellendi; ancak ay233'te sipariş edildi. Maden iyileşmesi bu gıda kaybını haklı çıkarmaz. Aday Kapı2'de reddedildi. Seed404 aday yerel toparlanması, Kapı4,120/240kampanyaları NOT RUN. Başka eşik veya aday denenmedi. Reddedilmiş patch yalnız araştırma dosyasıdır.

## Yeni neden-sonuç bulguları

- Gerçek ay219 kararında maden peşin bedeli, altı aylık maden yolunu beklemeye göre yaklaşık−9,35'ten−103,83'e indiriyor. Mevcut `aiBuildingSustainable` bunu üretici istisnasıyla kabul ediyor. Sonrasında `colonyJobs > 0` acil yıkımı geciktiriyor.
- Ay218'de saklanan gelir ile güncel odak/nüfus üzerinden hesaplanan gelir farklı: maden−25,8384/−31,5731. Mevcut aylık gelir ve bugünkü marjinal üretim aynı zaman tabanında olmayabiliyor. Ekonomik bilgi düzelince önceliğin de güvenli olduğu sonucu çıkmıyor.
- Önceki T1 yalnız aktör7'ye uygulanınca22ayın tamamında kontrolle tam Save/RNG eşit, kritik9→9. T1'in geniş etkisindeki9→10 farkını aktör7'nin değiştirilmiş maden/yıkım emirlerine bağlamak doğru değil.
- Eski C2'nin ilk ayrışması ay42, aynı RNG: aktör2 dökümhane yerine laboratuvar yıkıyor; anlık bilim deltası−14,3078. Yerel bina koruması stratejik maliyetsiz değil. Bunun tek başına bütün uzun dönem ticaret kaybına neden olduğu kanıtlanmış değil.
- Borsa konsey yasası gerektirir. Bu deneylerde konsey kapalı; enerji fazlasını borsadan madene çevirmek mevcut bir kurtarma yolu değildir. Bilim/korvet siparişleri bu örnekte alaşım ödüyor; gıda inşaatını doğrudan peşin maden harcayarak engelledikleri iddia edilmez.

## Kanıt ve yeniden oynatma

Ham sonuçlar, gerçek Save fixture'ları, as-run sürücüler, aday kaynağı/patch'i ve ilk tanısal hata logları `stars-faz96h62-kanit.zip` içindedir. Önceki kontrol sonuçları ayrıca bu fazda koşulmuş gibi sayılmaz; önceki mühürlü arşiv ve kullanılan dosya SHA'ları doğrulandı, sekiz başlangıç Save/RNG'si yeniden üretildi. Yeni H61 Save218→240 kontrolü eski eşlenmiş kontrolün bütün Save/RNG özetleriyle eşleşti.

`decision-options-prepayment.json` Save8 ile normalize edilmiş karar problarıdır. `live-decision-audit.json` ek olarak gerçek fonksiyon çağrısı anını yeniden yüklemeden gözlemler; aynı girdi/yükleme düzenindeki bare replay ile tam Save/RNG eşitliği doğrulanmıştır. İlk tanısal denemede farklı yükleme düzenleri karşılaştırılmış ve beklenen fark alınmıştı; bu bir aday sonucu değildir. Düzeltilmiş karşılaştırma ve ilk log birlikte korunmuştur.

Tahmin, üretim çarpanlarını/nüfusu bugünkü değerlerinde dondurur; ücretli kuyruğu, stok bedelini, bakım, vergi ve vadesi gelen ihracatı tarihlendirir. Yeni teknolojileri, nüfus/şok gelişimini, savaşları veya belirsiz ticaret alacağını tahmin ettiği iddia edilmez. Tam oyun kopyası üretim fonksiyonunda oluşturulmaz.

As-run dosyalar özgün mutlak çalışma yollarını korur. Taşınabilir kampanya sürücüsü `research/96h61/replay.js` kullanılabilir; karşılaştırma köküH61, aday için yalnız `I1-rejected.patch`, ayrı manifest hashleri ve aynı Save gereklidir. Kanıt ZIP'indeki Save217 ilk kararı kapsar; Save218 ilk çiftlik siparişinden sonradır. Bu farkı silmeyin.

## Sınırlar ve sonraki somut araştırma

Bir kaynağın altı aylık negatif stok yolunu hiç kötüleştirmeme kuralı, geçici maden sıkıntısını uzun gıda krizine çevirebiliyor. Tek yatırımın bedelini bilmek, bir sonraki zorunlu yatırımın finanse edilebilirliğini garanti etmiyor. Sonraki çalışma yeni eşik olmasın: aynı Save217 üzerinde yalnız iki yerel eylem sırasının salt okunur finansman kanıtı çıkarılsın: çiftlik→girdi tüketimini azaltma ve maden→çiftlik. Ödeme, gerçek seri bitiş ve ikinci zorunlu yatırımın finansman zamanı birlikte ele alınsın; önce saf prototip ve iki yerel kapı. Ekonomik temel güvenli değilken96H.7doktrin çeşitliliğine geçiş önerilmez.

Bu fazın yeni kontrolleri: mekanik11PASS, kanonik koruma40PASS, Chromium kanonik PWA/Save8 duman testi1PASS. Kapı2FAIL.135grup/6068ve17Chromium tam sonuçları önceki faza aittir; bu fazda tam regresyon NOT RUN. FizikselAndroid NOT RUN.
''')
(R/'RESEARCH-96H62.md').write_text((Q/'README.md').read_text())
print('Research only prepared; no runtime/build/game release edits')
