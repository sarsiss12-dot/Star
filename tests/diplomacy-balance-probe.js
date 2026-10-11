'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {performance}=require('perf_hooks');
const {runtime}=require('./helpers/runtime');
function scenario({root=path.resolve(__dirname,'..'),seed=11,months=360,contact=true,instrument=true}={}){
 const h=runtime({root});h.sb.seed=seed;h.sb.linkContacts=contact;h.sb.__now=()=>performance.now();
 h.run(`setupGame({name:'86F ölçümü',race:'insan',traits:[],size:'buyuk',shape:'sarmal',diff:'normal',seed,
 ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
 View.init();G.speed=0;G.sandbox=true;
 var fixtureRng=RND_STATE,fixtureContactsBefore=0,fixtureContactsAfter=0;
 var ids=G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide&&!e.dead).map(e=>e.id);
 for(const a of ids)for(const b of ids)if(b>a&&G.emps[a].contact[b]&&G.emps[b].contact[a])fixtureContactsBefore++;
 if(linkContacts)for(const a of ids)for(const b of ids)if(a!==b)G.emps[a].contact[b]=true;
 for(const a of ids)for(const b of ids)if(b>a&&G.emps[a].contact[b]&&G.emps[b].contact[a])fixtureContactsAfter++;
 var fixtureRngSame=fixtureRng===RND_STATE;
 function relSum(){let s=0;for(const a of ids)for(const b of ids)if(a!==b)s+=(G.emps[a].rel[b]||0);return s;}
 function snapshot(m){
  const living=ids.filter(id=>!G.emps[id].dead),rel=[],counts={war:0,pact:0,ally:0,nap:0,napWhileWar:0};
  for(const a of living)for(const b of living){if(a===b)continue;rel.push(G.emps[a].rel[b]||0);
   if(a<b){const e=G.emps[a];if(e.war[b])counts.war++;if(e.pact&&e.pact[b])counts.pact++;if(e.ally[b])counts.ally++;if(e.nap&&e.nap[b]>G.day){if(e.war[b]||G.emps[b].war[a])counts.napWhileWar++;else counts.nap++;}}}
  rel.sort((a,b)=>a-b);return {month:m,day:G.day,memAge:G.memAge,calendar:[G.year,G.month],living:living.length,pairs:living.length*(living.length-1)/2,
   treaties:counts,relation:{mean:rel.length?rel.reduce((a,b)=>a+b,0)/rel.length:0,min:rel[0],median:rel[Math.floor(rel.length/2)],max:rel.at(-1),belowMinus70:rel.filter(x=>x<=-70).length,above50:rel.filter(x=>x>=50).length},total:relSum()};
 }
 var records=[],totals={},byTreaty={},pairCounts={},samples={},initial=snapshot(0),timeline=[initial],month=0;
 var attr={},frames=[],metrics={calls:0,exec:0,execFail:0,execMs:0,maxTurns:0,playerOffers:0,invalidStates:[],situationTicks:0};
 var offerContext=null;
 `);
 if(instrument)h.run(`
 const originalRespond=aiRespond;
 aiRespond=function(ai,off){const r=originalRespond(ai,off);if(offerContext)offerContext.response={v:r.v,net:r.ev&&r.ev.net,cost:r.ev&&r.ev.cost,gain:r.ev&&r.ev.gain,why:r.why};return r;};
 const originalNeg=aiNegotiate;
 aiNegotiate=function(p,t,g,w){
  const rec={month,from:p.id,to:t.id,give:JSON.parse(JSON.stringify(g)),want:JSON.parse(JSON.stringify(w)),rel:p.rel[t.id],otherRel:t.rel[p.id]};
  const previous=offerContext;offerContext=rec;let r;try{r=originalNeg(p,t,g,w);}finally{offerContext=previous;}
  rec.result=JSON.parse(JSON.stringify(r));records.push(rec);metrics.calls++;metrics.maxTurns=Math.max(metrics.maxTurns,r.tur);
  totals[r.karar]=(totals[r.karar]||0)+1;
  const kind=(g.find(it=>['pact','ally','nap'].includes(it.t))||g[0]||{}).t||'other';
  const bucket=byTreaty[kind]||(byTreaty[kind]={calls:0,exec:0,decisions:{}});bucket.calls++;if(r.uygulandi)bucket.exec++;
  bucket.decisions[r.karar]=(bucket.decisions[r.karar]||0)+1;
  const key=p.id+'>'+t.id+':'+kind;pairCounts[key]=(pairCounts[key]||0)+1;
  const sk=kind+':'+r.karar;if(!samples[sk])samples[sk]=[];if(samples[sk].length<3)samples[sk].push(rec);
  return r;
 };
 const originalExec=executeDeal;
 executeDeal=function(off){const started=__now();const r=originalExec(off);if(offerContext){metrics.execMs+=__now()-started;if(r)metrics.exec++;else metrics.execFail++;}return r;};
 const originalOffer=UI.aiOffer;UI.aiOffer=function(...a){metrics.playerOffers++;return originalOffer.apply(this,a);};
 const originalSituation=situationsTick;situationsTick=function(...a){metrics.situationTicks++;return originalSituation(...a);};
 for(const key of ['monthTick','envoyTick','diploTick','memTick','borderFriction','polarizeTick','hegemonyTick','aiReviewAlliances','aiWarReview','aiTurn','aiNegotiate','declareWar','makePeace','executeDeal','spyTick','whisperTick','facTick','tradeFlowTick']){
  const fn=globalThis[key];if(typeof fn!=='function')continue;
  globalThis[key]=function(...a){const f={before:relSum(),children:0};frames.push(f);try{return fn.apply(this,a);}finally{
   const delta=relSum()-f.before;frames.pop();attr[key]=(attr[key]||0)+delta-f.children;if(frames.length)frames.at(-1).children+=delta;
  }};
 }
 `);
 const start=performance.now();
 for(let m=1;m<=months;m++){
  h.sb.__month=m;h.run(`month=__month;G.day+=30;monthTick();
   if(month%30===0||month===${months})timeline.push(snapshot(month));
   for(const e of G.emps)if(!e.dead&&!e.wild&&!e.crisisSide){for(const [k,v]of Object.entries(e.res||{}))if(typeof v==='number'&&(!Number.isFinite(v)||v<0))metrics.invalidStates.push({month,id:e.id,k,v});}
  `);
  // No frame/dailyTick: this is explicitly a MONTHLY diplomacy fixture, not an exploration/combat campaign.
  h.timers.clear();h.raf.clear();
 }
 const elapsed=performance.now()-start;
 const result=h.run(`({seed,months:month,contact:linkContacts,initial,timeline,final:snapshot(month),totals,byTreaty,pairCounts,samples,attribution:attr,metrics,
 fixture:{rngUnchanged:fixtureRngSame,before:fixtureContactsBefore,after:fixtureContactsAfter},rng:RND_STATE,records})`);
 result.timing={totalMs:elapsed,msPerMonth:elapsed/months};
 result.sourceSha=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'ai.js'))).digest('hex');
 result.behaviorSha=crypto.createHash('sha256').update(h.run('JSON.stringify({emps:G.emps,sys:G.sys,fleets:G.fleets,day:G.day,month:G.month,year:G.year,memAge:G.memAge,rng:RND_STATE})')).digest('hex');
 return result;
}
if(require.main===module){
 const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),out=process.argv[3];
 const results=[11,99,404].map(seed=>{const r=scenario({root,seed});console.error(seed,JSON.stringify({totals:r.totals,byTreaty:r.byTreaty,final:r.final,attr:r.attribution,metrics:r.metrics}));return r;});
 const data={method:'monthly-only; AI-AI contacts only; no manual memAge; sandbox; no daily exploration/combat; directed AI-AI relations',results};
 if(out)fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');else console.log(JSON.stringify(data,null,2));
}
module.exports={scenario};
