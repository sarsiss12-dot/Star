'use strict';
const {runtime}=require('../../tests/helpers/runtime');
const {createHash}=require('node:crypto');
const fs=require('node:fs'),path=require('node:path');
const [root,size,aiCount,seed,months,out]=process.argv.slice(2);
const h=runtime({root:path.resolve(root)});
h.sb.config={size,aiCount:Number(aiCount),seed:Number(seed)};
h.run(`
resetSetupNaming();setupGame({...CFG,...config});G.autoSave=false;
var trace={months:[],reforms:[],prizes:[],leaves:[],refused:[],battles:[]};
const normal=e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide;
const battle0=battleReportFinish;
battleReportFinish=function(r,winner){const done=r.done,result=battle0.apply(this,arguments);
 if(!done)trace.battles.push({day:G.day,a:r.a,b:r.b,winner,loss:r.loss?.slice(),system:r.system??null});
 return result;};
const motion0=proposeFedMotion;
proposeFedMotion=function(e,kind,options){
 const f=findFed(e),before=e.res.etk,r=motion0.apply(this,arguments);
 if(r.ok&&kind==='reform')trace.reforms.push({day:G.day,by:e.id,fed:f.id,from:f.type,to:options.type,leader:f.leader,members:f.members.slice(),paid:before-e.res.etk,pending:!!f.vote});
 return r;
};
const move0=aiMove;
aiMove=function(e,f,target){
 const s=G.sys[target],prize=s&&!s.seen.includes(f.e)&&!e.war?.[s.owner]&&(s.nest||s.ruin);
 const r=move0.apply(this,arguments);
 if(prize&&f.path.at(-1)===target)trace.prizes.push({day:G.day,by:f.e,fleet:f.id,target,hops:f.path.length,power:fleetPower(f)});
 return r;
};
const willing0=aiFedWilling;
aiFedWilling=function(e,founder,type,f){
 const r=willing0.apply(this,arguments);
 if(f?.id&&e?.ai&&!r.ok&&r.why?.includes('doktrinle uyumsuz')){
  const last=trace.refused.at(-1);
  if(last?.day!==G.day||last.by!==e.id||last.fed!==f.id)
   trace.refused.push({day:G.day,by:e.id,fed:f.id,type});
 }
 return r;
};
const leave0=leaveFederation;
leaveFederation=function(e){
 const f=findFed(e),r=leave0.apply(this,arguments);
 if(f&&r.ok)trace.leaves.push({day:G.day,by:e.id,fed:f.id,type:f.type});
 return r;};
function month(){
 const m=Math.floor(G.day/30);
 do{G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);}while(Math.floor(G.day/30)===m);
 monthTick();
 const row=fedFoundRead(()=>{
  const es=G.emps.filter(normal),ids=new Set(es.map(e=>e.id));
  return {day:G.day,rng:RND_STATE,empires:es.map(e=>({id:e.id,colonies:e.colonies.map(c=>[c.s,c.p]),science:e.inc?.ara||0,
   tech:Object.values(e.techs||{}).filter(Boolean).length,crisis:e.crisis||null,cg:!!e.shortage,
   power:totalPower(e),bf:findFed(e)?.id??null})),
   fronts:(G.warLedger?.fronts||[]).filter(f=>f.ended===null).map(f=>[f.id,f.campaign,f.sides,f.roles,f.started??f.day,f.entryKind]),
   feds:G.feds.map(f=>({id:f.id,type:f.type,leader:f.leader,members:f.members.slice(),reform:f.reform||null,last:f.lastVote?.motion==='reform'?f.lastVote:null})),
   fleets:G.fleets.filter(f=>ids.has(f.e)&&f.ships.length).reduce((rows,f)=>{
    const r=rows[f.e]||={ships:0,active:0,combat:0,classes:{}};
    r.ships+=f.ships.length;r.active+=(f.mv||f.path.length)?f.ships.length:0;r.combat+=f.combat?f.ships.length:0;
    for(const s of f.ships)r.classes[s.c]=(r.classes[s.c]||0)+1;
    return rows;},{}),
   joint:(G.jointOps?.plans||[]).map(p=>[p.id,p.state]),cargo:Object.values(G.commerce?.stats||{}).reduce((n,v)=>n+(v.deliveries||0),0)};
 });
 trace.months.push(row);
}
`);
const sha=s=>createHash('sha256').update(s).digest('hex');
const hashes=[];
for(let m=1;m<=Number(months);m++){
 h.run('month()');
 const save=h.run('serialize()');hashes.push(sha(save)+':'+h.run('RND_STATE'));
 if(process.env.CHECKPOINTS&&[120,180].includes(m))
  fs.writeFileSync(path.join(process.env.CHECKPOINTS,`${size}-${seed}-m${m}.save`),save);
 if(m%30===0)console.log(size,seed,m,hashes.at(-1).slice(0,16));
}
const data={...h.sb.config,hashes,...JSON.parse(h.run('JSON.stringify(trace)'))};
fs.writeFileSync(out,JSON.stringify(data)+'\n');
