# STARS — MP.8.1: diplomatik kart güvenilirliği tanısı ve GPT devri

**Durum:**
- Son Claude çalışması.
- Taban MP.8 `7e12675` (PR #31).
- **Runtime ve MP ürün kodu değişmedi.** Build `96h10p5`, MP sürümü `MP.8`; yeni ZIP yok. Save8 / RNG'ye dokunulmadı.

## 1. browser-mp74 aralıklı FAIL (P0)

Ayrıntı ve kanıt: `research/mp81/A5-TANI.md`, `research/mp81/evidence/`.

**A5 (host kartından KABUL) — TEST hatası.**
- Tanı dökümü gösterdi: kart üretilmiş, KABUL / REDDET / KARŞI TEKLİF düğmeleri DOM'da.
- Test kartı `key.includes(String(id))` ile arıyordu; teklif 3 iken anomali olayı `an:3` eşleşti, yanlış kart (uid 2) beklendi.
- Düzeltme: tam anahtar `'mp71:'+id`, yanlış yedek kaldırıldı.

**A4 (misafir karttan KABUL) — test zamanlama varsayımı.**
- Oyun akarken misafirin eksi enerji geliri `e0 + 13` eşiğini bozuyordu.
- Ölçüm sırasında duraklatılıyor (A5 ile aynı yöntem).

**Ürün kabul ölçütleri, tanı dökümüne göre karşılanıyor:**
- teklif host gelen kutusuna ulaşıyor;
- doğru oyuncuya kart düşüyor;
- düğmeler görünür;
- başka bildirimin arkasında kaybolmuyor;
- karar bir kez uygulanıyor (A4 "çift dokunma tek `respond`").

**Doğrulama:** düzeltmeden sonra 10 sıralı koşuda A4 / A5 0 FAIL.

**Açık kalanlar** (kök neden kurulamadı; tahmini kod değişikliği yapılmadı):
- **A1:** soğuk başlangıç / yük altında "MP1Join is not defined".
- **B1:** lobide dokunma zaman aşımı; ekran görüntüsünde dokunuşun etkisi gerçekleşmiş.

Testlerde tanı günlükleri (`NAV`, `A5DIAG`, null-güvenli `tap` dökümü) kaldı.

## 2. Event gizleme kalıcılığı (P1) — değişiklik yapılmadı, belgelendi

**Durum:**
- Kaydırılan karar olayı ☰ listesinde kalıyor; gerçek pencereden karar verilebiliyor (MP.7.5).
- Diplomatik kararlar Gelen Kutusu'nda kalıyor.
- `hidden` işareti Save8'e yazılmıyor (`ui.js` `NOTE_FIELDS`): yükleme sonrası kart yeniden görünüyor. **Karar kaybolmuyor** (güvenli yön).

**Kalıcı gizleme seçenekleri ve neden uygulanmadı:**
- `NOTE_FIELDS`'e alan eklemek runtime + Save8 baytı değişikliği, yeni build ve koruma adaptörü demek.
- Cihaz deposu kullanılırsa olay kimliğinin (uid) yükleme sonrası kararlılığı ayrıca kanıtlanmalı.

İkisi de son oturumun güvenli sınırını aşıyor. `GPT-DEVIR.md` §7'ye devredildi.

## 3. Bildirim dayanıklılığı (P1) — mevcut kapsam

| Konu | Kapsayan test |
|---|---|
| Kartın kaydırılması | `browser-mp74` A3 |
| Karttan kabul, çift dokunma tek komut | `browser-mp74` A4 |
| Ret ve karşı teklif | `browser-mp74` A4 |
| Host kartından kabul | `browser-mp74` A5 |
| AI → misafir barışı karttan | `browser-mp75` |
| Karar olayı gizleme / yeniden açma | `browser-mp75` |
| Ölü sokete karar → yeniden karar, tam bir kez | `browser-mp8` N8 |
| Teklif açıkken kopma | `browser-mp8` N3 |
| Kayıt / yükleme sonrası bekleyen teklif | `browser-mp8` R4 |
| Süresi dolan teklifler | `browser-mp8` kampanyaları (`expired`) |

Aynı anda 10+ bildirim için ayrı test **yazılmadı** (NOT RUN). Kampanyalarda anomali / olay kartlarıyla birlikte diplomatik kartlar oluştu.

## 4. Testler

Ürün kodu değişmediği için kapsamlı regresyon MP.8 son adayında koşulan tam koşudur:
- Node 172 paket, 6364 / 3 (bilinen `faz95d_identity`);
- Chromium paketi tamamen PASS (ayrıntı `research/mp8/evidence/REGRESYON.md`).

MP.8.1'de ek olarak hedefli testler koşuldu (sırayla, yük yok):

| Test | Sonuç |
|---|---|
| `browser-mp74` × 10 (düzeltilmiş) | 9 × 7 / 0, 1 × 6 / 1 (B1; §1). A4 / A5 0 FAIL |
| `browser-mp75` | 6 / 0 |
| `browser-mp73` | 8 / 0 |
| `browser-mp8` N (ağ, kayıp karar) | 9 / 0 |
| `browser-mp8` R (kayıt / relay / devam) | 5 / 0 |
| Node MP alt kümesi (`STARS_TEST_FILTER=mp`) | 40 paket, 726 / 0 |
| `perf1_equivalence_test` | 4 / 0 |
| `perf2_equivalence_test` | 5 / 0 |
| `mp74_notice_test` | 6 / 0 |
| `mp75_war_test` | 4 / 0 |

**NOT RUN:** fiziksel Android, canlı Render, 10+ eşzamanlı bildirim testi, MP.8.1'de yeniden tam Node / Chromium koşusu.

## 5. Devir

**`GPT-DEVIR.md`** şunları içerir: mimari, kritik dosyalar, MP.5 → MP.8.1 geçmişi, PR zinciri ve güvenli birleştirme, gerçek test komutları, Render, açık sorunlar, değiştirilmeyecek kurallar, yol haritası ve "GPT — İLK GELİŞTİRME OTURUMU".
