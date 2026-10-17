#!/usr/bin/env python3
"""Build 95C.1 handoff documents from this phase's measured evidence."""
from pathlib import Path
import json, hashlib, difflib

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT.parent/'baseline95c'
AUDIT=ROOT/'tests/audit-95c1'
summary=json.loads((ROOT/'tests/summary-95c1.json').read_text())
assert summary['ok'] and not summary['fail'] and not summary['skipped']
perf=json.loads((AUDIT/'performance.json').read_text())
campaign=json.loads((AUDIT/'regression-campaign-summary.json').read_text())
issues=json.loads((AUDIT/'player-issues.json').read_text())
changed=json.loads((AUDIT/'changed-production.json').read_text())
github=json.loads((AUDIT/'github-reference.json').read_text())
assert github['all_production_matches']
TOTAL=f"{summary['suites']} paket / {summary['pass']:,} başarılı kontrol / {summary['fail']} kalan hata".replace(',','.')
HASH='ba8f588a7b31ec7d0f7b997a5f04f432fa45fa67c190fb07ea21ed25b9a13537'
COMMIT='0626b90a889dc3edb72687d86eea1f50a4702add'
def write(name,text): (ROOT/name).write_text(text.strip()+'\n',encoding='utf-8')
def ms(n):return f'{n:.2f}'.replace('.',',')
b,a=perf['before'],perf['after']
perf_table=f'''| Ölçüm | 95C | 95C.1 |
|---|---:|---:|
| 100 sistem / 50 bekleyen gemi; tik başına değerlendirilen sevkiyat | {b['routing']['evaluatedPerTick']} | {a['routing']['evaluatedPerTick']} |
| Başarısız denemede ek neden rotası / tik | {b['routing']['diagnosticPathCalls']} | {a['routing']['diagnosticPathCalls']} |
| Bu stres tikinin medyan süresi | {ms(b['routing']['medianMs'])} ms | {ms(a['routing']['medianMs'])} ms |
| Bu stres tikinin P95 süresi | {ms(b['routing']['p95Ms'])} ms | {ms(a['routing']['p95Ms'])} ms |
| 1000 üst bar HTML üretimi, mock DOM | {ms(b['ui']['ms'])} ms | {ms(a['ui']['ms'])} ms |
| Üst bar başına muharebe sayımı | {b['ui']['battleCountCallsPerRender']} | {a['ui']['battleCountCallsPerRender']} |
| Değişmeyen 1000 ortak sefer tikinde rota araması | {b['stableJointTicks']['routeCalls']} | {a['stableJointTicks']['routeCalls']} |'''

write('FAZ95C1-RAPOR.txt',f'''STARS — FAZ 95C.1
Oyuncu testi düzeltmeleri; yeni Android denemesi için kalite adayı

KAYNAK
stars-faz95c.zip
SHA-256: {HASH}
CRC: geçti. Kaynak manifesti: 2003 dosyanın tamamı eşleşti.
GitHub main / {COMMIT}: aynı yayın; 11 üretim dosyasının Git blob kimliği ZIP ile aynı. DEVAM-95C.md de aynı.
95A, 95B, 95C kaynakları, raporları ve 15 Ekim geliştirme notu korunur.

SONUÇ
{TOTAL}; atlanan paket ve zaman aşımı yok.
Yöntem: tek tam regresyon + gerekçesi kayıtlı hedefli takip. İlk tam koşu 4897 başarılı / 26 başarısızdı. Son benzersiz sayım tests/summary-95c1.json içindedir; ham başarısız kayıtlar silinmedi. Önceki faz sonucu yeni sonuç olarak kopyalanmadı.
Yeni dört 95C.1 paketi 100 kontrol içerir. Önceden var olan 79 paket de bu fazda çalıştırıldı.

KANITLANAN KÖK NEDENLER
- 7 / 2 toplam müttefik / gerekli AI ortak sayısıydı; uygun aday sayısı değildi. En az 3 toplam üye, yani kurucu + 2 kabul eden AI ortak kuralı korunur.
- Federasyon kapısı ilk engeli gösteriyor; adayın üyelik, bekleme, güven/ilişki, rota ve kabul gerekçeleri saklı kalıyordu. Açık kuruluş paneli canlı kaynak değişimini yenilemiyordu. Yeterli Etkide kanonik motorun yanlış reddettiği yeniden üretilemedi.
- canPact ambargo/parya ticaret kapısına bağlı değildi. UI.aiOffer bütün üreticiler için tam maliyet/teslimat kontrolü yapmıyordu.
- Sabit kaynak miktarı listeleri; mevcut aylık sözlerin kapasiteye katılmaması; Etki teslimatı ile imza ücretinin birlikte rezerve edilmemesi.
- Otomatik takviye ve queueShip araştırma kilitleri çalışıyordu. Ayrı Taht Gemisi yeniden inşası ise 2 zırhlı + 1 kruvazörü araştırmasız yeni oluşturabiliyordu; düzeltildi.
- Filo hedefli çok tersaneli teslimat zaten vardı. Genel ralli açıklaması ve sevkiyat gerekçeleri bunu anlaşılmaz kılıyordu.
- Savaş modu bağlantı çizgilerini kapalı tercihe rağmen açıyordu. Aynı filo rota reddi iki kez yayımlanabiliyordu.
- Üst bar durumları kaynaklarla aynı taşan şeritteydi. Sağ üst absolute yıkım düğmesi bina sayısını kapatıyordu.
- Kalıcı yazma sonucu RAM kopyasıyla birleştiriliyor, gerçek kalıcı hata başarı olabiliyordu.

İYİLEŞTİRMELER
Ortak doğrulama ve ayrıntılı federasyon adayları; yaptırım/ödeme kapısı; manuel ve hazır ticaret miktarı; gerçek teknoloji kapısı; sevkiyatta kaynak/hedef/neden/işlem; üç destek talebi için hedef ve müttefik önizlemesi; bağımsız Savaş hatları; sabit +N durum erişimi; ayrı bina sayacı/yıkımı; net aylık araştırma; olgusal köken metni; dürüst kayıt mesajları.

DEĞİŞEN ÜRETİM DOSYALARI
{', '.join(changed)}.
ai.js, combat.js, audio.js ve manifest.json byte-for-byte aynı. Değişen testler, sürüm kimliği güncellemeleri, yeni kontroller ve kaynak yaması tests/audit-95c1 altında açıklanır.

PERFORMANS
100 sistem / 50 kapalı sevkiyat: tik bütçesi 8'de kaldı. Ek neden araması başarısız rota denemesinde yapılır. Medyan {ms(b['routing']['medianMs'])} → {ms(a['routing']['medianMs'])} ms, P95 {ms(b['routing']['p95Ms'])} → {ms(a['routing']['p95Ms'])} ms. Bu teşhis maliyeti artıştır; gizlenmedi. Değişmeyen 1000 ortak sefer tikinde yeni rota araması 0. Ölçüm Node host'tur; Android FPS değildir.

UYUMLULUK / SINIRLAR
Save v8, deterministik RNG, tek 2B kamera, üç federasyon türü, 95B siyasi izinleri, 95C sefer/ETA/ikmal, sınıf şablonu ve mevcut savaş katkısı / oybirliği paylaşımı korunur. Build 95c1; PWA stars-v95c1. Yeni oyun kütüphanesi veya harici asset yok.
Gerçek Chromium bulunamadı; gerçek tarayıcı DOM/yerleşim kabulü ve fiziksel Android testi yapılamadı. Canvas piksel testi ve mock giriş testleri bunların yerine geçirilmedi.
Özgün oyuncu save'i olmadan yeterli Etki reddinin ve ekrandaki eski gemilerin kesin kökeni açıklanamaz. Bu iki iddia düzeltilmiş motor hatası gibi gösterilmedi.
Uzun dönem 120 aylık yeni 95C.1 kampanya karşılaştırması yapılmadı; önceki ölçümler tarihsel kalır. Bu fazdaki yeni kampanya güveni tam regresyonun AI/ekonomi/sefer/savaş senaryolarıyla sınırlıdır. Bu regresyondan alınan yeni 11/99/404 verilerinin her biri 120 aydır; tohum 11’de 38 devlet-ay enerji sıfır örneği ve gerçek kayıp/tasfiye vardır. Negatif stok bulunmaması sağlıklı ekonomi kanıtı sayılmadı; tablo TEST-SONUCLARI-95C1.md içindedir.

TESLİM
stars-faz95c1.zip. Son ZIP SHA-256 dış teslim mesajındadır; kendi hash'ini ZIP içine yazmak döngü yaratır. RELEASE-MANIFEST.json tüm diğer dosyaların SHA-256'sını içerir. ZIP üretildikten sonra CRC ve manifest doğrulaması ayrıca yapılır.
GitHub'a yükleme yapılmadı. 95D'ye başlanmadı.
''')

rows=['| Sorun | Yeniden üretildi | Kök neden bulundu | Düzeltildi | Test edildi | Açık risk |','|---|---|---|---|---|---|']
for i in issues:rows.append('| '+' | '.join(str(i[k]).replace('|','/') for k in ['issue','reproduced','root','fixed','test','risk'])+' |')
write('OYUNCU-HATALARI-95C1.md','''# Oyuncu hataları — 95C.1

Sekiz oyun ekran görüntüsü (263582–263590 aralığındaki sağlanan dosyalar) ve kullanıcının gözlemleri incelendi. 263581.png önceki sohbetin telefon görüntüsüdür; oyun hatasının kanıtı sayılmadı. Ham ekran görüntüleri oyuna yeni asset olarak eklenmedi.

Başlangıç kontrollü karşılaştırma: `tests/audit-95c1/baseline-probes.json`, özel yeniden inşa kanıtı: `throne-baseline.json`. Aynı iddianın yalnız ekran görüntüsünden kesin teşhis edildiği varsayılmadı. “Motor hatası yeniden üretilemedi” bir başarısızlığı gizlemek değil, kanıt sınırıdır.

'''+ '\n'.join(rows)+'''

Tekrarlayan rota mesajının aynı emirden çıkabildiği kontrollü olarak kanıtlandı; kullanıcının iki mesajının aynı filodan geldiği kesin değildir. Yeni mesaj filo adını taşıdığı için yeni denemede ayrım yapılabilir.

Test verisi düzeltmeleri: eski bildirim kimliği senaryosunda karşılıklı temas yoktu ve oyuncunun elinde 7 araştırma stoku yoktu; geçerli mineral yükümlülüğüyle düzeltildi. Teklif tekrarı stresi, kapalı doktrinli eski aktörü normal diplomatik aktöre dönüştürüyor. Hiçbir kimlik, tekilleştirme veya ret bekleme kontrolü kaldırılmadı. İlk yeni test verilerindeki yanlış bina limiti (Maden 4 varsayımı; gerçek limit 6) düzeltilmiş test verisidir, oyun limiti değiştirilmedi.
''')

write('FEDERASYON-DIPLOMASI-DENETIMI-95C1.md',f'''# Federasyon ve diplomasi — 95C.1

Başlangıçta `7 / 2`, toplam müttefik sayısını kuruluş için gereken iki AI ortak eşiğiyle karşılaştırıyordu. AI'nın kabulü ve adayın bağımsızlığı bu sayaçta yoktu. Gerçek kural üç toplam üyedir. Mevcut üyelik sınırı diye yeni bir üst tavan eklenmedi; 95C kuruluş/kabul kodunda ayrı sayısal üye tavanı bulunmuyor.

`fedFounderCandidate` ve `canFoundFed` üyelik, ayrılış beklemesi (24 ay), karşılıklı temas/ittifak, savaş, uygun kurucu ve AI kabul kararını açık sonuçlarla döndürür. AI kabulü 95B'deki doktrin, güven/ilişki ve bilinen yardım rotası hesabıdır; otomatik “evet” yazılmadı. Adaylar arası savaş engeli korunur. UI ve kuruluş işlemi aynı canlı kapıyı kullanır. Tür değişince uygun aday listesi farklı olabilir; her tür kendi sonucunu gösterir.

Standart kuruluş bedeli 220 Etki, mevcut `council` yetenek kuralı varsa 130. Son yetenek eski destek yoludur; bu faz yeni Konsey Mimarı civic'i eklemez. Maliyet yalnız başarılı kuruluşta kurucudan alınır. Üyelik daveti sonraki oylama ve adayın açık kabulüdür. Askerî türün savunması, diğer iki türün savaş oylamaları ve oyuncunun saldırı onayı değiştirilmedi. Etkisi tam yeterli kurucuyla üç türde gerçek kuruluş geçti; özgün oyuncu kaydındaki yanlış ret yeniden üretilemedi.

`pactAccess` mevcut `tradeBlocked` sahibini kullanır: parya, ikili ambargo ve mevcut kaçakçılık istisnası tek kuralda kalır. Yeni teklif girişinde `dealQuote`, açarken quote, kabulde yeniden quote ve `executeDeal` kapısı vardır. Önceden gönderilmiş teklif sonradan geçersiz olabilir; gerekçe gösterilir. Yaptırım kalkınca normal teklif yeniden mümkündür. Hediye, zorunlu tazminat veya bütün ekonomi akışları baştan tasarlanmadı.

AI ittifak + sensör paketinde kanonik bedel 101 Etkidir: 90 + 45'in %25'i, sonda tek yuvarlama. Gönderen öder; alıcının ödeme sorumluluğu kendi teslimat maddeleridir. 100 Etkili AI bildirim üretemez, 101 ile başarılı imzada yalnız bir kez öder. Etki transferi ve imza bedeli birlikte kontrol edilir. Kaynaklar daha sonra azalırsa eski teklif güvenle reddedilir. Başarısız doğrulama para veya RNG tüketmez; AI'nın mevcut rastgele fırsat sırası yeniden yazılmadı. Erken fatal ret planında eksik effectiveGive alanının güvenle ele alınması için yeni negatif test eklendi.

Kaynak seçimi tek seferlik teslimat ve aylık 10 yıllık ödeme olarak ayrı gösterilir. Manuel pozitif tam sayı, ±10 ve hazır tutarlar vardır. UI stok/geliri yalnız kendisi veya yeterli istihbarat varsa gösterir. Bilinmeyen yabancı stok “bilinmiyor” kalır. Son gerçek quote karar verir; büyük teklif otomatik kabul edilmez. AI'nın mevcut değerleme formülü büyük miktarla doğrusal ve sonlu kaldı.

Eski aylık taşıma kuralı korunur: aylık söz, gelirin iki katını VE 24 aylık stok rezervini birlikte aşarsa reddedilir. Mevcut canlı aylık sözler kapasiteden düşülür; aynı teklifin tek seferlik teslimatları ve Etki imza maliyeti rezerv hesabına katılır. Kontrat 3600 oyun günü sürer. Ödeme tikinde yalnız gerçek stok aktarılır; kaynak yaratılmaz. Sayısal mühendislik tavanı madde / birleşen kaynak başına 1.000.000.000'dur; gerçek stok ve taşıma gücü çoğunlukla daha düşük sınırdır. Bu sınırsız bedelsiz ticaret değildir.

{TOTAL}. Ayrıntı: `TEST-SONUCLARI-95C1.md`, yeni diplomasi paketi ve yedi teklif takip paketi. Eski 95B anayasa, açık üyelik/savaş onayı ve ticaret muhasebesi regresyonları geçti.
''')

write('FILO-SEVKIYAT-DENETIMI-95C1.md',f'''# Filo ve sevkiyat — 95C.1

Otomatik takviyenin araştırılmamış gemi ürettiği yeniden üretilemedi. `shipBuildAccess`, gerçek `queueShip`, otomatik sipariş, tersane aktif kuyruğu ve tamamlanma yolu zaten aynı teknoloji kapısındaydı. Kilitli ödenmiş eski iş korunur, ilerlemez; açık işler arkasında takılmaz. Araştırma açılınca tekrar ödeme olmadan tamamlanır. Mevcut kilitli gövdeler yok edilmez.

Ayrı doğrulanan açık: `rebuildThrone`, `shipBuildAccess` aramadan araştırmasız iki zırhlı ve bir kruvazör oluşturuyordu. Yeni yeniden inşa aynı gövde araştırmalarını gerektirir. Başlangıçta verilmiş Taht Gemisi ve Kuşatma Kırıcı'nın gemileri araştırma açmış sayılmaz; elde kalır. Özgün ekrandaki geminin bu başlangıç yollarından geldiği save olmadan kesin söylenemez.

Şablondaki kilitli sınıf gelecekteki hedef olarak saklanabilir; UI bunu açıkça söylüyor. Mevcut, üretimde/sırada, yolda/bekliyor, eksik ve fazla sınıf bazında ayrı. Başka sınıfla gizli ikame yok. Otomatik rezerv/kapasite veya rota beklemesi açıklanır. Genel üretim ve şablon tercihi birbirine karışmaz.

Çok tersaneli otomatik filo sevkiyatı zaten vardı. Özel `delivery.fleet` genel tersane rallisinden önce gelir. Bu faz yeni hareket motoru, imparatorluk rallisi veya yakıt deposu kurmadı. Her tersaneye ralli vermek gerekmez. Farklı genel rallilerle iki tersanenin doğru gerçek filoya tek teslimi; hareketli ana filo; ücretin yalnız üretimde alınması test edildi.

Yeni tamamlanan sevkiyat kaynak tersane kimliğini ek v8 alanı olarak tutar. Eski tamamlanmış kayıtta kaynak yoksa “Eski kayıtta kaynak belirtilmemiş” denir. Kuyrukta kaynak zaten kuyruk sistemidir. UI ortak `queueDeliveryText` ve `shipmentRow` ile tersane ve filo paneline aynı hedef/durum/işlem bilgisini verir. Üretim sürüyor ile tamamlanmış sevk birbirinden ayrıdır.

Gerçek nedenler: eksik ana filo; askerî geçiş kapanması; hiper-yol/kapı bağlantısı değişmesi; bilinen düşman yüzünden güvenli rota yokluğu; hedefin savaşması/hareketi/ricatı; retry sınırı; otomatik üretimin alaşım rezervi veya kapasitesi. Mevcut harekette ikmal yüzünden olmayan bir duruş uydurulmaz. İlk deneme + 5/10/20 günle en çok dört otomatik deneme korunur. Sonrasında elle yeniden dene, hedef değiştir veya iptal et. İptal gemiyi silmez, geri ödeme üretmez, hareketli bacağı ışınlamaz.

{perf_table}

Teşhis için başarısız denemede ek rota araması var; bu stres ölçümünde medyan maliyet {ms(a['routing']['medianMs']-b['routing']['medianMs'])} ms arttı. Geçerli hareket fiziği aynı; her kare yeni büyük AI taraması eklenmedi. Node ölçümü gerçek mobil FPS veya geniş galakside bütün olası haritaların üst sınırı değildir. Ham örnekler `tests/audit-95c1/performance.json`.

Yeni lojistik paketi 24/0; eski araştırma kilidi, 31 sevkiyat ve 47 şablon kontrolü yeni fazda geçti. Savaş katkısı ve paylaşım kodu bu fazda yeniden yazılmadı; ilgili 92A–92D regresyonları geçti.
''')

write('MOBIL-ARAYUZ-95C1.md','''# Mobil arayüz ve kullanım — 95C.1

Üst bar tek satırdır. Kaynaklar, bilim ve filo kapasitesi yatay kaydırılan iç şeritte; savaş, çatışma, küçültülen olay ve krizler sabit `+N` düğmesindedir. N erişilebilir durum satırı sayısıdır, gemi/cephe sayısı değildir. Açılınca mevcut bildirim/diplomasi akışlarına gider. Kaynak şeridinin kaydırma konumu periyodik yenilemede korunur. Parmağın sürüklediği sırada içerik yeniden kurulmaz; kaydırmadan doğan tıklama engellenir. Harita kamerası bu kaydırmayla değiştirilmez.

Bina adı ve adet ayrı metinlerdir; yıkım artık sayacın üzerinde absolute çarpı değil, ayrı 44px satırdır. Sıradaki adet varsa ayrıca gösterilir ve metin dar alanda sarılabilir. İnşa/yıkım maliyetleri değiştirilmedi. Uzun tam adlar panelde daha fazla dikey alan kullanabilir.

Bilim ekranında üç dalda ve geçmişte `Aylık araştırma: +…` bulunur. Değer ekonomi tarafından hesaplanan `e.inc.ara`dır; kısaltılmaz, iki ondalığa kadar gösterilir ve ham değer başlıktadır. Bilim formülü, üç ağaç ve araştırma kuyruğu korunur. Mobil kısa yükseklikte ek açıklama gizlenebilir; aylık değer gizlenmez. Devlet panelinde mevcut kökenin gerçekten uygulanan başlangıç varlıkları ve sürekli bonus olup olmadığı açıklanır.

Destek talebi kullanımı:

1. Haritada kendi savaş filona veya bilinen bir sisteme dokun.
2. Sağ panelde Ortak askerî koordinasyon bölümünü aç. Diplomasi/federasyon panellerinden de erişilir.
3. Müttefik satırında Filomu destekle, Sistemi ele geçir veya Bölgeyi savun seç.
4. Önizlemede müttefiki, talep türünü ve hedefi kontrol et; Talebi gönder'e dokun.
5. Kabul/ret nedeni, toplanma, bekleme ve görünür filolar aynı bölümde görünür. Etkin kendi talebini iptal edebilirsin.

Hedef değiştirmek için “Haritadan filo / sistem seç” paneli kapatır ve seçim adımını anlatır; haritada seçtikten sonra ilgili sağ panelde talep hazırlarsın. Bu adım kendi filona hareket emri vermez. Müttefik yabancı mülkiyette kalır. Aynı geçerli savaş ve kabul edilmiş siyasi yükümlülük yoksa talep yollanamaz. Gizli filo konumu/gücü/ETA açılmaz. 95C motoru değişmedi.

Harita modundaki Savaşlar devletlerin savaş rengini yönetir. Ayrı Savaş hatları düğmesi yalnız bilinen bağlantı çizgilerini açar/kapatır ve her modda tercihe uyar. Bilinen bağlantı yoksa hayalî çizgi çizilmez. Kayıt sürümü v8, tercih anahtarı `yh_warlinks` korunur. Gerçek Canvas piksel farkı test edildi; bu DOM yerleşim testi değildir.

740×360, 900×420 ve 1536×702 için üretilen HTML/CSS ve host giriş olayları kontrol edildi. Gerçek Chromium çalıştırması, yüklü tarayıcı ikilisi olmadığı için başlayamadı. Fiziksel Android ve gerçek tarayıcı yerleşimi test edilmedi. Kaynak koruma testleri yeni mobil CSS bloğunu ayrı SHA ile kilitler ve istenmeyen değişikliği reddeder; eski bilim/federasyon ve temel UI hash'leri gevşetilmedi.

Manuel Android kabulünde: barı savaş/olay açıkken kaydır, +N listesindeki her eylemi dene, iki dolu bina kartının sayaç/yıkımını kontrol et, klavyeyle 5000 yaz, üç destek talebini gönder/iptal et, iki tersaneden sevki izle, Savaşlar modunda hatları kapat/aç, arka plana gidip kayıt ve geri dönüşü kontrol et. Bu liste yapılmış test gibi sayılmamıştır.
''')

newtests=[r for r in summary['results'] if r['name'].startswith('faz95c1_')]
table='\n'.join('| '+r['name']+' | '+str(r['pass'])+' | '+str(r['fail'])+' |' for r in newtests)
raw=summary['raw_full']
write('TEST-SONUCLARI-95C1.md',f'''# Test sonuçları — 95C.1

Son benzersiz sonuç: **{TOTAL}**, sıfır atlanan paket, sıfır zaman aşımı. Bu fazda alınan sonuçtur. 95C'nin 79/4823 referansı yalnız tarihsel karşılaştırmadır.

| Yeni paket | Geçen | Kalan |
|---|---:|---:|
{table}

100 yeni kontrol ve bu fazda tekrar çalıştırılan 79 eski paket birlikte sayılır. Başlangıç üretim senaryoları `baseline95c` üzerinden çalıştırıldı: parya paktı ve geçersiz AI bildirimi kabulü, çift rota mesajı, RAM başarı dönüşü ve savaş modu tercihi aşımı yeniden üretildi. Otomatik kilitli gövde üretilemedi; özel Taht yeniden inşa yolu ayrıca kanıtlandı.

Çalıştırma sırası: hedefli yeni ve etkilenen testler; tek tam regresyon; yalnız bulunan sorunlar için sınırlı takip. Tam komut: `STARS_TEST_WORKERS=2 STARS_TEST_TIMEOUT_MS=180000 STARS_TEST_LOGS=tests/logs-95c1 node tests/run-all.js`.

İlk tam koşu: {raw['suites']} paket / {raw['pass']} geçen / {raw['fail']} kalan. Üç başarısız paket: bildirim kimliği 6, erken fatal teklif retleri 19, teklif tekrarı stres fikstürü 1. İlk iki eski bildirim fikstüründe gerçek karşılıklı temas ve teslim edilebilir stok yoktu; tekrar stresindeki aktör kapalı doktrinliydi. Bunlar yeni geçerli teklif girişine uyarlandı. Erken fatal planda eksik alanı `.filter` ile okumak geliştirme regresyonuydu; güvenli boş plan ve gerekçe düzeltildi, yeni negatif testle kilitlendi. Bu başarısızlıklar gizlenmedi ve tam koşu tekrar tekrar çalıştırılmadı.

Yedi teklif/işlem takip paketi: 659/0; bildirim, temel anlaşma, effective quote, atomik işlem, strict AI, tekrar beklemesi ve yeni diplomasi paketi. Sonrasında dar sayaçtaki “+sırada” metninin sarılmasına yönelik küçük CSS düzeltmesi için UI/science/üretim sunumu hedefli takipleri yapıldı. Son birleştirme her paket için son geçerli kanıtı kullanır; aynı kontrol ikinci kez toplama eklenmez. Ham `tests/logs-95c1/summary.json`, takip özetleri ve `tests/summary-95c1.json` birbirinden ayrıdır.

Kapsam: üç türde gerçek kuruluş ve ücret, aday reddi/üyeliği/beklemesi; parya ve ambargo/stale pakt; gönderen ödeme ve büyük sözler; gerçek queueShip, tamamlama ve özel Taht; şablon ve çok tersaneli sevk; üç destek talebi ve gizlilik; katkı/oybirliği; savaş katmanı pikselleri; mobil markup/giriş; araştırma net değeri; rota tekrarı; kalıcı backend başarısızlığı; Save v8 ve RNG.

{perf_table}

Ölçüm tek hostta sıralı, 5 ısınma + 20 rota örneğidir. Maliyet artışı yalnız başarısız sevkiyatın gerçek nedeni için ek aramadır. Tekrarlanan 1000 değişmeyen ortak sefer tikinde arama sıfır kaldı. Mock DOM HTML üretimi ve Canvas çizgileri gerçek tarayıcı layout/GPU/FPS değildir. Fiziksel Android kabulü yok.

Yeni 120 aylık 95C.1 önce/sonra kampanya raporu üretilmedi. Tam regresyonun doğal ve kontrollü AI/ekonomi/savaş kampanyaları çalıştırıldı; eski 95C 120 aylık tabloları yeni ölçüm diye sunulmadı. Negatif kaynak, katkı, oybirliği ve RNG kontrolleri ilgili paketlerde geçti; bu bütün uzun dönem dengesini kanıtlamaz.

Sürüm kimlikleri testlerde 95c1 / stars-v95c1 olarak güncellendi; yalnız sürüm beklenen değerleridir, oyun testleri silinmedi. Eski Savaşlar modunun anahtarı aşmasını bekleyen bir çizim assertion'ı yeni bağımsız katman sözleşmesine göre güncellendi ve iki yönde piksel farkıyla desteklendi. UI koruması yeni mobil bloğu ayrıca hash'ler.

Paket kontrolü: başlangıç ZIP hash/CRC/manifest ve GitHub blob eşleşmesi geçti. Teslim ZIP'i üretildikten sonra `tools/verify-release.py`, bütün manifest SHA'ları ve ZIP CRC tekrar doğrulanır. Tam raporlama ve kaynak değişiklikleri `tests/audit-95c1` altındadır.
''')

campaign=json.loads((AUDIT/'regression-campaign-summary.json').read_text())
ct=['| Tohum | Ay | Gerçek sipariş / tamamlanan | Gerçek kayıp / tasfiye | Enerji sıfır örneği | Alaşım sıfır örneği | Negatif stok |','|---|---:|---:|---:|---:|---:|---:|']
for run in campaign['runs']:
    ct.append('| '+str(run['seed'])+' | '+str(run['months'])+' | '+str(run['orders'])+' / '+str(run['completed'])+' | '+str(run['losses'])+' | '+str(run['zeroEnergySamples'])+' | '+str(run['zeroAlloySamples'])+' | '+str(run['negativeResourceSamples'])+' |')
with (ROOT/'TEST-SONUCLARI-95C1.md').open('a',encoding='utf-8') as file:
    file.write('\n## Bu fazın tam regresyonundan alınan yeni kampanya verisi\n\n'+ '\n'.join(ct)+'\n\nBeş AI devletinin 0,5 günlük gerçek hareket/üretim/keşif ve aylık ekonomi tikleriyle 120 ayı. Sıfır stok örnekleri devlet-ay sayımıdır. Kayıp sütunu muharebe/korsan kaybı ile ekonomik tasfiyeyi içerir; yeni yaratılan bedelsiz destek değildir. Bunlar bu fazda üretilen yeni dosyalardır: `tests/audit-95c1/regression-navy-seed-{11,99,404}.json`. Eski `navy-95a-after-*` verileri geri korunmuştur. Bu tablo bağımsız kontrollü federasyon savaşı öncesi/sonrası denge ölçümü değildir. Negatif stok olmaması, sıfır enerji örnekleri ve tasfiyeler varken sağlıklı ekonomi kanıtı sayılmaz.\n')

write('DEVAM-95C1.md',f'''# Devam noktası — 95C.1

Kaynak `stars-faz95c.zip`, SHA-256 `{HASH}`; yayın `{COMMIT}`. Kaynak CRC, 2003 dosyalı manifest ve 11 GitHub üretim blob'u doğrulandı. Yeni sürüm Save v8 / build 95c1 / PWA stars-v95c1. {TOTAL}; benzersiz tek tam koşu + hedefli takip.

Üretim değişiklikleri: {', '.join('`'+x+'`' for x in changed)}. AI strateji ve muharebe kaynakları aynı. Mevcut motorlar yeniden yazılmadı. Ayrıntılı yamayı `tests/audit-95c1/production.patch` ve değişiklik listesini incele.

Yeni: tam nedenli federasyon aday kapısı ve türler; yaptırımla tutarlı pakt; geçerli/ödenebilir AI bildirimi; manuel güvenli miktar; özel Taht yeniden inşa kilidi; sevkiyat kaynak ve gerekçeleri; destek önizlemesi; bağımsız savaş hatları; sabit +N; ayrı bina yıkımı/sayacı; net bilim; köken açıklaması; kalıcı kayıt sonucu; filo bazlı rota uyarısı.

Otomatik takviyenin araştırma atladığı ve yeterli Etkili geçerli kurucunun yanlış reddedildiği yeniden üretilemedi. Bunları çözülmüş motor hatası diye yeniden yazma. Gerçek Taht yeniden inşa açığı düzeltildi; başlangıç gemileri korunur. Kullanıcının save'i gelirse özgün aday/filo nedenini ayrıca incele.

Testler tekrar tekrar çalıştırılmadı. Ham ilk tam koşunun 26 başarısız kontrolü ve sınırlı takipler korunur. Önce `tests/summary-95c1.json`, `TEST-SONUCLARI-95C1.md` ve şikâyet matrisi okunmalı. Yeni tam test gereği yok; yeni değişiklik veya manuel bulgu olursa ilgili paketten başla.

Kalan kabul: gerçek Android / gerçek DOM yok. Chromium ikilisi bulunamadı. Dar yatay ekranda bar kaydırma, bina sayacı/yıkımı, klavye, ortak talep, sevkiyat ve arka plan/kayıt denenmeli. Kaynak yedeği gerçek cihazdan dışa aktarılmalı. Başarısız rota teşhisinin küçük ama ölçülmüş maliyet artışı var; büyük geç oyun cihazda izlenmeli.

Önceki 95A/B/C raporları ve yol haritası korunur. Kapsamlı köken/portre, amblem/isim, haber, konvoy, ekonomi ekranı, müzik veya 95D geliştirmesine başlanmadı. GitHub'a yüklenmedi; yayın için ayrı kullanıcı talimatı beklenir.
''')

risk=f'''# 95C.1 güncel açık riskler — 17 Ekim 2026

- {TOTAL}; sıfır atlanan paket/zaman aşımı. Tek tam regresyonun ham başarısızlıkları ve gerekçeli takipler korunur. Ayrıntı `TEST-SONUCLARI-95C1.md`.
- Gerçek tarayıcı yerleşimi ve fiziksel Android kabulü yapılamadı. Chromium ikilisi bulunamadı. Mock DOM sözleşmesi, kaynak CSS ve native Canvas piksel testi parmak/FPS/ısı/klavye/arka plan dönüşü kabulü değildir.
- Oyuncunun yeterli Etkide engellendiği özgün karar ve ekrandaki kilitli gövdelerin kökeni save olmadan kesin açıklanamaz. Otomatik üretim ihlali yeniden üretilemedi; doğrulanan özel Taht yeniden inşa açığı düzeltildi.
- Taht Gemisi başlangıçta araştırmasız bulunabilir; yeni yeniden inşa gövde araştırması ister. Erken taht kaybında bekleme bunun bilinçli sonucudur; mevcut gemiler silinmez.
- Uzun tam bina adları ve ayrı yıkım satırı daha çok dikey alan kullanır. Dar ekran sayaç sarımı ve +N etkileşimi gerçek cihazda denenmeli.
- Yeni kaynak seçimi gerçek stok/gelir/sözlere bağlıdır; imzada yeniden doğrulanır. AI kaynakları teklifte rezerve edilmez. Mevcut kaçakçılık ticaret istisnası korunur.
- Başarısız sevkiyatın nedenini ayırmak için sınırlı ek rota araması yapılır. 100 sistem/50 kapalı sevk stresinde medyan {ms(b['routing']['medianMs'])} → {ms(a['routing']['medianMs'])} ms; tik bütçesi 8, deneme sayısı en çok 4. Bu Android üst sınırı değildir. Değişmeyen ortak sefer tikinde ek arama yok.
- Eski tamamlanmış sevkiyatta kaynak tersane alanı yoksa bilinmiyor gösterilir; konum uydurulmaz. Rota/tehdit/izin değişince ETA değişebilir; mevcut hareketli hedef motoru korunur.
- Kalıcı backend yazma onayı, tarayıcının ileride veriyi temizlemeyeceğinin garantisi değildir. Kota/engel başarısı yanlış gösterilmez; dosya yedeği önemini korur.
- Yeni regresyonun 11/99/404 koşuları 120 ay sürdü; negatif stok 0, ancak 11’de 38 devlet-ay enerji sıfır örneği vardır. Gerçek kayıp/tasfiye 257/152/89; bunlar otomatik başarı sayılmadı. Bağımsız uzun 95C↔95C.1 federasyon savaşı denge karşılaştırması yapılmadı; eski 95C ölçümleri tarihsel kalır. Doğal ortak savaş sıklığı, başkent rezervi, geç oyun bilgi sınırları ve tohum 99 takibi aşağıda korunur.

GitHub'a yayın yapılmadı. 95D'ye başlanmadı. Aşağıdaki 95C ve önceki sonuçlar kendi sürümlerinin tarihsel kayıtlarıdır.

---

'''
(ROOT/'ACIK-RISKLER.md').write_text(risk+(BASE/'ACIK-RISKLER.md').read_text(),encoding='utf-8')
plan=f'''# 95C.1 sonrası güncel yol haritası — 17 Ekim 2026

95C.1, yeni manuel Android denemesi için kalite adayıdır. Diplomasi/federasyon tutarlılığı, araştırma ve özel üretim kilidi, sevkiyat açıklaması, destek UX'i, mobil temel bilgiler ve kalıcı kayıt düzeltmeleri tamamlandı. {TOTAL}. Save v8, PWA stars-v95c1, tek 2B kamera.

| Sıradaki iş | Durum |
|---|---|
| Manuel Android / gerçek tarayıcı kabulü | Açık: dar yatay bar, +N, klavye, sayaç/yıkım, üç destek talebi, sevkiyat, kayıt/arka plan |
| Oyuncu save'iyle özgün ret/gemi kökeni | Kayıt sağlanırsa aday üyeliği/rota/kabulü ve gövde geçmişi incelenir; mevcut yeniden üretilemeyen iddialar kesin hata diye yazılmaz |
| Uzun dönem kalite | Doğal ortak savaş ve federasyon dengesi; başkent rezervi; rota teşhis maliyeti; tohum 99 ve geç oyun bilgi sınırları |
| 95D | Başlamadı; devlet/federasyon isim-amblem ve Rastgele Amblem kapsamı korunur |
| Sonraki bağımsız işler | Kökenlerin kapsamlı denetimi, portre, Galaktik Haber Ağı, gerçek konvoylar, ekonomi ekranı ve dış dosyasız müzik eski yol haritasında korunur |

GitHub yayını ayrı kullanıcı talimatıyla. 95D'ye geçilmedi. Yeni kamera, federasyon türü veya ekonomi/bilim mimarisi eklenmedi. Aşağıdaki plan ve talepler korunur.

---

'''
(ROOT/'FAZ-PLANI.md').write_text(plan+(BASE/'FAZ-PLANI.md').read_text(),encoding='utf-8')
print('Generated 9 phase documents from fresh 95C.1 evidence:',TOTAL)
