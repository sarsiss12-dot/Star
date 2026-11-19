# STARS p43 — AI karar kalitesi ve oyun performansı

18–19 Kasım 2026 · Araştırma raporu

**1. Büyük galakside keşif ve takviyenin sınır taramasını daraltın.** Gerçek Chromium’da 500 sistem için erken oyun tam ay p95’i 1.850 → 688 ms, ilk geç oyun örneğinde 6.290 → 5.161 ms oldu. Erken oyun kazanımı %62,8. İki bağımsız geç oyun ölçümünde p95 kazancı %17,9 ve %13,9 oldu. Küçük haritada ortanca süre %6,7 arttı. Büyük galaksi pilotu için yayından önce geç oyun p95 kazanımını ve küçük harita korumasını doğrulamak gerekiyor.

**2. AI için en yüksek öncelik, bir binayı başka bir ihtiyaç için yıkıp ilk fırsatta aynısını yeniden satın alma döngüsü.** Üç 100 sistem kampanyasında 915 tamamlanmış yıkımdan 261’inin ardından ilk ücretli iş aynı binaydı. Sipariş en geç altı ay içinde verildi ve bina yeniden tamamlandı. Devletlerin hurda iadesi sonrası toplam 32.803 minerali bu işlere gitti. 182 döngü dökümhaneydi. Ayrı 500 sistem kampanyasında 240. aya kadar 458 döngü daha görüldü. Net maliyet 58.209 mineraldi. Üretim kaybı bu tutarlara dahil değil.

**3. Bir filonun varması ile savaş amacının gerçekleşmesi arasında büyük fark var.** Tohum 11’de 42 gemilik iki filo hedefe dokuz günde vardı ve rakip vasallaştırıldı. Tohum 404’te saldıran taraf 11 gemi kaybedip 40 gemi imha etti, ancak yedi aylık savaşın sonunda üç fetih hedefinin hiçbirini alamadı. Bu ayrım yeni AI işinin kabul testine de girmeli.

## Sürüm, düzenek ve kanıt sınırları

Taban [PR #59](https://github.com/sarsiss12-dot/Star/pull/59), dal `codex/stars-mp-p42-saha0`, uzak ve yerel HEAD `54a52555c699d82507f6285580577571d4200380`, oyun `96h10p43 / MP.8.9b42`. Dal, verilen referanstan ilerlememişti. Araştırma dalı `codex/stars-p43-ai-perf-arastirma`. Araştırma düzeneğinin önceki GitHub kontrol noktası `1cead0066a71a3f63c61f10a34c66ce05699f878`. Oynanabilir paket p43 olarak kaldı. Pilot yalnız ölçüm sürecindeki işlevlerle çalıştırıldı.

Kanonik kampanyalar p43’ün normal kurulumundan, varsayılan dengeli ayarlarla, hareketsiz bir insan devletiyle başladı. 60 yarım günlük adım bir ay. Görünürlük, savaş, diplomasi, ekonomi ve iş kuyrukları üretim motoruna ait. Her tohumun bütün ölçümleri aynı kampanyadan alındı. Aylık kayıtlar sonradan doğan devletleri de içerir. Oyun bitişi korundu. 404. tohum 180. ayda bitti. Bu tohumun 240. ayı NOT RUN. 96H ile mutlak kalite veya hız sıralaması yapılmadı. Bugünkü galaksi yoğunlukları, diplomasi, savaş hedefleri ve gözlem düzeni farklı.

Önceki kanıtlarla ilişki şöyle. PERF.1 ticaret yollarının tekrar hesabını, PERF.2 salt okunur AI gelir penceresini azaltmıştı. MP.8.6 misafirde bulutsu piksel üretimini hızlandırmıştı. BETA-SCALE.0’da bilinmeyen sistemi erken geçmek, Chromium 31. ayda kayıtlı güç ve sınır önbelleği alanlarını değiştirmişti. Buradaki pilot özgün sınır baskısı çağrılarını ve sıralarını korur. 96H.8–10’daki bakımı finanse edilebilen kuvveti gönderme ve kuşatmayı sürdürme davranışları kontrol edildi. 96H.11’deki genel yıkım puanı değişikliği yeniden inşayı yeterince düşürmemişti. [Çalışma kuralları](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/AGENTS.md) · [Son MP raporu](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/reports/codex/MP-P42-SAHA0-SONUC.md) · [96H.6 ekonomi](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/RESEARCH-96H6.md) · [96H.6.3](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/RESEARCH-96H63.md) · [96H.7](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/AI-KARAR-VERIMLILIK-96H7.md) · [96H.8](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/AI-SEFER-VERIMLILIGI-96H8.md) · [96H.9](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/AI-ISTILA-VERIMLILIGI-96H9.md) · [96H.10](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/AI-KARA-ORDUSU-GUVENLIGI-96H10.md) · [96H.11](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/AI-GEZEGEN-VERIMLILIGI-96H11.md) · [PERF.1](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/PERF1-SONUC.md) · [PERF.2](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/PERF2-SONUC.md) · [MP.8.6](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/reports/codex/MP86-PERFORMANS-SONUC.md) · [BETA-SCALE.0](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/reports/codex/BETA-SCALE0-SONUC.md)

## AI kararları, erişilen hedefler ve maliyet

İlk sütunda sistem / başlangıçtaki AI ve tohum var. Hedef seçimi ve kilometre taşı sayaçları `aiUpdateLongPlan` / `aiPlanEvent` olaylarıdır. Bir plan için oyunun ölçülebilir eşiğe ulaştığı ilk an sayılır. Açık planlar ve önceki planın yerini alan seçimler nedeniyle bunları kazanma yüzdesine çevirmedim. Süreler, son kayıtlı hedef seçiminden kilometre taşına kadardır. Filo varışları ise yarım günlük izlemede filo kimliği ve hedef sistem eşleşince sayıldı. Yenilenen aynı rotaya tekrar emir puanı verilmedi.

| Sistem / AI · tohum | Ay | Hedef seçimi / tamamlanan / yeniden değerlendirilen¹ | Tamamlanan hedef ay p50/p95 | Askerî rota / varış | Varış günü p50/p95 | Bina / gemi siparişi |
|---|---|---|---|---|---|---|
| 100 / 9 · 11 | 240 | 77 / 41 / 8 | 6 / 30 | 556 / 550 | 10,5 / 58,5 | 1124 / 1348 |
| 100 / 9 · 404 | 180 | 61 / 29 / 12 | 6 / 30 | 429 / 408 | 9,0 / 29,5 | 605 / 1073 |
| 100 / 9 · 99 | 240 | 72 / 40 / 6 | 6 / 33 | 736 / 720 | 9,0 / 34,0 | 955 / 1474 |
| 500 / 16 · 11 | 240 | 87 / 57 / 4 | 6 / 27 | 1332 / 1308 | 13,5 / 55,5 | 4196 / 2598 |

Üç 100 sistem kampanyasında toparlanma hedefi 59 kez seçildi ve motor 58 toparlanma eşiği kaydetti. Bölgesel hedefte aynı sayaçlar 36 ve 10 oldu. Devletin önceki durumuna göre iyileşmesi, kaynak açığını kalıcı kapatması ve bir savaş hedefini kazanması farklı sonuçlar. Aşağıdaki stok, kuyruk ve savaş defteri ölçümleri bu ayrımı gösteriyor.

¹ Son sayaç stratejik planın ilerlemesinin durmasıdır. Askerî seferin hedef bekleme süresi ayrı izlenir. Bir filosu izleme sırasında silinen durum birleşme veya kayıp olabilir. Savaş maliyetini bu kayıtlardan çıkarmak yerine savaş defterinin `shipsLost` alanını kullandım. [100-9-11](../../research/p43-audit/raw/100-9-11.json.gz) · [100-9-404](../../research/p43-audit/raw/100-9-404.json.gz) · [100-9-99](../../research/p43-audit/raw/100-9-99.json.gz) · [500-16-11](../../research/p43-audit/raw/500-16-11.json.gz)

| Sistem / AI · tohum | 120. ay koloni / gemi | Son ay koloni / gemi | İnşa için ödenen mineral / alaşım | Gemi için ödenen mineral / alaşım | Kritik devlet-ay | Tamamlanan söküm / aynı binaya dönüş | Dönüşte net mineral |
|---|---|---|---|---|---|---|---|
| 100 / 9 · 11 | 34 / 192 | 55 / 620 | 199.140 / 6.455 | 17.566 / 54.582 | 32 | 432 / 130 | 16.365 |
| 100 / 9 · 404 | 35 / 357 | 43 / 548 | 109.870 / 3.185 | 9.216 / 39.386 | 161 | 147 / 32 | 4.256 |
| 100 / 9 · 99 | 29 / 314 | 63 / 766 | 173.200 / 5.450 | 18.097 / 59.072 | 7 | 336 / 99 | 12.182 |
| 500 / 16 · 11 | 81 / 593 | 272 / 1521 | 768.224 / 26.771 | 61.875 / 133.011 | 6 | 1143 / 458 | 58.209 |

**Ekonomi.** Kritik devlet-ay, enerji, mineral, yiyecek, tüketim malı veya alaşımdan en az birinin neti negatifken stokunun üç aydan kısa dayanmasıdır. Bir ayda iki açık yaşayan devlet bir kez sayılır. Kaynak başına kesintisiz dönemleri ayrıca izledim. Üç 100 sistemli kampanyada kapanan beş dönem 2, 2, 5, 19 ve 37 ay sürdü. Dört dönem gözlem bittiğinde açıktı. Dokuz dönemin hepsinden önce en az bir ay 12 aydan az stok uyarısı vardı. Üçünde kritik sınıra gelmeden ilgili üretici siparişi görüldü. Erken stok uyarısı, AI’ın iç algısının yalnızca gözlenebilir bir göstergesidir. [Dönemler ve karar sayaçları](../../research/p43-audit/raw/summary.json)

404. tohumda devlet 2’nin tüketim malı 59. ayda kritikti. 60. ay kaydında `aiEconomyPlan` açıkça `recover` seçti. Stok 17,2, aylık net −10,5 ve inşaat kuyruğu boştu. 120. ayda tüketim malı sıfırdı, çiftlik sıradaydı ve tersane enerji dayanımını yetersiz buluyordu. Yiyecek 96., mineral 136. ayda kritik oldu. 180. ayda iki koloni, sıfır gemi ve üç kaynakta sıfır stok kaldı. Vasal ilişkisi 97. ayda kuruldu. İlk açık vasallıktan önce başladı. Bu, krizi tanıyıp finanse edememe vakasıdır. Hukuki/oyunsal iflas ilanı sayılmadı. [Kayıttan bütçe, ikmal ve tersane gerekçeleri](../../research/p43-audit/raw/checkpoints.json.gz)

Üretim getirisi için 120. ayın üç bağımsız kaydındaki uygun AI kolonilerinde gerçek `aiBuildingDelta` hesabını ayrı kopyada çalıştırdım. Bir ek madenin ortanca aylık etkisi +17,3 mineral ve −1,6 enerji. Santral +24,2 enerji. Dökümhane +13,9 alaşım karşılığı −16,8 mineral ve −3,2 enerji. Dolayısıyla daha çok dökümhane her ekonomiyi güçlendirmiyor. Tohum 11’de 120 → 240 arasında AI gemi sayısı 192 → 620, aylık alaşım 297 → 572 oldu. Bu beraber değişimdir. Tek binaya atfedilen etki yalnız gölge hesapta ölçüldü. [Koloni başına marjinal üretim](../../research/p43-audit/raw/choices.json)

**Sökümün fırsat maliyeti.** Tohum 11, devlet 1, sistem 27, gezegen 1’de laboratuvar için sökülen dökümhane 2447. günde kalktı. 2460’ta yine dökümhaneye 210 mineral ödendi, 2578’de bitti. Hurda 74 mineral. Net 136 mineral ve aynı binanın 131 günlük yokluğu. Üç tohumda bu tür işlerin toplamı 32.146 bina-günü. Bu süreler ayrı kolonilerde eşzamanlı geçebildiği için kampanya takvimine eklenemez. Kimlik eşlemesi devlet + sistem + gezegen + bina türüyle yapıldı. Yıkım emri veya yarım inşaat tasarruf sayılmadı. [100-9-11](../../research/p43-audit/raw/100-9-11.json.gz)

261 döngünün tamamında aynı koloni ve bina türü için önceki stratejik ikame kararı saptandı. Araya başka söküm girmedi. 92 döngüde hedef laboratuvar, 58’inde madendi. Kodda `pick.wanted` karar günlüğüne yazılıyor. Slot boşaldığında sonraki aylık tur ihtiyaçları yeniden sıralıyor ve parası yeten ilk binayı sipariş ediyor. [Yıkım ve sonraki inşa siparişi](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/ai.js#L1712)

Büyük haritada aynı döngü 120. aya kadar 35, 240. aya kadar 458 defa tamamlandı. Son 120 ay, tamamlanan döngülerin 423’ünü içeriyor. 458 döngünün 335’i dökümhane, 457’sinde yakın tarihli stratejik ikame kararı bulundu. Ötekinde yıkımın gerekçesi izden doğrulanamadı. 240. ayda 272 koloni ve 1.521 gemi bulunduğundan büyüyen imparatorlukların daha fazla karar vermesi sayıyı etkiliyor. Bu nedenle 1.143 fiilî sökümün içindeki payı da ölçüldü (%40,1). [Büyük kampanyanın tam karar izi](../../research/p43-audit/raw/500-16-11.json.gz)

### Savaş ve lojistikte dört karar zinciri

| Vaka | Karar, uygulama ve sonuç | Süre ve ödenen maliyet |
|---|---|---|
| Başarılı · tohum 11 | Devlet 3, 7’yi boyunduruk altına alma hedefiyle savaş açtı. 30 ve 12 gemilik filolar 3090’da sistem 82’ye çıktı, 3099’da vardılar. Kara harekâtı, gezegen 3’ün devri ve savaş hedefiyle haraçgüzar vasallık 3270’te kaydedildi. | Açılıştan siyasi sonuca 210 gün, sevkten ilk varışa 9 gün. Saldıran 14 gemi kaybetti ve 46 gemi imha etti. |
| Başarılı · kayıtlı kuşatma | 96H.9’un 66. ay girdisi p43’te açıldı. Devlet 1 hazırlık sırasında kara ordusunu satın aldı. Kalkan düştü, garnizon geriledi ve sistem 6 gezegen 0 gün 2130’da gerçek sahibini değiştirdi. İkinci 79. ay girdisinde sistem 5 gezegen 3 gün 2430’da eskortlu çıkarmayla alındı. | İlk kayıttan fethe 150 gün. Gün 2010’da 70 alaşım + 120 mineral. İkinci kayıttan fethe 60 gün. |
| Başarısız · tohum 99 | Devlet 5, 52 ve 50’yi almak istedi. Devlet 9’la 24 savaş turundan sonra cephe 1830’da barışla kapandı. İşgal listesi boştu. Ayrı bir sefer kaydında devlet 5 sistem 9’u gün 4590’da 18 ay ilerleme olmadığı gerekçesiyle yeniden değerlendirdi. | 1140 → 1830, 23 ay. Saldıran 20 gemi kaybetti ve 10 gemi imha etti. |
| Başarısız · tohum 404 | Devlet 7’nin savaş hedefleri 47, 18 ve 23’tü. Defterde hiçbir işgal oluşmadı. Savaş yorgunluğu cepheyi kapattı. Aynı dönemde devlet 7 sistem 77’ye de kuvvet sevk etti. İkinci bir cephe açık olduğu için bu rotayı tek yenilgi nedeni saymıyorum. | 3540 → 3750, 7 ay. Saldıran 11 gemi kaybetti ve 40 gemi imha etti. |

500 sistemli ayrı doğal savaşta devlet 11, devlet 10’un 483:1 gezegenini savaşın 71,5. gününde elinden aldı. Savaş 330 gün sürdü. Defterde saldıran için 16 gemi kaybı ve 44 imha var. Buna rağmen boyun eğdirme amacına karşılık savaş sonunda bir vasallık kaydı oluşmadı. Oyun tasarımında filo varışını, gezegen hâkimiyetini ve barış şartını ayrı sayaçlarda tutmanın somut örneği. [500-16-11](../../research/p43-audit/raw/500-16-11.json.gz)

İkmal ve süre kapıları `aiKnownRoute`, `aiMilitaryCampaign`, `aiDeploymentSustainable` ve `aiDisbandTick` içinde. Aday askerî hedef erişiminde süre ve ikmal alt sınırları, toplanma noktasında güç şartı var. 18 ay ölçülebilir ilerleme olmayınca yeniden değerlendirme ve 360 günlük bekleme devreye girebiliyor. Tarihsel 72. ay kaydında 24 gemilik pahalı yığının yerine bakımı karşılanabilen müfreze gönderildi. Karşılanamayan saldırı bekledi. Tohum 99’da devlet 8, 30. günde 9 gemiden 5’ini terhis etti. Enerjisi 272,9, aylığı −27,1 ve tahmini dayanımı 10,1 aydı. Barışta 18 aylık eşik ve kapasite aşımı küçülmeyi tetikleyebilir. Bunu savaş zayiatına eklemedim. [Sefer kararı](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/ai.js#L708) · [Bakım ve terhis kontrolleri](../../research/p43-audit/raw/faz96h8_campaign_cost_test.js.txt) · [Kuşatma 66](../../research/p43-audit/raw/seed11-month66-siege.save.json.gz) · [Eskort 79](../../research/p43-audit/raw/seed11-month79-escort.save.json.gz)

120. ayın dört ayrı SP kaydında toplam 112 silahlı filo gözlendi. Güncel filo ikmali 0,55 veya daha az olan 0 filo vardı. En düşük değer 0,85 idi. Hareket veya savaş ortasındaki kısa süreli ikmal düşüşleri bu dört anlık ölçümden çıkarılamaz. [Filo kimliği ve ikmal değerleri](../../research/p43-audit/raw/checkpoints.json.gz)

**Geçiş izni.** Normal diplomasi, kapalı komşudan mineral karşılığı geçiş izni isteyebiliyor. Koalisyon desteği ayrıca teklifin açacağı yolu hesaplıyor. Üç 100 sistemli doğal koşunun izlenen `aiNegotiate` tekliflerinde geçiş maddesi görülmedi. Kontrollü üç düğümlü koridorda 20 → 6 → 23 rotası kapalıydı. Teklif önizlemesi yolu açtı. Anlaşma oyun motorunda yürütülünce 100 mineral bir kez el değiştirdi, doğru yönde izin verildi ve gerçek rota açıldı. Ters yönde hak oluşmadı. Bu gözlem AI’ın sıkıştığı her doğal seferde gerekli ara devleti kendiliğinden bulduğunu kanıtlamaz. [Önizleme, ödeme ve fiilî erişim](../../research/p43-audit/raw/corridor.json) · [warSupportReach](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/diplomacy.js#L10596)

### Diplomasi, federasyon ve doktrin

Üç doğal koşuda `aiNegotiate` yolunda kaynak karşılığı 175 ittifak girişimi izlendi. Aynı teklif için bekleme kapısına dönen çağrılar da bu paydaya dahil. 41 girişim anlaşmaya dönüştü. 11. tohumda da gönüllü bir Bekçi ilişkisi kuruldu. Tohum 99’da devlet 8 gönüllü Bekçi vasallığı istedi, 420. günde 6’ya bağlandı ve daha sonra ayrılma teklifi verdi. 404’te iki gönüllü Bekçi anlaşması, 11’de savaş hedefi üzerinden zorlanan haraçgüzar ilişki kaydedildi. 99’da iki savunma önergesi gerçek federasyon gündemine girdi. Oyuncuya ücretli savaş desteği kontrollü senaryoda açık kabulle yürüdü ve tek bedel ödendi. Düşük güç veya askerî erişimsizlik ret üretti. Fetih, vaadin teslimi, ayrı barış ve vasallık hükümleri hedefli savaş testlerinde de uygulandı. [Destek çağrısı](../../research/p43-audit/raw/beta_fed_ai0_coalition_test.cjs.txt) · [Güç ve erişim](../../research/p43-audit/raw/mp_diplo5_ai_support_test.js.txt) · [Barış şartları](../../research/p43-audit/raw/beta_war_goals0_test.js.txt)

İttifak arayan diplomatik AI dalında diplomasi eğilimi 0,55’i ve etki stoku 200’ü geçmeli. Temas, yasal ittifak ve ilişki aranıyor. Bilinen ortak düşman seçim olasılığını artırıyor. Destek için bilinen cepheye ulaşılabilirlik ve bakım bütçesi kontrol ediliyor. Barış arayışının olağan dalı 300 gün sonra bilinen güç oranı 0,55’in altına, yorgunluk 55’in üstüne veya toparlanma sırasında 25’in üstüne çıktığında çalışabiliyor. Diğer zorunlu barış yolları daha erken kapanış üretebilir. Gönüllü vasallıkta koruyucu güç, mevcut tehdit, mali yük ve güven değerlendiriliyor. [İttifak](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/ai.js#L1956) · [Barış](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/ai.js#L1825) · [Destek arama](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/ai.js#L5046) · [Vasallık değerlendirmesi](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/diplomacy.js#L10471)

120. ayda üç 100 sistem dünyasında federasyon üye sayıları sırasıyla tohum 11 için 2+4, 99 için 3+4, 404 için 4+2 idi. Son gözlemde 2+5, 3+4 ve 4+3. Bu dünyalarda herkes tek federasyona girmedi. İttifak ve güven, ortak düşman ve kuruluşa uygun erişim üyeliği kolaylaştırıyor. Üyelikle birlikte eksik ittifakların kurulması genişlemeyi besleyebilir. Aynı karar yolunda büyük federasyon için genişleme indirimi ve ortak tehdit altında küçüklerin karşı blok kurma imkânı da var. Kontrollü R6 karşı bloku üretti. [Üyelik puanı ve yoğunlaşma](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/ai.js#L4893) · [Karşı blok ve güven kararları](../../research/p43-audit/raw/beta_rival_blocs0_test.js.txt)

500 sistemde 120. ay federasyonları 2, 4, 2 ve 2 üyeydi. 240. ayda üye sayıları 6, 4, 2, 2 ve yaşayan AI sayısı 16. [500 sistem kampanyası](../../research/p43-audit/raw/500-16-11.json.gz)

500 sistemli evrende 120. ayda dört ayrı federasyonun dördü de ticaret tipindeydi. Üyelerin tek blokta birleşmesi ile ayrı blokların aynı tipi seçmesi iki farklı yoğunlaşma. Kodda ticaret tipi ekonomik eğilimden puan alıyor. Tüccar ve Kriminal doktrin için +0,25, aylık enerji geliri 5’in altındaysa +0,10 ekleniyor. Dört kurucunun değerlendirme anındaki puanları kaydedilmediği için hangi bonusun belirleyici olduğu doğrulanamadı. [Tip seçimi](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/ai.js#L4790)

Aynı 120. ay kaydında, aynı devletin coğrafyası, ekonomisi, ırkı, etiği ve gözlediği güç sabit tutuldu. Yalnız seçilmiş doktrin ve türetilmiş profil yenilendi. Teknokrasi bilim federasyonunu (0,794), Militarist askerî federasyonu (1,015), Tüccar ticareti (0,836) seçti. Pasifist ve Kriminal bu bağlamda ikisi de ticareti seçti, savaş eğilimleri 0,422 ve 0,772 idi. Bunlar fiilî `aiFedType` tercihleri. Bu tek karardan bütün doktrinlerin savaş kazanma yüzdesi çıkarılamaz. [Aynı kayıt üzerinde karar puanları](../../research/p43-audit/raw/choices.json)

## Performans — hangi katman bekletiyor?

Linux x86-64, Node 24.22.3, Chrome for Testing Headless Shell 146.0.7680.66, Playwright, 844×390 yatay dokunmatik görünüm, yazılım çizimi, CPU kısıtlama katsayısı 1. MP’de gerçek p43 relay ve ayrı host/misafir Chromium süreçleri, loopback WebSocket kullanıldı. SP’de bir insan + 9/16 AI, MP’de iki insan + 9/16 AI ile kuruldu. Her tarayıcı senaryosu sırayla koştu. Node kampanyaları bu paylaşılan makinede eşzamanlı çalışabildi. Başka işlerden gelen CPU yükü özellikle duvar süreleri ve p95 üzerinde belirsizlik yaratıyor. Duvar süreleri bu ortamın ölçüsüdür. Sabit 11. tohum kullanılsa da iki insanlı MP galaksisinin tasarımı ve tarihçesi tek oyunculudan farklıdır.

3 ve 120. ay girişlerinden başlayarak önce harita yüzeyi ısındı, sonra yakınlaştırma ve diplomasi paneli ölçüldü. Üç yüzeyde dokuzar adımda host birer oyun günü ilerletilip yayın yapıldı. Harita genel görünümü 0,40, yakın görünüm yaklaşık 0,88. MP’de iki oyuncunun da 3. ve 120. ay genel haritasında bir atlamalı filo rotası gerçekten görünümdeydi. SP 120’de 100 sistemde seçili filonun rotası boştu, 500 sistemde insan filosu kalmamıştı. Bu iki sahne için rota çizimi sonucu çıkarılmadı. Ardından bir tam ay ısınma + 12 tam ay ölçüm yapıldı. Tam ay sütunu yarım günlük adımların tamamını, ay geçişi sütunu yalnız `monthTick` çağrısını içerir. MP günlük sahne yayınları ve emir ölçümleri ayrı. Tersane emirleri 12 aylık pencereyi izledi. Host duraklıyken gerçek düğmeye beş kez, her emrin satırını gördükten sonra yeniden dokunuldu. Kabul ve satır süreleri dokunma girişiminden itibaren testin gözlem süreleridir. Yardımcı, misafir aynasını bekleyip tersane panelini yenileyerek görünen satırları sayar. Sayılar ekranın kendiliğinden ilk boyandığı kesin süreyi vermez. Böylece emrin ücretini ekonomi tikinden ayırabildim.

| Rol ve sistem | Başlangıç ayı | İnsan | Tam ay ms | Ay geçişi ms | AI turu ms/devlet | Ekonomi ms | Ticaret ms | Çatışma kontrolü ms/çağrı |
|---|---|---|---|---|---|---|---|---|
| MP-100 | 3 | 2 | 310,8 / 613,4 | 124,9 / 197,4 | 3,9 / 18,1 | 13,8 / 28,8 | 0,5 / 4,8 | 0,10 / 0,30 |
| MP-100 | 120 | 2 | 580,5 / 688,8 | 393,9 / 545,3 | 9,7 / 83,8 | 14,7 / 33,1 | 2,3 / 107,2 | 0,10 / 0,20 |
| MP-500 | 3 | 2 | 2.227,1 / 3.387,1 | 460,4 / 637,6 | 11,9 / 40,3 | 33,8 / 52,9 | 1,4 / 2,2 | 0,10 / 0,30 |
| MP-500 | 120 | 2 | 4.768,3 / 5.672,7 | 1.367,2 / 1.767,7 | 34,0 / 154,9 | 48,4 / 178,3 | 3,6 / 21,9 | 0,20 / 0,50 |
| SP-100 | 3 | 1 | 212,3 / 519,4 | 101,0 / 188,5 | 3,6 / 17,9 | 10,1 / 23,4 | 0,3 / 0,9 | 0,00 / 0,30 |
| SP-100 | 120 | 1 | 372,4 / 482,2 | 226,7 / 344,8 | 14,7 / 53,3 | 13,1 / 35,4 | 2,9 / 23,5 | 0,00 / 0,20 |
| SP-500 | 3 | 1 | 1.573,2 / 2.341,9 | 350,1 / 714,0 | 10,8 / 32,2 | 27,1 / 45,7 | 1,9 / 4,3 | 0,10 / 0,40 |
| SP-500 | 120 | 1 | 5.786,2 / 7.292,9 | 2.080,6 / 2.929,7 | 33,1 / 448,4 | 48,4 / 108,1 | 3,1 / 5,3 | 0,20 / 0,50 |

Her çift ortanca / p95. p95 en yakın üst sıradır. 12 ayda p95 bu 12 örneğin en büyüğüdür. AI turu, ekonomi ve ticaret ölçümleri birbirinin içinde çalışabilir. Bunlar toplanamaz. Çatışma kontrolü çatışmasız yarım günleri de içerir. Tek bir büyük savaşın maliyeti için üst sınır vermez.

Aynı SP kontrol noktalarında PERF.2 çağrı sarmalayıcılarıyla sekiz ay daha izlendi. Aşağıda işlev başına bir tam ayda biriken kapsayıcı milisaniye var. Çok kısa ikmal ve rota çağrılarını bu şekilde toplamak, tek çağrının p95’inin sıfıra yuvarlanmasını önlüyor.

| Node SP kaydı | Otomatik keşif | Filo ikmali | Yol bulma | Devlet geliri | Ticaret bilgisi | Çatışma kontrolü |
|---|---|---|---|---|---|---|
| [100-9-11-m120](../../research/p43-audit/raw/detail-100-9-11-m120.json) | 248,5 | 196,2 | 0,2 | 317,6 | 52,4 | 20,6 |
| [100-9-11-m3](../../research/p43-audit/raw/detail-100-9-11-m3.json) | 152,2 | 52,3 | 0,6 | 57,2 | 5,1 | 13,4 |
| [500-16-11-m120](../../research/p43-audit/raw/detail-500-16-11-m120.json) | 5.836,7 | 2.325,1 | 11,3 | 2.831,1 | 234,5 | 43,5 |
| [500-16-11-m3](../../research/p43-audit/raw/detail-500-16-11-m3.json) | 2.113,1 | 273,1 | 1,4 | 240,9 | 14,4 | 19,7 |

| Aynı kayıt · ms/çağrı | İkmal p50/p95 | Rota p50/p95 | Gelir p50/p95 | Ticaret p50/p95 | Keşif p50/p95 |
|---|---|---|---|---|---|
| 100-9-11-m120 | 0,00 / 0,05 | 0,00 / 0,09 | 0,27 / 1,00 | 0,00 / 0,22 | 2,73 / 10,20 |
| 100-9-11-m3 | 0,01 / 0,09 | 0,00 / 0,21 | 0,18 / 1,33 | 0,02 / 0,07 | 1,53 / 6,49 |
| 500-16-11-m120 | 0,00 / 0,20 | 0,00 / 4,52 | 0,74 / 2,47 | 0,01 / 0,35 | 80,27 / 156,32 |
| 500-16-11-m3 | 0,02 / 0,32 | 0,23 / 0,54 | 0,53 / 1,46 | 0,03 / 0,08 | 22,66 / 64,47 |

Bu ek tablo deponun PERF.2 düzenek tanımını kullanır. Sıralı dizide ortanca ve p95 için sıfır tabanlı floor(n × p) örneği alınır. Önceki tablodaki ay toplamlarının örnek sayısı sekizdir.

### Misafire yayın, kabul ve ekranda görünme

| MP | Ay | Host yayın ms | Ayna farkı KiB | Alım → çizim ms | Misafir deserialize ms | Emir n | Kabul ms | Tersane satırı ms |
|---|---|---|---|---|---|---|---|---|
| mp-100 | 3 | 7,1 / 25,1 | 3,54 / 5,17 | 43,8 / 94,9 | 8,8 / 33,2 | 5 | 352 / 410 | 617 / 709 |
| mp-100 | 120 | 4,6 / 13,5 | 2,42 / 5,38 | 24,6 / 39,1 | 7,5 / 13,0 | 5 | 116 / 169 | 587 / 678 |
| mp-500 | 3 | 12,9 / 41,1 | 4,50 / 4,88 | 29,8 / 77,8 | 9,8 / 31,2 | 5 | 112 / 129 | 586 / 667 |
| mp-500 | 120 | 15,6 / 40,6 | 0,09 / 0,48 | 26,7 / 69,7 | 9,5 / 18,7 | 5 | 254 / 450 | 596 / 632 |

Paket boyutu WebSocket uygulama yükü ve relay öneki dahil, IP/TLS gideri hariçtir. Örnekleme bağlanma sonrasındaki dünyayı kapsar. Alım → çizim, alınan revizyon ilk kez uygulanmışken biten `View.draw` çağrısıdır. Birleştirilen ara revizyonlar ayrı çizim sayılmaz. Her kabul edilen korvette host kuyruğunun +1, misafir tersanesindeki ilgili sınıfın +1 ve masrafın gerçek fiyata eşit olduğu ayrıca doğrulandı. Onay ve dünya/satır görünümleri farklı zamanlarda tamamlanıyor. Bu ölçüm ev interneti gecikmesi içermez. [100 sistem MP ham verisi](../../research/p43-audit/raw/mp-100.json) · [500 sistem MP ham verisi](../../research/p43-audit/raw/mp-500.json)

| MP | Ay | Ayna farkı n | Diğer dünya deltası n | Diğer delta KiB p50/p95 | Üç sahnede tüm alınan yük KiB |
|---|---|---|---|---|---|
| mp-100 | 3 | 22 | 54 | 0,09 / 0,42 | 86,4 |
| mp-100 | 120 | 21 | 54 | 0,09 / 0,27 | 71,1 |
| mp-500 | 3 | 24 | 54 | 0,16 / 0,37 | 94,4 |
| mp-500 | 120 | 27 | 54 | 0,09 / 0,24 | 11,1 |

Üç sahnede fark paketleri alındı. Ayrı temiz oda katılımında ilk tam dünya aynası 100 sistemde 31.650, 500 sistemde 103.866 bayttı. Eşlik eden başlangıç paketleri 18.457 ve 32.953 bayttı. İki misafir de ilk revizyonu uyguladı. Bu iki ilk katılım örneği erken oyuna ait. [100 sistem katılımı](../../research/p43-audit/raw/join-100.json) · [500 sistem katılımı](../../research/p43-audit/raw/join-500.json)

500 sistemde 120. ay civarında MP host’un tam ayı ortanca 4.768 ms, ay geçişi 1.367 ms sürdü. Ayna yayını 15,6 ms, misafirde alınan güncellemenin çizilmesi 26,7 ms, korvet emrinin kabulü 254 ms ve tersane satırının gözlenmesi 596 ms idi. Host hesabı tek oyunculuda da belirgin. Loopback oturumunda yalnız paketi küçültmek, günler boyunca biriken simülasyon maliyetini karşılamaz. Bu satırda 16 AI ile açılan MP dünyasında sonradan 17 canlı AI gözlendi. Dört kuyruğun her birinde art arda beş kabulün her biri bir satır ve 32 alaşımlık tek ödeme oluşturdu.

### Yatay ekran, uzun JavaScript işleri ve bellek

| Rol | Ay | Genel rota haritası rAF ms | Yakın harita rAF ms | Diplomasi açık rAF ms | Çizim ms | ≥50 ms iş n · ms | JS heap MiB¹ |
|---|---|---|---|---|---|---|---|
| mp-100 host | 3 | 16,7 / 50,0 | 16,7 / 33,4 | 16,7 / 50,0 | 1,2 / 10,8 | 9 · 56 / 76 | 27,4 / 33,6 |
| mp-100 misafir | 3 | 16,7 / 33,4 | 16,7 / 33,4 | 16,7 / 33,4 | 0,8 / 6,3 | 4 · 72 / 76 | 16,4 / 23,2 |
| mp-100 host | 120 | 16,7 / 33,4 | 16,7 / 16,8 | 16,7 / 49,9 | 1,7 / 8,0 | 19 · 58 / 100 | 45,2 / 48,6 |
| mp-100 misafir | 120 | 16,7 / 16,8 | 16,7 / 16,7 | 16,7 / 16,8 | 1,2 / 5,4 | 2 · 63 / 66 | 22,5 / 30,2 |
| mp-500 host | 3 | 16,7 / 33,4 | 16,7 / 50,0 | 16,7 / 50,0 | 2,1 / 7,9 | 7 · 74 / 150 | 19,7 / 22,3 |
| mp-500 misafir | 3 | 16,7 / 33,3 | 16,7 / 33,3 | 16,7 / 33,4 | 1,4 / 6,0 | 8 · 70 / 86 | 16,6 / 24,7 |
| mp-500 host | 120 | 16,7 / 116,6 | 16,7 / 66,7 | 16,7 / 49,9 | 2,3 / 8,1 | 16 · 66 / 114 | 100,5 / 191,8 |
| mp-500 misafir | 120 | 16,7 / 33,4 | 16,7 / 33,3 | 16,7 / 16,8 | 1,4 / 5,0 | 4 · 52 / 61 | 24,2 / 32,2 |
| sp-100 tek | 3 | 16,7 / 49,9 | 16,7 / 33,4 | 16,7 / 66,6 | 1,3 / 6,0 | 18 · 62 / 113 | 15,5 / 17,9 |
| sp-100 tek | 120 | 16,7 / 66,6 | 16,7 / 66,7 | 16,7 / 50,0 | 1,7 / 14,2 | 33 · 75 / 140 | 37,5 / 57,5 |
| sp-500 tek | 3 | 16,7 / 83,3 | 16,7 / 33,4 | 16,7 / 66,6 | 1,8 / 7,3 | 26 · 66 / 186 | 16,1 / 20,2 |
| sp-500 tek | 120 | 16,7 / 66,7 | 16,7 / 100,0 | 33,4 / 200,1 | 1,7 / 4,8 | 34 · 60 / 148 | 29,9 / 45,8 |

¹ Heap için her sahne sonundaki üç örneğin p50/p95’i. Native/GPU bellek dahil değildir. Bellek sızıntısı ölçümü yapılmadı. rAF iki kare arasındaki süre, çizim ise yalnız `View.draw` içidir. Örneği olmayan uzun iş “—” ile gösterilir. Bu üç sahnede oyun günü kontrollü ilerletildi. Normal oyun döngüsünün en yüksek hız ayarındaki (hız kademesi 4, 10 oyun günü/sn) ayrı örnekleri aşağıdadır.

| Gerçek SP frame() | Gün | Ay geçişi n | rAF ms | En uzun kare ms | Uzun iş n · ms |
|---|---|---|---|---|---|
| [chromium-100-9-11-m120](../../research/p43-audit/raw/chromium-100-9-11-m120.json) | 3.628 → 3.693 | 3 | 16,7 / 16,8 | 350 | 3 · 337 / 345 |
| [chromium-500-16-11-m120](../../research/p43-audit/raw/chromium-500-16-11-m120.json) | 3.628 → 3.691 | 3 | 16,7 / 33,4 | 967 | 7 · 59 / 957 |
| [chromium-500-16-11-m3](../../research/p43-audit/raw/chromium-500-16-11-m3.json) | 118 → 181 | 3 | 16,7 / 33,3 | 250 | 4 · 248 / 263 |

Fiziksel Android / mobil GPU, gerçek LAN, canlı Render ve bu adayla uzun oturum saha tekrarı **NOT RUN**. Önceki MP raporundaki Android donması açık. Bu rapordaki kontrollü yayın sıklığı veya yazılım çizimi bir telefon FPS garantisi sağlamaz.

Normal oyun döngüsünün ilk 500 sistem geç oyun koşusunda üç ay geçişi gözlendi. Ortanca kare aralığı 66,6 ms, p95 133,3 ms ve en uzun kare 2.333 ms idi. Bu ölçü, ay boyunca kontrollü tek günlük adımlarla ölçülen harita sahnelerinden ayrıdır. [İlk geç oyun tarayıcı özeti](../../research/p43-audit/onceki-gec-oyun-olcumu.json)

### Dar performans deneyi

500 sistemin erken örnekleme profilinde `influenceAt` kendi gövdesi CPU zamanının %28,7 kadarını aldı. `explorationContext → reinforcementThreats → claimOf → influenceAt` içinde her sahipsiz sistem sorgusunda bütün galaksi tekrar geziliyordu. Uygun her düğüm için aynı sınır baskısını, özgün sırada hesaplayan deneysel sürüm, yalnız bu eşzamanlı okuma boyunca sahipli ve erişim yarıçapı olan sistem listesini çıkardı. İç içe çağrılar listeyi paylaşır, çıkışta bırakır. `borderPressure` gibi kayıt alanına yazabilen hesapları, görünürlük kapılarını ve eşitlik sırasını korur. [influenceAt](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/diplomacy.js#L41) · [explorationContext](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/main.js#L4548) · [reinforcementThreats](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/main.js#L5749)

| Kayıt | Ortam | p43 tam ay ms | Pilot tam ay ms | Ortanca farkı | p95 farkı |
|---|---|---|---|---|---|
| 100-9-11-m120 | Node | 796 / 1.019 | 842 / 1.171 | 5,8% | 15,0% |
| 100-9-11-m120 | Chromium | 304 / 771 | 325 / 391 | 6,7% | -49,3% |
| 500-16-11-m3 | Node | 4.378 / 5.767 | 1.284 / 1.955 | -70,7% | -66,1% |
| 500-16-11-m3 | Chromium | 1.239 / 1.850 | 456 / 688 | -63,2% | -62,8% |
| 500-16-11-m120 | Chromium · ilk koşu | 5.493 / 6.290 | 4.647 / 5.161 | -15,4% | -17,9% |
| 500-16-11-m120 | Chromium · tekrar | 2.395 / 2.572 | 2.100 / 2.213 | -12,3% | -13,9% |
| 500-16-11-m120 | Node | 4.733 / 5.107 | 3.351 / 3.698 | -29,2% | -27,6% |

120. ay Node örneklemesinde doğrudan CPU payları keşif bağlamı için %22,9, sınır etkisi için %18,0 ve takviye tehdidi için %11,3 idi. İç içe çağrıların toplam süresi yerine burada yalnız her işlevin kendi gövdesi sayıldı. [Geç oyun V8 örnekleri](../../research/p43-audit/raw/cpu-500-16-11-m120.json) · [Erken oyun V8 örnekleri](../../research/p43-audit/raw/cpu-500-16-11-m3.json)

Sıra kontrol–pilot–pilot–kontrol. Her kol yeni dünya kopyası veya tarayıcı bağlamı, bir ay ısınma ve 10 örnek kullandı. Her ortam ve kayıt için kol başına 20 tam ay zamanlaması var. İki tekrar aynı 10 deterministik ayı izledi. İlk koşu ile daha sonraki koşunun mutlak süreleri paylaşımlı makine yüküne duyarlıdır. Performans farkı her koşunun kendi denetimiyle hesaplandı. Her ay gün, RNG ve serileştirilmiş Save8’in SHA-256 değeri karşılaştırıldı. Çiftlerin aynı içerikte kalması ile hız kazanımı ayrı koşullardır. Pilot için uçtan uca MP eşdeğerliği henüz **NOT RUN**. [Node 100-9-11-m120](../../research/p43-audit/raw/pilot-100-9-11-m120.json) · [Chromium 100-9-11-m120](../../research/p43-audit/raw/chromium-100-9-11-m120.json) · [Node 500-16-11-m3](../../research/p43-audit/raw/pilot-500-16-11-m3.json) · [Chromium 500-16-11-m3](../../research/p43-audit/raw/chromium-500-16-11-m3.json)

İlk geç oyun koşusunda her kolda 20 tam ay ölçüldü ve eşleştirilen gün, Save8 SHA-256 ve RNG değerleri aynıydı. Çalışma alanı yenilenince bu koşudan kalan toplu değerler ayrı dosyaya aktarıldı. Aynı girdinin bağımsız tekrarında kontrol p95’i 2.572 ms, pilot p95’i 2.213 ms oldu (-13,9%). Tekrarın 40 aylık ham zaman ve hash kaydı saklandı. [Tekrar · ham aylar, kareler, Save8 ve RNG](../../research/p43-audit/raw/chromium-500-16-11-m120.json) [İlk koşunun özet kaydı](../../research/p43-audit/onceki-gec-oyun-olcumu.json)

## İlk iki geliştirme işi ve kabul sırası

**1. Performans — büyük haritada sınır etkisi aramasını daralt.** Önce 500 sistemde, keşif ve takviye yardımcılarının salt okunur çağrı ömründe pilotu ürün koduna taşı. Her sistem için etkili sahibi gün boyunca saklayan bir önbelleğe ihtiyaç yok. 100 sistemde pilotu açma kararını küçük haritanın kendi profilinden ver. 100 sistemde ortanca için %5 üst sınırını ve 500 sistemde iki ayrı kayıt için %20 p95 hedefini birlikte uygula. İki 120. ay koşusunda p95 iyileşmesi %17,9 ve %13,9. Pilot bugünkü haliyle geç oyun yayın eşiğini karşılamıyor.

**Kabul.** Aynı 3. ve 120. ay Save8’lerinden gerçek Chromium’da en az dört dengeli AB/BA çiftiyle 500 sistem tam ay p95’ini en az %20 azalt. 100 sistemde ortanca ve p95 gerilemesi en çok %5 olsun. Aynı makinede tek ölçüm işi koşsun. Ay ay Save8 baytları, RNG, AI emir sırası, hedefler ve ödemeler aynı olsun. 11/99/404 tohumlarını 120/240’a veya doğal sona kadar ilerlet. İlk değişikliği bulmak için özellikle 30→31. ayı, sahiplik devrini, aynı gün geri almayı ve kayıt yüklemeyi sına. MP’de host + iki misafirle yayımlanan görünür durum/ayna içeriğini, yetkili son revizyonu, tek sipariş ve tek kesintiyi karşılaştır. Taşıma zamanı veya rastgele ağ kimliği yerine aynı mantıksal dünya adımını eşleştir. Kayıt hashinden alan temizleme, görünmeyen veriyi misafire ekleme veya düşünme sıklığını azaltma kabul kapsamında yok.

**2. AI — slot açmak için yıkmadan önce, sıradaki üretilebilir binayı doğrula.** `aiTurn → aiEconomicOrder → aiDemolitionChoice → queueDemolish` yolunda, seçilen ikame binanın neden istendiğini, ödeme gücünü ve boşalacak slotta gerçekten ilk uygulanabilir tercih olup olmadığını mevcut bütçe ve kuyrukla denetle. Yıkılacak bina ilk gerçek ihtiyaç olarak geri geliyorsa o kolonide stratejik yıkımı ertele. Gelir şoku, savaş ve ayrı kriz kurtarma yıkımı kendi gerekçeleriyle çalışabilsin. İlk deney yalnız bu karar dalına müdahale etsin. 96H.11’de elenen genel ağırlık değişikliği bu ölçütü karşılamamıştı. [aiDemolitionChoice](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/ai.js#L465) · [Ödeme ve kuyruk](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/economy.js#L1122) · [Hurda iadesi](https://github.com/sarsiss12-dot/Star/blob/54a52555c699d82507f6285580577571d4200380/economy.js#L1200)

**Kabul.** Aynı tohumlarda, aynı devlet ve kolonide tamamlanmış sökümden sonraki ilk ücretli işin altı ay içinde yine aynı tür olduğu ve tamamlandığı döngüleri say. Başlangıç 11/99/404 için 130/99/32. Toplam 261 → en çok 182 (en az %30 düşüş) ve net mineral maliyeti en az %25 aşağı, hiçbir tohumda artış yok. Tohum 11 sistem 27, 99 sistem 82, 404 sistem 1 dökümhane örneklerini tek kararda tekrar oynat. Kullanılabilir üretim artışını 6/12/24 ayda alaşım geliri, fiilen teslim edilen gemi ve koloninin hedeflenen ikame binayı bitirme oranıyla ölç. Teknoloji, ticaret teslimatı ve savaş hedefi başarısı için her tohumda kontrol bandı oluştur. Ticaret ve fiilî askerî güç kontrol medyanının %95’inin altına düşmesin, kritik devlet-ay sayısı artmasın. Kararı tetiklemeyen aynı-kayıt koşuları bayt/RNG eşitliği vermeli. Kararın değiştiği dünyalarda ilk fark gerekçeli olmalı, kayıt yükleme sonrası tekrar aynı kararı ve ödemeyi vermeli. 500 sistemlik 240. ayı bağımsız kontrol olarak kullan. Kontrolün 458 döngü ve 58.209 net mineral maliyetine karşı sonucu yaz ve 1.143 toplam söküm içindeki oranı karşılaştır. 404 devlet 2’nin kronik açığını ayrıca izle. Yıkımı azaltmanın onu tek başına iyileştireceğini varsayma.

İlk iş, büyük haritada tek bir karenin iki saniyeyi aşabildiği simülasyon yükünü hedefliyor. Aynı kayıtla ölçülebilmesi, sonraki AI deneylerinin süresini ve sonuçlarını da karşılaştırılabilir tutar. 100 sistemlik standart oyunda en doğrudan oynanış faydasını ikinci işten bekliyorum. İkinci iş üç tohumda da gerçek, tekrarlanan bir kaynak kaybına dokunuyor. İki değişikliği ayrı adaylarda ölçmek, AI davranışındaki bilinçli farkı performans eşdeğerliğinden ayırır.

500 sistem / 16 AI, tohum 11 kampanyası ikinci bir Node sürecinde yeniden başlatıldı. Üretim betikleri ve gözlem sırası aynıydı. İkinci test süreci oyun betiklerini standart Node global nesnesinde çalıştırdı. İlk 120 ayın 5.514 olayının tamamı, başlangıç dahil 121 aylık durum ve 0/3/30/60/120. ay Save8 hashleri ile RNG değerleri eşleşti. 120. ay girdisinin SHA-256 değeri `30b15d102f8faccf2307a8fbcaceca5117b6b380504e5802877ddbfb54965164`. [Sıkıştırılmış Save8](../../research/p43-audit/fixtures/500-16-11-m120.save.gz) · [Bağımsız tekrar karşılaştırması](../../research/p43-audit/raw/kampanya-tekrar-kontrolu.json)

## Doğrulama ve tekrar üretim

Kampanya, tarayıcı, finansal sonuç ve profil düzenekleri ile ham çıktılar araştırma dalında. Kontrol dünyaları `campaign.cjs` ile aynı tohum ve boyuttan üretilir. `choices.cjs` ve `checkpoints.cjs` hesaplamaları atılabilir kopyalarda yapar. `browser.cjs mp 500` gerçek odayı, `browser.cjs sp 500` kontrol kaydını kullanır. `pilot.cjs` ve `chromium-pilot.cjs` kontrol–pilot dizilerini, `summarize.py` sonuç tablolarını üretir. Büyük kayıtları üretmek için çalıştırma örneği `node research/p43-audit/campaign.cjs 500 16 11 240`. Tarayıcı için Playwright ve çalışır bir Chromium yürütülebiliri gerekir. Bu araştırmanın kodunda yeni oyun, Render dağıtımı veya PWA sürümü yok. [Düzenekler](../../research/p43-audit) · [Ham dosyalar](../../research/p43-audit/raw) · [Makinece okunur sonuç özeti](../../research/p43-audit/raw/summary.json)

Hedefli testler. Federasyon kampanyası 3/3, koalisyon 8/8, rakip bloklar 10/10, savaş koalisyonu 7/7, savaş hedefleri 13/13, AI destek 5/5, doktrin 43/43 geçti. 96H.8 sefer maliyeti 11 PASS / 1 FAIL. Başarısız kontrol, p43 `ai.js` dosyasının yalnızca 96H.7.1 → 96H.8 farklarını içerdiğine ilişkin eski sabit hash beklentisiydi. Beklenti gevşetilmedi. Doğal 24 aylık filo koruma ve bakım testleri aynı dosyada geçti. Önceki oturumun çalışma alanı devam sırasında erişilemez hale geldiği için ana ölçümler doğrulanmış p43’ten yeniden üretildi. Ham dosyalar koşu bazında sunulmuştur. İlk geç oyun Chromium denemesinin yalnız toplu değerleri korunmuştur.

Ham ölçüm dosyalarının [SHA-256 listesi](../../research/p43-audit/SHA256SUMS) yeniden doğrulama için eklendi.
