# Son Codex raporu

- Son faz: **MP.8.8 — Multiplayer kararlılığı ve host kayıt tutarlılığı**.
- Rapor: [MP88-KARARLILIK-SONUC.md](reports/codex/MP88-KARARLILIK-SONUC.md).
- Dal `codex/stars-mp88-stability`; PR tabanı `codex/stars-mp87-frame-performance`.
- Doğrulanan başlangıç HEAD: `cdf58527d7fac51b97746b366f7c38f128db8e39`.
- Çözülen A1: gecikmiş input scroll görevi dokunuşta/odak kaybında iptal; input boşta merkezleme korunur. Test ilk koordinattan önce gerçek clamp edilmiş merkezlemeyi bekler.800×360/960×540 ve gerçek üçlü KATIL geçti.
- Çözülen B1 test kök nedeni: kalan KATIL dokunuşu tasarımı önceden açıyordu; eski test gizli düğmeye yeniden tap bekliyordu. Kontrollü TimeoutError ve tek-click/tek-open auditli düzeltme doğrulandı. Ürün ghost-touch koruması değiştirilmedi.
- P0: aynı-kod5. adım farkı yalnız8 `_powAt/_pressAt` cache damgası. Ham RNG/ayna aynı. Aynı UI fazında tam Save8; temiz MP başlangıcında her adım tam bayt/RNG/gerçek ayna akışı eşit. Host native5/0; serializer/Save8 alanları değiştirilmedi. Eski MP oturumuna yalnız Save8 yükleyen ek Chromium deneyi kişisel logda FAIL verdi; doğru temiz-oturum kontrolüyle ayrıca ayrıştırıldı.
- PASS: MP74 son7/0, MP75 tanılı6/0, MP73 8/0, PERF.1 4/0, PERF.2 5/0, native piksel3/0, Chromium piksel3 vaka, N7 hedefli2/0.
- **Açık kritik: MP8 R son3/2 FAIL.** R3 yeni host ana menü #mp1Btn tap zaman aşımı; kayıt yüklemeye ulaşılmadı. R4 test kurulumu eksikliğiyle FAIL. MP devam doğrulanmış değildir.
- Diğer ilk FAIL'ler korunur: MP75 5/1 (#mp6Conn dock tap, A3 PASS), tam N8/1 (N7 relay başlangıç); tekrarda geçmeleri kesin çözüm sayılmadı. İlk R ajan tarafından kesildi ve ABORTED kabul edildi.
- Oyun96h10p5/PWA/manifest19/Save8v8 aynı; MP **8.8**, protokol1/paket4 aynı. Yeni oyun ZIP/SHA-256/CRC32 yayını gerekmedi. Deploy yapılmadı.
- Fiziksel Android, canlı Render,120/240 uzun kampanya, yeni performans ve tam genel regresyon **NOT RUN**. Render erişimi/izin/environment işlemi yapılmadı. Main merge/rebase/force-push yok.
- Doğrulanmış GitHub teslim HEAD'i ve tek PR denemesinin sonucu raporun teslim bölümüne; nihai belge HEAD'i son sohbet yanıtına yazılır.
