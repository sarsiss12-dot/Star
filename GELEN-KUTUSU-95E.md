# Kalıcı diplomatik gelen kutusu — 95E

`inbox.js` teklif motoru değildir. Mevcut bildirim codec'i ve siyasi nesnelerin ID/token referansları üzerinde kalıcı karar kayıtları tutar. Devlet menüsü ve +N durum listesi erişim sağlar. Tekliften devleti incelemeye gidilebilir; durum listesindeki geri dönüş aynı kayıt ID'sini açar.

## Kapsam

Mevcut aideal müzakereleri (ticaret/ittifak/savaş taahhüdü dahil), istihbarat paktı, himaye/vasallık, barış/statüko, federasyon daveti, oylama ve yetkili ortak savaş kararı. Federasyon daveti/oylama/kararları kanonik `G.feds` nesnelerinden eşitlenir; ikinci davet veya savaş yaratılmaz. Bağımsız bir “federasyon kuruluş teklifi” üreticisi mevcut motorda yoktur; yeni, otomatik kuruluş veya sahte teklif eklenmedi. Kuruluş motoru ve açıklamaları korunur. Süresiz konsey oylaması mevcut Konsey panelindedir; konsey kararları haber ağına kaydedilir.

Her kart gönderenin tarihsel adı, tür, açıklama/şartlar, gün bazlı geçerlilik/son gün ve durum taşır. Durumlar: bekliyor, kabul, ret, süre doldu, geçersizleşti. Müzakere maddeleri ve imza maliyeti güncel kanonik quote ile gösterilir. Vasallık türü ve federasyon yükümlülükleri görülebilir. Orijinal AI teklif penceresi ve karşı teklif hazırlama yolu korunmuştur; arşiv görünümü de mevcut karşı teklif akışını açar.

## İşlem doğruluğu

Kabulde süre, yaşayan taraflar ve türün mevcut şartları yeniden denetlenir. Anlaşmalar `dealQuote/executeDeal`; üyelik `acceptFedInvite`; ret `rejectFedInvite`; oy `castFedVote`; ortak savaş `executeFedDecision`; statüko `statusQuoPeace`; himaye mevcut `aiProtection/subjugate` hattından geçer. Araştırma, ambargo/parya, ödeme ve federasyon kapıları atlanmaz. Aynı arşivli anlaşmanın doğrudan eski işlem yolundan yeniden uygulanması da sonuç makbuzuyla engellenir.

Kabul/ret tek, eşzamanlı karardır. Arşiv ve haber kökleri mevcut anlaşma rollback kapsamındadır. Callback'ler oyun dünyası, kayıt nesnesi ve modal token'ını doğrular; başka pencere, kapatma veya save/load eski eylemi geçersiz kılar. Fonksiyon/callback kayda girmez. Başarısız ödeme kartı beklemede bırakır; süresi dolanı imzalamaz. Dış federasyon panelinden sonuçlandırılan davet aynı makbuza işlenir.

## Sınırlar ve göç

Geçici bildirim şeridi 6 karttır; arşiv bundan bağımsızdır. En çok 512 bekleyen + 256 sonuçlanmış kayıt saklanır. Kapasite doluysa mevcut teklif atılmaz; yeni bildirim teklifi alınmadığı açıkça bildirilir ve AI teklif üreticisine başarısızlık döner. Federasyonun kanonik bekleyen nesnesi kendi panelinde kalır. Aynı canlı şartlar bildirimden düşse bile yeniden üretilmez. Sonuç geçmişi en eskiden kısaltılır.

Save v8 ek alanıyla geriye uyumludur. Eski kayıttaki hayatta kalan bildirimler taşınır; daha önce altılı limitte kaybolmuş tekliflerin şartları/tarihçesi geri getirilemez ve uydurulmaz. İstisnai modül hatası diğer motorları durdurmaz; bir kez bildirilen modül duraklaması yeni oyun/başarılı yüklemede temizlenir.
