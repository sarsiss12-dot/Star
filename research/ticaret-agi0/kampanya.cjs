'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const path=require('node:path');
const {runtime}=require('../../tests/helpers/runtime');
const [file,months,out,root]=process.argv.slice(2);
const h=runtime({root:path.resolve(root||'.'),processGlobal:true});
const save=fs.readFileSync(file,'utf8');
h.sb.inputSave=save;
h.sb.followFreight=process.env.STARS_TRACE_FREIGHT==='1';
h.run(`if(!deserialize(inputSave))throw Error('Save8');
 var tradeEvents={},uniqueContracts=new Set(),longJourneys=new Set(),finishedVoyages=new Set(),observations=[];
 var contractChanges=[],lastContract=new Map(),decisions=[];
 var prevNote=AIDiagnostics.note;
 AIDiagnostics.note=function(code,e,other,detail){
  if(code.startsWith('trade-')){
   tradeEvents[code]=(tradeEvents[code]||0)+1;
   if(followFreight)decisions.push([G.day,e?.id,other?.id,code,detail]);
  }
  return prevNote.apply(this,arguments);
 };
 function sample(){
  const st=Commerce.state(),states=G.emps.filter(e=>!e.dead&&!e.crisisSide&&!e.wild);
  for(const c of st.contracts){
   uniqueContracts.add(c.id);
   if(!followFreight)continue;
   const record={id:c.id,parties:[c.a,c.b],born:c.born,once:!!c.once,legs:c.legs,cycle:c.cycle,status:c.status,reason:c.reason,delivered:c.delivered,lost:c.lost};
   const key=JSON.stringify(record);
   if(key!==lastContract.get(c.id)){lastContract.set(c.id,key);contractChanges.push([G.day,JSON.parse(key)]);}
  }
  for(const v of st.convoys){if(v.route.length>4)longJourneys.add(v.id);if(v.status==='delivered')finishedVoyages.add(v.id);}
  observations.push({day:G.day,ports:states.reduce((n,e)=>n+tradeHubs(e).length,0),empiresInCrisis:states.filter(e=>e.crisis).map(e=>e.id),
   trades:uniqueContracts.size,chain:longJourneys.size,deliveries:finishedVoyages.size,rng:RND_STATE});
 }
 function month(){
  const start=Math.floor(G.day/30);
  for(let i=0;i<60&&!G.over;i++){
   G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
   if(Math.floor(G.day/30)>start){monthTick();break;}
  }
 }
 sample();`);
for(let m=0;m<Number(months)&&!h.run('G.over');m++)h.run('month();sample()');
const data=JSON.parse(h.run('JSON.stringify({seed:G.cfg.seed,systems:G.sys.length,observations,tradeEvents,...(followFreight?{contractChanges,decisions}:{})})'));
data.file=path.basename(file);data.sha256=crypto.createHash('sha256').update(save).digest('hex');
fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');
