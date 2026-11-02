# STARS MP.7.3 — iki Android telefonla gerçek test rehberi

Bu rehber bilgisayarı olmayan bir kişi için yazıldı. Her adım telefondan ve Render panelinden yapılır.
- `<adres>`: Render servisinin kendi `https://…onrender.com` adresi. Depoya yazılmaz.
- Bu oturumdan hiçbir dağıtım yapılmadı. Fiziksel Android sonucu **NOT RUN**.

## 0. Dağıtım (Render paneli)

1. **Settings → Build & Deploy**
   - **Branch:** `claude/stars-mp73-council-intrigue`
   - **Runtime:** Docker
   - **Dockerfile Path:** `research/mp1/deploy/Dockerfile`
   - **Docker Build Context Directory:** `.` (depo kökü)
2. **Environment**
   - `MP1_ORIGINS=<adres>` (yalnız `https://`, sonda `/` yok)
   - `MP1_DEV` verilmez.
   - Gizli anahtar gerekmez.
3. **Health Check Path:** `/healthz`
4. **Manual Deploy → Clear build cache & deploy**
5. **Sürümü doğrulayın.** Telefon tarayıcısında `<adres>/mp/version` açın. Görmeniz gereken:
   ```
   {"mp":"MP.7.3","build":"96h10p2","files":{...}}
   ```
   - `mp` alanı `MP.7.3` değilse eski imaj çalışıyordur: 4. adımı yineleyin.
   - `files` içindeki 12 haneli özetler yalnız dosya sürümünü gösterir; gizli bilgi değildir.

## 1. Telefonlarda sürüm işareti

Her iki telefonda açık STARS sekmelerini kapatıp yeniden açın. Service worker yeni önbelleği (`stars-v96h10p2`) alır.

Sürüm üç yerde görünür:
- **Lobi** (host ve misafir): kartın altında `STARS MP.7.3 · oyun 96h10p2`.
- **OYUN BAŞLIYOR ekranı** (misafir): adım listesinin altında aynı satır.
- **Oyun içinde**: üstteki ÇOK OYUNCULU çubuğuna dokunun.
  - Host: açılan bölümde sürüm ve yeniden bağlanma sayısı.
  - Misafir: sürüm · bağlantı · aşama · son hata kodu.

İki telefonda satır farklıysa biri eski önbellektedir: sekmeyi kapatıp yeniden açın.

## 2. 15 adımlık test

| # | Adım | Beklenen |
|---|---|---|
| 1 | Branch `claude/stars-mp73-council-intrigue` deploy edilir (§0) | `/mp/version` → `MP.7.3` |
| 2 | İki telefonda `<adres>` açılır | Başlık ekranı; ana menüde ÇOK OYUNCULU düğmesi |
| 3 | Telefon A: ÇOK OYUNCULU → ODA KUR | Oda kodu görünür |
| 4 | Telefon B: ÇOK OYUNCULU → ODAYA KATIL, kodu yazar | B lobide görünür |
| 5 | İki oyuncu kendi devletini tasarlar (gerçek kurulum ekranı) | Farklı adlar / renkler |
| 6 | İkisi de HAZIR'a dokunur | Host'ta BAŞLAT açılır |
| 7 | Host BAŞLAT'a dokunur | B'de OYUN BAŞLIYOR adımları, sonra oyun |
| 8 | İki ekranda galaksi görünür | B kendi başkentinde başlar |
| 9 | B bir filosunu başka sisteme gönderir | Filo yola çıkar; host'ta da hareket eder |
| 10 | B → A diplomatik teklif (DİPLOMASİ → A → MÜZAKERE → GÖNDER) | A'da bildirim kartı |
| 11 | A → B teklif | B'de bildirim kartı |
| 12 | Gelen kutusundan yanıt (KABUL / RED) | Gönderende Gönderilen sekmesinde sonuç |
| 13 | Zaman iki ekranda ilerler | Tarih ikisinde de değişir |
| 14 | B ağı keser (uçak kipi 5–10 sn), sonra açar | B aynı devlete döner; ÇOK OYUNCULU çubuğunda "bağlı" |
| 15 | Host ÇOK OYUNCULU çubuğu → OYUNU KAYDET | "Kaydedildi" bildirimi |

## 3. İsteğe bağlı: konsey ve entrika

Konsey genelde oyunun ortasında kurulur. İki insan üye olduğunda:
- **Oylama:** her insanın oyu kendi bildirim kartında ya da Konsey ekranında bekler (EVET / HAYIR). AI insanın yerine oy vermez.
- **Kapanış:** oylama ancak tüm insan üyeler oy verince (ya da 24 ay dolunca) kapanır.
- **Rüşvet / şantaj:** İSTİHBARAT → OPERASYONLAR → bir hedef → SİYASİ VE LOJİSTİK. Yalnız AI üyelere; insan üyeye "insan oyuncunun konsey oyunu kendisi verir" uyarısı çıkar.
- **Yıkıcı işlemler** (gezegeni tüket, Kolossus ateşi): her zaman tek oyunculudaki onay penceresinden geçer.

## 4. Sorun olursa

Ekran görüntüsü alın ve şunları not edin:
- ÇOK OYUNCULU çubuğundaki satırı (sürüm · bağlantı · aşama · son hata kodu);
- `<adres>/mp/version` çıktısını.

Son hata kodu örnekleri:
- `rules:human`: insana yapılamayan işlem.
- `rules:voted`: zaten oy verildi.
- `rules:stale`: ekran eskidi; pencereyi kapatıp yeniden açın.
- `rules:no-target`: hedef görülmüyor.

Oda kodu ekran görüntüsünde görünebilir; oyun bitince odayı kapatın. Jeton ve host anahtarı hiçbir ekranda görünmez.

## 5. Bilinen sınırlar

- Relay odaları bellekte tutar. Render servisi uyursa ya da yeniden başlarsa oda kapanır.
  - Host OYUNU KAYDET ile kaydeder.
  - Yeni odada KAYITLI OYUNA DEVAM ET ile sürdürür.
- Ücretsiz planda ilk açılış 30–60 sn sürebilir (servis uyanır).
