# MP-DIPLO5 — Lüks hakkı etkisi, Casusluk Ağı, Barıştırma, diplomasi kısayolları, AI destek ölçümü (p38 / MP.8.9b36)

16 Kasım 2026 · Dal `claude/stars-mp-diplo5` · Başlangıç `f2e48eba207a5a4bb3f10b37f70323a61105b3ad` (p37 / MP.8.9b35, `claude/stars-mp-techlux0`, taslak PR #52) · Oyun `96h10p38` · MP `MP.8.9b36` · Save8 v8 · paket 4 · protokol 1.

Not: sistemin atadığı `claude/stars-project-takeover-y9x8m9` dalı eski 96H.8 dalıdır; bu faz doğrulanmış p37 HEAD'inden yeni dalda geliştirildi.

Hiçbir kalem TAMAMLANDI değildir; yerelde doğrulananlar `TEST BEKLİYOR`. PASS / FAIL / NOT RUN ayrı yazılmıştır.

## 1. Özet

| Kalem | Commit | Durum | Yerel kanıt |
|---|---|---|---|
| NF-2b Lüks mal hakkı ekonomik etki | `07cd35c` | TEST BEKLİYOR | Node 10/0 (p37 1/9) + MP 3/0 · p37 ile Save8/RNG eşdeğer · kampanya |
| NF-3 Casusluk Ağı MP | `7d72bba` | TEST BEKLİYOR | Node 10/0 (p37 0/10) · faz86/mp3 p37 ile aynı |
| NF-6 Barıştırma | `7f26e06` | TEST BEKLİYOR | Node 13/0 (p37 0/13) · kampanya sayacı 0, SHA aynı |
| NF-4 Diplomasi kısayolları | `3890dc3`, `04b68ec` | TEST BEKLİYOR | Node 7/0 · Chromium 3/0 (masaüstü + yatay) |
| NF-5 AI destek / vasallık | `727a6d6` | TEST BEKLİYOR | 8 doğal kampanya ölçümü · warOn kusuru p37'de 3/2, adayda 5/0 |
| Sürüm, pin, MP kabul, regresyon | (son commit) | — | §7 |

## 2. NF-2b — Lüks mal erişim hakkı (`luxGrant`) ekonomik etki verir

**Yeniden üretim (p37):** `tests/mp_diplo5_lux_test.js` p37 sabit kopya kökünde (`STARS_ROOT`) **1/9** — L1 "alıcıda luxury.ipek (p37: false)" FAIL: AI'dan Vakum İpeği hakkı alınıyor, `luxGrant.ipek` yazılıyor, bonus (+%10 mineral, +%8 alaşım) yok. Aday **10/0** (`evidence/mp-diplo5/nf2b/`).

**Kural (SP ve MP aynı):**
- `economy.js refreshLuxury` → yalnız `luxGrant` varken `luxGrantApply` (yoksa kod yolu p37 ile aynı). Açık anlaşma yeterli; ticaret limanı / rota gerekmez.
- Veren malı **kendi kolonisinden** sağlamalı (`ownLuxury`); yalnız ithal ya da hak olarak gelen mal yeni zincir kurmaz (alıcı hakkı başkasına veremez, dealQuote "lüks mal elinde değil").
- Aynı mal koloni + ticaret paktı + hak ile erişilse de bonus **bir kez** (`e.luxury` boolean); bir kanal düşerse diğeri sürer (L2).
- **Askıya alır** (kayıt kalır, koşul dönünce çalışır): ambargo / Konsey yaptırımı (`tradeBlocked`, kaçakçılık hattı açık tutar), verenin kaynağını kaybetmesi.
- **Bitirir** (kayıt silinir, alıcıda `luxGrantLog` ≤8): savaş (`endTreatiesForWar`, pakt / geçiş / sensörle aynı mevcut kural; barış geri getirmez), verenin elenmesi, geçersiz eski kayıt (bilinmeyen mal, olmayan / kendisi olan veren, metin, dizi).
- Kabulde alıcının erişimi işlem içinde hemen yeniden hesaplanır (geri alınırsa grafik geri gelir); aylık hesap aynı sonucu verir.
- **Eski kayıt:** geçerli eski hak yüklemede bonus üretir; geçersizler temizlenir (L7). Tekrar kabul / kayıt → yükleme bonusu çoğaltmaz (L8).
- **MP:** sonucu host üretir; ayna yalnız alıcıya `mpLuxGrant` (ok / neden kodu) ve π'li `luxGrantLog` gönderir; misafir dünyasında bonus host ile aynı çarpanı verir; ilgisiz D hak bilgisini görmez (`mp_diplo5_lux_mp_test` 3/0).
- **Arayüz:** teklif özeti açılan bonusu (`+%10 mineral…`) ya da "yedek kanal" yazar; Lüks mal ağın ve ekonomi paneli kanalı (yerli / ticaret / erişim hakkı) ve askı / bitiş nedenini gösterir.

**Ölçüm (`research/mp-diplo5/lux-campaign.cjs`):**
- Doğal kampanya orta 3×120 ay + büyük 2×120 ay: AI–AI lüks hakkı **0** (AI hiç `lux` maddesi önermez; lüks için ticaret paktı ister — `ai.js` aiNegotiate). Kontrol ve aday son Save8 SHA'sı **aynı**. Eşdeğerlik testi p37'ye karşı 3 tohum × 48 ay **3/0**.
- Kontrollü enjeksiyon (24. ay sonunda motor yoluyla tek AI→AI hak, iki kolda aynı seçim; 72 ay):

| Tohum | Mal | Alıcının erişim ayı (kontrol → aday) | Etki |
|---|---|---|---|
| 11 | zerrin (+9 istikrar) | 32 → **49** / 49 | ort. koloni istikrarı 98,84 → 99,89; Save8 aynı (istikrar tavana yakın) |
| 404 | zerrin | 43 → **49** / 49 | ort. istikrar 95,84 → 96,75; Save8 aynı |
| 22 | kristal (+%9 araştırma) | 44 → **49** / 49 | dünya ayrıştı (kaotik); tek tohumda yön iddia edilmez |

Kontroldeki erişim ayları alıcının sonradan kurduğu ticaret paktı ithalatından gelir; adaydaki fark yalnız haktan gelen 17 / 5 / 6 aydır.

## 3. NF-3 — Casusluk Ağı Paktı MP müzakeresinde

- **Tek oyunculu kural (incelendi, değişmedi):** simetrik, süresiz pakt; imzada teklifi **gönderen** 120 Etki öder (çok maddeli teklifte `dealCost` indirimi); etkisi `pooledIntel` — iki taraf da ortağın üçüncü devletler üzerindeki istihbarat düzeyini haritada (filo ayrıntısı) kullanır; savaşta biter (`endTreatiesForWar`), ortak elenirse etkisiz. AI kendi girişimiyle ilişki ≥80 (müttefikse ≥60) ister; insanlar arasında ilişki koşulu yok. **Süre düzenlenemez** (mevcut kural süresiz).
- **Bulunan boşluk ve düzeltme:** savaş sürerken kurulan ağ etkisiz kalıyordu (savaş başında silinir, havuz savaşta çalışmaz) → `dealValidity` "Casusluk ağı: savaş sürerken kurulamaz — pakete barış ekle" (barış + ağ aynı pakette geçer).
- **MP:** `DIP_TREATY` + guest-stars / mp71-dip `spynet`; host teklif ve kabulde `dealQuote` ile denetler. Misafir ortakların ağ düzeyini bilmez → host `spynetPoolView` (yalnız temaslı hedef, yalnız kazanılan düzey, ortak kimliği yok) → ayna `mpPooled` → misafir `pooledIntel`. Kabuklarda başkalarının ağ düzeyi yine yok. Biten ağın nedeni `spynetLog` (π), ilişki panelinde "etkin / etkisiz: ortak elendi / sona erdi: taraflar savaşa girdi".
- **Masa:** `dealIntelTermsRow` — Casusluk Ağı **İKİ YÖNLÜ** (neyi açar, bitiş, bedel); Sensör Paylaşımı **TEK YÖNLÜ** (veren → alan).
- **Test:** `mp_diplo5_spynet_test` 10/0 (p37 0/10): misafir↔misafir, host↔misafir, insan→AI (AI kendi kararıyla kabul), karşı teklif + çift kabul tek uygulama ve tek bedel, kayıt → yükleme ve tam ayna aynı havuz, savaşta bitme + neden, savaşta ret gerekçesi, ilgisiz D'ye ileti / düzey yok, gerekçe ağ düzeyi söylemez. `mp62_core` beklentisi bilinçli güncellendi (spynet artık `bad-params` değil). faz86* / mp3 / mp31 / mp71 sonuçları p37 ile **birebir aynı**.
- **Sensör Paylaşımı yeniden koşusu:** `mp_techlux0_intel_test` 3/0 (tek yön, ilgisiz oyuncu almaz); gerçek arayüzde MP8 T5/T6 — §7.

## 4. NF-6 — Barıştırma (`peaceWith`)

- **Madde:** `{t:'peaceWith', target, front}` — VEREN, `target` ile süren savaşını (savaş defteri cephesi) bitirir; ALAN aracıdır. `front` yoksa (eski kayıt / AI teklifi) cephe denetimi yapılmaz. İkili barış ve federasyon ortak barışı kendi akışlarında.
- **Diğer savaşanın onayı (yeni kural, tek oyunculuda da):** aracı zaten o devletse örtük; AI ise mevcut barış değerlendirmesi (`aiRespond`, verenin ikili barış teklifi; RNG yok); insan ise ayrı onay. `canPeace` / Kan Hukuku ve cephe her quote'ta ve son kararda yeniden; barış + karşılık `executeDeal` içinde birlikte.
- **Seçim:** yalnız bilinen ve süren savaşlar (`knownWarPairs`), "X ile savaş · Cephe #n (insan — ayrı onay)". Eskiden bütün temaslar listeleniyor, hata metni savaşın varlığını söylüyordu (gizlilik kusuru).
- **MP iki aşama:** aracı teklifini kabul → kayıt `mediating` (dünya değişmez, ödeme yok) + diğer savaşana bağlı onay kaydı (`link`, veren → diğer savaşan, barış). Onay → asıl teklif onun yetkisiyle tek işlemde. Ret / süre / savaşın başka yolla bitmesi / yeni cephe / koşulun bozulması (ör. birleşik teklifteki lüks kaynağı) → ikisi de gerekçeyle kapanır; geç onay yeni savaşa uygulanmaz. Paket doğrulaması `med` / `link` / `mediating` kabul eder (kayıt-devam). Misafirde geçerlilik host'ta (salt okunur `peaceWithList`).
- **Test:** `mp_diplo5_peacewith_test` 13/0 (p37 0/13). M5 (iki aşama arasında paket → yeni host) paket doğrulaması ve durum komut yoluyla; tamamlanma motorun aynı yetki yoluyla sınandı — gerçek arayüzde kayıt → yeni oda → onay MP8 U3'te (§7).
- **Kampanya (`deal-campaign.cjs`, orta 3×120 + büyük 2×120 ay):** AI'nın Barıştırma teklifi **0**; iki kol yıllık Save8 SHA'sı birebir aynı.

## 5. NF-4 — Diplomasi kısayolları

İLİŞKİ sayfasında "HIZLI ANTLAŞMA": Saldırmazlık, Ticaret Paktı, **Geçiş İste** (veren: karşı taraf → alan: sen), **Geçiş Ver** (veren: sen → alan: karşı taraf). Standart teklif tek dokunuşla (SP / AI: `dealQuote → aiRespond → executeDeal`; MP insan / misafir: host `offer`), "Şartlı Teklif…" masayı aynı maddeyle açar. Durumlar aynı satırda (gönderiliyor / bekliyor / karşı teklif / kabul / ret / gönderilemedi); doktrin, savaş ve "zaten yürürlükte" gerekçeli pasif. Çift dokunuş ikinci teklif üretmez; host `duplicate` → "Bekliyor"; pencere yenilenince bekleyen teklif host listesinden bulunur (`UI.mpPendingFind`). İttifak Daveti ve ön ittifaksız federasyon kuruluşu / üyeliği değişmedi (Q7).

Test: `mp_diplo5_quick_test` 7/0; Chromium `browser-mp-diplo5-sp.cjs` 3/0 — B1 masaüstü 1280×800 fare, B2 yatay 844×390 dokunma (her ikisinde çift dokunuş → 1 anlaşma, "Kabul edildi — Saldırmazlık yürürlükte", Geçiş Ver yönü, savaşta "⛔ Saldırmazlık: savaş sürerken imzalanamaz — pakete barış ekle"), B3 masa satırları (lüks bonusu, İKİ YÖNLÜ, Barıştırma Cephe #). MP gerçek arayüz U4 (§7).

## 6. NF-5 — AI müttefik desteği ve vasallık

**Yöntem:** `research/mp-diplo5/support-campaign.cjs` salt okunur sarmalayıcılarla (sarmalayıcılı koşunun Save8 SHA'sı sarmalayıcısızla aynı) orta 4×120 + büyük 4×120 ay; ayrıca `fedgate.cjs`, `demand.cjs`, `warOn-probe.cjs`. Kanıt `evidence/mp-diplo5/nf5/`.

| Karar | Ölçüm | Değerlendirme |
|---|---|---|
| Federasyon savunma yükümlülüğü (`fedDefend`) | büyük 3 tohum: 14 üye denetimi → 7 katıldı, 3 doktrin / Konsey yasağı, 4 saldırmazlık / ittifak koşulu; `aiDefenseShirk` 0 (tohum 11: 4/2, 404: 3/1) | Katılmayanlar kural gereği — kusur yok |
| Vasal senyörüyle savaşta | orta-23 29/29 ay, büyük-11 54/83, büyük-23 9/19 | Bekçi (bekci) vasal sözleşmesi savaş katılımını şartlara bağlar; kusur kanıtlanmadı |
| Koruma isteği (zayıf AI) | 5 vaka, 5 kabul | Çalışıyor |
| Güçlü AI'nın barışçıl biat daveti | **0 teklif**; 120 ayda 78 uygun güçlü–zayıf çift-yılı; `demandVassal`'ı çağıran AI kodu yok | Kusur değil, eksik davranış → **NF-7** (yeni AI stratejisi, ayrı faz kararı); kodlanmadı |
| Koalisyon / destek fırsatı / AI warJoin | doğal kampanyada tetiklenmedi (0) | AI verdiği warJoin'i göndermeden önce `warSupportGate` + `warSupportReach` denetler (gerekirse geçiş izni ister) — kod incelemesi |
| AI warOn verir mi | Hiç vermez (ai.js'de üretici yok) | — |
| **İnsan → AI son tarihsiz Savaş Sözü** | p37: 40 isteğin **32'si kabul**; 32'sinin tamamında hedefe askerî erişim yok, 8'inde savaş bütçesi yetersiz; warJoin'de ise erişim + 2,5× güç kapısı var | **Kanıtlanmış karar kusuru** |

**Düzeltme:** `ai.js aiWarOnGate` — AI'dan istenen son tarihsiz Savaş Sözü (kabulde hemen ilan) warJoin ile aynı erişim (`warSupportReach`, pakette geçiş izni dahil) ve bilinen güç oranı kapısından + AI'nın kendi savaş bütçesinden (`aiWarBudget`) geçer; gerekçeler ayrı ("Hedefe askerî erişimimiz yok…", "Bilinen güç oranı…", "Savaş bütçemiz…"). Son tarihli insan sözü (p36/p37 kuralı) ve warJoin metni değişmedi. `mp_diplo5_ai_support_test` aday **5/0**, p37 **3/2** (A1 erişimsiz kabul, A3 güçsüz kabul yeniden üretildi). Aday probe: 40/40 erişimsiz istek gerekçeyle ret. Doğal oyunda AI hiç warOn istemediği için Save8/RNG p37 ile eşdeğer (3 tohum × 48 ay 3/0); faz86* AI anlaşma paketleri p37 ile aynı.

Plasebo bandı: doğal kampanyalarda iki kol aynı SHA verdiği (ayrışma olmadığı) için gerekmedi; tek ayrışan kol (NF-2b kristal enjeksiyonu) için yön iddia edilmedi.

## 7. MP kabul planı ve regresyon

Ortam: yerel üretim kipi relay SÜRECİ + TLS vekili, oyuncu başına kesilebilir / dondurulabilir hat, her oyuncu ayrı Chromium kalıcı profili (yatay telefon boyutları), gerçek STARS host ve misafir arayüzü.

**Yeni senaryo `MP8_SCEN=U` (host + B + C + D, `evidence/mp-diplo5/mp8-U/`):**

| Koşu | Sonuç | Not |
|---|---|---|
| 1 | 0/1 | Düzenek: D için ekran boyu tanımlı değildi (`VIEW.D`) — FATAL |
| 2 | 6/1 | U6 fikstürü quote'u geçmeyen AI çifti seçti (host `rules:quote`) |
| 3 | **7/0** | — |
| 4 | **7/0** | U3'te bulunan ürün kusuru düzeltildikten sonra (aşağıda) |

- U1 lüks hakkı: C'de host ve misafir dünyasında aynı bonus (`minMul` eşit), Lüks mal ağın "erişim hakkı"; D'nin aynasında hak bilgisi yok.
- U2 Casusluk Ağı: B gerçek masada dokunuşla önerir (İKİ YÖNLÜ satırı); C iki kez kabul + hat donar / kopar → tek ağ, B'den 120 Etki bir kez; C'nin haritasında B'nin X düzeyi (3) havuzdan, kendi düzeyi 0; D'de havuz yok.
- U3 Barıştırma: C'nin listesi yalnız bildiği savaş ("Derin Konsey ile savaş · Cephe #1 (insan — ayrı onay)"); B kabul → `mediating`, savaş sürer, ödeme yok → **kayıt → host kapanır → YENİ oda** → D onay kartını kabul eder → barış + 200 mineral bir kez; ikinci onay reddedilir. **Bulunan ürün kusuru:** misafir gelen kutusu `peaceWith` hedefini yerel kimliğe çevirmiyordu ve onay kartı yalnız "Barış" diyordu → düzeltildi (`493fc72`); koşu 4'te kart "Barıştırma onayı — Saf Akıl Ağı · Yeşil Birlik aracılığıyla barış…".
- U4 kısayol: çift dokunuş → 1 teklif; sayfa yenilenince satır "Bekliyor" ve düğme pasif, yeniden dokunuş ikinci teklif üretmez; C kabul → "Kabul edildi — Saldırmazlık yürürlükte".
- U5 birleşik teklif (lüks + kaynak): gönderim sırasında hat donar / kopar (host yanıtı kaybolur) → taslak korunur, işlem izi `draft → send → resend → reply` aynı cid, tek kayıt; kabulden önce lüks kaynağı kaybolur → teklif "Teknoloji / lüks mal koşulu değişti", kabul reddedilir, hiçbir madde uygulanmaz.
- U6 insan → AI son tarihsiz Savaş Sözü (erişimsiz hedef): AI "Hedefe askerî erişimimiz yok…" ile reddeder, savaş ilan edilmez.
- Birleşik teklifin diğer bileşimleri Node'da: Barıştırma + lüks (onay anında lüks geçersiz → barış ve ödeme yok, M7), karşı teklif + çift kabul + Casusluk Ağı (N3), kayıt-devam iki aşama (M5 + U3).

**Kayıt-dönüş (`MP8_SCEN=Z`, 14/0):** Z5 host kaydı yeni odada tek başına açar, misafir yokken tarih ilerler, bekleyen / gizlenen olay doğru, yeni olay ve anomali şeritte ve listede; Z6 misafirler yeni kodla (ana menü ve eski bağlantı) aynı devlete döner, eski kod yeni koda girişi engellemez (Z13); Z9 / Z10 misafirin filo emri host'ta uygulanır ve misafir haritasında aynı. **Kullanıcının gerçek kaydı: NOT RUN** (bu oturumda erişilebilir değil).

**Uzun oturum (`MP8_SCEN=P MP8_P_MIN=15`, 8/0):** 500 sistem / 16 AI / 2 insan, 15 dk gerçek zamanlı, 1865 gerçek dokunuş eylemi; 395 örnekte host günü 905 → 7043, ayna rev 31 → 1015, misafir uygulanan rev = host rev, en büyük gün farkı 19,5, `stalls` boş (20 sn'den uzun donma yok). 21 filo + 21 tersane emri: hepsi `ok`; 20'sinde tersane sırası misafirde görüldü (en geç 2,9 sn); kayıt-devam sonrası emir kabul edildi, yansıması bu kayıtta ölçülmedi. **P5 reddi bu koşuda tekrarlamadı** (ret kodu / nedeni kaydı için tanı yerinde).

**Regresyon (yerel Chromium, ilk koşular):**

| Senaryo | Sonuç |
|---|---|
| `MP8_SCEN=T` (Teknoloji / Lüks / Sensör; T5 tek yönlü görüş, T6 yeniden katılımda sürer) | **8/0** |
| `MP8_SCEN=V` (Savaş Sözü) | **7/0** |
| `MP8_SCEN=Z` (kayıt, olay, yeniden katılım) | **14/0** |
| `MP8_SCEN=Q` (savaş desteği, toprak vaadi) | **8/0** |
| `MP8_SCEN=Y` (Sistem Devri, Haraç, kısayollar) | **6/0** |
| `MP8_SCEN=P` (15 dk, 500 / 16 AI) | **8/0** |
| `browser-mp-diplo5-sp.cjs` (tek oyunculu, masaüstü + yatay) | **3/0** |

Not: T–Y koşuları `493fc72` (misafir kart düzeltmesi) öncesi istemci dosyalarıyla başladı; düzeltme yalnız Barıştırma kartını ve `peaceWith` hedef eşlemesini etkiler, U koşu 4 ve kaynağı okuyan Node paketleri (`mp1_relay` 14/0, `mp6_mirror` 8/0, `mp71_bridge` 9/0, `mp86_nebula_cache` 3/0, `mp_p0_sync` 6/0) düzeltmeden sonra yeniden koşuldu.

**Tam Node** (`STARS_TEST_WORKERS=4 node tests/run-all.js`, `evidence/mp-diplo5/node-tam.log`, FAIL veren paket günlükleri `node-tam/`, fark `node-karsilastirma-p37.txt`):

| | Paket | GEÇEN | KALAN | FAIL'li paket |
|---|---|---|---|---|
| p37 (`evidence/mp-techlux0/node-tam.log`) | 217 | 6379 | 275 | 53 |
| p38 aday | 223 | 6427 | **275** | 53 |

Paket paket fark yalnız 6 yeni paket (hepsi geçer). Kalan 275 FAIL p37 ile aynı 53 eski paket (bu fazdan bağımsız; silinmedi). Yeni fark yok.

**Diğer:** p37'ye karşı Save8/RNG eşdeğerliği 3 tohum × 48 ay 3/0; `verify-release` çalışma ağacı ve çıkarılmış ZIP `--root` **DOĞRULANDI: 19 dosya; oyun build 96h10p38**.

**Ayrı yazılan ortamlar:**

| Ortam | Durum |
|---|---|
| Canlı Render (stars-zhdu) | Ölçüm: `/mp/version` → MP.8.9b30 / 96h10p33 (19:51 UTC, HTTP 200). Bu fazın sürümü dağıtılmadı. **Oynanış: NOT RUN** |
| Fiziksel cihaz (Android / PC) | **NOT RUN** |
| LAN | **NOT RUN** |
| Kullanıcının gerçek kaydı | **NOT RUN** (erişilebilir değil) |

## 8. Teslim

- Taslak PR: https://github.com/sarsiss12-dot/Star/pull/53 (taban `claude/stars-mp-techlux0`).
- Başlangıç HEAD `f2e48eba207a5a4bb3f10b37f70323a61105b3ad` (p37 / MP.8.9b35) → bitiş HEAD: dal `claude/stars-mp-diplo5` ucu (bu bağlantı commit'i; kod ve kanıt `b3bebc9`). Oyun `96h10p38`, MP `MP.8.9b36`, Save8 v8, paket 4, protokol 1. p38 paket yükleyicisi p6–p37, p25u1, p27s1 kabul eder.
- Render dalı: `claude/stars-mp-diplo5`. Beklenen `/mp/version`:
  `{"mp":"MP.8.9b36","build":"96h10p38","files":{"mp-core.js":"c8993d2942e8","relay.js":"c033d56564f0","mp1-host.js":"f5dc296c1a3d","join.js":"65c28db3714f","mirror.js":"f9043c6e87a3","guest-stars.js":"c7f05ccc2841","mp71-dip.js":"932c92d12cbc","mp7-setup.js":"a7391d21552c"}}`
- ZIP `releases/stars-faz96h10p38.zip` — SHA-256 `1b1917831ff9e437ed1ce2c1ff6458f59145835bb0859f1a7a4bf5b970823253`, CRC32 `57A48A60`, 20 girdi; çıkarılmış ZIP `verify-release --root` DOĞRULANDI.
- Kayıt uyumu: Save8 v8 aynı; yeni alanlar yalnız kullanıldığında (`luxGrantLog`, `spynetLog`); eski `luxGrant` kayıtları yüklemede doğrulanır (geçerli → bonus, geçersiz → temizlenir). MP paketine isteğe bağlı `med` / `link` / `mediating`; p37 paketi p38'de açılır, p38'in bekleyen Barıştırma işlemi içeren paketi p37'de açılmaz.
- Koruma: `mp-diplo5-reviewed` ← `mp-techlux0-reviewed` ← `mp-waron0-reviewed` ← …
- Commit'ler: NF-2b `07cd35c` · NF-3 `7d72bba` · NF-6 `7f26e06` · NF-4 `3890dc3`, `04b68ec` · NF-5 `727a6d6` · sürüm / pin / ZIP `7e004b3` · MP8 U + kart düzeltmesi `493fc72` · rapor.

**Açık işler:** NF-7 AI barışçıl biat daveti (kullanıcı kararı); NF-8 federasyon gündem kuyruğu ve acil teklif önceliği (ayrı faz); tek başına kayıttan dönüşte görünmeyen olaylar ve uzun oturumda misafir haritasının donması — yerel Z / P'de yeniden üretilmedi, gerçek oturum / gerçek kayıtla doğrulanana kadar açık; Render dağıtımı ve fiziksel / LAN testleri kullanıcıda.
