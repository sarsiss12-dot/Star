from pathlib import Path
import json,hashlib,shutil,zipfile
P=Path(__file__).resolve().parents[1];E=P/'evidence';R=P.parent/'Star';D=P.parent/'deliverables';Q=R/'research/96h62/followup';Q.mkdir(parents=True,exist_ok=True)
assert json.loads((E/'INTEGRITY.json').read_text())['canonical23MonthFullSaveRngMatch']
summary=json.loads((E/'SUMMARY.json').read_text());terminal=json.loads((E/'TERMINAL-BUDGET.json').read_text())
readme='''# 96H.6.2 takip teşhisi — iki emrin finansmanı

Yeni AI adayı ve oyun sürümü yoktur. Üretim96h61korunur. Aynı seed11 Save217/RNG ile dört kol karşılaştırıldı: kanonik; bekle; çiftlik→dökümhane yıkımı; maden→çiftlik. Son iki sıra farklı eylem kümeleridir; yalnız aynı binaların yer değiştirmesi değildir.

Teşhis kollarında aktör7için218–224aylarında yalnız belirlenen iki koloni emrine izin verildi. Diğer strateji, filo, diplomasi, olay ve devletler kanonik motorla çalıştı.225'ten itibaren hedefin normal koloni kararları da açıldı. Bu baskılama genellenmiş AI politikası veya üretim adayı değildir; kanonik kolunda baskılama yoktur.

| Ölçüm | Kanonik | Çiftlik→yıkım | Maden→çiftlik |
|---|---:|---:|---:|
|219–224maden kritik ayı |6|3|6|
|219–224maden sıfır ayı |2|0|1|
|219–224gıda sıfır ayı |0|0|0|
|Ay224maden stoğu |16,99|55,49|16,99|
|Ay224alaşım stoğu |221,04|93,95|221,04|
|Ay240maden neti |+0,240|+6,421|+0,240|
|Ay240gıda neti |−0,367|−0,367|−7,370|
|Ay240alaşım neti |+0,699|−5,544|+1,392|
|Ay240dökümhane |1|0|1|

Çiftlik→yıkım ilk köprüde maden sıfırlanmasını önlüyor, ama bunu bir dökümhaneyi ve alaşım kapasitesini azaltarak yapıyor. Sonra normal AI225/229/233'te tekrar dökümhane yıkıyor.233'teki son yıkımda mevcut alaşım neti zaten−1,59665; hâlâ yıkım onaylanıyor. Kriz azaltma yolu gıda/tüketim kötüleşmesini ayrıca gözetiyor, alaşım kaybını ise yalnız ağırlıklı puan cezasıyla ele alıyor. Bu teşhis koşulunda son üretim kapasitesini korumaya yetmiyor.

Ay240sabit-net tanısal hesabı: A kolunda yeni dökümhane için210maden gerekir; mevcut maden94,63ve net+6,421ile yaklaşık17,97ay finansman,106gün inşa gerekir. Alaşım34,30/−5,544ile yaklaşık6,19ay dayanır. B kolunda çiftlik için110maden gerekir;75,44maden ve+0,2399netle yaklaşık144,05ay finansman gerekirken gıda24,54/−7,370ile3,33ay dayanır. Bunlar geleceği sabitleyen teşhis hesaplarıdır; doğal geleceğin kesin simülasyonu veya kaçınılmaz çöküş iddiası değildir.

Sonuç: İlk emrin peşin bedeli ve ilk altı ay stoku, bir sonraki zorunlu üreticiyi zamanında yeniden finanse etme güvencesi değildir. İki emir seçmek de tek başına yeterli değildir; köprü sonundaki üretim kapasitesi ve sonraki zorunlu yatırım birlikte denetlenmelidir. Bu bulgu yeni bir AI düzeltmesi olarak yayımlanmadı.

Kontroller: kanonik23ayın tamamında önceki eşlenmiş Save/RNG ile eşit; A tekrarı23ayın tamamında aynı Save/RNG; metrik okumaları ve fiyat sorguları saf; gerçek motorun bedel/kuyruk/hurda yolları kullanıldı; kaynak yardımı/RNG müdahalesi yok.120/240matrisleri ve fizikselAndroid NOT RUN. Ham sonuçlar, gerçek Save'ler, protokol ve sürücüler takip kanıt ZIP'indedir.
'''
(Q/'README.md').write_text(readme)
for n in ['PROTOCOL.json','SOURCE.json','INTEGRITY.json','SUMMARY.json','TERMINAL-BUDGET.json'] :shutil.copy2(E/n,Q/n)
shutil.copytree(P/'scripts',Q/'scripts-as-run',dirs_exist_ok=True)
(E/'README.md').write_text(readme);shutil.copy2(P.parent/'phase96h62/evidence/seed11-checkpoint217.save',E/'INPUT-seed11-217.save');shutil.copytree(P/'scripts',E/'scripts-as-run',dirs_exist_ok=True)
files=[p for p in E.rglob('*') if p.is_file() and not any(x.startswith('.') for x in p.relative_to(E).parts) and p.suffix not in ['.png','.pyc'] and '__pycache__' not in p.parts and p.name!='KANIT-MANIFEST.json']
m={'kind':'96H.6.2 follow-up diagnosis, not game','parentHead':'d11b0e236792f012d9dcaae401462ee2deb5832b','files':{p.relative_to(E).as_posix():{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)}};(E/'KANIT-MANIFEST.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
z=D/'stars-faz96h62-takip-kanit.zip'
with zipfile.ZipFile(z,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as f:
 for p in sorted(files+[E/'KANIT-MANIFEST.json']):
  info=zipfile.ZipInfo(p.relative_to(E).as_posix(),(2026,10,28,12,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;f.writestr(info,p.read_bytes())
with zipfile.ZipFile(z) as f:
 assert f.testzip() is None;assert set(f.namelist())==set(m['files'])|{'KANIT-MANIFEST.json'}
 for n,r in m['files'].items():
  b=f.read(n);assert len(b)==r['bytes'] and hashlib.sha256(b).hexdigest()==r['sha256']
proof={'file':z.name,'bytes':z.stat().st_size,'sha256':hashlib.sha256(z.read_bytes()).hexdigest(),'crc':'PASS','manifestFiles':len(m['files']),'zipEntries':len(m['files'])+1}
meta={'kind':'96H.6.2 follow-up diagnosis','newAICandidate':False,'newGamePublished':False,'productionBuild':'96h61','Save':8,'startingHead':'d11b0e236792f012d9dcaae401462ee2deb5832b','sourceRuntime19Unchanged':True,'evidence':proof,'protocol':'research/96h62/followup/PROTOCOL.json','publication':'Research-only commit and remote verification in final report'}
(R/'RESEARCH-96H62-FOLLOWUP.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');shutil.copy2(R/'RESEARCH-96H62-FOLLOWUP.json',D/'RESEARCH-96H62-FOLLOWUP.json');(D/'EVIDENCE-96H62-FOLLOWUP.json').write_text(json.dumps(proof,indent=2));print(json.dumps(proof))
