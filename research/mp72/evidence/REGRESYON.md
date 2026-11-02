# MP.7.2 — regresyon ve kanıt kaydı

Ortam: bulut konteyner, Node v22, Chromium `/opt/pw-browsers/chromium` (Playwright), Docker. Fiziksel Android, gerçek internet, LAN ve canlı Render servisi **NOT RUN**.

**Runtime:** 19 dosya MP.7.1 (`b20994e`) ile bayt-bayt aynı; `RELEASE-MANIFEST.json` SHA-256'ları çalışma ağacıyla eşleşti, build `96h10p2`. `releases/stars-faz96h10p2.zip` değişmedi (SHA-256 `dc52bfe543b11bf7483969b6935172bcc65ece8c307fb28a0587ee1640e7bc62`, CRC32 `fac53d8b`). Yeni ZIP üretilmedi.

## Node

| Koşu | Sonuç |
|---|---|
| Tam `node tests/run-all.js` | 166 paket, **6330 GEÇEN / 3 KALAN**. 3 KALAN yalnız bilinen `faz95d_identity` (11/99/404 coğrafya, Node v22 kayan nokta; değişiklikten bağımsız). |
| Son adayla MP paketleri (`STARS_TEST_FILTER=mp`) | 35 paket, **697 / 0**; yeni `mp72_gameplay_test` 12/0 dahil |
| `faz95c_joint_campaign_test` (ortak sefer motoru, yamalardan sonra) | 59 / 0 |

Tam koşudan sonra değişenler:
- yalnız misafir istemci dosyası (`guest-stars.js`: geçersiz elçi görevinde motorun kendi reddi);
- iki tarayıcı testi.

Bunları yükleyen MP Node paketleri ve tarayıcı testleri son adayla yeniden koşuldu.

## Chromium

| Test | Sonuç | Not |
|---|---|---|
| browser-mp72 (yeni) | **9 / 0** | Son aday, art arda iki koşu. Üretim kipi relay + parçalayan TLS vekili; yatay 844×390 / 800×360 / 915×412. |
| browser-mp71 | 12 / 0 | |
| browser-mp7 | 9 / 0 | |
| browser-96h10 (tek oyunculu) | 27 / 0 | Çıkış 0. GEÇEN satırı basmaz; sayım PASS satırlarından. |
| browser-mp0 | 20 / 0 | |
| browser-mp1 | 22 / 0 | |
| browser-mp11 | 10 / 0 | |
| browser-mp2 | 14 / 0 | |
| browser-mp3 | 12 / 0 | Eski MP paneli `MP7Legacy` kipinde. |
| browser-mp31 | 11 / 0 | Eski MP paneli `MP7Legacy` kipinde. |
| browser-mp4 | 13 / 0 | |
| browser-mp6 | 11 / 0 | Son aday. "Desteklenmeyen" vakası elçi yerine konsey vetosuyla; elçi artık komut. |
| browser-mp61 | 13 / 0 | |
| browser-mp62 | 10 / 0 | |
| browser-mp63 | 15 / 0 | Akıllı duraklatma. |
| browser-mp64 | 10 / 0 | |
| mp5_docker | 6 / 0 | İmaj güncel ağaçtan derlendi. |
| browser-mp5 | 10 / 0 | Docker relay + TLS vekili + TCP kesici. |

**İlk koşuda yakalanıp düzeltilen:**
- **browser-mp6:** eski vaka `UI.act('envoyTask','1')` (görev adı yok) gönderiyordu. Misafir sarmalayıcısı geçersiz görevi başarılı döndürdüğü için tek oyunculu kod `ENVOY_TASKS[undefined].n`'de çöktü. Gerçek bir sağlamlık hatasıydı: artık geçersiz görev motorun kendi reddine gider.
- **browser-mp72 A2:** fikstür, doktrini elçiyi yasaklayan bir AI seçebiliyordu. Artık kapısı açık AI seçiliyor.
- **browser-mp72 A6:** "bölgeyi savun" düğmesinin etkinliği aynadaki bilinen-sistem verisine bağlı. Test etkin olan gerçek destek düğmesini kullanıyor.

## browser-mp72 vakaları

- **A1:** misafir envanteri 68 → 45; ortak destek paneli host verisine bağlı; ayrı MP paneli yok.
- **A2:** İLİŞKİ → ELÇİ GÖNDER → görev (dokunma) → host `setEnvoyTask`; yeniden açınca MEVCUT GÖREV; GERİ ÇEK → host kaydı siler. Elçi penceresi 800×360'ta ekranda.
- **A3:** BİLEŞİMİ OLUŞTUR → sayı → KAYDET (dokunma) → host `setFleetTemplate`; OTOMATİK TAKVİYE → host açar / kapatır.
- **A4:** aynı sistemde iki savaş filosu → SAVAŞ FİLOSUNU BİRLEŞTİR (dokunma) → host `merge`.
- **A5:** OTOMATİK İNŞAYI AÇ / KAPAT (dokunma) → host `colAuto`; bombardıman kipi `UI.act` yolundan → host.
- **A6:** müttefik AI ile aynı sefer (fikstür). Gerçek "Ortak askerî koordinasyon" bölümü host verisiyle; destek düğmesi → TALEBİ GÖNDER (dokunma) → host motoru `jointRequest`. Motorun yanıtı panelde, iki koşuda da "Ret: Kendi stratejik savunması veya kritik filo görevi öncelikli" (rastgele galaksinin gerçek koşulu). Kabul + iptal yolu Node fikstüründe.
- **A7:** host'un filosu / kolonisi / temas kurulmamış devlet → `not-owner` / `no-target`; host'ta değişiklik yok.
- **B1:** host + 2. C (915×412) → B'ye elçi; host uygular; B'nin aynasında C'nin elçi haritası yok; B, C'nin filosunu yönetemez.

## Kalan 45 eylem (misafirde soluk + uyarı)

| Grup | Sayı | Eylemler |
|---|---|---|
| Tek oyunculu / geliştirici / kurulum (bilerek kapalı) | 13 | `autoEvent`, `diagCopy`, `mapFix`, `physio`, `restart`, `rollName`, `sandbox`, `stashNote`, `toTitle`, `tplDel`, `tplLoad`, `tplSave`, `trigCrisis` |
| Tek oyunculuda da çalışmayan eski düğme (gereksiz) | 2 | `survey`, `terra` |
| Galaktik Konsey (MP.7.3) | 15 | `bill`, `billPick`, `billTarget`, `blackmail`, `bribe`, `cncFound`, `cncJoin`, `cncLeave`, `cncNo`, `cncPane`, `cncYes`, `permanent`, `reform`, `throneBuild`, `veto` |
| Karmaşık entrika (MP.7.3) | 12 | `bmGo`, `fundSep`, `joinRebel`, `leaveRebel`, `panoptRetarget`, `revolt`, `revoltConfirm`, `sitPick`, `whisperBlame`, `whisperGo`, `whisperMenu`, `whisperPick` |
| Yıkıcı / geri alınamaz savaş (MP.7.3) | 3 | `colFire`, `devour`, `devourConfirm` |

Kaynak: `mp72-results.json` `metrics.unsupported` (gerçek `UI.act` gövdesinden).
