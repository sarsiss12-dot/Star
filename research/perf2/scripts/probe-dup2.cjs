'use strict';
const path=require('path'),fs=require('fs');
const [root,save,months='2']=process.argv.slice(2);
const {runtime}=require(path.join(path.resolve(root),'tests/helpers/runtime'));
const h=runtime({root:path.resolve(root)});h.sb.__save=fs.readFileSync(save,'utf8');
if(h.run('deserialize(__save)')!==true)throw Error('deser');
h.run(`G.autoSave=false;function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}}
var __P={d:0,wid:0,keys:new Set(),tot:0,dup:0,fed:0,fedDup:0};const W=['aiEconomicOrder','aiDemolitionChoice','aiStrategicBuildingNeeds','aiColonyForecast','aiEconomyPlan'];
for(const n of W){const o=globalThis[n];globalThis[n]=function(){if(__P.d++===0)__P.wid++;try{return o.apply(this,arguments);}finally{__P.d--;}};}
{const o=aiBuildingDelta;globalThis.aiBuildingDelta=function(e,sys,pl,key,queued=false,direction=1){const k=__P.wid+'|'+e.id+'|'+sys.id+'.'+pl.i+'|'+key+'|'+queued+'|'+direction;__P.tot++;const fed=!!findFed(e);if(fed)__P.fed++;if(__P.keys.has(k)){__P.dup++;if(fed)__P.fedDup++;}else __P.keys.add(k);return o.apply(this,arguments);};}`);
h.run('__step()');h.run('__P.tot=__P.dup=__P.fed=__P.fedDup=0;__P.keys.clear()');
for(let m=0;m<+months;m++)h.run('__step()');
console.log(h.run('JSON.stringify({tot:__P.tot,dup:__P.dup,fed:__P.fed,fedDup:__P.fedDup,windows:__P.wid})'));
