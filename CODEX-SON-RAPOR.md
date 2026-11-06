# Son Codex raporu

- Faz **BETA-P0.1 — beş kritik oyun görevi**, dal `codex/stars-beta-p01-critical`; yerel hedefli düzeltmeler teslim, genel beta yayın onayı yok.
- [Sonuç raporu](reports/codex/BETA-P01-SONUC.md) · [#33 durum önerileri](reports/codex/BETA-P01-GOREV-DURUMLARI.md) · [İki cihaz kabul planı](reports/codex/BETA-P01-KABUL-PLANI.md).
- Main doğrulaması `4296ad2d43fedce6264020b3761f50f1839fd836` (MP4); çalışma başlangıcı BETA0 `d307864edbc2ab9ca4347e5d065640e150279411`. Önceki MP/UI/Save8 kazanımlarını korumak için devam dalı taban alındı. PR tabanı `codex/stars-beta0-stability`.
- Kod teslimi TESLIM_HEAD_BEKLENIYOR; nihai rapor commit SHA'sı sohbet/GitHub geçmişinde.
- #1 eski panel sahipliği kökü kanıtlandı; SP3/0 ve iki insan MP2/0, son SP tekrar3/0 PASS. #34 sabit savaş kimliği/native4/0/ayna3/0/gerçek dokunma1/0; mevcut olmayan tarihsel güç/cephe verisi üretilmedi. #3 çift oy/eski kimlik kökleri; çekirdek13/0, iki insan tek dokunma/bekleme/ACK/kopma PASS. #4 bitiş nedeni ve #21 insan ambargo sahipliği5/0+5/0 PASS.
- Yeni regresyon PASS: N9/0, dolu R0–R4+misafir UI6/0, MP75 6/0, eski Save8 sınır19/0, p6 MP paket/legacy oy3/0, MP62 13/0, MP64 news4/0, MP4 core14/0, PERF1 4/0, PERF2 5/0, MP86 cache3/0, eski savaş UI34/0.
- FAIL'ler korunur: tam MP73 4/4 (ikinci oda KATIL timeout ve bağımlı B2–B4); özel iki insan kritik koşusu2/1 (A1 mp6Conn timeout, iki hedef vaka PASS); ilk haber fikstürü ve iki tanı düzenek hatası. Bu testler kesin çözülmüş sayılmadı. Orijinal Playwright hataları yeni yardımcıyla kaydedilir.
- Oyun96h10p7 / PWA stars-v96h10p7 / MP8.9b2 / Save8v8 / paket4. Önceki p6 paket4 için dar uyumluluk; eski kayıt silinmez. Yeni opened alanı isteğe bağlıdır; tüm eski/hatalı dünya ile bayt eşitliği iddiası yok, RNG/AI strateji kodu değişmedi.
- Deterministik ZIP SHA256 `1bfa5fddbaacd0e281796f99292c6d0ddd78962f7cd3943a9b1ea79efa3a7673`, CRC32 `44c4a49f`,779126 bayt; manifest/CRC/iki üretim PASS.
- Render/fiziksel Android/gerçek LAN NOT RUN. Main/deploy/restart/rebase/force-push yok. #33 yazma Forbidden; hiçbir görev TAMAMLANDI yapılmadı. PR: TESLIM_PR_BEKLENIYOR.
