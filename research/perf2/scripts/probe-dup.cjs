'use strict';
/* PERF.2 sonda: okuma-yalnız AI pencerelerinde yinelenen aiEconomyPlan / gölge empireIncome sayısı. */
const path=require('path'),fs=require('fs');
const [root,save,months='2']=process.argv.slice(2);
const {runtime}=require(path.join(path.resolve(root),'tests/helpers/runtime'));
const h=runtime({root:path.resolve(root)});h.sb.__save=fs.readFileSync(save,'utf8');
if(h.run('deserialize(__save)')!==true)throw Error('deser');
h.run(`G.autoSave=false;function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}}
var __P={win:[],c:{}};const W=['aiEconomicOrder','aiDemolitionChoice','aiStrategicBuildingNeeds','aiColonyForecast','aiEconomyPlan','aiRecoveryInvestment','aiColonyPreparation'];
function cnt(k){__P.c[k]=(__P.c[k]||0)+1;}
for(const n of ['aiEconomyPlan','aiBuildingDelta','empireIncome','aiEconomicOrder','aiDemolitionChoice','aiStrategicBuildingNeeds','aiColonyForecast','aiTurn']){const o=globalThis[n];
 globalThis[n]=function(e){const top=__P.win.length?__P.win[0]:'-';cnt(n+'@'+top);
  if(n==='empireIncome'&&arguments[1]===false&&e._trAt!==-1)cnt('incOld@'+top);
  const isW=W.includes(n);if(isW)__P.win.push(n);try{return o.apply(this,arguments);}finally{if(isW)__P.win.pop();}};}`);
h.run('__step()');h.run('__P.c={}');
for(let m=0;m<+months;m++)h.run('__step()');
const c=JSON.parse(h.run('JSON.stringify(__P.c)'));console.log(Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>v+'\t'+k).join('\n'));
