# Faz96F.1 — Test sonuçları

Son kaynak: 118 paket, 5776 PASS, 0 FAIL, 0 atlanan paket. Yeni paket17 adlandırılmış kontrol; önceki5.759 kontrol korunur. Tekrar yürütmeler toplamı artırmaz. Ek rota senaryosu gerçek varış/8 enerji kredisiyle de yeniden çalıştırıldı.

## Yeni kontrol paketi

- PASS: an alloy deficit with short runway is a critical budget, not a healthy rearm state
- PASS: a paid producer cannot spend the last recovery currency while its projected net remains negative
- PASS: a real producer which removes the input deficit remains affordable through the same rule
- PASS: each paid hull rechecks combined pending building and ship upkeep
- PASS: projected alloy upkeep includes pending building consumption and all newly accepted hulls
- PASS: healthy military investment still pays canonical costs without any resource grant
- PASS: repeating an identical valid armed-fleet route does not manufacture action history
- PASS: AI port search finds the real safe alternate path instead of rejecting the first unsafe BFS result
- PASS: an AI paid convoy actually uses the safe path selected from its own knowledge
- PASS: an agreed contract retains physical risk when no safe alternate exists
- PASS: live risk change invalidates only the derived AI route choice on the same day
- PASS: hidden pirates are not consulted when planning and can still destroy real cargo
- PASS: legacy diplomacy memories and long objective survive v8 without fresh RNG
- PASS: critical industry waits for its real price instead of spending its fund on cheaper growth
- PASS: one real production month can fund the held producer and its completed output works
- PASS: the short recovery reservation also protects its price from civilian hull spending

## Geniş regresyon

Dokuz hedef, hafıza/güven, sefer, federasyon/vasallık, diplomasi/gerçek konvoy, civic/tür/genetik/köken, bilim otomatik keşfi, kuruluş, habitat işaretleri, X, Save8/PWA ve mevcut native Canvas/portre/audio smoke paketleri koştu. Çözüldüğü bildirilen sorunlar yeniden açık hata ilan edilmedi.

## Gerçek tarayıcı

Chromium 133.0.6943.0: 25 PASS, 0 FAIL; pageErrors=0.

- PASS: 360x740 real pregame toggle and all four probability choices
- PASS: 740x360 real pregame toggle and all four probability choices
- PASS: 1280x720 real pregame toggle and all four probability choices
- PASS: 740x360 diplomacy invite actual click, inbox ballot, actual AI membership
- PASS: 1280x720 diplomacy invite actual click, inbox ballot, actual AI membership
- PASS: solved federation founding path: enabled button creates real membership and charges once
- PASS: mobile nonfounder application actual button and final inbox accept change membership
- PASS: inbox reject actual click, duplicate prevention, expiry and reload
- PASS: AI application presents player ballot; informational record has no decision bypass
- PASS: founding action opens existing foundation screen with real requirements
- PASS: real Canvas portraits and WebAudio smoke remain available
- PASS: mobile genetic choices use shared budget, conflict and removal gates
- PASS: mobile civic radical consumes both slots through real clicks
- PASS: player devour actual confirmation updates resources and renders wreck without errors
- PASS: stale destructive confirmation cannot act on restored save
- PASS: 640x360 actual battle report X touch, reopen, save and new report
- PASS: 740x360 actual battle report X touch, reopen, save and new report
- PASS: portrait gameplay retains the existing rotate-to-landscape guidance
- PASS: real Canvas habitat shapes at zoom 0.12 with labels independent
- PASS: real Canvas habitat shapes at zoom 0.18 with labels independent
- PASS: real Canvas habitat shapes at zoom 0.35 with labels independent
- PASS: real Canvas habitat shapes at zoom 0.7 with labels independent
- PASS: habitat observation and draw never expose hidden current colonization
- PASS: existing diplomacy panel respects low and high strategic intelligence
- PASS: 96F cached shell upgrades to96F.1, v8 save survives and new shell loads offline

360x740 pregame;740x360 yatay mobil;1280x720 masaüstü;640x360/740x360 X dokunması; gerçek Canvas0,12/0,18/0,35/0,70; eski96F cache/kayıt→96F.1 ve offline yükleme kapsamı.

## Kampanyalar

Sekiz eş koşullu120 aylık çift, coğrafya/merkez/kimlik eşitliği, her ay sonlu ve negatif olmayan stok kontrolü;60.ay Save8. Resmî kaynak11/99/404 son kayıt SHA/RNG tekrarı.404 son sürüm ek120 ayda aylık/eylem/RNG/save eşitliği. Kampanyalar5.776 birim kontrolü sayısına eklenmedi. İlk aday sekiz koşu ve final sekiz koşu ayrıdır; raporda son değerler kullanılır. Kötüleşmeler AI-DENGE-96F1.md'de saklanmaz.

## Başarısız/engellenmiş ara koşular

- controlled-before.log: ilk13 tanı kontrolünde5 PASS/8 FAIL. Bunlar sekiz ayrı kök neden değildir; mutlak AI kalkış yasağı bekleyen aday tasarım sonra geri çekildi.
- targeted/summary.json:24 paket464 PASS/1 FAIL; eski BUILD_ID regex beklentisi96f idi. Yalnız sürüm beklentisi düzeltildi; final geniş koşu5776/0.
- browser-first.log: Chromium geçici ikilisi yok; başlatma exit1,0/0. Bu BLOCKED sayılır, başarı değildir. Mevcut paket yeniden açılıp gerçek tarayıcı koştu.
- first-candidate:11 kritik dönem15'e çıkmıştı; acil üretici finansmanı düzeltildi. Mutlak kalkış yasağı kaldırıldı. Sonuçlar saklıdır.

| Alan | Durum | Sınır |
|---|---|---|
| Son otomatik | PASS |118 paket/5776 kontrol |
| Son tarayıcı | PASS |25 kontrol/0pageError |
| Sekiz ana eş koşullu çift | PASS | Simülasyon/ölçüm; evrensel denge başarısı değildir |
|404 deterministik tekrar | PASS |120 ay, dört veri katmanı eşit |
| Save8 ve gerçek eski96F kaydı | PASS | Otomatik ve service worker yükseltmesi |
| Native Canvas/PWA | PASS | Gerçek yazılımsal Canvas/Chromium; Android donanımı değil |
| Fiziksel Android | BLOCKED | Cihaz yok |
| Dikey oyun X dokunması | BLOCKED | Mevcut yataya döndür kilidi; yönlendirme PASS |
| Öznel müzik doğallığı | NOT RUN | WebAudio smoke dinleme kanıtı değildir |
| Büyük galaksi/kriz açık uzun denge | NOT RUN | Test kapsamı dışında |

Kanıtlar tests/audit96f1/final, browser, campaigns, campaign-analysis.json, baseline-reproduction.json, performance.json, verification-result.json. Yeni ekran görüntüleri yalnız iç QA için kullanıldı; teslim arşivine eklenmedi.
