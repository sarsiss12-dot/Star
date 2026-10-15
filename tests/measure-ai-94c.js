'use strict';
const {runtime}=require('./helpers/runtime'),fs=require('fs'),path=require('path'),crypto=require('crypto');
function observer(){
 const rows={},monthly=[],negative=[],graph={calls:0,ms:0};let prev=new Map();
 const normal=e=>e&&!e.wild&&!e.crisisSide;
 const row=e=>rows[e.id]||(rows[e.id]={id:e.id,name:e.name,ai:e.ai,doctrine:researchDoctrine(e),race:e.race,ethics:e.ethics,orders:{},losses:{},operations:{},operationCost:0,negotiations:0,accepted:0,negotiationOutcomes:{},warDeclarations:0,peaces:0,factionEvents:{},idleDays:0,shipDays:0,wait:{},yardSlots:0,busySlots:0,productionBlocks:{},exploreConflicts:0});
 const bump=(o,k,n=1)=>o[k]=(o[k]||0)+n;
 for(const e of G.emps)if(normal(e))row(e);
 function wrap(name,fn){const old=globalThis[name];if(typeof old!=='function')return;globalThis[name]=function(...args){return fn(()=>old.apply(this,args),args);};}
 wrap('queueShip',(call,[e,s,cls])=>{const result=call();if(normal(e)&&result)bump(row(e).orders,cls);return result;});
 for(const name of ['runOp','stealTech','inciteRebellion'])wrap(name,(call,[e,o,key])=>{const cost=e.res.etk,res=call();if(normal(e)&&res&&res.ok){bump(row(e).operations,key||name);row(e).operationCost+=Math.max(0,cost-e.res.etk);}return res;});
 wrap('aiNegotiate',(call,[e])=>{if(normal(e))row(e).negotiations++;const r=call();if(normal(e)&&r)bump(row(e).negotiationOutcomes,r.karar||"none");if(r&&r.uygulandi&&normal(e))row(e).accepted++;return r;});
 wrap('declareWar',(call,[e])=>{const r=call();if(r&&normal(e))row(e).warDeclarations++;return r;});
 wrap('makePeace',(call,[a,b])=>{const r=call();if(r){if(normal(a))row(a).peaces++;if(normal(b))row(b).peaces++;}return r;});
 wrap('facEvent',(call,[e,kind])=>{if(normal(e))bump(row(e).factionEvents,kind);return call();});
 wrap('explorationGraph',call=>{const start=Date.now();const r=call();graph.calls++;graph.ms+=Date.now()-start;return r;});
 function sample(dt){const now=new Map(),taken=new Set();
  for(const f of G.fleets){const e=G.emps[f.e];if(!normal(e))continue;const r=row(e);
   for(const sh of f.ships)now.set(sh,{e:f.e,c:sh.c});
   if(fleetHasRole(f,'bilim')){r.shipDays+=dt;if(!f.mv&&!f.path.length&&!f.surv&&!f.combat){r.idleDays+=dt;bump(r.wait,f.explore?f.explore.status:'idle',dt);}
    const target=f.explore&&f.explore.target;if(Number.isInteger(target)&&!G.sys[target].surv.includes(e.id)){const key=e.id+':'+target;if(taken.has(key))r.exploreConflicts++;taken.add(key);}}
  }
  for(const [sh,old]of prev)if(!now.has(sh))bump(rows[old.e].losses,old.c);prev=now;
  for(const s of G.sys){const e=G.emps[s.owner];if(normal(e)){row(e).yardSlots+=yardCount(s)*dt;row(e).busySlots+=Math.min(yardCount(s),activeShipQueue(s).length)*dt;}}
 }
 function month(){const snap=[];for(const e of G.emps)if(normal(e)){
  const r=row(e);for(const k of e.aiShipPlan?.reasons||[])bump(r.productionBlocks,k);
  for(const[k,v]of Object.entries(e.res))if(!Number.isFinite(v)||v<-.00001)negative.push({month:G.memAge,id:e.id,k,v});
  const counts={};for(const f of G.fleets)if(f.e===e.id)for(const sh of f.ships)bump(counts,sh.c);
  snap.push({id:e.id,dead:!!e.dead,res:{...e.res},inc:{...e.inc},colonies:e.colonies.length,power:totalPower(e),ships:counts,usage:fleetUsage(e),cap:e.cap,
   techs:Object.keys(e.techs).filter(k=>e.techs[k]),discovered:G.sys.filter(s=>s.surv.includes(e.id)).length,
   wars:Object.keys(e.war).filter(k=>e.war[k]&&!G.emps[k]?.wild),pacts:Object.keys(e.pact||{}).filter(k=>e.pact[k]),allies:Object.keys(e.ally||{}).filter(k=>e.ally[k]),factions:e.factions?e.factions.map(f=>({k:f.k,mood:f.mood,pow:f.pow})):[],factionMods:facMods(e)});
 }monthly.push(snap);}
 sample(0);return {sample,month,finish(){return {empires:Object.values(rows),monthly,negative,graph,warLedger:G.warLedger||null,settlements:G.settlements||null};}};
}
function campaign(root,seed=11,months=120,options={}){
 const h=runtime({root});h.sb.cfg={seed,months,...options};
 h.run(`setupGame({name:'94C AI audit',race:'insan',traits:[],size:cfg.size||'orta',shape:'sarmal',diff:'normal',seed:cfg.seed,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;economyTick(true);
 if(cfg.pirates===false){G.cfg.pirates=false;G.nests=[];for(const s of G.sys)delete s.nest;G.fleets=G.fleets.filter(f=>!G.emps[f.e].wild);}
 if(cfg.poor)for(const e of G.emps)if(e.ai&&!e.wild)for(const k in e.res)e.res[k]=Math.min(e.res[k],25);
 var audit=cfg.observe===false?{sample(){},month(){},finish(){return {}}}:(${observer.toString()})();`);
 const start=Date.now();h.run(`var elapsed=0;for(let i=0;i<cfg.months*60;i++){const old=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();audit.sample(.5);if(Math.floor(G.day/30)>old){monthTick();elapsed++;audit.month();if(cfg.reloadAt===elapsed)deserialize(serialize());}if(G.over)break;}`);
 if(options.capture)fs.writeFileSync(options.capture,h.run("serialize()"));
 return {seed,months:h.run('elapsed'),requestedMonths:months,options,stopped:h.run('!!G.over'),ms:Date.now()-start,rng:h.run('RND_STATE'),saveHash:crypto.createHash('sha256').update(h.run('serialize()')).digest('hex'),...JSON.parse(h.run('JSON.stringify(audit.finish())'))};
}
module.exports={campaign};
if(require.main===module){const r=campaign(path.resolve(process.argv[2]),+process.argv[3],+(process.argv[5]||120),JSON.parse(process.argv[6]||'{}'));fs.writeFileSync(process.argv[4],JSON.stringify(r,null,2));console.log(JSON.stringify({root:process.argv[2],seed:r.seed,months:r.months,ms:r.ms,negative:r.negative.length,graph:r.graph}));}
