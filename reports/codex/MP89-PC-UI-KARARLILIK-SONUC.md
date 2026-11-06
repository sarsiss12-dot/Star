# MP.8.9 — Beta hazırlığı: kurtarma ve kabul kaydı

**ARA KAYIT — kabul sürüyor, yayına hazır değildir.** Bu dosya önceki ortam kesintisinde kaybolmayan çalışmayı GitHub'a güvenli biçimde taşımak için oluşturuldu; son sonuçlar aynı fazda güncellenecek.

- GitHub MP.8.8 HEAD: `8ce738b42636cd792a8d552230ca8194a4da053f`; 2026-11-06 fetch/uzak dal kontrolüyle aynı. MP.8.9 ve MP.8.10 uzak dalları kontrol anında yoktu.
- Kaynak ve PR tabanı `codex/stars-mp88-stability`; kurtarılan yerel dal `codex/stars-mp89-pc-ui-stability`. Önceki yayımlanmamış runtime/test/kanıtlar korundu; yeniden yazılmadı. [Kurtarma](evidence/mp89/recovery/branches.json).
- Başlangıç HEAD yukarıdaki SHA'dır. Bu ara kayıttan önce yeni commit yoktu; nihai kod/rapor referansı final kayıtta verilecek. `main`, merge, rebase, force-push yok.
- Önceki kanıtlar yeniden kullanıldı: N9/0, MP74 7/0, MP75 6/0, MP73 8/0, PERF1 4/0, PERF2 5/0, native piksel3/0, Chromium3 piksel vakası, host hash5/0 PASS.
- R-final1/2'de R0–R4 PASS; ilkinde ek UI testi FAIL. Dolu savaş/federasyonla önceki R-populated1'in R3/R4'ü geçti, fakat ek UI sırasında ortam kaybı oldu; tamamlanmış koşu sayılmadı. Son güçlü kabul savaş/federasyon/vasallık kayıtlarıyla iki temiz R koşusudur ve çalışmaktadır.
- İlk PC ekran matrisi28/0 PASS; sonra menü tekrarı12/2 FAIL, tanılı3440/960 tekrarları ayrı ayrı2/0 PASS. İlk FAIL'ler korunur. UI Scale80–125, anlık uygulama, yerel depo ve mobil100 sınırı kurtarıldı. %125 yükseklik/CSS önceliği, açılır menü birim dönüşümü ve asenkron tercih yazma sırası düzeltmeleri kanıtlıdır. Son mobil/MP kabul henüz tamamlanmadı.
- Orijinal R3 ham kayıt `Timeout10000ms`, görünür/etkin/kararlı hedef sonrası `performing tap action`; önceki MP88 raporunun8s/kararlılık açıklaması ham kayıtla uyuşmaz. Eski menü timeout kökü kesinleşmedi. Timeout artırımı/force/JS click yok; R4 için R3 önkoşulu ve gerçek bekleyen teklif zorunlu.
- Save8v8, RNG/AI/ekonomi/savaş kararları, host otoritesi/gizlilik ve MP.8.6 önbelleği korunur. Runtime UI dışında main/sw yalnız build kimliği; MP view/relay yalnız sürüm işareti.
- Çalışma build96h10p6/PWA stars-v96h10p6/MP8.9. Eski ara ZIP son runtime ile aynı değildir; nihai deterministik ZIP/hash/manifest kabul sonunda üretilecek. Şimdiki ZIP yayın artefaktı sayılmaz.
- [Açık dört issue envanteri](BETA-ACIK-ISLER.md); [gerçek cihaz/PC manuel planı](MP89-MANUEL-BETA-PLANI.md). Issue kapatma/yorum yapılmadı; API Forbidden, özgün metin normal GitHub sayfalarından alındı.
- Render ve fiziksel Android NOT RUN. Gerçek LAN, Docker çalıştırma, Ctrl± tarayıcı zoom NOT RUN. Yeni environment/ağ ayarı/deploy/restart yapılmadı. Yeni performans kazanımı iddiası yok.
- GitHub push/PR sonucu bu ara metin yazılırken henüz doğrulanmadı; final kayıtta güncellenecek. Sonraki tek faz: BETA.0 gerçek cihaz/ağ kabulü ve aralıklı giriş tanısı; P2 özellikler dondurulur.
