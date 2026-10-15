# Faz 94D — mobil bilim

Üç dal ve Geçmiş, 58 teknoloji, özel koşullar, araştırma motoru ve AI tercihleri korunur. Değişiklik `ui.js` ile bilim CSS alanındadır.

- Sabit kompakt başlık, dallar, mod seçimi ve aylık üretim/ilerleme özeti.
- Kademe sütunları soldan sağa; 180×104 kartlar ve yatay ön koşul çizgileri.
- Orta bölüm kalan yüksekliği alır; iki eksende kaydırılabilir. Yakınlaştırma düğmeleri ve pinch desteği korunur. Sürükleme/multitouch seçime dönüşmez; touchcancel seçimi iptal eder.
- Alt kuyruk 72 px, kısa yatay ekranda 64 px; daraltılınca 32 px. Hedef kartları yatay kayar. Kuyruk kaydırma konumu yeniden çizimde korunur.
- İlk hedef, o anda araştırılan ön koşul/ana adımın ilerlemesini ve mevcut puan hızına göre kalan ay tahminini gösterir. Bu, tüm hedef rotasının toplam süresi değildir; paralel dal sayısı ve üretim değişince tahmin değişir.
- Kuyruk hedefi ağaca odaklar. Küçük ayrıntı alanından eksik koşullar/rota, sıra değişimi ve çıkarma erişilir. Açılır alan sınırlı yükseklikte kaydırılır; varsayılan olarak ağacı kaplamaz.

## Koruma ve kanıt

Araştırma seçme/kaldırma, numaralar, ortak/dallar arası ön koşullar, üç paralel dal, modlar, özel teknoloji erişimi, tarihçe ve Save v8 regresyonları geçti. Bilim motoru yeniden yazılmadı.

568×320, 640×360, 740×320, 800×360, 960×540 için sabit alan bütçesi ve kaydırma CSS kuralları test edildi. Bunlar gerçek tarayıcıda hesaplanan DOM kutuları veya fiziksel Android kabulü değildir. Tarayıcı kurulumu başarısız olduğundan son görsel taşma/klavye/adres çubuğu kabulü açık risktir. Fiziksel cihaz beklenerek uygulama yarım bırakılmadı.
