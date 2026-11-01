# MP.6.4 — regresyon sonuçları

**Ortam:**
- Bulut konteyneri, Node v22.
- Playwright + Chromium (`/opt/pw-browsers/chromium`).
- Yerel relay; Docker daemon konteyner içinde.

Fiziksel Android, gerçek internet ve LAN: **NOT RUN**.

Son aday: `claude/stars-mp64-espionage-market`. Runtime 19 dosyası MP.6.3 tabanına (`d80ad4b`) göre değişmedi.

## Node

`STARS_TEST_WORKERS=4 node tests/run-all.js` → **SUITES: 161 GEÇEN: 6293 KALAN: 3**

Tek FAIL paketi `faz95d_identity_test.js` (3 vaka):
- seed 11/99/404 coğrafya;
- bilinen ortam FAIL'i (Node v22 kayan nokta son basamak farkı);
- MP.6.3 tabanında da aynı, değişiklikten bağımsız.

Yeni paketler:

| Paket | Sonuç | Kapsam |
|---|---|---|
| `mp64_spy_test` | 7/7 | ağ, istihbarat ilerlemesi, `spyQuote`, `spyOp` (zar host'ta, bayat onay, aynı cid), üç insan gizliliği, özel operasyonlar, MP.4 kayıt/yükleme |
| `mp64_market_test` | 5/5 | kapalı borsa, alım-satım muhasebesi, eşzamanlı `stale`, geçersiz girdiler, MP.4 fiyat çarpanları |
| `mp64_ops_test` | 5/5 | sipariş iptali, ralli/döngü, onarım/takviye, lider, terraform/habitat; başkasının nesnesi reddedilir |
| `mp64_news_test` | 4/4 | taraf / temassız / istihbarat ≥3 kuralları, görünmeyen sistem, host'un oyuncu kapsamlı haberi, ayna biçimi + `deserialize`, RNG/Save8 değişmez |

## Chromium (sırayla, tek tek)

| Test | Sonuç |
|---|---|
| browser-mp64 | **10/10 PASS** (son koşu; ayrıntı aşağıda) |
| browser-mp0 | 20/20 PASS |
| browser-mp1 | 22/22 PASS |
| browser-mp11 | 10/10 PASS |
| browser-mp2 | 14/14 PASS |
| browser-mp3 | 12/12 PASS |
| browser-mp31 | 11/11 PASS |
| browser-mp4 | 13/13 PASS |
| browser-mp5 (Docker relay + TLS vekili) | 10/10 PASS |
| mp5_docker | 6/6 PASS |
| browser-mp6 | **11/11 PASS** (ayrıntı aşağıda) |
| browser-mp61 | 13/13 PASS |
| browser-mp62 | 10/10 PASS |
| browser-mp63 | 15/15 PASS |
| browser-96h10 | 27/27 PASS |

**browser-mp64:**
- İlk tam koşu 8/2. İki FAIL'in nedeni, haber testinin A–2 temasını kaldırıp geri koymamasıydı (fikstür sırası); düzeltildi.
- İkinci koşu 10/10. Ancak federasyon testi `fedExecute` adımında yumuşak geçiyordu: motor tüm katılımcıları "ulaşabilir askerî yardım rotası yok" diye engelledi, karar `ready` kaldı ve test bunu yalnız not etti. Test sıkılaştırıldı (karar `applied`, A katıldı, A kendi bildirimini görür).
- Sıkı test iki gerçek bulgu verdi:
  1. Motorun `aiFedHelp` kapısı katılımcının hedefi **şu an** görmesini ister; `s.seen` yetmez. Açık fikstür: A'nın silahlı filosu hedefe komşu sisteme konur.
  2. **Misafir hatası:** `openFed` dünya kimliği değişince sekmeyi GENEL'e döndürüyordu. Misafirde her ayna yeniden kurulumu yeni `G.emps` ürettiğinden, ASKERÎ sekmedeki oyuncu host'taki her değişiklikte GENEL'e atılıyordu ve KARARI UYGULA kayboluyordu. `guest-stars.js` canlı senkronda `_fedTabsWorld`'ü yeni dünyaya bağlar (diplomasi sayfasındaki `_diploWorld` kalıbı).
- Son koşu **10/10 PASS** (kanıt `mp64-results.json`, `f1-a-executed.png`):
  - motorun `executeFedDecision`'ı kararı `applied` yaptı, A katıldı;
  - B motorun rota gerekçesiyle engellendi;
  - açık ASKERÎ sekmesi gerçek ayna yeniden kurulumundan sonra korundu.

**browser-mp6:** ilk koşu 9/2, düzeltmeden sonra **11/11 PASS**.
- `guest-stars.js` federasyon sekmesi düzeltmesinden sonra misafir arayüzü testleri (mp6, mp61, mp62, mp63) yeniden koşuldu; sonuçlar:
  - browser-mp6 11/11
  - browser-mp61 13/13
  - browser-mp62 10/10
  - browser-mp63 15/15

  Hepsi PASS.
- Test listesi casus ağı, terraform, takviye ve borsayı hâlâ "engelli" sayıyordu; bunlar artık MP komutu. Engelli liste: elçi, rüşvet.
- İkinci FAIL ilkinin ardılıydı: `UI.act('mktTrade')` artık borsa panelini açtığı için DİPLOMASİ düğmesinin üstünde kaldı.

## Yayın

- Runtime 19 dosyası değişmedi.
- `python3 tools/package-release.py` → `releases/stars-faz96h10.zip`, SHA-256 `78e76d1627b8ec1b990849b2242835f78667f110e1d6f17021760183ee7be6d0` (bayt-bayt aynı).
- ZIP çıkarıldı (20 girdi), `verify-release.py --root` → DOĞRULANDI: 19 dosya; oyun build 96h10.
- Yeni ZIP yok.
- Çalışma ağacında `verify-release.py` manifest dışı geliştirme dosyalarını listeler; bu beklenen davranış (`MULTIPLAYER-MP64-SONUC.md` §7).
