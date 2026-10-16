# Federasyon AI ve başlangıç denetimi — 95B

## Mevcut mekanikler / kanıtlanan eksikler

95A kodunda 4 temel/11 iç yasa, 90 günlük gündem, kaynak bedelleri, tek hedefli Savaş Onayı, fon ve savunma zinciri vardı. İç yasa önerisi oyuncudan ve AI'dan gelebiliyordu. `updateFederations()` müttefiklik ağından birlik/üyelik türetiyordu; siyasi tür, adayın ayrı kabulü, açık ihraç kararı, tür reformu ve uygulanmayı bekleyen ortak savaş kararı yoktu. Eski birliklerde başkan alanı bulunmayabiliyordu. Federasyon üyeleri paneli uzaktaki kesin gerçek filo gücünü doğrudan gösterebiliyordu.

Başlangıç gerçek kampanyaları (`tests/fed-95b/before-final`) 11/404'te birer türsüz federasyon, 99'da sıfır federasyon gösterdi. Eski federasyonların başkanı yoktu. Bu ölçüm mevcut AI'nın hiç birlik kuramadığı anlamına gelmez; yeni faz siyasi kuruluşu ve bağımsız onayı açık hâle getirir.

Korunan sistemler: 95A gözlem/tahmin ve bilinen hiper-yol grafiği, savaş yetki/sonuç motoru, 94C ticaret bütünlüğü, 94B keşif rezervasyonu, araştırma, tersane/takviye/filo şablonları, tek 2B kamera ve Save v8.

Uygulama sırası: tür ve eski kayıt → siyasi kapılar ve oylama → reform/savaş uygulaması → aylık AI girişimi → mevcut panel → hedefli testler → gerçek kampanyalar → tam regresyon ve sınırlı düzeltme.

## Yeni siyasi davranış

AI ayda bir değerlendirme yapar. Tür tercihi kendi doktrinini, mevcut AI eğilimlerini, savaşı, düşük enerji gelirini ve bilim fraksiyonunu kullanır. Militarist askerî, Teknokrasi bilimsel, Tüccar/Kriminal ekonomik tercih alır. İlişki, güven, mevcut uyum ve bilinen iş birliği rotası adayın kabulünü etkiler. Askerî korunma puanı 95A'nın görünen/tahmini güç bilgisini kullanır. Bilinmeyen başkente ücretsiz rota, gizli gemi veya yabancı özel stok/teknoloji sorgusu eklenmedi.

Kuruluş iki kabul eden AI müttefik ve mevcut Etki bedeli ister; oyuncunun onayını simüle etmez. AI davete yanıt verebilir. Başkan, kötü ilişki/güven nedeniyle ihraç, hedefleri değiştiğinde tür reformu, uygun aday daveti ve askerî birliğin mevcut savaşına yardım önerebilir. Savaş oyu kendi ulaşılabilir kuvvetini, gözlemlenen/tahmini düşman gücünü, aldatmayı ve siyasi yasakları kullanır.

Başarılı girişimden sonra 12 aylık siyasi teklif beklemesi vardır; aynı ay tekrar çağrı kaynak/RNG/oy üretmez. Tür reformu ancak en az 24 aylık birlik ve açık tercih farkında düşünülür. Ayrılmak için 24 aylık birlik, çok düşük uyum ve başkana ciddi güvensizlik gerekir; ayrılıştan sonra 24 ay yeniden giriş yoktur. Mevcut iç yasa AI'sının 36 aylık beklemesi korunur. Yasa ve siyasi kararlar tek gündemi paylaşır.

Bu temel siyasi AI'dır: kapsamlı blok diplomasisi, ortak filo hedefi, savaş komutası veya oyuncunun müttefiğe emir vermesi eklenmedi. Siyasi tercihler deterministik puan, mevcut oylama isteği mevcut tohumlu RNG ile çalışır.

## Bilgi sınırı doğrulaması

Hedefli testler gizli filo/stok/teknoloji değişiminin reform tercihini değiştirmediğini; düşük istihbaratlı savaş oyunun gizli gemiye tepki vermediğini, bilinen aldatmaya tepki verdiğini; keşfedilmemiş başkentin korunma rotası oluşturmadığını ve panelin uzaktaki gizli takviyeyi göstermediğini doğrular.

Kampanyadaki ham düşük-istihbarat `totalPower` tanı sayacı 11/404'te 0, 99'da 1'dir; 95A'da da aynı 1 vardı. İz: `aiTurn → aiView → explorationContext → reinforcementThreats → claimOf → influenceAt → borderPressure`. Bu, mevcut kanonik toprak/hukuk hesabına gider; yeni siyasi tercih işlevinden gelen bir kesin yabancı filo sorgusu gözlenmedi. Bu sınırlı dinamik ölçüm bütün oyundaki bilgi güvenliğinin biçimsel ispatı olarak sunulmaz.

Üç doğal kampanyada oluşan yeni birliklerin ikisi de Bilimsel'dir. Üç türün bağımsız AI kuruluşu kontrollü gerçek işlev testlerinde ayrıca doğrulandı; doğal kampanyada tür çeşitliliğinin dengeli olduğu iddia edilmez. Üç örnekte yeni ortak savaş kararıyla katılım oluşmadı; savaş ve reform davranışı kontrollü testlerde yürütüldü.

Ek kontrollü siyasi döngü deneyi: AI başkanının oyuncuya kabul oylaması açması (oyuncuyu sessizce katmadan), yaşlanmış birliğe tür reformu önermesi ve güvensiz üyenin gerçek aylık AI ile ayrılması ayrı probe ile geçti. Kanıt: `tests/probe-federation-politics-95b.js`, `tests/audit-95b/political-ai-probes.json`. Bu ek probe sonuçları 4764 regresyon toplamına tekrar eklenmedi.
