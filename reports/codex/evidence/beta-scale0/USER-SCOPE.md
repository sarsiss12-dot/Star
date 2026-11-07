# Kullanıcı kapsam kararı

Kullanıcı, bu çalışma sırasında sorulan açık soruya şu cevabı verdi:

> Hayır, başlangıç düzeni korunsun; yalnız sonradan kurulan/el değiştiren koloniler AÇIK olsun.

Bu nedenle yeni oyun anavatanı ve kökenin başlangıç kolonilerine toplu `initializeColonyAutomation` uygulanmaz. Önceki geçici adayın başlangıç kolonilerini ON+60 yapması geri alındı. `colony-user-choice` ve son regresyonlar bu kararı doğrular. Önceki `campaign-isolated` kayıtları ve ilk tarayıcı ölçümleri bu karar öncesindeki adaya aittir; son kullanıcı davranışı veya yeni sürüm uzun kampanya kabulü olarak kullanılmaz. Kontrol–aday optimizasyon testinde her iki kola aynı kayıt verildiği ayrıca belirtilir.

Eski Save8 kayıtlarındaki OFF/missing otomasyon değerleri zorla açılmaz. Manuel OFF kalıcıdır; yalnız gerçek yeni sahiplik yeni ON+60 varsayılanını uygular.
