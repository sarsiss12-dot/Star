'use strict';
/* PERF.2 — aynı Save8'den N ay; seçili motor işlevlerinin kapsayıcı (inclusive) süreleri: çağrı sayısı, toplam, ortalama,
   medyan, p95, en uzun. Aynı işlevin iç içe çağrısı bir kez sayılır. Sarmalayıcı yalnız zaman ölçer; argüman/dönüş/RNG aynı.
   Ek: aynı gün aynı devlet için yinelenen aiEconomyPlan ve gölge empireIncome sayısı.
   Kullanım: node breakdown.cjs <root> <save.json> <months> [label] */
const path=require('path'),fs=require('fs'),crypto=require('crypto'),{performance}=require('perf_hooks');
const [root,save,months,label='']=process.argv.slice(2);
const {runtime}=require(path.join(path.resolve(root),'tests/helpers/runtime'));
const h=runtime({root:path.resolve(root)});h.sb.performance=performance;h.sb.__save=fs.readFileSync(save,'utf8');
if(h.run('deserialize(__save)')!==true)throw Error('deserialize failed');
const NAMES=['monthTick','dailyTick','structTick','colonyBuildTick','autoExploreTick','combatTick','economyTick','aiTurn','diploTick','tradeFlowTick','fedTick','councilTick','spyTick','crisisTick','warExhTick','settlementTick','attritionTick',
 'aiEconomyPlan','aiEconomicOrder','aiDemolitionChoice','aiStrategicBuildingNeeds','aiColonyForecast','aiStrategicFacts','aiNegotiate','aiRespond','aiMove','queueShip','queueBuilding','colonizeTargets',
 'empireIncome','aiBuildingDelta','tradeInfo','fleetSupply','findPath','executeDeal','dealTxBegin','say','notify','serialize'];
h.run(`G.autoSave=false;var __B={};var __dup={plan:new Map(),inc:0,incN:0};
 function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}}
 for(const n of ${JSON.stringify(NAMES)}){const tgt=n==='notify'?(typeof UI!=='undefined'?UI:null):globalThis;if(!tgt||typeof tgt[n]!=='function')continue;const o=tgt[n];const r=__B[n]={d:0,t:[]};
  tgt[n]=function(){if(n==='aiEconomyPlan'&&arguments[0]){const k=G.day+':'+arguments[0].id;__dup.plan.set(k,(__dup.plan.get(k)||0)+1);}
   if(r.d++)try{return o.apply(this,arguments);}finally{r.d--;}
   const t=performance.now();try{return o.apply(this,arguments);}finally{r.d--;r.t.push(performance.now()-t);}};}`);
h.run('__step()');h.run('for(const k in __B)__B[k].t=[];__dup.plan.clear()');
const t0=performance.now();for(let m=0;m<+months;m++)h.run('__step()');const wall=performance.now()-t0;
const B=JSON.parse(h.run('JSON.stringify(__B)')),plan=JSON.parse(h.run('JSON.stringify([...__dup.plan.values()])'));
const st=a=>{const s=[...a].sort((x,y)=>x-y),q=p=>s.length?+s[Math.min(s.length-1,Math.floor(p*s.length))].toFixed(2):0,tot=s.reduce((x,y)=>x+y,0);return {n:s.length,total:+tot.toFixed(1),mean:s.length?+(tot/s.length).toFixed(3):0,median:q(.5),p95:q(.95),max:s.length?+s[s.length-1].toFixed(1):0};};
const out={label,root:path.basename(path.resolve(root)),save:path.basename(save),months:+months,wallMs:+wall.toFixed(0),
 fn:Object.fromEntries(Object.entries(B).map(([k,v])=>[k,st(v.t)]).filter(([,v])=>v.n)),
 planRepeats:{keys:plan.length,calls:plan.reduce((a,b)=>a+b,0),redundant:plan.reduce((a,b)=>a+b-1,0),maxPerEmpireDay:Math.max(0,...plan)},
 final:{save8:crypto.createHash('sha256').update(h.run('serialize()')).digest('hex'),rng:h.run('String(RND_STATE)')}};
process.stdout.write(JSON.stringify(out)+'\n');
