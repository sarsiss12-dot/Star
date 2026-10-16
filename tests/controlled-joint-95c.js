'use strict';
const fs=require('fs'),path=require('path'),{jointWorld}=require('./helpers/joint-fixture');
const root=path.resolve(process.argv[2]),out=process.argv[3],seed=+(process.argv[4]||11),months=+(process.argv[5]||24);
const h=jointWorld({root});h.sb.seed=seed;h.sb.months=months;
h.run(`rndSeed(seed);G.autoSave=false;G.over=null;G.year=2210;G.month=4;
 for(const e of G.emps){if(e.id>6)e.dead=true;recalcMods(e);e._powAt=-1;}
 var foe=newFleet(G.emps[4],8,Array.from({length:30},()=>({c:'kor'})),'Kontrollü cephe');newFleet(G.emps[4],4,Array.from({length:10},()=>({c:'kor'})),'Düşman ana savunması');
 // An actual second objective requires the existing monthly invasion engine.
 for(const id of [...ids,4])G.sys[G.emps[id].home].planets[0].col.b.tersane=1;
 G.emps[4].colonies.forEach(c=>{const col=G.sys[c.s].planets[c.p].col;col.garrison=40;col.shield=30;col.stab=70;});
 observe();
 var metrics={plans:[],rejected:[],orders:[],arrivals:[],losses:{},shipCosts:{},monthly:[],negative:[],routeCalls:0,routeMs:0,planMs:0,waitDays:0,supplyDays:0,maintenance:{},initialShips:G.fleets.reduce((n,f)=>n+f.ships.length,0)};
 function wrap(name,fn){const orig=globalThis[name];if(typeof orig!=='function')return;globalThis[name]=function(...args){return fn(()=>orig.apply(this,args),args)};}
 wrap('jointCreate',(call,args)=>{const t=Date.now(),r=call();metrics.planMs+=Date.now()-t;if(r?.ok)metrics.plans.push(JSON.parse(JSON.stringify(r.plan)));else metrics.rejected.push({day:G.day,why:r?.why,kind:args[1],target:args[2]});return r;});
 wrap('aiKnownRoute',call=>{const t=Date.now(),r=call();metrics.routeCalls++;metrics.routeMs+=Date.now()-t;return r;});
 wrap('orderMove',(call,[f,to])=>{const r=call();if(r)metrics.orders.push({day:G.day,id:f.id,owner:f.e,to,joint:f.jointPlan??null});return r;});
 wrap('arrive',(call,[f,s])=>{metrics.arrivals.push({day:G.day,id:f.id,owner:f.e,to:s.id,joint:f.jointPlan??null});return call();});
 wrap('queueShip',(call,[e,s,c])=>{const before={...e.res},r=call();if(r){metrics.shipCosts[e.id]??={};for(const k in before)metrics.shipCosts[e.id][k]=(metrics.shipCosts[e.id][k]||0)+Math.max(0,before[k]-e.res[k]);}return r;});
 var previous=new Map(G.fleets.flatMap(f=>f.ships.map(sh=>[sh,{owner:f.e,cls:sh.c}])));
 function sample(){const now=new Map(G.fleets.flatMap(f=>f.ships.map(sh=>[sh,{owner:f.e,cls:sh.c}])));for(const [sh,r]of previous)if(!now.has(sh)){const key=r.owner+':'+r.cls;metrics.losses[key]=(metrics.losses[key]||0)+1;}previous=now;
  for(const f of G.fleets){if(f.jointHoldUntil>G.day||f.jointPlan!==undefined&&!f.mv&&!f.path.length)metrics.waitDays+=.25;if(f.jointPlan!==undefined&&fleetSupply(G.emps[f.e],f)<=.55)metrics.supplyDays+=.25;}}
 var done=0;
 `);
const start=Date.now();h.run(`for(let i=0;i<months*120;i++){const old=Math.floor(G.day/30);G.day+=.25;dailyTick(.25);structTick(.25);colonyBuildTick(.25);autoExploreTick();sample();if(Math.floor(G.day/30)>old){for(const e of G.emps)if(!e.dead){metrics.maintenance[e.id]??={ene:0,ala:0};metrics.maintenance[e.id].ene+=fleetUpkeep(e);metrics.maintenance[e.id].ala+=fleetAlloyUpkeep(e);}monthTick();done++;metrics.monthly.push({day:G.day,losses:{...metrics.losses},combat:G.warLedger.fronts.filter(f=>f.campaign===rootFront.campaign).map(f=>({sides:f.sides,metrics:JSON.parse(JSON.stringify(f.metrics))})),shipCosts:JSON.parse(JSON.stringify(metrics.shipCosts)),maintenance:JSON.parse(JSON.stringify(metrics.maintenance)),empires:G.emps.filter(e=>!e.wild&&!e.crisisSide).map(e=>({id:e.id,dead:e.dead,stock:{...e.res},inc:{...e.inc},power:totalPower(e),ships:G.fleets.filter(f=>f.e===e.id).reduce((n,f)=>n+f.ships.length,0)}))});for(const e of G.emps)for(const[k,v]of Object.entries(e.res))if(!Number.isFinite(v)||v<-.0001)metrics.negative.push({day:G.day,id:e.id,k,v});}if(G.over)break;}`);
const result={root,seed,months:h.run('done'),ms:Date.now()-start,...JSON.parse(h.run('JSON.stringify(metrics)')),finalPlans:JSON.parse(h.run('JSON.stringify(G.jointOps||null)')),ledger:JSON.parse(h.run('JSON.stringify(G.warLedger)')),settlements:JSON.parse(h.run('JSON.stringify(G.settlements)')),finalShips:h.run('G.fleets.reduce((n,f)=>n+f.ships.length,0)'),owner8:h.run('G.sys[8].owner'),rng:h.run('RND_STATE')};
fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify({seed,months:result.months,ms:result.ms,plans:result.plans.length,arrivals:result.arrivals.filter(a=>a.to===8&&a.owner!==4),losses:result.losses,negative:result.negative.length,owner8:result.owner8,routeCalls:result.routeCalls,routeMs:result.routeMs}));
