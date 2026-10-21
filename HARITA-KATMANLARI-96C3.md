# Savaş hatları ve Savaş Haritası

## Yeniden üretim

Kanonik Chromium probu: knownWarPairs=1; hedef pSeen=true, pVis=false; warMapConnections=0. Aynı haritada tarafın sistemi/siyasi aidiyeti gösterilirken çizgi için ayrıca canlı filo radarı isteniyordu. Toggle gerçek değişkeni değiştiriyordu; sorun yalnız CSS değildi. Eski .48 opaklık ve 1/1.7px çizgi de zayıftı.

## Küçük düzeltme

Bağlantı ucu yalnız pSeen olan ve tarafın zaten siyasi haritada gösterilen sistemidir. Önce uygun başkent, bulunamazsa keşfedilmiş uygun sistem. Haritada bilinmeyen başkent/konum kullanılmaz. knownWarPairs temas ve üçüncü taraf seviye3 istihbarat kapıları aynıdır. Yeni filo, rota, devlet veya gizli ilişki bilgisi açılmaz. Tarihsel sahiplik arşivi gibi yeni istihbarat sistemi eklenmedi; mevcut siyasi haritanın bilgi modeli kullanılır.

Eski 'anlık radarda değilse keşfedilmiş yabancı uç da kullanılamaz' testi yeni kabul şartıyla çeliştiği için yeni davranışa uyarlandı. Bu, gizli uç testinin kaldırılması değildir: keşfedilmemiş başkent, alternatif uçsuz taraf, bilinmeyen devlet, yetersiz üçüncü taraf savaş istihbaratı ve gizli muharebe raporu testleri ayrıca korunur.

Kırmızı çizgi .88 opaklık ve oyuncu2.5/diğer2px; bağımsız WAR_LINKS_ON, WAR_LINKS_REV, tercih kaydı ve ana mod aynıdır. Aç/kapa redraw kanonik yoldan istenir. Uygun iki uç yoksa kısa açıklama verilir. İki uç ekran dışında olsa bile parça ekranı kesiyorsa çizilir; bütünü dışarıdaysa elenir. Düğme açıkken gizlenme nedeni istihbarat/konum veya ekran kesişimidir. Bu katmana yeni minimum zoom sınırı eklenmedi; .09/.10/.18/1 koşulları sınandı. Federasyon/ittifakın mevcut zoom .10 çizgi ve .18 amblem kuralları değişmez.

## Gerçek Canvas kanıtı

Gerçek DOM toggle'ından sonra native Canvas'ta kırmızı piksel1440; kapalı0. Tam View Canvas görüntüsü de açık/kapalı farklı: 740×360 için21612, 1280×720 için4223 renk kanalı. Bunlar izole çizgi pikselinden ayrı ölçülerdir; tam harita farkının tamamı tek çizgiye atfedilmez. Siyasi, Diplomatik ve Savaş modlarında çizgi devam eder. Savaş hatları kapanınca ana Savaş Haritası modu hâlâ savas olarak kalır. Gerçek makePeace sonrasında çizgi0. Save v8 bayrağı korur.

360×740: yönlendirme açık kalır, oyun düğmesine engelin içinden tıklanmaz. Toggle yatayda gerçek tıklanır; cihaz dikeye dönünce alttaki gerçek Canvas da >50 kırmızı piksel üretir. Sonra yataya dönülüp toggle kapatılır. Dikey kontrolü yatay oyun tıklaması gibi sunmuyoruz. Native metrikler browser-final-summary.json ve browser-locked-96c3/summary.json içindedir.
