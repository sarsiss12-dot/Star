const path=require('path'),fs=require('fs'),{performance}=require('perf_hooks');
const [root,save]=process.argv.slice(2);const {runtime}=require(path.join(path.resolve(root),'tests/helpers/runtime'));
const h=runtime({root:path.resolve(root)});h.sb.performance=performance;h.sb.__save=fs.readFileSync(save,'utf8');h.run('deserialize(__save)');
h.run(`G.autoSave=false;function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}}
var __S={inW:0,out:0,msIn:0,msOut:0,dupIn:0,keys:new Set(),wid:0,lastDepth:0};const o=fleetSupply;
globalThis.fleetSupply=function(e,f){const d=AI_INCOME_WINDOW.depth>0,t=performance.now();try{return o.apply(this,arguments);}finally{const dt=performance.now()-t;if(d){__S.inW++;__S.msIn+=dt;const k=e.id+':'+(G.fleets.indexOf(f));if(G.fleets.includes(f)){if(__S.keys.has(k))__S.dupIn++;else __S.keys.add(k);}}else{__S.out++;__S.msOut+=dt;}}};
const ow=aiIncomeWindow;`);
h.run('__step()');h.run('__S.inW=__S.out=__S.msIn=__S.msOut=__S.dupIn=0');const t=performance.now();
for(let m=0;m<3;m++)h.run('__step()');console.log(h.run('JSON.stringify({inW:__S.inW,out:__S.out,msIn:+__S.msIn.toFixed(0),msOut:+__S.msOut.toFixed(0)})'),'wall',(performance.now()-t).toFixed(0));
