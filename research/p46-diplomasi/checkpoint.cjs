'use strict';
const fs=require('node:fs'),{runtime}=require('../../tests/helpers/runtime');
const [seed,month,destination]=process.argv.slice(2);
const h=runtime({processGlobal:true});
h.run(`setupGame({...CFG,size:setupSizeKey(100),aiCount:9,seed:${Number(seed)}});G.autoSave=false;`);
h.run(`for(let j=0;j<${Number(month)*60}&&!G.over;j++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}`);
fs.writeFileSync(destination,h.run('serialize()'));
