# MP.4 — çok oyunculu kayıt / yükleme, odayı yeniden açma, oyuncu kimliği (geliştirme prototipi)

**Oyun sürümü değildir; sunucuya dağıtılmadı.** 19 runtime dosyası, Save8, build `96h10` ve `releases/stars-faz96h10.zip` değişmedi.

Belgeler:

- Mimari: `../../MULTIPLAYER-MP4-MIMARI.md`
- Kayıt / yükleme akışı: `../../MULTIPLAYER-MP4-SAVE-LOAD.md`
- Güvenlik: `../../MULTIPLAYER-MP4-SECURITY.md`
- Sonuçlar: `../../MULTIPLAYER-MP4-SONUC.md`

## Dosyalar

| Dosya | Görev |
|---|---|
| `client/mp4-save.js` | `MP4Save`: IndexedDB (`stars-mp4`/`saves`; elle 12, otomatik oyun başına 3), tek dosya dışa aktarma (Blob indirme), dosyadan okuma. Paket üretmez/doğrulamaz |
| `client/mp4.css` | Kayıt kartları, devam lobisi koltuk satırları (≥44 px, yatay taşma yok) |
| `evidence/` | `browser-mp4.cjs` çıktısı (`mp4-results.json`) ve ekran görüntüleri |

## Host / misafir tarafındaki değişiklikler

- `../mp0/mp-core.js`: `sha256`, `canon`, `validatePackage`, `loadWorld`, `upgradeLegacy` (modül), `snapshot`, `restoreSession`, `resumeStart`, `recoverSeat` (host), jeton özetiyle dönüş, `resume` lobi aşaması, `__mpCur` koruma yönlendirmesi.
- `../mp1/client/mp1-host.js`: KAYITLI OYUNA DEVAM ET / KAYITLARI YÖNET, DOSYADAN AÇ, DEVAM LOBİSİ, oyun içi OYUNU KAYDET / DOSYAYA AKTAR, otomatik kayıt.
- `../mp1/client/join.js`, `view.js`: kayıt kimliği (`mp4:save:<saveId>`), devam lobisi, "Eski devletin bulundu" / "Kimliğin doğrulanmadı".
- `../mp1/server/relay.js`: izin listesi + sayfa enjeksiyonu; `deploy/Dockerfile`, kök `.dockerignore`.

## Testler

```sh
node tests/mp4_core_test.js     # iki ayrı vm bağlamı (kaydeden / yükleyen), kimlik, teklif/oy/vasallık sürekliliği, Save8/RNG eşitliği, bozuk paketler, performans
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=/abs/out node tests/browser-mp4.cjs
#   relay ayrı Node süreci (yeniden başlatılır), kalıcı profilli host Chromium gerçekten kapanır ve yeni süreçte açılır,
#   misafirler ayrı Chromium; IndexedDB + dosya indirme/seçme, devam lobisi, kurtarma, 5 görünüm, performans
```
