# STARS 96H.6.3 — araştırma; yeni oyun yok

Kanonik başlangıç HEAD: `569287d3ff00be2881b568d395210c4eb70b1bb9`.
Oynanabilir sürüm **96H.6.1**, build `96h61`, PWA `stars-v96h61`, Save8 olarak korunur. Bu klasördeki patch'ler üretime uygulanmadı. `stars-faz96h63.zip` ve `RELEASE-96H63.json` oluşturulmadı.

## Ekonomi

Tek F1 adayı, mevcut ücretli seri kuyruğu ve peşin maliyeti kullanan sınırlı iki eylem hesabı ile, dizi sonundaki zorunlu üreticinin finansman riskini değerlendirdi. Yeni kaynak/RNG/eşik taraması yok. Saf mekanik8test geçti. Aynı gerçek seed11 Save217/RNG'de aktör7 için:

| Kaynak | Kontrol kritik/sıfır ay | F1 kritik/sıfır ay |
|---|---:|---:|
| Maden |9/2|17/5|
| Gıda |0/0|12/8|

F1 reddedildi. Seed404 aday toparlanması ve120/240ekonomi kampanyaları NOT RUN. Karar izi eylem seçeneklerini ve üçüncü zorunlu yatırım riskini gösteriyor; risk sayısı ve her tur yeniden türetme, uygulanabilir yatırım sırasını korumadı. Yeni varyant denenmedi.

## Kapasite

117kurulum vakası geçti:45eski tamSave/RNG eşitliği,72genişletilmiş vaka. 120/160/200sistem gerçekten oluşturuldu;20AI+oyuncu için21benzersiz başkent/kimlik üretildi. Eski36dünya-aylık kısa tekrar tamSave/RNG eşit. Bunlar mobil performans kabulü değildir.

Gerçek Chromium151,844×390dokunmatik görünüm,DPR2; normalCPU ve4×CPU ölçümleri ayrıdır. NormalCPU'da160/16ve120/13üç şekil/seed örneklerinde yaklaşık60FPS görüldü. Aşağıdaki zorunlu stres kapıları aşıldı:

| Kademe / seed |4× aylık karar karesi |4×P95canlı kare | Karar |
|---|---:|---:|---|
|200/20halka23|12613,4ms|54,8ms|Ret|
|160/16halka23|2160,9ms|47,5ms|Ret|
|120/13halka23|1221,4ms|38,7ms|Ret|

Eşikler: aylık karar karesi1500ms, P95canlı kare33,3333ms. 120/13son kademe olarak önceden ilan edildi; başarısızlıktan sonra başka kapasite denenmedi. İlk4×mutlak30FPS beklentisi eski45/5kontrolünde de geçmedi; normal30FPS kabulü ile4×yerelCPU bütçesi ayrımı, son yeterlik koşularından önce protokole yazıldı. Stres ekranFPS'si ayrıca saklandı;4×30FPS iddia edilmez. Tüm ilk protokoller ve başarısız sonuçlar kanıt arşivinde korunur. `performance.memory` sabit10MByuvarladığı için yeterlik ölçümlerinde gerçekCDPheap kullanıldı. FizikselAndroid NOT RUN.

## Bulunan Save8 sorunu

200/20halka23,120.ayda kendi kaydını yükleyemedi. Gerçek60.ay kaydından tekrar sonucunda `Geçersiz ortak sefer kaydı` hatası üretildi. `jointValid` ortak üyeyi çıkarınca kapanmış plan7için yalnız sponsor kalmıştı; `restoreJoint` kapanmış geçmişe de en az2üye şartı uyguluyordu. `SAVE8-GUARD-PROPOSED.patch` yalnız kapanmış planlarda1üyeyi kabul eder; aktifler için2şartı korunur. GerçekSave9kontrol, doğal motorfixture4test ve mevcut ortak sefer59test geçti. Savaşlar/ittifaklar/RNG korunur. **Bu küçük düzeltme de üretime alınmadı:** fazın iki kabul hedefi başarısızken96H.6.1'i koruma talimatı uygulandı. Ayrı dar hotfix için hazır bir öneridir.

## Testlerin sınırı

- Deneysel kapasite kodunda135grup6068PASS/0FAIL; bu tam koşu Save8önerisinden öncedir.
- Öneriden sonra ortak sefer59, kaynak koruma15, gerçek yükleme9, doğal singleton4; ilgili testler geçti. Tekrarlar tam6068'e eklenmez.
- Yeni kapasite birim dosyası5PASS; saf ekonomi8, ölçek motoru9PASS.
-55tarayıcı işlev senaryosu PASS; bu sayı başarısız performans kapılarını PASS'a dönüştürmez.54deneysel/yeterlik+1kanonikPWA.
-120/240ekonomi, fizikselAndroid, toplamGPU/nativeRAM ölçümü NOT RUN.
- Küçük test sürücüsündeki cfgalias hatası ve onaylı Save8satırı için eski kaynak pininin ilk hatası ayrı loglarla korundu; düzeltildi. Bunlar yeni AI varyantları değildir.

## Tekrar oynatma

Kanonik19runtime, oyunZIPhash'i ve önceki iki kanıtZIP'i doğrulandı. `SOURCE.json`, `PRIOR-EVIDENCE-VERIFIED.json` ve manifestler kökleri tanımlar. `F1-rejected.patch` ve `CAPACITY-REJECTED.patch` yalnız ayrı çalışma ağacına uygulanır; yayımlanan oyuna uygulanmaz. Save8önerisi ayrıca ayrıdır. `scripts-as-run/` özgün çalışma yollarını korur; yeni ortamda kök/fixture yolları bağlanmalıdır. Ortak motorhost'u `tests/helpers/runtime.js` ve önceki fazın salt-okunur prototipi `research/96h62/scripts-as-run/prototype.js` kanonik repoda bulunur. Tam fixture/ham tekrarlar `stars-faz96h63-kanit.zip` içindedir; dar özetler burada tutulur.

Sonraki adım yeni ekonomi eşikleri değildir. Önce bu tek Save8geçmiş-kayıt düzeltmesini ayrı güvenli hotfix olarak değerlendirmek, sonra96H.7stratejik hedef/plan kalitesiyle beraber pahalı AI/arayüz çağrılarını profillemek daha verimlidir. 200/20ve20AI mobil kabul edilmiş değildir; yayımlanmış sınırlar100sistem/11AI olarak kalır.
