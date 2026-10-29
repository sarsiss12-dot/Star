# STARS — MP.1 mobil akış ve galaktik lobi

Bütün ekranlar telefon için tasarlandı (dikey ve yatay). Ekran görüntüleri: `research/mp1/evidence/`. Kanıt koşusu `tests/browser-mp1.cjs`: her telefon ayrı bir Chromium süreci, dokunmatik mobil bağlam. **Fiziksel Android cihazda denenmedi (NOT RUN).**

## 1. Ana menü

- Relay'in sunduğu sayfada başlık menüsü:
  - **YENİ OYUN**
  - **OYUNA DEVAM ET**
  - **ÇOK OYUNCULU**
  - **AYARLAR**
- ÇOK OYUNCULU, AYARLAR'ın önüne eklenir. Mevcut üç düğme değişmez; sıraları ve etiketleri test edildi.
- Düğme yalnız çok oyunculu hizmeti sunan sunucudan açılan sayfada görünür.
  - Yayın ZIP'i (`stars-faz96h10.zip`) ve 19 runtime dosyası değişmedi. ZIP'ten ya da başka bir statik barındırmadan açılan oyunda bu düğme **yok**.
  - Sebep: çalışan bir sunucu dağıtılmadı. Kullanılamayan bir Host/Join düğmesi göstermek yanıltıcı olurdu.
- ÇOK OYUNCULU → **ODA OLUŞTUR / ODAYA KATIL / GERİ.**
  - GERİ ve Android geri tuşu başlık menüsüne döner.
  - ODAYA KATIL, motor yüklemeyen katılım sayfasına (`/mp/join`) gider.

## 2. Host akışı (oda kuran telefon)

1. **ODA OLUŞTUR:** "Bağlantı kuruluyor…".
   - Relay güvenli oda kodunu ve yalnız bu telefona özel host anahtarını verir.
   - Galaksi gerçek `setupGame` ile kurulur: Orta, 5 AI, rastgele tohum; şekil tek oyunculu tercihten.
   - Ölçülen süre: yerelde 0,11–0,20 sn; 60/150 ms gecikmede 0,21–0,36 / 0,30–0,42 sn (birkaç koşu).
2. **Galaktik lobi:** üstte büyük oda kodu `XXXX-XXXX`, altında iki düğme:
   - **KODU KOPYALA:** pano. İzin yoksa kod seçili kalır ("uzun basıp kopyala").
   - **DAVET PAYLAŞ:** Android paylaşım sayfası (`navigator.share`). Yoksa davet bağlantısını panoya kopyalar.
   - Davet bağlantısı `https://<relay>/mp/join?code=XXXXXXXX` biçimindedir. Gerçek bir adres yok; dağıtım yapılmadı.
3. **Galaksi ayarları sekmesi (yalnız host):**
   - boyut, AI devlet sayısı (1–11), insan kapasitesi (host dahil 2–4), tohum;
   - **GALAKSİYİ UYGULA.**
   - Uygulamak galaksiyi yeniden kurar; misafirlerin devlet seçimi ve hazırı sıfırlanır.
   - AI sayısı misafir sayısından az olamaz. Odadaki oyuncudan düşük kapasite seçilemez.
4. **Lobi sekmesi:**
   - oyuncu listesi;
   - "Misafirler" kartı: her misafir için devlet atama seçimi ve **Çıkar** (onay sayfası ile).
5. **OYUNU BAŞLAT** ancak herkes bağlı, devlet seçmiş ve hazırsa etkin olur. Değilse nedeni Türkçe yazar:
   - "En az bir oyuncunun katılması gerekiyor."
   - "Bütün oyuncular hazır değil."
   - "Her oyuncu bir devlet seçmeli."
   - "Bağlantısı kopan oyuncu var."
6. **ODAYI KAPAT** (onaylı): herkes "Oda kapandı." görür; kod artık kullanılamaz.
7. **Android geri tuşu** lobide odayı kapatmadan önce sorar: "Odayı kapatıp çıkmak istiyor musun?".

## 3. Misafir akışı (katılan telefon)

1. Davet bağlantısıyla açılırsa kod hazır gelir; yoksa kod elle yazılır.
   - Alan `autocapitalize=characters`; küçük harf ve tiresiz yazım `XXXX-XXXX` biçimine çevrilir.
2. Oyuncu adı (en çok 24 karakter, HTML'den arındırılır). **KATIL**, klavyede Enter ya da "Git".
3. Hatalar Türkçe:
   - "Oda kodu geçersiz ya da oda yok."
   - "Oda dolu."
   - "Oda kapandı."
   - "Oyun başladı; yeni oyuncu alınmıyor."
   - "Host seni odadan çıkardı."
   - "Çok fazla deneme. Biraz bekle."
4. **Lobide:**
   - üstte bağlantı durumu ("Bağlı · oda XXXX-XXXX");
   - oyuncu listesi;
   - **Devlet seç** kartı: gerçek AI devletleri ad, ırk ve doktrinle; SEÇ / BIRAK / DOLU;
   - **HAZIRIM / HAZIR DEĞİLİM** (devlet seçmeden pasif);
   - **ODADAN AYRIL.**
5. Oyun başlayınca kendiliğinden oyun ekranına geçer:
   - devlet adı (kendi rengi), oyun saati ve kaynaklar;
   - kolonilerde nüfus, yer, binalar ve kuyruk;
   - koloni başına bina seçimi ve **İNŞA ET;**
   - bilinen sistem, görünen yabancı filo ve temas sayısı;
   - son komut sonuçları ve süreleri.
6. **Geri tuşu** lobide ve oyunda onay sayfası açar ("Ayrıl / Kal"). Yanlışlıkla çıkılmaz.
7. Android arka plandaki sekmeyi yeniden yüklerse sayfa, o oda için saklı koltuk jetonuyla **kendiliğinden** aynı koltuğa ve devlete döner (test edildi).

## 4. Oyuncu listesi (herkeste aynı)

Her satırda şunlar görünür:

| Alan | Örnek |
|---|---|
| renk noktası, ad, `HOST` işareti | ● Yeni Hanedan HOST |
| bağlantı | bağlı / bağlantı koptu |
| seçilen devlet | Nyx ve Bağlı Dünyalar · Sentetik Uyum Kolektifi (host için "Kendi devleti") |
| hazır | Hazır / Hazır değil (host için —) |
| açık kurulum sekmesi | Lobi, Doktrin, Görünüş, Fizyoloji, Etik, Civic, Köken, Galaksi ayarları, Oyunda |

- Boş yuvalar kesik çerçeveyle gösterilir.
- Testte host ve iki/üç misafirde liste alan alan aynıydı. Başlıkta "3/4 OYUNCU" ve "4/4 OYUNCU" doğrulandı.
- Bir misafirin Doktrin'i açması ötekilere 49–60 ms içinde göründü (yerel).

## 5. Mobil yerleşim sonuçları (Chromium, dokunmatik mobil bağlam)

| Görünüm | Yatay taşma | <44 px dokunma hedefi | En küçük yazı | Klavye açıkken kod alanı | Klavye açıkken host tohum alanı |
|---|---|---|---|---|---|
| 360×800 | yok | yok | 11 px | görünür | görünür |
| 390×844 | yok | yok | 11 px | görünür | görünür |
| 412×915 | yok | yok | 11 px | görünür | görünür |
| 844×390 | yok | yok | 11 px | görünür | görünür |
| 915×412 | yok | yok | 11 px | görünür | görünür |

- Tablo host lobisini, misafir lobisini, katılım sayfasını, misafir oyun ekranını ve host oyun panelini kapsıyor.
- Yazılım klavyesi, görünür alanın %45'e düşürülmesiyle taklit edildi. Odaktaki giriş `scrollIntoView` ile ortalanıyor.
- İlk koşuda bulunan ve düzeltilen hatalar:
  1. Lobi CSS sınıfları (`.empty`, `.tag`) oyunun kendi CSS'iyle çakışıp yazıyı 10 px yapıyordu. `mp1-` önekine taşındı.
  2. Host tohum alanı klavyenin altında kalıyordu. Odak kaydırması eklendi.
  3. Host oyun paneli haritanın üzerinde fazla yer kaplıyordu. Tek satıra (46 px) indirildi; bağlantısı kopan misafir olunca kendiliğinden açılıyor.
- **Ağır animasyon yok.** MP ekranları geçiş animasyonu kullanmıyor.
- Host oyun ekranı dikeyde oyunun kendi "CİHAZI YATAY ÇEVİR" uyarısını gösterir. Bu tek oyunculu oyunla aynı davranış; harita yatay için tasarlandı. Misafir sayfası dikey ve yatayda çalışır.
- **Android PWA ve Chrome farkı:** PWA ana ekran kısayolu `./index.html` açar.
  - Relay'den kurulduysa çevrimiçi iken MP betikleri gelir.
  - Çevrimdışıyken `sw.js` önbellekteki sayfayı verir, MP betikleri gelmez ve düğme görünmez.
  - Gerçek Android PWA kurulumuyla denenmedi (NOT RUN). Testte host bağlamında gerçek `sw.js` etkindi.

## 6. Oyun içinde host paneli

- Sol altta tek satır: "ÇOK OYUNCULU · KOD · bağlı · 2/2 misafir". Dokununca açılır.
- Bağlantısı kopan misafir için kendiliğinden açılır ve iki karar sunar:
  - **Çıkar (devlet boşta):** jeton yasaklanır; devlet insan kontrolünde ama sahipsiz kalır.
  - **Devleti AI'ya ver:** `ai=true`; devralınan koloni otomasyonu geri yüklenir.
- Hiçbiri seçilmezse koltuk bekletilir; oyuncu döndüğünde aynı devleti alır.
- Kendiliğinden yeniden atama yok.
