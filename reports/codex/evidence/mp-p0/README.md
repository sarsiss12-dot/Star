# MP-P0 kanıt dizini

Ana belge: [MP-P0-KURTARMA-SONUC.md](../../MP-P0-KURTARMA-SONUC.md). Komut, ortam, PASS/FAIL/NOT RUN, kapsam ve sınırlamalar bu tek raporda sıralıdır. Bu dizin tamamen kontrollü sentetik yerel test dünyalarıdır; kullanıcı PC kaydı içermez.

- `source-branches.txt`, `source-remote-heads-code.txt`: kaynak ve doğrulanmış uzak kod SHA.
- `before-valid.log`, `motion-before.log`, `boot-before.log`, `cold-notice-before.log`, `layout-before/`: korunmuş önce FAIL kanıtları.
- `node-accepted.json`: son aday kontrollerinin doğru log eşlemesi. `node-final.json` yanlış CONTROL_ROOT ile iki p14 koşusu dahil ham kayıt; silinmedi.
- `verified-*`, `final-*`, `reg-*`, `mp6-accepted.log`: hedefli/koruma Node kanıtları. `mp75-war-control.log`: aynı MP75 FAIL’in değişmemiş p14 kontrolü.
- `mp73-stable/`, `desktop-stable/`: üç insanlı, fare ve dokunma, dört rol Canvas rota, B/C ödül/gizlilik ve30rAF örnekleri; komutlar ana raporda.
- `mp74-stable.log`, `mp75-stable.log`, `mp8-N.log`: önceki MP kapsamı.
- `mp8-R-complete/` ve `.log`: son kaynakta gerçek kayıt, bütün süreçlerin kapanışı, yeni oda, kişisel olay/kuruluş, gerçek sayfa yenileme ve6+6ay;5/0.
- `sp-ui-final/`, `.log`: son kaynakta dört viewport24/0; `layout-after/` gerçek hedef alanı ve screenshot.
- İlk browser/SP/R FAIL log ve ekran görüntüleri korunur; son PASS eski sonuçları değiştirmez. `browser-final.json` bir ara batch’in ham sonuçlarıdır, nihai kabul özeti değildir.
- `RELEASE-VERIFIED.json`, `zip-members.json`, `runtime-sha256.json`, `package-extracted-verify.log`: iki deterministik ZIP, üyeCRC/SHA ve manifest kontrolü.
- `issue-*.log`, `pr-create.log` ve gönderilen `*-body.md`: GitHub API Forbidden gerçek çıktıları; pano/PR yazılmış denemez.

Fiziksel PC/Android/LAN/internet/Render NOT RUN. Kullanıcı onayı olmadan TAMAMLANDI/merge/deploy yok.
