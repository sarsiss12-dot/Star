# STARS — 87C devir notları

Kaynak: stars-faz87b.zip
SHA-256: `d5c465b0e1feb53f8d2dc924b7b9ee3da7ef6fcb193b6436720b62e99bf58aa0`.
Build 87c, cache stars-v87c. Önceki notlar DEVIR-87B.md içinde korunur.

Bu faz iki özel yolu kapsar: stealTech (90 Etki / araştırma puanı) ve
inciteRebellion (120 Etki / sınır kolonisi). Standart calTech ayrı kalır.

- finishSpecialOp, oyuncu ve AI için actor kaydının tek sahibidir. AI tick
  ikinci kayıt yazmaz; kota hâlâ ok:true olan ücretli denemeyi sayar.
- Sonuçta basarili ve outcome (basari/ifsa/sonucsuz), gerçek cost vardır.
  ok:true başarılı etki garantisi değildir. Başarı ve ifşa zarları, ücret,
  araştırma/koloni etkileri ve seçim/kota katsayıları değiştirilmedi.
- Her ücretli deneme opLog'a tek özet yazar (en çok 20). Etkili saldırı
  mağdurda bilinmeyen fail; suçüstü bilinen fail (hitLog en çok 30).
  Sessiz sonuçsuz girişim mağdur kaydı/bildirimi üretmez.
- incite mağdur anahtarı kiskirt ve sys/pi korunur. Teknoloji hırsızının
  adı yakalanmamış başarı bildiriminden kaldırıldı. Yakalanan kışkırtıcı
  oyuncu kurbana artık bildirilir. Gizli by alanı mevcut soruşturma içindir;
  UI yalnız known olduğunda adı gösterir.
- Yeni mağdur kayıtları mevcut soruşturma ve AI değerlendirmesine girdi
  olabilir. Bu nedenle uzun kampanya aynı kalır/RNG sonu aynı olur denmez.
  Kayıt yardımcısının kendisi RNG tüketmez; dal testleri zar sayısını sınar.
- İki dosya görünümü özel operasyon adını, ayrık sonucu, ücreti ve özeti
  gösterir. Eski kayıtta olmayan başarı/ücret uydurulmaz. v8 korunur.
- İki motora ortak güncel aktör/hedef/temas kapısı bağlandı. Geçersiz
  aktör veya eski dünya hedefi kaynak/RNG/geçmiş değiştirmeden reddedilir.
- Kayıt yan etkiden önce yazılır; özel operasyon transaction değildir.
  UI.eventArt hatası halen çağırana sızabilir. Test bunun gerçekleştiğini
  ve etki/geçmişin kaybolmadığını açıkça sınar; tam atomiklik iddiası yok.
- Özel düğmeler mevcut doğrudan yürütme davranışını korur. 87A onay
  güvenliği standart runOp içindir; özel yollar için yeni onay eklenmedi.

39 yeni hedefli senaryo: 2 operasyon × 3 sonuç × 3 aktör ilişkisi,
geçersiz hedef, gerçek UI eylemi, AI tick tek kayıt, sınırlama, v8 yükleme,
eski özet ve görsel hata sınırı. Ayrıntı FAZ87C-RAPOR.txt.

Sıradaki faz **87C.1 — Fısıltı Ağı / sahte bayrak / Astra High**.
Önce gerçek çağrı, bedel, sonuç ve fail bilgisi akışını haritala. Kuşatma
sabotajının otomatik yolunu da sınıflandır; hepsini aynı operasyona çevirme.
Somut bug varsa dar bir düzeltme ve hedefli test yap. Risk/kota/ekonomi
katsayılarını sırf denge hissi için değiştirme. Sonra 87D teklif tekrarları.

Harita/menü/portre, anlaşma transaction'ı, elçi, diplomasi, AI bütçesi,
87A onay ve 87B seçim, v8 ve Situation karantinası korunmalıdır.
Kullanıcı cihaz testlerine ara verdi; listeyi biriktir. Yayınlama yok.
