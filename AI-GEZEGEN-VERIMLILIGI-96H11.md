# STARS 96H.11 — AI gezegen uzmanlaşması, otomatik inşa ve yatırım verimliliği

**Sonuç: araştırma, oyun sürümü değil.** Üretim 96H.10 olarak kalıyor:

- build `96h10`, PWA `stars-v96h10`, Save v8;
- `releases/stars-faz96h10.zip`, SHA-256 `78e76d16…be6d0`.

İki gerçek verimsizlik kanıtlandı. Altı aday ölçüldü; hiçbiri kabul kapılarının hepsini geçmedi. Kanıt: `research/96h11/`.

## 1. Başlangıç

- `main` HEAD `667cf567200c2e8a430856e14b3e395d31623b99`. HEAD, ZIP, CRC ve manifest doğrulandı.
- Kontrol `ai.js` SHA `11485356…51c6`, git'ten sabit kopya (bağ değil).
- 8 kanonik seed × 120 ay, `RELOAD_AT=60`. Seed'ler: 11, 23, 42, 99, 404, 7, 123, 2026.
- Gözlemciler saf: son Save SHA'ları 96H.10 kanonik koşularıyla aynı.

## 2. İki inşa mekanizması (araştırma 1)

**Yürütme sırası (kodla kanıtlı).** `monthTick` (`main.js:9087`) şu sırayla çalışır:

1. `economyTick`;
2. `diploTick` (`main.js:9101`): içinde `aiDisbandTick`, `aiArmyTick`, `aiDirectiveTick`, `directiveTick` (`diplomacy.js:5597–5608`);
3. … ve sonra `aiTurn` döngüsü (`main.js:9116`): önce odak, sonra yapılar.

Otomasyon her ay önce çalışır, `aiTurn` sonra. `aiTurn`'ün odak değişikliği bir sonraki ayın `economyTick`'inde etkili olur.

Ölçüm, 96H.10 kontrolü, 8 × 120:

| Soru | Cevap |
|---|---|
| 1. Aynı ay, aynı koloni? | Otomasyon emrinin verildiği 28 koloni-ayın 5'inde `aiTurn` de sipariş verdi. Aynı bina: 1 |
| 2. Hangisi önce? | `directiveTick` (diploTick içinde), sonra `aiTurn` |
| 3. İlki ikincisini nasıl etkiliyor? | Otomasyon kuyruğu doldurursa `aiTurn` en fazla ikinci işi ekler (`kuyruk < 2`). Ödeme peşin, kaynak ortak |
| 4. Çift seçim? | 1 vaka |
| 5. Otomasyon stratejik önceliği engelliyor mu? | Hayır. AI otomasyonunun adayları da `aiEconomicOrder`'dan geçiyor |
| 6. Rezervler tutarlı mı? | Evet. İkisi de `aiEconomicOrder` / `aiBuildingSustainable` kullanıyor; otomasyon ayrıca mineral 400 / alaşım 300 tabanını uyguluyor |
| 7. Ardışık kötü yatırım? | **Evet, yıkım–yeniden inşa döngüsü** (aşağıda) |
| 8. Kuyruk acil işi bekletiyor mu? | İşlerin %45,6'sı başka bir işin arkasında ortalama 32 gün bekledi. İnşa süresi ortalaması 98,8 gün. İade 0 |
| 9. Otomasyon tamamlayıcı bina ekliyor mu? | Neredeyse hiç |
| 10. AI fiilen yalnız `aiTurn` ile mi inşa ediyor? | **Evet: ücretli emirlerin %98,3'ü** (1611 / 1639). Otomasyon 28 emir (%1,71) |

Otomasyonun 11 912 koloni-ay değerlendirmesinde durma nedenleri:

| Neden | Pay |
|---|---|
| Mineral 400 altında | %41,8 |
| Zaten inşa sürüyor | %42,6 |
| Alaşım 300 altında | %12,6 |
| Boş yapı alanı yok (`col.cap`) | %1,8 |
| İnşa edecek | %1,2 |

Bütün AI kolonileri `auto=true`, çünkü koloniler `f:'sanayi'` ile kuruluyor.

**Sonuç: iki mekanizma çatışmıyor; otomasyon `aiTurn`'e yol veriyor.** Bilinçli bekleme (mineral ve alaşım tabanı, dolu kuyruk) hatalı karar değil. Bu yüzden aday A açılmadı.

### Kanıtlanan kusur 1: yıkım–yeniden inşa döngüsü

- 331 AI yıkımı oldu.
  - %47'si, aynı kolonide son 12 ay içinde tamamlanmış aynı türden bir binayı söktü.
  - 88'inde (%27) koloninin sonraki siparişi **yıkılan binanın kendisi** oldu (84'ü 6 ay içinde).
  - Yalnız %41'inde istenen bina sonraki sipariş oldu.
- En çok sökülen bina dökümhane (140).
- Neden: yerine-koyma puanı (`aiDemolitionChoice`) minerali ve alaşımı neredeyse eşit ağırlıkla sayıyor. Dökümhanenin gerçek marjinal değeri ayda −14,65 mineral, +11,63 alaşım ve −3,2 enerji (`BUILDING-VALUE.json`). Puan onu negatif değerli görüyor. Ertesi ay `aiTurn`'ün alaşım kuralları aynı dökümhaneyi yeniden istiyor.
- Bu hat 96H.6'da da görülmüştü; C1 ve C2 reddedilmişti.

## 3. Uzmanlaşma (araştırma 2)

- **Odak devlet düzeyinde seçiliyor.** Gezegenin potansiyeline (bina, yatak, nüfus) bakılmıyor.
  - Anavatan sistemi → Yönetim;
  - savaş sınırı → Garnizon;
  - gıda → Tarım;
  - mineral krizi → Sanayi (yalnız litoit türlerde, `economy.js:509`);
  - araştırma geliri < 18 + 22·sci → Araştırma;
  - yoksa → Sanayi.
- **Aylık salınım.** `FOCUS_COOLDOWN` 30 gün olduğundan odaklar eşik çevresinde her ay sanayi ↔ araştırma ↔ tarım arasında gidip geliyor. Ev dışı koloni-aylarının %1–18'inde değişim oluyor. Çarpanlar zamanla doğrusal olduğu için geçişin bedeli yok: bu bir zaman paylaşımı, kayıp değil.
- **Gezegen potansiyeline göre araştırma tahsisi.** Kolonilerin araştırma kazancı / sanayi kaybı oranı geniş: p10 0,95, p50 2,71, p90 11,28. Ama 6–12 aylık havuzlanmış kesirli sırt çantası üst sınırında aynı araştırmayı daha az kayıpla almak, o pencerelerde mineral + alaşım gelirinin yalnız ≤%0,7'sini kazandırıyor. **Gezegen başına uzmanlaşmanın tavanı küçük;** aday açılmadı. Her gezegenin farklı uzmanlaşması gerektiği varsayılmadı; ölçüldü.

### Kanıtlanan kusur 2: başkent tipi odak bütün anavatan sistemine uygulanıyor

`e.home === sys.id` kuralı, anavatan sistemindeki **her** koloniyi Yönetim'e (Etki +1,5, tüm çıktı −%5) kilitliyor. 4/8 seed'de iki devlet ay 2'den itibaren böyle. Sanayi odağıyla karşılaştırınca 120 aylık fark:

| Seed | Koloni-ay | Kazanılan Etki | Kaybedilen mineral | Alaşım | Enerji |
|---|---|---|---|---|---|
| 11 | 265 | +605 | −4392 | −1622 | −3674 |
| 42 | 299 | +569 | −4581 | −1623 | −2439 |
| 7 | 423 | +949 | −4695 | −1350 | −3300 |
| 2026 | 236 | +500 | −3031 | −681 | −1543 |

Etki yığılıyor (ay 120'de devlet başına 500–2000), ama birçok diplomasi kapısında ve konsey ağırlığında (`min(4, etk/500)`) kullanılıyor.

## 4. Yatırım verimliliği

Kanonik 96H.10, ay 60 ve 120. Her binanın marjinal aylık net değeri `aiBuildingDelta` ile salt okunur ölçüldü:

| Bina | Örnek | Bedel | Aylık net (medyan) |
|---|---|---|---|
| maden | 231 | 120 min | +15,7 min, −1,6 ene (geri ödeme 7,7 ay) |
| santral | 231 | 110 min | +18,3 ene |
| çiftlik | 217 | 110 min | +11,8 yiy, −1,6 ene |
| liman | 212 | 180 min | +17,0 ene, +0,7 etk |
| lab | 175 | 190 min | +13,3 ara, −4,8 ene |
| dökümhane | 170 | 210 min | −14,7 min, +11,6 ala, −3,2 ene |
| fabrika | 127 | 170 min | +16,0 tuk, −5,3 min, −3,2 ene |

Lab alaşımla değerlendirilmedi; her bina kendi çıktısıyla ölçüldü.

## 5. Adaylar ve sonuçlar

Fayda yalnız tetiklenen devletlerde ve plasebo bandının dışında kalan farklar için iddia edildi. Bant: ilk karar farkından bir ay önceki checkpoint, ana koşu + 4 tek-çekimli plasebo.

| Aday | Değişiklik | Sonuç |
|---|---|---|
| R | Yerine koyma, aynı ağırlıklarla söktüğünden fazla değer eklemeli (üretken binalar için) | **RET.** Yıkım 331 → 229, ama aynı binayı yeniden inşa 88 → 85. Teknoloji 336 → 312, mineral stoku 68k → 86k (yalnız stoklama) |
| B1 | Yönetim yalnız başkent sistemindeki ilk koloniye; diğerleri ortak kuralla | **RET.** Tetiklenmeyen seed'ler bayt-bayt aynı. Tetiklenenlerde kazanç var, ama seed42 devlet4 mineral tuzağına düşüyor: kritik ay [3,45,9,57,57], kontrol [1,0,0,2,2] (bant dışı) |
| M | `e.inc.min < 0` litoit mineral krizi gibi sayılır | **RET** (tek başına). 23/99/123'te tetikleniyor; bant dışı etki yok |
| BM | B1 + M | **RET.** 120 ay iyi (kanonik 8 × 120: teknoloji 336 → 352, kritik ay 14 → 11, teslimat 417 → 513). Ama 240 ayda seed42 devlet4 min/tuk krizi medyan 98 [1..129], kontrol 1 [0..55] |
| BM2 | B1 + herhangi bir ene/min/ala/tuk açığı → Sanayi | **RET.** seed42 düzeliyor ama her seed'de tetikleniyor. 8 × 120 kritik ay 14 → 25, teknoloji 336 → 328 |
| BM4 | B1 + `aiEconomicOrder`'ın kendi aciliyet ölçütü ene/min/ala/tuk'u acil sayınca Sanayi | **RET.** Ayrıntı aşağıda |

### BM4 ayrıntısı (120 ay, 8 seed bandı)

Olumlu:

- Kritik ay 7/8 seed'de eşit ya da düşük. seed99'da medyan 0 → 1.
- seed42 240 ayda kriz düzeliyor: 1 [0..4].
- Bant dışında yükselenler:
  - seed42 mineral ve araştırma;
  - seed2026 alaşım;
  - seed123 araştırma ve teknoloji, kritik ay düşük;
  - seed23 alaşım;
  - seed404 devlet4 enerji, tüketim malı ve güç.

Olumsuz, ret gerekçesi:

- **Ticaret koruması geçmiyor.** 96H.6'daki %85 kapısı:
  - seed11 240 ayda teslimat medyanı 288 → 95 (ortalama −%34);
  - seed7 120 ayda 104 → 52.
- Etki dört B1 seed'inde bant altında (−%10–25).
- seed404'te dünya gemi ve güç bandı altında: dönem sonundaki bir savaşta devlet2 45 → 7 gemi. O bantta yalnız 3 bağımsız dünya var.
- Değişiklik geniş: her seed'i değiştiriyor.

### 6/12/24 ay (B1 ailesi, tetiklenen devletler)

- İlk 6–12 ay: ikincil anavatan kolonisi Araştırma'ya geçiyor. Araştırma +%1–6 (bant üstü), mineral −%2 (bant altı), Etki −%15–25.
- Büyük çıktı farkları 24 aydan sonra birikiyor.

## 6. Askerî etki

Üretim kodu değişmedi, bu yüzden 96H.8–96H.10 davranışlarının tamamı aynı. Adaylarda savaş davranışı kayıyor:

- BM kanonik 8 × 120'de başlatılan savaş 11 → 4.
- seed11 240 ayda güç 85,6k → 71,8k, ama teknoloji 50 → 92 ve yaşayan devlet 3 → 5.

Bu yüzden ekonomik aday ayrıca askerî doğrulama ister.

## 7. Karar

- **96H.10 korunuyor;** sürüm, ZIP ve manifest değişmedi.
- Bu fazın en umut verici bulgusu B1 (başkent tipi odak kapsamı). Ama B1, Sanayi'yi yalnız litoit mineral krizinde seçen genel odak zincirini daha çok koloniye açıyor. Yoksul ve sanayi açığı olan bir devlet Araştırma'ya kayıyor.
- Önerilen sonraki dar adım:
  1. Genel zincire litoit dışı sanayi açığı yanıtını, başka yerde araştırmayı düşürmeden ekleyip **tek başına** ölçmek;
  2. sonra B1'i Etki → ticaret (teslimat) analiziyle birlikte yeniden denemek.

Testler: yalnız belge ve araştırma; runtime değişmedi. Regresyon sonucu `PROJE-DURUMU.md` içinde. Fiziksel Android NOT RUN.
