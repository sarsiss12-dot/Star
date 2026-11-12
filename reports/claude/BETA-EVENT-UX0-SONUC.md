# BETA-EVENT-UX.0 — Federasyon / Konsey olay kartları, casusluk paneli genişliği, kurumsal donanma ön incelemesi (12 Kasım 2026)

Dil kuralı: **PASS / FAIL / NOT RUN** ayrı yazılır. Bütün tarayıcı testleri yerel Chromium'dur; gerçek Render, fiziksel PC / Android ve LAN **NOT RUN**.

## 1. Kanonik kaynak ve devralınan durum

| | |
|---|---|
| Başlangıç | `claude/stars-mp-p0-guest-freeze-resume` @ `b25ba272e24c10ac8ce8fa50a91b3bdf2137fc88` (GitHub'daki uçla aynı; doğrulandı) — oyun `96h10p23`, MP `MP.8.9b19` |
| Yeni dal | `claude/stars-beta-event-ux0` (bu uçtan açıldı) |
| Bitiş | oyun **`96h10p24`**, PWA `stars-v96h10p24`, MP **`MP.8.9b20`**; Save8 v8, MP paket 4, protokol 1 — değişmedi |
| Render (son okunan) | `96h10p23 / MP.8.9b18`. Bu faz dağıtılmadı. |

P0'dan devralınan ve korunan: eşitleme bekçisi, yayın hata yalıtımı, ACK'ten sonra bildirim, düz Save8 türleri ve `.sav` ile devam. Bu fazda hiçbiri değiştirilmedi; hedefli P0 testleri yeniden koşuldu (§8).

Bu fazdan önce zaten var olan ve **yeniden yazılmayan** parçalar: misafirde Konsey oy kartı (MP.7.3 `mp73cnc:`), tek oyunculuda federasyon oy kartı ve kart üzerinde hızlı EVET / HAYIR (MP.7.4 `noteQuick` → `DiplomaticInbox.resolve`), federasyon kuruluş daveti / sonuç kartları (`fedFoundCards`, sonuç tercihi `fedResultSeen`), gündem kartları (`fedAgendaCards`), haber arşivi (`ArchiveUI` / `GalacticNews`).

## 2. Federasyon olay düzeltmeleri

**Kök neden (doğrulandı):** motor oy kartını `fedPresentVote → UI.fedVote → notify` ile yalnız simülasyonu yürüten tarafta ve yalnız devlet 0 için üretir. Misafir simülasyon yürütmediği için aynada açık oy olduğu hâlde üst çubukta kart doğmuyordu (önceki raporun bulgusu; kullanıcının kayıt dosyasında da açık oy var, kart yok).

**Düzeltme (`research/mp6/client/guest-stars.js`):**
- Kart, aynadaki oylamadan türetilir: üye, oyu bekleniyor → `kind:'fedvote'`. Anahtar tek oyunculuyla aynı (`'fed:'+id+':'+oyKimliği`); kayıt motorun kendi `DiplomaticInbox.capture`'ı.
- Karar yolu değişmedi: kart / tam pencere → `DiplomaticInbox.resolve` → host `fedVote`. Çift dokunma `decWait` ile ikinci komut göndermez.
- Bekleme durumu kart yeniden kurulsa da görünür (`UI.fedVoteWaiting`).

**Bilgi kartları (`ui.js`, tek oyunculu + host + misafir ortak):** önceden yalnız günlük satırı / haber olan kurum olayları artık üst çubukta kısa kart. Kaynaklar, oyuncunun **zaten yetkili olduğu** veri:
- Kendi haber kayıtları, federasyon kategorisi: kuruluş, katılım, ayrılış, ihraç, reform, önergeler (başkan seçimi dahil), ortak savaş kararı, dağılma. Misafirde host'un o oyuncu için süzdüğü haberler.
- Üyesi olduğu federasyonun **son oylama sonucu** (`f.lastVote`): yasa kabul / red. Motorda bu olayın haberi yok; ayna `lastVote`'u yalnız üyeye gönderir.

Kartlar `G.inbox`'a **girmez**: Save8, `inboxUid`, RNG ve hız değişmez, duraklatma yoktur. Dokununca haber ayrıntısı ya da federasyon paneli açılır; kaydırınca kapanır. En çok 3 kart; 60 oyun gününden eskisi düşer, kayıt haber arşivinde kalır.

## 3. Konsey olay düzeltmeleri

- **Hızlı EVET / HAYIR** Konsey oy kartında (tek oyunculu, host, misafir). Ayrı karar uygulayıcısı yok: tam Konsey penceresinin `cncYes` / `cncNo` eylemi (tek oyunculu / host `castCouncilVote`, misafirde aynı eylem `councilVote` komutuna iner).
- Kart çizilirken oylama simgesini (token) tutar; oylama değiştiyse eski karttan oy gitmez.
- Oy verilmiş ya da kapanmış oylamanın kartı artık kutuda kalmaz. Önceden tek oyunculuda `cncvote` kartı oylama bitse de duruyordu.
- Konsey kuruluşu ve Konsey kararı (kabul / red, yaptırım, yasak, Muhafızlar dahil bütün yasalar) haber kaydından bilgi kartı olur. Konsey kararı kamu haberidir; herkes görür.
- Henüz oyunda olmayan bir mekanik için olay üretilmedi. Konsey liderliği değişimi ve "olağanüstü toplantı" için motor haber üretmiyor: kart da yok (§9).

## 4. Hızlı karar ve tekilleştirme

| Durum | Sonuç |
|---|---|
| Aynı olay yeni aynada / gün değişince / yeniden çizimde | Tekil (sabit anahtar; misafirde anahtar eşleşmesiyle uid korunur). |
| Misafir yeniden bağlanınca | Tekil (görüldü kümesi sayfa ömrü boyunca tutulur; test E3). |
| Kayıt yükleme / sayfa yenileme | Var olan olaylar ilk taramada "görüldü" sayılır; eski olay yeniden doğmaz (test S2). Gün geriye ya da 400 günden çok ileri sıçrarsa temel çizgi yenilenir. |
| Aynı konuda gerçekten yeni oylama | Yeni anahtar → yeni kart. |
| Çift dokunma / geç ACK | Federasyon: `decWait` ikinci komutu engeller (E2: tek komut, tek oy). Konsey: token denetimi + `_councilPending` (S4, E4: her insan tam bir oy). |
| Kapanmış oylamaya basma | Kart filtrelenir; eski token reddedilir. |
| Tekrarlayan "FEDERASYON KURULDU" (#2) | Kuruluş sonuç kartı mekanizmasına dokunulmadı. Yeni kartlar `UI.notify` kullanmaz ve kaydedilmez; aynı sınıf hatayı üretemez. #2'nin kendi yeniden üretimi bu fazda **NOT RUN**. |
| Multiplayer hızı | Bilgi kartları hız / duraklatma üretmez (E3: host hızı ve `want` değişmedi). Oy kartları mevcut MP.6.3 kuralına tabi (varsayılan 1×). |

## 5. Casusluk paneli (#55)

- Yalnız **İSTİHBARAT** sekmesinde sağ panelin sol kenarında görünür sürükleme kolu (`#sbResize`): fare ve dokunma (pointer capture; haritaya / rotaya sızmaz), klavye (← → Home End).
- Mevcut yerleşim değişkeni `--sb` yalnız bu sekmede ve yalnız `#game` üzerinde ezilir; sekme değişince kaldırılır. İkinci bir kenar çubuğu motoru yok.
- **Sınırlar:** en dar = standart genişlik; en geniş = görünür alanın %75'i ve haritaya en az 220 px.
- **Hatırlama:** oturumda bellekte; cihazda `localStorage['stars:spyWidth']`. Save8, RNG ve ağ verisine girmez (S1: Save8'de yok).
- Akış: Casusluk → Sistem → Filo → Casusluk ve Casusluk → Diplomasi → Casusluk; her panel kendi standart genişliğinde, casusluk son genişlikte (S1). Sistem paneli zaten `.buildingGrid` için daha geniş; bu davranış korundu.

## 6. Önce / sonra test sonuçları

| Test | Taban `b25ba27` | Bu dal |
|---|---|---|
| `browser-event-ux0.cjs` (tek oyunculu; S1 dört ekran boyutu, S2 bilgi kartı, S3 federasyon oyu + sonuç, S4 Konsey hızlı oy, S5 sayfa hatası) | **1 / 7** | **8 / 0** |
| `MP8_SCEN=E` (host + 2 misafir; E1 oy kartı, E2 hızlı EVET, E3 sonuç kartı + gizlilik + hız + yeniden bağlanma, E4 Konsey üç insan, E5 P0) | **2 / 4** | **6 / 0** |

Son koşu sayıları: `reports/claude/evidence/beta-event-ux0/REGRESYON.md`.

## 7. Host / misafir yetki ve gizlilik

- Federasyon kartı ve sonuç kartı yalnız üyede. E1 / E3: üye olmayan C'de ve host'ta kart yok.
- Konsey oy kartı yalnız oy hakkı olan üyede; Konsey kararı kamu haberi.
- Kararlar yalnız host'ta motorun kurallarıyla uygulanır; misafir yerel uygulama yapmaz.
- Aynaya yeni alan eklenmedi; kartlar mevcut ayna verisinden türetilir.

## 8. P0 regresyonu

Hedefli P0 testleri ve 500 yıldızda 10 dakikalık gerçek zamanlı koşu (`MP8_SCEN=P`, host + misafir oynuyor) ile MP / tek oyunculu tarayıcı paketleri yeniden koşuldu. Sonuçlar REGRESYON.md'de.

## 9. Açık FAIL / NOT RUN

- **NOT RUN:** gerçek Render, fiziksel PC / Android, LAN; Docker'lı mp5; mp0–mp3x, mp62–64, mp71; uzun mp8 A/B/C kampanyaları.
- Motor haber üretmediği için kart da çıkmayan olaylar (ayrı küçük faz): federasyon üyelik **başvurusu** (Gelen kutusu kaydı var, kart yok), Konsey başkan değişimi, olağanüstü toplantı.
- Konsey karar haberi metninde gün kesirli yazılıyor ("gün 9.4065…"). Motor metni; değiştirilmedi.
- mp6 "harita ve panel etkileşimi" ve mp4 "kimlik kurtarma": P0 fazında tabanda da FAIL olarak kayıtlı. mp72 A6 aralıklı.
- Tam Node koşusundaki eski başarısızlıklar tabanla birebir aynı (REGRESYON.md).

## 10. Federasyon bağış / fon / filo incelemesi (kod üzerinde doğrulandı)

| Bulgu | Kanıt | Sonuç |
|---|---|---|
| İki ayrı fon | `FED_LAWS.filo` (diplomacy.js ~2881): üye başına ayda ≤ 4 alaşım → `f.treasury`. `fedFundTick` (9335): gelirden tür oranı (askerî / bilimsel %5, ticaret %4, yağmacı %6; `ortakDon` %9, `sivilFon` %3) → `f.fund.ala/ene`. `buildFederalShip` (9419) yalnız `f.fund.ala`'yı harcar. | `f.treasury`'nin **hiçbir tüketicisi yok**: yasa üyelerden alaşımı kalıcı olarak çeker. |
| Federal üretim çağrılmıyor | `buildFederalShip` / `canBuildFederal` için ui.js, ai.js, mp-core'da çağrı yok. Hibe (`grantFed`) arayüzde ve MP'de var. | Federal filo pratikte hiç oluşmaz; `f.fund` birikir ve harcanmaz. |
| Çift bakım (gizli) | `fleetUpkeep` / `fleetAlloyUpkeep` (main.js 3413–3440) federal filoyu atlamaz (`f.e === başkan`); `fedFundTick` aynı gemilerin enerji bakımını `f.fund.ene`'den de düşer. `fleetUsage` federali atlar. | Federal filo oluşsaydı başkan enerjiyi iki kez öderdi (kendi + fon), alaşım bakımını yalnız kendisi. |
| Sahiplik | `fl.e = başkan`; başkan değişince devredilir (fedFundTick, `elect` önergesi, 2462). Dağılmada `federal` işareti silinir, filo başkanın kişisel filosu olur (2496). | Savaş, erişim ve gizlilik başkan devleti üzerinden hesaplanır; dağılma kapasite aşımı yaratabilir. |
| Misafir görünümü | Ayna `fund:{ala:0,ene:0}`, `treasury:0` gönderir. | Misafir federasyon panelinde hazine hep 0 görünür. |
| Açıklama tutarsızlığı | Yorum "%5 öşür" diyor, gerçek oran türe ve yasaya bağlı; AI değerlendirmesi (ai.js 4836) "kilitli rezerv, askerî fayda yok" diyerek doğru değerliyor. | — |

### BETA-FED-FLEET.0 — önerilen somut plan

1. **Tek fon:** `filo` yasası bağışını `f.fund.ala`'ya yönlendir. Eski `f.treasury` yüklemede bir kez `f.fund.ala`'ya aktarılır, alan sıfırlanır; Save8 şeması değişmez, değer taşınır.
2. **Bakım tek yerden:** `fleetUpkeep` / `fleetAlloyUpkeep` `f.federal`'ı atlasın; federal bakım (enerji + alaşım) yalnız `fedFundTick`'te ve fondan. Fon yetmezse mevcut "en zayıf filoyu dağıt" kuralı.
3. **Üretim arayüzü:** başkanın tersane panelinde "Federal sipariş" sekmesi: mevcut `queueShip` / tersane sırası, `owner:'fed'` işareti, bedel `f.fund.ala`. MP için yeni komut `fedShip` (host `canBuildFederal` → sıra). Ayna, üyeye fon ve bakım tahminini gerçek değerle göstersin (bugün 0).
4. **Sınırlar:** federal gemi sayısı ≤ üye sayısı × 4; bir ayda ≤ 1 sipariş; fon tabanı 3 aylık bakım altına inmeden üretim yok.
5. **AI:** yalnız başkan AI ise, aylık en çok bir karar: fon > 2 × (bedel + 6 ay bakım) ve açık savunma yükümlülüğü / aktif federasyon savaşı varsa. Askerî tür eşik × 0,8, ticaret × 1,3.
6. **Dağılma:** federal filolar dağıtılır; fon üyelere katkı oranında geri. Başkanın kişisel filosu olmaz.
7. **Testler:** fon akışı ay ay; çift bakımın yokluğu; başkan değişimi; dağılma; MP misafir başkan siparişi; tek oyunculu Save8 / RNG kontrol–aday karşılaştırması (yasa yokken birebir).

## 11. Galaktik Konsey Muhafızları incelemesi

- `G.council.treasury` yalnız `muhafiz` yasasından beslenir: üye başına ayda ≤ 6 alaşım (diplomacy.js 5270–5276). **Hiçbir tüketici yok.** Arayüz yalnız miktarı gösterir.
- Yasa açıklaması "konsey kendi filosunu kurar ve kararları uygular" diyor; böyle bir kod yok. Oyuncuyu yanıltan metin.
- Gemi üretimi, sahibi, bakımı, askerî yetki: **yok**. Yasa kaldırılır ya da Konsey dağılırsa hazine olduğu yerde kalır ya da Konseyle birlikte yok olur.
- Öneri (BETA-COUNCIL-GUARD.0): önce açıklamayı gerçeğe uydur ("hazine birikir; Muhafız filosu sonraki sürümde"). Sonra:
  - Muhafız filosu sahibi sanal "Konsey" kimliği değil, **Konsey başkanı devleti, `guard:true`** işaretiyle (federal modeliyle aynı tek kod yolu).
  - Bakım `c.treasury`'den.
  - Yalnız kabul edilmiş Konsey kararı (yaptırım / savaş yasağı ihlali) için harekât.
  - Fetih yok: yalnız ablukadan ve ihlal eden filoya saldırıdan oluşan "müdahale" görevi.
  - Yasa kaldırılınca filo dağılır, hazine üyelere geri döner.

## 12. Bağımsız askerî AI ve komite mimarisi (öneri)

Temel: mevcut `jointOps` (ai.js `jointSelect` / `jointCreate` / `jointTick` / `jointAdvance`). Ortak plan, toplanma noktası, ETA ve kapanış nedenleri zaten var. İnsan filoları plana hiç alınmıyor ("Oyuncu filoları kendi komutasında"); federasyon türü katkı isteğini değiştiriyor (askerî × 1,15, ticaret × 0,9).

Önerilen hafif karar katmanı (ayrı devlet değil, ayrı ekonomi yok):

- **Federasyon Askerî Komitesi** = başkan + üyeler. Komutan AI, `jointTick` sıklığında (5 günde bir) yalnız şu girdilerle karar verir: federasyonun açık savunma yükümlülükleri, aktif federasyon savaşları, bilinen tehdit (`aiObservedThreat`), fon.
- **Öncelik:** üye başkenti / kolonisi tehdidi > federasyon savaşı cephesi > refakat > saldırı.
- **Geri çekilme:** güç oranı < 0,7 ya da ikmal ≤ 0,4.
- **Üye desteği:** mevcut `jointCreate` talebi (requester = komite). AI üye kabul eşiği: kendi tehdidi yoksa ve ilişki ≥ 0.
- **Tür farkı:** askerî saldırı eşiği düşük; bilimsel yalnız savunma; ticaret refakat önceliği; yağmacı fetih cephesi.
- **Memnuniyet:** katkı veren üyeye `cohesion` +, sürekli reddeden üyeye −.
- **Bütçe koruması:** fon tabanı = 3 aylık bakım.
- **Konsey Muhafız Komutanı:** yalnız onaylı karar varken, yalnız müdahale görevi; fetih ve tek devlete hizmet yok.
- **Açıklama:** komutan kararının nedeni (`jointClose` nedenleri gibi) federasyon panelinde ve olay kartında görünsün ("Saldırmadı: güç oranı 0,6").
- **CPU:** komite kararı federasyon başına 5 günde bir ve mevcut önbellekli rota (`cache`) ile.

## 13. Önerilen sıra

1. Bu fazın gerçek cihaz / Render kabulü (§15).
2. **BETA-FED-FLEET.0** (§10): tek fon, tek bakım, başkan arayüzü, MP komutu.
3. Küçük kart fazı: üyelik başvurusu / Konsey başkanı / olağanüstü toplantı için motor haberleri; gün metninin yuvarlanması.
4. **BETA-COUNCIL-GUARD.0** (§11): önce açıklama düzeltmesi, sonra filo.
5. Komite AI (§12): `jointOps` üzerinde.

## 14. GitHub, ZIP, manifest

Commit / PR ve ZIP doğrulaması: PR açıklaması ve REGRESYON.md.

- Değişen runtime: `ui.js`, `index.html` (CSS bloğu `/* END BETA-EVENT-UX.0 SPY */`), `main.js` (yalnız `BUILD_ID`), `sw.js` (yalnız `CACHE`).
- Değişen MP: `research/mp6/client/guest-stars.js`, `research/mp0/mp-core.js` (yalnız p24 için paket uyumluluk listesi), `research/mp1/client/view.js`, `research/mp1/server/relay.js` (sürüm).
- Koruma: `tests/helpers/beta-event-ux0-reviewed.json` + `event-ux0-reviewed.cjs` (tam metin hunk'ları, p23 baytlarını birebir geri kurar); zincirin en başında (`stripReviewedUI23` önce bunu çağırır). Hash gevşetilmedi.

## 15. Kullanıcının doğrulaması gerekenler

1. Render'a bu dal dağıtılınca tanı satırında `MP.8.9b20` ve `oyun 96h10p24`.
2. Misafir federasyon üyesiyken açılan oylama üst çubukta kart olarak görünmeli; karttan EVET ya da HAYIR tek oy olmalı.
3. Konsey oylamasında kartta EVET / HAYIR (host ve misafir); oy verince kart kalkmalı.
4. Federasyon / Konsey gelişmeleri (katılım, ayrılış, yasa sonucu, Konsey kararı) kısa kart olarak görünmeli; yeniden bağlanınca tekrar çıkmamalı.
5. Android yatayda İSTİHBARAT panelinin sol kenarındaki çizgiden parmakla genişletme / daraltma; SİSTEM ve FİLO panelleri etkilenmemeli.
