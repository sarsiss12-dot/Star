# STARS — FAZ 96H.8: Askerî Sefer Verimliliği, Sefer Maliyeti ve Donanma Koruması

**Karar: aday 2b kabul edildi; oynanabilir sürüm 96H.8 (build `96h8`, PWA `stars-v96h8`, Save v8).** Değişiklik yalnız `ai.js` içindeki askerî sefer kararındadır. Ekonomi eşikleri, galaksi sınırları (100 sistem / 11 AI), diplomasi, federasyon, terhis kuralı, Save şeması ve RNG tüketim sırası değişmedi. Kanıtlar `research/96h8/` içinde.

## 1. Kaynak

Başlangıç `main` HEAD `698874ce2d25c7bddbc17021f2cd825c48b87712` (96H.7.1). ZIP `stars-faz96h71.zip` SHA-256 `2c85cc5e…ae3b`, CRC ve 19 dosyalık manifest doğrulandı. AI SHA-256 `f48608cc…d8d0`.

Seed11 ay-60 Save'i kanonik `research/96h61/replay.js` ile yeniden üretildi. Bu Save, 96H.7'deki devlet1 kaydıyla birebir aynı: `failedTargets {6:2160}`, `lastProgress 840`, `phase supply`. Kontrol ay 84'te 96H.7'nin sonuçlarını verdi: güç 10323, 81 gemi, 22 teknoloji. Kontrol 8 seed × 120 ay H61 toplamlarını (14 kritik / 455 teslim / 331 teknoloji / 129 koloni / 1386 gemi / 187795 güç), 4 seed × 240 ay ise 62 kritik / 1073 teslimi birebir yeniden üretti. Gözlem düzeneği saf: kontrol kolunun ay-84 Save SHA'sı (`652da1c9…`) ve RNG'si, gözlemcisiz koşuyla aynı.

## 2. Gerçek karar zinciri (seed11, devlet1)

1. **Kayan bekleme süresi.** Hedefe ikmalli rota yok ya da hedef başarısız listedeyken `supply` dalı `{...old}` ile eski `target` ve `lastProgress` değerlerini koruyor. Her AI turunda `G.day − lastProgress > 540` koşulu yeniden doğru çıkıyor ve `failedTargets[6] = G.day + 360` yeniden yazılıyor. Sonuç: 2160 → 2190 → … → 2790. Her ay bir `campaign-reassessed` olayı da sınırlı (32 kayıtlık) strateji geçmişini dolduruyor. Kilit kendiliğinden hiç bitmiyor.
2. **Kilit açılınca tam sevk.** `aiTurn` adım 4b, karar öncesinde rally noktasındaki boştaki savaş filolarını tek filoda birleştiriyor. Ay 72'de hazır liste yalnız 24 gemilik 109 numaralı filo (3766 güç). İhtiyaç 133,75 (tahmini savunma × 1,25). Eski kod `for(f of ready) aiMove` ile hepsini gönderiyor.
3. **Gerçek bakım.** `fleetUpkeep` evde ×0,5 uyguluyor; yabancı sistemde ×1 × (1 + (1 − ikmal) × 2,2). Hedefte ikmal 0,55 olduğu için çarpan ×1,99, yani evdekinin yaklaşık 4 katı. Filo bakımı 98'den 350'ye çıkıyor; enerji neti +21'den −231'e düşüyor. Alaşım bakımı da ikmal açığıyla artıyor (+11,6 / ay).
4. **Terk edilmiş konuşlanma.** Hedefteki filonun ikmali 0,55; `force` listesine girme koşulu `> .55` olduğu için filo listeden düşüyor. Sefer onu ne sayıyor ne geri çağırıyor. Lojistik geri çekilme de sağlıklı savaşçı filoda tetiklenmiyor.
5. **Terhis.** Ay 77'de stok/açık oranı 5,4 ay, yani savaştaki kriz eşiği olan 6 ayın altında. `aiDisbandTick` 31 gemiden 22'sini siliyor. Kesinti **taban** bakımla (`SHIPS.up`) sayılıyor, ama gerçek tasarruf konum çarpanlı. Bu yüzden net −204'ten +93,5'e çıkıyor: açığın çok üstünde kesilmiş. Kayıplar muharebe kaybı değil.
6. **Hedef koloni.** Kolonili sistem yalnız yörünge zaferiyle düşmüyor; kara işgali gerekiyor. Pahalı yığın orada yalnız kuşatma yapıyor.

Aynı çöküş biçimi değiştirilmemiş kontrolde de var. Seed11 devlet3, ay 49'da savaştayken (uzak bakım 144, ev bakımı 4) 12 gemisini terhis ediyor.

## 3. İstenen sorular

| Soru | Kanıtlı yanıt |
|---|---|
| A. Evde ↔ uzakta enerji | Ev ×0,5; yabancı sistem ×1×(1+(1−ikmal)×2,2); ikmal 0,55'te yaklaşık 4×. 24 gemi için +243 enerji/ay. `faz96h8` testi, tahminin gerçek `fleetUpkeep` ve `fleetAlloyUpkeep` farkına 1e-9 hassasiyetle eşit olduğunu doğruluyor. |
| B. Emirden önce hesaplanıyor mu? | Hayır. 96H.7.1'de saldırı emri bakım kontrolü yapmıyordu. `aiWarAccess` yalnız erişim ve güce bakıyor. Benzer hesap yalnız federasyon savaş oyunda vardı (`aiFedWarBurden`). |
| C. Eksik bakım | `aiEconomyPlan` ve `aiShipPurchaseSustainable` taban gemi bakımını görüyor; konuşlanmanın ev→dış (×2) ve ikmal açığı çarpanını görmüyor. |
| D. Gönderilen ↔ hesaplanan filo | Farklı. Güç kontrolü ulaşılabilir tüm kuvvete bakıyor; gönderilen, birleştirilmiş tüm yığın (ihtiyacın 28 katı). Bütçe gönderilen filoyu hiç hesaba katmıyordu. |
| E. Güç yeterli = ekonomi yeterli mi? | Hayır. 3766 güce karşı ihtiyaç 133,75; net +21 iken tam sevk −231/ay. |
| F. `aiDisbandTick` | `e.res.ene` ve `e.inc.ene` kullanıyor; kalan ay = stok/−net. Kriz: kalan < 6 ay veya stok < 40. Sıkıntı: < 18 ay. Savaşta yalnız kriz ya da kapasite aşımında terhis. Kesinti hedefi 1,25 × açık, **taban** bakımla sayılıyor. En ucuz sınıftan başlıyor, konumdan bağımsız. Savaşta gücü 400'ün altındaki filoya dokunmuyor. |
| G. Planlayıcı terhisi görebiliyor mu? | 96H.7.1'de hayır. 96H.8'de sevk aynı formülle önceden ölçülüyor; konuşlanma da terhisin kendi girdileriyle izleniyor. |
| H. Çelişkiler | (1) Bekleme her ay yeniden yazılıyor. (2) 6 aylık satın alma kuralı ile 6 aylık terhis krizi birlikte, açık bütçeli her sevki (S − 6D)/D ay sonra terhise götürüyor. (3) Düşük ikmalli konuşlanma `force` dışına çıkıyor. |

## 4. 96H.8 karar mekanizması (aday 2b)

Yeni sayısal parametre yok; kullanılan bütün süreler mevcut kurallardan türetildi.

1. **Sabit bekleme.** Başarısız hedef kaydı yalnız ilk kez yazılıyor. Süre dolunca aynı hedef yeni bir ilerleme penceresiyle (`since` / `lastProgress` = bugün) yeniden deneniyor.
2. **Gerçek sevk maliyeti** (`aiDeploymentUpkeep`). Gönderilecek gerçek filoların hedefteki enerji ve alaşım bakım farkı, `fleetUpkeep` ve `fleetAlloyUpkeep` ile aynı formülle hesaplanıyor.
3. **Sürdürülebilirlik** (`aiDeploymentSustainable`). Yeni net = min(`e.inc`, plan neti) − fark. Açık varsa stok ≥ 12 × açık olmalı. 12 = 180 günlük mevcut sefer tutma süresi (6 ay) + `aiDisbandTick`'in savaş kriz bandı (6 ay).
4. **Müfreze** (`aiCampaignDetachment`). Tam sevk karşılanamıyorsa, hedefe zaten bağlı kuvvet de sayılarak aynı `need`'i karşılayan ve enerji+alaşım bakımı / güç oranı en düşük gemiler ayrılıyor. Ayırma, oyuncunun "filoyu böl" mekaniği gibi gerçek gemi nesnelerini ve gövdelerini taşıyor. Lider ana filoda kalıyor. Müfrezenin `capTarget` değeri kendi boyutu, böylece şablon onu 30 gemiye büyütmeye çalışmıyor. Bütün sevk karşılanabiliyorsa eski "hepsi birlikte" davranışı aynen korunuyor.
5. **Bekleme (`fund`).** Müfreze de karşılanamıyorsa emir verilmiyor, gemi bölünmüyor. Bu bekleme ilerleme sayılmıyor; 540 gün sonra hedef soğumaya alınıyor ve sonra yeniden deneniyor. Yani sonsuz kilit yok.
6. **Geri çağırma** (`aiRecallUnfundedDeployment`). Açık varken yabancı sistemdeki filolar, stok < açık × (6 + en uzun dönüş ayı + 1) olduğunda en yakın kendi ikmal düğümüne çağrılıyor. 6, terhisin kendi kriz eşiği; +1, aylık AI karar aralığı. Sevk kuralı (12 ay) ile geri çağırma kuralı (yaklaşık 8–10 ay) arasındaki fark gidip gelmeyi önlüyor.

Savunma önceliği, ortak sefer yetkisi, toparlanma dalı, hedef seçimi ve `aiWarAccess` değişmedi. Yeni kod `rnd()` çağırmıyor.

## 5. Adaylar

| Aday | İçerik | Sonuç |
|---|---|---|
| 96H.7 yaması (kontrol kolu) | Yalnız bekleme düzeltmesi | Seed11 ay 60→84: 22 terhis, güç −%52. 120 ayda konuşlanma kaynaklı terhis 27 gemi. Ret korunuyor. |
| Aday 1 | Bekleme + maliyet kapısı (yalnız tam filo) | **RED.** Seed11 ay 72'de tek sevk adayı birleştirilmiş 24 gemilik yığın; devlet1 hiç saldırmıyor (yapay pasiflik). |
| Aday 2a | + müfreze | **YERİNE 2b.** 120 ayda seed11 devlet1 ay 66'da sınırda geçen tam sevk açık uçlu kaldı; ay 78'de 15 gemi terhis. |
| **Aday 2b** | + konuşlanma geri çağırma | **KABUL.** Aşağıda. |

2a → 2b geçişi bir parametre ayarı değil: eksik kalan yaşam döngüsü adımı, aynı ilke ve aynı mevcut eşiklerle eklendi. İki sürümün sonuçları da kanıtta korunuyor.

## 6. Aynı Save karşılaştırmaları (24 ay)

Kontrol + 4 plasebo bandı (PL): AI mantığı aynı, ilk tetik gününde 1–4 ek RNG çekimi. Bu bant kaotik ayrışmanın ne kadar fark üretebileceğini gösteriyor.

| Pencere / devlet | Kol | Gemi | Güç | Enerji (başlangıç→son) | En düşük net | Terhis | Saldırı ayı | Bekleme döngüsü |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| seed11 ay 60, devlet1 | kontrol | 19→38 | 5421 | 1998→2236 | −5,5 | 0 | 0 | 21 |
| | 96H.7 ret | 19→15 | 1771 | →1695 | −231,2 | **22** | 1 | 0 |
| | aday 1 | 19→38 | 5421 | →2236 | −5,5 | 0 | 0 gerçek sevk* | 0 |
| | **96H.8** | 19→36 | 5202 | →**2298** | −5,5 | 0 | **11** | **0** |
| | PL bandı | 37–39 | 5385–5577 | 2108–2174 | −5,5…−24,8 | 0 | 0 | 21 |
| seed11 ay 40, devlet3 | kontrol | 12→1 | 175 | 490→986 | −71,8 | **12** | 4 | 0 |
| | **96H.8** | 12→**23** | **4227** | →1061 | −28,0 | **0** | 6 | 0 |
| | PL bandı | 0–1 | 0–198 | 1333–1432 | −70…−75 | **12 (hepsi)** | 4 | 0 |
| seed23 ay 15, devlet5 | kontrol | 7→13 | 2450 | 296→869 | −25,6 | 0 | 14 | 0 |
| | **96H.8** | 7→**16** | **3123** | →992 | **−3,5** | 0 | 17 | 0 |
| | PL bandı | 12–13 | 2212–2441 | 740–854 | −25,6 | 0 | 11–13 | 0 |

\* Aday 1'in kaydı 11 ay `attack` gösteriyor; bu, aday 1'deki etiket hatasından geliyor ("yeterli kuvvet sevk edildi" yazıyor ama hiçbir filo gönderilmiyor). Uzak bakım 24 ay boyunca 9,0'da kalıyor. 96H.8'de en yüksek uzak bakım 24,0: müfreze sevki gerçek.

Seed42 ve seed404 ay 60→84: sefer yok, kollar Save ve RNG düzeyinde aynı. Fayda kanıtı sayılmadı. Seed11 ay 60 penceresinin galaksi toplamı (gemi 81→66) PL bandının (48–81) içinde. Devlet5'in sevk kararları değişmedi; fark, devlet1'in değişen ekonomisinin etkileşim yoluyla yayılması.

## 7. Uzun kampanyalar

**8 seed × 120 ay** (kanonik protokol): 6 seed'de her ayın tam Save ve RNG hash'i kontrolle aynı (seed99'daki savaş dahil). Farklılaşan seed'ler seed11 (ay 42'den) ve seed23 (ay 16'dan).

| Toplam | Kontrol | 96H.8 |
|---|---:|---:|
| Kritik devlet-ay | 14 | 14 |
| Teslim | 455 | 443 (−%2,6) |
| Teknoloji | 331 | 335 |
| Koloni | 129 | 131 |
| Gemi | 1386 | 1405 |
| Güç | 187795 | 194060 (+%3,3) |
| Filo bakımı | 4214,8 | 4174,5 |
| Yaşayan devlet | 40 | 40 |
| Toplam terhis edilen gemi | 137 | 136 |
| Savaşta konuşlanma kaynaklı terhis | 12 | **0** |
| `campaign-reassessed` olayı | 38 | 2 |

**4 seed × 240 ay:** kritik 62→53, teslim 1073→1006, koloni 99→92, güç 249329→259018, yaşayan devlet 23→21. Kritik düşüşü bir **iyileşme sayılmadı**: kontrolde seed11 ay 218'de ve seed23 ay 207'de yeni devlet doğuyor, 96H.8 tek koşusunda doğmuyor.

Kaos ayrımı (seed11 ve seed23, 240 ay, her kol 5 örnek): uzun dönem dağılımları örtüşüyor.

| Seed11 ay 240 | Kontrol ort. [min..maks] | 96H.8 ort. [min..maks] |
|---|---|---|
| Teslim | 199,4 [181..207] | 201,6 [151..293] |
| Koloni | 18 [14..22] | 19,2 [12..23] |
| Güç | 37742 | 43229 |
| Kritik ay | 23,2 [0..55] | 15,4 [1..41] |

Seed23'te teknoloji ortalaması 120 ayda 33,6 → 29,2 ve 240 ayda 75 → 68,8, aralıklar örtüşüyor; açık bir sorun olarak izleniyor. Tek koşuda görülen seed11 ticaret ve koloni düşüşü dağılımda doğrulanmadı.

Seed11'de devlet3'ün donanması bandın çok dışında korunuyor: güç ay 60'ta 3831 (bant 0–198), ay 90'da 7800 (0–1221), ay 120'de 6851 (0–4474). Devlet4 ve 5'in ticaret kaybı, artık yaşayan bir düşman donanmasıyla savaşmalarıyla açıklanıyor.

## 8. Performans

`aiMilitaryCampaign` çağrı başına 0,34 → 0,38–0,40 ms (Node VM, seed11, 60 ay). Çağrı sayısı 138 → 187, çünkü devlet3 donanmasını koruyup savaşıyor. AI turu toplamı değişmedi (~3,3–3,5 ms). Bu bir mobil ölçüm değildir.

## 9. Açık sorunlar

- Kolonili hedef kara ordusu olmadan düşmüyor. Müfreze ucuz bir kuşatma yapıyor; işgal ve ordu koordinasyonu ayrı iş.
- `aiDisbandTick` kesintiyi taban bakımla sayıyor (aşırı kesinti). 96H.8 bu duruma girmeyi önlüyor, kuralın kendisini değiştirmedi.
- Seed23'te uzun dönem teknoloji ortalaması hafif düşük (gürültü içinde).
- Seed11/404 geç dönem yeni devlet ekonomisi, ticaret yatırım getirisi ve fiziksel Android: NOT RUN / açık.
