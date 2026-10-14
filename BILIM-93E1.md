# Faz 93E.1 — Doktrin uzmanlaşması

Kanonik kaynak: stars-faz93e.zip; SHA-256
`39b8d55e83636de6c83110d954fdcc0f601efa0ba44ae87558a1acfaa6bd3b42`.
ZIP CRC doğrulandı. GitHub kaynak alınmadı.

40 temel ve 12 eski özel teknoloji değiştirilmeden korunur. Altı yeni özel
teknolojiyle toplam 58 düğüm vardır. Yalnız Fizik, Toplum, Mühendislik;
Geçmiş bir araştırma ağacı değildir. Yeni civic içeriği yoktur.

## Sekiz doktrinin doğrudan erişimi

| Doktrin | Teknoloji / dal | Koşul | Gerçek kazanım |
|---|---|---|---|
| Militarist | Amirallik İkmal Standardı / Toplum | ◆ militarist | Kapasite +12; enerji ve alaşım filo bakımı çarpanı −0,05 |
| Tüccar | Dağıtık İktisat Büroları / Mühendislik | ◆ tuccar | İktisat Bürosu |
| Pasifist | Bölgesel Caydırıcılık / Fizik | ◆ pasifist | Kendi sistemlerinde +120 savunma; mevcut Kale Doktrini çarpanına girer |
| Yayılmacı | Sınır İkmal Protokolü / Toplum | ◆ yayilmaci | Koloni gemisi maliyeti −%10; kapasite +8 (93E) |
| Fanatik Arındırıcılar | Kesintisiz Seferberlik / Mühendislik | ◆ izolasyonist | Gövde +%10; yeni savaş gemilerinin üretim hızı paydasına +0,08 |
| Teknokrasi | Derin Gözlem Ağı / Fizik | ◆ teknokrasi VE ⚖ materyalist ≥1 | 93E x_observer uzay yapısı; özgün koşul korunur |
| Kriminal Sendika | Bölmeli İstihbarat Hücreleri / Fizik | ◆ kriminal | Operasyon maliyet çarpanı −0,08; mevcut sabotaj başarı hesabına +3 yüzde puan (başarı tavanı korunur) |
| Kutsal Meclis | Sinod Kurumları / Toplum | ◆ teokrasi | Sinod Evi |

İsim, ön koşul, araştırma bedeli ve tüm özgün 93E kazanımları için
TEKNOLOJI-KATALOGU-93E1.json kanonik çalışma zamanı dışa aktarımıdır.
Militarist etik, Militarist doktrinin yerine geçmez. Kalıcı doktrin
researchDoctrine() ile mizac / eski kayıt persLock / ırk varsayılanından
okunur; geçici _pers kullanılmaz. Teknokrasi için materyalist ek koşul
kasıtlı olarak korunmuştur.

## Üretilebilir iki içerik

| Bina | İnşa bedeli | Gerçek enerji bakımı/ay | Taban üretim/ay | Sınır |
|---|---|---|---|---|
| İktisat Bürosu | 300 mineral +45 alaşım | 4,8 (taban3 × mevcut1,6) | +8 yerel enerji,+2 bilim | Koloni başına1 |
| Sinod Evi | 310 mineral +50 alaşım | 6,4 (taban4 × mevcut1,6) | +2 etki,+3 bilim | Koloni başına1 |

Üretime mevcut nüfus, işgücü, istikrar, gezegen ve uygarlık çarpanları
uygulanır. Taban üretim net gelir değildir. İnşa, gerçek koloninin kuyruğuna
girer, kaynaklar bir kez ödenir; normal inşa süreleri/geçerli kolonideki
bina sınırları kullanılır. AI kriz, gelir ve mevcut bina kontrollerinden
sonra aynı ücretli bina kuyruğunu kullanır. İktisat Bürosu ticaret
transferi, stok bakiyesi veya karşılıksız kaynak takası eklemez.
Bina ayrıntılarındaki enerji bakım satırı mevcut ekonomi katsayısına
uydurulmuştur; önceki arayüz taban bakımı net bakım gibi gösteriyordu.

## Etki ve koruma yolları

- Yeni üretim bonusu militaryBuildMul alanıdır. Eski shipSpeed alanının
  üretim yolunda kullanılmadığı görüldü; eski doktrin cezalarının kapsamını
  bu içerik fazında değiştirmedik. shipProductionDays() sipariş ve 93C
  tersane teslim tahmini için ortaktır. Yalnız rolü sav olan yeni siparişler
  etkilenir; sivil gemiler ve mevcut siparişlerin kalan süreleri korunur.
- d_deterrence sistem savunma hesabındadır; etik x_shelter bonusuyla
  birikebilir. Diğer bonuslar recalcMods, filo kapasitesi/bakımı,
  operasyon bedeli ve mevcut sabotageChance hesaplarından uygulanır.
- Erişim: seçim, ön koşul rotası, tamamlama, takas, olay ve teknoloji
  hırsızlığı mevcut researchAccess/grantResearchTech kapısını kullanır.
- Tamamlanan teknoloji ve açtığı içerik doktrin değişince silinmez.
  Tamamlanmamış uygunsuz hedef gerekçesiyle bekler; bankalanmış puanı,
  sıra numarası ve geçmişi korunur. Üç araştırma modu değişmemiştir.
- AI özel teknolojileri yalnız kendi koşullarıyla değerlendirir. Mevcut
  maliyet/ekonomi/askerî ihtiyaç puanlarına özel teknoloji ağırlığı ekleyen
  93E seçicisi korunur. Rakibin gizli araştırmasına erişim eklenmez.
- Bilim zaferi hâlâ 40 temel teknoloji üzerinden işler; Save v8 korunur.
- 93D.1 AI bütçesi, tersane seçimi ve sevkiyat kodu yeniden tasarlanmadı.

## Denge sınırı

Yeni teknoloji bedelleri 2600–3100; kademe3 ve temel ön koşullar vardır.
Binalar koloni başına bir adet; her biri bakım öder. İstihbarat bonusu
başarı tavanını kaldırmaz. Özel teknoloji bedelsiz gemi/kaynak vermez.
Sekiz doktrinin erişim matrisi ve AI gerçek kullanım senaryoları testlidir;
her etik/tür/civic kombinasyonunda uzun geç oyun dengesi tamamlandı iddiası yoktur.
