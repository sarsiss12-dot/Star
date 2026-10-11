# Elçi görevleri — 86D

Her elçi bir imparatorluğa atanır. Üç görevden biri seçilir; aynı hedefte
birden fazla elçi bulunmaz. Elçi kapasitesi eski kurala bağlıdır, atama
Etki harcamaz. Görev değiştirmek ve geri çekmek ayrı eylemlerdir.

| Görev | Yeni elçi ilişki tabanı / ay | Uygun teklif faydasına destek (Yeni / Kıdemli / Uzman) | Kapsam |
|---|---:|---|---|
| Yakınlaşma | +2,2 | %2 / %3 / %4 | Bütün olumlu maddeler |
| Ticari heyet | +0,9 | %4 / %7 / %10 | Kaynak, haraç, teknoloji, lüks, ticaret paktı |
| Güvenlik teması | +0,8 | %4 / %7 / %10 | Barış, saldırmazlık, ittifak, geçiş, istihbarat, casus ağı, savaş/barış taahhüdü |

12 aktif ay: Kıdemli. 36 aktif ay: Uzman. İlişki tabanı bu kademelerde
sırasıyla ×1,1 ve ×1,2 olur. Gerçek artış eski diplomasi yeteneği ve
ilişki doygunluğu formülünden geçer; karşı tarafa %60'ı yansır. Yakınlaşma
ilk kademe eski +2,2 tabanını korur. Kıdem sayacı çalışılan ayları tutar;
teknik tamsayı güvenlik sınırı dışında keyfî yıl sınırı yoktur.

Savaşta, temas yokken veya doktrin kilidinde görev duraklar: kıdem,
ilişki, elçinin +0,35 taban gözlem katkısı ve AI elçi faktörü çalışmaz.
Atama yer tutmaya devam eder; geri çekilebilir. Barış/temas sonrasında
aynı görev kaldığı kıdemden devam eder; duraklanan aylar telafi edilmez.
Ölü/korsan/kriz/geçersiz hedefler temizlenir. Birbirleriyle savaşan
iki tarafın barış teklifinde de elçi bonusu yoktur.

Mevcut temas ve ayrı casus katkıları bu duraklama kuralıyla kapatılmaz.
Casusların ayrı davranışları korunur. Gözlem tabanı eski shadow/counter/
sensör çarpanlarından geçer; ek bir istihbarat oranı icat edilmez.

## Kayıt ve zaman

`e.envoy[targetId] = {task, months, lastMonth}`. Takvim ayı `year*12+month-1`
ile izlenir. Aynı ayda tekrar `envoyTick` ilişki veya kıdem kazandırmaz.
Yükleme ve atama ayı ilerletmez; ilk kazanç sonraki aylık tikte gelir.
Atlanan bir takvim aralığında toplu geçmiş ay kazanımı yapılmaz.

Eski v8 `true`: Yakınlaşma, 0 kıdem, mevcut ay işareti. `false` ve bozuk
görevler temizlenir. Eksik elçi alanı olan devlete alan eklenmez. Geçerli
nesnenin kimliği korunur; göç tekrarlandığında sonuç aynıdır. RNG,
kaynaklar, ilişkiler ve gün bu göçle değişmez. Yeni kayıt yine v8'dir;
ek depolama anahtarı eklenmez. Görev değişikliği months=0 yapar; aynı
görevin tekrar seçilmesi kıdemi veya ay işaretini değiştirmez.

## AI anlaşma faktörü

`evalOffer` mevcut madde değerlerini bir kez hesaplar ve aynı değerleri
`envoyDealFactor` yardımcısına geçirir. Teklif geçerliliği hâlâ
`dealQuote` tarafından denetlenir; elçi sert kilitleri, maliyeti veya
fiziksel teslim engelini aşamaz.

Her olumlu maddede iki tarafın aktif elçilerinden kapsama uyan en yüksek
bonus alınır. Bonuslar toplanmaz. Sonra olumlu fayda değerleriyle ağırlık
hesaplanır; bütün elçi faktörü [1, 1.10] aralığında kalır. Negatif/net sıfır
faydaya veya redundant maddeye destek verilmez. Toplam anlaşma faktörünün
önceden var olan üst sınırı da korunur; ek destek kabul garantisi değildir.
Örnek: 1 değer kaynak + 999 değer ittifak, uzman ticari heyetle 1.0001
çarpan alır; 1.10 almaz. Bu yardımcı RNG veya yeni itemValue çağrısı yapmaz.

AI yeni elçinin görevini deterministik seçer: ortak düşman varsa Güvenlik;
ilişki <20 ise Yakınlaşma; ticaret paktı veya lüks ihtiyacı varsa Ticaret;
aksi durumda ittifak için Güvenlik, diğer ilişkiler için Yakınlaşma.
Eski yerleştirme olasılığı korunur. Hedefler artık aynı geçerlilik kapısından
geçer. Mevcut görev her ay değiştirilmez; böylece kıdem sıfırlanmaz.

Katsayılar bu fazın yeni tasarım seçimleridir. Geniş kabul/ret dağılımı ve
ilişki eğrisi için denge değerlendirmesi 86F'dedir; bu teslim o çalışmanın
tamamlandığı veya Android arayüzünün kabul edildiği anlamına gelmez.
