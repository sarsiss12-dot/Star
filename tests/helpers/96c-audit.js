'use strict';
// Test-only observer. No RNG, resource assignments or persistent game fields.
let lastAudit96={sys:null,month:-1};
const Audit96C={enabled:true,counts:{},samples:[],months:[],orders:{},built:{},buildings:{},aiMs:0,routeMs:0,routeCalls:0,planningMs:{},routeCounts:{},structFailures:{},yardSlotDays:0,yardBusyDays:0,
 note(k,detail){this.counts[k]=(this.counts[k]||0)+1;if(detail&&this.samples.length<120)this.samples.push({day:G.day,reason:k,...detail});},
 census(){
  const month=Math.floor(G.day/30);if(lastAudit96.sys===G.sys&&lastAudit96.month===month)return;lastAudit96={sys:G.sys,month};
  const st=G.commerce||{contracts:[]};
  for(const a of G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide))for(const b of G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide&&e.id>a.id)){
   const detail={a:a.id,b:b.id};let reason=Commerce.pairGate(a,b);
   if(reason){this.note('pair:'+reason);continue;}
   if(!a.contact[b.id]||!b.contact[a.id]){this.note('no-contact');continue;}
   if(st.contracts.some(c=>!Commerce.closed(c)&&[c.a,c.b].includes(a.id)&&[c.a,c.b].includes(b.id))){this.note('existing-contract');continue;}
   const give=Commerce.resources.filter(r=>(a.inc?.[r]||0)>5&&(b.inc?.[r]||0)<2&&a.res[r]>15),want=Commerce.resources.filter(r=>(b.inc?.[r]||0)>5&&(a.inc?.[r]||0)<2&&b.res[r]>15);
   const hubsA=tradeHubs(a),hubsB=tradeHubs(b);
   if(!hubsA.length||!hubsB.length){this.note('no-port',detail);continue;}
   if(!give.length||!want.some(r=>give.some(s=>s!==r))){this.note('no-reciprocal-match',{...detail,give,want});continue;}
   let route=false;for(const s of hubsA)for(const t of hubsB)if(Commerce.route(a,b,s,t))route=true;
   this.note(route?'eligible-96b-match':'no-known-three-hop-route',detail);
  }
 },
 monthly(){const empires=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide).map(e=>{const inv=aiShipInventory(e),yards=inv.yards,builders=G.fleets.filter(f=>f.e===e.id&&fleetHasRole(f,'insaat'));return {id:e.id,stock:{...e.res},net:{...e.inc},ships:Object.values(inv.counts).reduce((a,b)=>a+b,0),classes:inv.counts,pending:inv.pending,cap:e.cap,usage:inv.usage,power:totalPower(e),yards:yards.length,idleYards:yards.filter(s=>!activeShipQueue(s).length).length,reasons:e.aiShipPlan?.reasons||[],builders:builders.length,idleBuilders:builders.filter(f=>!f.mv&&!f.path.length&&f.building===undefined&&!RemoteConstruction.tasks(f).length).length,construction:{...G.construction?.metrics},ports:tradeHubs(e).length,contacts:Object.values(e.contact).filter(Boolean).length,shortage:!!e.shortage,crisis:e.crisis||null};});for(const e of empires)for(const r of e.reasons)this.note('navy:'+r);this.months.push({month:Math.floor(G.day/30),empires});if(this.months.length>120)this.months.shift();},
 install(){
  const wrap=(name,fn)=>{const old=globalThis[name];globalThis[name]=function(...args){return fn.call(this,old,args)};};
  const tick=Commerce.aiTick;Commerce.aiTick=function(...args){if(Audit96C.enabled)Audit96C.census();const t=auditClock();try{return tick.apply(this,args)}finally{Audit96C.planningMs.commerce=(Audit96C.planningMs.commerce||0)+auditClock()-t}};
  wrap('aiNegotiate',function(old,args){const r=old.apply(this,args);if(Audit96C.enabled&&args[2]?.some(i=>i.t==='freight'))Audit96C.note('negotiation:'+(r.uygulandi?'applied':r.karar||'none')+':'+r.why,{a:args[0].id,b:args[1].id});return r});
  wrap('queueShip',function(old,args){const ok=old.apply(this,args);if(ok&&args[0].ai){const k=args[2];Audit96C.orders[k]=(Audit96C.orders[k]||0)+1;}return ok});
  wrap('queueBuilding',function(old,args){const ok=old.apply(this,args);if(ok&&args[0].ai){const k=args[3];Audit96C.buildings[k]=(Audit96C.buildings[k]||0)+1;}return ok});
  wrap('aiTurn',function(old,args){const t=auditClock();try{return old.apply(this,args)}finally{Audit96C.aiMs+=auditClock()-t}});
  wrap('aiKnownRoute',function(old,args){const t=auditClock();try{return old.apply(this,args)}finally{Audit96C.routeCalls++;Audit96C.routeMs+=auditClock()-t}});
  for(const name of ['aiStructTick','aiMarketTick','directiveTick'])wrap(name,function(old,args){const t=auditClock();try{return old.apply(this,args)}finally{Audit96C.planningMs[name]=(Audit96C.planningMs[name]||0)+auditClock()-t}});
  for(const [obj,key]of [[Commerce,'route'],[RemoteConstruction,'route']]){const old=obj[key],name=obj===Commerce?'commerce':'construction';obj[key]=function(...args){Audit96C.routeCounts[name]=(Audit96C.routeCounts[name]||0)+1;return old.apply(this,args)};}
  wrap('startStruct',function(old,args){const [e,s,key,f]=args;const lack=Object.entries(structCost(e,key)).filter(([r,v])=>(e.res[r]||0)<v).map(([r])=>r).join(',');const ok=old.apply(this,args);if(!ok&&e.ai){const why=lack?'stock:'+lack:!structAllowed(e,s,key)?'conditions':'builder-state';Audit96C.structFailures[why]=(Audit96C.structFailures[why]||0)+1;Audit96C.note('struct-start-failed:'+why,{empire:e.id,key,system:s.id});}return ok});
  wrap('dailyTick',function(old,args){const dt=args[0],done=[];for(const s of G.sys){const e=G.emps[s.owner];if(!e?.ai||e.wild||e.crisisSide)continue;const n=yardCount(s),active=activeShipQueue(s);Audit96C.yardSlotDays+=n*dt;Audit96C.yardBusyDays+=active.length*dt;for(const i of active){const q=s.queue[i];if(q.left<=dt)done.push({s,q});}}const r=old.apply(this,args);for(const {s,q}of done)if(!s.queue.includes(q)&&G.emps[q.e]&&!G.emps[q.e].dead&&s.owner===q.e)Audit96C.built[q.cls]=(Audit96C.built[q.cls]||0)+1;return r});
 }
};Audit96C.install();
