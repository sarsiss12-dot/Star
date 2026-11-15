# MP-FIELD-VERIFY.0 — p34 saha düzeltmelerinin gerçek oyuncu akışında doğrulanması

Tarih: 15 Kasım 2026 · Dal: `claude/stars-mp-field-verify0` · Başlangıç HEAD: `0ec601797eb392d2ef223b84813cc83777df6b74` (p34, PR #48 taslak) · Bitiş HEAD: §10
Sürüm: oyun **96h10p34** (runtime 19 dosya ve p34 ZIP'i DEĞİŞMEDİ) · MP **MP.8.9b32** (yalnız MP istemcisi + relay sürüm işareti) · Save8 v8 / paket4 / protokol1

> Kanıt türleri ayrı yazılır: **Yerel Chromium** (üretim kipi relay süreci + TLS vekili + oyuncu başına TCP hattı + ayrı kalıcı profiller), **Node vm**, **canlı Render** (yalnız salt okunur sürüm sorgusu), **fiziksel cihaz** (NOT RUN). Kullanıcı kaydı yok: tüm kayıt testleri senaryo içinde üretilen sentetik MP paketiyle (orta galaksi, 3 insan + 5 AI, tohum 22) yapıldı.

## 0. Özet

| # | Bulgu | Yeniden üretildi mi? | Kök neden | Değişiklik | Test |
|---|---|---|---|---|---|
| 0 | Render hangi sürüm? | Evet (salt okunur) | Canlı Render **p33** sunuyor: `/mp/version` = `MP.8.9b30` / `96h10p33`, 8 MP dosyasının özeti `0ec5720` ile aynı; `main.js` `BUILD_ID 96h10p33`, `sw.js` `stars-v96h10p33`; `/mp/join?code=` 200 (p34'ün 302'si yok) | Yok (dağıtım kullanıcıda) | `curl` çıktıları §1 |
| 1 | Birlikte yeniden giremedik | **Evet** (Z13, p34 kontrolünde FAIL) | Host kaydı yeni odada açınca eski oda relay'de **10 dk** (`MP1_HOST_GRACE_MS`) açık kalır. Eski kodla (adresteki `?code=` / otomatik dönüş / elle) ilk katılım `welcome{host:false}` alır; `join.js` ekranı "Bağlanıyor…" durumunda, kod/ad kutusu ve KATIL **pasif**, soket açık bırakıyordu → oyuncu yeni kodu yazamıyordu | `join.js`: ilk katılımda host yoksa soket kapanır, giriş ekranı düzenlenebilir döner, aşama **ODA** + "Bu odada host yok… YENİ kodu gir" | Z13 aday PASS |
| 2 | Arkadaş tek başına kayıttan devam edince olay penceresi boş | **Hayır** | Üç yolda olay üretimi → atama → (misafire taşıma) → şerit → liste açılışı ölçüldü; kusur bulunmadı. Boş görünmenin meşru üç nedeni ölçüldü: ⚡ otomatik çözüm, Rastgele Olaylar kapalı, olayların seyrekliği (§3) | Yok | Prob + Z5/Z6/Z10 + SP testi |
| 3 | Q6: toprak vaatli destek teklifi bazen host'a ulaşmıyor | **Evet** (Z11/Z12, p34 kontrolünde FAIL) | `join.js` `J.cmd` soket AÇIK değilken (`raw()` false) de `{ok:true}` dönüyordu; misafir taslağı GÖNDERİLDİĞİ AN silip "gönderildi" yazıyordu. Kapanan / yarı ölü sokette komut kayboluyor, oyuncunun elinde ne teklif ne taslak kalıyordu. Host reddinde de taslak silinmişti | `J.cmd` açık hata; misafir teklifi tek işlem (taslak yanıta kadar korunur, aynı `cid` ile yeniden gönderim, ret/bağlantı hatasında düzenlenebilir taslak, iz) | Z11 + Z12 aday PASS |
| 4 | p34 Fetih / savaş desteği yeniden kontrol | — | — | Yok | Z7, Z8 aday PASS |

## 1. Sürüm ve Render

[DOLDURULACAK]

## 2. P0 yeniden giriş

[DOLDURULACAK]

## 3. P0 olaylar

[DOLDURULACAK]

## 4. Q6

[DOLDURULACAK]

## 5. p34 yeniden kontrol (Fetih, savaş desteği)

[DOLDURULACAK]

## 6. Son kabul senaryosu

[DOLDURULACAK]

## 7. Regresyon

[DOLDURULACAK]

## 8. Değişen dosyalar

[DOLDURULACAK]

## 9. Açık işler

[DOLDURULACAK]

## 10. Teslim

[DOLDURULACAK]
