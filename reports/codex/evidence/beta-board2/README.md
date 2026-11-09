# BETA-BOARD.2 kanıt dizini

Ana rapor: [BETA-BOARD2-SONUC.md](../../BETA-BOARD2-SONUC.md). Pano ID’leri ayrı GitHub issue numarası değildir. Fiziksel cihaz/LAN/internet/Render NOT RUN. Hiçbir görev kullanıcı kabulü olmadan tamamlanmış değildir.

- source-heads.txt: p16 uzak9173b67 tabanı ve eski main. issue-read.log: gerçek GraphQL Forbidden.
- colony-before0/4: eksik ortak quote; colony-after1/3: okunurken kalıcı güç/basınç cache değişimi ve test tırnak hatası; colony-release5/0: gerçek motor üretimi, filtre, eşik ve invasionTick karşılaştırması.
- rebellion-before0/1 → rebellion-accepted1/0: aynı15eşiğini yeniden geçme ve Save8 tekrarına tek uyarı; yeni bölüm tekrar bildirilebilir.
- privacy-before0/1 → privacy-final1/0: own koloni içindeki gizli inciteBy/unrest.by kimliğini ayıklama; etkileri korunur, host Save8/RNG aynı.
- remote-cold-before1/1 → remote-accepted2/0: host quote’da soğuk türetilmiş cache’ler korunur; gerçek üretim bedeli, duplicate/foreign/red ve Save8/iptal.
- ack-before0/1 → ack-after1/0: geç ACK farklı modalı kapatamaz.
- mp75-before3/1 → mp75-after5/0: legacy bilinmeyen savaş ile yeni savaşın açık teması ayrı; eski assertion’lar korunur.
- ui-first/second/third/final/accepted: test hazırlığı ve gerçek mobil taşma ayrımı ana raporda. ui-final-ownership16/0 ve **ui-release20/0**:1/10/32 koloni, habitat, gerçek scroll, panel geçişi, açık kuşatma/engelli/uygun gezegen ayrıntıları, hedef şeridi.1920fare;800/915/960dokunmatik.
- mp-first3/1 kapalı details hedefi; mp-second4/0 yeni native üç insan kabulü. mp-final5/1 gerçek yeni koloninin federasyonu yeniden ele geçirmesi; **mp-accepted6/0** düzeltme sonrası p16+p15+board2 birlikte.
- mp-desktop-release4/0: son kaynakta gerçek masaüstü üç insan oturumu, Konsey oyu ve katılımcının native uzaktan inşa akışı.
- mp8-R4/1: aradaki7maden transferini ödeme anı yerine eski stokla kıyaslayan test; **mp8-R-final5/0**: bütün süreçler kapanır/yeni odadan inşa, kuyruk, siyasi kayıt ve kişisel karar devam eder. R/board2-cold-result.json ödeme sınırını açıkça kaydeder.
- MP74 7/0, MP75 Chromium6/0, N9/0, eski Konsey paneli3/0; browser-regressions.json ilk koruma kampanyasının exit/süreleri ve ilk FAIL’i korur.
- node-regressions.json:23 hedefli paket, hepsi exit0. Son genişletilmiş5/0 koloni,2/0 remote,1/0 privacy/ACK ve son PERF2 ayrı loglardır. MP64spy7/0 ve mirror8/0 privacy/otorite regresyonları.
- equivalence-final.log6/0 ve equivalence-final/compat.json: beş seed×üçay15ham Save8/RNG eşit; gerçek p16 paket kabulü ve bozuk bütünlük reddi. Sandbox git EPERM ayrı logda, izinli yürütme sonucu ayrıdır.
- ui-perf-final.json:30dönüşümlü kontrol+30liste string/quote ölçümü, aynı HTML/Save8/RNG. Sonuç FPS değildir; gürültü nedeniyle oyun hız kazancı yüzdesi verilmez.
- release-verification.json: nihai ZIP20üye CRC/SHA ve değişen kaynak hashleri. release-before-ownership.json yayımlanmamış ara adaydır; nihaiyle karıştırılmamalı. Eski paketler silinmedi.

Teslim: delivery-code.json / push-code.log / remote-code-heads.txt kod/test/paket push ve uzak SHA doğrulamasıdır. pr-attempt.log ve issue-comment-attempt.log tek denemelik GraphQL Forbidden hatalarını saklar; PR/pano yazımı başarılı değildir. Nihai rapor commit SHA’sı son teslimde verilir.
