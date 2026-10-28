from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parents[1];R=P/'I1';p=R/'ai.js';s=p.read_text();helper=(P/'scripts/prototype.js').read_text();helper=helper.replace('/* Read-only 96H.6.2 prototype.', '/* 96H.6.2: one time-indexed wallet for actual colony decisions.').replace('ecoPrefix62','aiQueuePrefixDelta').replace('ecoFrame62','aiStockFrame').replace('ecoRate62','aiStockRate').replace('ecoPath62','aiStockPath')
s=s.replace('function aiEconomyPlan(e){',helper+'\nfunction aiEconomyPlan(e,timed=false){',1)
needle=' const atWar=Object.keys(e.war||{}).some(id=>e.war[id]&&G.emps[id]&&!G.emps[id].dead&&!G.emps[id].wild);'
insert=''' const frame=timed?aiStockFrame(e):null,path=frame?aiStockPath(e,frame):null;
 if(path)for(const r of Object.keys(target)){
  const row=rows[r];row.net=path.rows.reduce((n,x)=>n+(x.net[r]||0)-(x.freight[r]||0),0)/path.rows.length;
  row.months=path.empty[r]??(path.terminal[r]<0?6+Math.max(0,path.last[r])/-path.terminal[r]:null);
  row.urgency=(row.net<0?30+Math.min(30,-row.net*6/Math.max(30,row.stock)*20):target[r]>0?Math.max(0,1-row.net/target[r])*12:0)+(row.stock<floor[r]?8*(1-row.stock/Math.max(1,floor[r])):0);
  row.reserve=floor[r]+Math.max(0,-row.net)*6;
 }
'''
assert needle in s;s=s.replace(needle,insert+needle,1)
s=s.replace("const critical=['ene','min','yiy','tuk','ala'].some(r=>rows[r].net<0&&rows[r].months<6);", "const critical=['ene','min','yiy','tuk','ala'].some(r=>path?path.empty[r]!==undefined:rows[r].net<0&&rows[r].months<6);",1)
s=s.replace("return {horizon:6,rows,committed,queued,federation:budget.dues,vassal,policy:","return {horizon:6,rows,committed,queued,...(path?{frame,path}:{}),federation:budget.dues,vassal,policy:",1)
a=s.index('function aiRecoverEconomy(e){');b=s.index('function aiBuildingSustainable(',a)
s=s[:a]+'''function aiRecoverEconomy(e){
 if(!e.ai||e.id===0||e.dead||e.aiTalk?.['economy-recovery']?.until>G.day)return false;
 const plan=aiEconomyPlan(e,true),base=plan.path,resources=['ene','min','yiy','tuk','ala'];
 if(base.empty.min===undefined&&base.empty.ene===undefined)return false;
 const order=resources.filter(r=>base.empty[r]!==undefined).sort((a,b)=>base.empty[a]-base.empty[b]||plan.rows[b].urgency-plan.rows[a].urgency||a.localeCompare(b));
 const compare=(a,b)=>{for(const r of order){const months=a.shortage[r]-b.shortage[r];if(months)return months;const debt=Math.max(0,-a.min[r])-Math.max(0,-b.min[r]);if(Math.abs(debt)>.0000001)return debt;}return 0;};
 const safe=p=>resources.every(r=>p.min[r]>=Math.min(0,base.min[r])-.0000001),candidates=[];
 for(const c of e.colonies){const sys=G.sys[c.s],pl=sys?.planets[c.p];if(!pl?.col||pl.owner!==e.id)continue;
  const consider=(key,dem)=>{const cost=dem?{}:buildingCost(e,key),action={s:sys.id,p:pl.i,key,dem,cost},path=aiStockPath(e,plan.frame,action);
   if(!safe(path)||compare(path,base)>=0)return;
   const d=aiBuildingDelta(e,sys,pl,key,false,dem?-1:1),benefit=(base.empty.min!==undefined?Math.max(0,d.min)*3:0)+(base.empty.ene!==undefined?Math.max(0,d.ene)*3:0);
   candidates.push({sys,pl,key,dem,path,score:benefit-Math.max(0,-d.ala)*.4-Math.max(0,-d.ara)*.15});
  };
  for(const [key,n]of Object.entries(pl.col.b))if(n&&!['santral','maden','ciftlik','liman','tersane'].includes(key)&&!(pl.col.q||[]).some(q=>q.dem&&q.key===key))consider(key,true);
  if(colonyQueued(pl.col)<2&&colonyUsed(pl.col)+colonyQueued(pl.col)<colonySlots(pl.col,e,pl))for(const key of ['maden','santral']){
   if((pl.col.b[key]||0)+colonyQueuedOf(pl.col,key)>=BUILDINGS[key].max)continue;
   if(aiBuildingSustainable(e,sys,pl,key,plan))consider(key,false);
  }
 }
 candidates.sort((a,b)=>compare(a.path,b.path)||Number(a.dem)-Number(b.dem)||b.score-a.score||a.sys.id-b.sys.id||a.key.localeCompare(b.key));
 const pick=candidates[0];if(!pick)return false;
 const ok=pick.dem?queueDemolish(e,pick.sys,pick.pl,pick.key):queueBuilding(e,pick.sys,pick.pl,pick.key);if(!ok)return false;
 (e.aiTalk||(e.aiTalk={}))['economy-recovery']={until:G.day+120,reason:'Timed paid recovery: '+pick.key};
 AIDiagnostics.note('recovery:'+(pick.dem?'demolish':'build'),e,null,pick.key+'; time-indexed wallet; no early output or refund');return true;
}
'''+s[b:]
a=s.index('function aiBuildingSustainable(');b=s.index('/* 96F.3:',a)
s=s[:a]+'''function aiBuildingSustainable(e,sys,pl,key,plan=aiEconomyPlan(e,true)){
 if(!BUILDINGS[key])return false;const cost=buildingCost(e,key);
 if(!Object.entries(cost).every(([r,v])=>(e.res[r]||0)-(plan.committed[r]||0)>=v))return false;
 const frame=plan.frame||aiStockFrame(e),base=plan.path||aiStockPath(e,frame),candidate=aiStockPath(e,frame,{s:sys.id,p:pl.i,key,cost});
 return ['ene','min','yiy','tuk','ala'].every(r=>candidate.min[r]>=Math.min(0,base.min[r])-.0000001);
}
'''+s[b:]
s=s.replace("Object.keys(keys).filter(r=>plan.rows[r].net<0&&plan.rows[r].months<6)","Object.keys(keys).filter(r=>plan.path?plan.path.empty[r]!==undefined:plan.rows[r].net<0&&plan.rows[r].months<6)",1)
s=s.replace("const plan=aiEconomyPlan(e),resourceBuilding=", "const plan=aiEconomyPlan(e,true),resourceBuilding=",1)
s=s.replace("return row.net<0&&row.months<12||row.stock<Math.max(120,row.reserve)&&row.urgency>12;", "return plan.path.empty[r]!==undefined||row.net<0&&typeof row.months==='number'&&row.months<12||row.stock<Math.max(120,row.reserve)&&row.urgency>12;",1)
p.write_text(s)
p=R/'RELEASE-MANIFEST.json';d=json.loads(p.read_text());d['files']={n:hashlib.sha256((R/n).read_bytes()).hexdigest() for n in d['files']};p.write_text(json.dumps(d,indent=2)+'\n')
protocol=json.loads((P/'evidence/PROTOCOL.json').read_text());protocol['candidate']={'name':'I1','scope':'Shared paid queue and upfront-cost trajectory for colony solvency and mineral/energy recovery. Ordinary strategic/naval plan mode preserved. No thresholds, bonuses, C2, A2, cancellation or seed exceptions.','codeChange':'Only isolated I1/ai.js; production remains canonical until all gates pass.'};(P/'evidence/PROTOCOL.json').write_text(json.dumps(protocol,indent=2))
print('I1 made; one integrated candidate, not yet accepted')
