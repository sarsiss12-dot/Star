import json,statistics as st
TR={'11':[1,3],'42':[2,4],'7':[4,5],'2026':[3,4]}
R=['ene','min','ala','tuk','ara','etk']
SUF=['','-pl1','-pl2','-pl3','-pl4']
out={}
for arm in ('candB','candBM','candBM4'):
  for s,ids in TR.items():
    for W in (6,12,24):
      def val(f):
        rows=json.load(open(f))['rows'][:W]
        return {r:sum(sum(e['inc'][r] for e in row['emps'] if e['id'] in ids and not e['dead']) for row in rows)/W for r in R}
      c=[val(f'band/{s}-c10{x}.json') for x in SUF];b=[val(f'band/{s}-{arm}{x}.json') for x in SUF]
      row={}
      for r in R:
        cm,bm=st.median(x[r] for x in c),st.median(x[r] for x in b);lo,hi=min(x[r] for x in c),max(x[r] for x in c);blo,bhi=min(x[r] for x in b),max(x[r] for x in b)
        row[r]={'control_med':round(cm,2),'cand_med':round(bm,2),'pct':round(100*(bm-cm)/cm,1) if cm else None,'flag':'ABOVE' if blo>hi else 'BELOW' if bhi<lo else ''}
      out[f'{arm}-{s}-{W}m']=row
json.dump(out,open('pkg/json/WINDOWS-6-12-24.json','w'),indent=1)
for k,v in out.items():
  if k.startswith('candBM4') or k.startswith('candB-'):print(k,' '.join(f"{r} {x['pct']}%{('!'+x['flag']) if x['flag'] else ''}" for r,x in v.items()))
