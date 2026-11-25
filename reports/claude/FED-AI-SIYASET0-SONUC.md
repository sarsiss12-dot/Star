# FED-AI-SİYASET.0 — Sonuç raporu

Tarih: 25 Kasım 2026 · Dal `claude/stars-fed-ai-siyaset0` · taban `claude/stars-savas-destek-ai0` @ `914c003` (p55, PR #80)
Yayın adayı: **96h10p56 / stars-v96h10p56 / MP.8.9b55** · Save8 v8 (şema değişmedi, yeni alan yok) · MP paket 4 · protokol 1.
Kullanıcı fiziksel test yapamıyor; bütün kabul otomatik (Node + gerçek Chromium + üretim relay süreci + TLS vekili).
Fiziksel Android, gerçek uzak internet, LAN ve canlı Render: **NOT RUN**.

Amaç daha fazla federasyon ya da savaş değildi: daha akıllı siyasi kararlar, inandırıcı bloklar, gerçekten işbirliği yapan devletler.
Ölçülen sonuç:
- p55'te federasyondan ayrılma doğal oyunda ölü koddu (çatışma terimi hiç pozitif olmuyordu). Üyeler hiç reform önermiyordu. Reform oyları doymuş iyi niyetle kabul ediliyordu.
- Bu fazda üye önce mevcut reform oyuyla **ses** arıyor; reddedilince ya da desteksiz kalınca, yaşayabilir alternatif varsa anayasal yoldan **çıkıyor**. Tür uyumsuz birliğe en baştan katılmıyor.
- Sonuç: en büyük blok payı −0,074 (t≈−2,2), bağımsız devlet +1,05. Çalkantı yok (aynı AI en çok bir kez ayrıldı). Koloni / filo / ölüm plasebo bandı içinde.
- Temas darboğazının gerçek nedeni ölçüldü: mesafe ve keşif gemisi yokluğu. Bir keşif fırsatı kaybı (geçidi tıkayan yuva / kalıntı hiç hedeflenmiyordu) en dar biçimde düzeltildi.
- jointOps motorunda kod kusuru bulunmadı; pasifliğin nedenleri kural (tek taraflı savaşlar, bilinen rota, ikmal, kendi savunması).

## 1. Başlangıç ve bitiş commit'leri

- Başlangıç HEAD: `914c00310200bbda97abdcecab56934fccbd7cf3` (p55 / MP.8.9b54). Kontrol kökü: `git archive 914c003` (sabit kopya).
- Bu fazın commit'leri:
  - `e3e40f0` ödül avı (ilk, sonradan daraltıldı);
  - `0493faf` üye sesi ve anayasal çıkış;
  - `7ec2903` ödül avı yalnız görünen hedefler, MP Node testi, ölçüm araçları;
  - `f63a1fe` MP8 FA senaryosu;
  - `a5af47a` tek katılım kapısı;
  - `fd3799b` ödül döngüsünde görünür küme döngü dışında;
  - `34a5f89` p56 sürüm kimlikleri, manifest, ZIP, yayın kaydı;
  - rapor / belge commit'i (son yanıtta).
- Kampanya aday kökleri (sabit kopya): `candV` (= `7ec2903` ağacı), `candW` (= `fd3799b` ağacı).

## 2. Önceden var olan mekaniklerin envanteri (Faz A)

Çalışma zamanında davranışı değişen tek dosya `ai.js` (+46 / −7 satır; sürüm kimliği için `main.js` `BUILD_ID` ve `sw.js` `CACHE`); motor (`diplomacy.js`, `main.js`, `combat.js`) değişmedi.

### 2.1 Federasyon siyaseti

| Özellik | Kanonik işlev | Çalıştığı koşul | p55 gerçek örnek / ölçüm | Çalışmama nedeni | Kural mı kusur mu | En küçük değişiklik |
|---|---|---|---|---|---|---|
| Kuruluş | `aiRivalBlocChoice` → `fedFoundCandidate` / `aiFoundWilling` | temaslı, ittifak gerekmez, Etki ≥ bedel | 7 kampanya: 21 kuruluş | `temas-yok` 1.877 / 3.327 elenme; `ortak-istemiyor` 530 (güven / rota) | kural | yok |
| Katılım | `canRequestFederation` + `aiFedWilling` | temas, kabul kapısı, istek | 20 katılım | tür uyumsuz birliğe de katılıyordu → 2 yıl sonra (aday kodunda) ayrılış | **kusur** (adayda ortaya çıktı) | `aiFedWilling` tek kapı: `aiFedDoctrineBar`, `aiFedLeftRecently` |
| Ret | `rejectFedInvite`, `aiFedWilling.why` | — | "Güven veya ilişki yetersiz" 267, "rota yetersiz" 602 | — | kural | yok |
| Bağımsızlık | `aiRivalBlocChoice` (Yağmacı / kimse) | — | — | — | kural | yok |
| Ayrılma | `aiFedStayReview` → `leaveFederation` | ≥720 gün, çatışma >0,15 sabır sayacı kadar, alternatif | **0 ayrılış**, 3.556 değerlendirme, çatışma en çok −0,10 | ilişki / uyum barışta 100'e doyar → çatışma terimi hiç pozitif olmaz | **kusur** (ölü kod) | çözülemeyen tür uyumsuzluğu çatışmaya girer |
| Rakip blok | `fedCounterBloc` (%40 indirim), `aiBlocThreat` | büyük blok ≥⅓ | 7 kampanyada en büyük blok 0,30–0,75 | — | kural | yok (ayrılış dolaylı etkiler) |
| Oy | `aiFedVoteWant` / `aiFedVoteAssessment` | açık oylama | 404 temel yasa oyu, 206 kabul | reform oyunda `goodwill` doymuş (+0,4) → tür tercihi önemsiz | **kusur** | reform önergesinde iyi niyet ≤ +0,1 |
| Reform | `proposeFedMotion('reform')` | herhangi bir üye, 150 Etki, %75, 3600 gün kilit | yalnız 2 reform oyu (ikisi de lider dalından), üye önerisi 0 | üye dalı hiç önerge açmıyordu | **eksik karar** | `aiFedMemberReform` (mevcut yol) |
| Başkanlık | `elect` önergesi, `fedRefreshRepresentation` | — | 1 başkan değişimi | — | kural | yok |
| Savunma | `fedDefend` (`fedDuty('defense')`) | savunma yasası / askerî anayasa | cephe hunisi §12 | — | kural | yok |
| Saldırı | `fedWar` önergesi, `dutyConsent.offense` | açık rıza | — | — | kural | yok |

### 2.2 Diplomatik temas

| Özellik | Kanonik işlev | Koşul | Bulgu | Kural / kusur | Değişiklik |
|---|---|---|---|---|---|
| Fiziksel karşılaşma | `arrive(f,sys)` (main.js) | başka devletin sahip olduğu sisteme ya da filosunun bulunduğu sisteme giriş | temasın tek oyun içi kaynağı | kural | yok |
| Sensörle görme | `explorationContext.visible` | sensör menzili | görmek temas kurmaz | kural (gizlilik) | yok |
| Keşif emri | `autoExploreTick`, `explorationBlock` | rota / korsan / tehdit / ikmal | yuva ve kalıntı sistemleri `blocked`; bilim gemisi girmez | kural | yok |
| Geçidi tıkayan yuva / kalıntı | `aiTurn` barış ödül avı | yalnız `sy.seen` (filonun girdiği) | p55 100/9 t11 120. ay: keşfedilmemiş 61–81 sistemin tamamı yalnız yuva / kalıntı üstünden erişilebilir | **kusur** (fırsat kaybı) | görünür hedef de av listesine girer |
| Federasyonla temas | `acceptFedInvite`, `foundFederation` | üyelik | üyeler arası temas | kural | yok |
| Mega yapı duyurusu | `announceMega` | mega yapı başlatma | herkesle temas | kural | yok |
| Ayrılıkçı devlet | `economy.js` diplomatik doğuş | ayrılık | yeni devlet herkesle temasla doğar (500/16 t23 p55: 142 temas) | kural; **ölçüm tuzağı** | `contact0` ölçütü |
| Temas belleği | `e.contact` (kalıcı), `aiIntel` (≤3600 gün) | — | — | kural | yok |
| Diplomatik aday seçimi | `e.contact[o.id]` kapıları | temas | — | kural | yok |
| Askerî erişim | `canEnter`, `pathAllowed` | geçiş hakkı | — | kural | yok |
| İstihbarat | `intelOf`, `aiKnownSystem` | casus / sensör | — | kural | yok |

### 2.3 Ortak harekât (jointOps)

| Aşama | Kanonik işlev | Koşul | Bulgu (7 kampanya: 4 × 100/9 240 ay + 3 × 500/16 120 ay) | Kural / kusur |
|---|---|---|---|---|
| Katılım | `warLedgerOpen` (parent / campaign) | `declareWar(..., {sponsor, enemy})` | `fedDefend` ve vasal katılımı aynı kampanyaya bağlanıyor | kural, doğru |
| Görev önerisi | `jointAuto` (aylık) | aynı kampanya + rol, ≥2 bağlı üye | p55: 676 değerlendirmenin 630'u **tek başına** (savaşın o tarafında başka devlet yok) | kural |
| Bağlam | `jointContext` / `jointBinding` | fed / ittifak / vasal / vaat | çok taraflı kampanyada bağlam kuruluyor (`cephe.cjs`: p55 t404 23 ay-kampanya, aday t23 47) | kural, doğru |
| Kuvvet seçimi | `jointAvailable` | korunan / meşgul olmayan, ikmal >0,55 | "Kendi stratejik savunması" | kural |
| Toplanma / rota | `jointSelect` | ≤180 gün, hedefte ikmal >0,4, bilinen açık rota | aday: 28 denemenin 13'ü "rota yok" | kural (§13) |
| Hareket / çatışma / tamamlanma | `jointAdvance`, `jointTick`, `jointClose` | — | aday: 6 plan, 4 tamamlandı, 6 filo vardı, 2 sistem ele geçirildi | çalışıyor |
| İptal | `jointValid` | cephe kapandı vb. | 1 iptal (destek kuvveti kalmadı) | kural |

## 3. Federasyon kuruluş ve ayrılma hunisi

Kaynak: `research/fed-ai-siyaset0/camp.cjs` (saf; 36 ay p55 ile birebir doğrulandı). 7 kampanya: 100/9 × 4 tohum × 240 ay + 500/16 × 3 tohum × 120 ay.

| | p55 | aday (`candW`) |
|---|---|---|
| `aiRivalBlocChoice` çağrısı | 5.247 | 6.039 |
| başvuru (`apply`) | 46 | 50 |
| kuruluş | 21 | 20 |
| katılım | 20 | 14 |
| ayrılma (anayasal) | **0** | 3 |
| dağılma | 2 | 1 |
| kalış değerlendirmesi / gerilim > 0,15 | 3.556 / **0** | 2.912 / tür uyumsuzluğu çatışmaya giriyor |
| "alternatif yok" yüzünden kalan | 0 | 62 |
| reform oyu (kabul) | 2 (0) | 17 (2) |
| diğer önerge / yasa oyu (kabul) | 404 (206) | 372 (197) |

Kuruluşta elenme sınıfları (p55):
- `temas-yok` 1.877;
- `ortak-istemiyor` 530 (gerekçe: rota yetersiz 602, güven 267);
- `kurucu-aday-yok` 463;
- `kurucu-puan<0,5` 245;
- `ekonomik-kriz` 121;
- `etki-yetersiz` 37.

Aday kampanyada bu sınıfların payı aynı düzeyde. Kuruluş kuralına dokunulmadı.

## 4. Tek blokta yığılmanın gerçek nedenleri

1. **Çıkış yolu ölüydü.** `aiFedStayReview` çatışması `(45 − uyum)/100 + (−ilişki)/150 + (0,45 − tür uyumu) − 0,05`. Barışta ilişki +0,3 / +1,2 / ay ile 100'e, uyum da 100'e doyar. İlk iki terim −0,55 ve −0,67; tür uyumu ne kadar kötü olursa olsun toplam pozitif olmuyor. p55'te 3.556 değerlendirmede gerilim hiç >0,15 olmadı (en yüksek −0,10).
2. **Ses yolu yoktu.** Üye AI'lar reform önermiyordu (`aiFederationPolitics` üye dalı yalnız kalış incelemesi).
3. **Oy doymuştu.** `aiFedVoteWant` içinde `goodwill = rel/300 + (uyum − 50)/250` doyunca +0,53. Reform oyları türe bakılmadan geçebiliyordu (fikstürde 4/0).
4. **Katılım kapısı türe bakmıyordu.** Zıt doktrinli AI uyumsuz birliğe katılıp orada kalıyordu.

Tek blok her zaman hata değil (H4). Ortak tehdit ve uyumlu üyelerde blok sürüyor; değişiklik yalnız tür uyumsuzluğu çözülemeyen üyeye çıkış veriyor.

## 5. Rakip blok davranışı

- Mevcut `fedCounterBloc` (%40 kuruluş indirimi) ve `aiBlocThreat` değiştirilmedi.
- Adayda ayrılan AI çoğunlukla bağımsız kalıyor (yaşayabilir alternatif şartı, kalıcı ayrılma belleği).
- Doğal oyunda ikinci büyük blok payı plasebo bandı içinde (aynı 15 hücre, §15–16).
- Kampanyada iki büyük blok oluşmasının kendisi başarı sayılmadı.

## 6. Üyelerin bağımsız siyasi kararları

| Karar | p55 | Aday |
|---|---|---|
| Türe uyumsuz üye reform önerir | yok | `aiFedMemberReform` (desteği ≥ yarıysa, mevcut önerge, 150 Etki) |
| Reform oyu | doymuş iyi niyet | tür uyumu farkı + iyi niyet ≤ +0,1 (F7) |
| Pahalı yasaya ret | `aiFedVoteAssessment` (ekonomik kriz) | aynen (F6) |
| Çözülemeyen uyumsuzlukta ayrılış | yok (ölü kod) | anayasal çıkış, gerekçeli (F4a), alternatif yoksa kalır (F4b) |
| Uyumsuz birliğe katılım | var | yok, destek varsa var (F9) |
| Aynı birliğe dönüş | — | tür değişmedikçe yok (F8) |
| İnsan adına | — | hiçbiri (F5, M1–M3, FA) |

15 doğal kampanyada 42 üye reform önergesi; birkaçı geçti, örnek: 100/9 t23 bilimsel → ticaret, AI5'in önerisi. 9 anayasal ayrılış; hiçbir AI birden fazla ayrılmadı.

## 7. Dört federasyon türünün gerçek etkileri (Faz C)

Kontrollü deney (`tur.cjs`): aynı tohum, 60. ayda aynı üç AI, mevcut birliklerinden çıkıp X türünde birlik kuruyor, sonra 60 ay doğal oyun. Türe yeni kural eklenmedi.

| Tohum / tür | Δteknoloji | araştırma geliri (başlangıç → son) | filo gücü (son) | koloni (son) | ayrılış / sonuç |
|---|---|---|---|---|---|
| 11 askerî | 13 | 130 → 368 | **13.402** | 8 | — |
| 11 bilimsel | **14** | 130 → **540** | 12.022 | 8 | — |
| 11 ticaret | 12 | 130 → 312 | 12.346 | **10** | — |
| 11 yağmacı | 13 | 130 → 377 | 13.019 | 8 | — |
| 404 askerî | 21 | 391 → 637 | 16.494 | 14 | 1 ayrılış, birlik dağıldı |
| 404 bilimsel | **24** | 391 → **821** | 16.536 | 16 | — |
| 404 ticaret | 20 | 391 → 662 | 16.662 | 13 | — |
| 404 yağmacı | 17 | 391 → 552 | 11.654 (en düşük) | 15 | üyeler bilimsele reform etti |

- Bilimsel: iki tohumda da en yüksek araştırma ve teknoloji.
- Askerî: t11'de en yüksek filo gücü.
- Ticaret: t11'de en çok koloni. Teslimatsız gelir yok, mevcut `commerce` teslimatı.
- Yağmacı: t404'te en zayıf filo; üyeler kendi doktrinleriyle türü değiştirdi.
- Uyumsuz askerî birlik t404'te çöktü.

Farklar karar düzeyinde de görünür (reform, ayrılış). Her tür her kampanyada üstün değil.

## 8. Diplomatik temasın neden sınırlı kaldığı (D1, D6)

`temas.cjs` (p55, 100/9) temassız AI çiftleri:

| Ay | t11 temas | sınıflar | t23 temas | sınıflar |
|---|---|---|---|---|
| 60 | 16/72 | gemi-yok 8, uzak 48 (47'si ≥8 sıçrama) | 12/72 | uzak 35, gemi-yok 15, sınır-görünür 6, sınırda 2 |
| 120 | 16/72 | uzak 34, gemi-yok 8, bilinen-sistem 7, sınırda 6 | 28/56 | bilinen-sistem 13, gemi-yok 7, uzak 6 |
| 240 | 54/72 | uzak 9, gemi-yok 5, sınır-görünür 4 | 44/56 | gemi-yok 7, sınır-görünür 4 |

982/1024 bulgusunun sınıflandırması (D6):

| Sınıf | Pay / kanıt | Sonuç |
|---|---|---|
| Henüz fiziksel olarak erişilemeyen devlet | baskın: ilk 10 yılda temassız çiftlerin %65–70'i ≥8 sıçrama uzakta | kural (mesafe) |
| Keşif gemisi bulunmayan devlet | %10–25 (bilim filosu yok / kaybedilmiş) | ekonomik / askerî AI kapsamı (ayrı faz) |
| Erişilebilir ama keşfedilmemiş | sınırda / sınır-görünür birkaç çift | çoğu sonraki yıllarda kapanıyor |
| Keşif planı hatası | geçidi tıkayan yuva / kalıntı: ödül avı yalnız `seen` | **düzeltildi** (§9) |
| Gerçek karşılaşmanın temasa dönüşmemesi | yok: `arrive` her karşılaşmada çift yönlü yazıyor (T1) | kural |
| Temas var ama aday filtresi reddi | savaş desteği kapıları (p55 `aiWarJoinGate`) | kural |
| Diplomatik hukuki engel | Arındırıcı `diploBlocked`, Konsey | kural |
| Askerî erişim engeli | rota / geçiş (`pathAllowed`) | kural |
| "Bilinen sistem" ama temas yok | sensörle görmek temas kurmaz | kural (gizlilik) |

Kesin yasaklar (D5) korundu: AI'ya tam harita, temassız devlet adı / konumu, gizli güç, bilinmeyen savaş, sensör artışı yok. Temassız anlaşma yok. Ticaret hakkı askerî geçişe çevrilmiyor.

## 9. AI keşif etkinliği (D2, D3)

- Kanıtlanan fırsat kaybı: keşif gemileri yuva / kalıntı sistemine girmez (`explorationContext.blocked`). Barış ödül avı yalnız filonun girdiği (`seen`) sistemlere baktığından, geçidi tıkayan yuva hiç hedef olmuyordu.
- Düzeltme: hedef listesine şu an sensörle görülen (`aiView(e).ctx.visible`) yuva / kalıntı da girer.
  - Güç eşikleri (yuva HP × 0,35, kalıntı × 0,55), zar (`rnd() < 0,35`) ve en yakın hedef seçimi aynı.
  - Yeni bilgi, bonus ya da hızlı keşif motoru yok.
- Reddedilen geniş varyant: istihbarat **belleğindeki** hedefler. 500/16'da filoları uzun seferlere çekti (gücün 6 hücrenin 5'inde negatif, ortalama −%12). `AI-RED-KARARLARI.md`.
- Etki (100/9 × 4 tohum × 240 ay, 3 plasebo + p55):
  - yuva sayısı 60. ay 2,75 / bant 3,5–4,25; 120. ay 1,25 / 1,75–2,5;
  - 500/16 120. ay yuva 0–2 / p55 4–9.
- 15 hücrelik toplamda keşif kapsamı +0,064 (t≈1,9), kurucu AI teması +0,06 (t≈1,5): pozitif, sınırda anlamlı.

## 10. Keşif ile diplomatik fırsat arasındaki bağlantı (D4)

- Temas sonrası diplomasi mevcut `aiStrategy` / `aiNegotiate` / `aiRivalBlocChoice` aylık karar dönemlerinde değerlendiriliyor; yeni temas otomatik ittifaka dönüşmüyor.
- Ölçüm tuzağı: p55 500/16 t23'teki yüksek temas oranının kaynağı.
  - Yalnız ~50 temas `arrive` ile kuruldu.
  - ~142 temas ay başı yolundan geldi: ayrılıkçı yeni devlet herkesle temasla doğuyor (`temas-kaynak.cjs`).
  - Kurucu AI'lar arası temas (`contact0`) üç tohumda da bandın içinde.
- Kampanya karşılaştırmalarında bu fazdan sonra `contact0` kullanılmalı.

## 11. Ortak harekâtın başlatılma koşulları (E1)

Huni (`camp.cjs` + `cephe.cjs` + `rota.cjs`):

| Aşama | p55 (7 kampanya) | aday (7 kampanya) |
|---|---|---|
| 1. Savaşa kayıt üzerinde katılan devlet (`declareWar` türü) | ilan 5–10 / kampanya; `federation` 0–2; `vassal`/`overlord` yalnız t404 | `federation` 1–4; `vassal` 1–8 (t99) |
| 2. Ortak görev adayı (bağlam değerlendirmesi) | 676 | 1.086 |
| — tek başına (o tarafta başka devlet yok) | 630 | 893 |
| 3. Gerçek ortak plan | 0 | 6 |
| 4–7. Filolar ayrıldı / hareket etti / toplandı / cepheye ulaştı | 0 | 6 filo vardı |
| 8. Gerçek savaş katkısı | 0 | 4 görev tamamlandı |
| 9. Korunan dost sistem | — | 1 savunma görevi |
| 10. Ele geçirilen düşman sistemi | 0 | 2 |
| 11. Filo kaybı | — | yabani muharebe kaybı plasebo bandında |
| 12. Ret nedenleri | "kendi stratejik savunması" 4, "yeterli savaş filosu yok" 4 | "rota yok" 13, "ortak kuvvet yetersiz" 6, "kendi savunması" 3 |

Plan sayısındaki fark (0 → 6) koda değil, kaotik olarak farklılaşan savaş tarihine bağlı: aynı motor, aday kodunda jointOps değişmedi. Plasebo kollarında da 0–4 plan var.

## 12. Vasal ve federasyon askerî katkısı (E3, E4)

- `fedDefend` her üye için: ölü / zaten savaşta / saldırganın müttefiki / saldırgan üye / kapı (`fedSupportGate`: Konsey ya da doktrin savaş engeli, savaş / ittifak / saldırmazlık koşulu) / `aiDefenseShirk` / katılır (`cephe.cjs`).
- p55 t23: 2 savunma yükümlülüğü, 8 üye "Doktrin veya Konsey savaş engeli", 2 "katılır". Gerçek katılım 0: `declareWar` içindeki Konsey yasağı / erişim kapısı (`warCallSettled`, `warAccess`, %75 AI uyarı zarı).
- Aday kollarında "katılır" = gerçek katılım (t23 4/4, t99 1/1, t404 2/2).
- Vasal: `vassalDuty('join')` yalnız sözleşmede katılım (`war:'all'` ya da savunma savaşında `'defense'`) varsa. Sözleşmesiz vasal savaşa sokulmuyor (kural).
- Kod kusuru bulunmadı; yeni otomatik savaş hakkı eklenmedi.

## 13. Gerçek filo hareketi ve muharebe sonuçları (E2, E5, E6)

- `jointSelect` "rota yok" alt nedenleri (`rota.cjs`, 100/9 t23 aday, 10 ret):
  - toplanma-rota-yok 78;
  - yürüyüş-rota-yok 32;
  - toplanma-ikmal-yok 30;
  - toplanma-tehdit 21 (filo × toplanma çifti).
- t99'da ayrıca 10 "toplanma bilinmiyor" ve 2 "hedefte ikmal ≤ 0,4".
- `aiKnownRoute` yalnız bilinen sistemlerden, korsan sistemleri ve düşman sahipli sistemleri atlayarak, geçiş hakkıyla geçer. Fiziksel olarak düşman topraklarıyla ayrılmış üyeler ortak toplanamaz: meşru bilgi sınırı.
- E6: ≤180 gün, ikmal ve bilinen rota sınırları kanıt olmadan kaldırılmadı.
- `jointBattlePairs` (E5) değişmedi; ortak muharebe 4 tamamlanan görevde kayıtsız hata üretmedi (`faz95c_joint_campaign_test.js` 59/0).
- Diplomatik katılım askerî başarı olarak raporlanmadı (§11 ayrı satırlar).

## 14. Kontrollü deneyler (Faz G)

`tests/fed_ai_siyaset0_test.js` **14/0** (p55'te yeni vakalar FAIL). Fikstür: orta / 5 AI / tohum 22, gerçek doktrin uyumları.

| Vaka | İçerik |
|---|---|
| F3 | uyumlu üye: 24 değerlendirmede ayrılış ve önerge yok |
| F4a | uyumsuz, desteksiz, alternatif var: sabır sayacı dolunca (≥4 değerlendirme) gerekçeli anayasal ayrılış |
| F4b | alternatif yok: ayrılmaz, sayaç dolsa da |
| F4c | uyumsuz ve yarı destek: reform önergesi (150 Etki, `_fedPoliticsAfter` +360), oy reddedilir (2/2), ikinci önerge yok |
| F4d | reddedilmiş reform → çözülemeyen uyumsuzluk → sayaç işler |
| F5 | başkan önergede bulunmaz; insan üye adına önerge / ayrılış yok |
| F6 | ekonomik krizdeki üye pahalı yasaya düşük oy |
| F7 | reform oyu doktrine göre (uyumlu evet, uyumsuz hayır) |
| F8 | ayrıldığı birliğe 5 yıl sonra da başvurmaz / daveti kabul etmez; aynı reformu 4 yıl önermez |
| F9 | tür uyumsuz + desteksiz birliğe katılmaz; destek varsa katılabilir |
| T1 / T2 | fiziksel varış temas kurar; keşfedilmemiş uzak devletle temas yok |
| T3 | görünür, girilmemiş yuva güçlü filonun hedefi |
| T5 | bilinmeyen yuva hedef değil |
| T6 | bellekte olup görünmeyen yuva hedef değil |

Mevcut testler adayda:
- `beta_rival_blocs0_test` 10/0;
- `beta_rival_blocs0_mp_test` 3/0;
- `beta_fed_found0_core_test` 10/0;
- `beta_fed_fleet0_test` 11/0;
- `faz95c_joint_campaign_test` 59/0;
- `savas_destek_ai0_test` 21/0.

## 15. 100 sistem kampanyaları (Faz H)

Kollar:
- kontrol p55;
- aday (`candW`);
- plasebo: p55 + tek `rnd()` çekimi, gün 300 / 600 / 900 / 1500.

Aynı tohum, aynı başlangıç. Plasebo tek çekimi bazı tohumlarda emiliyor (mulberry32 sayaç, "uygun olana kadar çek" kalıbı); bu yüzden birden çok plasebo günü kullanıldı.

100/9 normal, 240. ay, aday `candW` (köşeli parantez: p55 + 3 plasebo bandı):

| Tohum | koloni | filo gücü | gemi | kurucu teması | keşif | en büyük blok | bağımsız | yuva | ayrılış |
|---|---|---|---|---|---|---|---|---|---|
| 11 | 68 [59–74] | 152k [130k–178k] | 574 [484–584] | 0,78 [0,68–1] | 0,50 [0,52–0,69] ↓ | 0,30 [0,44–0,6] ↓ | 5 [2–3] ↑ | 0 [0–1] | 0 |
| 23 | 47 [38–62] | 93k [76k–116k] | 444 [401–448] | 1 [0,43–1] | 0,93 [0,37–0,94] | 0,50 [0,3–0,75] | 2 [0–4] | 0 [0–0] | 1 |
| 99 | 58 [67–77] ↓ | 187k [131k–225k] | 824 [533–888] | 1 [1–1] | 0,97 [0,72–0,95] ↑ | 0,33 [0,44–0,67] ↓ | 2 [1–2] | 0 [0–0] | 1 |
| 404 | 48 [58–66] ↓ | 111k [113k–170k] ↓ | 576 [445–682] | 0,89 [0,86–0,92] | 0,64 [0,67–0,77] ↓ | 0,42 [0,5–0,56] ↓ | 5 [2–3] ↑ | 0 [0–0] | 0 |

- En büyük blok payı dört tohumun üçünde bandın altında, bağımsız devlet ikisinde üstünde: beklenen siyasi etki.
- Koloni t99 / t404'te bandın altında (58, 48). Aynı hücreler `candV`'de 81 ve 63'tü. Bant dar (3 plasebo + p55), 15 hücrelik toplamda koloni −%3,0 (t≈−0,7). Açık risk olarak not edildi.
- Ara aday `candV`'nin t23 filo gücü uç değeri (55k):
  - aday ailesi (aday + kendi üç plasebosu) 55–74k;
  - yalnız federasyon kolu 108k, yalnız ödül kolu 111k.
- Olay izi (`iz.cjs`): AI5'in bilimsel → ticaret reformu geçti. Sonra bağımsız AI3, birliğin savunma yasası nedeniyle üç üyeyi savaşa soktu (`kind:federation`, gün 6180) ve iki tarafın filoları eridi.
- Reform yükümlülük eklemedi (ticaret anayasası da "oylama"). Savunma yükümlülüğü önceden geçmiş `savunma` yasasından geliyor. Kusur değil, farklılaşan savaş tarihi.
- `candW`'de aynı tohum 93k (bant içinde).

Çalkantılı gerilim (4 tohum × 240 ay) ve rakip doktrin Az / Çok (2 tohum × 240 ay) aynı biçimde koşuldu. Hücreler bandın iki yanına dağılıyor; toplam §17.

## 16. 500 sistem kampanyaları

500/16 × 3 tohum × 120 ay, aday `candW` (bant = p55 + 4 plasebo):

| Tohum | koloni | filo gücü | gemi | kurucu teması | keşif | en büyük blok | bağımsız | yuva | ayrılış |
|---|---|---|---|---|---|---|---|---|---|
| 11 | 84 [82–89] | 102k [93k–107k] | 683 [641–726] | 0,30 [0,28–0,34] | 0,17 [0,17–0,18] | 0,19 [0,25] ↓ | 7 [6] ↑ | 1 [1–8] | 0 |
| 23 | 99 [79–89] ↑ | 70k [79k–90k] ↓ | 509 [562–637] ↓ | 0,21 [0,19–0,27] | 0,16 [0,13–0,15] ↑ | 0,31 [0,25–0,29] ↑ | 8 [8–12] | 0 [1–9] ↓ | 0 |
| 404 | 73 [71–75] | 85k [94k–103k] ↓ | 591 [601–684] ↓ | 0,22 [0,18–0,22] | 0,16 [0,14–0,17] | 0,18 [0,13–0,19] | 8 [5–6] ↑ | 2 [2–6] | 1 |

- 500/16'da filo gücü t23 / t404'te bandın altında; koloni t23'te üstünde, keşif t23'te üstünde.
- Federasyon-yalnız kol (`candF`) aynı hücrelerde gücü +%17 / −%20 / +%19 savuruyor. Beş plaseboluk bant 500/16 kaosunu dar gösteriyor.
- `candV` (ödül + ses / çıkış, katılım kapısı öncesi), plasebo ortalamasına göre:
  - güç +%8 / −%6 / −%13;
  - koloni +%8 / +%11 / +%16;
  - keşif +%5 / +%9 / +%2;
  - yuva 1 / 0 / 2 (p55 8 / 9 / 4).
- 240 ay 500/16: **NOT RUN** (süre; 120 ay ölçüldü).

## 17. Genel AI kalite karşılaştırması (Faz I)

15 hücre (100/9 normal 4, çalkantılı 4, Az 2, Çok 2; 500/16 3). Adayın plasebo ortalamasından sapması, plaseboların birbirinden sapmasıyla (bir-dışarıda ortalama) karşılaştırıldı (`agg.cjs`):

| Ölçüt | aday ortalama sapma | negatif hücre | plasebo sapma sd | t≈ |
|---|---|---|---|---|
| koloni | −%3,0 | 7/15 | %16,0 | −0,73 |
| filo gücü | −%5,8 | 11/15 | %16,3 | −1,39 |
| gemi | +%1,6 | 7/15 | %16,1 | +0,39 |
| keşif kapsamı | +0,064 | 5/15 | 0,127 | +1,94 |
| kurucu AI teması | +0,060 | 4/15 | 0,154 | +1,50 |
| en büyük blok payı | **−0,074** | 10/15 | 0,132 | **−2,18** |
| bağımsız devlet | **+1,05** | 4/15 | 1,80 | **+2,26** |
| elenen AI | +0,13 | 3/15 | 0,94 | +0,52 |
| ayrılış (toplam) | 9 / 15 kampanya; aynı AI en çok 1 | | | |

- Ekonomik / askerî kalite: koloni, gemi ve elenme plasebo gürültüsü içinde.
- Filo gücü −%5,8 eğilimi var ama anlamlı değil (|t| < 1,4). Kaynağı tek bir uç hücre (100/9 t23, §15).
- Siyasi yapı: yığılma azaldı, bağımsız arttı (anlamlı).
- Yapay ekonomi / filo / diplomasi bonusu yok.

## 18. Ticaret ve savaş regresyonları

- `savas_destek_ai0_test` 21/0, `faz95c_joint_campaign_test` 59/0.
- Ticaret (p54 `ticaret_son_eksikler0` 23/0 dahil) ve savaş desteği paketleri tam Node koşusunda paket bazında p55 ile aynı (§22). MP8 SD 3/0.

## 19. Save8 / RNG

- `STARS_CONTROL_ROOT=<git archive 914c003> node tests/fed_ai_siyaset0_equivalence_test.js` **4/0**:
  - t11 orta / 6: 48 ay birebir. Yeni yol çağrıldı ama dünyayı değiştirmedi (görünür yuva hedefi gün 420).
  - t22 orta / 6: 48 ay birebir, yeni yol çağrılmadı.
  - t404 ulu / 9: tetikten önce birebir; ilk ayrışma 19. ay = ilk tetik (görünür yuvaya hareket, gün 570).
  - p55 60 ay Save8 adayda açılıyor; federasyon / savaş defteri / jointOps / temas birebir. Yeniden kayıt p55 ile bayt bayt aynı. p55 MP paketi build kapısından geçiyor.
- Yeni Save8 alanı yok. `_fedLeft`, `_fedReformAsk` alt çizgili AI alanları, yalnız kullanıldığında yazılır; Save8 v8 aynen.

## 20. Multiplayer

- `node tests/fed_ai_siyaset0_mp_test.js` **3/0** (gerçek mp-core host + `installGuards`):
  - AI reform önergesi insan başkanın oyunu bekliyor, AI insan adına oy yazmıyor; insanın HAYIR'ı reformu düşürüyor; AI aynı reformu tekrar önermiyor;
  - insan üye adına önerge / ayrılış yok (40 ay);
  - AI ayrılışı insan başkan, üye ve fonu etkilemiyor.
- `MP8_SCEN=FA node tests/browser-mp8.cjs` **5/0** (host + misafir B + C, ayrı Chromium, üretim relay + TLS vekili, gerçek STARS arayüzü):
  - A1 misafirlerde oy kartı; B ve C gerçek gelen kutusu HAYIR düğmesiyle reddediyor (2/4 < %75). B HAYIR + C EVET olsaydı 3/4 ile geçerdi: ilk koşu bunu gösterdi; test tasarımı düzeltildi, motor doğruydu.
  - A2 AI 7 değerlendirme sonra gerekçeli ayrılıyor; misafir aynası üyeliği görüyor; davet edilse de dönmüyor.
  - A3 misafir aynasında `_fedLeft` / `_fedReformAsk` / `_fedStrain` / `aiFedReason` yok.
- MP8 regresyonu (p56, ayrı Chromium, üretim relay + TLS vekili):

| Senaryo | İlk koşu | Tekrar | p55 tekrar | Not |
|---|---|---|---|---|
| FA (yeni) | 5/0 | — | — | |
| F (federasyon kuruluşu / oy / başvuru / başkan değişimi) | **5/1** (F5 zaman aşımı 20 sn: misafirde "Federasyon başkanı değişti" kartı) | 6/0 | 6/0 | aralıklı; ilk FAIL korunur |
| L (federal filo) | 6/0 | | | |
| M (savunma çağrısı) | 5/0 | | | |
| SD (savaş desteği) | 3/0 | | | |
| SG | 5/0 | | | |
| J (kayıt → yeni oda) | 5/0 | | | |
| Q (koalisyon) | 8/0 | | | |
| I uzun oturum 500/16, 15 dk | 4/0 | | | donma yok, görsel tutarlılık, sensör paylaşımı tek yön |
| I uzun oturum 100/9, 8 dk | **3/1** | **3/1** | 4/0 | I3 ön koşulu sağlanmadı |

- I100 I3 ayrıntısı:
  - Aday dünyasında C, B'nin sensör bölgesindeki 30 sistemin hepsini zaten görmüş (`bNativeNew` 0, iki koşuda); p55'te 14. Paylaşım yönü bu dünyada sınanamıyor.
  - Aynı koşudaki ürün iddiaları sağlam: üçüncü taraf sızıntısı 0, B C'nin sistemlerini görmüyor (`bGetsC` 0), C aynası = host, host görüşü değişmiyor.
  - Olası neden yuvaların erken temizlenmesiyle misafir keşfinin genişlemesi (kanıtlanmadı).
  - Aynı iddia I500 I3'te ve Node `mp_techlux0_intel_test` (3/0) ile geçiyor. Fikstür gevşetilmedi; kontrol bu hücrede ön koşulsuz kaldı (FAIL olarak sayılır, kusur bulunmadı).
- Görünürlük (J3): misafir temassız devleti, gizli filoyu, başka devletin kaynağını, AI iç planlarını görmüyor (FA A3, MP8 SYNC `leak` [] her turda).
- AI insan adına federasyona katılmıyor, oy kullanmıyor, ayrılmıyor, savaş ilan etmiyor (M1–M3, FA A1–A2; `e.ai` kapıları); başkasının filosu yönetilmiyor (jointOps insan filosunu kullanmaz, `jointSelect`).

## 21. Performans

Araç: `research/ticaret-teslim-degeri0/perf-abba.cjs`. Aynı Node sürecinde iki vm; her örnek aynı Save8'den bir ay; ABBA sırası; N=24 / kol. Ölçüm sessiz makinede yapıldı.

**İlk ölçüm (p55'in kendi kayıtları):**

| Kayıt | Ortalama A (p55) → B (aday) | Fark | p50 | p95 |
|---|---|---|---|---|
| 100/9 m120 | 389,03 → 375,65 ms | −%3,44 | −%4,27 | −%2,84 |
| 500/16 m120 | 2167,42 → 2392,38 ms | **+%10,38** | +%7,35 | +%6,72 |
| 500/16 m180 | 7142,05 → 7651,04 ms | **+%7,13** | +%4,99 | +%16,61 |
| 500/16 m122 siyasi stres (K2) | 5668,44 → 5708,23 ms | +%0,70 | +%0,33 | −%2,33 |
| A/A 100/9 m120 (p55 ↔ p55) | 469,04 → 430,94 ms | −%8,12 | −%5,92 | −%7,33 |
| A/A 500/16 siyasi | 5520,05 → 5431,74 ms | −%1,60 | −%0,54 | +%0,02 |

**Kök neden (ölçüldü, `prof.cjs`):**
- p55 kaydı aday kodla ilk açıldığında, birikmiş tür uyumsuz üyeler aynı ay reform önergesi açıyor.
- 500/16 m120'de 2 önerge: 155 ms + 88 ms. Maliyet motorun `proposeFedMotion` → `fedChange` → `dealTxBegin` tam grafik kopyası; bu, insanın önergesiyle aynı yol.
- Sonraki aylarda çağrı yok (`_fedReformAsk`, `_fedPoliticsAfter` +360).
- ABBA her örnekte o ilk ayı yeniden ölçtüğü için bir kerelik patlamayı 24 kez sayıyor.
- Doğal oyunda üye önergesi 15 kampanyada (≈3.000 ay) 42 kez: ayda ≈0,014 kez.

**Sürekli durum** (kayıt aday kodla bir ay ilerletildi, birikim çözüldü; iki kol aynı kayıttan):

| Kayıt | Ortalama A (p55) → B (aday) | Fark | p50 | p95 | Save8 SHA |
|---|---|---|---|---|---|
| 100/9 m121c | 363,61 → 365,08 ms | +%0,40 | +%0,06 | +%2,59 | **aynı** (aday o ay birebir aynı işi yapıyor) |
| 500/16 m121c | 1757,18 → 1740,48 ms | −%0,95 | −%0,61 | −%6,99 | farklı |
| 500/16 m181c | 7116,77 → 7091,71 ms | −%0,35 | +%0,84 | −%0,99 | farklı |
| 500/16 m122 siyasi stres | 4964,77 → 5077,80 ms | +%2,28 | +%3,27 | +%2,23 | farklı |
| A/A 500/16 m121c | 1650,98 → 1633,86 ms | −%1,04 | −%0,64 | −%5,36 | aynı |

Değerlendirme:
- Sürekli durumda ortalama / medyan her kayıtta ≤ %5: **PASS**.
- İlk ay sıçraması (+%10,38 / +%7,13) doğrulanmış bir kerelik maliyet. Kaynağı motorun mevcut işlem kopyası; açıkça not edilir.
- Yeni işlevlerin kendi maliyeti 500/16'da ayda: `aiFedMismatch` 0,6 ms, `aiFedStayReview` 1,1–1,5 ms.
- Ödül döngüsünde görünür küme döngü dışında (500 sistem × çağrı yerine fleet başına bir `aiView`).
- jointOps iş bütçesi değişmedi (`jointTick` 0,2–0,6 ms, iki kolda aynı).
- Harita çizimi ölçülmedi: çizim kodu değişmedi, NOT RUN.
- Kanıt: `evidence/fed-ai-siyaset0/perf/`.

## 22. Tam Node testi

`STARS_TEST_WORKERS=4 node tests/run-all.js` (p56 ağacı, kontrol kökü verilmeden; taban ile aynı koşul):

| | p55 tabanı | p56 adayı |
|---|---|---|
| Paket | 253 | **256** (+3: `fed_ai_siyaset0_test`, `_mp_test`, `_equivalence_test`) |
| PASS | 6.632 | **6.649** (+14 kontrollü vaka, +3 MP; eşdeğerlik kökü verilmeden 0/0 NOT RUN) |
| FAIL (tarihsel) | 279 | **279** |
| FAIL paketi | 56 | 56 |

- 56 FAIL paketinin listesi, paket başına PASS/FAIL sayılarıyla birlikte p55 listesiyle **birebir aynı** (`diff` boş; `evidence/fed-ai-siyaset0/node/fail-listesi.txt`). Yeni FAIL yok.
- 279 tarihsel FAIL kaybolmuş gibi raporlanmadı. Örnek `faz96h71_closed_joint_save_test.js` 8/2: iki sürümde de aynı.
- ZIP üretildikten sonra yeniden: `faz90rc_release_candidate_test` 15/0, `mp_pwa_surum0_test` 5/0.
- Eşdeğerlik testi kontrol köküyle ayrıca 4/0 (§19).
- Koruma (preservation) zincirinde yeni FAIL yok. p50–p55 fazları ai.js için pin bırakmamıştı; bu faz da bırakmadı.
- Tam koşudan sonra yeniden yazılan denetim dosyaları (audit-95d, audit96e1, navy-95a) geri alındı.

## 23. Yayın kararı

**p56 / MP.8.9b55 otomatik testlerden geçmiş yayın adayıdır.** Taslak PR; main'e birleştirilmedi; canlı Render değiştirilmedi.

Yayın engelleri:

| Engel | Durum |
|---|---|
| Gizli diplomatik temas / harita sızıntısı | yok (T5/T6, FA A3, MP8 `leak` []) |
| İnsan adına AI siyasi kararı | yok (M1–M3, FA) |
| Federasyon üyeliğinde çift işlem | yok (MP `beta_rival_blocs0_mp`, FA A2 dönüş yok) |
| Federasyon fonunda çoğaltma | yok (M3, FA A2 fon aynı; `beta_fed_fleet0` 11/0) |
| Ortak filoda yetkisiz kontrol | yok (jointOps değişmedi; `faz95c` 59/0) |
| Hatalı ortak muharebe | yok bulunan |
| Savaş hedefi / taraf bozulması | yok (eşdeğerlik, savaş paketleri) |
| Bozuk Save8 | yok (p55 kaydı bayt bayt aynı; v8) |
| MP desync | yok (SYNC her turda eşit; I500 15 dk) |
| Ticaret / savaş desteği regresyonu | yok (tam Node paket bazında aynı) |
| Yeni Node FAIL | yok (256 / 6.649 / 279) |
| Doğrulanmış ciddi perf gerilemesi | yok (sürekli durum ≤ %2,3) |

Açık riskler (engel değil, açıkça):
- Filo gücü −%5,8 eğilimi (anlamsız).
- Koloni iki 100/9 hücresinde bandın altında.
- İlk ay reform önergesi maliyeti (bir kerelik).
- F5 aralıklı zaman aşımı.
- I100 I3 ön koşulu.

**NOT RUN:** fiziksel Android, gerçek uzak internet, LAN, canlı Render, 500/16 240 ay kampanyası, harita çizimi perf ölçümü.

## 24. Sonraki geliştirme alanlarına devir

`reports/claude/FED-AI-SIYASET0-DEVIR.md`.

## 20 soru

1. **Rakip federasyon AI'sı p55'te gerçekten çalışıyor muydu?**
   - Kuruluş ve katılım çalışıyordu: 7 kampanyada 21 kuruluş, 20 katılım, 46 başvuru.
   - Rakip blok indirimi (`fedCounterBloc`) de çalışıyordu.
   - Çalışmayan yarı çıkıştı: 3.556 kalış değerlendirmesinde gerilim hiç oluşmadı, 0 ayrılış. Üyeler reform önermiyordu.

2. **Hangi koşullarda yeni federasyon kurmak yerine mevcut olana katılıyordu?**
   - Katılım, kuruluştan önce denenir (`aiRivalBlocChoice`). Koşullar: temaslı bir üye, `canRequestFederation` ve `aiFedWilling` (ilişki, güven, bilinen yardım rotası).
   - Katılım yoksa kuruluşa bakılır: kurucu adayı, puan ≥0,5, ortak razı, Etki ≥ bedel.
   - p55'te tür uyumu katılımı engellemiyordu. Adayda tür uyumsuz ve desteksiz birliğe katılım yok.

3. **Bazı kampanyalarda neden tek büyük federasyon oluşuyor?**
   - Katılım tür uyumuna bakmıyordu, üye ses / çıkış yolu yoktu, ilişki barışta 100'e doyuyordu.
   - Bir kez katılan zıt doktrinli üye kalıcıydı (§4).
   - Adayda en büyük blok payı 15 hücrede −0,074 (t≈−2,2).

4. **AI neden mevcut federasyonundan nadiren ayrılıyor?**
   - p55'te hiç ayrılmıyordu: `aiFedStayReview` çatışma formülünde ilişki ve uyum terimleri doyunca toplam en çok −0,10 oluyordu, eşik 0,15 (ölü kod).
   - Adayda çözülemeyen tür uyumsuzluğu çatışmaya giriyor: 15 kampanyada 9 ayrılış, aynı AI en çok bir kez. Uyumlu ve güçlü birlikler sürüyor (F3).

5. **Federasyon üyeleri kendi stratejik çıkarları doğrultusunda oy veriyor mu?**
   - Yasa oylarında evet: `aiFedVoteAssessment`, ekonomik kriz, pahalı yasaya ret (F6).
   - Reform oylarında p55'te hayır: doymuş iyi niyet her reformu geçiriyordu.
   - Adayda reform oyu tür uyumu farkına göre veriliyor (F7). 17 reform oyunun 2'si geçti.

6. **Dört federasyon türü doğal kampanyalarda gerçekten farklı sonuçlar üretiyor mu?**
   - Kontrollü deneyde evet (§7):
     - bilimsel: iki tohumda da en yüksek araştırma / teknoloji;
     - askerî: t11'de en yüksek filo;
     - ticaret: t11'de en çok koloni;
     - yağmacı: t404'te en zayıf filo, üyeler türü reformla değiştirdi.
   - Tür değişimi karar düzeyinde de görülüyor (reform, ayrılış, dağılma). Her tür her kampanyada üstün değil.

7. **Büyük galaksilerde diplomatik temasın düşük kalmasının gerçek nedeni nedir?**
   - Mesafe ve keşif gemisi yokluğu. İlk 10 yılda temassız çiftlerin %65–70'i ≥8 sıçrama uzakta; %10–25'inde AI'nın bilim filosu yok.
   - Temas yalnız fiziksel varışla kurulur; sensörle görmek temas değildir.
   - 500/16'daki bazı yüksek oranlar ayrılıkçı devletlerin herkesle temasla doğmasından geliyor (`contact0`).

8. **Keşif AI'sında kanıtlanmış önemli bir fırsat kaybı var mı?**
   - Evet, bir tane. Keşif gemileri yuva / kalıntıya girmiyor; ödül avı yalnız girilmiş sistemlere bakıyordu. Bu yüzden geçidi tıkayan yuvalar hiç hedef olmuyordu (p55 t11 120. ay: keşfedilmemiş sistemlerin tamamı bu geçitlerin ardında).
   - Görünür yuva / kalıntı av listesine eklendi.

9. **Temas iyileştirmesi gerçek diplomatik etkileşimi artırdı mı?**
   - Kısmen. Kurucu AI teması +0,06 (t≈1,5), keşif +0,064 (t≈1,9): pozitif ama sınırda anlamlı.
   - Yuvalar belirgin biçimde erken temizleniyor.
   - Diplomatik etkileşim artışı kanıtlanmış iddia edilmiyor.

10. **Gizli bilgi kuralları korundu mu?**
    - Evet. Hedef yalnız şu an sensörle görülen yuva / kalıntı; bellek varyantı da reddedildi.
    - Temassız devlet bilgisi, gizli güç, bilinmeyen savaş, sensör artışı yok.
    - Misafir aynasında AI iç siyaset alanları yok (FA A3). T5 / T6 testleri.

11. **Federasyon savaşına katılan AI neden bazen pasif kalıyordu?**
    - Pasiflik `fedDefend` kapılarından geliyor: Konsey / doktrin savaş engeli, saldırganın müttefiki olmak, savaş / ittifak / saldırmazlık koşulu, `aiDefenseShirk`.
    - Ayrıca `declareWar` içindeki Konsey yasağı / erişim kapısı.
    - Kod hatası bulunmadı (§12).

12. **Vasal AI neden bazen askerî katkı sağlamıyordu?**
    - Sözleşmede katılım yoksa (`war` ≠ `all` / savunma savaşı değil) vasal savaşa girmez.
    - Girdiğinde jointOps kuralları geçerli: bilinen rota, ikmal, kendi savunması.
    - Kural; değiştirilmedi.

13. **jointOps içindeki hangi mekanikler gerçekten iyileştirildi?**
    - Hiçbiri: kod kusuru kanıtlanmadı.
    - Huni ölçüldü (§11): bağlamların çoğu tek başına; ret nedenleri rota, ikmal, kuvvet, kendi savunması.
    - E6 gereği sınırlar kanıt olmadan gevşetilmedi.

14. **Ortak harekâtların ne kadarı gerçek filo hareketine dönüştü?**
    - Aday 7 kampanyada 6 plan kurdu, 6 filo hedefe vardı (p55: 0 plan).
    - Fark kodun değil, farklılaşan savaş tarihinin sonucu: plasebo kolları da 0–4 plan üretiyor.

15. **Kaçı gerçek muharebe veya savunma katkısı üretti?**
    - Adayda 4 görev tamamlandı; bunlardan 1 savunma, 2 sistem ele geçirildi, 1 iptal.
    - Diplomatik katılım ayrı satırda raporlandı, askerî başarı sayılmadı.

16. **Yeni siyasi davranış gereksiz savaş veya federasyon yığılmasına neden oldu mu?**
    - Hayır. Yığılma azaldı (en büyük blok −0,074), bağımsız devlet arttı.
    - Açık cephe sayısı plasebo bandında, elenme +0,13 (anlamsız).
    - Tek risk örneği (`candV` t23): geçen bir reformdan sonra farklılaşan bir savaş. `candW`'de aynı tohum bant içinde.

17. **Genel AI ekonomik ve askerî başarısı korundu mu?**
    - Plasebo gürültüsü içinde: koloni −%3,0 (t≈−0,7), gemi +%1,6, elenme +0,13.
    - Filo gücü −%5,8 (t≈−1,4): anlamlı değil ama negatif eğilim. Raporlandı.
    - Koloni iki hücrede (100/9 t99, t404) bandın altında. Açık risk.

18. **500 sistem / 16 AI performansı güvenli mi?**
    - Sürekli durumda evet: m121c −%0,95, m181c −%0,35, siyasi stres +%2,28 (A/A −%1,04).
    - p55 kaydının aday kodla ilk açıldığı ayda birikmiş reform önergeleri bir kerelik +%7–10 maliyet getiriyor. Kaynak motorun `dealTxBegin` kopyası; doğal oyunda önerge ayda ≈0,014 kez.

19. **Multiplayer ve Save8 doğru çalışıyor mu?**
    - Save8: eşdeğerlik 4/0, p55 kaydı bayt bayt aynı yeniden yazılıyor, paket kabulü p41–p55.
    - MP: Node 3/0; FA 5/0, L 6/0, M 5/0, SD 3/0, SG 5/0, J 5/0, Q 8/0, I500 (15 dk) 4/0.
    - F 5/1 (F5 aralıklı; tekrar 6/0, p55 tekrar 6/0) ve I100 3/1 (I3 ön koşulu; p55 4/0): §20.
    - AI insan adına öneri, oy, ayrılış yapmıyor.

20. **p56 güvenli yayın adayı mı?** Evet, otomatik kabulle (§23). Yayın engellerinden hiçbiri bulunmadı; açık riskler ve NOT RUN kalemleri §23'te.

