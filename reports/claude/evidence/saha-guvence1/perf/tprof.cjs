// node tprof.cjs <kök> <save> <tekrar>: bir tam ay (60 yarım gün + ay geçişi) işlev süreleri
const fs=require('fs'),path=require('path');const {runtime}=require('/home/user/Star/tests/helpers/runtime');
const [root,save,reps]=process.argv.slice(2);const raw=fs.readFileSync(save,'utf8');const out=[];
for(let r=0;r<+(reps||3);r++){const h=runtime({root:path.resolve(root)});h.sb.raw=raw;if(h.run('deserialize(raw)')!==true)throw Error('load');h.sb.__now=()=>Number(process.hrtime.bigint())/1e6;h.sb.__cnt={};
 h.run(`G.autoSave=false;var MC={};var W=(o,k,n)=>{const f=o[k];if(typeof f!=='function')return;o[k]=function(...a){const t=__now();__cnt[n||k]=(__cnt[n||k]||0)+1;try{return f.apply(this,a);}finally{MC[n||k]=(MC[n||k]||0)+__now()-t;}};};
 for(const k of ['monthTick','dailyTick','economyTick','diploTick','executeDeal','dealQuote','dealTxBegin','aiTurn','aiNegotiate'])W(globalThis,k);
 if(typeof Commerce!=='undefined')for(const k of ['aiTick','aiPartnerOffers','route','aiOpportunityTick','aiRouteSignature','freightPlan','dispatch','tick','aiBalance','aiPorts','aiTerms'])W(Commerce,k,'C.'+k);`);
 const t0=process.hrtime.bigint();h.run(`{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}}`);
 const ms=Number(process.hrtime.bigint()-t0)/1e6;out.push({ms,mc:JSON.parse(h.run('JSON.stringify(MC)')),cnt:h.sb.__cnt});}
const med=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];const keys=[...new Set(out.flatMap(o=>Object.keys(o.mc)))];
console.log(JSON.stringify({cnt:out[0].cnt,total:Math.round(med(out.map(o=>o.ms))),fn:Object.fromEntries(keys.map(k=>[k,Math.round(med(out.map(o=>o.mc[k]||0))*10)/10]).filter(([k,v])=>v>0.5))}));
