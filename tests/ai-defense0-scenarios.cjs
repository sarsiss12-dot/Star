'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{fresh}=require('./helpers/dispatch-fixture'),exp=require('./helpers/ai-defense0-experiments.cjs');
const base=require('./helpers/ai-quality0-control.cjs').root(),out=process.env.STARS_OUTPUT||'/tmp/defense0-scenarios';fs.mkdirSync(out,{recursive:true});const rows=[];
for(const strong of [false,true])for(const mode of ['base','defense','safe-yard']){
 const h=fresh(1,exp.root(base,mode));h.sb.strong=strong;h.run(`
 G.fleets=[];G.day=300;G.year=2210;G.month=10;G.memAge=10;G.feds=[];G.council=null;G.jointOps=null;G.log=[];
 E.ai=true;E.war={};E.home=0;E.mizac='tuccar';E.civics=[];E.inc={ene:80,min:30,yiy:30,ala:20,tuk:20,ara:30,etk:10};E.aiStrategy=null;E.aiShipPlan=null;E.aiCampaign=null;
 O.wild=true;O.ai=false;O.dead=false;O.war={};O.mods={...E.mods};G.sys[0].planets[0].owner=E.id;G.sys[0].planets[0].col.stab=0;
 var F=newFleet(E,2,Array.from({length:8},()=>({c:'kor'})),'Savunma');
 var foe=newFleet(O,0,Array.from({length:strong?30:1},()=>({c:strong?'zir':'kor'})),'Baskı');
 E._powAt=O._powAt=-1;aiObserve(E);rndSeed(42);
 var before={friendly:fleetPower(F),hostile:aiDefenseThreat(E,G.sys[0]),resources:{...E.res},ships:F.ships.length};
 aiTurn(E);var ordered={path:F.path.slice(),campaign:E.aiCampaign||null,ships:G.fleets.filter(f=>f.e===E.id).reduce((n,f)=>n+f.ships.length,0),resources:{...E.res},queue:G.sys[0].queue};
 var arrivals=0;for(let i=0;i<720;i++){G.day+=.5;stepFleets(.5);if(F.sys===0)arrivals++;combatTick(.5);}
 var after={arrivals,friendlyShips:G.fleets.filter(f=>f.e===E.id).reduce((n,f)=>n+f.ships.length,0),enemyShips:G.fleets.filter(f=>f.e===O.id).reduce((n,f)=>n+f.ships.length,0),fleetPosition:F.sys,journal:G.fleetJournal||[]};
 // Three real economic/AI months after the movement/combat experiment. The
 // generous existing fixture stock is disclosed; this is not Seed404 financing.
 for(let i=0;i<180;i++){const day=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>day)monthTick();}
 var recovery={stab:G.sys[0].planets[0].col?.stab,income:{...E.inc},resources:{...E.res},bombed:G.sys[0].planets[0].col?.bombed||0};
 `);
 rows.push({strong,mode,...JSON.parse(h.run('JSON.stringify({before,ordered,after,recovery})'))});
}
fs.writeFileSync(path.join(out,'scenarios.json'),JSON.stringify(rows,null,2));
for(const row of rows)console.log(JSON.stringify({mode:row.mode,strong:row.strong,before:row.before,order:row.ordered.path,after:{...row.after,journal:undefined}}));
for(const r of rows.filter(r=>r.mode!=='base')){if(r.strong){assert(!r.ordered.path.includes(0),'outmatched remote force must not be sent to occupied home');assert.equal(r.after.friendlyShips,8);}else{assert.equal(r.ordered.path.at(-1),0);assert.equal(r.after.enemyShips,0);assert(r.after.arrivals>0);assert(r.after.friendlyShips>0);assert(r.recovery.stab>0,'real economic ticks recover stability after actual combat');}}
console.log('PASS candidate actual route, real combat outcome, no underpowered remote suicide');
