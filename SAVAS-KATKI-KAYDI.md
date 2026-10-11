# 92A — ortak savaş için kanıt kaydı

92B güncellemesi: gerekçeli paylaşım taslağı ve oybirliğiyle onay artık
uygulandı. Kullanım ve sınırlar SAVAS-PAYLASIMI.md içinde; gerçek devir
hâlâ 92C kapsamındadır. Aşağıdaki metin 92A kayıt altyapısını anlatır.

Bu faz katkıları kaydeder ve diplomasi panelinde oyuncunun kendi cephe
özetini gösterir. Toprak dağıtmaz, savaş sonucunu değiştirmez ve katkıdan
otomatik bir hak/pay yüzdesi üretmez. Paylaşım teklifi 92B, uygulanması 92C.

## Cephe ve sefer ayrımı

- Cephe: iki devlet arasındaki tek savaş dönemi. Barış ve yeniden savaş
  aynı gün gerçekleşse bile ayrı kimlik alır.
- Sefer: açık destek çağrısıyla birbirine bağlanan cepheler. Federasyon
  savunması, senyör/vasal yardımı ve savaş sözü mevcut sponsor cephesine
  bağlanır. Sponsor hedefle savaşmıyorsa ortak sefer uydurulmaz.
- Aynı düşmana bağımsız saldırı, ittifak veya federasyona sonradan katılma
  cepheleri kendiliğinden birleştirmez. Karşı safta kayıtlı bir devlet
  geçmişi değiştirilerek aynı seferin dost tarafına geçirilmez.
- İkili savaşın kapanması diğer katılımcıların savaşını bitirmez. Mevcut
  vekil savaş barışı kuralları uygulanınca o cepheler de kapanır.

Katılım günü, neden, sponsor cephe, taraf ve federasyon/senyör kimliği
kaydedilir. Üyelik değişiklikleri günlük/aylık uzlaştırmada tarihçeye
eklenir; geriye dönük katkı aktarılmaz. Tanımlı savaş ilanı dışındaki
eski ayaklanma yolları ilk görüldüğünde kısmi kayıt açar. Aynı iki
uzlaştırma arasındaki kaydedilmemiş üyelik değişiklikleri tahmin edilmez.

## Ölçülen katkılar

| Alan | Kaynak ve anlam |
|---|---|
| Gemi kaybı / imha | Çözülmüş uzay muharebesi; bitişte imha edilen silahsız gemiler dahil |
| Verilen / alınan gövde hasarı | applyDamage sonucu; teorik saldırı gücü veya aşırı hasar değil |
| Taarruz kaybı / yok edilen taarruz | Yüzey savaşında gerçek ham ordu dayanımı azalması |
| Garnizon kaybı / kırılan garnizon | Çıkarma sırasında gerçek garnizon azalması |
| Sistem ve koloni ele geçirmesi | Gerçek sahiplik değişimi, önceki/yeni devlet ve gün |
| Fetih hedefleri | Savaş hedefinin gerçek sistem listesi; mülkiyet veya kesin hak değildir |

Başarılı işgalden sonra görevi tamamlayıp dağılan ordu savaş kaybı sayılmaz.
İkmal yıpranması, emirle filo dağıtma, devlet silinince filo temizlenmesi,
bombardımanda nüfus/yapı/kalkan kaybı bu askerî katkı sayılarında yoktur.
Korsan ve kriz çatışmaları devletler arası paylaşım defterine girmez.

Aynı cephede aynı devletin aynı sistemi/koloniyi tekrar alması farklı
ele geçirme sayısını artırmaz. Devir geçmişi korunur; dolayısıyla kaybedip
geri alma anlaşılabilir. Farklı cephelerden sefer toplamı çıkarılırken
92B varlık kimliklerini ayrıca tekilleştirmelidir. Sistem hâkimiyeti ile
koloni sahipliği ayrı kayıttır; ikisi toplanarak çift puan verilmemelidir.

Anlaşmayla sistem devri savaş sürerken yapılsa bile fetih sayılmaz.
Tarafsız üçüncü devletin kolonisi için savaş katkısı yazılmaz. Mevcut
captureSystem motoru aynı sistemdeki kolonileri de devreder; 92A bu eski
davranışı değiştirmez. 92B/92C, bu işlevi filtrelemeden paylaşım motoru
olarak kullanamaz: varlık bazında mevcut sahip ve izin kontrolü gereklidir.

## Kayıt, işlem ve görünürlük

G.warLedger v1, kayıt v8 içinde isteğe bağlı yeni alandır. Yeni oyun
defteri sıfırlar. Eski kayıtta aktif savaş varsa geçmiş kayıplar sıfırdan
uydurulmaz: o andan başlayan kısmi ölçüm etiketi kullanılır. Kayıt
yüklemek gün/ay ilerletmez ve RNG tüketmez. Hatalı defter yüklemesi
başarısız olur; yükleme transaction'ı önceki dünyayı geri getirir.

Anlaşma transaction köklerine warLedger eklendi. Başarısız warOn/barış
işlemi yeni cepheyi, kimlik sayacını ve bitiş bilgisini özgün nesne
kimlikleriyle geri alır. Tamamlanmış cepheler bu fazda silinmez; uzun
kampanya arşiv büyüklüğü ve snapshot maliyeti henüz ölçülmedi.

Diplomasi → devlet ilişkisi → Savaş katkı kaydı: yalnız oyuncunun o
devletle kendi cephesindeki sayılar gösterilir. Aynı seferdeki bilinen
destekçilerin adları gösterilebilir; yabancı cephe hasarları veya
keşfedilmemiş sistem/koloni konumları bu özete aktarılmaz. Paneli açmak
kaydı, RNG'yi, ilişkileri veya kaynakları değiştirmez.

## Sonraki fazın kapıları

92B paylaşım taslağı üretirken: gerçek güncel sahiplik; ilgili sefer;
üçüncü taraf hakları; katılımcının hayatta olması ve üyelik geçmişi;
eski/kısmi kanıt; oyuncu ve ilgili müttefiklerin onayı birlikte aranacak.
Kısmi kayıt tek başına hak dağıtımı için yeterli kabul edilmeyecek.
Paylaşımın gerçek sahiplik mutasyonu 92C transaction'ı olmadan açılmayacak.
