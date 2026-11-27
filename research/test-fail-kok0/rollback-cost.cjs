'use strict';

const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {runtime}=require('../../tests/helpers/runtime');
const [control,candidate,file]=process.argv.slice(2);
if(!control||!candidate||!file)throw Error('Kullanım: node rollback-cost.cjs KONTROL ADAY SAVE8');
const raw=fs.readFileSync(file,'utf8');

function open(root){
  const world=runtime({root:path.resolve(root)});
  world.sb.input=raw;
  assert(world.run('deserialize(input)'));
  return world;
}

const worlds=[open(control),open(candidate)];
const baseline=worlds.map(h=>h.run('serialize()'));
const rng=worlds.map(h=>h.run('RND_STATE'));
assert.equal(baseline[0],baseline[1]);
assert.equal(rng[0],rng[1]);
const timings=[[],[]];
for(const h of worlds)for(let i=0;i<8;i++)h.run('dealTxBegin().records.length');
for(let block=0;block<8;block++)for(const i of block%2?[1,0,0,1]:[0,1,1,0]){
  const t=process.cpuUsage();
  const records=worlds[i].run('dealTxBegin().records.length');
  const elapsed=process.cpuUsage(t);
  timings[i].push({cpuMs:(elapsed.user+elapsed.system)/1000,records});
}
for(let i=0;i<2;i++){
  assert.equal(worlds[i].run('serialize()'),baseline[i]);
  assert.equal(worlds[i].run('RND_STATE'),rng[i]);
}
const journal=worlds.map(h=>h.run('G.fleetJournal?.length || 0'));
const totals=timings.map(series=>{
  const values=series.map(s=>s.cpuMs).sort((a,b)=>a-b);
  const p95Index=.95*(values.length-1),i=Math.floor(p95Index);
  return {mean:values.reduce((sum,x)=>sum+x,0)/values.length,median:(values[7]+values[8])/2,
    p95:values[i]+(p95Index-i)*(values[i+1]-values[i])};
});
console.log(JSON.stringify({file:path.basename(file),rng,journal,timings,totals},null,2));
