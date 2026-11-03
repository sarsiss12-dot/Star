# Son Codex raporu

- Son faz: **MP.8.6 — Misafir yükleme optimizasyonu ve CPU profili**.
- Rapor: [MP86-PERFORMANS-SONUC.md](reports/codex/MP86-PERFORMANS-SONUC.md).
- Dal: `codex/stars-mp86-performance`; PR tabanı: `codex/stars-mp85-live-mobile-audit`.
- Başlangıç HEAD: `c005f82c240ab26375f5307405d11a883207a453`.
- Kabul edilen tek aday: MP misafirinde bounded, tek-girdili deterministik bulutsu ImageData önbelleği; her yüklemede yeni canvas. Host/AI/ekonomi değişmedi.
- Aynı gerçek 120. ay Save8, 4× CPU, dört AB/BA turu, kol başına48 sıcak deserialize: ortanca **167,7→61,1 ms (%63,6)**, p95 **360,1→109 ms (%69,7)**. Final Save8 SHA/RNG eşit. Uçtan uca build/FPS/host ay kazancı değildir.
- PASS: native piksel 3/0, Chromium piksel3 vaka, PERF.1 4/0, PERF.2 5/0, MP74 7/0, N9/0, kısa R5/0, MP73 8/0; MP75 kontrol ve aday tekrarları6/0.
- FAIL korunuyor: ilk MP75 5/1 (A3 AI barış teklifi; tekrarda oluşmadı), iki 240 hedefli performans koşusu0/1 (237. ay/n=0). 240 kazanımı ve FPS artışı iddia edilmez; B1 açık.
- Oyun96h10p5/Save8/manifest19 aynı; MP sürümü **MP.8.6**. Yeni game ZIP/CRC üretimi gerekmedi. Docker/allowlist mevcut dosyayı kapsıyor; deploy yapılmadı.
- Render ve fiziksel Android **NOT RUN**; hiçbir Render bağlantısı veya izin isteği yapılmadı.
- GitHub'a push edilip uzak dalda doğrulanan kod/kanıt HEAD'i: `a7ffada319ddd88ab5c62e299ca62fc61bc0fd43`. Bitiş belge commit SHA'sı son sohbet yanıtındadır.
- GitHub rapor teslimi **PASS**; tek PR denemesi API **Forbidden / BLOCKED**, PR oluşturulmadı. [Doğru tabanla karşılaştır / PR oluştur](https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp85-live-mobile-audit...codex/stars-mp86-performance?expand=1).
- [GitHub raporu](https://github.com/sarsiss12-dot/Star/blob/codex/stars-mp86-performance/reports/codex/MP86-PERFORMANS-SONUC.md).
