'use strict';
const assert=require('assert/strict');
// 96H.9 reviewed invasion coordination change. Each entry is [current, 96H.8]
// text; stripping restores the exact 96H.8 ai.js bytes.
const blocks=[
["  for(const f of send)aiMove(e,f,target.id);\n  // 96H.9: a force that reached the campaign target holds the siege. Pulling\n  // every idle fleet back to the rally each AI turn broke bombardment within a\n  // month and left arriving armies without an escort.\n  for(const f of force){\n    if(f.mv||f.path.length||f.sys===rally.id||f.sys===target.id||ready.includes(f))continue;\n    aiMove(e,f,rally.id);\n  }",
"  for(const f of send)aiMove(e,f,target.id);\n  for(const f of force){\n    if(f.mv||f.path.length||f.sys===rally.id||ready.includes(f))continue;\n    aiMove(e,f,rally.id);\n  }"],
["/* 96H.9: the army must be bought while the campaign still prepares. Once the\n   fleet is deployed its upkeep consumes the wartime energy runway that every\n   hull purchase needs, so a siege never receives an army. Invasion intent is\n   the campaign's own known colonised enemy target, or an actual siege seen\n   through the empire's own fleet with aiArmyTick's tests (shield at most 55,\n   power at least 80% of the system defence). Read-only. */\nfunction aiInvasionTarget(e){\n const c=e.aiCampaign,t=c&&c.until>G.day&&['build','gather','fund','attack'].includes(c.phase)?G.sys[c.target]:null,r=aiKnownSystem(e,t);\n if(r&&r.colonies>0&&e.war[r.owner])return t;\n for(const sys of G.sys){\n  let war=0;for(const f of G.fleets)if(f.e===e.id&&f.sys===sys.id&&!f.mv&&f.ships.length&&isArmed(f))war+=fleetPower(f);\n  if(!war||war<(sys.def||0)*.8)continue;\n  if(sys.planets.some(pl=>pl.col&&pl.owner>=0&&pl.owner!==e.id&&e.war[pl.owner]&&(pl.col.shield||0)<=55))return sys;\n }\n return null;\n}\n/* 93D.1: physical hulls, paid pending jobs, upkeep and bounded monthly budget. */",
"/* 93D.1: physical hulls, paid pending jobs, upkeep and bounded monthly budget. */"],
[" const limit=Math.min(war?10:6,Math.max(1,yards.reduce((n,s)=>n+yardCount(s),0)*(war?3:2)));\n let orders=0,armyHold=0;",
" const limit=Math.min(war?10:6,Math.max(1,yards.reduce((n,s)=>n+yardCount(s),0)*(war?3:2)));\n let orders=0;"],
[" if((c.ala||0)>budget||(e.res.ala||0)-(c.ala||0)<reserve+(cls==='ord'?0:armyHold)){note('alloy-budget-reserve');return false;}",
" if((c.ala||0)>budget||(e.res.ala||0)-(c.ala||0)<reserve){note('alloy-budget-reserve');return false;}"],
[" // A 70-alloy army never fits after cheaper warships drain each war month's\n // alloy. With invasion intent and no army, try it first; if only its alloy\n // price is missing, that price is a derived reservation (as in\n // aiRecoveryInvestment), never a grant. Other failing gates change nothing.\n if(war&&!(inv.counts.ord||0)&&!(inv.pending.ord||0)&&shipBuildAccess(e,'ord').ok&&aiInvasionTarget(e)){\n  const seen=state.reasons;state.reasons=[];const bought=buy('ord'),why=state.reasons;\n  state.reasons=seen.concat(why.filter(k=>!seen.includes(k)));\n  if(!bought&&why.length===1&&why[0]==='alloy-budget-reserve')armyHold=shipCost(e,'ord').ala||0;\n }\n const classes=['zir','kru','muh','kor','esk'].filter(c=>shipBuildAccess(e,c).ok);",
" const classes=['zir','kru','muh','kor','esk'].filter(c=>shipBuildAccess(e,c).ok);"]
];
exports.reviewedH9Blocks=blocks.map(([current])=>current);
exports.stripReviewedH9=source=>{
 if(!source.includes('function aiInvasionTarget('))return source;
 for(const [current,legacy]of blocks){assert.equal(source.split(current).length,2,'one reviewed 96H.9 block');source=source.replace(current,legacy);}
 return source;
};
