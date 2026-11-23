// node funnel2.cjs <kök> <tohum> <ay> <çıkış.json> [NOCLONE=1]
// TİCARET-AI.0 Faz A: doğal kampanya ticaret AI karar hunisi, ikinci katman (salt gözlem).
//  - aiTransitRequest çağrısında rota sınıfı: ileri / geri yön hangi izinle açılır (yalnız a izni, a+b izni, hiç)
//  - aiPortInvestment aşama dökümü
//  - kritik kıtlık ölçüsü (AI devlet × kaynak × ay: stok < taban ve aylık net < 0)
// Kopyalar kendi bütçe nesnesiyle, doğrudan Commerce.route (önbelleksiz) ile çalışır. NOCLONE=1 → yalnız sayaçlar (dünya eşitliği denetimi).
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require(require('path').resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const NOCLONE=process.env.NOCLONE==='1';const h=runtime({root:path.resolve(root)});
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:'ulu',aiCount:9});setupGame({...CFG});G.autoSave=false;var NOCLONE=${NOCLONE};
var F={codes:{},T:{calls:0,etk:0,need:0,cool:0,noOwner:0,pairs:0,cls:{},callCls:{},geo:{},hops:{},bEtk:0,bRight:0,bBlocked:0,terms2:0,pairSet:{}},
  P:{calls:0,made:0,st:{}},short:{rm:0,months:0,byRes:{},tuk:0},signed:0,transitDeals:0,month:[]};
var __n=AIDiagnostics.note;AIDiagnostics.note=function(code){F.codes[code]=(F.codes[code]||0)+1;return __n.apply(this,arguments);};
function inc(o,k,n=1){o[k]=(o[k]||0)+n;}
/* Yapısal olanak: bilgi / izin yok sayılır; her limanlı sistem ara durak, savaş sahibi ve çatışma kapalı; ≤3 sıçrama kuralı aynı. d = çıplak hat uzaklığı. */
function geoFeasible(a,b,source,target){const port=id=>G.sys[id].planets.some(p=>p.col?.b?.liman>0);const shut=id=>{const s=G.sys[id];return s.cr>0||s.owner>=0&&(a.war[s.owner]||b.war[s.owner]);};
 let d=99;{const seen=new Map([[source,0]]),q=[source];while(q.length){const x=q.shift();if(x===target){d=seen.get(x);break;}for(const y of G.sys[x].lanes)if(!seen.has(y)){seen.set(y,seen.get(x)+1);q.push(y);}}}
 const seen=new Set([source+':0']),q=[[source,0]];while(q.length){const [x,hp]=q.shift();if(x===target)return {ok:true,d};if(hp>=3)continue;
  for(const y of G.sys[x].lanes){if(shut(y))continue;const nh=y!==target&&port(y)?0:hp+1;const k=y+':'+nh;if(seen.has(k))continue;seen.add(k);q.push([y,nh]);}}
 return {ok:false,d};}
const RANK=['geoNone','geoOnly','needBoth','onePermit','bothPermits'];
var __t=Commerce.aiTransitRequest;Commerce.aiTransitRequest=function(a,b,A,B,budget){const T=F.T;T.calls++;
 if(!NOCLONE)try{(function(){const C=Commerce;
  if(!B||!a.ai||!b.ai)return;if(a.res.etk<80){T.etk++;return;}if(!C.resources.some(r=>A[r].need>0&&B[r].export>=1)){T.need++;return;}
  if(a.aiTalk?.['portTransit:'+b.id]?.until>G.day){T.cool++;return;}
  const owners=G.emps.filter(o=>o!==a&&o!==b&&!o.dead&&!o.wild&&!o.crisisSide&&a.contact[o.id]&&!C.portRight(o,a)&&!a.war[o.id]&&!diploBlocked(a,o)&&!tradeBlocked(a,o)&&tradeHubs(o).some(id=>C.identifiedPort(a,G.sys[id],o)));
  if(!owners.length){T.noOwner++;return;}
  const all=new Set();for(const o of G.emps)if(o!==a&&o!==b&&!o.dead){all.add(o.id+':'+a.id);all.add(o.id+':'+b.id);}
  let best=-1;
  for(const source of tradeHubs(a))for(const target of tradeHubs(b)){if(!C.identifiedPort(a,G.sys[target],b))continue;T.pairs++;
   const rev0=C.route(b,a,target,source,{avoidObserved:true});
   let c=0;
   if(C.route(a,b,source,target,{grants:all})&&C.route(b,a,target,source,{grants:all}))c=1;
   for(const o of owners){const ga=new Set([o.id+':'+a.id]),gb=new Set([o.id+':'+b.id]),gab=new Set([...ga,...gb]);
    const fA=C.route(a,b,source,target,{grants:ga,avoidObserved:true});if(!fA)continue;
    if(rev0){c=Math.max(c,3);continue;}
    const rB=C.route(b,a,target,source,{grants:gb,avoidObserved:true});
    if(!rB){if(C.route(b,a,target,source,{grants:gab,avoidObserved:true}))c=Math.max(c,2);continue;}
    c=Math.max(c,4);
    if(b.res.etk<80)T.bEtk++;if(C.portRight(o,b))T.bRight++;if(!b.contact[o.id]||b.war[o.id]||diploBlocked(b,o)||tradeBlocked(b,o))T.bBlocked++;
    const distance=fA.slice(1).reduce((n,id,i)=>n+dist(G.sys[fA[i]],G.sys[id]),0);
    if(C.aiTerms(a,b,A,B,{source,target,distance}))T.terms2++;
   }
   if(c===0){if(!C.identifiedPort(b,G.sys[source],a))inc(T.geo,'bNoIdSource');else{const g=geoFeasible(a,b,source,target);inc(T.geo,g.ok?'knowledgeOrRisk':'structuralGap');inc(T.hops,String(Math.min(9,g.d)));}}
   inc(T.cls,RANK[c]);best=Math.max(best,c);
   inc(T.pairSet,a.id+'-'+b.id+':'+RANK[c]);
  }
  if(best>=0)inc(T.callCls,RANK[best]);
 })();}catch(e){T.err=String(e.stack||e).slice(0,200);}
 return __t.apply(this,arguments);};
var __p=Commerce.aiPortInvestment;Commerce.aiPortInvestment=function(a,b,A,B,budget){const P=F.P,st=P.st;P.calls++;
 if(!NOCLONE)try{(function(){const C=Commerce;
  if(!B||!a.ai||!b.ai){inc(st,'notAi');return;}
  if(a.crisis||a.shortage){inc(st,'crisisOrShortage');return;}
  if(a.war[b.id]||Object.values(a.war).some(Boolean)){inc(st,'atWar');return;}
  if(!C.resources.some(r=>A[r].net<0&&A[r].need>0&&B[r].export>=1)){inc(st,'noDeficitMatch');return;}
  if(a.colonies.some(c=>G.sys[c.s]?.planets[c.p]?.col?.q?.some(q=>q.key==='liman'))){inc(st,'portQueued');return;}
  const targets=tradeHubs(b).filter(id=>C.identifiedPort(a,G.sys[id],b));if(!targets.length){inc(st,'noKnownTarget');return;}
  let bestStage=0;const S=['col-none','col-ok','fwd','rev','terms','value','sustain'];
  for(const col of a.colonies){const s=G.sys[col.s],p=s.planets[col.p],cost=buildingOrderCost(a,p,'liman');
   if(!cost||p.col.q?.length||C.port(a,s.id))continue;bestStage=Math.max(bestStage,1);
   for(const target of targets){const path=C.route(a,b,s.id,target,{avoidObserved:true});if(!path)continue;bestStage=Math.max(bestStage,2);
    if(!C.route(b,a,target,s.id,{avoidObserved:true}))continue;bestStage=Math.max(bestStage,3);
    const distance=path.slice(1).reduce((n,id,i)=>n+dist(G.sys[path[i]],G.sys[id]),0);const n=C.aiTerms(a,b,A,B,{source:s.id,target,distance});if(!n)continue;bestStage=Math.max(bestStage,4);
    const value=C.aiValue(a,{from:b.id,to:a.id,give:n.want,want:n.give}).net;const price=Object.entries(cost).reduce((sum,[r,v])=>sum+itemValue(a,{t:'res',r,v},b),0);
    if(value<=price){inc(st,'valueLePrice');continue;}bestStage=Math.max(bestStage,5);}
  }
  inc(st,'reach:'+S[bestStage]);
 })();}catch(e){P.err=String(e.stack||e).slice(0,200);}
 const r=__p.apply(this,arguments);if(r)P.made++;return r;};
var __ex=executeDeal;executeDeal=function(o){const r=__ex.apply(this,arguments);if(r){const it=(o.give||[]).concat(o.want||[]);if(it.some(i=>i.t==='freight'))F.signed++;if(it.some(i=>i.t==='portTransit'))F.transitDeals++;}return r;};
const BASE={ene:80,min:60,yiy:40,ala:60,tuk:40};
function shortTick(){F.short.months++;for(const e of G.emps){if(!e.ai||e.dead||e.wild||e.crisisSide)continue;if(e.shortage)F.short.tuk++;
  for(const r of Object.keys(BASE))if((e.res[r]||0)<BASE[r]&&(e.inc?.[r]||0)<0){F.short.rm++;inc(F.short.byRes,r);}}}
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}shortTick();};`);
const t0=Date.now();for(let m=1;m<=+months;m++){h.run('__m()');if(m%12===0)h.run(`F.month.push({m:${m},contracts:(G.commerce?.contracts||[]).filter(c=>!Commerce.closed(c)).length,ports:G.emps.filter(e=>e.ai&&!e.dead).reduce((n,e)=>n+tradeHubs(e).length,0),short:F.short.rm})`);}
const r=JSON.parse(h.run('JSON.stringify(F)'));r.sec=Math.round((Date.now()-t0)/1000);
r.save=crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16);r.rng=h.run('RND_STATE');
const ps={};for(const [k,v] of Object.entries(r.T.pairSet)){const [pair,c]=k.split(':');(ps[c]||=new Set()).add(pair);}r.T.distinctPairs=Object.fromEntries(Object.entries(ps).map(([c,s])=>[c,s.size]));delete r.T.pairSet;
fs.writeFileSync(out,JSON.stringify(r,null,1));
console.log(seed,NOCLONE?'NOCLONE':'',JSON.stringify({T:r.T,P:r.P,short:r.short,signed:r.signed,transitDeals:r.transitDeals,save:r.save,rng:r.rng,sec:r.sec}));
