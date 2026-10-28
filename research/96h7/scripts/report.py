from pathlib import Path
import json,collections
P=Path(__file__).resolve().parents[1];E=P/'evidence'
def j(n):return json.loads((E/n).read_text())
def table(head,rows):return '| '+' | '.join(head)+' |\n|'+'|'.join(['---']*len(head))+'|\n'+'\n'.join('| '+' | '.join(str(x)for x in r)+' |'for r in rows)+'\n'
refs=j('HISTORICAL-COMPARISON.json');hist=table(['Seed','Kritik F4→H61','Teslim F4→H61','Teknoloji','Koloni','Gemi','Güç'],[[r['seed']]+[f"{r['historical'][k]}→{r['current'][k]}"for k in ['criticalEmpireMonths','deliveries','techs','colonies','ships','power']]for r in refs])
matched=[]
for family in ['old-natural','balanced','standard']:
 for version in ['historical','control']:
  ds=[json.loads(f.read_text())for f in (E/'matched').glob(f'summary-matched-{family}-{version}-*.json')];matched.append([family,'96F.4'if version=='historical'else'96H.6.1']+[sum(x[k]for x in ds)for k in ['criticalEmpireMonths','foodCritical','deliveries','techs','colonies','ships','power']])
mt=table(['Başlangıç ailesi','Tam motor','Kritik','Gıda kritik','Teslim','Teknoloji','Koloni','Gemi','Güç'],matched)
obj=j('OBJECTIVE-CENSUS.json');names={'regional':'Bölgesel üstünlük','economy':'Ekonomik güç','science':'Teknolojik gelişim','security':'Güvenli sınırlar','federation':'Federasyon güvenliği','trade':'Ticaret ağı','contain':'Rakibi sınırlama','recovery':'Yenilgiden toparlanma','influence':'Diplomatik nüfuz'}
ot=table(['Hedef','Devlet-ay','Görülen hedef dönemi','Tamamlanma işareti','İşaretin gerçek sınırı'],[[names[k],obj[k]['months'],obj[k]['episodesSeen'],obj[k]['completedMarkersSeen'],v]for k,v in [('regional','+2 sahip olunan sistem; fetih şartı değil'),('economy','Pozitif netlerin toplamı artar; bütün girdiler sürdürülebilir demek değil'),('science','+3 teknoloji; rakibe üstünlük şartı değil'),('security','+2 kale; başarılı savunma ölçmüyor'),('federation','İlk federasyon veya +2 müttefik; kalıcı federasyon zaferi değil'),('trade','+3 teslim ve mevcut pakt; yatırım getirisi ölçmüyor'),('contain','Kendi +2 sistemi; rakibin büyümesini doğrudan ölçmüyor'),('recovery','Kritik/severe bütçe kalkar; eski donanma geri gelmeyebilir'),('influence','Pakt+müttefik +2; kalıcılık ölçmüyor')]])
local=[]
for seed in [11,42,404]:
 for version in ['control','candidate']:
  d=j(f'candidate-local/summary-campaign-{seed}-{version}.json');local.append([seed,version]+[d[k]for k in ['criticalEmpireMonths','foodCritical','deliveries','techs','colonies','ships','power']])
lt=table(['Seed','Kol','Kritik','Gıda kritik','Teslim (birikimli)','Teknoloji','Koloni','Gemi','Güç'],local)
pg=j('PREGAME-COMPARISON.json');order=['base','systems30','systems60','systems80','systems100','AI1','AI7','AI11','ring','cluster','hard','originsOff','origins100','council','noPirates','largeSparse'];by={x['tag'].removeprefix('pregame-'):x for x in pg}
pt=table(['Tek değişiklik / kontrol','Kritik','Gıda','Koloni','Teknoloji','Gemi','Güç','Teslim','Savaş açılışı','Yönlü temas','Kabul/teklif'],[[n]+[by[n][k]for k in ['criticalEmpireMonths','foodCritical','colonies','techs','ships','power','deliveries','warDeclarations','contactsDirected']]+[f"{by[n]['acceptedNegotiations']}/{by[n]['negotiations']}"]for n in order])
perf=j('PERFORMANCE.json');pr=table(['Seed','Kol','n','AI turu medyan ms','En yüksek ms','Medyan geçici heap MiB'],[[x['seed'],x['version'],x['n'],f"{x['medianMs']:.2f}",f"{x['maxMs']:.2f}",f"{x['medianHeapDeltaBytes']/1048576:.2f}"]for x in perf])
reg=j('regression/summary.json');rt=table(['Bu fazda yeniden çalıştırılan grup','PASS','FAIL'],[[x['suite'],x['pass'],x['fail']]for x in reg]+[['TOPLAM',sum(x['pass']for x in reg),sum(x['fail']for x in reg)]])
text='''# STARS — FAZ 96H.7: AI Karar ve Verimlilik Rehberi

**Karar: araştırma tamamlandı; tek davranış adayı reddedildi. Yeni oynanabilir sürüm çıkarılmadı. Kanonik oyun 96H.6.1 olarak korunuyor.**

Bu fazda yeni ekonomi eşiği veya büyük AI mimarisi eklenmedi. Beş sınırlı karar ailesi incelendi. Bulunan sefer bekleme kilidi gerçek, fakat kilidi açmak sonraki seferin mali açıdan sürdürülebilir olmasını sağlamadı. Bu nedenle doğru görünen küçük bir hata düzeltmesi bile üretime alınmadı.

## 1. Kaynak, kanonik oyun ve doğrulama

Depo: `sarsiss12-dot/Star`, dal `main`. Başlangıç ve yayın öncesi doğrulanan HEAD: `94d47ea2e4923db54a4eee89affd594844c7f60d`. Yeni araştırmanın uzak commit/HEAD makbuzu teslim raporunun sonundadır; kanıt paketinin kendi hash'i ve onu yayımlayan commit paketin içine öz referans olarak yazılmaz.

| Kaynak | Doğrulama |
|---|---|
| Kanonik oyun | `stars-faz96h61.zip`, 764471 bayt |
| ZIP SHA-256 | `68b64e6cb918a106733568761b0a1a30b16e4550c96d2e26ebde56822ebcb6a0` |
| Build / PWA / Save | `96h61` / `stars-v96h61` / `v8` |
| Güncel AI SHA-256 | `27ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739` |
| CRC / manifest | CRC PASS; 20 ZIP girdisi, 19 runtime dosyası manifest ve çalışma ağacıyla eşleşti |
| İstenen tarihsel kaynak | `fb7454acb48620a0c79c31bfc1ce3b1639504b10` |
| Bu commit'in AI SHA-256 değeri | `760563026597cde42b422cac59f70971a8a6c71783cf52487f31039d80f5c923` |

Üç ayrı çalışma ağacı kullanıldı: doğrulanmış kontrol, tarihsel tam motor ve tek aday. Eski AI yeni oyuna kopyalanmadı. A2/C2/T1/I1/F1 veya 96H.6.3 büyük galaksi denemeleri üretime taşınmadı. Tam dosya hash listesi `SOURCE.json` içinde.

## 2. Kritik tarihsel kaynak ayrımı: 96F.4 ZIP'i istenen commit ile aynı değil

Bulunan `stars-faz96f4.zip` 75128342 bayt, SHA-256 `30cff5cbe451c6e9a2e687a2ee17cc52e837c8140eba3bd0247821e83297fe0d`; CRC sağlam. Ancak içindeki AI hash'i `cc84720363b1df9c4525ee97c23df29d876fcd60ec3a263655734caa2a86b83f`.

19 runtime dosyasının 18'i istenen commit ile aynı. AI'daki fark, varışta bekletilen gerçek koloni gemisinin aylık yeniden değerlendirilmesini ekleyen beş satır. Bu sonraki düzeltme güncel oyunda da bulunuyor. ZIP'in son 4 kritik devlet-ay / 537 teslim sonucu, kullanıcının belirttiği `fb7454a` commit'inin sonucu olarak kullanılamaz.

İstenen commit için `pre-settlement-retry/comparisons.json` içindeki mühürlü sekiz seed özeti seçildi. Beş ilgili kaynak hash'i commit ile eşleşiyor. Diğer `both/repeat` dosyaları sonraki denemeyle üzerine yazıldığı için esas alınmadı. Bu fazda tam tarihsel seed11/120 yeniden koşuldu: **5 kritik, 90 teslim, 29 teknoloji, 9 koloni, 149 gemi, 18481 güç, 4 savaş açılışı**; doğru mühürlü özetle eşleşti. Tarihsel manifest yalnız beş dosyayı kapsıyor; tam 19 dosyalık manifestmiş gibi sunulmadı. Gerçek 19 commit dosyasının hash'i ayrıca alındı.

## 3. Yeniden kullanılan önceki kanıtlar ve sınırlar

`AI-DENGE-96F.md`, `AI-DENGE-96F1.md`, `AI-DENGE-96F3.md`, `AI-DENETIMI-96H0.md` ile H61/H62/H63 kayıtları incelendi. Önceki araştırmalar zaten daha fazla üretim veya daha az kritik ayın ticaret ve stratejik gelişmenin korunduğunu kanıtlamadığını gösteriyordu. Bu araştırmalar yeni test yapılmış gibi sayılmadı.

H61 kanonik sekiz seed/120 ve dört seed/240 kayıtlarının kaynak hash'leri doğrulandı. Üç yeni doğal kontrol koşusunda (11/42/404, 24 ay), bütün aylık stoklar, netler, teknoloji, koloni, gemi, güç ve RNG mühürlü kayıtların ilk 24 ayıyla eşleşti. Tam Save byte eşitliği çıkmadı: başlangıç normalizasyonu ve `_prof`, önbellek zamanları / gözlem yolu farkları var. İlk başarısız tam-hash karşılaştırması da saklandı; sonradan PASS diye yeniden adlandırılmadı. Bu sonuç bütün sekiz seed'in tam Save eşitliğinin yeniden sınandığı anlamına gelmez.

Önceki 120 ay toplamı 14 kritik /455 teslim; 240 ay toplamı 62/1073. Bunlar bu fazın yeni aday sonucu değildir. Seed11/404 geç dönem yeni devlet sorunları açık kalıyor.

## 4. Gerçek oyuncu deneyimi: sekiz seed, doğal başlangıç

Normal zorluk, sarmal, 45 sistem/5 AI, hareketsiz oyuncu, konsey/kriz kapalı, doğal %35 AI kökeni; ayda 60 yarım günlük adım, ay60 gerçek Save8 yükleme. Aşağıda doğru F4 commit kayıtları ile kanonik H61 kayıtları karşılaştırılıyor.

'''+hist+'''
| Toplam | 96F.4 commit | 96H.6.1 |
|---|---:|---:|
| Kritik devlet-ay | 11 | 14 |
| Gerçek kargo teslimi | 574 | 455 |
| Teknoloji | 337 | 331 |
| Koloni | 117 | 129 |
| Gemi | 1445 | 1386 |
| Askerî güç | 191712 | 187795 |
| Son ay canlı AI toplamı | 39 | 40 |

Doğal koşullarda tarihsel kaynak daha çok ticaret ve biraz daha yüksek son güç/bilim üretmiş; güncel oyun daha çok koloni ve bir fazla canlı devletle bitmiş. Ticaret −%20,73; koloni +%10,26; güç −%2,04. Bu, tek yönde “AI iyileşti” veya “AI bozuldu” sonucu değildir. Seed42'nin teknoloji 61→42 ve teslim 106→58 gerilemesi, 2026'nın 54→0 teslimi toplamda gizlenmedi. Seed99 ise teknoloji 36→47 ve teslim 34→57 ile iyileşti.

Kritik sayaç enerji/maden/alaşım/tüketim için net negatif ve stok <3 aylık açık tanımıdır. Gıda ayrı raporlanır. Son ay değerleri hayatta kalan devletleri kapsar; farklı doğum/ölüm ve savaş yolları saf karar kalitesi kanıtı değildir. Bu doğal kampanyalar oyuncu deneyimini karşılaştırır.

## 5. Eşlenmiş başlangıçlar ve köken/kimlik etkisi

11/42/404 için üç aile kullanıldı: eski doğal kökenler, güncel dengeli kökenler, standart kökenler. Her ailenin gerçek başlangıç Save'i her iki sürümün kendi yükleyicisinden geçti. **9/9 aile-seed durumunda** coğrafya, yollar, sahiplik, bina/nüfus, devlet ID/isim/ırk/fizyoloji/etik/civic/özellik/mizaç, stok, net, koloniler ve RNG eşleşti. Seed11'de eski-doğal ve güncel-dengeli başlangıç aynı; bunlar bağımsız örnek gibi çoğaltılmadı.

18 tam-motor koşusu ×12 ay, üç seed toplamları:

'''+mt+'''
Bu testte güncel motor her köken ailesinde dört fazla koloniyle bitti; erken kritik sayısı eski doğal 3→0, dengeli 3→1, standart 0→0. Buna karşılık son filo/güç daha düşük. Daha doğru erken yerleşim/kriz davranışı, her boyutta daha güçlü rekabet demek değil.

F4 havuzu standart dışındaki yedi kökeni kullanıyordu. Güncel havuz `kalinti, kapali, golgeden, gocebe`; Altın Çağ/Son Umut/Kuşatılmış rastgele dağıtılmıyor. Örneğin seed42 devlet4 Altın Çağ→Gölgeden, seed404 devlet2 Kuşatılmış→Kapalı, devlet4 Gölgeden→Göçebe. Seed11'de seçilen doğal kökenler aynı olduğundan o seed'in bütün farkı kökene yüklenemez.

**Nedensellik sınırı:** başlangıç çekirdeği eşit, fakat iki tam motorun diplomasi, federasyon, vassal yükümlülükleri ve yerleşim uygulaması farklı. Güvenli olmayan eski-AI/yeni-motor karışımı yapılmadı. Sonuçlar AI+motor etkisini ölçüyor; algoritma ve başlangıç farkının uzun vadeli yüzdelik payı saptanmadı. Tam iki-faktörlü saf AI politikası deneyinin sağlandığı iddia edilmiyor.

## 6. 96F.4 → güncel kaynakta gerçekten ne değişmiş?

`ai.js`: +191/−43 satır; `diplomacy.js`: +407/−154; `main.js`: +41/−6; `economy.js`: +4/−0. Bu kapsamda construction.js ve commerce.js aynı. Tam AI diff'i kanıt paketinde.

- Federasyon aidatı/federal filo gideri ve vassal vergisi AI bütçesine katılmış; bu yükümlülükler gerçek ve belirsiz senyör geliri peşin yazılmıyor.
- Federasyon oyu sonrası aynı aydaki bütçe tabanı yeniden hesaplanıyor; gölge koloni hesabı federal giderleri dikkate alıyor.
- Recovery hedefi yalnız attack aşamasına değil gather/supply ve yoldaki takviyelere de uygulanıyor; yerel savunma ve ortak sefer yetkisi korunmuş.
- Bekletilmiş gerçek koloni varışı aylık yeniden değerlendiriliyor.
- Sığınma artık otomatik altlandırma yerine mevcut sözleşme müzakeresinden geçiyor.
- Federasyon yasası öncesi kendi oy değerlendirmesi, tekrar deneme ve bütçe koşulları var.

Dokuz hedef, 720 gün olağan bağlılık, 90 gün inceleme, 900 gün ilerlemesizlik, temel profil ağırlıkları büyük ölçüde aynı. Bu yüzden tarihsel farkı “yeni hedef süresi AI'yı bozdu” diye açıklamak kodla desteklenmiyor. Sefer başarısız-hedef süresinin sürekli yenilenmesi de yeni H61'e özgü bir regresyon değil; tarihsel kodda da bulunuyor.

## 7. Dokuz stratejik hedef: ölçülen şey ve gerçek başarı

Kanonik sekiz seed'in ilk120 ayı; aynı hedef dönemini `(seed, devlet, since)` ile tekilleştirme. Geç dönemde halen açık hedefler ve kaybolan devletler nedeniyle aşağıdaki oranlar nihai başarı oranı değildir.

'''+ot+'''
En belirgin ölçüm açığı: `contain` kendi toprak artışını, `security` kale sayısını, `recovery` bütçeyi ölçüyor. Bunlar sırasıyla rakibi sınırlama, savaşı savunma veya eski filo gücüne dönme ile eşdeğer değil. 136 hedef değişimi /81 tamamlanma işareti, 81 stratejik zafer anlamına gelmiyor. Federasyon ve sınırlama az görülen hedefler; bu küçük örnekte başarı üstünlüğü iddia edilemez.

## 8. Kaynaktan doğrulanan AI parametre envanteri

Aşağıdaki alanlar mevcut kodda bulunan gerçek politika girdileri/kurallarıdır. “Test” sütunu bu fazın kapsamını gösterir; kaynak okuması gözlenmiş davranış deneyiyle karıştırılmaz. Bu tablo bütün motor sabitlerinin katalogu değil, incelenen karar zincirlerinin haritasıdır.

| Kod konumu | Gerçek değer/kural | Etki | Bu fazdaki durum / olası yan etki |
|---|---|---|---|
| ai.js:480 `aiUpdateLongPlan` | hold720 gün; review90 gün | Hedef koruma ve değerlendirme | 360/1440 ve30/180 ayrı kollarla denendi |
| ai.js:495–512 | 900 gün ilerlemesizlik; aynı hedefe360 gün ek koruma | Başarısız planı yeniden tartma | Kaynaktan; kör erken değişim başarısızlığı gizleyebilir |
| ai.js:507 | Normal değişimde yeni puan eskiden >0,18 yüksek | Küçük puan salınımını engeller | Değiştirilmedi |
| ai.js:485–490 | Güç önce>150 iken <%60'a düşerse, koloni kaybı, ihanet, ağır tehdit;180 gün acil soğuma | Krize tepki | Hold artışı acil yolu kaldırmıyor |
| ai.js:498–504 | Kimlik hash jitter0…<0,32; stalled eski puan −1,5 | Bağlılık ve çeşitlilik | Yeni RNG tüketmez; değiştirilmedi |
| ai.js:532 | Taktik süre180; ihtiyaç→savunma→savaş→science(sci>,75)→ekonomi | Kısa dönem uygulama | Uzun hedefle aynı şey değil |
| ai.js:1100 `aiProfile.war` | Irk agr +persona bias +mil×,10 +blood,25 +warFury,15; clamp0…1,4; ardından mod/köken | Savaş eğilimi ve donanma | Gerçek kullanılan alan |
| ai.js:1108 `prof.exp` | clamp(r.exp+aut×,04; ,2…1,3), köken bias | Tasarlanmış genişleme profili | Hesaplanıyor, karar tarafında okunmuyor;15 gerçek durumda ,2/1,3 etkisiz |
| ai.js:1100 sci/eco/dip/turtle/spy | sci: bilim ırkı,9 aksi,5+mat×,08; eco: ekonomi ırkı,9 aksi,5+ticaret civic,25; dip:ırk−persona/2−mil×,08; turtle:kale,6 aksi,2−mil×,05; spy:,25+shadow,5+ahl/opCost | Araştırma, hedef puanı, müzakere, savunma, casus seçim | Irk/etik/civic/teknoloji/köken modları ayrıca uygulanır; tek global düğme değiller |
| ai.js:499 | security=,35+turtle×,9+tehdit; regional=,25+war×,8+düşman | Hedef puanı | Ağır tehdit/acil geçiş üstün |
| ai.js:499–501 | science=,2+sci×,95; economy=,35+eco×,9; trade=,2+eco×,55+dip×,35+tradeMul×,2 | Ekonomik/bilimsel kimlik | Mutlak yatırım emri değil; alt kapılar var |
| ai.js:500–503 | federation=,1+dip×,65+turtle×,25−üyelik; influence=,15+dip×,65+etkFlat×,05 | Diplomasi hedefi | Purifier ticaret/fed/influence−10; vassal regional/contain−10 |
| ai.js:501 | contain=,15+war×,4+(güçlü bilinen düşman?,65:−,8); recovery severe?3:−1 | Rakip/toparlanma | Yenilgide recovery5; ağır güvenlikte security5 |
| ai.js:229–255 | Ufuk6; taban stok ene120/min120/yiy60/ala100/tuk60; plan kritik net<0/dayanım<6 | Üretici sırası ve güvenlik | Kuyruk erken üretim kredisi açık; T1 yeniden denenmedi |
| ai.js:376 `aiEconomicOrder` | Açık+<12ay veya düşük stok+urgency>12; urgency sırası | Kaynak önceliği | Ayrı yeni küresel eşik eklenmedi |
| ai.js:355 `aiRecoveryInvestment` | Kendi net geliriyle 0<bekleme≤3ay; altı aylık sürdürülebilirlik | Üretici için biriktirme | Çok adımlı finansman garantisi değil |
| ai.js:261 `aiRecoverEconomy` | Maden<120/açık, boş colonyJobs,120 gün bekleme | Ücretli yıkımla kriz müdahalesi | Kuyruk ilk yardımı geciktirebilir; değiştirilmedi |
| ai.js:298 `aiShipPurchaseSustainable` | Olağan6ay, gözlenen savunma gemisi3ay | Gemi sonrası stok dayanımı | Olağan3/9 ay,15 gerçek allocator girişi; çıktı değişmedi |
| ai.js:314 `aiColonyForecast` | Gölge başlangıç koloni yükü; normal6+ceil(santral günü/30),stratejik3 ay | Koloni ödeme/yerleşim güvenliği | Mekanik korunmuş; sömürge başına bedava kaynak yok |
| ai.js:1316 `aiShipProduction` | Barış6/savaş10 sipariş; tersane×2/3; alaşım rezervi barış24/savaş12,min120 | Donanma bütçesi | Koloni öncelik prototipi denendi;15 giriş/3×12ayda etkisiz |
| ai.js:458 `aiStrategicPartner` | İlişki>−35,trust>−45; üst4 aday,her birinde2 yakın bilinen sistem,eta≤360 | Ulaşılabilir diplomatik ortak | Üst4 sınırı kaldırılınca104 karar eşinde seçim aynı |
| ai.js:569 civarı stratejik diplomasi | Etki≥120;180 gün stratejik,120 gün teklif soğuması | Teklif tekrarları | Paktlı ortak her zaman kaçırılmış fırsat demek değil |
| ai.js:629 `aiMilitaryCampaign` | Yerel savunma önce; serbest kuvvet supply>,55; rota eta<360/hedef supply>,4 | Sefere katılım | Gerçek maliyetli sevk ayrı risk |
| ai.js:680 | Kuvvet=max80,savunma×1,25; toplanma≤180gün | Birlikte saldırı | 1,10/1,50 kolları açılışı değiştirmedi |
| ai.js:665–686 | İlerlemesiz>540 gün→hedef360 gün beklesin; en çok6 kayıt | Başarısız hedefe yeniden deneme | Süre kayıyor; tek adayla düzeltme denendi, kabul edilmedi |
| diplomacy.js:5446 `aiWarReview` | En çok2 cephe; barış720−kin×5 gün; casus belli; iştah≥,92−kin×,45; güç oran≥,55 veya kin≥,80; erişim ve bütçe | Etkin savaş açma yolu | aiTurn'deki eski1,14 oranı normal yetkisiz yolda engelleniyor; o değeri değiştirmek doğru hassasiyet deneyi olmaz |
| diplomacy.js:5490 civarı | chance clamp((score−,92+kin×,55)×,20;,015… ,34) | Hazır savaşın zamanlaması | Olasılık artışı başarı garantisi değil; değiştirilmedi |
| ai.js:3218 /3455 | Teknoloji çalma puanı sci×,5+spy×,20; operasyon sıklığı,06+dip×,05,ahl/civic/persona çarpanı;Etki≥40 | Casusluk seçimi ve sıklığı | spy tek başına işlem sıklığını artırmaz; bu fazda taranmadı |
| main.js:1409/2507 | aiMul kolay,75/normal1/zor1,35/kâbus1,8; ai.extra=(aiMul−1)×,8 min/ara/ala; oyuncu start1,35/1/,85/,7 | Zorluk kaynak avantajı | Zor24ay gözlemi aşağıda; ayrı daha zeki algoritma yok |
| main.js:2507 `e.agr` | aiAgr,7/1/1,3/1,6 ile çarpılıyor | Saldırganlık için tasarlanmış devlet alanı | Normal AI kararları e.agr okumuyor, profil ırk agr okuyor; kriz dalgası aiAgr'yi ayrıca kullanıyor |

## 9. Kontrollü parametre haritası: gerçekten ne değişti?

Üç gerçek ay60 Save'i: seed11/42/404. Her politika tek başına değiştirildi; kaynak, ücretsiz gemi veya RNG avantajı yok. 24 kısa kol ×12ay. Gemi alım kapıları ayrıca ay61 gerçek allocator girişinden 15 devlet Save'i üzerinde incelendi. Beş aile: plan zamanlaması; gemi dayanımı; askerî kuvvet/hedef uygulanabilirliği; diplomatik ortak seçimi; sivil yatırım sırası. `prof.exp` kullanılmama probu ek bir geniş tarama değildir.

| Parametre / konum | Kontrol→deney | Gözlenen davranış | Fayda / zarar | Güven / üretim önerisi |
|---|---|---|---|---|
| Hedef bağlılığı,ai.js:480 | 720→360/1440 gün | Seed11 değişim2→3/0; diğer seedler1/0 değişimini korudu | Güç/koloni/bilim/teslim/kritik toplamı değişmedi.1440gün kolu ticarette küçük oran farkı yarattı; genel kazanç yok | Üç eş Save,12ay; üretim için kanıt yok |
| İnceleme,ai.js:480 | 90→30/180 gün | Üç seed toplamı61→170/32 inceleme; seed11 değişim2→3/2 | Fiziksel durum/eylem/RNG bütün aylarda aynı. Daha çok inceleme daha çok sonuç üretmedi | Kısa pencere için güçlü; evrensel uzun vade sonucu değil |
| Olağan gemi tamponu,ai.js:298 | 6→3/9 ay | 15 allocator girişinde aynı sipariş,Save veRNG | Kapıya gelmeden başka koşullar belirleyici; fayda/zarar oluşmadı | Bu girdiler için kesin etkisizlik; uzun kampanya yapılmadı |
| Kuvvet çarpanı,ai.js:680 | 1,25→1,10/1,50 | Üç seed×12ay gerçek eylem veRNG aynı | Hedef bekleme/diğer kapıları aşmadı; daha düşük oranın savaşı kazandırdığı kanıtlanmadı | Doğal kayıt temelli; üretim önerilmez |
| Ortak pencere,ai.js:458 | Üst4→bütün uygun adaylar | 104 eş seçimde fark0; 100sistem/11AI gerçek Save'i de var | Daha geniş aramanın faydası gözlenmedi | İzole VM/RNG eş; doğal işlev önbellek yazabilir |
| Mevcut paktı atlama | Influence için mevcut paktları eleme, salt karar probu | Bu örneklerde yeni uygun alternatif çıkmadı; bazen sonuç null | Paktlı hedefin görünmesi tek başına yanlış karar kanıtı değil | İnceleme; aday yapılmadı |
| Sivil yatırım sırası,ai.js:1316 | Güvenli barış+regional/economy durumunda mevcut koloni emrini savaş gemisinden önce dene | 15 girişte ve3×12ayda Save/sipariş veya fiziksel sonuç farkı yok | İhtiyaç/altyapı/finansman kapıları daha önce belirleyici; koloni artışı iddia edilmez | Üretim dışı prototip |
| prof.exp,ai.js:1108 | ,2→1,3 | 15/15 girişte aynı çıktı/Save/RNG | Bu alanı “yayılma düğmesi” diye ayarlamak işe yaramıyor | Statik okuma+gerçek çağrı; kullanılmıyor |
| Başarısız hedef süresi,ai.js:665 | Her tur yenileme→sabit son tarih+yeniden ilerleme penceresi | Ay72 gerçek retry; supply kilidi açıldı | Seed11 güç/teknoloji geriledi,22 gemi terhis edildi | **Tek üretim adayı; RED** |

Bağlılık deneyi kayıtlı hedefin `old.since` tarihinden itibaren 360/1440 günü esas aldı; yalnız yeni hedef kurucusu değiştirilmedi. İnceleme deneyi mevcut Save'deki ilk `nextReview` tarihini zorla öne çekmedi; ilk incelemeden sonra30/180 uygulandı. Bu ayrım yeniden üretim için önemlidir.

1440 günlük bağlılık kolunun seed11'deki tek küçük ekonomik farkı: gün1950 mineral/enerji kargo takası9,1↔15,8 yerine9↔15,9. Pencere sonunda devlet4'e +0,3 mineral/+0,3 enerji,devlet5'e karşılık−0,3/−0,3; toplam üretim kazancı değil. “Bütün durumlar byte eş” iddiası bu kol için yapılmadı. Diğer kısa hassasiyet kolları fiziksel durum, eylem izi ve RNG bakımından kontrolle eşleşti.

## 10. Ekonomik hassasiyet ve yatırım zinciri

Bu faz yeni stok tahmini veya iki-adımlı finansman algoritması geliştirmedi. H61/T1 üretim zamanlaması, H62/I1 karar sırası, H63/F1 takip eden yatırım darboğazı kanıtları kullanıldı; hiçbiri yeni kanonik yama yapılmadı.

Ücretli kuyruk plan netine bitmeden üretim kredisi verebiliyor; gerçek işler sırayla bitiyor. Yeni devletler birikmiş bina tüketimini ve eski ücretli kuyruğu devralıyor. Yalnız doğru net, sonraki zorunlu üreticinin peşin parasını garantilemiyor. Seed11 maden düzelirken gıda/alaşım, seed404 fabrika gecikirken maden/gıda/vergi birbirini etkiliyor. Bu sorunlar tamamlanmış sayılmadı.

Gemi rezervini3/9aya değiştirmek gerçek siparişleri değiştirmediği için burada daha kısa tamponun ekonomiyi düzelttiği veya daha uzun tamponun pasifleştirdiği söylenemez. Pasiflik/risk iddiası için ilgili kapının gerçekten karar verdiği bir durum gerekir.

## 11. Askerî verimlilik: gerçek hata ve onu açan aday

Seed11 devlet1, ay60/gün1800: tek bilinen düşman hedef6; campaign.phase=supply; lastProgress840; failedTargets[6]=2160. `aiWarAccess` hedef için ulaşılabilir2332 güç /144,9 ihtiyaç döndürüyor. Buna rağmen mevcut motor her değerlendirmede >540 gün ilerlemesizliği yeniden uyguluyor:

| Gün / ay | Kontrolde hedefin bekleme sonu | Adayda |
|---|---:|---|
| 1800 /60 | 2160 | 2160 |
| 1830 /61 | 2190 | 2160 |
| 2100 /70 | 2460 | 2160 |
| 2160 /72 | 2520 | Süre dolar, saldırı yeniden denenir |

Kontrolde son tarih her ay kayar. Başka hedef/koşul değişmedikçe kilit kendiliğinden bitmez. Bu gerçek mantık hatasıdır; supply metni yalnız gösterim hatası değil.

Tek aday `aiMilitaryCampaign` içinde mevcut bekleme kaydını dolmadan uzatmamayı, dolan kaydı temizleyip yeniden denemeye gerçek yeni ilerleme başlangıcı vermeyi denedi. Önceki tarihsel en iyi kuvvet/mesafe retry'nin yeni referansı olarak sıfırlandı. 540/360 gün, kuvvet/supply oranı, savunma önceliği, ortak sefer rezervasyonu ve RNG değiştirilmedi. Save formatı eklenmedi.

İzole yaşam döngüsü testi sabit süre, expiry, yeniden seçim, ilerleme penceresi, hemen tekrar kilitlenmeme, Save8 ve RNG korunumu açısından PASS. **Bu, stratejik kalite kabulü değildir.**

## 12. Aynı Save üzerinde tek adayın sonucu: RED

Üç gerçek ay60 Save'inden ay84'e kadar kontrol/aday; input hash'leri aynı. Teslim sayacı önceki60ayı da içerir; pencere kazançları iki kolda aynı başlangıçtan çıkarılabilir.

'''+lt+'''
Seed11 kontrol/aday ortak başlangıcındaki devletler korundu. Adayda genel kritik ve gıda kritik0 kaldı; fakat bilim22→21, gemi81→44 ve güç10323→4990. Devlet1 sahip olduğu sistem4→5 oldu; kolonileri2→2 kaldı. Fazladan bir sistem, bu kadar üretim/filo kaybını güvenli genel faydaya dönüştürmüyor. Seed42/404 kolları bütün fiziksel sonuç veRNG bakımından aynı kaldı; bu iki pencere seed11'deki gerilemeyi telafi etmez.

Gerçek karar zinciri:

1. Ay72/gün2160: süre doldu, campaign attack aşamasına geçti; emirler mevcut gemilere verildi.
2. Ay73: enerji neti kontrolde+17,61 iken adayda−171,70; ay77'de aday−204,16, stok1102,09.
3. Gün2310/ay77: `aiDisbandTick` devlet1'in31 gemisinden22'sini terhis etti. Stok/net dayanımı yaklaşık5,40ay; mevcut savaşta terhis kriz eşiği6ay. Bu kayıt `attritionTick` veya savaşta22 gemi imhası değil.
4. Ay78'de güç864; ay79 recovery; ay84 güç1771. Kontrol aynı devlette38 gemi/5421 güçle bitiyor.

Ek savaş gözlemcisi de native son Save hash'ini aynen korudu. Kontrol212/aday226 gerçek battleRound; toplam savaştaki kayıplar ayrı taraf vektöründe saklandı. Devlet1'in22 gemilik ana düşüşü muharebe kaybı diye raporlanmadı. Dışarıdaki filonun gerçek bakım/ikmal yükü ile satın alma/yerel bütçe değerlendirmesi uyumsuzluğu bu dizinin bir sonraki dar araştırma noktasıdır; bütün gelir değişimini tek bir oranla açıklayan bir karşı-olgusal ayrıştırma yapılmadı.

Tek aday reddedildi. Başka varyant, eşik taraması veya birleşik ikinci yama denenmedi. 120/240 aylık aday kampanyaları erken kapı başarısız olduğu için **NOT RUN**.

## 13. Diplomatik ve federatif verimlilik

Daha yüksek dip yalnız daha çok iyi teklif anlamına gelmez: ilişki/güven, erişim, Etki, sözleşme değerlendirmesi ve bekleme süreleri birlikte çalışıyor. Mevcut paktlı ortak seçilmesini toplam141 influence-devlet-ayında görmek,141 kaçırılmış yeni anlaşma kanıtı değildir; gerçek uygun alternatif yoksa elemek yalnız null döndürür.

Üst4 ortak sınırını genişleten104 eş karar probu seçim değiştirmedi. Dolayısıyla bu sınırın doğal kayıtlarda fırsat kaçırdığını kanıtlamadan kaldırmak verimlilik iyileştirmesi sayılmadı. `aiStrategicPartner` güç/baskı önbelleklerini yazabildiğinden kollar ayrı aynı Save VM'lerinde çalıştırıldı; işlev saf diye tanıtılmadı.

24 aylık pregame örneklerinde kabul edilen teklifler ve gerçek savaş açılışları aşağıda. Bunlar bütün antlaşmaların uzun vadeli kalıcılığı veya federasyon stratejisinin kazanımı değildir. Bu fazda bütün tarihsel federasyon oylamalarının stratejik doğruluk puanı çıkarılmadı. Mevcut federasyon, vassallık, savaş ve ittifak sonlandırma davranışları203 testlik hedefli regresyonda korundu.

## 14. Ticaret ve kolonileşme: hareketlilik ile kazanç ayrımı

Güncel sekiz seed/120 kayıtlarındaki sağ kalan devletlerin birikimli kargo vektörleri:

| Kaynak | Gerçek alınan | Yüklenen | Kaydedilen kayıp |
|---|---:|---:|---:|
| Enerji | 1049,8 | 1064,3 | 0 |
| Maden | 1780,6 | 1880,0 | 26,7 |
| Alaşım | 2528,5 | 2614,8 | 15,9 |
| Tüketim | 633,7 | 681,6 | 16 |
| Gıda | 481,6 | 510,8 | 15,8 |

Bunlar net kâr tablosu değildir. Yüklenen ile alınan farkında seyahatteki kargo, anlaşma tarafı/sayaç kapsamı ve kayıplar bulunabilir. Enerji ile alaşım toplanarak tek evrensel kazanç yapılmadı. Liman/gemi yatırımını, bekleyen kargoyu, kaynakların yerel marjinal değerini ve ölen tarafları kapsayan tarihsel eş ROI hesaplanmadı: **NOT RUN**. Ödeme izleri ve kaynak vektörleri saklandı;455 teslimi455 kaynak birimi saymak yanlış.

Güncel doğal kampanyaların kolonisi117→129 artıyor; eşlenmiş erken pencerede de dört fazla. Kolonileştirme lehine somut sonuç var. Fakat sivil gemiyi önce alma prototipi mevcut15girişte etkisiz; bu gelişim o prototipe atfedilemez. Yaşayan koloninin sayısı, maliyeti ve uzun süre sürdürülebilmesi ayrı izlenmeli.

## 15. Pregame: tek ayarın erken davranışa etkisi

Kanonik seçenekler kullanıldı:30/45/60/80/100 sistem,1–11 AI. 120/160/200 veya20AI bu fazda kanonik kabul edilmedi. Her satır seed11/24ay; aksi yazılmadıkça45/5,normal,sarmal,%35rastgele köken,konsey/krizkapalı,korsanaçık,kalıntıyok. Sistem boyutu testinde AI sayısı5sabit; AI sayısı testinde45sistem sabit. largeSparse,100/5 satırıyla karşılaştırılır; temel45/5'e göre saf tek etken sonucu değildir.

'''+pt+'''
Yönlü temas ve teklif sayıları kişi başına performans değil; AI sayısı arttığında toplamlar mekanik olarak da büyür. Bütün başlangıçlar yeniden kurulduğundan boyut/AI sayısı coğrafya, seçilen kimlikler veya ekonomik ortamı da değiştirebilir. Tek yapılandırma etkeni değişmiştir; aynı aktörün her şeyinin sabit tutulduğu karşı-olgusal iddia değildir.

## 16. Oyuncu için kurulum rehberi: ne seçmeli?

- **Erken hareket ve diplomasi:** bu seed'de30/5,24 temas ve28 teslim;45/5'te13temas/0teslim.45/11 daha çok toplam teklif ve24teslim, bir savaş açılışı üretti. Tek seed/24ay bulgusudur; küçük galakside her oyunun daha iyi ekonomi verdiği söylenemez.
- **Daha seyrek galaksi:**100/1'de yalnız1yönlü temas,0teslim ve0son filo gücü;100/5'te13temas/3863güç. Az rekabet, her zaman daha etkin genişleme değildir; örnekte ikisinde de devlet başına yaklaşık2koloni var. Kolonileşmenin arttığı kanıtlanmadı.
- **Halka:** aynı örnekte19temas,6teslim,14kabul; sarmalda13/0/5. Kümede25temas ve11kabul var, teslim0. Halka her rota/ikmal açısından evrensel olarak daha iyi diye sunulamaz; bu doğal coğrafya örneği erken bağlantı farkını gösteriyor.
- **Daha güçlü rakip:** zor ayarında güç3315→4921 ve gemi33→48; bilim0 ve koloni10 değişmedi. Kaynak bonusu var, ayrı daha iyi karar algoritması yok. Varsayılan zor üretim katkısı min/ara/ala için+0,28; oyuncu başlangıcı×0,85. “Saldırganlık1,3çarpanı doğrudan normal AI kararına gidiyor” varsayımı doğru değil; e.agr kullanılmıyor. Kriz dalgasının ayrı zorluk çarpanı var.
- **Daha tutarlı başlangıç:** rastgele köken kapalı örneğinde filo/güç artıyor, ama bütün oyunlarda aynı sonuç garanti değil. %100 mevcut dengeli köken örneği iki savaş ve düşük güç üretti; bunu yalnız daha zayıf zekâ diye yorumlamak yanlış. Başlangıç zorluğu ve kimlik değişiyor.
- **Konsey/korsan:**24ayda bu örnekte ana sayılar değişmedi; bunun “etkisiz ayar” anlamı yok. Ana örnekte kargo teslimi yok; korsan yağması etkisi için fırsat oluşmamış olabilir. Konseyin geç dönem yasaları ve kriz baskısı sınanmadı.

Kolay/kâbus ile%20/%60köken seçeneklerinin kaynak kuralları okundu; her biri için ek kampanya taranmadı. Kriz zamanlayıcısı kapalıyken olayüretimi sınanamaz; açık kriz kampanyası **NOT RUN**. Rekabet için zor, fırsat yoğunluğu için daha yoğun kurulum önerisi bu küçük örnek ve gerçek kod etkilerine dayanır; yeni evrensel denge garantisi değildir.

## 17. Asıl verimlilik değerlendirmesi

| Boyut | Bu fazın kanıtı | Çıkarılamayan sonuç |
|---|---|---|
| Ekonomik verimlilik | Doğal14vs11kritik; eşlenmiş erken kriz azalması; gerçek stok/net/ödeme/kargo | Güncel karar kodu her durumda daha iyi/kötü |
| Stratejik etkinlik | Hedef dönemleri, gerçek emirler, retry kilidi ve22terhis zinciri | Her tamamlanma işareti zafer |
| Rekabet gücü | Koloni artışı; doğal güç/science hafif düşük; seedbazlıbüyükfarklar | Daha çok savaş/emir her zaman güçlü AI |
| Hesaplama | İnceleme61→170,sonuç kazancı yok; tekAI zaman/heap örneği | Daha çok analiz daha zeki veya mobilde güvenli |

Mevcut değişkenlerin hangi dalda gerçekten kullanıldığını kontrol etmek, sayı değiştirmekten daha değerlidir. `prof.exp`/e.agr gibi bağlanmamış alanları güçlendirmek sonuç vermez; aktif kuvvet oranı bile önce hedef bekleme kapısında takılabilir. Kilidi açınca da seferin gerçek bakım bütçesi belirleyici olur.

## 18. Performans ve bellek

Aynı ay61 canlı giriş Save'inden üç seed,her kaynakta7ayrıVM; kurulum süreye katılmadı, öncesindeGC. Diğer koşular bittikten sonra alınan son örnek:

'''+pr+'''
Heap farkı tek turdaki geçici V8 tahsisidir; kalıcı bellek sızıntısı, tarayıcı RSS veya Android belleği değildir. Sıra/JIT/gürültü nedeniyle adayın hızlandığı iddia edilmez. Seed404 ağır turu mevcut kodda da görülüyor. Aday yeni dünya kopyası/simülasyon döngüsü eklemiyor; mevcut ençok6başarısız hedef kaydını işliyor. Davranış kapısında reddedildiği için mobil performans kabulüne taşınmadı.

## 19. Yeniden çalıştırılan motor testleri

'''+rt+'''
Bunlar bu fazda taze203 PASS/0FAIL,10grup. Önceki135grup/6068PASS yeniden çalıştırılmış gibi yazılmadı. Setup grubunun gerçek boyut/şekil/seed/yoğunluk,benzersizbaşkent,bağlıyol,kökenRNG veSave8 kontrolleri de var. Testin ürettiği iki audit dosyası kanıta alındı, üretim ağacı kirli bırakılmadı.

## 20. Diğer PASS / FAIL / NOT RUN ayrımı

| Kontrol | Sonuç | Kapsam |
|---|---|---|
| Kanonik ZIP CRC +19runtime | PASS | Bu fazda gerçek dosyalar |
| F4 ZIP=istenen commit | FAIL/eşit değil | Doğru kaynak ayrımı yapıldı;18/19eş |
| Eşlenmiş başlangıç çekirdeği | 9/9 PASS | Üç aile×üçseed;tam motor sonra ayrışabilir |
| Tarihsel seed11/120 yeniden üretim | PASS | Doğru commit özetine eş |
| Taze kontrol stok/net/sonuç/RNG | 3×24ay PASS | Tam serialized byte eşitliği değil |
| Hassasiyet çalışma tamamlanması | 24/24 başarılı | Politika kabulü değil |
| Pregame çalışma tamamlanması | 16/16 başarılı | Tekseed24ay |
| Aynı Save aday karşılaştırması | 6/6 çalışma başarılı | Üçkontrol/üçaday;kalite ayrı |
| Aday zamanlayıcı/Save/RNG mantığı | PASS | Gerçek fixture üstünde izole geçişler |
| Aday stratejik kalite | **FAIL / RED** | Seed11 güç−%51,66;22terhis |
| Aday8seed/120ay | NOT RUN | Erken kalite kapısı başarısız |
| Aday4seed/240ay | NOT RUN | Aynı nedenle |
| Yeni ekonomi planlayıcısı veya eski adaylar | NOT RUN | Kapsam dışı/önceden reddedilmiş |
| Kriz uzun kampanyası / ticaret ROI | NOT RUN | Yeni geniş tarama yapılmadı |
| Fiziksel Android | NOT RUN | Cihaz testi yok |

“Çalışma hatasız bitti” ile “davranış güvenli” aynıPASSsütununa karıştırılmadı. İlk host tırnak hatası, partner saflık varsayımı ve eksikICU tarayıcı açılışı `HARNESS-NOTES.md` veilkloglarda saklandı; düzeltildikten sonraki testler ayrı.

## 21. Save8, RNG, Chromium ve PWA

Üretimde Save8şeması veRNGaynı. Eşlenmiş girişlerinRNG'si aynı, snapshotgözlemcisiSaveveRNGsaflığıassertion'ından geçti. Adayın izole sefer fonksiyonu yeniRNGtüketmedi; davranış/çarpışmalar değişince tamkampanyaRNGayrışması beklenebilir. Kontrol ve adayın bütüngelecekRNG'sinin aynı olduğu iddia edilmedi.

Mevcut kanonik oyunda gerçek Chromium ile **17/17 PASS,0pageerror**:844×390,740×360,390×844;altıfederasyonsekmesi,bağımsızkaydırma,ayrılma/ihraç,gelenkutusukararı,vassalyönetimi,filofiltreleri,üç/ikisütuninşa,44pikyıkım,ittifaksonlandırmaonayı/iptal/eskiişlemkoruması,federasyonengeli,gerçekSave8sonrasıeskiişlemengeli,çevrimdışıPWAyenidenaçılışı. Bu adaybrowserkabulü değil; değişmeyen96H61regresyonu. FizikselAndroid**NOT RUN**.

## 22. Değişen dosyalar ve yayın kararı

Üretim runtime dosyası değişmedi. Build/PWAyükseltilmedi. Yeni`stars-faz96h7.zip`ve`RELEASE-96H7.json`**oluşturulmadı**. Çalışan oyun96H.6.1;oynanabilirbir96H.7çıktığı iddiaedilmez.

Araştırma dosyaları:

- `AI-KARAR-VERIMLILIK-96H7.md`:bu rehber.
- `RESEARCH-96H7.json`:araştırmakararı,kapsam,kanıtpaketihash'i.
- `research/96h7/`:parametrekarşılaştırmaları,hamsonuçözetleri,testlogları,README,çalıştırıcılar.
- `campaign-deadline-rejected.patch`:yalnızaday`aiMilitaryCampaign`;üretimeuygulanmadı.
- `stars-faz96h7-kanit.zip`:araştırmakanıtı,oyunkurulumpaketideğil.

Kanonik19runtimeveoyunZIP'isonkezhashkarşılaştırmasındakorunmalı;GitHubgüncellemesiforcekullanmadanbeklenenHEADüstüneyapılır. SonuzakHEAD,ZIP/manifestvehashmakbuzuteslimraporununekindedir. Kanıtpaketindeki`EVIDENCE-MANIFEST.json`paketüyelerininbayt/SHA/CRCdeğerlerinitaşır;paketkendiSHA'sınıiçermez.

## 23. Kullanıcının A–J sorularına net yanıt

**A — Hangisi daha iyi ekonomik karar veriyor?** Doğal120ayölçülerindeistenenF4committicaretvedayanıklılıktadahaiyigörünüyor;güncelkolonidahafazla.Eşlenmişerkenbaşlangıçtagüncelkrizazvekolonifazla.Safkararkoduiçinevrenselkazananbelirlenmedi.

**B — Güncel savaş/diplomasi/kolonileştirme daha mı iyi?** Kolonileştirmedahaçok.Savaşvediplomasidegenelüstünlükkanıtlanmadı;bugünküseferkilidiniaçmadenemesidahapahalısonuçverdi.

**C — Eski avantajın ne kadarı başlangıçtan?** Ölçülebilirkarıştırıcıvar:özellikleseed42AltınÇağvegüncelhavuzdeğişiyor.Ancakseed11kökenlerizatenaynı;farkıntamamıkökenolamaz.Uzunvadeyüzdelikpay**belirlenmedi**.

**D — Hangi kurallar verimliliği artırıyor?** Bu fazdaüretimeönerilecekkadargüvenlikanıtverentekdeğişiklikyok.Mevcutüreticigüvenliği,gerçekkoloniyüküvebilgi/rotakapılarıetkin;“bunlarıkaldırıncaAIiyileşir”kanıtıçıkmadı.

**E — Hangi ayarlar pasif/aşırı saldırgan yapıyor?** Somutpasiflikörneğisürekliuzayanhedefbeklemesi.Süreninkörceaçılmasısevkbakımısonrasıterhisegidiyor.Hold/runway/forcekollarınınbuyöndeevrenselfaydasıölçülmedi.

**F — Parametre değişince olumlu/olumsuz ne oluyor?** İnceleme30günoluncadeğerlendirme61→170,sonuçkazancı0.Hold1440günoluncaseed11değişim2→0,sonuçkazancı0,küçüktakasoranıfarkıvar.prof.exp,2/,3...1,3varyantlarıetkisiz.Seferretryadayıkilidiaçtıamagüçvedonanmayıgeriletti.Bölüm9herkolukaynagıylagösteriyor.

**G — Hangi kurulum?** Örnektezordahagüçlürakip;yoğunküçükharita/çokAIerkenetkileşimiartırdı;halkaerkenticaret/diplomasiyidesteledi.AzAI/büyükharitanındahaiyikolonileştirdiğikanıtlanmadı.Tekseed24aybulgularındanhepsindegarantiçıkarılamaz.

**H — En büyük üç karar zayıflığı?** (1)Seferuygulanabilirliği:beklemeyaşam döngüsüylegerçeksevkbakımı/terhisbirliktetutarlıdeğil.(2)Hedef→eylem→gerçekbaşarıbağı:milestonezaferyerinetemelproxyölçüyor,bazıprofilalanlarıeylemebağlıdeğil.(3)Ekonomideku­yrukzamanıvetakipedenüreticininfinansmanı;öncekikanıtlarlakorumaaçığısürüyor.

**I — Güvenli AI geliştirmesi yayımlandı mı?** **Hayır.**Tekadayreddedildi,üretimkorundu.GitHub'ayapılangüncellemebiraraştırmasonucu.

**J — Bir sonraki somut iş?** Yenihedefpuanı/eşikaramasıyerine,aynıseed11/ay60kaydıüstünde**sefereçıkışınenerjibakımınımevcutfleetUpkeepveaiDisbandTickkurallarıylabirliktedeğerlendirme**.İlkfixture22gemilikterhiszinciriolmalı;yalnızgerçekmaliyetinölçülmesinibaşarılıseferlebağlayanbirkararincelenmeli.Beklemeyamasınıtekbaşınayayımlama.

## 24. Açık sorunlar ve sonraki faz

Seferbeklemebug'ıaçık;adaypakettegörünürfakatkabul edilmedi.Sevksonrasıbakım/terhis,hedefbaşarısınınproxyölçümü,prof.exp/e.agrbağlantıları,seed11/404ekonomisi,2026ticaretkaybıkorunanaçıksorunlar.Federasyonaoylamaüstünlüğü,ticaretROIvegerçekAndroidperformansıbuaraştırmaylatamamlanmışdeğil.

Doktrinçeşitliliği,Teknokrasi/KutsalMeclis,82Makine/Arındırıcıuyumu,yayılmacıkolonifinansmanı,büyükgalaksiperformansıveSave8ortakseferkayıthotfix'ia­yrıbaşlıklardır.Bufazekonomiyiyenidenbaşlatmadıvebunlarıgizliceyayı­naeklemedi.Öncelik,tekölçülebilirseferuygulanabilirliğidavranışınıgeliştirmek;ardındandokuzhedefingerçeksonuçölçümleriniiyileştirmek.
'''
# Maintain readable Turkish prose in the final sections; avoid accidental concatenation from compact notes.
replacements={'seedbazlıbüyükfarklar':'seed bazlı büyük farklar','Tekseed24ay':'Tek seed, 24 ay','tekseed24ay':'tek seed, 24 ay'}
for a,b in replacements.items():text=text.replace(a,b)
text=text.split('## 21. Save8, RNG, Chromium ve PWA')[0]+(P/'scripts/report-ending.md').read_text()
text=text.replace('\u00ad','')
(P/'AI-KARAR-VERIMLILIK-96H7.md').write_text(text)
print('report bytes',len(text.encode()))
