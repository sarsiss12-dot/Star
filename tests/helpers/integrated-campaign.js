'use strict';
const {createHash}=require('crypto');
const {runtime}=require('./runtime');

// Executed INSIDE the production VM. Observation never calls another mechanic,
// quotes a hypothetical action, primes a supply cache, or consumes random state.
function observeCampaign(){
  const m={negotiation:{attempts:0,applied:0,counter:0,maxRounds:0,outcomes:{},types:{},reasons:{},excluded:{}},
    espionage:{probes:0,noChoice:0,choices:{},operations:{}},
    reinforcement:{orders:0,queued:0,targeted:0,dispatches:0,dispatchResults:{},
      merges:0,mergedShips:0,abandoned:0},
    logistics:{fleetMonths:0,shortFleetMonths:0,criticalFleetMonths:0,damagedFleetMonths:0,
      lostShips:0,hullFractionLost:0,retreatAttempts:0,retreatStarted:0,retreatFailed:0,failedExamples:[]},
    movement:{arrivals:0,surveys:0,battleRounds:0,waypointCalls:0},
    factions:{coups:0,invalidAfterCoup:[]},exceptions:{}};
  const isAI=e=>e&&e.ai&&!e.dead&&!e.wild&&!e.crisisSide;
  const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
  const wrap=(name,fn)=>{
    const old=globalThis[name];
    if(typeof old!=='function')throw Error('Missing production function: '+name);
    globalThis[name]=function(...args){
      try{return fn(()=>Reflect.apply(old,this,args),args);}
      catch(e){bump(m.exceptions,name);throw e;}
    };
  };
  for(const [name,key] of [['arrive','arrivals'],['doSurvey','surveys'],['battleRound','battleRounds']])
    wrap(name,(call)=>{m.movement[key]++;return call();});
  wrap('aiNegotiate',(call,[a,b,give,want])=>{
    const n=m.negotiation;n.attempts++;
    const types=[...new Set([...(give||[]),...(want||[])].map(it=>it.t))].sort().join('+');
    const r=call();bump(n.outcomes,r.karar||'no-decision');bump(n.types,types);
    if(!r.karar)bump(n.excluded,!a||!b?'missing':a.id===0||b.id===0?'player':
      a.dead||b.dead?'dead':a.wild||b.wild?'wild':'other');
    n.applied+=+!!r.uygulandi;n.counter+=+(r.tur===2);n.maxRounds=Math.max(n.maxRounds,r.tur);
    if(!r.uygulandi)bump(n.reasons,r.why||'no-reason');
    return r;
  });
  wrap('aiPickOp',(call)=>{const k=call(),s=m.espionage;s.probes++;
    if(k)bump(s.choices,k);else s.noChoice++;return k;});
  for(const [name,fixed] of [['runOp',null],['stealTech','stealTech'],['inciteRebellion','incite']]){
    wrap(name,(call,[e,target,key])=>{
      if(!isAI(e))return call();
      key=fixed||key;
      const s=m.espionage.operations[key]||(m.espionage.operations[key]={attempts:0,resolved:0,rejected:0,
        caught:0,outcomes:{},cost:{},reasons:{}});
      s.attempts++;const r=call();
      if(r&&r.ok){s.resolved++;s.caught+=+!!r.caught;
        // Standard operations have independent detection but no success roll.
        bump(s.outcomes,fixed?r.outcome:'resolved-standard');
        const cost=fixed?{etk:r.cost}:r.quote.cost;
        for(const [k,v] of Object.entries(cost))bump(s.cost,k,v);
      }else{s.rejected++;bump(s.reasons,r&&(r.why||r.msg)||'no-result');}
      return r;
    });
  }
  wrap('aiQueueMilitaryShip',(call,[e,yard])=>{
    const s=m.reinforcement;s.orders++;const r=call();
    if(r){s.queued++;const q=yard.queue[yard.queue.length-1];
      if(q&&q.delivery&&q.delivery.fleet!==undefined)s.targeted++;}
    return r;
  });
  wrap('dispatchBuiltFleet',(call,[e,f])=>{const r=call();if(isAI(e)){
    m.reinforcement.dispatches++;bump(m.reinforcement.dispatchResults,r);}return r;});
  wrap('followRallyFleet',(call,[f])=>{
    if(!isAI(G.emps[f.e])||f.joinFleet===undefined||f.mv||f.path.length||!f.ships.length)return call();
    const target=G.fleets.find(x=>x.id===f.joinFleet&&x!==f&&x.e===f.e&&x.ships.length);
    const ships=f.ships.slice(),r=call();
    if(target&&!f.ships.length&&ships.every(sh=>target.ships.includes(sh))){
      m.reinforcement.merges++;m.reinforcement.mergedShips+=ships.length;
    }else if(f.joinFleet===undefined)m.reinforcement.abandoned++;
    return r;
  });
  let logisticsDepth=0;
  wrap('aiLogisticsTick',(call)=>{logisticsDepth++;try{return call();}finally{logisticsDepth--;}});
  wrap('orderMove',(call,[f,target,append])=>{
    if(append)m.movement.waypointCalls++;
    const track=logisticsDepth>0&&isAI(G.emps[f.e]),r=call();
    if(track){const s=m.logistics;s.retreatAttempts++;
      if(r)s.retreatStarted++;else{s.retreatFailed++;
        if(s.failedExamples.length<8)s.failedExamples.push({day:G.day,fleet:f.id,emp:f.e,from:f.sys,target});}}
    return r;
  });
  wrap('attritionTick',(call)=>{
    const before=G.fleets.filter(f=>isAI(G.emps[f.e])&&f.ships.length)
      .map(f=>({f,ships:f.ships.map(sh=>({sh,h:sh.h}))}));
    const r=call(),s=m.logistics;
    for(const {f,ships} of before){
      s.fleetMonths++;s.shortFleetMonths+=+(f.supply<1);s.criticalFleetMonths+=+(f.supply<=.55);
      let loss=0;for(const {sh,h} of ships){loss+=Math.max(0,h-sh.h);if(!f.ships.includes(sh))s.lostShips++;}
      if(loss>0)s.damagedFleetMonths++;s.hullFractionLost+=loss;
    }
    return r;
  });
  wrap('facCoup',(call,[e,f])=>{
    const before=e.factions.map(x=>({k:x.k,pow:x.pow})),r=call(),s=m.factions;
    s.coups++;const total=e.factions.reduce((a,x)=>a+x.pow,0);
    if(total!==100&&s.invalidAfterCoup.length<4)s.invalidAfterCoup.push({day:G.day,emp:e.id,
      faction:f.k,before,after:e.factions.map(x=>({k:x.k,pow:x.pow})),total});
    return r;
  });
  return m;
}

function integratedCampaign(root,{seed=11,months=240,size='buyuk',observe=true}={}){
  const h=runtime({root});h.sb.__config={seed,months,size};
  const started=Date.now();
  h.run(`setupGame({name:'91B',race:'insan',traits:[],size:__config.size,shape:'sarmal',diff:'normal',
    seed:__config.seed,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
    G.autoSave=false;economyTick(true);`);
  h.run('var campaignMetrics='+ (observe?'('+observeCampaign.toString()+')()':'null')+';');
  const result=JSON.parse(h.run(`
    var result={seed:__config.seed,size:__config.size,targetMonths:__config.months,months:0,steps:0,
      initialSystems:G.sys.length,initialContacts:0,first:{},stopped:null,monthly:[],metrics:campaignMetrics};
    function contacts(){let n=0;for(const a of G.emps)for(const b of G.emps)
      if(a.id<b.id&&!a.wild&&!b.wild&&!a.dead&&!b.dead&&a.contact[b.id]&&b.contact[a.id])n++;return n;}
    function issue(key,detail){if(!result.first[key])result.first[key]={day:G.day,...detail};}
    function monthlySample(){
      const ai=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide);
      let sum=0,pairs=0,war=0,pact=0,ally=0,nap=0;
      for(const a of ai)for(const b of ai)if(a.id<b.id&&a.contact[b.id]&&b.contact[a.id]){
        sum+=((a.rel[b.id]||0)+(b.rel[a.id]||0))/2;pairs++;
        war+=+!!(a.war&&a.war[b.id]);pact+=+!!(a.pact&&a.pact[b.id]);
        ally+=+!!(a.ally&&a.ally[b.id]);nap+=+!!(a.nap&&a.nap[b.id]>G.day);
      }
      result.monthly.push({month:result.months,aliveAI:ai.length,contacts:contacts(),aiPairs:pairs,
        meanRelation:pairs?sum/pairs:null,war,pact,ally,nap,
        aiLowInfluence:ai.filter(e=>e.res.etk<40).length,
        minInfluence:ai.length?Math.min(...ai.map(e=>e.res.etk)):null});
      for(const e of G.emps){if(e.dead||e.wild)continue;
        for(const [k,v] of Object.entries(e.res))if(!Number.isFinite(v)||v<-.00001)issue('stock',{emp:e.id,key:k,value:v});
        if(e.factions){const sum=e.factions.reduce((s,f)=>s+f.pow,0);if(sum!==100)
          issue('factionTotal',{emp:e.id,sum,factions:e.factions.map(f=>({k:f.k,pow:f.pow,mood:f.mood}))});}
      }
    }
    result.initialContacts=contacts();
    result.initialAI=G.emps.filter(e=>e.ai&&!e.wild).map(e=>({id:e.id,race:e.race,civics:e.civics,ethics:e.ethics,origin:e.origin}));
    var firstDay=G.day,firstMonth=G.year*12+G.month;
    try{for(var i=0;i<__config.months*60;i++){
      const prev=Math.floor(G.day/30);G.day+=.5;
      dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
      if(Math.floor(G.day/30)>prev){monthTick();result.months++;monthlySample();}
      for(const f of G.fleets){
        if(!Number.isFinite(f.x)||!Number.isFinite(f.y))issue('fleetFinite',{id:f.id});
        if(!G.emps[f.e]||f.sys>=0&&!G.sys[f.sys]||(f.path||[]).some(id=>!G.sys[id]))issue('fleetRef',{id:f.id});
      }
      for(const s of G.sys){const r=s.battleReport;
        if(r&&r.last&&r.last.ready.some((n,j)=>n>r.last.ships[j]))issue('reportCount',{sys:s.id,last:r.last});}
      result.steps++;if(G.over){result.stopped={win:G.over.win,txt:G.over.txt};break;}
    }}catch(e){result.error=String(e.stack||e);}
    result.contacts=contacts();result.elapsedDays=G.day-firstDay;
    result.calendarMonths=G.year*12+G.month-firstMonth;result.rng=RND_STATE;
    result.situations=(G.sits||[]).length;
    JSON.stringify(result);
  `));
  result.saveSHA256=createHash('sha256').update(h.run('serialize()')).digest('hex');
  result.ms=Date.now()-started;
  return result;
}
module.exports={integratedCampaign,observeCampaign};
