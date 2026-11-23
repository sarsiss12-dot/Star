// node perf-abba.cjs <kökA> <kökB> <kayıt...>   (N=örnek / kol, varsayılan 24)
// TİCARET-TESLİM-DEĞERİ.0 Faz A: aynı Node sürecinde iki ayrı vm çalışma zamanı; her örnek aynı Save8'den bir ay; ABBA sırası;
// gerçek saat (process.hrtime) hem ay toplamı hem Commerce.aiOpportunityTick / aiTick için. Her örnek sonunda Save8 SHA-256 karşılaştırılır.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [ra,rb,...saves]=process.argv.slice(2);const N=+(process.env.N||24);
const now=()=>Number(process.hrtime.bigint())/1e6;
function arm(root){const h=runtime({root:path.resolve(root)});h.sb.__realNow=now;h.run(`var __T={opp:0,tick:0};
 {const o=Commerce.aiOpportunityTick;Commerce.aiOpportunityTick=function(){const t=__realNow();try{return o.apply(this,arguments);}finally{__T.opp+=__realNow()-t;}};
  const k=Commerce.aiTick;Commerce.aiTick=function(){const t=__realNow();try{return k.apply(this,arguments);}finally{__T.tick+=__realNow()-t;}};}
 var __month=()=>{G.autoSave=false;G.speed=0;const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}};`);return h;}
const q=(xs,p)=>{xs=[...xs].sort((a,b)=>a-b);const i=(xs.length-1)*p,lo=Math.floor(i),hi=Math.min(lo+1,xs.length-1);return xs[lo]+(xs[hi]-xs[lo])*(i-lo);};
const stat=xs=>({n:xs.length,mean:+(xs.reduce((a,b)=>a+b,0)/xs.length).toFixed(2),p50:+q(xs,.5).toFixed(2),p95:+q(xs,.95).toFixed(2),min:+Math.min(...xs).toFixed(2),max:+Math.max(...xs).toFixed(2)});
const out={};
for(const file of saves){const S=fs.readFileSync(file,'utf8');const H=[arm(ra),arm(rb)];for(const h of H)h.sb.S=S;
 const R=[{ms:[],opp:[],tick:[]},{ms:[],opp:[],tick:[]}];const sha=[new Set(),new Set()];
 for(const h of H){h.run('deserialize(S);__month()');}   /* ısınma */
 for(let i=0;i<N;i++)for(const a of (i%2?[1,0,0,1]:[0,1,1,0]).slice(0,2)){const h=H[a];
  h.run('if(!deserialize(S))throw Error("yükleme");__T.opp=0;__T.tick=0;');const t=now();h.run('__month()');const ms=now()-t;
  const c=JSON.parse(h.run('JSON.stringify(__T)'));R[a].ms.push(ms);R[a].opp.push(c.opp);R[a].tick.push(c.tick);
  if(i<2)sha[a].add(crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16));}
 const row={A:{ms:stat(R[0].ms),opp:stat(R[0].opp),tick:stat(R[0].tick)},B:{ms:stat(R[1].ms),opp:stat(R[1].opp),tick:stat(R[1].tick)},sha:[[...sha[0]],[...sha[1]]]};
 row.d={p50:+((row.B.ms.p50/row.A.ms.p50-1)*100).toFixed(2),p95:+((row.B.ms.p95/row.A.ms.p95-1)*100).toFixed(2),mean:+((row.B.ms.mean/row.A.ms.mean-1)*100).toFixed(2),
  oppMean:+(row.B.opp.mean-row.A.opp.mean).toFixed(3),tickMean:+(row.B.tick.mean-row.A.tick.mean).toFixed(3)};
 out[path.basename(file)]=row;console.log(path.basename(file),JSON.stringify({d:row.d,A:row.A.ms,B:row.B.ms,oppA:row.A.opp.mean,oppB:row.B.opp.mean,sha:row.sha}));}
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,1));
