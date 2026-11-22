# STARS — Sonraki oturum devri (program durumu)

Güncelleme: 22 Kasım 2026 · Program: SAHA-GÜVENCE.1 → TİCARET-AĞ.0 → TİCARET-AI.0 → FED-AI-SİYASET.0

Bu dosya bütün programın tek bakışta durumudur. Faz ayrıntıları ilgili `*-SONUC.md` raporlarında.

## Son gerçek HEAD ve dallar

| Dal | HEAD | Durum |
|---|---|---|
| `claude/stars-saha-guvence1` | son rapor commit'i (kod/sürüm `b430b73`) | SAHA-GÜVENCE.1 (p49 / MP.8.9b48) — otomatik testlerden geçen **en güvenli oynanabilir sürüm** |
| `claude/stars-ticaret-ag0` | son commit (SG1 `b430b73` birleşik) | TİCARET-AĞ.0 entegrasyonu — **KISMEN**, oynanabilir sürüm DEĞİL (100 sistem p95 kapısı açık), sürüm p49 kalır, ZIP yok |
| `claude/stars-saha-entegre0` | `347ef0d` | p48 (PR #68), SAHA-GÜVENCE.1'in tabanı |
| `codex/stars-ticaret-agi0` | `84de561` | Codex TİCARET-AĞI.0, **p47 tabanlı**; `claude/stars-ticaret-ag0` içine birleştirildi |
| `codex/stars-mp-rakip-doktrinler0` | `8984b51` | p47 (PR #63) |

Render'da denenecek dal: `claude/stars-saha-guvence1` (p49 / MP.8.9b48). `claude/stars-ticaret-ag0` Render'a **verilmemeli**. Canlı Render bu oturumda değiştirilmedi ve sınanmadı (NOT RUN).

## Tamamlanan aşamalar
- **SAHA-GÜVENCE.1** (p49): A uzun oturum / yeniden bağlanma / kayıt → yeni oda (otomatik), B2 eskortsuz imha görünür + misafire muharebe sonucu, B3 AI ordu dengesi ölçümü (etki yok), C1 insan–insan Savaşa Yardım uçtan uca, C2 toprak vaadi iadesi düzeltildi, C4 İsyanı Bastır bedelsiz, C5 sistem federasyon oyu kartı, D olay / duraklatma doğrulandı. Rapor `reports/claude/SAHA-GUVENCE1-SONUC.md`.
- **TİCARET-AĞ.0** (kısmi): Codex TİCARET-AĞI.0 p49'a birleştirildi, hedefli ticaret + SG testleri birleşik dalda geçti; performans kök nedeni bulundu (tam grafik `dealTxBegin`). Rapor `reports/claude/TICARET-AG0-SONUC.md` (ticaret dalında).

## Yarım kalan / başlanmayan işler
- TİCARET-AĞ.0: tam Node koşusunda 40 pakette kötüleşme (279 → 441 FAIL; Codex dalında da aynı — anlık takas kapanışı eski fikstürleri bozuyor). Önce paket paket sınıflandırma, sonra performans.
- TİCARET-AĞ.0: yazma günlüklü `dealTxBegin` (kod yok) → 100 / 500 sistem p95 ≤ %5; sonra sürüm p50 + ZIP.
- **TİCARET-AI.0: BAŞLANMADI.** (AI'nın Transit İzni satın alması / zincirli liman yatırımı doğal kampanyada gözlenmedi — Codex bulgusu.)
- **FED-AI-SİYASET.0: BAŞLANMADI.** (katıl / kur / bağımsız, tür farkları, ayrılma, AI ücretli savaş desteği ve geçiş, federasyon oyları, kampanyalar.)
- I3 500 sistem 8 dk sonrası sensör paylaşımı ilk koşu FAIL kökü (bkz. SONUC §I.1).

## Son başarılı / başarısız testler
- PASS: `saha_guvence1_{fleet,war,events,equivalence}` 6/0, 10/0, 4/0, 3/0; Chromium SG 5/0, O 11/0, J 5/0, SE 8/0, X 5/0, I 100 sistem 120. ay 4/0, 180. ay 4/0, SP 844×390 3/0, 800×360 3/0; tam Node 242 paket / 6532 / 279 (p48'e göre kötüleşen yok).
- FAIL: I 500 sistem 120. ay 8 dk ilk koşu 3/1 (I3); tekrarlar 3 dk 4/0, 8 dk 4/0, p48 kontrolü 4/0 (yeniden üretilmedi).
- NOT RUN: fiziksel Android, gerçek uzak internet, canlı Render, karışık sürüm (p47 istemci) ticaret oturumu.

## Eski FAIL'ler
Tam Node koşusundaki eski FAIL'ler (p47'den beri; bu programdan bağımsız) silinmedi. Karşılaştırma git worktree kökleriyle yapılmalı (git archive kopyasında git gerektiren paketler çöker). Ayrıntı: `reports/claude/evidence/saha-guvence1/full/`.

## Save8 uyumluluğu
Save8 v8, MP paketi 4, protokol 1. p49 paket yükleyicisi p41–p48 paketlerini kabul eder. Eski kayıtlar açılır; yeni alanlar yalnız kullanıldığında yazılır.

## Multiplayer durumu
Host tek yetki. Uzun oturum (100 / 500 sistem, 120. / 180. ay), kopma / yeniden bağlanma / kayıp ayna / kayıp yanıt / arka plan / kayıt → yeni oda ve insan–insan yardım anlaşması yerel Chromium + relay + TLS ile otomatik sınandı. Fiziksel Android, gerçek uzak internet ve canlı Render **NOT RUN**.

## Açık riskler
- Ticaret dalının performansı (tam grafik işlem kopyası × fazladan AI sözleşmesi).
- Gerçek saha kayıtları olmadan özgün 15K kaybı / donma kökleri kanıtlanamadı; otomatik senaryolarda yeniden üretilmedi.
- Eski 279 Node FAIL'i gürültüsü yeni regresyonu gizleyebilir: her zaman paket paket taban karşılaştırması yapın.

## Sonraki oturumun ilk kesin görevi
`claude/stars-ticaret-ag0` üstünde önce 40 kötüleşen Node paketini sınıflandırmak (tasarım değişikliği mi / gerçek regresyon mu; `reports/claude/TICARET-AG0-SONUC.md` §C), sonra `dealTxBegin`'i yazma günlüklü işleme çevirmek: aynı Save8'den kontrol (p49 sabit kopya) – aday Save8 SHA-256 + RNG birebir (`research/perf1/scripts/bench.cjs` TRACE=1) + `faz96a_integrity` / anlaşma geri alma testleri, ardından 100 ve 500 sistem tam ay p95 (kapı %5). Kapı geçerse p50 sürümü; geçmezse ticaret dalı yayınlanmaz ve FED-AI-SİYASET.0'a SG1 (p49) tabanından başlanır.
