# SAHA-ENTEGRE.0 — Devir notu (sonraki oturum için)

Sonuç raporu: `reports/claude/SAHA-ENTEGRE0-SONUC.md`. Bu not, kodu bilmeyen bir sonraki oturumun 15 dakikada devralması içindir.

## Durum

- Dal `claude/stars-saha-entegre0`, taban `codex/stars-mp-rakip-doktrinler0` @ `8984b51` (p47). PR #64 (`0d50abc`) doğrulanıp bu dala birleştirildi; PR #64'ün kendisi ayrı taslak olarak açık kalır.
- Sürüm: `96h10p48` / `stars-v96h10p48` / `MP.8.9b47`; Save8 v8, paket 4, protokol 1 değişmedi.
- ZIP `releases/stars-faz96h10p48.zip`, kayıt `RELEASE-SAHA-ENTEGRE0.json`.
- Kullanıcı kabulü, main merge, Render dağıtımı yok.

## Nerede ne var

| Konu | Kod | Test |
|---|---|---|
| Fetih anında filo kaybı (PR #64) | `economy.js invasionTick` TEMİZ İŞGAL dalı; `col.garrisonBase` | `tests/saha_entegre0_conquest_test.js`, `tests/saha_ordu_p0_test.cjs` |
| Fetih talebi | `diplomacy.js` `WAR_FETIH_LIMIT`, `warFetihReclaim`, `warFetihClaimCost`, `warFetihCandidates(e,foe,{capital})`, `warGoalOptions`, `setWarGoal`, `warPreviewExtend` | `tests/saha_entegre0_claims_test.js` |
| Haritadan seçim | `ui.js` `UI.claimPickStart/Toggle/End`, `UI.claimBar`, `UI.wgListHtml`, `UI.wgBindSearch`; `map.js tap()` başı (`View.claimPick`) + halka çizimi | claims B7/B8, SP S2, MP SE H4 |
| Yorgunluk | `diplomacy.js warCenterIndex` (`exh`), `archive-ui.js WarCenterUI.exhBar` | events C1, MP SE H3 |
| Savaşa Yardım | `diplomacy.js warHelpOptions`; `ui.js UI.dealHelpRows/Html/Pick`; mp-core `warSupportList dir:'offer'`, offer kapısı; guest-stars `HR` önbelleği | `tests/saha_entegre0_warhelp_test.js`, MP SE H6 |
| Anomali ayarı | `main.js ANOMALY_LEVELS`, `anomalyLevel/Rate`, `setupConfigError`, `setupGame`; `ui.js anomalySetupHtml`; mp-core `SETTINGS_KEYS`, paket doğrulaması, `publicGalaxy`; `mp1-host.js` senkron | events E1–E6, SP S1 |
| Toplu gizleme | `ui.js UI.noteStashAll` + şerit kartı `nStash` | events F1, SP S3, MP SE H5 |
| MP harita | guest-stars VIEW `bigEmblemsToggle`; `map.js` lojistik ipucu `View._logiHintPorts` | MP SE H1/H2 |
| Eşdeğerlik | — | `tests/saha_entegre0_equivalence_test.js` (`STARS_CONTROL_ROOT` = `git archive 0d50abc` sabit kopya; `STARS_P47_ROOT` = `git archive 8984b51`, yalnız BİLGİ) |
| Koruma | `tests/helpers/saha-entegre0-reviewed.{cjs,json}` — `stripReviewedPerfSinir0` önce bunu çağırır | tüm koruma testleri |

## Komutlar

```sh
npm install --prefix tests
node tests/saha_entegre0_conquest_test.js      # 11
node tests/saha_ordu_p0_test.cjs               # 1
node tests/saha_entegre0_claims_test.js        # 8
node tests/saha_entegre0_events_test.js        # 8
node tests/saha_entegre0_warhelp_test.js       # 7
git archive 0d50abc | tar -x -C /tmp/ctl64 && ln -s $PWD/tests/node_modules /tmp/ctl64/tests/node_modules
STARS_CONTROL_ROOT=/tmp/ctl64 node tests/saha_entegre0_equivalence_test.js   # 3
STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium node tests/browser-saha-entegre0-sp.cjs   # 3
MP8_SCEN=SE STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium node tests/browser-mp8.cjs     # 8 (host + misafir)
STARS_ROOT=<eski kök> node tests/saha_entegre0_*_test.js   # kontrol (p47 vb.)
```

`saha_ordu_p0_test.cjs` `STARS_ROOT` okumaz; eski kökte koşmak için dosyayı o kökün `tests/` dizinine kopyalayın.

## Dikkat edilecekler (bu fazda öğrenilenler)

- Sürüm yükseltirken `RELEASE-MANIFEST.json` `build`'i `BUILD_ID` ile aynı anda güncelleyin; uyuşmazlık MP misafir katılımını sessizce zaman aşımına düşürür (X senaryosu kurulumda takılır).
- Yeni oyunda DANIŞMAN penceresi 420 ms sonra açılır (`main.js` FAZ 18); SP tarayıcı testinde harita dokunuşundan önce açılmasını bekleyip kapatın.
- Misafirde her ayna kurulumu yeni `G.sys` / `G.emps` yaratır: harita kipleri (claimPick gibi) dünya kimliğine bağlanmamalı; adaylar her dokunuşta yeniden hesaplanır.
- Misafir yalnız gözlediği sahipliği bilir (`e.mapOwners`); MP fikstüründe sahiplik verirken gözlemi de kaydedin, yoksa aday listesi doğru biçimde kısa çıkar.
- Harita araç düğmeleri `#grpMap` grubunun içinde; grup kapalıysa `#grpMap .grpHead` ile açın (açıklık `open` sınıfı).
- `claimBar` z-index 9500 (oyun paneli dokunuşu yakalamasın).
- Yeni test harfi seçerken `tests/browser-mp8.cjs` CONF'a bakın (H = perf-sinir0, Codex); bu faz `SE`.
- Koruma zinciri: yeni faz adaptörü `stripReviewedPerfSinir0`'ın başına (ya da ondan sonraki yeni bir adaptörün başına) eklenir; p45–p47 (Codex) main.js vb. için pin bırakmadığından o dosyaların eski koruma FAIL'leri p47'de de vardır.

## Açık işler (öncelik sırası)

1. Render'da p48 iki cihazlı kullanıcı kabulü (Render dalı `claude/stars-saha-entegre0`; beklenen `/mp/version` MP.8.9b47 / 96h10p48 / runtime e2f2da5832fc).
2. PR #64 kuralının (fetihten sağ çıkan ordu silinmez) AI kampanya dengesine etkisi: aynı Save'den kontrol / aday + plasebo bandı, 120 ay. `faz92a_war_contribution` ve `faz96h10_army_safety` bu kurala göre güncellendi (yorumlu).
3. Yörünge muharebesinde tüm filonun sıfırlanması — ayrı P0 fikstürü (Issue #65 saha düzeltmesi).
4. MP `randomEvents` lobi zinciri ve bildirim kaynak etiketleri (Issue #65 §3).
5. Fetih kapasitesinin savaş ilerlemesi / barış kabulüyle ölçeklenmesi; AI'nın ekonomik ihtiyaca göre çoklu talebi (AI karşılaştırma kuralıyla: kontrol/aday + plasebo).
6. İsteğe bağlı UX: ⚔ düğmesinde en yüksek yorgunluk özeti; kenar kaydırmasıyla toplu gizleme; 800×360 görünüm testi.
7. İkinci teslimat H–K: zincirleme ticaret limanları, transit izni, fiziksel teslimat, AI ticaret/strateji; federasyon çeşitliliği araştırması.
