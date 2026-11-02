# MP.7.3 — regresyon ve kanıt kaydı

Ortam: bulut konteyner, Node v22, Chromium `/opt/pw-browsers/chromium` (Playwright), Docker 29.

Koşulmayanlar (**NOT RUN**): fiziksel Android, gerçek internet, LAN ve canlı Render servisi.

**Runtime:**
- 19 dosya MP.7.2 (`ed97262`) ile bayt-bayt aynı; build `96h10p2`.
- `releases/stars-faz96h10p2.zip` değişmedi: SHA-256 `dc52bfe543b11bf7483969b6935172bcc65ece8c307fb28a0587ee1640e7bc62`, CRC32 `fac53d8b`.
  - Çıkarıldı; `verify-release.py --root` → "DOĞRULANDI: 19 dosya; oyun build 96h10p2".
  - 20 girdinin hepsi çalışma ağacıyla `cmp` ile aynı.
- Yeni ZIP üretilmedi.

## Node

| Koşu | Sonuç |
|---|---|
| Tam `node tests/run-all.js` (4 işçi; son üretim koduyla) | 167 paket, **6330 GEÇEN / 4 KALAN** |
| — 3 KALAN | Bilinen `faz95d_identity` (11/99/404 coğrafya, Node v22 kayan nokta; değişiklikten bağımsız) |
| — 1 KALAN | `mp73_council_test`: 180 sn paket sınırında öldürüldü (11/0'ı tek başına geçiyordu). Uzun eşdeğerlik ayrı pakete alındı (aşağıda). |
| `mp73_council_test` (ayrıldıktan sonra) | **10 / 0**, 12 sn |
| `mp73_council_equiv_test` (4200 gün: kuruluş + AI katılımı + 4 kampanya) | **1 / 0**, 51 sn |
| `MP73_EQUIV_DAYS=9000` (25 yıl) | **1 / 0**. Kollar 198 / 133 sn; konsey 5 üye; Save8 + RNG birebir. |
| MP alt kümesi (`STARS_TEST_FILTER=mp`, 4 işçi; ayrılmış testlerle) | **37 paket, 708 / 0** (`mp73_council_test` 10/0, `mp73_council_equiv_test` 1/0 sınır içinde) |

Tam koşudan sonra üretim kodu değişmedi. Değişenler yalnız testler (paket bölme, tarayıcı testi beklemeleri) ve belgeler.

Tam koşunun yeniden yazdığı dosyalar geri alındı:
- `tests/navy-95a-after-{11,99,404}.json`;
- `war-lines-on.png`;
- `identity-distribution.json`;
- `tests/audit96g2` depo dışına taşındı.

## Chromium

| Test | Sonuç | Not |
|---|---|---|
| browser-mp73 (yeni) | **8 / 0** | Son aday. Üretim kipi relay + parçalayan TLS vekili; yatay 844×390 / 800×360 / 915×412. |
| browser-mp72 | **9 / 0** | Son aday; envanter beklentisi 45 → 18. |
| browser-mp71 | 12 / 0 | |
| browser-mp7 | 9 / 0 | |
| browser-96h10 (tek oyunculu) | 27 / 0 | Çıkış 0. GEÇEN satırı basmaz; sayım PASS satırlarından. |
| browser-mp0 | 20 / 0 | |
| browser-mp1 | 22 / 0 | |
| browser-mp11 | 10 / 0 | |
| browser-mp2 | 14 / 0 | |
| browser-mp3 | 12 / 0 | |
| browser-mp31 | 11 / 0 | |
| browser-mp4 | 13 / 0 | |
| browser-mp6 | 11 / 0 | "Desteklenmeyen" vakası artık `joinRebel` / `sitPick`; rüşvet / veto komut oldu. |
| browser-mp61 | 13 / 0 | |
| browser-mp62 | 10 / 0 | |
| browser-mp63 | 15 / 0 | |
| browser-mp64 | 10 / 0 | |
| mp5_docker | 6 / 0 | İmaj güncel ağaçtan derlendi. |
| browser-mp5 | 10 / 0 | Docker relay + TLS vekili + TCP kesici. |

**Docker imajı içeriği.** `stars-relay:mp5-test` imajındaki 9 MP dosyasının SHA-256 önekleri çalışma ağacıyla aynı:

| Dosya | Önek |
|---|---|
| `mp-core.js` | `4ee84321882f` |
| `relay.js` | `13d26c7b409a` |
| `view.js` | `b71a7509fa7f` |
| `mp1-host.js` | `b00f46749cd4` |
| `join.js` | `f0a26c2d7c81` |
| `mirror.js` | `75730fb35ea6` |
| `guest-stars.js` | `d85bd60307e3` |
| `mp71-dip.js` | `4b7b5e64b5ba` |
| `mp7-setup.js` | `4f8fef4ce1a9` |

`/mp/version` aynı önekleri raporlar (`mp73-results.json` → `metrics.version`).

### İlk koşularda yakalanan ve düzeltilenler

- **browser-mp73 B3:** rüşvet düğmeleri tek oyunculuda Konsey penceresinde değil, İSTİHBARAT → OPERASYONLAR → SİYASİ VE LOJİSTİK grubunda (`intelSenate`). Test gerçek yolu kullanır.
- **browser-mp73 B1:**
  - Konsey paneli kayarak açılır; ölçüm panel yerine oturunca yapılır.
  - Bir koşuda `scrollIntoView` sırasındaki geçici konum okundu (ekran görüntüsünde düğmeler tam görünür). Ölçüm yerleşince en çok 3 kez yinelenir; son koşuda yineleme gerekmedi.
  - B2 / B3 ilk koşularda B1'e bağlı ardışık hataydı.
- **browser-mp72 A6** (ortak destek düğmesi; MP.7.2'de de bilinen rastgele galaksi bağımlılığı):
  - Paket koşusunda bir kez etkin destek düğmesi 30 sn içinde çıkmadı.
  - Yeniden koşuda 9/0 (BÖLGEYİ SAVUN).
  - Zaman aşımında paneli kaydeden tanı eklendi.
- **mp73_council_test:** 25 yıllık eşdeğerlik `run-all`'ın 180 sn sınırını aştı → ayrı paket (4200 gün varsayılan, 9000 gün isteğe bağlı).

## browser-mp73 vakaları

| Vaka | İçerik |
|---|---|
| A1 | Rehber 1–8: oda, iki tasarım, başlat; iki ekranda galaksi; `/mp/version` = `MP.7.3` / `96h10p2`; sürüm satırı; misafir tanı satırı (`STARS MP.7.3 · oyun 96h10p2 · host bağlı · aşama: ready · son hata: yok`); envanter 18 |
| A2 | Rehber 9–12: filo hareketi (`orderMove` → host); B → host teklif + gelen kutusundan kabul; zaman iki ekranda |
| A3 | Rehber 13–15: 3 sn ağ kesintisi → aynı devlet; host kaydı `validatePackage` |
| B1 | Konsey (kongre); AI insanlar adına oy / sponsor yazmaz; B kart → Konsey ekranı → EVET (dokunma); oylama açık kalır |
| B2 | C (915×412) HAYIR; host kendi Konsey ekranından EVET → motor kapatır; tekrar oy reddedilir |
| B3 | B tasarı (dokunma) → sponsor B; AI üyeye rüşvet (dokunma) → 200 mineral; insan üyeye `rules:human`; C'nin aynasında yalnız kilit |
| B4 | Fısıltı ağı gerçek pencereden (B'nin günlüğü +1, host'unki aynı); onaysız `devourConfirm` komut göndermez |
| — | Sayfa hatası yok |

