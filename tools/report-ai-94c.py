#!/usr/bin/env python3
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];directory=root/'tests/audit-94c'
cases=['11','99','404','99-long','404-large'];resources=['ene','min','yiy','ala','tuk','ara','etk']
summary={};stats=[]
for case in cases:
 summary[case]={}
 for phase in ['before','after']:
  d=json.loads((directory/f'{phase}-{case}.json').read_text());last={e['id']:e for e in d['monthly'][-1]};ai=[e for e in d['empires'] if e['ai']]
  summary[case][phase]={'months':d['months'],'ms':d['ms'],'colonies':sum(last[e['id']]['colonies'] for e in ai),'power':sum(last[e['id']]['power'] for e in ai),'discovered':sum(last[e['id']]['discovered'] for e in ai),'orders':sum(sum(e['orders'].values()) for e in ai),'losses':sum(sum(e['losses'].values()) for e in ai),'operations':sum(sum(e['operations'].values()) for e in ai),'accepted':sum(e['accepted'] for e in ai),'conflicts':sum(e['exploreConflicts'] for e in ai),'negative':len(d['negative']),'graphs':d['graph']['calls']}
  for e in ai:
   samples=[x for m in d['monthly'] for x in m if x['id']==e['id']];x=last[e['id']]
   record={'case':case,'phase':phase,'id':e['id'],'doctrine':e['doctrine'],'race':e['race'],'ethics':e['ethics'],'dead':x['dead'],'resources':{r:{'final':x['res'].get(r,0),'income':x['inc'].get(r,0),'min':min(s['res'].get(r,0) for s in samples),'max':max(s['res'].get(r,0) for s in samples),'negativeIncomeMonths':sum(s['inc'].get(r,0)<0 for s in samples),'zeroStockMonths':sum(s['res'].get(r,0)<=.001 for s in samples)} for r in resources},'colonies':x['colonies'],'power':x['power'],'ships':x['ships'],'orders':e['orders'],'losses':e['losses'],'capacity':x['cap'],'usage':x['usage'],'yardUtilization':e['busySlots']/e['yardSlots'] if e['yardSlots'] else 0,'productionBlocks':e['productionBlocks'],'techs':len(x['techs']),'specialTechs':[t for t in x['techs'] if t.startswith(('d_','x_'))],'discovered':x['discovered'],'operations':e['operations'],'operationInfluenceCost':e['operationCost'],'negotiations':e['negotiations'],'accepted':e['accepted'],'negotiationOutcomes':e['negotiationOutcomes'],'warDeclarations':e['warDeclarations'],'peaceSignatures':e['peaces'],'activeWars':x['wars'],'alliances':x['allies'],'pacts':x['pacts'],'idleScienceDays':e['idleDays'],'scienceDays':e['shipDays'],'wait':e['wait'],'factionEvents':e['factionEvents'],'finalFactions':x['factions'],'factionMods':x['factionMods'],'territorialResults':{'gain':0,'loss':0,'noNetChange':0}}
   for f in (d.get('warLedger') or {}).get('fronts',[]):
    if f['ended'] is None or e['id'] not in f['sides']:continue
    net=sum((o.get('to')==e['id'])-(o.get('from')==e['id']) for o in f.get('occupation',[]))
    record['territorialResults']['gain' if net>0 else 'loss' if net<0 else 'noNetChange']+=1
   stats.append(record)
(directory/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));(directory/'per-empire-analysis.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2))
text='''# AI kalite denetimi — 94C

## Yöntem ve sınırlar

Doğrulanmış 94B ile 94C, aynı üretim kodunu çalıştıran VM hostunda karşılaştırıldı.
Normal zorluk, orta sarmal harita: 11/99/404, 120 ay. İlave kontrol: tohum 99,
360 ay, korsansız ve AI başlangıç stokları en fazla 25; tohum 404, 100 sistemli
ULU harita, 120 ay. Düşük stok yalnız test kurulumu olup oyuna bir avantaj
vermez. Gerçek günlük/aylık döngü, üretim, savaş, diplomasi, bilim ve keşif
çalışır. Aşağıdaki toplamlar yalnız normal AI devletleridir; oyuncu hariçtir.

Beş farklı mevcut AI doktrin değeri gözlendi: militarist, tuccar, yayilmaci,
pasifist ve eski izolasyonist değeri. Tür/etik kimlikleri ham veride saklıdır.
Bu örneklem bütün sekiz doktrin/tür/civic birleşimlerinin kampanya kabulü değildir;
özel teknoloji erişiminin kapsamlı birim regresyonları ayrıca korunmuştur.

## Eski sürümle karşılaştırma

| Senaryo | Sürüm | Ay | Koloni | Askerî güç | Keşfedilmiş | Gemi siparişi | Kayıp | Casus op. | Kabul edilen anlaşma | Host sn |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
'''
for case in cases:
 for phase,label in [('before','94B'),('after','94C')]:
  s=summary[case][phase];text+=f"| {case} | {label} | {s['months']} | {s['colonies']} | {s['power']:.0f} | {s['discovered']} | {s['orders']} | {s['losses']} | {s['operations']} | {s['accepted']} | {s['ms']/1000:.2f} |\n"
text+='''
Gemi kayıpları canlı gövde nesnelerinin kaybolmasıyla sayılır; aynı geminin başka
filoya taşınması kayıp değildir. Araştırma ilerlemesi aylık tamamlanan teknoloji
listelerinden izlenir. Casusluk maliyeti tabloda Etki harcamasıdır; bütün kaynaklar
ve başarıdan sonraki uzun dönem fayda için tek bir parasal değer uydurulmadı.

94C ticaret düzeltmesi kaynak yaratmayı kaldırdığı için 11 gibi bazı kampanyalarda
AI toplam gücü/koloni sayısı düşmüştür. Bu sonuçlar başarısızlık olarak gizlenmedi;
kaynak doğruluğu yerine eski ücretsiz girdiye göre güç eşitlemesi yapılmadı.
99 ve 404 standart senaryolarında sonuçlar aynıdır. Başka senaryolarda küçük
kaynak farkları sonraki RNG kararlarını ve savaşları değiştirebilir.

## AI inceleme sonuçları

**Ekonomi ve üretim:** Bütün senaryolar istenen aya ulaştı; aylık örneklerde negatif
veya sonlu olmayan kaynak yok. Stokta uzun süre sıfır ve negatif aylık gelir olan
kaynaklar `per-empire-analysis.json` içinde ayrı sayıldı. Bunlar türün gıda
kullanmaması gibi sebepleri de içerebilir; her sıfır stok ekonomik kilit sayılmadı.
Yedi kaynağın min/max/son stokları, son gelirleri, tersane kullanım oranı, üretim
engeli gerekçeleri, kapasite ve sınıf bazlı sipariş/kayıplar devlet bazında saklı.
Düşük stoklu 360 aylık kontrol toparlanma davranışını kapsar; bütün devletlerin
hayatta kalacağı veya depolarını optimal kullanacağı garantisi verilmez.

**Askerî kararlar:** Mevcut kod zayıf filoyu büyük filoya yönlendiriyor, tehditli
sistemleri önceliyor, hedef savunmasını ve doktrine bağlı geri çekilmeyi değerlendiriyor.
93D.1 çoklu tersane bütçesi, 93C bileşim ve 93B sevkiyat regresyonları geçti.
Buna rağmen sefer düzeyinde ortak varış/taarruz takvimi yok; parça parça varış,
intihar riski ve savunma dağılımı 95A'da olay bazında ele alınmalı. Bu fazda
bunların tümü çözülmüş gösterilmedi. Kapalı savaş cephelerinde net işgal kazancı,
kaybı ve sıfır değişim ayrı hesaplandı; bu değerler resmî bir “savaş galibi”
alanı değildir. Resmî kazananı kaydedilmeyen barışa yapay galip atanmadı.

**Bilim ve keşif:** `autoExploreTick`, rezervasyonlar ve bütün 94B keşif kodu
korundu. Bütün ölçülen senaryolarda otomatik hedef çakışması sıfır. Tohum 99'da
94B → 94C rota grafiği sayısı 3.796 → 3.796; keşif sonucu değişmedi. Bu, 94A'ya
göre daha önce görülen düşüşün 94C'de düzelmiş olmadığı anlamına gelir. 99'daki
AI 5 tek başına 6.701 bilim gemisi-gün ikmal beklemesi kaydediyor; AI 1'de
1.882,5 gün korsan, AI 3'te 1.193,5 gün düşman tehdidi beklemesi var. Bunlar
çakışma kilidinden ziyade güvenli erişim/ikmal sınırıdır. Bekleyen bütün gemiler
her beş oyun gününde yeniden rota aradığı için maliyet sürer. Olayla geçersizleşen
rota önbelleği, güvenli bekleme aralığı ve ikmal dönüşü maliyetinin denetlenmesi
95A önerisidir; gizli bilgiyi kullanarak daha fazla keşif yaptırılmadı.

**Araştırma kimliği:** Tamamlanan temel ve özel teknoloji listeleri, doktrin ve
türler kayıtlı. Erişim koşulları ve AI açılan içerik kullanımı 93E/93E.1 testleriyle
korundu. Ekonomi veya savunma açığını daha iyi dikkate alan dinamik ağırlıklar ve
eski izolasyonist kimliğinin mevcut doktrin kataloğuyla uyumu 95A denetimidir.

**Diplomasi ve casusluk:** Kabul/karşı kabul, reddedilen müzakere, aktif savaş,
barış imzası, pakt/ittifak ve operasyon çeşitleri ölçüldü. 404 standart örneğinde
operasyon yok; 360 aylık kontrolde operasyonlar kullanılıyor. Sıfır operasyon
tek başına hata sayılmadı; temas, istihbarat, bütçe ve hedef kapıları vardır.
`aiPickOp` hedefe erişimi `spyTargetCheck/opQuote` üzerinden sınırlar fakat bazı
puanlarda rakibin gerçek teknoloji sayısı/hazinesini okur; askerî hedef kodu da
geniş dünya bilgisi kullanır. Bu eski davranışlar yeni eklenmedi. Bütün karar
katmanının bilgi sınırları ve operasyon sonrası ölçülebilir fayda 95A'ya ayrıldı.
Teklif tekrarını önleyen geçmiş cooldown testleri korunuyor; daha anlamlı
stratejik anlaşma önerileri bu fazda yeniden yazılmadı.

**Fraksiyonlar:** Savaş/barış, koloni, teknoloji, fetih, kayıp ve diğer eylemler
`facEvent` ile memnuniyeti gerçekten değiştirir. Aylık durum da memnuniyeti,
güç payını, ekonomik/askerî modifier'ları ve talepleri etkiler. AI için olaylar
ve son mood/pow değerleri kaydedildi. Ancak AI talepleri doğrudan hedef listesine
almıyor; etkiler çoğunlukla modifier/darbe ve mevcut eylemlerin sonuçları üzerinden.
Ordu, tüccar, bilim taleplerinin planlama bütçesine bağlanması 95A işidir.

## Tespit edilen ve düzeltilen gerçek hatalar

1. **Stoksuz aylık takas kaynak yaratıyordu.** 94B'de iki tarafın ilgili stokları
   sıfırken gelir tabanlı 10+10 aktarım alıcılara yazılıyor, vericinin eksiği sıfıra
   kırpılıyordu. `probe-trade-94c.js`: toplam 0 → 20. 94C sonucu 0 → 0.
2. **Başka ortağın rotası takasa yetiyordu.** Herhangi bir açık dış hat bütün
   pakt çiftlerini yetkilendiriyordu. Artık uçlar bu çiftin gerçek koloni ticaret
   limanlarına ait olmalı; ortak sistemlerde baskın sistem sahibi tek başına
   belirleyici değildir. Yıkılmış limanın eski rotası yetmez. Gerçek hiper-yollar,
   savaş engeli ve güncel yağma tekrar kontrol edilir.
3. **Aynı ayın aylık takası yeniden uygulanabiliyordu.** Save v8 içinde isteğe
   bağlı çift/ay damgası tekrar çağrıyı önler; sonraki ay normal çalışır.

Takas iki gerçek stokla aynı oranda sınırlandırılır; karşılık ve kaynak toplamları
korunur. Bir kaynak iki eşleştirmede kullanılsa da her adım güncel stoktan hesaplanır.
Pakt iptali kaynak iadesi yaratmaz. Doğrudan anlaşma stok kapıları ve ikinci
harcama reddi ayrıca test edildi. `executeDeal` ham çağrısı yeni bir işlem talebidir;
kimliği olmayan bu API'yi bütün olası istemciler için genel replay korumasına
çevirdiğimiz iddia edilmiyor. Mevcut UI teklif ömrü/atomiklik regresyonları geçti.

Ticaret gelir çarpanı mevcut soyut ekonomik faaliyettir; fiziksel konvoy teslimatı
motoru henüz yok. Gerçek konvoy olmaması bu fazda değiştirilmedi. Kanıtlanan
aylık kaynak çoğalması kapatıldı; tüm ekonomi/iptal/çok oyunculu yeniden yürütme
yolları için sınırsız bir güvenlik garantisi verilmez.

## Devlet bazında son durum (94C)

| Senaryo | AI / doktrin | Koloni | Güç | Kullanım/kapasite | Tersane doluluk | Teknoloji (özel) | Keşif | Casus op. | Boş bilim gemisi-gün |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
'''
for s in stats:
 if s['phase']!='after':continue
 text+=f"| {s['case']} | {s['id']} / {s['doctrine']} | {s['colonies']} | {s['power']:.0f} | {s['usage']:g}/{s['capacity']:.1f} | %{s['yardUtilization']*100:.1f} | {s['techs']} ({len(s['specialTechs'])}) | {s['discovered']} | {sum(s['operations'].values())} | {s['idleScienceDays']:.1f} |\n"
text+='''
Tam kaynak/gelir dengeleri, sınıf dağılımı, savaş cepheleri, fraksiyonlar ve bütün
aylık örnekler `tests/audit-94c/` içindedir. `per-empire-analysis.json` özetleri
ham veriden `tools/report-ai-94c.py` ile tekrar üretilebilir.

## Determinizm ve performans

60 aylık aynı tohum tekrarı: tam kayıt hash'i ve RNG aynı. 30. ayda Save v8
yükleyip 60. aya ilerletme: RNG ve bütün oyun değerleri aynı. Ham hash yalnız
önceden var olan `_supAt`, `_gateAt`, `_prof` türetilmiş alanlarının yüklemede
normalleşmesinden farklı; fark dosyası saklı. Sadece bu üç cache alanı çıkarılınca
kanonik JSON hash'leri aynı. Bu fark gizlenip ham hash eşit denmedi.

Host süreleri gözlemci ve eşzamanlı regresyon yükünü içerir. Rota grafiği çağrı
sayıları ham veridedir; süre farkları tek başına optimizasyon kanıtı değildir.
100 sistem native Canvas ölçümü ayrıca `camera-performance.json` içindedir.
Fiziksel Android FPS/ısı/bellek kabulü yapılmadı.

## Önerilen 95A işleri

- AI kararlarında istihbarat/sensör bilgi sınırını tek kapıda denetleme.
- Birlikte varış, tehdit yoğunluğu ve ikmal temelinde sefer/savunma koordinasyonu.
- Fraksiyon taleplerini üretim, araştırma ve diplomasi hedeflerine bağlama.
- Kaynak darboğazı, stok birikimi ve özel teknoloji içeriği kullanımı için ihtiyaç planı.
- 99 tohumundaki güvenli bekleme/ikmal dönüşü ve rota önbelleği maliyeti.
- Operasyonların gerçek stratejik getirisi ve teklif kalite/tekrar bütçesi.
- Resmî savaş sonuç kaydı ve standart gözlemci metriği; isimlerden galip türetmeme.

95A veya 94D bu teslimle otomatik başlamaz.
'''
(root/'AI-KALITE-DENETIMI-94C.md').write_text(text)
