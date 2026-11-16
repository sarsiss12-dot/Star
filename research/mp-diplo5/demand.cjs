const {runtime}=require(require('path').resolve(__dirname,'../../tests/helpers/runtime'));const [root,seed,months,size,ai]=process.argv.slice(2);
const h=runtime({root});h.run(`resetSetupNaming();Object.assign(CFG,{seed:${seed},size:'${size}',aiCount:${ai}});setupGame({...CFG});G.autoSave=false;
var __step=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};
var T={};var probe=()=>{for(const e of G.emps)for(const o of G.emps){if(e===o||!e.ai||!o.ai||e.dead||o.dead||e.wild||o.wild)continue;if(totalPower(e)<totalPower(o)*2)continue;const g=canDemandVassal(e,o);const k=g.ok?'OK':String(g.why||'?').slice(0,60);T[k]=(T[k]||0)+1;}};`);
for(let m=1;m<=+months;m++){h.run('__step()');if(m%12===0)h.run('probe()');}console.log(h.run('JSON.stringify(T)'));
