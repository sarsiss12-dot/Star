# 96H.6.1 — araştırma ve üretim kararı

Kanonik başlangıç: `28eff6a425825af9142a0ca584370f3d2e5b7a14`.
Üretim değişikliği yalnız ittifak yönetimidir. `ai.js` değişmedi.

## Sonuç

- C2: izole testler 4/4; yerel100 testinde döngü6→2, maden816→149, kesinti955→424 bina-gün. 120 matrisinde kritik14→12 ve teslim455→524. Bağımsız240 seed11: teslim204→155 (%75,98), %85 kapısı FAIL. Diğer240 aday seedleri NOT RUN. C2 reddedildi.
- T1: altı aylık planda ücretli kuyruğun seri bitişini ve üretime katılacağı ayları ağırlıklandıran tek yeni aday. Aynı404 Save107→160 aktör7 kritik42→32; aynı11 Save218→240 aktör7 kritik9→10. Yerel güvenlik kapısında reddedildi; 120/240 NOT RUN.
- Kontrol: yeni H52 kaynakta8 seed120 ve4 seed240 yeniden çalıştırıldı. Eski kaynakla başlangıç Save/RNG eşit. 404 ay133 Save farkı yalnız kapanmış savaşın üç metadata alanının H52 tarafından temizlenmesi; RNG ve ekonomik toplamlar eşit. Tarihsel sayılar yeni kontrol yerine kullanılmadı.
- İttifak: 13 hedefli test; 64 seedde eski AI review ile tam Save/RNG eşitliği. Genel135 grup6068PASS/0FAIL. Chromium17PASS/0FAIL. FizikselAndroid NOT RUN.

## Tekrar çalıştırma

`replay.js`, saklanan `scripts-as-run/campaign.js` sürücüsünün yalnız yardımcı dosya yolunu hedef kökün `tests` dizinine göre çözen taşınabilir kopyasıdır. Sürüm ve konfigürasyon değiştirmez. Gerçek çalıştırılan sürücü ve SHA değerleri raw sonuçlarda korunmuştur.

```sh
node research/96h61/replay.js /absolute/control control 11 240 /absolute/output orta default - 60,107,113,119,131,218,219,223
```

Kontrol için H52 HEAD ayrı worktree; C2 ve T1 için ayrı ayrı yalnız ilgili reddedilmiş patch uygulanır. Her adayın RELEASE-MANIFEST runtime hashleri o deney kökünde yeniden üretilir. Reddedilen yamalar oyun runtime'ına uygulanmaz. `stepsPerMonth=60`, `stepDays=.5`, Save8 gerçek yüklemesi ay60. Sarmal45sistem/5AI, normal, konsey/kriz kapalı, varsayılan%35AIkökeni.

`critical`: yaşayan AI için ene/min/tuk/ala kaynaklarından en az biri negatif net ve stok üç aylık açığın altındaysa bir devlet-ay. Gıda ayrıca zaman çizelgesinde denetlenir; tarihsel metrik tanımı değiştirilmedi.

Yıkım/yeniden yapım sayımı aktör/sistem/gezegen/tür bazında FIFO ve birebirdir: başarılı yıkım tamamlanmasından itibaren360gün içinde ilk ücretli aynı tür siparişi. Net maden=gerçek sipariş bedeli−yıkım iadesi. Kesinti, yeniden yapımı tamamlanan eşleşmeler için bina-gündür; bitmemiş işler sıfır başarı sayılmaz ve cycles içinde null olarak görünür.

Ham sonuçlar, Save fixture'ları, exact as-run sürücüler, aday yamaları, ilk başarısız testler ve son doğrulamalar teslim edilen `stars-faz96h61-kanit.zip` içindedir. Doğum anı bina/kuyruk iddiaları immutable `birth-*.json` gözlemine dayanır; eski genel trace'in sonradan değişebilen q referanslarına dayanmaz. Doğum gözlemli yeniden oynatmaların hedef Save'i kanonikle birebir eşittir.

`timing-summary.json` altı fixture'ın altışar ay stoklarını, gerçek üretim/tüketim defterini, bakım, vergi, ticaret ve ücretli işleri içerir. Doğal replay AI kararlarını değiştirmez; her ay ayrı bare replay ile tam Save/RNG eşitliği doğrulanır. Ayrı queue-clock yalnız hazır işlerin takvimidir; yeni kararlar veya savaş/popülasyon geleceği için kehanet değildir.

Sonraki işler: zaman indeksli stok darboğazı ile normal yatırım/kriz müdahalesinin etkileşimi; ardından Yayılmacı finansmanı. Doktrin/persona dağıtımı ve uzun vadeli stratejik kararlar ayrı fazlardır.
