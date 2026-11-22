const fs=require('fs'),path=require('path');const {runtime}=require('/home/user/Star/tests/helpers/runtime');
for(const root of process.argv.slice(3)){const h=runtime({root:path.resolve(root)});h.sb.raw=fs.readFileSync(process.argv[2],'utf8');h.run('deserialize(raw)');
h.run(`G.autoSave=false;var LOG=[];var __ex=executeDeal;executeDeal=function(o){const r=__ex.apply(this,arguments);LOG.push({from:o.from,to:o.to,give:(o.give||[]).map(i=>i.t+(i.r?':'+i.r:'')),want:(o.want||[]).map(i=>i.t+(i.r?':'+i.r:'')),ok:r,stack:(new Error().stack.split('\\n')[2]||'').trim().slice(0,90)});return r;};
{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}}`);
console.log(root.split('/').pop(),h.run('JSON.stringify(LOG)'));}
