# MP.3.1 — federasyon siyaseti ve vasallık sözleşmeleri (geliştirme prototipi)

**Oyun sürümü değildir; sunucuya dağıtılmadı.** 19 runtime dosyası, Save8, build `96h10` ve `releases/stars-faz96h10.zip` değişmedi.

Belgeler:

- Mimari: `../../MULTIPLAYER-MP31-MIMARI.md`
- Federasyon: `../../MULTIPLAYER-MP31-FEDERASYON.md`
- Vasallık: `../../MULTIPLAYER-MP31-VASSALLIK.md`
- Sonuçlar: `../../MULTIPLAYER-MP31-SONUC.md`

## Dosyalar

| Dosya | Görev |
|---|---|
| `client/pol-ui.js` | FEDERASYON (GENEL / ÜYELER / OYLAMALAR / DAVETLER) ve VASALLIK (DURUM / GELEN / TEKLİF / GEÇMİŞ) bölümleri. Motor yok; veri host'un `pol` görünümünden, önizleme host'un salt okuma komutlarından, karar host motorundan. İki adımlı onay, geri tuşu ile pencere kapanması |
| `client/mp31.css` | Bölüm düğmeleri, sözleşme ızgarası, oylama listesi (≥44 px, dikey/yatay) |
| `evidence/` | `browser-mp31.cjs` çıktısı (`mp31-results.json`) ve ekran görüntüleri |

## Host tarafındaki değişiklikler

`../mp0/mp-core.js`:

- komutlar: `fedRequest`, `fedInvite`, `fedReply`, `fedVote`, `fedLeave`, `fedLaw`, `fedFound`, `fedFoundQuote`, `vassalOffer`, `vassalQuote`, `vassalReply`;
- `pol` görünümü ve `polSweep` bildirimleri;
- insan oyu koruması: `fedOpenVote` / `startFedVote` motor metni genişletmesi, `fedFounderCandidate` sarmalayıcısı.

## Testler

```sh
node tests/mp31_core_test.js           # gerçek motor (vm): insan oyu AI'dan ayrı, oy = castFedVote (Save8+RNG), başvuru/davet/ayrılma,
                                       # 5 oy rejimi, vasallık teklif/karşı teklif/kabul = motor, yenileme, bağımsızlık, AI↔insan, gizlilik, kayıt, tek oyunculu kimlik
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=/abs/out node tests/browser-mp31.cjs
#   4 ayrı Chromium süreci (host + 3 misafir), gerçek dokunma, 5 görünüm, ağ gizliliği, geri tuşu, bağlantı kopması, performans
```
