# STARS — 90F hazırlık teslimi

**Tarihsel belge:** aşağıdaki kimlik ve kapsam 90F hazırlık paketine aittir.
Bu çalışma kopyasının güncel kimliği için `DEVIR-NOTLARI.md` ve
`RELEASE-MANIFEST.json` kullanılır.

Bu paket **90RC.3 oyun kodunu aynen içerir**. Oyunda görünen build `90rc-3`,
SW cache `stars-v90rc-3` kalır. Kod değişmediği için yeni bir güncelleme
numarası verilmedi. Nihai Android kabulü veya yayın onayı değildir.

Kaynak ZIP SHA-256:
`0b2f6c03ecf6c701d151782deb01d0ef53cd3132743dedd0e38ab74434260515`.

## Bu teslimde tamamlanan

- On bir ana üretim dosyasının kaynak ZIP ile byte-for-byte eşitliği.
- Açık risklerin durum/kanıt/kapanış koşullarıyla tek listede toplanması.
- Eski devirlerdeki kapanmış/açık iş ayrımının güncellenmesi.
- 91A–91D geliştirme sırası ve 87T cihaz kabulünün ayrı planlanması.
- Tüm teslim dosyalarının SHA-256 manifesti ve salt okunur doğrulayıcı.

`python3 tools/verify-release.py` paket içeriğini doğrular; oyun testlerini
çalıştırmaz. Herhangi bir dosyayı değiştirdikten sonra eski manifesti başarılı
sayma. Manifest kendi kendisini imzalamaz; güvenilen ZIP SHA ile birlikte
yanlış/eksik paketlemeyi bulmak içindir, saldırgan değişikliğine karşı imza değildir.

## Test kanıtı

90RC.3'te ölçülen 47 paket / 3892 geçen / 0 kalan / 0 atlanan aynen devralındı.
Bu fazda oyun kodu, test kodu ve fixture değişmedi; aynı regresyon yeniden
çalıştırılmadı. Sayı yeni bir koşu olarak sunulmaz. Sonuç dosyası
`tests/results-90rc-3.json`. Manifest test dosyalarını da kapsar.

## Kullanım ve devir

Oyunu çalıştırmak için ana 11 dosya aynı dizinde HTTP(S) ile sunulur.
Üretim harici asset/paket istemez. Geliştirici testlerindeki native Canvas
kontrolleri Node ve @napi-rs/canvas gerektirir; test bağımlılığı oyunun bağımlılığı
değildir. Python yalnız paket doğrulama aracının ihtiyacıdır.

Başka geliştiriciye/Claude'a devrederken bu ZIP, `DEVIR-NOTLARI.md`,
`ACIK-RISKLER.md`, `GELECEK-FAZLAR.md` ve en son cihaz sonucu yeterlidir.
Çalışmaya başlarken manifest doğrulanır. Eski raporlardaki test sayılarını
güncel sonuç gibi kopyalamak veya yeni sürüm yerine eski ZIP'e dönmek yok.

Mevcut cihaz kurulumun 90RC.3 ise bu belgeleme teslimi için yeniden kurulum
gerekmiyor. Cihaz testleri kullanıcı hazır olana kadar bekler. Yeni geliştirme
91A adıyla ayrı kopyada ilerler; bu aday geri dönüş noktası olarak korunur.
