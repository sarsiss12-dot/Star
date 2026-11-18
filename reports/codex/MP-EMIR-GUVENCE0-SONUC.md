# STARS — MP Emir Güvencesi Developer Report

18 Kasım 2026

**Çift sipariş ve çift ödeme p41 adayında engellendi.** Aynı emir kimliği hemen, sonuç önbelleğinden düştükten sonra ve kayıt yeni host'ta açıldığında tekrar denendi. Her durumda ilk sipariş kuyruğa bir kez girdi ve bedeli bir kez kesildi.

## Kaynak ve teslim

| Alan | Değer |
|---|---|
| Başlangıç | PR #56 · `claude/stars-reinf-route0` · `d91fb07978b951f90cd92692166b06d9f972bb05` |
| Başlangıç sürümü | `96h10p40` / `MP.8.9b39` · Son müttefik sensörü düzeltmesi dahil |
| Bağımsız inceleme | `ff9d06dd4066bc81e37e8b118538abab7feefff0` · A1–A3 başlangıç vakaları |
| Bitiş ürün HEAD'i | `7dc034b9878518c568ceae3acbfaf37f0d265c86` |
| Geliştirme ve Render dalı | `codex/stars-mp-emir-guvence0` |
| Taslak PR | #57 · Taban `claude/stars-reinf-route0` |
| Aday | `96h10p41` / `MP.8.9b40` · PWA `stars-v96h10p41` |

PR #56'nın HEAD'i başlangıçta doğrulandı. Rapor ve kanıtlar aynı geliştirme dalında. Render dağıtımı bu turun kapsamı dışında kaldı.

[PR #57](https://github.com/sarsiss12-dot/Star/pull/57) · [Ürün commit'i](https://github.com/sarsiss12-dot/Star/commit/7dc034b9878518c568ceae3acbfaf37f0d265c86) · [Bağımsız inceleme](https://github.com/sarsiss12-dot/Star/blob/ff9d06dd4066bc81e37e8b118538abab7feefff0/reports/codex/EXPERT-AUDIT-20261118-SONUC.md)

## A1–A3 önce ve sonra

| Vaka | p40, bağımsız incelemenin testi yeniden çalıştırıldı | p41, eski ve güncel kimlikle |
|---|---|---|
| A1 · Hemen tekrar | 1 sipariş, ikinci kesinti yok, önceki yanıt dönüyor | 1 sipariş, ikinci kesinti yok, önceki yanıt dönüyor |
| A2 · 128 kabul edilmiş okuma sonucu önceki yanıtı önbellekten çıkarıyor | 2 sipariş, ikinci kesinti oluşuyor | 1 sipariş, ikinci kesinti yok. Sonuç belirsiz olarak bildiriliyor |
| A3 · Kayıt başka host'ta açılıyor | 2 sipariş, ikinci kesinti oluşuyor | 1 sipariş, ikinci kesinti yok. Ayrı kimlikle verilen yeni sipariş kuyruğu 2'ye çıkarıyor |

Sonuçlar `p40-a1-a3.log` ve `p41-a1-a3.log` dosyalarında. Her yeni siparişin kesintisi gerçek `shipCost` ile karşılaştırıldı. İki farklı kayıt ve iki ayrı oyuncu aynı metinsel işlem kimliğini birbirlerinin sonucunu almadan kullanabildi.

## Düzeltme ve kayıt uyumu

- `research/mp1/client/join.js` içinde `J.cmd`, yeni kimliği ilk sıra numarasına bağlıyor. Tekrar gönderimi aynı oyuncu ve kayıt bağlamında aynı içeriği, kimliği ve sıra numarasını kullanıyor. İstemci eski kimliği hatırlamıyorsa ek komut göndermeden belirsiz sonuç bildiriyor.
- `research/mp0/mp-core.js` içinde `runCommand`, önbellekteki sonucu hemen tekrarda döndürüyor. Sonuç önbellekten düşerse kimliğe bağlı ilk sıra ve kayıtlı `lastSeq`, emrin yeniden uygulanmasını engelliyor. Yeni sıra numarasıyla gelen aynı kimlik için de bu kapı çalışıyor.
- Sıra numarası taşımayan eski kimlikler için oyuncu başına en fazla 512 değişiklik komutunun kimliği MP kayıt paketinde tutuluyor. Yanıt önbelleği 128 kayıtla sınırlı. Eski biçimin geçmiş bilgisi yoksa veya sınırı dolarsa belirsiz işlemler için ikinci uygulama engelleniyor. Güncel istemci yeni sıra bağlı kimlikle normal emir verebiliyor.
- Yanıtın kaybolduğu ve önceki sıra numarasının çoktan geçildiği durumda, host önceki işlemin uygulandığını kesin olarak doğrulayamıyorsa oyuncuya kuyruğu veya işlem durumunu kontrol etmesini söylüyor. Bu durumda oyuncu mevcut durumu gördükten sonra ayrı bir emir verebilir.
- Gerçek p40 koduyla üretilmiş paket p41'de doğrulandı ve açıldı. Misafir aynı devletine döndü. Eski gemi emrinin sonucu belirsiz kaldığında yeniden ücret kesilmedi. Yeni emrin ücreti bir kez kesildi. p41 paketi eski p40'ta anlaşılır sürüm uyarısıyla reddedildi.
- Save8 v8, MP paket biçimi 4 ve protokol 1. Ek geçmiş yalnız MP oturum metadatasında. Tek oyunculu p40 kontrolüyle 11, 22 ve 404 tohumlarında 48 ay boyunca sekiz noktanın her birinde Save8 ve RNG eşleşti.

## Misafir tersane akışı

p40 kaynak izinde tersane düğmesi dokunuş başına bir emir gönderiyor. Var olan otomatik tekrar, diplomasi teklifindeki `dealTxTick` yolunda başlıyor. p40 bu tekrarda aynı kimliğe yeni sıra numarası veriyordu. p41 aynı kimliği ve ilk sırayı koruyor.

J3/J4'ün yerel VM karşılığı gerçek `UI.act('ship')`, `J.cmd`, host komut motoru, misafir ayna farkının uygulanması ve tersane HTML üretimini kullandı. Tek korvetin bedeli **32 alaşım** bir kez kesildi.

| Ölçüm | Yerel VM sonucu |
|---|---:|
| Host kabul sonucu | 8,36 ms |
| Host kuyruğu, ayrı durum okuması | 8,38 ms · 1 sipariş |
| Misafir tersane HTML'i, ayna uygulandıktan sonra | 17,09 ms · 1 kuyruk satırı |

İlk kabul yanıtı istemciye verilmedi. Ayna farkı ulaştı ve tersane satırı oluştu. Sanal saat 61 saniye ilerletildiğinde belirsiz sonuç uyarısı çıktı ve yeni otomatik sipariş gönderilmedi. Açık tekrar girişimi aynı kimlik ve sırayı gönderdi. Host önceki yanıtı döndürdü ve kuyruk ile kaynaklar aynı kaldı. Bu süreler VM gözlem noktalarıdır ve gerçek ağ gecikmesini ölçmez.

Chromium J3/J4 testi ilk siparişi tersane düğmesinden verir, giden gemi emirlerini sayar ve tekrarın sıra numarasını karşılaştırır. Hem taban hem aday Chromium denemesi süreç açılışında `process_singleton_posix / socket() EPERM` ile durdu. **Chromium oynanış sonucu NOT RUN.**

## Hedefli regresyon

| Kanıt | Sonuç |
|---|---|
| Yeni `mp_emir_guvence0_test.js` | **13 PASS** · A1–A3, eski paket, kimlik kapsamı, geçmiş sınırı, yerel VM J3/J4 |
| Aynı testte yeni host sonrası karar ödülü | **PASS** · 180 bilim bir kez |
| Aynı testte yeni host sonrası federasyon oyu | **PASS** · oyuncunun tek oyu |
| Aynı testte yeni host sonrası anlaşma kabulü | **PASS** · 100 maden ve 50 enerji transferi bir kez |
| 13 mevcut hedefli paket | **88 PASS, 0 FAIL** · MP4, kararlar, NF-9, gündem, Barıştırma, ayna, sensör ve protokol |
| Bu toplam içindeki p40 sevkiyat regresyonu | **12 + 4 PASS** · sensörlü rota ve kayıp hedef kartları |
| p40 karşısında uzun Save8/RNG eşdeğerliği | **3 PASS** |
| Kaynak koruma karşılaştırması | **7 dosya** sabit p40 baytlarına birebir döndü |
| p33'e ait eski ayrı fixture | **NOT RUN** · gerçek p40 paketiyle eski paket kabulü ayrıca geçti |
| Tam test matrisi, fiziksel Android, LAN ve canlı Render oynanışı | **NOT RUN** |

[Ham test ve paket kanıtı](https://github.com/sarsiss12-dot/Star/tree/7dc034b9878518c568ceae3acbfaf37f0d265c86/reports/codex/evidence/mp-emir-guvence0)

## Paket ve yayın doğrulaması

| Alan | Değer |
|---|---|
| ZIP | `releases/stars-faz96h10p41.zip` · 939.976 bayt |
| SHA-256 | `b4b30a56bd31dfe9afc3f5a0672868f185588a120e50c59b6893f13be2f72f7c` |
| ZIP CRC32 | `50D27F8C` |
| Üye/manifest | 20 üye · 19 runtime dosyası · ZIP içi CRC, manifest ve çıkarılmış dosya doğrulaması PASS |
| `main.js` SHA-256 | `c85b8c5654bc1614a5915a71cadcf0dc7d96f34fc5efbc71bd3ad2ac0c53caa4` |
| Manifest SHA-256 | `9d1a8de897a41c3da80cfe846f3cc571c2a61cdffb433c2c67bd9a1fda2a8d69` |

Render'da `codex/stars-mp-emir-guvence0` dalı dağıtıldığında `/mp/version` yanıtında şu değerler beklenir. Aynı değerler yerel relay HTTP isteğinde ölçüldü. `main.js` özeti sunulan dosyanın baytlarından hesaplanıyor ve p40 ile farklı olduğu doğrulandı.

```json
{
  "build": "96h10p41",
  "mp": "MP.8.9b40",
  "runtime": "9d1a8de897a4",
  "files": {
    "main.js": "c85b8c5654bc",
    "mp-core.js": "3b354162f8bf",
    "join.js": "fa0be01352c2",
    "guest-stars.js": "516688ec1005"
  }
}
```

Tam yerel yanıt `version.json` dosyasında. ZIP tek oyunculu runtime'ı, GitHub dalı ise Render için MP host, misafir ve relay değişikliklerini de içeriyor.

[Oyun ZIP'i](https://github.com/sarsiss12-dot/Star/raw/refs/heads/codex/stars-mp-emir-guvence0/releases/stars-faz96h10p41.zip)
