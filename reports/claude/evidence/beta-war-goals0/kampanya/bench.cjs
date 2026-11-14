// Host ay adımı: aynı tohum, s500 / 16 AI, 24 ay ısınma + 12 ay ölçüm (ms/ay); kontrol p30 ve aday aynı süreçte sırayla.
const path=require('path');const roots=process.argv.slice(2);
for(const root of roots){const {runtime}=require(path.join(root,'tests/helpers/runtime'));const h=runtime({root});
 h.run(`setupGame({...CFG,seed:404,size:'s500',aiCount:16});G.autoSave=false;function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}for(let m=0;m<24;m++)step();`);
 const t=[];for(let m=0;m<12;m++){const t0=process.hrtime.bigint();h.run('step()');t.push(Number(process.hrtime.bigint()-t0)/1e6);}
 t.sort((a,b)=>a-b);console.log(JSON.stringify({root:path.basename(root),medMs:+t[6].toFixed(1),meanMs:+(t.reduce((a,b)=>a+b,0)/12).toFixed(1),maxMs:+t[11].toFixed(1)}));}
