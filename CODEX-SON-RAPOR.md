# Son Codex raporu

- Faz: **BETA-SCALE.0 — #37 yerel kabul PASS; #45 kısmî hedef.** Kullanıcı/yayın onayı yok.
- [Ana rapor](reports/codex/BETA-SCALE0-SONUC.md) · [Kanıtlar](reports/codex/evidence/beta-scale0/README.md).
- Dal: `codex/stars-beta-scale0-galaxy-ai-colonies`; taban `codex/stars-beta-setup1-galaxy-options` @ `66ea8d700bc66b1fdb5f75d3a0f5d8f87251e9a8`.
- Doğrulanmış kod/test/paket uzak HEAD: `fcb14ddd20f1ca41691487518c8f196b9e8e804c`. Nihai rapor commit SHA'sı son mesajda ve uzak dal HEAD'indedir.
- **Yeni oyun: 30–500 sistem / 1–16 AI.** 1000 sistem ve 24/32/48 AI uzun kabulü geçmedi, pasif. 64 AI kimlik sınırına sığmaz. Son motorla 500/16 SP 120 ay ve iki bağımsız 120→121 Save8/RNG devamı PASS.
- Kullanıcı kararıyla başlangıç kolonileri korunur. Sonradan kurulan/el değiştiren koloniler ON + 60 gün; manuel OFF ve eski kayıtlar korunur, odak bonusu değişmez. Koloni 12/0, renk 8/0, üretim/legacy 142/0.
- Yerel 3 insan + 16 AI / 500 sistem R0–R4 **5/0**; MP8 N 9/0, MP74 7/0, MP75 6/0, MP73 yalnız A1 1/0. PERF.1 4/0, PERF.2 son 5/0, piksel 3/0. İlk FAIL kayıtları korunur.
- 500/16 tam ay standart medyanı **2.533,7 ms**, p95 **3.555,6 ms** (n=120). 120. ay duraklatılmış rAF≈24,8/s, fiziksel FPS değildir. İkmal düğümü çağrısı ≈%80,9 azaldı; süre oynaklığı nedeniyle kararlı genel hızlanma yüzdesi yok. Erken görünürlük atlaması Save8 farkı nedeniyle geri alındı. [Standart istatistik özeti](reports/codex/evidence/beta-scale0/PERFORMANCE-SUMMARY.json).
- Oyun **96h10p12**, PWA **stars-v96h10p12**, MP **MP.8.9b7**; Save8 v8 / paket4 / protokol1. [ZIP/hash](reports/codex/evidence/beta-scale0/RELEASE-VERIFIED.json): SHA256 `09f8a58c16380d0eae0a187dcd9b259597fb4b5d5b750296b427446cfe35a365`, CRC32 `E1ABA448`, 787.216 bayt.
- PR bir deneme **Forbidden**. [Karşılaştırma](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-setup1-galaxy-options...codex/stars-beta-scale0-galaxy-ai-colonies?expand=1). #33 başlangıç/sonuç yorumları da Forbidden; son kamu okumasında #37/#45 PROMPT HAZIR. Diğer 43 göreve ve TAMAMLANDI durumuna dokunulmadı.
- **NOT RUN:** fiziksel Android/PC kabulü, gerçek LAN/internet/Render ve deploy. Main merge/rebase/force-push yapılmadı.
- Sonraki tek faz: **BETA-SCALE.1 — geç oyun keşif/ikmal/sınır performansı**, aynı Save8/RNG ve 240 ay kabulü. Yüksek AI/1000 henüz açılmamalı. #25/#24/#10 ve tarihsel B1/A3 ayrı açık.
