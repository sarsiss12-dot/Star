# STARS — MP.4 güvenlik: kimlik, bütünlük, doğrulama

## 1. Jeton tasarımı

- Koltuk jetonu (16 bayt, Web Crypto) yalnız misafirin cihazında ve host belleğinde bulunur. **Kayıt dosyasına yazılmaz.**
- Pakette oyuncu başına `auth = {salt: 16 bayt hex, hash: SHA-256(salt + ":" + jeton)}`. Tuz her kayıtta yenidir.
- Dönüşte host gelen jetonu tuzla özetleyip karşılaştırır; eşleşirse **yeni jeton** verir ve özeti siler (eski jeton artık geçmez).
- Jetonlar konsola, URL'ye, lobi görünümüne ya da diğer misafire gitmez (MP.1 kuralları sürüyor). Misafir yalnız kendi jetonunu,
  oda kodundan bağımsız `localStorage["mp4:save:<saveId>"]` altında saklar. `saveId` gizli değildir (dosyada açık), yalnız arama anahtarıdır.
- Sınır: dosyayı ele geçiren biri jetonu bilmeden koltuk alamaz; ancak dosyada Save8'in tamamı (bütün galaksi) vardır —
  dosya, host'un oyununun tamamını açık metin olarak taşır. Şifreleme yok (MP.5 adayı).

## 2. Bütünlük ≠ kimlik doğrulama

- `integrity.save8` ve `integrity.body` SHA-256'dır (saf JS, FIPS 180-4 vektörleri ve Node `crypto` ile doğrulandı).
- Bu **kazara bozulmayı ve el ile düzenlemeyi** yakalar. Gizli anahtar olmadığı için dosyayı değiştiren biri özetleri yeniden
  hesaplayabilir: bütünlük, kaydı kimin yaptığını kanıtlamaz (imza yok). Testte yeniden imzalanmış sahte paketlerin şema ve
  oturum denetimleriyle reddedildiği ayrıca gösterildi.
- FNV (MP.0 `saveHash`) yalnız eski meta yükseltmesinde eşleşme denetimidir; güvenlik olarak sunulmaz.

## 3. Doğrulama kodları (`validatePackage` / `loadWorld`)

| Kod | Durum |
|---|---|
| `too-big` | paket > 32 MB ya da Save8 > 30 MB; dosya seçicide > 32 MB |
| `json` | geçersiz JSON / nesne değil |
| `legacy` | eski `mpMeta:1` doğrudan yüklenmez (`upgradeLegacy` ile yükseltilir) |
| `fields` | eksik/fazla alan, geçersiz `saveId`/`createdAt` |
| `format` / `version` / `build` | biçim, `mpVersion` 4, `BUILD_ID` eşleşmesi |
| `integrity`, `integrity-save8`, `integrity-body` | özet alanı bozuk; Save8 ya da gövde değişmiş |
| `save8-json`, `save-version` | Save8 okunamıyor; `v !== 8` |
| `session`, `host` | oturum şeması; tam bir host, host devleti = `hostEmpireId`, host'ta `auth` yok |
| `bad-empire`, `dup-player`, `dup-empire` | geçersiz devlet; yinelenen oyuncu; aynı devlete iki oyuncu |
| `auth` | jeton özeti yok/bozuk |
| `offers`, `round`, `amount`, `items` | teklif deposu; tur zinciri (`prev` = bir önceki tur, `countered`, taraflar ters); miktar; madde |
| `display` | özet |
| `save8-apply`, `slot-state` | motor yükleyemedi / insan devleti dünyada insan değil → **önceki dünya geri yüklendi** |
| `legacy-hash` | eski meta Save8 ile eşleşmiyor |

Komut düzeyinde (MP.0–MP.3.1'den, kayıttan sonra yeniden test edildi): sahte host, geçersiz jeton, eski tur (`rules:stale`),
kapanmış teklif (`rules:closed`), tekrar edilen `cid` (`dup`), eski `seq` (`stale-seq`), ziyaretçi komutu (`not-started`),
bağsız bağlantı komutu (`not-joined`), ziyaretçi talebi (`phase`).

## 4. Sahiplik kuralları

- Koltuk yalnız jetonla (özet eşleşmesi) ya da host'un onaylı kurtarmasıyla alınır.
- Kurtarma: yalnız devam lobisinde, yalnız **bağlı olmayan** koltuk (`seat-online`), host koltuğu değil (`seat`); jeton yenilenir,
  eski cihazın jetonu geçersizleşir.
- Bağlı olmayan oyuncunun devleti AI'ya geçmez (`ai:false` kalır; MP.1 "Devleti AI'ya ver" yalnız host'un açık işlemi).
- Uzak insanın bekleyen federasyon oyu AI tarafından verilmez (`__mpHumanVoter` yükleme sonrası yeni host'a bağlı).

## 5. Relay

Değişmedi: geliştirme relay'i TLS ve kimlik doğrulama olmadan internete açılmaz (MP.1.1 kuralları). Yeni dosyalar yalnız izin listesine eklendi.
