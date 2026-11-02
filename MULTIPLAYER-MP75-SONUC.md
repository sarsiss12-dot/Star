# STARS — MP.7.5: savaş / barış tutarlılığı, uzun oyun performansı, misafirde panel kararlılığı, bildirim ve mobil miktar

**Durum:** geliştirme sürümü.
- Taban: MP.7.4 `7e43f82` (PR #28).
- Build `96h10p4`, PWA `stars-v96h10p4`, Save8 (şema değişmedi).
- Runtime değişiklikleri sınırlı bloklar hâlinde:
  - `ui.js`;
  - `inbox.js`;
  - `index.html` CSS;
  - `main.js` / `sw.js` yalnız sürüm kimliği.
- Simülasyon, AI, ekonomi ve RNG değişmedi.

Kaynak: kullanıcının iki gerçek Android telefonla Render üzerinde uzun oyunu.

## 1. Barış döngüsü (B, E)

**Zincir ölçüldü** (`/home/user` sondaları; kalıcı kanıt `tests/mp75_war_test.js`):
- Tek oyunculu ve çok oyunculu (AI → host kartı, AI → uzak insan MP teklifi) kabul savaşı bitiriyor.
- Gerçek motorla 2 seed × 120 ay, 8 AI, insanlar ara ara savaş açıyor: 7 kabulün hepsi savaşı bitirdi, ret yok. Tekrar eden teklifler yeniden açılan savaşlardandı.

**Kök neden (kayıt birikmesi ve "kabul ettim ama bekliyor").**
- Barış kaydının anahtarı teklifin doğuş gününü içerir; AI'nın her yeni teklifi ayrı kayıttır.
- AI aynı devlete en erken 450 günde bir teklif eder, kayıt 540 günde dolar. Bu yüzden aynı devletten iki bekleyen barış kaydı bulunabilir.
- `DiplomaticInbox.sync` barış kaydını hiç kapatmıyordu (`deal` olan kayıtta kapı denetimi atlanıyordu).
- Biri kabul edilip savaş bitince öteki süresi dolana kadar "Bekliyor" kalıyordu.
- MP.7.4 kaydırmasıyla kart kalkınca AI'nın sonraki teklifi yeni kart ve kayıt da açıyordu.

**Düzeltme** (`inbox.js`, blok `/* END MP.7.5 INBOX */`):
- Savaş bittiğinde bekleyen barış / statüko kaydı kapanır: "Savaş sona erdi", kart kalkar.
- Aynı devletten daha yeni teklif gelince eskisi kapanır: "Aynı devletten daha yeni teklif geldi".
- AI teklif kuralları değişmedi.

**Misafir:** MP.7.4'ten beri karar host yanıtını bekler; iyimser "kabul edildi" yok.

**Statüko:** `canStatusQuo` reddi gerekçesiyle görünür ("Henüz iki taraf da yeterince yorulmadı …"). AKTİF SAVAŞLAR penceresi her düşman için bu gerekçeyi gösterir.

## 2. Savaş sayacı ve AKTİF SAVAŞLAR (C)

**Fark:**
- Üst ⚔ sayacı `G.p.war`'daki her canlı devleti sayar: temas kurulmamış, kriz tarafı ve vahşi dahil.
- Diplomasi listesi yalnız temas kurulan, vahşi olmayanları gösterir.
- Savaş defteri (`warLedger`) ayrıca iki taraflı savaş ister.

**Düzeltme:** sayaç artık "Aktif savaşlar" penceresine götürür (`UI.activeWarsList` — aynı `G.p.war`). Pencerede:
- savaştığın devlet sayısı ve aktif cephe sayısı ayrı;
- her düşman için süre, neden, cephe kaydı, tek taraflı durum, aynı seferdeki bilinen ortaklar, bekleyen barış teklifi sayısı, barış / statüko gerekçesi, "Diplomasi · barış görüşmesi";
- temas kurulmamış düşman "Bilinmeyen düşman" (ad ve ayrıntı gizli).

Host ve misafir aynı pencereyi kullanır. Mevcut diplomasi sayfasına yeni sekme eklenmedi: tek pencere, aynı kanonik veri.

## 3. Uzun oyun performansı (A)

**Ölçüm** (`tests/browser-mp75-perf.cjs`):
- host + 1 misafir, ayrı Chromium;
- üretim relay + parçalayan TLS vekili;
- misafirde açık diplomasi / Konsey paneli.

Kontrol noktasına host simülasyonu sayfa içinde hızlı ilerletilir: PERF.1 `mp-host` adımları, her gün yayın, misafir aynaları alır. Sonra **3 oyun ayı gerçek döngü** en yüksek hızda ölçülür.
- Taban: aynı dosya MP.7.4 ağacında (git worktree).
- Masaüstü Chromium'dur; telefon sonuçları değildir.

**Darboğazlar:**
1. **Misafir (gerçek telefon gözleminin kaynağı).** Her ayna kurulumu (en sık 600 ms) tam `deserialize` + `UI.refresh`.
   - `UI.surfaceRender` açık paneli yalnız aynı dünya nesnesinde (`_surfaceWorld === G.emps`) yerinde günceller.
   - `deserialize` her kurulumda yeni `G.emps` yarattığı için misafirde açık Konsey / federasyon / ekonomi / sağ panel her kurulumda **baştan yazılıyordu**: tam DOM, uzun görev, titreme.
2. **Host:** aylık simülasyon adımı. Masaüstünde ay adımı p95 60–580 ms; telefonda kat kat fazla. PERF.1'den beri bilinen kaynak: AI turu. MP.7.5 simülasyona dokunmadı.

**Optimizasyonlar** (`guest-stars.js`, runtime değil):
- **Yüzey taşıma:** kurulumdan sonra önceki dünyaya bağlı yüzeyler yeni dünyaya taşınır; motorun kendi yerinde güncelleme yolu çalışır.
- **Dokunurken bekletme:** kullanıcı dokunurken / kaydırırken kurulum ertelenir (düğmeler parmağın altında kaymaz).
- **Uyarlamalı aralık:** kurulum aralığı ölçülen kurulum süresinin ~4 katı (0,6–3 s). Masaüstünde 600 ms'de kalır; yavaş telefonda deserialize'a ayrılan zaman payını sınırlar.

**Öncesi / sonrası** (3 oyun aylık pencere; tek koşu; aday koşuları hata 0):

| Senaryo | Ölçüt | MP.7.4 | MP.7.5 |
|---|---|---|---|
| orta / 5 AI, diplomasi açık, 60. ay | misafir `refresh` p95 | 33,0 ms | 6,5 ms |
| | misafir uzun görev (adet / en uzun) | 21 / 109 ms | 1 / 65 ms |
| | misafir kurulum p95 | 61,5 ms | 25,5 ms |
| orta / 5 AI, 120. ay | misafir `refresh` p95 | 29,3 ms | 5,4 ms |
| | misafir uzun görev | 92 / 124 ms | 0 |
| | misafir kurulum p95 | 42,5 ms | 21,4 ms |
| orta / 5 AI, Konsey açık, 24. / 48. ay | Konsey paneli baştan yazılma | 13 / 13 | 0 / 0 |
| | misafir uzun görev | 14 / 21 | 17 / 12 |
| büyük / 8 AI, 60 / 120 / 240. ay* | misafir `refresh` p95 | 26,7 / 21,6 / 29,8 ms | 22,0 / 8,0 / 12,4 ms |
| | host ay adımı p95 | 92 / 166 / 581 ms | 87 / 75 / 243 ms |

\* Büyük galaksi aday koşusu, düzeltilmeden önceki `mp61` hap hatasıyla koşuldu (misafirde pencere açıkken boyama hatası). Misafir sayıları ihtiyatla okunmalı.

**Host ay adımı:** simülasyon değişmediği hâlde koşudan koşuya büyük oynuyor (pencere başına 3 örnek). Host için kazanç **iddia edilmez**.

**240. ay (orta / 5 AI):** iki dalda da oyun 240. aydan önce bitti; o pencerede ölçüm yok.

## 4. Misafirde Konsey ekranı (D)

Kök neden ve düzeltme §3.1–3.
- Ölçüm: 3 oyun ayında panel 13 kez baştan yazılıyordu → 0.
- Chromium (`browser-mp75` A2): açık panel ≥ 6 ayna kurulumu boyunca yeniden yazılmadı (yüzey taşıma ≥ 6).
- Sekme, açık bölüm ve kaydırma motorun yerinde güncellemesiyle korunur.

## 5. Bildirim ve gelen kutusu (F, E)

**Önceden çalışanlar korundu:**
- MP.7.4 kaydırma ve hızlı karar;
- diplomatik kayıtlar Gelen kutusunda.

**Yeni (karar bekleyen olaylar):**
- Olay zinciri, anomali, fraksiyon, kriz ve konsey oyu gibi olaylar kaydırılınca **gizlenir**, silinmez.
- Olay üstteki ☰ durum listesinde kalır; oradan aynı karar penceresiyle açılır (`kind` + `data`'dan kurulur; geçici callback yok).
- Duraklatma ve kutu kırpma gizli olayı önce düşürmez.
- **Sınır:** `hidden` işareti kayda yazılmaz (`NOTE_FIELDS`). Yükleme sonrası kart yeniden görünür; karar kaybolmaz.

## 6. MP düğmesinin yeri (G)

- Kapalı düğme ("👥 n" + nokta) sol araç sütununun (`#tools`) son öğesidir. Borsa, harita, hız ve kaynak çubuğu düğmelerinin üstüne binmez (Chromium'da görünür öğelerle örtüşme denetimi).
- Açılınca panel eski kaplama konumunda; kapanınca sütuna döner.
- Üstteki MP durum hapı artık yalnız bildirim ya da bağlantı sorunu varken görünür (kaynak çubuğunu kapatıyordu).

## 7. Mobil miktar (H)

`UI.stepperize` (runtime, blok `/* END MP.7.5 QTY */`): her STARS penceresindeki sayı alanının altında düğmeler.
- **Düğmeler:**
  - filo bileşimi: SIFIR · −50 · −10 · +10 · +50;
  - diğer miktarlar (anlaşma penceresinde kaynak, kaynak sözleşmesi = konvoy seferleri): SIFIR · −100 · −10 · +10 · +100;
  - galaktik borsada miktar zaten sabit düğmelerle seçiliyor (sayı alanı yok);
  - yüzdeler: SIFIR · −5 · −1 · +1 · +5;
  - MAKS (alanın `max` sınırı).
- **Kurallar:**
  - Sınırlar alanın `min` / `max` değeridir; eksi yok.
  - Düğme yalnız değeri değiştirir ve alanın `input` / `change` olaylarını tetikler: onay yine gerçek düğmeyle.
  - Klavye açılmaz; elle yazma korunur.
  - 44 px dokunma hedefi.
- Tek oyunculu ve çok oyunculu aynı kontrolü kullanır.

## 8. Testler

**Node:**
- `mp75_war_test` 4/0;
- `mp74_notice_test` 6/0 (kaydırma beklentisi MP.7.5'e göre).

**Chromium:**
- `browser-mp75` 6/0: MP düğmesi yeri (örtüşme yok), açık panel kararlılığı, AI → misafir barışı karttan + AKTİF SAVAŞLAR, miktar düğmeleri, karar olayı gizleme ve yeniden açma, sayfa hatası yok.
- `browser-mp75-perf`: ölçüm (§3).

**Yalnız Node'da:** çift barış kaydının kapanması, statüko kaydı.

Regresyon: `research/mp75/evidence/REGRESYON.md`.

## 9. Dağıtım

Render (`research/mp73/ANDROID-TEST.md` §0):
- **Branch:** `claude/stars-mp75-stability-performance`.
- **Doğrulama:** `<adres>/mp/version` → `"mp":"MP.7.5","build":"96h10p4"`.

Bu oturumdan dağıtım yapılmadı. Canlı Render ve fiziksel Android **NOT RUN**.
