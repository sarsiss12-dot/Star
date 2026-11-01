'use strict';
/* PERF.1 — kontrol kökünden (sabit kopya) kontrol noktası kayıtları üretir: aynı tohum, ULU, 11 AI; 120/180/240. ay Save8.
   Kullanım: node gen-saves.cjs <root> <seed> <outDir> [months=240] [size=ulu] [ai=11] */
const path=require('path'),fs=require('fs');
const [root,seed,outDir,months='240',size='ulu',ai='11']=process.argv.slice(2);
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const h=runtime({root});
h.run(`setupGame({...CFG,size:${JSON.stringify(size)},aiCount:${+ai},seed:${+seed}});G.autoSave=false;
  function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}}`);
const CK=[60,120,180,240,360].filter(m=>m<=+months);
for(let m=1;m<=+months;m++){h.run('__step()');if(CK.includes(m)){const f=path.join(outDir,`${size}${ai}-s${seed}-m${m}.json`);fs.writeFileSync(f,h.run('serialize()'));process.stderr.write(f+'\n');}}
