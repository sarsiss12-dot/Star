# STARS — PWA Sürüm Uyumu Developer Report

18 Kasım 2026

**p42, eski misafiri oda dışında uyarıyor ve güncellenen istemci aynı kayıtla oyuna dönüyor.** Yerel HTTP ve WebSocket akışında güncellemeden sonraki ilk korvet emri host tarafından kabul edildi. Kuyruğa tek kayıt eklendi, misafir tersanesinde tek yeni satır göründü ve 32 alaşım bir kez kesildi.

## Kaynak ve teslim

| Alan | Değer |
|---|---|
| Taban | PR #57 · `codex/stars-mp-emir-guvence0` |
| Başlangıç HEAD | `12d54bc1e7a3a04f41b0fb045730ff0d95396490` |
| Başlangıç sürümü | `96h10p41 / MP.8.9b40` |
| Ürün HEAD | `a4a77e57c8ecf873d3b2a7abe0501c43ae03348b` |
| Geliştirme ve Render test dalı | `codex/stars-mp-pwa-surum0` |
| Taslak PR | #58 · Taban `codex/stars-mp-emir-guvence0` |
| Yeni sürüm | `96h10p42 / MP.8.9b41` |
| PWA önbelleği | `stars-v96h10p42` |

PR #57’nin HEAD’i istenen commit ile eşleşti. p40 kontrolünün oyun dosyaları doğrulanmış p40 ZIP’inden alındı. p40 MP dosyaları PR #57’deki birebir geri dönüş pinleriyle p40 kaynaklarına döndürüldü. p41 kontrolü başlangıç HEAD’indeki dosyalarla sabitlendi. Nihai raporu taşıyan GitHub HEAD’i teslim yanıtında yer alır.

[PR #58](https://github.com/sarsiss12-dot/Star/pull/58) · [Ürün commit’i](https://github.com/sarsiss12-dot/Star/commit/a4a77e57c8ecf873d3b2a7abe0501c43ae03348b) · [PR #57 raporu](https://github.com/sarsiss12-dot/Star/blob/12d54bc1e7a3a04f41b0fb045730ff0d95396490/reports/codex/MP-EMIR-GUVENCE0-SONUC.md)

## Önce ve sonra

p40 kontrolünde service worker kodu gerçek HTTP yanıtlarıyla önbelleğe alındı. Çevrimdışı okuma eski ana betiği ve daha önce açılan katılım sayfasını döndürdü. p40 host ve misafir kodu çalıştırılarak tersane arayüzünden bir sipariş verildi. Host, misafir hesabının önceki sıra numarası ve siparişi içeren p40 kaydı oluşturdu.

| Senaryo | Bağlantı ve devlet | Host sonucu ve kaynak | Host kuyruğu / misafir tersanesi |
|---|---|---|---|
| p41 host, p40 istemci | Yeni odaya alındı, aynı devlet | İlk emir `command-unconfirmed`, 0 kesinti | 1 / 1 |
| p41 host, temiz p41 istemci | Yeni odaya alındı, aynı devlet | İlk emir kabul, 32 alaşım | 1→2 / 1→2 |
| p41 ana motoru ve eski p40 `join.js` | p41 etiketiyle odaya alındı, aynı devlet | İlk emir `command-unconfirmed`, 0 kesinti | 1 / 1 |
| p42 host, tamamen eski p40 sayfası | Uyarı görüntülendi, oda koltuğu açılmadı | Host’a 0 istemci iletisi | Önceki sipariş korundu |
| p42 sayfası, bir eski `main.js` yanıtı | Gerçek dosya özeti uyuşmadı. Yükleme hatası yoluyla uyarı görünür. Soket açılmadı | Host’a emir yok | Önceki sipariş korundu |
| Aynı profil güncellendi | Aynı davet, kayıt, oyuncu kimliği ve devlet | İlk yeni emir kabul, 32 alaşım bir kez | 1→2 / 1→2 |
| Temiz p42 ile yeniden bağlanma | Aynı oda ve devlet | 0 otomatik gemi emri | 2 / 2 |
| p41 host’ta üretilen kayıt, temiz p42 istemci | Kayıt p42 host’ta açıldı, aynı devlet | İlk yeni emir kabul, 32 alaşım bir kez | 2→3 / 2→3 |

p41’de sorun iki katmanda ortaya çıktı. Relay katılım için istemci içerik kimliğini kontrol etmiyordu. Misafir HTML’i de betik dosyalarının içeriğini doğrulamıyordu. Eski p40 istemci aynı devlete girebiliyor, ancak p41’in kayıtlı emir koruması önceki geçmişi belirsiz eski kimlikle gelen emri artık reddediyordu. Tek eski `join.js` bile p41 ana motor etiketi gösterilirken sorunu yeniden üretti.

## Uygulama

- Relay, oyun ve MP dosyalarının içerik kimliğini `/mp/version` yanıtında yayımlıyor. Misafir sayfasındaki **25 haricî betik** bu kimliği URL’de taşır ve her birinin SHA-256 özeti HTML’de doğrulanır. Yükleme hatası, oyun arayüzü kurulmadan güncelleme ekranını açar. Ekranın konumu oyun CSS dosyasına bağlı değildir.
- Relay, içeriği eski olan veya içerik kimliği göndermeyen misafiri oda listesine eklemeden durdurur. Güncel uyarı yolunda `update-required` ve kapanış kodu 4010 kullanılır. Eski p40 kodu mevcut lobi başlığından “Oyun sürümü eski” uyarısını ve oda kodunu görür. Tamamen eski sayfada oyuncu sayfayı yeniler veya daveti yeniden açar. Güncel katılım sayfasında **Güncelle ve yeniden katıl** düğmesi vardır.
- Güncelleme düğmesi yeni bir ağ isteğiyle relay’e erişimi sınar. Bağlantı kesilirse tekrar deneme açıklaması gösterilir. Başarılı istekte mevcut davet parametreleri ve sayfa işareti korunarak yeni sayfa açılır. Kayıtla ilişkili oyuncu verileri ve oda bilgileri depolamada kalır. Dönüşte kimliği mevcut host doğrular.
- Eski sayfanın belleğindeki bekleyen emir yeni sayfaya taşınmaz. Uyuşmayan istemciden host’a emir iletilmez. Güncellemeden sonra ilk kullanıcı dokunuşundan önce otomatik gemi emri çıkmadı. PR #57’nin sıra bağlı kimliği ve tek kesinti koruması regresyonda geçti.
- Yeni service worker, MP yollarını ve MP içerik kimliği taşıyan betikleri ağdan yükletir. Çevrimdışı tek oyunculu oyun güncel oyun önbelleğinden yüklenebilir. Eksik betik isteğine HTML dönülmez.

## Doğrulama ortamı ve sonuçlar

| Test | Sonuç |
|---|---|
| PWA sürüm ve yeniden katılım paketi | **11 PASS** · gerçek localhost relay, WebSocket, host motoru ve misafir kaynakları |
| HTTP içerik doğrulaması | **PASS** · 25 sunulan betiğin SHA-256 özeti HTML ile eşleşti, koruma betiğinin CSP özeti doğrulandı |
| Önceki hedefli testler | **86 PASS / 0 FAIL** · PR #57 A1–A3, yerel tersane, MP4 kayıt, relay ve kapasite, p40 sensörlü takviye ve kayıp hedef kartları |
| Save8/RNG eşdeğerliği | **3 PASS** · p41 kontrolü, 11/22/404 tohumları, 48 ay, her tohumda sekiz nokta |
| p41 kaynak pinleri | **6 dosya** birebir p41 baytlarına geri döndü |
| MP paketi geriye uyumu | Gerçek p40 ve p41 paketleri p42’de açıldı. Yeni p42 paketi p40/p41’de açık sürüm uyarısı aldı |
| p33 kayıt deneyi, tam regresyon matrisi ve gerçek Docker çalıştırması | **NOT RUN** |
| Chromium J3/J4 ve tarayıcının gerçek SRI/CacheStorage akışı | **NOT RUN** · p41 ve p42 süreç açılışında `process_singleton_posix / socket() EPERM` |
| Fiziksel Android, LAN ve canlı Render | **NOT RUN** |

VM testinde tarayıcıya özgü CacheStorage, SRI yükleme hatası, DOM ve sayfa yenileme olayları modellendi. Relay istekleri, WebSocket akışı, kayıt ve kaynak kesintisi gerçek kodla çalıştı. Misafir sonucu, tersane HTML’indeki sipariş satırından ölçüldü. **Fiziksel Android’de uzun oturum donması ve kayıttan dönüşte kaybolan olaylar saha testine kadar açık.**

[Ham kanıtlar](https://github.com/sarsiss12-dot/Star/tree/codex/stars-mp-pwa-surum0/reports/codex/evidence/mp-pwa-surum0)

## ZIP ve dağıtım kimliği

| Alan | Değer |
|---|---|
| ZIP | `releases/stars-faz96h10p42.zip` · 940.162 bayt |
| SHA-256 | `a708a106f1ff37d904fa873225f36cb81ca868f46d0248d963fe6c3f78728d89` |
| CRC32 | `24D6C7FC` |
| Manifest | 20 ZIP üyesi, 19 runtime dosyası · üye CRC ve çıkarılmış dosya doğrulaması geçti |
| `main.js` SHA-256 | `7262237b5d9c90b0e6a3e29aaa2eff13c5dff1a53843c990306f65815e2d625e` |
| Manifest SHA-256 | `30752f1e4eb31372bf7ebf39f362192fdee1f1de7133401d724edb19799af6a1` |

Render test dalı **`codex/stars-mp-pwa-surum0`**. Dağıtım yapıldığında `/mp/version` yanıtında şu alanlar beklenir. Yerel relay bunları döndürdü.

```json
{
  "build": "96h10p42",
  "mp": "MP.8.9b41",
  "runtime": "30752f1e4eb3",
  "release": "47f43b78c5de2d126f13625ff226c3b069718c8f317a96fd40b08f4d7ca74d96",
  "files": {
    "main.js": "7262237b5d9c",
    "join.js": "afb2e1aaee8a",
    "relay.js": "4338c2d835f6"
  }
}
```

Tam yerel yanıt `version.json` dosyasında. Render’a dağıtım yapılmadı. Oyun ZIP’i 19 runtime dosyasını, Render dalı MP istemci ve relay değişikliklerini de içerir.

[Oyun ZIP’i](https://github.com/sarsiss12-dot/Star/raw/refs/heads/codex/stars-mp-pwa-surum0/releases/stars-faz96h10p42.zip)
