'use strict';
const {runtime}=require('../../tests/helpers/runtime');
const fs=require('node:fs'),crypto=require('node:crypto');
const [save,out]=process.argv.slice(2);
const h=runtime();h.sb.input=fs.readFileSync(save,'utf8');
h.run(`
if(!deserialize(input))throw Error('Save8');
const baseline=serialize(), baselineRng=RND_STATE;
const C=Commerce, original=C.route, relay=C.relay;
const source=original.toString();
if(!source.includes('row.hops>=3')||!source.includes('initialHops>3'))throw Error('Rota sınırı kaynağı değişti');
const route4=eval('(function '+source.replace('initialHops>3','initialHops>4').replace('row.hops>=3','row.hops>=4').replaceAll('*4+hops','*5+hops').replace('row.hops<2','row.hops<3')+')');
const routes={H0:original,H1:original,H2:original,H3:route4,H5:original};
const active=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide);
const possible=active.map(e=>e.id);
const balances=Object.fromEntries(active.map(e=>[e.id,C.aiBalance(e)]));
const times={},rows=[],pairs=[];
const newBalance=(a,i)=>Object.fromEntries(C.resources.map((r,idx)=>{
 const row=balances[a.id][r];
 return [r,{...row,need:idx===i?Math.max(10,row.need):row.need,export:idx===i?row.export:Math.max(row.export,Math.min(16,Math.max(0,row.stock-row.reserve)))}];
}));
const key=(a,b)=>[a.id,b.id].sort((x,y)=>x-y).join(':');
const travel=path=>path.slice(1).reduce((n,id,i)=>n+Math.max(1,dist(G.sys[path[i]],G.sys[id])/C.speed),0);
function potential(a,b,A,B,ports,forward,back){
 const n=C.aiTerms(a,b,A,B,ports),scan={...C._aiTermsScan};if(!n)return {scan};
 const x=n.give[0],y=n.want[0],inverse={from:b.id,to:a.id,give:n.want,want:n.give};
 const va=C.aiValue(a,inverse).net,vb=C.aiValue(b,n).net;
 return {scan,x,y,va,vb,runway:[A[y.r].net<0?A[y.r].stock/-A[y.r].net:null,B[x.r].net<0?B[x.r].stock/-B[x.r].net:null],
  startLate:[Math.ceil(travel(back))+4>30*(A[y.r].net<0?A[y.r].stock/-A[y.r].net:Infinity),
             Math.ceil(travel(forward))+4>30*(B[x.r].net<0?B[x.r].stock/-B[x.r].net:Infinity)]};
}
// Geography-only independent reach check. It ignores knowledge and access, never war/blockade.
function structural(a,b,source,target){
 const q=[[source,0]],seen=new Set([source*4]);
 for(let i=0;i<q.length;i++){
  const [id,hops]=q[i];if(id===target)return true;if(hops===3)continue;
  for(const next of G.sys[id].lanes){
   const s=G.sys[next];if(s.cr>0||s.owner>=0&&(a.war[s.owner]||b.war[s.owner]))continue;
   const h=next!==target&&s.planets.some(p=>p.col?.b?.liman>0)?0:hops+1,k=next*4+h;
   if(!seen.has(k)){seen.add(k);q.push([next,h]);}
  }
 }
 return false;
}
function quotePair(a,b,mode,ports){
 const grant=new Set(active.filter(o=>o!==a&&o!==b).flatMap(o=>[o.id+':'+a.id,o.id+':'+b.id]));
 const grants=mode==='H2'?grant:undefined;
 const A=mode==='H5'?newBalance(a,(a.id+G.cfg.seed)%5):balances[a.id];
 const B=mode==='H5'?newBalance(b,(b.id+G.cfg.seed)%5):balances[b.id];
 const laws=G.feds.map(f=>[f,f.laws?.ticaret]);
 if(mode==='noFed')for(const [f] of laws)if(f.laws)f.laws.ticaret=false;
 if(mode==='H1')C.relay=(e,s)=>!(s.cr>0);
 const route=routes[mode]||original;
 const tally={available:0,safe:0,terms:0,eligible:0};
 let best=null;
 try{
 for(const [source,target] of ports){
  const f=route.call(C,a,b,source,target,{avoidObserved:true,grants});
  if(!f)continue;tally.available++;
  const r=route.call(C,b,a,target,source,{avoidObserved:true,grants});
  if(!r)continue;tally.safe++;
  const estimated=potential(a,b,A,B,{source,target,distance:travel(f)*C.speed},f,r);
  if(!estimated.x)continue;tally.terms++;
  const fx=route.call(C,a,b,source,target,{avoidObserved:true,grants,volume:estimated.x.v});
  const rx=route.call(C,b,a,target,source,{avoidObserved:true,grants,volume:estimated.y.v});
  if(!fx||!rx)continue;tally.eligible++;
  const score=Math.min(estimated.va,estimated.vb);
  if(!best||best.score<score)best={score,estimated,fx,rx,days:[Math.ceil(travel(fx))+4,Math.ceil(travel(rx))+4]};
 }
 }finally{
 C.relay=relay;
 if(mode==='noFed')for(const [f,v] of laws)if(f.laws){if(v===undefined)delete f.laws.ticaret;else f.laws.ticaret=v;}
 }
 return {tally,best};
}
const t0=Date.now();for(const a of active)for(const b of active){
 if(a.id>=b.id)continue;
 const A=balances[a.id],B=balances[b.id],pact=!C.pairGate(a,b),
 canTrade=!C.pairGate(a,b,true),cool=(a.aiTalk?.['commerce:'+b.id]?.until||0)>G.day;
 const s=tradeHubs(a),t=tradeHubs(b),portPairs=s.flatMap(x=>t.map(y=>[x,y]));
 const matching=C.resources.some(r=>A[r].export>=1&&B[r].need>0||B[r].export>=1&&A[r].need>0);
 const existing=C.state().contracts.some(c=>!C.closed(c)&&C.key(c.a,c.b)===C.key(a.id,b.id));
 const listed={id:key(a,b),pact,canTrade,cool,existing,reason:C.pairGate(a,b),matching,origins:s.length,targets:t.length,
  known:portPairs.filter(([x,y])=>C.identifiedPort(a,G.sys[y],b)&&C.identifiedPort(b,G.sys[x],a)).length};
 pairs.push(listed);
 if(!canTrade||!portPairs.length)continue;
 // Sample up to twelve nearest and six dispersed remaining endpoint pairs, identical in every arm.
 const sorted=portPairs.sort((x,y)=>dist(G.sys[x[0]],G.sys[x[1]])-dist(G.sys[y[0]],G.sys[y[1]])||x[0]-y[0]||x[1]-y[1]);
 const rest=sorted.slice(12),test=sorted.slice(0,12).concat(rest.filter((_,i)=>i%Math.ceil(rest.length/6)===0));
 const geo={known:0,open:0,gap:0,absent:0};
 for(const [s,t] of test){
  if(!C.identifiedPort(a,G.sys[t],b)||!C.identifiedPort(b,G.sys[s],a)){geo.absent++;continue;}
  geo.known++;if(structural(a,b,s,t))geo.open++;else geo.gap++;
 }
 const arms={};
 for(const mode of ['H0','H1','H2','H3','H5','noFed']){
  const start=Date.now();arms[mode]=quotePair(a,b,mode,test);times[mode]=(times[mode]||0)+Date.now()-start;
 }
 const port=C.aiPorts(a,b,{routes:96}),one=port?quotePair(a,b,'H0',[[port.source,port.target]]):null;
 let quote=null;
 if(arms.H0.best){
  const {x,y}=arms.H0.best.estimated;
  const deal={from:a.id,to:b.id,give:[x],want:[y]};
  const q=dealQuote(deal);
  quote={ok:q.ok,reason:q.reasons,values:[aiRespond(b,deal).v,aiRespond(a,{from:b.id,to:a.id,give:[y],want:[x]}).v]};
 }
 rows.push({id:key(a,b),tested:test.length,geo,arms,one,quote});
}
const result={day:G.day,seed:G.cfg.seed,systems:G.sys.length,possible,pairs,rows,times,elapsed:Date.now()-t0};
`);
const end=h.run('serialize()'),rng=h.run('RND_STATE');
// Deserialization resets derived fields. Compare with a clean deserialization of the identical input.
const raw=h.run('baseline');
const cacheKeys=['_prof','_pressAt','_powAt'];
const trim=text=>{
 const world=JSON.parse(text);
 for(const e of world.emps)for(const k of cacheKeys)delete e[k];
 return JSON.stringify(world);
};
if(trim(end)!==trim(raw)||rng!==h.run('baselineRng')){
 if(process.env.DUMP_OBSERVER){fs.writeFileSync(out+'.after',end);fs.writeFileSync(out+'.before',raw);}
 throw Error('Gözlem Save8 veya RNG değiştirdi');
}
const data=JSON.parse(h.run('JSON.stringify(result)'));
data.input=crypto.createHash('sha256').update(h.sb.input).digest('hex');
data.rng=rng;
data.save={byteEqual:end===raw,withDerivedCachesExcluded:true,excluded:cacheKeys};
fs.writeFileSync(out,JSON.stringify(data)+'\n');
