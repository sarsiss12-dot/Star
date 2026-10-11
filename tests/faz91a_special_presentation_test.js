'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
function fresh(actor=0,target=1){
  const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  h.run(`var A=G.emps[${actor}],B=G.emps[${target}];
    for(const e of [A,B]){e.dead=false;e.wild=false;e.crisisSide=false;e.civics=[];
      e.opLog=[];e.hitLog=[];e.intel={};e.war={};e.ally={};e.mem={};e.res.etk=10000;e.res.ara=0;}
    A.contact[B.id]=true;B.contact[A.id]=true;A.intel[B.id]=3;B.intel[A.id]=3;
    A.rel[B.id]=0;B.rel[A.id]=0;A.techs={};B.techs={t_tarim:true};
    A.name='SECRET_ACTOR';
    var cp=B.colonies[0],sy=G.sys[cp.s],pl=sy.planets[cp.p];
    B.home=-1;sy.lanes.push(A.home);pl.martial_law=0;pl.col.stab=30;pl.col.secede=0;
    var shown=[],art=[],audio=0,refresh=0;G.log=[];DIAG.length=0;
    UI.alert=function(m){shown.push(m);};UI.eventArt=function(...a){art.push(a);};
    AUDIO.forLog=function(){audio++;};UI.refresh=function(){refresh++;};
    function dice(outcome){var v=outcome==='basari'?[0,0]:outcome==='ifsa'?[.999,0]:[.999,.999];
      globalThis.calls=0;globalThis.rnd=function(){calls++;return v.shift()??.999;};}
    function execute(k){return k==='stealTech'?stealTech(A,B):inciteRebellion(A,B);}
    function state(){return JSON.stringify([G.emps,G.sys,G.log,G.sabStats,RND_STATE,calls]);}
  `);return h;
}
for(const key of ['stealTech','incite'])for(const outcome of ['basari','ifsa','sonucsuz'])
for(const broken of ['alert','eventArt','audio','refresh'])test(`${key} UI ${outcome} broken ${broken}`,()=>{
  const clean=fresh(),bad=fresh();
  const action=`dice('${outcome}');UI.act('${key}',String(B.id));`;
  clean.run(action);
  const slot={alert:'UI.alert',eventArt:'UI.eventArt',audio:'AUDIO.forLog',refresh:'UI.refresh'}[broken];
  bad.run(`${slot}=function(){throw Error('presentation-${broken}');};`);
  assert.doesNotThrow(()=>bad.run(action));
  assert.equal(bad.run('state()'),clean.run('state()'));
  assert.equal(bad.run('A.opLog.length'),1);
  assert.equal(bad.run('A.res.etk'),10000-(key==='stealTech'?90:120));
  const expectedCalls=broken==='audio'?clean.run('audio'):broken==='refresh'?clean.run('refresh'):
    clean.run(broken==='alert'?'shown.length':'art.length');
  assert.equal(bad.run("DIAG.filter(x=>x.tur==='op-presentation').length"),expectedCalls);
});
for(const key of ['stealTech','incite'])for(const outcome of ['basari','ifsa'])
test(`${key} direct return with alert failure ${outcome}`,()=>{
 const h=fresh();h.run(`UI.alert=function(){throw Error('alert');};dice('${outcome}');var r=execute('${key}');`);
 assert.equal(h.run('r.ok'),true);assert.equal(h.run('r.outcome'),outcome);
 assert.equal(h.run('A.opLog.length'),1);
});
for(const key of ['stealTech','incite'])test(`${key} AI victim alert failure preserves resolved count and quota`,()=>{
 const a=fresh(1,0),b=fresh(1,0);
 const setup=`for(const e of G.emps)e.ai=false;A.ai=true;A.contact={[B.id]:true};
   aiPickOp=function(){return '${key}';};rnd=function(){calls++;return 0;};calls=0;`;
 a.run(setup+'aiOpsTick();');b.run(setup+"UI.alert=function(){throw Error('victim-alert');};aiOpsTick();");
 assert.equal(b.run('state()'),a.run('state()'));assert.equal(b.run('A.opLog.length'),1);
 assert.equal(b.run("G.log.some(x=>x.m.includes('SECRET_ACTOR'))"),false);
});
for(const key of ['stealTech','incite'])test(`${key} invalid precondition no cost/effect/RNG/presentation`,()=>{
 const h=fresh();h.run(`A.res.etk=0;calls=0;var before=state();var r=execute('${key}');`);
 assert.equal(h.run('r.ok'),false);assert.equal(h.run('state()'),h.run('before'));
 assert.equal(h.run('shown.length+art.length+audio'),0);
});
test('notification ordering and eventArt receiver retained after alert throws',()=>{
 const h=fresh();h.run(`var order=[];AUDIO.forLog=function(){order.push('audio');};
 UI.alert=function(){order.push('alert');throw Error('alert');};
 UI.eventArt=function(){if(this!==UI)throw Error('receiver');order.push('art');};
 dice('basari');var r=stealTech(A,B);`);
 assert.equal(h.run('order.join()'),'audio,alert,art');assert.equal(h.run('r.ok'),true);
 assert.equal(h.run('G.log.length'),1);
});
test('diagnostic errors cannot turn a resolved operation into rejection',()=>{
 const h=fresh();h.run(`UI.alert=UI.eventArt=AUDIO.forLog=function(){throw Error('UI');};
 logDiag=function(){throw Error('diag');};dice('basari');var r=stealTech(A,B);`);
 assert.equal(h.run('r.ok'),true);assert.equal(h.run('A.opLog.length'),1);
});
test('existing side buffer retains ownership and delays presentation',()=>{
 const h=fresh();h.run(`var owner=[];G._sideBuf=owner;dice('basari');var r=stealTech(A,B);
 var pending=shown.length+art.length+audio+G.log.length;
 var same=G._sideBuf===owner;delete G._sideBuf;commitSideBuffer(owner);flushSideBuffer(owner);`);
 assert.equal(h.run('pending'),0);assert.equal(h.run('same'),true);
 assert.equal(h.run('shown.length'),1);assert.equal(h.run('art.length'),1);assert.equal(h.run('G.log.length'),1);
});
test('mechanical exceptions remain visible, not converted into success',()=>{
 const h=fresh();h.run("recordSabotage=function(){throw Error('mechanical');};dice('basari');");
 assert.throws(()=>h.run('stealTech(A,B)'),/mechanical/);
});
test('successful and caught direct notifications retain anonymous/known victim policy',()=>{
 for(const outcome of ['basari','ifsa']){
  const h=fresh(1,0);h.run(`dice('${outcome}');var r=stealTech(A,B);`);
  assert.equal(h.run("shown.join().includes('SECRET_ACTOR')"),outcome==='ifsa');
  assert.equal(h.run('B.hitLog[0].known'),outcome==='ifsa');
 }
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
