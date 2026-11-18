# STARS — p42 Multiplayer Saha Doğrulaması Developer Report

18 Kasım 2026

**p42’de tamamen eski p40 sayfası 30 saniye sonra yeniden bağlantı açıyordu.** Yerel Chromium’da davet ve elle kod yollarında doğrulandı. p43, sürüm reddini eski istemcinin tanıdığı biçimde bitiriyor ve görünür güncelleme uyarısını koruyor.

**Misafir haritasının kapalı pencereyle kalıcı durması 15 dakikalık yerel p42 koşusunda görülmedi.** Koşu iki yan kontrolden kaldı. Açık pencere uyarısı bir örnekte gözlenmedi. Harita denetiminde eski referans bir misafirin anlık yetkili görüşünü eksik saydı.

## Kaynak ve ortam

| Alan | Değer |
|---|---|
| Taban | PR #58 · `codex/stars-mp-pwa-surum0` |
| Doğrulanmış başlangıç HEAD | `ad7cf06c49ce6753a23e46f6185df100da84ffb1` |
| Başlangıç sürümü | `96h10p42 / MP.8.9b41` |
| p40 kontrol HEAD | `d91fb07978b951f90cd92692166b06d9f972bb05` |
| Aday ve Render test dalı | `codex/stars-mp-p42-saha0` |
| Aday | `96h10p43 / MP.8.9b42` · `stars-v96h10p43` |
| Yerel tarayıcı | Chrome for Testing Headless Shell `146.0.7680.66` · yatay dokunmatik görünüm · ayrı kalıcı Chromium profilleri |
| Canlı Render `/mp/version` | `96h10p33 / MP.8.9b30` · sürüm sorgusu yapıldı, p42/p43 oynanışı **NOT RUN** |
| Fiziksel Android, gerçek internet ve LAN oynanışı | **NOT RUN** |

`AGENTS.md`, devir belgeleri ve p42 sonuç raporu okundu. PR #58’in uzak dal ucu verilen SHA ile eşleşti. Standart Chromium `socket() EPERM` ile durdu. Headless Shell yerel relay’e gerçek HTTP/WebSocket üzerinden bağlandı. I, J ve O senaryoları üretim relay süreci ve TLS vekili üzerinden koştu. [PR #58](https://github.com/sarsiss12-dot/Star/pull/58) · [p42 raporu](MP-PWA-SURUM0-SONUC.md) · [Render sürüm yanıtı](https://stars-zhdu.onrender.com/mp/version)

## Eski PWA ve yeni odaya dönüş

Gerçek p40’ta normal kurulumla oda ve misafir devleti açıldı. Service worker kontrolü, CacheStorage’daki p40 `main.js` ve MP katılım betiği doğrulandı. Misafir tersane düğmesinden ilk korveti verdi. Host oyunu kaydetti ve kapandı. Yeni relay’de aynı profil ve aynı kayıtla yeni oda kuruldu. Test vekili eski sayfaları p40’ın kendi çıktısından hazırladı. Açık eski sayfalar bellekteyken aynı adres yeni relay’e geçirildi. Önbellek doluyken HTTP’yi keserek yapılan soğuk gezinme probu `ERR_EMPTY_RESPONSE` verdi. Başarılı tarayıcı kabulünde p40 oynanış sayfaları güncelleme anından önce açık ve p40 worker denetimindeydi.

| Vaka | Önce p42 | Sonra p43 |
|---|---|---|
| Tam p40 sayfası, davet | Uyarı kaldı. ~34,2 sn sonunda 2 WebSocket, ikincisi açık, devlet atanmadı | Uyarı kaldı. ~34 sn sonunda 1 WebSocket, soket kapalı, devlet atanmadı |
| Tam p40 sayfası, elle kod | Uyarı kaldı. ~33,9 sn sonunda 2 WebSocket, ikincisi açık, devlet atanmadı | Uyarı kaldı. ~34 sn sonunda 1 WebSocket, soket kapalı, devlet atanmadı |
| Eski sayfadan yenileme | Davet `code` parametresini taşır, yenileme sonrası KATIL. Elle kodda yenileme sonrası kod tekrar girilir. Her iki yol aynı kayıt ve devlete döndü | Her iki yol aynı kayıt ve devlete döndü |
| Tek eski `main.js` | Gerçek Chromium SRI reddi ve güncelleme ekranı. Çevrimdışı deneme açıklama verdi. Tekrarla aynı kayıt ve devlet | **PASS** · Chromium eski yanıtı engelledi. Çevrimdışı güncelleme açıklaması ve tekrar deneme çalıştı. Davet parametreleri, aynı kayıt ve devlet korundu. |
| İlk yeni korvet | Host `ok` 237 ms. Host kuyruğu 1→2. Misafir tersanesi 1→2, 633 ms. 32 alaşım bir kez | **PASS** · Host `ok` 218 ms. Host kuyruğu 1→2. Misafir tersanesi 1→2, 497 ms. 32 alaşım bir kez. |
| Aynı sürüm ve yeniden bağlantı | Taze Chromium profilleri I0/J0’da katıldı. Zorla kesilen soket yeni soketle aynı kayda/devlete döndü | **PASS** · I0 yeni profillerle, normal yeniden bağlantı da yeni soket ve aynı kayıt/devletle doğrulandı. |

`relay.js` içindeki `upgrade0`, p42’de sürüm etiketi bulunmayan istemciyi odaya almadan uyarıyor ve 30 saniye sonra `4010` ile kapatıyordu. p40 `join.js` içindeki `onclose`, bu kodu terminal kabul etmediği için tekrar deniyordu. p43 eski istemciye katılımı bitiren tanıdık kontrol çerçevesini ve görünür uyarıyı gönderip soketi kapatıyor. Host’a iletilen istemci çerçevesi sıfır. Güncel damga uyuşmazlığı `4010` ile reddediliyor. `release-guard.js` içindeki `update()` güncel sürümü alıyor ve mevcut daveti koruyor. Başarılı yeniden katılımda eski emir kendiliğinden çalışmadı. [Tarayıcı testi](../../tests/browser-mp-pwa-resume.cjs) · [p42 kanıtı](../../tests/evidence/mp-p42-saha0/p42-pwa-browser.json) · [p43 kanıtı](../../tests/evidence/mp-p42-saha0/p43-pwa-browser.json) · [SRI uyarısının ekran görüntüsü](../../tests/evidence/mp-p42-saha0/p43-mixed-warning.png)

## P0 — Uzun oturumda misafir haritası

p42 I senaryosu 500 sistem, 16 AI ve host ile iki misafir üzerinde 15 dakika çalıştı. Oyun gerçek döngüsünde gün 362,6’dan 1139,8’e ilerledi. 592 örnekte 20 saniyeyi aşan kapalı pencere durması kaydedilmedi. Son C örneğinde host gönderilen, misafir alınan ve ekrana uygulanan ayna revizyonları `610 / 610 / 610` idi. Misafirler planlı pencere kapama, arka plan dönüşü ve kesintilerin tamamında yetişti.

| Ölçüm | Yerel Chromium p42 |
|---|---|
| 6 açık pencere | 5 görünür eşitleme uyarısı, 1 gözlemde uyarı yok · kapatınca 299–570 ms |
| 6 arka plan döngüsü | CDP ile sayfa 20 sn donduruldu · dönüşte 54–273 ms |
| 6 kısa ağ kesintisi | TCP 3 sn kesildi · hat açıldıktan sonra 583–1532 ms |
| Kesinti sonrası ilk emirler | Toplam 6 filo emri ve 6 gemi emri, host kabulü 12/12. Gemi emirlerinin dünya revizyonu misafirde 269–632 ms içinde uygulandı. Komut probu kesintiden yaklaşık 30 sn sonra çalıştı |
| Kayıtlı en büyük dünya tarihi farkı | 5,7 oyun günü |
| Aktif sensör paylaşımı I3 | B→C, C 27 yeni sistem gördü, ters yönde artış sıfır. C aynası host’un C için hesapladığı görünümle eşleşti |

I1 sonucu **FAIL** kaldı. C’nin 504. saniyedeki açık penceresinde 8 saniye sonraki denetimde uyarı yoktu. Pencere öncesi `324 / 324 / 324`, kapama sonrası `332 / 332 / 332`, kapatınca yetişme 405 ms. Açık pencere sırasında revizyon örnekleri olmadığı için uyarının hiç çıkmadığı ya da sadece geç çıktığı belirlenemedi. Aynı p42’nin hedefli O7 koşusu gerçek bekleme sırasında uyarının yeni `3×` hız bildirimiyle birlikte ekranın üstünde kaldığını gösterdi. Bu tek örnek için ürün değişikliği yapılmadı.

I2 sonucu ilk koşuda **FAIL**. C’de bir sistem ve bir kolonileştirilebilir işaret eski test beklentisine göre fazlaydı. `mirror.js:build`, `humanVisionContext()` ve `humanMapKnowledge()` ile anlık yetkili görüşü çıkarır. Eski test `sys.seen` ve daha önce kaydedilmiş `mapHabitats` alanlarını karşılaştırıyordu. Testin referansı anlık host görüşüne geçirildi ve aynı gün içindeki son ayna revizyonunun gerçekten uygulanması zorunlu kılındı. p43’te aynı 500 sistem ve 16 AI kurulumuyla yapılan hedefli I0/I2/I3 koşusu **3/3 PASS**. İki misafirin keşfi, kolonileştirme işaretleri, rota, görünür sahiplik ve filo canı eşleşti. Bu koşu kısa görsel regresyondu, tam 15 dakika p43’te **NOT RUN**. [p43 I0/I2/I3](../../tests/evidence/mp-p42-saha0/p43-i-focused.json)

p43 O1 ve O3 **PASS**. O1’de 3 saniyelik kesintiden sonra filo ve tersane komutları host ve misafirde doğrulandı. Dönüşte bina için boş yuva yoktu. O3’te B için 16 fark aynası ve bir tam ayna yapay olarak düşürüldü. Hız/nabız açıkken misafir revizyonu `9`’da kaldı. Yeniden istek sonrası eşitlendi, son revizyonlar `43 / 43 / 43` idi. Birleşik O7 koşusu, host karar penceresinin gerçek hızı `1×`’e indirmesi nedeniyle kesin `3×` metni denetiminden kaldı. Misafir penceresinin bekleme açıklaması o anda görünüyordu. Yeni odada ayrı O7 koşusu **PASS**. [Ayrı O7](../../tests/evidence/mp-p42-saha0/p43-o7-isolated.json) · [p43 O1/O3 ve birleşik O7](../../tests/evidence/mp-p42-saha0/p43-o-focused.json)

Kalıcı kapalı pencere donması **AÇIK**. Fiziksel Android’de aynı belirti anında host revizyonu, misafir alınan ve uygulanan revizyonları, son emir ve hız bildirimi birlikte gerekli. [I örnekleri](../../tests/evidence/mp-p42-saha0/p42-i1-soak.json) · [I sonucu](../../tests/evidence/mp-p42-saha0/p42-i-summary.json) · [O7 sonucu](../../tests/evidence/mp-p42-saha0/p42-o7-browser.json)

## P0 — Kayıttan dönüşte olaylar

p42 Chromium J0–J4 **5/5 PASS**. Host kaydetti, tüm Chromium profilleri ve relay kapandı, host aynı kaydı yeni odaya açıp gün 31’e kadar yalnız ilerledi. B elle yeni kodla, C davetle eski devletlerine geldi.

- **Kayıt öncesi bekleyenler.** Testin kurduğu `Bilim Konseyi Talebi` host şeridinde, gizlediği `Göçmen Filosu` host ☰ listesinde ve `Kayıp Sonda` yalnız B şeridinde kaldı.
- **Doğal oyun akışı.** Host ve B normal kurulumda **Antik Kalıntı** kökenini seçti. Kayda giren `27,27` ve `14,27` günlük taramalar aynı süreyle geri yüklendi. `main.js:stepFleets` ve `doSurvey()` host yalnızken gerçek döngüde tamamlandı. Host `Anomali — Ithkrim-95` kartını gördü. B’nin 16. günde doğan `Antik Kalıntı Mezarlığı` kararı kendi karar kimliğiyle B şeridinde göründü. C’ye sızmadı. `guest-stars.js:personalDecisions()` bu kararı aynadan şeride taşıdı.
- **Sonradan kurulan olaylar.** Test, doğal taramalar ölçüldükten sonra `UI.event`, `UI.anomaly` ve `UI.chain` ile ek kartlar oluşturdu. Host ve B yalnız kendi bilim zinciri/anomali kartlarını gördü. Doğal örnek sayıları bu aşamanın öncesinde alındı.
- **J3 ve J4.** p42’de ilk koloni gemisi host kabulü 445 ms, host kuyruğu 474 ms, misafir tersanesi 775 ms. Tek ücret `60 alaşım + 265 maden`. Sonraki emir yanıtı düşürüldü, aynı CID ve sıra ile yeniden gönderildi. Host `dup` döndürdü ve ilk uygulama için bir ücret ve bir satır oluştu.

p43’te aynı Antik Kalıntı koşusu J0–J4 **5/5 PASS**. B ve C’nin kayıt kimliği de ayrı doğrulandı. Kayıt dönüşü akışı için ürün değişikliği gerektiren bir kusur bu senaryoda görülmedi. [p43 J kanıtı](../../tests/evidence/mp-p42-saha0/p43-j-browser.json) · [p42 J kanıtı](../../tests/evidence/mp-p42-saha0/p42-j-browser.json)

İlk rota probunda normal keşif hedeflerine verilen iki hareket emri kabul edildi. Yeniden açılan oyunda iki hedef anomalinin tamamlanması gözlenmedi. B’nin eski `Kayıp Sonda` kararı yeni odada görünüyordu. Probda filonun varışı ve tarama sonucu ayrı kaydedilmediği için kaybolan bir olayı göstermiyor. Gözlemi sonraki saha teşhisi için ayrı bıraktım. [Rota probu](../../tests/evidence/mp-p42-saha0/p42-j-route-probe.json)

Erişilebilen gerçek `stars-2215-03.sav`, yerel p42 motorunda okunan 500 sistemlik Save8 misafir görünümüydü. Kendi bekleyen karar ve anomali kartı sayısı sıfırdı. Çok oyunculu host yükleyicisi dosyayı `save8-guest` olarak tanıdı. İncelenen diğer iki gerçek kayıt tek oyunculuydu. Gerçek oturumun host paketi ve saha belirtisi karşılaştırması **NOT RUN**, olay kaybı saha vakası **AÇIK**.

## Regresyon, paket ve yayın

| Kontrol | Sonuç |
|---|---|
| Yerel HTTP/WS ve VM PWA, p40/p41 gerçek kontrol kökleri | p42 **11/11**, p43 **11/11** |
| Komut güvencesi, A1–A3, karar, federasyon oyu, anlaşma ve tersane | p42 **13/13**, p43 **13/13** |
| p42 paketi → p43 | Save8 v8 · geçerli, dünya açıldı, tarih korundu |
| Save8 ve RNG | p42→p43, 3 tohum × 48 ay, 8 kontrol noktasında eşdeğer |
| ZIP | `releases/stars-faz96h10p43.zip` · 939.772 bayt |
| SHA-256 | `a24fdd28b5597dee4c54d1a7140be8cb5c3c2bafb42f9cdee7ed7d665971ce1c` |
| CRC32 | `459C7E32` · 20 üye CRC kontrolü geçti |
| Manifest | 19 runtime dosyasının çıkarılmış ZIP özeti doğrulandı |
| `/mp/version` | `96h10p43 / MP.8.9b42` · `runtime=b512c978e814` · `main.js=d97b20c89aab` |
| İçerik kimliği | `787fe3bcd06c12aba5b02ffe0cf7a0bc9d84bee86616a2ab9c5d024e8f8039ef` |

Render testi için `codex/stars-mp-p42-saha0` dalını seç. Beklenen sürüm `96h10p43 / MP.8.9b42`. Paket içeriği standalone oyundur. Render relay’i aynı dalın kaynak kodundan çalışır. Adayın canlı kabulü ve fiziksel Android saha vakaları açık. Nihai uzak HEAD ve taslak PR, teslim yanıtında belirtilir. [ZIP](../../releases/stars-faz96h10p43.zip) · [Manifest](../../RELEASE-MANIFEST.json)
