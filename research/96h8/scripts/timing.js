const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,months]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');
h.sb.realNow=()=>Number(process.hrtime.bigint())/1e6;
h.run('var tc8={ms:0,n:0,turn:0,tn:0};const mc8=aiMilitaryCampaign;aiMilitaryCampaign=function(){const t=realNow();try{return mc8.apply(this,arguments)}finally{tc8.ms+=realNow()-t;tc8.n++;}};const at8=aiTurn;aiTurn=function(){const t=realNow();try{return at8.apply(this,arguments)}finally{tc8.turn+=realNow()-t;tc8.tn++;}};');
const t=Date.now();for(let m=0;m<+months;m++)h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
const r=JSON.parse(h.run('JSON.stringify(tc8)'));console.log(JSON.stringify({root:root.split('/').pop(),campaignCalls:r.n,campaignMs:+r.ms.toFixed(1),perCallMs:+(r.ms/r.n).toFixed(3),aiTurns:r.tn,aiTurnMs:+r.turn.toFixed(0),perTurnMs:+(r.turn/r.tn).toFixed(2),wallMs:Date.now()-t}));
