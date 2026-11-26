# STARS · CODEX-TEST-FAIL-KÖK.0

## Başlangıç

PR #82 ile `codex/stars-p56-kabul0` uzak HEAD'i `a8c07e18ee3daf544da62244fe31cd2aaa3ee574` üzerinde eşleşti. Aynı ağaçta oynanabilir kaynak `78668a4dff9373c1b81d0fd3073b64bb9e55a663`, oyun `96h10p57`, MP `MP.8.9b56`, Save8 v8, MP paket 4 ve protokol 1. [Kanonik PR](https://github.com/sarsiss12-dot/Star/pull/82)

p55 arşiv 253 paket, 6.632 PASS ve 279 FAIL. p56 arşiv 256 paket, 6.649 PASS ve 279 FAIL. p57 arşiv ham 256 paket, 6.612 PASS ve 280 FAIL. Ayrı tekrarlarla elde edilen p57 teşhis toplamı 6.654 PASS ve 276 FAIL. Bu toplam ayrı deneyleri içerir. [Arşiv paket envanteri](evidence/test-fail-kok0/baslangic/p57-arsiv-envanter.json)

Yeni ham kontrol, değişmemiş p57 kaynak ağacında Node v24.22.1, Debian 13, 2 işçi ve aynı 180 saniye sınırıyla başlatıldı. Canvas ve Chromium sürümleri ortam kaydındadır. [Ortam](evidence/test-fail-kok0/baslangic/ortam.json)

## Temsilî ilk hatalar

| Test adı | Eski hata | Kök neden | Düzeltme | Yeni sonuç | Gerçek ürün riski |
|---|---|---|---|---|---|
| `faz85c_crisis_save_continuity` | 90 PASS / 54 FAIL. 200 aylık zincir `DiplomaticInbox is not defined` ile kesiliyor. | Yerel VM listesinde `inbox.js` yok. Başarısız kuruluma bağlı kayıt zinciri var. | HTML betik listesi | 143/1, eski harita kilidi | Kayıt kontrolleri çalıştırılamıyor. |
| `faz85e_event_inbox_continuity` | 92 PASS / 59 FAIL. Gezinti ve codec senaryoları `DiplomaticInbox` olmadan başlıyor. | Aynı yerel yükleme listesi. | HTML betik listesi | 118/33, kalan karar/codec kontrolleri açık | Bildirim kodlayıcı ve uygulama kontrolleri birincil hatadan etkilenebilir. |
| `faz86b_deal_engine` | 121 PASS / 22 FAIL. 200 aylık zincir ve teklif arayüzü kesiliyor. | Aynı yerel yükleme listesi. | HTML betik listesi | 129/14, kalan teklif fikstürleri açık | Anlaşma kontrolü ile arayüz kaynak hatası henüz ayrılmadı. |

Güncel `index.html` önce `news.js` ve `inbox.js` sonra `ui.js` yükler. 18 inceleme adayının kendi VM listelerinde hiç `inbox.js` yok. `UI.drawInbox` içindeki gerçek karar kartı yolu modülü çağırıyor. Bu aşamada 18 paketteki bütün FAIL'ler tek nedene yazılmadı. [Başlangıç günlükleri](evidence/test-fail-kok0/dogrudan/)

## 1. Ortak test ortamı

Bu üç eşlemede yalnız VM yükleyicisi değişti. Eski yerel listeler `news.js`, `inbox.js`, `construction.js` ve `archive-ui.js` dosyalarını atlıyordu. Yeni ortak yükleyici, aynı p57 çalışma zamanını `index.html` sırasıyla aynı test VM’sinde çalıştırıyor. Eski DOM fikstürleri, araçlar, kayıt girdileri ve assertion'lar korunuyor. Arşiv kaynak köküyle çalışan karşılaştırmalar kendi yükleyicilerini kullanmaya devam ediyor.

Aynı yeni yükleyicide yalnız HTML’deki `inbox.js` sırası çıkarıldığında başlangıç FAIL sayıları üç testte de geri geldi. 54/59/22 FAIL’e karşı tam tarayıcı sırası 1/33/14 verdi. Üçünde toplam 87 assertion yeniden geçti. Eksik modül sonrasında zincirleme duruşlarla eski arayüz/olay varsayımları birlikte bulundu. Kalan 48 assertion ayrı değerlendirmede. [Pozitif ve negatif günlükler](evidence/test-fail-kok0/dogrudan/)
