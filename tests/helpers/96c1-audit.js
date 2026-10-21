'use strict';
// External bounded observer; no game fields, RNG, or player-visible intelligence.
const auditLost96c1=new WeakSet();
const Audit96C={counts:{},samples:[],months:[],orders:{},built:{},buildings:{},aiMs:0,routeMs:0,routeCalls:0,planningMs:{},routeCounts:{},structFailures:{},yardSlotDays:0,yardBusyDays:0,profile:{},actors:{},
 hullSnapshot(){const m=new Map();for(const f of G.fleets)for(const sh of f.ships)if(SHIPS[sh.c]?.rol==='sav')m.set(sh,{id:f.e,c:sh.c});return m;},
 removed(before){const after=new Set(G.fleets.flatMap(f=>f.ships));for(const [sh,info]of before)if(!after.has(sh)&&!auditLost96c1.has(sh)){auditLost96c1.add(sh);const row=this.actor(info.id);row.losses[info.c]=(row.losses[info.c]||0)+1;}},
 power(e){const names=['_powAt','_powC'],old=names.map(k=>Object.getOwnPropertyDescriptor(e,k));try{return totalPower(e)}finally{names.forEach((k,i)=>{if(old[i])Object.defineProperty(e,k,old[i]);else delete e[k]});}},
 actor(id){return this.actors[id]||(this.actors[id]={orders:{},built:{},losses:{},spend:{},warDays:0,slotDays:0,busyDays:0});},
 note(k){this.counts[k]=(this.counts[k]||0)+1;},
 time(k,dt){const p=this.profile[k]||(this.profile[k]={calls:0,ms:0,maxMs:0,samples:[]});p.calls++;p.ms+=dt;p.maxMs=Math.max(p.maxMs,dt);if(p.samples.length<4096)p.samples.push(dt);},
 monthly(){this.months.push({month:Math.floor(G.day/30),empires:G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide).map(e=>{const i=aiShipInventory(e);return {id:e.id,stock:{...e.res},net:{...e.inc},classes:i.counts,pending:i.pending,cap:e.cap,usage:i.usage,combatUsage:i.combatUsage,power:this.power(e),yards:i.yards.length,idleYards:i.yards.filter(s=>!activeShipQueue(s).length).length,reasons:e.aiShipPlan?.reasons||[],energyUpkeep:fleetUpkeep(e),alloyUpkeep:fleetAlloyUpkeep(e),techs:Object.keys(e.techs).filter(k=>e.techs[k]).length,scienceBanks:{...e.rp},fleets:G.fleets.filter(f=>f.e===e.id&&isArmed(f)).map(f=>({id:f.id,power:fleetPower(f),defending:f.guardLocked||false,attacking:!!f.path?.length,supply:fleetSupply(e,f)})),...JSON.parse(JSON.stringify(this.actor(e.id)))};})});},
 install(){
 const wrap=(obj,key,tag,after)=>{const old=obj[key];if(typeof old!=='function')return;obj[key]=function(...args){const t=auditClock();let r;try{r=old.apply(this,args);return r}finally{const dt=auditClock()-t;Audit96C.time(tag,dt);if(after)after(args,r,dt);}};};
 for(const [key,tag] of Object.entries({aiTurn:'aiTurn',aiEconomyPlan:'economic-reserves',aiEconomicOrder:'building-selection',aiBuildingDelta:'building-delta',aiPickStruct:'struct-choice',structAllowed:'structure-allowed',aiShipInventory:'ship-inventory',aiShipProduction:'navy-production',aiConstructionCandidate:'construction-candidates',aiObservedThreat:'path-safety',aiKnownRoute:'military-route',aiNegotiate:'diplomatic-negotiation',evalOffer:'offer-value',aiStructTick:'construction-turn',directiveTick:'directive'}))wrap(globalThis,key,tag);
 for(const [key,tag]of Object.entries({aiTick:'trade-opportunities',aiPorts:'trade-port-search',route:'trade-route',aiTerms:'trade-pricing',aiValue:'trade-valuation',quote:'trade-quote'}))wrap(Commerce,key,tag);
 wrap(RemoteConstruction,'route','construction-route');
 wrap(globalThis,'queueShip','ship-order',(a,r)=>{if(r&&a[0].ai){const row=Audit96C.actor(a[0].id);row.orders[a[2]]=(row.orders[a[2]]||0)+1;Audit96C.orders[a[2]]=(Audit96C.orders[a[2]]||0)+1;}});
 const qb=queueBuilding;queueBuilding=function(e,s,p,k){const before={...e.res},r=qb(e,s,p,k);if(r&&e.ai){Audit96C.buildings[k]=(Audit96C.buildings[k]||0)+1;const row=Audit96C.actor(e.id);for(const key in before)row.spend[key]=(row.spend[key]||0)+before[key]-e.res[key];}return r;};
 for(const key of ['attritionTick','aiDisbandTick','purgeEmpire']){const old=globalThis[key];if(typeof old==='function')globalThis[key]=function(...args){const before=Audit96C.hullSnapshot();try{return old.apply(this,args)}finally{Audit96C.removed(before)}};}
 const day=dailyTick;dailyTick=function(dt){const done=[],before=new Map();for(const f of G.fleets)for(const sh of f.ships)if(SHIPS[sh.c]?.rol==='sav')before.set(sh,{id:f.e,c:sh.c});for(const e of G.emps)if(e.ai&&!e.dead&&!e.wild&&!e.crisisSide){if(Object.values(e.war).some(Boolean))Audit96C.actor(e.id).warDays+=dt;}
 for(const s of G.sys){const e=G.emps[s.owner];if(!e?.ai||e.wild||e.crisisSide)continue;const n=yardCount(s),active=activeShipQueue(s),row=Audit96C.actor(e.id);row.slotDays+=n*dt;row.busyDays+=active.length*dt;Audit96C.yardSlotDays+=n*dt;Audit96C.yardBusyDays+=active.length*dt;for(const i of active){const q=s.queue[i];if(q.left<=dt)done.push({s,q});}}
 const r=day(dt);for(const {s,q}of done)if(!s.queue.includes(q)&&G.emps[q.e]&&!G.emps[q.e].dead&&s.owner===q.e){const row=Audit96C.actor(q.e);row.built[q.cls]=(row.built[q.cls]||0)+1;Audit96C.built[q.cls]=(Audit96C.built[q.cls]||0)+1;}
 Audit96C.removed(before);return r;};
 }
};Audit96C.install();
