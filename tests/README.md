# STARS testleri — 86D

Oyunun kendisi harici JavaScript paketi gerektirmez. Aşağıdaki bağımlılık yalnızca gerçek Canvas piksellerini sınayan geliştirme testleri içindir.

Proje kökünden:

```sh
npm install --prefix tests
node tests/run-all.js
```

`@napi-rs/canvas` sürümü `tests/package.json` içinde 0.1.100 olarak sabitlenmiştir. Paket desteklenen işletim sistemi/mimari için yerel Skia bileşenini kurar. Bağımlılık bulunamazsa Canvas testi başarısız olur; sessizce sahte çizime geçmez.

86C.5 tabanı: **27 paket, 2822 geçen, 0 kalan** (`results-86c5.json`). 86C.5.1 ayrıca 48 iddialı portre/menü paketini içerir. Güncel toplam `results-86c5-1.json` dosyasındadır. Paket yöneticisiyle bağımlılık indirme bu teslim ortamında çalıştırılmadı; ortamda kurulu aynı sürüm kullanıldı.

## Test katmanları

- Eski regresyonlar ve yeni tanı testleri: Node + sahte DOM/olay ortamı.
- `faz86c_5_native_canvas_test.js`: üretim `View.draw` / `View.tap` fonksiyonları, gerçek oyuncu kaydı, gerçek Skia Canvas 2D piksel tamponu. DOM ve olay zamanlaması hâlâ test ortamına aittir.
- `faz86c_5_1_ui_portraits_native_canvas_test.js`: gerçek lider işe alma/atama ve panel HTML'inden üretilen portre tuvalleri, gerçek Skia pikselleri. Menü ölçüleri kontrollü geometri girdileridir; CSS tarayıcıda render edilmiş değildir. Beş viewport, iki menü ve görünür alan değişimi sınanır.
- Gerçek Chrome, tarayıcı compositor/GPU davranışı ve fiziksel Android bu sonuçlarla doğrulanmış değildir.

Yalnız sahte ortam testleri gerektiğinde:

```sh
node tests/run-all.js --mock-only
```

Bu seçenek yerel Canvas paketini atlar; çıktı bunu `SKIPPED (not verified)` olarak gösterir. Tam kabul sonucu yerine kullanılamaz.

## Gerçek kayıt ve çıktı yolları

Varsayılan kayıt ZIP'e dahildir: `tests/fixtures/stars-2210-06.sav.json`. Testler bu dosyayı değiştirmez. SHA-256:

`fe2df0b6adc09bfe0148f36c5c96869ffef86ceeaa4cf7eb609f3997bc2c1245`

Başka kayıt ve günlük dizini için:

```sh
STARS_SAVE=/absolute/path/game.sav.json STARS_TEST_LOGS=/absolute/path/test-logs node tests/run-all.js
```

Başka bir kayıtla çalıştırıldığında, bu oyuncu kaydının 6881 dünya boyutuna ilişkin özel beklentiler farklı çıkabilir. Varsayılan regresyon kaydı yukarıdaki SHA ile tanımlıdır.

Yerel çizim örneğini yeniden üretmek için:

```sh
STARS_ARTIFACTS=/absolute/path/evidence node tests/faz86c_5_native_canvas_test.js
```

Üretilen `map-native-dpr2.png` tarayıcı ekran görüntüsü değildir. Fontlar ve sayfa yerleşimi cihazla aynı olmak zorunda değildir.

Portre testindeki görüntüyü almak için aynı `STARS_ARTIFACTS` değişkeniyle `node tests/faz86c_5_1_ui_portraits_native_canvas_test.js` çalıştırılır. `governor-native.png` test valisinin portresidir; harici oyun varlığı değildir.

Önceki sürümü aynı hedefli testle karşılaştırmak için isteğe bağlı `STARS_UI_ROOT=/absolute/path/old-source` kullanılabilir. Eski sürümde yeni hata beklentilerinin başarısız olması beklenir; bu mod kabul testi yerine geçmez.

## Eski testlerdeki uyarlamalar

R3 testinin sabit sunucu kayıt yolu, ZIP içindeki gerçek kaydı kullanacak şekilde taşınabilir hâle getirildi. R4 testleri de aynı varsayılanı kullanır; `STARS_SAVE` korunur. Sürüm/cache beklentileri yeni sürüm adına güncellendi. Davranış iddiaları silinmedi veya gevşetilmedi. Kurtarma başına en fazla altı piksel okuma iddiası aynen korunmaktadır.


## 86C.6 transaction kabulü

`node tests/faz86c_6_transaction_acceptance_test.js`: 529 iddia. 14 madde türü hem give hem want tarafında, sekiz hata noktasında sınanır. Beklenen durum üretim snapshot'ından alınmaz: bütün G nesne grafiği ve özgün nesne bağlantıları bağımsız karşılaştırılır. Son koloni/filo temizliği, bağımsızlık ve vekil savaş, federasyon/senyör/Konsey zinciri, gerçek RNG tüketimi ve commit sonrası audio/UI hata matrisi dahildir.

`node tests/transaction-probe.js /path/to/source`: eski ve yeni kodda aynı basit doğruluk problemlerini ve 100 sistem/63 filolu kayıtla transaction süresini ölçer. Önce/sonra ölçümleri `transaction-once.json` ve `transaction-sonra.json` içinde saklanır. Süreler Node içindir; Android performans sonucu değildir.

86C.6 tam test sonucu `results-86c6.json` içindedir. Kapsam açıklaması kökteki `TRANSACTION-KAPSAMI.md` dosyasındadır.

Bu fazda eski testlerin build/cache beklentileri ve iki kaldırılan yardımcı fonksiyonun mimari isimleri güncellendi. Diplomacy değiştiği için eski korunan-dosya kontrolü, bu fazda değişmeyen map.js'in kaynak SHA'sını denetler. Yalnız referans varlığını kontrol eden yedi eski iddia, map.js için gerçek hash karşılaştırmasına güçlendirildi. Atomiklik yorumunu olumlayan eski iddia, gerçek mods nesnesinin geri bağlanmasını ölçer. Oyun davranışı iddiaları silinmedi veya toleransları gevşetilmedi.

## 86D elçi görevleri

`node tests/faz86d_envoy_missions_test.js`: 58 senaryo. Gerçek eski kayıt
üzerinden boolean göçü, v8 roundtrip, kapasite, hedef/doğrulama kapıları,
aktif ay ve 12/36 eşikleri, savaş/temas/doktrin duraklaması, gerçek
`monthTick`/`spyTick`, görev kapsamı ve ağırlıklı AI faydası, gerçek UI
eylemleri, AI görev seçimi ve transaction rollback. UI HTML/eylem
kontrolüdür; mobil CSS render veya cihaz kabulü değildir. Test başına
birden fazla assert bulunabilir; bildirilen 58 sayısı senaryo sayısıdır.

`node tests/envoy-probe.js /path/to/source` aynı kayıtta gerçek savaş
istihbaratını önce/sonra ölçer. Sonuçlar `envoy-once.json` ve
`envoy-sonra.json` içinde. Bu ölçümde casuslar kapalı, hedef sensörü 0,
iki taraf normal doktrinlidir; mevcut temas katkısı .28, eski elçi
sızıntısı .35'tir.

86D tarihsel tam test sonucu `results-86d.json`, üretim dosyalarının önce/sonra
hash'leri `sha-86d.json` dosyasındadır. Build/cache beklentileri 86D'ye
geçti. AI bu fazda değiştiği için AI koruma kontrolleri, bu fazda
korunan index.html'in kaynak SHA karşılaştırmasına taşındı. Eski nötr
elçi iddiası aynı elçisiz fixture'ı ölçmeye devam eder; etiketi düzeltildi.
Oyun davranışı iddiaları silinmedi veya toleransları gevşetilmedi.


## 86E diplomasi merkezi

`node tests/faz86e_diplomacy_center_test.js`: 45 senaryo. Gerçek UI
navigasyonu, dört filtre, elçi/vasal/antlaşma özeti, devlet başına taslak ve
karşı teklif, yükleme/temas kaybı sonrası eski eylemler, bilgi seviyeleri,
seçici gecikmeleri ve gerçek AI kabul/ret/karşı yolları. Kontrollü DOM
scroll olayı konum yönetimini sınar; gerçek tarayıcı yerleşimi değildir.
CSS tema/erişilebilir ebat kuralları statik kontrol edilir. Test başına
birden fazla assert vardır; 45, senaryo sayısıdır.

Güncel tam sonuç `results-86e.json`; üretim SHA karşılaştırmaları
`sha-86e.json`. Kaynak 86D'dir. 86D'nin iki UI testi, artık elçi düğmesinin
bulunduğu ilişki sayfasını gerçek seçim eylemiyle açar; görev/kıdem/durum
beklentileri korunur. Build/cache 86E oldu. index.html değiştiği için eski
korunan-dosya kontrolleri bu fazda değişmeyen ai.js'in kaynak SHA'sına
bağlandı. Sayı veya tolerans gevşetilmedi, test silinmedi. Eski tarihsel
rapor/sonuç JSON'ları kendi fazlarına aittir.


## 86F AI karşı teklifleri

Güncel tam sonuç: `results-86f.json`, 32 paket / 3527 geçen / 0 kalan.
Yeni `faz86f_ai_balance_test.js`: 25 senaryo (senaryo içinde birden fazla
assert olabilir). Bütçe, gerçek karşı teklif seçimi, kontrollü teknoloji
karşılığı, saflık, üç seed × 360 ay, tek saat, deterministik kayıt ve
ölçümün dünya/RNG akışını değiştirmemesi sınanır.

Ölçüm komutları ve yöntem sınırları `../AI-PAZARLIK-DENGESI.md` içinde.
`balance-before.json` kaynak 86E, `balance-after.json` 86F'dir. İkisi de
aynı yeni aracı kullanır. Test fixture'ı 7 AI / 21 AI–AI çift açar; oyuncu
ve günlük keşif/muharebe dahil değildir. Süreler ölçüm yükünü içerir.

Eski 86C.3 ve 86C.4 aylık döngüleri memAge'i üretim memTick dışında bir
kez daha artırıyordu. Fazladan artış kaldırıldı; üretim saatine dokunulmadı.
86C.4 bütçe testi gerçek aiCounterBudget sonucuna bağlandı, %60 korunur.
Build/cache beklentileri 86F oldu. Korunan dosya kontrollerinde değişen
ai.js yerine değişmeyen index.html kaynak hash'i kullanılır. Hiçbir test
silinmedi veya davranış toleransı gevşetilmedi. Tarihsel rapor/JSON'lar
kendi sürümlerine aittir. Üretim hash karşılaştırması `sha-86f.json`.

## 86G bütünleşik devir kontrolü

`node tests/faz86g_integration_handoff_test.js`: 16 senaryo. Başarılı ve
başarısız savaş başlangıcı, oyuncunun Konsey yasağı ihlali, NAP/pakt/ittifak
kapanışı, eski v8 kayıt göçü, tek yönlü ve süresi dolmuş alan, UI etiketi,
barış sonrası yeni NAP, warOn rollback/commit, PWA kabuğu, v8, gerçek kayıt,
86F bütçesi ve bağımsız Radar/Lojistik korunumu sınanır.

Güncel tam sonuç `results-86g.json`; üretim SHA karşılaştırması
`sha-86g.json`. Build/cache beklentileri 86G'ye geçirildi. Kaynak koruma
kontrolleri değişmeyen dosyalarda devam eder. Gerçek Android/tarayıcı kabulü
değildir; cihaz kontrolleri `../CIHAZ-TEST-BIRIKIMI.md` içindedir.
