'use strict';
const assert=require('node:assert/strict');
const {runtime}=require('../../tests/helpers/runtime');
const path=require('node:path');
const [control,candidate]=process.argv.slice(2);
const rows=[control,candidate].map(root=>{
 const h=runtime({root:path.resolve(root)});
 const result=JSON.parse(h.run(`(()=>{
  setupGame({...CFG,size:'orta',aiCount:6,seed:22});
  const f={id:1,name:'F5',members:[0,1,2],leader:1};
  G.feds=[f];G.day=20;
  const warm={lead:new Map()},cold={lead:new Map()};
  const initialCard=UI.instLeaderRows(warm).length;
  f.leader=2;
  const warmResult=UI.instLeaderRows(warm),coldResult=UI.instLeaderRows(cold);
  return JSON.stringify({build:BUILD_ID,initialCard,warm:warmResult.map(x=>x.key),
   cold:coldResult.map(x=>x.key),coldLeader:cold.lead.get(f.id),repeat: UI.instLeaderRows(warm).length});
 })()`));
 assert.equal(result.initialCard,0);
 assert.deepEqual(result.warm,['L:1:2:20']);
 assert.deepEqual(result.cold,[]);
 assert.equal(result.coldLeader,2);
 assert.equal(result.repeat,0);
 return result;
});
console.log(JSON.stringify(rows,null,2));
