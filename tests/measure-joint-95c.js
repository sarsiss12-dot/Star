'use strict';
const {runtime}=require('./helpers/runtime'),fs=require('fs'),path=require('path'),crypto=require('crypto');
function observer(){
 const joint={created:[],arrivals:[],routeCalls:0,routeMs:0};
 const fedStats={created:[],removed:[],members:[],votes:[],warJoins:[]};let oldFeds=new Map();
 const rows={},monthly=[],negative=[],graph={calls:0,ms:0};let prev=new Map();
 const normal=e=>e&&!e.wild&&!e.crisisSide;
 const row=e=>rows[e.id]||(rows[e.id]={id:e.id,name:e.name,ai:e.ai,doctrine:researchDoctrine(e),race:e.race,ethics:e.ethics,orders:{},losses:{},operations:{},operationCost:0,negotiations:0,accepted:0,negotiationOutcomes:{},warDeclarations:0,peaces:0,factionEvents:{},idleDays:0,shipDays:0,wait:{},yardSlots:0,busySlots:0,productionBlocks:{},exploreConflicts:0,structStarts:0,structCompleted:{},councilFounding:0,lowIntelPowerQueries:0,informationReadSites:{},opAttempts:0,opResolved:0,opSuccess:0,opHostileFriendly:0,opSpent:0,opFriendlyTypes:{},opOutcomes:{},opBenefit:{techs:0,fleetPlans:0,routePlans:0,deception:0}});
 const bump=(o,k,n=1)=>o[k]=(o[k]||0)+n;
 for(const e of G.emps)if(normal(e))row(e);
 function wrap(name,fn){const old=globalThis[name];if(typeof old!=='function')return;globalThis[name]=function(...args){return fn(()=>old.apply(this,args),args);};}
 wrap('queueShip',(call,[e,s,cls])=>{const result=call();if(normal(e)&&result)bump(row(e).orders,cls);return result;});
 for(const name of ['runOp','stealTech','inciteRebellion'])wrap(name,(call,[e,o,key])=>{const cost=e.res.etk,res=call();if(normal(e)&&res&&res.ok){bump(row(e).operations,key||name);row(e).operationCost+=Math.max(0,cost-e.res.etk);}return res;});
 wrap('aiNegotiate',(call,[e])=>{if(normal(e))row(e).negotiations++;const r=call();if(normal(e)&&r)bump(row(e).negotiationOutcomes,r.karar||"none");if(r&&r.uygulandi&&normal(e))row(e).accepted++;return r;});
 wrap('fedResolveVote',(call,[f])=>{const token=f.vote&&String(f.vote.id||('legacy:'+f.vote.law)),result=call();if(result&&result.ok&&!result.pending&&f.lastVote&&String(f.lastVote.id)===token)fedStats.votes.push({day:G.day,fed:f.id,...JSON.parse(JSON.stringify(f.lastVote))});return result;});
 wrap('declareWar',(call,[e,o,support])=>{const r=call();if(r&&normal(e)){row(e).warDeclarations++;if(support&&support.kind==='federation')fedStats.warJoins.push({day:G.day,actor:e.id,target:o.id,support});}return r;});
 wrap('makePeace',(call,[a,b])=>{const r=call();if(r){if(normal(a))row(a).peaces++;if(normal(b))row(b).peaces++;}return r;});
 wrap('facEvent',(call,[e,kind])=>{if(normal(e))bump(row(e).factionEvents,kind);return call();});
 wrap('explorationGraph',call=>{const start=Date.now();const r=call();graph.calls++;graph.ms+=Date.now()-start;return r;});
 function sample(dt){const now=new Map(),taken=new Set();
  for(const f of G.fleets){const e=G.emps[f.e];if(!normal(e))continue;const r=row(e);
   for(const sh of f.ships)now.set(sh,{e:f.e,c:sh.c});
   if(fleetHasRole(f,'bilim')){r.shipDays+=dt;if(!f.mv&&!f.path.length&&!f.surv&&!f.combat){r.idleDays+=dt;bump(r.wait,f.explore?f.explore.status:'idle',dt);}
    const target=f.explore&&f.explore.target;if(Number.isInteger(target)&&!G.sys[target].surv.includes(e.id)){const key=e.id+':'+target;if(taken.has(key))r.exploreConflicts++;taken.add(key);}}
  }
  for(const [sh,old]of prev)if(!now.has(sh))bump(rows[old.e].losses,old.c);prev=now;
  for(const s of G.sys){const e=G.emps[s.owner];if(normal(e)){row(e).yardSlots+=yardCount(s)*dt;row(e).busySlots+=Math.min(yardCount(s),activeShipQueue(s).length)*dt;}}
 }
 function month(){
 const current=new Map();for(const f of G.feds||[]){const prev=oldFeds.get(f.id);const info={id:f.id,name:f.name,type:f.type||'legacy',members:f.members.slice(),leader:f.leader,laws:Object.keys(f.laws||{}),fund:f.fund,treasury:f.treasury,cohesion:fedCohesion(f),vote:f.vote,lastVote:f.lastVote,reform:f.reform};current.set(f.id,JSON.parse(JSON.stringify(info)));if(!prev)fedStats.created.push({day:G.day,...JSON.parse(JSON.stringify(info))});else if(JSON.stringify(prev.members)!==JSON.stringify(info.members))fedStats.members.push({day:G.day,id:f.id,before:prev.members,after:info.members});}for(const [id,info] of oldFeds)if(!current.has(id))fedStats.removed.push({day:G.day,...info});oldFeds=current;
 const snap=[];for(const e of G.emps)if(normal(e)){
  const r=row(e);for(const k of e.aiShipPlan?.reasons||[])bump(r.productionBlocks,k);
  for(const[k,v]of Object.entries(e.res))if(!Number.isFinite(v)||v<-.00001)negative.push({month:G.memAge,id:e.id,k,v});
  const counts={};for(const f of G.fleets)if(f.e===e.id)for(const sh of f.ships)bump(counts,sh.c);
  snap.push({id:e.id,dead:!!e.dead,res:{...e.res},inc:{...e.inc},colonies:e.colonies.length,power:totalPower(e),ships:counts,usage:fleetUsage(e),cap:e.cap,
   techs:Object.keys(e.techs).filter(k=>e.techs[k]),discovered:G.sys.filter(s=>s.surv.includes(e.id)).length,
   wars:Object.keys(e.war).filter(k=>e.war[k]&&!G.emps[k]?.wild),pacts:Object.keys(e.pact||{}).filter(k=>e.pact[k]),allies:Object.keys(e.ally||{}).filter(k=>e.ally[k]),factions:e.factions?e.factions.map(f=>({k:f.k,mood:f.mood,pow:f.pow})):[],factionMods:facMods(e),strategy:e.aiStrategy||null,campaign:e.aiCampaign||null,spySlots:spiesUsed(e),scienceTargets:{...e.curTech},buildJobs:G.sys.reduce((n,s)=>n+(s.work||[]).filter(w=>w.e===e.id).length,0)});
 }monthly.push(snap);}
 let actor=null,site=null;
 for(const name of ['aiTurn','warAppetite','aiPickOp','aiProposeTo','aiProposeTerms','aiEnvoyTask','aiStructTarget','aiSeekProtection','aiFederationPolitics','aiFedVoteWant','aiFedWilling','canFoundFed'])wrap(name,(call,args)=>{
  const old=actor,oldSite=site;actor=args[0];site=name;try{return call();}finally{actor=old;site=oldSite;}
 });
 wrap('totalPower',(call,[target])=>{if(actor&&normal(actor)&&actor.ai&&target&&target!==actor&&intelOf(actor,target.id)<3&&!(actor.fleetIntel&&actor.fleetIntel[target.id]>G.day)){row(actor).lowIntelPowerQueries++;bump(row(actor).informationReadSites,site);if(!row(actor).powerQueryExamples)row(actor).powerQueryExamples=[];if(row(actor).powerQueryExamples.length<4)row(actor).powerQueryExamples.push(new Error('foreign power diagnostic').stack.split('\n').slice(2,9));}return call();});
 wrap('startStruct',(call,[e])=>{const result=call();if(result&&normal(e))row(e).structStarts++;return result;});
 wrap('structTick',call=>{const jobs=[];for(const s of G.sys)for(const w of s.work||[])jobs.push({s,w});const result=call();for(const {s,w}of jobs)if(!(s.work||[]).includes(w)&&s.built&&s.built[w.key]!==undefined&&normal(G.emps[w.e]))bump(row(G.emps[w.e]).structCompleted,w.key);return result;});
 wrap('foundCouncil',(call,[e])=>{const result=call();if(result&&result.ok&&normal(e))row(e).councilFounding++;return result;});
 let opDepth=0;
 for(const name of ['runOp','stealTech','inciteRebellion','falseFlagOp','runWhisper'])wrap(name,(call,[e,o,key])=>{
  if(!normal(e)||!e.ai||opDepth)return call();
  const r=row(e),before=e.res.etk,friendly=o&&(e.ally[o.id]||(e.rel[o.id]||0)>35),hostile=!['filoPlan','kervan','sorusturma','ambargoKir','calTech','yalan'].includes(key);
  const techBefore=Object.keys(e.techs||{}).length,plansBefore=JSON.stringify(e.fleetIntel||{}),routesBefore=JSON.stringify(e.routeIntel||{}),fakeBefore=JSON.stringify(e.fakeTo||{});
  r.opAttempts++;opDepth++;let result;try{result=call();}finally{opDepth--;}
  const spent=Math.max(0,before-e.res.etk);r.opSpent+=spent;
  if(spent>0){r.opResolved++;if(friendly&&hostile){r.opHostileFriendly++;bump(r.opFriendlyTypes,key||name);}}
  if(result){bump(r.opOutcomes,result.outcome||(name==='runOp'&&result.ok?'effect-applied':result.ok?'resolved':'not-resolved'));if(name==='runOp'&&result.ok||result.basarili===true||result.success===true||result.basari===true)r.opSuccess++;}
  r.opBenefit.techs+=Math.max(0,Object.keys(e.techs||{}).length-techBefore);
  if(JSON.stringify(e.fleetIntel||{})!==plansBefore)r.opBenefit.fleetPlans++;if(JSON.stringify(e.routeIntel||{})!==routesBefore)r.opBenefit.routePlans++;if(JSON.stringify(e.fakeTo||{})!==fakeBefore)r.opBenefit.deception++;
  return result;
 });
 wrap('jointCreate',(call,args)=>{const r=call();if(r?.ok)joint.created.push(JSON.parse(JSON.stringify(r.plan)));return r;});
 wrap('aiKnownRoute',call=>{const t=Date.now(),r=call();joint.routeCalls++;joint.routeMs+=Date.now()-t;return r;});
 wrap('arrive',(call,[f,s])=>{if(f.jointPlan!==undefined)joint.arrivals.push({day:G.day,fleet:f.id,owner:f.e,sys:s.id,plan:f.jointPlan});return call();});
 sample(0);return {sample,month,finish(){return {joint,fedStats,finalFeds:[...oldFeds.values()],empires:Object.values(rows),monthly,negative,graph,warLedger:G.warLedger||null,settlements:G.settlements||null};}};
}
function campaign(root,seed=11,months=120,options={}){
 const h=runtime({root});h.sb.cfg={seed,months,...options};
 h.run(`setupGame({name:'95C comparable coordination audit',race:'insan',traits:[],size:cfg.size||'orta',shape:'sarmal',diff:'normal',seed:cfg.seed,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:cfg.council||'normal'});G.autoSave=false;economyTick(true);
 if(cfg.pirates===false){G.cfg.pirates=false;G.nests=[];for(const s of G.sys)delete s.nest;G.fleets=G.fleets.filter(f=>!G.emps[f.e].wild);}
 if(cfg.poor)for(const e of G.emps)if(e.ai&&!e.wild)for(const k in e.res)e.res[k]=Math.min(e.res[k],25);
 var audit=cfg.observe===false?{sample(){},month(){},finish(){return {}}}:(${observer.toString()})();`);
 const start=Date.now();h.run(`var elapsed=0;for(let i=0;i<cfg.months*60;i++){const old=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();audit.sample(.5);if(Math.floor(G.day/30)>old){monthTick();elapsed++;audit.month();if(cfg.reloadAt===elapsed)deserialize(serialize());if(elapsed%30===0&&cfg.progress)console.log('MONTH '+elapsed);}if(G.over)break;}`);
 if(options.capture)fs.writeFileSync(options.capture,h.run("serialize()"));
 return {sourceSha:Object.fromEntries(['main.js','ai.js','diplomacy.js','economy.js','ui.js','sw.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),seed,months:h.run('elapsed'),requestedMonths:months,options,stopped:h.run('!!G.over'),ms:Date.now()-start,rng:h.run('RND_STATE'),saveHash:crypto.createHash('sha256').update(h.run('serialize()')).digest('hex'),...JSON.parse(h.run('JSON.stringify(audit.finish())'))};
}
module.exports={campaign};
if(require.main===module){const r=campaign(path.resolve(process.argv[2]),+process.argv[3],+(process.argv[5]||120),JSON.parse(process.argv[6]||'{}'));fs.writeFileSync(process.argv[4],JSON.stringify(r,null,2));console.log(JSON.stringify({root:process.argv[2],seed:r.seed,months:r.months,ms:r.ms,negative:r.negative.length,graph:r.graph}));}
