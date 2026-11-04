# Son Codex raporu

- Son faz: **MP.8.7 — Gerçek misafir güncellemesi ve çizim denetimi**.
- Rapor: [MP87-AKICILIK-SONUC.md](reports/codex/MP87-AKICILIK-SONUC.md).
- Dal: `codex/stars-mp87-frame-performance`; PR tabanı: `codex/stars-mp86-performance`.
- Doğrulanan başlangıç HEAD: `0dfb449e52bcdd6a9c1c73838f2f476ae37b2216`.
- Yeni ürün optimizasyonu **uygulanmadı**. MP.8.6 piksel önbelleği aynen korundu; yalnız opt-in performans test kancaları/kanıtlar/rapor değişti.
- Aynı120. ay Save8, seed404,45 sistem,2 insan+5 AI,4× CPU,AB/BA iki oturum/kol,36 delta/kol: deserialize medyan106,5→50,9 ms (gözlenen %52,2); ayna alımı→çizim340,7→271,6 ms (gözlenen %20,3). Host yayını dahil Node gecikmesi1114,6→1124,4 ms; genel uçtan uca/FPS kazanımı doğrulanmadı. rAF aralıkları koşular arasında örtüşür.
- Canvas timeline: duraklı misafirde DoUpdateLayers medyan141,5 ms/p95279,9 ms; native ana renderer commit yolu ağır. Fiziksel GPU/Android sonucu değildir.
- PASS: native piksel3/0, Chromium piksel3 vaka, PERF.1 4/0, PERF.2 5/0, MP75 6/0; dört120. ay ve iki228. ay ölçümünün işlev/örnek kontrolleri geçti.
- FAIL: **MP74 6/1 (B1)**; gerçek hedefe click ulaştı ve tasarım açıldı fakat tap başarısız döndü. İki performans kurulumunda `/mp/play→/` / MP1Join hatası; A1 benzeri sorun açık. Pilot test hedefi hataları/abort kayıtları raporda korunur.
- Ara host Save8 hash dizisi **FAIL / eşit değil**, aynı-kod tekrarlarında da fark var; alan kök nedeni bilinmiyor. Her adım RNG ve son host/misafir Save8/ayna eşit. Host adım-adım bayt eşdeğerliği iddia edilmez.
-228. ay seed11 arşivi ayrı, salt okunur misafir görünümüyle ölçüldü; ayrı doğal devam kopyası229'a ulaştı.240. ay **NOT RUN**; arşiv sonucu240 diye adlandırılmadı.
- Oyun96h10p5/PWA/Save8/manifest19 ve MP.8.6 aynı. Yeni ZIP/SHA-256/CRC32 paket üretimi gerekmedi. Deploy yok.
- MP8 N/R, MP73 ve tam regresyon bu fazda **NOT RUN** (ürün değişmedi). Fiziksel Android ve bütün canlı Render kontrolleri **NOT RUN**; erişim/izin denemesi yapılmadı.
- Önceki MP75 A3 FAIL'i ve bildirim gizleme kalıcılığı açık kalır.
- Doğrulanmış teslim HEAD'i ve tek PR denemesinin sonucu raporun GitHub bölümüne, nihai belge HEAD'i son sohbet yanıtına yazılır.
