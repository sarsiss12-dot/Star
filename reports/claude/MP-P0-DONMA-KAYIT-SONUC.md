# MP-P0 — Misafir donması, etkisiz emirler ve "Kayıt bozuk" (12 Kasım 2026)

Kaynak: gerçek kullanıcı raporu (Render, host + misafir, ~500 yıldız, 16 AI + 2 insan) ve kullanıcının gönderdiği `.sav` dosyası.
Dil kuralı: **PASS / FAIL / NOT RUN** ayrı yazılır. Yerel Chromium, fiziksel cihaz ya da gerçek Render testi **değildir**.

## 1. Kaynak, dal, başlangıç

| | |
|---|---|
| Depo | `sarsiss12-dot/Star` |
| Taban (kanonik uç) | `codex/stars-beta-ui-refinement0-mobile` @ `b35f8cb` — oyun `96h10p23`, PWA `stars-v96h10p23`, MP `MP.8.9b18`, Save8 v8, paket 4, protokol 1 |
| Çalışma dalı | `claude/stars-mp-p0-guest-freeze-resume` (tabandan açıldı; eski dallara yazılmadı) |
| `main` | `4296ad2` (MP.4 düzeyi) — kullanılmadı |
| `codex/stars-mp-p0-guest-playability` | `955c244`: tabanın 18 commit gerisinde, 0 ilerisinde (atası). İçinde bu P0'a ait onarım **yok** |
| `codex/stars-beta-ai-quality0` / `ai-recovery0` / `ai-defense0` | tabanın 2 / 4 / 6 commit ilerisinde; yalnız rapor, kanıt ve test yardımcıları (manifest ve MP sürümü aynı). Bu faza alınmadı, dokunulmadı |

## 2. Render'daki sürümle karşılaştırma — NOT RUN

Bu ortamın ağ kuralı Render adresine çıkışa izin vermiyor (vekil 403). Dağıtılan sürümün `/mp/version` yanıtı **okunamadı**; Render'ın hangi commit'i çalıştırdığı **doğrulanmadı**. Aşağıdaki bütün sonuçlar `b35f8cb` kaynağına göredir. Doğrulama için: telefonda MP çubuğuna dokununca açılan tanı satırı (`STARS MP.… · oyun …`) ya da `node research/mp1/deploy/smoke.js https://<alan>`.

## 3. Codex'ten devralınan gerçek ilerleme

- `reports/codex/MP-P0-KURTARMA-SONUC.md` (8 Kasım, p15 / MP.8.9b10): misafir gözlem bağlamı, kişisel olay kararları (`eventChoice`), yabancı filo görünümü, bildirim tekilleştirme. Sonraki dallarda birleşik; **bu donma / kayıt P0'unu kapsamıyor**.
- Görev panosu #33'teki "12 Kasım — Claude'a devir notu" ve federasyon araştırma bulguları okundu (§12).
- Bu P0 için yarım kalmış kod değişikliği bulunmadı; kaybedilecek çalışma yok.

## 4. Kullanıcının kayıt dosyası (salt okunur inceleme)

Dosya depoya **eklenmedi**, değiştirilmedi. 199.746 bayt; SHA-256 `9a9b9ea6…734b69`.

- Geçerli JSON, **Save8 `v:8`**. Motorun `deserialize`'ı taban kaynakta **kabul ediyor** (Node; 500 sistem, 19 devlet, gün 1882,595 = 2215 / 3. ay). Fiziksel olarak bozuk değil.
- **Host'un kanonik kaydı değil: misafirin ayna dünyasından alınmış kayıt.** Kanıt: `settlements.__mp:1`, `rs:1`, kozmetik tohum (`seed == cfg.seed`), 18 öteki devletin hepsi `ai:true` ve kaynak / teknolojileri boş, 13'ü "Bilinmeyen devlet"; 500 sistemin 111'i bilinir; yalnız kendi filosu ayrıntılı. Galaksinin tamamını içermez.
- Dosya adı `stars-2215-03.sav` = oyun içi ☰ → **"Dosyaya kaydet"** (tek oyunculu dışa aktarma) çıktısı. Çok oyunculu paket (`stars-mp-save`, `.starsmp.json`) değil.
- Donma anının izi: günlükte aynı güne (1882,595) ait üç çift `⚠ Alaşım stoğu düşük (494)` / `Korvet tezgâha kondu` satırı var, tersane sırası **boş**. Bu satırlar yerel dünyaya yazılır ve her ayna kurulumunda silinir; üçünün de kayıtta durması, **ilk tıklamadan kayda kadar misafirde tek bir ayna bile uygulanmadığını** gösterir.
- Açık federasyon oyu (yasa "Ticaret Birliği", 1860'ta açılmış, misafir oy vermemiş) olduğu hâlde olay kutusunda oy kartı yok (§9).

## 5. Misafir donmasının kök nedeni

**Gerçek oturumdaki tetikleyici kanıtlanamadı.** Elde yalnız misafirin kaydı var; host'un dosyası, tarayıcı konsolu ve relay günlüğü yok. Yerelde 500 sistem / 16 AI + 2 insan ile kalıcı donma kendiliğinden **üretilemedi** (§11). Bunu açıkça yazıyorum: aşağıdakiler *kanıtlanmış mekanizmalardır*, hangisinin o gece çalıştığı bilinmiyor.

Kanıtlanan (her biri düzeltmeden önce testle FAIL, sonra PASS):

| # | Mekanizma | Belirti | Kanıt |
|---|---|---|---|
| K1 | **Misafirde kurulum zinciri istisnayla kalıcı duruyordu.** `rebuild()` deserialize'dan önce yerel sunum durumunu (olay kartları, haber işaretleri) okur; orada atılan istisna yakalanmıyor, her aynada yeniden atılıyor, kullanıcıya hiçbir şey gösterilmiyordu. | Bağlantı açık, hız iletileri geliyor, ayna revizyonu artıyor (r2 → r31) ama uygulanan dünya aynı günde kalıyor; emirler host'ta uygulanıyor, misafirde görünmüyor. **Kullanıcının tarifiyle birebir.** | Chromium P2: önce FAIL (20 sn'de 0 gün), sonra PASS |
| K2 | **Dokunma bekletmesinin üst sınırı yoktu.** Kapanışı gelmeyen bir işaretçi (`pointerdown` var, `pointerup` / `pointercancel` yok) aynayı süresiz bekletiyordu. | Aynı belirti. | Chromium P3: önce FAIL, sonra PASS |
| K3 | **Host yayın zincirinde hata yalıtımı yoktu.** `publish()` içindeki tek istisna (bir süpürme, bir oyuncunun görünümü / aynası) bütün yayını kesiyordu; emir ACK'i ve hız iletileri ayrı yoldan gitmeye devam ediyordu. Host arayüzünde iz yoktu. | Hiçbir misafire dünya gitmiyor; host normal oynuyor. | Node A1 / A2 ve Chromium P4: önce FAIL, sonra PASS |
| K4 | **Misafir "dünya gelmiyor" durumunu algılayamıyordu.** Oyun başladıktan sonra başlangıç bekçisi (`bootTick`) çalışmıyor; kaybolan ayna, ancak bir sonraki fark gelirse fark ediliyordu. Oyun duraklatılmışken sonraki fark hiç gelmez. | "Host kabul etti ama tersane sırası değişmedi." | Chromium P5: önce FAIL, sonra PASS |

Elenenler (kanıtla):

- **İleti boyutu / relay sınırı:** 500 sistem, 70 ay; tam ayna ≤ 145 KB, fark ≤ 21 KB; sınır 524.288 karakter; aşım 0.
- **Host çekirdeği + ayna + motor yüklemesi (yalnız AI etkinliği):** 3 tohum × 80 ay, her gün yayın: yayın istisnası 0, misafir kurulum reddi 0.
- **Kullanıcının dünyasından tekrar oynatma:** hareket ve 3 gemi emri kabul, 8 ay, 256 kurulum, hata 0.
- **Deserialize kilidi** (`G._sideBuf`, `_dealTxActive`, `_loadTxActive`): hepsi `finally` ile kapanıyor; günlük satırlarının yazılmış olması `_sideBuf`'ı ayrıca dışlıyor.
- **Küçültülmüş pencere:** `minimizeModal` pencereyi `hidden` yapar; bekletmez.
- **Relay geri basıncı / düşürme:** host → misafir yönünde düşürme yok.

Ayrıca bulunan gerçek hata: misafirde **Takviye** düğmesi yakalanmamış `TypeError: r.orders is not iterable` atıyordu (Chromium P6: önce FAIL, sonra PASS).

### Yedi P0 sorusu

1. *Misafir yalnız görünüm mü kaybediyor?* Kanıtlanan dört mekanizmanın dördünde de **evet**: host emri kabul edip uyguluyor, misafire yansımıyor. Gerçek oturum için doğrulanamadı.
2. *Host simülasyonu ilerliyor mu?* K1, K2, K4'te evet; K3'te de evet (yalnız yayın kesik). Gerçek oturumda host'un dünyası ilerliyor muydu: **BELİRLENEMEDİ**.
3. *Hız neden geliyor, dünya neden gelmiyor?* Hız iletisi ayrı yoldan gider ve misafirde doğrudan boyanır; dünya ise yayın zinciri → ayna → misafir kurulumu yolundan geçer. Bu yolun üç halkası da sessizce kopabiliyordu.
4. *Korvet bildirimi neden çıkıyor?* Misafirde "tezgâha kondu" bildirimi emir **gönderilince** yazılıyordu; host yanıtı beklenmiyordu.
5. *Filo hareketi host'a ulaşıyor mu?* Kanıtlanan mekanizmalarda ulaşıyor ve kabul ediliyor; misafire yansımıyor.
6. *Büyük galaksi boyut / CPU / birikim / bozuk veri üretiyor mu?* 500 sistemde ölçüldü: hayır (yukarıdaki elemeler; host ay adımı 0,4–2,3 sn, misafir kurulumu ~10–50 ms).
7. *Sessizce duran misafir nasıl eşitlenir?* §8'deki bekçi: dürt → TAM ayna iste → gerekirse yeniden bağlan; her adım görünür.

## 6. Üretim ve filo emirleri neden etkisiz görünüyordu

Emirler host'ta **uygulanıyordu**; misafirin dünyası güncellenmediği için sonuç görünmüyordu. Misafirdeki "tezgâha kondu" yazısı host onayı değil, yerel iyimser bildirimdi. Artık bildirim host'un `ok` yanıtıyla, ret gerçek nedeniyle gösterilir; 8 sn yanıtsız kalan emir bekçiyi tetikler.

## 7. "Kayıt bozuk" hatasının kök nedeni — KANITLANDI (misafir dosyası için)

`validatePackage`, çok oyunculu paketin on alanını arar. Oyun içi `.sav` düz Save8 olduğundan ilk denetimde `fields` → **"Kayıt eksik ya da bozuk."** dönüyordu. Dosya bozuk değil, **türü farklı**. Kullanıcının gerçek dosyasıyla doğrulandı: önce `fields`, şimdi `save8-guest`.

Host'un dosyası elimizde yok. Aynı menüden alınmış `.sav` ise aynı yoldan reddedilmiştir (en olası açıklama; **host için BELİRLENEMEDİ**). Gerçek MP paketinin yolu ayrıca sınandı: 500 sistemde 80 ay boyunca her ay `snapshot → validatePackage` geçerli, `loadWorld` başarılı.

Tuzak: MP oyununda oyun içi "Dosyaya kaydet" çalışıyor ve çok oyunculu oyunu sürdüremeyen bir dosya üretiyordu.

## 8. Düzeltmeler

Yalnız MP kaynakları değişti. **19 runtime dosyası, Save8, paket 4, protokol 1 ve oyun ZIP'i değişmedi.** MP sürümü `MP.8.9b19`.

`research/mp0/mp-core.js`
- `publish()`: altı süpürme ve her oyuncunun görünümü / aynası ayrı korunur. Hata sayılır (`stats.publishErrors`, `lastPublishError`: yalnız aşama adı ve kısa ileti); o oyuncunun sonraki yayını TAM veriyle kurulur.
- `pulse()`: her bağlı koltuğa yalnız sayaç (dünya revizyonu, o oyuncunun ayna revizyonu, tam gün, hız, hata sayısı, ayna hatası işareti). Oyun verisi yok.
- `save8Kind`, `packageFromSave8`: düz Save8'in türü; host'un oyun içi Save8'inden devam paketi. Dünya baytı baytına aynen girer; koltuk kimlikleri rastgele özetle kapatılır (hiçbir cihaz kendiliğinden koltuk alamaz), host mevcut **KİMLİĞİ KURTAR** ile atar. Misafir aynası hiçbir yoldan pakete dönüşmez.

`research/mp1/client/mp1-host.js`
- 250 ms döngüsünün parçaları yalıtıldı; 2 sn'de bir nabız; tanı satırında `YAYIN HATASI n (aşama)`.
- **DOSYADAN AÇ** `.sav` kabul eder; üç tür için açık ileti; host `.sav`'ı devam kartı açar.
- MP host oyununda oyun içi "Dosyaya kaydet" çok oyunculu paketi indirir; "Cihaza kaydet" ayrıca MP listesine elle kayıt ekler. Tek oyunculuda davranış aynı.

`research/mp6/client/guest-stars.js`
- Kurulum sarmalayıcısı: istisna yakalanır, neden kaydedilir, yerel sunum durumu onarılır, sınırlı aralıkla yeniden denenir.
- Dokunma bekletmesine 3 sn üst sınır.
- **Eşitleme bekçisi** (saniyede bir): gelmiş ama uygulanmamış veri → dürt, 20 sn'de TAM ayna; nabız daha yeni ayna gösteriyor ama gelmemiş → `resync`; yanıtsız emir → `resync`; 3 denemede düzelmezse bağlantı yenilenir. Durum MP çubuğunda görünür; pencere açıkken bekleme de artık yazılır.
- Gemi / bina bildirimi host ACK'inden sonra; Takviye düğmesi düzeltildi.
- Misafirin "Dosyaya kaydet"i ne olduğunu söyler; "Cihaza kaydet" tek oyunculu kayıt yuvasının üzerine ayna yazmaz.

`research/mp1/client/view.js`, `research/mp1/server/relay.js`: sürüm işareti.

Kontrol listesi: komut kimliği + ACK eşleşmesi ve çift uygulamama (mevcut, değişmedi) · gerçek ret bildirimi (düzeltildi) · eksik / geç güncelleme algılama (yeni) · güvenli tam ayna kurtarma (yeni) · kendi devletine yeniden bağlanma (mevcut, korundu) · gizlilik süzgeçleri (değişmedi; nabız yalnız sayaç) · tek oyunculu etkilenmez.

## 9. Federasyon / Konsey üst olay çubuğu (P1) — AÇIK, ayrı faz

P0'un kök nedeniyle ilişkili değil; bu fazda **düzeltilmedi**.

Bulgu: motor oy kartını (`UI.fedVote` → `notify`) yalnız simülasyonu yürüten tarafta üretir. Misafir simülasyon yürütmediği için, aynada açık oy olduğu hâlde üst çubukta `fedvote` kartı doğmuyor; oy yalnız Gelen kutusu kaydından verilebiliyor. Kullanıcının dosyasında da durum bu. Öteki olaylar (yasa sonucu, başkan değişimi, reform, savaş çağrısı, dağılma, Konsey kararları) misafire günlük satırı ve haber olarak gidiyor, kart olarak değil.

Önerilen küçük faz: misafirde kartları aynadaki durumdan sessizce türet (`inboxOffers` / `personalDecisions` deseni: sabit anahtar, `UI.notify` yok). Böylece 8 Kasım'daki tekrar eden "FEDERASYON KURULDU" hatası (#2) geri gelmez. Panoda açık tutuldu.

## 10. Test karşılaştırması

**Hedefli (FAIL-önce):**

| Test | Düzeltme öncesi (`b35f8cb`) | Sonrası |
|---|---|---|
| `tests/mp_p0_sync_test.js` (Node) | 1 / 5 | **6 / 0** |
| `MP8_SCEN=P` P2–P7 (Chromium, 500 sistem) | 0 / 6 | **6 / 0** |

**Regresyon:** bkz. `reports/claude/evidence/mp-p0/REGRESYON.md` (koşu sonuçları oraya yazıldı).

## 11. 500 yıldız ölçeği ve uzun MP koşuları

Hepsi yerel: Node vm ya da iki ayrı Chromium + üretim kipi relay süreci + TLS vekili. s500, sarmal, 16 AI + 2 insan.

| Koşu | Tohum | Süre | Sonuç |
|---|---|---|---|
| İleti boyutu (Node) | 404 | 70 ay | aşım 0 |
| Yayın / kayıt fuzz (Node) | 404, 11, 22 | 3 × 80 ay | yayın istisnası 0, misafir reddi 0, paket geçersiz 0 |
| Gerçek zamanlı, misafir oynuyor (eski kod) | 404 | 45 ay + 10 dk (≈ 140 ay) | 1167 dokunma; kalıcı donma 0; pencere açıkken bekleme görüldü |
| Gerçek zamanlı, host + misafir oynuyor (eski kod) | 404 | 45 ay + 86 sn | pencere açıkken bekleme (tasarım gereği) |
| Gerçek zamanlı, düzeltmeli kod | 404 | bkz. REGRESYON.md | |

Fiziksel PC / Android, LAN, gerçek internet, gerçek Render: **NOT RUN**.

## 12. Korunan açık liste (federasyon donanması, Konsey Muhafızları, askerî AI)

Bu fazda uygulanmadı; panodaki devir notundan aynen korunur:

- `FED_LAWS.filo` üye başına ayda ≤ 4 alaşımı `f.treasury`'ye aktarır; federal gemi üretimi `f.fund.ala` kullanır. İki fon arasında bağlantı yok.
- `fedFundTick()` pozitif alaşım / enerji gelirinden ~%3–9 keser; `buildFederalShip()` var ama arayüz ve AI çağırmıyor.
- Federal gemilerde çift bakım olasılığı: `fleetUpkeep` / `fleetAlloyUpkeep` + `fedFundTick`.
- Konsey `muhafiz` yasası `G.council.treasury`'ye para toplar; filo üretimi yok.
- `jointOps` ortak harekât tabanı olarak korunacak; önerilen mimari sonraki fazların planında.
- İncelenen dal `codex/stars-beta-fed-ai0-raiders-coalitions`; Render'ın aynı kodu çalıştırdığı doğrulanmadı.
- Açık kalan eski işler: özgün #24 / #25 / #26 aralıklı dokunma vakaları, #33 casusluk UX, #51, #30, #36, genel #44.

## 13. GitHub

Dal `claude/stars-mp-p0-guest-freeze-resume`; commit ve PR bilgisi PR açıklamasında. `main`'e birleştirme yapılmadı; Render'a dağıtım yapılmadı.

## 14. ZIP, SHA-256, CRC, manifest

Runtime değişmediği için **yeni oyun ZIP'i yok**. `python3 tools/verify-release.py` → DOĞRULANDI: 19 dosya, build `96h10p23`. Mevcut `releases/stars-faz96h10p23.zip` SHA-256 `af6eb03a…bd7d1d` aynen duruyor. MP istemci + relay, ZIP'ten ayrı teslimdir (bu dal).

## 15. Gerçek Render testinde doğrulanacaklar

1. Dağıtım bu daldan yapıldıktan sonra tanı satırında **`MP.8.9b19`** görünmeli (host ve misafir).
2. Aynı ayarlarla (500 yıldız, 16 AI) en az 20 dakika: misafir dünyası durursa MP çubuğu kendiliğinden açılıp neden yazmalı ve birkaç saniyede toparlanmalı. Toparlanmazsa çubuğa dokunup tanı satırının ekran görüntüsü (host ve misafir) alınmalı; kök neden artık o satırda.
3. Misafir tersaneye gemi koyunca bildirim **host onayından sonra** çıkmalı ve sıra görünmeli.
4. Host: oyun içi ☰ → Dosyaya kaydet → `.starsmp.json` inmeli. Çık → ÇOK OYUNCULU → KAYITLI OYUNA DEVAM ET → DOSYADAN AÇ → devam lobisi → misafir yeni kodla kendi devletine dönmeli.
5. Elinizdeki eski dosyalar: **host'un** `.sav`'ı aynı ekrandan açılabilmeli (misafir katılınca KİMLİĞİ KURTAR). Misafirin `.sav`'ı "misafir görünümü kaydı" iletisiyle reddedilmeli.
6. Host cihazındaki kayıt listesinde o oturumun otomatik kayıtları duruyorsa (3 ayda bir), doğrudan DEVAM ET ile de açılabilir.
