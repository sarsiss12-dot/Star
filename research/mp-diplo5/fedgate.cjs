const path=require('path'),{runtime}=require(require('path').resolve(__dirname,'../../tests/helpers/runtime'));const [root,seed,months,size,ai]=process.argv.slice(2);
const h=runtime({root});h.run(`resetSetupNaming();Object.assign(CFG,{seed:${seed},size:'${size}',aiCount:${ai}});setupGame({...CFG});G.autoSave=false;
var W={};var inFD=0;var __fd=fedDefend;fedDefend=function(a,v){inFD++;const f=findFed(v);if(f)for(const id of f.members){if(id===v.id)continue;const m=G.emps[id];if(!m||m.dead){W.dead=(W.dead||0)+1;continue;}if(m.war[a.id]){W.alreadyWar=(W.alreadyWar||0)+1;continue;}if(m.ally[a.id]){W.allyOfAttacker=(W.allyOfAttacker||0)+1;continue;}
 const g=fedSupportGate(m,a,false);if(!g.ok){const k='gate:'+String(g.why||'?').slice(0,70);W[k]=(W[k]||0)+1;continue;}if(m.ai&&aiDefenseShirk(m,a,v,f)){W.shirk=(W.shirk||0)+1;continue;}W.join=(W.join||0)+1;}
 const r=__fd.apply(this,arguments);inFD--;return r;};
var __step=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`);
for(let m=0;m<+months;m++)h.run('__step()');console.log(h.run('JSON.stringify(W)'));
