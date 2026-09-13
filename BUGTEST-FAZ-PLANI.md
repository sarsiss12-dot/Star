# 87T — kullanıcı denemesi ve bug-test planı

**Şimdi test yapman gerekmiyor.** "Hazırım" dediğinde güncel teslim üzerinden
bu sırayı kullanacağız. Bir oturumda hepsini bitirmek zorunda değilsin.
Cihaz: bildirdiğin TECNO Spark 50 5G / Android Chrome.

## 87T0 — hazırlık (2–3 dakika)

- Mevcut kaydı cihazına farklı adla dışa aktar; tek yedeğin üzerine yazma.
- Denediğin ZIP/build adını not et. Tanı raporu build kimliğini içerir.
- Chrome sekmesi mi, ana ekran kısayolu mu; yatay/dikey ve tam ekran durumu nedir?
- Site verisini temizleme. PWA sürümü belirsizse önce tanıyı sakla, bize bildir.

## Oturumlar

| Oturum | Yaklaşık süre | Deneme | Beklenen sonuç |
|---|---|---|---|
| 87T1 — kullanılabilirlik | 10 dakika | Sol iki menüyü adres çubuğu açık/kapalı aç; kaydırarak son düğmeye ulaş. Vali/amiral ata ve paneli liderler listesiyle karşılaştır. | Menüler görünür alanda; alt kontrol çubuğu erişimi kapatmaz. Aynı liderin portresi görünür. |
| 87T1 devamı — harita | 5 dakika | Tap/pan/pinch; pinch sonrası tek parmak; yakın zoom'da dört kenara hareket. Ardından başka uygulamaya geçip geri dön; iki yön değişimi yap. | Tek parmak zoom'a takılmaz; gezegen seçilir; kenarlar erişilir; harita boşalmaz. 12 katman birleşimini tek tek zorlamak gerekmez. |
| 87T2 — diplomasi/kayıt | 10–15 dakika | Bir elçi görevi seç; iki devlette ayrı taslak hazırla ve geri dön. Uygun küçük bir anlaşma yap, sonra yeni adla kaydet/yükle. | Taslaklar karışmaz; kaynak bir kez aktarılır; elçi/kıdem ve dünya korunur; yükleme sonrası eski açık onay yürütülmez. |
| 87T3 — casusluk | 10–15 dakika | Hedef seç → Casus ata → geri çek. Ağ seviyesi yetince bir önizlemeyi iptal et, başka birini onayla. DOSYALAR ve tam dosyayı aç. | Atama aynı ekranda görünür. İptal bedelsiz; onay tek kesinti. Sonuç özeti iki yerde görünür; ifşa ile başarı ayrı anlatılır. Süreli kazanım varsa kalan gün görülür. |
| 87T4 — normal oyun | İsteğe bağlı 20–30 dakika | Hızlı ileri almayı ve duraklatmayı karıştırarak normal oyna; birkaç kez arka plana git. Rahatsız eden tekrar/menü/akışları not et. | Kalıcı kilit, beyaz harita, kayıt kaybı veya anlaşılmaz bildirim yığını yok. Her ayrıntıyı sayman gerekmez. |

Savaş-NAP kapanışı, elçinin savaşta durması, düşük/yüksek istihbarat ve dosya
seçiciyi iptal etme gibi özel durumlar CIHAZ-TEST-BIRIKIMI.md'de duruyor.
Bunları normal oyunda denk geldikçe dene; kaydını sırf test için bozma.

## Bir hata olduğunda

Önce tekrar tekrar düğmeye basma. Mümkünse oyun dursun; güvenli mevcut yedeği
koruyarak ayrı adla hata sonrası kayıt ve "TANI RAPORUNU AL" çıktısını sakla.
Oyuna erişilemiyorsa zorlaman gerekmez. Sayfa yenilemeden önce ekran görüntüsü
ve tanıyı almak daha yararlıdır. Kaydın olaydan önce olması da değerlidir;
kaç saniye/dakika önce olduğunu yazman yeterli.

```text
Build / ZIP:
Cihaz / tarayıcı / tam ekran:
Son yaptığım 2–3 işlem:
Beklediğim:
Gerçekte olan:
Tekrar etti mi (bilmiyorum da olur):
Görünmezken gezegene/menüye tıklanabiliyor mu:
Ekler: ekran görüntüsü/video, tanı, hata öncesi/sonrası kayıt (varsa)
```

## Öncelik ve kapanış

- **P0:** kayıt/oyun verisi kaybı, kalıcı beyaz harita veya etkileşim kilidi.
  İlgili oturumu durdur; tanıyı koru. Geliştirmede ilk ele alınır.
- **P1:** yanlış kaynak/antlaşma/operasyon sonucu veya ana eylemin çalışmaması.
- **P2:** kesilen menü, kayıp portre, hatalı metin veya okunabilirlik.
- **P3:** görsel iyileştirme/denge önerisi; hatadan ayrı kaydedilir.

Kapanış: otomatik regresyon + mümkünse aynı cihaz adımlarında yeniden deneme.
"Bir kez çıkmadı" olumlu gözlemdir; bütün mobil yaşam döngüsü testleri geçmiş
sayılmaz. 87T sonucunda kısa kabul tablosu ve gerekirse yalnız bulunan hatalara
odaklanan bir düzeltme fazı çıkaracağız.

87T3'e 87C ilavesi: özel teknoloji verisi/isyan girişimi denk gelirse
başarı–ifşa–sonuçsuz ayrımı, ücret ve özetin iki dosya ekranında eşleşmesine
bakılır. Bu, standart operasyon önizleme/onay kontrolünden ayrı bir yoldur.

87T2/87T4'e 87D ilavesi: Normal akışta reddedilen teklifin aynısının kısa
aralıkla dönmesi, hızlı çift dokunuşta iki kez ücret/ilişki kaybı ve yükleme
sonrası eski açık teklifin uygulanması izlenir. Yeni şartlı teklif serbesttir;
27 ay sınırı otomatik testtedir, elle saymak zorunlu değildir.

87T4'e 88A ilavesi: Hareket sırasında rota değişimi/ek durak, geçit
kullanımı ve ikmal filosunun varışını normal oyun içinde izle. Takılan filo
olursa kaynak ve hedef sistemi, ana filonun hareket/çatışma durumunu not et.
Kayıt ve kısa video yeterli; bütün kombinasyonları elle denemek gerekmiyor.

## 88A.1 — kullanıcı hazır olduğunda, henüz cihazda sınanmadı

- Aynı tersaneden iki ayrı filoyu tamamla: her gemi kendi hedefine gitsin;
  genel toplanma noktası değişmesin. Tekrar tamamlama ek bedel kesmesin.
- Sipariş sırasında ana filoyu hareket ettir; gemi güncel hedefi izlesin.
- Üretim bitmeden rota kapanır veya ana filo yok olursa gemi tersanede
  beklesin; başarılı sevk mesajı çıkmasın.
- Sipariş açıkken kaydet/yükle: hedefler ayrık kalsın.
- Bilim gemisi erişemediği en yakın hedefte takılmasın; kendi sisteminde
  tarama başlasın ve süren tarama her AI turunda başa dönmesin.

Bu liste şimdi test talebi değildir; 87T oturumunda küçük parçalara bölünür.

## 88B — kullanıcı hazır olduğunda, henüz cihazda sınanmadı

- Oyuncunun katıldığı bir çatışmada sistem panelini aç: kayıp, son tur gövde
  hasarı, ateş açabilen gemi ve menzil okunabilir olmalı.
- Uzak menzilde ateş edemeyen kısa menzilli gemi, “ateş açabilen” sayısına
  girmemeli; çatışma yakınlaştıkça sayı değişebilmeli.
- İkmali zayıf filoda panel hasar/kalkanı ayrı anlatmalı; “gövde yıpranması”
  yazmalı. Savaş sonunda kısa mesajdaki iki kayıp sayısı panelle eşleşmeli.
- Savunma duruşundaki hasarlı filo ricat ederse hedef, gövde ve ikmal yüzdesi
  görünmeli. Kaydet/yükle son savaş raporunu kaybetmemeli.
- Temas kurulmamış AI-AI çatışması ayrıntılı filo/devlet bilgisi açmamalı.

Bu liste şimdi test talebi değildir; kullanıcı hazır olduğunda kısa bir
oturuma bölünür.
