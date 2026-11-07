# STARS — BETA-SETUP.0 sonuç raporu

**Sonuç: #41 için yerel kabul PASS.** Pregame KAPALI artık korsan yuvası/muhafızı/akıncısı veya Korsan Çağı üretmiyor. Seed11/99/404 gerçek120 aylık kampanyalarda KAPALI korsan doğumu ve baskını sıfır. AÇIK davranış P0.2 kontrolüyle her ay doğrudan Save8 SHA-256/RNG eşdeğer. Fiziksel cihaz/canlı ağ kabulü yapılmadı; görev TAMAMLANDI yapılmadı.

## 1. Kanonik kaynak ve HEAD

- Başlangıç: `codex/stars-beta-p02-mp-acceptance` @ **3fd07944b6764ca6e71f6e8dc8b81404d5c8cfbd**. GitHub fetch/ls-remote ile beklenti doğrulandı; çalışma ağacı başlangıçta temizdi.
- Yeni dal: **codex/stars-beta-setup0-pirates**. Eski main taban alınmadı; merge/rebase/force-push yapılmadı.
- Doğrulanmış ürün/test bitiş HEAD: **7aaf23fc7ef19b1ec9b86238ce2a0010d61aefd8** — [commit](https://github.com/sarsiss12-dot/Star/commit/7aaf23fc7ef19b1ec9b86238ce2a0010d61aefd8). Push sonrası uzak dal aynı SHA ile doğrulandı.
- Bu rapor sonraki dokümantasyon commit'inde yayımlanır; kendi SHA'sını önceden yazmak için ek commit zinciri üretilmez. Nihai teslim HEAD'i son sohbet mesajında/uzak dalda doğrulanır.
- Kapsam yalnız pano #41. İsim #8, BETA-UX.0, yıldız kapısı veya başka sistem geliştirmesi eklenmedi. AGENTS/GPT-DEVIR/CLAUDE ve son P0.2 raporu esas alındı.

## 2. Kesin kök neden

Pregame `togPirate` doğru biçimde `CFG.pirates=false` yapıyor; `startGame` bunu `setupGame({...CFG})` üzerinden **G.cfg'ye doğru taşıyor**. Hata düğmede/kalıcılıkta değil:

1. `main.js/setupGame` ayardan bağımsız `G.nests`, yuvalar ve Korsan Muhafızı filoları kuruyordu. Değiştirilmemiş P0.2'de3 seed'in her birinde KAPALI olduğu hâlde **3 yuva+3 filo**: [önce JSON](evidence/beta-setup0/before.json), [önce test0/3](evidence/beta-setup0/before-tests.log).
2. `ai.js/wildTurn` yuva zamanlayıcısını ayardan bağımsız ilerletip Korsan Akıncısı üretiyordu; hareket yolunda da aynı ayrım yoktu.
3. `main.js/upheavalTick` olay havuzu KAPALI iken de **Korsan Çağı** seçebiliyordu. Ayrı yeniden üretim [9/1 FAIL](evidence/beta-setup0/era-before.log) ile doğrulandı.
4. Ortak teknik `wild` tarafı korsan dışında **kalıntı savunucuları ve canavarlar** için kullanılıyor. Harita etiketleri, kalıntı yüzünden keşif beklemesi ve canavar yağması bazı sunum yollarında korsan diye adlandırılıyordu. Bu nedenle wildId'yi kaldırmak veya bütün wild AI'yı durdurmak güvenli çözüm değildi.

Commerce zaten bazı korsan kargo saldırılarında ayarı kontrol ediyordu; bu kontrol başlangıç/aylık üretimi ve Korsan Çağı'nı kapatmıyordu.

## 3. Minimal düzeltme ve dosyalar

- **main.js:** başlangıç yuva/muhafız bloğu yalnız `cfg.pirates!==false` olduğunda çalışır; KAPALI `G.nests=[]`. Teknik wild kaydı/ID'si, üretim sırası ve diğer devlet ID'leri korunur. Korsan Çağı yalnız KAPALI olay havuzundan çıkarılır. Kalıntı için kullanılan iç `pirate` rota durumu değiştirilmeden KAPALI kullanıcı etiketi “KALINTI SAVUNMASI” olur.
- **ai.js:** yalnız korsan yuva üretimi ve korsan akıncı hareketi koşullandırılır. WildTurn'ün canavar doğumu/hareketi çalışmaya devam eder; normal AI strateji kodu değiştirilmez.
- **main.js / repairDisabledPirates:** eski hatalı **açıkça pirates:false** Save8 yüklenince yuva/nestPow ve yalnız geçerli `wildId`'ye ait **monster olmayan** korsan filoları temizlenir; eski Korsan Çağı kaldırılır. Kimlik silme/kaydırma yok. Canavarlar, kalıntılar, kriz devleti, normal/kriminal devletler ve isyanlar korunur. Onarım mevcut yükleme transaction'ı içindedir; zorlanmış yükleme hatasında dünya/Save8/RNG atomik geri alınır.
- **map.js / economy.js:** KAPALI durumda teknik vahşi tarafın canavar etiketi/yağma açıklaması korsan demez; kriz etiketi ayrı kalır. Harita yerleşimi/sanat tasarımı ve yağma denklemi değiştirilmedi.
- **main.js / sw.js / RELEASE-MANIFEST.json:** build/PWA/hash güncellendi. **view.js / relay.js:** MP sürümü; **mp-core.js:** eski p6/p7/p8 paketleri için dar p9 build uyumluluğu, bütünlük ve yetki kontrolleri korunur.
- Yeni testler: korsan hedefli test, sabit kontrol köklü kampanya, gerçek Pregame Chromium testi. MP73'e yalnız isteğe bağlı `SETUP0_AUDIT` eklendi. Native Canvas etiket ve sıkı kaynak koruma adaptörleri güncellendi; eski kaynak SHA assertion'ları veya Save8 alanları silinmedi.

Genel `G.raids` normal savaş kargo baskınlarını da tutar. Kaynağı ayırt edilemeyen geçmiş rota beklemeleri/haberler topluca silinmez; yeni korsan baskını engellenir. Kullanıcının disk/IndexedDB dosyaları silinmez. Eksik pirates alanı eski AÇIK/varsayılan semantiğini korur; yalnız açık `false` kapatır.

## 4. AÇIK/KAPALI — 0/30/120 ay

Son kabul: [kampanya JSON](evidence/beta-setup0/campaign-final/campaign.json), [log](evidence/beta-setup0/campaign-final.log), [kontrol noktaları](evidence/beta-setup0/checkpoint-summary.json).

Orta45 sistem,5 AI, normal zorluk, seed11/99/404; kalıntı/kriz/diğer varsayılanlar açık. Gerçek0.5 günlük dailyTick/struct/colonyBuild/autoExplore/monthTick yolu. Her koşu **120 ay,121 örnek**;0/30/120 ay = gün0/900/3600. Oyun zorla yaşatılmadı; erken bitse test FAIL olurdu.

| Seed | KAPALI 0/30/120: yuva / korsan filo / toplam yeni korsan / toplam korsan baskını | AÇIK 0: yuva/filo | AÇIK 30: yuva/filo | AÇIK 120: yuva/filo | AÇIK toplam doğum/baskın120 |
|---:|---|---|---|---|---|
| 11 | Her noktada **0/0/0/0** |3/3|3/12|2/14|43/7|
| 99 | Her noktada **0/0/0/0** |3/3|3/8|2/18|47/2|
| 404 | Her noktada **0/0/0/0** |3/3|3/10|2/10|38/0|

KAPALI'da Korsan Çağı da tüm aylık örneklerde yok. Seed99 ve404 KAPALI kampanyalarında120. ayda **birer gerçek canavar** vardı; bu korsan sayılmadı ve kapatılmadı. Kalıntılar bütün seed'lerde üretildi/korundu; unit testte savunması çalışıyor. Gerçek kriz dalgası, normal kriminal AI karar yolu ve ayrılıkçı devlet/koloni devri kontrollü motor testlerinde geçti. Bunlar doğal kriz zamanına kadar uzun kampanya diye sunulmaz.

**AÇIK korunumu:** sabit P0.2 dosya kopyası ile aday3 seed'in her ayında doğrudan Save8 SHA-256 ve RNG eşleşti: **363 kontrol noktası**. Save8 normalize edilmedi/alan atılmadı. Akıncılar ve gerçek korsan baskınları sürüyor.

**Deterministik KAPALI tekrar:** her seed bağımsız yeni VM'de120 ay yeniden oynandı; **363 noktada** Save8 SHA-256/RNG aynı. Son kampanya12 koşudur (kontrol AÇIK, aday AÇIK, aday KAPALI, KAPALI tekrar ×3 seed). İlk, Korsan Çağı kapsamı eksik adayın ölçümleri ayrı saklandı; son kabul yerine kullanılmaz.

**Farklı ayarlar arasında eşitlik iddiası yok:** korsanlar kaldırılınca tehdit, boş sistem, RNG akışı ve ileride AI karar girdileri değişebilir. Örneğin seed404'te başlangıç kalıntısı AÇIK1, KAPALI4; yuvalar için ayrılmış sistemler ve yerel üretim çekimleri farklıdır. Bu diğer tehdidi kapatmak değildir. AÇIK aynı yapılandırmada önceki davranışın korunumu doğrudan kanıtlandı.

## 5. Pregame, kayıt ve multiplayer

- [SP Chromium2/0](evidence/beta-setup0/sp-final/results.json):960×540 yatay dokunmatik; gerçek Korsan düğmesi ve GALAKSİYİ YARAT tap. KAPALI CFG/G.cfg=false, sıfır yuva/filo; AÇIK true,3 yuva/3 filo. Save8 alınır, tüm Chromium süreci kapatılır, yenisinde deserialize ile yüklenir; ayar/RNG/wildId/yuvalar korunur. Dosya seçme diyalogu ayrıca test edilmedi. [KAPALI ekran](evidence/beta-setup0/sp-final/pregame-off.png).
- [MP4/0](evidence/beta-setup0/mp-final.log): gerçek host Pregame galaksi ekranında KAPALI tap; host `CFG=false/G.cfg=false`, misafir `G.cfg=false`, sıfır yuva/korsan muhafızı/akıncısı. İki farklı insan devleti kendi arayüzünde. Misafirin galaksi ayarını host belirler; misafirin yerel taslağı host ayarını değiştirmez. [JSON](evidence/beta-setup0/mp-final/mp73-results.json) içindeki `metrics.setup0` kanıttır.
- Aynı MP koşusunda P0.2 panel sahipliği, gerçek oy/ACK ve yeniden bağlantı, savaş bitişi/haber ve insan ambargo koruması geçti. Misafir simülasyon yürütmez; yeni komut/ağ alanı eklenmedi.
- Son kampanyaların tamamında yeni VM'de120. ay Save8 yükleme kontrolü var.
- [Gerçek P0.2 p8 paketi](evidence/beta-setup0/compat-p8.json) p9'da doğrulandı/yüklendi; RNG, kimlikler ve tarih korundu. Paket etiketini yapay değiştirme yok.
- [Gerçek eski P0.2 KAPALI Save8](evidence/beta-setup0/legacy-load.json) yüklemede korsanlar temizlenirken RNG/ID/kalıntılar korundu; mevcut kullanıcı dosyası değiştirilmedi. Monster koruması ve transaction geri alma ayrıca unit testte.

Save8 **v8**, MP paket **4**, protokol **1**. Yeni şema alanı yok. AÇIK kayıtlar aynı davranır; eski hatalı KAPALI kayıtların korsan içeriği **bilinçli onarılır**, bu kayıtların eski hatalı baytlarıyla eşitlik iddia edilmez. Yeni rastgele çekim eklenmedi. Normal AI stratejisi/ekonomi/savaş/diplomasi karar kuralları değişmedi; KAPALI Korsan Çağı'nın enerji cezası da doğal olarak kalkar.

## 6. PASS / FAIL / NOT RUN

[Native son sonuçlar](evidence/beta-setup0/native-final-results.json), [tekrar üretim ve ilk FAIL'ler](evidence/beta-setup0/RUN-NOTES.md).

| Test | Gerçek son sonuç |
|---|---:|
| Seed11/99/404 kampanya kabul grupları,0/30/120, doğrudan eşdeğerlik/tekrar/yükleme | **3/0 PASS**;12 tam koşu |
| Korsan üretim/çağ/tehdit/legacy/rollback hedefli | **10/0 PASS** |
| Gerçek Pregame SP + yeni süreçte yükleme | **2/0 PASS** |
| MP ayar + P0.2 panel/oy/barış/ambargo | **4/0 PASS** |
| Konsey çekirdeği / çift-eski oy | **14/0 /3/0 PASS** |
| Savaş bitişleri / insan-AI ambargo | **5/0 /5/0 PASS** |
| Haber gizliliği/kimliği / geri dönüş / ayna | **8/0 /3/0 /3/0 PASS** |
| Save8 sınırları / MP4 kayıt çekirdeği | **19/0 /14/0 PASS** |
| Önceki p6/p7 paket uyumu + eski oy | **4/0 PASS**; ayrıca gerçek p8 paket yükleme PASS |
| PERF1 / PERF2 / MP86 piksel önbelleği | **4/0 /5/0 /3/0 PASS** |
| Native Canvas filo etiketleri / ticaret-AI bütçe | **30/0 /17/0 PASS** |
| Sıkı kaynak SHA/hunk koruması | **PASS** |
| ZIP iki üretim, üye CRC/SHA ve çıkarılmış19 runtime manifesti | **PASS** |
| Bu fazda tam MP73 B1–B4, MP75, MP8 N/R uzun kampanyaları | **NOT RUN**; P0.2 sonuçları yeniden koşulmuş gibi gösterilmedi |
| Fiziksel Android, gerçek LAN/internet, canlı Render, Docker image build/deploy | **NOT RUN** |

**İlk FAIL kayıtları silinmedi:** P0.2 başlangıç0/3 gerçek ürün hatası; ayrı Korsan Çağı9/1 gerçek eksik yol. İlk test taslağında normal AI `wild` alanının false yerine undefined olması7/1, isyanda anlık filo varsayımı8/1 fikstür hatalarıydı; gerçek bayrak/devlet/koloni çıktısı doğrulandı. PERF2 kaynak adaptörünün sentetik `economy.js,'x'` girdisini yanlış kapsamda hash'lemesi4/1; adaptör yalnız PERF2'nin gerçek ai/main alanına sınırlandı, son5/0. Eski loglar [burada](evidence/beta-setup0/).

Timeout büyütme, force, sahte JavaScript click veya assertion silerek PASS üretme yapılmadı. P0.2'nin tarihsel aralıklı lobi/dokunma riski bu dar fazda çözülmüş sayılmaz; yeni hedefli koşular geçti. Nadir canavar/olay dalları unit testte kontrollü RNG fikstürüyle, doğal120 ay davranışı ayrı kampanyayla test edildi.

## 7. Sürüm, paket ve dosya hashleri

- Oyun **96h10p9**, PWA **stars-v96h10p9**, MP **MP.8.9b4**. [Yerel endpoint/arayüz ve8 MP dosya hash'i](evidence/beta-setup0/version-contract.json) son dosyalarla eşleşti.
- [Dağıtım ZIP'i](../../releases/stars-faz96h10p9.zip): **781579 byte**,20 üye =19 oyun runtime+manifest. İki üretim bayt bayt aynı, üye CRC/SHA'ları PASS.
- ZIP SHA-256: **b91bb9a089796582b4442ef7ffe7dc2400b838ac0ddc26414d8b605b3d12f3b0**.
- ZIP CRC32: **4ac677cf**.
- RELEASE-MANIFEST SHA-256: **1c72a957ed87ef8dc6f65af1921e6f1f8b446ac1ae3e59d8333ce9fb5997a2ac**.
- [RELEASE-VERIFIED](evidence/beta-setup0/RELEASE-VERIFIED.json): bütün ZIP üyelerinin hash/CRC'leri. [Değişen runtime/MP dosyaları önce/sonra SHA-256](evidence/beta-setup0/CHANGED-FILES-SHA256.json). [Çıkarılmış paket doğrulaması](evidence/beta-setup0/extracted-verify.log).
- MP relay/client dosyaları oyun ZIP'inden ayrı mevcut Docker dağıtım yolundadır. Yeni dosya/enjeksiyon/allowlist yolu eklenmedi; Docker COPY mevcut değişen dosyaları kapsar. Oyun ZIP'i bütün MP sunucusunu içeriyor diye sunulmaz. Render'a bağlanılmadı/deploy/restart yapılmadı.

## 8. GitHub / #41 gerçek durumu

Kod/kanıt/ZIP geliştirme dalına push edildi ve uzak kod HEAD doğrulandı. Yeni P0.2 tabanlı taslak PR **bir kez** denendi; `Post "https://api.github.com/graphql": Forbidden`, oluşturulmadı. [Özgün PR hata](evidence/beta-setup0/pr-create.log), [karşılaştırma/PR oluşturma](https://github.com/sarsiss12-dot/Star/compare/codex/stars-beta-p02-mp-acceptance...codex/stars-beta-setup0-pirates?expand=1).

#33'e yalnız #41 için başlangıç AJANA VERİLDİ/GELİŞTİRMEDE ve sonuç RAPOR GELDİ/TEST BEKLİYOR **ek yorum** denemeleri yapıldı; ikisi de GitHub API Forbidden ile engellendi. Gövde topluca yeniden oluşturulmadı veya geçmiş silinmedi. [Başlangıç hata](evidence/beta-setup0/issue33-start.log), [son hata](evidence/beta-setup0/issue33-result.log), [kaydedilemeyen sonuç yorumu](evidence/beta-setup0/ISSUE41-SONUC-YORUMU.md).

**GitHub'daki gerçek #41 durumu: PROMPT HAZIR**; yazılamayan geliştirme/rapor aşamaları kaydedilmiş gösterilmez. Son pano doğrulaması ve diğer görevlerin durum karşılaştırması [issue33-verification.json](evidence/beta-setup0/issue33-verification.json). Promptun “diğer41” ifadesinden farklı olarak ilk herkese açık kontrolde pano43 görev içeriyordu; kapsam genişletilmedi, #41 dışındaki tüm mevcut durumlar korundu. Hiçbir görev TAMAMLANDI yapılmadı, kullanıcı onayı beklenir.

## 9. Kalan riskler ve fiziksel kabul

- Fiziksel yatay Android'de KAPALI başlatma, harita/keşif etiketleri, kayıt-yükleme ve gerçek host/misafir ayarı kullanıcı onaylı dağıtımda denenmeli. AÇIK kontrolünde yuvalar görünmeli; KAPALI'da canavar veya kalıntı savunması korsan sanılmamalı.
- Gerçek LAN/internet/Render kabulü yok. Tarihsel aralıklı lobi/dokunma riski ayrı açık iş olarak kalır. Bu faz tam beta yayın onayı değildir.
- Eski hatalı KAPALI kayıtta korsan varlıkları yüklenen kopyada kaldırılır; disk dosyası ve geçmiş savaş/ticaret haberleri silinmez. Normal savaş baskınlarının geçmiş rota engelleri korunur.
- #33 durum yazımı ve PR API engelli; rapor/kod GitHub dalında teslim edilir. Merge/canlı dağıtım için kullanıcı onayı gerekir.

**Sonraki faz: kullanıcının belirttiği #8 / BETA-UX.0 devlet isimleri.** Bu faza isim veya yıldız kapısı kodu eklenmedi.
