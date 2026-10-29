import json,collections,sys
W={'11':['base','pl1','pl3','pl5','pl6'],'23':['base','pl1','pl2','pl3','pl4']}
def conq(f,horizon):
  d=json.load(open(f));F=d['flips'];out=[]
  for i,x in enumerate(F):
    if x['from']==x['to']:continue
    t=x['type'] or ('teslim' if x['by']=='combatTick' else 'other')
    later=[y for y in F[i+1:] if y['sys']==x['sys'] and y['pl']==x['pl']]
    lostDay=later[0]['day'] if later else None
    def held(mo):
      if x['day']+mo*30>horizon*30:return None
      return lostDay is None or lostDay>x['day']+mo*30
    out.append(dict(t=t.split('/')[0],popLoss=x['pop0']-x['pop1'],popPct=(x['pop0']-x['pop1'])/max(1e-9,x['pop0']),bLoss=x['b0']-x['b1'],held12=held(12),held24=held(24),pop0=x['pop0']))
  return out
if __name__=='__main__':
  arms=sys.argv[1:] or ['c9','candD']
  for s in W:
    for a in arms:
      R=[];[R.extend(conq(f'runs3/{a}-{s}-{w}-240.json',240)) for w in W[s]]
      by=collections.defaultdict(list)
      for r in R:by[r['t']].append(r)
      line=[]
      for t,v in sorted(by.items()):
        h12=[r['held12'] for r in v if r['held12'] is not None];h24=[r['held24'] for r in v if r['held24'] is not None]
        line.append(f"{t}:n={len(v)} pop-%={round(100*sum(r['popPct'] for r in v)/len(v))} popLost={round(sum(r['popLoss'] for r in v),1)} bLost={sum(r['bLoss'] for r in v)} held12={sum(h12)}/{len(h12)} held24={sum(h24)}/{len(h24)}")
      print(s,a,' | '.join(line))
