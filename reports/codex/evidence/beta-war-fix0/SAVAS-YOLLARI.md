# Savaş yolları denetimi — BETA-WAR-FIX.0

Kaynak: 731c8df (oyun96h10p12); kullanıcı vakası96h10p11. Kullanıcı kaydı yok. Aşağıdaki kontrollü kanıt gerçek 140. ay oturumunun teşhisi değildir.

| Yol | Başlangıç/bitiş davranışı | Bu fazın sonucu |
|---|---|---|
| declareWar / warDeclarationAccess / canDeclareWarOn | Yetki, doktrin, federasyon izinleri, neden, çift taraflı bayrak, ledger, savunma zinciri | Ortak kapıda eski kaynak cephenin barışla çözüldüğü otomatik vasal/senyör/federasyon çağrısını reddet. Yeni gönüllü savaş taahhüdü otomatik tekrar sanılmaz. Yeni kaynak savaş ayrı kabul edilir. |
| aiWarReview / eski aiTurn savaş kolu | Normal AI barış zamanını/720 gün temelli beklemeyi denetler | Değişmedi. Yeni küresel ateşkes süresi eklenmedi. |
| fedDefend / fedAttack / fedJoinSide / executeFedDecision | Açık destekle source front/campaign, savunma ve onaylı saldırı katılımı; applied kararı yeniden çalışmaz | Aynı kaynak cephede barış yapmış üyeyi eski çağrı tekrar sokamaz. Yeni savaş ve mevcut izinler korunur. |
| overlordDefend / vassalJoinWars / vassalTick | Aylık güvenlik ağı ve savaş çağrısı; eski barışa bakmadan tekrar declareWar | İki bağımsız yeniden üretim: önce FAIL, sonra PASS. Hüküm yalnız eski kaynak cephe için. |
| makePeace | İki bayrak, peaceAt, warDefense, proxy kayıtları, bağımsızlık, anılar, ledger, proxy barışı | Korundu; yerel oyuncuya diğer aktif düşmanların adlarını veya aktif savaş kalmadığını açıkça belirt. |
| applyItems peace/ally / executeDeal | Önceden ittifak kendi başına savaşı kapatabiliyordu; ally planı savas=false yapıyordu | Savaşta açık peace maddesi gerekir. Aynı pakette sıra bağımsız; barış bir kez makePeace yolundan uygulanır. Geçerli canPeace kapısı tekrar sınanır. |
| resolveProxyWars | Sponsorun barışı vekilin ilgili savaşını bitirir; proxy-peace | Gerçek kaynak senaryosu PASS. Barış olmayan üçüncü cephe kapanmaz. |
| warExhTick | %85 uyarı; %100 zorunlu barış, gerekirse canPeace kilidini kırar; exhaustion/day/auto | Meşru kural korundu. Otomatik barışı kaldırmadık. |
| crisisDiplomacyTick / council-unity / councilPunish | Krizde AI barışı; Konsey baskısı/ceza ve zorunlu ilanlar | İnsan–insan savaşı AI kriz barışıyla bitmez regresyonu. Politik/ekonomik katsayılar değişmedi. |
| ensureCrisisEmpire | Bütün taraflara doğrudan savaş bayrağı; declareWar dışı | Kişiye özel kriz savaş haberi ve üst bildirim eklendi; diğer devletlerin gizli bilgisi yok. |
| breakVassalWar / independence support / rebel twin doğumu | Bazı doğrudan war=true yolları; günlük ledger sync sonradan görür | Yükleme dışındaki sync yeni gözlenen cepheyi event olarak bildirir. Kesin başlatma ayrıntısı bilinmiyorsa belirtilir, uydurulmaz. |
| subject-binding / alliance-conflict / subjugation / rebel-coalition / rebellion-victory / settlementApply | İlişki/yerleşim sonucu kapanan savaşlar | Mevcut ledger kapanış nedeni/aktörü korundu; yeni barış motoru yazılmadı. |
| warStartNotice | root.playerNotified tüm seferi kilitliyordu | f.playerNotified ile her gerçek cephe bir kez; gerçek front/sponsor/kind. |
| MP warSweep | Yalnız düşman ID kümesi; iki yayın arasında barış+aynı düşmana yeni savaş gözden kaçabilirdi | Düşman→front kimliğiyle izleme; host dünyasına yazmaz. |
| MP guest mirror/rebuild | Eski sürümde savaş yalnız kısa log/toast; yeni kartlar ayna üstünde kaybolabilir | Süzülmüş haberin kendi cephesi için gerçek üst kart; görülmüş anahtarlar sınırlı; canlı kart kimlikleri korunur. |
| MP aiToHuman | Bekleyen kopya engeli vardı; reddedilen aynı teklif hemen yeniden oluşabiliyordu | Mevcut SP810 günlük ret penceresi yalnız AI kaynaklı aynı şartlara uygulanır; insan tekliflerine uygulanmaz. |

## Gerçek olay ile simülasyonun ayrımı

- 5/20 gerçek saniye oyun günü değildir. Hız ve otomatik duraklama kayıtları olmadan eşleştirilmez.
- 5 saniyelik duraksamanın filo/taktik mi diplomatik bayrak mı olduğu kullanıcı kaydı olmadan belirlenmedi.
- 20 saniye sonrası toplu savaşın bu çağrılardan kaynaklandığı iddia edilmez. Kanıtlanan hata aynı gözlenebilir sonucu kontrollü üretebilmektedir.
- Normal AI NAP kolu zaten savaş filtresi içerir; savaş sırasında bağımsız NAP quote tarafından zaten reddedilir. Bu faz, geçmiş gerçek NAP kartlarının hangi kod sürümünde/hangi günde üretildiğini kanıtlamaz.
- Eski Save8 defterinde kapalı cephe yoksa bilinen warSince/peaceAt tarihleri kullanılır. Bunlar da yoksa eski çağrı kesin eşlenemez; yeni tarih uydurulmaz. Kullanıcı kaydı gereklidir.

Ek kanıt: uzak insanın tanımadığı bir katılımcı savaş açınca eski warStartNotice host0 dışındaki tarafları erken döndürüyordu; temas kurulmadığından newsVis de haberi süzüyordu. Yalnız insan taraflı gerçek ilanlarda karşılıklı diplomatik temas sağlanır; konum/filo/istihbarat açılmaz. mp-contact-before/after bunu doğrular.
