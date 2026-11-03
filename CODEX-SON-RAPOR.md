# Son Codex raporu

- Son faz: **MP.8.4 — Bildirim/kayıt kimliği güvenlik analizi**. **Gizleme kalıcılığı uygulanmadı; ana kabul kriteri karşılanmadı.**
- Rapor: [MP84-BILDIRIM-KALICILIGI-SONUC.md](reports/codex/MP84-BILDIRIM-KALICILIGI-SONUC.md).
- Dal: `codex/stars-mp84-notice-persistence`; PR tabanı: `codex/stars-mp83-join-stability`.
- Doğrulanmış başlangıç HEAD: `3017fbe7e38d6261f3f7f4683e3fcafa66299294`.
- Kanıt: farklı kayıtlar aynı olay kimliğini taşıyabilir; checkpoint sonrası UID/key/born yeniden kullanılabilir. Ham SP Save8'de soy kimliği yok. Riskli otomatik yerel eşleştirme eklenmedi; yeni kayıt-zarfı/sidecar sözleşmesi önerildi.
- PASS: kimlik denetimi 5/0; PERF.2 5/0; Chromium MP.7.4 7/0, MP.7.5 6/0, MP.8 N 9/0, MP.8 R (6+6 ay) 5/0; Node MP.7.4 6/0, MP.7.5 4/0.
- B1 yeniden üretilemedi, açık. A1 test düzeltmesi korundu.
- Ürün/Save8/RNG değişmedi; build 96h10p5, MP.8. Yeni ZIP yok.
- NOT RUN: uygulanmamış kalıcılık kabul senaryoları ve storage hata testleri, tam regresyon/uzun kampanyalar, Docker, fiziksel Android, canlı Render.
- GitHub/PR teslim kaydı faz raporunun sonunda.

- GitHub teslimi: `d7fb2a5da40d20654fdc092e0a9043fa492ef80a` rapor/test commit’i push edildi; uzak HEAD doğrulandı. PR iki denemede GraphQL Forbidden nedeniyle oluşturulamadı. [PR oluşturma ekranı](https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp83-join-stability...codex/stars-mp84-notice-persistence?expand=1).
