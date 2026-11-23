'use strict';
const {runtime}=require('../../tests/helpers/runtime');
const {createHash}=require('node:crypto');
const fs=require('node:fs'),path=require('node:path');
const [seed,months,out,root='.',size='ulu',aiCount='9']=process.argv.slice(2);
const h=runtime({root:path.resolve(root)});
h.sb.untouched=process.env.STARS_BARE==='1';
h.sb.config={seed:Number(seed),size,aiCount:Number(aiCount)};
h.run(`
resetSetupNaming();setupGame({...CFG,...config});G.autoSave=false;
const baseline={ene:80,min:60,yiy:40,ala:60,tuk:40};
function ai(e){return e.ai&&!e.wild&&!e.crisisSide&&!e.dead;}
var T={months:[],deals:[],notes:[],loads:[],receipts:[],first:{},pairDates:{},breaks:[]};
const mark=(e,key)=>{(T.first[e.id]||={})[key]??=G.day;};
const oldBalance=Commerce.aiBalance;
Commerce.aiBalance=function(e){const rows=oldBalance.apply(this,arguments);
 if(ai(e)&&Object.values(rows).some(x=>x.net<0&&x.stock < -x.net*3))mark(e,'need');return rows;};
const oldNote=AIDiagnostics.note;
AIDiagnostics.note=function(code,a,b,why){
 if(code.startsWith('trade-'))T.notes.push([G.day,a?.id,b?.id,code,why]);
 return oldNote.apply(this,arguments);
};
const oldPorts=Commerce.aiPorts;
Commerce.aiPorts=function(a,b){const p=oldPorts.apply(this,arguments);if(p)mark(a,'reachable');return p;};
const oldDeal=executeDeal;
executeDeal=function(o){
 const result=oldDeal.apply(this,arguments);
 if(result){
  const a=G.emps[o.from],b=G.emps[o.to],items=(o.give||[]).concat(o.want||[]),k=Commerce.key(a.id,b.id);
  if(items.some(i=>i.t==='pact'))T.pairDates[k]??=G.day;
  if(items.some(i=>i.t==='freight'||i.t==='cargo'||i.t==='portTransit'||i.t==='res')){
   const c=items.some(i=>i.t==='freight'||i.t==='cargo')?Commerce.state().contracts.at(-1):null;
   T.deals.push({day:G.day,from:a.id,to:b.id,pact:T.pairDates[k]??null,id:c?.id,give:o.give,want:o.want,
     en:a.res.ene+b.res.ene,critical:[a,b].map(e=>Commerce.resources.filter(r=>e.inc?.[r]<0&&e.res[r]< -3*e.inc[r]))});
  }
 }
 return result;
};
const oldDispatch=Commerce.dispatch;
Commerce.dispatch=function(c){const yes=oldDispatch.apply(this,arguments);if(yes){
 for(const v of Commerce.state().convoys.slice(-c.legs.length))T.loads.push({day:G.day,id:v.id,contract:v.contract,from:v.e,to:v.to,r:v.r,amount:v.loaded,hops:v.route.length-1});
 }return yes;};
const oldFinish=Commerce.finish;
Commerce.finish=function(v,status,why){
 const a=G.emps[v.e],b=G.emps[v.to],before=b?.res[v.r]||0,inc=b?.inc?.[v.r]||0;
 const ok=oldFinish.apply(this,arguments);
 if(ok)T.receipts.push({day:G.day,id:v.id,status,contract:v.contract,cycle:v.cycle,from:v.e,to:v.to,r:v.r,loaded:v.loaded,delivered:v.delivered,lost:v.lost,before,inc,hops:v.route.length-1,
 valueSource:itemValue(a,{t:'res',r:v.r,v:v.loaded},b),valueReceiver:itemValue(b,{t:'res',r:v.r,v:v.delivered},a)});
 return ok;};
function observe(){
 return G.emps.filter(ai).map(e=>({id:e.id,ports:tradeHubs(e),colonies:e.colonies.length,ships:G.fleets.filter(f=>f.e===e.id).reduce((n,f)=>n+f.ships.length,0),
  techs:Array.isArray(e.tech)?e.tech.length:Object.values(e.techs||e.tech||{}).filter(Boolean).length,crisis:e.crisis||null,shortage:!!e.shortage,
  stocks:Commerce.resources.map(r=>e.res[r]||0),inc:Commerce.resources.map(r=>e.inc?.[r]||0),
  buildings:Object.fromEntries(['santral','maden','ciftlik','dokum','fabrika','liman'].map(k=>[k,e.colonies.reduce((n,c)=>n+(G.sys[c.s]?.planets[c.p]?.col?.b?.[k]||0),0)]))}));
}
if(untouched){Commerce.aiBalance=oldBalance;AIDiagnostics.note=oldNote;Commerce.aiPorts=oldPorts;executeDeal=oldDeal;Commerce.dispatch=oldDispatch;Commerce.finish=oldFinish;}
function advance(){
 const m=Math.floor(G.day/30);let guard=0;
 while(Math.floor(G.day/30)===m&&guard++<100){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();}
 monthTick();
 T.months.push({day:G.day,rng:RND_STATE,states:observe(),feds:(G.feds||[]).map(f=>[f.type,f.members.length,!!f.laws?.ticaret]),
  open:Commerce.state().contracts.filter(c=>!Commerce.closed(c)).length});
}`);
const hash=()=>createHash('sha256').update(h.run('serialize()')).digest('hex');
const start=hash();
const rootHash=process.env.STARS_SOURCE||null;
function flush(){
 const data={source:rootHash,...h.sb.config,start,end:hash(),...JSON.parse(h.run('JSON.stringify(T)'))};
 fs.writeFileSync(out,JSON.stringify(data)+'\n');return data;
}
for(let m=1;m<=Number(months)&&!h.run('G.over');m++){
 h.run('advance()');
 if([30,60,90,120,150,180,210,240].includes(m)){
  h.sb.markHash=hash();h.run('T.months.at(-1).save=markHash');
  flush();
  if(process.env.STARS_CHECKPOINTS)fs.writeFileSync(path.join(process.env.STARS_CHECKPOINTS,`${size}-${seed}-${m}.save`),h.run('serialize()'));
 }
}
const data=flush();
console.log(seed,size,data.months.length,data.deals.length,data.receipts.length,data.end);
