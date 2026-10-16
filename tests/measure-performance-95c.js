'use strict';
const {runtime}=require('./helpers/runtime'),fs=require('fs');const h=runtime();
h.run(`setupGame({name:'95C route budget',race:'insan',traits:[],size:'ulu',shape:'sarmal',diff:'normal',seed:404,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;G.feds=[];G.council=null;G.warLedger=warLedgerEmpty();G.jointOps=jointEmpty();
 var ids=[1,2,3],enemy=4;for(const e of G.emps){e.war={};e.ally={};e.passage={};if(!e.wild&&!e.crisisSide){for(const o of G.emps)if(o!==e){e.contact[o.id]=true;e.passage[o.id]=true;}}}
 for(const s of G.sys){s.nest=false;s.ruin=false;s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();}
 for(const id of ids){var e=G.emps[id];e.war[enemy]=G.emps[enemy].war[id]=true;for(const a of ids)if(a!==id)e.ally[a]=true;newFleet(e,e.home,Array.from({length:20},()=>({c:'kor'})));}
 var root=warLedgerOpen(1,4);warLedgerOpen(2,4,{sponsor:1,enemy:4,kind:'promise'});warLedgerOpen(3,4,{sponsor:1,enemy:4,kind:'promise'});
 for(const e of G.emps)e.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};
 var routes=0,routeMs=0,oldRoute=aiKnownRoute;aiKnownRoute=(...args)=>{const t=Date.now(),r=oldRoute(...args);routes++;routeMs+=Date.now()-t;return r;};var runs=[];
 for(let i=0;i<5;i++){const start=Date.now(),r=jointCreate(jointContext(root.campaign,0,1,4),'capture',G.emps[4].home);runs.push({ms:Date.now()-start,ok:r.ok,reason:r.why,fleets:r.plan?.fleets.length});if(r.ok)jointClose(r.plan,'cancelled','Benchmark reset');G.jointOps.cooldowns={};}
 var r=jointCreate(jointContext(root.campaign,0,1,4),'capture',G.emps[4].home);jointTick();var before=routes,start=Date.now();for(let i=0;i<1000;i++)jointTick();var stable={ticks:1000,ms:Date.now()-start,routeCalls:routes-before};
 if(r.ok)jointClose(r.plan,'cancelled','Stress reset');G.jointOps.cooldowns={};for(const id of ids)for(let i=0;i<7;i++)newFleet(G.emps[id],G.emps[id].home,Array.from({length:5},()=>({c:'kor'})));var prior=routes,t=Date.now(),stressPlan=jointCreate(jointContext(root.campaign,0,1,4),'capture',G.emps[4].home);var stress={ms:Date.now()-t,ok:stressPlan.ok,fleets:stressPlan.plan?.fleets.length,routeCalls:routes-prior};
 `);
const result=JSON.parse(h.run('JSON.stringify({systems:G.sys.length,empires:G.emps.length,runs,routes,routeMs,stable,stress})'));fs.writeFileSync('tests/audit-95c/performance.json',JSON.stringify(result,null,2));console.log(result);
