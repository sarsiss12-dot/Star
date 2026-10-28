from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parents[1]/'T1';p=P/'ai.js';s=p.read_text();s=s.replace('function aiBuildingDelta(e,sys,pl,key,queued=false,direction=1){','function aiBuildingDelta(e,sys,pl,key,queued=false,direction=1,queueCount=Infinity){',1).replace('if(queued)for(const q of pl.col.q||[])','if(queued)for(const q of (pl.col.q||[]).slice(0,queueCount))',1)
old='const d=aiBuildingDelta(e,sys,pl,null,true);for(const r in d)projected[r]=(projected[r]||0)+d[r];'
new='''// Credit paid serial jobs only for production months inside this horizon.
  let delay=0,previous={};
  for(let i=0;i<pl.col.q.length;i++){
   delay+=Math.max(.5,Math.ceil(pl.col.q[i].left/.5)*.5);
   const first=Math.ceil((G.day+delay)/30)-Math.floor(G.day/30),weight=Math.max(0,Math.min(6,7-first))/6;
   if(!weight)break;
   const next=aiBuildingDelta(e,sys,pl,null,true,1,i+1);
   for(const r in next)projected[r]=(projected[r]||0)+(next[r]-(previous[r]||0))*weight;
   previous=next;
  }'''
assert old in s;s=s.replace(old,new,1);p.write_text(s)
p=P/'RELEASE-MANIFEST.json';d=json.loads(p.read_text());d['files']={n:hashlib.sha256((P/n).read_bytes()).hexdigest() for n in d['files']};p.write_text(json.dumps(d,indent=2)+'\n')
print('T1 only: time-weighted paid queue credit; no C2, no A2, no new thresholds')
