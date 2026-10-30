# STARS — MP.6 sonuç raporu: misafirde gerçek STARS arayüzü, zorunlu yatay ekran, host/misafir eşitliği

Dal: `claude/stars-mp6-ui-parity`. Taban: MP.5 dal ucu `1b7e569de5ec4d02215bf9fe68f54e74dd4ea0ca` (PR #17 açık, birleşmemiş; MP.5'in doğrulanmış çalışmasını korumak için onun üstüne kuruldu). `main` = `4296ad2`.

**Karar: kısmi eşitlik.**

- Misafir artık host ve tek oyunculu oyunla AYNI `index.html`'i ve AYNI arayüz kodunu kullanıyor: harita, kamera, üst çubuk, sol menü, sağ panel, tarih/hız kutusu, bilim ağacı, koloni ve filo panelleri.
- Aynı oyun durumu için misafir ekranı ile düz tek oyunculu sayfa arasında piksel farkı **0**.
- Misafirin dokunuşları: bilim hedefi, bina ve filo rotası gerçek MP komutlarıyla host'ta uygulanıyor.
- Gerçek diplomasi/federasyon/casusluk pencerelerinin eylemleri, gemi üretimi ve bazı filo/koloni eylemleri henüz MP komutuna bağlı değil. Misafirde açıkça soluk ve engelli; ilgili diplomasi işlevleri MP diplomasi panelinden çalışıyor.
- Runtime (19 dosya), build `96h10`, PWA `stars-v96h10`, Save8, motor kuralları ve ZIP değişmedi.

## 1. Mimari bulgular

`MULTIPLAYER-MP6-MIMARI.md` §1. Özet:

- Arayüz global `G`'ye ve "oyuncu = devlet 0" varsayımına (~330 yer) bağlı.
- En az değişiklikli yol: host'tan misafire yetkiye göre süzülmüş, misafiri 0 numara yapan Save8 biçimli "ayna dünya". Misafir onu motorun kendi `deserialize`'ıyla kurar, simülasyon yürütmez.
- Motorun bütün durumu kopyalanmıyor: beyaz liste + MP.2 görünürlük kuralı.

## 2. Ortaklaştırılan gerçek bileşenler

- **Misafirde gerçek kod:** `index.html` DOM'u, `main.js` (çizim döngüsü, `enterGame`, `deserialize`), `map.js` (`View`: harita, kamera, dokunma, rota), `ui.js` (`UI`: üst çubuk, sol araçlar, sağ panel, bütün pencereler, bilim ağacı), `economy*`, `commerce*`, `archive-ui`, `audio`.
- **Ekran davranışı:** aynı CSS, ikon ve yazı tipleri; aynı yatay kilit ve "CİHAZI YATAY ÇEVİR" ekranı.
- **MP katmanı:** host ile misafir aynı çok oyunculu çubuğu ve aynı MP diplomasi panelini (`dip-ui.js` / `pol-ui.js`) kullanıyor.

## 3. Değişen dosyalar

- **Yeni:**
  - `research/mp6/mirror.js`, `research/mp6/client/guest-stars.js`, `research/mp6/client/mp6.css`, `research/mp6/README.md`;
  - `tests/mp6_mirror_test.js`, `tests/browser-mp6.cjs`;
  - `research/mp6/evidence/`.
- **Değişen:**
  - `research/mp0/mp-core.js`: `ui` mesajı, ayna yayını, yeniden bağlanmada tam ayna.
  - `research/mp1/server/relay.js`: `/mp/play`, katı CSP özetleri, izin listesi, host sayfasına `mirror.js`.
  - `research/mp1/client/join.js`: ayna mesajları, `#mp6App` katmanı.
  - `research/mp1/client/mp1-host.js`: davet → `/mp/play`, çubuk oyunun kökünde.
  - `research/mp1/client/mp1.css`: çubuk tarih/hız kutusunun üstünde, STARS pencerelerinin altında.
  - `research/mp1/deploy/Dockerfile`, `.dockerignore`.
- **Test beklentileri güncellenen (gevşetme yok):**
  - `tests/mp1_relay_test.js`: host sayfası enjeksiyonu, izinli dosyalar.
  - `tests/browser-mp1.cjs`: davet `/mp/play`; host oyun içi işlemleri yatayda yapar, açık STARS penceresini kapatır.
  - `tests/browser-mp11.cjs`: davet `/mp/play`; misafir vakaları `/mp/join` hafif istemciyle.
  - `tests/mp5_docker.cjs`: imaj dosya kümesine `research/mp6`.
- **Belgeler:** `MULTIPLAYER-MP6-MIMARI.md`, bu dosya, `PROJE-DURUMU.md`, `CLAUDE.md`.

## 4. Testler

### `tests/mp6_mirror_test.js` — 8/8 PASS (Node vm; host ve misafir ayrı vm)

1. **Saflık:** host Save8/RNG değişmez; deterministik; kozmetik tohum.
2. **Motor `deserialize`'ı (devlet 3 ve 5):**
   - G.p = misafir (id 0, insan, ad);
   - kaynak, koloniler, teknolojiler, araştırma hedefleri ve filolar host'takiyle aynı;
   - bilinen ve görünen sistem kümesi host'un o devlet için hesapladığıyla birebir aynı.
3. **Yeniden numaralandırma:** sistem/gezegen sahibi, filo sahibi, ilişki/temas, host'un devleti misafirin numarasında.
4. **Gizlilik:**
   - başka devletin kaynak/teknoloji/araştırma/AI planı yok;
   - host günlüğü yok;
   - bilinmeyen sistemde ad/yıldız/gezegen/sahip yok;
   - yabancı koloni ayrıntısı ve yabancı filo rotası yok;
   - temassız devlet adı yok.
5. **Fark/uygulama:** 20 gün sonrası = önceki + fark (bayt bayt).
6. **Çekirdek:**
   - `ui:stars` → tam ayna, sonra fark;
   - `bad-ui` / `no-empire` reddi;
   - resync ve yeniden bağlanmada tam ayna;
   - host Save8/RNG değişmez.
7. **`/mp/play`:**
   - aynı `index.html` + `<base href="/">` + betikler;
   - CSP: `script-src 'self' 'unsafe-hashes'` + yalnız 2 özet; `unsafe-inline` yok;
   - `/mp/join` geçiş için duruyor.
8. **Performans:** 45/60/100 sistem (§9).

### `tests/browser-mp6.cjs` — 11/11 PASS (4 ayrı Chromium süreci, mobil dokunmatik bağlam)

1. **Kurulum:** davet bağlantısı `/mp/play`; misafir sayfası gerçek runtime'ı yükler; aynı lobi; oyun başlar; misafirde G.p = kendi devleti (0), hız 0, MP.2 basit arayüzü yok.
2. **Aynı iskelet:** host ve iki misafirde aynı üst çubuk, aynı 26 sol menü/katman eylemi, aynı tarih/hız düğmeleri, aynı SİSTEM/FİLO/İSTİHBARAT sekmeleri, aynı yazı tipi.
3. **Görsel:** misafir ekranı ile aynı aynayı açan düz tek oyunculu STARS sayfası, 844×390'da 1 232 540 piksel karşılaştırıldı (çok oyunculu çubuk hariç): fark **%0**. Host ekranı aynı tasarım (kendi devletiyle).
4. **Yatay ekran:**
   - 844×390, 915×412, 960×540: oyun görünür, taşma yok, "çevir" uyarısı yok (host ve misafir);
   - 390×844 dikey: "CİHAZI YATAY ÇEVİR" ekranı çıkar ve MP çubuğunu da örter;
   - aynı PWA manifesti (`orientation: landscape`).
5. **Harita ve panel (gerçek dokunma):**
   - haritada sisteme dokunma seçer ve sağ paneli doldurur;
   - sürükleme kamerayı kaydırır;
   - canlı senkronda seçim ve kamera korunur;
   - FİLO/SİSTEM sekmeleri ve sol menüden BİLİM penceresi açılır;
   - STARS penceresi MP çubuğunun üstünde.
6. **Gerçek komutlar (misafir B, gerçek arayüzden):**
   - bilim ağacında düğüme dokunma → host'ta araştırma hedefi → misafirde görünür;
   - koloni panelinde bina düğmesi → host kuyruğu → misafirde görünür;
   - filo panelinde ROTA + haritada hedef sisteme dokunma → host'ta filo yolu → misafirde görünür.
7. **Engelleme:**
   - hız düğmesi ve 8 desteklenmeyen eylem (duruş, birleştirme, savaş, hediye, otomatik keşif, kolonileştirme, yıkım, durdurma) engellendi ve uyarı verdi;
   - host hızı ve günü değişmedi; misafir hızı 0.
8. **Gizlilik:**
   - misafir aynasında başka devlet kaynağı/teknolojisi 0, yabancı koloni ayrıntısı yok;
   - tohum gerçek değil, RNG yok, AI planı yok;
   - görünmeyen sistemde sahip ve ad yok;
   - C'nin dünyasında B kabuk (kaynak/teknoloji/araştırma 0).
9. **MP diplomasi:** B çubuktaki DİPLOMASİ düğmesiyle (host'takiyle aynı panel) C'ye teklif gönderdi; C kendi panelinde GELEN → KABUL ET → onay; host tam bir kez uyguladı (−100 Maden / −40 Alaşım).
10. **Kopma:** misafir soketi düştü; gerçek arayüz kaldı; yeniden bağlanınca tam ayna geldi; iki misafir aynı devletle sürdü.
11. **Performans:** 45/60/100 sistem.

## 5. Host / misafir görsel karşılaştırması

- Kanıt: `research/mp6/evidence/compare-guest-844x390.png`, `compare-singleplayer-844x390.png`, `compare-host-915x412.png`.
- Misafir ile tek oyunculu: aynı durum, aynı kamera → fark %0 (çubuk hariç).
- Misafir ile host: aynı arayüz, farklı devlet (her biri kendi devletini görür).
- Kalan farklar:
  - Çok oyunculu çubuk: host'ta "ÇOK OYUNCULU · oda · bağlı · n/n misafir", misafirde "ÇOK OYUNCULU · Bağlı · oda".
  - Misafirde desteklenmeyen kontroller soluk.
  - Misafirin hız düğmeleri soluk (zamanı host yönetir).

## 6. Yatay ekran

PASS (§4 madde 4). Fiziksel Android'de `screen.orientation.lock` davranışı: **NOT RUN**.

## 7. Tamamlanan ve eksik ekranlar

| Ekran | Durum |
|---|---|
| Galaksi haritası, kamera, sistem/filo seçimi | ✔ gerçek arayüz |
| Üst kaynak çubuğu, tarih/hız kutusu (hız host'ta) | ✔ |
| Sol ana menü, harita modları ve katmanlar | ✔ görünüm |
| Sağ panel SİSTEM / FİLO / İSTİHBARAT | ✔ görünüm |
| Bilim ve araştırma (ağaç, hedef, sıra, kip) | ✔ komut |
| Koloni binası | ✔ komut |
| Gemi üretimi, yıkım, kuyruk iptali, odak, terraform | ✖ engelli |
| Filo rotası | ✔ komut |
| Filo duruş/böl/birleştir/kolonileştir/durdur/sevkiyat/otomatik keşif | ✖ engelli |
| Ekonomi merkezi | ◐ görünür; aynada ekonomi geçmişi yok |
| Diplomasi / ticaret / karşı teklif | ◐ gerçek pencere görünür, eylemleri engelli; işlev MP diplomasi panelinde ✔ |
| Federasyon oyu, vasallık | ◐ aynı (MP.3.1 paneli ✔) |
| Casusluk, pazar, konsey, haberler, gelen kutusu | ✖ engelli / boş |

## 8. Gerçek komut ve işlev testleri

§4 `browser-mp6` 6, 7 ve 9.

## 9. Performans

| | 45 sistem | 60 sistem | 100 sistem |
|---|---|---|---|
| Tam ayna (Chromium) | 16,2 KB | 20,2 KB | 29,9 KB |
| 10 günlük fark | 0,3 KB | 1,0 KB | 0,3 KB |
| Host ayna üretimi | 1–6 ms | 1–7 ms | 1–2 ms |
| Misafir kurulum (`deserialize`, Chromium) | 19–47 ms | 22–27 ms | 19–67 ms |
| Node: ayna / üretim / yükleme | 18 KB / 1 ms / 188 ms | 23 KB / 2 ms / 192 ms | 33 KB / 2 ms / 272 ms |

- Canlı oyunda misafir yeniden kurulum: 19–87 ms (ilk kurulum 256 ms).
- Host ayna iletileri: fark 135 B – 3,4 KB, tam ~19 KB.
- Ayna en sık 700 ms'de bir gönderiliyor; misafir en sık 600 ms'de bir kuruyor.
- Ölçümler masaüstü CPU'da yapıldı; telefonda kurulum süresi birkaç kat olabilir (NOT RUN).

## 10–11. Regresyon

| Test | Sonuç |
|---|---|
| Tam Node regresyonu | 151 paket: 6219 GEÇEN / 3 KALAN (yalnız bilinen ortam FAIL'i `faz95d_identity` seed 11/99/404; taban ile aynı) |
| `browser-mp6` / `mp6_mirror` | 11/11 · 8/8 PASS |
| `browser-mp5` / `mp5_docker` | 10/10 PASS (Docker kipi: relay konteynerde) · 6/6 PASS |
| `browser-mp4` | 13/13 PASS |
| `browser-mp0` / `mp1` / `mp11` / `mp2` / `mp3` / `mp31` | 20/20 · 22/22 · 10/10 · 14/14 · 12/12 · 11/11 PASS |
| `browser-96h10` (tek oyunculu) | 27/27 PASS |
| Save8/RNG (`mp4_core`, `mp6_mirror`) | PASS |
| ZIP / CRC / manifest | DOĞRULANDI, değişmedi |

- Test uyarlaması: MP çubuğu artık STARS pencerelerinin altında. `browser-mp1/mp3/mp31/mp4/mp5` host çubuğuna dokunmadan önce açık STARS penceresini (danışman/olay) kapatır, hızı korur (`freeBar`). İlk koşuda bu yüzden mp3 1, mp31 1, mp4 11, mp5 1 FAIL verdi; düzeltmeden sonra hepsi PASS.
- `mp5_docker` ilk koşuda Docker daemon kapalı olduğu için NOT RUN oldu; daemon yeniden başlatılıp koşuldu: 6/6 PASS.

## 12. Açık sorunlar / sonraki faz (MP.6.1)

1. **Gerçek diplomasi penceresinin eylemleri:** UI teklif taslağı → `offer`/`counter`/`respond`; savaş/barış/ittifak/pakt için yeni yetkili MP komutları; federasyon/vasallık pencere eylemleri → MP.3.1 komutları.
2. **Filo ve koloni eylemleri için yeni MP komutları:** gemi üretimi (`queueShip`), durdur, böl/birleştir, kolonileştir, otomatik keşif, yıkım/iptal, odak.
3. **Aynaya yetkili ek bölümler:**
   - kendi bildirimleri ve gelen kutusu;
   - kendi ekonomi geçmişi;
   - kamu haberleri;
   - federasyon iç durumu (yalnız üyeler).
4. **MP.2 basit istemcisinin (`/mp/join`) kaldırılması:** MP.1–MP.5 tarayıcı testlerinin gerçek arayüze taşınması.
5. **Telefonda sık `deserialize` maliyetinin ölçülmesi** ve gerekirse sıklığın uyarlanması (fiziksel Android NOT RUN).
6. **Hız göstergesi:** misafirin hız düğmeleri host'un gerçek hızını göstermiyor (yalnız engelli).
7. **MP çubuğu STARS pencerelerinin altında:** host ya da misafir, açık bir STARS penceresi (danışman, olay) varken çubuğa ulaşamaz; önce pencereyi kapatması gerekir. Bu bilinçli bir seçim (eskiden çubuk tarih/hız kutusunu ve pencereleri örtüyordu); gerekirse pencere başlığına küçük bir MP göstergesi eklenebilir.

## 13. NOT RUN

- Fiziksel Android: yön kilidi, dokunma, performans.
- Gerçek internet.
- LAN.
