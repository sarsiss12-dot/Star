# STARS PERF-SINIR.0 sonuç raporu

19 Kasım 2026 · `96h10p44 / MP.8.9b43`

## Kaynak ve değişiklik

| Rol | Dal | Doğrulanan kaynak commit’i |
|---|---|---|
| Oynanabilir kontrol p43 | `codex/stars-mp-p42-saha0` | `54a52555c699d82507f6285580577571d4200380` |
| Devralınan aday p44 | `codex/stars-perf-sinir0` | `b46e68f5199168edb00ef1930455719b9e8abd48` |
| Araştırma | `codex/stars-p43-ai-perf-arastirma` | `44c11195e31260c8e740c86689ed31a102d2e6b2` |

Devralırken GitHub’daki aday HEAD verilen commit’le eşleşti. Önceki çalışma dizinindeki runtime ve ölçüm betikleri bu commit’in ilgili dosyalarıyla bayt düzeyinde eşleşti. Araştırma dalıyla oynanabilir kontrolün runtime dosyaları da eşleşti. Bu nedenle performans kontrolü olarak p43 kullanıldı. [PR #59](https://github.com/sarsiss12-dot/Star/pull/59) · [Araştırma raporu](https://github.com/sarsiss12-dot/Star/blob/44c11195e31260c8e740c86689ed31a102d2e6b2/reports/codex/P43-AI-PERF-ARASTIRMA-SONUC.md)

500 sistemde otomatik keşif ve filo takviyesi, yıldız merkezine erişebilen kaynak yıldızların mesafe satırlarını paylaşır. Sıra, çekirdek önceliği ve eşit puanda ilk kaynak seçimi korunur. Önbellek sistem dizisine bağlıdır. Sistem kimliği, konumu, sahibi veya erişimi değişince satırlar yeniden kurulur. Sınır baskısı, düşmanlık ve görünürlük sorgu sırasında değerlendirilir. 100 sistem klasik taramayı kullanır. Devam oturumunda MP arayüzündeki sürüm etiketi ve ZIP manifest açıklaması p44 ile eşlendi. Tarihsel PERF.2 koruması için p43 ve p44 değişikliklerini tam baytlarıyla geri alan test adaptörü eklendi.

## Chromium tam ay performansı

| Save8 girişi | p50 p43 → p44 | p95 p43 → p44 | p95 düşüşü | Kabul |
|---|---:|---:|---:|---|
| 100 sistem · 3. ay | 80,30 → 74,70 ms | 112,20 → 84,60 ms | %24,60 | PASS |
| 100 sistem · 120. ay | 164,70 → 161,45 ms | 211,70 → 206,60 ms | %2,41 | PASS |
| 500 sistem · 3. ay | 549,00 → 181,70 ms | 720,20 → 202,80 ms | %71,84 | Ek erken oyun ölçümü |
| 500 sistem · 120. ay | 2.453,55 → 1.016,75 ms | 2.711,10 → 1.133,50 ms | %58,19 | PASS |
| 500 sistem · 180. ay | 4.712,30 → 3.134,35 ms | 5.230,70 → 3.740,50 ms | %28,49 | PASS |

Beş kaydın giriş SHA-256’ları, ham süreleri ve her örnekteki Save8/RNG doğrulandı. Ölçüm Chrome Headless Shell 146.0.7680.66 ile Linux’ta, AB–BA–AB–BA sırasıyla, bağlam başına iki ısınma ayından sonra yapıldı. Her sürüm için 24 tam ay örneği kullanıldı. p95, sıralı örneklerin 23’üncüsüdür. İki 500 sistem geç oyun kaydında dört eşlemenin her biri %20 eşiğini geçti. 100 sistem kabulü her kayıt için havuzlanan p50 ve p95’e uygulandı. Tekil eşlemelerde 3. ay p50’de %27,3 ve 120. ay p95’te %29,6’ya kadar yavaşlama görüldü. Aynı motorun host yolundaki eşdeğerliği H senaryosunda sınandı. Tablodaki süreler kontrollü yerel tarayıcı koşusuna aittir. [Ham zamanlamalar, kayıtlar ve profiller](evidence/perf-sinir0) · [Yeniden hesaplanan kabul değerleri](evidence/perf-sinir0/benchmark-validation.json) · [Tekrar komutları](../../research/perf-sinir0/README.md)

## Save8, RNG ve emir eşdeğerliği

| Tohum | Son ay | Eşleşen kontrol noktası | Karar/emir izi satırı | Stok değişimli kuyruk işlemi |
|---:|---:|---:|---:|---:|
| 11 | 240 | 241 | 21.925 | 6.794 |
| 99 | 240 | 241 | 26.610 | 7.870 |
| 404 | 240 | 241 | 17.242 | 5.561 |

500 sistem, 16 AI ve bir oyuncuyla üç kampanya başlangıçtan yürütüldü. Her ay kontrol ve adayın Save8 SHA-256’sı, RNG’si, oyun günü ve iz SHA-256’sı eşleşti. İz stratejik plan olaylarını, filo hareket emirlerini, anlaşma kararlarını ve bina, yıkım, gemi kuyruğu işlemlerini kapsar. Devralınan ilk 180 ayın ham dizileri yeni koşuda iki sürüm için de eşleşti. [Özet](evidence/perf-sinir0/kampanya-karsilastirma.json) · [Tohum 11](evidence/perf-sinir0/500-16-11-campaign.json.gz) · [Tohum 99](evidence/perf-sinir0/500-16-99-campaign.json.gz) · [Tohum 404](evidence/perf-sinir0/500-16-404-campaign.json.gz)

`focused.cjs` 7/7 geçti. 30→31. ayda 60 yarım günlük adım, aynı gün sahiplik devri ve geri alma, erişimin sıfırlanması, kaydet/yükle ve yeniden hesaplama iki motorda aynı Save8 baytlarını, RNG’yi ve gözlemleri verdi. Eşit puan ve çekirdek kısa devresi kaynak sırasını korudu. Devralınan ilk odaklı koşu iki ayrı VM’den dönen kurulum nesnesini de karşılaştırırken durmuştu. Tam Save8, RNG ve gözlem kontrolleri açıkça ayrı doğrulanarak bu test düzeltildi. [Odaklı karşılaştırma](evidence/perf-sinir0/focused.json) · [İlk test çıktısı](evidence/perf-sinir0/tekrar/focused-ilk.txt)

## Multiplayer ve diğer regresyonlar

| Kontrol | Durum | Sonuç |
|---|---|---|
| Chromium H · p43 ve p44 | PASS | Her sürüm 3/3. 500 sistem, 16 AI, host ve iki ayrı misafir profili. Üç ekrandaki sürüm kimliği relay ile eşleşti. |
| H · çapraz ayna karşılaştırması | PASS, son tekrar | Keşif, müttefik sensörü, rota, takviye, yeniden bağlanma ve tersane sonrası dört durum × iki misafir tam hash eşit. |
| Chromium J · p44 | PASS | 5/5. Kayıttan yeni oda, iki misafirin dönüşü, kayıp yanıt ve aynı emir kimliğiyle tekrar. |
| p43 MP paketi → p44 | PASS | Paket 4 ve Save8 v8. 12,5. gün, Save8 özeti ve RNG iki yüklemede eşit. |
| Node takviye, kart, emir güvencesi | PASS | Sırasıyla 12/12, 4/4, 13/13. |
| PERF.1 / PERF.2 | PASS | 4/4 ve 5/5. Tarihsel kaynak hash’leri, AI penceresi ve Save8/RNG kontrolleri geçti. |
| Chromium tek oyunculu takviye | FAIL / PASS | S1 iki sürümde de `reinf` dokunma merkezinde başka bir öğe buldu. S2 kayıt ve kart kontrolü iki sürümde de geçti. |
| Fiziksel Android, LAN, gerçek internet/Render | NOT RUN | Tarayıcı testleri yerel TLS vekili ve relay ile yürütüldü. |
| Tam tarihsel test matrisi | NOT RUN | Bu çalışmada hedefli paketler çalıştırıldı. |

H’de keşif, sensör ve takviye durumunda ayna gizlilik/durum kontrolleri geçti. B misafiri hattı kesilip geri geldi. Arayüzden verdiği tersane emri host kuyruğuna ve misafir ekranına bir satır ekledi, yalnız bir kez 32 alaşım düştü. Son iki sürüm karşılaştırmasında sekiz tam ayna eşleşti. Devam oturumunun ilk p44 koşusunda, host ve misafir o oturum içinde eşleşirken p43’e karşı ayna hash’leri farklı çıktı. Emir, rota ve maliyet alanları eşitti. Fark sonraki dört aday koşusunda yeniden görülmedi. İlk koşuda ayna JSON’u saklanmadığı için hangi alanın değiştiği belirlenemedi. Son koşuda ham ayna JSON’larının hash’leri ayrıca denetlendi. [p43 H](evidence/perf-sinir0/mp-p43.json) · [p44 H](evidence/perf-sinir0/mp-p44.json) · [Çapraz karşılaştırma](evidence/perf-sinir0/mp-karsilastirma.json) · [Tekrarlar ve ilk ayrışma](evidence/perf-sinir0/tekrar/mp-ayna-tekrarlari.json) · [J](evidence/perf-sinir0/mp-yeni-oda-p44.json) · [p43 kayıt uyumu](evidence/perf-sinir0/mp-p43-kayit.json)

PERF.2’nin ilk tarihsel kaynak denetimi, p43’te ve başlangıç p44’te REINF-ROUTE.0 kaynak hash’i aşamasında takıldı. Koruma adaptörü iki sürümün ilgili kaynaklarını doğrulanmış öncü baytlara geri alıyor. Son p44 koşusu tarihsel hash’ler dahil 5/5 geçti. Tek oyunculu S1 dokunma hatası p43’te aynı seçicide tekrarlandı. [PERF.2 önce ve sonra](evidence/perf-sinir0/tekrar) · [S1/S2 p43](evidence/perf-sinir0/tekrar/sp-p43.json) · [S1/S2 p44](evidence/perf-sinir0/tekrar/sp-p44.json)

## ZIP ve GitHub

| Paket kontrolü | Sonuç |
|---|---|
| ZIP | `stars-faz96h10p44.zip` · 940.491 bayt |
| SHA-256 | `2527e56f3888f8a22f16e6305aca2e9870eddf08cf8c19f4946631c15a0b7713` |
| ZIP CRC32 | `A0C9EC6C` |
| Üyeler | 20/20 üye CRC32 doğrulandı |
| Manifest | `6c92ab2f453d405500bcb4ad0012c19ee14e12ef8d6071cef437531659d9fe10` · çıkarılan 19/19 runtime dosyası eşleşti |
| Yeniden paketleme | Deterministik ZIP, iki üretimin baytları aynı |

ZIP tek oyunculu oyunun çalışma zamanı paketidir. MP relay ve istemci betikleri aday daldan sunulur. [ZIP](../../releases/stars-faz96h10p44.zip) · [Üye hash ve CRC32 listesi](../../RELEASE-PERF-SINIR0.json) · [Çıkarılmış manifest kontrolü](evidence/perf-sinir0/zip-manifest-dogrulama.txt)

GitHub teslimi `codex/stars-perf-sinir0` dalından `codex/stars-mp-p42-saha0` tabanına taslak PR olarak hazırlanır. Render’da denenecek sürüm kimliği `96h10p44 / MP.8.9b43`. Canlı saha kabulünde öncelik iki fiziksel misafirle bağlantı dönüşü ve S1 dokunma vakasıdır. [Aday dal](https://github.com/sarsiss12-dot/Star/tree/codex/stars-perf-sinir0)
