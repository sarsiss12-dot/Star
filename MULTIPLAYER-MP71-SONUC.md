# STARS — MP.7.1: tek STARS arayüzü, iki oyun modu

**Durum:** geliştirme sürümü.
- Runtime değişmedi (19 dosya MP.7 ile bayt-bayt aynı): oyun yayını hâlâ `96h10p2`, PWA `stars-v96h10p2`, Save8. Yeni ZIP yok.
- Taban: MP.7 `323b0ae` (PR #24). Zincir #17 → #24 açık; hiçbiri merge edilmedi.

## 1. İlke

Tek oyunculu ve çok oyunculu aynı STARS ekranlarını kullanır:
- anlaşma penceresi (MÜZAKERE);
- gelen kutusu (bildirim kartı + Galaktik Haber Ağı → Gelen kutusu);
- federasyon, vasallık, savaş, casusluk, borsa, filo / gezegen pencereleri.

Fark yalnız yürütmededir:
- **Tek oyunculu:** oyuncu işlemi → motor.
- **Çok oyunculu:** oyuncu işlemi → host doğrulaması (`mp-core.js` `COMMANDS`) → aynı motor → ilgili oyunculara sonuç.

Ayrı "ÇOK OYUNCULU DİPLOMASİ" paneli (TİCARET / FEDERASYON / VASALLIK; DEVLETLER / GELEN / GÖNDERİLEN / GEÇMİŞ) artık oyuncuya gösterilmez: host'ta `#mp3HostBtn`, misafirde `#mp6DipBtn` yok.
- Modül dosyaları (`dip-ui.js`, `pol-ui.js`) yalnız eski tarayıcı testlerinin `window.MP7Legacy` kipinde açılır.
- MP.7'nin eski lobi kipiyle aynı yaklaşım; bir sonraki fazda eski testler taşınınca silinebilir.

## 2. Eski panelin envanteri → gerçek STARS karşılığı

| Eski panel işlevi | Gerçek STARS ekranı | Host | Misafir | Komut |
|---|---|---|---|---|
| DEVLETLER (temaslar, İNSAN/AI) | DİPLOMASİ → DEVLETLER / İLİŞKİ | motor | ayna | — |
| Teklif taslağı (kaynak ver / iste, miktar) | MÜZAKERE: Kaynak → kaynak → miktar → TASLAĞA EKLE; antlaşma maddeleri | **MP.7.1 yeni** (`UI.dealSend` → `offer`) | MP.6.1 | `offer` |
| ÖNİZLE (maliyet, engeller) | MÜZAKERE "TEKLİF ÖZETİ" (dealQuote; karşı tarafın stok satırları gizli) | **MP.7.1 yeni** (pencere çizilirken süzgeç) | MP.6.1 | — |
| GELEN: KABUL ET / REDDET | bildirim kartı → Gelen kutusu kaydı → KABUL ET / REDDET | **MP.7.1 yeni** (kart + kayıt + `respond`) | MP.6.1; **MP.7.1 kart** | `respond` |
| GELEN: KARŞI TEKLİF | kayıt → Karşı teklif hazırla → MÜZAKERE (orijinal ayrı kartta saklı) → TEKLİFİ SUN; kartta Kabul / Ret | **MP.7.1 yeni** | MP.6.1 | `counter` / `respond` |
| GÖNDERİLEN + GERİ ÇEK | Gelen kutusu penceresinde **Gönderilen** sekmesi (durum, şartlar, yanıt, GERİ ÇEK); MÜZAKERE sayfasında "BEKLEYEN TEKLİFLERİN" | **MP.7.1 yeni** | **MP.7.1 yeni** | `withdraw` |
| GEÇMİŞ | Gönderilen sekmesi (durum süzgeci: Sonuçlanan / Kabul / Ret / Karşı teklif / Geri çekildi / Süresi doldu / Geçersizleşti) + Gelen kutusu durum süzgeci | **MP.7.1 yeni** | **MP.7.1 yeni** (gelen geçmişi aynaya her kurulumda host deposundan) | — |
| AI yanıtı (kabul / ret / karşı) | bildirim + (karşı) gelen kutusu kartı | tek oyunculu yol (AI ile aynen) | MP.7.1 bildirim metni | `offer` |
| Rozet sayıları | üst çubuk "✉ n bekleyen diplomatik teklif", Gelen kutusu · n, Gönderilen · n | ✓ | ✓ | — |
| FEDERASYON GENEL: ayrıl | Federasyon paneli | motor | MP.6.1 `leaveFederation` | `fedLeave` |
| Başvuru (aracı üzerinden) | İLİŞKİ → federasyona başvur | motor | MP.6.1/6.2 (`canRequestFederation` host kararı) | `fedRequest` |
| Kuruluş önizleme / KUR | Federasyon kur penceresi | motor | MP.6.1/6.3 (`fedFoundQuote`) | `fedFound` |
| ÜYELER: DAVET ET | İLİŞKİ / üye kabul önergesi | motor | MP.6.1/6.2 | `fedInvite` |
| OYLAMALAR: EVET / HAYIR | Federasyon → oylamalar + gelen kutusu oy kaydı | motor (devlet 0 insan seçmen) | MP.6.1 | `fedVote` |
| YASA ÖNER / KALDIR | Federasyon → yasalar | motor | MP.6.1 | `fedLaw` |
| DAVETLER: KATIL / REDDET | gelen kutusu davet kaydı / federasyon daveti | motor | MP.6.1 | `fedReply` |
| (eski panelde yoktu) ihraç, başkan seçimi, reform, anayasa / oy rejimi, savaşa katılma, ortak savaş, kararlar, hibe | Federasyon paneli | motor | MP.6.3 | `fedMotion`, `fedExecute`, `fedGrant` |
| VASALLIK DURUM: yeniden müzakere / bağımsızlık iste | vasallık sözleşmesi penceresi (renew / release) | motor | MP.6.1/6.3 | `vassalOffer` |
| VASALLIK GELEN: KABUL / RED / KARŞI TEKLİF | gelen kutusu vasallık kaydı → müzakere penceresi | motor | MP.6.1 | `vassalReply` |
| VASALLIK TEKLİF: talep / himaye, ÖNİZLE, GÖNDER | vasallık sözleşmesi penceresi (tür, hükümler, maliyet) | motor | MP.6.1/6.3 (`canDemandVassal` / `canSeekProtection` host kararı) | `vassalOffer` |
| (eski panelde yoktu) bağımsızlık desteği | İLİŞKİ | motor | MP.6.3 | `supIndep` |

**Host'ta neden yalnız ticaret teklifleri eksikti:**
- Federasyon ve vasallık işlemlerinde host'un gerçek pencereleri motoru doğrudan çağırır:
  - motor insan alıcı için karar vermez (`vassalDriveAI` yalnız `ai` devlette yürür; federasyon oylamasında insan seçmen atlanır — MP.3.1);
  - bu yüzden ayrı panel bu işlevler için gereksizdi.
- Ticarette ise `aiRespond` uzak insan için `bekle` döndüğünden host'un anlaşma penceresi insana teklif gönderemiyordu. İnsandan gelen teklif de yalnız ayrı panelde görünüyordu. MP.7.1 bu iki boşluğu kapatır.

## 3. Köprü: `research/mp71/client/mp71-dip.js`

Host ve misafir aynı modülü kullanır. Rol bağdaştırıcısı kimlik eşlemesini, görünümü ve komut gönderimini verir:
- **host:** `mp1-host.js` `mp71Tick`, `host.local()`;
- **misafir:** `guest-stars.js`, ağ üzerinden `cmd`.

**Ortak:**
- **Gönderilen sekmesi:** `ArchiveUI.shell` sarılır; Haberler / Gelen kutusu yanına üçüncü sekme eklenir.
  - Liste ve ayrıntı STARS'ın kendi `archiveRow` / `archiveDetail` biçimindedir.
  - GERİ ÇEK iki adımlı onayla çalışır (450 ms çift dokunma koruması; sonuç gelene kadar aynı teklif için ikinci komut gitmez).
- **MÜZAKERE sayfası:** sayfanın sonundaki kutu karşı tarafın insan olduğunu ve bu devlete bekleyen tekliflerini gösterir (GERİ ÇEK burada da var).
- **Canlı güncelleme:** host görünümü değişince açık Gönderilen listesi yerinde güncellenir (pencere kapanmaz, kaydırma korunur). MÜZAKERE kutusu yalnız kendi öğesini değiştirir (taslak ve kaydırma korunur).
- **KARARIN ETKİSİ metni:** çok oyunculu kayıtta doğru metin gösterilir. Tek oyunculu AI teklifinin ret yaptırımları (27 ay bekleme, ilişki −5) MP.3 retinde uygulanmaz; eski metin bunu yanlış söylüyordu.
- **Durumlar** (host'un teklif deposundan):
  - Bekliyor, Kabul edildi, Reddedildi, Süresi doldu;
  - Karşı teklif (gönderende "Karşı teklif geldi · senin yanıtın bekleniyor / kabul edildi / reddedildi");
  - Geri çekildi (depoda `invalid` + "Gönderen geri çekti"; gelen kutusunda Geçersizleşti · Gönderen geri çekti);
  - Geçersizleşti.

**Yalnız host** (motoru yürütür; davranış yalnız karşı taraf **uzak insan** olduğunda değişir, AI ile her şey tek oyunculu gibi):
- **TEKLİFİ SUN:** `offer`; gelen kutusundan açılan karşı teklif bağlamında `counter`.
  - Yalnız MP.3'ün desteklediği maddeler gönderilir: kaynak, barış, saldırmazlık, ticaret, ittifak, sensör, geçiş.
  - Teknoloji / sistem / haraç / lüks / savaş sözü / casusluk ağı gönderilmez; misafirdeki açıklamanın aynısı gösterilir.
- **Önizleme süzgeci:** anlaşma penceresi çizilirken `dealQuote` sonucundan karşı insanın stok satırları düşer (MP.3 `dipGate` ile aynı kural). Motorun kendi `dealQuote` çağrıları (AI kararları, `executeDeal`) etkilenmez.
- **Gelen kutusuna kayıt:** insan → host teklifi `UI.notify` ile gerçek bildirim kartı + `DiplomaticInbox` kaydı olur (anahtar: motorun `deal:` imzası + doğuş günü; tek kez).
- **Karar:**
  - kayıttaki kabul / ret `respond` komutuna gider;
  - kapı host deposu + `dealQuote`'tan geçer; gönderenin stok satırları yerine "Karşı taraf bu şartları şu an karşılayamıyor" gösterilir;
  - karşı teklif kartındaki ✔ / ✕ da `respond` komutuna gider.
- **Durum eşlemesi:** sonuçlanan teklifin kaydı güncellenir ve kartı kalkar. Kabulde motorun `executeDeal`'i kaydı kendisi "kabul edildi" yapar (`findDeal`); kart yine kaldırılır. Bu hata Node testiyle bulundu.

**Yalnız misafir:**
- Gelen MP.3 teklifleri (insan ya da AI) için host'taki gibi gerçek **bildirim kartı** çıkar; önceden yalnız kayıt vardı.
- Sonuçlanan teklifler de durumlarıyla gelen kutusu geçmişine girer. Ayna her kurulumda `G`'yi yenilediği için geçmiş host deposundan yeniden çıkarılır (son 40 teklif).

## 4. Kalıcılık

- **MP.3 teklif deposu** (`D.offers`, sonuçlananlar dahil son 160) MP.4 paketinde zaten vardı. Gönderilen sekmesi ve geçmiş kayıttan dönünce aynen gelir; paket biçimi değişmedi.
- **Host'un gelen kutusu kayıtları** `G.diplomaticInbox` içindedir. Save8 şeması değişmedi: var olan `aideal` türü kullanılır. Yüklenen dünyada kayıt anahtarla yine MP teklifine bağlanır; Node testiyle doğrulandı.
- **Misafirin gelen kutusu** kalıcı değildir; host deposundan her ayna kurulumunda yeniden çıkar.

## 5. Ek düzeltme: kurulum ekranının "hayalet tıklaması" (MP.7 hatası)

- **Sorun:** tek oyunculu kurulum ekranı dokunuşu `pointerup`'ta işler. MP.7'de DEVLETİ KAYDET / KAYDET VE LOBİYE DÖN kurulumu o anda kapatıyordu. Tarayıcının hemen ardından ürettiği sentetik `click` aynı noktadaki **lobi düğmesine** düşüyordu.
- **Etki:** yatay telefonda bu düğme ODAYI KAPAT'tı ("Oda kapatılsın mı?" kendiliğinden açılıyordu). Dikeyde başka bir düğmeye düşebilirdi. MP.7 testleri dikey koştuğu için görülmemişti; MP.7.1 yatay testi yakaladı.
- **Düzeltme:** `mp7-setup.js` kapanıştan sonraki 700 ms içindeki tek sentetik tıklamayı yutar (`setupClickHandler`'ın kendi eşleşme penceresi).
- **Test:** `browser-mp71` A1 ve B1 lobide istenmeyen pencere olmadığını denetler.

## 6. Diğer paneller denetimi

Misafirde MP komutu olmayan STARS eylemleri soluk görünür ve dokununca açık uyarı verir (MP.6). Liste arayüz kodundan çıkarılır ve `research/mp71/evidence/mp71-results.json` `metrics.unsupported` alanında yer alır. Ayrıntılı envanter `research/mp71/evidence/REGRESYON.md`'dedir. Yeni mekanik eklenmedi.

## 7. Testler

Ayrıntı: `research/mp71/evidence/REGRESYON.md`.

- **`tests/mp71_bridge_test.js` (Node, 8 vaka):**
  - insan → host teklifi gerçek gelen kutusunda;
  - kabul ve ret;
  - geri çekme ve süre dolumu;
  - gizlilik;
  - host'un gerçek anlaşma penceresi;
  - MP.4 paketi;
  - vasallık (AI karar vermez);
  - Save8 / RNG eşitliği.
- **`tests/browser-mp71.cjs` (Chromium, 12 vaka):** üretim kipi relay + parçalayan TLS vekili, yatay telefonlar 844×390 / 800×360 / 915×412, kararlar gerçek dokunmayla.
  - host + 1: zorunlu senaryo, karşı teklif, geri çekme, açık pencere, yetki / yineleme, bağlantı kopması, kayıt;
  - host + 2: insan ↔ insan karşı teklif, gizlilik.
- **Eski testler:** eski MP paneli testleri (browser-mp3 / mp31 / mp6) panelin eski kipinde sürer.

## 8. Açık konular

- **Kaynak ve antlaşma dışındaki maddeler:** teknoloji, sistem, haraç, lüks, savaş sözü ve casusluk ağı maddeleri insanlar arası teklifte yok (MP.3 kapsamı). Gerçek pencere bunu açıkça söyler.
- **MÜZAKERE eğilim satırı:** host'ta insan karşı tarafa da tek oyunculu AI değerlendirme satırı gösterilebilir (istihbarat ≥ 2). Bilgilendirici; karar etmez.
- **İstihbarat asimetrisi:** host'un istihbaratı ≥ 3 ise miktar seçiminde karşı insanın stoğu görünür. Bu tek oyunculu istihbarat kuralıdır; misafirin aynasında karşılığı yok.
- **Eski panel modülleri:** dosyalar eski test kipinde duruyor; eski testler gerçek ekranlara taşınınca kaldırılabilir.
- **Doğrulanmayan:** fiziksel Android ve canlı Render doğrulanmadı.
