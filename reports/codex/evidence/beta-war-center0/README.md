# BETA-WAR-CENTER.0 kanıt dizini

Ana sonuç ve görev durumları: [BETA-WAR-CENTER0-SONUC.md](../../BETA-WAR-CENTER0-SONUC.md).

İlk FAIL günlükleri ve sonraki PASS sonuçları ayrı tutulur. `*-first`, `*-second`, `*-third`, `*-fourth`, `*-before` ve başarısız `*-final` dosyaları silinmez. Özellikle `mp-ui-fourth.log` karşı teklif gönderimindeki aralıklı dokunma timeout'unun kesin nedeni açık kalır. Ürün hatası olarak kanıtlanan modal sahipliği, HUD ölçeği/DOM yenilemesi, atomik ekonomi/haber rollback'i ve quote gizliliği ana raporda ayrılır.

## Çalıştırma

Çalışma dizini repo köküdür. Tarayıcı koşularında `STARS_CHROMIUM_PATH=/usr/bin/chromium`; her koşuda `STARS_OUTPUT` ilgili alt klasördür. Gerçek fare/dokunma Playwright üzerinden; test fikstürleri kontrollü dünya kurar, gerçek işlemler aynı motor/host komutlarını kullanır. Fiziksel cihaz sonucu değildir.

| Komut | Kanıt |
|---|---|
| `node tests/beta_war_center0_test.cjs` | `core-release.log` |
| `node tests/beta_war_center0_prepare_test.cjs` | `prepare-release.log` |
| `node tests/beta_war_center0_mp_test.cjs` | `mp-core-release.log` |
| `node tests/beta_war_center0_ai_test.cjs` | `ai-release.log` (5/0), `ai-counter-release.log` (6/0), `ai-counter-release/ai.json` |
| `node tests/beta_war_center0_equivalence.cjs` | `equivalence-release.log`, `equivalence-release/compat.json` |
| `node tests/browser-beta-war-center0.cjs` | `sp-ui-release.log`, `sp-ui-release/` (ekran görüntüleri) |
| `WAR_CENTER0=1 MP73_ONLY='B1 \|WC0 \|sayfa' node tests/browser-mp73.cjs` | `mp-ui-accepted.log`, `mp-ui-accepted/` (800/915 yatay dokunma, üç insan) |
| `MPP0_DESKTOP=1 WAR_CENTER0=1 BOARD1=1 BOARD2=1 MPP0=1 MP73_ONLY='B1 \|B2 \|WC0 \|P0 \|BD1 \|BD2 \|sayfa' node tests/browser-mp73.cjs` | `mp-desktop-release.log`, `mp-desktop-release/` |
| `WAR_CENTER0_R=1 MPP0_R=1 BOARD2_R=1 MP8_SCEN=R MP8_MONTHS=6 node tests/browser-mp8.cjs` | `cold-r.log`, `cold-r/R/`; asıl alıcıyla güçlendirilmiş tekrar `cold-r-recipient.log`, `cold-r-recipient/R/` |
| `MP8_SCEN=N node tests/browser-mp8.cjs` | `recovery-n.log`, `recovery-n/N/` |
| `node tests/browser-mp74.cjs` | `mp74-release.log` |
| `node tests/browser-mp75.cjs` | `mp75-release.log` ilk4/2; doğru yeni ekran ID/sayaç kontrolleri `mp75-adapted.log`6/0 |
| `node tests/browser-beta-p01-panels.cjs` | `p01-panels-release.log` |
| `node tests/browser-beta-board2-colonies.cjs` | `colony-ui-release.log` |

Tarayıcı komut/çıkış/süre kaydı `browser-release.json`; ilk 23 Node regresyonunun tam komut/çıkış/süresi `node-regressions.json` ve `reg-*.log`; son değişikliklerle ilgili tekrarlar `node-release.json` ve `*-release.log`. Çalıştırılmayan veya başarısız komut için ana rapordaki gerçek durum geçerlidir.

`topbar-scale-proof.json`: aynı aday DOM'da eski/yeni tek CSS kuralıyla gerçek koordinatlar. `topbar-identity-before.json`: eski HUD güncellemesinde değişmeyen HTML'nin 30 kez yeniden node oluşturması. `wc0-touch-*.json`: pointer/touch/click, 120 kareye kadar hedef kimliği/rect/üst element ve DOM mutation sayısı.

`release-verification.json`: iki ZIP eşitliği, SHA-256, CRC32, manifest ve eski/yeni runtime/MP dosya hashleri. `github-*.log`: gerçek uzak doğrulama ve erişim hataları. Oyun ZIP'i relay/istemci kaynaklarının yerine geçmez.

Fiziksel PC/Android kullanıcı kabulü, LAN/internet, Render, yeni büyük ölçek/120 ay savaş kampanyası NOT RUN. Kullanıcı onayı verilmiş sayılmaz.

Son ek koşular: MP75 yeni merkez beklentisi, Konsey panel ve koloni UI komut/süre/çıkışları `browser-followup.json`. İlk soğuk R tekrar kabulü yanlış göndericiden yapıldığı için doğru alıcı C ile ek R kaydı ayrıca tutulur. Ek AI koşusu seviye3 izinli bilgiyle gerçek karşı teklif ve onun uygulanmasını da içerir. Bunlar ürün kapısını gevşetmez.
