# Son Codex raporu

- Son tamamlanan faz: **MP.8.3 — Multiplayer giriş kararlılığı**.
- Rapor: [MP83-GIRIS-KARARLILIGI-SONUC.md](reports/codex/MP83-GIRIS-KARARLILIGI-SONUC.md).
- Geliştirme dalı: `codex/stars-mp83-join-stability`; PR tabanı: `codex/stars-mp82-test-stability`.
- Doğrulanmış kaynak HEAD: `e000bb0c488c046b3ede9d8fab86eb00ffe8889a`.
- A1: kontrollü deney eski KATIL koordinatının 40 px odak kaydırmasından sonra GERİ bağlantısına gittiğini gerçek dokunmayla kanıtladı. Test her dokunuşta güncel hedefi ölçüyor; toplam çift/üç dokunuş korunuyor.
- Yeni MP.7.4 koşuları: taban **1/6 FAIL**; iki tanı **7/0**, **7/0**; ilk helper **6/1 FAIL** (yeni guard); son helper iki temiz koşu **7/0**, **7/0 PASS**. Kontrollü regresyon çıkış 0.
- Tarihsel B1 kök nedeni açık; kapanmış sayılmaz. Ürün kodu değişmedi; Save8/RNG, build 96h10p5 ve MP.8 korundu.
- NOT RUN: tam regresyon, PERF.1/PERF.2 tekrarları, MP.8 senaryoları, Docker, Android ve canlı Render.
- GitHub/PR teslim kaydı: faz raporunun sonunda.
