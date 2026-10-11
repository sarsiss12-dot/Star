'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const {measure}=require('./ai-operation-selection-probe');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
function eq(a,b=true){assert.equal(a,b);}
function fresh(){
  const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  h.run(`var A=G.emps[1],B=G.emps[3],C=G.emps[4];
    for(const e of [A,B,C]){
      e.dead=false;e.wild=false;e.crisisSide=false;e.civics=[];e.ethics={mil:0,aut:0,mat:0,ahl:0};
      e.persLock='pasifist';e._pers='pasifist';e._persAt=G.memAge;e.mods.opCost=0;
      e._prof={sci:1.2,dip:.8,eco:1,war:.8,exp:1,turtle:.2};
      e.intel={};e.opLog=[];e.hitLog=[];e.mem={};e.war={};e.ally={};
      for(const r in e.res)e.res[r]=10000;
      for(const o of [A,B,C])if(o!==e){e.contact[o.id]=true;e.intel[o.id]=3;e.rel[o.id]=50;}
    }
    function state(){return JSON.stringify([G.emps,G.sys,G.log,G.inbox,RND_STATE]);}
    function only(keys){A.opLog=Object.keys(OPS).concat(['incite','stealTech']).filter(k=>!keys.includes(k)).map(k=>({k,o:B.id,t:G.memAge}));}
  `);return h;
}
test('geçersiz yüksek puanlı soruşturma yerine gerçek filo planı seçilir',()=>{
  const h=fresh();h.run(`only(['sorusturma','filoPlan']);A.war[B.id]=true;
    A.hitLog=[{known:true,by:C.id,framed:C.id},{known:true,by:C.id,framed:C.id}];
    var q=opQuote(A,B,'sorusturma');var k=aiPickOp(A,B);`);
  eq(h.run('q.ok'),false);eq(h.run('k'),'filoPlan');eq(h.run('runOp(A,B,k).ok'));
});
test('çalınacak teknoloji yoksa hiçbir operasyon seçmeyebilir',()=>{
  const h=fresh();h.run("only(['calTech']);A.techs={};B.techs={};var rng=RND_STATE;var k=aiPickOp(A,B);");
  eq(h.run('k'),null);eq(h.run('RND_STATE===rng'));
});
test('geçerli teknoloji operasyonu aynı puanla seçilir',()=>{
  const h=fresh();h.run("only(['calTech']);A.techs={};B.techs={t_tarim:true};var k=aiPickOp(A,B);");
  eq(h.run('k'),'calTech');eq(h.run('runOp(A,B,k).ok'));eq(h.run('A.techs.t_tarim'));
});
test('geçerli eski soruşturma elenmez',()=>{
  const h=fresh();h.run(`only(['sorusturma']);A.hitLog=[{known:true,by:B.id,framed:C.id}];var k=aiPickOp(A,B);`);
  eq(h.run('k'),'sorusturma');eq(h.run('runOp(A,B,k).ok'));
});
for(const [label,mod,stock,expected] of [
  ['taban altında',0,55.99,false],['taban sınırında',0,56,true],
  ['pahalı sınır altında',1,111.99,false],['pahalı sınırında',1,112,true],
  ['indirimli sınır altında',-.5,27.99,false],['indirimli sınırında',-.5,28,true]
])test('gerçek maliyet üzerinden %40 rezerv: '+label,()=>{
  const h=fresh();h.run(`A.mods.opCost=${mod};A.res.etk=${stock};var before=state();var ready=aiStandardOpReady(A,B,'kervan');`);
  eq(h.run('ready'),expected);eq(h.run('state()===before'));
});
test('iki kaynaklı sabotajda alaşım rezervi de gerekir',()=>{
  const h=fresh();h.run(`var sy=G.sys.find(s=>s.owner===B.id);sy.queue.push({k:'kor',left:5});
    A.mods.opCost=1;A.res.etk=140;A.res.ala=335.99;var low=aiStandardOpReady(A,B,'sabotaj');
    A.res.ala=336;var high=aiStandardOpReady(A,B,'sabotaj');`);
  eq(h.run('low'),false);eq(h.run('high'));
});
test('gerçek seçici pahalı operasyonu rezerv eksikken atlar',()=>{
  const h=fresh();h.run("only(['calTech']);A.techs={};B.techs={t_tarim:true};A.mods.opCost=1;A.res.etk=100;var k=aiPickOp(A,B);");
  eq(h.run('k'),null);
});
test('kota dışı yeni RNG tüketimi olmadan 2400 aday kontrolü yapılır',()=>{
  const h=fresh();h.run('var before=state();for(let i=0;i<200;i++)for(const k in OPS)aiStandardOpReady(A,B,k);');
  eq(h.run('state()===before'));
});
test('süren etki ve son 24 ay tekrar filtresi korunur',()=>{
  const h=fresh();h.run("only(['filoPlan']);A.war[B.id]=true;A.fleetIntel={[B.id]:G.day+1};var active=aiPickOp(A,B);delete A.fleetIntel[B.id];A.opLog.push({k:'filoPlan',o:B.id,t:G.memAge-23});var recent=aiPickOp(A,B);A.opLog.at(-1).t=G.memAge-24;var expired=aiPickOp(A,B);");
  eq(h.run('active'),null);eq(h.run('recent'),null);eq(h.run('expired'),'filoPlan');
});
test('etikten gelen incite puanı uygunsuz hedefi açamaz',()=>{
  const h=fresh();h.run("only(['incite']);A.ethics.ahl=-2;A.civics=['golge_kons'];B.colonies=[];G.rebelAlliance={target:B.id,members:[A.id],done:false};var valid=canIncite(A,B).ok;var k=aiPickOp(A,B);");
  eq(h.run('valid'),false);eq(h.run('k'),null);
});
for(const [name,setup,target] of [
  ['temassız','A.contact[B.id]=false;','B'],['ölü','B.dead=true;','B'],
  ['kendisi','','A'],['eski nesne','var old={...B};','old'],['eksik','','null']
])test('seçici '+name+' hedefte profil/kilit/RNG değiştirmez',()=>{
  const h=fresh();h.run(`${setup}var before=state();var k=aiPickOp(A,${target});`);
  eq(h.run('k'),null);eq(h.run('state()===before'));
});
test('puanı eşik altında kalan geçerli aday zorla yürütülmez',()=>{
  const h=fresh();h.run("only(['calTech']);A.techs={};B.techs={t_tarim:true};A._prof.sci=.2;var k=aiPickOp(A,B);");
  eq(h.run('k'),null);
});
test('özel teknoloji verisi yolu standart calTech ile karışmaz',()=>{
  const h=fresh();h.run("only(['stealTech']);A.techs={};B.techs=Object.fromEntries(Object.keys(TECHS).slice(0,5).map(k=>[k,true]));var k=aiPickOp(A,B);var before=A.res.etk;var r=stealTech(A,B);");
  eq(h.run('k'),'stealTech');eq(h.run('r.ok'));eq(h.run('before-A.res.etk'),90);
});
test('uygun sınır kolonisi özel incite yolunda kalır; gerçek bedel 120',()=>{
  const h=fresh();h.run(`only(['incite']);var col=B.colonies[0],sy=G.sys[col.s],pl=sy.planets[col.p];
    B.home=-1;sy.lanes.push(A.home);pl.martial_law=0;pl.col.stab=20;pl.col.secede=11;
    var k=aiPickOp(A,B);var before=A.res.etk;var r=inciteRebellion(A,B);`);
  eq(h.run('k'),'incite');eq(h.run('r.ok'));eq(h.run('before-A.res.etk'),120);
});
for(const seed of [11,99,404])test('AI laboratuvarı seed '+seed+': sıfır geçersiz standart seçim, kota ve deterministik sonuç',()=>{
  const one=measure(ROOT,seed),two=measure(ROOT,seed);
  assert.deepEqual(one,two);assert.ok(one.executed>0);eq(one.rejected,0);eq(one.selectedInvalid,0);
  eq(one.quotaViolations,0);eq(one.pickRngChanges,0);
  for(const special of Object.values(one.special))eq(special.rejected,0);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
