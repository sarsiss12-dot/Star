'use strict';
const assert=require('assert/strict'),{fresh}=require('./helpers/dispatch-fixture');
let pass=0,fail=0;
function test(n,f){try{f();pass++;console.log('✓ '+n)}catch(err){fail++;console.error('✗ '+n+' — '+err.stack)}}
const h=()=>fresh();
test('default setup enables random events, separate from AUTO_EVENT',()=>{
  const x=h();assert.equal(x.run('CFG.randomEvents'),true);
  assert.equal(x.run('G.cfg.randomEvents === undefined'),true); // legacy saves default ON
  assert.equal(x.run('typeof AUTO_EVENT'), 'boolean');
});
test('setup UI has a separate random event toggle, which survives redraw',()=>{
  const x=h();
  const v=x.run(`SETUP_STEP='galaksi';safeRenderSetup();var menuNode=$('menu');menuNode.classList.remove('hidden');
  var before=$('setup').innerHTML.includes('togRandomEvents');
  var el={dataset:{a:'togRandomEvents',x:''}},ev={type:'click',target:{closest:()=>el}};
  setupClickHandler(ev);
  var after=CFG.randomEvents===false && $('setup').innerHTML.includes('KAPALI');
  [before,after]`);
  assert.deepEqual(Array.from(v),[true,true]);
});
test('random empire event and chain never fire while disabled and consume no RNG',()=>{
  const x=h();
  const d=x.run(`G.cfg.randomEvents=false;var before=RND_STATE;
  for(var i=0;i<1000;i++)maybeEvent();
  [RND_STATE===before,!!G.seenChains && Object.keys(G.seenChains).length===0]`);
  assert.deepEqual(Array.from(d),[true,true]);
});
test('dynamic galactic upheaval is blocked without RNG even past first eligible month',()=>{
  const x=h();
  const d=x.run(`G.cfg.randomEvents=false;G.upAge=400;delete G.upLast;G.upheaval=null;var before=RND_STATE;
  for(var i=0;i<1000;i++)upheavalTick();
  [G.upheaval===null,G.upAge===400,RND_STATE===before]`);
  assert.deepEqual(Array.from(d),[true,true,true]);
});
test('disabled setting persists after Save v8 serialize/deserialize',()=>{
  const x=h();assert.equal(x.run(`G.cfg.randomEvents=false;var save=serialize();deserialize(save);G.cfg.randomEvents`),false);
});
test('old saves without setting keep random events enabled by default',()=>{
  const x=h();assert.equal(x.run(`delete G.cfg.randomEvents;var save=serialize();deserialize(save);G.cfg.randomEvents!==false`),true);
});
test('disabled random setting does not block legitimate diplomacy or espionage mechanics',()=>{
  const x=h();const v=x.run(`G.cfg.randomEvents=false;[typeof diploTick==='function',typeof spyTick==='function',typeof declareWar==='function',typeof ANOMALIES!=='undefined']`);
  assert.deepEqual(Array.from(v),[true,true,true,true]);
});
test('player-off setting prevents queued random story continuations on month tick',()=>{
  const x=h();const v=x.run(`G.cfg.randomEvents=false;G.chainQueue=[{id:'grev2a',at:0}];G.month=3;monthTick();G.chainQueue.length`);
  assert.equal(v,0);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
