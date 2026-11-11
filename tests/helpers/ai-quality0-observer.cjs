'use strict';
module.exports=function observe(){
 const q={counts:{},events:[],timing:{},latestPlan:{},latestFacts:{}};
 const count=(k)=>q.counts[k]=(q.counts[k]||0)+1;
 const wrap=(name,fn)=>{if(typeof globalThis[name]!=='function')return;const old=globalThis[name];globalThis[name]=function(...args){return fn(()=>old.apply(this,args),args);};};
 const event=(k,e,data)=>{if(q.events.length<400)q.events.push({day:G.day,empire:e?.id??e,kind:k,...data});};
 for(const name of['aiTurn','aiEconomyPlan','aiMilitaryCampaign','aiShipProduction','aiNegotiate','aiSubmitTick','aiFederationPolitics','aiCoalitionDiplomacy','aiOpsTick','monthTick'])wrap(name,(call,args)=>{const t=__measureNow(),r=call(),dt=__measureNow()-t,s=q.timing[name]||(q.timing[name]={n:0,ms:0,max:0});s.n++;s.ms+=dt;s.max=Math.max(s.max,dt);if(name==='aiEconomyPlan'&&args[0])q.latestPlan[args[0].id]=r;if(name==='aiNegotiate')count(name+':'+r.karar);return r;});
 wrap('aiStrategicFacts',(call,[e])=>{const r=call();q.latestFacts[e.id]={measure:{...r.measure},severe:[...r.severe],homeThreat:r.homeThreat,nearThreat:r.nearThreat};return r;});
 for(const name of['queueBuilding','queueShip','queueDemolish','startStruct','orderMove','aiMove','applyInternalPolicy','demandVassal','seekProtection','vassalOffer','vassalRespond','warPreparationCreate','warJoinOffer','fedFoundStart','fedPropose'])wrap(name,(call,args)=>{const r=call(),ok=r===true||r?.ok===true;count(name+':'+(ok?'ok':r===false?'false':r?.why||r?.code||'other'));if(['demandVassal','seekProtection','vassalOffer','vassalRespond','applyInternalPolicy','warPreparationCreate','warJoinOffer','fedFoundStart'].includes(name))event(name,args[0],{to:args[1]?.id,ok,why:r?.why||r?.code,status:r?.status||r?.karar});return r;});
 wrap('declareWar',(call,[e,o,goal])=>{const before={enemy:o?.id,goal:typeof goal==='string'?goal:null,ownPower:totalPower(e),knownEnemy:aiKnownPower(e,o),res:{...e.res},inc:{...e.inc},objective:e.aiStrategy?.objective?.kind},r=call();count('declareWar:'+r);if(r)event('war',e,before);return r;});
 wrap('fleetLost',(call,[f,reason])=>{count('fleetLost:'+reason);count('shipsLost:'+reason+':'+f.e);q.counts['hullsRemoved:'+reason]=(q.counts['hullsRemoved:'+reason]||0)+f.ships.length;return call();});
 wrap('makePeace',(call,args)=>{const r=call();count('makePeace');return r;});
 return q;
};
