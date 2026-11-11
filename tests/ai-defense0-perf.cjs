'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime'),exp=require('./helpers/ai-defense0-experiments.cjs');
const root=require('./helpers/ai-quality0-control.cjs').root(),out=process.env.STARS_OUTPUT||'/tmp/defense0-perf';fs.mkdirSync(out,{recursive:true});const rows=[];
for(const file of ['/tmp/aiq0-saves/p23-404-60-ulu-9-final.sav','/tmp/aiq0-saves/p23-11-24-s200-16-final.sav'])for(let repetition=0;repetition<3;repetition++)for(const mode of ['base','defense','safe-yard','allied-defense']){
 const h=runtime({root:exp.root(root,mode)});h.sb.raw=fs.readFileSync(file,'utf8');assert(h.run('deserialize(raw)'));h.sb.now=()=>performance.now();h.run('G.autoSave=false;var t={aiMs:0,aiCalls:0};var originalAI=aiTurn;aiTurn=function(...a){const at=now();try{return originalAI.apply(this,a);}finally{t.aiMs+=now()-at;t.aiCalls++;}};');
 const start=performance.now();h.run('for(let i=0;i<360;i++){var d=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>d)monthTick();}');
 rows.push({file:path.basename(file),mode,repetition,months:6,ms:performance.now()-start,...JSON.parse(h.run('JSON.stringify(t)'))});
}
fs.writeFileSync(path.join(out,'perf.json'),JSON.stringify(rows,null,2));console.log('PASS sequential three repetitions / real six-month loops /100systems9AI and200systems16AI');
