# Faz96C.3 gerçek test sonuçları

## Nihai benzersiz sonuç

- 106 paket / 5502 başarılı / 0 kalan hata. Kanonik105/5478 bu fazda gerçekten çalıştırıldı; yeni1/24 ayrıca. Son kilitli kaynakla tutarlı tam koşu tests/audit96c3/full-locked/summary.json. Atlanan paket yok.
- Gerçek Chromium130/0, page error0. Eski110=43+23+14+13+9+4+4 yeniden yürütüldü, yeni20 eklendi. İsim/faz bazında tekilleştirildi. Aynı başarılı testin tekrarları toplama eklenmedi. browser-final-summary.json nihai birleştirmeyi ve hangi tek senaryonun düzeltme koşusuyla değiştirildiğini içerir.
- 11/99/404, 100 sistem, 12 ay, 6. ay v8 yükleme:36/36 aynı simülasyon hash'i. Dışarıda tutulan alanlar yalnız viewPrefs ve events.minimized görünüm tercihleridir; RNG, kaynak, gerçek konvoy, üretim, AI ve diplomasi dahil kalan tam JSON karşılaştırıldı.
- Bütün üretim dosyaları node --check ve kaynak kilidi; paketleme sonrası temiz arşiv/manifest/CRC ayrıca doğrulanır. Fiziksel Android testi yok.

## Yeni24 kontrol

43haber/0acil; tek teklifin kuyruk+arşivde tek sayımı; iki teklif; sonuç/sona erme; typed küçültme v8; altılı kuyruk koruması; açınca vurgunun kalkması; sıradan kartların elenmesi; aynı anahtarlı güncelleme; radar dışı keşfedilmiş savaş ucu; gizli başkent yerine bilinen alternatif; keşfedilmemiş konumun açılmaması; üçüncü taraf istihbaratı; X tercihinin v8'de savaş kaydını silmeden kalması; yeni muharebe; gizli/aktif rapor; bozuk tercih temizliği; ham HTML/fonksiyonun kayda girmemesi; üst barın gözlemci kalması; gerçek kargo denklikleri; build/cache/v8; çözülmüş olayın yeniden kaydedilmemesi/ikinci ödeme; eski dünya closure'ının işlememesi; uyarıya düğme enjekte edilmemesi.

## İlk başarısızlıklar ve kök nedenler

Bütün ilk loglar audit96c3 içinde korunur. Bitmemiş/başarısız koşu nihai başarı sayılmadı.

| Koşu | İlk sonuç / neden | Son doğrulama |
|---|---|---|
|Kanonik gerçek tarayıcı probu|Sözleşme outMap ve rotate içinde;43haber +1;bilinen savaş ve görülen harita noktası varken canlı radar şartı çizgiyi0 yapıyor|Nihai DOM/Canvas karşılaştırması|
|target-first|18/3; test yardımcısının undefined için varsayılan true kullanması ve JSON anahtar sırası eşitliği|Yardımcı doğrulama düzeltildi; son24/0|
|browser-first|12/7; testte olmayan endWar/sign isimleri ve küçültme düğmesi bulunmayan bilgi uyarısı seçilmişti|Gerçek makePeace, gerçek executeDeal ve gerçek katalog event'i kullanıldı|
|browser-corrected|16/3; context.emulateMedia yerine page.emulateMedia gerekir|Gerçek media sorgusu/stil beklenir|
|Ara browser-final|19/1; yönlendirmeden Ekonomi düğmesi kaldırılırken eski test hâlâ varlığını bekliyordu|Düğmesiz yönlendirme, oyun arayüzü menüden açılır|
|İlk tam koşu|106paket/5494geçen/8kalan;6eski CSS hash beklentisi,1eski build,1radar şartını koruyan eski kabul|Yeni CSS ayrı exact hash ile pinlendi; eski CSS/HTML pinleri korunur. Yeni keşfedilmiş uç davranışı açık kabul testi; gizlilik kontrolleri kaldırılmadı. Kaynak değişen ara koşu nihai sayılmadı.|
|Eski Chromium uyarlaması|96A portre testinde gerçek viewport yataya dönüp ölçü etiketi dikey kalmıştı;96C/C1/C2 yardımcılarında tek satır if/else sözdizimi hatası vardı|Kaynak oyunu değiştirmeden test yordamı düzeltildi; başarısız portre senaryosu1/0 ve çalışmamış9+4+4 senaryo yeniden yürütüldü|
|Kilitli yeni Chromium|19/1; son1280 küçültme kontrolünde emüle reduced-motion/stil henüz uygulanmamıştı|Tercih başlangıcı ve gerçek matchMedia/computedStyle beklenir; yalnız etkilenen senaryo1/0. Üretim CSS'i gevşetilmedi.|

Ayrıca kanonik kaynakta çözülmüş event'in kayda yeniden girmesi doğrudan yeniden üretildi; işaretçi/tek karar doğrulaması eklendi. Son kullanıcı akışı gerçek DOM seçimiyle de doğrulandı.

## Test kaynaklarındaki bilinçli uyarlamalar

Build/cache beklentileri96c3. Kapsamı belirli yeni CSS bloğunun hash'i pinlendi, önceki blokların ve eski HTML'in koruma hash'leri gevşetilmedi. Savaş ucu testi artık mevcut siyasi haritada görülen keşfedilmiş noktayı radar olmadan kabul eder; bilinmeyen nokta/ilişki testleri kalır. Eski UI'nın byte-for-byte aynı olduğunu isteyen testten yalnız bu fazda bilerek değişen UI dosyaları çıkarıldı; ticaret/üretim/ledger/construction byte denetimi kaldı.

## Tekrar çalıştırma

node tests/run-all.js. Gerçek tarayıcı: STARS_CHROMIUM_PATH=/absolute/chromium node tests/run-browser96c3-regression.js. Tarihsel UI helper'ları güncel menüden tıklayıp gerektiğinde viewport'u geri döndürür. Eski karşılaştırma testleri kardeş baseline-96a/b/c/c1 ve canonical96c2 dizinlerini ilgili doğrulanmış ZIP'lerden ister; eksik bağımlılık oyun hatası değildir. Host Node/Playwright/@napi-rs/canvas ve gerçek Chromium gerektirir; oyuncunun oyunu açması bu test bağımlılıklarını gerektirmez.
