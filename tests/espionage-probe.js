'use strict';
// Operation-only laboratory: NOT a daily campaign or economy simulation.
const path=require('path'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const save=process.env.STARS_SAVE||path.join(__dirname,'fixtures/stars-2210-06.sav.json');
const runs=[];
for(const seed of [11,99,404]){
  const h=runtime({root});h.loadSave(save);
  h.run(`for(const e of G.emps){
    if(e.dead||e.wild)continue;
    for(const r in e.res)e.res[r]=50000;
    e.intel={};e.intelP={};e.opLog=[];e.hitLog=[];
    for(const o of G.emps)if(o!==e&&!o.dead&&!o.wild){
      e.contact[o.id]=true;e.intel[o.id]=3;e.rel[o.id]=-20;
    }
  }
  var stats={calls:0,executed:0,rejected:0,types:{},reasons:{}};
  var original=runOp;
  runOp=function(e,o,k){
    stats.calls++;const r=original(e,o,k);
    if(r.ok){stats.executed++;stats.types[k]=(stats.types[k]||0)+1;}
    else{stats.rejected++;stats.reasons[r.msg]=(stats.reasons[r.msg]||0)+1;}
    return r;
  };
  rndSeed(${seed});
  for(let step=0;step<120;step++){G.day+=30;G.memAge++;aiOpsTick();}
  `);
  const world=h.run('JSON.stringify([G.emps,G.sys,G.fleets,G.log,G.inbox,RND_STATE,G.day,G.memAge])');
  runs.push({seed,steps:120,...JSON.parse(h.run('JSON.stringify(stats)')),
    stateSha256:crypto.createHash('sha256').update(world).digest('hex')});
}
console.log(JSON.stringify({kind:'AI operation-only laboratory, contacts/intel/resources prepared; no daily exploration or economy',runs},null,2));
