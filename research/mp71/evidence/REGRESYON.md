# MP.7.1 — regresyon ve kanıt kaydı

Ortam: bulut konteyner, Node v22, Chromium `/opt/pw-browsers/chromium` (Playwright), 4 çekirdek. Fiziksel Android, gerçek internet, LAN ve canlı Render servisi **NOT RUN**.

Runtime (19 dosya) MP.7 ile bayt-bayt aynı: `RELEASE-MANIFEST.json` SHA-256'ları çalışma ağacıyla eşleşti. `releases/stars-faz96h10p2.zip` çıkarılıp `tools/verify-release.py --root` → DOĞRULANDI (19 dosya, build `96h10p2`). Yeni ZIP üretilmedi.

## Node

| Koşu | Sonuç |
|---|---|
| Tam `node tests/run-all.js` (son adaydan önceki köprü sürümüyle) | 165 paket, **6318 GEÇEN / 3 KALAN** — 3 KALAN yalnız bilinen `faz95d_identity` (11/99/404 coğrafya, Node v22 kayan nokta; değişiklikten bağımsız) |
| Son adayla MP paketleri (`STARS_TEST_FILTER=mp`) | 34 paket, **685 / 0** (yeni `mp71_bridge_test` 8/0, `mp1_relay_test` 14/0, `mp6_mirror_test` 8/0 dahil) |

Tam koşudan sonra değişen yalnız istemci dosyalarıdır (`guest-stars.js` görünüm listesi, `mp71-dip.js`); bunları yükleyen Node paketleri son adayla yeniden koşuldu.

## Chromium

| Test | Sonuç | Not |
|---|---|---|
| browser-mp71 (yeni) | **12 / 0** | son aday; üretim kipi relay + parçalayan TLS vekili, yatay 844×390 / 800×360 / 915×412 |
| browser-mp7 | 9 / 0 | son aday |
| browser-96h10 (tek oyunculu) | 27 / 0 | çıkış 0 (GEÇEN satırı basmaz; PASS satırı sayımı) |
| browser-mp0 | 20 / 0 | |
| browser-mp1 | 22 / 0 | |
| browser-mp11 | 10 / 0 | |
| browser-mp2 | 14 / 0 | |
| browser-mp3 | 12 / 0 | eski MP paneli `MP7Legacy` kipinde |
| browser-mp31 | 11 / 0 | eski MP paneli `MP7Legacy` kipinde |
| browser-mp4 | 13 / 0 | |
| browser-mp6 | 11 / 0 | eski panel bölümü misafirde `MP7Legacy` ile |
| browser-mp61 | 13 / 0 | |
| browser-mp62 | 10 / 0 | |
| browser-mp63 | 15 / 0 | akıllı duraklatma |
| browser-mp64 | 10 / 0 | |
| mp5_docker | 6 / 0 | imaj güncel ağaçtan derlendi; `research/mp71/client/mp71-dip.js` imajda |
| browser-mp5 | 10 / 0 | Docker relay + TLS vekili + TCP kesici |

**Son aday tekrar** (misafir görünüm listesi düzeltmelerinden sonra): browser-mp71 12/0, browser-mp6 11/0, browser-mp61 13/0, browser-mp62 10/0, browser-mp63 15/0, browser-mp64 10/0, browser-mp7 9/0. Diğer satırlar aynı adayın köprüsüyle; değişiklik yalnız misafir görünüm listesindeydi.

## browser-mp71 vakaları

- A1 oda, iki tasarım (gerçek kurulum ekranı), başlat; ikisi haritayı görür; ayrı MP diplomasi paneli / düğmesi yok; lobide hayalet tıklama penceresi yok; misafirde desteklenmeyen eylem envanteri dolu ve Ekonomi Merkezi görünüm eylemi çalışır.
- A2 host gerçek MÜZAKERE penceresinden B'ye teklif (kaynak ver / iste, gerçek dokunma); insan oyuncu notu; B'nin stok satırı host'a gösterilmez; BEKLEYEN TEKLİFLERİN (1).
- A3 B gerçek bildirim kartından kaydı açar; KABUL ET / REDDET / Karşı teklif hazırla 800×360'ta ekranda, çakışmaz; doğru KARARIN ETKİSİ metni (27 ay / −5 yok); kabul → kaynaklar el değiştirir; host'un Gönderilen sekmesinde Kabul edildi.
- A4 B → host teklif; host kartı açar, Karşı teklif hazırla, maddeyi değiştirip TEKLİFİ SUN (`counter`); B kartı açıp REDDEDER; B'nin Gönderilen sekmesi "Karşı teklif · Karşı teklif geldi · reddedildi"; host'un gelen kutusu geçmişi "Karşı teklif gönderildi".
- A5 host MÜZAKERE kutusundan iki adımlı GERİ ÇEK; çift dokunuş tek komut; B'nin kartı kalkar, geçmişte Geçersizleşti · Gönderen geri çekti.
- A6 B'nin Gönderilen sekmesi açıkken host kabul eder → satır yerinde güncellenir (pencere ve liste öğesi aynı); B'nin yarım taslağı yeni aynalardan sonra korunur.
- A7 yetkisiz / yinelenen: kendi teklifine yanıt (`not-recipient`), başkasının teklifini geri çekme (`not-sender`), sonuçlanmışa ikinci kabul (`closed`); B çevrimdışıyken gelen teklif dönüşte kartta, tek uygulama.
- A8 MP.4 paketi: teklif durumları (accepted / countered / invalid / rejected) ve host gelen kutusu kayıtları (Save8) pakette; paket doğrulanır.
- B1 host + 2: B → C teklif, C (915×412) karşı teklif, B kabul; host ölçümde hızı 0'a alıp aktarımı birebir doğrular (−100 / +100 / +10 / −10).
- B2 gizlilik: host'un gelen kutusunda / görünümünde B–C teklifi yok; C'nin aynasında B'nin stoğu 0; C kendi karşı teklifini kabul edemez.
- B3 B'nin Gönderilen sekmesi ayrıntısı; düğmeler 800×360'ta ekranda.

Ekran görüntüleri: bu dizindeki PNG'ler (host ve misafir, yatay).

## Diğer paneller denetimi — misafirde MP komutu olmayan gerçek STARS eylemleri

Soluk görünür; dokununca açık uyarı verir; dünya değişmez. Kaynak: `mp71-results.json` `metrics.unsupported` (gerçek `UI.act` gövdesinden). **68 eylem:**

| Grup | Sayı | Eylemler |
|---|---|---|
| Galaktik konsey (önerge, oy, veto, reform, taht) | 13 | `bill`, `billPick`, `billTarget`, `cncFound`, `cncJoin`, `cncLeave`, `cncNo`, `cncPane`, `cncYes`, `permanent`, `reform`, `throneBuild`, `veto` |
| Casusluk / entrika (MP.6.4 kapsamı dışındaki özel işlemler) | 15 | `blackmail`, `bmGo`, `bribe`, `fundSep`, `joinRebel`, `leaveRebel`, `panoptRetarget`, `patronage`, `revolt`, `revoltConfirm`, `sitPick`, `whisperBlame`, `whisperGo`, `whisperMenu`, `whisperPick` |
| Elçi | 3 | `envoy`, `envoyRecall`, `envoyTask` |
| Savaş / ortak savaş hazırlığı / savaş alanı | 15 | `aimCancel`, `aimSet`, `bombMode`, `colFire`, `devour`, `devourConfirm`, `dismissBattleReport`, `fedWarRequest`, `gobattle`, `jointCancel`, `jointChooseTarget`, `jointPrepare`, `jointRequest`, `ultimatum`, `warPauseToggle` |
| Filo / koloni üretim düzeni | 9 | `build2`, `compositionAuto`, `compositionEdit`, `compositionSave`, `dirTog`, `mergeArmed`, `rallySet`, `survey`, `terra` |
| Tek oyunculu oyun / kurulum / geliştirici (MP'de anlamsız) | 13 | `autoEvent`, `diagCopy`, `mapFix`, `physio`, `restart`, `rollName`, `sandbox`, `stashNote`, `toTitle`, `tplDel`, `tplLoad`, `tplSave`, `trigCrisis` |

**MP.7.1'de bulunan ve düzeltilen:**
- Runtime (`economy-ui.js`) `UI.act`'i sardığı için misafirin desteklenmeyen listesi MP.6'dan beri **boş**tu: düğmeler engelleniyor ama soluk gösterilmiyordu. Liste artık `/ui.js`'teki gerçek `act` gövdesinden çıkarılır.
- Ekonomi Merkezi görünüm eylemleri (`ecoPick`, `ecoFilter`, `ecoSystem`, `ecoFleet`) ve salt gezinme `ctrBack`, `dTab` misafirde engelleniyordu; artık yerel görünüm.

Yeni mekanik eklenmedi. Yukarıdaki eylemlerin MP komutu sonraki fazların konusudur (konsey, elçi, ortak savaş hazırlığı, filo bileşimi, özel entrika).
