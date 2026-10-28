const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const h=runtime({root:process.argv[2]});h.sb.raw=fs.readFileSync(process.argv[3],'utf8');h.run('deserialize(raw)');
console.log(h.run(`var e=G.emps[1],plan=aiEconomyPlan(e),t=G.sys[6],ready=G.fleets.filter(f=>f.e===1&&isArmed(f)&&f.sys===13&&!f.mv&&!f.path.length);
JSON.stringify({day:G.day,inc:e.inc.ene,incAla:e.inc.ala,row:plan.rows.ene,rowAla:plan.rows.ala,queued:plan.queued,camp:e.aiCampaign,ready:ready.map(f=>({id:f.id,n:f.ships.length,cls:f.ships.map(s=>s.c).join(''),pow:fleetPower(f),d:aiDeploymentUpkeep(e,[f],t)})),all:aiDeploymentUpkeep(e,ready,t),supT:fleetSupply(e,{sys:6,mv:null,ships:[{c:'kor',h:1}],e:1}),homeT:fleetInHome(e,{sys:6,mv:null})})`));
