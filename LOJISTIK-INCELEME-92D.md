# Tersane waypoint ve filo takviyesi — 92D incelemesi

Bu fazda lojistik motoru değiştirilmedi. Ölçüm: tests/audit-92d-logistics.js
ve JSON çıktısı. Mevcut sevk/rota regresyonları da tam pakette çalıştırılır.

## Doğrulanan sorunlar

1. **Filo panelindeki toplanma noktası çelişkisi.** Gerçek View.tap ile sistem 5
   seçildi. Başka tersanenin önce sistem 4 olan tercihi `{fleet:72,sys:5}` oldu.
   dispatchBuiltFleet bu kayıtta fleet alanını önceledi ve gemiyi ana filonun
   bulunduğu sistem 2'ye gönderdi. Mesaj ise seçilen noktayı söylüyor.
   map.js rallyFor dalı oyuncunun uzay tersanelerine toplu yazıyor; tek filoya
   ait bir seçim ilgisiz tersanelerin genel tercihini de değiştirebiliyor.
2. **Takviye panelinin eksik sayısı siparişi hesaba katmıyor.** 1/3 filo ve
   2 sipariş varken motor eksiği 0, panelin hesabı 2. Motor çift siparişi
   engelliyor; arayüz hâlâ 2 gemi ister gibi görünüyor.
3. **Yanlış ret gerekçesi.** Baskın sınıf Muhrip ve teknolojisi kilitliyken
   100000 alaşıma rağmen reinforceFleet sonucu “Kaynak yetersiz”. Yeni
   kilitli gemi üretilmiyor; hata mesajda. Ortak üretim kapısının gerekçesi
   kullanıcıya taşınmalı.

## Mevcut davranış / QoL borcu (tek başına veri bozulması değil)

- Rota kapanınca followRallyFleet hedef bağını bırakıyor, gemi bekliyor ve
  bildirim veriyor. Gemi kaybolmuyor; sınır açıldığında eski hedefi hatırlayıp
  yeniden denemiyor. Başlangıç sevki başarısızlığı da otomatik tekrar yok.
- Takviye, sınıf başına kayıp kadrosu tutmuyor; filodaki baskın savaş gemisi
  sınıfını hedef gemi sayısına kadar sipariş ediyor. Karma filo şablonu yok.
- Tersaneler kuş uçuşu uzaklıkla sıralanıp döngüsel kullanılıyor; rota süresi,
  üretim sırası ve slot boşalma zamanı birlikte optimize edilmiyor.
- Tersane “ralli noktası” tek varış hedefi; çok duraklı filo hareket rotasıyla
  aynı şey değil. İki arayüzde aynı kelimenin farklı anlamı anlaşılmayı zorlaştırıyor.

## Önerdiğim sıra

**93A — Astra / High:** tek tersane → sistem ile takviye → hareketli filo
hedeflerini açıkça ayır. Filo seçiminde bütün tersaneleri sessizce değiştirme.
Kadro / üretimde / yolda / yeni sipariş sayısını göster. Kilitli sınıf ve
rota engeli için gerçek nedeni yaz. Kuyruktaki özel teslim hedefleri korunmalı.

**93B — Astra / High:** rota kapalıysa hedefi saklayan “bekliyor” durumu,
sınırlı yeniden deneme, kullanıcıya yeniden hedefle/iptal seçeneği; ana filo
ölür, birleşir veya el değiştirirse açık sonuç. Tekrarlı sipariş/RNG/kayıt testleri.

**93C — Astra / High:** sınıf bazlı filo şablonu ve üretim+seyahat tahminiyle
tersane seçimi. Kilitli sınıf otomatik başka sınıfa çevrilmesin; değişim açık olsun.
Bu daha büyük bir mekanik değişikliktir; önce 93A/B tamamlanmalı.

Bunlar 92D'de düzeltilmiş olarak sunulmaz. Cihaz testi kullanıcı isteğine
kadar bekler; şimdilik üretim kodu ve kontrollü olay akışlarıyla ölçüldü.
