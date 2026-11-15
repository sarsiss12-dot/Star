# STARS — sonraki faz görevleri (MP-DEAL-SYS.0 sonrasında kaydedildi)

15 Kasım 2026 · p35 / MP.8.9b33 tabanı · Kanonik pano: [#33](https://github.com/sarsiss12-dot/Star/issues/33) (55 madde). Bu belge yeni kalemleri panonun ilgili açık maddelerine bağlar; panonun satır durumları bu fazda **değiştirilmedi** (hiçbiri TAMAMLANDI değildir).

Durum değerleri panonunkilerdir: `PLANLANDI` = kayda girdi, geliştirme başlamadı.

| Kod | Görev | Bağlı pano maddesi | Durum | Bağımlılık |
|---|---|---|---|---|
| NF-1 | Genel Savaş Sözü (`warOn`) MP desteği | #16, #31, #40, #43 | `PLANLANDI` | MP-DEAL-SYS.0 (tek işlemli teklif), WAR-COALITION.0 / BETA-WAR-GOALS.0 savaş motoru |
| NF-2 | Teknoloji ve Lüks Mal MP desteği | #40 (koalisyon pazarlığı), MP.3 müzakere | `PLANLANDI` | MP-DEAL-SYS.0 madde kapısı (`dipItems`), istihbarat düzeyi (`intelOf`) aynası |
| NF-3 | Casusluk Ağı / istihbarat maddeleri | #33 (casusluk paneli), MP.6.4 casusluk | `PLANLANDI` | Ayna gizlilik kuralı (`hitLog`, `framed`), MP.6.4 `spy*` komutları |
| NF-4 | Diğer diplomasi kısayolları (saldırmazlık, ticaret paktı, geçiş izni) | #32 (MP insan oyuncuya ittifak daveti), #22 | `PLANLANDI` | MP-DEAL-SYS.0 tek dokunuş İttifak Daveti (`UI.allyInviteSend`, `UI.mpQuickOffer`) sahada kabul edilmeli |
| NF-5 | AI müttefik desteği ve vasallık ölçümü | #40, #44 (ayrıca #16, #43) | `PLANLANDI` | Doğal kampanya düzeneği (`research/96h8/scripts/arm.js`, plasebo bandı), kontrol kökü sabit kopya |

## NF-1 — Genel Savaş Sözü (`warOn`) MP desteği

Tasarım: üçüncü devlete karşı söz. Hedef devlet, yürürlük süresi (gün), tetikleme koşulu (ör. "hedef ile verenin müttefiki savaşa girerse" ya da "kabulden sonra N gün içinde"), yükümlülük (savaş ilanı + en az bir cephe), söz bozulursa sonuç (mevcut `oathBreakRecord` / güven kaybı, ödenen bedelin iadesi). Aktif cepheye veya hazırlığa bağlı `warJoin` ile ayrı madde olarak kalır; ikisi aynı teklifte birlikte bulunabilir ama biri diğerinin yerine geçmez.

Kabul ölçütleri:
- İki tarafın açık rızası; söz yalnız kabul anında bağlayıcı olur, taslak / bekleyen teklif hiçbir şeyi bağlamaz.
- Savaş ilanı kuralları açık: konsey yasağı, saldırmazlık / ittifak çakışması, meşruiyet önizlemesi teklif ekranında görünür; ilan host motorunun `war` yolundan geçer.
- Kayıt (Save8) ve MP paketi yükleme sonrası söz, kalan süre ve tetik durumu aynen takip edilir.
- Aynı söz bir kez uygulanır: yinelenen kabul, bağlantı dönüşü, kayıt yükleme ikinci ilan üretmez.
- Misafirde gizlilik: hedefin gizli bilgileri teklife / aynaya sızmaz.

## NF-2 — Teknoloji ve Lüks Mal MP desteği

Mevcut tek oyunculu davranıştan çıkarılacak: teknoloji paylaşımı `tech` maddesi (`researchAccess(alan,it.id)` kapısı, verenin elinde olma), lüks mal `lux` maddesi (`luxOwn`, `luxGrant` alıcıya bağlanır; miktar değil erişim hakkı). İstek tarafında İZLENİYOR (≥2) istihbarat şartı korunur.

Kabul ölçütleri: kabul anında uygunluk host'ta yeniden denetlenir; karşı teklifte düzenlenebilir; kayıt sonrası erişim / teknoloji kalıcı ve tek; tekrar gönderim (aynı cid) ikinci kayıt üretmez; misafir aynasında karşı tarafın teknoloji ağacı sızmaz.

## NF-3 — Casusluk Ağı / istihbarat maddeleri

Netleşecek: pazarlık edilebilen bilgi (`spynet` ortak ağ paktı, `intel` tek yönlü sensör paylaşımı), tarafların görebildiği içerik (yalnız kendi ağ seviyesi ve süre), süre ve sona erme.

Kabul ölçütleri: gizli dünya bilgisi (gizli operasyon faili, `framed`, başka devletlerin ağ düzeyi) teklif metnine, `dipView` / ayna verisine ve gerekçelere sızmaz; süre kayıttan sonra korunur; kabul bir kez.

## NF-4 — Diğer diplomasi kısayolları

İttifak Daveti tek dokunuş akışı (p35) sahada doğrulandıktan sonra aynı satır kalıbıyla Saldırmazlık, Ticaret Paktı ve Geçiş İzni değerlendirilecek: standart teklif tek dokunuşla, durum (bekliyor / kabul / ret / gönderilemedi) aynı satırda, Şartlı Teklif… masası.

Kabul ölçütleri: çift dokunuş tek teklif; kilitli antlaşma (doktrin, savaş, zaten yürürlükte) satırda gerekçeli pasif; tek oyunculu AI ile karar yolu `dealQuote` → `aiRespond` → `executeDeal` aynen.

## NF-5 — AI müttefik desteği ve vasallık (#40 / #44)

Doğal kampanyalarda ölçülecek: AI'nın hangi saldırı / savunma savaşına katıldığı, ne zaman ücret ya da geçiş izni istediği, cepheye ulaşabilirliği (rota / ikmal), koruma ve vasallık teklifleri (zayıf AI'nın kendiliğinden başvurusu).

Kabul ölçütleri: aynı Save8'den kontrol ve aday kolları, plasebo bandı; fayda yalnız tetiklenen devlet ve bant dışı farklarda iddia edilir; mevcut davranışlar doğrulanır, açık kalan işler (ör. ücretsiz katılım beklentisi, ulaşılamayan cepheye söz) sonuçlara göre güncellenir; RNG tüketimi ve Save8 eşitliği korunmadan AI kuralı değiştirilmez.
