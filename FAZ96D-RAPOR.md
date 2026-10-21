# STARS Faz 96D — 21 Ekim 2026

Köken, ortak Canvas portresi ve mevcut Web Audio motoru geliştirildi. Teknik kabul tamamlandı; müziğin öznel dinleme kalitesi ve fiziksel Android kabulü açıktır. Save v8, tek 2B kamera ve mevcut 4X kuralları korundu. GitHub'a kod devralma, commit, push veya yayın yapılmadı.

## Kaynak

Tek geliştirme ebeveyni gerçek `stars-faz96c3.zip`: `bfce5e5b2f0718057f7ddc50e91883ccaf8347bb26d24b2241b03132b4b76f9a`. SHA, ZIP CRC, tam dosya envanteri ve 1.397 manifest hash'i eşleşti. Ebeveyn raporundaki 106/5.502/130 değerleri doğrulandı; bunlar yeni sonuç diye kopyalanmadı. Girdi kanıtı: `tests/audit96d/input-verification.json`.

## Gerçek değişiklikler

| Üretim dosyası | Değişiklik |
|---|---|
| main.js | Sekiz köken için gerçek avantaj/dezavantaj/hikâye metni; geçersiz yeni köken/görünüş ID'sinde güvenli varsayılan; Altın Çağ'ın gerçek kriz ayı; kozmetik varyasyon ve şablon alanı; ses tercihi yükleme; build96d |
| ui.js | Mevcut kurulumda köken ayrıntısı, Devlet panelindeki köken kimliği, portre varyasyonu/ortak seed, iki mevcut ayar ekranında ses kontrolleri; aynı bildirim DOM'unun korunması |
| map.js | Mevcut ART portre girişleri üzerinden ortak gölgeli tür/yüz/kıyafet çizimi, lider rütbesi ve 96 girişlik LRU; kamera/filo çizim altyapısı korunur |
| audio.js | Mevcut AUDIO/SFX arabirimini koruyan armonik cümleler, harmonik/gürültü zarfları, dört atmosfer, yumuşak seviye yolları, ayrı tercihler, gerçek zaman aralığına göre ses sınırı ve düğüm temizliği |
| index.html | Yalnız kapsamı sınırlı köken/portre/ses CSS'i |
| sw.js | stars-v96d |

AI, commerce, economy, economic-ledger, combat, diplomacy, construction, inbox, news ve archive-ui üretim dosyaları byte düzeyinde ebeveynle aynı. Ayrıntılı hash ve patch: `tests/audit96d/changed-production.json`, `production.patch`. Yeni görsel/ses kütüphanesi, oyun içi resim veya ses varlığı eklenmedi.

Tek başlangıç mekaniği düzeltmesi: Altın Çağ eskiden görünen `at` yılını değiştiriyor, gerçek kriz motorunun kullandığı `atMonth` değerini değiştirmiyordu. Artık açık kriz 120 ay erkene gelir, en erken 72. ay; kapalı kriz açılmaz. Gerçek crisisTick ile eşik öncesi/eşik anı ve dalganın doğması doğrulandı. Diğer kökenlerde yanıltıcı vaatler gerçek mekanikle eşleştirildi; ücretsiz yeni bonus eklenmedi.

## Doğrulama

Eski 106 paket / 5.502 kontrol yeniden çalıştı; yeni 3 paket / 29 kontrol eklendi. Son kilitli tam koşu: **109 paket / 5.531 başarılı kontrol / 0 kalan otomatik hata**, atlanan paket yok. Gerçek Chromium133: eski 130 ve yeni 15 arayüz senaryosu; ayrıca dört OfflineAudioContext renderı, bir 180 saniyelik canlı çalışma ve bir yedi-efekt stres deneyi geçti. Tekrar koşuları toplama eklenmedi.

Standart kökende 100 sistem, tohum11/99/404, 12 ay, 6. ay Save v8 yeniden yüklemesi: 36/36 aylık simülasyon/RNG/ekonomi karşılaştırması eşit; yalnız sunum tercihleri ve kozmetik alan dışlandı. Yeni 120 aylık AI denge kampanyası yapılmadı. Altın Çağ'ın amaçlanan kriz takvimi farkı bu nötrlük iddiasının dışındadır.

## Açık sınırlar

Gerçek dinleme yapılmadı; daha organik tını tasarımı, kaydedilmiş orkestra eşdeğerliği veya müziğin güzel bulunduğu anlamına gelmez. Fiziksel Android, OS arka planı, cihaz FPS/ısı/RAM kabulü yapılmadı. Bilim gemilerinin hedef yığılması/korsan beklemesi ve özgün kayıt isteyen federasyon reddi kapatılmadı. Genel AI denge riskleri korunur.

## Teslim

`stars-faz96d.zip` temiz yayın dizininden oluşturulur; yeniden açılarak CRC, hash, yol/envanter ve gerekli raporlar bağımsız doğrulanır. Manifest kendi hash'ini içermez. ZIP'in kendi SHA-256 değeri döngüsel olmaması için nihai teslim mesajında bildirilir. Kaynak kodu veya başarılı test tek başına ZIP teslimi sayılmaz.
