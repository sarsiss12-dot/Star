# Devlet kimlikleri — 95D

Başlangıç denetimi: `empireName` etik eksenlerine göre ad üretiyordu; 40 başarısız denemeden sonraki fallback ne benzersizliği denetliyor ne de adı ayırıyordu. Oyuncu adı kullanılanlar tablosuna alınmıyordu. Hanedan/İmparatorluk/Cumhuriyet/Kolektif/Konsorsiyum/Kovan/Makine Ağı/Birlik/Konfederasyon temaları, farklı kelime dizilişleri ve yeni kökler eklendi. Makine ve kovan karakteri ayrıca dikkate alınır; mevcut etikler ve biyoloji tasarımı yeniden yazılmadı.

Adlar NFKC, Türkçe küçük harf ve boşluk normalleştirmesiyle karşılaştırılır. Yeni oyunda oyuncu adı ayrılır. Havuz tükense veya rastgele kaynak sabit dönse bile `· 2`, `· 3` gibi ayrılmış son ekler üretilebilir. Yeni doğan devletin makeEmpire adı da yaşayan devletlerle karşılaştırılır. Eski kaydın adı, eski çakışmalar dahil, bu fazda geriye dönük değiştirilmez.

Genişleyen isim üretimi özel hash akışındadır. Eski AI isim seçiminin PRNG çekimleri yapısal akış için korunur; yeni isim sayısı başlangıç sistemi, araştırma, lüks kaynak, stok veya filoları değiştirmez. 11/99/404 başlangıç projeksiyonları kanonik 95C.1 kaynağından alınmış test fixture’larıyla eşittir. İlk uygulamadaki istemsiz akış farkı tam regresyonda bulundu ve düzeltilmiştir.

Federasyon adı türüne uygun havuzdan, dünya tohumu ve federasyon kimliğiyle oluşturulur; yaşayan federasyon adlarıyla çakışmaz. Üç tür aynı kalır. Eski federasyon adları korunur. Kimlik kökeni `identityType` alanındadır; tür reformu güncel type/charter kurallarını değiştirir, adı ve amblemi silmez. Başkan seçimi kimliği değiştirmez.
