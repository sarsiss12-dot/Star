import json,pathlib
from metrics import stats
P=pathlib.Path(__file__).resolve().parents[1];old=pathlib.Path('/workspace/scratch/1a1a05115f49/evidence');rows=[]
for s in [11,7,23,42,99,123,404,2026]:
 m=240 if s in [11,23,42,404] else 120
 a=json.loads((P/f'evidence/control/M{m}-{s}/control-M{m}-{s}-{s}.json').read_text());file=old/f'h5/audit96h5/L1-campaigns/L1-M240-{s}/L1-M240-{s}-{s}.json' if m==240 else old/f'h51/audit9651/baseline/L1-M120-{s}/L1-M120-{s}-{s}.json'
 if not file.exists():print('missing',file);continue
 b=json.loads(file.read_text());diff=[{'actual':x,'historical':y} for x,y in zip(a['monthlyIntegrity'],b['monthlyIntegrity']) if x!=y]
 row={'seed':s,'months':m,'initialSaveEqual':a['initialSaveHash']==b['initialSaveHash'],'firstIntegrityDifference':diff[0] if diff else None,'control':stats(a),'historical':stats(b)};rows.append(row)
 print(s,m,'firstDiff',row['firstIntegrityDifference'],'totals', {k:(row['historical'][k],row['control'][k]) for k in ['critical','deliveries','techs','colonies','power']})
(P/'evidence/historical-comparability.json').write_text(json.dumps(rows,indent=2))
