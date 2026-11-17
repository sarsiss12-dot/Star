# MP-SYNC-FED.1 — Kayıttan devam + ilk tersane emri, uzun oturumda misafir haritası, NF-9 federasyon savunma çağrısı (p39 / MP.8.9b38)

17 Kasım 2026 · Dal `claude/stars-mp-sync-fed1` · Başlangıç `1a6e404aa91215a9e037063c6ff33426747e9e29` (p38 / MP.8.9b37, `claude/stars-mp-sync-fed0`, taslak PR #54; uzak dal ucu aynıydı, arada fark yok) · Bitiş HEAD: §8 · Oyun `96h10p39` · MP `MP.8.9b38` · Save8 v8 · paket 4 · protokol 1.

Hiçbir kalem TAMAMLANDI değildir; yerelde doğrulananlar `TEST BEKLİYOR`. PASS / FAIL / NOT RUN ayrı yazılmıştır. Yerel testler Chromium benzetimidir (üretim relay süreci + TLS vekili + ayrı profiller); fiziksel cihaz değildir.

## 1. Özet

| Kalem | Commit | Durum | Kanıt (aday / p38 kontrol) |
|---|---|---|---|
| P0 kayıt → yeni oda, olaylar, ilk tersane emri (J) | `b9ae9ad` | TEST BEKLİYOR (ürün kusuru bulunmadı) | MP8 J 5/0 |
| P0 uzun oturum, 500 sistem / 16 AI / host + 2 misafir (I) | `87c32ff` | TEST BEKLİYOR | I1 15 dk PASS (kapalı-pencere donma 0) |
| Çatışan yabancı filo misafir haritasında çatışmada (ayna) | `87c32ff` | TEST BEKLİYOR | I2 önce FAIL, sonra PASS |
| NF-9 federasyon savunma çağrısı | `3ca92f7` | TEST BEKLİYOR | Node 7/0 (p38 0/7) · MP8 M 5/0 (p38 2/3) |
| Sürüm p39, ZIP, koruma, eşdeğerlik | `06e0c77` | — | eşdeğerlik 3/0 · §7 |

## 2. P0 — Kayıttan devam ve ilk tersane emri (`MP8_SCEN=J`, `tests/helpers/mp-sync-fed1-mp.cjs`)

Host + B + C (ayrı Chromium profilleri), orta / 5 AI / seed 22.

- **J1** Kayıt öncesi: host'un bekleyen ve gizlenmiş olayı, B'nin kendi bekleyen kararı. Host kaydeder (MP4 deposu) → herkes kapanır → relay yeniden başlar → host ana menü → Kayıtlı Oyuna Devam Et → YENİ oda kodu → misafir yokken DEVAM ET. Tarih, bekleyen / gizli olay durumu ve B'nin kararı korunur. Gerçek döngüde 30 gün ilerler; **doğal üretim** bu sürede B'ye 1 yeni karar ekledi (host'a 0). Ardından host için yeni olay + anomali + bilim zinciri, B için yeni bilim zinciri + anomali (motorun giriş noktaları `UI.event` / `UI.anomaly` / `UI.chain`; uzak insanda `enqueueDecision`). Host şeridi / listesi doğru; B'nin olayı host şeridinde yok. PASS.
- **J2** B ana menü ODAYA KATIL + yeni kod, C davet bağlantısı. B'nin aynasındaki bekleyen kararlar host ile aynı; B kendi olay / zincir / anomalisini şeritte veya listede görür ("Kayıp Sonda", "Antik Kalıntı Mezarlığı", "Sessiz Gemi — Güverte", "Kristal Mezarlık"); host'un olayları B'de, B'ninkiler C'de yok. PASS.
- **J3** B'nin ilk gemi siparişi gerçek dokunuşla (sistem paneli → tersane düğmesi), en uzun inşa süreli kurulabilir gemi (Koloni Gemisi, 39 gün). Ayrı ölçüm: **host kabulü 510 ms**, **host tersane kuyruğunda kayıt 381 ms**, **B'nin tersane ekranında aynı sipariş 695 ms** (✕ iptal satırı). Kaynak tam bir kez düştü (60 alaşım + 265 mineral). PASS.
- **J4** Host'un B'ye `result` iletisi düşürülür (yanıt kaybı); B aynı komutu AYNI cid ile yeniden gönderir (istemcinin yeniden gönderim yolu) → host tek sipariş, tek kaynak kesintisi, yanıt `dup`; B'nin tersanesinde tek yeni satır. PASS.

Not: bu senaryoda ürün kusuru bulunmadı. Saha belirtisi (ilk tersane emrinin görünmemesi, kayıttan dönüşte kaybolan olaylar) gerçek oturumda / gerçek kayıtla doğrulanana kadar AÇIK. Kullanıcının gerçek kaydı bu oturumda yok → NOT RUN.

## 3. P0 — Uzun oturumda misafir haritası (`MP8_SCEN=I`, `tests/helpers/mp-sync-fed1-soak.cjs`)

500 sistem / 16 AI / host + 2 misafir (B, C), seed 404, 12 ay ön ilerletme, ardından gerçek döngüde 15 dakika. Her 30 sn'de sırayla bir olay (B ve C dönüşümlü): hız değişimi (2× / 4× / en yüksek), açık pencere 20 sn → kapatma, arka plan (sayfa dondurulur 20 sn) → öne dönüş, 3 sn bağlantı kaybı, emir (filo + tersane). Her 2 sn örnek: host günü, host'un o misafire son ayna revizyonu, misafirin aldığı / uyguladığı revizyon, misafir günü, eşitleme notu, pencere durumu, son başarılı emir.

| Ölçü | Sonuç (15 dk) |
|---|---|
| Örnek / olay | 604 / 30 |
| Pencere KAPALIYKEN donma (> 20 sn, host ≥ 3 gün ilerlemişken) | **0** |
| Pencere AÇIK bekletme (tasarım) | 6; hepsinde neden pencere üstü hapta ("ÇOK OYUNCULU · Pencere açık — dünya, kapanınca güncellenir") — MP-SYNC-FED.0 düzeltmesi |
| Pencere / arka plan / kopma dönüşünde yetişme | hepsi PASS (ör. pencere 85–315 ms, arka plan ~50 ms, kopma 0,3–3,6 sn) |
| Kabul edilen sipariş misafire yansıdı | hepsi (ör. 225–637 ms) |
| En büyük host–misafir gün farkı | 7 gün (en yüksek hızda, örnekleme anı) |

**Pencere açıkken bekleyen eşitleme** ile **pencere kapalıyken donma** ayrı sınıflandı. Açık pencere bekletmesi tasarım gereği (onaylar dünya kimliğini denetler) ve nedeni artık görünür. Pencere kapalıyken donma bu koşuda **oluşmadı**; saha vakası (pencere açık değilken donma) yeniden üretilemedi → AÇIK.

**I2 görsel tutarlılık** (duraklatılmış oyun, ayna eşit; B ve C): kendi filo rotası, keşfedilen sistemler, bilinen kolonileştirilebilir işaretleri (`playerHabitatMark`), görünür sistem sahipliği (sınırlar), filo can oranları host ile aynı. **Bulunan ve düzeltilen kusur:** ayna, yabancı filoya her zaman `combat:0` yazıyordu; host'ta çatışmadaki (combat=2) yabancı filo misafir haritasında çatışmada görünmüyor, kırmızı halka ve (hasarsızken) can çubuğu çizilmiyordu. Önce: I2 FAIL (`combat [[176,3]]`, `evidence/mp-sync-fed1/i-once/`); düzeltme `research/mp6/mirror.js` (görünür sistemde duran çatışan yabancı filo `combat:2`; yoldaki / görünmeyen 0; başka alan yok); sonra I2 PASS (3 dk ve 15 dk koşularda).

**I3 sensör paylaşımı** (B → C, motorun `intel` maddesi): C'nin misafir görüşü host'un C için hesapladığıyla aynı; C yalnız B'nin gördüğü sistemleri kazanır; B'nin ve host'un görüşü değişmez. İlk 15 dk koşudaki I3 FAIL test varsayımındandı (B'nin filo görüşünün de aktarılacağını sanıyordu; motor yalnız sensör kaynaklarını paylaşır) — ilk FAIL günlüğü saklandı (`i-15dk/I-15dk-ilk.log`); ölçüt motor kuralına göre düzeltildi.

Federasyon Kuruldu / oy kartı ve olay kartlarının yanıttan sonra açık kalmaması: `MP8_SCEN=E` / `F` ve Z3 / Z10 (§7).

## 4. NF-9 — Federasyon savunma çağrısı

**Saha vakası (yeniden üretildi):** host kabul ediyor, misafir düğmeyi göremiyor. p38'de üye, başka bir üyenin savaşına destek talebini yalnız o savaşı BİLİYORSA (`knownWarPairs`: istihbarat ≥3) görüyordu; misafirin aynasında üçüncü tarafların savaşı olmadığından düğme hiç çıkmıyordu, host kapısı ise izin veriyordu. M senaryosu p38'de: B'nin panelinde `calls:[]`, `oldBtns:[]`.

**Kural (tek oyunculu, host ve misafir aynı işlev):**
- `diplomacy.js fedDefenseCalls(viewer)`: üyelerin GEÇERLİ savunma savaşları — mevcut `fedEmergencyId` tanımı (saldırıya uğrayan üye, açık cephe, savunma kaydı, en az bir üyenin destek kapısı açık). Satır: savunulan üye, saldırgan (izleyicinin temasına göre ad; temas yoksa "Bilinmeyen saldırgan"), cephe, durum (Açık / Gündem kuyruğunda + sıra / Oylanıyor / Onaylandı / Oylandı / Düştü), talep açılabilir mi ve gerekçe (`canFedMotion('joinWar')` + gündem kuralı; temassız saldırganda "Saldırganla temasın yok"). Dünyaya yazmaz, RNG çekmez; harita görünürlüğü, filo konumu ve istihbarat düzeyi değişmez.
- `ui.js fedGovernance`: ASKERÎ sekmesinde "🛡 Savunma çağrıları" kutusu ve "Savunma desteği talep et" düğmesi; aynı (saldırgan, üye) çifti eski "Ortak savaş kararları" listesinde tekrar edilmez.
- MP: `mp-core pol.fed.defCalls` (host aynı işlevle, izleyiciye göre); `guest-stars` `fedDefenseCalls` ve `canFedMotion(joinWar)` host satırını kullanır. Federasyon dışı oyuncunun görünümüne girmez. Komut mevcut `fedMotion` yolu; acil öncelik / FIFO / aktif oyu kesmeme mevcut gündem kuralları.

**Test:**

| Vaka | p38 | Aday |
|---|---|---|
| D1 host: satır + etkin düğme, istihbarat gerekmez ve değişmez | FAIL | PASS |
| D2 misafir: `pol.fed.defCalls` aynı satır; aynada savaş YOK (gizlilik), eski kapı reddederdi; komut → acil savunma oyu, Etki kesintisi yok | FAIL | PASS |
| D3 federasyon dışı D: satır yok, `pol.fed` yok | FAIL | PASS |
| D4 savunma oyu açıkken başka geçerli talep kuyruğa girer (Oylanıyor + Gündem kuyruğunda · sıra 1) | FAIL | PASS |
| D5 gerekçeler: aynı savaş için ikinci talep; savaş biter → satır kalkar; üye ayrılır; temassız saldırgan | FAIL | PASS |
| D6 kayıt → yeni host durumlar aynı; aynı cid yeniden gönderim ikinci kuyruk / oy / kesinti üretmez | FAIL | PASS |
| D7 saf işlev: Save8 baytları ve RNG değişmez | FAIL | PASS |
| MP8 M (host + B + C üyeler, D dışarıda; gerçek dokunuş): B'nin panelinde C'nin savunma çağrısı + düğme → acil oy; C'ye oy kartı, D'ye yok; ikinci dokunuşta düğme "Oylanıyor" (ikinci kayıt yok); ASKERÎ sekmesi yeni ayna kurulumundan sonra korunur; host paneli "Oylanıyor"; oy açıkken C, host'un savunması için talep açar → sırada | 2/3 (M2–M4 FAIL) | 5/0 |

Ekran: `evidence/mp-sync-fed1/nf9/m2-b-savunma-cagrisi.png` (aday), `m2-kontrol-p38.png` (p38).

## 5. Önceki düzeltmeler — yeniden koşu

Barıştırma son onayı (`mp_sync_fed0_peacewith_test`, MP8 U7), federasyon gündemi (`mp_sync_fed0_agenda_test`), kayıt dönüşü (`mp_sync_fed0_resume_test`, MP8 Z / J), misafir eşitlemesi (MP8 O / I) son HEAD'de §7.

## 6. Render, cihaz, LAN, gerçek kayıt

| Konu | Sonuç |
|---|---|
| Canlı Render `/mp/version` (salt okunur, 17 Kasım 2026) | `MP.8.9b30` / `96h10p33` — aday dağıtılmamış (`render/mp-version-canli.json`) |
| Beklenen `/mp/version` (bu dal) | `{"mp":"MP.8.9b38","build":"96h10p39", files: mp-core d0ae2907bdd8, relay c2097dd6d1fa, mp1-host f5dc296c1a3d, join 65c28db3714f, mirror 56019070fa24, guest-stars f18432d12b2a, mp71-dip 932c92d12cbc, mp7-setup a7391d21552c}` |
| Render dalı | `claude/stars-mp-sync-fed1` (dağıtım yayın adımına bırakıldı) |
| Canlı Render'da aday ile MP oturumu | NOT RUN (aday dağıtılmadı) |
| Fiziksel Android / PC | NOT RUN |
| LAN | NOT RUN |
| Kullanıcının gerçek kaydı | NOT RUN (dosya yok) |

## 7. Regresyon (son HEAD)

| Koşu | Sonuç | Not |
|---|---|---|
| Tam Node `node tests/run-all.js` | 228 paket · **6447 geçen / 275 kalan** | MP-SYNC-FED.0 sonu: 226 · 6440 / 275. Mevcut her paket (koruma testleri dahil) birebir aynı; fark yalnız yeni `mp_sync_fed1_defcall` 7/0 ve `mp_sync_fed1_equivalence` (kök verilmeden 0/0). 275 eski FAIL'in sınıflandırması MP-SYNC-FED0-SONUC §7.2 |
| `mp_sync_fed1_defcall_test` | 7/0 (p38 0/7) | NF-9 |
| `mp_sync_fed1_equivalence_test` (`STARS_CONTROL_ROOT`=p38 sabit kopya) | 3/0 | 3 tohum × 48 ay Save8 + RNG birebir |
| `mp_sync_fed0_peacewith_test` (Barıştırma son onayı) | 6/0 | |
| `mp_sync_fed0_agenda_test` (federasyon gündemi) | 6/0 | |
| `mp_sync_fed0_resume_test` (p38 + p37 + p33 kökleriyle) | 3/0 | aday paketi p38 / p37 / p33'te "Kayıt başka bir oyun sürümüne ait."; p33 paketi adayda açılır |
| p38 paketi → p39 | doğrulama ok, yükleme ok | `p38-paket-p39-yukleme.txt` |
| `MP8_SCEN=O` (misafir eşitlemesi) | 11/0 | |
| `MP8_SCEN=U` (U7 Barıştırma) | 8/0 | host + B + C + D |
| `MP8_SCEN=Z` (kayıt dönüşü, yeni kod, ikinci sekme, eski kod, olay şeridi) | 14/0 | |
| `MP8_SCEN=E` / `F` (oy kartı, Federasyon Kuruldu tekrarı) | 6/0 / 6/0 | |
| `MP8_SCEN=J` | 5/0 | |
| `MP8_SCEN=M` | ilk koşu 4/1, düzeltilmiş test 5/0 + 5/0 | ilk FAIL: M2 ikinci dokunuşta locator zaman aşımı (misafir görünümü güncellenirken düğme kalktı; ürün ikinci kaydı zaten reddeder). Test sağlamlaştırıldı (ikinci dokunuş + panelin "Oylanıyor"a geçmesini bekleme); ilk FAIL günlüğü `regresyon/M.log` |
| `MP8_SCEN=I MP8_I_MIN=15` | 4/0 | 602 örnek, 30 olay, kapalı-pencere donma 0, açık-pencere bekleme 6 (neden hapta), en büyük gün farkı 5,3 |
| `MP8_SCEN=P` (500 / 16 AI / host + 1, varsayılan 6 dk + P2–P7) | 8/0 | |
| `browser-mp-field-fix0-sp.cjs` (SP Oyuna Devam Et) | 1/0 | |
| `python3 tools/verify-release.py` + çıkarılmış ZIP | DOĞRULANDI (19 dosya, 96h10p39) | |

Kanıt: `evidence/mp-sync-fed1/regresyon/`, `node-tam/`, `nf9/`, `i-once/`, `i-15dk/`, `j-aday/`, `zip/`.

## 8. Teslim

- Dal `claude/stars-mp-sync-fed1`; commit'ler `b9ae9ad` (J), `87c32ff` (ayna çatışma + I), `3ca92f7` (NF-9), `06e0c77` (p39 sürüm, ZIP, koruma, eşdeğerlik), son commit (rapor, CLAUDE.md, görev belgesi, M sağlamlaştırma, kanıt). Bitiş HEAD bu raporu içeren dal ucudur.
- Taslak PR: `claude/stars-mp-sync-fed0` (PR #54) tabanlı. Main'e birleştirme ve Render dağıtımı yapılmadı.
- **ZIP** `releases/stars-faz96h10p39.zip`: SHA-256 `3eabc1562c378ae3e841cc16466736cb8fdb023de26cabf85df629178623ab64`, CRC32 `7939EA20`, 20 girdi (19 runtime + manifest); çıkarılmış ZIP `verify-release --root` DOĞRULANDI. Üst ZIP (p38) SHA-256 `1b1917831ff9e437ed1ce2c1ff6458f59145835bb0859f1a7a4bf5b970823253`.
- Render'da seçilecek dal: `claude/stars-mp-sync-fed1`; beklenen `/mp/version` §6.
- Görev durumu: J / I / ayna çatışma / NF-9 `TEST BEKLİYOR`; saha vakaları AÇIK (§9).

## 9. Açık kalanlar

- Saha: pencere açık değilken uzun oturumda misafir haritası donması — 15 dk / 500 sistem / 2 misafirle yeniden üretilemedi; AÇIK.
- Saha: kayıttan dönüşte kaybolan olaylar, ilk tersane emri — J senaryosunda yeniden üretilemedi; gerçek kayıt / oturumla doğrulanana kadar AÇIK.
- NF-7 AI barışçıl biat daveti; NF-10 Galaktik Konsey gündem seçimi (#51); NF-11 tersane yerleşimi; NF-12 gezegen ekonomisi dökümü.
