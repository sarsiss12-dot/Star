# BETA-RIVAL-BLOCS.0 — rakip bloklar, AI diplomasisi ve mobil oynanış (14 Kasım 2026)

Dil kuralı: **PASS / PARTIAL / FAIL / NOT RUN** ayrı yazılır. Tarayıcı testleri bu konteynerde **yerel Chromium**'dur; MP'de üretim relay süreci ve yerel TLS vekili kullanılır. Canlı Render, fiziksel Android, LAN ve kullanıcı kabulü **NOT RUN**. Hiçbir madde TAMAMLANDI değildir.

Referans görseller ("268958.png", "268956.png", "268957.png") ve "onaylı taslak" bu oturuma **ulaşmadı**. Arayüz, metindeki tarife göre yapıldı.

## 1. Kaynak, dal, sürüm

| | |
|---|---|
| Doğrulanmış taban | `claude/stars-pregame-galaxy0` · taslak PR #43 · `03bdb9b491a1df4e2b311065d8e0c91542890829`. GitHub HEAD ile aynı; daha yeni aday yok. #41 ve #42 bu tabanda. |
| Başlangıç HEAD | `03bdb9b` |
| Aday dal | **`claude/stars-rival-blocs0`** |
| Bitiş HEAD | PR ve sohbette (rapor commit'i) |
| Sürüm | oyun **96h10p30** · PWA `stars-v96h10p30` · Save8 **v8** · MP **MP.8.9b27** · paket **4** · protokol **1** |
| Paket uyumu | p30 yükleyicisi p6–p29, p25u1 ve p27s1 paketlerini kabul eder |

## 2. Özet tablo

| İş | Durum |
|---|---|
| 1. Kuruluş hunisinin ölçümü (p29) | PASS (§3) |
| 2. İttifaksız kuruluş: davet, açık kabul, son onay; ittifaklar birlikte | PASS (Node, MP komutu, gerçek düğme Chromium) |
| 2. İttifaksız üye kabulü (Federasyonuma Davet Et → oy → aday kabulü) | PASS. Yol p29'da motorda vardı; görünür metin ve testler eklendi (§4). |
| 2. İki küçük devletin savunma bağından federasyona geçmesi (hedefli senaryo) | PASS (R6, 12 ay sürdü) |
| 3. AI katıl / bağımsız kal / rakip blok kur | PARTIAL — 8 AI'da seed 11 ve 23'te kalıcı ikinci blok, 404'te etki yok; 16 AI'da seed 23'te güçlü etki; 11 ve 404'te kontrolde de çoklu blok var, 240. ayda aday payı bandın altında (§6). Doğal kampanyada üyelikten ayrılma hiç tetiklenmedi. |
| 4. Dürüst–Sahtekâr söz bozma eşiği | PASS (kontrollü deney §7). Doğal kampanyada nadir (birkaç olay). |
| 5. Sahte Bayrak kampanya ölçümü | PASS (ölçüm; §8). Operasyon oranlarına dokunulmadı. |
| 6. Rakip Doktrinler klavyesiz ayar | PASS (portre 390×844 ve dar yatay 800×360, gerçek dokunma) |
| 7. 0,05 / 0,10 / 0,15× gezegen çarpanı | PASS (500 / 16 / 3 seed tablosu, küçük harita, Save8, MP lobi) |
| 8. Büyük bölge armaları | PASS (yerel Chromium; 500 sistem maliyeti ölçüldü) |
| 9. Koloni panelinden otomatik inşaat gemisi | PASS (Node 7/0 + Chromium; MP misafir komutu Node'da) |
| 10. Kampanya karşılaştırması (kontrol / plasebo / aday) | PASS (§6) |
| 10. p29 regresyonu ve 500 / 16 / 2 / 15 dk | PASS — Node fark yalnız iki koruma testi, düzeltildi; Chromium 8 test ve MP8 D/G/L/S/E/F/P PASS (§12) |
| Canlı Render, fiziksel Android, LAN | NOT RUN |

## 3. AI federasyon kuruluş hunisi (p29 tabanı, ölçüm)

**Yöntem:**
- Salt okuma tanısı her ay her bağımsız AI için kuruluş aşamasını sınıflandırır.
- `fedFoundRead` ve RND_STATE denetimiyle saflık doğrulandı: tanılı ve tanısız 30 ay aynı Save8 SHA-256 ve aynı RNG.
- Kanıt: `evidence/beta-rival-blocs0/huni/`.

**8 AI, orta galaksi, 120 ay** (bağımsız AI-ay):

| Seed | Bağımsız AI-ay | Müttefik bağımsız ortak yok | Tek müttefik | Yağmacı yolu | Etki yetersiz | Müttefikler reddetti | Önce katılım | İttifak şartı kalksa ≥2 gönüllü ortak olan AI-ay |
|---|---|---|---|---|---|---|---|---|
| 11 | 475 | 275 | 36 | 133 | 13 | 5 | 13 | 65 |
| 23 | 261 | 148 | 18 | 72 | 13 | 2 | 8 | 51 |
| 404 | 252 | 126 | 41 | 62 | 22 | 0 | 1 | 149 |

- Ortak reddinin baskın nedeni **"Güven veya ilişki yetersiz"** (ilişki < 15): 11 → 492, 23 → 346, 404 → 326 kez.
- İkinci neden **"bilinen yardım rotası yetersiz"**: 135 / 126 / 144 kez.
- 16 AI (s200) koşularında da aynı tablo; ayrıntı `huni/funnel-p29-*-16.json`.

**Sonuç.** Rakip blok kurulmamasının kökü katılma cezası değil. Kökler şunlar:
1. Kuruluşun **karşılıklı ittifak şartı** (en büyük eleme).
2. Tek insanlı / AI-only kuruluşta **en az üç kurucu** şartı: iki küçük devlet asla kuramıyordu.
3. Yağmacı tercihli AI'ların genel kuruluşa hiç düşmemesi.
4. Kuruluş bedeli (220 Etki).

Ayrıca bağımsız AI, katılabileceği bir blok varken kuruluşu hiç değerlendirmiyordu.

## 4. İttifak ve federasyon daveti tek işlem

**Kuruluş:**
- `fedFoundCandidate` artık ön ittifak istemiyor (temas, bağımsızlık, savaşsızlık ve doktrin engeli yeterli).
- Eksik karşılıklı ittifaklar `foundFederation`'ın mevcut ittifak yazımıyla, **son kuruluş onayında, federasyonla birlikte** kurulur.
- Davet ve kabul aşamasında ittifak yazılmaz. Ret, iptal, süre dolması ya da kurucular arası savaş yarım ittifak bırakmaz ve bedel kesmez (R2).
- Kurucu sayısı: iki AI ya da iki insan yeterli. Tek insanlı kuruluşta BETA-FED-FOUND.0 kuralı (en az iki AI ortak) korunur.
- Davette tür, oy düzeni, savaş yükümlülükleri (`fedDutyText`), **kurulacak ittifaklar** ve **süren savaşlar** görünür (`fedAllianceText`). Kuruluştan önceki savaşlar ortak savunmaya girmez.
- Kadro değişikliğinde mevcut taslak düzenleme / rıza yenileme yolu (BETA-FED-AI.0) aynen geçerli.

**Kurulu federasyona üye:**
- Diplomasi'deki **Federasyonuma Davet Et** düğmesi, aday üyelerle müttefik değilken de öneriyi gündeme gönderir.
- Yol p29 motorunda zaten vardı (`fedAdmissionGate(…, true)`). Bu fazda görünür metin eklendi: "Ön ittifak gerekmez … kurulacak ittifaklar".
- Anayasa oyu ve adayın açık kabulüyle üyelik ve eksik ittifaklar bütün üyelerle birlikte uygulanır (`acceptFedInvite`).
- İnsan üyenin oyu otomatik verilmez; insan adayın kabulü otomatik değildir (R5).
- Kabul anında aday, üye listesi, yükümlülük anahtarı ve savaş durumu yeniden denetlenir. Çift kabul ikinci üyelik yaratmaz.

**Denetimli uç durumlar:**

| Durum | Test |
|---|---|
| Ret, süre dolması, iptal, kurucular arası savaş | R2 |
| Çift son onay / çift MP komutu | R1, M1, M3 |
| Save8'de bekleyen rıza | R10 |
| MP misafir kurucu ve misafir aday | M1–M3 |

AI tarafı:
- Davet gönderir (`aiRivalBlocChoice` → `fedFoundPropose`).
- Değerlendirir (`fedFoundAssessment` → `aiFoundWilling`).
- Yanıtlar: bütün AI kabulleri davette geldiyse son onay aynı çağrıda; ret olursa kadro düzenlenir ya da süreç iptal edilir.
- AI kuruluşa insanı otomatik davet etmez (BETA-FED-FOUND.0); insan AI'ları davet eder ve AI yanıt verir.

**Hedefli senaryo (R6):**
- Dört AI'lık bir federasyon var. Karşısında iki küçük AI, karşılıklı ittifakla (savunma bağı) ve büyük bloğa ilişki −30.
- Eski kural engeli kanıtlandı: `canFoundFed` → "En az 2 bağımsız, kabul eden AI müttefik gerekir (şu an 1)".
- Yeni yolla `aiFederationPolitics` iki kurucuyla federasyon kurdu; denge birliği bedeli 132 Etki ödendi ve blok 12 ay sürdü.

## 5. AI: katıl / bağımsız kal / rakip blok kur

- **Aynı değerlendirme:**
  - Katılım puanı: mevcut `aiFedWilling`.
  - Kuruluş puanı: ortakların `aiFedAdmissionScore` ortalaması + ortak tehdit.
  - Katılım ancak puanı yeni bloğu 0,03 geçerse seçilir; ikisi de 0,5'in altındaysa AI bağımsız kalır.
  - Etkenler: ilişki, güven, doktrin ve etik uyumu, ortak düşman, ekonomik / bilimsel çıkar, antlaşmalar, bağımsızlık eğilimi, bilinen rota ve gözlenen güç.
- **Ortak tehdit (`aiBlocThreat`):** Bilinen en büyük federasyon devletlerin en az üçte birini kapsıyorsa ve düşmanca ise (savaş, ilişki < 5 ya da gücü kendisinin 1,4 katı) +0,10–0,28. Hem kurucu hem ortak için sayılır. Kriz sırasında kapalıdır, böylece geniş koalisyon serbest kalır.
- **Denge birliği bedeli (oyun kuralı, herkese aynı):** Kurucuların hiçbiri üye değilken yaşayan devletlerin en az üçte birini kapsayan bir federasyon varsa kuruluş bedeli %40 düşer (220 → 132). Büyük blok yokken bedel aynı kalır.
  - Ölçüm: AI'ın bu fırsat varken casusluk / istihbarat paktı harcamasını ertelemesi denendi ve etkisizdi; geri alındı.
- **Tempo ve bağlılık:**
  - Galakside ayda en çok bir AI kuruluş girişimi olur.
  - Başka bir kuruluş sürecine bağlı AI yeni davete kabul vermez ve kendisi öneri yapmaz.
  - Kabul eden müttefik varsa önce müttefikler seçilir; böylece eski topoloji tercihi korunur.
- **Yağmacı tercihli AI:** BETA-FED-AI.0 yolu ve kuralları aynen geçerli.
- **Üye kalma / ayrılma (`aiFedStayReview`):**
  - Ön koşul: en az 720 gün üyelik.
  - Çatışma ölçüsü: uyum, başkana ilişki ve tür uyumu.
  - Çatışma 12 ± 8 ay sürmeli; dürüst üye daha uzun sabreder.
  - Ayrıca yaşayabilir bir alternatif (başka blok ya da ortak) gerekir.
  - Ayrılış anayasaya uygundur (`leaveFederation`), ihanet sayılmaz.
  - Doğal kampanyalarda hiç tetiklenmedi.
- **Yapay üye tavanı, zorunlu kamp, otomatik savaş yok. Yeni RNG çekimi yok.**

## 6. Kampanya karşılaştırması (kontrol p29 / plasebo / aday)

**Kurulum:**
- Aynı ayarlar. Kontrol kökü `03bdb9b`'nin sabit kopyası (`git archive`). Plasebo = kontrol + kurulumdan sonra tek `rnd()`. Aday = sabit kopya.
- 240 aylık koşu; 120. ay özeti aynı koşudan çıkarıldı.
- Ölçüm kancaları saf: 404 / 48 ay, kancalı ve kancasız aynı Save8 SHA-256 ve aynı RNG.
- Kanıt: `evidence/beta-rival-blocs0/kampanya/*.json`, betik `blocs.cjs`, `campaign.sh`.

Tablo değeri: **en büyük blok geç dönem payı / en çok eşzamanlı blok / çok-bloklu ay / ikinci bloğun ömrü (ay) / bağımsız (geç ort.) / ilk federasyon ayı**.

**8 AI, orta galaksi:**

| Seed · ay | Kontrol | Plasebo | Aday |
|---|---|---|---|
| 11 · 120 | 0,56 / 1 / 0 / 0 / 4 / 45 | 0,56 / 1 / 0 / 0 / 4 / 29 | **0,44 / 2 / 28 / 28** / 4,07 / 20 |
| 23 · 120 | 0,77 / 1 / 0 / 0 / 2,12 / 30 | 0,75 / 1 / 0 / 0 / 2,23 / 35 | **0,44 / 2 / 107 / 107** / 3 / 13 |
| 404 · 120 | 0,78 / 1 / 0 / 0 / 2 / 34 | 0,77 / 1 / 0 / 0 / 2,03 / 32 | 0,76 / 1 / 0 / 0 / 2,18 / 23 |
| 11 · 240 | 0,62 / 1 / 0 / 0 / 3,46 | 0,62 / 1 / 0 / 0 / 3,29 | **0,43 / 2 / 148 / 148** / 3,2 |
| 23 · 240 | 0,79 / 1 / 0 / 0 / 1,89 | 0,79 / 1 / 0 / 0 / 1,84 | **0,48 / 2 / 227 / 227** / 2,35 |
| 404 · 240 | 0,68 / 1 / 0 / 0 / 3,35 | 0,78 / 1 / 0 / 0 / 2 | 0,80 / 1 / 0 / 0 / 1,98 |

Aday sütunu `b5a045a` (muhafazakâr savunma kaçışı eşiği) ile **yeniden koşuldu**. 8 AI aday satırları bayt bayt aynı çıktı; 16 AI'da yalnız 11 · 240 bağımsız ortalaması ve 404 satırları değişti. İlk eşikle alınan aday JSON'ları `kampanya/eski-kacis-esigi/` altında saklı.

**16 AI, s200:**

| Seed · ay | Kontrol | Plasebo | Aday |
|---|---|---|---|
| 11 · 120 | 0,30 / 3 / 90 / 90 / 7,12 / 26 | 0,25 / 2 / 76 / 76 / 9,68 / 25 | 0,25 / 5 / 108 / 108 / 4,93 / 12 |
| 23 · 120 | 0,52 / 1 / 0 / 0 / 7,6 / 30 | 0,56 / 1 / 0 / 0 / 7,55 / 26 | **0,48 / 3 / 104 / 104** / 4,75 / 12 |
| 404 · 120 | 0,38 / 3 / 91 / 91 / 3,48 / 27 | 0,32 / 3 / 90 / 90 / 4,12 / 25 | 0,29 / 4 / 108 / 108 / 4,43 / 11 |
| 11 · 240 | 0,32 / 3 / 210 / 210 / 2,6 | 0,53 / 2 / 196 / 196 / 5,47 | 0,24 / 5 / 228 / 228 / 5,63 |
| 23 · 240 | 0,85 / 1 / 0 / 0 / 2,25 | 0,77 / 1 / 0 / 0 / 3,98 | **0,56 / 3 / 224 / 224** / 2,05 |
| 404 · 240 | 0,39 / 3 / 211 / 211 / 3,27 | 0,38 / 3 / 210 / 210 / 2,45 | **0,25 / 4 / 228 / 228** / 4,13 |

**Okuma** (fayda yalnız plasebo bandı dışında iddia edilir):

- **8 AI, seed 11 ve 23:** Kontrol ve plaseboda hiç ikinci blok yok. Adayda ikinci blok 28–227 ay ayakta kalıyor; en büyük blok payı 0,62–0,79 → 0,43–0,48. Bant dışı → **fayda**.
- **8 AI, seed 404:** Fark yok; pay bant içinde (0,80 ile 0,68–0,78 arası).
- **16 AI, seed 23:** Kontrol ve plaseboda tek blok; adayda 3 blok, pay 0,85 / 0,77 → 0,56. **Fayda**.
- **16 AI, seed 11 ve 404:** Kontrolde de 2–3 blok var. Adayda blok sayısı 4–5'e çıkıyor.
  - Seed 11 · 240: pay 0,24, bant 0,32–0,53 (bant altında, düşük).
  - Seed 404 · 240: pay 0,25, bant 0,38–0,39 → yeni eşikle bant dışı **düşük**. İlk eşikte bant içindeydi (0,38).
  - Kuruluş sonrası dağılma: seed 11'de 1, 404'te 0 (ilk eşikte 3 ve 1).
- **İlk büyük bloğun büyüme hızı:** İttifaksız kuruluşla ilk federasyon daha erken kuruluyor (ay 11–23; kontrolde 26–45). Ama 60. aydaki en büyük blok payı adayda eşit ya da daha düşük:
  - 8 AI: 0,44 / 0,44 / 0,78 (kontrol 0,56 / 0,67 / 0,78)
  - 16 AI: 0,24 / 0,35 / 0,29 (kontrol 0,29 / 0,38 / 0,35)
  - Yani birleşik davet ilk bloğun **büyümesini hızlandırmadı**.

**Kuruluş, katılım ve ayrılma gerekçeleri** (6 koşunun toplamı):

Sayılar kampanya JSON'larının `ev` alanından toplandı (6 koşu, 240 ay).

| Kol | Kuruluş | Başvuru | Katılım | Savunmadan kaçış | İhraç | Ayrılma | Dağılma |
|---|---|---|---|---|---|---|---|
| Kontrol | 10 | 73 | 31 | — (mekanik yok) | 0 | 0 | 0 |
| Aday | 17 | 58 | 28 | 2 | 1 | 0 | 1 |

İlk eşikte adayda savunmadan kaçış 9 idi; yeni eşikte kaçış yalnız 8 AI seed 404'te (2 olay).

## 7. Dürüstlük ve söz bozma

- **Ölçek:** `aiHonesty` = ahl / 3, −1…+1. Yalnız AI'ya uygulanır; insanın önizlemesi değişmez.
- **Söz bozan savaş freni (`warAppetite`):** Saldırmazlık ve ittifak freni `×(1+0,40·h)`. Üstüne itibar maliyeti eklenir: bilinen devlet × 0,02 (en çok 0,30), `×(1+0,5·h)`.
  - Doğrudan "gelecekte ortak bulmanın maliyeti" ve misilleme tartısıdır.
  - Kazanç (fırsat, gerekçe, kin) mevcut terimlerle aynı.
- **İttifak feshi (`aiReviewAlliances`):** Gerilim + (−h·15). Sahtekâr çıkar uğruna daha erken feshediyor.
- **Federasyon savunma yükümlülüğü (`fedDefend` → `aiDefenseShirk`, RNG yok):**
  - Kararı belirleyenler: bilinen güç oranı (sınırlı), bütçe, açık cephe, kurbana ilişki ve dürüstlük.
  - Kaçışın sonuçları: kurbanın hafızasında `paktBozdu`, öteki üyelerde `sozAksadi` ve ilişki −10, uyum −6, haber "Savunma yükümlülüğü çiğnendi", `oathLog`.
  - Aynı çağrının tekrarı ikinci kez kaydedilmez.
- **Kayıt ayrımı:**
  - Anayasaya uygun ayrılış ihanet sayılmaz.
  - Yeni teklifi reddetmek kayıt üretmez.
  - Yürürlükteki sözü çiğneyen savaş mevcut `remember` (ihanet / paktBozdu) kaydını ve galaksi çapında −14 ilişkiyi alır. Ek olarak gerekçesi haber akışına ("İttifak / Saldırmazlık çiğnendi — gerekçe") ve devletin `oathLog`'una yazılır.

**Kontrollü deney** (aynı dünya, aynı militarist doktrin, yalnız ahl farklı; gerçek `aiWarReview`, 12 ay; aday 120 / kontrol 60 RNG tohumu):

Saldırmazlık bozulan deneme oranı:

| Kin (fırsat) | ahl −3 | −1 | 0 | +1 | +3 | Kontrol p29 (her ahl) |
|---|---|---|---|---|---|---|
| −20 (düşük getiri) | 61/120 | 0 | 0 | 0 | 0 | 0/60 |
| −60 (orta) | 103/120 | 73/120 | 36/120 | 0 | 0 | 28/60 |
| −110 (yüksek) | 117/120 | 105/120 | 98/120 | 80/120 | 0 | 50/60 |

Federasyon savunma çağrısı (katılım), gözlenen güç oranına göre:

| Güç oranı | Sahtekâr (−3) | Nötr (0) | Dürüst (+3) | Kontrol |
|---|---|---|---|---|
| 0 | katıldı | katıldı | katıldı | hepsi katıldı |
| 65 | **kaçtı** | katıldı | katıldı | hepsi katıldı |
| 435 | **kaçtı** | katıldı | katıldı | hepsi katıldı |

Yukarıdaki savunma satırları `b5a045a` eşiğiyle yeniden ölçüldü. İlk eşikte nötr de kaçıyordu; `faz94d1` / `faz95d` koruma testleri bunu yakaladı (ilk FAIL kayıtları `regresyon/` altında). Yeni eşikte nötr üye yalnız ek baskı (bütçe, açık cephe) varken kaçar. Eski ölçüm: `etik/eski-kacis-esigi/aday.json`.

Okuma:
- Kontrolde ahl kararı hiç değiştirmiyor.
- Adayda aynı fırsatta sahtekâr erken bozuyor, dürüst sözünü tutuyor. Düşük getiride nötr ve dürüst vazgeçiyor; yalnız koyu sahtekâr bozuyor.
- AI'ın gerekçesi `oathLog`'da duruyor (örnek: "Kayıp Topraklar", "Bilinen güç oranı 65.31").

**Doğal kampanyada** (aday, `oathLog`):
- İttifak / saldırmazlık bozan savaşlar 8 AI'da 1–3, 16 AI'da 2–3 olay. Gerekçeler: Bağımsızlık Savaşı, Senyörlük Yükümlülüğü, Sahte Bayrak Kanıtı.
- Savunmadan kaçış: yeni eşikte 12 koşunun toplamında 2 olay (8 AI seed 404). İlk eşikte 2–5 olay / koşu.
- **Ölçüm notu:** Kampanya betiğinin ayrı ihanet sayacı (`oathAlly` / `oathNap`) bu vasal / Sahte Bayrak yollarını yakalamadı ve 0 gösterdi. Bu yüzden kontrol kolunda doğal söz bozma sayısı **NOT RUN**; karşılaştırma yukarıdaki kontrollü deneye dayanır.
- Kanıt: `evidence/beta-rival-blocs0/etik/`.

## 8. Sahte Bayrak — kampanyadaki etki (ölçüm, mekanik değişmedi)

**Sayaçlar:**
- Fırsat aşamaları `aiFalseFlagTick`'in kendi koşullarıyla, salt okuma ve RNG denetimiyle sayıldı (AI-ay):
  - Bütçe (Etki ≥ 260)
  - Bekleme süresi bitmiş
  - Hedef (istihbarat ≥ 2)
  - İnandırıcı günah keçisi (istihbarat 3 ve husumet ≥ 25)
- Sonuçlar `falseFlagOp` dönüşünden sınıflandırıldı.
- Gecikmeli savaş yalnız hedefin günah keçisine ilanı, operasyonun kaynak (`source`) kaydı hafızada dururken (≤ 36 ay) sayıldı.
- Sonradan ifşa (dosyanın `framed` alanının kalkması) ve ifşa sonrası hedefin gerçek faile savaşı ayrıca izlendi.

| Seed · AI · kol | Bütçe | Bekleme | Hedef | Keçi | Beklenen deneme | Deneme | Anında savaş | Savaşsız başarı | İfşa (suçüstü) | Sessiz | Gecikmeli savaş | Sonradan ifşa | İfşa → savaş |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 11·8 kont | 1465 | 1108 | 618 | 280 | 11,2 | 9 | 0 | 2 | 3 | 4 | 0 | 0 | 0 |
| 11·8 aday | 1331 | 1093 | 672 | 128 | 4,3 | 6 | 1 | 1 | 1 | 3 | 0 | 1 | 0 |
| 23·8 kont | 1543 | 1402 | 628 | 38 | 2,0 | 3 | 0 | 1 | 1 | 1 | 0 | 1 | 0 |
| 23·8 aday | 1409 | 1057 | 541 | 132 | 5,0 | 9 | 4 | 0 | 3 | 2 | 0 | 4 | 0 |
| 404·8 kont | 1415 | 1138 | 637 | 216 | 9,4 | 10 | 3 | 1 | 2 | 4 | 0 | 2 | 0 |
| 404·8 aday | 1377 | 1367 | 585 | 30 | 1,3 | 3 | 0 | 2 | 0 | 1 | 0 | 1 | 0 |
| 11·16 kont | 2383 | 2104 | 709 | 100 | 4,0 | 8 | 0 | 0 | 1 | 7 | 0 | 0 | 0 |
| 11·16 aday | 1719 | 1540 | 631 | 172 | 7,8 | 7 | 1 | 0 | 2 | 4 | 0 | 1 | 0 |
| 23·16 kont | 2600 | 2515 | 784 | 38 | 1,5 | 3 | 1 | 0 | 1 | 1 | 0 | 1 | 0 |
| 23·16 aday | 2573 | 2310 | 1150 | 141 | 5,7 | 7 | 0 | 2 | 4 | 1 | 0 | 1 | 0 |
| 404·16 kont | 2574 | 2380 | 804 | 129 | 4,3 | 6 | 0 | 4 | 0 | 2 | 0 | 3 | 0 |
| 404·16 aday | 2192 | 1988 | 675 | 184 | 7,5 | 7 | 1 | 2 | 1 | 3 | 0 | 1 | 0 |

Plasebo satırları: `kampanya/placebo-*.json`.

Okuma:
- **Eleme:** En büyük eleme "hedef → inandırıcı keçi" adımında (istihbarat 3 + husumet ≥ 25). Ardından aylık %3–%10 zar geliyor; beklenen deneme ≈ gerçekleşen deneme.
- **Kampanya başına:** 240 ayda galaksi başına 3–13 deneme. Anında savaş 0–4, savaşsız iftira 0–4, suçüstü 0–5, sessiz başarısızlık 1–7.
- **Gecikmeli savaş:** Operasyon kaydına bağlanabilen gecikmeli savaş **hiç yok**. Sonradan ifşa 0–4; ifşa sonrası gerçek faile savaş da **yok** (ilişki onarımı ve kin yönü değişiyor, savaş çıkmıyor).
- **Ahlak:** `aiFalseFlagTick` ahlak eksenini kullanmıyor; dürüst (+1…+3) AI'lar da deniyor (örnek 404·8 kontrol: +3 ile 2 deneme). Bu fazda operasyon oranları **değiştirilmedi** (istenen). Sonraki faz için bulgu.

## 9. Kurulum: Rakip Doktrinler ve düşük gezegen çarpanları

**Rakip Doktrinler:**
- Seçimler: **Doğal / Az / Orta / Çok**. Toplam AI'ya göre aralık: Az 0–⌈0,2n⌉, Orta ⌊0,25n⌉–⌊0,45n⌉, Çok ⌊0,5n⌉–⌊0,75n⌉.
- **En az / En çok** için 48×44 px −/+ düğmeleri; sayı düz metin; sayı kutusu ve klavye yok.
- "Seçili: 5–6 AI" ya da "… (sabit sayı)" yazar. Elle değişiklikte hazır seçim vurgusu kalkar ("özel aralık").
- `0 ≤ En az ≤ En çok ≤ n` her dokunuşta korunur: sınırı geçen değer ötekini birlikte taşır, sınırdaki düğme pasiftir. AI sayısı düşünce aralık uyarlanır.
- Metin, ayarın militarist + kriminal + Fanatik Arındırıcı **toplamını** belirlediğini söyler.

**Gezegen çarpanı:**
- Listeye 0,05 / 0,10 / 0,15× eklendi; 1× varsayılan.
- Aynı p29 kuralı: normal adayların yaklaşık %5 / 10 / 15'i kalır, kalanlar ölü dünyaya döner. Toplam gezegen sayısı, konum, hat ve başkentler değişmez.
- Ekranda kısa açıklama: "≈ normal adayların %5'i kalır".

**500 sistem / 16 AI** (`gezegen-carpani-dusuk.json`, K1):

| Seed | 1× normal / korunan / toplam | 0,25× | 0,15× | 0,10× | 0,05× |
|---|---|---|---|---|---|
| 11 | 333 / 92 / 425 | 83 / 92 / 175 | 50 / 92 / 142 | 33 / 92 / 125 | 17 / 92 / 109 |
| 23 | 381 / 84 / 465 | 95 / 84 / 179 | 57 / 84 / 141 | 38 / 84 / 122 | 19 / 84 / 103 |
| 404 | 379 / 93 / 472 | 95 / 93 / 188 | 57 / 93 / 150 | 38 / 93 / 131 | 19 / 93 / 112 |

- "Korunan" = başkent sistemleri + nadir dünyalar + özel yataklı dünyalar; bütün çarpanlarda aynı.
- **Küçük harita** (seed 11, 30 sistem, 3 AI, 0,05×): Normal aday 2 → **0**. Başkentler korundu. 36 ayda AI ölü dünyaya koloni kurmadı, istisna yok (K2).
- **Kayıt / yükleme:** Kayıtlı galaksi yeniden üretilmez; çarpan alanı olmayan eski kayıt 1× sayılır (K3).
- **MP lobi:** 0,05× kabul edilir, geçersiz değer reddedilir (K4).
- **Chromium:** 390×844 ve 800×360'ta gerçek dokunma; Az → 5–6 → sabit → AI sayısı 8→3 → Doğal akışı ve kurulum sonucuna yansıma: 8 AI'da 5–6 aralığı → oyunda 6 rakip doktrin; 0,05× → normal aday 26 → 1 (PASS).

## 10. Büyük bölge armaları

**Seçenek:**
- Harita menüsü (🗺) → KATMANLAR → **🛡 Büyük armalar**. Varsayılan kapalı; p29 küçük armaları aynen.
- Cihazda saklanır: `stars:bigEmblems` (Save8, ayna ve ağ dışında).
- Oyun içinde ayrı bir "Harita Ayarları" menüsü yok; harita katmanları bu menüde.

**Yerleşim (dünya koordinatı):**
- Sınır dokusunun kuralı kullanılır: en küçük uzaklık / menzil, kenar dalgası ≥ 0,84.
- Örnek noktada çember, kendi bölgesinin en yakın sisteminin menzilinde ve yabancı sistemlerin eşit skor sınırının berisinde kalmalı. Bu koşulu sağlayan en büyük yarıçaplı nokta seçilir.
- Arma çapı o yarıçapın ⅔'ü: bölgenin iç genişliğinin yaklaşık üçte ikisi.
- Parçalı topraklarda her parça ayrı değerlendirilir; tek sistemli bölge de çizilir.
- Yıldız armanın merkezinde olabilir, arma yıldızdan kaçmaz.

**Çizim:**
- Sıra: dolgu → arma → hatlar → yıldızlar → filolar → yazılar.
- Arma saydamlığı iki kipte de geçerli; %0 iki kipte de kapatır. Dokunma katmanı değişmez.
- Yerleşim yalnız sınır dokusu anahtarı (konum, sahip, menzil, sis, mod) değişince yeniden hesaplanır.
- Yalnız görülmüş sistemler kullanılır; sis altındaki kimlik açılmaz (`region.known`).

**Chromium (844×390 yatay dokunma):**
- Kapalı ve açık ekran görüntüsü aynı kamerada alındı (`tarayici/arma-kucuk-kapali.png`, `arma-buyuk-acik.png`).
- Her armanın merkezi + 8 kenar noktası kendi bölgesinin içinde.
- Tercih yeniden yüklemede geri geliyor.

**500 sistem / 16 AI, 17 arma, kare başına `View.draw`:**

| Kip | Medyan | p95 |
|---|---|---|
| Kapalı (küçük armalar) | 2,1 ms | 6,5 ms |
| Açık (büyük armalar) | 1,2 ms | 2,7 ms |

- Yerleşim hesabı 0,4 ms ve bir kez yapılıyor.
- Not: Açık kipte daha hızlı, çünkü büyük kip kare başı aday aramıyor.

## 11. Koloni panelinden otomatik inşaat gemisi

**Görünürlük:**
- Sistem paneli (kendi koloninin sağ yönetim paneli, sistem düzeyinde) → **OTOMATİK İNŞAAT GEMİSİ**. Aynı sistemdeki koloniler aynı görevi görür.
- İlk İNŞ tersaneden çıkınca bölüm açılır (`e.insReady`, yalnız insanda; Save8'de korunur).
- Eski kayıtta mevcut inşaat gemisi varsa bölüm erişilebilir.
- Son gemi kaybedilirse seçenekler görünür ve pasif kalır: "İnşaat gemisi gerekli".

**Seçim (`RemoteConstruction.autoPick`):**
- Oyuncunun **boş** İNŞ gemileri arasından mevcut `gate` (yapı koşulu, çift görev, kaynak, güvenli / ikmalli rota) geçenler alınır.
- Seçim **rota süresine** göre yapılır (`explorationGraph` maliyeti; düz mesafe değil; kapalı, güvensiz ve ikmalsiz düğümler elenir).
- Manuel emir ya da sıradaki iş kesilmez.
- Bütün gemiler meşgulse neden gösterilir ve istenirse **meşgul geminin kuyruğuna** eklenir.

**Görev ve ödeme:**
- Panel gemiyi, tahmini varışı (gün), maliyeti, durumu ve bekleme nedenini gösterir.
- Varışta koşullar `tick` / `startStruct`'ta yeniden denetlenir. Kaynak inşa başladığında **bir kez** kesilir.
- Panel çizimi rota hesaplamaz: C6'da `explorationGraph` çağrısı 0.

**MP:**
- `remoteAuto` komutu: host gemiyi seçer ve doğrular.
- Aynı sistemde aynı yapı ikinci kez kuyruğa girmez (çift tıklama ve iki koloni paneli). Başkasının sistemine emir verilemez (C7).

**Testler** (Node 7/0):

| Test | Kapsam |
|---|---|
| C1 | Gemi hedefte |
| C2 | Yakın geminin yolu bilinen yuvayla kapalı → uzak ama güvenli gemi; yol açılınca yakın gemi |
| C3 | Bütün gemiler meşgul |
| C4 | Hiç gemi yok |
| C5 | İlk İNŞ |
| C6 | Save8 |
| C7 | MP misafir komutu |

- Chromium: gerçek dokunmayla panel düğmesi → "İnş Uzak" atandı, panelde tahmini varış ve maliyet (PASS).
- **NOT RUN:** Misafirin gerçek koloni panelinden Chromium'da verdiği emir. Misafir köprüsü (`ACT.autoBuild` → `remoteAuto`) yazıldı; komut Node'da gerçek mp-core ile PASS.

## 12. Regresyon

Bütün koşular bu konteynerde, aday dalın son kodu (`b5a045a` motor + `ac64a01` test uyarlaması) ile. Günlükler: `evidence/beta-rival-blocs0/regresyon/p30-son/`.

**Node (`node tests/run-all.js`, 3 işçi):**

| Koşu | Sonuç |
|---|---|
| Tam koşu | SUITES 200 · GEÇEN 6261 · KALAN 279 |
| p29 tabanı (aynı konteyner, `reg29`) | SUITES 196 · GEÇEN 6238 · KALAN 277 |
| Fark | Yalnız `faz94d1_war_visibility` (33/1) ve `faz95d_war_preview` (18/1). İkisi de nötr AI'nın savunmadan kaçmasıydı → `b5a045a` ile eşik muhafazakâr yapıldı. Yeniden koşu: **34/0** ve **19/0** PASS. İlk FAIL kayıtları `regresyon/faz94d1-ilk-FAIL.log`, `faz95d-ilk-FAIL.log`. |
| Sonuç | Kalan 277 FAIL p29 tabanıyla aynı paketlerde (bu fazdan bağımsız, silinmedi). Yeni paketler: `beta_rival_blocs0_test` 10/0, `_mp_test` 3/0, `_setup_test` 5/0, `_build_test` 7/0 — PASS. |

**Chromium (yerel):**

| Test | Sonuç |
|---|---|
| `browser-rival-blocs0.cjs` | 9/0 PASS |
| `browser-pregame-galaxy0.cjs` | 10/0 PASS |
| `browser-bgreturn-galaxy0.cjs` | 14/0 PASS |
| `browser-share-galaxy0.cjs` | 8/0 PASS |
| `browser-sp-map-war.cjs` | İlk koşu 3/0 + çıkış 1 (rakip doktrin adımı eski sayı kutusunu arıyordu) → `ac64a01` uyarlaması sonrası **4/0 PASS**. İlk kayıt `regresyon/sp-map-war-ilk-FAIL.log`. |
| `browser-fed-fleet0-sp.cjs` | 4/0 PASS |
| `browser-mobile-hud0.cjs` | 4/0 PASS |
| `browser-event-ux0.cjs` | 11/0 PASS |

**MP (`tests/browser-mp8.cjs`, üretim relay süreci + TLS vekili):**

| Senaryo | Sonuç |
|---|---|
| D (desync1) | 5/0 PASS |
| G (geçici AI koruması) | 5/0 PASS |
| L (federal filo) | 6/0 PASS |
| S (galaksi kurulumu) | 4/0 PASS |
| E (olay kartları) | 6/0 PASS |
| F (federasyon kuruluşu) | 6/0 PASS |
| P (500 sistem / 16 AI / 2 insan / 15 dk, seed 404, `MP8_P_DESYNC=1`) | **8/0 PASS** |

P koşusunun ayrıntısı:
- Ön ilerletme 30 ay / 56 sn; ardından 15 dk gerçek zaman, host en yüksek hızda.
- Misafir gerçek STARS arayüzünde gerçek dokunmayla oynadı; komutlar aynaya yansıdı (P1).
- Misafir dünyası en uzun 6,05 sn durağan kaldı (sınır 20 sn).
- 8 kesirli politika kaydı; misafirde 0 ret, 0 çökme, 0 eski-dünya bölümü, 0 yeniden eşitleme.
- Host Save8 yüklendi (gün 5881).

Canlı Render, fiziksel Android ve LAN: **NOT RUN**.

## 13. Yayın

| | |
|---|---|
| ZIP | `releases/stars-faz96h10p30.zip` · 873 202 bayt · 20 girdi (19 runtime + manifest) |
| SHA-256 | `3b62475cc614b8befb96065cd3e96dcb6f1ad45d38e18618511c381a2a3ee54f` |
| CRC32 | `D3944845` |
| Manifest | SHA-256 `47fa8d0b9206a9b68415bf686a3db865ffc22fb70635987533b5b0b301284041` · phase `BETA-RIVAL-BLOCS.0` · build `96h10p30` · parent `03bdb9b` · parent ZIP `ee22b694…e8d5` (p29) |
| Doğrulama | `verify-release.py` çalışma ağacında ve açılmış ZIP'te (`--root`) PASS; ikinci paketleme bayt bayt aynı |
| Koruma | `tests/helpers/beta-rival-blocs0-reviewed.{json,cjs}` (`03bdb9b`'ye 13 dosya, tam metin hunk) ← `beta-galaxy0-reviewed` ← `beta-fed-fleet0-reviewed` ← … |
| Değişen runtime | `ai.js`, `diplomacy.js`, `ui.js`, `main.js`, `map.js`, `construction.js`, `index.html`, `sw.js` |
| MP kaynakları | `mp-core.js` (`remoteAuto`, p30 uyumu), `guest-stars.js` (`autoBuild`), `mirror.js` (`oathLog` misafire gitmez), `view.js` / `relay.js` (MP.8.9b27) |
| Yeni testler | Node: `beta_rival_blocs0_test.js` (10), `_mp_test.js` (3), `_setup_test.js` (5), `_build_test.js` (7). Chromium: `browser-rival-blocs0.cjs` (9) |

Canlı Render dağıtımı yapılmadı; main'e birleştirme yapılmadı.

## 14. Açık işler ve sonraki fazlar için

- **Seed 404 (8 AI):** İkinci blok oluşmuyor. Kök: kurucu adayların ilişkisi 15'in altında ve 404 haritasında bilinen rota uzun. Bu fazda eşik gevşetilmedi.
- **16 AI dağılmalar:** Yeni eşikle seed 11'de 1 dağılma (ilk eşikte 3); izlenmeli.
- **Üye ayrılması:** Kalma / ayrılma değerlendirmesi doğal kampanyada hiç tetiklenmedi; 720 gün + çatışma süresi eşikleri muhafazakâr.
- **Sahte Bayrak:**
  - Ahlak ekseni operasyon iştahına bağlı değil.
  - İfşa sonrası desteğin yeniden değerlendirilmesi yok; ifşa savaşa dönüşmüyor.
  - Bunlar sonraki faz kapsamında (ölçümler `kampanya/*.json` içinde saklı).
- **Kayıtlı taahhütler:** Toprak vaadi ve ayrı barış bu fazda yok.
- **Fiziksel ve canlı:** Fiziksel Android, canlı Render ve kullanıcı kabulü **NOT RUN**.
