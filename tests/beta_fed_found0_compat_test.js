'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{runtime}=require('./helpers/runtime');
const {withPinnedRuntime}=require('./helpers/pinned-runtime');
const before='4ef02795042528d82a7e59c484ccff3c6c10875f',founding='618df01768394c7c262e89dc0de979fdb0564bcb';
const out=process.env.STARS_OUTPUT||'/tmp/stars-fed0-compat';fs.mkdirSync(out,{recursive:true});const rows=[],sha=s=>crypto.createHash('sha256').update(s).digest('hex');let fail=0;
const step=`function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}`;
function test(name,fn){try{rows.push({name,status:'PASS',samples:fn()});console.log('PASS '+name);}catch(e){fail++;rows.push({name,status:'FAIL',error:e.stack});console.error(e.stack);}}
function replay(control,candidate){
  for(const seed of [11,23,42,99,404])test(`p13/p14 SP seed ${seed} · 3 ay ham Save8/RNG`,()=>{
    const a=runtime({root:control}),b=runtime({root:candidate});
    a.run(`setupGame({...CFG,seed:${seed},size:'orta',aiCount:5});G.autoSave=false;`);
    const save=a.run('serialize()');
    for(const h of [a,b]){h.sb.save=save;assert(h.run('deserialize(save)'));h.run(step);}
    const samples=[];
    for(let month=1;month<=3;month++){
      a.run('step()');b.run('step()');const av=a.run('serialize()'),bv=b.run('serialize()');
      assert(bv===av,`raw Save8 seed ${seed} month ${month}: ${sha(bv)} !== ${sha(av)}`);
      assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
      samples.push({month,sha256:sha(av),rng:b.run('RND_STATE')});
    }
    return samples;
  });
  test('gerçek p13 MP paketi · güncel yükleme / bozuk bütünlük reddi',()=>{
    const old=runtime({root:control});old.run(fs.readFileSync(path.join(control,'research/mp0/mp-core.js'),'utf8'));
    old.run(`setupGame({...CFG,seed:99,size:'orta',aiCount:5});var h=StarsMP.createHost({roomId:'old',random:k=>'ab'.repeat(k),send(){}});var p=h.snapshot({}).pkg;`);
    const current=runtime();current.sb.pkg=JSON.parse(old.run('JSON.stringify(p)'));current.run(fs.readFileSync(path.join(__dirname,'../research/mp0/mp-core.js'),'utf8'));
    assert.equal(current.sb.pkg.build,'96h10p13');assert(current.run('StarsMP.validatePackage(pkg).ok'));
    assert(current.run('StarsMP.loadWorld(StarsMP.validatePackage(pkg).pkg).ok'));
    const state=`JSON.stringify({day:G.day,seed:G.seed,rng:RND_STATE,emps:G.emps.map(e=>[e.id,e.res,e.colonies,Object.keys(e.war).filter(k=>e.war[k])]),fleets:G.fleets.map(f=>[f.id,f.e,f.ships.map(s=>[s.c,s.h])])})`;
    assert.equal(current.run(state),old.run(state));
    current.run('pkg.integrity.save8="00"');assert.equal(current.run('StarsMP.validatePackage(pkg).ok'),false);
  });
}
const control=process.env.STARS_CONTROL_ROOT;
try{
  withPinnedRuntime(founding,candidate=>{
    if(control)replay(control,candidate);
    else withPinnedRuntime(before,root=>replay(root,candidate),['research/mp0/mp-core.js']);
  });
}finally{
  fs.writeFileSync(path.join(out,'compat.json'),JSON.stringify(rows,null,2));
  console.log(`GEÇEN: ${rows.filter(r=>r.status==='PASS').length} KALAN: ${fail}`);if(fail)process.exitCode=1;
}
