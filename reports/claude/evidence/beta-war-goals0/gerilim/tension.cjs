// Kontrollü gerilim deneyi: aynı dünya (seed 23, 8 AI, 60. ay Save8), her gerilim düzeyi için aynı 60 RNG tohumu × 12 ay gerçek monthTick.
const path=require('path'),root=process.argv[2];const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const base=runtime({root});base.run(`setupGame({...CFG,seed:23,size:'orta',aiCount:8});G.autoSave=false;function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}for(let m=0;m<60;m++)step();`);
const save=base.run('serialize()');const out={};
for(const t of ['sakin','dengeli','calkantili']){const r={wars:0,ff:0,ops:0,coalition:0,runs:0};
 for(let k=0;k<60;k++){const h=runtime({root});h.sb.__s=save;h.run(`deserialize(__s);G.autoSave=false;${t==='dengeli'?'delete G.cfg.tension;':"G.cfg.tension='"+t+"';"}rndSeed(${1000+k});globalThis.__c={wars:0,ff:0,ops:0,co:0};
  const dw=declareWar;declareWar=function(a,b,s){const was=!!(a&&b&&a.war[b.id]);const x=dw.apply(this,arguments);if(x&&!was&&a.ai&&!s)__c.wars++;return x;};
  const ff=falseFlagOp;falseFlagOp=function(e){const x=ff.apply(this,arguments);if(e.ai)__c.ff++;return x;};
  const ro=runOp;runOp=function(e){const x=ro.apply(this,arguments);if(e&&e.ai)__c.ops++;return x;};
  const ap=aiPlanEvent;aiPlanEvent=function(e,k){if(k==='coalition-offer'||k==='support-opportunity')__c.co++;return ap.apply(this,arguments);};
  function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}for(let m=0;m<12;m++)step();`);
  const c=JSON.parse(h.run('JSON.stringify(__c)'));r.wars+=c.wars;r.ff+=c.ff;r.ops+=c.ops;r.coalition+=c.co;r.runs++;}
 out[t]=r;console.error(t,JSON.stringify(r));}
console.log(JSON.stringify(out));
