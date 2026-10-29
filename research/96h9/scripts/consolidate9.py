# Derive the 96H.9 research summaries from the raw arm9 runs (runs/, ru/).
import json,sys,collections,importlib.util
S=sys.argv[1];H=f'{S}/h9'
W={'11':['','-pl1','-pl3','-pl5','-pl6'],'23':['','-pl1','-pl2','-pl3','-pl4']}
ARMS={'c':'96H.8','b':'B','x':'C','y':'BC=96H.9'}
spec=importlib.util.spec_from_file_location('af',f'{H}/tools/armyfate.py')
src=open(f'{H}/tools/armyfate.py').read().split('ws={')[0]
af={};exec(src.replace('S=sys.argv[1]',''),af)
trade={};fates={};caps={}
for s,ws in W.items():
 for a,name in ARMS.items():
  T=[];F=[];C=[]
  for w in ws:
   d=json.load(open(f'{H}/runs/{a}{s}{w}-240-final.save'));r=json.load(open(f'{H}/runs/{a}{s}{w}-240.json'))
   st=d['commerce'].get('stats',{});alive={e['id'] for e in d['emps'] if not e.get('dead') and not e.get('wild') and e.get('ai')}
   dead={}
   for row in r['rows']:
    for e in row['emps']:
     if e['dead'] and e['id'] not in dead:dead[e['id']]=int(row['day']//30)
   pairs=collections.Counter(f"{c['a']}-{c['b']}" for c in d['commerce']['contracts'])
   T.append({'world':w or 'base','deliveriesAliveAI':sum(v.get('deliveries',0) for k,v in st.items() if int(k) in alive),'contractPairs':dict(pairs),'deadActorsMonth':dead})
   F.append(af['fate'](f'{H}/runs/{a}{s}{w}-240.json',240))
   Hm={e['id']:e.get('home') for e in d['emps']}
   cc=[e for e in r['events'] if e['kind']=='capture' and e['flips']]
   falls=collections.Counter(e['type'] for e in r['events'] if e['kind']=='fall')
   C.append({'world':w or 'base','colonyCaptures':len(cc),'capitals':sum(1 for e in cc if Hm.get(e['sysFrom'])==e['sys']),'falls':dict(falls),'groundBattles':sum(1 for e in r['events'] if e['kind']=='ground'),'captures':[{'month':int(e['day']//30),'sys':e['sys'],'by':e['by'],'from':e['sysFrom']} for e in cc]})
  trade[f'seed{s}-{name}']=T;fates[f'seed{s}-{name}']={'perWorld':F,'total':{k:sum(f[k] for f in F) for k in F[0]}};caps[f'seed{s}-{name}']=C
json.dump({'note':'5 worlds per seed (base + 4 one-draw placebos), 240 months. Seed11 has one trade pair (4-5); under 96H.9 actor 3 conquers actor 5 in 5/5 worlds, ending that pair.','worlds':trade},open(f'{H}/out/TRADE-240.json','w'),indent=1)
json.dump({'note':'army fleets seen in monthly snapshots; consumed = disappears within a month of a clean (temiz) invasion, else lost/other','arms':fates},open(f'{H}/out/ARMY-FATES-240.json','w'),indent=1)
json.dump(caps,open(f'{H}/out/CAPTURES-240.json','w'),indent=1)
for k,v in fates.items():print(k,v['total'])
for k,v in trade.items():print(k,[t['deliveriesAliveAI'] for t in v])
for k,v in caps.items():print(k,[c['colonyCaptures'] for c in v],[c['capitals'] for c in v],[c['falls'].get('temiz',0) for c in v],[c['falls'].get('katastrof',0) for c in v])
