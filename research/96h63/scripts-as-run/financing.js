/* 96H.6.3 research F1. Bounded two-action financing; frozen current factors.
   All prices, durations and queues come from the existing engine. */
function ecoActions63(e,frame){
 const out=[null];
 for(const c of frame.colonies){const s=G.sys[c.s],p=s.planets[c.p];
  for(const key of ['santral','maden','ciftlik','fabrika','dokum'])if((!BUILDINGS[key].tech||e.techs[BUILDINGS[key].tech])&&(c.b[key]||0)<BUILDINGS[key].max&&colonyUsed({b:c.b})<colonySlots(p.col,e,p)&&colonyQueued(p.col)<2){
   const d=aiBuildingDelta(e,s,p,key,true);if(key!=='ciftlik'||d.yiy>0)out.push({s:s.id,p:p.i,key,dem:false,cost:buildingCost(e,key)});
  }
  for(const [key,n]of Object.entries(c.b))if(n&&!['santral','maden','ciftlik','liman','tersane'].includes(key)&&!(p.col.q||[]).some(q=>q.dem&&q.key===key))out.push({s:s.id,p:p.i,key,dem:true,cost:{}});
 }
 return out;
}
function ecoSeries63(e,f,sequence){
 const K=f.keys,stocks=Object.fromEntries(K.map(r=>[r,(e.res[r]||0)-(f.committed[r]||0)])),raw=f.raw.map(x=>({...x})),refund=f.refunds.map(x=>({...x})),paid=[],complete=[],deltas={},ends=[],nets=[],zero={};let legal=true;
 const local=Object.fromEntries(f.colonies.map(c=>[c.s+':'+c.p,{...c,b:{...c.b},valid:c.valid.slice(),end:f.day+c.delay,queued:colonyQueued(G.sys[c.s].planets[c.p].col)}]));
 function append(a,m){if(!a)return true;const c=local[a.s+':'+a.p],s=G.sys[a.s],p=s.planets[a.p],token=a.s+':'+a.p+':'+a.key+':'+a.dem;
  if(!c||(a.dem?(c.b[a.key]||0)<=0:c.queued>=2||(c.b[a.key]||0)>=BUILDINGS[a.key].max||colonyUsed({b:c.b})>=colonySlots(p.col,e,p)))return false;
  if(!Object.entries(a.cost).every(([r,v])=>stocks[r]>=v))return false;
  for(const [r,v]of Object.entries(a.cost))stocks[r]-=v;
  const at=m===0?f.day:f.first+(m-1)*30,cost=a.dem?demolishDays(e,a.key):buildDays(e,a.key),finish=Math.max(at,c.end)+cost,idx=Math.max(0,Math.ceil((finish-f.first)/30));
  const old=ecoPrefix62(e,s,p,c.valid);c.valid.push({key:a.key,dem:a.dem});const next=ecoPrefix62(e,s,p,c.valid),d=Object.fromEntries(K.map(r=>[r,(next[r]||0)-(old[r]||0)]));deltas[token]=d;
  for(let i=idx;i<f.horizon;i++)for(const r of K)raw[i][r]=(raw[i][r]||0)+d[r];
  if(a.dem&&idx<f.horizon)for(const [r,v]of Object.entries(demolishRefund(a.key)))refund[idx][r]=(refund[idx][r]||0)+v;
  c.b[a.key]=Math.max(0,(c.b[a.key]||0)+(a.dem?-1:1));c.end=finish;if(!a.dem)c.queued++;
  paid.push({...a,orderMonth:m,cost:a.cost,finish,firstProductionMonth:Math.ceil(finish/30)});return true;
 }
 if(sequence[0]&&!append(sequence[0],0))legal=false;
 let second=!sequence[1],debt=0;
 for(let m=0;m<f.horizon;m++){
  if(m>=1&&!second&&append(sequence[1],m))second=true;
  const net=ecoRate62(e,raw[m],f.first+m*30);for(const r of K){stocks[r]+=(net[r]||0)+(refund[m][r]||0)-(f.freight[m][r]||0);if(stocks[r]<0){debt+=-stocks[r];zero[r]=(zero[r]||0)+1;}}ends.push({...stocks});nets.push(net);
 }
 if(!second)legal=false;
 const terminal=nets.at(-1),producer={ene:'santral',min:'maden',yiy:'ciftlik',tuk:'fabrika',ala:'dokum'},risks=[];
 for(const [r,key]of Object.entries(producer))if(terminal[r]<0){
  let best=Infinity;
  for(const c of Object.values(local)){const p=G.sys[c.s].planets[c.p];if((c.b[key]||0)>=BUILDINGS[key].max||colonyUsed({b:c.b})>=colonySlots(p.col,e,p))continue;
   let finance=0;for(const [currency,v]of Object.entries(buildingCost(e,key))){const short=v-stocks[currency];if(short>0)finance=Math.max(finance,terminal[currency]>0?short/terminal[currency]:Infinity);}
   best=Math.min(best,finance+Math.max(0,(c.end-(f.first+(f.horizon-1)*30))/30)+buildDays(e,key)/30);
  }
  const runway=Math.max(0,stocks[r])/-terminal[r];if(best>runway)risks.push({resource:r,runway,repairMonths:best});
 }
 return {legal,paid,ends,nets,zero,debt,terminal,last:{...stocks},risks,score:[risks.length,Object.values(zero).reduce((a,b)=>a+b,0),debt]};
}
function ecoCompare63(a,b){for(let i=0;i<a.score.length;i++){const d=a.score[i]-b.score[i];if(Math.abs(d)>1e-7)return d;}return 0;}
function ecoFinance63(e){
 const f=ecoFrame62(e),base=ecoSeries63(e,f,[]),critical=Object.keys(base.zero).some(r=>['min','ene','yiy','tuk','ala'].includes(r));
 if(!critical)return {active:false,frame:f,base};
 const actions=ecoActions63(e,f),rows=[];
 for(const first of actions){const one=ecoSeries63(e,f,[first]);if(!one.legal)continue;let best=one;
  // The second action repairs the earliest resource to exhaust. No branching
  // beyond one further ordinary producer; terminal risks expose a third need.
  const r=Object.keys(one.terminal).filter(r=>['min','ene','yiy','tuk','ala'].includes(r)&&one.terminal[r]<0).sort((a,b)=>Math.max(0,one.last[a])/-one.terminal[a]-Math.max(0,one.last[b])/-one.terminal[b]||a.localeCompare(b))[0];
  const needed={ene:'santral',min:'maden',yiy:'ciftlik',tuk:'fabrika',ala:'dokum'}[r];
  if(needed)for(const second of actions)if(second&&!second.dem&&second.key===needed){const two=ecoSeries63(e,f,[first,second]);if(two.legal&&ecoCompare63(two,best)<0)best=two;}
  rows.push({first,path:best});
 }
 rows.sort((a,b)=>ecoCompare63(a.path,b.path));const selected=rows[0];return {active:true,frame:f,base,rows,selected:selected&&ecoCompare63(selected.path,base)<0?selected:null};
}
