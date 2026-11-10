# BETA-ESPIONAGE-REBELLION.0 kanıt rehberi

Tek sonuç raporu: [BETA-ESPIONAGE-REBELLION0-SONUC.md](../../BETA-ESPIONAGE-REBELLION0-SONUC.md). Kesin komutlar, PASS/FAIL/NOT RUN, maliyetler, hashler ve kapsam oradadır.

- `source-heads*.txt`, `remote-*-head.txt`, `push-*.log`: uzak kanonik ve gönderilmiş kod.
- `core-screen-release.log`:11/0; gerçek ekranların salt-okunurluğu, iki müdahale, politikaların bitişi/tekrar/AI/ownership/bozuk kayıt.
- `mp-core-release.log`:6/0; gerçek host komutları, B/C yetkisi, π ve gizli fail, sadakat/koruma DTO, özel schism aşamaları.
- `equivalence-release/compat.json`: gerçek p19 kontrolünden beş seed×üç ay ham Save8/RNG ve ay süreleri; gerçek eski paket/bütünlük.
- `sp-final/`: dört viewport, %80/%100/%125 UI scale, gerçek fare/touch, ekran görüntüleri ve5/0.
- `p0-before/`: p19 başlangıç native6/0; eski aralıklı hata kapanmış sayılmaz.
- `mp-mobile-final/`, `mp-desktop-corrected/`: birleşik üç insan native7/0. Eski P0, yeni ER0, p19 federasyon ve WC0 aynı koşuda.
- `mp-protection-release/`: son kendi koloni koruması, yeni hedef, geciktirilen GERÇEK host ACK, gerçek maliyet ve özel UI4/0.
- `cold/R/`: tüm tarayıcılar ve relay kapanıp yeni odada devam5/0. er0-cold.json politika/süre/para/owner/uyarı tekrarı/mahremiyet assertions.
- `ai-controlled-eight/campaign.json`: gerçek sekiz aylık monthTick/aiTurn ve ekonomik sonuçlar. Tek etkin normal AI kontrollü pozitif koşuldur.
- `ai-all-active-diagnostic.json`, `ai-campaign-first-fail.log`: bütün AI'lar etkin altı ayda kurtarma FAIL; kök nedenine kesin fail kimliği atfedilmez.
- `ai-controlled-six-month*`: altı ayda sayaç başlangıca eşit kaldı (FAIL); normal motorun toparlanması sekiz aya kadar izlendi. Assertion veya motor gevşetilmedi.
- `panel-before/after.log`, `mp-ui-first.log`, `mp-desktop-final.log`, `protection-before.log`, `ownership-before.log`, `core-first.log`, `mp-first.log`, `mp-vassal-first-fail.log`, `ai-comparison-first-fail.log`: ürün ve test fikstürü ayrımı raporda; ilk FAIL'ler korunur.
- `regression/results.json`:21 ana Node paketi exit0; `protection-regression/results.json`:7 ek koruma paketi exit0. `regression-final/`: son ilgili tekrarlar. `mirror-release.log`8/0.
- `release-verified.json`: ZIP SHA256/CRC32/boyut ve değişen bütün runtime/MP dosyalarının önce/sonra SHA256'sı. İki ZIP aynı; tam19runtime manifesti ZIP'tedir.
- `board-read.log`, `board-write.log`, `pr-attempt.log`: tek denemelik GraphQL Forbidden; pano/PR yazıldı olarak gösterilmez.

Büyük JSON tanıları `compressed-evidence.json` içindeki orijinal yol, SHA256 ve byte sayısı korunarak deterministik gzip yapıldı. `gzip -dc dosya.json.gz` ile orijinal baytlar okunur. Fiziksel kullanıcı kabulü, LAN/internet/Android/Render testi değildir. Önceki sürüm paketlerine ve gerçek kullanıcı kayıtlarına dokunulmadı.

## p21 devamı: continuation-3aacf7d/

Bu alt klasör p20 raporHEAD3aacf7d'den devamın kanıtıdır. İlk p20 klasörleri değiştirilmedi.

- `hud-before.log`11/1 ve `accept-border-fixed.log`3/1: gerçek yanlış risk etiketi; M5 bu koşuda geçti, M6 etiketi FAIL.
- `accept-before.log`3/1: sınır komşusu bulunmayan test fixture'ı motor tarafından doğru reddedildi; gerçek sınır koşulu kuruldu, kapı gevşetilmedi.
- `core-after.log`12/0, `mp-after.log`6/0; `accept-after/`, `accept-desktop/`4/0: gerçek120etki/−25/+10/gizli fail ve ayrı12/48,47/48 eşik kontrolü. Kontrol48 motor çağrısıdır, doğal48ay kampanya değildir.
- `ai-trace/trace.json`: gerçek doSurvey kalıntı şoku AI3/gün1007/sistem35, +520min ve−12istikrar. İkiz kontrolle altı ay serialize/RNG birebir. İlk6ay kurtarmaFAIL geçmişi silinmedi.
- `p20-compat-final/`: açıkça pinli p20 kontrolünden beş seed×üç ay6/0 ve gerçek p20 paketi/bütünlük; önceki `p20-compat.log` konsolunda eski p19 etiketi kalmıştı, JSON kontrolü p20'ydi; son koşu ikisini de doğru adlandırır.
- `sp/`5/0, `cold/R/`5/0; bütün tarayıcılar/relay kapatılıp yeni odada aynalar ve kaynaklar doğrulandı.
- `identity-before.log` ve `identity-after.log`: eski b12 test beklentisi FAIL; ikincisi ara yama uygulanmadan eski testle açılan tekrar. Kaynak ilanıyla tam eşitlik kullanan gerçek düzeltme `identity-current.log`2/0. Önceki yetki/assertion'lar korunur.
- `regression/`: ilgiliMP6/MP74/MP75/PERF2 exit0. `release-verified.json`: güncelp21 ZIP SHA/CRC, manifest SHA, p20→p21 ve tümfaz p19→p21 runtime+MP dosya hashleri.
- `remote-code-head.txt` ve `push-code.log`:257d01d uzak doğrulaması. Önceki GitHubForbidden tekrar yetki arama döngüsüne çevrilmedi.

Fiziksel kabul ve özgün aralıklı P0 hâlâ açık; ayrıntılı tek sonuç raporunun20.bölümü son komutları listeler.
