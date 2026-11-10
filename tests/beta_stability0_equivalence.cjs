'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{runtime}=require('./helpers/runtime');
const root=require('./helpers/beta-stability0-control.cjs').root(),out=process.env.STARS_OUTPUT||'/tmp/stability-equivalence';fs.mkdirSync(out,{recursive:true});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),rows=[];let fail=0;
const step='for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}';
for(const seed of[11,42,99]){const a=runtime({root}),b=runtime(),samples=[];try{
 for(const h of[a,b])h.run(`setupGame({...CFG,seed:${seed},size:'orta',aiCount:5});G.autoSave=false;`);
 for(let month=0;month<=3;month++){
  const before=a.run('serialize()'),after=b.run('serialize()'),x=JSON.parse(after),journal=x.fleetJournal;
  if(journal){assert(journal.length<=256);assert(b.run('JSON.stringify(cleanFleetJournal(G.fleetJournal))===JSON.stringify(G.fleetJournal)'));delete x.fleetJournal;}
  // Only the explicit new diagnostic field is compared separately. No fleet, resource, order or AI field is normalized.
  assert.equal(JSON.stringify(x),before,'strategic Save8 seed '+seed+' month '+month);assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
  samples.push({month,rawSaveEqual:before===after,strategySaveSha256:sha(before),journalEntries:journal?.length||0,rng:b.run('RND_STATE')});
  if(month<3){a.run(step);b.run(step);}
 }
 rows.push({seed,status:'PASS',samples});console.log('PASS p21 seed '+seed+' 3 months exact strategic Save8/RNG (diagnostic field explicitly separated)');
}catch(e){fail++;rows.push({seed,status:'FAIL',samples,error:e.stack});console.log('FAIL '+e.stack);}}
const old=runtime({root});old.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));old.run(`setupGame({...CFG,seed:23,size:'orta',aiCount:5});var host=StarsMP.createHost({roomId:'old',random:k=>'ab'.repeat(k),send(){}});var pkg=host.snapshot({}).pkg;`);
const current=runtime();current.run(fs.readFileSync('research/mp0/mp-core.js','utf8'));current.sb.pkg=JSON.parse(old.run('JSON.stringify(pkg)'));
try{assert.equal(current.sb.pkg.build,'96h10p21');assert(current.run('StarsMP.validatePackage(pkg).ok'));current.run('pkg.integrity.save8="00"');assert.equal(current.run('StarsMP.validatePackage(pkg).ok'),false);rows.push({name:'p21 package4 / protocol1 integrity',status:'PASS'});console.log('PASS p21 package accepted, bad integrity rejected');}catch(e){fail++;rows.push({name:'p21 MP package',status:'FAIL',error:e.stack});console.log('FAIL '+e.stack);}
fs.writeFileSync(path.join(out,'comparison.json'),JSON.stringify(rows,null,2));process.exitCode=fail?1:0;
