# Federasyon türleri ve anayasa — 95B

Kanonik 95A'nın dört temel ve on bir iç yasası korunur. Yalnız üç siyasi tür eklenir; yeni bilim ağacı, teknoloji, bina, gemi veya dış bağımlılık eklenmedi.

| Tür | Gerçek avantaj | Karşılık | Varsayılan savaş kuralı |
|---|---|---|---|
| Askerî | Filo kapasitesi +12 | Bakım değiştiricisine +4 yüzde puan; taban fon kesintisi %5 | Yeni saldırılara ortak savunma; saldırı için ayrıca karar |
| Bilimsel | Pozitif hesaplanan araştırma geliri ×1,08 | Pozitif enerji geliri ×0,97; taban kesinti %5 | Savunma/saldırı yardımı ayrı kararla |
| Ticaret | Filo bakım değiştiricisine −5 yüzde puan; taban fon kesintisi %4 | Pozitif araştırma geliri ×0,97 | Savunma/saldırı yardımı ayrı kararla |

Bakım sayıları toplam aylık fatura yüzdesi değildir; mevcut bakım değiştiricisine eklenir. Gelir etkileri hesaplanan pozitif aylık gelirde uygulanır; negatif geliri iyileştiren veya bedava stok oluşturan işlem değildir. Fon, üye stoğundan aynı miktar düşülerek aktarılır. Ortak Donanma %9, Sivil Bütçe %3 kesinti ile türün taban oranının yerine geçer; ikinci kesinti eklenmez. Mevcut Ortak Filo'nun ayrı 4 alaşım hazine kuralı korunur.

Tür avantajları `recalcMods` ve mevcut `fedApplyIncomeLaws` sahiplerinde bir kez hesaplanır. Bilim Ağı gibi mevcut yasalar kendi tek çarpanını korur: 100 araştırma → Bilimsel türle 108 → Bilim Ağı ile 120,96. Tekrar mod hesabı birikme yaratmaz. Tür değişimi veya üyelik kaybı eski etkileri kaldırır. Ticaret türü stokta olmayan kaynakları teslim etmez ve sanal ticaret geliri eklemez.

## Kuruluş ve üyelik

Kurucu en az iki bağımsız, yaşayan, kabul eden AI müttefik ister. Kuruluş bedeli mevcut 220 Etki, ilgili Konsey civic'iyle 130 Etkidir. Seçilen tür, bilinen iş birliği rotası, güven/ilişki ve adayın siyasi koşulları değerlendirilir. Kurucu adayları arasındaki savaş silinerek federasyon oluşturulmaz.

AI kurucusu oyuncuyu kendiliğinden üye yapamaz. Oyuncu türü seçerek kendi kuruluşuna açık onay verir. Sonraki üyelik için kabul oylaması ve adayın ayrıca kabulü gerekir. Oyuncu davette türün avantajlarını, yürürlükteki yasaları ve savaş yükümlülüklerini görür. Davet 180 gün geçerlidir; bu sırada anayasa/yasalar değişirse eski onay kullanılamaz. Ayrılma veya ihraç sonrası 24 ay yeniden giriş beklenir. Kuruluş en az üç üyeyle yapılır; yaşayan iki üyeli birlik korunur, tek üyede dağılır.

## Anayasa

Savunma (`auto`/`vote`), saldırı (`auto`/`vote`), kabul (`allies`/`contact`) ve oy ağırlığı (`weighted`/`equal`) ayrı kurallardır. Varsayılan kabul bütün üyelerle karşılıklı ittifak ister. Temaslı adaylara açılma anayasa oylaması gerektirir. Mevcut Savunma Paktı yasası yürürlükteyse tür savunma varsayılanından bağımsız biçimde ortak savunma doğurur; gerçek yükümlülük metni bunu birlikte hesaplar.

Yeni saldırı taahhüdüne hayır/çekimser kalan oyuncu, diğer üyeler %75 ile anayasayı değiştirse bile otomatik saldırıya sokulmaz. Sonradan daveti bu şartlarla kabul eden üye bu yükümlülüğü açıkça kabul etmiş olur.

## Tür reformu

- 150 Etki; uygun yaşayan üyelerin en az %75 evet oyu ve ağırlıklı evet üstünlüğü.
- Kabulden 360 oyun günü (12 ay) sonra yeni tür başlar.
- Yeni reform için kabul tarihinden 3600 gün (120 ay) beklenir; geçiş bittikten sonra ayrıca 120 ay eklenmez.
- Geçişte eski türün etkileri sürer. Geçiş tamamlanınca yalnız yeni tür uygulanır. On beş yasa silinmez.
- Savunma hâlâ eski türün varsayılanındaysa yeni varsayılana geçilir; açıkça seçilmiş farklı anayasa korunur. Savunma Paktı yasası varsa etkisi sürer.
- Önceden başlamış savaşlara yeni yükümlülük geriye dönük uygulanmaz. Aynı tarihte önce başlayan savaşlar da mevcut savaş defterinin sıra numarasıyla ayrılır.
- Başkan değişimi/üye ayrılması kabul edilmiş reformu iptal etmez. Federasyon dağılırsa bekleyen reform sona erer. Save v8 kesirli tarihleri ve süreyi korur.

## Eski kayıtlar

Türü olmayan eski federasyon deterministik olarak Askerî tür alır; eski savaş yükümlülüğü yalnız mevcut Savunma Paktı yasasından türetilir. Yeni Askerî varsayılanı eski kayda zorla uygulanmaz. Eski yasalar, açık oylar, süreleri ve fonlar korunur. Bu geçiş Askerî türün +12 kapasite/+4 puan bakım dengesini ekler; eski kayıt ilk yüklemede buna göre yeniden hesaplanır. Başkan kurucu geçerliyse kurucu, değilse yaşayan en küçük ID olur; RNG tüketilmez.
