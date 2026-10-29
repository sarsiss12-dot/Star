// Monthly trace of one attacker's siege of one system: planet state, attacker armies, production reasons. Read-only.
const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,months,A,SYS]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');h.sb.A=+A;h.sb.SYS=+SYS;
h.run(`var ord=[];const ps=aiShipProduction;aiShipProduction=function(e){const r=ps.apply(this,arguments);if(e.id===A)ord.push({day:G.day,reasons:(e.aiShipPlan&&e.aiShipPlan.reasons||[]).join(',')});return r;};
var falls=[];const rf=recordFall;recordFall=function(t){falls.push(G.day+':'+t);return rf.apply(this,arguments);};
function row(){const e=G.emps[A],s=G.sys[SYS],pl=s.planets.filter(p=>p.col).map(p=>({o:p.owner,sh:+(p.col.shield||0).toFixed(1),g:+(p.col.garrison||0).toFixed(1),gb:+(p.col.garrisonBase||0).toFixed(1),siege:p.col.siege||0,truce:p.col.truce??null,ta:p.col.truceAge||0,pop:+p.col.pop.toFixed(1),b:Object.values(p.col.b||{}).reduce((a,v)=>a+v,0)}));
 const war=G.fleets.filter(f=>f.e===A&&isArmed(f)&&f.sys===SYS&&!f.mv).reduce((n,f)=>n+fleetPower(f),0);
 const armies=G.fleets.filter(f=>f.e===A&&f.ships.length&&isTransport(f)).map(f=>({id:f.id,at:f.sys,next:f.mv?f.mv.to:null,dest:f.path.length?f.path.at(-1):(f.mv?f.mv.to:f.sys),hops:f.path.length}));
 const inv=aiShipInventory(e);const c=e.aiCampaign||{};
 return {day:G.day,m:Math.round(G.day/30),pl,war:Math.round(war),armies,ordQ:(inv.counts.ord||0)+'+'+(inv.pending.ord||0),ene:Math.round(e.res.ene),inc:+(e.inc.ene||0).toFixed(0),ala:Math.round(e.res.ala),camp:c.phase+':'+c.target,reasons:(ord.at(-1)||{}).reasons,falls:falls.splice(0)};}`);
const rows=[JSON.parse(h.run('JSON.stringify(row())'))];
for(let m=0;m<+months;m++){h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');rows.push(JSON.parse(h.run('JSON.stringify(row())')));}
for(const r of rows)console.log(JSON.stringify(r));
