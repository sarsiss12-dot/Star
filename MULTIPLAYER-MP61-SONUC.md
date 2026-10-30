# STARS — MP.6.1: gerçek arayüzde işlevsel eşitlik + ortak oyun hızı

Durum: **geliştirme sürümü; misafirin temel filo / koloni / bilim / diplomasi / federasyon işlemleri gerçek STARS pencerelerinden çalışır.**
Savaş ilanı, ittifak/pakt, casusluk, pazar, elçi, sevkiyat ve birkaç özel işlem hâlâ engelli (§5).

- Taban: MP.6 `53c1024` (PR #18, açık; MP.5 PR #17 de açık).
- Değişmeyenler:
  - 19 runtime dosyası, build `96h10`, PWA `stars-v96h10`;
  - Save8 ve `releases/stars-faz96h10.zip`.
- Yeni ZIP yok: oyun motoru ve tek oyunculu arayüz koduna dokunulmadı.

## 1. Ortak oyun hızı

- **Tek yetkili kaynak:** host'un `G.speed`'i.
- **Misafir:** kendi ekranındaki gerçek STARS hız düğmesine dokununca `speed` komutu gider.
- **Host:** host kendi STARS düğmesine dokununca (`host.local`) aynı komut yürür. Yani aynı kurallar ve aynı bildirim.
- **Yayın:** komut motorun hız işlevini çağırır ve herkese `speed` iletisi gider.
- **Misafirde gösterim:**
  - yerel hız hep 0 (simülasyon yok);
  - hız düğmelerinden host'un gerçek hızındaki yanar.
- **Host'un iç duraklatmaları** (STARS penceresi açınca, arka plan, ağ, kayıttan devam): `speedSync` ile, değiştiğinde herkese yayınlanır (`auto` + neden).
- **Eşzamanlı istekler:** host'un işleme sırasıyla uygulanır; sonunda üç ekran da host'un hızını gösterir (tarayıcı testi).
- **Dönen oyuncu:** `hello` sonrası güncel hızı bildirimsiz alır.
- **Spam koruması:** oyuncu başına en az 700 ms ara, 20 s içinde en çok 8 değişiklik (`rules:rate-limited`).
  - Aynı hızın yeniden seçilmesi `rules:same`: bildirim yok.
- **Korunanlar:** host duraklatıldığında (arka plan / ağ) hız komutu `paused` ile reddedilir; MP.1.1 / MP.5 mekanikleri aynı. Tek oyunculu hız kodu değişmedi.
- **Ertelenen:** "Hız yetkisi: Herkes / Yalnız host" lobi ayarı (MP.6.2). Bunun için MP.4 kayıt paketindeki `settings` şeması genişlemeli; bu fazda varsayılan "herkes".

### Hız bildirimi

- Yer: hız çubuğunun (`#timepod`) **hemen üstündeki şerit**.
  - MP çubuğu bu şerit için bir sıra yukarı alındı.
  - Ölçülen aralık: hız çubuğunun 4 px üstü; sol kenar hız düğmeleriyle aynı.
- Metin ad taşır:
  - "Altın Othrys Konfederasyonu hızı 2× yaptı";
  - "… oyunu duraklattı";
  - değiştirenin kendi ekranında "Hızı 2× yaptın";
  - host penceresi açınca "… bir pencere açtı — oyun duraklatıldı".
- **Ad kaynağı:** alıcının bakışından ve oturumdan gelir, istemci ad göndermez.
  - Alıcı değiştirenin devletiyle temaslıysa devlet adı;
  - temaslı değilse lobideki oyuncu adı (lobi adları herkese açık).
  - Temas kurulmamış devlet adı hiç gitmez (Node testi).
- Davranış:
  - ~3 s sonra solarak kaybolur;
  - yeni değişiklikte güncellenir;
  - dokunmayı engellemez (`pointer-events:none`; tarayıcıda `elementFromPoint` ile doğrulandı).
- STARS penceresi açıkken bildirim üstteki durum hapında görünür.

## 2. Gerçek STARS düğmeleri → MP komutları

Üç yol var:

1. **Motor işlevi sarmalanır:** pencere, onay ve uyarılar gerçek arayüzde olduğu gibi çalışır; dünyayı değiştiren son çağrı host'a gider.
   - `orderMove`, `queueBuilding`, `queueShip`, `queueDemolish`, `cancelBuild`, `setFocus`
   - `researchTarget`, `setResearchMode`
   - `foundFederation`, `requestFederation`, `proposeFedMotion` (yalnız `admit`), `acceptFedInvite` / `rejectFedInvite`, `castFedVote`, `leaveFederation`, `proposeFedLaw`
   - `vassalOffer`, `vassalReply` (`demandVassal` / `seekProtection` bunları çağırır)
2. **`UI.act` kapısı:** tek oyunculu kodu dünyayı yerelde doğrudan değiştiren düğmeler komuta çevrilir.
   - hız, DUR, DURUŞ, AYIR, BİRLEŞTİR, tür ayır, otomatik keşif (tek / hepsi), KOLONİ KUR;
   - MP karşı teklif kartında kabul / ret.
3. **Gerçek gelen kutusu** (`DiplomaticInbox.resolve`):
   - federasyon daveti → `fedReply`;
   - federasyon oylaması → `fedVote`;
   - vasallık müzakeresi → `vassalReply`;
   - MP.3 teklifi → `respond`;
   - "Karşı teklif hazırla" → gerçek anlaşma penceresi → TEKLİFİ SUN → `counter`.

**Yeni host komutları** (`mp-core.js`): `ship`, `demolish`, `stop`, `stance`, `merge`, `split`, `splitType`, `explore`, `exploreAll`, `colonize`, `speed`.

- Her biri tek oyunculu düğmenin çağırdığı motor işlevini ya da aynı satırları, **yalnız komutu verenin kendi devleti için** yürütür.
- **Sahiplik:** başkasının filosu / sistemi `not-owner`; koloni gemisi yalnız kendi havuzundan seçilir.
- **Mevcut denetimler:** MP.0'ın `forged-empire`, sıra / tekrar, işlem ve RNG geri alma denetimleri aynen geçerli.
- **Ağdan = doğrudan motor:** gemi / yıkım / iptal / odak için Save8 ve RNG baytı aynı (Node testi).
- **Bildirim yönlendirme:** bu yeni komutlarda motorun "oyuncu" bildirimi (ör. "Koloni kuruldu") host günlüğüne değil, o oyuncunun kendi listesine gider.
  - Eski komutların Save8 baytları korunsun diye yönlendirme yalnız yeni komutlarda.

**Anlaşma penceresi:**

- Karşı tarafın stoğu aynada yok. Misafirin önizlemesi MP.3 `dipGate` kuralını uygular: yalnız kendi yükümlülükleri denetlenir; kesin denetim host'ta.
- Çok oyunculuda şimdilik yalnız kaynak ve barış maddeleri gönderilebilir. Diğer maddelerde açık uyarı çıkar.
- Misafirde anlaşma yerel uygulanmaz: `executeDeal` yanlış bir "imzalandı" göstermesin diye kapalı.

## 3. Ayna dünyaya eklenen yetkili veriler

| Veri | Kime | Not |
|---|---|---|
| Vasallık sözleşmesi ve müzakeresi | yalnız taraflara | Kimlikler yeniden numaralandırılır. MP.6 hatası düzeltildi: vasal misafirde `restoreVassalContracts` atıyordu. |
| Federasyon oylaması, davetleri, son oy sonucu | yalnız üyeye | AI değerlendirmeleri (`assessments` / `reasons`), hazine ve ortak savaş kararları girmez. |
| Federasyon daveti | yalnız davet edilene | Yalnız kendi daveti. |
| Federasyon başvuru sonucu | yalnız başvurana | Yalnız kendi başvurusu. |
| Ekonomi geçmişi | yalnız kendi satırı | Son 40 olay + 12 ay. Fark: olay ve ay listeleri "baştan düşür / sona ekle". |

- **Gerçek gelen kutusu:**
  - Motorun kendi `DiplomaticInbox.restore` → `sync`'i bu verilerden misafirin kayıtlarını kurar.
  - MP.3 teklifleri (insan ve AI → bu oyuncu) `aideal` kaydı olarak eklenir.
  - Host'un kendi gelen kutusu hiçbir misafire gitmez.
- **Girmeyenler (MP.6.2):**
  - haberler (kayıtların "bilgi kaynağı" host'un bakışından hesaplanıyor; oyuncu başına yeniden değerlendirme gerekir);
  - host'a özel olay / karar bildirimleri;
  - savaş defteri, kriz, kampanya, casusluk.
- **Boyut:** ekonomi geçmişi tam aynayı ~18 KB büyütür (500 günlük dünyada 45 sistem: ~41 KB; yalnız katılış / resync).
  - 20 günlük fark 24 KB'den 7,3 KB'ye indi (ay kapanışı dahil).

## 4. Pencere davranışı ve çakışmalar

- **Ayna bekletme:** gerçek onay penceresi (`#modal`) ya da diplomasi / federasyon sayfası açıkken gelen ayna uygulanmaz; pencere kapanınca uygulanır.
  - Neden: tek oyunculu onay pencereleri dünyanın kimliğini denetler (`G.sys!==world`, `world!==G.emps`, `ensureDiploWorld`). Tek oyunculuda da pencere açıkken oyun durur.
  - Bilim ekranı (aynı `#diploPane`) canlı güncellenir.
  - Komutlar beklemeden gider.
- **MP çubuğu:** STARS pencerelerinin altında kalır; açık pencerede yanlışlıkla dokunulamaz (tarayıcıda doğrulandı). Hız bildirimi şeridi için bir sıra yukarı alındı.
- **Durum hapı:** pencere açıkken ekranın üstünde bağlantı durumu + ortak hız gösterir.
  - Dokunulamaz; pencere düğmelerini örtmez (tarayıcıda ölçüldü).
  - Dikeyde "çevir" uyarısı varken hap ve bildirim gizli.
- **Yatay ölçüm:** 844×390, 915×412 ve 960×540'ta MP çubuğu, hız bildirimi, hız çubuğu, sol araçlar ve kenar çubuğu düğmesi birbirini örtmez; yatay taşma yok (host ve misafir).
- **Bilinen:** host bir STARS penceresi açınca motor oyunu duraklatır. Bu, MP.0'dan beri var; artık herkese bildiriliyor.
  - Pencere kapanınca STARS kendi kuralıyla geri yükler (`prePause || modalPrevSpeed`). Önceki hız olmayabilir.
  - Herkes yine aynı gerçek hızı görür.

## 5. Çalışan / engelli komutlar

| Alan | Çalışan (gerçek STARS düğmesi → host) | Hâlâ engelli |
|---|---|---|
| Hız | ⏸ ▸ ▸▸ ▸▸▸ ▸▸▸▸ | — |
| Filo | rota, DUR, DURUŞ, AYIR, BİRLEŞTİR, tür ayır (⊟1 / hepsi)\*, otomatik keşif (tek; hepsi\*), KOLONİ KUR | sevkiyat, gemi iptali, bileşim şablonu, toplanma / döngü noktası, takviye, liderler, onarım |
| Koloni / sistem | bina, gemi üretimi, odak, yıkım (onaylı), kuyruk iptali | terraform, habitat, reform, uzaktan inşaat |
| Bilim | hedef, sıra, kip | — |
| Diplomasi | anlaşma penceresi (kaynak + barış), gelen kutusu kabul / ret / karşı teklif | savaş ilanı, ittifak, pakt, hediye, ambargo, elçi, fısıltı, statüko |
| Federasyon | oy (gelen kutusu); kur\*, başvur\*, üye davet önergesi\*, davet kabul / ret\*, yasa öner / kaldır\*, ayrıl\* | ihraç / reform / anayasa / ortak savaş önergesi, karar uygula, hibe |
| Vasallık | talep\*, himaye\*, yenileme\*, bağımsızlık\*, karşı teklif\*, gelen kutusundan kabul / ret\* | bağımsızlık desteği |
| Casusluk / pazar | — | tamamı |

\* Bağlandı, ama bu düğmeden tarayıcıda gönderim denenmedi. Komutların kendisi MP.3.1 / MP.6.1 Node testlerinde doğrulandı.

**Tarayıcıda gerçek dokunmayla kanıtlananlar:**

- hız;
- DURUŞ, AYIR, BİRLEŞTİR, DUR, otomatik keşif;
- tersane, odak, yıkım + onay, iptal, KOLONİ KUR;
- anlaşma penceresi → teklif; gelen kutusundan kabul, karşı teklif ve ret;
- federasyon oyu.

**Yalnız Node'da kanıtlananlar** (çekirdek komut + ayna):

- tür ayır, otomatik keşif (hepsi);
- vasallık kayıtları ve gelen kutusu kaydı.

Federasyon kur / başvur / davet / yasa ve vasallık penceresinin gönderimi aynı MP.3.1 komutlarına bağlandı. Tarayıcıda bu pencerelerden gönderim **ayrıca denenmedi** (MP.6.2 testi).

## 6. Testler

- `tests/mp61_core_test.js` — **9/9 PASS**:
  - hız (yayın, ad gizliliği, same, spam, local, speedSync, dönüş, duraklatma, RNG);
  - filo ve koloni komutları (sahiplik; ağ = doğrudan motor);
  - kolonileştirme ve bildirim yönlendirme;
  - vasallık, federasyon ve ekonomi aynası.
- `tests/browser-mp61.cjs` — **13/13 PASS**: 3 ayrı Chromium (host 915×412, B 844×390, C 960×540), gerçek dokunma.
- `tests/browser-mp6.cjs` — MP.6.1'de çalışan eylemler (hız, duruş, birleştirme…) "engelli" listesinden çıkarıldı.
  - Engelli denetimi artık hâlâ desteklenmeyen 8 eylemle yapılıyor.
  - Rota denetimi aynanın gelmesini bekliyor.

## 7. Performans (masaüstü Chromium; telefon NOT RUN)

| | 45 sistem | 60 sistem | 100 sistem |
|---|---|---|---|
| Tam ayna (yeni oyun) | 16,6 KB | 20,6 KB | 30,3 KB |
| 10 günlük fark | 0,3 KB | 1,0 KB | 0,3 KB |
| Misafir kurulum (`deserialize`) | 10,2 ms | 7,7 ms | 9,7 ms |
| 2 misafir için ayna üretimi | 3,0 ms | 0,8 ms | 1,3 ms |

- **Canlı oyunda misafir yeniden kurulumu:** 6,5–24,2 ms.
- **Host ayna iletileri:** 80 B – 4,3 KB.
- **Dokunuş → host'ta uygulanma:** 294–606 ms. Test yoklaması ve yerel relay dahil; gerçek ağda gidiş-dönüş eklenir.
- **Panel açılma:** 306–367 ms (Playwright dokunma süresi dahil).
- **Pencere açıkken bekletilen ayna:** 8 kez (tek test akışında).
- **Telefon:** düşük / orta seviye Android'de `deserialize` süresi ölçülmedi (NOT RUN). Masaüstü süresinin birkaç katı olabilir.

## 8. Regresyon

| Test | Sonuç |
|---|---|
| Tam Node regresyonu | 152 paket: 6228 GEÇEN / 3 KALAN (yalnız bilinen `faz95d_identity` seed 11/99/404) |
| `mp61_core` / `browser-mp61` | 9/9 · 13/13 PASS |
| `browser-mp6` | 11/11 PASS |
| `browser-mp5` / `mp5_docker` | 10/10 (Docker kipi) · 6/6 PASS |
| `browser-mp4` (kayıt / yükleme) | 13/13 PASS |
| `browser-mp0` / `mp1` / `mp11` / `mp2` / `mp3` / `mp31` | 20/20 · 22/22 · 10/10 · 14/14 · 12/12 · 11/11 PASS |
| `browser-96h10` (tek oyunculu) | 27/27 PASS |
| ZIP / SHA-256 / CRC32 / manifest | değişmedi; `verify-release --root` DOĞRULANDI |

- **Notlar:**
  - `browser-mp6` ilk koşuda 1 FAIL verdi: bina kuyruğu denetimi, aynanın gelişini beklemeden bakıyordu (MP.6'daki aynı zamanlama yarışı). Denetim beklemeye çevrildi, sonra 11/11.
  - MP.6.1'den önceki ilk ara koşuda `mp31_core` 1 FAIL verdi. Neden: bildirim yönlendirmesi eski komutlarda Save8 baytını değiştiriyordu. Yönlendirme yalnız yeni komutlarla sınırlandı.

## 9. Açık sorunlar / MP.6.2

1. Savaş ilanı, ittifak / pakt / ittifak bitirme, hediye, ambargo için yetkili MP komutları. Savaş ilanı önizlemesi oyuncuya özel istihbarat ister.
2. Casusluk ve pazar: oyuncuya özel istihbarat ve pazar verisi aynaya girmeli. Başka devletin gizli bilgisi kopyalanmadan tasarlanmalı.
3. Sevkiyat, gemi iptali, bileşim, toplanma / döngü noktası, liderler, terraform / habitat / reform, uzaktan inşaat.
4. Federasyon ihraç / reform / anayasa / ortak savaş önergeleri ve karar uygulama. Vasallık bağımsızlık desteği.
5. Haberler (oyuncu başına bilgi kaynağı), olay / karar bildirimleri.
6. "Hız yetkisi: Herkes / Yalnız host" lobi ayarı (MP.4 paket şeması).
7. Host penceresinin herkesi duraklatması: çok oyunculuda istenip istenmediği tasarım kararı.
8. Tarayıcıda federasyon kur / davet / yasa ve vasallık penceresi gönderiminin ayrıca denenmesi.
9. Telefonda `deserialize` maliyeti; gerekirse ayna sıklığının uyarlanması.

## 10. NOT RUN

- Fiziksel Android: dokunma, yön kilidi, performans.
- Gerçek internet.
- LAN.
