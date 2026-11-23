'use strict';
const {runtime}=require('../../tests/helpers/runtime');
const fs=require('node:fs'),crypto=require('node:crypto');
const [save,out]=process.argv.slice(2),h=runtime();
h.sb.input=fs.readFileSync(save,'utf8');
h.run(`
if(!deserialize(input))throw Error('Save8');
const C=Commerce, normal=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide);
const buildings=['santral','maden','ciftlik','dokum','fabrika'];
const value=(e,r,n)=>itemValue(e,{t:'res',r,v:n},e);
const found=[];
for(const e of normal){
 const balances=C.aiBalance(e),hubs=tradeHubs(e),inSystem=new Set(hubs);
 const choices=colonizeTargets(e).filter(x=>G.sys[x.s].owner<0);
 const highest=choices.filter((x,i)=>choices.findIndex(y=>x.s===y.s)===i).slice(0,8);
 const domestic=[];
 for(const [i,r] of C.resources.entries())if(balances[r].net<0){
  for(const row of e.colonies){
   const s=G.sys[row.s],p=s.planets[row.p],key=buildings[i],order=buildingOrderCost(e,p,key);
   if(!order||p.col.q?.length)continue;
   const delta=aiBuildingDelta(e,s,p,key);
   if(delta[r]<=0)continue;
   domestic.push({r,key,system:s.id,order,delta,costValue:Object.entries(order).reduce((n,[r,x])=>n+value(e,r,x),0),
    monthValue:Object.entries(delta).reduce((n,[r,x])=>n+value(e,r,x),0)});
  }
 }
 const shared=[];
 for(const b of normal){
  if(e===b||C.pairGate(e,b))continue;
  const targets=tradeHubs(b).filter(t=>C.identifiedPort(e,G.sys[t],b));
  if(!targets.length)continue;
  const A=balances,B=C.aiBalance(b);
  if(!C.resources.some(r=>A[r].need>0&&B[r].export>=1))continue;
  if(hubs.some(s=>targets.some(t=>C.route(e,b,s,t,{avoidObserved:true})&&C.route(b,e,t,s,{avoidObserved:true}))))continue;
  for(const {s,p,h} of highest){
   if(!C.known(b,G.sys[s])||!C.identifiedPort(b,G.sys[s],e))continue;
   for(const t of targets){
    const f=C.route(e,b,s,t,{avoidObserved:true}),back=C.route(b,e,t,s,{avoidObserved:true});
    if(!f||!back)continue;
    const distance=f.slice(1).reduce((n,id,i)=>n+dist(G.sys[id],G.sys[f[i]]),0);
    const n=C.aiTerms(e,b,A,B,{source:s,target:t,distance});
    const va=n?C.aiValue(e,{from:b.id,to:e.id,give:n.want,want:n.give}).net:null;
    const slot=G.sys[s].planets[p];shared.push({s,p,h,partner:b.id,t,route:f,terms:!!n,value:va,planetType:slot.t,lux:slot.lux||null});
   }
  }
 }
 empireIncome(e,true);
 found.push({e:e.id,weight:balances,actual:e._incomeDetail?.sum,col:e.colonies.length,portCols:e.colonies.filter(c=>inSystem.has(c.s)).length,colonizeTested:highest,colonizableSystems:new Set(choices.map(x=>x.s)).size,domestic,shared});
}
const result={day:G.day,seed:G.cfg.seed,systems:G.sys.length,found};
`);
const data=JSON.parse(h.run('JSON.stringify(result)'));data.input=crypto.createHash('sha256').update(h.sb.input).digest('hex');data.rng=h.run('RND_STATE');
fs.writeFileSync(out,JSON.stringify(data)+'\n');
