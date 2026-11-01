# STARS — MP.7: gerçek mobil başlangıç + tek oyunculu kurulum ekranıyla oyuncuya özel devlet tasarımı

**Durum:** geliştirme sürümü.
- Oyun yayını `96h10p2` (`releases/stars-faz96h10p2.zip`), PWA `stars-v96h10p2`, Save8.
- Taban: PERF.1 `50e3563` (PR #23). Zincir #17 → #23 açık; hiçbiri merge edilmedi.

## 1. Kullanıcının hatası ve kök neden

**Gözlem (gerçek Render dağıtımı, iki telefon):** lobiye girildi, devlet seçildi. Host başlatınca ikinci telefon bağlantı / veri yükleme durumunda kaldı ve oyuna geçmedi.

**Kök neden (yeniden üretildi):** relay'in kendi WebSocket çerçeve ayrıştırıcısı (`research/mp0/server/dev-relay.js` `attach`; üretim relay'i aynı işlevi kullanır) iki eksik taşıyordu:
- `FIN=0` çerçeveyi `1003 'fragmentation unsupported'` ile kapatıyordu;
- devam çerçevelerini (`op=0`) hiç tanımıyordu.

RFC 6455 5.4 aracıların (bulut platformlarının vekilleri) mesajı parçalamasına izin verir. Vekil host'un büyük iletilerini böldüğünde host bağlantısı her seferinde düşüyordu:
- MP.2 görünümü 15–17 KB;
- ayna 13–31 KB.

Küçük lobi iletileri (< 2 KB) geçtiği için lobi çalışıyor, oyun verisi hiç ulaşmıyordu. Misafir "Galaksi verisi bekleniyor…" / "Host bağlı değil" arasında kalıyordu.

**Kanıt:**
- **Test vekili:** `tests/helpers/mp11-tls-proxy.js` `fragment` seçeneği. İstemci → relay metin çerçevelerini N baytlık parçalara böler ve araya pong ekler; yalnız test içindir.
- **Kurulum:** üretim kipi relay + TLS vekili + iki Chromium (dikey telefon).
- **Düzeltmeden önce:** 30 sn'de görünüm / ayna yok, host bağlantısı sürekli koptu.
- **Düzeltmeden sonra:** 3 sn'de gerçek STARS haritası.

**Doğrulanamayan:** Render'ın (ya da önündeki ağın) gerçekten parçaladığı canlı servisten doğrulanamadı.
- Bu oturumun ağ politikası `stars-zhdu.onrender.com`'a erişimi engelledi (vekil 403). Canlı salt okuma denetimi NOT RUN.
- Render'ın hangi commit'i dağıttığı da bilinmiyor. Varsayılan dal `main` ise MP.0–MP.4 kodudur; o koddaki relay de aynı ayrıştırıcıyı taşır.
- Yerelde parçalama olmadan ne `main` ne PERF.1 kodu takıldı. Takılma ancak parçalayan aracıyla yeniden üretildi.

**Elenen olasılıklar (ölçüldü):**
- **Ayna boyutu:** yeni oyunda 13–31 KB; relay host sınırı 256 KB.
- **Mesaj sırası:** `assign` → `lobby` → `snapshot` → `ui:stars` → `mirror`.
- **Önceden tek oyunculu oynamış misafir:** localStorage + service worker ile başlıyor.
- **Service worker:** önce ağ stratejisi.
- **Eski `main` kodu:** yerelde başlıyor.

## 2. Düzeltmeler

1. **Relay (`dev-relay.js attach`):**
   - parçalı mesaj birleştirme;
   - kontrol çerçeveleri parçaların arasına girebilir;
   - parçalı kontrol çerçevesi, başlangıçsız devam ve iç içe mesaj → 1002;
   - boyut sınırı parçaların toplamına (1009);
   - ikili çerçeve yine 1003.
   - Test: `tests/mp7_ws_frames_test.js` (6/6).
2. **Misafir başlangıç durum makinesi (`guest-stars.js`):**
   - Aşamalar: ODAYA BAĞLANDI → DEVLET ATANDI → HOST OYUNU BAŞLATTI → GALAKSİ VERİSİ ALINDI → STARS DÜNYASI YÜKLENİYOR → OYUN HAZIR.
   - Görünüm ya da ayna gelmezse idempotent istek (`resync` / `ui:stars`; ikisi de host'ta TAM veri üretir) 8 / 16 / 32 / 64 sn geri çekilmeyle yeniden gönderilir.
   - 5 denemeden sonra durur, gerçek neden + YENİDEN DENE gösterilir. Ağ yokken deneme sayılmaz.
   - `deserialize` başarısızsa aynı ayna 1 sn'de bir sonsuza dek denenmez: ayna bırakılır, neden kaydedilir (oyun verisi / jeton / oda anahtarı yok), tam ayna yeniden istenir; 3 başarısızlıkta durur.

## 3. Tek oyunculu kurulum ekranıyla devlet tasarımı

`research/mp7/client/mp7-setup.js`, kopya kurulum motoru değildir. Aynı `#menu/#setup`, `renderSetup`, `setupClickHandler`, `CFG` ve aynı kurallar kullanılır:
- etik bütçesi, civic yuvası / radikal, özellik bütçesi, köken uyumu;
- şablonlar, renk / amblem, isim zarı.

Her telefon kendi sayfasında kendi `CFG`'sini düzenler; simülasyon başlamaz. Değişen yalnız son düğme:
- **Misafir:** DEVLETİ KAYDET. Taslak host'a gider; galaksi adımı yok.
- **Host:** KAYDET VE LOBİYE DÖN. Galaksi adımı aynı ekran.

Geri tuşu kurulumu kaydetmeden kapatır. VAZGEÇ son düğmelerin yanındadır (sekme şeridinde yanlış dokunmayla kapanmasın; test bunu yakaladı).

**Host'ta doğrulama (`mp-core.js draftCheck`):**
- Beyaz liste + tür denetimi.
- Kuralların kendisi motorun: `normalizeNewEthics`, `normalizeNewCivics`, `normalizeNewTraits`, `originCompatible`.
- Motor bir seçimi değiştirecekse taslak **geçersiz**dir; sessiz düzeltme yok.

**Motor (`main.js setupGame`):**
- Oyuncu devletini kuran blok `makeConfiguredEmpire(id, kaynak, rnd)` olarak ayrıldı (aynı satırlar, aynı sıra).
- `cfg.humans` verilirse AI döngüsünün ilk k yuvası (id 1..k) aynı işlevle kurulur.
- Anavatan, köken etkileri, başlangıç filoları ve zorluk başlangıç kaynakları mevcut döngüden gelir.
- AI + insan ≤ 11 (en az bir AI).
- Aynı rengi seçen ikinci insan paletten alır; amblem benzersizleştirilir.

**Tek oyunculu:** 5 yapılandırmada `setupGame` sonrası ve 3 ay sonra Save8 + RNG PERF.1 ile bayt-bayt aynı.

## 4. Lobi

**Tasarım kipi (varsayılan):**
- `draft` iletisi:
  - yalnız oyuncunun kendi taslağı (kimlik bağlantıdan);
  - artan `rev` (eski / yinelenen → `stale`);
  - değişen taslak hazırı sıfırlar.
- Hazır taslak ister.
- Galaksi ayarı değişince hazırlar sıfırlanır, taslaklar yeniden denetlenir.
- `start`:
  - taslaklar son kez denetlenir;
  - host taslağı (kendi CFG'si) + misafirler (koltuk sırası) gerçek `setupGame(cfg.humans)` ile kurulur;
  - misafirler kendi devletlerine atanır.

**Host lobisi:**
- oda kodu / davet;
- oyuncular + devlet özetleri + hazır;
- DEVLETİMİ DÜZENLE, GALAKSİ AYARLARI, kapasite;
- OYUNU BAŞLAT, ODAYI KAPAT.

**Misafir lobisi:**
- oyuncular;
- DEVLETİMİ DÜZENLE, taslak durumu (kabul / ret nedeni), galaksi özeti;
- HAZIRIM, ODADAN AYRIL.

**Kaldırılan:** eski Doktrin / Görünüş / Fizyoloji / Etik / Civic / Köken / Galaksi lobi sekmeleri tasarım kipinde yok.

**Eski MP.1 devralma kipi:** `mp-core` `opts.lobby.design` verilmezse aynen sürer. Arayüzde yalnız `window.MP7Legacy` ile açılır; eski tarayıcı testleri bu akışı sınamaya devam eder.

## 5. Diplomasi arayüzü

**Bu fazda birleştirilmedi.** Gerçek STARS ekranları zaten MP komutlarına iniyor:
- anlaşma penceresi → `offer`;
- gelen kutusu → `respond`;
- federasyon / vasallık / savaş / casusluk pencereleri (MP.6.1–6.4).

**Ayrı "ÇOK OYUNCULU DİPLOMASİ" panelinin hâlâ gerekme nedeni:** insanlar arası **bekleyen** tekliflerin listesi (gönderilen / geçmiş) ve **geri çekme**. Tek oyunculu STARS'ta AI'ya teklif anında sonuçlandığı için gerçek arayüzde böyle bir liste yok.

Bu listeyi gerçek diplomasi ekranına taşımak MP.7.1'e bırakıldı.

## 6. Dağıtım

- Relay `/research/mp7/client/mp7-setup.js` ve `mp7.css`'i sunar ve her iki sayfaya enjekte eder.
- Dockerfile ve `.dockerignore` izin listesine `research/mp7/client/` eklendi.
- Render için yeniden dağıtım adımları: `research/mp7/RENDER.md`.

## 7. Testler

Ayrıntı: `research/mp7/evidence/REGRESYON.md`.
