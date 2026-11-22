# SAHA-GÜVENCE.1 — Sonuç raporu (p49 / MP.8.9b48)

Tarih: 22 Kasım 2026 · Dal: `claude/stars-saha-guvence1` · Taban: `claude/stars-saha-entegre0` @ `347ef0d` (p48 / MP.8.9b47, PR #68)
Kanıt: `reports/claude/evidence/saha-guvence1/` · Program devri: `reports/claude/STARS-SONRAKI-DEVIR.md`

Durum dili: PASS / FAIL / NOT RUN ayrı. **Kullanıcı şu an test yapamıyor**: bütün kabul otomatik (Node + yerel Chromium + yerel relay/TLS). Fiziksel Android, gerçek uzak internet ve canlı Render **NOT RUN**. Otomatik kabul, kullanıcı / saha kabulü değildir.

---

## A. Kanonik kaynak

| Öğe | Değer |
|---|---|
| Başlangıç HEAD | `347ef0d365ab3ffc65af2b8359de5bf64c34b405` (`claude/stars-saha-entegre0`, PR #68) — GitHub'da doğrulandı, üstünde yeni commit yok |
| Bitiş HEAD | `claude/stars-saha-guvence1` son commit (kod / sürüm `b430b73`) |
| Dal | `claude/stars-saha-guvence1` |
| PR | bkz. GitHub taslak PR (taslak, taban `claude/stars-saha-entegre0`) |
| GitHub bulgusu | Codex `codex/stars-ticaret-agi0` dalında TİCARET-AĞI.0'ı **p47 tabanında** tamamlamış (10 commit, açık engel: 100 sistem p95 +%27,61). İkinci teslimat bu dalın p49'a entegrasyonu olarak planlandı (yeniden yazılmadı). |
| Okunanlar | AGENTS.md, GPT-DEVIR.md, CLAUDE.md, PROJE-DURUMU.md, SAHA-ENTEGRE0 SONUC/DEVIR, MP-RAKIP-DOKTRINLER0-SONUC, P46-DIPLOMASI-ARASTIRMA-SONUC (`codex/stars-p46-diplomasi-arastirma` dalından), TICARET-AGI0-SONUC |

Commit'ler: `223bb3c` Faz B2 · `91b7ef7` Faz C · `b430b73` Faz D + sürüm p49 + ZIP · rapor commit'i (bu dosya)

## B. Gerçekten yapılan işler

| Faz | Değişiklik | Dosya |
|---|---|---|
| A | Uzun oturum (100 sistem / 9 AI 120. ve 180. ay, 500 sistem / 16 AI 120. ay), yeniden bağlanma (O), kayıt → yeni oda (J) Chromium ile koşuldu; **kod değişikliği gerekmedi** (donma yeniden üretilmedi) | — (test koşuları) |
| B2 | Fetihten ÖNCE ikinci kayıp yolu bulundu: eskortu ölen tarafın silahsız gemileri (Taarruz Ordusu…) hasarsız aynı adımda imha. Kural korundu; muharebe raporunda açık neden + misafire ZAFER/YENİLGİ bildirimi | `combat.js`, `ui.js`, `research/mp0/mp-core.js` |
| B3 | Fetih sonrası ordu korunmasının (PR #64) AI dengesine etkisi: 120 ay + 240 ay Çalkantılı, p47 / p48 / plasebo | ölçüm (kod yok) |
| C1 | İnsan–insan Savaşa Yardım: Node (gerçek MP komutları) + Chromium (gerçek masa düğmeleri + host gelen kutusundan KABUL) | test |
| C2 | **Hata düzeltildi**: toprak vaadi verilen sistem v2 Fetih barışında düşmana iade ediliyordu | `diplomacy.js warFetihSettle` |
| C4 | **Hata düzeltildi**: İsyanı Bastır 6. hedeften sonra ücret alıyordu (arayüz "bedelsiz") | `diplomacy.js warFetihClaimCost` |
| C5 | **Hata düzeltildi**: sistemin açtığı federasyon oyu gelen kutusuna girmiyor, misafirde kart doğmuyordu (P46 bulgusu) | `inbox.js fedVoteSource` |
| D | randomEvents MP zinciri, anomali bağımsızlığı, kenara alma + kayıt, akıllı duraklatma doğrulandı; **kod değişikliği gerekmedi** | test |
| Sürüm | 96h10p49 / stars-v96h10p49 / MP.8.9b48; p49 paket yükleyicisi p41–p48 kabul eder | `main.js`, `sw.js`, manifest, mp-core, relay, view |

## C. Kök nedenler (kanıtlanan / varsayım ayrı)

**Kanıtlanan**
1. **Eskortsuz silahsız gemi imhası (B2).** `combat.js` muharebe sonu: silahlı gemisi kalmayan tarafın canlı filoları (`isArmed` yalnız `dmg>0`; `ord` dmg 0) `fleetLost(f,'combat')` + `f.ships=[]`. Fikstür: 3 korvet + 12 ordu, güçlü düşman → TEK yarım günde filo yok; 12 ordu gemisi hasarsız. Günlük yalnız "combat" diyordu.
2. **Misafire muharebe sonucu yok (B2).** ZAFER / YENİLGİ satırı yalnız `A===0||B===0` (host). Uzak insan filosunu bildirimsiz kaybediyordu.
3. **Toprak vaadi iadesi (C2).** `makePeace` başında `warFetihSettle`, işgalcinin v2 Fetih hedefleri dışındaki bütün işgallerini düşmana iade ediyor; ardından çalışan `warPromiseFrontEnded` sistemi bulamayıp vaadi "Sistem ele geçirilmedi" diye düşürüyordu. Saha şikâyetiyle ("vaat / paylaşım etkisiz") birebir.
4. **İsyanı Bastır bedeli (C4).** `warFetihClaimCost` yalnız başkent +60'ı bağışlıyordu.
5. **Sistem federasyon oyu (C5).** `startFedVote` önerensiz oy açar; `DiplomaticInbox.capture` geçerli kaynak devlet istiyordu → kayıt yok; misafirde `capture` null → kart yok.

**Varsayım / kanıtlanamayan**
- Sahadaki özgün 15K kaybının hangi yoldan (fetih anı silme — p48'de kapatıldı; eskortsuz imha — bu fazda görünür kılındı) olduğu kayıt dosyası olmadan **kanıtlanamaz**.
- Eski misafir harita donması bu fazdaki uzun oturumlarda **yeniden üretilmedi**; geçmiş düzeltmelerin yeterli olduğu yalnız otomatik senaryolar için söylenebilir.

## D. Testler

### Yeni hedefli Node testleri (aday p49 / kontrol)
| Test | p49 | Kontrol |
|---|---|---|
| `saha_guvence1_fleet_test.js` (B2.1–B2.6) | **6/0 PASS** | p47 4/2 (muharebe kuralı vakaları aynı geçer; bildirim/açıklama yok) |
| `saha_guvence1_war_test.js` (C1.1–C1.7, C2, C4, C5) | **10/0 PASS** | p47 1/9 |
| `saha_guvence1_events_test.js` (D1, D1b, D2, D3) | **4/0 PASS** | p47 2/2 (D1 randomEvents zinciri ve D3 duraklatma p47'de de doğru → kod gerekmedi) |
| `saha_guvence1_equivalence_test.js` (p48 sabit kopyasına karşı 3 tohum × 48 ay Save8 + RNG) | **3/0 PASS** | — |

### İlgili regresyon (p49)
Tam Node koşusundan (aşağıda) bu fazı ilgilendiren paketler, p49:
`saha_entegre0_{conquest,claims,warhelp,events}` 11/0, 8/0, 7/0, 8/0 · `reinf_route0` 12/0, `_cards` 4/0 · `war_coalition0` 7/0, `_mp` 3/0 · `field_war_siege0` 20/0 · `beta_war_goals0` 13/0, `_mp` 5/0 · `faz92c_settlement_apply` 28/0 · `faz96a_integrity` 12/0 · `mp_p0_{guard,desync1,sync}` 7/0, 4/0, 6/0 · `mp_pwa_surum0` 5/0 · `mp_sync_fed0_*` / `mp_sync_fed1_defcall` hepsi 0 FAIL · `mp_deal_sys0` 9/0 · `mp_waron0` 9/0, `mp_waron1_deadline` 8/0 · `mp_techlux0` 11/0 · `mp_diplo5_*` hepsi 0 FAIL · `perf1_equivalence` 4/0.
Eski FAIL'ler (p48'de de aynı sayı): `faz92a_war_contribution` 32/2 (p48 31/3), `faz96h10_army_safety` 9/2 (p48 8/3), `perf2_equivalence` 4/1, `mp84_notice_identity` 4/1, `mp89_ui_integrity` 0/1.

### Gerçek Chromium (yerel relay + TLS vekili + oyuncu başına hat; fiziksel cihaz DEĞİL)
| Senaryo | Sonuç |
|---|---|
| I uzun oturum, 100 sistem / 9 AI, 120. aydan (host + 2 misafir, 8 dk gerçek döngü, hız / pencere / arka plan / kopma / emir) | **4/0 PASS** — kapalı pencerede donma 0, 330 örnek, 9 yetişme hepsi başarılı |
| I uzun oturum, 100 sistem / 9 AI, 180. aydan | **4/0 PASS** |
| I uzun oturum, 500 sistem / 16 AI, 120. aydan | İlk koşu (8 dk) **3/1** — I0–I2 PASS (330 örnek, kapalı pencerede donma 0); **I3 FAIL** (sensör paylaşımı uygulandı, misafir aynası = host, sızıntı yok, ama C yeni sistem kazanmadı). Tanı alanlarıyla tekrar (3 dk) **4/0 PASS** (C, B'nin görmediği 23 sensör sistemini kazandı). 8 dk tekrarı ve p48 kontrolü: <<I500B>> |
| SG (yeni): insan–insan Savaşa Yardım gerçek masa + host gelen kutusu KABUL (tek ödeme, ikinci kabul `rules:closed`), misafir YENİLGİ + eskortsuz açıklama, sistem oyu kartı | **5/0 PASS** (ilk koşu 4/1: G1'den kalan `#diploPane` kart şeridini örttü → test yardımcısı paneli kapatır; ürün hatası değil, ilk günlük `evidence/.../mp8-SG-ilk-diploPane-ortusu.log`) |
| O kopma / veri taşımayan hat / kayıp ayna / kayıp yanıt / arka plan / yeniden katılma / açık pencere / fed oyu / harita | **11/0 PASS** |
| J kayıt → yeni oda, eski misafir dönüşü | **5/0 PASS** |
| SE (p48 regresyonu) | **8/0 PASS** |
| X (REINF-ROUTE regresyonu) | **5/0 PASS** |
| SP 844×390 ve 800×360 (p48 anomali / haritadan fetih / toplu gizleme) | **3/0 ve 3/0 PASS** |

Not: ilk Chromium kuyruğu disk dolduğu sırada (`No space left on device`, eski faz kontrol kökleri) "Target crashed" ile düştü; disk boşaltıldı, aynı senaryolar yeniden koşuldu. İlk düşen günlükler `evidence/saha-guvence1/crashed-diskfull/` altında korunur (ürün hatası değil, ortam).

### Tam Node koşusu
`STARS_TEST_WORKERS=3 node tests/run-all.js`: **SUITES 242 · GEÇEN 6532 · KALAN 279** (p49). Taban p48 (aynı ortam, SAHA-ENTEGRE.0 sonu): SUITES 238 · GEÇEN 6510 · KALAN 281.
Paket paket karşılaştırma (`evidence/saha-guvence1/full/`): **kötüleşen paket yok**. Farklar yalnız: 4 yeni `saha_guvence1_*` paketi (eşdeğerlik paketi `STARS_CONTROL_ROOT` verilmeden NOT RUN 0/0 — ayrı koşuda 3/0) ve iki eski pakette birer FAIL'in kalkması (`faz92a` 31/3 → 32/2, `faz96h10_army_safety` 8/3 → 9/2). Kalan 279 FAIL p47'den beri gelen eski koruma / ortam FAIL'leri (silinmedi, gevşetilmedi). Koşudan sonra audit / navy çıktı dosyaları geri alındı.

## E. Save8 / RNG
- p48 sabit kopyasına karşı (`git archive 347ef0d`) tohum 11/22/404 × 48 ay, her 6 ayda Save8 SHA-256 + RNG **birebir** (3/0); adayda yeni salt okunur işlevler (`battleUnarmedLost`, `fedVoteSource`) her noktada çağrıldı.
- Zorunlu davranış farkları (AI oyununda tetiklenmedi): C2 toprak vaadi (vaat varken barış sonucu değişir), C4 İsyanı Bastır 6+ hedef (AI ≤3 hedef seçer), C5 oyuncunun federasyonunda sistem oyu → gelen kutusu kaydı (Save8'e giren yeni kayıt).
- Save8 v8, MP paketi 4, protokol 1 değişmedi.

## F. Multiplayer
- Host tek yetki; yeni MP bildirimi (`battleReportFinish` sarmalayıcısı) yalnız oturum `note` listesine yazar (dünyaya / Save8'e değil); misafire yalnız kendi tarafının kaybı ve eskortsuz imha sayısı gider (rakibin gizli bilgisi yok).
- Dört aşamalı emir zinciri (gönderildi → host kabul etti → dünya değişti → misafir gördü) O senaryosunda ayrı ayrı denetlenir; insan–insan yardım kabulünde B'nin aynası savaşı ve kaynağı gördü (SG G1).
- Eski PWA istemcisi: `mp_pwa_surum0_test` 5/0; J senaryosu eski misafirin yeni odaya dönüşü.

## G. Savaş
- Filo kaybı: iki yol da incelendi (fetih anı silme — p48'de kapandı, 11 vaka yeniden PASS; eskortsuz imha — kural korundu, görünür kılındı).
- Yardım teklifi: kabul + tek ödeme + tek uygulama + ret + karşı teklif + geri çekme + savaş bitince geçersiz + kayıt/yükleme + toprak vaadi (Node); gerçek UI ile kabul (Chromium).
- Toprak paylaşımı: C2 düzeltildi; hedef sistem işgalcide kalır, vaatsiz hedef dışı işgal iade edilir, vaat edilen sistem alana devredilir.
- Fetih talep bedeli ölçeklemesi (C3, yalnız analiz): `warFetihClaimCost` ilk 5 hedef bedelsiz; k. ek hedef (k=0,1,…) `10+5k+6×koloni` Etki, başkent +60. Ek hedef sayısı n için koloni dışı kısım `10n+2,5n(n−1)`: 5 ek hedef 100, 10 ek 325, 20 ek 1150 Etki — **karesel büyür**, çok hedefli fethi kendiliğinden sınırlar; tavan `WAR_FETIH_LIMIT=256`. AI bu yolu kullanmaz (≤3 hedef, bedel 0). Kural değiştirilmedi; oyuncu geri bildirimi olmadan ayar önerilmez.
- AI ordu dengesi (B3): 18 koşu (100 sistem "ulu" / 9 AI; tohum 11 / 99 / 404; 120 ay Dengeli + 240 ay Çalkantılı; kollar p47 kontrol, p48 aday, p48 + tek RNG çekimli plasebo). **Ordu yeniden kullanımı (aynı ordu filosunun ikinci fethi) 18 koşunun hiçbirinde görülmedi** (reuse 0, en uzun zincir 1). p48'de fetihten sağ çıkan ordu filoları var (1–3 / koşu; p47'de 0 — kural beklendiği gibi çalışıyor), ama AI bunları ikinci bir fethe yöneltmedi. Hayatta kalan AI sayısı, toplam sistem ve savaş sayısı p48 ile plasebo arasındaki farklar, p48 ile p47 arasındaki farklarla aynı büyüklükte (ör. 240 ay Çalkantılı tohum 99: hayatta AI p47 11 / p48 11 / plasebo 8, ordu gemisi 16 / 17 / 9, AI sistemi 81 / 78 / 72; tohum 11 ve 404'te p48 = plasebo birebir — tek RNG çekimi orada sonucu değiştirmedi) → **ölçülebilir denge etkisi yok; kaotik bant içinde**. AI ordu kuralı değiştirilmedi. Ham veri `evidence/saha-guvence1/army/` (`OZET.txt`, koşu başına JSON).

## H. Paket
`releases/stars-faz96h10p49.zip` — 20 girdi (19 runtime + manifest), 950 199 bayt, SHA-256 `25491d763360688340fc9aaf01e670c15d75f151bcf327366d025a09cdc8946c`, CRC32 `6D58F714`; manifest SHA-256 `b0b400c0…`. Deterministik yeniden paketleme bayt-bayt aynı; ZIP çıkarılıp `verify-release.py --root` ile 19 dosya doğrulandı. Kayıt `RELEASE-SAHA-GUVENCE1.json`. Sürüm 96h10p49 / stars-v96h10p49 / MP.8.9b48 (BUILD_ID ↔ manifest ↔ sw ↔ relay ↔ view birlikte). Save8 v8 / paket 4 / protokol 1.

## I. Açık işler
1. **I3 (500 sistem, 8 dk uzun oturum sonrası) sensör paylaşımı:** ilk koşu 3/1 — anlaşma uygulandı, paylaşım açık, misafir aynası = host, sızıntı yok, ama C yeni sistem kazanmadı (gained 0). Tanı alanlarıyla tekrar (3 dk) 4/0 (C, B'nin görmediği 23 sensör sistemini kazandı). İlk koşunun kökü **BELİRLENEMEDİ** (o anda tanı alanı yoktu); en olası açıklama fikstür ön koşulu: 8 dk oynanıştan sonra B'nin sensör kümesi C'nin görüşüne zaten giriyordu. Test artık bu ön koşulu ayrı iddiayla yazıyor (`fikstür: B'nin C'nin henüz görmediği sensör sistemi var`); iddia gevşetilmedi.
2. Özgün saha 15K filo kaybının hangi yoldan olduğu (fetih anı / eskortsuz imha) kayıt dosyası olmadan kanıtlanamaz.
3. Fiziksel Android, gerçek uzak internet, canlı Render: **NOT RUN**. Kullanıcı kabulü yok.
4. Fetih talep bedeli ölçeklemesi (C3) yalnız analiz edildi; kural değiştirilmedi (AI ≤3 hedef seçer, bedelsiz).
5. Tam Node koşusunda p47'den beri süren 279 eski FAIL (koruma pinleri p45–p47 Codex döneminden, ortam) ayrı temizlik işi.
6. TİCARET-AĞ.0 entegrasyonu ayrı dalda (`claude/stars-ticaret-ag0`), performans kapısı açık; TİCARET-AI.0 ve FED-AI-SİYASET.0 **BAŞLANMADI**.

## Karar tablosu
| Kalem | Durum |
|---|---|
| A MP uzun oturum (100 / 500 sistem, 120 / 180. ay), yeniden bağlanma, kayıt → yeni oda, dört aşamalı emir | TAMAMLANDI VE TEST EDİLDİ (otomatik; I3 500 sistem ilk koşu FAIL, tekrar PASS — açık iş 1) |
| B2 eskortsuz silahsız gemi imhası: açıklama + misafire sonuç | TAMAMLANDI VE TEST EDİLDİ |
| B3 AI ordu dengesi (p47 / p48 / plasebo, 18 koşu) | ARAŞTIRILDI (etki yok, kod değişmedi) |
| C1 insan–insan Savaşa Yardım (kabul, tek ödeme, ret, karşı teklif, süre, savaş bitti, kopma, kayıt) | TAMAMLANDI VE TEST EDİLDİ (Node + Chromium) |
| C2 toprak vaadi barışta iade edilmez | TAMAMLANDI VE TEST EDİLDİ |
| C3 fetih talep bedeli ölçeklemesi | ARAŞTIRILDI |
| C4 İsyanı Bastır bedelsiz | TAMAMLANDI VE TEST EDİLDİ |
| C5 sistem federasyon oyu kartı | TAMAMLANDI VE TEST EDİLDİ |
| D randomEvents MP, anomali bağımsızlığı, kenara alma + kayıt, akıllı duraklatma, 800×360 / 844×390 | TAMAMLANDI VE TEST EDİLDİ (kod gerekmedi) |
| Fiziksel Android / uzak internet / Render | NOT RUN |
| Kullanıcı kabulü | BEKLİYOR (kullanıcı test yapamıyor) |
