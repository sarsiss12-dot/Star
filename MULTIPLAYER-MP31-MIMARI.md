# STARS — MP.3.1 mimarisi: federasyon siyaseti ve vasallık sözleşmeleri

Durum: **geliştirme prototipi; yayımlanmadı, sunucuya dağıtılmadı.**

- 19 runtime dosyası, build `96h10`, PWA `stars-v96h10`, Save8 ve `releases/stars-faz96h10.zip` değişmedi.
- Yeni federasyon ya da vasallık motoru yazılmadı. Her siyasi karar motorun kendi işlevlerinden geçer.
- Değişiklikler:
  - `research/mp0/mp-core.js`: komutlar, insan oyu koruması, `pol` görünümü, bildirimler;
  - `research/mp31/client/`: ekran;
  - `guest-game.js`, `mp1-host.js`, `join.js`: bölümler ve geri tuşu;
  - relay izin listesi, Dockerfile, `.dockerignore`.

## 1. Motor denetimi: kim karar veriyor?

| Motor yolu | Tek oyunculuda | Uzak insan için sorun | MP.3.1 çözümü |
|---|---|---|---|
| `fedOpenVote` seçmen döngüsü | `if (id === 0) continue;` — yalnız devlet 0'ın oyu kendisine bırakılıyor; diğer her üye `aiFedVoteAssessment` ile oylanıyor ve rezerve `rnd()` çekiliyor | **Uzak insanın oyu AI değerlendirmesiyle veriliyordu**; korumasız motorda yeniden üretildi (`mp31_core_test` 1. vaka). İnsan öneren de otomatik "evet" alıyordu | Motorun kendi metni tek koşulla genişletildi: `if (id === 0 \|\| __mpHumanVoter(id)) continue;`. Uzak insan devlet 0 gibi atlanır: değerlendirme yok, öneri oyu yok, RNG çekimi yok |
| `startFedVote` ertelenen gündem | devlet 0 dışındaki her üye için rezerve `rnd()` | İnsan için RNG çekiliyordu | Aynı koşul: insan için çekim yok |
| `fedFounderCandidate` (kuruluş) | devlet 0 için "oyuncunun açık üyelik onayı gerekli", diğerleri `aiFedWilling` | AI kurucu, uzak insan müttefiki AI eğilimiyle kurucu yazabilirdi | Sarmalayıcı: uzak insan için de "oyuncunun açık üyelik onayı gerekli" |
| `fedApplyMotion` (kabul) | `if (o.ai)` ise AI aday hemen karar veriyor; insan için davet bekliyor | Yok (uzak insan `ai:false`) | Değişmedi; davet `fedReply` ile insana gider |
| `aiFederationPolitics` | yalnız `e.ai` | Yok | Değişmedi |
| `vassalReply` / `vassalDriveAI` | AI kararı yalnız `q.to` AI ise | Yok | Değişmedi |
| `vassalTalkTick` | AI vasalın yenileme/bağımsızlık önerisi | Yok (yalnız `sub.ai`) | Değişmedi |
| `seekProtection` (AI → insan) | `if (hami.ai)` ise rastgele eğilim | Yok (insan için `rnd` yok, teklif bekler) | Değişmedi |
| `DiplomaticInbox`, `vassalInboxSync`, `fedPresentVote`, `say` | yalnız `G.p` / devlet 0 | Uzak insan bildirim almıyordu | `polSweep`: kişisel bildirim (`note`) |

**Kurulum güvenliği:**

- `patchEngine` motor metninde beklenen satırı tam bir kez bulamazsa kurulum hata verir; sessizce eski davranışa düşmez.
- Uzak insan yokken `__mpHumanVoter` hep `false` döner.
- 96E fikstüründe oylama, başvuru, yasa, ayrılma ve vasallık işlemleri korumalı ve korumasız motorda aynı Save8 ve RNG'yi verdi.

## 2. Komutlar (`COMMANDS`; MP.0 denetim sırası aynı)

- Her komut önce MP.0 denetimlerinden geçer: anahtar kümesi, `cid`/`seq`, `forged-empire`, `paused`, `why()` salt okuma denetimi.
- Sonra motorun işlevi çağrılır.
  - Motor işlevlerinin kendi işlemi vardır (`fedChange`, `vassalTransaction`). İkinci bir işlem katmanı açılmaz (`roots` boş).
  - Başarısızlıkta RNG yine geri alınır.
- Motor reddi `rules:engine` + motorun kendi gerekçesi olarak döner.

| Komut | Şema | Yetki | Motor |
|---|---|---|---|
| `fedRequest` | `{via}` | `via` temaslı, yaşayan üye; `canRequestFederation` | `requestFederation` (60 Etki → kabul oylaması) |
| `fedInvite` | `{target}` | üye; temaslı aday; `canFedMotion('admit')` | `proposeFedMotion(e,'admit')` |
| `fedReply` | `{fed, action}` | yalnız davet edilen. Davet yoksa `no-invite` (davetin varlığı sızmaz); süre, yükümlülük ve `fedAdmissionGate` | `acceptFedInvite` / `rejectFedInvite` |
| `fedVote` | `{fed, token, yes:boolean}` | yalnız üye. Üye olmayana federasyon "yok" (`no-fed`); `stale` token, `expired`, `voted` | `castFedVote` |
| `fedLeave` | `{}` | yalnız kendi devleti | `leaveFederation` |
| `fedLaw` | `{law, repeal?}` | üye; `canFedLaw` | `proposeFedLaw` |
| `fedFound` / `fedFoundQuote` | `{type, ballot}` | `canFoundFed` (kurucu adaylar yalnız kabul eden AI müttefikler) | `foundFederation` / salt okuma önizleme |
| `vassalOffer` | `{to, mode, type, terms}` (`demand`/`seek`/`renew`/`release`) | temas ya da mevcut senyör–vasal bağı; `vasTermsShape` + `vassalTerms` | `vassalOffer` |
| `vassalQuote` | aynı | salt okuma | motorun saf denetimleri + sabitleri |
| `vassalReply` | `{sub, id, round, action, terms?}` | yalnız müzakerenin tarafları; taraf olmayana `no-offer`; `q.to` değilse `not-recipient`; eski tur `stale`; `closed`, `expired`, `terms` | `vassalReply` |

## 3. Görünüm (`viewFor` → `pol`) ve gizlilik

| Alan | Kime | İçerik |
|---|---|---|
| `fed` | yalnız üyeler | ad, tür, başkan, üyeler (insan/AI, oy ağırlığı), oy rejimi (`FED_BALLOTS` adı ve açıklaması), yükümlülük metni (`fedDutyText`), uyum, yasalar, önerilebilir yasalar (`canFedLaw`), açık oylama, son oylama, federasyonun davetleri |
| `fed.vote` | yalnız üyeler | belirteç, konu (`fedVoteLaw`), öneren, evet/hayır/bekleyen üyeler, ağırlıklar (`fedVoteCounts`), kural (`fedVoteRule`), `mine` |
| `invites` | yalnız davet edilen | federasyon, tür, oy rejimi, yükümlülük, üyelerin temaslı olanlarının adları, süre, `fedAdmissionGate` engeli |
| `apps` | yalnız başvuran | başvuru durumu ve gerekçesi (`admissionResults`) |
| `others` | üye olmayan | temaslı üyesi olan federasyonlar: ad, tür, üye sayısı, rejim; temaslı üyeler üzerinden `canRequestFederation` |
| `vas.lord` / `vas.subs` | sözleşmenin iki tarafı | sözleşme (`vassalContractOf`), yeniden müzakere günü, aylık tahmini aktarım (`vassalEstimate`) |
| `vas.talks` | müzakerenin iki tarafı | tur, hükümler, geçmiş, gerekçe |
| `vas.cand` | kendi | temaslı devletler için `canDemandVassal` / `canSeekProtection` engelleri |
| `vas.lim` | herkes (sabit) | arayüz seçenekleri; ızgaradaki her değer `vassalTerms` ile süzülür (yeni sınır icat edilmez) |

Gizlilik kuralları:

- Temas kurulmamış devlet adı gönderilmez (`polName` → `null`).
- Üçüncü oyuncunun paketlerinde A–B vasallık müzakeresinin kimliği, hükümleri ve karşı teklifi yok. Üye olmadığı federasyonun oylama alanları da yok (vm ve Chromium paket taraması).
- Vasallık önizlemesinde aylık kesinti tahmini yalnız teklif edenin kendi geliri için verilir; karşı tarafın geliri gizlidir.
- **Bilinen sınır:** `canDemandVassal` / `canSeekProtection` gerekçesindeki güç oranı ("1.3× — en az 1.6× gerekir") motorun insan oyuncuya gösterdiği metindir. Tek oyunculuda host da aynı metni görür.

## 4. Bildirimler (`polSweep`, her yayında, salt okuma)

Uzak insana kişisel bildirim (`note`) gider:

- federasyon oylaması başladı (oyu bekleniyorsa);
- oylama sonucu;
- federasyon daveti;
- başvuru durumu;
- vasallık teklifi, karşı teklif, bağımsızlık talebi;
- müzakere sonucu;
- federasyon üyeliği ve senyörlük değişimi.

İlk yayında sessizce tohumlanır; katılınca eski olaylar bildirim olarak yağmaz. Host bildirimleri motorun kendi arayüzünde kalır (gelen kutusu, `fedPresentVote`, `say`).

## 5. Kayıt (Save8)

- Federasyon oylaması, davetler, başvuru sonuçları, vasallık sözleşmesi ve müzakeresi kanonik `G`'dedir ve Save8'e girer.
- MP.3'ün oturum teklif deposuna kopyalanmaz.
- `deserialize(serialize())` sonrası insan bekleyen oyunu verdi ve müzakereyi kabul etti (vm testi).
- Hangi devletin hangi oyuncuya ait olduğu (oturum eşlemesi) Save8'de değil, MP.0 `meta()`/`restore()` oturum metadatasında. Tam oda kayıt/yükleme MP.4.

## 6. İstemci

- `research/mp31/client/pol-ui.js` (`MP31Pol.create`): FEDERASYON (GENEL / ÜYELER / OYLAMALAR / DAVETLER) ve VASALLIK (DURUM / GELEN / TEKLİF / GEÇMİŞ).
  - Motor yok, kural kopyası yok.
  - Onay penceresi MP.3 ile aynı: EVET ilk 450 ms kapalı, kapanış sonrası 400 ms dokunuş yok.
  - Geri tuşu açık pencereyi kapatır (`window.__mpBack`, `join.js`).
- Misafir: DİPLOMASİ sekmesinde TİCARET / FEDERASYON / VASALLIK bölümleri; rozetler bölüm başına.
- Host: MP diplomasi panelinde aynı bölümler.
  - `host.local()` misafirle aynı `execute()` yolundan geçer.
  - Host üye olmadığı federasyonda oy veremez; başkasının müzakeresine karar veremez (`no-fed` / `no-offer`).
