# STARS — MP.6.4: casusluk + Galaktik Borsa + kalan filo/koloni işlemleri + oyuncuya özel bilgi güvenliği

Durum: **geliştirme sürümü.** Misafir artık gerçek STARS ekranlarından şunları yapabilir:

- casusluk ağı kurar, operasyon yürütür;
- Galaktik Borsa'da takas yapar;
- takviye, sevkiyat, sipariş iptali, toplanma noktası, sürekli üretim, onarım, terraform, habitat ve lider işlemlerini kullanır;
- kendi bilgi sınırı içindeki galaktik haberleri görür.

MP.6.3'ten kalan siyasi işlemler gerçek tarayıcıda doğrulandı.

Yeni casusluk, ekonomi ya da gemi motoru yazılmadı: her işlem tek oyunculu düğmenin motor işlevini çağırır.

- Taban: MP.6.3 `d80ad4b` (PR #21). PR #17 → #18 → #19 → #20 → #21 zinciri açık; hiçbiri merge edilmedi.
- Değişmeyenler:
  - 19 runtime dosyası, build `96h10`;
  - Save8 şeması ve `releases/stars-faz96h10.zip`.
- Yeni ZIP yok.

## 1. Casusluk ve karşı istihbarat

### Motor envanteri (kaynak koddan)

**Ağ:**
- `spyAssignQuote` / `assignSpy`: kapasite `spyCap`, hedef kapısı `spyTargetCheck`.
- `spyTick`: aylık istihbarat ilerlemesi ve %3,5 yakalanma.

**Standart operasyonlar** (`OPS`, `opQuote` → `runOp`; onay ekranı `opConfirm` / `opExecute`, tek kullanımlık jeton):

| Anahtar | Operasyon | Gerekli seviye |
|---|---|---|
| `calTech` | Teknoloji Çal | 2 |
| `sabotaj` | Tersane Sabotajı | 2 |
| `isyan` | İsyan Kışkırt | 3 |
| `yalan` | Sahte İstihbarat | 2 |
| `kervan` | Kervan İstihbaratı | 1 |
| `hazine` | Hazine Baskını | 2 |
| `filoPlan` | Filo Planlarını Çal | 2 |
| `suikast` | Suikast | 3 |
| `ambargoKir` | Ambargo Kaçakçılığı | 1 |
| `sorusturma` | Derin Soruşturma | 1 |
| `sahteKanit` | Sahte Kanıt Yerleştir | 2 |
| `tersaneVir` | Tersane Virüsü | 3 |

**Özel operasyonlar:**
- `doSabotage` (tersane / ikmal; kapı `canSabotage`);
- `inciteRebellion` (kapı `canIncite`);
- `deepInvestigate`;
- `falseFlagOp` (kapı `canFalseFlag`);
- `stealTech`.

**Karşı istihbarat:**
- pasif: `counterIntelTick` (AI'nın insan adına kararı değil, motorun pasif formülü), `counter` / `panopt` doktrinleri, sensörler;
- etkin: Derin Soruşturma operasyonu ve `deepInvestigate`.

### Komutlar

Hepsi motorun kendi kapılarından geçer; kimlik oturumdan gelir.

- **`spyAssign`** → `spyAssignQuote` / `assignSpy`. Temassız hedef: "yok".
- **`spyQuote`** (salt okuma) → motorun `opQuote` değerleri:
  - maliyet, ifşa yüzdesi, seviye, uygunluk;
  - sabotaj ve kışkırtma kapıları.
  - Kesin risk değeri gitmez, yalnız yüzde gider. Kilitli kartta hedefin teknoloji / stok / koloni sayıları gitmez (motorun kuralı).
- **`spyOp`** → `runOp`:
  - Tek oyunculu onay ekranı gibi, maliyet ya da risk değiştiyse `stale` döner ve yeniden onay gerekir.
  - Zar (`rnd`) yalnız host motorunda atılır.
- **`spySpecial`** → `doSabotage` / `inciteRebellion` / `deepInvestigate` / `falseFlagOp` / `stealTech`.
  - Yalnız gerçekten edinilen teknolojinin kimliği döner.

### Gerçek STARS paneli (misafir)

- İSTİHBARAT ekranındaki CASUS ATA ve operasyon kartları (`opAsk` → onay → `opGo`) çalışır.
- Onay penceresi host'un değerlerini gösterir.
- Sonuç gelince **gerçek STARS sonuç penceresi** host'un sonucuyla çizilir: `opExecute` yeniden çağrılır, `runOp` önbellekten döner.
- Özel operasyonların sonucu bildirimle gelir.

### Gizlilik

- **Düzeltilen ayna sızıntısı:** mağdurun `hitLog` kaydı aynaya olduğu gibi gidiyordu.
  - Tespit edilmemiş operasyonun **faili** (`by`) misafire ulaşıyordu.
  - Sahte kanıtın gerçek yerleştiricisi (`framed`: "gerçeği yalnız biz biliriz") da ulaşıyordu.
  - Artık fail yalnız biliniyorsa (yakalandı ya da soruşturmayla çözüldü) gider; `framed` hiç gitmez.
  - Ayrıca `whisperLog` kimlikleri numaralandırılır.
- **Bildirim (`spySweep`):** motor yalnız devlet 0'a bildiriyordu. Uzak insan kendi listesinde motorun metinleriyle şunları görür:
  - istihbarat artışı;
  - casusunun yakalanması;
  - mağdur ipucu (fail bilinmiyorsa adsız) ya da ifşa (fail adıyla).
- **Üç insan senaryosu** (Node ve Chromium): B, C'ye operasyon yürütür.
  - C yalnız motorun izin verdiğini görür.
  - A hiçbir şey görmez.
  - A'nın aynasında başkasının operasyon kaydı yok.

### Bilinçli olarak bağlanmayanlar

- Rüşvet / şantaj (Konsey oyu).
- Fısıltı (`whisper*`).
- Panoptikon yeniden hedefleme.
- Elçi görevleri.

Hâlâ engelli; misafirde soluk görünür ve uyarı verir.

## 2. Galaktik Borsa

- Motor anlık takas yapar (`marketTrade`), bekleyen emir tutmaz. "Emir yönetimi / iptali" motorda yok ve yazılmadı.
- **Komut `market`:** borsa kapalı / Arındırıcı / bakiye / miktar denetimleri motorun kurallarıdır.
  - Misafirin gördüğü sonuç (`expect`) host'un işlem anındaki teklifinden farklıysa `stale` döner, güncel teklif bildirilir ve işlem yapılmaz.
- **Eşzamanlılık:** host işlemleri sırayla yürütür.
  - B ve C aynı fiyatı görüp aynı anda alırsa, ikinci istek fiyat kaydığı için `stale` olur ve yeniden onayla geçer.
  - Toplam muhasebe tutar; çoğaltma yok.
  - Aynı `cid` ikinci kez uygulanmaz.
- **Görünüm `mkt`:** borsa açık mı, komisyon ve fiyat çarpanları (herkese açık). Kimin ne takas ettiği gitmez.
- **Misafir:** `marketOpen` / `marketFeeNow` / `marketInit` host'tan gelir (aynada konsey yok); TAKAS ET → `market`.

## 3. Kalan filo / koloni işlemleri

Komutların hepsi yalnız komutu verenin kendi devletinde çalışır:

| Komut | Motor işlevi | Not |
|---|---|---|
| `reinforce` | `reinforceFleet` | |
| `shipment` | `shipmentAction` | |
| `shipCancel` | `cancelShipOrders` | Oyuncunun o sistemdeki kendi siparişlerinin sırası; bayatsa `stale` |
| `rally` | `setRally` | |
| `terraform` | `startTerraform` | "Uyuyan" zarı motorda |
| `habitat` | `buildHabitat` | |
| `leader` | `recruitLeader` / `assignLeader` | Görevden alma dahil |

- **Motor işlevi olmayan tek oyunculu arayüz kuralları:** `loop` (sürekli üretim), `repair` (onarım aç/kapat) ve görevden alma. Host aynı kuralı aynı alanlarla, yalnız kendi nesnesinde uygular.
- **Ayna düzeltmesi:** kendi sistemindeki üretim kuyruğunda siparişin sahibi (`e`) misafirin numarasına çevrilmiyordu.
- **Başkasının nesnesi:** filo, sistem, lider ya da koloni komutu reddedilir (`not-owner` / motorun gerekçesi).
- **Kapsam dışı:** filo bileşim şablonları, yıkım / tüketim, özel silahlar.

## 4. Oyuncuya özel galaktik haberler

- **Önceki durum:** motor haber bilgisini olay anında yalnız host'un bakışıyla donduruyordu (`GalacticNews.visibility`, `G.p`, `pSeen` → `seen.includes(0)`); misafir aynasında haber yoktu.
- **Çözüm:** `installGuards`, `GalacticNews.emit`'i sarar. Her olay, her uzak insan için motorun görünürlük adımlarıyla değerlendirilir:
  - temas;
  - `s.seen`;
  - o oyuncunun görüşü (`actorVision`);
  - federasyon bağı;
  - istihbarat ≥3;
  - oyuncu kapsamı.
- Paylaşılan sensörün "keşif" yolu dahil edilmez: daha az gösterir, asla daha fazla değil.
- Bilgi olay anında donar (motor gibi). Oturumda tutulur, oyuncu başına en çok 80 kayıt.
- **Ayna:** motorun Save8 haber biçiminde (`news.records`), π numaralandırmalı. Host'un haber listesi girmez.
- Misafirde okundu / sabit işaretleri korunur.
- **Sınır:** haber geçmişi MP.4 kayıt paketine girmez (oturum). Yeniden açılan odada yeni olaylardan başlar.

## 5. MP.6.3'ten kalan siyasi işlemler — gerçek tarayıcı (browser-mp64)

- **Paylaşım:**
  - öneren B gerçek "Teklifi geri çek"e dokunur;
  - yeni taslak açılır;
  - ortak A gerçek "Reddet"e dokunur; devir olmaz.
  - C'nin doktrini vekâlet savaşını yasaklıyor (motorun `dealQuote` gerekçesi); bu yüzden ortak A seçildi.
- **Federasyon (A önerici, insan oyları gerçek gelen kutusundan):**
  - ihraç → kabul;
  - tür reformu → önerge açıldı, motor oylamasında geçmedi;
  - başkan seçimi → AI 2 başkan;
  - mevcut savaşa katılma önergesi → kabul, hazır karar;
  - A gerçek "uygula" düğmesine dokunur → motorun `executeFedDecision`'ı.
  - Ayna artık üyeye federasyon kararlarını numaralandırılmış olarak verir; önceden `decisions:{}` idi ve "uygula" düğmesi görünmüyordu.
- **Vasallık:**
  - yenileme: B gerçek pencereden önerir, C gelen kutusundan kabul eder; 24 ay süresi motorun, tarihler 25 ay geriye alındı;
  - bağımsızlık desteği: A gerçek düğmeye dokunur; sızma olursa B'ye bildirim gider;
  - barışçıl bağımsızlık: C ister, B kabul eder; savaş yok.

## 6. Geç oyun performans ön ölçümü (tanı; optimizasyon yok)

Ayrıntı: `research/mp64/perf/SONUC.md`.

**Koşullar:**
- ULU (100 sistem), 11 AI, seed 22, 240 ay; gerçek motor Node vm'de.
- Kollar: A paylaşım kapalı, B paylaşım açık, C tam temas + paylaşım.
- Tarayıcı FPS, GPU ve fiziksel Android: **NOT RUN**.

| Neden | Bulgu | Durum |
|---|---|---|
| A. Harita çizimi | Tam görünürlükte medyan 5 → 15–25 ms, ilk kare tepeleri 300–410 ms (yalnız Skia CPU) | Ölçüldü; ana kaynak değil |
| B. AI / ekonomi | Simülasyonun >%70'i `aiTurn`; 120 → 180. ay ~5×; 180. ayda 2,8–3,1 s/ay. Profil: `aiBuildingDelta` → `empireIncome` → `tradeInfo` → `tradeLinks` → `findPath` (%64 toplam) | **Kanıtlanmış ana kaynak**; paylaşımdan bağımsız |
| C. Sensör görünürlüğü | `refreshSharedVision` + `updateVision` ≤ 17 ms/ay | Ölçüldü; ihmal edilebilir |
| D. Biriken veri | Kayıt 420 KB → 1,7 MB, yığın 21 → 33 MB | Ölçüldü; kanıtlanmış kaynak değil |
| E. MP ayna | Kurma 4–14 ms, 86–105 KB; misafirde `deserialize` 150–270 ms (masaüstü CPU) | Telefonda maliyet hipotezi; cihazda ölçülmedi |

Optimizasyon yapılmadı. Öneriler PERF.1'e bırakıldı ve kontrol–aday eşdeğerliği ile kanıtlanmalı.

## 7. Yayın bütünlüğü ve çalışma ağacı

`python3 tools/verify-release.py` çalışma ağacında "BAŞARISIZ" der, çünkü kök dizindeki manifest dışı dosyaları (araçlar, testler, araştırma, belgeler) "Manifest dışı" diye listeler. Betik **yayın kökünü** (ZIP'ten çıkarılmış 20 girdilik dizin) denetlemek içindir; çalışma ağacı ancak manifestin eski "alt küme" kapsamlarında kabul edilir.

Yayın bütünlüğü şöyle doğrulandı:

1. `package-release.py` ZIP'i bayt-bayt aynı üretti.
2. ZIP çıkarıldı ve `verify-release.py --root` DOĞRULANDI.

Dosya silinmedi, manifest değiştirilmedi.

## 8. Testler

Sonuçlar: `research/mp64/evidence/REGRESYON.md`.

Özet:
- Node: 161 paket, 6293 GEÇEN / 3 KALAN; yalnız bilinen `faz95d_identity` 3 vakası.
- Yeni `mp64_*` paketleri: 21/21.
- Chromium: 15 test, hepsi PASS (browser-mp64 ayrıntısı belgede).
- Fiziksel Android / internet / LAN: NOT RUN.

## 9. Bilinen sınırlar ve tamamlanmayanlar

- **Engelli kalanlar** (misafirde soluk görünür ve uyarı verir): rüşvet / şantaj (Konsey oyu), fısıltı, Panoptikon yeniden hedefleme, elçi görevleri, filo bileşim şablonları.
- **Haber geçmişi:** oturumda tutulur, MP.4 paketine girmez.
- **Sensör paylaşımı yolu:** haber görünürlüğünde dahil edilmedi; daha az gösterir, asla fazla değil.
- **Bağımsızlık desteği:** sızma zarı motorun. Tarayıcı koşusunda sızma olmadı, bu yüzden senyöre giden sızma bildirimi gerçek tarayıcıda görülmedi. Node testi (`mp63_polvas_test`) yalnız "bildirim = sızma" eşitliğini denetler; hangi dalın koşulduğu zara bağlıdır.
- **Federasyon tür reformu:** önerge gerçek dokunmayla açıldı, motorun oylamasında geçmedi. Reformun uygulanması tarayıcıda görülmedi.
- **Ortak savaş kararı:** uygulanması için açık fikstür gerekti: katılımcının hedefi motorun `s.seen` alanında "görmüş" olması (motorun `aiFedHelp` kapısı).
- **Borsa:** motorda emir defteri yok. Bekleyen emir / iptal yazılmadı.

