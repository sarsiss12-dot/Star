/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI · ai.js — YAPAY ZEKÂ
   Karar ağacı ve HAFIZA mekanizması (kin/güven kayıtları).
   ═══════════════════════════════════════════════════════════════════ */

/* =====================================================================
   YAPAY ZEKÂ
   ===================================================================== */
/* 96C diagnostics are opt-in, bounded, non-persistent and never read by AI.
   One reason per actor/partner/month; no hidden information is exposed in UI. */
const AIDiagnostics=(()=>{let world=null,month=-1,seen=new Set(),counts={},samples=[];return {
 enabled:false,
 reset(){world=null;month=-1;seen.clear();counts={};samples=[];},
 note(code,e,other,detail){if(!this.enabled)return;if(world!==G.sys){this.reset();world=G.sys;}
  const now=Math.floor(G.day/30);if(now!==month){month=now;seen.clear();}
  const key=[e?.id,other?.id,code].join(':');if(seen.has(key)||seen.size>=1024)return;seen.add(key);
  if(Object.hasOwn(counts,code)||Object.keys(counts).length<128)counts[code]=(counts[code]||0)+1;
  if(samples.length<128)samples.push({day:G.day,actor:e?.id,partner:other?.id,code,detail:String(detail||'').slice(0,240)});
 },
 report(){return JSON.parse(JSON.stringify({counts,samples}));}
};})();

/* 95A — actor knowledge. Persistent observations contain only sensor-visible facts;
   derived graph/cache state stays outside Save v8 and never consumes gameplay RNG. */
const AI_VIEW_CACHE = new WeakMap();
function aiView(e){
  const old=AI_VIEW_CACHE.get(e);
  if(old&&old.day===G.day&&old.intel===e.aiIntel&&old.fleets===G.fleets&&old.count===G.fleets.length)return old;
  const ctx=explorationContext(e),records={};
  for(const [id,r] of Object.entries(e.aiIntel&&e.aiIntel.systems||{}))
    if(G.sys[id]&&r&&Number.isFinite(r.day)&&Number.isInteger(r.owner)&&r.owner>=-1&&G.day-r.day<=3600)
      records[id]={...r};
  for(const id of ctx.visible){const s=G.sys[id];
    records[id]={owner:s.owner,defense:sysDefense(s),colonies:s.planets.filter(p=>p.col).length,
      capital:s.owner>=0&&G.emps[s.owner]&&G.emps[s.owner].home===id,day:G.day};
  }
  const view={day:G.day,intel:e.aiIntel,ctx,systems:records,fleets:G.fleets,count:G.fleets.length};AI_VIEW_CACHE.set(e,view);return view;
}
function aiObserve(e){
  if(!e||e.wild||e.crisisSide)return;
  AI_VIEW_CACHE.delete(e);const v=aiView(e);
  const powers={...(e.aiIntel&&e.aiIntel.powers||{})};
  for(const o of G.emps)if(o!==e&&e.contact[o.id]){
    const observed=G.fleets.filter(f=>f.e===o.id&&v.ctx.visible.has(f.mv?f.mv.to:f.sys)).reduce((n,f)=>n+fleetPower(f),0);
    if(observed>0)powers[o.id]={value:observed,day:G.day};
  }
  e.aiIntel={v:1,systems:v.systems,powers};v.intel=e.aiIntel;
}
function aiKnownSystem(e,s){return s&&aiView(e).systems[s.id]||null;}
function aiKnownSystems(e,owner){
  const v=aiView(e);return G.sys.filter(s=>v.systems[s.id]&&(owner===undefined||v.systems[s.id].owner===owner));
}
function aiKnownPower(e,o){return o===e?totalPower(e):shownPower(e,o).v;}
function aiKnownTechs(e,o,offered=[]){
  if(o===e||intelOf(e,o.id)>=2)return o.techs||{};
  return Object.fromEntries(offered.filter(t=>t.t==='tech'&&TECHS[t.id]).map(t=>[t.id,true]));
}
function aiKnownResources(e,o,offered=[]){
  if(o===e||intelOf(e,o.id)>=3)return o.res||{};
  const known={};for(const t of offered)if(t.t==='res')known[t.r]=(known[t.r]||0)+t.v;
  return known;
}
function aiKnownWar(e,a,b){
  if(!a||!b)return false;
  if(a===e)return !!a.war[b.id];if(b===e)return !!e.war[a.id];
  return !!(e.contact[a.id]&&e.contact[b.id]&&(intelOf(e,a.id)>=3||intelOf(e,b.id)>=3)&&a.war[b.id]);
}
function aiObservedThreat(e,id,near=true){
  const v=aiView(e),s=G.sys[id];if(!s)return 0;
  let total=0;
  for(const f of G.fleets){
    if(f.e===e.id||!f.ships.length||!isArmed(f)||!hostile(e.id,f.e))continue;
    const at=f.mv?f.mv.to:f.sys;
    if(!v.ctx.visible.has(at))continue;
    if(at===id)total+=fleetPower(f);else if(near&&s.lanes.includes(at))total+=fleetPower(f)*.5;
  }
  return total;
}
function aiEstimatedDefense(e,s){
  const r=aiKnownSystem(e,s);if(!r)return Infinity;
  const age=Math.max(0,G.day-r.day),uncertainty=1+Math.min(.5,age/720);
  return r.defense*uncertainty+aiObservedThreat(e,s.id,false);
}
/* Route geometry is restricted to the observer's learned graph. The existing
   engine still validates legal access and performs all movement/costs. */
function aiKnownRoute(e,f,from,to,observer=e,warTarget=null,nodeAllowed=null){
  const view=aiView(observer),known=view.ctx.known;
  if(!G.sys[from]||!G.sys[to]||!known.has(from)||!known.has(to))return null;
  const n=G.sys.length,cost=Array(n).fill(Infinity),prev=Array(n).fill(-1),done=new Set();
  const gates=[...known].filter(id=>(observer===e&&G.sys[id].owner===e.id||view.ctx.visible.has(id))&&hasUsableGate(e,G.sys[id]));cost[from]=0;
  for(let k=0;k<known.size;k++){
    let u=-1,best=Infinity;for(const id of known)if(!done.has(id)&&cost[id]<best){u=id;best=cost[id];}
    if(u<0)break;if(u===to)break;done.add(u);
    const edges=gates.includes(u)?[...new Set(G.sys[u].lanes.concat(gates))]:G.sys[u].lanes;
    for(const id of edges){
      if(!known.has(id)||done.has(id)||view.ctx.pirates.has(id)&&id!==to||nodeAllowed&&!nodeAllowed(id,u))continue;
      if(!pathAllowed(e,f,[id],u)&&!(warTarget!==null&&view.systems[id]?.owner===warTarget))continue;
      const jump=gates.includes(u)&&gates.includes(id),speed=Math.max(.001,fleetSpeed({...f,e:observer!==e&&intelOf(observer,e.id)<3?observer.id:f.e,sys:u,mv:null}));
      const value=best+(jump?.1:dist(G.sys[u],G.sys[id]))/speed;
      if(value<cost[id]){cost[id]=value;prev[id]=u;}
    }
  }
  if(!Number.isFinite(cost[to]))return null;
  const path=[];let at=to;while(at!==from&&path.length<n){path.unshift(at);at=prev[at];if(at<0)return null;}
  return at===from?{path,eta:cost[to]}:null;
}
function aiWarAccess(e,o){
  const forces=G.fleets.filter(f=>f.e===e.id&&isArmed(f)&&!f.retreating&&!f.combat&&fleetSupply(e,f)>.55);
  const targets=aiKnownSystems(e,o.id).sort((a,b)=>a.id-b.id).slice(0,6);
  const shown=shownPower(e,o),need=Math.max(80,shown.v*(1+shown.band)*1.15);
  for(const target of targets){
    let power=0;
    for(const f of forces){const route=aiKnownRoute(e,f,f.mv?f.mv.to:f.sys,target.id,e,o.id);
      if(route&&route.eta<=180)power+=fleetPower(f);}
    if(power>=need)return {ok:true,target:target.id,power,need};
  }
  return {ok:false,why:targets.length?'Ulaşabilir kuvvet ve bilgi yetersiz':'Bilinen askerî hedef yok',need};
}
function aiMove(e,f,to){
  const route=aiKnownRoute(e,f,f.mv?f.mv.to:f.sys,to);
  return !!(route&&orderMove(f,to,false,true,route.path));
}
function aiProtection(e,lord){
  if(!e||!lord||e.dead||lord.dead||isVassal(e)||(e.freeUntil||0)>(G.memAge||0)||vassalsOf(e).length||e===lord||!e.contact[lord.id]||e.war[lord.id]||isVassal(lord)||isPurifier(lord)||isPurifier(e))return {ok:false,why:'Siyasi koşullar uygun değil'};
  if((e.rel[lord.id]||0)<-10)return {ok:false,why:'Koruma için güven yetersiz'};
  const to=G.sys[e.home];if(!to)return {ok:false,why:'Korunacak merkez yok'};
  let best=null;
  const probe={e:lord.id,ships:[{c:'kor',h:1}],retreating:false};
  for(const s of aiKnownSystems(e,lord.id)){
    const route=aiKnownRoute(lord,probe,s.id,to.id,e);
    if(route&&(!best||route.eta<best.eta))best=route;
  }
  if(!best)return {ok:false,why:'Bilinen açık askerî yardım rotası yok'};
  if(best.eta>180)return {ok:false,why:'Askerî yardım çok geç ulaşır',eta:best.eta};
  const ratio=aiKnownPower(e,lord)/Math.max(1,totalPower(e));
  return ratio>=1.3?{ok:true,eta:best.eta,ratio,why:'Açık yardım rotası ve yeterli tahmini güç'}:{ok:false,eta:best.eta,why:'Tahmini koruma gücü yetersiz'};
}
/* 96C: six-month planning uses actual stocks/rates and already paid queues.
   Pending gains are estimates, never written to inc/res or promised as delivery. */
function aiConstructionCommitment(e){
 const out={};if(typeof RemoteConstruction==='undefined'||!G.construction)return out;
 for(const tasks of Object.values(G.construction.queues))for(const t of tasks)
  if(t.empire===e.id&&t.state!=='building')for(const [r,v]of Object.entries(structCost(e,t.key)))out[r]=(out[r]||0)+v;
 return out;
}
function aiBuildingDelta(e,sys,pl,key,queued=false,direction=1){
 const b={...pl.col.b};if(queued)for(const q of pl.col.q||[])if(BUILDINGS[q.key])b[q.key]=Math.max(0,(b[q.key]||0)+(q.dem?-1:1));
 if(key)b[key]=Math.max(0,(b[key]||0)+direction);
 const old=colonyOutput(e,sys,pl),next=colonyOutput(e,sys,{...pl,col:{...pl.col,b}}),delta={};
 const oldUp=Object.entries(pl.col.b).reduce((n,[k,v])=>n+(BUILDINGS[k]?.up||0)*v,0),newUp=Object.entries(b).reduce((n,[k,v])=>n+(BUILDINGS[k]?.up||0)*v,0);
 for(const r of ['ene','min','yiy','ala','tuk','ara','etk']){
  const mod=r==='tuk'?(e.mods.minMul||0)*.5:e.mods[r+'Mul']||0;
  delta[r]=((next.o[r]||0)-(old.o[r]||0)-(next.use[r]||0)+(old.use[r]||0))*(1+mod);
 }
 delta.ene=delta.ene*(1+(e.trade?.mul||0)+(e.mods.tradeMul||0))-(newUp-oldUp)*1.6;
 return delta;
}
function aiEconomyPlan(e){
 const projected={...e.inc},committed=aiConstructionCommitment(e),queued={};
 for(const c of e.colonies){const sys=G.sys[c.s],pl=sys?.planets[c.p];if(!pl?.col||pl.owner!==e.id||!pl.col.q?.length)continue;
  const d=aiBuildingDelta(e,sys,pl,null,true);for(const r in d)projected[r]=(projected[r]||0)+d[r];
 }
 const upkeep=Math.max(.1,1+(e.mods.upMul||0)),peace=!Object.values(e.war||{}).some(Boolean);
 for(const sys of G.sys)for(const q of sys.queue||[])if(q.e===e.id&&SHIPS[q.cls]){
  projected.ene=(projected.ene||0)-SHIPS[q.cls].up*upkeep*(hasCivic(e,'mobilize')&&peace?2:1);
  projected.ala=(projected.ala||0)-(SHIPS[q.cls].upA||0)*upkeep;queued[q.cls]=(queued[q.cls]||0)+1;
 }
 if(typeof Commerce!=='undefined'&&G.commerce)for(const c of G.commerce.contracts)if(!Commerce.closed(c))for(const l of c.legs)if(l.e===e.id)projected[l.r]=(projected[l.r]||0)-l.v*30/l.every;
 const bio=RACES[e.race].bio,phys=typeof physioOf==='function'?physioOf(e):null,eatsFood=bio!=='makine'&&bio!=='litoit'&&!['enerji','mineral'].includes(phys?.yiyer);
 const target={ene:12,min:16,yiy:eatsFood?4:0,ala:8,tuk:4,ara:0,etk:0},floor={ene:120,min:120,yiy:eatsFood?60:0,ala:100,tuk:60,ara:0,etk:0},rows={};
 for(const r of Object.keys(target)){
  const stock=Math.max(0,(e.res[r]||0)-(committed[r]||0)),net=Number.isFinite(projected[r])?projected[r]:0,months=net<0?stock/-net:null;
  const urgency=(net<0?30+Math.min(30,-net*6/Math.max(30,stock)*20):target[r]>0?Math.max(0,1-net/target[r])*12:0)+(stock<floor[r]?8*(1-stock/Math.max(1,floor[r])):0);
  rows[r]={stock,net,months,urgency,reserve:floor[r]+Math.max(0,-net)*6};
 }
 const atWar=Object.keys(e.war||{}).some(id=>e.war[id]&&G.emps[id]&&!G.emps[id].dead&&!G.emps[id].wild);
 const critical=['ene','min','yiy','tuk'].some(r=>rows[r].net<0&&rows[r].months<6);
 return {horizon:6,rows,committed,queued,policy:critical?'recover':atWar?'war':e.aiCampaign?.phase==='build'?'rebuild':'growth',critical};
}
/* A stock-zero input deficit cannot fund even the cheapest producer. Recover
   through the player's existing paid demolition/refund path, never a grant. */
function aiRecoverEconomy(e){
 if(!e.ai||e.id===0||e.dead||e.aiTalk?.['economy-recovery']?.until>G.day)return false;
 const min=e.res.min||0,stuck=min<BUILDINGS.maden.c.min&&((e.inc.min||0)<0||e.crisis==='enerji'&&(e.res.ene||0)<=0);
 if(!stuck)return false;
 const candidates=[];
 for(const c of e.colonies){const sys=G.sys[c.s],pl=sys?.planets[c.p];if(!pl?.col||pl.owner!==e.id||colonyJobs(pl.col)>0)continue;
  for(const [key,n]of Object.entries(pl.col.b)){
   if(!n||['santral','maden','ciftlik','liman','tersane'].includes(key))continue;
   const d=aiBuildingDelta(e,sys,pl,key,false,-1);
   const benefit=((e.inc.min||0)<0?Math.max(0,d.min)*3:0)+(e.crisis==='enerji'?Math.max(0,d.ene)*3:0);
   if(benefit<=0||d.yiy<0&&(e.inc.yiy||0)<0||d.tuk<0&&(e.inc.tuk||0)<0)continue;
   candidates.push({sys,pl,key,score:benefit-Math.max(0,-d.ala)*.4-Math.max(0,-d.ara)*.15});
  }
 }
 candidates.sort((a,b)=>b.score-a.score||a.sys.id-b.sys.id||a.key.localeCompare(b.key));
 const pick=candidates[0];if(!pick||pick.score<=0||!queueDemolish(e,pick.sys,pick.pl,pick.key))return false;
 (e.aiTalk||(e.aiTalk={}))['economy-recovery']={until:G.day+120,reason:'Paid demolition: '+pick.key};
 AIDiagnostics.note('recovery:demolish',e,null,pick.key+'; inputs/upkeep stop only on completion; actual refund only');return true;
}
function aiBuildingSustainable(e,sys,pl,key,plan=aiEconomyPlan(e)){
 const B=BUILDINGS[key];if(!B)return false;
 const delta=aiBuildingDelta(e,sys,pl,key);
 for(const r of ['ene','min','yiy','tuk']){
  if(delta[r]>=0)continue;const row=plan.rows[r],net=row.net+delta[r],cash=row.stock-(B.c[r]||0);
  if(net<0&&cash<-net*6)return false;
 }
 return Object.entries(B.c).every(([r,v])=>(e.res[r]||0)-(plan.committed[r]||0)>=v);
}
function aiEconomicOrder(e,sys,pl,legacy){
 const plan=aiEconomyPlan(e),resourceBuilding={ene:'santral',min:'maden',yiy:'ciftlik',ala:'dokum',tuk:'fabrika'};
 const ranked=Object.keys(resourceBuilding).filter(r=>{const row=plan.rows[r];return row.net<0&&row.months<12||row.stock<Math.max(120,row.reserve)&&row.urgency>12;}).sort((a,b)=>plan.rows[b].urgency-plan.rows[a].urgency||a.localeCompare(b));
 const urgent=ranked.map(r=>resourceBuilding[r]);
 // A first port supplies energy/Etki and enables paid freight without extra upkeep.
 if(!(pl.col.b.liman||0)&&!colonyQueuedOf(pl.col,'liman')&&plan.rows.ene.urgency<30)urgent.splice(Math.min(1,urgent.length),0,'liman');
 return [...new Set(urgent.concat(legacy))].filter(k=>BUILDINGS[k]&&aiBuildingSustainable(e,sys,pl,k,plan));
}
function aiUpdateStrategy(e){
  const needs=['ene','min','yiy','tuk','ala'].filter(k=>(e.inc[k]||0)<(k==='yiy'&&RACES[e.race].bio!=='organik'?-999:0));
  const danger=G.sys.some(s=>s.owner===e.id&&aiObservedThreat(e,s.id,false)>0);
  const war=Object.keys(e.war||{}).some(id=>e.war[id]&&G.emps[id]&&!G.emps[id].dead&&!G.emps[id].wild);
  const goal=needs.length?'recover':danger?'defend':war?'war':aiProfile(e).sci>.75?'science':'economy';
  const old=e.aiStrategy,urgent=goal==='recover'||goal==='defend';
  const changing=!old||G.day>=old.until||urgent&&old.goal!==goal;
  e.aiStrategy={goal:changing?goal:old.goal,since:changing?G.day:old.since,until:changing?G.day+180:old.until,
    needs,reason:needs.length?'Kaynak darboğazı: '+needs.join(','):danger?'Görülen askerî tehdit':war?'Mevcut savaşa hazırlık':'Doktrin ve iç ihtiyaçlar'};
}
/* One empire's bounded campaign: defend first, stage reachable forces, commit
   together. No federation commands, free hulls or per-frame planning. */
function aiMilitaryCampaign(e,armed,my,wars){
  const free=armed.filter(f=>!jointReserved(f)&&!f.guardLocked&&!guardLocked(f)&&!f.retreating&&G.sys[f.mv?f.mv.to:f.sys]),used=new Set();
  const threatened=my.map(s=>({s,t:aiObservedThreat(e,s.id,false)})).filter(x=>x.t>0)
    .sort((a,b)=>(b.t+(b.s.id===e.home?600:0))-(a.t+(a.s.id===e.home?600:0))||a.s.id-b.s.id);
  for(const {s,t}of threatened){
    let power=G.fleets.filter(f=>f.e===e.id&&f.sys===s.id&&!f.mv&&isArmed(f)).reduce((n,f)=>n+fleetPower(f),0);
    for(const f of free.filter(f=>f.sys===s.id&&!f.mv))used.add(f.id);
    const candidates=free.filter(f=>!used.has(f.id)&&!f.mv&&!f.path.length).map(f=>({f,r:aiKnownRoute(e,f,f.sys,s.id)})).filter(x=>x.r&&x.r.eta<=180).sort((a,b)=>a.r.eta-b.r.eta||a.f.id-b.f.id);
    for(const {f}of candidates){if(power>=t*1.15)break;if(aiMove(e,f,s.id)){used.add(f.id);power+=fleetPower(f);}}
  }
  if((G.jointOps?.plans||[]).some(p=>jointActive(p)&&p.members.includes(e.id)))return;
  const force=free.filter(f=>!used.has(f.id)&&!f.combat&&fleetSupply(e,f)>.55);
  if(!force.length)return;
  const known=aiKnownSystems(e).filter(s=>wars.some(o=>aiKnownSystem(e,s).owner===o.id));
  if(!known.length){e.aiCampaign={phase:'recon',reason:'Keşfedilmiş düşman konumu yok',until:G.day+30};return;}
  const old=e.aiCampaign;
  let target=old&&old.until>G.day&&known.find(s=>s.id===old.target);
  if(!target){
    const origin=G.sys[force[0].mv?force[0].mv.to:force[0].sys];
    const ranked=known.map(s=>({s,v:(aiKnownSystem(e,s).colonies||0)*400+(aiKnownSystem(e,s).capital?600:0)-dist(origin,s)})).sort((a,b)=>b.v-a.v||a.s.id-b.s.id).slice(0,6);
    target=ranked.find(({s})=>force.some(f=>{const p=aiKnownRoute(e,f,f.mv?f.mv.to:f.sys,s.id);return p&&p.eta<360&&fleetSupply(e,{sys:s.id,ships:f.ships,e:e.id})>.4;}))?.s;
  }
  if(!target){e.aiCampaign={phase:'supply',reason:'Bilinen hedefe ikmalli askerî rota yok',until:G.day+30};return;}
  const rally=my.filter(s=>isSupplyNode(e,s)).sort((a,b)=>dist(a,target)-dist(b,target)||a.id-b.id)[0]||my[0];
  if(!rally)return;
  const need=Math.max(80,aiEstimatedDefense(e,target)*1.25);
  const ready=force.filter(f=>!f.mv&&!f.path.length&&f.sys===rally.id);
  let reachable=0;for(const f of force){const p=aiKnownRoute(e,f,f.mv?f.mv.to:f.sys,rally.id);if(p&&p.eta+(f.mv?(1-f.mv.t)*dist(G.sys[f.mv.from],G.sys[f.mv.to])/Math.max(.001,fleetSpeed(f)):0)<=180)reachable+=fleetPower(f);}
  const gathered=ready.reduce((n,f)=>n+fleetPower(f),0);
  e.aiCampaign={target:target.id,rally:rally.id,phase:reachable<need?'build':gathered<need?'gather':'attack',
    since:old&&old.target===target.id?old.since:G.day,until:old&&old.target===target.id&&old.until>G.day?old.until:G.day+180,
    need,power:reachable,reason:reachable<need?'Tahmini savunma için kuvvet yetersiz':gathered<need?'Ulaşabilir filolar toplanıyor':'Kuvvet birlikte taarruz ediyor'};
  if(gathered>=need){for(const f of ready)aiMove(e,f,target.id);}
  for(const f of force){
    if(f.mv||f.path.length||f.sys===rally.id||ready.includes(f))continue;
    aiMove(e,f,rally.id);
  }
}

/* 95C — joint plans reserve existing fleets; all travel remains orderMove /
   stepFleets. Political authority is an ACTIVE ledger front, never membership
   alone. Each owner evaluates its own knowledge and voluntarily shares orders. */
/* Coalition exchanges reuse battleRound per actual owner. Each force has one
   total fire budget, split across legal opponents; no phantom combined empire,
   extra defender volleys or duplicate ledger writes. The ordinary duel path is
   unchanged. Pair-wise reports remain the existing report format. */
function jointBattlePairs(A,B,list){
  const front=warLedgerFind(A,B);if(!front)return null;
  const at=[...new Set(list.filter(f=>f.ships.length).map(f=>f.e))];
  const role=front.roles[front.sides.indexOf(A)];
  const side=(leader,r)=>at.filter(id=>id===leader||jointBinding(G.emps[leader],G.emps[id])&&
    (G.warLedger?.fronts||[]).some(f=>f.campaign===front.campaign&&f.ended===null&&warLedgerPair(...f.sides)&&f.sides.includes(id)&&f.roles[f.sides.indexOf(id)]===r));
  const aa=side(A,role),bb=side(B,1-role);
  if(!aa.includes(A))aa.unshift(A);if(!bb.includes(B))bb.unshift(B);
  if(aa.length===1&&bb.length===1)return null;
  // Partial co-belligerence is not a license to fire on a neutral third party.
  const pairs=[];
  const power=id=>Math.max(1,list.filter(f=>f.e===id).reduce((n,f)=>n+sideStats(G.emps[id],[f],null,1).hull,0)+(G.sys[list[0]?.sys]?.owner===id?sysDefense(G.sys[list[0].sys]):0));
  const weights=Object.fromEntries([...aa,...bb].map(id=>[id,power(id)]));
  for(const a of aa)for(const b of bb)if(hostile(a,b)){
    const targetA=aa.filter(id=>hostile(id,b)).reduce((n,id)=>n+weights[id],0),targetB=bb.filter(id=>hostile(a,id)).reduce((n,id)=>n+weights[id],0);
    pairs.push({a,b,fireA:weights[b]/targetB,fireB:weights[a]/targetA});
  }
  return pairs.length>1?pairs:null;
}

function jointEmpty(){return {v:1,next:1,nextCheck:0,nextAuto:0,plans:[],cooldowns:{}};}
function jointActive(p){return p&&!['done','cancelled'].includes(p.state);}
function jointBinding(a,b){
  if(!a||!b||a.dead||b.dead||a.war[b.id]||b.war[a.id])return null;
  if(a===b)return {kind:'self'};
  const f=findFed(a);
  if(f&&f===findFed(b))return {kind:'fed',id:f.id};
  if(a.ally[b.id]&&b.ally[a.id])return {kind:'ally'};
  if(a.overlord===b.id||b.overlord===a.id||a.overlord!==null&&a.overlord!==undefined&&a.overlord===b.overlord)return {kind:'vassal'};
  for(const [giver,taker]of [[a,b],[b,a]])for(const [enemy,sponsor]of Object.entries(giver.proxyWar||{})){
    if(sponsor!==taker.id||!warLedgerPair(giver.id,+enemy)||!warLedgerPair(taker.id,+enemy))continue;
    const f=warLedgerFind(giver.id,+enemy),root=warLedgerFind(taker.id,+enemy);
    if(f&&root&&f.campaign===root.campaign)return {kind:'promise',enemy:+enemy,campaign:f.campaign};
  }
  return null;
}
function jointBound(p,id){
  const a=G.emps[p.sponsor],b=G.emps[id],old=p.bindings[id],now=jointBinding(a,b);
  return !!(old&&now&&old.kind===now.kind&&(old.kind!=='fed'||old.id===now.id)&&(old.kind!=='promise'||old.enemy===now.enemy&&old.campaign===now.campaign));
}
function jointFront(campaign,role,id,enemy){
  return (G.warLedger?.fronts||[]).find(f=>f.campaign===campaign&&f.ended===null&&warLedgerPair(...f.sides)&&
    f.sides.includes(id)&&f.sides.includes(enemy)&&f.roles[f.sides.indexOf(id)]===role);
}
function jointContext(campaign,role,sponsor,enemy){
  const e=G.emps[sponsor];
  if(!e||e.dead||!jointFront(campaign,role,sponsor,enemy))return null;
  const members=[...new Set((G.warLedger?.fronts||[]).filter(f=>f.campaign===campaign&&f.ended===null&&warLedgerPair(...f.sides))
    .flatMap(f=>f.sides.filter((id,i)=>f.roles[i]===role)))].filter(id=>jointFront(campaign,role,id,enemy)&&jointBinding(e,G.emps[id])).sort((a,b)=>a-b);
  return members.length>1?{campaign,role,sponsor,enemy,members}:null;
}
function jointReserved(f){return !!f&&Number.isSafeInteger(f.jointPlan);}
function jointAt(f){return f.mv?f.mv.to:f.sys;}
function jointRemainder(f){return f.mv?(1-f.mv.t)*(f.mv.gate?.1:dist(G.sys[f.mv.from],G.sys[f.mv.to]))/Math.max(.001,fleetSpeed(f)):0;}
function jointRoute(e,f,to,cache){
  const from=jointAt(f),key=f.id+':'+from+':'+to;
  if(cache.has(key))return cache.get(key);
  const r=aiKnownRoute(e,f,from,to,e,null,id=>id===to||!hostile(e.id,aiKnownSystem(e,G.sys[id])?.owner));
  const value=r?{path:r.path,eta:r.eta+jointRemainder(f)}:null;cache.set(key,value);return value;
}
function jointStop(f){
  f.path=f.mv?[f.mv.to]:[];delete f.jointHoldUntil;delete f.jointPlan;
}
function jointRelease(p,id){
  for(const f of G.fleets)if(f.jointPlan===p.id&&(id===undefined||f.e===id))jointStop(f);
  if(id!==undefined)p.fleets=p.fleets.filter(x=>x.owner!==id);
}
function jointClose(p,state,reason){
  if(!jointActive(p))return;
  jointRelease(p);p.state=state;p.reason=reason;p.ended=G.day;
  const key=p.campaign+':'+p.role;G.jointOps.cooldowns[key]=G.day+(state==='done'?30:180);
}
function jointCancel(e,id){
  const p=G.jointOps?.plans.find(x=>x.id===id);
  if(!p||e!==G.p||p.requester!==e.id||!jointActive(p))return {ok:false,why:'İptal edilebilir kendi destek talebin yok'};
  jointClose(p,'cancelled','Oyuncu destek talebini iptal etti');return {ok:true};
}
/* Local defence and existing critical orders take priority. No enemy remote
   fleet enumeration: threats use 95A visible observations only. */
function jointAvailable(e,replacing=null){
  const mine=G.fleets.filter(f=>f.e===e.id&&f.ships.length&&isArmed(f));
  const protectedIds=new Set();
  const own=G.sys.filter(s=>s.owner===e.id);
  for(const s of own){
    const critical=s.id===e.home||s.planets.some(p=>p.col&&p.owner===e.id);
    const threat=aiObservedThreat(e,s.id,critical),local=mine.filter(f=>!f.mv&&(f.sys===s.id||threat>0)).sort((a,b)=>dist(G.sys[jointAt(a)],s)-dist(G.sys[jointAt(b)],s)||a.id-b.id);
    let keep=0;const reserve=threat>0?threat*1.25:(s.id===e.home?Math.min(80,local.reduce((n,f)=>n+fleetPower(f),0)*.25):0);
    for(const f of local){if(keep>=reserve)break;if(protectedIds.has(f.id))continue;protectedIds.add(f.id);keep+=fleetPower(f);}
  }
  const usable=mine.filter(f=>!protectedIds.has(f.id)&&(!jointReserved(f)||!!replacing&&f.jointPlan===replacing.id)&&!f.combat&&!f.retreating&&!hasShipment(f)&&
    !f.guardLocked&&!guardLocked(f)&&!f.building&&!f.ord&&(!f.mv&&!f.path.length||!!replacing&&f.jointPlan===replacing.id));
  const supplied=usable.filter(f=>fleetSupply(e,f)>.55);
  return {fleets:supplied.slice(0,12),reason:!mine.length?'Yeterli savaş filosu yok':!usable.length?'Kendi stratejik savunması veya kritik filo görevi öncelikli':!supplied.length?'İkmal yetersiz':'Ulaşılabilir uygun kuvvet yok'};
}
function jointTargetOK(e,kind,target,enemy){
  const s=G.sys[target],r=s&&aiKnownSystem(e,s);if(!r)return false;
  return kind==='capture'?r.owner===enemy:kind==='follow'&&r.owner===enemy||r.owner>=0&&(r.owner===e.id||!!jointBinding(e,G.emps[r.owner]));
}
function jointAnchorPower(anchor,target){
  const f=G.fleets.find(f=>f.id===anchor&&f.e===0&&f.ships.length&&isArmed(f)&&!f.retreating);
  if(!f||jointAt(f)!==target&&f.path.at(-1)!==target||fleetSupply(G.p,f)<=.55)return 0;
  const r=aiKnownRoute(G.p,f,jointAt(f),target);
  return r&&r.eta+jointRemainder(f)<=180?fleetPower(f):0;
}
function jointSelect(ctx,kind,target,anchor,cache,replacing=null){
  const responses={},pool=[];
  for(const id of ctx.members){
    const e=G.emps[id];
    if(!e.ai){responses[id]='Oyuncu filoları kendi komutasında';continue;}
    if(!jointTargetOK(e,kind,target,ctx.enemy)){responses[id]='Hedef veya bilinen askerî rota uygun değil';continue;}
    const av=jointAvailable(e,replacing);responses[id]=av.reason;
    for(const f of av.fleets)pool.push(f);
  }
  pool.sort((a,b)=>a.e-b.e||a.id-b.id);
  const force=[];
  for(let slot=0;slot<12&&force.length<24;slot++)for(const id of ctx.members){const f=pool.filter(f=>f.e===id)[slot];if(f&&force.length<24)force.push(f);}
  if(!force.length)return {ok:false,why:Object.values(responses).find(r=>r!=='Oyuncu filoları kendi komutasında')||'Uygun destek kuvveti yok',responses};
  const targetSys=G.sys[target],rallies=new Map();
  if(kind!=='capture')rallies.set(target,targetSys);
  for(const id of ctx.members){const e=G.emps[id];
    const near=aiKnownSystems(e).filter(s=>{const r=aiKnownSystem(e,s);return r.owner>=0&&ctx.members.includes(r.owner)&&isSupplyNode(e,s)&&canEnter(e,s)&&!aiObservedThreat(e,s.id);})
      .sort((a,b)=>dist(a,targetSys)-dist(b,targetSys)||a.id-b.id).slice(0,3);
    for(const s of near)rallies.set(s.id,s);
  }
  const candidates=[...rallies.values()].sort((a,b)=>(a.id===target?-1:b.id===target?1:dist(a,targetSys)-dist(b,targetSys))||a.id-b.id).slice(0,6);
  let best=null;
  for(const rally of candidates){
    const rows=[];let score=0;
    for(const f of force){const e=G.emps[f.e],known=aiKnownSystem(e,rally);
      if(!known||known.owner<0||!ctx.members.includes(known.owner)||!isSupplyNode(e,rally)||!canEnter(e,rally)||aiObservedThreat(e,rally.id)>0)continue;
      const gather=jointRoute(e,f,rally.id,cache),probe={...f,sys:rally.id,mv:null},march=jointRoute(e,probe,target,cache);
      if(!gather||!march||gather.eta>180||march.eta>180||fleetSupply(e,{...probe,sys:target})<=.4)continue;
      rows.push({id:f.id,owner:f.e,gatherEta:gather.eta,eta:march.eta});
      const type=findFed(e)?.type,will=type==='askeri'?1.15:type==='ticaret'?.9:1;
      score+=fleetPower(f)*will/(1+(gather.eta+march.eta)/60);
    }
    const owners=new Set(rows.map(r=>r.owner));
    if(ctx.members.includes(0)&&anchor)owners.add(0);
    score*=1+owners.size*.15;
    if(rows.length&&(!best||score>best.score))best={rally:rally.id,rows,score};
  }
  if(!best)return {ok:false,why:'Ulaşılabilir ikmalli toplanma noktası veya açık askerî rota yok',responses};
  for(const id of ctx.members)if(G.emps[id].ai)responses[id]=best.rows.some(x=>x.owner===id)?'Kabul: gerçek filo ayrıldı':responses[id]==='Ulaşılabilir uygun kuvvet yok'?'Bilinen açık askerî rota veya ikmal yok':responses[id];
  let need=0;
  for(const id of ctx.members){const e=G.emps[id];if(!aiKnownSystem(e,targetSys))continue;need=Math.max(need,kind==='capture'||kind==='follow'&&aiKnownSystem(e,targetSys)?.owner===ctx.enemy?Math.max(80,aiEstimatedDefense(e,targetSys)*1.25):aiObservedThreat(e,target)*1.15);}
  const power=best.rows.reduce((n,r)=>n+fleetPower(G.fleets.find(f=>f.id===r.id)),0)+jointAnchorPower(anchor,target);
  if(power<need)return {ok:false,why:'Tahmini savunma için ulaşılabilir ortak kuvvet yetersiz',responses};
  return {ok:true,...best,need,power,responses};
}
function jointCreate(ctx,kind,target,options={}){
  if(!G.jointOps)G.jointOps=jointEmpty();const l=G.jointOps,key=ctx.campaign+':'+ctx.role;
  if(l.plans.filter(jointActive).length>=8)return {ok:false,why:'Ortak sefer kapasitesi dolu'};
  const previous=l.plans.find(p=>jointActive(p)&&p.campaign===ctx.campaign&&p.role===ctx.role);
  if(previous&&!(options.requester===0&&previous.requester===null))return {ok:false,why:'Bu savaşta zaten etkin ortak sefer var; kendi talebini önce iptal edebilirsin'};
  if(options.requester===undefined&&l.cooldowns[key]>G.day)return {ok:false,why:'Önceki sefer sonrası yeniden değerlendirme bekleniyor'};
  const q=jointSelect(ctx,kind,target,options.anchor,new Map(),previous);if(!q.ok)return q;
  if(previous)jointClose(previous,'cancelled','Oyuncunun yeni destek hedefi kabul edildi');
  const p={id:l.next++,...ctx,kind,target,rally:q.rally,requester:options.requester??null,recipient:options.recipient??null,anchor:options.anchor??null,
    bindings:Object.fromEntries(ctx.members.map(id=>[id,jointBinding(G.emps[ctx.sponsor],G.emps[id])])),
    fleets:q.rows.map(r=>({...r,arrived:false})),responses:q.responses,state:'gather',reason:'Ulaşılabilir filolar toplanıyor',
    created:G.day,deadline:G.day+Math.min(180,Math.max(...q.rows.map(r=>r.gatherEta))+30),expires:G.day+720,replans:0,need:q.need,power:q.power};
  l.plans=l.plans.filter(jointActive).concat(l.plans.filter(p=>!jointActive(p)).slice(-24));
  l.plans.push(p);
  for(const row of p.fleets){const f=G.fleets.find(f=>f.id===row.id);f.jointPlan=p.id;}
  jointAdvance(p,new Map());return {ok:true,plan:p,why:'Talep kabul edildi; mevcut filolar ortak göreve ayrıldı'};
}
function jointRequest(e,recipient,kind,target){
  const no=why=>({ok:false,why});const other=G.emps[recipient];
  if(e!==G.p||!other||!other.ai||!['follow','capture','defend'].includes(kind)||!jointBinding(e,other))return no('Siyasi askerî destek yetkisi yok');
  let anchor=null,sys=target;
  if(kind==='follow'){const f=G.fleets.find(f=>f.id===target&&f.e===e.id&&f.ships.length&&isArmed(f));if(!f)return no('Desteklenecek kendi savaş filonu seç');anchor=f.id;sys=jointAt(f);}
  if(!Number.isInteger(sys)||!G.sys[sys]?.seen.includes(e.id))return no('Bilinen bir hedef seç');
  const fronts=(G.warLedger?.fronts||[]).filter(f=>f.ended===null&&f.sides.includes(e.id)&&warLedgerPair(...f.sides));
  for(const front of fronts){const enemy=front.sides.find(id=>id!==e.id),role=front.roles[front.sides.indexOf(e.id)];
    const ctx=jointContext(front.campaign,role,e.id,enemy);
    if(!ctx?.members.includes(recipient)||!jointTargetOK(e,kind==='follow'?'defend':kind,sys,enemy)&&kind!=='follow')continue;
    // An explicit follow request shares an anchor ID, not its owner's command.
    if(kind==='follow'&&!jointTargetOK(other,'capture',sys,enemy)&&!jointTargetOK(other,'defend',sys,enemy))return no('Müttefik hedefi veya rotayı henüz bilmiyor');
    const selected={...ctx,members:[e.id,recipient].sort((a,b)=>a-b)};
    return jointCreate(selected,kind==='follow'?'follow':kind,sys,{requester:e.id,recipient,anchor});
  }
  return no('Aynı geçerli savaş seferinde kabul edilmiş ortak yükümlülük yok');
}
function jointNeed(p){
  let need=0;for(const id of p.members){const e=G.emps[id];if(!aiKnownSystem(e,G.sys[p.target]))continue;
    need=Math.max(need,p.kind==='capture'||p.kind==='follow'&&aiKnownSystem(e,G.sys[p.target])?.owner===p.enemy?Math.max(80,aiEstimatedDefense(e,G.sys[p.target])*1.25):aiObservedThreat(e,p.target)*1.15);
  }return need;
}
function jointValid(p){
  if(!jointContext(p.campaign,p.role,p.sponsor,p.enemy))return 'Savaş sona erdi veya ortak katılım kapandı';
  for(const id of p.members.slice())if(!jointFront(p.campaign,p.role,id,p.enemy)||!jointBound(p,id)){
    if(id===p.sponsor||id===p.recipient)return 'Siyasi yetki veya savaş taahhüdü sona erdi';
    jointRelease(p,id);p.members=p.members.filter(x=>x!==id);delete p.responses[id];
  }
  if(p.members.length<2)return 'Ortak savaş katılımcısı kalmadı';
  if(p.kind==='follow'){
    const f=G.fleets.find(f=>f.id===p.anchor&&f.e===p.requester&&f.ships.length);
    if(!f)return 'Desteklenecek filo artık yok';
  }
  if(G.day>=p.expires)return 'Görev süresi doldu';
  if(p.kind==='capture'&&G.sys[p.target]?.owner!==p.enemy&&!G.sys[p.target]?.planets.some(pl=>pl.col&&pl.owner===p.enemy)){
    const owner=G.sys[p.target]?.owner;return p.members.includes(owner)?'complete':'Hedef artık geçerli değil';
  }
  if(p.kind==='defend'&&!p.members.includes(G.sys[p.target]?.owner))return 'Savunma hedefi artık dost değil';
  return null;
}
function jointWithdraw(p,reason){
  p.state='retreat';p.reason=reason;
  for(const row of p.fleets){const f=G.fleets.find(f=>f.id===row.id&&f.jointPlan===p.id);if(!f||f.combat)continue;
    const e=G.emps[f.e];f.path=f.mv?[f.mv.to]:[];delete f.jointHoldUntil;
    const nodes=aiKnownSystems(e).filter(s=>s.owner===e.id&&isSupplyNode(e,s)).sort((a,b)=>dist(G.sys[jointAt(f)],a)-dist(G.sys[jointAt(f)],b)||a.id-b.id).slice(0,4);
    for(const s of nodes)if(aiMove(e,f,s.id))break;
  }
  // Release order ownership while retaining the legal retreat route.
  for(const row of p.fleets){const f=G.fleets.find(f=>f.id===row.id&&f.jointPlan===p.id);if(f)delete f.jointPlan;}
  p.state='cancelled';p.ended=G.day;G.jointOps.cooldowns[p.campaign+':'+p.role]=G.day+180;
}
function jointAdvance(p,cache){
  const bad=jointValid(p);if(bad){jointClose(p,bad==='complete'?'done':'cancelled',bad==='complete'?'Görev tamamlandı':bad);return;}
  let rows=p.fleets.map(row=>({row,f:G.fleets.find(f=>f.id===row.id&&f.e===row.owner&&f.ships.length&&f.jointPlan===p.id)})).filter(x=>x.f);
  p.fleets=rows.map(x=>x.row);
  if(!rows.length){jointClose(p,'cancelled','Destek kuvveti kalmadı');return;}
  if(p.kind==='follow'){
    const anchor=G.fleets.find(f=>f.id===p.anchor),to=anchor.path.at(-1)??jointAt(anchor);
    if(to!==p.target){
      p.target=to;p.state='gather';p.deadline=G.day+60;
      for(const {f}of rows){f.path=f.mv?[f.mv.to]:[];delete f.jointHoldUntil;}
    }
  }
  // Defenders can be recalled without waiting for the next monthly AI turn.
  for(const {row,f}of rows){const e=G.emps[f.e];
    if(aiObservedThreat(e,e.home)>0&&p.target!==e.home){
      p.responses[e.id]='Gecikme: kendi stratejik savunması öncelikli';
      const recalled=rows.filter(x=>x.f.e===e.id).map(x=>x.f);jointRelease(p,e.id);for(const own of recalled)if(!own.combat)aiMove(e,own,e.home);
    }
  }
  rows=rows.filter(({f})=>f.jointPlan===p.id);
  if(!rows.length){jointClose(p,'cancelled','Kendi stratejik savunması öncelikli');return;}
  if(rows.some(({f})=>f.retreating||fleetSupply(G.emps[f.e],f)<=.55)){
    jointWithdraw(p,'İkmal gerekiyor; gerçek filolar güvenli bölgeye dönüyor');return;
  }
  if(p.kind==='capture'&&(!p.members.includes(G.sys[p.rally]?.owner)||rows.some(({f})=>!canEnter(G.emps[f.e],G.sys[p.rally])))){
    if(p.replans>=2){jointWithdraw(p,'Toplanma noktası kaybedildi; yeniden planlama sınırı');return;}
    const ctx={campaign:p.campaign,role:p.role,sponsor:p.sponsor,enemy:p.enemy,members:p.members};
    // Release first so the same actual fleets can be reconsidered when idle.
    jointRelease(p);const q=jointSelect(ctx,p.kind,p.target,p.anchor,cache);p.replans++;
    if(!q.ok){jointClose(p,'cancelled','Toplanma noktası kaybedildi: '+q.why);return;}
    p.rally=q.rally;p.fleets=q.rows;p.state='gather';p.deadline=G.day+90;
    for(const row of p.fleets){const f=G.fleets.find(f=>f.id===row.id);f.jointPlan=p.id;}
    return;
  }
  p.need=jointNeed(p);p.power=rows.reduce((n,{f})=>n+fleetPower(f),0)+jointAnchorPower(p.anchor,p.target);
  if(p.power<p.need){jointWithdraw(p,'Tahmini savunma için ortak kuvvet yetersiz; taarruz durduruldu');return;}
  if(p.kind==='capture'&&rows.some(({f})=>!f.mv&&f.sys===p.target&&isArmed(f))){
    const s=G.sys[p.target];
    if(s.owner===p.enemy&&!s.planets.some(pl=>pl.col)&&sysDefense(s)<=0&&
      !G.fleets.some(f=>f.sys===s.id&&f.ships.length&&isArmed(f)&&hostile(p.sponsor,f.e))){
      const actual=rows.filter(({f})=>!f.mv&&f.sys===s.id&&isArmed(f)).sort((a,b)=>fleetPower(b.f)-fleetPower(a.f)||a.f.e-b.f.e)[0].f;
      captureSystem(s,actual.e);jointClose(p,'done','Görev tamamlandı');return;
    }
  }
  if(p.state==='march'||p.state==='defend'){
    let arrived=0;
    for(const {row,f}of rows){
      if(!f.mv&&f.sys===p.target){row.arrived=true;row.arrival= row.arrival??G.day;arrived++;continue;}
      if(f.combat)continue;
      const remaining=f.path.length?f.path.slice(f.mv?1:0):[];
      const from=jointAt(f),e=G.emps[f.e];
      if(remaining.length&&!pathAllowed(e,f,remaining,from)){jointWithdraw(p,'Rota kapandı; görev geri çekiliyor');return;}
      if(!f.mv&&!f.path.length){
        const r=jointRoute(e,f,p.target,cache);
        if(!r||!orderMove(f,p.target,false,true,r.path)){jointWithdraw(p,'Rota kapandı; hedefe ulaşım yok');return;}
      }
    }
    if(arrived===rows.length&&p.kind!=='capture'){p.state='defend';p.reason=p.kind==='follow'?'Seçilen filoyu destekliyor':'Bölgeyi savunuyor';
      if(p.requester===null&&p.kind==='defend'&&G.day-p.created>=30&&p.members.every(id=>!aiObservedThreat(G.emps[id],p.target))){jointClose(p,'done','Savunma tamamlandı; yeni hedef değerlendirilecek');return;}}
    else p.reason=rows.some(({f})=>(f.jointHoldUntil||0)>G.day)?'Eşzamanlı varış için müttefik bekleniyor':'Yola çıktı';
    return;
  }
  const destination=p.rally;
  let ready=[];
  for(const {row,f}of rows){
    if(f.combat)continue;
    if(!f.mv&&!f.path.length&&f.sys===destination){ready.push({row,f});continue;}
    if(f.path.at(-1)===destination)continue;
    const r=jointRoute(G.emps[f.e],f,destination,cache);
    if(!r||!orderMove(f,destination,false,true,r.path)){
      row.blocked=true;p.responses[f.e]='Gecikme: askerî rota kapandı';
    }else {row.blocked=false;row.gatherEta=r.eta;}
  }
  const complete=ready.length===rows.length;
  if(!complete&&G.day<p.deadline){p.reason=rows.some(({row})=>row.blocked)?'Rota kapandı; sınırlı süre bekleniyor':'Toplanıyor; müttefik bekleniyor';return;}
  const power=ready.reduce((n,{f})=>n+fleetPower(f),0)+jointAnchorPower(p.anchor,p.target);
  if(power<p.need){jointWithdraw(p,'Müttefik bekleme süresi doldu; hazır kuvvet yetersiz');return;}
  // Late or destroyed fleets never hold the coalition forever.
  for(const {f}of rows)if(!ready.some(x=>x.f===f))jointStop(f);
  p.fleets=ready.map(x=>x.row);
  const march=ready.map(({row,f})=>({row,f,r:jointRoute(G.emps[f.e],f,p.target,cache)}));
  if(march.some(x=>!x.r)){jointWithdraw(p,'Rota kapandı; ortak taarruz uygulanamadı');return;}
  if(march.every(x=>x.f.sys===p.target&&!x.f.mv)){p.state='defend';p.reason=p.kind==='follow'?'Seçilen filoyu destekliyor':'Bölgeyi savunuyor';return;}
  const eta=Math.max(...march.map(x=>x.r.eta));
  for(const {row,f,r}of march){
    if(!orderMove(f,p.target,false,true,r.path)){jointWithdraw(p,'Güncel askerî geçiş izni yok');return;}
    row.eta=r.eta;row.depart=G.day+eta-r.eta;f.jointHoldUntil=row.depart;
  }
  p.state='march';p.launched=G.day;p.reason='Saldırıya hazırlanıyor; varışlar eşgüdümlü';
}
function jointAuto(){
  const l=G.jointOps,seen=new Set();let created=0;
  for(const front of G.warLedger?.fronts||[]){
    if(front.ended!==null||!warLedgerPair(...front.sides))continue;
    for(let i=0;i<2;i++){
      const sponsor=front.sides[i],role=front.roles[i],enemy=front.sides[1-i],key=front.campaign+':'+role;
      if(seen.has(key)||!G.emps[sponsor].ai)continue;
      const ctx=jointContext(front.campaign,role,sponsor,enemy);if(!ctx)continue;seen.add(key);
      if(l.cooldowns[key]>G.day||l.plans.some(p=>jointActive(p)&&p.campaign===front.campaign&&p.role===role))continue;
      const e=G.emps[sponsor];
      const defensive=aiKnownSystems(e).filter(s=>ctx.members.includes(aiKnownSystem(e,s).owner)&&aiObservedThreat(e,s.id,s.id===e.home||s.planets.some(p=>p.col&&p.owner===e.id))>0)
        .sort((a,b)=>(b.id===e.home?1:0)-(a.id===e.home?1:0)||aiObservedThreat(e,b.id)-aiObservedThreat(e,a.id)||a.id-b.id);
      const target=defensive[0]||aiKnownSystems(e,enemy).sort((a,b)=>
        ((e.wg?.[enemy]?.targets||[]).includes(b.id)?1:0)-((e.wg?.[enemy]?.targets||[]).includes(a.id)?1:0)||
        dist(G.sys[e.home]||a,a)-dist(G.sys[e.home]||b,b)||a.id-b.id)[0];
      if(!target){l.cooldowns[key]=G.day+90;continue;}
      const r=jointCreate(ctx,defensive.length?'defend':'capture',target.id);
      if(!r.ok)l.cooldowns[key]=G.day+90;
      else if(++created>=4)return;
    }
  }
}
/* Validity is cheap and runs before movement. Route/galaxy work is bounded to
   five-day checks, new automatic plans to once per month; no frame planner. */
function jointTick(){
  const l=G.jointOps;if(!l)return;
  for(const p of l.plans)if(jointActive(p)){const bad=jointValid(p);if(bad)jointClose(p,bad==='complete'?'done':'cancelled',bad==='complete'?'Görev tamamlandı':bad);}
  if(G.day<l.nextCheck)return;l.nextCheck=G.day+5;
  const cache=new Map();for(const p of l.plans)if(jointActive(p))jointAdvance(p,cache);
  if(G.day>=l.nextAuto){l.nextAuto=G.day+30;jointAuto();}
  const closed=l.plans.filter(p=>!jointActive(p)).slice(-24);l.plans=l.plans.filter(jointActive).concat(closed);
  for(const key of Object.keys(l.cooldowns))if(l.cooldowns[key]<G.day-360)delete l.cooldowns[key];
}
function restoreJoint(raw){
  if(raw===undefined||raw===null){G.jointOps=jointEmpty();for(const f of G.fleets){delete f.jointPlan;delete f.jointHoldUntil;}return;}
  const fail=()=>{throw Error('Geçersiz ortak sefer kaydı');};
  if(raw.v!==1||!Number.isSafeInteger(raw.next)||raw.next<1||!Number.isFinite(raw.nextCheck)||!Number.isFinite(raw.nextAuto)||
    !Array.isArray(raw.plans)||raw.plans.length>32||!raw.cooldowns||typeof raw.cooldowns!=='object'||Array.isArray(raw.cooldowns))fail();
  const ids=new Set(),assigned=new Set();
  for(const v of Object.values(raw.cooldowns))if(!Number.isFinite(v)||v<0)fail();
  for(const p of raw.plans){
    if(!Number.isSafeInteger(p.id)||p.id<1||p.id>=raw.next||ids.has(p.id)||!['capture','defend','follow'].includes(p.kind)||
      !['gather','march','defend','done','cancelled'].includes(p.state)||!Number.isSafeInteger(p.campaign)||![0,1].includes(p.role)||
      !G.emps[p.sponsor]||!G.emps[p.enemy]||!G.sys[p.target]||!G.sys[p.rally]||!Array.isArray(p.members)||p.members.length<2||
      new Set(p.members).size!==p.members.length||p.members.some(id=>!Number.isInteger(id)||!G.emps[id])||!p.members.includes(p.sponsor)||
      !p.bindings||!p.responses||!Array.isArray(p.fleets)||p.fleets.length>24||!Number.isInteger(p.replans)||p.replans<0||p.replans>3||
      ![p.created,p.deadline,p.expires,p.need,p.power].every(v=>Number.isFinite(v)&&v>=0)||
      p.requester!==null&&p.requester!==0||p.kind==='follow'&&!Number.isSafeInteger(p.anchor))fail();
    ids.add(p.id);
    for(const id of p.members){const b=p.bindings[id];if(!b||!['self','fed','ally','vassal','promise'].includes(b.kind)||b.kind==='fed'&&!Number.isSafeInteger(b.id)||b.kind==='promise'&&(!Number.isSafeInteger(b.enemy)||!Number.isSafeInteger(b.campaign)))fail();}
    for(const r of p.fleets){
      if(!Number.isSafeInteger(r.id)||!p.members.includes(r.owner)||!G.emps[r.owner].ai||
        ![r.gatherEta,r.eta].every(v=>Number.isFinite(v)&&v>=0)||r.depart!==undefined&&!Number.isFinite(r.depart)||
        r.arrival!==undefined&&!Number.isFinite(r.arrival))fail();
      if(jointActive(p)){if(assigned.has(r.id))fail();assigned.add(r.id);}
    }
  }
  G.jointOps=JSON.parse(JSON.stringify(raw));
  for(const f of G.fleets)if(f.jointPlan!==undefined){
    const p=G.jointOps.plans.find(p=>p.id===f.jointPlan&&jointActive(p)&&p.fleets.some(r=>r.id===f.id&&r.owner===f.e));
    if(!p){jointStop(f);continue;}
    if(f.jointHoldUntil!==undefined&&!Number.isFinite(f.jointHoldUntil))fail();
  }
  for(const p of G.jointOps.plans)if(jointActive(p)){
    for(const r of p.fleets){const f=G.fleets.find(f=>f.id===r.id&&f.e===r.owner);if(f&&f.jointPlan!==p.id)fail();}
    const bad=jointValid(p);if(bad)jointClose(p,bad==='complete'?'done':'cancelled',bad==='complete'?'Görev tamamlandı':bad);
  }
}
/* Read-only, observer-filtered projection. Hidden fleets contribute neither
   exact locations, power, names nor ETA to the player panel. */
function jointView(e){
  const ctx=aiView(e).ctx;
  return (G.jointOps?.plans||[]).filter(p=>p.members.includes(e.id)).slice(-8).map(p=>({
    id:p.id,kind:p.kind,state:p.state,reason:p.reason,requester:p.requester,
    target:G.sys[p.target]?.seen.includes(e.id)?p.target:null,rally:G.sys[p.rally]?.seen.includes(e.id)?p.rally:null,
    members:p.members.filter(id=>id===e.id||e.contact[id]),
    responses:Object.fromEntries(Object.entries(p.responses).filter(([id])=>+id===e.id||e.contact[id])),
    fleets:p.fleets.flatMap(row=>{const f=G.fleets.find(f=>f.id===row.id&&f.e===row.owner&&f.ships.length);
      if(!f||f.e!==e.id&&!ctx.visible.has(jointAt(f)))return [];
      return [{id:f.id,owner:f.e,name:f.name||'Filo',at:jointAt(f),waiting:(f.jointHoldUntil||0)>G.day||p.state==='gather'&&!f.mv&&!f.path.length,
        eta:f.e===e.id?Math.max(0,(row.depart||G.day)-G.day)+(row.eta||0):null}];})
  }));
}

/* ---------------------------------------------------------------
   Kişilik profili: ırk + etik + civic'ten türetilir.
   AI artık kendi ideolojisine göre farklı oynar.
   --------------------------------------------------------------- */
function aiProfile(e){
  if (e._prof) return e._prof;
  const r = RACES[e.race], et = e.ethics || {};
  /* Gizli mizaç profili doğrudan büker: kalıtım + ideoloji */
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  const pw = P ? P.warBias : 0;
  const p = {
    war:  clamp(r.agr + pw + (et.mil||0)*.10 + (hasCivic(e,'blood')?.25:0) + (hasCivic(e,'warFury')?.15:0), 0, 1.4),
    exp:  clamp(r.exp + (et.aut||0)*.04, .2, 1.3),
    sci:  clamp((r.win==='bilim'?.9:.5) + (et.mat||0)*.08 + (hasCivic(e,'streak2')?.2:0), .2, 1.2),
    eco:  clamp((r.win==='ekonomi'?.9:.5) + (hasCivic(e,'trade')?.25:0), .2, 1.2),
    dip:  clamp(r.dip - pw*.5 - (et.mil||0)*.08 + (hasCivic(e,'allyCheap')?.25:0) - (false?1:0), 0, 1.2),
    turtle: clamp((hasCivic(e,'fortress')?.6:.2) - (et.mil||0)*.05, 0, 1)
  };
  e._prof = p;
  return p;
}
/* Bir sistemin AI için tehdit skoru: yakındaki düşman filo gücü */
function threatAt(e,sysId){return aiObservedThreat(e,sysId);}
/* Filonun menzil dengesi — AI dengeli filo kursun diye */
function fleetRangeMix(e){
  const mix = {1:0, 2:0, 3:0};
  for (const f of G.fleets){
    if (f.e !== e.id) continue;
    for (const sh of f.ships){
      const rg = SHIPS[sh.c].rng;
      if (rg) mix[rg] = (mix[rg]||0) + 1;
    }
  }
  return mix;
}

/* ---------------------------------------------------------------
   VAHŞİ TARAF — korsan yuvaları ve uzay canavarları
   --------------------------------------------------------------- */
function wildTurn(e){
  // yuvalar düzenli olarak akıncı üretir
  for (const nid of (G.nests || [])){
    const sy = G.sys[nid];
    if (!sy || !sy.nest) continue;
    sy.nest.timer -= 30;
    if (sy.nest.timer > 0) continue;
    sy.nest.timer = 130 + Math.floor(rnd()*140);
    const here = G.fleets.filter(f => f.e === e.id && f.sys === nid);
    if (here.length > 3) continue;
    const tier = 1 + Math.floor(G.year - 2210) / 12;
    const ships = [{c:'kor'},{c:'kor'}];
    if (tier > 1.6) ships.push({c:'muh'});
    if (tier > 2.6) ships.push({c:'muh'}, {c:'kru'});
    newFleet(e, nid, ships, 'Korsan Akıncısı');
  }

  // seyrek olarak bir uzay canavarı doğar
  G.monsterAt = G.monsterAt || 0;
  if (G.year > 2215 && G.day - G.monsterAt > 1800 && rnd() < .05){
    const wildSys = G.sys.filter(sy => sy.owner < 0);
    if (wildSys.length){
      const sy = wildSys[Math.floor(rnd()*wildSys.length)];
      const f = newFleet(e, sy.id, [{c:'zir'},{c:'kru'},{c:'kru'}], 'Yırtıcı');
      f.monster = true;
      G.monsterAt = G.day;
      if (sy.seen.includes(0)) say('Uzayda devasa bir yırtıcı belirdi — ' + sy.name, 'war');
    }
  }

  // akıncılar en yakın zayıf koloniye saldırır, canavarlar rastgele dolaşır
  for (const f of G.fleets){
    if (f.e !== e.id || f.combat || f.path.length || f.mv || f.sys < 0) continue;
    if (f.name === 'Korsan Muhafızı') continue;          // yuvayı bekler
    const from = f.sys;
    if (f.monster){
      const opts = G.sys[from].lanes;
      if (opts.length) orderMove(f, opts[Math.floor(rnd()*opts.length)]);
      continue;
    }
    const targets = G.sys.filter(sy => sy.owner >= 0 && !G.emps[sy.owner].wild);
    if (!targets.length) continue;
    const myPow = fleetPower(f);
    targets.sort((a,b)=>{
      const da = dist(G.sys[from], a) + sysDefense(a)*1.4;
      const db = dist(G.sys[from], b) + sysDefense(b)*1.4;
      return da - db;
    });
    const tgt = targets.find(sy => sysDefense(sy) < myPow * .9) || targets[0];
    if (tgt) orderMove(f, tgt.id);
  }
}

/* Kriz filoları: en yakın kolonili sisteme acımasızca yürür */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 68 — SÜRÜ HEDEF ÖNCELİKLENDİRMESİ
   Hiçlik Sürüsü eskiden yalnız EN YAKIN kolonili sisteme
   gidiyordu — kör bir dalga gibi. Artık stratejik: galaktik
   geçitler lojistik ağın düğüm noktası olduğu için önce onları
   koparıyor. Geçit düşünce galaksinin yarısı tedariksiz kalıyor.

   Puanlama: mesafe cezası + hedef değeri. Değer sıralaması
     geçit (900) > tersane (260) > nüfus (pop×8) > koloni (60)
   Mesafe hâlâ ağır basıyor ki sürü galaksinin öbür ucuna
   ışınlanmasın; ama eşit mesafede geçit her zaman kazanır.
   ═══════════════════════════════════════════════════════════════════ */
/* ÖLÇÜM: ilk denemede ceza `d * 1.15` idi ve galaksi mesafeleri
   1000–2000 BİRİM olduğu için 900 puanlık geçit önceliği tamamen
   eziliyordu (geçitli sistem hâlâ 3. sıradaydı). Mesafe artık
   GALAKSİ GENİŞLİĞİNE NORMALİZE ediliyor: bir uçtan öbürüne
   gitmek ~SWARM_DIST_PEN ceza. Böylece iki terim aynı ölçekte. */
const SWARM_GATE_PRIO = 900;   // geçit önceliği
const SWARM_DIST_PEN  = 780;   // galaksiyi baştan sona geçme cezası

function swarmTargetScore(f, sy){
  let deger = 60;                                    // kolonili sistem tabanı
  /* Geçit: lojistik düğümü — sürünün baş hedefi */
  if (sy.built && sy.built.kapi !== undefined) deger += SWARM_GATE_PRIO;
  /* Tersane: yeni filo üretimini kaynağında kes */
  if (typeof yardCount === 'function') deger += yardCount(sy) * 260;
  /* Nüfus: yemek */
  for (const pl of sy.planets)
    if (pl.col) deger += (pl.col.pop || 0) * 8;
  /* Kalkanlı gezegen daha zor lokma */
  for (const pl of sy.planets)
    if (pl.col && pl.shield > 0) deger -= pl.shield * 1.5;
  const d = dist(G.sys[f.sys], sy);
  const olcek = Math.max(1, Math.hypot(G.W || 4000, G.H || 4000));
  return deger - (d / olcek) * SWARM_DIST_PEN;
}

function crisisFleetTurn(e){
  for (const f of G.fleets){
    if (f.e !== e.id || f.combat || f.path.length || f.mv || f.sys < 0) continue;
    const targets = G.sys.filter(sy => sy.owner >= 0 && !G.emps[sy.owner].wild &&
                                       sy.planets.some(p => p.col));
    if (!targets.length) continue;
    /* Puanla, en iyi üçten birini seç — öngörülemezlik korunur */
    const puanli = targets.map(sy => ({sy, p: swarmTargetScore(f, sy)}))
                          .sort((a, b) => b.p - a.p);
    const pick2 = puanli[Math.floor(rnd() * Math.min(3, puanli.length))].sy;
    orderMove(f, pick2.id);
  }
}

/* 86D: görev seçimi deterministik; mevcut elçiyi her ay yeniden atayıp
   kıdemini silmez. Yerleştirme olasılığı ve hedef sıralaması korunur. */
function aiEnvoyTask(e,o){
  if (G.emps.some(x=>e.war[x.id]&&aiKnownWar(e,o,x))) return 'guvenlik';
  if ((e.rel[o.id]||0)<20) return 'yakinlasma';
  const ours=ownLuxury(e), theirs=intelOf(e,o.id)>=2?ownLuxury(o):{};
  if ((e.pact&&e.pact[o.id]) || LUX_KEYS.some(k=>theirs[k]&&!ours[k])) return 'ticaret';
  return e.ally[o.id] ? 'guvenlik' : 'yakinlasma';
}
function aiEnvoyTurn(e,prof){
  if (envoysUsed(e)>=envoyCap(e)) return;
  const cands=G.emps.filter(o=>envoyGate(e,o.id).ok&&!envoyRecord(e,o.id));
  if (!cands.length) return;
  const ours=ownLuxury(e);
  cands.sort((a,b)=>{
    const la=LUX_KEYS.filter(k=>(intelOf(e,a.id)>=2?ownLuxury(a):{})[k]&&!ours[k]).length;
    const lb=LUX_KEYS.filter(k=>(intelOf(e,b.id)>=2?ownLuxury(b):{})[k]&&!ours[k]).length;
    return (lb*20+(e.rel[b.id]||0))-(la*20+(e.rel[a.id]||0));
  });
  if (rnd()<.4+prof.dip*.4) setEnvoyTask(e,cands[0].id,aiEnvoyTask(e,cands[0]));
}
/* 93D.1: ücretli askerî siparişleri mevcut 93C sınıf şablonlarına bağlar. */
function aiFleetTemplate(e,f){
  const design=['kor','muh','kru','zir','esk'].filter(c=>shipBuildAccess(e,c).ok).join(':')+':'+(aiProfile(e).war>.8);
  if(f.composition&&(!f.composition.aiDesign||f.composition.aiDesign===design))return;
  const target=Math.min(FLEET_SOFT_CAP,Math.max(f.ships.length,f.capTarget||FLEET_SOFT_CAP));
  const counts={};for(const sh of f.ships)counts[sh.c]=(counts[sh.c]||0)+1;
  const mix=(aiProfile(e).war>.8?['kor','muh','kru','zir','muh','zir','esk']:['kor','muh','kor','kru','muh','zir','esk']).filter(c=>shipBuildAccess(e,c).ok);
  for(let n=f.ships.length;n<target;n++){const c=mix[n%mix.length];counts[c]=(counts[c]||0)+1;}
  setFleetTemplate(e,f,counts,true);
  if(f.composition)f.composition.aiDesign=design;
}
function aiQueueMilitaryShip(e,yard,cls,policy){
  const candidates=G.fleets.filter(f=>f.e===e.id && f.ships.length &&
    f.ships.every(sh=>SHIPS[sh.c] && SHIPS[sh.c].rol==='sav' && !SHIPS[sh.c].crisisOnly) &&
    !f.federal && !f.guardLocked && !f.retreating && !hasShipment(f));
  candidates.sort((a,b)=>a.id-b.id);
  for(const f of candidates){
    aiFleetTemplate(e,f);
    if(!f.composition || !f.composition.auto)continue;
    const status=fleetCompositionStatus(e,f);
    if(!status.ok || (policy&&!status.rows.some(r=>r.cls===cls&&r.missing>0)))continue;
    // One order inside the existing monthly military budget; no second AI spending loop.
    const result=reinforceFleet(e,f,{limit:1,reserve:policy?policy.reserve:(e.megaReserve||0)+(e.colossusReserve||0),...(policy?{cls,maxWait:policy.maxWait}:{})});
    if(result.ok)return true;
  }
  // Legacy calls wait for template completion; the bounded AI policy may expand independently when delivery is blocked.
  if(!policy && candidates.some(f=>f.composition && fleetCompositionStatus(e,f).missing>0))return false;
  return queueShip(e,yard,cls);
}

/* 93D.1: physical hulls, paid pending jobs, upkeep and bounded monthly budget. */
function aiShipInventory(e){
 const counts={},pending={},yards=G.sys.filter(s=>s.owner===e.id&&hasYard(s));
 let queuedUse=0,queuedEnergy=0,queuedAlloy=0,combatUsage=0;
 for(const f of G.fleets)if(f.e===e.id&&!f.federal)for(const sh of f.ships){counts[sh.c]=(counts[sh.c]||0)+1;if(SHIPS[sh.c]?.rol==='sav')combatUsage+=SHIPS[sh.c].sz;}
 for(const s of G.sys)if(s.owner===e.id)for(const q of s.queue)if(q.e===e.id&&SHIPS[q.cls]){
  pending[q.cls]=(pending[q.cls]||0)+1;if(SHIPS[q.cls].rol==='sav')combatUsage+=SHIPS[q.cls].sz;queuedUse+=SHIPS[q.cls].sz;queuedEnergy+=SHIPS[q.cls].up;queuedAlloy+=SHIPS[q.cls].upA||0;
 }
 return {counts,pending,yards,combatUsage,usage:fleetUsage(e)+queuedUse,queuedEnergy,queuedAlloy};
}
function aiShipProduction(e,my,prof){
 const month=G.year*12+G.month;
 if(e.aiShipPlan&&e.aiShipPlan.month===month)return;
 const old=e.aiShipPlan||{},state=e.aiShipPlan={month,nextScience:Number.isFinite(old.nextScience)?clamp(old.nextScience,0,G.day+360):0,scienceLossStreak:clamp(Math.floor(old.scienceLossStreak||0),0,2),scienceIssued:old.scienceIssued===true,reasons:[]};
 const note=k=>{if(!state.reasons.includes(k))state.reasons.push(k);};
 let inv=aiShipInventory(e);
 const yards=inv.yards.filter(s=>!(s.yardLock>(G.memAge||0)));
 if(!yards.length){note('no-usable-yard');return;}
 const visibleDanger=my.some(s=>aiObservedThreat(e,s.id,false)>0);
 const war=visibleDanger||Object.keys(e.war||{}).some(id=>e.war[id]&&G.emps[id]&&!G.emps[id].dead&&!G.emps[id].wild);
 const plan=aiEconomyPlan(e),commitment=plan.committed;
 const threat=G.emps.some(o=>o!==e&&!o.dead&&!o.wild&&e.contact[o.id]&&!e.ally[o.id]&&(e.rel[o.id]||0)<-40);
 const underDefended=inv.combatUsage<e.cap*.35&&!plan.critical;
 const reserve=(e.megaReserve||0)+(e.colossusReserve||0)+(commitment.ala||0)+Math.max(war?12:24,Math.min(120,Math.max(0,e.inc.ala||0)*(war?1:underDefended?.75:2)));
 let budget=Math.max(0,Math.min((e.res.ala||0)-reserve,Math.max(0,e.inc.ala||0)*(war?5:3)+(e.res.ala||0)*(war?.25:.15)));
 const limit=Math.min(war?10:6,Math.max(1,yards.reduce((n,s)=>n+yardCount(s),0)*(war?3:2)));
 let orders=0;
 const target=Math.max(0,e.cap*(war?.90:threat?.80:clamp(.50+prof.war*.18,.5,.76)));
 const upkeep=Math.max(.1,1+(e.mods.upMul||0));
 const energyUpkeep=upkeep*(hasCivic(e,'mobilize')&&!Object.values(e.war||{}).some(Boolean)?2:1);
 function can(cls){
  if(!shipBuildAccess(e,cls).ok)return false;
  const d=SHIPS[cls],c=shipCost(e,cls);
  if(inv.usage+d.sz>e.cap*(war?1:.92)){note('projected-capacity');return false;}
  const net=Math.min((e.inc.ene||0)-(inv.queuedEnergy+d.up)*energyUpkeep,plan.rows.ene.net-d.up*energyUpkeep);
  if((!war&&d.up>0&&net<2)||e.crisis||(net<0&&(e.res.ene||0)<Math.max(100,-net*(war?12:24)))){note('energy-runway');return false;}
  const alloyNet=(e.inc.ala||0)-(inv.queuedAlloy+(d.upA||0))*upkeep;
  if(alloyNet<0&&(e.res.ala||0)-(c.ala||0)<-alloyNet*18){note('alloy-upkeep');return false;}
  if((c.ala||0)>budget||(e.res.ala||0)-(c.ala||0)<reserve){note('alloy-budget-reserve');return false;}
  if(!war&&plan.rows.tuk.net<0&&plan.rows.tuk.months<6){note('consumer-runway');return false;}
  if(!Object.entries(c).every(([r,v])=>e.res[r]-(r==='ala'?0:commitment[r]||0)>=v)){note('resource-cost');return false;}
  return true;
 }
 function buy(cls,military=false){
  if(orders>=limit||!can(cls))return false;
  const yard=yards.map(s=>({s,wait:Math.min(...yardCompletionSlots(e,s))})).filter(x=>x.wait<=45).sort((a,b)=>a.wait-b.wait||a.s.id-b.s.id)[0];
  if(!yard){note('yard-backlog');return false;}
  const before=e.res.ala;
  const ok=military?aiQueueMilitaryShip(e,yard.s,cls,{reserve:Math.max(reserve,e.res.ala-budget),maxWait:45}):queueShip(e,yard.s,cls);
  if(!ok){note('delivery-or-template');return false;}
  budget-=Math.max(0,before-e.res.ala);orders++;inv=aiShipInventory(e);return true;
 }
 const classes=['zir','kru','muh','kor','esk'].filter(c=>shipBuildAccess(e,c).ok);
 for(let i=0;i<limit;i++){
  if(inv.combatUsage>=target){note('deterrence-target');break;}
  const weights={esk:2,kor:prof.war>.8?3:4,muh:3,kru:2,zir:prof.war>.8?2:1};
  const needed=new Set();
  for(const f of G.fleets)if(f.e===e.id&&f.composition&&f.composition.auto&&!hasShipment(f)){const status=fleetCompositionStatus(e,f);for(const r of status.rows||[])if(r.missing&&r.buildable)needed.add(r.cls);}
  const ranked=classes.slice().sort((a,b)=>Number(needed.has(b))-Number(needed.has(a))||((inv.counts[a]||0)+(inv.pending[a]||0))/weights[a]-((inv.counts[b]||0)+(inv.pending[b]||0))/weights[b]||SHIPS[b].sz-SHIPS[a].sz);
  if(!ranked.some(c=>buy(c,true)))break;
  if(orders>=Math.max(1,limit-1))break;
 }
 const count=c=>(inv.counts[c]||0)+(inv.pending[c]||0);
 const targets=colonizeTargets(e),wantCol=Math.min(e.colonies.length<6?3:2,targets.length);
 if(count('kol')<wantCol)buy('kol');
 const unexplored=G.sys.some(s=>!s.surv.includes(e.id));
 if(count('bil')<2&&unexplored){
  if(G.day>=state.nextScience){const lostAll=count('bil')===0&&state.scienceIssued;if(buy('bil')){state.scienceLossStreak=lostAll?Math.min(2,state.scienceLossStreak+1):state.scienceLossStreak;state.scienceIssued=true;state.nextScience=G.day+120*(1+state.scienceLossStreak);}}
  else note('science-renewal-cooldown');
 }else {if(count('bil')>=2)state.scienceLossStreak=0;note('science-covered');}
 const wantArmy=war?Math.min(5,2+Math.round(prof.war*2)):Math.min(2,1+Math.floor(e.colonies.length/4));
 if(count('ord')<wantArmy)buy('ord');
 if(orders===0&&typeof aiColossusProduction==='function'){
  const yard=yards.find(s=>s.queue.length<Math.max(2,yardCount(s)));
  if(yard&&inv.usage+SHIPS.col_s.sz<=e.cap&&(e.inc.ene||0)>SHIPS.col_s.up*energyUpkeep+inv.queuedEnergy*energyUpkeep)aiColossusProduction(e,yard,prof);
 }
 if(!orders&&!state.reasons.length)note('no-unmet-need');
 for(const reason of state.reasons)AIDiagnostics.note('navy:'+reason,e,null,plan.policy);
}

function aiColossusProduction(e,yard,prof){
 if(!SHIPS.col_s || !shipBuildAccess(e,'col_s').ok)return;
 const canAfford=cls=>canBuildShip(e,cls);
      const varOlan = G.fleets.filter(f => f.e === e.id && f.ships.length &&
        typeof isColossus === 'function' && isColossus(f)).length;
      const kuyrukta = G.sys.reduce((n,s)=>n+s.queue.filter(q=>q.e===e.id&&q.cls==='col_s').length,0);
      /* ═══ ÖZEL COLOSSUS BÜTÜNÇESİ ═══
         Şartları sağlayan AI, alaşım 1000'i geçince Colossus
         tamamlanana kadar biriktirmeye başlar: normal gemi üretimi
         o payı harcayamaz. */
      const P0 = (typeof personaOf === 'function') ? personaOf(e) : null;
      const agresif0 = (P0 && P0.n === 'Militarist') || prof.war > .72;
      if (!varOlan && agresif0 && (e.res.ala || 0) > 1000){
        e.colossusReserve = SHIPS.col_s.cost.ala;
      } else if (varOlan){
        e.colossusReserve = 0;
      }
      /* FAZ 32: yasak varsa AI hiç denemez */
      const yasakVar = (typeof councilExists === 'function' && councilExists() &&
        G.council.laws.colYasak && typeof inCouncil === 'function' && inCouncil(e));
      if (!yasakVar && !varOlan && !kuyrukta && canAfford('col_s') &&
          /* FAZ 26: eşikler gevşetildi — 3000/4500 hiç tetiklenmiyordu
             (6 tohumda 0 üretim). Geç oyunda ulaşılabilir seviye. */
          (e.res.ala || 0) > 2000 && (e.res.min || 0) > 2500 &&
          (e.inc.ala || 0) > 80){
        const P = (typeof personaOf === 'function') ? personaOf(e) : null;
        const agresif = (P && P.n === 'Militarist') || prof.war > .72;
        /* ═══ FAZ 28: BAŞ DÜŞMAN SEÇİMİ ═══
           ÖLÇÜM: 60 yıl sonunda Vorrak Klan Birliği yedi koşulun
           altısını sağlıyordu (tekno ✓ alaşım 65197 ✓ mineral 144239 ✓
           gelir 133 ✓ savaşta ✓ militarist ✓) ve tek engel kin ≥45'ti.
           Sorun: grudgeOf yalnız SOMUT ZARAR anılarını (ihanet,
           sabotaj, sistem kaybı) sayıyor; uzun süren bir savaş tek
           başına kin üretmiyor ve savaştaki AI'ların kini 0 kalıyor.
           Çözüm: düşmanlık ölçütü kin YERİNE savaş ağırlığı +
           tehdit + kin bileşimi. */
        /* ÖLÇÜM (Faz 28): 60. yılda AI'lar arasında savaş kalmıyor;
           e.war bayrağı yalnız KORSANLARLA dolu. "Savaşta ol" koşulu
           bu yüzden hiç sağlanmıyordu. Artık düşman aranırken savaş
           şartı yerine SOĞUK DÜŞMANLIK da sayılıyor: kin, kötü
           ilişki, galaktik tehdit. Colossus caydırıcı bir silahtır;
           savaş çıkmadan da inşa edilebilir. */
        let basDusman = null, enSkor = 0;
        for (const o of G.emps){
          if (o.dead || o.wild || o.id === e.id) continue;
          if (!e.contact[o.id]) continue;
          if (e.ally && e.ally[o.id]) continue;
          const savasVar = !!e.war[o.id];
          const dusmanlik = savasVar || (e.rel[o.id] || 0) < -25 ||
                            (typeof grudgeOf === 'function' && grudgeOf(e, o.id) > 20);
          if (!dusmanlik) continue;
          const kin = (typeof grudgeOf === 'function') ? grudgeOf(e, o.id) : 0;
          /* Savaş ne kadar uzun sürdüyse o kadar köklü düşmanlık */
          const yorgun = (typeof exhOf === 'function') ? exhOf(e, o.id) : 0;
          /* Güçlü düşman daha çok hak eder */
          const guc = clamp(aiKnownPower(e,o) / (totalPower(e) + 1), 0, 2.5);
          /* Kötü ilişki de düşmanlık ölçüsüdür; savaş varsa ağırlaşır */
          const soguk = Math.max(0, -(e.rel[o.id] || 0)) * .45;
          const skor = (kin + yorgun * .8 + guc * 25 +
                        (o.threat ? o.threat * .3 : 0) + soguk) * (savasVar ? 1.4 : 1);
          if (skor > enSkor){ enSkor = skor; basDusman = o; }
        }
        if (agresif && basDusman && enSkor >= 45 && rnd() < .10){
          queueShip(e, yard, 'col_s');
          e.colossusTarget = basDusman.id;
        }
      }
    
}

function aiTurn(e){
  if (e.dead) return;
  if (e.crisisSide){ crisisFleetTurn(e); return; }
  if (e.wild){ wildTurn(e); return; }
  aiObserve(e);aiUpdateStrategy(e);
  const race = RACES[e.race];
  const prof = aiProfile(e);
  const my = G.sys.filter(s => s.owner === e.id);
  /* HOTFIX 23.1: wild/crisis zaten yukarıda ayrılıyor ama bu satır
     ikinci bir ölüm kapısıydı — güvence olarak burada da korunuyor. */
  if (!my.length && !e.colonies.length){
    if (!e.wild && !e.crisisSide){
      e.dead = true;
      /* FAZ 30: Bu ölüm yolu purgeEmpire çağırmıyordu; ölen
         imparatorluğun filoları haritada öksüz kalıyordu.
         (Regresyon testi: "öksüz filo: 2") */
      if (typeof purgeEmpire === 'function') purgeEmpire(e);
    }
    return;
  }

  aiRecoverEconomy(e);

  /* --- 0. koloni odakları --- */
  const atWarNow = Object.keys(e.war).some(k => e.war[k]);
  for (const c of e.colonies){
    const sys = G.sys[c.s], pl = sys.planets[c.p];
    if (!pl.col || (pl.col.fcd||0) > 0) continue;
    const border = sys.lanes.some(l => G.sys[l].owner >= 0 && G.sys[l].owner !== e.id);
    let want;
    if (e.home === sys.id) want = 'yonetim';
    else if ((atWarNow && border) || (prof.turtle > .5 && border && threatAt(e, sys.id) > 0)) want = 'garnizon';
    else if (e.crisis === 'yiyecek' || (e.inc.yiy < 3 && RACES[e.race].bio === 'organik')) want = 'tarim';
    else if (e.crisis === 'mineral') want = 'sanayi';
    else if (e.inc.ara < 18 + prof.sci*22) want = 'arastir';
    else want = 'sanayi';
    if (pl.col.f !== want) setFocus(e, sys, pl, want);
  }

  /* --- 1. yapılar --- */
  for (const c of e.colonies){
    const sys = G.sys[c.s], pl = sys.planets[c.p];
    if (!pl.col) continue;
    /* FAZ 14: Slot doluysa eskiden koloni tamamen ATLANIYORDU ve
       aşağıdaki yıkım mantığına HİÇ ulaşılmıyordu (ölçüm: 6 tohumda
       0 yıkım emri). Artık atlanmıyor; slot doluysa yıkım
       değerlendirmesi yapılıp inşa kısmı kendiliğinden boşa düşüyor. */
    const slotsNow = colonySlots(pl.col, e, pl);
    const doluNow = colonyUsed(pl.col) +
      ((typeof colonyQueued === 'function') ? colonyQueued(pl.col) : 0) >= slotsNow;
    const need = [];
    if(e.aiStrategy?.goal==='war'&&(e.inc.ala||0)<30)need.push('dokum');
    const unhappy=(e.factions||[]).filter(x=>x.mood<35&&x.pow>=20).sort((a,b)=>a.mood-b.mood)[0];
    if(unhappy?.k==='bilim')need.push('lab');else if(unhappy?.k==='tuccar'&&(e.inc.ene||0)>6)need.push('liman');
    // kriz varsa her şeyin önüne geçer
    if (e.crisis === 'enerji') need.push('santral', 'santral');
    if (e.crisis === 'yiyecek') need.push('ciftlik', 'ciftlik');
    if (e.inc.yiy < 4 && RACES[e.race].bio === 'organik') need.push('ciftlik');
    if (e.inc.ene < 6) need.push('santral');
    if (e.inc.min < 10) need.push('maden');
    // alaşım darboğazı: mineral yığılıyorsa mutlaka dökümhane kur
    /* ALAŞIM REFORMU: mineral fazlası artık dökümhaneyle alaşıma
       çevrilebiliyor. AI mineral biriktirip alaşımsız kalmamalı. */
    if (e.inc.ala < 4) need.push('dokum');
    if (e.res.min > 1500 && e.inc.ala < 25) need.unshift('dokum', 'dokum');
    if (e.res.min > 6000 && e.inc.ala < 60) need.unshift('dokum', 'dokum', 'dokum');
    if (e.res.ala < 150 && e.inc.ala < 20) need.unshift('dokum');
    /* Mineral dağı büyüyorsa sanayi odağına geç */
    if (e.res.min > 9000 && e.inc.ala < 80) need.unshift('dokum');
    if (e.inc.tuk < 1 || e.shortage) need.unshift('fabrika');
    if ((pl.col.b.liman||0) < (prof.eco > .7 ? 2 : 1)) need.push('liman');
    if(!e.crisis && e.inc.ene>8 && e.inc.min>15 && !e.shortage){
      for(const [key,b] of Object.entries(BUILDINGS))if(b.tech&&e.techs[b.tech] && (!b.u||Object.entries(b.u).every(([res,v])=>(e.inc[res]||0)>v)) && !(pl.col.b[key]||0) && !colonyQueuedOf(pl.col,key))need.push(key);
    }
    // bilimci profiller laboratuvarı ciddiye alır, savaşçılar dökümhaneyi
    if (prof.sci > .7) need.push('lab', 'lab');
    else need.push(rnd() < .35 + prof.sci*.40 ? 'lab' : 'maden');
    if (prof.war > .8 && e.inc.ala < 12) need.push('dokum');
    if (!hasYard(sys) && e.colonies.length > 1 && rnd()<.35) need.unshift('tersane');
    if (atWarNow && threatAt(e, sys.id) > 0 && rnd() < .5 + prof.turtle*.4) need.unshift('kale');
    /* FAZ 13: kuyruk dolu değilse sipariş ver.
       Kontrol artık KUYRUKTAKİLERİ de sayıyor — aksi hâlde AI aynı
       binayı defalarca sıraya alıp kaynağını kilitliyordu. Ayrıca
       kuyruk 2'yi geçmesin: uzun sıra ekonomiyi dondurur. */
    const economicNeeds=aiEconomicOrder(e,sys,pl,need);need.splice(0,need.length,...economicNeeds);
    const kuyruk = (typeof colonyQueued === 'function') ? colonyQueued(pl.col) : 0;

    /* ── FAZ 14: AI YIKIM KARARI ──
       Slot dolduğunda ve gerçekten ihtiyaç duyduğu bina engellendiğinde
       AI en işe yaramaz binayı söker. Kilitlenmeyi önlemek için:
       kuyrukta yıkım varsa yenisi verilmez ve her ay en fazla bir emir. */
    const jobs = (typeof colonyJobs === 'function') ? colonyJobs(pl.col) : kuyruk;
    const slotDolu = colonyUsed(pl.col) + kuyruk >= colonySlots(pl.col, e, pl);
    if (slotDolu && jobs === 0 && need.length && typeof queueDemolish === 'function'){
      /* İhtiyaç listesindeki hiçbir bina kurulamıyorsa yer açalım */
      /* Slot dolu olduğu için kurulamayan İLK ihtiyacı bul.
         Eskiden yalnızca need[0]'a bakılıyordu; o bina zaten max'ta
         olduğunda yıkım hiç tetiklenmiyordu. */
      let istenen = null;
      for (const k of need){
        if (!BUILDINGS[k]) continue;
        const kq = (typeof colonyQueuedOf === 'function') ? colonyQueuedOf(pl.col, k) : 0;
        if ((pl.col.b[k] || 0) + kq < BUILDINGS[k].max){ istenen = k; break; }
      }
      if (istenen){
        /* En düşük öncelikli mevcut binayı seç: ihtiyaç listesinde
           olmayan ve birden fazla kopyası bulunan */
        /* Yalnızca EN ÖNCELİKLİ ihtiyaç korunur. Eskiden `need`
           listesindeki her bina muaf tutuluyordu; ama AI'nın çok
           kopyası olan binalar zaten o listede olduğu için hiçbir
           aday kalmıyor ve yıkım hiç tetiklenmiyordu (ölçüm: 6
           tohumda 0 emir). */
        let hedef = null, enCok = 1;
        for (const k in pl.col.b){
          if (k === istenen) continue;                       // asıl istediğimiz
          if (k === 'santral' || k === 'ciftlik') continue;  // hayati altyapı
          if (pl.col.b[k] > enCok){ enCok = pl.col.b[k]; hedef = k; }
        }
        if (hedef && rnd() < .18) queueDemolish(e, sys, pl, hedef);
      }
    }

    if (kuyruk < 2){
      for (const k of need){
        const kuyruktaki = (typeof colonyQueuedOf === 'function')
          ? colonyQueuedOf(pl.col, k) : 0;
        if ((pl.col.b[k]||0) + kuyruktaki < BUILDINGS[k].max){
          if (queueBuilding(e, sys, pl, k)){AIDiagnostics.note('invest:'+k,e,null,aiEconomyPlan(e).policy);break;}
        }
      }
    }
  }

  /* 93D.1 — bounded multi-yard production */
  aiShipProduction(e,my,prof);

  /* 94B: oyuncuyla aynı rezervasyon ve güvenli rota kuralları. */
  autoExploreTick(e.id);

  /* --- 4. kolonizasyon --- */
  const targets = colonizeTargets(e);
  if (targets.length){
    const taken = new Set(G.fleets.filter(f=>f.e===e.id && f.ord && f.ord.t==='kol')
                                  .map(f=>f.ord.s+':'+f.ord.p));
    for (const f of G.fleets){
      if (f.e !== e.id || f.combat || !fleetHasRole(f,'koloni')) continue;
      if (f.ord && f.ord.t === 'kol') continue;
      const from = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : e.home);
      const free = targets.filter(t => !taken.has(t.s+':'+t.p));
      if (!free.length) break;
      free.sort((a,b)=> (dist(G.sys[from],G.sys[a.s]) - a.h*22) - (dist(G.sys[from],G.sys[b.s]) - b.h*22));
      // ulaşılamayan hedefi atla, sıradakini dene
      let placed = false;
      for (const t of free.slice(0, 5)){
        if (aiMove(e,f,t.s)){
          taken.add(t.s+':'+t.p);
          f.ord = {t:'kol', s:t.s, p:t.p};
          placed = true;
          break;
        }
      }
      if (!placed) continue;
    }
  }

  /* --- 4b. aynı sistemdeki boştaki savaş filolarını birleştir --- */
  const byS = {};
  for (const f of G.fleets){
    if (f.e !== e.id || jointReserved(f) || f.combat || f.mv || f.path.length || f.sys < 0 || hasShipment(f) || f.composition || pendingFleetShips(e,f)>0) continue;
    if (!isArmed(f)) continue;
    (byS[f.sys] = byS[f.sys] || []).push(f);
  }
  for (const k in byS){
    const arr = byS[k];
    if (arr.length < 2) continue;
    const main = arr.reduce((a,b)=> a.ships.length >= b.ships.length ? a : b);
    for (const f of arr) if (f !== main && main.ships.length < 26){
      main.ships.push(...f.ships); f.ships = [];
    }
    G.fleets = G.fleets.filter(f => f.ships.length);
  }

  /* --- 5. savaş kararı --- */
  const myPow = totalPower(e);
  for (const o of G.emps){
    if (o.dead || o.id === e.id || !e.contact[o.id] || e.war[o.id] || e.ally[o.id]) continue;
    if (!canDeclareWarOn(e, o)) continue;              // sürgüne dokunulmaz
    const oPow = aiKnownPower(e,o) + 1;
    const border = aiKnownSystems(e,o.id).some(s=>s.lanes.some(l=>G.sys[l].owner===e.id));
    // kovan/diplomasisiz ırklar sınır komşusuna er ya da geç saldırır
    if (prof.dip <= 0.02 && border && rnd() < .22 + prof.war*.18){ declareWar(e, o); continue; }
    if (!border) continue;
    // barıştan sonra en az 2 yıl bekle (savaş-barış döngüsünü kırar)
    const lastPeace = (e.peaceAt && e.peaceAt[o.id] !== undefined) ? e.peaceAt[o.id] : -9999;
    if (G.day - lastPeace < 720) continue;
    const ratio = myPow/oPow;
    // zayıf ve zengin komşu daha çekici
    const juicy = clamp(aiKnownSystems(e,o.id).length / (sysCount(e)+1), .4, 2.4);
    // zaten savaşta olan komşu ek fırsat: iki cepheye bölünmüş düşman
    const busy = G.emps.some(x => !x.dead && x.id !== e.id && aiKnownWar(e,o,x)) ? .35 : 0;
    const want = prof.war * (ratio - 1.02) * juicy + (e.rel[o.id] < -40 ? .35 : 0) + busy;
    if (ratio > 1.14 && rnd() < want*.50){
      // AI kişiliğine göre savaş hedefi seçer
      if (typeof setWarGoal === 'function'){
        const opts = prof.war > .9 ? ['fetih','yikim','yoketme']
                   : prof.eco > .7 ? ['harac','fetih']
                   : prof.sci > .8 ? ['bilgi','fetih'] : ['fetih','yikim'];
        const pick2 = opts.find(k => e.res.etk >= WAR_GOALS[k].etk) || 'fetih';
        setWarGoal(e, o, pick2);
      }
      declareWar(e, o);
    }
  }

  /* --- 6. barış --- */
  for (const o of G.emps){
    if (o.dead || !e.war[o.id]) continue;
    if (!canPeace(e, o)) continue;                     // Kan Hukuku / Sürgün
    // savaş ilan edip hemen barış istemesin: en az 10 ay savaşsın
    const since = G.day - (e.warStart && e.warStart[o.id] || 0);
    if (since < 300) continue;
    const oPow = aiKnownPower(e,o)+1;
    const myExh = (typeof exhOf === 'function') ? exhOf(e, o.id) : 0;
    const losing = myPow/oPow < .55 || myExh > 55;
    const tired  = sysCount(e) < aiKnownSystems(e,o.id).length * .6;
    if (peaceAlwaysAccepted(e, o)){ makePeace(e, o); continue; }
    if (!(losing || tired)) continue;
    if (rnd() > .22 + prof.dip*.15) continue;
    if (o.ai){ makePeace(e, o); continue; }
    // oyuncuya teklif: en fazla 15 ayda bir
    /* ═══ FAZ 62: SPAM ENGELİ ═══
       Normalde 15 ay bekler; oyuncu REDDETTİYSE ceza 12 ay daha
       uzar (toplam 27 ay). Aynı teklifi üst üste yollayıp
       oyuncuyu bezdirmesin. */
    e.lastOffer = e.lastOffer || {};
    e.offerRefused = e.offerRefused || {};
    const lastOff = (e.lastOffer[o.id] !== undefined) ? e.lastOffer[o.id] : -9999;
    const ceza = e.offerRefused[o.id] ? 360 : 0;      // 12 ay ek
    if (G.day - lastOff < 450 + ceza) continue;
    e.lastOffer[o.id] = G.day;
    UI.peaceOffer(e);
  }

  /* ═══════════════════════════════════════════════════════════════
     FAZ 80 — ARINDIRICI DİPLOMASİ KAPISI
     Bu noktadan sonraki her şey (elçi, müzakere teklifi, ticaret
     anlaşması, ittifak arayışı, pakt, sığınma) masaya oturmayı
     gerektirir. Fanatik Arındırıcılar bunların hiçbirini yapmaz.

     Kilit TEK NOKTAYA konuldu — ileride buraya yeni bir diplomasi
     kolu eklendiğinde de kendiliğinden korunur. İstihbarat ve
     casusluk bölümleri bu bloğun DIŞINDA, dolayısıyla açık kalır. */
  if(!isPurifier(e)){
  /* --- 6-öncesi. elçi görevi — oyuncuyla aynı atama kapısı --- */
  aiEnvoyTurn(e,prof);

  /* --- 6-0. oyuncuya müzakere teklifi --- */
  if (e.contact[0] && !G.emps[0].dead && rnd() < .05){
    e.lastProp = e.lastProp || 0;
    if (G.day - e.lastProp > 540){
      const off = aiProposeTo(e, G.emps[0]);
      /* FAZ 86C.1: üretici TAM teklif üzerinden kanonik quote kullanır
         (eskiden yalnız give tarafına canDeliver bakıyordu). */
      if (off && typeof dealQuote === 'function' && dealQuote(off).ok){
        e.lastProp = G.day;
        UI.aiOffer(off);
      }
    }
  }

  /* ═══ FAZ 86C.4 — 6z. SALDIRMAZLIK PAKTI ═══
     ÖLÇÜLDÜ: 3 seed × 360 ayda hiç NAP kurulmadı; AI'ın saldırmazlık
     öneren bir yolu YOKTU (ai.js'de `t:'nap'` sıfır kez geçiyordu).
     NAP mantıken pact/ally'den ÖNCE gelir: barış varken güveni
     ucuza sabitler (kanonik maliyet 0), gerilim varken erken savaşı
     önler. Kendi bağımsız fırsat kapısı vardır; mevcut pact ve ally
     kapılarına DOKUNULMAZ. */
  if (prof.dip > .25){
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id) continue;
      if (!e.contact[o.id]) continue;
      /* FAZ 86C.4: doktrini anlaşmayı YASAKLAYAN hedefe teklif
         götürmek fırsat yuvasını boşa harcıyordu — ölçümde 200 ayda
         84 müzakere yalnız bu yüzden geçersiz dönüyordu. */
      if (typeof diploBlocked === 'function' && diploBlocked(e, o)) continue;
      if (e.war[o.id]) continue;                        // savaşta NAP olmaz
      if (e.nap && e.nap[o.id] > G.day) continue;       // zaten yürürlükte
      if (e.ally[o.id]) continue;                       // ittifak zaten kapsar
      /* Temkinli AI, ilişkisi ORTA olan komşuyla güvence arar:
         çok dostsa gerek yok, çok düşmansa kabul edilmez. */
      const rel = e.rel[o.id] || 0;
      if (rel < -35 || rel > 65) continue;
      const gerginlik = G.emps.some(x => !x.dead && aiKnownWar(e,x,o)) ? .10 : 0;
      if (rnd() < .06 + prof.dip * .10 + gerginlik){
        if (o.id === 0){
          e.lastNapProp = e.lastNapProp || 0;
          if (G.day - e.lastNapProp > 540){
            e.lastNapProp = G.day;
            UI.aiOffer({from:e.id, to:0, give:[{t:'nap'}], want:[]});
          }
        } else {
          /* NAP maliyetsizdir; karşılık istemek anlamsız olurdu. */
          aiNegotiate(e, o, [{t:'nap'}], [],true);
        }
        break;
      }
    }
  }

  /* --- 6a. ticaret anlaşmaları --- */
  if (e.res.etk > 120 && prof.eco > .35){
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id || e.war[o.id]) continue;
      if (!e.contact[o.id] || (e.pact && e.pact[o.id])) continue;
      if (typeof diploBlocked === 'function' && diploBlocked(e, o)) continue;
      if (!canPact(e, o)) continue;
      const luxWant = LUX_KEYS.filter(k => intelOf(e,o.id)>=2 && ownLuxury(o)[k] && !ownLuxury(e)[k]).length;
      if (rnd() < .10 + prof.eco*.16 + (e.rel[o.id]+40)/400 + luxWant*.09){
        if (o.id === 0){
          // oyuncuya onay için teklif gönder, tek taraflı kurma
          e.lastProp = e.lastProp || 0;
          if (G.day - e.lastProp > 420){
            e.lastProp = G.day;
            const give = [];
            const r = (e.res.min > e.res.ene) ? 'min' : 'ene';
            const amt = Math.round(Math.min(e.res[r] * .18, 400) / 50) * 50;
            if (amt >= 100) give.push({t:'res', r, v: amt});
            UI.aiOffer({from:e.id, to:0, give, want:[{t:'pact'}]});
          }
        } else {
          /* ═══ FAZ 86C: AI-AI YOLU ARTIK KANONİK MOTORDAN GEÇER ═══
             Eskiden doğrudan `e.res.etk -= 70; makePact(e,o)` yapıyordu:
             kanonik doğrulamayı atlıyor ve tabloya UYMAYAN bir maliyet
             (70, oysa pact 40) kesiyordu. Artık aynı normalize →
             validate → quote → execute hattı kullanılır; maliyet,
             geçerlilik ve goodwill kuralları oyuncununkiyle aynıdır. */
          /* ═══ FAZ 86C.3: ARTIK KARŞILIKLI ═══
             Alıcı AI teklifi değerlendirir; reddedebilir veya karşı
             teklif verebilir. Tek taraflı dayatma kaldırıldı. */
          /* FAZ 86C.4: karşılıklı teklif — alıcı da bir bedel öder. */
          const tp = aiProposeTerms(e, o, 'pact');
          aiNegotiate(e, o, tp.give, tp.want,true);
        }
        break;
      }
    }
  }

  /* --- 6b. ittifak arayışı (diplomatik AI'lar) --- */
  if (prof.dip > .55 && e.res.etk > 200){
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id || e.ally[o.id] || e.war[o.id]) continue;
      if (!e.contact[o.id] || !canAlly(e, o)) continue;
      if (typeof diploBlocked === 'function' && diploBlocked(e, o)) continue;
      if (RACES[o.race].dip <= .05) continue;
      // ortak düşman varsa ittifak cazip
      const commonFoe = G.emps.some(x => !x.dead && e.war[x.id] && aiKnownWar(e,o,x));
      const chance = clamp((e.rel[o.id]+30)/180 * prof.dip + (commonFoe?.25:0), 0, .7);
      if (rnd() < chance){
        if (o.id === 0){
          // ittifak da artık onayına bağlı
          e.lastAllyProp = e.lastAllyProp || 0;
          if (G.day - e.lastAllyProp > 540){
            e.lastAllyProp = G.day;
            UI.aiOffer({from:e.id, to:0, give:[{t:'intel'}], want:[{t:'ally'}]});
          }
        } else {
          /* ═══ FAZ 86C: AI-AI İTTİFAKI DA KANONİK HATTA ═══
             Eskiden ham ilişki ataması (rel=55) ve tablo dışı 150 Etki
             ile motoru atlıyordu. `ally` maddesi applyItems içinde
             savaşı da bitirir; maliyet kanonik tablodan (90) gelir. */
          /* FAZ 86C.3: ittifak da karşılıklı müzakereden geçer. */
          /* FAZ 86C.4: ittifak da karşılıklı. */
          const ta = aiProposeTerms(e, o, 'ally');
          aiNegotiate(e, o, ta.give, ta.want,true);
        }
        break;
      }
    }
  }

  } // closed doctrines skip diplomacy, not military command

  /* --- 7. askerî hareket --- */
  const wars = G.emps.filter(o => !o.dead && e.war[o.id]);
  const armed = G.fleets.filter(f => f.e === e.id && isArmed(f) && !f.combat && !hasShipment(f) && !jointReserved(f));

  /* --- duruş seçimi: güç dengesine göre --- */
  for (const f of armed){
    const here = f.sys >= 0 ? threatAt(e, f.sys) : 0;
    const mine2 = fleetPower(f);
    /* ═══ FAZ 79: MİZAÇ DURUŞU BELİRLER ═══
       Doktrin, taktik hesabın üstüne biner. Fanatik Arındırıcılar
       geri çekilmeyi bilmez — ezilecekleri belliyken bile saldırır.
       Pasifist ve Teknokrat ise gemisini korumayı önceler. */
    const P2 = (typeof personaOf === 'function') ? personaOf(e) : null;
    const mizacAd = P2 ? P2.n : '';
    if (mizacAd === 'Fanatik Arındırıcılar'){
      f.stance = 'agresif';                              // asla ricat yok
    } else if (mizacAd === 'Pasifist' || mizacAd === 'Teknokrasi'){
      f.stance = (mine2 > here * 2.2) ? 'agresif' : 'savunma';
    } else if (mizacAd === 'Militarist'){
      f.stance = (here > mine2 * 1.9) ? 'savunma' : 'agresif';
    } else if (here > mine2 * 1.25) f.stance = 'savunma';  // ezileceksen korun
    else if (prof.war > .7 || mine2 > here * 1.6) f.stance = 'agresif';
    else f.stance = prof.turtle > .5 ? 'savunma' : 'agresif';
  }

  if (wars.length && armed.length){
    aiMilitaryCampaign(e,armed,my,wars);
  } else {
    // barışta: önce ödül avı, sonra devriye
    for (const f of armed){
      if (f.path.length || f.mv) continue;
      const pw = fleetPower(f);
      if (pw > 900 && rnd() < .35){
        const prizes = [];
        for (const sy of G.sys){
          if (!sy.seen.includes(e.id)) continue;
          if (sy.nest && sy.nest.hp > 0 && pw > sy.nest.hp * .35) prizes.push(sy);
          else if (sy.ruin && sy.ruin.hp > 0 && pw > sy.ruin.hp * .55) prizes.push(sy);
        }
        if (prizes.length){
          prizes.sort((a,b)=>dist(G.sys[f.sys], a) - dist(G.sys[f.sys], b));
          if (aiMove(e,f,prizes[0].id)) continue;
        }
      }
      if (rnd() > .25) continue;
      const border = my.filter(s => s.lanes.some(l => G.sys[l].owner !== e.id));
      if (border.length) aiMove(e,f,border[Math.floor(rnd()*border.length)].id);
    }
  }

  /* --- 8. ilişki sürüklenmesi --- */
  for (const o of G.emps){
    if (o.dead || o.id === e.id) continue;
    if (e.war[o.id]) e.rel[o.id] = clamp(e.rel[o.id]-2, -100, 100);
    else e.rel[o.id] = clamp(e.rel[o.id] + (race.dip>.5?1.2:0.3), -100, 100);
  }
}

function colonizeTargets(e){
  const out = [];
  for (const s of G.sys){
    if (!s.surv.includes(e.id)) continue;
    if (s.owner >= 0 && s.owner !== e.id) continue;
    for (const p of s.planets){
      if (p.owner >= 0) continue;
      const h = habOf(e, p);
      if (h >= 40) out.push({s:s.id, p:p.i, h});
    }
  }
  return out.sort((a,b)=>b.h-a.h);
}

/* --------------------------------------------------------------------
   AI YANITI — kabul / karşı teklif / red
   -------------------------------------------------------------------- */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 86C.3 — AI ↔ AI KARŞILIKLI MÜZAKERE

   ÖLÇÜLEN ESKİ DAVRANIŞ: AI-AI pact/ally yolları fırsat kapısından
   sonra DOĞRUDAN `executeDeal` çağırıyordu. Alıcı AI teklifi hiç
   değerlendirmiyor, reddedemiyor, karşı teklif veremiyordu — yani
   antlaşma tek taraflı dayatılıyordu. (86C'de maliyet tablosu
   düzeltilmişti ama karşılıklılık yoktu.)

   ARTIK aynı kanonik yol: normalize → validate → quote → evalOffer →
   aiRespond. Tek tur karşı teklif desteklenir; teklif eden AI karşı
   teklifi kendi `evalOffer`'ıyla değerlendirir. Sonsuz döngü yoktur:
   en fazla BİR karşı tur.

   ÖNEMLİ: bu fonksiyon oyuncuyu (id 0) ASLA hedef almaz — oyuncuya
   giden teklifler mevcut `UI.aiOffer` onay yolunda kalır. */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 86C.4 — KARŞILIKLI TEKLİF ŞEKLİ

   ÖLÇÜLEN SORUN: AI-AI teklifleri `give:[{t:'pact'}], want:[]`
   biçimindeydi. Alıcının maliyeti 0, kazancı +45 → net +45; kabul
   RASYONELDİ ve 3 seed × 360 ayda 159 müzakerenin 159'u kabul edildi.
   Pazarlık mekaniği çalışıyordu ama hiç DEVREYE GİRMİYORDU.

   ÇÖZÜM: teklif eden artık ölçülü bir KARŞILIK ister. Miktar
   `itemValue` ölçeğiyle (res ≈ v × 0.38 × ihtiyaç) antlaşmanın Etki
   maliyetine bağlanır, ilişkiye göre yumuşar ve alıcının stokunun
   dörtte biriyle sınırlanır. Böylece:
     · zengin ve dost alıcı  → kabul
     · fakir veya soğuk alıcı → ret ya da karşı teklif
   FIRSAT KAPILARI (rnd eşikleri, prof katsayıları, lastProp süreleri)
   DEĞİŞTİRİLMEDİ — yalnız teklifin İÇERİĞİ değişti. */
function aiProposeTerms(e, o, treaty){
  const give = [{t:treaty}];
  const want = [];
  if (!e || !o) return {give, want};
  const maliyet = (typeof dealCost === 'function')
    ? dealCost({from:e.id, to:o.id, give, want:[]}) : 0;
  if (maliyet <= 0) return {give, want};
  /* İlişki iyi → daha az iste; soğuk → daha çok. %20–%80 arası. */
  const rel = clamp(e.rel[o.id] || 0, -100, 100);
  const pay = clamp(0.55 - rel / 400, 0.20, 0.80);
  /* Etki maliyetini kaynak değerine çevir: itemValue res ≈ v×0.38 */
  const hedefDeger = maliyet * pay / 0.38;
  /* Alıcının EN BOL kaynağı — onu en az zorlayan karşılık. */
  const resources=aiKnownResources(e,o);
  let r = 'min';
  for (const k of ['min','ene','ala'])
    if ((resources[k] || 0) > (resources[r] || 0)) r = k;
  /* Stokunun dörtte birinden fazlasını ASLA isteme.
     ⚠ ÖLÇÜLEN HATA: `Math.round(x/10)*10` tavanı AŞIYORDU — stok 20
     iken tavan 5 olmasına rağmen 10 isteniyordu (round(0.5)=1).
     Aşağı yuvarlama tavanı garanti eder; 10'un altına düşen istek
     zaten anlamsız olduğu için hiç istenmez (teklif karşılıksız
     kalır ve alıcı bunu değerlendirir). */
  const tavan = intelOf(e,o.id)>=3 ? (resources[r]||0)*.25 : hedefDeger;
  const v = Math.floor(Math.min(hedefDeger, tavan) / 10) * 10;
  if (v >= 10) want.push({t:'res', r, v});
  return {give, want};
}

/* 86F: Ek taviz bütçesi. Teknoloji satıcısında itemValue(tech)=0
   (zaten biliyor) olduğundan paylaşım alıcıya kazandırdığı bilgi değeriyle
   sayılır. Bu ekonomik kesinti değil, AI'ın paylaşma isteği sınırıdır.
   Kaynak hediyesi simetrik antlaşma faydası sayılıp bütçeyi şişiremez.
   Normalize/effective plan redundant maddelerin katkısını dışarıda tutar. */
function aiCounterBudget(proposer,target,offer,extra){
  const n=normalizeDeal(offer);
  const symmetric=new Set(DEAL_SYMMETRIC);
  const seen=new Set();
  let benefit=0;
  for(const it of n.effectiveGive.concat(n.effectiveWant)){
    if(!symmetric.has(it.t)||seen.has(it.t))continue;
    seen.add(it.t);benefit+=Math.max(0,itemValue(proposer,it,target));
  }
  /* Saf kaynak/teknoloji takası: ancak kendi başlangıç fazlası varsa
     ek taviz düşünülebilir. Antlaşmaya yapay hediye eklemek katkı vermez. */
  if(!seen.size){
    const received=n.effectiveWant.reduce((sum,it)=>sum+itemValue(proposer,it,target),0);
    const paid=n.effectiveGive.reduce((sum,it)=>sum+(it.t==='tech'?itemValue(target,it,proposer):itemValue(proposer,it,target)),0);
    benefit=Math.max(0,received-paid);
  }
  const extraValue=extra.reduce((sum,it)=>sum+Math.max(0,it.t==='tech'
    ? itemValue(target,it,proposer):itemValue(proposer,it,target)),0);
  return {extraValue,benefit,cap:benefit*.60};
}

function aiNegotiate(proposer, target, give, want, automatic=false){
  if(!proposer||!target)return {tur:0,karar:null,uygulandi:false,why:'Geçersiz devlet',karsi:null};
  const talkKey=target.id+':'+(give||[]).concat(want||[]).map(x=>x.t+':'+(x.r||x.id||'')).sort().join('|');
  if(automatic){
    proposer.aiTalk=proposer.aiTalk||{};
    const old=proposer.aiTalk[talkKey];
    if(old&&old.until>G.day)return {tur:0,karar:'bekle',uygulandi:false,why:'Aynı öneri yeniden değerlendirme bekliyor',karsi:null};
    proposer.aiTalk[talkKey]={until:G.day+120};
  }
  const sonuc = {tur:0, karar:null, uygulandi:false, why:'', karsi:null};
  if (!proposer || !target) return sonuc;
  if (proposer.id === 0 || target.id === 0) return sonuc;   // oyuncu hariç
  if (proposer.dead || target.dead || proposer.wild || target.wild) return sonuc;

  const teklif = {from:proposer.id, to:target.id,
                  give:(give||[]).slice(), want:(want||[]).slice()};
  /* 1) Teklif ETMEDEN önce kendi kanonik kapısı */
  const q0 = dealQuote(teklif);
  if (!q0.ok){
    sonuc.karar = automatic?'bekle':'gecersiz';
    sonuc.why = (q0.fatal && q0.fatal[0]) || (q0.reasons && q0.reasons[0]) ||
                'teklif uygulanabilir değil';
    return sonuc;
  }
  /* 2) ALICI değerlendirir — oyuncuyla AYNI aiRespond yolu */
  sonuc.tur = 1;
  const r1 = aiRespond(target, teklif);
  sonuc.karar = r1.v;
  sonuc.why = r1.why || '';
  if (r1.v === 'kabul'){
    sonuc.uygulandi = executeDeal(teklif);
    return sonuc;
  }
  if (r1.v === 'red') return sonuc;

  /* 3) KARŞI TEKLİF — tek tur. Alıcının istediği ekler teklif edenin
        vermesi gereken maddelerdir. */
  if (r1.v === 'karsi' && Array.isArray(r1.add) && r1.add.length){
    const karsi = {from:proposer.id, to:target.id,
                   give:teklif.give.concat(r1.add), want:teklif.want.slice()};
    sonuc.karsi = r1.add.slice();
    sonuc.tur = 2;
    /* 3a) Karşı teklif kanonik olarak uygulanabilir mi? */
    const q1 = dealQuote(karsi);
    if (!q1.ok){
      sonuc.karar = 'karsi-gecersiz';
      sonuc.why = (q1.reasons && q1.reasons[0]) || 'karşı teklif uygulanabilir değil';
      return sonuc;
    }
    /* 3b) TEKLİF EDEN karşı teklifi DELTA olarak değerlendirir.
       ÖLÇÜLEN HATA: önce `tersi` teklifi kurulup `evalOffer` ile
       bakılıyordu. Bu, SİMETRİK antlaşmayı (pact/ally/nap) teklif
       eden için SAF MALİYET sayıyordu — oysa antlaşmadan o da
       yararlanıyor. Sonuç: teklif edenin kendi teklifine bakışı bile
       negatif çıkıyordu (ölçüldü: net −22.8) ve karşı teklif 3 seed
       boyunca HİÇ kabul edilmiyordu (karsi-kabul = 0).
       DOĞRUSU: teklif eden zaten orijinal teklifi yapmaya karar
       vermişti; karar YALNIZ EK karşılık hakkındadır. Ek, antlaşmanın
       teklif edene değerinin belirli bir oranını aşmadıkça kabul
       edilir. */
    const budget=aiCounterBudget(proposer,target,teklif,r1.add);
    const ekDeger=budget.extraValue, tavan=budget.cap;
    const ozelKilit = (typeof diploBlocked === 'function') &&
                      diploBlocked(proposer, target);
    if (ozelKilit || ekDeger > tavan){
      sonuc.karar = 'karsi-red';
      sonuc.why = ozelKilit
        ? 'doktrin anlaşmayı yasaklıyor'
        : ('istenen ek karşılık fazla — ' + Math.round(ekDeger) +
           ' değerinde ek, kabul tavanı ' + Math.round(tavan));
      return sonuc;
    }
    /* 3c) İKİNCİ karşı tur YOK — kabul veya ret. */
    sonuc.karar = 'karsi-kabul';
    sonuc.uygulandi = executeDeal(karsi);
    return sonuc;
  }
  sonuc.karar = 'red';
  return sonuc;
}

function aiRespond(ai, offer){
  /* ═══ FAZ 86C.1: İŞE dealQuote İLE BAŞLA ═══
     ÖLÇÜLEN ZAFİYET: eski hâl yalnız `q.fatal` bakıyordu. fatal=[] ama
     q.ok=false olan teklifler (ör. gönderende yetersiz Etki) canDeliver
     TRUE döndüğü için "kabul" edilebiliyordu. Artık q.ok false ise
     fatal olsun olmasın İLK ANLAMLI GEREKÇEYLE kesin RET. evalOffer
     yalnız geçerli, normalize edilmiş teklif için çalıştırılır. */
  const q = (typeof dealQuote === 'function') ? dealQuote(offer) : null;
  if (q && !q.ok){
    const neden = (q.fatal && q.fatal[0]) || (q.reasons && q.reasons[0]) ||
                  'Teklif uygulanabilir değil';
    return {v:'red', why:neden, quote:q};
  }
  const ev = evalOffer(ai, offer);
  /* ═══ FAZ 86C: SERT KİLİT PARA İLE AŞILAMAZ ═══ */
  if (ev.hardLock)
    return {v:'red', ev, why:(ev.why && ev.why[0]) || 'Doktrin anlaşmayı yasaklıyor'};
  /* Karşı tarafın istenenleri fiziksel olarak verebildiği ayrıca sınanır. */
  if (!canDeliverItems(ai, offer.want, G.emps[offer.from]))
    return {v:'red', ev, why:'İstediğin şeyleri veremeyiz.'};

  if (ev.net > 0) return {v:'kabul', ev};

  /* Eksiği GERÇEKTEN kapatan bir karşı teklif kur.
     Önceki sürüm yetersiz miktar önerip sonsuz döngüye giriyordu:
     artık ya açığı tam kapatır ya da açıkça imkânsız olduğunu söyler. */
  let gap = -ev.net * 1.06;                    // küçük güvenlik payı
  const from = G.emps[offer.from];
  const extra = [];
  /* evalOffer kazancı 'trust' ile ölçekler; karşı teklif hesabı da
     aynı ölçeği kullanmalı. Aksi hâlde AI kendi istediği miktarı
     ekledikten sonra bile "yetersiz" diyordu. */
  /* FAZ 86C: ölçek KANONİK quote'tan gelir — AI ayrı formül
     kopyalamaz (eskiden rel/220 + dip formülü burada tekrarlanıyordu
     ve evalOffer'ın capped çarpanıyla uyuşmuyordu). */
  const trustT = Math.max(.35, ev.gainMul || 1);

  // teklifte hâlihazırda ne kadar kaynak var? (üst üste yığmayı engelle)
  const already = {};
  for (const it of offer.give) if (it.t === 'res') already[it.r] = (already[it.r]||0) + it.v;

  const knownResources=aiKnownResources(ai,from,offer.give);
  const order = ['ala','min','ene','tuk'];
  for (const r of order){
    if (gap <= 0) break;
    const have = Math.max(0, (knownResources[r]||0) - (already[r]||0));
    if (have < 80) continue;
    const unit = itemValue(ai, {t:'res', r, v:100}, from) / 100 * trustT;   // birim değer
    if (unit <= 0) continue;
    const needAmt = Math.ceil(gap / unit);
    const canGive = Math.floor(have * .80);
    const take = Math.min(needAmt, canGive);
    /* 86F: küçük açıkta da asgari 20 birim teklif edilebilir.
       Eski take<20 kapısı, yeterli stok varken kaynağı atlayıp
       çok daha değerli teknoloji istiyordu. Stok tavanını denetle. */
    if (canGive < 20) continue;
    // YUKARI yuvarla — aşağı yuvarlamak minik bir açık bırakıp
    // sonraki kalemlerin "çok küçük" diye atlanmasına yol açıyordu
    const rounded = Math.min(canGive, Math.max(20, Math.ceil(take / 10) * 10));
    extra.push({t:'res', r, v: rounded});
    gap -= rounded * unit;
  }

  // hâlâ açık varsa teknolojiyle kapatmayı dene
  if (gap > 0){
    const av = Object.keys(aiKnownTechs(ai,from,offer.give)).filter(t => !ai.techs[t] && TECHS[t])
      .map(id=>({id,value:itemValue(ai,{t:'tech',id},from)*trustT}))
      .filter(x=>x.value>0)
      .sort((a,b)=>a.value-b.value || (a.id<b.id?-1:a.id>b.id?1:0));
    /* 86F: Açığı kapatan EN KÜÇÜK teknolojiyi seç. Tek teknoloji
       yetmiyorsa en büyük katkıyla ilerle; eşitlik ID ile deterministik.
       Kaynak karşılıkları hâlâ önce denenir, ikinci pazarlık turu yoktur. */
    while(gap>0&&av.length){
      const enough=av.findIndex(x=>x.value>=gap);
      const pick=av.splice(enough>=0?enough:av.length-1,1)[0];
      extra.push({t:'tech',id:pick.id});gap-=pick.value;
    }
  }

  if (gap <= 2) gap = 0;                 // yuvarlama artığını yok say
  if (gap <= 0 && extra.length){
    /* FAZ 86C.1: karşı teklifin KENDİSİ de kanonik quote'tan geçer;
       AI uygulanamaz bir karşı teklif öneremez. */
    if (typeof dealQuote === 'function'){
      const kq = dealQuote({from:offer.from, to:offer.to,
        give:(offer.give || []).concat(extra), want:(offer.want || []).slice(),
        born:offer.born, expires:offer.expires});
      if (!kq.ok)
        return {v:'red', ev,
                why:(kq.reasons && kq.reasons[0]) || 'Karşı teklif uygulanabilir değil'};
    }
    const list = extra.map(dealLabel).join(', ');
    return {v:'karsi', add: extra, ev,
            why:'Şunları da eklersen kabul ederiz: ' + list};
  }

  // açık kapatılamıyor — ne kadar eksik olduğunu net söyle
  const short = Math.round(Math.max(gap, -ev.net));
  const askMain = offer.want.map(i => dealLabel(i)).join(', ') || 'bu anlaşma';
  return {v:'red', ev,
          why: askMain + ' için elindekiler yetersiz. Yaklaşık ' + short +
               ' değerinde daha fazlasını masaya koymalısın — ya da daha az şey istemelisin.'};
}

/* AI'nın oyuncuya kendiliğinden teklif kurması */
function aiProposeTo(ai, target){
  const give = [], want = [];
  if (ai.war[target.id]){
    const ratio = totalPower(ai) / (aiKnownPower(ai,target) + 1);
    want.push({t:'peace'});
    if (ratio < .6){
      // kaybediyor: tazminat öner
      const r = (ai.res.min > ai.res.ene) ? 'min' : 'ene';
      const amt = Math.round(Math.min(ai.res[r] * .3, 600) / 50) * 50;
      if (amt >= 100) give.push({t:'res', r, v: amt});
    } else if (ratio > 1.7){
      // kazanıyor: haraç iste
      want.push({t:'tribute', r:'ene', v: 8});
    }
  } else {
    const theirLux = intelOf(ai,target.id)>=2?ownLuxury(target):{};
    const wantLux = LUX_KEYS.filter(k => theirLux[k] && !(ai.luxOwn && ai.luxOwn[k]));
    if (wantLux.length && !(ai.pact && ai.pact[target.id])){
      want.push({t:'pact'});
      const r = 'min';
      const amt = Math.round(Math.min(ai.res[r] * .2, 400) / 50) * 50;
      if (amt >= 100) give.push({t:'res', r, v: amt});
    } else if (G.emps.some(x=>ai.war[x.id]&&aiKnownWar(ai,target,x)) && !ai.ally[target.id] && canAlly(ai, target)){
      want.push({t:'ally'});
      give.push({t:'intel'});
    } else {
      // müttefikimiz bizim için savaşta kaldıysa onu kurtarmayı teklif et
      // sınırını kapalı tutan komşudan geçiş izni iste
      if (!(target.passage && target.passage[ai.id]) && !ai.ally[target.id] && rnd() < .4){
        want.push({t:'passage'});
        const r = 'min';
        const amt = Math.round(Math.min(ai.res[r] * .2, 400) / 50) * 50;
        if (amt >= 100) give.push({t:'res', r, v: amt});
        return {from: ai.id, to: target.id, give, want};
      }
      const stuck = G.emps.find(x => !x.dead && !x.wild && x.id !== ai.id &&
        x.proxyWar && x.proxyWar[target.id] === ai.id && x.war[target.id]);
      if (stuck && ai.ally[stuck.id]){
        want.push({t:'peaceWith', target: stuck.id});
        const r = 'min';
        const amt = Math.round(Math.min(ai.res[r] * .25, 500) / 50) * 50;
        if (amt >= 100) give.push({t:'res', r, v: amt});
      }
    }
  }
  if (!want.length) return null;
  return {from: ai.id, to: target.id, give, want};
}

/* ---------- MECLİS KONUŞMALARI ---------- */
const SPEECH = {
  war:['Barış güzeldir ama sınırlarımız kanla çizildi.',
       'Zayıflık davettir. Bu meclis güçlüye saygı duymalı.',
       'Silahlarımızı bırakırsak bizi kim koruyacak?'],
  dip:['Bu masada oturmak bile bir zaferdir. Onu harcamayalım.',
       'Galaksi savaşla değil sözle birleşir.',
       'Komşumuzun derdi bizim derdimizdir.'],
  eco:['Ticaret yolları kapalıyken kimse zengin olmaz.',
       'Bu kararın maliyetini kim ödeyecek? Rakamları konuşalım.',
       'Refah paylaşıldıkça büyür.'],
  sci:['Bilgi saklandığında çürür. Paylaşılmalı.',
       'Bu sorunun cevabı laboratuvarda, mecliste değil.',
       'Geleceği anlayan onu yönetir.'],
  turtle:['Sınırlarımızı savunmak saldırganlık değildir.',
       'Kalelerimiz kimseyi tehdit etmiyor.',
       'Biz kimseye gitmeyiz; kimse de bize gelmesin.']
};
function aiSpeech(e){
  const p = aiProfile(e);
  const best = ['war','dip','eco','sci','turtle'].reduce((a,b)=> (p[b]||0) > (p[a]||0) ? b : a, 'dip');
  const lines = SPEECH[best] || SPEECH.dip;
  return lines[Math.floor(rnd()*lines.length)];
}
/* ---------- AI KONSEY KURMA ----------
   Pasifist bir AI yeterince temas ve etki biriktirdiğinde konseyi
   kendi kurar. Oyuncu kurmazsa galakside yine de bir meclis doğar. */
function aiTryFoundCouncil(){
  if (councilExists()) return;
  if (councilPaceYears() === 0) return;
  // erken oyunda kimse kurmaz — ay sayacı, gün/yıl senkronundan bağımsız
  G.cncAge = (G.cncAge || 0) + 1;
  if (G.cncAge < 60) return;                   // ~5 yıl
  const cands = G.emps.filter(e => {
    if (e.dead || e.wild || !e.ai) return false;
    const mil = (e.ethics && e.ethics.mil) || 0;
    if (mil > -2) return false;
    if (false) return false;
    if (RACES[e.race].dip <= .02) return false;
    return canFoundCouncil(e).ok;
  });
  if (!cands.length) return;
  // en diplomatik ve en zengin aday öne çıkar
  cands.sort((a,b)=>{
    const pa = aiProfile(a), pb = aiProfile(b);
    return (pb.dip * 400 + b.res.etk) - (pa.dip * 400 + a.res.etk);
  });
  const founder = cands[0];
  if (rnd() > .18) return;                    // her ay değil, zamanla
  const r = foundCouncil(founder);
  if (r.ok && UI && UI.councilFounded) UI.councilFounded(founder);
}


/* ─────────────────────────────────────────────────────────────
   HAFIZA MEKANİZMASI
   AI geçmişi hatırlar: kim ihanet etti, kim sözünde durdu.
   Her olayın ağırlığı (w) ve unutulma hızı (fade) farklıdır —
   ihanet neredeyse hiç unutulmaz, yağmalanan kervan çabuk geçer.
   ───────────────────────────────────────────────────────────── */
const MEM_KINDS = {
  ihanet      :{n:'ittifakı bozup saldırdı', w:-95, fade:.03},
  komplo      :{n:'gizlice aramızı bozdu',    w:-42, fade:.04},
  sahteBayrak :{n:'suçunu bize yıkmaya çalıştı', w:-70, fade:.02},
  paktBozdu   :{n:'verdiği sözü çiğnedi',    w:-62, fade:.05},
  konseyIhlal :{n:'konsey kararını çiğnedi', w:-52, fade:.07},
  savasIlan   :{n:'sana savaş ilan etti',    w:-46, fade:.11},
  sistemAldi  :{n:'toprağını işgal etti',    w:-40, fade:.07},
  sabotaj     :{n:'tesisini sabote etti',    w:-42, fade:.13},
  casusYakalan:{n:'sınırına casus soktu',    w:-30, fade:.18},
  yaptirim    :{n:'sana ambargo uyguladı',   w:-26, fade:.20},
  kervanYagma :{n:'kervanını yağmaladı',     w:-18, fade:.26},
  sinirGergin :{n:'sınırında asker yığıyor', w:-14, fade:.30},

  yardimEtti  :{n:'savaşta yanında durdu',   w:+58, fade:.05},
  ittifakKurdu:{n:'seninle ittifak kurdu',   w:+42, fade:.10},
  teknolojiVer:{n:'sana teknoloji verdi',    w:+28, fade:.17},
  ticaretActi :{n:'ticaret yollarını açtı',  w:+22, fade:.21},
  konseyDestek:{n:'konseyde seni destekledi',w:+20, fade:.23},
  barisImzala :{n:'seninle barış imzaladı',  w:+18, fade:.25},
  gecisIzni   :{n:'sınırını sana açtı',      w:+16, fade:.27},
  hediye      :{n:'sana hediye gönderdi',    w:+14, fade:.31}
};

/* Bir olayı hafızaya yaz. subject = HATIRLAYAN, aboutId = HAKKINDA. */
// 89A: Kaynak kimliği yalnız ücretli olay çözümünde üretilir; RNG kullanmaz.
function memoryEvent(actor){
  actor.memoryEventSeq = (Number.isSafeInteger(actor.memoryEventSeq) && actor.memoryEventSeq >= 0
    ? actor.memoryEventSeq : 0) + 1;
  return actor.id + ':' + actor.memoryEventSeq;
}
function forgetMemoryEvent(subject, aboutId, source){
  // Eski v8 anıları kaynak taşımaz: hangi suçun anısı olduklarını tahmin etme.
  if (typeof source !== 'string' || !source || !subject || !subject.mem || !subject.mem[aboutId]) return;
  subject.mem[aboutId] = subject.mem[aboutId].filter(m => m.source !== source);
  if (!subject.mem[aboutId].length) delete subject.mem[aboutId];
}
function remember(subject, aboutId, kind, source){
  if (!subject || subject.dead || subject.wild) return;
  if (aboutId === undefined || aboutId === null || aboutId === subject.id) return;
  const K = MEM_KINDS[kind];
  if (!K) return;
  /* MİZAÇ: militarist kini ağır yaşar, pasifist zor tutar.
     Yalnız olumsuz anılar ölçeklenir — iyilik herkeste aynı sayılır. */
  const P = (typeof personaOf === 'function') ? personaOf(subject) : null;
  const w0 = (K.w < 0 && P) ? K.w * P.grudge : K.w;
  subject.mem = subject.mem || {};
  const list = subject.mem[aboutId] || (subject.mem[aboutId] = []);
  const now = G.memAge || 0;
  /* Aynı türden taze kayıt varsa yenisini açma, mevcudu derinleştir:
     beş kez kervan yağmalamak beş anı değil, tek derin yara olsun. */
  let recent = null;
  for (const m of list) if (m.k === kind && m.source === source && now - m.t < 12) recent = m;
  if (recent){
    recent.v = clamp(recent.v + w0 * .35, -150, 150);
    recent.t = now;
  } else {
    // İftira kayıtları ayrı çözülür; tekrarlanan taze suçun %35 ağırlığı korunur.
    const value = source && list.some(m => m.k === kind && now - m.t < 12) ? w0 * .35 : w0;
    list.push(Object.assign({k:kind, v:value, t:now}, source ? {source} : {}));
    if (list.length > 14) list.shift();
  }
}

/* Aylık solma + sınır gerginliğinin kendiliğinden anı üretmesi */
function memTick(){
  G.memAge = (G.memAge || 0) + 1;
  for (const e of G.emps){
    if (e.dead || e.wild) continue;
    /* aiProfile sonsuza kadar önbellekteydi: ideoloji reformu ve darbe
       sonrası profil güncellenmiyordu. Aylık tazeliyoruz. */
    e._prof = null;

    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    const forgive = P ? P.forgive : 1;
    if (e.mem){
      for (const id in e.mem){
        const list = e.mem[id];
        for (let j = list.length - 1; j >= 0; j--){
          const K = MEM_KINDS[list[j].k];
          /* Pasifist yaraları çabuk kapatır, militarist kanatır */
          const fd = (K ? K.fade : .2) * (list[j].v < 0 ? forgive : 1);
          list[j].v *= (1 - fd * .06);
          if (Math.abs(list[j].v) < 1.2) list.splice(j, 1);
        }
        if (!list.length) delete e.mem[id];
      }
    }
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id) continue;
      // 94D.1: adjacency is not evidence of hostile military activity.
      /* Hafıza ilişkiyi kendine çeker */
      const t = trustOf(e, o.id);
      if (t) e.rel[o.id] = clamp(e.rel[o.id] + clamp(t * .012, -.9, .9), -100, 100);
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FISILTI AĞLARI — zayıfın silahı
   Doğrudan savaşamayacak kadar küçük ama diplomatik olarak becerikli
   devletler, Etki puanını kullanarak İKİ BAŞKA devletin arasını bozar.
   Amaç hayatta kalmak: iki devi birbirine düşür, sen nefes al.
   ═══════════════════════════════════════════════════════════════════ */

const WHISPER_COST = 45;          // etki bedeli
const FALSE_FLAG_EXTRA    = 35;   // sahte bayrağın ek etki bedeli
const FALSE_FLAG_RISK_MUL = 1.55; // sahte iz bırakmak ifşa riskini artırır
const WHISPER_BASE = .05;         // taban aylık deneme şansı

/* Bu devlet fısıltı yapabilir mi ve ne kadar isteklidir? */
function whisperAptitude(e){
  if (!e || e.dead || e.wild || !e.ai) return 0;
  if (e.res.etk < WHISPER_COST) return 0;
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {dip:.5, war:.5, sci:.5};
  const P    = (typeof personaOf === 'function') ? personaOf(e) : null;

  /* Diplomatik beceri temel yetenektir */
  let apt = prof.dip * .8 + prof.sci * .2;

  /* Mizaç: entrika zayıfın ve tüccarın işidir, militarist küçümser */
  if (P){
    if (P.n === 'Tüccar')       apt *= 1.45;
    else if (P.n === 'Pasifist')apt *= 1.35;
    else if (P.n === 'Fanatik Arındırıcılar') apt *= 1.10;
    else if (P.n === 'Militarist')   apt *= .45;   // "kılıcım varken niye fısıldayayım"
  }
  /* Gölge Konseyi ve Panoptikon doktrinleri entrikayı meslek edinir */
  if (typeof hasCivic === 'function'){
    if (hasCivic(e, 'shadow')) apt *= 1.8;
    if (hasCivic(e, 'panopt')) apt *= 1.3;
  }
  /* ZAYIFLIK ÇARPANI — asıl motivasyon budur.
     Galaksinin ortalamasından zayıfsan entrikaya muhtaçsın. */
  let ortalama = 0, n = 0;
  for (const o of G.emps){
    if (o.dead || o.wild) continue;
    ortalama += aiKnownPower(e,o); n++;
  }
  ortalama = n ? ortalama / n : 1;
  const benim = totalPower(e) + 1;
  const zayiflik = clamp(ortalama / benim, .5, 3.0);
  return apt * zayiflik;
}

/* Hedef çifti seç: bana en çok tehdit olan İKİ devlet, birbirine
   ne kadar yakınsa fısıltı o kadar değerli. */
function whisperTarget(e){
  const cands = G.emps.filter(o =>
    !o.dead && !o.wild && o.id !== e.id && e.contact[o.id] && aiOpPolicy(e,o,'whisper'));
  if (cands.length < 2) return null;

  let best = null;
  for (let i = 0; i < cands.length; i++){
    for (let j = i + 1; j < cands.length; j++){
      const a = cands[i], b = cands[j];
      if (aiKnownWar(e,a,b)) continue;

      /* Tehdit algısı: ikisi de benden güçlüyse ve bana yakınsa tehlike */
      const myPow = totalPower(e) + 1;
      const tA = clamp(aiKnownPower(e,a) / myPow, 0, 4);
      const tB = clamp(aiKnownPower(e,b) / myPow, 0, 4);
      let skor = (tA + tB) * .55;

      /* Aralarındaki yakınlık büyükse bozmak daha kıymetli */
      const aralari = intelOf(e,a.id)>=3 ? trustOf(a,b.id) : 0;
      if (intelOf(e,a.id)>=3&&a.ally[b.id]) skor += 1.4;                // ittifaklarını bozmak en kârlısı
      skor += clamp(aralari / 60, -.5, 1.0);

      /* Bana düşmansa onu birine bulaştırmak ekstra değerli */
      if (a.war[e.id] || b.war[e.id]) skor += .9;
      if ((typeof grudgeOf === 'function') &&
          (grudgeOf(e, a.id) > 30 || grudgeOf(e, b.id) > 30)) skor += .5;

      /* Militarist devleti kışkırtmak daha kolay: barut zaten kuru */
      if (typeof personaOf === 'function'){
        if (personaOf(a).n === 'Militarist') skor += .45;
        if (personaOf(b).n === 'Militarist') skor += .45;
      }
      /* Sınır komşusu olmayan ikiliyi kavga ettirmek zordur */
      const komsu = aiKnownSystems(e,a.id).some(sy=>sy.lanes.some(l=>aiKnownSystem(e,G.sys[l])?.owner===b.id));
      if (!komsu) skor -= .8;

      if (!best || skor > best.skor) best = {a, b, skor};
    }
  }
  return (best && best.skor > .9) ? best : null;
}

/* Fısıltı operasyonu: iki devletin arasına kin ek */
/* ── Fısıltı olasılıkları ──
   Hem AI hem OYUNCU aynı formülleri kullanır; arayüz bu iki
   fonksiyonu çağırarak oyuncuya gerçek oranları gösterir. */
function whisperSuccessChance(e){
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {dip:.5, sci:.5};
  /* Diplomasi ikna eder, bilim izleri temizler */
  return clamp(.45 + prof.dip * .28 + prof.sci * .12, .20, .88);
}
function whisperExposureRisk(e, a, b){
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {dip:.5, sci:.5};
  let risk = .18;
  if (typeof hasCivic === 'function'){
    if (hasCivic(e, 'shadow')) risk = .04;                 // Gölge Konseyi
    if (hasCivic(e, 'panopt')) risk -= .03;
    if (a && hasCivic(a, 'counter')) risk += .11;
    if (b && hasCivic(b, 'counter')) risk += .11;
  }
  risk -= prof.dip * .05 + prof.sci * .04;
  /* Hedefin sensör ağı da iz bırakır */
  const sens = ((a && a.mods && a.mods.sensor) || 0) + ((b && b.mods && b.mods.sensor) || 0);
  risk += sens * .03;
  return clamp(risk, .02, .60);
}

/* blame verilirse SAHTE BAYRAK: kurbanlar suçu üçüncü tarafta bilir.
   Kazanç büyük — ama ifşa olursa üç devlet birden düşman kesilir. */
function whisperCheck(e, a, b, blame){
  for (const target of [a,b]){
    const q = spyTargetCheck(e, target);
    if (!q.ok) return q;
  }
  if (a.id === b.id) return {ok:false, why:'İki farklı hedef seç'};
  if (a.war[b.id] || b.war[a.id]) return {ok:false, why:'Zaten savaştalar — bozacak bir şey yok'};
  if (blame){
    if (G.emps[blame.id] !== blame || blame.dead || blame.wild ||
        [e.id,a.id,b.id].includes(blame.id)) return {ok:false, why:'Suçlanacak devlet geçersiz'};
    if (!a.contact[blame.id] || !b.contact[blame.id])
      return {ok:false, why:'Hedefler suçlanan tarafı tanımıyor — inandırıcı olmaz'};
  }
  const cost = WHISPER_COST + (blame ? FALSE_FLAG_EXTRA : 0);
  return e.res.etk >= cost ? {ok:true, cost} : {ok:false, why:cost + ' etki gerekir'};
}
/* whisperLog eski karşı istihbarat sözleşmesini korur. opLog yalnız actor
   ekranının özetidir; ikinci bir mağdur/soruşturma kaydı açılmaz. */
function whisperResult(e, a, b, blame, basari, ifsa, source){
  const cost = WHISPER_COST + (blame ? FALSE_FLAG_EXTRA : 0);
  const outcome = basari ? (ifsa ? 'basari-ifsa' : 'basari') : (ifsa ? 'ifsa' : 'sonucsuz');
  const msg = (basari ? a.name + ' ile ' + b.name + ' arası bozuldu' : 'Fısıltı sonuçsuz kaldı') +
    (blame && basari ? (ifsa ? ' — iftira açığa çıktı' : ' — suç ' + blame.name + ' üstüne yıkıldı') : '') +
    (ifsa ? ' · ağın ifşa oldu' : ' · anında ifşa olmadı');
  e.opLog = e.opLog || [];
  e.opLog.push({t:G.memAge || 0, k:blame?'whisperFrame':'whisper', o:a.id, other:b.id,
    caught:ifsa, outcome, cost, actorSummary:msg});
  if (e.opLog.length > 20) e.opLog.splice(0,e.opLog.length-20);
  // ok eski runWhisper sözleşmesinde etki başarısıdır; resolved ücretli denemedir.
  return {ok:basari, resolved:true, basarili:basari, ifsa, caught:ifsa, outcome, cost, msg, source};
}
function runWhisper(e, a, b, blame){
  const q = whisperCheck(e, a, b, blame);
  if (!q.ok) return Object.assign({resolved:false},q);
  e.res.etk -= WHISPER_COST + (blame ? FALSE_FLAG_EXTRA : 0);
  const source = memoryEvent(e);
  let ifsaRisk = whisperExposureRisk(e, a, b);
  if (blame) ifsaRisk *= FALSE_FLAG_RISK_MUL;      // iz gizlemek zordur
  ifsaRisk = clamp(ifsaRisk, .02, .75);
  const basari = rnd() < whisperSuccessChance(e) * (blame ? .88 : 1);
  /* SAHTE BAYRAK: kurbanlar öfkelerini masum üçüncü tarafa yöneltir */
  if (basari && blame && typeof remember === 'function' &&
      blame.id !== a.id && blame.id !== b.id && blame.id !== e.id){
    remember(a, blame.id, 'komplo', source);
    remember(b, blame.id, 'komplo', source);
    a.rel[blame.id] = clamp(a.rel[blame.id] - 18, -100, 100);
    b.rel[blame.id] = clamp(b.rel[blame.id] - 18, -100, 100);
    if (blame.id === 0)
      say('İKİ DEVLET SENİ SUÇLUYOR — yapmadığın bir komplo üstüne yıkıldı', 'war');
  }
  if (basari && typeof remember === 'function'){
    /* İki taraf da diğerini suçlar — kaynak görünmez kalır */
    remember(a, b.id, 'sinirGergin');
    remember(b, a.id, 'sinirGergin');
    a.rel[b.id] = clamp(a.rel[b.id] - 9, -100, 100);
    b.rel[a.id] = clamp(b.rel[a.id] - 9, -100, 100);
    /* İttifakları varsa çatlatmaya çalış */
    if (a.ally[b.id] && rnd() < .25){
      a.ally[b.id] = false; b.ally[a.id] = false;
      if (typeof setColdWar === 'function') setColdWar(a, b, 3);
      if (a.id === 0 || b.id === 0)
        say('İTTİFAKIN ÇATLADI — arkasında bir el olabilir', 'war');
    }
  }
  /* İfşa: kaynak ortaya çıkarsa iki taraf da fısıldayana kin tutar */
  if (rnd() < ifsaRisk){
    if (typeof remember === 'function'){
      /* Sahte bayrak ifşası çok daha ağırdır: suçu yıkılmak istenen
         taraf da olayı öğrenir ve üç devlet birden düşman kesilir. */
      const kind = blame ? 'sahteBayrak' : 'casusYakalan';
      remember(a, e.id, kind);
      remember(b, e.id, kind);
      if (blame && blame.id !== e.id){
        remember(blame, e.id, 'sahteBayrak');
        blame.rel[e.id] = clamp(blame.rel[e.id] - 35, -100, 100);
        /* yıkılmak istenen taraf temize çıkar */
        forgetMemoryEvent(a, blame.id, source);
        forgetMemoryEvent(b, blame.id, source);
        if (blame.id === 0) say('ADIN TEMİZE ÇIKTI — komployu ' + e.name + ' kurmuş', 'win');
      }
    }
    a.rel[e.id] = clamp(a.rel[e.id] - 22, -100, 100);
    b.rel[e.id] = clamp(b.rel[e.id] - 22, -100, 100);
    if (a.id === 0 || b.id === 0)
      say('FISILTI AĞI İFŞA OLDU — ' + e.name + ' arayı bozmaya çalışıyormuş', 'war');
    return whisperResult(e, a, b, blame, basari, true, source);
  }
  return whisperResult(e, a, b, blame, basari, false, source);
}

/* ── OYUNCU FISILTISI ──
   Oyuncu da aynı riske tabidir: aynı başarı formülü, aynı ifşa riski,
   aynı gecikmeli komplo ifşası ve aynı "İstihbarat Sabotajı" savaş
   nedeni. Entrika yapan bedelini öder — oyuncu dahil. */
function playerWhisper(a, b, blame){
  const e = G.p;
  const r = runWhisper(e, a, b, blame);
  if (!r.resolved) return r;
  e.whisperLog = e.whisperLog || [];
  e.whisperLog.push({a:a.id, b:b.id, ok:r.ok, ifsa:r.ifsa, source:r.source,
                     blame: blame ? blame.id : undefined,
                     t:(G.memAge || 0), found:r.ifsa});
  if (e.whisperLog.length > 40) e.whisperLog.shift();
  return Object.assign({},r,{ok:true, basari:r.ok});
}

/* ── SAHTE BAYRAK HEDEFİ ──
   Suçu kime yıkmalı? En kârlısı, kurbanların zaten şüphelendiği ve
   bizim de zayıflatmak istediğimiz güçlü bir üçüncü taraftır.
   Yalnız becerikli entrikacılar dener: Gölge Konseyi ve Tüccarlar. */
function pickBlameTarget(e, a, b){
  if (e.res.etk < WHISPER_COST + FALSE_FLAG_EXTRA) return null;
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  let egilim = 0;
  if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) egilim += .55;
  if (P){
    if (P.n === 'Tüccar')            egilim += .42;
    else if (P.n === 'Fanatik Arındırıcılar') egilim += .26;
    else if (P.n === 'Pasifist')     egilim += .22;
    else if (P.n === 'Militarist')   egilim -= .10;   // dolambaçlı yolu sevmez
  }
  if (rnd() > clamp(egilim, 0, .70)) return null;

  const cands = G.emps.filter(o => !o.dead && !o.wild &&
    o.id !== e.id && o.id !== a.id && o.id !== b.id &&
    e.contact[o.id] && intelOf(e,a.id)>=3 && intelOf(e,b.id)>=3 && a.contact[o.id] && b.contact[o.id] && aiOpPolicy(e,o,'whisperFrame'));
  if (!cands.length) return null;

  let best = null;
  for (const o of cands){
    /* Taban inandırıcılık: her devletin gizli ajandası olduğu varsayılır */
    let skor = .40;
    /* Kurbanlar ondan zaten hoşlanmıyorsa suç kolay yapışır */
    skor += clamp((-a.rel[o.id] - b.rel[o.id]) / 160, -.25, .90);
    /* Kârlılık: güçlü bir rakibi düşman etmek işimize gelir */
    skor += clamp(aiKnownPower(e,o) / (totalPower(e) + 1), 0, 3) * .28;
    if (typeof grudgeOf === 'function') skor += grudgeOf(e, o.id) / 140;
    /* Komşuluk iftirayı inandırıcı kılar */
    const komsu = aiKnownSystems(e,o.id).some(sy=>sy.lanes.some(l=>[a.id,b.id].includes(aiKnownSystem(e,G.sys[l])?.owner)));
    if (komsu) skor += .30;
    /* Harika inşa eden devlet zaten şüphe çeker — günah keçisi olmaya hazır */
    if (typeof megaBuilds === 'function' && megaBuilds(o).some(w=>aiView(e).ctx.visible.has(w.sys.id))) skor += .35;
    if (!best || skor > best.skor) best = {o, skor};
  }
  return (best && best.skor > .70) ? best.o : null;
}

/* Aylık fısıltı turu — diploTick çağırır */
function whisperTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;
    const apt = whisperAptitude(e);
    if (apt <= 0) continue;
    if (rnd() > clamp(WHISPER_BASE * apt, .005, .22)) continue;

    const t = whisperTarget(e);
    if (!t) continue;
    const blame = pickBlameTarget(e, t.a, t.b);
    const r = runWhisper(e, t.a, t.b, blame);
    if (!r.resolved) continue;
    e.whisperLog = e.whisperLog || [];
    /* found: sonradan çözüldü mü? Faz 4'te karşı istihbarat bu kaydı
       yıllar sonra ortaya çıkarabilir. İfşa olmuş operasyon zaten
       bilindiğinden yeniden çözülmez. */
    e.whisperLog.push({a:t.a.id, b:t.b.id, ok:r.ok, ifsa:r.ifsa, source:r.source,
                       blame: blame ? blame.id : undefined,
                       t:(G.memAge||0), found:r.ifsa});
    /* Kayıt defteri ifşa penceresinden (CI_MAX_AGE = 20 yıl) kısa
       olmamalı. 24 kayıtla sınırlıyken çok aktif bir fısıltıcının eski
       operasyonları daha çözülemeden siliniyor, yani entrika cezasız
       kalıyordu. Artık önce soğumuş dosyalar (çözülmüş ya da ifşa
       penceresini geçmiş) budanır; çözülmemiş taze izler korunur. */
    const simdiW = G.memAge || 0;
    if (e.whisperLog.length > 24){
      const taze = e.whisperLog.filter(w => !w.found && w.ok &&
                                            (simdiW - w.t) <= CI_MAX_AGE);
      const soguk = e.whisperLog.filter(w => !(!w.found && w.ok &&
                                            (simdiW - w.t) <= CI_MAX_AGE));
      /* önce soğuk dosyaları at; hâlâ taşıyorsa en eski taze izi bırak */
      e.whisperLog = soguk.slice(Math.max(0, soguk.length - Math.max(0, 40 - taze.length)))
                          .concat(taze);
      if (e.whisperLog.length > 40) e.whisperLog = e.whisperLog.slice(-40);
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   KARŞI İSTİHBARAT — GECİKMELİ İFŞA
   Bir fısıltı operasyonu anında yakalanmadıysa iz bırakır. Bilimi ve
   diplomasisi güçlü devletler bu izi aylar, hatta yıllar sonra
   tesadüfen çözebilir. Entrika unutulmaz; sadece gecikir.
   ═══════════════════════════════════════════════════════════════════ */

const CI_BASE      = .012;   // aylık taban çözme şansı
const CI_MAX_AGE   = 240;    // 20 yıldan eski izler soğur

/* Bir devletin komplo çözme gücü */
function counterIntel(e){
  if (!e || e.dead || e.wild) return 0;
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {sci:.5, dip:.5};
  let ci = prof.sci * .65 + prof.dip * .35;
  if (typeof hasCivic === 'function'){
    if (hasCivic(e, 'counter')) ci *= 2.2;      // Karşı İstihbarat doktrini
    if (hasCivic(e, 'panopt'))  ci *= 1.4;      // Panoptikon
    if (hasCivic(e, 'shadow'))  ci *= 1.3;      // gölgeyi gölge tanır
  }
  ci *= 1 + (e.mods && e.mods.sensor ? e.mods.sensor * .18 : 0);
  return ci;
}

/* Aylık tarama: mağdurlar geçmişteki komployu çözebilir mi? */
function counterIntelTick(){
  const simdi = G.memAge || 0;
  for (const casus of G.emps){
    if (casus.dead || casus.wild || !casus.whisperLog) continue;

    for (const w of casus.whisperLog){
      if (w.found || !w.ok) continue;            // zaten bilinen ya da başarısız
      const yas = simdi - w.t;
      if (yas < 2 || yas > CI_MAX_AGE) continue; // taze iz yok, çok eski iz soğuk

      const a = G.emps[w.a], b = G.emps[w.b];
      if (!a || !b || a.dead || b.dead) continue;

      /* İki mağdurdan güçlü olanı soruşturmayı yürütür */
      const ciA = counterIntel(a), ciB = counterIntel(b);
      const ci  = Math.max(ciA, ciB);
      if (ci <= 0) continue;

      /* İz zamanla soğur, ama casus hakkında istihbaratın varsa
         bağlantıyı kurmak kolaylaşır */
      const soguma = clamp(1 - yas / CI_MAX_AGE, .15, 1);
      let sans = CI_BASE * ci * soguma;
      if (typeof intelOf === 'function'){
        const lvl = Math.max(intelOf(a, casus.id), intelOf(b, casus.id));
        sans *= 1 + lvl * .45;                   // sızmış olmak delil verir
      }
      if (typeof hasCivic === 'function' && hasCivic(casus, 'shadow')) sans *= .35;

      if (rnd() > clamp(sans, 0, .30)) continue;

      /* ─── KOMPLO ORTAYA ÇIKTI ─── */
      w.found = true;
      w.foundAt = simdi;
      if (typeof remember === 'function'){
        /* Sahte bayraksa ceza katmerlidir: suçu yıkılmak istenen
           taraf da gerçeği öğrenir ve üç devlet birden düşman olur. */
        const sahte = (w.blame !== undefined) ? G.emps[w.blame] : null;
        const kind = sahte ? 'sahteBayrak' : 'komplo';
        remember(a, casus.id, kind);
        remember(b, casus.id, kind);
        if (sahte && !sahte.dead && sahte.id !== casus.id){
          remember(sahte, casus.id, 'sahteBayrak');
          sahte.rel[casus.id] = clamp(sahte.rel[casus.id] - 35, -100, 100);
          /* iftira temizlenir */
          forgetMemoryEvent(a, sahte.id, w.source);
          forgetMemoryEvent(b, sahte.id, w.source);
          if (sahte.id === 0)
            say('ADIN TEMİZE ÇIKTI — o komployu ' + casus.name + ' kurmuş', 'win');
          else if (casus.id === 0)
            say('SAHTE BAYRAĞIN ÇÖKTÜ — ' + sahte.name + ' de gerçeği öğrendi', 'war');
        }
      }
      a.rel[casus.id] = clamp(a.rel[casus.id] - 30, -100, 100);
      b.rel[casus.id] = clamp(b.rel[casus.id] - 30, -100, 100);
      /* Mağdurlar birbirine ısınır: ortak bir düşman buldular */
      a.rel[b.id] = clamp(a.rel[b.id] + 12, -100, 100);
      b.rel[a.id] = clamp(b.rel[a.id] + 12, -100, 100);

      /* Komplo galaksinin geri kalanında da itibar aşındırır */
      for (const x of G.emps){
        if (x.dead || x.wild || x.id === casus.id || x.id === a.id || x.id === b.id) continue;
        if (rnd() < .4) x.rel[casus.id] = clamp(x.rel[casus.id] - 8, -100, 100);
      }

      const yil = Math.round(yas / 12);
      if (a.id === 0 || b.id === 0)
        say('KOMPLO ORTAYA ÇIKTI — ' + casus.name + ', ' + yil +
            ' yıl önce ' + (a.id === 0 ? b.name : a.name) + ' ile aramızı bozmuş!', 'war');
      else if (casus.id === 0)
        say('FISILTIN AÇIĞA ÇIKTI — ' + a.name + ' ve ' + b.name +
            ' ' + yil + ' yıl önceki operasyonunu çözdü', 'war');
      break;                                     // ayda bir devlet, bir komplo
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 6 — AI UZAY İNŞAATI VE HARİKA HIRSI
   AI daha önce hiç uzay yapısı kurmuyordu; bu yüzden Megayapı
   Kıskançlığı yalnızca oyuncu inşa ettiğinde tetikleniyordu.
   Artık yapay zekâ da altyapı kurar ve zenginleşince harikaya soyunur.
   ═══════════════════════════════════════════════════════════════════ */

/* Bu sistemde hangi yapı mantıklı? Mega yapı yalnız zengin ve
   gelişmiş imparatorlukların hırsıdır. */
function aiPickStruct(e, sys, plan=aiEconomyPlan(e)){
  if (typeof STRUCTS === 'undefined' || typeof structAllowed !== 'function') return null;
  const izinli = Object.keys(STRUCTS).filter(k => structAllowed(e, sys, k));
  if (!izinli.length) return null;

  const karsilar = k => {
    const c = structCost(e, k);
    const pay = STRUCTS[k].mega ? 1.02 : 1.25;   // harikada tam bütçe yeter
    return Object.keys(c).every(r => (e.res[r] || 0) >= c[r] * pay);
  };
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  const prof = aiProfile(e);

  /* ── HARİKA HIRSI ──
     Yeterince zengin ve teknolojik AI, galaksiyi değiştirecek bir
     yapıya soyunur. Zaten bir harika inşa ediyorsa ikinciye kalkmaz. */
  const zatenMega = (typeof megaBuilds === 'function') ? megaBuilds(e).length : 0;
  if (!zatenMega){
    const tek = Object.keys(e.techs || {}).length;
    const zengin = (e.res.min || 0) > 2100 && (e.res.ala || 0) > 720;
    if (zengin && tek >= 11){
      /* Materyalist/Bilimci ve Yayılmacılar harikaya daha isteklidir */
      let hirs = .30 + prof.sci * .35 + prof.eco * .20;
      if (P){
        if (P.n === 'Yayılmacı') hirs += .20;
        else if (P.n === 'Fanatik Arındırıcılar') hirs -= .15;
        else if (P.n === 'Militarist') hirs -= .10;
      }
      if (typeof hasCivic === 'function' && hasCivic(e, 'megaeng')) hirs += .35;
      /* Karar aiStructTick'te bir kez verilir (e.megaWill); burada
         zar atmak hedef seçimi ile inşaat anını çelişkiye düşürüyordu. */
      if (e.megaWill){
        const megalar = izinli.filter(k => STRUCTS[k].mega && karsilar(k));
        if (megalar.length) return megalar.sort((a,b)=>Number(b==='dyson')-Number(a==='dyson')||a.localeCompare(b))[0];
      }
    }
  }

  /* Productive infrastructure precedes idle relays/defences. No hidden threat read. */
  const oncelik=[];
  if(e.techs.x_observer&&!e.crisis&&(e.inc.ene||0)>8)oncelik.push('derin_goz');
  if(plan.rows.min.urgency>2)oncelik.push('maden_ist');
  if((e.inc.ara||0)<30)oncelik.push('bilim_ist');
  const border=sys.lanes.some(id=>{const r=aiKnownSystem(e,G.sys[id]);return r&&r.owner>=0&&r.owner!==e.id&&(e.war[r.owner]||(e.rel[r.owner]||0)<-40);});
  if(prof.war>.7&&border)oncelik.push('platform');
  if(!G.sys.some(s=>s.owner===e.id&&hasYard(s)))oncelik.push('tersane_h');
  if((e.trade?.links||[]).some(l=>!l.bl&&l.path?.includes(sys.id)))oncelik.push('tic_ist');
  oncelik.push('maden_ist','bilim_ist');
  if(G.fleets.some(f=>f.e===e.id&&(f.path||[]).includes(sys.id)))oncelik.push('role');
  oncelik.push('karakol','sensor');

  for (const k of oncelik)
    if (izinli.includes(k) && !STRUCTS[k].mega && karsilar(k)) return k;
  return null;
}

/* İnşaatçı için hedef sistem seç: kendi bölgemizde, güvenli ve
   henüz yapısı olmayan bir yer. */
/* Candidate search is bounded after inexpensive economic/safety ranking.
   RemoteConstruction still owns legal routes, payments, movement and completion. */
function aiConstructionCandidate(e,f,budget={routes:6}){
 const plan=aiEconomyPlan(e),view=aiView(e),assigned=new Set(Object.values(G.construction?.queues||{}).flat().map(t=>t.system));
 const candidates=[],inventory=aiShipInventory(e),navalReserve=inventory.combatUsage<e.cap*.35?(shipCost(e,'kor').ala||0)*2:0;
 for(const sy of G.sys){
  const record=aiKnownSystem(e,sy);if(!record||!view.ctx.known.has(sy.id)||record.owner>=0&&record.owner!==e.id||assigned.has(sy.id)||sy.work?.length)continue;
  if(view.ctx.visible.has(sy.id)&&(sy.nest||sy.ruin)||view.ctx.pirates.has(sy.id)||aiObservedThreat(e,sy.id)>0)continue;
  const key=aiPickStruct(e,sy,plan);if(!key)continue;
  if((G.construction?.history||[]).some(t=>t.empire===e.id&&t.system===sy.id&&t.key===key&&['failed','lost'].includes(t.state)&&G.day-(t.finished||0)<120))continue;
  const cost=structCost(e,key);if(Object.entries(cost).some(([r,v])=>(e.res[r]||0)-(plan.committed[r]||0)<v*1.1+(r==='ala'?navalReserve:0)))continue;
  const S=STRUCTS[key];if((S.g?.ene||0)<0&&plan.rows.ene.net<0)continue;
  if(plan.critical&&!Object.entries(S.g||{}).some(([r,v])=>v>0&&plan.rows[r]?.net<0&&plan.rows[r]?.months<6))continue;
  let benefit=0;for(const [r,v]of Object.entries(S.g||{}))benefit+=v*(1+(plan.rows[r]?.urgency||0)/8);
  if(key==='dyson')benefit+=45*(1+plan.rows.ene.urgency/8);
  if(key==='platform')benefit+=aiObservedThreat(e,sy.id)*.05;
  if(key==='tersane_h'&&!aiShipInventory(e).yards.length)benefit+=25;
  if(key==='karakol')benefit+=5; // claim has a real access benefit, no fabricated income
  const distance=dist(G.sys[f.sys],sy),score=benefit*20+(record.owner===e.id?40:0)-distance*.2-(cost.min||0)*.03-(cost.ala||0)*.08;
  candidates.push({sy,key,score,cost});
 }
 candidates.sort((a,b)=>b.score-a.score||a.sy.id-b.sy.id);
 for(const c of candidates.slice(0,6)){
  if(budget.routes<=0)break;budget.routes--;
  const route=typeof RemoteConstruction!=='undefined'?RemoteConstruction.route(e,f,c.sy,f.sys):aiKnownRoute(e,f,f.sys,c.sy.id)?.path;
  if(route)return {...c,route};
 }
 return null;
}
function aiStructTarget(e,f){return aiConstructionCandidate(e,f)?.sy||null;}

/* Aylık uzay inşaatı turu */
/* ═══ FAZ 62: AI GEZEGEN OTOMASYONU ═══
   Faz 61'in yönelim sistemi (col.auto) yalnız oyuncuda açıktı.
   AI kolonileri kurulunca odak alıyor ama otomasyon bayrağı
   düşmüyordu. Yeni koloniye odak verildiğinde AI için de açılır —
   directiveTick zaten tüm devletleri geziyor, bütçe kilidi ortak. */
function aiDirectiveTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    for (const c of (e.colonies || [])){
      const sys = G.sys[c.s];
      const pl = sys && sys.planets[c.p];
      if (!pl || !pl.col) continue;
      if (pl.col.auto !== undefined) continue;      // karar verilmiş
      /* Odağı olan her AI kolonisi otomasyona girer */
      pl.col.auto = !!pl.col.f;
    }
  }
}

function aiStructTick(){
 if(typeof startStruct!=='function')return;
 const remote=typeof RemoteConstruction==='undefined'?null:RemoteConstruction,searchBudget={routes:32};
 const actors=G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide&&e.ai&&e.id!==0),offset=Math.floor(G.day/30)%Math.max(1,actors.length);
 for(const e of actors.slice(offset).concat(actors.slice(0,offset))){
  const plan=aiEconomyPlan(e),tech=Object.keys(e.techs||{}).length;
  if(tech>=11&&(e.res.min||0)>1900&&e.megaWill===undefined){const prof=aiProfile(e),P=personaOf(e);let chance=.30+prof.sci*.35+prof.eco*.20+(P?.n==='Yayılmacı'?.20:P?.n==='Fanatik Arındırıcılar'?-.15:P?.n==='Militarist'?-.10:0);e.megaWill=rnd()<clamp(chance,0,.85);}
  e.megaReserve=!megaBuilds(e).length&&e.megaWill&&!plan.critical&&plan.policy==='growth'&&(e.res.min||0)>1900&&(e.res.ala||0)>500?780:0;
  const builders=G.fleets.filter(f=>f.e===e.id&&fleetHasRole(f,'insaat'));
  for(const f of builders){
   if(remote&&remote.tasks(f).length||f.sys<0||f.path?.length||f.mv||f.combat||f.building!==undefined||f.ships.some(sh=>sh.busy!==undefined))continue;
   const candidate=aiConstructionCandidate(e,f,searchBudget);
   if(!candidate){AIDiagnostics.note('builder:no-safe-funded-target',e);continue;}
   const result=remote?remote.enqueue(f,candidate.sy.id,candidate.key):{ok:f.sys===candidate.sy.id?startStruct(e,candidate.sy,candidate.key,f):aiMove(e,f,candidate.sy.id)};
   AIDiagnostics.note(result.ok?'builder:assigned':'builder:rejected',e,null,result.ok?candidate.key:result.why);
  }
  const inv=aiShipInventory(e),count=(inv.counts.ins||0)+(inv.pending.ins||0);
  if(count>=2){AIDiagnostics.note('builder:covered',e);continue;}
  const yard=inv.yards.filter(s=>!(s.yardLock>(G.memAge||0))&&s.queue.length<Math.max(2,yardCount(s))).sort((a,b)=>a.queue.length-b.queue.length||a.id-b.id)[0];
  if(!yard||!shipBuildAccess(e,'ins').ok){AIDiagnostics.note('builder:no-usable-yard',e);continue;}
  const probe={e:e.id,id:-1,sys:yard.id,mv:null,path:[],ships:[{c:'ins'}]},candidate=aiConstructionCandidate(e,probe,searchBudget);
  if(!candidate){AIDiagnostics.note('builder:no-pending-work',e);continue;}
  const cost=shipCost(e,'ins'),commit=aiConstructionCommitment(e),up=SHIPS.ins.up*Math.max(.1,1+(e.mods.upMul||0));
  const funded=Object.entries(cost).every(([r,v])=>(e.res[r]||0)-v-(commit[r]||0)-(candidate.cost[r]||0)>=(r==='ala'?40:r==='min'?80:0));
  const net=(e.inc.ene||0)-inv.queuedEnergy-up;
  if(!funded||inv.usage+SHIPS.ins.sz>e.cap*.92||net<0&&(e.res.ene||0)<-net*12){AIDiagnostics.note('builder:budget-or-maintenance',e);continue;}
  if(queueShip(e,yard,'ins'))AIDiagnostics.note('builder:paid-replacement',e,null,candidate.key);
 }
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 7 — LOJİSTİK FARKINDALIĞI
   AI ikmal hattının koptuğunu fark eder ve filosunu geri çeker.
   Bu, "sonsuz derin sefer" davranışını kırar; savaşlar sınır
   bölgelerinde yoğunlaşır, galaksinin öbür ucuna dalış biter.
   ═══════════════════════════════════════════════════════════════════ */

/* Filonun sığınabileceği en yakın ikmal düğümü */
function nearestSupplySystem(e, f){
  const sid = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : -1);
  if (sid < 0) return null;
  const gorulen = new Set([sid]);
  let sinir = [sid];
  for (let d = 1; d <= 10; d++){
    const sonraki = [];
    for (const id of sinir){
      for (const l of G.sys[id].lanes){
        if (gorulen.has(l)) continue;
        gorulen.add(l);
        if (typeof isSupplyNode === 'function' && isSupplyNode(e, G.sys[l])) return G.sys[l];
        sonraki.push(l);
      }
    }
    if (!sonraki.length) break;
    sinir = sonraki;
  }
  return null;
}

function aiLogisticsTick(){
  if (typeof fleetSupply !== 'function') return;
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length) continue;
    const e = G.emps[f.e];
    if (!e || e.dead || e.wild || !e.ai) continue;
    if (f.combat) continue;                       // çatışmadan kaçamaz

    if (typeof guardLocked === 'function' && guardLocked(f)) continue;  // FAZ 31
    const sup = fleetSupply(e, f);
    /* Hat sağlamsa bir şey yapma */
    if (sup > .55){ f.retreating = false; continue; }

    /* Zaten geri çekiliyorsa hedefe varana kadar karışma */
    if (f.retreating && (f.path && f.path.length)) continue;

    /* Filo ne kadar yıpranmış? Yaralı filo daha çabuk döner. */
    let saglik = 0, n = 0;
    for (const sh of f.ships){ saglik += sh.h; n++; }   // sh.h zaten 0–1 oran
    saglik = n ? saglik / n : 1;

    /* Karar: ikmal ne kadar kopuksa ve filo ne kadar yıpranmışsa
       geri çekilme isteği o kadar güçlü. Savaşçı AI biraz daha inatçı. */
    const prof = aiProfile(e);
    const inat = prof.war * .25;
    const cekilmeIstegi = (1 - sup) * .8 + (1 - saglik) * .5 - inat;
    if (cekilmeIstegi < .35) continue;

    const hedef = nearestSupplySystem(e, f);
    if (!hedef || hedef.id === f.sys) continue;
    /* Koridor hakkı rota hesaplanmadan ÖNCE verilmeli */
    f.retreating = true;
    if (typeof orderMove === 'function' && orderMove(f, hedef.id, false, true)){
      f.ord = null;
    } else {
      f.retreating = false;                  // gerçekten kapana kısılmış
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 8.5 — FİLO TERHİSİ
   Faz 8'de bakım maliyetleri arttı ve bazı AI'lar enerji gelirini
   eksiye düşürüp hazinesini tüketiyordu. Artık batmakta olan bir
   imparatorluk savaşta değilken en ucuz gemilerini terhis edip
   ekonomisini toparlıyor.
   ═══════════════════════════════════════════════════════════════════ */

/* En ucuzdan pahalıya: önce korvetler gider */
const DISBAND_ORDER = ['kor', 'muh', 'kru', 'zir'];

function aiDisbandTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;

    const gelir = (e.inc && e.inc.ene) || 0;
    const stok  = e.res.ene || 0;
    /* Kaç ay dayanır? Gelir eksiyse stok erir. */
    const kalanAy = gelir >= 0 ? 999 : stok / Math.max(1, -gelir);

    /* Savaşta olmak terhisi zorlaştırır ama imkânsız kılmaz:
       tamamen iflas etmektense küçülmek yeğdir. */
    let savasta = false;
    for (const w in e.war) if (e.war[w]) savasta = true;

    /* ═══ FAZ 37: KAPASİTE AŞIMI DA TERHİS SEBEBİ ═══
       ÖLÇÜM (Faz 36 şüphesi doğrulandı ama farklı yönden):
       terhis yalnız ENERJİ krizine bakıyordu. Pakt feshinde
       kapasite 71→46 düşünce AI'lar aşıma giriyor, aşım cezası
       enerjiyi eritiyor ve ancak o zaman tepki veriyorlardı —
       geç ve aşırı (72→15). Artık aşımı doğrudan görüyorlar. */
    const kul = (typeof fleetUsage === 'function') ? fleetUsage(e) : 0;
    const kapasite = Math.round(e.cap || 0);
    const asim = Math.max(0, kul - kapasite);

    const kriz  = kalanAy < 6  || stok < 40;
    const sikinti = kalanAy < 18;
    if (!sikinti && !asim) { e.disbandStreak = 0; continue; }
    if (savasta && !kriz && !asim) continue;     // savaşta yalnız kriz/aşımda terhis

    /* Ne kadar küçülmeli? Açığı kapatacak kadar. */
    let hedefKesinti = gelir < 0 ? -gelir * 1.25 : 0;
    if (stok < 40) hedefKesinti = Math.max(hedefKesinti, 12);
    /* Aşım varsa öncelik onda: ceza katlanarak arttığı için
       önce kapasiteye inmek gerekir. */
    const asimHedef = asim > 0 ? asim : 0;
    if (hedefKesinti <= 0 && asimHedef <= 0) continue;

    let kesilen = 0, sayi = 0, kesilenSz = 0;
    for (const cls of DISBAND_ORDER){
      if (kesilen >= hedefKesinti && kesilenSz >= asimHedef) break;
      for (const f of G.fleets){
        if (f.e !== e.id || !f.ships.length) continue;
        if (f.combat) continue;                  // çatışmadaki filo dağıtılmaz
        for (let i = f.ships.length - 1; i >= 0; i--){
          /* İKİ HEDEF: bakım açığı VE kapasite aşımı. İkisi de
             kapandıysa dur — aşırı terhis ekonomiyi savunmasız
             bırakıyordu (ölçümde 72→15 düşüş görüldü). */
          if (kesilen >= hedefKesinti && kesilenSz >= asimHedef) break;
          if (f.ships[i].c !== cls) continue;
          /* Savaştaysa son savunma gücünü tamamen eritme */
          if (savasta && fleetPower(f) < 400) break;
          const sz = SHIPS[cls].sz || 1;
          f.ships.splice(i, 1);
          kesilen += SHIPS[cls].up * (1 + (e.mods ? e.mods.upMul : 0));
          kesilenSz += sz;
          sayi++;
        }
      }
    }
    /* Boşalan filoları temizle */
    G.fleets = G.fleets.filter(f => f.e !== e.id || f.ships.length);

    if (sayi){
      e.disbandStreak = (e.disbandStreak || 0) + 1;
      /* Terhis edilen gemilerin bir kısmı alaşım olarak geri döner */
      e.res.ala = (e.res.ala || 0) + sayi * 6;
      if (e.id === 0)
        say(sayi + ' gemi terhis edildi — bakım yükü hafifledi', 'war');
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 10 — AI CASUSLUK OPERASYONLARI
   Denetimde ortaya çıktı: runOp yalnızca oyuncu tarafından
   çağrılıyordu. AI istihbarat topluyor ama hiç kullanmıyordu.
   Artık mizacına ve stratejik ihtiyacına göre operasyon seçiyor.
   ═══════════════════════════════════════════════════════════════════ */

/* 87B: Standart operasyonların uygunluğu yürütmeyle aynı saf kapıdan.
   Mevcut %40 rezerv politikası GERÇEK (doktrin/etik dahil) maliyet üzerindedir.
   Puan, kota, risk ve fırsat zarını değiştirmez; RNG tüketmez. */
/* Selection policy only. Player operation execution/quotes remain unchanged. */
function aiOperationClass(key){
  return ['filoPlan','kervan','sorusturma','ambargoKir'].includes(key)?'passive':
    ['calTech','stealTech','yalan'].includes(key)?'active':'hostile';
}
function aiOpPolicy(e,o,key){
  const kind=aiOperationClass(key),war=!!e.war[o.id],rel=e.rel[o.id]||0;
  const protectedPair=protectedDiplomaticPair(e,o),kin=grudgeOf(e,o.id);
  if(kind==='passive')return true;
  if(protectedPair||(!war&&rel>35))return false;
  if(kind==='active')return war||rel<=20;
  return war||rel<-25&&kin>=15;
}
function aiPassiveIntel(e){
  if((e._aiSpyNext||0)>G.day||spiesUsed(e)>=spyCap(e))return;
  const candidates=G.emps.filter(o=>o!==e&&!o.dead&&!o.wild&&!o.crisisSide&&e.contact[o.id]&&
    intelOf(e,o.id)<3&&!(e.spy&&e.spy[o.id])&&spyAssignQuote(e,o.id).ok);
  candidates.sort((a,b)=>(Number(!!e.war[b.id])*100+grudgeOf(e,b.id)+3-intelOf(e,b.id))-
    (Number(!!e.war[a.id])*100+grudgeOf(e,a.id)+3-intelOf(e,a.id))||a.id-b.id);
  if(candidates[0]&&assignSpy(e,candidates[0].id))e._aiSpyNext=G.day+90;
}
function aiStandardOpReady(e, o, key){
  if(!aiOpPolicy(e,o,key))return false;
  const q = opQuote(e, o, key);
  return q.ok && Object.keys(q.cost).every(r =>
    (e.res[r] || 0) >= q.cost[r] * 1.4);
}

/* Hangi operasyon şu an mantıklı? Puanlar ihtiyaca göre verilir. */
function aiPickOp(e, o){
  if (typeof OPS === 'undefined' || typeof intelOf !== 'function') return null;
  if (!spyTargetCheck(e, o).ok) return null;
  const lvl = intelOf(e, o.id);
  const prof = aiProfile(e);
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  const mz = P ? P.n : '';
  const savasta = !!e.war[o.id];
  const kin = (typeof grudgeOf === 'function') ? grudgeOf(e, o.id) : 0;

  const puan = {};
  const ekle = (k, v) => {
    if(!aiOpPolicy(e,o,k))return;
    if (k === 'stealTech' || k === 'incite'){ puan[k] = (puan[k] || 0) + v; return; }
    if (OPS[k] && lvl >= OPS[k].lvl) puan[k] = (puan[k] || 0) + v;
  };

  /* Teknoloji açığı varsa çalmak en kârlısı */
  const benimTek = Object.keys(e.techs || {}).length;
  const onunTek  = Object.keys(aiKnownTechs(e,o)).length;
  if (onunTek > benimTek + 2) ekle('calTech', 1.2 + (onunTek - benimTek) * .05);
  ekle('calTech', prof.sci * .5);

  /* Fakirsem hazine baskını */
  const resources=aiKnownResources(e,o);
  const zenginlik = (resources.min || 0) + (resources.ene || 0) + (resources.ala || 0) * 2;
  const benimZ = (e.res.min || 0) + (e.res.ene || 0) + (e.res.ala || 0) * 2;
  if (zenginlik > benimZ * 1.4) ekle('hazine', .9 + prof.eco * .5);

  /* Savaş öncesi/sırası hazırlık */
  if (savasta){
    ekle('filoPlan', 1.3);
    ekle('sabotaj', 1.0 + prof.war * .4);
    ekle('tersaneVir', .9);
  } else if (kin > 35){
    /* Savaşa hazırlanıyorum: önce tersanesini çökert */
    ekle('tersaneVir', .8 + kin / 120);
    ekle('filoPlan', .7);
  }

  /* Ambargo altındaysam kaçakçılık hayat kurtarır — ama yalnızca
     HENÜZ DELİNMEMİŞ bir hat varsa. Aksi hâlde AI aynı ambargoyu
     tekrar tekrar deliyor ve etkisini çöpe atıyordu (ölçümde
     operasyonların %66'sı buraydı). */
  if (typeof embargoOn === 'function'){
    /* ═══ FAZ 86A DOĞRULUK UYARLAMASI ═══
       Operasyon artık YALNIZ seçilen hedefin hattını deler (rastgele
       üçüncü devlet seçilmiyor). Bu yüzden puan da hedefe özgü
       olmalı: `o` gerçekten ambargo uygulamıyorsa operasyon zaten
       opQuote tarafından reddedilirdi. Sıklık/denge puanı DEĞİŞMEDİ —
       aynı katsayı, yalnız doğru hedef üzerinde uygulanıyor. */
    let acikHat = 0;
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === e.id) continue;
      if (embargoOn(x, e.id) && !(e.smuggle && e.smuggle[x.id] > G.day)) acikHat++;
    }
    const hedefUygular = embargoOn(o, e.id) &&
      !(e.smuggle && e.smuggle[o.id] > G.day);
    if (acikHat && hedefUygular) ekle('ambargoKir', .70 + acikHat * .18);
  }

  /* ═══ FAZ 38: İSYANCI ÖNCELİĞİ ═══
     İttifak üyesi zalim Koruyucu'yu önce içeriden çökertmeye
     çalışır: her operasyon türü daha cazip hale gelir. */
  let rebelKat = 1;
  if (typeof inRebelAlliance === 'function' && inRebelAlliance(e) &&
      G.rebelAlliance && G.rebelAlliance.target === o.id){
    rebelKat = 2.2;
    ekle('sabotaj', .8); ekle('hazine', .5); ekle('filoPlan', .6);
    ekle('tersaneVir', .5); ekle('suikast', .4);
  }

  /* ═══ FAZ 42: İSYANI KIŞKIRT ═══
     Sinsi AI'lar düşmanı içeriden bölmeyi sever. Hedefin sınır
     dünyası ne kadar kırılgansa istek o kadar büyür. */
  if (typeof canIncite === 'function' && lvl >= 3 && aiOpPolicy(e,o,'incite')){
    const chk = canIncite(e, o);
    if (chk.ok && chk.hedef){
      const col = chk.hedef.pl.col;
      let ist = .30;
      /* Zaten çatlamış bir dünya en kârlı hedeftir */
      if (col.stab < 40) ist += .45;
      if (col.stab < 25) ist += .35;
      /* ═══ FAZ 43: ISRARCI AI — KOKU ALAN YIRTICI ═══
         Sayaç 10'u geçtiyse av yaralı demektir: AI diğer
         operasyonları bırakıp 24 ay boyunca aynı gezegene yüklenir. */
      const sc = col.secede || 0;
      if (sc >= 10){
        ist += 1.40;                              // ezici öncelik
        e._lockTarget = {e: o.id, sys: chk.hedef.sys.id, pi: chk.hedef.pl.i,
                         until: (G.memAge || 0) + 24};
      } else if (sc > 0) ist += .50;              // sayaç işliyorsa son darbe
      /* Kilitli hedefimizse sadakat: başka devlete yönelme */
      if (e._lockTarget && e._lockTarget.until > (G.memAge || 0)){
        if (e._lockTarget.e === o.id) ist += .80;
        else ist -= .60;
      }
      if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) ist += .40;
      if (mz === 'Fanatik Arındırıcılar') ist += .25;
      if (prof.dip > .55) ist += .20;
      /* Savaştaysak daha da cazip */
      if (e.war[o.id]) ist += .30;
      ekle('incite', ist);
    }
  }

  /* ═══ FAZ 49: SAHTEKÂR AI ENTRİKAYA YÖNELİR ═══
     Dördüncü etik ekseni artık operasyon seçimini de etkiliyor:
     sahtekâr devletler kışkırtma, şantaj ve sahte bayrağı
     önceliklendirir; dürüst devletler bu işlerden kaçınır. */
  {
    const ahl = (e.ethics && e.ethics.ahl) || 0;
    if (ahl < 0){
      const kat = Math.min(1, Math.abs(ahl) / 2);
      ekle('incite', .35 * kat);
      ekle('sabotaj', .30 * kat);
      ekle('hazine', .25 * kat);
      ekle('sahteKanit', .30 * kat);
    } else if (ahl > 0){
      /* Dürüst devlet gölgeden hoşlanmaz — tüm puanlar kırpılır */
      const ceza = Math.min(1, ahl / 2);
      for (const k2 in puan) puan[k2] *= (1 - .35 * ceza);
    }
  }

  /* FAZ 30: Teknoloji hırsızlığı — bilim açığı varsa en kârlı yol */
  if (typeof stealTech === 'function' && lvl >= 2){
    let acik = 0;
    for (const id in aiKnownTechs(e,o))
      if (!(e.techs && e.techs[id]) && typeof TECHS !== 'undefined' && TECHS[id]) acik++;
    if (acik >= 3){
      let ist = .45 + Math.min(.5, acik * .05);
      if (prof.sci > .6) ist += .25;
      if (mz === 'Fanatik Arındırıcılar') ist += .15;
      ekle('stealTech', ist);
    }
  }

  /* FAZ 16: Derin Soruşturma — üstüne iftira atılmış bir dosta
     yardım etmek ya da kendi adını temizlemek. Ucuz ve düşük riskli,
     ama yalnızca çözülecek bir iftira varsa anlamlı. */
  if (OPS.sorusturma && lvl >= 1){
    let iftira = 0;
    /* Kendi üstüme atılan iftira var mı? */
    iftira += (e.hitLog || []).filter(w => w.known && w.framed !== undefined).length * 2;
    /* Hedefe atılmış iftira (onu temize çıkarıp dost kazanırım) */
    for (const v of G.emps){
      if (v.dead || v.wild || v.id === e.id || intelOf(e,v.id)<3) continue;
      iftira += (v.hitLog || []).filter(w => w.known && w.by === o.id &&
        w.framed !== undefined).length;
    }
    if (iftira){
      let ist = .60 + Math.min(.6, iftira * .18);
      if (prof.sci > .6) ist += .20;                 // bilimci soruşturmayı sever
      if (mz === 'Pasifist') ist += .18;
      if (mz === 'Militarist') ist -= .12;
      if (e.rel[o.id] > 20) ist += .20;              // dostumu temize çıkarırım
      ekle('sorusturma', ist);
    }
  }

  /* FAZ 15: Sahte kanıt — entrikacı mizaçların silahı. Yalnızca
     galakside üstüne yıkılacak açık dosya varsa mantıklı. */
  if (OPS.sahteKanit && lvl >= 2){
    let acikDosya = 0;
    for (const v of G.emps){
      if (v.dead || v.wild || v.id === e.id || v.id === o.id || intelOf(e,v.id)<3) continue;
      if (!v.contact[o.id]) continue;
      acikDosya += (v.hitLog || []).filter(w => !w.known).length;
    }
    if (acikDosya){
      let ist = .55 + Math.min(.5, acikDosya * .08);
      if (mz === 'Tüccar') ist += .25;
      else if (mz === 'Fanatik Arındırıcılar') ist += .20;
      else if (mz === 'Militarist') ist -= .15;
      if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) ist += .40;
      /* Güçlü bir rakibi galaksiye düşman etmek en kârlısı */
      if (aiKnownPower(e,o) > totalPower(e)) ist += .25;
      ekle('sahteKanit', ist);
    }
  }

  /* Zayıfsam sahte istihbarat ve isyan; güçlüysem suikast */
  const oran = totalPower(e) / (aiKnownPower(e,o) + 1);
  if (oran < .8) ekle('yalan', 1.0);
  if (kin > 50) ekle('isyan', .7 + kin / 150);
  if (kin > 60 && oran > 1.1) ekle('suikast', .6 + kin / 180);

  /* Mizaç eğilimleri */
  if (mz === 'Tüccar'){ ekle('hazine', .45); ekle('kervan', .5); ekle('ambargoKir', .4); }
  if (mz === 'Militarist'){ ekle('sabotaj', .5); ekle('filoPlan', .4); }
  if (mz === 'Fanatik Arındırıcılar'){ ekle('yalan', .4); ekle('tersaneVir', .3); }
  if (mz === 'Pasifist'){ ekle('calTech', .35); ekle('yalan', .3); }
  if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')){
    for (const k in puan) puan[k] *= 1.35;         // Gölge Konseyi her operasyonda usta
  }

  /* ── ETKİSİ SÜREN OPERASYONU TEKRARLAMA ──
     AI aynı hedefe defalarca aynı operasyonu yapıp etkiyi çöpe
     atıyordu (ölçüm: Tersane Virüsü tüm operasyonların %48'i).
     Süreli etkiler bitmeden yenisi önerilmez. */
  if (lvl>=3 && o.virusUntil && o.virusUntil > G.day) delete puan.tersaneVir;
  if (e.fleetIntel && e.fleetIntel[o.id] > G.day) delete puan.filoPlan;
  if (e.routeIntel && e.routeIntel[o.id] > G.day) delete puan.kervan;
  if (e.fakeTo && e.fakeTo[o.id] && e.fakeTo[o.id].until > G.day) delete puan.yalan;
  /* Aynı hedefe son 24 turda yapılan operasyon tekrarlanmaz */
  if (e.opLog){
    const yakin = e.opLog.filter(w => w.o === o.id && (G.memAge || 0) - w.t < 24);
    for (const w of yakin) delete puan[w.k];
  }

  /* Karşılanabilir mi? */
  /* İsyancı katsayısı tüm puanlara uygulanır */
  if (rebelKat !== 1) for (const k in puan) puan[k] *= rebelKat;

  let best = null;
  for (const k in puan){
    if (k === 'stealTech'){
      if ((e.res.etk || 0) >= 90 * 1.4 && (!best || puan[k] > best.p))
        best = {k, p: puan[k]};
      continue;
    }
    if (k === 'incite'){
      /* Etik puanı, üstte uygun koloni bulunmasa da incite ekleyebilir. */
      if (!canIncite(e, o).ok) continue;
      const bedel = (typeof INCITE_COST !== 'undefined') ? INCITE_COST : 120;
      if ((e.res.etk || 0) >= bedel * 1.4 && (!best || puan[k] > best.p))
        best = {k, p: puan[k]};
      continue;
    }
    if (!aiStandardOpReady(e, o, k)) continue;
    if (!best || puan[k] > best.p) best = {k, p: puan[k]};
  }
  return (best && best.p > .75) ? best.k : null;
}

/* Aylık operasyon turu — diploTick çağırır */
function aiOpsTick(){
  if (typeof runOp !== 'function') return;
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;
    /* FAZ 43: süresi dolan hedef kilidini bırak */
    if (e._lockTarget && e._lockTarget.until <= (G.memAge || 0)) delete e._lockTarget;
    aiPassiveIntel(e);
    if ((e.res.etk || 0) < 40) continue;

    /* Operasyon sıklığı: diplomatik beceri ve mizaç belirler */
    const prof = aiProfile(e);
    let sans = .06 + prof.dip * .05;
    if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) sans *= 2.2;
    if (typeof personaOf === 'function'){
      const P = personaOf(e);
      if (P.n === 'Fanatik Arındırıcılar') sans *= 1.3;
      else if (P.n === 'Militarist') sans *= .7;
    }
    /* ═══ FAZ 50: AHLAK EKSENİ OPERASYON İŞTAHINA BAĞLANDI ═══
       ÖLÇÜM (60 yıl × 3 tohum): sahtekâr AI 53.8 op/devlet,
       DÜRÜST AI 92.8 — tam ters! Sebep: opCost/opBonus yalnız
       maliyet ve başarı oranına giriyordu, AI'nın operasyon
       BAŞLATMA isteğine hiç dokunmuyordu. Dürüst devletler
       gölgede daha çok çalışıyor görünüyordu.
       Artık ahlak ekseni doğrudan iştahı belirliyor. */
    const ahl = (e.ethics && e.ethics.ahl) || 0;
    if (ahl <= -2) sans *= 2.0;          // koyu sahtekâr: entrika onun dili
    else if (ahl <= -1) sans *= 1.5;
    else if (ahl >= 2) sans *= .35;      // koyu dürüst: gölgeden kaçınır
    else if (ahl >= 1) sans *= .60;
    if (rnd() > clamp(sans, .01, .34)) continue;

    /* Gölge Konseyi ayda iki operasyon çevirir */
    const kota = (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) ? 2 : 1;
    let yapilan = 0;

    /* Hedef: temas kurulmuş, müttefik olmayan devletler */
    const adaylar = G.emps.filter(o => !o.dead && !o.wild && o.id !== e.id &&
      e.contact[o.id]);
    if (!adaylar.length) continue;

    /* En yüksek istihbarata sahip olduğum ve en çok kin duyduğum hedef */
    adaylar.sort((a, b) => {
      const ka = (typeof grudgeOf === 'function') ? grudgeOf(e, a.id) : 0;
      const kb = (typeof grudgeOf === 'function') ? grudgeOf(e, b.id) : 0;
      return (intelOf(e, b.id) * 30 + kb) - (intelOf(e, a.id) * 30 + ka);
    });

    for (const o of adaylar.slice(0, 4)){
      const key = aiPickOp(e, o);
      if (!key) continue;
      e.aiLastOp={day:G.day,target:o.id,key,kind:aiOperationClass(key),reason:e.war[o.id]?'Mevcut savaş':aiOperationClass(key)==='passive'?'Bilgi açığı':'Düşmanca ilişki ve stratejik ihtiyaç'};
      const r = (key === 'stealTech' && typeof stealTech === 'function')
        ? stealTech(e, o)
        : (key === 'incite' && typeof inciteRebellion === 'function')
        ? inciteRebellion(e, o) : runOp(e, o, key);
      if (r && r.ok){
        /* 87C: standart ve özel motorlar kendi kayıtlarını bir kez yazar.
           Kota, başarıdan bağımsız olarak çözülmüş denemeyi sayar. */
        yapilan++;
      }
      /* FAZ 11: Gölge Konseyi doktrini ayda İKİ operasyon çevirebilir.
         İstihbarat baskısı artık hissedilir olmalı. */
      if (yapilan >= kota) break;
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 11 — SOĞUK DOSYA SORUŞTURMASI
   hitLog'daki FAİLİ BİLİNMEYEN operasyonlar zamanla çözülebilir.
   Faz 4'teki counterIntel gücünü yeniden kullanır; yeni bir
   istihbarat sistemi kurulmaz.
   ═══════════════════════════════════════════════════════════════════ */
function hitLogTick(){
  if (typeof counterIntel !== 'function') return;
  const simdi = G.memAge || 0;
  for (const e of G.emps){
    if (e.dead || e.wild || !e.hitLog || !e.hitLog.length) continue;
    const ci = counterIntel(e);
    if (ci <= 0) continue;

    for (const w of e.hitLog){
      if (w.known) continue;
      const yas = simdi - w.t;
      if (yas < 2 || yas > CI_MAX_AGE) continue;         // taze/soğumuş dosya
      /* Failin üzerimizdeki istihbaratı yüksekse izini gizlemesi kolay */
      const fail = G.emps[w.by];
      let gizlilik = 1;
      if (fail && typeof hasCivic === 'function' && hasCivic(fail, 'shadow')) gizlilik = .35;
      const sans = clamp(CI_BASE * ci * gizlilik * (1 - yas / CI_MAX_AGE), .002, .25);
      if (rnd() > sans) continue;

      w.known = true;
      w.foundAt = simdi;
      if (fail && !fail.dead){
        if (typeof remember === 'function') remember(e, fail.id, 'komplo');
        e.rel[fail.id] = clamp(e.rel[fail.id] - 20, -100, 100);
        if (e.id === 0)
          say('SOĞUK DOSYA ÇÖZÜLDÜ — o operasyonun arkasında ' + fail.name + ' varmış', 'war');
        else if (fail.id === 0)
          say(e.name + ' eski bir operasyonunun izini sürdü — kimliğin ifşa oldu', 'war');
      }
      break;                                             // ayda bir dosya
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 22 — AI TAARRUZ ORDUSU KOMUTASI
   İki refleks:
     SAVUNMA — barışta ya da tehdit altında ordu kendi en değerli
       gezegeninin yörüngesinde bekler ve garnizona eklenir.
     TAARRUZ — savaşta, kendi savaş filosunun ZATEN bastırdığı bir
       düşman gezegenine gönderilir. Ordu tek başına gitmez;
       kalkan inmeden çıkarma yapılamaz.
   ═══════════════════════════════════════════════════════════════════ */
/* FAZ 31: Colossus koruma filosu kilitli — şarj sürerken başka
   göreve gönderilmez. Ölçümde koruma filosu dağılınca Colossus
   savunmasız kalıyordu. */
function guardLocked(f){
  if (!f || f.guardColossus === undefined || f.guardColossus === false) return false;
  const sysId = f.guardColossus;
  for (const c of G.fleets){
    if (c.e !== f.e || !c.ships.length) continue;
    if (typeof isColossus !== 'function' || !isColossus(c)) continue;
    const cs = c.sys >= 0 ? c.sys : (c.mv ? c.mv.to : -1);
    if (cs === sysId) return true;            // Colossus hâlâ orada
  }
  f.guardColossus = false;                    // görev bitti
  return false;
}

/* FAZ 31: Colossus şarj olurken koruma filosu o sistemden ayrılamaz.
   Ölçümde şarj hiç 1'i geçmiyordu; koruma çekilince hedef kaybolup
   sayaç sıfırlanıyordu. Bu kilit tüm AI filo emirlerinden ÖNCE
   uygulanır. */
function colossusGuardLock(){
  if (typeof isColossus !== 'function') return;
  /* Hangi sistemlerde şarj olan Colossus var? */
  const kilit = {};
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length || !isColossus(f)) continue;
    if (f.sys < 0 || f.mv) continue;
    if (typeof colossusTarget === 'function' && colossusTarget(f))
      kilit[f.sys] = f.e;
  }
  for (const g of G.fleets){
    if (!g.ships || !g.ships.length) continue;
    if (g.sys < 0) continue;
    if (kilit[g.sys] !== g.e) { if (g.guardLocked) delete g.guardLocked; continue; }
    if (typeof isArmed === 'function' && !isArmed(g)) continue;
    /* Bu filo koruma görevinde: emirleri iptal edilir */
    g.guardLocked = true;
    if (g.path && g.path.length) g.path.length = 0;
    g.ord = null;
  }
}

function aiArmyTick(){
  if (typeof isTransport !== 'function') return;
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;

    const ordular = G.fleets.filter(f => f.e === e.id && f.ships.length &&
      isTransport(f) && !f.mv && (!f.path || !f.path.length));
    if (!ordular.length) continue;

    const savasta = Object.keys(e.war).some(k => e.war[k]);
    const prof = aiProfile(e);

    /* Kendi savaş filolarımın bulunduğu sistemler — çıkarma ancak
       oralarda mantıklı. Bir kez toplanır. */
    /* Savaş filolarımın bulunduğu VE GİTTİĞİ sistemler.
       Eskiden yalnız `f.sys` sayılıyordu: filo yoldayken ordu hedefi
       göremiyor, filo varınca bombardıman 6 ayda işi bitiriyor ve
       ordu hiç yola çıkmıyordu. Artık ordu filoyla AYNI ANDA yola
       çıkabiliyor — Hızlı İntikal de bu sayede anlam kazanıyor. */
    const bastirilan = {};
    if (savasta){
      for (const f of G.fleets){
        if (f.e !== e.id || !f.ships.length || !isArmed(f)) continue;
        const guc = fleetPower(f);
        if (f.sys >= 0) bastirilan[f.sys] = (bastirilan[f.sys] || 0) + guc;
        /* Yoldaki filonun varış noktası da hedef sayılır */
        const varis = f.mv ? f.mv.to
                    : (f.path && f.path.length ? f.path[f.path.length - 1] : -1);
        if (varis >= 0 && varis !== f.sys)
          bastirilan[varis] = (bastirilan[varis] || 0) + guc * .85;
      }
    }

    for (const ordu of ordular){
      if (guardLocked(ordu)) continue;             // FAZ 31: koruma görevi
      /* ── TAARRUZ ── */
      let hedef = null;
      if (savasta){
        let enIyi = 0;
        for (const sysId in bastirilan){
          const sy = G.sys[sysId];
          if (!sy) continue;
          /* KRİTİK: sistem sahipliği UZAY muharebesiyle anında el
             değiştiriyor (captureSystem), ama GEZEGENLER eski
             sahibinde kalıyor. Eskiden sy.owner'a bakıyordum ve
             koşul hiç sağlanmıyordu — 600 turluk tanıda 461
             fırsatın SIFIRINDA ordu sevk edilebilmişti.
             Doğru soru: bu sistemde düşman GEZEGENİ var mı? */
          let dusmanGezegen = false;
          for (const pl of sy.planets){
            if (!pl.col || pl.owner < 0 || pl.owner === e.id) continue;
            if (e.war[pl.owner] || (G.emps[pl.owner] && G.emps[pl.owner].wild)){
              dusmanGezegen = true; break;
            }
          }
          if (!dusmanGezegen) continue;
          /* Ordu YOLA ÇIKARKEN kalkanın inmiş olması gerekmez —
             yolculuk aylar sürüyor ve filo bu sırada kalkanı
             indiriyor. Eski koşul (shield<=12) orduyu geç
             gönderiyordu; ölçümde AI'nın fetihlerinin %95'i
             bombardımanla oluyor, ordular hiç yetişmiyordu. */
          let deger = 0, hazir = false;
          for (const pl of sy.planets){
            if (!pl.col || pl.owner < 0 || pl.owner === e.id) continue;
            if (!e.war[pl.owner] && !(G.emps[pl.owner] && G.emps[pl.owner].wild)) continue;
            /* Kalkan zaten iniyorsa ya da düşükse hedef geçerli */
            if ((pl.col.shield || 0) <= 55) hazir = true;
            deger += pl.col.pop * 2 + colonyUsed(pl.col) * 3;
          }
          if (!hazir || deger <= 0) continue;
          /* Filo üstünlüğü var mı? */
          const guc = bastirilan[sysId];
          if (guc < (sy.def || 0) * .8) continue;
          const skor = deger + guc * .02 - (ordu.sys >= 0 ? dist(G.sys[ordu.sys], sy) * .04 : 0);
          if (skor > enIyi){ enIyi = skor; hedef = sy; }
        }
      }

      /* ── FAZ 24: ÖN MEVZİLENME (CEPHE EŞLEŞMESİ) ──
         Tanı şunu gösterdi: cephe (kendi filomun düşman gezegenli
         sistemde bulunması) 1800 imparatorluk-ayın yalnız 25'inde
         açıktı ve ordular o anda ana vatanda bekliyordu. Cephe
         kapanmadan yetişmek imkânsızdı.
         Çözüm: savaşta ordular ANA VATANDA değil, DÜŞMANA KOMŞU
         kendi sınır sistemimizde bekler. Cephe açıldığı anda
         1-2 sıçrama uzaktadırlar ve Hızlı İntikal devreye girer. */
      if (!hedef && savasta){
        let enIyi = -1, sinir = null;
        for (const sy of G.sys){
          if(!aiView(e).ctx.visible.has(sy.id)&&sy.owner!==e.id)continue;
          if (sy.owner !== e.id) continue;
          /* Bu sistem düşman bölgesine komşu mu? */
          let komsuDusman = 0;
          for (const l of sy.lanes){
            const o2 = G.sys[l];
            if (!o2) continue;
            if (o2.owner >= 0 && o2.owner !== e.id && e.war[o2.owner]) komsuDusman++;
            /* Düşman gezegeni olan sistem daha değerli hedef */
            for (const pl of o2.planets)
              if (pl.col && pl.owner >= 0 && pl.owner !== e.id && e.war[pl.owner])
                komsuDusman += 2;
          }
          if (!komsuDusman) continue;
          let skor = komsuDusman * 30;
          /* Kendi savaş filomun yakınlığı — birlikte hareket */
          for (const f2 of G.fleets){
            if (f2.e !== e.id || !f2.ships.length || !isArmed(f2)) continue;
            const fs2 = f2.sys >= 0 ? f2.sys : (f2.mv ? f2.mv.to : -1);
            if (fs2 === sy.id) skor += 60;
            else if (fs2 >= 0 && sy.lanes.indexOf(fs2) >= 0) skor += 25;
          }
          /* Aynı sınıra iki ordu yığma */
          const zaten = G.fleets.some(f3 => f3 !== ordu && f3.e === e.id &&
            f3.sys === sy.id && isTransport(f3));
          if (zaten) skor *= .4;
          if (skor > enIyi){ enIyi = skor; sinir = sy; }
        }
        if (sinir) hedef = sinir;
      }

      /* ── SAVUNMA ──
         Hedef yoksa en değerli ya da en tehdit altındaki kolonide bekle. */
      if (!hedef){
        let enIyi = -1;
        for (const c of e.colonies){
          const sy = G.sys[c.s];
          const pl = sy && sy.planets[c.p];
          if (!pl || !pl.col) continue;
          let skor = pl.col.pop * 1.5 + colonyUsed(pl.col) * 2;
          if (e.home === sy.id) skor += 40;
          /* Tehdit altındaki sınır dünyaları öncelikli */
          if (typeof threatAt === 'function') skor += threatAt(e, sy.id) * .04;
          /* Aynı yere iki ordu yığma */
          const zaten = G.fleets.some(f => f !== ordu && f.e === e.id &&
            f.sys === sy.id && isTransport(f));
          if (zaten) skor *= .35;
          if (skor > enIyi){ enIyi = skor; hedef = sy; }
        }
      }

      if (hedef && hedef.id !== ordu.sys && typeof orderMove === 'function'){
        aiMove(e,ordu,hedef.id);
        ordu.ord = null;
      }
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 25 — AI COLOSSUS SEVKİ
   Süper silah kendi başına yol bulmaz: baş düşmanın en değerli
   gezegenine, kendi filosunun koruması altında gönderilir.
   Silahsız olduğu için yalnız gitmez.
   ═══════════════════════════════════════════════════════════════════ */
function aiColossusTick(){
  if (typeof isColossus !== 'function') return;
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length || !isColossus(f)) continue;
    const e = G.emps[f.e];
    if (!e || e.dead || !e.ai) continue;
    if (f.mv || (f.path && f.path.length)) continue;

    /* Zaten hedefte ve şarj oluyorsa karışma */
    if (typeof colossusTarget === 'function' && colossusTarget(f)) continue;

    /* ═══ FAZ 31: HEDEF ARAMA DÜZELTMESİ ═══
       ÖLÇÜM: 4 Colossus izlendi, hepsi 99-466 ay boyunca DURGUN
       kaldı, hiçbirinin hedefi olmadı ("düşman gezegenli sistem: 0
       · savaşta: 1"). Sebep: o tek savaş KORSANLARLAydı — korsanın
       gezegeni yok, dolayısıyla hedef de yok. Üretim koşulu soğuk
       düşmanlığı kabul ediyordu ama sevk koşulu hâlâ sıcak savaş
       arıyordu; ikisi tutarsızdı.
       Artık hedef ararken de soğuk düşmanlık geçerli. */
    let hedef = null, enIyi = -1;
    for (const sy of G.sys){
          if(!aiView(e).ctx.visible.has(sy.id)&&sy.owner!==e.id)continue;
      let deger = 0;
      for (const pl of sy.planets){
        if (!pl.col || pl.owner < 0 || pl.owner === e.id || pl.shattered) continue;
        const o2 = G.emps[pl.owner];
        if (!o2 || o2.wild) continue;                 // korsanın gezegeni yok zaten
        if (e.ally && e.ally[pl.owner]) continue;
        const dusman = e.war[pl.owner] ||
          (e.rel[pl.owner] || 0) < -40 ||
          (typeof grudgeOf === 'function' && grudgeOf(e, pl.owner) > 35);
        if (!dusman) continue;
        deger += pl.col.pop * 3 + colonyUsed(pl.col) * 2;
        if (e.war[pl.owner]) deger *= 1.5;            // sıcak savaş öncelikli
        if (e.colossusTarget !== undefined && pl.owner === e.colossusTarget) deger *= 1.8;
      }
      if (deger <= 0) continue;
      /* Koruma: filom orada olmasa da gidebilir — koruma filosu
         Colossus yola çıktıktan SONRA çağrılıyor (aşağıda).
         Sadece ezici bir savunmaya körlemesine dalmayı engelle. */
      let koruma = 0;
      for (const f2 of G.fleets){
        if (f2.e !== e.id || !f2.ships.length || !isArmed(f2)) continue;
        const fs2 = f2.sys >= 0 ? f2.sys : (f2.mv ? f2.mv.to : -1);
        if (fs2 === sy.id) koruma += fleetPower(f2);
      }
      /* Toplam filo gücüm savunmayı aşıyorsa yeter — hepsi orada
         olmak zorunda değil */
      if (koruma <= 0 && totalPower(e) < (sy.def || 0) * 1.2) continue;
      const skor = deger + koruma * .01 -
        (f.sys >= 0 ? dist(G.sys[f.sys], sy) * .05 : 0);
      if (skor > enIyi){ enIyi = skor; hedef = sy; }
    }

    if (hedef && hedef.id !== f.sys && typeof orderMove === 'function'){
      /* ═══ FAZ 31: KORUMA ÖNCE GİDER ═══
         ÖLÇÜM: Colossus hedefe vardığı anda yok oluyordu (ships:[]).
         Silahsız (dmg:0) olduğu için gezegen savunmasına tek başına
         dayanamıyor. Artık koruma filosu ÖNCE sevk ediliyor;
         Colossus ancak yeterli koruma yola çıktıktan sonra hareket
         eder. */
      /* ═══ FAZ 31 DÜZELTMESİ: KİLİTLENME ═══
         ÖLÇÜM: 1197 Colossus-ayın hepsinde hedef bulunuyordu ama
         Colossus 1-2 ay sonra duruyordu. Sebep: koruma filosu
         hedefe VARANA kadar korumaYolda sıfır kalıyor, Colossus
         "koruma yetersiz" diye sonsuza dek bekliyordu. Ama koruma
         da yolda olduğu için asla varamıyordu — çift kilit.
         Artık YOLDAKİ koruma da sayılıyor ve bir kez muhafız
         gönderildiyse Colossus onu takip eder. */
      let korumaYolda = 0;
      for (const g of G.fleets){
        if (g.e !== e.id || !g.ships.length || !isArmed(g)) continue;
        const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
        if (gs === hedef.id) korumaYolda += fleetPower(g);   // varmış ya da yolda
      }
      const gerekli = (hedef.def || 0) * 1.3 + 300;
      /* ═══ FAZ 31 SON DÜZELTME ═══
         ÖLÇÜM: Colossus hedefe VARIYOR ama gemi sayısı sıfırlanıyor —
         gezegen savunması (sys.def) onu tek başına imha ediyor.
         Muhafız henüz yoldayken Colossus önden varıyordu çünkü
         sıçrama motoru onu ×3 hızlandırıyor, muhafız ise normal hızda.
         Çözüm: muhafızın VARMIŞ olması şart; yola çıkmış olması
         yetmez. Colossus asla önden gitmez. */
      let korumaVardi = 0;
      for (const g of G.fleets){
        if (g.e !== e.id || !g.ships.length || !isArmed(g)) continue;
        if (g.sys === hedef.id && !g.mv) korumaVardi += fleetPower(g);
      }

      /* SABIR SINIRI: muhafız 24 ay içinde varmazsa Colossus tek
         başına gider. Aksi hâlde tam simülasyonda muhafız başka
         cepheye çekilip Colossus sonsuza dek bekliyordu
         (ölçüm: kontrollü testte ateşliyor, 60 yıllık koşuda 0). */
      f.waitGuard = (f.waitGuard || 0) + 1;
      if (korumaVardi >= gerekli) f.waitGuard = 0;

      if (korumaVardi < gerekli && f.waitGuard < 24){
        /* Önce muhafız yolla, Colossus yerinde bekler */
        let en = null, enG = 0;
        for (const g of G.fleets){
          if (g.e !== e.id || !g.ships.length || !isArmed(g) || g.combat) continue;
          if (guardLocked(g)) continue;
          const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
          if (gs === hedef.id) continue;
          const p2 = fleetPower(g);
          if (p2 > enG){ enG = p2; en = g; }
        }
        if (en){
          orderMove(en, hedef.id);
          en.ord = null;
          en.guardColossus = hedef.id;
        }
        f.jumpDrive = false;
        continue;                       // Colossus bu ay hareket etmez
      }

      aiMove(e,f,hedef.id);
      f.ord = null;
      /* SIÇRAMA MOTORU — Colossus hızı 1.1 (en yavaş gemi).
         Ateşleme emri alınca üç kat hızlanır. */
      f.jumpDrive = true;
    }
    if (!hedef) f.jumpDrive = false;
  }

  /* ═══ FAZ 29: COLOSSUS KORUMASI ═══
     Colossus silahsızdır (dmg:0) ve 6 ay şarj olurken savunmasız
     kalır. AI artık ana savaş filosunu onun yörüngesine çeker;
     aksi hâlde süper silah şarj bitmeden yok ediliyordu.
     ÖLÇÜM (Faz 28): 1 Colossus üretildi, 0 ateşleme. */
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length || !isColossus(f)) continue;
    if (f.sys < 0 || f.mv) continue;                  // yolda değil, yerinde
    const e = G.emps[f.e];
    if (!e || e.dead || !e.ai) continue;
    /* Yalnızca gerçekten şarj oluyorsa koruma çağır */
    if (typeof colossusTarget !== 'function' || !colossusTarget(f)) continue;

    const hedefSys = f.sys;
    /* Orada ne kadar korumam var? */
    let mevcut = 0;
    for (const g of G.fleets){
      if (g.e !== e.id || !g.ships.length || !isArmed(g)) continue;
      const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
      if (gs === hedefSys) mevcut += fleetPower(g);
    }
    const gerek = (G.sys[hedefSys].def || 0) * 1.4 + 400;
    if (mevcut >= gerek) continue;

    /* En güçlü boştaki filoyu çağır */
    let cagrilan = null, enGuc = 0;
    for (const g of G.fleets){
      if (g.e !== e.id || !g.ships.length || !isArmed(g)) continue;
      if (g.combat) continue;
      if (guardLocked(g)) continue;                   // başka Colossus'u koruyor
      const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
      if (gs === hedefSys) continue;                  // zaten orada/gidiyor
      const p2 = fleetPower(g);
      if (p2 > enGuc){ enGuc = p2; cagrilan = g; }
    }
    if (cagrilan && typeof orderMove === 'function'){
      orderMove(cagrilan, hedefSys);
      cagrilan.ord = null;
      cagrilan.guardColossus = hedefSys;      // hangi sistemi koruyor
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 34 — AI SAHTE BAYRAK
   Koşul: elinde birbirine düşman EN AZ İKİ hedef olmalı ve
   ikisinden birine 2. seviye istihbaratı bulunmalı. Sinsi mizaçlar
   (İzolasyonist, Gölge Konseyi civic'i) daha sık dener.
   Nadir bir hamle: ayda %3 taban.
   ═══════════════════════════════════════════════════════════════════ */
function aiFalseFlagTick(){
  if (typeof falseFlagOp !== 'function' || typeof canFalseFlag !== 'function') return;
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    if ((e.res.etk || 0) < 260) continue;              // bütçe payı bırak
    if (e._ffCd && e._ffCd > (G.memAge || 0)) continue;

    const prof = aiProfile(e);
    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    const mz = P ? P.n : '';
    let sans = .03;
    if (mz === 'Fanatik Arındırıcılar') sans += .03;
    if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) sans += .05;
    if (prof.dip > .6) sans += .02;
    if (rnd() > sans) continue;

    /* Hedef: istihbaratımız olan bir düşman */
    const hedefler = G.emps.filter(o => !o.dead && !o.wild && !o.crisisSide &&
      o.id !== e.id && e.contact[o.id] &&
      (typeof intelOf === 'function' ? intelOf(e, o.id) : 0) >= 2 &&
      aiOpPolicy(e,o,'falseFlag'));
    if (!hedefler.length) continue;

    /* Günah keçisi: hedefin ZATEN nefret ettiği üçüncü devlet.
       İkisi birbirine ne kadar düşmansa iftira o kadar tutar. */
    let enIyi = null, enSkor = 0;
    for (const t of hedefler){
      for (const p2 of G.emps){
        if (p2.dead || p2.wild || p2.crisisSide) continue;
        if (p2.id === e.id || p2.id === t.id) continue;
        if (!e.contact[p2.id]) continue;
        if (!aiOpPolicy(e,p2,'falseFlag')||intelOf(e,t.id)<3) continue;
        const husumet = -(t.rel[p2.id] || 0);
        if (husumet < 25) continue;                     // inandırıcı değil
        /* İkisi de bize düşmansa birbirine düşürmek en kârlısı */
        const bizeDusman = ((e.rel[t.id] || 0) < -20 ? 1 : 0) +
                           ((e.rel[p2.id] || 0) < -20 ? 1 : 0);
        let skor = husumet + bizeDusman * 40;
        /* FAZ 38: İsyancı için zalim Koruyucu en cazip hedef */
        if (typeof inRebelAlliance === 'function' && inRebelAlliance(e) &&
            G.rebelAlliance && G.rebelAlliance.target === t.id) skor += 120;
        if (skor > enSkor){ enSkor = skor; enIyi = {t, p2}; }
      }
    }
    if (!enIyi) continue;

    e._ffCd = (G.memAge || 0) + 48;                     // 4 yıl bekleme
    const tur = rnd() < .5 ? 'tekno' : 'sabotaj';
    const r = falseFlagOp(e, enIyi.t, enIyi.p2, tur);
    if (r && r.ok && r.caught && G.p && !G.p.dead)
      say(e.name + ' sahte bayrak operasyonunda suçüstü yakalandı — PARYA', 'war');
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 36 — AI TERRAFORM
   Zengin ve teknolojik bir AI ölü dünyaları diriltir. Ayrıca
   Uyuyan Kraliçe uyanırsa projesini filoyla KORUR — aksi hâlde
   milyonlarca kaynak boşa gider.
   ═══════════════════════════════════════════════════════════════════ */
function aiTerraformTick(){
  if (typeof startTerraform !== 'function') return;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;

    /* ── 1. PROJE KORUMASI (öncelikli) ──
       Uyanmış bir kraliçe varsa filoyu oraya yolla. */
    for (const sy of G.sys){
      for (const pl of sy.planets){
        const tf = pl.terraform;
        if (!tf || tf.by !== e.id || !tf.woke) continue;
        /* Zaten koruma var mı? */
        let koruma = false;
        for (const g of G.fleets){
          if (g.e !== e.id || !g.ships.length) continue;
          const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
          if (gs === sy.id && isArmed(g)){ koruma = true; break; }
        }
        if (koruma) continue;
        /* En güçlü boştaki filoyu gönder */
        let en = null, enG = 0;
        for (const g of G.fleets){
          if (g.e !== e.id || !g.ships.length || !isArmed(g) || g.combat) continue;
          if (g.guardLocked) continue;
          const p2 = fleetPower(g);
          if (p2 > enG){ enG = p2; en = g; }
        }
        if (en && typeof orderMove === 'function'){
          orderMove(en, sy.id);
          en.ord = null;
          en.guardTerraform = sy.id;
        }
      }
    }

    /* ── 2. YENİ PROJE ── */
    /* ═══ FAZ 41: TERRAFORM EŞİKLERİ GEVŞETİLDİ ═══
       ÖLÇÜM: 100 yıllık doğal koşuda 0 terraform yapıldı. Eşik
       5000/5000 idi ve kriz sonrası AI'lar bu seviyeye çıkamıyordu.
       Enkazı olan AI için eşik yarıya iniyor — yarasını sarmak
       lüks değil, öncelik. */
    if (!e.techs || !e.techs.m_gaia) continue;
    let enkazVar = 0;
    for (const sy of G.sys){
      if (sy.owner !== e.id) continue;
      for (const pl of sy.planets) if (pl.shattered && !pl.terraform) enkazVar++;
    }
    const esik = enkazVar >= 2 ? 2600 : 3800;
    if ((e.res.ala || 0) < esik || (e.res.min || 0) < esik) continue;
    /* Zaten bir proje sürüyorsa ikincisini başlatma */
    let sureyor = false;
    for (const sy of G.sys){
      for (const pl of sy.planets)
        if (pl.terraform && pl.terraform.by === e.id){ sureyor = true; break; }
      if (sureyor) break;
    }
    if (sureyor) continue;

    /* Sınırlarımdaki en değerli ölü dünyayı seç */
    let hedef = null, enIyi = -1;
    for (const sy of G.sys){
      if (sy.owner !== e.id) continue;
      for (const pl of sy.planets){
        if (!pl.shattered || pl.terraform) continue;
        /* Biyolojik enkaz önceliklidir (Sürü yarası) */
        let skor = (pl.devoured !== undefined) ? 60 : 40;
        skor += (pl.sz || 1) * 8;
        if (e.home === sy.id) skor += 30;
        if (skor > enIyi){ enIyi = skor; hedef = {sy, pl}; }
      }
    }
    if (!hedef) continue;
    const r = startTerraform(e, hedef.sy, hedef.pl);
    if (r && r.ok && G.p && !G.p.dead)
      say(e.name + ' ölü bir dünyayı diriltmeye başladı', 'sci');
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 45 — AI HİMAYE TEKLİFİ
   Faz 44'te yalnız oyuncu kukla devletlerini vasallaştırabiliyordu.
   Artık AI da kendi kışkırtmasıyla doğan devlete himaye teklif
   ediyor — asimetri kapandı.
   ═══════════════════════════════════════════════════════════════════ */
function aiPatronageTick(){
  if (typeof canOfferPatronage !== 'function') return;
  const bedel = (typeof PATRONAGE_COST !== 'undefined') ? PATRONAGE_COST : 150;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    /* Etki bütçesi: teklif sonrası elinde pay kalmalı */
    if ((e.res.etk || 0) < bedel * 1.5) continue;
    if (e._patronCd && e._patronCd > (G.memAge || 0)) continue;

    /* Kendi doğurduğu kuklalar */
    for (const k of G.emps){
      if (k.dead || k.wild || k.crisisSide) continue;
      if (k.founder !== e.id || k.id === e.id) continue;
      if (typeof isVassal === 'function' && isVassal(k)) continue;
      const chk = canOfferPatronage(e, k);
      if (!chk.ok) continue;
      /* İlişki yeterince iyi mi? Minnet solmuşsa zorlamaz. */
      if ((k.rel[e.id] || 0) < 35) continue;
      /* Kabul şansı düşükse etki boşa gitmesin */
      const sans = (typeof patronageChance === 'function') ? patronageChance(e, k) : .5;
      if (sans < .40) continue;

      const r = offerPatronage(e, k);
      e._patronCd = (G.memAge || 0) + 24;
      if (r && r.ok && G.p && !G.p.dead && r.kabul)
        say(e.name + ' · ' + k.name.slice(0, 24) + ' devletini himayesine aldı', 'sci');
      break;                                  // ayda bir teklif yeter
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 45 — SAVAŞ YARDIMI (SUBSIDIES)
   Kukla devlet eski ana gövdesiyle savaşırken hami her ay kasasına
   alaşım ve enerji aktarır. Hami kendi ihtiyacından fedakârlık
   eder — bedava değil.
   ═══════════════════════════════════════════════════════════════════ */
function warSubsidyTick(){
  for (const k of G.emps){
    if (k.dead || k.wild || k.crisisSide) continue;
    if (k.founder === undefined || k.founder === null) continue;
    const hami = G.emps[k.founder];
    if (!hami || hami.dead || hami.wild) continue;
    /* Kukla, ana gövdesiyle savaşta mı? (sundered = eski gövde) */
    const anaGovde = k.sundered;
    if (anaGovde === undefined || anaGovde === null) continue;
    if (!k.war[anaGovde]) continue;
    /* Hami de savaşta olmalı ya da en azından dost kalmalı */
    if (hami.war[k.id]) continue;

    /* Yardım: haminin stoğunun küçük bir dilimi, tavanlı */
    const ala = Math.min(40, Math.floor((hami.res.ala || 0) * .04));
    const ene = Math.min(60, Math.floor((hami.res.ene || 0) * .04));
    if (ala < 5 && ene < 5) continue;

    hami.res.ala = Math.max(0, (hami.res.ala || 0) - ala);
    hami.res.ene = Math.max(0, (hami.res.ene || 0) - ene);
    k.res.ala = (k.res.ala || 0) + ala;
    k.res.ene = (k.res.ene || 0) + ene;
    k._subsidyAt = G.memAge || 0;

    /* Minnet tazelenir */
    k.rel[hami.id] = clamp((k.rel[hami.id] || 0) + .6, -100, 100);

    if (hami.id === 0 && (G.memAge || 0) % 12 === 0)
      say('📦 SAVAŞ YARDIMI — ' + k.name.slice(0, 24) + ' devletine ' +
          ala + ' alaşım, ' + ene + ' enerji gönderildi', 'sci');
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 49 — AI STATÜKO BARIŞI REFLEKSİ
   Faz 48'de statüko mekaniğini kurmuştum ama AI kendiliğinden
   teklif etmiyordu. Artık uzun ve yorucu savaşlarda masaya
   geliyor — özellikle elinde işgal toprağı varsa, çünkü statüko
   o toprakları kalıcı kılar (uti possidetis).
   ═══════════════════════════════════════════════════════════════════ */
function aiStatusQuoTick(){
  if (typeof canStatusQuo !== 'function' || typeof statusQuoPeace !== 'function') return;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    if (e._sqCd && e._sqCd > (G.memAge || 0)) continue;

    for (const w in e.war){
      if (!e.war[w]) continue;
      const o = G.emps[w];
      if (!o || o.dead || o.wild || o.crisisSide) continue;

      const chk = canStatusQuo(e, o);
      if (!chk.ok) continue;

      /* ── KARAR ──
         İstek: kendi yorgunluğu + işgal kazancı − kaybı. */
      const benimExh = (e.exh && e.exh[o.id]) || 0;
      let istek = clamp((benimExh - 60) / 60, 0, 1) * .7;

      /* Fiili durumda ne kazanıp ne kaybediyorum? */
      let kazanc = 0, kayip = 0;
      if (typeof occupationMap === 'function'){
        for (const z of occupationMap(e, o)){
          if (z.yeni === e.id) kazanc++;
          else if (z.yeni === o.id) kayip++;
        }
      }
      istek += kazanc * .30;              // elimdekini mühürlemek cazip
      istek -= kayip * .35;               // kaybettiğimi kabullenmek zor

      /* Kazanan taraf savaşı sürdürmek ister */
      const gucOran = totalPower(e) / Math.max(1, aiKnownPower(e,o));
      istek -= clamp((gucOran - 1) * .35, -.4, .5);

      /* Mizaç */
      const P = (typeof personaOf === 'function') ? personaOf(e) : null;
      if (P){
        if (P.n === 'Pasifist') istek += .35;
        else if (P.n === 'Tüccar') istek += .25;
        else if (P.n === 'Militarist') istek -= .30;
      }
      /* Başka cephede savaşıyorsa bir cepheyi kapatmak ister */
      let cephe = 0;
      for (const w2 in e.war) if (e.war[w2] && G.emps[w2] && !G.emps[w2].wild) cephe++;
      if (cephe >= 2) istek += .30;

      if (istek < .55) continue;

      /* Karşı taraf da kabul etmeli */
      let karsi = clamp((((o.exh && o.exh[e.id]) || 0) - 60) / 60, 0, 1) * .7;
      karsi -= clamp((aiKnownPower(e,o) / Math.max(1, totalPower(e)) - 1) * .35, -.4, .5);
      if (o.id === 0){
        /* Oyuncuya teklif edilir — karar onun */
        if (typeof UI !== 'undefined' && UI.notify){
          e._sqCd = (G.memAge || 0) + 24;
          UI.notify({kind:'sqOffer', data:e.id, ico:'🤝', cls:'sci', pause:true,
            title:'STATÜKO BARIŞI TEKLİFİ', sub:e.name + ' sınırların donmasını öneriyor',
            key:'sq:' + e.id});
        }
        continue;
      }
      if (karsi < .40) continue;

      const r = statusQuoPeace(e, o);
      e._sqCd = (G.memAge || 0) + 24;
      o._sqCd = (G.memAge || 0) + 24;
      if (r && r.ok && G.p && !G.p.dead)
        say('🤝 ' + e.name.slice(0,18) + ' ile ' + o.name.slice(0,18) +
            ' STATÜKO barışı imzaladı — sınırlar donduruldu', 'sci');
      break;                              // ayda bir barış yeter
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 56 — İLERİ ÜS REFLEKSİ
   ÖLÇÜM (bu faz): AI zaten sahipsiz sistemlerde yapı kuruyor
   (35 sistemde 85 yapı) ve tedarik açığı neredeyse yok (2/84).
   Yani genel üs kurma davranışı vardı — EKSİK OLAN REAKTİF
   OLANIYDI: lojistik yüzünden bir hedeften vazgeçtiğinde O YÖNE
   doğru hattı ilerletme refleksi yoktu.
   Artık _blocked damgası okunuyor: engellenen hedefe giden yol
   üzerindeki ilk uygun sisteme karakol/tersane dikiliyor.
   ═══════════════════════════════════════════════════════════════════ */
function aiForwardBaseTick(){
  if (typeof startStruct !== 'function' || typeof fleetSupply !== 'function') return;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    if (!e._blocked) continue;
    /* Damga bayatladıysa bırak */
    if ((G.memAge || 0) - e._blocked.at > 24){ delete e._blocked; continue; }
    /* Ayda bir deneme yeter */
    if (e._fwdCd && e._fwdCd > (G.memAge || 0)) continue;

    const hedefSys = G.sys[e._blocked.sys];
    if (!hedefSys){ delete e._blocked; continue; }

    /* Bütçe: karakol + tersane payı kalmalı */
    if ((e.res.min || 0) < 700) continue;

    /* Hedefe giden yol üzerinde, tedarik hattımızın UCUNDAKİ
       ilk uygun sistemi bul: dost sınıra ≤3 atlama, sahipsiz
       ya da bizim, üzerinde henüz yapı yok. */
    let aday = null, enIyi = 1e9;
    for (const sy of G.sys){
          if(!aiView(e).ctx.visible.has(sy.id)&&sy.owner!==e.id)continue;
      if (sy.owner >= 0 && sy.owner !== e.id) continue;
      const mesafe = supplyDistance(e, {sys: sy.id, ships: [1], e: e.id});
      if (mesafe > 3) continue;                    // ulaşamayacağımız yer
      /* Zaten hattın içindeyse yeni üs bir şey kazandırmaz */
      if (mesafe === 0 && sy.owner === e.id) continue;
      const d = dist(sy, hedefSys);
      if (d < enIyi){ enIyi = d; aday = sy; }
    }
    if (!aday) continue;

    /* Ne kuralım? Sahipsizse önce hak iddiası, bizimse tersane. */
    let yapi = null;
    if (aday.owner < 0) yapi = 'karakol';
    else if (typeof hasStructYard === 'function' && !hasStructYard(aday)) yapi = 'tersane_h';
    else yapi = 'platform';

    if (typeof structAllowed === 'function' && !structAllowed(e, aday, yapi)) continue;
    if (typeof structCost === 'function'){
      const c = structCost(e, yapi);
      if (!Object.keys(c).every(r => (e.res[r] || 0) >= c[r] * 1.2)) continue;
    }

    const r = startStruct(e, aday, yapi);
    if (r !== false){
      e._fwdCd = (G.memAge || 0) + 12;
      e._fwdLast = {sys: aday.id, yapi, at: G.memAge || 0};
      if (G.p && !G.p.dead && G.p.contact && G.p.contact[e.id])
        say(e.name + ' sınırında ileri üs kuruyor: ' + aday.name, 'war');
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 68 — AI GALAKTİK PİYASA KULLANIMI
   Piyasa Faz 66'da eklendi ama fiyatı yalnız oyuncu kıpırdatıyordu.
   Artık AI da dengesizliğini piyasada çözüyor: bol olanı satıp
   dar olanı alıyor. Böylece savaş dönemlerinde alaşım doğal olarak
   pahalanıyor, barışta ucuzluyor — oyuncu hiç işlem yapmasa bile.
   ═══════════════════════════════════════════════════════════════════ */
/* FAZ 73: ÖLÇÜM (60 yıl) — 9 AI'da bolluk vardı ama hiçbirinde
   darlık yoktu, eşik çok yüksekti ve pazar hiç kullanılmadı.
   2000/500'e çekildi. */
const AI_MARKET_BOL   = 2000;   // bu üstü "fazla"
const AI_MARKET_DAR   = 500;    // bu altı "dar"
const AI_MARKET_DILIM = .22;    // fazlanın bu kadarı satılır

function aiMarketTick(){
  if (typeof marketTrade !== 'function') return;
  if (typeof marketOpen === 'function' && !marketOpen()) return;   // FAZ 78
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    /* FAZ 73: Fanatik Arındırıcılar pazara girmez — kimseyle
       alışveriş yapmazlar, doktrin bunu yasaklar. */
    if (typeof isPurifier === 'function' && isPurifier(e)) continue;
    if (e._mktCd && e._mktCd > (G.memAge || 0)) continue;

    /* En bol ve en dar kaynağı bul */
    let bol = null, bolV = 0, dar = null, darV = 1e9;
    for (const r of MARKET_RES){
      const v = e.res[r] || 0;
      if (v > bolV){ bolV = v; bol = r; }
      if (v < darV){ darV = v; dar = r; }
    }
    if (!bol || !dar || bol === dar) continue;
    if (bolV < AI_MARKET_BOL || darV > AI_MARKET_DAR) continue;

    /* Ne kadar satsın? Fazlanın bir dilimi, tavanlı */
    const miktar = Math.min(2500, Math.floor((bolV - AI_MARKET_BOL) * AI_MARKET_DILIM));
    if (miktar < 150) continue;

    /* Kur çok kötüyse bekle — AI da aptal tüccar değil */
    const q = marketQuote(bol, dar, miktar);
    if (!q.ok) continue;
    const oran = q.alinan / miktar;
    const adilOran = (MARKET_BASE[bol] || 1) / (MARKET_BASE[dar] || 1) * .75;
    if (oran < adilOran) { e._mktCd = (G.memAge || 0) + 6; continue; }

    marketTrade(e, bol, dar, miktar);
    e._mktCd = (G.memAge || 0) + 4;      // 4 ay bekleme
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 68 — AI KADEMELİ İSTİHBARAT TEKLİFLERİ
   Sensör anlaşması güven eşiği düşük (müttefiklik ya da +55 ilişki).
   Casusluk ağı paktı çok daha mahrem: +80 ilişki ya da ittifak
   ister, çünkü ortağın gördüğü her şeyi görürsün.
   ═══════════════════════════════════════════════════════════════════ */
function aiIntelPactTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    if (typeof isPurifier === 'function' && isPurifier(e)) continue;  // FAZ 73
    if (e._pactCd && e._pactCd > (G.memAge || 0)) continue;
    if ((e.res.etk || 0) < 140) continue;

    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    /* İzolasyonist kimseye ağını açmaz */
    if (P && P.n === 'Fanatik Arındırıcılar') continue;

    for (const o of G.emps){
      if (o.dead || o.wild || o.crisisSide || o.id === e.id) continue;
      if (!e.contact[o.id] || e.war[o.id]) continue;
      const rel = e.rel[o.id] || 0;
      const mutt = !!(e.ally && e.ally[o.id]);

      /* CASUSLUK AĞI: en mahrem pakt */
      const zatenSpy = e.spynet && e.spynet[o.id];
      if (!zatenSpy && (rel >= 80 || (mutt && rel >= 60))){
        e._pactCd = (G.memAge || 0) + 36;
        if (o.id === 0){
          /* Oyuncuya teklif — kabul/ret oyuncunun */
          if (typeof UI !== 'undefined' && UI.notify)
            UI.notify({kind:'pact', data:{from:e.id, tur:'spynet'}, ico:'🕸',
              cls:'sci', pause:false, title:'Casusluk Ağı Paktı',
              sub:e.name + ' istihbarat ağlarını seninle birleştirmek istiyor',
              key:'pact:' + e.id});
        } else {
          /* AI–AI: doğrudan kurulur */
          e.spynet = e.spynet || {}; o.spynet = o.spynet || {};
          e.spynet[o.id] = true; o.spynet[e.id] = true;
          e.res.etk -= 120;
        }
        break;
      }

      /* SENSÖR ANLAŞMASI: daha kolay */
      const zatenSen = e.visionFrom && e.visionFrom[o.id];
      if (!zatenSen && (mutt || rel >= 55)){
        e._pactCd = (G.memAge || 0) + 24;
        if (o.id === 0){
          if (typeof UI !== 'undefined' && UI.notify)
            UI.notify({kind:'pact', data:{from:e.id, tur:'intel'}, ico:'👁',
              cls:'sci', pause:false, title:'Sensör Anlaşması',
              sub:e.name + ' harita görüşünü paylaşmak istiyor',
              key:'pact:' + e.id});
        } else {
          e.visionFrom = e.visionFrom || {}; o.visionFrom = o.visionFrom || {};
          e.visionFrom[o.id] = true; o.visionFrom[e.id] = true;
          e.res.etk -= 45;
        }
        break;
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 71 — PROAKTİF SIĞINMA
   Zayıf ve tehdit altındaki AI, yok olmaktansa boyun eğmeyi seçer:
   güçlü ve kendisiyle savaşta OLMAYAN bir devlete "vasalınız olalım"
   der. Teslimiyet değil, hesaplı hayatta kalma — senyör onu
   savunmak zorundadır.
   ═══════════════════════════════════════════════════════════════════ */
function aiSubmitTick(){
  if (typeof subjugate !== 'function' || typeof isVassal !== 'function') return;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    if (isVassal(e)||(e.res.etk||0)<VASSAL_SEEK_COST) continue;
    if (typeof isPurifier === 'function' && isPurifier(e)) continue;  // FAZ 73
    if (e._submitCd && e._submitCd > (G.memAge || 0)) continue;
    if (typeof vassalsOf === 'function' && vassalsOf(e).length) continue;

    const gucum = totalPower(e);
    let sysN = 0;
    for (const sy of G.sys) if (sy.owner === e.id) sysN++;
    if (sysN > 6) continue;

    let tehdit = null, enGuc = 0;
    for (const o of G.emps){
      if (o.dead || o.wild || o.crisisSide || o.id === e.id) continue;
      if (!e.war[o.id]) continue;
      const g = aiKnownPower(e,o);
      if (g > gucum * 1.8 && g > enGuc){ enGuc = g; tehdit = o; }
    }
    if (!tehdit){
      for (const o of G.emps){
        if (o.dead || o.wild || o.crisisSide || o.id === e.id) continue;
        if (!e.contact[o.id]) continue;
        if ((e.rel[o.id] || 0) > -20) continue;
        const g = aiKnownPower(e,o);
        if (g > gucum * 2.6 && g > enGuc){ enGuc = g; tehdit = o; }
      }
    }
    if (!tehdit) continue;

    let hami = null, enIyi = 0;
    for (const o of G.emps){
      if (o.dead || o.wild || o.crisisSide || o.id === e.id) continue;
      if (o.id === tehdit.id || e.war[o.id]) continue;
      if (!e.contact[o.id]) continue;
      if (isVassal(o)) continue;
      const access=aiProtection(e,o);if(!access.ok)continue;
      const g = aiKnownPower(e,o);
      if (g < gucum * 1.6) continue;
      let puan = g / 1000;
      puan += (e.rel[o.id] || 0) * .04;
      if (aiKnownWar(e,o,tehdit)) puan += 12;
      puan-=access.eta/30;
      if (e.ally && e.ally[o.id]) puan += 8;
      if (puan > enIyi){ enIyi = puan; hami = o; }
    }
    if (!hami) continue;

    e._submitCd = (G.memAge || 0) + 60;
    e.aiProtectionReason=aiProtection(e,hami);

    if (hami.id === 0){
      if (typeof UI !== 'undefined' && UI.notify)
        UI.notify({kind:'submit', data:{from: e.id, tehdit: tehdit.id},
          ico:'⛓', cls:'sci', pause:false, title:'Sığınma Talebi',
          sub: e.name + ' vasalın olmak istiyor', key:'sub:' + e.id});
      continue;
    }

    const P = (typeof personaOf === 'function') ? personaOf(hami) : null;
    let kabul = .55;
    if (P && P.n === 'Militarist') kabul += .25;
    if (P && P.n === 'Fanatik Arındırıcılar') kabul -= .30;
    if (P && P.n === 'Pasifist') kabul -= .10;
    if (aiKnownWar(e,hami,tehdit)) kabul += .25;
    if (rnd() > clamp(kabul, .1, .9)) continue;

    if(!subjugate(hami,e,'bekci'))continue;
    e.res.etk-=VASSAL_SEEK_COST;
    e.rel[hami.id] = clamp((e.rel[hami.id] || 0) + 25, -100, 100);
    e._submitted = true;
    if (G.p && !G.p.dead && G.p.contact && G.p.contact[e.id])
      say('⛓ ' + e.name + ', ' + hami.name + ' himayesine sığındı', 'sci');
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 72 — AI SENYÖR EMİRLERİ
   Faz 71'de emir mekaniği yalnız oyuncuya açıktı; 60 yıllık
   koşuda emir sayısı 0 çıkmıştı. Artık AI senyörler de vasal
   sadakatini ölçüp uygun emri dayatıyor. Yanlış hesap yaparsa
   isyanla karşılaşır — risk simetriktir.
   ═══════════════════════════════════════════════════════════════════ */
function aiEdictTick(){
  if (typeof issueEdict !== 'function' || typeof vassalLoyalty !== 'function') return;

  for (const lord of G.emps){
    if (lord.dead || lord.wild || lord.crisisSide || !lord.ai) continue;
    if (lord._aiEdictCd && lord._aiEdictCd > (G.memAge || 0)) continue;
    if ((lord.res.etk || 0) < 200) continue;

    const vasallar = (typeof vassalsOf === 'function') ? vassalsOf(lord) : [];
    if (!vasallar.length) continue;

    /* En sadık vasalı seç — riski en düşük olan */
    let hedef = null, enSadik = -1;
    for (const v of vasallar){
      const l = vassalLoyalty(v);
      if (l > enSadik){ enSadik = l; hedef = v; }
    }
    if (!hedef) continue;

    /* Hangi emri istiyor? Mizaç ve duruma göre */
    const P = (typeof personaOf === 'function') ? personaOf(lord) : null;
    let savasta = false;
    for (const w in lord.war)
      if (lord.war[w] && G.emps[w] && !G.emps[w].wild) savasta = true;

    const adaylar = [];
    if (savasta) adaylar.push('savasCagri');
    if (P && (P.n === 'Teknokrasi' || P.n === 'Tüccar')) adaylar.push('bilimPayi');
    if ((lord.res.ala || 0) < 1500) adaylar.push('ekVergi');
    if (typeof councilExists === 'function' && councilExists() &&
        G.council.members.includes(lord.id)) adaylar.push('oyBirligi');
    if (!adaylar.length) adaylar.push('ekVergi');

    /* GÜVENLİ SEÇİM: sadakati yeten emirlerden en değerlisi.
       AI kumar oynamaz — isyan riskini bilerek almaz. */
    let secim = null;
    for (const k of adaylar){
      const E = EDICTS[k];
      if (!E || (hedef.edicts && hedef.edicts[k])) continue;
      if (enSadik >= E.sadakat + 8){ secim = k; break; }   // 8 puan pay
    }
    if (!secim) continue;

    const r = issueEdict(lord, hedef, secim);
    lord._aiEdictCd = (G.memAge || 0) + 30;
    if (r && r.ok && !r.kabul && G.p && !G.p.dead &&
        G.p.contact && G.p.contact[hedef.id])
      say('⛓ ' + hedef.name + ', ' + lord.name + ' emrini reddetti — isyan!', 'war');
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 72 — AI FEDERASYON İÇ YASA OYLAMASI
   AI üyeler kendi ideolojilerine uygun iç yasayı öneriyor.
   ═══════════════════════════════════════════════════════════════════ */
function aiFedLawTick(){
  if (typeof proposeFedLaw !== 'function' || typeof findFed !== 'function') return;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    if (e._fedLawCd && e._fedLawCd > (G.memAge || 0)) continue;
    if ((e.res.etk || 0) < 220) continue;

    const f = findFed(e);
    if (!f || f.vote || f.lawVote) continue;
    if (typeof fedCohesion === 'function' && fedCohesion(f) < 35) continue;

    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    const sira = [];
    if (P){
      if (P.n === 'Militarist') sira.push('ortakDon','ortakDoktrin','seriUretim','ikmalStandardi','serbest');
      else if (P.n === 'Teknokrasi') sira.push('bilimAgi','sivilFon','uyumProgrami','serbest');
      else if (P.n === 'Tüccar') sira.push('sivilFon','patentOzerk','refah','serbest');
      else if (P.n === 'Pasifist') sira.push('savasOnay','refah','uyumProgrami','bilimAgi');
      else sira.push('serbest','uyumProgrami','ortakDon','ikmalStandardi');
    } else sira.push('serbest');

    for (const k of sira){
      if (f.laws && f.laws[k]) continue;
      if (fedLawConflicts(f,k).length) continue; // AI aynı bütçeyi durmadan tersine çevirmesin.
      if (!FED_INNER_LAWS[k] || !canFedLaw(e, k).ok) continue;
      if ((e.res.etk || 0) < FED_INNER_LAWS[k].c) continue;
      const r = proposeFedLaw(e, k);
      if (r && r.ok) e._fedLawCd = (G.memAge || 0) + 36;
      break;
    }
  }
}

/* 95B political decisions use the same learned graph and estimates as 95A.
   No foreign stock, private technologies or unexplored capital coordinates. */
function aiFedAffinity(e,type){
 const p=e._prof||aiProfile({...e}),war=Object.keys(e.war||{}).some(id=>e.war[id]&&!G.emps[id]?.wild);
 const doctrine=researchDoctrine(e);
 if(type==='askeri')return .35+p.war*.45+(war?.2:0)+(doctrine==='militarist'?.25:0);
 if(type==='bilimsel')return .35+p.sci*.45+(doctrine==='teknokrasi'?.3:0)+((e.factions||[]).some(x=>x.k==='bilim'&&x.mood<40)?.15:0);
 return .35+p.eco*.45+(['tuccar','kriminal'].includes(doctrine)?.25:0)+((e.inc.ene||0)<5?.1:0);
}
function aiFedType(e){return Object.keys(FED_TYPES).sort((a,b)=>aiFedAffinity(e,b)-aiFedAffinity(e,a)||a.localeCompare(b))[0];}
function aiFedHelp(e,other,warTarget=false){
 if(!e||!other)return null;
 const home=G.sys[e.home];if(!home)return null;
 const targets=aiKnownSystems(e,other.id).sort((a,b)=>dist(home,a)-dist(home,b)||a.id-b.id).slice(0,4);
 const forces=G.fleets.filter(f=>f.e===e.id&&isArmed(f)&&!f.retreating&&fleetSupply(e,f)>.55);
 for(const target of targets)for(const f of forces){const r=aiKnownRoute(e,f,f.mv?f.mv.to:f.sys,target.id,e,warTarget?other.id:null);if(r&&r.eta<=180)return {ok:true,eta:r.eta};}
 return null;
}
function aiFedWilling(e,founder,type,f=null){
 if(!e||!founder||e.dead||e.wild||e.crisisSide||isPurifier(e)||isVassal(e)||!e.contact[founder.id]||e.war[founder.id]||(e._fedLeaveUntil||0)>G.day)return {ok:false,why:'Siyasi koşullar uygun değil'};
 const rel=e.rel[founder.id]||0;if(rel<15||trustOf(e,founder.id)<-35)return {ok:false,why:'Güven veya ilişki yetersiz'};
 let eta=Infinity;const home=G.sys[e.home];
 const targets=aiKnownSystems(e,founder.id).sort((a,b)=>dist(home,a)-dist(home,b)||a.id-b.id).slice(0,3);
 const probe={e:e.id,ships:[{c:type==='askeri'?'kor':'bil',h:1}]};
 for(const s of targets){const route=aiKnownRoute(e,probe,e.home,s.id);if(route)eta=Math.min(eta,route.eta);}
 if(eta>(type==='askeri'?180:360))return {ok:false,why:'Bilinen yardım/iş birliği rotası yetersiz'};
 // Protection uses 95A's observation/uncertainty estimate, never a private force total.
 const protection=type==='askeri'?clamp(aiKnownPower(e,founder)/(totalPower(e)+100),0,2)*.08:0;
 const score=aiFedAffinity(e,type)+rel/160+trustOf(e,founder.id)/300+protection-(f&&fedCohesion(f)<35?.4:0);
 return {ok:score>=.65,score,eta,why:score>=.65?'Doktrin, güven ve bilinen erişim uygun':'Birliğin öncelikleri uygun değil'};
}
function aiFedVoteWant(e,f,v){
 const proposer=G.emps[v.proposer],rel=proposer?(e.rel[proposer.id]||0):0;
 let want=.4+rel/300+(fedCohesion(f)-50)/250;
 if(v.motion==='admit'){const target=G.emps[v.target];return target&&e.contact[target.id]&&!e.war[target.id]?clamp(.4+(e.rel[target.id]||0)/130+trustOf(e,target.id)/250,.02,.95):.02;}
 if(v.motion==='expel')return clamp(.3-(e.rel[v.target]||0)/120-trustOf(e,v.target)/200,.02,.95);
 if(v.motion==='elect')return clamp(.35+(e.rel[v.target]||0)/160+(v.target===e.id?.2:0),.02,.95);
 if(v.motion==='reform')want+=aiFedAffinity(e,v.type)-aiFedAffinity(e,f.type);
 if(v.motion==='charter'){
  if(v.field==='offense'&&v.value==='auto')want+=aiProfile(e).war*.5-.5;
  if(v.field==='defense'&&v.value==='auto')want+=aiProfile(e).war*.2+aiProfile(e).dip*.1;
  if(v.field==='admission'&&v.value==='contact')want+=aiProfile(e).dip*.25;
 }
 if(v.motion==='joinWar'||v.motion==='newWar'){
  const target=G.emps[v.target];if(!target||!e.contact[target.id]||e.ally[target.id]||(e.nap?.[target.id]||0)>G.day)return .01;
  if(!e.war[target.id]&&(!fedSupportGate(e,target).ok||!aiFedHelp(e,target,true)))return .01;
  const ratio=totalPower(e)/(aiKnownPower(e,target)+1);
  want=.3+aiProfile(e).war*.35-(e.rel[target.id]||0)/250+((e.war[target.id]||aiObservedThreat(e,e.home)>0)?.25:0)-clamp(.8-ratio,0,.8)*.35;
 }
 return clamp(want,.02,.95);
}
function aiFederationPolitics(){
 for(const e of G.emps){
  if(!e.ai||e.dead||e.wild||e.crisisSide||isPurifier(e)||isVassal(e))continue;
  const month=G.year*12+G.month;if(e._fedPoliticsMonth===month)continue;e._fedPoliticsMonth=month;
  if((e._fedPoliticsAfter||0)>G.day)continue;
  let f=findFed(e);
  if(!f){
   let invited=false;
   for(const other of G.feds||[])if(other.invites?.[e.id]){const inv=other.invites[e.id],founder=G.emps[inv.by];if(aiFedWilling(e,founder,other.type,other).ok)acceptFedInvite(e,other.id);else rejectFedInvite(e,other.id);invited=true;break;}
   if(invited)continue;
   const type=aiFedType(e),gate=canFoundFed(e,type);
   if(gate.ok){const result=foundFederation(e,type);e.aiFedReason={day:G.day,kind:'found',type,why:'Kabul eden müttefikler, bilinen rota ve doktrin uyumu'};if(result.ok)e._fedPoliticsAfter=G.day+360;}
   continue;
  }
  for(const d of Object.values(f.decisions||{}))if(d.state==='ready'&&(d.by===e.id||f.leader===e.id))executeFedDecision(e,f.id,d.id);
  if(f.vote)continue;
  if(G.day-f.founded>=720&&fedCohesion(f)<20&&(e.rel[f.leader]||0)<-50){leaveFederation(e);e.aiFedReason={day:G.day,kind:'leave',why:'Uzun süreli uyumsuzluk ve başkana güvensizlik'};continue;}
  if(f.leader!==e.id)continue;
  const offer=(kind,options)=>{const result=proposeFedMotion(e,kind,options);if(result.ok){e._fedPoliticsAfter=G.day+360;e.aiFedReason={day:G.day,kind,...options,why:'Güven, doktrin, erişim ve mevcut birlik koşulları'};}return result.ok;};
  const hostile=f.members.find(id=>id!==e.id&&(e.rel[id]||0)<-65&&trustOf(e,id)<-40);
  if(hostile!==undefined&&offer('expel',{target:hostile}))continue;
  const preferred=aiFedType(e);
  if(G.day-f.founded>=720&&preferred!==f.type&&aiFedAffinity(e,preferred)>aiFedAffinity(e,f.type)+.2&&offer('reform',{type:preferred}))continue;
  const candidate=G.emps.find(o=>o!==e&&e.contact[o.id]&&(e.rel[o.id]||0)>45&&fedAdmissionGate(f,o).ok&&aiFedWilling(o,e,f.type,f).ok);
  if(candidate&&offer('admit',{target:candidate.id}))continue;
  if(f.type==='askeri'){
   const enemy=G.emps.find(o=>e.war[o.id]&&!o.dead&&!o.wild&&!o.crisisSide&&f.members.some(id=>!G.emps[id].war[o.id]));
   if(enemy)offer('joinWar',{target:enemy.id,sponsor:e.id});
  }
 }
}
