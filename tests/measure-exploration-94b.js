'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime');
function explorationObserver(){
 const rows={},bump=(o,k,n=1)=>o[k]=(o[k]||0)+n;
 const eligible=e=>e&&!e.wild&&!e.crisisSide;
 const row=e=>rows[e.id]||(rows[e.id]={id:e.id,name:e.name,ai:e.ai,surveys:0,shipDays:0,idleDays:0,travelDays:0,scanDays:0,duplicateShipDays:0,collisionEpisodes:0,losses:0,waitReasons:{},initialDiscovered:G.sys.filter(s=>s.surv.includes(e.id)).length});
 for(const e of G.emps)if(eligible(e))row(e);
 let previous=new Map(),collisions=new Set();
 for(const f of G.fleets)if(eligible(G.emps[f.e]))for(const sh of f.ships)if(sh.c==='bil')previous.set(sh,f.e);
 const original=doSurvey;doSurvey=function(f,s){const fresh=!s.surv.includes(f.e),x=original(f,s);if(fresh&&eligible(G.emps[f.e]))row(G.emps[f.e]).surveys++;return x;};
 return {sample(dt){
  const now=new Map(),targets=new Map(),nextCollisions=new Set();
  for(const f of G.fleets){const e=G.emps[f.e];if(!eligible(e))continue;
   const hulls=f.ships.filter(sh=>sh.c==='bil');if(!hulls.length)continue;
   const r=row(e);for(const sh of hulls)now.set(sh,f.e);
   r.shipDays+=dt*hulls.length;
   if(f.surv>0)r.scanDays+=dt*hulls.length;
   else if(f.mv||f.path.length)r.travelDays+=dt*hulls.length;
   else {r.idleDays+=dt*hulls.length;bump(r.waitReasons,f.explore?f.explore.status:'legacy-idle',dt*hulls.length);}
   const target=f.retreating&&(f.mv||f.path.length)?-1:f.surv>0?f.sys:f.path.length?f.path.at(-1):f.mv?f.mv.to:-1;
   if(target>=0&&!G.sys[target].surv.includes(e.id)){
    const key=e.id+':'+target;
    if(targets.has(key)){r.duplicateShipDays+=dt;nextCollisions.add(key);if(!collisions.has(key))r.collisionEpisodes++;}
    targets.set(key,f.id);
   }
  }
  for(const [sh,e]of previous)if(!now.has(sh))rows[e].losses++;
  previous=now;collisions=nextCollisions;
 },finish(){return Object.values(rows).map(r=>({...r,finalDiscovered:G.sys.filter(s=>s.surv.includes(r.id)).length,surveysPer100ShipDays:r.shipDays?100*r.surveys/r.shipDays:0}));}};
}
function campaign(root,seed,months=120,pirates=true){
 const h=runtime({root});h.sb.cfg={seed,months,pirates};
 h.run(`setupGame({name:'Exploration audit',race:'insan',traits:[],size:'orta',shape:'sarmal',diff:'normal',seed:cfg.seed,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;economyTick(true);
 if(!cfg.pirates){G.cfg.pirates=false;G.nests=[];for(const s of G.sys)delete s.nest;G.fleets=G.fleets.filter(f=>!G.emps[f.e].wild);}
 var audit=(${explorationObserver.toString()})();`);
 const start=Date.now();h.run(`var months=0;for(let i=0;i<cfg.months*60;i++){const old=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>old){monthTick();months++;}audit.sample(.5);if(G.over)break;}`);
 return {seed,requestedMonths:months,months:h.run('months'),pirates,stopped:h.run('!!G.over'),ms:Date.now()-start,rng:h.run('RND_STATE'),saveHash:crypto.createHash('sha256').update(h.run('serialize()')).digest('hex'),empires:JSON.parse(h.run('JSON.stringify(audit.finish())'))};
}
module.exports={campaign};
if(require.main===module){const r=campaign(path.resolve(process.argv[2]),+process.argv[3],+(process.argv[5]||120),process.argv[6]!=='false');fs.writeFileSync(process.argv[4],JSON.stringify(r,null,2));console.log(JSON.stringify({seed:r.seed,pirates:r.pirates,months:r.months,ms:r.ms,totals:r.empires.reduce((a,e)=>{for(const k of ['surveys','finalDiscovered','losses','idleDays','shipDays','duplicateShipDays','collisionEpisodes'])a[k]=(a[k]||0)+e[k];return a},{})}));}
