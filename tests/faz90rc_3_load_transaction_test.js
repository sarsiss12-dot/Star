'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const root=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;const tests=[];const test=(n,f)=>tests.push([n,f]);
function fresh(native=false){
 const h=runtime({root,native});h.run(`setupGame({name:'TX',race:'insan',traits:[],
 size:'orta',shape:'sarmal',diff:'normal',seed:903,ethics:{mil:0,aut:0,mat:0,ahl:0},
 civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
 View.init();View.selSys=G.sys[G.p.home];View.sel=G.fleets[0];View.route=true;
 G.speed=2;G.autoSave=false;UI._openNote={uid:77,tur:'plain',msg:'original'};
 UI.pendingOffer={from:1,to:0};`);
 h.timers.clear();h.raf.clear();
 const d=JSON.parse(h.run('serialize()'));d.day+=120;d.year++;d.rs=24681;
 d.emps[0].res.min+=333;h.sb.save=JSON.stringify(d);
 return h;
}
// Independent oracle. No production snapshot/restore function establishes the
// expectation. All own slots, aliases, container order and descriptors checked.
function photograph(h){
 const g=h.run('G'),opaque=new Set([h.run('G.nebula'),h.run('View.cv'),h.run('View.g')]);
 const nodes=[],seen=new Set(),stack=[g,h.run('LOOP'),h.run('View._gest')];
 while(stack.length){
  const o=stack.pop();if(!o||typeof o!=='object'||seen.has(o)||opaque.has(o))continue;
  seen.add(o);const slots=Reflect.ownKeys(o).map(k=>[k,Object.getOwnPropertyDescriptor(o,k)]);
  const tag=Object.prototype.toString.call(o);
  const entries=tag==='[object Map]'?[...o]:tag==='[object Set]'?[...o].map(v=>[v,v]):null;
  nodes.push({o,slots,entries,tag,proto:Object.getPrototypeOf(o)});
  for(const [k,d] of slots)if('value'in d)stack.push(d.value);
  if(entries)for(const [k,v] of entries)stack.push(k,v);
 }
 const view=Object.getOwnPropertyDescriptors(h.run('View'));
 const ui=h.run('[UI._openNote,UI.pendingOffer]'),rng=h.run('RND_STATE');
 const timers=[...h.timers],raf=[...h.raf],local=[...h.local];
 return ()=>{
  assert.equal(h.run('G'),g);assert.equal(h.run('RND_STATE'),rng);
  for(const {o,slots,entries,tag,proto}of nodes){
   assert.equal(Object.getPrototypeOf(o),proto);
   assert.deepEqual(new Set(Reflect.ownKeys(o)),new Set(slots.map(x=>x[0])));
   for(const [k,d]of slots){const actual=Object.getOwnPropertyDescriptor(o,k);
    for(const part of Reflect.ownKeys(d))assert.ok(Object.is(actual[part],d[part]),'slot '+String(k)+'.'+String(part));}
   if(entries){const a=tag==='[object Map]'?[...o]:[...o].map(v=>[v,v]);
    assert.equal(a.length,entries.length);entries.forEach(([k,v],i)=>{assert.equal(a[i][0],k);assert.equal(a[i][1],v);});}
  }
  const now=Object.getOwnPropertyDescriptors(h.run('View'));
  assert.deepEqual(Reflect.ownKeys(now),Reflect.ownKeys(view));
  for(const k of Reflect.ownKeys(view))for(const part of Reflect.ownKeys(view[k]))
   assert.ok(Object.is(now[k][part],view[k][part]),'View.'+String(k)+'.'+String(part));
  assert.equal(h.run('UI._openNote'),ui[0]);assert.equal(h.run('UI.pendingOffer'),ui[1]);
  assert.deepEqual([...h.timers],timers);assert.deepEqual([...h.raf],raf);assert.deepEqual([...h.local],local);
 };
}
const points=['before:apply','after:roots','after:treaties','after:world','after:crisis',
 'after:campaign','after:simulation','after:events','after:mods','after:derived',
 'after:economy','before:commit'];
test('oracle detects equal-value replacement of original objects',()=>{
 const h=fresh(),check=photograph(h);h.run('G.p.res={...G.p.res}');assert.throws(check);
});
for(const point of points)test('rollback '+point+' restores G/RNG/View/UI/timers/refs',()=>{
 const h=fresh();let reached=0;h.sb.inject=p=>{if(p===point){reached++;throw Error(point);}};
 h.run('G._loadFailInject=inject');const check=photograph(h);
 assert.equal(h.run('deserialize(save)'),false);assert.equal(reached,1);check();
 assert.equal(h.run('_loadTxActive'),false);
 h.run('delete G._loadFailInject');assert.equal(h.run('deserialize(save)'),true);
});
// Actual malformed saves pass the existing preflight; no fault hook needed.
for(const [name,mutate]of [
 ['null colony reference',d=>d.emps[0].colonies.push(null)],
 ['colony missing system',d=>d.emps[0].colonies[0].s=99999],
 ['unknown race',d=>d.emps[0].race='NO_SUCH_RACE'],
 ['unknown colony building',d=>{const c=d.emps[0].colonies[0];d.sys[c.s].p[c.p].col.b.NO_SUCH_BUILDING=1;}],
 ['invalid fleet system',d=>d.fl[0].sys=99999]
])test('real malformed save: '+name,()=>{
 const h=fresh(),d=JSON.parse(h.sb.save);mutate(d);h.sb.bad=JSON.stringify(d);
 assert.equal(h.run('validSaveEnvelope(JSON.parse(bad))'),true);
 const check=photograph(h);assert.equal(h.run('deserialize(bad)'),false);check();
 assert.equal(h.run('deserialize(save)'),true);
});
for(const fn of ['normalizeEnvoys','restorePoliticalWorld','restoreCrisisWorld',
 'restoreCampaignWorld','restoreSimulationWorld','restoreEventsWorld',
 'recalcMods','rebuildDerivedStateAfterLoad','economyTick'])
test('real '+fn+' executes then throws; full rollback',()=>{
 const h=fresh();h.run(`var real=${fn};${fn}=function(...args){real(...args);throw Error('after real call')}`);
 const check=photograph(h);assert.equal(h.run('deserialize(save)'),false);check();
 h.run(`${fn}=real`);assert.equal(h.run('deserialize(save)'),true);
});
test('deep/cyclic/Map/Set old graph mutations and aliases restore',()=>{
 const h=fresh();h.run(`G.deep={};var tail=G.deep;for(let i=0;i<60;i++)tail=tail.next={};
 tail.value=7;G.deep.self=G.deep;G.alias=tail;G.bag=new Map([[tail,G.deep]]);
 G.members=new Set([tail]);var originalPlayer=G.p;
 G._loadFailInject=p=>{if(p!=='after:economy')return;
 tail.value=99;G.bag.clear();G.members.clear();originalPlayer.res.min=99999;
 G.newRoot={};G.alias={};throw Error('deep');};`);
 const check=photograph(h);assert.equal(h.run('deserialize(save)'),false);check();
});
test('zero RNG is restored exactly, not reseeded to one',()=>{
 const h=fresh();h.run(`RND_STATE=0;G._loadFailInject=p=>{if(p==='after:economy')throw Error('rng')}`);
 assert.equal(h.run('deserialize(save)'),false);assert.equal(h.run('RND_STATE'),0);
});
test('snapshot failure is safe and unlocks the next load',()=>{
 const h=fresh();h.run('G.weak=new WeakMap()');const check=photograph(h);
 assert.equal(h.run('deserialize(save)'),false);check();assert.equal(h.run('_loadTxActive'),false);
 h.run('delete G.weak');assert.equal(h.run('deserialize(save)'),true);
});
test('malformed JSON returns false without mutation',()=>{
 const h=fresh(),check=photograph(h);assert.equal(h.run("deserialize('{')"),false);check();
});
test('nested load rejected while outer transaction continues',()=>{
 const h=fresh();h.run(`var nested=[];G._loadFailInject=p=>{if(p==='after:roots')nested.push(deserialize(save))}`);
 assert.equal(h.run('deserialize(save)'),true);assert.equal(h.run('nested.length'),1);
 assert.equal(h.run('nested[0]'),false);
});
test('load inside an active deal is rejected without mutation',()=>{
 const h=fresh(),check=photograph(h);h.run('_dealTxActive=true');
 assert.equal(h.run('deserialize(save)'),false);check();h.run('_dealTxActive=false');
 assert.equal(h.run('deserialize(save)'),true);
});
test('load does not take over another side-effect buffer',()=>{
 const h=fresh();h.run("G._sideBuf=[{tur:'say',msg:'outer'}]");const check=photograph(h);
 assert.equal(h.run('deserialize(save)'),false);check();
});
test('native texture generation failure leaves old world untouched',()=>{
 const h=fresh();h.run("ART.nebula=()=>{throw Error('texture')}");const check=photograph(h);
 assert.equal(h.run('deserialize(save)'),false);check();
});
test('failed first load leaves title-world null player and empty collections',()=>{
 const prepared=fresh(),h=runtime({root});h.sb.save=prepared.sb.save;
 h.run("G._loadFailInject=p=>{if(p==='after:events')throw Error('first')}");
 const check=photograph(h);assert.equal(h.run('deserialize(save)'),false);check();
 assert.equal(h.run('G.p'),null);assert.equal(h.run('G.sys.length'),0);
});
test('diagnostic failure cannot escape or strand the load guard',()=>{
 const h=fresh();h.run("logDiag=()=>{throw Error('diag')};G._loadFailInject=p=>{throw Error('load')}");
 const check=photograph(h);assert.equal(h.run('deserialize(save)'),false);check();
 assert.equal(h.run('_loadTxActive'),false);
});
test('current preflight field-presence of side buffer restored on both outcomes',()=>{
 for(const failure of [false,true])for(const present of [false,true]){
  const h=fresh();h.run(present?'G._sideBuf=null':'delete G._sideBuf');
  if(failure)h.run("G._loadFailInject=p=>{if(p==='after:events')throw Error('side')}");
  assert.equal(h.run('deserialize(save)'),!failure);
  assert.equal(h.run("Object.prototype.hasOwnProperty.call(G,'_sideBuf')"),present);
  if(present)assert.equal(h.run('G._sideBuf'),null);
 }
});
for(const method of ['resetGesture','invalidateRenderCaches','updateFrustum'])
test('post-commit '+method+' error is diagnostic, not load rejection',()=>{
 const h=fresh();h.run(`View.${method}=()=>{throw Error('presentation')}`);
 assert.equal(h.run('deserialize(save)'),true);assert.equal(h.run('G.day'),JSON.parse(h.sb.save).day);
 assert.ok(h.run("DIAG.some(d=>d.tur==='load-view')"));
 assert.equal(h.run('View.selSys'),h.run('G.sys[G.p.home]'));
 assert.equal(h.run('View.sel'),h.run('G.fleets[0]'));
});
for(const success of [false,true])test('buffered effects publish once only on commit: '+success,()=>{
 const h=fresh();let audio=0,alerts=0;h.sb.audio=()=>audio++;h.sb.alerts=()=>alerts++;
 h.run(`AUDIO.forLog=audio;UI.alert=alerts;G._loadFailInject=p=>{
 if(p==='after:economy'){say('load test');${success?'':'throw Error("after say");'}}};`);
 const check=photograph(h);assert.equal(h.run('deserialize(save)'),success);
 if(!success)check();assert.equal(audio,success?1:0);assert.equal(alerts,success?1:0);
});
test('successful load preserves camera/layers/surface, rebinds selection and clears gesture',()=>{
 const h=fresh();h.run("MAP_MODE='savas';RADAR_ON=true;LOGI_ON=true");
 const cv=h.run('View.cv'),g=h.run('View.g'),cam=h.run('JSON.stringify(View.cam)');
 cv.emit('pointerdown',{pointerId:9,clientX:200,clientY:100});
 assert.equal(h.run('deserialize(save)'),true);assert.equal(h.run('View._gest.pts.size'),0);
 assert.equal(cv.hasPointerCapture(9),false);assert.equal(h.run('View.cv'),cv);assert.equal(h.run('View.g'),g);
 assert.equal(h.run('JSON.stringify(View.cam)'),cam);assert.equal(h.run('MAP_MODE'),'savas');
 assert.equal(h.run('RADAR_ON&&LOGI_ON'),true);assert.equal(h.run('G.speed'),0);
});
test('failed load retains live pointer capture and native Canvas pixels',()=>{
 const h=fresh(true),cv=h.run('View.cv'),g=h.run('View.g');g.fillStyle='#ff0000';g.fillRect(3,3,5,5);
 const pixels=Array.from(g.getImageData(3,3,1,1).data);
 cv.emit('pointerdown',{pointerId:9,clientX:200,clientY:100});
 h.run("G._loadFailInject=p=>{if(p==='after:economy')throw Error('late')}");
 const check=photograph(h);assert.equal(h.run('deserialize(save)'),false);check();
 assert.equal(cv.hasPointerCapture(9),true);assert.deepEqual(Array.from(g.getImageData(3,3,1,1).data),pixels);
});
test('real legacy save repeated load preserves day/resources/RNG',()=>{
 const h=fresh();h.sb.save=fs.readFileSync(path.join(root,'tests/fixtures/stars-2210-06.sav.json'),'utf8');
 assert.equal(h.run('deserialize(save)'),true);
 const s=h.run('JSON.stringify([G.day,RND_STATE,G.emps.map(e=>e.res)])');
 for(let i=0;i<5;i++)assert.equal(h.run('deserialize(save)'),true);
 assert.equal(h.run('JSON.stringify([G.day,RND_STATE,G.emps.map(e=>e.res)])'),s);
});
test('failed loadGame keeps stored text and old live world intact',async()=>{
 const h=fresh(),d=JSON.parse(h.sb.save);d.emps[0].colonies.push(null);
 h.local.set('yildiz:save',JSON.stringify(d));const check=photograph(h);
 assert.equal(await h.run('loadGame()'),false);check();assert.equal(h.run('LAST_LOAD_STATUS'),'invalid');
});
test('post-commit alert/audio errors do not turn a successful load into failure',()=>{
 const h=fresh();h.run(`UI.alert=()=>{throw Error('alert')};AUDIO.forLog=()=>{throw Error('audio')};
 G._loadFailInject=p=>{if(p==='after:economy')say('buffered')}`);
 assert.equal(h.run('deserialize(save)'),true);assert.equal(h.run('G.day'),JSON.parse(h.sb.save).day);
 assert.equal(h.run("G.log.filter(x=>x.m==='buffered').length"),1);
});
(async()=>{for(const [n,f]of tests){try{await f();pass++;console.log('✓ '+n);}
 catch(e){fail++;console.log('✗ '+n+' — '+String(e.stack).slice(0,900));}}
 console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;})();
