# Komutlar ve kanıt sınırları

Node24.22.1 / Chromium155.0.8059.79 / Playwright1.62.1; mevcut kurulum. Canlı Render bağlantısı, deploy/restart, yeni environment veya ağ izni değişikliği yapılmadı. Chromium koşuları birbirleriyle yarışmadan sırayla yürütüldü.

- `node tests/browser-beta-p01-panels.cjs`: STARS_OUTPUT ile panels-before /before2 (kontrol), panels-after /panels-full (aday). İlk kontrol menüde olmayan Liderler seçicisi ve erken kare ölçümü yüzünden test düzeneği FAIL; ikinci kontrol gerçek eski-key takeover FAIL. Aday SP3/0.
- `MP73_ONLY='^A1|^P01' BETA_P01_PANELS=1 ... node tests/browser-mp73.cjs`: mp-panels /mp-panels2 test düzeneği modal/ayna yolu hataları; mp-panels3 2/0 PASS. İlk iki FAIL silinmedi.
- `node tests/beta_p01_news_test.js`: news-before1/3, news-after4/0; daha sonra aynı dört vaka news-final ve news-final2. Kontrol eski aynı-çift savaş bağını üretir.
- `node tests/beta_p01_ballot_test.js`: ballot-before ilk testte bitmiş nesne null erişimi vardı; doğru referanslı kontrol ballot-control ve aday ballot-final3/0. Eksik orijinal sorun diye sunulmadı.
- `STARS_CONTROL_ROOT=/tmp/stars-beta-p01/control node tests/mp73_council_test.js`: kontrol11/2. Aynı test aday council-final13/0; kontrol runtime19 + MP0/mirror sabit d307864 kopyası, çalışma ağacına bağ değil.
- `node tests/beta_p01_war_end_test.js`: war-end-before1/4, aday war-end-after/final5/0.
- `node tests/beta_p01_embargo_test.js`: embargo-before2/2, aday after4/0; kriz koruması eklendikten sonra final5/0.
- `node tests/beta_p01_compat_test.js`: p6 paket4/Save8v8 ve eksik opened'lı oy3/0.
- `node tests/beta_p01_mirror_test.js`: kamu ekinin alan sınırı ve sabit ID/RNG3/0.
- `node tests/faz90rc_1_save_boundary_test.js`: save-boundary ve son save-boundary-final19/0.
- Node regresyon seri listesi `native-exits.json` altında. İlk sandbox spawn EPERM listesi `native-initial-exits.json`; status0 yanında spawn-error da var, bunlar PASS değildir. Gerçek koşu yetkilendirilmiş yerel yürütmede tamamlandı. Savaş UI ilk32/2 sonra war-ui-final34/0; diğer geçenler gereksiz tekrar edilmedi.
- `MP73_ONLY='^A1|^P03|^P04' BETA_P01_VOTES=1 BETA_P01_WAR=1 STARS_CHROMIUM_PATH=/usr/bin/chromium ... node tests/browser-mp73.cjs`: mp-critical2/1. A1 mp6Conn timeout; P03 oy ve P04 savaş/ambargo PASS. Gerçek host ACK'si test tarafından yalnız UI sonuç okuma indeksinde bekletildi, sahte ACK üretilmedi. Ağ gecikmesi ölçümü diye sunulmaz.
- Tam MP73, MP8 N, MP8 R ve MP75 komut/çıkışları `browser-exits.json`. R ortamı MP8_SCEN=R MP8_MONTHS=6 MP89_R_STATE=1 MP89_UI=1. KATIL timeout yüzünden tam MP73 B2–B4 ön koşuluna ulaşamadı; bunlar ürün EVET kusuru kanıtı değildir. Orijinal Playwright mesajı dosyada tutulur.
- `python3 tools/package-release.py` ve ikinci `/tmp/.../repeat.zip`: tam bayt eşit. Çıkarılmış ZIP üzerinde `tools/verify-release.py --root ...`; package.json SHA256/CRC32/MP dosya hash'lerini içerir.

Fiziksel Android, gerçek LAN/internet ve Render NOT RUN. Yeni performans yüzdesi ölçülmedi.
