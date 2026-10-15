# Faz 94D — diplomasi tutarlılığı

## Tekrarlanan hata ve kural

94C'de iki taraflı ambargo kurup `subjugate` çalıştırınca iki bayrak ve etkin ambargo açık kalıyordu. `tests/audit-94d/before.json` bunu kaydeder; 94D `after.json` üç alanı da false gösterir.

Bireysel ambargo doğrudan vasal–hükümdar, müttefik ve aynı federasyon arasında yasaktır. `setEmbargo`, otomatik yaptırım turu, ilişki kurma yolları ve yükleme normalizasyonu aynı kuralı uygular. UI geçersiz eylem düğmesini sunmaz. Konseyin parya yaptırımı küresel hukuk istisnasıdır; kişisel ambargo olarak kaldırılmaz.

| Durum | 94D davranışı |
|---|---|
| Vasal + eski ambargo | İki yönde temizlenir, tekrar kurulamaz |
| Vasal + eski doğrudan savaş | Yüklemede/tur normalizasyonunda temizlenir; yeni ilan/vaat için önce bağımsızlık gerekir |
| Müttefik / federasyon + bireysel ambargo | Bağ kurma ve normalizasyon temizler; yeni yaptırım reddedilir |
| Savaş + sensör/geçiş/NAP/pakt/ittifak/casus ağı | İki yönlü eski izinler sona erer |
| Vasal + kapalı askerî sınır | Mevcut sınır tasarımı korunur; haraçgüzarlık her askerî geçişi otomatik açmaz |
| NAP + ambargo | NAP savaş açmama taahhüdüdür; tek başına dostluk/ticaret garantisi değildir |
| Bağımsızlık | Bağ, tür, öfke ve hükümdar fermanları temizlenir; yeni yaptırım yeniden mümkün |
| Hükümdar yok olmuş | Eski kayıt bağı güvenle kaldırılır |
| Başka hükümdara geçen vasal | Yeni efendiyle eski ambargo/savaş temizlenir |

## İlişki, sadakat ve öfke

İlişki -57, öfke 4 ve vergi aynı anda mümkün olabilir. İlişki, aylık bağımsızlık/öfke birikimi ve sadakat ayrı kavramlardır. Panel gerçek ilişki, sadakat, öfke eğilimi ve yürürlükteki fermanları gösterir; vergi/ilişki etkisini açıklar. Geçmiş savaş nedeniyle olumsuz ilişki zorla sıfırlanmaz. Her tarihsel ilişki puanının ayrı olay dökümü bu fazda eklenmedi.

## Doğrulama

Doğru aktör/hedef yönü, iki yönlü yaptırım, AI misillemesi, eski kayıt/RNG, ölü hükümdar, vasal devri, sadakat etkisi, antlaşmalar ve diplomasi merkezi test edildi. Mevcut müzakere/teklif geçerlilik, savaş, federasyon ve save/load paketleri geçti. Tüm olası diplomatik kombinasyonlar için mutlak tutarlılık iddiası yoktur.
