#!/usr/bin/env python3
"""Build the report from measured campaign JSON; never fabricate measurements."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
keys=['surveys','finalDiscovered','losses','idleDays','travelDays','scanDays','shipDays','duplicateShipDays','collisionEpisodes']
rows=[]
for case in ['11','99','404','11-no-pirates']:
 pair=[]
 for phase in ['before','after']:
  r=json.loads((root/f'tests/exploration-94b/{phase}-{case}.json').read_text())
  assert r['months']==120 and not r['stopped']
  total={k:sum(e[k] for e in r['empires']) for k in keys}
  total.update(ms=r['ms'],idlePct=100*total['idleDays']/total['shipDays'],efficiency=100*total['surveys']/total['shipDays'])
  pair.append((r,total))
 rows.append((case,pair))
text='''# 94A → 94B: gerçek oyun döngüsünde keşif karşılaştırması

Normal zorluk, orta sarmal galaksi; 11/99/404 tohumları, 120 ay, yarım günlük
adımlar. `dailyTick`, `structTick`, `colonyBuildTick`, `autoExploreTick` ve
`monthTick` gerçek üretim fonksiyonlarıdır. Kriz/konsey/kalıntı kapalı;
varsayılan korsanlar açık. Ayrıca tohum 11'de iki sürümün de başlangıç
korsanları ve korsan doğumu kapatılarak 120 aylık kontrol yapılmıştır.

Sayılara oyuncu ve beş normal AI dahildir. Sistem sayıları devlet–sistem
çiftidir; aynı sistemin iki devletçe taranması iki kayıt sayılır. `Tarama`
yalnız yeni tamamlanan `doSurvey` işlemidir. `Bilinen` son taranmış sistem
sayısıdır (başlangıç keşifleri dahil). Kayıp, canlı gemi nesnesinin ortadan
kalkmasıdır; filo değiştirip yaşayan gemi kayıp sayılmaz. Bilim gemilerinin
bütün görevleri izlenir; sadece ideal otomatik keşif vakaları seçilmez.

Çakışma: aynı devletin aynı taranmamış hedefe ikinci keşif görevini vermesi.
İkmal ricadı hareketi görev çakışmasına dahil edilmez; varışta gerçek tarama
başlarsa dahil edilir. Yarım günlük örneklerde ek geminin beklediği süre
ayrıca `duplicateShipDays` olarak ham JSON'da bulunur.

## Toplamlar

| Tohum | Sürüm | Tarama | Bilinen | Çakışma | Kayıp | Boş gemi-gün | Boş oranı | Tarama/100 gemi-gün | Host sn |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
'''
for case,pair in rows:
 for phase,(r,t) in zip(['94A','94B'],pair):
  text+=f"| {case} | {phase} | {t['surveys']} | {t['finalDiscovered']} | {t['collisionEpisodes']} | {t['losses']} | {t['idleDays']:.1f} | %{t['idlePct']:.1f} | {t['efficiency']:.3f} | {t['ms']/1000:.3f} |\n"
text+='''
Üç korsanlı kampanyada toplam tarama **323 → 335**, keşif çakışması **87 → 0**,
bilim gemisi kaybı **103 → 67**. Bununla birlikte tohum 99'da tarama **99 → 75**
geriledi. Her galakside daha fazla keşif veya daha az kayıp garanti edilmiyor.

Boşta geçen süreye güvenli bekleme, ikmal/tehdit nedeniyle bekleme, bütün
uygun hedeflerin bitmesi ve manuel boş gemiler dahildir. 94B'de daha fazla
gemi daha uzun yaşadığı için toplam gemi-gün ve boş süre artar; gemi-gün
başına keşif oranı düşmektedir. Güvenli sapma ve ikmal dönüşleri de yolculuk
maliyeti getirir. Bu oranlar saklanmadı ve sadece toplam tarama artışıyla
"her bakımdan verimlilik arttı" sonucu çıkarılmadı.

Host süreleri çizim içermeyen Node simülasyonudur; gözlemci dahil duvar saati
ölçülür. Bazı çalışmalarda regresyon aynı hostta sürdüğünden süreler yaklaşık
karşılaştırmadır. Bunlar Android FPS ölçümü değildir. 94B güvenlik planlaması
ek CPU işi yapmaktadır. Bir kampanya 7.200 yarım günlük adım içerir.

Keşif zamanlaması temas, ödül, ekonomi ve savaş RNG akışını etkiler; sürümler
ilerledikçe farklı kampanyalara dönüşür. Aynı sürümün deterministik tekrar
ve gözlemci açık/kapalı kontrolleri ayrıca donanma regresyonunda geçmiştir.

## Devlet bazında (94A → 94B)

| Tohum | Devlet | Tarama | Kayıp | Boş gemi-gün | Çakışma |
|---|---|---:|---:|---:|---:|
'''
for case,pair in rows:
 before={e['id']:e for e in pair[0][0]['empires']}
 for e in pair[1][0]['empires']:
  b=before[e['id']];label=('Oyuncu' if not e['ai'] else 'AI')+f" {e['id']} · {e['name']}"
  text+=f"| {case} | {label} | {b['surveys']} → {e['surveys']} | {b['losses']} → {e['losses']} | {b['idleDays']:.1f} → {e['idleDays']:.1f} | {b['collisionEpisodes']} → {e['collisionEpisodes']} |\n"
text+='''
Ham ölçümler `tests/exploration-94b/before-*.json` ve `after-*.json` dosyalarıdır.
Her devlet için yolculuk/tarama/boş gemi-gün, bekleme gerekçeleri, toplamlar;
her kampanya için RNG ve tam kayıt hash'i saklanır. `development/` ilk tanı
ölçümleridir; yukarıdaki tablolar yalnız nihai `after-*.json` verisinden üretilir.

93D.1 donanma ekonomisi ayrı sekiz kontrolde korunmuştur: üç tohumda 120 ay,
negatif kaynak yok, gereksiz bilim siparişi yok, bütün sivil gövdeler sayımla
uzlaştırılmış, deterministik tekrar ve gözlemcisiz kayıt hash'i eşleşmiştir.
Askerî üretim bütçesi/tersane seçimi değiştirilmemiştir. Sayısal kampanya
sonuçları keşif ve savaş akışının değişmesi nedeniyle 94A ile aynı değildir.
'''
(root/'KESIF-KARSILASTIRMA-94B.md').write_text(text)
(root/'tests/exploration-94b/comparison.json').write_text(json.dumps({case:{p:t for p,(_,t) in zip(['94a','94b'],pair)} for case,pair in rows},indent=2))
