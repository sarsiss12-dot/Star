# TİCARET-AĞ.1 — Devir (sonraki Claude oturumu)

Güncelleme: 22 Kasım 2026

## Güncel HEAD / dallar
| Dal | HEAD | Durum |
|---|---|---|
| `claude/stars-ticaret-ag1` | bu dosyayı içeren commit (bkz. `git log`) | TİCARET-AĞ.1, taslak; **oynanabilir sürüm değil** (100 sistem perf kapısı) |
| `claude/stars-ticaret-ag0` | `23cc1bb` | PR #70 (değiştirilmedi) |
| `claude/stars-saha-guvence1` | `e4350e5` | **p49 / MP.8.9b48 — en güvenli oynanabilir dal** (PR #69, değiştirilmedi) |

Render'da kullanıcı testi için: `claude/stars-saha-guvence1`. Ticaret dalları Render'a verilmez.

## Tamamlananlar
1. 40 kötüleşen paketin ortak kökü bulundu ve kapatıldı: `res` maddesi PR #70'te tek seferlik fiziksel kargoya çevriliyordu. `res` p49 gibi anlık; fiziksel tek seferlik kargo açık `cargo` maddesi (`diplomacy.js`, `commerce.js freightPlan`, `ui.js` "Mal teslimi" seçimi, `mp-core` ITEM_T / dipItems / gift, `guest-stars` cargo + VIEW + misafirde Commerce rota gerekçesini host'a bırakan `dealQuote` sarmalayıcısı).
2. Testler: `tests/ticaret_ag1_test.js` (9/0), `tests/ticaret_agi0_test.cjs` (28/0), `faz86b` 121/22 (p49 120/22), `faz92c` 29/0; MP8 **TA** senaryosu (6/0).
3. Performans ölçüldü (p49'a karşı), kök neden kanıtlandı (fazladan meşru AI freight sözleşmesi × tam `dealTxBegin`).

## İlk başarısız / son başarılı testler
- İlk FAIL: TA ilk koşu A0 fikstürü (uzak başkentler arası rota yok; fikstür düzeltildi), A1 misafirde TEKLİFİ SUN pasif (yerel ayna rota denetimi — `guest-stars` sarmalayıcısıyla düzeltildi; host gerçek denetimi yapar, `ticaret_ag1_test` M1).
- Son PASS: TA 6/0, SG 5/0, O 11/0, J 5/0, SE 8/0, X 5/0, SP 800×360 3/0 (SG–X ve SP misafir sarmalayıcısından önce koşuldu; sarmalayıcı yalnız cargo/freight içeren misafir tekliflerini etkiler).
- Kalan FAIL: **TL 2/3** (TL2–TL4) — **PR #70'te de aynı** (değiştirilmemiş `23cc1bb` worktree ile koşuldu). Tanı: TL2'de misafir C'nin izin isteği host'ta bekliyor (n=2, done=1), fakat testin eşleştirmesi bulamıyor; TL4 aynı teklifi tekrar gönderince host `rules:duplicate` döner. Node'da aynı MP komut zinciri doğru çalışıyor (`evidence/ticaret-ag1/…` + `../ag1/tl.js` mantığı). Kök **BELİRLENEMEDİ** (test yardımcısı tarafında); `tests/helpers/ticaret-agi0-mp.cjs` teklifi içerikle arar ve tanı basar.
- Tam Node: 243 paket / 6539 / 283 (p49 242 / 6532 / 279); manifest kaynaklı `mp11_online` / `mp1_relay` FAIL (sürüm yükseltilmediği için).

## Performans
100 sistem tek ay p95 **+%9,89 (FAIL)**; 500 sistem 120. ay −%6,93, 180. ay −%1,85 (PASS). 24 aylık kampanya ortalaması gürültü bandında (+%5,1 / −%1,0). Ayrıntı `TICARET-AG1-SONUC.md` §E.

## Değişen dosyalar (PR #70'e göre)
`diplomacy.js`, `commerce.js`, `ui.js`, `archive-ui.js`, `research/mp0/mp-core.js`, `research/mp6/client/guest-stars.js`, `tests/ticaret_agi0_test.cjs`, `tests/ticaret_ag1_test.js`, `tests/faz86b_deal_engine_test.js`, `tests/faz92c_settlement_apply_test.js`, `tests/helpers/ticaret-ag1-mp.cjs`, `tests/helpers/ticaret-agi0-mp.cjs`, `tests/browser-mp8.cjs`, raporlar.

## Sonraki kesin kod adımı
`executeDeal` için **düzenli ticaret sözleşmesi kapsamlı işlem**: maddelerin tamamı `freight` / `portTransit` / `pact` iken (Commerce.freightPlan zaten yalnız bu kombinasyona izin verir) `dealTxBegin` tam dünya yerine yalnız etkilenen kökleri kopyalasın. Yöntem:
1. Yazma kümesini kanıtla: tam `txCaptureGraph` öncesi/sonrası farkını (değişen nesneler) bu deal türünde 3 tohum × 48 ayın her `executeDeal`'inde topla; kümede G.commerce, iki taraf devlet nesnesi, gelen kutusu/haber tamponu, `economyHistory` dışında nesne çıkarsa kapsamlı işlemi YAPMA.
2. Kapsamlı yolu yalnız o kanıtlanmış kümeye uygula; `_dealFailInject` her kancada (after:items/after:cost/…) geri almadan sonra `serialize()` bayt-bayt aynı olmalı (yeni test).
3. Aynı Save8'den p49 sabit kopya vs aday Save8 + RNG ay ay birebir (ticaret tetiklenmeyen kollarda) ve 100 / 500 sistem `ay-maliyeti.cjs` p95 yeniden.
Kapı geçerse: `BUILD_ID` 96h10p50 + manifest + sw + relay + view (MP.8.9b49) birlikte, p49 paket uyumluluğu, deterministik ZIP, `mp11_online`/`mp1_relay` yeniden.

## Yayın engelleri
1. 100 sistem p95 +%9,89 (sınır %5).
2. TL senaryosu 2/3 (PR #70'te de) — kökü belirlenmeli.
3. Fiziksel Android / uzak internet / Render NOT RUN.
