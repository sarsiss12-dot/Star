# Son Codex raporu

- Son faz: **MP.8.5 — Canlı/mobil denetim**.
- Rapor: [MP85-CANLI-MOBIL-DENETIM-SONUC.md](reports/codex/MP85-CANLI-MOBIL-DENETIM-SONUC.md).
- [İki Android telefonla test planı](reports/codex/MP85-ANDROID-TEST-PLANI.md).
- Dal: `codex/stars-mp85-live-mobile-audit`; taban: `codex/stars-mp84-notice-persistence`.
- Başlangıç HEAD: `3a2a82a20271e6b8141dc965fb08b329bbfb1921`.
- Canlı Render health/version: proxy tünelinde 403, **BLOCKED**; servis kapalı olduğu iddia edilmez. Canlı WSS/oda/sürüm eşleşmesi NOT RUN. Deploy/restart/ayar değişmedi.
- MOBİL CHROMIUM: MP.7.4 7/0; son seed-doğrulamalı N 9/0, kısa R 5/0; MP.6.1 ilk 3 test 3/0; MP.6.3 A alt kümesi 9/0 PASS. Arka plan girdisi sentetik visibilitychange'dir. Android NOT RUN.
- Kanıtlanan test kusurları: host tasarımı CFG'deki rastgele seed ile yapılandırmayı eziyordu; hedef aya ulaşmadan sıfır örnek PASS olabiliyordu. Test fikstürleri düzeltildi; ilk FAIL ve geçersiz-seed ölçümleri raporda saklandı.
- Doğrulanmış seed404/45 sistem/2 insan+5 AI, 120/240 ay: 1× host med/p95 61,5/70,5 ve 105,9/165,1 ms; 4× 349,4/359,3 ve 590,9/687,1 ms. 4× guest rAF/s 14,7/11,9; fiziksel FPS değildir. Eski seed etiketli Chromium karşılaştırmaları yeniden doğrulanmalı.
- Ürün/Save8/RNG/PERF algoritmaları değişmedi; build96h10p5/MP.8, manifest19 eşleşti; yeni ZIP yok.
- Açık: Render erişimi/sürüm uyumu, fiziksel Android, düşük CPU tepkiselliği; B1 kök nedeni belirsiz, gizleme kalıcılığı uygulanmadı.
- GitHub/PR teslim kaydı ana raporun sonunda.

- GitHub teslimi: `869f5ebeb169fa02bab4d85588e1b41ddc32d4d1` test/rapor commit’i push edildi ve uzak HEAD doğrulandı. PR GraphQL Forbidden nedeniyle oluşturulamadı; [doğru tabanla oluşturma ekranı](https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp84-notice-persistence...codex/stars-mp85-live-mobile-audit?expand=1).
