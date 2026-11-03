# STARS MP.8.4 — Bildirim kalıcılığı ve kayıt güvenliği

## Sonuç / kabul durumu

**Bildirim gizleme kalıcılığı uygulanmadı; ana kabul kriteri karşılanmadı.** Bu bir ürün özelliği teslimi değildir. Mevcut kimliklerle kayıt/oyuncu/fork yalıtımını kanıtlayan küçük bir otomatik çözüm kurulamadı. Kullanıcının “şartlar karşılanamıyorsa riskli değişikliği uygulama” kuralı uyarınca üretim kodu korundu; kanıtlı teknik analiz, hedefli testler ve güvenli alternatif planı teslim edildi.

Bu sonuç, Save8 dışında güvenli depolamanın genel olarak imkânsız olduğu iddiası değildir. Güvenli çözüm için mevcut ham Save8'den ayrı bir kimlik ve import/export/fork sözleşmesi gerekir. Tam metin: [tasarım kararı](evidence/mp84/TASARIM-KARARI.md).

## Kaynak

- Başlangıç HEAD: `3017fbe7e38d6261f3f7f4683e3fcafa66299294`.
- GitHub'dan fetch edilen `codex/stars-mp83-join-stability` ile eşleşti; başlangıç ağacı temizdi.
- Geliştirme dalı: `codex/stars-mp84-notice-persistence`.
- PR tabanı: `codex/stars-mp83-join-stability`.
- Bitiş için doğrulanmış önceki commit referansı teslim kaydına eklenir; son rapor commit SHA'sı sohbet tesliminde verilir. `main`, merge/rebase/force-push kullanılmadı.

`AGENTS.md`, `GPT-DEVIR.md`, `CLAUDE.md`, son rapor, MP.8.2/MP.8.3 raporları ve MP.8.1 tanısı esas alındı. Önceki araştırmalar yeniden yapılmadı.

## Teknik kök neden ve yaşam döngüsü

`UI.notify` dünya içindeki `G.inboxUid` sayacını artırır. `UI.noteSwipe` diplomatik kaydı doğrulayıp kartı kuyruktan kaldırır; diğer karar olayında `hidden=true` kullanır ve olay ☰ listesinden erişilebilir kalır. Bu alan **main.js NOTE_FIELDS** içinde yoktur. `encodeNote/decodeNote` alanları seçtiği için Save8'e gizleme tercihi girmez. Yüklemede kart yeniden görünür; kararın kaybolmaması mevcut güvenli yöndür.

Gerçek runtime denetimleri şu riskleri gösterdi:

1. Aynı seed, uid, key, born ve kanonik olay payload'u taşıyan iki kayıt, kaynak stokları bakımından farklı olabilir. Bu nedenle olay fingerprint'i kayıt kimliği olamaz.
2. Aynı checkpoint'ten yeni olay üretmek UID/key/born yeniden kullanımına izin verir; yeni olay payload'u farklı olabilir.
3. SP ham Save8'de ayrı `saveId/lineageId` yok. Yerel `yildiz:save` anahtarı kayıt kimliği değildir; üzerine başka dünya yazılır.
4. MP'de paket `saveId` ve oturumun gerçek aktör eşlemesi vardır; devamda yeni oda kodu oluşur. Token'ı veya oda kodunu tercih anahtarı yapmak yanlıştır.
5. Misafir `StarsMirror.build` çıktısı global `events` kuyruğunu taşımaz. Yerel oyuncu 0'a yeniden numaralanır. Bazı kartlar `inboxOffers` ile yeniden üretilir; yalnız UID veya yerel oyuncu 0'ı kullanmak güvenli eşleştirme sağlamaz.
6. Mevcut misafir `S.swiped` Set'i oturum belleğindedir; imzası çoğunlukla olay key'idir. Aynısını kalıcı depoya kopyalamak yeni olay/kayıt izolasyonunu kanıtlamaz. Konsey key+target anahtarı yeni oylamalarda tekrar kullanılabilir; bu fazda doğal yanlış gizleme olarak yeniden üretilmedi.

## Mimari kararı ve reddedilen kestirmeler

Tercih edilen gelecek çözüm: Save8 dışı sürümlü kayıt zarfı/sidecar; SP soy kimliği, MP saveId + gerçek oyuncu/aktör kapsamı ve olay occurrence kimliği. Bilinmeyen eski dosya, bozuk sidecar veya eşleşmeyen kayıt **görünür kartla** açılmalı. Depo hiçbir kararı vermemeli/silmemeli; yalnız sunumu değiştirmeli. Oyun RNG'si kullanılmamalı.

Bu fazda reddedilenler:

- UID/başlık/key/seed tabanlı global localStorage: kayıt ve olay çakışması.
- Tam kayıt hash'ini tek soy kimliği yapmak: ilerleyen kayıtta değişir; bayt-identik kopyanın bağımsız fork olup olmadığını belirlemez. Bu bir SHA-256 çarpışması sorunu değildir.
- MP oda kodu/token/yerel oyuncu 0: yeniden bağlanma/devam veya aktör değişiminde kararsız/yanlış kapsam.
- Mevcut `S.swiped` Set'ini doğrudan kalıcılaştırmak: occurrence ve kayıt yalıtımı kurulmamış.
- Save8 `NOTE_FIELDS`'e `hidden` eklemek: byte eşdeğerliğini değiştirir; bu fazda otomatik uygulanmadı. Ayrı faz seçeneğidir.

LocalStorage/IndexedDB mekanizmasının kendisi engel değildir. Eksik olan güvenilir kimlik ve onun kayıt yükleme/fork yaşam döngüsüdür. Depolama hatası/temizliği için önerilen güvenli varsayılanlar tasarım belgesinde; uygulanmış ve doğrulanmış özellik olarak gösterilmez.

## Değişiklikler

- `tests/mp84_notice_identity_test.js`: 5 gerçek runtime güvenlik/kimlik denetimi eklendi. Testler mevcut eksikliği ve güvenli mevcut karar erişimini doğrular; kalıcılığın düzeldiğini iddia etmez.
- Bu rapor, `CODEX-SON-RAPOR.md` ve `reports/codex/evidence/mp84/` kanıtları eklendi/güncellendi.
- Runtime, MP istemci/server, A1 test düzeltmesi, bağımlılık bildirimi, lockfile ve `AGENTS.md` değiştirilmedi.

## B1

MP.7.4 tek sıralı koşusu MP.8.3 JSONL preload'u ve Playwright API günlüğüyle çalıştırıldı. B1 **PASS**, A1/A4/A5 **PASS**. B1 misafir sayfa 4'te pointerdown/up/click `jEditMe` node 5'e; sayfa 5'te yine aynı node 5'e gitti. Başarılı eylem kayıtları ve DOM değişimleri incelendi; tarihsel zaman aşımı yeniden üretilemedi. 700 ms koruması veya Playwright tamamlanması kök neden ilan edilmedi. Timeout/beklenti değişmedi; B1 açık kalır.

## Testler

Ortam: Node 24.22.1, Chromium 155.0.8059.79 (`/usr/bin/chromium`), Playwright 1.62.1, Canvas 0.1.100. Node 22 tarihsel sonuçları bu fazın sonucu sayılmadı. Testler sırayla çalıştırıldı.

| Kontrol | Sonuç | Not |
|---|---|---|
| `mp84_notice_identity_test.js` | PASS 5/0, çıkış 0 | Codec, kayıt/olay çakışması, menü, yükleme sonrası tek kabul, ayna |
| `perf2_equivalence_test.js` | PASS 5/0, çıkış 0 | Test kapsamındaki kontrol/aday Save8 ve RNG eşdeğerliği |
| `browser-mp74.cjs` + tanı | PASS 7/0, çıkış 0 | A1/A4/A5/B1 ayrı ayrı geçti |
| `browser-mp75.cjs` | PASS 6/0, çıkış 0 | Olay gizleme, menüden yeniden açma ve diplomasi |
| `browser-mp8.cjs`, N | PASS 9/0, çıkış 0 | Kopma/ayna eşitleme/kayıp karar/tekrar kabul reddi |
| `browser-mp8.cjs`, R, `MP8_MONTHS=6` | PASS 5/0, çıkış 0 | 6 ay + kayıt/yeni süreç/yeni oda/devam + 6 ay |
| `mp74_notice_test.js` | PASS 6/0, çıkış 0 | Kaydırma, menü, kabul/ret/karşı teklif |
| `mp75_war_test.js` | PASS 4/0, çıkış 0 | Savaş/barış kayıt tutarlılığı |

Yeni testlerde FAIL yoktur. Ana özelliğin kabulü ise **karşılanmadı**: bu fazdaki güvenlik denetimleri bir çözümün başarı testi değildir.

R koşusu `MP8_MONTHS=6` ile sınırlıdır; kaynak testteki statik “60 ay” başlığı 60 aylık kampanya kanıtı sayılmaz. Toplam 6 ay önce + 6 ay devam çalıştı. Bekleyen teklif gerçekten oluşturuldu (`pendingOffer.status=ok`), ikinci kabul `rules:closed` oldu. Kayıt öncesi/sonrası gün, RNG, teklifler ve insan eşlemesi aynı; bu koşuda aktif savaş/federasyon/konsey durumu boştu, bunlar için aktif senaryo kabulü iddia edilmiyor.

Çalıştırma (depo kökü; tümü sıralı):

```sh
node tests/mp84_notice_identity_test.js
node tests/perf2_equivalence_test.js
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp84/mp74 STARS_TRACE=/tmp/star-mp84/mp74-input.jsonl DEBUG=pw:api node --require ./tests/helpers/mp83-input-trace.cjs tests/browser-mp74.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp84/mp75 node tests/browser-mp75.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp84/mp8-N MP8_SCEN=N node tests/browser-mp8.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/star-mp84/mp8-R6 MP8_SCEN=R MP8_MONTHS=6 node tests/browser-mp8.cjs
node tests/mp74_notice_test.js
node tests/mp75_war_test.js
```

[Runner çıkışları](evidence/mp84/runner-exits.json), MP.7.4/7.5 ve MP.8 sonuç JSON'ları, stdout, Playwright API ve Node JSONL kanıtları aynı kanıt dizinindedir. Node/persist test sonuçları loglardadır.

**Yeni kalıcılık senaryoları NOT RUN / uygulanmadı:** aynı dosyayı tekrar açınca tercihin kalması; farklı kayıt/oyuncu/fork arasında kalıcı depo yalıtımı; bozuk/boş/engelli tercih deposu; tercih satırı temizleme. Mevcut davranış denetimi aynı kayıtta kartın yeniden göründüğünü doğruladı. Bu kontrolün PASS olması, istenen özelliğin PASS olduğu anlamına gelmez.

Fiziksel Android, canlı Render, tam regresyon, 10+ bildirim ve Docker testi NOT RUN. Bu fazda yeni ürün kodu olmadığı için gereksiz kampanya genişletilmedi.

## Save8/RNG / eski kayıtlar / paketleme

Save8 alanları ve RNG tüketimi değiştirilmedi; eski fixture dosyası ve denetimlerin ürettiği Save8 yüklenebildi. PERF.2 geçti. MP kayıt/devam kontrolünün kapsamı sonuçlarla ayrıca belirtilir. Host yetkisi, gizlilik, PERF.1/PERF.2 ve karar motoru koduna dokunulmadı.

Runtime build **96h10p5**, MP sürümü **MP.8** korunur. Yeni build/PWA, manifest, ZIP, SHA-256 ve CRC32 üretimi gerekmiyor; yayın, Dockerfile ve allowlist değiştirilmedi. Yeni paket üretildiği veya Render dağıtıldığı iddia edilmez.

## MP.8.5 önerisi

1. SP kayıt zarfı/sidecar ve içe aktarma/fork kimlik sözleşmesini ayrı küçük fazda kur; ham Save8 geriye uyumlu yükleme yolunu koru. Kimliği belirsiz dosyaya otomatik tercih bağlama.
2. MP'de saveId + gerçek aktör için scope protokolü, yeni olay örneği kimliği ve aktör/devir değişiminde önbellek temizliği; yeni gizli veri paylaşmadan tasarla.
3. Sonra yalnız sunum deposunu ekle; başarısız yükleme rollback'i, stok/Save8/RNG eşdeğerliği, aynı/farklı/fork kayıt, yeni olay ve storage hata durumlarını otomatik sınayarak kalıcılık kabulünü yap.
4. B1'i bağımsız ve sınırlı takip et; yeniden üretilmeden tahmini düzeltme uygulama.


## GitHub teslim kaydı

PR oluşturma denemesi GraphQL için **Forbidden** döndü. Güvenlik/ağ sınırları değiştirilmedi; PR oluşturulmuş gibi gösterilmiyor. Rapor/test/kanıt commit'i bu geliştirme dalına push edilir; uzak HEAD doğrulaması teslim kaydına eklenecek.

- Rapor: https://github.com/sarsiss12-dot/Star/blob/codex/stars-mp84-notice-persistence/reports/codex/MP84-BILDIRIM-KALICILIGI-SONUC.md
- Doğru tabanla PR oluşturma ekranı (oluşturulmuş PR değildir): https://github.com/sarsiss12-dot/Star/compare/codex/stars-mp83-join-stability...codex/stars-mp84-notice-persistence?expand=1

Mevcut RELEASE-MANIFEST.json içindeki 19 dosyanın SHA-256'sı çalışma ağacıyla eşleşti (`manifest-check.log`). Bu yeni ZIP üretimi veya yeni runtime davranış kabulü değildir.
