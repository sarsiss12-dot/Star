'use strict';
/* MP.1 aktör eşdeğerliği (mp1_lobby_core_test.js'den taşındı; MP.1.1). Her seed için tek
   oyunculu 120 aylık simülasyonda her ay sonu iki denetim: isHumanActor yalnız devlet 0'ı
   verir; actorVision(G.p) = G.vis. Seed'ler iki dosyaya bölündü: run-all 180 sn sınırına sığsın. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {runtime}=require('./runtime'),{harness}=require('./95e-fixture');
const root=path.resolve(__dirname,'../..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();}}}';
function suite(seeds,{idCheck}={}){
  const {test,end}=harness(),runs={};
  for(const seed of seeds){const h=runtime({root});h.run(CORE);h.run(`setupGame({...CFG,seed:${seed}});G.autoSave=false;${STEP}
    var badHuman=0,badVis=0,n=0;const mt=monthTick;monthTick=function(){const r=mt.apply(this,arguments);n++;
      if(G.emps.filter(StarsMP.isHumanActor).map(e=>e.id).join()!=='0')badHuman++;
      if([...StarsMP.actorVision(G.p)].sort().join()!==[...G.vis].sort().join())badVis++;return r;};step(3600)`);
    runs[seed]={human:h.run('badHuman'),vis:h.run('badVis'),n:h.run('n')};}
  test('isHumanActor is exactly the single-player human (empire 0) over 120 months, seeds '+seeds.join('/')+(idCheck?', and is not an id check':''),()=>{
    for(const [seed,r] of Object.entries(runs)){assert.equal(r.human,0,'seed '+seed);assert.equal(r.n,120);}
    if(idCheck){const h=runtime({root});h.run(CORE);h.run('setupGame({...CFG,seed:11});G.emps[3].ai=false');
      assert.deepEqual(JSON.parse(h.run('JSON.stringify(G.emps.filter(StarsMP.isHumanActor).map(e=>e.id))')),[0,3]);}
  });
  test('actor-general vision equals updateVision for the local player (120 months, seeds '+seeds.join('/')+')',()=>{
    for(const [seed,r] of Object.entries(runs)){assert.equal(r.vis,0,'seed '+seed);assert.equal(r.n,120);}
  });
  end();
}
module.exports={suite};
