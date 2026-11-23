// node funnel3.cjs <kök> <tohum> <ay> <çıkış.json>   [NOCLONE=1]
// TİCARET-AI.1 Faz A: aiPortInvestment çağrılarında "ekonomik çekirdek" (bir koloniye liman yapılırsa iki yönlü rota + aiTerms + değer > bedel)
// kapılardan BAĞIMSIZ değerlendirilir; çekirdek doğruysa hangi kapıların engellediği sayılır. Salt gözlem (kendi bütçesi, önbelleksiz route).
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const NOCLONE=process.env.NOCLONE==='1';const h=runtime({root:path.resolve(root)});
h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});setupGame({...CFG});G.autoSave=false;var NOCLONE=${NOCLONE};
var F={calls:0,made:0,core:0,coreNeedOnly:0,block:{},opp:{},reason:{},valueRatio:[]};function inc(o,k){o[k]=(o[k]||0)+1;}
function mirror(a,b,A,B){const C=Commerce;if(!C.resources.some(r=>A[r].need>0&&B[r].export>=1))return 'noNeedMatch';
 const targets=tradeHubs(b).filter(id=>C.identifiedPort(a,G.sys[id],b));if(!targets.length)return 'noKnownTarget';let best=null,tried=0,route=0;
 for(const col of a.colonies){const s=G.sys[col.s],p=s.planets[col.p];if(C.port(a,s.id))continue;const cost=buildingOrderCost(a,p,'liman');if(!cost)continue;tried++;
  for(const target of targets){const path=C.route(a,b,s.id,target,{avoidObserved:true});if(!path||!C.route(b,a,target,s.id,{avoidObserved:true}))continue;route++;
   const distance=path.slice(1).reduce((n,id,i)=>n+dist(G.sys[path[i]],G.sys[id]),0);const n=C.aiTerms(a,b,A,B,{source:s.id,target,distance});if(!n)continue;
   const value=C.aiValue(a,{from:b.id,to:a.id,give:n.want,want:n.give}).net,price=Object.entries(cost).reduce((sum,[r,v])=>sum+itemValue(a,{t:'res',r,v},b),0);
   const ratio=Math.round(value/Math.max(1,price)*100)/100;if(!best||ratio>best.ratio)best={d:Math.floor(G.day),a:a.id,b:b.id,s:s.id,ratio};}}
 if(!tried)return 'noAffordableCol';if(!route)return 'noRoute';if(!best)return 'noTerms';(F.rowsB||=[]).push(best);return 'value';}
var __p=Commerce.aiPortInvestment;Commerce.aiPortInvestment=function(a,b,A,B,budget){F.calls++;if(!NOCLONE)try{inc(F.mirror||(F.mirror={}),mirror(b,a,B,A));}catch(e){F.merr=String(e.stack).slice(0,200);}
 if(!NOCLONE)try{(function(){const C=Commerce;if(!B||!a.ai||!b.ai)return;
  const needMatch=C.resources.some(r=>A[r].need>0&&B[r].export>=1),netMatch=C.resources.some(r=>A[r].net<0&&A[r].need>0&&B[r].export>=1);
  if(!needMatch){inc(F.reason,'noNeedMatch');return;}
  const targets=tradeHubs(b).filter(id=>C.identifiedPort(a,G.sys[id],b));if(!targets.length){inc(F.reason,'noKnownTarget');return;}
  let best=null,colBusy=0,colCost=0,colsTried=0,routeOk=0,termsOk=0;
  for(const col of a.colonies){const s=G.sys[col.s],p=s.planets[col.p];if(C.port(a,s.id))continue;
   const cost=buildingOrderCost(a,p,'liman');if(!cost){colCost++;continue;}if(p.col.q?.length){colBusy++;}colsTried++;
   for(const target of targets){const path=C.route(a,b,s.id,target,{avoidObserved:true});if(!path||!C.route(b,a,target,s.id,{avoidObserved:true}))continue;routeOk++;
    const distance=path.slice(1).reduce((n,id,i)=>n+dist(G.sys[path[i]],G.sys[id]),0);const n=C.aiTerms(a,b,A,B,{source:s.id,target,distance});if(!n)continue;termsOk++;
    const value=C.aiValue(a,{from:b.id,to:a.id,give:n.want,want:n.give}).net,price=Object.entries(cost).reduce((sum,[r,v])=>sum+itemValue(a,{t:'res',r,v},b),0);
    if(!best||value-price>best.v-best.p)best={s:s.id,t:target,v:value,p:price,busy:!!p.col.q?.length,hops:path.length-1};}}
  if(!colsTried){inc(F.reason,colCost?'noAffordableCol':'allColsHavePort');return;}
  if(!routeOk){inc(F.reason,'noRouteFromAnyCol');return;}if(!termsOk){inc(F.reason,'noTerms');return;}
  const ratio=Math.round(best.v/Math.max(1,best.p)*100)/100;F.valueRatio.push(ratio);
  const bl=[];if(a.crisis||a.shortage)bl.push('crisisShortage');if(Object.values(a.war).some(Boolean))bl.push('atWar');if(!netMatch)bl.push('netNotNegative');
  if(a.colonies.some(c=>G.sys[c.s]?.planets[c.p]?.col?.q?.some(q=>q.key==='liman')))bl.push('portQueued');if(best.busy)bl.push('bestColBusy');
  const plan=aiEconomyPlan(a);if(plan.critical)bl.push('planCritical');
  const s=G.sys[best.s],p=s.planets.find(pp=>pp.col&&pp.owner===a.id&&a.colonies.some(c=>c.s===s.id&&s.planets[c.p]===pp));if(p&&!aiBuildingSustainable(a,s,p,'liman',plan))bl.push('unsustainable');
  (F.rows||=[]).push({d:Math.floor(G.day),a:a.id,b:b.id,s:best.s,t:best.t,ratio,v:Math.round(best.v),p:Math.round(best.p),hops:best.hops,bl});
  if(best.v<=best.p){inc(F.reason,'valueLePrice');return;}
  F.core++;if(!netMatch)F.coreNeedOnly++;inc(F.opp,a.id+'-'+b.id+'@'+best.s);
  inc(F.block,bl.length?bl.join('+'):'none');
 })();}catch(e){F.err=String(e.stack||e).slice(0,300);}
 const r=__p.apply(this,arguments);if(r)F.made++;return r;};
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}};`);
for(let m=1;m<=+months;m++)h.run('__m()');
const r=JSON.parse(h.run('JSON.stringify(F)'));r.save=crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16);r.rng=h.run('RND_STATE');
r.oppDistinct=Object.keys(r.opp).length;const vr=r.valueRatio.sort((x,y)=>x-y);r.vrQ=[vr[0],vr[Math.floor(vr.length/2)],vr.at(-1)];delete r.valueRatio;
fs.writeFileSync(out,JSON.stringify(r,null,1));console.log(seed,NOCLONE?'NOCLONE':'',JSON.stringify(r).slice(0,900));
