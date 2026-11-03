# STARS — Codex çalışma kuralları

- Önce `GPT-DEVIR.md` ve `CLAUDE.md` belgelerini oku; mevcut mimari ve faz kanıtlarını esas al.
- Geliştirme raporlarını ve commit açıklamalarını Türkçe yaz.
- Save8 bayt eşdeğerliğini ve RNG tüketim sırasını koru. AI/ekonomi değişikliğinde sabit kontrol köküyle ay ay eşdeğerlik doğrula.
- Host tek yetkilidir; misafir simülasyon yürütmez. Veri görünürlüğünü, ayna beyaz listesini ve güvenlik kapılarını koru.
- PERF.1/PERF.2 kazanımlarını ve okuma-yalnız AI penceresini bozma.
- Kullanıcı izni olmadan `main` dalına merge yapma; rebase/force-push uygulama.
- Önce hedefli testleri çalıştır; Chromium koşularını sırayla yürüt. Timeout artırarak veya beklenti gevşeterek PASS üretme.
- PASS / FAIL / NOT RUN durumlarını ayır; çalıştırılmamış testleri, Android veya canlı Render doğrulamasını PASS gösterme.
- Her görevin sonunda `reports/codex/<FAZ-ADI>-SONUC.md` raporunu oluştur ve `CODEX-SON-RAPOR.md` bağlantısını güncelle. Kaynak HEAD, değişiklikler, kanıtlar, testler, Save8/RNG, GitHub durumu, açık sorunlar ve sonraki adımı yaz.
- Raporları geliştirme dalına commit edip GitHub'a gönder; PR işlemlerinde görevin verdiği yetki ve tabanı kullan. Gönderim/PR başarısını doğrula; erişim yoksa raporda ve son yanıtta açıkça belirt, tamamlanmış gibi gösterme.
- Raporda doğrulanmış önceki commit'i kullan; nihai rapor commit SHA'sını son yanıtta bildir. Kendi SHA'sını eklemek için yeni commit zinciri üretme.
