'use strict';
/* PERF.1 — aynı Save8'den N ay; kontrol ve aday aynı betikle. Çıktı: ay başına süre, sıcak işlev çağrı sayıları/süreleri
   (COUNT=1), son Save8 ve RNG durumunun SHA-256'sı, isteğe bağlı aylık Save8 özetleri (TRACE=1).
   Kullanım: node bench.cjs <root> <save.json> <months> [label] */
const path=require('path'),fs=require('fs'),crypto=require('crypto'),{performance}=require('perf_hooks');
const [root,save,months,label='']=process.argv.slice(2);
const {runtime}=require(path.join(path.resolve(root),'tests/helpers/runtime'));
const h=runtime({root:path.resolve(root)});h.sb.performance=performance;h.sb.__save=fs.readFileSync(save,'utf8');
const COUNT=process.env.COUNT==='1',TRACE=process.env.TRACE==='1';
if(h.run('deserialize(__save)')!==true)throw Error('deserialize failed');
h.run(`G.autoSave=false;var __c={};
  function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}}`);
if(COUNT)h.run(`for(const n of ['aiTurn','aiBuildingDelta','aiEconomyPlan','aiBuildingSustainable','empireIncome','tradeInfo','tradeLinks','findPath','colonyOutput']){const o=globalThis[n];if(typeof o!=='function')continue;const r=__c[n]={n:0,ms:0,depth:0};
  globalThis[n]=function(){r.n++;const t=performance.now();r.depth++;try{return o.apply(this,arguments);}finally{r.depth--;if(!r.depth)r.ms+=performance.now()-t;}};}`);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const per=[],trace=[],WARM=+(process.env.WARM||0);
for(let w=0;w<WARM;w++)h.run('__step()');   // ısınma ayları ölçüme girmez (aynı kayıttan iki kol da aynı)
for(let m=0;m<+months;m++){const t=performance.now();h.run('__step()');per.push(performance.now()-t);if(TRACE)trace.push(sha(h.run('serialize()')).slice(0,16)+':'+h.run('RND_STATE'));}
const s=[...per].sort((a,b)=>a-b),q=p=>+s[Math.min(s.length-1,Math.floor(p*s.length))].toFixed(1);
const out={label,root:path.basename(path.resolve(root)),save:path.basename(save),months:+months,node:process.version,
  msPerMonth:{mean:+(per.reduce((a,b)=>a+b,0)/per.length).toFixed(1),median:q(.5),p95:q(.95),all:per.map(x=>+x.toFixed(1))},
  counts:COUNT?JSON.parse(h.run('JSON.stringify(Object.fromEntries(Object.entries(__c).map(([k,v])=>[k,{n:v.n,ms:+v.ms.toFixed(1)}])))')):null,
  final:{day:+h.run('G.day'),save8:sha(h.run('serialize()')),rng:h.run('String(RND_STATE)')},trace:TRACE?trace:undefined,heapMB:Math.round(process.memoryUsage().heapUsed/1048576)};
process.stdout.write(JSON.stringify(out)+'\n');
