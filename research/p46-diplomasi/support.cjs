'use strict';
const {world}=require('../../tests/helpers/beta-fed-ai0-world.cjs'),fs=require('node:fs'),path=require('node:path');
const h=world();
const data=JSON.parse(h.run(`JSON.stringify((()=>{
 for(const s of G.sys){s.ruin=null;s.monster=null;}
 G.sys[C.home].lanes=G.sys[C.home].lanes.filter(i=>i!==B.home);G.sys[B.home].lanes=G.sys[B.home].lanes.filter(i=>i!==C.home);
 const rows=[],arrivals=[],fids=G.fleets.filter(f=>f.e===C.id&&isArmed(f)).map(f=>f.id),target=B.home;
 let launched=null,firstOrder=null,payment=null;
 const ex=warPrepareLaunch;warPrepareLaunch=function(...args){const was=C.res.min,r=ex.apply(this,args);if(r.ok)payment={received:C.res.min-was,day:G.day};return r;};
 for(let i=0;i<60*18&&!G.over;i++){
  const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();
  const plan=warPreparation(A.aiStrategy?.coalition?.plan),ships=G.fleets.filter(f=>f.e===C.id&&isArmed(f));
  if(plan?.state==='launched'&&!launched)launched={day:G.day,terms:plan.commitments};
  if(launched&&!firstOrder){const f=ships.find(f=>f.path.includes(target)||f.mv?.to===target);if(f)firstOrder={day:G.day,id:f.id,sys:f.sys,dest:target};}
  for(const f of ships)if(launched&&f.sys===target&&!arrivals.some(x=>x.id===f.id))arrivals.push({day:G.day,id:f.id,target,ships:f.ships.length});
  if(Math.floor(G.day/30)>m)rows.push({day:G.day,plan:plan?.state,front:!!C.war[B.id],strength:ships.reduce((n,f)=>n+f.ships.length,0)});
 }
 return {target,fids,launched,payment,firstOrder,arrivals,rows};})())`));
fs.writeFileSync(path.join(__dirname,'raw','support.json'),JSON.stringify(data,null,1));
