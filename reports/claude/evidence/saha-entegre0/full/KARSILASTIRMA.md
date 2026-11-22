# Tam Node koşusu — p48 ↔ p47 karşılaştırması (SAHA-ENTEGRE.0)

Komut: `STARS_TEST_WORKERS=3 STARS_TEST_LOGS=<dizin> node tests/run-all.js`

| Kök | Paket | GEÇEN | KALAN |
|---|---|---|---|
| p47 (`git archive 8984b51`, git DIŞI kopya) | 233 | 6472 | 277 |
| p48 aday (bu dal, iki eski test güncellenmeden önce) | 238 | 6510 | 281 |

Paket bazında fark yalnız şu paketlerde (diğer bütün paketlerde KALAN sayısı aynı):

| Paket | p47 kopya | p48 | p47 git worktree (8984b51) | PR #64 worktree (0d50abc) | Açıklama |
|---|---|---|---|---|---|
| beta_fed_found0_compat_test.js | 0/1 (git yok → çöktü) | 1/5 | 1/5 | — | Eski FAIL (ham Save8 eski commit karşılaştırması); p47'de de 5 |
| beta_fed_fleet0_compat_test.js | 0/0 exit1 (git yok) | 3/0 | 3/0 | — | Kopya artefaktı |
| beta_galaxy0_test.js | 8/1 (git yok) | 9/0 | 9/0 | — | Kopya artefaktı |
| mp11_online_test.js | 8/1 | 9/0 | 9/0 | — | Kopya artefaktı |
| faz92a_war_contribution_test.js | 32/2 | 31/3 | 32/2 | 31/3 | **Yeni FAIL PR #64'ten**: "Real invasion … before successful disband" `army.ships.length===0` (eski kural: ordu fetihte tüketilir) |
| faz96h10_army_safety_test.js | 9/2 | 8/3 | 9/2 | 8/3 | **Yeni FAIL PR #64'ten**: negatif kontrolde sabit beklenen liste; ordu 237 sys5 düştüğü gün (2430) artık silinmediği için AI ona yeni hedef (41) verir. 96H.9 ↔ 96H.10 emir eşitliği (asıl negatif kontrol) PASS |
| saha_entegre0_* (5 yeni paket) | — | 34/0 (+ eşdeğerlik NOT RUN: kontrol kökü verilmedi) | — | — | Yeni |

İki eski test, Issue #66 / PR #64'ün bilinçli kural değişikliğine (fetihten sağ çıkan Taarruz Ordusu silinmez) göre güncellendi;
amaçları (metrik muhasebesi; 96H.9 ↔ 96H.10 eşitliği; yolda yeniden emir yok; sys5 / sys6 temiz düşer) aynen denetlenir.
Güncellemeden sonra: faz92a 32/2, faz96h10 9/2 (p47 git worktree ile aynı eski FAIL'ler) — `new-*.log`.

Sonuç: adil (git) karşılaştırmada p48'in p47'ye göre yeni FAIL'i yok. Eski FAIL'ler silinmedi.
