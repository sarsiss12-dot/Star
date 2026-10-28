'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{runtime}=require('../../Star/tests/helpers/runtime');
const P=path.resolve(__dirname,'..'),root=path.resolve(__dirname,'../../phase96h62/control'),inputFile=path.resolve(__dirname,'../../phase96h62/evidence/seed11-checkpoint217.save'),input=fs.readFileSync(inputFile,'utf8'),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),prior=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../phase96h62/evidence/local-11-217/control/L62-11-217-control-11.json'))),results=[];
for(const label of ['canonical','wait','farm_then_demolish','mine_then_farm','farm_then_demolish_repeat']){
 const arm=label.replace('_repeat',''),h=runtime({root});h.sb.inputFU=input;assert(h.run('deserialize(inputFU)'));h.run('delete inputFU');h.run(fs.readFileSync(path.resolve(__dirname,'../../phase96h61/scripts/read-only-metrics.js'),'utf8'));
 const initialSave=h.run('serialize()'),initialRng=h.run('RND_STATE');assert.equal(hash(initialSave),prior.initialSaveHash);assert.equal(initialRng,prior.initialRng);
 h.sb.armFU=arm;h.run(`
 var sequenceFU={arm:armFU,manual:[],accepted:[],blocked:[],finished:[],births:[]},permitFU=false,issuedFU=new Set();
 const buildFU=queueBuilding,demolishFU=queueDemolish;
 function isolatedFU(e){return e?.id===7&&sequenceFU.arm!=='canonical'&&G.day<=224*30;}
 queueBuilding=function(e,s,p,key){if(isolatedFU(e)&&!permitFU){sequenceFU.blocked.push({day:G.day,kind:'build',key});return false;}const before=e.id===7?{res:{...e.res},inc:{...e.inc},q:JSON.parse(JSON.stringify(p.col.q||[])),b:{...p.col.b}}:null,r=buildFU(e,s,p,key);if(r&&before)sequenceFU.accepted.push({day:G.day,kind:'build',key,manual:permitFU,before,after:{...e.res}});return r;};
 queueDemolish=function(e,s,p,key){if(isolatedFU(e)&&!permitFU){sequenceFU.blocked.push({day:G.day,kind:'demolish',key});return false;}const before=e.id===7?{res:{...e.res},inc:{...e.inc},q:JSON.parse(JSON.stringify(p.col.q||[])),b:{...p.col.b}}:null,r=demolishFU(e,s,p,key);if(r&&before)sequenceFU.accepted.push({day:G.day,kind:'demolish',key,manual:permitFU,before,after:{...e.res}});return r;};
 const orderFU=aiEconomicOrder;aiEconomicOrder=function(e,s,p,legacy){
  if(isolatedFU(e)){
   const m=G.day/30,token=m+':'+s.id+':'+p.i,first=sequenceFU.arm==='farm_then_demolish'?'ciftlik':'maden',second=sequenceFU.arm==='farm_then_demolish'?'dokum':'ciftlik',key=m===218?first:m===219?second:null;
   if(sequenceFU.arm!=='wait'&&key&&!issuedFU.has(token)){
    issuedFU.add(token);const dem=sequenceFU.arm==='farm_then_demolish'&&m===219,before={...e.res},qBefore=JSON.parse(JSON.stringify(p.col.q||[]));let ok;
    permitFU=true;try{ok=dem?queueDemolish(e,s,p,key):queueBuilding(e,s,p,key);}finally{permitFU=false;}
    if(!ok)throw Error('Scripted action could not be funded/executed: '+token+' '+key);
    const q=p.col.q.at(-1),delay=p.col.q.reduce((n,x)=>n+Math.max(.5,Math.ceil(x.left/.5)*.5),0);
    sequenceFU.manual.push({day:G.day,kind:dem?'demolish':'build',key,s:s.id,p:p.i,before,after:{...e.res},paid:{...q.paid},refund:q.refund?{...q.refund}:null,qBefore,qAfter:JSON.parse(JSON.stringify(p.col.q)),projectedFinishDay:G.day+delay,firstProductionMonth:Math.ceil((G.day+delay)/30)});
   }
  }
  return orderFU(e,s,p,legacy);
 };
 const tickFU=colonyBuildTick;colonyBuildTick=function(dt){const before=[];for(const s of G.sys)for(const p of s.planets)if(p.owner===7&&p.col?.q?.length)before.push({s:s.id,p:p.i,col:p.col,job:p.col.q[0],b:{...p.col.b}});const r=tickFU(dt);for(const b of before)if(!b.col.q.includes(b.job))sequenceFU.finished.push({day:G.day,key:b.job.key,dem:!!b.job.dem,s:b.s,p:b.p,paid:b.job.paid,refund:b.job.refund,before:b.b,after:{...b.col.b},stocksAfterCompletion:{...G.emps[7].res},success:(b.col.b[b.job.key]||0)!==(b.b[b.job.key]||0)});return r;};
 const birthFU=secessionTick;secessionTick=function(...args){const n=G.emps.length,r=birthFU(...args);for(const e of G.emps.slice(n))if(e.id===7)sequenceFU.births.push(JSON.parse(JSON.stringify({day:G.day,id:e.id,race:e.race,res:e.res,colonies:e.colonies.map(c=>({s:c.s,p:c.p,b:G.sys[c.s].planets[c.p].col.b,pop:G.sys[c.s].planets[c.p].col.pop}))})));return r;};
 `);
 const monthly=[];for(let month=218;month<=240;month++){
  h.run('for(let i=0;i<60;i++){const d=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>d)monthTick()}');
  const raw=h.run('serialize()'),rng=h.run('RND_STATE'),integrity={month,rng,saveHash:hash(raw)};
  if(arm==='canonical')assert.deepEqual(integrity,prior.monthlyIntegrity.find(x=>x.month===month),'new canonical replay matches sealed phase62 local control');
  const e=JSON.parse(h.run(`JSON.stringify((()=>{const e=G.emps[7];return {id:e.id,dead:e.dead,race:e.race,res:e.res,inc:e.inc,crisis:e.crisis,shortage:e.shortage,overlord:e.overlord,techs:Object.keys(e.techs).length,ships:G.fleets.filter(f=>f.e===e.id).reduce((n,f)=>n+f.ships.length,0),power:readOnlyPowerH5(e),colonies:e.colonies.map(c=>{const p=G.sys[c.s].planets[c.p];return {...c,b:p.col?.b,pop:p.col?.pop,q:p.col?.q}})};})())`));
  assert.equal(h.run('serialize()'),raw,'metrics preserve Save');assert.equal(h.run('RND_STATE'),rng);
  monthly.push({...integrity,actor:e});
  if([224,240].includes(month))fs.writeFileSync(path.join(P,'evidence',label+'-'+month+'.save'),raw);
 }
 const result={label,arm,inputSHA256:hash(input),initialSaveHash:hash(initialSave),initialRng,monthly,actions:JSON.parse(h.run('JSON.stringify(sequenceFU)')),finalSaveHash:monthly.at(-1).saveHash};
 fs.writeFileSync(path.join(P,'evidence',label+'.json'),JSON.stringify(result,null,2));results.push(result);
 console.log(JSON.stringify({arm:label,orders:result.actions.manual.map(x=>({month:x.day/30,key:x.key,kind:x.kind,paid:x.paid,finish:x.projectedFinishDay,production:x.firstProductionMonth})),at224:monthly.find(x=>x.month===224).actor,last:monthly.at(-1).actor}));
}
const A=results.find(x=>x.label==='farm_then_demolish'),B=results.find(x=>x.label==='farm_then_demolish_repeat');assert.deepEqual(A.monthly,B.monthly,'same arm repeats with exact Save/RNG');assert.deepEqual(A.actions,B.actions);fs.writeFileSync(path.join(P,'evidence/INTEGRITY.json'),JSON.stringify({sameInputAndRng:true,canonical23MonthFullSaveRngMatch:true,manualActionsUsedNativeCostsAndQueues:true,repeatFarmArmFullSaveRngEqual:true,metricsPure:true,runtimeUnchanged:true},null,2));
