# MP.3 — insan oyuncular arası gerçek diplomasi (geliştirme prototipi)

**Oyun sürümü değildir; sunucuya dağıtılmadı.** 19 runtime dosyası, Save8, build `96h10` ve `releases/stars-faz96h10.zip` değişmedi.

Belgeler:

- Mimari: `../../MULTIPLAYER-MP3-MIMARI.md`
- Telefon ekranı ve akış: `../../MULTIPLAYER-MP3-DIPLOMASI.md`
- Sonuçlar: `../../MULTIPLAYER-MP3-SONUC.md`

## Dosyalar

| Dosya | Görev |
|---|---|
| `client/dip-ui.js` | Ortak diplomasi ekranı (misafir DİPLOMASİ sekmesi + host MP paneli): DEVLETLER, GELEN, GÖNDERİLEN, GEÇMİŞ, teklif taslağı (BEN VERİYORUM / BEN İSTİYORUM, 100/250/500/1000/MAKS, elle giriş), host önizlemesi (`quote`), iki adımlı onay. Motor ve kural kopyası yok |
| `client/mp3.css` | Telefon düzeni (≥44 px, taşma yok, dikey/yatay; beş sekmeli alt gezinti) |
| `evidence/` | `browser-mp3.cjs` çıktısı (`mp3-results.json`) ve ekran görüntüleri |

## Host tarafındaki değişiklikler

`../mp0/mp-core.js`:

- komutlar: `quote` (salt okuma), `offer`, `respond`, `counter`, `withdraw`;
- oturum teklif deposu ve süpürme;
- `dip` görünümü;
- AI → uzak insan yönlendirmesi (`aiToHuman`);
- `local()`: host paneli aynı `execute()` yolundan geçer.

`../mp1/client/mp1-host.js`:

- `hostNotify` → `say`;
- küçük panelde DİPLOMASİ düğmesi ve tam ekran panel.

`../mp2/client/guest-game.js`:

- beşinci sekme ve rozet;
- komut sonucunun `cid` ile ekrana dönmesi;
- kişisel bildirimlerin gösterimi.

Relay izin listesi, `join.html`, host sayfası enjeksiyonu, Dockerfile ve `.dockerignore` iki yeni dosyayı içerir.

## Testler

```sh
node tests/mp3_core_test.js            # gerçek motor (vm): kabul = doğrudan executeDeal (Save8+RNG eşit), karşı teklif, ret, yarış,
                                       # yetki/doğrulama, atomiklik (executeDeal içine hata), barış, insan→AI, doğal AI→insan, gizlilik, tek oyunculu kimlik
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=/abs/out node tests/browser-mp3.cjs
#   4 ayrı Chromium süreci (host + 3 misafir), gerçek dokunma ve klavye, 5 görünüm, ağ gizliliği, performans
```
