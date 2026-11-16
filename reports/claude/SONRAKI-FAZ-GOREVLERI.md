# STARS — sonraki faz görevleri (MP-DEAL-SYS.0 sonrasında kaydedildi; MP-WARON.0 ve MP-TECHLUX.0 ile güncellendi)

15 Kasım 2026 · p35 / MP.8.9b33 tabanı; 16 Kasım 2026 güncellemeleri p36 / MP.8.9b34 (MP-WARON.0) ve p37 / MP.8.9b35 (MP-TECHLUX.0) · Kanonik pano: [#33](https://github.com/sarsiss12-dot/Star/issues/33) (55 madde). Bu belge yeni kalemleri panonun ilgili açık maddelerine bağlar; panonun satır durumları bu fazda **değiştirilmedi** (hiçbiri TAMAMLANDI değildir).

Durum değerleri panonunkilerdir: `PLANLANDI` = kayda girdi, geliştirme başlamadı; `TEST BEKLİYOR` = geliştirildi ve yerelde doğrulandı, kullanıcı / saha kabulü bekliyor (TAMAMLANDI değildir).

**Sıradaki geliştirme adayı: kullanıcı kararına göre NF-2b (lüks erişim hakkının ekonomik etkisi) ya da NF-3 (Casusluk Ağı / istihbarat maddeleri).**

| Kod | Görev | Bağlı pano maddesi | Durum | Bağımlılık |
|---|---|---|---|---|
| NF-1 | Genel Savaş Sözü (`warOn`) MP desteği | #16, #31, #40, #43 | `TEST BEKLİYOR` (MP-WARON.0, p36; son tarih sınırı düzeltmesi MP-TECHLUX.0 / p37; [rapor](MP-WARON0-SONUC.md)) | MP-DEAL-SYS.0 (tek işlemli teklif), WAR-COALITION.0 / BETA-WAR-GOALS.0 savaş motoru |
| NF-2 | Teknoloji ve Lüks Mal MP desteği | #40 (koalisyon pazarlığı), MP.3 müzakere | `TEST BEKLİYOR` (MP-TECHLUX.0, p37; [rapor](MP-TECHLUX0-SONUC.md)) | MP-DEAL-SYS.0 madde kapısı (`dipItems`), istihbarat düzeyi (`intelOf`) aynası |
| NF-3 | Casusluk Ağı / istihbarat maddeleri | #33 (casusluk paneli), MP.6.4 casusluk | `PLANLANDI` | Ayna gizlilik kuralı (`hitLog`, `framed`), MP.6.4 `spy*` komutları |
| NF-4 | Diğer diplomasi kısayolları (saldırmazlık, ticaret paktı, geçiş izni) | #32 (MP insan oyuncuya ittifak daveti), #22 | `PLANLANDI` | MP-DEAL-SYS.0 tek dokunuş İttifak Daveti (`UI.allyInviteSend`, `UI.mpQuickOffer`) sahada kabul edilmeli |
| NF-5 | AI müttefik desteği ve vasallık ölçümü | #40, #44 (ayrıca #16, #43) | `PLANLANDI` | Doğal kampanya düzeneği (`research/96h8/scripts/arm.js`, plasebo bandı), kontrol kökü sabit kopya |
| NF-2b | Lüks mal erişim hakkının (`luxGrant`) ekonomik etkisi — **kullanıcı kararı bekliyor** | #40, NF-2 | `PLANLANDI` | Tek oyunculu ekonomi davranış kararı (ayrı faz); kontrol–aday + plasebo bandı |
| NF-6 | Barıştırma (`peaceWith`) MP müzakere maddesi | #40, MP.6.2 barış | `PLANLANDI` | Savaş defteri (`warLedger`) cephe kimliği, MP-DEAL-SYS.0 tek işlemli teklif |

## NF-1 — Genel Savaş Sözü (`warOn`) MP desteği

**Durum (16 Kasım 2026, MP-WARON.0 / p36): `TEST BEKLİYOR`.** İlk sürüm şartı "bu devletle belirtilen tarihe kadar savaşa girme sözü". İnsan veren son tarihli söz verir (90 / 180 / 360 gün, karşı teklifte ⏱ ile değişir); kabulde savaş ilan EDİLMEZ, söz `e.warPledges` kaydına yazılır; veren savaşı kendi onayıyla normal savaş ilanı akışından açar → "Tutuldu". Son tarih geçerse mevcut söz bozma kuralı ("Çiğnendi": alan `paktBozdu` hatırlar, ilişki −20, hedefin adını vermeyen kamu haberi); hedef / taraf elenir, veren ile alan savaşa girer ya da son tarihte Konsey yasağı sürerse "Düştü" (ceza yok). Karşılık kabulde bir kez ödenir, iade edilmez (Toprak Vaadi ile aynı). AI veren son tarihli söz veremez: AI kabulde hemen ilan eder (tek oyunculu davranış). Tek oyunculuda son tarihsiz söz aynen kabulde ilan edilir. Yerel kanıt: Node 9/0 (p35 0/9), SP 5/0, eşdeğerlik 3/0, MP8 V 7/0. Açık: canlı Render, fiziksel cihaz, AI'nın kendiliğinden son tarihli söz istemesi / vermesi (yok; NF-5 ile ölçülür).

Tasarım: üçüncü devlete karşı söz. Hedef devlet, yürürlük süresi (gün), tetikleme koşulu (ör. "hedef ile verenin müttefiki savaşa girerse" ya da "kabulden sonra N gün içinde"), yükümlülük (savaş ilanı + en az bir cephe), söz bozulursa sonuç (mevcut `oathBreakRecord` / güven kaybı, ödenen bedelin iadesi). Aktif cepheye veya hazırlığa bağlı `warJoin` ile ayrı madde olarak kalır; ikisi aynı teklifte birlikte bulunabilir ama biri diğerinin yerine geçmez.

Kabul ölçütleri:
- İki tarafın açık rızası; söz yalnız kabul anında bağlayıcı olur, taslak / bekleyen teklif hiçbir şeyi bağlamaz.
- Savaş ilanı kuralları açık: konsey yasağı, saldırmazlık / ittifak çakışması, meşruiyet önizlemesi teklif ekranında görünür; ilan host motorunun `war` yolundan geçer.
- Kayıt (Save8) ve MP paketi yükleme sonrası söz, kalan süre ve tetik durumu aynen takip edilir.
- Aynı söz bir kez uygulanır: yinelenen kabul, bağlantı dönüşü, kayıt yükleme ikinci ilan üretmez.
- Misafirde gizlilik: hedefin gizli bilgileri teklife / aynaya sızmaz.

## NF-2 — Teknoloji ve Lüks Mal MP desteği

**Durum (16 Kasım 2026, MP-TECHLUX.0 / p37): `TEST BEKLİYOR`.** MP maddeleri `{t:'tech',id}` ve `{t:'lux',k}`; host teklif ve kabulde motorun `dealQuote` kurallarını (verende olma, `researchAccess`, `luxOwn`) ve "İstiyorum" için İZLENİYOR şartını (`dipAssetGate`; karşı teklifte karşı tarafın açıkça sunduğu madde hariç) denetler; liste host'un salt okunur `dealAssets` yanıtından yalnız İZLENİYOR ile gelir; bekleyen teklif koşul değişince gerekçeyle geçersiz olur. `encodeOffer` teknoloji kimliğini artık korur (tek oyunculuda da kartta "✦ ?" kusuru düzeldi). Lüks erişiminin ekonomik etkisi NF-2b'ye ayrıldı. Yerel kanıt: Node 10/0 (p36 0/10), SP 5/0, intel 3/0, eşdeğerlik 3/0, MP8 T.

Mevcut tek oyunculu davranıştan çıkarılacak: teknoloji paylaşımı `tech` maddesi (`researchAccess(alan,it.id)` kapısı, verenin elinde olma), lüks mal `lux` maddesi (`luxOwn`, `luxGrant` alıcıya bağlanır; miktar değil erişim hakkı). İstek tarafında İZLENİYOR (≥2) istihbarat şartı korunur.

Kabul ölçütleri: kabul anında uygunluk host'ta yeniden denetlenir; karşı teklifte düzenlenebilir; kayıt sonrası erişim / teknoloji kalıcı ve tek; tekrar gönderim (aynı cid) ikinci kayıt üretmez; misafir aynasında karşı tarafın teknoloji ağacı sızmaz.

## NF-2b — Lüks mal erişim hakkının ekonomik etkisi (karar bekliyor)

Bulgu (MP-TECHLUX.0, ölçüldü): `lux` maddesi kabulde yalnız alıcının `luxGrant[k] = veren` kaydını yazar; lüks erişimini hesaplayan `refreshLuxury` (economy.js) `luxGrant`'ı hiç okumaz. Tek oyunculuda da AI'dan alınan "X erişimi" alıcıya lüks bonusu vermez (`tests/mp_techlux0_sp_test.js` S2, p36 ve p37'de aynı). Değişiklik geçmişinde (`git log -S luxGrant`) okuyan bir sürüm yok. Bu fazda tek oyunculu ekonomi korunduğu için değiştirilmedi; MP aynı hakkı aynen taşır ve teklif özeti gerçek etkiyi yazar.

Öneri (karar sonrası): `refreshLuxury` alıcıya, veren hayattayken, malın kaynağı verende sürerken ve taraflar savaşta değilken (ambargo kuralıyla) `got[k]` + `imported[k] = veren` versin.

Kabul ölçütleri: aynı Save8'den kontrol–aday (AI–AI ve oyuncu–AI lüks anlaşmalarının sıklığı ölçülür, plasebo bandı); erişim veren kaynağı kaybedince / savaşta düşer; kayıttan sonra aynı; MP aynasında alıcının `luxury` görünümü; tek oyunculu kampanya etkisi raporlanır.

## NF-6 — Barıştırma (`peaceWith`) MP müzakere maddesi

Tasarım: "verenin, üçüncü bir devletle süren savaşını bitirmesi" maddesi (motorda var: `peaceWith {target}`, kabulde `makePeace(veren, hedef)`). İkili barıştan (`peace`, tarafların kendi aralarındaki savaş) ve federasyon ortak barışından (`fedPeace`, iki başkan, kampanya kapsamı) farkı: savaşın tarafı olmayan alıcı, verenin BAŞKA bir devletle savaşını bitirmesini satın alır / ister.

Kabul ölçütleri:
- Doğru savaş seçilir: madde savaş defterinin cephe / kampanya kimliğine bağlanır (yalnız hedef kimliği değil); misafir yalnız bildiği savaşları seçebilir.
- Gerekli onaylar: hedef devlet insan ya da AI olsun, barış hedefin de kabulünü gerektiren motor kuralıyla yürür (`canPeace`, Kan Hukuku kilidi, doktrin) — kabul anında yeniden denetlenir, kilitliyse neden görünür.
- Kapanmış savaşta gecikmiş kabul işlenmez (`rules:closed` benzeri, iki tarafa neden); bekleyen teklif savaş bitince geçersizleşir.
- Kayıttan dönüş / yeni oda: bekleyen teklif ve sonuç tek kez; birleşik teklifte kısmi uygulama yok.
- Gizlilik: üçüncü tarafların savaş bilgisi yalnız `knownWarPairs` kuralıyla.

## NF-3 — Casusluk Ağı / istihbarat maddeleri

Netleşecek: pazarlık edilebilen bilgi (`spynet` ortak ağ paktı, `intel` tek yönlü sensör paylaşımı), tarafların görebildiği içerik (yalnız kendi ağ seviyesi ve süre), süre ve sona erme.

Kabul ölçütleri: gizli dünya bilgisi (gizli operasyon faili, `framed`, başka devletlerin ağ düzeyi) teklif metnine, `dipView` / ayna verisine ve gerekçelere sızmaz; süre kayıttan sonra korunur; kabul bir kez.

## NF-4 — Diğer diplomasi kısayolları

İttifak Daveti tek dokunuş akışı (p35) sahada doğrulandıktan sonra aynı satır kalıbıyla Saldırmazlık, Ticaret Paktı ve Geçiş İzni değerlendirilecek: standart teklif tek dokunuşla, durum (bekliyor / kabul / ret / gönderilemedi) aynı satırda, Şartlı Teklif… masası.

Kabul ölçütleri: çift dokunuş tek teklif; kilitli antlaşma (doktrin, savaş, zaten yürürlükte) satırda gerekçeli pasif; tek oyunculu AI ile karar yolu `dealQuote` → `aiRespond` → `executeDeal` aynen.

## NF-5 — AI müttefik desteği ve vasallık (#40 / #44)

Doğal kampanyalarda ölçülecek: AI'nın hangi saldırı / savunma savaşına katıldığı, ne zaman ücret ya da geçiş izni istediği, cepheye ulaşabilirliği (rota / ikmal), koruma ve vasallık teklifleri (zayıf AI'nın kendiliğinden başvurusu).

Kabul ölçütleri: aynı Save8'den kontrol ve aday kolları, plasebo bandı; fayda yalnız tetiklenen devlet ve bant dışı farklarda iddia edilir; mevcut davranışlar doğrulanır, açık kalan işler (ör. ücretsiz katılım beklentisi, ulaşılamayan cepheye söz) sonuçlara göre güncellenir; RNG tüketimi ve Save8 eşitliği korunmadan AI kuralı değiştirilmez.
