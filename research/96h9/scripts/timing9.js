const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,months]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');
h.sb.realNow=()=>Number(process.hrtime.bigint())/1e6;
h.run('var T={};function W(n){const o=globalThis[n];globalThis[n]=function(){const t=realNow();try{return o.apply(this,arguments)}finally{const r=T[n]||(T[n]={ms:0,n:0});r.ms+=realNow()-t;r.n++;}};}["aiMilitaryCampaign","aiShipProduction","aiTurn","aiArmyTick","monthTick"].forEach(W);');
const t=Date.now();for(let m=0;m<+months;m++)h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
const r=JSON.parse(h.run('JSON.stringify(T)'));const o={root:root.split('/').pop(),wallMs:Date.now()-t};for(const k in r)o[k]={calls:r[k].n,perCallMs:+(r[k].ms/r[k].n).toFixed(3)};console.log(JSON.stringify(o));
