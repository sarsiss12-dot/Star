# BETA-FED-AI.0 kanıt dizini

Kaynak: p18 rapor HEAD `8f5e3886c132ee3cc45e333f8630c395854360ed`. Çalışma 9–10 Kasım 2026. Bu dizin yalnız sentetik geliştirici oyunlarını içerir; kullanıcı kaydı değildir.

- `source-heads.txt`: uzak kaynak zinciri. `github-board-read.log`: gerçek API engeli.
- `p0-before.log` + `p0-before/`: p18 kodu değiştirilmeden birleşik PC 6/1. Beklenen 900 yerine ilerleyen 918–919 günleri. Fikstürün pause sonucunu denetlememesi kesin; ilk isteğin neden pause olmadığı kesin değil.
- `p0-pause-checked.log`: WC0 geçti; BD1 kurulumunda C'nin önceki haber modalı aynayı tutuyordu. `p0-isolated.log`: bütün ilgili yollar 7/0. Bunlar ürün hız/holdBuild kurallarını gevşetmeyen test düzeltmeleridir.
- `edit-p18-before.log`: güncel pozitif fikstürle gerçek p18'de 0/5; düzenleme işlevi yok. Diğer ilk edit FAIL'leri purifiye aday fikstürü ve yeni reply alan sırası tanılarıdır; özgün hata kanıtı yerine kullanılmaz.
- `campaign-first/`, `campaign-balanced/`, `campaign-isolated/`, `campaign-full/`: ilk başarısız koşular. Tarafsız kalıntıyla muharebe, onu izleyen koruma başvurusu, kuruluş taahhüdü çakışması ve olağan üye önerisinin askerî siyasetten önce gelmesi ayrıştırıldı. Ürün yalnız kanıtlanan yeni taahhüt/siyaset bağlantısında değiştirildi; kalıntı/muharebe/filo AI motoru değiştirilmedi.
- `campaign-strict.log`: ilk sıkı askerî ölçütte 2/1. Genel filo hareketi/sivil rota yeterli kanıt değildi. Son pozitif koalisyon deneyinde anavatanın doğrudan düşman komşuluğu yerine müttefik üzerinden iki basamaklı gerçek koridor kullanıldı. Anavatan savunması ayrı negatif testte korundu.
- `campaign-military-final/`: 18 aylık gerçek aylık motorda Yağmacı kuruluş/oy/savaş ve 8 aylık bağımsız koalisyon. Yalnız silahlı filonun gerçek düşman başkentine güzergâhı/varışı sayılır.
- `coalition-final/`: AI karar, insan rızası, tek bedel, erişimsizlik, gizli savaş ve gerçek savunma önceliği. `edit-history-final.log`: bütün 12 izinli revizyonun rıza geçmişi.
- `node-final.json`: sıralı 29 paket, gerçek komutlar/exit/süreler; karşılık gelen `final-*.log`. Son dar kapsamlı ek doğrulamalar ayrıca `mp-package-final.log`, `old-save-verified.log`, `edit-history-final.log`, `coalition-final.log`, `campaign-military-final.log` içindedir.
- `mp-integrated.log`, `mp-final-pc.log`: ilk birleşik 7/1 kayıtları silinmedi. Yeni testin özel geçiş sözlüğü eksikliği ve AI'nın savaşı bilmemesi ayrıştırıldı; gizlilik kuralı kaldırılmadı.
- `mp-accepted-pc/`: son bütünleşik PC 8/0. Gerçek fare; H0/B1/C2, P0/Konsey/WC0/p17koloni/p16FIFO ile yeni kuruluş düzenleme, acil sıra ve AI→B ücretli destek.
- `cold-first.log`: test fikstürü eksik alanıyla 3/2; başarısız R1 sonrası R4 bağımlı FAIL. `cold-final/R/`: R0–R4 5/0; tüm browser ve relay süreçleri kapanır, yeni oda kurulur, şart sürümü/kuyruk/AI planı/ücret ve özel bilgiler doğrulanır.
- `sp-native/`: 1920×1080, 800×360, 915×412, 960×540; gerçek fare/dokunma ve %80/%100/%125 UI ölçekleri. Yağmacı tür seçimi ve gerçek AI rızasıyla son kuruluş.
- `mp-native-mobile/`: 3/1; `fedFoundStart` gerçek tap timeout. Host'ta kuruluş daveti oluşmuştu; sonradan ölçülen düğme ekran dışındaydı. Bu, ilk touch hedefinin neden tamamlanamadığını tek başına kanıtlamaz.
- `mp-touch-audit/`: aynı ters rollü mobil yol 4/0; pointer/touch/click, koordinat/üst eleman, DOM kimliği/mutasyon, scroll, panel/modal, rev ve komut sonuçları. Son PASS, önceki aralıklı FAIL'i çözülmüş saymaz. Eski p18 selfleet/dealSend kökü de açık.
- `equivalence-timing-final/`: gerçek p18 kaydından 5 seed × 3 ay, ham Save8/RNG ve eski paket bütünlüğü. Yeni meşru AI davranışı tetiklenen kampanyalar bu eşitliğe zorlanmaz.
- `release.json`: ZIP SHA-256/CRC32, her üyenin CRC'si, bütün runtime/MP dosyalarının başlangıç/bitiş hashleri; `package-*.json`: iki deterministik üretim.

Büyük `p0-audit-*.json` dosyaları kayıpsız `.json.gz` biçiminde saklanır. `audit-compression.json`, özgün byte sayısını ve SHA-256'yı içerir; açma örneği: `python3 -m gzip -d -c DOSYA.json.gz`. Hiçbir olay örneği/FAIL kaydı çıkarılmadı.

Fiziksel Android/PC kullanıcı kabulü, LAN, gerçek internet ve canlı Render **NOT RUN**. Tam MP8 N kampanyası bu fazda yeniden çalıştırılmadı; eski p18 sonucu yeni PASS diye sayılmaz.

`old-save-final.log` ve ilk `equivalence.log` içindeki `git EPERM`, sandbox alt süreç okuma engelidir. Aynı testler yetkili salt-okuma koşulunda/gerçek çıkarılmış kontrol köküyle yeniden çalıştırılıp geçti; bu hata oyun regresyonu sayılmaz.
