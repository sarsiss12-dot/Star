# MP.2 — misafirin gerçek oynanışı (geliştirme prototipi)

**Oyun sürümü değildir; sunucuya dağıtılmadı.** 19 runtime dosyası, Save8, build `96h10` ve `releases/stars-faz96h10.zip` değişmedi.

Belgeler:

- Mimari: `../../MULTIPLAYER-MP2-MIMARI.md`
- Telefon ekranı: `../../MULTIPLAYER-MP2-MOBIL-HARITA.md`
- Sonuçlar: `../../MULTIPLAYER-MP2-SONUC.md`

## Dosyalar

| Dosya | Görev |
|---|---|
| `client/guest-game.js` | Misafir oyun ekranı. HARİTA (canvas; kaydır, iki parmak yakınlaştır, dokun-seç, SIĞDIR/BAŞKENT), FİLOLAR, KOLONİLER, BİLİM. İki adımlı filo emri (HEDEF SEÇ → GÖNDER). Motor yok; yalnız host görünümü okur ve komut gönderir |
| `client/mp2.css` | Telefon düzeni (≥44 px, taşma yok, dikey/yatay) |
| `evidence/` | `browser-mp2.cjs` çıktısı (`mp2-results.json`) ve ekran görüntüleri |

Host tarafındaki değişiklik `../mp0/mp-core.js` içinde:

- `move` / `research` / `researchMode` komutları;
- `viewFor` genişlemesi;
- temassız devlet maskeleme;
- `pure()` yayın koruması;
- uzak insanın araştırma bildirimleri.

MP.1 istemcisinde iki küçük değişiklik var:

- `../mp1/client/join.js` oyun ekranını `MP2Game`'e devreder;
- `../mp1/client/view.js` değişen bölümleri bildirir.

Relay izin listesi, Dockerfile ve `.dockerignore` yeni iki dosyayı içerir.

## Testler

```sh
node tests/mp2_core_test.js            # gerçek motor (vm): komut = doğrudan motor çağrısı (Save8 eşit), kurallar, yetki, gizlilik
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=/abs/out node tests/browser-mp2.cjs
#   3 ayrı Chromium süreci (host + 2 misafir), gerçek dokunma olayları, 5 görünüm, 45/60/100 sistem ölçümü
```
