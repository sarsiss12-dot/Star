# MP.6.4 — geç oyun performans ön ölçümü (tanı; PERF.1'e aktarım)

Koşullar ve yöntem:
- **Oyun:** ULU galaksi (100 sistem), 11 AI, seed 22, 240 ay.
- **Ortam:** gerçek motor Node v22 vm'de (`tests/helpers/runtime.js`). Harita çizimi `@napi-rs/canvas` (Skia, **CPU**). Tarayıcı GPU / kompozitör, FPS ve fiziksel Android **ölçülmedi** (NOT RUN).
- **Kollar** (aynı tohum ve başlangıç), üçü aynı anda, 4 çekirdekli konteynerde, ayrı süreçlerde koştu:
  - A: sensör paylaşımı kapalı;
  - B: oyuncu temaslı ve barıştaki her devletle karşılıklı paylaşımda (fikstür: `e.shareVis`);
  - C: B + başlangıçta herkesle temas (galaksinin büyük bölümü görünür).
- Betikler: `measure.cjs` (A/B/C, `MP64_ARMS`) ve `profile-ai.cjs` (V8 CPU profili, `node:inspector`).
- Ham veri: `results/`.

## Ölçümler (ay başına ortalama, son 12 ay)

| Ay | Kol | Simülasyon ms/ay | aiTurn | aylık tik (aiTurn dahil) | günlük döngü | görüş + paylaşım | görünür sistem / filo | çizim medyan / en kötü ms | ayna kurma ms / KB / misafir yükleme ms | kayıt KB |
|---|---|---|---|---|---|---|---|---|---|---|
| 120 | A | 875 | 388 | 491 | 384 | 0,3 | 3 / 6 | 5,2 / 42 | 4,3 / 86 / 163 | 1098 |
| 120 | B | 898 | 409 | 510 | 388 | 1,3 | 27 / 25 | 7,4 / 92 | 7,2 / 86 / 171 | 1098 |
| 120 | C | 1384 | 629 | 834 | 548 | 10,3 | 97 / 108 | 17,3 / 298 | 5,6 / 89 / 179 | 1241 |
| 180 | A | 2817 | 2026 | 2230 | 586 | 0,3 | 3 / 5 | 4,4 / 53 | 5,8 / 93 / 270 | 1326 |
| 180 | B | 3142 | 2288 | 2483 | 658 | 9,5 | 97 / 111 | 24,4 / 369 | 6,3 / 93 / 184 | 1327 |
| 180 | C | 3111 | 1961 | 2414 | 696 | 17 | 97 / 152 | 24,8 / 356 | 14,2 / 98 / 217 | 1463 |
| 240 | A | 2813 | 2051 | 2416 | 396 | 0,8 | 3 / 10 | 10,5 / 94 | 6,2 / 97 / 245 | 1670 |
| 240 | B | 3056 | 2200 | 2612 | 444 | 13,5 | 100 / 133 | 9,8 / 324 | 5,8 / 97 / 154 | 1680 |
| 240 | C | 2992 | 1908 | 2296 | 695 | 9,1 | 100 / 199 | 15,7 / 410 | 6,9 / 105 / 185 | 1660 |

Bellek (yığın, GC sonrası): üç kolda da 21 → 33 MB. Haber kaydı 240. ayda 177–320.

## AI CPU profili (kol A, 6 ay)

| Ay | ms/ay | En ağır kendi-süre | En ağır toplam zincir |
|---|---|---|---|
| 120 | 1119 | supplyDistance %8,2, EconomyLedger `stock` %8,1, explorationContext %6,5, findPath %4,2 | aiTurn %35,1 → aiBuildingDelta %24,2 → empireIncome %25,6 |
| 180 | 3453 | **findPath %21,6**, **tradeLinks %18,5**, dist %6,5, EconomyLedger `stock` %6,3 | aiTurn %69,5 → **aiBuildingDelta %63,9 → empireIncome %63,6 → tradeInfo %50,4 → tradeLinks %47,5 → findPath %28** |

Profil sırasında dünyada 7 cephe (sürmüş ya da kapanmış), 2,5 eşzamanlı savaş çifti ve 113 filo vardı.

## Kanıtlanmış bulgu ve hipotezler

**A. Harita çizimi**
- Tam görünürlükte (C ve geç B) medyan çizim 2–3 kat artıyor (5 → 15–25 ms); ilk kare tepeleri 300–410 ms.
- Ölçüm yalnız Skia CPU üzerinden. Tarayıcıda FPS / kare süresi ölçülmedi (NOT RUN).
- Ana kasma kaynağı **değil**: simülasyon ayı 2,8–3,1 s iken çizim onlarca ms.

**B. AI ve ekonomi hesabı — kanıtlanmış ana kaynak**
- Simülasyonun %70'inden fazlası `aiTurn`. 120 → 180. ay arasında üç kolda da ~5 kat sıçrıyor; sıçrama sensör paylaşımından bağımsız.
- Sıcak yol: AI'nın yapı değerlendirmesi (`aiBuildingDelta`), her aday için tüm imparatorluk gelirini yeniden hesaplıyor (`empireIncome`). Bu da ticaret bağlantılarını yol bulmayla baştan kuruyor (`tradeInfo` → `tradeLinks` → `findPath`).

**C. Sensör görünürlüğü**
- Paylaşılan görüş hesabı (`refreshSharedVision` + `updateVision`) en çok ~17 ms/ay; ihmal edilebilir.
- Görünürlük, simülasyonu değil yalnız çizimi ve görünür filo sayısını etkiliyor.

**D. Uzun oyunda biriken veri**
- Kayıt 420 KB → 1,7 MB; haber, günlük ve geçmiş sınırlı.
- Bellek 33 MB'ta kalıyor. Kanıtlanmış bir kaynak değil.

**E. Multiplayer ayna**
- Kurma 4–14 ms, 86–105 KB.
- Misafirde motorun `deserialize`'ı 150–270 ms (Node, masaüstü CPU). Misafir her ayna farkında dünyayı yeniden kurduğu için bu, telefonda **gerçek bir MP maliyeti olabilir**.
- Fiziksel cihazda ölçülmedi (hipotez).

## PERF.1 önerileri (uygulanmadı)

1. `aiBuildingDelta` içinde `empireIncome` / `tradeLinks` sonuçlarını aynı ay için önbelleğe almak, ya da ticaret yol bulmasını tur başına bir kez yapmak. Önce RNG / Save8 eşdeğerliği kontrol–aday karşılaştırmasıyla kanıtlanmalı.
2. Misafir aynasında tam `deserialize` yerine fark uygulaması. Önce telefonda ölçülmeli.
3. Tam görünürlükte harita katman önbelleği. Önce tarayıcıda kare süresi ölçülmeli.
