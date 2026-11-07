'use strict';
// Actual daily/monthly engine path. No forced survival, cleanup, config patch or Save8 normalization.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const root=path.resolve(__dirname,'..'),control=process.env.STARS_CONTROL_ROOT,out=process.env.STARS_OUTPUT||'/tmp/stars-beta-setup0/campaign';if(!control)throw Error('STARS_CONTROL_ROOT required');fs.mkdirSync(out,{recursive:true});
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),results=[];
function run(codeRoot,seed,pirates,label){const h=runtime({root:codeRoot});h.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:${seed},pirates:${pirates},ruins:'orta'});G.autoSave=false;
 var observed={pirateBirths:0,pirateRaids:0};var wild0=wildTurn;wildTurn=function(e){var ids=new Set(G.fleets.map(f=>f.id));var r=wild0(e);observed.pirateBirths+=G.fleets.filter(f=>!ids.has(f.id)&&f.e===G.wildId&&!f.monster).length;return r;};
 var attack0=Commerce.attack;Commerce.attack=function(v,f){var r=attack0.call(this,v,f);if(r&&f.e===G.wildId&&!f.monster)observed.pirateRaids++;return r;};
 function advanceMonth(){for(var i=0;i<60;i++){var old=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>old)monthTick();if(G.over)return false;}return true;}
 function sample(){return {day:G.day,year:G.year,month:G.month,rng:RND_STATE,pirates:G.cfg.pirates,pirateEra:G.upheaval?.k==='korsanCagi',nests:G.nests.length,systemNests:G.sys.filter(s=>s.nest).length,fleets:G.fleets.filter(f=>f.e===G.wildId&&!f.monster).length,monsters:G.fleets.filter(f=>f.e===G.wildId&&f.monster).length,ruins:G.ruins.length,wildId:G.wildId,ids:G.emps.map(e=>e.id),...observed};}`);
 const rows=[],started=Date.now();for(let month=0;month<=120;month++){
  if(month&&h.run('advanceMonth()')!==true)throw Error(label+' seed '+seed+' ended before month '+month);
  const row=JSON.parse(h.run('JSON.stringify(sample())'));row.actualMonth=month;row.saveSha256=sha(h.run('serialize()'));rows.push(row);
  if(!pirates){assert.equal(row.nests+row.systemNests+row.fleets+row.pirateBirths+row.pirateRaids,0,label+' month '+month);assert.equal(row.pirateEra,false);}
  if([0,30,120].includes(month)){assert.equal(row.day,month*30);console.log(label+' seed '+seed+' month '+month+' '+JSON.stringify(row),true);}
 }
 const save=h.run('serialize()'),loaded=runtime({root:codeRoot});loaded.sb.__save=save;assert.equal(loaded.run('deserialize(__save)'),true);assert.equal(loaded.run('G.cfg.pirates'),pirates);assert.equal(loaded.run('RND_STATE'),h.run('RND_STATE'));assert.equal(loaded.run('G.wildId'),h.run('G.wildId'));
 if(!pirates)assert.equal(loaded.run('G.nests.length+G.fleets.filter(f=>f.e===G.wildId&&!f.monster).length'),0);
 return {label,seed,pirates,months:120,samples:rows.length,ms:Date.now()-started,rows,reload:'PASS'};
}
try{for(const seed of [11,99,404]){const base=run(control,seed,true,'p02-on'),on=run(root,seed,true,'candidate-on');assert(on.rows[0].fleets>0&&on.rows[0].nests>0);assert(on.rows.at(-1).pirateBirths>0);
 for(let i=0;i<121;i++){assert.equal(on.rows[i].saveSha256,base.rows[i].saveSha256,'ON direct Save8 seed '+seed+' month '+i);assert.equal(on.rows[i].rng,base.rows[i].rng);}
 const off=run(root,seed,false,'candidate-off'),repeat=run(root,seed,false,'off-repeat');for(let i=0;i<121;i++){assert.equal(off.rows[i].saveSha256,repeat.rows[i].saveSha256,'OFF deterministic seed '+seed+' month '+i);assert.equal(off.rows[i].rng,repeat.rows[i].rng);}
 assert.equal(off.rows[0].wildId,on.rows[0].wildId);assert.deepEqual(off.rows[0].ids,on.rows[0].ids);
 results.push({seed,status:'PASS',onEquivalentEveryMonth:true,offDeterministicEveryMonth:true,runs:[base,on,off,repeat]});fs.writeFileSync(path.join(out,'campaign.json'),JSON.stringify(results,null,2));console.log('PASS seed '+seed+' ON control / OFF zero / repeat / reload');}
}catch(e){results.push({status:'FAIL',error:e.stack});fs.writeFileSync(path.join(out,'campaign.json'),JSON.stringify(results,null,2));console.error(e.stack);process.exitCode=1;}
