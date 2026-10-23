'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{decision}=require('./helpers/96f3-fixture');const out=path.join(__dirname,'audit96f3/controlled');fs.mkdirSync(out,{recursive:true});
const result=[];
for(const phase of ['96F1','96F3'])for(const day of [330,450,570,2370,2550]){
 const h=decision(`96F1-11-${day===2550?'ship':'turn'}-${day}-1.save`,phase==='96F1'?path.resolve(__dirname,'../../star96f1'):path.resolve(__dirname,'..'));
 h.run(`var e=G.emps[1],c=e.colonies[0],s=G.sys[c.s],p=s.planets[c.p],before={stock:{...e.res},income:{...e.inc},buildings:{...p.col.b},plan:aiEconomyPlan(e)},orders=[];for(const name of ['queueBuilding','queueShip','queueDemolish']){const fn=globalThis[name];globalThis[name]=function(e,...args){const cash={...e.res},r=fn(e,...args);if(r&&e.id===1)orders.push({kind:name,key:name==='queueShip'?args[1]:args[2],paid:Object.fromEntries(Object.keys(cash).map(k=>[k,cash[k]-e.res[k]]))});return r;}}`);
 h.run(day===2550?'aiShipProduction(e,G.sys.filter(s=>s.owner===e.id),aiProfile(e))':'aiTurn(e)');
 let row={phase,day,...JSON.parse(h.run('JSON.stringify({before,orders,after:{stock:e.res,plan:aiEconomyPlan(e),queue:p.col.q},physio:e.physio,feeding:physioOf(e).yiyer})'))};
 if(day===2370){h.run('var oldIncome=empireIncome(e,false);colonyBuildTick(200);var newIncome=empireIncome(e,false)');row.completed=JSON.parse(h.run('JSON.stringify({before:oldIncome,after:newIncome,stock:e.res,buildings:p.col.b})'));}
 result.push(row);
}
for(const day of [330,450,570]){assert(result.find(x=>x.phase==='96F1'&&x.day===day).orders.some(x=>x.key==='ciftlik'));assert(!result.find(x=>x.phase==='96F3'&&x.day===day).orders.some(x=>x.key==='ciftlik'));}
assert(result.find(x=>x.phase==='96F1'&&x.day===2370).orders.some(x=>x.kind==='queueDemolish'&&x.key==='maden'));
assert(result.find(x=>x.phase==='96F3'&&x.day===2370).orders.some(x=>x.kind==='queueDemolish'&&x.key==='ciftlik'));
assert(result.find(x=>x.phase==='96F1'&&x.day===2550).orders.some(x=>x.key==='kol'));
assert(!result.find(x=>x.phase==='96F3'&&x.day===2550).orders.some(x=>x.key==='kol'));
fs.writeFileSync(path.join(out,'actual-decisions.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result.map(x=>({phase:x.phase,day:x.day,orders:x.orders.map(o=>o.kind+':'+o.key),minBefore:x.before.stock.min,minAfter:x.after.stock.min,minRunway:x.after.plan.rows.min.months,completion:x.completed&&[x.completed.before.min,x.completed.after.min]})),null,2));
