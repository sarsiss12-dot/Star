## 21. Save8, RNG, Chromium ve PWA

Üretimde Save8 şeması ve RNG aynı. Eşlenmiş girişlerin RNG'si aynı; snapshot gözlemcisi Save ve RNG saflığı assertion'ından geçti. Adayın izole sefer fonksiyonu yeni RNG tüketmedi. Kararlar ve çarpışmalar değişince tam kampanyanın RNG'si ayrışabilir; kontrol ve adayın bütün gelecek RNG'sinin aynı olduğu iddia edilmedi.

Mevcut kanonik oyunda gerçek Chromium ile **17/17 PASS, 0 page error**:

- 844×390, 740×360 ve 390×844 ekranlarda altı federasyon sekmesi, bağımsız kaydırma, görünür ayrılma/ihraç.
- Gelen kutusu kararı ve vassal yönetimi.
- Filo filtreleri ve birleştirmeden görsel gruplama.
- Üç/iki sütun inşa düzeni, bağımsız 44 piksel yıkım hedefi ve onay.
- İttifak sonlandırma onayı/iptali, eski işlem koruması ve federasyon engeli.
- Gerçek Save8 yüklemesi sonrası eski işlemin engellenmesi.
- Çevrimdışı PWA yeniden açılışı ve eski Save8 yükleme.

Bu, değişmeyen 96H.6.1 üzerinde regresyondur; adayın tarayıcıda kabulü değildir. Fiziksel Android **NOT RUN**.

## 22. Değişen dosyalar ve yayın kararı

Üretim runtime dosyası değişmedi. Build/PWA yükseltilmedi. Yeni `stars-faz96h7.zip` ve `RELEASE-96H7.json` **oluşturulmadı**. Çalışan oyun **96H.6.1**; oynanabilir bir 96H.7 çıktığı iddia edilmiyor.

Araştırma dosyaları:

- `AI-KARAR-VERIMLILIK-96H7.md`: bu rehber.
- `RESEARCH-96H7.json`: araştırma kararı, kapsam ve kanıt paketinin hash'i.
- `research/96h7/`: parametre karşılaştırmaları, test logları, README ve çalıştırıcılar.
- `campaign-deadline-rejected.patch`: yalnız aday `aiMilitaryCampaign` değişikliği; üretime uygulanmadı.
- `stars-faz96h7-kanit.zip`: araştırma kanıtı; oyun kurulum paketi değil.

Kanonik 19 runtime dosyası ve oyun ZIP'i son hash karşılaştırmasında korunmalı. GitHub güncellemesi force kullanmadan beklenen HEAD üzerine yapılır. Son uzak HEAD ve hash makbuzu teslim raporunun ekindedir. Kanıt paketindeki `EVIDENCE-MANIFEST.json` paket üyelerinin bayt/SHA-256/CRC değerlerini taşır; paket kendi SHA'sını içermez. Yayın sonrası makbuz ve paket SHA'sı arşiv dışında tutulur; öz referanslı bir ZIP hash'i üretilmez.

## 23. Kullanıcının A–J sorularına net yanıt

**A — Hangisi daha iyi ekonomik karar veriyor?** Doğal 120 ay ölçülerinde istenen F4 commit'i ticaret ve dayanıklılıkta daha iyi görünüyor; güncel sürümde koloni daha fazla. Eşlenmiş erken başlangıçta güncel motor daha az kriz ve daha fazla koloni üretiyor. Saf karar kodu için evrensel kazanan belirlenmedi.

**B — Güncel savaş, diplomasi ve kolonileştirme daha mı iyi?** Kolonileştirme daha çok. Savaş ve diplomaside genel üstünlük kanıtlanmadı; mevcut sefer kilidini açma denemesi daha pahalı sonuç verdi.

**C — Eski avantajın ne kadarı başlangıçtan?** Ölçülebilir bir karıştırıcı var: özellikle seed42 Altın Çağ ve güncel köken havuzu değişiyor. Ancak seed11 kökenleri zaten aynı; farkın tamamı köken olamaz. Uzun vadeli yüzdelik pay **belirlenmedi**.

**D — Hangi kurallar verimliliği artırıyor?** Bu fazda üretime önerilecek kadar güvenli kanıt veren tek değişiklik yok. Mevcut üretici güvenliği, gerçek koloni yükü ve bilgi/rota kapıları etkin. Bunları kaldırınca AI'nın iyileşeceği kanıtlanmadı.

**E — Hangi ayarlar pasif veya aşırı saldırgan yapıyor?** Somut pasiflik örneği sürekli uzayan hedef beklemesi. Sürenin tek başına açılması, sevk bakımı sonrasında terhise gidiyor. Hold/runway/force kollarının bu yönde evrensel faydası ölçülmedi.

**F — Parametre değişince olumlu/olumsuz ne oluyor?** İnceleme 30 gün olunca değerlendirme 61→170; sonuç kazancı yok. Hold 1440 gün olunca seed11 değişimi 2→0; genel sonuç kazancı yok, küçük takas oranı farkı var. `prof.exp` 0,2/1,3 varyantları etkisiz. Sefer retry adayı kilidi açtı ama güç ve donanmayı geriletti. Bölüm 9 her kolu kaynağıyla gösteriyor.

**G — Hangi kurulum?** Örnekte zor ayarı daha güçlü rakip; yoğun küçük harita/çok AI daha çok erken etkileşim; halka erken ticaret/diplomasi üretti. Az AI/büyük haritanın daha iyi kolonileştirdiği kanıtlanmadı. Tek seed ve 24 aylık bulgulardan bütün oyunlar için garanti çıkarılamaz.

**H — En büyük üç karar zayıflığı?**

1. Sefer uygulanabilirliği: bekleme yaşam döngüsü ile gerçek sevk bakımı/terhis birlikte tutarlı değil.
2. Hedef → eylem → gerçek başarı bağı: kilometre taşı zafer yerine sınırlı bir gösterge ölçüyor; bazı profil alanları eyleme bağlı değil.
3. Ekonomide kuyruk zamanı ve takip eden üreticinin finansmanı: önceki kanıtlarla gösterilen açık sürüyor.

**I — Güvenli AI geliştirmesi yayımlandı mı?** **Hayır.** Tek aday reddedildi, üretim korundu. GitHub'a yapılan güncelleme bir araştırma sonucu.

**J — Bir sonraki somut iş?** Yeni hedef puanı/eşik araması yerine, aynı seed11/ay60 kaydı üzerinde **sefere çıkışın enerji bakımını mevcut `fleetUpkeep` ve `aiDisbandTick` kurallarıyla birlikte değerlendirmek**. İlk fixture, 22 gemilik terhis zinciri olmalı. Gerçek maliyetin ölçülmesini başarılı seferle bağlayan tek dar karar incelenmeli. Bekleme yamasını tek başına yayımlama.

## 24. Açık sorunlar ve sonraki faz

Sefer bekleme hatası açık; aday pakette görünür fakat kabul edilmedi. Sevk sonrası bakım/terhis, hedef başarısının dolaylı ölçümü, `prof.exp`/`e.agr` bağlantıları, seed11/404 ekonomisi ve 2026 ticaret kaybı açık sorunlar olarak korunuyor. Federasyon oylarında stratejik üstünlük, ticaret yatırım getirisi ve gerçek Android performansı bu araştırmayla tamamlanmış değil.

Doktrin çeşitliliği, Teknokrasi/Kutsal Meclis, 82 Makine/Arındırıcı uyumu, yayılmacı koloni finansmanı, büyük galaksi performansı ve Save8 ortak sefer kayıt hotfix'i ayrı başlıklardır. Bu faz ekonomiyi yeniden başlatmadı ve bunları yayına eklemedi. Öncelik, tek ölçülebilir sefer uygulanabilirliği davranışını geliştirmek; ardından dokuz hedefin gerçek sonuç ölçümlerini iyileştirmek.
