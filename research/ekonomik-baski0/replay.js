// This file is loaded *only* in a separate research process, after Save8 restoration.
const focal=G.emps[actorId], events=[];
const ownColonies=e=>e.colonies.map(c=>G.sys[c.s].planets[c.p]).filter(p=>p.owner===e.id&&p.col);
function setFoodShock(e,months){
  for(const p of ownColonies(e))delete p.col.b.ciftlik;
  e.inc=empireIncome(e);
  if(e.inc.yiy>=0)throw Error('Fixture needs an actual food deficit');
  e.res.yiy=-months*e.inc.yiy;
}
if(group==='A'){
  if(arm==='full')for(const p of ownColonies(focal))p.col.pop=p.col.cap;
  focal.inc=empireIncome(focal);
}
if(group==='B'||group==='F'){
  setFoodShock(focal,arm==='reserve'?36:8);
  if(group==='F'){
    focal.mizac=arm;applyChosenPersona(focal,arm);delete focal._prof;delete focal._persAt;
    recalcMods(focal);focal.inc=empireIncome(focal);personaOf(focal);
  }
}
if(group==='D'&&['pressure','food'].includes(arm))setFoodShock(focal,8);
if(group==='D'&&['pressure','relations'].includes(arm)){
  // Three known neighbours. B and C trust each other; the existing B–A pact survives at t0.
  for(const id of [3,8]){
    if(!focal.contact[id]||!G.emps[id].contact[focal.id])throw Error('Contact');
    focal.rel[id]=-55;G.emps[id].rel[focal.id]=-55;
  }
  G.emps[3].rel[8]=G.emps[8].rel[3]=65;
}
if(group==='E'&&arm==='weak'){
  focal.res.ene=0;focal.res.ala=0;
  for(const f of G.fleets)if(f.e===focal.id&&isArmed(f))f.ships=f.ships.slice(0,1);
  focal.inc=empireIncome(focal);
}
if(group==='D'&&arm==='shared'){
  if(!G.emps[3].war[10]||!G.emps[3].contact[8])throw Error('Missing initial front/contact');
  const auth=G._warAuth,why=G._warWhy;
  try{
    warAuthorize(G.emps[3],G.emps[8],{n:'Araştırma başlangıcında ikinci cephe'});
    if(!declareWar(G.emps[3],G.emps[8]))throw Error('Initial front refused');
  }finally{G._warAuth=auth;G._warWhy=why;}
}
const watch=group==='D'?[3,7,8,10]:group==='E'?[actorId,5]:[actorId];
function logAction(name,callback){
  const original=globalThis[name];globalThis[name]=function(...args){
    const result=original.apply(this,args),entry=callback(result,...args);
    if(entry&&watch.includes(entry.by))events.push({day:G.day,action:name,...entry});
    return result;
  };
}
logAction('queueBuilding',(ok,e,s,p,key)=>ok&&({by:e.id,s:s.id,p:p.i,key,paid:p.col.q.at(-1)?.paid}));
logAction('queueDemolish',(ok,e,s,p,key)=>ok&&({by:e.id,s:s.id,key}));
logAction('doColonize',(_,e,s,p)=>p?.owner===e.id&&({by:e.id,s:s.id}));
logAction('aiNegotiate',(v,e,o,g,w)=>({by:e.id,to:o.id,terms:[...g,...w],ok:!!v?.uygulandi}));
logAction('declareWar',(v,e,o)=>v&&({by:e.id,to:o.id}));
if(group==='E'&&['exchange','low-bid'].includes(arm)){
  const e=focal,partner=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&e.ally[o.id]&&e.contact[o.id]&&!e.war[o.id]&&!diploBlocked(e,o))
    .sort((a,b)=>e.rel[b.id]-e.rel[a.id]||a.id-b.id)[0];
  const units=10*Math.ceil(-3*e.inc.yiy/10),price=arm==='exchange'?units*1.5:10;
  if(!partner||e.res.ene<price||e.inc.ene<=0)throw Error('Unfunded partner fixture');
  const before={food:e.res.yiy,energy:e.res.ene,influence:e.res.etk};
  const result=aiNegotiate(e,partner,[{t:'res',r:'ene',v:price}],[{t:'res',r:'yiy',v:units}],true);
  events.push({day:G.day,action:'exchange-receipt',by:e.id,to:partner.id,units,price,before,
    after:{food:e.res.yiy,energy:e.res.ene,influence:e.res.etk},result});
}
function current(){
  return {day:G.day,rng:RND_STATE,over:!!G.over,
    states:watch.map(id=>{
      const e=G.emps[id],cols=ownColonies(e);
      return {id,persona:e._pers,stock:{...e.res},inc:{...e.inc},crisis:e.crisis,shortage:e.shortage,
        food:e.foodNeed,cg:e.cgNeed,cols:cols.map(p=>({name:p.name,pop:p.col.pop,cap:p.col.cap,stab:p.col.stab,farms:p.col.b.ciftlik||0})),
        goal:e.aiStrategy?.objective?.kind,stage:e.aiStrategy?.plan?.stage,focus:e.aiStrategy?.plan?.focus,
        fed:findFed(e)?.id,war:Object.keys(e.war||{}).filter(i=>e.war[i]).map(Number),
        ally:Object.keys(e.ally||{}).filter(i=>e.ally[i]).map(Number),pacts:Object.keys(e.pact||{}).filter(i=>e.pact[i]).map(Number),
        freight:G.commerce?.stats?.[id]?.received||{}};
    }),feds:G.feds.map(f=>[f.id,f.type,f.members.slice()]),
    fronts:(G.warLedger?.fronts||[]).filter(f=>f.sides.some(i=>watch.includes(i))).map(f=>({id:f.id,sides:f.sides,opened:f.opened,ended:f.ended,goals:f.goals,lost:f.metrics.map(x=>x.shipsLost),occupation:f.occupation})),
    contracts:(G.commerce?.contracts||[]).filter(c=>watch.includes(c.a)||watch.includes(c.b)).map(c=>[c.id,c.a,c.b,c.status,c.delivered])};
}
function diagnose(){
  const e=focal,plan=aiEconomyPlan(e),view=aiView(e);
  return {profile:aiProfile(e),policy:plan.policy,rows:plan.rows,trade:Commerce.aiBalance(e),room:colonizeTargets(e),
    severe:aiStrategicFacts(e).severe,partners:G.emps.filter(o=>o!==e&&e.contact[o.id]&&!o.wild&&!o.dead&&!o.crisisSide).map(o=>{
      const a=warAppetite(e,o);return {id:o.id,cb:a.cb,score:a.score,ready:aiStrategicWarReady(e,o),access:aiWarAccess(e,o),budget:aiWarBudget(e,o),goal:aiWarGoalChoice(e,o,'fetih')};
    }),known:Object.keys(view.systems).length};
}
