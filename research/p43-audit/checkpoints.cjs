'use strict';
const fs=require('node:fs'),path=require('node:path'),{runtime}=require('../../tests/helpers/runtime'),dir=process.env.CHECKPOINT_DIR||'/tmp/stars-p43';
const out=[];
for(const file of fs.readdirSync(dir).filter(f=>/^(100|500)-.*-m(3|60|120|180|240)\.save$/.test(f)).sort()){
 const h=runtime();h.sb.txt=fs.readFileSync(path.join(dir,file),'utf8');if(!h.run('deserialize(txt)'))throw Error(file);
 out.push({file,...JSON.parse(h.run(`JSON.stringify({actors:G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide).map(e=>{
 const plan=aiEconomyPlan(e),fleet=G.fleets.filter(f=>f.e===e.id&&isArmed(f)).map(f=>({id:f.id,ships:f.ships.length,at:f.sys,moving:!!f.mv,supply:fleetSupply(e,f),power:fleetPower(f)}));
 return {id:e.id,policy:plan.policy,critical:plan.critical,rows:plan.rows,upkeep:fleetUpkeep(e),fleet,objective:e.aiStrategy?.objective,phase:e.aiCampaign?.phase,cap:aiShipInventory(e).capacity,
 decline:e.aiShipPlan?.reasons,orders:e.colonies.flatMap(c=>(G.sys[c.s].planets[c.p].col.q||[]).map(q=>({key:q.key,dem:!!q.dem})))};
 }),day:G.day})`))});}
fs.writeFileSync(path.join(__dirname,'raw','checkpoints.json.gz'),require('node:zlib').gzipSync(JSON.stringify(out)));
