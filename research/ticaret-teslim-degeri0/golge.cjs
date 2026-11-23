// node golge.cjs <kök> <tohum> <ay> <çıkış.json>   [CAMP_SIZE=ulu CAMP_AI=9, NOCLONE=1 → yalnız sayaç / dünya eşitliği denetimi]
// TİCARET-TESLİM-DEĞERİ.0 Faz B/E: salt okunur gölge ekonomik değerleme. Her ay sonunda her AI × kaynak için kıtlık sınıfı
// (acil: stok < taban ve net < 0; yaklaşan: net < 0 ve tabana ≤ 180 gün; uzun: net < 0, > 180 gün; güvenli; fazla: ihraç ≥ 1).
// Yeni risk döneminin ilk ayında: (1) yerli üretim seçeneği (buildingOrderCost + aiBuildingDelta > 0), (2) her ortak için ithalat yolu
// (temas → pairGate → ortağın ihracı → aiPorts → aiTerms (kaynak r ithalatı mı) → dealQuote → ilk varış günü b → e rotası),
// (3) gerçek karar: sonraki 90 gün içinde r ithalatı imzalandı mı, r üretim binası kuyruğa girdi mi. Dünyaya / RNG'ye yazmaz.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const NOCLONE=process.env.NOCLONE==='1';const h=runtime({root:path.resolve(root)});
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:'${process.env.CAMP_SIZE||'ulu'}',aiCount:${+(process.env.CAMP_AI||9)}});setupGame({...CFG});G.autoSave=false;var NOCLONE=${NOCLONE};
var GD={riskMonths:{},cls:{},events:[],imports:[],builds:[],spell:{},starve:[]};
var __nt=AIDiagnostics.note;AIDiagnostics.note=function(c,a,b){if(c==='trade-route-budget'&&a)GD.starve.push([Math.floor(G.day),a.id,b?b.id:-1]);return __nt.apply(this,arguments);};const BASE={ene:80,min:60,yiy:40,ala:60,tuk:40},PROD={ene:'santral',min:'maden',yiy:'ciftlik',ala:'dokum',tuk:'fabrika'};
function inc(o,k){o[k]=(o[k]||0)+1;}
var __ex=executeDeal;executeDeal=function(o){const r=__ex.apply(this,arguments);if(r)for(const [side,list] of [['give',o.give||[]],['want',o.want||[]]])for(const i of list)if(i.t==='freight'||i.t==='cargo'){
  const to=side==='give'?o.to:o.from;GD.imports.push({d:Math.floor(G.day),to,from:side==='give'?o.from:o.to,r:i.r,v:i.v});}return r;};
var __qb=queueBuilding;queueBuilding=function(e,s,p,k){const r=__qb.apply(this,arguments);if(r&&Object.values(PROD).includes(k))GD.builds.push({d:Math.floor(G.day),e:e.id,k});return r;};
function evalImport(e,b,r,A){const C=Commerce;
  if(!e.contact[b.id]||!b.contact[e.id])return {c:'noContact'};
  const gate=C.pairGate(e,b);if(gate)return {c:gate==='Genel ticaret anlaşması yok'?'noPact':'blocked',why:gate};
  const B=C.aiBalance(b);if(!(B[r].export>=1))return {c:'noExport'};
  if(!tradeHubs(e).length||!tradeHubs(b).length)return {c:'noPort'};
  const ports=C.aiPorts(e,b,{routes:96});if(!ports)return {c:'noRoute'};
  const terms=C.aiTerms(e,b,A,B,ports);if(!terms)return {c:'noTerms',scan:{...C._aiTermsScan}};
  if(terms.want[0].r!==r)return {c:'termsOther',r2:terms.want[0].r};
  const q=dealQuote(terms);if(!q.ok)return {c:'quoteFail',why:q.reasons[0]};
  const back=C.route(b,e,ports.target,ports.source,{volume:terms.want[0].v});if(!back)return {c:'quoteFail',why:'dönüş'};
  const days=C.prepareDays+back.slice(1).reduce((n,id,i)=>n+Math.max(1,dist(G.sys[back[i]],G.sys[id])/C.speed),0);
  return {c:'ok',eta:Math.round(days),v:terms.want[0].v,every:terms.want[0].every,give:terms.give[0].r+':'+terms.give[0].v,partner:b.id,yan:aiRespond(b,terms).v};}
const RANK=['noContact','blocked','noPact','noExport','noPort','noRoute','noTerms','termsOther','quoteFail','late','ok'];
var __audit=()=>{const C=Commerce;for(const e of G.emps){if(!e.ai||e.dead||e.wild||e.crisisSide)continue;const A=C.aiBalance(e);
  for(const r of C.resources){const row=A[r],base=BASE[r];let cls;const eff=row.net+row.incoming;const days=eff<0?Math.round((row.stock-base)/(-eff)*30):Infinity;
   cls=row.export>=1?'fazla':eff<0&&row.stock<base?'acil':eff<0&&days<=180?'yaklasan':eff<0?'uzun':'guvenli';inc(GD.cls,r+':'+cls);
   const key=e.id+':'+r,risk=cls==='acil'||cls==='yaklasan';
   if(risk)inc(GD.riskMonths,r);
   if(risk&&!GD.spell[key]&&!NOCLONE){GD.spell[key]=true;
    let dom=null;for(const c of e.colonies){const s=G.sys[c.s],p=s?.planets[c.p];if(!p?.col)continue;const k=PROD[r];if(!buildingOrderCost(e,p,k))continue;const dlt=aiBuildingDelta(e,s,p,k)[r]||0;if(dlt>0&&(!dom||dlt>dom.d))dom={d:+dlt.toFixed(2),busy:!!p.col.q?.length};}
    let best={c:'noContact'},opts=[];
    for(const b of G.emps){if(b===e||!b.ai||b.dead||b.wild||b.crisisSide)continue;let x;try{x=evalImport(e,b,r,A);}catch(err){x={c:'err',why:String(err).slice(0,80)};}
     if(x.c==='ok'&&days!==Infinity&&x.eta>Math.max(0,days))x.c='late';opts.push(x.c);if(RANK.indexOf(x.c)>RANK.indexOf(best.c))best=x;}
    GD.events.push({ownPort:tradeHubs(e).length,d:Math.floor(G.day),e:e.id,r,cls,stock:Math.round(row.stock),net:+row.net.toFixed(2),daysToBase:days===Infinity?null:days,incoming:+row.incoming.toFixed(2),dom,best,opts});}
   if(!risk)delete GD.spell[key];}}};
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}__audit();};`);
for(let m=1;m<=+months;m++){if(h.run('G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide).length')<2)break;h.run('__m()');}
const r=JSON.parse(h.run('JSON.stringify(GD)'));r.save=crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16);r.rng=h.run('RND_STATE');r.day=+h.run('Math.floor(G.day)');
/* gerçek karar: olaydan sonraki 90 günde r ithalatı / r üretim binası */
for(const ev of r.events){ev.starved=r.starve.filter(x=>x[1]===ev.e&&x[0]>=ev.d&&x[0]<=ev.d+90).length;ev.imported=r.imports.some(x=>x.to===ev.e&&x.r===ev.r&&x.d>=ev.d&&x.d<=ev.d+90);ev.built=r.builds.some(x=>x.e===ev.e&&x.k===({ene:'santral',min:'maden',yiy:'ciftlik',ala:'dokum',tuk:'fabrika'})[ev.r]&&x.d>=ev.d&&x.d<=ev.d+90);}
const sum={byBest:{},byRes:{},inTime:[]};for(const ev of r.events){sum.byBest[ev.best.c]=(sum.byBest[ev.best.c]||0)+1;const k=ev.r+':'+ev.best.c;sum.byRes[k]=(sum.byRes[k]||0)+1;
 if(ev.best.c==='ok')sum.inTime.push({starved:ev.starved,d:ev.d,e:ev.e,r:ev.r,cls:ev.cls,stock:ev.stock,net:ev.net,daysToBase:ev.daysToBase,eta:ev.best.eta,v:ev.best.v,partner:ev.best.partner,yan:ev.best.yan,give:ev.best.give,dom:ev.dom,imported:ev.imported,built:ev.built});}
sum.starveTotal=r.starve.length;sum.noOwnPort=r.events.filter(e=>!e.ownPort).length;r.sum=sum;delete r.spell;delete r.starve;fs.writeFileSync(out,JSON.stringify(r));
console.log(seed,NOCLONE?'NOCLONE':'',JSON.stringify({save:r.save,rng:r.rng,day:r.day,riskMonths:r.riskMonths,events:r.events.length,byBest:sum.byBest,inTime:sum.inTime.length}));
