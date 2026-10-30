# STARS — MP.4 sonuç raporu: çok oyunculu kayıt/yükleme, odayı yeniden açma, oyuncu kimliği, diplomatik kalıcılık

Dal: `claude/stars-mp4-save-load`. Taban: `main` `ff0a4187a2fa2adedf535fdf981cbc25cc85e63d` (96H.10 + MP.0 – MP.3.1).

**Karar: yayımlanmayan geliştirme prototipi.**

- Host çok oyunculu galaksiyi telefonuna (IndexedDB) ya da tek dosyaya kaydedebiliyor.
- Host tarayıcısını tamamen kapatıp sonra yeni bir odada açabiliyor; aynı insan oyuncular cihazlarındaki kimlikle aynı devletlere dönüyor.
- Filolar, araştırma, MP.3 teklifleri/karşı teklifleri, federasyon oyları ve vasallık müzakereleri yükleme sonrasında sürüyor.
- Runtime (19 dosya), build `96h10`, PWA `stars-v96h10`, Save8 ve kanonik ZIP değişmedi.
- Kalıcı internet sunucusu yok. Fiziksel Android, gerçek internet ve LAN: NOT RUN.

## 1. Başlangıç doğrulaması

| | Sonuç |
|---|---|
| `main` HEAD | `ff0a4187a2fa2adedf535fdf981cbc25cc85e63d` |
| ZIP | `releases/stars-faz96h10.zip`, SHA-256 `78e76d1627b8ec1b990849b2242835f78667f110e1d6f17021760183ee7be6d0`, CRC32 `cf97cc3a` |
| Manifest | 19 runtime dosyasının SHA-256'sı çalışma ağacıyla eşit; build `96h10`, PWA `stars-v96h10`; `BUILD_ID` / `CACHE` eşleşiyor |
| `verify-release.py --root <ZIP çıkışı>` | DOĞRULANDI (19 dosya) |
| Runtime farkı (`git diff ff0a418` — 19 dosya + manifest + releases) | boş |

## 2. Mevcut `meta()` / `restore()` analizi

Ayrıntı: `MULTIPLAYER-MP4-MIMARI.md` §1. Özet: MP.0 meta'sı jetonları açık yazıyordu, bütünlük FNV'ydi ve yalnız Save8'i kapsıyordu,
MP.3 teklif deposu ve lobi durumu kayda girmiyordu, kurulan korumalar ilk host'a bağlı kalıyordu. Save8 (oyun durumu) ve motorun
işlemli `deserialize`'ı olduğu gibi kullanıldı; yeni kayıt motoru yazılmadı.

## 3. Değişen dosyalar

- **Çekirdek** — `research/mp0/mp-core.js`: paket (`snapshot`, `validatePackage`, `loadWorld`, `upgradeLegacy`), saf JS SHA-256 + kanonik JSON,
  `restoreSession` / `resumeStart` / `recoverSeat`, jeton özetiyle dönüş ve yenileme, `resume` lobi aşaması, oyun sürerken kimlik sorma,
  `installGuards` → `root.__mpCur`.
- **Yeni:** `research/mp4/client/mp4-save.js`, `research/mp4/client/mp4.css`, `research/mp4/README.md`, `research/mp4/evidence/` (43 PNG + JSON + örnek kayıt).
- **İstemci:** `research/mp1/client/mp1-host.js` (menü, kayıt listesi, dosyadan açma, devam lobisi, oyun içi kaydet/aktar, otomatik kayıt),
  `research/mp1/client/join.js` (kayıt kimliği, devam el sıkışması, devam lobisi), `research/mp1/client/view.js` (metinler).
- **Relay ve dağıtım:** `research/mp1/server/relay.js` (izin listesi + host sayfası enjeksiyonu), `research/mp1/deploy/Dockerfile`, `.dockerignore`.
- **Testler:** yeni `tests/mp4_core_test.js` (13), `tests/browser-mp4.cjs` (13); beklenen liste güncellenen (gevşetme yok): `tests/mp1_relay_test.js`, `tests/browser-mp1.cjs`.
- **Belgeler:** `MULTIPLAYER-MP4-MIMARI.md`, `-SAVE-LOAD.md`, `-SECURITY.md`, bu dosya, `PROJE-DURUMU.md`, `CLAUDE.md`.

## 4. Test sonuçları

### `tests/mp4_core_test.js` — 13/13 PASS (Node vm; kaydeden ve yükleyen İKİ AYRI vm bağlamı)

Dünya seed 22, orta, 5 AI; B = 3, C = 5. Açık fikstür: siyasi başlangıç (temas, Etki/kaynak, C'ye ek filo, AI 1 başkanlığında {1, 2, B} federasyonu).

1. Senaryo: inşa + filo hareketi komutları, MP.3 teklif → karşı teklif (tur 2, B'nin kararı bekliyor) + ikinci bekleyen teklif, AI başkanın yasa önerisi (B'nin oyu bekliyor), vasallık himaye isteği → C karşı teklif (tur 2).
2. Kayıt: alan kümesi tam; dosyada jeton yok (yalnız tuzlu özet); kayıt Save8/RNG'yi değiştirmiyor; yarım işlemde `busy`.
3. Yeni süreçte yükleme: dünya, aynı Save8'in motorla ayrı bir vm'de yüklenmesiyle aynı; RNG aynı; B ve C kendi jetonuyla 3 ve 5'e döner, jeton yenilenir; host başlatana kadar zaman ilerlemez.
4. Kimlik güvenliği: uydurma jeton, başka kaydın jetonu, yenilenmiş eski jeton → koltuk yok; ziyaretçi talep (`phase`) / komut (`not-started`) yapamaz; kurtarma yalnız bağlı olmayan koltuk; devamda ziyaretçi çıkarılır.
5. DEVAM ET sonrası geç dönüş: C yokken oyun sürer (C devleti `ai:false`); jetonsuz yabancıya yalnız kayıt kimliği sorulur, oyuncu kaydı açılmaz; uydurma jeton `game-started`; bağsız bağlantı komutu `not-joined`; C jetonuyla döner (jeton yenilenir).
6. MP.3 kalıcılığı: teklif deposu (kimlik, durum, tur, `prev`, `next`) aynen; B karşı teklifi kabul eder → kaynaklar tam bir kez (−250/+60, +250/−60); ikinci kabul ve eski tur `rules:closed`; eski `seq` `stale-seq`; ikinci bekleyen teklif hâlâ kabul edilebilir; süre oyun zamanıyla dolar.
7. Federasyon: yükleme sonrası 40 gün geçse de B'nin oyu AI tarafından verilmez; B kendi oyunu verir; korumalar yeni host'a bağlı (aynı sayfada ikinci host dahil).
8. Vasallık: bekleyen karşı teklif yüklenir; eski tur `rules:stale`, alıcı olmayan `rules:not-recipient`; kabul → sözleşme; sonraki ay vergi motorla akar.
9. Save8/RNG eşitliği (bkz. §15).
10. Bozuk/sahte paket tablosu (bkz. §16) + yükleme hatasında önceki dünya geri.
11. Eski `mpMeta:1` yükseltmesi (FNV eşleşmesi zorunlu; açık jetonlar özete çevrilir).
12. SHA-256 FIPS 180-4 vektörleri + Node `crypto` ile aynı.
13. Performans 45 / 60 / 100 sistem (bkz. §21).

### `tests/browser-mp4.cjs` — 13/13 PASS (ayrı süreçler, gerçek kapanış)

Süreçler: relay ayrı Node süreci (durdurulup aynı portta yeniden başlatıldı; PID değişti), host kalıcı profilli Chromium
(IndexedDB diskte; tarayıcı süreci gerçekten kapandı — PID'in yaşamadığı denetlendi — ve yeni PID ile aynı profilden açıldı),
B ayrı Chromium, C kalıcı profilli Chromium (o da kapanıp yeni süreçte açıldı), izinsiz kişi ve yabancı ayrı Chromium'lar.

1. Kurulum: gerçek lobi → oyun; menüde KAYITLI OYUNA DEVAM ET / KAYITLARI YÖNET; MP.3 karşı teklifi, federasyon oyu ve vasallık karşı teklifi bekliyor.
2. Kayıt: oyun içi **OYUNU KAYDET** (IndexedDB) ve **DOSYAYA AKTAR** (gerçek tarayıcı indirmesi, `stars-mp-yeni-hanedan-y2210-a2.starsmp.json`); Save8/RNG değişmedi; dosyada canlı jetonların hiçbiri yok; misafir cihazında `mp4:save:<saveId>` var.
3. Gerçek kapanış: C tarayıcısı ve host tarayıcı süreci kapandı; B "Host bağlı değil"; relay yeniden başladı; B "Sunucu yeniden başlatıldı; oda kapandı."
4. Yeniden açılış: yeni host süreci → KAYITLI OYUNA DEVAM ET → kart (ad, Yıl/Ay, Bora, Cem, Elle kayıt) → DEVAM ET → onay → yeni oda kodu + DEVAM LOBİSİ. Dünya = aynı Save8'in motorla ayrı sayfada yüklenmesi; RNG ve gün kayıttakiyle aynı; teklif deposu, federasyon oyu ve vasallık müzakeresi bayt olarak aynı; 2,5 s beklemede gün ilerlemedi, hız 0.
5. Dönüş: B yeni kodla → "Eski devletin bulundu: Altın Othrys Konfederasyonu", jeton yenilendi. İzinsiz kişi "Cem" adıyla → "Kimliğin doğrulanmadı"; uydurma jeton, talep (`phase`) ve komut (`not-started`) geçmedi; C'nin koltuğu boş kaldı. 5 görünümde host ve misafir devam lobisi.
6. DEVAM ET (C yok → onay): izinsiz kişi "Oyun başladı; yeni oyuncu alınmıyor." ile çıkarıldı; B oyunda devlet 3; 20 gün sonra C devleti `ai:false`, B'nin oyu hâlâ bekliyor, `__mpHumanVoter(3)` doğru.
7. Geç dönüş: jetonsuz yabancı "… bu cihazda bu kayda ait oyuncu kimliği yok …" ile reddedildi (oyuncu kaydı açılmadı); C yeni süreçte aynı profille, yeni kodla katıldı → oyun sürerken devlet 5.
8. Diplomasi sürer: B karşı teklifi kabul etti (tam bir kez); eski tur ve ikinci kabul reddedildi; B FEDERASYON ekranından gerçek dokunmayla oy verdi (oyu kayıtlı); vasallıkta eski tur `rules:stale`, tur 2 kabulü → B, C'nin vasalı (Enerji %10).
9. İkinci kayıt: ~36 oyun ayında otomatik kayıt sayısı tam 3 (sınır); elle kayıt + dışa aktarma; host süreci yine kapandı.
10. Dosyadan açma (boş profil, yeni host süreci): bozuk JSON ("Dosya okunamadı"), Save8'i değiştirilmiş dosya ("oyun özeti tutmuyor") ve tek oyunculu Save8 ("Kayıt eksik ya da bozuk") reddedildi, durum değişmedi; geçerli dosya → kart → devam lobisi; RNG, gün ve vasallık aynı.
11. Kimlik kurtarma: C temiz tarayıcıyla → ziyaretçi; yalnız bağlı olmayan C koltuğu seçenek; Vazgeç hiçbir şey değiştirmedi; onaylı KİMLİĞİ KURTAR → C devlet 5; B kendi yenilenmiş jetonuyla döndü; herkes bağlıyken DEVAM ET onaysız.
12. KAYITLARI YÖNET: ilk profil yeniden açıldı; liste elle + otomatik (5 kayıt); DIŞA AKTAR geçerli paket üretti; SİL onay ister (Vazgeç → kalır, Sil → gider); menü ve liste 5 görünümde.
13. Performans: gerçek tarayıcıda 45 / 60 / 100 sistem.

Ortam notu (test yöntemi): bu konteynerde aynı kalıcı Chromium profili **yeniden** açıldığında indirme tıklaması `.crdownload`'da kalıyor
ya da tarayıcıyı çökertiyor (boş sayfayla yeniden üretildi; oyun kodundan bağımsız). Gerçek indirme ilk oturumda doğrulandı; yeniden açılan
oturumlarda dışa aktarma kodunun ürettiği Blob ve `<a download>` adı sayfada yakalandı, yerel indirme tetiklenmedi.

## 5–14. Konu bazında

| Konu | Sonuç |
|---|---|
| Yeni biçim/sürüm | `stars-mp-save`, `mpVersion` 4; alanlar `format, mpVersion, build, createdAt, saveId, session, diplomacy, display, save8, integrity` |
| Yerel kayıt + dışa aktarma | IndexedDB (elle 12 / otomatik 3), Blob indirme; hata mevcut kayıtları silmez |
| Dosyadan yükleme | dosya seçici → doğrulama → onay → yükleme; bozuk dosya durumu değiştirmez |
| Yeni odada devam | yeni oda kodu, `resume` lobisi, DEVAM ET'e kadar zaman durur |
| Sahiplik | B→3, C→5 (Node ve Chromium); izinsiz kişi devlet alamadı |
| Jeton güvenliği | dosyada jeton yok; tuzlu SHA-256 özet; dönüşte yenileme; eski jeton ölür |
| Devam lobisi | host: ad, tarih, boyut, insanlar, bağlı/bekleniyor, davet kodu, kurtarma, DEVAM ET; misafir: "Eski devletin bulundu" / "Kimliğin doğrulanmadı", bekleme, bağlantı |
| MP.3 teklifleri | bütün alanlar, turlar, `prev`, geçmiş; yükleme sonrası yeniden doğrulama, tek uygulama, eski tur reddi |
| Karşı teklif ve süre | tur 2 kabulü çalıştı; süre oyun zamanıyla doluyor |
| Federasyon oyları | bekleyen uzak insan oyu AI'ya verilmedi; insan kendi oyunu verdi |
| Vasallık | bekleyen karşı teklif yüklendi; kabul → sözleşme; vergi aktı |

## 15. Save8 ve RNG eşitliği

- Kayıt alma ve yükleme RNG tüketmiyor (Node ve Chromium: kayıt öncesi/sonrası `RND_STATE` ve Save8 aynı; tuz Web Crypto'dan).
- **Kontrol** (aynı süreçte kayıt + motorun yükleme normalleştirmesi `deserialize(serialize())`) ile **yeni süreçte yükleme**, aynı komutlar (kabul, oy, vasallık kabulü) ve 60 gün sonra: **Save8 bayt bayt aynı, RNG aynı**.
- **Hiç yüklenmemiş dünya** ile: RNG aynı; Save8, `_` önekli motor önbellekleri dışında karşılaştırıldı → **fark yok** (testin izin verdiği tek istisna habitat gözlem damgası; bu koşuda o da yok).
- Motorun `deserialize`'ı türetilmiş alanları yeniden hesaplıyor; bu yüzden yükleme sonrası dünya, kayıttan önceki bellek durumuyla değil, aynı Save8'in motorla yüklenmesiyle bayt eşit (Chromium'da ayrı sayfada denetlendi).

## 16. Bütünlük ve bozuk dosya testleri

Node testinde reddedilen ve hata kodu doğrulanan (sahte paketler özetleri yeniden hesaplanarak "imzalandı", yani yalnız bütünlüğe güvenilmedi):

- bozuk JSON ve dizi (`json`); eksik alan (`fields`); yanlış biçim (`format`); `mpVersion` 3 (`version`);
- başka build (`build`, pakette ve beklenen tarafta); 32 MB üstü metin (`too-big`);
- Save8'de değişiklik (`integrity-save8`), gövdede değişiklik (`integrity-body`); okunamayan Save8 (`save8-json`); Save v7 (`save-version`);
- aynı devlete iki oyuncu ve misafir host devletinde (`dup-empire`), yinelenen oyuncu (`dup-player`), geçersiz devlet 99 (`bad-empire`);
- host'a jeton özeti eklenmiş ya da host kimliği değiştirilmiş sahte host (`host`); eksik/bozuk jeton özeti (`auth`);
- negatif miktar (`amount`), bilinmeyen madde (`items`), tutarsız tur zinciri (`round`), geçersiz teklif kimliği (`offers`);
- insan devleti dünyada AI olan paket (`slot-state`) ve motorun uygulayamadığı Save8 (`save8-apply`): ikisinde de önceki dünya geri yüklendi, RNG aynı.

Chromium'da dosya seçiciyle: bozuk JSON, Save8'i değiştirilmiş dosya, tek oyunculu Save8 → reddedildi, durum değişmedi.
Komut düzeyi (yükleme sonrası): eski tur, kapanmış teklif, eski `seq`, uydurma/yenilenmiş jeton, ziyaretçi komutu/talebi, bağsız bağlantı komutu.

## 17. Android yükleme ekranı

- Menü: ODA OLUŞTUR, ODAYA KATIL, KAYITLI OYUNA DEVAM ET, KAYITLARI YÖNET, GERİ.
- Kart: ad, tarih, boyut, insanlar, son kayıt zamanı, DEVAM ET, DIŞA AKTAR, SİL (onaylı).
- 360×800, 390×844, 412×915, 844×390, 915×412: menü, kayıt listesi, dosya kartı, host devam lobisi, misafir devam lobisi ve ziyaretçi lobisi —
  yatay taşma yok, bütün dokunma hedefleri ≥ 44 px, en küçük yazı ≥ 11 px (Chromium mobil dokunmatik bağlamda ölçüldü).
- Tek oyunculu başlık menüsü (YENİ OYUN / OYUNA DEVAM ET / ÇOK OYUNCULU / AYARLAR) değişmedi (`browser-mp1`).

## 18–20. Chromium uçtan uca, gerçek kapanış, kopma/dönüş

`browser-mp4` §4. Host süreci iki kez gerçekten kapandı ve üç farklı host süreci açıldı (biri boş profille dosyadan); relay süreci yeniden başlatıldı;
C'nin tarayıcı süreci kapanıp yeniden açıldı. Bağlantı durumları ayrı metinlerle gösteriliyor (`MULTIPLAYER-MP4-SAVE-LOAD.md` §5).

## 21. Performans ve dosya boyutları

| Ölçüm | 45 sistem | 60 sistem | 100 sistem |
|---|---|---|---|
| Paket boyutu (gün 0) | 58 KB | 76 KB | 118 KB |
| Node: kayıt / doğrulama / yükleme | 18 / 21 / 200 ms | 15 / 25 / 239 ms | 44 / 5 / 244 ms |
| Chromium: kayıt / doğrulama / yükleme / IndexedDB yazma | 31 / 24 / 74 / 105 ms | 9 / 10 / 32 / 10 ms | 8 / 4 / 24 / 17 ms |

- Senaryo dünyası (45 sistem, yıl 2210): 89 KB; ~3 oyun yılı sonra 440 KB (geçmiş kayıtları büyüyor).
- Chromium: OYUNU KAYDET dokunuşundan bildirime 0,8 s; kayıttan devam lobisine (onay → yükleme → oda) 0,3 s.
- Ölçümler başsız Chromium + masaüstü CPU; telefon değil.

## 22. Regresyon

| Test | Sonuç |
|---|---|
| Tam Node regresyonu (`run-all`, 3 işçi) | **149 paket, 6200 PASS / 3 FAIL** (6187 referans + yeni `mp4_core_test` 13). 3 FAIL: bilinen `faz95d_identity_test.js` seed 11/99/404; yeni FAIL yok |
| `mp0_core` / `mp1_lobby_core` / `mp1_relay` / `mp11_online` / `mp1_actor_vision(_b)` / `mp2_core` / `mp3_core` / `mp31_core` / `mp4_core` | 11 / 7 / 14 / 9 / 2+2 / 7 / 11 / 15 / 13 — hepsi PASS |
| `browser-mp4` | 13/13 PASS |
| `browser-96h10` | 27/27 PASS |
| `browser-mp0` | 20/20 PASS |
| `browser-mp1` | 22/22 PASS |
| `browser-mp11` | 10/10 PASS |
| `browser-mp2` | 14/14 PASS |
| `browser-mp3` | 12/12 PASS |
| `browser-mp31` | 11/11 PASS |
| ZIP / CRC / SHA / manifest | DOĞRULANDI, değişmedi |

## 23. Açık konular / MP.5

- **Kalıcı relay yok:** oda kodu her açılışta yeni; davet yeniden paylaşılmalı. Dağıtım ayrı faz kararı.
- **Dosya şifresiz:** kayıt dosyası bütün galaksiyi açık metin taşır (jeton yok). Paylaşılan dosya oyunun tamamını gösterir.
- **Bütünlük ≠ imza:** SHA-256 değişikliği yakalar; dosyayı kimin ürettiğini kanıtlamaz.
- **Oyun sürerken kimlik kurtarma yok:** host kurtarması yalnız devam lobisinde; DEVAM ET'ten sonra cihazını kaybeden oyuncu için host'un yeni bir devam lobisi açması gerekir.
- **Misafir cihazındaki kimlik:** `localStorage` silinirse kimlik kaybolur (kurtarma yolu var). Jeton yalnız son doğrulanan cihazda geçerli.
- **Eski MP.0 meta:** yükseltme işlevi var ve test edildi; arayüzde eski meta dosyası açma düğmesi yok (MP.0 meta'sı kullanıcıya hiç dışa aktarılmadı).
- **Otomatik kayıt** yalnız host ay sonunda alınır (yarım tick yok); arka planda sekme dondurulursa alınmaz.

## 24. NOT RUN

- Gerçek internet sunucusu (dağıtım yok, URL yok).
- Fiziksel Android telefon (Android Chrome indirme klasörü ve dosya seçici gerçek cihazda denenmedi).
- Aynı Wi-Fi'da LAN.
- Docker imaj derlemesi.
