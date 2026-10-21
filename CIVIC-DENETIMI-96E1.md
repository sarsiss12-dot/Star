# Faz 96E.1 — 13 civic denetimi

| Civic | Gerçek mekanik ve denetim sonucu |
|---|---|
| Bürokratik Verimlilik | +2 yapı yuvası ve +%10 bina hızı; colonySlots/buildDays ile PASS. Yeni özel eylem gerekmez. |
| Gen Öncüleri | doColonize başlangıç nüfusu 3→7; PASS. AI aynı koloni motorunu kullanır. |
| Kale Doktrini | Mevcut uzay yapısı indirimi korundu; eksik gezegen kalesi maliyeti −%40 buildingCost/queueBuilding içine bağlandı. Savunma gücü mevcut katsayılarla PASS. AI gözlenen tehdide göre kale/platform önceliği verir. |
| Sinyal Avcısı | Sensör +1, tarama süresi ×0,55, anomali olasılığı artışı; gerçek arrive/anomChance ile PASS. Otomatik keşif motoru korunur. |
| Madencilik Loncaları | Kolonilerde mevcut minMul +0,20 korunur; maden istasyonu katkısına eksik ×1,20 bağlandı. Koloni net girdi/çıktı modeli değiştirilmedi; aynı üretime ikinci kez +%20 eklenmez. Gerçek empireIncome farkı PASS. |
| Gölge Konseyi | Mevcut casusluk −%30 korunur; anlaşma etki maliyeti −%30 eklendi. Operasyon başarısı için yeni bedelsiz bonus yok. Mevcut resmî savaş ilanı yasağı açıklamaya eklendi; Arındırıcı ile yeni seçim engellenir. Gerçek maliyet PASS; AI casusluk tercih ağırlığı arttı. |
| Lojistik Komiserliği | Filo kapasitesi ×1,15 ve bakım ×0,85 mevcut ortak hesapta PASS. Ek tersane hızı vaat edilmedi/eklenmedi. Askerî tercih, kaynak ve bakım kapılarının içinden çalışır. |
| Enkaz Mühendisliği | Gerçek applyDamage imhasında düşman gemisi alaşım bedelinin %15'i; PASS. Yeni paralel ganimet yolu eklenmedi. |
| Panoptikon | Oyuncu görüşü mevcut; AI explorationContext aynı tam görüş hakkını kullanır. Temasta −100 ilişki bedeli korunur; PASS. Bu civic'in açık görüş yetkisi gizli bilgi hilesi olarak sayılmadı. |
| Kan Hukuku | Eksik savaşta +%15 uzay hasarı ve +0,25 askerî üretim hızı ortak hesaplara bağlandı. Mevcut barış yasağı/diğer kara kuralları korundu; PASS. Sivil gemi süresi bu askerî bonusu almaz. |
| Taht Gemisi | Mevcut geminin bulunduğu sistemde +%15 üretim, yok oluşta 12 ay ×0,50 üretim; PASS. Üretim zaten tek kez uygulanıyordu, yeniden yazılmadı. AI kayıp gemiyi mevcut teknoloji/tersane ve 5000 alaşım+2500 enerji bedeliyle yeniler; PASS. |
| Tek Ürün Ekonomisi | Seçili min/ene/yiy üretimi +0,60, diğerleri −0,40 ortak mods yolunda PASS. Yeni AI, yiyecek kullanmıyorsa yiyeceği uzmanlık seçmez. Ciddi açıkları mevcut ekonomik toparlanma önceler. |
| Yıldız Yiyen Ekonomi | Mevcut fonksiyon gerçek UI/aiTurn akışına bağlandı. Maden istasyonu ×0,40, yıllık +8 açlık (aylık 8/12), tam açlıkta üretim ve ateş çıktısı ×0,45; PASS. Tüketim, tekrar engeli, kaynaklar, güvenli hedefler, kayıt devamlılığı ve tarayıcı onayı test edildi. |

Yeni seçimlerde 2 yuva: normal 1, radikal 2 ve tek başına. Eski kayıttaki aşırı yuvalı kombinasyonlar silinmez. Tekrarlanan anahtarlar modifier toplarken bir kez sayılır; eski listeler yerinde korunur. Ayrı bir hükümet kataloğu/evrensel etik-civic yasağı bulunmadığından tasarım dışı yeni yasaklar eklenmedi.

PASS işareti tabloda belirtilen motor kontrollerini ifade eder; bütün muhtemel çoklu civic/teknoloji/savaş durumlarının tüketici testi yapıldığı anlamına gelmez.
