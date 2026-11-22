// node camp.cjs <save> <ay> <kök...>: aynı Save8'den N ay, gerçek saatle ay başına süre + o ay yürütülen anlaşma sayısı
const fs=require('fs'),path=require('path');const {runtime}=require('/home/user/Star/tests/helpers/runtime');
const [save,months,...roots]=process.argv.slice(2);const out={};
for(const root of roots){const h=runtime({root:path.resolve(root)});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');
 h.run(`G.autoSave=false;var NX=0;var __ex=executeDeal;executeDeal=function(){NX++;return __ex.apply(this,arguments);};`);
 const rows=[];for(let m=0;m<+months;m++){const t0=process.hrtime.bigint();h.run('NX=0;{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}');
  rows.push({ms:Number(process.hrtime.bigint()-t0)/1e6,deals:h.run('NX'),contracts:h.run('(G.commerce?.contracts||[]).length')});}
 const ms=rows.map(r=>r.ms),sum=ms.reduce((a,b)=>a+b,0),s=ms.slice().sort((a,b)=>a-b);
 out[path.basename(root)]={mean:Math.round(sum/ms.length*10)/10,p50:Math.round(s[Math.floor(s.length/2)]*10)/10,p95:Math.round(s[Math.ceil(.95*s.length)-1]*10)/10,deals:rows.reduce((n,r)=>n+r.deals,0),rows};}
console.log(JSON.stringify(out));
