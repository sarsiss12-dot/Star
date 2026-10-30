# STARS — MP.6 mimarisi: misafirde gerçek STARS arayüzü (ayna dünya)

Durum: **geliştirme sürümü; kısmi eşitlik (ana ekran + filo/koloni/bilim komutları + MP diplomasi paneli).**

Değişmeyenler:

- 19 runtime dosyası, build `96h10`, PWA `stars-v96h10`, Save8 ve kanonik ZIP.
- Oyun motoru ve tek oyunculu arayüz kodu. Tek oyunculu oyun aynı dosyaları kullanır.

## 1. Kaynak koddan bulgular (sorulara yanıt)

1. **Gerçek arayüz neye bağlı?**
   - `ui.js` (`UI`: üst çubuk, sol araçlar, sağ panel, bütün pencereler; ~239 eylemli tek dağıtıcı `UI.act(a,x,el)`).
   - `map.js` (`View`: harita, kamera, dokunma, rota).
   - `main.js` (çizim döngüsü `frame`, `enterGame`, `serialize`/`deserialize`), `index.html` DOM'u.
   - Hepsi global `G`'yi okur. `G.p` oyuncudur.
   - Motor ve arayüz **~330 yerde "oyuncu = devlet 0"** varsayar (`s.owner===0`, `f.e===0`, `e.id===0`; `applySaveData` → `G.p = G.emps[0]`).
2. **Hangi bileşenler ortak kullanılabilir?** Ayırmaya gerek yok: arayüz, `G` Save8 biçiminde kurulduğu sürece olduğu gibi çalışır. Motorun kendi `deserialize`'ı `G`'yi kurar ve türetilmiş durumu (görüş, sınırlar, modlar, ekonomi oranları) yeniden hesaplar.
3. **MP.2 snapshot/delta verisi yeter mi?** Hayır. MP.2 görünümü özel bir biçimdir; gerçek arayüz Save8 biçimli `G` ister. Görünürlük kuralları ise aynen kullanılabilir (`explorationContext`).
4. **Hangi paneller ek veri ister?** Kendi devletin tam nesnesi, sistem/gezegen yapıları ve filo nesneleri. Bunlar aynada var. Federasyon iç oyları, haberler, gelen kutusu, ekonomi geçmişi, savaş defteri ve casusluk bu fazda aynaya girmedi (§6).
5. **Komut yönlendirme:** gerçek arayüzün eylemleri iki noktada yakalanır: `UI.act` kapısı ve motorun eylem işlevleri (`orderMove`, `queueBuilding`, `researchTarget`, `setResearchMode`). Bunlar mevcut MP komutlarına (`move`, `build`, `research`, `researchMode`) çevrilir. Host aynı `COMMANDS` denetimlerinden geçirir; yeni komut yok.
6. **Ekran davranışları:** misafir sayfası aynı `index.html`. Yatay kilit (manifest `orientation: landscape`, tam ekranda `screen.orientation.lock`), dikeyde "CİHAZI YATAY ÇEVİR" (`UI.checkOrient`), kamera ve dokunma motoru aynen gelir.
7. **En az değişiklikli yol:** her misafire o misafirin görmeye yetkili olduğu dünyanın Save8 biçimli bir kopyası ("ayna") gönderilir. Bu kopyada misafirin devleti 0 numaradır. Misafir onu motorun `deserialize`'ıyla kurar, **simülasyon yürütmez**. Motorun bütün durumu kopyalanmaz: ayna bir beyaz listedir.

## 2. Ayna dünya (`research/mp6/mirror.js`, host tarafı, saf)

- **Saflık:** `G`'ye yazmaz, RNG çekmez. Host'ta `pure()` içinde çağrılır. Host Save8/RNG değişmez (Node testi).
- **Yeniden numaralandırma:** tek yer değiştirme π = (0 me). Misafirin devleti 0, host'un devleti misafirin eski numarası. Uygulanan alanlar:
  - sistem/gezegen sahibi;
  - filo sahibi;
  - devlet kimlikleri;
  - ilişki haritaları (`rel/war/ally/contact/nap/pact/…`);
  - federasyon üyeleri;
  - vasallık bağı.
- **Görünürlük (MP.2 kuralı):**
  - Sistem konumu kamuya açık.
  - Ad ve yıldız yalnız bilinen sistemde.
  - Gezegen türleri yalnız taranmış sistemde.
  - Sahiplik ve yabancı filo yalnız görünen sistemde.
  - Yabancı koloni: nüfus, kalkan, garnizon. Bina ve kuyruk yok.
  - Yabancı filo: sınıf listesi. Rota ve hareket yok.
- **Devletler:**
  - Kendi devleti tam (AI alanları atılır).
  - Diğerleri "kabuk". Temas varsa kamu kimliği (ad, renk, görünüş, etik, civic), misafirle ilişkisi ve temaslı devletler arası kamu savaş/ittifak bağları. Temas yoksa "Bilinmeyen devlet".
  - Kabuklarda kaynak, teknoloji, araştırma ve AI planı sıfır/boş.
- **Atılanlar:** host'un günlüğü (yerine misafirin kendi MP bildirimleri), gelen kutusu, haberler, ekonomi geçmişi, ticaret, savaş defteri, kriz, kampanya, simülasyon, tohum (yerine oda kimliğinden kozmetik tohum) ve RNG durumu.
- **Boyut:** 45/60/100 sistemde 16–18 / 20–23 / 30–33 KB tam ayna. Fark tipik olarak 0,1–3 KB.

## 3. Taşıma (`mp-core.js`)

- Misafir oyun ekranına geçince `{type:'ui',mode:'stars'}` gönderir (bozuksa `bad-ui`, devletsizse `no-empire`).
- Host her yayında, en sık 700 ms'de bir ayna gönderir: önce `mirror` (tam), sonra `mirrorDelta`. Fark: üst alanlar bütün, `sys`/`emps` sıra ile, `fl` kimlik ile.
- Son durum ertelenmiş gönderimle mutlaka gider.
- Yeniden bağlanma ve `resync` tam ayna üretir. Taban uyuşmazsa misafir `resync` ister.
- MP.2 görünümü (snapshot/delta) de sürer. Saat, bildirim, MP.3 `dip` ve MP.3.1 `pol` verisi oradan gelir.

## 4. Misafir sayfası (`/mp/play`) ve katman (`research/mp6/client/guest-stars.js`)

- **Sayfa:** relay `/mp/play`'de **aynı `index.html`**'i sunar.
  - `<base href="/">` eklenir.
  - Lobi/bağlantı (`join.js`, aynı modül), MP.3/MP.3.1 panelleri, ayna istemcisi eklenir.
  - CSP katı: `script-src 'self'` + yalnız `index.html`'in kendi satır içi betiğinin ve tam ekran düğmesi işleyicisinin SHA-256 özetleri (`'unsafe-inline'` yok).
- **Davet bağlantısı:** host'un davet bağlantısı artık `/mp/play`'e gider. MP.2'nin basit misafir sayfası geçiş süresince `/mp/join`'de durur (MP.1–MP.5 testleri onu kullanır; ürün yolu değil).
- **Kurulum:**
  - İlk aynada `leaveTitle` → `enterGame(true)` (tek oyunculu "kayıttan devam" yolu).
  - Hız hep 0 (`UI.setSpeed` → 0); `G.autoSave=false` (misafirin tek oyunculu kayıt yuvasına yazılmaz).
- **Canlı senkron:**
  - Gelen her ayna motorun `deserialize`'ıyla kurulur (en sık 600 ms'de bir).
  - `finishSaveLoad`'ın sıfırladığı rota kipi, yarım dokunma hareketi ve açık bildirim korunur.
  - Kamera ve seçim zaten kimlikle korunur.
- **Eylem kapısı:** `UI.act` sarmalanır.
  - 75 görünüm/gezinme eylemi yerelde çalışır.
  - Kalan 164 eylem engellenir: dokununca açık uyarı, görsel olarak soluk. Liste gerçek `UI.act` kaynağından okunur.
  - `build` / `tech` / `science*` / harita rota dokunuşu motor işlevine iner; o işlevler MP komutuna çevrilir.
  - Yerelde kalan herhangi bir değişiklik bir sonraki aynada host'un gerçeğiyle ezilir; host'a yalnız MP komutu ulaşır.
- **Çok oyunculu çubuk:** host'takiyle aynı çubuk (`mp1-mini`) ve aynı MP diplomasi paneli (`dip-ui.js`/`pol-ui.js`, TİCARET / FEDERASYON / VASALLIK).
  - Çubuk STARS tarih/hız kutusunun üstüne taşındı.
  - Çubuk STARS panellerinin, pencerelerinin ve "çevir" uyarısının **altında** kalır (host'ta da; eskiden tarih/hız kutusunu ve pencereleri örtüyordu).

## 5. Güvenlik ve yetki

- Simülasyon yalnız host'ta.
- Misafir yalnız kendi aynasını alır: başka oyuncunun kaynak/teknoloji/kuyruk/araştırması yok (Node + Chromium testi).
- Komutlar MP.0–MP.3.1'in mevcut yetki denetiminden geçer: sahte devlet `forged-empire`, başkasının filosu `not-owner`.
- Misafirin yerel `G`'si host'u etkileyemez.

> **MP.6.1 güncellemesi:** aşağıdaki eksiklerin çoğu kapatıldı. Kapananlar:
> - ortak hız;
> - filo DUR / DURUŞ / AYIR / BİRLEŞTİR / keşif / kolonileştir;
> - tersane, yıkım, iptal, odak;
> - gerçek anlaşma penceresi ve gelen kutusu;
> - federasyon / vasallık pencereleri;
> - ekonomi geçmişi.
>
> Ayrıca:
> - MP çubuğu bir sıra yukarı alındı (hız bildirimi şeridi);
> - STARS penceresi açıkken ayna bekletilir.
>
> Güncel durum: `MULTIPLAYER-MP61-SONUC.md`.

## 6. Bu fazda eşitlenmeyenler (MP.6.x)

- **Gerçek diplomasi/federasyon/vasallık/casusluk/pazar/ticaret pencereleri misafirde açılır ama eylemleri engellidir.**
  - İnsan–insan ve insan–AI diplomasi, federasyon oyu ve vasallık **MP diplomasi panelinden** çalışır (host'takiyle aynı panel).
  - Gerçek STARS diplomasi penceresinin eylemlerinin MP komutlarına bağlanması sonraki faz.
- **Filo eylemleri:**
  - **Çalışan:** rota.
  - **Engelli** (MP komutu yok): duruş, bölme/birleştirme, kolonileştirme, keşif, durdurma, sevkiyat, otomatik keşif.
- **Koloni eylemleri:**
  - **Çalışan:** bina.
  - **Engelli:** gemi üretimi, yıkım, kuyruk iptali, odak, terraform, habitat.
- **Aynada boş gelen bölümler:** haberler, gelen kutusu, ekonomi geçmişi, savaş defteri, kriz, olay zincirleri; federasyonların iç oy durumu (MP.3.1 panelinde var).
- **Hız düğmeleri:** misafirde engelli; zamanı host yönetir.
- **Basit istemci:** MP.2 istemcisi (`/mp/join`) geçiş için duruyor. Gerçek arayüzün kapsamı tamamlanınca kaldırılmalı.
