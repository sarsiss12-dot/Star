# STARS — MP.7.4: lobi hataları, küçük çok oyunculu düğmesi, kaydırılabilir bildirimler, karttan hızlı diplomatik karar

**Durum:** geliştirme sürümü.
- Taban: MP.7.3 `8bdcdcb` (PR #27).
- Runtime değişti: `ui.js`, `index.html`, `main.js` (BUILD_ID), `sw.js` (önbellek).
- Build `96h10p3`, PWA `stars-v96h10p3`, Save8 (şema değişmedi).
- Yeni oyun ZIP'i: `releases/stars-faz96h10p3.zip` (`RELEASE-MP74.json`).

Kaynak: kullanıcının iki gerçek Android telefonla Render üzerindeki testi.
- **Çalışan:** iki telefon aynı oyuna girdi, misafir haritayı gördü.
- **Bulunan hatalar:**
  - A: 8 karakterli kod uzun;
  - B: çift KATIL → "ODA DOLU";
  - C: 2 insanlık odada misafirin lobiye geçememesi;
  - D: sol alttaki uzun çubuk haritayı kaplıyor.

## 1. Çift KATIL ve "oda dolu" (B) — kök neden

`join.js connect()` korumasızdı.
1. İkinci dokunuş ikinci WebSocket'i açıyordu.
2. İlk soket kapatılmıyor, `onmessage` işleyicisiyle açık kalıyor ve relay'de koltuğu tutuyordu.
3. İkinci soket `room-full` (4005) alıyordu.
4. İstemci yalnız ikinci soketi izlediği için ekrana "Oda dolu." düşüyordu. İlk soket görünmez biçimde koltukta kalıyordu.

Düzeltme üç katmanda:

**İstemci.** Kurulan / açık soket varken `connect()` yeni soket açmaz. Önceki soket varsa önce kapatılır. KATIL düğmesi bağlantı sürerken kapalıdır ve "BAĞLANIYOR…" yazar.

**Relay.** Sekme etiketi `dev`: sekme başına rastgele 128 bit, `sessionStorage`'da.
- Aynı etiketle gelen yeni soket öncekinin yerine geçer: eskisi 4009, host'a `L`.
- Başka sekmenin / telefonun soketine dokunulmaz.
- Geçersiz etiket yok sayılır.
- Etiket kimlik değildir: oyuncu kimliği host'taki jetondur. Jeton ve anahtar URL'de yok.

**Lobi açılışı.** Lobi ekranına geçişten sonraki 700 ms'deki dokunuşlar yutulur. Çift dokunmanın ikinci dokunuşu aynı noktadaki lobi düğmesine düşüyordu (tarayıcı testinde "devletini tasarla" açıldı; aynı yerde ODADAN AYRIL da olabilirdi).

## 2. İnsan kapasitesi (C)

Host'ta (`mp-core`), oyun başlamadan, oda doluyken **en eski bağsız misafir kaydı** yeni gelene yer açar. Böyle kayıtlar çift KATIL'ın ilk soketinden ya da jetonu kaydedilmeden kapanan sekmeden kalıyordu.
- Bağlı oyunculara ve oyun başladıktan sonraki koltuklara dokunulmaz (`game-started`).
- Jetonla dönen oyuncu kendi kaydına döner.

Kapasite → misafir: 2 → 1, 3 → 2, 4 → 3.
- Node'da üç kapasite de sınandı; tarayıcıda host + 1 ve host + 2.
- Bir fazlası "oda dolu" alır.
- Kapasite değişimi kimseyi atmaz.
- Relay kapasitesi oda kurulunca ve her değişiklikte host'tan gönderilir (`pushCap`). Varsayılan 1, varsayılan kapasite 2 ile aynı; sıra yarışı yok.

## 3. 5 karakterli oda kodu (A) ve güvenlik telafisi

- Kod 5 karakter: 31 sembollü karışmayan alfabe, tiresiz (örn. `K7M2P`).
- Davet bağlantısı, kopyalama, otomatik doldurma ve yeniden bağlanma 5 karakterle çalışır.
- Çakışmada yeniden üretim aynen (açık ve kapanmış kodlar hariç).
- Kod host yetkisi değildir: host anahtarı ilk çerçevede, aynen.

**Ödünleşim.** Kod uzayı 31⁸ ≈ 8,5·10¹¹'den 31⁵ ≈ 2,9·10⁷'ye indi. Telafi:
- IP başı yanlış kod / anahtar sınırı 60 → **20 / 10 dk**.
- Relay geneli **120 / 10 dk** yanlış deneme sınırı. Aşılınca 10 dk içinde yanlış denemesi olan her IP bekletilir. Temiz IP'ler ve doğru kodlu oyuncular etkilenmez.

Hesap (10 açık oda):
- tek IP'nin günlük isabet olasılığı ≈ 1,0·10⁻³;
- relay genelinde ≈ 6,0·10⁻³.

**Kalan risk:** çok sayıda farklı IP'den tekil denemeler. Kazanılabilecek şey yalnız lobi aşamasındaki bir odaya katılmaktır: oyun başladıktan sonra yeni oyuncu alınmaz; host atabilir / yasaklayabilir.

## 4. Küçük çok oyunculu düğmesi (D)

Kapalıyken sol altta "👥 n" (bağlı insan sayısı) ve bağlantı noktası: yeşil = bağlı, turuncu + ⚠ = sorun. Ölçü ≈ 71×46 px, hız kutusuyla örtüşmez.
- **Dokununca** mevcut panel açılır (yeni panel yok).
  - Host: kod, durum, misafirler, kopan misafir için kararlar, akıllı duraklatma, OYUNU KAYDET / DOSYAYA AKTAR, sürüm ve yeniden bağlanma.
  - Misafir: durum ve tanı satırı (sürüm · bağlantı · aşama · son hata).
- **Tekrar dokununca** kapanır.
- **Kritik durum** (kopan misafir / host yok) paneli kendiliğinden açar.

## 5. Kaydırılabilir bildirim kartı

Üst bildirim kartı parmakla sağa ya da sola kaydırılır. Pointer olayları kullanılır: CDP gerçek dokunma olaylarıyla sınandı.
- 12 px'den küçük ya da dikey hareket kartı oynatmaz.
- Kartın %35'i (en az 80 px) aşılınca kapanır; aşılmazsa yerine döner. Kaydırmadan hemen sonraki tıklama yutulur.

**Kaydırmak yalnız kartı ekrandan kaldırır.** Karar vermez, kaydı silmez.
- **Diplomatik karar kartları** (Gelen kutusunun desteklediği türler): kayıt Gelen kutusunda BEKLER. Aynı kayıt yeniden kullanılır, ikinci kayıt oluşmaz.
- **Bilgi kartları** (`wardec`, `warstart`, `crisend`, `cncnew`) kalkar.
- **Karar bekleyen olaylar** (olay zinciri, anomali, fraksiyon, kriz, konsey oyu…) Gelen kutusunda değildir; kaydırılınca yerine döner ve "karta dokunup karar ver" uyarısı çıkar. Kaybolmazlar.
- **Hız:** oyunu duraklatan kart kaydırılarak / karttan karar verilerek kapanırsa ve duraklatan başka kart ya da açık pencere yoksa önceki hız döner. Elle duraklatma korunur. MP'de MP.6.3 akıllı duraklatma host'ta aynen geçerlidir.
- **Misafirde** kaydırılan kartın imzası saklanır; ayna yenilenince kart geri gelmez.

## 6. Karttan hızlı karar

Aynı kart tasarımı tek oyunculuda ve çok oyunculuda kullanılır. Yeni karar motoru yok: düğmeler Gelen kutusu penceresinin yolunu çağırır (`DiplomaticInbox.resolve`; karşı teklifte `aiDealOpen`, aynı `offCounter`).

| Kart | Düğmeler |
|---|---|
| Ticaret teklifi (AI ve insan; `aideal`) | KABUL · REDDET · KARŞI TEKLİF (gerçek anlaşma penceresi) |
| Antlaşma teklifi (`pact`) | KABUL · REDDET |
| Federasyon daveti (`invite`) | KABUL · REDDET |
| Federasyon oyu (`fedvote`) | EVET · HAYIR |
| Vasallık teklifi / karşı teklifi (`submit`, `vassal`), barış, statüko, ortak savaş kararı | hızlı düğme yok — karta dokununca gerçek onay penceresi (iki aşamalı / savaşla ilişkili) |

- **Tek oyunculu:** motor kararı aynen; kayıt sonuçlanır, kart kalkar, bekleyen sayısı düşer. İkinci dokunuş etkisiz (kayıt artık bekliyor değil).
- **Misafir:** karar MP komutu olarak host'a gider (MP.6.1 / MP.7.1 yolu). Eskiden kayıt hemen "kabul edildi" görünüyordu; artık **host'un sonucu gelene kadar BEKLİYOR** kalır.
  - Kartta "yanıt bekleniyor" yazar.
  - Sonuç gelince kayıt ve kart güncellenir; red durumunda host'un gerekçesi gösterilir.
  - Bekleyen karar komut hedefine göre tutulur: ayna kaydı yeniden kursa da çift dokunma **tek komut** gönderir (tarayıcıda ölçüldü: 1 `respond`).
- **Host:** insan teklifinde MP.7.1 köprüsü aynen; kabul bir kez uygulanır.

## 7. Testler

**Node:**
- `mp74_lobby_test` 5/0: kapasite 2/3/4, bağsız kayıt, jetonla dönüş, kapasite değişimi, oyun sonrası.
- `mp74_notice_test` 6/0: kabul bir kez, ret, karşı teklif penceresi, kaydırma türleri, düğme kümeleri, hız dönüşü / elle duraklatma.
- `mp5_relay_security_test` 13/0: 5 karakter hesabı, relay geneli sınır, sekme etiketiyle değiştirme ve yarış.
- `mp1_relay_test` 14/0, `mp11_online_test` 9/0.

**Chromium — `browser-mp74` 7/0.** Üretim relay + parçalayan TLS vekili; yatay 844×390 / 800×360 / 915×412; gerçek dokunma (CDP).
- **A1:** 5 karakterli kod; yanlış kod; 600 ms gecikmeli ağda KATIL'a üç hızlı dokunma → relay'de 1 koltuk, "oda dolu" yok.
- **A2:** küçük düğme (host + misafir) aç / kapat.
- **A3:** kaydırma — küçük hareket, sağa / sola, karar bekler, ayna sonrası geri gelmez.
- **A4:** misafir KABUL (çift dokunma tek komut), REDDET, KARŞI TEKLİF.
- **A5:** host KABUL.
- **B1:** kapasite 3, iki misafir çift dokunmayla; dördüncü telefon "Oda dolu.".
- Sayfa hatası yok.

**Yalnız Node'da:**
- federasyon oyu / daveti düğme kümeleri;
- 4 insanlık kapasite (host + 3);
- tek oyunculu karar ve hız dönüşü.

Regresyon: `research/mp74/evidence/REGRESYON.md`.

## 8. Dağıtım

Render (`research/mp73/ANDROID-TEST.md` §0 aynı):
- **Branch:** `claude/stars-mp74-lobby-notifications`.
- **Doğrulama:** `<adres>/mp/version` → `"mp":"MP.7.4","build":"96h10p3"`.
- Telefonlarda eski STARS sekmelerini kapatıp yeniden açın: yeni önbellek adı eskisini siler.

Bu oturumdan dağıtım yapılmadı. Canlı Render ve fiziksel Android **NOT RUN**.
