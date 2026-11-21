'use strict';
/* SAHA-ORDU-P0: regression for two real multiplayer field reports.
   The canonical seed11 month66 siege fixture lands on month 71.
   Surviving assault transports must persist after the planet flips,
   rather than being converted wholesale into a permanent garrison.
   Real Android/Render multiplayer remains a separate field test. */
const assert=require('assert/strict');
const fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const root=path.resolve(__dirname,'..');
const save=fs.readFileSync(path.join(__dirname,'fixtures/96h9/seed11-month66-siege.save'),'utf8');

function replay(){
  const h=runtime({root});
  h.sb.rawP0=save;
  assert.equal(h.run('deserialize(rawP0)'),true);
  h.run(`G.autoSave=false;
    var assaultCapturesP0=[], originalCaptureP0=captureSystem;
    captureSystem=function(sys,by,cause,planet){
      const monitored=cause==='conquest'&&sys.id===6&&planet&&planet.col;
      const armies=monitored?G.fleets.filter(f=>f.e===by&&f.sys===sys.id&&isTransport(f))
          .map(f=>({id:f.id,ships:f.ships.length,ground:groundPower(f)})):[];
      const result=originalCaptureP0.apply(this,arguments);
      if(monitored&&armies.length){
        const after=armies.map(a=>{const f=G.fleets.find(x=>x.id===a.id);return {id:a.id,ships:f?f.ships.length:0,ground:f?groundPower(f):0};});
        assaultCapturesP0.push({day:G.day,sys:sys.id,by,before:armies,after,
          garrison:planet.col.garrison,base:planet.col.garrisonBase,
          journal:(G.fleetJournal||[]).filter(r=>armies.some(a=>a.id===r.fleet)).map(r=>({reason:r.reason,detail:r.detail||''}))});
      }
      return result;
    };
    for(let m=0;m<6&&!assaultCapturesP0.length;m++){
      for(let i=0;i<60;i++){
        const before=Math.floor(G.day/30);
        G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
        if(Math.floor(G.day/30)>before)monthTick();
      }
    }`);
  const captures=JSON.parse(h.run('JSON.stringify(assaultCapturesP0)'));
  assert(captures.length,'The control fixture did not produce the expected conquest');
  return {h,captures,save:h.run('serialize()'),rng:h.run('RND_STATE')};
}

const a=replay(),c=a.captures[0];
assert(c.before.length>0&&c.before.every(f=>f.ships>0),'A landing army must exist before ownership changes');
assert.deepEqual(c.after,c.before,'Conquest itself must not consume any additional surviving assault transports');
assert.equal(c.garrison,Math.max(10,c.base),'The colony receives local defence, not 60% of surviving army power');
assert(!c.journal.some(x=>x.reason==='rule'&&/işgal görevini tamamladı/.test(x.detail)),
  'A successful assault must not be recorded as a fleet destruction');
const b=replay();
assert.deepEqual(b.captures,a.captures,'Same seed and fixture must replay with identical conquest results');
assert.equal(b.rng,a.rng,'Same replay must consume RNG in the same order');
assert.equal(b.save,a.save,'Same replay must serialize byte-identically');
const reloaded=runtime({root});reloaded.sb.saveP0=a.save;
assert.equal(reloaded.run('deserialize(saveP0)'),true,'Save8 reload must succeed');
assert.equal(reloaded.run('serialize()'),a.save,'Reload must preserve canonical state');
console.log('PASS SAHA-ORDU-P0: retained army, nonduplicated garrison, replay, Save8/RNG');
