# Faz 96A — yeni koşuların test raporu

## Sonuç ve sayım

- 96 benzersiz Node/VM/yerel Canvas test paketi, **5303 geçti /0 kaldı**, atlanan paket yok.
- Eski 94 paket bu fazda yeniden çalıştırıldı: 5255 kontrol. Önceki 95E.3 raporundaki 5203 sabiti yeni sonuç diye eklenmedi; yeni iki modül eski kaynak yükleme/sözdizimi denetimlerine de girer.
- Yeni `faz96a_cargo_test.js`: 36/0; yeni `faz96a_integrity_test.js`: 12/0. Her kontrol bir senaryo; içindeki assertion sayısı ayrıca şişirilmez.
- Gerçek Chromium 133.0.6943.0: **80/0**, sayfa hatası yok. 14 yeni, yeniden koşulan 43(95E.2)+23(95E.3). Üç boyut 740×360,360×740,1280×720.
- 6 resmî 120 aylık 100 sistem karşılaştırması (3 eski+3 son 96A): negatif/NaN stok yok, kargo denklik hatası yok,60. ay yükleme başarılı. Kampanyalar test kontrol sayısına eklenmedi.

Bu rakamlar **tek kesintisiz temiz run-all koşusu** iddiası değildir: ilk tam 95 paket koşusu ve kök neden sonrası yalnız ilgili paketlerin son başarılı koşuları, sonradan eklenen ikinci paketle birleştirildi. Benzersiz isim bazında son tamamlanmış sonuç alınır; tekrarlar toplanmaz. Makine özeti:`tests/audit-96a/final-summary.json`; her satır kendi gerçek logunu gösterir. Tüm 96 paket adının dosya kümesine eşitliği doğrulanır.

## İlk başarısızlıklar ve düzeltilmiş koşular

| Deneme | Gerçek sonuç / neden | Düzeltme ve son delil |
|---|---|---|
| Başlangıç ticaret/diplomasi |32/0 ve 28/0; üretim değişmeden |`trade-baseline.log`, `diplomacy-baseline.log` |
| İlk tam regresyon |95 pakette 5207 geçti/85 kaldı. Eski özel VM'ler yeniCommerce modülünü yüklemiyordu; kaynak sıra/harita kilidi inline denemeyi reddetti; eski 14 tür matrisine eksik limanlı freight girdi. |Özel VM yükleme listelerine modüller eklendi; harita çekirdeği korunup sarmalayıcı kullanıldı. Eski 14 tür matrisi korundu, freight ayrı gerçek veriyle 48 yeni kontrolde sınandı. `full/summary.json` ve ilk loglar silinmedi. |
| Takip regresyonu |Tek kalan tap kaynak metni kontrolü, sarmalayıcıda özgün `screenPos` parametresi görünmüyordu. |Parametre korunarak gerçek pointer yolu tutuldu. `tap-flushed-final.log`: 110/0. Eski kaynak hashleri yeniden pinlenmedi. |
| Eski ticaret bekleyişi |Eski 3 kontrol anlık soyut kredi bekliyordu. |Yeni sözleşme modelinde varış öncesi kredi yok beklentisine güncellendi; gerçek varış yeni testlerde. `trade-final.log`: 32/0. |
| İlk Chromium girişimi |Çalıştırılabilir Chromium bulunamadı; senaryo çalışmadı. |Mevcut runtime arşivinden tekrar çıkarıldı. `browser-first.log` tutuldu. |
| İkinci yeni Chromium |6 geçti/8 kaldı. Freight gelen kutusu codec'i `source/every/months` alanlarını düşürüyordu; eski dekoratif kare çizimi t verilmediğinde hataya düşüyordu; test gerçek kaynak adı Mineral yerine Maden arıyordu; portre rotate örtüsü girişi engelliyordu. |Codec/signature alanları korundu; sahte trafik kaldırılıp gerçek konvoy çizildi; beklenti kanonik RES adıyla düzeltildi; rotate örtüsüne gerçek ticaret giriş düğmesi eklendi. `browser-second.log` ilk hataları korur. |
| Son tarayıcı başlatma |Geçici `/tmp/chromium` tekrar yoktu, koşu başlamadı. |Workspace altına yeniden çıkarıldı, açık `STARS_CHROMIUM_PATH` ile koşuldu. `browser-final.log` çevre hatasını; `browser-final-retry.log`14/0 sonucu korur. |

Bazı testlerin doğrudan `process.exit()` çağrısı yönlendirilmiş çıktıyı kesiyordu. Son tap ve zincir koşusunda `process.exit=c=>{process.exitCode=c}` kullanılarak log tamamlandı; kontrol semantiği değiştirilmedi. Sonuçlar 110/0 ve 185/0. İlk eksik loglar durur. Gerekçesiz sonsuz tekrar yapılmadı.

## Yeni hedefli kapsam

1. Tek açık rota,1/2/3 kenar gerçek mesafe/süre; 4 kenar reddi; alternatif yol ve bilinmeyen transit gizliliği.
2. Mevcut motorda karşılıklı kaynak/enerji sözleşmesi, atomik iki yön yükleme, stok yetmezliği, negatif/sıfır/NaN/aşırı miktar, Bilim/Etki yasağı, geçersiz liman ve süre.
3. İmza sırasında kredi yok; depo→kargo→fizikselvarış→alıcı. Erken finish reddi; aynı makbuz tekrarında kredi yok; soyuttradeFlow ve teorikyield para üretmez.
4. Toplam taahhüt ve 30 gün yükleme kapasitesi; 256 aktif nesne sınırında stok kesmeden bekleme.
5. Gerçek korsan filosu, gerçek %40% ganimet, kalan imha, hafif saldırı gecikmesi, aynı filo tekrar yasağı, iki yönün kısmi ve bağımsız sonucu, kargo toplam denklemi.
6. Savaş, ambargo/kaçakçılık, aktif muharebe ablukası, pakt bitişi, liman el değiştirmesi/ortak sistem, devlet yok olması, iptal/süre bitimi, 180 gün engel zaman aşımı.
7. Yolda/varış öncesi/varış sonrası/imha kayıtları, eski köksüzv 8, tekrar yükleme, bozukid/mass reddi, pending inbox freight codec/signature, aynı tohumda deterministik ids/position/receipt.
8. AI mevcut anlaşma motoruyla gerçek yük çıkarır; kare çiziminde arama yapılmaz, anahtar kapalıyken konvoy dizisine erişilmez.

## Gerçek Chromium ve Canvas

`browser-final/summary.json`14 yeni senaryoyu isimleriyle listeler. Gerçek düğme tıklamalarıyla form imza/reddetme, inbox kabul/çift işlem, iptal ve konvoy anahtarı; gerçek pointer ile hareketli konvoy seçimi ve kamera; önce/sonra Canvas piksel farkı; tüm üç viewportta panel sınırları ve scroll; yoldaki Save v 8 konum/katman; yabancı yük gizliliği; kayıp UI ve offline PWA freight modülleri doğrulandı.

`browser-regression-95e2/summary.json`43 eski senaryonun, `browser-regression-95e3/summary.json`23 eski senaryonun **bu kaynakla yeni koşularıdır**. Son onay savaştekbedel/çifttık/eski pencere/değişenşart; gerçek tek yönlü sensörler; federasyon/ittifak pikselzoom ve gizlilik gibi 95E.3 senaryoları da geçti. Galaktikhaber, gelenkutusu, karşıteklif, uzaktan inşaat, rastgeleolay, gemikilitleri, bilim keşfi, askerî koordinasyon ve eski kayıt sistemleri 96 paketlik regresyondadır.

360×740'da ticaret girişi/paneli gerçek tıklanıp kaydırılır. Haritaya dönüşte önceki döndürme tavsiyesi görünür; tam portre harita oynanışı eklenmedi. Fiziksel Android, kurulu işletimsistemiPWA ve gerçek dokunmatik cihaz testi yapılmadı. MobilChromium emülasyonu ayrı tutulur. Ekran görüntüleri çalışma içi incelendi, yeni screenshot dosyası teslim paketine eklenmedi.

## AI sonuçları ve performans sınırı

| Tohum | Sürüm | Enerji stoku (120. ay) | Tüketim malı | Askerî güç | Enerji sıfır devlet-ay | Mal sıfır / kıtlık | Sözleşme / teslimat / kayıp |
|---|---|---:|---:|---:|---:|---:|---|
| 11 | 95e3 | 69 416.7 | 12 938.0 | 34619 | 0 | 0 / 0 | Soyut model; fiziksel kargo yok |
| 11 | 96a | 49 276.3 | 15 853.1 | 37472 | 0 | 0 / 0 | 0 / 0 / 0.0 |
| 99 | 95e3 | 118 822.8 | 13 578.5 | 31056 | 53 | 10 / 10 | Soyut model; fiziksel kargo yok |
| 99 | 96a | 77 840.3 | 15 003.7 | 46120 | 33 | 0 / 0 | 0 / 0 / 0.0 |
| 404 | 95e3 | 264 644.4 | 15 880.6 | 50070 | 18 | 50 / 50 | Soyut model; fiziksel kargo yok |
| 404 | 96a | 99 603.6 | 19 927.6 | 39522 | 0 | 0 / 0 | 3 / 18 / 0.0 |


Ayrıntılı aylık ham ölçümler:`campaign/{95e3,96a}-{11,99,404}.json`; birleşik tablo:`campaign-comparison.json`. Son 96A kaynağı dosya SHA'larıyla doğrulanır. `ledgerErrors` ve `negative` dizileri boş. 404'te 18 teslimat vardır; 11/99'da 0 kontrat bulunur. Enerji ve askerî güçteki olumsuz stok farkları teslim raporunda açıklanır. Kıtlık düşüşü kargoya nedensel olarak bağlanamaz; ücretsiz ticaret üretildiği anlamına gelmez.

Sunucu ortamında toplam 120 ay süreleri (ms),95E.3→96A: 11 26797→34123; 99 30509→39074; 404 28296→23939. AI kararları/filo sayıları farklı olduğundan bunlar sabit iş yükü mikrobenchmarkı veya Android FPS ölçümü değildir; 11/99 süre artışı gizlenmez. Yeni sistemin her karede yol aramadığı, kapalı katmanda cargo okumadığı ve aktif nesne/arama/çizim sınırları hedefli doğrulandı. Büyük doğal galaksilerde fiziksel cihaz performans kabulü açık.

## Yeniden çalıştırma

Repo kökünden, Node ve Playwright/Chromium ile (bağımlılıklar teslim ZIP'ine gömülmez):

```sh
node tests/faz96a_cargo_test.js
node tests/faz96a_integrity_test.js
STARS_TEST_LOGS=/tmp/stars96a-regression node tests/run-all.js
STARS_CHROMIUM_PATH=/absolute/path/chromium node tests/browser-96a.js
STARS_BASELINE_ROOT=/absolute/path/95e3 node tests/run-commerce-96a.js
python tools/package-96a.py
```

Baseline kampanyası için `STARS_BASELINE_ROOT` değerini salt okunur 95E.3 checkout konumuna ayarla; veya `measure-commerce-96a.js ROOT SEED OUTPUT` çağır. Tarayıcı geçmiş regresyonlarında da `STARS_CHROMIUM_PATH` kullanılır. `finalize-96a-evidence.py` birleştirilmiş logların isimlerini doğrular; eski navy çıktısı 96A kanıt klasöründe korunur. Manifest/hash/CRC son durumları dış teslim mesajı ve paketleme çıktısında raporlanır.
