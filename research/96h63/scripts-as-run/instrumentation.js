// Audit-only hooks: delegate exactly once, read returned choices, never draw RNG.
var audit4Trace=[],audit4Steps=0,audit4Context=null,audit4Pick=new Map();
function audit4Eligible(e){return !!e&&e.ai&&!e.wild&&!e.crisisSide;}
function audit4Emit(kind,data){audit4Trace.push({day:G.day,step:audit4Steps,kind,rng:RND_STATE,...data});}
function audit4Stocks(){return G.emps.filter(audit4Eligible).map(e=>({id:e.id,res:{...e.res},inc:{...e.inc}}));}
for(const name of ['economyTick','vassalTick','edictTick','tributeTick','fedTick']){
 const fn=globalThis[name];globalThis[name]=function(...args){
  if(name==='economyTick'&&args[0])return fn(...args);
  const before=audit4Stocks(),r=fn(...args),after=audit4Stocks();
  for(const b of before){const a=after.find(x=>x.id===b.id);if(!a)continue;const delta={};for(const k in b.res)if(Math.abs(a.res[k]-b.res[k])>1e-10)delta[k]=a.res[k]-b.res[k];
   if(Object.keys(delta).length)audit4Emit('flow',{stage:name,actor:b.id,delta,before:b.res,after:a.res,income:a.inc});}
  if(name==='fedTick')audit4Emit('pre-ai',{rows:after});
  return r;
 };
}
var audit4Order=aiEconomicOrder;aiEconomicOrder=function(e,s,p,needs){const r=audit4Order(e,s,p,needs);if(audit4Eligible(e))audit4Emit('economic-order',{actor:e.id,s:s.id,p:p.i,legacy:needs.slice(),choices:r.slice(),res:{...e.res},inc:{...e.inc},goal:e.aiStrategy?.objective?.kind,stage:e.aiStrategy?.plan?.stage});return r;};
var audit4DemPick=aiDemolitionChoice;aiDemolitionChoice=function(e,s,p,needs,...args){const r=audit4DemPick(e,s,p,needs,...args);if(audit4Eligible(e)){audit4Pick.set(p,r?{...r}:null);audit4Emit('demolition-choice',{actor:e.id,s:s.id,p:p.i,needs:needs.slice(),pick:r?{...r}:null});}return r;};
for(const name of ['queueBuilding','queueDemolish','queueShip']){
 const fn=globalThis[name];globalThis[name]=function(e,...args){const before={...e.res},rngBefore=RND_STATE,r=fn(e,...args);if(r&&audit4Eligible(e)){
  const key=name==='queueShip'?args[1]:args[2],p=name==='queueShip'?null:args[1];
  audit4Emit(name,{actor:e.id,s:args[0].id,p:p?.i,key,before,after:{...e.res},rngBefore,paid:Object.fromEntries(Object.keys(before).map(k=>[k,before[k]-e.res[k]])),intent:name==='queueDemolish'?audit4Pick.get(p)||null:null});
 }return r;};
}
var audit4Build=colonyBuildTick;colonyBuildTick=function(dt){
 const before=[];for(const s of G.sys)for(const p of s.planets)if(p.col?.q?.length)before.push({s:s.id,p:p.i,planet:p,col:p.col,job:p.col.q[0],owner:p.owner,buildings:{...p.col.b}});
 const r=audit4Build(dt);
 for(const b of before)if(!b.col.q.includes(b.job))audit4Emit('job-finished',{actor:b.planet.owner,previousOwner:b.owner,s:b.s,p:b.p,key:b.job.key,dem:!!b.job.dem,paid:b.job.paid,refund:b.job.refund,before:b.buildings,after:{...b.col.b},success:b.job.dem?(b.col.b[b.job.key]||0)<(b.buildings[b.job.key]||0):(b.col.b[b.job.key]||0)>(b.buildings[b.job.key]||0)});
 return r;
};
var audit4Step=dailyTick;dailyTick=function(dt){audit4Steps++;return audit4Step(dt);};
var audit4AI=aiTurn;aiTurn=function(e){if(audit4Eligible(e))audit4Emit('ai-start',{actor:e.id,res:{...e.res},inc:{...e.inc}});const r=audit4AI(e);if(audit4Eligible(e))audit4Emit('ai-end',{actor:e.id,res:{...e.res},inc:{...e.inc}});return r;};
var audit4Secession=secessionTick;secessionTick=function(...args){const n=G.emps.length,r=audit4Secession(...args);for(const e of G.emps.slice(n))audit4Emit('birth',{actor:e.id,race:e.race,colonies:e.colonies,resources:{...e.res},queues:e.colonies.map(c=>({s:c.s,p:c.p,q:G.sys[c.s].planets[c.p].col.q}))});return r;};


var H5={trace:[],identities:[],dropped:0};
if(typeof ecoFinance63==='function'){
 var financeTrace63=[];const finance63Original=ecoFinance63;
 ecoFinance63=function(e){const v=finance63Original(e);if(e.id===7&&financeTrace63.length<100)financeTrace63.push({day:G.day,stock:{...e.res},income:{...e.inc},active:v.active,base:v.base,selected:v.selected,options:v.rows});return v;};
}
