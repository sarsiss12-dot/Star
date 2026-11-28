'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {runtime} = require('../../tests/helpers/runtime');

const [root,...inputs] = process.argv.slice(2);
const h = runtime({root:path.resolve(root)});
const hash = s => createHash('sha256').update(s).digest('hex');
h.run(`
function tradeCheckpoint(){
 const c=Commerce.state();
 const empires=G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).map(e=>({
  id:e.id,dead:!!e.dead,colonies:e.colonies.length,
  fleetPower:G.fleets.filter(f=>f.e===e.id&&!f.dead).reduce((sum,f)=>sum+fleetPower(f),0),
  ports:tradeHubs(e),completedResearch:Object.values(e.techs||{}).filter(Boolean).length,
  researchIncome:e.inc?.ara||0,stock:e.res,receiptLedger:c.stats[e.id]||{},
  tradeTrust:Object.entries(e.mem||{}).flatMap(([partner,rows])=>rows.filter(m=>m.k==='ticaretGuveni')
   .map(m=>({partner:Number(partner),value:m.v,month:m.t,source:m.source}))),
  open:c.contracts.filter(k=>[k.a,k.b].includes(e.id)&&!Commerce.closed(k)).length,
  voyages:c.convoys.filter(v=>!Commerce.terminal(v)&&[v.e,v.to].includes(e.id)).length
 }));
 const normals=G.emps.filter(e=>!e.wild&&!e.crisisSide&&!e.dead);
 const feds=(G.feds||[]).map(f=>({id:f.id,type:f.type,members:f.members.filter(id=>normals.some(e=>e.id===id))}));
 return {day:G.day,systems:G.sys.length,normalStates:normals.length,empires,feds,
  largestFederationShare:Math.max(0,...feds.map(f=>f.members.length))/normals.length,rng:RND_STATE};
}
`);

const rows = [];
for (const file of inputs) {
  h.sb.input = fs.readFileSync(file,'utf8');
  assert(h.run('deserialize(input)'),file);
  const row = {file:path.basename(file),source:hash(h.sb.input),...JSON.parse(h.run('JSON.stringify(tradeCheckpoint())'))};
  rows.push(row);
}
console.log(JSON.stringify(rows,null,2));
