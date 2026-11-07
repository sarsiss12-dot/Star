# STARS — BETA-UX.0 sonuç raporu

**Yerel geliştirme ve kabul PASS; kullanıcı onayı verilmedi.** Kapsam yalnız #33 panosunun **#8** görevi / ayrıntılı [issue #5](https://github.com/sarsiss12-dot/Star/issues/5): üretken devlet adları, doktrinsel unvanlar ve Pregame isim zarı. Fiziksel Android, Render, gerçek LAN/internet **NOT RUN**. Görev **TAMAMLANDI değildir**.

## 1. Kanonik kaynak, commit ve GitHub teslimi

- Başlangıç dalı: `codex/stars-beta-setup0-pirates`.
- Beklenen ve `git fetch`/uzak dal ile doğrulanan başlangıç HEAD: **`fec9a8b4345b14cca9fa5c2eb496fc84e24f7ad2`**. Son kontrolde de aynıydı; daha yeni kaynak geliştirmesi yoktu.
- Yeni dal: **`codex/stars-beta-ux0-names`**. PR tabanı SETUP.0 dalıdır; eski main kullanılmadı.
- Kod/test/paket bitiş HEAD: **[`c49c10a5f9d9be16551b7cc7c74174a7a4ed2e38`](https://github.com/sarsiss12-dot/Star/commit/c49c10a5f9d9be16551b7cc7c74174a7a4ed2e38)**. Push sonrası `git ls-remote` ile aynı SHA doğrulandı.
- Bu rapor ve son GitHub hata kanıtları, yukarıdaki doğrulanmış kod commit'inden sonraki dokümantasyon commit'idir. Kendi SHA'sını önceden bilemeyeceğinden nihai teslim HEAD'i sohbetin son mesajında ve uzak dalda verilir; SHA eklemek için yeni commit döngüsü yapılmaz.
- [GitHub raporu](https://github.com/sarsiss12-dot/Star/blob/codex/stars-beta-ux0-names/reports/codex/BETA-UX0-SONUC.md) · [Kanıtlar](https://github.com/sarsiss12-dot/Star/tree/codex/stars-beta-ux0-names/reports/codex/evidence/beta-ux0).
- Taslak PR oluşturma **bir kez** denendi: `Post "https://api.github.com/graphql": Forbidden`. **PR oluşturulmadı.** [Doğru tabanla karşılaştırma / PR oluşturma](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-setup0-pirates...codex/stars-beta-ux0-names?expand=1).
- Main merge, rebase, force-push, ortam/izin değişikliği, Render bağlantısı/deploy/restart yapılmadı.

## 2. Kanıtlanan eski sorunlar ve en küçük düzeltme

| Eski durum / kök neden | Uygulanan değişiklik |
|---|---|
| Eski `empireName` sınırlı kök listesi ve etik tabanlı 4 biçimden 3–5 kelimeli, bazen çizgili adlar üretiyordu; kesinleşen doktrine göre adlandırmıyordu. | Yeni görünür otomatik ad **özel kök + tek kelimelik doktrin unvanı**, tam iki kelime. Eski üretici yalnız eski galaksi kurulumunun RNG tüketim yolunu aynen korumak için bırakıldı. |
| AI adı son köken/kimlik/kişilik işlemlerinden önce oluşturuluyordu. | Eski geçici ad, eski kurulum sırasında aynen üretilir. Kurulum sonunda gerçek stratejik `personaKey(e)` belirlenmişken yalnız normal AI'nın görünür adı ayrı kozmetik RNG ile sonlandırılır. AI kimliği, etiği ve kararları ad için değiştirilmez. |
| `CFG.mizac` ilk açılışta zaten `yayilmaci`; truthy kontrolü açık seçim kanıtı değildir. İki ayrı zar yolu da `Math.random` ile üretime izin veriyordu. | CFG/G/Save8 dışında `SETUP_NAMING.selected` açık seçim kaydı; hem `UI.act('rollName')` hem gerçek setup delegation ortak kapıdan geçer. |
| Değiştirilmemiş p9 gerçek dokunma testinde doktrin seçmeden zar, `Elle Yazdığım Devlet` adını `Yükselen Yıldız Devletleri — Ilyra` yaptı. | Seçim yoksa tam **⚠️ Önce devletinin doktrinini seç!** mesajı görünür; input/CFG adı, stratejik RNG, isim üretici çağrı sayısı ve kozmetik zar sayacı değişmez. Önceki FAIL kanıtı `before-ui/` içinde korunur. |

İlk yeni oyunda hiçbir doktrin kartı seçili gösterilmez. Oyuncu Yayılmacı kartına gerçekten dokunursa geçerli seçim olur. Doktrin değiştirmek mevcut manuel/otomatik adı değiştirmez; sonraki zar yeni doktrini kullanır. Normal varsayılan oyuna başlama şartları daraltılmadı: yalnız zar kapısı değişti.

## 3. Üretken isim sistemi ve unvanlar

- Beş fonetik aile: sert, yumuşak, mistik, mekanik ve sınır kültürü. Başlangıç/gövde/son ek birleşimi; toplam **20.480 ham parça kombinasyonu**, filtre öncesi ve bazıları birbirine eş olabilir. Bu sayı benzersiz kabul edilmiş ad sayısı değildir.
- Kökler 4–9 karakter; aşırı ünlü/ünsüz yığılmaları, aynı harfin üçlenmesi ve sınırlı sakıncalı kelime parçaları filtrelenir. Dilsel doğallık için kullanıcı değerlendirmesi ayrıca gerekir.
- Galaksi içi kök benzersizliği, büyük/küçük harf normalleştirmesi ve Levenshtein yakınlık denetimi vardır. Uzun köklerde daha sıkı benzerlik eşiği kullanılır.
- Her doktrinde **14 ağırlıklı tek kelimelik unvan**. Kullanılmamış uygun unvanlar önceliklidir; galaksi içinde aynı unvanın baskın tekrarına izin verilmezken havuz tükenirse ağırlıklı tekrar mümkündür.
- 64 normal denemeden sonra sonlu 4.096 hecesel fallback denenir. Fallback kökü benzersiz tutar; benzerlik şartını gevşetebilir. 250 ad boyunca sabit bozuk RNG testi de geçer. Havuz tamamen tükenirse açık hata verir; sonsuz döngü/sayısal üçüncü kelime yoktur.
- Bazı uyumlu unvanlar doktrinler arasında paylaşılır. Ad, gizli kişiliği kesin ifşa eden bir etiket olarak kullanılmaz.

| Doktrin | Unvan sayısı | Ağırlığı yüksek başlangıç unvanları | Gerçek üretilmiş örnek |
|---|---:|---|---|
| Militarist | 14 | Lejyonu, Komutanlığı, Armadası | Zireos Komutanlığı |
| Kriminal | 14 | Karteli, Şebekesi, Sendikası | Feniar Kaçakçıları |
| Pasifist | 14 | Birliği, Topluluğu, Konfederasyonu | Qaluis Cumhuriyeti |
| Yayılmacı | 14 | İmparatorluğu, Hanedanı, Hegemonyası | Kenera Hanedanı |
| Teknokrat | 14 | Direktörlüğü, Teknokrasisi, Enstitüsü | Torvave Akademisi |
| Ticaret | 14 | Konsorsiyumu, Loncası, Korporasyonu | Torriv Korporasyonu |
| Teokrat | 14 | Ruhbanlığı, Konsili, Teokrasisi | Vaeron Ruhbanlığı |
| İzolasyonist | 14 | Enklavı, Sığınağı, Kalesi | Ulvear Hisarı |

Bütün ağırlıklar, doktrin başına 200 önerinin unvan frekansları ve örnekleri [doctrine-titles.json](evidence/beta-ux0/doctrine-titles.json) içindedir. Sekiz havuzun her birinde 14 unvanın tamamı gözlendi. Galaksi başlangıcındaki normal AI adları bu fazın kapsamıdır; korsan/kriz/kalıntı ve özel isyan adlandırmaları yeniden yazılmadı. Elle yazılan adlara iki kelime sınırı getirilmedi.

## 4. Gerçek Pregame, şablon ve mobil dokunma kabulü

Chromium **155.0.8059.79**, Playwright **1.62.1**, Node **24.22.1**. İki gerçek tarayıcı görünümü: **800×360** ve **960×540**, mobil dokunmatik benzetimi. Pointer/touch/click olaylarının güvenilir `isTrusted` kayıtları Node tarafında tutuldu.

Her iki görünümde gerçek `tNew` ve setup zar düğmesi üzerinden:

1. Varsayılan Yayılmacı açık seçim sayılmaz; manuel ad korunur, exact uyarı görünür; sıfır RNG/sayaç/üretici değişimi.
2. Yayılmacı kartına gerçek tap geçerli seçimdir; ardışık zarlar farklı iki kelimeli adlar üretir.
3. Sekiz kartın her biri + gerçek zar uygun unvan verir. Kart değişimi mevcut manuel adı korur.
4. Gerçek şablon yükleme düğmeleri: geçerli pasifist şablon seçim sayılır; doktrinsiz/bozuk şablon eski seçimi taşımaz, zar engellenir.
5. Başka kurulum sekmesine gidip dönmek seçimi korur; ana menüden yeni oyun yeniden açık seçim ister.
6. Doktrin seçmeden normal varsayılan oyunu başlatmak engellenmez; mevcut ad korunur.
7. Uzun manuel ad Save8 yüklemesinde değişmez; ortak diplomasi/federasyon/haber görünümleri açılır.

**14/0 PASS.** Doğrudan `UI.act` alternatif yolu ayrıca native kabul testindedir; gerçek DOM yolunun yerine kullanılmadı. [Sonuçlar](evidence/beta-ux0/browser-first/results.json), [olaylar](evidence/beta-ux0/browser-first/input-events.json), [seçimsiz uyarı görüntüsü](evidence/beta-ux0/browser-first/800x360-blocked.png).

Ek ortak görünüm testi: aynı iki yatay boyutta vasallık, ticaret sözleşmesi, savaş haberi ve harita **8/0 PASS**. Vasallık X düğmesi gerçek dokunmayla kapanır. Anlaşma/liman/temas ve savaş bilgileri yalnız sunum fikstürü olarak kuruldu; yeni vasallık/ticaret mekaniği geliştirilmedi. [Sonuçlar](evidence/beta-ux0/panels-final/results.json), [savaş](evidence/beta-ux0/panels-final/800x360-savas.png), [ticaret](evidence/beta-ux0/panels-final/960x540-ticaret.png), [harita](evidence/beta-ux0/panels-final/960x540-harita.png). Uzun harita etiketlerinde mevcut güvenli kısaltma davranışı korunur; bütün keyfi uzun manuel adlar için kesilmez metin garantisi verilmez.

## 5. Çeşitlilik ve kontrol ölçümleri

100 seed: **1–99 ve404**; her galakside büyük boyut, **11 normal AI**. Öncelikli kontrol seed'leri **11,23,42,99,404**. Ölçümler [audit/audit.json](evidence/beta-ux0/audit/audit.json) içindedir.

| Ölçüm | Gerçek sonuç |
|---|---:|
| Toplam normal AI adı | 1.100 |
| Tüm galaksilerde benzersiz kök | 1.057 |
| Galaksiler arası tekrar kök oluşumu | 43 /1.100 = %3,91 |
| Tüm galaksilerde benzersiz tam ad | 1.099 |
| Galaksiler arası tekrar tam ad oluşumu | 1 /1.100 = %0,09 |
| Aynı galakside kök /tam ad çakışması | **0 /0** |
| Galaksi içi benzer kök çifti | **0 /5.500 çift**, ölçüm tanımı Levenshtein≤1 |
| İki kelimeli ad oranı | **%100** |
| Gerçek stratejik doktrine uyumsuz unvan | **%0** |
| Aynı seed bağımsız tekrar Save8 baytları | Öncelikli beş seed'de aynı |

Mevcut AI kişilik dağıtımını değiştirmediğimiz 100 doğal galakside altı stratejik doktrin gözlendi: kriminal149, militarist139, pasifist311, yayılmacı201, izolasyonist101, ticaret199. Bu örneklemde doğal teknokrat/teokrat AI yoktu; varmış gibi sayılmadı. Sekiz havuzun tamamı ayrıca 8×200 öneri ve gerçek sekiz Pregame kartı ile doğrulandı. Gerçek galaksi unvan dağılımının bütün sayıları audit JSON'dadır. Farklı galaksiler arasında hiç tekrar olmayacağı iddia edilmez; benzersizlik garantisi galaksi içindir.

## 6. Save8, stratejik RNG, harita ve AI güvenliği

- Görünür AI adı için ayrı `mulberry32(identityHash('name-ux0:'+seed+':'+id))`; Pregame için seed+doktrin+yalnız başarılı zar sayacı. `Math.random` veya stratejik `rnd` tüketilmez.
- Eski AI adlandırmasının yapısal RNG çağrıları ve çakışma denemeleri eski sırada sürer. Bu geçici adlandırma, sonraki coğrafya/başkent/kimlik RNG akışını korumak içindir. Son isim seçimi kesinleşmiş stratejik `personaKey` kullanır; CFG etiği, AI kişiliği veya mizaç isme uydurulmaz.
- Aynı SETUP.0 kontrol kaynağıyla seed11/23/42/99/404 başlangıç Save8 alan bazında karşılaştırıldı: **yalnız `.emps.<id>.name` farkları**. Başkentler, sistem koordinatları, devlet ID'leri, kaynaklar, ekonomi, AI kimlikleri ve RNG eşleşir. Serializer değiştirilmedi, hash tutturmak için alan silinmedi. Yeni oyun adları kasıtlı değiştiği için tüm yeni Save8 baytlarının eski sürümle aynı olduğu söylenemez.
- Mevcut m60 Save8 aynı eski/yeni kodla yüklendi ve gerçek günlük/aylık motor yolunda **6 ay** ilerletildi. Yükleme ve her ay sonunda **ham Save8 metni/SHA-256 ve RNG birebir**. Eski uzun adlar yeniden üretilmez/kısaltılmaz.
- Gerçek eski **p9 MP paket4** üretildi; p9 ve p10'a bağımsız yüklendi. İki yükleme çıktısının **ham Save8 baytları aynı**, adlar ve RNG korunur. Kaydetme anı ile yükleme sonrası `_prof`, `_supAt`, `_gateAt` farkları aynı p9→p9 yüklemede de vardır: mevcut türetilmiş önbellek sıfırlamalarıdır; [alan farkı](evidence/beta-ux0/compat-p9-reload-diffs.json). Bunlar normalize edilmedi veya serializerdan çıkarılmadı; doğru karşılaştırma aynı paketin eski/yeni **yükleme çıktılarıdır**.
- Save8 **v8**, MP paket **4**, protokol **1**. Yeni p10 build kapısı yalnız mevcut p6/p7/p8/p9 paket uyumluluğunu açıkça sürdürür; bütünlük/diğer build/alan kontrolleri korunur.
- Setup seçim/sayaç verisi CFG, şablon, Save8 veya MP paketine eklenmez. Geçerli yerel MP taslağını geri yüklemek açık seçim kabul edilir; ilk boş MP kurulumunda varsayılan mizaç seçim sayılmaz.

## 7. Multiplayer ve önceki fazların korunumu

Gerçek yerel TLS relay, ayrı Chromium süreçleri, host844×390 ve misafir800×360. Ortak MP.7 kurulumunda iki insan kendi doktrinini gerçekten seçti ve zar kullandı. Host adı **Axalk Garnizonu**, misafir adı **Kyyn Teknokrasisi**; misafir kendi adıyla host adını doğru görüyor. Ayna yerel ID permütasyonu mevcut kuralla korunur. JS hata listesi boştur.

Hedefli MP73 **5/0 PASS**:

- A1: gerçek oda/iki devlet/kurulum, zar kapısı, ad eşitliği, sürüm/endpoint/rol ve yetki kontrolleri.
- P01: host ve misafirde sekiz menü geçişi; ayna yenilenmesinde Konsey paneli ekranı ele geçirmez.
- P03: Konsey tek dokunma, gerçek host ACK, panel koruması ve yeniden bağlantı.
- P04: insan savaşının gerçek bitiş nedeni, güvenli savaş/haber aynası, insan ambargosu koruması.
- A3: bağlantı kopup gelince eski devlete dönüş ve doğrulanmış MP4 kayıt paketi.

SETUP.0 denetimi aynı MP koşusunda açıktı: host CFG ve host/misafir G.cfg `pirates=false`, sıfır korsan yuvası/filosu. [MP sonuçları ve metrikler](evidence/beta-ux0/mp73/mp73-results.json). Bu koşuda tarihsel lobi dokunma hatası görülmedi; kesin kapatıldığı iddia edilmez.

## 8. Gerçek PASS / FAIL / NOT RUN sonuçları

| Test / kapsam | Sonuç |
|---|---|
| Yeni isim/kapı/şablon/alternatif UI.act/eski ad testleri | **9/0 PASS** |
| p9 MP uyumluluğu +8 havuz×200 dağılım | **2/0 PASS** |
| 100 galaksi çeşitlilik +5 kontrol/tekrar +eski Save8 yükleme/6ay | **PASS**, yukarıdaki örnek sayılarıyla |
| Gerçek Pregame mobil Chromium | **14/0 PASS** |
| Ek ortak panel mobil Chromium | **8/0 PASS** |
| Hedefli MP73 A1/P01/P03/P04/A3 | **5/0 PASS** |
| SETUP.0 korsan hedefli | **10/0 PASS** |
| P0.1 oylama /savaş bitişi /ambargo | **3/0 /5/0 /5/0 PASS** |
| P0.1 haber /P0.2 haber /geri dönüş /MP64 haber aynası | **4/0 /8/0 /3/0 /4/0 PASS** |
| Konsey çekirdek | **14/0 PASS** |
| Save8 atomik sınırları /MP4 kayıt çekirdek /p6-p7 uyumluluk | **19/0 /14/0 /4/0 PASS** |
| PERF.1 /PERF.2 /MP.8.6 piksel önbelleği | **4/0 /5/0 /3/0 PASS** |
| MP89 UI ve dokunulmamış kaynak koruma | **1/0 PASS** |
| Yukarıdaki mevcut native regresyon toplamı | **106/0 PASS**, 16 komut; yeni isim ve uyumluluk testleri bu toplama dahil değil |
| Deterministik ZIP, CRC, SHA, manifest ve çıkarılmış paket | **PASS** |
| Değiştirilmemiş p9 gerçek zar öncesi kontrolü | **0/1 FAIL**, hedef bug kanıtı; korunur |
| İlk ek test fikstürü ve sandbox denemeleri | **FAIL**, aşağıda açıklanır; son PASS ile silinmedi |
| Fiziksel Android /gerçek LAN /gerçek internet /canlı Render | **NOT RUN** |
| Docker build /bu fazda tam MP73 B1–B4, MP75 ve MP8 N/R kampanyaları | **NOT RUN**; değişmeyen alanlar için önceki sonuçlar yeni koşu gibi sayılmadı |

Native ham günlükleri ve çıkış kodları [native/results.json](evidence/beta-ux0/native/results.json) içindedir. Sıkı kaynak testlerinde eski SHA assertion'ları değiştirilmedi: sadece kesin aday SHA'sı ve benzersiz incelenmiş hunklarla UX.0 değişimi geri çevrilip önceki pinler yeniden denetlendi. Bu kaynak denetimi gerçek Save8 karşılaştırmasının yerine geçmez; audit ayrıca bağımsız kontrol köküyle çalışır.

### Başarısız denemelerin ayrımı

- **Gerçek eski ürün kusuru:** seçim yokken manuel adı değiştiren p9 zarı; yeni UI testinde düzeltilmiştir.
- **Sandbox:** `mp89_ui_integrity_test` salt okunur git alt sürecinde `spawnSync git EPERM`; aynı test mevcut ortam erişimiyle değişmeden PASS. Ağ/ortam politikası değiştirilmedi.
- **Yeni ek panel testi fikstürleri:** oyun UI'sini oluşturmadan `UI.refresh` çağrısı (`stardate` null); iki `vsCancel` düğmesini ayırt etmeyen strict locator; ticaret anlaşması/limanı eksikliği; kurulmamış `pact` sözlüğü. Her biri fikstürde düzeltildi. Oyun kodu bu denemeler için değiştirilmedi.
- **Danışman yarışı:** X dokunmasından sonra bilinen 420ms danışman açılışı geliyordu; başarısız ekran görüntüsü DANIŞMAN gösterir. Test, danışmanın gerçek `advClose` düğmesini bekleyip dokunarak kapatır; sonra paneli açar. Timeout artırılmaz, kapatma assertion'ı korunur.
- **MP paket fikstürü:** başlangıçta misafir yoktu; sonraki denemede yanlış uzunlukta token `fields` reddi doğurdu. Gerçek hello/claim/ready akışı ve uygun uzunlukta deterministik test tokenı kullanıldı.
- **Paket karşılaştırma yöntemi:** ham kayıt anı ile yükleme sonrası cache reseti doğrudan eşit değildi. Aynı p9→p9 yüklemeyle kanıtlandı ve eski/yeni aynı yükleme çıktıları karşılaştırıldı. Ad/RNG assertion'ları korunur, alanlar silinmez.

Bütün ilk loglar ve ekranlar [kanıt README](evidence/beta-ux0/README.md) ile ilişkilidir. Son `panels-final/results.json` 8 PASS içerir; bu klasördeki `prior-selector-failure.png` önceki denemeden kalandır. Force:true, sahte JS click, assertion gevşetme veya testi PASS yapmak için timeout artırımı yoktur.

## 9. Değiştirilen dosyalar ve paket

Ürün: `main.js` (yeni üretici/kapı, eski RNG yolunun korunması, son AI adlandırması, template seçimi, build), `ui.js` (iki zar yolu/uyarı/kart seçimi), `sw.js` (PWA), `research/mp7/client/mp7-setup.js` (yerel draft seçimi), `research/mp0/mp-core.js` (dar build uyumu), `research/mp1/client/view.js` ve `research/mp1/server/relay.js` (MP sürüm işareti), `RELEASE-MANIFEST.json`.

Testler: yeni names/audit/compat/Chromium Pregame ve panel testleri; mevcut MP73'e yalnız isteğe bağlı `UX0_NAMES` kontrolü ve sürüm beklentisi; kesin kaynak koruma adaptörü. Dokümanlar, ekranlar, JSON/log kanıtları ve sürüm ZIP'i teslim edildi. CSS/harita, AI stratejisi, vasallık, federasyon, savaş/diplomasi kuralları değiştirilmedi.

- Oyun **96h10p10**; PWA **stars-v96h10p10**; MP **MP.8.9b5**. Yerel `/mp/version`, lobi, tanı çubuğu ve oyun build'i gerçek MP testinde aynı.
- [ZIP](../../releases/stars-faz96h10p10.zip): **784.168 bayt**; 19 oyun runtime dosyası +manifest, 20 üye.
- ZIP SHA-256: **`eb439625982cb688af8d2e4ac21bbfd477d5f6cd52691df8a3013491262c0d24`**.
- ZIP dosyası CRC32: **`12F8252D`**; bütün üye CRC'leri doğrulandı.
- Aynı ağaçtan iki paket üretimi **bayt bayt aynı**; sabit zaman/sıra/izinler.
- Manifest SHA-256 ve her ZIP üyesinin CRC32'si [RELEASE-VERIFIED.json](evidence/beta-ux0/RELEASE-VERIFIED.json); değişen **bütün yedi runtime/MP dosyasının** eski/yeni SHA-256 değerleri [runtime-hashes.json](evidence/beta-ux0/runtime-hashes.json) içindedir. Manifest 19 oyun dosyasının güncel SHA-256 değerlerini taşır.
- ZIP mevcut proje sözleşmesiyle bağımsız oyun paketidir; MP research istemci/relay dosyaları ZIP'e sonradan gizlice eklenmedi. Multiplayer dağıtımı aynı dalın Docker/repo dosyalarını kullanır. Docker COPY/relay allowlist yolları mevcut MP7 dosyasını zaten içerir; yeni yol gerekmiyor. **Docker build ve canlı dağıtım NOT RUN**.
- Eski p9 ZIP/manifest yerinde korundu; kayıtlar silinmedi.


Değişen runtime dosyalarının SHA-256 değerleri (eski değerler ayrıca JSON’da):

| Dosya | Yeni SHA-256 |
|---|---|
| `main.js` | `47399531c6c6b337d872e7b56dce3414e8249d405ea9cac26182c7a193bf2587` |
| `ui.js` | `283e47be523210f77472606a397d06ff3194a23c8b5503fb758a42f13a026dab` |
| `sw.js` | `ede13a7d6aecc7a3fd4528fcf9576d28a99143ae7dcd14099bc63f71aa46dbba` |
| `research/mp7/client/mp7-setup.js` | `ab778049237959d397e7ad2562a8801037139f4ba9b7c64f052ce8963622c09b` |
| `research/mp0/mp-core.js` | `dcfed98f6352f9f231de547a76e707de83dcc8d33396071edc623747d071e0cd` |
| `research/mp1/client/view.js` | `56598a0ec1ad9c6706dfc31c1487d5682d35eaca33f6064787153549705b21bd` |
| `research/mp1/server/relay.js` | `3509f613fc258f3474789ff9912371b3c93779653ebb2cafb389170ffb6ae751` |

Manifest SHA-256: `8879737046344da4be6a12b991b45ecf70d5c13872deae7cf22883b254fa8f84`.

## 10. GitHub #33 / görev #8 gerçek durumu

Başlangıçta kanonik pano **44 görev** içeriyordu. Kaynak JSON'u korunur. #8 **PROMPT HAZIR**, #41 **TEST BEKLİYOR** idi. #41'in SETUP.0 yerel PASS/fiziksel test bekleyen durumu korunmuştur.

İşe başlarken yalnız #8 için AJANA VERİLDİ→GELİŞTİRMEDE ek yorumu denendi; rapor aşamasında yalnız #8 için RAPOR GELDİ ve yerel kanıtlarla KULLANICI ONAYI BEKLİYOR önerisi gönderilmeye çalışıldı. **İki yazma da `Post "https://api.github.com/graphql": Forbidden` ile reddedildi.** Son REST okuma denemesi de Forbidden verdi. Bu yüzden bu geçişler GitHub'da gerçekleşmiş gibi gösterilmez: **#8'in son okunabilen gerçek durumu PROMPT HAZIR**, sonradan dışarıdan değişim son API okumasıyla doğrulanamadı.

[Başlangıç hata kaydı](evidence/beta-ux0/issue33-start.log), [son hata kaydı](evidence/beta-ux0/issue33-final.log), [yayımlanamayan sonuç yorumu](evidence/beta-ux0/issue33-final-proposed.md). Pano gövdesi değiştirilmedi/yeniden kurulmadı. Diğer 43 görev ve #41 üzerinde hiçbir durum yazımı yapılmadı; hiçbir görev kapatılmadı. PR engeli araştırılarak zaman harcanmadı, API güvenlik sınırları değiştirilmedi. **Dal/kod/paket/rapor push teslimi ile API yorum/PR yetkisi farklıdır.**

## 11. Açık sınırlar ve kullanıcı kabulü

- Fiziksel telefon telaffuz/okunabilirlik ve dokunma kabulü beklenir. Uzun manuel isimler olduğu gibi korunur; uç uzunluklardaki mevcut kısaltma/dar panel davranışı tamamen yeniden tasarlanmadı.
- Üretkenliğin öznelliği: bazı kökler dilsel olarak daha az doğal gelebilir; otomatik filtreden geçmek Türkçede kusursuz telaffuz garantisi değildir. Galaksiler arası %0 tekrar hedeflenmez. Galaksi içi çakışma ve doktrin uyumu ölçülen kapsamda sıfırdır.
- Eski lobi/ortam aralıklı timeout riskleri bu dar isim fazında kapanmış sayılmaz. Tam ağ/kayıt kampanyaları ve gerçek cihaz/internet kabulü bu fazda yeniden yapılmadı.
- GitHub API engeli nedeniyle kullanıcı/uygun yetkili kişi pano #8 sonucunu bağlamalı ve PR açmalıdır. Kod GitHub dalındadır; main veya Render yayını yapılmadı.

Kısa fiziksel kabul planı: (1) iki yatay telefonda yeni oyun, manuel ad, doktrin seçmeden zar→aynı ad ve exact uyarı; (2) Yayılmacı dahil sekiz kart/dice ve doktrin değişiminde adın korunması; (3) geçerli/doktrinsiz şablon ve yeni oyun dönüşü; (4) yerel/izinli multiplayer'da iki kişinin aynı adları lobi/diplomasi/haberlerde görmesi; (5) eski kayıt adı ve uzun manuel ad yükleme, vasallık/ticaret/savaş ekranlarında kaydırma ve X; (6) korsan KAPALI mevcut kabulünün kısa kontrolü. Sürüm/rol, seed, ekran boyutu, seçilen doktrin ve hatanın önce/sonra görüntüsü alınmalı; terminal gerekmez.

**Kullanıcı onayı bekleyen teslimat:** yalnız #8'in bu isim/doktrin/zar geliştirmesi. Bir sonraki faz için tek öneri: yeni mekanik eklemekten önce bu paketin fiziksel yatay mobil/MP kullanıcı kabulü ve pano/PR bağlantısının tamamlanması. Devlet isimleri dışında yıldız kapısı, vasallık veya federasyon geliştirmesi yapılmadı.
