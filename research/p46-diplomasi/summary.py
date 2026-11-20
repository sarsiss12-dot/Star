import gzip
import json
from collections import Counter, defaultdict
from pathlib import Path

raw = Path(__file__).parent / 'raw'
worlds = [json.load(gzip.open(p)) for p in sorted(raw.glob('*.json.gz'))]
ends = {seed: min(w['rows'][-1]['day'] for w in worlds if w['seed'] == seed)
        for seed in (11, 99, 404)}
output = []
for w in worlds:
    rows = [r for r in w['rows'] if r['day'] <= ends[w['seed']]]
    end = rows[-1]
    events = [e for e in w['events'] if e['day'] <= end['day']]
    ids = {f['id'] for r in rows for f in r['feds']}
    lives = {}
    for fid in sorted(ids):
        history = [(r['day'], f) for r in rows for f in r['feds'] if f['id'] == fid]
        live = [f for _, f in history]
        born, last = history[0][0], history[-1][0]
        adds = sum(len(set(y['m']) - set(x['m'])) for x,y in zip(live,live[1:]))
        losses = sum(len(set(x['m']) - set(y['m'])) for x,y in zip(live,live[1:]))
        lives[fid] = dict(first=born/30, last=last/30, ongoing=last==end['day'],
                          types=sorted({f['type'] for f in live}), initial=live[0]['m'],
                          final=live[-1]['m'], adds=adds, losses=losses)
    talks = defaultdict(Counter)
    for e in events:
        if e['kind']=='talk':
            terms = '+'.join(sorted({i['t'] for i in e['g']+e['w']}))
            talks[terms][e['karar']] += 1
            if e['uygulandi']:
                talks[terms]['applied'] += 1
    politics=defaultdict(Counter)
    for e in events:
        if e['kind']=='politics':
            k=e['event']
            if k=='vote':
                k += ':'+str(e['d'].get('law'))+':'+str(e['d'].get('passed'))
            if e['event']=='motion':
                k+=':'+str(e['d'].get('kind'))
            politics[e['type']][k]+=1
    independent = sorted(set(end['live'])-{i for f in end['feds'] for i in f['m']})
    output.append(dict(seed=w['seed'],mode=w['mode'],comparison=end['day']/30,last=w['rows'][-1]['day']/30,
        rivals=sum(p in ('militarist','kriminal','izolasyonist') for _,p in w['personas']),
        first=min((x['first'] for x in lives.values()),default=None),blocks=len(end['feds']),peak=max(len(r['feds']) for r in rows),
        largest=max((len(f['m']) for f in end['feds']),default=0),live=len(end['live']),independent=independent,
        peakShare=max(max((len(f['m']) for f in r['feds']),default=0)/len(r['live']) for r in rows),
        lifetimes=lives,talks=talks,politics=politics,events=Counter(e['kind'] for e in events),
        deliveries=end['deliveries']))
(raw/'summary.json').write_text(json.dumps(output,ensure_ascii=False,indent=1)+'\n')
for w in output:
    print(w['mode'],w['seed'],w['last'],w['comparison'],w['rivals'],w['first'],w['blocks'],w['peak'],w['largest'],w['live'],w['independent'],round(w['peakShare'],2),
          [(l['first'],l['last'],l['types'],l['adds'],l['losses']) for l in w['lifetimes'].values()],w['events'].get('war',0),w['deliveries'])
