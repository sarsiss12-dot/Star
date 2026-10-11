# STARS — 87B devir notları

Kaynak: stars-faz87a.zip
SHA-256: `23a72efd872c097bd8e8f369f4692ffce3bd6829b1d9c4b86ba16a4fad680b73`.
Build 87b, cache stars-v87b. Önceki notlar DEVIR-87A.md'de korunur.

87B yalnız ai.js seçim yolunu değiştirdi. main.js yalnız build,
sw.js yalnız cache; diğer sekiz üretim dosyası bayt düzeyinde aynı.

- `aiStandardOpReady` → `opQuote`: standart aday önce gerçek uygunluktan
  geçer, sonra mevcut %40 rezerv gerçek q.cost üzerinden hesaplanır.
- `aiPickOp` başlangıcında ortak hedef kapısı; son sıralamada uygunsuz
  standart aday atlanır. Puan, eşik, sıraya göre eşitlik çözümü değişmez.
- Etik katkı `canIncite` başarısızken de incite puanı verebiliyordu. Özel
  incite adayının son seçiminde canIncite tekrar doğrulanır.
- stealTech ayrı 90 etki yolunda; incite ayrı 120 etki yolunda kalır.
  Başarı/ifşa zarları ve yürütme motorlarına dokunulmadı.
- Seçim filtresi RNG tüketmez. Ancak farklı operasyonlar yürüdüğü için
  uzun koşunun RNG sonu ve dünya durumu 87A ile aynı olmak zorunda değildir.
  Aynı 87B girdi/seed koşusu tekrarlanabilir.
- aiPickOp bütünü saf değildir: mevcut profil/mizaç önbelleği ve
  _lockTarget davranışı korunur. Saflık iddiası yeni uygunluk yardımcısı içindir.

3×120 adımlık yalnız operasyon laboratuvarı: geçersiz standart girişim
575→0; yürütülen 492→498. Özel yollara bu fixture'da girişim 0; bunlar
ayrı hedefli senaryoda sınandı. Bu veri genel kampanya dengesi sayılmaz.
Rapor: FAZ87B-RAPOR.txt. Problar ve önce/sonra JSON'ları tests içindedir.

Sıradaki faz **87C — özel casusluk sonuçları / Astra High**.
Önce stealTech/incite sonuç türlerini ve UI ile AI kayıt yollarını ölç.
`ok:true` başarılı etki demek değildir: ifşa edilmiş veya sonuçsuz ama
bedeli ödenmiş deneme de ok:true dönebilir. Sonuç ekranı bunu açık
ayırmalı. Fısıltı/sahte bayrak/kuşatma sabotajı sonraki alt parça olabilir;
tek fazda bütün sistemleri yeniden yazma. İlk uygulanacak parçayı somut
bulguya göre sınırla. Üretim oranlarını sırf görünüm için değiştirme.

87A oyuncu onayı, 86C.6 anlaşma transaction'ı, diplomasi/elçi/AI bütçesi,
savaş-antlaşma kapanışı, harita/portre/menü, v8, depolama anahtarları ve
Situation karantinası korunmalıdır. Kullanıcı cihaz testlerine ara verdi;
listeyi biriktir. Yayınlama yok, yeni doğrulanmış ZIP teslimi var.
