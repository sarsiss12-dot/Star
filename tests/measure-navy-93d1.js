'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime');
function observer(){
 const rows={},monthly=[],negative=[];let previous=new Map();
 const ai=e=>e&&e.ai&&!e.wild&&!e.crisisSide,bump=(o,k,n=1)=>o[k]=(o[k]||0)+n;
 const row=e=>rows[e.id]||(rows[e.id]={id:e.id,name:e.name,orders:{},completed:{},otherGains:{},losses:{},transfers:{},redundantScienceOrders:0,warOrders:0,peaceOrders:0,warByClass:{},peaceByClass:{},reasons:{},turns:0,maxSciencePerFleet:0,slotDays:0,busySlotDays:0,initial:{}});
 const war=e=>Object.keys(e.war||{}).some(id=>e.war[id]&&G.emps[id]&&!G.emps[id].wild&&!G.emps[id].dead);
 function counts(e){const out={};for(const f of G.fleets)if(f.e===e.id)for(const sh of f.ships)bump(out,sh.c);return out;}
 function census(source){const now=new Map();
  for(const f of G.fleets)if(ai(G.emps[f.e])){const r=row(G.emps[f.e]);r.maxSciencePerFleet=Math.max(r.maxSciencePerFleet,f.ships.filter(s=>s.c==='bil').length);
   for(const sh of f.ships){now.set(sh,{e:f.e,f:f.id,c:sh.c});const old=previous.get(sh);
    if(!old){if(source==='production')bump(r.completed,sh.c);else if(source!=='initial')bump(r.otherGains,sh.c);}
    else {if(old.f!==f.id)bump(r.transfers,sh.c);if(old.e!==f.e){bump(r.otherGains,sh.c);const from=rows[old.e];from.losses['ownership-transfer']=from.losses['ownership-transfer']||{};bump(from.losses['ownership-transfer'],sh.c);}}
   }
  }
  for(const [sh,old] of previous)if(!now.has(sh)){const r=rows[old.e];r.losses[source]=r.losses[source]||{};bump(r.losses[source],old.c);}previous=now;
 }
 census('initial');for(const e of G.emps)if(ai(e))row(e).initial=counts(e);
 function wrap(name,fn){const old=globalThis[name];globalThis[name]=function(...args){return fn(()=>old.apply(this,args),args);};}
 wrap('queueShip',(call,[e,s,cls])=>{const r=ai(e)?row(e):null;
  const sci=r&&cls==='bil'?(counts(e).bil||0)+G.sys.reduce((n,s)=>n+s.queue.filter(q=>q.e===e.id&&q.cls==='bil').length,0):0;
  const x=call();if(r)for(const [k,v]of Object.entries(e.res))if(!Number.isFinite(v)||v<-.00001)negative.push({day:G.day,id:e.id,k,v,at:'queueShip'});
  if(r&&x){bump(r.orders,cls);r[war(e)?'warOrders':'peaceOrders']++;bump(r[war(e)?'warByClass':'peaceByClass'],cls);if(cls==='bil'&&sci>=2)r.redundantScienceOrders++;}return x;
 });
 wrap('combatTick',call=>{census('production');const x=call();census('combat-other');return x;});
 wrap('battleRound',(call,[sys,A,fa,B])=>{const x=call();const a=G.emps[A],b=G.emps[B];census(a&&a.wild||b&&b.wild?'pirate':'enemy');return x;});
 for(const [name,label]of [['attritionTick','attrition'],['aiDisbandTick','disband'],['arrive','arrival/colonization']])wrap(name,call=>{census('other');const x=call();census(label);return x;});
 wrap('dailyTick',(call,[dt])=>{for(const s of G.sys){const e=G.emps[s.owner];if(ai(e)){const r=row(e),slots=yardCount(s);r.slotDays+=slots*dt;r.busySlotDays+=Math.min(slots,activeShipQueue(s).length)*dt;}}const x=call();census('other');return x;});
 wrap('aiTurn',(call,[e])=>{if(!ai(e)||e.dead)return call();const r=row(e);r.turns++;const before=Object.values(r.orders).reduce((a,b)=>a+b,0);const x=call();census('ai-other');const reasons=e.aiShipPlan&&e.aiShipPlan.reasons;
  if(reasons){for(const k of reasons)bump(r.reasons,k);}else if(Object.values(r.orders).reduce((a,b)=>a+b,0)===before)bump(r.reasons,e._navySleep?'legacy-sleep':G.sys.some(s=>s.owner===e.id&&hasYard(s))?'legacy-no-order':'no-yard');return x;
 });
 function sample(){census('other');const snap=[];for(const e of G.emps)if(ai(e)){
  const yards=G.sys.filter(s=>s.owner===e.id&&hasYard(s)),pending={};for(const s of G.sys)for(const q of s.queue)if(q.e===e.id)bump(pending,q.cls);
  for(const [k,v]of Object.entries(e.res))if(!Number.isFinite(v)||v<-.00001)negative.push({month:G.memAge,id:e.id,k,v});
  snap.push({id:e.id,dead:e.dead,war:war(e),ships:counts(e),pending,cap:e.cap,usage:fleetUsage(e),alloy:e.res.ala,alloyIncome:e.inc.ala,energy:e.res.ene,energyIncome:e.inc.ene,yards:yards.length,slots:yards.reduce((n,s)=>n+yardCount(s),0),busy:yards.reduce((n,s)=>n+activeShipQueue(s).length,0)});
 }monthly.push(snap);}
 return {sample,finish(){return {empires:Object.values(rows),monthly,negative};}};
}
function campaign(root,seed=11,months=120,observe=true){
 const h=runtime({root});h.sb.cfg={seed,months};
 h.run(`setupGame({name:'Navy audit',race:'insan',traits:[],size:'orta',shape:'sarmal',diff:'normal',seed:cfg.seed,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;economyTick(true);`);
 if(observe)h.run('var audit=('+observer.toString()+')();');const start=Date.now();
 h.run(`var months=0;for(let i=0;i<cfg.months*60;i++){const old=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>old){monthTick();months++;${observe?'audit.sample();':''}}if(G.over)break;}`);
 return {seed,months:h.run('months'),stopped:h.run('!!G.over'),...(observe?JSON.parse(h.run('JSON.stringify(audit.finish())')):{}),rng:h.run('RND_STATE'),saveHash:crypto.createHash('sha256').update(h.run('serialize()')).digest('hex'),ms:Date.now()-start};
}
module.exports={campaign};
if(require.main===module){const r=campaign(path.resolve(process.argv[2]),Number(process.argv[3]));fs.writeFileSync(process.argv[4],JSON.stringify(r,null,2));console.log(JSON.stringify({seed:r.seed,months:r.months,orders:r.empires.reduce((a,e)=>{for(const[k,v]of Object.entries(e.orders))a[k]=(a[k]||0)+v;return a},{}),negative:r.negative.length}));}
