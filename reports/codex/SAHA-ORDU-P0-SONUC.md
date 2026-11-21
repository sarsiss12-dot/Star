# STARS · SAHA-ORDU-P0 — Saha fetih sonrası taarruz ordusunun kaybolması

Tarih: 21 Kasım 2026

## Taban ve kapsam

- Taban: `8984b5107cae91016c41233409956e2cbb2523e2` · p47 / MP.8.9b46.
- Dal: `codex/stars-saha-ordu-kaybi-p0`.
- Kullanıcı saha kanıtı: host ve ikinci insan oyuncuda fetih sonrası yaklaşık 15K Taarruz Ordusu gücünün birden kaybolması; save sağlanamadı.
- Bu PR **sadece fetih sonrası ordu silinmesine** kod düzeyinde müdahale eder. Savaş hedefi, olay ve MP harita sorunlarını çözmüş saymayın.

## Kaynak kodunda doğrulanan kök neden

`economy.js` -> `invasionTick()` -> `TEMİZ İŞGAL`: Garnizon sıfırlanınca `K.tf` içindeki bütün hayatta kalan taarruz filolarına `fleetLost(tf,'rule','Kara ordusu işgal görevini tamamladı')` yazılıp `tf.ships.length=0` uygulanıyordu. Kalan kara gücünün %60'ı koloni garnizonuna çevriliyordu.

Bu, oyuncuya açıklama yapılmadan filo kaybolması anlamına geliyordu; doğrudan kaynak kanıtıdır. Gerçek savaş kaybından ayrı bir davranıştır.

## Yapılan küçük düzeltme

- Yüzey muharebesinde `orduKayip` ile gerçekleşen **gerçek zayiat** aynen kalır.
- Başarılı fetih sonrası hayatta kalan `K.tf` filoları ve gemileri artık **silinmez**.
- Yeni koloni `garrisonOf(col,G.emps[attacker],pl)` yerel garnizonuyla başlar; korunmuş Taarruz Ordusunun %60'ı tekrar garnizona kopyalanmaz.
- Mevcut fetih, nüfus/bina koruma, kayıt, sahiplik ve savaş defteri mantığı değişmez.
- Yeni kalıcı durum alanı veya RNG çekimi eklenmedi.

## Eklenen regresyon testi

`tests/saha_ordu_p0_test.cjs`: Gerçek `tests/fixtures/96h9/seed11-month66-siege.save` fikstüründen kara işgali tekrar üretilir; fetih anında canlı ordunun kimliği, gemi sayısı ve kara gücü korunur; yerel garnizonun ayrı olduğu, kayıt defterine sahte filo ölümünün yazılmadığı, aynı tohumda deterministik sonuç ve Save8 yeniden yükleme sabit noktası denetlenir.

Çalıştırma: `node tests/saha_ordu_p0_test.cjs`.

**Durum:** NOT RUN (bu oturumda bağlı kaynakları yerel Node test çalışma ortamında çalıştırmak mümkün değil). Bu, PASS kanıtı değildir.

## Sahadan bildirilen, HENÜZ çözülmemiş ilgili işler

1. **P1 — Fetih hedefi**: `WAR_FETIH_MAX=5`, `warFetihCandidates()` düşman başkentini hariç tutuyor, `warFetihMax()` en az bir sistem bırakıyor. Tek sistemli isyancı devlet Fetih hedefinden dışlanıyor. UI yalnız listeden seçim yaptırıyor, haritada claim yok. Çözüm: haritadan çoklu hedef belirleme, sınırı yeniden tasarlama (etki maliyeti/başarı kapasitesiyle dengeli), tek sistemli başkent ve isyan geri alma, savaş/barış/toprak paylaşım muhasebesi, AI/MP uyumu.
2. **P1 — Olaylar kapalı**: `CFG.randomEvents=false` yalnız rastgele olaylar, hikâye devamları ve çalkantıları durduruyor; diplomatik/askerî olay, anomali ve kritik bildirimleri genel olarak susturmuyor. Hangi olayların sahada görüldüğü henüz ayrıştırılmadı. Host kurulum ayarı -> oyun -> misafir görünümü doğrulanmalı; kapalıysa yeni rastgele `event/chain` doğmamalı. Arayüzde farklı olay türleri açıkça anlatılmalı.
3. **P1 — Olayları topluca kenara al**: `UI.noteSwipe` tekil bildirim gizliyor; üst üste bildirim/pencereleri tümden kenara alıp kararları Gelen Kutusu'nda koruyan eylem yok. Bekleyen kararları otomatik kabul/ret yapmadan, hız/pause ve host yetkisini bozmadan toplu gizleme/geri açma eklenmeli.
4. **P1 — MP harita**: Katılımcı büyük bölge armalarını açamıyor; host lojistikte yalnız devlet renkleri değişiyor. `BIG_EMBLEMS_ON` cihaz tercihi, `LOGI_ON` bağımsız katman; ayrıntılı ikmal hatları filo seçimiyle çiziliyor. Misafir görünürlük/araç erişimi ve hostta filo seçimi ayrı denetlenmeli.

## Görev kapsamı ve sürüm durumu

- Kod değişikliği: **hazır, inceleme bekliyor**.
- Testler: **NOT RUN**.
- Fiziksel Android / gerçek Render / LAN: **NOT RUN**.
- Canlı multiplayer doğrulaması: **NOT RUN**.
- Save8 / RNG eşdeğerliği: test yazıldı ama **NOT RUN**.
- `main` merge / yayın / Render branch değişikliği: **YOK**.
- Oynanabilir sürüm: **p47 olarak kalır**.

Hotfix dağıtımından önce hedefli test, eski saha varyantları, SP/MP host+guest ile fetih, mevcut `tests/faz96h9_invasion_test.js`, `tests/field_war_siege0_test.js`, `tests/faz95e1_random_event_switch_test.js` ve Save8/RNG kontrolü geçmelidir.
