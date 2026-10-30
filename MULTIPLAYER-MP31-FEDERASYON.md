# STARS — MP.3.1 federasyon: başvuru, davet, oylama, oy rejimleri, ayrılma

Kod: `research/mp0/mp-core.js` (komutlar ve koruma), `research/mp31/client/pol-ui.js` (ekran). Testler: `tests/mp31_core_test.js`, `tests/browser-mp31.cjs`.

## 1. Akışlar

**Başvuru:**

1. Üye olmayan oyuncu GENEL bölümünde, temaslı üyesi olan federasyonları görür. Her temaslı üye için motorun `canRequestFederation` sonucu yazar: Etki, temas, anayasa ittifak şartı, bekleme, savaş/doktrin, açık gündem.
2. **BAŞVUR** → `requestFederation`: 60 Etki ödenir; motor üyelik oylamasını açar (`fedOpenVote`, `admit`, başvuran = aday).
3. AI üyeler motorun değerlendirmesiyle oy verir (`aiFedVoteAssessment`). İnsan üyelerin oyu bekler; uzak insanın oyu artık AI tarafından verilmez.
4. İnsan üye OYLAMALAR bölümünde EVET / HAYIR oyunu iki adımlı onayla verir (`castFedVote`).
5. Oylama motorun kuralıyla sonuçlanır (`fedResolveVote`). Kabulde davet adaya gider (`f.invites`); aday insansa kendiliğinden kabul edilmez.
6. Aday DAVETLER bölümünde **KATIL** (`acceptFedInvite`) ya da **REDDET** (`rejectFedInvite`).
   - Oylama sonucu ile adayın kararı ayrı aşamalardır.
   - Davet tek kullanımlık; ikinci kabul `no-invite`.

**Davet:** Üye, temaslı adayı ÜYELER bölümünden **DAVET ET** ile önerir (`proposeFedMotion('admit')`). Sonrası başvuru ile aynı.

- Öneren insan da oyunu ayrıca verir. Host (devlet 0) için motorun zaten uyguladığı kural uzak insana da uygulandı.

**Ayrılma:** GENEL → **FEDERASYONDAN AYRIL** (onaylı) → `leaveFederation`.

- Üyelik ve ittifaklar biter; 24 ay yeni federasyona giriş beklemesi başlar (motor: `_fedLeaveUntil`).
- Açık oylamada ayrılanın oyu sayılmaz (`fedVoteCounts` yalnız üyeleri sayar); diğer üyelerin oyları silinmez.
- Başka oyuncu ya da host birini çıkaramaz: `fedLeave` yalnız kendi devletine uygulanır. İhraç motorun `expel` oylamasıdır.

**Yasa önerme:** OYLAMALAR → YASA ÖNER. Motorun `canFedLaw` / `fedLawCost` / `proposeFedLaw` işlevleri kullanılır.

**Kuruluş:** GENEL → FEDERASYON KUR (tür ve oy rejimi) → ÖNİZLE (`canFoundFed`) → KUR (`foundFederation`).

- Kurucu adaylar yalnız kabul eden AI müttefiklerdir. Uzak insan müttefik AI eğilimiyle kurucu yazılmaz, ancak sonradan kendi açık kararıyla (davet) katılır.
- Motor en az iki kabul eden AI müttefik ister; bu kural değişmedi.

## 2. Oy rejimleri ve ağırlıklar

Ekranda motorun kendi adı, açıklaması (`FED_BALLOTS`), ağırlıkları (`fedVoteCounts` / `fedLiveWeights`) ve kural metni (`fedVoteRule`) gösterilir; hayalî ağırlık yok.

Aynı üyelerle (AI 5, AI 2, insan B), aynı yasa önerisinde beş rejim `mp31_core_test` ile ölçüldü:

| Rejim | Ağırlıklar (AI 2 / B / AI 5) | Sonuç (evet/hayır ağırlığı) |
|---|---|---|
| Eşit Temsil | 1 / 1 / 1 | KABUL 3 / 0 |
| Hegemonik | 2 / 1,857 / 1,84 | KABUL 5,697 / 0 |
| Ekonomik Temsil | 1,185 / 1,185 / 2 | KABUL 4,37 / 0 |
| Karma Konsey | 1,592 / 1,521 / 1,92 | KABUL 5,033 / 0 |
| Ağırlıklı (eski anayasa) | 1 / 1 / 1 | KABUL 3 / 0 |

- Her rejimde ağdan verilen oy ile doğrudan `castFedVote` aynı Save8 ve aynı RNG'yi verdi.
- Quorum, gerekli çoğunluk, %75 süper çoğunluk ve oy ağırlığı dondurma (`fedFreezeBallot`) motordan değiştirilmeden geliyor.

## 3. Süre ve çoğunluk

- Oylama 90 oyun günü açık (`v.expires`).
- Süre dolunca motor eksik oyu çekimser sayar. İnsan adına oy üretilmez (test: `abstain = 1`, B evet/hayır listesinde değil).
- Süresi dolmuş gündeme oy `rules:expired`; sonuçlanmış gündeme `rules:no-vote`; eski belirteç `rules:stale`; ikinci oy `rules:voted`.

## 4. Davet testleri (`mp31_core_test`)

| Vaka | Sonuç |
|---|---|
| İnsan daveti kabul eder | Gerçek üyelik |
| İnsan daveti reddeder | Üyelik yok, davet silinir |
| Davetin süresi dolar | `rules:expired` |
| Federasyon yükümlülükleri değişir | `rules:changed` |
| Başkası daveti kabul etmeye çalışır | `no-invite` |
| Aynı davet ikinci kez kabul edilir | `no-invite` |
| Aday vasal | `fedAdmissionGate`: "Aday bağımsız ve uygun değil" |
| Aday öldü | Davet `updateFederations` ile silinir |

Oylar yetersizse motor reddeder ve başvurana gerekçe gider (`admissionResults`).

## 5. Çakışmalar (motor kuralıyla, değiştirilmedi)

- Vasal devlet federasyona başvuramaz ve davet edilemez (`fedAdmissionGate`).
- **Üye bir insan vasal olursa motor federasyon üyeliğini sona erdirmiyor** (vm testinde raporlandı). Yalnız savaş durumu (`subjugationFedPeace`) düzenleniyor. Yeni siyasi kural eklenmedi; açık konu olarak not edildi.
- İki üye savaşa girerse `updateFederations` bağı kopan üyeyi çıkarır (`bondLost`). İttifak ile savaş birlikte var olamaz (`fixDiploConflicts`).
- Oylama sürerken ayrılan üyenin oyu sayılmaz.
