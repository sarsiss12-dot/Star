# Son Codex raporu

- Son faz: **MP.8.9 — Beta hazırlığı, kayıt/devam ve PC UI Scale**. Yerel kabul PASS; **beta yayın onayı yok**.
- [Ana rapor](reports/codex/MP89-PC-UI-KARARLILIK-SONUC.md) · [Açık işler](reports/codex/BETA-ACIK-ISLER.md) · [Manuel PC/Android planı](reports/codex/MP89-MANUEL-BETA-PLANI.md).
- Dal `codex/stars-mp89-pc-ui-stability`; PR tabanı `codex/stars-mp88-stability`.
- Doğrulanan başlangıç HEAD `8ce738b42636cd792a8d552230ca8194a4da053f`; kurtarma teslimi `5210281c46afc3b38048ead53a7399625e340b35` GitHub'da doğrulandı. Son rapor commit'i kendi SHA'sını önceden içermez; nihai HEAD sohbet tesliminde ve dosya tarihinde.
- MP89/MP810 uzak dalları başlangıçta yoktu; MP89 yayımlanmamış kod/kanıtları kurtarıldı. MP810 tamamlandı sayılmadı.
- **PASS:** iki temiz dolu savaş/federasyon/vasallık R0–R4; ilkinde ek misafir UI dahil6/0, ikinci5/0. SP/MP ölçek ve yalıtım; depo3/0; son mobil paneller2/0+2/0,1280 %125 panel1/0. N9/0, MP74 7/0, MP75 6/0, MP73 8/0, PERF1 4/0, PERF2 5/0, native piksel3/0, Chromium3 vaka ve host hash5/0 kanıtları korundu.
- **FAIL geçmişi korunur:** eski R menü timeout, Chromium açılış3/2, ilk misafir animasyon ölçümü, menü tekrarında12/2 ve ilk depo/fikstür hataları. Yeni PASS bunların kesin kök nedeninin kapandığı anlamına gelmez.
- Açık beta kapıları: aralıklı giriş/otomasyon kökü; gerçek cihaz/LAN/online kabulü; manuel Ctrl± ve ayrı MP dok kapsamı. Fiziksel Android/Render NOT RUN. Yeni environment/izin/deploy/restart yok.
- #5 ve #8 AÇIK/P2; #6 ve #7 KISMEN. Issue kapatılmadı. Sonraki tek faz BETA.0 kabul/tanı; yeni mekanik/AI sistemi yok.
- Build96h10p6 / PWA stars-v96h10p6 / MP8.9; Save8v8 aynı. Nihai ZIP776457 bayt, SHA256 `9f0bf5f11913c277ca23274c7a84544fd15ecee3edffd3e8ab56ca149ff814f9`, CRC32 `ee942090`; iki üretim tam aynı, manifest/CRC/SHA PASS. Eski ara ZIP hash'i yayın kimliği değildir.
- PR bir kez denendi: API **Forbidden**, oluşturulmadı. [Karşılaştır/PR oluştur](https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp88-stability...codex/stars-mp89-pc-ui-stability?expand=1). Main/merge/rebase/force-push yok.
