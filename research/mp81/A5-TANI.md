# MP.8.1 — browser-mp74 aralıklı FAIL tanısı

## Yöntem

A5'e başarısızlıkta durum dökümü (`A5DIAG`) eklendi:
- host gelen kutusu notları (uid, kind, key, hidden);
- `#inbox` DOM düğmeleri;
- `aideal` kayıtları;
- teklif durumu, `MP71Dip.stats`, hız, pencere.

Tüm misafir / host sayfalarına ana çerçeve gezinme günlüğü (`NAV`) eklendi.

Test, yük olmadan, sırayla tekrar koşuldu. 12 koşudan 11'i 7 / 0; 18. koşu A4 + A5 FAIL (`evidence/`).

## A5 kök nedeni: TEST HATASI (ürün doğru çalıştı)

`A5DIAG` (koşu 18):
- teklif `id 3` host'ta `pending`;
- gelen kutusunda `{uid:3, kind:'aideal', key:'mp71:3'}`;
- DOM'da `3:y` / `3:n` / `3:c` (KABUL / REDDET / KARŞI TEKLİF) düğmeleri **var**;
- `MP71Dip.stats.notified = 1`.

Test ise **uid 2**'yi bekledi. Kart aranırken `n.key.includes(String(id))` kullanılıyordu; önde duran anomali olayının anahtarı `an:3` "3" içerdiği için yanlış kart seçildi.

**Aralıklılığın nedeni:** yalnız rastgele bir olay anahtarı teklif kimliğinin rakamlarını içerdiğinde oluşur.

**Düzeltme:** tam anahtar `n.key === 'mp71:' + id`. Yanlış karta düşen "son aideal" yedeği kaldırıldı.

**Ürün kabul ölçütleri döküme göre karşılanıyor:**
- teklif gerçek host gelen kutusuna ulaşıyor;
- doğru oyuncuya kart düşüyor;
- KABUL / REDDET düğmeleri görünür;
- başka bildirimin arkasında kaybolmuyor (DOM'da üç kart da var).

## A4 (aynı koşuda): TEST ZAMANLAMA VARSAYIMI

A4 son adımı misafir enerjisinin `e0 + 13` olmasını bekler. Önceki adımlar zaten geçmişti: host teklifi `accepted`, misafir kaydı `accepted`, kart kalktı, çift dokunma tek `respond`.

Oyun hız 1'de akarken misafirin aylık enerji geliri eksi olabildiğinden eşik tutmayabilir.

**Düzeltme:** A5'teki gibi ölçüm sırasında oyun duraklatılır, misafirin aynası host gününe yetişince `e0` okunur, sonra hız geri gelir.

## A1 "MP1Join is not defined" (MP.8 regresyonunda ve yeni başlamış konteynerdeki ilk koşuda)

- Yükteki koşularda ve konteyner açılışındaki ilk koşuda görüldü. Taban MP.7.5 ağacında da yük altında aynı.
- Gezinme günlüğü eklendikten sonraki 12 koşuda **yeniden üretilemedi**.
- Bekleme koşulu sayfa MP1Join'siz bir belgedeyken (yeniden yükleme / gezinme sırasında) değerlendirilmiş.
- Kök neden **kurulamadı**. Bundan sonraki her FAIL'de `NAV` satırları misafir sayfasının nereye gittiğini gösterecek.
- Kod değişikliği yapılmadı (tahmini düzeltme yok).

## Doğrulama

Düzeltilmiş testle tekrarlı koşular: `MULTIPLAYER-MP81-SONUC.md`.

## Doğrulama (düzeltilmiş testle, sırayla, yük yok)

| Durum | Sonuç |
|---|---|
| Düzeltmeden önce (tanı koşuları) | 12 koşuda 1 kez A4 + A5 FAIL; 1 kez soğuk başlangıçta A1 |
| Düzeltmeden sonra | 10 koşu: **A4 ve A5 0 FAIL**. 9 koşu 7 / 0; 1 koşu B1 FAIL (aşağıda) |

## B1 (kapasite 3, ikinci oda) — aralıklı, kök neden kurulamadı

- 10 koşuda 1 kez, lobide `#jEditMe` dokunuşu Playwright zaman aşımına uğradı.
- Ekran görüntüsü (`evidence/mp74-B1-tapfail-tasarim-acik.png`): misafirin **tasarım ekranı açılmış**. Yani dokunuşun etkisi gerçekleşmiş, ama Playwright eylem denetimi (kararlılık / olay alıcısı) zaman aşımı saymış.
- Olası ilgili mekanizma: MP.7.4 lobi geçişi sonrası 700 ms dokunma yutma katmanı. Kanıtlanmadı.
- `tap` yardımcısının tanı kodu lobide `G.p` boşken kendisi hata veriyordu; null-güvenli yapıldı. Sonraki FAIL'de gerçek tanı (üstteki öğe, pencere, görünüm) görünecek.
- Ürün davranışında hata kanıtı yok.
