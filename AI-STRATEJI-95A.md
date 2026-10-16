# Faz 95A — stratejik AI

## Askerî kararlar

- Oyuna ait gerçek kuvvet/üretim muhasebesi korunur. Yeni gemi veya kaynak yaratılmaz; 93C şablon/takviye ve 93D.1 tersane bütçesi aynı motoru kullanır.
- Aylık savaş değerlendirmesi mevcut savaş nedeni, ilişki, soğuk savaş, barış beklemesi ve federasyon iznini korur. İsteğe bağlı yeni savaş için bilinen bir hedefe 180 gün içinde ulaşabilen, ikmali yeterli kuvvet de gerekir. Belirsiz düşman gücüne güvenlik payı eklenir. Tasarlanan savaşın hedef sınırından geçişi planlamada değerlendirmek, barışta o sınırdan fiilen geçiş izni vermez.
- Görülen kendi sistem tehdidine savunma önce ayrılır. Kalan kuvvet için en fazla altı bilinen düşman hedefi değerlendirilir; ulaşım/ikmal ve koloni/başkent değeri hesaba katılır. Tek devletin hedefi 180 gün tutulabilir; koşul/tehdit değişimi yeniden değerlendirmeyi sağlar.
- İkmalli kendi topraklarında toplanma noktası seçilir. Ulaşabilir kuvvet yetersizse üretim/toplanma beklenir; tek tek zayıf filolar hedefe atılmaz. Hazır ve yeterli filolar aynı noktadan birlikte emir alır. Bu, farklı hızdaki gemilerin saniyesi saniyesine eşzamanlı varışı veya federasyon ortak komutası değildir.
- Colossus koruma kilidi, savaş, geri çekilme ve mevcut lojistik kapıları korunur. Fanatik Arındırıcıların diplomasiye girmemesi askerî hareketlerini artık iptal etmez.

## İç öncelik ve bilim

`aiStrategy` kaynak darboğazı / savunma / savaş / bilim / ekonomi gerekçesi taşır. Acil kıtlık ve görülen saldırı beklemeden öncelik değiştirir; olağan doktrin hedefi 180 günlük tutarlılık penceresi kullanır. Kendi geliri ve fraksiyon memnuniyeti bina/araştırma önceliğine bağlanır. Önceden başlayan insan araştırma planı ve üç paralel dalın motoru değişmez. Manuel/yarı otomatik/otomatik, özel teknoloji erişimi ve bilim zaferi regresyondadır.

Seçilen gerçek `mizac`/`persLock` geçerli olduğunda, geçici etik türetimi onu başka bir doktrine dönüştürmez. Sekiz katalog anahtarı ayrı testlidir. `izolasyonist`, kayıt uyumu için kalır; görünen adı Fanatik Arındırıcılar’dır.

## Diplomasi ve himaye

Koruma kararında temas, ilişki, mevcut vasallık, yeni bağımsızlık koruması, bilinen askerî rota, tahmini kuvvet ve en fazla 180 günlük yardım süresi denetlenir. Gözlenmeyen yabancı kapı ve motor yükseltmeleri yardım süresini değiştiremez. Düşük istihbaratta yardım hızı kendi bilinen teknolojisiyle yaklaşık hesaplanır; yabancı kaynak stokları okunmaz. Uygunluk kaybolduğunda gelen sığınma kartının kabulü yeniden doğrulanır; başarılı vasallık oluşmadan Etki kesilmez. 90 Etki mevcut koruma bedelidir, yeni bir ücret değildir.

Aynı otomatik devlet/madde önerisi için 120 günlük tekrar beklemesi vardır. Uygulanamayan otomatik öneri kanonik quote kapısında, bedel/RNG tüketmeden bekler. Manuel müzakerenin açık geçersiz-teklif sonucu korunur. Bekleme yanıtı da `tur:0` taşır; ölçüm/müzakere sınırı NaN olmaz. Gözlenmeyen stoktan tam miktar çıkarılmaz; düşük istihbaratlı karşılık isteği kendi antlaşma maliyetinden tahmin edilir ve gerçek teslim kapısında doğrulanır.

## Casusluk

| Düzey | Mevcut yollar | AI politikası |
|---|---|---|
| Pasif | Casus atama; filo/kervan planı; soruşturma; ambargodan çıkış | Temas, gerçek casus slotu, maliyet ve uygun hedef kapıları |
| Aktif | Teknoloji edinimi, yanıltma | Savaş veya yeterince düşük ilişki; dost/korunan bağ engeli |
| Ağır | Sabotaj, hazine, isyan, suikast, fısıltı/sahte bayrak | Savaş ya da gerçek kötü ilişki ve somut husumet; müttefik/vasal/federasyon bağı koruması |

Ayrı fısıltı ve sahte bayrak seçicileri de aynı siyasi filtreyi kullanır. Üçüncü taraf ilişki/dosya verileri gerekli istihbarat yokken puanlamaya girmez. AI mevcut casus atamasını slot ve 90 günlük yerleştirme aralığıyla kullanır; spyTick gerçek bilgi üretir. Yeni ajan sistemi eklenmedi. Çalınmış filo planları `shownPower` değerlendirmesine, yanıltma tahminlere etki eder. Operasyon maliyeti, kota, yakalanma ve sonuç çözümü kanonik motorda kalır.

## İnşa ve keşif

İnşaat gemisi fiziksel olarak yerinde, boş ve uygun olmalı. Aynı yapı bekleyen işte tekrar başlatılmaz. AI meşgul gemiye yeni hedef vermez; gemi üretirken kuyruktaki inşaatçı da sayılır. Mevcut gemisiz tarihsel temel yapı çağrıları yeniden tasarlanmadı; AI’nın olağan inşaatçı akışı fiziksel gemiyi kullanır.

Keşif rezervasyonu aynı kalır. Rota bulunamayan değişmeyen durumda grafik aralığı 30 güne kadar artar; çevre imzası beş günde kontrol edilir. İkmal, tehdit, yeni tarama, teknoloji veya sahip olunan altyapı değişince plan yeniden ele alınır. Güvenli/ikmalli hedef gerçekten yoksa bekleme devam eder. Tohum 99’da verimlilik sorununun bütün haritalarda çözüldüğü iddia edilmez.

## Sınırlar ve devir

Bu temel devlet sefer planıdır. Aynı hızda kesin ortak varış, federasyon ortak komutası, müttefik hedef atama ve katkıya göre paylaşım 95C’dedir. Endgame kriz/isyancı koalisyon/federasyon güç denklemleri bütünüyle yeniden tasarlanmadı. Savaş kazanımı için ücretsiz telafi yapılmadı. Ölçülen gerilemeler karşılaştırma raporundadır. 95B başlamadı; GitHub’a yazılmadı.
