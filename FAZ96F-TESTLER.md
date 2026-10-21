# Faz 96F — Testler ve doğrulama

Son üretim kodu: **117 otomatik paket, 5759 PASS, 0 FAIL; atlanan paket yok.** Üç yeni pakette 69 kontrol; önceki 114 paketin 5.690 kontrolü korunur. Son kaynak düzenlemesinden önce başlayan 41 paket yeniden yürütüldü; en son tekil sonuçları eski yürütmelerin yerine geçti. Tekrarlı yürütmeler toplama eklenmedi.

| Yeni paket | PASS | FAIL |
|---|---|---|
| faz96f_map_panel_native_canvas_test.js | 19 | 0 |
| faz96f_memory_test.js | 21 | 0 |
| faz96f_strategy_test.js | 29 | 0 |

Strateji testleri gerçek galaksi kurulumu, 720 günlük olağan süreklilik, kaynak çöküşü, filo kaybı, gerçek bitmiş savaş kaybı, ihanet, acil değişim beklemesi, 900 gün başarısızlık, gerçek ücretli üretim, AI-AI gerçek diplomatik işlem ve insan için bekleyen teklif, hedefli sefer/başarısız hedef beklemesi, gözlem ve gizli bilgi sınırları, gerçek kargo kaybına mevcut filo tepkisi, Save v8 ve aynı seed içerir. Planlamanın kaynak/RNG/gemi/teknoloji üretmediği kontrol edilir.

Hafıza testleri gerçek combat.js hasarı, ortak cephe makbuzu, tekrar engeli, 14 kayıt sınırı ve solma, güven başlangıç cezası, gerçek kargo teslimi/kaynak korunumu, yükümlülük ödemesi, yardıma yetişememe ve yapabilirken kabul ettiği yardımı göndermeme ayrımı, gerçek ittifak ihaneti, senyörün yalnız ilanla ikinci fiziksel yardım ödülü almaması ve Save v8 içerir. Sadece buton ya da bayrak değişimiyle yetinilmedi.

Harita/panel paketi 19 kontroldür; gerçek native Skia Canvas, piksel ve zoom denetimi, keşif/tarama/sis kısıtları, son gözlem cache'i, eski kayıt, gerçek savaş raporu anahtarı, X sonrası saklama/yükleme, yeni rapor, bayat düğme ve aktif savaş güvenliği.

Mevcut diplomasi/casusluk/federasyon/vasallık/savaş/ticaret/araştırma/üretim/filo/otomasyon/haber ağı ve kimlik paketleri yürütüldü. Çözüldüğü bildirilen federasyon kuruluşu ve bilim gemisi otomatik keşfi regresyon olarak korundu. Civic/genetik bütçe, tür, ahl ve sekiz köken paketleri yeniden geçti. Native Canvas portre ve WebAudio smoke kontrolleri çalıştı; öznel müzik kalitesi bununla doğrulanmış sayılmaz.

## Gerçek tarayıcı

Chromium 133.0.6943.0 + Playwright: **25 PASS, 0 FAIL, 0 pageError**. Ayrı bir tarayıcı betiğidir; bu25 kontrol 5.759'a eklenerek otomatik paket sayısı şişirilmez.

- PASS: 360x740 real pregame toggle and all four probability choices.
- PASS: 740x360 real pregame toggle and all four probability choices.
- PASS: 1280x720 real pregame toggle and all four probability choices.
- PASS: 740x360 diplomacy invite actual click, inbox ballot, actual AI membership.
- PASS: 1280x720 diplomacy invite actual click, inbox ballot, actual AI membership.
- PASS: solved federation founding path: enabled button creates real membership and charges once.
- PASS: mobile nonfounder application actual button and final inbox accept change membership.
- PASS: inbox reject actual click, duplicate prevention, expiry and reload.
- PASS: AI application presents player ballot; informational record has no decision bypass.
- PASS: founding action opens existing foundation screen with real requirements.
- PASS: real Canvas portraits and WebAudio smoke remain available.
- PASS: mobile genetic choices use shared budget, conflict and removal gates.
- PASS: mobile civic radical consumes both slots through real clicks.
- PASS: player devour actual confirmation updates resources and renders wreck without errors.
- PASS: stale destructive confirmation cannot act on restored save.
- PASS: 640x360 actual battle report X touch, reopen, save and new report.
- PASS: 740x360 actual battle report X touch, reopen, save and new report.
- PASS: portrait gameplay retains the existing rotate-to-landscape guidance.
- PASS: real Canvas habitat shapes at zoom 0.12 with labels independent.
- PASS: real Canvas habitat shapes at zoom 0.18 with labels independent.
- PASS: real Canvas habitat shapes at zoom 0.35 with labels independent.
- PASS: real Canvas habitat shapes at zoom 0.7 with labels independent.
- PASS: habitat observation and draw never expose hidden current colonization.
- PASS: existing diplomacy panel respects low and high strategic intelligence.
- PASS: 96E.1 cached shell upgrades to96F, v8 save survives and new shell loads offline.

Mobil ölçüler: dikey pregame360x740, yatay740x360 ve masaüstü1280x720; gerçek X dokunmaları640x360 ve740x360. X hedefi en az44 piksel. Gerçek Canvas z0, 12/0, 18/0, 35/0, 70 seviyelerinde kontrol edildi. PWA eski96e1cache→96f yükseltmesi, eskiSave v8'in korunması ve çevrimdışı yeni kabuk yüklemesi gerçek service worker ile geçti.

## Kampanya ve tekrar

Üç eş koşullu seed çifti11/99/404, her biri120 ay, kaynak ve yeni sürüm; 60.ay gerçek Save v8 yeniden yükleme. Aynı coğrafya/merkez kontrolü ve her ay sonlu/negatif olmayan kaynak kontrolü PASS. seed 404 yeni sürüm ikinci120 ay tekrarında kayıt SHA, RNG, aylık kayıt ve gerçek eylem izi eşitliği PASS. Bu kampanyalar ve performans yürütmesi birim testteki named-check toplamına katılmadı. Denge sonuçları AI-DENGE-96F.md'de; bütün metrikler iyileşmedi.

## Geliştirme sırasında bulunan ve çözülen başarısızlıklar

- İlk geniş kontrolde altı harita girdi/yüzey testi 36px X içeren eski CSS blok hash'ini sabitliyordu.44px incelemesi sonrası yalnız ilgili onaylı blok hash'i yenilendi; tarihsel koruma gevşetilmedi. İlk full-review sonuçları saklıdır.
- İlk tarayıcı X testi dikey oyun alanındaki mevcut döndürme katmanına takıldı. Son senaryo gerçek desteklenen yatay dokunma alanını sınar; dikey yönlendirme ayrıca PASS. Dikey oyun testi başarı diye sunulmaz.
- Yeni stratejik diplomasi yolunda eski/devlet başlangıcında olmayabilen nap alanına doğrudan erişim düzeltildi. İlk geliştirme logları korunur.
- İlk yardım testindeki combat bayrağı ve koruma testindeki güçlü düşman/merkez tehdit önkoşulları gerçek motor koşullarına uyarlandı; güvenlik kapıları kapatılarak başarı üretilmedi.
- İlk denge denemesinde gereksiz yinelenen stratejik bina öncelikleri ekonomik sıkışma yaratıyordu; ihtiyaç, kuyruk, mevcut altyapı ve sürdürülebilir maliyetle sınırlandı. Milestone sayacının aynı hedefi tekrar tekrar tamamlanmış göstermesi engellendi. Biten savaş sonucunun eksik veri bağlantısı tamamlandı ve gerçek muharebe/barış testi eklendi.

## Açık sınıflandırma

| Alan | Durum | Sınır |
|---|---|---|
| Son otomatik regresyon | PASS | 117 paket/5.759 kontrol, 0 FAIL |
| Son gerçek tarayıcı | PASS | 25 kontrol, 0 FAIL, 0 pageError |
| Gerçek native Canvas | PASS | Harita ve mevcut portre motoru; mock-only çalıştırılmadı |
| Üç 120 aylık eş koşullu çift | PASS | Simülasyon, veri bütünlüğü, ölçüm; evrensel denge başarısı değildir |
| 120 ay deterministik tekrar | PASS | seed 404 aylık/eylem/RNG/save eşitliği |
| Save v8 ve eski96E.1 kayıt | PASS | Tarayıcı yükseltme ve otomatik durum testleri |
| Android/PWA tarayıcı kabuğu | PASS | Service worker, cache yükseltme, çevrimdışı yükleme |
| Fiziksel Android performansı/dokunma | BLOCKED | Gerçek cihaz yok; browser JSON alanı NOT RUN |
| Dikey oyun içinde X dokunması | BLOCKED | Mevcut yataya döndür kilidi; yönlendirme testi geçti |
| Müziğin doğal duyulması | NOT RUN | WebAudio smoke öznel dinleme değildir |
| Büyük galaksi/çok AI/kriz açık uzun denge | NOT RUN | Üç orta galaksi ölçümünün kapsamı dışında |
| Dokuz hedefin her birinin doğal kampanyada başarıya ulaşması | NOT RUN | Her hedef bu üç seed'de oluşmadı; kontrollü kurallar ayrıca testli |

Son yürütmede kalan otomatik/tarayıcı FAIL yoktur. Ölçülmüş denge riskleri bu ifadeyle saklanmaz.

Kanıtlar: tests/audit96f/final/summary.json ve paket logları; browser/summary.json; campaigns; campaign-analysis.json; decision-chains.json; long-replay-404.json; performance.json; verification-result.json. Yeni ekran görüntüleri iç QA'da incelendi, teslim arşivine eklenmedi.
