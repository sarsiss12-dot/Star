# MP-DEAL-SYS.0 — Sistem Devri ve Haraç çok oyunculu müzakerede, federasyon ve Savaş Merkezi kısayolları

Tarih: 15 Kasım 2026 · Dal: `claude/stars-mp-deal-sys0` · Başlangıç HEAD: `043b9c38621bdeb316a330cd23e5edf54d143a0a` (p34 / MP.8.9b32, taslak PR #49) · Bitiş HEAD: §10
Sürüm: oyun **96h10p35** / `stars-v96h10p35` · MP **MP.8.9b33** · Save8 v8 / paket4 / protokol1 (değişmedi) · p35 paket yükleyicisi p6–p34, p25u1, p27s1 kabul eder.

> Kanıt türleri ayrı yazılır: **Node vm** (gerçek runtime + gerçek mp-core / mirror), **yerel Chromium** (üretim kipi relay SÜRECİ + TLS vekili + oyuncu başına kesilebilir/dondurulabilir TCP hattı + oyuncu başına ayrı Chromium ve kalıcı profil, gerçek STARS misafir arayüzü, gerçek dokunuş), **canlı Render** (yalnız salt okunur `/mp/version`), **fiziksel cihaz** (NOT RUN). Kullanıcı kaydı yok: kayıt testleri sentetik oyundan alınan gerçek MP paketleriyle yapıldı.
>
> Sistemin atadığı geliştirme dalı `claude/stars-project-takeover-y9x8m9` eski bir 96H.8 dalıdır; bu faz doğrulanmış PR #49 HEAD'inden (`043b9c3`) yeni dal olarak açıldı. Force-push / rebase yapılmadı.

## 0. Özet

| # | İstek | Durum (yerel) | Kanıt |
|---|---|---|---|
| 1 | Başlangıç: kayıttan devam + olay şeridi P0 | Yeni Render denemesi yok: canlı Render hâlâ **p33** sunuyor (§1). p34 yerel kanıtları geçerli; yeni P0 belirtisi yok → **AÇIK (sahada doğrulanmadı)** | §1 |
| 2a | Sistem Devri (host↔misafir, misafir↔misafir, insan→AI) | Uygulandı, yerelde PASS | N1–N4, N6, N8 · Y1, Y3 |
| 2b | Haraç (kaynak / aylık / süre, takvim, kayıt sonrası tek ödeme) | Uygulandı, yerelde PASS (süre SP'deki gibi sabit 10 yıl — §2.2) | N2, N5, N7 · Y1, Y2 |
| 2c | Birleşik teklif tek işlem, kısmi uygulama yok, tekrar/kopma/kayıtta çift uygulama yok, PR #49 gönderim davranışı | PASS | N2, N6 · Y1–Y3 |
| 3a | Tek dokunuşla İttifak Daveti (aday satırında durum, Şartlı Teklif…, çift dokunuş) | PASS (misafir→misafir, misafir→AI, host masaüstü→misafir, SP→AI) | S1 · Y4 |
| 3b | Bekleyen federasyon işleri üstte | PASS (oy, ret sonrası kadro düzenleme, uygulanabilir karar; bitmiş karar yok) | S2 · Y4 |
| 3c | Savaş Merkezi seçili cepheden destekçi çağırma | PASS (uygunluk/ret nedeni, kaynak + toprak vaadi şartı, doğru cephe, misafirde host kararı, çift dokunuş tek teklif) | S3 · Y5 |
| 4 | Sonraki faz görevleri | NF-1…NF-5 kayda girdi, #33'e yorum | §8 |
| 5 | Z / Q regresyonu, tam Node | §7 | §7 |

## 1. Sürüm ve Render

- Canlı Render (`stars-zhdu`, salt okunur GET, oynanış yok): `/mp/version` → `{"mp":"MP.8.9b30","build":"96h10p33"}`, 8 MP dosyasının öneki p33 ile aynı (mp-core `a16b64de5e1e`, relay `48d42b59c952`, mp1-host `a73cbbc86a4f`, join `bc2732493741`, mirror `c23a23d78ba3`, guest-stars `3b36f18c4520`, mp71-dip `38b13c6ece3d`, mp7-setup `a7391d21552c`). Yani p34 düzeltmeleri de sahada **hâlâ çalışmıyor**.
- Bu nedenle "gerçek Render'da yeniden giriş / olay kaybı yeniden görülürse önce onu çöz" koşulu için yeni saha verisi yok; kullanıcı kaydı / canlı oturum erişimi de yok. Kayıttan devam ve olay şeridi **AÇIK (saha kabulü bekliyor)**; yerel kanıt p34 (Z10–Z13) ve bu fazdaki Y2 (kayıt → yeni oda → misafirler döner).
- **Render'da seçilecek dal:** `claude/stars-mp-deal-sys0`.
- **Dağıtımdan sonra beklenen** `/mp/version`: `{"mp":"MP.8.9b33","build":"96h10p35"}` ve önekler: mp-core `fff723a00366`, relay `8343be99b3cb`, mp1-host `f5dc296c1a3d`, join `65c28db3714f`, mirror `5e6299592e86`, guest-stars `aee4c163a319`, mp71-dip `071f6042ee1f`, mp7-setup `a7391d21552c`. Uyuşmazsa sahada eski sürüm çalışıyordur.

## 2. Sistem Devri ve Haraç

### 2.1 Sistem Devri

Mevcut yol: `dealQuote` → `executeDeal` → `captureSystem(...,'transfer')` (sahiplik + başkent kuralı motorda zaten vardı). Eklenen (yalnız **insan taraflı** anlaşmada, `dealHumanParty`; AI–AI anlaşmaları aynen):

- `dealSysIssues(veren, alan, id)` (diplomacy.js sonu, "MP-DEAL-SYS.0"): sistem artık verenin değil · başkent verilemez · verenin başka devlete açık **Toprak Vaadi** · üçüncü tarafın v2 **Fetih** hedefi · barışta iade edilecek **işgal** (`warFetihSettlePreview`, `warFetihSettle`'ın saf kopyası). Hem önizlemede (`dealQuote`) hem kabulde (`executeDeal` kendi `dealQuote`'unu yeniden çağırır) çalışır.
- MP kapısı `dipSysGate` (mp-core): **istenen** sistem yalnız isteyenin BİLDİĞİ sahiplikle (`warGoalSees` + `warHumanKnownOwners`); bilinmeyen sahiplikte gerekçe gizli sahibi söylemez. Karşı teklifte, karşı tarafın önceki teklifinde açıkça sunduğu sistemler (`shown`) istenebilir (Y'nin bulduğu kusur, §6). **Verilen** sistemde `dealSysIssues`.
- `dipSweep`: bekleyen teklifteki sistemin durumu değişince teklif "Sistem Devri artık uygulanamıyor" nedeniyle geçersiz olur; verene özel neden ayrıca yazılır.
- Gösterim: madde etiketi "★ Sistem Devri: X sistemi · kabulde devredilir"; teklif özeti `UI.dealTermsHtml` "DEVİR VE YÜKÜMLÜLÜK SONUCU": sistem, bilinen koloniler, şimdiki sahip → **yeni sahip**, "kabul anında"; barışta iade edilecek işgal satırları; Toprak Vaadi ayrı satırda "**kabulde devir YOK** · cephe kazanılınca / teslimde".
- Sistem Devri (kabulde) ile Toprak Vaadi (`landPromise`, savaş / teslim koşulunda) ayrı maddeler olarak kaldı.

### 2.2 Haraç

SP kuralı aynen: `giver.tribute.push({to,r,v,until:G.day+3600})`, `tributeTick` ay başında `min(v, stok)` öder, süre dolunca kayıt düşer. **SP'de süre seçeneği yok (sabit 10 yıl = 120 ay)**; MP de aynı kuralı taşır — yeni süre seçeneği eklemek motor kararıdır, bu fazda yapılmadı.

- MP maddesi `{t:'tribute', r∈DIP_RES, v 1..100000}`; etiket "⏳ Haraç: v Kaynak/ay · 10 yıl · toplam v×120".
- `tributeTick`: yalnız insan taraflı kayıtta `t.last={d,p}` (son ödeme günü + tutar) ve eksik ödeme / bitiş bildirimi (`tributeShortNote`, `tributeEndNote`; MP'de uzak insana NOTE). AI–AI kayıtlarına hiçbir alan yazılmaz (eşdeğerlik §7).
- Takvim `tributeRows` / `UI.tributeHtml` ("⏳ AKTİF HARAÇ", ilişki ve müzakere sayfalarında): ödeyen, alan, aylık, kalan ay, sonraki ödeme tarihi (YYYY/AA), toplam kalan, son ödeme. Ayna: ödeyene kendi yükümlülüğü (`to` π'li), alıcıya kendisine ödenen kayıt (kabukta `to:0`); üçüncü misafire hiçbiri.
- Takvim Save8'deki `tribute` dizisinden okunur → kayıt / yükleme / yeni odada devam sonrası aynı; sonraki ödeme doğru ayda **bir kez** (N5, Y2).

### 2.3 Birleşik teklif ve gönderim

Barış + Sistem Devri, Barış + Haraç, Barış + Sistem Devri + Haraç tek teklif. `executeDeal` önce bütün maddeleri `dealQuote` ile yeniden denetler; biri geçersizse **hiçbiri** uygulanmaz (N6). Tekrar kabul (`respond` aynı cid / yeni cid), yanıt sırasında hat donması / kopması, kayıt yüklemesi ikinci uygulama üretmez (N2, Y3). PR #49 tek işlemli gönderim (`S.dealTx`) bu maddelerde aynen: taslak host yanıtına kadar korunur, ret / bağlantı hatasında düzenlenebilir, yeniden gönderim aynı cid'le (Y1, Y3).

## 3. Federasyon ve Savaş Merkezi

- **Tek dokunuş İttifak Daveti** (`UI.allyInviteSend/State`, ui.js): aday satırı `.allyCand` → "⚑ İttifak Daveti Gönder · bedel" + "Şartlı Teklif…" (müzakere masası). Durum aynı satırda (`.allyInvState[data-state]`: gönderiliyor / bekliyor / kabul / karşı teklif / ret / gönderilemedi); son 90 günde davet edilen ama artık aday olmayan devlet de satırda kalır. Çift dokunuş korumalı. MP'de `UI.mpQuickOffer` (host'ta yalnız insan alıcı; misafirde hepsi), SP'de AI ile `dealQuote` → `aiRespond` → `executeDeal`. p30 ittifaksız federasyon kuruluşu / üyeliği **dokunulmadı** (`fedFoundCandidate` / `acceptFedInvite` aynı).
- **Bekleyen federasyon işleri** (`UI.fedPendingItems/Html`, `.fedPending` federasyon penceresinin üstünde): kendi bekleyen oyun (OY VER → `fedVoteNow`), reddedilmiş kuruluş önerisi (KADROYU DÜZENLE → `fedFoundEdit`) / tamamı kabul (KUR → `fedFoundFinish`), davet bekleyen, uygulanabilir onaylı karar (başkan ya da öneren → `fedExecute`). Biten / süresi geçen karar listelenmez; sekme ve kaydırma yerinde.
- **Savaş Merkezi destekçi kartları** (`WarCenterUI.support`, archive-ui.js): seçili cepheden p33 aday kartları `.supCand` — uygunluk / ret nedeni (`.supGate[data-ok]`), verebileceğin kaynaklar ve toprak vaadine uygun sistem sayısı, "⚔ Destek İste" (`warJoin` maddesi, doğru `cephe:düşman:aday`), "Şartlı Teklif…", durum. Misafirde uygunluk host'un `warSupportList`'inden (`UI.dealSupportRows/Ready`; misafirin ayna verisiyle değil — Y'nin bulduğu kusur, §6). Savaş kapandıktan sonra gelen geç kabul işlenmez: savaş bitince bekleyen `warJoin` teklifi kapanır, kabul `rules:closed` döner, katılım / bedel yok (N9). "Şartlı Teklif…" taslağı müzakere masasının mevcut PR #49 taslağıdır (`S.dealTx`; Y1/Y3, Z11/Z12); Savaş Merkezi penceresinin yenilenmesi sırasında taslağın korunması **ayrıca sınanmadı**.

## 4. Değişen dosyalar

Runtime (5): `diplomacy.js` (sona ek blok + `dealQuote`/`dealLabel` iki satır), `economy.js` (`tributeTick` insan taraflı iz/bildirim), `ui.js` (`tributeHtml`, `dealTermsHtml`, `fedPending*`, `allyInvite*`), `archive-ui.js` (`WarCenterUI.support/ask`), `main.js`/`sw.js` (sürüm).
MP (6): `research/mp0/mp-core.js` (`dipItems`, `dipSysGate`, `dipGate`, `counter`, `dipSweep`, NOTE sarmalayıcıları, paket uyumu), `research/mp6/mirror.js` (haraç π), `research/mp6/client/guest-stars.js`, `research/mp71/client/mp71-dip.js` (`mpQuickOffer`, `mpOfferState`), `research/mp1/server/relay.js` + `research/mp1/client/view.js` (MP.8.9b33).
Test: `tests/mp_deal_sys0_test.js`, `tests/mp_deal_sys0_sp_test.js`, `tests/mp_deal_sys0_equivalence_test.js`, `tests/helpers/mp-deal-sys0-mp.cjs` (MP8 Y), `tests/browser-mp8.cjs` (Y kaydı), koruma `tests/helpers/mp-deal-sys0-reviewed.{json,cjs}` (taban `043b9c3`, 12 dosya, tam metin geri alım doğrulandı; `stripReviewedFieldVerify` zincirinden önce çağrılır).

## 5. Testler (yeni)

| Test | Aday p35 | Kontrol p34 |
|---|---|---|
| `node tests/mp_deal_sys0_test.js` (N1–N9) | **9/0** | N1–N7: 0/7 (`node-kontrol-p34.log`; N8 karşı teklif bulgusu, N9 geç kabul sonradan eklendi) |
| `node tests/mp_deal_sys0_sp_test.js` (S1–S4) | **4/0** | — (yeni işlevler p34'te yok) |
| `STARS_CONTROL_ROOT=<p34 git archive> node tests/mp_deal_sys0_equivalence_test.js` | **3/0** (tohum 11/22/404 × 48 ay, 8 nokta, Save8 SHA-256 + RNG birebir) | — |
| `MP8_SCEN=Y node tests/browser-mp8.cjs` (Y0–Y5) | **6/0** (koşu 6) | — |

Y koşu geçmişi (ilk FAIL'ler kanıt olarak korunur, `evidence/mp-deal-sys0/aday-Y-run1…6.log`): 1–3: 2/4 (Y1/Y2/Y4/Y5), 4–5: 4/2 (Y4/Y5), 6: 6/0. Kökler §6.

Y içeriği (3 insan + 5 AI, orta, seed 22, 844×390 yatay misafir, host 1280×800):
- Y1: misafir C gerçek masada (dokunuş) Barış + Sistem Devri + Haraç hazırlar, özet "kabul anında / yeni sahip / toplam yük" görünür; B karşı teklif; C karttan kabul; host + B + C'de aynı yeni sahip ve aynı ödeme takvimi.
- Y2: bir ödeme → kaydet → host kapanır → YENİ oda → misafirler döner → sonraki ödeme doğru ayda bir kez, takvim aynı.
- Y3: teklif beklerken sahiplik değişir → geçersiz + iki tarafa neden; aynı kabul iki kez + host yanıtı sırasında hat donar / kopar → tek uygulama.
- Y4: tek dokunuş İttifak Daveti (misafir → misafir bekliyor → kabul; misafir → AI sonuç satırda; çift dokunuş tek teklif), host masaüstünde misafire, bekleyen federasyon oyu üstte → OY VER.
- Y5: Savaş Merkezi seçili cepheden aday kartı → Destek İste doğru cepheye → kabul; AI adayı sonucu kartta; çift dokunuş tek teklif.

## 6. Bulunan ve düzeltilen kusurlar (Y / Node koşularında)

1. Karşı teklifte, karşı tarafın kendi teklifinde açıkça sunduğu sistem `rules:quote` ile reddediliyordu (bilgi kapısı sahipliği gözlemlememiş sayıyordu) → `shown` kümesi; ayrıca kapıdaki öncelik hatası açık `known` değişkeniyle yeniden yazıldı (N8).
2. Misafirin Savaş Merkezi kartları uygunluğu kendi ayna verisinden hesaplıyordu ("temas gerekli" yanlış) → host `warSupportList` sonucu.
3. `dealSupportRows` yüklenmemişken `null` → `.find` istisnası, pencere açılmıyordu → `(…||[])`; cephe için satır gelmezse sonsuz bekleme yerine "uygun değil".
4. Fikstür / test kökleri (ürün değil): boş hedefli Fetih ilanı `bad-params` (→ boyun hedefi), barış maddesinin `want` tarafında olabilmesi, ayna kabuğunda insanlığın gizli olması (AI `view.dip.contacts` h=0 ile seçilir), host etki puanı.

## 7. Regresyon

Tam Node (`STARS_TEST_WORKERS=4 node tests/run-all.js`, `evidence/mp-deal-sys0/node-tam.log`; FAIL veren paketlerin günlükleri `node-tam/`):

| | Paket | GEÇEN | KALAN |
|---|---|---|---|
| p34 tabanı (`evidence/mp-field-fix0/regresyon/son/node-tam.out`) | 206 | 6325 | 275 |
| p35 aday (ilk koşu) | 209 | 6337 | 276 |

Paket paket fark: yalnız 3 yeni paket (`mp_deal_sys0_test` 9/0, `mp_deal_sys0_sp_test` 4/0, `mp_deal_sys0_equivalence_test` kontrol kökü verilmediği için NOT RUN 0/0) ve **`mp3_core_test` 11/0 → 10/1** (ilk FAIL korunur). Kök: MP.3 testi `{t:'sys',id:1}` maddesinin MP'de DESTEKLENMEDİĞİNİ (`bad-params`) varsayıyordu; bu faz Sistem Devri'ni MP maddesi yaptığı için yanıt `rules:quote` oldu (verenin olmayan sistem; yan etkisiz). Test vakası güncellendi, ret gevşetilmedi: biçimsiz `{t:'sys',id:1,x:1}` ve `{t:'sys',id:-1}` yine `bad-params`, verenin olmayan sistem `rules:quote` + dünya değişmez → **11/0**. Kalan 275 FAIL, p34 tabanıyla aynı 52 pakettir (bu fazdan bağımsız; silinmedi).

| Koşu | Sonuç | Günlük |
|---|---|---|
| Eşdeğerlik (son kod, `STARS_CONTROL_ROOT`=p34 `git archive 043b9c3`) | **3/0** (11/22/404 × 48 ay) | `esdegerlik.log`, `esdegerlik-son.log` |
| `MP8_SCEN=Z` (kayıt / olay / yeniden katılım, Z0–Z13) | **14/0** | `regresyon/Z.log` |
| `MP8_SCEN=Q` (savaş desteği / toprak vaadi, Q0–Q7) | **8/0** | `regresyon/Q.log` |
| `browser-war-coalition0.cjs` | **5/0** | `regresyon/` |
| `browser-mp-field-fix0-sp.cjs` | **1/0** | `regresyon/` |
| `browser-beta-war-center0.cjs` | **10/0** | `regresyon/` |
| `browser-sp-map-war.cjs` | **4/0** (exit 0) | `regresyon/` |
| `python3 tools/verify-release.py` (çalışma ağacı) + çıkarılmış ZIP `--root` | **DOĞRULANDI: 19 dosya; oyun build 96h10p35** | — |

Ortam ayrımı:
- **Yerel Chromium:** yukarıdaki tüm tarayıcı koşuları (üretim kipi relay süreci + TLS vekili, misafir 844×390 yatay dokunmatik, host 1280×800 masaüstü).
- **Canlı Render:** yalnız salt okunur `/mp/version` (p33). Oynanış **NOT RUN**.
- **Fiziksel cihaz (PC / Android), LAN:** **NOT RUN**.

## 8. Sonraki faz görevleri

Belge: [`reports/claude/SONRAKI-FAZ-GOREVLERI.md`](https://github.com/sarsiss12-dot/Star/blob/claude/stars-mp-deal-sys0/reports/claude/SONRAKI-FAZ-GOREVLERI.md) · #33 yorumu: https://github.com/sarsiss12-dot/Star/issues/33#issuecomment-6899315968 (pano satırları değişmedi).

| Kod | Görev | Bağlı pano maddesi | Durum |
|---|---|---|---|
| NF-1 | Genel Savaş Sözü (`warOn`) MP desteği | #16, #31, #40, #43 | PLANLANDI |
| NF-2 | Teknoloji ve Lüks Mal MP desteği | #40 | PLANLANDI |
| NF-3 | Casusluk Ağı / istihbarat maddeleri | #33 casusluk paneli | PLANLANDI |
| NF-4 | Saldırmazlık / Ticaret Paktı / Geçiş İzni kısayolları | #32, #22 | PLANLANDI |
| NF-5 | AI müttefik desteği ve vasallık | #40, #44 (#16, #43) | PLANLANDI |

## 9. Açık işler

- Canlı Render p33; p34 ve p35 sahada hiç çalışmadı → kayıttan devam / olay şeridi / bu fazın saha kabulü **NOT RUN**.
- Fiziksel PC / Android, LAN: **NOT RUN**.
- Haraç süresi seçeneği yok (SP motoru sabit 10 yıl); istenirse ayrı motor kararı.
- Eşdeğerlik koşularında AI kaynaklı haraç doğmadı (sayaç 0); AI–AI haraç kaydının değişmediği kod okumasıyla (insan taraflı koşul) ve Save8 eşitliğiyle desteklenir, doğal AI haracıyla ayrıca ölçülmedi.
- Kullanıcı kabulü yok; hiçbir madde TAMAMLANDI değil. main'e merge / Render dağıtımı yapılmadı.

## 10. Teslim

Taslak PR ve bitiş HEAD bir sonraki commit ile yazılır.
