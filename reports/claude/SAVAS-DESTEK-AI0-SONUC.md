# SAVAŞ-DESTEK-AI.0 — Sonuç raporu

Tarih: 24 Kasım 2026 · Dal `claude/stars-savas-destek-ai0` · taban `claude/stars-ticaret-son-eksikler0` @ `5aefe56` (p54, PR #79)
Yayın adayı: **96h10p55 / stars-v96h10p55 / MP.8.9b54** · Save8 v8 (şema değişmedi, yeni alan yok) · MP paket 4 · protokol 1.
Kullanıcı fiziksel test yapamıyor; bütün kabul otomatik (Node + gerçek Chromium + üretim relay süreci + TLS vekili).
Fiziksel Android, gerçek uzak internet, LAN ve canlı Render: **NOT RUN**.

Fazın amacı daha fazla savaş değil: daha akıllı katılım kararları, kendi savaşında gerçekçi yardım isteği, oyuncu için kolay destek çağrısı.
Ölçülen sonuç: doğal kampanyalarda savaş sayısı artmadı (8 yapılandırmanın 6'sında aday p54 ile 120/240 ay bayt bayt aynı);
kontrollü vakalarda p54'ün üç gerçek kusuru giderildi; oyuncu tarafında iki UI kusuru (biri p54'ten kalma) düzeltildi.

## 1. Başlangıç ve bitiş

- Başlangıç HEAD: `5aefe561e790d6b2adc18b7958ec08d3a63fac82` (p54 / MP.8.9b53). Kontrol kökü: `git archive 5aefe56` (sabit kopya).
- Bu fazın commit'leri: `685e996`, `87e5170`, `e2d62e6`, `c825425`, `6ae3550`, `d95a610` (p55 sürüm kimlikleri, ZIP) (raporun kendi commit'i son yanıtta).
- Aday kökü (kampanyalar için sabit kopya): `c825425` ağacı (`cand3`).

## 2. Değiştirilen dosyalar

Çalışma zamanı (3 dosya, +89/−14 satır):
- `ai.js`:
  - `aiRespond` katılım denetimi artık `aiWarJoinGate` üzerinden;
  - yeni `aiWarJoinGate` (kapılar) ve `aiWarHelpAsk` (yardım isteme);
  - `aiTurn` çağrı sırası: `aiStrategicDiplomacy → aiWarHelpAsk → aiCoalitionDiplomacy`.
- `diplomacy.js`:
  - `itemValue` `warJoin`: doktrin `personaKey`'den okunur; savunma ve saldırı ayrı fiyatlanır; müttefik / federasyon sadakati dürüstlükle ölçeklenir;
  - `warSupportGate`: Arındırıcı kilidi (`diploBlocked`).
- `archive-ui.js` (Savaş Merkezi):
  - aday önceliği ve gerekçe etiketleri;
  - toplu destek `askAll`;
  - kabul eden aday listede kalır;
  - yeniden çizim `.mbox` çerçevesinin içine (`WarCenterUI.box`).
- Sürüm: `main.js` (`BUILD_ID`), `sw.js` (`CACHE`), `RELEASE-MANIFEST.json`; MP sürüm işareti `research/mp1/client/view.js`, `research/mp1/server/relay.js`; `research/mp0/mp-core.js` p55 paket kabulü (p41–p54).

MP (yalnız istemci):
- `research/mp6/client/guest-stars.js`:
  - `warCenterAskAll` misafir eylem kapısında;
  - yüzey taşıma listesine `#modal>.mbox` eklendi.

Testler ve araçlar:
- Yeni testler:
  - `tests/savas_destek_ai0_test.js` (21 vaka);
  - `tests/savas_destek_ai0_mp_test.js` (5);
  - `tests/savas_destek_ai0_equivalence_test.js` (4);
  - `tests/browser-savas-destek-ai0-sp.cjs` (3 × 3 çözünürlük);
  - `tests/helpers/savas-destek-ai0-mp.cjs` (`MP8_SCEN=SD`).
- `tests/helpers/war-coalition0-mp.cjs`: Q fikstürü düzeltildi (§20).
- Araçlar `research/savas-destek-ai0/`:
  - `probe.cjs`, `katki.cjs`, `camp.cjs`, `diag.cjs`, `ozet.cjs`, `war-dense-save.cjs`.

## 3. Faz A — envanter (15 mekanizma, p54'te gerçek davranış)

| # | Mekanizma (yer) | p54'te gerçek davranış (ölçülen) | Kusur | Yapılan |
|---|---|---|---|---|
| 1 | `warSupportGate` (diplomacy.js) | temas, taraf olma, çakışan savaş, ittifak / NAP, barış sonrası süre, `canPromiseWarOn`, erişim | Arındırıcı kilidini denetlemiyordu: Arındırıcı aday kartta "uygun", gönderimde `dealQuote` reddi (MP8 SD ilk koşu) | `diploBlocked` denetimi (S22, SD D1) |
| 2 | `warSupportReach` | silahlı filo yolu, geçiş / kapı | — | değişmedi; kapıda kullanılıyor |
| 3 | `itemValue` warJoin | risk + yorgunluk + savaş sayısı; doktrin çarpanı `e.mizac`'tan | AI'da `e.mizac` tanımsız → doktrin çarpanı HİÇ uygulanmıyordu (S20: p54 dört doktrinde 248/248/248/248) | `personaKey`; savunma / saldırı ayrımı; sadakat × dürüstlük (S2, S2b, S20, S21) |
| 4 | `aiRespond` warJoin denetimi | yalnız güç + erişim | ekonomik krizdeki AI ücretli katılımı kabul ediyordu (S4 p54: 300 alaşımla `kabul`); ikinci cephe / bütçe / başkent tehdidi yoktu (S10 p54: kabul) | `aiWarJoinGate` (S4, S10, S13, M3) |
| 5 | Yardım isteme (aktif savaşta) | YOK: koalisyon dışı kendi savaşında AI hiç destek istemiyordu | eksik mekanizma | `aiWarHelpAsk` (E1–E4, S14, S18, M1, M2, M5, SD D2) |
| 6 | `aiCoalitionDiplomacy` support-opportunity | yalnız `aiCoalitionSafe` (kendi savaşı yok) ve sponsor müttefikken | kampanyada hiç tetiklenmedi (tanı §9) | değiştirilmedi (gerekçe §9) |
| 7 | Koalisyon hazırlığı davetleri | WAR-COALITION.0 akışı | — | değişmedi; kapı yeni kurallarla (Q) |
| 8 | `warCoalitionTick` | yalnız koalisyon kök cepheleri, %5 mineral | — | değişmedi |
| 9 | Savaş Merkezi destek ekranı | aday listesi id sırası, etiket: ilişki / müttefik / oyuncu | öncelik yok; toplu davet yok; kabul eden aday listeden düşüyordu; yeniden çizimde pencere çerçevesi düşüyordu (başlık ve kartlar ekranın iki yanına dağılıyordu) | B1, W1–W3, SD D1 |
| 10 | Müzakere masası "Şartlı Teklif…" | kaynak / geçiş / teknoloji / toprak vaadi `dealQuote` ile | — | değişmedi |
| 11 | `executeDeal` warJoin | aynı sefere `declareWar(…,{kind:'promise'})`, ödeme tek işlemde | — | doğrulandı (E1, M2, M5, SD D1) |
| 12 | Toprak vaadi `warPromiseGate` | açık vaatteki sistem ikinci kez vaat edilemez | — | doğrulandı (I1) |
| 13 | Savaş sonu bekleyen teklif | `dealQuote` kaynak cephe bitince reddeder | — | doğrulandı (S12) |
| 14 | Katılan AI'nın askerî davranışı (`aiMilitaryCampaign`) | tehdit altındaki müttefiki savunur; hedef çok güçlüyse toplanma noktasında bekler | yok (p53 / aday birebir aynı, `katki.cjs`) | değiştirilmedi (§10) |
| 15 | Federasyon / vasal otomatik katılım (`fedDefend`, vasal `declareWar(kind:'vassal')`) | üye / vasal kendiliğinden katılır | vasal cepheleri kampanyada çoğunlukla pasif (§10) | değiştirilmedi; bulgu kaydedildi |

## 4. p54'te doğrulanan kusurlar (önce ölçüldü, sonra düzeltildi)

1. **Doktrin AI'da uygulanmıyordu** (S20): p54'te militarist / pasifist / tüccar / yayılmacı aynı koşulda 248.
   - Aday: saldırıda militarist 211, pasifist 397.
   - Savunmada pasifist 143 (müttefik).
2. **Kriz içindeki AI ücretli katılımı kabul ediyordu** (S4): p54'te `kabul`, aday `red` ("Ekonomimiz kriz içinde").
3. **İkinci cephe denetimi yoktu** (S10): p54 `kabul`, aday `red` ("Süren savaşımız kuvvetimizi bağlıyor").
4. **Aktif savaşta yardım istenmiyordu** (E1): p54'te işlev yok.
5. **Arındırıcı aday Savaş Merkezi'nde "uygun"** görünüyordu (MP8 SD ilk koşu: "Gönderilemedi: Doktrin bu devletle her türlü anlaşmayı yasaklıyor").
6. **Kabul eden aday listeden düşüyordu.** Sonuç ("Kabul edildi") hiç görünmüyordu (SD ilk koşu).
7. **Savaş Merkezi yeniden çiziminde pencere çerçevesi düşüyordu** (W1–W2 ekran görüntüsü; p54 W1/W2 FAIL).

## 5. Faz B — oyuncu: SAVAŞA DESTEK ÇAĞIR

Akış: Savaş Merkezi → cephe → ASKERÎ DESTEK İSTE.

Adaylar şu sırayla listelenir:
- uygun olanlar önde;
- müttefik > federasyon ortağı > dost (ilişki ≥40) > "düşmanla arası kötü";
- sonuncusu yalnız istihbarat ≥2 ile bilinen ilişkiden gelir, gizli ekonomi okunmaz.

Her kartta:
- ilişki ve etiketler;
- uygunluk ya da gerçek ret nedeni (`warSupportGate` / misafirde host `warSupportList`);
- ⚔ Destek İste ve Şartlı Teklif… (kaynak, geçiş, teknoloji, toprak vaadi aynı masada `dealQuote` ile).

Toplu davet:
- birden fazla uygun aday varsa "⚔ UYGUN n ADAYA DESTEK İSTE" görünür;
- her uygun ve bu cephe için henüz sorulmamış adaya AYRI karşılıksız `warJoin` gider, her biri kendi kararını verir;
- ikinci basış teklif üretmez; bekleyen, kabul, ret ya da karşı teklif durumundaki aday toplu davete yeniden girmez.

Hızlı destek her zaman mevcut cepheye katılımdır (`warJoin {front,target}`), yeni ilan değildir; aynı sefer W2, E1, M2 ve SD D1'de ölçüldü.

Kabul eden aday "✔ Cepheye katıldı · Kabul edildi" satırıyla listede kalır.

Mobil test, `browser-savas-destek-ai0-sp.cjs`, dokunmatik, yatay 800×360 / 844×390 / 901×411: **9/0** (p54 0/9).
- W1: sıralama, etiket, taşma yok, cephe ayrıntısı `.mbox` içinde.
- W2: toplu davet (aday başına tek teklif; kabul = gerçek katılım, aynı sefer).
- W3: tekrar yok; oyuncu kaynağı değişmez.

Yeni büyük pencere eklenmedi; mevcut destek penceresi genişletildi. Ekran görüntüleri: `evidence/savas-destek-ai0/browser-sp/`.

## 6. Faz C — AI katılım kararı

`aiWarJoinGate(ai, enemy, sender, give)` her `warJoin` yanıtında (`aiRespond`) çalışır. Yalnız AI'nın kendi bildiği bilgiyi kullanır: `aiKnownPower`, kendi ekonomisi, gözlenen tehdit.

Ret nedenleri sırasıyla:
1. bilinen güç veya askerî erişim yetersiz (p54'te de vardı);
2. ekonomik kriz;
3. ≥2 süren savaş ya da yorgunluk >45;
4. süren savaş gücü bağlıyor (kendi gücü < düşmanlar × 1,2);
5. sefer bütçesi (`aiWarBudget`);
6. başkent tehdidi.

Karar türleri:
- koşulsuz kabul (yeterli değer);
- kaynakla kabul;
- geçişle kabul (geçiş `give` içinde erişimi açıyorsa kapı geçer);
- toprak vaadiyle kabul (`landPromise` değeri);
- karşı teklif (`karsi`, eksik değer kadar);
- bekleme (insan alıcıda `bekle`);
- ret.

İntihar katılımı yok (S5, S6). Sadakat savunmada riski haklı kılabilir: müttefik / federasyon savunmasında maliyet ×0,75–0,8, dürüstlükle ±0,1.

Kontrollü sonuçlar (`probe.cjs`, aday / p54):

| Vaka | p54 (ücretsiz / 300 alaşım / maliyet) | Aday |
|---|---|---|
| S1 müttefik savunması | karşı / karşı / 191 | karşı / **kabul** / 143 |
| S2 pasifist saldırı | karşı / karşı / 248 | karşı / karşı / 397 |
| S2b pasifist savunma | 191 karşı | **kabul** / 143 |
| S2c militarist saldırı | 248 | 211 |
| S4 kriz | karşı / **kabul** | **red** (kriz) |
| S5 düşman çok güçlü | red | red |
| S6 erişim yok | red | red |
| S10 ikinci cephe | karşı / kabul | **red** |
| S20 tüccar | 191 | 165, kabul |

## 7. Faz D — doktrin farkları

Doktrin çarpanları:
- militarist: saldırı ×0,85, savunma ×0,9;
- pasifist: saldırı ×1,6, savunma ×1;
- tüccar: ×1,15 (ödemeye daha duyarlı; değer karşılandığında kabul);
- yayılmacı ve diğerleri: ×1.

Sadakat (dürüstlük): dürüst müttefik savunmaya daha ucuz katılır, sahtekâr daha pahalı (S21: dürüst < sahtekâr).

Farklar ölçülebilir sonuç üretir:
- S2: pasifist saldırı 397 > savunma 191 × 1,8;
- militarist saldırı 211 < pasifist 397 × 0,7;
- S2b: pasifist 300 alaşımla saldırıya katılmaz, savunmaya katılır;
- S20: p54'te 4 doktrin aynı değeri veriyordu, adayda farklı.

Arındırıcı kilidi korundu ve genişletildi (S22, SD D1): Arındırıcı ne destek ister (`aiWarHelpAsk` havuzundan çıkarılır) ne aday olur.

Kampanyada doktrin bölünmesi: AI→AI `warJoin` yanıtı yalnız 100/9 tohum 404'te görüldü (tüccar ret ×1, yayılmacı ret ×1). Kampanya ölçeğinde doktrin farkı istatistiği için örnek yok (§12).

## 8. Faz E — AI'nın aktif savaşta destek istemesi

`aiWarHelpAsk(e)` ayda bir çalışır (`aiTurn`).

Önkoşullar:
- AI, vasal değil, Arındırıcı değil;
- koalisyon dışı, kendi kök cephesi var;
- düşman gerçek devlet.

Zorlanma ölçütü (AI'nın bildiği): bilinen düşman gücü > kendi × 0,9, ya da kayıp > imha + 2, ya da yorgunluk ≥25.

Aday havuzu:
- temaslı, düşmanla savaşta olmadığı bilinen, Arındırıcı değil;
- müttefik / aynı federasyon / ilişki ≥40;
- `warSupportGate` uygun.

Sıra: müttefik 3 + federasyon 2 + dost 1 puan, sonra bilinen güç.

Ödeme gerçek stoktan yapılır:
- alaşım ≥400 ise alaşım, değilse mineral;
- (stok − 200) × %6, en çok 300;
- <20 ise ödemesiz istek.

Spam koruması:
- ayda en çok 1 istek (`aiTalk.warHelp` 30 gün);
- aynı cephe + aday için 180 gün;
- gerekçeli ret sonrası 360 gün. Kampanyada 180 günde tekrarlanan istekler ölçülünce eklendi; tohum 404'te istekler 6'dan 5'e indi.
- Bekleme kayıtları mevcut Save8 alanı `aiTalk`'ta tutulur; yeni şema alanı yok (S18: yükleme sonrası aynı ay ikinci istek yok).

İnsan alıcı:
- SP'de `UI.aiOffer` gelen kutusu kartı (S14);
- MP'de `aiToHuman` → misafirin teklif kutusu (M1, SD D2);
- insan adına karar ya da katılım YOK.

Kampanya sıklığı: 8 yapılandırmanın 2'sinde istek oldu.
- 100/9 tohum 404: 5 istek, 3 aday; 2'si AI'dan "güç / erişim yetersiz" reddi, 3'ü pasif oyuncu devlet 0'a bekleyen kart.
- 100/9 çalkantılı tohum 99: 1 istek.
- Hiçbiri katılıma dönüşmedi: adaylar ya ulaşamıyordu ya da düşman çok güçlüydü.

## 9. Faz F — gönüllü destek (support-opportunity)

Kampanya: 16 kontrol + aday koşusunun hiçbirinde tetiklenmedi (`opp` = 0).

Tanı (`diag.cjs`, 100/9 tohum 11, 128 savaş-ay):
- potansiyel destekçi × savaş-ay olaylarının 544'ünde "sponsor müttefik değil";
- 352'sinde `aiCoalitionSafe` değil (yorgunluk 188, toparlanma 164);
- aday havuzunda 982 / 1024 "temas yok".

Doğal oyunda AI'lar arası temas çok seyrek; savaşlar çoğunlukla temaslı tek komşu arasında çıkıyor (tohum 11'de düşman Arındırıcı'ydı → kimse destek istenemez, kilit doğru çalışıyor).

Savunma / saldırı ayrımı:
- support-opportunity yalnız müttefikin savaşında ve düşmanla ilişki < −25'te açılır;
- `itemValue` artık savunma desteğini daha ucuz fiyatlıyor.

Mekanizma değiştirilmedi: tetiklenmeme nedeni kurallar değil temas yoğunluğu. Temas / bilgi kuralını gevşetmek gizli bilgi kullanmak ya da yapay ilişki demek olurdu (yasak).

## 10. Faz G / H — erişim ve gerçek katkı

Erişim:
- `warSupportReach` silahlı filonun bilinen düşman sistemine gerçek yolunu ister;
- ticaret limanı transit izni askerî geçiş sayılmaz (ayrı `portTransit`; `warSupportReach` yalnız `passage`, kapı ve `canEnter` okur);
- erişim kabulde yeniden doğrulanır (`aiWarJoinGate` → `warSupportReach(ai,enemy,sender,give)`), ışınlanma yok.

Katılan AI'nın gerçek katkısı (`katki.cjs`, 6 ay, p53 ↔ aday birebir aynı):
- tehdit yokken AI ya evde kalır (erişim yok) ya 1 gemi imha edip hedef çok güçlü olduğu için toplanma noktasına döner;
- X müttefik başkentine baskın yapınca katılan C'nin filoları müttefik başkentine gider (2 imha).

Mevcut askerî AI orantılı davranıyor; ayrı filo motoru yazılmadı.

Kampanya katkı metrikleri (katılınan cepheler, `joinedFronts`):
- 100/9 tohum 404'te 3 vasal cephesi: imha 0, kayıp 0, sistem 0 (pasif) — p54'te de aynı;
- çalkantılı tohum 99'da 2 cephe: imha 4, kayıp 1, sistem 1.

Bulgu: vasal yoluyla çekilen katılımlar çoğunlukla pasif. Bu fazın kapsamı dışı (vasal savaş davranışı); FED-AI-SİYASET.0 adayı.

## 11. Faz I — ödeme, toprak vaadi, warOn / warJoin, savaş sonu

- Ödeme bir kez: E1 (S'nin ödediği = C'nin aldığı), M2 (aynı / yeni cid ile ikinci kabul yeni etki üretmez), M5 (MP paketi → yeni host'ta bir kez), SD D1 (her adaya tek teklif).
- Çift toprak vaadi: `warPromiseGate` açık vaatteki sistemi ikinci katılımcıya vermez (I1: "Bu sistem zaten başka bir vaatte"; ödeme / katılım yok).
- warOn ve warJoin ayrımı:
  - destek isteği her zaman `warJoin {front,target}` (mevcut cephe, aynı sefer);
  - genel `warOn` (yeni ilan sözü) bu fazda kullanılmadı;
  - warOn / warPledge kuralları değişmedi (`mp_waron0_test` 9/0, MP8 V 7/0).
- Savaş sonu: bekleyen katılım teklifi geçersiz, ödeme / savaş yok (S12). `mp-core dipSweep` MP'de aynı.

## 12. Faz J — federasyon

Federasyon ortağı aday önceliğinde 2. sırada; savunma sadakati ×0,8 ± dürüstlük.

Federasyon kartopu yok. Kampanya federasyon boyutları aday = p54:
- 100/9: 4/2, 3/4, 5/3, 2/5, 5/3, 4/4;
- 500/16: 4/2/2/2, 5/3/2.

FED-AI-SİYASET.0 (federasyon AI siyaseti) başlanmadı.

## 13. Faz K — kontrollü vakalar

`tests/savas_destek_ai0_test.js`: aday **21/0**, p54 **5/16**. p54'te geçen beş vaka var olan davranıştır: S5, S6, S12, S17, I1.

| Vaka | Ne sınar |
|---|---|
| S1 | müttefik savunması, 300 alaşımla kabul, ücretsizde karşı teklif |
| S2 / S2b / S20 / S21 | doktrin ve sadakat farkları |
| S4 / S10 / S13 | kriz, ikinci cephe, insan → AI kapıları |
| S5 / S6 | güç, erişim |
| S12 | savaş sonu |
| S14 | AI → insan kutusu |
| S17 | zaten taraf |
| S18 | Save8 bekleme |
| S22 | Arındırıcı |
| E1–E4 | yardım isteği, katılım, tek ödeme, bekleme |
| B1 | UI sıralaması ve toplu davet |
| I1 | toprak vaadi tekrarı |

Tanılar şeffaf: `aiPlanEvent(e,'war-help-ask',{front, other, payment, result, applied, why})` → `e.aiStrategy.history` (mevcut alan). Ret gerekçesi `aiRespond.why`'de.

## 14. Faz L — kampanyalar (p54 ↔ aday, sabit kopya kökler)

Araç `research/savas-destek-ai0/camp.cjs`, özet `ozet.cjs`, ham veri `evidence/savas-destek-ai0/kampanya/`.

| Yapılandırma | İlk ayrışma | Savaş (p54 / aday) | Yardım isteği | warJoin anlaşması | Ölen devlet | Koloni kaybı | Federasyonlar |
|---|---|---|---|---|---|---|---|
| 100/9 t11, 240 ay | yok (birebir) | 3 / 3 | 0 | 0 | 1 / 1 | 1 / 1 | 4/2 |
| 100/9 t99, 240 ay | yok | 1 / 1 | 0 | 0 | 0 | 0 | 3/4 |
| 100/9 t404, 240 ay | 161. ay | 8 / 8 | 5 (3 aday) | 0 | 1 / 1 | 0 | 5/3 |
| 100/9 çalkantılı t11 | yok | 1 / 1 | 0 | 0 | 0 | 0 | 5/3 |
| 100/9 çalkantılı t99 | 212. ay | 5 / 5 | 1 | 0 | 0 | 0 | 2/5 |
| 100/9 çalkantılı t404 | yok | 4 / 4 | 0 | 0 | 1 / 1 | 1 / 1 | 4/4 |
| 500/16 t11, 120 ay | yok | 3 / 3 | 0 | 0 | 0 | 0 | 4/2/2/2 |
| 500/16 t23, 120 ay | yok | 2 / 2 | 0 | 0 | 0 | 0 | 5/3/2 |

Plasebo bandı (p54 + ayrışma gününde tek `rnd()`):
- t404: savaş 8 → 5, vasal cephe 3 → 2;
- çalkantılı t99: savaş 5 → 3.

Aday, iki ayrışan yapılandırmada da p54 değerlerinde kaldı. Fark bandın içinde; aday savaş, ölüm ya da koloni kaybı üretmedi.

Başarı ölçütü "daha fazla savaş" değil:
- gereksiz savaş yok;
- yanlış katılım yok (krizdeki AI artık katılmıyor);
- istekler gerçekçi ödemeli ve seyrek.

Doğal oyunda destek durumları nadir oluşuyor; davranış farkı esas olarak kontrollü vakalarda ve oyuncu akışında görünür.

Yapay bonus yok: bedava filo, kaynak, gizli bilgi, kaldırılmış savaş yasağı, elle sonuç yazılmadı. Kampanya betiği dünyaya yazmaz; plasebo kolu bilerek tek `rnd()` çeker.

## 15. Faz M — MP

`tests/savas_destek_ai0_mp_test.js` (gerçek mp-core komutları): aday **5/0**, p54 2/3.

| Vaka | Ne sınar |
|---|---|
| M1 | AI → misafir B isteği B'nin kutusunda; B adına karar yok; aynı ay ikinci istek yok |
| M2 | B kabul → aynı sefer; ödeme tek; aynı / yeni cid ile ikinci kabul etkisiz |
| M3 | misafir → AI: kapılar host'ta (kriz → ret + gerekçe, ödeme yok) |
| M4 | host → misafir; taraf olmayan misafir C görmez; ret → savaş / ödeme yok |
| M5 | MP paketi → yeni host (devam): bekleyen istek taşınır; B aynı koltuğa döner; kabul bir kez; S'nin beklemesi korunur |

`MP8_SCEN=SD` (host + 2 misafir, gerçek STARS arayüzü, üretim relay + TLS vekili): **3/0**.
- D1 misafir B'nin toplu daveti:
  - 6 uygun adaydan her birine tek teklif (host insan, misafir C, 4 AI);
  - AI'lar: 1 karşı teklif, 2 ret;
  - Arındırıcı uygun görünmez;
  - C karttan kabul → aynı sefer;
  - B'de "Kabul edildi — cepheye katıldı";
  - ikinci toplu basış teklif üretmez.
- D2 AI → misafir C isteği: C'nin kutusunda; B görmez; ret → savaş yok.

Defter gizliliği: misafire yalnız tarafı olduğu teklifler gider (`dipView`); destek kartının uygunluğu host'un `warSupportList` kararından gelir.

Uzun oturum I: - `SCALE0_MP='{"size":"ulu","ai":9}' MP8_I_FF=120 MP8_I_MIN=8 MP8_SCEN=I` (100/9, host + 2 misafir, 8 dk): **4/0**.
- `MP8_I_MIN=15 MP8_SCEN=I` (500/16, host + 2 misafir, 15 dk): **4/0**.

İkisinde de şunlar doğrulandı:
- pencere kapalıyken misafir dünyası durmaz;
- görsel tutarlılık;
- sensör paylaşımı.

Kanıt: `evidence/savas-destek-ai0/regresyon/I100.txt`, `I500.txt`.

## 16. Faz N — Save8 / RNG / belirlenimcilik

`STARS_CONTROL_ROOT=<p54> node tests/savas_destek_ai0_equivalence_test.js`: **4/0**.
- Orta / 6 AI tohum 11 / 22 / 404 × 48 ay: her ay Save8 SHA-256 + RNG birebir (yeni yollar bu sürede çağrılmadı).
- p54'te 66 ay (açık AI–AI savaşıyla) oynanmış Save8 adayda açılır:
  - savaş defteri, `aiTalk`, `aiStrategy`, savaş / ittifak birebir;
  - yükle → kaydet aday = p54 bayt bayt.
- p54 MP paketi build kapısından geçer.

Kampanyada ilk ayrışma yalnız yeni davranışın ilk tetiklendiği ayda: 161. ay (t404, ilk istek gün 4830) ve 212. ay (çalkantılı t99, gün 6360). Diğer 6 yapılandırma uçtan uca birebir.

Host yetkisi: bütün kararlar host'ta motor işlevleriyle. Misafir yalnız komut gönderir (`offer`, `respond`) ve host'un `warSupportList` görünümünü okur.

## 17. Faz O — p54 ticaret regresyonu

- `ticaret_son_eksikler0_test` 23/0.
- `ticaret_son_eksikler0_mp_test` 7/0 (tam Node koşusunda).
- MP8 TZ 8/0.

Ticaret koduna dokunulmadı; `Commerce.memoReset` kuralı geçerli.

## 18. Faz P — performans

Araç: `research/ticaret-teslim-degeri0/perf-abba.cjs` (aynı Node sürecinde iki vm; her örnek aynı Save8'den bir ay; ABBA sırası; N=24 / kol). Ölçüm sessiz makinede yapıldı.

| Kayıt | Ortalama A → B | Fark | p50 | p95 | Save8 SHA (A = B) |
|---|---|---|---|---|---|
| 100/9 m120 | 495,13 → 466,12 ms | −%5,86 | −%0,78 | −%11,03 | aynı |
| 500/16 m120 | 2216,68 → 2133,89 ms | −%3,73 | −%3,04 | −%5,17 | aynı |
| 500/16 m180 | 7153,50 → 7159,70 ms | +%0,09 | −%1,20 | +%7,39 | aynı |
| 500/16 m122 savaş yoğun (7 açık cephe) | 3705,07 → 3705,65 ms | +%0,02 | −%0,53 | −%0,31 | aynı |
| A/A 100/9 m120 (p54 ↔ p54) | 377,47 → 379,14 ms | +%0,44 | +%0,88 | +%5,25 | aynı |
| A/A 500/16 savaş yoğun | 3670,22 → 3652,81 ms | −%0,47 | −%1,19 | +%3,34 | aynı |

- Ortalama ve medyan her kayıtta ≤ %5: **PASS**.
- Tek sınır aşımı: 500/16 m180 p95 +%7,39 (24 örnekte tek uç değer; A/A p95 gürültüsü +%5,25'e kadar çıkıyor). Ortalama +%0,09, medyan −%1,20 olduğundan gerileme olarak değerlendirilmedi. Açıkça not edilir.
- Savaş yoğun kayıt `war-dense-save.cjs` ile p54'ten üretildi. Doğal temas seyrek olduğu için AI'lar arası temas yalnız bu stres kaydında açıldı.
- Ölçülen ayda yeni yol dünyayı değiştirmedi (Save8 SHA iki kolda aynı). Yeni işlevlerin maliyeti ölçülen ayda sınırlı: `aiWarHelpAsk` zorlanmayan devlette ilk koşulda döner.
- Kanıt: `evidence/savas-destek-ai0/perf/`.

## 19. Faz Q — savaş testleri ve tam regresyon

Mevcut savaş testleri (aday):

| Test | Sonuç |
|---|---|
| `beta_war_goals0_test` | 13/0 |
| `field_war_siege0_test` | 20/0 |
| `mp_deal_sys0_sp_test` | 4/0 |
| `mp_waron0_test` | 9/0 |
| `saha_entegre0_warhelp_test` | 7/0 |
| `saha_guvence1_war_test` | 10/0 |
| `war_coalition0_test` | 7/0 |
| `war_coalition0_mp_test` | 3/0 |

Chromium:

| Test | Sonuç |
|---|---|
| `browser-war-coalition0` | 5/0 |
| `browser-saha-entegre0-sp` | 3/0 |
| `browser-beta-war-center0` | 10/0 |
| `browser-field-war-siege0` | 2/1 |

`browser-field-war-siege0` F3 (sevkiyat listesi) p54 kökünde de aynı FAIL; bu fazdan bağımsız, silinmedi.

MP8:

| Senaryo | Sonuç |
|---|---|
| SD | 3/0 |
| Q | 8/0 (fikstür düzeltmesi sonrası, §20) |
| W | 4/0 |
| SE | 8/0 |
| SG | 5/0 |
| X | 5/0 |
| Y | 6/0 |
| V | 7/0 |
| J | 5/0 |
| TZ | 8/0 |

Tam Node: **253 paket / 6632 PASS / 279 FAIL** (p54: 250 / 6606 / 279).

- Başarısız 56 paketin listesi ve paket içi sayıları p54 ile **birebir aynı** (`evidence/savas-destek-ai0/node/fail-listesi.txt`). Yeni FAIL yok.
- +3 paket = bu fazın testleri (21 + 5 + eşdeğerlik). Eşdeğerlik `run-all` içinde kontrol kökü olmadığı için NOT RUN; ayrıca `STARS_CONTROL_ROOT` ile koşuldu: 4/0.
- Sürüm yükseltmesinden önceki ara koşuda `mp11_online_test` ve `mp1_relay_test` geçici olarak FAIL verdi: çalışma zamanı dosyaları henüz `RELEASE-MANIFEST` ile eşleşmiyordu. p55 manifestinden sonra 9/0 ve 14/0.
- Audit / navy dosyaları koşudan sonra geri alındı.

## 20. Q fikstürü (açık gerekçe)

MP8 Q1 ilk koşuda 5/3 FAIL verdi: AI Y koalisyon davetini reddetti, p54'te karşı teklif veriyordu.

Kök neden: tohum 22'de Y gerçek enerji krizinde.
- `aiEconomyPlan.critical`;
- enerji neti −447/ay;
- 0,67 aylık stok;
- `aiWarBudget` "expedition-energy".

p54'ün bu durumda karşı teklif vermesi S4'te kanıtlanan kusurun kendisi.

Fikstürün yazılı niyeti "Y'nin hedefe erişimi … AI katılım değerlendirmesi". Y'ye 4000 stok verildi, beklentiler gevşetilmedi. Sonuç: Q 8/0.

## 21. Yayın kararı

**p55 güvenli yayın adayı (otomatik kabul):** `releases/stars-faz96h10p55.zip`.
- SHA-256 `d3299990d0d555ce7f9901e3553e1ec5952106394e50e9c4b7ac18a8da678e52`, CRC32 `ADAB4DE9`, 971 531 bayt, 20 girdi.
- Yeniden paketleme bayt bayt aynı; `verify-release.py --root` 19 dosya doğrulandı.
- Kayıt `RELEASE-SAVAS-DESTEK-AI0.json`.

Yayın engelleri kontrolü:

| Engel | Durum |
|---|---|
| Gereksiz savaş | yok (kampanya 6/8 birebir, 2/8 savaş sayısı aynı, plasebo bandında) |
| Yanlış savaş başlangıcı | yok (yardım daima mevcut cepheye warJoin; yeni ilan yok) |
| Çift ödeme / çift savaş | yok (E1, M2, M5, SD D1) |
| Kayıp hedef | yok (warJoin aynı sefer; savaş hedefi kodu değişmedi; beta_war_goals0 13/0) |
| Toprak vaadi muhasebesi | doğru (I1) |
| Desync | yok (I 100/9 ve 500/16 4/0, SD 3/0) |
| Bozuk Save8 | yok (p54 kaydı açılır, yeniden kayıt p54 ile bayt bayt aynı) |
| p54 ticaret | bozulmadı (TZ 8/0, ticaret testleri) |
| Yeni FAIL | yok |
| Perf gerilemesi | yok (ortalama / medyan ≤ %5) |
| Askerî AI kötüleşmesi | yok (filo kodu değişmedi; kampanyada ölüm / koloni kaybı aynı) |

Kullanıcı kabulü, merge, canlı Render: yapılmadı.

## 22. NOT RUN ve sınırlar

- Fiziksel Android, gerçek uzak internet, LAN, canlı Render: NOT RUN.
- İki gerçek insanla saha kullanılabilirliği: NOT RUN.
- Kampanyada doktrin dağılımı istatistiği: örnek yok (AI→AI `warJoin` yanıtı 2).
- Gönüllü destek (support-opportunity): doğal kampanyada 0 tetik. Mekanizma kontrollü olarak p54'teki gibi.
- Vasal katılımların pasifliği ölçüldü, düzeltilmedi (kapsam dışı).

## 23. Sonraki adımlar

- FED-AI-SİYASET.0: federasyon AI siyaseti; vasal / federasyon otomatik katılımlarında gerçek askerî katkı (pasif cephe bulgusu).
- Doğal oyunda AI temas yoğunluğu çok düşük (100/9'da savaş-ay başına aday havuzunun ~%96'sı "temas yok"). Destek davranışının oyunda görünür olması temas / keşif ekonomisine bağlı; ayrı faz kararı.

## 24. 21 soru

1. **Önceki katılım kararları doğru muydu?** Hayır, üç kusur vardı:
   - doktrin çarpanı AI'da hiç uygulanmıyordu (`e.mizac`);
   - kriz içindeki AI ücretli katılımı kabul ediyordu (S4);
   - ikinci cephe / bütçe / başkent tehdidi denetimi yoktu (S10).

   Üçü de düzeltildi ve testle kanıtlandı.
2. **AI ne sıklıkla destek istiyor?** 8 kampanyanın 2'sinde (100/9 t404: 240 ayda 5 istek, 3 aday; çalkantılı t99: 1). Spam yok: ayda en çok 1; cephe + aday başına 180 gün, ret sonrası 360.
3. **Gönüllü destek ne sıklıkla?** 0 (16 koşu). Neden temas seyrekliği ve sponsorun müttefik olmaması (§9); kural değiştirilmedi.
4. **Kaçırılan fırsat var mı?** Doğal kampanyada aday havuzu çoğunlukla "temas yok" (982/1024). Gerçek fırsat bulunamadı; tohum 11'deki düşman Arındırıcı'ydı (kilit doğru).
5. **Yanlış karar var mı?** Ölçülen yanlış katılım yok. Kampanyadaki 2 AI ret gerekçesi "güç / erişim yetersiz", doğru. Q fikstüründeki kriz reddi doğru (§20).
6. **Doktrin ayrımı?** Ölçülebilir (S2, S2b, S20, S21): pasifist saldırı 397 / savunma 143, militarist saldırı 211, tüccar 165. Kampanya ölçeğinde örnek az (§7).
7. **Kendini savunma riski gözetiliyor mu?** Evet: başkent tehdidi, süren savaş gücü (×1,2), ≥2 savaş, yorgunluk, ekonomi kapıları (S10).
8. **Ödemeler mantıklı mı?** AI isteğinde ödeme gerçek stoktan: (stok − 200) × %6, en çok 300, alaşım / mineral. AI kabulü `itemValue` farkına göre; ödeme tek seferlik (E1, M2).
9. **Geçişsiz katılım?** Erişim yoksa ret (S6); geçiş `give` içinde erişim açıyorsa kabul edilebilir. Ticaret transit izni askerî geçiş sayılmaz.
10. **Oyuncu tek ekrandan destek çağırabiliyor mu?** Evet: Savaş Merkezi → ASKERÎ DESTEK İSTE; aday öncelikli + gerekçeli; tek tek ya da toplu; 3 mobil çözünürlükte 9/0; misafirde SD 3/0.
11. **Kabul gerçek katılıma dönüşüyor mu?** Evet; aynı sefer, yeni ilan yok (W2, E1, M2, M5, SD D1).
12. **Katılan AI gerçek filo katkısı yapıyor mu?** Tehdit altındaki müttefiki savunuyor (`katki.cjs`, 2 imha). Hedef çok güçlüyse toplanma noktasında bekliyor. Vasal yoluyla çekilen katılımlar çoğunlukla pasif (kapsam dışı bulgu).
13. **Toprak vaatleri doğru mu?** Evet; aynı sistem ikinci kez vaat edilemez (I1); cephe bitince vaat kapanır (mevcut `warPromiseFrontEnded`).
14. **Savaş sonuçları?** Kampanyada ölen devlet, koloni kaybı ve federasyon boyutları p54 ile aynı.
15. **Kontrolsüz savaş / federasyon büyümesi?** Yok; savaş sayısı ve federasyon boyutları aynı, plasebo bandında.
16. **500/16 perf?** 500/16 m120 −%3,73, m180 +%0,09 (ortalama), savaş yoğun +%0,02. Uzun oturum 500/16 15 dk 4/0.
17. **Misafir güvenli mi?** Evet: kararlar host'ta; misafir yalnız komut gönderir; taraf olmayan teklifi görmez (M4, SD D2); aynı cid önbellekten.
18. **Save8 / warOn korunuyor mu?** Evet: şema değişmedi, p54 kaydı açılıp aynı baytlarla yeniden yazılıyor; warOn / warPledge kodu değişmedi (mp_waron0 9/0, V 7/0).
19. **p54 ticaret bozuldu mu?** Hayır (ticaret testleri 23/0, 7/0; MP8 TZ 8/0).
20. **p55 güvenli mi?** Otomatik kabul koşullarının hepsi sağlandı → **EVET (otomatik kabulde)**.
    - Tek not: 500/16 m180 p95 tek uç değer (+%7,39); ortalama ve medyan ≤ %5.
    - Fiziksel Android / gerçek internet / Render NOT RUN; saha kabulü yok.
21. **FED-AI-SİYASET.0'a hazır mı?** Evet, girdileri ölçüldü:
    - pasif vasal / federasyon katılımları;
    - seyrek temas;
    - federasyon savunma çağrısı.

    Savaş desteği kapısı (`aiWarJoinGate`) ve istek yolu (`aiWarHelpAsk`) federasyon siyasetinde yeniden kullanılabilir.
