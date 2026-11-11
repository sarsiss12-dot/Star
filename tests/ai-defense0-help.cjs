'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const out=process.env.STARS_OUTPUT||'/tmp/defense0-help';fs.mkdirSync(out,{recursive:true});const rows=[];
for(const file of ['/tmp/aiq0-saves/p23-404-60-ulu-9-final.sav','/tmp/defense0-allied-finals/allied-defense-final.sav']){
 const h=runtime();h.sb.raw=fs.readFileSync(file,'utf8');assert(h.run('deserialize(raw)'));h.run('var E=G.emps[2];for(const e of G.emps)if(!e.dead&&!e.wild)aiObserve(e);');
 rows.push({file:path.basename(file),...JSON.parse(h.run(`JSON.stringify({day:G.day,ownPower:totalPower(E),piratePower:aiObservedThreat(E,38,false),fronts:(G.warLedger?.fronts||[]).filter(f=>f.ended===null&&f.sides.includes(E.id)),
 allies:G.emps.filter(e=>e!==E&&e.ai&&!e.dead&&jointBinding(e,E)).map(e=>{const s=G.sys[38],r=aiKnownSystem(e,s),av=jointAvailable(e),routes=av.fleets.map(f=>({id:f.id,power:fleetPower(f),route:aiKnownRoute(e,f,f.mv?f.mv.to:f.sys,38)}));return {id:e.id,name:e.name,ownThreat:aiDefenseThreat(e,G.sys[e.home]),normalWars:Object.keys(e.war).filter(k=>e.war[k]),visible:aiView(e).ctx.visible.has(38),known:r,observedThreat:aiObservedThreat(e,38,false),totalPower:totalPower(e),spareReason:av.reason,sparePower:av.fleets.reduce((n,f)=>n+fleetPower(f),0),routes,sustainable:aiDeploymentSustainable(e,av.fleets,s,aiEconomyPlan(e))};})})`))});
}
fs.writeFileSync(path.join(out,'help.json'),JSON.stringify(rows,null,2));console.log('PASS own-view visibility / actual spare-force, route, upkeep and ledger gates recorded');
