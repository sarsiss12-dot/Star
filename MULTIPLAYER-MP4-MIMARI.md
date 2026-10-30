# STARS — MP.4 mimarisi: çok oyunculu kayıt, yükleme ve odayı yeniden açma

Durum: **geliştirme prototipi; yayımlanmadı, sunucuya dağıtılmadı.**

- 19 runtime dosyası, build `96h10`, PWA `stars-v96h10`, Save8 ve `releases/stars-faz96h10.zip` değişmedi.
- Yeni kayıt motoru yazılmadı. Oyun durumu motorun kendi `serialize()` / `deserialize()` işlevleriyle (Save8) yazılır ve okunur;
  MP.0'daki `meta()` / `restore()` oturum işlevleri genişletildi (`snapshot()` / `restoreSession()`), eski `meta()`/`restore()` aynen duruyor.
- Değişiklikler:
  - `research/mp0/mp-core.js`: paket (`snapshot`, `validatePackage`, `loadWorld`, `upgradeLegacy`), saf JS SHA-256, devam lobisi
    (`restoreSession`, `resumeStart`, `recoverSeat`), jeton özetiyle dönüş, koruma dağıtımının etkin host'a bağlanması;
  - `research/mp4/client/mp4-save.js`: telefonda saklama (IndexedDB) ve tek dosya dışa/içe aktarma;
  - `research/mp4/client/mp4.css`: kayıt ve devam lobisi ekranı;
  - `research/mp1/client/mp1-host.js`: menü düğmeleri, kayıt listesi, dosyadan açma, devam lobisi, oyun içi OYUNU KAYDET / DOSYAYA AKTAR, otomatik kayıt;
  - `research/mp1/client/join.js`, `view.js`: misafirin kayıt kimliği ve devam lobisi;
  - relay izin listesi + sayfa enjeksiyonu, Dockerfile, `.dockerignore`.

## 1. Mevcut altyapı analizi (MP.0 `meta()` / `restore()`)

| Konu | MP.0 durumu | Sorun | MP.4 |
|---|---|---|---|
| Oyun durumu | Save8 (`serialize`) ayrı tutuluyordu; meta yalnız oturum | Tek dosyada değil | Paket Save8 metnini olduğu gibi taşır |
| Oyuncu jetonları | `meta().players[].token` **açık** | Dosyayı gören herkes koltuk alabilir | Jeton dosyaya yazılmaz; oyuncu başına `{salt, hash=SHA-256(salt:token)}` |
| Bütünlük | `saveHash = fnv(save)` | FNV kriptografik değil, yalnız Save8'i kapsıyor | SHA-256: Save8 + kanonik gövde (oturum, teklifler, özet) |
| MP.3 teklif deposu (`D.offers`, `D.next`) | oturumda; meta'ya girmiyordu | Kayıtla kayboluyordu | Pakette `diplomacy` |
| Lobi | `restore()` lobisiz | Kayıt sonrası oyuncu dönüşü yok | `resume` lobi aşaması |
| Koruma (`installGuards`) | ilk host'un kapanışına bağlıydı | Aynı sayfada yeni host eski oyuncu tablosuna bakardı | `__mpCur` ile her `installGuards` etkin host'a yönlendirir |

Federasyon oyları (`G.feds[].vote`), vasallık müzakereleri (`vassalTalk`) ve sözleşmeler zaten Save8'in içinde; ayrıca saklanmaz.

## 2. Paket biçimi (`format: "stars-mp-save"`, `mpVersion: 4`)

```
{ format, mpVersion, build, createdAt, saveId,
  session:   { roomId, worldRevision, hostEmpireId, speed, capacity, settings, players[], notes },
  diplomacy: { next, offers[] },          // MP.3 teklif deposunun tam kopyası (tur, prev, durum, gerekçe, süre)
  display:   { name, year, month, day, size, systems, humans[] },
  save8:     "<motorun serialize() metni>",
  integrity: { alg: "SHA-256", save8: <hex>, body: <hex> } }
```

- `players[]`: `playerId, name, empireId, seat, color, lastSeq, wasAI, takeover, auth{salt,hash}` (host'ta `auth` yok).
- Pakete girmeyen: soket/bağlantı, jeton, host anahtarı, oda kodu, işlev, `_` önbellekleri dışında Save8'in kendisi ne içeriyorsa o.
- `integrity.body` = SHA-256( kanonik JSON( paket − integrity, `save8` yerine onun özeti ) ); kanonik JSON: sıralı anahtar, `undefined` atılır.
- Boyut sınırı: paket 32 MB, Save8 30 MB.

## 3. Kayıt alma (`host.snapshot()`)

- Yalnız `ingame` / `paused` aşamasında; yarım iş varken (`G._sideBuf`, `G._dealTxActive`, `G._loadTxActive`) `busy` döner. Kayıt ay/gün
  döngüsünün içinde değil, olay kuyruğundan (düğme, ay sonu sarmalayıcısı) alınır: yarım tick yoktur.
- Salt okunur: Save8 ve RNG değişmez (Node ve Chromium testinde ölçüldü). Tuz `opts.random` (Web Crypto) ile, RNG'den değil.
- Bağlı oyuncunun güncel jetonundan yeni tuzlu özet; dönmemiş oyuncunun eski özeti korunur (eski cihaz jetonu geçerli kalır).

## 4. Yükleme (`validatePackage` → `loadWorld` → `createHost({resume})`)

1. `validatePackage(metin)`: yan etkisiz. Sıra: boyut → JSON → eski meta → alan kümesi → biçim/sürüm/build → SHA-256 (Save8, gövde)
   → Save sürümü 8 → oturum şeması (tek host, geçersiz/yinelenen oyuncu, aynı devlete iki oyuncu, jeton özeti) → teklif deposu
   (kimlik, taraf, tur zinciri, miktar, madde) → özet. Her hata kendi koduyla döner (bkz. `MULTIPLAYER-MP4-SECURITY.md`).
2. `loadWorld(pkg)`: önceki dünyayı Save8 olarak tutar, motorun `deserialize`'ını çağırır (kendi işlemiyle geri alır); oturumdaki her
   insan devleti yüklenen dünyada `ai:false` değilse önceki dünyayı geri yükler (`slot-state`).
3. `createHost({resume: pkg})` → `restoreSession`: oyuncular bağlantısız ve jetonsuz (yalnız özet), koltuklar ayrılmış, teklif deposu ve kişisel
   bildirimler geri; lobi `resume` aşamasında. Host arayüzü yüklemeden hemen sonra `G.speed = 0` yapar; oyun **DEVAM ET**'e kadar ilerlemez.
4. `resumeStart()`: doğrulanmamış ziyaretçiler `game-started` ile çıkarılır, aşama `ingame`; kayıttaki hız geri gelir.

## 5. Dönüş ve kimlik

- Misafir her `assign` iletisinde (devleti varsa) jetonu oda kodundan bağımsız `localStorage["mp4:save:<saveId>"]` altında saklar.
- Yeni odada ilk selam jetonsuzdur (yeni oda kodu). Host:
  - `resume` aşamasında: oyuncuyu **ziyaretçi** olarak alır (en çok 4), `{type:'resume', saveId}` gönderir;
  - `ingame` / `paused` aşamasında ve dönmemiş koltuk varsa: oyuncu kaydı açmadan yalnız `{type:'resume', saveId}` gönderir;
  - misafir cihazında bu `saveId` için jeton varsa ikinci selamı jetonla gönderir. Eşleşen özet → aynı devlet, **yeni jeton** (eski jeton ölür).
- Jetonu olmayan: devam lobisinde ziyaretçi kalır (talep/komut yok), DEVAM ET'te çıkarılır; oyun sürerken "game-started" ile reddedilir.
- Host kurtarması (`recoverSeat`): yalnız devam lobisinde, yalnız bağlı olmayan koltuk, onay penceresiyle; jeton yenilenir.

## 6. Koruma (MP.3.1) sürekliliği

`installGuards` motor metnini bir kez değiştirir; uzak insan / AI→insan yönlendirmesi `root.__mpCur` üzerinden **en son kurulan** host'a gider.
Kayıt yüklendikten sonra yeni host kurulunca `__mpHumanVoter`, `aiNegotiate`/`aiRespond` yönlendirmesi ve AI engeli yeni oyuncu
tablosuna bakar (aynı sayfada ikinci host dahil test edildi). Uzak insan yokken davranış ve RNG değişmez.

## 7. Telefon katmanı

- `MP4Save` (IndexedDB `stars-mp4`/`saves`): elle kayıt en çok 12 (`full`), otomatik kayıt oyun başına son 3; eskisi yenisi yazıldıktan sonra silinir;
  yazma hatası mevcut kayıtlara dokunmaz.
- Dışa aktarma: Blob indirme, ASCII dosya adı `stars-mp-<ad>-y<yıl>-a<ay>.starsmp.json` (Android Chrome "İndirilenler"). İçe aktarma: dosya seçici.
- Otomatik kayıt: varsayılan 3 oyun ayında bir (`localStorage["mp4:autosaveMonths"]`, 0 = kapalı).

## 8. Kapsam dışı

Yeni AI ekonomisi, diplomasi kuralı, federasyon yasası, vasallık türü, filo komutu, sohbet, LAN/WebRTC ve dağıtım yok.
Kalıcı relay sunucusu yok; oda kodu her açılışta yenidir.
