# TİCARET-AI.0 Faz A — doğal kampanya ticaret karar hunisi (p50 `d1784ff`, kod değişikliği yok)

Koşu: `node research/ticaret-ai0/funnel2.cjs <kök> <tohum> 120 <çıkış>` (100 sistem `ulu`, 9 AI). Kopyalar salt gözlemdir:
`f2-*.json` (kopyalar açık) ile `f2n-*.json` (`NOCLONE=1`) son Save8 SHA-256 / RNG birebir aynı (11 `bd8dfa43…`, 99 `ff365c4e…`, 404 `5fdf5507…`).
`funnel-*.json` ilk katman (aiTransitRequest gerçek bütçe kopyasıyla).

| | 11 | 99 | 404 |
|---|---|---|---|
| aiTransitRequest çağrısı | 312 | 1405 | 597 |
| — Etki < 80 / ihtiyaç eşleşmesi yok / izin verebilecek bilinen sahip yok | 7 / 76 / 173 | 30 / 420 / 331 | 30 / 270 / 29 |
| — denenen liman çifti (bütçesiz) | 278 | 1381 | 1793 |
| — çift: bütün izinlerle bile rota yok (`geoNone`) | 262 | 1375 | 1673 |
|   · b, a'nın çıkış limanını tanımıyor | 41 | 211 | 252 |
|   · yapısal boşluk (her liman ara durak sayılsa da ≤3 sıçrama yok) | 218 | 1164 | 1421 |
|   · bilgi / gözlenen tehlike | 3 | 0 | 0 |
| — çift: yalnız a'nın izniyle açılır (mevcut kod destekler) | 15 | 6 | 0 |
| — çift: iki yönde de izin gerekir (a ve b) | 1 | 0 | 120 (ayrı çift: 1; şartlar 120/120 olumlu) |
| — gerçek bütçeyle izinsiz geri rota ön koşulunu geçen (`fwdBase`) | **0** | **0** | **0** |
| Transit izni anlaşması | 0 | 0 | 0 |
| aiPortInvestment çağrısı / liman | 357 / 0 | 1417 / 0 | 690 / 0 |
| — eksi net + ortak ihracı eşleşmesi yok | 278 | 1261 | 583 |
| Kritik kıtlık (AI × kaynak × ay: stok < taban, aylık net < 0) | 14 | 0 | 181 |
| İmzalı freight | 27 | 2 | 12 |

Kök neden:
1. Baskın: yapısal liman seyrekliği — transit adayı çiftlerin %78–%85'inde aradaki hiçbir sistemde liman yok (çıplak hat uzaklığı çoğunlukla ≥5); hiçbir izin rotayı açamaz. Bu doğru davranıştır.
2. Bilgi: %10–%15'te b, a'nın limanını tanımıyor (`route` başı `identifiedPort(b,source,a)`).
3. Kusur: `aiTransitRequest` izinleri değerlendirmeden önce geri yönde (b→a) İZİNSİZ rota şart koşar; Transit İzni taşıyıcı başınadır (`portRight(owner,carrier)`), koridor iki yönde aynı üçüncü taraf limanından geçiyorsa b de izin ister → bu ön koşul yapısal olarak sağlanamaz (404: 1 çift, 20 ay).
4. Bütçe: yalnız a'nın izniyle açılan çiftler (11: 15, 99: 6) gerçek turda `budget.routes` tükendiği için hiç denenmedi (`fwdBase` 0).
