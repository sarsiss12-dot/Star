# STARS — MP.3.1 vasallık: sözleşme teklifi, karşı teklif, yeniden müzakere, barışçıl bağımsızlık

Kod: `research/mp0/mp-core.js` (`vassalOffer` / `vassalReply` / `vassalQuote` komutları, `pol.vas` görünümü), `research/mp31/client/pol-ui.js`. Testler: `tests/mp31_core_test.js`, `tests/browser-mp31.cjs`.

## 1. Türler ve maddeler (motor)

Üç tür korunur: **Haraçgüzar**, **Sınır Bekçisi**, **Akademik Vasal** (`VASSAL_TYPES`).

| Madde | Arayüz seçenekleri | Kaynak |
|---|---|---|
| Vergi (Enerji, Mineral, Alaşım, Yiyecek, Tüketim Malı) | %0–30 (Haraçgüzar), %0–10 (diğerleri), 5'lik adımlar | Izgara `vassalTerms` ile süzülür |
| Bilim payı | Haraçgüzar / Bekçi %0–10, Akademik %5–30 | aynı |
| Savunma | Senyör korur / koruma yok | boolean |
| Savaş katılımı | yok / yalnız savunma / bütün savaşlar; Bekçi "yok" seçemez, Akademik "bütün" seçemez | aynı |
| Özerklik | serbest / senyör onayı | aynı |
| Süre | süresiz, 12, 24, 60, 120, 240 ay | aynı (motor: 0 ya da 12–240) |
| Yeniden müzakere | 12, 24, 60 ay | aynı |
| Sensör paylaşımı | var / yok | boolean |

- Arayüzün sunduğu her değer motorun `vassalTerms` işlevinden geçen değerlerdir (`pol.vas.lim`).
- Elle hazırlanmış paket de host'ta yeniden doğrulanır:
  - şekil hatası → `bad-params`;
  - motor sınırı dışı (ör. %90 vergi) → `rules:terms`.

## 2. Akış (insan–insan)

1. **Teklif:** VASALLIK → TEKLİF.
   - Temaslı her devlet için motorun `canDemandVassal` / `canSeekProtection` gerekçesi yazar.
   - **HAZIRLA** → sözleşme taslağı (tür + maddeler).
2. **ÖNİZLE** (`vassalQuote`, salt okuma):
   - maliyet: biat 160 / himaye 90 / yenileme 60 / bağımsızlık 40 Etki — motor sabitleri;
   - motorun engelleri;
   - yalnız kendi gelirinden aylık tahmini kesinti (karşı tarafın geliri gizli).
   - Güncel ve engelsiz önizleme olmadan **GÖNDER** kapalı.
3. **GÖNDER** (onaylı) → `vassalOffer`.
   - Teklif tek başına vasallık kurmaz; karşı tarafın GELEN bölümüne düşer.
   - Karşı taraf AI ise `vassalDriveAI` motorla yanıtlar.
4. Alıcı: **KABUL ET** / **REDDET** / **KARŞI TEKLİF** (20 Etki; en çok 3 tur — motor sınırı). Karşı teklif taslağı mevcut hükümlerle dolu açılır.
5. Kabulde motor uygular: `subjugate` (yeni), `vassalInstall` (yenileme) ya da `freeVassal` (bağımsızlık).

Kurallar (hepsi test edildi):

- Her turu yalnız o turun alıcısı yanıtlar (`not-recipient`).
- Eski tur `rules:stale`; kapanmış müzakere `rules:closed`.
- Teklif kimliği ve tur birlikte doğrulanır.
- Taraf olmayan oyuncuya müzakere "yok" (`no-offer`).
- Aynı kabul iki kez uygulanmaz.
- Ağdan yapılan teklif, karşı teklif ve kabul ile doğrudan motor çağrısı aynı Save8 ve RNG'yi verdi.
- Motorun `vassalTransaction` işlemi hatada her şeyi geri alır.

## 3. Ekonomi

- Sözleşme kurulduktan sonraki ayda motorun vergi aktarımı çalıştı (`vassalPaidMonth` / `vassalTransfer`).
- Aylık akış, yayınsız düz motorla aynı Save8'i verdi.
- DURUM bölümünde motorun `vassalEstimate` tahmini gösterilir.

## 4. Yeniden müzakere

DURUM → **YENİDEN MÜZAKERE**. Düğme, motorun yeniden müzakere tarihi gelmeden kapalıdır. Erken istek motorda "Yeniden müzakere tarihi gelmedi" gerekçesiyle reddedilir.

- Reddedilen yenileme sözleşmeyi değiştirmez: hükümler ve revizyon aynı kalır.
- Kabul edilen yenileme motorun `vassalInstall`'ıyla yeni revizyon olarak uygulanır.
- İki devlet arasında motorun 12 aylık müzakere soğuması geçerlidir.

## 5. Barışçıl bağımsızlık

DURUM → **BAĞIMSIZLIK İSTE** (yalnız vasal; senyör talep edemez) → önizleme (40 Etki) → onaylı gönderim → senyörün GELEN bölümü.

- Talep savaş başlatmaz ve tek başına bağımsızlık vermez (test edildi).
- Ret: vasallık sürer, savaş yok.
- Kabul: `freeVassal` — sözleşme `ended`, vasal bağımsız, savaş yok.
- Senyör karşı teklif verebilir. Motor bu durumda talebi yenilemeye çevirir: bağımsızlık yerine daha hafif hükümler.
- Savaş yoluyla bağımsızlık ve isyan motorda değişmeden kaldı.

## 6. AI ile

- **İnsan → AI:** AI motorun `aiVassalAssessment` / `aiVassalCounter` işlevleriyle kabul, ret ya da karşı teklif verir. AI'nın karşı teklifi insanın GELEN bölümünde bekler; AI insan adına karar vermez.
  - vm testi: C'nin AI 5'ten biat isteğine AI karşı teklif verdi (tur 2), insanın kararını bekledi.
  - Chromium testi: aynı tür istek farklı hükümlerle reddedildi.
- **AI → insan:** AI'nın `seekProtection` / `demandVassal` girişleri `vassalOffer` ile insanın kutusuna düşer; `vassalDriveAI` insan alıcıda durur.
  - Bu dünyada AI 2'nin A'dan himaye istemesi motor kuralıyla mümkün değildi ("Yeterince güçlü değil"). Bu yol doğal AI turunda gözlenmedi, raporlandı.
