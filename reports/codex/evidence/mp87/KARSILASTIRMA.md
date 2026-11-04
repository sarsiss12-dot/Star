# MP.8.5 misafir kontrolü / MP.8.6 misafir adayı — yerel gerçek ayna yolu

Sabit 120. ay Save8, seed404, 45 sistem, 2 insan+5 AI; Chromium155, 800×360 dokunmatik görünüm, iki sayfada4× CPU. AB/BA (A,B,B,A), iki yeni oturum/kol, oturum başına18 gerçek delta ve6 gerçek dokunma. p95=floor(n×0,95). Süreler ms; kapsayıcı süreler toplanmaz.

| Ölçüm | Kontrol n; med/p95 | MP.8.6 n; med/p95 | Ortanca azalma |
|---|---:|---:|---:|
| receiveToDraw | 36; 340.7/959.3 | 36; 271.6/449.9 | 20.3% |
| nodeToDraw | 36; 1114.6/1759.8 | 36; 1124.4/2248.6 | -0.9% |
| deserialize | 36; 106.5/316.7 | 36; 50.9/140.1 | 52.2% |
| refresh | 44; 22.0/72.1 | 46; 19.4/55.8 | 11.8% |
| draw | 331; 10.5/61.9 | 387; 9.6/53.3 | 8.6% |
| tick | 47; 13.9/52.4 | 54; 17.6/89.7 | -26.6% |
| sprites | 387; 0.1/3.1 | 445; 0.1/2.3 | 0.0% |
| worldImage | 662; 0.0/2.5 | 774; 0.0/2.2 | — |
| borders | 331; 0.1/24.3 | 387; 0.1/24.8 | 0.0% |
| fleetLabels | 331; 0.0/0.1 | 387; 0.0/0.1 | — |
| frames | 329; 150.0/483.4 | 385; 133.3/350.0 | 11.1% |
| inputs | 12; 23.1/72.2 | 12; 10.2/52.4 | 55.8% |
| longtask | 363; 126.0/368.0 | 404; 119.0/289.0 | 5.6% |

| Koşu | Kol | Ayna alımı→çizim med/p95 | rAF/s | Uzun görev n; med/p95 |
|---|---|---:|---:|---:|
| a10 | mp85 | 423.3/974.3 | 3.96 | 157; 183.0/429.0 |
| b9 | mp86 | 294.1/445.3 | 5.57 | 200; 126.0/349.0 |
| b10 | mp86 | 268.6/958.7 | 6.32 | 204; 116.0/260.0 |
| a11 | mp85 | 333.4/497.2 | 6.88 | 206; 106.0/245.0 |

Eşdeğerlik kontrolleri: `{"sourceSha": true, "cosmetic": true, "hostHashes": false, "mirrorSha": true, "saveSha": true, "hostFinalSHA": true, "hostRNGSequence": true, "guestRNG": true}`.

receiveToDraw: gerçek mirrorDelta callback girişinden yeni dünyanın View.draw çağrısının sonuna. Compositor ekrana sunum zamanı değildir. nodeToDraw host adım/yayın, yerel relay, misafir ve Node polling gecikmesini kapsar. inputs gerçek pointerdown→sonraki çizim; fiziksel ekran/Android gecikmesi değildir. drawWorldImage zamanı Canvas çağrısının JS kapsamıdır; ertelenen raster/compositor işi ayrıca trace edilir. rAF/s fiziksel FPS değildir.

Ara host Save8 SHA dizileri tamamen eşit değildir (ham kontrol FAIL); neden olan alanlar bu fazda kanıtlanmadı. Her adımda host RNG ve son host Save8, son misafir Save8/ayna eşittir. Bu çalışma host ay-ay bayt eşdeğerliği kanıtı değildir. Yüzdeler gözlenen örnek dağılımıdır; genel/saf nedensel akıcılık kazancı sayılmaz.
Aynı kontrol kaydı yüklenir; host gerçek motoru yarım gün adımlarla deterministik ilerletir, guest simülasyon yürütmez. Her örnek işlenmeden sonraki adım gönderilmez; doğal yoğun host zamanlaması veya ağ fırtınası benchmarkı değildir.
