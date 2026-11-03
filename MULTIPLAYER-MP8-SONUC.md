# STARS — MP.8: uzun oyun dayanıklılığı, host / misafir senkronizasyonu, kayıt / kurtarma, ağ kopması

**Durum:** geliştirme sürümü.
- Taban: PERF.2 `cadf66f` (PR #30).
- **Runtime değişmedi:** 19 dosya ve build `96h10p5` aynı, yeni oyun ZIP'i yok. Save8 ve RNG'ye dokunulmadı.
- Değişenler yalnız MP istemci / sunucu dosyaları: `research/mp6/client/guest-stars.js`, `research/mp1/client/join.js`, `view.js`, `mp1-host.js`, `research/mp1/server/relay.js` (yalnız sürüm adı).
- MP sürümü `MP.8`.

Fiziksel Android, gerçek internet ve canlı Render **NOT RUN**. Tüm sonuçlar bu konteynerde: Node v22, Chromium (Playwright), Docker 29.

## 1. Neden yeni düzenek, ne sınandı

Eski uçtan uca testlerin kapsamı:
- `browser-mp4` (kayıt / devam) ve `browser-mp5` (kopmalar) **MP.2 basit istemcisini** (`/mp/join`) kullanıyordu.
- Uzun oyun ölçümü (`browser-mp75-perf`) komut göndermiyordu.

Gerçek STARS misafir arayüzü (`/mp/play`), MP.7 tasarım lobisi ve uzun oyunda komut + senkron karşılaştırması birlikte hiç sınanmamıştı.

`tests/browser-mp8.cjs` (yeni; mevcut yardımcıların kalıbıyla):

| Bileşen | Nasıl |
|---|---|
| Relay | Üretim kipi, **ayrı süreç** (`MP1_BIND 0.0.0.0`, `MP1_TRUST_PROXY=1`, https `MP1_ORIGINS`) |
| Ağ | Büyük çerçeveleri parçalayan TLS vekili (MP.7) + oyuncu başına kesilebilir / dondurulabilir TCP hattı (MP.5 ile aynı) |
| Oyuncular | Her biri **ayrı Chromium süreci**, ayrı kalıcı profil (IndexedDB / localStorage); yatay telefon görünümleri (844×390, 800×360, 915×412) |
| Lobi | MP.7 tasarım kipi: her oyuncu kendi devletini gerçek kurulum ekranında tasarlar |
| Misafir | Gerçek STARS arayüzü (`/mp/play`), simülasyon yok (hız 0) |
| Zaman | Host sayfasında deterministik gün adımı; her oyun günü yayın (mp1-host'un "gün değişti" kuralı) |
| Komutlar | Misafir sayfasından misafirin kendi WebSocket'i ve MP komut yolu (`MP1Join.cmd`); host oyuncu `host.local` |
| Fikstür (açıkça) | Yalnız insan devletler arasında temas: insan–insan diplomasisi için. Kaynak / teknoloji eklenmez. |

**Kampanya turu** (her 6 ayda; B'de her 12 ayda): misafir(ler)
- araştırma, filo hareketi, bina, gemi;
- insana ve AI'ya teklif, gelen kutusundaki teklifin kabulü;
- savaş ilanı, iki tur sonra insan → AI barış teklifi;
- federasyon kurma ve konsey oyu denemesi.

Komutların adayları **motorun kendi kapılarından** (`COMMANDS[...].why`) seçilir; uygun koşul yoksa denenmez ve "atlandı (neden)" kaydedilir. Zorla başarı yok.

**Her komut sonrası host gerçeği yoklanır:**
- `ok` → etki **tam bir kez** (sayaç +1, hedef rota, kuyruk);
- red → **etki yok**.

**Her turda senkron denetimi:**
1. **Ayna:** misafirin farklarla kurduğu ayna = host'un o misafire son gönderdiği ayna (aynı `rev` + kanonik SHA-256). Host'un 700 ms ayna kısıtlayıcısının ertelenmiş gönderimi beklenir: "son durum mutlaka gider" garantisi de sınanır.
2. **Dünya:** misafirin kurduğu dünya ↔ host gerçek durumu.
   - Karşılaştırılanlar: kaynaklar (±1), koloni sayısı, teknolojiler, filolar (kimlik @ konum # gemi), savaş ve ittifak kümeleri (π = 0 ↔ kendi kimliği), gün, hız, ad, yıkılmışlık.
   - Sahiplik: `MP1Join.empireId` = koltuk.
3. **Gizlilik:**
   - yabancı devletlerin kaynak / teknoloji / kuyruğu aynada boş;
   - aynada hiçbir oyuncu jetonu, gerçek galaksi tohumu ya da RNG durumu yok.
   - Aynadaki `seed` alanı oda kimliğinden türetilen kozmetik tohumdur; tasarım gereği.

## 2. Sonuçlar (son aday, tam regresyonda)

| Senaryo | Kurulum | Sonuç | Senkron denetimi | Uygulanan komut | Komut gecikmesi p50 / p95 | Ayna gecikmesi p50 / p95 |
|---|---|---|---|---|---|---|
| A | orta, 2 insan + 5 AI, s11, 120 ay | **2 / 2 PASS** | 21, hepsi birebir | 142 | 33 / 61 ms | 541 / 862 ms |
| B | büyük, 2 insan + 8 AI, s404, 240 ay + 4× CPU | **3 / 3 PASS** | 22, hepsi birebir | 118 | 39 / 74 ms | 627 / 885 ms |
| C | büyük, 3 insan + 6 AI, s23, 120 ay | **2 / 2 PASS** | 42, hepsi birebir | 252 | 45 / 102 ms | 580 / 1069 ms |
| R | orta, 3 insan + 5 AI, s11, 60 ay → kayıt → kapanış → devam + 6 ay | **5 / 5 PASS** | 28, hepsi birebir | 138 | 46 / 91 ms | 815 / 1091 ms |
| N | orta, 3 insan + 5 AI, s22, ağ olayları | **9 / 9 PASS** | 20, hepsi birebir | — | — | 733 / 1177 ms |

- **Ayna gecikmesi:** host yayınından misafirin aynı `rev`'e ulaşmasına kadar. Büyük kısmı bilinçli 700 ms ayna kısıtlayıcısıdır.
- **Komut türleri** (son koşu, toplam):
  - araştırma, filo hareketi, bina, gemi, insan / AI teklifi, gelen kutusu kabulü: her senaryoda;
  - savaş ilanı ve insan → AI barışı: A, B, C, R'de; AI kabul etti, savaş iki tarafta da bitti;
  - konsey oyu: A, B, C'de;
  - federasyon kuruluşu: R'de (motor kapısı açıldığında).
- **Kampanyalarda kendiliğinden oluşmayanlar:**
  - AI → insan barış teklifi;
  - insanlar arası vasallık;
  - federasyon oyu.

  Bunlar zorlanmadı. Fikstürlü gerçek arayüz testlerinde kapsanıyor (`browser-mp31` / `mp62` / `mp63` / `mp71` / `mp73` / `mp75`; regresyonda PASS).
- **İlk B koşusunda** (aynı seed) iki insan devlet ~160. ayda krizde (Sürü) gezegenlerini yitirdi: otomatik oyuncu savunma yapmaz. Sonraki aylarda komut adayı kalmadı. Senkron ve yıkılmışlık bayrağı her turda birebir sürdü. Son koşuda devlet 240. aya kadar yaşadı ve son 40 ayda 24 komut uygulandı.

## 3. Kayıt ve devam (R)

**Akış:**
1. 60 ay kampanya (savaş, barış, federasyon kuruluşu, teklifler).
2. C → B bekleyen teklif.
3. Host **OYUNU KAYDET** (IndexedDB).
4. **Bütün Chromium süreçleri ve relay süreci kapanır**, yeni relay süreci başlar (farklı PID).
5. Host aynı profille yeni süreçte **KAYITLI OYUNA DEVAM ET** → yeni oda kodu.
6. Misafirler yeni kodla gerçek STARS arayüzünden gelir; cihazlarındaki kimlikle **aynı devletlere** döner.
7. Host **DEVAM ET**.

**Kayıttan önce / sonra birebir aynı:**
- gün, RNG;
- MP teklif deposu (durumlarla);
- insan devletlerin savaşları;
- federasyonlar ve oyları, konsey;
- vasallık bağları;
- insan devletlerin AI bayrağı (yanlış: AI'ya geçmez), koloni ve filo sayıları;
- ortak hız.

**Ayrıca:**
- kayıt Save8 / RNG'yi değiştirmez;
- pakette jeton yok (659 KB);
- bekleyen teklif devamda **tam bir kez** kabul edilir, ikinci kabul `rules:closed`;
- devam sonrası 6 ay daha kampanya, her turda senkron.

**Relay yeniden başlatılınca kaybolan:** bellekteki oda (kod, bağlantılar). Oyun kaybolmaz: host dünyası değişmez (RNG aynı) ve duraklar; misafir "Sunucu yeniden başlatıldı; oda kapandı." görür. Devam yalnız kayıt + yeni oda ile (Render Free yeniden başlatmasında da aynı model). Kalıcı sunucu odası yoktur.

## 4. Bağlantı kopması (N)

| # | Olay | Sonuç |
|---|---|---|
| N0 | C oyun başlarken 3 s kopar | C kendi devletiyle oyuna girer |
| N1 | B 5 s kopar | ~6,5 s'de aynı devlete döner; yeni koltuk yok; ayna birebir |
| N2 | B 30 s kopar, host 10 gün ilerler | ~37 s'de döner; kaçırılan farklar tam aynayla kapanır |
| N3 | C → B teklif açıkken B kopar | Teklif bekler; B tam bir kez kabul eder (kaynak bir kez); ikinci kabul `rules:closed` |
| N4 | B bina komutu gönderir, hat aynı anda kesilir | Host **tam bir kez** uyguladı, yanıt kayboldu; misafir sonucu yeniden eşitlemeyle gördü (kuyruk host'la aynı) |
| N5 | Host 8 s kopar | Misafirde komut gönderilmez (`host-yok`); host'ta zaman durur (Δ gün 0); dönünce senkron |
| N6 | Aynı oyuncu aynı tarayıcıda ikinci sekme | Yeni oyuncu kaydı / koltuk yok, başka devlet açılmaz; ilk sekme devletini korur. **MP.8 düzeltmesi:** mesaj (§5.2) |
| N8 | Karar komutu ölü sokete gider (sessiz kopma) | **MP.8 düzeltmesi** (§5.1): host komutu hiç almaz; dönünce misafir yeniden karar verebilir; host tam bir kez uygular |
| N7 | Relay yeniden başlatılır | Oda kapanır, misafir açık mesaj görür, host dünyası değişmez |

**Kayıp ve tekrar eden komut:**
- Host her komutu motor kapısından geçirir. Kapalı teklife ikinci yanıt `closed`, tekrar eden oy `voted`, aynı teklif `duplicate`.
- Misafir kayıp yanıtı beklemez: yeniden bağlanınca tam ayna gerçek sonucu gösterir.
- İstemci komutu kendiliğinden yeniden göndermez.

## 5. Bulunan hatalar ve minimal düzeltmeler

### 5.1 Ağ kopmasında kaybolan karar gelen kutusunu kalıcı kilitliyordu (gerçek hata)

**Yeniden üretim** (N8):
1. Misafir B'nin hattı donar: veri akmaz, soket açık; Android'de ağ değişimi gibi.
2. B gelen kutusundan (gerçek `DiplomaticInbox.resolve` yolu) teklifi kabul eder. Komut ölü sokete gider ve host'a hiç ulaşmaz.
3. Bağlantı döner; host'ta teklif hâlâ `pending`.
4. B yeniden karar vermek ister → **"Karar gönderildi; host yanıtı bekleniyor"**. Sayfa yenilenene kadar.

**Kök neden:** MP.7.4'ün çift dokunma kilidi (`S.decWait`) yalnız host yanıtıyla açılıyordu. Önceki bağlantıda gönderilen komutun yanıtı hiç gelmez: relay iletileri tamponlamaz.

**Düzeltme** (`guest-stars.js`, ~6 satır):
- Kilit bağlantı kuşağına bağlandı. Host her yeni bağlantıda (ve yeniden eşitlemede) tam ayna yollar; tam ayna gelince kuşak artar ve önceki kuşağın kilitleri geçersiz olur.
- Gerçek sonuç aynada: uygulandıysa kayıt kapalıdır, uygulanmadıysa oyuncu yeniden karar verebilir.
- Tam-bir-kez kuralı host'ta (`closed`).
- Aynı bağlantıdaki çift dokunma koruması aynen: `browser-mp74` A4 "çift dokunma tek `respond`" PASS.

**Kanıt:** düzeltmeden önce N8 FAIL (`second: {ok:false, why:"…yanıt bekleniyor"}`), sonra PASS (`second: {ok:true}`); host teklifi bir kez `accepted`.

### 5.2 Aynı oyuncunun ikinci sekmesi "Oda dolu." görüyordu (yanıltıcı mesaj)

**Kök neden:** relay dolu odada yeni sekmenin soketini jeton host'a ulaşmadan 4005 ile kapatır. MP.7.4 sekme etiketi bilerek yalnız aynı sekmenin soketini değiştirir. Koltuk güvenliği doğru.

**Düzeltme** (`join.js`, `view.js`): bu tarayıcıda bu odanın oyuncu kimliği varsa mesaj "Bu oyuncu bu odada başka bir sekmede ya da pencerede bağlı. O sekmeyi kapatıp yeniden dene."
- Başka telefon (kimliksiz) yine "Oda dolu." görür: mp1 / mp11 / mp5 / mp74 PASS.
- Relay kuralı değişmedi.

### 5.3 Düzenek hataları (oyun hatası değil, düzeltildi)

- Eşitleme beklemesi host'un ertelenmiş ayna gönderimini beklemiyordu. Geçici "misafir minerali 50 fazla" farkı buydu; ertelenmiş gönderim sonrası birebir.
- Bina komutu adayında koloni konumu kurulmuyordu.
- Gelen kutusu kayıtları `records`'ta.

## 6. Performans ve bellek (masaüstü Chromium; telefon değeri değildir)

| | Host ay adımı medyan / p95 | Host uzun görev | Misafir kurulum medyan / p95 | Misafir `refresh` p95 | Misafir uzun görev |
|---|---|---|---|---|---|
| B 120. ay (24 ay penceresi) | 98 / 152 ms | 2 (en uzun 60 ms) | 17 / 27 ms | 17 ms | 0 |
| B 240. ay | 133 / 198 ms | 4 (en uzun 57 ms) | 18 / 36 ms | 13 ms | 1 |
| B 240. ay, **4× CPU yavaşlatma** (CDP, host + misafir) | 789 ms (2 örnek) | 25 (en uzun 129 ms) | 54 / 97 ms | 70 ms | 58 (en uzun 190 ms) |
| C 120. ay (3 insan) | 160 / 221 ms | — | 22 / 56 ms (B), 18 / 55 ms (C) | 19–20 ms | 7 / 21 |

- **4× yavaşlatmada:** 60 günlük ilerletme 3,6 s, eşitleme ~1 s. CPU yavaşlatma gerçek Android işlemcisi değildir.
- **PERF.2 korunuyor:**
  - AI / ekonomi dosyalarına dokunulmadı;
  - `perf2_equivalence_test` ve `perf1_equivalence_test` tam regresyonda PASS;
  - MP host ay adımı (240. ay p95 198 ms) PERF.2'nin tek oyunculu Chromium ölçümüyle (s404 240. ay p95 188 ms) aynı bantta.
- **MP.7.5 misafir kazanımları korunuyor:**
  - açık panel baştan yazılması yok (`browser-mp75` PASS);
  - kurulum p95 ≤ 56 ms (yavaşlatmasız).
- **Uzun kampanyada (120–240 ay) sızıntı yok:**
  - host ve misafir DOM düğümleri (700–810), etkin `setInterval` (host 2, misafir 3) ve misafir `setTimeout` (1) sabit;
  - yığın trendsiz dalgalanıyor.
- **Büyüyen listeler sınırlı:**
  - misafir paket günlüğü 3000'de kırpılır;
  - host teklif deposu kapalı kayıtları 160'ta kırpar (`DIP_KEEP`);
  - misafir `MP1Join.results` komut başına bir küçük kayıt: oyuncu eylemiyle sınırlı, genel temizlik eklenmedi.

## 7. Telefon testi için tanı satırı

Mevcut küçük MP panelindeki satır genişletildi. Jeton, oda anahtarı ve istihbarat yok.
- **Misafir:** `STARS MP.8 · oyun 96h10p5 · misafir · host bağlı · aşama: ready · ayna r153 15:07:52 · kurulum 17 ms · son komut: ok · son hata: yok`
- **Host:** `STARS MP.8 · oyun 96h10p5 · host · 2/2 misafir bağlı · son ay adımı 133 ms · yeniden bağlanma 0`

Host'taki ay adımı süresi yalnız `performance.now` ölçümüdür: argüman, dönüş, RNG ve sıra aynı.

## 8. Kalıcılık sınırı (bilinen, değişmedi)

Kaydırılmış karar olayının `hidden` işareti kayda yazılmaz (MP.7.5'te belirtildi; `NOTE_FIELDS`). Yükleme sonrası kart yeniden görünür; karar kaybolmaz. Save8 şeması bu nedenle değiştirilmedi.

## 9. Testler

Ayrıntı: `research/mp8/evidence/REGRESYON.md`.

- **Node tam koşu:** 172 paket, 6364 / 3. 3 KALAN = bilinen `faz95d_identity`.
- **Chromium:** mp75 … mp0, 96h10, mp5, mp5_docker ve MP.8 A / B / C / R / N PASS. browser-mp74 için aralıklı A5 notu: REGRESYON.md.

## 10. Dağıtım

Render:
- **Branch:** `claude/stars-mp8-stability-audit`.
- **Doğrulama:** `<adres>/mp/version` → `"mp":"MP.8","build":"96h10p5"`.
- Rehber: `research/mp73/ANDROID-TEST.md`.

Docker imajı güncel ağaçtan derlendi (`mp5_docker` 6 / 0). Bu oturumdan dağıtım yapılmadı. Canlı Render ve fiziksel Android **NOT RUN**.
