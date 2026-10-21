# Faz 96F — Mevcut AI denetimi ve entegrasyon sınırları

Kanonik temel doğrulanmış Faz 96E.1 ZIP'idir. Yeni AI motoru kurulmadı. `aiStrategy.goal` taktik uyumluluk alanı, `aiCampaign` askerî sefer kaydı, `aiProfile`, `aiEconomyPlan`, `aiKnownRoute`, ortak harekât, Commerce ve diplomasi işlem motoru korunur.

| Alan | 96E.1'de gerçek durum | 96F müdahalesi |
|---|---|---|
| Strateji | Darboğaz/savunma/savaş/bilim/ekonomi; 180 gün taktik tutma | Aynı kayıt içinde uzun hedef, ölçüm, hazırlık ve sınırlı eylem geçmişi |
| Kimlik | Tür, fizyoloji, etik, civic, genetik, doktrin ve köken `aiProfile` içinde etkili | Aynı profilden ağırlık türetildi; içerik ve bonuslar değiştirilmedi |
| Ekonomi | Gerçek üretim tahmini, kuyruk taahhüdü, maliyet ve bakım kapıları | Hedefe göre sınırlı yatırım tercihi; kritik bütçede eski toparlanma öncelikleri |
| Donanma | Ücretli tersane üretimi, bakım ve kapasite; gerçek filo hareketi | Hazırlıkta sınırlı doluluk hedefi, tek ana rakip/konum tercihi, savunma ve kayıp önceliği |
| Sefer | Bilinen rota/ikmal, build/gather/attack, 180 gün hedef tutma | 540 gün ilerlemeyen hedefe 360 gün bekleme; gerçek kuvvet/mesafe ilerlemesi |
| Araştırma | Mevcut teknoloji seçici, maliyet ve ilerleme | Mevcut bilim/ekonomi/askerî aday ağırlıklarına 1,20–1,25 tercih; teknoloji verilmez |
| Diplomasi | Ortak çıkar, etik, güven, kişilik, tehdit ve gerçek işlemler zaten mevcut | Uzun hedefe bağlı sınırlı persona tercihi, güvence/pakt/üyelik girişimi ve bilinen erişim |
| Federasyon | Kuruluş, üyelik, oylama, ortak savaş zaten mevcut | Aynı başvuru/oy mekanizması; uzun hedef için +0,08 federasyon/+0,04 güvenlik kabul eğilimi; engeller korunur |
| Vassallık | Mevcut koruma ve mali yükümlülükler | Gerçek ödeme ve fiziksel yardım hafızası; ilan anındaki mükerrer fiilî yardım ödülü kaldırıldı |
| Hafıza | `MEM_KINDS`, `remember`, `memTick`, `trustOf`; ortak başına 14 kayıt | Aynı listeye kanıtlı küçük ticaret/yardım/yükümlülük kayıtları; ikinci güven defteri yok |
| Casusluk | Civic ve kişilik etkili mevcut operasyon seçimi | Operasyon motoru yeniden yazılmadı; istihbarat paneline yetkili, sınırlı stratejik değerlendirme |
| Kayıt | Save v8, devletin kalıcı alanları | İsteğe bağlı plan alanları aynen saklanır; bozuk ek alan temizlenir; yeni RNG üretilmez |

## Uzun hedef ve hazırlık

Dokuz seçenek: bölgesel üstünlük, ekonomi, teknolojik gelişim, güvenli sınırlar, federasyon güvenliği, ticaret ağı, rakibi sınırlama, toparlanma, diplomatik nüfuz. Öncelik kimlik/koşul puanı ve seed/devlet/hedef üzerinden sabit kimlik hash'inden gelir; `RND_STATE` tüketmez. Olağan gözden geçirme 90 gün, asgarî hedef tutma 720 gün; olağan değişim için yeni adayın puanı en az 0,18 daha iyi olmalıdır. Büyük filo/koloni kaybı, kendi kapanmış savaşında ağır kayıp, gerçek ihanet, kritik stok veya görülen merkez/kriz tehdidi erken yeniden değerlendirme yaratabilir. Acil değişim sonrası 180 gün bekleme uygulanır; yeni ihanet/koloni kaybı bunu aşabilir. Taktik savunma bütünüyle bu beklemeye kilitlenmez.

Orta plan `stage/focus/build/diplomacy/partner/enemy/target/forceNeed/reason`; kısa eylem mevcut ücretli kuyruk, araştırma, teklif ve hareket fonksiyonlarıdır. Son 32 olay kalıcı tutulur. `objective-selected` satırındaki `stage`, yeni plan kurulmadan önceki aşama olabilir; aşama geçişi için `preparation-stage` ve aylık plan kaydı esas alınır. Olay kaydının varlığı eylemin tamamlandığı anlamına gelmez: ödeme, rota emri, teslim ve savaş sonucu ayrı kayıtlardır.

Hedef 900 gün ölçülebilir ilerlemezse başarısız değerlendirmesi alır. Bir hedef için tamamlanma kilometre taşı yalnız bir kez yazılır. Bilim üç gerçek teknoloji; bölgesel/sınırlama iki sistem; ticaret üç teslim edilmiş sefer ve mevcut pakt; güvenlik iki savunma yatırımı; diplomasi iki bağ; ekonomi en az 40 veya %20 olumlu net üretim artışı üzerinden ölçülür. Federasyon hedefi üyelik veya iki yeni müttefikle ilerleyebilir. Toparlanma kilometre taşı bütçenin sağlıklı hâle gelmesidir; donanmanın eski gücüne döndüğü anlamına gelmez. Bunlar gerçek ölçümler olsa da dünya liderliği, fetih zaferi veya tüm hedefin politik olarak tamamlanması iddiası değildir.

## Gerçek kaynak ve bilgi sınırları

Planlama kendi stok/gelirini, kendi kaybını ve öğrenilmiş/gözlenen yabancı bilgileri kullanır. Gizli yabancı stok/teknoloji değişimi plan puanını değiştiremez; testte kontrol edilir. Savaşın mevcut CB, erişim, bakım ve bütçe kapıları devam eder. Yeni gönüllü ikinci büyük cephe engellenir; federasyon/vasal savunma yükümlülüğü ayrıca işler. Öğrenilmiş rota olmadan stratejik ortak seçilmez. İnsan oyuncuyla teklif, gelen kutusunda bekler; otomatik imza yoktur.

Yeni ticaret koruma davranışı gerçek, yakın tarihli kendi/alacağı kargo kaybını gerektirir. Uygun boş gerçek filo, bilinen en fazla 90 günlük rota ve mevcut ortak savunma rezerv kurallarıyla yönlendirilir. Merkez yerel tehdidi, kritik bütçe ve toparlanma önceliklidir. Ücretsiz gemi, eskort veya kargo iadesi yoktur. Emir verilmesi korsanın kesin temizlendiği ya da teslimatın kurtulduğu anlamına gelmez.

## Hafıza

Ticaret: en az 180 günlük, iki döngü görmüş gerçek sözleşmede pozitif teslim; +4, ortak/tür başına altı ay bekleme. Fiilî yardım: aktif resmî ortak cephede gerçek hasar veya geçerli ortak planda gerçek savunma varışı/ele geçirme; +18, aynı destek için makbuzla tekrar engeli. Sadece söz vermek, filo ayırmak veya savaş ilanı bu ödülü üretmez. Mali yükümlülük: gerçekten tam ödenmiş pozitif ödeme, altı ay arayla +4. Ödeyememek otomatik ihanet değildir.

Kabul edilmiş fakat ulaştırılmamış yardım, ancak gözlenen ulaşılabilir boş kuvvet, yeterli istihbarat ve gerçek yükümlülük kanıtlanırsa −6 `sozAksadi` üretir. Kendi savaşına/savunmasına veya bütçesine yetişememek ve bilinmeyen kapasite olumsuz hüküm üretmez. Mevcut gerçek antlaşma/ittifak ihaneti mekanizması korunur. Yeni kayıtlar aynı aylık solmaya ve 14 kayıt sınırına tabidir. Eski kampanyanın mevcut hafızası silinmez.

`trustOf` daha önce boş hafızada erken sıfır dönüyordu; `trustStart` ilk küçük eylemde birden devreye girebiliyordu. Doğal başlangıç eğilimi artık hafıza yokken de uygulanır. Bu düzeltme diplomatik dengeyi etkileyebilir; eski hafıza değerleri yeniden yazılmaz.

## Arayüzün gerçek durumu

Son muharebe X mekanizması, rapor anahtarı ve kayıt desteği kanonik 96E.1'de zaten vardı. 96F yalnız dokunma hedefini 36'dan 44 piksele büyüttü ve gerçek muharebe/kaydet/yükle/yeni rapor testlerini ekledi. Muharebe kayıtları silinmez.

Yaşanabilir sistem işareti eski sürümde isim etiketi ve z>0,42 koşulundaydı. Yeni `mapHabitats` son gözlem kaydı yalnız hem taranmış hem şu anda gözlenen sistemde güncellenir. Oyuncu için uygunluk en az 35 olan sağlam yaşanabilir dünyalar; boş için içi boş elmas, yerleşilmiş için dolu kare kullanılır. İsimden bağımsız z>=0,12; ekran dışı ve aynı 18 piksel hücredeki fazlalık çizilmez. Sis altında yeni kolonileştirme/yıkım bilgisi okunmaz; eski kayıtta gizli dünyalara geriye dönük bilgi doldurulmaz. İşaret güncel mutlak hakikat değil son gözlem bilgisidir.

Düşük istihbarat yalnız görülen filo hareketini bildirir. Seviye 3 ve üzerinde yalnız genel yönelim ve sınırlı ekonomik toparlanma değerlendirmesi; hedef sistem, stok, teknoloji listesi veya gizli plan metni verilmez.
